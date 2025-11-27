/**
 * Manual Trigger for Auto-Routing
 * 
 * Allows admin to manually trigger auto-routing process
 */

import { NextRequest, NextResponse } from 'next/server';
import { routeManager } from '@/lib/orchestration/RouteManager';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/routing/trigger
 * Manually trigger auto-routing
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const adminUser = authResult;
    const adminId = adminUser.id;
    const adminName = adminUser.name || 'Admin';

    console.log(`🚀 Auto-routing manually triggered by ${adminName}`);

    const result = await routeManager.runAutoRouting(adminId);

    return NextResponse.json({
      success: result.success,
      data: result,
      message: result.success 
        ? `Successfully created ${result.routesCreated} routes from ${result.bookingsProcessed} bookings`
        : `Auto-routing failed: ${result.errors.join(', ')}`,
    });

  } catch (error) {
    console.error('❌ Manual auto-routing trigger error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger auto-routing' 
      },
      { status: 500 }
    );
  }
}

