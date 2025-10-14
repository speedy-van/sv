/**
 * Real-Time Performance Monitor for Load Testing
 * 
 * Monitors system performance metrics during load testing
 * including CPU, memory, database, and API response times
 */

import { EventEmitter } from 'events';

interface PerformanceMetrics {
  timestamp: number;
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    used: number;
    free: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  database: {
    activeConnections: number;
    queryQueue: number;
    averageQueryTime: number;
    slowQueries: number;
  };
  api: {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    activeConnections: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connectionsActive: number;
  };
}

interface AlertThreshold {
  metric: string;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  description: string;
}

class RealTimePerformanceMonitor extends EventEmitter {
  private monitoring: boolean = false;
  private metricsHistory: PerformanceMetrics[] = [];
  private alertThresholds: AlertThreshold[] = [];
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private alertsTriggered: Set<string> = new Set();

  constructor() {
    super();
    this.setupDefaultThresholds();
  }

  /**
   * Start monitoring system performance
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.monitoring) {
      console.log('⚠️  Performance monitoring already running');
      return;
    }

    console.log('📊 Starting real-time performance monitoring...');
    this.monitoring = true;
    this.metricsHistory = [];
    this.alertsTriggered.clear();

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    this.emit('monitoring-started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.monitoring) return;

    console.log('📊 Stopping performance monitoring...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.monitoring = false;
    this.emit('monitoring-stopped');
  }

  /**
   * Collect current performance metrics
   */
  private collectMetrics(): void {
    const metrics: PerformanceMetrics = {
      timestamp: Date.now(),
      cpu: this.getCpuMetrics(),
      memory: this.getMemoryMetrics(),
      database: this.getDatabaseMetrics(),
      api: this.getApiMetrics(),
      network: this.getNetworkMetrics()
    };

    this.metricsHistory.push(metrics);
    
    // Keep only last 1000 entries (about 1.4 hours at 5s intervals)
    if (this.metricsHistory.length > 1000) {
      this.metricsHistory.shift();
    }

    // Check for alerts
    this.checkAlerts(metrics);

    // Emit metrics for real-time consumption
    this.emit('metrics-updated', metrics);

    // Log summary every 10 collections (50 seconds at 5s intervals)
    if (this.metricsHistory.length % 10 === 0) {
      this.logMetricsSummary(metrics);
    }
  }

  /**
   * Get CPU metrics
   */
  private getCpuMetrics() {
    // Simulate CPU metrics
    return {
      usage: Math.random() * 100,
      load: [Math.random() * 2, Math.random() * 2, Math.random() * 2]
    };
  }

  /**
   * Get memory metrics
   */
  private getMemoryMetrics() {
    const memUsage = process.memoryUsage();
    return {
      used: memUsage.heapUsed,
      free: memUsage.heapTotal - memUsage.heapUsed,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      external: memUsage.external
    };
  }

  /**
   * Get database metrics (simulated)
   */
  private getDatabaseMetrics() {
    return {
      activeConnections: Math.floor(Math.random() * 100) + 10,
      queryQueue: Math.floor(Math.random() * 20),
      averageQueryTime: Math.random() * 500 + 50,
      slowQueries: Math.floor(Math.random() * 5)
    };
  }

  /**
   * Get API metrics (simulated)
   */
  private getApiMetrics() {
    return {
      requestsPerSecond: Math.random() * 200 + 50,
      averageResponseTime: Math.random() * 300 + 100,
      errorRate: Math.random() * 5, // 0-5%
      activeConnections: Math.floor(Math.random() * 500) + 100
    };
  }

  /**
   * Get network metrics (simulated)
   */
  private getNetworkMetrics() {
    return {
      bytesIn: Math.floor(Math.random() * 1000000) + 100000,
      bytesOut: Math.floor(Math.random() * 1000000) + 100000,
      connectionsActive: Math.floor(Math.random() * 300) + 50
    };
  }

