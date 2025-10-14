import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { code } = params;
    const { reason } = await request.json();

    console.log('🚗 Admin removing driver from order:', { code, reason });

    // Get the booking with current assignment
    const booking = await prisma.booking.findFirst({
      where: { reference: code },
      include: {
        driver: {
          include: {
            User: {
              select: { name: true, email: true, id: true }
            }
          }
        },
        Assignment: {
          include: {
            Driver: {
              include: {
                User: {
                  select: { name: true, email: true, id: true }
                }
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (!booking.driverId) {
      return NextResponse.json(
        { error: 'No driver assigned to this booking' },
        { status: 400 }
      );
    }

    const driverName = booking.driver?.User?.name || 'Unknown Driver';
    const driverId = booking.driverId;

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create job event for removal (only if assignment exists)
      if (booking.Assignment) {
        await tx.jobEvent.create({
          data: {
            id: `event_${Date.now()}_removed`,
            assignmentId: booking.Assignment.id,
            step: 'job_removed' as any,
            payload: {
              removedBy: 'admin',
              reason: reason || 'Removed by admin',
              removedAt: new Date().toISOString(),
            },
            notes: `Job removed from driver ${driverName} by admin`,
            createdBy: (session.user as any).id,
          }
        });

        // Update assignment status to cancelled
        await tx.assignment.update({
          where: { id: booking.Assignment.id },
          data: {
            status: 'cancelled',
            updatedAt: new Date(),
          }
        });
      }

      // Remove driver from booking
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          driverId: null,
          status: 'CONFIRMED', // Keep as confirmed but without driver
          updatedAt: new Date(),
        }
      });

      return { updatedBooking };
    });

    // Send real-time notifications
    try {
      const pusher = getPusherServer();

      // Notify the removed driver
      await pusher.trigger(`driver-${driverId}`, 'job-removed', {
        bookingId: booking.id,
        bookingReference: booking.reference,
        reason: reason || 'Removed by admin',
        removedAt: new Date().toISOString(),
        message: 'You have been removed from this job',
      });

      // Notify other drivers that job is available again
      await pusher.trigger('drivers-channel', 'job-available-again', {
        bookingId: booking.id,
        bookingReference: booking.reference,
        customerName: booking.customerName,
        pickupAddress: 'N/A', // pickupAddress not available
        dropoffAddress: 'N/A', // dropoffAddress not available
        availableAt: new Date().toISOString(),
        message: 'This job is now available again',
      });

      // Notify customer about driver removal
      await pusher.trigger(`booking-${booking.reference}`, 'driver-removed', {
        reason: reason || 'Driver removed by admin',
        removedAt: new Date().toISOString(),
        message: 'Your driver has been changed. A new driver will be assigned soon.',
      });

      // Notify admin dashboard
      await pusher.trigger('admin-notifications', 'driver-removed', {
        bookingId: booking.id,
        bookingReference: booking.reference,
        driverName: driverName,
        removedAt: new Date().toISOString(),
      });

      console.log('✅ Real-time notifications sent for driver removal');
    } catch (notificationError) {
      console.error('❌ Error sending real-time notifications:', notificationError);
      // Don't fail the request if notifications fail
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: (session.user as any).id,
        actorRole: 'admin',
        action: 'driver_removed',
        targetType: 'booking',
        targetId: booking.id,
        details: {
          bookingReference: booking.reference,
          driverId: driverId,
          driverName: driverName,
          reason: reason || 'Removed by admin',
          removedAt: new Date().toISOString(),
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Driver removed successfully',
      data: {
        bookingId: booking.id,
        bookingReference: booking.reference,
        removedDriver: {
          id: driverId,
          name: driverName,
        },
        removedAt: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Error removing driver:', error);
    return NextResponse.json(
      {
        error: 'Failed to remove driver',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
