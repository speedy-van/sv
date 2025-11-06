"use client";

/**
 * Chakra UI providers wrapper for Speedy Van
 * FIXED: Emotion cache configuration for SSR to prevent CSS-in-JS from displaying as text on Safari/iOS
 */

import { ChakraProvider } from '@chakra-ui/react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { ReactNode, useMemo } from 'react';
import mobileTheme from '@/theme/mobile-theme';

interface ChakraProvidersProps {
  children: ReactNode;
}

// Create Emotion cache that's SSR-safe and properly injects styles into <head>
// This prevents CSS-in-JS from displaying as text on Safari/iOS
function createEmotionCache() {
  return createCache({
    key: 'chakra-ui',
    prepend: true, // Prepend styles to <head> to ensure they load first
  });
}

// Client-side cache (reused on client-side navigation)
let clientEmotionCache: ReturnType<typeof createEmotionCache> | null = null;

export default function ChakraProviders({ children }: ChakraProvidersProps) {
  // Create cache only once on client-side
  const emotionCache = useMemo(() => {
    if (typeof window === 'undefined') {
      // Server-side: create new cache for each request
      return createEmotionCache();
    }
    // Client-side: reuse cache
    if (!clientEmotionCache) {
      clientEmotionCache = createEmotionCache();
    }
    return clientEmotionCache;
  }, []);

  return (
    <CacheProvider value={emotionCache}>
      <ChakraProvider theme={mobileTheme}>
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}