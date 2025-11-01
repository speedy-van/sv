import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticateBearerToken } from '@/lib/bearer-auth';

// CORS headers for mobile app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function DELETE(request: NextRequest) {
  try {
    console.log('📬 Clear All Notifications API - Starting request');
    
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      const user = (session as any)?.user;
      const userIdFromSession = user?.id as string | undefined;
      if (!user || !userIdFromSession) {
        console.log('❌ No session found');
        return NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401, headers: corsHeaders }
        );
      }
      userId = userIdFromSession;
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

    // Delete all notifications for this driver
    const result = await prisma.driverNotification.deleteMany({
      where: {
        driverId: driver.id,
      },
    });

    console.log('✅ Cleared all notifications. Count:', result.count);

    return NextResponse.json(
      {
        success: true,
        message: `Cleared ${result.count} notifications`,
        count: result.count,
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('❌ Clear All Notifications API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

