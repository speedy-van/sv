import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const toolRequestSchema = z.object({
  tool: z.enum([
    'get_booking_details',
    'search_bookings',
    'assign_driver',
    'get_driver_details',
    'search_drivers',
    'get_customer_details',
    'search_customers',
    'get_route_details',
    'create_route',
    'get_analytics',
    'get_system_health',
  ]),
  parameters: z.record(z.any()),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = toolRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { tool, parameters } = parsed.data;

    let result: any;

    switch (tool) {
      case 'get_booking_details':
        result = await getBookingDetails(parameters);
        break;
      case 'search_bookings':
        result = await searchBookings(parameters);
        break;
      case 'assign_driver':
        result = await assignDriver(parameters);
        break;
      case 'get_driver_details':
        result = await getDriverDetails(parameters);
        break;
      case 'search_drivers':
        result = await searchDrivers(parameters);
        break;
      case 'get_customer_details':
        result = await getCustomerDetails(parameters);
        break;
      case 'search_customers':
        result = await searchCustomers(parameters);
        break;
      case 'get_route_details':
        result = await getRouteDetails(parameters);
        break;
      case 'create_route':
        result = await createRoute(parameters);
        break;
      case 'get_analytics':
        result = await getAnalytics(parameters);
        break;
      case 'get_system_health':
        result = await getSystemHealth();
        break;
      default:
        return NextResponse.json(
          { error: 'Unknown tool' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      tool,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('AI tools error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Tool implementations

async function getBookingDetails(params: any) {
  const { bookingId, reference } = params;
  
  const booking = await prisma.booking.findFirst({
    where: bookingId ? { id: bookingId } : { reference },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      driver: {
        select: {
          id: true,
          name: true,
          phone: true,
          vehicleType: true,
        },
      },
      route: {
        select: {
          id: true,
          name: true,
          status: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error('Booking not found');
  }

  return {
    booking: {
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      pickupAddress: booking.pickupAddress,
      dropoffAddress: booking.dropoffAddress,
      scheduledAt: booking.scheduledAt,
      totalGBP: booking.totalGBP ? booking.totalGBP / 100 : 0,
      distance: booking.distance,
      duration: booking.duration,
      customer: booking.customer,
      driver: booking.driver,
      route: booking.route,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    },
  };
}

async function searchBookings(params: any) {
  const { status, driverId, customerId, limit = 10, offset = 0 } = params;

  const where: any = {};
  if (status) where.status = status;
  if (driverId) where.driverId = driverId;
  if (customerId) where.customerId = customerId;

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      customer: {
        select: { name: true, email: true },
      },
      driver: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  });

  const total = await prisma.booking.count({ where });

  return {
    bookings: bookings.map((b) => ({
      id: b.id,
      reference: b.reference,
      status: b.status,
      pickupAddress: b.pickupAddress,
      dropoffAddress: b.dropoffAddress,
      scheduledAt: b.scheduledAt,
      totalGBP: b.totalGBP ? b.totalGBP / 100 : 0,
      customer: b.customer,
      driver: b.driver,
    })),
    total,
    limit,
    offset,
  };
}

async function assignDriver(params: any) {
  const { bookingId, driverId } = params;

  if (!bookingId || !driverId) {
    throw new Error('bookingId and driverId are required');
  }

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { driverId },
    include: {
      driver: {
        select: { name: true, phone: true },
      },
    },
  });

  return {
    success: true,
    booking: {
      id: booking.id,
      reference: booking.reference,
      driver: booking.driver,
    },
    message: `Driver ${booking.driver?.name} assigned successfully`,
  };
}

async function getDriverDetails(params: any) {
  const { driverId } = params;

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: {
      bookings: {
        where: {
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        },
        select: {
          id: true,
          reference: true,
          status: true,
          scheduledAt: true,
        },
      },
    },
  });

  if (!driver) {
    throw new Error('Driver not found');
  }

  return {
    driver: {
      id: driver.id,
      name: driver.name,
      email: driver.email,
      phone: driver.phone,
      status: driver.status,
      vehicleType: driver.vehicleType,
      onboardingStatus: driver.onboardingStatus,
      activeBookings: driver.bookings,
    },
  };
}

async function searchDrivers(params: any) {
  const { status, onboardingStatus, limit = 10 } = params;

  const where: any = {};
  if (status) where.status = status;
  if (onboardingStatus) where.onboardingStatus = onboardingStatus;

  const drivers = await prisma.driver.findMany({
    where,
    select: {
      id: true,
      name: true,
      phone: true,
      status: true,
      vehicleType: true,
      onboardingStatus: true,
    },
    take: limit,
  });

  return { drivers };
}

async function getCustomerDetails(params: any) {
  const { customerId, email } = params;

  const customer = await prisma.user.findFirst({
    where: customerId ? { id: customerId } : { email },
    include: {
      bookings: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          reference: true,
          status: true,
          scheduledAt: true,
          totalGBP: true,
        },
      },
    },
  });

  if (!customer) {
    throw new Error('Customer not found');
  }

  return {
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      recentBookings: customer.bookings.map((b) => ({
        ...b,
        totalGBP: b.totalGBP ? b.totalGBP / 100 : 0,
      })),
    },
  };
}

async function searchCustomers(params: any) {
  const { query, limit = 10 } = params;

  const customers = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
    take: limit,
  });

  return { customers };
}

async function getRouteDetails(params: any) {
  const { routeId } = params;

  const route = await prisma.route.findUnique({
    where: { id: routeId },
    include: {
      driver: {
        select: { name: true, phone: true },
      },
      bookings: {
        select: {
          id: true,
          reference: true,
          pickupAddress: true,
          dropoffAddress: true,
          status: true,
        },
      },
    },
  });

  if (!route) {
    throw new Error('Route not found');
  }

  return { route };
}

async function createRoute(params: any) {
  const { name, driverId, bookingIds } = params;

  // This is a simplified version - you'd need to implement full route creation logic
  const route = await prisma.route.create({
    data: {
      name: name || `Route ${new Date().toISOString()}`,
      driverId,
      status: 'pending',
      // Add other required fields based on your schema
    },
  });

  return {
    success: true,
    route: {
      id: route.id,
      name: route.name,
    },
    message: 'Route created successfully',
  };
}

async function getAnalytics(params: any) {
  const { period = 'today' } = params;

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
  }

  const [bookingsCount, revenue, activeDrivers] = await Promise.all([
    prisma.booking.count({
      where: { createdAt: { gte: startDate } },
    }),
    prisma.booking.aggregate({
      where: {
        createdAt: { gte: startDate },
        status: 'CONFIRMED',
      },
      _sum: { totalGBP: true },
    }),
    prisma.driver.count({
      where: { status: 'active', onboardingStatus: 'approved' },
    }),
  ]);

  return {
    period,
    startDate,
    bookingsCount,
    revenue: revenue._sum.totalGBP ? revenue._sum.totalGBP / 100 : 0,
    activeDrivers,
  };
}

async function getSystemHealth() {
  const [
    totalBookings,
    pendingBookings,
    activeDrivers,
    totalDrivers,
  ] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'CONFIRMED', driverId: null } }),
    prisma.driver.count({ where: { status: 'active' } }),
    prisma.driver.count(),
  ]);

  return {
    status: 'operational',
    metrics: {
      totalBookings,
      pendingBookings,
      activeDrivers,
      totalDrivers,
      driverUtilization: totalDrivers > 0 ? (activeDrivers / totalDrivers) * 100 : 0,
    },
    timestamp: new Date().toISOString(),
  };
}
