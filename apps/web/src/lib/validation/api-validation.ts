import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { 
  ApiSuccessResponseSchema, 
  ApiErrorResponseSchema,
  validateApiRequest 
} from './schemas';

// Generic API validation wrapper
export function withValidation<T extends z.ZodTypeAny>(
  schema: T,
  handler: (data: z.infer<T>, request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const body = await request.json();
      const validation = validateApiRequest(schema, body);
      
      if (!validation.success) {
        const errorResponse = ApiErrorResponseSchema.parse({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          message: 'Request data is invalid',
          details: 'One or more fields failed validation',
          validationErrors: validation.errors.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
          statusCode: 400,
          timestamp: new Date().toISOString(),
          requestId: request.headers.get('x-request-id') || undefined,
          path: request.url,
        });
        
        return NextResponse.json(errorResponse, { status: 400 });
      }
      
      return await handler(validation.data, request);
    } catch (error) {
      console.error('API validation error:', error);
      
      const errorResponse = ApiErrorResponseSchema.parse({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || undefined,
        path: request.url,
      });
      
      return NextResponse.json(errorResponse, { status: 500 });
    }
  };
}

// Query parameter validation
export function withQueryValidation<T extends z.ZodTypeAny>(
  schema: T,
  handler: (data: z.infer<T>, request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const { searchParams } = new URL(request.url);
      const queryData = Object.fromEntries(searchParams.entries());
      
      const validation = validateApiRequest(schema, queryData);
      
      if (!validation.success) {
        const errorResponse = ApiErrorResponseSchema.parse({
          success: false,
          error: 'Query validation failed',
          code: 'QUERY_VALIDATION_ERROR',
          message: 'Query parameters are invalid',
          details: 'One or more query parameters failed validation',
          validationErrors: validation.errors.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
          statusCode: 400,
          timestamp: new Date().toISOString(),
          requestId: request.headers.get('x-request-id') || undefined,
          path: request.url,
        });
        
        return NextResponse.json(errorResponse, { status: 400 });
      }
      
      return await handler(validation.data, request);
    } catch (error) {
      console.error('Query validation error:', error);
      
      const errorResponse = ApiErrorResponseSchema.parse({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500,
        timestamp: new Date().toISOString(),
        requestId: request.headers.get('x-request-id') || undefined,
        path: request.url,
      });
      
      return NextResponse.json(errorResponse, { status: 500 });
    }
  };
}

// Response formatting helpers
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  requestId?: string
): NextResponse {
  const response = ApiSuccessResponseSchema(z.any()).parse({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
    requestId,
  });
  
  return NextResponse.json(response);
}

export function createErrorResponse(
  error: string,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: string,
  validationErrors?: Array<{ field: string; message: string }>,
  requestId?: string,
  path?: string
): NextResponse {
  const response = ApiErrorResponseSchema.parse({
    success: false,
    error,
    code,
    message,
    details,
    validationErrors,
    statusCode,
    timestamp: new Date().toISOString(),
    requestId,
    path,
  });
  
  return NextResponse.json(response, { status: statusCode });
}

// Prisma integration helpers
export function validatePrismaInput<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof ZodError) {
      return { 
        success: false, 
        error: `Validation failed: ${error.errors.map(e => e.message).join(', ')}` 
      };
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown validation error' 
    };
  }
}

// Middleware for request validation
export function createValidationMiddleware<T extends z.ZodTypeAny>(schema: T) {
  return (request: NextRequest) => {
    try {
      const body = request.body ? request.json() : Promise.resolve({});
      return body.then((data: unknown) => {
        const validation = validateApiRequest(schema, data);
        if (!validation.success) {
          throw new Error('Validation failed');
        }
        return validation.data;
      });
    } catch (error) {
      throw new Error('Invalid request data');
    }
  };
}
