/**
 * Comprehensive Error Logging and Monitoring System
 * Provides centralized logging for all application errors and events
 */

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Log categories
export enum LogCategory {
  // API related
  API_REQUEST = 'api_request',
  API_RESPONSE = 'api_response',
  API_ERROR = 'api_error',
  
  // Authentication & Authorization
  AUTH_LOGIN = 'auth_login',
  AUTH_LOGOUT = 'auth_logout',
  AUTH_FAILURE = 'auth_failure',
  PERMISSION_DENIED = 'permission_denied',
  
  // Business Logic
  LUXURY_BOOKING_CREATED = 'luxury_booking_created',
  LUXURY_BOOKING_UPDATED = 'luxury_booking_updated',
  PAYMENT_PROCESSED = 'payment_processed',
  PAYMENT_FAILED = 'payment_failed',
  
  // System Events
  DATABASE_ERROR = 'database_error',
  EXTERNAL_SERVICE_ERROR = 'external_service_error',
  CACHE_MISS = 'cache_miss',
  CACHE_HIT = 'cache_hit',
  
  // Security Events
  SECURITY_VIOLATION = 'security_violation',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  
  // Performance
  SLOW_QUERY = 'slow_query',
  SLOW_REQUEST = 'slow_request',
  MEMORY_WARNING = 'memory_warning',
  
  // User Actions
  USER_REGISTRATION = 'user_registration',
  USER_ACTION = 'user_action',
  FILE_UPLOAD = 'file_upload',
  
  // System Health
  HEALTH_CHECK = 'health_check',
  SYSTEM_STARTUP = 'system_startup',
  SYSTEM_SHUTDOWN = 'system_shutdown',
}

// Log entry interface
export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  
  // Context information
  requestId?: string;
  userId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  
  // Technical details
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  
  // Performance metrics
  duration?: number;
  memoryUsage?: number;
  
  // Business context
  businessContext?: {
    luxuryBookingId?: string;
    customerId?: string;
    driverId?: string;
    amount?: number;
    currency?: string;
  };
  
  // Technical context
  technicalContext?: {
    endpoint?: string;
    method?: string;
    statusCode?: number;
    dbQueries?: number;
    dbQueryTime?: number;
    cacheHit?: boolean;
  };
  
  // Additional metadata
  metadata?: Record<string, any>;
  tags?: string[];
}

// Logger configuration
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  remoteApiKey?: string;
  bufferSize: number;
  flushInterval: number; // milliseconds
  includeStackTrace: boolean;
  maxLogSize: number; // bytes
}

