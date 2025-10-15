/**
 * Admin Routes Management API
 * Full CRUD operations for multi-drop routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

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
      console.log(`✅ [Admin Routes API] Found ${routes.length} routes`);
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

    return NextResponse.json({
      success: true,
      routes: routes.map((route: any) => ({
        id: route.id,
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
      metrics: {
        totalRoutes,
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
      startTime, 
      serviceTier,
      isAutomatic = false 
    } = body;

    // Validate drops exist and are available
    const drops = await prisma.drop.findMany({
      where: {
        id: { in: dropIds },
        status: 'pending',
      }
    });

    if (drops.length !== dropIds.length) {
      return NextResponse.json(
        { error: 'Some drops are not available' },
        { status: 400 }
      );
    }

    // Calculate route metrics
    const totalWeight = drops.reduce((sum, d) => sum + (d.weight || 0), 0);
    const totalVolume = drops.reduce((sum, d) => sum + (d.volume || 0), 0);
    const totalOutcome = drops.reduce((sum, d) => sum + Number(d.quotedPrice), 0);

    // Create route
    const routeId = `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const route = await prisma.route.create({
      data: {
        id: routeId,
        driverId: driverId || null,
        vehicleId: vehicleId || null,
        status: driverId ? 'assigned' : 'planned',
        startTime: new Date(startTime),
        serviceTier: serviceTier || 'standard',
        totalDrops: drops.length,
        completedDrops: 0,
        totalOutcome,
        maxCapacityWeight: totalWeight,
        maxCapacityVolume: totalVolume,
        routeNotes: isAutomatic ? 'System-generated route' : 'Manually created route',
        updatedAt: new Date()
      },
      include: {
        driver: { select: { id: true, name: true, email: true } },
        drops: true,
      }
    });

    // Update drops to link to route
    await prisma.drop.updateMany({
      where: { id: { in: dropIds } },
      data: {
        routeId: route.id,
        status: 'assigned',
      }
    });

    await logAudit(
      (session.user as any).id,
      'create_route',
      undefined,
      { 
        targetType: 'route', 
        targetId: route.id,
        after: { routeId: route.id, dropCount: drops.length, isAutomatic }
      }
    );

    return NextResponse.json({
      success: true,
      route,
      message: `Route created successfully with ${drops.length} drops`,
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
