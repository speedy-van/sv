/**
 * Admin Routes Management API
 * Full CRUD operations for multi-drop routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { createUniqueReference } from '@/lib/ref';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/routes
 * Get all routes with filters and real-time data
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Admin Routes API] GET request started');
    
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      console.log('❌ [Admin Routes API] Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [Admin Routes API] User authenticated:', session.user.email);

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
          driver: { select: { id: true, name: true, email: true } },
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

    // Also get single bookings (not yet converted to routes)
    let singleBookings: any[] = [];
    try {
      const bookingWhere: any = {
        status: 'CONFIRMED',
        // Only include bookings that are not part of any route
        route: null,
      };

      // Apply same filters as routes if applicable
      if (startDate || endDate) {
        bookingWhere.scheduledAt = {};
        if (startDate) {
          bookingWhere.scheduledAt.gte = new Date(startDate);
        }
        if (endDate) {
          bookingWhere.scheduledAt.lte = new Date(endDate);
        }
      }

      singleBookings = await prisma.booking.findMany({
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
          pickupAddress: {
            select: {
              label: true,
              postcode: true,
            }
          },
          dropoffAddress: {
            select: {
              label: true,
              postcode: true,
            }
          },
          driver: {
            select: {
              id: true,
              User: {
                select: {
                  name: true,
                  email: true,
                }
              }
            }
          },
          BookingItem: {
            select: {
              name: true,
              quantity: true,
              volumeM3: true,
            }
          }
        },
        orderBy: { scheduledAt: 'desc' },
        take: 50,
      });
      console.log(`✅ [Admin Routes API] Found ${singleBookings.length} single bookings`);
    } catch (bookingsError) {
      console.error('❌ [Admin Routes API] Error fetching single bookings:', bookingsError);
      singleBookings = [];
    }

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
      id: driver.userId,
      name: driver.User?.name || 'Unknown',
      status: driver.DriverAvailability?.status || 'offline',
      currentRoutes: 0,
    }));

    // Log audit (non-blocking)
    try {
      await logAudit({
        userId: (session.user as any).id,
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
        pickupAddress: booking.pickupAddress?.label,
        deliveryAddress: booking.dropoffAddress?.label,
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

    // Combine routes and single bookings
    const allRoutes = [
      ...routes.map((route: any) => ({
        id: route.id,
        type: 'multi-drop',
        status: route.status,
        driverId: route.driverId,
        driverName: route.driver?.name || 'Unassigned',
        driverEmail: route.driver?.email,
        totalDrops: route.totalDrops || (route as any).drops?.length || 0,
        completedDrops: route.completedDrops || 0,
        startTime: route.startTime,
        totalOutcome: Number(route.totalOutcome) || 0,
        serviceTier: route.serviceTier,
        drops: (route as any).drops || [],
        bookings: route.Booking || [],
        progress: route.totalDrops > 0 ? ((route.completedDrops || 0) / route.totalDrops * 100) : 0,
        createdAt: route.createdAt,
        updatedAt: route.updatedAt,
      })),
      ...singleBookingsAsRoutes
    ].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    return NextResponse.json({
      success: true,
      routes: allRoutes,
      metrics: {
        totalRoutes: routes.length + singleBookings.length,
        totalMultiDropRoutes: routes.length,
        totalSingleBookings: singleBookings.length,
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
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        route: null, // Not already in a route
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

    // Calculate route metrics from bookings
    const totalOutcome = bookings.reduce((sum: number, b: any) => sum + Number(b.totalGBP), 0);

    // Calculate total distance from bookings (baseDistanceMiles)
    const totalDistanceMiles = bookings.reduce((sum: number, b: any) => sum + (Number(b.baseDistanceMiles) || 0), 0);
    const totalDistanceKm = totalDistanceMiles * 1.60934; // Convert miles to km

    // Generate unique route number (e.g., RT1A2B3C4D)
    const routeNumber = await createUniqueReference('route');
    console.log('✅ Generated route number:', routeNumber);
    console.log('✅ Calculated total distance:', { 
      miles: totalDistanceMiles.toFixed(2), 
      km: totalDistanceKm.toFixed(2) 
    });

    // Get driver userId if driverId is provided
    let driverUserId: string | null = null;
    if (driverId) {
      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { userId: true }
      });
      if (driver) {
        driverUserId = driver.userId;
      } else {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 404 }
        );
      }
    }

    // Create route with auto-generated route number
    const route = await prisma.route.create({
      data: {
        id: routeNumber, // Use route number as ID for easy reference
        driverId: driverUserId, // ✅ Route.driverId references User.id
        vehicleId: vehicleId || null,
        status: driverUserId ? 'assigned' : 'pending_assignment',
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

    // Send notification to driver if assigned
    if (driverId) {
      try {
        console.log(`📲 Sending route assignment notification to driver ${driverId}...`);
        
        // Get driver details for notification
        const driver = await prisma.driver.findUnique({
          where: { id: driverId },
          include: {
            User: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        });

        if (driver) {
          // Calculate driver earnings for the route
          let totalEarnings = 0;
          try {
            const { calculateRouteEarnings } = require('@/lib/services/driver-earnings-service');
            const earningsResult = await calculateRouteEarnings(route.id);
            totalEarnings = earningsResult.totalEarnings;
            console.log(`💰 Route earnings calculated: £${(totalEarnings / 100).toFixed(2)}`);
          } catch (earningsError) {
            console.error('⚠️ Failed to calculate route earnings:', earningsError);
            // Continue without earnings data
          }

          // Send push notification via Pusher
          const { getPusherServer } = require('@/lib/pusher');
          const pusher = getPusherServer();
          if (pusher && pusher.trigger) {
            // Send route-matched event (critical for iOS app)
            await pusher.trigger(`driver-${driverId}`, 'route-matched', {
              type: bookings.length > 1 ? 'multi-drop' : 'single-order',
              routeId: route.id,
              routeNumber: routeNumber,
              bookingReference: routeNumber,
              orderNumber: routeNumber,
              bookingsCount: bookings.length,
              jobCount: bookings.length,
              dropCount: bookings.length,
              dropsCount: bookings.length,
              totalDistance: totalDistanceKm,
              estimatedDuration: null,
              totalEarnings: totalEarnings, // ✅ Actual calculated earnings
              formattedEarnings: `£${(totalEarnings / 100).toFixed(2)}`,
              assignedAt: new Date().toISOString(),
              message: `New ${bookings.length > 1 ? 'route' : 'order'} ${routeNumber} assigned to you${totalEarnings > 0 ? ` - Earn £${(totalEarnings / 100).toFixed(2)}` : ''}`,
              drops: [], // Will be populated from bookings
            });
            
            // Also send route-assigned for backward compatibility
            await pusher.trigger(`driver-${driverId}`, 'route-assigned', {
              routeId: route.id,
              routeNumber: routeNumber,
              totalDrops: bookings.length,
              totalValue: totalOutcome,
              message: `New route ${routeNumber} assigned to you with ${bookings.length} drop(s)`,
              timestamp: new Date().toISOString(),
            });
            
            console.log('✅ Pusher notifications sent (route-matched + route-assigned)');
          }

          // Send SMS notification if phone number available
          const userWithPhone = await prisma.user.findUnique({
            where: { id: driver.userId },
            select: { phone: true }
          });

          if (userWithPhone?.phone) {
            const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/notifications/sms/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: userWithPhone.phone,
                message: `New Route Assigned! Route ${routeNumber} with ${bookings.length} drop(s). Total: £${(totalOutcome / 100).toFixed(2)}`,
              }),
            });
            
            if (smsResponse.ok) {
              console.log('✅ SMS notification sent');
            }
          } else {
            console.log('⚠️ No phone number available for driver - SMS skipped');
          }
        }
      } catch (notificationError) {
        console.error('⚠️ Failed to send notifications (non-critical):', notificationError);
        // Don't fail the request if notifications fail
      }
    }

    await logAudit(
      (session.user as any).id,
      'create_route',
      undefined,
      { 
        targetType: 'route', 
        targetId: route.id,
        after: { routeId: route.id, bookingCount: bookings.length, isAutomatic, driverId }
      }
    );

    return NextResponse.json({
      success: true,
      route,
      message: `Route created successfully with ${bookings.length} booking(s)${driverId ? ' and driver notified' : ''}`,
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
