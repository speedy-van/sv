import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'customer') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, token } = body;

    if (action === 'setup') {
      // Generate new 2FA secret
      const secret = authenticator.generateSecret();
      const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { email: true },
      });

      if (!user) {
        return new Response('User not found', { status: 404 });
      }

      // Generate QR code
      const otpauth = authenticator.keyuri(user.email, 'Speedy Van', secret);
      const qrCodeUrl = await QRCode.toDataURL(otpauth);

      // Store secret temporarily (not enabled yet)
      await prisma.user.update({
        where: { id: (session.user as any).id },
        data: { twoFactorSecret: secret },
      });

      return Response.json({
        secret,
        qrCodeUrl,
        message: 'Scan the QR code with your authenticator app',
      });
    }

    if (action === 'verify') {
      if (!token) {
        return new Response('Token is required', { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { twoFactorSecret: true },
      });

      if (!user?.twoFactorSecret) {
        return new Response('2FA not set up', { status: 400 });
      }

      // Verify token
      const isValid = authenticator.verify({
        token,
        secret: user.twoFactorSecret,
      });
      if (!isValid) {
        return new Response('Invalid token', { status: 400 });
      }

      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () =>
        Math.random().toString(36).substring(2, 8).toUpperCase()
      );

      await prisma.user.update({
        where: { id: (session.user as any).id },
        data: {
          backupCodes,
          backupCodesGenerated: true,
        },
      });

      return Response.json({
        success: true,
        backupCodes,
        message: '2FA enabled successfully. Save your backup codes!',
      });
    }

    if (action === 'disable') {
      if (!token) {
        return new Response('Token is required', { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { twoFactorSecret: true },
      });

      if (!user?.twoFactorSecret) {
        return new Response('2FA not enabled', { status: 400 });
      }

      // Verify token
      const isValid = authenticator.verify({
        token,
        secret: user.twoFactorSecret,
      });
      if (!isValid) {
        return new Response('Invalid token', { status: 400 });
      }

      // Disable 2FA
      await prisma.user.update({
        where: { id: (session.user as any).id },
        data: {
          twoFactorSecret: null,
          backupCodes: [],
          backupCodesGenerated: false,
        },
      });

      return Response.json({
        success: true,
        message: '2FA disabled successfully',
      });
    }

    return new Response('Invalid action', { status: 400 });
  } catch (error) {
    console.error('Error with 2FA:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
