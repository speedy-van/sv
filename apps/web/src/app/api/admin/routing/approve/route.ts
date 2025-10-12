/**
 * Route Approval Management API
 * 
 * Admin endpoints to approve or reject routes before dispatching to drivers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { routeManager } from '@/lib/orchestration/RouteManager';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/routing/approve
 * Get all pending route approvals
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pendingApprovals = await routeManager.getPendingApprovals();

    return NextResponse.json({
      success: true,
      data: pendingApprovals,
      count: pendingApprovals.length,
    });

  } catch (error) {
    console.error('❌ Get pending approvals error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending approvals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/routing/approve
 * Approve a route and dispatch to driver
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { routeId, driverId } = await request.json();

    if (!routeId) {
      return NextResponse.json(
        { error: 'routeId is required' },
        { status: 400 }
      );
    }

    const adminId = (session.user as any).id;
    const result = await routeManager.approveRoute(routeId, adminId, driverId);

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });

  } catch (error) {
    console.error('❌ Approve route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to approve route' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/routing/approve
 * Reject a route with reason
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { routeId, reason } = await request.json();

    if (!routeId || !reason) {
      return NextResponse.json(
        { error: 'routeId and reason are required' },
        { status: 400 }
      );
    }

    const adminId = (session.user as any).id;
    const result = await routeManager.rejectRoute(routeId, adminId, reason);

    return NextResponse.json({
      success: result.success,
      message: result.message,
    });

  } catch (error) {
    console.error('❌ Reject route error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reject route' },
      { status: 500 }
    );
  }
}

