'use client';

import { useEffect } from 'react';

/**
 * Adds the `ios-device` class to <html> and <body> when running on iOS.
 * This lets us scope iOS-only CSS fixes without relying on broad selectors.
 */
export function IOSDeviceClassManager() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const platform = navigator.platform || '';
    const isIOS =
      /iPad|iPhone|iPod/.test(userAgent) ||
      (platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPad in desktop mode

    if (!isIOS) {
      return;
    }

    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    htmlEl.classList.add('ios-device');
    bodyEl?.classList.add('ios-device');

    return () => {
      htmlEl.classList.remove('ios-device');
      bodyEl?.classList.remove('ios-device');
    };
  }, []);

  return null;
}

