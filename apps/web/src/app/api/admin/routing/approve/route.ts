/**
 * Route Approval Management API
 * 
 * Admin endpoints to approve or reject routes before dispatching to drivers
 */

import { NextRequest, NextResponse } from 'next/server';
import { routeManager } from '@/lib/orchestration/RouteManager';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/routing/approve
 * Get all pending route approvals
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
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
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const adminUser = authResult;

    const { routeId, driverId } = await request.json();

    if (!routeId) {
      return NextResponse.json(
        { error: 'routeId is required' },
        { status: 400 }
      );
    }
    const result = await routeManager.approveRoute(routeId, adminUser.id, driverId);

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
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const adminUser = authResult;

    const { routeId, reason } = await request.json();

    if (!routeId || !reason) {
      return NextResponse.json(
        { error: 'routeId and reason are required' },
        { status: 400 }
      );
    }
    const result = await routeManager.rejectRoute(routeId, adminUser.id, reason);

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

