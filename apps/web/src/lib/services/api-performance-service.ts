/**
 * API Performance Optimization Service
 * 
 * Comprehensive caching, query optimization, and performance monitoring
 * for Multi-Drop Route API endpoints
 */

import { NextRequest } from 'next/server';
// Simple in-memory cache implementation
class SimpleCache<K, V> {
  private cache = new Map<K, { value: V; expires: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number, ttl: number) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key: K, value: V, options?: { ttl?: number }): void {
    const expires = Date.now() + (options?.ttl || this.ttl);
    
    // Remove expired entries
    this.cleanup();
    
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, { value, expires });
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
      }
    }
  }
}
import { prisma } from '@/lib/prisma';

// Cache configurations
const CACHE_CONFIGS = {
  routes: {
    maxSize: 1000,
    ttl: 1000 * 60 * 5, // 5 minutes
    staleWhileRevalidate: 1000 * 60 * 10, // 10 minutes
  },
  drivers: {
    maxSize: 500,
    ttl: 1000 * 60 * 2, // 2 minutes
    staleWhileRevalidate: 1000 * 60 * 5, // 5 minutes
  },
  bookings: {
    maxSize: 2000,
    ttl: 1000 * 60 * 3, // 3 minutes
    staleWhileRevalidate: 1000 * 60 * 8, // 8 minutes
  },
  quotes: {
    maxSize: 1500,
    ttl: 1000 * 60 * 10, // 10 minutes
    staleWhileRevalidate: 1000 * 60 * 20, // 20 minutes
  },
  analytics: {
    maxSize: 200,
    ttl: 1000 * 60 * 15, // 15 minutes
    staleWhileRevalidate: 1000 * 60 * 30, // 30 minutes
  }
};

// Initialize caches
const caches = new Map<string, SimpleCache<string, any>>();

function getCache(cacheName: keyof typeof CACHE_CONFIGS): SimpleCache<string, any> {
  if (!caches.has(cacheName)) {
    const config = CACHE_CONFIGS[cacheName];
    caches.set(cacheName, new SimpleCache(config.maxSize, config.ttl));
  }
  return caches.get(cacheName)!;
}

// Performance monitoring
interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  cacheHit: boolean;
  timestamp: Date;
  statusCode: number;
}

const performanceMetrics: PerformanceMetrics[] = [];

export class APIPerformanceService {
  
  /**
   * Cache wrapper with performance monitoring
   */
  static async withCache<T>(
    cacheName: keyof typeof CACHE_CONFIGS,
    cacheKey: string,
    fetcher: () => Promise<T>,
    options?: {
      skipCache?: boolean;
      customTTL?: number;
    }
  ): Promise<{ data: T; cached: boolean; duration: number }> {
    const startTime = Date.now();
    const cache = getCache(cacheName);
    
    // Check cache first (unless skipped)
    if (!options?.skipCache) {
      const cached = cache.get(cacheKey);
      if (cached !== undefined) {
        const duration = Date.now() - startTime;
        return {
          data: cached,
          cached: true,
          duration
        };
      }
    }
    
    // Fetch fresh data
    const data = await fetcher();
    
    // Store in cache
    if (options?.customTTL) {
      cache.set(cacheKey, data, { ttl: options.customTTL });
    } else {
      cache.set(cacheKey, data);
    }
    
    const duration = Date.now() - startTime;
    return {
      data,
      cached: false,
      duration
    };
  }
  
