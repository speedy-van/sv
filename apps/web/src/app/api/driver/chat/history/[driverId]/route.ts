import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { driverId: string } }
) {
  try {
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;

    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        console.log('❌ Driver Chat History API - No authentication found');
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
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    const { driverId } = params;

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

    // Verify the driver is accessing their own chat
    if (userId !== driver.userId) {
      console.log('❌ Unauthorized chat access attempt:', { userId, driverId, driverUserId: driver.userId });
      return NextResponse.json(
        { error: 'Unauthorized - You can only access your own chat' },
        { status: 403 }
      );
    }

    // Find the chat session for this driver-admin conversation
    // ✅ CRITICAL FIX: Use userId (from User table) not driverId (from Driver table)
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        type: 'driver_admin',
        isActive: true,
        ChatParticipant: {
          some: {
            userId: userId,  // ✅ Use userId not driverId
            role: 'driver'
          }
        }
      },
      include: {
        Message: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!chatSession) {
      // Return empty messages if no session exists yet
      return NextResponse.json({
        success: true,
        messages: []
      });
    }

    // Format messages for the frontend
    const messages = chatSession.Message.map(msg => ({
      id: msg.id,
      content: msg.content,
      sender: msg.User.role === 'admin' ? 'admin' : 'driver',
      senderName: msg.User.role === 'admin' ? 'Admin Support' : (msg.User.name || 'Driver'),
      timestamp: msg.createdAt.toISOString(),
      createdAt: msg.createdAt.toISOString()
    }));

    return NextResponse.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Driver chat history GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}