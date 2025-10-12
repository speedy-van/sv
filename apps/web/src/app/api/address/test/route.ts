/**
 * Test API Route for Dual Provider System
 * Simple test endpoint to verify the system is working
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'test';

    // Test the dual provider service
    const { dualProviderService } = await import('@/lib/dual-provider-service');
    
    const result = await dualProviderService.getAddressSuggestions(query);

    return NextResponse.json({
      success: true,
      test: 'Dual Provider System Test',
      query,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
