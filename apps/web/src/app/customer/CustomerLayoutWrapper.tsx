'use client';

import React, { useEffect, useState } from 'react';
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
  const [mounted, setMounted] = useState(false);
  
  // Check if current route is public
  const isPublicRoute = pathname ? PUBLIC_CUSTOMER_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  ) : false;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if trying to access protected route without authentication
  useEffect(() => {
    if (mounted && !isPublicRoute && !isAuthenticated) {
      console.log('🔒 Customer Layout - Redirecting to login (protected route, no auth)');
      router.push(ROUTES.CUSTOMER_LOGIN);
    }
  }, [mounted, isPublicRoute, isAuthenticated, router]);

  // Avoid hydration mismatch by rendering same content on server and initial client render
  if (!mounted) {
    // If it's a public route, show content immediately
    if (isPublicRoute) {
      return (
        <div className="notranslate" translate="no">
          <UnifiedErrorBoundary role="customer">{children}</UnifiedErrorBoundary>
        </div>
      );
    }
    // For protected routes, show navigation assuming authenticated
    return (
      <div className="notranslate" translate="no">
        <UnifiedNavigation role="customer" isAuthenticated={isAuthenticated}>
          <UnifiedErrorBoundary role="customer">{children}</UnifiedErrorBoundary>
        </UnifiedNavigation>
      </div>
    );
  }

  // After mount, handle authentication properly

  // If it's a public route, don't show navigation
  if (isPublicRoute) {
    return (
      <div className="notranslate" translate="no">
        <UnifiedErrorBoundary role="customer">{children}</UnifiedErrorBoundary>
      </div>
    );
  }

  // Protected route - show navigation (only if authenticated)
  if (!isAuthenticated) {
    // Will redirect via useEffect, but show nothing while redirecting
    return null;
  }

  return (
    <div className="notranslate" translate="no">
      <UnifiedNavigation role="customer" isAuthenticated={isAuthenticated}>
        <UnifiedErrorBoundary role="customer">{children}</UnifiedErrorBoundary>
      </UnifiedNavigation>
    </div>
  );
}

