/**
 * Provider Health Monitoring System
 * Real-time monitoring of Google Places and Mapbox API performance
 */

import type { Provider, HealthMetrics, ProviderHealth, MonitoringEvent } from '@/types/dual-provider-address';

interface CircularBuffer<T> {
  push(item: T): void;
  average(): number;
  length: number;
  clear(): void;
}

class CircularBufferImpl<T> implements CircularBuffer<T> {
  private buffer: T[] = [];
  private index = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  push(item: T): void {
    if (this.buffer.length < this.capacity) {
      this.buffer.push(item);
    } else {
      this.buffer[this.index] = item;
      this.index = (this.index + 1) % this.capacity;
    }
  }

  average(): number {
    if (this.buffer.length === 0) return 0;
    
    const sum = this.buffer.reduce((acc, item) => {
      if (typeof item === 'number') return acc + item;
      return acc;
    }, 0);
    
    return sum / this.buffer.length;
  }

  clear(): void {
    this.buffer = [];
    this.index = 0;
  }

  get length(): number {
    return this.buffer.length;
  }

  getData(): T[] {
    return [...this.buffer];
  }
}

export class ProviderHealthMonitor {
  private static instance: ProviderHealthMonitor;
  private googleMetrics: HealthMetrics;
  private mapboxMetrics: HealthMetrics;
  private events: MonitoringEvent[] = [];
  private readonly maxEvents = 1000;
  private readonly bufferSize = 100;

  // Response time buffers
  private googleResponseTimes: CircularBuffer<number>;
  private mapboxResponseTimes: CircularBuffer<number>;

  // Success/Error buffers
  private googleSuccesses: CircularBuffer<number>;
  private mapboxSuccesses: CircularBuffer<number>;

  // Quota usage tracking
  private googleQuotaUsage = 0;
  private mapboxQuotaUsage = 0;
  private quotaResetTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

  // Provider switching
  private primaryProvider: Provider = 'google';
  private fallbackActive = false;
  private lastSwitchTime?: number;
  private switchReason?: string;

  constructor() {
    this.googleResponseTimes = new CircularBufferImpl(this.bufferSize);
    this.mapboxResponseTimes = new CircularBufferImpl(this.bufferSize);
    this.googleSuccesses = new CircularBufferImpl(this.bufferSize);
    this.mapboxSuccesses = new CircularBufferImpl(this.bufferSize);

    this.googleMetrics = this.initializeMetrics('google');
    this.mapboxMetrics = this.initializeMetrics('mapbox');

    // Reset quota usage daily
    this.scheduleQuotaReset();
  }

  static getInstance(): ProviderHealthMonitor {
    if (!ProviderHealthMonitor.instance) {
      ProviderHealthMonitor.instance = new ProviderHealthMonitor();
    }
    return ProviderHealthMonitor.instance;
  }

  private initializeMetrics(provider: Provider): HealthMetrics {
    return {
      provider,
      responseTime: 0,
      errorRate: 0,
      successRate: 100,
      quotaUsage: 0,
      lastUpdated: Date.now(),
      score: 100,
    };
  }

  /**
   * Record a successful API request
   */
  recordSuccess(provider: Provider, responseTime: number, resultCount: number = 1): void {
    const timestamp = Date.now();
    
    if (provider === 'google') {
      this.googleResponseTimes.push(responseTime);
      this.googleSuccesses.push(1);
      this.googleQuotaUsage++;
    } else {
      this.mapboxResponseTimes.push(responseTime);
      this.mapboxSuccesses.push(1);
      this.mapboxQuotaUsage++;
    }

    this.updateMetrics(provider);
    
    this.addEvent({
      type: 'response',
      provider,
      timestamp,
      duration: responseTime,
      metadata: { resultCount },
    });

    // Check if we should switch back to primary provider
    this.checkProviderSwitch();
  }

  /**
   * Record a failed API request
   */
  recordFailure(
    provider: Provider,
    errorType: string,
    errorMessage: string,
    query: string,
    responseTime: number,
    statusCode?: number
  ): void {
    const timestamp = Date.now();
    
    if (provider === 'google') {
      this.googleSuccesses.push(0);
      this.googleResponseTimes.push(responseTime);
    } else {
      this.mapboxSuccesses.push(0);
      this.mapboxResponseTimes.push(responseTime);
    }

    this.updateMetrics(provider);
    
    this.addEvent({
      type: 'error',
      provider,
      timestamp,
      duration: responseTime,
      error: `${errorType}: ${errorMessage}`,
      metadata: { query, statusCode },
    });

    // Check if we should switch providers due to failure
    this.checkProviderSwitch();
  }

