import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { taxCalculator, VatRateType } from './calculator';

export enum PaymentGateway {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  WORLDPAY = 'worldpay',
  SQUARE = 'square',
  BANK_TRANSFER = 'bank_transfer'
}

export enum WebhookEventType {
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  INVOICE_PAID = 'invoice.paid',
  CHARGE_DISPUTED = 'charge.disputed'
}

interface PaymentWebhookResponse {
  success: boolean;
  message: string;
  eventType?: WebhookEventType;
  paymentData?: Record<string, unknown>;
}

export class PaymentWebhookService {
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-04-10'
    });
  }

  async processStripeWebhook(request: NextRequest): Promise<PaymentWebhookResponse> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    const payload = await request.text();
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      throw new Error('Stripe signature header missing');
    }

    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return this.handleStripeEvent(event);
  }

  private async handleStripeEvent(event: Stripe.Event): Promise<PaymentWebhookResponse> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      case 'payment_intent.payment_failed':
        return this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      case 'invoice.payment_succeeded':
        return this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      case 'payment_intent.canceled':
        return this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
      default:
        return {
          success: true,
          message: `Event ${event.type} ignored`
        };
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    if (paymentIntent.metadata?.bookingId) {
      await prisma.booking.updateMany({
        where: { id: paymentIntent.metadata.bookingId },
        data: {
          paidAt: new Date(),
          status: 'CONFIRMED'
        }
      });

      await this.ensureTaxInvoice(paymentIntent.metadata.bookingId, paymentIntent);
    }

    return {
      success: true,
      message: 'Stripe payment recorded',
      eventType: WebhookEventType.PAYMENT_SUCCEEDED,
      paymentData: {
        paymentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        bookingId: paymentIntent.metadata?.bookingId
      }
    };
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    if (paymentIntent.metadata?.bookingId) {
      await prisma.booking.updateMany({
        where: { id: paymentIntent.metadata.bookingId },
        data: { status: 'CANCELLED' }
      });
    }

    return {
      success: true,
      message: 'Stripe payment failure processed',
      eventType: WebhookEventType.PAYMENT_FAILED,
      paymentData: {
        paymentId: paymentIntent.id,
        bookingId: paymentIntent.metadata?.bookingId
      }
    };
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    if (invoice.metadata?.taxInvoiceId) {
      await prisma.taxInvoice.updateMany({
        where: { id: invoice.metadata.taxInvoiceId },
        data: {
          paymentDate: new Date(),
          paymentStatus: 'paid',
          status: 'PAID'
        }
      });
    }

    return {
      success: true,
      message: 'Stripe invoice payment recorded',
      eventType: WebhookEventType.INVOICE_PAID,
      paymentData: {
        paymentIntentId: invoice.payment_intent,
        taxInvoiceId: invoice.metadata?.taxInvoiceId,
        amountPaid: invoice.amount_paid / 100
      }
    };
  }

  private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
    if (paymentIntent.metadata?.bookingId) {
      await prisma.booking.updateMany({
        where: { id: paymentIntent.metadata.bookingId },
        data: { status: 'CANCELLED' }
      });
    }

    return {
      success: true,
      message: 'Stripe payment intent cancelled',
      eventType: WebhookEventType.PAYMENT_FAILED,
      paymentData: {
        paymentId: paymentIntent.id,
        bookingId: paymentIntent.metadata?.bookingId
      }
    };
  }

  private async ensureTaxInvoice(bookingId: string, paymentIntent: Stripe.PaymentIntent) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return;
    }

    const existingInvoice = await prisma.taxInvoice.findFirst({
      where: { bookingId }
    });

    const baseAmount = Number(booking.totalGBP ?? 0) / 100;
    const vatCalc = taxCalculator.calculateVAT(baseAmount, VatRateType.STANDARD, false, true);

    if (existingInvoice) {
      await prisma.taxInvoice.update({
        where: { id: existingInvoice.id },
        data: {
          grossAmount: vatCalc.gross,
          netAmount: vatCalc.net,
          vatAmount: vatCalc.vat,
          vatRate: vatCalc.rate,
          vatRateType: vatCalc.rateType,
          paymentStatus: 'paid',
          status: 'PAID',
          paymentDate: new Date(),
          metadata: {
            ...(existingInvoice.metadata as Record<string, unknown>),
            paymentIntentId: paymentIntent.id
          }
        }
      });
      return existingInvoice.id;
    }

    const invoiceNumber = `INV-${booking.reference}`;
    const created = await prisma.taxInvoice.create({
      data: {
        invoiceNumber,
        bookingId: booking.id,
        customerId: booking.customerId ?? undefined,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        grossAmount: vatCalc.gross,
        netAmount: vatCalc.net,
        vatAmount: vatCalc.vat,
        vatRate: vatCalc.rate,
        vatRateType: vatCalc.rateType,
        paymentStatus: 'paid',
        status: 'PAID',
        description: `Delivery order ${booking.reference}`,
        metadata: {
          bookingId: booking.id,
          paymentIntentId: paymentIntent.id
        }
      }
    });

    return created.id;
  }
}

export const paymentWebhookService = new PaymentWebhookService();
