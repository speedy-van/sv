/**
 * BOOKING WITH PAYMENT API - PRODUCTION GRADE
 * 
 * Combined Step-1 → Pricing → Payment Intent creation flow.
 * 
 * Features:
 * - Complete booking flow with payment integration
 * - Automatic Payment Intent creation
 * - Server-side pricing authority
 * - Multi-drop routing support
 * - GBP currency with pence precision
 * - Comprehensive validation and logging
 * - Idempotency and error recovery
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { comprehensivePricingEngine } from '@/lib/pricing/comprehensive-engine';
import {
  validatePricingInput,
  createRequestId,
  formatGbpMinor
} from '@/lib/pricing/schemas';
import {
  createPaymentIntent,
  generateIdempotencyKey
} from '@/lib/stripe/client';
import { prisma } from '@/lib/prisma';
import { RouteOrchestrationService } from '@/lib/services/route-orchestration-service';
import { PricingSnapshotService } from '@/lib/services/pricing-snapshot-service';

// Booking with payment request schema
const BookingWithPaymentRequestSchema = z.object({
  // Step-1 booking data (existing structure)
  items: z.array(z.object({
    id: z.string().optional(),
    name: z.string(),
    category: z.string().optional(),
    quantity: z.number().min(1),
    weight: z.number().optional(),
    volume: z.number().optional(),
    fragile: z.boolean().optional(),
    oversize: z.boolean().optional(),
    disassemblyRequired: z.boolean().optional(),
    specialHandling: z.array(z.string()).optional()
  })).min(1),

  pickupAddress: z.object({
    address: z.string(),
    postcode: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }),

  dropoffAddress: z.object({
    address: z.string(),
    postcode: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number()
    }).optional()
  }),

  pickupProperty: z.object({
    type: z.string().optional(),
    floors: z.number().optional(),
    hasLift: z.boolean().optional(),
    hasParking: z.boolean().optional(),
    accessNotes: z.string().optional(),
    requiresPermit: z.boolean().optional()
  }).optional(),

  dropoffProperty: z.object({
    type: z.string().optional(),
    floors: z.number().optional(),
    hasLift: z.boolean().optional(),
    hasParking: z.boolean().optional(),
    accessNotes: z.string().optional(),
    requiresPermit: z.boolean().optional()
  }).optional(),

  serviceType: z.string().default('standard'),
  scheduledDate: z.string().optional(),
  timeSlot: z.string().optional(),

  addOns: z.object({
    packing: z.boolean().optional(),
    packingVolume: z.number().optional(),
    disassembly: z.array(z.string()).optional(),
    reassembly: z.array(z.string()).optional(),
    insurance: z.object({
      required: z.boolean(),
      value: z.number().optional()
    }).optional()
  }).optional(),

  promoCode: z.string().optional(),

  // Customer context
  userContext: z.object({
    isAuthenticated: z.boolean().optional(),
    isReturningCustomer: z.boolean().optional(),
    customerTier: z.string().optional(),
    locale: z.string().optional()
  }).optional(),

  // Payment-specific fields
  customer: z.object({
    email: z.string().email(),
    name: z.string().min(1),
    phone: z.string().optional(),
    customerId: z.string().optional() // Existing Stripe customer ID
  }),

  // Payment preferences
  paymentOptions: z.object({
    setupFutureUsage: z.enum(['on_session', 'off_session']).optional(),
    captureMethod: z.enum(['automatic', 'manual']).default('automatic'),
    generateIdempotencyKey: z.boolean().default(true)
  }).optional()
});

type BookingWithPaymentRequest = z.infer<typeof BookingWithPaymentRequestSchema>;

/**
 * POST /api/booking/create-with-payment
 * 
 * Complete booking flow: Step-1 → Pricing → Payment Intent
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const correlationId = `BOOKING-PAYMENT-${createRequestId()}`;
  const startTime = Date.now();

  console.log(`[BOOKING PAYMENT API] ${correlationId} - Request started`, { 
    method: request.method,
    url: request.url 
  });

  try {
    // Parse and validate request body
    const body = await request.json();
    
    const validationResult = BookingWithPaymentRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.issues,
        correlationId
      }, { status: 400 });
    }

    const requestData = validationResult.data;

    console.log(`[BOOKING PAYMENT API] ${correlationId} - Request validated`, {
      itemsCount: requestData.items.length,
      hasPickup: !!requestData.pickupAddress,
      hasDropoff: !!requestData.dropoffAddress,
      customerEmail: requestData.customer.email,
      serviceType: requestData.serviceType
    });

    // Step 1: Transform form data to pricing input
    const pricingInput = {
      items: requestData.items.map(item => ({
        id: item.id || '',
        name: item.name,
        category: item.category || 'furniture',
        quantity: item.quantity,
        weight: item.weight,
        volume: item.volume,
        fragile: item.fragile || false,
        oversize: item.oversize || false,
        disassemblyRequired: item.disassemblyRequired || false,
        specialHandling: item.specialHandling || []
      })),

      pickup: {
        address: requestData.pickupAddress.address,
        postcode: requestData.pickupAddress.postcode || '',
        coordinates: {
          lat: requestData.pickupAddress.latitude || requestData.pickupAddress.coordinates?.lat || 0,
          lng: requestData.pickupAddress.longitude || requestData.pickupAddress.coordinates?.lng || 0
        },
        propertyDetails: {
          type: requestData.pickupProperty?.type || 'house',
          floors: requestData.pickupProperty?.floors || 0,
          hasLift: requestData.pickupProperty?.hasLift || false,
          hasParking: requestData.pickupProperty?.hasParking || true,
          accessNotes: requestData.pickupProperty?.accessNotes || '',
          requiresPermit: requestData.pickupProperty?.requiresPermit || false
        }
      },

      dropoffs: [{
        address: requestData.dropoffAddress.address,
        postcode: requestData.dropoffAddress.postcode || '',
        coordinates: {
          lat: requestData.dropoffAddress.latitude || requestData.dropoffAddress.coordinates?.lat || 0,
          lng: requestData.dropoffAddress.longitude || requestData.dropoffAddress.coordinates?.lng || 0
        },
        propertyDetails: {
          type: requestData.dropoffProperty?.type || 'house',
          floors: requestData.dropoffProperty?.floors || 0,
          hasLift: requestData.dropoffProperty?.hasLift || false,
          hasParking: requestData.dropoffProperty?.hasParking || true,
          accessNotes: requestData.dropoffProperty?.accessNotes || '',
          requiresPermit: requestData.dropoffProperty?.requiresPermit || false
        }
      }],

      serviceLevel: requestData.serviceType,
      scheduledDate: requestData.scheduledDate,
      timeSlot: requestData.timeSlot || 'flexible',
      
      addOns: {
        packing: requestData.addOns?.packing || false,
        packingVolume: requestData.addOns?.packingVolume,
        disassembly: requestData.addOns?.disassembly || [],
        reassembly: requestData.addOns?.reassembly || [],
        insurance: requestData.addOns?.insurance
      },

      promoCode: requestData.promoCode,
      
      userContext: {
        isAuthenticated: requestData.userContext?.isAuthenticated || false,
        isReturningCustomer: requestData.userContext?.isReturningCustomer || false,
        customerTier: requestData.userContext?.customerTier || 'standard',
        locale: requestData.userContext?.locale || 'en-GB'
      }
    };

    // Step 2: Validate pricing input
    const validatedPricingInput = validatePricingInput(pricingInput);
    
    console.log(`[BOOKING PAYMENT API] ${correlationId} - Pricing input validated`, {
      itemsCount: validatedPricingInput.items.length,
      serviceLevel: validatedPricingInput.serviceLevel,
      multiDrop: validatedPricingInput.dropoffs.length > 1
    });

    // Step 3: Calculate pricing using comprehensive engine
    const pricingResult = await comprehensivePricingEngine.calculatePrice(validatedPricingInput);

    console.log(`[BOOKING PAYMENT API] ${correlationId} - Pricing calculated`, {
      amountGbpMinor: pricingResult.amountGbpMinor,
      amountGbpFormatted: formatGbpMinor(pricingResult.amountGbpMinor),
      requestId: pricingResult.metadata.requestId
    });

    // Step 3.5: Create drops and routes for the booking
    console.log(`[BOOKING PAYMENT API] ${correlationId} - Creating drops and routes`);

    // Create pickup and delivery addresses
    const pickupAddress = await prisma.bookingAddress.create({
      data: {
        label: `Pickup - ${requestData.pickupAddress.address}`,
        postcode: requestData.pickupAddress.postcode || '',
        lat: requestData.pickupAddress.latitude,
        lng: requestData.pickupAddress.longitude,
      }
    });

    const dropoffAddress = await prisma.bookingAddress.create({
      data: {
        label: `Dropoff - ${requestData.dropoffAddress.address}`,
        postcode: requestData.dropoffAddress.postcode || '',
        lat: requestData.dropoffAddress.latitude,
        lng: requestData.dropoffAddress.longitude,
      }
    });

    // Create property details
    const pickupProperty = await prisma.propertyDetails.create({
      data: {
        propertyType: (requestData.pickupProperty?.type as any) || 'DETACHED',
        accessType: (requestData.pickupProperty?.hasLift ? 'WITH_LIFT' : 'WITHOUT_LIFT') as any,
        floors: requestData.pickupProperty?.floors || 0,
      }
    });

    const dropoffProperty = await prisma.propertyDetails.create({
      data: {
        propertyType: (requestData.dropoffProperty?.type as any) || 'DETACHED',
        accessType: (requestData.dropoffProperty?.hasLift ? 'WITH_LIFT' : 'WITHOUT_LIFT') as any,
        floors: requestData.dropoffProperty?.floors || 0,
      }
    });

    // Create booking items
    const bookingItems = [];
    for (const item of requestData.items) {
      const bookingItem = await prisma.bookingItem.create({
        data: {
          name: item.name,
          quantity: item.quantity,
          volumeM3: item.volume || 0,
          bookingId: '', // Will be set after booking creation
        }
      });
      bookingItems.push(bookingItem);
    }

    // Generate booking reference
    const bookingId: string = `BK${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // Create the main booking record
    const booking = await prisma.booking.create({
      data: {
        customerId: requestData.customer.customerId || null,
        customerName: requestData.customer.name,
        customerPhone: requestData.customer.phone || '',
        reference: bookingId,
        customerEmail: requestData.customer.email,
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,
        scheduledAt: new Date(requestData.scheduledDate || Date.now()),
        totalGBP: Math.round(pricingResult.amountGbpMinor / 100), // Convert pence to pounds
        accessSurchargeGBP: 0,
        availabilityMultiplierPercent: 0,
        baseDistanceMiles: pricingResult.route.totalDistance || 10,
        crewMultiplierPercent: 0,
        distanceCostGBP: 0,
        estimatedDurationMinutes: pricingResult.route.totalDuration || 60,
        itemsSurchargeGBP: 0,
        weatherSurchargeGBP: 0,
        status: 'PENDING_PAYMENT',
        crewSize: requestData.serviceType === 'white-glove' ? 'FOUR' : 'TWO'
      }
    });

    // Create drops for each delivery location (pickup and dropoff)
    const pickupDrop = await prisma.drop.create({
      data: {
        bookingId: booking.id,
        customerId: requestData.customer.customerId || '',
        pickupAddress: requestData.pickupAddress.address,
        deliveryAddress: requestData.dropoffAddress.address,
        timeWindowStart: new Date(requestData.scheduledDate || Date.now()),
        timeWindowEnd: new Date((new Date(requestData.scheduledDate || Date.now())).getTime() + 2 * 60 * 60 * 1000), // 2 hours window
        serviceTier: (requestData.serviceType as any) || 'STANDARD',
        status: 'booked',
        weight: requestData.items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0),
        volume: requestData.items.reduce((sum, item) => sum + (item.volume || 0) * item.quantity, 0),
        quotedPrice: pricingResult.amountGbpMinor / 100, // Convert pence to pounds
        distance: pricingResult.route.totalDistance || 10,
      }
    });

    // Create route for this booking (single drop route)
    const route = await prisma.route.create({
      data: {
        driverId: 'temp_driver', // Will be assigned later
        status: 'planned',
        startTime: new Date(requestData.scheduledDate || Date.now()),
        optimizedDistanceKm: pricingResult.route.totalDistance || 10,
        estimatedDuration: pricingResult.route.totalDuration || 60,
        totalOutcome: pricingResult.amountGbpMinor / 100,
        drops: {
          connect: { id: pickupDrop.id }
        }
      }
    });

    // Update drop with route ID
    await prisma.drop.update({
      where: { id: pickupDrop.id },
      data: { routeId: route.id }
    });

    // Save pricing snapshot to ensure immutability and Stripe matching
    await PricingSnapshotService.createPricingSnapshot(
      booking.id,
      pricingResult,
      pricingInput
    );

    console.log(`[BOOKING PAYMENT API] ${correlationId} - Created booking with route and pricing snapshot`, {
      bookingId: booking.id,
      routeId: route.id,
      dropId: pickupDrop.id,
      pricingAmountGbpMinor: pricingResult.amountGbpMinor
    });

    // Step 4: Generate idempotency key (using booking ID)
    const idempotencyKey = requestData.paymentOptions?.generateIdempotencyKey !== false
      ? generateIdempotencyKey(`booking_${bookingId}`)
      : undefined;

    // Step 5: Create Payment Intent
    const paymentDescription = `Booking ${bookingId} - ${requestData.serviceType} service`;
    
    const paymentIntent = await createPaymentIntent({
      amountGbpMinor: pricingResult.amountGbpMinor,
      description: paymentDescription,
      automaticPaymentMethods: true,
      captureMethod: 'manual',
      customerId: requestData.customer.customerId,
      metadata: {
        bookingId: bookingId,
        correlationId: correlationId,
        customerEmail: requestData.customer.email,
        customerName: requestData.customer.name,
        serviceType: requestData.serviceType,
        pickupAddress: requestData.pickupAddress.address,
        dropoffAddress: requestData.dropoffAddress.address,
        scheduledDate: requestData.scheduledDate || '',
        itemsCount: requestData.items.length.toString()
      },
      idempotencyKey
    }, correlationId);

    const processingTime = Date.now() - startTime;
    
    console.log(`[BOOKING PAYMENT API] ${correlationId} - Booking with payment created`, {
      bookingId,
      paymentIntentId: paymentIntent.id,
      amountGbpMinor: pricingResult.amountGbpMinor,
      amountGbpFormatted: formatGbpMinor(pricingResult.amountGbpMinor),
      processingTimeMs: processingTime
    });

    // Step 6: Return complete response
    return NextResponse.json({
      success: true,
      data: {
        // Booking information
        booking: {
          id: booking.id,
          reference: booking.reference,
          status: booking.status,
          customerId: booking.customerId,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          customerPhone: booking.customerPhone,
          items: requestData.items,
          pickup: requestData.pickupAddress,
          dropoff: requestData.dropoffAddress,
          serviceType: requestData.serviceType,
          scheduledDate: requestData.scheduledDate,
          totalGBP: booking.totalGBP,
          createdAt: booking.createdAt,
          updatedAt: booking.updatedAt
        },

        // Route information
        route: {
          id: route.id,
          status: route.status,
          startTime: route.startTime,
          estimatedDuration: route.estimatedDuration,
          optimizedDistanceKm: route.optimizedDistanceKm,
          totalOutcome: route.totalOutcome
        },

        // Drop information
        drop: {
          id: pickupDrop.id,
          status: pickupDrop.status,
          pickupAddress: pickupDrop.pickupAddress,
          deliveryAddress: pickupDrop.deliveryAddress,
          timeWindowStart: pickupDrop.timeWindowStart,
          timeWindowEnd: pickupDrop.timeWindowEnd,
          serviceTier: pickupDrop.serviceTier,
          quotedPrice: pickupDrop.quotedPrice,
          weight: pickupDrop.weight,
          volume: pickupDrop.volume,
          distance: pickupDrop.distance
        },

        // Pricing information
        pricing: {
          ...pricingResult,
          amountGbpFormatted: formatGbpMinor(pricingResult.amountGbpMinor),
          // Legacy compatibility
          price: pricingResult.amountGbpMinor / 100,
          currency: 'GBP',
          total: pricingResult.amountGbpMinor / 100,
          totalPrice: pricingResult.amountGbpMinor / 100
        },

        // Payment information
        payment: {
          ...paymentIntent,
          amountGbpFormatted: formatGbpMinor(paymentIntent.amountGbpMinor),
          idempotencyKey: idempotencyKey || null,
          description: paymentDescription
        }
      },

      metadata: {
        correlationId,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        bookingId: booking.id,
        routeId: route.id,
        dropId: pickupDrop.id,
        paymentIntentId: paymentIntent.id
      }
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId,
        'X-Booking-ID': booking.id,
        'X-Route-ID': route.id,
        'X-Drop-ID': pickupDrop.id,
        'X-Payment-Intent-ID': paymentIntent.id,
        'X-Processing-Time': processingTime.toString()
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    console.error(`[BOOKING PAYMENT API] ${correlationId} - Error occurred`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTimeMs: processingTime
    });

    // Validation error
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid input data',
        details: (error as any).errors,
        correlationId
      }, { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId
        }
      });
    }

    // Pricing engine error
    if (error instanceof Error && error.message?.includes('Data source loading failed')) {
      return NextResponse.json({
        success: false,
        error: 'Pricing system unavailable',
        message: 'Please try again in a moment',
        correlationId
      }, { 
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId
        }
      });
    }

    // Stripe error
    if (error instanceof Error && error.message?.includes('Stripe error')) {
      return NextResponse.json({
        success: false,
        error: 'Payment system unavailable',
        message: 'Please try again in a moment',
        correlationId
      }, { 
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId
        }
      });
    }

    // Generic server error
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      correlationId
    }, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': correlationId
      }
    });
  }
}

// Health check and documentation endpoint
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/booking/create-with-payment',
    description: 'Complete booking flow with integrated payment processing',
    version: '1.0.0',
    features: [
      'Step-1 Data Ingestion',
      'Unified Pricing Engine',
      'Automatic Payment Intent Creation',
      'GBP Currency with Pence Precision',
      'Multi-Drop Routing Support',
      'Comprehensive Validation',
      'Structured Logging',
      'Idempotency Keys',
      'Error Recovery'
    ],
    workflow: [
      '1. Validate booking request',
      '2. Transform to pricing input',
      '3. Calculate pricing with unified engine',
      '4. Generate booking ID',
      '5. Create Stripe Payment Intent',
      '6. Return complete booking + payment data'
    ],
    integration: {
      pricing: 'Unified Pricing Engine',
      payment: 'Stripe Payment Intents',
      currency: 'GBP (pence precision)',
      logging: 'Structured with correlation IDs'
    }
  });
}