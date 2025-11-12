import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { assertRole } from '@/lib/guards';
import { buildInvoicePDF } from '@/lib/pdf';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params first (Next.js 15 requirement)
    const { id } = await params;
    
    const session = await auth();
    assertRole(session!, ['customer']);
    const customerId = session.user.id;

    // Get the booking/invoice
    const booking = await prisma.booking.findFirst({
      where: {
        id: id,
        customerId,
      },
      select: {
        id: true,
        reference: true,
        createdAt: true,
        totalGBP: true,
        paidAt: true,
        crewSize: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        pickupAddress: {
          select: {
            label: true,
          },
        },
        customer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Generate PDF using the new function
    const pdfBuffer = await buildInvoicePDF({
      invoiceNumber: `INV-${booking.reference}`,
      date: booking.createdAt.toISOString().split('T')[0],
      dueDate: booking.createdAt.toISOString().split('T')[0],
      company: {
        name: 'Speedy Van',
        address: '123 Moving Street, London, UK',
        email: 'hello@speedy-van.co.uk',
        phone: '01202 129746',
        vatNumber: 'GB123456789',
      },
      customer: {
        name: booking.customerName,
        email: booking.customerEmail,
        address: booking.pickupAddress.label,
      },
      items: [{
        description: 'Moving Service',
        quantity: 1,
        unitPrice: booking.totalGBP,
        total: booking.totalGBP,
      }],
      subtotal: booking.totalGBP,
      tax: 0,
      total: booking.totalGBP,
      currency: 'GBP',
    });

    // Return PDF response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${booking.reference}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    );
  }
}
