import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'customer') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return new Response('Current password and new password are required', {
        status: 400,
      });
    }

    if (newPassword.length < 8) {
      return new Response('New password must be at least 8 characters long', {
        status: 400,
      });
    }

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { password: true },
    });

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return new Response('Current password is incorrect', { status: 400 });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: (session.user as any).id },
      data: { password: hashedNewPassword },
    });

    return Response.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
