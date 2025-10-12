/**
 * Chat Sessions API
 * 
 * Handles creation and retrieval of chat sessions between:
 * - Driver ↔ Admin
 * - Customer ↔ Driver
 * - Customer ↔ Admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat/sessions
 * Get all chat sessions for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Try Bearer token authentication first (for mobile apps)
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
      userId = (session.user as any).id;
      userRole = (session.user as any).role;
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const isActive = searchParams.get('isActive');

    // Build where clause
    const whereClause: any = {
      ChatParticipant: {
        some: {
          userId: userId,
        },
      },
    };

    if (bookingId) {
      whereClause.bookingId = bookingId;
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }

    // Get chat sessions
    const sessions = await prisma.chatSession.findMany({
      where: whereClause,
      include: {
        ChatParticipant: {
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
        },
        Message: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            type: true,
            status: true,
            createdAt: true,
            senderId: true,
            readAt: true,
          },
        },
        Booking: {
          select: {
            id: true,
            reference: true,
            customerName: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Calculate unread count for each session
    const sessionsWithUnread = await Promise.all(
      sessions.map(async (session) => {
        const participant = session.ChatParticipant.find(p => p.userId === userId);
        const lastReadAt = participant?.lastReadAt;

        const unreadCount = await prisma.message.count({
          where: {
            sessionId: session.id,
            senderId: { not: userId },
            createdAt: lastReadAt ? { gt: lastReadAt } : undefined,
          },
        });

        return {
          ...session,
          unreadCount,
          lastMessage: session.Message[0] || null,
        };
      })
    );

    logger.info('Chat sessions retrieved', {
      userId,
      userRole,
      sessionCount: sessions.length,
    });

    return NextResponse.json({
      success: true,
      data: sessionsWithUnread,
    });

  } catch (error) {
    logger.error('Failed to get chat sessions', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to get chat sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/sessions
 * Create a new chat session
 */
export async function POST(request: NextRequest) {
  try {
    // Try Bearer token authentication first (for mobile apps)
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
      userId = (session.user as any).id;
      userRole = (session.user as any).role;
    }

    const body = await request.json();
    const { type, title, bookingId, participantIds } = body;

    // Validate input
    if (!type || !['customer_driver', 'customer_admin', 'driver_admin', 'support'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid session type' },
        { status: 400 }
      );
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one participant is required' },
        { status: 400 }
      );
    }

    // Check if session already exists for this booking and participants
    if (bookingId) {
      const existingSession = await prisma.chatSession.findFirst({
        where: {
          bookingId,
          type,
          isActive: true,
          ChatParticipant: {
            every: {
              userId: { in: [...participantIds, userId] },
            },
          },
        },
        include: {
          ChatParticipant: true,
        },
      });

      if (existingSession) {
        logger.info('Returning existing chat session', {
          sessionId: existingSession.id,
          bookingId,
        });

        return NextResponse.json({
          success: true,
          data: existingSession,
          message: 'Session already exists',
        });
      }
    }

    // Create new chat session
    const chatSession = await prisma.chatSession.create({
      data: {
        type,
        title: title || `${type.replace('_', ' ')} chat`,
        bookingId,
        createdBy: userId,
        ChatParticipant: {
          create: [
            {
              userId: userId,
              role: userRole as any,
            },
            ...participantIds.map((participantId: string) => ({
              userId: participantId,
              role: 'admin' as any, // Default to admin, can be updated
            })),
          ],
        },
      },
      include: {
        ChatParticipant: {
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
        },
        Booking: {
          select: {
            id: true,
            reference: true,
            customerName: true,
          },
        },
      },
    });

    logger.info('Chat session created', {
      sessionId: chatSession.id,
      type,
      bookingId,
      createdBy: userId,
    });

    return NextResponse.json({
      success: true,
      data: chatSession,
      message: 'Chat session created successfully',
    });

  } catch (error) {
    logger.error('Failed to create chat session', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to create chat session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

