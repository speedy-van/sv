import React from 'react';
import UnifiedErrorBoundary from '@/components/shared/UnifiedErrorBoundary';

// Public layout for customer auth pages (login, register, forgot, reset)
// This layout does NOT require authentication
export default function CustomerAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UnifiedErrorBoundary role="customer">{children}</UnifiedErrorBoundary>
    </>
  );
}

