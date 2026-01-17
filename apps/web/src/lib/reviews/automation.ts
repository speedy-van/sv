import { prisma } from '@/lib/prisma';
import { BookingStatus } from '@prisma/client';

/**
 * Automated Review Request System
 * 
 * Purpose: Close the massive review gap with AnyVan (2 vs 180k+ reviews)
 * 
 * Strategy:
 * 1. Send email 2 hours after booking completion
 * 2. Send SMS reminder after 24 hours if no review
 * 3. Offer 10% discount on next booking as incentive
 * 
 * Target: 500+ reviews in 6 months
 */

interface ReviewRequestConfig {
  emailDelay: number; // milliseconds
  smsDelay: number; // milliseconds
  incentiveEnabled: boolean;
  incentiveAmount: number; // percentage
}

const config: ReviewRequestConfig = {
  emailDelay: 2 * 60 * 60 * 1000, // 2 hours
  smsDelay: 24 * 60 * 60 * 1000, // 24 hours
  incentiveEnabled: true,
  incentiveAmount: 10, // 10% off
};

/**
 * Main function: Trigger after booking completion
 */
export async function triggerReviewRequest(bookingId: string): Promise<void> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        driver: true,
      },
    });

    if (!booking || booking.status !== BookingStatus.COMPLETED) {
      console.warn(`Booking ${bookingId} not eligible for review request`);
      return;
    }

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: { bookingId },
    });

    if (existingReview) {
      console.log(`Review already exists for booking ${bookingId}`);
      return;
    }

    // Schedule email request (2 hours delay)
    await scheduleEmailReviewRequest(booking);

    // Schedule SMS reminder (24 hours delay)
    await scheduleSMSReviewReminder(booking);

    console.log(`Review requests scheduled for booking ${bookingId}`);
  } catch (error) {
    console.error('Error triggering review request:', error);
  }
}

/**
 * Schedule email review request
 */
async function scheduleEmailReviewRequest(booking: any): Promise<void> {
  const trustpilotLink = generateTrustpilotReviewLink(booking.id);
  const googleReviewLink = generateGoogleReviewLink();

  // Create review request record
  await prisma.reviewRequest.create({
    data: {
      bookingId: booking.id,
      customerId: booking.customerId,
      type: 'EMAIL',
      scheduledFor: new Date(Date.now() + config.emailDelay),
      status: 'PENDING',
      metadata: {
        trustpilotLink,
        googleReviewLink,
        incentiveCode: config.incentiveEnabled
          ? generateIncentiveCode(booking.id)
          : null,
      },
    },
  });

  // TODO: Integrate with email service (SendGrid, Resend, etc.)
  // For now, log to console
  console.log(`Email review request scheduled for ${booking.customer.email}`);
}

/**
 * Schedule SMS review reminder
 */
async function scheduleSMSReviewReminder(booking: any): Promise<void> {
  const shortLink = generateShortReviewLink(booking.id);

  await prisma.reviewRequest.create({
    data: {
      bookingId: booking.id,
      customerId: booking.customerId,
      type: 'SMS',
      scheduledFor: new Date(Date.now() + config.smsDelay),
      status: 'PENDING',
      metadata: {
        shortLink,
        incentiveCode: config.incentiveEnabled
          ? generateIncentiveCode(booking.id)
          : null,
      },
    },
  });

  console.log(`SMS review reminder scheduled for ${booking.customer.phone}`);
}

/**
 * Generate Trustpilot review link with tracking
 */
function generateTrustpilotReviewLink(bookingId: string): string {
  // Replace with your actual Trustpilot business unit ID
  const trustpilotBusinessId = 'your-business-id';
  const referenceId = bookingId;

  return `https://www.trustpilot.com/evaluate/${trustpilotBusinessId}?ref=${referenceId}`;
}

/**
 * Generate Google review link
 */
function generateGoogleReviewLink(): string {
  // Replace with your Google Business Profile place ID
  const placeId = 'your-google-place-id';

  return `https://search.google.com/local/writereview?placeid=${placeId}`;
}

/**
 * Generate short review link (using URL shortener)
 */
