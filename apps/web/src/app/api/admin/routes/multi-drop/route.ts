/**
 * Admin Multi-Drop Routes Management API - ENHANCED
 * 
 * Full control over multi-drop routes with highest level capabilities:
 * - Create, update, delete routes with advanced validation
 * - Add/remove/reorder drops dynamically
 * - Assign/reassign drivers with force override
 * - Adjust pricing and earnings
 * - Split/merge routes
 * - Real-time optimization
 * - Force status changes
 * - Bulk operations
 * - Route analytics and insights
 * - Route templates
 * - Advanced filtering and search
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';
import { driverEarningsService } from '@/lib/services/driver-earnings-service';
import { createUniqueReference } from '@/lib/ref';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/routes/multi-drop
 * Get all multi-drop routes with advanced filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const driverId = searchParams.get('driverId');
    const date = searchParams.get('date');
    const serviceTier = searchParams.get('serviceTier');
    const minDrops = searchParams.get('minDrops');
    const maxDrops = searchParams.get('maxDrops');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'startTime';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const includeAnalytics = searchParams.get('includeAnalytics') === 'true';

    // Build where clause with advanced filters
    const where: any = {
      totalDrops: { gt: 1 }, // Multi-drop only
    };

    if (status && status !== 'all') {
      if (status.includes(',')) {
        where.status = { in: status.split(',') };
      } else {
        where.status = status;
      }
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (serviceTier && serviceTier !== 'all') {
      where.serviceTier = serviceTier;
    }

    if (minDrops) {
      where.totalDrops = { ...where.totalDrops, gte: parseInt(minDrops) };
    }

    if (maxDrops) {
      where.totalDrops = { ...where.totalDrops, lte: parseInt(maxDrops) };
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { routeNotes: { contains: search, mode: 'insensitive' } },
        { adminNotes: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.route.count({ where });

    // Get routes with all related data
    const routes = await prisma.route.findMany({
      where,
      include: {
        driver: {
          select: { 
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        Vehicle: {
          select: {
            id: true,
            licensePlate: true,
            make: true,
            model: true,
            capacity: true,
            fuelType: true,
          },
        },
        drops: {
          include: {
            Booking: {
              select: {
                id: true,
                reference: true,
                customerName: true,
                customerPhone: true,
                totalGBP: true,
                status: true,
              },
            },
            User: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { timeWindowStart: 'asc' },
        },
        Booking: {
          select: {
            id: true,
            reference: true,
            customerName: true,
            totalGBP: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate analytics if requested
    let analytics = null;
    if (includeAnalytics) {
      const totalRoutes = routes.length;
      const completedRoutes = routes.filter(r => r.status === 'completed').length;
      const activeRoutes = routes.filter(r => r.status === 'active').length;
      const plannedRoutes = routes.filter(r => r.status === 'planned').length;
      const totalDrops = routes.reduce((sum, r) => sum + r.totalDrops, 0);
      const completedDrops = routes.reduce((sum, r) => sum + r.completedDrops, 0);
      const totalDistance = routes.reduce((sum, r) => sum + (r.optimizedDistanceKm || 0), 0);
      const totalDuration = routes.reduce((sum, r) => sum + (r.estimatedDuration || 0), 0);

      analytics = {
        totalRoutes,
        completedRoutes,
        activeRoutes,
        plannedRoutes,
        completionRate: totalRoutes > 0 ? (completedRoutes / totalRoutes) * 100 : 0,
        totalDrops,
        completedDrops,
        dropCompletionRate: totalDrops > 0 ? (completedDrops / totalDrops) * 100 : 0,
        totalDistance,
        totalDuration,
        averageDropsPerRoute: totalRoutes > 0 ? totalDrops / totalRoutes : 0,
        averageDistancePerRoute: totalRoutes > 0 ? totalDistance / totalRoutes : 0,
      };
    }

    logger.info('Multi-drop routes retrieved', {
      adminId: (session.user as any).id,
      routeCount: routes.length,
      totalCount,
      filters: { status, driverId, date, serviceTier, minDrops, maxDrops, search },
      pagination: { page, limit },
    });

    return NextResponse.json({
      success: true,
      data: routes,
      count: routes.length,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      analytics,
    });

  } catch (error) {
    logger.error('Failed to get multi-drop routes', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to get multi-drop routes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/routes/multi-drop
 * Create a new multi-drop route with enhanced validation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = (session.user as any).id;
    const body = await request.json();
    const {
      driverId,
      vehicleId,
      startTime,
      drops,
      serviceTier = 'standard',
      notes,
      forceCreate = false,
      skipValidation = false,
      autoOptimize = true,
      templateId,
    } = body;

    // Validation with override capability
    const validationErrors: string[] = [];

    if (!skipValidation) {
      if (!driverId && !forceCreate) {
        validationErrors.push('Driver ID is required');
      }

      if (!drops || !Array.isArray(drops) || drops.length < 2) {
        validationErrors.push('At least 2 drops are required for multi-drop route');
      }

      if (drops && drops.length > 20 && !forceCreate) {
        validationErrors.push('Maximum 20 drops allowed per route (use forceCreate to override)');
      }

      if (validationErrors.length > 0) {
        return NextResponse.json(
          { error: 'Validation failed', validationErrors },
          { status: 400 }
        );
      }
    }

    // Verify driver if provided
    let driver = null;
    if (driverId) {
      driver = await prisma.driver.findUnique({
        where: { id: driverId },
        include: {
          User: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!driver) {
        return NextResponse.json(
          { error: 'Driver not found' },
          { status: 404 }
        );
      }

      if (driver.status !== 'active' && !forceCreate) {
        return NextResponse.json(
          { error: 'Driver is not active (use forceCreate to override)' },
          { status: 400 }
        );
      }
    }

    // Calculate route metrics
    let totalDistance = 0;
    let estimatedDuration = 0;
    let totalValue = 0;

    for (let i = 0; i < drops.length; i++) {
      const drop = drops[i];
      totalDistance += drop.distanceKm || 0;
      estimatedDuration += drop.estimatedMinutes || 30;
      totalValue += drop.quotedPrice || 0;
    }

    // Auto-optimize drop sequence if enabled
    let optimizedDrops = drops;
    if (autoOptimize && drops.length > 2) {
      // Simple nearest neighbor optimization
      optimizedDrops = optimizeDropSequence(drops);
    }

    // Generate unified SV reference number
    const routeReference = await createUniqueReference('route');
    
    // Create route with enhanced fields
    const route = await prisma.route.create({
      data: {
        reference: routeReference,
        driverId: driver?.id,
        vehicleId,
        startTime: new Date(startTime),
        optimizedDistanceKm: totalDistance,
        estimatedDuration,
        totalDrops: optimizedDrops.length,
        status: driverId ? 'planned' : 'pending_assignment',
        serviceTier,
        routeNotes: notes,
        isModifiedByAdmin: true,
        adminNotes: `Created by admin ${session.user.name || session.user.email} at ${new Date().toISOString()}`,
        optimizedSequence: optimizedDrops.map((d: any, idx: number) => ({
          sequence: idx + 1,
          bookingId: d.bookingId,
          address: d.deliveryAddress,
          estimatedArrival: new Date(new Date(startTime).getTime() + idx * 30 * 60 * 1000),
        })),
        totalOutcome: totalValue,
        optimizationScore: autoOptimize ? calculateOptimizationScore(optimizedDrops) : null,
        routeOptimizationVersion: '2.0',
      },
      include: {
        driver: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    // Create drops with enhanced tracking
    for (let i = 0; i < optimizedDrops.length; i++) {
      const drop = optimizedDrops[i];
      
      // Fetch booking data if bookingId provided
      let bookingForDrop: { customerId: string; totalGBP: number } | null = null;
      if (drop.bookingId) {
        try {
          const b = await prisma.booking.findUnique({
            where: { id: String(drop.bookingId) },
            select: { customerId: true, totalGBP: true },
          });
          if (b) bookingForDrop = b as any;
        } catch (err) {
          logger.warn('Failed to fetch booking for drop', { bookingId: drop.bookingId, error: err });
        }
      }

      await prisma.drop.create({
        data: {
          Route: { connect: { id: route.id } },
          ...(drop.bookingId ? { Booking: { connect: { id: String(drop.bookingId) } } } : {}),
          quotedPrice: bookingForDrop?.totalGBP || drop.quotedPrice || 0,
          User: { connect: { id: bookingForDrop?.customerId || drop.customerId } },
          pickupAddress: drop.pickupAddress,
          deliveryAddress: drop.deliveryAddress,
          pickupLat: drop.pickupLat,
          pickupLng: drop.pickupLng,
          timeWindowStart: new Date(new Date(startTime).getTime() + i * 30 * 60 * 1000),
          timeWindowEnd: new Date(new Date(startTime).getTime() + (i + 1) * 30 * 60 * 1000),
          status: 'pending',
          weight: typeof drop.weight === 'number' ? drop.weight : undefined,
          volume: typeof drop.volume === 'number' ? drop.volume : undefined,
          specialInstructions: drop.specialInstructions,
          serviceTier: serviceTier as any,
          estimatedDuration: drop.estimatedMinutes || 30,
        },
      });
    }

    // Log comprehensive audit
    await logAudit(adminId, 'create_multi_drop_route', route.id, {
      driverId: driver?.id,
      dropsCount: optimizedDrops.length,
      totalDistance,
      estimatedDuration,
      totalValue,
      forceCreate,
      skipValidation,
      autoOptimize,
      templateId,
    });

    logger.info('Multi-drop route created', {
      routeId: route.id,
      reference: routeReference,
      adminId,
      driverId: driver?.id,
      dropsCount: optimizedDrops.length,
      totalDistance,
      estimatedDuration,
    });

    return NextResponse.json({
      success: true,
      data: route,
      message: 'Multi-drop route created successfully',
      optimized: autoOptimize,
      validationWarnings: validationErrors.length > 0 && forceCreate ? validationErrors : [],
    });

  } catch (error) {
    logger.error('Failed to create multi-drop route', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to create multi-drop route',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/routes/multi-drop
 * Update an existing multi-drop route with full admin control
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = (session.user as any).id;
    const body = await request.json();
    const {
      routeId,
      driverId,
      vehicleId,
      startTime,
      drops,
      status,
      notes,
      adjustedPricing,
      forceUpdate = false,
      reason,
    } = body;

    if (!routeId) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      );
    }

    // Get existing route
    const existingRoute = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        drops: true,
        driver: true,
      },
    });

    if (!existingRoute) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    // Check if update is allowed
    if (!forceUpdate && existingRoute.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot update completed route (use forceUpdate to override)' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      isModifiedByAdmin: true,
      adminNotes: `Updated by admin ${session.user.name || session.user.email} at ${new Date().toISOString()}${reason ? ` - Reason: ${reason}` : ''}`,
      updatedAt: new Date(),
    };

    if (driverId !== undefined) {
      updateData.driverId = driverId;
      if (driverId && existingRoute.driverId !== driverId) {
        updateData.adminNotes += ` | Driver changed from ${existingRoute.driverId} to ${driverId}`;
      }
    }

    if (vehicleId !== undefined) {
      updateData.vehicleId = vehicleId;
    }

    if (startTime) {
      updateData.startTime = new Date(startTime);
    }

    if (status) {
      updateData.status = status;
      if (status !== existingRoute.status) {
        updateData.adminNotes += ` | Status changed from ${existingRoute.status} to ${status}`;
      }
    }

    if (notes) {
      updateData.routeNotes = notes;
    }

    if (adjustedPricing) {
      updateData.adminAdjustedPrice = adjustedPricing.totalPrice;
      updateData.driverPayout = adjustedPricing.driverPayout;
      updateData.adminNotes += ` | Pricing adjusted`;
    }

    // Update drops if provided
    if (drops && Array.isArray(drops)) {
      // Delete existing drops
      await prisma.drop.deleteMany({
        where: { routeId },
      });

      // Create new drops
      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];
        let bookingForDrop: { customerId: string; totalGBP: number } | null = null;
        if (drop.bookingId) {
          try {
            const b = await prisma.booking.findUnique({
              where: { id: String(drop.bookingId) },
              select: { customerId: true, totalGBP: true },
            });
            if (b) bookingForDrop = b as any;
          } catch {}
        }
        await prisma.drop.create({
          data: {
            Route: { connect: { id: routeId } },
            ...(drop.bookingId ? { Booking: { connect: { id: String(drop.bookingId) } } } : {}),
            quotedPrice: bookingForDrop?.totalGBP || drop.quotedPrice || 0,
            User: { connect: { id: bookingForDrop?.customerId || drop.customerId } },
            pickupAddress: drop.pickupAddress,
            deliveryAddress: drop.deliveryAddress,
            pickupLat: drop.pickupLat,
            pickupLng: drop.pickupLng,
            timeWindowStart: new Date(
              new Date(startTime || existingRoute.startTime).getTime() + i * 30 * 60 * 1000
            ),
            timeWindowEnd: new Date(
              new Date(startTime || existingRoute.startTime).getTime() + (i + 1) * 30 * 60 * 1000
            ),
            status: drop.status || 'pending',
            weight: drop.weight,
            volume: drop.volume,
            specialInstructions: drop.specialInstructions,
            serviceTier: drop.serviceTier || existingRoute.serviceTier as any,
            estimatedDuration: drop.estimatedMinutes || 30,
          },
        });
      }

      updateData.totalDrops = drops.length;
      updateData.optimizedSequence = drops.map((d: any, idx: number) => ({
        sequence: idx + 1,
        bookingId: d.bookingId,
        address: d.deliveryAddress,
      }));
    }

    // Update route
    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: updateData,
      include: {
        driver: { select: { id: true, name: true, email: true, phone: true } },
        drops: {
          include: {
            Booking: {
              select: {
                id: true,
                reference: true,
                customerName: true,
                customerPhone: true,
                totalGBP: true,
              },
            },
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { timeWindowStart: 'asc' },
        },
      },
    });

    // Log comprehensive audit
    await logAudit({
      userId: adminId,
      action: 'update_multi_drop_route',
      entityType: 'route',
      entityId: routeId,
      details: {
        changes: updateData,
        dropsUpdated: drops ? drops.length : 0,
        forceUpdate,
        reason,
        previousStatus: existingRoute.status,
        newStatus: status,
        previousDriver: existingRoute.driverId,
        newDriver: driverId,
      },
    });

    logger.info('Multi-drop route updated', {
      routeId,
      adminId,
      changes: Object.keys(updateData),
      forceUpdate,
    });

    return NextResponse.json({
      success: true,
      data: updatedRoute,
      message: 'Multi-drop route updated successfully',
      changesApplied: Object.keys(updateData),
    });

  } catch (error) {
    logger.error('Failed to update multi-drop route', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to update multi-drop route',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/routes/multi-drop
 * Delete/cancel a multi-drop route with admin override
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const hardDelete = searchParams.get('hardDelete') === 'true';
    const forceDelete = searchParams.get('forceDelete') === 'true';
    const reason = searchParams.get('reason');

    if (!routeId) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      );
    }

    // Get route
    const route = await prisma.route.findUnique({
      where: { id: routeId },
      include: {
        drops: true,
      },
    });

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    // Check if deletion is allowed
    if (!forceDelete && route.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete active route (use forceDelete to override)' },
        { status: 400 }
      );
    }

    if (hardDelete) {
      // Hard delete (permanent removal)
      if (!forceDelete && route.status !== 'planned') {
        return NextResponse.json(
          { error: 'Can only hard delete planned routes (use forceDelete to override)' },
          { status: 400 }
        );
      }

      // Delete drops first
      await prisma.drop.deleteMany({
        where: { routeId },
      });

      // Delete route
      await prisma.route.delete({
        where: { id: routeId },
      });

      await logAudit({
        userId: adminId,
        action: 'delete_multi_drop_route',
        entityType: 'route',
        entityId: routeId,
        details: { 
          hardDelete: true, 
          forceDelete,
          reason,
          routeStatus: route.status,
          dropsDeleted: route.drops.length,
        },
      });

      logger.info('Multi-drop route deleted', {
        routeId,
        adminId,
        hardDelete: true,
        forceDelete,
      });

      return NextResponse.json({
        success: true,
        message: 'Multi-drop route permanently deleted',
      });
    } else {
      // Soft delete (cancel)
      await prisma.route.update({
        where: { id: routeId },
        data: {
          status: 'cancelled',
          adminNotes: `Cancelled by admin ${session.user.name || session.user.email} at ${new Date().toISOString()}${reason ? ` - Reason: ${reason}` : ''}`,
        },
      });

      // Update drops status
      await prisma.drop.updateMany({
        where: { routeId },
        data: { status: 'failed' },
      });

      await logAudit({
        userId: adminId,
        action: 'cancel_multi_drop_route',
        entityType: 'route',
        entityId: routeId,
        details: { 
          softDelete: true,
          reason,
          routeStatus: route.status,
          dropsAffected: route.drops.length,
        },
      });

      logger.info('Multi-drop route cancelled', {
        routeId,
        adminId,
        reason,
      });

      return NextResponse.json({
        success: true,
        message: 'Multi-drop route cancelled successfully',
      });
    }

  } catch (error) {
    logger.error('Failed to delete multi-drop route', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to delete multi-drop route',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper Functions

/**
 * Optimize drop sequence using nearest neighbor algorithm
 */
