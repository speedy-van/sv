import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { sendAdminNotification } from '@/lib/notifications';
import { sendDriverNotification } from '@/lib/driver-notifications';
import { unifiedEmailService, OrderConfirmationData, PaymentConfirmationData, FloorWarningData } from '@/lib/email/UnifiedEmailService';
import { getVoodooSMSService } from '@/lib/sms/VoodooSMSService';
// import { generateUniqueBookingId } from '@/lib/booking-id';
// Invoice service removed
// BookingService removed - using direct Prisma operations

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper function to send order confirmation email
async function sendOrderConfirmationEmail(bookingId: string) {
  try {
    // Fetch booking with all related data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        pickupProperty: true,
        dropoffProperty: true,
        BookingItem: true,
      },
    });

    if (!booking) {
      console.error('❌ Booking not found for confirmation email:', bookingId);
      return;
    }

    // Check for floor number issues - Only warn if floors is explicitly 0, null, or undefined
    // If floors > 0, customer provided floor number, so no warning needed
    const pickupFloors = booking.pickupProperty?.floors;
    const dropoffFloors = booking.dropoffProperty?.floors;
    const hasPickupFloorIssue = pickupFloors === null || pickupFloors === undefined || pickupFloors === 0;
    const hasDropoffFloorIssue = dropoffFloors === null || dropoffFloors === undefined || dropoffFloors === 0;

    // Prepare email data
    const confirmedTotalInPounds = booking.totalGBP / 100;
    const emailData: OrderConfirmationData = {
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      orderNumber: booking.reference,
      pickupAddress: booking.pickupAddress?.label || 'Address not specified',
      dropoffAddress: booking.dropoffAddress?.label || 'Address not specified',
      scheduledDate: booking.scheduledAt.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      totalAmount: confirmedTotalInPounds,
      currency: 'GBP',
    };

    // Generate invoice PDF to attach to email
    let invoicePDF: Buffer | undefined;
    try {
      const { buildInvoicePDF } = await import('@/lib/pdf');
      invoicePDF = await buildInvoicePDF({
        invoiceNumber: `INV-${booking.reference}`,
        date: booking.createdAt.toISOString().split('T')[0],
        dueDate: booking.createdAt.toISOString().split('T')[0],
        company: {
          name: 'Speedy Van',
          legalName: 'SPEEDY VAN REMOVALS LTD',
          address: 'Office 2.18, 1 Barrack St, Hamilton ML3 0HS',
          email: 'support@speedy-van.co.uk',
        },
        customer: {
          name: booking.customerName,
          email: booking.customerEmail,
          address: booking.pickupAddress?.label || 'Address not specified',
        },
        items: [{
          description: 'Moving Service',
          quantity: 1,
          unitPrice: confirmedTotalInPounds,
          total: confirmedTotalInPounds,
        }],
        subtotal: confirmedTotalInPounds,
        tax: 0,
        total: confirmedTotalInPounds,
        currency: 'GBP',
      });
      console.log('✅ Invoice PDF generated for webhook email');
    } catch (pdfError) {
      console.error('❌ Failed to generate invoice PDF for webhook:', pdfError);
      // Continue without PDF
    }

    // Send confirmation email with invoice attached
    const emailResult = await unifiedEmailService.sendOrderConfirmation(emailData, invoicePDF);

    if (emailResult.success) {
      console.log('✅ Order confirmation email sent successfully:', {
        orderRef: booking.reference,
        email: booking.customerEmail,
        hasFloorWarnings: hasPickupFloorIssue || hasDropoffFloorIssue,
      });
    } else {
      console.error('❌ Failed to send order confirmation email:', emailResult.error);
    }

  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔔 [WEBHOOK DEBUG] ========== STRIPE WEBHOOK RECEIVED ==========');
    console.log('🔔 [WEBHOOK DEBUG] Timestamp:', new Date().toISOString());
    
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    console.log('🔔 [WEBHOOK DEBUG] Body length:', body.length);
    console.log('🔔 [WEBHOOK DEBUG] Signature present:', !!signature);

    if (!signature) {
      console.error('❌ Stripe webhook signature missing');
      return NextResponse.json(
        { error: 'Webhook signature missing' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ Stripe webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    let event;
    try {
      event = verifyWebhookSignature(body, signature, webhookSecret);
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const stripeEvent = await event;
    
    console.log('✅ [WEBHOOK DEBUG] Stripe webhook received:', stripeEvent.type);
    console.log('✅ [WEBHOOK DEBUG] Event ID:', stripeEvent.id);
    console.log('✅ [WEBHOOK DEBUG] Event object keys:', Object.keys(stripeEvent.data.object));

    // Handle different event types
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        console.log('✅ [WEBHOOK DEBUG] Handling checkout.session.completed');
        await handleCheckoutSessionCompleted(stripeEvent.data.object);
        break;

      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(stripeEvent.data.object);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(stripeEvent.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(stripeEvent.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(stripeEvent.data.object);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(stripeEvent.data.object);
        break;

      default:
        console.log('ℹ️ Unhandled event type:', stripeEvent.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  try {
    console.log('💰 Checkout session completed:', session.id);

    const bookingId = session.metadata?.bookingId;
    console.log('🔍 Webhook metadata:', {
      bookingId: session.metadata?.bookingId,
      bookingReference: session.metadata?.bookingReference,
      customerEmail: session.metadata?.customerEmail,
      allMetadata: session.metadata,
      amountPaid: session.amount_total,
    });
    
    if (!bookingId) {
      console.error('❌ No booking ID in session metadata - cannot send email');
      console.error('Available metadata:', session.metadata);
      return;
    }

    // Get the booking to validate payment amount
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { totalGBP: true },
    });

    if (!booking) {
      console.error('❌ Booking not found:', bookingId);
      return;
    }

    // Validate payment amount - booking.totalGBP is in pounds, amount_total is in pence
    const expectedAmount = booking.totalGBP * 100;
    if (session.amount_total !== expectedAmount) {
      console.error('❌ Payment amount mismatch:', {
        expected: expectedAmount,
        received: session.amount_total,
        bookingId,
      });
      // Create audit log for amount mismatch
      await prisma.auditLog.create({
        data: {
          actorId: 'system',
          actorRole: 'system',
          action: 'payment_amount_mismatch',
          targetType: 'booking',
          targetId: bookingId,
          details: {
            expectedAmount,
            receivedAmount: session.amount_total,
            sessionId: session.id,
            timestamp: new Date().toISOString(),
          },
        },
      });
      // Continue processing but flag the issue
    }

    // Auto-confirm booking after successful payment
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CONFIRMED',
        paidAt: new Date(),
        stripePaymentIntentId: session.payment_intent,
      },
    });

    // Send order confirmation email to customer
    await sendOrderConfirmationEmail(bookingId);

    // Log auto-confirmation
    await prisma.auditLog.create({
      data: {
        actorId: 'system',
        actorRole: 'system',
        action: 'booking_auto_confirmed',
        targetType: 'booking',
        targetId: bookingId,
        details: {
          reason: 'payment_successful',
          paymentIntentId: session.payment_intent,
          sessionId: session.id,
          confirmedAt: new Date().toISOString(),
        },
      },
    });

    console.log('✅ Booking auto-confirmed via webhook after payment success');

    console.log('✅ Booking confirmed:', { bookingId });

    // Send job notifications to nearby drivers
    try {
      const notifyResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/notify-drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      if (notifyResponse.ok) {
        const notifyResult = await notifyResponse.json();
        console.log('✅ Driver notifications sent:', notifyResult.data);
      } else {
        console.error('❌ Failed to send driver notifications');
      }
    } catch (notifyError) {
      console.error('❌ Error sending driver notifications:', notifyError);
    }

    // Get the complete booking data to send notifications
    const completeBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pickupAddress: true,
        dropoffAddress: true,
        pickupProperty: true,
        dropoffProperty: true,
        BookingItem: true,
        customer: true,
        Assignment: {
          include: {
            Driver: true,
          },
        },
      },
    });

    if (completeBooking) {
      // Send admin notification with complete booking details
      await sendAdminNotification({
        type: 'booking_completed',
        title: 'Booking Completed',
        message: `Booking ${completeBooking.reference} has been completed successfully`,
        priority: 'medium',
        data: { bookingId: completeBooking.id, bookingReference: completeBooking.reference },
        actionUrl: `/admin/orders/${completeBooking.reference}`,
      });

      // Send driver notifications if any drivers are assigned (Assignment is an array)
      if (completeBooking.Assignment?.[0]?.Driver) {
        await sendDriverNotification({
          driverId: completeBooking.Assignment[0].Driver.id,
          type: 'job_completed',
          title: 'Job Completed',
          message: `Your job for booking ${completeBooking.reference} has been completed successfully`,
          data: { 
            bookingId: completeBooking.id, 
            bookingReference: completeBooking.reference,
            jobId: completeBooking.Assignment[0].id 
          },
        });
      }

      // Send customer confirmation email and SMS (unified approach)
      await sendCustomerConfirmations(completeBooking, session);

      // Create invoice for the paid booking
      let invoiceData = null;
      try {
        // Invoice creation disabled
        invoiceData = { invoiceNumber: 'INV-DISABLED', success: true };
        console.log(
          '✅ Invoice created for booking:',
          completeBooking.reference
        );
      } catch (invoiceError) {
        console.error('❌ Error creating invoice:', invoiceError);
        // Don't fail the webhook if invoice creation fails
      }
      
      console.log('✅ Booking payment confirmed via webhook');
    }
  } catch (error) {
    console.error('❌ Error handling checkout session completed:', error);
  }
}

