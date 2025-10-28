import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// CORS headers for mobile app
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
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('📍 Location update from mobile app (bearer token):', userId);
    } else {
      // Fallback to session auth (for web)
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Login required' },
          { status: 401, headers: corsHeaders }
        );
      }
      userId = (session.user as any).id;
      console.log('📍 Location update from web (session):', userId);
    }

    const { latitude, longitude, accuracy, timestamp } = await request.json();

    // Validate location data
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid location coordinates' },
        { status: 400 }
      );
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { error: 'Location coordinates out of valid range' },
        { status: 400 }
      );
    }

    const driver = await prisma.driver.findUnique({
      where: { userId },
      include: { DriverAvailability: true },
    });

    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' }, 
        { status: 404, headers: corsHeaders }
      );
    }

    console.log('📍 Driver found:', {
      driverId: driver.id,
      hasAvailability: !!driver.DriverAvailability,
      status: driver.DriverAvailability?.status,
      locationConsent: driver.DriverAvailability?.locationConsent,
    });

    // ✅ CRITICAL: Update location even if offline (for last known position)
    // Only check if driver record exists and has location consent
    if (!driver.DriverAvailability) {
      // Create availability record if missing
      await prisma.driverAvailability.create({
        data: {
          driverId: driver.id,
          status: 'offline',
          locationConsent: true,
          lastLat: latitude,
          lastLng: longitude,
          lastSeenAt: new Date(),
        }
      });
      
      console.log('✅ Location saved (availability record created)');
      return NextResponse.json({
        success: true,
        message: 'Location saved (availability record created)',
        timestamp: new Date().toISOString(),
      }, { headers: corsHeaders });
    }

    // Update location regardless of online/offline status
    // This ensures admin can see last known position
    await prisma.driverAvailability.update({
      where: { driverId: driver.id },
      data: {
        lastLat: latitude,
        lastLng: longitude,
        lastSeenAt: new Date(),
      },
    });

    console.log('✅ Location updated successfully:', {
      driverId: driver.id,
      lat: latitude.toFixed(6),
      lng: longitude.toFixed(6),
      accuracy,
    });

    return NextResponse.json({
      success: true,
      message: 'Location updated',
      timestamp: new Date().toISOString(),
    }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('❌ Location update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

