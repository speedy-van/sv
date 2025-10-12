/**
 * Payment processing utilities for Speedy Van
 */

import { prisma } from './prisma';
import { createPaymentIntent, retrievePaymentIntent } from './stripe';

export interface PaymentIntentData {
  bookingId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  metadata?: Record<string, string>;
}

export interface RefundData {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
  bookingId: string;
}

/**
 * Create a payment intent for a booking
 */
export async function createBookingPaymentIntent(data: PaymentIntentData) {
  const {
    bookingId,
    amount,
    currency = 'gbp',
    customerEmail,
    metadata = {},
  } = data;

  // Create payment intent with Stripe
  const paymentIntent = await createPaymentIntent(amount, currency, {
    bookingId,
    customerEmail,
    ...metadata,
  });

  // Update booking with payment intent ID
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      stripePaymentIntentId: paymentIntent.id,
      status: 'PENDING_PAYMENT',
    },
  });

  return paymentIntent;
}

/**
 * Process a successful payment
 */
export async function processSuccessfulPayment(paymentIntentId: string) {
  // Get payment intent details
    const paymentIntent = await retrievePaymentIntent(paymentIntentId);

  // Find booking by payment intent ID
  const booking = await prisma.booking.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (!booking) {
    throw new Error(`No booking found for payment intent: ${paymentIntentId}`);
  }

  // Update booking status
  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CONFIRMED',
      paidAt: new Date(),
    },
  });

  // Create payment record
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: 'stripe',
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'paid' as const,
      intentId: paymentIntentId,
    },
  });

  return updatedBooking;
}

/**
 * Process a failed payment
 */
export async function processFailedPayment(
  paymentIntentId: string,
  errorMessage?: string
) {
  // Find booking by payment intent ID
  const booking = await prisma.booking.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });

  if (!booking) {
    throw new Error(`No booking found for payment intent: ${paymentIntentId}`);
  }

  // Update booking status
  const updatedBooking = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: 'CANCELLED',
    },
  });

  // Create payment record for failed payment
  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: 'stripe',
      amount: 0, // No amount charged for failed payment
      currency: 'gbp',
      status: 'cancelled' as const,
      intentId: paymentIntentId,
    },
  });

  return updatedBooking;
}

/**
 * Process a refund for a booking
 */
export async function processRefund(data: RefundData): Promise<any> {
  const { paymentIntentId, amount, reason, bookingId } = data;

  // Create refund with Stripe
  const refund: any = await createRefund({
    paymentIntentId,
    amount,
    reason,
    bookingId,
  });

  // Find the original payment
  const originalPayment = await prisma.payment.findFirst({
    where: { intentId: paymentIntentId },
  });

  if (!originalPayment) {
    throw new Error(`No payment found for payment intent: ${paymentIntentId}`);
  }

  // Create refund record
  const refundRecord: any = await prisma.refund.create({
    data: {
      paymentId: originalPayment.id,
      amount: refund.amount,
      reason: reason || 'requested_by_customer',
      status: 'pending' as const,
    },
  });

  // Update booking status if full refund
  if (!amount || amount >= originalPayment.amount) {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  return refundRecord;
}

/**
 * Get payment history for a booking
 */
export async function getBookingPayments(bookingId: string) {
  return await prisma.payment.findMany({
    where: { bookingId },
    include: {
      Refund: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get payment summary for a booking
 */
export async function getPaymentSummary(bookingId: string) {
  const payments = await getBookingPayments(bookingId);

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalRefunded = payments
    .flatMap(p => p.Refund)
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + r.amount, 0);

  const netAmount = totalPaid - totalRefunded;

  return {
    totalPaid,
    totalRefunded,
    netAmount,
    paymentCount: payments.length,
    lastPayment: payments[0],
  };
}

/**
 * Check if a booking is fully paid
 */
export async function isBookingPaid(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { status: true, totalGBP: true },
  });

  if (!booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') {
    return true;
  }

  const summary = await getPaymentSummary(bookingId);
  return summary.netAmount >= booking.totalGBP;
}

/**
 * Calculate outstanding balance for a booking
 */
export async function getOutstandingBalance(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { totalGBP: true },
  });

  if (!booking) {
    throw new Error(`Booking not found: ${bookingId}`);
  }

  const summary = await getPaymentSummary(bookingId);
  return Math.max(0, booking.totalGBP - summary.netAmount);
}

/**
 * Create a refund for a booking (alias for processRefund)
 */
export async function createRefund(data: RefundData): Promise<any> {
  return processRefund(data);
}

/**
 * Update refund status
 */
export async function updateRefundStatus(
  refundId: string,
  status: string,
  notes?: string
) {
  return await prisma.refund.update({
    where: { id: refundId },
    data: {
      status: status as any, // Type assertion for dynamic status
      notes,
      updatedAt: new Date(),
    },
  });
}
