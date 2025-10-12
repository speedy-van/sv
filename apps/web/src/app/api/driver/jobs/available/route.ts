import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || (session.user as any).role !== 'driver') {
      return NextResponse.json(
        { error: 'Unauthorized - Driver access required' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    // Get driver record
    const driver = await prisma.driver.findUnique({
      where: { userId: userId },
      select: { 
        id: true,
        basePostcode: true,
        availability: {
          select: {
            status: true,
            lastLat: true,
            lastLng: true,
          }
        }
      },
    });

    if (!driver) {
      return NextResponse.json(
        { error: 'Driver record not found' },
        { status: 404 }
      );
    }

    // Get available jobs that are not assigned and not cancelled
    const availableJobs = await prisma.booking.findMany({
      where: {
        OR: [
          {
            status: 'CONFIRMED',
            driverId: null,
          },
          {
            status: 'PENDING_PAYMENT',
            driverId: null,
            createdAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Orders created in last 5 minutes
            }
          }
        ],
        NOT: {
          status: 'CANCELLED'
        }
      },
      select: {
        id: true,
        reference: true,
        status: true,
        customerName: true,
        customerPhone: true,
        totalGBP: true,
        createdAt: true,
        driverId: true,
        scheduledAt: true,
        pickupTimeSlot: true,
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
        items: {
          select: {
            name: true,
            quantity: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50, // Increased limit for UK-wide coverage
    });

    // Transform jobs to match frontend interface
    const transformedJobs = availableJobs.map(booking => {
      // Calculate estimated distance (simplified)
      // Note: For UK-wide coverage, we show all jobs regardless of driver location
      const distance = calculateDistance(
        booking.pickupAddress?.lat || 0,
        booking.pickupAddress?.lng || 0,
        booking.dropoffAddress?.lat || 0,
        booking.dropoffAddress?.lng || 0
      );

      // ✅ Calculate actual earnings using driverEarningsService
      const { driverEarningsService } = await import('@/lib/services/driver-earnings-service');
      const earningsResult = await driverEarningsService.calculateEarnings({
        driverId: driver.id,
        bookingId: booking.id,
        assignmentId: 'temp_' + booking.id,
        bookingAmount: booking.totalGBP,
        distanceMiles: distance,
        durationMinutes: booking.estimatedDurationMinutes || 60,
        dropCount: 1,
        hasHelper: false,
        urgencyLevel: 'standard',
        isOnTime: true,
      });
      const estimatedEarnings = Math.floor(earningsResult.breakdown.netEarnings);

      return {
        id: booking.id,
        bookingReference: booking.reference,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone || '',
        pickupAddress: {
          label: booking.pickupAddress?.label || '',
          postcode: booking.pickupAddress?.postcode || '',
          lat: booking.pickupAddress?.lat || 0,
          lng: booking.pickupAddress?.lng || 0,
        },
        dropoffAddress: {
          label: booking.dropoffAddress?.label || '',
          postcode: booking.dropoffAddress?.postcode || '',
          lat: booking.dropoffAddress?.lat || 0,
          lng: booking.dropoffAddress?.lng || 0,
        },
        scheduledDate: booking.scheduledAt?.toISOString() || new Date().toISOString(),
        timeSlot: booking.pickupTimeSlot || 'Flexible',
        estimatedDuration: Math.ceil(distance / 20),
        distance: distance,
        // Only show driver payout - never expose customer total
        estimatedEarnings: estimatedEarnings,
        items: booking.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          size: 'Medium', // Default size since field doesn't exist
        })),
        specialInstructions: '', // customerNotes field doesn't exist
        priority: determinePriority(booking),
        status: 'available',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        createdAt: booking.createdAt.toISOString(),
      };
    });

    console.log('✅ Available jobs loaded for driver:', driver.id, 'Jobs count:', transformedJobs.length);

    return NextResponse.json({
      success: true,
      data: transformedJobs,
    });

  } catch (error) {
    console.error('❌ Error fetching available jobs:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch available jobs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

// Helper function to determine job priority
function determinePriority(booking: any): 'normal' | 'high' | 'urgent' {
  const scheduledDate = booking.scheduledAt ? new Date(booking.scheduledAt) : new Date();
  const now = new Date();
  const hoursUntilScheduled = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilScheduled < 2) return 'urgent';
  if (hoursUntilScheduled < 6) return 'high';
  return 'normal';
}
