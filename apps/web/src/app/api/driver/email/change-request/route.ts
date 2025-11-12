import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import crypto from 'crypto';

// CORS headers for mobile app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Email Change Request API - Starting');
    
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      const user = (session as any)?.user;
      const userIdFromSession = user?.id as string | undefined;
      if (!user || !userIdFromSession) {
        return NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401, headers: corsHeaders }
        );
      }
      userId = userIdFromSession;
    }

    const { newEmail } = await request.json();

    if (!newEmail || typeof newEmail !== 'string') {
      return NextResponse.json(
        { error: 'New email is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if new email is same as current
    if (user.email.toLowerCase() === newEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'New email is the same as current email' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if new email is already in use by another user
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail.toLowerCase() },
      include: {
        driver: {
          select: { id: true, status: true },
        },
      },
    });

    if (existingUser) {
      console.log('❌ Email already in use:', {
        email: newEmail,
        existingUserId: existingUser.id,
        existingUserRole: existingUser.role,
        isDriver: !!existingUser.driver,
        driverStatus: existingUser.driver?.status,
      });

      // Provide specific error message based on who is using the email
      let errorMessage = 'This email address is already registered';
      
      if (existingUser.driver) {
        errorMessage = 'This email is already registered to another driver. Please use a different email address.';
      } else if (existingUser.role === 'customer') {
        errorMessage = 'This email is already registered as a customer account. Please use a different email address.';
      } else if (existingUser.role === 'admin') {
        errorMessage = 'This email is already in use. Please contact support for assistance.';
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          alreadyInUse: true,
          userType: existingUser.driver ? 'driver' : existingUser.role,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('✅ Email is available:', newEmail);

    // Cancel any pending email change requests
    await prisma.emailChangeRequest.updateMany({
      where: {
        userId: userId,
        status: 'pending',
      },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create email change request
    const emailChangeRequest = await prisma.emailChangeRequest.create({
      data: {
        userId: userId,
        oldEmail: user.email,
        newEmail: newEmail.toLowerCase(),
        token: token,
        expiresAt: expiresAt,
      },
    });

    // Send verification email
    try {
      // Import the sendEmail function from UnifiedEmailService
      const { default: UnifiedEmailService } = await import('@/lib/email/UnifiedEmailService');
      
      // ✅ CRITICAL: Use API route (not page) - works immediately without deployment!
      const verificationLink = `https://speedy-van.co.uk/api/verify-email-change?token=${token}`;
      
      console.log('📧 Generated verification link:', verificationLink);
      
      const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #007AFF; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #007AFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Confirm Email Change</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${user.name || 'Driver'}</strong>,</p>
                
                <p>You requested to change your email address from:</p>
                <p><strong>Old Email:</strong> ${user.email}</p>
                <p><strong>New Email:</strong> ${newEmail}</p>
                
                <div class="warning">
                  <strong>⚠️ Important:</strong> If you did not request this change, please ignore this email and contact support immediately.
                </div>
                
                <p>To complete this change, click the button below:</p>
                
                <a href="${verificationLink}" class="button">✅ Confirm Email Change</a>
                
                <p style="color: #666; font-size: 14px;">
                  Or copy and paste this link in your browser:<br>
                  <code style="background: #eee; padding: 8px; display: block; margin-top: 8px; word-break: break-all;">${verificationLink}</code>
                </p>
                
                <p style="color: #999; font-size: 13px; margin-top: 30px;">
                  ⏰ This link will expire in 24 hours.
                </p>
              </div>
              <div class="footer">
                <p>Speedy Van Driver App</p>
                <p>If you need help, contact us at support@speedy-van.co.uk or call 01202 129746</p>
              </div>
            </div>
          </body>
          </html>
        `;

      // Send email using UnifiedEmailService (handles Resend/SendGrid fallback)
      const emailResult = await UnifiedEmailService.sendCustomEmail(
        newEmail.toLowerCase(),
        'Confirm Your Email Change - Speedy Van',
        htmlContent
      );

      if (!emailResult.success) {
        console.error('❌ Email send failed:', emailResult.error);
        console.error('❌ Email provider used:', emailResult.provider);
        console.error('❌ Detailed error for debugging:', emailResult);
        throw new Error(emailResult.error || 'Failed to send email - check SMTP configuration');
      }

      console.log('✅ Verification email sent to:', newEmail, 'via', emailResult.provider);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError);
      
      // Delete the request if email fails
      await prisma.emailChangeRequest.delete({
        where: { id: emailChangeRequest.id },
      });
      
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Verification email sent. Please check your new email inbox.',
        newEmail: newEmail,
        expiresAt: expiresAt.toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('❌ Email Change Request API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

