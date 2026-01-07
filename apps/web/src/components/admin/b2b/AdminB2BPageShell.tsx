'use client';

import AdminAuthGuard from '@/components/AdminAuthGuard';

interface AdminB2BPageShellProps {
  children: React.ReactNode;
}

/**
 * Thin client-side shell to enforce admin auth around B2B admin pages.
 * Wrap any B2B admin page content with this to ensure only authorized admins see the UI.
 */
export default function AdminB2BPageShell({ children }: AdminB2BPageShellProps) {
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}

