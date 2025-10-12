import { logAudit } from './audit';
import { NextRequest } from 'next/server';

interface SecurityEvent {
  type:
    | 'login_failure'
    | 'unauthorized_access'
    | 'rate_limit_exceeded'
    | 'suspicious_activity';
  userId?: string;
  ip: string;
  userAgent: string;
  details: any;
  timestamp: Date;
}

// In-memory store for tracking security events (in production, use Redis)
const securityEvents = new Map<string, SecurityEvent[]>();

// Configuration for security monitoring
const SECURITY_CONFIG = {
  // Track events for this duration
  TRACKING_WINDOW_MS: 60 * 60 * 1000, // 1 hour

  // Thresholds for different security events
  LOGIN_FAILURES_THRESHOLD: 5, // 5 failed logins per hour
  UNAUTHORIZED_ACCESS_THRESHOLD: 3, // 3 unauthorized access attempts per hour
  RATE_LIMIT_EXCEEDED_THRESHOLD: 2, // 2 rate limit violations per hour

  // Suspicious activity patterns
  SUSPICIOUS_PATTERNS: {
    MULTIPLE_IPS_PER_USER: 3, // User accessing from 3+ different IPs in short time
    RAPID_REQUESTS: 50, // 50+ requests per minute
    KNOWN_MALICIOUS_IPS: [], // List of known malicious IPs
    KNOWN_MALICIOUS_USER_AGENTS: [
      'bot',
      'crawler',
      'scraper',
      'sqlmap',
      'nikto',
      'nmap',
    ],
  },
};

/**
 * Track a security event and check for suspicious patterns
 */
export async function trackSecurityEvent(
  event: Omit<SecurityEvent, 'timestamp'>
) {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: new Date(),
  };

  // Clean up old events
  cleanupOldEvents();

  // Store event
  const key = event.ip;
  if (!securityEvents.has(key)) {
    securityEvents.set(key, []);
  }
  securityEvents.get(key)!.push(fullEvent);

  // Check for suspicious patterns
  await checkSuspiciousPatterns(fullEvent);

  // Log the security event
  await logAudit(
    event.userId || 'system',
    event.type,
    event.userId || undefined,
    {
      ip: event.ip,
      userAgent: event.userAgent,
      details: event.details,
    }
  );
}

/**
 * Check for suspicious activity patterns
 */
async function checkSuspiciousPatterns(event: SecurityEvent) {
  const { ip, userId } = event;

  // Get recent events for this IP
  const recentEvents = securityEvents.get(ip) || [];
  const oneHourAgo = new Date(Date.now() - SECURITY_CONFIG.TRACKING_WINDOW_MS);
  const recentEventsInWindow = recentEvents.filter(
    e => e.timestamp > oneHourAgo
  );

  // Check login failure threshold
  const loginFailures = recentEventsInWindow.filter(
    e => e.type === 'login_failure'
  );
  if (loginFailures.length >= SECURITY_CONFIG.LOGIN_FAILURES_THRESHOLD) {
    await logSuspiciousActivity('multiple_login_failures', {
      ip,
      userId,
      failureCount: loginFailures.length,
      threshold: SECURITY_CONFIG.LOGIN_FAILURES_THRESHOLD,
    });
  }

  // Check unauthorized access threshold
  const unauthorizedAccess = recentEventsInWindow.filter(
    e => e.type === 'unauthorized_access'
  );
  if (
    unauthorizedAccess.length >= SECURITY_CONFIG.UNAUTHORIZED_ACCESS_THRESHOLD
  ) {
    await logSuspiciousActivity('multiple_unauthorized_access', {
      ip,
      userId,
      accessCount: unauthorizedAccess.length,
      threshold: SECURITY_CONFIG.UNAUTHORIZED_ACCESS_THRESHOLD,
    });
  }

  // Check rate limit violations
  const rateLimitViolations = recentEventsInWindow.filter(
    e => e.type === 'rate_limit_exceeded'
  );
  if (
    rateLimitViolations.length >= SECURITY_CONFIG.RATE_LIMIT_EXCEEDED_THRESHOLD
  ) {
    await logSuspiciousActivity('multiple_rate_limit_violations', {
      ip,
      userId,
      violationCount: rateLimitViolations.length,
      threshold: SECURITY_CONFIG.RATE_LIMIT_EXCEEDED_THRESHOLD,
    });
  }

  // Check for suspicious user agent
  const userAgent = event.userAgent.toLowerCase();
  const isSuspiciousUserAgent =
    SECURITY_CONFIG.SUSPICIOUS_PATTERNS.KNOWN_MALICIOUS_USER_AGENTS.some(
      pattern => userAgent.includes(pattern)
    );

  if (isSuspiciousUserAgent) {
    await logSuspiciousActivity('suspicious_user_agent', {
      ip,
      userId,
      userAgent: event.userAgent,
    });
  }

  // Check for rapid requests (if we have request timing data)
  if (
    recentEventsInWindow.length >
    SECURITY_CONFIG.SUSPICIOUS_PATTERNS.RAPID_REQUESTS
  ) {
    await logSuspiciousActivity('rapid_requests', {
      ip,
      userId,
      requestCount: recentEventsInWindow.length,
      threshold: SECURITY_CONFIG.SUSPICIOUS_PATTERNS.RAPID_REQUESTS,
    });
  }
}

