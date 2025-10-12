import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    let userInfo: { id: string; firstName: string; lastName: string; role: string };

    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      userInfo = {
        id: bearerAuth.user.id,
        firstName: bearerAuth.user.name?.split(' ')[0] || 'Driver',
        lastName: bearerAuth.user.name?.split(' ').slice(1).join(' ') || '',
        role: bearerAuth.user.role
      };
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        console.log('❌ Driver Chat Send API - No authentication found');
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      const sessionUser = session.user as any;
      if (sessionUser.role !== 'driver') {
        return NextResponse.json(
          { error: 'Forbidden - Driver access required' },
          { status: 403 }
        );
      }

      userId = session.user.id;
      userInfo = {
        id: sessionUser.id,
        firstName: sessionUser.name?.split(' ')[0] || 'Driver',
        lastName: sessionUser.name?.split(' ').slice(1).join(' ') || '',
        role: sessionUser.role
      };
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    const body = await request.json();
    const { driverId, message, timestamp } = body;

    if (!driverId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: driverId, message' },
        { status: 400 }
      );
    }

    // Get the driver record to verify ownership
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      select: { userId: true }
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Verify the driver is sending from their own account
    if (userId !== driver.userId) {
      console.log('❌ Unauthorized chat send attempt:', { userId, driverId, driverUserId: driver.userId });
      return NextResponse.json(
        { error: 'Unauthorized - You can only send messages from your own account' },
        { status: 403 }
      );
    }

    // Find or create the chat session for this driver-admin conversation
    let chatSession = await prisma.chatSession.findFirst({
      where: {
        type: 'driver_admin',
        isActive: true,
        ChatParticipant: {
          some: {
            userId: userId,  // ✅ Use userId (from User table) not driverId
            role: 'driver'
          }
        }
      }
    });

    if (!chatSession) {
      // Generate unique IDs for the session and participant
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const participantId = `participant_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Create a new chat session
      chatSession = await prisma.chatSession.create({
        data: {
          id: sessionId,
          type: 'driver_admin',
          title: `Driver Support - ${userInfo.firstName} ${userInfo.lastName}`,
          createdBy: userId,  // ✅ Use userId not driverId
          updatedAt: new Date(),
          ChatParticipant: {
            create: [
              {
                id: participantId,
                userId: userId,  // ✅ Use userId not driverId
                role: 'driver'
              }
            ]
          }
        }
      });
    }

    // Generate unique message ID
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Create the message
    const newMessage = await prisma.message.create({
      data: {
        id: messageId,
        senderId: userId,  // ✅ Use userId not driverId
        sessionId: chatSession.id,
        content: message,
        type: 'text',
        status: 'sent',
        updatedAt: new Date()
      }
    });

    // Update session updatedAt
    await prisma.chatSession.update({
      where: { id: chatSession.id },
      data: { updatedAt: new Date() }
    });

    // Send real-time notification via Pusher
    try {
      const pusher = getPusherServer();
      await pusher.trigger(
        `driver-${driverId}`,
        'chat_message',
        {
          id: newMessage.id,
          messageId: newMessage.id,  // ✅ Add messageId for deduplication
          content: newMessage.content,
          sender: 'driver',
          senderName: `${userInfo.firstName} ${userInfo.lastName}`,
          timestamp: newMessage.createdAt.toISOString(),
          sessionId: chatSession.id
        }
      );

      // Also notify admin channel
      await pusher.trigger(
        'admin-chat',
        'driver_message',
        {
          id: newMessage.id,
          messageId: newMessage.id,  // ✅ Add messageId for deduplication
          driverId,
          driverName: `${userInfo.firstName} ${userInfo.lastName}`,
          message: newMessage.content,
          timestamp: newMessage.createdAt.toISOString(),
          sessionId: chatSession.id
        }
      );
      
      console.log(`✅ Pusher notifications sent for message ${newMessage.id}`);
    } catch (pusherError) {
      console.error('Pusher notification failed:', pusherError);
      // Don't fail the request if Pusher fails
    }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      messageId: newMessage.id
    });

  } catch (error) {
    console.error('Driver chat send POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}