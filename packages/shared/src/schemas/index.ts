import { z } from 'zod';
import { UserRole, BookingStatus, ItemCategory, VehicleType } from '../types';

// User schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.nativeEnum(UserRole),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.nativeEnum(UserRole).optional(),
});

// Address schemas
export const addressSchema = z.object({
  id: z.string().uuid().optional(),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// Booking schemas
export const dimensionsSchema = z.object({
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  unit: z.enum(['cm', 'in']),
});

export const bookingItemSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.number().int().positive(),
  weight: z.number().positive().optional(),
  dimensions: dimensionsSchema.optional(),
  category: z.nativeEnum(ItemCategory),
});

// Individual item schema for booking-luxury component (666+ items)
export const individualItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  image: z.string().url('Invalid image URL'),
  weight: z.number().positive(),
  volume: z.number().positive(),
  price: z.number().min(0),
  workersRequired: z.number().int().min(1),
  dismantlingRequired: z.enum(['Yes', 'No']),
  fragilityLevel: z.enum(['High', 'Medium', 'Low']),
  keywords: z.array(z.string()),
});

export const createBookingSchema = z.object({
  pickupAddress: addressSchema,
  deliveryAddress: addressSchema,
  items: z.array(bookingItemSchema).min(1, 'At least one item is required'),
  scheduledAt: z.date().min(new Date(), 'Scheduled time must be in the future'),
});

export const bookingSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  driverId: z.string().uuid().optional(),
  status: z.nativeEnum(BookingStatus),
  pickupAddress: addressSchema,
  deliveryAddress: addressSchema,
  items: z.array(bookingItemSchema),
  scheduledAt: z.date(),
  estimatedDuration: z.number().positive(),
  totalPrice: z.number().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Driver schemas
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  timestamp: z.date(),
});

export const driverSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  licenseNumber: z.string().min(1),
  vehicleType: z.nativeEnum(VehicleType),
  isAvailable: z.boolean(),
  currentLocation: locationSchema.optional(),
  rating: z.number().min(0).max(5),
  totalDeliveries: z.number().int().min(0),
});

// Pricing schemas
export const pricingQuoteSchema = z.object({
  basePrice: z.number().positive(),
  distancePrice: z.number().min(0),
  itemsPrice: z.number().min(0),
  timePrice: z.number().min(0),
  totalPrice: z.number().positive(),
  estimatedDuration: z.number().positive(),
  currency: z.string().length(3),
});

// API schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const paginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive().max(100),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0),
});

export const paginatedResponseSchema = apiResponseSchema.extend({
  data: z.array(z.any()),
  pagination: paginationSchema,
});

// Export type inference helpers
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingItemInput = z.infer<typeof bookingItemSchema>;
export type IndividualItemInput = z.infer<typeof individualItemSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
export type PricingQuoteInput = z.infer<typeof pricingQuoteSchema>;

