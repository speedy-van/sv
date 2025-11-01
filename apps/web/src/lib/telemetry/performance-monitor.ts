import { telemetryService } from './opentelemetry';
import { sentryService } from './sentry';

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  API_RESPONSE_TIME: 2000, // 2 seconds
  DB_QUERY_TIME: 1000, // 1 second
  BUSINESS_OPERATION_TIME: 5000, // 5 seconds
  MEMORY_USAGE: 100 * 1024 * 1024, // 100MB
  CPU_USAGE: 80, // 80%
} as const;

// Performance monitoring service
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private alerts: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Monitor API route performance
  public async monitorApiRoute<T>(
    route: string,
    method: string,
    handler: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const span = telemetryService.createApiSpan(route, method);
    
    try {
      const result = await handler();
      const duration = Date.now() - startTime;
      
      // Record metrics
      telemetryService.recordApiResponseTime(route, method, duration, 200);
      this.recordMetric('api_response_time', duration, { route, method, status: '200' });
      
      // Check performance threshold
      if (duration > PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME) {
        this.handlePerformanceIssue('api_slow_response', {
          route,
          method,
          duration,
          threshold: PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME,
        });
      }
      
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const statusCode = this.getErrorStatusCode(error);
      
      // Record error metrics
      telemetryService.recordApiResponseTime(route, method, duration, statusCode);
      this.recordMetric('api_response_time', duration, { route, method, status: statusCode.toString() });
      
      // Capture error
      sentryService.captureApiError(error as Error, {
        route,
        method,
        requestId: this.generateRequestId(),
      });
      
      span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
      throw error;
    } finally {
      span.end();
    }
  }

  // Monitor database operation performance
  public async monitorDbOperation<T>(
    operation: string,
    table: string,
    handler: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const span = telemetryService.createDbSpan(operation, table);
    
    try {
      const result = await handler();
      const duration = Date.now() - startTime;
      
      // Record metrics
      telemetryService.recordDbQueryTime(operation, table, duration);
      this.recordMetric('db_query_time', duration, { operation, table });
      
      // Check performance threshold
      if (duration > PERFORMANCE_THRESHOLDS.DB_QUERY_TIME) {
        this.handlePerformanceIssue('db_slow_query', {
          operation,
          table,
          duration,
          threshold: PERFORMANCE_THRESHOLDS.DB_QUERY_TIME,
        });
      }
      
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record error metrics
      telemetryService.recordDbQueryTime(operation, table, duration);
      this.recordMetric('db_query_time', duration, { operation, table, error: 'true' });
      
      // Capture error
      sentryService.captureDbError(error as Error, {
        operation,
        table,
      });
      
      span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
      throw error;
    } finally {
      span.end();
    }
  }

  // Monitor business operation performance
  public async monitorBusinessOperation<T>(
    operation: string,
    context: Record<string, any>,
    handler: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const span = telemetryService.createBusinessSpan(operation, context);
    
    try {
      const result = await handler();
      const duration = Date.now() - startTime;
      
      // Record metrics
      telemetryService.recordBusinessOperationTime(operation, duration, true);
      this.recordMetric('business_operation_time', duration, { operation, success: 'true' });
      
      // Check performance threshold
      if (duration > PERFORMANCE_THRESHOLDS.BUSINESS_OPERATION_TIME) {
      this.handlePerformanceIssue('business_slow_operation', {
        operation,
        duration,
        threshold: PERFORMANCE_THRESHOLDS.BUSINESS_OPERATION_TIME,
        userId: context.userId,
      });
      }
      
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Record error metrics
      telemetryService.recordBusinessOperationTime(operation, duration, false);
      this.recordMetric('business_operation_time', duration, { operation, success: 'false' });
      
      // Capture error
      sentryService.captureBusinessError(error as Error, {
        operation,
        businessContext: context,
      });
      
      span.setStatus({ code: 2, message: (error as Error).message }); // ERROR
      throw error;
    } finally {
      span.end();
    }
  }

  // Monitor system resources
  public monitorSystemResources() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Memory monitoring
    if (memUsage.heapUsed > PERFORMANCE_THRESHOLDS.MEMORY_USAGE) {
      this.handlePerformanceIssue('high_memory_usage', {
        heapUsed: memUsage.heapUsed,
        threshold: PERFORMANCE_THRESHOLDS.MEMORY_USAGE,
      });
    }
    
    // Record memory metrics
    this.recordMetric('memory_heap_used', memUsage.heapUsed);
    this.recordMetric('memory_heap_total', memUsage.heapTotal);
    this.recordMetric('memory_external', memUsage.external);
    this.recordMetric('memory_rss', memUsage.rss);
    
    // CPU monitoring (simplified)
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    if (cpuPercent > PERFORMANCE_THRESHOLDS.CPU_USAGE) {
      this.handlePerformanceIssue('high_cpu_usage', {
        cpuUsage: cpuPercent,
        threshold: PERFORMANCE_THRESHOLDS.CPU_USAGE,
      });
    }
    
    this.recordMetric('cpu_usage', cpuPercent);
  }

  // Record custom metric
  private recordMetric(name: string, value: number, labels: Record<string, string> = {}) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.splice(0, values.length - 1000);
    }
    
    // Record in OpenTelemetry
    telemetryService.recordMetric(name, value, labels);
  }

  // Handle performance issues
  private handlePerformanceIssue(type: string, context: Record<string, any>) {
    const alertKey = `${type}_${JSON.stringify(context)}`;
    
    // Avoid duplicate alerts
    if (this.alerts.has(alertKey)) {
      return;
    }
    
    this.alerts.add(alertKey);
    
    // Send alert to Sentry
    sentryService.capturePerformanceIssue(
      `Performance issue detected: ${type}`,
      context as { operation: string; duration: number; threshold: number; userId?: string }
    );
    
    // Log the issue
    console.warn(`Performance issue: ${type}`, context);
    
    // Clear alert after 5 minutes
    setTimeout(() => {
      this.alerts.delete(alertKey);
    }, 5 * 60 * 1000);
  }

  // Get error status code
  private getErrorStatusCode(error: any): number {
    if (error?.statusCode) return error.statusCode;
    if (error?.status) return error.status;
    if (error?.code === 'ENOTFOUND') return 404;
    if (error?.code === 'ECONNREFUSED') return 503;
    return 500;
  }

  // Generate request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get performance statistics
  public getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      if (values.length === 0) continue;
      
      const sorted = [...values].sort((a, b) => a - b);
      const len = sorted.length;
      
      stats[name] = {
        count: len,
        min: sorted[0],
        max: sorted[len - 1],
        avg: values.reduce((a, b) => a + b, 0) / len,
        p50: sorted[Math.floor(len * 0.5)],
        p95: sorted[Math.floor(len * 0.95)],
        p99: sorted[Math.floor(len * 0.99)],
      };
    }
    
    return stats;
  }

  // Start monitoring
  public startMonitoring() {
    // Monitor system resources every 30 seconds
    setInterval(() => {
      this.monitorSystemResources();
    }, 30000);
    
    console.log('Performance monitoring started');
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
