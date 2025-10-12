# Security & Permissions Implementation

This document outlines the security and permissions implementation for the Speedy Van web application, following the requirements specified in `cursor_tasks.md` section 11.

## Overview

The security implementation provides:

- **Middleware protection** for all `/portal/*` routes requiring `session.user.role === 'customer'`
- **Server-side verification** for all mutations (no trust in client-side data)
- **Rate limiting** for login and sensitive endpoints
- **Comprehensive audit logging** for security events

## Architecture

### 1. Middleware Protection (`/src/middleware.ts`)

The middleware enforces role-based access control:

```typescript
// Customer portal routes protection - specifically protect /portal/* as per cursor_tasks
if (pathname.startsWith('/portal') || pathname.startsWith('/api/customer')) {
  if (userRole === 'customer' || userRole === 'admin') {
    hasAccess = true;
    logMiddlewareAction('CUSTOMER_ACCESS_GRANTED', pathname, userRole, userId);
  } else {
    logMiddlewareAction('CUSTOMER_ACCESS_DENIED', pathname, userRole, userId);
    const returnToPath = req.nextUrl.pathname + req.nextUrl.search;
    return createAuthRedirect(req, returnToPath);
  }
}
```

**Features:**

- Protects all `/portal/*` routes requiring customer role
- Redirects unauthorized users to login with return URL preservation
- Logs all access attempts for audit purposes
- Supports legacy `/customer-portal/*` routes with automatic redirection

### 2. Rate Limiting (`/src/lib/rate-limit.ts`)

Comprehensive rate limiting system with different configurations:

```typescript
// Login rate limiting: 5 attempts per 15 minutes
export const loginRateLimit = createRateLimiter({
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  keyGenerator: req => `login:${getClientIP(req)}:${email}`,
});

// API rate limiting: 100 requests per minute
export const apiRateLimit = createRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 1000,
});

// Password reset rate limiting: 3 attempts per hour
export const passwordResetRateLimit = createRateLimiter({
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
  keyGenerator: req => `password_reset:${getClientIP(req)}:${email}`,
});
```

**Features:**

- IP-based and email-based rate limiting
- Configurable windows and thresholds
- Automatic cleanup of expired entries
- Rate limit headers in responses

### 3. Server Actions (`/src/lib/server-actions.ts`)

Secure wrapper for server actions that enforces permissions:

```typescript
const secureUpdateProfile = withServerAction(updateCustomerProfile, {
  requireAuth: true,
  requireRole: 'customer',
  auditAction: 'profile_updated',
  auditTargetType: 'user_profile',
});
```

**Features:**

- Automatic session verification
- Role-based access control
- Input sanitization
- Comprehensive audit logging
- Resource ownership verification utilities

### 4. Enhanced Audit Logging (`/src/lib/audit.ts`)

Security-focused audit logging with risk assessment:

```typescript
// Enhanced security event logging as per cursor_tasks section 11
const isSecurityEvent = [
  'login_success',
  'login_failed',
  'logout',
  'password_reset_requested',
  'password_reset_completed',
  'password_changed',
  'email_verified',
  'two_factor_enabled',
  'two_factor_disabled',
  'session_created',
  'session_destroyed',
  'unauthorized_access',
  'rate_limit_exceeded',
  'suspicious_activity',
  'account_locked',
  'account_unlocked',
].includes(action);
```

**Features:**

- Risk level assessment (low, medium, high, critical)
- Security event categorization
- Console logging for monitoring
- IP and user agent tracking

### 5. Security Monitoring (`/src/lib/security-monitor.ts`)

Real-time security monitoring and threat detection:

```typescript
// Track security events and detect suspicious patterns
await trackSecurityEvent({
  type: 'login_failure',
  ip: securityInfo.ip,
  userAgent: securityInfo.userAgent,
  details: { email, endpoint: pathname },
});
```

**Features:**

- Suspicious activity pattern detection
- Multiple login failure tracking
- Unauthorized access monitoring
- Rate limit violation tracking
- Malicious user agent detection
- IP blocking recommendations

## Implementation Examples

### Protected API Endpoint

```typescript
// Example: Customer profile update endpoint
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = apiRateLimit(req);

    // Parse request body
    const body = await req.json();

    // Execute secure server action
    const result = await secureUpdateProfile(body, req);

    // Create response with rate limit headers
    const response = NextResponse.json(result);
    return addRateLimitHeaders(
      response,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );
  } catch (error) {
    // Handle errors appropriately
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

### Authentication Middleware

```typescript
// Enhanced auth middleware with security monitoring
export async function authMiddleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  try {
    if (pathname === '/api/auth/signin' && req.method === 'POST') {
      // Rate limit login attempts
      const rateLimitResult = loginRateLimit(req);

      // Track security event
      await trackSecurityEvent({
        type: 'login_failure',
        ip: securityInfo.ip,
        userAgent: securityInfo.userAgent,
        details: { email, endpoint: pathname },
      });

      return response;
    }
  } catch (error) {
    // Handle rate limit errors
    if (error instanceof RateLimitError) {
      await trackSecurityEvent({
        type: 'rate_limit_exceeded',
        ip: securityInfo.ip,
        userAgent: securityInfo.userAgent,
        details: { endpoint: pathname, retryAfter: error.retryAfter },
      });
    }
  }
}
```

## Security Headers

The implementation includes security headers in responses:

```typescript
// Rate limit headers
response.headers.set('X-RateLimit-Remaining', remaining.toString());
response.headers.set('X-RateLimit-Reset', resetTime.toString());

