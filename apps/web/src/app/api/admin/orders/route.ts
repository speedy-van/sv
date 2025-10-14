import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

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
  const take = parseInt(searchParams.get('take') || '50');
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
            Driver: {
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
                BookingAddress_Booking_pickupAddressIdToBookingAddress: {
                  label: { contains: area, mode: 'insensitive' },
                },
              },
              {
                BookingAddress_Booking_dropoffAddressIdToBookingAddress: {
                  label: { contains: area, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
      ...(q
        ? {
            OR: [
              { reference: { contains: q, mode: 'insensitive' } },
              {
                BookingAddress_Booking_pickupAddressIdToBookingAddress: { label: { contains: q, mode: 'insensitive' } },
              },
              {
                BookingAddress_Booking_dropoffAddressIdToBookingAddress: { label: { contains: q, mode: 'insensitive' } },
              },
              { customerName: { contains: q, mode: 'insensitive' } },
              { customerEmail: { contains: q, mode: 'insensitive' } },
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
      Assignment: {
        include: {
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

  await logAudit((s.user as any).id, 'read_orders', undefined, { targetType: 'booking', before: null, after: { count: orders.length, q, status, driver, area, dateRange } });

    const nextCursor =
      orders.length === take ? orders[orders.length - 1].id : null;
    
    console.log('✅ Orders fetched successfully:', {
      count: orders.length,
      status,
      includeTracking,
      hasNextCursor: !!nextCursor
    });

    return Response.json({ items: orders, nextCursor });
  } catch (error) {
    console.error('❌ Error fetching admin orders:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      params: { status, includeTracking, q, driver, area, dateRange, take }
    });
    
    return Response.json(
      { 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
