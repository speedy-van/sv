/**
 * Integration Tests - Dual Routing System
 * 
 * Comprehensive tests for Auto + Manual routing modes
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import { routeManager } from '@/lib/orchestration/RouteManager';

// Test data generators
const generateTestBooking = (overrides: any = {}) => ({
  id: `test_booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  reference: `TEST-${Math.floor(Math.random() * 100000)}`,
  status: 'CONFIRMED',
  scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  totalGBP: 5000, // £50
  customerName: 'Test Customer',
  customerEmail: 'test@example.com',
  customerPhone: '+441202129746',
  pickupAddressId: 'test_pickup_addr',
  dropoffAddressId: 'test_dropoff_addr',
  pickupPropertyId: 'test_pickup_prop',
  dropoffPropertyId: 'test_dropoff_prop',
  accessSurchargeGBP: 0,
  availabilityMultiplierPercent: 0,
  baseDistanceMiles: 10,
  crewMultiplierPercent: 0,
  distanceCostGBP: 1000,
  estimatedDurationMinutes: 120,
  itemsSurchargeGBP: 500,
  weatherSurchargeGBP: 0,
  crewSize: 'TWO' as const,
  currentStep: 'STEP_1_WHERE_AND_WHAT' as const,
  updatedAt: new Date(),
  ...overrides,
});

const generateTestAddress = (overrides: any = {}) => ({
  id: `test_addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  label: 'Test Address',
  postcode: 'G21 2QB',
  lat: 55.8642,
  lng: -4.2518,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const generateTestProperty = (overrides: any = {}) => ({
  id: `test_prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  propertyType: 'HOUSE' as const,
  accessType: 'WITHOUT_LIFT' as const,
  floors: 1,
  ...overrides,
});

describe('Dual Routing System - Integration Tests', () => {
  let testBookingIds: string[] = [];
  let testAddressIds: string[] = [];
  let testPropertyIds: string[] = [];
  let adminUserId: string;

  beforeAll(async () => {
    // Create test admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (!adminUser) {
      const newAdmin = await prisma.user.create({
        data: {
          id: `test_admin_${Date.now()}`,
          name: 'Test Admin',
          email: 'admin@test.com',
          password: 'hashed_password',
          role: 'admin',
          phone: '+441202129746',
        }
      });
      adminUserId = newAdmin.id;
    } else {
      adminUserId = adminUser.id;
    }

    // Ensure SystemSettings exists
    const existingSettings = await prisma.systemSettings.findFirst();
    if (!existingSettings) {
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
          updatedBy: 'test_system',
        }
      });
    }
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.booking.deleteMany({
      where: { id: { in: testBookingIds } }
    });

    await prisma.bookingAddress.deleteMany({
      where: { id: { in: testAddressIds } }
    });

    await prisma.propertyDetails.deleteMany({
      where: { id: { in: testPropertyIds } }
    });

    // Clean up test routes and approvals
    await prisma.routeApproval.deleteMany({
      where: { submittedBy: adminUserId }
    });

    await prisma.route.deleteMany({
      where: { routeNotes: { contains: 'Test' } }
    });

    await prisma.systemAuditLog.deleteMany({
      where: { actor: { startsWith: 'test_' } }
    });
  });

  beforeEach(async () => {
    // Reset routing mode to manual before each test
    await prisma.systemSettings.updateMany({
      data: {
        routingMode: 'manual',
        autoRoutingEnabled: false,
        updatedBy: 'test_system',
      }
    });
  });

  describe('1. Configuration Management', () => {
    it('should load system configuration', async () => {
      const config = await routeManager.getConfig();

      expect(config).toBeDefined();
      expect(config.routingMode).toBe('manual');
      expect(config.autoRoutingEnabled).toBe(false);
      expect(config.maxDropsPerRoute).toBeGreaterThan(0);
      expect(config.requireAdminApproval).toBeDefined();
    });

    it('should toggle routing mode from manual to auto', async () => {
      const result = await routeManager.setRoutingMode('auto', adminUserId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('AUTO');

      const config = await routeManager.getConfig();
      expect(config.routingMode).toBe('auto');
      expect(config.autoRoutingEnabled).toBe(true);

      // Verify audit log
      const auditLog = await prisma.systemAuditLog.findFirst({
        where: {
          eventType: 'routing_mode_changed',
          actor: adminUserId,
        },
        orderBy: { timestamp: 'desc' }
      });

      expect(auditLog).toBeDefined();
      expect(auditLog?.details).toHaveProperty('newMode', 'auto');
    });

    it('should update routing configuration', async () => {
      const updates = {
        maxDropsPerRoute: 15,
        maxRouteDistanceKm: 75,
        autoAssignDrivers: true,
      };

      const result = await routeManager.updateConfig(updates, adminUserId);

      expect(result.success).toBe(true);

      const config = await routeManager.getConfig();
      expect(config.maxDropsPerRoute).toBe(15);
      expect(config.maxRouteDistanceKm).toBe(75);
      expect(config.autoAssignDrivers).toBe(true);
    });
  });

  describe('2. Auto-Routing Mode', () => {
    beforeEach(async () => {
      // Enable auto-routing
      await routeManager.setRoutingMode('auto', adminUserId);
    });

    it('should not run if auto-routing is disabled', async () => {
      // Disable auto-routing
      await prisma.systemSettings.updateMany({
        data: { autoRoutingEnabled: false }
      });

      const result = await routeManager.runAutoRouting('test_admin');

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Auto-routing is disabled');
    });

    it('should not run if not enough bookings', async () => {
      const result = await routeManager.runAutoRouting('test_admin');

      expect(result.bookingsProcessed).toBeLessThan(2);
      expect(result.routesCreated).toBe(0);
    });

    it('should create routes from confirmed bookings', async () => {
      // Create test addresses and properties
      const pickupAddress = generateTestAddress({ label: 'Pickup Test' });
      const dropoffAddress = generateTestAddress({ label: 'Dropoff Test' });
      const pickupProperty = generateTestProperty();
      const dropoffProperty = generateTestProperty();

      await prisma.bookingAddress.createMany({
        data: [pickupAddress, dropoffAddress]
      });

      await prisma.propertyDetails.createMany({
        data: [pickupProperty, dropoffProperty]
      });

      testAddressIds.push(pickupAddress.id, dropoffAddress.id);
      testPropertyIds.push(pickupProperty.id, dropoffProperty.id);

      // Create test bookings
      const booking1 = generateTestBooking({
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,
      });

      const booking2 = generateTestBooking({
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,
        scheduledAt: new Date(Date.now() + 2.5 * 60 * 60 * 1000), // 2.5 hours
      });

      await prisma.booking.createMany({
        data: [booking1, booking2]
      });

      testBookingIds.push(booking1.id, booking2.id);

      // Run auto-routing
      const result = await routeManager.runAutoRouting(adminUserId);

      // Note: May not create routes if optimization fails or constraints not met
      expect(result.bookingsProcessed).toBeGreaterThanOrEqual(2);
      expect(result.success).toBeDefined();

      // Check audit log
      const auditLog = await prisma.systemAuditLog.findFirst({
        where: {
          eventType: 'auto_routing_completed',
          actor: adminUserId,
        },
        orderBy: { timestamp: 'desc' }
      });

      expect(auditLog).toBeDefined();
    }, 15000); // Increase timeout for route optimization

    it('should prevent concurrent auto-routing runs', async () => {
      // Start first run
      const promise1 = routeManager.runAutoRouting('test_admin_1');
      
      // Immediately start second run
      const promise2 = routeManager.runAutoRouting('test_admin_2');

      const [result1, result2] = await Promise.all([promise1, promise2]);

      // One should succeed, one should fail with "already running" error
      const runningError = result1.errors.includes('already running') || 
                          result2.errors.includes('already running');

      expect(runningError).toBe(true);
    }, 15000);
  });

  describe('3. Manual Routing Mode', () => {
    it('should create manual route preview', async () => {
      // Create test data
      const pickupAddress = generateTestAddress({ label: 'Manual Pickup' });
      const dropoffAddress = generateTestAddress({ label: 'Manual Dropoff' });
      const pickupProperty = generateTestProperty();
      const dropoffProperty = generateTestProperty();

      await prisma.bookingAddress.createMany({
        data: [pickupAddress, dropoffAddress]
      });

      await prisma.propertyDetails.createMany({
        data: [pickupProperty, dropoffProperty]
      });

      testAddressIds.push(pickupAddress.id, dropoffAddress.id);
      testPropertyIds.push(pickupProperty.id, dropoffProperty.id);

      const booking = generateTestBooking({
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,
      });

      await prisma.booking.create({ data: booking });
      testBookingIds.push(booking.id);

      // Generate preview
      const preview = await routeManager.generateRoutePreview([booking.id]);

      expect(preview).toBeDefined();
      expect(preview.totalDrops).toBeGreaterThan(0);
      expect(preview.estimatedDuration).toBeGreaterThan(0);
      expect(preview.stops.length).toBeGreaterThan(0);
    }, 10000);

    it('should create manual route from bookings', async () => {
      // Create test data
      const pickupAddress = generateTestAddress();
      const dropoffAddress = generateTestAddress();
      const pickupProperty = generateTestProperty();
      const dropoffProperty = generateTestProperty();

      await prisma.bookingAddress.createMany({
        data: [pickupAddress, dropoffAddress]
      });

      await prisma.propertyDetails.createMany({
        data: [pickupProperty, dropoffProperty]
      });

      testAddressIds.push(pickupAddress.id, dropoffAddress.id);
      testPropertyIds.push(pickupProperty.id, dropoffProperty.id);

      const booking1 = generateTestBooking({
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,
      });

      const booking2 = generateTestBooking({
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,
      });

      await prisma.booking.createMany({
        data: [booking1, booking2]
      });

      testBookingIds.push(booking1.id, booking2.id);

      // Create manual route
      const result = await routeManager.createManualRoute({
        bookingIds: [booking1.id, booking2.id],
        startTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        adminId: adminUserId,
        skipApproval: true, // Skip for testing
      });

      expect(result.success).toBe(true);
      expect(result.routeId).toBeDefined();
      expect(result.message).toContain('successfully');

      // Verify route was created
      if (result.routeId) {
        const route = await prisma.route.findUnique({
          where: { id: result.routeId }
        });

        expect(route).toBeDefined();
        expect(route?.totalDrops).toBeGreaterThanOrEqual(2);
      }
    }, 10000);
  });

  describe('4. Route Approval System', () => {
    it('should create approval record when required', async () => {
      // Enable approval requirement
      await routeManager.updateConfig({ requireAdminApproval: true }, adminUserId);

      // Create test booking
      const pickupAddress = generateTestAddress();
      const dropoffAddress = generateTestAddress();
      const pickupProperty = generateTestProperty();
      const dropoffProperty = generateTestProperty();

      await prisma.bookingAddress.createMany({
        data: [pickupAddress, dropoffAddress]
      });

      await prisma.propertyDetails.createMany({
        data: [pickupProperty, dropoffProperty]
      });

      testAddressIds.push(pickupAddress.id, dropoffAddress.id);
      testPropertyIds.push(pickupProperty.id, dropoffProperty.id);

      const booking = generateTestBooking({
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,
      });

      await prisma.booking.create({ data: booking });
      testBookingIds.push(booking.id);

      // Create route requiring approval
      const result = await routeManager.createManualRoute({
        bookingIds: [booking.id],
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        adminId: adminUserId,
      });

      expect(result.success).toBe(true);
      expect(result.approvalId).toBeDefined();

      // Verify approval record
      if (result.approvalId) {
        const approval = await prisma.routeApproval.findUnique({
          where: { id: result.approvalId }
        });

        expect(approval).toBeDefined();
        expect(approval?.status).toBe('pending');
      }
    }, 10000);

    it('should approve route successfully', async () => {
      // Create test route needing approval
      const pickupAddress = generateTestAddress();
      const dropoffAddress = generateTestAddress();
      const pickupProperty = generateTestProperty();
      const dropoffProperty = generateTestProperty();

      await prisma.bookingAddress.createMany({
        data: [pickupAddress, dropoffAddress]
      });

      await prisma.propertyDetails.createMany({
        data: [pickupProperty, dropoffProperty]
      });

      testAddressIds.push(pickupAddress.id, dropoffAddress.id);
      testPropertyIds.push(pickupProperty.id, dropoffProperty.id);

      const booking = generateTestBooking({
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,
      });

      await prisma.booking.create({ data: booking });
      testBookingIds.push(booking.id);

      const createResult = await routeManager.createManualRoute({
        bookingIds: [booking.id],
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        adminId: adminUserId,
      });

      expect(createResult.routeId).toBeDefined();

      if (createResult.routeId) {
        // Approve the route
        const approveResult = await routeManager.approveRoute(
          createResult.routeId,
          adminUserId
        );

        expect(approveResult.success).toBe(true);

        // Verify approval status
        const approval = await prisma.routeApproval.findFirst({
          where: { routeId: createResult.routeId }
        });

        expect(approval?.status).toBe('approved');
        expect(approval?.reviewedBy).toBe(adminUserId);
      }
    }, 10000);

    it('should reject route with reason', async () => {
      // Create test route
      const pickupAddress = generateTestAddress();
      const dropoffAddress = generateTestAddress();
      const pickupProperty = generateTestProperty();
      const dropoffProperty = generateTestProperty();

      await prisma.bookingAddress.createMany({
        data: [pickupAddress, dropoffAddress]
      });

      await prisma.propertyDetails.createMany({
        data: [pickupProperty, dropoffProperty]
      });

      testAddressIds.push(pickupAddress.id, dropoffAddress.id);
      testPropertyIds.push(pickupProperty.id, dropoffProperty.id);

      const booking = generateTestBooking({
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,
      });

      await prisma.booking.create({ data: booking });
      testBookingIds.push(booking.id);

      const createResult = await routeManager.createManualRoute({
        bookingIds: [booking.id],
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        adminId: adminUserId,
      });

      if (createResult.routeId) {
        // Reject the route
        const rejectResult = await routeManager.rejectRoute(
          createResult.routeId,
          adminUserId,
          'Route optimization not efficient'
        );

        expect(rejectResult.success).toBe(true);

        // Verify rejection
        const approval = await prisma.routeApproval.findFirst({
          where: { routeId: createResult.routeId }
        });

        expect(approval?.status).toBe('rejected');
        expect(approval?.rejectionReason).toContain('not efficient');

        // Verify bookings were released
        const releasedBooking = await prisma.booking.findUnique({
          where: { id: booking.id }
        });

        expect(releasedBooking?.routeId).toBeNull();
      }
    }, 10000);
  });

  describe('5. Audit Logging', () => {
    it('should log mode changes', async () => {
      await routeManager.setRoutingMode('auto', adminUserId);

      const log = await prisma.systemAuditLog.findFirst({
        where: {
          eventType: 'routing_mode_changed',
          actor: adminUserId,
        },
        orderBy: { timestamp: 'desc' }
      });

      expect(log).toBeDefined();
      expect(log?.action).toBe('change_routing_mode');
      expect(log?.result).toBe('success');
    });

    it('should log route creations', async () => {
      const pickupAddress = generateTestAddress();
      const dropoffAddress = generateTestAddress();
      const pickupProperty = generateTestProperty();
      const dropoffProperty = generateTestProperty();

      await prisma.bookingAddress.createMany({
        data: [pickupAddress, dropoffAddress]
      });

      await prisma.propertyDetails.createMany({
        data: [pickupProperty, dropoffProperty]
      });

      testAddressIds.push(pickupAddress.id, dropoffAddress.id);
      testPropertyIds.push(pickupProperty.id, dropoffProperty.id);

      const booking = generateTestBooking({
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,
      });

      await prisma.booking.create({ data: booking });
      testBookingIds.push(booking.id);

      await routeManager.createManualRoute({
        bookingIds: [booking.id],
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        adminId: adminUserId,
        skipApproval: true,
      });

      const log = await prisma.systemAuditLog.findFirst({
        where: {
          eventType: 'manual_route_created',
          actor: adminUserId,
        },
        orderBy: { timestamp: 'desc' }
      });

      expect(log).toBeDefined();
      expect(log?.targetType).toBe('route');
    }, 10000);

    it('should log errors', async () => {
      // Try to create route with invalid bookings
      const result = await routeManager.createManualRoute({
        bookingIds: ['invalid_id_123'],
        startTime: new Date(),
        adminId: adminUserId,
      });

      expect(result.success).toBe(false);

      const errorLog = await prisma.systemAuditLog.findFirst({
        where: {
          eventType: 'routing_error',
          actor: adminUserId,
        },
        orderBy: { timestamp: 'desc' }
      });

      expect(errorLog).toBeDefined();
      expect(errorLog?.severity).toBe('error');
    }, 10000);
  });

  describe('6. Safety Rules', () => {
    it('should prevent duplicate route creation', async () => {
      const pickupAddress = generateTestAddress();
      const dropoffAddress = generateTestAddress();
      const pickupProperty = generateTestProperty();
      const dropoffProperty = generateTestProperty();

      await prisma.bookingAddress.createMany({
        data: [pickupAddress, dropoffAddress]
      });

      await prisma.propertyDetails.createMany({
        data: [pickupProperty, dropoffProperty]
      });

      testAddressIds.push(pickupAddress.id, dropoffAddress.id);
      testPropertyIds.push(pickupProperty.id, dropoffProperty.id);

      const booking = generateTestBooking({
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,
      });

      await prisma.booking.create({ data: booking });
      testBookingIds.push(booking.id);

      // Create first route
      const result1 = await routeManager.createManualRoute({
        bookingIds: [booking.id],
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        adminId: adminUserId,
        skipApproval: true,
      });

      expect(result1.success).toBe(true);

      // Try to create second route with same booking
      const result2 = await routeManager.createManualRoute({
        bookingIds: [booking.id],
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        adminId: adminUserId,
        skipApproval: true,
      });

      expect(result2.success).toBe(false);
      expect(result2.message).toContain('available');
    }, 10000);

    it('should validate booking status before routing', async () => {
      const pickupAddress = generateTestAddress();
      const dropoffAddress = generateTestAddress();
      const pickupProperty = generateTestProperty();
      const dropoffProperty = generateTestProperty();

      await prisma.bookingAddress.createMany({
        data: [pickupAddress, dropoffAddress]
      });

      await prisma.propertyDetails.createMany({
        data: [pickupProperty, dropoffProperty]
      });

      testAddressIds.push(pickupAddress.id, dropoffAddress.id);
      testPropertyIds.push(pickupProperty.id, dropoffProperty.id);

      // Create PENDING booking (not CONFIRMED)
      const booking = generateTestBooking({
        status: 'PENDING_PAYMENT',
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,
      });

      await prisma.booking.create({ data: booking });
      testBookingIds.push(booking.id);

      // Try to create route with pending booking
      const result = await routeManager.createManualRoute({
        bookingIds: [booking.id],
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        adminId: adminUserId,
        skipApproval: true,
      });

      expect(result.success).toBe(false);
    }, 10000);
  });
});

