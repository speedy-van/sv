import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/customer/chat/messages
 * Get messages for a customer chat session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const customerEmail = searchParams.get('customerEmail');

    if (!sessionId || !customerEmail) {
      return NextResponse.json(
        { error: 'Session ID and customer email are required' },
        { status: 400 }
      );
    }

    // Verify session exists and customer is a participant
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        ChatParticipant: {
          some: {
            guestEmail: customerEmail,
          },
        },
      },
      include: {
        Message: {
          orderBy: { createdAt: 'asc' },
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
        ChatParticipant: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found or unauthorized' },
        { status: 404 }
      );
    }

    // Format messages for frontend
    const messages = session.Message.map((msg) => {
      // Check if this is a guest message (stored in metadata)
      const metadata = msg.metadata as any;
      const isGuestMessage = metadata?.isGuestMessage === true;

      if (isGuestMessage) {
        // Return guest message info
        return {
          id: msg.id,
          content: msg.content,
          senderId: metadata?.actualSender || metadata?.guestEmail || 'customer',
          senderName: metadata?.guestName || 'Customer',
          senderRole: 'customer' as const,
          createdAt: msg.createdAt.toISOString(),
          readAt: msg.readAt?.toISOString(),
          type: msg.type,
        };
      } else {
        // Return admin message info
        return {
          id: msg.id,
          content: msg.content,
          senderId: msg.senderId || 'system',
          senderName: msg.User?.name || 'Support',
          senderRole: (msg.User?.role || 'admin') as 'admin' | 'customer' | 'driver',
          createdAt: msg.createdAt.toISOString(),
          readAt: msg.readAt?.toISOString(),
          type: msg.type,
        };
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        messages,
        isActive: session.isActive,
      },
    });
  } catch (error) {
    console.error('Failed to get customer chat messages:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get messages',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customer/chat/messages
 * Send a message from customer to admin
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, customerEmail, content } = body;

    if (!sessionId || !customerEmail || !content) {
      return NextResponse.json(
        { error: 'Session ID, customer email, and message content are required' },
        { status: 400 }
      );
    }

    if (!content.trim()) {
      return NextResponse.json(
        { error: 'Message content cannot be empty' },
        { status: 400 }
      );
    }

    // Verify session exists and customer is a participant
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        isActive: true,
        ChatParticipant: {
          some: {
            guestEmail: customerEmail,
            role: 'guest',
          },
        },
      },
      include: {
        ChatParticipant: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get customer participant info
    const customerParticipant = session.ChatParticipant.find(
      (p) => p.guestEmail === customerEmail && p.role === 'guest'
    );

    if (!customerParticipant) {
      return NextResponse.json(
        { error: 'Customer participant not found' },
        { status: 404 }
      );
    }

    // For guest messages, we need a system user to act as the sender
    // Find or create a system support user
    let systemUser = await prisma.user.findFirst({
      where: {
        email: 'support@speedy-van.co.uk',
      },
    });

    if (!systemUser) {
      // Create system support user if it doesn't exist
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash('SystemPassword123!', 10);
      
      systemUser = await prisma.user.create({
        data: {
          email: 'support@speedy-van.co.uk',
          name: 'Support System',
          role: 'admin',
          password: hashedPassword,
          emailVerified: true,
        },
      });
    }

    // Create message with metadata to indicate it's from a guest
    // The actual sender info is stored in metadata
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const message = await prisma.message.create({
      data: {
        id: messageId,
        sessionId: session.id,
        senderId: systemUser.id, // Use system user as sender (required by schema)
        content: content.trim(),
        type: 'text',
        status: 'sent',
        metadata: {
          guestName: customerParticipant.guestName,
          guestEmail: customerParticipant.guestEmail,
          isGuestMessage: true,
          actualSender: customerParticipant.guestEmail,
        },
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    // Update participant last read (optional)
    await prisma.chatParticipant.update({
      where: { id: customerParticipant.id },
      data: { lastReadAt: new Date() },
    });

    // Send real-time notification to admin via Pusher
    try {
      const pusher = getPusherServer();
      
      // Notify admin channel
      await pusher.trigger('admin-notifications', 'customer-chat-message', {
        type: 'customer-chat-message',
        data: {
          sessionId: session.id,
          messageId: message.id,
          customerName: customerParticipant.guestName,
          customerEmail: customerParticipant.guestEmail,
          message: content.trim(),
          timestamp: message.createdAt.toISOString(),
        },
      });

      // Also notify the specific chat session channel
      await pusher.trigger(`customer-chat-${session.id}`, 'new-message', {
        message: {
          id: message.id,
          content: message.content,
          senderId: customerParticipant.guestEmail,
          senderName: customerParticipant.guestName || 'Customer',
          senderRole: 'customer',
          createdAt: message.createdAt.toISOString(),
          type: message.type,
        },
      });

      console.log('✅ Customer chat message notifications sent');
    } catch (pusherError) {
      console.error('⚠️ Failed to send customer chat notifications:', pusherError);
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        content: message.content,
        senderId: customerParticipant.guestEmail,
        senderName: customerParticipant.guestName || 'Customer',
        senderRole: 'customer',
        createdAt: message.createdAt.toISOString(),
        type: message.type,
      },
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Failed to send customer chat message:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}

