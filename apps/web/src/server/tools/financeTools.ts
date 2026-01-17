import { z } from 'zod';
import { BookingStatus, PaymentStatus, RefundStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { BaseTool, RiskLevel, ToolContext } from './base/ToolExecutor';

/**
 * Generate revenue report
 */
export class GenerateRevenueReportTool extends BaseTool {
  name = 'generate_revenue_report';
  description = 'Generate comprehensive revenue report for a time period';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    // Get completed bookings in date range
    const bookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.COMPLETED,
        OR: [
          {
            actualDeliveryTime: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            actualDeliveryTime: null,
            updatedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        ],
      },
      include: {
        Payment: true,
      },
    });

    // Calculate revenue metrics
    const totalRevenue = bookings.reduce((sum: number, b: typeof bookings[0]) => 
      sum + b.totalGBP, 0
    );
    
    const paidRevenue = bookings.reduce((sum: number, b: typeof bookings[0]) => {
      const paid = b.Payment?.find((p: typeof b.Payment[0]) => p.status === PaymentStatus.paid);
      return sum + (paid?.amount || 0);
    }, 0);

    const unpaidRevenue = totalRevenue - paidRevenue;

    // Get payment method breakdown
    const paymentMethods = bookings.reduce((acc: Record<string, number>, b: typeof bookings[0]) => {
      const method = b.Payment?.find((p: typeof b.Payment[0]) => p.status === PaymentStatus.paid)?.provider || 'unpaid';
      acc[method] = (acc[method] || 0) + b.totalGBP;
      return acc;
    }, {});

    return {
      success: true,
      data: {
        period: {
          start: startDate,
          end: endDate,
        },
        metrics: {
          totalOrders: bookings.length,
          totalRevenue,
          paidRevenue,
          unpaidRevenue,
          averageOrderValue: totalRevenue / bookings.length || 0,
        },
        paymentMethodBreakdown: paymentMethods,
        bookings: bookings.slice(0, 100), // Limit for performance
      },
    };
  }
}

/**
 * Process refund
 */
export class ProcessRefundTool extends BaseTool {
  name = 'process_refund';
  description = 'Process a refund for a completed order (HIGH RISK)';
  riskLevel = RiskLevel.HIGH;
  inputSchema = z.object({
    orderId: z.string(),
    amount: z.number().positive(),
    reason: z.string().min(10),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const order = await prisma.booking.findUnique({
      where: { id: input.orderId },
      include: {
        Payment: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    const successfulPayment = order.Payment?.find((p: typeof order.Payment[0]) => 
      p.status === PaymentStatus.paid
    );

    if (!successfulPayment) {
      return {
        success: false,
        error: 'No successful payment found for this order',
      };
    }

    if (input.amount > successfulPayment.amount) {
      return {
        success: false,
        error: `Refund amount (${input.amount}) exceeds payment amount (${successfulPayment.amount})`,
      };
    }

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        paymentId: successfulPayment.id,
        amount: input.amount,
        reason: input.reason,
        status: RefundStatus.pending,
        metadata: {
          originalPaymentId: successfulPayment.id,
          processedBy: context.userId,
        },
      },
    });

    return {
      success: true,
      data: {
        refund,
        order,
        message: `Refund of ${input.amount} ${successfulPayment.currency} initiated for order ${order.reference}`,
      },
      auditId: refund.id,
    };
  }
}

/**
 * Get financial summary
 */
export class GetFinancialSummaryTool extends BaseTool {
  name = 'get_financial_summary';
  description = 'Get high-level financial summary with key metrics';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    period: z.enum(['today', 'week', 'month', 'year']).default('month'),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const now = new Date();
    let startDate: Date;

