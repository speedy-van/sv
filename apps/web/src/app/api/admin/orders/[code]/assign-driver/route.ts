import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { withPrisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';
import { upsertAssignment, getActiveAssignment } from '@/lib/utils/assignment-helpers';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const startTime = Date.now();
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const { code } = await params;
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
          // Include address relations for Pusher notifications
          pickupAddress: true,
          dropoffAddress: true,
        }
      });

      console.log('📋 Booking found:', booking ? {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        hasAssignment: !!booking.Assignment,
        currentDriver: booking.driver?.User?.name || 'None'
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
            select: { name: true, email: true, phone: true }
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
        const existingAssignment = getActiveAssignment(booking.Assignment);
        if (existingAssignment) {
          
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
              createdBy: user.id,
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
              driverId: driverId, // ✅ Set driver immediately for dashboard query
              status: 'CONFIRMED',
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
              createdBy: user.id,
            }
          });

          console.log('✅ Transaction completed successfully');
          return { updatedBooking, newAssignment: updatedAssignment };
        } else {
          // Create new assignment with unique ID
          const assignmentId = `assignment_${Date.now()}_${booking.id}_${driverId}`;
          console.log('📝 Creating new assignment with ID:', assignmentId);
          
          const newAssignment = await upsertAssignment(tx, booking.id, {
            driverId: driverId,
            status: 'invited',
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes to accept
            round: 1,
          });

          // Do NOT update booking.driverId yet - driver must accept first
          const updatedBooking = await tx.booking.update({
            where: { id: booking.id },
            data: {
              driverId: driverId, // ✅ Set driver immediately for dashboard query
              status: 'CONFIRMED',
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
              createdBy: user.id,
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

      // Calculate driver earnings FIRST (before email)
      console.log('💰 Calculating driver earnings...');
      const { driverEarningsService } = await import('@/lib/services/driver-earnings-service');
      const earningsResult = await driverEarningsService.calculateEarnings({
        driverId: driverId,
        bookingId: booking.id,
        assignmentId: result.newAssignment.id,
        customerPaymentPence: booking.totalGBP,
        distanceMiles: booking.baseDistanceMiles || 0,
        durationMinutes: booking.estimatedDurationMinutes || 60,
        dropCount: 1,
        urgencyLevel: 'standard',
        onTimeDelivery: true,
      });
      
      const driverEarningsPounds = (earningsResult.breakdown.netEarnings / 100).toFixed(2);
      console.log('💰 Driver earnings calculated: £' + driverEarningsPounds);

      // Send email notification to driver
      console.log('📧 ========================================');
      console.log('📧 PREPARING EMAIL NOTIFICATION FOR DRIVER');
      console.log('📧 ========================================');
      console.log('📧 Driver Name:', driver.User?.name || 'Unknown');
      console.log('📧 Driver Email:', driver.User?.email || 'No email');
      console.log('📧 Booking Reference:', booking.reference);
      console.log('📧 Driver Earnings: £' + driverEarningsPounds);
      
      try {
        console.log('📧 Step 1: Importing UnifiedEmailService...');
        const { default: UnifiedEmailService } = await import('@/lib/email/UnifiedEmailService');
        console.log('📧 Step 1: ✅ UnifiedEmailService imported successfully');
        
        console.log('📧 Step 2: Preparing email content...');
        const scheduledDate = booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'ASAP';
        
        const scheduledTime = booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        }) : 'As soon as possible';

        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; }
              .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 20px; }
              .job-details { background-color: #F9FAFB; padding: 16px; border-radius: 8px; margin: 16px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
              .label { font-weight: bold; color: #6B7280; }
              .value { color: #1C1C1E; }
              .earnings { background-color: #10B981; color: white; padding: 12px; text-align: center; border-radius: 8px; font-size: 20px; font-weight: bold; margin: 16px 0; }
              .button { background-color: #007AFF; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px; font-weight: bold; }
              .footer { margin-top: 30px; font-size: 12px; color: #888; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>🎉 New Job Assigned!</h2>
              </div>
              <div class="content">
                <p>Hello ${driver.User?.name || 'Driver'},</p>
                <p>Great news! You have been assigned a new delivery job:</p>
                
                <div class="job-details">
                  <div class="detail-row">
                    <span class="label">Job Reference:</span>
                    <span class="value">#${booking.reference}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Scheduled:</span>
                    <span class="value">${scheduledDate} at ${scheduledTime}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Pickup:</span>
                    <span class="value">${booking.pickupAddress?.label || 'See app for details'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Drop-off:</span>
                    <span class="value">${booking.dropoffAddress?.label || 'See app for details'}</span>
                  </div>
                </div>

                <div class="earnings">
                  Your Earnings: £${driverEarningsPounds}
                </div>

                <p style="text-align: center;">
                  <a href="https://apps.apple.com/gb/app/speedy-van-driver/id6753916830" class="button">📱 Open Driver App</a>
                </p>

                <p style="margin-top: 20px; font-size: 14px; color: #6B7280;">
                  Tap the button above to open the Speedy Van Driver App and view your new job assignment. If you don't have the app installed, the link will take you to the App Store to download it.
                </p>

                <p>Thank you,<br>Speedy Van Team</p>
              </div>
              <div class="footer">
                <p>Speedy Van Driver App</p>
                <p>If you need help, contact us at support@speedy-van.co.uk or call 01202 129746</p>
              </div>
            </div>
          </body>
          </html>
        `;

        console.log('📧 Step 3: Sending email via UnifiedEmailService...');
        console.log('📧 To:', driver.User?.email);
        console.log('📧 Subject:', `New Job Assigned - ${booking.reference} - Speedy Van`);
        
        const emailResult = await UnifiedEmailService.sendCustomEmail(
          driver.User?.email || '',
          `New Job Assigned - ${booking.reference} - Speedy Van`,
          htmlContent
        );

        console.log('📧 Step 4: Email send result:', emailResult);
        
        if (emailResult.success) {
          console.log('✅✅✅ EMAIL SENT SUCCESSFULLY TO DRIVER via', emailResult.provider);
          console.log('✅ Message ID:', emailResult.messageId);
        } else {
          console.error('❌❌❌ FAILED TO SEND EMAIL TO DRIVER');
          console.error('❌ Error:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌❌❌ EXCEPTION WHILE SENDING EMAIL');
        console.error('❌ Error:', emailError);
        console.error('❌ Stack:', emailError instanceof Error ? emailError.stack : 'No stack');
        // Don't fail the request if email fails
      }
      
      console.log('📧 ========================================');
      console.log('📧 EMAIL SEND PROCESS COMPLETED');
      console.log('📧 ========================================');

      // Send real-time notifications
      try {
        const pusher = getPusherServer();

        // ✅ Use already calculated driver earnings (from above)
        // ✅ SINGLE notification to driver with CORRECT earnings
        console.log('📡 Sending route-matched notification to driver:', `driver-${driverId}`);
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
          pickupAddress: booking.pickupAddress?.label || 'Pickup location',
          dropoffAddress: booking.dropoffAddress?.label || 'Dropoff location',
          estimatedEarnings: `£${driverEarningsPounds}`, // ✅ CORRECT formatted earnings
          distance: booking.baseDistanceMiles && booking.baseDistanceMiles > 0 ? booking.baseDistanceMiles : undefined,
          message: `New job assigned - £${driverEarningsPounds} estimated`,
        });
        console.log('✅ Driver notification sent with earnings:', `£${driverEarningsPounds}`);

        // Notify other drivers that job is no longer available
        // This removes the job from their available jobs list immediately
        await pusher.trigger('drivers-broadcast', 'job-removed', {
          bookingId: booking.id,
          bookingReference: booking.reference,
          assignedTo: driver.User?.name || 'Unknown',
          message: 'This job has been assigned to another driver',
          reason: 'assigned',
        });
        console.log('📡 Notified other drivers about job assignment');

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

      // Send SMS notification to driver
      if (driver.User.phone) {
        try {
          const { getVoodooSMSService } = await import('@/lib/sms/VoodooSMSService');
          const smsService = getVoodooSMSService();
          
          const smsMessage = `🚚 New Order Assigned!\n\nOrder: ${booking.reference}\nPickup: ${booking.pickupAddress?.label || 'TBD'}\nDropoff: ${booking.dropoffAddress?.label || 'TBD'}\n\nCheck your app for full details.\n\nSpeedy Van`;
          
          const smsResult = await smsService.sendSMS({
            to: driver.User.phone,
            message: smsMessage
          });

          if (smsResult.success) {
            console.log(`✅ SMS sent to driver ${driverId} for order ${booking.reference}`);
          } else {
            console.error('❌ SMS sending failed:', smsResult.error);
          }
        } catch (smsError) {
          console.error('❌ SMS service error:', smsError);
        }
      } else {
        console.log('ℹ️ No phone number available for driver SMS notification');
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
        actorId: user.id,
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
