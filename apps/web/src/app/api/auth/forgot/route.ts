import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { unifiedEmailService } from '@/lib/email/UnifiedEmailService';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('🔐 General password reset request for:', email);

    // Find user by email (any role, case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        resetToken: true,
        resetTokenExpiry: true,
        driver: {
          select: {
            id: true,
            onboardingStatus: true,
          },
        },
      },
    });

    if (!user) {
      console.log('❌ User not found or inactive:', email);
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    console.log('✅ User found:', { 
      id: user.id, 
      email: user.email, 
      role: user.role,
      driverStatus: user.driver?.onboardingStatus 
    });

    // For drivers, check if they are approved
    if (user.role === 'driver' && user.driver?.onboardingStatus !== 'approved') {
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
    await logAudit(user.id, 'password_reset_requested', user.id, {
      targetType: 'auth',
      before: null,
      after: { email: user.email, resetToken, role: user.role }
    });

    // Determine reset URL based on user role
    let resetUrl: string;
    if (user.role === 'driver') {
      resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speedy-van.co.uk'}/driver/reset?token=${resetToken}`;
    } else if (user.role === 'admin') {
      resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speedy-van.co.uk'}/admin/reset?token=${resetToken}`;
    } else {
      // customer or default
      resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speedy-van.co.uk'}/customer/reset?token=${resetToken}`;
    }

    // Send password reset email based on role
    try {
      console.log('🔐 ===== GENERAL PASSWORD RESET EMAIL DEBUG =====');
      console.log('📧 User Details:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        driverStatus: user.driver?.onboardingStatus
      });
      console.log('📧 Reset URL:', resetUrl);

      let emailResult;
      
      if (user.role === 'driver') {
        emailResult = await unifiedEmailService.sendDriverPasswordReset({
          driverName: user.name || 'Driver',
          email: user.email,
          resetToken,
          resetUrl,
        });
      } else {
        // For customers and admins
        emailResult = await unifiedEmailService.sendCustomerPasswordReset({
          customerName: user.name || 'User',
          email: user.email,
          resetToken,
          resetUrl,
        });
      }
      
      console.log('📧 ===== EMAIL SERVICE RESULT =====');
      console.log('📧 Success:', emailResult.success);
      console.log('📧 Provider:', emailResult.provider);
      console.log('📧 Message ID:', emailResult.messageId);
      console.log('📧 Error:', emailResult.error);
      
      if (emailResult.success) {
        console.log('✅ ===== EMAIL SENT SUCCESSFULLY =====');
        console.log('✅ Provider:', emailResult.provider);
        
        return NextResponse.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
        });
      } else {
        console.error('❌ ===== EMAIL FAILED =====');
        console.error('❌ Error:', emailResult.error);
        console.error('❌ Provider:', emailResult.provider);
        
        return NextResponse.json({
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
        });
      }
    } catch (emailError) {
      console.error('❌ ===== EMAIL EXCEPTION =====');
      console.error('❌ Email error:', emailError);
      
      // Still return success to not reveal if user exists
      return NextResponse.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }
  } catch (error) {
    console.error('❌ General password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}