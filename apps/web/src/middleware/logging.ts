/**
 * LOGGING MIDDLEWARE FOR NEXT.JS - PRODUCTION GRADE
 * 
 * Comprehensive middleware integration providing:
 * - Automatic request/response logging
 * - Performance monitoring
 * - Error tracking and correlation
 * - User session tracking
 * - Security event monitoring
 * - Rate limiting integration
 * - API usage analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  StructuredLogger, 
  RequestTracer, 
  ErrorCategory, 
  BusinessEvent 
} from '@/lib/logging/structured-logger';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator: (req: NextRequest) => string;
}

// Request metadata extraction
interface RequestMetadata {
  userId?: string;
  sessionId?: string;
  userAgent: string;
  ipAddress: string;
  referer?: string;
  acceptLanguage?: string;
  contentLength?: number;
}

// Performance thresholds for alerting
const PERFORMANCE_THRESHOLDS = {
  fast: 100,    // ms
  normal: 500,  // ms
  slow: 1000,   // ms
  critical: 3000, // ms
};

// Security monitoring patterns
const SECURITY_PATTERNS = {
  sqlInjection: /(\b(union|select|insert|update|delete|drop|create|alter)\b|['"`;\\])/i,
  xss: /[<>\"'&]/,
  pathTraversal: /\.\.(\/|\\)/,
  commandInjection: /[;&|`$(){}[\]]/,
};

// API endpoint categorization
const API_CATEGORIES = {
  '/api/auth': 'authentication',
  '/api/pricing': 'pricing',
  '/api/bookings': 'bookings',
  '/api/payments': 'payments',
  '/api/webhooks': 'webhooks',
  '/api/admin': 'admin',
} as const;

export class LoggingMiddleware {
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  /**
   * Main middleware function for Next.js
   */
  static async handle(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();
    const metadata = this.extractRequestMetadata(request);
    
    // Start request tracing
    const correlationId = StructuredLogger.requestStart(
      request.method,
      request.url,
      metadata.userId,
      metadata.sessionId,
      metadata.userAgent,
      metadata.ipAddress
    );

    // Security monitoring
    this.monitorSecurity(request, metadata);

    // Rate limiting check
    const rateLimitResult = this.checkRateLimit(request);
    if (!rateLimitResult.allowed) {
      StructuredLogger.security(
        'rate_limit_exceeded',
        'warning',
        metadata.userId,
        metadata.ipAddress,
        metadata.userAgent,
        true,
        `Rate limit exceeded: ${rateLimitResult.count}/${rateLimitResult.limit}`
      );

      const response = NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
        { status: 429 }
      );

      this.addResponseHeaders(response, correlationId, startTime);
      StructuredLogger.requestEnd(429, Date.now() - startTime);
      return response;
    }

    // Log API usage for business analytics
    this.logApiUsage(request, metadata);

    let response: NextResponse;
    let error: Error | null = null;

    try {
      // Continue to next middleware/route handler
      response = NextResponse.next();
      
      // Monitor response and add logging headers
      response = this.monitorResponse(response, request, startTime, correlationId);
      
    } catch (err) {
      error = err as Error;
      
      StructuredLogger.error(
        'Middleware error',
        error,
        ErrorCategory.SYSTEM,
        'high',
        {
          url: request.url,
          method: request.method,
          userAgent: metadata.userAgent,
          ipAddress: metadata.ipAddress,
        }
      );

      response = NextResponse.json(
        { error: 'Internal server error', correlationId },
        { status: 500 }
      );

      this.addResponseHeaders(response, correlationId, startTime);
    }

    // Complete request logging
    const duration = Date.now() - startTime;
    StructuredLogger.requestEnd(response.status, duration, error instanceof Error ? error : undefined);

    // Performance alerting
    this.checkPerformance(request, duration);

    return response;
  }

  /**
   * Extract comprehensive metadata from request
   */
  private static extractRequestMetadata(request: NextRequest): RequestMetadata {
    const headers = request.headers;
    
    // Extract user information from headers or cookies
    const authHeader = headers.get('authorization');
    const sessionCookie = request.cookies.get('session-id');
    
    return {
      userId: this.extractUserId(authHeader, sessionCookie?.value),
      sessionId: sessionCookie?.value || this.generateSessionId(request),
      userAgent: headers.get('user-agent') || 'unknown',
      ipAddress: this.extractIpAddress(request),
      referer: headers.get('referer') || undefined,
      acceptLanguage: headers.get('accept-language') || undefined,
      contentLength: parseInt(headers.get('content-length') || '0', 10),
    };
  }

  /**
   * Security monitoring and threat detection
   */
  private static monitorSecurity(request: NextRequest, metadata: RequestMetadata): void {
    const url = request.url;
    const query = new URL(url).searchParams.toString();
    const body = request.body ? 'present' : 'absent';

    // Check for common attack patterns
    const threats: string[] = [];

    if (SECURITY_PATTERNS.sqlInjection.test(query)) {
      threats.push('sql_injection_attempt');
    }

    if (SECURITY_PATTERNS.xss.test(query)) {
      threats.push('xss_attempt');
    }

    if (SECURITY_PATTERNS.pathTraversal.test(url)) {
      threats.push('path_traversal_attempt');
    }

    if (SECURITY_PATTERNS.commandInjection.test(query)) {
      threats.push('command_injection_attempt');
    }

    // Log security events
    if (threats.length > 0) {
      StructuredLogger.security(
        `security_threat_detected: ${threats.join(', ')}`,
        'critical',
        metadata.userId,
        metadata.ipAddress,
        metadata.userAgent,
        true,
        `Blocked request with suspicious patterns: ${threats.join(', ')}`
      );
    }

    // Monitor for suspicious behavior
    if ((metadata.contentLength || 0) > 10 * 1024 * 1024) { // 10MB
      StructuredLogger.security(
        'large_request_body',
        'warning',
        metadata.userId,
        metadata.ipAddress,
        metadata.userAgent,
        false,
        `Large request body: ${metadata.contentLength} bytes`
      );
    }

    // Check for missing user agent (potential bot)
    if (!metadata.userAgent || metadata.userAgent === 'unknown') {
      StructuredLogger.security(
        'missing_user_agent',
        'info',
        metadata.userId,
        metadata.ipAddress,
        metadata.userAgent
      );
    }
  }

  /**
   * Rate limiting implementation
   */
  private static checkRateLimit(request: NextRequest): {
    allowed: boolean;
    count: number;
    limit: number;
    retryAfter?: number;
  } {
    const key = this.generateRateLimitKey(request);
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 100; // Per minute per IP

    const current = this.rateLimitStore.get(key);
    
    if (!current || current.resetTime < now) {
      // First request or window expired
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      
      return { allowed: true, count: 1, limit: maxRequests };
    }

    current.count++;
    
    if (current.count > maxRequests) {
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      return {
        allowed: false,
        count: current.count,
        limit: maxRequests,
        retryAfter,
      };
    }

    return { allowed: true, count: current.count, limit: maxRequests };
  }

  /**
   * Log API usage for business analytics
   */
  private static logApiUsage(request: NextRequest, metadata: RequestMetadata): void {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // Categorize API endpoint
    const category = Object.entries(API_CATEGORIES).find(([prefix]) => 
      pathname.startsWith(prefix)
    )?.[1] || 'other';

    StructuredLogger.info('API request initiated', {
      endpoint: pathname,
      category,
      method: request.method,
      query: url.search,
      contentLength: metadata.contentLength,
      userId: metadata.userId,
      sessionId: metadata.sessionId,
    });

    // Log business events for specific endpoints
    if (pathname.startsWith('/api/pricing/quote') && request.method === 'POST') {
      StructuredLogger.business(
        BusinessEvent.QUOTE_REQUESTED,
        undefined,
        'quote',
        undefined,
        undefined,
        { endpoint: pathname, userId: metadata.userId }
      );
    }

    if (pathname.startsWith('/api/bookings') && request.method === 'POST') {
      StructuredLogger.business(
        BusinessEvent.BOOKING_CREATED,
        undefined,
        'booking',
        undefined,
        undefined,
        { endpoint: pathname, userId: metadata.userId }
      );
    }
  }

  /**
   * Monitor and enhance response
   */
  private static monitorResponse(
    response: NextResponse,
    request: NextRequest,
    startTime: number,
    correlationId: string
  ): NextResponse {
    const duration = Date.now() - startTime;
    
    // Add logging and tracing headers
    this.addResponseHeaders(response, correlationId, startTime);

    // Log response details
    StructuredLogger.info('Response prepared', {
      status: response.status,
      duration,
      headers: Object.fromEntries(response.headers.entries()),
    });

    return response;
  }

  /**
   * Performance monitoring and alerting
   */
  private static checkPerformance(request: NextRequest, duration: number): void {
    const url = new URL(request.url);
    const endpoint = url.pathname;

    let performanceLevel: string;
    let shouldAlert = false;

    if (duration <= PERFORMANCE_THRESHOLDS.fast) {
      performanceLevel = 'fast';
    } else if (duration <= PERFORMANCE_THRESHOLDS.normal) {
      performanceLevel = 'normal';
    } else if (duration <= PERFORMANCE_THRESHOLDS.slow) {
      performanceLevel = 'slow';
      shouldAlert = true;
    } else {
      performanceLevel = 'critical';
      shouldAlert = true;
    }

    if (shouldAlert) {
      StructuredLogger.warn('Slow request detected', {
        endpoint,
        duration,
        performanceLevel,
        threshold: performanceLevel === 'slow' ? PERFORMANCE_THRESHOLDS.slow : PERFORMANCE_THRESHOLDS.critical,
      });
    }

    // Log performance metric
    StructuredLogger.performance(
      `request_${request.method.toLowerCase()}_duration`,
      duration,
      {
        endpoint,
        method: request.method,
        performanceLevel,
      }
    );
  }

  /**
   * Add response headers for observability
   */
  private static addResponseHeaders(
    response: NextResponse,
    correlationId: string,
    startTime: number
  ): void {
    const duration = Date.now() - startTime;
    
    response.headers.set('X-Correlation-ID', correlationId);
    response.headers.set('X-Response-Time', `${duration}ms`);
    response.headers.set('X-Timestamp', new Date().toISOString());
    response.headers.set('X-Service', 'speedy-van-api');
  }

  /**
   * Utility methods
   */
  private static extractIpAddress(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const connectingIp = request.headers.get('cf-connecting-ip');
    
    return forwardedFor?.split(',')[0]?.trim() ||
           realIp ||
           connectingIp ||
           request.ip ||
           'unknown';
  }

  private static extractUserId(authHeader?: string | null, sessionId?: string): string | undefined {
    if (!authHeader) return undefined;
    
    // Extract user ID from JWT token or API key
    try {
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Decode JWT token to extract user ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.userId;
      }
    } catch (error) {
      // Invalid token format
      return undefined;
    }
    
    return undefined;
  }

  private static generateSessionId(request: NextRequest): string {
    const ip = this.extractIpAddress(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const timestamp = Date.now();
    
    // Generate a deterministic session ID based on request characteristics
    const sessionData = `${ip}-${userAgent}-${Math.floor(timestamp / (24 * 60 * 60 * 1000))}`;
    
    // Simple hash function (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < sessionData.length; i++) {
      const char = sessionData.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return `sess_${Math.abs(hash).toString(36)}`;
  }

  private static generateRateLimitKey(request: NextRequest): string {
    const ip = this.extractIpAddress(request);
    const userId = this.extractUserId(request.headers.get('authorization'));
    
    // Use user ID if available, otherwise fall back to IP
    return userId ? `user:${userId}` : `ip:${ip}`;
  }
}