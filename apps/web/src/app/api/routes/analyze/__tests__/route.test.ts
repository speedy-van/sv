/**
 * Dynamic Capacity Analysis Logic Tests
 * 
 * Tests the route analysis logic to ensure it correctly
 * tracks dynamic load changes and capacity reuse.
 */

import { planCapacityConstrainedRoute, type BookingRequest } from '@/lib/capacity/capacity-constrained-vrp';

// Mock global fetch for dataset loader
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock dataset
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

describe('Dynamic Capacity Analysis Logic', () => {
  describe('Single-Booking Route Analysis', () => {
    it('should track load changes through pickup and dropoff', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'Pickup A',
          deliveryAddress: 'Delivery B',
          itemIds: ['medium_item_100kg'],
        },
      ];
      
      const result = await planCapacityConstrainedRoute(bookings, {
        tier: 'economy',
      });
      
      expect(result.isFeasible).toBe(true);
      expect(result.primaryRoute).not.toBeNull();
      
      const analysis = result.primaryRoute!.capacityAnalysis;
      expect(analysis.totalStops).toBe(2);
      expect(analysis.pickupStops).toBe(1);
      expect(analysis.dropoffStops).toBe(1);
      
      // Check leg-by-leg data
      const legStates = analysis.legStates;
      expect(legStates).toHaveLength(2);
      
      const [pickupLeg, dropoffLeg] = legStates;
      
      // Pickup: volume increases
      expect(pickupLeg.stopType).toBe('pickup');
      expect(pickupLeg.cumulativeVolume_m3).toBe(1.0);
      expect(pickupLeg.cumulativeWeight_kg).toBe(100);
      expect(pickupLeg.itemsAdded).toEqual(['medium_item_100kg']);
      
      // Dropoff: volume decreases back to 0
      expect(dropoffLeg.stopType).toBe('dropoff');
      expect(dropoffLeg.cumulativeVolume_m3).toBe(0);
      expect(dropoffLeg.cumulativeWeight_kg).toBe(0);
      expect(dropoffLeg.itemsRemoved).toEqual(['medium_item_100kg']);
    });
  });
  
  describe('Multi-Drop Capacity Reuse', () => {
    it('should demonstrate capacity reuse in multi-drop route', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'Pickup A',
          deliveryAddress: 'Delivery A',
          itemIds: ['medium_item_100kg'],
        },
        {
          id: 'booking2',
          pickupAddress: 'Pickup B',
          deliveryAddress: 'Delivery B',
          itemIds: ['medium_item_100kg'],
        },
      ];
      
      const result = await planCapacityConstrainedRoute(bookings, {
        tier: 'economy',
      });
      
      expect(result.isFeasible).toBe(true);
      expect(result.primaryRoute).not.toBeNull();
      
      const analysis = result.primaryRoute!.capacityAnalysis;
      
      // Peak utilization should be less than if both items were carried simultaneously
      expect(analysis.peakVolume_m3).toBeLessThanOrEqual(2.0);
      
      // Calculate freed capacity at each drop
      let previousVolume = 0;
      let capacityReuseCount = 0;
      
      for (const leg of analysis.legStates) {
        const volumeChange = leg.cumulativeVolume_m3 - previousVolume;
        
        if (leg.stopType === 'dropoff' && volumeChange < 0) {
          capacityReuseCount++;
        }
        
        previousVolume = leg.cumulativeVolume_m3;
      }
      
      expect(capacityReuseCount).toBeGreaterThan(0);
    });
    
    it('should minimize peak utilization with interleaving', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'b1',
          pickupAddress: 'A',
          deliveryAddress: 'B',
          itemIds: ['large_item_200kg'],
        },
        {
          id: 'b2',
          pickupAddress: 'C',
          deliveryAddress: 'D',
          itemIds: ['large_item_200kg'],
        },
      ];
      
      const result = await planCapacityConstrainedRoute(bookings, {
        tier: 'economy',
      });
      
      expect(result.isFeasible).toBe(true);
      
      const analysis = result.primaryRoute!.capacityAnalysis;
      
      // With interleaving: peak should be 2.0m³ (one item at a time)
      expect(analysis.peakVolume_m3).toBeLessThanOrEqual(2.0);
    });
  });
  
  describe('Efficiency Metrics', () => {
    it('should calculate utilization percentages', async () => {
      const bookings: BookingRequest[] = [
        {
          id: 'booking1',
          pickupAddress: 'A',
          deliveryAddress: 'B',
          itemIds: ['medium_item_100kg'],
        },
      ];
      
      const result = await planCapacityConstrainedRoute(bookings, {
        tier: 'economy',
      });
      
      expect(result.isFeasible).toBe(true);
      
      const analysis = result.primaryRoute!.capacityAnalysis;
      
      expect(analysis.peakVolume_m3).toBe(1.0);
      expect(analysis.peakWeight_kg).toBe(100);
      expect(analysis.peakVolumeUtilization).toBeGreaterThan(0);
      expect(analysis.peakVolumeUtilization).toBeLessThan(1.0);
    });
  });
});
