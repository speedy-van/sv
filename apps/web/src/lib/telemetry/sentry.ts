import * as Sentry from '@sentry/nextjs';

// Initialize Sentry
export function initializeSentry() {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      // Filter out non-critical errors in production
      if (process.env.NODE_ENV === 'production') {
        // Don't send 404 errors
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error && error.message.includes('404')) {
            return null;
          }
        }
        
        // Don't send network errors
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error && 
              (error.message.includes('NetworkError') || 
               error.message.includes('fetch'))) {
            return null;
          }
        }
      }
      
      return event;
    },
    beforeSendTransaction(event) {
      // Filter out health check transactions
      if (event.transaction === '/api/health') {
        return null;
      }
      
      return event;
    },
  });
}

// Custom Sentry utilities
export class SentryService {
  private static instance: SentryService;

  private constructor() {}

  public static getInstance(): SentryService {
    if (!SentryService.instance) {
      SentryService.instance = new SentryService();
    }
    return SentryService.instance;
  }

  // Capture API errors
  public captureApiError(error: Error, context: {
    route: string;
    method: string;
    userId?: string;
    requestId?: string;
    body?: any;
  }) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'api_error');
      scope.setTag('route', context.route);
      scope.setTag('method', context.method);
      
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      
      if (context.requestId) {
        scope.setTag('request_id', context.requestId);
      }
      
      if (context.body) {
        scope.setContext('request_body', context.body);
      }
      
      Sentry.captureException(error);
    });
  }

  // Capture database errors
  public captureDbError(error: Error, context: {
    operation: string;
    table: string;
    query?: string;
    userId?: string;
  }) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'database_error');
      scope.setTag('operation', context.operation);
      scope.setTag('table', context.table);
      
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      
      if (context.query) {
        scope.setContext('query', { sql: context.query });
      }
      
      Sentry.captureException(error);
    });
  }

  // Capture business logic errors
  public captureBusinessError(error: Error, context: {
    operation: string;
    businessContext: Record<string, any>;
    userId?: string;
  }) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'business_error');
      scope.setTag('operation', context.operation);
      
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      
      scope.setContext('business_context', context.businessContext);
      
      Sentry.captureException(error);
    });
  }

  // Capture performance issues
  public capturePerformanceIssue(message: string, context: {
    operation: string;
    duration: number;
    threshold: number;
    userId?: string;
  }) {
    Sentry.withScope((scope) => {
      scope.setTag('issue_type', 'performance');
      scope.setTag('operation', context.operation);
      scope.setLevel('warning');
      
      if (context.userId) {
        scope.setUser({ id: context.userId });
      }
      
      scope.setContext('performance', {
        duration: context.duration,
        threshold: context.threshold,
        exceeded_by: context.duration - context.threshold,
      });
      
      Sentry.captureMessage(message);
    });
  }

  // Add breadcrumb for tracking user actions
  public addBreadcrumb(message: string, category: string, level: 'info' | 'warning' | 'error' = 'info', data?: Record<string, any>) {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  }

  // Set user context
  public setUser(user: {
    id: string;
    email?: string;
    role?: string;
  }) {
    Sentry.setUser(user);
  }

  // Clear user context
  public clearUser() {
    Sentry.setUser(null);
  }

  // Capture message with context
  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('custom_context', context);
      }
      scope.setLevel(level);
      Sentry.captureMessage(message);
    });
  }

  // Start a transaction for custom operations
  public startTransaction(name: string, op: string) {
    return Sentry.startInactiveSpan({
      name,
      op,
    });
  }

  // Add span to transaction
  public addSpan(transaction: any, name: string, op: string, data?: Record<string, any>) {
    return Sentry.startInactiveSpan({
      parentSpan: transaction,
      name,
      op,
      attributes: data,
    });
  }
}

// Export singleton instance
export const sentryService = SentryService.getInstance();
