// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';

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
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400, headers: corsHeaders });
    }

    console.log('🔐 Driver password reset request for:', email);

    // Find user with driver role (case-insensitive email search)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        role: 'driver',
        isActive: true,
      },
      include: {
        driver: true,
      },
    });

    if (!user) {
      console.log('❌ Driver not found or inactive:', email);
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Check if driver is approved
    if (user.driver?.onboardingStatus !== 'approved') {
      console.log('❌ Driver not approved:', user.driver?.onboardingStatus);
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    console.log('✅ Reset token generated and stored for user:', user.id);

    // Log the password reset request
    await logAudit(user.id, 'driver_password_reset_requested', user.id, {
      targetType: 'auth',
      before: null,
      after: { email: user.email, resetToken }
    });

    // Send password reset email
    try {
      const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speedy-van.co.uk'}/driver/reset?token=${resetToken}`;
      
      console.log('🔐 ===== DRIVER PASSWORD RESET EMAIL DEBUG =====');
      console.log('📧 Driver Details:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        driverStatus: user.driver?.onboardingStatus
      });
      console.log('📧 Reset Token:', {
        token: resetToken.substring(0, 8) + '...',
        fullLength: resetToken.length,
        expiry: resetTokenExpiry.toISOString()
      });
      console.log('📧 Reset URL:', resetUrl);
      console.log('📧 Environment:', {
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        mailFrom: process.env.MAIL_FROM,
        nodeEnv: process.env.NODE_ENV
      });
      
      console.log('📧 Calling unifiedEmailService.sendDriverPasswordReset...');
      const emailResult = await unifiedEmailService.sendDriverPasswordReset({
        driverName: user.name || 'Driver',
        email: user.email,
        resetToken,
        resetUrl,
      });
      
      console.log('📧 ===== EMAIL SERVICE RESULT =====');
      console.log('📧 Success:', emailResult.success);
      console.log('📧 Provider:', emailResult.provider);
      console.log('📧 Message ID:', emailResult.messageId);
      console.log('📧 Error:', emailResult.error);
      console.log('📧 Full Result:', JSON.stringify(emailResult, null, 2));
      
      if (emailResult.success) {
        console.log('✅ ===== EMAIL SENT SUCCESSFULLY =====');
        console.log('✅ Provider:', emailResult.provider);
        console.log('✅ Message ID:', emailResult.messageId);
        console.log('✅ Driver should receive email at:', user.email);
        console.log('✅ Check inbox and spam folder');
      } else {
        console.error('❌ ===== EMAIL SENDING FAILED =====');
        console.error('❌ Error:', emailResult.error);
        console.error('❌ Provider:', emailResult.provider);
        console.error('❌ Driver will NOT receive email');
      }
      console.log('🔐 ===== END DRIVER PASSWORD RESET DEBUG =====');
    } catch (emailError) {
      console.error('⚠️ ===== EMAIL SENDING EXCEPTION =====');
      console.error('⚠️ Exception:', emailError);
      console.error('⚠️ Stack:', emailError instanceof Error ? emailError.stack : 'No stack');
      console.error('⚠️ Driver will NOT receive email due to exception');
      console.error('⚠️ ===== END EMAIL EXCEPTION DEBUG =====');
      // Don't fail the request if email fails - token is still stored
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('❌ Driver forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
