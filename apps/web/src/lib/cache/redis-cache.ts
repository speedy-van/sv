/**
 * Advanced Redis Cache System
 * High-performance caching for high-concurrency operations
 */

interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  retryDelayOnFailover: number;
  maxRetriesPerRequest: number;
  lazyConnect: boolean;
  keepAlive: number;
  connectTimeout: number;
  commandTimeout: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  serialize?: boolean; // Whether to serialize data
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  hitRate: number;
  averageResponseTime: number;
}

class RedisCacheManager {
  private client: any;
  private config: CacheConfig;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    hitRate: 0,
    averageResponseTime: 0
  };
  private responseTimes: number[] = [];

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000,
      ...config
    };

    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      // Use ioredis if available, fallback to memory cache
      let Redis: any = null;
      try {
        // Try to import ioredis
        const ioredis = require('ioredis');
        Redis = ioredis;
        console.log('✅ ioredis loaded successfully');
      } catch (error) {
        console.log('⚠️ ioredis not available, using memory cache fallback');
        Redis = null;
      }
      
      if (Redis) {
        this.client = new Redis(this.config);
        this.client.on('error', (error: Error) => {
          console.error('Redis error:', error);
          this.metrics.errors++;
        });
        
        console.log('✅ Redis cache initialized');
      } else {
        console.log('⚠️ Redis not available, using memory cache fallback');
        this.client = new MemoryCacheFallback();
      }
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      this.client = new MemoryCacheFallback();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const result = await this.client.get(key);
      const duration = Date.now() - startTime;
      this.updateResponseTime(duration);
      
      if (result !== null) {
        this.metrics.hits++;
        return this.deserialize(result);
      } else {
        this.metrics.misses++;
        return null;
      }
    } catch (error) {
      this.metrics.errors++;
      this.updateResponseTime(Date.now() - startTime);
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    } finally {
      this.updateHitRate();
    }
  }

  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const serializedValue = options.serialize !== false ? this.serialize(value) : value;
      const ttl = options.ttl || 3600; // Default 1 hour
      
      await this.client.setex(key, ttl, serializedValue);
      
      // Store cache tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.storeTags(key, options.tags);
      }
      
      const duration = Date.now() - startTime;
      this.updateResponseTime(duration);
      this.metrics.sets++;
      
      return true;
    } catch (error) {
      this.metrics.errors++;
      this.updateResponseTime(Date.now() - startTime);
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      await this.client.del(key);
      await this.removeTags(key);
      
      const duration = Date.now() - startTime;
      this.updateResponseTime(duration);
      this.metrics.deletes++;
      
      return true;
    } catch (error) {
      this.metrics.errors++;
      this.updateResponseTime(Date.now() - startTime);
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    try {
      const keys = await this.client.smembers(`cache:tags:${tag}`);
      if (keys.length > 0) {
        await this.client.del(...keys);
        await this.client.del(`cache:tags:${tag}`);
        return keys.length;
      }
      return 0;
    } catch (error) {
      console.error(`Cache invalidation error for tag ${tag}:`, error);
      return 0;
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const startTime = Date.now();
    
    try {
      const results = await this.client.mget(...keys);
      const duration = Date.now() - startTime;
      this.updateResponseTime(duration);
      
      return results.map((result: string | null) => {
        if (result !== null) {
          this.metrics.hits++;
          return this.deserialize(result);
        } else {
          this.metrics.misses++;
          return null;
        }
      });
    } catch (error) {
      this.metrics.errors++;
      this.updateResponseTime(Date.now() - startTime);
      console.error('Cache mget error:', error);
      return keys.map(() => null);
    } finally {
      this.updateHitRate();
    }
  }

  async mset<T>(keyValuePairs: Record<string, T>, options: CacheOptions = {}): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      const pipeline = this.client.pipeline();
      const ttl = options.ttl || 3600;
      
      for (const [key, value] of Object.entries(keyValuePairs)) {
        const serializedValue = options.serialize !== false ? this.serialize(value) : value;
        pipeline.setex(key, ttl, serializedValue);
        
        if (options.tags && options.tags.length > 0) {
          this.storeTags(key, options.tags);
        }
      }
      
      await pipeline.exec();
      
      const duration = Date.now() - startTime;
      this.updateResponseTime(duration);
      this.metrics.sets += Object.keys(keyValuePairs).length;
      
      return true;
    } catch (error) {
      this.metrics.errors++;
      this.updateResponseTime(Date.now() - startTime);
      console.error('Cache mset error:', error);
      return false;
    }
  }

  private async storeTags(key: string, tags: string[]): Promise<void> {
    try {
      const pipeline = this.client.pipeline();
      for (const tag of tags) {
        pipeline.sadd(`cache:tags:${tag}`, key);
      }
      await pipeline.exec();
    } catch (error) {
      console.error('Error storing cache tags:', error);
    }
  }

  private async removeTags(key: string): Promise<void> {
    try {
      // Get all tags for this key
      const tagKeys = await this.client.keys('cache:tags:*');
      const pipeline = this.client.pipeline();
      
      for (const tagKey of tagKeys) {
        pipeline.srem(tagKey, key);
      }
      
      await pipeline.exec();
    } catch (error) {
      console.error('Error removing cache tags:', error);
    }
  }

  private serialize<T>(value: T): string {
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.error('Serialization error:', error);
      return String(value);
    }
  }

  private deserialize<T>(value: string): T {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value as T;
    }
  }

  private updateResponseTime(duration: number): void {
    this.responseTimes.push(duration);
    
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
    
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  private updateHitRate(): void {
    const total = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Cache ping failed:', error);
      return false;
    }
  }

  async shutdown(): Promise<void> {
    try {
      if (this.client && typeof this.client.disconnect === 'function') {
        await this.client.disconnect();
      }
      console.log('✅ Redis cache shutdown complete');
    } catch (error) {
      console.error('Error during cache shutdown:', error);
    }
  }
}

