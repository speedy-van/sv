/**
 * Admin Routes Management API
 * Full CRUD operations for multi-drop routes
 */

// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { deriveServiceMetadata } from '@/lib/bookings/serviceType';
import { createUniqueReference } from '@/lib/ref';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/routes
 * Get all routes with filters and real-time data
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Admin Routes API] GET request started');
    
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      console.log('❌ [Admin Routes API] Unauthorized access attempt');
      return authResult;
    }
    const adminUser = authResult;
    const userId = adminUser.id;

    console.log('✅ [Admin Routes API] User authenticated');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const driverId = searchParams.get('driverId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    console.log('📊 [Admin Routes API] Filters:', { status, driverId, startDate, endDate, search });

    console.log('📊 [Admin Routes API] Filters:', { status, driverId, startDate, endDate, search });

    // Build filter conditions
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (driverId) {
      where.driverId = driverId;
    }
    
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        try {
          where.startTime.gte = new Date(startDate);
        } catch (e) {
          console.error('Invalid startDate:', startDate);
        }
      }
      if (endDate) {
        try {
          where.startTime.lte = new Date(endDate);
        } catch (e) {
          console.error('Invalid endDate:', endDate);
        }
      }
    }

    console.log('🔎 [Admin Routes API] Querying routes with filters:', JSON.stringify(where));

    // Get routes with all related data
    let routes: any[] = [];
    try {
      routes = await prisma.route.findMany({
        where,
        select: {
          id: true,
          driverId: true,
          vehicleId: true,
          startTime: true,
          endTime: true,
          optimizedDistanceKm: true,
          actualDistanceKm: true,
          totalOutcome: true,
          estimatedDuration: true,
          actualDuration: true,
          status: true,
          completedDrops: true,
          routeNotes: true,
          performanceMultiplier: true,
          bonusesTotal: true,
          penaltiesTotal: true,
          driverPayout: true,
          totalDrops: true,
          serviceTier: true,
          createdAt: true,
          updatedAt: true,
          driver: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          drops: {
            select: {
              id: true,
              status: true,
              pickupAddress: true,
              deliveryAddress: true,
              weight: true,
              volume: true,
              quotedPrice: true,
            }
          },
          Booking: {
            select: {
              id: true,
              reference: true,
              status: true
            }
          }
        },
        orderBy: { startTime: 'desc' },
        take: 100,
      });
      console.log(`✅ [Admin Routes API] Found ${routes.length} multi-drop routes`);
    } catch (routesError) {
      console.error('❌ [Admin Routes API] Error fetching routes:', routesError);
      console.error('Error details:', {
        name: routesError instanceof Error ? routesError.name : 'Unknown',
        message: routesError instanceof Error ? routesError.message : String(routesError),
        stack: routesError instanceof Error ? routesError.stack : undefined,
      });
      // Return empty array on error but continue
      routes = [];
    }

    // ✅ FIX: Get Economy bookings/drops for Multi-Drop Routes section
    let economyDrops: any[] = [];
    try {
      // Get drops from Economy bookings
      economyDrops = await prisma.drop.findMany({
        where: {
          status: {
            in: ['booked', 'pending'],
          },
          routeId: null, // Not yet assigned to a route
          serviceTier: 'economy', // ServiceTier enum only accepts lowercase
        },
        include: {
          User: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { timeWindowStart: 'asc' },
        take: 100,
      });
      console.log(`✅ [Admin Routes API] Found ${economyDrops.length} Economy drops for multi-drop`);
    } catch (dropsError) {
      console.error('❌ [Admin Routes API] Error fetching Economy drops:', dropsError);
      economyDrops = [];
    }

    // Fetch candidate bookings once and partition into economy vs single
    let economyBookings: any[] = [];
    let singleBookings: any[] = [];
    try {
      const bookingWhere: any = {
        status: {
          in: ['CONFIRMED', 'PENDING_PAYMENT', 'DRAFT'], // Include all active statuses
        },
        routeId: null,
      };

      if (startDate || endDate) {
        bookingWhere.scheduledAt = {};
        if (startDate) {
          bookingWhere.scheduledAt.gte = new Date(startDate);
        }
        if (endDate) {
          bookingWhere.scheduledAt.lte = new Date(endDate);
        }
      }

      const bookingCandidatesRaw = await prisma.booking.findMany({
        where: bookingWhere,
        select: {
          id: true,
          reference: true,
          status: true,
          driverId: true,
          scheduledAt: true,
          totalGBP: true,
          customerName: true,
          customerEmail: true,
          BookingAddress_Booking_pickupAddressIdToBookingAddress: {
            select: {
              label: true,
              postcode: true,
            },
          },
          BookingAddress_Booking_dropoffAddressIdToBookingAddress: {
            select: {
              label: true,
              postcode: true,
            },
          },
          Driver: {
            select: {
              id: true,
              User: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
          BookingItem: {
            select: {
              name: true,
              quantity: true,
              volumeM3: true,
            },
          },
          customerPreferences: true,
          orderType: true,
          isMultiDrop: true,
          urgency: true,
          serviceType: true,
          isEconomyService: true,
        },
        orderBy: { scheduledAt: 'asc' },
        take: 250,
      });

      const bookingCandidates = bookingCandidatesRaw.map(candidate => {
        // Relations already use correct names from Prisma
        return {
          ...candidate,
        };
      });

      const enrichedBookings = bookingCandidates.map(candidate => {
        const meta = deriveServiceMetadata(candidate);
        console.log(`📋 [Booking ${candidate.reference}] Classification:`, {
          urgency: candidate.urgency,
          serviceType: (candidate as any).serviceType,
          orderType: candidate.orderType,
          isMultiDrop: candidate.isMultiDrop,
          derivedServiceType: meta.serviceType,
          isEconomy: meta.isEconomy,
        });
        return { candidate, meta };
      });

      economyBookings = enrichedBookings
        .filter(item => item.meta.isEconomy)
        .map(item => ({
          ...item.candidate,
          serviceTypeDerived: item.meta.serviceType,
        }))
        .slice(0, 100);

      singleBookings = enrichedBookings
        .filter(item => !item.meta.isEconomy)
        .sort(
          (a, b) =>
            new Date(b.candidate.scheduledAt).getTime() -
            new Date(a.candidate.scheduledAt).getTime()
        )
        .map(item => ({
          ...item.candidate,
          serviceTypeDerived: item.meta.serviceType,
        }))
        .slice(0, 50);

      console.log(
        `✅ [Admin Routes API] Partitioned ${enrichedBookings.length} bookings into ${economyBookings.length} economy and ${singleBookings.length} single bookings`
      );
    } catch (bookingsError) {
      console.error('❌ [Admin Routes API] Error fetching bookings:', bookingsError);
      economyBookings = [];
      singleBookings = [];
    }

    console.log('📊 [Admin Routes API] Summary:', {
      routes: routes.length,
      economyDrops: economyDrops.length,
      economyBookingsPending: economyBookings.length,
      singleBookings: singleBookings.length,
    });

    // Calculate metrics from routes data
    const totalRoutes = routes.length;
    const avgDistance = routes.length > 0 
      ? routes.reduce((sum, r) => sum + (r.actualDistanceKm || 0), 0) / routes.length
      : 0;
    const avgDuration = routes.length > 0
      ? routes.reduce((sum, r) => sum + (r.actualDuration || 0), 0) / routes.length
      : 0;

    console.log('🔍 [Admin Routes API] Querying drivers...');

    // Get active drivers with their availability
    let driversData: any[] = [];
    try {
      driversData = await prisma.driver.findMany({
        where: {
          status: 'active',
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          DriverAvailability: true,
        },
        take: 50,
      });
      console.log(`✅ [Admin Routes API] Found ${driversData.length} drivers`);
    } catch (driversError) {
      console.error('❌ [Admin Routes API] Error fetching drivers:', driversError);
      console.error('Error details:', {
        name: driversError instanceof Error ? driversError.name : 'Unknown',
        message: driversError instanceof Error ? driversError.message : String(driversError),
      });
      // Return empty array on error
      driversData = [];
    }
    
    const drivers = driversData.map((driver: any) => ({
      id: driver.id,
      name: driver.User?.name || 'Unknown',
      status: driver.DriverAvailability?.status || 'offline',
      currentRoutes: 0,
      DriverAvailability: driver.DriverAvailability ? {
        status: driver.DriverAvailability.status,
        lastLat: driver.DriverAvailability.lastLat,
        lastLng: driver.DriverAvailability.lastLng,
        lastSeenAt: driver.DriverAvailability.lastSeenAt,
      } : null,
      activeRoutes: routes.filter((r: any) => r.driverId === driver.id).length,
    }));

    // Log audit (non-blocking)
    try {
      await logAudit({
        userId,
        action: 'view_routes',
        details: { filters: { status, driverId, startDate, endDate } },
      });
    } catch (auditError) {
      console.error('⚠️ Audit logging failed (non-critical):', auditError);
    }

    console.log('🎉 [Admin Routes API] Returning response successfully');

    // Convert single bookings to route-like format for display
    const singleBookingsAsRoutes = singleBookings.map(booking => ({
      id: `booking-${booking.id}`,
      type: 'single-booking',
      bookingId: booking.id,
      driverId: booking.driverId,
      driverName: booking.driver?.User?.name || 'Unassigned',
      driverEmail: booking.driver?.User?.email || null,
      vehicleId: null,
      status: booking.status,
      totalDrops: 1,
      completedDrops: booking.status === 'COMPLETED' ? 1 : 0,
      startTime: booking.scheduledAt,
      totalOutcome: booking.totalGBP,
      serviceTier: 'luxury',
      drops: [{
        id: `drop-${booking.id}`,
        status: booking.status,
        pickupAddress: booking.BookingAddress_Booking_pickupAddressIdToBookingAddress?.label,
        deliveryAddress: booking.BookingAddress_Booking_dropoffAddressIdToBookingAddress?.label,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        items: booking.BookingItem || [],
      }],
      bookings: [booking],
      progress: booking.status === 'COMPLETED' ? 100 : (booking.status === 'CONFIRMED' ? 50 : 0),
      createdAt: booking.scheduledAt,
      updatedAt: booking.scheduledAt,
      reference: booking.reference,
    }));

    // Convert economy bookings (CONFIRMED status only) to route-like format
    const confirmedEconomyBookingsAsRoutes = economyBookings
      .filter(booking => booking.status === 'CONFIRMED')
      .map(booking => ({
        id: `economy-booking-${booking.id}`,
        type: 'economy-booking',
        bookingId: booking.id,
        driverId: booking.driverId,
        driverName: booking.Driver?.User?.name || 'Unassigned',
        driverEmail: booking.Driver?.User?.email || null,
        vehicleId: null,
        status: booking.status,
        totalDrops: 1,
        completedDrops: 0,
        startTime: booking.scheduledAt,
        totalOutcome: booking.totalGBP,
        serviceTier: 'economy',
        drops: [{
          id: `drop-${booking.id}`,
          status: booking.status,
          pickupAddress: booking.BookingAddress_Booking_pickupAddressIdToBookingAddress?.label,
          deliveryAddress: booking.BookingAddress_Booking_dropoffAddressIdToBookingAddress?.label,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          items: booking.BookingItem || [],
        }],
        bookings: [booking],
        progress: 0,
        createdAt: booking.scheduledAt,
        updatedAt: booking.scheduledAt,
        reference: booking.reference,
        isEconomyService: true,
      }));

    // Combine routes, single bookings, and confirmed economy bookings
    const allRoutes = [
      ...routes.map((route: any) => ({
        id: route.id,
        type: 'multi-drop',
        status: route.status,
        driverId: route.driverId,
        driverName: route.driver?.name || 'Unassigned',
        driverEmail: route.driver?.email,
        totalDrops: route.totalDrops || (route as any).drops?.length || 0,
        completedDrops: route.completedDrops,
        startTime: route.startTime,
        totalOutcome: route.totalOutcome,
        serviceTier: route.serviceTier,
        drops: (route as any).drops || [],
        bookings: route.Booking || [],
        progress: route.totalDrops > 0 ? (route.completedDrops / route.totalDrops * 100) : 0,
        createdAt: route.createdAt,
        updatedAt: route.updatedAt,
      })),
      ...singleBookingsAsRoutes,
      ...confirmedEconomyBookingsAsRoutes
    ].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return NextResponse.json({
      success: true,
      routes: allRoutes,
      // ✅ FIX: Include Economy drops and bookings for Multi-Drop section
      economyDrops: economyDrops.map((drop: any) => ({
        id: drop.id,
        type: 'economy-drop',
        status: drop.status,
        serviceTier: 'ECONOMY',
        pickupAddress: drop.pickupAddress,
        deliveryAddress: drop.deliveryAddress,
        timeWindowStart: drop.timeWindowStart,
        timeWindowEnd: drop.timeWindowEnd,
        quotedPrice: drop.quotedPrice,
        weight: drop.weight,
        volume: drop.volume,
        customer: drop.customer,
      })),
      economyBookingsPending: economyBookings
        .filter((booking: any) => booking.status !== 'CONFIRMED') // Only pending/draft, not confirmed
        .map((booking: any) => ({
          id: booking.id,
          reference: booking.reference,
          type: 'economy-booking',
          status: booking.status,
          serviceType: booking.serviceTypeDerived || 'ECONOMY',
          isEconomyService: true,
          scheduledAt: booking.scheduledAt,
          totalGBP: booking.totalGBP,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          pickupAddress: booking.BookingAddress_Booking_pickupAddressIdToBookingAddress,
          dropoffAddress: booking.BookingAddress_Booking_dropoffAddressIdToBookingAddress,
          items: booking.BookingItem,
          needsDropConversion: true, // Flag for frontend to show conversion button
        })),
      metrics: {
        totalRoutes: routes.length + singleBookings.length,
        totalMultiDropRoutes: routes.length,
        totalSingleBookings: singleBookings.length,
        totalEconomyDrops: economyDrops.length,
        totalEconomyBookingsPending: economyBookings.length,
        avgDistance,
        avgDuration,
      },
      drivers,
    });

  } catch (error) {
    console.error('❌ Routes GET error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch routes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/routes
 * Create new route (manual or automatic)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const adminUser = authResult;

    const body = await request.json();
    const { 
      driverId, 
      vehicleId, 
      dropIds, 
      bookingIds, // Support both dropIds and bookingIds
      startTime, 
      serviceTier,
      isAutomatic = false 
    } = body;

    // Use bookingIds if provided, otherwise use dropIds
    const idsToUse = bookingIds || dropIds;

    if (!idsToUse || idsToUse.length === 0) {
      return NextResponse.json(
        { error: 'No bookings or drops provided' },
        { status: 400 }
      );
    }

    // Validate bookings exist and are available
    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: idsToUse },
        status: 'CONFIRMED',
        routeId: null, // Not already in a route
      },
      select: {
        id: true,
        totalGBP: true,
        baseDistanceMiles: true,
      }
    });

    if (bookings.length === 0) {
      return NextResponse.json(
        { error: 'No available bookings found' },
        { status: 400 }
      );
    }

    if (bookings.length !== idsToUse.length) {
      return NextResponse.json(
        { 
          error: `Only ${bookings.length} of ${idsToUse.length} bookings are available`,
          availableCount: bookings.length 
        },
        { status: 400 }
      );
    }

    // Calculate route metrics from bookings (with validation)
    const totalOutcome = bookings.reduce((sum, b) => {
      const value = Number(b.totalGBP || 0);
      return (Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER) ? sum + value : sum;
    }, 0);

    // Calculate total distance from bookings (baseDistanceMiles)
    const totalDistanceMiles = bookings.reduce((sum, b) => sum + (Number(b.baseDistanceMiles) || 0), 0);
    const totalDistanceKm = totalDistanceMiles * 1.60934; // Convert miles to km

    // Generate unique route number (e.g., SV-000001)
    const routeNumber = await createUniqueReference('route');
    console.log('✅ Generated route number:', routeNumber);
    console.log('✅ Calculated total distance:', { 
      miles: totalDistanceMiles.toFixed(2), 
      km: totalDistanceKm.toFixed(2) 
    });

    // Create route with auto-generated route number
    const route = await prisma.route.create({
      data: {
        reference: routeNumber, // Use unified SV reference number
        driverId: driverId || null,
        vehicleId: vehicleId || null,
        status: driverId ? 'assigned' : 'pending_assignment',
        startTime: startTime ? new Date(startTime) : new Date(),
        serviceTier: serviceTier || 'standard',
        totalDrops: bookings.length,
        completedDrops: 0,
        totalOutcome,
        optimizedDistanceKm: totalDistanceKm, // Add calculated distance
        routeNotes: isAutomatic ? 'System-generated route' : 'Manually created route',
        updatedAt: new Date()
      },
      include: {
        driver: true,
        Booking: {
          select: {
            id: true,
            reference: true,
            customerName: true,
            totalGBP: true,
          }
        },
      }
    });

    // Update bookings to link to route
    await prisma.booking.updateMany({
      where: { id: { in: idsToUse } },
      data: {
        routeId: route.id,
        status: 'CONFIRMED', // Keep as confirmed but now assigned to route
      }
    });

    await logAudit(adminUser.id, 'create_route', undefined, {
      targetType: 'route',
      targetId: route.id,
      after: { routeId: route.id, bookingCount: bookings.length, isAutomatic },
    });

    return NextResponse.json({
      success: true,
      route,
      message: `Route created successfully with ${bookings.length} booking(s)`,
    });

  } catch (error) {
    console.error('❌ Route creation error:', error);
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
