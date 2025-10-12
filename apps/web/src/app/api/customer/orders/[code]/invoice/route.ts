import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _: Request,
  { params }: { params: { code: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'customer') {
    return new Response('Unauthorized', { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { reference: params.code },
    include: {
      customer: true,
    },
  });

  if (!booking || booking.customerId !== (session.user as any).id) {
    return new Response('Not found', { status: 404 });
  }

  // Check if booking is paid (we'll need to check the Payment model)
  const payment = await prisma.payment.findFirst({
    where: { bookingId: booking.id },
  });

  if (!payment || payment.status !== 'paid') {
    return new Response('Payment required', { status: 402 });
  }

  // Generate invoice PDF content (simplified for now)
  const invoiceContent = generateInvoicePDF(booking);

  return new Response(invoiceContent, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${booking.reference}.pdf"`,
    },
  });
}

function generateInvoicePDF(booking: any) {
  // This is a simplified PDF generation
  // In a real implementation, you would use a library like puppeteer or jsPDF
  const invoiceData = {
    invoiceNumber: booking.invoiceNumber || `INV-${booking.reference}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    customer: {
      name: booking.customer.name,
      email: booking.customer.email,
    },
    items: [
      {
        description: `Moving service - ${booking.pickupAddress?.address || 'Pickup'} to ${booking.dropoffAddress?.address || 'Dropoff'}`,
        quantity: 1,
        unitPrice: booking.totalGBP,
        total: booking.totalGBP,
      },
    ],
    subtotal: booking.totalGBP,
    tax: 0,
    total: booking.totalGBP,
  };

  // For now, return a simple text representation
  // In production, this would generate an actual PDF
  const textContent = `
INVOICE

Invoice Number: ${invoiceData.invoiceNumber}
Date: ${invoiceData.date}
Due Date: ${invoiceData.dueDate}

Bill To:
${invoiceData.customer.name}
${invoiceData.customer.email}

Items:
${invoiceData.items
  .map(item => `${item.description} - £${item.unitPrice.toFixed(2)}`)
  .join('\n')}

Subtotal: £${invoiceData.subtotal.toFixed(2)}
Tax: £${invoiceData.tax.toFixed(2)}
Total: £${invoiceData.total.toFixed(2)}

Thank you for your business!
  `.trim();

  return textContent;
}
