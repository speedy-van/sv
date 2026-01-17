import { z } from 'zod';
import { AssignmentStatus, BookingStatus, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { BaseTool, RiskLevel, ToolContext } from './base/ToolExecutor';

/**
 * Get unassigned orders
 */
export class GetUnassignedOrdersTool extends BaseTool {
  name = 'get_unassigned_orders';
  description = 'Fetch all orders that have not been assigned to a driver yet';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    limit: z.number().optional().default(50),
    sortBy: z.enum(['createdAt', 'scheduledAt', 'priority']).optional().default('scheduledAt'),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const sortField = input.sortBy === 'priority' ? 'priority' : input.sortBy;
    const orderBy: Prisma.BookingOrderByWithRelationInput = {
      [sortField]: 'asc',
    };

    const orders = await prisma.booking.findMany({
      where: {
        status: {
          in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT],
        },
        driverId: null,
      },
      include: {
        BookingAddress_Booking_pickupAddressIdToBookingAddress: true,
        BookingAddress_Booking_dropoffAddressIdToBookingAddress: true,
        BookingItem: true,
      },
      orderBy,
      take: input.limit,
    });

    const normalizedOrders = orders.map(order => {
      const { BookingItem, BookingAddress_Booking_pickupAddressIdToBookingAddress, BookingAddress_Booking_dropoffAddressIdToBookingAddress, ...rest } = order;
      return {
        ...rest,
        pickupAddress: BookingAddress_Booking_pickupAddressIdToBookingAddress,
        dropoffAddress: BookingAddress_Booking_dropoffAddressIdToBookingAddress,
        items: BookingItem,
      };
    });

    return {
      success: true,
      data: {
        orders: normalizedOrders,
        count: normalizedOrders.length,
        message: `Found ${normalizedOrders.length} unassigned orders`,
      },
    };
  }
}

/**
 * Assign driver to order
 */
export class AssignDriverToOrderTool extends BaseTool {
  name = 'assign_driver_to_order';
  description = 'Assign a specific driver to an order';
  riskLevel = RiskLevel.MEDIUM;
  inputSchema = z.object({
    orderId: z.string(),
    driverId: z.string(),
    reason: z.string().optional(),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    // Validate order exists and is assignable
    const order = await prisma.booking.findUnique({
      where: { id: input.orderId },
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    if (order.status === BookingStatus.COMPLETED || order.status === BookingStatus.CANCELLED) {
      return {
        success: false,
        error: `Cannot assign driver to ${order.status} order`,
      };
    }

    if (order.driverId) {
      return {
        success: false,
        error: 'Order already has a driver assigned',
      };
    }

    // Validate driver exists and is available
    const driver = await prisma.driver.findUnique({
      where: { id: input.driverId },
      include: { User: true },
    });

    if (!driver) {
      return {
        success: false,
        error: 'Driver not found',
      };
    }

    if (driver.status !== 'active') {
      return {
        success: false,
        error: `Driver is ${driver.status} and cannot accept orders`,
      };
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        bookingId: input.orderId,
        driverId: input.driverId,
        // When AI assigns a driver we treat it as an accepted assignment
        status: AssignmentStatus.accepted,
      },
    });

    // Update order
    await prisma.booking.update({
      where: { id: input.orderId },
      data: {
        driverId: input.driverId,
        status: BookingStatus.CONFIRMED,
      },
    });

    return {
      success: true,
      data: {
        assignment,
        order: await prisma.booking.findUnique({
          where: { id: input.orderId },
          include: { Driver: { include: { User: true } } },
        }),
        message: `Successfully assigned ${driver.User.name} to order ${order.reference}`,
      },
      auditId: assignment.id,
    };
  }
}

/**
 * Find best driver for order
 */
export class FindBestDriverForOrderTool extends BaseTool {
  name = 'find_best_driver';
  description = 'Find the most suitable driver for an order based on location, availability, and performance';
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
      },
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    // Get available drivers
    const drivers = await prisma.driver.findMany({
      where: {
        status: 'active',
      },
      include: {
        User: true,
        DriverPerformance: true,
        DriverAvailability: true,
        Assignment: {
          where: {
            status: {
              in: [AssignmentStatus.accepted, AssignmentStatus.claimed],
            },
          },
        },
      },
    });

