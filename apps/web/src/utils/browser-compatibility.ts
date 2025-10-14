/**
 * Cross-Browser Compatibility Utilities
 * 
 * Handles browser detection, feature support, and polyfills
 * Ensures consistent behavior across Safari, Chrome, Edge, Firefox
 */

export interface BrowserInfo {
  name: string;
  version: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  supportsWebP: boolean;
  supportsTouch: boolean;
  supportsHover: boolean;
  supportsPointerEvents: boolean;
  supportsIntersectionObserver: boolean;
  supportsResizeObserver: boolean;
  supportsContainerQueries: boolean;
  supportsViewportUnits: boolean;
  supportsSafeAreaInsets: boolean;
}

export interface FeatureSupport {
  webp: boolean;
  avif: boolean;
  webgl: boolean;
  webgl2: boolean;
  serviceWorker: boolean;
  pushNotifications: boolean;
  geolocation: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  webSockets: boolean;
  fetch: boolean;
  promises: boolean;
  asyncAwait: boolean;
  modules: boolean;
  customElements: boolean;
  shadowDOM: boolean;
  cssGrid: boolean;
  cssFlexbox: boolean;
  cssCustomProperties: boolean;
  cssContainerQueries: boolean;
}

/**
 * Detect browser information
 */
export function detectBrowser(): BrowserInfo {
  const userAgent = navigator.userAgent;
  const vendor = navigator.vendor;
  
  let name = 'Unknown';
  let version = 'Unknown';
  
  // Browser detection
  if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Chrome')) {
    if (userAgent.includes('Edg')) {
      name = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    } else {
      name = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
    }
  } else if (userAgent.includes('Edge')) {
    name = 'Edge Legacy';
    const match = userAgent.match(/Edge\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  }
  
  // Device detection
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bTablet\b)|Android(?=.*\bTablet\b)/i.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  
  // Feature detection
  const supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const supportsHover = window.matchMedia('(hover: hover)').matches;
  const supportsPointerEvents = 'PointerEvent' in window;
  const supportsIntersectionObserver = 'IntersectionObserver' in window;
  const supportsResizeObserver = 'ResizeObserver' in window;
  const supportsViewportUnits = CSS.supports('height', '100vh');
  const supportsSafeAreaInsets = CSS.supports('padding', 'env(safe-area-inset-top)');
  
  // WebP support detection
  const supportsWebP = (() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  })();
  
  // Container queries support
  const supportsContainerQueries = CSS.supports('container-type', 'inline-size');
  
  return {
    name,
    version,
    isMobile,
    isTablet,
    isDesktop,
    supportsWebP,
    supportsTouch,
    supportsHover,
    supportsPointerEvents,
    supportsIntersectionObserver,
    supportsResizeObserver,
    supportsContainerQueries,
    supportsViewportUnits,
    supportsSafeAreaInsets,
  };
}

/**
 * Comprehensive feature detection
 */
