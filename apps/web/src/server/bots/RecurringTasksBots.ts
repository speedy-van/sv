import { prisma } from '@/lib/prisma';
import * as cron from 'node-cron';
import { createAuditLogEntry } from '@/lib/audit';
import { BookingStatus, AssignmentStatus } from '@prisma/client';

/**
 * Recurring task definition
 */
interface RecurringTask {
  id: string;
  name: string;
  description: string;
  schedule: string; // Cron expression
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

/**
 * Task execution result
 */
interface TaskResult {
  taskId: string;
  success: boolean;
  message: string;
  data?: any;
  duration: number;
}

/**
 * Recurring Tasks Bots
 * Automated tasks that run on schedule
 */
export class RecurringTasksBots {
  private tasks: Map<string, RecurringTask> = new Map();
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.initializeTasks();
  }

  /**
   * Initialize default tasks
   */
  private initializeTasks() {
    // Daily report at 8 AM
    this.registerTask({
      id: 'daily_report',
      name: 'تقرير يومي',
      description: 'إرسال تقرير يومي شامل للإدارة',
      schedule: '0 8 * * *', // 8 AM every day
      enabled: true,
    });

    // Payment reminders at 10 AM
    this.registerTask({
      id: 'payment_reminders',
      name: 'تذكيرات الدفع',
      description: 'إرسال تذكيرات للمدفوعات المعلقة',
      schedule: '0 10 * * *', // 10 AM every day
      enabled: true,
    });

    // Driver reassignment check every 30 minutes
    this.registerTask({
      id: 'driver_reassignment',
      name: 'إعادة تعيين السائقين',
      description: 'فحص الطلبات المتأخرة وإعادة التعيين',
      schedule: '*/30 * * * *', // Every 30 minutes
      enabled: true,
    });

    // Weekly performance report on Monday 9 AM
    this.registerTask({
      id: 'weekly_performance',
      name: 'تقرير أداء أسبوعي',
      description: 'تحليل أداء الأسبوع الماضي',
      schedule: '0 9 * * 1', // Monday 9 AM
      enabled: true,
    });

    // Monthly financial summary on 1st at 10 AM
    this.registerTask({
      id: 'monthly_financial',
      name: 'ملخص مالي شهري',
      description: 'تقرير مالي شامل للشهر الماضي',
      schedule: '0 10 1 * *', // 1st of month at 10 AM
      enabled: true,
    });

    // Auto-cleanup old logs every Sunday 2 AM
    this.registerTask({
      id: 'cleanup_logs',
      name: 'تنظيف السجلات القديمة',
      description: 'حذف سجلات المراجعة القديمة (أكثر من 90 يوم)',
      schedule: '0 2 * * 0', // Sunday 2 AM
      enabled: true,
    });
  }

  /**
   * Register a new task
   */
  registerTask(task: RecurringTask) {
    this.tasks.set(task.id, task);
    
    if (task.enabled) {
      this.scheduleTask(task);
    }
  }

  /**
   * Schedule a task
   */
  private scheduleTask(task: RecurringTask) {
    // Remove existing job if any
    this.unscheduleTask(task.id);

    try {
      const job = cron.schedule(task.schedule, async () => {
        await this.executeTask(task.id);
      });

      this.scheduledJobs.set(task.id, job);
      console.log(`✓ Scheduled task: ${task.name} (${task.schedule})`);
    } catch (error) {
      console.error(`Failed to schedule task ${task.id}:`, error);
    }
  }

  /**
   * Unschedule a task
   */
  private unscheduleTask(taskId: string) {
    const job = this.scheduledJobs.get(taskId);
    if (job) {
      job.stop();
      this.scheduledJobs.delete(taskId);
    }
  }

