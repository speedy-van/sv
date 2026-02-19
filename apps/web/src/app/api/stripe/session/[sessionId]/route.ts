import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    console.log('🔍 Fetching Stripe session:', sessionId);

    if (!sessionId || !sessionId.startsWith('cs_')) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    const bookingRefFromQuery = request.nextUrl.searchParams.get('booking_ref') || undefined;
    const referrer = request.headers.get('referer');
    let bookingRefFromReferrer: string | undefined;

    if (referrer) {
      try {
        bookingRefFromReferrer = new URL(referrer).searchParams.get('booking_ref') || undefined;
      } catch {
        bookingRefFromReferrer = undefined;
      }
    }

    // Retrieve the session from Stripe (expand payment intent only)
    const stripe = getStripe();
    let session: Awaited<ReturnType<typeof stripe.checkout.sessions.retrieve>> | null = null;
    let stripeError: unknown = null;

    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent'],
      });
    } catch (error) {
      stripeError = error;
    }

    if (!session && stripeError) {
      console.warn('⚠️ Stripe session retrieval failed, attempting booking fallback:', stripeError);
    }

    if (!session && !stripeError) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const paymentIntentId = session
      ? typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id
      : null;
    const paymentIntentStatus = session
      ? typeof session.payment_intent === 'string'
        ? null
        : session.payment_intent?.status || null
      : null;

    const bookingId = session?.metadata?.bookingId || undefined;
    const bookingReference = session?.metadata?.bookingReference
      || session?.client_reference_id
      || bookingRefFromQuery
      || bookingRefFromReferrer
      || undefined;

    const booking = bookingId
      ? await prisma.booking.findUnique({
          where: { id: bookingId },
          select: {
            id: true,
            reference: true,
            status: true,
            paidAt: true,
            stripePaymentIntentId: true,
            scheduledAt: true,
            totalGBP: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
          },
        })
      : bookingReference
        ? await prisma.booking.findFirst({
            where: { reference: bookingReference },
            select: {
              id: true,
              reference: true,
              status: true,
              paidAt: true,
              stripePaymentIntentId: true,
              scheduledAt: true,
              totalGBP: true,
              customerName: true,
              customerEmail: true,
              customerPhone: true,
            },
          })
        : null;

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found for this session.' },
        { status: 404 }
      );
    }

    if (session) {
      console.log('✅ Session retrieved:', {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status,
        payment_intent: paymentIntentId,
        metadata: session.metadata,
        bookingFound: !!booking,
      });
    }

    // Return session data (only safe fields)
    return NextResponse.json({
      sessionId: session?.id || sessionId,
      mode: session?.mode || null,
      payment_status: session?.payment_status || null,
      payment_intent: paymentIntentId,
      payment_intent_status: paymentIntentStatus,
      amount_total: session?.amount_total || null,
      stripeUnavailable: !!stripeError && !session,
      booking: {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        paymentCaptured: !!booking.paidAt,
        paymentCapturedAt: booking.paidAt,
        stripePaymentIntentId: booking.stripePaymentIntentId,
        scheduledDate: booking.scheduledAt,
        pickupDate: booking.scheduledAt,
        totalGBP: booking.totalGBP,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        customerPhone: booking.customerPhone,
      },
    });

  } catch (error) {
    console.error('❌ Error fetching Stripe session:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to fetch session details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
