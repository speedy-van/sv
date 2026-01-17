import { SpecializedItemCategory } from '@/types/specialized-logistics';

/**
 * Detects if an item name contains keywords indicating it requires specialized handling
 * @param itemName The name of the item to check
 * @returns The specialized category if detected, null otherwise
 */
export function detectSpecializedItem(itemName: string): SpecializedItemCategory | null {
  const name = itemName.toLowerCase();

  // Piano detection
  if (
    name.includes('piano') ||
    name.includes('grand piano') ||
    name.includes('upright piano') ||
    name.includes('baby grand')
  ) {
    if (name.includes('grand') || name.includes('baby grand')) {
      return SpecializedItemCategory.PIANO_GRAND;
    }
    return SpecializedItemCategory.PIANO_UPRIGHT;
  }

  // Fine Art detection
  if (
    name.includes('painting') ||
    name.includes('artwork') ||
    name.includes('art piece') ||
    name.includes('canvas') ||
    name.includes('oil painting') ||
    name.includes('watercolor')
  ) {
    return SpecializedItemCategory.FINE_ART_PAINTING;
  }

  if (
    name.includes('sculpture') ||
    name.includes('statue') ||
    name.includes('bust') ||
    name.includes('bronze')
  ) {
    return SpecializedItemCategory.FINE_ART_SCULPTURE;
  }

  // Medical Equipment detection
  if (
    name.includes('medical') ||
    name.includes('hospital') ||
    name.includes('wheelchair') ||
    name.includes('mobility scooter') ||
    name.includes('x-ray') ||
    name.includes('mri') ||
    name.includes('hospital bed')
  ) {
    return SpecializedItemCategory.MEDICAL_EQUIPMENT;
  }

  // Antique detection
  if (
    name.includes('antique') ||
    name.includes('vintage furniture') ||
    name.includes('heirloom') ||
    name.includes('victorian') ||
    name.includes('georgian') ||
    name.includes('edwardian')
  ) {
    return SpecializedItemCategory.ANTIQUE_FURNITURE;
  }

  // Luxury Furniture detection
  if (
    (name.includes('luxury') && name.includes('furniture')) ||
    name.includes('designer furniture') ||
    name.includes('italian leather') ||
    name.includes('chesterfield') ||
    name.includes('designer sofa') ||
    name.includes('marble table')
  ) {
    return SpecializedItemCategory.LUXURY_FURNITURE;
  }

  // Fragile Electronics detection
  if (
    name.includes('projector') ||
    name.includes('server rack') ||
    name.includes('audio system') ||
    name.includes('studio equipment') ||
    name.includes('sound system') ||
    (name.includes('tv') && (name.includes('oled') || name.includes('qled') || name.includes('large')))
  ) {
    return SpecializedItemCategory.FRAGILE_ELECTRONICS;
  }

  return null;
}

/**
 * Checks if an item should trigger the specialized workflow
 * @param item The item to check
 * @returns True if specialized handling is needed
 */
export function requiresSpecializedHandling(item: any): boolean {
  // Check by item name
  if (item.name && detectSpecializedItem(item.name)) {
    return true;
  }

  // Check by weight (items over 100kg)
  if (item.weight && parseFloat(item.weight) > 100) {
    return true;
  }

  // Check by declared value (items over £5000)
  if (item.value && parseFloat(item.value) > 5000) {
    return true;
  }

  // Check by custom flag
  if (item.isSpecialized || item.requiresSpecializedHandling) {
    return true;
  }

  return false;
}

/**
 * Gets a user-friendly message explaining why specialized handling is required
 * @param item The item requiring specialized handling
 * @returns A descriptive message
 */
export function getSpecializedHandlingReason(item: any): string {
  const category = item.name ? detectSpecializedItem(item.name) : null;

  if (category) {
    switch (category) {
      case SpecializedItemCategory.PIANO_UPRIGHT:
      case SpecializedItemCategory.PIANO_GRAND:
        return 'Pianos require specialized equipment and trained movers to prevent damage to the delicate internal mechanisms.';
      
      case SpecializedItemCategory.FINE_ART_PAINTING:
      case SpecializedItemCategory.FINE_ART_SCULPTURE:
        return 'Fine art requires climate-controlled transport and expert handling to preserve its value and condition.';
      
      case SpecializedItemCategory.MEDICAL_EQUIPMENT:
        return 'Medical equipment must be transported with care to maintain calibration and ensure continued safe operation.';
      
      case SpecializedItemCategory.ANTIQUE_FURNITURE:
        return 'Antique furniture is irreplaceable and requires gentle handling by experienced specialists.';
      
      case SpecializedItemCategory.LUXURY_FURNITURE:
        return 'Luxury furniture deserves premium protection to maintain its pristine condition and high value.';
      
      case SpecializedItemCategory.FRAGILE_ELECTRONICS:
        return 'High-end electronics require specialized packaging and vibration-free transport.';
    }
  }

  if (item.weight && parseFloat(item.weight) > 100) {
    return 'Heavy items over 100kg require specialized lifting equipment and additional crew members for safety.';
  }

  if (item.value && parseFloat(item.value) > 5000) {
    return 'High-value items deserve enhanced insurance coverage and extra care during transport.';
  }

  return 'This item requires specialized handling to ensure safe transport.';
}

/**
 * Suggests default technical specs based on detected category
 * @param category The specialized item category
 * @param item The original item data
 * @returns Suggested default values for the form
 */
export function getDefaultTechnicalSpecs(
  category: SpecializedItemCategory,
  item: any
): Record<string, any> {
  const defaults: Record<string, any> = {};

  // Set declared value from item if available
  if (item.value) {
    defaults.declaredValue = parseFloat(item.value).toFixed(2);
  }

  // Set weight from item if available
  if (item.weight) {
    defaults.weight = parseFloat(item.weight);
  }

  // Category-specific defaults
  switch (category) {
    case SpecializedItemCategory.PIANO_UPRIGHT:
      defaults.type = 'Upright';
      defaults.hasOriginalCasters = true;
      break;

    case SpecializedItemCategory.PIANO_GRAND:
      defaults.type = 'Grand';
      defaults.requiresDisassembly = true;
      break;

    case SpecializedItemCategory.FINE_ART_PAINTING:
      defaults.isFramed = true;
      defaults.requiresClimateControl = true;
      break;

    case SpecializedItemCategory.FINE_ART_SCULPTURE:
      defaults.requiresCustomCrating = true;
      defaults.requiresClimateControl = false;
      break;

    case SpecializedItemCategory.MEDICAL_EQUIPMENT:
      defaults.requiresCalibrationCheck = true;
      defaults.requiresClimateControl = true;
      break;

    case SpecializedItemCategory.ANTIQUE_FURNITURE:
      defaults.requiresWhiteGloveService = true;
      defaults.hasFragileComponents = true;
      break;

    case SpecializedItemCategory.LUXURY_FURNITURE:
      defaults.requiresProtectiveCovering = true;
      defaults.hasFragileComponents = false;
      break;

    case SpecializedItemCategory.FRAGILE_ELECTRONICS:
      defaults.requiresOriginalPackaging = false;
      defaults.requiresAntiStaticProtection = true;
      break;
  }

  return defaults;
}
