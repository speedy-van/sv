import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';
import { sendReviewRequestEmail } from '@/lib/emails/review-email-service';
import { randomBytes } from 'crypto';

/**
 * Cron Job: Send review requests for completed bookings
 * Trigger: Every hour
 * Process: Find bookings completed 2 hours ago that don't have review requests yet
 */
export async function GET(request: NextRequest) {
  // Security: Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find completed bookings from 2 hours ago that don't have review requests
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    const eligibleBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        actualDeliveryTime: {
          gte: threeHoursAgo, // Between 2-3 hours ago
          lte: twoHoursAgo,
        },
        reviewRequests: {
          none: {}, // No existing review requests
        },
        customerEmail: {
          not: null,
        },
      },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
      },
      take: 50, // Process max 50 per run to avoid timeouts
    });

    console.log(`Found ${eligibleBookings.length} bookings eligible for review requests`);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const booking of eligibleBookings) {
      try {
        results.processed++;

        // Generate unique token
        const token = randomBytes(32).toString('hex');

        // Create review request record
        const reviewRequest = await prisma.reviewRequest.create({
          data: {
            bookingId: booking.id,
            userId: booking.customerId || undefined,
            token,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            status: 'PENDING',
          },
        });

        // Extract city names from addresses
        const fromCity = booking.pickupAddress?.label?.split(',')[0]?.trim() || 'your location';
        const toCity = booking.dropoffAddress?.label?.split(',')[0]?.trim() || 'destination';

        // Send email
        const emailSent = await sendReviewRequestEmail({
          to: booking.customerEmail!,
          customerName: booking.customerName || 'Customer',
          bookingReference: booking.reference,
          reviewToken: token,
          from: fromCity,
          to_location: toCity,
          completedDate: booking.actualDeliveryTime?.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }) || 'recently',
        });

        if (emailSent) {
          // Update status to SENT
          await prisma.reviewRequest.update({
            where: { id: reviewRequest.id },
            data: { status: 'SENT' },
          });
          results.sent++;
          console.log(`✅ Sent review request for booking ${booking.reference}`);
        } else {
          results.failed++;
          results.errors.push(`Failed to send email for booking ${booking.reference}`);
        }

      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Booking ${booking.reference}: ${errorMsg}`);
        console.error(`❌ Error processing booking ${booking.reference}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// For local testing - POST endpoint
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return GET(request);
}
