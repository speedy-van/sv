/**
 * UK Removal Dataset Integration
 * Dynamically loads items from UK_Removal_Dataset JSON
 * Used for pricing calculations, search autocomplete, and item selection
 */

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  keywords: string[];
  volume: number; // cubic meters
  heavy: boolean;
  fragile: boolean;
  valuable: boolean;
  weight: number; // kg
  imageUrl: string;
  dimensions: string;
  workers_required: number;
  dismantling_required: string;
  dismantling_time_minutes: number;
  reassembly_time_minutes: number;
  luton_van_fit: boolean;
  fragility_level: string;
  stackability: string;
  packaging_requirement: string;
  special_handling_notes: string;
  unload_difficulty: string;
  door_width_clearance_cm: number;
  staircase_compatibility: string;
  elevator_requirement: string;
  insurance_category: string;
}

// UK Removal Dataset Item Interface (from JSON)
interface UKDatasetItem {
  id: string;
  name: string;
  category: string;
  filename: string;
  dimensions: string;
  weight: number;
  volume: string;
  workers_required: number;
  dismantling_required: string;
  dismantling_time_minutes: number;
  reassembly_time_minutes: number;
  luton_van_fit: boolean;
  van_capacity_estimate: number;
  load_priority: string;
  fragility_level: string;
  stackability: string;
  packaging_requirement: string;
  special_handling_notes: string;
  unload_difficulty: string;
  door_width_clearance_cm: number;
  staircase_compatibility: string;
  elevator_requirement: string;
  insurance_category: string;
  keywords: string[];
}

// Load dataset from public directory
let datasetCache: UKDatasetItem[] | null = null;

function loadUKDataset(): UKDatasetItem[] {
  if (datasetCache) return datasetCache;

  try {
    // In production, this would be loaded from the public directory
    // For now, we'll simulate loading the structure
    const fs = require('fs');
    const path = require('path');

    const datasetPath = path.join(process.cwd(), 'public', 'UK_Removal_Dataset', 'items_dataset.json');
    const datasetContent = fs.readFileSync(datasetPath, 'utf8');
    const dataset = JSON.parse(datasetContent);

    datasetCache = dataset.items || [];
    return datasetCache;
  } catch (error) {
    console.error('Failed to load UK Removal Dataset:', error);
    return [];
  }
}

// Convert UK dataset item to catalog item
function convertToCatalogItem(item: UKDatasetItem): CatalogItem {
  return {
    id: item.id,
    name: item.name,
    category: item.category.toLowerCase().replace(/\s+/g, '-'),
    keywords: item.keywords,
    volume: parseFloat(item.volume),
    heavy: item.weight > 50,
    fragile: item.fragility_level === 'High',
    valuable: item.insurance_category === 'High-Value',
    weight: item.weight,
    imageUrl: `/UK_Removal_Dataset/Images_Only/${item.category.replace(/\s+/g, '_')}/${item.filename}`,
    dimensions: item.dimensions,
    workers_required: item.workers_required,
    dismantling_required: item.dismantling_required,
    dismantling_time_minutes: item.dismantling_time_minutes,
    reassembly_time_minutes: item.reassembly_time_minutes,
    luton_van_fit: item.luton_van_fit,
    fragility_level: item.fragility_level,
    stackability: item.stackability,
    packaging_requirement: item.packaging_requirement,
    special_handling_notes: item.special_handling_notes,
    unload_difficulty: item.unload_difficulty,
    door_width_clearance_cm: item.door_width_clearance_cm,
    staircase_compatibility: item.staircase_compatibility,
    elevator_requirement: item.elevator_requirement,
    insurance_category: item.insurance_category,
  };
}

// For client-side compatibility, we'll initialize as empty and load dynamically
// In a real implementation, this would be loaded from the JSON file at build time or runtime
export let COMPREHENSIVE_CATALOG: CatalogItem[] = [];

// Initialize catalog on module load (server-side only)
if (typeof window === 'undefined') {
  try {
    COMPREHENSIVE_CATALOG = loadUKDataset().map(convertToCatalogItem);
  } catch (error) {
    console.error('Failed to load catalog:', error);
    COMPREHENSIVE_CATALOG = [];
  }
}

