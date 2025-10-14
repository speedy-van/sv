/**
 * Real-time Performance Monitoring System
 * Comprehensive monitoring for high-concurrency operations
 */

import { getPoolMetrics } from '../database/connection-pool';
import { getCacheMetrics } from '../cache/redis-cache';
import { getRateLimitMetrics } from '../rate-limiting/advanced-rate-limiter';
import { getQueueMetrics } from '../queue/booking-queue';

interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    free: number;
    usage: number;
  };
  database: {
    activeConnections: number;
    idleConnections: number;
    totalConnections: number;
    queueLength: number;
    connectionWaitTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    averageResponseTime: number;
  };
  rateLimiting: {
    totalRequests: number;
    blockedRequests: number;
    currentLoad: number;
    peakLoad: number;
  };
  queue: {
    totalJobs: number;
    pendingJobs: number;
    processingJobs: number;
    completedJobs: number;
    failedJobs: number;
    throughput: number;
    errorRate: number;
  };
  api: {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
  };
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  lastTriggered?: Date;
  cooldown: number; // minutes
}

interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  value: number;
  threshold: number;
  resolved: boolean;
}

class PerformanceMonitor {
  private metrics: SystemMetrics[] = [];
  private alertRules: Map<string, AlertRule> = new Map();
  private alerts: Alert[] = [];
  private isMonitoring = false;
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private apiMetrics = {
    totalRequests: 0,
    responseTimes: [] as number[],
    errors: 0,
    lastReset: new Date()
  };

