/**
 * COMPREHENSIVE PRICING SCHEMAS - 100% Documentation Compliance
 * Strict Zod schemas for UK Removal Dataset and pricing engine
 */

import { z } from 'zod';

// ============================================================================
// UK REMOVAL DATASET SCHEMAS (22 fields per item)
// ============================================================================

// Physical Specifications
export const PhysicalSpecsSchema = z.object({
  dimensions: z.string().regex(/^\d+x\d+x\d+$/, "Must be format: LxWxH in cm"),
  weight: z.number().positive("Weight must be positive").max(200, "Max 200kg per item"),
  volume: z.string().transform((val) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed) || parsed <= 0) {
      throw new Error("Volume must be positive number");
    }
    return parsed;
  })
});

// Operational Requirements
export const OperationalReqsSchema = z.object({
  workers_required: z.union([z.literal(1), z.literal(2)]),
  dismantling_required: z.enum(["Yes", "No"]),
  dismantling_time_minutes: z.number().min(0).max(120),
  reassembly_time_minutes: z.number().min(0).max(120)
});

// Van Loading Specifications
export const VanLoadingSchema = z.object({
  luton_van_fit: z.boolean(),
  van_capacity_estimate: z.number().positive(),
  load_priority: z.enum(["First-in", "Mid-load", "Last-in"])
});

// Handling Requirements
export const HandlingReqsSchema = z.object({
  fragility_level: z.enum(["Low", "Medium", "High"]),
  stackability: z.enum(["Yes", "No", "Limited"]),
  packaging_requirement: z.enum(["None", "Blankets", "Bubble wrap", "Box"]),
  special_handling_notes: z.string().optional()
});

// Access & Logistics
export const AccessLogisticsSchema = z.object({
  unload_difficulty: z.enum(["Easy", "Moderate", "Difficult"]),
  door_width_clearance_cm: z.number().min(60).max(200),
  staircase_compatibility: z.enum(["Yes", "No"]),
  elevator_requirement: z.enum(["Required", "Optional", "Not needed"])
});

// Business Specifications
export const BusinessSpecsSchema = z.object({
  insurance_category: z.enum(["Standard", "High-Value"]),
  business_filename: z.string().endsWith('.jpg')
});

// COMPLETE UK DATASET ITEM SCHEMA (22 fields)
export const UKDatasetItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  filename: z.string().endsWith('.jpg'),
  keywords: z.array(z.string()),

  // Physical specs
  ...PhysicalSpecsSchema.shape,

  // Operational reqs
  ...OperationalReqsSchema.shape,

  // Van loading
  ...VanLoadingSchema.shape,

  // Handling reqs
  ...HandlingReqsSchema.shape,

  // Access & logistics
  ...AccessLogisticsSchema.shape,

  // Business specs
  ...BusinessSpecsSchema.shape
});

// ============================================================================
// PROPERTY TYPE SCHEMAS
// ============================================================================

export const PropertyTypeSchema = z.object({
  type: z.enum([
    "Studio", "1-Bedroom Flat", "2-Bedroom Flat", "3-Bedroom Flat", "4-Bedroom Flat",
    "2-Bedroom House", "3-Bedroom House", "4-Bedroom House", "5+ Bedroom House"
  ]),
  typical_volume_m3: z.string().regex(/^\d+-\d+$/, "Must be range format: min-max"),
  load_time_hours: z.string().regex(/^\d+-\d+$/, "Must be range format: min-max"),
  common_items_count: z.number().positive(),
  van_loads_required: z.string().regex(/^\d+(\.\d+)?(-\d+(\.\d+)?)?$/, "Must be decimal range")
});

// ============================================================================
// PRICING ENGINE SCHEMAS
// ============================================================================

// Van specifications (from operational insights)
export const VanSpecsSchema = z.object({
  maxVolumeM3: z.number().positive().default(14.5),
  maxWeightKg: z.number().positive().default(3500),
  maxItems: z.number().positive().default(150),
  loadingTimeMinutes: z.number().positive().default(60),
  unloadingTimeMinutes: z.number().positive().default(45)
});

