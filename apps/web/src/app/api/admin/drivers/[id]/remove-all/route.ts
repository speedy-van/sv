import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/drivers/[id]/remove-all
 * Remove all orders and routes from a specific driver
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

    const driverId = params.id;
    const body = await request.json();
    const { reason, type = 'all' } = body; // type can be 'all', 'orders', or 'routes'

    console.log('🔄 Admin removing assignments from driver:', { driverId, type, reason });

    return await withPrisma(async (prisma) => {
      // Find the driver
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          User: {
            select: { name: true, email: true }
          }
        }
      });

      if (!driver) {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 404 }
        );
      }

      const driverName = driver.User?.name || 'Unknown';
      let removedOrders = 0;
      let removedRoutes = 0;

      await prisma.$transaction(async (tx) => {
        // Remove orders if requested
        if (type === 'all' || type === 'orders') {
          // Get all active bookings for this driver
          const bookings = await tx.booking.findMany({
            where: {
              driverId: driverId,
              status: {
                in: ['CONFIRMED', 'PENDING_PAYMENT']
              }
            },
            include: {
              Assignment: true
            }
          });

          removedOrders = bookings.length;

          // Update each booking
          for (const booking of bookings) {
            await tx.booking.update({
              where: { id: booking.id },
              data: {
                driverId: null,
                routeId: null,
                status: 'CONFIRMED'
              }
            });

            // Cancel assignment if exists
            if (booking.Assignment) {
              await tx.assignment.update({
                where: { id: booking.Assignment.id },
                data: {
                  status: 'cancelled',
                  updatedAt: new Date()
                }
              });
            }
          }
        }

        // Remove routes if requested
        if (type === 'all' || type === 'routes') {
          // Get all active routes for this driver
          const routes = await tx.route.findMany({
            where: {
              driverId: driverId,
              status: {
                in: ['planned', 'assigned', 'pending_assignment', 'in_progress']
              }
            },
            include: {
              Booking: true
            }
          });

          removedRoutes = routes.length;

          // Update each route
          for (const route of routes) {
            await tx.route.update({
              where: { id: route.id },
              data: {
                status: 'pending_assignment',
                updatedAt: new Date()
              }
            });

            // Remove driver from route after setting status
            await tx.route.update({
              where: { id: route.id },
              data: {
                driverId: null
              }
            });

            // Update all bookings in this route
            if (route.Booking && route.Booking.length > 0) {
              for (const booking of route.Booking) {
                await tx.booking.update({
                  where: { id: booking.id },
                  data: {
                    driverId: null,
                    routeId: null,
                    status: 'CONFIRMED'
                  }
                });

                // Cancel assignment
                const assignment = await tx.assignment.findUnique({
                  where: { bookingId: booking.id }
                });

                if (assignment) {
                  await tx.assignment.update({
                    where: { bookingId: booking.id },
                    data: {
                      status: 'cancelled',
                      updatedAt: new Date()
                    }
                  });
                }
              }
            }
          }
        }

        // Reset driver availability
        const driverAvailability = await tx.driverAvailability.findUnique({
          where: { driverId: driverId }
        });

        if (driverAvailability) {
          await tx.driverAvailability.update({
            where: { driverId: driverId },
            data: {
              currentCapacityUsed: 0,
              status: 'offline' // Set driver offline as a safety measure
            }
          });
        }
      });

      console.log('✅ All assignments removed successfully:', {
        driverId,
        driverName,
        removedOrders,
        removedRoutes,
        type,
        reason
      });

      return NextResponse.json({
        success: true,
        message: `Removed ${removedOrders} orders and ${removedRoutes} routes from ${driverName}`,
        data: {
          driverId,
          driverName,
          removedOrders,
          removedRoutes,
          type,
          reason
        }
      });

    });

  } catch (error) {
    console.error('❌ Error removing driver assignments:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove driver assignments'
      },
      { status: 500 }
    );
  }
}