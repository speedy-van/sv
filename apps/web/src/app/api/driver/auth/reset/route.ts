import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    console.log('🔐 Driver password reset attempt with token:', token.substring(0, 8) + '...');

    // Find user by reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
        role: 'driver',
        isActive: true,
      },
      include: {
        driver: true,
      },
    });

    if (!user) {
      console.log('❌ Invalid or expired reset token');
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    console.log('✅ Valid reset token found for user:', user.id);

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    console.log('✅ Password updated successfully for user:', user.id);

    // Log the password reset
    await logAudit(user.id, 'driver_password_reset_completed', user.id, {
      targetType: 'auth',
      before: null,
      after: { email: user.email }
    });

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    console.error('❌ Driver password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