// Base pricing rates (from operational insights)
export const PricingRatesSchema = z.object({
  perKm: z.number().positive().default(1.50),
  perMinute: z.number().positive().default(0.50),
  perKg: z.number().positive().default(0.08),
  perM3: z.number().positive().default(4.50),
  baseFee: z.number().positive().default(75.00),
  multiDropDiscount: z.number().min(0).max(1).default(0.15),
  workerHourlyRate: z.number().positive().default(18.00),
  dismantlingPerMinute: z.number().positive().default(0.30)
});

// Service level multipliers
export const ServiceMultipliersSchema = z.object({
  economy: z.number().positive().default(0.85),
  standard: z.number().positive().default(1.0),
  premium: z.number().positive().default(1.35)
});

// Surcharges (from operational insights)
export const SurchargesSchema = z.object({
  stairs: z.number().positive().default(15.00), // £15 per flight
  parking: z.number().positive().default(25.00), // £25 for difficult parking
  congestion: z.number().positive().default(20.00), // £20 for congestion zones
  timeWindows: z.number().positive().default(35.00) // £35 for specific time requirements
});

// ============================================================================
// ADDRESS COMPATIBILITY SCHEMAS
// ============================================================================

export const StructuredAddressSchema = z.object({
  full: z.string().min(1, "Full address is required"),
  line1: z.string().min(1, "Address line 1 is required"),
  line2: z.string().optional(),
  city: z.string().min(1, "City is required"),
  postcode: z.string().regex(
    /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
    "Must be valid UK postcode format"
  ),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }),
  propertyType: z.enum([
    "house", "apartment", "office", "warehouse", "other"
  ]).optional()
});

// ============================================================================
// TIME & SEASONAL SCHEMAS
// ============================================================================

export const TimeFactorsSchema = z.object({
  isRushHour: z.boolean(),
  isPeakSeason: z.boolean(),
  isStudentSeason: z.boolean(),
  isWeekend: z.boolean(),
  currentHour: z.number().min(0).max(23),
  currentMonth: z.number().min(1).max(12)
});

// ============================================================================
// COMPREHENSIVE PRICING INPUT SCHEMA
// ============================================================================

export const PricingItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().min(1).default(1),

  // Dataset fields (all required for 100% compliance)
  datasetItem: UKDatasetItemSchema,

  // Calculated fields
  labor_cost: z.number().min(0),
  item_base_cost: z.number().min(0),

  // Optional overrides (for special cases)
  weight_override: z.number().positive().optional(),
  volume_override: z.number().positive().optional()
});

export const MultiDropStopSchema = z.object({
  type: z.enum(["pickup", "dropoff"]),
  address: StructuredAddressSchema,
  timeSlot: z.string().optional(), // "HH:mm-HH:mm" format
  items: z.array(PricingItemSchema).min(1),
  capacityUsed: z.object({
    weight: z.number().min(0),
    volume: z.number().min(0),
    items: z.number().min(0)
  }),
  accessRequirements: z.object({
    stairs: z.number().min(0).default(0), // Number of flights
    parking_difficulty: z.enum(["easy", "moderate", "difficult"]).default("easy"),
    congestion_zone: z.boolean().default(false),
    time_window_required: z.boolean().default(false)
  }).optional()
});

export const ComprehensivePricingInputSchema = z.object({
  requestId: z.string().uuid(),
  correlationId: z.string().min(1),

  // Addresses (full structured, not just postcode)
  pickup: StructuredAddressSchema,
  dropoffs: z.array(StructuredAddressSchema).max(5, "Maximum 5 dropoffs allowed"),

  // Items with full dataset compliance
  items: z.array(PricingItemSchema).min(1, "At least one item required"),

  // Service configuration
  serviceLevel: z.enum(["economy", "standard", "premium"]).default("standard"),

  // Time factors
  scheduledDate: z.string().datetime(), // ISO 8601 UTC
  timeFactors: TimeFactorsSchema,

  // Customer segment
  customerSegment: z.enum(["bronze", "silver", "gold", "platinum"]).default("bronze"),

  // Additional options
  addOns: z.object({
    packing: z.object({
      volumeM3: z.number().min(0).optional(),
      boxes: z.number().min(0).optional()
    }).optional(),
    insurance: z.enum(["basic", "premium"]).optional(),
    storage: z.number().min(1).max(12).optional() // months
  }).optional()
});

