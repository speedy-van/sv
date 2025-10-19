/**
 * Bulk Route Operations API
 * 
 * Perform operations on multiple routes simultaneously:
 * - Bulk status change
 * - Bulk assignment/reassignment
 * - Bulk deletion/cancellation
 * - Bulk optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/routes/bulk
 * Perform bulk operations on routes
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
      operation,
      routeIds,
      data,
      forceOperation = false,
    } = body;

    // Validate input
    if (!operation) {
      return NextResponse.json(
        { error: 'Operation is required' },
        { status: 400 }
      );
    }

    if (!routeIds || !Array.isArray(routeIds) || routeIds.length === 0) {
      return NextResponse.json(
        { error: 'Route IDs array is required' },
        { status: 400 }
      );
    }

    if (routeIds.length > 100 && !forceOperation) {
      return NextResponse.json(
        { error: 'Maximum 100 routes per bulk operation (use forceOperation to override)' },
        { status: 400 }
      );
    }

    const results = {
      success: [] as string[],
      failed: [] as { routeId: string; error: string }[],
      total: routeIds.length,
    };

    // Perform bulk operation based on type
    switch (operation) {
      case 'changeStatus':
        await bulkChangeStatus(routeIds, data, results, adminId, session);
        break;

      case 'assignDriver':
        await bulkAssignDriver(routeIds, data, results, adminId, session);
        break;

      case 'unassignDriver':
        await bulkUnassignDriver(routeIds, results, adminId, session);
        break;

      case 'cancel':
        await bulkCancel(routeIds, data, results, adminId, session);
        break;

      case 'delete':
        await bulkDelete(routeIds, data, results, adminId, session, forceOperation);
        break;

      case 'optimize':
        await bulkOptimize(routeIds, results, adminId, session);
        break;

      case 'updateServiceTier':
        await bulkUpdateServiceTier(routeIds, data, results, adminId, session);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }

    // Log comprehensive audit
    await logAudit({
      userId: adminId,
      action: 'bulk_route_operation',
      entityType: 'route',
      entityId: 'bulk',
      details: {
        operation,
        totalRoutes: routeIds.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
        data,
        forceOperation,
      },
    });

    logger.info('Bulk route operation completed', {
      operation,
      adminId,
      totalRoutes: routeIds.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
    });

    return NextResponse.json({
      success: true,
      message: `Bulk operation completed: ${results.success.length} succeeded, ${results.failed.length} failed`,
      results,
    });

  } catch (error) {
    logger.error('Failed to perform bulk route operation', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to perform bulk route operation',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Bulk Operation Handlers

async function bulkChangeStatus(
  routeIds: string[],
  data: any,
  results: any,
  adminId: string,
  session: any
) {
  const { status, reason } = data;

  if (!status) {
    throw new Error('Status is required for changeStatus operation');
  }

  for (const routeId of routeIds) {
    try {
      const route = await prisma.route.findUnique({
        where: { id: routeId },
      });

      if (!route) {
        results.failed.push({ routeId, error: 'Route not found' });
        continue;
      }

      await prisma.route.update({
        where: { id: routeId },
        data: {
          status,
          adminNotes: `${route.adminNotes || ''}\n[BULK STATUS CHANGE] ${new Date().toISOString()} - Changed to ${status}${reason ? ` - Reason: ${reason}` : ''}`,
          isModifiedByAdmin: true,
        },
      });

      results.success.push(routeId);
    } catch (error) {
      results.failed.push({
        routeId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

async function bulkAssignDriver(
  routeIds: string[],
  data: any,
  results: any,
  adminId: string,
  session: any
) {
  const { driverId } = data;

  if (!driverId) {
    throw new Error('Driver ID is required for assignDriver operation');
  }

  // Verify driver exists
  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
  });

  if (!driver) {
    throw new Error('Driver not found');
  }

  for (const routeId of routeIds) {
    try {
      await prisma.route.update({
        where: { id: routeId },
        data: {
          driverId,
          status: 'assigned',
          adminNotes: `[BULK ASSIGNMENT] ${new Date().toISOString()} - Assigned to driver ${driverId}`,
          isModifiedByAdmin: true,
        },
      });

      results.success.push(routeId);
    } catch (error) {
      results.failed.push({
        routeId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

async function bulkUnassignDriver(
  routeIds: string[],
  results: any,
  adminId: string,
  session: any
) {
  for (const routeId of routeIds) {
    try {
      await prisma.route.update({
        where: { id: routeId },
        data: {
          driverId: null,
          status: 'pending_assignment',
          adminNotes: `[BULK UNASSIGNMENT] ${new Date().toISOString()} - Driver unassigned`,
          isModifiedByAdmin: true,
        },
      });

      results.success.push(routeId);
    } catch (error) {
      results.failed.push({
        routeId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

async function bulkCancel(
  routeIds: string[],
  data: any,
  results: any,
  adminId: string,
  session: any
) {
  const { reason } = data;

  for (const routeId of routeIds) {
    try {
      await prisma.route.update({
        where: { id: routeId },
        data: {
          status: 'cancelled',
          adminNotes: `[BULK CANCELLATION] ${new Date().toISOString()} - Cancelled${reason ? ` - Reason: ${reason}` : ''}`,
          isModifiedByAdmin: true,
        },
      });

      // Update drops
      await prisma.drop.updateMany({
        where: { routeId },
        data: { status: 'failed' },
      });

      results.success.push(routeId);
    } catch (error) {
      results.failed.push({
        routeId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

async function bulkDelete(
  routeIds: string[],
  data: any,
  results: any,
  adminId: string,
  session: any,
  forceOperation: boolean
) {
  const { hardDelete = false } = data;

  for (const routeId of routeIds) {
    try {
      const route = await prisma.route.findUnique({
        where: { id: routeId },
      });

      if (!route) {
        results.failed.push({ routeId, error: 'Route not found' });
        continue;
      }

      if (!forceOperation && route.status !== 'planned' && hardDelete) {
        results.failed.push({
          routeId,
          error: 'Can only hard delete planned routes',
        });
        continue;
      }

      if (hardDelete) {
        // Delete drops first
        await prisma.drop.deleteMany({
          where: { routeId },
        });

        // Delete route
        await prisma.route.delete({
          where: { id: routeId },
        });
      } else {
        // Soft delete (cancel)
        await prisma.route.update({
          where: { id: routeId },
          data: {
            status: 'cancelled',
            adminNotes: `[BULK DELETION] ${new Date().toISOString()} - Cancelled`,
          },
        });
      }

      results.success.push(routeId);
    } catch (error) {
      results.failed.push({
        routeId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

async function bulkOptimize(
  routeIds: string[],
  results: any,
  adminId: string,
  session: any
) {
  for (const routeId of routeIds) {
    try {
      const route = await prisma.route.findUnique({
        where: { id: routeId },
        include: {
          drops: {
            orderBy: { timeWindowStart: 'asc' },
          },
        },
      });

      if (!route) {
        results.failed.push({ routeId, error: 'Route not found' });
        continue;
      }

      if (route.drops.length < 2) {
        results.failed.push({ routeId, error: 'Not enough drops to optimize' });
        continue;
      }

      // Perform optimization (placeholder - implement actual optimization logic)
      const optimizedSequence = route.drops.map((drop, idx) => ({
        sequence: idx + 1,
        dropId: drop.id,
        address: drop.deliveryAddress,
      }));

      await prisma.route.update({
        where: { id: routeId },
        data: {
          optimizedSequence,
          adminNotes: `${route.adminNotes || ''}\n[BULK OPTIMIZATION] ${new Date().toISOString()} - Route optimized`,
          isModifiedByAdmin: true,
        },
      });

      results.success.push(routeId);
    } catch (error) {
      results.failed.push({
        routeId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

async function bulkUpdateServiceTier(
  routeIds: string[],
  data: any,
  results: any,
  adminId: string,
  session: any
) {
  const { serviceTier } = data;

  if (!serviceTier) {
    throw new Error('Service tier is required for updateServiceTier operation');
  }

  for (const routeId of routeIds) {
    try {
      await prisma.route.update({
        where: { id: routeId },
        data: {
          serviceTier,
          adminNotes: `[BULK SERVICE TIER UPDATE] ${new Date().toISOString()} - Changed to ${serviceTier}`,
          isModifiedByAdmin: true,
        },
      });

      // Update drops service tier
      await prisma.drop.updateMany({
        where: { routeId },
        data: { serviceTier: serviceTier as any },
      });

      results.success.push(routeId);
    } catch (error) {
      results.failed.push({
        routeId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

