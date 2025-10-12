// API Constants
export const API_ROUTES = {
    AUTH: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        LOGOUT: '/api/auth/logout',
        REFRESH: '/api/auth/refresh',
    },
    BOOKINGS: {
        CREATE: '/api/booking-luxury',
        LIST: '/api/booking-luxury',
        GET: (id) => `/api/booking-luxury/${id}`,
        UPDATE: (id) => `/api/booking-luxury/${id}`,
        CANCEL: (id) => `/api/booking-luxury/${id}/cancel`,
        TRACK: (id) => `/api/booking-luxury/${id}/track`,
    },
    PRICING: {
        QUOTE: '/api/pricing/quote',
        CATALOG: '/api/pricing/catalog',
    },
    DRIVERS: {
        LIST: '/api/drivers',
        GET: (id) => `/api/drivers/${id}`,
        LOCATION: (id) => `/api/drivers/${id}/location`,
        AVAILABILITY: (id) => `/api/drivers/${id}/availability`,
    },
    ADMIN: {
        DASHBOARD: '/api/admin/dashboard',
        USERS: '/api/admin/users',
        BOOKINGS: '/api/admin/booking-luxury',
        DRIVERS: '/api/admin/drivers',
        ANALYTICS: '/api/admin/analytics',
    },
};
// Pagination Constants
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
// Validation Constants
export const VALIDATION = {
    PASSWORD_MIN_LENGTH: 8,
    NAME_MIN_LENGTH: 1,
    DESCRIPTION_MAX_LENGTH: 500,
    ITEM_MAX_QUANTITY: 100,
    BOOKING_MAX_ITEMS: 50,
};
// Business Constants
export const BUSINESS = {
    DELIVERY_RADIUS_KM: 50,
    MIN_BOOKING_ADVANCE_HOURS: 2,
    MAX_BOOKING_ADVANCE_DAYS: 30,
    DEFAULT_CURRENCY: 'USD',
    DRIVER_RATING_SCALE: 5,
};
// Vehicle Constants
export const VEHICLE_SPECS = {
    VAN: {
        maxWeight: 1000, // kg
        maxVolume: 10, // cubic meters
        basePrice: 50,
    },
    TRUCK: {
        maxWeight: 3000, // kg
        maxVolume: 25, // cubic meters
        basePrice: 100,
    },
    PICKUP: {
        maxWeight: 500, // kg
        maxVolume: 5, // cubic meters
        basePrice: 30,
    },
};
// Status Messages
export const STATUS_MESSAGES = {
    BOOKING: {
        PENDING: 'Booking is pending confirmation',
        CONFIRMED: 'Booking has been confirmed',
        IN_PROGRESS: 'Delivery is in progress',
        COMPLETED: 'Delivery has been completed',
        CANCELLED: 'Booking has been cancelled',
    },
    DRIVER: {
        AVAILABLE: 'Driver is available for bookings',
        BUSY: 'Driver is currently on a delivery',
        OFFLINE: 'Driver is offline',
    },
};
// Error Messages
export const ERROR_MESSAGES = {
    AUTH: {
        INVALID_CREDENTIALS: 'Invalid email or password',
        USER_NOT_FOUND: 'User not found',
        EMAIL_ALREADY_EXISTS: 'Email already exists',
        UNAUTHORIZED: 'Unauthorized access',
        TOKEN_EXPIRED: 'Token has expired',
    },
    BOOKING: {
        NOT_FOUND: 'Booking not found',
        CANNOT_CANCEL: 'Cannot cancel booking at this stage',
        INVALID_STATUS: 'Invalid booking status',
        NO_AVAILABLE_DRIVERS: 'No available drivers in your area',
    },
    VALIDATION: {
        REQUIRED_FIELD: 'This field is required',
        INVALID_EMAIL: 'Invalid email address',
        INVALID_PHONE: 'Invalid phone number',
        INVALID_DATE: 'Invalid date',
        INVALID_ADDRESS: 'Invalid address',
    },
    GENERAL: {
        INTERNAL_ERROR: 'Internal server error',
        NOT_FOUND: 'Resource not found',
        BAD_REQUEST: 'Bad request',
        FORBIDDEN: 'Access forbidden',
    },
};
// Success Messages
export const SUCCESS_MESSAGES = {
    AUTH: {
        LOGIN_SUCCESS: 'Successfully logged in',
        REGISTER_SUCCESS: 'Account created successfully',
        LOGOUT_SUCCESS: 'Successfully logged out',
    },
    BOOKING: {
        CREATED: 'Booking created successfully',
        UPDATED: 'Booking updated successfully',
        CANCELLED: 'Booking cancelled successfully',
        COMPLETED: 'Delivery completed successfully',
    },
    GENERAL: {
        OPERATION_SUCCESS: 'Operation completed successfully',
        DATA_SAVED: 'Data saved successfully',
        DATA_DELETED: 'Data deleted successfully',
    },
};
//# sourceMappingURL=index.js.map