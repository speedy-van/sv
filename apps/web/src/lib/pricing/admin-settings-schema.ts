import { z } from 'zod';

export const PricingSettingsInputSchema = z.object({
  customerPriceAdjustment: z
    .number({ invalid_type_error: 'customerPriceAdjustment must be a number' })
    .min(-1, 'Customer price adjustment must be between -1 and 1')
    .max(1, 'Customer price adjustment must be between -1 and 1'),
  driverRateMultiplier: z
    .number({ invalid_type_error: 'driverRateMultiplier must be a number' })
    .min(0.5, 'Driver rate multiplier must be between 0.5 and 2')
    .max(2, 'Driver rate multiplier must be between 0.5 and 2'),
  isActive: z.boolean({ invalid_type_error: 'isActive must be a boolean' }),
});

export type PricingSettingsInput = z.infer<typeof PricingSettingsInputSchema>;

export const DEFAULT_ADVANCED_PRICING_CONFIG = {
  baseFarePerRoutePence: 2500,
  perDropFeePence: 1200,
  mileageRatePerMilePence: 55,
  drivingRatePerMinutePence: 30,
  loadingRatePerMinutePence: 40,
  unloadingRatePerMinutePence: 40,
  waitingRatePerMinutePence: 25,
  performanceMultiplierMin: 0.8,
  performanceMultiplierMax: 1.5,
  performanceMultiplierDefault: 1.0,
  urgencyStandardMultiplier: 1.0,
  urgencyExpressMultiplier: 1.3,
  urgencyPremiumMultiplier: 1.6,
  routeExcellenceBonusPence: 500,
  weeklyPerformanceBonusPence: 2000,
  fuelEfficiencyBonusPence: 1000,
  backhaulBonusPence: 1500,
  monthlyAchievementBonusPence: 5000,
  quarterlyTierBonusPence: 15000,
  lateDeliveryPenaltyPence: 1000,
  routeDeviationPenaltyPence: 500,
  complianceBreachPenaltyPence: 2000,
  customerDamagePenaltyPence: 5000,
  helperSharePercentage: 30,
  platformFeeCapPercentage: 25,
  multiDropBonusEnabled: true,
  multiDropBonusThreshold: 5,
  multiDropBonusPerExtraDropPence: 300,
  longDistanceBonusEnabled: true,
  longDistanceBonusThresholdMiles: 50,
  longDistanceBonusPerExtraMilePence: 10,
  isActive: true,
} as const;

export const AdvancedPricingConfigSchema = z.object({
  baseFarePerRoutePence: z.number().int().min(0).max(100000),
  perDropFeePence: z.number().int().min(0).max(10000),
  mileageRatePerMilePence: z.number().int().min(0).max(1000),
  drivingRatePerMinutePence: z.number().int().min(0).max(1000),
  loadingRatePerMinutePence: z.number().int().min(0).max(1000),
  unloadingRatePerMinutePence: z.number().int().min(0).max(1000),
  waitingRatePerMinutePence: z.number().int().min(0).max(1000),
  performanceMultiplierMin: z.number().min(0.1).max(3),
  performanceMultiplierMax: z.number().min(0.1).max(3),
  performanceMultiplierDefault: z.number().min(0.1).max(3),
  urgencyStandardMultiplier: z.number().min(0.1).max(5),
  urgencyExpressMultiplier: z.number().min(0.1).max(5),
  urgencyPremiumMultiplier: z.number().min(0.1).max(5),
  routeExcellenceBonusPence: z.number().int().min(0).max(50000),
  weeklyPerformanceBonusPence: z.number().int().min(0).max(100000),
  fuelEfficiencyBonusPence: z.number().int().min(0).max(50000),
  backhaulBonusPence: z.number().int().min(0).max(50000),
  monthlyAchievementBonusPence: z.number().int().min(0).max(200000),
  quarterlyTierBonusPence: z.number().int().min(0).max(500000),
  lateDeliveryPenaltyPence: z.number().int().min(0).max(100000),
  routeDeviationPenaltyPence: z.number().int().min(0).max(50000),
  complianceBreachPenaltyPence: z.number().int().min(0).max(200000),
  customerDamagePenaltyPence: z.number().int().min(0).max(500000),
  helperSharePercentage: z.number().min(0).max(50),
  platformFeeCapPercentage: z.number().min(0).max(50),
  multiDropBonusEnabled: z.boolean(),
  multiDropBonusThreshold: z.number().int().min(1).max(20),
  multiDropBonusPerExtraDropPence: z.number().int().min(0).max(10000),
  longDistanceBonusEnabled: z.boolean(),
  longDistanceBonusThresholdMiles: z.number().int().min(1).max(500),
  longDistanceBonusPerExtraMilePence: z.number().int().min(0).max(500),
  isActive: z.boolean(),
}).superRefine((value, ctx) => {
  if (value.performanceMultiplierMin > value.performanceMultiplierMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['performanceMultiplierMin'],
      message: 'performanceMultiplierMin cannot exceed performanceMultiplierMax',
    });
  }

  if (
    value.performanceMultiplierDefault < value.performanceMultiplierMin
    || value.performanceMultiplierDefault > value.performanceMultiplierMax
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['performanceMultiplierDefault'],
      message: 'performanceMultiplierDefault must be within min/max range',
    });
  }
});

export type AdvancedPricingConfig = z.infer<typeof AdvancedPricingConfigSchema>;

export function coerceAdvancedPricingConfig(input: unknown): AdvancedPricingConfig {
  const merged = {
    ...DEFAULT_ADVANCED_PRICING_CONFIG,
    ...(typeof input === 'object' && input ? input as Record<string, unknown> : {}),
  };

  return AdvancedPricingConfigSchema.parse(merged);
}