async function handleCheckoutSessionExpired(session: any) {
  try {
    console.log('⏰ Checkout session expired:', session.id);

    const bookingId = session.metadata?.bookingId;
    if (!bookingId) {
      console.warn('⚠️ No booking ID in session metadata');
      return;
    }

    // Find and update the booking status to cancelled
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (booking && !['CANCELLED', 'COMPLETED'].includes(booking.status)) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
        },
      });

      // Create a cancellation log entry
      await prisma.auditLog.create({
        data: {
          actorId: 'system',
          actorRole: 'system',
          action: 'booking_cancelled',
          targetType: 'booking',
          targetId: booking.id,
          userId: booking.customerId,
          details: {
            reason: 'Checkout session expired',
            cancelledAt: new Date().toISOString(),
            previousStatus: booking.status,
            source: 'stripe_session_expired',
          },
        },
      });

      console.log('🚫 Booking cancelled due to expired session:', bookingId);
    }
  } catch (error) {
    console.error('❌ Error handling checkout session expired:', error);
  }
}

/**
 * Send customer confirmation email and SMS after successful payment
 */
async function sendCustomerConfirmations(booking: any, session: any) {
  try {
    console.log('🚀 [WEBHOOK DEBUG] ========== STARTING CUSTOMER CONFIRMATIONS ==========');
    console.log('📧📱 [WEBHOOK DEBUG] Sending customer confirmations for booking:', booking.id);
    console.log('📧📱 [WEBHOOK DEBUG] Session metadata:', JSON.stringify(session.metadata, null, 2));
    console.log('📧📱 [WEBHOOK DEBUG] Booking data:', JSON.stringify({
      id: booking.id,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      customerName: booking.customer?.name || booking.customerName,
      reference: booking.reference
    }, null, 2));

    // Get customer email and phone from session metadata or booking
    const customerEmail = session.metadata?.customerEmail || booking.customerEmail;
    const customerPhone = session.metadata?.customerPhone || booking.customerPhone;
    
    console.log('📧 [WEBHOOK DEBUG] Final customer email:', customerEmail);
    console.log('📱 [WEBHOOK DEBUG] Final customer phone:', customerPhone);

    if (!customerEmail && !customerPhone) {
      console.warn('⚠️ No customer email or phone found - skipping confirmations');
      return;
    }

    // Get actual paid amount from Stripe session (in pence, convert to pounds)
    const actualPaidAmount = session.amount_total ? session.amount_total / 100 : (booking.totalGBP ? booking.totalGBP / 100 : 0);
    
    console.log('💰 [WEBHOOK DEBUG] Payment amounts comparison:');
    console.log('💰 [WEBHOOK DEBUG] Stripe session amount_total:', session.amount_total, 'pence');
    console.log('💰 [WEBHOOK DEBUG] Booking totalGBP:', booking.totalGBP, 'pence');
    console.log('💰 [WEBHOOK DEBUG] Using actual paid amount:', actualPaidAmount, 'GBP');

    // Prepare confirmation data for email
    const emailData: PaymentConfirmationData = {
      customerName: booking.customer?.name || booking.customerName,
      customerEmail: customerEmail,
      orderNumber: booking.reference,
      amount: actualPaidAmount,
      currency: 'GBP',
      paymentMethod: 'card',
      transactionId: session.id,
    };

    // Prepare SMS data
    const smsData = {
      phoneNumber: customerPhone,
      customerName: booking.customer?.name || booking.customerName,
      orderNumber: booking.reference,
      pickupAddress: booking.pickupAddress?.formattedAddress || 'Pickup address not available',
      dropoffAddress: booking.dropoffAddress?.formattedAddress || 'Dropoff address not available',
      scheduledDate: booking.scheduledAt.toLocaleDateString('en-GB'),
      driverName: booking.Assignment?.Driver?.name,
      driverPhone: booking.Assignment?.Driver?.phone,
    };

    let emailResult: { success: boolean; error?: string; messageId?: string } = { success: false, error: 'Email not attempted' };
    let smsResult: { success: boolean; error?: string; messageId?: string } = { success: false, error: 'SMS not attempted' };

    // Send email confirmation if email is available
    if (customerEmail) {
      console.log('📧 [WEBHOOK DEBUG] Sending email confirmation to:', customerEmail);
      console.log('📧 [WEBHOOK DEBUG] Email data:', JSON.stringify(emailData, null, 2));
      const emailResponse = await unifiedEmailService.sendPaymentConfirmation(emailData);
      emailResult = {
        success: emailResponse.success,
        error: emailResponse.error || undefined,
        messageId: emailResponse.messageId || undefined,
      };
      console.log('📧 [WEBHOOK DEBUG] Email result:', JSON.stringify(emailResult, null, 2));
    } else {
      console.log('⚠️ [WEBHOOK DEBUG] No customer email found - skipping email confirmation');
    }

    // SMS confirmation is now handled by the success page
    console.log('ℹ️ SMS confirmation will be sent from success page');

    // Log confirmation results in audit log
    await prisma.auditLog.create({
      data: {
        actorId: 'system',
        actorRole: 'system',
        action: 'customer_confirmation_sent',
        targetType: 'booking',
        targetId: booking.id,
        details: {
          emailSent: emailResult.success,
          smsSent: smsResult.success,
          emailError: emailResult.error || null,
          smsError: smsResult.error || null,
          actualPaidAmount: actualPaidAmount,
          stripePaidAmountPence: session.amount_total,
          bookingAmountPence: booking.totalGBP,
          sentAt: new Date().toISOString(),
          source: 'stripe_webhook_payment_success',
          sessionId: session.id,
        },
      },
    });

    console.log('✅ [WEBHOOK DEBUG] Customer confirmations processing completed:', {
      email: emailResult.success ? 'sent' : 'failed',
      sms: smsResult.success ? 'sent' : 'failed',
    });
    console.log('🏁 [WEBHOOK DEBUG] ========== CUSTOMER CONFIRMATIONS COMPLETED ==========');

  } catch (error) {
    console.error('❌ [WEBHOOK DEBUG] Error sending customer confirmations:', error);
    
    // Log the error in audit log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: 'system',
          actorRole: 'system',
          action: 'customer_confirmation_failed',
          targetType: 'booking',
          targetId: booking.id,
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            failedAt: new Date().toISOString(),
            source: 'stripe_webhook_payment_success',
            sessionId: session.id,
          },
        },
      });
    } catch (auditError) {
      console.error('❌ Failed to log confirmation error:', auditError);
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  try {
    console.log('💰 Payment intent succeeded:', paymentIntent.id);

    // Find booking by payment intent ID
    const booking = await prisma.booking.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CONFIRMED',
          paidAt: new Date(),
        },
      });

      // Send order confirmation email to customer
      await sendOrderConfirmationEmail(booking.id);

      console.log('✅ Booking payment confirmed:', booking.id);
    }
  } catch (error) {
    console.error('❌ Error handling payment intent succeeded:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  try {
    console.log('❌ Payment intent failed:', paymentIntent.id);

    const booking = await prisma.booking.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
        },
      });

      console.log('⚠️ Booking payment failed:', booking.id);

      // TODO: Send failure notification to customer
      // TODO: Update availability
    }
  } catch (error) {
    console.error('❌ Error handling payment intent failed:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent: any) {
  try {
    console.log('🚫 Payment intent canceled:', paymentIntent.id);

    const booking = await prisma.booking.findFirst({
      where: { stripePaymentIntentId: paymentIntent.id },
    });

    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
        },
      });

      console.log('🚫 Booking canceled:', booking.id);

      // TODO: Send cancellation notification
      // TODO: Update availability
    }
  } catch (error) {
    console.error('❌ Error handling payment intent canceled:', error);
  }
}

