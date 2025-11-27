'use client';

import dynamic from 'next/dynamic';

const SettingsCodeGate = dynamic(
  () => import('@/components/admin/SettingsCodeGate'),
  { ssr: false }
);

export function SettingsCodeGateWrapper({ children }: { children: React.ReactNode }) {
  return <SettingsCodeGate>{children}</SettingsCodeGate>;
}
