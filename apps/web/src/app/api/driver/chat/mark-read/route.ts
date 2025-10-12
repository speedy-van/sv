import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;

    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      const sessionUser = session.user as any;
      if (sessionUser.role !== 'driver') {
        return NextResponse.json(
          { error: 'Forbidden - Driver access required' },
          { status: 403 }
        );
      }

      userId = session.user.id;
    }

    const { messageId, sessionId } = await request.json();

    if (!messageId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, sessionId' },
        { status: 400 }
      );
    }

    // Update message read status
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { 
        status: 'read'
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Notify admin that message was read via Pusher
    try {
      const pusher = getPusherServer();
      await pusher.trigger('admin-chat', 'message_read', {
        messageId: updatedMessage.id,
        sessionId,
        readAt: new Date().toISOString(),
        readBy: userId
      });
      
      console.log(`✅ Sent read receipt for message ${messageId} to admin`);
    } catch (pusherError) {
      console.error('❌ Pusher read receipt failed:', pusherError);
    }

    return NextResponse.json({
      success: true,
      message: 'Message marked as read'
    });

  } catch (error) {
    console.error('Mark message as read error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

