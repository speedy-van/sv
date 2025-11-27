/**
 * Auto Route Scheduler Control API
 * Start, stop, and monitor the automatic route creation scheduler
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { autoRouteScheduler } from '@/lib/services/auto-route-scheduler';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/routes/scheduler
 * Get scheduler status and stats
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Scheduler API called');

    // Try custom session first
    const customSession = await getCustomSession();
    let isAdmin = customSession?.user?.role === 'admin';
    console.log('🔐 Custom session:', { hasSession: !!customSession, isAdmin });
    
    if (!customSession?.user) {
      const session = await getServerSession(authOptions);
      isAdmin = (session?.user as any)?.role === 'admin';
      console.log('🔐 NextAuth session:', { hasSession: !!session, isAdmin });
      if (!session?.user || !isAdmin) {
        console.log('🚫 Unauthorized access attempt');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    if (!isAdmin) {
      console.log('🚫 Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Authorization passed');

    const stats = autoRouteScheduler.getStats();
    const isRunning = autoRouteScheduler.isRunning();

    console.log('🔄 Scheduler status retrieved:', { isRunning, stats });

    return NextResponse.json({
      success: true,
      scheduler: {
        enabled: isRunning,
        stats,
      }
    });

  } catch (error) {
    console.error('❌ Scheduler GET error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'Unknown error');
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get scheduler status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/routes/scheduler
 * Control scheduler (start, stop, trigger)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    let message = '';

    switch (action) {
      case 'start':
        autoRouteScheduler.start();
        message = 'Scheduler started successfully';
        break;

      case 'stop':
        autoRouteScheduler.stop();
        message = 'Scheduler stopped successfully';
        break;

      case 'trigger':
        await autoRouteScheduler.triggerNow();
        message = 'Manual route creation triggered';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, stop, or trigger' },
          { status: 400 }
        );
    }

    await logAudit(
      (session.user as any).id,
      'scheduler_control',
      undefined,
      { 
        targetType: 'scheduler', 
        action,
        timestamp: new Date().toISOString(),
      }
    );

    return NextResponse.json({
      success: true,
      message,
      stats: autoRouteScheduler.getStats(),
    });

  } catch (error) {
    console.error('❌ Scheduler POST error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to control scheduler',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}



