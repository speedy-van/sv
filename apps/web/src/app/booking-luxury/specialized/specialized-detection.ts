/**
 * Specialized Item Detection Logic
 * Automatically detects when a booking item may require specialized handling
 */

import { SpecializedItemCategory } from '@/types/specialized-logistics';

export interface DetectionResult {
  isSpecialized: boolean;
  suggestedCategory?: SpecializedItemCategory;
  confidence: number; // 0-1
  reason?: string;
}

/**
 * Detect if an item description suggests specialized handling
 */
export function detectSpecializedItem(itemName: string): DetectionResult {
  const lowerName = itemName.toLowerCase();

  // Piano detection
  if (lowerName.includes('piano')) {
    if (lowerName.includes('grand')) {
      return {
        isSpecialized: true,
        suggestedCategory: SpecializedItemCategory.PIANO_GRAND,
        confidence: 0.95,
        reason: 'Grand piano detected - requires specialized equipment and handling'
      };
    }
    if (lowerName.includes('upright')) {
      return {
        isSpecialized: true,
        suggestedCategory: SpecializedItemCategory.PIANO_UPRIGHT,
        confidence: 0.95,
        reason: 'Upright piano detected - requires specialized equipment'
      };
    }
    return {
      isSpecialized: true,
      suggestedCategory: SpecializedItemCategory.PIANO_UPRIGHT,
      confidence: 0.85,
      reason: 'Piano detected - likely requires specialized handling'
    };
  }

  // Fine art detection
  if (
    lowerName.includes('painting') ||
    lowerName.includes('artwork') ||
    lowerName.includes('art piece') ||
    lowerName.includes('canvas')
  ) {
    return {
      isSpecialized: true,
      suggestedCategory: SpecializedItemCategory.FINE_ART_PAINTING,
      confidence: 0.8,
      reason: 'Fine art painting detected - requires careful handling and climate control'
    };
  }

  if (
    lowerName.includes('sculpture') ||
    lowerName.includes('statue') ||
    lowerName.includes('bust')
  ) {
    return {
      isSpecialized: true,
      suggestedCategory: SpecializedItemCategory.FINE_ART_SCULPTURE,
      confidence: 0.8,
      reason: 'Sculpture detected - requires specialized packaging and handling'
    };
  }

  // Antique detection
  if (
    lowerName.includes('antique') ||
    lowerName.includes('vintage') ||
    lowerName.includes('heirloom')
  ) {
    return {
      isSpecialized: true,
      suggestedCategory: SpecializedItemCategory.ANTIQUE_FURNITURE,
      confidence: 0.75,
      reason: 'Antique item detected - may require specialized care'
    };
  }

  // Medical equipment
  if (
    lowerName.includes('medical') ||
    lowerName.includes('hospital') ||
    lowerName.includes('diagnostic') ||
    lowerName.includes('scanner') ||
    lowerName.includes('mri') ||
    lowerName.includes('x-ray')
  ) {
    return {
      isSpecialized: true,
      suggestedCategory: SpecializedItemCategory.MEDICAL_EQUIPMENT,
      confidence: 0.9,
      reason: 'Medical equipment detected - requires specialized transport'
    };
  }

  // Luxury furniture
  if (
    (lowerName.includes('luxury') || lowerName.includes('designer')) &&
    (lowerName.includes('furniture') || lowerName.includes('sofa') || lowerName.includes('chair'))
  ) {
    return {
      isSpecialized: true,
      suggestedCategory: SpecializedItemCategory.LUXURY_FURNITURE,
      confidence: 0.7,
      reason: 'Luxury furniture detected - enhanced care recommended'
    };
  }

  // Not specialized
  return {
    isSpecialized: false,
    confidence: 0
  };
}

/**
 * Batch detect specialized items from a list
 */
export function detectSpecializedItems(itemNames: string[]): DetectionResult[] {
  return itemNames.map(detectSpecializedItem);
}

/**
 * Check if any items in a list are specialized
 */
export function hasSpecializedItems(itemNames: string[]): boolean {
  return itemNames.some(name => detectSpecializedItem(name).isSpecialized);
}

/**
 * Get count of specialized items
 */
export function countSpecializedItems(itemNames: string[]): number {
  return itemNames.filter(name => detectSpecializedItem(name).isSpecialized).length;
}
