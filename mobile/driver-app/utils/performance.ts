import { useMemo, useCallback, useRef, useState } from 'react';
import { Dimensions, Platform } from 'react-native';

// Performance optimization utilities for React Native

export interface ListItem {
  id: string | number;
  [key: string]: any;
}

// Smart list virtualization without external dependencies
export const useOptimizedList = <T extends ListItem>(
  data: T[],
  itemHeight: number = 100,
  containerHeight?: number
) => {
  const { height: screenHeight } = Dimensions.get('window');
  const listHeight = containerHeight || screenHeight;

  // Calculate visible range for virtualization
  const getVisibleRange = useCallback((scrollOffset: number) => {
    const startIndex = Math.max(0, Math.floor(scrollOffset / itemHeight) - 2);
    const endIndex = Math.min(
      data.length - 1,
      Math.ceil((scrollOffset + listHeight) / itemHeight) + 2
    );

    return { startIndex, endIndex };
  }, [data.length, itemHeight, listHeight]);

  // Memoized visible items
  const visibleItems = useMemo(() => {
    return data; // In a real implementation, this would slice based on visible range
  }, [data]);

  return {
    visibleItems,
    getVisibleRange,
    itemHeight,
    listHeight,
  };
};

// Smart image optimization
export const useOptimizedImage = (
  source: { uri: string } | number,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'png' | 'jpg';
    progressive?: boolean;
  } = {}
) => {
  const { width, height, quality = 0.8, format = 'webp', progressive = true } = options;

  const optimizedSource = useMemo(() => {
    if (typeof source === 'number') {
      return source; // Local images don't need optimization
    }

    // Build optimized URL with query parameters
    const url = new URL(source.uri);

    if (width) url.searchParams.set('w', width.toString());
    if (height) url.searchParams.set('h', height.toString());
    if (quality) url.searchParams.set('q', quality.toString());
    if (format) url.searchParams.set('f', format);
    if (progressive) url.searchParams.set('p', '1');

    return {
      uri: url.toString(),
      width,
      height,
      cache: 'force-cache' as const,
    };
  }, [source, width, height, quality, format, progressive]);

  return optimizedSource;
};

// Memory-efficient component recycling
export class ComponentPool<T> {
  private pool: Map<string, T[]> = new Map();
  private maxPoolSize = 10;

  get(key: string, factory: () => T): T {
    const pool = this.pool.get(key) || [];
    const item = pool.pop();

    if (item) {
      this.pool.set(key, pool);
      return item;
    }

    return factory();
  }

  release(key: string, item: T): void {
    const pool = this.pool.get(key) || [];
    if (pool.length < this.maxPoolSize) {
      pool.push(item);
      this.pool.set(key, pool);
    }
  }

  clear(key?: string): void {
    if (key) {
      this.pool.delete(key);
    } else {
      this.pool.clear();
    }
  }
}

// Global component pool instance
export const componentPool = new ComponentPool();

// Smart debouncing for search and API calls
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useMemo(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Smart throttling for scroll events
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRan = useRef(Date.now());

  return useCallback(((...args) => {
    if (Date.now() - lastRan.current >= delay) {
      callback(...args);
      lastRan.current = Date.now();
    }
  }) as T, [callback, delay]);
};

// Memory-efficient state management
export const useOptimizedState = <T>(initialValue: T) => {
  const [state, setState] = useState(initialValue);
  const setStateOptimized = useCallback((value: T | ((prev: T) => T)) => {
    // Only update if value has actually changed
    setState(prev => {
      const newValue = typeof value === 'function' ? (value as Function)(prev) : value;
      return Object.is(prev, newValue) ? prev : newValue;
    });
  }, []);

  return [state, setStateOptimized] as const;
};

// Smart intersection observer for lazy loading
export const useLazyLoad = (
  threshold: number = 0.1,
  rootMargin: string = '50px'
) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  const ref = useRef<any>(null);

  // In React Native, we use a simpler approach
  const checkVisibility = useCallback(() => {
    if (ref.current && !hasBeenVisible) {
      // Simple visibility check - in production, you'd use a more sophisticated approach
      setIsVisible(true);
      setHasBeenVisible(true);
    }
  }, [hasBeenVisible]);

  return {
    ref,
    isVisible: isVisible || hasBeenVisible,
    hasBeenVisible,
    checkVisibility,
  };
};

// Performance monitoring utilities
export const PerformanceMonitor = {
  startTiming: (label: string): (() => number) => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      return duration;
    };
  },

  measureRenderTime: (componentName: string) => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      console.log(`[Render] ${componentName}: ${(endTime - startTime).toFixed(2)}ms`);
    };
  },

  measureMemoryUsage: () => {
    if (Platform.OS === 'web') {
      // @ts-ignore
      if (performance.memory) {
        // @ts-ignore
        const { usedJSHeapSize, totalJSHeapSize } = performance.memory;
        console.log(`[Memory] Used: ${(usedJSHeapSize / 1024 / 1024).toFixed(2)}MB, Total: ${(totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      }
    }
  }
};

// Smart caching with TTL
export class SmartCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();

  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global cache instances
export const imageCache = new SmartCache<string>();
export const dataCache = new SmartCache<any>();

// Network optimization
export const NetworkOptimizer = {
  // Smart retry with exponential backoff
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  },

  // Smart preloading for better UX
  preloadImage: async (uri: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = uri;
    });
  },

  // Request deduplication
  requestDedupe: (() => {
    const pendingRequests = new Map<string, Promise<any>>();

    return <T>(key: string, request: () => Promise<T>): Promise<T> => {
      if (pendingRequests.has(key)) {
        return pendingRequests.get(key)!;
      }

      const promise = request().finally(() => {
        pendingRequests.delete(key);
      });

      pendingRequests.set(key, promise);
      return promise;
    };
  })()
};
