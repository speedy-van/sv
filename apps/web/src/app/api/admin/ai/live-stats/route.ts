import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch bookings
    const [totalBookings, pendingBookings, activeBookings, completedToday] = await Promise.all([
      prisma.booking.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.booking.count({
        where: {
          status: 'CONFIRMED',
          driverId: null,
        },
      }),
      prisma.booking.count({
        where: {
          status: 'IN_PROGRESS',
        },
      }),
      prisma.booking.count({
        where: {
          status: 'COMPLETED',
          updatedAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ]);

    // Fetch drivers
    const [activeDrivers, totalDrivers] = await Promise.all([
      prisma.driver.count({
        where: {
          status: 'ACTIVE',
        },
      }),
      prisma.driver.count(),
    ]);

    // Calculate utilization rate
    const driversWithBookings = await prisma.booking.groupBy({
      by: ['driverId'],
      where: {
        driverId: { not: null },
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
      },
    });

    const utilizationRate = activeDrivers > 0 ? (driversWithBookings.length / activeDrivers) * 100 : 0;

    // Calculate today's revenue
    const todayBookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        totalPrice: true,
      },
    });

    const todayRevenue = todayBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);

    // Generate alerts
    const alerts = [];

    if (pendingBookings > 5) {
      alerts.push({
        id: 'pending-bookings',
        type: 'warning',
        message: `${pendingBookings} bookings are pending driver assignment`,
        timestamp: new Date(),
      });
    }

    if (utilizationRate < 30) {
      alerts.push({
        id: 'low-utilization',
        type: 'info',
        message: `Driver utilization is low at ${utilizationRate.toFixed(0)}%`,
        timestamp: new Date(),
      });
    }

    if (activeDrivers < 5) {
      alerts.push({
        id: 'low-drivers',
        type: 'error',
        message: `Only ${activeDrivers} drivers are currently active`,
        timestamp: new Date(),
      });
    }

    // Get recent activity
    const recentBookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        customer: true,
        driver: true,
      },
    });

    const recentActivity = recentBookings.map((booking) => ({
      id: booking.id,
      type: 'booking',
      description: `New booking from ${booking.customer?.name || 'Unknown'} - ${booking.pickupAddress}`,
      timestamp: booking.createdAt,
    }));

    return NextResponse.json({
      totalBookings,
      pendingBookings,
      activeBookings,
      completedToday,
      activeDrivers,
      totalDrivers,
      todayRevenue,
      utilizationRate,
      alerts,
      recentActivity,
    });
  } catch (error) {
    console.error('Live stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