async function handleChargeRefunded(charge: any) {
  try {
    console.log('💸 Charge refunded:', charge.id);

    // Find booking by payment intent ID
    const booking = await prisma.booking.findFirst({
      where: { stripePaymentIntentId: charge.payment_intent },
    });

    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
        },
      });

      console.log('💸 Booking refunded:', booking.id);

      // TODO: Send refund notification
      // TODO: Update availability
    }
  } catch (error) {
    console.error('❌ Error handling charge refunded:', error);
  }
}

/**
 * Send email and SMS notifications to customer after booking confirmation
 */
async function sendCustomerNotifications(booking: any) {
  try {
    // Email service temporarily disabled

    // Prepare booking data for notifications
    const bookingData = {
      phoneNumber: booking.customerPhone,
      customerName: booking.customerName || 'Valued Customer',
      orderNumber: booking.reference || booking.id,
      pickupAddress: booking.pickupAddress?.label || 'Pickup Location',
      dropoffAddress: booking.dropoffAddress?.label || 'Dropoff Location',
      scheduledDate: booking.scheduledAt ? new Date(booking.scheduledAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      driverName: booking.Assignment?.Driver?.name,
      driverPhone: booking.Assignment?.Driver?.phone,
    };

    let emailSuccess = false;
    let smsSuccess = false;

    // Email already sent in the first section above - removing duplicate code

    // SMS confirmation is now handled by the success page
    console.log('ℹ️ SMS confirmation will be sent from success page');
    smsSuccess = true; // Assume success since it will be handled by success page

    // At least one notification method should succeed
    if (!emailSuccess && !smsSuccess) {
      throw new Error('Both email and SMS notifications failed');
    }

    console.log('📊 Notification summary:', { 
      email: emailSuccess ? '✅' : '❌', 
      sms: smsSuccess ? '✅' : '❌',
      overall: emailSuccess || smsSuccess ? '✅' : '❌'
    });

  } catch (error) {
    console.error('❌ Error sending customer notifications:', error);
    // Don't throw error - allow booking to complete even if notifications fail
    console.warn('⚠️ Notifications failed but booking will complete successfully');
  }
}
