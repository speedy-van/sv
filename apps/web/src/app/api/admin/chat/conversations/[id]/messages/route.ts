import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: conversationId } = await params;

    // Fetch all messages for this chat session
    const messages = await prisma.message.findMany({
      where: {
        sessionId: conversationId,
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Format messages for frontend
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      senderId: msg.senderId,
      // ✅ Replace admin name with "Support" for privacy
      senderName: msg.User.role === 'admin' ? 'Support' : (msg.User.name || 'Unknown'),
      senderRole: msg.User.role,
      message: msg.content,
      timestamp: msg.createdAt.toISOString(),
      read: true,
    }));

    return NextResponse.json({
      messages: formattedMessages,
      total: formattedMessages.length,
    });
  } catch (error) {
    console.error('Admin chat messages GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id: conversationId } = await params;
    const { message } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Verify chat session exists
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: conversationId },
      include: {
        ChatParticipant: {
          where: { role: 'driver' },
          include: {
            User: true,
          },
        },
      },
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    // Generate unique message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Save message to database
    const newMessage = await prisma.message.create({
      data: {
        id: messageId,
        senderId: authResult.id,
        sessionId: conversationId,
        content: message.trim(),
        type: 'text',
        status: 'sent',
        updatedAt: new Date(),
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

    // Update session updatedAt
    await prisma.chatSession.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    // Send real-time notification to driver via Pusher
    try {
      const driverParticipant = chatSession.ChatParticipant.find((p) => p.role === 'driver');
      if (driverParticipant && driverParticipant.userId) {
        // ✅ CRITICAL FIX: Get Driver.id (not User.id) for Pusher channel
        const driverRecord = await prisma.driver.findUnique({
          where: { userId: driverParticipant.userId },
          select: { id: true }
        });

        if (driverRecord) {
          const pusher = getPusherServer();
          // ✅ Use Driver.id for channel name (iOS app expects this)
          await pusher.trigger(`driver-${driverRecord.id}`, 'admin_message', {
            id: newMessage.id,
            messageId: newMessage.id,  // ✅ Add messageId for deduplication
            content: newMessage.content,
            message: newMessage.content,  // ✅ Add 'message' field for backward compatibility
            sender: 'admin',
            senderName: 'Support',  // ✅ Always use "Support" for privacy
            timestamp: newMessage.createdAt.toISOString(),
            sessionId: conversationId,
          });

          console.log(`📤 Sent admin message to driver channel: driver-${driverRecord.id}`);
        } else {
          console.error('❌ Driver record not found for userId:', driverParticipant.userId);
        }
      }
    } catch (pusherError) {
      console.error('❌ Pusher notification failed:', pusherError);
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json({
      message: {
        id: newMessage.id,
        senderId: newMessage.senderId,
        senderName: 'Support',  // ✅ Always use "Support" for privacy
        senderRole: 'admin',
        message: newMessage.content,
        timestamp: newMessage.createdAt.toISOString(),
        read: false,
      },
      success: true,
    });
  } catch (error) {
    console.error('Admin chat send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
