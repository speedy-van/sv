/**
 * Driver Matching Service - Broadcast and Timeout
 * 
 * Handles:
 * - Broadcasting jobs to nearest 3-5 drivers
 * - First-acceptance-wins logic
 * - 10-15 minute timeout
 * - Payment capture/cancel based on driver response
 */

import { prisma } from '@/lib/prisma';
import Pusher from 'pusher';
import Stripe from 'stripe';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

const MATCH_TIMEOUT_MINUTES = 15;
const MAX_DRIVERS_TO_BROADCAST = 5;
const SEARCH_RADIUS_KM = 25;

export interface DriverMatchResult {
  success: boolean;
  driverId?: string;
  driverName?: string;
  error?: string;
}

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Broadcast job to nearest available drivers
 */
export async function broadcastJobToDrivers(bookingId: string): Promise<void> {
  console.log('[MATCH] Starting driver broadcast for booking:', bookingId);

  try {
    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        BookingItem: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    if (!booking.pickupLat || !booking.pickupLng) {
      throw new Error('Booking has no pickup coordinates');
    }

    // Find available drivers
    const availableDrivers = await prisma.driver.findMany({
      where: {
        DriverAvailability: {
          status: 'online',
        },
        User: {
          isActive: true,
        },
      },
      include: {
        User: {
          select: {
            name: true,
            phone: true,
          },
        },
        DriverLocation: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
        },
      },
    });

    console.log('[MATCH] Found available drivers:', availableDrivers.length);

    // Calculate distance to each driver and sort by proximity
    const driversWithDistance = availableDrivers
      .filter(d => d.DriverLocation[0]?.lat && d.DriverLocation[0]?.lng)
      .map(driver => {
        const distance = calculateDistance(
          booking.pickupLat!,
          booking.pickupLng!,
          driver.DriverLocation[0].lat!,
          driver.DriverLocation[0].lng!
        );
        return { driver, distance };
      })
      .filter(d => d.distance <= SEARCH_RADIUS_KM)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_DRIVERS_TO_BROADCAST);

    console.log('[MATCH] Drivers within radius:', driversWithDistance.length);

    if (driversWithDistance.length === 0) {
      throw new Error('No drivers available within radius');
    }

    // Create assignments for each driver
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + MATCH_TIMEOUT_MINUTES);

    for (const { driver, distance } of driversWithDistance) {
      await prisma.assignment.create({
        data: {
          bookingId: booking.id,
          driverId: driver.id,
          status: 'invited',
          round: booking.matchAttempts + 1,
          score: Math.round((1 - distance / SEARCH_RADIUS_KM) * 100), // 100 = closest, 0 = furthest
          expiresAt,
        },
      });

      // Send push notification to driver
      try {
        await pusher.trigger(`driver-${driver.id}`, 'job-offer', {
          bookingId: booking.id,
          reference: booking.reference,
          pickupAddress: booking.pickupAddress?.label || 'Pickup address',
          dropoffAddress: booking.dropoffAddress?.label || 'Drop-off address',
          scheduledAt: booking.scheduledAt.toISOString(),
          distance: Math.round(distance * 10) / 10, // Round to 1 decimal
          estimatedEarnings: calculateDriverEarnings(booking.totalGBP / 100),
          expiresAt: expiresAt.toISOString(),
          itemCount: booking.BookingItem?.length || 0,
        });
      } catch (pushError) {
        console.error(`[MATCH] Failed to send push to driver ${driver.id}:`, pushError);
      }
    }

    // Update booking match status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        matchAttempts: booking.matchAttempts + 1,
        matchStartTime: new Date(),
      },
    });

    // Schedule timeout check
    setTimeout(() => checkMatchTimeout(bookingId), MATCH_TIMEOUT_MINUTES * 60 * 1000);

    console.log('[MATCH] Broadcast complete:', {
      bookingId,
      driversNotified: driversWithDistance.length,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('[MATCH] Broadcast failed:', error);
    throw error;
  }
}

/**
 * Handle driver acceptance
 */
