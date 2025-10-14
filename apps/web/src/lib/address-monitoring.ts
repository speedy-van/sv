/**
 * Address Autocomplete Monitoring and Security Service
 * Handles API failure logging, domain restrictions, and performance monitoring
 */

export interface SecurityConfig {
  allowedDomains: string[];
  allowedIPs: string[];
  enableReferrerCheck: boolean;
  enableRateLimiting: boolean;
  maxRequestsPerMinute: number;
}

export interface PerformanceMetrics {
  requestCount: number;
  successRate: number;
  averageResponseTime: number;
  fallbackUsageRate: number;
  cacheHitRate: number;
  errorRate: number;
}

export interface ApiFailureLog {
  timestamp: number;
  provider: 'google' | 'mapbox';
  errorType: string;
  errorMessage: string;
  query: string;
  userAgent: string;
  referrer: string;
  responseTime: number;
  httpStatus?: number;
}

export class AddressAutocompleteMonitoringService {
  private static instance: AddressAutocompleteMonitoringService;
  private failureLogs: ApiFailureLog[] = [];
  private requestCounts = new Map<string, number[]>(); // IP -> timestamps
  private performanceData: PerformanceMetrics = {
    requestCount: 0,
    successRate: 0,
    averageResponseTime: 0,
    fallbackUsageRate: 0,
    cacheHitRate: 0,
    errorRate: 0,
  };

  private securityConfig: SecurityConfig = {
    allowedDomains: [
      'localhost',
      'speedy-van.onrender.com',
      'speedy-van.co.uk',
      // Add your production domains here
    ],
    allowedIPs: [], // Can be populated for additional IP restrictions
    enableReferrerCheck: process.env.NODE_ENV === 'production',
    enableRateLimiting: true,
    maxRequestsPerMinute: 60, // Reasonable limit for address autocomplete
  };

  static getInstance(): AddressAutocompleteMonitoringService {
    if (!AddressAutocompleteMonitoringService.instance) {
      AddressAutocompleteMonitoringService.instance = new AddressAutocompleteMonitoringService();
    }
    return AddressAutocompleteMonitoringService.instance;
  }

  /**
   * Validate request security before processing
   */
  validateRequest(request?: Request): { allowed: boolean; reason?: string } {
    if (typeof window === 'undefined') {
      // Server-side validation
      if (!request) {
        return { allowed: false, reason: 'No request object provided' };
      }

      // Check referrer/origin
      if (this.securityConfig.enableReferrerCheck) {
        const origin = request.headers.get('origin');
        const referer = request.headers.get('referer');
        
        if (!origin && !referer) {
          return { allowed: false, reason: 'Missing origin/referrer headers' };
        }

        const requestDomain = origin ? new URL(origin).hostname : 
                             referer ? new URL(referer).hostname : '';

        if (!this.securityConfig.allowedDomains.includes(requestDomain)) {
          this.logSecurityViolation('Invalid domain', requestDomain, request);
          return { allowed: false, reason: `Domain not allowed: ${requestDomain}` };
        }
      }

      // Rate limiting
      if (this.securityConfig.enableRateLimiting) {
        const clientIP = this.getClientIP(request);
        if (!this.checkRateLimit(clientIP)) {
          this.logSecurityViolation('Rate limit exceeded', clientIP, request);
          return { allowed: false, reason: 'Rate limit exceeded' };
        }
      }
    } else {
      // Client-side validation
      const currentDomain = window.location.hostname;
      
      if (this.securityConfig.enableReferrerCheck && 
          !this.securityConfig.allowedDomains.includes(currentDomain)) {
        return { allowed: false, reason: `Domain not allowed: ${currentDomain}` };
      }
    }

    return { allowed: true };
  }

  /**
   * Log API failures for monitoring
   */
  logApiFailure(
    provider: 'google' | 'mapbox',
    errorType: string,
    errorMessage: string,
    query: string,
    responseTime: number,
    httpStatus?: number
  ): void {
    const logEntry: ApiFailureLog = {
      timestamp: Date.now(),
      provider,
      errorType,
      errorMessage,
      query,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      referrer: typeof document !== 'undefined' ? document.referrer : 'Unknown',
      responseTime,
      httpStatus,
    };

    this.failureLogs.push(logEntry);

    // Keep only last 100 failure logs
    if (this.failureLogs.length > 100) {
      this.failureLogs = this.failureLogs.slice(-100);
    }

    // Log to console in development (only for non-Google failures since Google is temporarily disabled)
    if (process.env.NODE_ENV === 'development' && provider !== 'google') {
      console.error('🚨 Address Autocomplete API Failure:', logEntry);
    }

    // Send to external monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(logEntry);
    }

