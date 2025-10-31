import { performanceMonitor } from './performance-monitor';
import { sentryService } from './sentry';
import { renderAnalyticsService } from './render-analytics';

// SLA thresholds
export const SLA_THRESHOLDS = {
  // Response time SLA (99% of requests under 2 seconds)
  RESPONSE_TIME_P99: 2000,
  RESPONSE_TIME_P95: 1500,
  RESPONSE_TIME_P50: 500,
  
  // Availability SLA (99.9% uptime)
  AVAILABILITY_TARGET: 99.9,
  
  // Error rate SLA (less than 0.1% error rate)
  ERROR_RATE_MAX: 0.1,
  
  // Memory usage SLA (less than 80% of available memory)
  MEMORY_USAGE_MAX: 80,
  
  // CPU usage SLA (less than 70% CPU usage)
  CPU_USAGE_MAX: 70,
  
  // Database query time SLA (95% of queries under 1 second)
  DB_QUERY_TIME_P95: 1000,
  DB_QUERY_TIME_P50: 200,
} as const;

// SLA monitoring service
export class SLAMonitor {
  private static instance: SLAMonitor;
  private metrics: Map<string, number[]> = new Map();
  private alerts: Set<string> = new Set();
  private startTime: number = Date.now();

  private constructor() {}

  public static getInstance(): SLAMonitor {
    if (!SLAMonitor.instance) {
      SLAMonitor.instance = new SLAMonitor();
    }
    return SLAMonitor.instance;
  }

  // Record API response time
  public recordApiResponseTime(route: string, method: string, duration: number, statusCode: number) {
    const key = `api_${route}_${method}`;
    this.recordMetric(key, duration);
    
    // Check SLA violations
    this.checkResponseTimeSLA(duration, route, method);
    this.checkErrorRateSLA(statusCode, route, method);
  }

  // Record database query time
  public recordDbQueryTime(operation: string, table: string, duration: number) {
    const key = `db_${operation}_${table}`;
    this.recordMetric(key, duration);
    
    // Check SLA violations
    this.checkDbQueryTimeSLA(duration, operation, table);
  }

  // Record memory usage
  public recordMemoryUsage(usage: number) {
    this.recordMetric('memory_usage', usage);
    
    // Check SLA violations
    this.checkMemoryUsageSLA(usage);
  }

  // Record CPU usage
  public recordCpuUsage(usage: number) {
    this.recordMetric('cpu_usage', usage);
    
    // Check SLA violations
    this.checkCpuUsageSLA(usage);
  }

  // Record availability
  public recordAvailability(isAvailable: boolean) {
    const key = 'availability';
    this.recordMetric(key, isAvailable ? 1 : 0);
    
    // Check SLA violations
    this.checkAvailabilitySLA();
  }

  // Check response time SLA
  private checkResponseTimeSLA(duration: number, route: string, method: string) {
    if (duration > SLA_THRESHOLDS.RESPONSE_TIME_P99) {
      this.handleSLAViolation('response_time_p99', {
        route,
        method,
        duration,
        threshold: SLA_THRESHOLDS.RESPONSE_TIME_P99,
        severity: 'critical',
      });
    } else if (duration > SLA_THRESHOLDS.RESPONSE_TIME_P95) {
      this.handleSLAViolation('response_time_p95', {
        route,
        method,
        duration,
        threshold: SLA_THRESHOLDS.RESPONSE_TIME_P95,
        severity: 'warning',
      });
    }
  }

  // Check error rate SLA
  private checkErrorRateSLA(statusCode: number, route: string, method: string) {
    const key = `error_rate_${route}_${method}`;
    const errorRate = this.calculateErrorRate(key);
    
    if (errorRate > SLA_THRESHOLDS.ERROR_RATE_MAX) {
      this.handleSLAViolation('error_rate', {
        route,
        method,
        errorRate,
        threshold: SLA_THRESHOLDS.ERROR_RATE_MAX,
        severity: 'critical',
      });
    }
  }

  // Check database query time SLA
  private checkDbQueryTimeSLA(duration: number, operation: string, table: string) {
    if (duration > SLA_THRESHOLDS.DB_QUERY_TIME_P95) {
      this.handleSLAViolation('db_query_time_p95', {
        operation,
        table,
        duration,
        threshold: SLA_THRESHOLDS.DB_QUERY_TIME_P95,
        severity: 'critical',
      });
    } else if (duration > SLA_THRESHOLDS.DB_QUERY_TIME_P50) {
      this.handleSLAViolation('db_query_time_p50', {
        operation,
        table,
        duration,
        threshold: SLA_THRESHOLDS.DB_QUERY_TIME_P50,
        severity: 'warning',
      });
    }
  }

  // Check memory usage SLA
  private checkMemoryUsageSLA(usage: number) {
    const usagePercent = (usage / (1024 * 1024 * 1024)) * 100; // Convert to GB and percentage
    
    if (usagePercent > SLA_THRESHOLDS.MEMORY_USAGE_MAX) {
      this.handleSLAViolation('memory_usage', {
        usage: usagePercent,
        threshold: SLA_THRESHOLDS.MEMORY_USAGE_MAX,
        severity: 'critical',
      });
    }
  }