/**
 * Log suspicious activity for further investigation
 */
async function logSuspiciousActivity(type: string, details: any) {
  await logAudit(
    details.userId || 'system',
    'suspicious_activity_detected',
    details.userId || undefined,
    {
      activityType: type,
      details,
      riskLevel: 'high',
    }
  );

  // In production, you might want to:
  // - Send alerts to security team
  // - Temporarily block IP
  // - Increase monitoring for this user/IP
  // - Trigger additional authentication challenges

  console.log(`[SECURITY_ALERT] ${type}:`, details);
}

/**
 * Clean up old security events
 */
function cleanupOldEvents() {
  const cutoff = new Date(Date.now() - SECURITY_CONFIG.TRACKING_WINDOW_MS);

  for (const [key, events] of securityEvents.entries()) {
    const filteredEvents = events.filter(e => e.timestamp > cutoff);
    if (filteredEvents.length === 0) {
      securityEvents.delete(key);
    } else {
      securityEvents.set(key, filteredEvents);
    }
  }
}

/**
 * Get security statistics for monitoring
 */
export function getSecurityStats() {
  cleanupOldEvents();

  const stats = {
    totalEvents: 0,
    eventsByType: {} as Record<string, number>,
    eventsByIP: {} as Record<string, number>,
    suspiciousActivities: 0,
  };

  for (const [ip, events] of securityEvents.entries()) {
    stats.eventsByIP[ip] = events.length;
    stats.totalEvents += events.length;

    for (const event of events) {
      stats.eventsByType[event.type] =
        (stats.eventsByType[event.type] || 0) + 1;
    }
  }

  return stats;
}

/**
 * Check if an IP should be temporarily blocked
 */
export function shouldBlockIP(ip: string): boolean {
  const events = securityEvents.get(ip) || [];
  const oneHourAgo = new Date(Date.now() - SECURITY_CONFIG.TRACKING_WINDOW_MS);
  const recentEvents = events.filter(e => e.timestamp > oneHourAgo);

  // Block if too many security violations
  const violations = recentEvents.filter(
    e =>
      e.type === 'login_failure' ||
      e.type === 'unauthorized_access' ||
      e.type === 'rate_limit_exceeded'
  );

  return violations.length >= 10; // Block after 10 violations
}

/**
 * Utility to extract security-relevant information from a request
 */
export function extractSecurityInfo(req: NextRequest) {
  return {
    ip:
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      req.ip ||
      'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    method: req.method,
    pathname: req.nextUrl.pathname,
    referer: req.headers.get('referer') || null,
    origin: req.headers.get('origin') || null,
  };
}

/**
 * Clear all security events (for testing purposes)
 */
export function clearSecurityEvents() {
  securityEvents.clear();
}
