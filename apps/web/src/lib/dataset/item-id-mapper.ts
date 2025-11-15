/**
 * Item ID Mapper - Normalizes frontend item IDs to match dataset IDs
 * 
 * Frontend uses simple IDs like 'sofa', 'bed', 'table'
 * Dataset uses complex IDs like 'Living_Room_Furniture_sofa_3seater_85kg'
 * 
 * This mapper creates a bridge between the two systems
 */

import type { RemovalDataset } from './uk-removal-dataset-loader';

/**
 * Normalize item ID to match dataset
 * Searches dataset for matching items by:
 * 1. Exact ID match
 * 2. Name match (case-insensitive)
 * 3. Keyword match
 * 4. Partial name match
 */
export function findDatasetItemById(
  itemId: string,
  itemName: string,
  dataset: RemovalDataset
): any | null {
  const normalizedId = itemId.toLowerCase().trim();
  const normalizedName = itemName.toLowerCase().trim();
  
  // Try exact ID match first
  let match = dataset.items.find(item => item.id.toLowerCase() === normalizedId);
  if (match) return match;
  
  // Try exact name match
  match = dataset.items.find(item => item.name.toLowerCase() === normalizedName);
  if (match) return match;
  
  // Try keyword match
  match = dataset.items.find(item => 
    Array.isArray(item.keywords) && item.keywords.some((keyword: string) => 
      keyword.toLowerCase() === normalizedId || 
      keyword.toLowerCase() === normalizedName
    )
  );
  if (match) return match;
  
  // Try partial name match (item name contains search term)
  match = dataset.items.find(item => 
    item.name.toLowerCase().includes(normalizedName) ||
    normalizedName.includes(item.name.toLowerCase())
  );
  if (match) return match;
  
  // Try ID contains item name
  match = dataset.items.find(item => 
    item.id.toLowerCase().includes(normalizedId) ||
    item.id.toLowerCase().includes(normalizedName)
  );
  if (match) return match;
  
  return null;
}

/**
 * Create a fallback dataset item when no match is found
 */
export function createFallbackDatasetItem(
  itemId: string,
  itemName: string,
  weightOverride?: number,
  volumeOverride?: number
): any {
  return {
    id: itemId,
    name: itemName,
    category: 'General',
    filename: 'default.jpg',
    keywords: [itemId.toLowerCase(), itemName.toLowerCase()],
    dimensions: '100x100x100',
    weight: weightOverride || 20,
    volume: String(volumeOverride || 0.1),
    workers_required: 2,
    dismantling_required: 'No',
    dismantling_time_minutes: 0,
    reassembly_time_minutes: 0,
    luton_van_fit: true,
    van_capacity_estimate: 100,
    load_priority: 'Middle',
    fragility_level: 'Medium',
    stackability: 'Yes',
    packaging_requirement: 'Blanket wrap',
    special_handling_notes: 'Standard handling',
    unload_difficulty: 'Medium',
    door_width_clearance_cm: 80,
    staircase_compatibility: 'Yes',
    elevator_requirement: 'Preferred',
    insurance_category: 'Standard',
    _isFallback: true
  };
}
