/**
 * POST /api/admin/routes/create
 * 
 * Create a new route manually from selected bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { intelligentRouteOptimizer } from '@/lib/services/intelligent-route-optimizer';

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

    // Analyze the route
    const routeAnalysis = await intelligentRouteOptimizer.analyzeRoute({
      bookings: bookings.map(b => ({
        bookingId: b.id,
        pickupLat: b.pickupAddress.lat || 0,
        pickupLng: b.pickupAddress.lng || 0,
        dropoffLat: b.dropoffAddress.lat || 0,
        dropoffLng: b.dropoffAddress.lng || 0,
        scheduledAt: b.scheduledAt,
        loadPercentage: b.estimatedLoadPercentage || 0,
        priority: b.priority || 5,
        value: b.totalGBP / 100,
      })),
    });

    // Create route
    const route = await prisma.route.create({
      data: {
        id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: driverId ? 'assigned' : 'planned',
        driverId: driverId || 'unassigned',
        totalDistanceMiles: routeAnalysis.totalDistance,
        totalDurationMinutes: routeAnalysis.totalDuration,
        totalOutcome: routeAnalysis.totalValue,
        optimizationScore: routeAnalysis.optimizationScore,
        createdAt: new Date(),
        updatedAt: new Date(),
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
    if (driverId && driverId !== 'unassigned') {
      try {
        const { getPusherServer } = await import('@/lib/pusher');
        const pusher = getPusherServer();
        
        await pusher.trigger(`driver-${driverId}`, 'route-assigned', {
          routeId: route.id,
          stops: bookings.length,
          totalValue: routeAnalysis.totalValue,
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
        analysis: routeAnalysis,
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