// Security headers (should be added to all responses)
response.headers.set('X-Content-Type-Options', 'nosniff');
response.headers.set('X-Frame-Options', 'DENY');
response.headers.set('X-XSS-Protection', '1; mode=block');
response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
```

## Monitoring and Alerts

### Security Statistics

```typescript
// Get security statistics for monitoring
const stats = getSecurityStats();
console.log('Security Stats:', {
  totalEvents: stats.totalEvents,
  eventsByType: stats.eventsByType,
  eventsByIP: stats.eventsByIP,
  suspiciousActivities: stats.suspiciousActivities,
});
```

### Suspicious Activity Detection

The system automatically detects and logs:

- Multiple login failures from same IP
- Unauthorized access attempts
- Rate limit violations
- Suspicious user agents
- Rapid request patterns

## Database Schema

The audit logging uses the existing `AuditLog` model with enhanced fields:

```sql
-- Enhanced AuditLog model for security events
model AuditLog {
  id         String    @id @default(cuid())
  actorId    String
  actorRole  String
  action     String
  targetType String
  targetId   String?
  before     Json?
  after      Json?
  ip         String?
  userAgent  String?
  userId     String?   -- For security events
  details    Json?     -- Enhanced security details
  createdAt  DateTime  @default(now())
}
```

## Best Practices

### 1. Always Verify Server-Side

```typescript
// ✅ Good: Verify on server
const session = await getServerSession(authOptions);
if (!session?.user || (session.user as any).role !== 'customer') {
  throw new Error('Unauthorized');
}

// ❌ Bad: Trust client-side data
if (userRole !== 'customer') {
  // This can be manipulated
}
```

### 2. Use Server Action Wrapper

```typescript
// ✅ Good: Use secure wrapper
const secureAction = withServerAction(handler, {
  requireAuth: true,
  requireRole: 'customer',
  auditAction: 'action_performed',
  auditTargetType: 'resource_type',
});

// ❌ Bad: Direct handler without security
export async function handler(data: any) {
  // No security checks
}
```

### 3. Apply Rate Limiting

```typescript
// ✅ Good: Apply rate limiting
const rateLimitResult = apiRateLimit(req);
if (rateLimitResult.remaining < 0) {
  throw new RateLimitError('Too many requests', rateLimitResult.retryAfter);
}

// ❌ Bad: No rate limiting
export async function handler(req: NextRequest) {
  // Vulnerable to abuse
}
```

## Testing

### Unit Tests

```typescript
// Test rate limiting
describe('Rate Limiting', () => {
  it('should block after exceeding limit', async () => {
    const req = createMockRequest();

    // Make requests up to limit
    for (let i = 0; i < 5; i++) {
      expect(() => loginRateLimit(req)).not.toThrow();
    }

    // Next request should be blocked
    expect(() => loginRateLimit(req)).toThrow(RateLimitError);
  });
});
```

### Integration Tests

```typescript
// Test protected routes
describe('Protected Routes', () => {
  it('should redirect unauthorized users', async () => {
    const response = await fetch('/portal/dashboard');
    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toContain('returnTo=');
  });
});
```

## Deployment Considerations

### 1. Environment Variables

```bash
# Security configuration
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com

# Rate limiting (for production, use Redis)
REDIS_URL=redis://localhost:6379

# Security monitoring
SECURITY_ALERT_WEBHOOK=https://hooks.slack.com/...
```

### 2. Production Enhancements

- Replace in-memory rate limiting with Redis
- Implement IP blocking at the CDN level
- Add security monitoring dashboards
- Set up automated alerts for suspicious activity
- Enable 2FA for admin accounts

### 3. Monitoring

- Monitor audit logs for security events
- Track rate limit violations
- Alert on suspicious activity patterns
- Monitor failed authentication attempts
- Track unauthorized access attempts

## Compliance

This implementation supports:

- **GDPR**: Audit logging for data access and modifications
- **SOC 2**: Comprehensive security controls and monitoring
- **PCI DSS**: Secure handling of payment-related data
- **ISO 27001**: Information security management

## Future Enhancements

1. **Advanced Threat Detection**: Machine learning-based anomaly detection
2. **Real-time Blocking**: Automatic IP blocking for suspicious activity
3. **Multi-factor Authentication**: TOTP and SMS-based 2FA
4. **Session Management**: Advanced session controls and monitoring
5. **API Security**: OAuth 2.0 and API key management
6. **Encryption**: End-to-end encryption for sensitive data

## Conclusion

This security implementation provides comprehensive protection for the Speedy Van application, following industry best practices and the specific requirements outlined in the cursor tasks. The modular design allows for easy extension and maintenance while ensuring robust security controls are in place.
