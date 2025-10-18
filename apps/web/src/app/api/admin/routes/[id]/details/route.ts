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

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Try to find as route first
    let route = await prisma.route.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        drops: {
          include: {
            Booking: {
              select: {
                id: true,
                reference: true,
                customerName: true,
                customerPhone: true,
                status: true,
                totalGBP: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
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
              User: {
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
        routeNumber: booking.reference,
        status: booking.status,
        driver: booking.driver,
        drops: [
          {
            id: booking.id,
            sequence: 1,
            booking: {
              id: booking.id,
              reference: booking.reference,
              customerName: booking.customerName,
              customerPhone: booking.customerPhone,
              status: booking.status,
            },
            status: booking.status,
            estimatedArrival: booking.scheduledAt,
          },
        ],
        totalDistance: 0,
        estimatedDuration: 0,
        totalValue: booking.totalGBP,
        createdAt: booking.createdAt,
        startedAt: booking.scheduledAt,
        completedAt: booking.status === 'COMPLETED' ? booking.updatedAt : null,
      });
    }

    // Calculate total value from drops
    const totalValue = route.drops.reduce(
      (sum, drop) => sum + (drop.Booking?.totalGBP || 0),
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