  /**
   * Setup default alert thresholds
   */
  private setupDefaultThresholds(): void {
    this.alertThresholds = [
      {
        metric: 'cpu.usage',
        threshold: 80,
        severity: 'warning',
        description: 'High CPU usage detected'
      },
      {
        metric: 'cpu.usage',
        threshold: 95,
        severity: 'critical',
        description: 'Critical CPU usage - system overloaded'
      },
      {
        metric: 'memory.heapUsed',
        threshold: 1024 * 1024 * 512, // 512MB
        severity: 'warning',
        description: 'High memory usage detected'
      },
      {
        metric: 'memory.heapUsed',
        threshold: 1024 * 1024 * 1024, // 1GB
        severity: 'critical',
        description: 'Critical memory usage - potential memory leak'
      },
      {
        metric: 'database.activeConnections',
        threshold: 80,
        severity: 'warning',
        description: 'High database connection count'
      },
      {
        metric: 'database.averageQueryTime',
        threshold: 1000,
        severity: 'warning',
        description: 'Slow database queries detected'
      },
      {
        metric: 'api.averageResponseTime',
        threshold: 2000,
        severity: 'warning',
        description: 'API response times degrading'
      },
      {
        metric: 'api.errorRate',
        threshold: 5,
        severity: 'critical',
        description: 'High API error rate detected'
      }
    ];
  }

  /**
   * Check metrics against alert thresholds
   */
  private checkAlerts(metrics: PerformanceMetrics): void {
    for (const threshold of this.alertThresholds) {
      const value = this.getMetricValue(metrics, threshold.metric);
      const alertKey = `${threshold.metric}-${threshold.threshold}`;

      if (value > threshold.threshold) {
        if (!this.alertsTriggered.has(alertKey)) {
          this.alertsTriggered.add(alertKey);
          this.triggerAlert(threshold, value, metrics.timestamp);
        }
      } else {
        // Reset alert if value goes back to normal
        if (this.alertsTriggered.has(alertKey)) {
          this.alertsTriggered.delete(alertKey);
          this.resolveAlert(threshold, value, metrics.timestamp);
        }
      }
    }
  }

  /**
   * Get metric value from nested object
   */
  private getMetricValue(metrics: PerformanceMetrics, metricPath: string): number {
    const parts = metricPath.split('.');
    let value: any = metrics;
    
    for (const part of parts) {
      value = value[part];
      if (value === undefined) return 0;
    }
    
    return typeof value === 'number' ? value : 0;
  }

  /**
   * Trigger performance alert
   */
  private triggerAlert(threshold: AlertThreshold, value: number, timestamp: number): void {
    const alert = {
      metric: threshold.metric,
      threshold: threshold.threshold,
      actualValue: value,
      severity: threshold.severity,
      description: threshold.description,
      timestamp: timestamp,
      type: 'triggered'
    };

    const icon = threshold.severity === 'critical' ? '🚨' : '⚠️';
    console.log(`${icon} ALERT ${threshold.severity.toUpperCase()}: ${threshold.description}`);
    console.log(`    Metric: ${threshold.metric}`);
    console.log(`    Threshold: ${threshold.threshold}`);
    console.log(`    Current: ${value.toFixed(2)}`);
    console.log(`    Time: ${new Date(timestamp).toLocaleTimeString()}`);

    this.emit('alert-triggered', alert);
  }

  /**
   * Resolve performance alert
   */
  private resolveAlert(threshold: AlertThreshold, value: number, timestamp: number): void {
    const alert = {
      metric: threshold.metric,
      threshold: threshold.threshold,
      actualValue: value,
      severity: threshold.severity,
      description: threshold.description,
      timestamp: timestamp,
      type: 'resolved'
    };

    console.log(`✅ RESOLVED: ${threshold.description}`);
    console.log(`    Current: ${value.toFixed(2)} (below ${threshold.threshold})`);

    this.emit('alert-resolved', alert);
  }

  /**
   * Log metrics summary
   */
  private logMetricsSummary(metrics: PerformanceMetrics): void {
    const time = new Date(metrics.timestamp).toLocaleTimeString();
    
    console.log(`\n📊 Performance Summary (${time}):`);
    console.log(`   CPU: ${metrics.cpu.usage.toFixed(1)}% | Memory: ${(metrics.memory.heapUsed / 1024 / 1024).toFixed(0)}MB`);
    console.log(`   DB Connections: ${metrics.database.activeConnections} | Query Time: ${metrics.database.averageQueryTime.toFixed(0)}ms`);
    console.log(`   API RPS: ${metrics.api.requestsPerSecond.toFixed(0)} | Response: ${metrics.api.averageResponseTime.toFixed(0)}ms | Errors: ${metrics.api.errorRate.toFixed(1)}%`);
  }

