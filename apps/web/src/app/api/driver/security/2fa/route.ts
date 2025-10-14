import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateTOTPSecret, verifyTOTP } from '@/lib/totp';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
      include: { 
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            isActive: true,
            twoFactorSecret: true,
            backupCodesGenerated: true,
            backupCodes: true
          }
        }
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Check if 2FA is already enabled
    const is2FAEnabled = driver.User.twoFactorSecret !== null;

    if (is2FAEnabled) {
      return NextResponse.json({
        enabled: true,
        backupCodesGenerated: driver.User.backupCodesGenerated || false,
      });
    }

    // Generate new secret for setup
    const secret = generateTOTPSecret();
    const qrCodeUrl = `otpauth://totp/SpeedyVan:${driver.User.email}?secret=${secret}&issuer=SpeedyVan`;

    return NextResponse.json({
      enabled: false,
      secret,
      qrCodeUrl,
    });
  } catch (error) {
    console.error('2FA GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, token, secret } = await request.json();

    const driver = await prisma.driver.findUnique({
      where: { userId: session.user.id },
      include: { 
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
            isActive: true,
            twoFactorSecret: true,
            backupCodesGenerated: true,
            backupCodes: true
          }
        }
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    switch (action) {
      case 'enable':
        if (!token || !secret) {
          return NextResponse.json(
            { error: 'Token and secret required' },
            { status: 400 }
          );
        }

        // Verify the TOTP token
        const isValid = verifyTOTP(secret, token);
        if (!isValid) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () =>
          Math.random().toString(36).substring(2, 8).toUpperCase()
        );

        // Enable 2FA
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            twoFactorSecret: secret,
            backupCodes: backupCodes,
            backupCodesGenerated: true,
          },
        });

        return NextResponse.json({
          success: true,
          backupCodes,
          message: '2FA enabled successfully',
        });

      case 'disable':
        if (!token) {
          return NextResponse.json(
            { error: 'Token required' },
            { status: 400 }
          );
        }

        // Verify current 2FA token or backup code
        const currentSecret = driver.User.twoFactorSecret;
        if (!currentSecret) {
          return NextResponse.json(
            { error: '2FA not enabled' },
            { status: 400 }
          );
        }

        const isValidToken =
          verifyTOTP(currentSecret, token) ||
          driver.User.backupCodes?.includes(token);

        if (!isValidToken) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        // Disable 2FA
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            twoFactorSecret: null,
            backupCodes: undefined,
            backupCodesGenerated: false,
          },
        });

        return NextResponse.json({
          success: true,
          message: '2FA disabled successfully',
        });

      case 'regenerate-backup-codes':
        if (!token) {
          return NextResponse.json(
            { error: 'Token required' },
            { status: 400 }
          );
        }

        const secretForBackup = driver.User.twoFactorSecret;
        if (!secretForBackup) {
          return NextResponse.json(
            { error: '2FA not enabled' },
            { status: 400 }
          );
        }

        const isValidBackupToken =
          verifyTOTP(secretForBackup, token) ||
          driver.User.backupCodes?.includes(token);

        if (!isValidBackupToken) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        // Generate new backup codes
        const newBackupCodes = Array.from({ length: 10 }, () =>
          Math.random().toString(36).substring(2, 8).toUpperCase()
        );

        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            backupCodes: newBackupCodes,
          },
        });

        return NextResponse.json({
          success: true,
          backupCodes: newBackupCodes,
          message: 'Backup codes regenerated successfully',
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('2FA POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

