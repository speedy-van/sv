import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email (case-insensitive)
    const user = await prisma.user.findFirst({
      where: { 
        email: {
          equals: email,
          mode: 'insensitive',
        }
      },
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message:
          'If an account with that email exists, a verification link has been sent.',
      });
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'Email is already verified.',
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store verification token in user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      },
    });

    // Log the verification email request
    await logAudit(user.id, 'verification_email_requested', user.id, { targetType: 'auth', before: null, after: { email: user.email } });

    // TODO: Send email with verification link
    // The verification link would be: /auth/verify?token=${verificationToken}
    // In production, you'd integrate with an email service like SendGrid, AWS SES, etc.

    return NextResponse.json({
      success: true,
      message:
        'If an account with that email exists, a verification link has been sent.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