  // Check CPU usage SLA
  private checkCpuUsageSLA(usage: number) {
    if (usage > SLA_THRESHOLDS.CPU_USAGE_MAX) {
      this.handleSLAViolation('cpu_usage', {
        usage,
        threshold: SLA_THRESHOLDS.CPU_USAGE_MAX,
        severity: 'critical',
      });
    }
  }

  // Check availability SLA
  private checkAvailabilitySLA() {
    const availability = this.calculateAvailability();
    
    if (availability < SLA_THRESHOLDS.AVAILABILITY_TARGET) {
      this.handleSLAViolation('availability', {
        availability,
        threshold: SLA_THRESHOLDS.AVAILABILITY_TARGET,
        severity: 'critical',
      });
    }
  }

  // Handle SLA violation
  private handleSLAViolation(type: string, context: Record<string, any>) {
    const alertKey = `${type}_${JSON.stringify(context)}`;
    
    // Avoid duplicate alerts
    if (this.alerts.has(alertKey)) {
      return;
    }
    
    this.alerts.add(alertKey);
    
    // Send alert to Sentry
    sentryService.captureMessage(
      `SLA violation detected: ${type}`,
      'error',
      context
    );
    
    // Track analytics
    renderAnalyticsService.track('sla_violation', {
      type,
      ...context,
      timestamp: Date.now(),
    });
    
    // Log the violation
    console.error(`SLA violation: ${type}`, context);
    
    // Clear alert after 10 minutes
    setTimeout(() => {
      this.alerts.delete(alertKey);
    }, 10 * 60 * 1000);
  }

  // Record metric
  private recordMetric(key: string, value: number) {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const values = this.metrics.get(key)!;
    values.push(value);
    
    // Keep only last 1000 values
    if (values.length > 1000) {
      values.splice(0, values.length - 1000);
    }
  }

  // Calculate error rate
  private calculateErrorRate(key: string): number {
    const values = this.metrics.get(key) || [];
    if (values.length === 0) return 0;
    
    const errorCount = values.filter(v => v >= 400).length;
    return (errorCount / values.length) * 100;
  }

  // Calculate availability
  private calculateAvailability(): number {
    const values = this.metrics.get('availability') || [];
    if (values.length === 0) return 100;
    
    const availableCount = values.filter(v => v === 1).length;
    return (availableCount / values.length) * 100;
  }

  // Get SLA status
  public getSLAStatus(): Record<string, any> {
    const stats = performanceMonitor.getStats();
    const availability = this.calculateAvailability();
    
    return {
      // Response time metrics
      responseTime: {
        p50: stats.api_response_time?.p50 || 0,
        p95: stats.api_response_time?.p95 || 0,
        p99: stats.api_response_time?.p99 || 0,
        sla_p99: stats.api_response_time?.p99 <= SLA_THRESHOLDS.RESPONSE_TIME_P99,
        sla_p95: stats.api_response_time?.p95 <= SLA_THRESHOLDS.RESPONSE_TIME_P95,
      },
      
      // Database metrics
      database: {
        p50: stats.db_query_time?.p50 || 0,
        p95: stats.db_query_time?.p95 || 0,
        sla_p95: stats.db_query_time?.p95 <= SLA_THRESHOLDS.DB_QUERY_TIME_P95,
        sla_p50: stats.db_query_time?.p50 <= SLA_THRESHOLDS.DB_QUERY_TIME_P50,
      },
      
      // System metrics
      system: {
        memory: {
          usage: stats.memory_heap_used?.avg || 0,
          sla: (stats.memory_heap_used?.avg || 0) <= SLA_THRESHOLDS.MEMORY_USAGE_MAX * 1024 * 1024,
        },
        cpu: {
          usage: stats.cpu_usage?.avg || 0,
          sla: (stats.cpu_usage?.avg || 0) <= SLA_THRESHOLDS.CPU_USAGE_MAX,
        },
      },
      
      // Availability
      availability: {
        current: availability,
        sla: availability >= SLA_THRESHOLDS.AVAILABILITY_TARGET,
        target: SLA_THRESHOLDS.AVAILABILITY_TARGET,
      },
      
      // Overall SLA status
      overall: {
        status: this.calculateOverallSLAStatus(),
        timestamp: new Date().toISOString(),
        uptime: Date.now() - this.startTime,
      },
    };
  }

  // Calculate overall SLA status
  private calculateOverallSLAStatus(): 'healthy' | 'warning' | 'critical' {
    const status = this.getSLAStatus();
    
    // Check for critical violations
    if (!status.responseTime.sla_p99 || 
        !status.database.sla_p95 || 
        !status.system.memory.sla || 
        !status.system.cpu.sla || 
        !status.availability.sla) {
      return 'critical';
    }
    
    // Check for warning violations
    if (!status.responseTime.sla_p95 || !status.database.sla_p50) {
      return 'warning';
    }
    
    return 'healthy';
  }

  // Start SLA monitoring
  public startMonitoring() {
    // Monitor system resources every 30 seconds
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.recordMemoryUsage(memUsage.heapUsed);
      
      // Simulate CPU usage monitoring (in real implementation, use proper CPU monitoring)
      const cpuUsage = Math.random() * 100;
      this.recordCpuUsage(cpuUsage);
      
      // Record availability (simplified)
      this.recordAvailability(true);
    }, 30000);
    
    console.log('SLA monitoring started');
  }
}

// Export singleton instance
export const slaMonitor = SLAMonitor.getInstance();
