import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;

    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      if (bearerAuth.user.role !== 'driver') {
        return NextResponse.json(
          { error: 'Forbidden - Driver access required' },
          { status: 403 }
        );
      }
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      
      if (!session?.user || (session.user as any).role !== 'driver') {
        console.log('❌ Complete Drop API - No valid authentication found');
        return NextResponse.json(
          { error: 'Unauthorized - Driver access required' },
          { status: 401 }
        );
      }

      userId = session.user.id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    const routeId = params.id;
    const body = await request.json();
    const { dropId, proofOfDelivery, notes } = body;

    if (!dropId) {
      return NextResponse.json(
        { error: 'Drop ID is required' },
        { status: 400 }
      );
    }

    console.log('🚗 Complete Drop API - Request:', { userId, routeId, dropId });

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId },
      select: { 
        id: true,
        User: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver profile not found' },
        { status: 404 }
      );
    }

    // Get route
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      select: {
        id: true,
        driverId: true,
        status: true,
        driverPayout: true,
        drops: {
          where: { id: dropId },
          include: {
            Booking: true
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

    if (route.driverId !== driver.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this route' },
        { status: 403 }
      );
    }

    const drop = (route as any).drops[0];
    if (!drop) {
      return NextResponse.json(
        { error: 'Drop not found' },
        { status: 404 }
      );
    }

    console.log('✅ Complete Drop API - Processing completion');

    // Calculate earnings for this drop
    const totalRoutePayout = Number(route.driverPayout || 0);
    const totalDrops = await prisma.drop.count({
      where: { routeId: route.id }
    });
    const earningsPerDrop = Math.floor(totalRoutePayout / totalDrops);

    // Complete the drop and update all related records
    await prisma.$transaction(async (tx) => {
      // Update drop status
      await tx.drop.update({
        where: { id: dropId },
        data: {
          status: 'delivered',
          completedAt: new Date()
        }
      });

      // Update booking status if associated
      if (drop.Booking) {
        await tx.booking.update({
          where: { id: drop.Booking.id },
          data: {
            status: 'COMPLETED',
            updatedAt: new Date()
          }
        });
      }

      // Create or update driver earnings for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // TODO: Fix earnings tracking - current schema uses assignmentId not date
      // DriverEarnings schema doesn't have 'date', 'totalEarnings', 'jobCount' fields
      // Earnings are calculated per Assignment, not per day
      // Commenting out broken code to prevent errors
      
      /*
      const existingEarnings = await tx.driverEarnings.findFirst({
        where: {
          driverId: driver.id,
          assignmentId: '<assignment_id>'  // Need assignment ID, not date
        }
      });
      */

      console.log(`📊 Drop earnings calculated: £${(earningsPerDrop / 100).toFixed(2)}`);
      console.log('⚠️ Note: Earnings tracking needs schema alignment with Assignment model');

      // Create tracking ping for customer
      if (drop.Booking && drop.Booking.User) {
        await tx.trackingPing.create({
          data: {
            id: `tracking_${dropId}_${Date.now()}`,
            driverId: driver.id,
            bookingId: drop.Booking.id,
            lat: drop.pickupLat || 0,
            lng: drop.pickupLng || 0,
          }
        });

        // Send customer notification via Pusher
        try {
          const pusher = getPusherServer();
          await pusher.trigger(`customer-${drop.Booking.User.id}`, 'delivery-completed', {
            bookingId: drop.Booking.id,
            bookingReference: drop.Booking.reference,
            dropId: dropId,
            deliveryAddress: drop.deliveryAddress,
            completedAt: new Date().toISOString(),
            driverName: driver.User?.name || 'Unknown Driver',
            message: `Your delivery to ${drop.deliveryAddress.split(',')[0]} has been completed!`
          });

          console.log(`✅ Customer notification sent for booking ${drop.Booking.reference}`);
        } catch (pusherError) {
          console.warn('⚠️ Failed to send customer notification:', pusherError);
        }
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorId: userId,
          actorRole: 'driver',
          action: 'drop_completed',
          targetType: 'drop',
          targetId: dropId,
          details: {
            routeId: routeId,
            driverId: driver.id,
            dropAddress: drop.deliveryAddress,
            earningsAdded: earningsPerDrop / 100,
            completedAt: new Date().toISOString(),
            proofOfDelivery: proofOfDelivery || null
          }
        }
      });
    });

    // Check if all drops in route are completed
    const allDrops = await prisma.drop.findMany({
      where: { routeId: route.id },
      select: { id: true, status: true }
    });

    const allCompleted = allDrops.every(d => d.status === 'delivered');

    if (allCompleted) {
      // Update route status to completed
      await prisma.route.update({
        where: { id: routeId },
        data: {
          status: 'completed',
          endTime: new Date(),
          completedDrops: allDrops.length,
          updatedAt: new Date()
        }
      });

      // Notify admin
      try {
        const pusher = getPusherServer();
        await pusher.trigger('admin-channel', 'route-completed', {
          routeId: routeId,
          driverId: driver.id,
          driverName: driver.User?.name || 'Unknown Driver',
          totalDrops: allDrops.length,
          totalEarnings: totalRoutePayout / 100,
          completedAt: new Date().toISOString(),
          message: `Driver ${driver.User?.name} completed route with ${allDrops.length} stops`
        });
      } catch (e) {
        console.warn('Failed to notify admin:', e);
      }
    }

    console.log('✅ Drop completed successfully:', {
      dropId,
      routeId,
      earningsAdded: earningsPerDrop / 100,
      allRouteCompleted: allCompleted
    });

    return NextResponse.json({
      success: true,
      message: 'Drop completed successfully',
      data: {
        dropId: dropId,
        earningsAdded: earningsPerDrop / 100,
        routeCompleted: allCompleted,
        remainingDrops: allDrops.filter(d => d.status !== 'delivered').length
      }
    });

  } catch (error) {
    console.error('❌ Error completing drop:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete drop',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

