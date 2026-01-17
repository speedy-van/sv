import type { SpecializedItemCategory, EquipmentType } from '@prisma/client';

export interface RequiredEquipmentResult {
  required: EquipmentType[];
  recommended: EquipmentType[];
  warnings: string[];
  estimatedCost: number; // in pence
}

/**
 * Calculate required equipment based on specialized item category and specifications
 */
export function calculateRequiredEquipment(
  category: SpecializedItemCategory,
  specs: Record<string, any>
): RequiredEquipmentResult {
  const required: EquipmentType[] = [];
  const recommended: EquipmentType[] = [];
  const warnings: string[] = [];
  let estimatedCost = 0;

  switch (category) {
    case 'PIANO_UPRIGHT':
      required.push('PIANO_DOLLY', 'PIANO_BOARD', 'NON_MARKING_STRAPS');
      estimatedCost += 2500 + 1500 + 500; // £45

      if (specs.stairsRequired) {
        required.push('STAIR_CLIMBER');
        estimatedCost += 4000; // £40
        warnings.push('Stair navigation requires specialized equipment and additional time');
      }

      if (specs.pianoWeight && specs.pianoWeight > 280) {
        recommended.push('HYDRAULIC_LIFT');
        warnings.push('Heavy piano (>280kg) requires 3-person crew and hydraulic assistance');
      }

      if (specs.humidityControl || specs.temperatureControl) {
        recommended.push('CLIMATE_CONTROLLED_VAN');
        warnings.push('Climate-controlled transport recommended for optimal instrument care');
      }

      recommended.push('PROTECTIVE_BLANKETS');
      break;

    case 'PIANO_GRAND':
      required.push('PIANO_DOLLY', 'PIANO_BOARD', 'HYDRAULIC_LIFT', 'NON_MARKING_STRAPS');
      estimatedCost += 2500 + 1500 + 7500 + 500; // £120

      if (specs.pianoLength && specs.pianoLength > 7) {
        required.push('TAIL_LIFT');
        estimatedCost += 5000; // £50
        warnings.push('Concert grand piano requires tail lift for safe loading');
      }

      recommended.push('PROTECTIVE_BLANKETS', 'CLIMATE_CONTROLLED_VAN');
      warnings.push('Grand piano moves require minimum 3-person crew with specialized training');
      warnings.push('Legs will be removed and padded separately');
      break;

    case 'FINE_ART_PAINTING':
      required.push('ART_CRATE', 'PROTECTIVE_BLANKETS');
      estimatedCost += 6000 + 300; // £63

      recommended.push('CLIMATE_CONTROLLED_VAN');

      if (specs.dimensions) {
        const diagonal = calculateDiagonalFromDimensions(specs.dimensions);
        if (diagonal > 200) {
          warnings.push('Large artwork may require specialized vehicle and additional handling time');
        }
      }

      if (specs.glassProtection) {
        warnings.push('Glass-fronted artwork requires extra careful handling to prevent breakage');
      }

      if (specs.declaredValue && specs.declaredValue > 2500000) {
        warnings.push('High-value artwork requires white-glove service and climate control');
        required.push('CLIMATE_CONTROLLED_VAN' as any); // Force climate control for high value
      }

      warnings.push('Handle with white gloves only. Avoid direct sunlight exposure.');
      break;

    case 'FINE_ART_SCULPTURE':
      required.push('PROTECTIVE_BLANKETS', 'SPECIALIZED_TROLLEY');
      estimatedCost += 300 + 2000; // £23

      if (specs.weight && specs.weight > 100) {
        required.push('HYDRAULIC_LIFT');
        estimatedCost += 7500;
        warnings.push('Heavy sculpture requires hydraulic lifting equipment');
      }

      recommended.push('CLIMATE_CONTROLLED_VAN');
      warnings.push('Sculpture must be kept upright and stable during transport');
      break;

    case 'MEDICAL_EQUIPMENT':
      required.push('PROTECTIVE_BLANKETS', 'NON_MARKING_STRAPS');
      estimatedCost += 300 + 500; // £8

      if (specs.requiresCalibration) {
        warnings.push('Equipment may require recalibration after transport - recommend specialist consultation');
      }

      if (specs.weight && specs.weight > 200) {
        required.push('HYDRAULIC_LIFT');
        estimatedCost += 7500;
      }

      recommended.push('SPECIALIZED_TROLLEY');
      warnings.push('Medical equipment must remain level and protected from shock during transport');
      break;

    case 'ANTIQUE_FURNITURE':
      required.push('PROTECTIVE_BLANKETS', 'NON_MARKING_STRAPS');
      estimatedCost += 300 + 500; // £8

      if (specs.estimatedWeight && specs.estimatedWeight > 150) {
        recommended.push('SPECIALIZED_TROLLEY');
      }

      if (specs.age === 'Victorian (1837-1901)' || specs.age === 'Edwardian (1901-1910)') {
        warnings.push('Period antique requires extra care - original finish and patina must be preserved');
      }

      warnings.push('Document all existing wear, damage, and patina before moving');
      break;

    case 'LUXURY_FURNITURE':
      required.push('PROTECTIVE_BLANKETS', 'NON_MARKING_STRAPS');
      estimatedCost += 300 + 500; // £8

      if (specs.finishType === 'High Gloss') {
        warnings.push('High gloss finish is extremely susceptible to scratches - use premium blankets');
      }

      if (specs.finishType === 'Velvet' || specs.finishType === 'Leather') {
        warnings.push('Fabric/leather surfaces must be protected from pressure marks and moisture');
      }

      recommended.push('SPECIALIZED_TROLLEY');
      break;

    case 'FRAGILE_ELECTRONICS':
      required.push('PROTECTIVE_BLANKETS', 'NON_MARKING_STRAPS');
      estimatedCost += 300 + 500; // £8

      warnings.push('Electronics should be kept upright and protected from shock and vibration');
      warnings.push('Recommend professional packing if original packaging not available');
      break;

    case 'CUSTOM_SPECIALIZED':
      required.push('PROTECTIVE_BLANKETS');
      estimatedCost += 300; // £3

      warnings.push('Custom items require individual assessment - contact us for specialized handling plan');
      break;
  }

  return {
    required,
    recommended,
    warnings,
    estimatedCost
  };
}

