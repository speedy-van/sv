/**
 * Advanced Rate Limiting System
 * Protects against overload and ensures fair resource allocation
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
  onLimitReached?: (req: any, res: any) => void;
}

interface RateLimitRule {
  id: string;
  name: string;
  config: RateLimitConfig;
  priority: number;
  enabled: boolean;
}

interface RateLimitMetrics {
  totalRequests: number;
  blockedRequests: number;
  averageResponseTime: number;
  currentLoad: number;
  peakLoad: number;
  lastReset: Date;
}

class AdvancedRateLimiter {
  private rules: Map<string, RateLimitRule> = new Map();
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private metrics: RateLimitMetrics = {
    totalRequests: 0,
    blockedRequests: 0,
    averageResponseTime: 0,
    currentLoad: 0,
    peakLoad: 0,
    lastReset: new Date()
  };
  private responseTimes: number[] = [];

  constructor() {
    this.initializeDefaultRules();
    this.startMetricsReset();
  }

  private initializeDefaultRules(): void {
    // General API rate limiting
    this.addRule({
      id: 'general_api',
      name: 'General API Rate Limit',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 1000,
        keyGenerator: (req) => req.ip || 'unknown'
      },
      priority: 1,
      enabled: true
    });

    // Booking endpoint specific limits
    this.addRule({
      id: 'booking_endpoint',
      name: 'Booking Endpoint Rate Limit',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 100, // Lower limit for booking operations
        keyGenerator: (req) => `booking:${req.ip || 'unknown'}`
      },
      priority: 2,
      enabled: true
    });

    // Payment endpoint limits (stricter)
    this.addRule({
      id: 'payment_endpoint',
      name: 'Payment Endpoint Rate Limit',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 50, // Very strict for payment operations
        keyGenerator: (req) => `payment:${req.ip || 'unknown'}`
      },
      priority: 3,
      enabled: true
    });

    // Driver operations
    this.addRule({
      id: 'driver_operations',
      name: 'Driver Operations Rate Limit',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 200,
        keyGenerator: (req) => `driver:${req.user?.id || req.ip || 'unknown'}`
      },
      priority: 2,
      enabled: true
    });

    // Admin operations (higher limits)
    this.addRule({
      id: 'admin_operations',
      name: 'Admin Operations Rate Limit',
      config: {
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 500,
        keyGenerator: (req) => `admin:${req.user?.id || req.ip || 'unknown'}`
      },
      priority: 1,
      enabled: true
    });

    // Burst protection
    this.addRule({
      id: 'burst_protection',
      name: 'Burst Protection',
      config: {
        windowMs: 10 * 1000, // 10 seconds
        maxRequests: 50, // Very strict burst protection
        keyGenerator: (req) => `burst:${req.ip || 'unknown'}`
      },
      priority: 4,
      enabled: true
    });
  }

  addRule(rule: RateLimitRule): void {
    this.rules.set(rule.id, rule);
    console.log(`✅ Added rate limit rule: ${rule.name}`);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    console.log(`🗑️ Removed rate limit rule: ${ruleId}`);
  }

  updateRule(ruleId: string, updates: Partial<RateLimitRule>): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
      console.log(`🔄 Updated rate limit rule: ${ruleId}`);
    }
  }

  async checkRateLimit(req: any, endpoint?: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    rule: string;
    retryAfter?: number;
  }> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    // Get applicable rules sorted by priority
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .filter(rule => this.isRuleApplicable(rule, req, endpoint))
      .sort((a, b) => b.priority - a.priority);

    for (const rule of applicableRules) {
      const result = await this.checkRule(rule, req);
      if (!result.allowed) {
        this.metrics.blockedRequests++;
        const duration = Date.now() - startTime;
        this.updateResponseTime(duration);
        
        return {
          ...result,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        };
      }
    }

    const duration = Date.now() - startTime;
    this.updateResponseTime(duration);

    return {
      allowed: true,
      remaining: 999,
      resetTime: Date.now() + 60000,
      rule: 'none'
    };
  }

  private isRuleApplicable(rule: RateLimitRule, req: any, endpoint?: string): boolean {
    // Check if rule applies to this endpoint
    if (endpoint) {
      if (rule.id === 'booking_endpoint' && endpoint.includes('/booking')) {
        return true;
      }
      if (rule.id === 'payment_endpoint' && endpoint.includes('/payment')) {
        return true;
      }
      if (rule.id === 'driver_operations' && endpoint.includes('/driver')) {
        return true;
      }
      if (rule.id === 'admin_operations' && endpoint.includes('/admin')) {
        return true;
      }
    }

    // General rules always apply
    return ['general_api', 'burst_protection'].includes(rule.id);
  }

  private async checkRule(rule: RateLimitRule, req: any): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    rule: string;
  }> {
    const key = rule.config.keyGenerator ? rule.config.keyGenerator(req) : req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - rule.config.windowMs;

    // Get or create counter for this key
    let counter = this.requestCounts.get(key);
    
    if (!counter || counter.resetTime < now) {
      // Create new counter or reset expired one
      counter = {
        count: 0,
        resetTime: now + rule.config.windowMs
      };
      this.requestCounts.set(key, counter);
    }

    // Check if limit exceeded
    if (counter.count >= rule.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: counter.resetTime,
        rule: rule.id
      };
    }

    // Increment counter
    counter.count++;

    return {
      allowed: true,
      remaining: rule.config.maxRequests - counter.count,
      resetTime: counter.resetTime,
      rule: rule.id
    };
  }

  private updateResponseTime(duration: number): void {
    this.responseTimes.push(duration);
    
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
    
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
  }

  private startMetricsReset(): void {
    // Reset metrics every hour
    setInterval(() => {
      this.metrics.totalRequests = 0;
      this.metrics.blockedRequests = 0;
      this.metrics.lastReset = new Date();
      this.metrics.peakLoad = Math.max(this.metrics.peakLoad, this.metrics.currentLoad);
      this.metrics.currentLoad = 0;
    }, 60 * 60 * 1000);
  }

  updateLoad(currentLoad: number): void {
    this.metrics.currentLoad = currentLoad;
    this.metrics.peakLoad = Math.max(this.metrics.peakLoad, currentLoad);
  }

  getMetrics(): RateLimitMetrics {
    return { ...this.metrics };
  }

  getRules(): RateLimitRule[] {
    return Array.from(this.rules.values());
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, counter] of Array.from(this.requestCounts.entries())) {
      if (counter.resetTime < now) {
        this.requestCounts.delete(key);
      }
    }
  }

  // Emergency rate limiting for system protection
  async emergencyRateLimit(): Promise<boolean> {
    const currentLoad = this.metrics.currentLoad;
    
    // If load is too high, apply emergency limits
    if (currentLoad > 80) { // 80% capacity
      const emergencyRule: RateLimitRule = {
        id: 'emergency',
        name: 'Emergency Rate Limit',
        config: {
          windowMs: 60 * 1000,
          maxRequests: 10, // Very strict emergency limit
          keyGenerator: (req) => `emergency:${req.ip || 'unknown'}`
        },
        priority: 5,
        enabled: true
      };
      
      this.addRule(emergencyRule);
      
      // Auto-remove emergency rule after 5 minutes
      setTimeout(() => {
        this.removeRule('emergency');
      }, 5 * 60 * 1000);
      
      return true;
    }
    
    return false;
  }
}

// Global rate limiter instance
let globalRateLimiter: AdvancedRateLimiter | null = null;

export function getRateLimiter(): AdvancedRateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new AdvancedRateLimiter();
  }
  return globalRateLimiter;
}

// Middleware function for Express/Next.js
export function rateLimitMiddleware(endpoint?: string) {
  return async (req: any, res: any, next?: any) => {
    const limiter = getRateLimiter();
    const result = await limiter.checkRateLimit(req, endpoint);
    
    if (!result.allowed) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later',
        retryAfter: result.retryAfter,
        rule: result.rule
      });
      return;
    }
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': '1000',
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });
    
    if (next) {
      next();
    }
  };
}

// Utility functions
export async function checkRateLimit(req: any, endpoint?: string) {
  const limiter = getRateLimiter();
  return limiter.checkRateLimit(req, endpoint);
}

export function getRateLimitMetrics() {
  const limiter = getRateLimiter();
  return limiter.getMetrics();
}

export function updateSystemLoad(load: number) {
  const limiter = getRateLimiter();
  limiter.updateLoad(load);
}

export async function triggerEmergencyRateLimit() {
  const limiter = getRateLimiter();
  return limiter.emergencyRateLimit();
}

// Cleanup interval
setInterval(async () => {
  if (globalRateLimiter) {
    await globalRateLimiter.cleanup();
  }
}, 60 * 1000); // Cleanup every minute

