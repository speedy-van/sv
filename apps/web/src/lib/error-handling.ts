import React from 'react';

// Error handling utilities for the Speedy Van application

export interface AppError {
  reference: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

export class ApplicationError extends Error {
  public reference: string;
  public details?: any;
  public timestamp: Date;
  public userId?: string;
  public sessionId?: string;
  public url?: string;
  public userAgent?: string;

  constructor(
    message: string,
    reference: string = 'UNKNOWN_ERROR',
    details?: any,
    userId?: string,
    sessionId?: string,
    url?: string,
    userAgent?: string
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.reference = reference;
    this.details = details;
    this.timestamp = new Date();
    this.userId = userId;
    this.sessionId = sessionId;
    this.url = url;
    this.userAgent = userAgent;
  }

  toJSON(): AppError {
    return {
      reference: this.reference,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      userId: this.userId,
      sessionId: this.sessionId,
      url: this.url,
      userAgent: this.userAgent,
    };
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class DatabaseError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 'EXTERNAL_SERVICE_ERROR', details);
    this.name = 'ExternalServiceError';
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

// Error handling utilities
export function handleError(
  error: unknown,
  context?: string
): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApplicationError(
      error.message,
      'UNKNOWN_ERROR',
      { originalError: error.name, stack: error.stack },
      undefined,
      undefined,
      typeof window !== 'undefined' ? window.location.href : undefined,
      typeof window !== 'undefined' ? window.navigator.userAgent : undefined
    );
  }

  return new ApplicationError(
    String(error),
    'UNKNOWN_ERROR',
    { originalError: error },
    undefined,
    undefined,
    typeof window !== 'undefined' ? window.location.href : undefined,
    typeof window !== 'undefined' ? window.navigator.userAgent : undefined
  );
}

// API error response helper
export function createErrorResponse(
  error: ApplicationError,
  statusCode: number = 500
) {
  return {
    error: error.reference,
    message: error.message,
    details: error.details,
    timestamp: error.timestamp.toISOString(),
  };
}

// Client-side error handling
export function logError(error: unknown, context?: string) {
  const appError = handleError(error, context);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Application Error:', appError);
  }

  // Send to error tracking service
  if (typeof window !== 'undefined') {
    // Send to telemetry/analytics service
    fetch('/api/telemetry/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appError),
    }).catch(() => {
      // Silently fail if error tracking fails
    });
  }

  return appError;
}

// React error boundary helper
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ComponentType<{ error: ApplicationError }>
) {
  return function ErrorBoundaryWrapper(props: T) {
    const [error, setError] = React.useState<ApplicationError | null>(null);

    if (error) {
      if (fallback) {
        return React.createElement(fallback, { error });
      }
      return React.createElement(
        'div',
        { className: 'error-boundary' },
        React.createElement('h2', null, 'Something went wrong'),
        React.createElement('p', null, error.message),
        React.createElement(
          'button',
          { onClick: () => setError(null) },
          'Try again'
        )
      );
    }

    return React.createElement(
      ErrorBoundary,
      { onError: setError, children: React.createElement(Component, props) }
    );
  };
}

// Error Boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: ApplicationError) => void },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    onError: (error: ApplicationError) => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    const appError = handleError(error, 'React Error Boundary');
    appError.details = { ...appError.details, errorInfo };

    logError(appError, 'React Error Boundary');
    this.props.onError(appError);
  }

  render() {
    if (this.state.hasError) {
      return null; // Let the wrapper handle the error display
    }

    return this.props.children;
  }
}

// Async error handling wrapper
export function withAsyncErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleError(error, context);
      logError(appError, context);
      throw appError;
    }
  };
}

// Form validation error helper
export function createValidationError(
  field: string,
  message: string
): ValidationError {
  return new ValidationError(`${field}: ${message}`, { field });
}

// API response error helper
export function handleApiError(response: Response, context?: string): never {
  throw new ApplicationError(
    `API Error: ${response.status} ${response.statusText}`,
    'API_ERROR',
    { status: response.status, statusText: response.statusText },
    undefined,
    undefined,
    typeof window !== 'undefined' ? window.location.href : undefined,
    typeof window !== 'undefined' ? window.navigator.userAgent : undefined
  );
}
