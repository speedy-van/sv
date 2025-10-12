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

export async function logAudit(
  userId: string,
  action: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<AuditLog | null> {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorRole: 'admin', // This is called from admin routes
        action,
        targetType: 'scheduler',
        targetId: resourceId,
        after: details || null,
        details: details || null,
        userId: userId, // Also populate userId for the relation
      },
    });

    return {
      id: auditLog.id,
      userId: auditLog.userId || '',
      action: auditLog.action,
      resourceId: auditLog.targetId || undefined,
      details: auditLog.details as Record<string, any> | undefined,
      ipAddress: auditLog.ip || undefined,
      userAgent: auditLog.userAgent || undefined,
      createdAt: auditLog.createdAt,
    };
  } catch (error) {
    console.error('⚠️ Failed to log audit (non-critical):', error);
    // Don't throw - audit logging failures should not break the main functionality
    return null;
  }
}

// Alias for backward compatibility
export const createAuditLog = logAudit;

export async function getAuditLogs(
  userId?: string,
  action?: string,
  limit: number = 100
): Promise<AuditLog[]> {
  try {
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (action) where.action = action;

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return auditLogs as AuditLog[];
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}