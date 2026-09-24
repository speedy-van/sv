import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { createUniqueReference } from '@/lib/ref';
import { prisma } from '@/lib/prisma';
import { CHECKOUT_PAYMENT_METHOD_TYPES } from '@/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  poundsToPence,
  validateBookingAmount, 
  convertBookingAmountsToPence
} from '@/lib/utils/currency';
import { PropertyType } from '@prisma/client';

// Force dynamic rendering (uses headers/cookies/getServerSession)
export const dynamic = 'force-dynamic';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// Flexible booking data schema that matches frontend structure
const flexibleBookingDataSchema = z.object({
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
  }),
  pickupAddress: z.object({
    address: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  dropoffAddress: z.object({
    address: z.string().optional(),
    street: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().optional(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number(),
    requiresTwoPerson: z.boolean().optional(),
    isFragile: z.boolean().optional(),
    requiresDisassembly: z.boolean().optional(),
    category: z.string().optional(),
    volumeFactor: z.number().optional(),
  })).optional(),
  pricing: z.object({
    subtotal: z.number().optional(),
    vat: z.number().optional(),
    total: z.number(),
    currency: z.string().optional(),
    distance: z.number().optional(),
    distanceFee: z.number().optional(),
    volumeFee: z.number().optional(),
  }).optional(),
  pickupDetails: z.object({
    type: z.string().optional(),
    floors: z.number().optional(),
    hasLift: z.boolean().optional(),
    hasParking: z.boolean().optional(),
    accessNotes: z.string().optional(),
    requiresPermit: z.boolean().optional(),
  }).optional(),
  dropoffDetails: z.object({
    type: z.string().optional(),
    floors: z.number().optional(),
    hasLift: z.boolean().optional(),
    hasParking: z.boolean().optional(),
    accessNotes: z.string().optional(),
    requiresPermit: z.boolean().optional(),
  }).optional(),
  serviceType: z.string().optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  pickupDate: z.string().optional(),
  scheduledFor: z.string().optional(),
  pickupTimeSlot: z.string().optional(),
  urgency: z.string().optional(),
  notes: z.string().optional(),
  bookingId: z.string().optional(),
  promotionCode: z.string().optional(),
  promotionDetails: z.object({
    id: z.string().optional(),
    code: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(['percentage', 'fixed']).optional(),
    value: z.number().optional(),
    discountAmount: z.number().optional(),
    originalAmount: z.number().optional(),
    finalAmount: z.number().optional(),
  }).optional(),
}).passthrough(); // Allow additional fields

// Request validation schema
const createCheckoutSessionSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('gbp'),
  customerEmail: z.string().email(),
  customerName: z.string(),
  bookingData: flexibleBookingDataSchema,
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// Property type mapping
const mapPropertyTypeToPrisma = (frontendType: any): PropertyType => {
  const formMapping: Record<string, PropertyType> = {
    'house': 'DETACHED',
    'apartment': 'FLAT',
    'office': 'FLAT',
    'warehouse': 'FLAT',
    'other': 'DETACHED'
  };

  if (Object.values(PropertyType).includes(frontendType as any)) {
    return frontendType as PropertyType;
  }

  const result = formMapping[frontendType as string];
  if (result) return result;

  console.warn(`⚠️ Unknown property type "${frontendType}" - defaulting to DETACHED`);
  return 'DETACHED';
};

const resolveFlatNumber = (address: any): string | undefined => {
  const candidates = [
    address?.flatNumber,
    address?.formatted?.flatNumber,
    address?.buildingDetails?.flatNumber,
    address?.buildingDetails?.apartmentNumber,
    address?.line2,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().length > 0) {
      if (/^flat\s+/i.test(value)) {
        const trimmed = value.trim().replace(/^flat\s+/i, '').trim();
        return trimmed.length > 0 ? trimmed : value.trim();
      }
      return value.trim();
    }
  }

  return undefined;
};

