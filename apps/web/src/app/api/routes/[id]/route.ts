/**
 * Individual Route API Routes
 * GET /api/routes/[id] - Get route details
 * PUT /api/routes/[id] - Assign route to driver
 */

import { NextRequest, NextResponse } from 'next/server';
import { RouteOrchestrationService } from '@/lib/services/route-orchestration-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routeId = params.id;
    
    if (!routeId) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      );
    }

    const route = await RouteOrchestrationService.getRoute(routeId);

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: route
    });

  } catch (error) {
    console.error('Route retrieval error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routeId = params.id;
    const body = await request.json();
    
    if (!routeId) {
      return NextResponse.json(
        { error: 'Route ID is required' },
        { status: 400 }
      );
    }

    if (body.action === 'assign') {
      const { driverId } = body;
      
      if (!driverId) {
        return NextResponse.json(
          { error: 'Driver ID is required for assignment' },
          { status: 400 }
        );
      }

      const assignment = await RouteOrchestrationService.assignRoute(routeId, driverId);

      return NextResponse.json({
        success: true,
        data: assignment
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "assign"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Route assignment error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}