import { NextRequest, NextResponse } from 'next/server';
// import { ErrorMonitoringService } from '../agent/tools/production/ErrorMonitoringService'; // AI service removed

export interface ErrorCollectionConfig {
  enabled: boolean;
  environment: 'production' | 'staging' | 'development';
  version: string;
  captureUnhandledErrors: boolean;
  captureApiErrors: boolean;
  captureClientErrors: boolean;
  sensitiveHeaders: string[];
  maxBodySize: number; // in bytes
}

const defaultConfig: ErrorCollectionConfig = {
  enabled: process.env.NODE_ENV === 'production',
  environment: (process.env.NODE_ENV as any) || 'development',
  version: process.env.APP_VERSION || '1.0.0',
  captureUnhandledErrors: true,
  captureApiErrors: true,
  captureClientErrors: true,
  sensitiveHeaders: ['authorization', 'cookie', 'x-api-key'],
  maxBodySize: 1024 * 1024, // 1MB
};

export class ErrorCollectionMiddleware {
  private config: ErrorCollectionConfig;
  // private errorService: ErrorMonitoringService; // AI service removed

  constructor(config: Partial<ErrorCollectionConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    // this.errorService = ErrorMonitoringService.getInstance(); // AI service removed
  }

  /**
   * Middleware function for Next.js
   */
  async middleware(request: NextRequest): Promise<NextResponse | undefined> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Add request ID for tracking
      const requestId = this.generateRequestId();
      request.headers.set('x-request-id', requestId);

      // Capture request context
      const requestContext = this.captureRequestContext(request);

      // Process the request
      const response = await this.processRequest(request);

      // Log any errors that occurred during processing
      if (response && response.status >= 400) {
        await this.logApiError(request, response, requestContext);
      }

      return response;
    } catch (error) {
      // Log unhandled errors
      await this.logUnhandledError(error, request);
      throw error;
    }
  }

  /**
   * Log API errors (4xx, 5xx responses)
   */
  private async logApiError(
    request: NextRequest,
    response: NextResponse,
    context: any
  ): Promise<void> {
    try {
      const errorLevel = response.status >= 500 ? 'error' : 'warning';
      const category = this.determineErrorCategory(request.url, response.status) as 'database' | 'api' | 'frontend' | 'backend' | 'external' | 'performance' | 'security' | 'other';

      // await this.errorService.logError({ // AI service removed
      console.error('API Error:', {
        timestamp: new Date(),
        level: errorLevel,
        category,
        source: 'api',
        message: `HTTP ${response.status} - ${request.method} ${request.url}`,
        context: {
          ...context,
          statusCode: response.status,
          statusText: response.statusText,
        },
        metadata: {
          tags: ['api', 'http'],
          priority: response.status >= 500 ? 'high' : 'medium',
          status: 'new',
        },
        impact: {
          severity: response.status >= 500 ? 'major' : 'minor',
          businessImpact: response.status >= 500 ? 'high' : 'low',
        },
      });
    } catch (error) {
      console.error('Failed to log API error:', error);
    }
  }

  /**
   * Log unhandled errors
   */
  private async logUnhandledError(error: any, request: NextRequest): Promise<void> {
    try {
      const context = this.captureRequestContext(request);

      // await this.errorService.logError({ // AI service removed
      console.error('Unhandled Error:', {
        timestamp: new Date(),
        level: 'critical',
        category: 'backend',
        source: 'middleware',
        message: error.message || 'Unhandled error in middleware',
        stackTrace: error.stack,
        context,
        metadata: {
          tags: ['unhandled', 'middleware'],
          priority: 'urgent',
          status: 'new',
        },
        impact: {
          severity: 'critical',
          businessImpact: 'critical',
        },
      });
    } catch (logError) {
      console.error('Failed to log unhandled error:', logError);
    }
  }

  /**
   * Capture request context for error logging
   */
  private captureRequestContext(request: NextRequest): any {
    const context: any = {
      url: request.url,
      method: request.method,
      requestId: request.headers.get('x-request-id'),
      userAgent: request.headers.get('user-agent'),
      ipAddress: this.getClientIP(request),
      environment: this.config.environment,
      version: this.config.version,
    };

    // Add headers (excluding sensitive ones)
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (!this.config.sensitiveHeaders.includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });
    context.headers = headers;

    // Add query parameters
    const url = new URL(request.url);
    context.queryParams = Object.fromEntries(url.searchParams.entries());

    return context;
  }

  /**
   * Process the request and return response
   */
  private async processRequest(request: NextRequest): Promise<NextResponse | undefined> {
    // This is a placeholder - in a real implementation, you would
    // process the request and return the appropriate response
    return undefined;
  }

  /**
   * Determine error category based on URL and status code
   */
  private determineErrorCategory(url: string, statusCode: number): string {
    if (statusCode >= 500) {
      return 'backend';
    }

    if (url.includes('/api/')) {
      return 'api';
    }

    if (url.includes('/auth/')) {
      return 'security';
    }

    if (url.includes('/database/')) {
      return 'database';
    }

    return 'other';
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');

    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    if (realIP) {
      return realIP;
    }

    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    return 'unknown';
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set up global error handlers (Node.js runtime only)
   * Note: This method is not compatible with Edge Runtime
   */
  setupGlobalErrorHandlers(): void {
    // Skip setup in Edge Runtime - global error handlers are not supported
    // This method is kept for compatibility but does nothing in Edge Runtime
    return;
  }

  /**
   * Log unhandled promise rejections (Node.js runtime only)
   * Note: This method is not compatible with Edge Runtime
   */
  private async logUnhandledPromiseRejection(reason: any, promise: Promise<any>): Promise<void> {
    // Skip in Edge Runtime - not supported
    return;
  }

  /**
   * Log uncaught exceptions (Node.js runtime only)
   * Note: This method is not compatible with Edge Runtime
   */
  private async logUncaughtException(error: Error): Promise<void> {
    // Skip in Edge Runtime - not supported
    return;
  }
}

// Export middleware function for Next.js
export function withErrorCollection(config?: Partial<ErrorCollectionConfig>) {
  const middleware = new ErrorCollectionMiddleware(config);
  
  // Set up global error handlers
  middleware.setupGlobalErrorHandlers();
  
  return middleware.middleware.bind(middleware);
}
