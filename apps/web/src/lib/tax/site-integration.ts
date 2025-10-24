/**
 * SPEEDY-VAN SITE DATA INTEGRATION FOR TAX SYSTEM
 * 
 * Integration layer between tax system and speedy-van.co.uk data:
 * - Fetch booking data for tax calculations
 * - Integrate payment records
 * - Sync customer information
 * - Real-time transaction monitoring
 * - Automated invoice generation
 */

import { prisma } from '@/lib/prisma';
import { taxCalculator, VatRateType } from './calculator';

export interface BookingTaxData {
  bookingId: string;
  bookingCode: string;
  customerEmail: string;
  customerName: string;
  totalPrice: number;
  vatAmount: number;
  netAmount: number;
  vatRate: number;
  vatRateType: VatRateType;
  serviceDate: Date;
  status: string;
  paymentStatus: string;
}

export interface PaymentTaxData {
  paymentId: string;
  bookingId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  status: string;
  stripePaymentIntentId?: string;
}

export interface CustomerTaxProfile {
  customerId: string;
  email: string;
  name: string;
  isVATRegistered: boolean;
  vatNumber?: string;
  totalSpent: number;
  totalVATPaid: number;
  bookingCount: number;
  lastBookingDate?: Date;
}

export interface TaxPeriodSummary {
  periodStart: Date;
  periodEnd: Date;
  totalBookings: number;
  totalRevenue: number;
  totalVATCollected: number;
  totalNetRevenue: number;
  averageBookingValue: number;
  topCustomers: Array<{
    email: string;
    name: string;
    totalSpent: number;
    bookingCount: number;
  }>;
}

