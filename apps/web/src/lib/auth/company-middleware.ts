/**
 * Company Authentication Middleware
 * 
 * Validates company session tokens and enforces access control.
 */

import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface CompanySession {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[];
}

export interface AuthResult {
  authenticated: boolean;
  session?: CompanySession;
  error?: string;
}

/**
 * Verify company session from cookie
 */
export async function verifyCompanySession(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('company-token');

    if (!token) {
      return {
        authenticated: false,
        error: 'No session token found',
      };
    }

    const { payload } = await jwtVerify(token.value, JWT_SECRET);

    if (payload.type !== 'company') {
      return {
        authenticated: false,
        error: 'Invalid token type',
      };
    }

    return {
      authenticated: true,
      session: {
        userId: payload.userId as string,
        email: payload.email as string,
        companyId: payload.companyId as string,
        role: payload.role as string,
        permissions: getRolePermissions(payload.role as string),
      },
    };
  } catch (error) {
    return {
      authenticated: false,
      error: 'Invalid or expired token',
    };
  }
}

/**
 * Check if session has required permission
 */
export function hasPermission(session: CompanySession, permission: string): boolean {
  // OWNER has all permissions
  if (session.permissions.includes('*')) {
    return true;
  }

  // Check exact permission
  if (session.permissions.includes(permission)) {
    return true;
  }

  // Check wildcard permissions (e.g., "bookings:*" includes "bookings:create")
  const [resource, action] = permission.split(':');
  if (session.permissions.includes(`${resource}:*`)) {
    return true;
  }

  return false;
}

/**
 * Get permissions based on company role
 */
function getRolePermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    OWNER: ['*'], // Full access
    ADMIN: ['bookings:*', 'quotes:*', 'invoices:*', 'users:read', 'users:invite'],
    FINANCE: ['bookings:read', 'quotes:read', 'invoices:*'],
    DISPATCHER: ['bookings:*', 'quotes:read'],
    MEMBER: ['bookings:create', 'bookings:read', 'quotes:create', 'quotes:read'],
    READ_ONLY: ['bookings:read', 'quotes:read', 'invoices:read'],
  };

  return permissions[role] || [];
}
