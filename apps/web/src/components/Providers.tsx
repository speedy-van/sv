"use client";

/**
 * Global providers wrapper for Speedy Van
 */

import { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import ChakraProviders from './ChakraProviders';
import ErrorBoundary from './ErrorBoundary';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ChakraProviders>
          {children}
        </ChakraProviders>
      </SessionProvider>
    </ErrorBoundary>
  );
}