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

        // Update booking driver assignment
        await prisma.booking.update({
          where: { id: bookingId },
          data: { driverId: driverId }
        });

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

        return NextResponse.json({
          success: true,
          message: 'Booking assigned to driver successfully'
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

      // Send real-time notifications
      try {
        const pusher = getPusherServer();

        // Get route number and booking references for display
        const routeNumber = result.updatedRoute.id; // Route ID is the route number (e.g., RT1A2B3C4D)
        const firstBooking = (result.updatedRoute as any).Booking?.[0];
        const displayReference = result.bookingsCount > 1 
          ? routeNumber // For multi-drop, show route number
          : (firstBooking?.reference || routeNumber); // For single order, show booking reference

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

        // Notify the driver with "route-matched" event - THIS IS THE KEY EVENT
        await pusher.trigger(`driver-${driverId}`, 'route-matched', routeMatchedPayload);

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

        // Also send job-assigned event for backward compatibility
        // ✅ FIX: Include ALL required IDs for iOS app compatibility
        await pusher.trigger(`driver-${driverId}`, 'job-assigned', jobAssignedPayload);

        // Notify other drivers
        await pusher.trigger('drivers-channel', 'route-assigned', {
          routeId: result.updatedRoute.id,
          assignedTo: driver.User?.name || 'Unknown',
          bookingsCount: result.bookingsCount,
          message: 'This route has been assigned to another driver',
        });

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
