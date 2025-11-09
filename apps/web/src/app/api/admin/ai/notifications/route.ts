import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * ✅ Get urgent notifications count for admin AI
 * Returns count of issues needing immediate attention
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Check for urgent issues
    const [
      oldUnassigned,
      pendingDriverApps,
      activeDriverCount,
      upcomingOrders
    ] = await Promise.all([
      // Orders unassigned for >2 hours
      prisma.booking.count({
        where: {
          status: 'CONFIRMED',
          driverId: null,
          createdAt: { lt: twoHoursAgo }
        }
      }),
      
      // Pending driver applications
      prisma.driverApplication.count({
        where: { status: 'pending' }
      }),
      
      // Active driver count
      prisma.driver.count({
        where: {
          status: 'active',
          onboardingStatus: 'approved'
        }
      }),
      
      // Upcoming orders in next 2 hours
      prisma.booking.count({
        where: {
          status: 'CONFIRMED',
          scheduledAt: {
            gte: now,
            lte: new Date(now.getTime() + 2 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Calculate total urgent notifications
    let count = 0;
    const notifications = [];

    if (oldUnassigned > 0) {
      count += oldUnassigned;
      notifications.push({
        type: 'unassigned_orders',
        count: oldUnassigned,
        severity: 'high',
        message: `${oldUnassigned} orders unassigned for >2 hours`
      });
    }

    if (pendingDriverApps > 3) {
      count += 1;
      notifications.push({
        type: 'pending_applications',
        count: pendingDriverApps,
        severity: 'medium',
        message: `${pendingDriverApps} driver applications pending review`
      });
    }

    if (activeDriverCount < 5 && upcomingOrders > 10) {
      count += 1;
      notifications.push({
        type: 'driver_shortage',
        count: 1,
        severity: 'critical',
        message: `Driver shortage: ${activeDriverCount} drivers for ${upcomingOrders} upcoming orders`
      });
    }

    return NextResponse.json({
      success: true,
      count,
      notifications,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching AI notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch notifications',
        count: 0
      },
      { status: 500 }
    );
  }
}

