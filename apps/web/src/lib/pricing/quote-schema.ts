/**
 * Quote request/response schemas — importable by client code without pulling in
 * server-only modules (no prisma, no fs-reading pricing engine).
 */
import { z } from 'zod';

// ─── Request ──────────────────────────────────────────────────────────────────

const QuoteAddressSchema = z.object({
  full: z.string().min(1),
  line1: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().min(1),
  coordinates: z
    .object({ lat: z.number(), lng: z.number() })
    .optional(),
  floors: z.number().int().min(0).max(50).optional(),
  hasLift: z.boolean().optional(),
  propertyType: z.string().optional(),
  parkingSituation: z.string().optional(),
  congestionZone: z.boolean().optional(),
});

const QuoteItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().int().min(1),
  weight_override: z.number().optional(),
  volume_override: z.number().optional(),
});

export const QuoteExtrasSchema = z.object({
  packing: z.boolean().default(false),
  packingVolumeM3: z.number().optional(),
  protection: z.enum(['basic', 'standard', 'premium']).optional(),
  assembly: z
    .array(
      z.object({
        itemId: z.string(),
        dismantle: z.boolean().default(false),
        reassemble: z.boolean().default(false),
      })
    )
    .default([]),
});

export const QuoteRequestSchema = z.object({
  pickup: QuoteAddressSchema,
  dropoffs: z.array(QuoteAddressSchema).min(1),
  /** Optional multi-leg segments; each segment has its own pickup+dropoffs. */
  segments: z
    .array(
      z.object({
        pickup: QuoteAddressSchema,
        dropoffs: z.array(QuoteAddressSchema).min(1),
        items: z.array(QuoteItemSchema).optional(),
      })
    )
    .optional(),
  items: z.array(QuoteItemSchema).min(1),
  crewSize: z.enum(['1', '2', '3', '4']).default('2'),
  extras: QuoteExtrasSchema.default({}),
  timeSlot: z.enum(['morning', 'afternoon', 'evening', 'flexible']).optional(),
});

export type QuoteAddress = z.infer<typeof QuoteAddressSchema>;
export type QuoteItem = z.infer<typeof QuoteItemSchema>;
export type QuoteExtras = z.infer<typeof QuoteExtrasSchema>;
export type QuoteRequest = z.infer<typeof QuoteRequestSchema>;

// ─── Response ─────────────────────────────────────────────────────────────────

export const QuoteResponseSchema = z.object({
  quoteId: z.string(),
  expiresAt: z.string(), // ISO string
  datePrices: z.array(
    z.object({
      dateKey: z.string(),   // YYYY-MM-DD
      totalPence: z.number().int(),
      cheapest: z.boolean(),
    })
  ),
  crewOptions: z.array(
    z.object({
      crewSize: z.enum(['1', '2', '3', '4']),
      totalPence: z.number().int(),
      deltaPence: z.number().int(),
      recommended: z.boolean(),
      reason: z.string().optional(),
    })
  ),
  /** Empty array until Phase 1 (assembly opt-in). */
  assemblyOptions: z.array(
    z.object({
      itemId: z.string(),
      name: z.string(),
      quantity: z.number().int(),
      dismantlePence: z.number().int(),
      reassemblePence: z.number().int(),
    })
  ),
  lines: z.array(
    z.object({
      code: z.string(),
      label: z.string(),
      amountPence: z.number().int(),
    })
  ),
  route: z.object({
    miles: z.number().optional(),
    durationMinutes: z.number().optional(),
  }),
  van: z.object({
    name: z.string().optional(),
    loadPercent: z.number().optional(),
  }),
});

export type QuoteResponse = z.infer<typeof QuoteResponseSchema>;

// ─── Error ────────────────────────────────────────────────────────────────────

export const QUOTE_ERROR_CODES = [
  'VALIDATION',
  'PRICING_UNAVAILABLE',
  'QUOTE_EXPIRED',
  'QUOTE_CONSUMED',
  'NETWORK',
  'TIMEOUT',
] as const;

export type QuoteErrorCode = (typeof QUOTE_ERROR_CODES)[number];

export interface QuoteError {
  code: QuoteErrorCode;
  message: string;
  fields?: Record<string, string[]>;
}

// ─── Checkout resolution ──────────────────────────────────────────────────────

export interface ResolveQuoteInput {
  quoteId: string;
  dateKey: string;
  promoCode?: string;
  customerEmail?: string;
  /** Provided by the booking-luxury API after creating/finding the booking. */
  bookingId?: string;
}

export interface ResolvedQuote {
  amountPence: number;
  crewSize: '1' | '2' | '3' | '4';
  extras: QuoteExtras;
  promotionCode?: string;
  discountPence: number;
}
