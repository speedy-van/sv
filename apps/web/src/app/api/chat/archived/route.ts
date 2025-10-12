import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Only admin can view archived chats
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const archivedChats = await prisma.chatSession.findMany({
      where: {
        isActive: false,
        type: 'driver_admin',
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
        User_ChatSession_closedByToUser: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        closedAt: 'desc',
      },
    });

    // Format chats for frontend
    const formattedChats = archivedChats.map((chat) => ({
      id: chat.id,
      type: chat.type,
      title: chat.title,
      isActive: chat.isActive,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
      closedAt: chat.closedAt?.toISOString(),
      closedBy: chat.User_ChatSession_closedByToUser
        ? {
            id: chat.User_ChatSession_closedByToUser.id,
            name:
              chat.User_ChatSession_closedByToUser.role === 'admin'
                ? 'Support'
                : chat.User_ChatSession_closedByToUser.name,
            role: chat.User_ChatSession_closedByToUser.role,
          }
        : null,
      participants: chat.ChatParticipant.filter((p) => p.User).map((p) => ({
        id: p.User!.id,
        name: p.User!.role === 'admin' ? 'Support' : p.User!.name,
        role: p.User!.role,
      })),
      lastMessage: chat.Message[0]
        ? {
            id: chat.Message[0].id,
            content: chat.Message[0].content,
            senderName:
              chat.Message[0].User.role === 'admin'
                ? 'Support'
                : chat.Message[0].User.name || 'Unknown',
            timestamp: chat.Message[0].createdAt.toISOString(),
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      chats: formattedChats,
      total: formattedChats.length,
    });
  } catch (error) {
    console.error('❌ Error fetching archived chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch archived chats' },
      { status: 500 }
    );
  }
}

