/**
 * Multi-Booking Route Optimizer Tests
 * 
 * Tests intelligent route planning for multiple bookings (2-10 per route).
 * Validates that the system can:
 * - Combine multiple bookings efficiently
 * - Handle flexible pickup/drop sequences
 * - Optimize for capacity utilization
 * - Respect capacity constraints at every leg
 */

import {
  planMultiBookingRoutes,
  calculateDistance,
  type ExtendedBookingRequest,
  type Location,
} from '../multi-booking-route-optimizer';

// Mock global fetch for dataset loader
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock dataset
const mockDataset = {
  metadata: {
    version: '1.0',
    date: '2025-01-04',
    total_items: 5,
    categories: 2,
  },
  items: [
    {
      id: 'small_item_10kg',
      name: 'Small Item',
      category: 'Storage',
      volume: '0.05',
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
      category: 'Living Room',
      volume: '1.0',
      weight: 100,
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: true,
      workers_required: 1,
    },
    {
      id: 'large_item_200kg',
      name: 'Large Item',
      category: 'Bedroom',
      volume: '2.0',
      weight: 200,
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: true,
      workers_required: 2,
    },
  ],
};

beforeAll(() => {
  (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
    ok: true,
    json: async () => mockDataset,
  } as Response);
});

describe('Multi-Booking Route Optimizer', () => {
  describe('Basic Multi-Booking Combination', () => {
    it('should combine 2 small bookings into single route', async () => {
      const bookings: ExtendedBookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'Pickup A',
          deliveryAddress: 'Delivery A',
          itemIds: ['small_item_10kg'],
        },
        {
          id: 'booking2',
          pickupAddress: 'Pickup B',
          deliveryAddress: 'Delivery B',
          itemIds: ['small_item_10kg'],
        },
      ];
      
      const result = await planMultiBookingRoutes(bookings, {
        tier: 'economy',
        maxBookingsPerRoute: 10,
        minBookingsPerRoute: 2,
      });
      
      expect(result.success).toBe(true);
      expect(result.allBookingsFit).toBe(true);
      expect(result.recommendedRoutes.length).toBeGreaterThan(0);
      
      // Should combine into 1 route
      const firstRoute = result.recommendedRoutes[0];
      expect(firstRoute.bookingIds).toHaveLength(2);
      expect(firstRoute.bookingIds).toContain('booking1');
      expect(firstRoute.bookingIds).toContain('booking2');
      
      // Capacity should be well under limit
      expect(firstRoute.capacityAnalysis.peakVolumeUtilization).toBeLessThan(0.5);
    });
    
    it('should handle 5 bookings with mixed sizes', async () => {
      const bookings: ExtendedBookingRequest[] = [
        { id: 'b1', pickupAddress: 'P1', deliveryAddress: 'D1', itemIds: ['small_item_10kg'] },
        { id: 'b2', pickupAddress: 'P2', deliveryAddress: 'D2', itemIds: ['small_item_10kg'] },
        { id: 'b3', pickupAddress: 'P3', deliveryAddress: 'D3', itemIds: ['medium_item_100kg'] },
        { id: 'b4', pickupAddress: 'P4', deliveryAddress: 'D4', itemIds: ['medium_item_100kg'] },
        { id: 'b5', pickupAddress: 'P5', deliveryAddress: 'D5', itemIds: ['small_item_10kg'] },
      ];
      
      const result = await planMultiBookingRoutes(bookings, {
        tier: 'economy',
        maxBookingsPerRoute: 5,
      });
      
      expect(result.success).toBe(true);
      expect(result.totalBookings).toBe(5);
      
      // Should fit in 1-2 routes depending on optimization
      expect(result.recommendedRoutes.length).toBeGreaterThanOrEqual(1);
      expect(result.recommendedRoutes.length).toBeLessThanOrEqual(2);
      
      // Total bookings should equal input
      const totalBookingsInRoutes = result.recommendedRoutes.reduce(
        (sum, route) => sum + route.bookingIds.length, 0
      );
      expect(totalBookingsInRoutes).toBe(5);
    });
  });
  
  describe('Capacity Constraints', () => {
    it('should split large bookings into multiple routes when needed', async () => {
      const bookings: ExtendedBookingRequest[] = [
        { id: 'b1', pickupAddress: 'P1', deliveryAddress: 'D1', itemIds: ['large_item_200kg', 'large_item_200kg'] },
        { id: 'b2', pickupAddress: 'P2', deliveryAddress: 'D2', itemIds: ['large_item_200kg', 'large_item_200kg'] },
        { id: 'b3', pickupAddress: 'P3', deliveryAddress: 'D3', itemIds: ['large_item_200kg', 'large_item_200kg'] },
        { id: 'b4', pickupAddress: 'P4', deliveryAddress: 'D4', itemIds: ['large_item_200kg', 'large_item_200kg'] },
      ];
      
      const result = await planMultiBookingRoutes(bookings, {
        tier: 'economy',
        maxBookingsPerRoute: 10,
      });
      
      // 4 bookings * 4m³ each = 16m³ total, needs 2+ vans
      expect(result.requiresMultipleVans).toBe(true);
      expect(result.recommendedRoutes.length).toBeGreaterThan(1);
      
      // Each route should be feasible
      result.recommendedRoutes.forEach(route => {
        expect(route.capacityAnalysis.isFeasible).toBe(true);
        expect(route.capacityAnalysis.violations).toHaveLength(0);
      });
    });
    
    it('should respect max bookings per route limit', async () => {
      const bookings: ExtendedBookingRequest[] = Array.from({ length: 15 }, (_, i) => ({
        id: `booking${i + 1}`,
        pickupAddress: `Pickup ${i + 1}`,
        deliveryAddress: `Delivery ${i + 1}`,
        itemIds: ['small_item_10kg'],
      }));
      
      const result = await planMultiBookingRoutes(bookings, {
        tier: 'economy',
        maxBookingsPerRoute: 5,
      });
      
      expect(result.success).toBe(true);
      
      // Should create multiple routes, each with max 5 bookings
      result.recommendedRoutes.forEach(route => {
        expect(route.bookingIds.length).toBeLessThanOrEqual(5);
      });
      
      // At least 3 routes needed (15 bookings / 5 max)
      expect(result.recommendedRoutes.length).toBeGreaterThanOrEqual(3);
    });
  });
  
  describe('Route Efficiency Metrics', () => {
    it('should calculate capacity efficiency', async () => {
      const bookings: ExtendedBookingRequest[] = [
        { id: 'b1', pickupAddress: 'A', deliveryAddress: 'B', itemIds: ['medium_item_100kg'] },
        { id: 'b2', pickupAddress: 'C', deliveryAddress: 'D', itemIds: ['medium_item_100kg'] },
        { id: 'b3', pickupAddress: 'E', deliveryAddress: 'F', itemIds: ['medium_item_100kg'] },
      ];
      
      const result = await planMultiBookingRoutes(bookings, {
        tier: 'economy',
      });
      
      expect(result.success).toBe(true);
      
      const firstRoute = result.recommendedRoutes[0];
      
      // Capacity efficiency should be calculated (0-1 range)
      expect(firstRoute.capacityEfficiency).toBeGreaterThanOrEqual(0);
      expect(firstRoute.capacityEfficiency).toBeLessThanOrEqual(1);
      
      // Route efficiency should be calculated
      expect(firstRoute.routeEfficiency).toBeGreaterThanOrEqual(0);
      expect(firstRoute.routeEfficiency).toBeLessThanOrEqual(1);
    });
    
    it('should track average capacity utilization', async () => {
      const bookings: ExtendedBookingRequest[] = [
        { id: 'b1', pickupAddress: 'A', deliveryAddress: 'B', itemIds: ['large_item_200kg'] },
        { id: 'b2', pickupAddress: 'C', deliveryAddress: 'D', itemIds: ['large_item_200kg'] },
      ];
      
      const result = await planMultiBookingRoutes(bookings, {
        tier: 'economy',
      });
      
      expect(result.success).toBe(true);
      
      // Average utilization should be calculated (percentage)
      expect(result.averageCapacityUtilization).toBeGreaterThan(0);
      expect(result.averageCapacityUtilization).toBeLessThan(100);
    });
  });
  
  describe('Optimization Strategies', () => {
    it('should try multiple grouping strategies', async () => {
      const bookings: ExtendedBookingRequest[] = [
        { id: 'b1', pickupAddress: 'A', deliveryAddress: 'B', itemIds: ['small_item_10kg'] },
        { id: 'b2', pickupAddress: 'C', deliveryAddress: 'D', itemIds: ['medium_item_100kg'] },
        { id: 'b3', pickupAddress: 'E', deliveryAddress: 'F', itemIds: ['small_item_10kg'] },
        { id: 'b4', pickupAddress: 'G', deliveryAddress: 'H', itemIds: ['medium_item_100kg'] },
      ];
      
      const result = await planMultiBookingRoutes(bookings, {
        tier: 'economy',
      });
      
      expect(result.success).toBe(true);
      
      // Should have at least one recommended route
      expect(result.recommendedRoutes.length).toBeGreaterThan(0);
      
      // May have alternative groupings
      expect(Array.isArray(result.alternativeGroupings)).toBe(true);
    });
    
    it('should prioritize capacity efficiency when requested', async () => {
      const bookings: ExtendedBookingRequest[] = [
        { id: 'b1', pickupAddress: 'A', deliveryAddress: 'B', itemIds: ['medium_item_100kg'] },
        { id: 'b2', pickupAddress: 'C', deliveryAddress: 'D', itemIds: ['medium_item_100kg'] },
        { id: 'b3', pickupAddress: 'E', deliveryAddress: 'F', itemIds: ['small_item_10kg'] },
      ];
      
      const result = await planMultiBookingRoutes(bookings, {
        tier: 'economy',
        prioritizeCapacityEfficiency: true,
      });
      
      expect(result.success).toBe(true);
      expect(result.recommendedRoutes.length).toBeGreaterThan(0);
      
      // Routes should have reasonable capacity efficiency
      result.recommendedRoutes.forEach(route => {
        expect(route.capacityEfficiency).toBeGreaterThan(0);
      });
    });
  });
  
  describe('Suggestions and Warnings', () => {
    it('should provide suggestions for optimization', async () => {
      const bookings: ExtendedBookingRequest[] = [
        { id: 'b1', pickupAddress: 'A', deliveryAddress: 'B', itemIds: ['small_item_10kg'] },
        { id: 'b2', pickupAddress: 'C', deliveryAddress: 'D', itemIds: ['small_item_10kg'] },
      ];
      
      const result = await planMultiBookingRoutes(bookings, {
        tier: 'economy',
      });
      
      expect(result.success).toBe(true);
      
      // Should have suggestions array
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });
    
    it('should warn when capacity utilization is too high', async () => {
      const bookings: ExtendedBookingRequest[] = [
        { id: 'b1', pickupAddress: 'A', deliveryAddress: 'B', itemIds: ['large_item_200kg', 'large_item_200kg'] },
        { id: 'b2', pickupAddress: 'C', deliveryAddress: 'D', itemIds: ['large_item_200kg', 'large_item_200kg'] },
        { id: 'b3', pickupAddress: 'E', deliveryAddress: 'F', itemIds: ['large_item_200kg'] },
      ];
      
      const result = await planMultiBookingRoutes(bookings, {
        tier: 'economy',
        maxBookingsPerRoute: 3,
      });
      
      // May have warnings about high utilization
      if (result.averageCapacityUtilization > 85) {
        expect(result.warnings.length).toBeGreaterThan(0);
      }
    });
  });
  
  describe('Distance Calculations', () => {
    it('should calculate distance between locations', () => {
      const loc1: Location = {
        address: 'London',
        lat: 51.5074,
        lng: -0.1278,
      };
      
      const loc2: Location = {
        address: 'Birmingham',
        lat: 52.4862,
        lng: -1.8904,
      };
      
      const distance = calculateDistance(loc1, loc2);
      
      // London to Birmingham is roughly 160-180 km
      expect(distance).toBeGreaterThan(150);
      expect(distance).toBeLessThan(200);
    });
    
    it('should handle missing coordinates with default distance', () => {
      const loc1: Location = {
        address: 'Unknown A',
      };
      
      const loc2: Location = {
        address: 'Unknown B',
      };
      
      const distance = calculateDistance(loc1, loc2);
      
      // Should return default 10km
      expect(distance).toBe(10);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle single booking (below minimum)', async () => {
      const bookings: ExtendedBookingRequest[] = [
        { id: 'b1', pickupAddress: 'A', deliveryAddress: 'B', itemIds: ['medium_item_100kg'] },
      ];
      
      const result = await planMultiBookingRoutes(bookings, {
        tier: 'economy',
        minBookingsPerRoute: 2,
      });
      
      // Should still create a route even with 1 booking
      expect(result.success).toBe(true);
      expect(result.recommendedRoutes.length).toBeGreaterThan(0);
    });
    
    it('should handle 10 bookings (maximum per route)', async () => {
      const bookings: ExtendedBookingRequest[] = Array.from({ length: 10 }, (_, i) => ({
        id: `b${i + 1}`,
        pickupAddress: `P${i + 1}`,
        deliveryAddress: `D${i + 1}`,
        itemIds: ['small_item_10kg'],
      }));
      
      const result = await planMultiBookingRoutes(bookings, {
        tier: 'economy',
        maxBookingsPerRoute: 10,
      });
      
      expect(result.success).toBe(true);
      
      // Should fit in 1-2 routes
      expect(result.recommendedRoutes.length).toBeGreaterThanOrEqual(1);
      expect(result.recommendedRoutes.length).toBeLessThanOrEqual(2);
    });
  });
});
