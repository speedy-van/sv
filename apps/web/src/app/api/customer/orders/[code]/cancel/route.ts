import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'customer') {
      return new Response('Unauthorized', { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { reference: params.code },
      include: { customer: true },
    });

    if (!booking || booking.customerId !== (session.user as any).id) {
      return new Response('Booking not found', { status: 404 });
    }

    // Check if booking can be cancelled
    const cancellableStatuses = ['open', 'pending_dispatch', 'confirmed'];
    if (!cancellableStatuses.includes(booking.status)) {
      return new Response('Booking cannot be cancelled at this stage', {
        status: 400,
      });
    }

    // Update booking status to cancelled
    const updatedBooking = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'CANCELLED',
      },
    });

    // Create a cancellation log entry
    await prisma.auditLog.create({
      data: {
        actorId: (session.user as any).id,
        actorRole: 'customer',
        action: 'booking_cancelled',
        targetType: 'booking',
        targetId: booking.id,
        userId: (session.user as any).id,
        details: {
          reason: 'Customer requested cancellation',
          cancelledAt: new Date().toISOString(),
          previousStatus: booking.status,
          source: 'stripe_cancel_page',
        },
      },
    });

    return Response.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
