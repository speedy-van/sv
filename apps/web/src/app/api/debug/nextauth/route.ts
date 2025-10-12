import { NextRequest, NextResponse } from 'next/server';
import { getNextAuthDebugInfo } from '@/lib/nextauth-debug';

export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Debug endpoint only available in development' },
        { status: 403 }
      );
    }

    const debugInfo = await getNextAuthDebugInfo();
    
    return NextResponse.json({
      success: true,
      debug: debugInfo,
    });
  } catch (error) {
    console.error('NextAuth debug error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get debug info',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
