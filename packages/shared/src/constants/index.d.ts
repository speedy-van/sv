export declare const API_ROUTES: {
    readonly AUTH: {
        readonly LOGIN: "/api/auth/login";
        readonly REGISTER: "/api/auth/register";
        readonly LOGOUT: "/api/auth/logout";
        readonly REFRESH: "/api/auth/refresh";
    };
    readonly BOOKINGS: {
        readonly CREATE: "/api/booking-luxury";
        readonly LIST: "/api/booking-luxury";
        readonly GET: (id: string) => string;
        readonly UPDATE: (id: string) => string;
        readonly CANCEL: (id: string) => string;
        readonly TRACK: (id: string) => string;
    };
    readonly PRICING: {
        readonly QUOTE: "/api/pricing/quote";
        readonly CATALOG: "/api/pricing/catalog";
    };
    readonly DRIVERS: {
        readonly LIST: "/api/drivers";
        readonly GET: (id: string) => string;
        readonly LOCATION: (id: string) => string;
        readonly AVAILABILITY: (id: string) => string;
    };
    readonly ADMIN: {
        readonly DASHBOARD: "/api/admin/dashboard";
        readonly USERS: "/api/admin/users";
        readonly BOOKINGS: "/api/admin/booking-luxury";
        readonly DRIVERS: "/api/admin/drivers";
        readonly ANALYTICS: "/api/admin/analytics";
    };
};
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
};
export declare const VALIDATION: {
    readonly PASSWORD_MIN_LENGTH: 8;
    readonly NAME_MIN_LENGTH: 1;
    readonly DESCRIPTION_MAX_LENGTH: 500;
    readonly ITEM_MAX_QUANTITY: 100;
    readonly BOOKING_MAX_ITEMS: 50;
};
export declare const BUSINESS: {
    readonly DELIVERY_RADIUS_KM: 50;
    readonly MIN_BOOKING_ADVANCE_HOURS: 2;
    readonly MAX_BOOKING_ADVANCE_DAYS: 30;
    readonly DEFAULT_CURRENCY: "USD";
    readonly DRIVER_RATING_SCALE: 5;
};
export declare const VEHICLE_SPECS: {
    readonly VAN: {
        readonly maxWeight: 1000;
        readonly maxVolume: 10;
        readonly basePrice: 50;
    };
    readonly TRUCK: {
        readonly maxWeight: 3000;
        readonly maxVolume: 25;
        readonly basePrice: 100;
    };
    readonly PICKUP: {
        readonly maxWeight: 500;
        readonly maxVolume: 5;
        readonly basePrice: 30;
    };
};
export declare const STATUS_MESSAGES: {
    readonly BOOKING: {
        readonly PENDING: "Booking is pending confirmation";
        readonly CONFIRMED: "Booking has been confirmed";
        readonly IN_PROGRESS: "Delivery is in progress";
        readonly COMPLETED: "Delivery has been completed";
        readonly CANCELLED: "Booking has been cancelled";
    };
    readonly DRIVER: {
        readonly AVAILABLE: "Driver is available for bookings";
        readonly BUSY: "Driver is currently on a delivery";
        readonly OFFLINE: "Driver is offline";
    };
};
export declare const ERROR_MESSAGES: {
    readonly AUTH: {
        readonly INVALID_CREDENTIALS: "Invalid email or password";
        readonly USER_NOT_FOUND: "User not found";
        readonly EMAIL_ALREADY_EXISTS: "Email already exists";
        readonly UNAUTHORIZED: "Unauthorized access";
        readonly TOKEN_EXPIRED: "Token has expired";
    };
    readonly BOOKING: {
        readonly NOT_FOUND: "Booking not found";
        readonly CANNOT_CANCEL: "Cannot cancel booking at this stage";
        readonly INVALID_STATUS: "Invalid booking status";
        readonly NO_AVAILABLE_DRIVERS: "No available drivers in your area";
    };
    readonly VALIDATION: {
        readonly REQUIRED_FIELD: "This field is required";
        readonly INVALID_EMAIL: "Invalid email address";
        readonly INVALID_PHONE: "Invalid phone number";
        readonly INVALID_DATE: "Invalid date";
        readonly INVALID_ADDRESS: "Invalid address";
    };
    readonly GENERAL: {
        readonly INTERNAL_ERROR: "Internal server error";
        readonly NOT_FOUND: "Resource not found";
        readonly BAD_REQUEST: "Bad request";
        readonly FORBIDDEN: "Access forbidden";
    };
};
export declare const SUCCESS_MESSAGES: {
    readonly AUTH: {
        readonly LOGIN_SUCCESS: "Successfully logged in";
        readonly REGISTER_SUCCESS: "Account created successfully";
        readonly LOGOUT_SUCCESS: "Successfully logged out";
    };
    readonly BOOKING: {
        readonly CREATED: "Booking created successfully";
        readonly UPDATED: "Booking updated successfully";
        readonly CANCELLED: "Booking cancelled successfully";
        readonly COMPLETED: "Delivery completed successfully";
    };
    readonly GENERAL: {
        readonly OPERATION_SUCCESS: "Operation completed successfully";
        readonly DATA_SAVED: "Data saved successfully";
        readonly DATA_DELETED: "Data deleted successfully";
    };
};
//# sourceMappingURL=index.d.ts.map