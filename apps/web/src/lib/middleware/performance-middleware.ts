/**
 * API Performance Monitoring Middleware
 * 
 * Tracks response times, cache hit rates, and system performance
 * for all API endpoints with specific focus on multi-drop routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { APIPerformanceService } from '@/lib/services/api-performance-service';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  fast: 200,
  moderate: 800,
  slow: 2000,
  critical: 5000
};

// Endpoints to monitor
const MONITORED_ENDPOINTS = [
  '/api/routes',
  '/api/bookings',
  '/api/drivers',
  '/api/admin/dashboard',
  '/api/performance',
  '/api/quotes',
  '/api/analytics'
];

// Rate limiting configuration
const RATE_LIMITS = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // per minute per IP

/**
 * Performance monitoring middleware
 */
export function performanceMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname } = new URL(request.url);
  
  // Check if endpoint should be monitored
  const shouldMonitor = MONITORED_ENDPOINTS.some(endpoint => 
    pathname.startsWith(endpoint)
  );
  
  if (!shouldMonitor) {
    return NextResponse.next();
  }
  
  // Rate limiting
  const clientIP = getClientIP(request);
  if (isRateLimited(clientIP)) {
    return new NextResponse(
      JSON.stringify({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.'
      }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Add performance headers to request
  const enhancedRequest = new NextRequest(request.url, {
    method: request.method,
    headers: {
      ...request.headers,
      'x-performance-start': startTime.toString(),
      'x-client-ip': clientIP
    },
    body: request.body
  });
  
  return NextResponse.next({
    request: enhancedRequest
  });
}

/**
 * Response monitoring wrapper
 */
export function monitorResponse(
  response: NextResponse,
  request: NextRequest,
  endpoint: string
): NextResponse {
  const startTime = parseInt(request.headers.get('x-performance-start') || '0');
  const responseTime = Date.now() - startTime;
  
  // Record performance metrics
  APIPerformanceService.recordPerformance(
    endpoint,
    request.method,
    responseTime,
    response.headers.get('x-cache-hit') === 'true',
    response.status
  );
  
  // Add performance headers to response
  response.headers.set('x-response-time', responseTime.toString());
  response.headers.set('x-performance-grade', getPerformanceGrade(responseTime));
  response.headers.set('x-timestamp', new Date().toISOString());
  
  // Log slow requests
  if (responseTime > PERFORMANCE_THRESHOLDS.slow) {
    console.warn(`🐌 Slow API response: ${request.method} ${endpoint} - ${responseTime}ms`);
  }
  
  // Log critical requests
  if (responseTime > PERFORMANCE_THRESHOLDS.critical) {
    console.error(`🚨 Critical slow API response: ${request.method} ${endpoint} - ${responseTime}ms`);
  }
  
  return response;
}

/**
 * Get client IP address
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Check rate limiting
 */
function isRateLimited(clientIP: string): boolean {
  const now = Date.now();
  const clientData = RATE_LIMITS.get(clientIP);
  
  if (!clientData || now > clientData.resetTime) {
    // Reset or create new limit window
    RATE_LIMITS.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return false;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  // Increment count
  clientData.count++;
  return false;
}

/**
 * Get performance grade based on response time
 */
function getPerformanceGrade(responseTime: number): string {
  if (responseTime <= PERFORMANCE_THRESHOLDS.fast) return 'A';
  if (responseTime <= PERFORMANCE_THRESHOLDS.moderate) return 'B';
  if (responseTime <= PERFORMANCE_THRESHOLDS.slow) return 'C';
  if (responseTime <= PERFORMANCE_THRESHOLDS.critical) return 'D';
  return 'F';
}

/**
 * Enhanced request wrapper with caching and performance monitoring
 */
export function withPerformanceEnhancements<T extends (...args: any[]) => Promise<NextResponse>>(
  endpoint: string,
  handler: T,
  options?: {
    enableCaching?: boolean;
    cacheKey?: (request: NextRequest) => string;
    cacheTTL?: number;
    rateLimit?: number;
  }
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    const startTime = Date.now();
    
    try {
      // Apply performance middleware
      const middlewareResponse = performanceMiddleware(request);
      if (middlewareResponse.status === 429) {
        return middlewareResponse;
      }
      
      let response: NextResponse;
      let cacheHit = false;
      
      // Try cache if enabled
      if (options?.enableCaching && options.cacheKey) {
        const cacheKey = options.cacheKey(request);
        const cached = await getCachedResponse(cacheKey);
        
        if (cached) {
          response = new NextResponse(cached.body, {
            status: cached.status,
            headers: {
              ...cached.headers,
              'x-cache-hit': 'true'
            }
          });
          cacheHit = true;
        } else {
          // Execute handler and cache result
          response = await handler(request, ...args);
          
          if (response.status === 200) {
            await setCachedResponse(cacheKey, {
              body: await response.clone().text(),
              status: response.status,
              headers: Object.fromEntries(response.headers.entries())
            }, options.cacheTTL);
          }
        }
      } else {
        // Execute handler without caching
        response = await handler(request, ...args);
      }
      
      // Monitor response
      return monitorResponse(response, request, endpoint);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Record error metrics
      APIPerformanceService.recordPerformance(
        endpoint,
        request.method,
        responseTime,
        false,
        500
      );
      
      console.error(`API error in ${endpoint}:`, error);
      
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'x-response-time': responseTime.toString(),
            'x-performance-grade': 'F'
          }
        }
      );
    }
  }) as T;
}

