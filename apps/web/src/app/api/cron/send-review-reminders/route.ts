import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendReviewReminderSMS } from '@/lib/emails/review-email-service';

/**
 * Cron Job: Send SMS reminders for pending review requests
 * Trigger: Every 6 hours
 * Process: Find review requests sent 24 hours ago that haven't been responded to
 */
export async function GET(request: NextRequest) {
  // Security: Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find review requests sent 24 hours ago that haven't been responded to
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);

    const pendingRequests = await prisma.reviewRequest.findMany({
      where: {
        status: 'SENT', // Still pending response
        createdAt: {
          gte: twentyFiveHoursAgo, // Between 24-25 hours ago
          lte: twentyFourHoursAgo,
        },
      },
      include: {
        booking: {
          select: {
            customerName: true,
            customerPhone: true,
            reference: true,
          },
        },
      },
      take: 100, // Process max 100 per run
    });

    console.log(`Found ${pendingRequests.length} review requests eligible for SMS reminders`);

    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const request of pendingRequests) {
      try {
        results.processed++;

        // Skip if no phone number
        if (!request.booking.customerPhone) {
          results.skipped++;
          console.log(`⏭️  No phone number for booking ${request.booking.reference}`);
          continue;
        }

        // Send SMS reminder
        const smsSent = await sendReviewReminderSMS(
          request.booking.customerPhone,
          request.booking.customerName || 'Customer',
          request.token
        );

        if (smsSent) {
          // Update status to REMINDED
          await prisma.reviewRequest.update({
            where: { id: request.id },
            data: { status: 'REMINDED' },
          });
          results.sent++;
          console.log(`✅ Sent SMS reminder for booking ${request.booking.reference}`);
        } else {
          results.failed++;
          results.errors.push(`Failed to send SMS for booking ${request.booking.reference}`);
        }

      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Request ${request.id}: ${errorMsg}`);
        console.error(`❌ Error processing request ${request.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('SMS reminder cron job error:', error);
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
