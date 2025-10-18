import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/booking-luxury/[id]/cancel - Cancel booking with reason
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id: bookingId } = await params;
    const { reason } = await request.json();

    // Find the booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check authorization
    if (session?.user?.role !== 'admin' && booking.customerId !== session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Check if booking can be cancelled
    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel completed booking' },
        { status: 400 }
      );
    }

    // Update booking status to cancelled
    const cancelledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    // Create audit log entry
    if (session?.user?.id) {
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          actorRole: session.user.role || 'customer',
          action: 'booking_cancelled',
          targetType: 'booking',
          targetId: booking.id,
          userId: session.user.id,
          details: {
            reference: booking.reference,
            reason: reason || 'No reason provided',
            cancelledAt: new Date().toISOString(),
          },
        },
      });
    }

    console.log('✅ Booking cancelled:', {
      id: cancelledBooking.id,
      reference: cancelledBooking.reference,
      reason: reason || 'No reason provided',
      cancelledBy: session?.user?.email || 'Unknown',
    });

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        id: cancelledBooking.id,
        reference: cancelledBooking.reference,
        status: cancelledBooking.status,
        cancelledAt: cancelledBooking.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