  /**
   * Optimized route queries with selective field loading
   */
  static async getOptimizedRoutes(filters?: {
    status?: string[];
    driverId?: string;
    limit?: number;
    offset?: number;
    includeDrops?: boolean;
    includeDriver?: boolean;
  }) {
    const cacheKey = `routes:${JSON.stringify(filters || {})}`;
    
    return this.withCache('routes', cacheKey, async () => {
      const select: any = {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        optimizedDistanceKm: true,
        estimatedDuration: true,
        optimizedSequence: true,
        driverId: true,
        totalDrops: true,
        completedDrops: true
      };
      
      // Conditionally include related data
      if (filters?.includeDrops) {
        select.drops = {
          select: {
            id: true,
            bookingId: true,
            sequenceNumber: true,
            address: true,
            coordinates: true,
            status: true,
            estimatedArrival: true,
            actualArrival: true
          }
        };
      }
      
      if (filters?.includeDriver) {
        select.driver = {
          select: {
            id: true,
            name: true,
            email: true,
            driver: {
              select: {
                status: true,
                rating: true
              }
            }
          }
        };
      }
      
      const where: any = {};
      
      if (filters?.status?.length) {
        where.status = { in: filters.status };
      }
      
      if (filters?.driverId) {
        where.driverId = filters.driverId;
      }
      
      // Use booking queries for multi-drop routes since Route model may not exist
      const bookings = await prisma.booking.findMany({
        where: {
          ...(filters?.driverId && { driverId: filters.driverId }),
          ...(filters?.status?.length && { 
            status: { 
              in: filters.status.filter(s => 
                ['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(s)
              ) as any
            } 
          })
        },
        select: {
          id: true,
          reference: true,
          status: true,
          pickupAddress: true,
          dropoffAddress: true,
          scheduledAt: true,
          updatedAt: true,
          totalGBP: true,
          customerId: true,
          driverId: true,
          ...(filters?.includeDriver && {
            driver: {
              select: {
                id: true,
                User: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          })
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { scheduledAt: 'desc' }
      });
      
      return bookings;
    });
  }
  
  /**
   * Optimized driver queries with performance metrics
   */
  static async getOptimizedDrivers(filters?: {
    status?: string[];
    includeCurrentRoute?: boolean;
    includePerformanceMetrics?: boolean;
    limit?: number;
  }) {
    const cacheKey = `drivers:${JSON.stringify(filters || {})}`;
    
    return this.withCache('drivers', cacheKey, async () => {
      const select: any = {
        id: true,
        status: true,
        currentLocation: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      };
      
      if (filters?.includeCurrentRoute) {
        select.assignedRoutes = {
          where: {
            status: { in: ['assigned', 'in_progress'] }
          },
          select: {
            id: true,
            status: true,
            totalDistance: true,
            estimatedDuration: true,
            stops: {
              select: {
                id: true,
                sequenceNumber: true,
                status: true,
                address: true
              },
              orderBy: { sequenceNumber: 'asc' }
            }
          },
          take: 1
        };
      }
      
      if (filters?.includePerformanceMetrics) {
        select.earnings = {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          },
          select: {
            netAmountPence: true,
            createdAt: true
          }
        };
      }
      
      const where: any = {};
      
      if (filters?.status?.length) {
        where.status = { in: filters.status };
      }
      
      return prisma.driver.findMany({
        where,
        select,
        take: filters?.limit || 100,
        orderBy: { updatedAt: 'desc' }
      });
    });
  }
  
  /**
   * Optimized booking queries with multi-drop support
   */
  static async getOptimizedBookings(filters?: {
    status?: string[];
    customerId?: string;
    driverId?: string;
    isMultiDrop?: boolean;
    dateRange?: { start: Date; end: Date };
    includeRoute?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const cacheKey = `bookings:${JSON.stringify(filters || {})}`;
    
    return this.withCache('bookings', cacheKey, async () => {
      const select: any = {
        id: true,
        reference: true,
        status: true,
        pickupAddress: true,
        dropoffAddress: true,
        scheduledAt: true,
        completedAt: true,
        totalGBP: true,
        isMultiDrop: true,
        customerId: true,
        driverId: true
      };
      
      if (filters?.includeRoute) {
        select.multiDropRoute = {
          select: {
            id: true,
            status: true,
            totalDistance: true,
            estimatedDuration: true,
            stops: {
              select: {
                id: true,
                sequenceNumber: true,
                address: true,
                status: true
              },
              orderBy: { sequenceNumber: 'asc' }
            }
          }
        };
      }
      
      const where: any = {};
      
      if (filters?.status?.length) {
        where.status = { in: filters.status };
      }
      
      if (filters?.customerId) {
        where.customerId = filters.customerId;
      }
      
      if (filters?.driverId) {
        where.driverId = filters.driverId;
      }
      
      if (filters?.isMultiDrop !== undefined) {
        where.isMultiDrop = filters.isMultiDrop;
      }
      
      if (filters?.dateRange) {
        where.scheduledAt = {
          gte: filters.dateRange.start,
          lte: filters.dateRange.end
        };
      }
      
      return prisma.booking.findMany({
        where,
        select,
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: { scheduledAt: 'desc' }
      });
    });
  }
  
  /**
   * Batch operations for improved performance
   */
  static async batchUpdateBookings(updates: Array<{
    bookingId: string;
    status?: string;
    actualArrival?: Date;
    coordinates?: { lat: number; lng: number };
  }>) {
    return prisma.$transaction(async (tx) => {
      const results = [];
      
      for (const update of updates) {
        const result = await tx.booking.update({
          where: { id: update.bookingId },
          data: {
            ...(update.status && { 
              status: update.status as any 
            }),
            ...(update.actualArrival && { 
              updatedAt: update.actualArrival 
            })
          }
        });
        results.push(result);
      }
      
      return results;
    });
  }
  
  /**
   * Database connection pooling optimization
   */
  static async optimizeConnection() {
    // Check connection health
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { healthy: true };
    } catch (error) {
      console.error('Database connection error:', error);
      return { healthy: false, error };
    }
  }
  
  /**
   * Clear cache by pattern
   */
  static clearCache(pattern?: string) {
    if (pattern) {
      // Clear specific cache pattern
      for (const [cacheName, cache] of caches.entries()) {
        if (cacheName.includes(pattern)) {
          cache.clear();
        }
      }
    } else {
      // Clear all caches
      caches.forEach(cache => cache.clear());
    }
  }
  
  /**
   * Record performance metrics
   */
  static recordPerformance(
    endpoint: string,
    method: string,
    responseTime: number,
    cacheHit: boolean,
    statusCode: number
  ) {
    performanceMetrics.push({
      endpoint,
      method,
      responseTime,
      cacheHit,
      statusCode,
      timestamp: new Date()
    });
    
    // Keep only last 1000 metrics
    if (performanceMetrics.length > 1000) {
      performanceMetrics.splice(0, performanceMetrics.length - 1000);
    }
  }
  
  /**
   * Get performance analytics
   */
  static getPerformanceAnalytics(timeframe: 'hour' | 'day' | 'week' = 'hour') {
    const now = new Date();
    const timeframes = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = new Date(now.getTime() - timeframes[timeframe]);
    const recentMetrics = performanceMetrics.filter(m => m.timestamp >= cutoff);
    
    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        endpointStats: {}
      };
    }
    
    const totalRequests = recentMetrics.length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = (cacheHits / totalRequests) * 100;
    const errors = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errors / totalRequests) * 100;
    
    // Endpoint-specific stats
    const endpointStats: Record<string, any> = {};
    recentMetrics.forEach(m => {
      const key = `${m.method} ${m.endpoint}`;
      if (!endpointStats[key]) {
        endpointStats[key] = {
          requests: 0,
          totalResponseTime: 0,
          cacheHits: 0,
          errors: 0
        };
      }
      
      endpointStats[key].requests++;
      endpointStats[key].totalResponseTime += m.responseTime;
      if (m.cacheHit) endpointStats[key].cacheHits++;
      if (m.statusCode >= 400) endpointStats[key].errors++;
    });
    
    // Calculate averages for each endpoint
    Object.keys(endpointStats).forEach(key => {
      const stats = endpointStats[key];
      stats.averageResponseTime = stats.totalResponseTime / stats.requests;
      stats.cacheHitRate = (stats.cacheHits / stats.requests) * 100;
      stats.errorRate = (stats.errors / stats.requests) * 100;
    });
    
    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime),
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      endpointStats
    };
  }
  
  /**
   * Performance middleware wrapper
   */
  static withPerformanceMonitoring(
    endpoint: string,
    handler: (request: NextRequest) => Promise<Response>
  ) {
    return async (request: NextRequest): Promise<Response> => {
      const startTime = Date.now();
      const cacheHit = false;
      let statusCode = 200;
      
      try {
        // Add cache hit detection to request context
        const originalJson = Response.prototype.json; void originalJson;
        const response: Response = await handler(request);
        statusCode = response.status;
        
        return response;
        
      } catch (error) {
        statusCode = 500;
        throw error;
        
      } finally {
        const responseTime = Date.now() - startTime;
        this.recordPerformance(
          endpoint,
          request.method,
          responseTime,
          cacheHit,
          statusCode
        );
      }
    };
  }
  
  /**
   * Query optimization suggestions
   */
  static async analyzeQueryPerformance() {
    const slowQueries = performanceMetrics
      .filter(m => m.responseTime > 1000) // Queries slower than 1 second
      .reduce((acc, m) => {
        const key = `${m.method} ${m.endpoint}`;
        if (!acc[key]) {
          acc[key] = {
            count: 0,
            averageTime: 0,
            totalTime: 0
          };
        }
        acc[key].count++;
        acc[key].totalTime += m.responseTime;
        acc[key].averageTime = acc[key].totalTime / acc[key].count;
        return acc;
      }, {} as Record<string, any>);
    
    const suggestions: string[] = [];
    
    Object.entries(slowQueries).forEach(([endpoint, stats]: [string, any]) => {
      if (stats.count >= 5) { // Multiple slow queries
        suggestions.push(endpoint);
      }
    });
    
    return suggestions;
  }
}

