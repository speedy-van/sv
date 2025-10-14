/**
 * Address Cache Service - TTL-based caching for address autocomplete
 * Reduces API calls by storing recent queries with automatic cleanup
 */

import type { AddressCache, CacheEntry, Provider } from '@/types/dual-provider-address';

export class AddressCacheService implements AddressCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTtl: number;
  private readonly maxSize: number;
  private cleanupInterval?: ReturnType<typeof setInterval>;
  private hits = 0;
  private misses = 0;

  constructor(defaultTtl = 5 * 60 * 1000, maxSize = 500) { // 5 minutes, 500 entries
    this.defaultTtl = defaultTtl;
    this.maxSize = maxSize;
    this.startCleanupInterval();
  }

  /**
   * Get cached value if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      // Entry has expired, remove it
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.data as T;
  }

  /**
   * Set cache value with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number, provider?: Provider): void {
    // Enforce cache size limit
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl,
      provider: provider || 'google', // Default to google if not specified
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete a specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Remove expired entries (called automatically via interval)
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats() {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;

    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate,
    };
  }

  /**
   * Generate cache key for address queries
   */
  static generateKey(query: string, provider?: string): string {
    const normalizedQuery = query.toLowerCase().trim();
    const keyBase = `autocomplete:${normalizedQuery}`;
    return provider ? `${keyBase}:${provider}` : keyBase;
  }

  /**
   * Destroy the service and cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.cache.clear();
  }

  private evictOldest(): void {
    // Remove the oldest entry (first inserted)
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
    }
  }

  private startCleanupInterval(): void {
    // Run cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 2 * 60 * 1000);

    // Cleanup interval should not prevent process exit
    if (typeof window === 'undefined') {
      this.cleanupInterval.unref?.();
    }
  }
}

// Singleton instance for global use
export const addressCache = new AddressCacheService();

// Browser-only: Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    addressCache.destroy();
  });
}