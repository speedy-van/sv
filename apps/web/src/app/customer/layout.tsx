import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routing';
import CustomerLayoutWrapper from './CustomerLayoutWrapper';

// CRITICAL: Force dynamic rendering because we use getServerSession() which requires cookies()
// This prevents DYNAMIC_SERVER_USAGE error in production builds
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Public routes that don't require authentication
const PUBLIC_CUSTOMER_ROUTES = [
  '/customer/login',
  '/customer/register',
  '/customer/forgot',
  '/customer/reset',
];

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session status
  const session = await getServerSession(authOptions);
  const user = (session as any)?.user as { role?: string } | undefined;
  const userRole = user?.role;
  let isAuthenticated = false;
  if (userRole === 'customer' || userRole === 'admin') {
    isAuthenticated = true;
  }

  // Pass session status to client wrapper
  // The client wrapper will check the route and handle authentication
  return (
    <CustomerLayoutWrapper isAuthenticated={isAuthenticated}>
      {children}
    </CustomerLayoutWrapper>
  );
}
