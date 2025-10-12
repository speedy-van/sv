import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'customer') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, phone, email } = body ?? {};

    if (!name && !email) {
      return new Response('Name or email is required', { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) {
      updates.email = email;
      updates.emailVerified = false; // Reset verification when email changes
    }

    const updated = await prisma.user.update({
      where: { id: (session.user as any).id },
      data: updates,
    });

    // Update related booking contact information
    if (name || email || phone) {
      await prisma.booking.updateMany({
        where: { customerId: updated.id },
        data: {
          customerName: name ?? undefined,
          customerEmail: email ?? undefined,
          customerPhone: phone ?? undefined,
        },
      });
    }

    return Response.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        name: updated.name,
        email: updated.email,
        emailVerified: updated.emailVerified,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
