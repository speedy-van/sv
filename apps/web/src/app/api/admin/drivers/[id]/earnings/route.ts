import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: driverId } = await params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    // Get driver info
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date | undefined;

    if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get completed routes
    const routes = await prisma.route.findMany({
      where: {
        driverId,
        status: 'completed',
        ...(startDate && { updatedAt: { gte: startDate } }),
      },
      include: {
        drops: {
          include: {
            Booking: {
              select: {
                totalGBP: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Get completed single bookings
    const bookings = await prisma.booking.findMany({
      where: {
        driverId,
        status: 'COMPLETED',
        routeId: null,
        ...(startDate && { updatedAt: { gte: startDate } }),
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const commissionRate = 0.15; // Default 15% commission rate

    // Process earnings
    const earnings: any[] = [];
    let totalEarnings = 0;
    let totalCommission = 0;

    // Process routes
    routes.forEach((route) => {
      const amount = route.drops.reduce(
        (sum: number, drop: any) => sum + (drop.Booking?.totalGBP ? drop.Booking.totalGBP / 100 : 0),
        0
      );
      const commission = amount * commissionRate;
      const netEarning = amount - commission;

      totalEarnings += amount;
      totalCommission += commission;

      earnings.push({
        id: route.id,
        type: 'route',
        reference: route.id,
        date: route.updatedAt,
        amount,
        commission,
        netEarning,
        status: route.status,
      });
    });

    // Process bookings
    bookings.forEach((booking) => {
      const amount = booking.totalGBP / 100; // Convert pence to pounds
      const commission = amount * commissionRate;
      const netEarning = amount - commission;

      totalEarnings += amount;
      totalCommission += commission;

      earnings.push({
        id: booking.id,
        type: 'booking',
        reference: booking.reference,
        date: booking.updatedAt,
        amount,
        commission,
        netEarning,
        status: booking.status,
      });
    });

    // Sort earnings by date
    earnings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate this week and this month
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(now);
    monthStart.setMonth(monthStart.getMonth() - 1);

    const thisWeekEarnings = earnings.filter(
      (e) => new Date(e.date) >= weekStart
    );
    const thisMonthEarnings = earnings.filter(
      (e) => new Date(e.date) >= monthStart
    );

    const thisWeek = {
      earnings: thisWeekEarnings.reduce((sum, e) => sum + e.netEarning, 0),
      jobs: thisWeekEarnings.length,
    };

    const thisMonth = {
      earnings: thisMonthEarnings.reduce((sum, e) => sum + e.netEarning, 0),
      jobs: thisMonthEarnings.length,
    };

    return NextResponse.json({
      driver: {
        ...driver,
        commissionRate,
      },
      summary: {
        totalEarnings,
        totalCommission,
        netEarnings: totalEarnings - totalCommission,
        completedJobs: earnings.length,
        averagePerJob: earnings.length > 0 ? (totalEarnings - totalCommission) / earnings.length : 0,
      },
      thisWeek,
      thisMonth,
      earnings,
    });
  } catch (error) {
    console.error('Error fetching driver earnings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

