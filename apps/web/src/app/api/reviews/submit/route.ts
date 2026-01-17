import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

/**
 * POST /api/reviews/submit
 * 
 * Submit a customer review and generate discount code
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, rating, title, comment } = body;

    if (!token || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, message: 'Invalid input' },
        { status: 400 }
      );
    }

    // Find review request
    const reviewRequest = await prisma.reviewRequest.findUnique({
      where: { token },
      include: {
        Booking: {
          select: {
            id: true,
            driverId: true,
            BookingAddress_Booking_pickupAddressIdToBookingAddress: {
              select: { label: true },
            },
          },
        },
      },
    });

    if (!reviewRequest) {
      return NextResponse.json(
        { success: false, message: 'Invalid review link' },
        { status: 404 }
      );
    }

    // Check if expired
    if (reviewRequest.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Review link has expired' },
        { status: 410 }
      );
    }

    // Check if already responded
    if (reviewRequest.status === 'RESPONDED') {
      return NextResponse.json(
        { success: false, message: 'Review already submitted' },
        { status: 410 }
      );
    }

    // Extract city from address label
    const addressLabel = reviewRequest.Booking.BookingAddress_Booking_pickupAddressIdToBookingAddress?.label || '';
    const city = addressLabel.includes(',') 
      ? addressLabel.split(',')[1].trim() 
      : addressLabel;

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId: reviewRequest.bookingId,
        customerId: reviewRequest.customerId,
        driverId: reviewRequest.Booking.driverId,
        rating,
        title: title || null,
        comment: comment || null,
        city,
        serviceType: 'STANDARD',
        reviewRequestId: reviewRequest.id,
        isPublic: true,
        isApproved: rating >= 4, // Auto-approve 4-5 star reviews
        approvedAt: rating >= 4 ? new Date() : null,
      },
    });

    // Generate discount code (10% off next booking)
    const discountCode = generateDiscountCode();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3); // Valid for 3 months

    await prisma.discountCode.create({
      data: {
        code: discountCode,
        customerId: reviewRequest.customerId,
        reviewId: review.id,
        discountPercentage: 10,
        maxDiscountAmount: 50, // Max £50 discount
        expiresAt,
      },
    });

    // Update review request status
    await prisma.reviewRequest.update({
      where: { id: reviewRequest.id },
      data: {
        status: 'RESPONDED',
        respondedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      discountCode,
      review: {
        id: review.id,
        rating: review.rating,
      },
    });

  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit review' },
      { status: 500 }
    );
  }
}

/**
 * Generate unique discount code
 * Format: SV-XXXX-XXXX
 */
function generateDiscountCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SV-';
  
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return code;
}

// No caching for submissions
export const revalidate = 0;