  /**
   * Get performance trends
   */
  getTrends(minutes: number = 10): any {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const recentMetrics = this.metricsHistory.filter(m => m.timestamp > cutoff);
    
    if (recentMetrics.length === 0) return null;

    const trends = {
      cpu: this.calculateTrend(recentMetrics.map(m => m.cpu.usage)),
      memory: this.calculateTrend(recentMetrics.map(m => m.memory.heapUsed)),
      apiResponseTime: this.calculateTrend(recentMetrics.map(m => m.api.averageResponseTime)),
      apiErrorRate: this.calculateTrend(recentMetrics.map(m => m.api.errorRate)),
      dbConnections: this.calculateTrend(recentMetrics.map(m => m.database.activeConnections))
    };

    return trends;
  }

  /**
   * Calculate trend direction for a metric
   */
  private calculateTrend(values: number[]): any {
    if (values.length < 2) return { direction: 'stable', change: 0 };

    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;

    let direction = 'stable';
    if (Math.abs(change) > 5) {
      direction = change > 0 ? 'increasing' : 'decreasing';
    }

    return {
      direction,
      change: change.toFixed(1),
      first: first.toFixed(1),
      last: last.toFixed(1),
      average: (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1)
    };
  }

  /**
   * Generate performance report
   */
  generateReport(): any {
    const currentMetrics = this.metricsHistory[this.metricsHistory.length - 1];
    const trends = this.getTrends(15); // 15 minute trends
    
    return {
      timestamp: Date.now(),
      monitoring: {
        duration: this.metricsHistory.length > 0 ? 
          (currentMetrics.timestamp - this.metricsHistory[0].timestamp) / 1000 / 60 : 0, // minutes
        dataPoints: this.metricsHistory.length,
        alertsTriggered: Array.from(this.alertsTriggered)
      },
      currentMetrics: currentMetrics || null,
      trends: trends || {},
      summary: {
        overallHealth: this.calculateOverallHealth(),
        recommendations: this.generateRecommendations()
      }
    };
  }

  /**
   * Calculate overall system health score
   */
  private calculateOverallHealth(): string {
    if (!this.metricsHistory.length) return 'Unknown';
    
    const current = this.metricsHistory[this.metricsHistory.length - 1];
    let score = 100;
    
    // Deduct points for various issues
    if (current.cpu.usage > 80) score -= 20;
    if (current.memory.heapUsed > 512 * 1024 * 1024) score -= 15;
    if (current.api.errorRate > 2) score -= 25;
    if (current.api.averageResponseTime > 1000) score -= 20;
    if (current.database.averageQueryTime > 500) score -= 10;
    
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 40) return 'Poor';
    return 'Critical';
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (!this.metricsHistory.length) return recommendations;
    
    const current = this.metricsHistory[this.metricsHistory.length - 1];
    
    if (current.cpu.usage > 80) {
      recommendations.push('Consider CPU optimization or horizontal scaling');
    }
    
    if (current.memory.heapUsed > 512 * 1024 * 1024) {
      recommendations.push('Monitor for memory leaks and optimize memory usage');
    }
    
    if (current.api.errorRate > 2) {
      recommendations.push('Investigate API errors and implement better error handling');
    }
    
    if (current.api.averageResponseTime > 1000) {
      recommendations.push('Optimize API response times and database queries');
    }
    
    if (current.database.activeConnections > 80) {
      recommendations.push('Consider database connection pooling optimization');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System performance is optimal');
    }
    
    return recommendations;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(): PerformanceMetrics[] {
    return [...this.metricsHistory];
  }

  /**
   * Clear metrics history
   */
  clearHistory(): void {
    this.metricsHistory = [];
    this.alertsTriggered.clear();
    console.log('📊 Performance metrics history cleared');
  }
}

export { RealTimePerformanceMonitor, type PerformanceMetrics, type AlertThreshold };