import { NextRequest, NextResponse } from 'next/server';

// Force dynamic to prevent build-time Prisma initialization
export const dynamic = 'force-dynamic';

/**
 * GET /api/booking/status?reference=SV-XXXXXX
 * 
 * Check if a booking is completed/confirmed.
 * Used by BookingInProgressPopup to determine if popup should be shown.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { error: 'Booking reference is required' },
        { status: 400 }
      );
    }

    // Dynamic import to prevent build-time initialization
    const { prisma } = await import('@speedy-van/shared');

    // Look up the booking by reference (Booking has no paymentStatus; derive from paidAt / additionalPaymentStatus)
    const booking = await prisma.booking.findFirst({
      where: {
        reference: reference,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        paidAt: true,
        additionalPaymentStatus: true,
      },
    });

    if (!booking) {
      // Booking not found - could be a draft only
      return NextResponse.json({
        found: false,
        status: null,
        message: 'Booking not found',
      });
    }

    // Derive payment status: Booking has paidAt and additionalPaymentStatus, not paymentStatus
    const paymentStatus =
      booking.paidAt != null
        ? 'PAID'
        : booking.additionalPaymentStatus !== 'NONE'
          ? booking.additionalPaymentStatus
          : booking.status === 'PENDING_PAYMENT'
            ? 'PENDING'
            : 'PENDING';

    const isComplete =
      booking.status === 'CONFIRMED' ||
      booking.status === 'COMPLETED' ||
      paymentStatus === 'PAID' ||
      paymentStatus === 'SUCCEEDED';

    return NextResponse.json({
      found: true,
      status: booking.status,
      paymentStatus,
      isComplete,
    });
  } catch (error) {
    console.error('[Booking Status API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check booking status' },
      { status: 500 }
    );
  }
}
