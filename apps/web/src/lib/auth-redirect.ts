/**
 * Centralized authentication redirect logic
 * Ensures consistent behavior across the application
 */

import { ROUTES } from './routing';

export type UserRole = 'customer' | 'driver' | 'admin' | 'superadmin' | 'staff';

/**
 * Get the default dashboard route for a given user role
 * 
 * This is the SINGLE SOURCE OF TRUTH for role-based redirects.
 * 
 * @param role - The user's role
 * @returns The dashboard path for the role
 * 
 * @example
 * getRedirectPathForRole('admin') // returns '/admin'
 * getRedirectPathForRole('customer') // returns '/customer'
 * getRedirectPathForRole(undefined) // returns '/' with warning
 */
export function getRedirectPathForRole(role: UserRole | string | undefined): string {
  // Explicit role matching for clarity
  switch (role) {
    case 'admin':
    case 'superadmin':
      return ROUTES.ADMIN_DASHBOARD; // '/admin'
    case 'driver':
      return ROUTES.DRIVER_DASHBOARD; // '/driver'
    case 'customer':
      return ROUTES.CUSTOMER_DASHBOARD; // '/customer'
    case 'staff':
      return ROUTES.STAFF_DASHBOARD; // '/staff/dashboard'
    default:
      // This should rarely happen - indicates a bug in session management
      console.error('⚠️ getRedirectPathForRole called with unknown/undefined role:', {
        role,
        typeofRole: typeof role,
        message: 'User role is undefined or invalid - check session/JWT callbacks'
      });
      return ROUTES.HOME; // Fallback to home page
  }
}

/**
 * Check if a role has admin privileges
 * @param role - The user's role
 * @returns True if the role is admin or superadmin
 */
export function isAdminRole(role: string | undefined): boolean {
  return role === 'admin' || role === 'superadmin';
}

/**
 * Validate and sanitize a return URL to prevent open redirects
 * @param returnUrl - The URL to validate
 * @param currentOrigin - The current origin (for same-origin check)
 * @returns The validated URL path or null if invalid
 */
export function validateReturnUrl(
  returnUrl: string | null | undefined,
  currentOrigin: string
): string | null {
  if (!returnUrl) return null;

  try {
    const url = new URL(returnUrl, currentOrigin);
    // Only allow same-origin redirects
    if (url.origin === currentOrigin) {
      return url.pathname + url.search + url.hash;
    }
  } catch (error) {
    console.warn('Invalid return URL:', returnUrl);
  }

  return null;
}
