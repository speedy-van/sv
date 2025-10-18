import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPrisma } from '@/lib/prisma';
import { getActiveAssignment } from '@/lib/utils/assignment-helpers';
import Pusher from 'pusher';

export const dynamic = 'force-dynamic';

// Initialize Pusher for real-time updates
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true,
});

/**
 * POST /api/admin/orders/[code]/unassign
 * Unassign driver from a specific order
 */
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

    console.log('🔄 Admin unassigning driver from order:', { code, reason });

    return await withPrisma(async (prisma) => {
      // Find the booking
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
          Assignment: true
        }
      });

      if (!booking) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      if (!booking.driverId && !booking.Assignment) {
        return NextResponse.json(
          { error: 'Order is not assigned to any driver' },
          { status: 400 }
        );
      }

      const oldDriverName = booking.driver?.User?.name || 'Unknown';
      const oldDriverId = booking.driverId;

      // Unassign the driver using transaction
      await prisma.$transaction(async (tx) => {
        // Update booking - remove driver
        await tx.booking.update({
          where: { reference: code },
          data: {
            driverId: null,
            status: 'CONFIRMED' // Keep it confirmed but available for reassignment
          }
        });

        // Delete or update assignment
        const activeAssignment = getActiveAssignment(booking.Assignment);
        if (activeAssignment) {
          await tx.assignment.update({
            where: { id: activeAssignment.id },
            data: {
              status: 'cancelled',
              updatedAt: new Date()
            }
          });
        }

        // Update driver availability if needed
        if (oldDriverId) {
          const driverAvailability = await tx.driverAvailability.findUnique({
            where: { driverId: oldDriverId }
          });

          if (driverAvailability && driverAvailability.currentCapacityUsed > 0) {
            await tx.driverAvailability.update({
              where: { driverId: oldDriverId },
              data: {
                currentCapacityUsed: Math.max(0, driverAvailability.currentCapacityUsed - 1)
              }
            });
          }
        }
      });

      // Send real-time notifications to update schedules
      try {
        // Notify admin channel
        await pusher.trigger('admin-channel', 'order-unassigned', {
          orderRef: code,
          driverId: oldDriverId,
          driverName: oldDriverName,
          reason
        });

        // Notify driver channel
        await pusher.trigger(`driver-${oldDriverId}`, 'order-removed', {
          orderRef: code,
          message: `Order #${code} has been removed from your schedule by admin. Reason: ${reason || 'Not specified'}`,
          reason
        });

        // Notify driver schedule update
        await pusher.trigger(`driver-${oldDriverId}`, 'schedule-updated', {
          type: 'order_removed',
          orderRef: code,
          timestamp: new Date().toISOString()
        });

        // Notify admin schedule update
        await pusher.trigger('admin-schedule', 'schedule-updated', {
          type: 'order_unassigned',
          orderRef: code,
          driverId: oldDriverId,
          timestamp: new Date().toISOString()
        });

        console.log('📡 Real-time notifications sent successfully');
      } catch (pusherError) {
        console.error('⚠️ Failed to send Pusher notifications:', pusherError);
        // Don't fail the request if Pusher fails
      }

      console.log('✅ Order unassigned successfully:', {
        orderRef: code,
        oldDriver: oldDriverName,
        reason
      });

      return NextResponse.json({
        success: true,
        message: `Order ${code} unassigned from ${oldDriverName}`,
        data: {
          orderRef: code,
          previousDriver: oldDriverName,
          reason
        }
      });

    });

  } catch (error) {
    console.error('❌ Error unassigning order:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to unassign order'
      },
      { status: 500 }
    );
  }
}

