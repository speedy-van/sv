import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/customer-chat/messages
 * Send a message from admin to customer in a customer chat session
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { sessionId, message } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'Session ID and message are required' },
        { status: 400 }
      );
    }

    if (!message.trim()) {
      return NextResponse.json(
        { error: 'Message content cannot be empty' },
        { status: 400 }
      );
    }

    // Verify session exists and is a customer chat
    const session = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        type: 'guest_admin',
        isActive: true,
      },
      include: {
        ChatParticipant: {
          where: {
            role: 'guest',
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Chat session not found or inactive' },
        { status: 404 }
      );
    }

    // Get customer participant info
    const customerParticipant = session.ChatParticipant[0];
    if (!customerParticipant) {
      return NextResponse.json(
        { error: 'Customer participant not found' },
        { status: 404 }
      );
    }

    // Create message from admin
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const newMessage = await prisma.message.create({
      data: {
        id: messageId,
        sessionId: session.id,
        senderId: authResult.id, // Admin user ID
        content: message.trim(),
        type: 'text',
        status: 'sent',
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

    // Send real-time notification to customer via Pusher
    try {
      const pusher = getPusherServer();
      
      // Notify customer channel
      await pusher.trigger(`customer-chat-${session.id}`, 'new-message', {
        message: {
          id: newMessage.id,
          content: newMessage.content,
          senderId: authResult.id,
          senderName: 'Support',
          senderRole: 'admin',
          createdAt: newMessage.createdAt.toISOString(),
          type: newMessage.type,
        },
      });

      console.log('✅ Admin message sent to customer chat');
    } catch (pusherError) {
      console.error('⚠️ Failed to send Pusher notification:', pusherError);
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newMessage.id,
        content: newMessage.content,
        senderId: newMessage.senderId,
        senderName: 'Support',
        senderRole: 'admin',
        createdAt: newMessage.createdAt.toISOString(),
        type: newMessage.type,
      },
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Failed to send admin message to customer chat:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send message',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : 'Unknown error') : undefined
      },
      { status: 500 }
    );
  }
}

