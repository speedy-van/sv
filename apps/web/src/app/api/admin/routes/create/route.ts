/**
 * POST /api/admin/routes/create
 * 
 * Create a new route manually from selected bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    console.log('📦 [Create Route] Starting route creation...');
    const body = await request.json();
    const { bookingIds, driverId } = body;
    console.log('📦 [Create Route] Received:', { bookingIds, driverId });

    if (!bookingIds || !Array.isArray(bookingIds) || bookingIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'bookingIds array is required' },
        { status: 400 }
      );
    }

    // Get bookings - accept CONFIRMED, DRAFT, and PENDING_PAYMENT
    console.log('📦 [Create Route] Fetching bookings...');
    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
        status: { in: ['CONFIRMED', 'DRAFT', 'PENDING_PAYMENT'] },
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

    console.log(`📦 [Create Route] Found ${bookings.length} bookings to assign to route`);

    // Calculate simple route metrics from bookings (no complex pricing needed)
    const totalValue = bookings.reduce((sum, b) => {
      const value = Number(b.totalGBP || 0);
      return (Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER) ? sum + value : sum;
    }, 0);
    
    // Estimate distance based on bookings (8-10 miles per drop average)
    const estimatedDistancePerDrop = 8.5; // miles
    const totalDistance = bookings.length * estimatedDistancePerDrop;
    
    // Estimate duration (30-45 mins per drop)
    const estimatedDurationPerDrop = 35; // minutes
    const totalDuration = bookings.length * estimatedDurationPerDrop;
    
    console.log(`📊 [Create Route] Route metrics:`, { 
      totalValue, 
      totalDistance: `${totalDistance} miles`, 
      totalDuration: `${totalDuration} mins`,
      bookingsCount: bookings.length 
    });

    // Create route
    console.log(`📦 [Create Route] Creating route in database...`);
    console.log(`📦 [Create Route] Driver assignment:`, driverId ? `Driver ${driverId}` : 'Unassigned (pending)');
    
    const route = await prisma.route.create({
      data: {
        id: `RT${Date.now().toString(36).toUpperCase().slice(-8)}`,
        status: driverId ? 'assigned' : 'pending_assignment',
        driverId: driverId || null, // Only assign if valid driverId provided
        totalDrops: bookings.length,
        completedDrops: 0,
        startTime: new Date(),
        optimizedDistanceKm: totalDistance * 1.609, // Convert miles to km
        estimatedDuration: Math.round(totalDuration),
        totalOutcome: totalValue,
        adminNotes: `Auto-generated route from Smart Route Generator with ${bookings.length} bookings`,
      },
    });
    
    console.log(`✅ [Create Route] Route created: ${route.id}`);

    // Update bookings - assign to route and update status
    console.log(`📦 [Create Route] Assigning ${bookings.length} bookings to route...`);
    
    for (let i = 0; i < bookings.length; i++) {
      const oldStatus = bookings[i].status;
      const booking = bookings[i];
      
      // Update booking
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          routeId: route.id,
          deliverySequence: i + 1,
          orderType: bookings.length > 1 ? 'multi-drop' : 'single',
          status: 'CONFIRMED', // Change PENDING_PAYMENT → CONFIRMED
        },
      });
      
      // Create Drop record for this booking
      await prisma.drop.create({
        data: {
          routeId: route.id,
          bookingId: booking.id,
          customerId: booking.customerId!,
          pickupAddress: `${booking.pickupAddress.label}, ${booking.pickupAddress.postcode}`,
          deliveryAddress: `${booking.dropoffAddress.label}, ${booking.dropoffAddress.postcode}`,
          timeWindowStart: booking.scheduledAt,
          timeWindowEnd: new Date(booking.scheduledAt.getTime() + 4 * 60 * 60 * 1000), // 4 hours window
          quotedPrice: Number(booking.totalGBP || 0),
          status: 'booked',
        },
      });
      
      console.log(`  ✅ ${booking.reference}: ${oldStatus} → CONFIRMED + Drop created`);
    }
    
    console.log(`✅ [Create Route] All ${bookings.length} bookings updated and Drop records created`);

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
    console.error('❌ [Create Route] Error:', error);
    console.error('❌ [Create Route] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create route',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

