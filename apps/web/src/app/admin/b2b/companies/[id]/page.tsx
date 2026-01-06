/**
 * B2B Company Detail Admin Page
 * 
 * Detailed view and management of a single B2B company
 */

import { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import CompanyDetailDashboard from '@/components/admin/b2b/CompanyDetailDashboard';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Company Details | B2B Admin',
  description: 'Manage B2B company details, users, API keys, and pricing',
};

interface PageProps {
  params: { id: string };
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-[600px]" />
    </div>
  );
}

export default function CompanyDetailPage({ params }: PageProps) {
  if (!params.id) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSkeleton />}>
        <CompanyDetailDashboard companyId={params.id} />
      </Suspense>
    </div>
  );
}
