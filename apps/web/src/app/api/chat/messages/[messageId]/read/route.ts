import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { getPusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    let userRole: string;

    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      userRole = bearerAuth.user.role;
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = session.user.id;
      userRole = (session.user as any).role;
    }

    const { messageId } = params;

    // Find message and its chat session
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        ChatSession: {
          include: {
            ChatParticipant: true,
          },
        },
        User: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Don't mark own messages as read
    if (message.senderId === userId) {
      return NextResponse.json({
        success: true,
        message: 'Own message',
      });
    }

    // Update message status to "read" if it's currently "delivered"
    // Note: In current schema, we don't have "read" status, but we can use metadata
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        metadata: {
          ...(message.metadata as any),
          readBy: userId,
          readAt: new Date().toISOString(),
        },
      },
    });

    // Send read receipt via Pusher to sender
    try {
      const pusher = getPusherServer();
      const senderRole = message.User.role;
      const senderChannelName =
        senderRole === 'driver'
          ? `driver-${message.senderId}`
          : 'admin-chat';

      await pusher.trigger(senderChannelName, 'message_read', {
        messageId,
        chatId: message.sessionId,
        readBy: userId,
        readByRole: userRole,
        readAt: new Date().toISOString(),
      });

      console.log(`✅ Read receipt sent for message ${messageId}`);
    } catch (pusherError) {
      console.error('❌ Pusher read receipt failed:', pusherError);
    }

    return NextResponse.json({
      success: true,
      message: 'Message marked as read',
    });
  } catch (error) {
    console.error('❌ Error marking message as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}

