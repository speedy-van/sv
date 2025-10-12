/**
 * GET /api/admin/routes/active
 * 
 * Get all active routes (assigned or in progress)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'assigned', 'in_progress', 'all'
    const driverId = searchParams.get('driverId');

    // Build where clause
    const where: any = {
      status: { in: ['assigned', 'in_progress'] },
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (driverId) {
      where.driverId = driverId;
    }

    // Get active routes
    const routes = await prisma.route.findMany({
      where,
      include: {
        Booking: {
          include: {
            pickupAddress: true,
            dropoffAddress: true,
            BookingItem: true,
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: {
            deliverySequence: 'asc',
          },
        },
        Driver: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
            DriverAvailability: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Enrich with real-time tracking data
    const enrichedRoutes = routes.map(route => {
      const completedStops = route.Booking.filter(b => 
        b.actualDeliveryTime !== null
      ).length;
      
      const currentStop = route.Booking.find(b => 
        b.actualPickupTime !== null && b.actualDeliveryTime === null
      );

      const nextStop = route.Booking.find(b => 
        b.actualPickupTime === null
      );

      return {
        ...route,
        progress: {
          completedStops,
          totalStops: route.Booking.length,
          percentage: (completedStops / route.Booking.length) * 100,
          currentStop: currentStop ? {
            bookingId: currentStop.id,
            reference: currentStop.reference,
            pickupAddress: currentStop.pickupAddress,
            dropoffAddress: currentStop.dropoffAddress,
            status: 'in_transit',
          } : null,
          nextStop: nextStop ? {
            bookingId: nextStop.id,
            reference: nextStop.reference,
            pickupAddress: nextStop.pickupAddress,
            estimatedPickupTime: nextStop.estimatedPickupTime,
          } : null,
        },
        driver: route.Driver ? {
          id: route.Driver.id,
          name: route.Driver.User.name,
          email: route.Driver.User.email,
          phone: route.Driver.User.phone,
          status: route.Driver.DriverAvailability?.status || 'unknown',
          // TODO: Add real-time location from tracking service
        } : null,
      };
    });

    // Calculate statistics
    const stats = {
      total: enrichedRoutes.length,
      assigned: enrichedRoutes.filter(r => r.status === 'assigned').length,
      inProgress: enrichedRoutes.filter(r => r.status === 'in_progress').length,
      totalStops: enrichedRoutes.reduce((sum, r) => sum + r.Booking.length, 0),
      completedStops: enrichedRoutes.reduce((sum, r) => sum + r.progress.completedStops, 0),
      totalDistance: enrichedRoutes.reduce((sum, r) => sum + r.totalDistanceMiles, 0),
      totalRevenue: enrichedRoutes.reduce((sum, r) => sum + r.totalOutcome, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        routes: enrichedRoutes,
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching active routes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch active routes' },
      { status: 500 }
    );
  }
}