export function detectFeatureSupport(): FeatureSupport {
  return {
    webp: (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    })(),
    
    avif: (() => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    })(),
    
    webgl: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch {
        return false;
      }
    })(),
    
    webgl2: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!canvas.getContext('webgl2');
      } catch {
        return false;
      }
    })(),
    
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    geolocation: 'geolocation' in navigator,
    localStorage: (() => {
      try {
        const test = 'test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    })(),
    
    sessionStorage: (() => {
      try {
        const test = 'test';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    })(),
    
    indexedDB: 'indexedDB' in window,
    webSockets: 'WebSocket' in window,
    fetch: 'fetch' in window,
    promises: 'Promise' in window,
    asyncAwait: (() => {
      try {
        return (async () => {})().constructor === (async () => {}).constructor;
      } catch {
        return false;
      }
    })(),
    
    modules: 'noModule' in HTMLScriptElement.prototype,
    customElements: 'customElements' in window,
    shadowDOM: 'attachShadow' in Element.prototype,
    
    cssGrid: CSS.supports('display', 'grid'),
    cssFlexbox: CSS.supports('display', 'flex'),
    cssCustomProperties: CSS.supports('--custom', 'property'),
    cssContainerQueries: CSS.supports('container-type', 'inline-size'),
  };
}

/**
 * Safari-specific fixes and optimizations
 */
export function applySafariFixes(): void {
  const browser = detectBrowser();
  
  if (browser.name === 'Safari') {
    // Fix viewport height on iOS Safari
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', setViewportHeight);
    
    // Fix input zoom on iOS
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"], select, textarea');
    inputs.forEach((input) => {
      if (input instanceof HTMLElement) {
        input.style.fontSize = '16px';
      }
    });
    
    // Fix scroll momentum
    (document.body.style as any).webkitOverflowScrolling = 'touch';
    
    // Fix date input styling
    const dateInputs = document.querySelectorAll('input[type="date"], input[type="time"]');
    dateInputs.forEach((input) => {
      if (input instanceof HTMLElement) {
        input.style.webkitAppearance = 'none';
        input.style.borderRadius = '8px';
      }
    });
  }
}

/**
 * Add browser-specific CSS classes
 */
export function addBrowserClasses(): void {
  const browser = detectBrowser();
  const features = detectFeatureSupport();
  
  const classes = [
    `browser-${browser.name.toLowerCase()}`,
    `browser-version-${browser.version}`,
    browser.isMobile ? 'device-mobile' : '',
    browser.isTablet ? 'device-tablet' : '',
    browser.isDesktop ? 'device-desktop' : '',
    browser.supportsTouch ? 'supports-touch' : 'no-touch',
    browser.supportsHover ? 'supports-hover' : 'no-hover',
    features.webp ? 'supports-webp' : 'no-webp',
    features.cssGrid ? 'supports-grid' : 'no-grid',
    features.cssFlexbox ? 'supports-flexbox' : 'no-flexbox',
    features.cssContainerQueries ? 'supports-container-queries' : 'no-container-queries',
  ].filter(Boolean);
  
  document.documentElement.classList.add(...classes);
}

/**
 * Polyfill for missing features
 */
export function loadPolyfills(): Promise<void> {
  const features = detectFeatureSupport();
  const polyfills: Promise<void>[] = [];
  
  // Simple polyfills that don't require external packages
  if (!features.promises && typeof Promise === 'undefined') {
    // Basic Promise polyfill for very old browsers
    (window as any).Promise = class SimplePromise {
      constructor(executor: (resolve: Function, reject: Function) => void) {
        const resolve = (value: any) => {
          setTimeout(() => {
            if (this.onResolve) this.onResolve(value);
          }, 0);
        };
        const reject = (reason: any) => {
          setTimeout(() => {
            if (this.onReject) this.onReject(reason);
          }, 0);
        };
        executor(resolve, reject);
      }
      
      private onResolve?: Function;
      private onReject?: Function;
      
      then(onResolve?: Function, onReject?: Function) {
        this.onResolve = onResolve;
        this.onReject = onReject;
        return this;
      }
      
      catch(onReject: Function) {
        this.onReject = onReject;
        return this;
      }
      
      static resolve(value: any) {
        return new SimplePromise((resolve) => resolve(value));
      }
      
      static reject(reason: any) {
        return new SimplePromise((_, reject) => reject(reason));
      }
    };
  }
  
  // Fetch polyfill for older browsers
  if (!features.fetch && typeof fetch === 'undefined') {
    (window as any).fetch = function(url: string, options: any = {}) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(options.method || 'GET', url);
        
        if (options.headers) {
          Object.keys(options.headers).forEach(key => {
            xhr.setRequestHeader(key, options.headers[key]);
          });
        }
        
        xhr.onload = () => {
          resolve({
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            text: () => Promise.resolve(xhr.responseText),
            json: () => Promise.resolve(JSON.parse(xhr.responseText)),
          });
        };
        
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(options.body);
      });
    };
  }
  
  // ResizeObserver polyfill
  if (!window.ResizeObserver) {
    window.ResizeObserver = class ResizeObserver {
      private callback: Function;
      private elements: Set<Element> = new Set();
      private rafId?: number;
      
      constructor(callback: Function) {
        this.callback = callback;
      }
      
      observe(element: Element) {
        this.elements.add(element);
        this.scheduleCheck();
      }
      
      unobserve(element: Element) {
        this.elements.delete(element);
      }
      
      disconnect() {
        this.elements.clear();
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
        }
      }
      
      private scheduleCheck() {
        if (this.rafId) return;
        this.rafId = requestAnimationFrame(() => {
          this.rafId = undefined;
          const entries = Array.from(this.elements).map(element => ({
            target: element,
            contentRect: element.getBoundingClientRect(),
          }));
          if (entries.length > 0) {
            this.callback(entries);
          }
          if (this.elements.size > 0) {
            this.scheduleCheck();
          }
        });
      }
    };
  }
  
  // IntersectionObserver polyfill
  if (!window.IntersectionObserver) {
    (window as any).IntersectionObserver = class IntersectionObserver {
      private callback: Function;
      private elements: Set<Element> = new Set();
      private rafId?: number;
      
      root: Element | null = null;
      rootMargin: string = '0px';
      thresholds: ReadonlyArray<number> = [0];
      
      constructor(callback: Function, options: any = {}) {
        this.callback = callback;
        this.root = options.root || null;
        this.rootMargin = options.rootMargin || '0px';
        this.thresholds = options.thresholds || [0];
      }
      
      observe(element: Element) {
        this.elements.add(element);
        this.scheduleCheck();
      }
      
      unobserve(element: Element) {
        this.elements.delete(element);
      }
      
      disconnect() {
        this.elements.clear();
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
        }
      }
      
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
      
      private scheduleCheck() {
        if (this.rafId) return;
        this.rafId = requestAnimationFrame(() => {
          this.rafId = undefined;
          const entries = Array.from(this.elements).map(element => {
            const rect = element.getBoundingClientRect();
            const isIntersecting = rect.top < window.innerHeight && rect.bottom > 0;
            return {
              target: element,
              isIntersecting,
              intersectionRatio: isIntersecting ? 1 : 0,
              boundingClientRect: rect,
              intersectionRect: rect,
              rootBounds: null,
              time: Date.now(),
            };
          });
          if (entries.length > 0) {
            this.callback(entries);
          }
          if (this.elements.size > 0) {
            this.scheduleCheck();
          }
        });
      }
    };
  }
  
  return Promise.resolve();
}