// Memory cache fallback for when Redis is not available
class MemoryCacheFallback {
  private cache = new Map<string, { value: any; expires: number }>();

  async get(key: string): Promise<string | null> {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
  }

  async setex(key: string, ttl: number, value: string): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + (ttl * 1000)
    });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    return keys.map(key => this.cache.get(key)?.value || null);
  }

  async mset(...args: string[]): Promise<void> {
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i];
      const value = args[i + 1];
      if (key && value !== undefined) {
        this.cache.set(key, {
          value,
          expires: Date.now() + (3600 * 1000) // Default 1 hour
        });
      }
    }
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async smembers(key: string): Promise<string[]> {
    // Simple implementation for memory cache
    return [];
  }

  async sadd(key: string, ...members: string[]): Promise<void> {
    // Simple implementation for memory cache
  }

  async srem(key: string, ...members: string[]): Promise<void> {
    // Simple implementation for memory cache
  }

  async keys(pattern: string): Promise<string[]> {
    return Array.from(this.cache.keys()).filter(key => 
      pattern.replace('*', '').length === 0 || key.includes(pattern.replace('*', ''))
    );
  }

  pipeline(): any {
    return {
      setex: () => this,
      sadd: () => this,
      srem: () => this,
      exec: async () => []
    };
  }

  async disconnect(): Promise<void> {
    this.cache.clear();
  }
}

// Global cache instance
let globalCache: RedisCacheManager | null = null;

export function getCache(): RedisCacheManager {
  if (!globalCache) {
    globalCache = new RedisCacheManager();
  }
  return globalCache;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const cache = getCache();
  return cache.get<T>(key);
}

export async function cacheSet<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
  const cache = getCache();
  return cache.set(key, value, options);
}

export async function cacheDel(key: string): Promise<boolean> {
  const cache = getCache();
  return cache.del(key);
}

export async function cacheInvalidateByTag(tag: string): Promise<number> {
  const cache = getCache();
  return cache.invalidateByTag(tag);
}

export async function cacheMget<T>(keys: string[]): Promise<(T | null)[]> {
  const cache = getCache();
  return cache.mget<T>(keys);
}

export async function cacheMset<T>(keyValuePairs: Record<string, T>, options?: CacheOptions): Promise<boolean> {
  const cache = getCache();
  return cache.mset(keyValuePairs, options);
}

export function getCacheMetrics(): CacheMetrics {
  const cache = getCache();
  return cache.getMetrics();
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (globalCache) {
    await globalCache.shutdown();
  }
});

process.on('SIGTERM', async () => {
  if (globalCache) {
    await globalCache.shutdown();
  }
});

