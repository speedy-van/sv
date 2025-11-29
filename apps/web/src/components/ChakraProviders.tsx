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
// 
// CRITICAL FIX FOR HYDRATION MISMATCH:
// - prepend: true ensures Chakra styles load BEFORE global CSS (allows global overrides)
// - speedy: false ensures identical CSS generation between SSR and client
// - Stable insertion point ensures consistent className hashes
// 
// ROOT CAUSE EXPLAINED:
// Chakra UI uses Emotion for CSS-in-JS. In production, Emotion generates hash-based
// classNames like "chakra-1f3xilp". If the CSS insertion order differs between SSR
// and client hydration, Emotion generates different hashes for the same styles.
// 
// This was causing: className="chakra-1f3xilp" (SSR) vs "chakra-7zvrdo" (client)
// 
// THE FIX:
// 1. Always use the same insertion point (meta tag) on both server and client
// 2. Disable speedy mode to ensure deterministic CSS generation
// 3. Use consistent cache key across SSR and CSR
function createEmotionCache() {
  const insertionPoint = typeof document !== 'undefined' 
    ? (document.querySelector('meta[name="emotion-insertion-point"]') as HTMLElement | null)
    : null;

  return createCache({
    key: 'chakra',
    prepend: true, // Load Chakra styles BEFORE global CSS (allows global overrides)
    speedy: false, // CRITICAL: Disable speedy mode for deterministic CSS generation (prevents hydration mismatch)
    // Explicitly set insertion point to ensure consistent CSS order between SSR and client
    insertionPoint: insertionPoint || undefined,
  });
}

// CRITICAL: Shared cache for both server and client to ensure consistent className generation
// This prevents hydration mismatches caused by different Emotion cache instances
let sharedEmotionCache: ReturnType<typeof createEmotionCache> | null = null;

export default function ChakraProviders({ children }: ChakraProvidersProps) {
  // CRITICAL FIX: Use same cache instance for both SSR and client to prevent hydration mismatch
  // Previous code created new cache on server for each request, causing different classNames
  const emotionCache = useMemo(() => {
    if (!sharedEmotionCache) {
      sharedEmotionCache = createEmotionCache();
    }
    return sharedEmotionCache;
  }, []);

  // INSTRUMENTATION: Log color mode at render time to prove SSR vs client divergence
  const isServer = typeof window === 'undefined';
  const colorMode = isServer ? 'light (SSR - from theme initialColorMode)' : 'unknown (client first render)';
  
  if (isServer) {
    console.log('[SSR] ChakraProviders rendering with color mode:', colorMode);
  } else {
    console.log('[CLIENT FIRST RENDER] ChakraProviders rendering. Will check actual color mode after mount.');
  }

  // Set CSS variables on client-side only (after hydration)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      
      // INSTRUMENTATION: Log actual color mode at mount (after hydration)
      const actualColorMode = root.getAttribute('data-chakra-ui-color-mode') || 
                             root.style.getPropertyValue('--chakra-ui-color-mode') ||
                             'unknown';
      console.log('[CLIENT AFTER HYDRATION] Actual color mode detected:', actualColorMode);
      console.log('[CLIENT AFTER HYDRATION] About to force dark mode via useEffect...');
      
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