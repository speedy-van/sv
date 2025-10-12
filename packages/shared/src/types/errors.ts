/**
 * Shared Error Types and Interfaces
 * Provides consistent error handling across Frontend and Backend
 */

import { z } from 'zod';

// ================================
// ERROR TYPES AND INTERFACES
// ================================

export enum ErrorCode {
  // Validation Errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  
  // Authentication Errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Authorization Errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // Resource Errors (404)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  
  // Conflict Errors (409)
  CONFLICT = 'CONFLICT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  
  // Server Errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Business Logic Errors
  BOOKING_ERROR = 'BOOKING_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  NOTIFICATION_ERROR = 'NOTIFICATION_ERROR',
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: ErrorCode;
  message: string;
  details?: string;
  validationErrors?: ValidationError[];
  timestamp: string;
  requestId?: string;
  path?: string;
  statusCode: number;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ================================
// ERROR CLASSES
// ================================

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: string;
  public readonly validationErrors?: ValidationError[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    details?: string,
    validationErrors?: ValidationError[],
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.validationErrors = validationErrors;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationAppError extends AppError {
  constructor(message: string, validationErrors: ValidationError[], details?: string) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details, validationErrors);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', details?: string) {
    super(message, ErrorCode.UNAUTHORIZED, 401, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', details?: string) {
    super(message, ErrorCode.FORBIDDEN, 403, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', details?: string) {
    super(`${resource} not found`, ErrorCode.NOT_FOUND, 404, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: string) {
    super(message, ErrorCode.CONFLICT, 409, details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: string) {
    super(message, ErrorCode.DATABASE_ERROR, 500, details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: string) {
    super(`${service} service error: ${message}`, ErrorCode.EXTERNAL_SERVICE_ERROR, 503, details);
  }
}

// ================================
// ERROR RESPONSE BUILDERS
// ================================

export function createErrorResponse(
  error: AppError | Error,
  requestId?: string,
  path?: string
): ApiErrorResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return {
      success: false,
      error: error.name,
      code: error.code,
      message: error.message,
      details: error.details,
      validationErrors: error.validationErrors,
      statusCode: error.statusCode,
      timestamp,
      requestId,
      path,
    };
  }

  // Handle unknown errors
  return {
    success: false,
    error: 'InternalError',
    code: ErrorCode.INTERNAL_ERROR,
    message: 'An unexpected error occurred',
    details: error.message,
    statusCode: 500,
    timestamp,
    requestId,
    path,
  };
}

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

// ================================
// VALIDATION ERROR HELPERS
// ================================

export function formatZodErrors(zodError: z.ZodError): ValidationError[] {
  return zodError.issues.map((error: z.ZodIssue) => ({
    field: error.path.join('.'),
    message: error.message,
    code: error.code,
    value: error.path.length > 0 ? undefined : error,
  }));
}

export function createValidationError(
  message: string,
  zodError?: z.ZodError,
  details?: string
): ValidationAppError {
  const validationErrors = zodError ? formatZodErrors(zodError) : [];
  return new ValidationAppError(message, validationErrors, details);
}

// ================================
// HTTP STATUS CODE MAPPING
// ================================

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export function getStatusCodeForError(error: AppError): number {
  return error.statusCode || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
}
