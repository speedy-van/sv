import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { bookingId, amount, customerData, bookingDetails } =
      await request.json();

    console.log('Invoice generation request:', { bookingId, amount, hasCustomerData: !!customerData, hasBookingDetails: !!bookingDetails });

    if (!bookingId || amount === undefined || amount === null || isNaN(amount)) {
      console.error('Invalid parameters:', { bookingId, amount, type: typeof amount });
      return NextResponse.json(
        { error: 'Missing required fields: bookingId and amount are required' },
        { status: 400 }
      );
    }

    // Generate professional invoice content
    const invoiceContent = generateProfessionalInvoice({
      bookingId,
      amount,
      customerData: customerData || {},
      bookingDetails: bookingDetails || {},
      invoiceNumber: `INV-${bookingId}`,
      date: new Date().toISOString(),
    });

    // In production, you would use a proper PDF library like:
    // - jsPDF for client-side PDF generation
    // - Puppeteer for server-side PDF generation
    // - PDFKit for Node.js
    // - Or a service like DocRaptor, PDFShift, etc.

    // For demo purposes, we'll return a structured invoice data
    return NextResponse.json({
      success: true,
      invoice: {
        content: invoiceContent,
        filename: `invoice-${bookingId}.pdf`,
        bookingId,
        amount,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}

function generateProfessionalInvoice(data: {
  bookingId: string;
  amount: number;
  customerData: any;
  bookingDetails: any;
  invoiceNumber: string;
  date: string;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Professional invoice template
  const invoice = {
    header: {
      companyName: 'SPEEDY VAN REMOVALS LTD',
      companyAddress: 'Office 2.18 1 Barrack St, Hamilton ML3 0HS',
      companyPhone: '07901846297',
      companyEmail: 'support@speedy-van.co.uk',
      companyWebsite: 'www.speedy-van.co.uk',
      logo: '🚚', // In production, use actual logo
    },
    invoice: {
      number: data.invoiceNumber,
      date: formatDate(data.date),
      dueDate: formatDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      ), // 30 days from now
      bookingId: data.bookingId,
    },
    customer: {
      name: data.customerData.name || 'Customer Name',
      email: data.customerData.email || 'customer@example.com',
      phone: data.customerData.phone || 'N/A',
      address: data.customerData.address || 'Customer Address',
    },
    services: [
      {
        description: 'Speedy Van Move Service',
        quantity: 1,
        unitPrice: data.amount,
        total: data.amount,
        details:
          data.bookingDetails.description || 'Professional moving service',
      },
    ],
    totals: {
      subtotal: data.amount,
      vat: data.amount * 0.2, // 20% VAT
      total: data.amount * 1.2,
    },
    payment: {
      method: 'Stripe',
      status: 'Paid',
      transactionId: `TXN-${Date.now()}`,
      paidAt: formatDate(data.date),
    },
    terms: [
      'Payment is due within 30 days of invoice date',
      'Late payments may incur additional charges',
      'All prices include VAT where applicable',
      'Cancellation policy applies as per booking terms',
    ],
  };

  return invoice;
}

// Alternative: Generate actual PDF using jsPDF (client-side)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');
    const amount = searchParams.get('amount');

    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: 'Missing bookingId or amount' },
        { status: 400 }
      );
    }

    // Generate sample invoice data
    const invoiceData = generateProfessionalInvoice({
      bookingId,
      amount: parseFloat(amount),
      customerData: {},
      bookingDetails: {},
      invoiceNumber: `INV-${bookingId}`,
      date: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      invoice: invoiceData,
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
