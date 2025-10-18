import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getActiveAssignment } from '@/lib/utils/assignment-helpers';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const user = await requireRole(request, 'admin');

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since'); // ISO date string for filtering

    // Get booking with tracking data
    const booking = await prisma.booking.findUnique({
      where: { reference: params.code },
      include: {
        driver: {
          include: {
            User: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        pickupAddress: true,
        dropoffAddress: true,
        TrackingPing: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            lat: true,
            lng: true,
            createdAt: true,
          },
        },
        Assignment: {
          include: {
            JobEvent: {
              orderBy: { createdAt: 'desc' },
              select: {
                step: true,
                createdAt: true,
                notes: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Filter tracking pings if since parameter is provided
    let trackingPings = booking.TrackingPing;
    if (since) {
      const sinceDate = new Date(since);
      trackingPings = trackingPings.filter(ping => ping.createdAt >= sinceDate);
    }

    // Calculate route progress and ETA
    let routeProgress = 0;
    let eta = null;
    let currentLocation = null;
    
    // Get active assignment and last event (needed for multiple places)
    const activeAssignment = getActiveAssignment(booking.Assignment);
    const lastEvent = activeAssignment?.JobEvent?.[0];

    if (trackingPings.length > 0) {
      const latestPing = trackingPings[0];
      currentLocation = {
        lat: latestPing.lat,
        lng: latestPing.lng,
        timestamp: latestPing.createdAt,
      };

      // Calculate route progress based on booking status and job events
      if (lastEvent) {
        switch (lastEvent.step) {
          case 'navigate_to_pickup':
            routeProgress = 20;
            break;
          case 'arrived_at_pickup':
            routeProgress = 40;
            break;
          case 'loading_started':
            routeProgress = 50;
            break;
          case 'loading_completed':
            routeProgress = 60;
            break;
          case 'en_route_to_dropoff':
            routeProgress = 80;
            break;
          case 'arrived_at_dropoff':
            routeProgress = 90;
            break;
          case 'unloading_started':
            routeProgress = 95;
            break;
          case 'unloading_completed':
          case 'job_completed':
            routeProgress = 100;
            break;
          default:
            routeProgress = 0;
        }
      }

      // Simple ETA calculation (in production, use proper routing service)
      if (booking.scheduledAt) {
        const now = new Date();
        const scheduledTime = new Date(booking.scheduledAt);
        const timeDiff = scheduledTime.getTime() - now.getTime();

        if (timeDiff > 0) {
          eta = {
            estimatedArrival: scheduledTime,
            minutesRemaining: Math.round(timeDiff / (1000 * 60)),
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        pickupAddress: booking.pickupAddress,
        dropoffAddress: booking.dropoffAddress,
        scheduledAt: booking.scheduledAt,
        driver: booking.driver
          ? {
              id: booking.driver.id,
              name: booking.driver.User.name,
              email: booking.driver.User.email,
            }
          : null,
        customer: booking.customer ? {
          id: booking.customer.id,
          name: booking.customer.name,
          email: booking.customer.email,
        } : null,
        routeProgress,
        currentLocation,
        eta,
        lastEvent: lastEvent || null,
        trackingPings: trackingPings.map(ping => ({
          id: ping.id,
          lat: ping.lat,
          lng: ping.lng,
          createdAt: ping.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
