/**
 * Integration Tests for Driver Earnings Flow
 * 
 * Tests the complete flow from job assignment to earnings calculation
 */

import { driverEarningsService } from '@/lib/services/driver-earnings-service';

describe('Driver Earnings Integration Flow', () => {
  describe('Complete Job Flow', () => {
    it('should calculate earnings for completed single delivery job', async () => {
      // Simulate a complete job flow
      const jobData = {
        assignmentId: 'integration-test-1',
        driverId: 'driver-integration-1',
        bookingId: 'booking-integration-1',
        distanceMiles: 15,
        durationMinutes: 60,
        dropCount: 1,
        loadingMinutes: 20,
        unloadingMinutes: 20,
        drivingMinutes: 20,
        waitingMinutes: 0,
        customerPaymentPence: 6000, // £60
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      const result = await driverEarningsService.calculateEarnings(jobData);

      // Verify success
      expect(result.success).toBe(true);
      
      // Verify breakdown exists
      expect(result.breakdown).toBeDefined();
      expect(result.breakdown.baseFare).toBeGreaterThan(0);
      expect(result.breakdown.perDropFee).toBeGreaterThan(0);
      expect(result.breakdown.netEarnings).toBeGreaterThan(0);
      
      // Verify earnings are reasonable
      expect(result.breakdown.netEarnings).toBeLessThanOrEqual(jobData.customerPaymentPence);
      expect(result.breakdown.netEarnings).toBeGreaterThan(jobData.customerPaymentPence * 0.4); // At least 40%
      
      // Verify platform fee is reasonable
      const platformFee = jobData.customerPaymentPence - result.breakdown.netEarnings;
      const platformFeePercentage = (platformFee / jobData.customerPaymentPence) * 100;
      expect(platformFeePercentage).toBeLessThanOrEqual(60); // Max 60% platform fee
    });

    it('should handle multi-drop route with all features', async () => {
      const multiDropJob = {
        assignmentId: 'integration-multi-1',
        driverId: 'driver-multi-1',
        bookingId: 'booking-multi-1',
        distanceMiles: 60, // Long distance
        durationMinutes: 180,
        dropCount: 7, // Multi-drop bonus eligible
        loadingMinutes: 40,
        unloadingMinutes: 40,
        drivingMinutes: 100,
        waitingMinutes: 0,
        customerPaymentPence: 20000, // £200
        urgencyLevel: 'express' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 800, // £8
        parkingCostsPence: 500, // £5
        hasHelper: true,
      };

      const result = await driverEarningsService.calculateEarnings(multiDropJob);

      // Verify all bonuses applied
      expect(result.breakdown.bonuses.multiDropBonus).toBeGreaterThan(0);
      expect(result.breakdown.bonuses.longDistanceBonus).toBeGreaterThan(0);
      expect(result.breakdown.bonuses.routeExcellence).toBeGreaterThan(0);
      
      // Verify reimbursements
      expect(result.breakdown.reimbursements.tollCosts).toBe(800);
      expect(result.breakdown.reimbursements.parkingCosts).toBe(500);
      
      // Verify helper share deducted
      expect(result.breakdown.helperShare).toBeGreaterThan(0);
      
      // Verify urgency multiplier applied
      expect(result.breakdown.urgencyMultiplier).toBe(1.3); // Express
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle minimum viable job', async () => {
      const minJob = {
        assignmentId: 'min-test-1',
        driverId: 'driver-min-1',
        bookingId: 'booking-min-1',
        distanceMiles: 1,
        durationMinutes: 15,
        dropCount: 1,
        loadingMinutes: 5,
        unloadingMinutes: 5,
        drivingMinutes: 5,
        waitingMinutes: 0,
        customerPaymentPence: 2500, // £25 minimum
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      const result = await driverEarningsService.calculateEarnings(minJob);

      expect(result.success).toBe(true);
      expect(result.breakdown.netEarnings).toBeGreaterThan(0);
    });

    it('should handle maximum viable job', async () => {
      const maxJob = {
        assignmentId: 'max-test-1',
        driverId: 'driver-max-1',
        bookingId: 'booking-max-1',
        distanceMiles: 200, // Very long distance
        durationMinutes: 480, // 8 hours
        dropCount: 20, // Maximum drops
        loadingMinutes: 120,
        unloadingMinutes: 120,
        drivingMinutes: 240,
        waitingMinutes: 0,
        customerPaymentPence: 50000, // £500 maximum
        urgencyLevel: 'premium' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 2000, // £20
        parkingCostsPence: 1000, // £10
        hasHelper: true,
      };

      const result = await driverEarningsService.calculateEarnings(maxJob);

      expect(result.success).toBe(true);
      
      // Should hit the cap
      const maxDriverEarnings = maxJob.customerPaymentPence * 0.75; // 75% cap
      expect(result.breakdown.cappedNetEarnings).toBeLessThanOrEqual(maxDriverEarnings);
      
      if (result.breakdown.capApplied) {
        expect(result.warnings).toContain('Earnings capped at 75% of customer payment');
      }
    });

    it('should reject invalid input', async () => {
      const invalidJob = {
        assignmentId: 'invalid-test-1',
        driverId: 'driver-invalid-1',
        bookingId: 'booking-invalid-1',
        distanceMiles: -10, // Invalid negative
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

      const result = await driverEarningsService.calculateEarnings(invalidJob);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Consistency and Reliability', () => {
    it('should return consistent results for identical inputs', async () => {
      const jobData = {
        assignmentId: 'consistency-test-1',
        driverId: 'driver-consistency-1',
        bookingId: 'booking-consistency-1',
        distanceMiles: 25,
        durationMinutes: 90,
        dropCount: 3,
        loadingMinutes: 30,
        unloadingMinutes: 30,
        drivingMinutes: 30,
        waitingMinutes: 0,
        customerPaymentPence: 10000,
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      // Calculate 10 times
      const results = await Promise.all(
        Array.from({ length: 10 }, () => driverEarningsService.calculateEarnings(jobData))
      );

      // All results should be identical
      const firstResult = results[0];
      results.forEach((result) => {
        expect(result.breakdown.netEarnings).toBe(firstResult.breakdown.netEarnings);
        expect(result.breakdown.baseFare).toBe(firstResult.breakdown.baseFare);
        expect(result.breakdown.perDropFee).toBe(firstResult.breakdown.perDropFee);
      });
    });

    it('should handle concurrent calculations', async () => {
      const jobs = Array.from({ length: 100 }, (_, i) => ({
        assignmentId: `concurrent-test-${i}`,
        driverId: `driver-concurrent-${i}`,
        bookingId: `booking-concurrent-${i}`,
        distanceMiles: 10 + (i % 50),
        durationMinutes: 60,
        dropCount: 1 + (i % 5),
        loadingMinutes: 15,
        unloadingMinutes: 15,
        drivingMinutes: 30,
        waitingMinutes: 0,
        customerPaymentPence: 5000 + (i * 100),
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        onTimeDelivery: true,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      }));

      // Calculate all concurrently
      const results = await Promise.all(
        jobs.map((job) => driverEarningsService.calculateEarnings(job))
      );

      // All should succeed
      expect(results.every((r) => r.success)).toBe(true);
      
      // All should have valid earnings
      expect(results.every((r) => r.breakdown.netEarnings > 0)).toBe(true);
    });
  });

  describe('Business Rules Validation', () => {
    it('should ensure platform always makes profit', async () => {
      const testCases = [
        { distance: 5, drops: 1, payment: 3000 },
        { distance: 20, drops: 3, payment: 8000 },
        { distance: 50, drops: 5, payment: 15000 },
        { distance: 100, drops: 10, payment: 30000 },
      ];

      for (const testCase of testCases) {
        const result = await driverEarningsService.calculateEarnings({
          assignmentId: `profit-test-${testCase.distance}`,
          driverId: 'driver-profit-1',
          bookingId: 'booking-profit-1',
          distanceMiles: testCase.distance,
          durationMinutes: 60,
          dropCount: testCase.drops,
          loadingMinutes: 15,
          unloadingMinutes: 15,
          drivingMinutes: 30,
          waitingMinutes: 0,
          customerPaymentPence: testCase.payment,
          urgencyLevel: 'standard' as const,
          serviceType: 'standard' as const,
          onTimeDelivery: true,
          tollCostsPence: 0,
          parkingCostsPence: 0,
        });

        const platformRevenue = testCase.payment - result.breakdown.netEarnings;
        const platformMargin = (platformRevenue / testCase.payment) * 100;

        // Platform should make at least 25% margin
        expect(platformMargin).toBeGreaterThanOrEqual(25);
      }
    });

    it('should incentivize on-time delivery', async () => {
      const baseJob = {
        assignmentId: 'incentive-test-1',
        driverId: 'driver-incentive-1',
        bookingId: 'booking-incentive-1',
        distanceMiles: 20,
        durationMinutes: 60,
        dropCount: 2,
        loadingMinutes: 15,
        unloadingMinutes: 15,
        drivingMinutes: 30,
        waitingMinutes: 0,
        customerPaymentPence: 7000,
        urgencyLevel: 'standard' as const,
        serviceType: 'standard' as const,
        tollCostsPence: 0,
        parkingCostsPence: 0,
      };

      const onTimeResult = await driverEarningsService.calculateEarnings({
        ...baseJob,
        onTimeDelivery: true,
      });

      const lateResult = await driverEarningsService.calculateEarnings({
        ...baseJob,
        onTimeDelivery: false,
      });

      // On-time should earn more
      expect(onTimeResult.breakdown.netEarnings).toBeGreaterThan(lateResult.breakdown.netEarnings);
      
      // Difference should be significant (at least £5)
      const difference = onTimeResult.breakdown.netEarnings - lateResult.breakdown.netEarnings;
      expect(difference).toBeGreaterThanOrEqual(500);
    });
  });
});

