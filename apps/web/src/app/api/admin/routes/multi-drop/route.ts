/**
 * Admin Multi-Drop Routes Management API
 * 
 * Full control over multi-drop routes:
 * - Create, update, delete routes
 * - Add/remove/reorder drops
 * - Assign/reassign drivers
 * - Adjust pricing and earnings
 * - Split/merge routes
 * - Real-time optimization
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
 * Get all multi-drop routes with full details
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

    // Build where clause
    const where: any = {
      totalDrops: { gt: 1 }, // Multi-drop only
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    if (driverId) {
      where.driverId = driverId;
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

    // Get routes with all related data
    const routes = await prisma.route.findMany({
      where,
      include: {
        driver: {
          select: { 
            id: true,
            name: true,
            email: true
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
        startTime: 'desc',
      },
    });

    logger.info('Multi-drop routes retrieved', {
      adminId: (session.user as any).id,
      routeCount: routes.length,
      filters: { status, driverId, date },
    });

    return NextResponse.json({
      success: true,
      data: routes,
      count: routes.length,
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
 * Create a new multi-drop route
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
    } = body;

    // Validate input
    if (!driverId) {
      return NextResponse.json(
        { error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    if (!drops || !Array.isArray(drops) || drops.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 drops are required for multi-drop route' },
        { status: 400 }
      );
    }

    if (drops.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 drops allowed per route' },
        { status: 400 }
      );
    }

    // Verify driver exists and is available
    const driver = await prisma.driver.findUnique({
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

    if (driver.status !== 'active') {
      return NextResponse.json(
        { error: 'Driver is not active' },
        { status: 400 }
      );
    }

    // Calculate route metrics
    let totalDistance = 0;
    let estimatedDuration = 0;

    for (let i = 0; i < drops.length; i++) {
      const drop = drops[i];
      totalDistance += drop.distanceKm || 0;
      estimatedDuration += drop.estimatedMinutes || 30; // Default 30 min per drop
    }

    // Generate unified SV reference number
    const routeReference = await createUniqueReference('route');
    
    // Create route
    const route = await prisma.route.create({
      data: {
        reference: routeReference,
        driverId: driver.id, // ✅ Fixed: Use driver.id instead of driver.userId
        vehicleId,
        startTime: new Date(startTime),
        optimizedDistanceKm: totalDistance,
        estimatedDuration,
        totalDrops: drops.length,
        status: 'planned',
        serviceTier,
        routeNotes: notes,
        isModifiedByAdmin: true,
        adminNotes: `Created by admin ${session.user.name || session.user.email}`,
        optimizedSequence: drops.map((d: any, idx: number) => ({
          sequence: idx + 1,
          bookingId: d.bookingId,
          address: d.address,
        })),
      },
      include: {
        driver: { select: { id: true, name: true, email: true } },
      },
    });

    // Create drops
    for (let i = 0; i < drops.length; i++) {
      const drop = drops[i];
      // Try to fetch booking to derive customerId and quotedPrice if bookingId present
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
          Route: { connect: { id: route.id } },
          ...(drop.bookingId ? { Booking: { connect: { id: String(drop.bookingId) } } } : {}),
          // Required fields per schema
          quotedPrice: bookingForDrop ? bookingForDrop.totalGBP : 0,
          User: { connect: { id: bookingForDrop ? bookingForDrop.customerId : drop.customerId } },
          pickupAddress: drop.pickupAddress,
          deliveryAddress: drop.deliveryAddress,
          timeWindowStart: new Date(new Date(startTime).getTime() + i * 30 * 60 * 1000),
          timeWindowEnd: new Date(new Date(startTime).getTime() + (i + 1) * 30 * 60 * 1000),
          status: 'pending',
          weight: typeof drop.weight === 'number' ? drop.weight : undefined,
          volume: typeof drop.volume === 'number' ? drop.volume : undefined,
        },
      });
    }

    // Log audit
    await logAudit(adminId, 'create_multi_drop_route', route.id, {
      driverId,
      dropsCount: drops.length,
      totalDistance,
      estimatedDuration,
    });

    logger.info('Multi-drop route created', {
      routeId: route.id,
      adminId,
      driverId,
      dropsCount: drops.length,
    });

    return NextResponse.json({
      success: true,
      data: route,
      message: 'Multi-drop route created successfully',
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
 * Update an existing multi-drop route
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
      },
    });

    if (!existingRoute) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      isModifiedByAdmin: true,
      adminNotes: `Updated by admin ${session.user.name || session.user.email} at ${new Date().toISOString()}`,
      updatedAt: new Date(),
    };

    if (driverId) {
      updateData.driverId = driverId;
    }

    if (vehicleId) {
      updateData.vehicleId = vehicleId;
    }

    if (startTime) {
      updateData.startTime = new Date(startTime);
    }

    if (status) {
      updateData.status = status;
    }

    if (notes) {
      updateData.routeNotes = notes;
    }

    if (adjustedPricing) {
      updateData.adminAdjustedPrice = adjustedPricing.totalPrice;
      updateData.driverPayout = adjustedPricing.driverPayout;
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
            quotedPrice: bookingForDrop ? bookingForDrop.totalGBP : 0,
            User: { connect: { id: bookingForDrop ? bookingForDrop.customerId : drop.customerId } },
            pickupAddress: drop.pickupAddress,
            deliveryAddress: drop.deliveryAddress,
            timeWindowStart: new Date(
              new Date(startTime || existingRoute.startTime).getTime() + i * 30 * 60 * 1000
            ),
            timeWindowEnd: new Date(
              new Date(startTime || existingRoute.startTime).getTime() + (i + 1) * 30 * 60 * 1000
            ),
            status: drop.status || 'pending',
            weight: drop.weight || 0,
            volume: drop.volume || 0,
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
        driver: { select: { id: true, name: true, email: true } },
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
          orderBy: { timeWindowStart: 'asc' },
        },
      },
    });

    // Log audit
    await logAudit({
      userId: adminId,
      action: 'update_multi_drop_route',
      entityType: 'route',
      entityId: routeId,
      details: {
        changes: updateData,
        dropsUpdated: drops ? drops.length : 0,
      },
    });

    logger.info('Multi-drop route updated', {
      routeId,
      adminId,
      changes: Object.keys(updateData),
    });

    return NextResponse.json({
      success: true,
      data: updatedRoute,
      message: 'Multi-drop route updated successfully',
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
 * Delete/cancel a multi-drop route
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

    if (!routeId) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      );
    }

    // Get route
    const route = await prisma.route.findUnique({
      where: { id: routeId },
    });

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // Hard delete (only if route is in planned status)
      if (route.status !== 'planned') {
        return NextResponse.json(
          { error: 'Can only hard delete planned routes' },
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
        details: { hardDelete: true },
      });

      logger.info('Multi-drop route deleted', {
        routeId,
        adminId,
        hardDelete: true,
      });

      return NextResponse.json({
        success: true,
        message: 'Multi-drop route deleted successfully',
      });
    } else {
      // Soft delete (cancel)
      await prisma.route.update({
        where: { id: routeId },
        data: {
          status: 'cancelled',
          adminNotes: `Cancelled by admin ${session.user.name || session.user.email} at ${new Date().toISOString()}`,
        },
      });

      await logAudit({
        userId: adminId,
        action: 'cancel_multi_drop_route',
        entityType: 'route',
        entityId: routeId,
        details: { softDelete: true },
      });

      logger.info('Multi-drop route cancelled', {
        routeId,
        adminId,
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

