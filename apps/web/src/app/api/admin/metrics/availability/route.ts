import { NextRequest, NextResponse } from 'next/server';
import { availabilityMetrics } from '@/lib/observability/availability-metrics';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/metrics/availability
 * 
 * Returns availability engine metrics for monitoring dashboard
 * Requires admin authentication (to be added)
 */
export async function GET(request: NextRequest) {
  const requestId = `metrics_${Date.now()}`;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const hours = parseInt(searchParams.get('hours') || '24');
    
    if (hours < 1 || hours > 168) {
      return NextResponse.json(
        { error: 'Hours parameter must be between 1 and 168' },
        { status: 400 }
      );
    }

    const metrics = availabilityMetrics.getSummaryMetrics(hours);
    
    logger.info('Metrics requested', {
      hours,
      total_calculations: metrics.availability_calculations.total,
      success_rate: metrics.availability_calculations.success_rate
    }, { requestId });

    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        metadata: {
          time_range_hours: hours,
          generated_at: new Date().toISOString(),
          requestId
        }
      }
    });

  } catch (error) {
    logger.error('Metrics API error', error instanceof Error ? error : new Error('Unknown error'), { requestId });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve metrics',
        requestId
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/metrics/availability
 * 
 * Clear old metrics (housekeeping)
 */
export async function DELETE(request: NextRequest) {
  const requestId = `metrics_cleanup_${Date.now()}`;
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const retentionHours = parseInt(searchParams.get('retention_hours') || '168');
    
    if (retentionHours < 24 || retentionHours > 8760) { // 24 hours to 1 year
      return NextResponse.json(
        { error: 'Retention hours must be between 24 and 8760' },
        { status: 400 }
      );
    }

    availabilityMetrics.clearOldMetrics(retentionHours);
    
    logger.info('Metrics cleanup completed', {
      retention_hours: retentionHours
    }, { requestId });

    return NextResponse.json({
      success: true,
      message: `Metrics older than ${retentionHours} hours have been cleared`,
      requestId
    });

  } catch (error) {
    logger.error('Metrics cleanup error', error instanceof Error ? error : new Error('Unknown error'), { requestId });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to cleanup metrics',
        requestId
      },
      { status: 500 }
    );
  }
}