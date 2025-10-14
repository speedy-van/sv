import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPusherServer } from '@/lib/pusher';

export const dynamic = 'force-dynamic';

// Simple in-memory store for admin online status
const adminStatusStore = new Map<string, { status: 'online' | 'offline'; lastActive: Date }>();

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { status } = await request.json();

    if (!status || !['online', 'offline'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "online" or "offline"' },
        { status: 400 }
      );
    }

    // Update admin status in memory store
    adminStatusStore.set(authResult.id, {
      status,
      lastActive: new Date()
    });

    // Broadcast admin status to all drivers via Pusher
    try {
      const pusher = getPusherServer();
      
      // Get all active chat sessions to notify their drivers
      const { prisma } = await import('@/lib/prisma');
      const activeSessions = await prisma.chatSession.findMany({
        where: {
          type: 'driver_admin',
          isActive: true
        },
        include: {
          ChatParticipant: {
            where: { role: 'driver' },
            include: {
              User: {
                include: {
                  driver: {
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

      // Notify each driver
      const notifications = activeSessions.map(session => {
        const driverParticipant = session.ChatParticipant.find(p => p.role === 'driver');
        if (driverParticipant?.User?.driver?.id) {
          return pusher.trigger(`driver-${driverParticipant.User.driver.id}`, 'admin_status', {
            status,
            lastActive: new Date().toISOString(),
            adminId: authResult.id
          });
        }
        return Promise.resolve();
      });

      await Promise.all(notifications);
      
      console.log(`✅ Broadcasted admin status (${status}) to ${notifications.length} drivers`);
    } catch (pusherError) {
      console.error('❌ Pusher admin status broadcast failed:', pusherError);
    }

    return NextResponse.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Admin status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Get admin status from memory store
    const adminStatus = adminStatusStore.get(authResult.id) || {
      status: 'offline',
      lastActive: new Date()
    };

    return NextResponse.json({
      success: true,
      status: adminStatus.status,
      lastActive: adminStatus.lastActive.toISOString()
    });

  } catch (error) {
    console.error('Get admin status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