    switch (input.period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
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

    const bookingWhere: Prisma.BookingWhereInput = {
      status: BookingStatus.COMPLETED,
      OR: [
        {
          actualDeliveryTime: {
            gte: startDate,
          },
        },
        {
          actualDeliveryTime: null,
          updatedAt: {
            gte: startDate,
          },
        },
      ],
    };

    const [revenueSum, completedOrders] = await Promise.all([
      prisma.booking.aggregate({
        where: bookingWhere,
        _sum: {
          totalGBP: true,
        },
      }),
      prisma.booking.count({ where: bookingWhere }),
    ]);

    // Driver earnings
    const driverEarnings = await prisma.driverEarnings.aggregate({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      _sum: {
        netAmountPence: true,
      },
    });

    // Refunds
    const refunds = await prisma.refund.aggregate({
      where: {
        createdAt: {
          gte: startDate,
        },
        status: RefundStatus.completed,
      },
      _sum: {
        amount: true,
      },
    });

    const grossRevenue = revenueSum._sum.totalGBP || 0;
    const driverPayout = driverEarnings._sum.netAmountPence || 0;
    const refundAmount = refunds._sum.amount || 0;
    const netRevenue = grossRevenue - driverPayout - refundAmount;
    const averageOrderValue = completedOrders > 0 ? grossRevenue / completedOrders : 0;
    const profitMargin = grossRevenue > 0 ? (netRevenue / grossRevenue) * 100 : 0;

    return {
      success: true,
      data: {
        period: input.period,
        metrics: {
          grossRevenue,
          driverPayout,
          refunds: refundAmount,
          netRevenue,
          completedOrders,
          averageOrderValue,
          profitMargin,
        },
        summary: `${input.period}: ${completedOrders} orders, ${grossRevenue} gross revenue, ${netRevenue} net profit`,
      },
    };
  }
}

/**
 * Generate invoice
 */
export class GenerateInvoiceTool extends BaseTool {
  name = 'generate_invoice';
  description = 'Generate an invoice for a completed order';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    orderId: z.string(),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const order = await prisma.booking.findUnique({
      where: { id: input.orderId },
      include: {
        BookingAddress_Booking_pickupAddressIdToBookingAddress: true,
        BookingAddress_Booking_dropoffAddressIdToBookingAddress: true,
        BookingItem: true,
        Payment: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    if (order.status !== BookingStatus.COMPLETED) {
      return {
        success: false,
        error: 'Can only generate invoices for completed orders',
      };
    }

    const successfulPayment = order.Payment?.find((p: typeof order.Payment[0]) => 
      p.status === PaymentStatus.paid
    );

    const pickupAddress = order.BookingAddress_Booking_pickupAddressIdToBookingAddress;
    const dropoffAddress = order.BookingAddress_Booking_dropoffAddressIdToBookingAddress;

    const invoiceData = {
      invoiceNumber: `INV-${order.reference}`,
      orderId: order.id,
      orderReference: order.reference,
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
      },
      lineItems: [
        {
          description: `Delivery from ${pickupAddress?.label ?? pickupAddress?.postcode} to ${dropoffAddress?.label ?? dropoffAddress?.postcode}`,
          quantity: 1,
          unitPrice: order.totalGBP,
          total: order.totalGBP,
        },
      ],
      items: order.BookingItem,
      subtotal: order.totalGBP,
      tax: 0,
      total: order.totalGBP,
      paymentStatus: successfulPayment ? 'paid' : 'unpaid',
      paymentMethod: successfulPayment?.provider ?? null,
      issuedAt: new Date(),
    };

    return {
      success: true,
      data: {
        invoice: invoiceData,
        message: `Invoice ${invoiceData.invoiceNumber} generated for order ${order.reference}`,
      },
    };
  }
}

/**
 * Get outstanding payments
 */
export class GetOutstandingPaymentsTool extends BaseTool {
  name = 'get_outstanding_payments';
  description = 'Get list of orders with outstanding/unpaid amounts';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    limit: z.number().optional().default(50),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const candidates = await prisma.booking.findMany({
      where: {
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED],
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: input.limit * 3,
    });

    const enriched = candidates
      .map(order => {
        const paid = order.amountPaidGBP ?? 0;
        const outstandingAmount = Math.max(order.totalGBP - paid, 0);
        return {
          order,
          outstandingAmount,
        };
      })
      .filter(entry => entry.outstandingAmount > 0)
      .slice(0, input.limit);

    const totalOutstanding = enriched.reduce((sum, entry) => sum + entry.outstandingAmount, 0);

    return {
      success: true,
      data: {
        orders: enriched.map(({ order, outstandingAmount }) => ({
          id: order.id,
          reference: order.reference,
          customer: order.customerName,
          amount: outstandingAmount,
          status: order.status,
          createdAt: order.createdAt,
        })),
        summary: {
          totalOrders: enriched.length,
          totalOutstanding,
          averageAmount: enriched.length > 0 ? totalOutstanding / enriched.length : 0,
        },
      },
    };
  }
}

// Export all finance tools
export const financeTools = [
  new GenerateRevenueReportTool(),
  new ProcessRefundTool(),
  new GetFinancialSummaryTool(),
  new GenerateInvoiceTool(),
  new GetOutstandingPaymentsTool(),
];
