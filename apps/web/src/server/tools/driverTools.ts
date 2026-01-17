import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { AssignmentStatus } from '@prisma/client';
import { BaseTool, RiskLevel, ToolContext } from './base/ToolExecutor';

/**
 * Get available drivers
 */
export class GetAvailableDriversTool extends BaseTool {
  name = 'get_available_drivers';
  description = 'Get all drivers who are currently available for assignments';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    radius: z.number().optional().default(50), // km
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const drivers = await prisma.driver.findMany({
      where: {
        status: 'active',
        DriverAvailability: {
          is: {
            status: 'online',
          },
        },
      },
      include: {
        User: true,
        DriverPerformance: true,
        DriverAvailability: true,
        DriverVehicle: true,
        Assignment: {
          where: {
            status: {
              in: [AssignmentStatus.claimed, AssignmentStatus.accepted],
            },
          },
          include: {
            Booking: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        drivers: drivers.map((driver: typeof drivers[0]) => ({
          id: driver.id,
          name: driver.User.name,
          phone: driver.User.phone,
          rating: driver.DriverPerformance?.averageRating || 0,
          completionRate: driver.DriverPerformance?.completionRate || 0,
          currentAssignments: driver.Assignment.length,
          vehicle: driver.DriverVehicle && driver.DriverVehicle.length > 0 ? {
            type: driver.vehicleType || null,
            plate: driver.DriverVehicle[0].reg || null,
          } : null,
          isAvailable: driver.DriverAvailability?.status === 'online',
        })),
        count: drivers.length,
        message: `Found ${drivers.length} available drivers`,
      },
    };
  }
}

/**
 * Get driver details
 */
export class GetDriverDetailsTool extends BaseTool {
  name = 'get_driver_details';
  description = 'Get comprehensive details about a specific driver';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    driverId: z.string(),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const driver = await prisma.driver.findUnique({
      where: { id: input.driverId },
      include: {
        User: true,
        DriverPerformance: true,
        DriverAvailability: true,
        DriverVehicle: true,
        Assignment: {
          include: {
            Booking: {
              include: {
                BookingAddress_Booking_pickupAddressIdToBookingAddress: true,
                BookingAddress_Booking_dropoffAddressIdToBookingAddress: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        DriverEarnings: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!driver) {
      return {
        success: false,
        error: 'Driver not found',
      };
    }

    const totalEarnings = await prisma.driverEarnings.aggregate({
      where: { driverId: input.driverId },
      _sum: {
        netAmountPence: true,
      },
    });

    const completedOrders = await prisma.assignment.count({
      where: {
        driverId: input.driverId,
        status: AssignmentStatus.completed,
      },
    });

    return {
      success: true,
      data: {
        driver,
        stats: {
          totalEarnings: totalEarnings._sum.netAmountPence || 0,
          completedOrders,
          rating: driver.DriverPerformance?.averageRating || 0,
          completionRate: driver.DriverPerformance?.completionRate || 0,
          onTimeRate: driver.DriverPerformance?.onTimeRate || 0,
        },
        recentAssignments: driver.Assignment,
        recentEarnings: driver.DriverEarnings,
      },
    };
  }
}

/**
 * Update driver status
 */
export class UpdateDriverStatusTool extends BaseTool {
  name = 'update_driver_status';
  description = 'Update a driver\'s status (active, inactive, suspended)';
  riskLevel = RiskLevel.MEDIUM;
  inputSchema = z.object({
    driverId: z.string(),
    status: z.enum(['active', 'inactive', 'suspended']),
    reason: z.string(),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const driver = await prisma.driver.findUnique({
      where: { id: input.driverId },
      include: {
        User: true,
        Assignment: {
          where: {
            status: {
              in: [AssignmentStatus.claimed, AssignmentStatus.accepted],
            },
          },
        },
      },
    });

    if (!driver) {
      return {
        success: false,
        error: 'Driver not found',
      };
    }

    // Check for active assignments
    if (driver.Assignment.length > 0 && input.status !== 'active') {
      return {
        success: false,
        error: `Driver has ${driver.Assignment.length} active assignments. Cannot change status.`,
      };
    }

    const updated = await prisma.driver.update({
      where: { id: input.driverId },
      data: {
        status: input.status,
      },
    });

    // Log status change
    await prisma.auditLog.create({
      data: {
        actorId: context.userId,
        actorRole: context.userRole,
        action: 'driver_status_change',
        targetType: 'driver',
        targetId: input.driverId,
        before: { status: driver.status },
        after: { status: input.status },
        details: {
          reason: input.reason,
        },
      },
    });

    return {
      success: true,
      data: {
        driver: updated,
        message: `Driver ${driver.User.name} status changed from ${driver.status} to ${input.status}`,
      },
      auditId: updated.id,
    };
  }
}

/**
 * Update driver availability
 */
export class UpdateDriverAvailabilityTool extends BaseTool {
  name = 'update_driver_availability';
  description = 'Toggle driver availability for accepting new assignments';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    driverId: z.string(),
    isAvailable: z.boolean(),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
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

    const availability = await prisma.driverAvailability.upsert({
      where: { driverId: input.driverId },
      update: {
        status: input.isAvailable ? 'online' : 'offline',
        lastSeenAt: new Date(),
      },
      create: {
        driverId: input.driverId,
        status: input.isAvailable ? 'online' : 'offline',
      },
    });

    return {
      success: true,
      data: {
        availability,
        message: `${driver.User.name} is now ${input.isAvailable ? 'available' : 'unavailable'}`,
      },
    };
  }
}

/**
 * Get driver earnings summary
 */
export class GetDriverEarningsTool extends BaseTool {
  name = 'get_driver_earnings';
  description = 'Get earnings summary for a driver over a time period';
  riskLevel = RiskLevel.LOW;
  inputSchema = z.object({
    driverId: z.string(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  });

  protected async executeInternal(input: z.infer<typeof this.inputSchema>, context: ToolContext) {
    const whereClause: any = {
      driverId: input.driverId,
    };

    if (input.startDate || input.endDate) {
      whereClause.createdAt = {};
      if (input.startDate) whereClause.createdAt.gte = new Date(input.startDate);
      if (input.endDate) whereClause.createdAt.lte = new Date(input.endDate);
    }

    const earnings = await prisma.driverEarnings.findMany({
      where: whereClause,
      include: {
        Assignment: {
          include: {
            Booking: {
              include: {
                BookingAddress_Booking_pickupAddressIdToBookingAddress: true,
                BookingAddress_Booking_dropoffAddressIdToBookingAddress: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const summary = await prisma.driverEarnings.aggregate({
      where: whereClause,
      _sum: {
        netAmountPence: true,
        baseAmountPence: true,
        tipAmountPence: true,
        grossEarningsPence: true,
      },
      _count: true,
    });

    return {
      success: true,
      data: {
        earnings,
        summary: {
          totalEarnings: summary._sum.netAmountPence || 0,
          baseFare: summary._sum.baseAmountPence || 0,
          tips: summary._sum.tipAmountPence || 0,
          grossEarnings: summary._sum.grossEarningsPence || 0,
          completedOrders: summary._count,
        },
        message: `Total earnings: ${summary._sum.netAmountPence || 0} from ${summary._count} orders`,
      },
    };
  }
}

// Export all driver tools
export const driverTools = [
  new GetAvailableDriversTool(),
  new GetDriverDetailsTool(),
  new UpdateDriverStatusTool(),
  new UpdateDriverAvailabilityTool(),
  new GetDriverEarningsTool(),
];
