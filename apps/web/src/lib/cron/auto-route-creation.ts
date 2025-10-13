/**
 * Auto Route Creation Cron Job
 * 
 * Runs every hour to automatically create optimized routes from pending bookings.
 * This is a critical job that ensures bookings are assigned to drivers efficiently.
 */

import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { getPusherServer } from '@/lib/pusher';
import { multiDropEligibilityEngine } from '@/lib/services/multi-drop-eligibility-engine';
import { intelligentRouteOptimizer } from '@/lib/services/intelligent-route-optimizer';

let cronJob: cron.ScheduledTask | null = null;

/**
 * Start the auto route creation cron job
 * Called automatically when server starts
 */
export function startAutoRouteCreationCron() {
  // Prevent multiple cron jobs
  if (cronJob) {
    console.log('⚠️ Auto route creation cron already running');
    return;
  }

  // Run every hour: 0 * * * *
  cronJob = cron.schedule('0 * * * *', async () => {
    try {
      await createRoutesAutomatically();
    } catch (error) {
      console.error('❌ Error in auto route creation cron:', error);
    }
  });

  console.log('✅ Auto route creation cron job started (runs every hour)');
}

/**
 * Stop the auto route creation cron job
 * Useful for testing or graceful shutdown
 */
export function stopAutoRouteCreationCron() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('🛑 Auto route creation cron job stopped');
  }
}

/**
 * Main function to create routes automatically
 */
async function createRoutesAutomatically() {
  const now = new Date();
  console.log(`🚛 [${now.toISOString()}] Starting automatic route creation...`);

  try {
    // 1. Get all confirmed bookings without routes (next 24 hours)
    const pendingBookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        routeId: null,
        scheduledAt: {
          gte: now,
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        BookingItem: true,
        pickupAddress: true,
        dropoffAddress: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledAt: 'asc' },
      ],
    });

    if (pendingBookings.length === 0) {
      console.log('✅ No pending bookings to process');
      return;
    }

    console.log(`📦 Found ${pendingBookings.length} pending bookings`);

    // 2. Analyze multi-drop eligibility for each booking
    let eligibleCount = 0;
    let ineligibleCount = 0;

    for (const booking of pendingBookings) {
      try {
        // Check if already analyzed
        if (booking.eligibleForMultiDrop !== null && booking.multiDropEligibilityReason) {
          continue;
        }

        // Analyze eligibility
        const eligibility = await multiDropEligibilityEngine.checkEligibility({
          bookingId: booking.id,
          items: booking.BookingItem.map(item => ({
            name: item.name,
            quantity: item.quantity,
            category: item.category || 'furniture',
            estimatedVolume: item.estimatedVolume || 0,
            estimatedWeight: item.estimatedWeight || 0,
          })),
          pickupAddress: {
            lat: booking.pickupAddress.lat || 0,
            lng: booking.pickupAddress.lng || 0,
            postcode: booking.pickupAddress.postcode,
            city: booking.pickupAddress.city,
          },
          dropoffAddress: {
            lat: booking.dropoffAddress.lat || 0,
            lng: booking.dropoffAddress.lng || 0,
            postcode: booking.dropoffAddress.postcode,
            city: booking.dropoffAddress.city,
          },
          scheduledDate: booking.scheduledAt,
          urgency: booking.urgency || 'standard',
        });

        // Update booking with eligibility info
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            eligibleForMultiDrop: eligibility.eligible,
            multiDropEligibilityReason: eligibility.reason,
            estimatedLoadPercentage: eligibility.loadPercentage,
            potentialSavings: eligibility.potentialSavings,
            orderType: eligibility.eligible ? 'multi-drop-candidate' : 'single',
          },
        });

        if (eligibility.eligible) {
          eligibleCount++;
          console.log(`✅ Booking ${booking.reference} is eligible for multi-drop (${eligibility.reason})`);
        } else {
          ineligibleCount++;
          console.log(`❌ Booking ${booking.reference} is NOT eligible (${eligibility.reason})`);
        }
      } catch (error) {
        console.error(`❌ Error analyzing booking ${booking.reference}:`, error);
      }
    }

    console.log(`📊 Eligibility analysis complete: ${eligibleCount} eligible, ${ineligibleCount} ineligible`);

    // 3. Group bookings by time window and region
    const bookingGroups = await groupBookingsByTimeAndRegion(pendingBookings);
    console.log(`📍 Grouped bookings into ${bookingGroups.length} regional groups`);

    // 4. Create optimized routes for each group
    let routesCreated = 0;
    let dropsAssigned = 0;
    let unassignedBookings = 0;

    for (const group of bookingGroups) {
      try {
        const result = await createOptimizedRoutesForGroup(group);
        routesCreated += result.routesCreated;
        dropsAssigned += result.dropsAssigned;
        unassignedBookings += result.unassignedBookings;
      } catch (error) {
        console.error(`❌ Error creating routes for group:`, error);
      }
    }

    console.log(`✅ Route creation complete:`);
    console.log(`   • Routes created: ${routesCreated}`);
    console.log(`   • Drops assigned: ${dropsAssigned}`);
    console.log(`   • Unassigned bookings: ${unassignedBookings}`);

    // 5. Notify admin if there are unassigned bookings
    if (unassignedBookings > 0) {
      await notifyAdminAboutUnassignedBookings(unassignedBookings);
    }

    // 6. Notify available drivers about new routes
    await notifyDriversAboutNewRoutes(routesCreated);

  } catch (error) {
    console.error('❌ Error in auto route creation:', error);
    throw error;
  }
}

