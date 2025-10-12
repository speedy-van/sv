"use client";

/**
 * Chakra UI providers wrapper for Speedy Van
 */

import { ChakraProvider } from '@chakra-ui/react';
import { ReactNode } from 'react';
import mobileTheme from '@/theme/mobile-theme';

interface ChakraProvidersProps {
  children: ReactNode;
}

export default function ChakraProviders({ children }: ChakraProvidersProps) {
  return (
    <ChakraProvider theme={mobileTheme}>
      {children}
    </ChakraProvider>
  );
}