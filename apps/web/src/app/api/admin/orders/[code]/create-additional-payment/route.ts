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
  targetTotalGBP: z.number().int().min(100),
  reason: z.string().trim().max(500).optional(),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://speedy-van.co.uk';

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
        pickupAddress: true,
        dropoffAddress: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!booking.paidAt || booking.amountPaidGBP <= 0) {
      return NextResponse.json({ error: 'No payment recorded for this order. Additional payments can only be requested after an initial payment.' }, { status: 400 });
    }

    if (booking.additionalPaymentStatus === 'PENDING') {
      return NextResponse.json({ error: 'There is already a pending additional payment request for this order.' }, { status: 409 });
    }

    const amountPaid = booking.amountPaidGBP;
    const difference = targetTotalGBP - amountPaid;

    if (difference <= 0) {
      return NextResponse.json({ error: 'Target total is not greater than the amount already paid. Use the refund flow for reductions.' }, { status: 400 });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: booking.customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: difference,
            product_data: {
              name: `Additional payment for booking ${booking.reference}`,
              description: 'Adjustment requested by Speedy Van operations team',
            },
          },
        },
      ],
      success_url: `${APP_URL}/payments/additional/success?booking=${encodeURIComponent(booking.reference)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/payments/additional/cancelled?booking=${encodeURIComponent(booking.reference)}`,
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.reference,
        paymentPurpose: 'additional_charge',
        additionalAmount: difference.toString(),
        targetTotalGBP: targetTotalGBP.toString(),
        requestedBy: (session.user as any).email || 'admin',
      },
      payment_intent_data: {
        metadata: {
          bookingId: booking.id,
          bookingReference: booking.reference,
          paymentPurpose: 'additional_charge',
          additionalAmount: difference.toString(),
          targetTotalGBP: targetTotalGBP.toString(),
          requestedBy: (session.user as any).email || 'admin',
        },
      },
    });

    const now = new Date();

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        totalGBP: targetTotalGBP,
        additionalPaymentStatus: 'PENDING',
        additionalPaymentAmountGBP: difference,
        additionalPaymentRequestedAt: now,
        additionalPaymentStripeIntent: checkoutSession.payment_intent?.toString() || null,
        lastPaymentDate: booking.lastPaymentDate ?? booking.paidAt,
      },
    });

    await logAudit((session.user as any).id, 'request_additional_payment', booking.id, {
      targetTotalGBP,
      difference,
      checkoutSessionId: checkoutSession.id,
      paymentIntentId: checkoutSession.payment_intent,
      reason: reason || null,
    });

    try {
      await unifiedEmailService.sendAdditionalPaymentRequest({
        customerEmail: booking.customerEmail,
        customerName: booking.customerName,
        orderNumber: booking.reference,
        amountDue: difference / 100,
        currency: 'GBP',
        paymentLink: checkoutSession.url!,
        reason: reason || 'Additional services or adjustments were added to your booking.',
      });
    } catch (emailError) {
      console.error('❌ Failed to send additional payment email:', emailError);
    }

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl: checkoutSession.url,
        checkoutSessionId: checkoutSession.id,
        paymentIntentId: checkoutSession.payment_intent,
        differenceGBP: difference,
        targetTotalGBP,
      },
    });
  } catch (error) {
    console.error('❌ Error creating additional payment:', error);
    return NextResponse.json({ error: 'Failed to create additional payment request', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
