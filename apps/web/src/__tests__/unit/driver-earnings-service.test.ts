/**
 * Unit Tests for Driver Earnings Service
 * 
 * Tests all scenarios:
 * - Single delivery
 * - Multiple drops route
 * - Long distance
 * - Performance multipliers
 * - Bonuses and penalties
 * - Helper share
 * - Platform fee cap
 */

import { driverEarningsService } from '@/lib/services/driver-earnings-service';

describe('Driver Earnings Service', () => {
  describe('Single Delivery', () => {
    it('should calculate basic single delivery earnings correctly', async () => {
      const input = {
        assignmentId: 'test-assignment-1',
        driverId: 'test-driver-1',
        bookingId: 'test-booking-1',
        distanceMiles: 10,
        durationMinutes: 60,
        dropCount: 1,
        loadingMinutes: 15,
        unloadingMinutes: 15,
        drivingMinutes: 30,
        waitingMinutes: 0,
        customerPaymentPence: 5000, // £50
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      const result = await driverEarningsService.calculateEarnings(input);

      expect(result.success).toBe(true);
      expect(result.breakdown.baseFare).toBe(2500); // £25
      expect(result.breakdown.perDropFee).toBe(1200); // £12
      expect(result.breakdown.mileageFee).toBeGreaterThan(0);
      expect(result.breakdown.netEarnings).toBeGreaterThan(0);
      expect(result.breakdown.netEarnings).toBeLessThanOrEqual(input.customerPaymentPence);
    });

    it('should apply urgency multiplier for express delivery', async () => {
      const standardInput = {
        assignmentId: 'test-1',
        driverId: 'driver-1',
        bookingId: 'booking-1',
        distanceMiles: 10,
        durationMinutes: 60,
        dropCount: 1,
        loadingMinutes: 15,
        unloadingMinutes: 15,
        drivingMinutes: 30,
        waitingMinutes: 0,
        customerPaymentPence: 5000,
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      const expressInput = { ...standardInput, urgencyLevel: 'express' as const };

      const standardResult = await driverEarningsService.calculateEarnings(standardInput);
      const expressResult = await driverEarningsService.calculateEarnings(expressInput);

      expect(expressResult.breakdown.netEarnings).toBeGreaterThan(
        standardResult.breakdown.netEarnings
      );
    });
  });

  describe('Multiple Drops Route', () => {
    it('should calculate multi-drop earnings with per-drop fees', async () => {
      const input = {
        assignmentId: 'test-multi-1',
        driverId: 'driver-1',
        bookingId: 'booking-multi-1',
        distanceMiles: 25,
        durationMinutes: 120,
        dropCount: 5,
        loadingMinutes: 30,
        unloadingMinutes: 30,
        drivingMinutes: 60,
        waitingMinutes: 0,
        customerPaymentPence: 15000, // £150
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      const result = await driverEarningsService.calculateEarnings(input);

      expect(result.success).toBe(true);
      expect(result.breakdown.baseFare).toBe(2500); // £25
      expect(result.breakdown.perDropFee).toBe(1200 * 5); // £12 x 5 drops
      expect(result.breakdown.netEarnings).toBeGreaterThan(0);
    });

    it('should apply multi-drop bonus for routes with 5+ drops', async () => {
      const fourDrops = {
        assignmentId: 'test-1',
        driverId: 'driver-1',
        bookingId: 'booking-1',
        distanceMiles: 20,
        durationMinutes: 100,
        dropCount: 4,
        loadingMinutes: 20,
        unloadingMinutes: 20,
        drivingMinutes: 60,
        waitingMinutes: 0,
        customerPaymentPence: 12000,
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      const sixDrops = { ...fourDrops, dropCount: 6, customerPaymentPence: 18000 };

      const fourResult = await driverEarningsService.calculateEarnings(fourDrops);
      const sixResult = await driverEarningsService.calculateEarnings(sixDrops);

      // Six drops should have multi-drop bonus
      expect(sixResult.breakdown.bonuses.multiDropBonus).toBeGreaterThan(0);
      expect(fourResult.breakdown.bonuses.multiDropBonus).toBe(0);
    });
  });

  describe('Long Distance', () => {
    it('should apply long distance bonus for 50+ miles', async () => {
      const shortDistance = {
        assignmentId: 'test-1',
        driverId: 'driver-1',
        bookingId: 'booking-1',
        distanceMiles: 30,
        durationMinutes: 90,
        dropCount: 2,
        loadingMinutes: 20,
        unloadingMinutes: 20,
        drivingMinutes: 50,
        waitingMinutes: 0,
        customerPaymentPence: 8000,
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      const longDistance = { ...shortDistance, distanceMiles: 75, customerPaymentPence: 15000 };

      const shortResult = await driverEarningsService.calculateEarnings(shortDistance);
      const longResult = await driverEarningsService.calculateEarnings(longDistance);

      expect(longResult.breakdown.bonuses.longDistanceBonus).toBeGreaterThan(0);
      expect(shortResult.breakdown.bonuses.longDistanceBonus).toBe(0);
    });
  });

  describe('Bonuses and Penalties', () => {
    it('should apply on-time delivery bonus', async () => {
      const lateDelivery = {
        assignmentId: 'test-1',
        driverId: 'driver-1',
        bookingId: 'booking-1',
        distanceMiles: 15,
        durationMinutes: 60,
        dropCount: 2,
        loadingMinutes: 15,
        unloadingMinutes: 15,
        drivingMinutes: 30,
        waitingMinutes: 0,
        customerPaymentPence: 7000,
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: false,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      const onTimeDelivery = { ...lateDelivery, onTimeDelivery: true };

      const lateResult = await driverEarningsService.calculateEarnings(lateDelivery);
      const onTimeResult = await driverEarningsService.calculateEarnings(onTimeDelivery);

      expect(onTimeResult.breakdown.bonuses.routeExcellence).toBeGreaterThan(0);
      expect(lateResult.breakdown.penalties.lateDelivery).toBeGreaterThan(0);
    });

    it('should include toll and parking reimbursements', async () => {
      const input = {
        assignmentId: 'test-1',
        driverId: 'driver-1',
        bookingId: 'booking-1',
        distanceMiles: 20,
        durationMinutes: 60,
        dropCount: 2,
        loadingMinutes: 15,
        unloadingMinutes: 15,
        drivingMinutes: 30,
        waitingMinutes: 0,
        customerPaymentPence: 8000,
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 500, // £5
        parkingCostsPence: 300, // £3
      };

      const result = await driverEarningsService.calculateEarnings(input);

      expect(result.breakdown.reimbursements.tollCosts).toBe(500);
      expect(result.breakdown.reimbursements.parkingCosts).toBe(300);
      expect(result.breakdown.grossEarnings).toBeGreaterThan(result.breakdown.subtotal);
    });
  });

  describe('Helper Share', () => {
    it('should deduct helper share when helper is present', async () => {
      const withoutHelper = {
        assignmentId: 'test-1',
        driverId: 'driver-1',
        bookingId: 'booking-1',
        distanceMiles: 15,
        durationMinutes: 60,
        dropCount: 2,
        loadingMinutes: 15,
        unloadingMinutes: 15,
        drivingMinutes: 30,
        waitingMinutes: 0,
        customerPaymentPence: 7000,
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
        hasHelper: false,
      };

      const withHelper = { ...withoutHelper, hasHelper: true };

      const withoutResult = await driverEarningsService.calculateEarnings(withoutHelper);
      const withResult = await driverEarningsService.calculateEarnings(withHelper);

      expect(withResult.breakdown.helperShare).toBeGreaterThan(0);
      expect(withResult.breakdown.netEarnings).toBeLessThan(withoutResult.breakdown.netEarnings);
    });
  });

  describe('Platform Fee Cap', () => {
    it('should cap driver earnings at 75% of customer payment', async () => {
      const input = {
        assignmentId: 'test-1',
        driverId: 'driver-1',
        bookingId: 'booking-1',
        distanceMiles: 100, // Very long distance
        durationMinutes: 180,
        dropCount: 10, // Many drops
        loadingMinutes: 60,
        unloadingMinutes: 60,
        drivingMinutes: 60,
        waitingMinutes: 0,
        customerPaymentPence: 10000, // £100
        urgencyLevel: 'premium' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      const result = await driverEarningsService.calculateEarnings(input);

      const maxEarnings = input.customerPaymentPence * 0.75; // 75% cap
      expect(result.breakdown.cappedNetEarnings).toBeLessThanOrEqual(maxEarnings);
      
      if (result.breakdown.capApplied) {
        expect(result.warnings).toContain('Earnings capped at 75% of customer payment');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero distance gracefully', async () => {
      const input = {
        assignmentId: 'test-1',
        driverId: 'driver-1',
        bookingId: 'booking-1',
        distanceMiles: 0,
        durationMinutes: 30,
        dropCount: 1,
        loadingMinutes: 15,
        unloadingMinutes: 15,
        drivingMinutes: 0,
        waitingMinutes: 0,
        customerPaymentPence: 3000,
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      const result = await driverEarningsService.calculateEarnings(input);

      expect(result.success).toBe(true);
      expect(result.breakdown.mileageFee).toBe(0);
      expect(result.breakdown.baseFare).toBeGreaterThan(0);
    });

    it('should handle maximum drops (20)', async () => {
      const input = {
        assignmentId: 'test-1',
        driverId: 'driver-1',
        bookingId: 'booking-1',
        distanceMiles: 50,
        durationMinutes: 300,
        dropCount: 20,
        loadingMinutes: 100,
        unloadingMinutes: 100,
        drivingMinutes: 100,
        waitingMinutes: 0,
        customerPaymentPence: 40000, // £400
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      const result = await driverEarningsService.calculateEarnings(input);

      expect(result.success).toBe(true);
      expect(result.breakdown.perDropFee).toBe(1200 * 20);
      expect(result.breakdown.bonuses.multiDropBonus).toBeGreaterThan(0);
    });

    it('should validate negative values', async () => {
      const input = {
        assignmentId: 'test-1',
        driverId: 'driver-1',
        bookingId: 'booking-1',
        distanceMiles: -10, // Invalid
        durationMinutes: 60,
        dropCount: 1,
        loadingMinutes: 15,
        unloadingMinutes: 15,
        drivingMinutes: 30,
        waitingMinutes: 0,
        customerPaymentPence: 5000,
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      const result = await driverEarningsService.calculateEarnings(input);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Consistency', () => {
    it('should return same result for same input', async () => {
      const input = {
        assignmentId: 'test-1',
        driverId: 'driver-1',
        bookingId: 'booking-1',
        distanceMiles: 15,
        durationMinutes: 60,
        dropCount: 3,
        loadingMinutes: 20,
        unloadingMinutes: 20,
        drivingMinutes: 20,
        waitingMinutes: 0,
        customerPaymentPence: 8000,
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      const result1 = await driverEarningsService.calculateEarnings(input);
      const result2 = await driverEarningsService.calculateEarnings(input);

      expect(result1.breakdown.netEarnings).toBe(result2.breakdown.netEarnings);
      expect(result1.breakdown.baseFare).toBe(result2.breakdown.baseFare);
      expect(result1.breakdown.perDropFee).toBe(result2.breakdown.perDropFee);
    });
  });
});

