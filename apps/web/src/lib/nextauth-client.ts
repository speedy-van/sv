/**
 * NextAuth Client Utilities
 * 
 * This file contains utilities to manage NextAuth client-side
 * and provide better error handling
 */

import { useSession, signIn, signOut, getSession } from 'next-auth/react';
import { Session } from 'next-auth';

/**
 * Custom hook for safe session access
 */
export function useSafeSession(): {
  session: Session | null;
  isLoading: boolean;
  isValid: boolean;
  userRole: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
} {
  const { data: session, status } = useSession();
  
  const isLoading = status === 'loading';
  const isValid = !!(session?.user?.id && session?.user?.email && session?.user?.role);
  const userRole = session?.user?.role || null;
  const userId = session?.user?.id || null;
  const userEmail = session?.user?.email || null;
  const userName = session?.user?.name || null;

  return {
    session,
    isLoading,
    isValid,
    userRole,
    userId,
    userEmail,
    userName,
  };
}

/**
 * Safe sign in function
 */
export async function safeSignIn(
  provider: string = 'credentials',
  options?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await signIn(provider, {
      redirect: false,
      ...options,
    });

    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Safe sign out function
 */
export async function safeSignOut(): Promise<{ success: boolean; error?: string }> {
  try {
    await signOut({ redirect: false });
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get session with error handling
 */
export async function getSafeSession(): Promise<Session | null> {
  try {
    const session = await getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Check if user is authenticated on client side
 */
export async function isClientAuthenticated(): Promise<boolean> {
  const session = await getSafeSession();
  return !!(session?.user?.id && session?.user?.email && session?.user?.role);
}

/**
 * Get user role on client side
 */
export async function getClientUserRole(): Promise<string | null> {
  const session = await getSafeSession();
  return session?.user?.role || null;
}

/**
 * Check if user has specific role on client side
 */
export async function hasClientRole(role: string): Promise<boolean> {
  const userRole = await getClientUserRole();
  return userRole === role;
}

/**
 * Check if user is admin on client side
 */
export async function isClientAdmin(): Promise<boolean> {
  return await hasClientRole('admin');
}

/**
 * Check if user is driver on client side
 */
export async function isClientDriver(): Promise<boolean> {
  return await hasClientRole('driver');
}

/**
 * Check if user is customer on client side
 */
export async function isClientCustomer(): Promise<boolean> {
  return await hasClientRole('customer');
}

/**
 * Create session summary for client-side logging
 */
export function getClientSessionSummary(session: Session | null): Record<string, any> {
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
