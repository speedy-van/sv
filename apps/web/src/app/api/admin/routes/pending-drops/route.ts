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
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    console.log('📦 Admin fetching pending drops for route creation');

    // Get all bookings that are confirmed but don't have a route yet
    const pendingBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        route: null, // Not yet assigned to any route
      },
      select: {
        id: true,
        reference: true,
        pickupAddressId: true,
        dropoffAddressId: true,
        scheduledAt: true,
        totalGBP: true,
        customerName: true,
        pickupAddress: {
          select: {
            label: true,
            postcode: true,
            lat: true,
            lng: true,
          }
        },
        dropoffAddress: {
          select: {
            label: true,
            postcode: true,
            lat: true,
            lng: true,
          }
        },
        baseDistanceMiles: true,
        BookingItem: {
          select: {
            id: true,
            name: true,
            quantity: true,
            estimatedVolume: true,
            estimatedWeight: true,
          }
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      take: 100, // Limit to first 100 for performance
    });

    console.log(`✅ Found ${pendingBookings.length} pending bookings`);

    // Transform bookings into drop format
    const drops = pendingBookings.map((booking) => {
      const totalVolume = booking.BookingItem.reduce((sum: number, item: any) => 
        sum + ((item.estimatedVolume || 0) * item.quantity), 0
      );
      
      const totalWeight = booking.BookingItem.reduce((sum: number, item: any) => 
        sum + ((item.estimatedWeight || 0) * item.quantity), 0
      );

      // Calculate distance if coordinates available (in miles)
      let distance = 0;
      if (booking.pickupAddress?.lat && booking.pickupAddress?.lng && 
          booking.dropoffAddress?.lat && booking.dropoffAddress?.lng) {
        const R = 3958.8; // Earth's radius in miles
        const dLat = (booking.dropoffAddress.lat - booking.pickupAddress.lat) * Math.PI / 180;
        const dLon = (booking.dropoffAddress.lng - booking.pickupAddress.lng) * Math.PI / 180;
        const a = 
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(booking.pickupAddress.lat * Math.PI / 180) * 
          Math.cos(booking.dropoffAddress.lat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c;
      } else if (booking.baseDistanceMiles) {
        distance = booking.baseDistanceMiles; // Already in miles
      }

      return {
        id: booking.id,
        reference: booking.reference,
        pickupAddress: booking.pickupAddress?.label || 'Unknown',
        deliveryAddress: booking.dropoffAddress?.label || 'Unknown',
        pickupLat: booking.pickupAddress?.lat || null,
        pickupLng: booking.pickupAddress?.lng || null,
        dropoffLat: booking.dropoffAddress?.lat || null,
        dropoffLng: booking.dropoffAddress?.lng || null,
        distance: distance > 0 ? distance : null,
        timeWindowStart: booking.scheduledAt || new Date(),
        timeWindowEnd: new Date((booking.scheduledAt || new Date()).getTime() + 2 * 60 * 60 * 1000), // +2 hours
        quotedPrice: booking.totalGBP,
        weight: totalWeight || 50,
        volume: totalVolume || 1.0,
        serviceTier: 'standard',
        customerName: booking.customerName,
        scheduledAt: booking.scheduledAt,
        status: 'CONFIRMED',
      };
    });

    return NextResponse.json({
      success: true,
      drops,
      totalCount: drops.length,
    });

  } catch (error) {
    console.error('❌ Error fetching pending drops:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch pending drops',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

