'use client';

import { useEffect } from 'react';
import { initializeBrowserCompatibility } from '@/utils/browser-compatibility';

interface BrowserCompatibilityProviderProps {
  children: React.ReactNode;
}

export function BrowserCompatibilityProvider({ children }: BrowserCompatibilityProviderProps) {
  useEffect(() => {
    // Initialize browser compatibility features
    initializeBrowserCompatibility();
  }, []);

  return <>{children}</>;
}