    this.updatePerformanceMetrics();
  }

  /**
   * Track successful API requests
   */
  logApiSuccess(
    provider: 'google' | 'mapbox',
    responseTime: number,
    resultCount: number,
    cached: boolean,
    fallbackUsed: boolean
  ): void {
    this.performanceData.requestCount++;
    
    // Update running averages
    const currentAvg = this.performanceData.averageResponseTime;
    const newCount = this.performanceData.requestCount;
    this.performanceData.averageResponseTime = 
      (currentAvg * (newCount - 1) + responseTime) / newCount;

    if (cached) {
      // Update cache hit rate
    }

    if (fallbackUsed) {
      // Update fallback usage rate
    }

    this.updatePerformanceMetrics();
  }

  /**
   * Get API failure reports
   */
  getFailureLogs(limit: number = 50): ApiFailureLog[] {
    return this.failureLogs.slice(-limit);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceData };
  }

  /**
   * Get security alerts (recent violations)
   */
  getSecurityAlerts(): Array<{
    timestamp: number;
    type: string;
    details: string;
    severity: 'low' | 'medium' | 'high';
  }> {
    // Implementation for security alerts
    const recentFailures = this.failureLogs
      .filter(log => Date.now() - log.timestamp < 24 * 60 * 60 * 1000) // Last 24 hours
      .filter(log => log.errorType === 'security' || log.errorType === 'rate_limit');

    return recentFailures.map(log => ({
      timestamp: log.timestamp,
      type: log.errorType,
      details: log.errorMessage,
      severity: log.errorType === 'rate_limit' ? 'medium' : 'high' as 'medium' | 'high',
    }));
  }

  /**
   * Generate health report
   */
  generateHealthReport(): {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    metrics: PerformanceMetrics;
    recentFailures: number;
    recommendations: string[];
  } {
    const recentFailures = this.failureLogs.filter(
      log => Date.now() - log.timestamp < 60 * 60 * 1000 // Last hour
    ).length;

    const recommendations: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    if (this.performanceData.errorRate > 10) {
      status = 'critical';
      recommendations.push('High error rate detected - check API keys and quotas');
    } else if (this.performanceData.errorRate > 5) {
      status = 'warning';
      recommendations.push('Elevated error rate - monitor API usage');
    }

    if (this.performanceData.averageResponseTime > 2000) {
      status = status === 'healthy' ? 'warning' : status;
      recommendations.push('Slow response times - consider caching improvements');
    }

    if (this.performanceData.fallbackUsageRate > 20) {
      recommendations.push('High fallback usage - check primary provider reliability');
    }

    return {
      status,
      uptime: Date.now() - (this.startTime || Date.now()),
      metrics: this.performanceData,
      recentFailures,
      recommendations,
    };
  }

  private startTime = Date.now();

  private updatePerformanceMetrics(): void {
    const totalRequests = this.performanceData.requestCount;
    const failureCount = this.failureLogs.filter(
      log => Date.now() - log.timestamp < 24 * 60 * 60 * 1000 // Last 24 hours
    ).length;

    if (totalRequests > 0) {
      this.performanceData.successRate = ((totalRequests - failureCount) / totalRequests) * 100;
      this.performanceData.errorRate = (failureCount / totalRequests) * 100;
    }
  }

  private checkRateLimit(clientIP: string): boolean {
    const now = Date.now();
    const windowStart = now - 60 * 1000; // 1 minute window

    // Get or create request timestamps for this IP
    const requests = this.requestCounts.get(clientIP) || [];
    
    // Filter to only requests in the current window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= this.securityConfig.maxRequestsPerMinute) {
      return false;
    }

    // Add current request and store
    recentRequests.push(now);
    this.requestCounts.set(clientIP, recentRequests);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      this.cleanupRateLimitData();
    }

    return true;
  }

  private getClientIP(request: Request): string {
    return request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           'unknown';
  }

  private logSecurityViolation(type: string, details: string, request: Request): void {
    this.logApiFailure(
      'google', // Default provider for security logs
      'security',
      `Security violation: ${type} - ${details}`,
      '',
      0
    );
  }

  private cleanupRateLimitData(): void {
    const now = Date.now();
    const cutoff = now - 60 * 1000; // Remove data older than 1 minute

    for (const [ip, timestamps] of this.requestCounts.entries()) {
      const recentTimestamps = timestamps.filter(ts => ts > cutoff);
      if (recentTimestamps.length === 0) {
        this.requestCounts.delete(ip);
      } else {
        this.requestCounts.set(ip, recentTimestamps);
      }
    }
  }

  private async sendToMonitoringService(logEntry: ApiFailureLog): Promise<void> {
    try {
      // Example: Send to your monitoring service
      // await fetch('/api/monitoring/log-failure', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry),
      // });

      // For now, just log to console
      console.warn('API Failure logged:', logEntry);
    } catch (error) {
      console.error('Failed to send monitoring data:', error);
    }
  }
}

// Export singleton instance
export const addressMonitoringService = AddressAutocompleteMonitoringService.getInstance();

/**
 * React hook for monitoring integration
 */
export const useAddressMonitoring = () => {
  const logFailure = (
    provider: 'google' | 'mapbox',
    error: any,
    query: string,
    responseTime: number
  ) => {
    addressMonitoringService.logApiFailure(
      provider,
      error.name || 'UnknownError',
      error.message || 'Unknown error occurred',
      query,
      responseTime,
      error.status
    );
  };

  const logSuccess = (
    provider: 'google' | 'mapbox',
    responseTime: number,
    resultCount: number,
    cached: boolean = false,
    fallbackUsed: boolean = false
  ) => {
    addressMonitoringService.logApiSuccess(
      provider,
      responseTime,
      resultCount,
      cached,
      fallbackUsed
    );
  };

  const getHealthStatus = () => {
    return addressMonitoringService.generateHealthReport();
  };

  return {
    logFailure,
    logSuccess,
    getHealthStatus,
    getMetrics: () => addressMonitoringService.getPerformanceMetrics(),
    getFailures: () => addressMonitoringService.getFailureLogs(),
  };
};