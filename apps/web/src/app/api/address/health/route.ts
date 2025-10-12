/**
 * Provider Health Monitoring API Route
 * Returns real-time health metrics for both providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { dualProviderService } from '@/lib/dual-provider-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const health = dualProviderService.getServiceHealth();

    return NextResponse.json({
      success: true,
      data: health,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health monitoring API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'network',
          message: 'Failed to retrieve health metrics',
          provider: 'google',
          originalError: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now(),
        },
      },
      { status: 500 }
    );
  }
}