// ============================================================================
// PRICING CALCULATION SCHEMAS
// ============================================================================

export const ItemPricingBreakdownSchema = z.object({
  baseItemCost: z.number().min(0),
  laborCost: z.number().min(0),
  fragilityMultiplier: z.number().min(1),
  insuranceCost: z.number().min(0),
  totalItemCost: z.number().min(0)
});

export const RouteLegPricingSchema = z.object({
  legIndex: z.number().min(0),
  distanceKm: z.number().min(0),
  durationMinutes: z.number().min(0),
  baseDistanceCost: z.number().min(0),
  timeCost: z.number().min(0),
  trafficMultiplier: z.number().min(0.5).max(3.0),
  congestionSurcharge: z.number().min(0),
  totalLegCost: z.number().min(0)
});

export const StopPricingSchema = z.object({
  stopIndex: z.number().min(0),
  stopType: z.enum(["pickup", "dropoff"]),
  baseStopFee: z.number().min(0),
  accessSurcharges: z.object({
    stairs: z.number().min(0),
    parking: z.number().min(0),
    congestion: z.number().min(0),
    timeWindow: z.number().min(0)
  }),
  unloadingCost: z.number().min(0),
  totalStopCost: z.number().min(0)
});

export const ComprehensivePricingBreakdownSchema = z.object({
  // Base costs
  baseFee: z.number().min(0),
  itemsCost: z.number().min(0),
  laborCost: z.number().min(0),

  // Route costs
  distanceCost: z.number().min(0),
  timeCost: z.number().min(0),

  // Surcharges
  accessSurcharges: z.number().min(0),
  serviceMultiplier: z.number().min(0),
  seasonalMultiplier: z.number().min(0),

  // Discounts
  multiDropDiscount: z.number().min(0),
  customerDiscount: z.number().min(0),

  // Totals
  subtotalBeforeVat: z.number().min(0),
  vatAmount: z.number().min(0),
  totalAmount: z.number().min(0)
});

// ============================================================================
// CAPACITY ENFORCEMENT SCHEMAS
// ============================================================================

export const CapacityCheckSchema = z.object({
  isValid: z.boolean(),
  weightUtilization: z.number().min(0).max(100),
  volumeUtilization: z.number().min(0).max(100),
  itemUtilization: z.number().min(0).max(100),
  warnings: z.array(z.string()),
  recommendations: z.array(z.string()),
  overCapacityItems: z.array(z.string()).optional()
});

// ============================================================================
// MULTI-DROP ROUTE SCHEMAS
// ============================================================================

export const RouteOptimizationSchema = z.object({
  algorithm: z.enum(["capacity-aware", "distance-optimized", "time-optimized"]),
  efficiencyScore: z.number().min(0).max(100),
  timeSavedMinutes: z.number().min(0),
  distanceSavedKm: z.number().min(0),
  capacityEfficiency: z.number().min(0).max(100),
  recommendations: z.array(z.string())
});

export const MultiDropRouteSchema = z.object({
  stops: z.array(MultiDropStopSchema),
  totalDistanceKm: z.number().min(0),
  totalDurationMinutes: z.number().min(0),
  optimization: RouteOptimizationSchema,
  capacityCheck: CapacityCheckSchema,
  loadPlan: z.object({
    heavyItemsFirst: z.array(z.string()), // Item IDs for front loading
    mediumItemsMiddle: z.array(z.string()), // Item IDs for middle loading
    lightItemsLast: z.array(z.string()) // Item IDs for rear loading
  })
});

// ============================================================================
// COMPREHENSIVE PRICING RESULT SCHEMA
// ============================================================================

