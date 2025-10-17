/**
 * Admin API Authentication Helper
 * 
 * Provides reusable authentication check for admin endpoints
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Require admin authentication for an API route
 * 
 * @param request - Next.js request object
 * @returns NextResponse with error if auth fails, null if auth passes
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authError = await requireAdminAuth(request);
 *   if (authError) return authError;
 *   
 *   // ... rest of the code
 * }
 * ```
 */
export async function requireAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Admin access required' },
      { status: 403 }
    );
  }
  
  return null; // Auth passed
}

