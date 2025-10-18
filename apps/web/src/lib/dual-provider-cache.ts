/**
 * Multi-Provider Caching System
 * Intelligent caching for Google Places and Mapbox API responses
 */

import type { Provider, AddressSuggestion, CacheEntry, CacheStats } from '@/types/dual-provider-address';

interface CacheConfig {
  defaultTtl: number;
  maxSize: number;
  providerSpecificTtl: {
    google: number;
    mapbox: number;
  };
  enableCrossProviderValidation: boolean;
}

export class DualProviderCache {
  private static instance: DualProviderCache;
  private cache = new Map<string, CacheEntry<any>>();
  private stats = {
    hits: 0,
    misses: 0,
    size: 0,
    providers: {
      google: 0,
      mapbox: 0,
    },
  };

  private config: CacheConfig = {
    defaultTtl: 24 * 60 * 60 * 1000, // 24 hours
    maxSize: 1000,
    providerSpecificTtl: {
      google: 24 * 60 * 60 * 1000, // 24 hours
      mapbox: 12 * 60 * 60 * 1000, // 12 hours
    },
    enableCrossProviderValidation: true,
  };

  constructor(config?: Partial<CacheConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  static getInstance(config?: Partial<CacheConfig>): DualProviderCache {
    if (!DualProviderCache.instance) {
      DualProviderCache.instance = new DualProviderCache(config);
    }
    return DualProviderCache.instance;
  }

  /**
   * Get cached address suggestions
   */
  getAddressSuggestions(query: string, provider?: Provider): AddressSuggestion[] | null {
    const cacheKey = this.generateAddressKey(query, provider);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Cache address suggestions
   */
  setAddressSuggestions(
    query: string, 
    suggestions: AddressSuggestion[], 
    provider: Provider
  ): void {
    const cacheKey = this.generateAddressKey(query, provider);
    const ttl = this.config.providerSpecificTtl[provider as keyof typeof this.config.providerSpecificTtl] || this.config.defaultTtl;
    
    this.set(cacheKey, suggestions, ttl, provider);
  }

  /**
   * Get cached distance calculation
   */
  getDistanceCalculation(
    pickupCoords: { lat: number; lng: number },
    dropoffCoords: { lat: number; lng: number },
    provider?: Provider
  ): any | null {
    const cacheKey = this.generateDistanceKey(pickupCoords, dropoffCoords, provider);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Cache distance calculation
   */
  setDistanceCalculation(
    pickupCoords: { lat: number; lng: number },
    dropoffCoords: { lat: number; lng: number },
    distanceData: any,
    provider: Provider
  ): void {
    const cacheKey = this.generateDistanceKey(pickupCoords, dropoffCoords, provider);
    const ttl = 60 * 60 * 1000; // 1 hour for distance calculations
    
    this.set(cacheKey, distanceData, ttl, provider);
  }

  /**
   * Get cached postcode validation
   */
  getPostcodeValidation(postcode: string): any | null {
    const cacheKey = this.generatePostcodeKey(postcode);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      this.stats.misses++;
      this.updateStats();
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Cache postcode validation
   */
  setPostcodeValidation(postcode: string, validationData: any): void {
    const cacheKey = this.generatePostcodeKey(postcode);
    const ttl = 7 * 24 * 60 * 60 * 1000; // 7 days for postcode validation
    
    this.set(cacheKey, validationData, ttl);
  }

  /**
   * Cross-provider validation for addresses
   */
  validateAcrossProviders(query: string, suggestions: AddressSuggestion[]): AddressSuggestion[] {
    if (!this.config.enableCrossProviderValidation) {
      return suggestions;
    }

    // Get suggestions from other provider if available
    const otherProvider: Provider = suggestions[0]?.provider === 'google' ? 'mapbox' : 'google';
    const cachedOtherProvider = this.getAddressSuggestions(query, otherProvider);
    
    if (!cachedOtherProvider || cachedOtherProvider.length === 0) {
      return suggestions;
    }

    // Cross-validate coordinates (within 100m tolerance)
    const validatedSuggestions = suggestions.filter(suggestion => {
      const hasMatch = cachedOtherProvider.some(otherSuggestion => {
        const distance = this.calculateDistance( // DEPRECATED - internal use only
          suggestion.coordinates,
          otherSuggestion.coordinates
        );
        return distance < 100; // 100 meters tolerance
      });
      
      return hasMatch;
    });

    // If cross-validation reduces results significantly, return original
    if (validatedSuggestions.length < suggestions.length * 0.5) {
      return suggestions;
    }

    return validatedSuggestions;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      size: this.stats.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      providers: { ...this.stats.providers },
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      providers: {
        google: 0,
        mapbox: 0,
      },
    };
  }

  /**
   * Clear expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    this.updateStats();
    return cleaned;
  }

  /**
   * Get cache size and memory usage estimate
   */
  getMemoryUsage(): { size: number; estimatedBytes: number } {
    const size = this.cache.size;
    const estimatedBytes = size * 1024; // Rough estimate: 1KB per entry
    
    return { size, estimatedBytes };
  }

  private set(key: string, data: any, ttl: number, provider?: Provider): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<any> = {
      data,
      timestamp: Date.now(),
      ttl,
      provider: provider || 'google', // Default provider
    };

    this.cache.set(key, entry);
    this.updateStats();
  }

  private generateAddressKey(query: string, provider?: Provider): string {
    const normalizedQuery = query.trim().toLowerCase().replace(/\s+/g, ' ');
    const providerSuffix = provider ? `:${provider}` : '';
    return `addr:${normalizedQuery}${providerSuffix}`;
  }

  private generateDistanceKey(
    pickup: { lat: number; lng: number },
    dropoff: { lat: number; lng: number },
    provider?: Provider
  ): string {
    // Round coordinates to reduce cache fragmentation
    const pickupRounded = {
      lat: Math.round(pickup.lat * 10000) / 10000,
      lng: Math.round(pickup.lng * 10000) / 10000,
    };
    const dropoffRounded = {
      lat: Math.round(dropoff.lat * 10000) / 10000,
      lng: Math.round(dropoff.lng * 10000) / 10000,
    };
    
    const providerSuffix = provider ? `:${provider}` : '';
    return `dist:${pickupRounded.lat},${pickupRounded.lng}:${dropoffRounded.lat},${dropoffRounded.lng}${providerSuffix}`;
  }

  private generatePostcodeKey(postcode: string): string {
    const normalized = postcode.trim().toUpperCase().replace(/\s+/g, ' ');
    return `postcode:${normalized}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private updateStats(): void {
    this.stats.size = this.cache.size;
    
    // Count entries by provider
    this.stats.providers.google = 0;
    this.stats.providers.mapbox = 0;
    
    for (const entry of this.cache.values()) {
      if (entry.provider === 'google') {
        this.stats.providers.google++;
      } else if (entry.provider === 'mapbox') {
        this.stats.providers.mapbox++;
      }
    }
  }

  private calculateDistance(coord1: { lat: number; lng: number }, coord2: { lat: number; lng: number }): number { // DEPRECATED - internal use only
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1.lat * Math.PI / 180;
    const φ2 = coord2.lat * Math.PI / 180;
    const Δφ = (coord2.lat - coord1.lat) * Math.PI / 180;
    const Δλ = (coord2.lng - coord1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }
}

export const dualProviderCache = DualProviderCache.getInstance();
export default dualProviderCache;
