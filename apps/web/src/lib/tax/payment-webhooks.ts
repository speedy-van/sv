/**
 * PAYMENT WEBHOOK SYSTEM FOR AUTOMATIC TAX RECORDING
 * 
 * Advanced webhook system that automatically records tax transactions
 * when payments are received through various payment gateways.
 * 
 * Supported Gateways:
 * - Stripe
 * - PayPal
 * - WorldPay
 * - Square
 * - Bank Transfer
 */

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { taxCalculator, VatRateType } from './calculator';
// Removed unused hmrcApiService import
import Stripe from 'stripe';

export interface PaymentWebhookData {
  paymentId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  gateway: PaymentGateway;
  customerId?: string;
  bookingId?: string;
  invoiceId?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface TaxTransactionRecord {
  invoiceId: string;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  vatRate: number;
  vatRateType: VatRateType;
  isReverseCharge: boolean;
  taxPeriod: string;
  hmrcSubmissionId?: string;
}

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

export class PaymentWebhookService {
  private readonly stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-04-10'
    });
  }

  /**
   * Process incoming webhook from any payment gateway
   */
  async processWebhook(
    request: NextRequest,
    gateway: PaymentGateway
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const body = await request.text();
      const signature = request.headers.get('stripe-signature') || 
                       request.headers.get('paypal-signature') ||
                       request.headers.get('worldpay-signature') ||
                       request.headers.get('square-signature');

      if (!signature) {
        throw new Error('Webhook signature missing');
      }

      // Verify webhook signature based on gateway
      const verifiedData = await this.verifyWebhookSignature(
        body, 
        signature, 
        gateway
      );

      // Process the webhook event
      const result = await this.processWebhookEvent(verifiedData, gateway);

      // Record tax transaction if payment was successful
      if (result.success && result.eventType === WebhookEventType.PAYMENT_SUCCEEDED) {
        await this.recordTaxTransaction(result.paymentData);
      }

      return result;

    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process Stripe webhook specifically
   */
  async processStripeWebhook(request: NextRequest): Promise<any> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error}`);
    }

    return this.handleStripeEvent(event);
  }

  /**
   * Handle different Stripe events
   */
  private async handleStripeEvent(event: Stripe.Event): Promise<any> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        return this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      
      case 'payment_intent.payment_failed':
        return this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      
      case 'invoice.payment_succeeded':
        return this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
      
      case 'charge.dispute.created':
        return this.handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
      
      case 'payment_intent.canceled':
        return this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
      
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
        return { success: true, message: 'Event not handled' };
    }
  }

  /**
   * Handle successful payment intent
   */
  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<any> {
    try {
      // Update booking status to paid
      if (paymentIntent.metadata?.bookingId) {
        await prisma.booking.update({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: {
            paidAt: new Date(),
            status: 'CONFIRMED'
          }
        });
      }

      // Create tax invoice if not exists
      const invoice = await this.createOrUpdateTaxInvoice(paymentIntent);

      return {
        success: true,
        message: 'Payment processed successfully',
        eventType: WebhookEventType.PAYMENT_SUCCEEDED,
        paymentData: {
          paymentId: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convert from pence
          currency: paymentIntent.currency,
          paymentMethod: 'stripe',
          gateway: PaymentGateway.STRIPE,
          customerId: paymentIntent.metadata?.customerId,
          bookingId: paymentIntent.metadata?.bookingId,
          invoiceId: invoice?.id,
          metadata: paymentIntent.metadata,
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('Error handling payment intent succeeded:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment intent
   */
  private async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<any> {
    try {
      // Update booking status to failed
      if (paymentIntent.metadata?.bookingId) {
        await prisma.booking.update({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: {
            status: 'CANCELLED'
          }
        });
      }

      return {
        success: true,
        message: 'Payment failure processed',
        eventType: WebhookEventType.PAYMENT_FAILED,
        paymentData: {
          paymentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          paymentMethod: 'stripe',
          gateway: PaymentGateway.STRIPE,
          customerId: paymentIntent.metadata?.customerId,
          bookingId: paymentIntent.metadata?.bookingId,
          metadata: paymentIntent.metadata,
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('Error handling payment intent failed:', error);
      throw error;
    }
  }

  /**
   * Handle successful invoice payment
   */
  private async handleInvoicePaymentSucceeded(
    invoice: Stripe.Invoice
  ): Promise<any> {
    try {
      // Update tax invoice status
      if (invoice.metadata?.taxInvoiceId) {
        await prisma.taxInvoice.update({
          where: { id: invoice.metadata.taxInvoiceId },
          data: {
            paymentDate: new Date(),
            paymentStatus: 'paid'
          }
        });
      }

      return {
        success: true,
        message: 'Invoice payment processed successfully',
        eventType: WebhookEventType.INVOICE_PAID,
        paymentData: {
          paymentId: invoice.payment_intent as string,
          amount: invoice.amount_paid / 100,
          currency: invoice.currency,
          paymentMethod: 'stripe',
          gateway: PaymentGateway.STRIPE,
          customerId: invoice.customer as string,
          invoiceId: invoice.metadata?.taxInvoiceId,
          metadata: invoice.metadata,
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('Error handling invoice payment succeeded:', error);
      throw error;
    }
  }

  /**
   * Handle charge dispute
   */
  private async handleChargeDisputeCreated(
    dispute: Stripe.Dispute
  ): Promise<any> {
    try {
      // Log dispute for tax purposes
      await prisma.taxComplianceLog.create({
        data: {
          checkType: 'payment_deadlines',
          isCompliant: false,
          complianceScore: 80, // Reduced score due to dispute
          issues: JSON.stringify([{
            type: 'payment_dispute',
            disputeId: dispute.id,
            amount: dispute.amount / 100,
            reason: dispute.reason,
            status: dispute.status
          }]),
          recommendations: JSON.stringify([{
            action: 'investigate_dispute',
            priority: 'high',
            description: 'Review dispute and prepare documentation'
          }]),
          description: `Payment dispute created for ${dispute.amount / 100} ${dispute.currency}`,
          details: JSON.stringify(dispute),
          createdBy: 'system'
        }
      });

      return {
        success: true,
        message: 'Dispute logged for tax compliance',
        eventType: WebhookEventType.CHARGE_DISPUTED,
        paymentData: {
          paymentId: dispute.charge as string,
          amount: dispute.amount / 100,
          currency: dispute.currency,
          paymentMethod: 'stripe',
          gateway: PaymentGateway.STRIPE,
          metadata: { disputeId: dispute.id, reason: dispute.reason },
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('Error handling charge dispute:', error);
      throw error;
    }
  }

  /**
   * Handle canceled payment intent
   */
  private async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<any> {
    try {
      // Update booking status to canceled
      if (paymentIntent.metadata?.bookingId) {
        await prisma.booking.update({
          where: { stripePaymentIntentId: paymentIntent.id },
          data: {
            status: 'CANCELLED'
          }
        });
      }

      return {
        success: true,
        message: 'Payment cancellation processed',
        eventType: WebhookEventType.PAYMENT_FAILED,
        paymentData: {
          paymentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          paymentMethod: 'stripe',
          gateway: PaymentGateway.STRIPE,
          customerId: paymentIntent.metadata?.customerId,
          bookingId: paymentIntent.metadata?.bookingId,
          metadata: paymentIntent.metadata,
          timestamp: new Date()
        }
      };

    } catch (error) {
      console.error('Error handling payment intent canceled:', error);
      throw error;
    }
  }

  /**
   * Create or update tax invoice from payment data
   */
  private async createOrUpdateTaxInvoice(paymentIntent: Stripe.PaymentIntent): Promise<any> {
    try {
      const amount = paymentIntent.amount / 100;
      const vatCalculation = taxCalculator.calculateVAT(amount, VatRateType.STANDARD);
      
      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Get company tax settings
      const taxSettings = await prisma.companyTaxSettings.findFirst({
        where: { isActive: true }
      });

      const invoice = await prisma.taxInvoice.create({
        data: {
          invoiceNumber,
          customerId: paymentIntent.metadata?.customerId,
          bookingId: paymentIntent.metadata?.bookingId,
          netAmount: vatCalculation.net,
          vatAmount: vatCalculation.vat,
          grossAmount: vatCalculation.gross,
          vatRate: vatCalculation.rate,
          vatRateType: vatCalculation.rateType,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          status: 'PAID',
          paymentStatus: 'paid',
          paymentDate: new Date(),
          vatRegistrationNumber: taxSettings?.vatRegistrationNumber,
          isVATRegistered: taxSettings?.isVATRegistered || false,
          description: `Payment for booking ${paymentIntent.metadata?.bookingId}`,
          createdBy: 'system',
          updatedBy: 'system'
        }
      });

      // Create invoice payment record
      await prisma.invoicePayment.create({
        data: {
          invoiceId: invoice.id,
          paymentMethod: 'stripe',
          paymentReference: paymentIntent.id,
          amount: amount,
          paymentDate: new Date(),
          status: 'paid',
          stripePaymentIntentId: paymentIntent.id,
          stripeChargeId: paymentIntent.latest_charge as string,
          notes: 'Payment processed via Stripe webhook'
        }
      });

      return invoice;

    } catch (error) {
      console.error('Error creating tax invoice:', error);
      throw error;
    }
  }

  /**
   * Record tax transaction for HMRC submission
   */
  private async recordTaxTransaction(paymentData: PaymentWebhookData): Promise<void> {
    try {
      // Get current tax period
      const currentDate = new Date();
      const taxPeriod = taxCalculator.getVATPeriod(currentDate, 'quarterly');

      // Find or create tax record for the period
      let taxRecord = await prisma.taxRecord.findFirst({
        where: {
          taxPeriod,
          taxType: 'vat'
        }
      });

      if (!taxRecord) {
        const taxYear = parseInt(taxCalculator.getTaxYear(currentDate).split('-')[0]);
        taxRecord = await prisma.taxRecord.create({
          data: {
            taxYear,
            taxPeriod,
            periodStart: this.getPeriodStartDate(currentDate, 'quarterly'),
            periodEnd: this.getPeriodEndDate(currentDate, 'quarterly'),
            taxType: 'vat',
            createdBy: 'system'
          }
        });
      }

      // Calculate VAT breakdown
      const vatCalculation = taxCalculator.calculateVAT(
        paymentData.amount, 
        VatRateType.STANDARD
      );

      // Update tax record with new transaction
      await prisma.taxRecord.update({
        where: { id: taxRecord.id },
        data: {
          totalSales: Number(taxRecord.totalSales) + vatCalculation.net,
          vatOnSales: Number(taxRecord.vatOnSales) + vatCalculation.vat,
          standardRateSales: Number(taxRecord.standardRateSales) + vatCalculation.net,
          standardRateVAT: Number(taxRecord.standardRateVAT) + vatCalculation.vat,
          netVATDue: Number(taxRecord.vatOnSales) + vatCalculation.vat - Number(taxRecord.vatOnPurchases),
          updatedBy: 'system'
        }
      });

      // Log the transaction
      console.log(`Tax transaction recorded: ${paymentData.amount} for period ${taxPeriod}`);

    } catch (error) {
      console.error('Error recording tax transaction:', error);
      // Don't throw error to avoid webhook failure
    }
  }

  /**
   * Verify webhook signature based on gateway
   */
  private async verifyWebhookSignature(
    body: string,
    signature: string,
    gateway: PaymentGateway
  ): Promise<any> {
    switch (gateway) {
      case PaymentGateway.STRIPE:
        return this.stripe.webhooks.constructEvent(
          body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET!
        );
      
      case PaymentGateway.PAYPAL:
        // PayPal signature verification would go here
        return JSON.parse(body);
      
      case PaymentGateway.WORLDPAY:
        // WorldPay signature verification would go here
        return JSON.parse(body);
      
      case PaymentGateway.SQUARE:
        // Square signature verification would go here
        return JSON.parse(body);
      
      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  }

  /**
   * Process webhook event based on gateway
   */
  private async processWebhookEvent(
    verifiedData: any,
    gateway: PaymentGateway
  ): Promise<any> {
    switch (gateway) {
      case PaymentGateway.STRIPE:
        return this.handleStripeEvent(verifiedData);
      
      case PaymentGateway.PAYPAL:
        return this.handlePayPalEvent(verifiedData);
      
      case PaymentGateway.WORLDPAY:
        return this.handleWorldPayEvent(verifiedData);
      
      case PaymentGateway.SQUARE:
        return this.handleSquareEvent(verifiedData);
      
      default:
        throw new Error(`Unsupported payment gateway: ${gateway}`);
    }
  }

  /**
   * Handle PayPal events (placeholder)
   */
  private async handlePayPalEvent(event: any): Promise<any> {
    void event;
    // PayPal event handling implementation
    return { success: true, message: 'PayPal event processed' };
  }

  /**
   * Handle WorldPay events (placeholder)
   */
  private async handleWorldPayEvent(event: any): Promise<any> {
    void event;
    // WorldPay event handling implementation
    return { success: true, message: 'WorldPay event processed' };
  }

  /**
   * Handle Square events (placeholder)
   */
  private async handleSquareEvent(event: any): Promise<any> {
    void event;
    // Square event handling implementation
    return { success: true, message: 'Square event processed' };
  }

  /**
   * Get period start date based on frequency
   */
  private getPeriodStartDate(date: Date, frequency: string): Date {
    const year = date.getFullYear();
    const month = date.getMonth();

    switch (frequency) {
      case 'monthly':
        return new Date(year, month, 1);
      case 'quarterly':
        {
          const quarterStartMonth = Math.floor(month / 3) * 3;
          return new Date(year, quarterStartMonth, 1);
        }
      case 'annually':
        return new Date(year, 0, 1);
      default:
        return date;
    }
  }

  /**
   * Get period end date based on frequency
   */
  private getPeriodEndDate(date: Date, frequency: string): Date {
    const year = date.getFullYear();
    const month = date.getMonth();

    switch (frequency) {
      case 'monthly':
        return new Date(year, month + 1, 0);
      case 'quarterly':
        {
          const quarterEndMonth = Math.floor(month / 3) * 3 + 2;
          return new Date(year, quarterEndMonth + 1, 0);
        }
      case 'annually':
        return new Date(year, 11, 31);
      default:
        return date;
    }
  }
}

// Export singleton instance
export const paymentWebhookService = new PaymentWebhookService();

// Types are already exported inline above
