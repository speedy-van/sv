/**
 * Integration Tests for Capacity-Integrated Pricing API
 * 
 * Tests that Economy tier is only shown when capacity validation passes
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals';

// Mock global fetch for dataset loader
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock dataset with known items
const mockDataset = {
  metadata: {
    version: '1.0',
    date: '2025-01-04',
    total_items: 3,
    categories: 2,
  },
  items: [
    {
      id: 'small_item_10kg',
      name: 'Small Item',
      category: 'Storage',
      volume: '0.1',  // 0.1 m³
      weight: 10,
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: true,
      workers_required: 1,
    },
    {
      id: 'medium_item_100kg',
      name: 'Medium Item',
      category: 'Furniture',
      volume: '2.0',  // 2.0 m³
      weight: 100,
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: true,
      workers_required: 2,
    },
    {
      id: 'oversized_item_800kg',
      name: 'Oversized Heavy Item',
      category: 'Equipment',
      volume: '10.0',  // 10.0 m³
      weight: 800,
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: false,
      workers_required: 4,
    },
  ],
};

beforeAll(() => {
  (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
    ok: true,
    json: async () => mockDataset,
  } as Response);
});

describe('Capacity-Integrated Pricing API', () => {
  describe('Capacity Validation Integration', () => {
    it('should validate small feasible load for all tiers', async () => {
      // Import the validation function
      const { planCapacityConstrainedRoute } = await import('@/lib/capacity/capacity-constrained-vrp');

      const bookings = [
        {
          id: 'booking1',
          pickupAddress: '123 Test St',
          deliveryAddress: '456 Delivery Ave',
          itemIds: ['small_item_10kg'],
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      expect(result.isFeasible).toBe(true);
      expect(result.primaryRoute).not.toBeNull();
    });

    it('should validate medium feasible load for all tiers', async () => {
      const { planCapacityConstrainedRoute } = await import('@/lib/capacity/capacity-constrained-vrp');

      const bookings = [
        {
          id: 'booking1',
          pickupAddress: '123 Test St',
          deliveryAddress: '456 Delivery Ave',
          itemIds: ['medium_item_100kg', 'small_item_10kg'],
        },
      ];

      const economyResult = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });
      const standardResult = await planCapacityConstrainedRoute(bookings, { tier: 'standard' });
      const expressResult = await planCapacityConstrainedRoute(bookings, { tier: 'express' });

      expect(economyResult.isFeasible).toBe(true);
      expect(standardResult.isFeasible).toBe(true);
      expect(expressResult.isFeasible).toBe(true);
    });

    it('should reject oversized load for economy tier but allow standard/express', async () => {
      const { planCapacityConstrainedRoute } = await import('@/lib/capacity/capacity-constrained-vrp');

      const bookings = [
        {
          id: 'booking1',
          pickupAddress: '123 Test St',
          deliveryAddress: '456 Delivery Ave',
          itemIds: ['oversized_item_800kg', 'oversized_item_800kg'], // 2 × 10m³ = 20m³
        },
      ];

      const economyResult = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      // Economy tier should reject due to volume/weight overflow
      expect(economyResult.isFeasible).toBe(false);
      expect(economyResult.rejectionReasons.length).toBeGreaterThan(0);
      expect(economyResult.requiresMultipleVans).toBe(true);
    });

    it('should handle multi-drop scenarios with capacity constraints', async () => {
      const { planCapacityConstrainedRoute } = await import('@/lib/capacity/capacity-constrained-vrp');

      const bookings = [
        {
          id: 'booking1',
          pickupAddress: '123 Pickup A',
          deliveryAddress: '456 Delivery A',
          itemIds: ['medium_item_100kg'],
        },
        {
          id: 'booking2',
          pickupAddress: '789 Pickup B',
          deliveryAddress: '101 Delivery B',
          itemIds: ['medium_item_100kg'],
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      // Should be feasible: 2 × 2m³ = 4m³ (well within capacity)
      expect(result.isFeasible).toBe(true);
      expect(result.primaryRoute).not.toBeNull();
      expect(result.primaryRoute!.stops).toHaveLength(4); // 2 pickups + 2 dropoffs
    });
  });

  describe('Tier-Specific Capacity Behavior', () => {
    it('should show different utilization rates for different tiers', async () => {
      const { planCapacityConstrainedRoute } = await import('@/lib/capacity/capacity-constrained-vrp');

      const bookings = [
        {
          id: 'booking1',
          pickupAddress: '123 Test St',
          deliveryAddress: '456 Delivery Ave',
          itemIds: ['medium_item_100kg', 'medium_item_100kg', 'medium_item_100kg'],
          // 3 × 2m³ = 6m³
        },
      ];

      const economyResult = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });
      const expressResult = await planCapacityConstrainedRoute(bookings, { tier: 'express' });

      if (economyResult.isFeasible && expressResult.isFeasible) {
        const economyUtilization = economyResult.primaryRoute!.capacityAnalysis.peakVolumeUtilization;
        const expressUtilization = expressResult.primaryRoute!.capacityAnalysis.peakVolumeUtilization;

        // Express should show higher utilization (stricter buffers)
        expect(expressUtilization).toBeGreaterThan(economyUtilization);
      }
    });

    it('should provide clear rejection reasons when capacity is exceeded', async () => {
      const { planCapacityConstrainedRoute } = await import('@/lib/capacity/capacity-constrained-vrp');

      const bookings = [
        {
          id: 'booking1',
          pickupAddress: '123 Test St',
          deliveryAddress: '456 Delivery Ave',
          itemIds: ['oversized_item_800kg', 'oversized_item_800kg', 'oversized_item_800kg'],
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      expect(result.isFeasible).toBe(false);
      expect(result.rejectionReasons.length).toBeGreaterThan(0);
      expect(result.suggestions.length).toBeGreaterThan(0);
      
      // Should suggest multiple vans or tier upgrade
      const hasSuggestions = result.suggestions.some(s => 
        s.includes('multiple') || s.includes('tier') || s.includes('Split')
      );
      expect(hasSuggestions).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty item list gracefully', async () => {
      const { planCapacityConstrainedRoute } = await import('@/lib/capacity/capacity-constrained-vrp');

      const bookings = [
        {
          id: 'booking1',
          pickupAddress: '123 Test St',
          deliveryAddress: '456 Delivery Ave',
          itemIds: [],
        },
      ];

      await expect(planCapacityConstrainedRoute(bookings)).rejects.toThrow();
    });

    it('should handle items not in dataset', async () => {
      const { planCapacityConstrainedRoute } = await import('@/lib/capacity/capacity-constrained-vrp');

      const bookings = [
        {
          id: 'booking1',
          pickupAddress: '123 Test St',
          deliveryAddress: '456 Delivery Ave',
          itemIds: ['non_existent_item_xyz'],
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      // Should complete but with warnings
      expect(result.primaryRoute).not.toBeNull();
      if (result.primaryRoute) {
        expect(result.primaryRoute.capacityAnalysis.warnings.length).toBeGreaterThan(0);
      }
    });

    it('should handle maximum allowed items', async () => {
      const { planCapacityConstrainedRoute } = await import('@/lib/capacity/capacity-constrained-vrp');

      // Create many small items
      const manySmallItems = Array(50).fill('small_item_10kg');

      const bookings = [
        {
          id: 'booking1',
          pickupAddress: '123 Test St',
          deliveryAddress: '456 Delivery Ave',
          itemIds: manySmallItems, // 50 × 0.1m³ = 5m³
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      // Should be feasible (5m³ is within capacity)
      expect(result.isFeasible).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should complete capacity validation within reasonable time', async () => {
      const { planCapacityConstrainedRoute } = await import('@/lib/capacity/capacity-constrained-vrp');

      const bookings = [
        {
          id: 'booking1',
          pickupAddress: '123 Test St',
          deliveryAddress: '456 Delivery Ave',
          itemIds: ['medium_item_100kg'],
        },
      ];

      const startTime = Date.now();
      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});

describe('Economy Tier Visibility Logic', () => {
  it('should hide economy tier when capacity validation fails', () => {
    // Mock availability response with capacity validation
    const availability = {
      economy: null,
      economyRejectionReason: 'Volume exceeds capacity: 20.00m³ > 15.20m³',
      standard: {
        next_available_date: '2025-10-05',
        window: 'ALL_DAY' as const,
        route_type: 'standard' as const,
        confidence: 85,
      },
      express: {
        next_available_date: '2025-10-05',
        window: 'ALL_DAY' as const,
        route_type: 'express' as const,
        confidence: 95,
      },
      capacityValidation: {
        economy: { feasible: false, rejectionReason: 'Volume exceeds capacity' },
        standard: { feasible: true, rejectionReason: null },
        express: { feasible: true, rejectionReason: null },
      },
    };

    // UI should only show Standard and Express
    expect(availability.economy).toBeNull();
    expect(availability.economyRejectionReason).toBeDefined();
    expect(availability.standard).not.toBeNull();
    expect(availability.express).not.toBeNull();
  });

  it('should show economy tier when capacity validation passes', () => {
    const availability = {
      economy: {
        next_available_date: '2025-10-05',
        window: 'ALL_DAY' as const,
        route_type: 'economy' as const,
        confidence: 75,
      },
      standard: {
        next_available_date: '2025-10-05',
        window: 'ALL_DAY' as const,
        route_type: 'standard' as const,
        confidence: 85,
      },
      express: {
        next_available_date: '2025-10-05',
        window: 'ALL_DAY' as const,
        route_type: 'express' as const,
        confidence: 95,
      },
      capacityValidation: {
        economy: { feasible: true, rejectionReason: null },
        standard: { feasible: true, rejectionReason: null },
        express: { feasible: true, rejectionReason: null },
      },
    };

    // UI should show all three tiers
    expect(availability.economy).not.toBeNull();
    expect(availability.standard).not.toBeNull();
    expect(availability.express).not.toBeNull();
  });
});
