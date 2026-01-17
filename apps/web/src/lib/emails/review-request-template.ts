/**
 * Review Request Email Template
 * 
 * Purpose: Request customer reviews 2 hours after booking completion
 * Incentive: 10% discount code for next booking
 */

interface ReviewRequestEmailProps {
  customerName: string;
  bookingReference: string;
  reviewUrl: string;
  from: string;
  to: string;
  completedDate: string;
}

export function generateReviewRequestEmail({
  customerName,
  bookingReference,
  reviewUrl,
  from,
  to,
  completedDate,
}: ReviewRequestEmailProps): { subject: string; html: string; text: string } {
  
  const subject = `How was your move? 🌟 Get 10% off your next booking`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rate Your Move - Speedy Van</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #00C2FF 0%, #0080FF 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      color: #ffffff;
      font-size: 32px;
      font-weight: bold;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 20px;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #555;
      margin-bottom: 30px;
    }
    .booking-details {
      background-color: #f8f9fa;
      border-left: 4px solid #00C2FF;
      padding: 20px;
      margin-bottom: 30px;
      border-radius: 4px;
    }
    .booking-details-title {
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    .booking-details-item {
      font-size: 14px;
      color: #666;
      margin: 5px 0;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #00C2FF 0%, #0080FF 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      text-align: center;
      margin: 20px 0;
      box-shadow: 0 4px 15px rgba(0, 194, 255, 0.3);
    }
    .incentive-box {
      background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      margin: 30px 0;
    }
    .incentive-text {
      color: #1a1a1a;
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }
    .incentive-subtext {
      color: #333;
      font-size: 14px;
      margin-top: 5px;
    }
    .stars {
      text-align: center;
      margin: 30px 0;
    }
    .star {
      font-size: 40px;
      color: #FFD700;
      margin: 0 5px;
    }
    .footer {
      background-color: #1a1a1a;
      color: #999;
      padding: 30px;
      text-align: center;
      font-size: 14px;
    }
    .footer a {
      color: #00C2FF;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .greeting {
        font-size: 20px;
      }
      .cta-button {
        display: block;
        padding: 14px 30px;
        font-size: 16px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1 class="logo">🚚 Speedy Van</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <h2 class="greeting">Hi ${customerName}! 👋</h2>
      
      <p class="message">
        Thank you for choosing Speedy Van! We hope your move went smoothly. 
        We'd love to hear about your experience.
      </p>

      <!-- Booking Details -->
      <div class="booking-details">
        <div class="booking-details-title">Your Move Details:</div>
        <div class="booking-details-item"><strong>Reference:</strong> ${bookingReference}</div>
        <div class="booking-details-item"><strong>From:</strong> ${from}</div>
        <div class="booking-details-item"><strong>To:</strong> ${to}</div>
        <div class="booking-details-item"><strong>Completed:</strong> ${completedDate}</div>
      </div>

      <!-- Stars -->
      <div class="stars">
        <span class="star">⭐</span>
        <span class="star">⭐</span>
        <span class="star">⭐</span>
        <span class="star">⭐</span>
        <span class="star">⭐</span>
      </div>

      <!-- CTA Button -->
      <center>
        <a href="${reviewUrl}" class="cta-button">
          Rate Your Move
        </a>
      </center>

      <!-- Incentive Box -->
      <div class="incentive-box">
        <p class="incentive-text">🎁 Get 10% OFF Your Next Booking!</p>
        <p class="incentive-subtext">
          Submit your review and receive a discount code instantly
        </p>
      </div>

      <p class="message" style="font-size: 14px; color: #777; margin-top: 30px;">
        Your feedback helps us improve our service and helps other customers make informed decisions. 
        It only takes 2 minutes! ⏱️
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>Speedy Van - Professional Moving Services</p>
      <p>
        <a href="https://speedy-van.co.uk">Visit our website</a> | 
        <a href="https://speedy-van.co.uk/contact">Contact us</a>
      </p>
      <p style="font-size: 12px; margin-top: 20px;">
        You received this email because you recently completed a booking with Speedy Van.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Hi ${customerName}!

Thank you for choosing Speedy Van! We hope your move went smoothly.

Your Move Details:
- Reference: ${bookingReference}
- From: ${from}
- To: ${to}
- Completed: ${completedDate}

We'd love to hear about your experience. Please take 2 minutes to rate your move:

${reviewUrl}

🎁 BONUS: Get 10% OFF your next booking when you submit your review!

Your feedback helps us improve our service and helps other customers make informed decisions.

Thank you!
Speedy Van Team

---
Visit our website: https://speedy-van.co.uk
Contact us: https://speedy-van.co.uk/contact
  `.trim();

  return { subject, html, text };
}
