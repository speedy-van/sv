import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@speedy-van/shared';

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

    // Look up the booking by reference
    const booking = await prisma.booking.findFirst({
      where: {
        reference: reference,
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
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

    // Return the booking status
    return NextResponse.json({
      found: true,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      // Consider a booking complete if it's CONFIRMED or payment is successful
      isComplete: 
        booking.status === 'CONFIRMED' || 
        booking.status === 'COMPLETED' ||
        booking.paymentStatus === 'PAID' ||
        booking.paymentStatus === 'SUCCEEDED',
    });
  } catch (error) {
    console.error('[Booking Status API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check booking status' },
      { status: 500 }
    );
  }
}
