import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
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

    // Build query based on role
    const whereClause: any = {
      isActive: true,
    };

    if (userRole === 'driver') {
      // Driver sees only their chats
      whereClause.ChatParticipant = {
        some: {
          userId: userId,
          role: 'driver',
        },
      };
    } else if (userRole === 'admin') {
      // Admin sees all driver-admin chats
      whereClause.type = 'driver_admin';
    }

    const activeChats = await prisma.chatSession.findMany({
      where: whereClause,
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

    // Format chats for frontend
    const formattedChats = activeChats.map((chat) => ({
      id: chat.id,
      type: chat.type,
      title: chat.title,
      isActive: chat.isActive,
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
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
    console.error('❌ Error fetching active chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active chats' },
      { status: 500 }
    );
  }
}

