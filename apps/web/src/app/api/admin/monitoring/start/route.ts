import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { unassignedOrdersMonitor } from '@/lib/jobs/unassigned-orders-monitor';

export const dynamic = 'force-dynamic';

// POST /api/admin/monitoring/start - Start unassigned orders monitoring
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('🚀 Starting unassigned orders monitor via API...');
    
    await unassignedOrdersMonitor.start();

    return NextResponse.json({
      success: true,
      message: 'Unassigned orders monitoring started successfully',
      monitoringActive: true,
      checkInterval: '5 minutes',
      slaThresholds: {
        normal: '30 minutes',
        high: '15 minutes', 
        urgent: '5 minutes'
      }
    });

  } catch (error) {
    console.error('❌ Error starting monitoring:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start monitoring',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/monitoring/start - Stop monitoring
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('⏹️ Stopping unassigned orders monitor via API...');
    
    unassignedOrdersMonitor.stop();

    return NextResponse.json({
      success: true,
      message: 'Unassigned orders monitoring stopped successfully',
      monitoringActive: false
    });

  } catch (error) {
    console.error('❌ Error stopping monitoring:', error);
    return NextResponse.json(
      { 
        error: 'Failed to stop monitoring',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET /api/admin/monitoring/start - Get monitoring status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Check if monitoring is active (simplified check)
    const isActive = (unassignedOrdersMonitor as any).intervalId !== null;

    return NextResponse.json({
      success: true,
      monitoringActive: isActive,
      checkInterval: '5 minutes',
      slaThresholds: {
        normal: '30 minutes',
        high: '15 minutes', 
        urgent: '5 minutes'
      },
      description: 'Monitors orders without assigned drivers and sends admin alerts for SLA breaches'
    });

  } catch (error) {
    console.error('❌ Error getting monitoring status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get monitoring status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}