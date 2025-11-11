import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type AlertType = 'info' | 'warning' | 'error';

interface LiveStatAlert {
  id: string;
  type: AlertType;
  message: string;
  timestamp: string;
}

interface RecentActivityItem {
  id: string;
  type: 'booking';
  description: string;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

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
          status: 'CONFIRMED',
          driverId: { not: null }, // Active = confirmed with assigned driver
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

    const [activeDrivers, totalDrivers] = await Promise.all([
      prisma.driver.count({
        where: {
          status: 'active',
        },
      }),
      prisma.driver.count(),
    ]);

    const driversWithBookings = await prisma.booking.groupBy({
      by: ['driverId'],
      where: {
        driverId: { not: null },
        status: 'CONFIRMED',
      },
    });

    const utilizationRate = activeDrivers > 0 ? (driversWithBookings.length / activeDrivers) * 100 : 0;

    const todayCompletedBookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        totalGBP: true,
      },
    });

    const todayRevenuePence = todayCompletedBookings.reduce<number>(
      (sum, booking) => sum + (booking.totalGBP ?? 0),
      0
    );
    const todayRevenue = todayRevenuePence / 100;

    const alerts: LiveStatAlert[] = [];

    if (pendingBookings > 5) {
      alerts.push({
        id: 'pending-bookings',
        type: 'warning',
        message: `${pendingBookings} bookings are pending driver assignment`,
        timestamp: new Date().toISOString(),
      });
    }

    if (utilizationRate < 30) {
      alerts.push({
        id: 'low-utilization',
        type: 'info',
        message: `Driver utilization is low at ${utilizationRate.toFixed(0)}%`,
        timestamp: new Date().toISOString(),
      });
    }

    if (activeDrivers < 5) {
      alerts.push({
        id: 'low-drivers',
        type: 'error',
        message: `Only ${activeDrivers} drivers are currently active`,
        timestamp: new Date().toISOString(),
      });
    }

    const recentBookings = await prisma.booking.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
        pickupAddress: {
          select: {
            label: true,
            postcode: true,
          },
        },
      },
    });

    const recentActivity: RecentActivityItem[] = recentBookings.map((booking) => ({
      id: booking.id,
      type: 'booking',
      description: `New booking from ${booking.customer?.name ?? 'Unknown'} - ${
        booking.pickupAddress?.label ?? 'Pickup address pending'
      }`,
      timestamp: booking.createdAt.toISOString(),
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
