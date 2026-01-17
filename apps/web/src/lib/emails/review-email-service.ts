import { generateReviewRequestEmail } from './review-request-template';

/**
 * Email Service for Review Requests
 * Uses SendGrid API
 */

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@speedy-van.co.uk';
const FROM_NAME = 'Speedy Van';

interface SendReviewRequestEmailParams {
  to: string;
  customerName: string;
  bookingReference: string;
  reviewToken: string;
  from: string;
  to_location: string;
  completedDate: string;
}

/**
 * Send review request email via SendGrid
 */
export async function sendReviewRequestEmail(params: SendReviewRequestEmailParams): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not configured');
    return false;
  }

  try {
    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://speedy-van.co.uk'}/reviews/submit?token=${params.reviewToken}`;

    const { subject, html, text } = generateReviewRequestEmail({
      customerName: params.customerName,
      bookingReference: params.bookingReference,
      reviewUrl,
      from: params.from,
      to: params.to_location,
      completedDate: params.completedDate,
    });

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: params.to, name: params.customerName }],
            subject,
          },
        ],
        from: {
          email: FROM_EMAIL,
          name: FROM_NAME,
        },
        content: [
          {
            type: 'text/plain',
            value: text,
          },
          {
            type: 'text/html',
            value: html,
          },
        ],
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true },
        },
        categories: ['review-request'],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SendGrid error:', error);
      return false;
    }

    console.log(`Review request email sent to ${params.to}`);
    return true;

  } catch (error) {
    console.error('Failed to send review request email:', error);
    return false;
  }
}

/**
 * Send review reminder SMS via Twilio (optional)
 */
export async function sendReviewReminderSMS(
  to: string,
  customerName: string,
  reviewToken: string
): Promise<boolean> {
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.warn('Twilio not configured, skipping SMS reminder');
    return false;
  }

  try {
    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://speedy-van.co.uk'}/reviews/submit?token=${reviewToken}`;
    
    const message = `Hi ${customerName}! 👋 We'd love your feedback on your recent Speedy Van move. Rate your experience and get 10% off your next booking: ${reviewUrl}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: to,
          From: TWILIO_PHONE_NUMBER,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio error:', error);
      return false;
    }

    console.log(`Review reminder SMS sent to ${to}`);
    return true;

  } catch (error) {
    console.error('Failed to send review reminder SMS:', error);
    return false;
  }
}

/**
 * Schedule review request to be sent after delay
 * This would typically be called from a job queue (e.g., Bull, Inngest)
 */
export async function scheduleReviewRequest(
  bookingId: string,
  delayMinutes: number = 120 // 2 hours default
): Promise<void> {
  // TODO: Integrate with job queue system
  // For now, we'll log it
  console.log(`Scheduled review request for booking ${bookingId} in ${delayMinutes} minutes`);
  
  // Example integration with a job queue:
  // await queue.add('send-review-request', { bookingId }, {
  //   delay: delayMinutes * 60 * 1000,
  // });
}
