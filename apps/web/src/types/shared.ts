import { z } from 'zod';

// Shared types for frontend and backend
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: ErrorCode;
  message?: string;
  validationErrors?: ValidationError[];
  statusCode?: number;
  timestamp?: string;
}

// Basic schemas
export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  country: z.string().default('UK'),
});

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

export const propertyDetailsSchema = z.object({
  type: z.enum(['house', 'apartment', 'office', 'warehouse', 'other']).optional().default('house'),
  floors: z.number().int().min(0).max(50).optional().default(0),
  hasLift: z.boolean().optional().default(false),
  hasParking: z.boolean().optional().default(true),
  accessNotes: z.string().max(1000).optional(),
  requiresPermit: z.boolean().optional().default(false),
});

export const luxuryBookingItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().min(1),
  category: z.string().optional(),
  volumeFactor: z.number().optional(),
  requiresTwoPerson: z.boolean().default(false),
  isFragile: z.boolean().default(false),
  requiresDisassembly: z.boolean().default(false),
});

export const currencyAmountSchema = z.object({
  amount: z.number().min(0),
  currency: z.string().default('GBP'),
});

export const createLuxuryBookingSchema = z.object({
  customer: customerSchema,
  pickupAddress: addressSchema,
  dropoffAddress: addressSchema,
  pickupDetails: propertyDetailsSchema.optional(),
  dropoffDetails: propertyDetailsSchema.optional(),
  items: z.array(luxuryBookingItemSchema).min(1, 'At least one item is required'),
  scheduledFor: z.string().datetime().optional(),
  pickupDate: z.string().datetime().optional(),
  pickupTimeSlot: z.string().optional(),
  urgency: z.enum(['same-day', 'next-day', 'scheduled']).optional(),
  notes: z.string().optional(),
  pricing: z.object({
    subtotal: z.number().min(0),
    vat: z.number().min(0),
    total: z.number().min(0),
    currency: z.string().default('GBP'),
  }),
  promotionCode: z.string().optional(),
  promotionDetails: z.object({
    id: z.string().optional(),
    code: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(['percentage', 'fixed']).optional(),
    value: z.number().optional(),
    discountAmount: z.number().optional(),
    originalAmount: z.number().optional(),
    finalAmount: z.number().optional(),
  }).optional(),
});
