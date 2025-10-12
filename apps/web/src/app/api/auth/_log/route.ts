import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check if request has body
    if (!request.body) {
      return NextResponse.json({ success: true, message: 'No body provided' });
    }

    const body = await request.json();
    
    // Validate the log data
    if (body && typeof body === 'object') {
      console.log('Auth log:', {
        timestamp: new Date().toISOString(),
        data: body,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auth log error:', error);
    
    // Return a more detailed error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process log',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
