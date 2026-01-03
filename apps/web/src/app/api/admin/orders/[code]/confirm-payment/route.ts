import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const { code: reference } = await params;

    console.log('🔧 Manual payment confirmation for booking:', reference);

    // Get booking details
    const booking = await prisma.booking.findFirst({
      where: { reference },
      include: {
        pickupAddress: true,
        dropoffAddress: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found', reference },
        { status: 404 }
      );
    }

    console.log('📋 Booking found:', {
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      totalGBP: booking.totalGBP,
      stripePaymentIntentId: booking.stripePaymentIntentId,
      paidAt: booking.paidAt
    });

    // Check if already confirmed
    if (booking.status === 'CONFIRMED') {
      return NextResponse.json({
        success: false,
        message: 'Booking is already confirmed',
        booking: {
          reference: booking.reference,
          status: booking.status,
          paidAt: booking.paidAt
        }
      });
    }

    // Lazily initialise Stripe to avoid hard failures when key is missing
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripe = stripeSecretKey
      ? new Stripe(stripeSecretKey, { apiVersion: '2024-04-10' })
      : null;

    // Check if booking has a Stripe Payment Intent
    let stripePaymentStatus = null;
    let stripePaymentIntent = null;

    if (booking.stripePaymentIntentId && stripe) {
      try {
        console.log('💳 Checking Stripe payment intent:', booking.stripePaymentIntentId);
        stripePaymentIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);
        stripePaymentStatus = stripePaymentIntent.status;
        
        console.log('💳 Stripe payment intent status:', {
          id: stripePaymentIntent.id,
          status: stripePaymentIntent.status,
          amount: stripePaymentIntent.amount,
          currency: stripePaymentIntent.currency
        });
      } catch (stripeError) {
        console.error('❌ Error fetching Stripe payment intent:', stripeError);
      }
    } else if (booking.stripePaymentIntentId && !stripe) {
      console.warn('⚠️ STRIPE_SECRET_KEY is missing; skipping payment intent verification');
    }

    // Determine if we should confirm the booking
    const shouldConfirm = stripePaymentStatus === 'succeeded' || booking.status === 'PENDING_PAYMENT';

    if (!shouldConfirm) {
      return NextResponse.json({
        success: false,
        message: `Cannot confirm booking with payment status: ${stripePaymentStatus}`,
        booking: {
          reference: booking.reference,
          status: booking.status,
          stripePaymentStatus
        }
      });
    }

    // Verify admin user exists to avoid FK violations in audit logs
    const adminUserRecord = user?.id
      ? await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, email: true } })
      : null;

    // Manually confirm the booking
    const confirmedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CONFIRMED',
          paidAt: booking.paidAt || new Date(),
          updatedAt: new Date()
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorId: user.id,
          actorRole: user.role || 'admin',
          action: 'booking_manually_confirmed',
          targetType: 'booking',
          targetId: booking.id,
          userId: adminUserRecord?.id || null,
          details: {
            reference: booking.reference,
            previousStatus: booking.status,
            newStatus: 'CONFIRMED',
            reason: 'Manual confirmation by admin - missed webhook or payment processing issue',
            stripePaymentIntentId: booking.stripePaymentIntentId,
            stripePaymentStatus: stripePaymentStatus,
            confirmedAt: new Date().toISOString(),
            adminUser: user.email,
          },
        },
      });

      return updatedBooking;
    });

    console.log('✅ Booking manually confirmed:', {
      id: confirmedBooking.id,
      reference: confirmedBooking.reference,
      status: confirmedBooking.status,
      paidAt: confirmedBooking.paidAt
    });

    // Try to notify available drivers
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;

      if (!baseUrl) {
        console.warn('⚠️ Missing base URL; skipping driver notifications');
      } else {
        const notifyResponse = await fetch(`${baseUrl}/api/admin/notify-drivers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: booking.id }),
        });

        if (notifyResponse.ok) {
          console.log('✅ Drivers notified about confirmed booking');
        } else {
          console.error('⚠️ Failed to notify drivers', {
            status: notifyResponse.status,
            statusText: notifyResponse.statusText
          });
        }
      }
    } catch (notifyError) {
      console.error('⚠️ Error notifying drivers:', notifyError);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking manually confirmed successfully',
      booking: {
        id: confirmedBooking.id,
        reference: confirmedBooking.reference,
        status: confirmedBooking.status,
        paidAt: confirmedBooking.paidAt,
        previousStatus: booking.status
      },
      stripeInfo: {
        paymentIntentId: booking.stripePaymentIntentId,
        paymentStatus: stripePaymentStatus
      },
      nextSteps: [
        'Booking should now appear in driver jobs dashboard',
        'Drivers have been notified about the available job',
        'Customer can track the booking status'
      ]
    });

  } catch (error) {
    const { code: reference } = await params;
    console.error('❌ Manual confirmation error:', error);
    return NextResponse.json(
      { 
        error: 'Manual confirmation failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        reference 
      },
      { status: 500 }
    );
  }
}