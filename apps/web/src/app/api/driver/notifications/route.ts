import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticateBearerToken } from '@/lib/bearer-auth';

// CORS headers for mobile app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    console.log('📬 Driver Notifications API - Starting request');
    
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
        console.log('❌ No session found');
        return NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401, headers: corsHeaders }
        );
      }
      userId = session.user.id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    console.log('🔍 Looking for driver with userId:', userId);

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId: userId },
      select: { id: true },
    });

    console.log('🔍 Driver query result:', driver);

    if (!driver) {
      console.log('❌ Driver not found for userId:', userId);
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    console.log('✅ Driver found:', driver.id);

    // Fetch notifications for the driver
    console.log('🔍 Fetching notifications for driver:', driver.id);
    
    const notifications = await prisma.driverNotification.findMany({
      where: {
        driverId: driver.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 notifications
    });

    console.log('✅ Found notifications:', notifications.length);

    return NextResponse.json(
      {
        success: true,
        data: {
          notifications: notifications.map(notif => ({
            id: notif.id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            read: notif.read,
            timestamp: notif.createdAt.toISOString(),
            actionUrl: notif.actionUrl || undefined,
          })),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('❌ Driver Notifications API error:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
