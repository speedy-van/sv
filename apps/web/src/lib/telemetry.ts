import * as Sentry from '@sentry/nextjs';

export interface TelemetryEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: number;
  environment?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  tags?: Record<string, string>;
  timestamp?: number;
}

export interface BusinessMetric {
  name: string;
  value: number;
  category: 'driver' | 'job' | 'earnings' | 'performance' | 'system';
  tags?: Record<string, string>;
  timestamp?: number;
}

class TelemetryService {
  private sessionId: string;
  private userId?: string;
  private environment: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.environment = process.env.NODE_ENV || 'development';
    this.isEnabled = process.env.NEXT_PUBLIC_TELEMETRY_ENABLED === 'true';

    // Initialize Sentry
    if (this.isEnabled && typeof window !== 'undefined') {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: this.environment,
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setUserId(userId: string) {
    this.userId = userId;
    if (this.isEnabled) {
      Sentry.setUser({ id: userId });
    }
  }

  trackEvent(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const telemetryEvent: TelemetryEvent = {
      event,
      properties,
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      environment: this.environment,
    };

    // Send to Sentry
    Sentry.addBreadcrumb({
      category: 'telemetry',
      message: event,
      data: properties,
      level: 'info',
    });

    // Send to analytics endpoint
    this.sendToAnalytics(telemetryEvent);
  }

  trackError(error: Error, context?: Record<string, any>) {
    if (!this.isEnabled) return;

    Sentry.captureException(error, {
      extra: context,
      tags: {
        component: 'driver-portal',
        sessionId: this.sessionId,
      },
    });

    // Also send to analytics endpoint
    const telemetryEvent: TelemetryEvent = {
      event: 'error',
      properties: {
        error: error.message,
        stack: error.stack,
        ...context,
      },
      userId: this.userId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      environment: this.environment,
    };

    this.sendToAnalytics(telemetryEvent);
  }

  trackPerformance(metric: PerformanceMetric) {
    if (!this.isEnabled) return;

    // Send to performance monitoring
    this.sendToPerformanceMonitoring(metric);
  }

  trackBusinessMetric(metric: BusinessMetric) {
    if (!this.isEnabled) return;

    // Send to business metrics endpoint
    this.sendToBusinessMetrics(metric);
  }

  // Driver-specific metrics
  trackDriverLogin(success: boolean, method: string = 'email') {
    this.trackEvent('driver_login', {
      success,
      method,
      timestamp: Date.now(),
    });
  }

  trackJobClaim(jobId: string, success: boolean, reason?: string) {
    this.trackEvent('job_claim', {
      jobId,
      success,
      reason,
      timestamp: Date.now(),
    });

    if (success) {
      this.trackBusinessMetric({
        name: 'jobs_claimed',
        value: 1,
        category: 'job',
        tags: { jobId },
      });
    }
  }

  trackJobCompletion(jobId: string, duration: number, steps: string[]) {
    this.trackEvent('job_completion', {
      jobId,
      duration,
      steps,
      timestamp: Date.now(),
    });

    this.trackBusinessMetric({
      name: 'jobs_completed',
      value: 1,
      category: 'job',
      tags: { jobId },
    });

    this.trackPerformance({
      name: 'job_completion_time',
      value: duration,
      unit: 'seconds',
      tags: { jobId },
    });
  }

  trackAvailabilityChange(status: 'online' | 'offline' | 'break') {
    this.trackEvent('availability_change', {
      status,
      timestamp: Date.now(),
    });
  }

  trackDocumentUpload(
    documentType: string,
    success: boolean,
    fileSize?: number
  ) {
    this.trackEvent('document_upload', {
      documentType,
      success,
      fileSize,
      timestamp: Date.now(),
    });
  }

  trackEarningsView(period: string) {
    this.trackEvent('earnings_view', {
      period,
      timestamp: Date.now(),
    });
  }

  trackNavigationUsage(feature: string, success: boolean) {
    this.trackEvent('navigation_usage', {
      feature,
      success,
      timestamp: Date.now(),
    });
  }

  // Customer Portal specific metrics
  trackCustomerPortalLoad(loadTime: number) {
    this.trackPerformance({
      name: 'customer_portal_load_time',
      value: loadTime,
      unit: 'milliseconds',
      tags: { portal: 'customer' },
    });
  }

  trackTimeToFirstContent(page: string, timeToFirstContent: number) {
    this.trackPerformance({
      name: 'time_to_first_content',
      value: timeToFirstContent,
      unit: 'milliseconds',
      tags: { page },
    });
  }

  trackSignInSuccess(method: string, role: string) {
    this.trackEvent('auth_sign_in_success', {
      method,
      role,
      timestamp: Date.now(),
    });
  }

  trackSignInFailure(method: string, reason: string) {
    this.trackEvent('auth_sign_in_failure', {
      method,
      reason,
      timestamp: Date.now(),
    });
  }

  trackApiError(endpoint: string, status: number, error: string) {
    this.trackEvent('api_error', {
      endpoint,
      status,
      error,
      timestamp: Date.now(),
    });
  }

  trackDeepLinkRedirect(originalUrl: string, success: boolean) {
    this.trackEvent('deep_link_redirect', {
      originalUrl,
      success,
      timestamp: Date.now(),
    });
  }

  trackUnauthorizedAccess(attemptedUrl: string, userRole: string) {
    this.trackEvent('unauthorized_access', {
      attemptedUrl,
      userRole,
      timestamp: Date.now(),
    });
  }

  trackAppCrash(error: Error, context?: Record<string, any>) {
    this.trackError(error, {
      ...context,
      crashType: 'app_crash',
      sessionId: this.sessionId,
    });
  }

  trackPageLoad(page: string, loadTime: number) {
    this.trackPerformance({
      name: 'page_load_time',
      value: loadTime,
      unit: 'milliseconds',
      tags: { page },
    });
  }

  trackApiCall(
    endpoint: string,
    method: string,
    duration: number,
    success: boolean
  ) {
    this.trackPerformance({
      name: 'api_call_duration',
      value: duration,
      unit: 'milliseconds',
      tags: { endpoint, method, success: success.toString() },
    });
  }

  // NPS tracking
  trackNPS(score: number, feedback?: string) {
    this.trackEvent('nps_survey', {
      score,
      feedback,
      timestamp: Date.now(),
    });

    this.trackBusinessMetric({
      name: 'nps_score',
      value: score,
      category: 'performance',
    });
  }

  // Feature usage tracking
  trackFeatureUsage(feature: string, action: string, success: boolean) {
    this.trackEvent('feature_usage', {
      feature,
      action,
      success,
      timestamp: Date.now(),
    });
  }

  private async sendToAnalytics(event: TelemetryEvent) {
    try {
      await fetch('/api/telemetry/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  }

  private async sendToPerformanceMonitoring(metric: PerformanceMetric) {
    try {
      await fetch('/api/telemetry/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      console.error('Failed to send performance metric:', error);
    }
  }

  private async sendToBusinessMetrics(metric: BusinessMetric) {
    try {
      await fetch('/api/telemetry/business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      console.error('Failed to send business metric:', error);
    }
  }
}

// Create singleton instance
export const telemetry = new TelemetryService();

// React hook for telemetry
export function useTelemetry() {
  return telemetry;
}

// Performance monitoring
export function trackPagePerformance() {
  if (typeof window === 'undefined') return;

  // Track page load time
  const navigation = performance.getEntriesByType(
    'navigation'
  )[0] as PerformanceNavigationTiming;
  if (navigation) {
    telemetry.trackPageLoad(
      window.location.pathname,
      navigation.loadEventEnd - navigation.loadEventStart
    );
  }

  // Track Core Web Vitals
  if ('web-vital' in window) {
    // This would be set up with web-vitals library
    const webVitals = (window as any)['web-vital'];
    if (webVitals) {
      webVitals.getCLS(telemetry.trackPerformance);
      webVitals.getFID(telemetry.trackPerformance);
      webVitals.getFCP(telemetry.trackPerformance);
      webVitals.getLCP(telemetry.trackPerformance);
      webVitals.getTTFB(telemetry.trackPerformance);
    }
  }
}

// Error boundary integration
export function setupErrorBoundary() {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', event => {
    telemetry.trackError(event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', event => {
    telemetry.trackError(new Error(event.reason), {
      type: 'unhandledrejection',
    });
  });
}