export const ComprehensivePricingResultSchema = z.object({
  // Identifiers
  requestId: z.string().uuid(),
  correlationId: z.string().min(1),

  // Pricing result
  amountGbpMinor: z.number().min(0), // Pence for Stripe
  currency: z.literal("GBP"),

  // Detailed breakdown
  breakdown: ComprehensivePricingBreakdownSchema,

  // Route information
  route: MultiDropRouteSchema,

  // Vehicle recommendation
  recommendedVehicle: z.object({
    type: z.string(),
    capacity: VanSpecsSchema,
    utilization: z.object({
      weight: z.number().min(0).max(100),
      volume: z.number().min(0).max(100),
      items: z.number().min(0).max(100)
    }),
    capacityIssues: z.array(z.string()).optional()
  }),

  // Service details
  serviceLevel: z.enum(["economy", "standard", "premium"]),
  estimatedDurationMinutes: z.number().min(0),
  availableDate: z.string().datetime().optional(), // For economy service

  // Metadata & compliance
  metadata: z.object({
    calculatedAt: z.string().datetime(),
    version: z.string(),
    dataSourceVersion: z.string(),
    inputHash: z.string(),
    warnings: z.array(z.string()),
    recommendations: z.array(z.string()),
    compliance: z.object({
      datasetFieldsUsed: z.number().min(22),
      operationalRulesApplied: z.number(),
      capacityEnforced: z.boolean(),
      addressStructured: z.boolean()
    })
  }),

  // Stripe integration
  stripeMetadata: z.object({
    paymentIntentId: z.string().optional(),
    idempotencyKey: z.string(),
    lineItems: z.array(z.object({
      id: z.string(),
      name: z.string(),
      amount: z.number(),
      quantity: z.number(),
      category: z.string()
    }))
  }).optional()
});

// ============================================================================
// OPERATIONAL INSIGHTS SCHEMAS (From operational_insights.md)
// ============================================================================

// Loading Strategy (Section 1.A)
export const LoadingStrategySchema = z.object({
  heavyItemsFirst: z.array(z.string()), // Item IDs for front loading
  mediumItemsMiddle: z.array(z.string()), // Item IDs for middle loading
  lightItemsLast: z.array(z.string()), // Item IDs for rear loading
  secureWithStraps: z.boolean().default(true),
  useCornerProtectors: z.boolean().default(true),
  blanketsBetweenItems: z.boolean().default(true)
});

// Worker Allocation (Section 2.A)
export const WorkerAllocationSchema = z.object({
  twoWorkersRequired: z.array(z.string()), // Item IDs requiring 2 workers
  oneWorkerStandard: z.array(z.string()), // Item IDs for 1 worker
  conditionalExtras: z.object({
    stairs: z.boolean().default(false),
    longCarries: z.boolean().default(false),
    awkwardAccess: z.boolean().default(false)
  })
});

// Multi-Drop Efficiency (Section 3)
export const MultiDropEfficiencySchema = z.object({
  lifoUnloading: z.boolean().default(true), // Last In, First Out
  groupByRoom: z.boolean().default(true),
  frontLoadLastDrop: z.boolean().default(true),
  partialUnloadStrategy: z.boolean().default(true)
});

// Van Utilization (Section 4)
export const VanUtilizationSchema = z.object({
  maxVolumeM3: z.number().default(14.5),
  maxWeightKg: z.number().default(3500),
  maxItems: z.number().default(150),
  useFullHeight: z.boolean().default(true),
  fillGaps: z.boolean().default(true),
  dismantlePossible: z.boolean().default(true)
});

// Time Estimates (Section 5)
export const TimeEstimatesSchema = z.object({
  itemHandlingMinutes: z.number().default(3), // 2-5 minutes per item
  dismantlingMultiplier: z.number().default(1.2), // Additional time for dismantling
  stairFactor: z.number().default(1.4), // +30-50% for stairs
  distanceFactor: z.number().default(1.125), // +10-15% per 50m
  fragilityMultiplier: z.object({
    low: z.number().default(1.0),
    medium: z.number().default(1.2),
    high: z.number().default(1.5)
  })
});

// Damage Risk & Insurance (Section 6)
export const DamageRiskSchema = z.object({
  highRiskItems: z.array(z.string()), // Item IDs requiring special care
  fragilityCosts: z.object({
    low: z.number().default(0.50), // £0.50 per low-fragility item
    medium: z.number().default(1.00), // £1.00 per medium-fragility item
    high: z.number().default(2.50) // £2.50 per high-fragility item
  }),
  insuranceCategories: z.object({
    standard: z.number().default(0.005), // 0.5% of item value
    highValue: z.number().default(0.01) // 1.0% of item value
  })
});

