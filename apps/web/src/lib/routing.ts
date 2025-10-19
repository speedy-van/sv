/**
 * Routing constants and utilities for Speedy Van
 */

export type UserRole = 'customer' | 'driver' | 'admin';

export const ROUTES = {
  // Public routes
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRICING: '/pricing',
  SERVICES: '/services',
  TRACK: '/track',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  
  // Auth routes
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot',
  RESET_PASSWORD: '/auth/reset',
  VERIFY_EMAIL: '/auth/verify',
  
  // Customer routes
  CUSTOMER_DASHBOARD: '/customer',
  CUSTOMER_ORDERS: '/customer/orders',
  CUSTOMER_PROFILE: '/customer/profile',
  CUSTOMER_SETTINGS: '/customer/settings',
  
  // Driver routes
  DRIVER_DASHBOARD: '/driver',
  DRIVER_JOBS: '/driver/jobs',
  DRIVER_AVAILABILITY: '/driver/availability',
  DRIVER_SCHEDULE: '/driver/schedule',
  DRIVER_EARNINGS: '/driver/earnings',
  DRIVER_PROFILE: '/driver/profile',
  DRIVER_SETTINGS: '/driver/settings',
  DRIVER_APPLICATION: '/driver/application',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_OPERATIONS: '/admin/operations',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ROUTES: '/admin/routes',
  ADMIN_DRIVERS: '/admin/drivers',
  ADMIN_DRIVER_APPLICATIONS: '/admin/drivers/applications',
  ADMIN_DRIVER_EARNINGS: '/admin/drivers/earnings',
  ADMIN_DRIVER_SCHEDULE: '/admin/drivers/schedule',
  // DRIVER_APPLICATION removed - duplicate
  ADMIN_CUSTOMERS: '/admin/customers',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_FINANCE: '/admin/finance',
  ADMIN_LOGS: '/admin/logs',
  ADMIN_CONTENT: '/admin/content',
  ADMIN_DISPATCH: '/admin/dispatch',
  ADMIN_HEALTH: '/admin/health',
  ADMIN_AUDIT: '/admin/audit',
  ADMIN_USERS: '/admin/users',
  ADMIN_PEOPLE: '/admin/people',
  ADMIN_TRACKING: '/admin/tracking',
  ADMIN_CHAT: '/admin/chat',
  ADMIN_PAYOUTS: '/admin/payouts',
  ADMIN_VISITORS: '/admin/visitors',
  ADMIN_APPROVALS: '/admin/approvals',
  ADMIN_BONUSES: '/admin/bonuses',
  ADMIN_AUDIT_TRAIL: '/admin/audit-trail',
  
  
  // Nested route objects for easier access
  CUSTOMER: {
    DASHBOARD: '/customer',
    BOOKINGS: '/customer/orders',
    PROFILE: '/customer/profile',
    SETTINGS: '/customer/settings',
  },
  
  DRIVER: {
    DASHBOARD: '/driver',
    JOBS: '/driver/jobs',
    AVAILABILITY: '/driver/availability',
    SCHEDULE: '/driver/schedule',
    EARNINGS: '/driver/earnings',
    PROFILE: '/driver/profile',
    SETTINGS: '/driver/settings',
    APPLICATION: '/driver/application',
  },
  
  ADMIN: {
    DASHBOARD: '/admin',
    OPERATIONS: '/admin/operations',
    ORDERS: '/admin/orders',
    DRIVERS: '/admin/drivers',
    DRIVER_APPLICATIONS: '/admin/drivers/applications',
    DRIVER_SCHEDULE: '/admin/drivers/schedule',
    CUSTOMERS: '/admin/customers',
    ANALYTICS: '/admin/analytics',
    SETTINGS: '/admin/settings',
    FINANCE: '/admin/finance',
    LOGS: '/admin/logs',
    CONTENT: '/admin/content',
    DISPATCH: '/admin/dispatch',
    HEALTH: '/admin/health',
    AUDIT: '/admin/audit',
    USERS: '/admin/users',
    PEOPLE: '/admin/people',
    TRACKING: '/admin/tracking',
    CHAT: '/admin/chat',
    PAYOUTS: '/admin/payouts',
    VISITORS: '/admin/visitors',
    APPROVALS: '/admin/approvals',
    BONUSES: '/admin/bonuses',
    AUDIT_TRAIL: '/admin/audit-trail',
  },
  
      SHARED: {
        BOOKING_LUXURY: '/booking-luxury',
      },
  
  // API routes
  API_AUTH: '/api/auth',
  API_PAYMENT: '/api/payment',
  API_TRACKING: '/api/tracking',
} as const;

export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN_DASHBOARD;
    case 'driver':
      return ROUTES.DRIVER_DASHBOARD;
    case 'customer':
      return ROUTES.CUSTOMER_DASHBOARD;
    default:
      return ROUTES.HOME;
  }
}

export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    ROUTES.HOME,
    ROUTES.ABOUT,
    ROUTES.CONTACT,
    ROUTES.PRICING,
    ROUTES.SERVICES,
    ROUTES.TRACK,
    ROUTES.PRIVACY,
    ROUTES.TERMS,
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    ROUTES.FORGOT_PASSWORD,
    ROUTES.RESET_PASSWORD,
    ROUTES.VERIFY_EMAIL,
  ];
  
  return publicRoutes.some(route => pathname.startsWith(route));
}

export function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith(ROUTES.ADMIN_DASHBOARD);
}

export function isDriverRoute(pathname: string): boolean {
  return pathname.startsWith(ROUTES.DRIVER_DASHBOARD);
}

export function isCustomerRoute(pathname: string): boolean {
  return pathname.startsWith(ROUTES.CUSTOMER_DASHBOARD);
}

export function getRouteForRole(role: UserRole): string {
  return getDefaultRoute(role);
}

export function isAuthorizedRoute(pathname: string, role: UserRole): boolean {
  if (isPublicRoute(pathname)) {
    return true;
  }
  
  if (isAdminRoute(pathname)) {
    return role === 'admin';
  }
  
  if (isDriverRoute(pathname)) {
    return role === 'driver' || role === 'admin';
  }
  
  if (isCustomerRoute(pathname)) {
    return role === 'customer' || role === 'admin';
  }
  
  return false;
}