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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }

    // Get refunds with pagination
    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        include: {
          Payment: {
            include: {
              Booking: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.refund.count({ where }),
    ]);

    // Get summary statistics
    const summary = await prisma.refund.aggregate({
      _sum: { amount: true },
      _count: { id: true },
      where: { status: 'completed' },
    });

    return NextResponse.json({
      refunds: refunds.map(refund => ({
        id: refund.id,
        paymentId: refund.paymentId,
        bookingCode: refund.Payment.Booking?.reference,
        customer: {
          name: refund.Payment.Booking?.customerName || 'Unknown',
          email: refund.Payment.Booking?.customerEmail || 'Unknown',
        },
        amount: refund.amount,
        reason: refund.reason,
        status: refund.status,
        processedAt: refund.processedAt,
        createdAt: refund.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        totalRefunds: summary._sum.amount || 0,
        refundCount: summary._count.id || 0,
      },
    });
  } catch (error) {
    console.error('Admin finance refunds API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user || (s.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { paymentId, amount, reason, notes } = body;

    if (!paymentId || !amount || !reason) {
      return NextResponse.json(
        { error: 'Payment ID, amount, and reason are required' },
        { status: 400 }
      );
    }

    // Get payment details
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        Booking: true,
        Refund: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment is not in paid status' },
        { status: 400 }
      );
    }

    // Check if refund amount is valid
    const totalRefunded = payment.Refund.reduce(
      (sum, refund) => sum + refund.amount,
      0
    );
    const remainingAmount = payment.amount - totalRefunded;

    if (amount > remainingAmount) {
      return NextResponse.json(
        { error: 'Refund amount exceeds remaining payment amount' },
        { status: 400 }
      );
    }

    // Create refund
    const refund = await prisma.refund.create({
      data: {
        id: `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        paymentId: paymentId,
        amount: amount,
        reason: reason,
        status: 'pending',
        processedAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          notes,
          processedBy: (s.user as any).id,
        },
      },
    });

    // Update booking status if this is a full refund
    if (amount >= remainingAmount) {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'CANCELLED' },
      });
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        paymentId: refund.paymentId,
        amount: refund.amount,
        reason: refund.reason,
        status: refund.status,
        processedAt: refund.processedAt,
      },
    });
  } catch (error) {
    console.error('Create refund API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
