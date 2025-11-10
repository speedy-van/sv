/**
 * PDF generation utilities for Speedy Van
 */

import { jsPDF } from 'jspdf';

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
  const doc = new jsPDF();
  
  // Header - Company Info
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(data.company?.name || 'Speedy Van', 20, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.company?.legalName || '', 20, 30);
  doc.text(data.company?.address || '', 20, 36);
  doc.text(data.company?.email || '', 20, 42);
  doc.text(`VAT: ${data.company?.vatNumber || 'N/A'}`, 20, 48);
  
  // Invoice Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 190, 20, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #: ${data.invoiceNumber}`, 190, 30, { align: 'right' });
  doc.text(`Date: ${data.date}`, 190, 36, { align: 'right' });
  doc.text(`Due Date: ${data.dueDate}`, 190, 42, { align: 'right' });
  
  // Customer Info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 20, 65);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer.name, 20, 73);
  doc.text(data.customer.email, 20, 79);
  const addressLines = doc.splitTextToSize(data.customer.address, 100);
  doc.text(addressLines, 20, 85);
  
  // Items Table Header
  const tableTop = 110;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 20, tableTop);
  doc.text('Qty', 120, tableTop);
  doc.text('Unit Price', 145, tableTop);
  doc.text('Total', 180, tableTop);
  
  // Table line
  doc.line(20, tableTop + 2, 200, tableTop + 2);
  
  // Items
  let currentY = tableTop + 10;
  doc.setFont('helvetica', 'normal');
  data.items.forEach((item) => {
    doc.text(item.description, 20, currentY);
    doc.text(item.quantity.toString(), 120, currentY);
    doc.text(`£${item.unitPrice.toFixed(2)}`, 145, currentY);
    doc.text(`£${item.total.toFixed(2)}`, 180, currentY);
    currentY += 8;
  });
  
  // Totals
  currentY += 10;
  doc.line(145, currentY - 5, 200, currentY - 5);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', 145, currentY);
  doc.text(`£${data.total.toFixed(2)}`, 180, currentY);
  
  // Footer
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for choosing Speedy Van!', 105, 270, { align: 'center' });
  doc.text('For any queries, contact us at support@speedy-van.co.uk or call 01202129764', 105, 276, { align: 'center' });
  
  // Convert to Buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
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