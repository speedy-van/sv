import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/reviews/verify
 * 
 * Verify review request token and return booking data
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    // Find review request by token
    const reviewRequest = await prisma.reviewRequest.findUnique({
      where: { token },
      include: {
        Booking: {
          select: {
            id: true,
            reference: true,
            customerName: true,
            scheduledAt: true,
            actualDeliveryTime: true,
            serviceType: true,
            BookingAddress_Booking_pickupAddressIdToBookingAddress: {
              select: { label: true },
            },
            BookingAddress_Booking_dropoffAddressIdToBookingAddress: {
              select: { label: true },
            },
          },
        },
      },
    });

    if (!reviewRequest) {
      return NextResponse.json(
        { valid: false, message: 'Invalid review link' },
        { status: 404 }
      );
    }

    // Check if expired
    if (reviewRequest.expiresAt < new Date()) {
      return NextResponse.json(
        { valid: false, message: 'Review link has expired' },
        { status: 410 }
      );
    }

    // Check if already responded
    if (reviewRequest.status === 'RESPONDED') {
      return NextResponse.json(
        { valid: false, message: 'Review already submitted for this booking' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      booking: {
        reference: reviewRequest.Booking.reference,
        customerName: reviewRequest.customerName,
        from: reviewRequest.Booking.BookingAddress_Booking_pickupAddressIdToBookingAddress?.label || '',
        to: reviewRequest.Booking.BookingAddress_Booking_dropoffAddressIdToBookingAddress?.label || '',
        serviceType: reviewRequest.Booking.serviceType,
        completedAt: reviewRequest.Booking.actualDeliveryTime,
      },
    });

  } catch (error) {
    console.error('Review verification error:', error);
    return NextResponse.json(
      { valid: false, message: 'Failed to verify review link' },
      { status: 500 }
    );
  }
}

// Cache for 0 seconds (always fresh for security)
export const revalidate = 0;
