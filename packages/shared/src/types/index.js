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
}).refine((data) => data.address || data.line1, {
    message: 'Either address or line1 must be provided',
    path: ['address'],
});
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
export const dateStringSchema = z.string().refine((date) => {
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate >= today;
}, { message: 'Date must be today or in the future' });
export const timeStringSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)');
// Currency validation
export const currencyAmountSchema = z.number()
    .min(5, 'Minimum amount is £5.00')
    .max(10000, 'Maximum amount is £10,000.00')
    .refine((amount) => Number.isFinite(amount) && amount > 0, { message: 'Amount must be a positive number' });
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
// Export error types and utilities
export * from './errors';
export var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "CUSTOMER";
    UserRole["DRIVER"] = "DRIVER";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (UserRole = {}));
export var BookingStatus;
(function (BookingStatus) {
    BookingStatus["DRAFT"] = "DRAFT";
    BookingStatus["PENDING_PAYMENT"] = "PENDING_PAYMENT";
    BookingStatus["CONFIRMED"] = "CONFIRMED";
    BookingStatus["IN_PROGRESS"] = "IN_PROGRESS";
    BookingStatus["COMPLETED"] = "COMPLETED";
    BookingStatus["CANCELLED"] = "CANCELLED";
})(BookingStatus || (BookingStatus = {}));
export var BookingStep;
(function (BookingStep) {
    BookingStep["STEP_1_WHERE_AND_WHAT"] = "STEP_1_WHERE_AND_WHAT";
    BookingStep["STEP_2_CUSTOMER_PAYMENT"] = "STEP_2_CUSTOMER_PAYMENT";
})(BookingStep || (BookingStep = {}));
export var JobStep;
(function (JobStep) {
    JobStep["NAVIGATE_TO_PICKUP"] = "navigate_to_pickup";
    JobStep["ARRIVED_AT_PICKUP"] = "arrived_at_pickup";
    JobStep["LOADING_STARTED"] = "loading_started";
    JobStep["LOADING_COMPLETED"] = "loading_completed";
    JobStep["EN_ROUTE_TO_DROPOFF"] = "en_route_to_dropoff";
    JobStep["ARRIVED_AT_DROPOFF"] = "arrived_at_dropoff";
    JobStep["UNLOADING_STARTED"] = "unloading_started";
    JobStep["UNLOADING_COMPLETED"] = "unloading_completed";
    JobStep["JOB_COMPLETED"] = "job_completed";
    JobStep["CUSTOMER_SIGNATURE"] = "customer_signature";
    JobStep["DAMAGE_NOTES"] = "damage_notes";
    JobStep["ITEM_COUNT_VERIFICATION"] = "item_count_verification";
})(JobStep || (JobStep = {}));
export var ItemCategory;
(function (ItemCategory) {
    // Legacy categories
    ItemCategory["FURNITURE"] = "FURNITURE";
    ItemCategory["APPLIANCES"] = "APPLIANCES";
    ItemCategory["BOXES"] = "BOXES";
    ItemCategory["FRAGILE"] = "FRAGILE";
    ItemCategory["MISC"] = "MISC";
    ItemCategory["OTHER"] = "OTHER";
    // New comprehensive categories for booking-luxury (666+ items)
    ItemCategory["ANTIQUES_COLLECTIBLES"] = "Antiques & Collectibles";
    ItemCategory["BAG_LUGGAGE_BOX"] = "Bags, Luggage & Boxes";
    ItemCategory["BATHROOM_FURNITURE"] = "Bathroom Furniture";
    ItemCategory["BEDROOM"] = "Bedroom";
    ItemCategory["CARPETS_RUGS"] = "Carpets & Rugs";
    ItemCategory["CHILDREN_BABY_ITEMS"] = "Children & Baby Items";
    ItemCategory["DINING_ROOM_FURNITURE"] = "Dining Room Furniture";
    ItemCategory["ELECTRICAL_ELECTRONIC"] = "Electrical & Electronic";
    ItemCategory["GARDEN_OUTDOOR"] = "Garden & Outdoor";
    ItemCategory["GYM_FITNESS_EQUIPMENT"] = "Gym & Fitness Equipment";
    ItemCategory["KITCHEN_APPLIANCES"] = "Kitchen Appliances";
    ItemCategory["LIVING_ROOM_FURNITURE"] = "Living Room Furniture";
    ItemCategory["MISCELLANEOUS_HOUSEHOLD"] = "Miscellaneous Household";
    ItemCategory["MUSICAL_INSTRUMENTS"] = "Musical Instruments";
    ItemCategory["OFFICE_FURNITURE"] = "Office Furniture";
    ItemCategory["PET_ITEMS"] = "Pet Items";
    ItemCategory["SPECIAL_AWKWARD_ITEMS"] = "Special & Awkward Items";
    ItemCategory["WARDROBES_CLOSET"] = "Wardrobes & Closets";
})(ItemCategory || (ItemCategory = {}));
export var VehicleType;
(function (VehicleType) {
    VehicleType["VAN"] = "VAN";
    VehicleType["TRUCK"] = "TRUCK";
    VehicleType["PICKUP"] = "PICKUP";
})(VehicleType || (VehicleType = {}));
//# sourceMappingURL=index.js.map