import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { UnifiedNavigation } from '@/components/shared/UnifiedNavigation';
import UnifiedErrorBoundary from '@/components/shared/UnifiedErrorBoundary';
import { ROUTES } from '@/lib/routing';
import SpeedyAIChatbotProvider from '@/components/admin/SpeedyAIChatbotProvider';

// Force dynamic rendering for admin pages (fixes DYNAMIC_SERVER_USAGE error)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Add debugging
  console.log('🔐 Admin Layout - Session check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    userRole: (session?.user as any)?.role,
    adminRole: (session?.user as any)?.adminRole,
    email: session?.user?.email,
    timestamp: new Date().toISOString(),
  });

  if (!session?.user) {
    console.log('❌ Admin Layout - No session, redirecting to login');
    redirect(ROUTES.LOGIN);
  }

  if ((session.user as any).role !== 'admin') {
    console.log('❌ Admin Layout - User is not admin, redirecting to login');
    redirect(ROUTES.LOGIN);
  }

  console.log('✅ Admin Layout - Access granted for admin user');

  return (
    <>
      {/* Load Pusher for real-time notifications */}
      <script src="https://js.pusher.com/8.2.0/pusher.min.js" async></script>
      
      <UnifiedNavigation role="admin" isAuthenticated={true}>
        <UnifiedErrorBoundary role="admin">{children}</UnifiedErrorBoundary>
      </UnifiedNavigation>
      
      {/* Speedy AI Chatbot */}
      <SpeedyAIChatbotProvider />
    </>
  );
}