// Seasonal & Regional Notes (Section 7)
export const SeasonalNotesSchema = z.object({
  summerPeak: z.object({
    active: z.boolean(),
    surcharge: z.number().default(0.15), // 15% surcharge
    timeMultiplier: z.number().default(1.1) // Longer days
  }),
  studentMoves: z.object({
    active: z.boolean(),
    surcharge: z.number().default(0.20), // 20% surcharge
    volumeMultiplier: z.number().default(1.2) // Higher volume
  }),
  suburbanAreas: z.object({
    gardenItemsMultiplier: z.number().default(1.3),
    toolEquipmentMultiplier: z.number().default(1.2)
  })
});

// ============================================================================
// ENHANCED PRICING CONFIGURATION (100% Operational Compliance)
// ============================================================================

export const OperationalPricingConfigSchema = z.object({
  // Dataset compliance
  datasetVersion: z.string().default("UK_Removal_Dataset_v1.0"),
  fieldCompliance: z.number().min(22).default(22), // All 22 fields

  // Van specifications (from operational insights)
  vanSpecs: VanUtilizationSchema,

  // Loading strategy
  loadingStrategy: LoadingStrategySchema,

  // Worker allocation
  workerAllocation: WorkerAllocationSchema,

  // Multi-drop efficiency
  multiDropEfficiency: MultiDropEfficiencySchema,

  // Time estimates
  timeEstimates: TimeEstimatesSchema,

  // Damage risk & insurance
  damageRisk: DamageRiskSchema,

  // Seasonal notes
  seasonalNotes: SeasonalNotesSchema,

  // Pricing rates (derived from operational insights)
  baseRates: z.object({
    perKm: z.number().default(1.50),
    perMinute: z.number().default(0.50),
    perKg: z.number().default(0.08),
    perM3: z.number().default(4.50),
    baseFee: z.number().default(75.00),
    multiDropDiscount: z.number().default(0.15),
    workerHourlyRate: z.number().default(18.00),
    dismantlingPerMinute: z.number().default(0.30)
  }),

  // Service multipliers
  serviceMultipliers: z.object({
    economy: z.number().default(0.85),
    standard: z.number().default(1.0),
    premium: z.number().default(1.35)
  }),

  // Surcharges (from operational insights)
  surcharges: z.object({
    stairs: z.number().default(15.00), // £15 per flight
    parking: z.number().default(25.00), // £25 for difficult parking
    congestion: z.number().default(20.00), // £20 for congestion zones
    timeWindows: z.number().default(35.00), // £35 for specific time requirements
    rushHour: z.number().default(0.10), // 10% rush hour multiplier
    weekend: z.number().default(0.05), // 5% weekend surcharge
    peakSeason: z.number().default(0.15), // 15% summer peak
    studentSeason: z.number().default(0.20) // 20% student season
  }),

  // Property type categories (from README section 1.1)
  propertyTypes: z.object({
    studio: z.object({
      volumeRange: z.string().default("3-5"),
      loadTimeHours: z.string().default("2-3"),
      vanLoads: z.number().default(1)
    }),
    oneBedroomFlat: z.object({
      volumeRange: z.string().default("8-12"),
      loadTimeHours: z.string().default("3-4"),
      vanLoads: z.number().default(1)
    }),
    twoBedroomFlat: z.object({
      volumeRange: z.string().default("15-20"),
      loadTimeHours: z.string().default("4-6"),
      vanLoads: z.string().default("1-2")
    }),
    threeBedroomFlat: z.object({
      volumeRange: z.string().default("20-25"),
      loadTimeHours: z.string().default("5-7"),
      vanLoads: z.string().default("1.5-2")
    }),
    fourBedroomFlat: z.object({
      volumeRange: z.string().default("25-30"),
      loadTimeHours: z.string().default("6-8"),
      vanLoads: z.string().default("2-2.5")
    }),
    twoBedroomHouse: z.object({
      volumeRange: z.string().default("18-25"),
      loadTimeHours: z.string().default("5-7"),
      vanLoads: z.string().default("1-2")
    }),
    threeBedroomHouse: z.object({
      volumeRange: z.string().default("25-35"),
      loadTimeHours: z.string().default("6-9"),
      vanLoads: z.string().default("1.5-2.5")
    }),
    fourBedroomHouse: z.object({
      volumeRange: z.string().default("35-45"),
      loadTimeHours: z.string().default("8-12"),
      vanLoads: z.string().default("2.5-3")
    }),
    fivePlusBedroomHouse: z.object({
      volumeRange: z.string().default("45-60"),
      loadTimeHours: z.string().default("10-15"),
      vanLoads: z.string().default("3-4")
    })
  }),

  // Customer segments
  customerSegments: z.object({
    bronze: z.object({ discount: z.number().default(0) }),
    silver: z.object({ discount: z.number().default(0.05) }),
    gold: z.object({ discount: z.number().default(0.10) }),
    platinum: z.object({ discount: z.number().default(0.15) })
  }),

  // Fragility levels
  fragilityLevels: z.object({
    low: z.object({
      insuranceCost: z.number().default(0.50),
      handlingMultiplier: z.number().default(1.0)
    }),
    medium: z.object({
      insuranceCost: z.number().default(1.00),
      handlingMultiplier: z.number().default(1.2)
    }),
    high: z.object({
      insuranceCost: z.number().default(2.50),
      handlingMultiplier: z.number().default(1.5)
    })
  }),

  // Insurance categories
  insuranceCategories: z.object({
    standard: z.object({
      coverageRate: z.number().default(0.005), // 0.5%
      premium: z.number().default(5.00)
    }),
    highValue: z.object({
      coverageRate: z.number().default(0.01), // 1.0%
      premium: z.number().default(10.00)
    })
  })
});

