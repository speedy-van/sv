import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UnifiedNavigation } from '@/components/shared/UnifiedNavigation';
import UnifiedErrorBoundary from '@/components/shared/UnifiedErrorBoundary';

// Force dynamic rendering for driver pages (fixes DYNAMIC_SERVER_USAGE error)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  console.log('🚗 Driver Layout - Session check:', {
    hasSession: !!session,
    userRole: (session?.user as any)?.role,
    email: session?.user?.email,
  });

  // Simple check: require driver session for all driver pages
  if (!session?.user) {
    console.log('❌ Driver Layout - No session, redirecting to auth');
    redirect('/driver-auth');
  }

  if ((session.user as any).role !== 'driver') {
    console.log('❌ Driver Layout - User is not driver, redirecting to auth');
    redirect('/driver-auth');
  }

  console.log('✅ Driver Layout - Access granted for approved driver');

  return (
    <>
      <UnifiedNavigation role="driver" isAuthenticated={true}>
        <UnifiedErrorBoundary role="driver">{children}</UnifiedErrorBoundary>
      </UnifiedNavigation>
    </>
  );
}