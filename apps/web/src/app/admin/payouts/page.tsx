import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import FinanceClient from './FinanceClient';

// CRITICAL: Force dynamic rendering because we use getServerSession()
export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getFinanceData() {
  // Get recent invoices
  const recentInvoices = await prisma.booking.findMany({
    where: {
      status: 'COMPLETED',
      stripePaymentIntentId: {
        not: null,
      },
    },
    include: {
      customer: true,
    },
    orderBy: {
      paidAt: 'desc',
    },
    take: 10,
  });

  // Get pending refunds
  const pendingRefunds = await prisma.booking.findMany({
    where: {
      status: 'CANCELLED',
      updatedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    },
    include: {
      customer: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
    take: 10,
  });

  // Get driver payouts
  const driverPayouts = await prisma.driverPayout.findMany({
    where: {
      status: {
        in: ['pending', 'processing'],
      },
    },
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
              isActive: true,
              lastLogin: true,
              resetTokenExpiry: true,
              emailVerificationExpiry: true
            }
          },
        },
      },
      DriverEarnings: {
        include: {
          Assignment: {
            include: {
              Booking: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
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
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
  });

  // Get revenue metrics
  const revenueMetrics = await prisma.booking.aggregate({
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

  // Serialize data to ensure it can be passed to client components
  const serializedRecentInvoices = recentInvoices.map(invoice => ({
    ...invoice,
    createdAt: invoice.createdAt.toISOString(),
    updatedAt: invoice.updatedAt.toISOString(),
    scheduledAt: invoice.scheduledAt.toISOString(),
    paidAt: invoice.paidAt?.toISOString(),
    customer: invoice.customer ? {
      ...invoice.customer,
      createdAt: invoice.customer.createdAt.toISOString(),
      lastLogin: invoice.customer.lastLogin?.toISOString(),
      resetTokenExpiry: invoice.customer.resetTokenExpiry?.toISOString(),
      emailVerificationExpiry: invoice.customer.emailVerificationExpiry?.toISOString(),
    } : null,
  }));

  const serializedPendingRefunds = pendingRefunds.map(refund => ({
    ...refund,
    createdAt: refund.createdAt.toISOString(),
    updatedAt: refund.updatedAt.toISOString(),
    scheduledAt: refund.scheduledAt.toISOString(),
    paidAt: refund.paidAt?.toISOString(),
    customer: refund.customer ? {
      ...refund.customer,
      createdAt: refund.customer.createdAt.toISOString(),
      lastLogin: refund.customer.lastLogin?.toISOString(),
      resetTokenExpiry: refund.customer.resetTokenExpiry?.toISOString(),
      emailVerificationExpiry: refund.customer.emailVerificationExpiry?.toISOString(),
    } : null,
  }));

  const serializedDriverPayouts = driverPayouts.map(payout => ({
    ...payout,
    createdAt: payout.createdAt.toISOString(),
    updatedAt: payout.updatedAt.toISOString(),
    processedAt: payout.processedAt?.toISOString(),
    driver: {
      ...payout.Driver,
      createdAt: payout.Driver.createdAt.toISOString(),
      updatedAt: payout.Driver.updatedAt.toISOString(),
      approvedAt: payout.Driver.approvedAt?.toISOString(),
      user: {
        ...payout.Driver.User,
        createdAt: payout.Driver.User.createdAt.toISOString(),
        lastLogin: payout.Driver.User.lastLogin?.toISOString(),
        resetTokenExpiry: payout.Driver.User.resetTokenExpiry?.toISOString(),
        emailVerificationExpiry: payout.Driver.User.emailVerificationExpiry?.toISOString(),
      },
    },
    earnings: payout.DriverEarnings.map(earning => ({
      ...earning,
      createdAt: earning.createdAt.toISOString(),
      updatedAt: earning.updatedAt.toISOString(),
      calculatedAt: earning.calculatedAt.toISOString(),
      Assignment: {
        ...earning.Assignment,
        createdAt: earning.Assignment.createdAt.toISOString(),
        updatedAt: earning.Assignment.updatedAt.toISOString(),
        Booking: {
          ...earning.Assignment.Booking,
          createdAt: earning.Assignment.Booking.createdAt.toISOString(),
          updatedAt: earning.Assignment.Booking.updatedAt.toISOString(),
          scheduledAt: earning.Assignment.Booking.scheduledAt.toISOString(),
          paidAt: earning.Assignment.Booking.paidAt?.toISOString(),
        },
      },
    })),
  }));

  return {
    recentInvoices: serializedRecentInvoices,
    pendingRefunds: serializedPendingRefunds,
    driverPayouts: serializedDriverPayouts,
    earningsBreakdown: {
      baseAmount: earningsBreakdown._sum.baseAmountPence || 0,
      surgeAmount: earningsBreakdown._sum.surgeAmountPence || 0,
      tipAmount: earningsBreakdown._sum.tipAmountPence || 0,
      feeAmount: earningsBreakdown._sum.feeAmountPence || 0,
      netAmount: earningsBreakdown._sum.netAmountPence || 0,
    },
    revenueMetrics: {
      totalRevenue: revenueMetrics._sum.totalGBP || 0,
      totalOrders: revenueMetrics._count.id || 0,
    },
  };
}

export default async function FinancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin')
    redirect('/auth/login');

  const data = await getFinanceData();

  return <FinanceClient data={data} />;
}
