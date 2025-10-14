import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET drops for a route
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const routeId = params.id;

    const drops = await prisma.drop.findMany({
      where: { routeId },
      orderBy: { timeWindowStart: 'asc' },
      include: {
        Booking: {
          select: {
            id: true,
            reference: true,
            customerName: true,
            customerPhone: true,
          },
        },
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ drops });
  } catch (error) {
    console.error('Get drops error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drops' },
      { status: 500 }
    );
  }
}

// POST - Add drop to route
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const routeId = params.id;
    const body = await request.json();

    const {
      bookingId,
      customerId,
      pickupAddress,
      deliveryAddress,
      timeWindowStart,
      timeWindowEnd,
      quotedPrice,
      specialInstructions,
    } = body;

    // Validate required fields
    if (!customerId || !pickupAddress || !deliveryAddress || !timeWindowStart || !timeWindowEnd || !quotedPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if route exists
    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Cannot add drops to completed/closed routes
    if (route.status === 'completed' || route.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot add drops to completed or closed routes' },
        { status: 400 }
      );
    }

    // Create drop
    const drop = await prisma.drop.create({
      data: {
        Route: { connect: { id: routeId } },
        ...(bookingId ? { Booking: { connect: { id: bookingId } } } : {}),
        User: { connect: { id: customerId } },
        pickupAddress,
        deliveryAddress,
        timeWindowStart: new Date(timeWindowStart),
        timeWindowEnd: new Date(timeWindowEnd),
        quotedPrice: parseFloat(quotedPrice),
        specialInstructions,
        status: 'booked',
      },
      include: {
        Booking: true,
        User: true,
      },
    });

    // Mark route as modified by admin
    await prisma.route.update({
      where: { id: routeId },
      data: {
        isModifiedByAdmin: true,
        adminNotes: `Drop added manually by admin on ${new Date().toISOString()}`,
      },
    });

    return NextResponse.json({
      drop,
      message: 'Drop added successfully',
    });
  } catch (error) {
    console.error('Add drop error:', error);
    return NextResponse.json(
      { error: 'Failed to add drop' },
      { status: 500 }
    );
  }
}
