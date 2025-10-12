import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const driverId = searchParams.get('driverId') || '';
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        {
          driver: { user: { name: { contains: search, mode: 'insensitive' } } },
        },
        {
          driver: {
            user: { email: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    // Get payouts with pagination
    const [payouts, total] = await Promise.all([
      prisma.driverPayout.findMany({
        where,
        include: {
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  createdAt: true,
                  isActive: true
                }
              },
            },
          },
          earnings: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.driverPayout.count({ where }),
    ]);

    // Get summary statistics
    const summary = await prisma.driverPayout.aggregate({
      _sum: {
        totalAmountPence: true,
      },
      _count: {
        id: true,
      },
      where: {
        status: {
          in: ['pending', 'processing'],
        },
      },
    });

    // Get status breakdown
    const statusBreakdown = await prisma.driverPayout.groupBy({
      by: ['status'],
      _sum: {
        totalAmountPence: true,
      },
      _count: {
        id: true,
      },
    });

    // Get earnings breakdown for the period
    const earningsBreakdown = await prisma.driverEarnings.aggregate({
      _sum: {
        baseAmountPence: true,
        surgeAmountPence: true,
        tipAmountPence: true,
        feeAmountPence: true,
        netAmountPence: true,
      },
      where: {
        paidOut: false,
        calculatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    return NextResponse.json({
      payouts: payouts.map(payout => ({
        id: payout.id,
        driver: {
          id: payout.driver.id,
          name: payout.driver.user.name,
          email: payout.driver.user.email,
        },
        totalAmountPence: payout.totalAmountPence,
        currency: payout.currency,
        status: payout.status,
        processedAt: payout.processedAt,
        failedAt: payout.failedAt,
        failureReason: payout.failureReason,
        stripeTransferId: payout.stripeTransferId,
        bankAccountId: payout.bankAccountId,
        createdAt: payout.createdAt,
        earnings: payout.earnings.map(earning => ({
          id: earning.id,
          assignmentId: earning.assignmentId,
          baseAmountPence: earning.baseAmountPence,
          surgeAmountPence: earning.surgeAmountPence,
          tipAmountPence: earning.tipAmountPence,
          feeAmountPence: earning.feeAmountPence,
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
      summary: {
        pendingPayouts: summary._sum.totalAmountPence || 0,
        payoutCount: summary._count.id || 0,
        statusBreakdown: statusBreakdown.map(item => ({
          status: item.status,
          amount: item._sum.totalAmountPence || 0,
          count: item._count.id || 0,
        })),
        earningsBreakdown: {
          baseAmount: earningsBreakdown._sum.baseAmountPence || 0,
          surgeAmount: earningsBreakdown._sum.surgeAmountPence || 0,
          tipAmount: earningsBreakdown._sum.tipAmountPence || 0,
          feeAmount: earningsBreakdown._sum.feeAmountPence || 0,
          netAmount: earningsBreakdown._sum.netAmountPence || 0,
        },
      },
    });
  } catch (error) {
    console.error('Payouts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { driverId, earningsIds, notes } = body;

    if (!driverId || !earningsIds || earningsIds.length === 0) {
      return NextResponse.json(
        {
          error: 'Driver ID and earnings IDs are required',
        },
        { status: 400 }
      );
    }

    // Get driver details
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            isActive: true
          }
        },
        payoutSettings: true,
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Get earnings details
    const earnings = await prisma.driverEarnings.findMany({
      where: {
        id: { in: earningsIds },
        driverId: driverId,
        paidOut: false,
      },
      include: {},
    });

    if (earnings.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid earnings found for payout',
        },
        { status: 400 }
      );
    }

    // Calculate total payout amount
    const totalAmountPence = earnings.reduce(
      (sum, earning) => sum + earning.netAmountPence,
      0
    );

    if (totalAmountPence <= 0) {
      return NextResponse.json(
        {
          error: 'Total payout amount must be greater than 0',
        },
        { status: 400 }
      );
    }

    // Check minimum payout amount
    const minPayoutAmount = driver.payoutSettings?.minPayoutAmountPence || 5000; // £50
    if (totalAmountPence < minPayoutAmount) {
      return NextResponse.json(
        {
          error: `Payout amount must be at least £${(minPayoutAmount / 100).toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // Create payout record
    const payout = await prisma.driverPayout.create({
      data: {
        driverId: driverId,
        totalAmountPence: totalAmountPence,
        currency: 'gbp',
        status: 'pending',
        earnings: {
          connect: earningsIds.map((id: string) => ({ id })),
        },
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                isActive: true
              }
            },
          },
        },
        earnings: true,
      },
    });

    // Mark earnings as paid out
    await prisma.driverEarnings.updateMany({
      where: {
        id: { in: earningsIds },
      },
      data: {
        paidOut: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        actorRole: 'admin',
        action: 'payout_created',
        targetType: 'driver_payout',
        targetId: payout.id,
        after: {
          driverId: driverId,
          totalAmount: totalAmountPence,
          earningsCount: earnings.length,
          notes: notes || '',
        },
        ip:
          request.headers.get('x-forwarded-for') ||
          request.headers.get('x-real-ip') ||
          'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      payout: {
        id: payout.id,
        driverName: payout.driver.user.name,
        totalAmountPence: payout.totalAmountPence,
        status: payout.status,
        createdAt: payout.createdAt,
        earningsCount: payout.earnings.length,
      },
    });
  } catch (error) {
    console.error('Payout creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
