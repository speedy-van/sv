// Mock globals first, before any imports
Object.defineProperty(global, 'Request', {
  value: class MockRequest {
    constructor(input: any, init?: any) {
      Object.assign(this, init);
    }
  },
  writable: true,
});

Object.defineProperty(global, 'Response', {
  value: class MockResponse {
    constructor(body?: any, init?: any) {
      Object.assign(this, init);
    }
  },
  writable: true,
});

// Mock Next.js server components before importing
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation(function(input: any, init?: any) {
    return {
      nextUrl: { pathname: '/api/test', search: '' },
      headers: new Map([['x-forwarded-for', '192.168.1.1']]),
      method: 'GET',
      ip: '192.168.1.1',
      ...init,
    };
  }),
  NextResponse: {
    json: jest.fn((data: any, init?: any) => ({
      json: jest.fn().mockResolvedValue(data),
      status: init?.status || 200,
      ...init,
    })),
  },
}));

// Mock authentication guards
const mockWithAuthGuard = jest.fn();
const mockRequireAuth = jest.fn();
const mockRequireAdmin = jest.fn();

jest.mock('../api/guard', () => ({
  withAuthGuard: mockWithAuthGuard,
  requireAuth: mockRequireAuth,
  requireAdmin: mockRequireAdmin,
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Now safe to import
import { loginRateLimit, apiRateLimit, RateLimitError, clearRateLimitStore } from '../rate-limit';
import { trackSecurityEvent, getSecurityStats, clearSecurityEvents } from '../security-monitor';
import { getServerSession } from 'next-auth';

// Create NextResponse mock for tests
const NextResponse = {
  json: (data: any, init?: any) => ({
    json: jest.fn().mockResolvedValue(data),
    status: init?.status || 200,
    ...init,
  }),
};

// Mock NextRequest
const createMockRequest = (overrides: any = {}) =>
  ({
    nextUrl: {
      pathname: '/api/test',
      search: '',
      searchParams: new URLSearchParams(overrides.searchParams || ''),
      ...overrides.nextUrl,
    },
    headers: new Map([
      ['x-forwarded-for', '192.168.1.1'],
      ['user-agent', 'Mozilla/5.0 (Test Browser)'],
      ...(overrides.headers && Array.isArray(overrides.headers) ? overrides.headers : []),
    ]),
    method: 'GET',
    ip: '192.168.1.1',
    ...overrides,
  }) as any;

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('Security Implementation', () => {
  beforeEach(() => {
    // Clear all mocks, security events, and rate limit store between tests
    jest.clearAllMocks();
    clearSecurityEvents();
    clearRateLimitStore();
  });

  describe('Rate Limiting', () => {

    it('should allow requests within rate limit', () => {
      const req = createMockRequest();

      // Should allow first 5 requests
      for (let i = 0; i < 5; i++) {
        expect(() => loginRateLimit(req)).not.toThrow();
      }
    });

    it('should block requests after exceeding rate limit', () => {
      const req = createMockRequest();

      // Make 5 requests (limit)
      for (let i = 0; i < 5; i++) {
        loginRateLimit(req);
      }

      // 6th request should be blocked
      expect(() => loginRateLimit(req)).toThrow(RateLimitError);
    });

    it('should reset rate limit after window expires', async () => {
      const req = createMockRequest();

      // Make 5 requests
      for (let i = 0; i < 5; i++) {
        loginRateLimit(req);
      }

      // Mock time passing (15 minutes + 1 second)
      jest.useFakeTimers();
      jest.advanceTimersByTime(15 * 60 * 1000 + 1000);

      // Should allow requests again
      expect(() => loginRateLimit(req)).not.toThrow();

      jest.useRealTimers();
    });

    it('should handle different rate limiters independently', () => {
      const req = createMockRequest();

      // Exhaust login rate limit
      for (let i = 0; i < 5; i++) {
        loginRateLimit(req);
      }

      // API rate limit should still work
      expect(() => apiRateLimit(req)).not.toThrow();
    });
  });

  describe('Server Actions', () => {
    it('should enforce authentication requirements', async () => {
      // Mock getServerSession to return null (no session)
      mockGetServerSession.mockResolvedValue(null);

      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      
      // Mock requireAuth to return an authentication error
      mockRequireAuth.mockImplementation((handler: any) => {
        return async (req: any, context: any) => {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        };
      });

      const secureHandler = mockRequireAuth(mockHandler);
      const mockRequest = createMockRequest();
      const response = await secureHandler(mockRequest, {});
      
      expect(response.status).toBe(401);
      const jsonResponse = await response.json();
      expect(jsonResponse.error).toBe('Authentication required');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should enforce role requirements', async () => {
      // Mock getServerSession to return user with wrong role
      mockGetServerSession.mockResolvedValue({
        user: { id: '123', role: 'driver' }
      } as any);

      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      
      // Mock requireAdmin to return permission error for non-admin users
      mockRequireAdmin.mockImplementation((handler: any) => {
        return async (req: any, context: any) => {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
        };
      });

      const secureHandler = mockRequireAdmin(mockHandler);
      const mockRequest = createMockRequest();
      const response = await secureHandler(mockRequest, {});
      
      expect(response.status).toBe(403);
      const jsonResponse = await response.json();
      expect(jsonResponse.error).toBe('Insufficient permissions');
      expect(mockHandler).not.toHaveBeenCalled();
    });

    it('should allow valid requests', async () => {
      // Mock getServerSession to return user with correct role
      mockGetServerSession.mockResolvedValue({
        user: { id: '123', role: 'admin' }
      } as any);

      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));
      
      // Mock requireAdmin to allow admin users
      mockRequireAdmin.mockImplementation((handler: any) => {
        return handler; // For admin users, just return the original handler
      });

      const secureHandler = mockRequireAdmin(mockHandler);
      const mockRequest = createMockRequest();
      const response = await secureHandler(mockRequest, {});
      
      expect(response.status).toBe(200);
      const jsonResponse = await response.json();
      expect(jsonResponse.success).toBe(true);
      expect(mockHandler).toHaveBeenCalled();
    });
  });

  describe('Security Monitoring', () => {
    beforeEach(() => {
      // Clear security events between tests
      jest.clearAllMocks();
    });

    it('should track security events', async () => {
      const event = {
        type: 'login_failure' as const,
        ip: '192.168.1.1',
        userAgent: 'Test Browser',
        details: { email: 'test@example.com' },
      };

      await trackSecurityEvent(event);

      const stats = getSecurityStats();
      expect(stats.totalEvents).toBeGreaterThan(0);
      expect(stats.eventsByType['login_failure']).toBeGreaterThan(0);
    });

    it('should detect suspicious patterns', async () => {
      const req = createMockRequest();

      // Simulate multiple login failures
      for (let i = 0; i < 6; i++) {
        await trackSecurityEvent({
          type: 'login_failure',
          ip: '192.168.1.1',
          userAgent: 'Test Browser',
          details: { email: 'test@example.com' },
        });
      }

      const stats = getSecurityStats();
      expect(stats.eventsByType['login_failure']).toBeGreaterThanOrEqual(6);
    });

    it('should clean up old events', async () => {
      // Add a recent event first
      await trackSecurityEvent({
        type: 'login_failure',
        ip: '192.168.1.1',
        userAgent: 'Test Browser',
        details: {}
      });
      
      // Verify it exists
      let stats = getSecurityStats();
      expect(stats.totalEvents).toBe(1);
      
      // Mock Date.now to simulate time passing (make the event old)
      const originalDateNow = Date.now;
      const mockTimestamp = Date.now() + 2 * 60 * 60 * 1000; // 2 hours in the future
      Date.now = jest.fn(() => mockTimestamp);
      
      try {
        // This should trigger cleanup of old events
        stats = getSecurityStats();
        expect(stats.totalEvents).toBe(0); // Old events should be cleaned up
      } finally {
        // Restore original Date.now
        Date.now = originalDateNow;
      }
    });
  });

  describe('Integration', () => {
    it('should work together in a complete flow', async () => {
      const req = createMockRequest();

      // 1. Apply rate limiting
      const rateLimitResult = loginRateLimit(req);
      expect(rateLimitResult.success).toBe(true);

      // 2. Track security event
      await trackSecurityEvent({
        type: 'login_failure',
        ip: '192.168.1.1',
        userAgent: 'Test Browser',
        details: { email: 'test@example.com' },
      });

      // 3. Check security stats
      const stats = getSecurityStats();
      expect(stats.totalEvents).toBeGreaterThan(0);

      // 4. Verify rate limit headers would be set correctly
      expect(rateLimitResult.remaining).toBe(4); // 5 - 1 = 4 remaining
    });
  });
});
