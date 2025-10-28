import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveAssignment } from '@/lib/utils/assignment-helpers';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { code } = await params;
    const { reason, refundAmount, notifyCustomer } = await request.json();

    console.log('🚫 Admin cancelling order:', { code, reason, refundAmount, notifyCustomer });

    // Get the booking with all related data
    const booking = await prisma.booking.findFirst({
      where: { reference: code },
      include: {
        driver: {
          include: {
            User: {
              select: { name: true, email: true }
            }
          }
        },
        Assignment: {
          include: {
            Driver: {
              include: {
                User: {
                  select: { name: true, email: true }
                }
              }
            }
          }
        },
        pickupAddress: true,
        dropoffAddress: true,
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check if booking is already cancelled
    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    const driverName = booking.driver?.User?.name;
    const hasDriver = !!booking.driverId;

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // If there's an active assignment, cancel it
      const assignment = getActiveAssignment(booking.Assignment);
      if (assignment) {
        
        // Create job event for cancellation - using job_completed step
        await tx.jobEvent.create({
          data: {
            id: `event_${Date.now()}_cancelled`,
            assignmentId: assignment.id,
            step: 'job_completed',
            payload: {
              cancelledBy: 'admin',
              reason: reason || 'Cancelled by admin',
              cancelledAt: new Date().toISOString(),
              refundAmount: refundAmount || null,
              status: 'cancelled'
            },
            notes: `Job cancelled by admin. Reason: ${reason || 'No reason provided'}`,
            createdBy: (session.user as any).id,
          }
        });

        // Update assignment status to cancelled
        await tx.assignment.update({
          where: { id: assignment.id },
          data: {
            status: 'cancelled',
            updatedAt: new Date(),
          }
        });

        console.log('✅ Cancelled assignment for driver:', driverName);
      }

      // Update booking status to cancelled
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          driverId: null, // Remove driver assignment
          updatedAt: new Date(),
        }
      });

      // TODO: Create cancellation record when BookingCancellation model is migrated
      // await tx.bookingCancellation.create({
      //   data: {
      //     bookingId: booking.id,
      //     cancelledBy: (session.user as any).id,
      //     cancelledByRole: 'admin',
      //     reason: reason || 'Cancelled by admin',
      //     refundAmount: refundAmount || 0,
      //     refundProcessed: false,
      //     cancelledAt: new Date(),
      //   }
      // });

      return { updatedBooking };
    });

    // Send real-time notifications
    try {
      const pusher = getPusherServer();

      // Notify the driver if there was one
      if (hasDriver && booking.driverId) {
        await pusher.trigger(`driver-${booking.driverId}`, 'job-cancelled', {
          bookingId: booking.id,
          bookingReference: booking.reference,
          reason: reason || 'Cancelled by admin',
          cancelledAt: new Date().toISOString(),
          message: 'Your assigned job has been cancelled',
        });

        // Remove from driver's active jobs
        await pusher.trigger(`driver-${booking.driverId}`, 'job-removed-from-list', {
          bookingId: booking.id,
          bookingReference: booking.reference,
          message: 'This job has been removed from your active jobs',
        });
      }

      // Notify all drivers that job is no longer available
      await pusher.trigger('drivers-channel', 'job-cancelled', {
        bookingId: booking.id,
        bookingReference: booking.reference,
        reason: reason || 'Cancelled by admin',
        cancelledAt: new Date().toISOString(),
        message: 'This job has been cancelled and is no longer available',
      });

      // Notify customer about cancellation
      if (notifyCustomer !== false) {
        await pusher.trigger(`booking-${booking.reference}`, 'booking-cancelled', {
          reason: reason || 'Cancelled by admin',
          cancelledAt: new Date().toISOString(),
          refundAmount: refundAmount || 0,
          message: 'Your booking has been cancelled. Refund will be processed if applicable.',
        });
      }

      // Notify admin dashboard
      await pusher.trigger('admin-notifications', 'booking-cancelled', {
        bookingId: booking.id,
        bookingReference: booking.reference,
        customerName: booking.customerName,
        driverName: driverName || 'No driver assigned',
        reason: reason || 'Cancelled by admin',
        cancelledAt: new Date().toISOString(),
      });

      // Stop all tracking for this booking
      await pusher.trigger(`tracking-${booking.reference}`, 'tracking-stopped', {
        reason: 'booking_cancelled',
        cancelledAt: new Date().toISOString(),
        message: 'Tracking stopped due to booking cancellation',
      });

      console.log('✅ Real-time notifications sent for booking cancellation');
    } catch (notificationError) {
      console.error('❌ Error sending real-time notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: (session.user as any).id,
        actorRole: 'admin',
        action: 'booking_cancelled',
        targetType: 'booking',
        targetId: booking.id,
        details: {
          bookingReference: booking.reference,
          customerName: booking.customerName,
          driverName: driverName || 'No driver assigned',
          reason: reason || 'Cancelled by admin',
          refundAmount: refundAmount || 0,
          cancelledAt: new Date().toISOString(),
        }
      }
    });

    // Send cancellation email to customer if requested
    if (notifyCustomer !== false) {
      try {
        // TODO: Implement email sending for cancellation
        console.log('📧 Would send cancellation email to:', booking.customerEmail);
      } catch (emailError) {
        console.error('❌ Error sending cancellation email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        bookingId: booking.id,
        bookingReference: booking.reference,
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
        reason: reason || 'Cancelled by admin',
        refundAmount: refundAmount || 0,
        driverRemoved: hasDriver,
        driverName: driverName || null,
        customerNotified: notifyCustomer !== false,
      }
    });

  } catch (error) {
    console.error('❌ Error cancelling booking:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel booking',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
