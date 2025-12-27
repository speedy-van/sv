import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getPusherServer } from '@/lib/pusher';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof Response) {
      return authResult;
    }
    const sessionUser = authResult;

    const { code } = await params;

    // Find the booking by reference
    const booking = await prisma.booking.findUnique({
      where: { reference: code },
      include: {
        Assignment: {
          include: {
            Driver: {
              include: {
                User: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is already completed
    if (booking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Order is already completed' },
        { status: 400 }
      );
    }

    // Check if order is cancelled
    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot complete a cancelled order' },
        { status: 400 }
      );
    }

    const completedAt = new Date();

    // Update booking status to COMPLETED
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'COMPLETED',
        updatedAt: completedAt,
      },
    });

    // Update all assignments to completed
    if (booking.Assignment && booking.Assignment.length > 0) {
      await prisma.assignment.updateMany({
        where: {
          bookingId: booking.id,
          status: { in: ['invited', 'claimed', 'accepted'] },
        },
        data: {
          status: 'completed',
          updatedAt: completedAt,
        },
      });
    }

    // Log audit trail
    await logAudit(
      sessionUser.id,
      'complete_order',
      booking.id,
      {
        targetType: 'booking',
        targetId: booking.id,
        bookingReference: booking.reference,
        before: { status: booking.status },
        after: { status: 'COMPLETED' },
        completedBy: 'admin',
        adminEmail: sessionUser.email,
      }
    );

    // Send real-time notifications
    try {
      const pusher = getPusherServer();

      // Notify admin dashboard
      await pusher.trigger('admin-notifications', 'order-completed', {
        bookingId: booking.id,
        bookingReference: booking.reference,
        customerName: booking.customerName,
        completedBy: 'admin',
        adminEmail: sessionUser.email,
        completedAt: completedAt.toISOString(),
        message: `Order ${booking.reference} has been marked as completed by admin`,
      });

      // Notify admin-orders channel
      await pusher.trigger('admin-orders', 'order-status-changed', {
        jobId: booking.id,
        bookingReference: booking.reference,
        status: 'COMPLETED',
        previousStatus: booking.status,
        reason: 'admin_completed',
        completedBy: sessionUser.email,
        timestamp: completedAt.toISOString(),
      });

      // Notify driver if assigned
      if (booking.Assignment && booking.Assignment.length > 0) {
        const activeAssignment = booking.Assignment.find(
          (a) => a.status === 'accepted' || a.status === 'claimed'
        );
        if (activeAssignment && activeAssignment.Driver) {
          await pusher.trigger(
            `driver-${activeAssignment.driverId}`,
            'job-completed-by-admin',
            {
              jobId: booking.id,
              bookingReference: booking.reference,
              completedAt: completedAt.toISOString(),
              message: `Order ${booking.reference} has been marked as completed by admin`,
            }
          );
        }
      }
    } catch (notificationError) {
      console.error('❌ Error sending notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      message: `Order ${booking.reference} has been marked as completed`,
      data: {
        bookingId: booking.id,
        bookingReference: booking.reference,
        status: 'COMPLETED',
        completedAt: completedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Error completing order:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

