import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertDriver } from '@/lib/guards';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/driver/push-subscription
 * 
 * Register push notification token for driver
 * Supports both:
 * - Web Push (p256dh + auth)
 * - Expo Push (platform + deviceInfo)
 */
export async function POST(request: NextRequest) {
  try {
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      if (bearerAuth.user.role !== 'driver') {
        return NextResponse.json(
          { error: 'Forbidden - Driver access required' },
          { status: 403 }
        );
      }
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await auth();
      try {
        assertDriver(session!);
      } catch (e) {
        const msg = (e as Error).message;
        const status = msg === 'UNAUTHORIZED' ? 401 : 403;
        return new Response(msg, { status });
      }
      userId = session!.user.id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const body = await request.json();
    const { endpoint, p256dh, auth, platform, deviceInfo } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    console.log('📱 Registering push subscription:', {
      driverId: driver.id,
      platform: platform || 'web',
      endpoint: endpoint.substring(0, 50) + '...',
    });

    // Upsert the push subscription
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: p256dh || null,
        auth: auth || null,
        platform: platform || 'web',
        deviceInfo: deviceInfo || null,
        driverId: driver.id,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        id: `push_${driver.id}_${Date.now()}`,
        endpoint,
        p256dh: p256dh || null,
        auth: auth || null,
        platform: platform || 'web',
        deviceInfo: deviceInfo || null,
        driverId: driver.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✅ Push subscription saved successfully:', subscription.id);

    return NextResponse.json({ 
      success: true, 
      subscription: {
        id: subscription.id,
        platform: subscription.platform,
        createdAt: subscription.createdAt,
      }
    });
  } catch (error) {
    console.error('❌ Error saving push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save push subscription' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  try {
    assertDriver(session!);
  } catch (e) {
    const msg = (e as Error).message;
    const status = msg === 'UNAUTHORIZED' ? 401 : 403;
    return new Response(msg, { status });
  }

  const userId = session.user.id;

  try {
    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint parameter is required' },
        { status: 400 }
      );
    }

    // Delete the push subscription
    await prisma.pushSubscription.deleteMany({
      where: {
        endpoint,
        driverId: driver.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete push subscription' },
      { status: 500 }
    );
  }
}

