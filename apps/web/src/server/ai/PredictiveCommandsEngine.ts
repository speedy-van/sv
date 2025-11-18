import { BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createAuditLogEntry } from '@/lib/audit';

/**
 * Command suggestion with context
 */
interface CommandSuggestion {
  command: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  category: 'orders' | 'drivers' | 'finance' | 'analytics';
}

/**
 * User context for predictions
 */
interface UserContext {
  userId: string;
  currentTime: Date;
  lastCommands?: string[];
  recentActivity?: any[];
}

/**
 * Predictive Commands Engine
 * Suggests commands based on time, context, and patterns
 */
export class PredictiveCommandsEngine {
  /**
   * Get command suggestions for user
   */
  async getSuggestions(context: UserContext): Promise<CommandSuggestion[]> {
    const suggestions: CommandSuggestion[] = [];
    const hour = context.currentTime.getHours();
    const dayOfWeek = context.currentTime.getDay();

    // Time-based suggestions
    suggestions.push(...this.getTimeBasedSuggestions(hour, dayOfWeek));

    // Context-based suggestions (pending orders, drivers status, etc.)
    suggestions.push(...await this.getContextBasedSuggestions());

    // Pattern-based suggestions (user's history)
    if (context.lastCommands && context.lastCommands.length > 0) {
      suggestions.push(...this.getPatternBasedSuggestions(context.lastCommands));
    }

    // Sort by priority
    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Time-based suggestions
   */
  private getTimeBasedSuggestions(hour: number, dayOfWeek: number): CommandSuggestion[] {
    const suggestions: CommandSuggestion[] = [];

    // Morning (6-10 AM)
    if (hour >= 6 && hour < 10) {
      suggestions.push({
        command: 'daily report',
        reason: 'بداية يوم العمل - مراجعة تقرير اليوم',
        priority: 'high',
        category: 'analytics',
      });
      suggestions.push({
        command: 'get unassigned orders',
        reason: 'طلبات جديدة قد تحتاج تعيين',
        priority: 'high',
        category: 'orders',
      });
    }

    // Midday (10 AM - 2 PM)
    if (hour >= 10 && hour < 14) {
      suggestions.push({
        command: 'get available drivers',
        reason: 'ذروة الطلبات - تحقق من توفر السائقين',
        priority: 'medium',
        category: 'drivers',
      });
    }

    // Afternoon (2-5 PM)
    if (hour >= 14 && hour < 17) {
      suggestions.push({
        command: 'get kpis',
        reason: 'مراجعة أداء اليوم حتى الآن',
        priority: 'medium',
        category: 'analytics',
      });
    }

    // Evening (5-8 PM)
    if (hour >= 17 && hour < 20) {
      suggestions.push({
        command: 'financial summary for today',
        reason: 'مراجعة إيرادات اليوم',
        priority: 'high',
        category: 'finance',
      });
      suggestions.push({
        command: 'get outstanding payments',
        reason: 'متابعة المدفوعات المعلقة',
        priority: 'medium',
        category: 'finance',
      });
    }

    // Monday specific
    if (dayOfWeek === 1) {
      suggestions.push({
        command: 'get order trends for last 7 days',
        reason: 'بداية الأسبوع - مراجعة اتجاهات الأسبوع الماضي',
        priority: 'medium',
        category: 'analytics',
      });
    }

    // Friday specific
    if (dayOfWeek === 5) {
      suggestions.push({
        command: 'generate revenue report for this week',
        reason: 'نهاية الأسبوع - تقرير الإيرادات الأسبوعي',
        priority: 'high',
        category: 'finance',
      });
    }

    return suggestions;
  }

  /**
   * Context-based suggestions (real-time data)
   */
  private async getContextBasedSuggestions(): Promise<CommandSuggestion[]> {
    const suggestions: CommandSuggestion[] = [];

    try {
      // Check unassigned orders
      const unassignedCount = await prisma.booking.count({
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT] },
          driverId: null,
        },
      });

      if (unassignedCount > 5) {
        suggestions.push({
          command: 'auto assign orders to drivers',
          reason: `${unassignedCount} طلبات غير معينة - تعيين تلقائي مقترح`,
          priority: 'high',
          category: 'orders',
        });
      } else if (unassignedCount > 0) {
        suggestions.push({
          command: 'get unassigned orders',
          reason: `${unassignedCount} طلبات تحتاج تعيين`,
          priority: 'medium',
          category: 'orders',
        });
      }

      // Check available drivers
      const availableDrivers = await prisma.driver.count({
        where: {
          status: 'active',
          DriverAvailability: {
            status: 'online',
          },
        },
      });

      if (availableDrivers < 3) {
        suggestions.push({
          command: 'get available drivers',
          reason: `فقط ${availableDrivers} سائقين متاحين - قد تحتاج المزيد`,
          priority: 'high',
          category: 'drivers',
        });
      }

