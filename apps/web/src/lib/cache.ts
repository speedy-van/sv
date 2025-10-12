/**
 * Cache utilities for Speedy Van
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
export const cache = new MemoryCache();

// Cache decorator for functions
export function cached<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ttl: number = 300000,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator 
      ? keyGenerator(...args)
      : `cache:${fn.name}:${JSON.stringify(args)}`;
    
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    const result = await fn(...args);
    cache.set(key, result, ttl);
    return result;
  }) as T;
}

// Cache utilities for specific data types
export const pricingCache = {
  set: (key: string, data: any, ttl: number = 600000) => cache.set(`pricing:${key}`, data, ttl),
  get: (key: string) => cache.get(`pricing:${key}`),
  delete: (key: string) => cache.delete(`pricing:${key}`),
};

export const placesCache = {
  set: (key: string, data: any, ttl: number = 3600000) => cache.set(`places:${key}`, data, ttl), // 1 hour
  get: (key: string) => cache.get(`places:${key}`),
  delete: (key: string) => cache.delete(`places:${key}`),
};

export const userCache = {
  set: (key: string, data: any, ttl: number = 300000) => cache.set(`user:${key}`, data, ttl),
  get: (key: string) => cache.get(`user:${key}`),
  delete: (key: string) => cache.delete(`user:${key}`),
};

// Auto-cleanup every 5 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    cache.cleanup();
  }, 300000);
}

// Additional exports for realtime data hook
export const useCachedData = (key: string, fetcher: () => Promise<any>) => {
  // Mock implementation for now
  return {
    data: null,
    error: null,
    mutate: () => {},
  };
};

export const cacheConfigs = {
  fast: { ttl: 60000 }, // 1 minute
  standard: { ttl: 300000 }, // 5 minutes
  slow: { ttl: 1800000 }, // 30 minutes
  realtime: { ttl: 30000 }, // 30 seconds
};

export const cacheUtils = {
  invalidate: (key: string) => cache.delete(key),
  set: (key: string, data: any, ttl: number = 300000) => cache.set(key, data, ttl),
  get: (key: string) => cache.get(key),
};

export const conflictUtils = {
  mergeData: (optimistic: any, server: any, strategy: string) => {
    switch (strategy) {
      case 'optimistic':
        return optimistic;
      case 'server':
        return server;
      case 'merge':
      default:
        return { ...server, ...optimistic };
    }
  },
};

export default cache;