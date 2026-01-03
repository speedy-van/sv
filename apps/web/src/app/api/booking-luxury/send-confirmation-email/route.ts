import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { unifiedEmailService, OrderConfirmationData } from '@/lib/email/UnifiedEmailService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Send booking confirmation email
 * This is a backup endpoint for sending confirmation emails when webhooks fail or in test mode
 */
export async function POST(request: NextRequest) {
  try {
    const { bookingId, sessionId } = await request.json();

    console.log('📧 [CONFIRMATION EMAIL] Request received:', { bookingId, sessionId });

    if (!bookingId && !sessionId) {
      return NextResponse.json(
        { error: 'Either bookingId or sessionId is required' },
        { status: 400 }
      );
    }

    // Get Stripe session if sessionId provided
    let stripePaymentIntentId: string | undefined;
    let clientReferenceId: string | undefined;
    if (sessionId && !bookingId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        stripePaymentIntentId = session.payment_intent;
        clientReferenceId = session.client_reference_id;
        console.log('📧 [CONFIRMATION EMAIL] Stripe session retrieved:', {
          sessionId,
          paymentIntentId: stripePaymentIntentId,
          clientReferenceId,
          metadata: session.metadata,
        });
      } catch (stripeError) {
        console.error('❌ Failed to retrieve Stripe session:', stripeError);
      }
    }

    // Define the correct include relations based on Prisma schema
    const bookingInclude = {
      BookingAddress_Booking_pickupAddressIdToBookingAddress: true,
      BookingAddress_Booking_dropoffAddressIdToBookingAddress: true,
      PropertyDetails_Booking_pickupPropertyIdToPropertyDetails: true,
      PropertyDetails_Booking_dropoffPropertyIdToPropertyDetails: true,
      BookingItem: true,
    };

    // Find booking by ID, payment intent, or client reference
    let booking;
    if (bookingId) {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: bookingInclude,
      });
    } else if (stripePaymentIntentId) {
      // Find booking by Stripe payment intent ID
      booking = await prisma.booking.findUnique({
        where: { stripePaymentIntentId },
        include: bookingInclude,
      });
      
      // If not found by payment intent, try by client_reference_id
      if (!booking && clientReferenceId) {
        console.log('📧 [CONFIRMATION EMAIL] Trying client_reference_id as booking reference:', clientReferenceId);
        // First try as booking ID
        booking = await prisma.booking.findUnique({
          where: { id: clientReferenceId },
          include: bookingInclude,
        });
        
        // If not found, try as booking reference (SV-XXXXXX format)
        if (!booking) {
          console.log('📧 [CONFIRMATION EMAIL] Trying as booking reference:', clientReferenceId);
          booking = await prisma.booking.findUnique({
            where: { reference: clientReferenceId },
            include: bookingInclude,
          });
        }
      }
    }

    if (!booking) {
      console.error('❌ Booking not found:', { bookingId, sessionId, stripePaymentIntentId, clientReferenceId });
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log('📧 [CONFIRMATION EMAIL] Booking found:', {
      id: booking.id,
      reference: booking.reference,
      email: booking.customerEmail,
      status: booking.status,
    });

    // Check if booking is completed (don't enforce CONFIRMED status as it might be COMPLETED)
    if (booking.status === 'DRAFT' || booking.status === 'CANCELLED') {
      console.warn('⚠️ Booking not in valid state for confirmation email:', {
        id: booking.id,
        status: booking.status,
      });
      return NextResponse.json(
        { error: 'Booking is not in valid state', status: booking.status },
        { status: 400 }
      );
    }

    // Prepare email data - use the correct relation names
    const pickupAddress = (booking as any).BookingAddress_Booking_pickupAddressIdToBookingAddress;
    const dropoffAddress = (booking as any).BookingAddress_Booking_dropoffAddressIdToBookingAddress;
    
    const confirmedTotalInPounds = booking.totalGBP / 100;
    const emailData: OrderConfirmationData = {
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      orderNumber: booking.reference,
      pickupAddress: pickupAddress?.label || 'Address not specified',
      dropoffAddress: dropoffAddress?.label || 'Address not specified',
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
          address: pickupAddress?.label || 'Address not specified',
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
      console.log('✅ Invoice PDF generated');
    } catch (pdfError) {
      console.error('❌ Failed to generate invoice PDF:', pdfError);
      // Continue without PDF
    }

    // Send confirmation email with invoice attached
    console.log('📧 [CONFIRMATION EMAIL] Sending email to:', emailData.customerEmail);
    const emailResult = await unifiedEmailService.sendOrderConfirmation(emailData, invoicePDF);
    console.log('📧 [CONFIRMATION EMAIL] Email result:', emailResult);

    if (emailResult.success) {
      console.log('✅ Order confirmation email sent successfully:', {
        orderRef: booking.reference,
        email: booking.customerEmail,
        provider: emailResult.provider,
        messageId: emailResult.messageId,
      });

      return NextResponse.json({
        success: true,
        message: 'Confirmation email sent successfully',
        provider: emailResult.provider,
        messageId: emailResult.messageId,
      });
    } else {
      console.error('❌ Failed to send confirmation email:', emailResult.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: emailResult.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Error in confirmation email endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
