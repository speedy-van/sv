import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location'); // Optional: filter by location
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('🚗 Admin fetching available drivers:', { location, limit });

    // First, let's check how many drivers we have in total
    const totalDriversCount = await prisma.driver.count({
      where: {
        status: 'active',
        onboardingStatus: 'approved',
      }
    });
    
    const driversWithAvailability = await prisma.driver.count({
      where: {
        status: 'active',
        onboardingStatus: 'approved',
        DriverAvailability: { isNot: null }
      }
    });

    console.log('📊 Driver statistics:', {
      totalActive: totalDriversCount,
      withAvailabilityRecord: driversWithAvailability,
      missingAvailability: totalDriversCount - driversWithAvailability
    });

    // Get active drivers who are available for new assignments
    const availableDrivers = await prisma.driver.findMany({
      where: {
        status: 'active',
        onboardingStatus: 'approved',
        // Removed strict availability requirements - include all approved active drivers
        // The availability status will be checked in the response data
      },
      include: {
        User: {
          select: {
            name: true,
            email: true,
            // phone removed - not in schema
          }
        },
        DriverAvailability: {
          select: {
            lastLat: true,
            lastLng: true,
            lastSeenAt: true,
            status: true,
          }
        },
        Assignment: {
          where: {
            status: {
              in: ['accepted', 'claimed']
            }
          },
          select: {
            id: true,
            status: true,
            claimedAt: true,
            Booking: {
              select: {
                reference: true,
                customerName: true,
                BookingAddress_Booking_pickupAddressIdToBookingAddress: {
                  select: {
                    label: true,
                    postcode: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { rating: 'desc' },
        { createdAt: 'asc' }
      ],
      take: limit,
    });

    // Transform the data for frontend
    const transformedDrivers = availableDrivers.map(driver => {
      const activeJobs = driver.Assignment.filter(assignment => 
        assignment.status === 'accepted' || assignment.status === 'claimed'
      );

      // Determine availability based on multiple factors
      const hasAvailabilityRecord = !!driver.DriverAvailability;
      const isOnline = driver.DriverAvailability?.status === 'online';
      const hasNoActiveJobs = activeJobs.length === 0;
      const isRecentlyActive = driver.DriverAvailability?.lastSeenAt 
        ? new Date(driver.DriverAvailability.lastSeenAt).getTime() > Date.now() - (24 * 60 * 60 * 1000) // Within 24 hours
        : false;

      // Driver is available if:
      // 1. No active jobs AND (online OR recently active OR no availability record yet)
      const isAvailableForAssignment = hasNoActiveJobs && (isOnline || isRecentlyActive || !hasAvailabilityRecord);

      return {
        id: driver.id,
        name: driver.User.name || `Driver ${driver.id.slice(-4)}`,
        email: driver.User.email,
        // phone removed - not in schema
        status: driver.status,
        onboardingStatus: driver.onboardingStatus,
        DriverAvailability: {
          status: driver.DriverAvailability?.status || 'unknown',
          lastSeenAt: driver.DriverAvailability?.lastSeenAt,
          location: driver.DriverAvailability?.lastLat && driver.DriverAvailability?.lastLng ? {
            lat: driver.DriverAvailability.lastLat,
            lng: driver.DriverAvailability.lastLng,
          } : null,
          hasRecord: hasAvailabilityRecord,
        },
        activeJobs: activeJobs.map(assignment => ({
          id: assignment.id,
          status: assignment.status,
          claimedAt: assignment.claimedAt,
          booking: {
            reference: assignment.Booking.reference,
            customerName: assignment.Booking.customerName,
            pickupAddress: assignment.Booking.BookingAddress_Booking_pickupAddressIdToBookingAddress?.label,
            postcode: assignment.Booking.BookingAddress_Booking_pickupAddressIdToBookingAddress?.postcode,
          }
        })),
        isAvailable: isAvailableForAssignment,
        totalActiveJobs: activeJobs.length,
        availabilityReason: isAvailableForAssignment 
          ? (isOnline ? 'Online' : isRecentlyActive ? 'Recently Active' : 'Ready for Assignment')
          : activeJobs.length > 0 ? `${activeJobs.length} Active Job${activeJobs.length > 1 ? 's' : ''}` : 'Offline',
      };
    });

    // Sort by availability (available drivers first, then by rating)
    const sortedDrivers = transformedDrivers.sort((a, b) => {
      if (a.isAvailable && !b.isAvailable) return -1;
      if (!a.isAvailable && b.isAvailable) return 1;
      return new Date(b.DriverAvailability.lastSeenAt || 0).getTime() - new Date(a.DriverAvailability.lastSeenAt || 0).getTime();
    });

    console.log('✅ Available drivers summary:', {
      totalDrivers: sortedDrivers.length,
      availableCount: sortedDrivers.filter(d => d.isAvailable).length,
      busyCount: sortedDrivers.filter(d => !d.isAvailable).length,
      onlineCount: sortedDrivers.filter(d => d.DriverAvailability.status === 'online').length,
      unknownStatusCount: sortedDrivers.filter(d => d.DriverAvailability.status === 'unknown').length,
      sampleDrivers: sortedDrivers.slice(0, 3).map(d => ({
        name: d.name,
        isAvailable: d.isAvailable,
        status: d.DriverAvailability.status,
        activeJobs: d.totalActiveJobs,
        reason: d.availabilityReason
      }))
    });

    return NextResponse.json({
      success: true,
      data: {
        drivers: sortedDrivers,
        total: sortedDrivers.length,
        available: sortedDrivers.filter(d => d.isAvailable).length,
        busy: sortedDrivers.filter(d => !d.isAvailable).length,
        online: sortedDrivers.filter(d => d.DriverAvailability.status === 'online').length,
        summary: {
          totalActive: sortedDrivers.length,
          readyForAssignment: sortedDrivers.filter(d => d.isAvailable).length,
          currentlyBusy: sortedDrivers.filter(d => !d.isAvailable).length,
        }
      }
    });

  } catch (error) {
    console.error('❌ Error fetching available drivers:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch available drivers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
