import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UnifiedNavigation } from '@/components/shared/UnifiedNavigation';
import UnifiedErrorBoundary from '@/components/shared/UnifiedErrorBoundary';

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
    <div suppressHydrationWarning>
      <UnifiedNavigation role="driver" isAuthenticated={true}>
        <UnifiedErrorBoundary role="driver">{children}</UnifiedErrorBoundary>
      </UnifiedNavigation>
    </div>
  );
}