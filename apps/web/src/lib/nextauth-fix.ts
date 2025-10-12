/**
 * NextAuth Fix Utilities
 * 
 * This file contains utilities to fix common NextAuth issues
 * including session handling and client-side errors
 */

import { Session } from 'next-auth';

export interface SafeSession extends Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Safely get session data with null checks
 */
export function getSafeSession(session: Session | null): SafeSession | null {
  if (!session || !session.user) {
    return null;
  }

  // Ensure all required fields exist
  if (!session.user.id || !session.user.email || !session.user.role) {
    console.warn('Incomplete session data:', session);
    return null;
  }

  return session as SafeSession;
}

/**
 * Check if session is valid and complete
 */
export function isValidSession(session: Session | null): boolean {
  if (!session || !session.user) {
    return false;
  }

  return !!(
    session.user.id &&
    session.user.email &&
    session.user.name &&
    session.user.role
  );
}

/**
 * Get user role from session safely
 */
export function getUserRole(session: Session | null): string | null {
  if (!isValidSession(session)) {
    return null;
  }

  return session?.user?.role || null;
}

/**
 * Check if user has specific role
 */
export function hasRole(session: Session | null, role: string): boolean {
  const userRole = getUserRole(session);
  return userRole === role;
}

/**
 * Check if user is admin
 */
export function isAdmin(session: Session | null): boolean {
  return hasRole(session, 'admin');
}

/**
 * Check if user is driver
 */
export function isDriver(session: Session | null): boolean {
  return hasRole(session, 'driver');
}

/**
 * Check if user is customer
 */
export function isCustomer(session: Session | null): boolean {
  return hasRole(session, 'customer');
}

/**
 * Create a default session for testing/development
 */
export function createDefaultSession(): SafeSession {
  return {
    user: {
      id: 'default-user-id',
      email: 'test@example.com',
      name: 'Test User',
      role: 'customer',
    },
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  };
}
