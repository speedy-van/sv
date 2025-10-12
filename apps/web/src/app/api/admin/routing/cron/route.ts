/**
 * Auto-Routing Cron Job Endpoint
 * 
 * This endpoint should be called every 10-15 minutes by a cron service
 * (Vercel Cron, AWS Lambda, etc.)
 * 
 * It runs automatic route generation if auto-mode is enabled
 */

import { NextRequest, NextResponse } from 'next/server';
import { routeManager } from '@/lib/orchestration/RouteManager';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds max execution time

/**
 * POST /api/admin/routing/cron
 * Runs auto-routing process
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cron secret' },
        { status: 401 }
      );
    }

    console.log('🔄 Auto-routing cron job triggered');

    // Check if auto-routing is enabled
    const config = await routeManager.getConfig();
    
    if (!config.autoRoutingEnabled) {
      return NextResponse.json({
        success: true,
        message: 'Auto-routing is disabled',
        skipped: true,
      });
    }

    // Run auto-routing
    const result = await routeManager.runAutoRouting('system');

    console.log('✅ Auto-routing completed:', {
      routesCreated: result.routesCreated,
      bookingsProcessed: result.bookingsProcessed,
      duration: result.duration,
    });

    return NextResponse.json({
      success: result.success,
      data: result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Auto-routing cron error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Auto-routing failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/routing/cron
 * Check cron job status and next run time
 */
export async function GET(request: NextRequest) {
  try {
    const config = await routeManager.getConfig();
    const history = await routeManager.getAutoRoutingHistory(10);

    const lastRun = history.find(h => h.eventType === 'auto_routing_completed');
    const nextRun = lastRun
      ? new Date(new Date(lastRun.timestamp).getTime() + config.autoRoutingIntervalMin * 60 * 1000)
      : new Date();

    return NextResponse.json({
      success: true,
      data: {
        enabled: config.autoRoutingEnabled,
        intervalMinutes: config.autoRoutingIntervalMin,
        lastRun: lastRun?.timestamp,
        nextRun: config.autoRoutingEnabled ? nextRun : null,
        recentRuns: history.map(h => ({
          timestamp: h.timestamp,
          result: h.result,
          details: h.details,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cron status' },
      { status: 500 }
    );
  }
}

