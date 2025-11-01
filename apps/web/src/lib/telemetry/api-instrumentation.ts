import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitor } from './performance-monitor';
import { sentryService } from './sentry';
import { renderAnalyticsService } from './render-analytics';

// API route instrumentation decorator
export function instrumentApiRoute<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  options: {
    route: string;
    method: string;
    trackAnalytics?: boolean;
    trackPerformance?: boolean;
  } = { route: 'unknown', method: 'GET' }
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const startTime = Date.now();
    
    // Set user context for Sentry
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');
    if (userId) {
      sentryService.setUser({
        id: userId,
        role: userRole || undefined,
      });
    }
    
    // Add breadcrumb for request tracking
    sentryService.addBreadcrumb(
      `${options.method} ${options.route}`,
      'http',
      'info',
      {
        method: options.method,
        route: options.route,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.ip,
        userId,
        userRole,
      }
    );
    
    try {
      const response = await performanceMonitor.monitorApiRoute(
        options.route,
        options.method,
        () => handler(...args)
      );
      
      const duration = Date.now() - startTime;
      
      // Track analytics if enabled
      if (options.trackAnalytics) {
        renderAnalyticsService.track('api_request', {
          route: options.route,
          method: options.method,
          statusCode: response.status,
          responseTime: duration,
          userId,
          userRole,
        });
      }
      
      // Track performance if enabled
      if (options.trackPerformance && duration > 1000) {
        renderAnalyticsService.trackApiSlowResponse({
          route: options.route,
          method: options.method,
          responseTime: duration,
          threshold: 1000,
        });
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track error analytics
      if (options.trackAnalytics) {
        renderAnalyticsService.track('api_error', {
          route: options.route,
          method: options.method,
          error: (error as Error).message,
          responseTime: duration,
          userId,
          userRole,
        });
      }
      
      throw error;
    } finally {
      // Clear user context
      sentryService.clearUser();
    }
  };
}

// Database operation instrumentation
export function instrumentDbOperation<T extends any[]>(
  operation: string,
  table: string,
  handler: (...args: T) => Promise<any>
) {
  return async (...args: T): Promise<any> => {
    const startTime = Date.now();
    
    try {
      const result = await performanceMonitor.monitorDbOperation(
        operation,
        table,
        () => handler(...args)
      );
      
      const duration = Date.now() - startTime;
      
      // Track slow queries
      if (duration > 500) {
        renderAnalyticsService.trackDbSlowQuery({
          operation,
          table,
          queryTime: duration,
          threshold: 500,
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track database errors
      renderAnalyticsService.track('db_error', {
        operation,
        table,
        error: (error as Error).message,
        queryTime: duration,
      });
      
      throw error;
    }
  };
}

// Business operation instrumentation
export function instrumentBusinessOperation<T extends any[]>(
  operation: string,
  context: Record<string, any>,
  handler: (...args: T) => Promise<any>
) {
  return async (...args: T): Promise<any> => {
    const startTime = Date.now();
    
    try {
      const result = await performanceMonitor.monitorBusinessOperation(
        operation,
        context,
        () => handler(...args)
      );
      
      const duration = Date.now() - startTime;
      
      // Track business operation analytics
      renderAnalyticsService.track('business_operation', {
        operation,
        duration,
        success: true,
        ...context,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track business operation errors
      renderAnalyticsService.track('business_operation_error', {
        operation,
        duration,
        success: false,
        error: (error as Error).message,
        ...context,
      });
      
      throw error;
    }
  };
}

// Prisma client instrumentation
export function instrumentPrismaClient(prisma: any) {
  const originalQuery = prisma.$queryRaw;
  const originalExecute = prisma.$executeRaw;
  
  // Instrument raw queries
  prisma.$queryRaw = async (...args: any[]) => {
    const startTime = Date.now();
    const query = args[0];
    
    try {
      const result = await originalQuery.apply(prisma, args);
      const duration = Date.now() - startTime;
      
      // Track query performance
      renderAnalyticsService.track('prisma_query', {
        query: query.toString().substring(0, 100),
        duration,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track query errors
      renderAnalyticsService.track('prisma_query_error', {
        query: query.toString().substring(0, 100),
        duration,
        success: false,
        error: (error as Error).message,
      });
      
      throw error;
    }
  };
  
  // Instrument raw executions
  prisma.$executeRaw = async (...args: any[]) => {
    const startTime = Date.now();
    const query = args[0];
    
    try {
      const result = await originalExecute.apply(prisma, args);
      const duration = Date.now() - startTime;
      
      // Track execution performance
      renderAnalyticsService.track('prisma_execute', {
        query: query.toString().substring(0, 100),
        duration,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track execution errors
      renderAnalyticsService.track('prisma_execute_error', {
        query: query.toString().substring(0, 100),
        duration,
        success: false,
        error: (error as Error).message,
      });
      
      throw error;
    }
  };
  
  return prisma;
}

// Middleware for automatic instrumentation
export function withAutoInstrumentation<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    const route = request.nextUrl.pathname;
    const method = request.method;
    
    // Determine if this is a critical route that needs monitoring
    const isCriticalRoute = route.startsWith('/api/') && 
      !route.includes('/health') && 
      !route.includes('/metrics');
    
    if (isCriticalRoute) {
      return instrumentApiRoute(handler, {
        route,
        method,
        trackAnalytics: true,
        trackPerformance: true,
      })(...args);
    }
    
    return handler(...args);
  };
}
