import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
        { booking: { orderRef: { contains: search, mode: 'insensitive' } } },
        {
          driver: { User: { name: { contains: search, mode: 'insensitive' } } },
        },
        {
          booking: {
            customer: {
              User: { name: { contains: search, mode: 'insensitive' } },
            },
          },
        },
      ];
    }

    if (status) {
      where.booking = { ...where.booking, status };
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (fromDate || toDate) {
      where.booking = {
        ...where.booking,
        scheduledAt: {},
      };
      if (fromDate) where.booking.scheduledAt.gte = new Date(fromDate);
      if (toDate) where.booking.scheduledAt.lte = new Date(toDate);
    }

    // Get earnings with detailed breakdown
    const [earnings, total] = await Promise.all([
      prisma.driverEarnings.findMany({
        where,
        include: {
          Driver: {
            include: {
              User: {
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
        },
        orderBy: {
          calculatedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.driverEarnings.count({ where }),
    ]);

    // Get summary statistics
    const summary = await prisma.driverEarnings.aggregate({
      _sum: {
        baseAmountPence: true,
        surgeAmountPence: true,
        tipAmountPence: true,
        feeAmountPence: true,
        netAmountPence: true,
      },
      where: {
        calculatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    // Get revenue breakdown
    const revenueBreakdown = await prisma.booking.aggregate({
      _sum: {
        totalGBP: true,
      },
      _count: {
        id: true,
      },
      where: {
        status: 'COMPLETED',
        paidAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
    });

    // Get driver earnings breakdown
    const driverBreakdown = await prisma.driverEarnings.groupBy({
      by: ['driverId'],
      _sum: {
        baseAmountPence: true,
        surgeAmountPence: true,
        tipAmountPence: true,
        feeAmountPence: true,
        netAmountPence: true,
      },
      _count: {
        id: true,
      },
      where: {
        calculatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: {
        _sum: {
          netAmountPence: 'desc',
        },
      },
      take: 10,
    });

    // Get driver details for breakdown
    const driverDetails = await prisma.driver.findMany({
      where: {
        id: { in: driverBreakdown.map(d => d.driverId) },
      },
      include: {
        User: {
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
    });

    const driverBreakdownWithNames = driverBreakdown.map(driver => {
      const driverDetail = driverDetails.find(d => d.id === driver.driverId);
      return {
        driverId: driver.driverId,
        driverName: driverDetail?.User?.name || 'Unknown',
        driverEmail: driverDetail?.User?.email || 'Unknown',
        baseAmount: driver._sum.baseAmountPence || 0,
        surgeAmount: driver._sum.surgeAmountPence || 0,
        tipAmount: driver._sum.tipAmountPence || 0,
        feeAmount: driver._sum.feeAmountPence || 0,
        netAmount: driver._sum.netAmountPence || 0,
        jobCount: driver._count.id || 0,
      };
    });

    return NextResponse.json({
      ledger: earnings.map(earning => ({
        id: earning.id,
        driver: {
          id: earning.Driver.id,
          name: earning.Driver.User?.name || 'Unknown',
          email: earning.Driver.User?.email || 'Unknown',
        },
        assignmentId: earning.assignmentId,
        breakdown: {
          baseAmountPence: earning.baseAmountPence,
          surgeAmountPence: earning.surgeAmountPence,
          tipAmountPence: earning.tipAmountPence,
          feeAmountPence: earning.feeAmountPence,
          netAmountPence: earning.netAmountPence,
        },
        calculatedAt: earning.calculatedAt,
        paidOut: earning.paidOut,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        totalRevenue: revenueBreakdown._sum.totalGBP || 0,
        totalOrders: revenueBreakdown._count.id || 0,
        earningsBreakdown: {
          baseAmount: summary._sum.baseAmountPence || 0,
          surgeAmount: summary._sum.surgeAmountPence || 0,
          tipAmount: summary._sum.tipAmountPence || 0,
          feeAmount: summary._sum.feeAmountPence || 0,
          netAmount: summary._sum.netAmountPence || 0,
        },
        platformMargin:
          (revenueBreakdown._sum.totalGBP || 0) -
          (summary._sum.netAmountPence || 0),
        marginPercentage: revenueBreakdown._sum.totalGBP
          ? (
              ((revenueBreakdown._sum.totalGBP -
                (summary._sum.netAmountPence || 0)) /
                revenueBreakdown._sum.totalGBP) *
              100
            ).toFixed(2)
          : '0',
      },
      driverBreakdown: driverBreakdownWithNames,
    });
  } catch (error) {
    console.error('Ledger API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
