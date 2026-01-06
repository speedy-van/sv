/**
 * B2B Audit Logger
 * 
 * Comprehensive audit logging for all B2B operations
 */

import { prisma } from '@/lib/prisma';

export type AuditAction =
  | 'COMPANY_CREATED'
  | 'COMPANY_UPDATED'
  | 'COMPANY_SUSPENDED'
  | 'COMPANY_ACTIVATED'
  | 'COMPANY_CLOSED'
  | 'USER_ADDED'
  | 'USER_REMOVED'
  | 'USER_ROLE_UPDATED'
  | 'USER_INVITATION_SENT'
  | 'USER_INVITATION_ACCEPTED'
  | 'API_KEY_CREATED'
  | 'API_KEY_REVOKED'
  | 'API_KEY_SUSPENDED'
  | 'API_KEY_REACTIVATED'
  | 'CREDIT_LIMIT_UPDATED'
  | 'PRICING_RULE_CREATED'
  | 'PRICING_RULE_UPDATED'
  | 'PRICING_RULE_DELETED'
  | 'QUOTE_CREATED'
  | 'QUOTE_ACCEPTED'
  | 'QUOTE_REJECTED'
  | 'QUOTE_EXPIRED'
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_COMPLETED'
  | 'INVOICE_CREATED'
  | 'INVOICE_SENT'
  | 'INVOICE_VIEWED'
  | 'PAYMENT_RECORDED'
  | 'WEBHOOK_CREATED'
  | 'WEBHOOK_UPDATED'
  | 'WEBHOOK_DELETED'
  | 'SETTINGS_UPDATED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'API_REQUEST';

export type ActorType = 'user' | 'admin' | 'system' | 'api_key';

export interface AuditLogEntry {
  companyId: string;
  action: AuditAction;
  actorId: string;
  actorType: ActorType;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilter {
  companyId?: string;
  action?: AuditAction;
  actorType?: ActorType;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

class AuditLogger {
  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await prisma.b2BAuditLog.create({
        data: {
          companyId: entry.companyId,
          action: entry.action,
          actorId: entry.actorId,
          actorType: entry.actorType,
          targetType: entry.targetType,
          targetId: entry.targetId,
          metadata: entry.metadata || {},
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        },
      });
    } catch (error) {
      // Log to console but don't throw - audit logging should not break operations
      console.error('[AuditLogger] Failed to log audit entry:', error);
    }
  }

