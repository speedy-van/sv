'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { WhatsAppFloatingButton } from './WhatsAppEntryPoint';

const SKIP_PATHS = ['/','/contact','/pricing'];

const shouldSkipPath = (pathname: string | null) => {
  if (!pathname) return false;
  if (SKIP_PATHS.includes(pathname)) return true;
  if (pathname.startsWith('/booking-luxury')) return true;
  return false;
};

export function WhatsAppFloatingGuard() {
  const pathname = usePathname();

  if (shouldSkipPath(pathname)) {
    return null;
  }

  return <WhatsAppFloatingButton context="public_layout" />;
}

