import { z } from 'zod';
import { AssignmentStatus, BookingStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { BaseTool, RiskLevel, ToolContext } from './base/ToolExecutor';

/**
 * Get key performance indicators
 */
export class GetKPIsTool extends BaseTool {
  name = 'get_kpis';
  description = 'Get key performance indicators for the platform';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    period: z.enum(['today', 'week', 'month', 'year']).default('month'),
    compareWithPrevious: z.boolean().optional().default(false),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const now = new Date();
    let startDate: Date;
    let previousStartDate: Date | null = null;

    switch (input.period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        previousStartDate = new Date(startDate);
        previousStartDate.setMonth(previousStartDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        previousStartDate = new Date(startDate);
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 1);
        break;
    }

    // Current period metrics
    const currentOrders = await prisma.booking.count({
      where: { createdAt: { gte: startDate } },
    });

    const completedOrders = await prisma.booking.count({
      where: {
        status: BookingStatus.COMPLETED,
        actualDeliveryTime: { gte: startDate },
      },
    });

    const revenue = await prisma.booking.aggregate({
      where: {
        status: BookingStatus.COMPLETED,
        actualDeliveryTime: { gte: startDate },
      },
      _sum: { totalGBP: true },
    });

    const activeDrivers = await prisma.driver.count({
      where: {
        status: 'active',
        DriverAvailability: {
          status: 'online',
        },
      },
    });

    const newCustomers = await prisma.user.count({
      where: {
        role: 'customer',
        createdAt: { gte: startDate },
      },
    });

    // Calculate completion rate
    const completionRate = currentOrders > 0 ? (completedOrders / currentOrders * 100) : 0;

    // Average order value
    const avgOrderValue = completedOrders > 0 ? (revenue._sum.totalGBP || 0) / completedOrders : 0;

    const kpis = {
      period: input.period,
      metrics: {
        totalOrders: currentOrders,
        completedOrders,
        completionRate: Math.round(completionRate * 100) / 100,
        revenue: revenue._sum.totalGBP || 0,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        activeDrivers,
        newCustomers,
      },
    };

    // Compare with previous period if requested
    if (input.compareWithPrevious && previousStartDate) {
      const prevOrders = await prisma.booking.count({
        where: {
          createdAt: {
            gte: previousStartDate,
            lt: startDate,
          },
        },
      });

      const prevRevenue = await prisma.booking.aggregate({
        where: {
          status: BookingStatus.COMPLETED,
          actualDeliveryTime: {
            gte: previousStartDate,
            lt: startDate,
          },
        },
        _sum: { totalGBP: true },
      });

      return {
        success: true,
        data: {
          ...kpis,
          comparison: {
            ordersGrowth: ((currentOrders - prevOrders) / prevOrders * 100) || 0,
            revenueGrowth: (((revenue._sum.totalGBP || 0) - (prevRevenue._sum.totalGBP || 0)) / (prevRevenue._sum.totalGBP || 1) * 100) || 0,
          },
        },
      };
    }

    return {
      success: true,
      data: kpis,
    };
  }
}

/**
 * Get order trends
 */