  /**
   * Record fallback usage
   */
  recordFallback(fromProvider: Provider, toProvider: Provider, reason: string): void {
    const timestamp = Date.now();
    
    this.addEvent({
      type: 'fallback',
      provider: toProvider,
      timestamp,
      metadata: { fromProvider, reason },
    });

    this.fallbackActive = true;
    this.lastSwitchTime = timestamp;
    this.switchReason = reason;
  }

  /**
   * Record cache hit/miss
   */
  recordCacheEvent(type: 'cache_hit' | 'cache_miss', provider: Provider): void {
    this.addEvent({
      type,
      provider,
      timestamp: Date.now(),
    });
  }

  /**
   * Get current provider health status
   */
  getProviderHealth(): ProviderHealth {
    return {
      google: { ...this.googleMetrics },
      mapbox: { ...this.mapboxMetrics },
      overall: {
        primaryProvider: this.primaryProvider,
        fallbackActive: this.fallbackActive,
        lastSwitchTime: this.lastSwitchTime,
        switchReason: this.switchReason,
      },
    };
  }

  /**
   * Get the best provider based on current health metrics
   */
  getBestProvider(): Provider {
    const googleScore = this.calculateProviderScore(this.googleMetrics);
    const mapboxScore = this.calculateProviderScore(this.mapboxMetrics);

    // Add some hysteresis to prevent rapid switching
    const hysteresis = 5;
    
    if (this.primaryProvider === 'google' && mapboxScore > googleScore + hysteresis) {
      return 'mapbox';
    } else if (this.primaryProvider === 'mapbox' && googleScore > mapboxScore + hysteresis) {
      return 'google';
    }

    return this.primaryProvider;
  }

  /**
   * Force switch to a specific provider
   */
  forceSwitchProvider(provider: Provider, reason: string): void {
    this.primaryProvider = provider;
    this.fallbackActive = provider !== 'google';
    this.lastSwitchTime = Date.now();
    this.switchReason = reason;

    this.addEvent({
      type: 'fallback',
      provider,
      timestamp: Date.now(),
      metadata: { reason, forced: true },
    });
  }

  /**
   * Check if a provider should be used based on health metrics
   */
  shouldUseProvider(provider: Provider): boolean {
    const metrics = provider === 'google' ? this.googleMetrics : this.mapboxMetrics;
    
    // Don't use provider if error rate is too high
    if (metrics.errorRate > 50) return false;
    
    // Don't use provider if response time is too slow
    if (metrics.responseTime > 5000) return false;
    
    // Don't use provider if quota is exhausted
    if (metrics.quotaUsage > 90) return false;
    
    return true;
  }

