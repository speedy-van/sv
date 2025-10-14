/**
 * Admin Individual Route Management API
 * Update, Delete, Reassign routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/routes/[id]
 * Get specific route details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const route = await prisma.route.findUnique({
      where: { id: params.id },
      include: {
        driver: true,
        drops: {
          include: {
            User: { select: { id: true, name: true, email: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        Vehicle: true
      }
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      route: {
        ...route,
        progress: route.totalDrops > 0 ? (route.completedDrops / route.totalDrops * 100) : 0,
      }
    });

  } catch (error) {
    console.error('❌ Route GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch route', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/routes/[id]
 * Update route (add/remove drops, change driver, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const existingRoute = await prisma.route.findUnique({
      where: { id: params.id },
      include: { drops: true }
    });

    if (!existingRoute) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    let updatedRoute;

    switch (action) {
      case 'reassign_driver':
        // Reassign route to different driver (even if active)
        const { newDriverId } = body;
        
        updatedRoute = await prisma.route.update({
          where: { id: params.id },
          data: {
            driverId: newDriverId,
            routeNotes: `${existingRoute.routeNotes || ''} | Driver reassigned by admin`,
            isModifiedByAdmin: true,
            adminNotes: `Reassigned from driver ${existingRoute.driverId} to ${newDriverId}`,
          },
          include: {
            driver: true
          }
        });

        await logAudit(
          (session.user as any).id,
          'reassign_route_driver',
          undefined,
          { 
            targetType: 'route', 
            targetId: params.id,
            before: { driverId: existingRoute.driverId },
            after: { driverId: newDriverId }
          }
        );
        break;

      case 'add_drops':
        // Add drops to existing route (even if active)
        const { dropIdsToAdd } = body;
        
        // Validate drops
        const dropsToAdd = await prisma.drop.findMany({
          where: {
            id: { in: dropIdsToAdd },
            status: 'pending',
          }
        });

        if (dropsToAdd.length !== dropIdsToAdd.length) {
          return NextResponse.json(
            { error: 'Some drops are not available' },
            { status: 400 }
          );
        }

        // Update drops
        await prisma.drop.updateMany({
          where: { id: { in: dropIdsToAdd } },
          data: {
            routeId: params.id,
            status: 'assigned_to_route',
          }
        });

        // Update route totals
        const newTotalOutcome = dropsToAdd.reduce((sum, d) => sum + Number(d.quotedPrice), 0);
        
        updatedRoute = await prisma.route.update({
          where: { id: params.id },
          data: {
            totalDrops: existingRoute.totalDrops + dropsToAdd.length,
            totalOutcome: Number(existingRoute.totalOutcome) + newTotalOutcome,
            isModifiedByAdmin: true,
            adminNotes: `${dropsToAdd.length} drops added by admin`,
          },
          include: { drops: true }
        });

        await logAudit(
          (session.user as any).id,
          'add_drops_to_route',
          undefined,
          { 
            targetType: 'route', 
            targetId: params.id,
            after: { addedDrops: dropIdsToAdd.length }
          }
        );
        break;

      case 'remove_drops':
        // Remove drops from route
        const { dropIdsToRemove } = body;
        
        const dropsToRemove = await prisma.drop.findMany({
          where: {
            id: { in: dropIdsToRemove },
            routeId: params.id,
          }
        });

        // Update drops back to pending
        await prisma.drop.updateMany({
          where: { id: { in: dropIdsToRemove } },
          data: {
            routeId: null,
            status: 'pending',
          }
        });

        const removedOutcome = dropsToRemove.reduce((sum, d) => sum + Number(d.quotedPrice), 0);
        
        updatedRoute = await prisma.route.update({
          where: { id: params.id },
          data: {
            totalDrops: existingRoute.totalDrops - dropsToRemove.length,
            totalOutcome: Number(existingRoute.totalOutcome) - removedOutcome,
            isModifiedByAdmin: true,
            adminNotes: `${dropsToRemove.length} drops removed by admin`,
          },
          include: { drops: true }
        });

        await logAudit(
          (session.user as any).id,
          'remove_drops_from_route',
          undefined,
          { 
            targetType: 'route', 
            targetId: params.id,
            after: { removedDrops: dropIdsToRemove.length }
          }
        );
        break;

      case 'update_status':
        // Update route status
        const { newStatus } = body;
        
        updatedRoute = await prisma.route.update({
          where: { id: params.id },
          data: {
            status: newStatus,
            ...(newStatus === 'completed' && {
              endTime: new Date(),
              actualDuration: existingRoute.startTime ? 
                Math.floor((new Date().getTime() - existingRoute.startTime.getTime()) / 60000) : null
            })
          }
        });

        await logAudit(
          (session.user as any).id,
          'update_route_status',
          undefined,
          { 
            targetType: 'route', 
            targetId: params.id,
            before: { status: existingRoute.status },
            after: { status: newStatus }
          }
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      route: updatedRoute,
      message: 'Route updated successfully'
    });

  } catch (error) {
    console.error('❌ Route PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update route', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/routes/[id]
 * Cancel/Delete route
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reason = searchParams.get('reason') || 'Cancelled by admin';

    // Get route before deletion
    const route = await prisma.route.findUnique({
      where: { id: params.id },
      include: { drops: true }
    });

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Release all drops back to pending
    if (route.drops.length > 0) {
      await prisma.drop.updateMany({
        where: { routeId: params.id },
        data: {
          routeId: null,
          status: 'pending',
        }
      });
    }

    // Mark route as cancelled instead of deleting (for audit trail)
    await prisma.route.update({
      where: { id: params.id },
      data: {
        status: 'failed',
        adminNotes: `CANCELLED: ${reason}`,
        endTime: new Date(),
      }
    });

    await logAudit(
      (session.user as any).id,
      'cancel_route',
      undefined,
      { 
        targetType: 'route', 
        targetId: params.id,
        before: { status: route.status, dropCount: route.drops.length },
        after: { status: 'failed', reason }
      }
    );

    return NextResponse.json({
      success: true,
      message: `Route cancelled and ${route.drops.length} drops released back to pending`,
    });

  } catch (error) {
    console.error('❌ Route DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel route', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