// ============================================================================
// ENHANCED PRICING INPUT WITH OPERATIONAL COMPLIANCE
// ============================================================================

export const EnhancedPricingInputSchema = ComprehensivePricingInputSchema.extend({
  operationalConfig: OperationalPricingConfigSchema.optional(),

  // Enhanced address validation
  pickup: StructuredAddressSchema.extend({
    propertyType: z.enum(['house', 'apartment', 'office', 'warehouse', 'other']).default('house'),
    accessNotes: z.string().optional(),
    parkingSituation: z.enum(['easy', 'moderate', 'difficult']).optional(),
    congestionZone: z.boolean().optional()
  }),

  dropoffs: z.array(StructuredAddressSchema.extend({
    propertyType: z.enum(['house', 'apartment', 'office', 'warehouse', 'other']).default('house'),
    accessNotes: z.string().optional(),
    parkingSituation: z.enum(['easy', 'moderate', 'difficult']).optional(),
    congestionZone: z.boolean().optional()
  })).max(5),

  // Enhanced time factors
  timeFactors: TimeFactorsSchema.extend({
    isSchoolHoliday: z.boolean().optional(),
    isBankHoliday: z.boolean().optional(),
    trafficConditions: z.enum(['light', 'moderate', 'heavy']).optional()
  }),

  // Enhanced service options
  serviceOptions: z.object({
    whiteGloveService: z.boolean().optional(),
    packingService: z.object({
      volumeM3: z.number().min(0).optional(),
      boxes: z.number().min(0).optional()
    }).optional(),
    cleaningService: z.boolean().optional(),
    storageService: z.object({
      durationMonths: z.number().min(1).max(12).optional(),
      volumeM3: z.number().min(0).optional()
    }).optional(),
    insurance: z.enum(['basic', 'standard', 'premium']).optional()
  }).optional()
});

// ============================================================================
// ENHANCED PRICING RESULT WITH FULL OPERATIONAL COMPLIANCE
// ============================================================================