export async function handleDriverAcceptance(bookingId: string, driverId: string): Promise<DriverMatchResult> {
  console.log('[MATCH] Processing driver acceptance:', { bookingId, driverId });

  try {
    // Check if booking is still available
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        reference: true,
        status: true,
        driverId: true,
        stripePaymentIntentId: true,
        totalGBP: true,
      },
    });

    if (!booking) {
      return { success: false, error: 'Booking not found' };
    }

    if (booking.status !== 'PENDING_MATCH') {
      return { success: false, error: 'Booking is no longer available' };
    }

    if (booking.driverId) {
      return { success: false, error: 'Booking already assigned to another driver' };
    }

    // Get driver details
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        User: {
          select: { name: true },
        },
      },
    });

    if (!driver) {
      return { success: false, error: 'Driver not found' };
    }

    // Assign driver and update booking
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        driverId: driverId,
        status: 'DRIVER_CONFIRMED',
      },
    });

    // Update assignment status
    await prisma.assignment.updateMany({
      where: {
        bookingId: bookingId,
        driverId: driverId,
      },
      data: {
        status: 'accepted',
        claimedAt: new Date(),
      },
    });

    // Reject other pending assignments
    await prisma.assignment.updateMany({
      where: {
        bookingId: bookingId,
        driverId: { not: driverId },
        status: 'invited',
      },
      data: {
        status: 'rejected',
      },
    });

    // Capture payment or create PaymentIntent based on booking type
    if (booking.savedPaymentMethodId && booking.stripeCustomerId) {
      // FAR BOOKING: Create and confirm PaymentIntent using saved payment method
      try {
        console.log('[MATCH] Creating PaymentIntent for far booking with saved card');
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: booking.totalGBP * 100, // Convert pounds to pence
          currency: 'gbp',
          customer: booking.stripeCustomerId,
          payment_method: booking.savedPaymentMethodId,
          confirm: true,
          metadata: {
            bookingId: booking.id,
            bookingReference: booking.reference,
            driverId: driverId,
          },
        });

        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            stripePaymentIntentId: paymentIntent.id,
            paymentCaptured: true,
            paymentCapturedAt: new Date(),
            status: 'CONFIRMED',
          },
        });

        console.log('[MATCH] Far booking payment charged successfully:', paymentIntent.id);
      } catch (paymentError) {
        console.error('[MATCH] Far booking payment failed:', paymentError);
        // Revert driver assignment if payment fails
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            driverId: null,
            status: 'PENDING_MATCH',
          },
        });
        throw paymentError;
      }
    } else if (booking.stripePaymentIntentId) {
      // NEAR BOOKING: Capture existing authorized payment
      try {
        await stripe.paymentIntents.capture(booking.stripePaymentIntentId);
        
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            paymentCaptured: true,
            paymentCapturedAt: new Date(),
            status: 'CONFIRMED',
          },
        });

        console.log('[MATCH] Near booking payment captured successfully');
      } catch (captureError) {
        console.error('[MATCH] Payment capture failed:', captureError);
        // Continue anyway - admin can manually capture
      }
    } else {
      console.warn('[MATCH] No payment method available for booking:', bookingId);
    }

    console.log('[MATCH] Driver assigned successfully:', {
      bookingId,
      driverId,
      driverName: driver.User.name,
    });

    return {
      success: true,
      driverId: driverId,
      driverName: driver.User.name,
    };

  } catch (error) {
    console.error('[MATCH] Acceptance handling failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if match timeout has occurred
 */
async function checkMatchTimeout(bookingId: string): Promise<void> {
  console.log('[MATCH] Checking timeout for booking:', bookingId);

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        reference: true,
        status: true,
        stripePaymentIntentId: true,
        customerEmail: true,
        customerName: true,
        matchAttempts: true,
      },
    });

    if (!booking) {
      console.log('[MATCH] Booking not found during timeout check');
      return;
    }

    // If already matched or cancelled, do nothing
    if (booking.status !== 'PENDING_MATCH') {
      console.log('[MATCH] Booking already resolved:', booking.status);
      return;
    }

    console.log('[MATCH] No driver found within timeout period');

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'NO_DRIVER_AVAILABLE',
      },
    });

    // Notify customer about alternatives (don't cancel payment yet)
    // This allows customer to choose: time shift, surge price, or cancel

    console.log('[MATCH] Booking marked as no driver available:', bookingId);

  } catch (error) {
    console.error('[MATCH] Timeout check failed:', error);
  }
}

/**
 * Calculate estimated driver earnings
 */
function calculateDriverEarnings(totalGBP: number): number {
  // Driver gets approximately 65-70% of booking value
  return Math.round(totalGBP * 0.67 * 100) / 100;
}

export const DriverMatchingService = {
  broadcastJobToDrivers,
  handleDriverAcceptance,
};
