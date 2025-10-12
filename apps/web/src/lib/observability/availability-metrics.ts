/**
 * Observability and Metrics for Enterprise Availability Engine
 * Tracks availability calculations, capacity utilization, and performance
 */

import { logger } from '../logger';

/**
 * Metrics collector for availability calculations
 */
class AvailabilityMetrics {
  private metrics: Map<string, any[]> = new Map();
  
  /**
   * Record availability calculation metrics
   */
  recordCalculation(data: {
    requestId: string;
    route_type: 'economy' | 'standard' | 'express';
    projected_fill_rate: number;
    capacity_pct: number;
    next_available_date: string;
    reason: string;
    processing_time_ms: number;
    success: boolean;
    corridor?: string;
    vehicle_type?: string;
  }): void {
    const timestamp = new Date().toISOString();
    const metric = {
      ...data,
      timestamp,
      hour: new Date().getHours(),
      day_of_week: new Date().getDay()
    };

    // Store metric
    const key = `availability_calculation`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(metric);

    // Log structured metric
    logger.info('Availability calculation metric', {
      metric_type: 'availability_calculation',
      route_type: data.route_type,
      fill_rate: data.projected_fill_rate,
      capacity_pct: data.capacity_pct,
      processing_ms: data.processing_time_ms,
      success: data.success,
      next_available: data.next_available_date
    }, { requestId: data.requestId });

    // Keep only last 1000 entries per metric
    const entries = this.metrics.get(key)!;
    if (entries.length > 1000) {
      entries.splice(0, entries.length - 1000);
    }
  }

  /**
   * Record route optimization metrics
   */
  recordRouteOptimization(data: {
    requestId: string;
    corridor: string;
    initial_fill_rate: number;
    optimized_fill_rate: number;
    stops_count: number;
    estimated_duration_minutes: number;
    capacity_utilization_pct: number;
    optimization_time_ms: number;
  }): void {
    const timestamp = new Date().toISOString();
    const metric = {
      ...data,
      timestamp,
      efficiency_gain: data.optimized_fill_rate - data.initial_fill_rate
    };

    const key = 'route_optimization';
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(metric);

    logger.info('Route optimization metric', {
      metric_type: 'route_optimization',
      corridor: data.corridor,
      fill_rate_improvement: metric.efficiency_gain,
      final_capacity_pct: data.capacity_utilization_pct,
      stops: data.stops_count,
      duration_mins: data.estimated_duration_minutes
    }, { requestId: data.requestId });
  }

  /**
   * Record address validation metrics
   */
  recordAddressValidation(data: {
    requestId: string;
    address_type: 'pickup' | 'drop';
    validation_success: boolean;
    has_street: boolean;
    has_number: boolean;
    has_coordinates: boolean;
    postcode_format_valid: boolean;
    validation_time_ms: number;
  }): void {
    const timestamp = new Date().toISOString();
    const metric = { ...data, timestamp };

    const key = 'address_validation';
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(metric);

    logger.info('Address validation metric', {
      metric_type: 'address_validation',
      address_type: data.address_type,
      success: data.validation_success,
      completeness_score: [
        data.has_street,
        data.has_number,
        data.has_coordinates,
        data.postcode_format_valid
      ].filter(Boolean).length / 4,
      validation_ms: data.validation_time_ms
    }, { requestId: data.requestId });
  }

  /**
   * Record API performance metrics
   */
  recordAPIPerformance(data: {
    requestId: string;
    endpoint: string;
    method: string;
    status_code: number;
    response_time_ms: number;
    full_addresses_count: number;
    items_count: number;
    error_type?: string;
  }): void {
    const timestamp = new Date().toISOString();
    const metric = { ...data, timestamp };

    const key = 'api_performance';
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    this.metrics.get(key)!.push(metric);

    logger.info('API performance metric', {
      metric_type: 'api_performance',
      endpoint: data.endpoint,
      status: data.status_code,
      response_ms: data.response_time_ms,
      addresses: data.full_addresses_count,
      items: data.items_count,
      success: data.status_code >= 200 && data.status_code < 300
    }, { requestId: data.requestId });
  }

