import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPrisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/**
 * POST /api/admin/routes/[id]/reassign
 * Reassign an existing route to a different driver
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const routeId = params.id;
    const body = await request.json();
    const { driverId, reason } = body;

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Admin reassigning route to different driver:', { routeId, driverId, reason });

    return await withPrisma(async (prisma) => {
      // Check if this is a single booking (starts with "booking-")
      if (routeId.startsWith('booking-')) {
        const bookingId = routeId.replace('booking-', '');
        
        // Handle single booking reassignment
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            driver: {
              include: {
                User: { select: { name: true, email: true } }
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

        // Update booking driver assignment
        await prisma.booking.update({
          where: { id: bookingId },
          data: { driverId: driverId }
        });

        // Log audit trail
        await logAudit(
          session.user.id,
          'booking_driver_reassigned',
          bookingId,
          {
            targetType: 'booking',
            before: { driverId: booking.driverId, driverName: booking.driver?.User?.name },
            after: { driverId: driverId, reason }
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Booking driver reassigned successfully'
        });
      }

      // Check if route exists (for multi-drop routes)
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
          },
        },
      });

      if (!route) {
        return NextResponse.json({ error: 'Route not found' }, { status: 404 });
      }

      const oldDriverId = route.driverId;
      const oldDriverName = (route as any).driver?.name || 'Unknown';

      // Check if new driver exists
      const newDriver = await prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          User: {
            select: { name: true, email: true }
          },
          DriverAvailability: true
        }
      });

      if (!newDriver) {
        return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
      }

      // Check if driver is available
      if (!newDriver.DriverAvailability) {
        return NextResponse.json(
          { error: 'Driver availability not found' },
          { status: 400 }
        );
      }

      // Check driver status
      const validStatuses = ['AVAILABLE', 'online', 'available'];
      if (!validStatuses.includes(newDriver.DriverAvailability.status)) {
        return NextResponse.json(
          { error: `Driver is not available for assignments (status: ${newDriver.DriverAvailability.status})` },
          { status: 400 }
        );
      }

      // Use transaction to ensure data consistency
      const result = await prisma.$transaction(async (tx) => {
        // Update route with new driver
        const updatedRoute = await tx.route.update({
          where: { id: routeId },
          data: {
            driverId,
            isModifiedByAdmin: true,
            adminNotes: `Driver reassigned from ${oldDriverName} to ${newDriver.User?.name || 'Unknown'} by admin. Reason: ${reason || 'Not specified'}`,
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
            Booking: true,
          },
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
            },
          });

          // Update assignments for all bookings in the route
          for (const booking of route.Booking) {
            // Cancel old assignment
            if (booking.Assignment) {
              await tx.assignment.update({
                where: { id: booking.Assignment.id },
                data: {
                  status: 'cancelled',
                  updatedAt: new Date(),
                }
              });

              // Create job event for removal
              const removalEventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_removed`;
              await tx.jobEvent.create({
                data: {
                  id: removalEventId,
                  assignmentId: booking.Assignment.id,
                  step: 'job_completed',
                  payload: {
                    removedBy: 'admin',
                    reason: reason || 'Route reassigned to different driver',
                    removedAt: new Date().toISOString(),
                    action: 'job_removed',
                  },
                  notes: `Job removed from driver ${oldDriverName} by admin (route reassignment)`,
                  createdBy: (session.user as any).id,
                }
              });
            }

            // Create new assignment
            const assignmentId = `assignment_${Date.now()}_${booking.id}_${driverId}`;
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

            // Create job event for new assignment
            const assignmentEventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await tx.jobEvent.create({
              data: {
                id: assignmentEventId,
                assignmentId: assignmentId,
                step: 'navigate_to_pickup',
                payload: {
                  assignedBy: 'admin',
                  reason: reason || 'Reassigned via route',
                  assignedAt: new Date().toISOString(),
                  action: 'job_assigned',
                  routeId: routeId,
                },
                notes: `Job assigned to driver ${newDriver.User?.name || 'Unknown'} as part of reassigned route ${routeId}`,
                createdBy: (session.user as any).id,
              }
            });
          }
        }

        return { updatedRoute, bookingsCount: bookingIds.length };
      });

      console.log('🎉 Route reassignment completed:', {
        routeId: result.updatedRoute.id,
        oldDriver: oldDriverName,
        newDriver: newDriver.User?.name || 'Unknown',
        bookingsCount: result.bookingsCount
      });

      // Send real-time notifications
      try {
        const pusher = getPusherServer();

        // Notify the old driver about removal
        if (oldDriverId) {
          await pusher.trigger(`driver-${oldDriverId}`, 'route-removed', {
            routeId: result.updatedRoute.id,
            reason: reason || 'Route reassigned to different driver',
            removedAt: new Date().toISOString(),
            message: 'A route has been removed from your assignments',
          });
        }

        // Get route number for display
        const routeNumber = result.updatedRoute.id; // Route ID is the route number (e.g., RT1A2B3C4D)
        const firstBooking = (result.updatedRoute as any).Booking?.[0];
        const displayReference = result.bookingsCount > 1 
          ? routeNumber // For multi-drop, show route number
          : (firstBooking?.reference || routeNumber); // For single order, show booking reference

        // Notify the new driver with "route-matched" event
        await pusher.trigger(`driver-${driverId}`, 'route-matched', {
          type: 'full-route',
          routeId: result.updatedRoute.id,
          routeNumber: routeNumber, // ✅ Route number (RT1A2B3C4D)
          bookingReference: displayReference, // ✅ Display reference
          orderNumber: displayReference, // ✅ Alias for consistency
          bookingsCount: result.bookingsCount,
          dropsCount: (result.updatedRoute as any).drops.length,
          totalDistance: result.updatedRoute.optimizedDistanceKm,
          estimatedDuration: result.updatedRoute.estimatedDuration,
          totalEarnings: result.updatedRoute.driverPayout ? Number(result.updatedRoute.driverPayout) : 0,
          assignedAt: new Date().toISOString(),
          message: `Route ${displayReference} with ${result.bookingsCount} jobs has been reassigned to you`,
          drops: (result.updatedRoute as any).drops.map((drop: any) => ({
            id: drop.id,
            pickupAddress: drop.pickupAddress,
            deliveryAddress: drop.deliveryAddress,
          })),
        });

        // Also send job-assigned event for backward compatibility
        await pusher.trigger(`driver-${driverId}`, 'job-assigned', {
          type: 'route',
          routeId: result.updatedRoute.id,
          bookingsCount: result.bookingsCount,
          assignedAt: new Date().toISOString(),
          message: `You have been assigned a route with ${result.bookingsCount} jobs`,
        });

        // Notify admin dashboard
        await pusher.trigger('admin-notifications', 'route-reassigned', {
          routeId: result.updatedRoute.id,
          oldDriver: oldDriverName,
          newDriver: newDriver.User?.name || 'Unknown',
          bookingsCount: result.bookingsCount,
          reassignedAt: new Date().toISOString(),
        });

        console.log('✅ Real-time notifications sent for route reassignment');
      } catch (notificationError) {
        console.error('❌ Error sending real-time notifications:', notificationError);
        // Don't fail the request if notifications fail
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          actorId: (session.user as any).id,
          actorRole: 'admin',
          action: 'route_reassigned',
          targetType: 'route',
          targetId: routeId,
          details: {
            oldDriverId: oldDriverId,
            oldDriverName: oldDriverName,
            newDriverId: driverId,
            newDriverName: newDriver.User?.name || 'Unknown',
            bookingsCount: result.bookingsCount,
            reason: reason || 'Reassigned by admin',
            reassignedAt: new Date().toISOString(),
          }
        }
      });

      return NextResponse.json({
        success: true,
        route: result.updatedRoute,
        message: `Route with ${result.bookingsCount} jobs reassigned successfully to ${newDriver.User?.name || 'Unknown'}`,
        data: {
          routeId: result.updatedRoute.id,
          oldDriver: oldDriverName,
          newDriver: {
            id: newDriver.id,
            name: newDriver.User?.name || 'Unknown',
            email: newDriver.User?.email || '',
          },
          bookingsCount: result.bookingsCount,
          dropsCount: (result.updatedRoute as any).drops.length,
          reassignedAt: new Date().toISOString(),
        }
      });
    });
  } catch (error) {
    console.error('❌ Reassign driver error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to reassign driver',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