// Comprehensive logger class
class ComprehensiveLogger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      bufferSize: 100,
      flushInterval: 30000, // 30 seconds
      includeStackTrace: true,
      maxLogSize: 10 * 1024 * 1024, // 10MB
      ...config,
    };

    // Start flush timer
    this.startFlushTimer();
  }

  // Main logging function
  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: Partial<LogEntry>
  ): void {
    // Check if we should log this level
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      id: this.generateLogId(),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      ...context,
    };

    // Add to buffer
    this.buffer.push(entry);

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Flush if buffer is full
    if (this.buffer.length >= this.config.bufferSize) {
      this.flush();
    }
  }

  // Convenience methods
  debug(category: LogCategory, message: string, context?: Partial<LogEntry>): void {
    this.log(LogLevel.DEBUG, category, message, context);
  }

  info(category: LogCategory, message: string, context?: Partial<LogEntry>): void {
    this.log(LogLevel.INFO, category, message, context);
  }

  warn(category: LogCategory, message: string, context?: Partial<LogEntry>): void {
    this.log(LogLevel.WARN, category, message, context);
  }

  error(category: LogCategory, message: string, context?: Partial<LogEntry>): void {
    this.log(LogLevel.ERROR, category, message, context);
  }

  fatal(category: LogCategory, message: string, context?: Partial<LogEntry>): void {
    this.log(LogLevel.FATAL, category, message, context);
    this.flush(); // Immediately flush fatal errors
  }

  // API request logging
  logApiRequest(
    requestId: string,
    method: string,
    path: string,
    userId?: string,
    ip?: string,
    userAgent?: string
  ): void {
    this.info(LogCategory.API_REQUEST, `${method} ${path}`, {
      requestId,
      userId,
      ip,
      userAgent,
      technicalContext: { endpoint: path, method },
    });
  }

  // API response logging
  logApiResponse(
    requestId: string,
    statusCode: number,
    duration: number,
    cacheHit?: boolean
  ): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(level, LogCategory.API_RESPONSE, `Response ${statusCode}`, {
      requestId,
      duration,
      technicalContext: { statusCode, cacheHit },
    });
  }

  // Error logging with full context
  logError(
    error: Error,
    category: LogCategory = LogCategory.API_ERROR,
    context?: Partial<LogEntry>
  ): void {
    this.error(category, error.message, {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: this.config.includeStackTrace ? error.stack : undefined,
        code: (error as any).code,
      },
    });
  }

  // Business event logging
  logBusinessEvent(
    category: LogCategory,
    message: string,
    businessContext: LogEntry['businessContext'],
    userId?: string,
    metadata?: Record<string, any>
  ): void {
    this.info(category, message, {
      userId,
      businessContext,
      metadata,
    });
  }

  // Security event logging
  logSecurityEvent(
    message: string,
    ip?: string,
    userId?: string,
    severity: LogLevel = LogLevel.WARN,
    metadata?: Record<string, any>
  ): void {
    this.log(severity, LogCategory.SECURITY_VIOLATION, message, {
      userId,
      ip,
      metadata,
      tags: ['security'],
    });
  }

  // Performance logging
  logPerformance(
    category: LogCategory,
    message: string,
    duration: number,
    context?: Partial<LogEntry>
  ): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(level, category, message, {
      ...context,
      duration,
      tags: ['performance'],
    });
  }

  // Flush buffer to storage
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      // File logging
      if (this.config.enableFile) {
        await this.writeToFile(entries);
      }

      // Remote logging
      if (this.config.enableRemote && this.config.remoteEndpoint) {
        await this.sendToRemote(entries);
      }

    } catch (error) {
      console.error('Failed to flush logs:', error);
      // Put entries back in buffer for retry
      this.buffer.unshift(...entries);
    }
  }

  // Private helper methods
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const configLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    
    return logLevelIndex >= configLevelIndex;
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.category}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry);
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message);
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.error || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(prefix, entry.message, entry.error || entry);
        break;
    }
  }

  private async writeToFile(entries: LogEntry[]): Promise<void> {
    if (typeof window !== 'undefined') return; // Client-side, skip file logging

    try {
      const { promises: fs } = await import('fs');
      const path = await import('path');
      
      const logDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
      
      // Ensure log directory exists
      await fs.mkdir(logDir, { recursive: true });
      
      // Format entries as NDJSON
      const logLines = entries.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      
      // Append to log file
      await fs.appendFile(logFile, logLines);
      
    } catch (error) {
      console.error('Failed to write logs to file:', error);
    }
  }

  private async sendToRemote(entries: LogEntry[]): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.remoteApiKey && {
            'Authorization': `Bearer ${this.config.remoteApiKey}`,
          }),
        },
        body: JSON.stringify({ logs: entries }),
      });

      if (!response.ok) {
        throw new Error(`Remote logging failed: ${response.status} ${response.statusText}`);
      }

    } catch (error) {
      console.error('Failed to send logs to remote endpoint:', error);
      throw error;
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  // Cleanup
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush(); // Final flush
  }
}

// Global logger instance
export const logger = new ComprehensiveLogger({
  level: process.env.LOG_LEVEL as LogLevel || LogLevel.INFO,
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
  enableRemote: false, // Enable when you have a logging service
  includeStackTrace: process.env.NODE_ENV === 'development',
});

// Express/Next.js middleware for request logging
export function withRequestLogging<T extends any[]>(
  handler: (req: Request, ...args: T) => Promise<Response>,
  context?: string
) {
  return async (req: Request, ...args: T): Promise<Response> => {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    const url = new URL(req.url);
    
    // Extract user info (if available)
    const userId = req.headers.get('x-user-id') || undefined;
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = req.headers.get('user-agent') || undefined;

    // Log request start
    logger.logApiRequest(requestId, req.method, url.pathname, userId, ip, userAgent);

    let response: Response;
    let error: Error | undefined;

    try {
      response = await handler(req, ...args);
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      
      // Log error
      logger.logError(error, LogCategory.API_ERROR, {
        requestId,
        userId,
        ip,
        userAgent,
        technicalContext: {
          endpoint: url.pathname,
          method: req.method,
        },
      });
      
      throw err;
    } finally {
      const duration = Date.now() - startTime;
      
      // Log response
      if (response!) {
        logger.logApiResponse(requestId, response.status, duration);
        
        // Log slow requests
        if (duration > 2000) {
          logger.logPerformance(
            LogCategory.SLOW_REQUEST,
            `Slow request: ${req.method} ${url.pathname}`,
            duration,
            { requestId, userId }
          );
        }
      }
    }

    return response;
  };
}

