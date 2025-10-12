import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/booking-luxury/[id]/track - Get booking tracking information
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const bookingId = params.id;

    // Find the booking with tracking information
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                isActive: true
              }
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check authorization - allow tracking for any user with the booking ID
    // This enables guest tracking functionality
    if (session?.user?.role !== 'admin' && 
        booking.customerId && 
        booking.customerId !== session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get driver location if available
    let driverLocation = null;
    if (booking.driver) {
      // Driver location tracking would be implemented here
      // For now, we'll return null as the driverLocation table doesn't exist yet
      driverLocation = null;
    }

    // Calculate estimated arrival time based on current status
    let estimatedArrival = null;
    if (booking.status === 'CONFIRMED') {
      // Estimate pickup time for confirmed bookings
      estimatedArrival = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
    } else if (booking.status === 'COMPLETED') {
      // Already completed
      estimatedArrival = booking.updatedAt;
    }

    return NextResponse.json({
      success: true,
      tracking: {
        booking: {
          id: booking.id,
          reference: booking.reference,
          status: booking.status,
          scheduledAt: booking.scheduledAt,
          estimatedDurationMinutes: booking.estimatedDurationMinutes,
        },
        customer: {
          name: booking.customerName,
          phone: booking.customerPhone,
        },
        addresses: {
          pickup: {
            label: booking.pickupAddress?.label,
            postcode: booking.pickupAddress?.postcode,
            lat: booking.pickupAddress?.lat,
            lng: booking.pickupAddress?.lng,
          },
          dropoff: {
            label: booking.dropoffAddress?.label,
            postcode: booking.dropoffAddress?.postcode,
            lat: booking.dropoffAddress?.lat,
            lng: booking.dropoffAddress?.lng,
          },
        },
        driver: booking.driver ? {
          id: booking.driver.id,
          name: booking.driver.user?.name,
          phone: booking.driver.user?.email, // Using email as phone is not available in user model
          location: driverLocation,
        } : null,
        timeline: [
          {
            status: 'PENDING_PAYMENT',
            timestamp: booking.createdAt,
            completed: ['PENDING_PAYMENT', 'CONFIRMED', 'ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'AT_PICKUP', 'EN_ROUTE_TO_DROPOFF', 'AT_DROPOFF', 'COMPLETED'].includes(booking.status),
          },
          {
            status: 'CONFIRMED',
            timestamp: booking.updatedAt,
            completed: ['CONFIRMED', 'ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'AT_PICKUP', 'EN_ROUTE_TO_DROPOFF', 'AT_DROPOFF', 'COMPLETED'].includes(booking.status),
          },
          {
            status: 'ASSIGNED',
            timestamp: booking.driver ? booking.updatedAt : null,
            completed: ['ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'AT_PICKUP', 'EN_ROUTE_TO_DROPOFF', 'AT_DROPOFF', 'COMPLETED'].includes(booking.status),
          },
          {
            status: 'EN_ROUTE_TO_PICKUP',
            timestamp: ['EN_ROUTE_TO_PICKUP', 'AT_PICKUP', 'EN_ROUTE_TO_DROPOFF', 'AT_DROPOFF', 'COMPLETED'].includes(booking.status) ? booking.updatedAt : null,
            completed: ['AT_PICKUP', 'EN_ROUTE_TO_DROPOFF', 'AT_DROPOFF', 'COMPLETED'].includes(booking.status),
          },
          {
            status: 'AT_PICKUP',
            timestamp: ['AT_PICKUP', 'EN_ROUTE_TO_DROPOFF', 'AT_DROPOFF', 'COMPLETED'].includes(booking.status) ? booking.updatedAt : null,
            completed: ['EN_ROUTE_TO_DROPOFF', 'AT_DROPOFF', 'COMPLETED'].includes(booking.status),
          },
          {
            status: 'EN_ROUTE_TO_DROPOFF',
            timestamp: ['EN_ROUTE_TO_DROPOFF', 'AT_DROPOFF', 'COMPLETED'].includes(booking.status) ? booking.updatedAt : null,
            completed: ['AT_DROPOFF', 'COMPLETED'].includes(booking.status),
          },
          {
            status: 'AT_DROPOFF',
            timestamp: ['AT_DROPOFF', 'COMPLETED'].includes(booking.status) ? booking.updatedAt : null,
            completed: ['COMPLETED'].includes(booking.status),
          },
          {
            status: 'COMPLETED',
            timestamp: booking.status === 'COMPLETED' ? booking.updatedAt : null,
            completed: booking.status === 'COMPLETED',
          },
        ],
        estimatedArrival,
        lastUpdated: booking.updatedAt,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching booking tracking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking information' },
      { status: 500 }
    );
  }
}
