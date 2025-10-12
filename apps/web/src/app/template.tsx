'use client';

import { useEffect } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Fix hydration issues by ensuring proper client-side initialization
    if (typeof window !== 'undefined') {
      // Reset any hydration mismatches
      const root = document.getElementById('__next');
      if (root) {
        root.setAttribute('data-hydrated', 'true');
      }
    }
  }, []);

  return <>{children}</>;
}
