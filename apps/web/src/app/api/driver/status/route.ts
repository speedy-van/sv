/**
 * Driver Status API
 * 
 * This is an alias endpoint that redirects to /api/driver/availability
 * for backwards compatibility with the mobile app.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET driver online/offline status
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
    } else {
      const session = await getServerSession(authOptions);
      
      if (!session?.user || (session.user as any).role !== 'driver') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      
      userId = (session.user as any).id;
    }

    // Get driver
    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: { DriverAvailability: true },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    const availability = driver.DriverAvailability;

    return NextResponse.json({
      success: true,
      data: {
        isOnline: availability?.status === 'online',
        status: availability?.status || 'offline',
        locationConsent: availability?.locationConsent ?? false,
        lastSeenAt: availability?.lastSeenAt,
      },
    });

  } catch (error) {
    console.error('❌ Error fetching driver status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status' },
      { status: 500 }
    );
  }
}

/**
 * POST/PUT update driver online/offline status
 */
export async function POST(request: NextRequest) {
  return handler(request);
}

export async function PUT(request: NextRequest) {
  return handler(request);
}

async function handler(request: NextRequest) {
  try {
    console.log('🚀 Starting driver status update handler');

    // Authenticate
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string | undefined;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('✅ Authenticated via bearer token for user:', userId);
    } else {
      console.log('❌ Bearer auth failed, trying session auth');
      const session = await getServerSession(authOptions);
      if (!session?.user || (session.user as any).role !== 'driver') {
        console.log('❌ Session auth failed or not driver role');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      userId = (session.user as any).id;
      console.log('✅ Authenticated via session for user:', userId);
    }

    if (!userId) {
      console.log('❌ No userId found after authentication');
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
      console.log('📝 Status update request body:', body);
    } catch (jsonError) {
      console.error('❌ Failed to parse request JSON:', jsonError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Get driver
    console.log('🔍 Looking up driver for userId:', userId);
    const driver = await prisma.driver.findUnique({
      where: { userId },
      select: { id: true },
    });

    console.log('📋 Driver lookup result:', driver ? { id: driver.id } : 'null');

    if (!driver || !driver.id) {
      console.log('❌ Driver not found or missing driverId for userId:', userId);
      return NextResponse.json(
        { error: 'Driver not found or missing driverId' },
        { status: 404 }
      );
    }

    console.log('✅ Found driver with id:', driver.id);

    // Prepare update data
    const updateData: any = {
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    };

    // Handle isOnline field
    if (body.isOnline !== undefined) {
      updateData.status = body.isOnline ? 'online' : 'offline';
      updateData.locationConsent = body.isOnline;
    }

    // Handle status field directly
    if (body.status) {
      updateData.status = body.status;
    }

    // Handle reason field (for logging)
    if (body.reason) {
      console.log('📋 Status change reason:', body.reason);
    }

    console.log('💾 Preparing to update driver status with data:', updateData);
    console.log('💾 Driver ID for upsert:', driver.id);

    let updatedAvailability;
    try {
      console.log('🔄 Starting upsert operation...');
      updatedAvailability = await prisma.driverAvailability.upsert({
        where: { driverId: driver.id },
        create: {
          id: crypto.randomUUID(), // Generate UUID for new records
          driverId: driver.id,
          status: 'offline',
          ...updateData,
        },
        update: updateData,
      });
      console.log('✅ Upsert completed successfully');
    } catch (upsertError) {
      console.error('❌ Upsert error details:', upsertError);
      console.error('❌ Upsert error stack:', upsertError instanceof Error ? upsertError.stack : 'No stack');
      return NextResponse.json(
        { error: 'Failed to upsert driver availability', details: upsertError instanceof Error ? upsertError.message : upsertError },
        { status: 500 }
      );
    }

    console.log('✅ Driver status updated:', updatedAvailability.status);

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      data: {
        isOnline: updatedAvailability.status === 'online',
        status: updatedAvailability.status,
        locationConsent: updatedAvailability.locationConsent,
      },
    });

  } catch (error) {
    console.error('❌ Error updating driver status:', error);
    return NextResponse.json(
      { error: 'Failed to update status', details: error instanceof Error ? error.message : error },
      { status: 500 }
    );
  }
}
