import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from './performance-monitor';
import { sentryService } from './sentry';

// Performance monitoring middleware
export function withPerformanceMonitoring<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const route = request.nextUrl.pathname;
    const method = request.method;
    
    // Add breadcrumb for request tracking
    sentryService.addBreadcrumb(
      `${method} ${route}`,
      'http',
      'info',
      {
        method,
        route,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.ip,
      }
    );
    
    return performanceMonitor.monitorApiRoute(
      route,
      method,
      () => handler(...args)
    );
  };
}

// Database operation monitoring wrapper
export function withDbMonitoring<T extends any[]>(
  operation: string,
  table: string,
  handler: (...args: T) => Promise<any>
) {
  return async (...args: T): Promise<any> => {
    return performanceMonitor.monitorDbOperation(
      operation,
      table,
      () => handler(...args)
    );
  };
}

// Business operation monitoring wrapper
export function withBusinessMonitoring<T extends any[]>(
  operation: string,
  context: Record<string, any>,
  handler: (...args: T) => Promise<any>
) {
  return async (...args: T): Promise<any> => {
    return performanceMonitor.monitorBusinessOperation(
      operation,
      context,
      () => handler(...args)
    );
  };
}

// Error handling middleware
export function withErrorHandling<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      const request = args[0] as NextRequest;
      const route = request.nextUrl.pathname;
      const method = request.method;
      
      // Capture error in Sentry
      sentryService.captureApiError(error as Error, {
        route,
        method,
        requestId: request.headers.get('x-request-id') || undefined,
        body: request.body ? await request.clone().json().catch(() => null) : undefined,
      });
      
      // Return error response
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
          requestId: request.headers.get('x-request-id') || undefined,
        },
        { status: 500 }
      );
    }
  };
}

// Combined middleware for API routes
export function withApiMonitoring<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return withErrorHandling(withPerformanceMonitoring(handler));
}

// Health check endpoint
export async function healthCheck(): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Basic health checks
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
    
    const duration = Date.now() - startTime;
    
    // Record health check metrics
    (performanceMonitor as any).recordMetric('health_check_duration', duration);
    
    return NextResponse.json(checks);
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Record error metrics
    (performanceMonitor as any).recordMetric('health_check_duration', duration, { error: 'true' });
    
    // Capture error
    sentryService.captureMessage('Health check failed', 'error', { error: (error as Error).message });
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      },
      { status: 503 }
    );
  }
}

// Metrics endpoint
export async function getMetrics(): Promise<NextResponse> {
  try {
    const stats = performanceMonitor.getStats();
    
    return NextResponse.json({
      success: true,
      data: {
        metrics: stats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    sentryService.captureMessage('Failed to get metrics', 'error', { error: (error as Error).message });
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve metrics',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
