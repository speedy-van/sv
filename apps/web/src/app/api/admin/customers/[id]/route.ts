import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin role
    const authResult = await requireRole(request, 'admin');
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const customerId = params.id;

    // Get detailed customer information
    const customer = await prisma.user.findUnique({
      where: { id: customerId, role: 'customer' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        emailVerified: true,
        Booking: {
          select: {
            id: true,
            reference: true,
            status: true,
            totalGBP: true,
            pickupAddress: true,
            dropoffAddress: true,
            scheduledAt: true,
            createdAt: true,
            paidAt: true,
            driver: {
              select: {
                id: true,
                User: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        Address: {
          select: {
            id: true,
            label: true,
            line1: true,
            line2: true,
            city: true,
            postcode: true,
            floor: true,
            flat: true,
            lift: true,
            notes: true,
            isDefault: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        Contact: {
          select: {
            id: true,
            label: true,
            name: true,
            phone: true,
            email: true,
            notes: true,
            isDefault: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        SupportTicket: {
          select: {
            id: true,
            category: true,
            orderRef: true,
            description: true,
            email: true,
            phone: true,
            status: true,
            priority: true,
            attachments: true,
            createdAt: true,
            updatedAt: true,
            SupportTicketResponse: {
              select: {
                id: true,
                message: true,
                isFromSupport: true,
                attachments: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        CustomerNotificationPreferences: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Calculate customer stats
    const totalOrders = customer.Booking.length;
    const completedOrders = customer.Booking.filter(
      (b: any) => b.status === 'completed'
    ).length;
    const cancelledOrders = customer.Booking.filter(
      (b: any) => b.status === 'cancelled'
    ).length;
    const totalLtv =
      customer.Booking
        .filter((b: any) => b.status === 'completed')
        .reduce((sum: number, b: any) => sum + b.amountPence, 0) / 100;

    const openTickets = customer.SupportTicket.filter(
      (t: any) => t.status === 'OPEN'
    ).length;
    const urgentTickets = customer.SupportTicket.filter(
      (t: any) => t.priority === 'URGENT'
    ).length;

    const customerWithStats = {
      ...customer,
      stats: {
        totalOrders,
        completedOrders,
        cancelledOrders,
        totalLtv,
        openTickets,
        urgentTickets,
        addressesCount: customer.Address.length,
        contactsCount: customer.Contact.length,
      },
    };

    return NextResponse.json(customerWithStats);
  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin role
    const authResult = await requireRole(request, 'admin');
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const customerId = params.id;
    const body = await request.json();
    const { name, email, notes, flags } = body;

    // Get existing customer
    const existingCustomer = await prisma.user.findUnique({
      where: { id: customerId, role: 'customer' },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Update customer
    const updatedCustomer = await prisma.user.update({
      where: { id: customerId },
      data: {
        name: name || existingCustomer.name,
        email: email || existingCustomer.email,
      },
    });

    // Create audit log
    await createAuditLog(user.id, 'customer.updated', customerId, { targetType: 'User', before: null, after: { name, email, notes, flags } });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin role
    const authResult = await requireRole(request, 'admin');
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const user = authResult;

    const customerId = params.id;

    // Check if customer has active bookings
    const activeBookings = await prisma.booking.findFirst({
      where: {
        customerId,
        status: { in: ['DRAFT', 'CONFIRMED'] },
      },
    });

    if (activeBookings) {
      return NextResponse.json(
        { error: 'Cannot delete customer with active bookings' },
        { status: 400 }
      );
    }

    // Soft delete - mark as inactive instead of hard delete
    const deletedCustomer = await prisma.user.update({
      where: { id: customerId },
      data: {
        email: `deleted-${Date.now()}-${customerId}@deleted.com`,
        name: 'Deleted Customer',
      },
    });

    // Create audit log
    await createAuditLog(user.id, 'customer.deleted', customerId, { targetType: 'User', before: null, after: { reason: 'Admin deletion' } });

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
