import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { sessionId, isTyping } = await request.json();

    if (!sessionId || typeof isTyping !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, isTyping' },
        { status: 400 }
      );
    }

    // Get the chat session to find the driver
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        ChatParticipant: {
          where: { role: 'driver' },
          include: {
            User: {
              include: {
                Driver: {
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!chatSession) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      );
    }

    const driverParticipant = chatSession.ChatParticipant.find((p) => p.role === 'driver');
    if (!driverParticipant || !driverParticipant.User.Driver?.id) {
      return NextResponse.json(
        { error: 'Driver not found in chat session' },
        { status: 404 }
      );
    }

    // Send typing indicator to driver via Pusher
    try {
      const pusher = getPusherServer();
      const driverId = driverParticipant.User.Driver.id;
      
      await pusher.trigger(`driver-${driverId}`, 'typing_indicator', {
        sessionId,
        userRole: 'admin',
        isTyping,
        timestamp: new Date().toISOString()
      });
      
      console.log(`✅ Sent typing indicator to driver-${driverId}: ${isTyping}`);
    } catch (pusherError) {
      console.error('❌ Pusher typing indicator failed:', pusherError);
      return NextResponse.json(
        { error: 'Failed to send typing indicator' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Admin typing indicator error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

