import { NextRequest, NextResponse } from 'next/server';
import {
  loginRateLimit,
  passwordResetRateLimit,
  RateLimitError,
} from './rate-limit';
import { logAudit } from './audit';
import { trackSecurityEvent, extractSecurityInfo } from './security-monitor';

/**
 * Middleware wrapper for NextAuth that applies rate limiting
 * and enhanced security logging as per cursor_tasks section 11
 */
export async function authMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  try {
    // Apply rate limiting to authentication endpoints
    if (pathname === '/api/auth/signin' && req.method === 'POST') {
      // Rate limit login attempts
      const rateLimitResult = loginRateLimit(req);

      // Add rate limit headers to response
      const response = NextResponse.next();
      response.headers.set(
        'X-RateLimit-Remaining',
        rateLimitResult.remaining.toString()
      );

      // Log login attempt and track security event
      const formData = await req.formData();
      const email = formData.get('email') as string;
      const securityInfo = extractSecurityInfo(req);

      await logAudit(
        'system',
        'login_attempt',
        'auth',
        { email, ip: securityInfo.ip }
      );

      // Track security event for monitoring
      await trackSecurityEvent({
        type: 'login_failure', // Will be updated to 'login_success' if successful
        ip: securityInfo.ip,
        userAgent: securityInfo.userAgent,
        details: { email, endpoint: pathname },
      });

      return response;
    }

    if (pathname === '/api/auth/signout' && req.method === 'POST') {
      // Log logout
      const securityInfo = extractSecurityInfo(req);
      await logAudit(
        'system',
        'logout',
        'auth',
        { ip: securityInfo.ip }
      );

      return NextResponse.next();
    }

    if (pathname.startsWith('/api/auth/reset') && req.method === 'POST') {
      // Rate limit password reset requests
      passwordResetRateLimit(req);

      const formData = await req.formData();
      const email = formData.get('email') as string;
      const securityInfo = extractSecurityInfo(req);

      await logAudit(
        'system',
        'password_reset_requested',
        'auth',
        { email, ip: securityInfo.ip }
      );

      return NextResponse.next();
    }

    // For all other auth endpoints, just pass through
    return NextResponse.next();
  } catch (error) {
    if (error instanceof RateLimitError) {
      // Log rate limit exceeded
      const securityInfo = extractSecurityInfo(req);
      await logAudit(
        'system',
        'rate_limit_exceeded',
        'auth',
        {
          endpoint: pathname,
          ip: securityInfo.ip,
          retryAfter: error.retryAfter,
        }
      );

      // Track security event
      await trackSecurityEvent({
        type: 'rate_limit_exceeded',
        ip: securityInfo.ip,
        userAgent: securityInfo.userAgent,
        details: {
          endpoint: pathname,
          retryAfter: error.retryAfter,
        },
      });

      // Return rate limit error response
      return new NextResponse(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: error.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': error.retryAfter.toString(),
            'X-RateLimit-Reset': (
              Date.now() +
              error.retryAfter * 1000
            ).toString(),
          },
        }
      );
    }

    // Re-throw other errors
    throw error;
  }
}
