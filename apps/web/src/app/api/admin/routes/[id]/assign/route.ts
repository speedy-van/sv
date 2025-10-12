import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPrisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

/**
 * POST /api/admin/routes/[id]/assign
 * Assign a complete route to a driver for the first time
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const routeId = params.id;
    const { driverId, reason } = await request.json();

    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    console.log('🚗 Admin assigning route to driver:', { routeId, driverId, reason });

    return await withPrisma(async (prisma) => {
      // Get the route with all details
      const route = await prisma.route.findUnique({
        where: { id: routeId },
        include: {
          User: {
            select: { name: true, email: true }
          },
          Drop: {
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
            status: 'assigned',
            isModifiedByAdmin: true,
            adminNotes: reason || 'Assigned by admin',
          },
          include: {
            User: {
              select: { name: true, email: true }
            },
            Drop: {
              orderBy: { createdAt: 'asc' }
            },
            Booking: true
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
            // Cancel any existing assignment
            if (booking.Assignment) {
              await tx.assignment.update({
                where: { id: booking.Assignment.id },
                data: {
                  status: 'cancelled',
                  updatedAt: new Date(),
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
        if (route.Drop.length > 0) {
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
        dropsCount: result.updatedRoute.Drop.length
      });

      // Send real-time notifications
      try {
        const pusher = getPusherServer();

        // Get first booking reference for display
        const firstBooking = result.updatedRoute.Booking?.[0];
        const bookingReference = firstBooking?.reference || `ROUTE-${result.updatedRoute.id.slice(-8).toUpperCase()}`;

        // Notify the driver with "route-matched" event - THIS IS THE KEY EVENT
        await pusher.trigger(`driver-${driverId}`, 'route-matched', {
          type: result.bookingsCount > 1 ? 'multi-drop' : 'single-order',
          routeId: result.updatedRoute.id,
          bookingReference: bookingReference,  // ✅ CRITICAL: Same ID as Admin/Customer sees
          orderNumber: bookingReference,  // ✅ Alias for consistency
          bookingsCount: result.bookingsCount,
          jobCount: result.bookingsCount,  // For mobile app compatibility
          dropCount: result.updatedRoute.Drop.length,
          dropsCount: result.updatedRoute.Drop.length,
          totalDistance: result.updatedRoute.optimizedDistanceKm,
          estimatedDuration: result.updatedRoute.estimatedDuration,
          estimatedEarnings: result.updatedRoute.driverPayout ? Number(result.updatedRoute.driverPayout) : 0,
          totalEarnings: result.updatedRoute.driverPayout ? Number(result.updatedRoute.driverPayout) : 0,
          assignedAt: new Date().toISOString(),
          message: `New ${result.bookingsCount > 1 ? 'route' : 'order'} ${bookingReference} assigned to you`,
          drops: result.updatedRoute.Drop.map(drop => ({
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
            dropsCount: result.updatedRoute.Drop.length,
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
          dropsCount: result.updatedRoute.Drop.length,
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
