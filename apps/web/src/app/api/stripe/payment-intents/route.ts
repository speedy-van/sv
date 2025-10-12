/**
 * STRIPE PAYMENT INTENTS API - PRODUCTION GRADE
 * 
 * Create and manage Payment Intents for bookings.
 * 
 * Features:
 * - Payment Intent creation with GBP currency
 * - Automatic confirmation and capture
 * - Idempotency key handling
 * - Customer association
 * - Comprehensive metadata
 * - Structured logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  createPaymentIntent, 
  retrievePaymentIntent, 
  confirmPaymentIntent,
  cancelPaymentIntent,
  generateIdempotencyKey,
  formatGbpMinor
} from '@/lib/stripe/client';
import { createRequestId } from '@/lib/pricing/schemas';

// Request schemas
const CreatePaymentIntentRequestSchema = z.object({
  amountGbpMinor: z.number().int().min(50).max(100000000), // 50p to £1M
  description: z.string().min(1).max(500),
  bookingId: z.string().min(1),
  customerId: z.string().optional(),
  customerEmail: z.string().email().optional(),
  metadata: z.object({
    bookingId: z.string(),
    serviceName: z.string().optional(),
    pickupAddress: z.string().optional(),
    dropoffAddress: z.string().optional(),
    scheduledDate: z.string().optional()
  }),
  setupFutureUsage: z.enum(['on_session', 'off_session']).optional(),
  generateIdempotencyKey: z.boolean().default(true)
});

const ConfirmPaymentIntentRequestSchema = z.object({
  paymentIntentId: z.string().min(1),
  paymentMethodId: z.string().optional()
});

const CancelPaymentIntentRequestSchema = z.object({
  paymentIntentId: z.string().min(1),
  reason: z.string().optional()
});

/**
 * POST /api/stripe/payment-intents
 * Create a new Payment Intent
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = `PI-CREATE-${createRequestId()}`;
  const startTime = Date.now();

  console.log(`[PAYMENT INTENT API] ${correlationId} - Create request received`);

  try {
    const body = await request.json();
    
    // Validate request
    const validationResult = CreatePaymentIntentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.issues,
        correlationId
      }, { status: 400 });
    }

    const {
      amountGbpMinor,
      description,
      bookingId,
      customerId,
      customerEmail,
      metadata,
      setupFutureUsage,
      generateIdempotencyKey: shouldGenerateIdempotencyKey
    } = validationResult.data;

    console.log(`[PAYMENT INTENT API] ${correlationId} - Creating Payment Intent`, {
      amountGbpMinor,
      amountGbpFormatted: formatGbpMinor(amountGbpMinor),
      bookingId,
      hasCustomerId: !!customerId,
      hasCustomerEmail: !!customerEmail
    });

    // Generate idempotency key if requested
    const idempotencyKey = shouldGenerateIdempotencyKey 
      ? generateIdempotencyKey(`booking_${bookingId}`)
      : undefined;

    // Create Payment Intent
    const paymentIntent = await createPaymentIntent({
      amountGbpMinor,
      automaticPaymentMethods: true,
      captureMethod: 'manual',
      description,
      customerId,
      metadata: {
        correlationId: correlationId,
        customerEmail: customerEmail || '',
        ...Object.fromEntries(
          Object.entries(metadata).map(([key, value]) => [key, String(value)])
        )
      },
      setupFutureUsage,
      idempotencyKey
    }, correlationId);

    const processingTime = Date.now() - startTime;

    console.log(`[PAYMENT INTENT API] ${correlationId} - Payment Intent created successfully`, {
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      processingTimeMs: processingTime
    });

    return NextResponse.json({
      success: true,
      data: {
        ...paymentIntent,
        idempotencyKey: idempotencyKey || null,
        amountGbpFormatted: formatGbpMinor(paymentIntent.amountGbpMinor)
      },
      metadata: {
        correlationId,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error(`[PAYMENT INTENT API] ${correlationId} - Creation failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTimeMs: processingTime
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to create Payment Intent',
      message: error instanceof Error ? error.message : 'Unknown error',
      correlationId
    }, { status: 500 });
  }
}

/**
 * GET /api/stripe/payment-intents?id=pi_xxx
 * Retrieve a Payment Intent by ID
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const correlationId = `PI-GET-${createRequestId()}`;
  const startTime = Date.now();

  console.log(`[PAYMENT INTENT API] ${correlationId} - Retrieve request received`);

  try {
    const { searchParams } = new URL(request.url);
    const paymentIntentId = searchParams.get('id');

    if (!paymentIntentId) {
      return NextResponse.json({
        success: false,
        error: 'Payment Intent ID is required',
        correlationId
      }, { status: 400 });
    }

    console.log(`[PAYMENT INTENT API] ${correlationId} - Retrieving Payment Intent`, {
      paymentIntentId
    });

    const paymentIntent = await retrievePaymentIntent(paymentIntentId, correlationId);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        ...paymentIntent,
        amountGbpFormatted: formatGbpMinor(paymentIntent.amountGbpMinor)
      },
      metadata: {
        correlationId,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error(`[PAYMENT INTENT API] ${correlationId} - Retrieval failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: processingTime
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve Payment Intent',
      message: error instanceof Error ? error.message : 'Unknown error',
      correlationId
    }, { status: 500 });
  }
}

/**
 * PUT /api/stripe/payment-intents
 * Confirm a Payment Intent
 */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  const correlationId = `PI-CONFIRM-${createRequestId()}`;
  const startTime = Date.now();

  console.log(`[PAYMENT INTENT API] ${correlationId} - Confirm request received`);

  try {
    const body = await request.json();
    
    // Validate request
    const validationResult = ConfirmPaymentIntentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.issues,
        correlationId
      }, { status: 400 });
    }

    const { paymentIntentId, paymentMethodId } = validationResult.data;

    console.log(`[PAYMENT INTENT API] ${correlationId} - Confirming Payment Intent`, {
      paymentIntentId,
      hasPaymentMethod: !!paymentMethodId
    });

    const paymentIntent = await confirmPaymentIntent(
      paymentIntentId,
      paymentMethodId,
      correlationId
    );

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        ...paymentIntent,
        amountGbpFormatted: formatGbpMinor(paymentIntent.amountGbpMinor)
      },
      metadata: {
        correlationId,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error(`[PAYMENT INTENT API] ${correlationId} - Confirmation failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: processingTime
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to confirm Payment Intent',
      message: error instanceof Error ? error.message : 'Unknown error',
      correlationId
    }, { status: 500 });
  }
}

/**
 * DELETE /api/stripe/payment-intents
 * Cancel a Payment Intent
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const correlationId = `PI-CANCEL-${createRequestId()}`;
  const startTime = Date.now();

  console.log(`[PAYMENT INTENT API] ${correlationId} - Cancel request received`);

  try {
    const body = await request.json();
    
    // Validate request
    const validationResult = CancelPaymentIntentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.issues,
        correlationId
      }, { status: 400 });
    }

    const { paymentIntentId, reason } = validationResult.data;

    console.log(`[PAYMENT INTENT API] ${correlationId} - Cancelling Payment Intent`, {
      paymentIntentId,
      reason
    });

    const paymentIntent = await cancelPaymentIntent(
      paymentIntentId,
      reason,
      correlationId
    );

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        ...paymentIntent,
        amountGbpFormatted: formatGbpMinor(paymentIntent.amountGbpMinor)
      },
      metadata: {
        correlationId,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error(`[PAYMENT INTENT API] ${correlationId} - Cancellation failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs: processingTime
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to cancel Payment Intent',
      message: error instanceof Error ? error.message : 'Unknown error',
      correlationId
    }, { status: 500 });
  }
}