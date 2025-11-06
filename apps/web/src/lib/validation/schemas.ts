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

// Pagination and query schemas
export const paginationQuery = z.object({
  page: z.union([z.string(), z.number(), z.undefined()]).transform((val) => {
    if (val === undefined || val === null || val === '') return 1;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) ? 1 : Math.max(1, num);
  }).pipe(z.number().int().min(1)).default(1),
  limit: z.union([z.string(), z.number(), z.undefined()]).transform((val) => {
    if (val === undefined || val === null || val === '') return 20;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) ? 20 : Math.min(100, Math.max(1, num));
  }).pipe(z.number().int().min(1).max(100)).default(20),
});

export const searchQuery = z.object({
  search: z.string().optional(),
  role: z.enum(['customer', 'driver', 'admin']).optional(),
  status: z.string().optional(),
});

// ID parameter schema
export const idParam = z.object({
  id: z.string().min(1, 'ID is required'),
});

// Customer schemas
export const customerCreate = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().min(1, 'Phone is required').optional(),
});

// Admin user schemas
export const adminUserCreate = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  adminRole: z.enum(['super_admin', 'admin', 'moderator']).default('admin'),
  isActive: z.boolean().default(true),
});

export const adminUserUpdate = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  adminRole: z.enum(['super_admin', 'admin', 'moderator']).optional(),
  isActive: z.boolean().optional(),
});

// Driver application schemas
export const driverApplicationCreate = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  vehicleType: z.enum(['van', 'truck', 'car']).optional(),
  experience: z.number().min(0).optional(),
  notes: z.string().optional(),
});

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
export type PaginationQuery = z.infer<typeof paginationQuery>;
export type SearchQuery = z.infer<typeof searchQuery>;
export type IdParam = z.infer<typeof idParam>;
export type CustomerCreate = z.infer<typeof customerCreate>;
export type AdminUserCreate = z.infer<typeof adminUserCreate>;
export type AdminUserUpdate = z.infer<typeof adminUserUpdate>;
export type DriverApplicationCreate = z.infer<typeof driverApplicationCreate>;