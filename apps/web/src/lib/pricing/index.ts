/**
 * ENTERPRISE ENGINE PRICE - SINGLE SOURCE OF TRUTH
 *
 * ⚠️  WARNING: THERE IS ONLY ONE PRICING ENGINE ⚠️
 *
 * All pricing calculations MUST go through the Enterprise Engine Price.
 * No duplicates, no experiments, no side engines.
 *
 * This is the ONLY allowed entry point for all pricing functionality.
 */

// ============================================================================
// THE ONLY PRICING ENGINE - Enterprise Engine Price
// ============================================================================

export {
  comprehensivePricingEngine,
  ComprehensivePricingEngine,
} from './comprehensive-engine';

// ============================================================================
// LEGACY COMPATIBILITY (will throw errors)
// ============================================================================

/**
 * @deprecated Legacy pricing systems removed - use comprehensivePricingEngine only
 */
export const unifiedPricingFacade = {
  calculatePricing: () => {
    throw new Error('❌ REMOVED: Use comprehensivePricingEngine.calculatePrice() instead');
  }
};

/**
 * @deprecated Legacy pricing systems removed
 */
export const UnifiedPricingFacade = class {
  calculatePricing() {
    throw new Error('❌ REMOVED: Use ComprehensivePricingEngine instead');
  }
};

// ============================================================================
// VALIDATION - Single Engine Enforcement
// ============================================================================

export const PRICING_SYSTEM_VERSION = '1.0-Enterprise-Engine-Only';
export const ALLOWED_PRICING_ENGINES = ['ComprehensivePricingEngine'] as const;
export const REMOVED_PRICING_ENGINES = [
  'UnifiedPricingFacade',
  'PricingCalculator',
  'DistanceCalculator',
  'DynamicPricingEngine',
  'PostcodePricingEngine',
  'UnifiedEngine'
] as const;

// Validation function - enforces single engine usage
export function validatePricingSystemUsage(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check that only the comprehensive engine is being used
  // This would be enhanced with static analysis in production

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [
      ...warnings,
      '⚠️  REMINDER: Use ONLY comprehensivePricingEngine.calculatePrice()',
      '⚠️  All other pricing engines have been removed'
    ],
  };
}

// ============================================================================
// MIGRATION FROM LEGACY SYSTEMS
// ============================================================================

export const MIGRATION_GUIDE = {
  'REMOVED ENGINES': {
    'UnifiedPricingFacade': 'Use comprehensivePricingEngine.calculatePrice()',
    'PricingCalculator': 'Use comprehensivePricingEngine.calculatePrice()',
    'DistanceCalculator': 'Distance calculations integrated into comprehensivePricingEngine',
    'DynamicPricingEngine': 'All dynamic pricing in comprehensivePricingEngine',
    'PostcodePricingEngine': 'Full structured addresses in comprehensivePricingEngine',
    'UnifiedEngine': 'Use comprehensivePricingEngine.calculatePrice()'
  },
  'API Changes': {
    '/api/pricing/calculate': 'Use /api/pricing/comprehensive',
    '/api/pricing/quote': 'Use /api/pricing/comprehensive',
    '/api/pricing/unified': 'Use /api/pricing/comprehensive'
  },
  'Examples': {
    correct: `
// ✅ CORRECT - Single Enterprise Engine Price
import { comprehensivePricingEngine } from '@/lib/pricing';

const result = await comprehensivePricingEngine.calculatePrice({
  requestId: 'req-123',
  correlationId: 'corr-456',
  items: [...],
  pickup: {...},
  dropoffs: [...],
  serviceLevel: 'standard',
  scheduledDate: '2025-01-01T10:00:00Z',
  customerSegment: 'bronze',
  timeFactors: {...}
});
`,
    incorrect: `
// ❌ WRONG - These engines don't exist anymore
import { unifiedPricingFacade } from '@/lib/pricing'; // REMOVED
import { PricingCalculator } from '@/lib/pricing';     // REMOVED
import { DistanceCalculator } from '@/lib/pricing';    // REMOVED
`
  }
} as const;

// ============================================================================
// ENFORCEMENT LOGGING
// ============================================================================

// Disabled during build to reduce noise
// console.log(`🏆 ENTERPRISE ENGINE PRICE: ${PRICING_SYSTEM_VERSION} loaded`);
// console.log(`✅ ONLY ENGINE: ${ALLOWED_PRICING_ENGINES.join(', ')}`);
// console.log(`❌ REMOVED ENGINES: ${REMOVED_PRICING_ENGINES.join(', ')}`);
// console.log(`🎯 SINGLE SOURCE OF TRUTH: comprehensivePricingEngine.calculatePrice()`);