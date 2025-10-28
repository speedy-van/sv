import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Driver Status API - Starting request');

    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;

    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      if (bearerAuth.user.role !== 'driver') {
        return NextResponse.json(
          { error: 'Forbidden - Driver access required' },
          { status: 403, headers: corsHeaders }
        );
      }
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session
      const session = await getServerSession(authOptions);
      if (!session?.user || (session.user as any)?.role !== 'driver') {
        return NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401, headers: corsHeaders }
        );
      }
      userId = session.user.id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status
    if (!status || !['online', 'offline'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "online" or "offline"' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId },
      select: { id: true, status: true },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver profile not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    console.log(`🔄 Updating driver ${driver.id} to ${status}`);

    // ✅ CRITICAL FIX: Update DriverAvailability table (not just Driver.updatedAt)
    const updatedAvailability = await prisma.driverAvailability.upsert({
      where: { driverId: driver.id },
      create: {
        driverId: driver.id,
        status: status,
        locationConsent: status === 'online', // Auto-enable location when online
        lastSeenAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        status: status,
        locationConsent: status === 'online' ? true : false, // ✅ Explicit false when offline
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✅ Driver ${driver.id} availability updated to ${status}`);

    // ✅ Send Pusher notification to admin dashboard
    try {
      const { default: Pusher } = await import('pusher');
      const pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID!,
        key: process.env.PUSHER_KEY!,
        secret: process.env.PUSHER_SECRET!,
        cluster: process.env.PUSHER_CLUSTER!,
        useTLS: true,
      });

      await pusher.trigger('admin-notifications', 'driver-status-changed', {
        driverId: driver.id,
        status: status,
        timestamp: new Date().toISOString(),
      });

      console.log('✅ Pusher notification sent to admin dashboard');
    } catch (pusherError) {
      console.error('⚠️ Failed to send Pusher notification:', pusherError);
      // Don't fail the request if Pusher fails
    }

    // ✅ If driver went online, trigger job matching
    if (status === 'online') {
      console.log('🔍 Driver went online - will auto-refresh available jobs');
      
      // You can add background job matching here or trigger via queue
      // For now, the dashboard will refresh and show available jobs
    }

    return NextResponse.json(
      {
        success: true,
        message: `Driver is now ${status}`,
        data: {
          driverId: driver.id,
          status: status,
          locationConsent: updatedAvailability.locationConsent,
          lastSeenAt: updatedAvailability.lastSeenAt.toISOString(),
        },
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('❌ Driver Status API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update driver status' },
      { status: 500, headers: corsHeaders }
    );
  }
}
