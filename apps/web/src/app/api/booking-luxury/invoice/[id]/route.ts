import { NextRequest, NextResponse } from 'next/server';
import { buildInvoicePDF } from '@/lib/pdf';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Await params first (Next.js 15 requirement)
    const { id } = await params;
    console.log('📄 Invoice API called with ID/Reference:', id);
    
    // Try to find booking by ID first (UUID format), then by reference (SV format)
    let booking;
    
    // Check if it's a UUID (booking ID) or reference (SV-000009)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const isReference = /^SV-\d+$/i.test(id);
    
    if (isUUID) {
      console.log('🔍 Searching by booking ID (UUID)');
      booking = await prisma.booking.findUnique({
        where: {
          id: id,
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
        dropoffAddress: {
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
    } else if (isReference) {
      console.log('🔍 Searching by booking reference (SV format)');
      booking = await prisma.booking.findFirst({
        where: {
          reference: id,
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
          dropoffAddress: {
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
    } else {
      console.log('❌ Invalid ID/Reference format:', id);
      return NextResponse.json({ error: 'Invalid booking ID or reference format' }, { status: 400 });
    }

    if (!booking) {
      console.log('❌ Booking not found for:', id);
      return NextResponse.json({ 
        error: 'Invoice not found', 
        debug: { 
          searchTerm: id, 
          searchType: isUUID ? 'UUID' : isReference ? 'Reference' : 'Invalid',
          timestamp: new Date().toISOString()
        }
      }, { status: 404 });
    }

    console.log('✅ Booking found:', { 
      id: booking.id, 
      reference: booking.reference,
      customerName: booking.customerName || booking.customer?.name
    });

    // Convert totalGBP from pence to pounds
    const totalInPounds = booking.totalGBP / 100;

    // Generate PDF using the invoice function (no VAT breakdown)
    const pdfBuffer = await buildInvoicePDF({
      invoiceNumber: `INV-${booking.reference}`,
      date: booking.createdAt.toISOString().split('T')[0],
      dueDate: booking.createdAt.toISOString().split('T')[0],
      company: {
        name: 'Speedy Van',
        legalName: 'SPEEDY VAN REMOVALS LTD',
        address: 'Office 2.18, 1 Barrack St, Hamilton ML3 0HS',
        email: 'support@speedy-van.co.uk',
      },
      customer: {
        name: booking.customerName || booking.customer?.name || 'Customer',
        email: booking.customerEmail || booking.customer?.email || '',
        address: booking.pickupAddress?.label || 'Pickup address not available',
      },
      items: [{
        description: 'Moving Service',
        quantity: 1,
        unitPrice: totalInPounds,
        total: totalInPounds,
      }],
      subtotal: totalInPounds,
      tax: 0,
      total: totalInPounds,
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
