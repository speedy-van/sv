/**
 * React Hook for Device Detection
 * 
 * Provides device detection capabilities for Safari 17+ layout bug workarounds
 */

import { useState, useEffect } from 'react';
import {
  isSafari17Plus,
  isAffectedIPhone,
  hasBackdropFilterBug,
  hasFlexGridBug,
  shouldUseSimplifiedLayout,
  getIOSVersion,
  getDeviceInfo,
} from '../utils/device-detection';

export interface DeviceDetection {
  isSafari17Plus: boolean;
  isAffectedIPhone: boolean;
  hasBackdropFilterBug: boolean;
  hasFlexGridBug: boolean;
  shouldUseSimplifiedLayout: boolean;
  iosVersion: number | null;
  isClient: boolean;
}

/**
 * Hook to detect Safari 17+ and apply appropriate fallbacks
 * 
 * Usage:
 * ```tsx
 * const { shouldUseSimplifiedLayout, hasBackdropFilterBug } = useDeviceDetection();
 * 
 * return (
 *   <Box
 *     backdropFilter={hasBackdropFilterBug ? 'none' : 'blur(10px)'}
 *     bg={hasBackdropFilterBug ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)'}
 *   >
 *     {shouldUseSimplifiedLayout ? <SimplifiedLayout /> : <ComplexLayout />}
 *   </Box>
 * );
 * ```
 */
export function useDeviceDetection(): DeviceDetection {
  const [detection, setDetection] = useState<DeviceDetection>({
    isSafari17Plus: false,
    isAffectedIPhone: false,
    hasBackdropFilterBug: false,
    hasFlexGridBug: false,
    shouldUseSimplifiedLayout: false,
    iosVersion: null,
    isClient: false,
  });

  useEffect(() => {
    // Run detection only on client side
    setDetection({
      isSafari17Plus: isSafari17Plus(),
      isAffectedIPhone: isAffectedIPhone(),
      hasBackdropFilterBug: hasBackdropFilterBug(),
      hasFlexGridBug: hasFlexGridBug(),
      shouldUseSimplifiedLayout: shouldUseSimplifiedLayout(),
      iosVersion: getIOSVersion(),
      isClient: true,
    });
  }, []);

  return detection;
}

/**
 * Hook to get comprehensive device info for debugging
 */
export function useDeviceInfo() {
  const [deviceInfo, setDeviceInfo] = useState<ReturnType<typeof getDeviceInfo> | null>(null);

  useEffect(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  return deviceInfo;
}

/**
 * Hook to conditionally apply styles based on device detection
 * 
 * Usage:
 * ```tsx
 * const getStyles = useDeviceStyles();
 * 
 * return (
 *   <Box
 *     {...getStyles({
 *       backdropFilter: 'blur(10px)',
 *       bg: 'rgba(0,0,0,0.5)',
 *     }, {
 *       backdropFilter: 'none',
 *       bg: 'rgba(0,0,0,0.8)',
 *     })}
 *   />
 * );
 * ```
 */
export function useDeviceStyles() {
  const { shouldUseSimplifiedLayout } = useDeviceDetection();

  return function getStyles<T>(normalStyles: T, fallbackStyles: T): T {
    return shouldUseSimplifiedLayout ? fallbackStyles : normalStyles;
  };
}
