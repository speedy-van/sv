import { z } from 'zod';
export declare const UK_POSTCODE_REGEX: RegExp;
export declare const UK_PHONE_REGEX: RegExp;
export declare const EMAIL_REGEX: RegExp;
export declare const addressSchema: z.ZodEffects<z.ZodObject<{
    address: z.ZodOptional<z.ZodString>;
    line1: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    postcode: z.ZodString;
    coordinates: z.ZodOptional<z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat?: number;
        lng?: number;
    }, {
        lat?: number;
        lng?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    address?: string;
    line1?: string;
    city?: string;
    postcode?: string;
    coordinates?: {
        lat?: number;
        lng?: number;
    };
}, {
    address?: string;
    line1?: string;
    city?: string;
    postcode?: string;
    coordinates?: {
        lat?: number;
        lng?: number;
    };
}>, {
    address?: string;
    line1?: string;
    city?: string;
    postcode?: string;
    coordinates?: {
        lat?: number;
        lng?: number;
    };
}, {
    address?: string;
    line1?: string;
    city?: string;
    postcode?: string;
    coordinates?: {
        lat?: number;
        lng?: number;
    };
}>;
export declare const customerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name?: string;
    email?: string;
    phone?: string;
}, {
    name?: string;
    email?: string;
    phone?: string;
}>;
export declare const propertyDetailsSchema: z.ZodObject<{
    propertyType: z.ZodEnum<["HOUSE", "FLAT", "OFFICE", "COMMERCIAL"]>;
    floor: z.ZodOptional<z.ZodNumber>;
    hasLift: z.ZodOptional<z.ZodBoolean>;
    hasParking: z.ZodOptional<z.ZodBoolean>;
    accessNotes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    propertyType?: "HOUSE" | "FLAT" | "OFFICE" | "COMMERCIAL";
    floor?: number;
    hasLift?: boolean;
    hasParking?: boolean;
    accessNotes?: string;
}, {
    propertyType?: "HOUSE" | "FLAT" | "OFFICE" | "COMMERCIAL";
    floor?: number;
    hasLift?: boolean;
    hasParking?: boolean;
    accessNotes?: string;
}>;
export declare const bookingItemSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    category: z.ZodString;
    quantity: z.ZodNumber;
    weight: z.ZodOptional<z.ZodNumber>;
    dimensions: z.ZodOptional<z.ZodObject<{
        length: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        length?: number;
        width?: number;
        height?: number;
    }, {
        length?: number;
        width?: number;
        height?: number;
    }>>;
    fragile: z.ZodDefault<z.ZodBoolean>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    id?: string;
    category?: string;
    quantity?: number;
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
    fragile?: boolean;
    notes?: string;
}, {
    name?: string;
    id?: string;
    category?: string;
    quantity?: number;
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
    };
    fragile?: boolean;
    notes?: string;
}>;
export declare const dateStringSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const timeStringSchema: z.ZodString;
export declare const currencyAmountSchema: z.ZodEffects<z.ZodNumber, number, number>;
export declare const createBookingSchema: z.ZodObject<{
    customer: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodString;
        phone: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        email?: string;
        phone?: string;
    }, {
        name?: string;
        email?: string;
        phone?: string;
    }>;
    pickupAddress: z.ZodEffects<z.ZodObject<{
        address: z.ZodOptional<z.ZodString>;
        line1: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        postcode: z.ZodString;
        coordinates: z.ZodOptional<z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat?: number;
            lng?: number;
        }, {
            lat?: number;
            lng?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        address?: string;
        line1?: string;
        city?: string;
        postcode?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }, {
        address?: string;
        line1?: string;
        city?: string;
        postcode?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }>, {
        address?: string;
        line1?: string;
        city?: string;
        postcode?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }, {
        address?: string;
        line1?: string;
        city?: string;
        postcode?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }>;
    dropoffAddress: z.ZodEffects<z.ZodObject<{
        address: z.ZodOptional<z.ZodString>;
        line1: z.ZodOptional<z.ZodString>;
        city: z.ZodString;
        postcode: z.ZodString;
        coordinates: z.ZodOptional<z.ZodObject<{
            lat: z.ZodNumber;
            lng: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            lat?: number;
            lng?: number;
        }, {
            lat?: number;
            lng?: number;
        }>>;
    }, "strip", z.ZodTypeAny, {
        address?: string;
        line1?: string;
        city?: string;
        postcode?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }, {
        address?: string;
        line1?: string;
        city?: string;
        postcode?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }>, {
        address?: string;
        line1?: string;
        city?: string;
        postcode?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }, {
        address?: string;
        line1?: string;
        city?: string;
        postcode?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    }>;
    pickupProperty: z.ZodOptional<z.ZodObject<{
        propertyType: z.ZodEnum<["HOUSE", "FLAT", "OFFICE", "COMMERCIAL"]>;
        floor: z.ZodOptional<z.ZodNumber>;
        hasLift: z.ZodOptional<z.ZodBoolean>;
        hasParking: z.ZodOptional<z.ZodBoolean>;
        accessNotes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        propertyType?: "HOUSE" | "FLAT" | "OFFICE" | "COMMERCIAL";
        floor?: number;
        hasLift?: boolean;
        hasParking?: boolean;
        accessNotes?: string;
    }, {
        propertyType?: "HOUSE" | "FLAT" | "OFFICE" | "COMMERCIAL";
        floor?: number;
        hasLift?: boolean;
        hasParking?: boolean;
        accessNotes?: string;
    }>>;
    dropoffProperty: z.ZodOptional<z.ZodObject<{
        propertyType: z.ZodEnum<["HOUSE", "FLAT", "OFFICE", "COMMERCIAL"]>;
        floor: z.ZodOptional<z.ZodNumber>;
        hasLift: z.ZodOptional<z.ZodBoolean>;
        hasParking: z.ZodOptional<z.ZodBoolean>;
        accessNotes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        propertyType?: "HOUSE" | "FLAT" | "OFFICE" | "COMMERCIAL";
        floor?: number;
        hasLift?: boolean;
        hasParking?: boolean;
        accessNotes?: string;
    }, {
        propertyType?: "HOUSE" | "FLAT" | "OFFICE" | "COMMERCIAL";
        floor?: number;
        hasLift?: boolean;
        hasParking?: boolean;
        accessNotes?: string;
    }>>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        category: z.ZodString;
        quantity: z.ZodNumber;
        weight: z.ZodOptional<z.ZodNumber>;
        dimensions: z.ZodOptional<z.ZodObject<{
            length: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            length?: number;
            width?: number;
            height?: number;
        }, {
            length?: number;
            width?: number;
            height?: number;
        }>>;
        fragile: z.ZodDefault<z.ZodBoolean>;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        id?: string;
        category?: string;
        quantity?: number;
        weight?: number;
        dimensions?: {
            length?: number;
            width?: number;
            height?: number;
        };
        fragile?: boolean;
        notes?: string;
    }, {
        name?: string;
        id?: string;
        category?: string;
        quantity?: number;
        weight?: number;
        dimensions?: {
            length?: number;
            width?: number;
            height?: number;
        };
        fragile?: boolean;
        notes?: string;
    }>, "many">;
    date: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    timeSlot: z.ZodOptional<z.ZodString>;
    calculatedTotal: z.ZodEffects<z.ZodNumber, number, number>;
    serviceType: z.ZodOptional<z.ZodString>;
    specialInstructions: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    date?: string;
    customer?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    pickupAddress?: {
        address?: string;
        line1?: string;
        city?: string;
        postcode?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };
    dropoffAddress?: {
        address?: string;
        line1?: string;
        city?: string;
        postcode?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };
    pickupProperty?: {
        propertyType?: "HOUSE" | "FLAT" | "OFFICE" | "COMMERCIAL";
        floor?: number;
        hasLift?: boolean;
        hasParking?: boolean;
        accessNotes?: string;
    };
    dropoffProperty?: {
        propertyType?: "HOUSE" | "FLAT" | "OFFICE" | "COMMERCIAL";
        floor?: number;
        hasLift?: boolean;
        hasParking?: boolean;
        accessNotes?: string;
    };
    items?: {
        name?: string;
        id?: string;
        category?: string;
        quantity?: number;
        weight?: number;
        dimensions?: {
            length?: number;
            width?: number;
            height?: number;
        };
        fragile?: boolean;
        notes?: string;
    }[];
    timeSlot?: string;
    calculatedTotal?: number;
    serviceType?: string;
    specialInstructions?: string;
}, {
    date?: string;
    customer?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    pickupAddress?: {
        address?: string;
        line1?: string;
        city?: string;
        postcode?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };
    dropoffAddress?: {
        address?: string;
        line1?: string;
        city?: string;
        postcode?: string;
        coordinates?: {
            lat?: number;
            lng?: number;
        };
    };
    pickupProperty?: {
        propertyType?: "HOUSE" | "FLAT" | "OFFICE" | "COMMERCIAL";
        floor?: number;
        hasLift?: boolean;
        hasParking?: boolean;
        accessNotes?: string;
    };
    dropoffProperty?: {
        propertyType?: "HOUSE" | "FLAT" | "OFFICE" | "COMMERCIAL";
        floor?: number;
        hasLift?: boolean;
        hasParking?: boolean;
        accessNotes?: string;
    };
    items?: {
        name?: string;
        id?: string;
        category?: string;
        quantity?: number;
        weight?: number;
        dimensions?: {
            length?: number;
            width?: number;
            height?: number;
        };
        fragile?: boolean;
        notes?: string;
    }[];
    timeSlot?: string;
    calculatedTotal?: number;
    serviceType?: string;
    specialInstructions?: string;
}>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type BookingItemInput = z.infer<typeof bookingItemSchema>;
export * from './errors';
export interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum UserRole {
    CUSTOMER = "CUSTOMER",
    DRIVER = "DRIVER",
    ADMIN = "ADMIN"
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
export declare enum BookingStatus {
    DRAFT = "DRAFT",
    PENDING_PAYMENT = "PENDING_PAYMENT",
    CONFIRMED = "CONFIRMED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum BookingStep {
    STEP_1_WHERE_AND_WHAT = "STEP_1_WHERE_AND_WHAT",
    STEP_2_CUSTOMER_PAYMENT = "STEP_2_CUSTOMER_PAYMENT"
}
export declare enum JobStep {
    NAVIGATE_TO_PICKUP = "navigate_to_pickup",
    ARRIVED_AT_PICKUP = "arrived_at_pickup",
    LOADING_STARTED = "loading_started",
    LOADING_COMPLETED = "loading_completed",
    EN_ROUTE_TO_DROPOFF = "en_route_to_dropoff",
    ARRIVED_AT_DROPOFF = "arrived_at_dropoff",
    UNLOADING_STARTED = "unloading_started",
    UNLOADING_COMPLETED = "unloading_completed",
    JOB_COMPLETED = "job_completed",
    CUSTOMER_SIGNATURE = "customer_signature",
    DAMAGE_NOTES = "damage_notes",
    ITEM_COUNT_VERIFICATION = "item_count_verification"
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
export declare enum ItemCategory {
    FURNITURE = "FURNITURE",
    APPLIANCES = "APPLIANCES",
    BOXES = "BOXES",
    FRAGILE = "FRAGILE",
    MISC = "MISC",
    OTHER = "OTHER",
    ANTIQUES_COLLECTIBLES = "Antiques & Collectibles",
    BAG_LUGGAGE_BOX = "Bags, Luggage & Boxes",
    BATHROOM_FURNITURE = "Bathroom Furniture",
    BEDROOM = "Bedroom",
    CARPETS_RUGS = "Carpets & Rugs",
    CHILDREN_BABY_ITEMS = "Children & Baby Items",
    DINING_ROOM_FURNITURE = "Dining Room Furniture",
    ELECTRICAL_ELECTRONIC = "Electrical & Electronic",
    GARDEN_OUTDOOR = "Garden & Outdoor",
    GYM_FITNESS_EQUIPMENT = "Gym & Fitness Equipment",
    KITCHEN_APPLIANCES = "Kitchen Appliances",
    LIVING_ROOM_FURNITURE = "Living Room Furniture",
    MISCELLANEOUS_HOUSEHOLD = "Miscellaneous Household",
    MUSICAL_INSTRUMENTS = "Musical Instruments",
    OFFICE_FURNITURE = "Office Furniture",
    PET_ITEMS = "Pet Items",
    SPECIAL_AWKWARD_ITEMS = "Special & Awkward Items",
    WARDROBES_CLOSET = "Wardrobes & Closets"
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
export declare enum VehicleType {
    VAN = "VAN",
    TRUCK = "TRUCK",
    PICKUP = "PICKUP"
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
//# sourceMappingURL=index.d.ts.map