const resolveFloorNumber = (address: any): string | undefined => {
  const candidates = [
    address?.buildingDetails?.floorNumber,
    address?.formatted?.floor,
    address?.floorNumber,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    if (typeof value === 'number' && !Number.isNaN(value) && value > 0) {
      return String(value);
    }
  }

  return undefined;
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Creating Stripe checkout session...');

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createCheckoutSessionSchema.safeParse(body);

    if (!validationResult.success) {
      console.error('❌ Invalid request data:', validationResult.error.issues);
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const {
      amount,
      currency,
      customerEmail,
      customerName,
      bookingData,
      successUrl,
      cancelUrl
    } = validationResult.data;

    // Initialize booking reference

    // Validate and convert amount to pence for Stripe
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Ensure amount is a number with at most 2 decimal places
    if (amount !== Math.round(amount * 100) / 100) {
      throw new Error('Amount cannot have more than 2 decimal places');
    }

    // Convert pounds to pence for Stripe
    const amountInPence = Math.round(amount * 100);
    
    // Validate the conversion
    if (amountInPence <= 0 || !Number.isInteger(amountInPence)) {
      console.error('❌ Invalid amount conversion:', {
        originalAmount: amount,
        convertedAmount: amountInPence
      });
      throw new Error('Invalid amount conversion');
    }
    
    // Enforce pickup date within 7 days before creating/updating booking
    const scheduledDate = bookingData.pickupDate ? new Date(bookingData.pickupDate) :
                           bookingData.scheduledFor ? new Date(bookingData.scheduledFor) : new Date();
    const daysUntilPickup = Math.ceil((scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const isFarBooking = daysUntilPickup > 7;

    if (isFarBooking) {
      return NextResponse.json(
        {
          error: 'Pickup date must be within 7 days to proceed with payment.',
          details: 'Please choose a date within the next 7 days.',
        },
        { status: 400 }
      );
    }

    // Create unique booking reference for this session
    // Check if this is for an existing booking (from luxury booking flow)
    let existingBooking = null;
    let bookingReference = '';
    
    // First, check if a reference was provided from the frontend (from draft)
    const providedReference = (bookingData as any).bookingReference;
    if (providedReference && typeof providedReference === 'string' && providedReference.trim()) {
      bookingReference = providedReference.trim();
      console.log('✅ Using provided booking reference from frontend:', bookingReference);
    }
    
    if (bookingData.bookingId) {
      // This is for an existing booking - fetch it instead of creating a new one
      try {
        existingBooking = await prisma.booking.findUnique({
          where: { id: bookingData.bookingId },
        });
        
        if (existingBooking) {
          // Only use existing booking reference if no reference was provided from frontend
          if (!bookingReference) {
            bookingReference = existingBooking.reference;
          }
          console.log('✅ Using existing booking reference:', bookingReference);
        } else {
          throw new Error('Existing booking not found');
        }
      } catch (error) {
        console.error('❌ Failed to fetch existing booking:', error);
        // Fallback to creating new booking
        existingBooking = null;
      }
    }
    
    if (!existingBooking && !bookingReference) {
      // Create new booking reference only if not provided
      try {
        bookingReference = await createUniqueReference('booking');
        console.log('✅ Generated new booking reference:', bookingReference);
      } catch (refError) {
        console.error('❌ Failed to generate unique reference:', refError);
        // Fallback to timestamp-based reference if database fails
        bookingReference = `SV-${Date.now().toString(36).toUpperCase().slice(-6)}`;
        console.log('⚠️ Using fallback reference:', bookingReference);
      }
    }

    console.log('💰 Creating session for:', {
      amountPounds: `£${amount}`,
      amountPence: amountInPence,
      conversionCheck: `£${(amountInPence / 100).toFixed(2)}`,
      customerEmail,
      customerName,
      bookingReference,
    });

    // Handle booking creation or update
    let booking;
    
    // First check if booking already exists by reference (created by /api/booking-luxury)
    if (!existingBooking && bookingReference) {
      try {
        existingBooking = await prisma.booking.findUnique({
          where: { reference: bookingReference },
        });
        if (existingBooking) {
          console.log('✅ Found existing booking by reference:', bookingReference);
        }
      } catch (err) {
        console.warn('⚠️ Could not check for existing booking by reference:', err);
      }
    }
    
    if (existingBooking) {
      // Update status only — do NOT overwrite totalGBP, which was set by /api/booking-luxury
      booking = await prisma.booking.update({
        where: { id: existingBooking.id },
        data: { status: 'PENDING_PAYMENT' },
      });
    } else {
      // Phase 0: bookings must be pre-created via /api/booking-luxury, which sets
      // totalGBP from the server-resolved quote. A fallback path here would let a
      // client-supplied amount reach the database (HARD RULE violation).
      return NextResponse.json(
        { error: 'Booking not found. Please restart the booking flow.' },
        { status: 422 }
      );
    }

    const defaultSuccessUrl = `${request.nextUrl.origin}/booking-luxury/success?session_id={CHECKOUT_SESSION_ID}&booking_ref=${bookingReference}`;
    const resolvedSuccessUrl: string = (() => {
      const baseUrl = successUrl || defaultSuccessUrl;

      try {
        const url = new URL(baseUrl, request.nextUrl.origin);

        if (!url.searchParams.get('booking_ref')) {
          url.searchParams.set('booking_ref', bookingReference);
        }

        if (!url.searchParams.get('session_id')) {
          url.searchParams.set('session_id', '{CHECKOUT_SESSION_ID}');
        }

        return url.toString();
      } catch {
        return defaultSuccessUrl;
      }
    })();

    console.log('🔗 [CHECKOUT DEBUG] Creating Stripe checkout session with URLs:');
    console.log('🔗 [CHECKOUT DEBUG] Success URL:', resolvedSuccessUrl);
    console.log('🔗 [CHECKOUT DEBUG] Cancel URL:', cancelUrl || `${request.nextUrl.origin}/booking-luxury?step=2&payment=cancelled`);

    console.log('📅 Booking schedule check:', {
      scheduledDate: scheduledDate.toISOString(),
      daysUntilPickup,
      isFarBooking,
      useManualCapture: true,
    });

    // NEAR BOOKING (≤7 days): Use payment mode with manual capture
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: CHECKOUT_PAYMENT_METHOD_TYPES,
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'Speedy Van Moving Service',
              description: 'Professional moving and van hire service',
              images: ['https://speedy-van.co.uk/logo.png'],
            },
            // HARD RULE: charge the server-stored amount, never the client-supplied amount
            unit_amount: booking.totalGBP || amountInPence,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: customerEmail,
      client_reference_id: bookingReference,
      metadata: {
        bookingId: booking.id,
        customerName: customerName.substring(0, 100),
        customerEmail: customerEmail.substring(0, 100),
        bookingAmount: amount.toString(),
        bookingReference: bookingReference,
        serviceType: (bookingData as any)?.serviceType || 'unknown',
        itemCount: (bookingData as any)?.items?.length?.toString() || '0',
        daysUntilPickup: daysUntilPickup.toString(),
        isFarBooking: 'false',
      },
      success_url: resolvedSuccessUrl,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/booking-luxury?step=2&payment=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['GB'],
      },
      phone_number_collection: {
        enabled: true,
      },
      custom_text: {
        submit: {
          message: 'Secure payment processed by Stripe. You will NOT be charged until a driver confirms (hold may apply).',
        },
      },
      payment_intent_data: {
        capture_method: 'manual',
        metadata: {
          bookingId: booking.id,
          bookingReference: bookingReference,
        },
      },
    };
    
    console.log('💳 Manual capture enabled for near booking:', {
      bookingId: booking.id,
      holdExpiresAtDays: 7,
    });

    const stripeSession = await stripe.checkout.sessions.create(sessionParams);

    console.log('✅ Stripe session created:', {
      sessionId: stripeSession.id,
      sessionUrl: stripeSession.url,
      captureMethod: 'manual',
    });

    return NextResponse.json({
      success: true,
      sessionId: stripeSession.id,
      sessionUrl: stripeSession.url,
      expiresAt: stripeSession.expires_at,
      bookingId: booking.id,
      bookingReference: booking.reference,
    });

  } catch (error) {
    console.error('❌ Stripe session creation failed:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
      errorType: error instanceof Stripe.errors.StripeError ? 'stripe_error' : 'server_error',
    });
    
    let errorMessage = 'Failed to create checkout session';
    let statusCode = 500;

    if (error instanceof Stripe.errors.StripeError) {
      errorMessage = `Stripe error: ${error.message}`;
      statusCode = error.statusCode || 500;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      // Check if it's a reference generation error
      if (error.message.includes('Could not generate unique reference')) {
        errorMessage = 'Database connectivity issue. Please try again.';
        statusCode = 503; // Service Unavailable
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        type: error instanceof Stripe.errors.StripeError ? 'stripe_error' : 'server_error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: statusCode }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}