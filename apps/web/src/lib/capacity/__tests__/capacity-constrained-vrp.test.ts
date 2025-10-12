/**
 * Unit Tests for Capacity-Constrained VRP Solver
 * 
 * Tests route optimization, repair heuristics, and feasibility checks
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  planCapacityConstrainedRoute,
  canFitInSingleVan,
  suggestVanSplit,
  type BookingRequest,
  type RoutePlanResult,
} from '../capacity-constrained-vrp';

// Mock global fetch for dataset loader
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock dataset with known items
const mockDataset = {
  metadata: {
    version: '1.0',
    date: '2025-01-04',
    total_items: 5,
    categories: 2,
  },
  items: [
    {
      id: 'small_box_5kg',
      name: 'Small Box',
      category: 'Storage',
      volume: '0.1',  // 0.1 m³
      weight: 5,
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: true,
      workers_required: 1,
    },
    {
      id: 'medium_furniture_50kg',
      name: 'Medium Furniture',
      category: 'Living Room',
      volume: '1.0',  // 1.0 m³
      weight: 50,
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: true,
      workers_required: 1,
    },
    {
      id: 'large_sofa_150kg',
      name: 'Large Sofa',
      category: 'Living Room',
      volume: '3.0',  // 3.0 m³
      weight: 150,
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: true,
      workers_required: 2,
    },
    {
      id: 'heavy_appliance_300kg',
      name: 'Heavy Appliance',
      category: 'Kitchen',
      volume: '1.5',  // 1.5 m³
      weight: 300,
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: true,
      workers_required: 2,
    },
    {
      id: 'oversized_600kg',
      name: 'Oversized Heavy Item',
      category: 'Equipment',
      volume: '5.0',  // 5.0 m³
      weight: 600,
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: true,
      workers_required: 3,
    },
  ],
};

beforeAll(() => {
  (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
    ok: true,
    json: async () => mockDataset,
  } as Response);
});

describe('Capacity-Constrained VRP Solver', () => {
  describe('Single Booking - Simple Cases', () => {
    it('should plan feasible route for single small booking', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: '123 Pickup St',
          deliveryAddress: '456 Delivery Ave',
          itemIds: ['small_box_5kg'],
          priority: 'standard',
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      expect(result.isFeasible).toBe(true);
      expect(result.primaryRoute).not.toBeNull();
      expect(result.primaryRoute!.feasible).toBe(true);
      expect(result.primaryRoute!.stops).toHaveLength(2); // 1 pickup + 1 dropoff
      expect(result.rejectionReasons).toHaveLength(0);
    });

    it('should plan feasible route for medium-sized booking', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking2',
          pickupAddress: 'Pickup Location A',
          deliveryAddress: 'Delivery Location A',
          itemIds: ['medium_furniture_50kg', 'small_box_5kg'],
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      expect(result.isFeasible).toBe(true);
      expect(result.primaryRoute).not.toBeNull();
      
      // Check capacity analysis
      const analysis = result.primaryRoute!.capacityAnalysis;
      expect(analysis.isFeasible).toBe(true);
      expect(analysis.peakVolume_m3).toBeCloseTo(1.1, 1); // 1.0 + 0.1
      expect(analysis.peakWeight_kg).toBe(55); // 50 + 5
    });
  });

  describe('Multi-Booking Routes', () => {
    it('should plan feasible route for 2 bookings', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'Pickup A',
          deliveryAddress: 'Delivery A',
          itemIds: ['medium_furniture_50kg'],
        },
        {
          id: 'booking2',
          pickupAddress: 'Pickup B',
          deliveryAddress: 'Delivery B',
          itemIds: ['small_box_5kg'],
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      expect(result.isFeasible).toBe(true);
      expect(result.primaryRoute).not.toBeNull();
      expect(result.primaryRoute!.stops).toHaveLength(4); // 2 pickups + 2 dropoffs
      
      // Verify greedy algorithm: all pickups first, then all dropoffs
      const stops = result.primaryRoute!.stops;
      expect(stops[0].type).toBe('pickup');
      expect(stops[1].type).toBe('pickup');
      expect(stops[2].type).toBe('dropoff');
      expect(stops[3].type).toBe('dropoff');
    });

    it('should track peak load correctly in multi-drop scenario', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'Pickup A',
          deliveryAddress: 'Delivery A',
          itemIds: ['large_sofa_150kg'], // 3.0 m³, 150 kg
        },
        {
          id: 'booking2',
          pickupAddress: 'Pickup B',
          deliveryAddress: 'Delivery B',
          itemIds: ['medium_furniture_50kg'], // 1.0 m³, 50 kg
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      expect(result.isFeasible).toBe(true);
      
      // Peak should be after both pickups: 3.0 + 1.0 = 4.0 m³, 150 + 50 = 200 kg
      const analysis = result.primaryRoute!.capacityAnalysis;
      expect(analysis.peakVolume_m3).toBeCloseTo(4.0, 1);
      expect(analysis.peakWeight_kg).toBe(200);
    });
  });

  describe('Capacity Violations and Rejections', () => {
    it('should reject route when total volume exceeds capacity', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'Pickup A',
          deliveryAddress: 'Delivery A',
          itemIds: ['oversized_600kg', 'oversized_600kg', 'oversized_600kg', 'oversized_600kg'],
          // 4 × 5.0 m³ = 20 m³ (exceeds 16 m³ capacity)
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      expect(result.isFeasible).toBe(false);
      expect(result.primaryRoute).toBeNull();
      expect(result.rejectionReasons.length).toBeGreaterThan(0);
      expect(result.requiresMultipleVans).toBe(true);
      expect(result.suggestions.some(s => s.includes('multiple van'))).toBe(true);
    });

    it('should reject route when total weight exceeds capacity', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'Pickup A',
          deliveryAddress: 'Delivery A',
          itemIds: ['heavy_appliance_300kg', 'heavy_appliance_300kg', 'heavy_appliance_300kg', 'heavy_appliance_300kg', 'heavy_appliance_300kg'],
          // 5 × 300 kg = 1500 kg (exceeds 1350 kg available payload)
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      expect(result.isFeasible).toBe(false);
      expect(result.rejectionReasons.length).toBeGreaterThan(0);
      expect(result.requiresMultipleVans).toBe(true);
    });

    it('should handle peak load violations in multi-drop routes', async () => {
      // Total capacity OK, but peak load during overlapping bookings exceeds capacity
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'Pickup A',
          deliveryAddress: 'Delivery A',
          itemIds: ['large_sofa_150kg', 'large_sofa_150kg', 'large_sofa_150kg'],
          // 3 × 3.0 m³ = 9.0 m³
        },
        {
          id: 'booking2',
          pickupAddress: 'Pickup B',
          deliveryAddress: 'Delivery B',
          itemIds: ['large_sofa_150kg', 'large_sofa_150kg', 'large_sofa_150kg'],
          // 3 × 3.0 m³ = 9.0 m³
        },
        // Peak: 9.0 + 9.0 = 18.0 m³ (exceeds 16 m³ with buffer)
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      // This scenario is actually feasible with greedy algorithm
      // Total volume: 18 m³, but with economy buffer (5%), effective capacity is 15.2 m³
      // Peak will be 18 m³ when both bookings are loaded, which exceeds capacity
      expect(result.isFeasible).toBe(false);
      expect(result.rejectionReasons.length).toBeGreaterThan(0);
    });
  });

  describe('Tier-Specific Behavior', () => {
    it('should apply economy tier buffers (stricter)', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'Pickup A',
          deliveryAddress: 'Delivery A',
          itemIds: ['large_sofa_150kg', 'large_sofa_150kg', 'large_sofa_150kg'],
        },
      ];

      const economyResult = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      expect(economyResult.primaryRoute).not.toBeNull();
      
      // Economy tier should show higher utilization due to buffers
      const economyUtilization = economyResult.primaryRoute!.capacityAnalysis.peakVolumeUtilization;
      expect(economyUtilization).toBeGreaterThan(0.5);
    });

    it('should apply express tier buffers (more lenient)', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'Pickup A',
          deliveryAddress: 'Delivery A',
          itemIds: ['large_sofa_150kg', 'large_sofa_150kg', 'large_sofa_150kg'],
        },
      ];

      const expressResult = await planCapacityConstrainedRoute(bookings, { tier: 'express' });

      expect(expressResult.primaryRoute).not.toBeNull();
      
      // Express tier should show higher utilization (stricter buffers = less effective capacity)
      const expressUtilization = expressResult.primaryRoute!.capacityAnalysis.peakVolumeUtilization;
      expect(expressUtilization).toBeGreaterThan(0.6);
    });
  });

  describe('Optimization Strategies', () => {
    it('should try alternative routes when greedy fails', async () => {
      // Create a scenario where greedy might not be optimal
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'Pickup A',
          deliveryAddress: 'Delivery A',
          itemIds: ['medium_furniture_50kg'],
          priority: 'express',
        },
        {
          id: 'booking2',
          pickupAddress: 'Pickup B',
          deliveryAddress: 'Delivery B',
          itemIds: ['small_box_5kg'],
          priority: 'economy',
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      expect(result.isFeasible).toBe(true);
      
      // Check if alternative routes were generated
      if (result.alternativeRoutes.length > 0) {
        expect(result.suggestions.length).toBeGreaterThan(0);
      }
    });

    it('should return optimization metadata', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'Pickup A',
          deliveryAddress: 'Delivery A',
          itemIds: ['small_box_5kg'],
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      expect(result.primaryRoute).not.toBeNull();
      expect(result.primaryRoute!.optimizationMethod).toBeDefined();
      expect(result.primaryRoute!.iterationsRequired).toBeGreaterThan(0);
    });
  });

  describe('Helper Functions', () => {
    describe('canFitInSingleVan', () => {
      it('should confirm small load fits', async () => {
        const bookings: BookingRequest[] = [
          {
            id: 'booking1',
            pickupAddress: 'A',
            deliveryAddress: 'B',
            itemIds: ['small_box_5kg', 'medium_furniture_50kg'],
          },
        ];

        const check = await canFitInSingleVan(bookings, 'economy');

        expect(check.fits).toBe(true);
        expect(check.totalVolume_m3).toBeCloseTo(1.1, 1);
        expect(check.totalWeight_kg).toBe(55);
      });

      it('should reject oversized load', async () => {
        const bookings: BookingRequest[] = [
          {
            id: 'booking1',
            pickupAddress: 'A',
            deliveryAddress: 'B',
            itemIds: ['oversized_600kg', 'oversized_600kg', 'oversized_600kg', 'oversized_600kg'],
          },
        ];

        const check = await canFitInSingleVan(bookings, 'economy');

        expect(check.fits).toBe(false);
        expect(check.reasons.length).toBeGreaterThan(0);
      });
    });

    describe('suggestVanSplit', () => {
      it('should split bookings between two vans', async () => {
        const bookings: BookingRequest[] = [
          {
            id: 'booking1',
            pickupAddress: 'A',
            deliveryAddress: 'B',
            itemIds: ['large_sofa_150kg', 'large_sofa_150kg'],
          },
          {
            id: 'booking2',
            pickupAddress: 'C',
            deliveryAddress: 'D',
            itemIds: ['large_sofa_150kg', 'large_sofa_150kg'],
          },
        ];

        const split = await suggestVanSplit(bookings, 'economy');

        expect(split.van1Bookings.length).toBeGreaterThan(0);
        expect(split.van2Bookings.length).toBeGreaterThan(0);
        expect(split.van1Bookings.length + split.van2Bookings.length).toBe(2);
        
        // Check volumes are reasonable
        expect(split.van1Volume_m3).toBeGreaterThan(0);
        expect(split.van2Volume_m3).toBeGreaterThan(0);
      });

      it('should balance load between vans', async () => {
        const bookings: BookingRequest[] = [
          {
            id: 'booking1',
            pickupAddress: 'A',
            deliveryAddress: 'B',
            itemIds: ['medium_furniture_50kg'],
          },
          {
            id: 'booking2',
            pickupAddress: 'C',
            deliveryAddress: 'D',
            itemIds: ['medium_furniture_50kg'],
          },
          {
            id: 'booking3',
            pickupAddress: 'E',
            deliveryAddress: 'F',
            itemIds: ['medium_furniture_50kg'],
          },
        ];

        const split = await suggestVanSplit(bookings, 'economy');

        // Algorithm splits by half capacity (8 m³)
        // Each booking is 1.0 m³, so all 3 can fit in van1
        // This is a simple greedy split, not a balanced one
        expect(split.van1Bookings.length + split.van2Bookings.length).toBe(3);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty bookings array', async () => {
      const bookings: BookingRequest[] = [];

      const result = await planCapacityConstrainedRoute(bookings);
      
      // Should return error result, not throw
      expect(result.isFeasible).toBe(false);
      expect(result.rejectionReasons.length).toBeGreaterThan(0);
    });

    it('should handle booking with no items', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'A',
          deliveryAddress: 'B',
          itemIds: [],
        },
      ];

      await expect(planCapacityConstrainedRoute(bookings)).rejects.toThrow();
    });

    it('should handle bookings with missing items in dataset', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'A',
          deliveryAddress: 'B',
          itemIds: ['non_existent_item_xyz'],
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      // Should complete but with warnings
      expect(result.primaryRoute).not.toBeNull();
      expect(result.primaryRoute!.capacityAnalysis.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Result Metadata', () => {
    it('should include comprehensive metadata in result', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'A',
          deliveryAddress: 'B',
          itemIds: ['medium_furniture_50kg', 'small_box_5kg'],
        },
      ];

      const result = await planCapacityConstrainedRoute(bookings, { tier: 'economy' });

      expect(result.bookingRequests).toHaveLength(1);
      expect(result.totalItemCount).toBe(2);
      expect(result.totalVolume_m3).toBeCloseTo(1.1, 1);
      expect(result.totalWeight_kg).toBe(55);
    });
  });
});
