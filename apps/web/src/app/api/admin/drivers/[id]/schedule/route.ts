import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: driverId } = params;

    // Get driver info
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        User: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Get routes
    const routes = await prisma.route.findMany({
      where: {
        driverId,
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
        createdAt: 'desc',
      },
    });

    // Get single bookings
    const bookings = await prisma.booking.findMany({
      where: {
        driverId,
        routeId: null, // Only single jobs (not part of a route)
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    });

    // Categorize routes
    const today: any[] = [];
    const upcoming: any[] = [];
    const completed: any[] = [];

    routes.forEach((route) => {
      const totalValue = route.drops.reduce(
        (sum: number, drop: any) => sum + (drop.Booking?.totalGBP ? drop.Booking.totalGBP / 100 : 0),
        0
      );

      const item = {
        id: route.id,
        type: 'route',
        reference: route.id,
        status: route.status,
        startTime: route.createdAt,
        endTime: route.endTime,
        drops: route.drops.length,
        value: totalValue,
      };

      if (route.status === 'completed') {
        completed.push(item);
      } else if (route.createdAt >= todayStart && route.createdAt < todayEnd) {
        today.push(item);
      } else if (route.createdAt >= todayEnd) {
        upcoming.push(item);
      } else {
        today.push(item);
      }
    });

    // Categorize bookings
    bookings.forEach((booking) => {
      const item = {
        id: booking.id,
        type: 'booking',
        reference: booking.reference,
        status: booking.status,
        startTime: booking.scheduledAt,
        endTime: booking.status === 'COMPLETED' ? booking.updatedAt : null,
        value: booking.totalGBP / 100,
        pickupAddress: 'N/A',
        dropoffAddress: 'N/A',
      };

      if (booking.status === 'COMPLETED') {
        completed.push(item);
      } else if (booking.scheduledAt >= todayStart && booking.scheduledAt < todayEnd) {
        today.push(item);
      } else if (booking.scheduledAt >= todayEnd) {
        upcoming.push(item);
      } else {
        today.push(item);
      }
    });

    // Sort each category
    today.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    upcoming.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    completed.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return NextResponse.json({
      driver,
      today,
      upcoming,
      completed,
    });
  } catch (error) {
    console.error('Error fetching driver schedule:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

