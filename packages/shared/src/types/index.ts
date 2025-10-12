// Core domain types
import { z } from 'zod';

// ================================
// SHARED VALIDATION SCHEMAS
// ================================

// Common validation patterns
export const UK_POSTCODE_REGEX = /^[A-Z]{1,2}[0-9][A-Z0-9]? ?[0-9][A-Z]{2}$/i;
export const UK_PHONE_REGEX = /^(\+44|0)[1-9]\d{8,9}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Address validation schema
export const addressSchema = z.object({
  address: z.string().min(1, 'Address is required').optional(),
  line1: z.string().min(1, 'Address line 1 is required').optional(),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().regex(UK_POSTCODE_REGEX, 'Invalid UK postcode'),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
}).refine(
  (data) => data.address || data.line1,
  {
    message: 'Either address or line1 must be provided',
    path: ['address'],
  }
);

// Customer validation schema
export const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().regex(EMAIL_REGEX, 'Invalid email format'),
  phone: z.string().regex(UK_PHONE_REGEX, 'Invalid UK phone number'),
});

// Property details schema
export const propertyDetailsSchema = z.object({
  propertyType: z.enum(['HOUSE', 'FLAT', 'OFFICE', 'COMMERCIAL']),
  floor: z.number().int().min(0).max(50).optional(),
  hasLift: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  accessNotes: z.string().max(500).optional(),
});

// Booking item schema
export const bookingItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0),
  }).optional(),
  fragile: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});

// Date and time validation
export const dateStringSchema = z.string().refine(
  (date) => {
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  },
  { message: 'Date must be today or in the future' }
);

export const timeStringSchema = z.string().regex(
  /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  'Invalid time format (HH:MM)'
);

// Currency validation
export const currencyAmountSchema = z.number()
  .min(5, 'Minimum amount is £5.00')
  .max(10000, 'Maximum amount is £10,000.00')
  .refine(
    (amount) => Number.isFinite(amount) && amount > 0,
    { message: 'Amount must be a positive number' }
  );

// Create booking validation schema
export const createBookingSchema = z.object({
  customer: customerSchema,
  pickupAddress: addressSchema,
  dropoffAddress: addressSchema,
  pickupProperty: propertyDetailsSchema.optional(),
  dropoffProperty: propertyDetailsSchema.optional(),
  items: z.array(bookingItemSchema).min(1, 'At least one item is required'),
  date: dateStringSchema.optional(),
  timeSlot: timeStringSchema.optional(),
  calculatedTotal: currencyAmountSchema,
  serviceType: z.string().optional(),
  specialInstructions: z.string().max(1000).optional(),
});

// Validation helper types
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type BookingItemInput = z.infer<typeof bookingItemSchema>;

// Export error types and utilities
export * from './errors';

// Core domain types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

export interface Booking {
  id: string;
  customerId: string;
  driverId?: string;
  status: BookingStatus;
  pickupAddress: Address;
  deliveryAddress: Address;
  items: BookingItem[];
  scheduledAt: Date;
  estimatedDuration: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum BookingStatus {
  DRAFT = 'DRAFT',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum BookingStep {
  STEP_1_WHERE_AND_WHAT = 'STEP_1_WHERE_AND_WHAT',
  STEP_2_CUSTOMER_PAYMENT = 'STEP_2_CUSTOMER_PAYMENT',
}

export enum JobStep {
  NAVIGATE_TO_PICKUP = 'navigate_to_pickup',
  ARRIVED_AT_PICKUP = 'arrived_at_pickup',
  LOADING_STARTED = 'loading_started',
  LOADING_COMPLETED = 'loading_completed',
  EN_ROUTE_TO_DROPOFF = 'en_route_to_dropoff',
  ARRIVED_AT_DROPOFF = 'arrived_at_dropoff',
  UNLOADING_STARTED = 'unloading_started',
  UNLOADING_COMPLETED = 'unloading_completed',
  JOB_COMPLETED = 'job_completed',
  CUSTOMER_SIGNATURE = 'customer_signature',
  DAMAGE_NOTES = 'damage_notes',
  ITEM_COUNT_VERIFICATION = 'item_count_verification',
}

export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface BookingItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  weight?: number;
  dimensions?: Dimensions;
  category: ItemCategory;
}

// Individual item type for booking-luxury component (666+ items)
export interface IndividualItem {
  id: string;
  name: string;
  category: string;
  image: string;
  weight: number;
  volume: number;
  price: number;
  workersRequired: number;
  dismantlingRequired: 'Yes' | 'No';
  fragilityLevel: 'High' | 'Medium' | 'Low';
  keywords: string[];
}

export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in';
}

export enum ItemCategory {
  // Legacy categories
  FURNITURE = 'FURNITURE',
  APPLIANCES = 'APPLIANCES',
  BOXES = 'BOXES',
  FRAGILE = 'FRAGILE',
  MISC = 'MISC',
  OTHER = 'OTHER',

  // New comprehensive categories for booking-luxury (666+ items)
  ANTIQUES_COLLECTIBLES = 'Antiques & Collectibles',
  BAG_LUGGAGE_BOX = 'Bags, Luggage & Boxes',
  BATHROOM_FURNITURE = 'Bathroom Furniture',
  BEDROOM = 'Bedroom',
  CARPETS_RUGS = 'Carpets & Rugs',
  CHILDREN_BABY_ITEMS = 'Children & Baby Items',
  DINING_ROOM_FURNITURE = 'Dining Room Furniture',
  ELECTRICAL_ELECTRONIC = 'Electrical & Electronic',
  GARDEN_OUTDOOR = 'Garden & Outdoor',
  GYM_FITNESS_EQUIPMENT = 'Gym & Fitness Equipment',
  KITCHEN_APPLIANCES = 'Kitchen Appliances',
  LIVING_ROOM_FURNITURE = 'Living Room Furniture',
  MISCELLANEOUS_HOUSEHOLD = 'Miscellaneous Household',
  MUSICAL_INSTRUMENTS = 'Musical Instruments',
  OFFICE_FURNITURE = 'Office Furniture',
  PET_ITEMS = 'Pet Items',
  SPECIAL_AWKWARD_ITEMS = 'Special & Awkward Items',
  WARDROBES_CLOSET = 'Wardrobes & Closets',
}

export interface Driver {
  id: string;
  userId: string;
  licenseNumber: string;
  vehicleType: VehicleType;
  isAvailable: boolean;
  currentLocation?: Location;
  rating: number;
  totalDeliveries: number;
}

export enum VehicleType {
  VAN = 'VAN',
  TRUCK = 'TRUCK',
  PICKUP = 'PICKUP',
}

export interface Location {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export interface PricingQuote {
  basePrice: number;
  distancePrice: number;
  itemsPrice: number;
  timePrice: number;
  totalPrice: number;
  estimatedDuration: number;
  currency: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
  role?: UserRole;
}