/**
 * Simple response caching
 */
const responseCache = new Map<string, {
  data: any;
  expires: number;
}>();

async function getCachedResponse(key: string): Promise<any> {
  const cached = responseCache.get(key);
  
  if (!cached) return null;
  
  if (Date.now() > cached.expires) {
    responseCache.delete(key);
    return null;
  }
  
  return cached.data;
}

async function setCachedResponse(
  key: string, 
  data: any, 
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): Promise<void> {
  responseCache.set(key, {
    data,
    expires: Date.now() + ttl
  });
  
  // Cleanup old entries periodically
  if (responseCache.size > 1000) {
    const now = Date.now();
    for (const [k, v] of responseCache.entries()) {
      if (now > v.expires) {
        responseCache.delete(k);
      }
    }
  }
}

/**
 * Database query optimization helper
 */
export class QueryOptimizer {
  
  /**
   * Optimize SELECT queries with intelligent field selection
   */
  static optimizeSelect(
    baseSelect: any,
    requestedFields?: string[],
    includeRelations?: string[]
  ) {
    if (!requestedFields || requestedFields.length === 0) {
      return baseSelect;
    }
    
    const optimizedSelect: any = {};
    
    // Include requested fields
    requestedFields.forEach(field => {
      if (baseSelect[field] !== undefined) {
        optimizedSelect[field] = baseSelect[field];
      }
    });
    
    // Include requested relations
    if (includeRelations) {
      includeRelations.forEach(relation => {
        if (baseSelect[relation] !== undefined) {
          optimizedSelect[relation] = baseSelect[relation];
        }
      });
    }
    
    return Object.keys(optimizedSelect).length > 0 ? optimizedSelect : baseSelect;
  }
  
  /**
   * Build optimized WHERE conditions
   */
  static optimizeWhere(filters: Record<string, any>) {
    const where: any = {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          where[key] = { in: value };
        } else {
          where[key] = value;
        }
      }
    });
    
    return where;
  }
  
  /**
   * Add performance indexes suggestion
   */
  static suggestIndexes(queryPattern: {
    table: string;
    whereFields: string[];
    orderByFields: string[];
    joinFields: string[];
  }) {
    const suggestions = [];
    
    // Compound index for WHERE + ORDER BY
    if (queryPattern.whereFields.length > 0 && queryPattern.orderByFields.length > 0) {
      suggestions.push({
        type: 'compound',
        fields: [...queryPattern.whereFields, ...queryPattern.orderByFields],
        reason: 'Optimize filtering and sorting'
      });
    }
    
    // Individual indexes for frequent WHERE conditions
    queryPattern.whereFields.forEach(field => {
      suggestions.push({
        type: 'single',
        fields: [field],
        reason: `Optimize filtering by ${field}`
      });
    });
    
    // Join indexes
    queryPattern.joinFields.forEach(field => {
      suggestions.push({
        type: 'join',
        fields: [field],
        reason: `Optimize JOIN on ${field}`
      });
    });
    
    return suggestions;
  }
}

/**
 * Performance metrics collector
 */
export class PerformanceCollector {
  private static metrics: Array<{
    timestamp: Date;
    endpoint: string;
    method: string;
    responseTime: number;
    statusCode: number;
    cacheHit: boolean;
    clientIP: string;
  }> = [];
  
  static collect(data: {
    endpoint: string;
    method: string;
    responseTime: number;
    statusCode: number;
    cacheHit: boolean;
    clientIP: string;
  }) {
    this.metrics.push({
      ...data,
      timestamp: new Date()
    });
    
    // Keep only last 10000 metrics
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }
  
  static getMetrics(timeRange?: { start: Date; end: Date }) {
    let filtered = this.metrics;
    
    if (timeRange) {
      filtered = this.metrics.filter(m => 
        m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }
    
    return {
      total: filtered.length,
      averageResponseTime: filtered.reduce((sum, m) => sum + m.responseTime, 0) / filtered.length,
      cacheHitRate: (filtered.filter(m => m.cacheHit).length / filtered.length) * 100,
      errorRate: (filtered.filter(m => m.statusCode >= 400).length / filtered.length) * 100,
      byEndpoint: this.groupByEndpoint(filtered),
      byStatus: this.groupByStatus(filtered)
    };
  }
  
  private static groupByEndpoint(metrics: typeof this.metrics) {
    return metrics.reduce((acc, m) => {
      const key = `${m.method} ${m.endpoint}`;
      if (!acc[key]) {
        acc[key] = { count: 0, totalTime: 0, errors: 0 };
      }
      acc[key].count++;
      acc[key].totalTime += m.responseTime;
      if (m.statusCode >= 400) acc[key].errors++;
      return acc;
    }, {} as Record<string, any>);
  }
  
  private static groupByStatus(metrics: typeof this.metrics) {
    return metrics.reduce((acc, m) => {
      const status = Math.floor(m.statusCode / 100) * 100;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }
}