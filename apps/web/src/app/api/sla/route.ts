import { NextRequest, NextResponse } from 'next/server';
import { slaMonitor } from '@/lib/telemetry/sla-monitor';

export async function GET(request: NextRequest) {
  try {
    const slaStatus = slaMonitor.getSLAStatus();
    
    return NextResponse.json({
      success: true,
      data: slaStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to get SLA status:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve SLA status',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}