/**
 * Database query optimization helpers
 */
export class DatabaseOptimizer {
  
  /**
   * Create optimized indexes for multi-drop routes
   */
  static async createOptimizedIndexes() {
    const indexes = [
      // Multi-drop route indexes
      'CREATE INDEX IF NOT EXISTS idx_multidrop_routes_status_driver ON "MultiDropRoute" ("status", "driverId");',
      'CREATE INDEX IF NOT EXISTS idx_multidrop_routes_created_at ON "MultiDropRoute" ("createdAt");',
      'CREATE INDEX IF NOT EXISTS idx_multidrop_route_stops_route_sequence ON "MultiDropRouteStop" ("multiDropRouteId", "sequenceNumber");',
      'CREATE INDEX IF NOT EXISTS idx_multidrop_route_stops_booking ON "MultiDropRouteStop" ("bookingId");',
      
      // Booking indexes
      'CREATE INDEX IF NOT EXISTS idx_bookings_multidrop_status ON "Booking" ("isMultiDrop", "status");',
      'CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_at ON "Booking" ("scheduledAt");',
      'CREATE INDEX IF NOT EXISTS idx_bookings_customer_driver ON "Booking" ("customerId", "driverId");',
      
      // Driver indexes
      'CREATE INDEX IF NOT EXISTS idx_drivers_status_location ON "Driver" ("status", "currentLocation");',
      
      // Performance indexes for reporting
      'CREATE INDEX IF NOT EXISTS idx_driver_earnings_date ON "DriverEarnings" ("createdAt");',
      'CREATE INDEX IF NOT EXISTS idx_assignments_claimed_at ON "Assignment" ("claimedAt") WHERE "claimedAt" IS NOT NULL;'
    ];
    
    const results = [];
    
    for (const indexSQL of indexes) {
      try {
        await prisma.$executeRawUnsafe(indexSQL);
        results.push({ sql: indexSQL, status: 'success' });
      } catch (error) {
        results.push({ 
          sql: indexSQL, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    return results;
  }
  
  /**
   * Analyze query performance and suggest optimizations
   */
  static async analyzeQueryPerformance() {
    try {
      // Get query statistics (PostgreSQL specific)
      const slowQueries = await prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows
        FROM pg_stat_statements 
        WHERE mean_time > 100 
        ORDER BY mean_time DESC 
        LIMIT 10;
      `;
      
      return {
        success: true,
        slowQueries,
        suggestions: [
          'Consider adding indexes for frequently queried columns',
          'Implement query result caching for repeated queries',
          'Use selective field loading to reduce data transfer',
          'Implement connection pooling for better resource management'
        ]
      };
      
    } catch (error) {
      // Fallback for non-PostgreSQL databases or missing pg_stat_statements
      return {
        success: false,
        message: 'Query performance analysis requires PostgreSQL with pg_stat_statements extension',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}