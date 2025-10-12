import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { assertDriver } from '@/lib/guards';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await auth();
  try {
    assertDriver(session!);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return new Response(msg, { status });
  }

  const userId = session.user.id;

  try {
    const { bookingId, latitude, longitude, accuracy } = await request.json();

    // Validate location data
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid location coordinates' },
        { status: 400 }
      );
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: 'Location coordinates out of valid range' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: {
        availability: true,
        Assignment: {
          where: {
            bookingId: bookingId,
            status: { in: ['claimed', 'accepted'] },
          },
          include: {
            Booking: true,
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Check if driver has an active assignment for this booking
    if (!driver.Assignment || driver.Assignment.length === 0) {
      return NextResponse.json(
        { error: 'No active assignment for this booking' },
        { status: 403 }
      );
    }

    // Check or create driver availability
    let driverAvailability = driver.availability;
    
    if (!driverAvailability) {
      // Create availability record if it doesn't exist
      driverAvailability = await prisma.driverAvailability.create({
        data: {
          driverId: driver.id,
          status: 'online',
          locationConsent: true, // Default to true for job tracking
          lastSeenAt: new Date(),
        },
      });
    }

    // Update availability to online if driver is tracking a job
    if (driverAvailability.status !== 'online' || !driverAvailability.locationConsent) {
      driverAvailability = await prisma.driverAvailability.update({
        where: { driverId: driver.id },
        data: {
          status: 'online',
          locationConsent: true, // Enable consent when tracking jobs
          lastSeenAt: new Date(),
        },
      });
    }

    // Create tracking ping
    const trackingPing = await prisma.trackingPing.create({
      data: {
        id: `ping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        bookingId: bookingId,
        driverId: driver.id,
        lat: latitude,
        lng: longitude,
      },
    });

    // Update driver availability with new location
    await prisma.driverAvailability.update({
      where: { driverId: driver.id },
      data: {
        lastLat: latitude,
        lastLng: longitude,
        lastSeenAt: new Date(),
      },
    });

    // Get booking reference for real-time notifications
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { reference: true, customerName: true }
    });

    // Send real-time location updates to match admin and customer tracking
    try {
      const { getPusherServer } = await import('@/lib/pusher');
      const pusher = getPusherServer();

      // Notify customer tracking
      await pusher.trigger(`tracking-${booking?.reference}`, 'location-update', {
        driverId: driver.id,
        lat: latitude,
        lng: longitude,
        timestamp: new Date().toISOString(),
        accuracy: accuracy || null,
        bookingId: bookingId,
      });

      // Notify admin tracking dashboard
      await pusher.trigger('admin-tracking', 'location-update', {
        driverId: driver.id,
        bookingId: bookingId,
        bookingReference: booking?.reference,
        lat: latitude,
        lng: longitude,
        timestamp: new Date().toISOString(),
        customerName: booking?.customerName,
      });

      console.log('✅ Real-time location updates sent for tracking synchronization');
    } catch (notificationError) {
      console.error('❌ Error sending real-time location updates:', notificationError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      trackingPingId: trackingPing.id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Tracking update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  try {
    assertDriver(session!);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return new Response(msg, { status });
  }

  const userId = session.user.id;

  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const since = searchParams.get('since'); // ISO date string

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID required' },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    // Get tracking pings for this booking
    const whereClause: any = {
      bookingId: bookingId,
      driverId: driver.id,
    };

    if (since) {
      whereClause.createdAt = {
        gte: new Date(since),
      };
    }

    const trackingPings = await prisma.trackingPing.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to last 100 pings
    });

    return NextResponse.json({
      success: true,
      trackingPings: trackingPings.map(ping => ({
        id: ping.id,
        lat: ping.lat,
        lng: ping.lng,
        createdAt: ping.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching tracking data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