// Database query logging
export function withQueryLogging<T extends any[], R>(
  queryFn: (...args: T) => Promise<R>,
  queryName: string,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const startTime = Date.now();
    
    logger.debug(LogCategory.API_REQUEST, `Database query started: ${queryName}`, {
      requestId: queryId,
      technicalContext: { method: 'DATABASE_QUERY' },
      metadata: { queryName, context },
    });

    try {
      const result = await queryFn(...args);
      const duration = Date.now() - startTime;
      
      // Log completion
      logger.debug(LogCategory.API_RESPONSE, `Database query completed: ${queryName}`, {
        requestId: queryId,
        duration,
        technicalContext: { statusCode: 200 },
      });
      
      // Log slow queries
      if (duration > 1000) {
        logger.logPerformance(
          LogCategory.SLOW_QUERY,
          `Slow database query: ${queryName}`,
          duration,
          { requestId: queryId, metadata: { queryName, context } }
        );
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.logError(error as Error, LogCategory.DATABASE_ERROR, {
        requestId: queryId,
        duration,
        metadata: { queryName, context },
      });
      
      throw error;
    }
  };
}

// Business event logging helpers
export const businessLogger = {
  luxuryBookingCreated: (luxuryBookingId: string, customerId: string, amount: number, userId?: string) => {
    logger.logBusinessEvent(
      LogCategory.LUXURY_BOOKING_CREATED,
      `New luxury booking created: ${luxuryBookingId}`,
      { luxuryBookingId, customerId, amount, currency: 'GBP' },
      userId,
      { action: 'luxury_booking_created' }
    );
  },

  paymentProcessed: (luxuryBookingId: string, amount: number, customerId: string, userId?: string) => {
    logger.logBusinessEvent(
      LogCategory.PAYMENT_PROCESSED,
      `Payment processed for luxury booking: ${luxuryBookingId}`,
      { luxuryBookingId, customerId, amount, currency: 'GBP' },
      userId,
      { action: 'payment_processed' }
    );
  },

  userRegistered: (userId: string, email: string, role: string, ip?: string) => {
    logger.logBusinessEvent(
      LogCategory.USER_REGISTRATION,
      `New user registered: ${email}`,
      { customerId: userId },
      userId,
      { action: 'user_registration', role, email }
    );
  },

  securityViolation: (violation: string, ip?: string, userId?: string, severity: LogLevel = LogLevel.WARN) => {
    logger.logSecurityEvent(
      `Security violation: ${violation}`,
      ip,
      userId,
      severity,
      { violation, action: 'security_violation' }
    );
  },
};

// Error aggregation for monitoring
export class ErrorAggregator {
  private errors = new Map<string, { count: number; lastSeen: string; samples: LogEntry[] }>();
  private maxSamples = 5;

  addError(entry: LogEntry): void {
    if (entry.level !== LogLevel.ERROR && entry.level !== LogLevel.FATAL) return;

    const key = this.getErrorKey(entry);
    const existing = this.errors.get(key);

    if (existing) {
      existing.count++;
      existing.lastSeen = entry.timestamp;
      if (existing.samples.length < this.maxSamples) {
        existing.samples.push(entry);
      }
    } else {
      this.errors.set(key, {
        count: 1,
        lastSeen: entry.timestamp,
        samples: [entry],
      });
    }
  }

  getTopErrors(limit: number = 10): Array<{
    error: string;
    count: number;
    lastSeen: string;
    samples: LogEntry[];
  }> {
    return Array.from(this.errors.entries())
      .map(([error, data]) => ({ error, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  private getErrorKey(entry: LogEntry): string {
    return `${entry.category}:${entry.error?.name || 'Unknown'}:${entry.error?.message || entry.message}`;
  }

  clear(): void {
    this.errors.clear();
  }
}

// Global error aggregator
export const errorAggregator = new ErrorAggregator();

// Health check logging
export function logHealthCheck(
  service: string,
  status: 'healthy' | 'unhealthy' | 'degraded',
  responseTime?: number,
  error?: string
): void {
  const level = status === 'healthy' ? LogLevel.INFO : LogLevel.WARN;
  
  logger.log(level, LogCategory.HEALTH_CHECK, `Health check: ${service} is ${status}`, {
    duration: responseTime,
    metadata: { service, status, error },
    tags: ['health-check', service],
  });
}

// System startup/shutdown logging
export function logSystemEvent(
  event: 'startup' | 'shutdown',
  version?: string,
  environment?: string
): void {
  const category = event === 'startup' ? LogCategory.SYSTEM_STARTUP : LogCategory.SYSTEM_SHUTDOWN;
  
  logger.info(category, `System ${event}`, {
    metadata: { version, environment, nodeVersion: process.version },
    tags: ['system', event],
  });
}

// Export logger and utilities
export { logger as default };
// Types are exported inline above