export class GetOrderTrendsTool extends BaseTool {
  name = 'get_order_trends';
  description = 'Analyze order trends over time with predictive insights';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    days: z.number().min(7).max(365).default(30),
    groupBy: z.enum(['day', 'week', 'month']).default('day'),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - input.days);

    const orders = await prisma.booking.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
        totalGBP: true,
      },
    });

    // Group orders by time period
    const grouped: Record<string, { count: number; revenue: number; completed: number }> = {};

    orders.forEach((order: typeof orders[0]) => {
      const date = new Date(order.createdAt);
      let key: string;

      if (input.groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (input.groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) {
        grouped[key] = { count: 0, revenue: 0, completed: 0 };
      }

      grouped[key].count++;
      grouped[key].revenue += order.totalGBP;
      if (order.status === BookingStatus.COMPLETED) {
        grouped[key].completed++;
      }
    });

    // Convert to array and sort
    const trend = Object.entries(grouped)
      .map(([date, data]) => ({
        date,
        ...data,
        completionRate: data.count > 0 ? (data.completed / data.count * 100) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Simple prediction: average of last 7 data points
    const recentData = trend.slice(-7);
    const avgOrders = recentData.reduce((sum, d) => sum + d.count, 0) / recentData.length;
    const avgRevenue = recentData.reduce((sum, d) => sum + d.revenue, 0) / recentData.length;

    return {
      success: true,
      data: {
        trend,
        summary: {
          totalOrders: orders.length,
          totalRevenue: orders.reduce((sum: number, o: typeof orders[0]) => sum + o.totalGBP, 0),
          avgOrdersPerPeriod: Math.round(avgOrders),
          avgRevenuePerPeriod: Math.round(avgRevenue),
        },
        prediction: {
          nextPeriodOrders: Math.round(avgOrders),
          nextPeriodRevenue: Math.round(avgRevenue),
          confidence: 'medium',
        },
      },
    };
  }
}

/**
 * Get driver performance analytics
 */
export class GetDriverPerformanceAnalyticsTool extends BaseTool {
  name = 'get_driver_performance_analytics';
  description = 'Analyze driver performance metrics and rankings';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    period: z.enum(['week', 'month', 'year']).default('month'),
    topN: z.number().min(1).max(50).optional().default(10),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const now = new Date();
    let startDate: Date;

    switch (input.period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
    }

    const drivers = await prisma.driver.findMany({
      include: {
        User: true,
        DriverPerformance: true,
        Assignment: {
          where: {
            createdAt: { gte: startDate },
          },
          include: {
            Booking: true,
          },
        },
        DriverEarnings: {
          where: {
            createdAt: { gte: startDate },
          },
        },
      },
    });

    const driverMetrics = drivers.map((driver: typeof drivers[0]) => {
      const completedAssignments = driver.Assignment.filter(
        (a: typeof driver.Assignment[0]) => a.status === AssignmentStatus.completed
      );
      
      const totalEarnings = driver.DriverEarnings.reduce(
        (sum: number, e: typeof driver.DriverEarnings[0]) => sum + (e.netAmountPence ?? 0),
        0
      );

      return {
        id: driver.id,
        name: driver.User.name,
        completedOrders: completedAssignments.length,
        totalEarnings,
        rating: driver.DriverPerformance?.averageRating || 0,
        completionRate: driver.DriverPerformance?.completionRate || 0,
        onTimeRate: driver.DriverPerformance?.onTimeRate || 0,
        score: (completedAssignments.length * 10) + 
               (totalEarnings / 100) + 
               ((driver.DriverPerformance?.averageRating || 0) * 20),
      };
    });

    // Sort by score
    driverMetrics.sort((a: typeof driverMetrics[0], b: typeof driverMetrics[0]) => b.score - a.score);

    return {
      success: true,
      data: {
        topDrivers: driverMetrics.slice(0, input.topN),
        summary: {
          totalDrivers: drivers.length,
          avgCompletedOrders: driverMetrics.reduce((sum: number, d: typeof driverMetrics[0]) => sum + d.completedOrders, 0) / drivers.length || 0,
          avgRating: driverMetrics.reduce((sum: number, d: typeof driverMetrics[0]) => sum + d.rating, 0) / drivers.length || 0,
          totalEarnings: driverMetrics.reduce((sum: number, d: typeof driverMetrics[0]) => sum + d.totalEarnings, 0),
        },
      },
    };
  }
}

/**
 * Get customer behavior analytics
 */
export class GetCustomerBehaviorAnalyticsTool extends BaseTool {
  name = 'get_customer_behavior_analytics';
  description = 'Analyze customer ordering patterns and behavior';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    segment: z.enum(['all', 'new', 'returning', 'vip']).optional().default('all'),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let whereClause: any = { role: 'customer' };

    if (input.segment === 'new') {
      whereClause.createdAt = { gte: thirtyDaysAgo };
    }

    const customers = await prisma.user.findMany({
      where: whereClause,
      include: {
        Booking: {
          include: {
            Payment: true,
          },
        },
      },
    });

    const customerMetrics = customers.map((customer: typeof customers[0]) => {
      const totalOrders = customer.Booking.length;
      const completedOrders = customer.Booking.filter(
        (b: typeof customer.Booking[0]) => b.status === BookingStatus.COMPLETED
      ).length;
      
      const totalSpent = customer.Booking.reduce(
        (sum: number, b: typeof customer.Booking[0]) => sum + b.totalGBP,
        0
      );

      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      let segment = 'regular';
      if (totalOrders === 0) segment = 'inactive';
      else if (totalOrders === 1) segment = 'new';
      else if (totalSpent > 1000) segment = 'vip';
      else if (totalOrders > 5) segment = 'returning';

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalOrders,
        completedOrders,
        totalSpent,
        avgOrderValue,
        segment,
        joinedAt: customer.createdAt,
      };
    });

    // Segment distribution
    const segmentCounts = customerMetrics.reduce((acc: Record<string, number>, c: typeof customerMetrics[0]) => {
      acc[c.segment] = (acc[c.segment] || 0) + 1;
      return acc;
    }, {});

    return {
      success: true,
      data: {
        customers: customerMetrics.slice(0, 100),
        summary: {
          totalCustomers: customers.length,
          avgOrdersPerCustomer: customerMetrics.reduce((sum: number, c: typeof customerMetrics[0]) => sum + c.totalOrders, 0) / customers.length || 0,
          avgLifetimeValue: customerMetrics.reduce((sum: number, c: typeof customerMetrics[0]) => sum + c.totalSpent, 0) / customers.length || 0,
          segmentDistribution: segmentCounts,
        },
      },
    };
  }
}

