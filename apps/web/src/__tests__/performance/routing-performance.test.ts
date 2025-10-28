/**
 * Performance Tests - Routing System
 * 
 * Tests routing system performance with realistic booking volumes
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { routeManager } from '@/lib/orchestration/RouteManager';

// Performance thresholds
const THRESHOLDS = {
  configLoad: 100, // ms
  modeSwitch: 500, // ms
  routePreview: 2000, // ms
  manualRouteCreation: 3000, // ms
  autoRoutingSmall: 5000, // ms (< 10 bookings)
  autoRoutingMedium: 15000, // ms (10-50 bookings)
  autoRoutingLarge: 30000, // ms (50-100 bookings)
};

// Helper to generate realistic Glasgow postcodes
const glasgowPostcodes = [
  'G1 1AA', 'G2 3BD', 'G3 7LW', 'G4 9SS', 'G5 8PQ',
  'G11 5RB', 'G12 8QQ', 'G13 1PS', 'G14 9NJ', 'G15 8LE',
  'G20 6AD', 'G21 2QB', 'G31 4EB', 'G32 7XR', 'G33 1NL',
  'G40 1DA', 'G41 2PE', 'G42 8QE', 'G43 2SP', 'G44 3UG',
  'G51 1DL', 'G52 3BU', 'G53 5UA', 'G60 5DS', 'G61 3RG',
  'G62 8HL', 'G63 0LG', 'G64 1QE', 'G65 9BU', 'G66 1AA',
  'G67 1DL', 'G68 9NE', 'G69 6NB', 'G71 5PD', 'G72 0AJ',
  'G73 2LS', 'G74 1LW', 'G75 8TD', 'G76 7HF', 'G77 5UE',
  'G78 1NF', 'G81 2NU', 'G82 4JZ', 'G83 8EG', 'G84 7NS',
];

const generateRealisticAddress = () => {
  const streets = ['High Street', 'Main Road', 'Park Avenue', 'Church Street', 'King Street', 'Queen Street', 'George Street', 'Duke Street'];
  const number = Math.floor(Math.random() * 200) + 1;
  const street = streets[Math.floor(Math.random() * streets.length)];
  const postcode = glasgowPostcodes[Math.floor(Math.random() * glasgowPostcodes.length)];
  
  return {
    label: `${number} ${street}, Glasgow`,
    postcode,
    // Glasgow coordinates with variation
    lat: 55.8642 + (Math.random() - 0.5) * 0.1, // ±5km variation
    lng: -4.2518 + (Math.random() - 0.5) * 0.1,
  };
};

const generateRealisticBooking = (scheduledAt: Date) => {
  const pickupAddress = generateRealisticAddress();
  const dropoffAddress = generateRealisticAddress();

  // Realistic pricing based on distance
  const distance = Math.random() * 20 + 5; // 5-25 miles
  const basePrice = Math.floor((distance * 200 + Math.random() * 1000 + 3000)); // £30-80
  
  return {
    pickupAddress,
    dropoffAddress,
    scheduledAt,
    totalGBP: basePrice,
    customerName: `Customer ${Math.floor(Math.random() * 1000)}`,
    customerEmail: `customer${Math.floor(Math.random() * 10000)}@test.com`,
    customerPhone: `+4479018${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
    baseDistanceMiles: distance,
    estimatedDurationMinutes: Math.floor(distance * 3 + 30), // 3 min per mile + 30 min handling
  };
};

describe('Routing System - Performance Tests', () => {
  let adminUserId: string;
  let testData: {
    bookingIds: string[];
    addressIds: string[];
    propertyIds: string[];
    routeIds: string[];
  } = {
    bookingIds: [],
    addressIds: [],
    propertyIds: [],
    routeIds: [],
  };

  beforeAll(async () => {
    // Get or create test admin
    const admin = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (admin) {
      adminUserId = admin.id;
    } else {
      const newAdmin = await prisma.user.create({
        data: {
          id: `perf_admin_${Date.now()}`,
          name: 'Performance Test Admin',
          email: `perf_admin_${Date.now()}@test.com`,
          password: 'hashed',
          role: 'admin',
          phone: '+441202129746',
        }
      });
      adminUserId = newAdmin.id;
    }

    // Ensure system settings exist
    const settings = await prisma.systemSettings.findFirst();
    if (!settings) {
      await prisma.systemSettings.create({
        data: {
          routingMode: 'manual',
          autoRoutingEnabled: false,
          autoRoutingIntervalMin: 15,
          maxDropsPerRoute: 10,
          maxRouteDistanceKm: 50,
          autoAssignDrivers: false,
          requireAdminApproval: true,
          minDropsForAutoRoute: 2,
          updatedBy: 'perf_test',
        }
      });
    }
  });

  describe('Configuration Performance', () => {
    it(`should load config in < ${THRESHOLDS.configLoad}ms`, async () => {
      const start = performance.now();
      
      await routeManager.getConfig();
      
      const duration = performance.now() - start;
      
      console.log(`Config load: ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(THRESHOLDS.configLoad);
    });

    it(`should switch mode in < ${THRESHOLDS.modeSwitch}ms`, async () => {
      const start = performance.now();
      
      await routeManager.setRoutingMode('auto', adminUserId);
      await routeManager.setRoutingMode('manual', adminUserId);
      
      const duration = performance.now() - start;
      
      console.log(`Mode switch (2x): ${duration.toFixed(2)}ms`);
      expect(duration).toBeLessThan(THRESHOLDS.modeSwitch);
    });
  });

  describe('Manual Routing Performance', () => {
    it(`should generate route preview in < ${THRESHOLDS.routePreview}ms`, async () => {
      // Create 3 test bookings
      const now = new Date();
      const bookings = [];

      for (let i = 0; i < 3; i++) {
        const bookingData = generateRealisticBooking(new Date(now.getTime() + i * 30 * 60 * 1000));
        
        // Create addresses
        const pickupAddr = await prisma.bookingAddress.create({
          data: {
            id: `perf_pickup_${Date.now()}_${i}`,
            ...bookingData.pickupAddress,
          }
        });

        const dropoffAddr = await prisma.bookingAddress.create({
          data: {
            id: `perf_dropoff_${Date.now()}_${i}`,
            ...bookingData.dropoffAddress,
          }
        });

        testData.addressIds.push(pickupAddr.id, dropoffAddr.id);

        // Create properties
        const pickupProp = await prisma.propertyDetails.create({
          data: {
            id: `perf_pickup_prop_${Date.now()}_${i}`,
            propertyType: 'HOUSE',
            accessType: 'WITHOUT_LIFT',
            floors: Math.floor(Math.random() * 3) + 1,
          }
        });

        const dropoffProp = await prisma.propertyDetails.create({
          data: {
            id: `perf_dropoff_prop_${Date.now()}_${i}`,
            propertyType: 'HOUSE',
            accessType: 'WITHOUT_LIFT',
            floors: Math.floor(Math.random() * 3) + 1,
          }
        });

        testData.propertyIds.push(pickupProp.id, dropoffProp.id);

        // Create booking
        const booking = await prisma.booking.create({
          data: {
            id: `perf_booking_${Date.now()}_${i}`,
            reference: `PERF-${Date.now()}-${i}`,
            status: 'CONFIRMED',
            pickupAddressId: pickupAddr.id,
            dropoffAddressId: dropoffAddr.id,
            pickupPropertyId: pickupProp.id,
            dropoffPropertyId: dropoffProp.id,
            crewSize: 'TWO',
            currentStep: 'STEP_1_WHERE_AND_WHAT',
            accessSurchargeGBP: 0,
            availabilityMultiplierPercent: 0,
            crewMultiplierPercent: 0,
            distanceCostGBP: Math.floor(bookingData.baseDistanceMiles * 100),
            itemsSurchargeGBP: 0,
            weatherSurchargeGBP: 0,
            scheduledAt: bookingData.scheduledAt,
            totalGBP: bookingData.totalGBP,
            customerName: bookingData.customerName,
            customerEmail: bookingData.customerEmail,
            customerPhone: bookingData.customerPhone,
            baseDistanceMiles: bookingData.baseDistanceMiles,
            estimatedDurationMinutes: bookingData.estimatedDurationMinutes,
          }
        });

        testData.bookingIds.push(booking.id);
        bookings.push(booking);
      }

      // Measure preview generation
      const start = performance.now();
      
      const preview = await routeManager.generateRoutePreview(bookings.map(b => b.id));
      
      const duration = performance.now() - start;
      
      console.log(`Route preview (3 bookings): ${duration.toFixed(2)}ms`);
      console.log(`  - Total drops: ${preview.totalDrops}`);
      console.log(`  - Est. duration: ${preview.estimatedDuration} min`);
      console.log(`  - Est. distance: ${preview.estimatedDistance.toFixed(1)} km`);
      
      expect(duration).toBeLessThan(THRESHOLDS.routePreview);
      expect(preview.totalDrops).toBeGreaterThan(0);
    }, 15000);

    it(`should create manual route in < ${THRESHOLDS.manualRouteCreation}ms`, async () => {
      const now = new Date();
      const bookings = [];

      // Create 5 bookings
      for (let i = 0; i < 5; i++) {
        const bookingData = generateRealisticBooking(new Date(now.getTime() + i * 20 * 60 * 1000));
        
        const pickupAddr = await prisma.bookingAddress.create({
          data: {
            id: `perf_manual_pickup_${Date.now()}_${i}`,
            ...bookingData.pickupAddress,
          }
        });

        const dropoffAddr = await prisma.bookingAddress.create({
          data: {
            id: `perf_manual_dropoff_${Date.now()}_${i}`,
            ...bookingData.dropoffAddress,
          }
        });

        testData.addressIds.push(pickupAddr.id, dropoffAddr.id);

        const pickupProp = await prisma.propertyDetails.create({
          data: {
            id: `perf_manual_pickup_prop_${Date.now()}_${i}`,
            propertyType: 'HOUSE',
            accessType: 'WITHOUT_LIFT',
            floors: 1,
          }
        });

        const dropoffProp = await prisma.propertyDetails.create({
          data: {
            id: `perf_manual_dropoff_prop_${Date.now()}_${i}`,
            propertyType: 'HOUSE',
            accessType: 'WITHOUT_LIFT',
            floors: 1,
          }
        });

        testData.propertyIds.push(pickupProp.id, dropoffProp.id);

        const booking = await prisma.booking.create({
          data: {
            id: `perf_manual_booking_${Date.now()}_${i}`,
            reference: `PERF-MANUAL-${Date.now()}-${i}`,
            status: 'CONFIRMED',
            pickupAddressId: pickupAddr.id,
            dropoffAddressId: dropoffAddr.id,
            pickupPropertyId: pickupProp.id,
            dropoffPropertyId: dropoffProp.id,
            crewSize: 'TWO',
            currentStep: 'STEP_1_WHERE_AND_WHAT',
            accessSurchargeGBP: 0,
            availabilityMultiplierPercent: 0,
            crewMultiplierPercent: 0,
            distanceCostGBP: Math.floor(bookingData.baseDistanceMiles * 100),
            itemsSurchargeGBP: 0,
            weatherSurchargeGBP: 0,
            scheduledAt: bookingData.scheduledAt,
            totalGBP: bookingData.totalGBP,
            customerName: bookingData.customerName,
            customerEmail: bookingData.customerEmail,
            customerPhone: bookingData.customerPhone,
            baseDistanceMiles: bookingData.baseDistanceMiles,
            estimatedDurationMinutes: bookingData.estimatedDurationMinutes,
          }
        });

        testData.bookingIds.push(booking.id);
        bookings.push(booking);
      }

      // Measure route creation
      const start = performance.now();
      
      const result = await routeManager.createManualRoute({
        bookingIds: bookings.map(b => b.id),
        startTime: new Date(now.getTime() + 60 * 60 * 1000),
        adminId: adminUserId,
        skipApproval: true,
      });
      
      const duration = performance.now() - start;
      
      console.log(`Manual route creation (5 bookings): ${duration.toFixed(2)}ms`);
      console.log(`  - Success: ${result.success}`);
      console.log(`  - Route ID: ${result.routeId}`);
      
      if (result.routeId) {
        testData.routeIds.push(result.routeId);
      }
      
      expect(duration).toBeLessThan(THRESHOLDS.manualRouteCreation);
      expect(result.success).toBe(true);
    }, 20000);
  });

  describe('Auto-Routing Performance', () => {
    it(`should handle small batch (< 10 bookings) in < ${THRESHOLDS.autoRoutingSmall}ms`, async () => {
      // Enable auto-routing
      await routeManager.setRoutingMode('auto', adminUserId);

      const now = new Date();
      const bookingCount = 8;
      const bookings = [];

      // Create bookings
      for (let i = 0; i < bookingCount; i++) {
        const bookingData = generateRealisticBooking(new Date(now.getTime() + 2 * 60 * 60 * 1000 + i * 15 * 60 * 1000));
        
        const pickupAddr = await prisma.bookingAddress.create({
          data: {
            id: `perf_auto_small_pickup_${Date.now()}_${i}`,
            ...bookingData.pickupAddress,
          }
        });

        const dropoffAddr = await prisma.bookingAddress.create({
          data: {
            id: `perf_auto_small_dropoff_${Date.now()}_${i}`,
            ...bookingData.dropoffAddress,
          }
        });

        testData.addressIds.push(pickupAddr.id, dropoffAddr.id);

        const pickupProp = await prisma.propertyDetails.create({
          data: {
            id: `perf_auto_small_pickup_prop_${Date.now()}_${i}`,
            propertyType: 'HOUSE',
            accessType: 'WITHOUT_LIFT',
            floors: 1,
          }
        });

        const dropoffProp = await prisma.propertyDetails.create({
          data: {
            id: `perf_auto_small_dropoff_prop_${Date.now()}_${i}`,
            propertyType: 'HOUSE',
            accessType: 'WITHOUT_LIFT',
            floors: 1,
          }
        });

        testData.propertyIds.push(pickupProp.id, dropoffProp.id);

        const booking = await prisma.booking.create({
          data: {
            id: `perf_auto_small_${Date.now()}_${i}`,
            reference: `PERF-AUTO-SMALL-${Date.now()}-${i}`,
            status: 'CONFIRMED',
            pickupAddressId: pickupAddr.id,
            dropoffAddressId: dropoffAddr.id,
            pickupPropertyId: pickupProp.id,
            dropoffPropertyId: dropoffProp.id,
            crewSize: 'TWO',
            currentStep: 'STEP_1_WHERE_AND_WHAT',
            accessSurchargeGBP: 0,
            availabilityMultiplierPercent: 0,
            crewMultiplierPercent: 0,
            distanceCostGBP: Math.floor(bookingData.baseDistanceMiles * 100),
            itemsSurchargeGBP: 0,
            weatherSurchargeGBP: 0,
            scheduledAt: bookingData.scheduledAt,
            totalGBP: bookingData.totalGBP,
            customerName: bookingData.customerName,
            customerEmail: bookingData.customerEmail,
            customerPhone: bookingData.customerPhone,
            baseDistanceMiles: bookingData.baseDistanceMiles,
            estimatedDurationMinutes: bookingData.estimatedDurationMinutes,
          }
        });

        testData.bookingIds.push(booking.id);
        bookings.push(booking);
      }

      // Measure auto-routing
      const start = performance.now();
      
      const result = await routeManager.runAutoRouting(adminUserId);
      
      const duration = performance.now() - start;
      
      console.log(`Auto-routing small batch (${bookingCount} bookings): ${duration.toFixed(2)}ms`);
      console.log(`  - Bookings processed: ${result.bookingsProcessed}`);
      console.log(`  - Routes created: ${result.routesCreated}`);
      console.log(`  - Success: ${result.success}`);
      
      expect(duration).toBeLessThan(THRESHOLDS.autoRoutingSmall);
    }, 25000);
  });

  describe('System Stress Tests', () => {
    it('should maintain performance with concurrent operations', async () => {
      const operations = [
        routeManager.getConfig(),
        routeManager.getConfig(),
        routeManager.getAutoRoutingHistory(10),
        routeManager.getPendingApprovals(),
      ];

      const start = performance.now();
      
      const results = await Promise.all(operations);
      
      const duration = performance.now() - start;
      
      console.log(`Concurrent operations (4x): ${duration.toFixed(2)}ms`);
      
      expect(results.every(r => r !== null)).toBe(true);
      expect(duration).toBeLessThan(1000); // All 4 should complete in < 1s
    });

    it('should handle rapid mode switches without errors', async () => {
      const switches = 10;
      const start = performance.now();
      
      for (let i = 0; i < switches; i++) {
        await routeManager.setRoutingMode(i % 2 === 0 ? 'auto' : 'manual', adminUserId);
      }
      
      const duration = performance.now() - start;
      const avgDuration = duration / switches;
      
      console.log(`Rapid mode switches (${switches}x): ${duration.toFixed(2)}ms (avg: ${avgDuration.toFixed(2)}ms)`);
      
      expect(avgDuration).toBeLessThan(100); // Each switch < 100ms
    });
  });

  // Cleanup after all tests
  afterAll(async () => {
    console.log('Cleaning up performance test data...');
    
    // Delete in correct order to respect foreign keys
    if (testData.bookingIds.length > 0) {
      await prisma.booking.deleteMany({
        where: { id: { in: testData.bookingIds } }
      });
    }

    if (testData.routeIds.length > 0) {
      await prisma.routeApproval.deleteMany({
        where: { routeId: { in: testData.routeIds } }
      });
      
      await prisma.route.deleteMany({
        where: { id: { in: testData.routeIds } }
      });
    }

    if (testData.addressIds.length > 0) {
      await prisma.bookingAddress.deleteMany({
        where: { id: { in: testData.addressIds } }
      });
    }

    if (testData.propertyIds.length > 0) {
      await prisma.propertyDetails.deleteMany({
        where: { id: { in: testData.propertyIds } }
      });
    }

    // Clean up audit logs
    await prisma.systemAuditLog.deleteMany({
      where: { actor: adminUserId }
    });

    console.log('✅ Cleanup complete');
  }, 30000);
});

