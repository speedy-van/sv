import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPrisma } from '@/lib/prisma';

export const GET = withPrisma(async (
  request: NextRequest,
  { params }: { params: { id: string } },
  prisma
) => {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: driverId } = params;
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    // Get driver info
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: {
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
        status: 'COMPLETED',
        ...(startDate && { completedAt: { gte: startDate } }),
      },
      include: {
        drops: {
          include: {
            booking: {
              select: {
                totalPrice: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
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

    const commissionRate = driver.commissionRate || 0.15; // Default 15%

    // Process earnings
    const earnings: any[] = [];
    let totalEarnings = 0;
    let totalCommission = 0;

    // Process routes
    routes.forEach((route) => {
      const amount = route.drops.reduce(
        (sum, drop) => sum + (drop.booking.totalPrice || 0),
        0
      );
      const commission = amount * commissionRate;
      const netEarning = amount - commission;

      totalEarnings += amount;
      totalCommission += commission;

      earnings.push({
        id: route.id,
        type: 'route',
        reference: route.routeNumber,
        date: route.completedAt || route.createdAt,
        amount,
        commission,
        netEarning,
        status: 'COMPLETED',
      });
    });

    // Process bookings
    bookings.forEach((booking) => {
      const amount = booking.totalPrice;
      const commission = amount * commissionRate;
      const netEarning = amount - commission;

      totalEarnings += amount;
      totalCommission += commission;

      earnings.push({
        id: booking.id,
        type: 'booking',
        reference: booking.bookingReference,
        date: booking.updatedAt,
        amount,
        commission,
        netEarning,
        status: 'COMPLETED',
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
});

