/**
 * Chat Messages API
 * 
 * Handles sending and receiving messages in chat sessions
 * Supports text, images, files, and location messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import Pusher from 'pusher';

// Initialize Pusher for real-time messaging
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/messages?sessionId=xxx
 * Get messages for a chat session
 */
export async function GET(request: NextRequest) {
  try {
    // Try Bearer token authentication first (for mobile apps)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = (session.user as any).id;
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Cursor for pagination

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Verify user is participant in this session
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        sessionId,
        userId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Not authorized to access this session' },
        { status: 403 }
      );
    }

    // Build where clause for pagination
    const whereClause: any = {
      sessionId,
    };

    if (before) {
      whereClause.createdAt = {
        lt: new Date(before),
      };
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    // Update last read timestamp
    await prisma.chatParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        sessionId,
        senderId: { not: userId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: 'read',
      },
    });

    logger.info('Chat messages retrieved', {
      userId,
      sessionId,
      messageCount: messages.length,
    });

    return NextResponse.json({
      success: true,
      data: messages.reverse(), // Return in chronological order
      hasMore: messages.length === limit,
      cursor: messages.length > 0 ? messages[messages.length - 1].createdAt.toISOString() : null,
    });

  } catch (error) {
    logger.error('Failed to get chat messages', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to get chat messages',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/messages
 * Send a new message
 */
export async function POST(request: NextRequest) {
  try {
    // Try Bearer token authentication first (for mobile apps)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    let userName: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      userName = bearerAuth.user.name || 'Driver';
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = (session.user as any).id;
      userName = session.user.name || 'User';
    }

    const body = await request.json();
    const { sessionId, content, type = 'text', metadata } = body;

    // Validate input
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (!['text', 'image', 'file', 'location', 'system'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid message type' },
        { status: 400 }
      );
    }

    // Verify user is participant in this session
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        sessionId,
        userId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Not authorized to send messages in this session' },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        sessionId,
        senderId: userId,
        content: content.trim(),
        type: type as any,
        status: 'sent',
        metadata: metadata || {},
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    // Send real-time notification via Pusher
    try {
      await pusher.trigger(`chat-${sessionId}`, 'new-message', {
        message: {
          id: message.id,
          content: message.content,
          type: message.type,
          senderId: message.senderId,
          senderName: userName,
          createdAt: message.createdAt.toISOString(),
          metadata: message.metadata,
        },
      });

      // Get other participants for push notifications
      const otherParticipants = await prisma.chatParticipant.findMany({
        where: {
          sessionId,
          userId: { not: userId },
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Send push notifications to other participants
      for (const participant of otherParticipants) {
        if (participant.userId) {
          // Create notification in database
          await prisma.driverNotification.create({
            data: {
              driverId: participant.userId,
              type: 'chat_message',
              title: `New message from ${userName}`,
              message: content.substring(0, 100),
              read: false,
              metadata: {
                sessionId,
                messageId: message.id,
              },
            },
          }).catch(() => {
            // Ignore if driver notification fails (user might not be a driver)
          });
        }
      }

      logger.info('Real-time notification sent', {
        sessionId,
        messageId: message.id,
      });
    } catch (pusherError) {
      logger.error('Failed to send real-time notification', pusherError as Error);
      // Continue even if Pusher fails
    }

    logger.info('Chat message sent', {
      userId,
      sessionId,
      messageId: message.id,
      type,
    });

    return NextResponse.json({
      success: true,
      data: message,
      message: 'Message sent successfully',
    });

  } catch (error) {
    logger.error('Failed to send chat message', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to send chat message',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

