import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface DriverJob {
  id: string;
  reference: string;
  scheduledAt: string;
  status: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  items: any[];
  totalValue: number;
  duration: number;
  priority: string;
  type: string;
}

interface DeclinedJob {
  id: string;
  reference: string;
  scheduledAt: string;
  declinedAt: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  items: any[];
  totalValue: number;
  duration: number;
  priority: string;
  reason: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const selectedDate = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const selectedDriver = searchParams.get('driver') || 'all';

    // Parse the selected date
    const dateFilter = new Date(selectedDate);
    const startOfDay = new Date(dateFilter);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateFilter);
    endOfDay.setHours(23, 59, 59, 999);

    // Build where clause for driver filter
    const driverWhere = selectedDriver !== 'all'
      ? { driverId: selectedDriver }
      : {};

    // Get all assignments for the selected date with driver information
    const assignments = await prisma.assignment.findMany({
      where: {
        Booking: {
          scheduledAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        ...(selectedDriver !== 'all' && { driverId: selectedDriver }),
      },
      include: {
        Driver: {
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        Booking: {
          select: {
            id: true,
            reference: true,
            scheduledAt: true,
            status: true,
            customerName: true,
            customerPhone: true,
            pickupAddress: {
              select: {
                label: true,
              },
            },
            dropoffAddress: {
              select: {
                label: true,
              },
            },
            BookingItem: {
              select: {
                name: true,
                quantity: true,
              },
            },
            totalGBP: true,
            estimatedDurationMinutes: true,
            urgency: true,
          },
        },
      },
    });

    // Get declined assignments for the selected date
    const declinedAssignments = await prisma.assignment.findMany({
      where: {
        status: 'declined',
        Booking: {
          scheduledAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        ...(selectedDriver !== 'all' && { driverId: selectedDriver }),
      },
      include: {
        Driver: {
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        Booking: {
          select: {
            id: true,
            reference: true,
            scheduledAt: true,
            customerName: true,
            customerPhone: true,
            pickupAddress: {
              select: {
                label: true,
              },
            },
            dropoffAddress: {
              select: {
                label: true,
              },
            },
            BookingItem: {
              select: {
                name: true,
                quantity: true,
              },
            },
            totalGBP: true,
            estimatedDurationMinutes: true,
            urgency: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate acceptance rates for each driver
    const driverStats = new Map();

    // Process accepted assignments
    assignments.forEach(assignment => {
      const driverId = assignment.driverId;
      if (!driverStats.has(driverId)) {
        driverStats.set(driverId, {
          driverId,
          driverName: assignment.Driver?.User?.name || 'Driver',
          driverEmail: assignment.Driver?.User?.email || '',
          totalAssignments: 0,
          acceptedAssignments: 0,
          declinedAssignments: 0,
        });
      }
      const stats = driverStats.get(driverId);
      stats.totalAssignments++;
      stats.acceptedAssignments++;
    });

    // Process declined assignments
    declinedAssignments.forEach(assignment => {
      const driverId = assignment.driverId;
      if (!driverStats.has(driverId)) {
        driverStats.set(driverId, {
          driverId,
          driverName: assignment.Driver?.User?.name || 'Driver',
          driverEmail: assignment.Driver?.User?.email || '',
          totalAssignments: 0,
          acceptedAssignments: 0,
          declinedAssignments: 0,
        });
      }
      const stats = driverStats.get(driverId);
      stats.totalAssignments++;
      stats.declinedAssignments++;
    });

    // Group assignments by driver
    const driverMap = new Map();

    assignments.forEach(assignment => {
      const driverId = assignment.driverId;
      if (!driverMap.has(driverId)) {
        const stats = driverStats.get(driverId) || {
          driverId,
          driverName: assignment.Driver?.User?.name || 'Driver',
          driverEmail: assignment.Driver?.User?.email || '',
          totalAssignments: 0,
          acceptedAssignments: 0,
          declinedAssignments: 0,
        };

        driverMap.set(driverId, {
          driverId,
          driverName: stats.driverName,
          driverEmail: stats.driverEmail,
          jobs: [] as DriverJob[],
          declinedJobs: [] as DeclinedJob[],
          totalAssignments: stats.totalAssignments,
          acceptedAssignments: stats.acceptedAssignments,
          declinedAssignments: stats.declinedAssignments,
          acceptanceRate: stats.totalAssignments > 0 ? (stats.acceptedAssignments / stats.totalAssignments) * 100 : 100,
        });
      }

      const driver = driverMap.get(driverId);
      driver.jobs.push({
        id: assignment.bookingId,
        reference: assignment.Booking.reference,
        scheduledAt: assignment.Booking.scheduledAt.toISOString(),
        status: assignment.status.toLowerCase(),
        customerName: assignment.Booking.customerName || 'Customer',
        customerPhone: assignment.Booking.customerPhone || '',
        pickupAddress: assignment.Booking.pickupAddress?.label || 'Pickup Location',
        dropoffAddress: assignment.Booking.dropoffAddress?.label || 'Dropoff Location',
        items: assignment.Booking.BookingItem || [],
        totalValue: assignment.Booking.totalGBP || 0,
        duration: assignment.Booking.estimatedDurationMinutes || 60,
        priority: assignment.Booking.urgency || 'medium',
        type: 'single-drop' as const, // For now, assume single-drop
      });
    });

    // Add declined jobs to drivers
    declinedAssignments.forEach(assignment => {
      const driverId = assignment.driverId;
      if (driverMap.has(driverId)) {
        const driver = driverMap.get(driverId);
        driver.declinedJobs.push({
          id: assignment.bookingId,
          reference: assignment.Booking.reference,
          scheduledAt: assignment.Booking.scheduledAt.toISOString(),
          declinedAt: assignment.createdAt.toISOString(),
          customerName: assignment.Booking.customerName || 'Customer',
          customerPhone: assignment.Booking.customerPhone || '',
          pickupAddress: assignment.Booking.pickupAddress?.label || 'Pickup Location',
          dropoffAddress: assignment.Booking.dropoffAddress?.label || 'Dropoff Location',
          items: assignment.Booking.BookingItem || [],
          totalValue: assignment.Booking.totalGBP || 0,
          duration: assignment.Booking.estimatedDurationMinutes || 60,
          priority: assignment.Booking.urgency || 'medium',
          reason: 'No reason provided', // TODO: Add declinedReason to Assignment model
        });
      }
    });

    // Transform to final format
    const driverSchedules = Array.from(driverMap.values()).map(driver => {
      const completedJobs = driver.jobs.filter((job: DriverJob) => job.status === 'completed').length;
      const upcomingJobs = driver.jobs.filter((job: DriverJob) => job.status === 'confirmed' || job.status === 'in_progress').length;
      const todaysJobs = driver.jobs.length;

      return {
        ...driver,
        totalJobs: todaysJobs,
        completedJobs,
        upcomingJobs,
        todaysJobs,
        jobs: driver.jobs.sort((a: DriverJob, b: DriverJob) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
        declinedJobs: driver.declinedJobs.sort((a: DeclinedJob, b: DeclinedJob) => new Date(b.declinedAt).getTime() - new Date(a.declinedAt).getTime()),
      };
    });

    return NextResponse.json({
      success: true,
      data: driverSchedules,
    });

  } catch (error) {
    console.error('Admin driver schedule error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
