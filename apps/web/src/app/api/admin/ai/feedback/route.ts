import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * ✅ Log AI feedback for continuous improvement
 * Tracks thumbs up/down from admins to improve AI responses
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
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
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          actorRole: 'admin',
          action: 'ai_feedback',
          targetType: 'ai_assistant',
          targetId: messageId,
          details: {
            feedback,
            adminEmail,
            timestamp: timestamp || new Date().toISOString(),
            helpful: feedback === 'up'
          },
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

