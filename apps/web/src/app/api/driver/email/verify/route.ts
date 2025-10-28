import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400, headers: corsHeaders }
      );
    }

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
      return NextResponse.json(
        { error: 'Invalid or expired verification link' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if already verified
    if (emailChangeRequest.status === 'verified') {
      return NextResponse.json(
        { error: 'This email change has already been confirmed' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if cancelled
    if (emailChangeRequest.status === 'cancelled') {
      return NextResponse.json(
        { error: 'This email change request was cancelled' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if expired
    if (new Date() > emailChangeRequest.expiresAt) {
      await prisma.emailChangeRequest.update({
        where: { id: emailChangeRequest.id },
        data: { status: 'expired' },
      });

      return NextResponse.json(
        { error: 'Verification link has expired. Please request a new one.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if new email is now taken by another user (double-check at verification time)
    const existingUser = await prisma.user.findUnique({
      where: { email: emailChangeRequest.newEmail },
      include: {
        driver: {
          select: { id: true, status: true },
        },
      },
    });

    if (existingUser && existingUser.id !== emailChangeRequest.userId) {
      console.log('❌ Email now in use by another user during verification:', {
        email: emailChangeRequest.newEmail,
        existingUserId: existingUser.id,
        existingUserRole: existingUser.role,
        isDriver: !!existingUser.driver,
      });

      // Provide specific error message
      let errorMessage = 'This email address was registered by another user while you were verifying';
      
      if (existingUser.driver) {
        errorMessage = 'This email is now registered to another driver. Please request a new email change with a different address.';
      } else if (existingUser.role === 'customer') {
        errorMessage = 'This email is now registered as a customer account. Please request a new email change with a different address.';
      }

      // Mark request as failed
      await prisma.emailChangeRequest.update({
        where: { id: emailChangeRequest.id },
        data: { status: 'failed' },
      });

      return NextResponse.json(
        { 
          error: errorMessage,
          alreadyTaken: true,
          userType: existingUser.driver ? 'driver' : existingUser.role,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('✅ Email still available at verification time');

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

      console.log('✅ Email changed successfully:', {
        userId: emailChangeRequest.userId,
        oldEmail: emailChangeRequest.oldEmail,
        newEmail: emailChangeRequest.newEmail,
      });
    });

    // Send confirmation email to old address
    try {
      const { default: UnifiedEmailService } = await import('@/lib/email/UnifiedEmailService');
      
      const htmlContent = `
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
                <p>Hello <strong>${emailChangeRequest.User.name || 'Driver'}</strong>,</p>
                
                <p>Your email address has been successfully changed.</p>
                
                <p><strong>Old Email:</strong> ${emailChangeRequest.oldEmail}</p>
                <p><strong>New Email:</strong> ${emailChangeRequest.newEmail}</p>
                <p><strong>Changed At:</strong> ${new Date().toLocaleString('en-GB')}</p>
                
                <div class="warning">
                  <strong>⚠️ Security Notice:</strong> If you did not make this change, please contact support immediately at support@speedy-van.co.uk or call 01202129746
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

      // Send security notification using UnifiedEmailService
      const emailResult = await UnifiedEmailService.sendCustomEmail(
        emailChangeRequest.oldEmail,
        'Email Address Changed - Speedy Van',
        htmlContent
      );

      if (emailResult.success) {
        console.log('✅ Confirmation email sent to old address via', emailResult.provider);
      } else {
        console.error('⚠️ Failed to send security notification:', emailResult.error);
      }
    } catch (emailError) {
      console.error('⚠️ Failed to send confirmation email to old address:', emailError);
      // Don't fail the request if this email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email address changed successfully',
        newEmail: emailChangeRequest.newEmail,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('❌ Email Verify API error:', error);
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

