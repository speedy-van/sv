import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routing';
import CustomerLayoutWrapper from './CustomerLayoutWrapper';

// Force dynamic rendering for customer pages (fixes DYNAMIC_SERVER_USAGE error)
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
  const isAuthenticated = !!session?.user && (session.user as any)?.role === 'customer';

  // Pass session status to client wrapper
  // The client wrapper will check the route and handle authentication
  return (
    <CustomerLayoutWrapper isAuthenticated={isAuthenticated}>
      {children}
    </CustomerLayoutWrapper>
  );
}