  /**
   * Log company creation
   */
  async logCompanyCreated(
    companyId: string,
    actorId: string,
    actorType: ActorType,
    companyData: Record<string, any>,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      companyId,
      action: 'COMPANY_CREATED',
      actorId,
      actorType,
      targetType: 'company',
      targetId: companyId,
      metadata: {
        name: companyData.name,
        creditLimit: companyData.creditLimitGBP,
      },
      ...context,
    });
  }

  /**
   * Log company status change
   */
  async logCompanyStatusChange(
    companyId: string,
    actorId: string,
    actorType: ActorType,
    oldStatus: string,
    newStatus: string,
    reason?: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    const action = newStatus === 'SUSPENDED' ? 'COMPANY_SUSPENDED' :
                   newStatus === 'ACTIVE' ? 'COMPANY_ACTIVATED' :
                   newStatus === 'CLOSED' ? 'COMPANY_CLOSED' : 'COMPANY_UPDATED';

    await this.log({
      companyId,
      action,
      actorId,
      actorType,
      targetType: 'company',
      targetId: companyId,
      metadata: { oldStatus, newStatus, reason },
      ...context,
    });
  }

  /**
   * Log user added to company
   */
  async logUserAdded(
    companyId: string,
    actorId: string,
    actorType: ActorType,
    userId: string,
    userEmail: string,
    role: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      companyId,
      action: 'USER_ADDED',
      actorId,
      actorType,
      targetType: 'user',
      targetId: userId,
      metadata: { email: userEmail, role },
      ...context,
    });
  }

  /**
   * Log user removed from company
   */
  async logUserRemoved(
    companyId: string,
    actorId: string,
    actorType: ActorType,
    userId: string,
    userEmail: string,
    reason?: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      companyId,
      action: 'USER_REMOVED',
      actorId,
      actorType,
      targetType: 'user',
      targetId: userId,
      metadata: { email: userEmail, reason },
      ...context,
    });
  }

  /**
   * Log API key created
   */
  async logApiKeyCreated(
    companyId: string,
    actorId: string,
    actorType: ActorType,
    keyId: string,
    keyName: string,
    scopes: string[],
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      companyId,
      action: 'API_KEY_CREATED',
      actorId,
      actorType,
      targetType: 'api_key',
      targetId: keyId,
      metadata: { name: keyName, scopes, scopeCount: scopes.length },
      ...context,
    });
  }

  /**
   * Log API key revoked
   */
  async logApiKeyRevoked(
    companyId: string,
    actorId: string,
    actorType: ActorType,
    keyId: string,
    keyName: string,
    reason?: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      companyId,
      action: 'API_KEY_REVOKED',
      actorId,
      actorType,
      targetType: 'api_key',
      targetId: keyId,
      metadata: { name: keyName, reason },
      ...context,
    });
  }

  /**
   * Log credit limit update
   */
  async logCreditLimitUpdated(
    companyId: string,
    actorId: string,
    actorType: ActorType,
    oldLimit: number,
    newLimit: number,
    reason?: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      companyId,
      action: 'CREDIT_LIMIT_UPDATED',
      actorId,
      actorType,
      targetType: 'company',
      targetId: companyId,
      metadata: { oldLimit, newLimit, change: newLimit - oldLimit, reason },
      ...context,
    });
  }

  /**
   * Log quote creation
   */
  async logQuoteCreated(
    companyId: string,
    actorId: string,
    actorType: ActorType,
    quoteId: string,
    quoteNumber: string,
    priceGBP: number,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      companyId,
      action: 'QUOTE_CREATED',
      actorId,
      actorType,
      targetType: 'quote',
      targetId: quoteId,
      metadata: { quoteNumber, priceGBP },
      ...context,
    });
  }

  /**
   * Log booking creation
   */
  async logBookingCreated(
    companyId: string,
    actorId: string,
    actorType: ActorType,
    bookingId: string,
    bookingReference: string,
    priceGBP: number,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      companyId,
      action: 'BOOKING_CREATED',
      actorId,
      actorType,
      targetType: 'booking',
      targetId: bookingId,
      metadata: { reference: bookingReference, priceGBP },
      ...context,
    });
  }

  /**
   * Log invoice creation
   */
  async logInvoiceCreated(
    companyId: string,
    actorId: string,
    actorType: ActorType,
    invoiceId: string,
    invoiceNumber: string,
    totalGBP: number,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      companyId,
      action: 'INVOICE_CREATED',
      actorId,
      actorType,
      targetType: 'invoice',
      targetId: invoiceId,
      metadata: { invoiceNumber, totalGBP },
      ...context,
    });
  }

  /**
   * Log payment recorded
   */
  async logPaymentRecorded(
    companyId: string,
    actorId: string,
    actorType: ActorType,
    invoiceId: string,
    invoiceNumber: string,
    amountGBP: number,
    paymentMethod: string,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      companyId,
      action: 'PAYMENT_RECORDED',
      actorId,
      actorType,
      targetType: 'invoice',
      targetId: invoiceId,
      metadata: { invoiceNumber, amountGBP, paymentMethod },
      ...context,
    });
  }

  /**
   * Log API request (for high-value operations)
   */
  async logApiRequest(
    companyId: string,
    apiKeyId: string,
    endpoint: string,
    method: string,
    statusCode: number,
    responseTimeMs: number,
    context?: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    await this.log({
      companyId,
      action: 'API_REQUEST',
      actorId: apiKeyId,
      actorType: 'api_key',
      targetType: 'api',
      metadata: { endpoint, method, statusCode, responseTimeMs },
      ...context,
    });
  }

  /**
   * Get audit logs with filtering
   */
  async getLogs(filter: AuditLogFilter) {
    const {
      companyId,
      action,
      actorType,
      actorId,
      targetType,
      targetId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filter;

    const where: any = {};

    if (companyId) where.companyId = companyId;
    if (action) where.action = action;
    if (actorType) where.actorType = actorType;
    if (actorId) where.actorId = actorId;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.b2BAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.b2BAuditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get recent activity for a company
   */
  async getRecentActivity(companyId: string, limit = 10) {
    return prisma.b2BAuditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get activity summary for a company
   */
  async getActivitySummary(companyId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.b2BAuditLog.groupBy({
      by: ['action'],
      where: {
        companyId,
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    return logs.reduce((acc, log) => {
      acc[log.action] = log._count;
      return acc;
    }, {} as Record<string, number>);
  }
}

export const auditLogger = new AuditLogger();
export default auditLogger;