    // Score drivers based on multiple factors
    const scoredDrivers = drivers.map((driver: typeof drivers[0]) => {
      let score = 100;

      // Penalize for current workload
      score -= driver.Assignment.length * 10;

      // Bonus for good performance
      if (driver.DriverPerformance) {
        score += (driver.DriverPerformance.averageRating || 0) * 10;
        score += (driver.DriverPerformance.completionRate || 0) * 5;
      }

      // Check availability
      const isAvailable = driver.DriverAvailability?.status === 'online';
      if (!isAvailable) {
        score -= 50;
      }

      return {
        driver,
        score,
        currentAssignments: driver.Assignment.length,
        rating: driver.DriverPerformance?.averageRating || 0,
      };
    });

    // Sort by score
    scoredDrivers.sort((a: typeof scoredDrivers[0], b: typeof scoredDrivers[0]) => b.score - a.score);

    const bestDriver = scoredDrivers[0];

    if (!bestDriver) {
      return {
        success: false,
        error: 'No available drivers found',
      };
    }

    return {
      success: true,
      data: {
        recommendedDriver: bestDriver.driver,
        score: bestDriver.score,
        reason: `Best match based on: ${bestDriver.currentAssignments} current assignments, ${bestDriver.rating.toFixed(1)} rating`,
        alternatives: scoredDrivers.slice(1, 4).map((d: typeof scoredDrivers[0]) => ({
          driver: d.driver,
          score: d.score,
        })),
      },
    };
  }
}

/**
 * Cancel order
 */
export class CancelOrderTool extends BaseTool {
  name = 'cancel_order';
  description = 'Cancel an order (HIGH RISK - requires confirmation)';
  riskLevel = RiskLevel.HIGH;
  inputSchema = z.object({
    orderId: z.string(),
    reason: z.string(),
    refundAmount: z.number().optional(),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const order = await prisma.booking.findUnique({
      where: { id: input.orderId },
      include: { Payment: true },
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    if (order.status === BookingStatus.CANCELLED) {
      return {
        success: false,
        error: 'Order is already cancelled',
      };
    }

    if (order.status === BookingStatus.COMPLETED) {
      return {
        success: false,
        error: 'Cannot cancel completed order',
      };
    }

    // Check if refund is needed
    const paidAmount =
      order.Payment?.find((p: typeof order.Payment[0]) => p.status === PaymentStatus.paid)?.amount ?? 0;
    const requiresRefund = paidAmount > 0;

    return {
      success: true,
      data: {
        order,
        requiresRefund,
        paidAmount,
        message: requiresRefund 
          ? 'Order cancellation will trigger refund workflow. Please confirm.'
          : 'Order will be cancelled without refund.',
      },
      requiresConfirmation: true,
      confirmationType: 'dual' as const,
    };
  }
}

/**
 * Get order details
 */
export class GetOrderDetailsTool extends BaseTool {
  name = 'get_order_details';
  description = 'Get complete details of a specific order';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    orderId: z.string().optional(),
    reference: z.string().optional(),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    if (!input.orderId && !input.reference) {
      return {
        success: false,
        error: 'Either orderId or reference must be provided',
      };
    }

    const order = await prisma.booking.findFirst({
      where: input.orderId 
        ? { id: input.orderId }
        : { reference: input.reference },
      include: {
        BookingAddress_Booking_pickupAddressIdToBookingAddress: true,
        BookingAddress_Booking_dropoffAddressIdToBookingAddress: true,
        BookingItem: true,
        Driver: {
          include: { User: true },
        },
        Assignment: true,
        Payment: true,
        TrackingPing: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!order) {
      return {
        success: false,
        error: 'Order not found',
      };
    }

    const {
      BookingItem,
      BookingAddress_Booking_pickupAddressIdToBookingAddress,
      BookingAddress_Booking_dropoffAddressIdToBookingAddress,
      Driver,
      ...orderRest
    } = order;
    const normalizedOrder = {
      ...orderRest,
      pickupAddress: BookingAddress_Booking_pickupAddressIdToBookingAddress,
      dropoffAddress: BookingAddress_Booking_dropoffAddressIdToBookingAddress,
      driver: Driver,
      items: BookingItem,
    };

    return {
      success: true,
      data: {
        order: normalizedOrder,
        summary: {
          reference: normalizedOrder.reference,
          status: normalizedOrder.status,
          driver: normalizedOrder.driver?.User.name || 'Not assigned',
          createdAt: normalizedOrder.createdAt,
          totalAmount: normalizedOrder.totalGBP,
        },
      },
    };
  }
}

// Export all order tools
export const orderTools = [
  new GetUnassignedOrdersTool(),
  new AssignDriverToOrderTool(),
  new FindBestDriverForOrderTool(),
  new CancelOrderTool(),
  new GetOrderDetailsTool(),
];
