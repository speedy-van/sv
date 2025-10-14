/**
 * PDF generation utilities for Speedy Van
 */

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  company?: {
    name: string;
    address?: string;
    email?: string;
    phone?: string;
    vatNumber?: string;
    legalName?: string;
  };
  customer: {
    name: string;
    email: string;
    address: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

export interface ReceiptData {
  receiptNumber: string;
  date: string;
  customer: {
    name: string;
    email: string;
  };
  booking: {
    reference: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledDate: string;
    totalGBP?: number;
    paidAt?: Date;
    customerEmail?: string;
  };
  amount: number;
  paymentMethod: string;
  currency: string;
}

export async function buildInvoicePDF(data: InvoiceData): Promise<Buffer> {
  // In a real implementation, this would use a PDF library like PDFKit or jsPDF
  // For now, return a mock PDF buffer
  
  const pdfContent = `
    Invoice: ${data.invoiceNumber}
    Date: ${data.date}
    Due Date: ${data.dueDate}
    
    Bill To:
    ${data.customer.name}
    ${data.customer.email}
    ${data.customer.address}
    
    Items:
    ${data.items.map(item => 
      `${item.description} - Qty: ${item.quantity} - £${item.unitPrice} - Total: £${item.total}`
    ).join('\n')}
    
    Subtotal: £${data.subtotal}
    Tax: £${data.tax}
    Total: £${data.total}
  `;

  // Mock PDF buffer - in real implementation, generate actual PDF
  return Buffer.from(pdfContent, 'utf-8');
}

export async function buildReceiptPDF(data: ReceiptData): Promise<Buffer> {
  // In a real implementation, this would use a PDF library
  const receiptContent = `
    Receipt: ${data.receiptNumber}
    Date: ${data.date}
    
    Customer:
    ${data.customer.name}
    ${data.customer.email}
    
    Booking Details:
    Reference: ${data.booking.reference}
    From: ${data.booking.pickupAddress}
    To: ${data.booking.dropoffAddress}
    Date: ${data.booking.scheduledDate}
    
    Amount Paid: £${data.amount}
    Payment Method: ${data.paymentMethod}
    
    Thank you for choosing Speedy Van!
  `;

  return Buffer.from(receiptContent, 'utf-8');
}

export function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${timestamp}-${random}`;
}

export function generateReceiptNumber(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RCP-${timestamp}-${random}`;
}