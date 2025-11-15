/**
 * UK Removal Dataset Loader
 * 
 * Loads and validates the comprehensive UK removal dataset with full type safety.
 * Extracts volume (m³), weight (kg), and handling time (minutes) for capacity calculations.
 * 
 * Dataset Location: /public/UK_Removal_Dataset/items_dataset.json
 */

import { z } from 'zod';

// ============================================================================
// Zod Schemas - Strict validation for dataset integrity
// ============================================================================

const RemovalItemSchema = z.object({
  // Identifiers
  id: z.string().min(1, 'Item ID is required'),
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  
  // Critical capacity fields
  volume: z.string().transform((val) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error(`Invalid volume: ${val}`);
    }
    return parsed;
  }).describe('Volume in cubic meters (m³)'),
  
  weight: z.number().positive('Weight must be positive').describe('Weight in kilograms (kg)'),
  
  // Handling time components
  dismantling_required: z.enum(['Yes', 'No']),
  dismantling_time_minutes: z.number().nonnegative().default(0),
  reassembly_time_minutes: z.number().nonnegative().default(0),
  
  // Vehicle compatibility
  luton_van_fit: z.boolean().describe('Can item fit in a Luton van'),
  
  // Additional operational data
  workers_required: z.number().int().positive().default(1),
  dimensions: z.string().optional(),
  load_priority: z.enum(['First-in', 'Last-in', 'Mid-load', 'Flexible']).optional(),
  fragility_level: z.enum(['Low', 'Medium', 'High', 'Extreme']).optional(),
  stackability: z.enum(['Yes', 'No', 'Limited']).optional(),
  unload_difficulty: z.enum(['Easy', 'Medium', 'Hard', 'Very Hard']).optional(),
  
  // Allow additional fields without strict validation
}).passthrough();

const DatasetMetadataSchema = z.object({
  version: z.string(),
  date: z.string(),
  total_items: z.number().int().positive(),
  categories: z.number().int().positive(),
});

const RemovalDatasetSchema = z.object({
  metadata: DatasetMetadataSchema,
  items: z.array(RemovalItemSchema).min(1, 'Dataset must contain at least one item'),
});

// ============================================================================
// TypeScript Types - Derived from Zod schemas
// ============================================================================

export type RemovalItem = z.infer<typeof RemovalItemSchema>;
export type DatasetMetadata = z.infer<typeof DatasetMetadataSchema>;
export type RemovalDataset = z.infer<typeof RemovalDatasetSchema>;

/**
 * Enhanced item with calculated handling time
 */
export interface RemovalItemWithHandling extends RemovalItem {
  total_handling_minutes: number;
}

// ============================================================================
// Dataset Cache - In-memory singleton
// ============================================================================

let cachedDataset: RemovalDataset | null = null;
let cachedItemsMap: Map<string, RemovalItemWithHandling> | null = null;
let cachedCategoriesMap: Map<string, RemovalItemWithHandling[]> | null = null;

// ============================================================================
// Core Loader Functions
// ============================================================================

/**
 * Load and validate the UK Removal Dataset from JSON file
 * Uses in-memory cache to avoid repeated file reads
 * 
 * @returns Validated dataset with type safety
 * @throws Error if dataset is invalid or missing
 */
