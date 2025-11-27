import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCustomSession } from '@/lib/custom-auth';
import { redirect } from 'next/navigation';
import { AdminNavigationWrapper } from './AdminNavigationWrapper';
import UnifiedErrorBoundary from '@/components/shared/UnifiedErrorBoundary';
import SpeedyAIChatbotProvider from '@/components/admin/SpeedyAIChatbotProvider';

// CRITICAL: Force dynamic rendering because we use getServerSession() which requires cookies()
// This prevents DYNAMIC_SERVER_USAGE error in production builds
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCustomSession();

  console.log("🔐 Admin Layout - Session check:", {
    hasSession: !!session,
    userRole: session?.user && (session.user as any).role,
    adminRole: session?.user && (session.user as any).adminRole,
    email: session?.user?.email,
    timestamp: new Date().toISOString(),
  });

  if (!session) {
    console.log("❌ Admin Layout - No session user, redirecting to login");
    redirect('/auth/login');
  }

  const role = session.user.role;

  if (role !== 'admin' && role !== 'superadmin') {
    console.log('❌ Admin Layout - Non-admin role, redirecting to home:', role);
    redirect('/');
  }

  console.log('✅ Admin Layout - Access granted for admin user', { role });

  return (
    <>
      {/* Load Pusher for real-time notifications */}
      <script src="https://js.pusher.com/8.2.0/pusher.min.js" async></script>
      
      <AdminNavigationWrapper role="admin" isAuthenticated={true}>
        <UnifiedErrorBoundary role="admin">{children}</UnifiedErrorBoundary>
      </AdminNavigationWrapper>
      
      {/* Speedy AI Chatbot */}
      <SpeedyAIChatbotProvider />
    </>
  );
}