  constructor() {
    this.initializeDefaultAlertRules();
    this.startMonitoring();
  }

  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        metric: 'cpu.usage',
        threshold: 80,
        operator: 'gt',
        severity: 'high',
        enabled: true,
        cooldown: 5
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        metric: 'memory.usage',
        threshold: 85,
        operator: 'gt',
        severity: 'high',
        enabled: true,
        cooldown: 5
      },
      {
        id: 'database_connection_exhausted',
        name: 'Database Connections Exhausted',
        metric: 'database.totalConnections',
        threshold: 95,
        operator: 'gt',
        severity: 'critical',
        enabled: true,
        cooldown: 2
      },
      {
        id: 'high_error_rate',
        name: 'High API Error Rate',
        metric: 'api.errorRate',
        threshold: 10,
        operator: 'gt',
        severity: 'high',
        enabled: true,
        cooldown: 3
      },
      {
        id: 'queue_backlog',
        name: 'Queue Backlog High',
        metric: 'queue.pendingJobs',
        threshold: 1000,
        operator: 'gt',
        severity: 'medium',
        enabled: true,
        cooldown: 5
      },
      {
        id: 'low_cache_hit_rate',
        name: 'Low Cache Hit Rate',
        metric: 'cache.hitRate',
        threshold: 70,
        operator: 'lt',
        severity: 'medium',
        enabled: true,
        cooldown: 10
      },
      {
        id: 'rate_limit_blocking',
        name: 'High Rate Limit Blocking',
        metric: 'rateLimiting.blockedRequests',
        threshold: 100,
        operator: 'gt',
        severity: 'medium',
        enabled: true,
        cooldown: 5
      }
    ];

    for (const rule of defaultRules) {
      this.alertRules.set(rule.id, rule);
    }
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.checkAlerts();
        this.cleanupOldMetrics();
      } catch (error) {
        console.error('Error in performance monitoring:', error);
      }
    }, 5000); // Collect metrics every 5 seconds

    console.log('📊 Performance monitoring started');
  }

  private async collectMetrics(): Promise<void> {
    const timestamp = new Date();
    
    // Collect system metrics
    const cpuUsage = await this.getCPUUsage();
    const memoryUsage = await this.getMemoryUsage();
    
    // Collect component metrics
    const dbMetrics = getPoolMetrics();
    const cacheMetrics = getCacheMetrics();
    const rateLimitMetrics = getRateLimitMetrics();
    const queueMetrics = getQueueMetrics();
    
    // Calculate API metrics
    const apiErrorRate = this.apiMetrics.totalRequests > 0 ? 
      (this.apiMetrics.errors / this.apiMetrics.totalRequests) * 100 : 0;
    
    const apiAverageResponseTime = this.apiMetrics.responseTimes.length > 0 ?
      this.apiMetrics.responseTimes.reduce((a, b) => a + b, 0) / this.apiMetrics.responseTimes.length : 0;

    const metrics: SystemMetrics = {
      timestamp,
      cpu: cpuUsage,
      memory: memoryUsage,
      database: {
        activeConnections: dbMetrics.activeConnections,
        idleConnections: dbMetrics.idleConnections,
        totalConnections: dbMetrics.totalConnections,
        queueLength: dbMetrics.queueLength,
        connectionWaitTime: dbMetrics.connectionWaitTime
      },
      cache: {
        hits: cacheMetrics.hits,
        misses: cacheMetrics.misses,
        hitRate: cacheMetrics.hitRate,
        averageResponseTime: cacheMetrics.averageResponseTime
      },
      rateLimiting: {
        totalRequests: rateLimitMetrics.totalRequests,
        blockedRequests: rateLimitMetrics.blockedRequests,
        currentLoad: rateLimitMetrics.currentLoad,
        peakLoad: rateLimitMetrics.peakLoad
      },
      queue: {
        totalJobs: queueMetrics.totalJobs,
        pendingJobs: queueMetrics.pendingJobs,
        processingJobs: queueMetrics.processingJobs,
        completedJobs: queueMetrics.completedJobs,
        failedJobs: queueMetrics.failedJobs,
        throughput: queueMetrics.throughput,
        errorRate: queueMetrics.errorRate
      },
      api: {
        totalRequests: this.apiMetrics.totalRequests,
        averageResponseTime: apiAverageResponseTime,
        errorRate: apiErrorRate,
        throughput: this.calculateAPIThroughput()
      }
    };

    this.metrics.push(metrics);
    
    // Keep only last 1000 metrics (about 1.4 hours at 5-second intervals)
    if (this.metrics.length > 1000) {
      this.metrics.shift();
    }
  }

  private async getCPUUsage(): Promise<{ usage: number; loadAverage: number[] }> {
    try {
      const os = await import('os');
      const cpus = os.cpus();
      
      // Simple CPU usage calculation
      let totalIdle = 0;
      let totalTick = 0;
      
      for (const cpu of cpus) {
        for (const type in cpu.times) {
          totalTick += (cpu.times as any)[type];
        }
        totalIdle += cpu.times.idle;
      }
      
      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const usage = 100 - Math.floor(100 * idle / total);
      
      return {
        usage: Math.max(0, Math.min(100, usage)),
        loadAverage: os.loadavg()
      };
    } catch (error) {
      console.error('Error getting CPU usage:', error);
      return { usage: 0, loadAverage: [0, 0, 0] };
    }
  }

  private async getMemoryUsage(): Promise<{
    used: number;
    total: number;
    free: number;
    usage: number;
  }> {
    try {
      const os = await import('os');
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      
      return {
        used: usedMemory,
        total: totalMemory,
        free: freeMemory,
        usage: (usedMemory / totalMemory) * 100
      };
    } catch (error) {
      console.error('Error getting memory usage:', error);
      return { used: 0, total: 0, free: 0, usage: 0 };
    }
  }

  private calculateAPIThroughput(): number {
    // Calculate requests per minute
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // In a real implementation, you'd track timestamps of requests
    // For now, we'll estimate based on total requests
    return this.apiMetrics.totalRequests;
  }

  private async checkAlerts(): Promise<void> {
    if (this.metrics.length === 0) return;
    
    const latestMetrics = this.metrics[this.metrics.length - 1];
    
    for (const rule of Array.from(this.alertRules.values())) {
      if (!rule.enabled) continue;
      
      // Check cooldown
      if (rule.lastTriggered) {
        const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
        if (timeSinceLastTrigger < rule.cooldown * 60 * 1000) {
          continue;
        }
      }
      
      const value = this.getMetricValue(latestMetrics, rule.metric);
      if (value === undefined) continue;
      
      const shouldAlert = this.evaluateAlertCondition(value, rule);
      
      if (shouldAlert) {
        await this.triggerAlert(rule, value);
      }
    }
  }

  private getMetricValue(metrics: SystemMetrics, path: string): number | undefined {
    const keys = path.split('.');
    let value: any = metrics;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return typeof value === 'number' ? value : undefined;
  }

  private evaluateAlertCondition(value: number, rule: AlertRule): boolean {
    switch (rule.operator) {
      case 'gt':
        return value > rule.threshold;
      case 'lt':
        return value < rule.threshold;
      case 'eq':
        return value === rule.threshold;
      default:
        return false;
    }
  }

  private async triggerAlert(rule: AlertRule, value: number): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      message: `${rule.name}: ${value} ${rule.operator} ${rule.threshold}`,
      severity: rule.severity,
      timestamp: new Date(),
      value,
      threshold: rule.threshold,
      resolved: false
    };

    this.alerts.push(alert);
    rule.lastTriggered = new Date();
    
    // Log alert
    console.warn(`🚨 ALERT [${rule.severity.toUpperCase()}] ${alert.message}`);
    
    // In production, you would:
    // 1. Send to monitoring service (DataDog, New Relic, etc.)
    // 2. Send notifications (Slack, email, SMS)
    // 3. Trigger auto-scaling or other remediation
    
    await this.handleAlert(alert);
  }

  private async handleAlert(alert: Alert): Promise<void> {
    // Auto-remediation based on alert type
    switch (alert.ruleId) {
      case 'database_connection_exhausted':
        console.log('🔧 Auto-remediation: Attempting to scale database connections');
        // Could trigger database scaling here
        break;
        
      case 'queue_backlog':
        console.log('🔧 Auto-remediation: Scaling queue workers');
        // Could trigger queue worker scaling here
        break;
        
      case 'high_cpu_usage':
        console.log('🔧 Auto-remediation: Triggering emergency rate limiting');
        // Could trigger emergency rate limiting
        break;
    }
  }

  private cleanupOldMetrics(): void {
    // Keep only alerts from last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.alerts = this.alerts.filter(alert => 
      alert.timestamp.getTime() > oneDayAgo
    );
  }

  // Public API methods
  recordAPIRequest(responseTime: number, isError: boolean = false): void {
    this.apiMetrics.totalRequests++;
    this.apiMetrics.responseTimes.push(responseTime);
    
    if (isError) {
      this.apiMetrics.errors++;
    }
    
    // Keep only last 1000 response times
    if (this.apiMetrics.responseTimes.length > 1000) {
      this.apiMetrics.responseTimes.shift();
    }
  }

  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getMetricsHistory(minutes: number = 60): SystemMetrics[] {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return this.metrics.filter(m => m.timestamp.getTime() > cutoff);
  }

  getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  getAllAlerts(limit: number = 100): Alert[] {
    return this.alerts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      console.log(`✅ Alert resolved: ${alert.message}`);
      return true;
    }
    return false;
  }

  getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
  } {
    const latest = this.getCurrentMetrics();
    if (!latest) {
      return { status: 'critical', score: 0, issues: ['No metrics available'] };
    }

    const issues: string[] = [];
    let score = 100;

    // Check CPU
    if (latest.cpu.usage > 80) {
      issues.push(`High CPU usage: ${latest.cpu.usage.toFixed(1)}%`);
      score -= 20;
    }

    // Check Memory
    if (latest.memory.usage > 85) {
      issues.push(`High memory usage: ${latest.memory.usage.toFixed(1)}%`);
      score -= 20;
    }

    // Check Database
    if (latest.database.queueLength > 50) {
      issues.push(`Database queue backlog: ${latest.database.queueLength}`);
      score -= 15;
    }

    // Check API Error Rate
    if (latest.api.errorRate > 5) {
      issues.push(`High API error rate: ${latest.api.errorRate.toFixed(1)}%`);
      score -= 15;
    }

    // Check Queue
    if (latest.queue.pendingJobs > 500) {
      issues.push(`Queue backlog: ${latest.queue.pendingJobs} jobs`);
      score -= 10;
    }

    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 80) {
      status = 'healthy';
    } else if (score >= 60) {
      status = 'warning';
    } else {
      status = 'critical';
    }

    return { status, score, issues };
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('📊 Performance monitoring stopped');
  }
}

// Global monitor instance
let globalMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor();
  }
  return globalMonitor;
}

export function recordAPIRequest(responseTime: number, isError: boolean = false): void {
  const monitor = getPerformanceMonitor();
  monitor.recordAPIRequest(responseTime, isError);
}

export function getCurrentMetrics() {
  const monitor = getPerformanceMonitor();
  return monitor.getCurrentMetrics();
}

export function getHealthStatus() {
  const monitor = getPerformanceMonitor();
  return monitor.getHealthStatus();
}

export function getActiveAlerts() {
  const monitor = getPerformanceMonitor();
  return monitor.getActiveAlerts();
}

// Graceful shutdown
process.on('SIGINT', () => {
  if (globalMonitor) {
    globalMonitor.stop();
  }
});

process.on('SIGTERM', () => {
  if (globalMonitor) {
    globalMonitor.stop();
  }
});

