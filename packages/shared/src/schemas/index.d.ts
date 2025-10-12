import { z } from 'zod';
import { UserRole, BookingStatus, ItemCategory, VehicleType } from '../types';
export declare const userSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    role: z.ZodNativeEnum<typeof UserRole>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    name?: string;
    email?: string;
    id?: string;
    role?: UserRole;
    createdAt?: Date;
    updatedAt?: Date;
}, {
    name?: string;
    email?: string;
    id?: string;
    role?: UserRole;
    createdAt?: Date;
    updatedAt?: Date;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
    password?: string;
}, {
    email?: string;
    password?: string;
}>;
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodOptional<z.ZodNativeEnum<typeof UserRole>>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    email?: string;
    role?: UserRole;
    password?: string;
}, {
    name?: string;
    email?: string;
    role?: UserRole;
    password?: string;
}>;
export declare const addressSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    street: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    zipCode: z.ZodString;
    country: z.ZodString;
    latitude: z.ZodOptional<z.ZodNumber>;
    longitude: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    city?: string;
    id?: string;
    street?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
}, {
    city?: string;
    id?: string;
    street?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
}>;
export declare const dimensionsSchema: z.ZodObject<{
    length: z.ZodNumber;
    width: z.ZodNumber;
    height: z.ZodNumber;
    unit: z.ZodEnum<["cm", "in"]>;
}, "strip", z.ZodTypeAny, {
    length?: number;
    width?: number;
    height?: number;
    unit?: "cm" | "in";
}, {
    length?: number;
    width?: number;
    height?: number;
    unit?: "cm" | "in";
}>;
export declare const bookingItemSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    quantity: z.ZodNumber;
    weight: z.ZodOptional<z.ZodNumber>;
    dimensions: z.ZodOptional<z.ZodObject<{
        length: z.ZodNumber;
        width: z.ZodNumber;
        height: z.ZodNumber;
        unit: z.ZodEnum<["cm", "in"]>;
    }, "strip", z.ZodTypeAny, {
        length?: number;
        width?: number;
        height?: number;
        unit?: "cm" | "in";
    }, {
        length?: number;
        width?: number;
        height?: number;
        unit?: "cm" | "in";
    }>>;
    category: z.ZodNativeEnum<typeof ItemCategory>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    id?: string;
    category?: ItemCategory;
    quantity?: number;
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
        unit?: "cm" | "in";
    };
    description?: string;
}, {
    name?: string;
    id?: string;
    category?: ItemCategory;
    quantity?: number;
    weight?: number;
    dimensions?: {
        length?: number;
        width?: number;
        height?: number;
        unit?: "cm" | "in";
    };
    description?: string;
}>;
export declare const individualItemSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    category: z.ZodString;
    image: z.ZodString;
    weight: z.ZodNumber;
    volume: z.ZodNumber;
    price: z.ZodNumber;
    workersRequired: z.ZodNumber;
    dismantlingRequired: z.ZodEnum<["Yes", "No"]>;
    fragilityLevel: z.ZodEnum<["High", "Medium", "Low"]>;
    keywords: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    name?: string;
    id?: string;
    category?: string;
    weight?: number;
    image?: string;
    volume?: number;
    price?: number;
    workersRequired?: number;
    dismantlingRequired?: "Yes" | "No";
    fragilityLevel?: "High" | "Medium" | "Low";
    keywords?: string[];
}, {
    name?: string;
    id?: string;
    category?: string;
    weight?: number;
    image?: string;
    volume?: number;
    price?: number;
    workersRequired?: number;
    dismantlingRequired?: "Yes" | "No";
    fragilityLevel?: "High" | "Medium" | "Low";
    keywords?: string[];
}>;
export declare const createBookingSchema: z.ZodObject<{
    pickupAddress: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zipCode: z.ZodString;
        country: z.ZodString;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    }, {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    }>;
    deliveryAddress: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zipCode: z.ZodString;
        country: z.ZodString;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    }, {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    }>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        quantity: z.ZodNumber;
        weight: z.ZodOptional<z.ZodNumber>;
        dimensions: z.ZodOptional<z.ZodObject<{
            length: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
            unit: z.ZodEnum<["cm", "in"]>;
        }, "strip", z.ZodTypeAny, {
            length?: number;
            width?: number;
            height?: number;
            unit?: "cm" | "in";
        }, {
            length?: number;
            width?: number;
            height?: number;
            unit?: "cm" | "in";
        }>>;
        category: z.ZodNativeEnum<typeof ItemCategory>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        id?: string;
        category?: ItemCategory;
        quantity?: number;
        weight?: number;
        dimensions?: {
            length?: number;
            width?: number;
            height?: number;
            unit?: "cm" | "in";
        };
        description?: string;
    }, {
        name?: string;
        id?: string;
        category?: ItemCategory;
        quantity?: number;
        weight?: number;
        dimensions?: {
            length?: number;
            width?: number;
            height?: number;
            unit?: "cm" | "in";
        };
        description?: string;
    }>, "many">;
    scheduledAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    pickupAddress?: {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };
    items?: {
        name?: string;
        id?: string;
        category?: ItemCategory;
        quantity?: number;
        weight?: number;
        dimensions?: {
            length?: number;
            width?: number;
            height?: number;
            unit?: "cm" | "in";
        };
        description?: string;
    }[];
    deliveryAddress?: {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };
    scheduledAt?: Date;
}, {
    pickupAddress?: {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };
    items?: {
        name?: string;
        id?: string;
        category?: ItemCategory;
        quantity?: number;
        weight?: number;
        dimensions?: {
            length?: number;
            width?: number;
            height?: number;
            unit?: "cm" | "in";
        };
        description?: string;
    }[];
    deliveryAddress?: {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };
    scheduledAt?: Date;
}>;
export declare const bookingSchema: z.ZodObject<{
    id: z.ZodString;
    customerId: z.ZodString;
    driverId: z.ZodOptional<z.ZodString>;
    status: z.ZodNativeEnum<typeof BookingStatus>;
    pickupAddress: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zipCode: z.ZodString;
        country: z.ZodString;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    }, {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    }>;
    deliveryAddress: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zipCode: z.ZodString;
        country: z.ZodString;
        latitude: z.ZodOptional<z.ZodNumber>;
        longitude: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    }, {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    }>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        quantity: z.ZodNumber;
        weight: z.ZodOptional<z.ZodNumber>;
        dimensions: z.ZodOptional<z.ZodObject<{
            length: z.ZodNumber;
            width: z.ZodNumber;
            height: z.ZodNumber;
            unit: z.ZodEnum<["cm", "in"]>;
        }, "strip", z.ZodTypeAny, {
            length?: number;
            width?: number;
            height?: number;
            unit?: "cm" | "in";
        }, {
            length?: number;
            width?: number;
            height?: number;
            unit?: "cm" | "in";
        }>>;
        category: z.ZodNativeEnum<typeof ItemCategory>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        id?: string;
        category?: ItemCategory;
        quantity?: number;
        weight?: number;
        dimensions?: {
            length?: number;
            width?: number;
            height?: number;
            unit?: "cm" | "in";
        };
        description?: string;
    }, {
        name?: string;
        id?: string;
        category?: ItemCategory;
        quantity?: number;
        weight?: number;
        dimensions?: {
            length?: number;
            width?: number;
            height?: number;
            unit?: "cm" | "in";
        };
        description?: string;
    }>, "many">;
    scheduledAt: z.ZodDate;
    estimatedDuration: z.ZodNumber;
    totalPrice: z.ZodNumber;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status?: BookingStatus;
    id?: string;
    pickupAddress?: {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };
    items?: {
        name?: string;
        id?: string;
        category?: ItemCategory;
        quantity?: number;
        weight?: number;
        dimensions?: {
            length?: number;
            width?: number;
            height?: number;
            unit?: "cm" | "in";
        };
        description?: string;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
    deliveryAddress?: {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };
    scheduledAt?: Date;
    customerId?: string;
    driverId?: string;
    estimatedDuration?: number;
    totalPrice?: number;
}, {
    status?: BookingStatus;
    id?: string;
    pickupAddress?: {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };
    items?: {
        name?: string;
        id?: string;
        category?: ItemCategory;
        quantity?: number;
        weight?: number;
        dimensions?: {
            length?: number;
            width?: number;
            height?: number;
            unit?: "cm" | "in";
        };
        description?: string;
    }[];
    createdAt?: Date;
    updatedAt?: Date;
    deliveryAddress?: {
        city?: string;
        id?: string;
        street?: string;
        state?: string;
        zipCode?: string;
        country?: string;
        latitude?: number;
        longitude?: number;
    };
    scheduledAt?: Date;
    customerId?: string;
    driverId?: string;
    estimatedDuration?: number;
    totalPrice?: number;
}>;
export declare const locationSchema: z.ZodObject<{
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    latitude?: number;
    longitude?: number;
    timestamp?: Date;
}, {
    latitude?: number;
    longitude?: number;
    timestamp?: Date;
}>;
export declare const driverSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    licenseNumber: z.ZodString;
    vehicleType: z.ZodNativeEnum<typeof VehicleType>;
    isAvailable: z.ZodBoolean;
    currentLocation: z.ZodOptional<z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
        timestamp: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        latitude?: number;
        longitude?: number;
        timestamp?: Date;
    }, {
        latitude?: number;
        longitude?: number;
        timestamp?: Date;
    }>>;
    rating: z.ZodNumber;
    totalDeliveries: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id?: string;
    userId?: string;
    licenseNumber?: string;
    vehicleType?: VehicleType;
    isAvailable?: boolean;
    currentLocation?: {
        latitude?: number;
        longitude?: number;
        timestamp?: Date;
    };
    rating?: number;
    totalDeliveries?: number;
}, {
    id?: string;
    userId?: string;
    licenseNumber?: string;
    vehicleType?: VehicleType;
    isAvailable?: boolean;
    currentLocation?: {
        latitude?: number;
        longitude?: number;
        timestamp?: Date;
    };
    rating?: number;
    totalDeliveries?: number;
}>;
export declare const pricingQuoteSchema: z.ZodObject<{
    basePrice: z.ZodNumber;
    distancePrice: z.ZodNumber;
    itemsPrice: z.ZodNumber;
    timePrice: z.ZodNumber;
    totalPrice: z.ZodNumber;
    estimatedDuration: z.ZodNumber;
    currency: z.ZodString;
}, "strip", z.ZodTypeAny, {
    estimatedDuration?: number;
    totalPrice?: number;
    basePrice?: number;
    distancePrice?: number;
    itemsPrice?: number;
    timePrice?: number;
    currency?: string;
}, {
    estimatedDuration?: number;
    totalPrice?: number;
    basePrice?: number;
    distancePrice?: number;
    itemsPrice?: number;
    timePrice?: number;
    currency?: string;
}>;
export declare const apiResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    success?: boolean;
    data?: any;
    error?: string;
}, {
    message?: string;
    success?: boolean;
    data?: any;
    error?: string;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    limit: z.ZodNumber;
    total: z.ZodNumber;
    totalPages: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
}, {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
}>;
export declare const paginatedResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
} & {
    data: z.ZodArray<z.ZodAny, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    }, {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    }>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    success?: boolean;
    data?: any[];
    error?: string;
    pagination?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}, {
    message?: string;
    success?: boolean;
    data?: any[];
    error?: string;
    pagination?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type BookingItemInput = z.infer<typeof bookingItemSchema>;
export type IndividualItemInput = z.infer<typeof individualItemSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type LocationInput = z.infer<typeof locationSchema>;
export type PricingQuoteInput = z.infer<typeof pricingQuoteSchema>;
//# sourceMappingURL=index.d.ts.map