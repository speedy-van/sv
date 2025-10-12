import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

    // Get payouts with pagination
    const [payouts, total] = await Promise.all([
      prisma.driverPayout.findMany({
        where,
        include: {
          earnings: {
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
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.driverPayout.count({ where }),
    ]);

    // Calculate totals by status
    const statusTotals = await prisma.driverPayout.groupBy({
      by: ['status'],
      where: { driverId: driver.id },
      _sum: {
        totalAmountPence: true,
      },
      _count: true,
    });

    const totals = statusTotals.reduce(
      (acc, item) => ({
        ...acc,
        [item.status]: {
          amount: item._sum.totalAmountPence || 0,
          count: item._count,
        },
      }),
      {}
    );

    return NextResponse.json({
      payouts: payouts.map(payout => ({
        id: payout.id,
        totalAmountPence: payout.totalAmountPence,
        currency: payout.currency,
        status: payout.status,
        processedAt: payout.processedAt,
        failedAt: payout.failedAt,
        failureReason: payout.failureReason,
        stripeTransferId: payout.stripeTransferId,
        createdAt: payout.createdAt,
        updatedAt: payout.updatedAt,
        earnings: payout.earnings.map(earning => ({
          id: earning.id,
          assignmentId: earning.assignmentId,
          bookingCode: earning.Assignment.Booking.reference,
          pickupAddress: earning.Assignment.Booking.pickupAddress,
          dropoffAddress: earning.Assignment.Booking.dropoffAddress,
          netAmountPence: earning.netAmountPence,
          calculatedAt: earning.calculatedAt,
        })),
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
    console.error('Error fetching payouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}