export class SiteDataIntegrationService {
  /**
   * Fetch all bookings for a tax period
   */
  async getBookingsForTaxPeriod(
    periodStart: Date,
    periodEnd: Date
  ): Promise<BookingTaxData[]> {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          scheduledAt: {
            gte: periodStart,
            lte: periodEnd
          },
          status: {
            in: ['completed', 'confirmed', 'in_progress']
          }
        },
        include: {
          customer: true
        },
        orderBy: {
          scheduledAt: 'asc'
        }
      });

      return bookings.map(booking => {
        const totalPrice = Number(booking.totalPrice);
        const vatCalculation = taxCalculator.calculateVAT(
          totalPrice,
          VatRateType.STANDARD,
          false,
          true // totalPrice includes VAT
        );

        return {
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          customerEmail: booking.customerEmail,
          customerName: booking.customerName,
          totalPrice: vatCalculation.gross,
          vatAmount: vatCalculation.vat,
          netAmount: vatCalculation.net,
          vatRate: vatCalculation.rate,
          vatRateType: vatCalculation.rateType,
          serviceDate: booking.scheduledAt,
          status: booking.status,
          paymentStatus: booking.paymentStatus
        };
      });

    } catch (error) {
      console.error('Error fetching bookings for tax period:', error);
      throw new Error('Failed to fetch booking data for tax calculations');
    }
  }

  /**
   * Get payment records for a tax period
   */
  async getPaymentsForTaxPeriod(
    periodStart: Date,
    periodEnd: Date
  ): Promise<PaymentTaxData[]> {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          createdAt: {
            gte: periodStart,
            lte: periodEnd
          },
          status: 'succeeded'
        },
        include: {
          booking: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      return payments.map(payment => ({
        paymentId: payment.id,
        bookingId: payment.bookingId,
        amount: Number(payment.amount),
        paymentMethod: payment.paymentMethod,
        paymentDate: payment.createdAt,
        status: payment.status,
        stripePaymentIntentId: payment.stripePaymentIntentId || undefined
      }));

    } catch (error) {
      console.error('Error fetching payments for tax period:', error);
      throw new Error('Failed to fetch payment data for tax calculations');
    }
  }

  /**
   * Get customer tax profile
   */
  async getCustomerTaxProfile(customerEmail: string): Promise<CustomerTaxProfile | null> {
    try {
      const customer = await prisma.user.findUnique({
        where: { email: customerEmail },
        include: {
          bookings: {
            where: {
              status: {
                in: ['completed', 'confirmed']
              }
            }
          }
        }
      });

      if (!customer) {
        return null;
      }

      const totalSpent = customer.bookings.reduce(
        (sum, booking) => sum + Number(booking.totalPrice),
        0
      );

      const totalVATPaid = customer.bookings.reduce((sum, booking) => {
        const vatCalc = taxCalculator.calculateVAT(
          Number(booking.totalPrice),
          VatRateType.STANDARD,
          false,
          true
        );
        return sum + vatCalc.vat;
      }, 0);

      const lastBooking = customer.bookings.sort(
        (a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime()
      )[0];

      return {
        customerId: customer.id,
        email: customer.email,
        name: customer.name || 'Unknown',
        isVATRegistered: false, // TODO: Add VAT registration field to user model
        totalSpent,
        totalVATPaid,
        bookingCount: customer.bookings.length,
        lastBookingDate: lastBooking?.scheduledAt
      };

    } catch (error) {
      console.error('Error fetching customer tax profile:', error);
      return null;
    }
  }

  /**
   * Generate tax period summary from site data
   */
  async generateTaxPeriodSummary(
    periodStart: Date,
    periodEnd: Date
  ): Promise<TaxPeriodSummary> {
    try {
      const bookings = await this.getBookingsForTaxPeriod(periodStart, periodEnd);

      const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
      const totalVATCollected = bookings.reduce((sum, b) => sum + b.vatAmount, 0);
      const totalNetRevenue = bookings.reduce((sum, b) => sum + b.netAmount, 0);

      // Calculate top customers
      const customerMap = new Map<string, { name: string; totalSpent: number; bookingCount: number }>();
      
      bookings.forEach(booking => {
        const existing = customerMap.get(booking.customerEmail);
        if (existing) {
          existing.totalSpent += booking.totalPrice;
          existing.bookingCount += 1;
        } else {
          customerMap.set(booking.customerEmail, {
            name: booking.customerName,
            totalSpent: booking.totalPrice,
            bookingCount: 1
          });
        }
      });

      const topCustomers = Array.from(customerMap.entries())
        .map(([email, data]) => ({
          email,
          name: data.name,
          totalSpent: data.totalSpent,
          bookingCount: data.bookingCount
        }))
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 10);

      return {
        periodStart,
        periodEnd,
        totalBookings: bookings.length,
        totalRevenue,
        totalVATCollected,
        totalNetRevenue,
        averageBookingValue: bookings.length > 0 ? totalRevenue / bookings.length : 0,
        topCustomers
      };

    } catch (error) {
      console.error('Error generating tax period summary:', error);
      throw new Error('Failed to generate tax period summary');
    }
  }

  /**
   * Sync booking data to tax invoices
   */
  async syncBookingToTaxInvoice(bookingId: string): Promise<string> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Check if invoice already exists
      const existingInvoice = await prisma.taxInvoice.findFirst({
        where: { bookingId }
      });

      if (existingInvoice) {
        return existingInvoice.id;
      }

      // Calculate VAT breakdown
      const totalPrice = Number(booking.totalPrice);
      const vatCalculation = taxCalculator.calculateVAT(
        totalPrice,
        VatRateType.STANDARD,
        false,
        true
      );

      // Get company tax settings
      const taxSettings = await prisma.companyTaxSettings.findFirst({
        where: { isActive: true }
      });

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Create tax invoice
      const invoice = await prisma.taxInvoice.create({
        data: {
          invoiceNumber,
          customerId: booking.customerId,
          bookingId: booking.id,
          issueDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          netAmount: vatCalculation.net,
          vatAmount: vatCalculation.vat,
          grossAmount: vatCalculation.gross,
          vatRate: vatCalculation.rate,
          vatRateType: vatCalculation.rateType,
          currency: 'GBP',
          status: 'issued',
          paymentStatus: booking.paymentStatus === 'paid' ? 'paid' : 'pending',
          vatRegistrationNumber: taxSettings?.vatRegistrationNumber,
          companyName: taxSettings?.companyName || 'Speedy Van',
          companyAddress: process.env.NEXT_PUBLIC_COMPANY_ADDRESS || '',
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerAddress: `${booking.pickupAddress}, ${booking.pickupPostcode}`,
          notes: `Van delivery service - ${booking.bookingCode}`,
          paymentTerms: 'Payment due within 30 days',
          createdBy: 'system'
        }
      });

      // Create invoice item
      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          description: `Van Delivery Service - ${booking.vehicleType}`,
          quantity: 1,
          unitPrice: vatCalculation.net,
          netAmount: vatCalculation.net,
          vatAmount: vatCalculation.vat,
          grossAmount: vatCalculation.gross,
          vatRate: vatCalculation.rate,
          vatRateType: vatCalculation.rateType
        }
      });

      console.log(`Created tax invoice ${invoiceNumber} for booking ${booking.bookingCode}`);
      return invoice.id;

    } catch (error) {
      console.error('Error syncing booking to tax invoice:', error);
      throw new Error('Failed to create tax invoice from booking');
    }
  }

  /**
   * Batch sync bookings to tax invoices
   */
  async batchSyncBookingsToInvoices(
    periodStart: Date,
    periodEnd: Date
  ): Promise<{ created: number; skipped: number; errors: number }> {
    let created = 0;
    let skipped = 0;
    let errors = 0;

    try {
      const bookings = await prisma.booking.findMany({
        where: {
          scheduledAt: {
            gte: periodStart,
            lte: periodEnd
          },
          status: {
            in: ['completed', 'confirmed']
          }
        }
      });

      for (const booking of bookings) {
        try {
          // Check if invoice exists
          const existingInvoice = await prisma.taxInvoice.findFirst({
            where: { bookingId: booking.id }
          });

          if (existingInvoice) {
            skipped++;
            continue;
          }

          await this.syncBookingToTaxInvoice(booking.id);
          created++;

        } catch (error) {
          console.error(`Error syncing booking ${booking.id}:`, error);
          errors++;
        }
      }

      console.log(`Batch sync completed: ${created} created, ${skipped} skipped, ${errors} errors`);
      return { created, skipped, errors };

    } catch (error) {
      console.error('Error in batch sync:', error);
      throw new Error('Failed to batch sync bookings to invoices');
    }
  }

  /**
   * Generate unique invoice number
   */
  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}`;

    // Get last invoice number for this year
    const lastInvoice = await prisma.taxInvoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: prefix
        }
      },
      orderBy: {
        invoiceNumber: 'desc'
      }
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}-${sequence.toString().padStart(6, '0')}`;
  }

  /**
   * Get real-time booking statistics
   */
  async getRealTimeStats(): Promise<{
    todayBookings: number;
    todayRevenue: number;
    todayVAT: number;
    pendingPayments: number;
    pendingPaymentsAmount: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayBookings = await prisma.booking.count({
        where: {
          scheduledAt: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      const todayBookingsData = await prisma.booking.findMany({
        where: {
          scheduledAt: {
            gte: today,
            lt: tomorrow
          },
          status: {
            in: ['completed', 'confirmed']
          }
        }
      });

      const todayRevenue = todayBookingsData.reduce(
        (sum, b) => sum + Number(b.totalPrice),
        0
      );

      const todayVAT = todayBookingsData.reduce((sum, b) => {
        const vatCalc = taxCalculator.calculateVAT(
          Number(b.totalPrice),
          VatRateType.STANDARD,
          false,
          true
        );
        return sum + vatCalc.vat;
      }, 0);

      const pendingPayments = await prisma.booking.count({
        where: {
          paymentStatus: {
            in: ['pending', 'failed']
          }
        }
      });

      const pendingPaymentsData = await prisma.booking.findMany({
        where: {
          paymentStatus: {
            in: ['pending', 'failed']
          }
        }
      });

      const pendingPaymentsAmount = pendingPaymentsData.reduce(
        (sum, b) => sum + Number(b.totalPrice),
        0
      );

      return {
        todayBookings,
        todayRevenue,
        todayVAT,
        pendingPayments,
        pendingPaymentsAmount
      };

    } catch (error) {
      console.error('Error getting real-time stats:', error);
      throw new Error('Failed to get real-time statistics');
    }
  }
}

// Export singleton instance
export const siteDataIntegration = new SiteDataIntegrationService();