/**
 * Helper function to calculate diagonal from dimensions string
 */
function calculateDiagonalFromDimensions(dimensions: string): number {
  try {
    // Try to parse dimensions like "100x80" or "100 x 80 cm"
    const matches = dimensions.match(/(\d+)\s*[x×]\s*(\d+)/i);
    if (matches) {
      const width = parseInt(matches[1]);
      const height = parseInt(matches[2]);
      return Math.sqrt(width * width + height * height);
    }
  } catch (e) {
    console.error('Error parsing dimensions:', e);
  }
  return 0;
}

/**
 * Get equipment details by type
 */
export function getEquipmentDetails(type: EquipmentType): {
  name: string;
  description: string;
  costPerDay: number;
} {
  const equipmentMap: Record<EquipmentType, { name: string; description: string; costPerDay: number }> = {
    PIANO_DOLLY: {
      name: 'Professional Piano Dolly',
      description: 'Heavy-duty dolly designed specifically for piano transportation',
      costPerDay: 2500 // £25
    },
    PIANO_BOARD: {
      name: 'Piano Board',
      description: 'Padded board for securing pianos during transport',
      costPerDay: 1500 // £15
    },
    TAIL_LIFT: {
      name: 'Hydraulic Tail Lift',
      description: 'Hydraulic lift for loading/unloading heavy items',
      costPerDay: 5000 // £50
    },
    STAIR_CLIMBER: {
      name: 'Motorized Stair Climber',
      description: 'Powered device for moving heavy items up/down stairs',
      costPerDay: 4000 // £40
    },
    ART_CRATE: {
      name: 'Custom Art Crate',
      description: 'Museum-grade protective crating for fine art',
      costPerDay: 6000 // £60
    },
    CLIMATE_CONTROLLED_VAN: {
      name: 'Climate-Controlled Van',
      description: 'Temperature and humidity controlled vehicle',
      costPerDay: 15000 // £150
    },
    HYDRAULIC_LIFT: {
      name: 'Industrial Hydraulic Lift',
      description: 'Heavy-duty hydraulic lift system',
      costPerDay: 7500 // £75
    },
    NON_MARKING_STRAPS: {
      name: 'Non-Marking Straps',
      description: 'Professional straps that won\'t damage finishes',
      costPerDay: 500 // £5
    },
    PROTECTIVE_BLANKETS: {
      name: 'Protective Moving Blankets',
      description: 'Heavy-duty padded blankets for protection',
      costPerDay: 300 // £3
    },
    SPECIALIZED_TROLLEY: {
      name: 'Specialized Furniture Trolley',
      description: 'Multi-purpose heavy-duty trolley',
      costPerDay: 2000 // £20
    }
  };

  return equipmentMap[type] || {
    name: 'Unknown Equipment',
    description: '',
    costPerDay: 0
  };
}
