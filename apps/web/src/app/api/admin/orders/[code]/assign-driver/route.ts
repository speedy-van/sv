import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPrisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const startTime = Date.now();
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { code } = params;
    const { driverId, reason } = await request.json();

    console.log('📥 Received assign-driver request:', {
      code,
      driverId,
      reason,
      hasDriverId: !!driverId,
      driverIdType: typeof driverId
    });

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    console.log('🚗 Admin assigning driver to order:', { code, driverId, reason });
    console.log('📋 Looking for booking with reference:', code);

    // Use withPrisma for all database operations
    return await withPrisma(async (prisma) => {
      // Get the booking with detailed logging
      console.log('📋 Looking for booking with reference:', code);
      const booking = await prisma.booking.findFirst({
        where: { reference: code },
        include: {
          Driver: {
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
          // Include address relations for Pusher notifications
          BookingAddress_Booking_pickupAddressIdToBookingAddress: true,
          BookingAddress_Booking_dropoffAddressIdToBookingAddress: true,
        }
      });

      console.log('📋 Booking found:', booking ? {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        hasAssignment: !!booking.Assignment,
        currentDriver: booking.Driver?.User?.name || 'None'
      } : 'Not found');

      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      // Check if booking is in a valid state for assignment
      if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
        return NextResponse.json(
          { error: 'Cannot assign driver to cancelled or completed booking' },
          { status: 400 }
        );
      }

      // Get the driver with detailed logging
      console.log('👤 Looking for driver with ID:', driverId);
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          User: {
            select: { name: true, email: true }
          },
          DriverAvailability: true
        }
      });

      console.log('👤 Driver lookup result:', {
        driverId,
        found: !!driver,
        driverData: driver ? {
          id: driver.id,
          userId: driver.userId,
          status: driver.status,
          onboardingStatus: driver.onboardingStatus,
          hasAvailability: !!driver.DriverAvailability,
          availabilityStatus: driver.DriverAvailability?.status
        } : null
      });

      if (!driver) {
        console.log('❌ Driver not found for ID:', driverId);
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 404 }
        );
      }

      // Check if driver is available
      if (!driver.DriverAvailability) {
        console.log('❌ Driver availability not found for driver:', driverId);
        return NextResponse.json(
          { error: 'Driver availability not found' },
          { status: 400 }
        );
      }

      // Check driver status (allow AVAILABLE and online status)
      const validStatuses = ['AVAILABLE', 'online', 'available'];
      if (!validStatuses.includes(driver.DriverAvailability.status)) {
        console.log('❌ Driver not available. Status:', driver.DriverAvailability.status, 'Valid statuses:', validStatuses);
        return NextResponse.json(
          { error: `Driver is not available for assignments (status: ${driver.DriverAvailability.status})` },
          { status: 400 }
        );
      }

      console.log('✅ Driver validation passed for:', driverId);

      // Use transaction to ensure data consistency
      console.log('🔄 Starting database transaction...');
      const result = await prisma.$transaction(async (tx) => {
        console.log('💾 Transaction started successfully');
        try {
        // If there's an existing assignment, update it
        if (booking.Assignment) {
          const existingAssignment = booking.Assignment;
          
          // Create job event for removal/reassignment
          const removalEventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_removed`;
          console.log('📝 Creating removal job event with ID:', removalEventId);
          
          await tx.jobEvent.create({
            data: {
              id: removalEventId,
              assignmentId: existingAssignment.id,
              step: 'job_completed',
              payload: {
                removedBy: 'admin',
                reason: reason || 'Reassigned to different driver',
                removedAt: new Date().toISOString(),
                action: 'job_removed',
              },
              notes: `Job removed from driver ${existingAssignment.Driver.User?.name || 'Unknown'} by admin`,
              createdBy: (session.user as any).id,
            }
          });

          // Update existing assignment with new driver
          const updatedAssignment = await tx.assignment.update({
            where: { id: existingAssignment.id },
            data: {
              driverId: driverId,
              status: 'invited',
              round: 1,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes to accept
              updatedAt: new Date(),
            }
          });

          console.log('✅ Updated existing assignment from driver:', existingAssignment.Driver.User?.name || 'Unknown', 'to:', driver.User?.name || 'Unknown');

          // Do NOT update booking.driverId yet - driver must accept first
          const updatedBooking = await tx.booking.update({
            where: { id: booking.id },
            data: {
              // driverId remains null until driver accepts
              // Keep current status (CONFIRMED) - driver assignment doesn't change booking status
              updatedAt: new Date(),
            }
          });

          // Create job event for new assignment
          const assignmentEventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_assigned`;
          console.log('📝 Creating assignment job event with ID:', assignmentEventId);
          
          await tx.jobEvent.create({
            data: {
              id: assignmentEventId,
              assignmentId: updatedAssignment.id,
              step: 'navigate_to_pickup',
              payload: {
                assignedBy: 'admin',
                reason: reason || 'Assigned by admin',
                assignedAt: new Date().toISOString(),
                action: 'job_assigned',
              },
              notes: `Job assigned to driver ${driver.User?.name || 'Unknown'} by admin`,
              createdBy: (session.user as any).id,
            }
          });

          console.log('✅ Transaction completed successfully');
          return { updatedBooking, newAssignment: updatedAssignment };
        } else {
          // Create new assignment with unique ID
          const assignmentId = `assignment_${Date.now()}_${booking.id}_${driverId}`;
          console.log('📝 Creating new assignment with ID:', assignmentId);
          
          const newAssignment = await tx.assignment.create({
            data: {
              id: assignmentId,
              bookingId: booking.id,
              driverId: driverId,
              status: 'invited',
              round: 1,
              expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes to accept
              updatedAt: new Date(),
            }
          });

          // Do NOT update booking.driverId yet - driver must accept first
          const updatedBooking = await tx.booking.update({
            where: { id: booking.id },
            data: {
              // driverId remains null until driver accepts
              // Keep current status (CONFIRMED) - driver assignment doesn't change booking status
              updatedAt: new Date(),
            }
          });

          // Create job event for new assignment
          const assignmentEventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_assigned`;
          console.log('📝 Creating assignment job event with ID:', assignmentEventId);
          
          await tx.jobEvent.create({
            data: {
              id: assignmentEventId,
              assignmentId: newAssignment.id,
              step: 'navigate_to_pickup',
              payload: {
                assignedBy: 'admin',
                reason: reason || 'Assigned by admin',
                assignedAt: new Date().toISOString(),
                action: 'job_assigned',
              },
              notes: `Job assigned to driver ${driver.User?.name || 'Unknown'} by admin`,
              createdBy: (session.user as any).id,
            }
          });

          console.log('✅ Transaction completed successfully');
          return { updatedBooking, newAssignment };
        }
        } catch (innerError) {
          console.error('❌ Error inside transaction:', innerError);
          throw innerError;
        }
      }).catch((transactionError) => {
        console.error('❌ Transaction failed:', transactionError);
        throw transactionError;
      });

      console.log('🎉 Assignment operation completed:', {
        bookingId: result.updatedBooking.id,
        assignmentId: result.newAssignment.id,
        driverAssigned: driver.User?.name || 'Unknown'
      });

      // Send real-time notifications
      try {
        const pusher = getPusherServer();

        // Notify the new driver with "route-matched" event for consistency
        console.log('📡 Sending route-matched event to driver channel:', `driver-${driverId}`);
        const expiresAt = result.newAssignment.expiresAt;
        const routeMatchedResult = await pusher.trigger(`driver-${driverId}`, 'route-matched', {
          type: 'single-order',
          matchType: 'order',
          jobCount: 1,
          bookingId: booking.id,
          orderId: booking.id,
          bookingReference: booking.reference,
          orderNumber: booking.reference,
          customerName: booking.customerName,
          assignmentId: result.newAssignment.id,
          assignedAt: new Date().toISOString(),
          expiresAt: expiresAt?.toISOString() || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          expiresInSeconds: 1800, // 30 minutes in seconds
          pickupAddress: booking.BookingAddress_Booking_pickupAddressIdToBookingAddress?.label || 'Pickup location',
          dropoffAddress: booking.BookingAddress_Booking_dropoffAddressIdToBookingAddress?.label || 'Dropoff location',
          estimatedEarnings: booking.totalGBP || 0,
          distance: booking.baseDistanceMiles || 0,
          message: 'New job assigned to you - 30 minutes to accept',
        });
        console.log('✅ Route-matched event sent result:', routeMatchedResult);

        // Also send job-assigned event for backward compatibility
        console.log('📡 Sending job-assigned event to driver channel:', `driver-${driverId}`);
        const jobAssignedResult = await pusher.trigger(`driver-${driverId}`, 'job-assigned', {
          bookingId: booking.id,
          bookingReference: booking.reference,
          customerName: booking.customerName,
          assignedAt: new Date().toISOString(),
          message: 'You have been assigned a new job',
        });
        console.log('✅ Job-assigned event sent result:', jobAssignedResult);

        // Notify other drivers that job is no longer available
        await pusher.trigger('drivers-channel', 'job-assigned-to-other', {
          bookingId: booking.id,
          bookingReference: booking.reference,
          assignedTo: driver.User?.name || 'Unknown',
          message: 'This job has been assigned to another driver',
        });

        // Notify customer about driver assignment
        await pusher.trigger(`booking-${booking.reference}`, 'driver-assigned', {
          driverName: driver.User?.name || 'Unknown',
          assignedAt: new Date().toISOString(),
          message: 'Your driver has been assigned and will contact you soon',
        });

        // Notify admin dashboard
        await pusher.trigger('admin-notifications', 'driver-assigned', {
          bookingId: booking.id,
          bookingReference: booking.reference,
          driverName: driver.User?.name || 'Unknown',
          assignedAt: new Date().toISOString(),
        });

        console.log('✅ Real-time notifications sent for driver assignment');
      } catch (notificationError) {
        console.error('❌ Error sending real-time notifications:', notificationError);
        // Don't fail the request if notifications fail
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          actorId: (session.user as any).id,
          actorRole: 'admin',
          action: 'driver_assigned',
          targetType: 'booking',
          targetId: booking.id,
          details: {
            bookingReference: booking.reference,
            driverId: driverId,
            driverName: driver.User?.name || 'Unknown',
            reason: reason || 'Assigned by admin',
            assignedAt: new Date().toISOString(),
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Driver assigned successfully',
        data: {
          bookingId: booking.id,
          bookingReference: booking.reference,
          driver: {
            id: driver.id,
            name: driver.User?.name || 'Unknown',
            email: driver.User?.email || '',
          },
          assignmentId: result.newAssignment.id,
          assignedAt: new Date().toISOString(),
        }
      });
    });

  } catch (error) {
    console.error('❌ Error assigning driver:', error);
    return NextResponse.json(
      {
        error: 'Failed to assign driver',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
