export interface OrderConfirmationData {
  customerEmail: string;
  orderNumber: string;
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledDate: string;
  totalAmount: number;
  currency: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface PaymentConfirmationData {
  customerEmail: string;
  orderNumber: string;
  customerName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
}

export interface OrderCancellationData {
  customerEmail: string;
  orderNumber: string;
  customerName: string;
  reason: string;
  refundAmount?: number;
  currency?: string;
}

export interface FloorWarningData {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  pickupFloorIssue: boolean;
  dropoffFloorIssue: boolean;
  pickupLiftAvailable?: boolean;
  dropoffLiftAvailable?: boolean;
}

export interface DriverApplicationConfirmationData {
  driverEmail: string;
  driverName: string;
  applicationId: string;
  appliedAt: string;
}

export interface DriverApplicationStatusData {
  driverEmail: string;
  driverName: string;
  applicationId: string;
  status: 'approved' | 'rejected' | 'requires_additional_info';
  rejectionReason?: string;
  reviewedAt: string;
  nextSteps?: string[];
}

export interface AdminWelcomeData {
  adminEmail: string;
  adminName: string;
  adminRole: string;
  loginUrl: string;
  createdBy: string;
  createdAt: string;
}

export interface TrustpilotFeedbackData {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  completedDate: string;
  serviceType: string;
  totalAmount: number;
  currency: string;
  trustpilotUrl: string;
}

interface EmailResult {
  success: boolean;
  error: string | null;
  messageId: string | null;
  provider: string;
}

// Email provider configurations
const emailConfig = {
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.MAIL_FROM || 'noreply@speedy-van.co.uk'
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    from: process.env.MAIL_FROM || 'noreply@speedy-van.co.uk'
  }
};

