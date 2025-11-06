'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UnifiedNavigation } from '@/components/shared/UnifiedNavigation';
import UnifiedErrorBoundary from '@/components/shared/UnifiedErrorBoundary';
import { ROUTES } from '@/lib/routing';

// Public routes that don't require authentication
const PUBLIC_CUSTOMER_ROUTES = [
  '/customer/login',
  '/customer/register',
  '/customer/forgot',
  '/customer/reset',
];

export default function CustomerLayoutWrapper({
  children,
  isAuthenticated,
}: {
  children: React.ReactNode;
  isAuthenticated: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Check if current route is public
  const isPublicRoute = pathname ? PUBLIC_CUSTOMER_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  ) : false;

  // Redirect to login if trying to access protected route without authentication
  useEffect(() => {
    if (!isPublicRoute && !isAuthenticated) {
      console.log('🔒 Customer Layout - Redirecting to login (protected route, no auth)');
      router.push(ROUTES.CUSTOMER_LOGIN);
    }
  }, [isPublicRoute, isAuthenticated, router]);

  // If it's a public route, don't show navigation
  if (isPublicRoute) {
    return (
      <>
        <UnifiedErrorBoundary role="customer">{children}</UnifiedErrorBoundary>
      </>
    );
  }

  // Protected route - show navigation (only if authenticated)
  if (!isAuthenticated) {
    // Will redirect via useEffect, but show nothing while redirecting
    return null;
  }

  return (
    <>
      <UnifiedNavigation role="customer" isAuthenticated={isAuthenticated}>
        <UnifiedErrorBoundary role="customer">{children}</UnifiedErrorBoundary>
      </UnifiedNavigation>
    </>
  );
}