/**
 * Optimize performance based on browser capabilities
 */
export function optimizePerformance(): void {
  const browser = detectBrowser();
  const features = detectFeatureSupport();
  
  // Disable animations on low-end devices
  if (browser.isMobile && !features.webgl) {
    document.documentElement.classList.add('reduce-animations');
  }
  
  // Use passive event listeners where possible
  if ('passive' in document.createElement('div')) {
    const passiveEvents = ['touchstart', 'touchmove', 'wheel'];
    passiveEvents.forEach(event => {
      document.addEventListener(event, () => {}, { passive: true });
    });
  }
  
  // Preload critical resources
  if (features.fetch) {
    // Preload fonts
    const fontUrls = [
      '/fonts/inter-var.woff2',
      '/fonts/inter-var-italic.woff2',
    ];
    
    fontUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }
}

/**
 * Handle browser-specific input behaviors
 */
export function setupInputHandlers(): void {
  const browser = detectBrowser();
  
  // Safari iOS specific input handling
  if (browser.name === 'Safari' && browser.isMobile) {
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        if (input instanceof HTMLElement) {
          input.style.fontSize = '16px';
        }
      });
    });
    
    // Handle viewport changes on keyboard show/hide
    let initialViewportHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
      const currentHeight = window.innerHeight;
      const heightDifference = initialViewportHeight - currentHeight;
      
      if (heightDifference > 150) {
        // Keyboard is likely open
        document.body.classList.add('keyboard-open');
      } else {
        // Keyboard is likely closed
        document.body.classList.remove('keyboard-open');
      }
    });
  }
  
  // Firefox specific input handling
  if (browser.name === 'Firefox') {
    // Fix number input spinner styling
    const numberInputs = document.querySelectorAll('input[type="number"]');
    numberInputs.forEach(input => {
      if (input instanceof HTMLElement) {
        (input.style as any).mozAppearance = 'textfield';
      }
    });
  }
}

/**
 * Initialize all browser compatibility features
 */
export function initializeBrowserCompatibility(): void {
  // Add browser classes
  addBrowserClasses();
  
  // Apply Safari-specific fixes
  applySafariFixes();
  
  // Setup input handlers
  setupInputHandlers();
  
  // Optimize performance
  optimizePerformance();
  
  // Load polyfills
  loadPolyfills().catch(console.error);
  
  console.log('Browser compatibility initialized:', detectBrowser());
}

/**
 * Get optimal image format based on browser support
 */
export function getOptimalImageFormat(): 'avif' | 'webp' | 'jpg' {
  const features = detectFeatureSupport();
  
  if (features.avif) return 'avif';
  if (features.webp) return 'webp';
  return 'jpg';
}

/**
 * Check if device prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if device is in dark mode
 */
export function prefersDarkMode(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Get device pixel ratio for high-DPI displays
 */
export function getDevicePixelRatio(): number {
  return window.devicePixelRatio || 1;
}

/**
 * Check if device has sufficient memory
 */
export function hasSufficientMemory(): boolean {
  const navigator = window.navigator as any;
  if (navigator.deviceMemory) {
    return navigator.deviceMemory >= 4; // 4GB or more
  }
  return true; // Assume sufficient if unknown
}

/**
 * Get network connection information
 */
export function getNetworkInfo(): {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
} {
  const navigator = window.navigator as any;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (connection) {
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
  
  return {};
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
