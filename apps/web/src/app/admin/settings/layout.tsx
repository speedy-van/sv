import React from 'react';
import nextDynamic from 'next/dynamic';

const SettingsCodeGate = nextDynamic(() => import('@/components/admin/SettingsCodeGate'), { ssr: false });

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsCodeGate>{children}</SettingsCodeGate>;
}


