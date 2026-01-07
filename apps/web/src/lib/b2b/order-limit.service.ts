/**
 * Order Limit Service
 * 
 * Handles monthly order limit enforcement with concurrency-safe atomic operations.
 * Uses CompanyMonthlyUsage table for proper locking and race condition prevention.
 * 
 * CRITICAL: All limit checks and increments MUST happen within the same transaction
 * as the booking creation to prevent race conditions.
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface OrderLimitStatus {
  allowed: boolean;
  current: number;
  limit: number;
  monthKey: string;
  resetDate: Date;
  message: string;
  code?: string;
}

export class OrderLimitService {
  /**
   * Get current month key in format "YYYY-MM"
   */
  private static getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Get next month reset date
   */
  private static getNextResetDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  }

  /**
   * Get or create monthly usage record for current month
   * This ensures we have a record to update atomically
   */
  private static async getOrCreateMonthlyUsage(
    companyId: string,
    tx: Prisma.TransactionClient
  ): Promise<{ id: string; orderCount: number; orderLimit: number; monthKey: string }> {
    const monthKey = this.getCurrentMonthKey();

    // Try to get existing record
    let usage = await tx.companyMonthlyUsage.findUnique({
      where: {
        companyId_monthKey: {
          companyId,
          monthKey,
        },
      },
      select: {
        id: true,
        orderCount: true,
        orderLimit: true,
        monthKey: true,
      },
    });

    if (!usage) {
      // Create new record for this month with current company limit
      const company = await tx.company.findUnique({
        where: { id: companyId },
        select: { monthlyOrderLimit: true },
      });

      if (!company) {
        throw new Error('Company not found');
      }

      usage = await tx.companyMonthlyUsage.create({
        data: {
          companyId,
          monthKey,
          orderCount: 0,
          orderLimit: company.monthlyOrderLimit,
        },
        select: {
          id: true,
          orderCount: true,
          orderLimit: true,
          monthKey: true,
        },
      });
    }

    return usage;
  }

  /**
   * Check if company can create new order (read-only, non-transactional)
   * Use this for UI display only. Always re-check within transaction before creating booking.
   */
  static async checkLimit(companyId: string): Promise<OrderLimitStatus> {
    const monthKey = this.getCurrentMonthKey();
    const resetDate = this.getNextResetDate();

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        status: true,
        monthlyOrderLimit: true,
      },
    });

    if (!company) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        monthKey,
        resetDate,
        message: 'Company not found',
        code: 'COMPANY_NOT_FOUND',
      };
    }

    if (company.status !== 'ACTIVE') {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        monthKey,
        resetDate,
        message: 'Company account is not active',
        code: 'COMPANY_NOT_ACTIVE',
      };
    }

    // Get monthly usage
    const usage = await prisma.companyMonthlyUsage.findUnique({
      where: {
        companyId_monthKey: {
          companyId,
          monthKey,
        },
      },
      select: {
        orderCount: true,
        orderLimit: true,
      },
    });

    const current = usage?.orderCount || 0;
    const limit = usage?.orderLimit || company.monthlyOrderLimit;

    // 0 = unlimited
    if (limit === 0) {
      return {
        allowed: true,
        current,
        limit: 0,
        monthKey,
        resetDate,
        message: 'Unlimited orders',
      };
    }

    const allowed = current < limit;

    return {
      allowed,
      current,
      limit,
      monthKey,
      resetDate,
      message: allowed
        ? `${current} of ${limit} orders used this month`
        : `Order limit reached (${current}/${limit}). Resets on ${resetDate.toLocaleDateString()}`,
      code: allowed ? undefined : 'ORDER_LIMIT_REACHED',
    };
  }

  /**
   * Check and increment order count atomically within transaction
   * 
   * MUST be called within the same transaction that creates the booking.
   * This prevents race conditions where multiple requests at the limit boundary
   * could all pass the check before any increment happens.
   * 
   * @throws Error if limit exceeded or company not active
   */
  static async checkAndIncrementWithinTransaction(
    companyId: string,
    bookingId: string,
    tx: Prisma.TransactionClient
  ): Promise<{ monthKey: string; sequenceNumber: number }> {
    const monthKey = this.getCurrentMonthKey();

    // Get company status
    const company = await tx.company.findUnique({
      where: { id: companyId },
      select: {
        status: true,
        monthlyOrderLimit: true,
        totalLifetimeOrders: true,
      },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    if (company.status !== 'ACTIVE') {
      throw new Error('Company account is not active');
    }

    // Get or create monthly usage record (locks the row for update)
    const usage = await this.getOrCreateMonthlyUsage(companyId, tx);

    // Check limit (0 = unlimited)
    if (usage.orderLimit > 0 && usage.orderCount >= usage.orderLimit) {
      const resetDate = this.getNextResetDate();
      throw new Error(
        JSON.stringify({
          code: 'ORDER_LIMIT_REACHED',
          current: usage.orderCount,
          limit: usage.orderLimit,
          monthKey,
          resetDate: resetDate.toISOString(),
          message: `Monthly order limit reached (${usage.orderCount}/${usage.orderLimit}). Resets on ${resetDate.toLocaleDateString()}.`,
        })
      );
    }

    // Atomic increment of monthly usage
    await tx.companyMonthlyUsage.update({
      where: { id: usage.id },
      data: {
        orderCount: { increment: 1 },
      },
    });

    // Increment lifetime counter
    await tx.company.update({
      where: { id: companyId },
      data: {
        totalLifetimeOrders: { increment: 1 },
      },
    });

    // Get next sequence number for this company
    const maxSequence = await tx.companyBooking.findFirst({
      where: { companyId },
      orderBy: { orderSequenceNumber: 'desc' },
      select: { orderSequenceNumber: true },
    });

    const sequenceNumber = (maxSequence?.orderSequenceNumber || 0) + 1;

    return {
      monthKey,
      sequenceNumber,
    };
  }

  /**
   * Get usage statistics for a company
   */
  static async getUsageStats(companyId: string): Promise<{
    currentMonth: OrderLimitStatus;
    history: Array<{
      monthKey: string;
      orderCount: number;
      orderLimit: number;
      utilizationPercent: number;
    }>;
  }> {
    const currentMonth = await this.checkLimit(companyId);

    // Get last 12 months of history
    const history = await prisma.companyMonthlyUsage.findMany({
      where: { companyId },
      orderBy: { monthKey: 'desc' },
      take: 12,
      select: {
        monthKey: true,
        orderCount: true,
        orderLimit: true,
      },
    });

    return {
      currentMonth,
      history: history.map((h) => ({
        monthKey: h.monthKey,
        orderCount: h.orderCount,
        orderLimit: h.orderLimit,
        utilizationPercent:
          h.orderLimit > 0 ? Math.round((h.orderCount / h.orderLimit) * 100) : 0,
      })),
    };
  }

  /**
   * Admin function: Reset monthly usage for a company
   * Use with caution - this bypasses normal monthly reset logic
   */
  static async adminResetUsage(
    companyId: string,
    monthKey: string,
    adminId: string
  ): Promise<void> {
    await prisma.companyMonthlyUsage.updateMany({
      where: {
        companyId,
        monthKey,
      },
      data: {
        orderCount: 0,
      },
    });

    // Log to audit
    await prisma.companyAuditLog.create({
      data: {
        companyId,
        action: 'USAGE_RESET',
        actorId: adminId,
        actorType: 'USER',
        targetType: 'company',
        targetId: companyId,
        metadata: { monthKey, resetBy: adminId },
      },
    });
  }

  /**
   * Admin function: Update company order limit
   */
  static async adminUpdateLimit(
    companyId: string,
    newLimit: number,
    adminId: string
  ): Promise<void> {
    const oldCompany = await prisma.company.findUnique({
      where: { id: companyId },
      select: { monthlyOrderLimit: true },
    });

    await prisma.company.update({
      where: { id: companyId },
      data: { monthlyOrderLimit: newLimit },
    });

    // Update current month's limit snapshot
    const monthKey = this.getCurrentMonthKey();
    await prisma.companyMonthlyUsage.updateMany({
      where: { companyId, monthKey },
      data: { orderLimit: newLimit },
    });

    // Log to audit
    await prisma.companyAuditLog.create({
      data: {
        companyId,
        action: 'LIMIT_UPDATED',
        actorId: adminId,
        actorType: 'USER',
        targetType: 'company',
        targetId: companyId,
        metadata: {
          oldLimit: oldCompany?.monthlyOrderLimit,
          newLimit,
          updatedBy: adminId,
        },
      },
    });
  }
}

export const orderLimitService = OrderLimitService;
