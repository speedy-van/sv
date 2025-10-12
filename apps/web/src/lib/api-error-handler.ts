import { NextRequest, NextResponse } from 'next/server';
import {
  ApplicationError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  createErrorResponse,
} from './error-handling';

// API error handler middleware
export function withApiErrorHandler<T extends any[], R>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse<R>>,
  context?: string
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}

// Handle API errors and return appropriate responses
export function handleApiError(error: unknown, context?: string): NextResponse {
  let appError: ApplicationError;
  let statusCode: number;

  // Convert to ApplicationError if needed
  if (error instanceof ApplicationError) {
    appError = error;
  } else {
    appError = new ApplicationError(
      error instanceof Error ? error.message : String(error),
      'UNKNOWN_ERROR',
      { originalError: error, context }
    );
  }

  // Determine status code based on error type
  switch (appError.constructor) {
    case ValidationError:
      statusCode = 400;
      break;
    case AuthenticationError:
      statusCode = 401;
      break;
    case AuthorizationError:
      statusCode = 403;
      break;
    case NotFoundError:
      statusCode = 404;
      break;
    case RateLimitError:
      statusCode = 429;
      break;
    case DatabaseError:
    case ExternalServiceError:
      statusCode = 500;
      break;
    default:
      statusCode = 500;
  }

  // Log error for debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', {
      reference: appError.reference,
      message: appError.message,
      details: appError.details,
      context,
      stack: appError.stack,
    });
  }

  // Return error response
  return NextResponse.json(createErrorResponse(appError, statusCode), {
    status: statusCode,
  });
}

// Validation helper
export function validateRequest<T>(
  data: unknown,
  schema: any,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    throw new ValidationError('Invalid request data', {
      validationErrors: (error as any).errors,
      context,
    });
  }
}

// Authentication helper
export function requireAuth(session: any, context?: string) {
  if (!session || !session.user) {
    throw new AuthenticationError('Authentication required');
  }
  return session;
}

// Authorization helper
export function requireRole(
  session: any,
  requiredRole: string,
  context?: string
) {
  requireAuth(session, context);

  if (session.user.role !== requiredRole) {
    throw new AuthorizationError(
      `Insufficient permissions. Required role: ${requiredRole}`
    );
  }
  return session;
}

// Database error handler
export function handleDatabaseError(error: unknown, context?: string): never {
  if (error instanceof DatabaseError) {
    throw error;
  }

  // Check for common database errors
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (
    errorMessage.includes('unique constraint') ||
    errorMessage.includes('duplicate key')
  ) {
    throw new ValidationError('Resource already exists', {
      originalError: error,
      context,
    });
  }

  if (errorMessage.includes('foreign key constraint')) {
    throw new ValidationError('Referenced resource not found', {
      originalError: error,
      context,
    });
  }

  if (errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    throw new DatabaseError('Database connection error', {
      originalError: error,
      context,
    });
  }

  throw new DatabaseError('Database operation failed', {
    originalError: error,
    context,
  });
}

// External service error handler
export function handleExternalServiceError(
  error: unknown,
  service: string,
  context?: string
): never {
  if (error instanceof ExternalServiceError) {
    throw error;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  throw new ExternalServiceError(`${service} service error: ${errorMessage}`, {
    service,
    originalError: error,
    context,
  });
}

// Rate limiting helper
export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
  context?: string
): void {
  // This would integrate with your rate limiting service
  // For now, we'll just throw an error if rate limit is exceeded
  throw new RateLimitError('Rate limit exceeded');
}

// Async operation wrapper with error handling
export function withErrorHandling<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await operation(...args);
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }

      // Handle database errors
      if (error && typeof error === 'object' && 'code' in error) {
        const dbError = error as any;
        if (dbError.reference && dbError.reference.startsWith('P')) {
          handleDatabaseError(error, context);
        }
      }

      // Handle external service errors
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as any;
        if (apiError.status >= 400) {
          handleExternalServiceError(error, 'External API', context);
        }
      }

      // Default error handling
      throw new ApplicationError(
        error instanceof Error ? error.message : String(error),
        'UNKNOWN_ERROR',
        { originalError: error, context }
      );
    }
  };
}

// Response helpers
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status: statusCode });
}

export function createCreatedResponse<T>(data: T): NextResponse<T> {
  return createSuccessResponse(data, 201);
}

export function createNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// Pagination helper
export function createPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  limit: number
) {
  return createSuccessResponse({
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}
