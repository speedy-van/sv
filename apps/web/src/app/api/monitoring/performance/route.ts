/**
 * Performance Monitoring API Endpoint
 * Provides real-time system metrics and health status
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getCurrentMetrics, getHealthStatus, getActiveAlerts, recordAPIRequest } from '@/lib/monitoring/performance-monitor';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'overview';
    
    let response: any;
    
    switch (type) {
      case 'metrics':
        response = {
          current: getCurrentMetrics(),
          timestamp: new Date().toISOString()
        };
        break;
        
      case 'health':
        response = getHealthStatus();
        break;
        
      case 'alerts':
        const activeOnly = url.searchParams.get('active') === 'true';
        response = activeOnly ? getActiveAlerts() : getActiveAlerts();
        break;
        
      case 'overview':
      default:
        response = {
          health: getHealthStatus(),
          metrics: getCurrentMetrics(),
          alerts: getActiveAlerts(),
          timestamp: new Date().toISOString()
        };
        break;
    }
    
    const responseTime = Date.now() - startTime;
    recordAPIRequest(responseTime, false);
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${responseTime}ms`
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    recordAPIRequest(responseTime, true);
    
    console.error('Performance monitoring API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch performance metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

