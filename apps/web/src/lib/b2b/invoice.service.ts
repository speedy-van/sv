/**
 * B2B Invoice Service
 * 
 * Handles company invoice operations including:
 * - Invoice creation and management
 * - Payment tracking
 * - Credit management
 * - Overdue handling
 */

import { prisma } from '@/lib/prisma';
import { CompanyInvoiceStatus, CompanyPaymentStatus, PaymentMethod, Prisma } from '@prisma/client';
import { companyAuditService } from './audit.service';
import { companyService } from './company.service';

// Types
export interface CreateInvoiceInput {
  companyId: string;
  items: InvoiceItemInput[];
  poNumber?: string;
  costCenter?: string;
  billingPeriodStart?: Date;
  billingPeriodEnd?: Date;
  dueDate?: Date;
  notes?: string;
  createdBy?: string;
}

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPriceGBP: number;
  vatRate?: number;
  bookingId?: string;
  serviceDate?: Date;
}

export interface InvoiceListFilters {
  companyId?: string;
  status?: CompanyInvoiceStatus;
  overdueOnly?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface RecordPaymentInput {
  invoiceId: string;
  amountGBP: number;
  method: PaymentMethod;
  reference?: string;
  stripePaymentIntentId?: string;
  notes?: string;
}

// Generate unique invoice number
function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INV-${year}${month}-${random}`;
}

// Service Implementation
export const companyInvoiceService = {
  /**
   * Create a new invoice
   */
  async create(input: CreateInvoiceInput) {
    // Calculate totals
    let subtotalGBP = 0;
    let vatGBP = 0;

    const itemsData = input.items.map(item => {
      const vatRate = item.vatRate ?? 0.20;
      const totalGBP = item.quantity * item.unitPriceGBP;
      const itemVatGBP = Math.round(totalGBP * vatRate);
      
      subtotalGBP += totalGBP;
      vatGBP += itemVatGBP;

      return {
        description: item.description,
        quantity: item.quantity,
        unitPriceGBP: item.unitPriceGBP,
        totalGBP,
        vatRate,
        vatGBP: itemVatGBP,
        bookingId: item.bookingId,
        serviceDate: item.serviceDate,
      };
    });

    const totalGBP = subtotalGBP + vatGBP;

    // Get company payment terms
    const company = await prisma.company.findUnique({
      where: { id: input.companyId },
      select: { paymentTermsDays: true },
    });

    // Calculate due date
    const dueDate = input.dueDate || new Date();
    if (!input.dueDate && company?.paymentTermsDays) {
      dueDate.setDate(dueDate.getDate() + company.paymentTermsDays);
    } else if (!input.dueDate) {
      dueDate.setDate(dueDate.getDate() + 30); // Default 30 days
    }

    // Create invoice with items
    const invoice = await prisma.companyInvoice.create({
      data: {
        companyId: input.companyId,
        invoiceNumber: generateInvoiceNumber(),
        status: CompanyInvoiceStatus.DRAFT,
        subtotalGBP,
        vatGBP,
        totalGBP,
        outstandingGBP: totalGBP,
        dueDate,
        poNumber: input.poNumber,
        costCenter: input.costCenter,
        billingPeriodStart: input.billingPeriodStart,
        billingPeriodEnd: input.billingPeriodEnd,
        notes: input.notes,
        createdBy: input.createdBy,
        CompanyInvoiceItem: {
          create: itemsData,
        },
      },
      include: {
        CompanyInvoiceItem: true,
      },
    });

    // Update company balance
    await prisma.company.update({
      where: { id: input.companyId },
      data: {
        currentBalanceGBP: { increment: totalGBP },
      },
    });

    await companyAuditService.log({
      companyId: input.companyId,
      actorId: input.createdBy || 'system',
      actorType: input.createdBy ? 'user' : 'system',
      action: 'INVOICE_CREATED',
      targetType: 'invoice',
      targetId: invoice.id,
      metadata: {
        invoiceNumber: invoice.invoiceNumber,
        totalGBP,
      },
    });

    return invoice;
  },

  /**
   * Get invoice by ID
   */
  async getById(id: string) {
    return prisma.companyInvoice.findUnique({
      where: { id },
      include: {
        CompanyInvoiceItem: true,
        CompanyPayment: true,
        Company: {
          select: {
            id: true,
            name: true,
            legalName: true,
            vatNumber: true,
            billingAddressLine1: true,
            billingAddressLine2: true,
            billingCity: true,
            billingPostcode: true,
          },
        },
      },
    });
  },

  /**
   * Get invoice by number
   */
  async getByNumber(invoiceNumber: string) {
    return prisma.companyInvoice.findUnique({
      where: { invoiceNumber },
      include: {
        CompanyInvoiceItem: true,
        CompanyPayment: true,
        Company: true,
      },
    });
  },

  /**
   * List invoices with filtering
   */
  async list(filters: InvoiceListFilters = {}) {
    const {
      companyId,
      status,
      overdueOnly,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const where: Prisma.CompanyInvoiceWhereInput = {};

    if (companyId) where.companyId = companyId;
    if (status) where.status = status;
    
    if (overdueOnly) {
      where.status = CompanyInvoiceStatus.OVERDUE;
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { poNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) where.issueDate.gte = startDate;
      if (endDate) where.issueDate.lte = endDate;
    }

    const [invoices, total] = await Promise.all([
      prisma.companyInvoice.findMany({
        where,
        include: {
          Company: {
            select: { name: true },
          },
          _count: {
            select: { CompanyInvoiceItem: true },
          },
        },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.companyInvoice.count({ where }),
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Send invoice to client
   */
  async send(id: string, actorId: string) {
    const invoice = await prisma.companyInvoice.update({
      where: { id },
      data: { status: CompanyInvoiceStatus.SENT },
    });

    await companyAuditService.log({
      companyId: invoice.companyId,
      actorId,
      actorType: 'user',
      action: 'INVOICE_SENT',
      targetType: 'invoice',
      targetId: id,
    });

    // TODO: Send email notification

    return invoice;
  },

  /**
   * Record a payment against an invoice
   */
  async recordPayment(input: RecordPaymentInput, actorId: string) {
    const invoice = await prisma.companyInvoice.findUnique({
      where: { id: input.invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Create payment record
    const payment = await prisma.companyPayment.create({
      data: {
        companyId: invoice.companyId,
        invoiceId: input.invoiceId,
        amountGBP: input.amountGBP,
        method: input.method,
        reference: input.reference,
        stripePaymentIntentId: input.stripePaymentIntentId,
        status: CompanyPaymentStatus.COMPLETED,
        processedAt: new Date(),
        notes: input.notes,
      },
    });

    // Update invoice
    const newPaidAmount = invoice.paidAmountGBP + input.amountGBP;
    const newOutstanding = invoice.totalGBP - newPaidAmount;
    
    let newStatus = invoice.status;
    if (newOutstanding <= 0) {
      newStatus = CompanyInvoiceStatus.PAID;
    } else if (newPaidAmount > 0) {
      newStatus = CompanyInvoiceStatus.PARTIALLY_PAID;
    }

    await prisma.companyInvoice.update({
      where: { id: input.invoiceId },
      data: {
        paidAmountGBP: newPaidAmount,
        outstandingGBP: Math.max(0, newOutstanding),
        status: newStatus,
        paidAt: newStatus === CompanyInvoiceStatus.PAID ? new Date() : undefined,
        paymentMethod: input.method.toString(),
        paymentReference: input.reference,
      },
    });

    // Update company balance
    await prisma.company.update({
      where: { id: invoice.companyId },
      data: {
        currentBalanceGBP: { decrement: input.amountGBP },
      },
    });

    await companyAuditService.log({
      companyId: invoice.companyId,
      actorId,
      actorType: 'user',
      action: 'PAYMENT_RECEIVED',
      targetType: 'invoice',
      targetId: input.invoiceId,
      metadata: {
        paymentId: payment.id,
        amountGBP: input.amountGBP,
        method: input.method,
      },
    });

    return payment;
  },

  /**
   * Cancel an invoice
   */
  async cancel(id: string, reason: string, actorId: string) {
    const invoice = await prisma.companyInvoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === CompanyInvoiceStatus.PAID) {
      throw new Error('Cannot cancel a paid invoice');
    }

    const updatedInvoice = await prisma.companyInvoice.update({
      where: { id },
      data: {
        status: CompanyInvoiceStatus.CANCELLED,
        internalNotes: `Cancelled: ${reason}`,
      },
    });

    // Reverse company balance
    await prisma.company.update({
      where: { id: invoice.companyId },
      data: {
        currentBalanceGBP: { decrement: invoice.outstandingGBP },
      },
    });

    await companyAuditService.log({
      companyId: invoice.companyId,
      actorId,
      actorType: 'user',
      action: 'INVOICE_CANCELLED',
      targetType: 'invoice',
      targetId: id,
      metadata: { reason },
    });

    return updatedInvoice;
  },

  /**
   * Mark overdue invoices
   */
  async markOverdueInvoices() {
    const result = await prisma.companyInvoice.updateMany({
      where: {
        status: { in: [CompanyInvoiceStatus.SENT, CompanyInvoiceStatus.VIEWED, CompanyInvoiceStatus.PARTIALLY_PAID] },
        dueDate: { lt: new Date() },
      },
      data: { status: CompanyInvoiceStatus.OVERDUE },
    });

    return result.count;
  },

  /**
   * Get overdue summary for a company
   */
  async getOverdueSummary(companyId: string) {
    const overdueInvoices = await prisma.companyInvoice.findMany({
      where: {
        companyId,
        status: CompanyInvoiceStatus.OVERDUE,
      },
      select: {
        id: true,
        invoiceNumber: true,
        totalGBP: true,
        outstandingGBP: true,
        dueDate: true,
      },
    });

    const totalOverdueGBP = overdueInvoices.reduce((sum, inv) => sum + inv.outstandingGBP, 0);
    const oldestOverdue = overdueInvoices.length > 0 
      ? Math.min(...overdueInvoices.map(inv => inv.dueDate.getTime()))
      : null;

    return {
      count: overdueInvoices.length,
      totalOverdueGBP,
      oldestOverdueDate: oldestOverdue ? new Date(oldestOverdue) : null,
      invoices: overdueInvoices,
    };
  },

  /**
   * Get invoice statistics for a company
   */
  async getStatistics(companyId: string, months: number = 12) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const [
      totalInvoiced,
      totalPaid,
      totalOutstanding,
      invoicesByStatus,
    ] = await Promise.all([
      prisma.companyInvoice.aggregate({
        where: { companyId, issueDate: { gte: since } },
        _sum: { totalGBP: true },
      }),
      prisma.companyInvoice.aggregate({
        where: { companyId, issueDate: { gte: since } },
        _sum: { paidAmountGBP: true },
      }),
      prisma.companyInvoice.aggregate({
        where: { companyId, status: { notIn: [CompanyInvoiceStatus.PAID, CompanyInvoiceStatus.CANCELLED] } },
        _sum: { outstandingGBP: true },
      }),
      prisma.companyInvoice.groupBy({
        by: ['status'],
        where: { companyId, issueDate: { gte: since } },
        _count: true,
        _sum: { totalGBP: true },
      }),
    ]);

    return {
      totalInvoicedGBP: totalInvoiced._sum.totalGBP || 0,
      totalPaidGBP: totalPaid._sum.paidAmountGBP || 0,
      totalOutstandingGBP: totalOutstanding._sum.outstandingGBP || 0,
      byStatus: invoicesByStatus.map(s => ({
        status: s.status,
        count: s._count,
        totalGBP: s._sum.totalGBP || 0,
      })),
    };
  },

  /**
   * Add item to existing invoice (only if draft)
   */
  async addItem(invoiceId: string, item: InvoiceItemInput, actorId: string) {
    const invoice = await prisma.companyInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status !== CompanyInvoiceStatus.DRAFT) {
      throw new Error('Can only add items to draft invoices');
    }

    const vatRate = item.vatRate ?? 0.20;
    const totalGBP = item.quantity * item.unitPriceGBP;
    const vatGBP = Math.round(totalGBP * vatRate);

    const invoiceItem = await prisma.companyInvoiceItem.create({
      data: {
        invoiceId,
        description: item.description,
        quantity: item.quantity,
        unitPriceGBP: item.unitPriceGBP,
        totalGBP,
        vatRate,
        vatGBP,
        bookingId: item.bookingId,
        serviceDate: item.serviceDate,
      },
    });

    // Update invoice totals
    await prisma.companyInvoice.update({
      where: { id: invoiceId },
      data: {
        subtotalGBP: { increment: totalGBP },
        vatGBP: { increment: vatGBP },
        totalGBP: { increment: totalGBP + vatGBP },
        outstandingGBP: { increment: totalGBP + vatGBP },
      },
    });

    return invoiceItem;
  },
};

export default companyInvoiceService;
