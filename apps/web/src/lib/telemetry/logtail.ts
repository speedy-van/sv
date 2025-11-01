// Logtail integration for structured logging
export class LogtailService {
  private static instance: LogtailService;
  private logtail: any = null;
  private isEnabled: boolean = false;

  private constructor() {
    this.isEnabled = !!process.env.LOGTAIL_TOKEN;
    
    // Logtail is optional - only enable if token is provided
    // Will use console.log as fallback
  }

  public static getInstance(): LogtailService {
    if (!LogtailService.instance) {
      LogtailService.instance = new LogtailService();
    }
    return LogtailService.instance;
  }

  // Log API request
  public logApiRequest(data: {
    method: string;
    route: string;
    statusCode: number;
    responseTime: number;
    userId?: string;
    userRole?: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
  }) {
    if (!this.isEnabled || !this.logtail) return;

    this.logtail.info('API Request', {
      type: 'api_request',
      method: data.method,
      route: data.route,
      status_code: data.statusCode,
      response_time_ms: data.responseTime,
      user_id: data.userId,
      user_role: data.userRole,
      request_id: data.requestId,
      ip: data.ip,
      user_agent: data.userAgent,
      timestamp: new Date().toISOString(),
    });
  }

  // Log API error
  public logApiError(data: {
    method: string;
    route: string;
    error: string;
    stack?: string;
    userId?: string;
    userRole?: string;
    requestId?: string;
    ip?: string;
    userAgent?: string;
  }) {
    if (!this.isEnabled || !this.logtail) return;

    this.logtail.error('API Error', {
      type: 'api_error',
      method: data.method,
      route: data.route,
      error: data.error,
      stack: data.stack,
      user_id: data.userId,
      user_role: data.userRole,
      request_id: data.requestId,
      ip: data.ip,
      user_agent: data.userAgent,
      timestamp: new Date().toISOString(),
    });
  }

  // Log database operation
  public logDbOperation(data: {
    operation: string;
    table: string;
    duration: number;
    success: boolean;
    error?: string;
    query?: string;
    userId?: string;
  }) {
    if (!this.isEnabled || !this.logtail) return;

    this.logtail.info('Database Operation', {
      type: 'db_operation',
      operation: data.operation,
      table: data.table,
      duration_ms: data.duration,
      success: data.success,
      error: data.error,
      query: data.query?.substring(0, 200), // Truncate long queries
      user_id: data.userId,
      timestamp: new Date().toISOString(),
    });
  }

  // Log business operation
  public logBusinessOperation(data: {
    operation: string;
    duration: number;
    success: boolean;
    context: Record<string, any>;
    error?: string;
    userId?: string;
  }) {
    if (!this.isEnabled || !this.logtail) return;

    this.logtail.info('Business Operation', {
      type: 'business_operation',
      operation: data.operation,
      duration_ms: data.duration,
      success: data.success,
      error: data.error,
      context: data.context,
      user_id: data.userId,
      timestamp: new Date().toISOString(),
    });
  }

  // Log performance issue
  public logPerformanceIssue(data: {
    type: string;
    operation: string;
    duration: number;
    threshold: number;
    context: Record<string, any>;
    userId?: string;
  }) {
    if (!this.isEnabled || !this.logtail) return;

    this.logtail.warn('Performance Issue', {
      type: 'performance_issue',
      issue_type: data.type,
      operation: data.operation,
      duration_ms: data.duration,
      threshold_ms: data.threshold,
      exceeded_by_ms: data.duration - data.threshold,
      context: data.context,
      user_id: data.userId,
      timestamp: new Date().toISOString(),
    });
  }

  // Log SLA violation
  public logSLAViolation(data: {
    violation_type: string;
    current_value: number;
    threshold: number;
    severity: 'warning' | 'critical';
    context: Record<string, any>;
  }) {
    if (!this.isEnabled || !this.logtail) return;

    this.logtail.error('SLA Violation', {
      type: 'sla_violation',
      violation_type: data.violation_type,
      current_value: data.current_value,
      threshold: data.threshold,
      severity: data.severity,
      context: data.context,
      timestamp: new Date().toISOString(),
    });
  }

  // Log user action
  public logUserAction(data: {
    action: string;
    category: string;
    userId: string;
    userRole: string;
    context: Record<string, any>;
    ip?: string;
    userAgent?: string;
  }) {
    if (!this.isEnabled || !this.logtail) return;

    this.logtail.info('User Action', {
      type: 'user_action',
      action: data.action,
      category: data.category,
      user_id: data.userId,
      user_role: data.userRole,
      context: data.context,
      ip: data.ip,
      user_agent: data.userAgent,
      timestamp: new Date().toISOString(),
    });
  }

  // Log system event
  public logSystemEvent(data: {
    event: string;
    level: 'info' | 'warn' | 'error';
    message: string;
    context: Record<string, any>;
  }) {
    if (!this.isEnabled || !this.logtail) return;

    this.logtail[data.level](data.message, {
      type: 'system_event',
      event: data.event,
      level: data.level,
      message: data.message,
      context: data.context,
      timestamp: new Date().toISOString(),
    });
  }

  // Log security event
  public logSecurityEvent(data: {
    event: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    context: Record<string, any>;
  }) {
    if (!this.isEnabled || !this.logtail) return;

    this.logtail.error('Security Event', {
      type: 'security_event',
      event: data.event,
      severity: data.severity,
      message: data.message,
      user_id: data.userId,
      ip: data.ip,
      user_agent: data.userAgent,
      context: data.context,
      timestamp: new Date().toISOString(),
    });
  }

  // Flush logs
  public async flush() {
    if (!this.isEnabled || !this.logtail) return;

    try {
      await this.logtail.flush();
    } catch (error) {
      console.error('Failed to flush Logtail logs:', error);
    }
  }
}

// Export singleton instance
export const logtailService = LogtailService.getInstance();


