/**
 * B2B API Authentication Middleware
 * 
 * Handles API key validation, rate limiting, and scope checking
 */

import { NextRequest, NextResponse } from 'next/server';
import { apiKeyService } from './api-key.service';

// Rate limit storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface ValidateApiKeyResult {
  valid: boolean;
  apiKey?: {
    id: string;
    companyId: string;
    scopes: string[];
    rateLimitPerMin: number;
    rateLimitPerDay: number;
  };
  error?: string;
}

/**
 * Extract API key from request
 */
export function extractApiKey(request: NextRequest): string | null {
  // Check Authorization header (preferred)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('X-API-Key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check query parameter (not recommended for production)
  const { searchParams } = new URL(request.url);
  const queryKey = searchParams.get('api_key');
  if (queryKey) {
    return queryKey;
  }

  return null;
}

/**
 * Get client IP from request
 */
export function getClientIp(request: NextRequest): string {
  // Check various headers for IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return '127.0.0.1';
}

/**
 * Validate API key authentication
 */
export async function validateApiKeyAuth(request: NextRequest): Promise<ValidateApiKeyResult> {
  const rawKey = extractApiKey(request);
  
  if (!rawKey) {
    return {
      valid: false,
      error: 'API key is required. Provide it via Authorization header (Bearer token) or X-API-Key header.',
    };
  }

  const ip = getClientIp(request);
  return apiKeyService.validate(rawKey, ip);
}

/**
 * Check if API key has required scope
 */
export function requireApiScope(
  scopes: string[],
  requiredScope: string
): { allowed: boolean; error?: string } {
  // Check if has wildcard or exact scope
  const hasWildcard = scopes.includes('*');
  const hasExact = scopes.includes(requiredScope);
  
  // Check resource wildcard (e.g., "bookings:*" includes "bookings:read")
  const [resource] = requiredScope.split(':');
  const hasResourceWildcard = scopes.includes(`${resource}:*`);
  
  if (hasWildcard || hasExact || hasResourceWildcard) {
    return { allowed: true };
  }
  
  return {
    allowed: false,
    error: `Missing required scope: ${requiredScope}`,
  };
}

/**
 * Check rate limit for API key
 */
export async function checkRateLimit(
  apiKeyId: string,
  rateLimitPerMin: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date; error?: string }> {
  const now = Date.now();
  const key = `rate:${apiKeyId}`;
  
  let record = rateLimitStore.get(key);
  
  // Reset if expired
  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + 60000, // 1 minute from now
    };
  }

  record.count++;
  rateLimitStore.set(key, record);

  const remaining = Math.max(0, rateLimitPerMin - record.count);
  const resetAt = new Date(record.resetAt);

  if (record.count > rateLimitPerMin) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      error: `Rate limit exceeded. Try again after ${resetAt.toISOString()}`,
    };
  }

  return {
    allowed: true,
    remaining,
    resetAt,
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetAt: Date
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.floor(resetAt.getTime() / 1000).toString());
  return response;
}

/**
 * Full API authentication middleware
 * Use this for protected B2B API routes
 */
export async function withApiAuth(
  request: NextRequest,
  requiredScope: string,
  handler: (
    request: NextRequest,
    authResult: ValidateApiKeyResult
  ) => Promise<NextResponse>
): Promise<NextResponse> {
  // Validate API key
  const authResult = await validateApiKeyAuth(request);
  
  if (!authResult.valid) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: 401 }
    );
  }

  // Check scope
  const scopeCheck = requireApiScope(authResult.apiKey!.scopes, requiredScope);
  if (!scopeCheck.allowed) {
    return NextResponse.json(
      { success: false, error: scopeCheck.error },
      { status: 403 }
    );
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(
    authResult.apiKey!.id,
    authResult.apiKey!.rateLimitPerMin
  );

  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { success: false, error: rateLimit.error },
      { status: 429 }
    );
    return addRateLimitHeaders(
      response,
      authResult.apiKey!.rateLimitPerMin,
      rateLimit.remaining,
      rateLimit.resetAt
    );
  }

  // Log usage
  const startTime = Date.now();
  
  try {
    const response = await handler(request, authResult);
    
    // Log successful request
    const responseTime = Date.now() - startTime;
    await apiKeyService.logUsage(
      authResult.apiKey!.id,
      new URL(request.url).pathname,
      request.method,
      response.status,
      responseTime,
      getClientIp(request),
      request.headers.get('user-agent') || undefined
    );

    // Add rate limit headers
    return addRateLimitHeaders(
      response,
      authResult.apiKey!.rateLimitPerMin,
      rateLimit.remaining,
      rateLimit.resetAt
    );
  } catch (error: any) {
    // Log error
    const responseTime = Date.now() - startTime;
    await apiKeyService.logUsage(
      authResult.apiKey!.id,
      new URL(request.url).pathname,
      request.method,
      500,
      responseTime,
      getClientIp(request),
      request.headers.get('user-agent') || undefined,
      error.code || 'INTERNAL_ERROR'
    );

    throw error;
  }
}

/**
 * Create API response with standard format
 */
export function apiResponse<T>(
  data: T,
  options: {
    status?: number;
    message?: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  } = {}
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      message: options.message,
      pagination: options.pagination,
      timestamp: new Date().toISOString(),
    },
    { status: options.status || 200 }
  );
}

/**
 * Create API error response
 */
export function apiError(
  error: string,
  options: {
    status?: number;
    code?: string;
    details?: any;
  } = {}
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error,
      code: options.code,
      details: options.details,
      timestamp: new Date().toISOString(),
    },
    { status: options.status || 500 }
  );
}

/**
 * Webhook signature verification
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
