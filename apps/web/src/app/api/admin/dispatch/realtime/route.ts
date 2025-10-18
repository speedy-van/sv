import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { upsertAssignment } from '@/lib/utils/assignment-helpers';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get real-time data for dispatch
    const [activeJobs, availableDrivers, openIncidents, driverLocations] =
      await Promise.all([
        // Active jobs with recent updates (exclude test bookings)
        prisma.booking.findMany({
          where: {
            status: {
              in: ['DRAFT', 'CONFIRMED'],
            },
            updatedAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
            },
            NOT: [
              { reference: { startsWith: 'test_' } },
              { reference: { startsWith: 'TEST_' } },
              { reference: { startsWith: 'demo_' } },
            ],
          },
          include: {
            driver: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    isActive: true
                  }
                },
                DriverAvailability: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
        }),

        // Available drivers with current status
        prisma.driver.findMany({
          where: {
            status: 'active',
            onboardingStatus: 'approved',
            DriverAvailability: {
              status: 'online',
            },
          },
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                isActive: true
              }
            },
            DriverAvailability: true,
            DriverVehicle: true,
            Booking: {
              where: {
                status: {
                  in: ['CONFIRMED'],
                },
              },
            },
          },
        }),

        // Open incidents
        prisma.driverIncident.findMany({
          where: {
            status: 'reported',
          },
          include: {
            Driver: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    isActive: true
                  }
                },
              },
            },
            Assignment: {
              include: {
                Booking: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        }),

        // Recent driver location updates
        prisma.trackingPing.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 10 * 60 * 1000), // Last 10 minutes
            },
          },
          include: {
            Driver: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    isActive: true
                  }
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ]);

    // Process driver locations
    const processedLocations = driverLocations.reduce(
      (acc, ping) => {
        if (!acc[ping.driverId]) {
          acc[ping.driverId] = {
            driverId: ping.driverId,
            driverName: ping.Driver.User.name,
            lat: ping.lat,
            lng: ping.lng,
            lastUpdate: ping.createdAt,
            status: 'offline',
          };
        }
        return acc;
      },
      {} as Record<string, any>
    );

    return NextResponse.json({
      success: true,
      data: {
        activeJobs,
        availableDrivers,
        openIncidents,
        driverLocations: Object.values(processedLocations),
        lastUpdate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Real-time dispatch data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await request.json();

    switch (action) {
      case 'update_job_status':
        const { jobId, status, reason } = data;

        const updatedJob = await prisma.booking.update({
          where: { id: jobId },
          data: {
            status,
            updatedAt: new Date(),
          },
          include: {
            driver: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    isActive: true
                  }
                },
              },
            },
          },
        });

        // Log the status change
        await prisma.auditLog.create({
          data: {
            actorId: (session.user as any).id,
            actorRole: (session.user as any).role || 'admin',
            action: 'job_status_updated',
            targetType: 'booking',
            targetId: jobId,
            before: undefined,
            after: {
              status,
              reason: reason || 'Manual update',
            },
            ip: request.headers.get('x-forwarded-for') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
          },
        });

        return NextResponse.json({
          success: true,
          data: updatedJob,
        });

      case 'assign_job':
        const { jobId: assignJobId, driverId } = data;

        // Check if job is already assigned
        const existingJob = await prisma.booking.findUnique({
          where: { id: assignJobId },
        });

        if (existingJob?.driverId) {
          return NextResponse.json(
            {
              error: 'Job is already assigned',
            },
            { status: 400 }
          );
        }

        const assignedJob = await prisma.booking.update({
          where: { id: assignJobId },
          data: {
            driverId,
            status: 'CONFIRMED',
            updatedAt: new Date(),
          },
          include: {
            driver: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    isActive: true
                  }
                },
              },
            },
          },
        });

        // Create or update assignment record
        await upsertAssignment(prisma, assignJobId, {
          driverId,
          status: 'invited',
        });

        return NextResponse.json({
          success: true,
          data: assignedJob,
        });

      case 'create_incident':
        const {
          category,
          description,
          severity,
          driverId: incidentDriverId,
          jobId: incidentJobId,
        } = data;

        const incident = await prisma.driverIncident.create({
          data: {
            id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            driverId: incidentDriverId || 'unknown',
            assignmentId: incidentJobId
              ? await getAssignmentId(incidentJobId)
              : null,
            type: category as any, // Cast to IncidentType enum
            title: category,
            description,
            severity: severity as any, // Cast to IncidentSeverity enum
            status: 'reported',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          include: {
            Driver: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    isActive: true
                  }
                },
              },
            },
            Assignment: {
              include: {
                Booking: true,
              },
            },
          },
        });

        return NextResponse.json({
          success: true,
          data: incident,
        });

      default:
        return NextResponse.json(
          {
            error: 'Invalid action',
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Real-time dispatch action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getAssignmentId(jobId: string): Promise<string | null> {
  try {
    const assignment = await prisma.assignment.findFirst({
      where: { bookingId: jobId },
      orderBy: { createdAt: 'desc' }
    });
    return assignment?.id || null;
  } catch {
    return null;
  }
}