      // Check outstanding payments
      const outstandingResult = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count
        FROM "Booking"
        WHERE "status" = ${BookingStatus.COMPLETED}
          AND COALESCE("amountPaidGBP", 0) < "totalGBP"
      `;
      const outstandingCount = Number(outstandingResult[0]?.count ?? 0);

      if (outstandingCount > 10) {
        suggestions.push({
          command: 'get outstanding payments',
          reason: `${outstandingCount} طلب مكتمل بمدفوعات معلقة`,
          priority: 'medium',
          category: 'finance',
        });
      }

      // Check delayed orders
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const delayedOrders = await prisma.booking.count({
        where: {
          status: BookingStatus.CONFIRMED,
          driverId: { not: null },
          scheduledAt: { lt: oneHourAgo },
        },
      });

      if (delayedOrders > 0) {
        suggestions.push({
          command: 'get operational efficiency',
          reason: `${delayedOrders} طلبات متأخرة - تحليل الكفاءة مطلوب`,
          priority: 'high',
          category: 'analytics',
        });
      }

    } catch (error) {
      console.error('Error getting context-based suggestions:', error);
    }

    return suggestions;
  }

  /**
   * Pattern-based suggestions (user history)
   */
  private getPatternBasedSuggestions(lastCommands: string[]): CommandSuggestion[] {
    const suggestions: CommandSuggestion[] = [];
    
    // Analyze command patterns
    const commandFrequency: Record<string, number> = {};
    lastCommands.forEach(cmd => {
      commandFrequency[cmd] = (commandFrequency[cmd] || 0) + 1;
    });

    // Find most frequent commands
    const frequentCommands = Object.entries(commandFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    frequentCommands.forEach(([command, count]) => {
      if (count >= 2) {
        suggestions.push({
          command,
          reason: `استخدمت هذا الأمر ${count} مرات مؤخراً`,
          priority: 'low',
          category: this.categorizeCommand(command),
        });
      }
    });

    // If user frequently checks orders, suggest related commands
    if (lastCommands.some(cmd => cmd.includes('order'))) {
      suggestions.push({
        command: 'get order trends',
        reason: 'قد تهتم بتحليل اتجاهات الطلبات',
        priority: 'low',
        category: 'analytics',
      });
    }

    // If user frequently checks drivers, suggest performance analysis
    if (lastCommands.some(cmd => cmd.includes('driver'))) {
      suggestions.push({
        command: 'get driver performance analytics',
        reason: 'تحليل أداء السائقين قد يفيدك',
        priority: 'low',
        category: 'analytics',
      });
    }

    return suggestions;
  }

  /**
   * Categorize command
   */
  private categorizeCommand(command: string): 'orders' | 'drivers' | 'finance' | 'analytics' {
    const lower = command.toLowerCase();
    
    if (lower.includes('order') || lower.includes('طلب')) {
      return 'orders';
    }
    if (lower.includes('driver') || lower.includes('سائق')) {
      return 'drivers';
    }
    if (lower.includes('revenue') || lower.includes('payment') || lower.includes('إيراد') || lower.includes('دفع')) {
      return 'finance';
    }
    return 'analytics';
  }

  /**
   * Get smart quick actions based on current state
   */
  async getQuickActions(): Promise<{
    title: string;
    command: string;
    badge?: string;
    color: string;
  }[]> {
    const actions: {
      title: string;
      command: string;
      badge?: string;
      color: string;
    }[] = [];

    try {
      // Unassigned orders
      const unassignedCount = await prisma.booking.count({
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT] },
          driverId: null,
        },
      });

      if (unassignedCount > 0) {
        actions.push({
          title: 'طلبات غير معينة',
          command: 'get unassigned orders',
          badge: unassignedCount.toString(),
          color: 'orange',
        });
      }

      // Available drivers
      const availableCount = await prisma.driver.count({
        where: {
          status: 'active',
          DriverAvailability: {
            status: 'online',
          },
        },
      });

      actions.push({
        title: 'سائقون متاحون',
        command: 'get available drivers',
        badge: availableCount.toString(),
        color: 'green',
      });

      // Today's summary
      actions.push({
        title: 'ملخص اليوم',
        command: 'daily report',
        color: 'purple',
      });

    } catch (error) {
      console.error('Error getting quick actions:', error);
    }

    return actions;
  }

  /**
   * Record command execution for learning
   */
  async recordCommandExecution(userId: string, command: string): Promise<void> {
    try {
      await createAuditLogEntry({
        actorId: userId,
        actorRole: 'system',
        action: 'AI_COMMAND_RECORDED',
        targetType: 'predictive_engine',
        targetId: command,
        details: {
          command,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error recording command:', error);
    }
  }
}

// Singleton instance
export const predictiveCommandsEngine = new PredictiveCommandsEngine();
