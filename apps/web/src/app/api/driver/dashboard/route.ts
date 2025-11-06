import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { prisma } from '@/lib/prisma';
import { penceToPounds } from '@/lib/utils/currency';
import { filterDemoData, isAppleTestAccount } from '@/lib/utils/demo-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number { // DEPRECATED - internal use only
  const R = 3959; // Radius of the Earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in miles
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

export async function GET(request: NextRequest) {
  try {
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
      console.log('🔑 Bearer token authenticated for dashboard:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401, headers: corsHeaders }
        );
      }

      const userRole = (session.user as any)?.role;
      if (userRole !== 'driver') {
        return NextResponse.json(
          { error: 'Forbidden - Driver access required' },
          { status: 403, headers: corsHeaders }
        );
      }

      userId = session.user.id;
      console.log('🌐 NextAuth session authenticated for dashboard:', userId);
    }

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId },
      select: { id: true, status: true, onboardingStatus: true }
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver profile not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    if (driver.status !== 'active' || driver.onboardingStatus !== 'approved') {
      return NextResponse.json(
        { error: 'Driver account not active or not approved' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Get driver's assigned jobs (single bookings)
    const assignedJobs = await prisma.assignment.findMany({
      where: {
        driverId: driver.id,
        status: { in: ['invited', 'accepted'] }
      },
      include: {
        Booking: {
          include: {
            pickupAddress: true,
            dropoffAddress: true,
            BookingItem: true,
            customer: { select: { id: true, name: true, email: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get driver's assigned routes (multi-drop)
    const assignedRoutes = await prisma.route.findMany({
      where: {
        driverId: driver.id,
        status: { in: ['assigned', 'active', 'in_progress'] }
      },
      include: {
        Booking: {
          include: {
            pickupAddress: true,
            dropoffAddress: true,
            BookingItem: true,
            customer: { select: { id: true, name: true, email: true } }
          },
          orderBy: { deliverySequence: 'asc' }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    // Get available jobs (unassigned bookings)
    // CRITICAL: Only show jobs with NO assignments at all (not assigned to ANY driver)
    const availableJobs = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        driverId: null, // Not assigned to any driver
        scheduledAt: {
          gte: new Date() // Future bookings only
        },
        // EXTRA SECURITY: Ensure no assignments exist for this booking
        Assignment: {
          none: {} // No assignments at all
        }
      },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        BookingItem: true,
        customer: { select: { id: true, name: true, email: true } }
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10 // Limit to 10 available jobs
    });

    // Calculate driver statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let completedTodayCount = 0;
    let totalCompletedCount = 0;
    let totalEarningsResult = { _sum: { netAmountPence: 0 } };
    let avgRatingResult = { _avg: { rating: 0 } };

    try {
      // Jobs completed today
      completedTodayCount = await prisma.assignment.count({
        where: {
          driverId: driver.id,
          status: 'completed',
          updatedAt: { gte: today, lt: tomorrow }
        }
      });

      // Total completed jobs
      totalCompletedCount = await prisma.assignment.count({
        where: {
          driverId: driver.id,
          status: 'completed'
        }
      });

      // Total earnings (try driverEarnings table, fallback to 0 if not exists)
      try {
        const earningsAggregate = await prisma.driverEarnings.aggregate({
          where: { driverId: driver.id },
          _sum: { netAmountPence: true }
        });
        totalEarningsResult = {
          _sum: {
            netAmountPence: earningsAggregate._sum.netAmountPence ?? 0
          }
        };
      } catch (earningsError) {
        console.warn('DriverEarnings table not available, using fallback:', earningsError instanceof Error ? earningsError.message : String(earningsError));
        totalEarningsResult = { _sum: { netAmountPence: 0 } };
      }

      // Average rating (try driverRating table, fallback to 0 if not exists)
      try {
        const ratingAggregate = await prisma.driverRating.aggregate({
          where: { driverId: driver.id },
          _avg: { rating: true }
        });
        avgRatingResult = {
          _avg: {
            rating: ratingAggregate._avg.rating ?? 0
          }
        };
      } catch (ratingError) {
        console.warn('DriverRating table not available, using fallback:', ratingError instanceof Error ? ratingError.message : String(ratingError));
        avgRatingResult = { _avg: { rating: 0 } };
      }
    } catch (statsError) {
      console.warn('Error calculating driver statistics, using defaults:', statsError instanceof Error ? statsError.message : String(statsError));
    }

    // Format assigned jobs for frontend with REAL pricing engine
    const formattedAssignedJobs = await Promise.all(assignedJobs.map(async assignment => {
      const pickup = assignment.Booking.pickupAddress;
      const dropoff = assignment.Booking.dropoffAddress;
      
      // Calculate actual distance (handle null coordinates gracefully)
      let distance = 0;
      try {
        const pickupLat = pickup?.lat;
        const pickupLng = pickup?.lng;
        const dropoffLat = dropoff?.lat;
        const dropoffLng = dropoff?.lng;

        if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
          distance = calculateDistance(pickupLat, pickupLng, dropoffLat, dropoffLng); // DEPRECATED - internal use only
        }
      } catch (distanceError) {
        console.warn('Error calculating distance:', distanceError instanceof Error ? distanceError.message : String(distanceError));
        distance = 0;
      }

      // ✅ Calculate actual earnings using driverEarningsService
      const { driverEarningsService } = await import('@/lib/services/driver-earnings-service');
      const earningsResult = await driverEarningsService.calculateEarnings({
        driverId: driver.id,
        bookingId: assignment.Booking.id,
        assignmentId: assignment.id,
        customerPaymentPence: assignment.Booking.totalGBP,
        distanceMiles: distance,
        durationMinutes: assignment.Booking.estimatedDurationMinutes || 60,
        dropCount: 1,
        hasHelper: false,
        urgencyLevel: 'standard',
        onTimeDelivery: true,
      });
      const estimatedEarnings = penceToPounds(earningsResult.breakdown.netEarnings);

      return {
        id: assignment.Booking.id,
        assignmentId: assignment.id,
        customer: assignment.Booking.customer?.name || assignment.Booking.customerName || 'Unknown Customer',
        customerPhone: assignment.Booking.customerPhone || '',
        customerEmail: assignment.Booking.customerEmail || '',
        from: pickup?.label || 'Pickup Address',
        to: dropoff?.label || 'Dropoff Address',
        date: assignment.Booking.scheduledAt.toISOString().split('T')[0],
        time: assignment.Booking.scheduledAt.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        scheduledAt: assignment.Booking.scheduledAt, // Added for sorting
        distance: `${distance} miles`,
        estimatedEarnings: estimatedEarnings,
        vehicleType: assignment.Booking.crewSize === 'ONE' ? 'Van' : 'Large Van',
        items: assignment.Booking.BookingItem?.map((item: any) => item.name).join(', ') || 'No items specified',
        status: assignment.status,
        assignmentStatus: assignment.status,
        bookingStatus: assignment.Booking.status,
        reference: assignment.Booking.reference,
        createdAt: assignment.createdAt,
        expiresAt: assignment.expiresAt
      };
    }));

    // Format available jobs for frontend with REAL pricing engine
    const formattedAvailableJobs = await Promise.all(availableJobs.map(async booking => {
      const pickup = booking.pickupAddress;
      const dropoff = booking.dropoffAddress;
      
      // Calculate distance for available jobs
      let distance = booking.baseDistanceMiles || 0;
      if (!distance && pickup && dropoff) {
        try {
          distance = calculateDistance( // DEPRECATED - internal use only
            pickup.lat || 0,
            pickup.lng || 0,
            dropoff.lat || 0,
            dropoff.lng || 0
          );
        } catch (error) {
          console.warn('Error calculating distance for available job:', error);
          distance = 50; // Fallback
        }
      }

      // ✅ Calculate actual earnings using driverEarningsService
      const { driverEarningsService } = await import('@/lib/services/driver-earnings-service');
      const earningsResult = await driverEarningsService.calculateEarnings({
        driverId: driver.id,
        bookingId: booking.id,
        assignmentId: 'temp_' + booking.id,
        customerPaymentPence: booking.totalGBP,
        distanceMiles: distance,
        durationMinutes: booking.estimatedDurationMinutes || 60,
        dropCount: 1,
        hasHelper: false,
        urgencyLevel: 'standard',
        onTimeDelivery: true,
      });
      const estimatedEarnings = penceToPounds(earningsResult.breakdown.netEarnings);
      
      return {
        id: booking.id,
        customer: booking.customer?.name || booking.customerName || 'Unknown Customer',
        customerPhone: booking.customerPhone || '',
        customerEmail: booking.customerEmail || '',
        from: pickup?.label || 'Pickup Address',
        to: dropoff?.label || 'Dropoff Address',
        date: booking.scheduledAt.toISOString().split('T')[0],
        time: booking.scheduledAt.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        distance: `${distance} miles`,
        estimatedEarnings: estimatedEarnings,
        vehicleType: booking.crewSize === 'ONE' ? 'Van' : 'Large Van',
        items: booking.BookingItem?.map((item: any) => item.name).join(', ') || 'No items specified',
        status: 'available',
        reference: booking.reference,
        createdAt: booking.createdAt,
        scheduledAt: booking.scheduledAt
      };
    }));

    // Format assigned routes for frontend
    const formattedAssignedRoutes = await Promise.all(assignedRoutes.map(async route => {
      const bookings = route.Booking || [];
      const totalDrops = bookings.length;
      
      // Get first and last stops
      const firstStop = bookings[0];
      const lastStop = bookings[bookings.length - 1];
      
      // Calculate total earnings for the route
      const { driverEarningsService } = await import('@/lib/services/driver-earnings-service');
      
      // Calculate earnings for each drop in the route
      let totalRouteEarnings = 0;
      for (const booking of bookings) {
        const earningsResult = await driverEarningsService.calculateEarnings({
          driverId: driver.id,
          bookingId: booking.id,
          assignmentId: route.id,
          customerPaymentPence: booking.totalGBP || 0,
          distanceMiles: route.optimizedDistanceKm ? route.optimizedDistanceKm * 0.621371 : 0,
          durationMinutes: route.estimatedDuration || 60,
          dropCount: totalDrops,
          hasHelper: false,
          urgencyLevel: 'standard',
          onTimeDelivery: true,
        });
        totalRouteEarnings += earningsResult.breakdown.netEarnings;
      }
      
      return {
        id: route.id,
        type: 'route' as const,
        reference: route.reference || `ROUTE-${route.id.substring(0, 8)}`,
        from: firstStop?.pickupAddress?.label || 'First Stop',
        to: lastStop?.dropoffAddress?.label || 'Last Stop',
        totalStops: totalDrops,
        completedStops: route.completedDrops || 0,
        date: route.startTime.toISOString().split('T')[0],
        time: route.startTime.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        distance: route.optimizedDistanceKm ? `${(route.optimizedDistanceKm * 0.621371).toFixed(1)} miles` : '0 miles',
        estimatedEarnings: penceToPounds(totalRouteEarnings),
        vehicleType: 'Van',
        status: route.status,
        routeStatus: route.status,
        createdAt: route.createdAt,
        scheduledAt: route.startTime,
        bookings: bookings.map(b => ({
          id: b.id,
          reference: b.reference,
          customer: b.customer?.name || b.customerName,
          pickup: b.pickupAddress?.label,
          dropoff: b.dropoffAddress?.label,
        }))
      };
    }));

    // Calculate statistics
    const stats = {
      assignedJobs: assignedJobs.length,
      assignedRoutes: assignedRoutes.length,
      totalAssigned: assignedJobs.length + assignedRoutes.length,
      availableJobs: availableJobs.length,
      completedToday: completedTodayCount,
      totalCompleted: totalCompletedCount,
      earningsToday: 0, // Would need to calculate from today's completed jobs
      totalEarnings: penceToPounds(totalEarningsResult._sum.netAmountPence || 0),
      averageRating: avgRatingResult._avg.rating || 0,
    };

    console.log(`✅ Driver dashboard data loaded for driver ${driver.id}:`, {
      assignedJobs: stats.assignedJobs,
      assignedRoutes: stats.assignedRoutes,
      totalAssigned: stats.totalAssigned,
      availableJobs: stats.availableJobs,
      completedToday: stats.completedToday,
      totalEarnings: stats.totalEarnings
    });

    // ✅ CRITICAL: Filter out demo data for production accounts
    // Only Apple Test Account (zadfad41@gmail.com) can see demo data
    // Get user email from driver record
    const driverUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });
    const userEmail = driverUser?.email || null;
    const filteredAssignedJobs = filterDemoData(formattedAssignedJobs, userEmail, driver.id);
    const filteredAssignedRoutes = filterDemoData(formattedAssignedRoutes, userEmail, driver.id);
    const filteredAvailableJobs = filterDemoData(formattedAvailableJobs, userEmail, driver.id);

    // Log if any jobs were filtered
    if (filteredAssignedJobs.length !== formattedAssignedJobs.length) {
      console.log(`⚠️ Filtered ${formattedAssignedJobs.length - filteredAssignedJobs.length} demo jobs from assigned jobs (production account)`);
    }
    if (filteredAssignedRoutes.length !== formattedAssignedRoutes.length) {
      console.log(`⚠️ Filtered ${formattedAssignedRoutes.length - filteredAssignedRoutes.length} demo routes from assigned routes (production account)`);
    }
    if (filteredAvailableJobs.length !== formattedAvailableJobs.length) {
      console.log(`⚠️ Filtered ${formattedAvailableJobs.length - filteredAvailableJobs.length} demo jobs from available jobs (production account)`);
    }

    // Combine and sort assigned jobs and routes by scheduled time
    const allAssigned = [
      ...filteredAssignedJobs.map(j => ({ ...j, type: 'order' as const })),
      ...filteredAssignedRoutes
    ].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    return NextResponse.json({
      success: true,
      data: {
        driver: {
          id: driver.id,
          status: driver.status,
          onboardingStatus: driver.onboardingStatus,
          isTestAccount: isAppleTestAccount(userEmail, driver.id)
        },
        jobs: {
          assigned: allAssigned, // Combined orders + routes, sorted by time
          assignedOrders: filteredAssignedJobs, // Just orders
          assignedRoutes: filteredAssignedRoutes, // Just routes
          available: filteredAvailableJobs
        },
        statistics: stats
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Error loading driver dashboard data:', error);
    return NextResponse.json(
      {
        error: 'Failed to load dashboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
