import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertRole } from '@/lib/guards';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    assertRole(session!, ['customer']);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');
    const customerId = session.user.id;

    // Build where clause
    const where: any = { customerId };
    if (status && status !== 'all') {
      where.status = status;
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get all bookings for export
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        reference: true,
        createdAt: true,
        totalGBP: true,
        status: true,
        paidAt: true,
        pickupAddress: true,
        dropoffAddress: true,
        customerName: true,
        customerEmail: true,
        crewSize: true,
      },
    });

    // Generate CSV content
    const csvContent = generateCSV(bookings);

    // Return CSV response
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="invoices-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting invoices:', error);
    return NextResponse.json(
      { error: 'Failed to export invoices' },
      { status: 500 }
    );
  }
}

function generateCSV(bookings: any[]): string {
  const headers = [
    'Invoice Number',
    'Booking Reference',
    'Date',
    'Amount (GBP)',
    'Status',
    'Paid Date',
    'Pickup Address',
    'Dropoff Address',
    'Customer Name',
    'Customer Email',
    'Crew Size',
  ];

  const rows = bookings.map(booking => [
    `INV-${booking.reference}`,
    booking.reference,
    new Date(booking.createdAt).toLocaleDateString('en-GB'),
    (booking.totalGBP / 100).toFixed(2),
    booking.status.toUpperCase(),
    booking.paidAt ? new Date(booking.paidAt).toLocaleDateString('en-GB') : '',
    booking.pickupAddress || '',
    booking.dropoffAddress || '',
    booking.customerName || '',
    booking.customerEmail || '',
    booking.crewSize || '',
  ]);

  // Combine headers and rows
  const csvRows = [headers, ...rows];

  // Convert to CSV format
  return csvRows
    .map(row =>
      row
        .map(cell =>
          typeof cell === 'string' && cell.includes(',')
            ? `"${cell.replace(/"/g, '""')}"`
            : cell
        )
        .join(',')
    )
    .join('\n');
}
