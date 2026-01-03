/**
 * POST /api/admin/routes/create
 * 
 * Create a new route manually from selected bookings
 */

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createUniqueReference } from '@/lib/ref';

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

const createRouteSchema = z.object({
  bookingIds: z.array(z.string().min(1)).min(1),
  driverId: z.string().min(1).optional(),
  startTime: z.string().datetime().optional(),
  isAutomatic: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('📦 [Create Route] Starting route creation...');
    const json = await request.json();
    const parsed = createRouteSchema.safeParse(json);

    if (!parsed.success) {
      console.error('❌ [Create Route] Validation failed:', parsed.error.flatten());
      return NextResponse.json(
        { success: false, error: 'Invalid payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { bookingIds, driverId, startTime, isAutomatic } = parsed.data;
    console.log('📦 [Create Route] Received:', { bookingIds, driverId });

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
        customer: { select: { id: true } },
      },
    });

    if (bookings.length !== bookingIds.length) {
      return NextResponse.json(
        { success: false, error: 'Some bookings are not available or already assigned' },
        { status: 400 }
      );
    }

    console.log(`📦 [Create Route] Found ${bookings.length} bookings to assign to route`);

    // Ensure each booking has required relational data
    const invalidBookings: string[] = [];
    const sanitizedBookings = bookings.filter((booking) => {
      if (!booking.customer?.id) {
        console.warn(`⚠️ [Create Route] Booking ${booking.id} missing customerId`);
        invalidBookings.push(`${booking.reference || booking.id}: missing customer`);
        return false;
      }
      if (!booking.pickupAddress || !booking.dropoffAddress) {
        console.warn(`⚠️ [Create Route] Booking ${booking.id} missing pickup/dropoff address`);
        invalidBookings.push(`${booking.reference || booking.id}: missing address`);
        return false;
      }
      if (!booking.scheduledAt) {
        console.warn(`⚠️ [Create Route] Booking ${booking.id} missing scheduledAt`);
        invalidBookings.push(`${booking.reference || booking.id}: missing scheduled time`);
        return false;
      }
      return true;
    });

    if (sanitizedBookings.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid bookings available to create route',
          details: invalidBookings,
        },
        { status: 400 }
      );
    }

    // Calculate simple route metrics from bookings (no complex pricing needed)
    const totalValue = sanitizedBookings.reduce((sum, b) => {
      const value = Number(b.totalGBP || 0);
      return (Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER) ? sum + value : sum;
    }, 0);
    
    // Estimate distance based on bookings (8-10 miles per drop average)
    const estimatedDistancePerDrop = 8.5; // miles
    const totalDistance = sanitizedBookings.length * estimatedDistancePerDrop;
    
    // Estimate duration (30-45 mins per drop)
    const estimatedDurationPerDrop = 35; // minutes
    const totalDuration = sanitizedBookings.length * estimatedDurationPerDrop;
    
    console.log(`📊 [Create Route] Route metrics:`, { 
      totalValue, 
      totalDistance: `${totalDistance} miles`, 
      totalDuration: `${totalDuration} mins`,
      bookingsCount: sanitizedBookings.length 
    });

    // Validate driver exists if driverId provided
    let validatedDriverId = null;
    if (driverId) {
      console.log(`👤 [Create Route] Validating driver ${driverId}...`);
      console.log(`👤 [Create Route] Driver ID type:`, typeof driverId);
      console.log(`👤 [Create Route] Driver ID length:`, driverId.length);

      const driverExists = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { id: true, userId: true }
      });

      if (!driverExists) {
        console.error(`❌ [Create Route] Driver ${driverId} not found in database`);

        // Try to find all drivers for debugging
        const allDrivers = await prisma.driver.findMany({
          select: { id: true, userId: true },
          take: 5
        });
        console.error(`❌ [Create Route] Available drivers:`, allDrivers.map(d => ({ id: d.id.substring(0, 8) + '...', userId: d.userId.substring(0, 8) + '...' })));

        return NextResponse.json(
          { success: false, error: `Driver ${driverId} not found. Please select a valid driver.` },
          { status: 400 }
        );
      }

      console.log(`✅ [Create Route] Driver ${driverId} validated successfully`);
      console.log(`🔑 [Create Route] Driver.userId:`, driverExists.userId);
      // Use userId for Route.driverId foreign key (references User.id)
      validatedDriverId = driverExists.userId;
      console.log(`🔑 [Create Route] Assigned validatedDriverId:`, validatedDriverId);
    }

    // Create route
    console.log(`📦 [Create Route] Creating route in database...`);
    console.log(`📦 [Create Route] Driver assignment:`, validatedDriverId ? `User ID ${validatedDriverId}` : 'Unassigned (pending)');

    // Generate unified SV reference number
    const routeReference = await createUniqueReference('route');
    console.log(`📦 [Create Route] Generated reference: ${routeReference}`);

    const route = await prisma.$transaction(async (tx) => {
      const newRoute = await tx.route.create({
        data: {
          reference: routeReference,
          status: validatedDriverId ? 'assigned' : 'pending_assignment',
          driverId: validatedDriverId,
          totalDrops: sanitizedBookings.length,
          completedDrops: 0,
          startTime: startTime ? new Date(startTime) : new Date(),
          optimizedDistanceKm: totalDistance * 1.609, // Convert miles to km
          estimatedDuration: Math.round(totalDuration),
          totalOutcome: totalValue,
          adminNotes: `Auto-generated route from Smart Route Generator${isAutomatic ? ' [automatic]' : ''} with ${sanitizedBookings.length} bookings`,
        },
      });

      console.log(`✅ [Create Route] Route created: ${newRoute.id}`);

      // Update all bookings at once
      const bookingUpdatePromises = sanitizedBookings.map((booking, i) =>
        tx.booking.update({
          where: { id: booking.id },
          data: {
            routeId: newRoute.id,
            deliverySequence: i + 1,
            orderType: sanitizedBookings.length > 1 ? 'multi-drop' : 'single',
            status: 'CONFIRMED',
          },
        })
      );
      await Promise.all(bookingUpdatePromises);
      console.log(`✅ [Create Route] Updated ${sanitizedBookings.length} bookings`);

      // Create all drops at once
      const baseTimestamp = Date.now();
      const dropsData = sanitizedBookings.map((booking, index) => {
        const scheduledAt = booking.scheduledAt ?? new Date();
        return {
          id: `drop_${newRoute.id}_${index}_${baseTimestamp}_${Math.random().toString(36).substr(2, 9)}`,
          routeId: newRoute.id,
          bookingId: booking.id,
          customerId: booking.customer!.id,
          pickupAddress: booking.pickupAddress
            ? `${booking.pickupAddress.label}${booking.pickupAddress.postcode ? `, ${booking.pickupAddress.postcode}` : ''}`
            : 'Unknown pickup',
          deliveryAddress: booking.dropoffAddress
            ? `${booking.dropoffAddress.label}${booking.dropoffAddress.postcode ? `, ${booking.dropoffAddress.postcode}` : ''}`
            : 'Unknown dropoff',
          timeWindowStart: scheduledAt,
          timeWindowEnd: new Date(scheduledAt.getTime() + 4 * 60 * 60 * 1000),
          quotedPrice: Number(booking.totalGBP || 0),
          status: 'booked' as const,
        };
      });

      console.log(`📝 [Create Route] Preparing to create ${dropsData.length} drops for route ${newRoute.id}`);
      
      await tx.drop.createMany({ data: dropsData });
      
      console.log(`✅ [Create Route] Created ${dropsData.length} drop records`);

      return newRoute;
    });
    
    console.log(`✅ [Create Route] All ${sanitizedBookings.length} bookings updated and Drop records created`);

    // Smart notification system for admin
    const shouldNotifyAdmin = 
      totalDistance > 50 || // Long distance (>50 miles)
      totalDuration > 300 || // Long duration (>5 hours)
      sanitizedBookings.length > 10; // Many drops

    if (shouldNotifyAdmin) {
      try {
        const { getPusherServer } = await import('@/lib/pusher');
        const pusher = getPusherServer();

        await pusher.trigger('admin-notifications', 'route-alert', {
          type: 'route_created_alert',
          routeId: route.id,
          routeReference: route.reference,
          severity: totalDistance > 100 || totalDuration > 480 ? 'high' : 'medium',
          metrics: {
            totalDistance: `${totalDistance} miles`,
            totalDuration: `${Math.round(totalDuration / 60)} hours`,
            dropsCount: sanitizedBookings.length,
            estimatedValue: `£${(totalValue / 100).toFixed(2)}`,
          },
          alerts: [
            ...(totalDistance > 50 ? [`Long distance route: ${totalDistance} miles`] : []),
            ...(totalDuration > 300 ? [`Long duration: ${Math.round(totalDuration / 60)} hours`] : []),
            ...(sanitizedBookings.length > 10 ? [`High drop count: ${sanitizedBookings.length} stops`] : []),
          ],
          timestamp: new Date().toISOString(),
        });

        console.log(`⚠️ [Create Route] Admin notified about route metrics:`, {
          distance: `${totalDistance} miles`,
          duration: `${Math.round(totalDuration / 60)} hours`,
          drops: sanitizedBookings.length,
        });
      } catch (error) {
        console.error('❌ [Create Route] Error notifying admin:', error);
      }
    }

    // If driver assigned, notify them
    if (validatedDriverId) {
      try {
        const { getPusherServer } = await import('@/lib/pusher');
        const pusher = getPusherServer();

        await pusher.trigger(`driver-${validatedDriverId}`, 'route-assigned', {
          routeId: route.id,
          routeReference: route.reference,
          stops: bookings.length,
          totalDistance: `${totalDistance} miles`,
          estimatedDuration: `${Math.round(totalDuration / 60)} hours`,
          totalValue: totalValue,
          timestamp: new Date().toISOString(),
        });

        console.log(`✅ [Create Route] Driver ${validatedDriverId} notified`);
      } catch (error) {
        console.error('❌ [Create Route] Error notifying driver:', error);
      }
    }

    // Get full route details with drops
    const fullRoute = await prisma.route.findUnique({
      where: { id: route.id },
      include: {
        drops: {
          include: {
            Booking: {
              select: {
                id: true,
                reference: true,
                customerName: true,
              },
            },
          },
        },
        Booking: {
          include: {
            pickupAddress: true,
            dropoffAddress: true,
            BookingItem: true,
            customer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    console.log(`📊 [Create Route] Final route status:`, {
      routeId: route.id,
      reference: fullRoute?.reference,
      totalBookings: fullRoute?.Booking?.length || 0,
      totalDrops: fullRoute?.drops?.length || 0,
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

