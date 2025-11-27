import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { createAuditLogEntry } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * ✅ Log AI feedback for continuous improvement
 * Tracks thumbs up/down from admins to improve AI responses
 */
export async function POST(request: NextRequest) {
  try {
    // Try custom session first
    const customSession = await getCustomSession();
    let isAdmin = customSession?.user?.role === 'admin';
    let userId = customSession?.user?.id;
    
    if (!customSession?.user) {
      // Fallback to NextAuth
      const session = await getServerSession(authOptions);
      isAdmin = (session?.user as any)?.role === 'admin';
      userId = session?.user?.id;
      if (!session?.user || !isAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 401 }
        );
      }
    }
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { messageId, feedback, adminEmail, timestamp } = body;

    if (!messageId || !feedback || (feedback !== 'up' && feedback !== 'down')) {
      return NextResponse.json(
        { error: 'Invalid feedback data' },
        { status: 400 }
      );
    }

    // Log feedback in audit trail
    try {
      const ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ??
        null;

      await createAuditLogEntry({
        actorId: userId || 'unknown',
        actorRole: 'admin',
        action: 'AI_FEEDBACK_RECORDED',
        targetType: 'ai_assistant',
        targetId: messageId,
        ipAddress,
        details: {
          feedback,
          adminEmail,
          timestamp: timestamp || new Date().toISOString(),
          helpful: feedback === 'up',
        },
      });

      console.log(`✅ AI Feedback logged: ${feedback} from ${adminEmail}`);
    } catch (auditError) {
      console.warn('Failed to log AI feedback in audit:', auditError);
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error logging AI feedback:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to log feedback',
      },
      { status: 500 }
    );
  }
}

