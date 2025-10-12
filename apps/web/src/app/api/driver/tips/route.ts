import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    // Get driver
    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Build where clause
    const where: any = { driverId: driver.id };
    if (status) {
      where.status = status;
    }

    // Get tips with pagination
    const [tips, total] = await Promise.all([
      prisma.driverTip.findMany({
        where,
        include: {
          Assignment: {
            include: {
              Booking: {
                select: {
                  reference: true,
                  pickupAddress: true,
                  dropoffAddress: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.driverTip.count({ where }),
    ]);

    // Calculate totals by status
    const statusTotals = await prisma.driverTip.groupBy({
      by: ['status'],
      where: { driverId: driver.id },
      _sum: {
        amountPence: true,
      },
      _count: true,
    });

    const totals = statusTotals.reduce(
      (acc, item) => ({
        ...acc,
        [item.status]: {
          amount: item._sum.amountPence || 0,
          count: item._count,
        },
      }),
      {}
    );

    return NextResponse.json({
      tips: tips.map(tip => ({
        id: tip.id,
        assignmentId: tip.assignmentId,
        bookingCode: tip.Assignment.Booking.reference,
        pickupAddress: tip.Assignment.Booking.pickupAddress,
        dropoffAddress: tip.Assignment.Booking.dropoffAddress,
        amountPence: tip.amountPence,
        currency: tip.currency,
        method: tip.method,
        reference: tip.reference,
        status: tip.status,
        reconciledAt: tip.reconciledAt,
        reconciledBy: tip.reconciledBy,
        notes: tip.notes,
        createdAt: tip.createdAt,
        updatedAt: tip.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      totals,
    });
  } catch (error) {
    console.error('Error fetching tips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tips' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'driver') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assignmentId, amountPence, method, reference, notes } = body;

    // Get driver
    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Validate inputs
    if (!assignmentId) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      );
    }

    if (!amountPence || amountPence <= 0) {
      return NextResponse.json(
        { error: 'Valid tip amount is required' },
        { status: 400 }
      );
    }

    if (!method) {
      return NextResponse.json(
        { error: 'Tip method is required' },
        { status: 400 }
      );
    }

    // Verify assignment belongs to driver
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        driverId: driver.id,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or not authorized' },
        { status: 404 }
      );
    }

    // Check if tip already exists for this assignment
    const existingTip = await prisma.driverTip.findFirst({
      where: {
        assignmentId,
        driverId: driver.id,
      },
    });

    if (existingTip) {
      return NextResponse.json(
        { error: 'Tip already recorded for this assignment' },
        { status: 409 }
      );
    }

    // Create tip
    const tip = await prisma.driverTip.create({
      data: {
        driverId: driver.id,
        assignmentId,
        amountPence,
        method,
        reference,
        notes,
        status: 'pending',
      },
      include: {
        Assignment: {
          include: {
            Booking: {
              select: {
                reference: true,
                pickupAddress: true,
                dropoffAddress: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      id: tip.id,
      assignmentId: tip.assignmentId,
      bookingCode: tip.Assignment.Booking.reference,
      amountPence: tip.amountPence,
      currency: tip.currency,
      method: tip.method,
      reference: tip.reference,
      status: tip.status,
      notes: tip.notes,
      createdAt: tip.createdAt,
    });
  } catch (error) {
    console.error('Error creating tip:', error);
    return NextResponse.json(
      { error: 'Failed to create tip' },
      { status: 500 }
    );
  }
}
