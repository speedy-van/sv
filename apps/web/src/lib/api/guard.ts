import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';

export interface AuthGuardOptions {
  requiredRoles?: string[];
  requireAuth?: boolean;
}

export function withAuthGuard(
  handler: (req: NextRequest, context: any) => Promise<NextResponse>,
  options: AuthGuardOptions = {}
) {
  return async (req: NextRequest, context: any) => {
    try {
      // Check if authentication is required
      if (options.requireAuth !== false) {
        const session = await getServerSession(authOptions);
        
        if (!session?.user) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        // Check role requirements
        if (options.requiredRoles && options.requiredRoles.length > 0) {
          const userRole = session.user.role;
          
          if (!userRole || !options.requiredRoles.includes(userRole)) {
            return NextResponse.json(
              { error: 'Insufficient permissions' },
              { status: 403 }
            );
          }
        }
      }

      // Call the original handler
      return await handler(req, context);
    } catch (error) {
      console.error('Auth guard error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

export function requireAuth(handler: (req: NextRequest, context: any) => Promise<NextResponse>) {
  return withAuthGuard(handler, { requireAuth: true });
}

export async function requireRole(request: NextRequest, roles: string | string[]): Promise<{ id: string; email: string; name: string; role: string }> {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  return requireRoleDirect(request, requiredRoles);
}

export function requireRoleWrapper(roles: string[]) {
  return (handler: (req: NextRequest, context: any) => Promise<NextResponse>) => {
    return withAuthGuard(handler, { requiredRoles: roles });
  };
}

export function requireAdmin(handler: (req: NextRequest, context: any) => Promise<NextResponse>) {
  return withAuthGuard(handler, { requiredRoles: ['admin'] });
}

export function requireDriver(handler: (req: NextRequest, context: any) => Promise<NextResponse>) {
  return withAuthGuard(handler, { requiredRoles: ['driver', 'admin'] });
}

export function requireCustomer(handler: (req: NextRequest, context: any) => Promise<NextResponse>) {
  return withAuthGuard(handler, { requiredRoles: ['customer', 'admin'] });
}

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user;
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}

export async function getCurrentUserRole(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.role || null;
}

// Direct requireRole function for API routes
export async function requireRoleDirect(request: NextRequest, roles: string | string[]): Promise<{ id: string; email: string; name: string; role: string }> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Authentication required');
  }

  const userRole = session.user.role;
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!userRole || !requiredRoles.includes(userRole)) {
    throw new Error('Insufficient permissions');
  }
  
  return session.user;
}

// Direct requireDriver function for API routes
export async function requireDriverDirect(request: NextRequest): Promise<{ id: string; email: string; name: string; role: string }> {
  return requireRoleDirect(request, 'driver');
}

// API handler wrapper for API routes
export function withApiHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(req);
    } catch (error: any) {
      console.error('API handler error:', error);
      return NextResponse.json(
        { error: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// HTTP JSON response helper
export function httpJson(status: number = 200, data: any): NextResponse {
  return NextResponse.json(data, { status });
}