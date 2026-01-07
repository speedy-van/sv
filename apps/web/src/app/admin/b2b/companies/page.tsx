/**
 * B2B Companies Admin Page
 * 
 * Lists all B2B companies with filtering and management options
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import CompaniesListDashboard from '@/components/admin/b2b/CompaniesListDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import AdminB2BPageShell from '@/components/admin/b2b/AdminB2BPageShell';

export const metadata: Metadata = {
  title: 'B2B Companies | Admin Dashboard',
  description: 'Manage B2B company accounts, API keys, and pricing',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export default function B2BCompaniesPage() {
  return (
    <AdminB2BPageShell>
      <Suspense fallback={<LoadingSkeleton />}>
        <CompaniesListDashboard />
      </Suspense>
    </AdminB2BPageShell>
  );
}
