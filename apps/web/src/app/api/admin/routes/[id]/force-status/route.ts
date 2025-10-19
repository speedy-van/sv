/**
 * Force Status Change API
 * 
 * Allows admin to change route status to any state regardless of current status
 * This bypasses all validation rules and state machine constraints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/routes/[id]/force-status
 * Force change route status with admin override
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: routeId } = await params;
    const body = await request.json();
    const { status, reason, updateDrops = true } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required for force status change' },
        { status: 400 }
      );
    }

    // Valid route statuses
    const validStatuses = ['planned', 'pending_assignment', 'assigned', 'active', 'completed', 'cancelled', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
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

    const previousStatus = existingRoute.status;

    // Update route status
    const updatedRoute = await prisma.route.update({
      where: { id: routeId },
      data: {
        status,
        adminNotes: `${existingRoute.adminNotes || ''}\n[FORCE STATUS CHANGE] ${new Date().toISOString()} - Admin ${session.user.name || session.user.email} changed status from ${previousStatus} to ${status}. Reason: ${reason}`,
        isModifiedByAdmin: true,
        updatedAt: new Date(),
        ...(status === 'completed' && !existingRoute.endTime ? { endTime: new Date() } : {}),
        ...(status === 'active' && !existingRoute.acceptedAt ? { acceptedAt: new Date() } : {}),
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
      },
    });

    // Update drops status if requested
    if (updateDrops) {
      let dropStatus: string | null = null;
      
      switch (status) {
        case 'planned':
        case 'pending_assignment':
        case 'assigned':
          dropStatus = 'pending';
          break;
        case 'active':
          dropStatus = 'assigned_to_route';
          break;
        case 'completed':
          dropStatus = 'delivered';
          break;
        case 'cancelled':
        case 'failed':
          dropStatus = 'failed';
          break;
      }

      if (dropStatus) {
        await prisma.drop.updateMany({
          where: { routeId },
          data: { status: dropStatus as any },
        });
      }
    }

    // Log comprehensive audit
    await logAudit({
      userId: (session.user as any).id,
      action: 'force_status_change',
      entityType: 'route',
      entityId: routeId,
      details: {
        previousStatus,
        newStatus: status,
        reason,
        updateDrops,
        dropsAffected: existingRoute.drops.length,
        adminName: session.user.name || session.user.email,
        timestamp: new Date().toISOString(),
      },
    });

    logger.warn('Route status force changed', {
      routeId,
      previousStatus,
      newStatus: status,
      reason,
      adminId: (session.user as any).id,
      updateDrops,
    });

    return NextResponse.json({
      success: true,
      data: updatedRoute,
      message: `Route status force changed from ${previousStatus} to ${status}`,
      previousStatus,
      newStatus: status,
      dropsUpdated: updateDrops,
    });

  } catch (error) {
    logger.error('Failed to force change route status', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to force change route status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

