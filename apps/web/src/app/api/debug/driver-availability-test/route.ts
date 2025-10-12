import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing driver availability API...');
    
    const session = await getServerSession(authOptions);
    console.log('👤 Session:', session ? 'Found' : 'Not found');
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'No session found',
          debug: {
            hasSession: !!session,
            hasUser: !!(session?.user),
            userRole: (session?.user as any)?.role,
            userId: (session?.user as any)?.id,
          }
        },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    console.log('🔑 User role:', userRole);
    
    if (userRole !== 'driver') {
      return NextResponse.json(
        { 
          error: 'Not a driver',
          debug: {
            userRole,
            expectedRole: 'driver',
          }
        },
        { status: 403 }
      );
    }

    const userId = (session.user as any).id;
    console.log('🆔 User ID:', userId);

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId: userId },
      include: {
        availability: true,
      },
    });

    console.log('🚗 Driver record:', driver ? 'Found' : 'Not found');

    if (!driver) {
      return NextResponse.json(
        { 
          error: 'Driver record not found',
          debug: {
            userId,
            driverExists: false,
          }
        },
        { status: 404 }
      );
    }

    const availability = driver.availability;

    // Get or create default availability settings
    const defaultSettings = {
      isOnline: availability?.status === 'online',
      acceptingJobs: availability?.status === 'online',
      currentLocation: availability?.lastLat && availability?.lastLng ? {
        lat: availability.lastLat,
        lng: availability.lastLng,
      } : undefined,
    };

    console.log('✅ Returning data:', defaultSettings);

    return NextResponse.json({
      success: true,
      data: defaultSettings,
      debug: {
        driverId: driver.id,
        driverStatus: driver.status,
        onboardingStatus: driver.onboardingStatus,
        availabilityStatus: availability?.status,
        hasLocation: !!(availability?.lastLat && availability?.lastLng),
      }
    });

  } catch (error) {
    console.error('❌ Error in driver availability test:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          errorType: error instanceof Error ? error.constructor.name : typeof error,
        }
      },
      { status: 500 }
    );
  }
}
