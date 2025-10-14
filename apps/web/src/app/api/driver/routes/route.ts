import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPrisma } from '@/lib/prisma';
import { authenticateBearerToken } from '@/lib/bearer-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 20; // Increased from 10 to 20 seconds for route operations

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log('🚗 Driver Routes API - Starting request');
    
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
        console.log('❌ Driver Routes API - No session found');
        return NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401 }
        );
      }
      userId = session.user.id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    // Get user role from bearer auth or session
    const session = bearerAuth.success ? null : await getServerSession(authOptions);
    const userRole = bearerAuth.success ? bearerAuth.user.role : (session?.user as any)?.role;
    if (userRole !== 'driver') {
      console.log('❌ Driver Routes API - Invalid role:', userRole);
      return NextResponse.json(
        { error: 'Forbidden - Driver access required' },
        { status: 403 }
      );
    }
    console.log('🚗 Driver Routes API - Processing for user:', userId);

    // Use withPrisma for database operations with connection checking
    const { driver, routes } = await withPrisma(async (prisma) => {
      // Get driver record
      const driver = await prisma.driver.findUnique({
        where: { userId },
        select: { id: true, status: true, onboardingStatus: true }
      });

      if (!driver) {
        throw new Error('Driver profile not found');
      }

      console.log('✅ Driver found and verified:', {
        driverId: driver.id,
        status: driver.status,
        onboarding: driver.onboardingStatus
      });

      if (driver.status !== 'active' || driver.onboardingStatus !== 'approved') {
        console.log('❌ Driver not eligible:', {
          status: driver.status,
          onboarding: driver.onboardingStatus
        });
        throw new Error('Driver account not active or not approved');
      }

      // Get routes assigned to this driver with all drops
      // Note: Route.driverId references User.id, not Driver.id
      console.log('🔍 Querying routes for userId:', userId);
      
      const routes = await prisma.route.findMany({
      where: {
        driverId: userId, // Use userId, not driver.id
        status: {
          in: ['planned', 'assigned', 'in_progress']
        }
      },
      include: {
        drops: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

      console.log(`📊 Found ${routes.length} route(s) in database`);
      routes.forEach((r, i) => {
        console.log(`  Route ${i + 1}: ${r.id} (${r.status}, ${r.drops?.length || 0} drops)`);
      });

      return { driver, routes };
    });

    // Format routes for frontend
    const formattedRoutes = routes.map(route => {
      // Calculate totals from drops
      const totalDistance = route.optimizedDistanceKm || route.actualDistanceKm || 
        route.drops.reduce((sum, drop) => sum + (drop.distance || 0), 0);
      
      const totalEarnings = route.driverPayout || route.totalOutcome || 
        route.drops.reduce((sum, drop) => sum + Number(drop.quotedPrice || 0), 0);

      // Format drops
      const drops = route.drops.map(drop => ({
        id: drop.id,
        customerName: drop.User?.name || 'Unknown',
        deliveryAddress: drop.deliveryAddress,
        pickupAddress: drop.pickupAddress,
        timeWindowStart: drop.timeWindowStart.toISOString(),
        timeWindowEnd: drop.timeWindowEnd.toISOString(),
        status: drop.status,
        serviceTier: drop.serviceTier,
        specialInstructions: drop.specialInstructions,
        quotedPrice: Number(drop.quotedPrice),
        weight: drop.weight,
        volume: drop.volume,
        distance: drop.distance
      }));

      return {
        id: route.id,
        status: route.status,
        drops: drops,
        estimatedDuration: route.estimatedDuration || 
          Math.round((route.drops.length * 30) + (totalDistance * 2.5)), // 30 min per drop + travel time
        estimatedDistance: totalDistance,
        estimatedEarnings: Number(totalEarnings),
        startTime: route.startTime.toISOString(),
        endTime: route.endTime?.toISOString(),
        totalWorkers: 1, // Default, can be enhanced
        hasCameras: false, // Default, can be enhanced from vehicle data
        completedDrops: route.completedDrops,
        routeNotes: route.routeNotes,
        performanceMultiplier: route.performanceMultiplier,
        bonusesTotal: Number(route.bonusesTotal),
        penaltiesTotal: Number(route.penaltiesTotal)
      };
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Driver Routes API - Completed in ${duration}ms`);
    console.log(`📊 Returning ${formattedRoutes.length} routes`);

    return NextResponse.json({
      success: true,
      routes: formattedRoutes,
      totalRoutes: formattedRoutes.length
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Driver Routes API - Failed after ${duration}ms`);
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        success: false,
        routes: [],
        totalRoutes: 0,
        error: 'Failed to fetch routes', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