  /**
   * Get performance analytics
   */
  getAnalytics() {
    const recentEvents = this.events.slice(-100);
    
    const googleEvents = recentEvents.filter(e => e.provider === 'google');
    const mapboxEvents = recentEvents.filter(e => e.provider === 'mapbox');
    
    const googleResponses = googleEvents.filter(e => e.type === 'response');
    const mapboxResponses = mapboxEvents.filter(e => e.type === 'response');
    
    const googleErrors = googleEvents.filter(e => e.type === 'error');
    const mapboxErrors = mapboxEvents.filter(e => e.type === 'error');
    
    const fallbacks = recentEvents.filter(e => e.type === 'fallback');
    const cacheHits = recentEvents.filter(e => e.type === 'cache_hit');
    const cacheMisses = recentEvents.filter(e => e.type === 'cache_miss');

    return {
      totalEvents: recentEvents.length,
      google: {
        totalRequests: googleEvents.length,
        successfulRequests: googleResponses.length,
        failedRequests: googleErrors.length,
        averageResponseTime: googleResponses.length > 0 
          ? googleResponses.reduce((sum, e) => sum + (e.duration || 0), 0) / googleResponses.length 
          : 0,
        errorRate: googleEvents.length > 0 ? (googleErrors.length / googleEvents.length) * 100 : 0,
      },
      mapbox: {
        totalRequests: mapboxEvents.length,
        successfulRequests: mapboxResponses.length,
        failedRequests: mapboxErrors.length,
        averageResponseTime: mapboxResponses.length > 0 
          ? mapboxResponses.reduce((sum, e) => sum + (e.duration || 0), 0) / mapboxResponses.length 
          : 0,
        errorRate: mapboxEvents.length > 0 ? (mapboxErrors.length / mapboxEvents.length) * 100 : 0,
      },
      fallbacks: fallbacks.length,
      cacheHitRate: (cacheHits.length + cacheMisses.length) > 0 
        ? (cacheHits.length / (cacheHits.length + cacheMisses.length)) * 100 
        : 0,
      currentProvider: this.primaryProvider,
      fallbackActive: this.fallbackActive,
    };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.googleResponseTimes.clear();
    this.mapboxResponseTimes.clear();
    this.googleSuccesses.clear();
    this.mapboxSuccesses.clear();
    this.events = [];
    this.googleQuotaUsage = 0;
    this.mapboxQuotaUsage = 0;
    this.fallbackActive = false;
    this.lastSwitchTime = undefined;
    this.switchReason = undefined;
    this.primaryProvider = 'google';
    
    this.googleMetrics = this.initializeMetrics('google');
    this.mapboxMetrics = this.initializeMetrics('mapbox');
  }

  private updateMetrics(provider: Provider): void {
    const metrics = provider === 'google' ? this.googleMetrics : this.mapboxMetrics;
    const responseTimes = provider === 'google' ? this.googleResponseTimes : this.mapboxResponseTimes;
    const successes = provider === 'google' ? this.googleSuccesses : this.mapboxSuccesses;

    metrics.responseTime = responseTimes.average();
    metrics.successRate = successes.average() * 100;
    metrics.errorRate = 100 - metrics.successRate;
    metrics.quotaUsage = this.calculateQuotaUsage(provider);
    metrics.lastUpdated = Date.now();
    metrics.score = this.calculateProviderScore(metrics);
  }

  private calculateProviderScore(metrics: HealthMetrics): number {
    // Weighted scoring: 40% response time, 40% success rate, 20% quota usage
    const responseTimeScore = Math.max(0, 100 - (metrics.responseTime / 50)); // 50ms = perfect
    const successRateScore = metrics.successRate;
    const quotaScore = Math.max(0, 100 - metrics.quotaUsage);
    
    return (responseTimeScore * 0.4) + (successRateScore * 0.4) + (quotaScore * 0.2);
  }

  private calculateQuotaUsage(provider: Provider): number {
    const usage = provider === 'google' ? this.googleQuotaUsage : this.mapboxQuotaUsage;
    const dailyLimit = provider === 'google' ? 100000 : 100000; // Adjust based on your quotas
    
    return Math.min(100, (usage / dailyLimit) * 100);
  }

  private checkProviderSwitch(): void {
    const googleScore = this.calculateProviderScore(this.googleMetrics);
    const mapboxScore = this.calculateProviderScore(this.mapboxMetrics);
    
    const threshold = 20; // Switch if score difference is > 20 points
    
    if (this.primaryProvider === 'google' && mapboxScore > googleScore + threshold) {
      this.forceSwitchProvider('mapbox', `Google score (${googleScore.toFixed(1)}) below Mapbox score (${mapboxScore.toFixed(1)})`);
    } else if (this.primaryProvider === 'mapbox' && googleScore > mapboxScore + threshold) {
      this.forceSwitchProvider('google', `Mapbox score (${mapboxScore.toFixed(1)}) below Google score (${googleScore.toFixed(1)})`);
    }
  }

  private addEvent(event: MonitoringEvent): void {
    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  private scheduleQuotaReset(): void {
    const now = Date.now();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeUntilReset = tomorrow.getTime() - now;
    
    setTimeout(() => {
      this.googleQuotaUsage = 0;
      this.mapboxQuotaUsage = 0;
      this.quotaResetTime = Date.now() + (24 * 60 * 60 * 1000);
      this.scheduleQuotaReset();
    }, timeUntilReset);
  }
}

export const providerHealthMonitor = ProviderHealthMonitor.getInstance();
export default providerHealthMonitor;
