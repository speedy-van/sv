/**
 * Logging utilities for Speedy Van
 */

import { clientEnv } from "@/config/env.client";

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  service?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  stack?: string;
}

class Logger {
  private isDevelopment = clientEnv.NODE_ENV === 'development';
  private isProduction = clientEnv.NODE_ENV === 'production';

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, service, userId, requestId, metadata } = entry;
    
    const parts = [
      `[${timestamp.toISOString()}]`,
      `[${level.toUpperCase()}]`,
    ];

    if (service) parts.push(`[${service}]`);
    if (userId) parts.push(`[user:${userId}]`);
    if (requestId) parts.push(`[req:${requestId}]`);
    
    parts.push(message);

    if (metadata && Object.keys(metadata).length > 0) {
      parts.push(`\nMetadata: ${JSON.stringify(metadata, null, 2)}`);
    }

    return parts.join(' ');
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf('info'); // Default to 'info' on client
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const formattedMessage = this.formatMessage(entry);

    switch (entry.level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(formattedMessage);
        }
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        if (entry.stack) {
          console.error(entry.stack);
        }
        break;
    }

    // In production, you might want to send logs to an external service
    if (this.isProduction && entry.level === 'error') {
      // TODO: Send to external logging service (e.g., Sentry, LogRocket)
    }
  }

  debug(message: string, metadata?: Record<string, any>, context?: { service?: string; userId?: string; requestId?: string }): void {
    this.log({
      level: 'debug',
      message,
      timestamp: new Date(),
      ...context,
      metadata,
    });
  }

  info(message: string, metadata?: Record<string, any>, context?: { service?: string; userId?: string; requestId?: string }): void {
    this.log({
      level: 'info',
      message,
      timestamp: new Date(),
      ...context,
      metadata,
    });
  }

  warn(message: string, metadata?: Record<string, any>, context?: { service?: string; userId?: string; requestId?: string }): void {
    this.log({
      level: 'warn',
      message,
      timestamp: new Date(),
      ...context,
      metadata,
    });
  }

  error(message: string, error?: Error, context?: { service?: string; userId?: string; requestId?: string }): void {
    this.log({
      level: 'error',
      message,
      timestamp: new Date(),
      ...context,
      stack: error?.stack,
      metadata: error ? { 
        name: error.name,
        message: error.message,
      } : {},
    });
  }
}

export const logger = new Logger();

// Convenience functions
export const log = {
  debug: (message: string, metadata?: Record<string, any>, context?: { service?: string; userId?: string; requestId?: string }) => 
    logger.debug(message, metadata, context),
  info: (message: string, metadata?: Record<string, any>, context?: { service?: string; userId?: string; requestId?: string }) => 
    logger.info(message, metadata, context),
  warn: (message: string, metadata?: Record<string, any>, context?: { service?: string; userId?: string; requestId?: string }) => 
    logger.warn(message, metadata, context),
  error: (message: string, error?: Error, context?: { service?: string; userId?: string; requestId?: string }) => 
    logger.error(message, error, context),
};

export default logger;