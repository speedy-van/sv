import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/customer/chat/sessions
 * Create a new customer chat session (for unauthenticated guests)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, customerPhone } = body;

    // Validate required fields - check for existence and non-empty strings
    if (!customerName || !customerEmail || 
        typeof customerName !== 'string' || typeof customerEmail !== 'string' ||
        customerName.trim() === '' || customerEmail.trim() === '') {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if there's an active session for this guest
    const existingSession = await prisma.chatSession.findFirst({
      where: {
        type: 'guest_admin',
        isActive: true,
        ChatParticipant: {
          some: {
            guestEmail: customerEmail,
          },
        },
      },
      include: {
        ChatParticipant: true,
        Message: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (existingSession) {
      // Return existing session
      return NextResponse.json({
        success: true,
        data: {
          sessionId: existingSession.id,
          type: existingSession.type,
          isActive: existingSession.isActive,
          createdAt: existingSession.createdAt,
        },
        message: 'Existing session found',
      });
    }

    // Create new chat session for guest customer
    const sessionId = `customer-chat-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const chatSession = await prisma.chatSession.create({
      data: {
        id: sessionId,
        type: 'guest_admin',
        title: `Customer Support - ${customerName}`,
        isActive: true,
        ChatParticipant: {
          create: {
            guestName: customerName,
            guestEmail: customerEmail,
            role: 'guest',
          },
        },
      },
      include: {
        ChatParticipant: true,
      },
    });

    // Notify admin about new customer chat session
    try {
      const pusher = getPusherServer();
      await pusher.trigger('admin-notifications', 'customer-chat-started', {
        type: 'customer-chat-started',
        data: {
          sessionId: chatSession.id,
          customerName,
          customerEmail,
          customerPhone: customerPhone || null,
          timestamp: new Date().toISOString(),
        },
      });
      console.log('✅ Customer chat notification sent to admin');
    } catch (pusherError) {
      console.error('⚠️ Failed to send customer chat notification:', pusherError);
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json({
      success: true,
      data: {
        sessionId: chatSession.id,
        type: chatSession.type,
        isActive: chatSession.isActive,
        createdAt: chatSession.createdAt,
      },
      message: 'Chat session created successfully',
    });
  } catch (error) {
    console.error('Failed to create customer chat session:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create chat session',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}

