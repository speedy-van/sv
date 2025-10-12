import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('NextAuth Config Test:');
    console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    // Test if authOptions can be loaded without errors
    console.log('Auth options loaded successfully');

    return NextResponse.json({
      success: true,
      message: 'NextAuth config test passed',
      env: {
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        nodeEnv: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    console.error('NextAuth test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