// Resend implementation
async function sendViaResend(to: string, subject: string, html: string): Promise<EmailResult> {
  if (!emailConfig.resend.apiKey) {
    throw new Error('Resend API key not configured');
  }

  try {
    const payload = {
      from: `Speedy Van <${emailConfig.resend.from}>`,
      to: [to],
      subject,
      html,
      // Add headers for better deliverability
      headers: {
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'X-Mailer': 'Speedy Van Email System',
        'X-Entity-Ref-ID': `speedy-van-${Date.now()}`,
        'List-Unsubscribe': '<mailto:unsubscribe@speedy-van.co.uk>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
      },
      // Add reply-to for better deliverability
      reply_to: 'support@speedy-van.co.uk',
      // Add tags for tracking
      tags: [
        { name: 'service', value: 'transactional' },
        { name: 'source', value: 'speedy-van-system' }
      ]
    };

    console.log('📧 ===== RESEND API DEBUG =====');
    console.log('📧 Resend payload:', {
      to,
      subject,
      from: emailConfig.resend.from
    });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${emailConfig.resend.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    console.log('📧 Resend response status:', response.status);
    console.log('📧 Resend response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.text();
      console.error('📧 ===== RESEND API ERROR =====');
      console.error('📧 Status:', response.status);
      console.error('📧 Status Text:', response.statusText);
      console.error('📧 Error Data:', errorData);
      console.error('📧 ===== END RESEND ERROR =====');
      throw new Error(`Resend API error: ${response.status} - ${errorData}`);
    }

    const result = await response.json();
    console.log('📧 ===== RESEND SUCCESS RESULT =====');
    console.log('📧 Resend success result:', result);
    console.log('📧 Message ID:', result.id || 'No message ID');
    console.log('📧 ===== END RESEND SUCCESS =====');
    
    return {
      success: true,
      error: null,
      messageId: result.id || `resend-${Date.now()}`,
      provider: 'resend'
    };
  } catch (error) {
    console.error('Resend send error:', error);
    throw error;
  }
}

// SendGrid implementation (fallback)
async function sendViaSendGrid(to: string, subject: string, html: string): Promise<EmailResult> {
  if (!emailConfig.sendgrid.apiKey) {
    throw new Error('SendGrid API key not configured');
  }

  const sgMail = (await import('@sendgrid/mail')).default;
  sgMail.setApiKey(emailConfig.sendgrid.apiKey);

  try {
    const msg = {
      to,
      from: `Speedy Van <${emailConfig.sendgrid.from}>`,
      subject,
      html,
      replyTo: 'support@speedy-van.co.uk'
    };

    console.log('SendGrid message:', { to, from: `Speedy Van <${emailConfig.sendgrid.from}>`, subject });
    const result = await sgMail.send(msg);
    console.log('SendGrid result:', result);
    return {
      success: true,
      error: null,
      messageId: result[0]?.headers?.['x-message-id'] || `sg-${Date.now()}`,
      provider: 'sendgrid'
    };
  } catch (error) {
    console.error('SendGrid send error:', error);
    throw error;
  }
}


// Main email sending function with fallback
async function sendEmail(to: string, subject: string, html: string): Promise<EmailResult> {
  const errors: string[] = [];

  // Try Resend first if configured (primary provider)
  console.log('📧 Checking Resend configuration:', {
    hasApiKey: !!emailConfig.resend.apiKey,
    keyLength: emailConfig.resend.apiKey?.length || 0,
    keyStart: emailConfig.resend.apiKey?.substring(0, 20) || 'NOT_SET',
    from: emailConfig.resend.from
  });

  if (emailConfig.resend.apiKey) {
    try {
      console.log('📧 Attempting to send email via Resend...');
      return await sendViaResend(to, subject, html);
    } catch (error) {
      const errorMsg = `Resend failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.warn('⚠️', errorMsg);
      console.error('📧 Resend error details:', error);
      errors.push(errorMsg);
    }
  } else {
    console.log('📧 Resend not configured');
    errors.push('Resend not configured');
  }

  // Try SendGrid as fallback if configured and not previously failed
  if (emailConfig.sendgrid.apiKey && !errors.some(err => err.includes('Unauthorized'))) {
    try {
      console.log('📧 Attempting to send email via SendGrid...');
      return await sendViaSendGrid(to, subject, html);
    } catch (error) {
      const isError = error instanceof Error;
      const errorMsg = `SendGrid failed: ${isError ? (error as Error).message : String(error)}`;
      console.warn('⚠️', errorMsg);
      errors.push(errorMsg);

      // If it's an auth error, don't retry SendGrid
      if (isError && (error as Error).message.includes('Unauthorized')) {
        console.warn('SendGrid auth failed, skipping SendGrid');
      }
    }
  }

  // If both providers failed or are not configured
  return {
    success: false,
    error: `All email providers failed: ${errors.join('; ')}`,
    messageId: null,
    provider: 'none'
  };
}

// HTML email templates
function generateOrderConfirmationHTML(data: OrderConfirmationData): string {
  const itemsHTML = data.items?.map(item =>
    `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">£${item.price.toFixed(2)}</td>
    </tr>`
  ).join('') || '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - ${data.orderNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #007bff; margin: 0;">Speedy Van</h1>
          <h2 style="margin: 10px 0;">Order Confirmation</h2>
        </div>

        <div style="background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
          <p>Dear ${data.customerName},</p>

          <p>Thank you for choosing Speedy Van! Your order has been confirmed.</p>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Order Details:</strong><br>
            <strong>Order Number:</strong> ${data.orderNumber}<br>
            <strong>Scheduled Date:</strong> ${data.scheduledDate}<br>
            <strong>Total Amount:</strong> ${data.currency}${data.totalAmount.toFixed(2)}
          </div>

          <div style="margin: 20px 0;">
            <strong>Pickup Address:</strong><br>
            ${data.pickupAddress.replace(/\n/g, '<br>')}
          </div>

          <div style="margin: 20px 0;">
            <strong>Dropoff Address:</strong><br>
            ${data.dropoffAddress.replace(/\n/g, '<br>')}
          </div>

          ${data.items && data.items.length > 0 ? `
          <div style="margin: 20px 0;">
            <strong>Items:</strong>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
                  <th style="padding: 8px; text-align: center; border-bottom: 2px solid #dee2e6;">Quantity</th>
                  <th style="padding: 8px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
          </div>
          ` : ''}

          <p>If you have any questions about your order, please contact our support team at support@speedy-van.co.uk or call 07901 846297.</p>

          <p>Best regards,<br>The Speedy Van Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>Speedy Van - Professional Moving Services<br>
          Email: support@speedy-van.co.uk | Phone: 07901 846297</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePaymentConfirmationHTML(data: PaymentConfirmationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Confirmation - ${data.orderNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #007bff; margin: 0;">Speedy Van</h1>
          <h2 style="margin: 10px 0;">Payment Confirmation</h2>
        </div>

        <div style="background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
          <p>Dear ${data.customerName},</p>

          <p>Thank you for your payment! Your transaction has been processed successfully.</p>

          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Payment Details:</strong><br>
            <strong>Order Number:</strong> ${data.orderNumber}<br>
            <strong>Amount:</strong> ${data.currency}${data.amount.toFixed(2)}<br>
            <strong>Payment Method:</strong> ${data.paymentMethod}<br>
            <strong>Transaction ID:</strong> ${data.transactionId}
          </div>

          <p>You will receive a separate email with your order details and moving instructions.</p>

          <p>If you have any questions, please contact our support team.</p>

          <p>Best regards,<br>The Speedy Van Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>Speedy Van - Professional Moving Services<br>
          Email: support@speedy-van.co.uk | Phone: 07901 846297</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePasswordResetHTML(data: { email: string; resetUrl: string; driverName?: string; resetToken?: string; customerName?: string }): string {
  const name = data.driverName || data.customerName || 'User';
  const portalType = data.driverName ? 'Driver Portal' : 'Customer Portal';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Password Reset - Speedy Van</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #007bff; margin: 0;">Speedy Van</h1>
          <h2 style="margin: 10px 0;">Password Reset</h2>
        </div>

        <div style="background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
          <p>Dear ${name},</p>

          <p>You have requested to reset your password for your Speedy Van driver account.</p>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Click the button below to reset your password:</strong></p>
            <p style="text-align: center; margin: 20px 0;">
              <a href="${data.resetUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </p>
            <p><strong>Or copy and paste this link into your browser:</strong></p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 3px;">${data.resetUrl}</p>
          </div>

          <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>

          <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>

          <p>If you have any questions, please contact our support team.</p>

          <p>Best regards,<br>The Speedy Van Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>Speedy Van - Professional Moving Services<br>
          Email: support@speedy-van.co.uk | Phone: 07901 846297</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateTrustpilotFeedbackHTML(data: TrustpilotFeedbackData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Share Your Experience - Speedy Van</title>
      <style>
        @media only screen and (max-width: 600px) {
          .container { padding: 10px !important; }
          .header { padding: 15px !important; }
          .content { padding: 15px !important; }
        }
      </style>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div class="header" style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px 20px; text-align: center;">
          <div style="background: white; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
            <span style="font-size: 40px;">⭐</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Speedy Van</h1>
          <h2 style="margin: 8px 0 0 0; color: #e8f4fd; font-weight: 300; font-size: 18px;">Your Experience Matters</h2>
        </div>

        <!-- Main Content -->
        <div class="content" style="padding: 40px 30px;">
          
          <!-- Thank You Message -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 28px; font-weight: 500;">Thank You for Choosing Speedy Van! 🙏</h2>
            <p style="font-size: 18px; color: #5a6c7d; margin: 0; line-height: 1.5;">
              We hope you had a great experience with our service. Your feedback helps us improve and helps other customers make informed decisions.
            </p>
          </div>

          <!-- Service Summary -->
          <div style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="margin: 0 0 20px 0; color: #495057; font-size: 20px; font-weight: 600; text-align: center;">📋 Your Service Summary</h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                <span style="font-weight: 600; color: #6c757d;">Order Number:</span>
                <span style="color: #2c3e50; font-weight: 500;">${data.orderNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                <span style="font-weight: 600; color: #6c757d;">Service Type:</span>
                <span style="color: #2c3e50; font-weight: 500;">${data.serviceType}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                <span style="font-weight: 600; color: #6c757d;">Completed Date:</span>
                <span style="color: #2c3e50; font-weight: 500;">${new Date(data.completedDate).toLocaleDateString('en-GB', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
                <span style="font-weight: 600; color: #6c757d;">Total Amount:</span>
                <span style="color: #2c3e50; font-weight: 500;">${data.currency}${data.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <!-- Trustpilot CTA -->
          <div style="background: linear-gradient(135deg, #00b67a 0%, #00a86b 100%); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center; box-shadow: 0 4px 15px rgba(0, 182, 122, 0.3);">
            <h3 style="margin: 0 0 15px 0; color: white; font-size: 24px; font-weight: 600;">⭐ Share Your Experience</h3>
            <p style="margin: 0 0 25px 0; color: white; font-size: 16px; line-height: 1.6;">
              Help us improve our service and help other customers by sharing your experience on Trustpilot.
            </p>
            <div style="margin: 25px 0;">
              <a href="${data.trustpilotUrl}" style="background: white; color: #00b67a; padding: 16px 35px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 18px; box-shadow: 0 4px 15px rgba(255,255,255,0.3); transition: all 0.3s ease;" target="_blank">
                🏆 Leave a Review on Trustpilot
              </a>
            </div>
            <p style="margin: 15px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
              Takes less than 2 minutes • Helps other customers • Improves our service
            </p>
          </div>

          <!-- Why Reviews Matter -->
          <div style="background: linear-gradient(135deg, #fff3cd 0%, #fef9e7 100%); border: 2px solid #ffeaa7; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #856404; font-size: 20px; font-weight: 600; text-align: center;">💝 Why Your Review Matters</h3>
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; align-items: flex-start; gap: 15px;">
                <div style="background: #856404; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; margin-top: 2px;">1</div>
                <div>
                  <p style="margin: 0; color: #2c3e50; font-weight: 600;">Helps Other Customers</p>
                  <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Your honest feedback helps future customers make informed decisions</p>
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 15px;">
                <div style="background: #856404; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; margin-top: 2px;">2</div>
                <div>
                  <p style="margin: 0; color: #2c3e50; font-weight: 600;">Improves Our Service</p>
                  <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">We use your feedback to continuously improve our moving services</p>
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 15px;">
                <div style="background: #856404; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; margin-top: 2px;">3</div>
                <div>
                  <p style="margin: 0; color: #2c3e50; font-weight: 600;">Builds Trust</p>
                  <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Your review helps build trust in our professional moving services</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Alternative Feedback -->
          <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #495057; font-size: 20px; font-weight: 600; text-align: center;">📞 Other Ways to Share Feedback</h3>
            <div style="display: grid; gap: 15px; text-align: center;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                <span style="font-size: 20px;">📧</span>
                <a href="mailto:support@speedy-van.co.uk" style="color: #1976d2; font-weight: 600; text-decoration: none; font-size: 16px;">support@speedy-van.co.uk</a>
              </div>
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                <span style="font-size: 20px;">📞</span>
                <a href="tel:+441202129746" style="color: #1976d2; font-weight: 600; text-decoration: none; font-size: 16px;">+44 1202129746</a>
              </div>
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                <span style="font-size: 20px;">🌐</span>
                <a href="https://speedy-van.co.uk/" style="color: #1976d2; font-weight: 600; text-decoration: none; font-size: 16px;" target="_blank">speedy-van.co.uk</a>
              </div>
            </div>
          </div>

          <!-- Thank You Message -->
          <div style="background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
            <h3 style="margin: 0 0 15px 0; color: #1976d2; font-size: 20px; font-weight: 600;">💝 Thank You for Your Trust</h3>
            <p style="margin: 0; color: #2c3e50; font-size: 16px; line-height: 1.6;">
              We truly appreciate your business and look forward to serving you again in the future. Your feedback is invaluable to us.
            </p>
          </div>

          <!-- Signature -->
          <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #e9ecef; text-align: center;">
            <p style="margin: 0; font-size: 16px; color: #495057; line-height: 1.6;">
              With sincere appreciation,<br>
              <strong style="color: #2c3e50; font-size: 18px; font-weight: 600;">The Speedy Van Team</strong>
            </p>
            <p style="margin: 15px 0 0 0; font-size: 14px; color: #6c757d; font-style: italic;">
              "Excellence in every delivery, trust in every interaction"
            </p>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: #2c3e50; color: white; padding: 25px; text-align: center;">
          <div style="margin-bottom: 15px;">
            <a href="https://speedy-van.co.uk/" style="color: #e8f4fd; text-decoration: none; font-size: 16px; font-weight: 600;" target="_blank">
              🌐 Visit Our Website: speedy-van.co.uk
            </a>
          </div>
          <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 500;">© ${new Date().getFullYear()} Speedy Van. All rights reserved.</p>
          <p style="margin: 0 0 10px 0; font-size: 12px; opacity: 0.9;">SPEEDY VAN REMOVALS LTD • Company No. SC865658 • Registered in Scotland</p>
          <p style="margin: 0 0 10px 0; font-size: 12px; opacity: 0.9;">Professional Moving Services • Fully Insured • 5-Star Rated • 24/7 Support</p>
          <p style="margin: 0; font-size: 12px; opacity: 0.8;">Office 2.18 1 Barrack St, Hamilton ML3 0HS, United Kingdom</p>
        </div>

      </div>
    </body>
    </html>
  `;
}

function generateAdminWelcomeHTML(data: AdminWelcomeData): string {
  const roleDisplayNames: Record<string, string> = {
    'superadmin': 'Super Administrator',
    'ops': 'Operations Manager',
    'support': 'Support Specialist',
    'read_only': 'Read-Only User',
    'reviewer': 'Reviewer',
    'finance': 'Finance Manager'
  };

  const roleDisplayName = roleDisplayNames[data.adminRole] || data.adminRole;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Speedy Van Admin Portal</title>
      <style>
        @media only screen and (max-width: 600px) {
          .container { padding: 10px !important; }
          .header { padding: 15px !important; }
          .content { padding: 15px !important; }
        }
      </style>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div class="header" style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 30px 20px; text-align: center; border-radius: 0;">
          <div style="background: white; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
            <span style="font-size: 40px;">🚐</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 600; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Speedy Van</h1>
          <h2 style="margin: 8px 0 0 0; color: #e8f4fd; font-weight: 300; font-size: 18px; letter-spacing: 1px;">Administrative Portal</h2>
        </div>

        <!-- Main Content -->
        <div class="content" style="padding: 40px 30px;">
          
          <!-- Welcome Message -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 28px; font-weight: 500;">Welcome to Our Team, ${data.adminName}! ✨</h2>
            <p style="font-size: 18px; color: #5a6c7d; margin: 0; line-height: 1.5;">
              We are absolutely delighted to have you join the Speedy Van family. Your expertise and dedication will be invaluable to our mission of providing exceptional service.
            </p>
          </div>

          <!-- Personal Touch -->
          <div style="background: linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%); border-left: 5px solid #27ae60; padding: 25px; margin: 25px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h3 style="margin: 0 0 15px 0; color: #27ae60; font-size: 20px; font-weight: 600;">🌟 Your Professional Journey Begins</h3>
            <p style="margin: 0; color: #2c3e50; font-size: 16px; line-height: 1.6;">
              We believe that great teams are built on trust, collaboration, and mutual respect. Your role as <strong>${roleDisplayName}</strong> is crucial to our continued success, and we're confident you'll make a significant impact.
            </p>
          </div>

          <!-- Account Details -->
          <div style="background: #f8f9fa; border: 2px solid #e9ecef; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="margin: 0 0 20px 0; color: #495057; font-size: 20px; font-weight: 600; text-align: center;">📋 Your Account Information</h3>
            <div style="display: grid; gap: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                <span style="font-weight: 600; color: #6c757d;">Full Name:</span>
                <span style="color: #2c3e50; font-weight: 500;">${data.adminName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                <span style="font-weight: 600; color: #6c757d;">Email Address:</span>
                <span style="color: #2c3e50; font-weight: 500;">${data.adminEmail}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                <span style="font-weight: 600; color: #6c757d;">Position:</span>
                <span style="color: #2c3e50; font-weight: 500;">${roleDisplayName}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #dee2e6;">
                <span style="font-weight: 600; color: #6c757d;">Account Created:</span>
                <span style="color: #2c3e50; font-weight: 500;">${data.createdAt}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0;">
                <span style="font-weight: 600; color: #6c757d;">Invited By:</span>
                <span style="color: #2c3e50; font-weight: 500;">${data.createdBy}</span>
              </div>
            </div>
          </div>

          <!-- Next Steps -->
          <div style="background: linear-gradient(135deg, #fff3cd 0%, #fef9e7 100%); border: 2px solid #ffeaa7; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="margin: 0 0 20px 0; color: #856404; font-size: 20px; font-weight: 600; text-align: center;">🚀 Your First Steps</h3>
            <div style="display: grid; gap: 15px;">
              <div style="display: flex; align-items: flex-start; gap: 15px;">
                <div style="background: #856404; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; margin-top: 2px;">1</div>
                <div>
                  <p style="margin: 0; color: #2c3e50; font-weight: 600;">Access Your Portal</p>
                  <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Click the button below to access your personalized admin dashboard</p>
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 15px;">
                <div style="background: #856404; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; margin-top: 2px;">2</div>
                <div>
                  <p style="margin: 0; color: #2c3e50; font-weight: 600;">Secure Your Account</p>
                  <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Set up a strong password and enable two-factor authentication for enhanced security</p>
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 15px;">
                <div style="background: #856404; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; margin-top: 2px;">3</div>
                <div>
                  <p style="margin: 0; color: #2c3e50; font-weight: 600;">Complete Your Profile</p>
                  <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Add your professional information and preferences to personalize your experience</p>
                </div>
              </div>
              <div style="display: flex; align-items: flex-start; gap: 15px;">
                <div style="background: #856404; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; margin-top: 2px;">4</div>
                <div>
                  <p style="margin: 0; color: #2c3e50; font-weight: 600;">Explore & Learn</p>
                  <p style="margin: 5px 0 0 0; color: #6c757d; font-size: 14px;">Familiarize yourself with our tools and reach out if you need any assistance</p>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${data.loginUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 35px; text-decoration: none; border-radius: 50px; display: inline-block; font-weight: 600; font-size: 18px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
              🎯 Access Your Portal
            </a>
            <p style="margin: 15px 0 0 0; color: #6c757d; font-size: 14px;">
              Your login email: <strong>${data.adminEmail}</strong>
            </p>
          </div>

          <!-- Features -->
          <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="margin: 0 0 20px 0; color: #495057; font-size: 20px; font-weight: 600; text-align: center;">🛠️ What You Can Do</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
                <p style="margin: 0; font-weight: 600; color: #2c3e50;">Analytics & Reports</p>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="font-size: 24px; margin-bottom: 8px;">👥</div>
                <p style="margin: 0; font-weight: 600; color: #2c3e50;">Team Management</p>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="font-size: 24px; margin-bottom: 8px;">🎯</div>
                <p style="margin: 0; font-weight: 600; color: #2c3e50;">Operations Control</p>
              </div>
              <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="font-size: 24px; margin-bottom: 8px;">🔧</div>
                <p style="margin: 0; font-weight: 600; color: #2c3e50;">System Settings</p>
              </div>
            </div>
          </div>

          <!-- Support -->
          <div style="background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); border-radius: 12px; padding: 25px; margin: 25px 0;">
            <h3 style="margin: 0 0 15px 0; color: #1976d2; font-size: 20px; font-weight: 600; text-align: center;">💝 We're Here to Help</h3>
            <p style="margin: 0 0 20px 0; color: #2c3e50; text-align: center; font-size: 16px;">
              Our support team is always ready to assist you. Don't hesitate to reach out if you have any questions or need guidance.
            </p>
            <div style="display: grid; gap: 15px; text-align: center;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                <span style="font-size: 20px;">📧</span>
                <a href="mailto:support@speedy-van.co.uk" style="color: #1976d2; font-weight: 600; text-decoration: none; font-size: 16px;">support@speedy-van.co.uk</a>
              </div>
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                <span style="font-size: 20px;">📞</span>
                <a href="tel:+441202129746" style="color: #1976d2; font-weight: 600; text-decoration: none; font-size: 16px;">+44 1202129746</a>
              </div>
              <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
                <span style="font-size: 20px;">🌐</span>
                <a href="https://speedy-van.co.uk/" style="color: #1976d2; font-weight: 600; text-decoration: none; font-size: 16px;" target="_blank">speedy-van.co.uk</a>
              </div>
            </div>
            <div style="margin-top: 20px; text-align: center;">
              <a href="https://speedy-van.co.uk/" style="background: #1976d2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 25px; display: inline-block; font-weight: 600; font-size: 14px; box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);" target="_blank">
                🌟 Visit Our Website
              </a>
            </div>
          </div>

          <!-- Closing Message -->
          <div style="background: linear-gradient(135deg, #fff8e1 0%, #fffbf0 100%); border: 2px solid #ffcc02; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
            <h3 style="margin: 0 0 15px 0; color: #f57c00; font-size: 20px; font-weight: 600;">🎉 Welcome Aboard!</h3>
            <p style="margin: 0; color: #2c3e50; font-size: 16px; line-height: 1.6;">
              We are genuinely excited about the value you'll bring to our team. Your success is our success, and we're committed to providing you with all the tools and support you need to excel in your role.
            </p>
          </div>

          <!-- Signature -->
          <div style="margin-top: 40px; padding-top: 25px; border-top: 2px solid #e9ecef; text-align: center;">
            <p style="margin: 0; font-size: 16px; color: #495057; line-height: 1.6;">
              With warmest regards and great anticipation for our collaboration,<br>
              <strong style="color: #2c3e50; font-size: 18px; font-weight: 600;">The Speedy Van Management Team</strong>
            </p>
            <p style="margin: 15px 0 0 0; font-size: 14px; color: #6c757d; font-style: italic;">
              "Excellence in every delivery, trust in every interaction"
            </p>
            
            <!-- Approval Section -->
            <div style="margin-top: 25px; padding: 20px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 8px; border-left: 4px solid #28a745;">
              <p style="margin: 0 0 5px 0; font-size: 14px; color: #495057; font-weight: 600;">
                ✓ Approved by Operation Manager
              </p>
              <p style="margin: 0; font-size: 16px; color: #2c3e50; font-weight: 600;">
                Mr. Jewan Saleh
              </p>
            </div>
          </div>

          <!-- Footer Note -->
          <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #6c757d; line-height: 1.4;">
              This email was sent to ${data.adminEmail} because an administrative account was created for you in the Speedy Van system.<br>
              If you did not expect this email, please contact our support team immediately.
            </p>
          </div>

        </div>

        <!-- Footer -->
        <div style="background: #2c3e50; color: white; padding: 25px; text-align: center; border-radius: 0;">
          <div style="margin-bottom: 15px;">
            <a href="https://speedy-van.co.uk/" style="color: #e8f4fd; text-decoration: none; font-size: 16px; font-weight: 600;" target="_blank">
              🌐 Visit Our Website: speedy-van.co.uk
            </a>
          </div>
          <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 500;">© ${new Date().getFullYear()} Speedy Van. All rights reserved.</p>
          <p style="margin: 0 0 10px 0; font-size: 12px; opacity: 0.9;">SPEEDY VAN REMOVALS LTD • Company No. SC865658 • Registered in Scotland</p>
          <p style="margin: 0 0 10px 0; font-size: 12px; opacity: 0.9;">Professional Moving Services • Fully Insured • 5-Star Rated • 24/7 Support</p>
          <p style="margin: 0; font-size: 12px; opacity: 0.8;">Office 2.18 1 Barrack St, Hamilton ML3 0HS, United Kingdom</p>
        </div>

      </div>
    </body>
    </html>
  `;
}

function generateOrderCancellationHTML(data: OrderCancellationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Cancelled - ${data.orderNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #dc3545; margin: 0;">Speedy Van</h1>
          <h2 style="margin: 10px 0; color: #dc3545;">Order Cancellation Notice</h2>
        </div>

        <div style="background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
          <p>Dear ${data.customerName},</p>

          <p>We regret to inform you that your order has been cancelled.</p>

          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Cancellation Details:</strong><br>
            <strong>Order Number:</strong> ${data.orderNumber}<br>
            <strong>Reason for Cancellation:</strong> ${data.reason}<br>
            ${data.refundAmount ? `<strong>Refund Amount:</strong> ${data.currency}${data.refundAmount.toFixed(2)}` : ''}
          </div>

          ${data.refundAmount ? `
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Refund Information:</strong><br>
            <p>A refund of ${data.currency}${data.refundAmount.toFixed(2)} has been processed and should appear in your original payment method within 3-5 business days.</p>
            <p>If you have any questions about the refund process, please contact your bank or payment provider.</p>
          </div>
          ` : ''}

          <p>We apologize for any inconvenience this may have caused. If you would like to reschedule your move or have any questions about this cancellation, please don't hesitate to contact our support team.</p>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <p><strong>Contact Information:</strong></p>
            <p>📧 Email: support@speedy-van.co.uk</p>
            <p>📞 Phone: 07901 846297</p>
            <p>🌐 Website: www.speedy-van.co.uk</p>
          </div>

          <p>If this cancellation was made in error or you have any concerns, please contact us immediately so we can assist you.</p>

          <p>Best regards,<br>The Speedy Van Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>Speedy Van - Professional Moving Services<br>
          Email: support@speedy-van.co.uk | Phone: 07901 846297</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateFloorWarningHTML(data: FloorWarningData): string {
  const pickupFloorText = data.pickupFloorIssue ? 'Driver will collect from ground floor (no floor number specified)' : 'Floor information provided';
  const dropoffFloorText = data.dropoffFloorIssue ? 'Driver will deliver to ground floor (no floor number specified)' : 'Floor information provided';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Important Floor Information - ${data.orderNumber}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #856404; margin: 0;">⚠️ Speedy Van</h1>
          <h2 style="margin: 10px 0; color: #856404;">Important Floor Information</h2>
        </div>

        <div style="background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px;">
          <p>Dear ${data.customerName},</p>

          <p><strong>Please read this carefully:</strong></p>

          <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #495057;">Floor Information for Your Order ${data.orderNumber}:</h3>

            <div style="margin: 15px 0;">
              <strong>📍 Pickup:</strong> ${pickupFloorText}<br>
              <strong>🏠 Dropoff:</strong> ${dropoffFloorText}
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <strong>⚠️ Important Fee Information:</strong><br>
              Extra fees will be applied if you choose to add floors during the moving process.
            </div>
          </div>

          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>If you need to update your floor number, please contact support immediately:</strong></p>
            <div style="text-align: center; margin: 15px 0;">
              <p style="margin: 5px 0;"><strong>📞 Phone:</strong> 01202129746</p>
              <p style="margin: 5px 0;"><strong>📧 Email:</strong> support@speedy-van.co.uk</p>
            </div>
          </div>

          <p>This ensures your move goes smoothly and helps us provide accurate pricing and scheduling.</p>

          <p>Thank you for choosing Speedy Van for your moving needs.</p>

          <p>Best regards,<br>The Speedy Van Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>Speedy Van - Professional Moving Services<br>
          Email: support@speedy-van.co.uk | Phone: 07901 846297</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateDriverApplicationConfirmationHTML(data: DriverApplicationConfirmationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Driver Application Received - Speedy Van</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c5aa0; margin: 0;">Speedy Van</h1>
          <p style="color: #666; margin: 5px 0;">Professional Moving Services</p>
        </div>

        <div style="background: #e8f4fd; border-left: 4px solid #2c5aa0; padding: 20px; margin: 20px 0;">
          <h2 style="color: #2c5aa0; margin: 0 0 10px 0;">🚗 Driver Application Received!</h2>
          <p style="margin: 0; font-size: 16px;">Thank you for your interest in joining the Speedy Van team!</p>
        </div>

        <div style="margin: 20px 0;">
          <p>Dear ${data.driverName},</p>
          
          <p>We have successfully received your driver application and are excited about the possibility of you joining our team!</p>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Application Details:</strong><br>
            <strong>Application ID:</strong> ${data.applicationId}<br>
            <strong>Applied On:</strong> ${new Date(data.appliedAt).toLocaleDateString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}<br>
            <strong>Status:</strong> Under Review
          </div>

          <h3 style="color: #2c5aa0;">What happens next?</h3>
          <ul style="line-height: 1.6;">
            <li><strong>Review Process:</strong> Our team will review your application within 24-48 hours</li>
            <li><strong>Document Verification:</strong> We'll verify your driving license and ID documents</li>
            <li><strong>Background Check:</strong> We'll conduct necessary background checks</li>
            <li><strong>Decision Notification:</strong> You'll receive an email with our decision</li>
          </ul>

          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>📧 Important:</strong> Please check your email regularly, including your spam folder, for updates about your application status.
          </div>

          <h3 style="color: #2c5aa0;">Why choose Speedy Van?</h3>
          <ul style="line-height: 1.6;">
            <li>💰 <strong>Competitive Earnings:</strong> Earn up to 85% of each job</li>
            <li>🚛 <strong>Flexible Schedule:</strong> Work when you want</li>
            <li>📱 <strong>Easy Management:</strong> User-friendly driver app</li>
            <li>🎯 <strong>UK-Wide Coverage:</strong> Jobs across the entire UK</li>
            <li>💳 <strong>Weekly Payouts:</strong> Get paid every Friday</li>
          </ul>

          <p>If you have any questions about your application or need to provide additional information, please don't hesitate to contact us.</p>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <p><strong>Contact Information:</strong></p>
            <p>📧 Email: support@speedy-van.co.uk</p>
            <p>📞 Phone: 07901 846297</p>
            <p>🌐 Website: www.speedy-van.co.uk</p>
          </div>

          <p>Thank you for choosing Speedy Van. We look forward to potentially welcoming you to our team!</p>

          <p>Best regards,<br>The Speedy Van Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>Speedy Van - Professional Moving Services<br>
          Email: support@speedy-van.co.uk | Phone: 07901 846297</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateDriverApplicationStatusHTML(data: DriverApplicationStatusData): string {
  const isApproved = data.status === 'approved';
  const isRejected = data.status === 'rejected';
  const needsInfo = data.status === 'requires_additional_info';

  const statusColor = isApproved ? '#28a745' : isRejected ? '#dc3545' : '#ffc107';
  const statusIcon = isApproved ? '✅' : isRejected ? '❌' : '⚠️';
  const statusText = isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Requires Additional Information';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Driver Application ${statusText} - Speedy Van</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #2c5aa0; margin: 0;">Speedy Van</h1>
          <p style="color: #666; margin: 5px 0;">Professional Moving Services</p>
        </div>

        <div style="background: ${isApproved ? '#d4edda' : isRejected ? '#f8d7da' : '#fff3cd'}; border-left: 4px solid ${statusColor}; padding: 20px; margin: 20px 0;">
          <h2 style="color: ${statusColor}; margin: 0 0 10px 0;">${statusIcon} Application ${statusText}</h2>
          <p style="margin: 0; font-size: 16px;">
            ${isApproved ? 'Congratulations! Your driver application has been approved!' : 
              isRejected ? 'We regret to inform you that your application has been rejected.' :
              'We need some additional information to complete your application.'}
          </p>
        </div>

        <div style="margin: 20px 0;">
          <p>Dear ${data.driverName},</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Application Details:</strong><br>
            <strong>Application ID:</strong> ${data.applicationId}<br>
            <strong>Status:</strong> ${statusText}<br>
            <strong>Reviewed On:</strong> ${new Date(data.reviewedAt).toLocaleDateString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>

          ${isApproved ? `
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #155724; margin: 0 0 10px 0;">🎉 Welcome to the Speedy Van Team!</h3>
            <p style="margin: 0;">Your driver account has been created and you can now start accepting jobs!</p>
          </div>

          <h3 style="color: #2c5aa0;">Next Steps:</h3>
          <ul style="line-height: 1.6;">
            <li><strong>Login Credentials:</strong> You will receive separate login details via email</li>
            <li><strong>Driver Portal Access:</strong> Log in to the driver portal to start working</li>
            <li><strong>Download the App:</strong> Get the Speedy Van driver app for easy job management</li>
            <li><strong>Start Earning:</strong> Begin accepting jobs and earning money immediately</li>
          </ul>

          <h3 style="color: #2c5aa0;">What you can expect:</h3>
          <ul style="line-height: 1.6;">
            <li>💰 <strong>Competitive Earnings:</strong> Earn up to 85% of each job</li>
            <li>🚛 <strong>Flexible Schedule:</strong> Work when you want</li>
            <li>📱 <strong>Easy Management:</strong> User-friendly driver app</li>
            <li>🎯 <strong>UK-Wide Coverage:</strong> Jobs across the entire UK</li>
            <li>💳 <strong>Weekly Payouts:</strong> Get paid every Friday</li>
          </ul>
          ` : isRejected ? `
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #721c24; margin: 0 0 10px 0;">Application Rejected</h3>
            <p style="margin: 0;">${data.rejectionReason || 'Unfortunately, we cannot proceed with your application at this time.'}</p>
          </div>

          <p>We appreciate your interest in joining Speedy Van. While we cannot move forward with your application at this time, we encourage you to reapply in the future if your circumstances change.</p>
          ` : `
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #856404; margin: 0 0 10px 0;">Additional Information Required</h3>
            <p style="margin: 0;">${data.rejectionReason || 'We need some additional information to complete your application.'}</p>
          </div>

          <h3 style="color: #2c5aa0;">Next Steps:</h3>
          <ul style="line-height: 1.6;">
            <li>Please provide the requested additional information</li>
            <li>Ensure all documents are clear and legible</li>
            <li>Contact us if you have any questions about the requirements</li>
            <li>We'll review your updated application within 24-48 hours</li>
          </ul>
          `}

          ${data.nextSteps && data.nextSteps.length > 0 ? `
          <h3 style="color: #2c5aa0;">Additional Information:</h3>
          <ul style="line-height: 1.6;">
            ${data.nextSteps.map(step => `<li>${step}</li>`).join('')}
          </ul>
          ` : ''}

          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <p><strong>Contact Information:</strong></p>
            <p>📧 Email: support@speedy-van.co.uk</p>
            <p>📞 Phone: 07901 846297</p>
            <p>🌐 Website: www.speedy-van.co.uk</p>
          </div>

          <p>If you have any questions about this decision or need further assistance, please don't hesitate to contact our support team.</p>

          <p>Best regards,<br>The Speedy Van Team</p>
        </div>

        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>Speedy Van - Professional Moving Services<br>
          Email: support@speedy-van.co.uk | Phone: 07901 846297</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export const unifiedEmailService = {
  async sendOrderConfirmation(data: OrderConfirmationData) {
    try {
      console.log('Sending order confirmation email to:', data.customerEmail);
      const subject = `Order Confirmation - ${data.orderNumber}`;
      const html = generateOrderConfirmationHTML(data);
      return await sendEmail(data.customerEmail, subject, html);
    } catch (error) {
      console.error('Order confirmation email failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: null,
        provider: 'error'
      };
    }
  },

  async sendPaymentConfirmation(data: PaymentConfirmationData) {
    try {
      const subject = `Payment Confirmation - ${data.orderNumber}`;
      const html = generatePaymentConfirmationHTML(data);
      return await sendEmail(data.customerEmail, subject, html);
    } catch (error) {
      console.error('Payment confirmation email failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: null,
        provider: 'error'
      };
    }
  },

  async sendCustomerPasswordReset(data: { email: string; resetUrl: string; driverName?: string; resetToken?: string; customerName?: string }) {
    try {
      const portalType = data.driverName ? 'Driver Portal' : 'Customer Portal';
      const subject = `Password Reset - Speedy Van ${portalType}`;
      const html = generatePasswordResetHTML(data);
      return await sendEmail(data.email, subject, html);
    } catch (error) {
      console.error('Password reset email failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: null,
        provider: 'error'
      };
    }
  },

  async sendDriverPasswordReset(data: { email: string; resetUrl: string; driverName?: string; resetToken?: string }) {
    try {
      console.log('🚗 Sending driver password reset email to:', data.email);
      const subject = `Password Reset - Speedy Van Driver Portal`;
      const html = generatePasswordResetHTML({
        ...data,
        driverName: data.driverName || 'Driver'
      });
      return await sendEmail(data.email, subject, html);
    } catch (error) {
      console.error('Driver password reset email failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: null,
        provider: 'error'
      };
    }
  },

  async sendDriverApplicationConfirmation(data: DriverApplicationConfirmationData) {
    try {
      console.log('Sending driver application confirmation email to:', data.driverEmail);
      const subject = `Driver Application Received - ${data.applicationId}`;
      const html = generateDriverApplicationConfirmationHTML(data);
      return await sendEmail(data.driverEmail, subject, html);
    } catch (error) {
      console.error('Driver application confirmation email failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: null,
        provider: 'error'
      };
    }
  },

  async sendDriverApplicationStatus(data: DriverApplicationStatusData) {
    try {
      console.log('Sending driver application status email to:', data.driverEmail);
      const statusText = data.status === 'approved' ? 'Approved' : 
                        data.status === 'rejected' ? 'Rejected' : 
                        'Requires Additional Information';
      const subject = `Driver Application ${statusText} - ${data.applicationId}`;
      const html = generateDriverApplicationStatusHTML(data);
      return await sendEmail(data.driverEmail, subject, html);
    } catch (error) {
      console.error('Driver application status email failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: null,
        provider: 'error'
      };
    }
  },

  // Placeholder methods for other email types (can be implemented as needed)
  sendDriverAssignment: (data: any) => ({
    success: true,
    error: null,
    messageId: 'placeholder-' + Date.now(),
    provider: 'placeholder'
  }),

  sendDriverAssigned: (data: any) => ({
    success: true,
    error: null,
    messageId: 'placeholder-' + Date.now(),
    provider: 'placeholder'
  }),

  sendNotificationEmail: (data: any) => ({
    success: true,
    error: null,
    messageId: 'placeholder-' + Date.now(),
    provider: 'placeholder'
  }),

  async sendOrderCancellation(data: OrderCancellationData) {
    try {
      console.log('Sending order cancellation email to:', data.customerEmail);
      const subject = `Order Cancelled - ${data.orderNumber}`;
      const html = generateOrderCancellationHTML(data);
      return await sendEmail(data.customerEmail, subject, html);
    } catch (error) {
      console.error('Order cancellation email failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: null,
        provider: 'error'
      };
    }
  },

  async sendFloorWarning(data: FloorWarningData) {
    try {
      console.log('Sending floor warning email to:', data.customerEmail);
      const subject = `Important Floor Information - ${data.orderNumber}`;
      const html = generateFloorWarningHTML(data);
      return await sendEmail(data.customerEmail, subject, html);
    } catch (error) {
      console.error('Floor warning email failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: null,
        provider: 'error'
      };
    }
  },

  async sendFloorWarningIfNeeded(orderData: {
    reference: string;
    customerEmail: string;
    customerName: string;
    pickupProperty?: { floors?: number; accessType?: string };
    dropoffProperty?: { floors?: number; accessType?: string };
  }) {
    try {
      const hasPickupFloorIssue = !orderData.pickupProperty?.floors || orderData.pickupProperty.floors === 0;
      const hasDropoffFloorIssue = !orderData.dropoffProperty?.floors || orderData.dropoffProperty.floors === 0;

      if (!hasPickupFloorIssue && !hasDropoffFloorIssue) {
        return {
          success: true,
          sent: false,
          message: 'No floor warnings needed'
        };
      }

      const floorWarningData: FloorWarningData = {
        customerEmail: orderData.customerEmail,
        customerName: orderData.customerName,
        orderNumber: orderData.reference,
        pickupFloorIssue: hasPickupFloorIssue,
        dropoffFloorIssue: hasDropoffFloorIssue,
        pickupLiftAvailable: orderData.pickupProperty?.accessType === 'WITH_LIFT',
        dropoffLiftAvailable: orderData.dropoffProperty?.accessType === 'WITH_LIFT',
      };

      const result = await this.sendFloorWarning(floorWarningData);

      return {
        success: result.success,
        sent: result.success,
        message: result.success ? 'Floor warning email sent' : `Failed to send: ${result.error}`,
        error: result.error
      };
    } catch (error) {
      console.error('Error checking/sending floor warning:', error);
      return {
        success: false,
        sent: false,
        message: 'Error occurred',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async testConnection() {
    try {
      const hasResend = !!emailConfig.resend.apiKey;
      const hasSendGrid = !!emailConfig.sendgrid.apiKey;

      if (!hasResend && !hasSendGrid) {
        return {
          success: false,
          error: 'No email providers configured. Please set RESEND_API_KEY or SENDGRID_API_KEY environment variables.'
        };
      }

      // Try to send a test email to verify configuration
      const testResult = await sendEmail(
        'test@example.com',
        'Email Service Test',
        '<p>This is a test email to verify the email service configuration.</p>'
      );

      return {
        success: testResult.success,
        error: testResult.error,
        providers: {
          resend: hasResend,
          sendgrid: hasSendGrid
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  async sendAdminWelcome(data: AdminWelcomeData) {
    try {
      console.log('Sending admin welcome email to:', data.adminEmail);
      const subject = `Welcome to Speedy Van Admin Portal - ${data.adminName}`;
      const html = generateAdminWelcomeHTML(data);
      return await sendEmail(data.adminEmail, subject, html);
    } catch (error) {
      console.error('Admin welcome email failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: null,
        provider: 'error'
      };
    }
  },

  async sendTrustpilotFeedback(data: TrustpilotFeedbackData) {
    try {
      console.log('Sending Trustpilot feedback email to:', data.customerEmail);
      const subject = `Share Your Experience - ${data.orderNumber}`;
      const html = generateTrustpilotFeedbackHTML(data);
      return await sendEmail(data.customerEmail, subject, html);
    } catch (error) {
      console.error('Trustpilot feedback email failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: null,
        provider: 'error'
      };
    }
  },

  // Generic email sending method (uses Resend/SendGrid with fallback)
  async sendCustomEmail(to: string, subject: string, htmlContent: string) {
    try {
      console.log('📧 Sending custom email to:', to);
      const result = await sendEmail(to, subject, htmlContent);
      return result;
    } catch (error) {
      console.error('Custom email send error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: null,
        provider: 'error'
      };
    }
  }
};

// Export as both named and default for compatibility
export const UnifiedEmailService = unifiedEmailService;
export default unifiedEmailService;
