/**
 * Enterprise Admin Dashboard Page
 */

import { Metadata } from 'next';
import EnterpriseAdminDashboard from '@/components/admin/EnterpriseAdminDashboard';

export const metadata: Metadata = {
  title: 'Enterprise Admin Dashboard | Speedy Van',
  description: 'Advanced enterprise-grade admin dashboard with real-time analytics and operational control',
};

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <EnterpriseAdminDashboard />
    </div>
  );
}