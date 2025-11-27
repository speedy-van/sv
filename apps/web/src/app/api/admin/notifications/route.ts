import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getCustomSession } from '@/lib/custom-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check authentication with dual-auth pattern
    const customSession = await getCustomSession();
    let isAdmin = customSession?.user?.role === 'admin';
    
    if (!customSession?.user) {
      const session = await getServerSession(authOptions);
      isAdmin = (session?.user as any)?.role === 'admin';
      
      if (!session?.user || !isAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 401 }
        );
      }
    }
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // Get notifications with pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type');

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (unreadOnly) {
      where.isRead = false;
    }
    if (type) {
      where.type = type;
    }

    // Get notifications
    const notifications = await prisma.adminNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    // Get total count
    const totalCount = await prisma.adminNotification.count({ where });

    // Get unread count
    const unreadCount = await prisma.adminNotification.count({
      where: { isRead: false },
    });

    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error('❌ Error fetching admin notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
