import { NextRequest, NextResponse } from 'next/server';
import { getCustomSession } from '@/lib/custom-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Session endpoint that works with both NextAuth and Custom Auth
 * This ensures compatibility with existing code that calls /api/auth/session
 */
export async function GET(request: NextRequest) {
  try {
    console.log('📍 /api/auth/session endpoint called');
    
    const customSession = await getCustomSession();

    if (!customSession) {
      console.log('❌ No custom session found');
      return NextResponse.json({ session: null, user: null });
    }

    console.log('✅ Custom session found:', {
      userId: customSession.user.id,
      email: customSession.user.email,
      role: customSession.user.role,
    });

    // Return in NextAuth-compatible format
    return NextResponse.json({
      user: customSession.user,
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    });
  } catch (error) {
    console.error('❌ Session check failed:', error);
    return NextResponse.json({ session: null, user: null });
  }
}
