import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import Stripe from 'stripe';
import { broadcastJobToDrivers } from '@/lib/services/driver-matching-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const alternativeActionSchema = z.object({
  action: z.enum(['time_shift', 'surge_pricing', 'cancel']),
  newScheduledAt: z.string().optional(), // For time_shift
  surgeAmount: z.number().min(10).max(50).optional(), // For surge_pricing (in GBP)
});

/**
 * Handle alternatives when no driver is available
 * POST /api/bookings/[id]/alternatives
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    
    const body = await request.json();
    const validation = alternativeActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { action, newScheduledAt, surgeAmount } = validation.data;

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Only allow alternatives for NO_DRIVER_AVAILABLE status
    if (booking.status !== 'NO_DRIVER_AVAILABLE') {
      return NextResponse.json(
        { error: 'Alternatives only available for bookings without drivers' },
        { status: 400 }
      );
    }

    console.log('[ALTERNATIVES] Processing action:', {
      bookingId,
      action,
      currentStatus: booking.status,
    });

    switch (action) {
      case 'time_shift':
        return await handleTimeShift(booking, newScheduledAt!);
      
      case 'surge_pricing':
        return await handleSurgePricing(booking, surgeAmount!);
      
      case 'cancel':
        return await handleCancellation(booking);
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[ALTERNATIVES] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process alternative',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function handleTimeShift(booking: any, newScheduledAtStr: string) {
  const newScheduledAt = new Date(newScheduledAtStr);
  
  // Validate new time is in the future
  if (newScheduledAt <= new Date()) {
    return NextResponse.json(
      { error: 'New time must be in the future' },
      { status: 400 }
    );
  }

  console.log('[ALTERNATIVES] Time shift:', {
    bookingId: booking.id,
    oldTime: booking.scheduledAt.toISOString(),
    newTime: newScheduledAt.toISOString(),
  });

  // Update booking
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      scheduledAt: newScheduledAt,
      status: 'PENDING_MATCH',
      matchAttempts: 0, // Reset match attempts
      matchStartTime: new Date(),
    },
  });

  // Rebroadcast to drivers
  try {
    await broadcastJobToDrivers(booking.id);
  } catch (broadcastError) {
    console.error('[ALTERNATIVES] Rebroadcast failed:', broadcastError);
    // Continue anyway - admin can manually assign
  }

  // Log action
  await prisma.auditLog.create({
    data: {
      actorId: booking.customerId || 'customer',
      actorRole: 'customer',
      action: 'booking_time_shifted',
      targetType: 'booking',
      targetId: booking.id,
      details: {
        oldScheduledAt: booking.scheduledAt.toISOString(),
        newScheduledAt: newScheduledAt.toISOString(),
        reason: 'no_driver_available',
      },
    },
  });

  return NextResponse.json({
    success: true,
    action: 'time_shift',
    message: 'Booking time updated. Searching for drivers...',
    newScheduledAt: newScheduledAt.toISOString(),
  });
}

async function handleSurgePricing(booking: any, surgeAmountGBP: number) {
  console.log('[ALTERNATIVES] Surge pricing:', {
    bookingId: booking.id,
    originalAmount: booking.totalGBP / 100,
    surgeAmount: surgeAmountGBP,
  });

  const surgeAmountPence = Math.round(surgeAmountGBP * 100);
  const newTotalPence = booking.totalGBP + surgeAmountPence;

  // Cancel old payment intent
  if (booking.stripePaymentIntentId) {
    try {
      await stripe.paymentIntents.cancel(booking.stripePaymentIntentId);
    } catch (error) {
      console.error('[ALTERNATIVES] Failed to cancel old payment intent:', error);
      // Continue anyway
    }
  }

  // Create new payment intent with increased amount
  try {
    const newPaymentIntent = await stripe.paymentIntents.create({
      amount: newTotalPence,
      currency: 'gbp',
      capture_method: 'manual',
      metadata: {
        bookingId: booking.id,
        bookingReference: booking.reference,
        originalAmount: booking.totalGBP.toString(),
        surgeAmount: surgeAmountPence.toString(),
        reason: 'surge_pricing_for_driver_availability',
      },
    });

    // Update booking
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        totalGBP: newTotalPence,
        stripePaymentIntentId: newPaymentIntent.id,
        status: 'PENDING_MATCH',
        matchAttempts: 0,
        matchStartTime: new Date(),
        customerPreferences: {
          ...(booking.customerPreferences as any || {}),
          surgePricing: {
            applied: true,
            amount: surgeAmountGBP,
            reason: 'Driver availability incentive',
            appliedAt: new Date().toISOString(),
          },
        },
      },
    });

    // Rebroadcast with surge pricing flag
    try {
      await broadcastJobToDrivers(booking.id);
    } catch (broadcastError) {
      console.error('[ALTERNATIVES] Rebroadcast failed:', broadcastError);
    }

    // Log action
    await prisma.auditLog.create({
      data: {
        actorId: booking.customerId || 'customer',
        actorRole: 'customer',
        action: 'surge_pricing_applied',
        targetType: 'booking',
        targetId: booking.id,
        details: {
          originalAmount: booking.totalGBP,
          surgeAmount: surgeAmountPence,
          newTotal: newTotalPence,
          reason: 'no_driver_available',
        },
      },
    });

    return NextResponse.json({
      success: true,
      action: 'surge_pricing',
      message: 'Surge pricing applied. Searching for drivers with increased incentive...',
      newTotal: newTotalPence / 100,
      surgeAmount: surgeAmountGBP,
      clientSecret: newPaymentIntent.client_secret,
    });

  } catch (error) {
    console.error('[ALTERNATIVES] Surge pricing failed:', error);
    return NextResponse.json(
      { error: 'Failed to apply surge pricing' },
      { status: 500 }
    );
  }
}

async function handleCancellation(booking: any) {
  console.log('[ALTERNATIVES] Cancelling booking:', booking.id);

  // Cancel payment intent
  if (booking.stripePaymentIntentId) {
    try {
      await stripe.paymentIntents.cancel(booking.stripePaymentIntentId);
    } catch (error) {
      console.error('[ALTERNATIVES] Failed to cancel payment intent:', error);
      // Continue with booking cancellation anyway
    }
  }

  // Update booking status
  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CANCELLED',
    },
  });

  // Create cancellation record
  await prisma.bookingCancellation.create({
    data: {
      bookingId: booking.id,
      reason: 'No driver available - customer chose to cancel',
      cancelledBy: 'customer',
      refundStatus: 'not_applicable', // No charge was captured
      refundAmount: 0,
    },
  });

  // Log action
  await prisma.auditLog.create({
    data: {
      actorId: booking.customerId || 'customer',
      actorRole: 'customer',
      action: 'booking_cancelled_no_driver',
      targetType: 'booking',
      targetId: booking.id,
      details: {
        reason: 'no_driver_available',
        paymentIntentCancelled: !!booking.stripePaymentIntentId,
      },
    },
  });

  return NextResponse.json({
    success: true,
    action: 'cancel',
    message: 'Booking cancelled. Payment authorization released.',
  });
}
