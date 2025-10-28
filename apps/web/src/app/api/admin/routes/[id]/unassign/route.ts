import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPrisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

/**
 * Calculate earnings for completed drops only
 */
function calculatePartialRouteEarnings(
  completedDrops: number,
  totalDrops: number,
  totalRouteEarnings: number
): number {
  if (totalDrops === 0) return 0;
  
  // Calculate per-drop earnings
  const perDropEarnings = totalRouteEarnings / totalDrops;
  
  // Return earnings for completed drops only
  return Math.floor(perDropEarnings * completedDrops);
}

/**
 * POST /api/admin/routes/[id]/unassign
 * Unassign driver from a specific route with earnings recalculation
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
    
    // Parse request body safely
    let reason = 'Unassigned by admin';
    try {
      const body = await request.json();
      reason = body.reason || reason;
    } catch (e) {
      console.log('⚠️ No request body provided, using default reason');
    }

    console.log('🔄 Admin unassigning driver from route:', { routeId, reason });

    return await withPrisma(async (prisma) => {
      // Check if this is a single booking (starts with "booking-")
      if (routeId.startsWith('booking-')) {
        const bookingId = routeId.replace('booking-', '');
        
        console.log('🔄 Unassigning single booking:', bookingId);
        
        // Handle single booking unassignment
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
            driver: {
              include: {
                User: {
                  select: { id: true, name: true, email: true }
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
            { error: 'Booking is not assigned to any driver' },
            { status: 400 }
          );
        }

        const oldDriverId = booking.driverId;
        const oldDriverName = (booking as any).driver?.User?.name || (booking as any).driver?.name || 'Unknown';

        // Update booking - remove driver assignment
        await prisma.booking.update({
          where: { id: bookingId },
          data: { 
            driverId: null,
            status: 'CONFIRMED'
          }
        });

        // Cancel active assignment if exists
        const activeAssignment = await prisma.assignment.findFirst({
          where: { 
            bookingId: bookingId,
            status: { in: ['invited', 'claimed', 'accepted'] }
          }
        });

        if (activeAssignment) {
          await prisma.assignment.update({
            where: { id: activeAssignment.id },
            data: { 
              status: 'cancelled',
              updatedAt: new Date()
            }
          });
        }

        // Send Pusher notification to driver
        try {
          const pusher = getPusherServer();
          console.log('📡 Sending job-removed notification to driver:', oldDriverId);
          
          await pusher.trigger(`driver-${oldDriverId}`, 'job-removed', {
            bookingId: bookingId,
            bookingReference: booking.reference,
            reason: reason || 'Removed by admin',
            message: `Job ${booking.reference} has been unassigned by admin`
          });
          console.log('✅ Sent unassign notification to driver');
        } catch (pusherError) {
          console.error('❌ Failed to send Pusher notification:', pusherError);
        }

        console.log('✅ Booking unassigned successfully:', {
          bookingId,
          oldDriver: oldDriverName
        });

        return NextResponse.json({
          success: true,
          message: `Booking ${booking.reference} unassigned from ${oldDriverName} successfully`,
          data: {
            bookingId,
            oldDriver: oldDriverName
          }
        });
      }

      // Find the route with complete details (for multi-drop routes)
      const route = await prisma.route.findUnique({
        where: { id: routeId },
        include: {
          driver: {
            select: { id: true, name: true, email: true }
          },
          Booking: {
            select: {
              id: true,
              reference: true,
              status: true,
              Assignment: {
                select: {
                  id: true,
                  DriverEarnings: true
                }
              }
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

      if (!route.driverId) {
        return NextResponse.json(
          { error: 'Route is not assigned to any driver' },
          { status: 400 }
        );
      }

      const oldDriverName = (route as any).driver?.name || 'Unknown';
      const oldDriverId = route.driverId;
      const completedDrops = route.completedDrops || 0;
      const totalDrops = route.totalDrops || 0;

      // Calculate earnings for completed drops only
      const totalRouteValue = Number(route.totalOutcome || 0);
      const earnedAmount = calculatePartialRouteEarnings(
        completedDrops,
        totalDrops,
        totalRouteValue
      );

      let earningsData: any = null;

      // Unassign the driver using transaction
      await prisma.$transaction(async (tx) => {
        // Update route - remove driver and set back to pending_assignment
        await tx.route.update({
          where: { id: routeId },
          data: {
            status: 'pending_assignment',
            updatedAt: new Date()
          }
        });

        // Then actually remove the driver
        await tx.route.update({
          where: { id: routeId },
          data: {
            driverId: null
          }
        });

        // Recalculate and update earnings for completed drops
        if (completedDrops > 0 && (route as any).Booking && (route as any).Booking.length > 0) {
          for (const booking of (route as any).Booking) {
            if (booking.Assignment && booking.Assignment.DriverEarnings) {
              for (const earning of booking.Assignment.DriverEarnings) {
                // Update earnings to reflect only completed drops
                const adjustedEarnings = Math.floor(
                  (Number(earning.netAmountPence) * completedDrops) / totalDrops
                );

                await tx.driverEarnings.update({
                  where: { id: earning.id },
                  data: {
                    netAmountPence: adjustedEarnings,
                    adminAdjustedAmountPence: adjustedEarnings,
                    adminAdjustedBy: (session.user as any).id,
                    adminAdjustedAt: new Date(),
                    adminNotes: `Route cancelled - Adjusted to ${completedDrops}/${totalDrops} completed drops. Reason: ${reason || 'Route unassigned by admin'}`
                  }
                });

                // Store earnings data for response
                if (!earningsData) {
                  earningsData = {
                    originalAmount: Number(earning.netAmountPence),
                    adjustedAmount: adjustedEarnings,
                    completedDrops,
                    totalDrops
                  };
                }
              }
            }
          }
        }

        // Update all associated bookings - keep them in route but remove driver only
        if ((route as any).Booking && (route as any).Booking.length > 0) {
          for (const booking of (route as any).Booking) {
            await tx.booking.update({
              where: { id: booking.id },
              data: {
                driverId: null,
                // Keep routeId - bookings stay in the route (pending_assignment)
                // routeId: null,  ← Don't remove - keep in route!
                status: 'CONFIRMED'
              }
            });

            // Update assignment if exists
            const assignment = await tx.assignment.findFirst({
              where: { bookingId: booking.id },
              orderBy: { createdAt: 'desc' }
            });

            if (assignment) {
              await tx.assignment.update({
                where: { id: assignment.id },
                data: {
                  status: 'cancelled',
                  updatedAt: new Date()
                }
              });
            }
          }
        }

        // Update driver availability - moved outside transaction to avoid TX issues
        // Will be handled after transaction commits
      });

      // Update driver availability after transaction
      try {
        const driverAvailability = await prisma.driverAvailability.findUnique({
          where: { driverId: oldDriverId }
        });

        if (driverAvailability) {
          const bookingsCount = (route as any).Booking?.length || 0;
          await prisma.driverAvailability.update({
            where: { driverId: oldDriverId },
            data: {
              currentCapacityUsed: Math.max(0, driverAvailability.currentCapacityUsed - bookingsCount)
            }
          });
          console.log('✅ Driver availability updated');
        }
      } catch (availError) {
        console.warn('⚠️ Could not update driver availability (non-critical):', availError);
        // Don't fail the request
      }

      // Send real-time notifications to update schedules
      try {
        const pusher = getPusherServer();
        console.log('📡 Sending route unassign notifications...');
        
        // Notify admin channel
        await pusher.trigger('admin-channel', 'route-unassigned', {
          routeId,
          driverId: oldDriverId,
          driverName: oldDriverName,
          completedDrops,
          totalDrops,
          earningsAdjusted: !!earningsData,
          reason
        });

        // Notify driver channel
        await pusher.trigger(`driver-${oldDriverId}`, 'route-removed', {
          routeId,
          completedDrops,
          totalDrops,
          earnedAmount: earningsData?.adjustedAmount || 0,
          message: `Route removed by admin. ${completedDrops > 0 ? `You earned £${(earningsData?.adjustedAmount / 100).toFixed(2)} for ${completedDrops} completed drops.` : 'No earnings as no drops were completed.'}`,
          reason
        });

        // Notify driver schedule update
        await pusher.trigger(`driver-${oldDriverId}`, 'schedule-updated', {
          type: 'route_removed',
          routeId,
          timestamp: new Date().toISOString()
        });

        // Notify admin schedule update
        await pusher.trigger('admin-schedule', 'schedule-updated', {
          type: 'route_unassigned',
          routeId,
          driverId: oldDriverId,
          timestamp: new Date().toISOString()
        });

        console.log('📡 Real-time notifications sent successfully');
      } catch (pusherError) {
        console.error('⚠️ Failed to send Pusher notifications:', pusherError);
        console.error('⚠️ Error details:', pusherError instanceof Error ? pusherError.message : 'Unknown');
        // Don't fail the request if Pusher fails
      }

      console.log('✅ Route unassigned successfully:', {
        routeId,
        oldDriver: oldDriverName,
        bookingsAffected: (route as any).Booking?.length || 0,
        completedDrops,
        totalDrops,
        earningsAdjusted: !!earningsData,
        reason
      });

      return NextResponse.json({
        success: true,
        message: `Route ${routeId.substring(0, 8)} unassigned from ${oldDriverName}. ${completedDrops > 0 ? `Earnings adjusted for ${completedDrops}/${totalDrops} completed drops.` : ''}`,
        data: {
          routeId,
          previousDriver: oldDriverName,
          bookingsAffected: (route as any).Booking?.length || 0,
          completedDrops,
          totalDrops,
          earningsData,
          reason
        }
      });

    });

  } catch (error) {
    console.error('❌ Error unassigning route:', error);
    console.error('❌ Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error));
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unassign route',
        errorType: error instanceof Error ? error.name : 'Unknown',
      },
      { status: 500 }
    );
  }
}

