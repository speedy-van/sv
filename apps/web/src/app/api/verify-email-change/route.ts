import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse(
      generateHTML('error', 'Invalid Request', 'No verification token provided. Please check your email and try again.'),
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }

  try {
    console.log('🔍 Verifying email change token:', token);

    // Find the email change request
    const emailChangeRequest = await prisma.emailChangeRequest.findUnique({
      where: { token: token },
      include: {
        User: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    if (!emailChangeRequest) {
      return new NextResponse(
        generateHTML('error', 'Invalid Link', 'This verification link is invalid or has been used already.'),
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Check if already verified
    if (emailChangeRequest.status === 'verified') {
      return new NextResponse(
        generateHTML('info', 'Already Verified', 'This email change has already been confirmed. You can now login with your new email address.'),
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Check if cancelled
    if (emailChangeRequest.status === 'cancelled') {
      return new NextResponse(
        generateHTML('error', 'Request Cancelled', 'This email change request was cancelled.'),
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Check if expired
    if (new Date() > emailChangeRequest.expiresAt) {
      await prisma.emailChangeRequest.update({
        where: { id: emailChangeRequest.id },
        data: { status: 'expired' },
      });

      return new NextResponse(
        generateHTML('error', 'Link Expired', 'This verification link has expired. Please request a new email change from the driver app.'),
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Check if new email is now taken
    const existingUser = await prisma.user.findUnique({
      where: { email: emailChangeRequest.newEmail },
      include: {
        driver: {
          select: { id: true, status: true },
        },
      },
    });

    if (existingUser && existingUser.id !== emailChangeRequest.userId) {
      console.log('❌ Email taken during verification:', {
        email: emailChangeRequest.newEmail,
        takenBy: existingUser.role,
      });

      await prisma.emailChangeRequest.update({
        where: { id: emailChangeRequest.id },
        data: { status: 'failed' },
      });

      let message = 'This email address was registered by another user while you were verifying.';
      if (existingUser.driver) {
        message = 'This email is now registered to another driver. Please request a new email change with a different address.';
      }

      return new NextResponse(
        generateHTML('error', 'Email Already Taken', message),
        {
          headers: { 'Content-Type': 'text/html' },
        }
      );
    }

    // Perform the email change
    await prisma.$transaction(async (tx) => {
      // Update user email
      await tx.user.update({
        where: { id: emailChangeRequest.userId },
        data: { email: emailChangeRequest.newEmail },
      });

      // Mark request as verified
      await tx.emailChangeRequest.update({
        where: { id: emailChangeRequest.id },
        data: {
          status: 'verified',
          verifiedAt: new Date(),
        },
      });
    });

    console.log('✅ Email changed successfully:', {
      userId: emailChangeRequest.userId,
      oldEmail: emailChangeRequest.oldEmail,
      newEmail: emailChangeRequest.newEmail,
    });

    // Send confirmation to old email
    try {
      const { default: UnifiedEmailService } = await import('@/lib/email/UnifiedEmailService');
      
      await UnifiedEmailService.sendCustomEmail(
        emailChangeRequest.oldEmail,
        'Email Address Changed - Speedy Van',
        generateSecurityNotificationHTML(
          emailChangeRequest.User.name || 'Driver',
          emailChangeRequest.oldEmail,
          emailChangeRequest.newEmail
        )
      );
    } catch (emailError) {
      console.error('⚠️ Failed to send security notification:', emailError);
    }

    return new NextResponse(
      generateHTML('success', 'Email Changed Successfully!', `Your email has been changed to <strong>${emailChangeRequest.newEmail}</strong>. You can now use it to login to the Speedy Van Driver app.`),
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  } catch (error) {
    console.error('❌ Email verification error:', error);
    return new NextResponse(
      generateHTML('error', 'Server Error', 'An error occurred while verifying your email. Please contact support at support@speedy-van.co.uk or call 01202129764'),
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

// HTML template generator
function generateHTML(type: 'success' | 'error' | 'info', title: string, message: string): string {
  const colors = {
    success: { bg: '#28a745', icon: '✅' },
    error: { bg: '#dc3545', icon: '❌' },
    info: { bg: '#007bff', icon: 'ℹ️' },
  };

  const color = colors[type];

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Speedy Van</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          overflow: hidden;
        }
        .header {
          background: ${color.bg};
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        .header h1 {
          font-size: 28px;
          font-weight: 600;
        }
        .content {
          padding: 40px 30px;
        }
        .message {
          font-size: 16px;
          line-height: 1.6;
          color: #333;
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: ${color.bg};
          color: white;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          transition: transform 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
        }
        .footer {
          background: #f8f9fa;
          padding: 20px 30px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }
        .contact {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="icon">${color.icon}</div>
          <h1>${title}</h1>
        </div>
        <div class="content">
          <p class="message">${message}</p>
          ${type === 'success' ? '<a href="https://speedy-van.co.uk/driver/login" class="button">Go to Login</a>' : ''}
        </div>
        <div class="footer">
          <strong>Speedy Van Driver App</strong>
          <div class="contact">
            Need help? Contact us:<br>
            📧 <a href="mailto:support@speedy-van.co.uk">support@speedy-van.co.uk</a><br>
            📞 <a href="tel:01202129764">01202129764</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Security notification email HTML
function generateSecurityNotificationHTML(userName: string, oldEmail: string, newEmail: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Email Address Changed</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${userName}</strong>,</p>
          
          <p>Your email address has been successfully changed.</p>
          
          <p><strong>Old Email:</strong> ${oldEmail}</p>
          <p><strong>New Email:</strong> ${newEmail}</p>
          <p><strong>Changed At:</strong> ${new Date().toLocaleString('en-GB')}</p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> If you did not make this change, please contact support immediately at support@speedy-van.co.uk or call 01202129764
          </div>
        </div>
        <div class="footer">
          <p>Speedy Van Driver App</p>
          <p>This is an automated security notification</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

