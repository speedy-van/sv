'use client';

import dynamic from 'next/dynamic';

const UnifiedNavigation = dynamic(
  () => import('@/components/shared/UnifiedNavigation').then(m => m.UnifiedNavigation),
  { ssr: false }
);

export function AdminNavigationWrapper({ 
  role, 
  isAuthenticated,
  children 
}: { 
  role: string;
  isAuthenticated: boolean;
  children: React.ReactNode;
}) {
  return (
    <UnifiedNavigation role={role} isAuthenticated={isAuthenticated}>
      {children}
    </UnifiedNavigation>
  );
}
