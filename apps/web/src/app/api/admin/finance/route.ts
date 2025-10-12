import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user || (s.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Calculate date range
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get paid invoices
    const paidInvoices = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      where: {
        status: 'paid',
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Get pending invoices
    const pendingInvoices = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      where: {
        status: 'unpaid',
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Get refunds
    const refunds = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      where: {
        status: 'refunded',
        updatedAt: {
          gte: startDate,
        },
      },
    });

    // Get driver payouts
    const payouts = await prisma.driverPayout.aggregate({
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
        createdAt: {
          gte: startDate,
        },
      },
    });

    // Get earnings breakdown
    const earningsBreakdown = await prisma.driverEarnings.aggregate({
      _sum: {
        baseAmountPence: true,
        surgeAmountPence: true,
        tipAmountPence: true,
        feeAmountPence: true,
        netAmountPence: true,
      },
      where: {
        calculatedAt: {
          gte: startDate,
        },
      },
    });

    // Get recent activity
    const recentInvoices = await prisma.payment.findMany({
      where: {
        status: 'paid',
        createdAt: {
          gte: startDate,
        },
      },
      include: {
        Booking: {
          include: {
            User: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    const recentRefunds = await prisma.payment.findMany({
      where: {
        status: 'refunded',
        updatedAt: {
          gte: startDate,
        },
      },
      include: {
        Booking: {
          include: {
            User: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 5,
    });

    // Get top performing drivers
    const topDrivers = await prisma.driverEarnings.groupBy({
      by: ['driverId'],
      _sum: {
        netAmountPence: true,
      },
      _count: {
        id: true,
      },
      where: {
        calculatedAt: {
          gte: startDate,
        },
      },
      orderBy: {
        _sum: {
          netAmountPence: 'desc',
        },
      },
      take: 5,
    });

    // Get driver details for top performers
    const driverDetails = await prisma.driver.findMany({
      where: {
        id: {
          in: topDrivers.map(d => d.driverId),
        },
      },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const topDriversWithDetails = topDrivers.map(driver => {
      const details = driverDetails.find(d => d.id === driver.driverId);
      return {
        driverId: driver.driverId,
        driverName: details?.User.name || 'Unknown',
        driverEmail: details?.User.email || 'Unknown',
        totalEarnings: driver._sum.netAmountPence || 0,
        jobCount: driver._count.id || 0,
      };
    });

    return NextResponse.json({
      summary: {
        totalRevenue: paidInvoices._sum.amount || 0,
        totalInvoices: paidInvoices._count.id || 0,
        pendingRevenue: pendingInvoices._sum.amount || 0,
        pendingInvoices: pendingInvoices._count.id || 0,
        totalRefunds: refunds._sum.amount || 0,
        refundCount: refunds._count.id || 0,
        totalPayouts: payouts._sum.totalAmountPence || 0,
        payoutCount: payouts._count.id || 0,
      },
      earnings: {
        baseAmount: earningsBreakdown._sum.baseAmountPence || 0,
        surgeAmount: earningsBreakdown._sum.surgeAmountPence || 0,
        tipAmount: earningsBreakdown._sum.tipAmountPence || 0,
        feeAmount: earningsBreakdown._sum.feeAmountPence || 0,
        netAmount: earningsBreakdown._sum.netAmountPence || 0,
      },
      recentActivity: {
        invoices: recentInvoices.map(invoice => ({
          id: invoice.id,
          amount: invoice.amount,
          status: invoice.status,
          createdAt: invoice.createdAt,
          customer: invoice.Booking.User ? {
            name: invoice.Booking.User.name,
            email: invoice.Booking.User.email,
          } : null,
          bookingRef: invoice.Booking.reference,
        })),
        refunds: recentRefunds.map(refund => ({
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
          updatedAt: refund.updatedAt,
          customer: refund.Booking.User ? {
            name: refund.Booking.User.name,
            email: refund.Booking.User.email,
          } : null,
          bookingRef: refund.Booking.reference,
        })),
      },
      topDrivers: topDriversWithDetails,
    });
  } catch (error) {
    console.error('Admin finance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