export async function loadRemovalDataset(): Promise<RemovalDataset> {
  if (cachedDataset) {
    return cachedDataset;
  }

  try {
    // Load from public folder - use absolute URL for both client and server
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const datasetUrl = `${baseUrl}/UK_Removal_Dataset/items_dataset.json`;
    
    console.log('[UK Dataset] Loading from:', datasetUrl);
    const response = await fetch(datasetUrl, {
      cache: 'force-cache', // Cache for performance
      next: { revalidate: 3600 } // Revalidate every hour
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset (${response.status}): ${response.statusText}`);
    }

    const rawData = await response.json();

    // Strict Zod validation
    const validatedData = RemovalDatasetSchema.parse(rawData);

    // Cache for future use
    cachedDataset = validatedData;

    if (typeof console !== 'undefined') {
      console.log('[UK Dataset] Loaded successfully', {
        version: validatedData.metadata.version,
        totalItems: validatedData.metadata.total_items,
      });
    }

    return validatedData;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[UK Dataset] Failed to load:', err.message);
    throw new Error(`Dataset loading failed: ${err.message}`);
  }
}

/**
 * Load dataset with enhanced handling time calculations
 * Automatically calculates total handling time based on dismantling/reassembly requirements
 * 
 * @returns Array of items with calculated handling times
 */
export async function loadRemovalDatasetWithHandling(): Promise<RemovalItemWithHandling[]> {
  const dataset = await loadRemovalDataset();

  return dataset.items.map((item) => {
    // Calculate total handling time based on dismantling requirements
    const dismantlingTime = item.dismantling_required === 'Yes' ? item.dismantling_time_minutes : 0;
    const reassemblyTime = item.dismantling_required === 'Yes' ? item.reassembly_time_minutes : 0;
    const baseHandlingTime = 5; // Base time for loading/unloading (minutes)

    const total_handling_minutes = baseHandlingTime + dismantlingTime + reassemblyTime;

    return {
      ...item,
      total_handling_minutes,
    };
  });
}

/**
 * Get item by ID with O(1) lookup performance
 * 
 * @param itemId - Unique item identifier (e.g., "Bathroom_Items_arched_medicine_cabinet_mirror_15kg")
 * @returns Item with handling time or undefined if not found
 */
export async function getItemById(itemId: string): Promise<RemovalItemWithHandling | undefined> {
  // Build map cache on first call
  if (!cachedItemsMap) {
    const items = await loadRemovalDatasetWithHandling();
    cachedItemsMap = new Map(items.map((item) => [item.id, item]));
  }

  return cachedItemsMap.get(itemId);
}

/**
 * Get all items in a specific category
 * 
 * @param category - Category name (e.g., "Bathroom Items", "Bedroom Furniture")
 * @returns Array of items in the category
 */
export async function getItemsByCategory(category: string): Promise<RemovalItemWithHandling[]> {
  // Build category map cache on first call
  if (!cachedCategoriesMap) {
    const items = await loadRemovalDatasetWithHandling();
    cachedCategoriesMap = new Map();

    items.forEach((item) => {
      const categoryItems = cachedCategoriesMap!.get(item.category) || [];
      categoryItems.push(item);
      cachedCategoriesMap!.set(item.category, categoryItems);
    });
  }

  return cachedCategoriesMap.get(category) || [];
}

/**
 * Get all available categories
 * 
 * @returns Array of unique category names
 */
export async function getAllCategories(): Promise<string[]> {
  const dataset = await loadRemovalDataset();
  const categories = new Set(dataset.items.map((item) => item.category));
  return Array.from(categories).sort();
}

/**
 * Search items by name (case-insensitive fuzzy search)
 * 
 * @param query - Search query
 * @returns Array of matching items
 */
export async function searchItems(query: string): Promise<RemovalItemWithHandling[]> {
  const items = await loadRemovalDatasetWithHandling();
  const normalizedQuery = query.toLowerCase().trim();

  return items.filter((item) =>
    item.name.toLowerCase().includes(normalizedQuery) ||
    item.id.toLowerCase().includes(normalizedQuery)
  );
}

// ============================================================================
// Capacity Calculation Utilities
// ============================================================================

/**
 * Calculate total volume for a list of items
 * 
 * @param itemIds - Array of item IDs
 * @returns Total volume in cubic meters (m³)
 */
export async function calculateTotalVolume(itemIds: string[]): Promise<number> {
  const items = await Promise.all(itemIds.map(getItemById));
  
  return items.reduce((total, item) => {
    if (!item) return total;
    return total + item.volume;
  }, 0);
}

/**
 * Calculate total weight for a list of items
 * 
 * @param itemIds - Array of item IDs
 * @returns Total weight in kilograms (kg)
 */
export async function calculateTotalWeight(itemIds: string[]): Promise<number> {
  const items = await Promise.all(itemIds.map(getItemById));
  
  return items.reduce((total, item) => {
    if (!item) return total;
    return total + item.weight;
  }, 0);
}

/**
 * Calculate total handling time for a list of items
 * 
 * @param itemIds - Array of item IDs
 * @returns Total handling time in minutes
 */
export async function calculateTotalHandlingTime(itemIds: string[]): Promise<number> {
  const items = await Promise.all(itemIds.map(getItemById));
  
  return items.reduce((total, item) => {
    if (!item) return total;
    return total + item.total_handling_minutes;
  }, 0);
}

/**
 * Calculate comprehensive capacity metrics for a list of items
 * 
 * @param itemIds - Array of item IDs
 * @returns Object with volume, weight, and handling time totals
 */
export async function calculateCapacityMetrics(itemIds: string[]): Promise<{
  totalVolume: number;
  totalWeight: number;
  totalHandlingTime: number;
  itemCount: number;
  validItemCount: number;
  missingItemIds: string[];
}> {
  const items = await Promise.all(itemIds.map(getItemById));
  
  let totalVolume = 0;
  let totalWeight = 0;
  let totalHandlingTime = 0;
  let validItemCount = 0;
  const missingItemIds: string[] = [];

  items.forEach((item, index) => {
    if (!item) {
      missingItemIds.push(itemIds[index]);
      return;
    }

    validItemCount++;
    totalVolume += item.volume;
    totalWeight += item.weight;
    totalHandlingTime += item.total_handling_minutes;
  });

  return {
    totalVolume,
    totalWeight,
    totalHandlingTime,
    itemCount: itemIds.length,
    validItemCount,
    missingItemIds,
  };
}

/**
 * Check if items fit in Luton van based on dataset metadata
 * 
 * @param itemIds - Array of item IDs
 * @returns Object with fit status and reasons for items that don't fit
 */
export async function checkLutonVanFit(itemIds: string[]): Promise<{
  allFit: boolean;
  itemsCount: number;
  fittingItemsCount: number;
  nonFittingItems: Array<{ id: string; name: string; reason: string }>;
}> {
  const items = await Promise.all(itemIds.map(getItemById));
  
  const nonFittingItems: Array<{ id: string; name: string; reason: string }> = [];
  let fittingItemsCount = 0;

  items.forEach((item) => {
    if (!item) return;

    if (item.luton_van_fit) {
      fittingItemsCount++;
    } else {
      nonFittingItems.push({
        id: item.id,
        name: item.name,
        reason: 'Item marked as not fitting in Luton van per dataset',
      });
    }
  });

  return {
    allFit: nonFittingItems.length === 0,
    itemsCount: items.filter(Boolean).length,
    fittingItemsCount,
    nonFittingItems,
  };
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clear all cached data (useful for testing or forced refresh)
 */
export function clearDatasetCache(): void {
  cachedDataset = null;
  cachedItemsMap = null;
  cachedCategoriesMap = null;
  if (typeof console !== 'undefined') {
    console.log('[UK Dataset] Cache cleared');
  }
}

// ============================================================================
// Exports Summary
// ============================================================================

export {
  RemovalItemSchema,
  RemovalDatasetSchema,
  DatasetMetadataSchema,
};
