import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
        console.log('❌ Route Accept API - No valid authentication found');
        return NextResponse.json(
          { error: 'Unauthorized - Driver access required' },
          { status: 401 }
        );
      }

      userId = session.user.id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    const { id: routeId } = await params;

    console.log('🚗 Driver Route Accept API - Request:', { userId, routeId });

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId },
      select: { 
        id: true, 
        status: true, 
        onboardingStatus: true,
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

    if (driver.status !== 'active' || driver.onboardingStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Driver account not active or approved' },
        { status: 403 }
      );
    }

    // Get route with all details
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        drops: {
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

    // Check if route is available
    if (route.status !== 'planned') {
      return NextResponse.json(
        { error: 'Route is not available for acceptance' },
        { status: 400 }
      );
    }

    // Check if route already assigned to another driver
    // route.driverId is User.id, not Driver.id
    if (route.driverId && route.driverId !== userId) {
      return NextResponse.json(
        { error: 'Route already assigned to another driver' },
        { status: 400 }
      );
    }

    console.log('✅ Driver Route Accept API - Assigning route to driver');

    // ✅ CHECK: Does driver have any active jobs/routes for today?
    const activeJobs = await prisma.assignment.findMany({
      where: {
        driverId: driver.id,
        status: 'accepted',
        Booking: {
          scheduledAt: {
            gte: new Date() // Future or current jobs
          },
          status: { in: ['CONFIRMED'] }
        }
      },
      include: {
        Booking: {
          select: { scheduledAt: true, status: true }
        }
      }
    });

    const activeRoutes = await prisma.route.findMany({
      where: {
        driverId: userId,
        status: { in: ['assigned', 'in_progress'] }
      }
    });

    const totalActiveWork = activeJobs.length + activeRoutes.length;
    console.log(`📊 Driver has ${totalActiveWork} active work item(s) (${activeJobs.length} jobs + ${activeRoutes.length} routes)`);

    // Accept the route and update all related records
    const result = await prisma.$transaction(async (tx) => {
      // Update route status to assigned
      // route.driverId must be User.id, not Driver.id
      const updatedRoute = await tx.route.update({
        where: { id: routeId },
        data: {
          driverId: userId,
          status: 'assigned',
          // acceptedAt removed - field does not exist in database
          acceptanceStatus: 'accepted',
          updatedAt: new Date()
        }
      });

      // Update all associated bookings
      // booking.driverId is Driver.id (different from route.driverId which is User.id)
      const bookingIds = route.drops
        .filter(drop => drop.Booking)
        .map(drop => drop.Booking!.id);

      if (bookingIds.length > 0) {
        await tx.booking.updateMany({
          where: {
            id: { in: bookingIds }
          },
          data: {
            driverId: driver.id,
            status: 'CONFIRMED',
            updatedAt: new Date()
          }
        });
      }

      // Update all drops status
      await tx.drop.updateMany({
        where: {
          routeId: routeId
        },
        data: {
          status: 'assigned',
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorId: userId,
          actorRole: 'driver',
          action: 'route_accepted',
          targetType: 'route',
          targetId: routeId,
          details: {
            driverId: driver.id,
            driverName: driver.User?.name,
            dropCount: route.drops.length,
            totalEarnings: Number(route.driverPayout || 0),
            acceptedAt: new Date().toISOString()
          }
        }
      });

      return updatedRoute;
    });

    // Send real-time notification to admin via Pusher
    try {
      const pusher = getPusherServer();
      const timestamp = new Date().toISOString();
      const estimatedEarnings = `£${(Number(route.driverPayout || 0) / 100).toFixed(2)}`;
      
      console.log('📡 Sending admin notifications for route acceptance...');

      // 1. Notify admin-notifications channel (GREEN NOTIFICATION)
      await pusher.trigger('admin-notifications', 'driver-accepted-route', {
        type: 'route_accepted',
        severity: 'success',
        routeId: routeId,
        routeNumber: route.id,
        driverId: driver.id,
        driverName: driver.User?.name || 'Unknown Driver',
        driverEmail: driver.User?.email,
        dropCount: route.drops.length,
        estimatedEarnings,
        message: `${driver.User?.name || 'Driver'} accepted route with ${route.drops.length} stops`,
        acceptedAt: timestamp,
        timestamp
      });

      // 2. Notify admin-routes channel
      await pusher.trigger('admin-routes', 'route-accepted', {
        routeId: routeId,
        routeNumber: route.id,
        driverId: driver.id,
        driverName: driver.User?.name || 'Unknown Driver',
        dropCount: route.drops.length,
        estimatedEarnings,
        acceptedAt: timestamp,
        timestamp
      });

      // 3. Notify admin-channel (legacy support)
      await pusher.trigger('admin-channel', 'route-accepted', {
        routeId: routeId,
        driverId: driver.id,
        driverName: driver.User?.name || 'Unknown Driver',
        dropCount: route.drops.length,
        totalEarnings: Number(route.driverPayout || 0) / 100,
        acceptedAt: timestamp,
        message: `Driver ${driver.User?.name} accepted route with ${route.drops.length} stops`
      });

      // 4. Notify admin-drivers channel
      await pusher.trigger('admin-drivers', 'driver-accepted-route', {
        driverId: driver.id,
        driverName: driver.User?.name || 'Unknown Driver',
        routeId: routeId,
        dropCount: route.drops.length,
        timestamp
      });

      console.log('✅ Admin notifications sent via Pusher for route acceptance');
    } catch (pusherError) {
      console.warn('⚠️ Failed to send Pusher notification:', pusherError);
      console.error('⚠️ Error details:', pusherError instanceof Error ? pusherError.message : 'Unknown');
      // Continue even if Pusher fails
    }

    // Update driver schedule
    try {
      await prisma.driverShift.create({
        data: {
          id: `shift_${routeId}_${Date.now()}`,
          driverId: driver.id,
          startTime: route.startTime,
          endTime: route.endTime || new Date(route.startTime.getTime() + (route.estimatedDuration || 480) * 60 * 1000),
          isActive: true,
          isRecurring: false,
          updatedAt: new Date()
        }
      });

      console.log('✅ Driver schedule updated');
    } catch (scheduleError) {
      console.warn('⚠️ Failed to update driver schedule:', scheduleError);
      // Continue even if schedule update fails
    }

    console.log('🎉 Route accepted successfully:', {
      routeId,
      driverId: driver.id,
      dropCount: route.drops.length
    });

    // ✅ Prepare response message based on job queue
    const isFirstWork = totalActiveWork === 0;
    const queuePosition = totalActiveWork + 1;
    const responseMessage = isFirstWork
      ? `Route accepted! You can start this route now.`
      : `Route accepted and added to your schedule (Position ${queuePosition}). Complete your current work first.`;

    return NextResponse.json({
      success: true,
      message: responseMessage,
      data: {
        routeId: result.id,
        status: result.status,
        dropCount: route.drops.length,
        estimatedEarnings: Number(result.driverPayout || 0) / 100,
        queueInfo: {
          position: queuePosition,
          isQueued: !isFirstWork,
          activeWork: totalActiveWork,
          canStartNow: isFirstWork
        }
      }
    });

  } catch (error) {
    console.error('❌ Error accepting route:', error);
    return NextResponse.json(
      {
        error: 'Failed to accept route',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

