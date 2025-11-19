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
}

class SiteDataIntegrationService {
  async getBookingsForTaxPeriod(periodStart: Date, periodEnd: Date): Promise<BookingTaxData[]> {
    const bookings = await prisma.booking.findMany({
      where: {
        scheduledAt: {
          gte: periodStart,
          lte: periodEnd
        },
        status: {
          in: ['COMPLETED', 'CONFIRMED']
        }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    return bookings.map(booking => {
      const totalPrice = Number(booking.totalGBP ?? 0) / 100;
      const vatCalculation = taxCalculator.calculateVAT(
        totalPrice,
        VatRateType.STANDARD,
        false,
        true
      );

      return {
        bookingId: booking.id,
        bookingCode: booking.reference,
        customerEmail: booking.customerEmail,
        customerName: booking.customerName,
        totalPrice: vatCalculation.gross,
        vatAmount: vatCalculation.vat,
        netAmount: vatCalculation.net,
        vatRate: vatCalculation.rate,
        vatRateType: vatCalculation.rateType,
        serviceDate: booking.scheduledAt,
        status: booking.status,
        paymentStatus: booking.paidAt ? 'paid' : 'unpaid'
      };
    });
  }

  async batchSyncBookingsToInvoices(periodStart: Date, periodEnd: Date) {
    const bookings = await this.getBookingsForTaxPeriod(periodStart, periodEnd);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const booking of bookings) {
      try {
        const existingInvoice = await prisma.taxInvoice.findFirst({
          where: { bookingId: booking.bookingId }
        });

        if (existingInvoice) {
          skipped += 1;
          continue;
        }

        await this.upsertTaxInvoice(booking.bookingId);
        created += 1;
      } catch (error) {
        errors += 1;
        console.error(`Failed to sync booking ${booking.bookingId}:`, error);
      }
    }

    return { created, skipped, errors };
  }

  async getRealTimeStats() {
    const [activeBookings, recentInvoices, vatLast30Days] = await Promise.all([
      prisma.booking.count({
        where: {
          status: {
            in: ['CONFIRMED', 'PENDING_PAYMENT']
          }
        }
      }),
      prisma.taxInvoice.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        }
      }),
      prisma.taxInvoice.aggregate({
        _sum: {
          vatAmount: true
        },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    return {
      activeBookings,
      invoicesLast24h: recentInvoices,
      vatCollectedLast30d: Number(vatLast30Days._sum.vatAmount ?? 0)
    };
  }

  private async upsertTaxInvoice(bookingId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      throw new Error('Booking not found');
    }

    const totalPrice = Number(booking.totalGBP ?? 0) / 100;
    const vatCalculation = taxCalculator.calculateVAT(
      totalPrice,
      VatRateType.STANDARD,
      false,
      true
    );

    await prisma.taxInvoice.create({
      data: {
        invoiceNumber: `INV-${booking.reference}`,
        bookingId: booking.id,
        customerId: booking.customerId ?? undefined,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        grossAmount: vatCalculation.gross,
        netAmount: vatCalculation.net,
        vatAmount: vatCalculation.vat,
        vatRate: vatCalculation.rate,
        vatRateType: vatCalculation.rateType,
        paymentStatus: booking.paidAt ? 'paid' : 'unpaid',
        status: booking.paidAt ? 'PAID' : 'SENT',
        description: `Delivery order ${booking.reference}`,
        metadata: {
          bookingId: booking.id
        }
      }
    });
  }
}

export const siteDataIntegration = new SiteDataIntegrationService();
