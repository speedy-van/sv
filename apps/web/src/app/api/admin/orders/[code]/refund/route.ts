import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { stripe } from '@/lib/stripe/client';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  targetTotalGBP: z.number().int().min(0),
  reason: z.string().trim().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const body = await request.json();
    const parseResult = requestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid payload', details: parseResult.error.format() }, { status: 400 });
    }

    const { targetTotalGBP, reason } = parseResult.data;
    const { code } = await params;

    const booking = await prisma.booking.findUnique({
      where: { reference: code },
      include: {
        customer: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!booking.paidAt || booking.amountPaidGBP <= 0) {
      return NextResponse.json({ error: 'No payment recorded for this order. Refunds cannot be issued.' }, { status: 400 });
    }

    const currentPaid = booking.amountPaidGBP;
    if (targetTotalGBP >= currentPaid) {
      return NextResponse.json({ error: 'Target total must be less than the amount already paid in order to issue a refund.' }, { status: 400 });
    }

    const refundAmount = currentPaid - targetTotalGBP;

    if (refundAmount <= 0) {
      return NextResponse.json({ error: 'Refund amount must be greater than zero.' }, { status: 400 });
    }

    const refunds: string[] = [];
    let remaining = refundAmount;

    const paymentIntents: string[] = [];
    if (booking.additionalPaymentStatus === 'PAID' && booking.additionalPaymentStripeIntent) {
      paymentIntents.push(booking.additionalPaymentStripeIntent);
    }
    if (booking.stripePaymentIntentId) {
      paymentIntents.push(booking.stripePaymentIntentId);
    }

    for (const paymentIntentId of paymentIntents) {
      if (remaining <= 0) break;
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['charges']
      }) as any;
      const amountReceived = paymentIntent.amount_received ?? 0;
      // Get amount_refunded from charges (Stripe API supports this with expand)
      const amountRefunded = paymentIntent.charges?.data?.[0]?.amount_refunded ?? 0;
      const refundable = amountReceived - amountRefunded;
      if (refundable <= 0) continue;
      const amountToRefund = Math.min(refundable, remaining);
      if (amountToRefund <= 0) continue;

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amountToRefund,
        metadata: {
          bookingId: booking.id,
          bookingReference: booking.reference,
          paymentPurpose: 'admin_refund',
          refundReason: reason || 'Admin initiated price adjustment',
          requestedBy: (session.user as any).email || 'admin',
        },
      });

      refunds.push(refund.id);
      remaining -= amountToRefund;
    }

    if (remaining > 0) {
      return NextResponse.json({ error: 'Unable to refund the full amount. Please review the captured charges in Stripe.' }, { status: 409 });
    }

    const now = new Date();

    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        totalGBP: targetTotalGBP,
        amountPaidGBP: currentPaid - refundAmount,
        additionalPaymentStatus: refundAmount >= booking.additionalPaymentAmountGBP ? 'REFUNDED' : booking.additionalPaymentStatus,
        additionalPaymentAmountGBP: refundAmount >= booking.additionalPaymentAmountGBP ? 0 : Math.max(booking.additionalPaymentAmountGBP - refundAmount, 0),
        lastRefundDate: now,
      },
    });

    await logAudit((session.user as any).id, 'issue_refund', booking.id, {
      refundAmount,
      targetTotalGBP,
      refunds,
      reason: reason || null,
    });

    try {
      await unifiedEmailService.sendRefundNotification({
        customerEmail: booking.customerEmail,
        customerName: booking.customerName,
        orderNumber: booking.reference,
        refundAmount: refundAmount / 100,
        newTotal: targetTotalGBP / 100,
        currency: 'GBP',
        reason: reason || 'Price adjustment processed by our operations team.',
      });
    } catch (emailError) {
      console.error('❌ Failed to send refund email:', emailError);
    }

    return NextResponse.json({
      success: true,
      data: {
        refunds,
        refundAmountGBP: refundAmount,
        targetTotalGBP,
        amountPaidGBP: updatedBooking.amountPaidGBP,
      },
    });
  } catch (error) {
    console.error('❌ Error issuing refund:', error);
    return NextResponse.json({ error: 'Failed to issue refund', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