export const EnhancedPricingResultSchema = ComprehensivePricingResultSchema.extend({
  operationalCompliance: z.object({
    datasetFieldsUsed: z.number().min(22),
    operationalRulesApplied: z.number(),
    capacityEnforced: z.boolean(),
    addressStructured: z.boolean(),
    timeFactorsApplied: z.boolean(),
    seasonalAdjustments: z.boolean(),
    loadingStrategyOptimized: z.boolean(),
    workerAllocationCorrect: z.boolean(),
    multiDropEfficiency: z.boolean(),
    insuranceCompliance: z.boolean(),
    damagePrevention: z.boolean()
  }),

  detailedBreakdown: z.object({
    itemLevelCosts: z.array(z.object({
      itemId: z.string(),
      name: z.string(),
      baseCost: z.number(),
      laborCost: z.number(),
      fragilityCost: z.number(),
      insuranceCost: z.number(),
      totalCost: z.number(),
      operationalNotes: z.array(z.string())
    })),
    routeLevelCosts: z.array(z.object({
      legIndex: z.number(),
      distanceKm: z.number(),
      durationMinutes: z.number(),
      baseCost: z.number(),
      trafficMultiplier: z.number(),
      accessSurcharges: z.number(),
      totalCost: z.number(),
      operationalEfficiency: z.number()
    })),
    stopLevelCosts: z.array(z.object({
      stopIndex: z.number(),
      stopType: z.string(),
      itemsCount: z.number(),
      weightKg: z.number(),
      volumeM3: z.number(),
      accessComplexity: z.string(),
      timeRequired: z.number(),
      laborCost: z.number(),
      totalCost: z.number()
    }))
  }),

  complianceMetadata: z.object({
    rulesValidated: z.array(z.string()),
    warningsGenerated: z.array(z.string()),
    recommendationsProvided: z.array(z.string()),
    operationalInsightsApplied: z.array(z.string()),
    datasetComplianceScore: z.number().min(0).max(100),
    parityCheckResult: z.enum(['passed', 'failed', 'warning']),
    parityDifferences: z.array(z.string()).optional()
  })
});

// ============================================================================
// EXPORT ALL ENHANCED SCHEMAS
// ============================================================================

export type LoadingStrategy = z.infer<typeof LoadingStrategySchema>;
export type WorkerAllocation = z.infer<typeof WorkerAllocationSchema>;
export type MultiDropEfficiency = z.infer<typeof MultiDropEfficiencySchema>;
export type VanUtilization = z.infer<typeof VanUtilizationSchema>;
export type TimeEstimates = z.infer<typeof TimeEstimatesSchema>;
export type DamageRisk = z.infer<typeof DamageRiskSchema>;
export type SeasonalNotes = z.infer<typeof SeasonalNotesSchema>;
export type OperationalPricingConfig = z.infer<typeof OperationalPricingConfigSchema>;
export type EnhancedPricingInput = z.infer<typeof EnhancedPricingInputSchema>;
export type EnhancedPricingResult = z.infer<typeof EnhancedPricingResultSchema>;

// Re-export original types for backward compatibility
export type UKDatasetItem = z.infer<typeof UKDatasetItemSchema>;
export type PropertyType = z.infer<typeof PropertyTypeSchema>;
export type VanSpecs = z.infer<typeof VanSpecsSchema>;
export type PricingRates = z.infer<typeof PricingRatesSchema>;
export type ServiceMultipliers = z.infer<typeof ServiceMultipliersSchema>;
export type Surcharges = z.infer<typeof SurchargesSchema>;
export type StructuredAddress = z.infer<typeof StructuredAddressSchema>;
export type TimeFactors = z.infer<typeof TimeFactorsSchema>;
export type PricingItem = z.infer<typeof PricingItemSchema>;
export type MultiDropStop = z.infer<typeof MultiDropStopSchema>;
export type ComprehensivePricingInput = z.infer<typeof ComprehensivePricingInputSchema>;
export type ItemPricingBreakdown = z.infer<typeof ItemPricingBreakdownSchema>;
export type RouteLegPricing = z.infer<typeof RouteLegPricingSchema>;
export type StopPricing = z.infer<typeof StopPricingSchema>;
export type ComprehensivePricingBreakdown = z.infer<typeof ComprehensivePricingBreakdownSchema>;
export type CapacityCheck = z.infer<typeof CapacityCheckSchema>;
export type RouteOptimization = z.infer<typeof RouteOptimizationSchema>;
export type MultiDropRoute = z.infer<typeof MultiDropRouteSchema>;
export type ComprehensivePricingResult = z.infer<typeof ComprehensivePricingResultSchema>;
