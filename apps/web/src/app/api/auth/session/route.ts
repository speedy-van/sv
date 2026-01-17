import { NextRequest, NextResponse } from 'next/server';
import { getCustomSession } from '@/lib/custom-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Session endpoint that works with both NextAuth and Custom Auth
 * This ensures compatibility with existing code that calls /api/auth/session
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📍 /api/auth/session endpoint called');
    
    // Try custom session first
    const customSession = await getCustomSession();
    if (customSession) {
      console.log('✅ Custom session found:', {
        userId: customSession.user.id,
        email: customSession.user.email,
        role: customSession.user.role,
      });

      // Return in NextAuth-compatible format
      return NextResponse.json({
        user: customSession.user,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Fallback to NextAuth session
    const nextAuthSession = await getServerSession(authOptions);
    if (nextAuthSession) {
      console.log('✅ NextAuth session found');
      return NextResponse.json(nextAuthSession, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // No session found
    console.log('❌ No session found');
    return NextResponse.json(
      { user: null, expires: null },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('❌ Session check failed:', error);
    return NextResponse.json(
      { user: null, expires: null, error: 'Session check failed' },
      {
        status: 200, // Return 200 even on error to prevent retry loops
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}
