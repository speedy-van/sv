import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// CORS headers for mobile app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Helper function to check if driver has active orders
async function hasActiveOrders(driverId: string): Promise<boolean> {
  const activeAssignments = await prisma.assignment.findMany({
    where: {
      driverId: driverId,
      status: {
        in: ['invited', 'claimed', 'accepted']
      }
    }
  });
  return activeAssignments.length > 0;
}

// GET /api/driver/profile - Get driver profile (simplified version)
export async function GET(request: NextRequest) {
  try {
    console.log('🚗 Driver Profile API - Starting request');
    
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      
      console.log('🚗 Driver Profile API - Session check:', {
        hasSession: !!session,
        userRole: (session?.user as any)?.role,
        userId: (session?.user as any)?.id,
        email: session?.user?.email,
      });

      if (!session?.user || (session.user as any).role !== 'driver') {
        console.log('❌ Driver Profile API - Unauthorized access attempt');
        return NextResponse.json(
          { error: 'Unauthorized - Driver access required' },
          { status: 401, headers: corsHeaders }
        );
      }
      userId = (session.user as any).id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    // Simple user lookup first
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Simple driver lookup with availability
    const driver = await prisma.driver.findUnique({
      where: { userId: userId },
      select: {
        id: true,
        userId: true,
        basePostcode: true,
        vehicleType: true,
        onboardingStatus: true,
        rating: true,
        strikes: true,
        status: true,
        DriverAvailability: {
          select: {
            status: true,
            locationConsent: true,
            lastSeenAt: true,
          },
        },
      },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver record not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Simple driver application lookup
    let driverApplication = null;
    try {
      driverApplication = await prisma.driverApplication.findFirst({
        where: { userId: userId },
        select: {
          firstName: true,
          lastName: true,
          phone: true,
          status: true,
          applicationDate: true,
        },
      });
    } catch (error) {
      console.log('Warning: Could not fetch driver application:', error);
    }

    // Fetch performance data for acceptanceRate
    let performance = null;
    try {
      performance = await prisma.driverPerformance.findUnique({
        where: { driverId: driver.id },
        select: {
          acceptanceRate: true,
          completionRate: true,
          onTimeRate: true,
          totalJobs: true,
        },
      });
    } catch (error) {
      console.log('Warning: Could not fetch driver performance:', error);
    }

    // Simple profile data (no complex joins)
    const profileData = {
      // Basic Info
      id: user.id,
      email: user.email,
      firstName: driverApplication?.firstName || '',
      lastName: driverApplication?.lastName || '',
      phone: driverApplication?.phone || '',
      
      // ✅ CRITICAL: Include driver relation for mobile app Pusher initialization
      driver: {
        id: driver.id,
        userId: driver.userId,
        status: driver.status,
        onboardingStatus: driver.onboardingStatus,
        basePostcode: driver.basePostcode || '',
        vehicleType: driver.vehicleType || '',
        rating: driver.rating || 0,
        strikes: driver.strikes || 0,
      },
      
      // Driver Info (legacy, keeping for backward compatibility)
      driverId: driver.id,
      basePostcode: driver.basePostcode || '',
      vehicleType: driver.vehicleType || '',
      onboardingStatus: driver.onboardingStatus,
      rating: driver.rating || 0,
      strikes: driver.strikes || 0,
      status: driver.status,
      
      // Simple calculated fields
      bio: '',
      profileImage: '',
      profileCompleteness: 50, // Fixed value for now
      
      // ✅ CRITICAL: Include acceptanceRate for mobile app
      acceptanceRate: performance?.acceptanceRate || 100,
      
      // Simple statistics (no complex queries)
      totalJobs: performance?.totalJobs || 0,
      averageScore: 0,
      averageRating: driver.rating || 0,
      completionRate: performance?.completionRate || 100,
      onTimeRate: performance?.onTimeRate || 100,
      
      // Driver availability - Default to online if no availability record exists
      isOnline: driver.DriverAvailability?.status === 'online' || !driver.DriverAvailability,
      lastSeenAt: driver.DriverAvailability?.lastSeenAt?.toISOString() || null,
      locationConsent: driver.DriverAvailability?.locationConsent || false,
      hasActiveOrders: await hasActiveOrders(driver.id),
      
      // Empty arrays for now
      recentRatings: [],
      
      // Account Info
      joinedAt: user.createdAt.toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
      applicationStatus: driverApplication?.status || 'unknown',
      applicationDate: driverApplication?.applicationDate?.toISOString(),
    };

    console.log('✅ Driver profile data loaded (simplified):', {
      driverId: driver.id,
      profileCompleteness: profileData.profileCompleteness,
      totalJobs: profileData.totalJobs,
    });

    return NextResponse.json({
      success: true,
      data: profileData,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Error fetching driver profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch profile data',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT /api/driver/profile - Update driver profile (simplified)
export async function PUT(request: NextRequest) {
  try {
    console.log('🚗 Driver Profile Update API - Starting request');
    
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      
      if (!session?.user || (session.user as any).role !== 'driver') {
        console.log('❌ Driver Profile Update API - Unauthorized access');
        return NextResponse.json(
          { error: 'Unauthorized - Driver access required' },
          { status: 401, headers: corsHeaders }
        );
      }
      userId = (session.user as any).id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }
    const body = await request.json();

    // Simple updates only
    const { firstName, lastName, phone, email, basePostcode, vehicleType, locationConsent } = body;

    // Update user email if provided
    if (email) {
      await prisma.user.update({
        where: { id: userId },
        data: { email },
      });
    }

    // Update driver data if provided
    const driverUpdateData: any = {};
    if (basePostcode) driverUpdateData.basePostcode = basePostcode;
    if (vehicleType) driverUpdateData.vehicleType = vehicleType;

    if (Object.keys(driverUpdateData).length > 0) {
      await prisma.driver.update({
        where: { userId: userId },
        data: driverUpdateData,
      });
    }

    // Handle location consent updates
    if (locationConsent !== undefined) {
      // Get driver to check for active orders
      const driver = await prisma.driver.findUnique({
        where: { userId: userId },
        select: { id: true },
      });

      if (driver) {
        // Check if driver has active orders
        const driverHasActiveOrders = await hasActiveOrders(driver.id);
        
        // If trying to disable location sharing while having active orders, prevent it
        if (driverHasActiveOrders && !locationConsent) {
          return NextResponse.json(
            { 
              error: 'Cannot disable location sharing while you have active orders',
              activeOrders: true 
            },
            { status: 400, headers: corsHeaders }
          );
        }

        // Update location consent in driver availability
        await prisma.driverAvailability.upsert({
          where: { driverId: driver.id },
          create: {
            id: `availability_${driver.id}`,
            driverId: driver.id,
            status: 'online',
            locationConsent: locationConsent,
            updatedAt: new Date(),
          },
          update: {
            locationConsent: locationConsent,
            updatedAt: new Date(),
          },
        });
      }
    }

    // Update driver application data if provided
    if (firstName || lastName || phone) {
      const applicationUpdateData: any = {};
      if (firstName) applicationUpdateData.firstName = firstName;
      if (lastName) applicationUpdateData.lastName = lastName;
      if (phone) applicationUpdateData.phone = phone;

      await prisma.driverApplication.updateMany({
        where: { userId: userId },
        data: applicationUpdateData,
      });
    }

    console.log('✅ Driver profile updated (simplified):', {
      userId,
      updatedFields: Object.keys(body),
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Error updating driver profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to update profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
