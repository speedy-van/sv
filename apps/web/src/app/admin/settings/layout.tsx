import React from 'react';
import { SettingsCodeGateWrapper } from './SettingsCodeGateWrapper';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsCodeGateWrapper>{children}</SettingsCodeGateWrapper>;
}