// Export categories for UI filtering
export const CATALOG_CATEGORIES = [
  'bathroom-items',
  'bedroom-furniture',
  'children-baby-items',
  'dining-room-furniture',
  'electrical-electronics',
  'garden-outdoor-furniture',
  'gym-equipment',
  'home-office-furniture',
  'kitchen-items',
  'living-room-furniture',
  'miscellaneous-items',
  'musical-instruments',
  'pet-items',
  'seasonal-items',
  'special-awkward-items',
  'storage-hallway-furniture'
];

// House packages remain unchanged as requested
export const HOUSE_PACKAGES: CatalogItem[] = [
  {
    id: "full-house-1bed",
    name: "1 Bedroom House Package",
    category: "full-house",
    keywords: ["1 bedroom", "one bedroom", "studio", "flat", "apartment"],
    volume: 15.0,
    heavy: true,
    fragile: true,
    valuable: true,
    weight: 1500,
    imageUrl: "/items/one bedroom.png",
    dimensions: "N/A",
    workers_required: 2,
    dismantling_required: "No",
    dismantling_time_minutes: 0,
    reassembly_time_minutes: 0,
    luton_van_fit: false,
    fragility_level: "Medium",
    stackability: "No",
    packaging_requirement: "None",
    special_handling_notes: "Full house removal package",
    unload_difficulty: "Moderate",
    door_width_clearance_cm: 80,
    staircase_compatibility: "Yes",
    elevator_requirement: "Not needed",
    insurance_category: "Standard"
  },
  {
    id: "full-house-2bed",
    name: "2 Bedroom House Package",
    category: "full-house",
    keywords: ["2 bedroom", "two bedroom", "house", "flat"],
    volume: 25.0,
    heavy: true,
    fragile: true,
    valuable: true,
    weight: 2500,
    imageUrl: "/items/2 bedroom.png",
    dimensions: "N/A",
    workers_required: 2,
    dismantling_required: "No",
    dismantling_time_minutes: 0,
    reassembly_time_minutes: 0,
    luton_van_fit: false,
    fragility_level: "Medium",
    stackability: "No",
    packaging_requirement: "None",
    special_handling_notes: "Full house removal package",
    unload_difficulty: "Moderate",
    door_width_clearance_cm: 80,
    staircase_compatibility: "Yes",
    elevator_requirement: "Not needed",
    insurance_category: "Standard"
  },
  {
    id: "full-house-3bed",
    name: "3 Bedroom House Package",
    category: "full-house",
    keywords: ["3 bedroom", "three bedroom", "family home"],
    volume: 35.0,
    heavy: true,
    fragile: true,
    valuable: true,
    weight: 3500,
    imageUrl: "/items/3 bed rooms.png",
    dimensions: "N/A",
    workers_required: 2,
    dismantling_required: "No",
    dismantling_time_minutes: 0,
    reassembly_time_minutes: 0,
    luton_van_fit: false,
    fragility_level: "Medium",
    stackability: "No",
    packaging_requirement: "None",
    special_handling_notes: "Full house removal package",
    unload_difficulty: "Moderate",
    door_width_clearance_cm: 80,
    staircase_compatibility: "Yes",
    elevator_requirement: "Not needed",
    insurance_category: "Standard"
  }
];

// Helper functions
export function getCatalogItemById(id: string): CatalogItem | undefined {
  return [...COMPREHENSIVE_CATALOG, ...HOUSE_PACKAGES].find(item => item.id === id);
}

export function getCatalogItemsByCategory(category: string): CatalogItem[] {
  return [...COMPREHENSIVE_CATALOG, ...HOUSE_PACKAGES].filter(item => item.category === category);
}

export function searchCatalogItems(query: string): CatalogItem[] {
  const searchTerm = query.toLowerCase().trim();
  if (!searchTerm) return [...COMPREHENSIVE_CATALOG, ...HOUSE_PACKAGES];

  const allItems = [...COMPREHENSIVE_CATALOG, ...HOUSE_PACKAGES];
  return allItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm) ||
    item.keywords.some((keyword: string) => keyword.toLowerCase().includes(searchTerm)) ||
    item.category.toLowerCase().includes(searchTerm)
  );
}

export function getCatalogStats() {
  return {
    totalItems: COMPREHENSIVE_CATALOG.length,
    housePackages: HOUSE_PACKAGES.length,
    categories: CATALOG_CATEGORIES.length,
    heavyItems: COMPREHENSIVE_CATALOG.filter(item => item.heavy).length,
    fragileItems: COMPREHENSIVE_CATALOG.filter(item => item.fragile).length,
    valuableItems: COMPREHENSIVE_CATALOG.filter(item => item.valuable).length
  };
}
