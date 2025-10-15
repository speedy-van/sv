import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticateBearerToken } from '@/lib/bearer-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔔 Driver Notifications API - Starting request');
    
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
        console.log('❌ Driver Notifications API - No session found');
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
      console.log('❌ Driver Notifications API - Invalid role:', userRole);
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      driverId: driver.id,
    };

    if (unreadOnly) {
      where.read = false;
    }

    if (type) {
      where.type = type;
    }

    // Get notifications with pagination
    const [notifications, total] = await Promise.all([
      prisma.driverNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          data: true,
          read: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.driverNotification.count({ where }),
    ]);

    // Get unread count
    const unreadCount = await prisma.driverNotification.count({
      where: {
        driverId: driver.id,
        read: false,
      },
    });

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

