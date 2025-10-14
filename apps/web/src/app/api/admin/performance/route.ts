import { NextResponse, NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get('driverId');
    const type = searchParams.get('type'); // "ratings" | "incidents" | "performance"

    if (driverId) {
      // Get specific driver data
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
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
          DriverPerformance: true,
          DriverRating: {
            where: { status: 'active' },
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          DriverIncident: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
          Assignment: {
            include: {
              Booking: {
                select: {
                  reference: true,
                  pickupAddress: true,
                  dropoffAddress: true,
                  scheduledAt: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!driver) {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        driver: {
          id: driver.id,
          name: driver.User?.name || '',
          email: driver.User?.email || '',
          status: driver.status,
          onboardingStatus: driver.onboardingStatus,
        },
        performance: driver.DriverPerformance,
        ratings: driver.DriverRating,
        incidents: driver.DriverIncident,
        Assignment: driver.Assignment,
      });
    }

    // Get all drivers with performance data
    const drivers = await prisma.driver.findMany({
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
        DriverPerformance: true,
        _count: {
          select: {
            DriverRating: {
              where: { status: 'active' },
            },
            DriverIncident: true,
            Assignment: {
              where: { status: 'completed' },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      },
    });

    return NextResponse.json({
      drivers: drivers.map(driver => ({
        id: driver.id,
        name: driver.User?.name || '',
        email: driver.User?.email || '',
        status: driver.status,
        onboardingStatus: driver.onboardingStatus,
        performance: driver.DriverPerformance,
        stats: {
          totalRatings: (driver._count as any).DriverRating,
          totalIncidents: (driver._count as any).DriverIncident,
          completedJobs: driver._count.Assignment,
        },
      })),
    });
  } catch (error) {
    console.error('Admin performance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

  try {
    const body = await request.json();
    const { action, targetId, data } = body;

    switch (action) {
      case 'update_rating_status':
        const { ratingId, status, moderationNotes } = data;
        const updatedRating = await prisma.driverRating.update({
          where: { id: ratingId },
          data: {
            status,
            moderationNotes,
            moderatedAt: new Date(),
            moderatedBy: user.id,
          },
        });

        // Log audit event
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            actorRole: 'admin',
            action: 'rating_moderated',
            targetType: 'DriverRating',
            targetId: ratingId,
            after: { status, moderationNotes },
          },
        });

        return NextResponse.json({ rating: updatedRating });

      case 'update_incident_status':
        const {
          incidentId,
          status: incidentStatus,
          reviewNotes,
          resolution,
        } = data;
        const updatedIncident = await prisma.driverIncident.update({
          where: { id: incidentId },
          data: {
            status: incidentStatus,
            reviewNotes,
            resolution,
            reviewedAt: new Date(),
            reviewedBy: user.id,
          },
        });

        // Log audit event
        await prisma.auditLog.create({
          data: {
            actorId: user.id,
            actorRole: 'admin',
            action: 'incident_reviewed',
            targetType: 'DriverIncident',
            targetId: incidentId,
            after: { status: incidentStatus, reviewNotes, resolution },
          },
        });

        return NextResponse.json({ incident: updatedIncident });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin performance PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
