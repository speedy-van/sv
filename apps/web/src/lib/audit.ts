import { authOptions } from './auth';
import { prisma } from './prisma';

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export type LogAuditOptions = {
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: Record<string, any>;
  actorRole?: string;
  ip?: string;
  userAgent?: string;
};

export async function logAudit(options: LogAuditOptions): Promise<AuditLog>;
export async function logAudit(
  userId: string,
  action: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<AuditLog>;
export async function logAudit(
  arg1: string | LogAuditOptions,
  action?: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<AuditLog> {
  try {
    const isOptions = typeof arg1 === 'object';
    const opts: LogAuditOptions = isOptions
      ? (arg1 as LogAuditOptions)
      : { userId: arg1 as string, action: action as string, entityId: resourceId, details };

    const auditLog = await prisma.auditLog.create({
      data: {
        actorId: opts.userId,
        actorRole: opts.actorRole || 'user',
        action: opts.action,
        targetType: opts.entityType || 'resource',
        targetId: opts.entityId,
        details: opts.details,
        ip: opts.ip,
        userAgent: opts.userAgent,
      },
    });

    return {
      id: auditLog.id,
      userId: auditLog.actorId,
      action: auditLog.action,
      resourceId: auditLog.targetId || undefined,
      details: (auditLog.details as Record<string, any>) || undefined,
      ipAddress: auditLog.ip || undefined,
      userAgent: auditLog.userAgent || undefined,
      createdAt: auditLog.createdAt,
    };
  } catch (error) {
    console.error('Failed to log audit:', error);
    const fallback = typeof arg1 === 'object' ? (arg1 as LogAuditOptions) : undefined;
    return {
      id: 'error',
      userId: (fallback?.userId ?? (arg1 as string)) || 'unknown',
      action: fallback?.action ?? (action as string),
      resourceId: fallback?.entityId ?? resourceId,
      details: fallback?.details ?? details,
      createdAt: new Date(),
    };
  }
}

// Alias for backward compatibility
export const createAuditLog = logAudit;
export const auditLog = logAudit;

export async function getAuditLogs(
  userId?: string,
  action?: string,
  limit: number = 100
): Promise<AuditLog[]> {
  try {
    const where: any = {};
    if (userId) where.actorId = userId;
    if (action) where.action = action;

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return auditLogs.map(a => ({
      id: a.id,
      userId: a.actorId,
      action: a.action,
      resourceId: a.targetId || undefined,
      details: (a.details as Record<string, any>) || undefined,
      ipAddress: a.ip || undefined,
      userAgent: a.userAgent || undefined,
      createdAt: a.createdAt,
    }));
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}