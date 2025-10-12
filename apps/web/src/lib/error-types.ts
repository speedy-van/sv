/**
 * Unified Error Types for Frontend and Backend
 * Provides consistent error handling across the application
 */

export enum ErrorCode {
  // Authentication & Authorization
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Business Logic
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  
  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // File Operations
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Base Application Error Class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: string;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = 500,
    context?: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.details = details;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context?: string) {
    super(message, ErrorCode.AUTHENTICATION_ERROR, 401, context);
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions', context?: string) {
    super(message, ErrorCode.AUTHORIZATION_ERROR, 403, context);
  }
}

/**
 * Validation Error
 */
export class ValidationAppError extends AppError {
  public readonly validationErrors: ValidationError[];

  constructor(
    message: string = 'Validation failed',
    validationErrors: ValidationError[] = [],
    context?: string
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, context, { validationErrors });
    this.validationErrors = validationErrors;
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource', context?: string) {
    super(`${resource} not found`, ErrorCode.NOT_FOUND, 404, context);
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', context?: string) {
    super(message, ErrorCode.CONFLICT, 409, context);
  }
}

/**
 * Database Error
 */
export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', context?: string) {
    super(message, ErrorCode.DATABASE_ERROR, 500, context);
  }
}

/**
 * External Service Error
 */
export class ExternalServiceError extends AppError {
  constructor(
    service: string,
    message: string = 'External service error',
    context?: string
  ) {
    super(`${service}: ${message}`, ErrorCode.EXTERNAL_SERVICE_ERROR, 502, context);
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', context?: string) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429, context);
  }
}

/**
 * File Operation Error
 */
export class FileError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.FILE_UPLOAD_ERROR,
    statusCode: number = 400,
    context?: string
  ) {
    super(message, code, statusCode, context);
  }
}

/**
 * Get HTTP status code for error type
 */
export function getStatusCodeForError(error: AppError): number {
  return error.statusCode;
}

/**
 * Format Zod errors to ValidationError array
 */
export function formatZodErrors(zodError: any): ValidationError[] {
  if (!zodError.issues) return [];
  
  return zodError.issues.map((issue: any) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code
  }));
}

/**
 * Check if error is operational (expected) or programming error
 */
export function isOperationalError(error: unknown): boolean {
  return error instanceof AppError && error.isOperational;
}
