/**
 * Shared Error Types and Interfaces
 * Provides consistent error handling across Frontend and Backend
 */
import { z } from 'zod';
export declare enum ErrorCode {
    VALIDATION_ERROR = "VALIDATION_ERROR",
    INVALID_INPUT = "INVALID_INPUT",
    MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
    UNAUTHORIZED = "UNAUTHORIZED",
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    FORBIDDEN = "FORBIDDEN",
    INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
    NOT_FOUND = "NOT_FOUND",
    RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
    CONFLICT = "CONFLICT",
    DUPLICATE_RESOURCE = "DUPLICATE_RESOURCE",
    INTERNAL_ERROR = "INTERNAL_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
    EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",
    BOOKING_ERROR = "BOOKING_ERROR",
    PAYMENT_ERROR = "PAYMENT_ERROR",
    NOTIFICATION_ERROR = "NOTIFICATION_ERROR"
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
export declare class AppError extends Error {
    readonly code: ErrorCode;
    readonly statusCode: number;
    readonly details?: string;
    readonly validationErrors?: ValidationError[];
    readonly isOperational: boolean;
    constructor(message: string, code: ErrorCode, statusCode?: number, details?: string, validationErrors?: ValidationError[], isOperational?: boolean);
}
export declare class ValidationAppError extends AppError {
    constructor(message: string, validationErrors: ValidationError[], details?: string);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string, details?: string);
}
export declare class AuthorizationError extends AppError {
    constructor(message?: string, details?: string);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string, details?: string);
}
export declare class ConflictError extends AppError {
    constructor(message: string, details?: string);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, details?: string);
}
export declare class ExternalServiceError extends AppError {
    constructor(service: string, message: string, details?: string);
}
export declare function createErrorResponse(error: AppError | Error, requestId?: string, path?: string): ApiErrorResponse;
export declare function createSuccessResponse<T>(data: T, message?: string, requestId?: string): ApiSuccessResponse<T>;
export declare function formatZodErrors(zodError: z.ZodError): ValidationError[];
export declare function createValidationError(message: string, zodError?: z.ZodError, details?: string): ValidationAppError;
export declare const HTTP_STATUS_CODES: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly SERVICE_UNAVAILABLE: 503;
};
export declare function getStatusCodeForError(error: AppError): number;
//# sourceMappingURL=errors.d.ts.map