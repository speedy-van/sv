import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { getPusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';

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
    const { isTyping } = body;

    // Get chat session to find other participants
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
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    // Send typing indicator to other participants
    const pusher = getPusherServer();

    for (const participant of chatSession.ChatParticipant) {
      if (participant.userId && participant.userId !== userId) {
        const channelName =
          participant.role === 'driver'
            ? `driver-${participant.userId}`
            : 'admin-chat';

        await pusher.trigger(channelName, 'typing_indicator', {
          chatId,
          userId,
          userRole,
          userName: userRole === 'admin' ? 'Support' : 'Driver',
          isTyping,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Typing indicator sent',
    });
  } catch (error) {
    console.error('❌ Error sending typing indicator:', error);
    return NextResponse.json(
      { error: 'Failed to send typing indicator' },
      { status: 500 }
    );
  }
}

