/**
 * Routing Settings Management API
 * 
 * Admin endpoints to control routing mode (Auto/Manual) and configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { routeManager } from '@/lib/orchestration/RouteManager';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/routing/settings
 * Get current routing configuration
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const config = await routeManager.getConfig();

    return NextResponse.json({
      success: true,
      data: config,
    });

  } catch (error) {
    console.error('❌ Get routing settings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routing settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/routing/settings
 * Update routing configuration
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const adminUser = authResult;

    const body = await request.json();
    const result = await routeManager.updateConfig(body, adminUser.id);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: await routeManager.getConfig(),
    });

  } catch (error) {
    console.error('❌ Update routing settings error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/routing/settings/mode
 * Toggle routing mode (Auto/Manual)
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const adminUser = authResult;

    const { mode } = await request.json();
    
    if (!mode || !['auto', 'manual'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "auto" or "manual"' },
        { status: 400 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    const result = await routeManager.setRoutingMode(
      mode,
      adminUser.id,
      ipAddress,
    );

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        newMode: mode,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('❌ Toggle routing mode error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to change mode' },
      { status: 500 }
    );
  }
}

