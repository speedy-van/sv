/**
 * Device Detection Utilities
 * 
 * Detects Safari 17+ on iPhone 15-17 to apply layout fallbacks
 * for known Safari bugs (flex/grid collapse, backdrop-filter issues)
 */

/**
 * Detects if the current device is iPhone 15, 16, or 17
 * running Safari iOS 17+ (where layout bugs occur)
 */
export function isSafari17Plus(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent;
  
  // Check for Safari (not Chrome or other browsers using WebKit)
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|EdgiOS|FxiOS/.test(ua);
  
  // Check for iOS 17, 18, or 19
  const isIOS17Plus = /iPhone.*OS (1[7-9]|[2-9]\d)/.test(ua);
  
  return isSafari && isIOS17Plus;
}

/**
 * Detects if the current device is specifically iPhone 15, 16, or 17
 * These models are most affected by the Safari 17 layout bugs
 */
export function isAffectedIPhone(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent;
  
  // Check for iPhone with iOS 17+
  const isIPhone = /iPhone/.test(ua);
  const isIOS17Plus = /OS (1[7-9]|[2-9]\d)/.test(ua);
  
  // iPhone 15 was released with iOS 17, so any iPhone with iOS 17+ is potentially affected
  // We can't reliably detect specific iPhone models (15/16/17) from user agent alone,
  // so we treat all iPhones with iOS 17+ as potentially affected
  return isIPhone && isIOS17Plus;
}

/**
 * Detects if backdrop-filter is supported but buggy
 * Safari 17+ has backdrop-filter support but it causes layout issues
 */
export function hasBackdropFilterBug(): boolean {
  if (typeof window === 'undefined') return false;
  
  // If it's Safari 17+ on iPhone, backdrop-filter is buggy
  return isSafari17Plus();
}

/**
 * Detects if the browser has the flex/grid collapse bug
 * Safari 17 introduced regressions in flex/grid combinations
 */
export function hasFlexGridBug(): boolean {
  if (typeof window === 'undefined') return false;
  
  return isSafari17Plus();
}

/**
 * Returns a CSS class name to apply device-specific fixes
 */
export function getDeviceClass(): string {
  if (typeof window === 'undefined') return '';
  
  if (isSafari17Plus()) {
    return 'safari-17-plus';
  }
  
  if (isAffectedIPhone()) {
    return 'iphone-ios-17-plus';
  }
  
  return '';
}

/**
 * Detects if we should use simplified layout
 * Returns true for devices with known layout bugs
 */
export function shouldUseSimplifiedLayout(): boolean {
  return isSafari17Plus() || isAffectedIPhone();
}

/**
 * Detects iOS version
 */
export function getIOSVersion(): number | null {
  if (typeof window === 'undefined') return null;
  
  const ua = navigator.userAgent;
  const match = ua.match(/OS (\d+)_/);
  
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  
  return null;
}

/**
 * Comprehensive device info for debugging
 */
export function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      isSafari17Plus: false,
      isAffectedIPhone: false,
      hasBackdropFilterBug: false,
      hasFlexGridBug: false,
      shouldUseSimplifiedLayout: false,
      iosVersion: null,
      userAgent: '',
    };
  }
  
  return {
    isSafari17Plus: isSafari17Plus(),
    isAffectedIPhone: isAffectedIPhone(),
    hasBackdropFilterBug: hasBackdropFilterBug(),
    hasFlexGridBug: hasFlexGridBug(),
    shouldUseSimplifiedLayout: shouldUseSimplifiedLayout(),
    iosVersion: getIOSVersion(),
    userAgent: navigator.userAgent,
  };
}
