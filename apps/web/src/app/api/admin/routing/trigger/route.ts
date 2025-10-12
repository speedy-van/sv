/**
 * Manual Trigger for Auto-Routing
 * 
 * Allows admin to manually trigger auto-routing process
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { routeManager } from '@/lib/orchestration/RouteManager';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/routing/trigger
 * Manually trigger auto-routing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminId = (session.user as any).id;
    const adminName = session.user.name || 'Admin';

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

