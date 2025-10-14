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
        console.log('❌ Route Decline API - No valid authentication found');
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
    const { reason } = body;

    console.log('🚗 Driver Route Decline API - Request:', { userId, routeId, reason });

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

    // Check if route is assigned to this driver
    if (route.driverId !== driver.id && route.status !== 'planned') {
      return NextResponse.json(
        { error: 'You are not assigned to this route' },
        { status: 403 }
      );
    }

    console.log('✅ Driver Route Decline API - Processing decline');

    let newAcceptanceRate = 100;

    // Decline the route and reassign
    await prisma.$transaction(async (tx) => {
      // Update route status back to planned
      await tx.route.update({
        where: { id: routeId },
        data: {
          driverId: { set: null },
          status: 'planned',
          updatedAt: new Date()
        }
      });

      // Reset all associated bookings
      const bookingIds = route.drops
        .filter((drop: any) => drop.Booking)
        .map((drop: any) => drop.Booking!.id);

      if (bookingIds.length > 0) {
        await tx.booking.updateMany({
          where: {
            id: { in: bookingIds }
          },
          data: {
            driverId: null,
            updatedAt: new Date()
          }
        });
      }

      // Reset all drops status
      await tx.drop.updateMany({
        where: {
          routeId: routeId
        },
        data: {
          status: 'pending',
        }
      });

      // Update driver performance - decrease acceptance rate by 5%
      const performance = await tx.driverPerformance.findUnique({
        where: { driverId: driver.id }
      });

      if (performance) {
        // Decrease acceptance rate by 5%, but never below 0%
        const currentRate = performance.acceptanceRate || 100;
        newAcceptanceRate = Math.max(0, currentRate - 5);

        await tx.driverPerformance.update({
          where: { driverId: driver.id },
          data: {
            acceptanceRate: newAcceptanceRate,
            lastCalculated: new Date()
          }
        });

        console.log(`📉 Acceptance rate decreased: ${currentRate}% → ${newAcceptanceRate}%`);
      }

      // Update driver's acceptance rate
      // Find total invitations and declines in last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const declinedCount = await tx.auditLog.count({
        where: {
          actorId: driver.id,
          action: { in: ['route_declined', 'job_declined'] },
          createdAt: { gte: thirtyDaysAgo }
        }
      });

      // Create audit log for decline
      await tx.auditLog.create({
        data: {
          actorId: userId,
          actorRole: 'driver',
          action: 'route_declined',
          targetType: 'route',
          targetId: routeId,
          details: {
            driverId: driver.id,
            driverName: driver.User?.name,
            reason: reason || 'Driver declined',
            dropCount: (route as any).drops.length,
            declinedAt: new Date().toISOString(),
            impactOnAcceptanceRate: true,
            totalDeclinesLast30Days: declinedCount + 1,
            acceptanceRateChange: -5,
            newAcceptanceRate
          }
        }
      });
    });

    // Auto-reassign route to next available driver
    try {
      const availableDrivers = await prisma.driver.findMany({
        where: {
          id: { not: driver.id },
          status: 'active',
          onboardingStatus: 'approved',
          DriverAvailability: {
            status: 'online'
          }
        },
        include: {
          User: {
            select: {
              name: true,
              email: true
            }
          },
          DriverAvailability: true,
          DriverPerformance: true
        },
        orderBy: {
          DriverPerformance: {
            acceptanceRate: 'desc'
          }
        },
        take: 5
      });

      if (availableDrivers.length > 0) {
        // Filter by capacity
        const eligibleDrivers = availableDrivers.filter(d => {
          const availability = d.DriverAvailability;
          return availability && availability.currentCapacityUsed < availability.maxConcurrentDrops;
        });

        if (eligibleDrivers.length > 0) {
          // Assign to the best driver (highest acceptance rate)
          const nextDriver = eligibleDrivers[0];
          
          // Update route assignment
          await prisma.route.update({
            where: { id: routeId },
            data: {
              driverId: nextDriver.id,
              status: 'assigned',
              updatedAt: new Date()
            }
          });

          const pusher = getPusherServer();

          // Notify next driver
          await pusher.trigger(`driver-${nextDriver.id}`, 'route-offer', {
            routeId: routeId,
            dropCount: (route as any).drops.length,
            estimatedEarnings: Number(route.driverPayout || 0) / 100,
            estimatedDuration: route.estimatedDuration,
            message: `New route assigned with ${(route as any).drops.length} stops (auto-reassigned)`,
            timestamp: new Date().toISOString()
          });

          // Notify admin about reassignment
          await pusher.trigger('admin-routes', 'route-reassigned', {
            routeId,
            previousDriver: driver.id,
            previousDriverName: driver.User?.name,
            newDriver: nextDriver.id,
            newDriverName: nextDriver.User?.name,
            dropCount: (route as any).drops.length,
            timestamp: new Date().toISOString()
          });

          console.log(`✅ Route auto-reassigned to driver: ${nextDriver.User?.name}`);
        } else {
          // No eligible drivers with capacity - offer to multiple drivers
          const pusher = getPusherServer();
          for (const altDriver of availableDrivers.slice(0, 3)) {
            try {
              await pusher.trigger(`driver-${altDriver.id}`, 'route-offer', {
                routeId: routeId,
                dropCount: (route as any).drops.length,
                estimatedEarnings: Number(route.driverPayout || 0) / 100,
                estimatedDuration: route.estimatedDuration,
                message: `New route available with ${(route as any).drops.length} stops`
              });
            } catch (e) {
              console.warn(`Failed to notify driver ${altDriver.id}:`, e);
            }
          }
          
          console.log(`✅ Route offered to ${Math.min(3, availableDrivers.length)} drivers`);
        }
      } else {
        console.log('⚠️ No available drivers for reassignment');
      }
    } catch (reassignError) {
      console.warn('⚠️ Failed to reassign route:', reassignError);
      // Continue even if reassignment fails
    }

    // Send real-time notifications
    try {
      const pusher = getPusherServer();
      
      // 1. INSTANT REMOVAL: Remove route from driver's UI
      await pusher.trigger(`driver-${driver.id}`, 'route-removed', {
        routeId,
        reason: 'declined',
        message: 'Route declined and removed from your schedule',
        timestamp: new Date().toISOString()
      });

      // 2. Update acceptance rate
      await pusher.trigger(`driver-${driver.id}`, 'acceptance-rate-updated', {
        acceptanceRate: newAcceptanceRate,
        change: -5,
        reason: 'route_declined',
        routeId,
        timestamp: new Date().toISOString()
      });

      // 3. Notify admin channel
      await pusher.trigger('admin-drivers', 'driver-acceptance-rate-updated', {
        driverId: driver.id,
        driverName: driver.User?.name || 'Unknown',
        acceptanceRate: newAcceptanceRate,
        change: -5,
        reason: 'route_declined',
        routeId,
        timestamp: new Date().toISOString()
      });

      // 4. Update driver schedule
      await pusher.trigger(`driver-${driver.id}`, 'schedule-updated', {
        type: 'route_removed',
        routeId,
        acceptanceRate: newAcceptanceRate,
        timestamp: new Date().toISOString()
      });

      // 5. Update admin schedule
      await pusher.trigger('admin-schedule', 'driver-performance-updated', {
        driverId: driver.id,
        acceptanceRate: newAcceptanceRate,
        type: 'acceptance_rate_decreased',
        timestamp: new Date().toISOString()
      });

      // 6. Update admin/routes panel
      await pusher.trigger('admin-routes', 'route-status-changed', {
        routeId,
        status: 'available',
        previousDriver: driver.id,
        driverName: driver.User?.name,
        reason: 'declined',
        dropCount: (route as any).drops.length,
        timestamp: new Date().toISOString()
      });

      console.log('📡 Real-time notifications sent successfully');
    } catch (pusherError) {
      console.error('⚠️ Failed to send notifications:', pusherError);
    }

    // Final admin notification about decline
    try {
      const pusher = getPusherServer();
      await pusher.trigger('admin-channel', 'route-declined', {
        routeId: routeId,
        driverId: driver.id,
        driverName: driver.User?.name || 'Unknown Driver',
        dropCount: (route as any).drops.length,
        reason: reason || 'Driver declined',
        declinedAt: new Date().toISOString(),
        acceptanceRate: newAcceptanceRate,
        autoReassigned: true,
        message: `Driver ${driver.User?.name} declined route with ${(route as any).drops.length} stops. Acceptance rate: ${newAcceptanceRate}%. Route auto-reassigned.`
      });

      console.log('✅ Admin notification sent via Pusher');
    } catch (pusherError) {
      console.warn('⚠️ Failed to send Pusher notification:', pusherError);
    }

    console.log('✅ Route declined successfully:', {
      routeId,
      driverId: driver.id,
      newAcceptanceRate
    });

    return NextResponse.json({
      success: true,
      message: 'Route declined successfully',
      warning: `Your acceptance rate decreased by 5% to ${newAcceptanceRate}%. Declining jobs affects your performance rating.`,
      data: {
        routeId: routeId,
        reassignedToOtherDrivers: true,
        acceptanceRate: newAcceptanceRate,
        change: -5
      }
    });

  } catch (error) {
    console.error('❌ Error declining route:', error);
    return NextResponse.json(
      {
        error: 'Failed to decline route',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

