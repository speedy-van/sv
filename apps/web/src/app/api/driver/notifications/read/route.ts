import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticateBearerToken } from '@/lib/bearer-auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    console.log('📖 Mark Notifications as Read API - Starting request');
    
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    let userRole: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      userRole = bearerAuth.user.role;
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        console.log('❌ Mark Notifications as Read API - No session found');
        return NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401 }
        );
      }
      userId = session.user.id;
      userRole = (session.user as any)?.role;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    // Check if user has driver role
    if (userRole !== 'driver') {
      console.log('❌ Mark Notifications as Read API - Invalid role:', userRole);
      return NextResponse.json(
        { error: 'Forbidden - Driver access required' },
        { status: 403 }
      );
    }

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const body = await request.json();
    const { notificationIds, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.driverNotification.updateMany({
        where: {
          driverId: driver.id,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.driverNotification.updateMany({
        where: {
          id: { in: notificationIds },
          driverId: driver.id,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Get updated unread count
    const unreadCount = await prisma.driverNotification.count({
      where: {
        driverId: driver.id,
        read: false,
      },
    });

    return NextResponse.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}

