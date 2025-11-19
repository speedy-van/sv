import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // Log the logout event
    await logAudit(session.user.id, 'driver_logout', session.user.id, {
      targetType: 'auth',
      before: { email: session.user.email, role: (session.user as any).role },
      after: null
    });

    console.log('✅ Driver logout successful:', {
      userId: session.user.id,
      email: session.user.email
    });

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Driver logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
