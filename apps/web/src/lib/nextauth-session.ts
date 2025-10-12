/**
 * NextAuth Session Utilities
 * 
 * This file contains utilities to manage NextAuth sessions
 * and provide better error handling
 */

import { Session } from 'next-auth';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/**
 * Safely get server session with error handling
 */
export async function getSafeServerSession(): Promise<Session | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return null;
    }

    // Validate session structure
    if (!session.user || !session.user.email || !session.user.role) {
      console.warn('Invalid session structure:', session);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting server session:', error);
    return null;
  }
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
 * Get user ID from session safely
 */
export function getUserId(session: Session | null): string | null {
  if (!isValidSession(session)) {
    return null;
  }

  return session?.user?.id || null;
}

/**
 * Get user email from session safely
 */
export function getUserEmail(session: Session | null): string | null {
  if (!isValidSession(session)) {
    return null;
  }

  return session?.user?.email || null;
}

/**
 * Get user name from session safely
 */
export function getUserName(session: Session | null): string | null {
  if (!isValidSession(session)) {
    return null;
  }

  return session?.user?.name || null;
}

/**
 * Create a session summary for logging
 */
export function getSessionSummary(session: Session | null): Record<string, any> {
  if (!session) {
    return { exists: false };
  }

  return {
    exists: true,
    userId: session.user?.id || 'unknown',
    email: session.user?.email || 'unknown',
    name: session.user?.name || 'unknown',
    role: session.user?.role || 'unknown',
    expires: session.expires || 'unknown',
  };
}