function generateShortReviewLink(bookingId: string): string {
  // TODO: Integrate with URL shortener (Bitly, TinyURL, etc.)
  // For now, return full link
  return `https://speedy-van.co.uk/review/${bookingId}`;
}

/**
 * Generate unique incentive code
 */
function generateIncentiveCode(bookingId: string): string {
  const prefix = 'REVIEW';
  const uniquePart = bookingId.substring(0, 8).toUpperCase();
  return `${prefix}${config.incentiveAmount}${uniquePart}`;
}

/**
 * Process pending review requests (run via cron job)
 */
export async function processPendingReviewRequests(): Promise<void> {
  const now = new Date();

  const pendingRequests = await prisma.reviewRequest.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: {
        lte: now,
      },
    },
    include: {
      booking: {
        include: {
          customer: true,
        },
      },
    },
  });

  console.log(`Processing ${pendingRequests.length} pending review requests`);

  for (const request of pendingRequests) {
    try {
      if (request.type === 'EMAIL') {
        await sendReviewEmail(request);
      } else if (request.type === 'SMS') {
        await sendReviewSMS(request);
      }

      // Mark as sent
      await prisma.reviewRequest.update({
        where: { id: request.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`Failed to send review request ${request.id}:`, error);
      
      // Mark as failed
      await prisma.reviewRequest.update({
        where: { id: request.id },
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}

/**
 * Send review request email
 */
async function sendReviewEmail(request: any): Promise<void> {
  const { booking, metadata } = request;
  const { customer } = booking;

  const emailContent = {
    to: customer.email,
    subject: '⭐ How was your move with Speedy Van?',
    template: 'review-request',
    data: {
      customerName: customer.name,
      bookingReference: booking.reference,
      trustpilotLink: metadata.trustpilotLink,
      googleReviewLink: metadata.googleReviewLink,
      incentiveCode: metadata.incentiveCode,
      incentiveAmount: config.incentiveAmount,
    },
  };

  // TODO: Integrate with email service
  console.log('Sending review email:', emailContent);
}

/**
 * Send review request SMS
 */
async function sendReviewSMS(request: any): Promise<void> {
  const { booking, metadata } = request;
  const { customer } = booking;

  const message = config.incentiveEnabled
    ? `Hi ${customer.name}! Thanks for choosing Speedy Van. Please leave us a review: ${metadata.shortLink} - Get ${config.incentiveAmount}% off your next booking! 🚚`
    : `Hi ${customer.name}! Thanks for choosing Speedy Van. Please leave us a review: ${metadata.shortLink} ⭐`;

  // TODO: Integrate with SMS service (Twilio, etc.)
  console.log('Sending review SMS to', customer.phone, ':', message);
}

/**
 * Handle review submission (webhook from Trustpilot/Google)
 */
export async function handleReviewSubmission(
  bookingId: string,
  platform: 'TRUSTPILOT' | 'GOOGLE',
  rating: number,
  comment?: string
): Promise<void> {
  try {
    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: { bookingId, platform },
    });

    if (existingReview) {
      console.log(`Review already recorded for booking ${bookingId} on ${platform}`);
      return;
    }

    // Create review record
    await prisma.review.create({
      data: {
        bookingId,
        platform,
        rating,
        comment: comment || null,
        verified: true,
        publishedAt: new Date(),
      },
    });

    // Mark review request as completed
    await prisma.reviewRequest.updateMany({
      where: { bookingId },
      data: { status: 'COMPLETED' },
    });

    // If incentive enabled, create discount code
    if (config.incentiveEnabled) {
      await createReviewIncentive(bookingId);
    }

    console.log(`Review recorded for booking ${bookingId} on ${platform}: ${rating}★`);
  } catch (error) {
    console.error('Error handling review submission:', error);
  }
}

/**
 * Create incentive discount code for reviewer
 */
async function createReviewIncentive(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { customerId: true },
  });

  if (!booking) return;

  const code = generateIncentiveCode(bookingId);

  await prisma.discountCode.create({
    data: {
      code,
      type: 'PERCENTAGE',
      value: config.incentiveAmount,
      maxUses: 1,
      usedCount: 0,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      customerId: booking.customerId,
      reason: 'REVIEW_INCENTIVE',
    },
  });

  console.log(`Discount code ${code} created for booking ${bookingId}`);
}
