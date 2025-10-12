/**
 * Standardized API response utilities
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp: string;
  requestId?: string;
  headers?: Record<string, string>;
}

export interface ApiError {
  message: string;
  code: string;
  details?: any;
  field?: string;
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function createErrorResponse(
  error: string | ApiError,
  code?: string,
  requestId?: string,
  details?: any,
  statusCode?: number
): ApiResponse {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorCode = typeof error === 'string' ? code : error.code;

  return {
    success: false,
    error: errorMessage,
    code: errorCode,
    timestamp: new Date().toISOString(),
    requestId,
    ...(details && { details }),
    ...(statusCode && { statusCode }),
  };
}

export function createAuthErrorResponse(
  message: string = 'Authentication required',
  requestId?: string
): ApiResponse {
  return {
    success: false,
    error: message,
    code: 'UNAUTHORIZED',
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function createValidationErrorResponse(
  field: string,
  message: string,
  requestId?: string
): ApiResponse {
  return {
    success: false,
    error: message,
    code: 'VALIDATION_ERROR',
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function createUnauthorizedResponse(
  message: string = 'Unauthorized',
  requestId?: string
): ApiResponse {
  return {
    success: false,
    error: message,
    code: 'UNAUTHORIZED',
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function createNotFoundResponse(
  message: string = 'Resource not found',
  requestId?: string
): ApiResponse {
  return {
    success: false,
    error: message,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function createServerErrorResponse(
  message: string = 'Internal server error',
  requestId?: string
): ApiResponse {
  return {
    success: false,
    error: message,
    code: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
    requestId,
  };
}