/**
 * Get operational efficiency metrics
 */
export class GetOperationalEfficiencyTool extends BaseTool {
  name = 'get_operational_efficiency';
  description = 'Analyze operational efficiency metrics and bottlenecks';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    period: z.enum(['week', 'month']).default('month'),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const now = new Date();
    const startDate = input.period === 'week'
      ? new Date(now.setDate(now.getDate() - 7))
      : new Date(now.setMonth(now.getMonth() - 1));

    // Get orders with timing data
    const orders = await prisma.booking.findMany({
      where: {
        createdAt: { gte: startDate },
        status: BookingStatus.COMPLETED,
      },
      include: {
        Assignment: true,
      },
    });

    // Calculate average times
    const avgAssignmentTime = orders
      .filter((o: typeof orders[0]) => o.Assignment && o.Assignment[0])
      .map((o: typeof orders[0]) => {
        const assignment = o.Assignment[0];
        return new Date(assignment.createdAt).getTime() - new Date(o.createdAt).getTime();
      })
      .reduce((sum: number, time: number, _: number, arr: number[]) => sum + time / arr.length, 0);

    // Orders by status
    const statusCounts = await prisma.booking.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Cancellation rate
    const totalOrders = await prisma.booking.count({
      where: { createdAt: { gte: startDate } },
    });

    const cancelledOrders = await prisma.booking.count({
      where: {
        createdAt: { gte: startDate },
        status: BookingStatus.CANCELLED,
      },
    });

    const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders * 100) : 0;

    return {
      success: true,
      data: {
        period: input.period,
        metrics: {
          avgAssignmentTimeMinutes: Math.round(avgAssignmentTime / 1000 / 60),
          cancellationRate: Math.round(cancellationRate * 100) / 100,
          totalOrders,
          completedOrders: orders.length,
          statusBreakdown: statusCounts,
        },
        insights: [
          avgAssignmentTime > 15 * 60 * 1000 ? 'Assignment time is above optimal (>15 min)' : 'Assignment time is good',
          cancellationRate > 10 ? 'High cancellation rate detected' : 'Cancellation rate is healthy',
        ],
      },
    };
  }
}

// Export all analytics tools
export const analyticsTools = [
  new GetKPIsTool(),
  new GetOrderTrendsTool(),
  new GetDriverPerformanceAnalyticsTool(),
  new GetCustomerBehaviorAnalyticsTool(),
  new GetOperationalEfficiencyTool(),
];
