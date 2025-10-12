/**
 * NextAuth Middleware Utilities
 * 
 * This file contains utilities to manage NextAuth middleware
 * and provide better error handling
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Get JWT token from request with error handling
 */
export async function getSafeToken(request: NextRequest): Promise<any | null> {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production',
    });

    return token;
  } catch (error) {
    console.error('Error getting JWT token:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = await getSafeToken(request);
  return !!token;
}

/**
 * Get user role from request
 */
export async function getUserRole(request: NextRequest): Promise<string | null> {
  const token = await getSafeToken(request);
  return token?.role || null;
}

/**
 * Check if user has specific role
 */
export async function hasRole(request: NextRequest, role: string): Promise<boolean> {
  const userRole = await getUserRole(request);
  return userRole === role;
}

/**
 * Check if user is admin
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  return await hasRole(request, 'admin');
}

/**
 * Check if user is driver
 */
export async function isDriver(request: NextRequest): Promise<boolean> {
  return await hasRole(request, 'driver');
}

/**
 * Check if user is customer
 */
export async function isCustomer(request: NextRequest): Promise<boolean> {
  return await hasRole(request, 'customer');
}

/**
 * Create authentication error response
 */
export function createAuthErrorResponse(
  request: NextRequest,
  error: string = 'Authentication required'
): NextResponse {
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
  
  return NextResponse.redirect(loginUrl);
}

/**
 * Create permission error response
 */
export function createPermissionErrorResponse(
  request: NextRequest,
  error: string = 'Insufficient permissions'
): NextResponse {
  const errorUrl = new URL('/auth/error', request.url);
  errorUrl.searchParams.set('error', error);
  
  return NextResponse.redirect(errorUrl);
}

/**
 * Create account status error response
 */
export function createAccountErrorResponse(
  request: NextRequest,
  error: string = 'Account issue'
): NextResponse {
  const errorUrl = new URL('/auth/error', request.url);
  errorUrl.searchParams.set('error', error);
  
  return NextResponse.redirect(errorUrl);
}

/**
 * Validate token and return user info
 */
export async function validateToken(request: NextRequest): Promise<{
  isValid: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const token = await getSafeToken(request);
    
    if (!token) {
      return { isValid: false, error: 'No token found' };
    }

    if (!token.role) {
      return { isValid: false, error: 'Invalid token structure' };
    }

    return {
      isValid: true,
      user: {
        id: token.sub || token.id,
        email: token.email,
        name: token.name,
        role: token.role,
        isActive: token.isActive,
        driverId: token.driverId,
        driverStatus: token.driverStatus,
        applicationStatus: token.applicationStatus,
      },
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
