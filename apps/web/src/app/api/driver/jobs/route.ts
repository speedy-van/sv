import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withPrisma } from '@/lib/prisma';
import { authenticateBearerToken } from '@/lib/bearer-auth';
import { penceToPounds } from '@/lib/utils/currency';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 20; // Increased timeout for job operations

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
    console.log('🚗 Driver Jobs API - Starting request');
    
    // Try Bearer token authentication first (for mobile app)
    const bearerAuth = await authenticateBearerToken(request);
    let userId: string;
    let session: any = null;
    
    if (bearerAuth.success) {
      userId = bearerAuth.user.id;
      console.log('🔑 Bearer token authenticated for user:', userId);
    } else {
      // Fallback to NextAuth session (for web app)
      session = await getServerSession(authOptions);
      if (!session?.user) {
        console.log('❌ Driver Jobs API - No session found');
        return NextResponse.json(
          { error: 'Unauthorized - Please login' },
          { status: 401 }
        );
      }
      userId = session.user.id;
      console.log('🌐 NextAuth session authenticated for user:', userId);
    }

    // Get user role from bearer auth or session
    const userRole = bearerAuth.success ? bearerAuth.user.role : (session?.user as any)?.role;
    if (userRole !== 'driver') {
      console.log('❌ Driver Jobs API - Invalid role:', userRole);
      return NextResponse.json(
        { error: 'Forbidden - Driver access required' },
        { status: 403 }
      );
    }
    console.log('🚗 Driver Jobs API - Processing for user:', userId);

    // Use withPrisma for all database operations with connection checking
    const { driver, assignedJobs, availableJobs } = await withPrisma(async (prisma) => {
      // Get driver record
      const driver = await prisma.driver.findUnique({
        where: { userId },
        select: { id: true, status: true, onboardingStatus: true }
      });

      if (!driver) {
        throw new Error('Driver profile not found');
      }

      if (driver.status !== 'active' || driver.onboardingStatus !== 'approved') {
        console.log('❌ Driver Jobs API - Driver not active or approved:', {
          status: driver.status,
          onboardingStatus: driver.onboardingStatus
        });
        throw new Error('Driver account not active or not approved');
      }

      console.log('✅ Driver Jobs API - Driver verified, fetching jobs');

      // Get driver's assigned jobs (accepted/invited)
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

      // Get available jobs (unassigned bookings)
      const availableJobs = await prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          driverId: null, // Not assigned to any driver
          scheduledAt: {
            gte: new Date() // Future bookings only
          }
        },
        include: {
          pickupAddress: true,
          dropoffAddress: true,
          BookingItem: true,
          customer: { select: { id: true, name: true, email: true } }
        },
        orderBy: { scheduledAt: 'asc' },
        take: 50 // Limit to prevent overwhelming the UI
      });

      return { driver, assignedJobs, availableJobs };
    });

    console.log('📊 Driver Jobs API - Found jobs:', {
      assigned: assignedJobs.length,
      available: availableJobs.length
    });

    // Transform assigned jobs
    const transformedAssignedJobs = assignedJobs.map(assignment => {
      const booking = assignment.Booking as any; // Type assertion for new fields (distanceMeters, durationSeconds)
      const pickup = booking.pickupAddress;
      const dropoff = booking.dropoffAddress;
      // Map assignment status to display status
      const status = assignment.status === 'accepted' ? 'accepted' : 
                     assignment.status === 'invited' ? 'available' : // Invited jobs show as available with Accept/Decline buttons
                     'assigned';
      
      // ✅ Use saved distance/duration first, fallback to calculation
      const distanceMiles = booking.distanceMeters 
        ? (booking.distanceMeters / 1609.34).toFixed(1)
        : booking.baseDistanceMiles 
          ? booking.baseDistanceMiles.toFixed(1)
          : (pickup && dropoff && pickup.lat && pickup.lng && dropoff.lat && dropoff.lng)
            ? calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng).toFixed(1)
            : '0';
      
      const durationMinutes = booking.durationSeconds 
        ? Math.round(booking.durationSeconds / 60)
        : booking.estimatedDurationMinutes || 120; // Default 2 hours
      
      const durationHours = Math.floor(durationMinutes / 60);
      const durationMins = durationMinutes % 60;
      const durationText = durationHours > 0 
        ? `${durationHours}h ${durationMins}m`
        : `${durationMins}m`;
      
      return {
        id: booking.id,
        reference: booking.reference,
        customer: booking.customer?.name || booking.customerName || 'Unknown Customer',
        customerPhone: booking.customerPhone || booking.customerEmail || 'No contact info',
        date: booking.scheduledAt.toISOString().split('T')[0],
        time: booking.scheduledAt.toTimeString().split(' ')[0].slice(0, 5),
        from: pickup?.label || 'Pickup Address',
        to: dropoff?.label || 'Dropoff Address',
        distance: `${distanceMiles} miles`,
        distanceMeters: booking.distanceMeters || 0,
        durationSeconds: booking.durationSeconds || 0,
        vehicleType: 'Van', // Default vehicle type
        items: booking.BookingItem?.map((item: any) => `${item.quantity || 1}x ${item.name || 'Unknown Item'}`).join(', ') || 'No items',
        estimatedEarnings: penceToPounds(Number(booking.totalGBP) || 0),
        status: status,
        priority: 'normal',
        duration: durationText,
        crew: '1 person'
      };
    });

    // Transform available jobs
    const transformedAvailableJobs = availableJobs.map(bookingData => {
      const booking = bookingData as any; // Type assertion for new fields (distanceMeters, durationSeconds)
      const pickup = booking.pickupAddress;
      const dropoff = booking.dropoffAddress;
      
      // ✅ Use saved distance/duration first, fallback to calculation
      const distanceMiles = booking.distanceMeters 
        ? (booking.distanceMeters / 1609.34).toFixed(1)
        : booking.baseDistanceMiles 
          ? booking.baseDistanceMiles.toFixed(1)
          : (pickup && dropoff && pickup.lat && pickup.lng && dropoff.lat && dropoff.lng)
            ? calculateDistance(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng).toFixed(1)
            : '0';
      
      const durationMinutes = booking.durationSeconds 
        ? Math.round(booking.durationSeconds / 60)
        : booking.estimatedDurationMinutes || 120; // Default 2 hours
      
      const durationHours = Math.floor(durationMinutes / 60);
      const durationMins = durationMinutes % 60;
      const durationText = durationHours > 0 
        ? `${durationHours}h ${durationMins}m`
        : `${durationMins}m`;
      
      return {
        id: booking.id,
        reference: booking.reference,
        customer: booking.customer?.name || booking.customerName || 'Unknown Customer',
        customerPhone: booking.customerPhone || booking.customerEmail || 'No contact info',
        date: booking.scheduledAt.toISOString().split('T')[0],
        time: booking.scheduledAt.toTimeString().split(' ')[0].slice(0, 5),
        from: pickup?.label || 'Pickup Address',
        to: dropoff?.label || 'Dropoff Address',
        distance: `${distanceMiles} miles`,
        distanceMeters: booking.distanceMeters || 0,
        durationSeconds: booking.durationSeconds || 0,
        vehicleType: 'Van', // Default vehicle type
        items: booking.BookingItem?.map((item: any) => `${item.quantity || 1}x ${item.name || 'Unknown Item'}`).join(', ') || 'No items',
        estimatedEarnings: penceToPounds(Number(booking.totalGBP) || 0),
        status: 'available',
        priority: 'normal',
        duration: durationText,
        crew: '1 person'
      };
    });

    // Combine all jobs
    const allJobs = [...transformedAssignedJobs, ...transformedAvailableJobs];

    const responseData = {
      jobs: allJobs,
      total: allJobs.length,
      available: transformedAvailableJobs.length,
      assigned: transformedAssignedJobs.length
    };

    console.log('✅ Driver Jobs API - Successfully processed jobs:', {
      total: responseData.total,
      available: responseData.available,
      assigned: responseData.assigned
    });

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Driver Jobs API - Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
