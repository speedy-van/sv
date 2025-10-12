import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  
  // Other important metrics
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom metrics
  loadTime?: number;
  renderTime?: number;
  interactionTime?: number;
}

/**
 * Hook for monitoring Core Web Vitals and performance metrics
 */
export const usePerformanceMetrics = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if Performance Observer is supported
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      setIsSupported(true);
    }

    if (!isSupported) return;

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      
      setMetrics(prev => ({
        ...prev,
        lcp: lastEntry.startTime,
      }));
    });

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        setMetrics(prev => ({
          ...prev,
          fid: entry.processingStart - entry.startTime,
        }));
      });
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          setMetrics(prev => ({
            ...prev,
            cls: clsValue,
          }));
        }
      });
    });

    // First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({
            ...prev,
            fcp: entry.startTime,
          }));
        }
      });
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      fidObserver.observe({ entryTypes: ['first-input'] });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('Performance Observer not fully supported:', error);
    }

    // Navigation timing for TTFB and load time
    const updateNavigationMetrics = () => {
      if (typeof window !== 'undefined' && window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const navigation = window.performance.getEntriesByType('navigation')[0] as any;

        setMetrics(prev => ({
          ...prev,
          ttfb: navigation ? navigation.responseStart - navigation.requestStart : 0,
          loadTime: timing.loadEventEnd - timing.navigationStart,
        }));
      }
    };

    // Update metrics when page loads
    if (document.readyState === 'complete') {
      updateNavigationMetrics();
    } else {
      window.addEventListener('load', updateNavigationMetrics);
    }

    // Cleanup
    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
      fcpObserver.disconnect();
      window.removeEventListener('load', updateNavigationMetrics);
    };
  }, [isSupported]);

  return { metrics, isSupported };
};

/**
 * Hook for measuring component render performance
 */
export const useRenderPerformance = (componentName: string) => {
  const renderStartTime = useRef<number>();
  const [renderTime, setRenderTime] = useState<number>();

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    if (renderStartTime.current) {
      const endTime = performance.now();
      const duration = endTime - renderStartTime.current;
      setRenderTime(duration);
      
      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render time: ${duration.toFixed(2)}ms`);
      }
    }
  });

  return renderTime;
};

/**
 * Hook for lazy loading with Intersection Observer
 */
export const useLazyLoading = (options?: IntersectionObserverInit) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
  };
};

/**
 * Hook for measuring network performance
 */
export const useNetworkPerformance = () => {
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
    saveData?: boolean;
  }>({});

  useEffect(() => {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      if (connection) {
        const updateNetworkInfo = () => {
          setNetworkInfo({
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
            saveData: connection.saveData,
          });
        };

        updateNetworkInfo();
        connection.addEventListener('change', updateNetworkInfo);

        return () => {
          connection.removeEventListener('change', updateNetworkInfo);
        };
      }
    }
  }, []);

  return networkInfo;
};

/**
 * Hook for memory usage monitoring
 */
export const useMemoryUsage = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  }>({});

  useEffect(() => {
    const updateMemoryInfo = () => {
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
        const memory = (window.performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

/**
 * Hook for performance budget monitoring
 */
export const usePerformanceBudget = (budgets: {
  lcp?: number;
  fid?: number;
  cls?: number;
  loadTime?: number;
}) => {
  const { metrics } = usePerformanceMetrics();
  const [violations, setViolations] = useState<string[]>([]);

  useEffect(() => {
    const newViolations: string[] = [];

    if (budgets.lcp && metrics.lcp && metrics.lcp > budgets.lcp) {
      newViolations.push(`LCP exceeded budget: ${metrics.lcp.toFixed(2)}ms > ${budgets.lcp}ms`);
    }

    if (budgets.fid && metrics.fid && metrics.fid > budgets.fid) {
      newViolations.push(`FID exceeded budget: ${metrics.fid.toFixed(2)}ms > ${budgets.fid}ms`);
    }

    if (budgets.cls && metrics.cls && metrics.cls > budgets.cls) {
      newViolations.push(`CLS exceeded budget: ${metrics.cls.toFixed(3)} > ${budgets.cls}`);
    }

    if (budgets.loadTime && metrics.loadTime && metrics.loadTime > budgets.loadTime) {
      newViolations.push(`Load time exceeded budget: ${metrics.loadTime.toFixed(2)}ms > ${budgets.loadTime}ms`);
    }

    setViolations(newViolations);
  }, [metrics, budgets]);

  return {
    violations,
    isWithinBudget: violations.length === 0,
  };
};

/**
 * Hook for image loading performance
 */
export const useImagePerformance = () => {
  const [imageMetrics, setImageMetrics] = useState<{
    loadTime?: number;
    size?: number;
    format?: string;
  }>({});

  const measureImageLoad = useCallback((imageElement: HTMLImageElement) => {
    const startTime = performance.now();

    const handleLoad = () => {
      const loadTime = performance.now() - startTime;
      
      // Get image size if possible
      const size = imageElement.naturalWidth * imageElement.naturalHeight;
      
      // Detect format from src
      const format = imageElement.src.split('.').pop()?.toLowerCase();

      setImageMetrics({
        loadTime,
        size,
        format,
      });
    };

    const handleError = () => {
      console.warn('Image failed to load:', imageElement.src);
    };

    if (imageElement.complete) {
      handleLoad();
    } else {
      imageElement.addEventListener('load', handleLoad, { once: true });
      imageElement.addEventListener('error', handleError, { once: true });
    }

    return () => {
      imageElement.removeEventListener('load', handleLoad);
      imageElement.removeEventListener('error', handleError);
    };
  }, []);

  return {
    imageMetrics,
    measureImageLoad,
  };
};

/**
 * Hook for scroll performance monitoring
 */
export const useScrollPerformance = () => {
  const [scrollMetrics, setScrollMetrics] = useState<{
    fps?: number;
    isSmooth?: boolean;
  }>({});

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setScrollMetrics(prev => ({
          ...prev,
          fps,
          isSmooth: fps >= 55, // Consider 55+ FPS as smooth
        }));
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    const handleScroll = () => {
      if (!animationId) {
        animationId = requestAnimationFrame(measureFPS);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return scrollMetrics;
};

export default {
  usePerformanceMetrics,
  useRenderPerformance,
  useLazyLoading,
  useNetworkPerformance,
  useMemoryUsage,
  usePerformanceBudget,
  useImagePerformance,
  useScrollPerformance,
};

