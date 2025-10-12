import { z } from 'zod';

// Core pricing input schema
export const PricingInputSchema = z.object({
  // Items data
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    quantity: z.number().min(1),
    weight: z.number().min(0).optional(),
    volume: z.number().min(0).optional(),
    fragile: z.boolean().optional().default(false),
    oversize: z.boolean().optional().default(false),
    disassemblyRequired: z.boolean().optional().default(false),
    specialHandling: z.array(z.string()).optional().default([])
  })),

  // Address data with multi-drop support
  pickup: z.object({
    address: z.string(),
    postcode: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }),
    propertyDetails: z.object({
      type: z.enum(['house', 'apartment', 'office', 'warehouse', 'other']),
      floors: z.number().min(0).max(50).default(0),
      hasLift: z.boolean().default(false),
      hasParking: z.boolean().default(true),
      accessNotes: z.string().optional(),
      requiresPermit: z.boolean().default(false)
    })
  }),

  dropoffs: z.array(z.object({
    address: z.string(),
    postcode: z.string(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }),
    propertyDetails: z.object({
      type: z.enum(['house', 'apartment', 'office', 'warehouse', 'other']),
      floors: z.number().min(0).max(50).default(0),
      hasLift: z.boolean().default(false),
      hasParking: z.boolean().default(true),
      accessNotes: z.string().optional(),
      requiresPermit: z.boolean().default(false)
    }),
    // For multi-drop: items assigned to this location
    itemIds: z.array(z.string()).optional()
  })).min(1),

  // Service details
  serviceLevel: z.enum(['standard', 'express', 'scheduled', 'signature', 'premium', 'white-glove']).default('standard'),
  
  // Scheduling
  scheduledDate: z.string().datetime().optional(),
  timeSlot: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional().default('flexible'),

  // Add-ons
  addOns: z.object({
    packing: z.boolean().default(false),
    packingVolume: z.number().min(0).optional(),
    disassembly: z.array(z.string()).optional().default([]),
    reassembly: z.array(z.string()).optional().default([]),
    insurance: z.enum(['basic', 'standard', 'premium']).optional()
  }).optional().default({}),

  // Promo and discounts
  promoCode: z.string().optional(),
  
  // User context
  userContext: z.object({
    isAuthenticated: z.boolean().default(false),
    isReturningCustomer: z.boolean().default(false),
    customerTier: z.enum(['standard', 'premium', 'enterprise']).default('standard'),
    locale: z.string().default('en-GB')
  }).optional().default({})
});

// Pricing result schema
export const PricingResultSchema = z.object({
  // Core totals in pence
  amountGbpMinor: z.number().int().min(0),
  subtotalBeforeVat: z.number().int().min(0),
  vatAmount: z.number().int().min(0),
  vatRate: z.number().min(0).max(1),

  // Breakdown in pence
  breakdown: z.object({
    baseFee: z.number().int().min(0),
    itemsFee: z.number().int().min(0),
    distanceFee: z.number().int().min(0),
    serviceFee: z.number().int().min(0),
    vehicleFee: z.number().int().min(0),
    propertyAccessFee: z.number().int().min(0),
    addOnsFee: z.number().int().min(0),
    surcharges: z.number().int().min(0),
    discounts: z.number().int().max(0)
  }),

  // Surcharge details
  surcharges: z.array(z.object({
    category: z.string(),
    amount: z.number().int(),
    reason: z.string(),
    itemId: z.string().optional()
  })),

  // Discount details  
  discounts: z.array(z.object({
    type: z.string(),
    amount: z.number().int().max(0),
    description: z.string(),
    promoCode: z.string().optional()
  })),

  // Route information
  route: z.object({
    totalDistance: z.number().min(0),
    totalDuration: z.number().min(0),
    legs: z.array(z.object({
      fromAddress: z.string(),
      toAddress: z.string(),
      distance: z.number().min(0),
      duration: z.number().min(0)
    }))
  }),

  // Vehicle recommendation
  recommendedVehicle: z.object({
    type: z.string(),
    name: z.string(),
    capacity: z.number(),
    totalWeight: z.number(),
    totalVolume: z.number()
  }),

  // Multi-drop details (optional for single drops)
  multiDrop: z.any().optional(),

  // Metadata
  metadata: z.object({
    requestId: z.string().uuid(),
    calculatedAt: z.string().datetime(),
    version: z.string(),
    currency: z.string().default('GBP'),
    dataSourceVersion: z.string(),
    warnings: z.array(z.string()).optional().default([]),
    recommendations: z.array(z.string()).optional().default([])
  })
});

// Multi-drop specific schemas
export const MultiDropCalculationSchema = z.object({
  totalStops: z.number().min(1).max(5),
  extraStops: z.number().min(0),
  routeOptimized: z.boolean(),
  stopSurcharges: z.array(z.object({
    stopIndex: z.number(),
    address: z.string(),
    surcharge: z.number().int(),
    reason: z.string()
  }))
});

// Stripe integration schemas
export const StripePaymentIntentSchema = z.object({
  amount: z.number().int().min(50), // Minimum 50 pence
  currency: z.string().default('gbp'),
  automaticPaymentMethods: z.object({
    enabled: z.boolean().default(true)
  }),
  metadata: z.record(z.string()),
  idempotencyKey: z.string().uuid()
});

export const WebhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.object({
    object: z.record(z.any())
  }),
  created: z.number(),
  livemode: z.boolean(),
  pending_webhooks: z.number(),
  request: z.object({
    id: z.string().nullable(),
    idempotency_key: z.string().nullable()
  }).nullable()
});

// Type exports
export type PricingInput = z.infer<typeof PricingInputSchema>;
export type PricingResult = z.infer<typeof PricingResultSchema>;
export type MultiDropCalculation = z.infer<typeof MultiDropCalculationSchema>;
export type StripePaymentIntent = z.infer<typeof StripePaymentIntentSchema>;
export type WebhookEvent = z.infer<typeof WebhookEventSchema>;

// Validation helper functions
export function validatePricingInput(input: unknown): PricingInput {
  return PricingInputSchema.parse(input);
}

export function validatePricingResult(result: unknown): PricingResult {
  return PricingResultSchema.parse(result);
}

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function formatGbpMinor(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

export function parseGbpMinor(gbp: number): number {
  return Math.round(gbp * 100);
}