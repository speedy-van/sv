import { z } from 'zod';

// Base schemas for common types
export const AddressSchema = z.object({
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  country: z.string().default('UK'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
});

export const ContactInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
});

// Booking schemas
export const BookingStep1Schema = z.object({
  pickupAddress: AddressSchema,
  dropoffAddress: AddressSchema,
  scheduledDate: z.date(),
  scheduledTime: z.string().min(1, 'Scheduled time is required'),
  serviceType: z.enum(['standard', 'luxury', 'express']),
  vehicleType: z.enum(['van', 'truck', 'car']).optional(),
});

export const BookingStep2Schema = z.object({
  items: z.array(z.object({
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    weight: z.number().positive('Weight must be positive').optional(),
    volume: z.number().positive('Volume must be positive').optional(),
    fragile: z.boolean().default(false),
    requiresStairs: z.boolean().default(false),
  })).min(1, 'At least one item is required'),
  specialInstructions: z.string().optional(),
  insuranceRequired: z.boolean().default(false),
});

export const BookingStep3Schema = z.object({
  customerInfo: ContactInfoSchema,
  paymentMethod: z.enum(['card', 'paypal', 'bank_transfer']),
  termsAccepted: z.boolean().refine(val => val === true, 'Terms must be accepted'),
  marketingConsent: z.boolean().default(false),
});

export const CompleteBookingSchema = z.object({
  step1: BookingStep1Schema,
  step2: BookingStep2Schema,
  step3: BookingStep3Schema,
});

// API Response schemas
export const ApiSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
    timestamp: z.string(),
    requestId: z.string().optional(),
  });

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string(),
  message: z.string(),
  details: z.string().optional(),
  validationErrors: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
  statusCode: z.number(),
  timestamp: z.string(),
  requestId: z.string().optional(),
  path: z.string().optional(),
});

// User schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['customer', 'driver', 'admin']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const SessionSchema = z.object({
  user: UserSchema,
  expires: z.string(),
});

// Driver schemas
export const DriverProfileSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  licenseNumber: z.string().min(1),
  vehicleType: z.enum(['van', 'truck', 'car']),
  isAvailable: z.boolean().default(true),
  rating: z.number().min(0).max(5).optional(),
  totalDeliveries: z.number().min(0).default(0),
  joinedAt: z.date(),
});

// Route schemas
export const RouteSchema = z.object({
  id: z.string().uuid(),
  driverId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
  status: z.enum(['planned', 'assigned', 'in_progress', 'completed', 'cancelled']),
  startTime: z.date(),
  serviceTier: z.string(),
  totalDrops: z.number().min(0),
  completedDrops: z.number().min(0).default(0),
  routeNotes: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Pricing schemas
export const PricingRequestSchema = z.object({
  pickupPostcode: z.string().min(1),
  dropoffPostcode: z.string().min(1),
  scheduledDate: z.date(),
  serviceType: z.enum(['standard', 'luxury', 'express']),
  vehicleType: z.enum(['van', 'truck', 'car']).optional(),
  itemsCount: z.number().min(1),
  hasStairs: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
});

export const PricingResponseSchema = z.object({
  basePrice: z.number().positive(),
  distancePrice: z.number().min(0),
  timePrice: z.number().min(0),
  servicePrice: z.number().min(0),
  totalPrice: z.number().positive(),
  currency: z.string().default('GBP'),
  breakdown: z.object({
    base: z.number(),
    distance: z.number(),
    time: z.number(),
    service: z.number(),
    adjustments: z.array(z.object({
      type: z.string(),
      amount: z.number(),
      reason: z.string(),
    })),
  }),
});

// Validation helpers
export const validateApiRequest = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

export const validateApiResponse = <T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError } => {
  return validateApiRequest(schema, data);
};

// Type exports
export type Address = z.infer<typeof AddressSchema>;
export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type BookingStep1 = z.infer<typeof BookingStep1Schema>;
export type BookingStep2 = z.infer<typeof BookingStep2Schema>;
export type BookingStep3 = z.infer<typeof BookingStep3Schema>;
export type CompleteBooking = z.infer<typeof CompleteBookingSchema>;
export type User = z.infer<typeof UserSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type DriverProfile = z.infer<typeof DriverProfileSchema>;
export type Route = z.infer<typeof RouteSchema>;
export type PricingRequest = z.infer<typeof PricingRequestSchema>;
export type PricingResponse = z.infer<typeof PricingResponseSchema>;

// Pagination and search schemas
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
});

export const searchQuery = z.object({
  search: z.string().optional(),
  role: z.enum(['customer', 'driver', 'admin']).optional(),
  status: z.string().optional(),
});

// ID parameter schema
export const idParam = z.object({
  id: z.string().uuid('Invalid UUID format'),
});

// Customer create schema
export const customerCreate = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
});

// Admin user create schema
export const adminUserCreate = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'driver', 'customer']).default('customer'),
  adminRole: z.enum(['admin', 'superadmin']).optional(),
  isActive: z.boolean().default(true).optional(),
  permissions: z.array(z.string()).optional(),
});

// Admin user update schema
export const adminUserUpdate = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Valid email address is required').optional(),
  phone: z.string().min(10, 'Valid phone number is required').optional(),
  role: z.enum(['admin', 'driver', 'customer']).optional(),
  adminRole: z.enum(['admin', 'superadmin']).optional(),
  isActive: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});

// Driver application create schema
export const driverApplicationCreate = z.object({
  personalInfo: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid email address is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
  }),
  licenseInfo: z.object({
    licenseNumber: z.string().min(5, 'License number is required'),
    licenseExpiry: z.string().datetime('Valid expiry date is required'),
    licenseClass: z.string().min(1, 'License class is required'),
  }),
  vehicleInfo: z.object({
    make: z.string().min(1),
    model: z.string().min(1),
    year: z.number().int(),
    registration: z.string().min(3),
    type: z.enum(['van', 'truck', 'car']),
  }),
  insuranceInfo: z.object({
    provider: z.string().min(1),
    policyNumber: z.string().min(1),
    expiryDate: z.string().datetime(),
  }),
});