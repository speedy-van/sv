import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    let userRole: string;

    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      userRole = bearerAuth.user.role;
      console.log('🔑 Bearer token authenticated:', userId, userRole);
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

    const { chatId } = params;
    const body = await request.json();
    const { reason } = body;

    // Verify chat session exists
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: chatId },
      include: {
        ChatParticipant: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Check authorization
    const isParticipant = chatSession.ChatParticipant.some(
      (p) => p.userId === userId
    );

    if (!isParticipant && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to close this chat' },
        { status: 403 }
      );
    }

    // Close the chat session
    const updatedSession = await prisma.chatSession.update({
      where: { id: chatId },
      data: {
        isActive: false,
        closedAt: new Date(),
        closedBy: userId,
        updatedAt: new Date(),
      },
    });

    // Send notification via Pusher to all participants
    try {
      const pusher = getPusherServer();

      // Notify each participant
      for (const participant of chatSession.ChatParticipant) {
        if (participant.userId && participant.userId !== userId) {
          const channelName =
            participant.role === 'driver'
              ? `driver-${participant.userId}`
              : `admin-chat`;

          await pusher.trigger(channelName, 'chat_closed', {
            chatId,
            closedBy: userRole,
            closedByName: userRole === 'admin' ? 'Support' : 'Driver',
            reason: reason || 'Chat resolved',
            timestamp: new Date().toISOString(),
          });

          console.log(`📤 Chat closed notification sent to ${participant.role}`);
        }
      }
    } catch (pusherError) {
      console.error('❌ Pusher notification failed:', pusherError);
    }

    return NextResponse.json({
      success: true,
      message: 'Chat closed successfully',
      chatSession: {
        id: updatedSession.id,
        isActive: updatedSession.isActive,
        closedAt: updatedSession.closedAt,
        closedBy: updatedSession.closedBy,
      },
    });
  } catch (error) {
    console.error('❌ Error closing chat:', error);
    return NextResponse.json(
      { error: 'Failed to close chat' },
      { status: 500 }
    );
  }
}

