import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

/**
 * Capture a PaymentIntent after driver confirmation
 * POST /api/stripe/capture
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[CAPTURE] Starting payment capture process...');

    // Verify admin/system access
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bookingId, paymentIntentId } = body;

    if (!bookingId && !paymentIntentId) {
      return NextResponse.json(
        { error: 'Either bookingId or paymentIntentId is required' },
        { status: 400 }
      );
    }

    // Find booking and payment intent
    let booking;
    let piId = paymentIntentId;

    if (bookingId) {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          reference: true,
          stripePaymentIntentId: true,
          paymentCaptured: true,
          status: true,
          totalGBP: true,
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      piId = booking.stripePaymentIntentId;
    } else if (paymentIntentId) {
      booking = await prisma.booking.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
        select: {
          id: true,
          reference: true,
          stripePaymentIntentId: true,
          paymentCaptured: true,
          status: true,
          totalGBP: true,
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found for payment intent' },
          { status: 404 }
        );
      }
    }

    if (!piId) {
      return NextResponse.json(
        { error: 'No payment intent associated with this booking' },
        { status: 400 }
      );
    }

    // Block cancelled bookings
    if (booking?.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot capture payment for a cancelled booking' },
        { status: 409 }
      );
    }

    // Ensure booking is in a capturable state
    if (booking && booking.status !== 'PENDING_MATCH') {
      return NextResponse.json(
        { error: `Cannot capture payment for booking status: ${booking.status}` },
        { status: 409 }
      );
    }

    // Check if already captured
    if (booking?.paymentCaptured) {
      console.log('[CAPTURE] Payment already captured for booking:', booking.reference);
      return NextResponse.json({
        success: true,
        alreadyCaptured: true,
        message: 'Payment was already captured',
      });
    }

    console.log('[CAPTURE] Capturing payment intent:', piId);

    // Capture the payment intent
    try {
      const paymentIntent = await stripe.paymentIntents.capture(piId);

      console.log('[CAPTURE] Payment captured successfully:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
      });

      // Update booking record
      if (bookingId) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            paymentCaptured: true,
            paymentCapturedAt: new Date(),
            status: 'CONFIRMED',
          },
        });

        console.log('[CAPTURE] Booking updated:', bookingId);
      }

      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
        captured: true,
      });

    } catch (stripeError: any) {
      console.error('[CAPTURE] Stripe capture error:', stripeError);

      // Handle already captured
      if (stripeError.code === 'payment_intent_unexpected_state') {
        console.log('[CAPTURE] Payment intent already in final state');
        
        // Update booking if not already marked as captured
        if (bookingId && !booking?.paymentCaptured) {
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              paymentCaptured: true,
              paymentCapturedAt: new Date(),
              status: 'CONFIRMED',
            },
          });
        }

        return NextResponse.json({
          success: true,
          alreadyCaptured: true,
          message: 'Payment was already captured',
        });
      }

      throw stripeError;
    }

  } catch (error) {
    console.error('[CAPTURE] Fatal error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to capture payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
