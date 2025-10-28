import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticateBearerToken } from '@/lib/bearer-auth';

// CORS headers for mobile app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: notificationId } = await params;
    console.log('📬 Mark Notification as Read API - Starting request for:', notificationId);
    
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

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId: userId },
      select: { id: true },
    });

    if (!driver) {
      console.log('❌ Driver not found for userId:', userId);
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Verify notification belongs to this driver
    const notification = await prisma.driverNotification.findFirst({
      where: {
        id: notificationId,
        driverId: driver.id,
      },
    });

    if (!notification) {
      console.log('❌ Notification not found or does not belong to driver');
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Mark as read
    await prisma.driverNotification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    console.log('✅ Notification marked as read:', notificationId);

    return NextResponse.json(
      {
        success: true,
        message: 'Notification marked as read',
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('❌ Mark Notification as Read API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

