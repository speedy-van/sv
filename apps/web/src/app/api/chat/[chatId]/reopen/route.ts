import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    // Only admin can reopen chats
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { chatId } = params;

    // Verify chat session exists
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: chatId },
      include: {
        ChatParticipant: {
          include: {
            User: {
              select: {
                id: true,
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

    // Reopen the chat session
    const updatedSession = await prisma.chatSession.update({
      where: { id: chatId },
      data: {
        isActive: true,
        closedAt: null,
        closedBy: null,
        updatedAt: new Date(),
      },
    });

    // Send notification via Pusher to all participants
    try {
      const pusher = getPusherServer();

      // Notify driver participants
      for (const participant of chatSession.ChatParticipant) {
        if (participant.role === 'driver' && participant.userId) {
          await pusher.trigger(`driver-${participant.userId}`, 'chat_reopened', {
            chatId,
            reopenedBy: 'admin',
            message: 'Support has reopened this conversation',
            timestamp: new Date().toISOString(),
          });

          console.log(`📤 Chat reopened notification sent to driver ${participant.userId}`);
        }
      }

      // Notify admin channel
      await pusher.trigger('admin-chat', 'chat_reopened', {
        chatId,
        reopenedBy: 'admin',
        timestamp: new Date().toISOString(),
      });
    } catch (pusherError) {
      console.error('❌ Pusher notification failed:', pusherError);
    }

    return NextResponse.json({
      success: true,
      message: 'Chat reopened successfully',
      chatSession: {
        id: updatedSession.id,
        isActive: updatedSession.isActive,
        closedAt: updatedSession.closedAt,
        closedBy: updatedSession.closedBy,
      },
    });
  } catch (error) {
    console.error('❌ Error reopening chat:', error);
    return NextResponse.json(
      { error: 'Failed to reopen chat' },
      { status: 500 }
    );
  }
}

