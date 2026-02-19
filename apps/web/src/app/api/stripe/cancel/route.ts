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
 * Cancel a PaymentIntent when no driver is found
 * POST /api/stripe/cancel
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[CANCEL] Starting payment cancellation process...');

    // Verify admin/system access
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { bookingId, paymentIntentId, reason } = body;

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
        },
      });

      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      piId = booking.stripePaymentIntentId;
    }

    if (!piId) {
      return NextResponse.json(
        { error: 'No payment intent associated with this booking' },
        { status: 400 }
      );
    }

    // Don't cancel if already captured
    if (booking?.paymentCaptured) {
      console.log('[CANCEL] Cannot cancel: Payment already captured for booking:', booking.reference);
      return NextResponse.json(
        { error: 'Cannot cancel: Payment already captured' },
        { status: 400 }
      );
    }

    console.log('[CANCEL] Cancelling payment intent:', piId);

    // Cancel the payment intent
    try {
      const paymentIntent = await stripe.paymentIntents.cancel(piId, {
        cancellation_reason: 'requested_by_customer',
      });

      console.log('[CANCEL] Payment cancelled successfully:', {
        id: paymentIntent.id,
        status: paymentIntent.status,
      });

      // Update booking record
      if (bookingId) {
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            status: 'CANCELLED',
          },
        });

        // Log cancellation
        await prisma.auditLog.create({
          data: {
            actorId: session.user.id,
            actorRole: session.user.role,
            action: 'payment_cancelled',
            targetType: 'booking',
            targetId: bookingId,
            details: {
              paymentIntentId: piId,
              reason: reason || 'No driver available',
              timestamp: new Date().toISOString(),
            },
          },
        });

        console.log('[CANCEL] Booking cancelled:', bookingId);
      }

      return NextResponse.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        cancelled: true,
      });

    } catch (stripeError: any) {
      console.error('[CANCEL] Stripe cancellation error:', stripeError);

      // Handle already cancelled
      if (stripeError.code === 'payment_intent_unexpected_state') {
        console.log('[CANCEL] Payment intent already in final state');

        // Update booking status
        if (bookingId && booking?.status !== 'CANCELLED') {
          await prisma.booking.update({
            where: { id: bookingId },
            data: {
              status: 'CANCELLED',
            },
          });
        }

        return NextResponse.json({
          success: true,
          alreadyCancelled: true,
          message: 'Payment was already cancelled',
        });
      }

      throw stripeError;
    }

  } catch (error) {
    console.error('[CANCEL] Fatal error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to cancel payment',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