/**
 * Group bookings by time window and geographical region
 */
async function groupBookingsByTimeAndRegion(bookings: any[]) {
  const groups: any[] = [];

  // Group by 4-hour time windows
  const timeWindows = [
    { start: 6, end: 10, name: 'morning' },
    { start: 10, end: 14, name: 'midday' },
    { start: 14, end: 18, name: 'afternoon' },
    { start: 18, end: 22, name: 'evening' },
  ];

  for (const window of timeWindows) {
    const windowBookings = bookings.filter(b => {
      const hour = b.scheduledAt.getHours();
      return hour >= window.start && hour < window.end;
    });

    if (windowBookings.length === 0) continue;

    // Further group by region (using first part of postcode)
    const regionMap = new Map<string, any[]>();

    for (const booking of windowBookings) {
      const region = booking.pickupAddress.postcode.split(' ')[0]; // e.g., "M1" from "M1 1AA"
      
      if (!regionMap.has(region)) {
        regionMap.set(region, []);
      }
      
      regionMap.get(region)!.push(booking);
    }

    // Create groups
    for (const [region, regionBookings] of regionMap.entries()) {
      groups.push({
        timeWindow: window.name,
        region,
        bookings: regionBookings,
      });
    }
  }

  return groups;
}

/**
 * Create optimized routes for a group of bookings
 */
async function createOptimizedRoutesForGroup(group: any) {
  console.log(`🔧 Creating routes for ${group.region} (${group.timeWindow}): ${group.bookings.length} bookings`);

  let routesCreated = 0;
  let dropsAssigned = 0;
  let unassignedBookings = 0;

  // Separate eligible and ineligible bookings
  const eligibleBookings = group.bookings.filter((b: any) => b.eligibleForMultiDrop);
  const ineligibleBookings = group.bookings.filter((b: any) => !b.eligibleForMultiDrop);

  // 1. Create multi-drop routes from eligible bookings
  if (eligibleBookings.length >= 2) {
    try {
      const multiDropResult = await createMultiDropRoutes(eligibleBookings);
      routesCreated += multiDropResult.routesCreated;
      dropsAssigned += multiDropResult.dropsAssigned;
    } catch (error) {
      console.error('❌ Error creating multi-drop routes:', error);
    }
  }

  // 2. Create single-order routes for ineligible bookings
  for (const booking of ineligibleBookings) {
    try {
      await createSingleOrderRoute(booking);
      routesCreated++;
      dropsAssigned++;
    } catch (error) {
      console.error(`❌ Error creating single route for ${booking.reference}:`, error);
      unassignedBookings++;
    }
  }

  return {
    routesCreated,
    dropsAssigned,
    unassignedBookings,
  };
}

/**
 * Create multi-drop routes from eligible bookings
 */
