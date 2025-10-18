import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@speedy-van/shared/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Try to find as route first
    let route = await prisma.route.findUnique({
      where: { id },
      include: {
        driver: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        drops: {
          include: {
            booking: {
              select: {
                id: true,
                bookingReference: true,
                pickupAddress: true,
                dropoffAddress: true,
                customerName: true,
                customerPhone: true,
                status: true,
                totalPrice: true,
              },
            },
          },
          orderBy: {
            sequence: 'asc',
          },
        },
      },
    });

    // If not found as route, try as booking (single job)
    if (!route) {
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          driver: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      if (!booking) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }

      // Convert booking to route format
      return NextResponse.json({
        id: booking.id,
        routeNumber: booking.bookingReference,
        status: booking.status,
        driver: booking.driver,
        drops: [
          {
            id: booking.id,
            sequence: 1,
            booking: {
              id: booking.id,
              bookingReference: booking.bookingReference,
              pickupAddress: booking.pickupAddress,
              dropoffAddress: booking.dropoffAddress,
              customerName: booking.customerName,
              customerPhone: booking.customerPhone,
              status: booking.status,
            },
            status: booking.status,
            estimatedArrival: booking.pickupTime,
          },
        ],
        totalDistance: 0,
        estimatedDuration: 0,
        totalValue: booking.totalPrice,
        createdAt: booking.createdAt,
        startedAt: booking.pickupTime,
        completedAt: booking.status === 'COMPLETED' ? booking.updatedAt : null,
      });
    }

    // Calculate total value from drops
    const totalValue = route.drops.reduce(
      (sum, drop) => sum + (drop.booking.totalPrice || 0),
      0
    );

    return NextResponse.json({
      ...route,
      totalValue,
    });
  } catch (error) {
    console.error('Error fetching route details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

