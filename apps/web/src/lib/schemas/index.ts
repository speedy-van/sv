/**
 * Shared Validation Schemas Index
 * Central export point for all validation schemas used across frontend and backend
 */

// Re-export all booking schemas
// export * from './booking-schemas';
export * from './user-schemas';

// Note: Other shared types are imported individually where needed

// Common validation utilities
import { z } from 'zod';

// Common field schemas that can be reused
export const commonSchemas = {
  // ID fields
  uuid: z.string().uuid('Invalid UUID format'),
  objectId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId format'),
  
  // Text fields
  shortText: z.string().min(1, 'Field is required').max(100, 'Text too long'),
  mediumText: z.string().min(1, 'Field is required').max(500, 'Text too long'),
  longText: z.string().min(1, 'Field is required').max(2000, 'Text too long'),
  
  // Contact fields
  email: z.string().email('Valid email address is required'),
  phone: z.string().regex(/^[\d\s\+\-\(\)]+$/, 'Valid phone number is required').min(10),
  url: z.string().url('Valid URL is required'),
  
  // Location fields
  latitude: z.number().min(-90, 'Invalid latitude').max(90, 'Invalid latitude'),
  longitude: z.number().min(-180, 'Invalid longitude').max(180, 'Invalid longitude'),
  postcode: z.string().regex(/^[A-Z]{1,2}[0-9]{1,2}[A-Z]?\s?[0-9][A-Z]{2}$/i, { message: 'Invalid UK postcode' }),
  
  // Date/time fields
  isoDateTime: z.string().datetime('Invalid ISO datetime format'),
  dateOnly: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  timeOnly: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:MM)'),
  
  // Numeric fields
  positiveNumber: z.number().min(0, 'Must be positive'),
  positiveInteger: z.number().int().min(0, 'Must be positive integer'),
  percentage: z.number().min(0, 'Invalid percentage').max(100, 'Invalid percentage'),
  currency: z.number().min(0, 'Invalid amount').multipleOf(0.01, 'Invalid currency amount'),
  
  // File fields
  imageUrl: z.string().url('Valid image URL is required').regex(/\.(jpg|jpeg|png|gif|webp)$/i, 'Must be image URL'),
  documentUrl: z.string().url('Valid document URL is required'),
  
  // Status fields
  genericStatus: z.enum(['active', 'inactive', 'pending', 'suspended']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  
  // Pagination
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit too high').default(20),
  
  // Search and filters
  searchQuery: z.string().min(1, 'Search query is required').max(100, 'Search query too long').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  sortBy: z.string().min(1, 'Sort field is required').optional(),
};

// Pagination schema
export const paginationSchema = z.object({
  page: commonSchemas.page,
  limit: commonSchemas.limit,
  sortBy: commonSchemas.sortBy,
  sortOrder: commonSchemas.sortOrder,
});

// Search schema
export const searchSchema = z.object({
  query: commonSchemas.searchQuery,
  filters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  ...paginationSchema.shape,
});

// API response wrapper schemas
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
    timestamp: z.string().datetime(),
    requestId: z.string().optional(),
  });

export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  details: z.any().optional(),
  timestamp: z.string().datetime(),
  requestId: z.string().optional(),
});

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.object({
      items: z.array(itemSchema),
      pagination: z.object({
        page: z.number().int().min(1),
        limit: z.number().int().min(1),
        total: z.number().int().min(0),
        pages: z.number().int().min(0),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
      }),
    }),
    message: z.string().optional(),
    timestamp: z.string().datetime(),
    requestId: z.string().optional(),
  });

// Export types
export type Pagination = z.infer<typeof paginationSchema>;
export type Search = z.infer<typeof searchSchema>;
export type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  requestId?: string;
};
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
export type PaginatedResponse<T> = {
  success: true;
  data: {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  message?: string;
  timestamp: string;
  requestId?: string;
};

// Validation helper functions
export function createSuccessResponseValidator<T extends z.ZodTypeAny>(dataSchema: T) {
  return successResponseSchema(dataSchema);
}

export function createPaginatedResponseValidator<T extends z.ZodTypeAny>(itemSchema: T) {
  return paginatedResponseSchema(itemSchema);
}

// Generic validation function with better error messages
export function validateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      
      throw new Error(`Validation failed${context ? ` for ${context}` : ''}: ${
        formattedErrors.map(e => `${e.field}: ${e.message}`).join(', ')
      }`);
    }
    throw error;
  }
}

// Safe validation function that returns result object
export function safeValidateWithSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: string; details: any[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    const details = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));
    
    return {
      success: false,
      error: 'Validation failed',
      details,
    };
  }
}
