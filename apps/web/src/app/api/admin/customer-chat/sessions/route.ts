import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/customer-chat/sessions
 * Get all customer chat sessions (guest_admin type)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'active'; // active, closed, all

    // Build where clause
    const where: any = {
      type: 'guest_admin',
    };

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'closed') {
      where.isActive = false;
    }
    // If status is 'all', don't filter by isActive

    // Fetch all customer chat sessions
    const chatSessions = await prisma.chatSession.findMany({
      where,
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
      const guestParticipant = session.ChatParticipant.find((p) => p.role === 'guest');
      const adminParticipant = session.ChatParticipant.find((p) => p.role === 'admin' && p.User);

      // Get customer info from guest participant
      const customerName = guestParticipant?.guestName || 'Guest Customer';
      const customerEmail = guestParticipant?.guestEmail || '';

      // Count unread messages (messages not read by admin)
      // For now, we'll check if admin has read the last message
      const unreadCount = 0; // TODO: Implement proper read tracking

      return {
        id: session.id,
        type: session.type,
        title: session.title,
        customerName,
        customerEmail,
        participants: adminParticipant
          ? [
              {
                id: adminParticipant.User!.id,
                name: adminParticipant.User!.name || 'Support',
                role: adminParticipant.User!.role,
              },
            ]
          : [],
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              senderId: lastMessage.senderId,
              senderName: (lastMessage.metadata as any)?.isGuestMessage
                ? (lastMessage.metadata as any)?.guestName || customerName
                : lastMessage.User?.name || 'Support',
              senderRole: (lastMessage.metadata as any)?.isGuestMessage ? 'customer' : (lastMessage.User?.role || 'admin'),
              message: lastMessage.content,
              timestamp: lastMessage.createdAt.toISOString(),
              read: !!lastMessage.readAt,
            }
          : null,
        unreadCount,
        isActive: session.isActive,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        closedAt: session.closedAt?.toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        conversations: conversations.filter((c) => c.lastMessage !== null),
        total: conversations.length,
      },
    });
  } catch (error) {
    console.error('Admin customer chat sessions GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}

