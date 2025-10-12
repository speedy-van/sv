/**
 * Unified Error Handler V2 - Works with existing codebase
 * Provides consistent error handling between frontend and backend
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationAppError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  FileError,
  ErrorCode,
  formatZodErrors,
  getStatusCodeForError,
  isOperationalError,
  type ValidationError
} from './error-types';
import { 
  createErrorResponse, 
  createValidationErrorResponse,
  generateRequestId 
} from './api-response';

// ================================
// ERROR CONVERSION
// ================================

/**
 * Convert unknown error to AppError
 */
export function convertToAppError(error: unknown, context?: string): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Zod validation error
  if (error instanceof ZodError) {
    const validationErrors = formatZodErrors(error);
    return new ValidationAppError('Validation failed', validationErrors, context);
  }

  // Database/Prisma errors
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Unique constraint violation
    if (message.includes('unique constraint') || message.includes('duplicate key')) {
      return new ConflictError('Resource already exists', context);
    }
    
    // Foreign key constraint
    if (message.includes('foreign key constraint')) {
      return new ValidationAppError('Referenced resource not found', [], context);
    }
    
    // Connection errors
    if (message.includes('connection') || message.includes('timeout')) {
      return new DatabaseError('Database connection error', context);
    }
    
    // Authentication errors
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return new AuthenticationError(error.message);
    }
    
    // Authorization errors
    if (message.includes('forbidden') || message.includes('permission')) {
      return new AuthorizationError(error.message);
    }
    
    // Not found errors
    if (message.includes('not found')) {
      return new NotFoundError('Resource', context);
    }
  }

  // Generic error
  return new AppError(
    error instanceof Error ? error.message : 'An unexpected error occurred',
    ErrorCode.INTERNAL_ERROR,
    500,
    context
  );
}

// ================================
// BACKEND ERROR HANDLING
// ================================

/**
 * Handle API errors and return appropriate responses
 */
export function handleApiError(
  error: unknown, 
  request?: NextRequest, 
  context?: string
): NextResponse {
  const requestId = generateRequestId();
  const path = request ? new URL(request.url).pathname : undefined;
  const appError = convertToAppError(error, context);
  
  // Log error for debugging
  console.error(`[${requestId}] API Error:`, {
    error: appError.name,
    message: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
    path,
    context,
    stack: process.env.NODE_ENV === 'development' ? appError.stack : undefined,
  });

  // Handle validation errors specially
  if (appError instanceof ValidationAppError) {
    const validationErrors = appError.validationErrors.map(err => ({
      field: err.field,
      message: err.message,
    }));
    return NextResponse.json(createValidationErrorResponse(
      'validation',
      appError.message,
      requestId
    ));
  }

  // Use status code from error
  const statusCode = getStatusCodeForError(appError);
  
  return NextResponse.json(createErrorResponse(
    appError.message,
    appError.code,
    requestId,
    appError.details,
    statusCode
  ));
}

/**
 * API wrapper with unified error handling
 */
export function withUnifiedErrorHandler<T extends any[], R>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse<R>>,
  context?: string
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      return handleApiError(error, req, context);
    }
  };
}

// ================================
// VALIDATION HELPERS
// ================================

/**
 * Validate request data with Zod schema
 */
export function validateRequestData<T>(
  data: unknown,
  schema: any,
  context?: string
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationAppError('Invalid request data', formatZodErrors(error), context);
    }
    throw convertToAppError(error, context);
  }
}

/**
 * Require authentication
 */
export function requireAuthentication(session: any, context?: string) {
  if (!session || !session.user) {
    throw new AuthenticationError('Authentication required', context);
  }
  return session;
}

/**
 * Require specific role
 */
export function requireRole(
  session: any,
  requiredRoles: string | string[],
  context?: string
) {
  const user = requireAuthentication(session, context).user;
  const userRole = user.role;
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  if (!roles.includes(userRole)) {
    throw new AuthorizationError(
      `Access denied. Required roles: ${roles.join(', ')}`,
      context
    );
  }
  
  return session;
}

// ================================
// EXTERNAL SERVICE ERROR HANDLING
// ================================

/**
 * Handle external service errors
 */
export function handleExternalServiceError(
  service: string,
  error: unknown,
  context?: string
): never {
  if (error instanceof AppError) {
    throw error;
  }
  
  const message = error instanceof Error ? error.message : String(error);
  throw new ExternalServiceError(service, message, context);
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: unknown, context?: string): never {
  if (error instanceof AppError) {
    throw error;
  }
  
  const message = error instanceof Error ? error.message : String(error);
  throw new DatabaseError('Database operation failed', `${context}: ${message}`);
}

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Should we log this error?
 */
export function shouldLogError(error: unknown): boolean {
  // Log all non-operational errors and 5xx errors
  if (!isOperationalError(error)) return true;
  if (error instanceof AppError && error.statusCode >= 500) return true;
  return false;
}

/**
 * Create error for logging/monitoring systems
 */
export function createErrorForLogging(error: AppError, request?: NextRequest) {
  return {
    id: generateRequestId(),
    timestamp: error.timestamp,
    level: error.statusCode >= 500 ? 'error' : 'warn',
    category: error.code,
    source: request ? new URL(request.url).pathname : 'unknown',
    message: error.message,
    stackTrace: error.stack,
    context: error.context,
    details: error.details,
    metadata: {
      statusCode: error.statusCode,
      isOperational: error.isOperational,
      userAgent: request?.headers.get('user-agent'),
      ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip')
    }
  };
}
