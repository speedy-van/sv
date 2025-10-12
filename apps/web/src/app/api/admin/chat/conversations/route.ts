import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Fetch all active chat sessions with driver-admin conversations
    const chatSessions = await prisma.chatSession.findMany({
      where: {
        type: 'driver_admin',
        isActive: true,
      },
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
        Message: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
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
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Format conversations for frontend
    const conversations = chatSessions.map((session) => {
      const lastMessage = session.Message[0];
      const participants = session.ChatParticipant.filter((p) => p.User).map((p) => ({
        id: p.User!.id,
        name: p.User!.name || 'Unknown',
        role: p.User!.role,
      }));

      // Count unread messages (messages not read by admin)
      // For now, set to 0 as we don't have read tracking yet
      const unreadCount = 0;

      return {
        id: session.id,
        participants,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              senderId: lastMessage.senderId,
              senderName: lastMessage.User.name || 'Unknown',
              senderRole: lastMessage.User.role,
              message: lastMessage.content,
              timestamp: lastMessage.createdAt.toISOString(),
              read: true,
            }
          : null,
        unreadCount,
        updatedAt: session.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      conversations: conversations.filter((c) => c.lastMessage !== null),
      total: conversations.length,
    });
  } catch (error) {
    console.error('Admin chat conversations GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
