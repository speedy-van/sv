"use client";

/**
 * Chakra UI providers wrapper for Speedy Van
 * FIXED: Emotion cache configuration for SSR to prevent CSS-in-JS from displaying as text on Safari/iOS
 */

import React, { ReactNode, useMemo, useEffect } from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import mobileTheme from '@/theme/mobile-theme';

interface ChakraProvidersProps {
  children: ReactNode;
}

// Create Emotion cache that's SSR-safe and properly injects styles into <head>
// This prevents CSS-in-JS from displaying as text on Safari/iOS
function createEmotionCache() {
  return createCache({
    key: 'chakra',
    prepend: true, // Prepend styles to <head> to ensure they load first
    speedy: false, // Disable speedy mode for production reliability
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

  // Set CSS variables on client-side only (after hydration)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-theme', 'dark');
      root.classList.add('chakra-ui-dark');
      root.style.setProperty('--chakra-ui-color-mode', 'dark');
      root.style.setProperty('--chakra-colors-neon-400', '#00C2FF');
      root.style.setProperty('--chakra-colors-neon-500', '#00B8F0');
      root.style.setProperty('--chakra-colors-bg-surface', 'rgba(13, 13, 13, 1)');
      root.style.setProperty('--chakra-colors-bg-card', 'rgba(26, 26, 26, 0.95)');
      root.style.setProperty('--chakra-colors-text-primary', 'rgba(255, 255, 255, 0.92)');
      root.style.setProperty('--chakra-colors-text-secondary', 'rgba(255, 255, 255, 0.64)');
      root.style.setProperty('--chakra-colors-border-primary', 'rgba(59, 130, 246, 0.3)');
    }
  }, []);

  return (
    <CacheProvider value={emotionCache}>
      <ChakraProvider theme={mobileTheme}>
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}