async function createMultiDropRoutes(bookings: any[]) {
  // ✅ FIX #1: Add validation before creating routes
  console.log(`🔍 Validating ${bookings.length} bookings for multi-drop routes...`);
  
  // Use intelligent route optimizer to create optimal routes
  const routes = await intelligentRouteOptimizer.createOptimalRoutes(
    bookings.map(b => ({
      bookingId: b.id,
      pickupLat: b.pickupAddress.lat,
      pickupLng: b.pickupAddress.lng,
      dropoffLat: b.dropoffAddress.lat,
      dropoffLng: b.dropoffAddress.lng,
      scheduledAt: b.scheduledAt,
      loadPercentage: b.estimatedLoadPercentage || 0,
      priority: b.priority || 5,
      value: b.totalGBP / 100,
    }))
  );

  let routesCreated = 0;
  let dropsAssigned = 0;

  for (const route of routes) {
    try {
      // ✅ FIX #1: Validate route before creating
      const validation = await validateRoute(route, bookings);
      
      if (!validation.feasible) {
        console.warn(`⚠️ Route not feasible: ${validation.reason}`);
        continue; // Skip this route
      }
      
      // ✅ FIX #4: Validate time windows
      if (!validation.timeWindowsValid) {
        console.warn(`⚠️ Time windows cannot be met for this route`);
        continue;
      }
      
      // Create route in database
      const createdRoute = await prisma.route.create({
        data: {
          id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'planned',
          driverId: 'unassigned',
          totalDistanceMiles: route.totalDistance,
          totalDurationMinutes: route.totalDuration,
          totalOutcome: route.totalValue,
          optimizationScore: route.optimizationScore,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // ✅ FIX #2: Recalculate prices for multi-drop and process refunds
      for (let i = 0; i < route.bookingIds.length; i++) {
        const booking = bookings.find((b: any) => b.id === route.bookingIds[i]);
        
        if (booking) {
          // Recalculate price with multi-drop discount
          const newPrice = await recalculateMultiDropPrice(booking, route, bookings.length);
          
          // Process refund if customer paid more
          if (newPrice.refundAmount > 0) {
            await processCustomerRefund(booking.id, newPrice.refundAmount);
            console.log(`💰 Refund £${(newPrice.refundAmount / 100).toFixed(2)} to customer ${booking.reference}`);
          }
          
          // Update booking
          await prisma.booking.update({
            where: { id: route.bookingIds[i] },
            data: {
              routeId: createdRoute.id,
              deliverySequence: i + 1,
              orderType: 'multi-drop',
              multiDropDiscount: newPrice.discountAmount,
              totalGBP: newPrice.newTotalPence,
            },
          });
          dropsAssigned++;
        }
      }

      routesCreated++;
      console.log(`✅ Created multi-drop route ${createdRoute.id} with ${route.bookingIds.length} stops (validated & prices recalculated)`);
    } catch (error) {
      console.error('❌ Error saving multi-drop route:', error);
    }
  }

  return { routesCreated, dropsAssigned };
}

/**
 * Create a single-order route for one booking
 */
async function createSingleOrderRoute(booking: any) {
  const route = await prisma.route.create({
    data: {
      id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'planned',
      driverId: 'unassigned',
      totalDistanceMiles: booking.baseDistanceMiles,
      totalDurationMinutes: booking.estimatedDurationMinutes,
      totalOutcome: booking.totalGBP / 100,
      optimizationScore: 100, // Single orders are always "optimized"
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      routeId: route.id,
      deliverySequence: 1,
      orderType: 'single',
    },
  });

  console.log(`✅ Created single-order route ${route.id} for booking ${booking.reference}`);
}

/**
 * Notify admin about unassigned bookings
 */
async function notifyAdminAboutUnassignedBookings(count: number) {
  try {
    await prisma.adminNotification.create({
      data: {
        type: 'route_creation_warning',
        title: 'Unassigned Bookings',
        message: `${count} booking(s) could not be assigned to routes automatically. Manual intervention required.`,
        priority: 'high',
        actionUrl: '/admin/orders/pending',
        createdAt: new Date(),
      },
    });

    const pusher = getPusherServer();
    await pusher.trigger('admin-notifications', 'unassigned-bookings', {
      count,
      timestamp: new Date().toISOString(),
    });

    console.log(`⚠️ Notified admin about ${count} unassigned bookings`);
  } catch (error) {
    console.error('❌ Error notifying admin:', error);
  }
}

/**
 * Notify available drivers about new routes
 */
async function notifyDriversAboutNewRoutes(routeCount: number) {
  try {
    // Get all planned routes (not yet assigned)
    const plannedRoutes = await prisma.route.findMany({
      where: {
        status: 'planned',
        driverId: 'unassigned',
      },
      include: {
        Booking: {
          select: {
            id: true,
            reference: true,
            totalGBP: true,
            scheduledAt: true,
          },
        },
      },
      take: 10, // Limit to 10 most recent
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (plannedRoutes.length === 0) {
      return;
    }

    // Get available drivers
    const availableDrivers = await prisma.driver.findMany({
      where: {
        status: 'active',
        onboardingStatus: 'approved',
        DriverAvailability: {
          status: { in: ['online', 'available'] },
        },
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      take: 20,
    });

    if (availableDrivers.length === 0) {
      console.log('⚠️ No available drivers to notify');
      return;
    }

    // Notify each driver
    const pusher = getPusherServer();
    
    for (const driver of availableDrivers) {
      try {
        await pusher.trigger(`driver-${driver.id}`, 'new-routes-available', {
          routeCount: plannedRoutes.length,
          message: `${plannedRoutes.length} new route(s) available for assignment`,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`❌ Error notifying driver ${driver.id}:`, error);
      }
    }

    console.log(`✅ Notified ${availableDrivers.length} drivers about ${plannedRoutes.length} new routes`);
  } catch (error) {
    console.error('❌ Error notifying drivers:', error);
  }
}



// ============================================================================
// HELPER FUNCTIONS FOR FIXES
// ============================================================================

/**
 * ✅ FIX #1 & #4: Validate route feasibility and time windows
 */
async function validateRoute(route: any, bookings: any[]) {
  const MAX_DISTANCE = 200; // miles
  const MAX_DURATION = 780; // 13 hours in minutes
  const MAX_LOAD = 0.95; // 95%
  
  // Check distance
  if (route.totalDistance > MAX_DISTANCE) {
    return {
      feasible: false,
      timeWindowsValid: false,
      reason: `Route too long: ${route.totalDistance} miles > ${MAX_DISTANCE} miles`,
    };
  }
  
  // Check duration
  if (route.totalDuration > MAX_DURATION) {
    return {
      feasible: false,
      timeWindowsValid: false,
      reason: `Route too long: ${route.totalDuration} minutes > ${MAX_DURATION} minutes`,
    };
  }
  
  // Check total load
  const totalLoad = route.bookingIds.reduce((sum: number, id: string) => {
    const booking = bookings.find((b: any) => b.id === id);
    return sum + (booking?.estimatedLoadPercentage || 0);
  }, 0);
  
  if (totalLoad > MAX_LOAD) {
    return {
      feasible: false,
      timeWindowsValid: false,
      reason: `Total load too high: ${(totalLoad * 100).toFixed(0)}% > ${(MAX_LOAD * 100).toFixed(0)}%`,
    };
  }
  
  // Validate time windows
  let currentTime = new Date();
  let timeWindowsValid = true;
  let timeWindowReason = '';
  
  for (let i = 0; i < route.bookingIds.length; i++) {
    const booking = bookings.find((b: any) => b.id === route.bookingIds[i]);
    
    if (!booking) continue;
    
    // Add driving time (estimated)
    const drivingMinutes = i === 0 ? 30 : 20; // First stop: 30 min, others: 20 min
    currentTime = new Date(currentTime.getTime() + drivingMinutes * 60 * 1000);
    
    // Add loading/unloading time
    const loadingMinutes = 30;
    currentTime = new Date(currentTime.getTime() + loadingMinutes * 60 * 1000);
    
    // Check if we're within the time window
    const scheduledTime = new Date(booking.scheduledAt);
    const timeWindowEnd = new Date(scheduledTime.getTime() + 2 * 60 * 60 * 1000); // +2 hours
    
    if (currentTime > timeWindowEnd) {
      timeWindowsValid = false;
      timeWindowReason = `Stop ${i + 1} (${booking.reference}) cannot be reached within time window`;
      break;
    }
  }
  
  return {
    feasible: true,
    timeWindowsValid,
    reason: timeWindowsValid ? 'Route is feasible' : timeWindowReason,
  };
}

/**
 * ✅ FIX #2: Recalculate price with multi-drop discount
 */
async function recalculateMultiDropPrice(booking: any, route: any, numberOfStops: number) {
  const originalPrice = booking.totalGBP; // in pence
  
  // Calculate discount based on number of stops
  // 2 stops: 15%, 3 stops: 20%, 4 stops: 25%, 5+ stops: 30%
  let discountPercentage = 0;
  if (numberOfStops === 2) discountPercentage = 0.15;
  else if (numberOfStops === 3) discountPercentage = 0.20;
  else if (numberOfStops === 4) discountPercentage = 0.25;
  else if (numberOfStops >= 5) discountPercentage = 0.30;
  
  const discountAmount = Math.round(originalPrice * discountPercentage);
  const newTotalPence = originalPrice - discountAmount;
  const refundAmount = discountAmount;
  
  return {
    originalPrice,
    discountPercentage,
    discountAmount,
    newTotalPence,
    refundAmount,
  };
}

/**
 * ✅ FIX #2: Process customer refund via Stripe
 */
async function processCustomerRefund(bookingId: string, refundAmountPence: number) {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        Payment: {
          where: {
            status: 'succeeded',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });
    
    if (!booking || booking.Payment.length === 0) {
      console.warn(`⚠️ No payment found for booking ${bookingId}, cannot process refund`);
      return;
    }
    
    const payment = booking.Payment[0];
    
    // Create refund via Stripe (if using Stripe)
    if (payment.paymentIntentId) {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      const refund = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
        amount: refundAmountPence,
        reason: 'multi_drop_discount',
        metadata: {
          bookingId,
          reason: 'Multi-drop route discount applied',
        },
      });
      
      // Record refund in database
      await prisma.refund.create({
        data: {
          id: refund.id,
          bookingId,
          paymentId: payment.id,
          amountPence: refundAmountPence,
          reason: 'multi_drop_discount',
          status: 'succeeded',
          processedAt: new Date(),
        },
      });
      
      console.log(`✅ Refund processed: £${(refundAmountPence / 100).toFixed(2)} for booking ${booking.reference}`);
    }
  } catch (error) {
    console.error(`❌ Error processing refund for booking ${bookingId}:`, error);
  }
}

/**
 * ✅ FIX #3: Re-optimization - Check if new booking can be added to existing route
 */
export async function tryAddBookingToExistingRoute(newBooking: any): Promise<boolean> {
  try {
    // Get active routes that haven't started yet
    const activeRoutes = await prisma.route.findMany({
      where: {
        status: { in: ['planned', 'assigned'] },
        // Route start time is in the future
        Booking: {
          some: {
            scheduledAt: {
              gte: new Date(),
            },
          },
        },
      },
      include: {
        Booking: true,
      },
    });
    
    for (const route of activeRoutes) {
      // Check if new booking can be added
      const canAdd = await intelligentRouteOptimizer.canAddBookingToRoute({
        routeId: route.id,
        existingBookings: route.Booking,
        newBooking,
        maxDetourPercentage: 0.15, // Allow 15% detour
        maxAdditionalTime: 30, // Allow 30 minutes additional time
      });
      
      if (canAdd.feasible) {
        // Add booking to route
        await prisma.booking.update({
          where: { id: newBooking.id },
          data: {
            routeId: route.id,
            deliverySequence: route.Booking.length + 1,
            orderType: 'multi-drop',
          },
        });
        
        // Update route totals
        await prisma.route.update({
          where: { id: route.id },
          data: {
            totalDistanceMiles: route.totalDistanceMiles + canAdd.additionalDistance,
            totalDurationMinutes: route.totalDurationMinutes + canAdd.additionalTime,
          },
        });
        
        console.log(`✅ Added booking ${newBooking.reference} to existing route ${route.id}`);
        return true;
      }
    }
    
    return false; // Could not add to any existing route
  } catch (error) {
    console.error('❌ Error in re-optimization:', error);
    return false;
  }
}

