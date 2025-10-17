/**
 * POST /api/admin/routes/create
 * 
 * Create a new route manually from selected bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { intelligentRouteOptimizer } from '@/lib/services/intelligent-route-optimizer';

/**
 * Get or create a system driver for unassigned routes
 */
async function getOrCreateSystemDriver() {
  try {
    // Try to find existing system driver
    let systemDriver = await prisma.user.findFirst({
      where: {
        email: 'system@speedy-van.co.uk',
        role: 'driver'
      }
    });

    if (!systemDriver) {
      // Create system driver if not exists
      // Create minimal user with a placeholder password to satisfy schema
      systemDriver = await prisma.user.create({
        data: {
          email: 'system@speedy-van.co.uk',
          name: 'System Driver',
          role: 'driver',
          password: 'temporary-generated-password',
          isActive: true,
          emailVerified: true
        }
      });
    }

    return systemDriver;
  } catch (error) {
    console.error('❌ Failed to get/create system driver:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingIds, driverId } = body;

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'bookingIds array is required' },
        { status: 400 }
      );
    }

    // Get bookings
    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
        status: 'CONFIRMED',
        routeId: null,
      },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        BookingItem: true,
      },
    });

    if (bookings.length !== bookingIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some bookings are not available or already assigned' },
        { status: 400 }
      );
    }

  // Analyze the route using multi-drop eligibility per booking then aggregate
  const analyses = await Promise.all(bookings.map(async (b) => {
    return intelligentRouteOptimizer.analyzeMultiDropEligibility({
      pickup: {
        coordinates: { lat: b.pickupAddress.lat || 0, lng: b.pickupAddress.lng || 0 },
      },
      dropoff: {
        coordinates: { lat: b.dropoffAddress.lat || 0, lng: b.dropoffAddress.lng || 0 },
      },
      items: [],
      floorLevel: 0,
      hasLift: false,
    } as any);
  }));

  const totalDistance = analyses.reduce((sum, a: any) => sum + (a.route.distance || 0), 0);
  const totalDuration = analyses.reduce((sum, a: any) => sum + (a.route.totalTime || 0), 0);
  const totalValue = bookings.reduce((sum, b) => sum + Number(b.totalGBP || 0), 0);

    // Create route
    // Get the driver userId to use (either provided driver's userId or system driver for unassigned)
    let routeDriverUserId: string;
    if (driverId) {
      // If driverId provided, get the corresponding userId
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { userId: true }
      });
      if (!driver) {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 404 }
        );
      }
      routeDriverUserId = driver.userId;
    } else {
      // Use system driver for unassigned routes
      routeDriverUserId = (await getOrCreateSystemDriver()).id;
    }

    const route = await prisma.route.create({
      data: {
        id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: driverId ? 'assigned' : 'planned',
        driver: { connect: { id: routeDriverUserId } }, // ✅ Route.driverId references User.id
        startTime: new Date(),
    optimizedDistanceKm: totalDistance * 1.609,
    estimatedDuration: Math.round(totalDuration),
    totalOutcome: totalValue,
      },
    });

    // Update bookings
    for (let i = 0; i < bookings.length; i++) {
      await prisma.booking.update({
        where: { id: bookings[i].id },
        data: {
          routeId: route.id,
          deliverySequence: i + 1,
          orderType: bookings.length > 1 ? 'multi-drop' : 'single',
        },
      });
    }

    // If driver assigned, notify them
    if (driverId) {
      try {
        const { getPusherServer } = await import('@/lib/pusher');
        const pusher = getPusherServer();
        
        await pusher.trigger(`driver-${driverId}`, 'route-assigned', {
          routeId: route.id,
          stops: bookings.length,
          totalValue: totalValue,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error notifying driver:', error);
      }
    }

    // Get full route details
    const fullRoute = await prisma.route.findUnique({
      where: { id: route.id },
      include: {
        Booking: {
          include: {
            pickupAddress: true,
            dropoffAddress: true,
            BookingItem: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        route: fullRoute,
        analysis: { totalDistance, totalDuration, totalValue },
      },
    });
  } catch (error) {
    console.error('Error creating route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create route' },
      { status: 500 }
    );
  }
}

