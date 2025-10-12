/**
 * Unit Tests for UK Removal Dataset Loader
 * 
 * Tests validation, caching, capacity calculations, and error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  loadRemovalDataset,
  loadRemovalDatasetWithHandling,
  getItemById,
  getItemsByCategory,
  getAllCategories,
  searchItems,
  calculateTotalVolume,
  calculateTotalWeight,
  calculateTotalHandlingTime,
  calculateCapacityMetrics,
  checkLutonVanFit,
  clearDatasetCache,
  type RemovalItem,
  type RemovalItemWithHandling,
} from '../uk-removal-dataset-loader';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Sample dataset for testing
const mockDataset = {
  metadata: {
    version: '1.0',
    date: '2025-01-04',
    total_items: 3,
    categories: 2,
  },
  items: [
    {
      id: 'bathroom_cabinet_15kg',
      name: 'Bathroom Cabinet',
      category: 'Bathroom Items',
      volume: '0.015',
      weight: 15,
      dismantling_required: 'Yes',
      dismantling_time_minutes: 30,
      reassembly_time_minutes: 40,
      luton_van_fit: true,
      workers_required: 1,
    },
    {
      id: 'sofa_3seater_80kg',
      name: '3-Seater Sofa',
      category: 'Living Room Furniture',
      volume: '2.5',
      weight: 80,
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: true,
      workers_required: 2,
    },
    {
      id: 'piano_grand_400kg',
      name: 'Grand Piano',
      category: 'Musical Instruments',
      volume: '4.0',
      weight: 400,
      dismantling_required: 'No',
      dismantling_time_minutes: 0,
      reassembly_time_minutes: 0,
      luton_van_fit: false,
      workers_required: 4,
    },
  ],
};

describe('UK Removal Dataset Loader', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearDatasetCache();
    
    // Reset fetch mock
    (global.fetch as jest.MockedFunction<typeof fetch>).mockReset();
    (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => mockDataset,
    } as Response);
  });

  describe('loadRemovalDataset', () => {
    it('should load and validate dataset successfully', async () => {
      const dataset = await loadRemovalDataset();

      expect(dataset).toBeDefined();
      expect(dataset.metadata.total_items).toBe(3);
      expect(dataset.items).toHaveLength(3);
    });

    it('should use cached dataset on subsequent calls', async () => {
      await loadRemovalDataset();
      await loadRemovalDataset();

      // Fetch should only be called once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw error on fetch failure', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      } as Response);

      await expect(loadRemovalDataset()).rejects.toThrow('Dataset loading failed');
    });

    it('should validate volume as number', async () => {
      const dataset = await loadRemovalDataset();

      dataset.items.forEach((item) => {
        expect(typeof item.volume).toBe('number');
        expect(item.volume).toBeGreaterThan(0);
      });
    });
  });

  describe('loadRemovalDatasetWithHandling', () => {
    it('should calculate total handling time for items with dismantling', async () => {
      const items = await loadRemovalDatasetWithHandling();

      const cabinetItem = items.find((item) => item.id === 'bathroom_cabinet_15kg');
      expect(cabinetItem).toBeDefined();
      
      // Base (5) + Dismantling (30) + Reassembly (40) = 75 minutes
      expect(cabinetItem!.total_handling_minutes).toBe(75);
    });

    it('should calculate base handling time for items without dismantling', async () => {
      const items = await loadRemovalDatasetWithHandling();

      const sofaItem = items.find((item) => item.id === 'sofa_3seater_80kg');
      expect(sofaItem).toBeDefined();
      
      // Base only (5 minutes)
      expect(sofaItem!.total_handling_minutes).toBe(5);
    });
  });

  describe('getItemById', () => {
    it('should return item by ID', async () => {
      const item = await getItemById('bathroom_cabinet_15kg');

      expect(item).toBeDefined();
      expect(item!.name).toBe('Bathroom Cabinet');
      expect(item!.weight).toBe(15);
    });

    it('should return undefined for non-existent ID', async () => {
      const item = await getItemById('non_existent_item');

      expect(item).toBeUndefined();
    });

    it('should use cached map on subsequent calls', async () => {
      await getItemById('bathroom_cabinet_15kg');
      await getItemById('sofa_3seater_80kg');

      // Should only load dataset once
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getItemsByCategory', () => {
    it('should return all items in a category', async () => {
      const items = await getItemsByCategory('Bathroom Items');

      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Bathroom Cabinet');
    });

    it('should return empty array for non-existent category', async () => {
      const items = await getItemsByCategory('Non-Existent Category');

      expect(items).toHaveLength(0);
    });
  });

  describe('getAllCategories', () => {
    it('should return unique sorted categories', async () => {
      const categories = await getAllCategories();

      expect(categories).toHaveLength(3);
      expect(categories).toEqual([
        'Bathroom Items',
        'Living Room Furniture',
        'Musical Instruments',
      ]);
    });
  });

  describe('searchItems', () => {
    it('should find items by name (case-insensitive)', async () => {
      const items = await searchItems('sofa');

      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('3-Seater Sofa');
    });

    it('should find items by ID', async () => {
      const items = await searchItems('bathroom_cabinet');

      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('bathroom_cabinet_15kg');
    });

    it('should return empty array if no matches', async () => {
      const items = await searchItems('xyz_nonexistent');

      expect(items).toHaveLength(0);
    });
  });

  describe('Capacity Calculations', () => {
    const testItemIds = ['bathroom_cabinet_15kg', 'sofa_3seater_80kg'];

    describe('calculateTotalVolume', () => {
      it('should sum volumes correctly', async () => {
        const totalVolume = await calculateTotalVolume(testItemIds);

        // 0.015 + 2.5 = 2.515 m³
        expect(totalVolume).toBeCloseTo(2.515, 3);
      });

      it('should handle empty array', async () => {
        const totalVolume = await calculateTotalVolume([]);

        expect(totalVolume).toBe(0);
      });

      it('should skip non-existent items', async () => {
        const totalVolume = await calculateTotalVolume([
          'bathroom_cabinet_15kg',
          'non_existent_item',
        ]);

        expect(totalVolume).toBeCloseTo(0.015, 3);
      });
    });

    describe('calculateTotalWeight', () => {
      it('should sum weights correctly', async () => {
        const totalWeight = await calculateTotalWeight(testItemIds);

        // 15 + 80 = 95 kg
        expect(totalWeight).toBe(95);
      });
    });

    describe('calculateTotalHandlingTime', () => {
      it('should sum handling times correctly', async () => {
        const totalHandlingTime = await calculateTotalHandlingTime(testItemIds);

        // Cabinet (75) + Sofa (5) = 80 minutes
        expect(totalHandlingTime).toBe(80);
      });
    });

    describe('calculateCapacityMetrics', () => {
      it('should return comprehensive metrics', async () => {
        const metrics = await calculateCapacityMetrics(testItemIds);

        expect(metrics.totalVolume).toBeCloseTo(2.515, 3);
        expect(metrics.totalWeight).toBe(95);
        expect(metrics.totalHandlingTime).toBe(80);
        expect(metrics.itemCount).toBe(2);
        expect(metrics.validItemCount).toBe(2);
        expect(metrics.missingItemIds).toHaveLength(0);
      });

      it('should track missing items', async () => {
        const metrics = await calculateCapacityMetrics([
          'bathroom_cabinet_15kg',
          'non_existent_item_1',
          'non_existent_item_2',
        ]);

        expect(metrics.itemCount).toBe(3);
        expect(metrics.validItemCount).toBe(1);
        expect(metrics.missingItemIds).toEqual([
          'non_existent_item_1',
          'non_existent_item_2',
        ]);
      });
    });
  });

  describe('checkLutonVanFit', () => {
    it('should return true when all items fit', async () => {
      const result = await checkLutonVanFit(['bathroom_cabinet_15kg', 'sofa_3seater_80kg']);

      expect(result.allFit).toBe(true);
      expect(result.fittingItemsCount).toBe(2);
      expect(result.nonFittingItems).toHaveLength(0);
    });

    it('should detect items that do not fit', async () => {
      const result = await checkLutonVanFit(['piano_grand_400kg']);

      expect(result.allFit).toBe(false);
      expect(result.fittingItemsCount).toBe(0);
      expect(result.nonFittingItems).toHaveLength(1);
      expect(result.nonFittingItems[0].name).toBe('Grand Piano');
    });

    it('should handle mixed fit scenarios', async () => {
      const result = await checkLutonVanFit([
        'bathroom_cabinet_15kg',
        'piano_grand_400kg',
        'sofa_3seater_80kg',
      ]);

      expect(result.allFit).toBe(false);
      expect(result.fittingItemsCount).toBe(2);
      expect(result.nonFittingItems).toHaveLength(1);
      expect(result.nonFittingItems[0].id).toBe('piano_grand_400kg');
    });
  });

  describe('Cache Management', () => {
    it('should clear all caches', async () => {
      // Load data to populate caches
      await loadRemovalDataset();
      await getItemById('bathroom_cabinet_15kg');
      await getItemsByCategory('Bathroom Items');

      // Clear cache
      clearDatasetCache();

      // Next call should fetch again
      await loadRemovalDataset();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