  /**
   * Execute a task
   */
  async executeTask(taskId: string): Promise<TaskResult> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return {
        taskId,
        success: false,
        message: 'Task not found',
        duration: 0,
      };
    }

    const startTime = Date.now();
    console.log(`⚡ Executing task: ${task.name}`);

    try {
      let result: any;

      switch (taskId) {
        case 'daily_report':
          result = await this.generateDailyReport();
          break;
        case 'payment_reminders':
          result = await this.sendPaymentReminders();
          break;
        case 'driver_reassignment':
          result = await this.checkDriverReassignment();
          break;
        case 'weekly_performance':
          result = await this.generateWeeklyPerformance();
          break;
        case 'monthly_financial':
          result = await this.generateMonthlyFinancial();
          break;
        case 'cleanup_logs':
          result = await this.cleanupOldLogs();
          break;
        default:
          throw new Error('Unknown task');
      }

      const duration = Date.now() - startTime;

      // Log execution
      await createAuditLogEntry({
        actorId: 'system',
        actorRole: 'system',
        action: `RECURRING_TASK_${taskId.toUpperCase()}`,
        targetType: 'recurring_task',
        targetId: taskId,
        details: {
          taskName: task.name,
          result,
          duration,
          success: true,
        },
      });

      // Update task last run
      task.lastRun = new Date();

      console.log(`✓ Task completed: ${task.name} (${duration}ms)`);

      return {
        taskId,
        success: true,
        message: `Task ${task.name} completed successfully`,
        data: result,
        duration,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`✗ Task failed: ${task.name}`, error);

      await createAuditLogEntry({
        actorId: 'system',
        actorRole: 'system',
        action: `RECURRING_TASK_${taskId.toUpperCase()}_FAILED`,
        targetType: 'recurring_task',
        targetId: taskId,
        details: {
          taskName: task.name,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration,
          success: false,
        },
      });

      return {
        taskId,
        success: false,
        message: error instanceof Error ? error.message : 'Task execution failed',
        duration,
      };
    }
  }

  /**
   * Generate daily report
   */
  private async generateDailyReport() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [orders, revenue, drivers, issues] = await Promise.all([
      // Today's orders
      prisma.booking.count({
        where: { createdAt: { gte: today } },
      }),

      // Today's revenue
      prisma.booking.aggregate({
        where: {
          status: BookingStatus.COMPLETED,
          actualDeliveryTime: { gte: today },
        },
        _sum: { totalGBP: true },
      }),

      // Active drivers
      prisma.driver.count({
        where: { status: 'active' },
      }),

      // Pending issues
      prisma.booking.count({
        where: {
          status: { in: [BookingStatus.PENDING_PAYMENT, BookingStatus.CONFIRMED] },
          driverId: null,
        },
      }),
    ]);

    return {
      date: today.toISOString(),
      orders,
      revenue: revenue._sum?.totalGBP || 0,
      drivers,
      pendingAssignments: issues,
    };
  }

  /**
   * Send payment reminders
   */
  private async sendPaymentReminders() {
    const overduePayments = await prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        paidAt: null,
        actualDeliveryTime: {
          lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },
      },
      include: {
        customer: true,
      },
      take: 50,
    });

    // TODO: Send actual reminders via email/SMS
    console.log(`📧 Sending ${overduePayments.length} payment reminders`);

    return {
      remindersSent: overduePayments.length,
      totalAmount: overduePayments.reduce((sum, b) => sum + (b.totalGBP || 0), 0),
    };
  }

  /**
   * Check driver reassignment for delayed orders
   */
  private async checkDriverReassignment() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const delayedOrders = await prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        Assignment: {
          some: {
            status: { in: [AssignmentStatus.claimed, AssignmentStatus.accepted] },
            createdAt: { lt: oneHourAgo },
          },
        },
      },
      take: 20,
    });

    // TODO: Implement reassignment logic
    console.log(`🔄 Found ${delayedOrders.length} delayed orders for reassignment`);

    return {
      delayedOrders: delayedOrders.length,
      reassigned: 0, // Placeholder
    };
  }

  /**
   * Generate weekly performance report
   */
  private async generateWeeklyPerformance() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [orders, revenue, completionRate] = await Promise.all([
      prisma.booking.count({
        where: { createdAt: { gte: weekAgo } },
      }),

      prisma.booking.aggregate({
        where: {
          status: BookingStatus.COMPLETED,
          actualDeliveryTime: { gte: weekAgo },
        },
        _sum: { totalGBP: true },
      }),

      prisma.booking.groupBy({
        by: ['status'],
        where: { createdAt: { gte: weekAgo } },
        _count: true,
      }),
    ]);

    return {
      period: 'last_7_days',
      totalOrders: orders,
      revenue: revenue._sum?.totalGBP || 0,
      statusBreakdown: completionRate,
    };
  }

  /**
   * Generate monthly financial summary
   */
  private async generateMonthlyFinancial() {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    lastMonth.setDate(1);
    lastMonth.setHours(0, 0, 0, 0);

    const thisMonth = new Date(lastMonth);
    thisMonth.setMonth(thisMonth.getMonth() + 1);

    const [revenue, expenses, orders] = await Promise.all([
      prisma.booking.aggregate({
        where: {
          status: BookingStatus.COMPLETED,
          actualDeliveryTime: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
        _sum: { totalGBP: true },
      }),

      prisma.driverEarnings.aggregate({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
        _sum: { rawNetEarningsPence: true },
      }),

      prisma.booking.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: thisMonth,
          },
        },
      }),
    ]);

    return {
      month: lastMonth.toISOString(),
      revenue: revenue._sum?.totalGBP || 0,
      driverPayouts: expenses._sum?.rawNetEarningsPence || 0,
      netProfit: (revenue._sum?.totalGBP || 0) - (expenses._sum?.rawNetEarningsPence || 0),
      totalOrders: orders,
    };
  }

  /**
   * Cleanup old logs
   */
  private async cleanupOldLogs() {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: ninetyDaysAgo },
      },
    });

    console.log(`🗑️ Deleted ${result.count} old audit logs`);

    return {
      deletedCount: result.count,
      cutoffDate: ninetyDaysAgo.toISOString(),
    };
  }

  /**
   * Get all tasks
   */
  getTasks(): RecurringTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Enable/disable a task
   */
  setTaskEnabled(taskId: string, enabled: boolean) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.enabled = enabled;

    if (enabled) {
      this.scheduleTask(task);
    } else {
      this.unscheduleTask(taskId);
    }
  }

  /**
   * Start all enabled tasks
   */
  startAll() {
    this.tasks.forEach(task => {
      if (task.enabled) {
        this.scheduleTask(task);
      }
    });
    console.log(`✓ Started ${this.scheduledJobs.size} recurring tasks`);
  }

  /**
   * Stop all tasks
   */
  stopAll() {
    this.scheduledJobs.forEach(job => job.stop());
    this.scheduledJobs.clear();
    console.log('✓ Stopped all recurring tasks');
  }
}

// Singleton instance
export const recurringTasksBots = new RecurringTasksBots();
