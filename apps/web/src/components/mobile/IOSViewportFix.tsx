'use client';

import { useEffect } from 'react';

/**
 * iOS Safari Viewport Height Fix
 * 
 * Addresses the 100vh bug in iOS Safari where the viewport height
 * includes the dynamic UI elements (address bar, bottom toolbar).
 * 
 * This component sets a CSS custom property --vh that accurately
 * reflects the actual viewport height.
 */
export function IOSViewportFix() {
  useEffect(() => {
    // Function to set viewport height
    const setViewportHeight = () => {
      // Get actual viewport height
      const vh = window.innerHeight * 0.01;
      
      // Set CSS custom property
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      document.documentElement.style.setProperty('--window-inner-height', `${window.innerHeight}px`);
    };

    // Set on mount
    setViewportHeight();

    // Update on resize (handles Safari toolbar hide/show)
    window.addEventListener('resize', setViewportHeight);
    
    // Update on orientation change
    window.addEventListener('orientationchange', setViewportHeight);

    // Cleanup
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
    };
  }, []);

  return null;
}
