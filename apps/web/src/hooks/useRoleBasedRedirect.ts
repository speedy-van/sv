/**
 * Role-based redirect hook for Speedy Van
 */

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getDefaultRoute, type UserRole } from '@/lib/routing';

interface UseRoleBasedRedirectOptions {
  redirectTo?: string;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
}

export function useRoleBasedRedirect(options: UseRoleBasedRedirectOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const {
    redirectTo,
    requireAuth = true,
    allowedRoles,
  } = options;

  useEffect(() => {
    if (status === 'loading') {
      return; // Still loading
    }

    if (!session && requireAuth) {
      // Not authenticated and auth is required
      router.push('/auth/login');
      return;
    }

    if (session && allowedRoles && !allowedRoles.includes(session.user.role as UserRole)) {
      // User doesn't have required role
      const defaultRoute = getDefaultRoute(session.user.role as UserRole);
      router.push(defaultRoute);
      return;
    }

    if (session && redirectTo) {
      // Redirect to specified route
      router.push(redirectTo);
      return;
    }

    if (session && !redirectTo) {
      // Redirect to user's default route
      const defaultRoute = getDefaultRoute(session.user.role as UserRole);
      router.push(defaultRoute);
      return;
    }
  }, [session, status, router, redirectTo, requireAuth, allowedRoles]);

  return {
    user: session?.user,
    isLoading: status === 'loading',
    role: session?.user?.role,
    userRole: session?.user?.role,
  };
}