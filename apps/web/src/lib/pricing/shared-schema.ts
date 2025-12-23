/**
 * UNIFIED PRICING REQUEST SCHEMA
 * 
 * Single source of truth for pricing API contracts.
 * Used by both /api/pricing/quote and /api/pricing/comprehensive
 * 
 * @fileoverview
 * This schema defines the contract between frontend and backend for pricing requests.
 * It handles normalization, validation, and provides clear error messages.
 */

import { z } from 'zod';

/**
 * Address schema - used for pickup and dropoff locations
 */
export const PricingAddressSchema = z.object({
  full: z.string().min(1, 'Address is required'),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postcode: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return val;
      const normalized = val.trim().toUpperCase();
      if (!normalized) return '';
      return normalized;
    },
    z.string()
      .min(1, 'Postcode is required')
      .regex(
        /^([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}|GIR\s?0AA)$/i,
        'Invalid UK postcode format (e.g., SW1A 1AA, M1 1AE, GIR 0AA)'
      )
  ),
  
  // Optional structured fields (for availability calculation)
  street: z.string().min(1).optional(),
  number: z.string().min(1).optional(),
  
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  
  propertyType: z.enum(['house', 'apartment', 'office', 'warehouse', 'other']).default('house'),
  accessNotes: z.string().optional(),
  parkingSituation: z.enum(['easy', 'moderate', 'difficult']).default('easy'),
  congestionZone: z.boolean().default(false),
});

/**
 * Item schema with smart quantity handling
 * 
 * - Coerces strings to numbers
 * - Normalizes undefined/null to 1
 * - Server will filter out items with quantity < 1
 */
export const PricingItemSchema = z.object({
  id: z.string().min(1, 'Item ID is required'),
  name: z.string().min(1, 'Item name is required'),
  
  // Smart quantity handling:
  // 1. Coerce string "1" -> number 1
  // 2. Transform undefined/null -> 1
  // 3. Server-side filtering will remove quantity < 1
  quantity: z.preprocess(
    (val) => {
      // Handle undefined, null, empty string
      if (val === undefined || val === null || val === '') return 1;
      
      // Handle string numbers
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10);
        return isNaN(parsed) ? 1 : parsed;
      }
      
      // Handle actual numbers
      if (typeof val === 'number') {
        return val;
      }
      
      return 1;
    },
    z.number().int('Quantity must be a whole number')
  ),
  
  weight_override: z.number().positive().optional(),
  volume_override: z.number().positive().optional(),
});

/**
 * Time factors schema for dynamic pricing
 */
export const TimeFactorsSchema = z.object({
  isRushHour: z.boolean().optional(),
  isPeakSeason: z.boolean().optional(),
  isStudentSeason: z.boolean().optional(),
  isWeekend: z.boolean().optional(),
  isSchoolHoliday: z.boolean().optional(),
  isBankHoliday: z.boolean().optional(),
  trafficConditions: z.enum(['light', 'moderate', 'heavy']).optional(),
  currentHour: z.number().min(0).max(23).optional(),
  currentMonth: z.number().min(1).max(12).optional(),
});

/**
 * Service options schema
 */
export const ServiceOptionsSchema = z.object({
  whiteGloveService: z.boolean().optional(),
  packingService: z.object({
    volumeM3: z.number().min(0).optional(),
    boxes: z.number().min(0).optional(),
  }).optional(),
  cleaningService: z.boolean().optional(),
  storageService: z.object({
    durationMonths: z.number().min(1).max(12).optional(),
    volumeM3: z.number().min(0).optional(),
  }).optional(),
  insurance: z.enum(['basic', 'standard', 'premium']).optional(),
});

/**
 * BASE PRICING REQUEST SCHEMA
 * 
 * This is the core schema used by both quote and comprehensive endpoints.
 * Add endpoint-specific fields via .extend() or .merge()
 */
export const BasePricingRequestSchema = z.object({
  correlationId: z.string().min(1).optional(),
  
  // Items array - will be normalized server-side
  items: z.array(PricingItemSchema).default([]),
  
  pickup: PricingAddressSchema,
  dropoffs: z.array(PricingAddressSchema).max(5, 'Maximum 5 dropoff locations'),
  
  serviceLevel: z.enum(['economy', 'standard', 'premium', 'signature', 'white-glove']).default('standard'),
  // Accept various date formats and normalize to ISO string
  scheduledDate: z.string().transform((val) => {
    // If already valid ISO datetime, return as is
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(val)) {
      return val;
    }
    // Try to parse and convert to ISO
    const date = new Date(val);
    if (isNaN(date.getTime())) {
      // If invalid, use tomorrow as fallback
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow.toISOString();
    }
    return date.toISOString();
  }),
  customerSegment: z.enum(['bronze', 'silver', 'gold', 'platinum']).default('bronze'),
  
  // ✅ Add urgency and timeSlot for accurate pricing
  urgency: z.enum(['standard', 'express', 'urgent']).optional(),
  timeSlot: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional(),
  
  timeFactors: TimeFactorsSchema.optional(),
  serviceOptions: ServiceOptionsSchema.optional(),
  operationalConfig: z.any().optional(),
});

/**
 * TypeScript types exported from schemas
 */
export type PricingAddress = z.infer<typeof PricingAddressSchema>;
export type PricingItem = z.infer<typeof PricingItemSchema>;
export type TimeFactors = z.infer<typeof TimeFactorsSchema>;
export type ServiceOptions = z.infer<typeof ServiceOptionsSchema>;
export type BasePricingRequest = z.infer<typeof BasePricingRequestSchema>;

/**
 * Server-side normalization function
 * 
 * Filters out invalid items and returns normalized payload.
 * Returns error if no valid items remain.
 */
export interface NormalizedPricingRequest extends BasePricingRequest {
  items: PricingItem[];
  hasValidItems: boolean;
  originalItemCount: number;
  validItemCount: number;
}

export function normalizePricingRequest(
  input: BasePricingRequest
): { success: true; data: NormalizedPricingRequest } | { success: false; error: string; code: string } {
  const originalItemCount = input.items.length;
  
  // Filter out items with quantity < 1
  const validItems = input.items.filter(item => {
    return typeof item.quantity === 'number' && item.quantity >= 1;
  });
  
  const validItemCount = validItems.length;
  
  // If no valid items after filtering, return error
  if (validItemCount === 0) {
    return {
      success: false,
      error: 'No valid items in request. All items must have quantity >= 1.',
      code: 'NO_VALID_ITEMS',
    };
  }
  
  return {
    success: true,
    data: {
      ...input,
      items: validItems,
      hasValidItems: true,
      originalItemCount,
      validItemCount,
    },
  };
}

/**
 * Pricing error codes for structured error handling
 */
export const PricingErrorCode = {
  NO_VALID_ITEMS: 'NO_VALID_ITEMS',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_DATE: 'INVALID_DATE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CALCULATION_ERROR: 'CALCULATION_ERROR',
} as const;

export type PricingErrorCode = typeof PricingErrorCode[keyof typeof PricingErrorCode];

/**
 * Structured error response
 */
export interface PricingError {
  error: string;
  code: PricingErrorCode;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Helper to format Zod errors into structured pricing errors
 */
export function formatPricingError(error: z.ZodError): PricingError {
  const firstIssue = error.issues[0];
  
  return {
    error: firstIssue?.message || 'Validation error',
    code: PricingErrorCode.VALIDATION_ERROR,
    details: {
      path: firstIssue?.path.join('.'),
      issues: error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    },
    timestamp: new Date().toISOString(),
  };
}
