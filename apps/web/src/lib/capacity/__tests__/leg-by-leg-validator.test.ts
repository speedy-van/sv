/**
 * Unit Tests for Leg-by-Leg Capacity Validator
 * 
 * Tests multi-drop routing capacity validation with pickups and drop-offs
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  validateLegByLegCapacity,
  isRouteFeasible,
  getPeakLoad,
  formatLegByLegTable,
  type RouteStop,
  type LegByLegAnalysis,
} from '../leg-by-leg-validator';

// Mock global fetch for dataset loader
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock dataset with known items
const mockDataset = {
  metadata: {
    version: '1.0',
    date: '2025-01-04',
    total_items: 4,
    categories: 2,
  },
  items: [
    {
      id: 'item_small_5kg',
      name: 'Small Box',
      category: 'Storage',
      volume: '0.05',  // 0.05 m³
      weight: 5,       // 5 kg
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: true,
      workers_required: 1,
    },
    {
      id: 'item_medium_50kg',
      name: 'Medium Furniture',
      category: 'Living Room',
      volume: '0.5',   // 0.5 m³
      weight: 50,      // 50 kg
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: true,
      workers_required: 1,
    },
    {
      id: 'item_large_200kg',
      name: 'Large Sofa',
      category: 'Living Room',
      volume: '2.5',   // 2.5 m³
      weight: 200,     // 200 kg
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: true,
      workers_required: 2,
    },
    {
      id: 'item_heavy_500kg',
      name: 'Very Heavy Item',
      category: 'Equipment',
      volume: '1.0',   // 1.0 m³
      weight: 500,     // 500 kg
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

describe('Leg-by-Leg Capacity Validator', () => {
  describe('Simple Single Pickup -> Single Dropoff', () => {
    it('should validate feasible single pickup and dropoff', async () => {
      const stops: RouteStop[] = [
        {
          id: 'stop1',
          type: 'pickup',
          address: '123 Pickup St',
          itemIds: ['item_small_5kg', 'item_medium_50kg'],
          sequenceNumber: 1,
        },
        {
          id: 'stop2',
          type: 'dropoff',
          address: '456 Dropoff Ave',
          itemIds: ['item_small_5kg', 'item_medium_50kg'],
          sequenceNumber: 2,
        },
      ];

      const analysis = await validateLegByLegCapacity(stops, { tier: 'economy' });

      expect(analysis.isFeasible).toBe(true);
      expect(analysis.totalStops).toBe(2);
      expect(analysis.pickupStops).toBe(1);
      expect(analysis.dropoffStops).toBe(1);
      expect(analysis.violations).toHaveLength(0);
      
      // Peak load should be after pickup (0.05 + 0.5 = 0.55 m³, 5 + 50 = 55 kg)
      expect(analysis.peakVolume_m3).toBeCloseTo(0.55, 2);
      expect(analysis.peakWeight_kg).toBe(55);
      
      // Check leg states
      expect(analysis.legStates).toHaveLength(2);
      
      // After pickup
      expect(analysis.legStates[0].cumulativeVolume_m3).toBeCloseTo(0.55, 2);
      expect(analysis.legStates[0].cumulativeWeight_kg).toBe(55);
      expect(analysis.legStates[0].activeItemCount).toBe(2);
      
      // After dropoff (should be empty)
      expect(analysis.legStates[1].cumulativeVolume_m3).toBe(0);
      expect(analysis.legStates[1].cumulativeWeight_kg).toBe(0);
      expect(analysis.legStates[1].activeItemCount).toBe(0);
    });
  });

  describe('Multi-Drop with Overlapping Loads', () => {
    it('should track cumulative load through 2 pickups and 2 dropoffs', async () => {
      const stops: RouteStop[] = [
        {
          id: 'pickup1',
          type: 'pickup',
          address: 'Pickup Location A',
          itemIds: ['item_medium_50kg'],
          sequenceNumber: 1,
        },
        {
          id: 'pickup2',
          type: 'pickup',
          address: 'Pickup Location B',
          itemIds: ['item_large_200kg'],
          sequenceNumber: 2,
        },
        {
          id: 'drop1',
          type: 'dropoff',
          address: 'Dropoff Location A',
          itemIds: ['item_medium_50kg'],
          sequenceNumber: 3,
        },
        {
          id: 'drop2',
          type: 'dropoff',
          address: 'Dropoff Location B',
          itemIds: ['item_large_200kg'],
          sequenceNumber: 4,
        },
      ];

      const analysis = await validateLegByLegCapacity(stops, { tier: 'economy' });

      expect(analysis.isFeasible).toBe(true);
      expect(analysis.totalStops).toBe(4);
      expect(analysis.legStates).toHaveLength(4);
      
      // Leg 1: After first pickup (0.5 m³, 50 kg)
      expect(analysis.legStates[0].cumulativeVolume_m3).toBeCloseTo(0.5, 2);
      expect(analysis.legStates[0].cumulativeWeight_kg).toBe(50);
      expect(analysis.legStates[0].activeItemCount).toBe(1);
      
      // Leg 2: After second pickup (0.5 + 2.5 = 3.0 m³, 50 + 200 = 250 kg)
      expect(analysis.legStates[1].cumulativeVolume_m3).toBeCloseTo(3.0, 2);
      expect(analysis.legStates[1].cumulativeWeight_kg).toBe(250);
      expect(analysis.legStates[1].activeItemCount).toBe(2);
      
      // Leg 3: After first dropoff (2.5 m³, 200 kg)
      expect(analysis.legStates[2].cumulativeVolume_m3).toBeCloseTo(2.5, 2);
      expect(analysis.legStates[2].cumulativeWeight_kg).toBe(200);
      expect(analysis.legStates[2].activeItemCount).toBe(1);
      
      // Leg 4: After second dropoff (0 m³, 0 kg)
      expect(analysis.legStates[3].cumulativeVolume_m3).toBe(0);
      expect(analysis.legStates[3].cumulativeWeight_kg).toBe(0);
      expect(analysis.legStates[3].activeItemCount).toBe(0);
      
      // Peak should be at leg 2
      expect(analysis.peakVolume_m3).toBeCloseTo(3.0, 2);
      expect(analysis.peakWeight_kg).toBe(250);
    });
  });

  describe('Capacity Violations', () => {
    it('should detect weight overflow at pickup', async () => {
      const stops: RouteStop[] = [
        {
          id: 'pickup1',
          type: 'pickup',
          address: 'Heavy Pickup',
          itemIds: ['item_heavy_500kg', 'item_heavy_500kg', 'item_heavy_500kg'], // 3 × 500kg = 1500kg
          sequenceNumber: 1,
        },
        {
          id: 'drop1',
          type: 'dropoff',
          address: 'Dropoff',
          itemIds: ['item_heavy_500kg', 'item_heavy_500kg', 'item_heavy_500kg'],
          sequenceNumber: 2,
        },
      ];

      const analysis = await validateLegByLegCapacity(stops, { tier: 'economy' });

      expect(analysis.isFeasible).toBe(false);
      expect(analysis.violations.length).toBeGreaterThan(0);
      
      const violation = analysis.violations[0];
      expect(violation.stopType).toBe('pickup');
      expect(violation.violationType).toContain('weight');
      expect(violation.weight_kg).toBe(1500);
      expect(violation.weightUtilization).toBeGreaterThan(1.0);
    });

    it('should detect volume overflow in multi-drop scenario', async () => {
      // Create many medium items to exceed volume
      const manyItems = Array.from({ length: 40 }, (_, i) => `item_medium_50kg`);
      
      const stops: RouteStop[] = [
        {
          id: 'pickup1',
          type: 'pickup',
          address: 'Bulky Pickup',
          itemIds: manyItems,  // 40 × 0.5 m³ = 20 m³ (exceeds 16 m³ capacity)
          sequenceNumber: 1,
        },
        {
          id: 'drop1',
          type: 'dropoff',
          address: 'Dropoff',
          itemIds: manyItems,
          sequenceNumber: 2,
        },
      ];

      const analysis = await validateLegByLegCapacity(stops, { tier: 'economy' });

      expect(analysis.isFeasible).toBe(false);
      expect(analysis.violations.length).toBeGreaterThan(0);
      
      const violation = analysis.violations[0];
      expect(['volume', 'both']).toContain(violation.violationType);
      expect(violation.volumeUtilization).toBeGreaterThan(1.0);
    });

    it('should detect violation in middle of multi-drop route', async () => {
      const stops: RouteStop[] = [
        {
          id: 'pickup1',
          type: 'pickup',
          address: 'Pickup 1',
          itemIds: ['item_heavy_500kg', 'item_heavy_500kg'], // 1000 kg (OK)
          sequenceNumber: 1,
        },
        {
          id: 'pickup2',
          type: 'pickup',
          address: 'Pickup 2',
          itemIds: ['item_heavy_500kg'], // +500 kg = 1500 kg (VIOLATION!)
          sequenceNumber: 2,
        },
        {
          id: 'drop1',
          type: 'dropoff',
          address: 'Dropoff 1',
          itemIds: ['item_heavy_500kg'],
          sequenceNumber: 3,
        },
        {
          id: 'drop2',
          type: 'dropoff',
          address: 'Dropoff 2',
          itemIds: ['item_heavy_500kg', 'item_heavy_500kg'],
          sequenceNumber: 4,
        },
      ];

      const analysis = await validateLegByLegCapacity(stops, { tier: 'economy' });

      expect(analysis.isFeasible).toBe(false);
      
      // Violation should occur at second pickup (sequence 2)
      const violation = analysis.violations.find(v => v.stopSequence === 2);
      expect(violation).toBeDefined();
      expect(violation!.stopType).toBe('pickup');
    });
  });

  describe('Tier Safety Buffers', () => {
    it('should apply economy tier buffer (5% volume, 10% weight)', async () => {
      const stops: RouteStop[] = [
        {
          id: 'pickup1',
          type: 'pickup',
          address: 'Test Pickup',
          itemIds: ['item_large_200kg'], // 2.5 m³, 200 kg
          sequenceNumber: 1,
        },
        {
          id: 'drop1',
          type: 'dropoff',
          address: 'Test Dropoff',
          itemIds: ['item_large_200kg'],
          sequenceNumber: 2,
        },
      ];

      const analysis = await validateLegByLegCapacity(stops, { tier: 'economy' });

      // Economy: 16 m³ × 0.95 = 15.2 m³, 1350 kg × 0.90 = 1215 kg
      // Load: 2.5 m³, 200 kg (well within capacity)
      expect(analysis.isFeasible).toBe(true);
      expect(analysis.legStates[0].volumeUtilization).toBeLessThan(0.2);
      expect(analysis.legStates[0].weightUtilization).toBeLessThan(0.2);
    });

    it('should apply express tier buffer (15% volume, 15% weight)', async () => {
      const stops: RouteStop[] = [
        {
          id: 'pickup1',
          type: 'pickup',
          address: 'Test Pickup',
          itemIds: ['item_large_200kg'], // 2.5 m³, 200 kg
          sequenceNumber: 1,
        },
        {
          id: 'drop1',
          type: 'dropoff',
          address: 'Test Dropoff',
          itemIds: ['item_large_200kg'],
          sequenceNumber: 2,
        },
      ];

      const analysis = await validateLegByLegCapacity(stops, { tier: 'express' });

      // Express: 16 m³ × 0.85 = 13.6 m³, 1350 kg × 0.85 = 1147.5 kg
      // Utilization should be higher due to stricter buffer
      expect(analysis.isFeasible).toBe(true);
      expect(analysis.legStates[0].volumeUtilization).toBeGreaterThan(
        analysis.legStates[0].volumeUtilization * 0.85
      );
    });
  });

  describe('Helper Functions', () => {
    it('should determine route feasibility (isRouteFeasible)', async () => {
      const feasibleStops: RouteStop[] = [
        {
          id: 'p1',
          type: 'pickup',
          address: 'A',
          itemIds: ['item_small_5kg'],
          sequenceNumber: 1,
        },
        {
          id: 'd1',
          type: 'dropoff',
          address: 'B',
          itemIds: ['item_small_5kg'],
          sequenceNumber: 2,
        },
      ];

      const feasible = await isRouteFeasible(feasibleStops);
      expect(feasible).toBe(true);
    });

    it('should get peak load correctly (getPeakLoad)', async () => {
      const stops: RouteStop[] = [
        {
          id: 'p1',
          type: 'pickup',
          address: 'A',
          itemIds: ['item_medium_50kg'],
          sequenceNumber: 1,
        },
        {
          id: 'p2',
          type: 'pickup',
          address: 'B',
          itemIds: ['item_large_200kg'],
          sequenceNumber: 2,
        },
        {
          id: 'd1',
          type: 'dropoff',
          address: 'C',
          itemIds: ['item_medium_50kg'],
          sequenceNumber: 3,
        },
        {
          id: 'd2',
          type: 'dropoff',
          address: 'D',
          itemIds: ['item_large_200kg'],
          sequenceNumber: 4,
        },
      ];

      const peakLoad = await getPeakLoad(stops);

      // Peak should be after second pickup: 0.5 + 2.5 = 3.0 m³
      expect(peakLoad.peakVolume_m3).toBeCloseTo(3.0, 2);
      expect(peakLoad.peakWeight_kg).toBe(250);
      expect(peakLoad.peakStop?.id).toBe('p2');
    });

    it('should format leg-by-leg table (formatLegByLegTable)', async () => {
      const stops: RouteStop[] = [
        {
          id: 'p1',
          type: 'pickup',
          address: 'Pickup A',
          itemIds: ['item_small_5kg'],
          sequenceNumber: 1,
        },
        {
          id: 'd1',
          type: 'dropoff',
          address: 'Dropoff A',
          itemIds: ['item_small_5kg'],
          sequenceNumber: 2,
        },
      ];

      const analysis = await validateLegByLegCapacity(stops, { routeId: 'test-route' });
      const table = formatLegByLegTable(analysis);

      expect(table).toContain('LEG-BY-LEG CAPACITY ANALYSIS');
      expect(table).toContain('test-route');
      expect(table).toContain('Feasible: ✅ YES');
      expect(table).toContain('pickup');
      expect(table).toContain('dropoff');
    });
  });

  describe('Edge Cases', () => {
    it('should handle dropoff before pickup gracefully', async () => {
      const stops: RouteStop[] = [
        {
          id: 'd1',
          type: 'dropoff',
          address: 'Dropoff First (invalid)',
          itemIds: ['item_small_5kg'],
          sequenceNumber: 1,
        },
        {
          id: 'p1',
          type: 'pickup',
          address: 'Pickup Second',
          itemIds: ['item_small_5kg'],
          sequenceNumber: 2,
        },
      ];

      const analysis = await validateLegByLegCapacity(stops);

      // Should handle negative volume/weight gracefully (clamped to 0)
      expect(analysis.legStates[0].cumulativeVolume_m3).toBe(0);
      expect(analysis.legStates[0].cumulativeWeight_kg).toBe(0);
      expect(analysis.warnings.length).toBeGreaterThan(0);
    });

    it('should handle missing items in dataset', async () => {
      const stops: RouteStop[] = [
        {
          id: 'p1',
          type: 'pickup',
          address: 'Test',
          itemIds: ['non_existent_item', 'item_small_5kg'],
          sequenceNumber: 1,
        },
        {
          id: 'd1',
          type: 'dropoff',
          address: 'Test',
          itemIds: ['non_existent_item', 'item_small_5kg'],
          sequenceNumber: 2,
        },
      ];

      const analysis = await validateLegByLegCapacity(stops);

      expect(analysis.warnings.length).toBeGreaterThan(0);
      expect(analysis.warnings.some(w => w.includes('not found'))).toBe(true);
    });

    it('should validate minimum 2 stops requirement', async () => {
      const singleStop: RouteStop[] = [
        {
          id: 'p1',
          type: 'pickup',
          address: 'Only Stop',
          itemIds: ['item_small_5kg'],
          sequenceNumber: 1,
        },
      ];

      await expect(validateLegByLegCapacity(singleStop)).rejects.toThrow();
    });
  });
});
