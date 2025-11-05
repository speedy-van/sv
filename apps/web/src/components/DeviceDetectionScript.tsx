'use client';

import { useEffect } from 'react';
import { getDeviceClass } from '@/lib/utils/device-detection';

/**
 * Client-side script to detect Safari 17+ on iPhone 15-17
 * and apply device-specific CSS classes to the body element
 */
export default function DeviceDetectionScript() {
  useEffect(() => {
    // Run device detection and add class to body
    const deviceClass = getDeviceClass();
    
    if (deviceClass) {
      document.body.classList.add(deviceClass);
      
      // Log for debugging (remove in production if needed)
      console.log('🔍 Device Detection:', {
        class: deviceClass,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      });
    }
    
    // Cleanup function
    return () => {
      if (deviceClass) {
        document.body.classList.remove(deviceClass);
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
