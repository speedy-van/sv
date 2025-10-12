/**
 * Route Management API
 * POST /api/routes/optimize - Trigger route optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { RouteOrchestrationService } from '@/lib/services/route-orchestration-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'optimize') {
      // PRE-ROUTE PLANNING: Optimize routes BEFORE driver assignment
      const result = await RouteOrchestrationService.createCapacityAwareRoutes();

      return NextResponse.json({
        success: true,
        data: result,
        message: `✅ Complete route planning: ${result.routes.length} optimized routes with load/unload sequences ready for immediate driver execution`,
        details: {
          planningType: "PRE-ROUTE LOAD/UNLOAD OPTIMIZATION",
          features: [
            "Load operations at pickup locations",
            "Unload operations at dropoff locations",
            "Distance-optimized sequences",
            "Capacity-aware planning (1000kg, 10m³)",
            "10-15 operations per route"
          ],
          readyForExecution: true
        }
      });
    }

    if (body.action === 'optimize-legacy') {
      // Fallback to legacy routing if needed
      const result = await RouteOrchestrationService.createRoutesFromPendingDrops();

      return NextResponse.json({
        success: true,
        data: result,
        message: 'Created routes using legacy optimization'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "optimize" for capacity-aware routing or "optimize-legacy" for basic routing' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Route optimization error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}