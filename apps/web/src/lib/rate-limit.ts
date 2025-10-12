import { NextRequest } from 'next/server';

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (req: NextRequest) => string;
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export function createRateLimiter(config: RateLimitConfig) {
  return function rateLimit(req: NextRequest) {
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : getClientIP(req);

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up expired entries
    for (const [storeKey, data] of rateLimitStore.entries()) {
      if (data.resetTime < now) {
        rateLimitStore.delete(storeKey);
      }
    }

    const current = rateLimitStore.get(key);

    if (!current || current.resetTime < now) {
      // First request in window or window expired
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return { success: true, remaining: config.maxRequests - 1 };
    }

    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      throw new RateLimitError(
        `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter
      );
    }

    // Increment counter
    current.count++;
    rateLimitStore.set(key, current);

    return {
      success: true,
      remaining: config.maxRequests - current.count,
    };
  };
}

function getClientIP(req: NextRequest): string {
  // Get IP from various headers (for proxy setups)
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  const cfConnectingIP = req.headers.get('cf-connecting-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback to connection remote address
  return req.ip || 'unknown';
}

// Pre-configured rate limiters for different use cases
export const loginRateLimit = createRateLimiter({
  maxRequests: 5, // 5 attempts
  windowMs: 15 * 60 * 1000, // 15 minutes
  keyGenerator: req => {
    const email =
      req.nextUrl.searchParams.get('email') ||
      req.headers.get('x-email') ||
      'unknown';
    return `login:${getClientIP(req)}:${email}`;
  },
});

export const apiRateLimit = createRateLimiter({
  maxRequests: 100, // 100 requests
  windowMs: 60 * 1000, // 1 minute
});

export const sensitiveActionRateLimit = createRateLimiter({
  maxRequests: 10, // 10 attempts
  windowMs: 60 * 60 * 1000, // 1 hour
});

export const passwordResetRateLimit = createRateLimiter({
  maxRequests: 3, // 3 attempts
  windowMs: 60 * 60 * 1000, // 1 hour
  keyGenerator: req => {
    const email =
      req.nextUrl.searchParams.get('email') ||
      req.headers.get('x-email') ||
      'unknown';
    return `password_reset:${getClientIP(req)}:${email}`;
  },
});

// Helper function to add rate limit headers to response
export function addRateLimitHeaders(
  response: Response,
  remaining: number,
  resetTime: number
): Response {
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetTime.toString());
  return response;
}

/**
 * Clear all rate limit data (for testing purposes)
 */
export function clearRateLimitStore() {
  rateLimitStore.clear();
}
