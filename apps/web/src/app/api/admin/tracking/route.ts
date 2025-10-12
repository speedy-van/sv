import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const includeTracking = searchParams.get('includeTracking') === 'true';

    // Build where clause
    const where: any = {
      status: { in: ['CONFIRMED', 'COMPLETED'] }, // Only active bookings
    };

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { unifiedBookingId: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    // Get active bookings with tracking data
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        driver: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        pickupAddress: true,
        dropoffAddress: true,
        Assignment: {
          include: {
            JobEvent: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: {
                step: true,
                createdAt: true,
                notes: true,
              },
            },
          },
        },
        ...(includeTracking && {
          TrackingPing: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
              lat: true,
              lng: true,
              createdAt: true,
            },
          },
        }),
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Process bookings to include tracking information
    const trackingBookings = bookings.map(booking => {
      // Calculate route progress
      let routeProgress = 0;
      const jobEvents = booking.Assignment?.JobEvent || [];
      const currentStep = jobEvents[0]?.step;

      const stepProgress: Record<string, number> = {
        navigate_to_pickup: 20,
        arrived_at_pickup: 30,
        loading_started: 40,
        loading_completed: 50,
        en_route_to_dropoff: 70,
        arrived_at_dropoff: 80,
        unloading_started: 90,
        unloading_completed: 95,
        job_completed: 100,
      };

      if (currentStep && stepProgress[currentStep]) {
        routeProgress = stepProgress[currentStep];
      } else {
        switch (booking.status) {
          case 'CONFIRMED':
            routeProgress = 15;
            break;
          case 'CONFIRMED':
            routeProgress = 50;
            break;
          default:
            routeProgress = 0;
        }
      }

      // Get current location
      let currentLocation = null;
      if (
        includeTracking &&
        booking.TrackingPing &&
        booking.TrackingPing.length > 0
      ) {
        const latestPing = booking.TrackingPing[0];
        currentLocation = {
          lat: latestPing.lat,
          lng: latestPing.lng,
          timestamp: latestPing.createdAt,
        };
      }

      // Calculate ETA
      let eta = null;
      if (booking.scheduledAt) {
        const now = new Date();
        const scheduledTime = new Date(booking.scheduledAt);
        const timeDiff = scheduledTime.getTime() - now.getTime();

        if (timeDiff > 0) {
          eta = {
            estimatedArrival: scheduledTime,
            minutesRemaining: Math.round(timeDiff / (1000 * 60)),
            isOnTime: timeDiff > -15 * 60 * 1000,
          };
        } else if (timeDiff > -60 * 60 * 1000) {
          eta = {
            estimatedArrival: new Date(now.getTime() + 30 * 60 * 1000),
            minutesRemaining: 30,
            isOnTime: false,
          };
        }
      }

      return {
        id: booking.id,
        reference: booking.reference,
        unifiedBookingId: booking.reference, // Using reference as unified ID
        status: booking.status,
        scheduledAt: booking.scheduledAt,
        customer: {
          name: booking.customerName,
          email: booking.customerEmail,
          phone: booking.customerPhone,
        },
        driver: booking.driver
          ? {
              id: booking.driver.id,
              name: booking.driver.user.name,
              email: booking.driver.user.email,
            }
          : null,
        addresses: {
          pickup: {
            label: booking.pickupAddress.label,
            postcode: booking.pickupAddress.postcode,
            coordinates: {
              lat: booking.pickupAddress.lat,
              lng: booking.pickupAddress.lng,
            },
          },
          dropoff: {
            label: booking.dropoffAddress.label,
            postcode: booking.dropoffAddress.postcode,
            coordinates: {
              lat: booking.dropoffAddress.lat,
              lng: booking.dropoffAddress.lng,
            },
          },
        },
        routeProgress,
        currentLocation,
        eta,
        lastEvent: jobEvents[0] || null,
        jobTimeline: jobEvents.map(event => ({
          step: event.step,
          label: getStepLabel(event.step),
          timestamp: event.createdAt,
          notes: event.notes,
        })),
        trackingPings: includeTracking ? booking.TrackingPing : [],
        lastUpdated: new Date().toISOString(),
      };
    });

    // Get summary statistics
    const summary = {
      totalBookings: trackingBookings.length,
      confirmedBookings: trackingBookings.filter(b => b.status === 'CONFIRMED')
        .length,
      inProgressBookings: trackingBookings.filter(b => b.status === 'CONFIRMED')
        .length,
      withLiveTracking: trackingBookings.filter(b => b.currentLocation).length,
      averageProgress:
        trackingBookings.length > 0
          ? Math.round(
              trackingBookings.reduce((sum, b) => sum + b.routeProgress, 0) /
                trackingBookings.length
            )
          : 0,
    };

    return NextResponse.json({
      success: true,
      bookings: trackingBookings,
      summary,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Admin tracking API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}

function getStepLabel(step: string): string {
  const stepLabels: Record<string, string> = {
    navigate_to_pickup: 'En Route to Pickup',
    arrived_at_pickup: 'Arrived at Pickup',
    loading_started: 'Loading Started',
    loading_completed: 'Loading Completed',
    en_route_to_dropoff: 'En Route to Delivery',
    arrived_at_dropoff: 'Arrived at Delivery',
    unloading_started: 'Unloading Started',
    unloading_completed: 'Unloading Completed',
    job_completed: 'Job Completed',
    customer_signature: 'Customer Signature',
    damage_notes: 'Damage Notes',
    item_count_verification: 'Item Count Verification',
  };

  return (
    stepLabels[step] ||
    step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  );
}
