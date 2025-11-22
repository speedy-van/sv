'use client';

import { useEffect, useState } from 'react';

/**
 * Detects if the current client is running on iOS (Safari, Chrome, WebView...).
 * Uses userAgent + platform heuristics to capture iPad desktop mode as well.
 */
export function useIsIOSDevice(): boolean {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof navigator === 'undefined') {
      return;
    }

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const platform = navigator.platform || '';
    const isAppleDevice = /iPad|iPhone|iPod/.test(ua);
    const isIPadDesktopMode = platform === 'MacIntel' && navigator.maxTouchPoints > 1;

    setIsIOS(isAppleDevice || isIPadDesktopMode);
  }, []);

  return isIOS;
}