  /**
   * Get summary metrics for monitoring dashboard
   */
  getSummaryMetrics(hours: number = 24): {
    availability_calculations: {
      total: number;
      success_rate: number;
      avg_processing_time_ms: number;
      route_type_distribution: Record<string, number>;
      avg_fill_rate: number;
    };
    route_optimizations: {
      total: number;
      avg_efficiency_gain: number;
      avg_capacity_utilization: number;
    };
    address_validations: {
      total: number;
      success_rate: number;
      avg_completeness_score: number;
    };
    api_performance: {
      total_requests: number;
      avg_response_time_ms: number;
      success_rate: number;
      error_distribution: Record<string, number>;
    };
  } {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Availability calculations
    const availabilityCalcs = this.metrics.get('availability_calculation') || [];
    const recentAvailability = availabilityCalcs.filter(m => m.timestamp >= cutoff);
    
    const availabilityMetrics = {
      total: recentAvailability.length,
      success_rate: recentAvailability.length > 0 
        ? recentAvailability.filter(m => m.success).length / recentAvailability.length
        : 0,
      avg_processing_time_ms: recentAvailability.length > 0
        ? recentAvailability.reduce((sum, m) => sum + m.processing_time_ms, 0) / recentAvailability.length
        : 0,
      route_type_distribution: recentAvailability.reduce((dist, m) => {
        dist[m.route_type] = (dist[m.route_type] || 0) + 1;
        return dist;
      }, {} as Record<string, number>),
      avg_fill_rate: recentAvailability.length > 0
        ? recentAvailability.reduce((sum, m) => sum + m.projected_fill_rate, 0) / recentAvailability.length
        : 0
    };

    // Route optimizations
    const routeOpts = this.metrics.get('route_optimization') || [];
    const recentRouteOpts = routeOpts.filter(m => m.timestamp >= cutoff);
    
    const routeMetrics = {
      total: recentRouteOpts.length,
      avg_efficiency_gain: recentRouteOpts.length > 0
        ? recentRouteOpts.reduce((sum, m) => sum + m.efficiency_gain, 0) / recentRouteOpts.length
        : 0,
      avg_capacity_utilization: recentRouteOpts.length > 0
        ? recentRouteOpts.reduce((sum, m) => sum + m.capacity_utilization_pct, 0) / recentRouteOpts.length
        : 0
    };

    // Address validations
    const addressVals = this.metrics.get('address_validation') || [];
    const recentAddressVals = addressVals.filter(m => m.timestamp >= cutoff);
    
    const addressMetrics = {
      total: recentAddressVals.length,
      success_rate: recentAddressVals.length > 0
        ? recentAddressVals.filter(m => m.validation_success).length / recentAddressVals.length
        : 0,
      avg_completeness_score: recentAddressVals.length > 0
        ? recentAddressVals.reduce((sum, m) => {
            const score = [m.has_street, m.has_number, m.has_coordinates, m.postcode_format_valid]
              .filter(Boolean).length / 4;
            return sum + score;
          }, 0) / recentAddressVals.length
        : 0
    };

    // API performance
    const apiPerf = this.metrics.get('api_performance') || [];
    const recentApiPerf = apiPerf.filter(m => m.timestamp >= cutoff);
    
    const apiMetrics = {
      total_requests: recentApiPerf.length,
      avg_response_time_ms: recentApiPerf.length > 0
        ? recentApiPerf.reduce((sum, m) => sum + m.response_time_ms, 0) / recentApiPerf.length
        : 0,
      success_rate: recentApiPerf.length > 0
        ? recentApiPerf.filter(m => m.status_code >= 200 && m.status_code < 300).length / recentApiPerf.length
        : 0,
      error_distribution: recentApiPerf.reduce((dist, m) => {
        if (m.error_type) {
          dist[m.error_type] = (dist[m.error_type] || 0) + 1;
        }
        return dist;
      }, {} as Record<string, number>)
    };

    return {
      availability_calculations: availabilityMetrics,
      route_optimizations: routeMetrics,
      address_validations: addressMetrics,
      api_performance: apiMetrics
    };
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): Record<string, any[]> {
    const result: Record<string, any[]> = {};
    this.metrics.forEach((value, key) => {
      result[key] = [...value];
    });
    return result;
  }

  /**
   * Clear old metrics (housekeeping)
   */
  clearOldMetrics(hours: number = 168): void { // Default: keep 1 week
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    this.metrics.forEach((entries, key) => {
      const filtered = entries.filter(entry => entry.timestamp >= cutoff);
      this.metrics.set(key, filtered);
    });

    logger.info('Metrics housekeeping completed', {
      retention_hours: hours,
      cutoff_timestamp: cutoff
    });
  }
}

// Singleton instance
export const availabilityMetrics = new AvailabilityMetrics();

/**
 * Middleware function to automatically record API metrics
 */
export function createMetricsMiddleware() {
  return function recordMetrics(
    endpoint: string,
    method: string,
    requestId: string,
    startTime: number,
    statusCode: number,
    addressCount: number,
    itemsCount: number,
    error?: Error
  ) {
    availabilityMetrics.recordAPIPerformance({
      requestId,
      endpoint,
      method,
      status_code: statusCode,
      response_time_ms: Date.now() - startTime,
      full_addresses_count: addressCount,
      items_count: itemsCount,
      error_type: error?.name
    });
  };
}

/**
 * Performance monitoring decorator
 */
export function withMetrics<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operation: string
) {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    const requestId = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const result = await fn(...args);
      
      logger.info(`${operation} completed successfully`, {
        operation,
        processing_time_ms: Date.now() - startTime
      }, { requestId });
      
      return result;
    } catch (error) {
      logger.error(`${operation} failed`, error instanceof Error ? error : new Error('Unknown error'), { requestId });
      throw error;
    }
  };
}

export default availabilityMetrics;