import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPrisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';
import { getActiveAssignment } from '@/lib/utils/assignment-helpers';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/**
 * POST /api/admin/routes/[id]/assign
 * Assign a complete route to a driver for the first time
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { id: routeId } = await params;
    const { driverId, reason } = await request.json();

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    console.log('🚗 Admin assigning route to driver:', { routeId, driverId, reason });

    return await withPrisma(async (prisma) => {
      // Check if this is a single booking (starts with "booking-")
      if (routeId.startsWith('booking-')) {
        const bookingId = routeId.replace('booking-', '');
        
        // Handle single booking assignment
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
        });

        if (!booking) {
          return NextResponse.json(
            { error: 'Booking not found' },
            { status: 404 }
          );
        }

        if (booking.driverId) {
          return NextResponse.json(
            { error: 'Booking is already assigned to a driver' },
            { status: 400 }
          );
        }

        // Get full booking details with addresses
        const fullBooking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            pickupAddress: true,
            dropoffAddress: true,
          }
        });

        // Update booking driver assignment
        const updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: { 
            driverId: driverId,
            status: 'CONFIRMED'
          }
        });

        // Create assignment record
        const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${bookingId}`;
        await prisma.assignment.create({
          data: {
            id: assignmentId,
            bookingId: bookingId,
            driverId: driverId,
            status: 'accepted',
            claimedAt: new Date(),
            updatedAt: new Date(),
          }
        });

        // Get driver details for email notification
        console.log('📧 ========================================');
        console.log('📧 PREPARING EMAIL NOTIFICATION FOR DRIVER');
        console.log('📧 ========================================');
        console.log('📧 Driver ID:', driverId);
        
        const driverRecord = await prisma.driver.findUnique({ 
          where: { id: driverId }, 
          select: { userId: true } 
        });
        
        console.log('📧 Driver Record:', driverRecord);
        
        const driverUser = await prisma.user.findUnique({
          where: { id: driverRecord?.userId || '' },
          select: { name: true, email: true }
        });
        
        console.log('📧 Driver User:', driverUser);
        console.log('📧 Driver Name:', driverUser?.name || 'Unknown');
        console.log('📧 Driver Email:', driverUser?.email || 'No email');

        // Log audit trail
        await logAudit(
          session.user.id,
          'booking_driver_assigned',
          bookingId,
          {
            targetType: 'booking',
            before: { driverId: null },
            after: { driverId: driverId, reason }
          }
        );

        // Send email notification to driver
        console.log('📧 ========================================');
        console.log('📧 STARTING EMAIL SEND PROCESS');
        console.log('📧 ========================================');
        
        try {
          console.log('📧 Step 1: Importing UnifiedEmailService...');
          const { default: UnifiedEmailService } = await import('@/lib/email/UnifiedEmailService');
          console.log('📧 Step 1: ✅ UnifiedEmailService imported successfully');
          
          console.log('📧 Step 2: Preparing email content...');
          const scheduledDate = fullBooking?.scheduledAt ? new Date(fullBooking.scheduledAt).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'ASAP';
          
          const scheduledTime = fullBooking?.scheduledAt ? new Date(fullBooking.scheduledAt).toLocaleTimeString('en-GB', {
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
                  <p>Hello ${driverUser?.name || 'Driver'},</p>
                  <p>Great news! You have been assigned a new delivery job:</p>
                  
                  <div class="job-details">
                    <div class="detail-row">
                      <span class="label">Job Reference:</span>
                      <span class="value">#${fullBooking?.reference}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Scheduled:</span>
                      <span class="value">${scheduledDate} at ${scheduledTime}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Pickup:</span>
                      <span class="value">${fullBooking?.pickupAddress?.label || 'See app for details'}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Drop-off:</span>
                      <span class="value">${fullBooking?.dropoffAddress?.label || 'See app for details'}</span>
                    </div>
                  </div>

                  <div class="earnings">
                    Your Earnings: £${((fullBooking?.totalGBP || 0) / 100).toFixed(2)}
                  </div>

                  <p style="text-align: center;">
                    <a href="https://speedy-van.co.uk/driver" class="button">View Job Details in App</a>
                  </p>

                  <p style="margin-top: 20px; font-size: 14px; color: #6B7280;">
                    Please open your Speedy Van Driver App to accept and start this job. The job details are waiting for you in the Dashboard.
                  </p>

                  <p>Thank you,<br>Speedy Van Team</p>
                </div>
                <div class="footer">
                  <p>Speedy Van Driver App</p>
                  <p>If you need help, contact us at support@speedy-van.co.uk or call 01202129764</p>
                </div>
              </div>
            </body>
            </html>
          `;

          console.log('📧 Step 3: Sending email via UnifiedEmailService...');
          console.log('📧 To:', driverUser?.email);
          console.log('📧 Subject:', `New Job Assigned - ${fullBooking?.reference} - Speedy Van`);
          
          const emailResult = await UnifiedEmailService.sendCustomEmail(
            driverUser?.email || '',
            `New Job Assigned - ${fullBooking?.reference} - Speedy Van`,
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

        // Send Pusher notifications
        try {
          const pusher = getPusherServer();
          
          console.log('📡 Preparing to send Pusher notifications for single booking...');
          console.log('📡 Target driver ID:', driverId);
          console.log('📡 Target channel:', `driver-${driverId}`);
          console.log('📡 Booking ID:', bookingId);
          console.log('📡 Booking Reference:', fullBooking?.reference);

          // Create comprehensive payload
          const jobAssignedPayload = {
            // Core identifiers
            bookingId: bookingId,
            orderId: bookingId,
            assignmentId: assignmentId,
            routeId: `booking-${bookingId}`,
            
            // Booking metadata
            type: 'single-order',
            matchType: 'order',
            bookingReference: fullBooking?.reference || bookingId,
            orderNumber: fullBooking?.reference || bookingId,
            
            // Location details
            pickupAddress: fullBooking?.pickupAddress?.label || 'Pickup location',
            dropoffAddress: fullBooking?.dropoffAddress?.label || 'Drop-off location',
            from: fullBooking?.pickupAddress?.label || 'Pickup location',
            to: fullBooking?.dropoffAddress?.label || 'Drop-off location',
            
            // Financial
            totalEarnings: fullBooking?.totalGBP || 0,
            estimatedEarnings: `£${((fullBooking?.totalGBP || 0) / 100).toFixed(2)}`,
            
            // Timing
            assignedAt: new Date().toISOString(),
            scheduledAt: fullBooking?.scheduledAt?.toISOString(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            expiresInSeconds: 1800,
            
            // Display
            message: `New job ${fullBooking?.reference || bookingId} assigned to you`,
            
            // Counts
            bookingsCount: 1,
            jobCount: 1,
          };

          console.log('📡 Sending "job-assigned" event...');
          console.log('📡 Payload:', JSON.stringify(jobAssignedPayload, null, 2));

          // Send job-assigned event
          await pusher.trigger(`driver-${driverId}`, 'job-assigned', jobAssignedPayload);
          console.log('✅ "job-assigned" event sent successfully');

          // Also send route-matched event for compatibility
          await pusher.trigger(`driver-${driverId}`, 'route-matched', jobAssignedPayload);
          console.log('✅ "route-matched" event sent successfully');

          console.log('✅ Pusher notifications sent successfully for single booking');
        } catch (notificationError) {
          console.error('❌ Error sending Pusher notifications:', notificationError);
          console.error('❌ Error stack:', notificationError instanceof Error ? notificationError.stack : 'No stack');
          // Don't fail the request if notifications fail
        }

        return NextResponse.json({
          success: true,
          message: 'Booking assigned to driver successfully',
          data: {
            bookingId,
            reference: fullBooking?.reference,
            driverId,
            assignmentId
          }
        });
      }

      // Get the route with all details (for multi-drop routes)
      const route = await prisma.route.findUnique({
        where: { id: routeId },
        include: {
          driver: { 
            select: { 
              id: true,
              name: true,
              email: true
            } 
          },
          drops: {
            orderBy: { createdAt: 'asc' }
          },
          Booking: {
            include: {
              Assignment: true
            }
          }
        }
      });

      if (!route) {
        return NextResponse.json(
          { error: 'Route not found' },
          { status: 404 }
        );
      }

      // Check if route is already assigned (excluding 'planned' status)
      if (route.driverId && route.status !== 'planned') {
        return NextResponse.json(
          { error: 'Route is already assigned. Use reassign endpoint instead.' },
          { status: 400 }
        );
      }

      // Get the driver with detailed logging
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          User: {
            select: { name: true, email: true }
          },
          DriverAvailability: true
        }
      });

      if (!driver) {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 404 }
        );
      }

      // Check if driver is available
      if (!driver.DriverAvailability) {
        return NextResponse.json(
          { error: 'Driver availability not found' },
          { status: 400 }
        );
      }

      // Check driver status
      const validStatuses = ['AVAILABLE', 'online', 'available'];
      if (!validStatuses.includes(driver.DriverAvailability.status)) {
        return NextResponse.json(
          { error: `Driver is not available for assignments (status: ${driver.DriverAvailability.status})` },
          { status: 400 }
        );
      }

      // Use transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx) => {
        // Update route with driver assignment
        const updatedRoute = await tx.route.update({
          where: { id: routeId },
          data: {
            driverId: driverId,
            status: 'active',
            isModifiedByAdmin: true,
            adminNotes: reason || 'Assigned by admin',
          },
          include: {
            driver: { 
              select: { 
                id: true,
                name: true,
                email: true
              } 
            },
            drops: {
              orderBy: { createdAt: 'asc' }
            },
            Booking: {
              include: {
                Assignment: true
              }
            }
          }
        });

        // Update all bookings in the route
        const bookingIds = route.Booking.map(b => b.id);
        
        if (bookingIds.length > 0) {
          await tx.booking.updateMany({
            where: { id: { in: bookingIds } },
            data: {
              driverId: driverId,
              status: 'CONFIRMED',
              updatedAt: new Date(),
            }
          });

          // Create assignments for all bookings in the route
          for (const booking of route.Booking) {
            // Cancel any existing assignment (get the active one from the array)
            const activeAssignment = getActiveAssignment(booking.Assignment);
            if (activeAssignment) {
              await tx.assignment.update({
                where: { id: activeAssignment.id },
                data: {
                  status: 'cancelled',
                  updatedAt: new Date(),
                }
              });

              // Disconnect the old assignment from the booking to prevent Prisma relation cache conflict
              await tx.booking.update({
                where: { id: booking.id },
                data: { 
                  Assignment: { 
                    disconnect: { id: activeAssignment.id } 
                  } 
                },
              });
            }

            // Delete any existing non-cancelled assignments to prevent conflicts
            // This ensures clean state before creating new assignment
            await tx.assignment.deleteMany({
              where: {
                bookingId: booking.id,
                status: { notIn: ['cancelled', 'declined', 'completed'] }
              }
            });

            // Create new assignment
            const assignmentId = `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${booking.id}`;
            await tx.assignment.create({
              data: {
                id: assignmentId,
                bookingId: booking.id,
                driverId: driverId,
                status: 'accepted',
                claimedAt: new Date(),
                updatedAt: new Date(),
              }
            });

            // Create job event
            const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await tx.jobEvent.create({
              data: {
                id: eventId,
                assignmentId: assignmentId,
                step: 'navigate_to_pickup',
                payload: {
                  assignedBy: 'admin',
                  reason: reason || 'Assigned via route',
                  assignedAt: new Date().toISOString(),
                  action: 'job_assigned',
                  routeId: routeId,
                },
                notes: `Job assigned to driver ${driver.User?.name || 'Unknown'} as part of route ${routeId}`,
                createdBy: (session.user as any).id,
              }
            });
          }
        }

        // Update all drops in the route (if status 'assigned_to_driver' exists)
        if ((route as any).drops.length > 0) {
          // For now we'll leave drops as is, since the schema might not have 'assigned_to_driver' status
          // await tx.drop.updateMany({
          //   where: { routeId: routeId },
          //   data: {
          //     assignedAt: new Date(),
          //   }
          // });
        }

        return { updatedRoute, bookingsCount: bookingIds.length };
      });

      console.log('🎉 Route assignment completed:', {
        routeId: result.updatedRoute.id,
        driverAssigned: driver.User?.name || 'Unknown',
        bookingsCount: result.bookingsCount,
        dropsCount: (result.updatedRoute as any).drops.length
      });

      // Send email notification to driver for route assignment
      console.log('📧 ========================================');
      console.log('📧 PREPARING ROUTE EMAIL NOTIFICATION');
      console.log('📧 ========================================');
      console.log('📧 Driver Name:', driver.User?.name);
      console.log('📧 Driver Email:', driver.User?.email);
      console.log('📧 Route ID:', result.updatedRoute.id);
      console.log('📧 Bookings Count:', result.bookingsCount);
      
      try {
        console.log('📧 Step 1: Importing UnifiedEmailService...');
        const { default: UnifiedEmailService } = await import('@/lib/email/UnifiedEmailService');
        console.log('📧 Step 1: ✅ UnifiedEmailService imported successfully');
        
        console.log('📧 Step 2: Preparing route email content...');
        const routeNumber = result.updatedRoute.id;
        const firstBooking = (result.updatedRoute as any).Booking?.[0];
        const displayReference = result.bookingsCount > 1 ? routeNumber : (firstBooking?.reference || routeNumber);
        
        const scheduledDate = result.updatedRoute.startTime ? new Date(result.updatedRoute.startTime).toLocaleDateString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : 'ASAP';
        
        const scheduledTime = result.updatedRoute.startTime ? new Date(result.updatedRoute.startTime).toLocaleTimeString('en-GB', {
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
              .header { background-color: #8B5CF6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { padding: 20px; }
              .route-details { background-color: #F9FAFB; padding: 16px; border-radius: 8px; margin: 16px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E5E7EB; }
              .label { font-weight: bold; color: #6B7280; }
              .value { color: #1C1C1E; }
              .earnings { background-color: #10B981; color: white; padding: 12px; text-align: center; border-radius: 8px; font-size: 20px; font-weight: bold; margin: 16px 0; }
              .stops-badge { background-color: #8B5CF6; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 16px 0; }
              .button { background-color: #007AFF; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px; font-weight: bold; }
              .footer { margin-top: 30px; font-size: 12px; color: #888; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>${result.bookingsCount > 1 ? '🚛 New Multi-Drop Route Assigned!' : '📦 New Job Assigned!'}</h2>
              </div>
              <div class="content">
                <p>Hello ${driver.User?.name || 'Driver'},</p>
                <p>You have been assigned a ${result.bookingsCount > 1 ? 'multi-drop route' : 'delivery job'}:</p>
                
                ${result.bookingsCount > 1 ? `
                  <div class="stops-badge">
                    🚛 ${result.bookingsCount} Deliveries | ${(result.updatedRoute as any).drops.length} Total Stops
                  </div>
                ` : ''}

                <div class="route-details">
                  <div class="detail-row">
                    <span class="label">${result.bookingsCount > 1 ? 'Route Number:' : 'Job Reference:'}</span>
                    <span class="value">${displayReference}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Scheduled:</span>
                    <span class="value">${scheduledDate} at ${scheduledTime}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Distance:</span>
                    <span class="value">${result.updatedRoute.optimizedDistanceKm ? (result.updatedRoute.optimizedDistanceKm).toFixed(1) + ' km' : 'N/A'}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Est. Duration:</span>
                    <span class="value">${result.updatedRoute.estimatedDuration ? (result.updatedRoute.estimatedDuration / 60).toFixed(0) + ' hours' : 'N/A'}</span>
                  </div>
                </div>

                <div class="earnings">
                  Your Earnings: £${result.updatedRoute.driverPayout ? (Number(result.updatedRoute.driverPayout) / 100).toFixed(2) : 'TBD'}
                </div>

                <p style="text-align: center;">
                  <a href="https://apps.apple.com/gb/app/speedy-van-driver/id6753916830" class="button">📱 Open Driver App</a>
                </p>

                <p style="margin-top: 20px; font-size: 14px; color: #6B7280;">
                  Tap the button above to open the Speedy Van Driver App and view your new ${result.bookingsCount > 1 ? 'multi-drop route' : 'job assignment'}. If you don't have the app installed, the link will take you to the App Store to download it. All details are available in your Dashboard and Schedule.
                </p>

                <p>Safe travels,<br>Speedy Van Team</p>
              </div>
              <div class="footer">
                <p>Speedy Van Driver App</p>
                <p>If you need help, contact us at support@speedy-van.co.uk or call 01202129764</p>
              </div>
            </div>
          </body>
          </html>
        `;

        console.log('📧 Step 3: Sending route email via UnifiedEmailService...');
        console.log('📧 To:', driver.User?.email);
        console.log('📧 Subject:', `New ${result.bookingsCount > 1 ? 'Route' : 'Job'} Assigned - ${displayReference} - Speedy Van`);
        
        const emailResult = await UnifiedEmailService.sendCustomEmail(
          driver.User?.email || '',
          `New ${result.bookingsCount > 1 ? 'Route' : 'Job'} Assigned - ${displayReference} - Speedy Van`,
          htmlContent
        );

        console.log('📧 Step 4: Route email send result:', emailResult);

        if (emailResult.success) {
          console.log('✅✅✅ ROUTE EMAIL SENT SUCCESSFULLY via', emailResult.provider);
          console.log('✅ Message ID:', emailResult.messageId);
        } else {
          console.error('❌❌❌ FAILED TO SEND ROUTE EMAIL');
          console.error('❌ Error:', emailResult.error);
        }
      } catch (emailError) {
        console.error('❌❌❌ EXCEPTION WHILE SENDING ROUTE EMAIL');
        console.error('❌ Error:', emailError);
        console.error('❌ Stack:', emailError instanceof Error ? emailError.stack : 'No stack');
        // Don't fail the request if email fails
      }
      
      console.log('📧 ========================================');
      console.log('📧 ROUTE EMAIL PROCESS COMPLETED');
      console.log('📧 ========================================');

      // Send real-time notifications
      try {
        const pusher = getPusherServer();

        // Get route number and booking references for display
        const routeNumber = result.updatedRoute.id; // Route ID is the route number (e.g., RT1A2B3C4D)
        const firstBooking = (result.updatedRoute as any).Booking?.[0];
        const displayReference = result.bookingsCount > 1 
          ? routeNumber // For multi-drop, show route number
          : (firstBooking?.reference || routeNumber); // For single order, show booking reference

        console.log('📡 Preparing to send Pusher notifications...');
        console.log('📡 Target driver ID:', driverId);
        console.log('📡 Target channel:', `driver-${driverId}`);

        // ✅ FIX: Create comprehensive payload with ALL required IDs
        const routeMatchedPayload = {
          // Core identifiers - iOS app needs ALL of these
          routeId: result.updatedRoute.id,
          bookingId: result.updatedRoute.id, // ✅ CRITICAL: iOS app primary ID
          orderId: result.updatedRoute.id, // ✅ CRITICAL: iOS app fallback ID
          assignmentId: `assignment_${Date.now()}_${result.updatedRoute.id}`, // ✅ CRITICAL: iOS app fallback
          
          // Route metadata
          type: result.bookingsCount > 1 ? 'multi-drop' : 'single-order',
          matchType: result.bookingsCount > 1 ? 'route' : 'order',
          routeNumber: routeNumber,
          bookingReference: displayReference,
          orderNumber: displayReference,
          
          // Counts
          bookingsCount: result.bookingsCount,
          jobCount: result.bookingsCount,
          dropCount: (result.updatedRoute as any).drops.length,
          dropsCount: (result.updatedRoute as any).drops.length,
          
          // Route details
          totalDistance: result.updatedRoute.optimizedDistanceKm,
          estimatedDuration: result.updatedRoute.estimatedDuration,
          totalEarnings: result.updatedRoute.driverPayout ? Number(result.updatedRoute.driverPayout) : 0,
          
          // Timing
          assignedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          expiresInSeconds: 1800,
          
          // Display
          message: `New ${result.bookingsCount > 1 ? 'route' : 'order'} ${displayReference} assigned to you`,
          drops: (result.updatedRoute as any).drops.map((drop: any) => ({
            id: drop.id,
            pickupAddress: drop.pickupAddress,
            deliveryAddress: drop.deliveryAddress,
          })),
        };

        console.log('📡 Sending "route-matched" event...');
        console.log('📡 Payload:', JSON.stringify(routeMatchedPayload, null, 2));
        
        // Notify the driver with "route-matched" event - THIS IS THE KEY EVENT
        await pusher.trigger(`driver-${driverId}`, 'route-matched', routeMatchedPayload);
        console.log('✅ "route-matched" event sent successfully');

        // ✅ FIX: Create comprehensive job-assigned payload with ALL required IDs
        const jobAssignedPayload = {
          // Core identifiers - iOS app needs ALL of these
          routeId: result.updatedRoute.id,
          bookingId: result.updatedRoute.id, // ✅ CRITICAL: iOS app primary ID
          orderId: result.updatedRoute.id, // ✅ CRITICAL: iOS app fallback ID
          assignmentId: `assignment_${Date.now()}_${result.updatedRoute.id}`, // ✅ CRITICAL: iOS app fallback
          
          // Route metadata
          type: 'route',
          matchType: result.bookingsCount > 1 ? 'route' : 'order',
          routeNumber: routeNumber,
          bookingReference: displayReference,
          orderNumber: displayReference,
          
          // Counts
          bookingsCount: result.bookingsCount,
          jobCount: result.bookingsCount,
          
          // Timing
          assignedAt: new Date().toISOString(),
          message: `You have been assigned a route with ${result.bookingsCount} jobs`,
        };

        console.log('📡 Sending "job-assigned" event...');
        console.log('📡 Payload:', JSON.stringify(jobAssignedPayload, null, 2));
        
        // Also send job-assigned event for backward compatibility
        // ✅ FIX: Include ALL required IDs for iOS app compatibility
        await pusher.trigger(`driver-${driverId}`, 'job-assigned', jobAssignedPayload);
        console.log('✅ "job-assigned" event sent successfully');

        // Notify other drivers that these jobs are no longer available
        // Remove ALL bookings in this route from available jobs
        const bookingsInRoute = await prisma.booking.findMany({
          where: { routeId: result.updatedRoute.id },
          select: { id: true, reference: true },
        });

        for (const booking of bookingsInRoute) {
          await pusher.trigger('drivers-broadcast', 'job-removed', {
            bookingId: booking.id,
            bookingReference: booking.reference,
            assignedTo: driver.User?.name || 'Unknown',
            message: 'This job has been assigned to a route',
            reason: 'route_created',
          });
        }
        console.log(`📡 Notified other drivers about ${bookingsInRoute.length} jobs removed from pool`);

        // Notify admin dashboard
        await pusher.trigger('admin-notifications', 'route-assigned', {
          routeId: result.updatedRoute.id,
          driverName: driver.User?.name || 'Unknown',
          bookingsCount: result.bookingsCount,
          assignedAt: new Date().toISOString(),
        });

        console.log('✅ Real-time notifications sent for route assignment');
      } catch (notificationError) {
        console.error('❌ Error sending real-time notifications:', notificationError);
        console.error('❌ Error stack:', notificationError instanceof Error ? notificationError.stack : 'No stack');
        // Don't fail the request if notifications fail
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          actorId: (session.user as any).id,
          actorRole: 'admin',
          action: 'route_assigned',
          targetType: 'route',
          targetId: routeId,
          details: {
            driverId: driverId,
            driverName: driver.User?.name || 'Unknown',
            bookingsCount: result.bookingsCount,
            dropsCount: (result.updatedRoute as any).drops.length,
            reason: reason || 'Assigned by admin',
            assignedAt: new Date().toISOString(),
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: `Route with ${result.bookingsCount} jobs assigned successfully`,
        data: {
          routeId: result.updatedRoute.id,
          driver: {
            id: driver.id,
            name: driver.User?.name || 'Unknown',
            email: driver.User?.email || '',
          },
          bookingsCount: result.bookingsCount,
          dropsCount: (result.updatedRoute as any).drops.length,
          totalDistance: result.updatedRoute.optimizedDistanceKm,
          estimatedDuration: result.updatedRoute.estimatedDuration,
          assignedAt: new Date().toISOString(),
        }
      });
    });

  } catch (error) {
    console.error('❌ Error assigning route to driver:', error);
    return NextResponse.json(
      {
        error: 'Failed to assign route',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
