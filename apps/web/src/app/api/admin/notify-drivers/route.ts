import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Pusher from 'pusher';

// Initialize Pusher
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Allow unauthenticated calls for webhook notifications
    // Webhooks don't have user sessions but need to notify drivers
    const session = await getServerSession(authOptions);
    const isWebhookCall = !session?.user; // If no session, assume it's a webhook call

    if (!isWebhookCall && (!session?.user || (session.user as any).role !== 'admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { bookingId, jobData } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
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
        BookingItem: {
          select: {
            name: true,
            quantity: true,
          }
        }
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Find nearby online drivers (simplified - in real app use proper geospatial queries)
    const onlineDrivers = await prisma.driver.findMany({
      where: {
        DriverAvailability: {
          status: 'online',
          locationConsent: true,
        },
        onboardingStatus: 'approved',
        status: 'active',
      },
      include: {
        DriverAvailability: {
          select: {
            lastLat: true,
            lastLng: true,
          }
        }
      }
    });

    // Calculate distance and filter drivers based on their coverage type
    const nearbyDrivers = onlineDrivers.filter(driver => {
      // For UK-wide coverage drivers, include them regardless of distance
      // (in a real system, you'd check driver preferences for coverage type)
      const isUKWideDriver = true; // Assume all drivers have UK-wide coverage for now
      
      if (isUKWideDriver) {
        // UK-wide drivers can take jobs anywhere in the UK
        return true;
      }
      
      // For local drivers, check distance
      if (!driver.DriverAvailability?.lastLat || !driver.DriverAvailability?.lastLng) return false;
      if (!booking.pickupAddress?.lat || !booking.pickupAddress?.lng) return true; // Include all if no location data
      
      const distance = calculateDistance(
        driver.DriverAvailability.lastLat,
        driver.DriverAvailability.lastLng,
        booking.pickupAddress.lat,
        booking.pickupAddress.lng
      );
      
      return distance <= 25; // Within 25 miles for local drivers
    });

    // Calculate job details
    const distance = calculateDistance(
      booking.pickupAddress?.lat || 0,
      booking.pickupAddress?.lng || 0,
      booking.dropoffAddress?.lat || 0,
      booking.dropoffAddress?.lng || 0
    );

    // ✅ Calculate actual earnings using driverEarningsService (no percentage!)
    const { driverEarningsService } = await import('@/lib/services/driver-earnings-service');
    
    // We don't have a specific driver yet, so use a generic calculation
    const tempEarningsResult = await driverEarningsService.calculateEarnings({
      driverId: 'temp_driver',
      bookingId: booking.id,
      assignmentId: 'temp_assignment',
      customerPaymentPence: booking.totalGBP * 100, // Convert GBP to pence
      distanceMiles: distance,
      durationMinutes: booking.estimatedDurationMinutes || 60,
      dropCount: 1,
      hasHelper: false,
      urgencyLevel: 'standard',
      onTimeDelivery: true,
    });
    const estimatedEarnings = Math.floor(tempEarningsResult.breakdown.netEarnings);

    // Create job notification data
    const jobNotificationData = {
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
      totalAmount: booking.totalGBP,
      estimatedEarnings: estimatedEarnings,
      items: booking.BookingItem.map(item => ({
        name: item.name,
        quantity: item.quantity,
        size: 'Medium', // Default since size field doesn't exist
      })),
      specialInstructions: '', // notes field doesn't exist
      priority: determinePriority(booking),
      status: 'available',
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
      createdAt: booking.createdAt.toISOString(),
    };

    // Send notifications to nearby drivers
    let notificationsSent = 0;
    const notificationPromises = nearbyDrivers.map(async (driver) => {
      try {
        // Send real-time notification via Pusher
        await pusher.trigger(`driver-${driver.id}`, 'new-job', {
          job: jobNotificationData,
          driverDistance: driver.DriverAvailability?.lastLat && driver.DriverAvailability?.lastLng 
            ? calculateDistance(
                driver.DriverAvailability.lastLat,
                driver.DriverAvailability.lastLng,
                booking.pickupAddress?.lat || 0,
                booking.pickupAddress?.lng || 0
              ).toFixed(1)
            : 'Unknown',
        });

        // Create database notification
        await prisma.driverNotification.create({
          data: {
            driverId: driver.id,
            type: 'job_offer', // Using correct enum value
            title: 'New Job Available! 🚚',
            message: `${booking.pickupAddress?.postcode} → ${booking.dropoffAddress?.postcode} | £${(estimatedEarnings / 100).toFixed(2)}`,
            read: false,
          },
        });

        notificationsSent++;
        return true;
      } catch (error) {
        console.error(`Failed to notify driver ${driver.id}:`, error);
        return false;
      }
    });

    // Wait for all notifications to complete
    await Promise.allSettled(notificationPromises);

    // Also send to general driver notifications channel
    try {
      await pusher.trigger('driver-notifications', 'new-job', {
        job: jobNotificationData,
      });
    } catch (error) {
      console.error('Failed to send general driver notification:', error);
    }

    console.log('✅ Job notifications sent:', {
      bookingId: booking.id,
      bookingReference: booking.reference,
      nearbyDriversCount: nearbyDrivers.length,
      notificationsSent,
    });

    return NextResponse.json({
      success: true,
      message: `Job notifications sent to ${notificationsSent} nearby drivers`,
      data: {
        bookingReference: booking.reference,
        nearbyDriversCount: nearbyDrivers.length,
        notificationsSent,
        jobData: jobNotificationData,
      },
    });

  } catch (error) {
    console.error('❌ Error sending driver notifications:', error);
    return NextResponse.json(
      {
        error: 'Failed to send driver notifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Radius of Earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

function determinePriority(booking: any): 'normal' | 'high' | 'urgent' {
  const scheduledDate = booking.scheduledDate ? new Date(booking.scheduledDate) : new Date();
  const now = new Date();
  const hoursUntilScheduled = (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilScheduled < 2) return 'urgent';
  if (hoursUntilScheduled < 6) return 'high';
  return 'normal';
}