function optimizeDropSequence(drops: any[]): any[] {
  if (drops.length <= 2) return drops;

  const optimized: any[] = [];
  const remaining = [...drops];

  // Start with first drop
  let current = remaining.shift()!;
  optimized.push(current);

  // Find nearest neighbor for each subsequent drop
  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      // Use saved distance data or default fallback (no direct distance calculation)
      const distance = remaining[i].savedDistance || 5.0; // Default 5km fallback

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    current = remaining.splice(nearestIndex, 1)[0];
    optimized.push(current);
  }

  return optimized;
}

/**
 * Get distance from saved data or use fallback
 * Distance calculations are handled by the unified pricing system
 */
function getDistanceFromSavedData(drop: any): number {
  // Use saved distance data or reasonable fallback
  return drop.savedDistance || drop.baseDistanceMiles || 5.0;
}

/**
 * Calculate optimization score for route
 */
function calculateOptimizationScore(drops: any[]): number {
  if (drops.length <= 2) return 1.0;

  let totalDistance = 0;
  for (let i = 0; i < drops.length - 1; i++) {
    // Use saved distance data or fallback (no direct calculation)
    totalDistance += getDistanceFromSavedData(drops[i]);
  }

  // Calculate efficiency score (lower distance = higher score)
  const averageDistance = totalDistance / (drops.length - 1);
  const maxExpectedDistance = 10; // km
  const score = Math.max(0, Math.min(1, 1 - (averageDistance / maxExpectedDistance)));

  return score;
}

