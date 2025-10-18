import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UnifiedNavigation } from '@/components/shared/UnifiedNavigation';
import UnifiedErrorBoundary from '@/components/shared/UnifiedErrorBoundary';
import { ROUTES } from '@/lib/routing';

// Force dynamic rendering for customer pages (fixes DYNAMIC_SERVER_USAGE error)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Add debugging
  console.log('👤 Customer Layout - Session check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    userRole: (session?.user as any)?.role,
    email: session?.user?.email,
    timestamp: new Date().toISOString(),
  });

  if (!session?.user) {
    console.log('❌ Customer Layout - No session, redirecting to login');
    redirect(ROUTES.LOGIN);
  }

  if ((session.user as any).role !== 'customer') {
    console.log('❌ Customer Layout - User is not customer, redirecting to login');
    redirect(ROUTES.LOGIN);
  }

  console.log('✅ Customer Layout - Access granted for customer user');

  return (
    <>
      <UnifiedNavigation role="customer" isAuthenticated={true}>
        <UnifiedErrorBoundary role="customer">{children}</UnifiedErrorBoundary>
      </UnifiedNavigation>
    </>
  );
}
