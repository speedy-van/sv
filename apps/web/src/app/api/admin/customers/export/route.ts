import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse, NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const s = await getServerSession(authOptions);
  if (!s?.user || (s.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    // Build where clause
    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get all customers for export
    const customers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        lastLogin: true,
        isActive: true,
        emailVerified: true,
        bookings: {
          select: {
            id: true,
            reference: true,
            status: true,
            totalGBP: true,
            createdAt: true,
          },
        },
        supportTickets: {
          select: {
            id: true,
            description: true,
            status: true,
            createdAt: true,
          },
        },
        addresses: {
          select: {
            id: true,
            label: true,
            postcode: true,
          },
        },
        contacts: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Process customer data for export
    const exportData = customers.map(customer => {
      const totalBookings = customer.bookings.length;
      const totalSpent = customer.bookings.reduce(
        (sum, booking) => sum + (booking.totalGBP || 0),
        0
      );
      const activeTickets = customer.supportTickets.filter(
        ticket => ticket.status === 'open'
      ).length;
      const completedBookings = customer.bookings.filter(
        booking => booking.status === 'COMPLETED'
      ).length;

      return {
        id: customer.id,
        name: customer.name || 'Unknown',
        email: customer.email,
        role: customer.role,
        createdAt: customer.createdAt.toISOString(),
        lastLogin: customer.lastLogin?.toISOString() || 'Never',
        isActive: customer.isActive,
        emailVerified: customer.emailVerified,
        totalBookings,
        completedBookings,
        totalSpent: (totalSpent / 100).toFixed(2), // Convert from pence to pounds
        activeTickets,
        addressCount: customer.addresses.length,
        contactCount: customer.contacts.length,
        primaryAddress: customer.addresses[0]?.label || 'No address',
        primaryContact: customer.contacts[0]?.name || 'No contact',
      };
    });

    if (format === 'json') {
      return NextResponse.json({
        customers: exportData,
        total: exportData.length,
        exportedAt: new Date().toISOString(),
      });
    }

    // Generate CSV
    const headers = [
      'ID',
      'Name',
      'Email',
      'Role',
      'Created At',
      'Last Login',
      'Is Active',
      'Email Verified',
      'Total Bookings',
      'Completed Bookings',
      'Total Spent (£)',
      'Active Tickets',
      'Address Count',
      'Contact Count',
      'Primary Address',
      'Primary Contact',
    ];

    const csvRows = [
      headers.join(','),
      ...exportData.map(row =>
        [
          row.id,
          `"${row.name}"`,
          row.email,
          row.role,
          row.createdAt,
          row.lastLogin,
          row.isActive,
          row.emailVerified,
          row.totalBookings,
          row.completedBookings,
          row.totalSpent,
          row.activeTickets,
          row.addressCount,
          row.contactCount,
          `"${row.primaryAddress}"`,
          `"${row.primaryContact}"`,
        ].join(',')
      ),
    ];

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="customers-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Admin customers export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
