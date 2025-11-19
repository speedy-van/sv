import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { deriveServiceMetadata } from '@/lib/bookings/serviceType';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Parse parameters outside try block for error logging
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const status = searchParams.get('status') as any;
  const driver = searchParams.get('driver');
  const area = searchParams.get('area');
  const dateRange = searchParams.get('dateRange');
  const includeTracking = searchParams.get('includeTracking') === 'true';
  const take = Math.min(parseInt(searchParams.get('take') || '50'), 500); // Limit to max 500
  const cursor = searchParams.get('cursor');

  try {
    const s = await getServerSession(authOptions);
    if (!s?.user || (s.user as any).role !== 'admin') {
      return new Response('Unauthorized', { status: 401 });
    }

  // Build date filter
  let dateFilter = {};
  if (dateRange) {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        dateFilter = {
          createdAt: {
            gte: todayStart,
          },
        };
        break;
      case 'week':
        const weekStart = new Date(
          now.getTime() - now.getDay() * 24 * 60 * 60 * 1000
        );
        dateFilter = {
          createdAt: {
            gte: weekStart,
          },
        };
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = {
          createdAt: {
            gte: monthStart,
          },
        };
        break;
    }
  }

  // Map status parameter to valid BookingStatus values
  let statusFilter = {};
  if (status) {
    switch (status.toLowerCase()) {
      case 'active':
        statusFilter = {
          status: {
            in: ['CONFIRMED'], // Active means confirmed bookings
          },
        };
        break;
      case 'pending':
        statusFilter = {
          status: {
            in: ['DRAFT', 'PENDING_PAYMENT'],
          },
        };
        break;
      case 'completed':
        statusFilter = { status: 'COMPLETED' };
        break;
      case 'cancelled':
        statusFilter = { status: 'CANCELLED' };
        break;
      case 'open':
        statusFilter = {
          status: {
            in: ['DRAFT', 'PENDING_PAYMENT', 'CONFIRMED'], // Open means active bookings
          },
        };
        break;
      default:
        // Invalid status, ignore filter
        statusFilter = {};
        break;
    }
  }

  const orders = await prisma.booking.findMany({
    where: {
      ...statusFilter,
      ...(driver
        ? {
            driver: {
              User: {
                name: { contains: driver, mode: 'insensitive' },
              },
            },
          }
        : {}),
      ...(area
        ? {
            OR: [
              {
                pickupAddress: {
                  label: { contains: area, mode: 'insensitive' as any },
                },
              },
              {
                dropoffAddress: {
                  label: { contains: area, mode: 'insensitive' as any },
                },
              },
            ],
          }
        : {}),
      ...(q
        ? {
            OR: [
              { reference: { contains: q, mode: 'insensitive' as any } },
              {
                pickupAddress: { label: { contains: q, mode: 'insensitive' as any } },
              },
              {
                dropoffAddress: { label: { contains: q, mode: 'insensitive' as any } },
              },
              { customerName: { contains: q, mode: 'insensitive' as any } },
              { customerEmail: { contains: q, mode: 'insensitive' as any } },
            ],
          }
        : {}),
      ...dateFilter,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      driver: {
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      pickupAddress: true,
      dropoffAddress: true,
      pickupProperty: true,
      dropoffProperty: true,
      route: {
        select: {
          id: true,
          reference: true,
          status: true,
          totalDrops: true,
        },
      },
      Assignment: {
        include: {
          Driver: {
            include: {
              User: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          ...(includeTracking && {
            JobEvent: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 10,
            },
          }),
        },
      },
      ...(includeTracking && {
        TrackingPing: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      }),
    },
    orderBy: { createdAt: 'desc' },
    take: take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  const ordersWithMeta = orders.map(order => ({
    raw: order,
    meta: deriveServiceMetadata(order),
  }));

  const filteredOrders = ordersWithMeta.filter(({ meta }) => !meta.isEconomy);
  const excludedEconomyCount = ordersWithMeta.length - filteredOrders.length;

  // Log audit action (non-blocking)
  try {
    await logAudit({
      userId: (s.user as any).id,
      action: 'read_orders',
      entityType: 'booking',
      details: {
        count: orders.length,
        q,
        status,
        driver,
        area,
        dateRange,
        take,
        excludedEconomyCount,
      },
    });
  } catch (auditError) {
    // Don't fail the request if audit logging fails
    console.error('Failed to log audit:', auditError);
  }

    const nextCursor =
      orders.length === take ? orders[orders.length - 1].id : null;
    
    console.log('✅ Orders fetched successfully:', {
      count: filteredOrders.length,
      status,
      includeTracking,
      hasNextCursor: !!nextCursor,
      excludedEconomyCount,
    });

    // Transform orders to include serviceType and orderType
    const transformedOrders = filteredOrders.map(({ raw, meta }) => ({
      ...raw,
      serviceType:
        meta.serviceType ||
        (raw.customerPreferences as any)?.serviceType ||
        (raw.customerPreferences as any)?.serviceLevel ||
        'standard',
      orderType: raw.orderType || (raw.isMultiDrop ? 'multi-drop' : 'single'),
      isMultiDrop: raw.isMultiDrop || false,
    }));

    return Response.json({ items: transformedOrders, nextCursor });
  } catch (error) {
    console.error('❌ Error fetching admin orders:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      params: { status, includeTracking, q, driver, area, dateRange, take }
    });
    
    // Return more detailed error in development
    const isDev = process.env.NODE_ENV === 'development';
    return Response.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error',
        ...(isDev && error instanceof Error ? { stack: error.stack } : {})
      },
      { status: 500 }
    );
  }
}
