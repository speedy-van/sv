import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'customer') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        twoFactorSecret: true,
        backupCodesGenerated: true,
        createdAt: true,
        // Add notification preferences when model is available
      },
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    return Response.json({
      profile: {
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      security: {
        twoFactorEnabled: !!user.twoFactorSecret,
        backupCodesGenerated: user.backupCodesGenerated,
      },
      notifications: {
        email: true, // Default values until model is available
        sms: true,
        push: false,
      },
      privacy: {
        // GDPR-related settings
        dataExportRequested: false,
        accountDeletionRequested: false,
      },
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'customer') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { profile, notifications, security, privacy } = body;

    const updates: any = {};

    // Update profile
    if (profile) {
      if (profile.name !== undefined) updates.name = profile.name;
      if (profile.email !== undefined) {
        updates.email = profile.email;
        updates.emailVerified = false; // Reset verification when email changes
      }
    }

    // Update security settings
    if (security) {
      if (security.twoFactorSecret !== undefined) {
        updates.twoFactorSecret = security.twoFactorSecret;
      }
      if (security.backupCodes !== undefined) {
        updates.backupCodes = security.backupCodes;
      }
      if (security.backupCodesGenerated !== undefined) {
        updates.backupCodesGenerated = security.backupCodesGenerated;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: (session.user as any).id },
      data: updates,
    });

    // Handle privacy requests
    if (privacy?.dataExportRequested) {
      // TODO: Implement data export request
      console.log('Data export requested for user:', updatedUser.id);
    }

    if (privacy?.accountDeletionRequested) {
      // TODO: Implement account deletion request
      console.log('Account deletion requested for user:', updatedUser.id);
    }

    return Response.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
