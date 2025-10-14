import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check admin permissions
    const user = await requireRole(request, ['superadmin', 'ops', 'support', 'read_only']);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const searchTerm = query.trim();

    // Search across multiple entities
    const [orders, drivers, customers] = await Promise.all([
      // Search orders
      prisma.booking.findMany({
        where: {
          OR: [
            { reference: { contains: searchTerm, mode: 'insensitive' } },
            { customerName: { contains: searchTerm, mode: 'insensitive' } },
            { customerEmail: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          reference: true,
          status: true,
          customerName: true,
          customerEmail: true,
          scheduledAt: true,
          totalGBP: true,
        },
      }),

      // Search drivers
      prisma.driver.findMany({
        where: {
          OR: [
            { User: { name: { contains: searchTerm, mode: 'insensitive' } } },
            { User: { email: { contains: searchTerm, mode: 'insensitive' } } },
            { basePostcode: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          status: true,
          basePostcode: true,
          vehicleType: true,
          User: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      }),

      // Search customers
      prisma.user.findMany({
        where: {
          role: 'customer',
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          Booking: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      }),
    ]);

    // Format results
    const results = [
      // Format orders
      ...orders.map(order => ({
        id: order.id,
        type: 'order' as const,
        title: `Order #${order.reference}`,
        subtitle: `${order.customerName} • ${order.customerEmail}`,
        href: `/admin/orders/${order.reference}`,
        badge: order.status,
        metadata: {
          scheduledAt: order.scheduledAt,
          totalGBP: order.totalGBP,
        },
      })),

      // Format drivers
      ...drivers.map(driver => ({
        id: driver.id,
        type: 'driver' as const,
        title: (driver as any).User?.name,
        subtitle: `Driver • ${driver.vehicleType} • ${driver.basePostcode}`,
        href: `/admin/drivers/${driver.id}`,
        badge: driver.status,
        metadata: {
          email: (driver as any).User?.email,
          vehicleType: driver.vehicleType,
        },
      })),

      // Format customers
      ...customers.map(customer => ({
        id: customer.id,
        type: 'customer' as const,
        title: customer.name,
        subtitle: `Customer • ${customer.Booking.length} orders`,
        href: `/admin/customers/${customer.id}`,
        metadata: {
          email: customer.email,
          orderCount: customer.Booking.length,
        },
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
