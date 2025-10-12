/**
 * Performance Monitoring Utility
 * Tracks and reports on application performance metrics
 */

export interface PerformanceMetrics {
  // Navigation Timing API metrics
  navigationStart: number;
  loadEventEnd: number;
  domContentLoadedEventEnd: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;

  // Custom metrics
  timeToInteractive: number;
  bundleLoadTime: number;
  apiResponseTime: number;

  // Memory usage
  memoryUsage?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
}

export interface PerformanceReport {
  timestamp: number;
  url: string;
  metrics: PerformanceMetrics;
  userAgent: string;
  connection?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private observers: Map<string, PerformanceObserver>;
  private isInitialized = false;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.observers = new Map();
  }

  private initializeMetrics(): PerformanceMetrics {
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;

    return {
      navigationStart: navigation?.startTime || 0,
      loadEventEnd: navigation?.loadEventEnd || 0,
      domContentLoadedEventEnd: navigation?.domContentLoadedEventEnd || 0,
      timeToInteractive: 0,
      bundleLoadTime: 0,
      apiResponseTime: 0,
    };
  }

  /**
   * Initialize performance monitoring
   */
  public initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.setupObservers();
    this.trackBundleLoadTime();
    this.trackMemoryUsage();
    this.isInitialized = true;
  }

  /**
   * Set up performance observers
   */
  private setupObservers(): void {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      const fcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const fcp = entries[entries.length - 1];
        this.metrics.firstContentfulPaint = fcp.startTime;
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lcp = entries[entries.length - 1];
        this.metrics.largestContentfulPaint = lcp.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      this.observers.set('fcp', fcpObserver);
      this.observers.set('lcp', lcpObserver);
    }
  }

  /**
   * Track bundle load time
   */
  private trackBundleLoadTime(): void {
    const scriptEntries = performance
      .getEntriesByType('resource')
      .filter(
        entry => entry.name.includes('.js') || entry.name.includes('.css')
      );

    if (scriptEntries.length > 0) {
      const totalLoadTime = scriptEntries.reduce(
        (sum, entry) => sum + entry.duration,
        0
      );
      this.metrics.bundleLoadTime = totalLoadTime;
    }
  }

  /**
   * Track memory usage
   */
  private trackMemoryUsage(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
  }

  /**
   * Track API response time
   */
  public trackApiCall(url: string, startTime: number, endTime: number): void {
    const responseTime = endTime - startTime;
    this.metrics.apiResponseTime = responseTime;

    // Log slow API calls
    if (responseTime > 1000) {
      console.warn(`Slow API call detected: ${url} took ${responseTime}ms`);
    }
  }

  /**
   * Calculate Time to Interactive
   */
  private calculateTTI(): number {
    const navigation = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming;
    return navigation?.domContentLoadedEventEnd || 0;
  }

  /**
   * Get current performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    this.metrics.timeToInteractive = this.calculateTTI();
    return { ...this.metrics };
  }

  /**
   * Generate performance report
   */
  public generateReport(): PerformanceReport {
    const connection = (navigator as any).connection;

    return {
      timestamp: Date.now(),
      url: window.location.href,
      metrics: this.getMetrics(),
      userAgent: navigator.userAgent,
      connection: connection
        ? {
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt,
          }
        : undefined,
    };
  }

  /**
   * Send performance report to analytics
   */
  public async sendReport(): Promise<void> {
    try {
      const report = this.generateReport();

      // Send to analytics service (e.g., Sentry, Google Analytics)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'performance_metrics', {
          event_category: 'performance',
          event_label: report.url,
          value: report.metrics.timeToInteractive,
          custom_map: {
            fcp: report.metrics.firstContentfulPaint,
            lcp: report.metrics.largestContentfulPaint,
            bundle_load_time: report.metrics.bundleLoadTime,
            api_response_time: report.metrics.apiResponseTime,
          },
        });
      }

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Performance Report:', report);
      }
    } catch (error) {
      console.error('Failed to send performance report:', error);
    }
  }

  /**
   * Check if performance meets targets
   */
  public checkPerformanceTargets(): {
    passed: boolean;
    issues: string[];
  } {
    const metrics = this.getMetrics();
    const issues: string[] = [];

    // Performance targets
    if (metrics.timeToInteractive > 3500) {
      issues.push('Time to Interactive exceeds 3.5s target');
    }

    if (metrics.bundleLoadTime > 2000) {
      issues.push('Bundle load time exceeds 2s target');
    }

    if (metrics.apiResponseTime > 1000) {
      issues.push('API response time exceeds 1s target');
    }

    if (metrics.firstContentfulPaint && metrics.firstContentfulPaint > 1500) {
      issues.push('First Contentful Paint exceeds 1.5s target');
    }

    if (
      metrics.largestContentfulPaint &&
      metrics.largestContentfulPaint > 2500
    ) {
      issues.push('Largest Contentful Paint exceeds 2.5s target');
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }

  /**
   * Clean up observers
   */
  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = (): PerformanceMonitor => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
};

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  const monitor = getPerformanceMonitor();
  monitor.initialize();

  // Send report on page unload
  window.addEventListener('beforeunload', () => {
    monitor.sendReport();
  });
}

export default PerformanceMonitor;
