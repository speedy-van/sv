/**
 * Cost Analytics API Route
 * Provides real-time cost monitoring and optimization metrics for dual provider system
 */

import { NextRequest, NextResponse } from 'next/server';
import { costOptimizer } from '@/lib/cost-optimizer';

export async function GET(request: NextRequest) {
  try {
    // Get comprehensive cost analytics
    const analytics = costOptimizer.getCostAnalytics();
    
    return NextResponse.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cost analytics API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve cost analytics',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, config } = body;

    if (action === 'updateConfig') {
      // Update cost optimization configuration
      costOptimizer.updateConfig(config);
      
      return NextResponse.json({
        success: true,
        message: 'Cost optimization configuration updated',
        newConfig: config,
        timestamp: new Date().toISOString(),
      });
    } else if (action === 'reset') {
      // Reset cost metrics (for testing/debugging)
      costOptimizer.reset();
      
      return NextResponse.json({
        success: true,
        message: 'Cost metrics reset',
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action',
          supportedActions: ['updateConfig', 'reset'],
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Cost analytics API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}