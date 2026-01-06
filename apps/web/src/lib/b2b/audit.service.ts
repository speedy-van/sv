/**
 * B2B Company Audit Service
 * 
 * Handles comprehensive audit logging for all B2B operations
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Types
export interface AuditLogInput {
  companyId: string;
  actorId: string;
  actorType: 'user' | 'admin' | 'system' | 'api_key';
  action: string;
  targetType: string;
  targetId?: string;
  before?: any;
  after?: any;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogFilters {
  companyId?: string;
  actorId?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

// Audit action types
export const AUDIT_ACTIONS = {
  // Company actions
  COMPANY_CREATED: 'Company created',
  COMPANY_UPDATED: 'Company updated',
  COMPANY_SUSPENDED: 'Company suspended',
  COMPANY_ACTIVATED: 'Company activated',
  CREDIT_LIMIT_UPDATED: 'Credit limit updated',
  
  // User actions
  USER_ADDED: 'User added to company',
  USER_REMOVED: 'User removed from company',
  USER_ROLE_UPDATED: 'User role updated',
  INVITATION_CREATED: 'Invitation created',
  INVITATION_ACCEPTED: 'Invitation accepted',
  
  // API Key actions
  API_KEY_CREATED: 'API key created',
  API_KEY_REVOKED: 'API key revoked',
  API_KEY_SUSPENDED: 'API key suspended',
  API_KEY_REACTIVATED: 'API key reactivated',
  API_KEY_ROTATED: 'API key rotated',
  
  // Booking actions
  BOOKING_CREATED: 'Booking created',
  BOOKING_UPDATED: 'Booking updated',
  BOOKING_CANCELLED: 'Booking cancelled',
  
  // Quote actions
  QUOTE_CREATED: 'Quote created',
  QUOTE_ACCEPTED: 'Quote accepted',
  QUOTE_REJECTED: 'Quote rejected',
  
  // Invoice actions
  INVOICE_CREATED: 'Invoice created',
  INVOICE_SENT: 'Invoice sent',
  INVOICE_PAID: 'Invoice paid',
  INVOICE_CANCELLED: 'Invoice cancelled',
  
  // Payment actions
  PAYMENT_RECEIVED: 'Payment received',
  PAYMENT_FAILED: 'Payment failed',
  REFUND_ISSUED: 'Refund issued',
  
  // Pricing actions
  PRICING_RULE_CREATED: 'Pricing rule created',
  PRICING_RULE_UPDATED: 'Pricing rule updated',
  PRICING_RULE_DELETED: 'Pricing rule deleted',
  
  // Webhook actions
  WEBHOOK_CREATED: 'Webhook endpoint created',
  WEBHOOK_UPDATED: 'Webhook endpoint updated',
  WEBHOOK_DELETED: 'Webhook endpoint deleted',
  
  // Document actions
  DOCUMENT_UPLOADED: 'Document uploaded',
  DOCUMENT_VERIFIED: 'Document verified',
  DOCUMENT_REJECTED: 'Document rejected',
} as const;

export type AuditAction = keyof typeof AUDIT_ACTIONS;

// Service Implementation
export const companyAuditService = {
  /**
   * Log an audit event
   */
  async log(input: AuditLogInput) {
    try {
      return await prisma.companyAuditLog.create({
        data: {
          companyId: input.companyId,
          actorId: input.actorId,
          actorType: input.actorType,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId,
          before: input.before ? JSON.parse(JSON.stringify(input.before)) : undefined,
          after: input.after ? JSON.parse(JSON.stringify(input.after)) : undefined,
          ip: input.ip,
          userAgent: input.userAgent,
          metadata: input.metadata,
        },
      });
    } catch (error) {
      // Don't let audit logging failures break the main operation
      console.error('[Audit] Failed to log audit event:', error);
      return null;
    }
  },

  /**
   * Get audit logs with filtering
   */
  async list(filters: AuditLogFilters = {}) {
    const {
      companyId,
      actorId,
      action,
      targetType,
      targetId,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters;

    const where: Prisma.CompanyAuditLogWhereInput = {};

    if (companyId) where.companyId = companyId;
    if (actorId) where.actorId = actorId;
    if (action) where.action = action;
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.companyAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.companyAuditLog.count({ where }),
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
  },

  /**
   * Get audit log by ID
   */
  async getById(id: string) {
    return prisma.companyAuditLog.findUnique({
      where: { id },
    });
  },

  /**
   * Get recent activity for a company
   */
  async getRecentActivity(companyId: string, limit: number = 20) {
    return prisma.companyAuditLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Get activity by actor
   */
  async getActorActivity(actorId: string, limit: number = 50) {
    return prisma.companyAuditLog.findMany({
      where: { actorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Get activity for a specific target
   */
  async getTargetHistory(targetType: string, targetId: string) {
    return prisma.companyAuditLog.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'asc' },
    });
  },

  /**
   * Export audit logs for a company (for compliance)
   */
  async exportLogs(companyId: string, startDate: Date, endDate: Date) {
    const logs = await prisma.companyAuditLog.findMany({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return logs.map(log => ({
      timestamp: log.createdAt.toISOString(),
      action: log.action,
      actionDescription: AUDIT_ACTIONS[log.action as AuditAction] || log.action,
      actorId: log.actorId,
      actorType: log.actorType,
      targetType: log.targetType,
      targetId: log.targetId,
      changes: log.before && log.after ? {
        before: log.before,
        after: log.after,
      } : undefined,
      ip: log.ip,
      metadata: log.metadata,
    }));
  },

  /**
   * Get audit summary statistics
   */
  async getSummary(companyId: string, days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalEvents, eventsByAction, eventsByActor] = await Promise.all([
      prisma.companyAuditLog.count({
        where: { companyId, createdAt: { gte: since } },
      }),
      prisma.companyAuditLog.groupBy({
        by: ['action'],
        where: { companyId, createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      prisma.companyAuditLog.groupBy({
        by: ['actorId'],
        where: { companyId, createdAt: { gte: since } },
        _count: true,
        orderBy: { _count: { actorId: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalEvents,
      eventsByAction: eventsByAction.map(e => ({
        action: e.action,
        description: AUDIT_ACTIONS[e.action as AuditAction] || e.action,
        count: e._count,
      })),
      eventsByActor: eventsByActor.map(e => ({
        actorId: e.actorId,
        count: e._count,
      })),
    };
  },
};

export default companyAuditService;
