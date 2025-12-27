/**
 * Advanced Export Functions for Orders
 * Supports CSV, Excel, and PDF formats
 */

import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export interface OrderExportData {
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: string;
  scheduledAt: string;
  createdAt?: string;
  pickupAddress?: string;
  pickupPostcode?: string;
  dropoffAddress?: string;
  dropoffPostcode?: string;
  totalGBP: number;
  amountPaidGBP?: number;
  paymentStatus: string;
  driverName?: string;
  driverEmail?: string;
  items?: any[];
  notes?: string;
  segments?: any[];
  [key: string]: any;
}

export interface ExportOptions {
  includeHeaders?: boolean;
  includeCustomerInfo?: boolean;
  includeAddresses?: boolean;
  includeItems?: boolean;
  includeDriverInfo?: boolean;
  includePaymentInfo?: boolean;
  includeNotes?: boolean;
  includeSegments?: boolean;
}

/**
 * Export orders to CSV
 */
export function exportOrdersToCSV(
  orders: OrderExportData[],
  options: ExportOptions = {}
): void {
  const defaultOptions: ExportOptions = {
    includeHeaders: true,
    includeCustomerInfo: true,
    includeAddresses: true,
    includeItems: false,
    includeDriverInfo: true,
    includePaymentInfo: true,
    includeNotes: false,
    includeSegments: false,
  };

  const opts = { ...defaultOptions, ...options };

  // Build headers
  const headers: string[] = ['Reference', 'Status', 'Scheduled Date'];
  
  if (opts.includeCustomerInfo) {
    headers.push('Customer Name', 'Customer Email', 'Customer Phone');
  }
  
  if (opts.includeAddresses) {
    headers.push('Pickup Address', 'Pickup Postcode', 'Dropoff Address', 'Dropoff Postcode');
  }
  
  headers.push('Total Price (GBP)');
  
  if (opts.includePaymentInfo) {
    headers.push('Amount Paid (GBP)', 'Payment Status');
  }
  
  if (opts.includeDriverInfo) {
    headers.push('Driver Name', 'Driver Email');
  }
  
  if (opts.includeItems) {
    headers.push('Items');
  }
  
  if (opts.includeSegments) {
    headers.push('Total Segments');
  }
  
  if (opts.includeNotes) {
    headers.push('Notes');
  }

  // Build rows
  const rows = orders.map(order => {
    const row: string[] = [
      order.reference || '',
      order.status || '',
      order.scheduledAt ? new Date(order.scheduledAt).toLocaleString('en-GB') : '',
    ];

    if (opts.includeCustomerInfo) {
      row.push(
        order.customerName || '',
        order.customerEmail || '',
        order.customerPhone || ''
      );
    }

    if (opts.includeAddresses) {
      row.push(
        order.pickupAddress || '',
        order.pickupPostcode || '',
        order.dropoffAddress || '',
        order.dropoffPostcode || ''
      );
    }

    row.push(((order.totalGBP || 0) / 100).toFixed(2));

    if (opts.includePaymentInfo) {
      row.push(
        ((order.amountPaidGBP || 0) / 100).toFixed(2),
        order.paymentStatus || 'Unpaid'
      );
    }

    if (opts.includeDriverInfo) {
      row.push(
        order.driverName || 'Unassigned',
        order.driverEmail || ''
      );
    }

    if (opts.includeItems) {
      const itemsStr = order.items && Array.isArray(order.items)
        ? order.items.map((item: any) => `${item.name} (x${item.quantity})`).join('; ')
        : '';
      row.push(itemsStr);
    }

    if (opts.includeSegments) {
      row.push(order.segments?.length?.toString() || '1');
    }

    if (opts.includeNotes) {
      row.push((order.notes || '').replace(/"/g, '""'));
    }

    return row;
  });

  // Create CSV content
  const csvRows: string[] = [];
  
  if (opts.includeHeaders) {
    csvRows.push(headers.map(h => `"${h}"`).join(','));
  }
  
  csvRows.push(...rows.map(row => row.map(cell => `"${cell}"`).join(',')));

  const csvContent = csvRows.join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export orders to Excel
 */
export function exportOrdersToExcel(
  orders: OrderExportData[],
  options: ExportOptions = {}
): void {
  const defaultOptions: ExportOptions = {
    includeHeaders: true,
    includeCustomerInfo: true,
    includeAddresses: true,
    includeItems: false,
    includeDriverInfo: true,
    includePaymentInfo: true,
    includeNotes: false,
    includeSegments: false,
  };

  const opts = { ...defaultOptions, ...options };

  // Build data array
  const data: any[][] = [];

  // Headers
  if (opts.includeHeaders) {
    const headers: string[] = ['Reference', 'Status', 'Scheduled Date'];
    
    if (opts.includeCustomerInfo) {
      headers.push('Customer Name', 'Customer Email', 'Customer Phone');
    }
    
    if (opts.includeAddresses) {
      headers.push('Pickup Address', 'Pickup Postcode', 'Dropoff Address', 'Dropoff Postcode');
    }
    
    headers.push('Total Price (GBP)');
    
    if (opts.includePaymentInfo) {
      headers.push('Amount Paid (GBP)', 'Payment Status');
    }
    
    if (opts.includeDriverInfo) {
      headers.push('Driver Name', 'Driver Email');
    }
    
    if (opts.includeItems) {
      headers.push('Items');
    }
    
    if (opts.includeSegments) {
      headers.push('Total Segments');
    }
    
    if (opts.includeNotes) {
      headers.push('Notes');
    }

    data.push(headers);
  }

  // Rows
  orders.forEach(order => {
    const row: any[] = [
      order.reference || '',
      order.status || '',
      order.scheduledAt ? new Date(order.scheduledAt) : '',
    ];

    if (opts.includeCustomerInfo) {
      row.push(
        order.customerName || '',
        order.customerEmail || '',
        order.customerPhone || ''
      );
    }

    if (opts.includeAddresses) {
      row.push(
        order.pickupAddress || '',
        order.pickupPostcode || '',
        order.dropoffAddress || '',
        order.dropoffPostcode || ''
      );
    }

    row.push((order.totalGBP || 0) / 100);

    if (opts.includePaymentInfo) {
      row.push(
        (order.amountPaidGBP || 0) / 100,
        order.paymentStatus || 'Unpaid'
      );
    }

    if (opts.includeDriverInfo) {
      row.push(
        order.driverName || 'Unassigned',
        order.driverEmail || ''
      );
    }

    if (opts.includeItems) {
      const itemsStr = order.items && Array.isArray(order.items)
        ? order.items.map((item: any) => `${item.name} (x${item.quantity})`).join('; ')
        : '';
      row.push(itemsStr);
    }

    if (opts.includeSegments) {
      row.push(order.segments?.length || 1);
    }

    if (opts.includeNotes) {
      row.push(order.notes || '');
    }

    data.push(row);
  });

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  const colWidths = data[0]?.map((_, i) => ({ wch: 15 })) || [];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, 'Orders');

  // Generate file and download
  XLSX.writeFile(wb, `orders-export-${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export orders to PDF
 */
export function exportOrdersToPDF(
  orders: OrderExportData[],
  options: ExportOptions = {}
): void {
  const defaultOptions: ExportOptions = {
    includeHeaders: true,
    includeCustomerInfo: true,
    includeAddresses: true,
    includeItems: false,
    includeDriverInfo: true,
    includePaymentInfo: true,
    includeNotes: false,
    includeSegments: false,
  };

  const opts = { ...defaultOptions, ...options };

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Orders Export Report', margin, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, margin, yPos);
  doc.text(`Total Orders: ${orders.length}`, pageWidth - margin - 50, yPos, { align: 'right' });
  yPos += 15;

  // Orders
  orders.forEach((order, index) => {
    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    // Order header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Order ${index + 1}: ${order.reference}`, margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Basic info
    doc.text(`Status: ${order.status || 'Unknown'}`, margin, yPos);
    doc.text(`Scheduled: ${order.scheduledAt ? new Date(order.scheduledAt).toLocaleString('en-GB') : 'N/A'}`, margin + 60, yPos);
    yPos += 6;

    // Customer info
    if (opts.includeCustomerInfo) {
      doc.text(`Customer: ${order.customerName || 'N/A'}`, margin, yPos);
      doc.text(`Email: ${order.customerEmail || 'N/A'}`, margin + 60, yPos);
      yPos += 6;
    }

    // Addresses
    if (opts.includeAddresses) {
      doc.text(`Pickup: ${order.pickupAddress || 'N/A'}`, margin, yPos);
      yPos += 6;
      doc.text(`Dropoff: ${order.dropoffAddress || 'N/A'}`, margin, yPos);
      yPos += 6;
    }

    // Payment
    if (opts.includePaymentInfo) {
      doc.text(`Total: £${((order.totalGBP || 0) / 100).toFixed(2)}`, margin, yPos);
      doc.text(`Paid: £${((order.amountPaidGBP || 0) / 100).toFixed(2)}`, margin + 60, yPos);
      yPos += 6;
    }

    // Driver
    if (opts.includeDriverInfo) {
      doc.text(`Driver: ${order.driverName || 'Unassigned'}`, margin, yPos);
      yPos += 6;
    }

    // Divider
    yPos += 3;
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;
  });

  // Save PDF
  doc.save(`orders-export-${new Date().toISOString().split('T')[0]}.pdf`);
}

