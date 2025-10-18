import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface PreviewRequest {
  maxDropsPerRoute: number;
  maxDistanceKm: number;
  optimizeBy: 'distance' | 'time' | 'area';
  autoAssign: boolean;
  driverIds?: string[];
}

// Simple haversine distance calculation
function calculateDistance( // DEPRECATED - internal use only
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Extract approximate coordinates from UK postcode
function getPostcodeCoordinates(postcode: string): { lat: number; lng: number } | null {
  // This is a simplified version - in production, use a proper geocoding service
  // For now, we'll use postcode area approximations
  const area = postcode.trim().toUpperCase().match(/^([A-Z]{1,2})/)?.[1];
  
  const postcodeAreas: Record<string, { lat: number; lng: number }> = {
    'E': { lat: 51.5144, lng: -0.0235 },   // East London
    'W': { lat: 51.5074, lng: -0.1278 },   // West London
    'N': { lat: 51.5574, lng: -0.1089 },   // North London
    'S': { lat: 51.4532, lng: -0.0897 },   // South London
    'SW': { lat: 51.4615, lng: -0.1417 },  // Southwest London
    'SE': { lat: 51.4649, lng: 0.0075 },   // Southeast London
    'NW': { lat: 51.5428, lng: -0.2123 },  // Northwest London
    'EC': { lat: 51.5177, lng: -0.0928 },  // East Central London
    'WC': { lat: 51.5155, lng: -0.1255 },  // West Central London
    'ML': { lat: 55.8642, lng: -3.9932 },  // Motherwell
    'G': { lat: 55.8642, lng: -4.2518 },   // Glasgow
    'M': { lat: 53.4808, lng: -2.2426 },   // Manchester
    'B': { lat: 52.4862, lng: -1.8904 },   // Birmingham
  };

  return postcodeAreas[area || ''] || { lat: 51.5074, lng: -0.1278 }; // Default to London
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: PreviewRequest = await request.json();
    const { maxDropsPerRoute, maxDistanceKm, optimizeBy, autoAssign, driverIds } = body;

    console.log('🔍 Generating route preview:', { 
      maxDropsPerRoute, 
      maxDistanceKm, 
      optimizeBy, 
      autoAssign 
    });

    // Get pending bookings
    const pendingBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        route: null,
      },
      select: {
        id: true,
        reference: true,
        pickupAddressId: true,
        dropoffAddressId: true,
        scheduledAt: true,
        totalGBP: true,
        pickupAddress: {
          select: {
            label: true,
            postcode: true,
          }
        },
        dropoffAddress: {
          select: {
            label: true,
            postcode: true,
          }
        },
        BookingItem: {
          select: {
            id: true,
            quantity: true,
            estimatedVolume: true,
            estimatedWeight: true,
          }
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      take: 100,
    });

    if (pendingBookings.length === 0) {
      return NextResponse.json({
        success: true,
        proposedRoutes: [],
        message: 'No pending bookings to create routes from',
      });
    }

    // Get available drivers
    let availableDrivers: any[] = [];
    if (autoAssign) {
      availableDrivers = await prisma.driver.findMany({
        where: {
          status: 'active',
          onboardingStatus: 'approved',
          DriverAvailability: {
            status: 'online',
          },
        },
        select: {
          id: true,
          User: {
            select: {
              name: true,
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
            }
          },
        },
        orderBy: {
          rating: 'desc',
        },
      });
    } else if (driverIds && driverIds.length > 0) {
      availableDrivers = await prisma.driver.findMany({
        where: {
          id: { in: driverIds },
          status: 'active',
        },
        select: {
          id: true,
          User: {
            select: {
              name: true,
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
            }
          },
        },
      });
    }

    // Simple clustering algorithm
    const routes: any[] = [];
    const unassignedBookings = [...pendingBookings];
    let routeIndex = 0;

    while (unassignedBookings.length > 0 && routeIndex < 50) {
      const routeBookings: typeof pendingBookings = [];
      const seed = unassignedBookings.shift();
      
      if (!seed) break;
      
      routeBookings.push(seed);
      const seedCoords = getPostcodeCoordinates(seed.pickupAddress?.postcode || '');

      // Add nearby bookings to this route
      for (let i = unassignedBookings.length - 1; i >= 0; i--) {
        if (routeBookings.length >= maxDropsPerRoute) break;

        const booking = unassignedBookings[i];
        const bookingCoords = getPostcodeCoordinates(booking.pickupAddress?.postcode || '');

        if (!seedCoords || !bookingCoords) continue;

        const distance = calculateDistance( // DEPRECATED - internal use only
          seedCoords.lat,
          seedCoords.lng,
          bookingCoords.lat,
          bookingCoords.lng
        );

        // If within reasonable distance, add to route
        if (distance <= maxDistanceKm / 2) {
          routeBookings.push(booking);
          unassignedBookings.splice(i, 1);
        }
      }

      // Calculate route metrics
      const totalValue = routeBookings.reduce((sum, b) => sum + b.totalGBP, 0);
      const totalVolume = routeBookings.reduce((sum, b) => 
        sum + b.BookingItem.reduce((itemSum: number, item: any) => 
          itemSum + ((item.estimatedVolume || 0) * item.quantity), 0
        ), 0
      );

      // Assign driver if auto-assign is enabled
      let assignedDriver = null;
      if (availableDrivers.length > 0) {
        // Find driver with least active assignments
        assignedDriver = availableDrivers.reduce((min, driver) => 
          driver.Assignment.length < min.Assignment.length ? driver : min
        );
      }

      routes.push({
        id: `preview-${routeIndex}`,
        drops: routeBookings.map(b => b.id),
        driverId: assignedDriver?.id || null,
        driverName: assignedDriver?.User?.name || 'Unassigned',
        totalDrops: routeBookings.length,
        estimatedDistance: routeBookings.length * 8.5, // Rough estimate: 8.5km per drop
        estimatedDuration: routeBookings.length * 30, // 30 minutes per drop
        totalValue: totalValue,
        totalVolume: totalVolume,
      });

      routeIndex++;
    }

    console.log(`✅ Generated ${routes.length} proposed routes from ${pendingBookings.length} bookings`);

    return NextResponse.json({
      success: true,
      proposedRoutes: routes,
      totalBookings: pendingBookings.length,
      unassignedBookings: unassignedBookings.length,
    });

  } catch (error) {
    console.error('❌ Error generating route preview:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate preview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

