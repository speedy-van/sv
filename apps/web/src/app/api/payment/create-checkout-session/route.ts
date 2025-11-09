import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { createUniqueReference } from '@/lib/ref';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  poundsToPence,
  validateBookingAmount, 
  convertBookingAmountsToPence
} from '@/lib/utils/currency';
import { PropertyType } from '@prisma/client';

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
    
    // Create unique booking reference for this session
    // Check if this is for an existing booking (from luxury booking flow)
    let existingBooking = null;
    let bookingReference = '';
    
    if (bookingData.bookingId) {
      // This is for an existing booking - fetch it instead of creating a new one
      try {
        existingBooking = await prisma.booking.findUnique({
          where: { id: bookingData.bookingId },
          include: {
            pickupAddress: true,
            dropoffAddress: true,
            pickupProperty: true,
            dropoffProperty: true,
          }
        });
        
        if (existingBooking) {
          bookingReference = existingBooking.reference;
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
    
    if (!existingBooking) {
      // Create new booking reference
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
    
    if (existingBooking) {
      // Update existing booking status to PENDING_PAYMENT
      console.log('📝 Updating existing booking status...');
      booking = await prisma.booking.update({
        where: { id: existingBooking.id },
        data: { 
          status: 'PENDING_PAYMENT',
          totalGBP: amountInPence,
        }
      });
      console.log('✅ Updated existing booking:', booking.id);
    } else {
      // Create new booking in database BEFORE creating Stripe session
      console.log('📝 Creating new booking in database...');
      
      // Check if user is authenticated
      const authSession = await getServerSession(authOptions);
      const customerId = authSession?.user?.id || null;

      // Start a database transaction to ensure booking is created before Stripe session
      booking = await prisma.$transaction(async (tx) => {
        // Create pickup address
        const pickupAddress = await tx.bookingAddress.create({
          data: {
            label: bookingData.pickupAddress.address || 
                   bookingData.pickupAddress.street || 
                   'Pickup Address',
            postcode: bookingData.pickupAddress.postcode || '',
            lat: bookingData.pickupAddress.coordinates?.lat || 0,
            lng: bookingData.pickupAddress.coordinates?.lng || 0,
          },
        });

        // Create dropoff address
        const dropoffAddress = await tx.bookingAddress.create({
          data: {
            label: bookingData.dropoffAddress.address || 
                   bookingData.dropoffAddress.street || 
                   'Dropoff Address',
            postcode: bookingData.dropoffAddress.postcode || '',
            lat: bookingData.dropoffAddress.coordinates?.lat || 0,
            lng: bookingData.dropoffAddress.coordinates?.lng || 0,
          },
        });

        // Create pickup property details
        const pickupProperty = await tx.propertyDetails.create({
          data: {
            propertyType: mapPropertyTypeToPrisma(bookingData.pickupDetails?.type || 'house'),
            floors: bookingData.pickupDetails?.floors || 0,
            accessType: bookingData.pickupDetails?.hasLift ? 'WITH_LIFT' : 'WITHOUT_LIFT',
          },
        });

        // Create dropoff property details
        const dropoffProperty = await tx.propertyDetails.create({
          data: {
            propertyType: mapPropertyTypeToPrisma(bookingData.dropoffDetails?.type || 'house'),
            floors: bookingData.dropoffDetails?.floors || 0,
            accessType: bookingData.dropoffDetails?.hasLift ? 'WITH_LIFT' : 'WITHOUT_LIFT',
          },
        });

        // Create the booking
        const booking = await tx.booking.create({
          data: {
            reference: bookingReference,
            status: 'PENDING_PAYMENT',
            scheduledAt: bookingData.pickupDate ? new Date(bookingData.pickupDate) : 
                         bookingData.scheduledFor ? new Date(bookingData.scheduledFor) : new Date(),
            pickupTimeSlot: bookingData.pickupTimeSlot || null,
            urgency: bookingData.urgency || 'scheduled',
            estimatedDurationMinutes: 120, // Default duration
            crewSize: 'TWO',
            baseDistanceMiles: 0, // Will be calculated later
            distanceCostGBP: 0, // Will be calculated later
            accessSurchargeGBP: 0,
            weatherSurchargeGBP: 0,
            itemsSurchargeGBP: 0, // Will be calculated later
            crewMultiplierPercent: 0,
            availabilityMultiplierPercent: 0,
            totalGBP: amountInPence, // Amount in pence
            stripePaymentIntentId: null, // Will be set by webhook
            customerName: bookingData.customer.name,
            customerEmail: bookingData.customer.email,
            customerPhone: bookingData.customer.phone,
            customerId: customerId,
            pickupAddressId: pickupAddress.id,
            dropoffAddressId: dropoffAddress.id,
            pickupPropertyId: pickupProperty.id,
            dropoffPropertyId: dropoffProperty.id,
            // Store serviceType in customerPreferences JSON
            customerPreferences: {
              serviceType: (bookingData as any)?.serviceType || 'standard',
              serviceLevel: (bookingData as any)?.serviceType || 'standard',
              pickupAddressMeta: {
                flatNumber: resolveFlatNumber(bookingData.pickupAddress),
                floorNumber: resolveFloorNumber(bookingData.pickupAddress),
                hasLift: bookingData.pickupDetails?.hasLift ?? (bookingData.pickupAddress as any)?.buildingDetails?.hasElevator ?? false,
              },
              dropoffAddressMeta: {
                flatNumber: resolveFlatNumber(bookingData.dropoffAddress),
                floorNumber: resolveFloorNumber(bookingData.dropoffAddress),
                hasLift: bookingData.dropoffDetails?.hasLift ?? (bookingData.dropoffAddress as any)?.buildingDetails?.hasElevator ?? false,
              },
            },
            // Set orderType based on routeId or isMultiDrop
            orderType: (bookingData as any)?.routeId ? 'multi-drop' : 'single',
            isMultiDrop: !!(bookingData as any)?.routeId,
          },
        });

        // Create booking items if any
        if (bookingData.items && bookingData.items.length > 0) {
          for (const item of bookingData.items) {
            await tx.bookingItem.create({
              data: {
                bookingId: booking.id,
                name: item.name,
                quantity: item.quantity || 1,
                volumeM3: item.volumeFactor || 0,
              },
            });
          }
        }

      return booking;
    });

    console.log('✅ New booking created in database:', {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        total: booking.totalGBP,
      });
    }

    console.log('🔗 [CHECKOUT DEBUG] Creating Stripe checkout session with URLs:');
    console.log('🔗 [CHECKOUT DEBUG] Success URL:', successUrl || `${request.nextUrl.origin}/booking-luxury/success?session_id={CHECKOUT_SESSION_ID}&booking_ref=${bookingReference}`);
    console.log('🔗 [CHECKOUT DEBUG] Cancel URL:', cancelUrl || `${request.nextUrl.origin}/booking-luxury?step=2&payment=cancelled`);

    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'Speedy Van Moving Service',
              description: 'Professional moving and van hire service',
              images: ['https://speedy-van.co.uk/logo.png'],
            },
            unit_amount: amountInPence,
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
      },
      success_url: successUrl || `${request.nextUrl.origin}/booking-luxury/success?session_id={CHECKOUT_SESSION_ID}&booking_ref=${bookingReference}`,
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
          message: 'Secure payment processed by Stripe. Your booking will be confirmed immediately after payment.',
        },
      },
    });

    console.log('✅ Stripe session created:', {
      sessionId: stripeSession.id,
      sessionUrl: stripeSession.url,
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