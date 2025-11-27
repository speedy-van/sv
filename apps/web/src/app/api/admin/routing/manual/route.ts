/**
 * Manual Route Creation API
 * 
 * Admin endpoints to manually create routes from selected bookings/drops
 */

import { NextRequest, NextResponse } from 'next/server';
import { routeManager } from '@/lib/orchestration/RouteManager';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/routing/manual
 * Create route manually from selected bookings or drops
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const adminUser = authResult;

    const body = await request.json();
    const { bookingIds, dropIds, driverId, vehicleId, startTime, serviceTier, skipApproval } = body;

    // Validation
    if (!bookingIds?.length && !dropIds?.length) {
      return NextResponse.json(
        { error: 'Either bookingIds or dropIds must be provided' },
        { status: 400 }
      );
    }

    if (!startTime) {
      return NextResponse.json(
        { error: 'startTime is required' },
        { status: 400 }
      );
    }

    const result = await routeManager.createManualRoute({
      bookingIds,
      dropIds,
      driverId,
      vehicleId,
      startTime: new Date(startTime),
      serviceTier,
      adminId: adminUser.id,
      skipApproval: skipApproval || false,
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        routeId: result.routeId,
        approvalId: result.approvalId,
        requiresApproval: !!result.approvalId,
      },
    });

  } catch (error) {
    console.error('❌ Manual route creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create route' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/routing/manual/preview
 * Preview route before creation
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { bookingIds } = await request.json();

    if (!bookingIds?.length) {
      return NextResponse.json(
        { error: 'bookingIds are required' },
        { status: 400 }
      );
    }

    const preview = await routeManager.generateRoutePreview(bookingIds);

    return NextResponse.json({
      success: true,
      data: preview,
    });

  } catch (error) {
    console.error('❌ Route preview error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate preview' },
      { status: 500 }
    );
  }
}

