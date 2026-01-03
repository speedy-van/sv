import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

// Schema for AI booking creation
const createBookingSchema = z.object({
  // Customer details
  customerDetails: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(10),
  }),
  
  // Addresses
  pickupAddress: z.object({
    full: z.string().min(1),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().min(1),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  
  dropoffAddress: z.object({
    full: z.string().min(1),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    postcode: z.string().min(1),
    coordinates: z.object({
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
  
  // Items
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.string(),
    quantity: z.number().min(1),
    weight: z.number().optional(),
    volume: z.number().optional(),
  })).min(1),
  
  // Service & Pricing
  serviceType: z.enum(['economy', 'standard', 'priority']).default('standard'),
  vehicleType: z.string().optional(),
  pickupDate: z.string(),
  pickupTimeSlot: z.string().optional(),
  
  // Pricing
  pricing: z.object({
    subtotal: z.number().min(0),
    vat: z.number().min(0),
    total: z.number().min(0),
    distance: z.number().min(0),
  }),
  
  // Optional
  specialInstructions: z.string().optional(),
  promotionCode: z.string().optional(),
});

// TODO[SpeedyAI-Phase2-H2]: Add availability check before creating booking
// Query Booking table for pickupDate conflicts, check driver capacity
// Return specific error if date unavailable with alternative suggestions
// TODO[SpeedyAI-Phase2-H2]: Add availability check before creating booking
// Query Booking table for pickupDate conflicts, check driver capacity
// Return specific error if date unavailable with alternative suggestions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createBookingSchema.parse(body);

    // H2: Availability check - simple capacity guard per day per vehicle type
    const pickupDate = new Date(validated.pickupDate);
    const startOfDay = new Date(pickupDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(pickupDate.setHours(23, 59, 59, 999));

    // Determine vehicle type for capacity check (default to medium if not specified)
    const vehicleType = validated.serviceType || 'medium';
    const capacityPerVehicleType: Record<string, number> = {
      small: 8,
      medium: 6,
      large: 5,
      luton: 4,
    };

    const maxCapacity = capacityPerVehicleType[vehicleType] || 6;

    // Count existing bookings on the same day
    const existingBookings = await prisma.booking.count({
      where: {
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          notIn: ['CANCELLED'],
        },
      },
    });

    // Check if capacity exceeded
    if (existingBookings >= maxCapacity) {
      // Generate alternative dates (next 3 available days)
      const alternatives: string[] = [];
      for (let i = 1; i <= 3; i++) {
        const altDate = new Date(pickupDate);
        altDate.setDate(altDate.getDate() + i);
        alternatives.push(altDate.toISOString().split('T')[0]);
      }

      return NextResponse.json(
        {
          success: false,
          error: 'NO_AVAILABILITY',
          message: `We're fully booked on ${pickupDate.toDateString()}. We can accommodate you on alternative dates.`,
          alternativeDates: alternatives,
          suggestedMessage: `Our schedule is full for that date. How about ${alternatives[0]} or ${alternatives[1]} instead?`,
        },
        { status: 409 }
      );
    }

    // Generate booking reference
    const reference = `SV-AI-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // H3: Validate coordinates exist - no silent London fallback
    if (!validated.pickupAddress.coordinates?.lat || !validated.pickupAddress.coordinates?.lng) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_COORDINATES',
          message: 'Unable to resolve pickup address coordinates. Please verify the postcode.',
        },
        { status: 400 }
      );
    }

    // Create pickup address
    const pickupAddress = await prisma.bookingAddress.create({
      data: {
        id: crypto.randomUUID(),
        label: validated.pickupAddress.full,
        postcode: validated.pickupAddress.postcode,
        lat: validated.pickupAddress.coordinates.lat,
        lng: validated.pickupAddress.coordinates.lng,
      },
    });
    
    // H3: Validate coordinates exist - no silent London fallback
    if (!validated.dropoffAddress.coordinates?.lat || !validated.dropoffAddress.coordinates?.lng) {
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_COORDINATES',
          message: 'Unable to resolve dropoff address coordinates. Please verify the postcode.',
        },
        { status: 400 }
      );
    }

    // Create dropoff address
    const dropoffAddress = await prisma.bookingAddress.create({
      data: {
        id: crypto.randomUUID(),
        label: validated.dropoffAddress.full,
        postcode: validated.dropoffAddress.postcode,
        lat: validated.dropoffAddress.coordinates.lat,
        lng: validated.dropoffAddress.coordinates.lng,
      },
    });
    
    // Create pickup property details
    const pickupProperty = await prisma.propertyDetails.create({
      data: {
        id: crypto.randomUUID(),
        propertyType: 'HOUSE',
        accessType: 'GROUND_FLOOR',
        floors: 1,
      },
    });
    
    // Create dropoff property details
    const dropoffProperty = await prisma.propertyDetails.create({
      data: {
        id: crypto.randomUUID(),
        propertyType: 'HOUSE',
        accessType: 'GROUND_FLOOR',
        floors: 1,
      },
    });
    
    // Create booking in database
    const booking = await prisma.booking.create({
      data: {
        id: crypto.randomUUID(),
        reference,
        
        // Customer
        customerName: `${validated.customerDetails.firstName} ${validated.customerDetails.lastName}`,
        customerEmail: validated.customerDetails.email,
        customerPhone: validated.customerDetails.phone,
        
        // Link addresses and properties
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,
        
        // Coordinates
        pickupLat: validated.pickupAddress.coordinates?.lat,
        pickupLng: validated.pickupAddress.coordinates?.lng,
        dropoffLat: validated.dropoffAddress.coordinates?.lat,
        dropoffLng: validated.dropoffAddress.coordinates?.lng,
        
        // Service details
        scheduledAt: new Date(validated.pickupDate),
        pickupTimeSlot: validated.pickupTimeSlot,
        urgency: validated.serviceType === 'priority' ? 'express' : 'standard',
        
        // Pricing (convert to pence)
        totalGBP: Math.round(validated.pricing.total * 100),
        distanceCostGBP: Math.round(validated.pricing.subtotal * 100),
        accessSurchargeGBP: 0,
        itemsSurchargeGBP: 0,
        weatherSurchargeGBP: 0,
        
        baseDistanceMiles: validated.pricing.distance * 0.621371,
        estimatedDurationMinutes: Math.round(validated.pricing.distance * 2),
        
        distanceMeters: Math.round(validated.pricing.distance * 1000),
        
        availabilityMultiplierPercent: 100,
        crewMultiplierPercent: 100,
        crewSize: 'TWO',
        
        // Status
        status: 'DRAFT',
        currentStep: 'STEP_2_CUSTOMER_PAYMENT',
        isStepCompleted: true,
        
        // Metadata
        orderType: 'ai-booking',
        eligibleForMultiDrop: false,
        
        // Required timestamps
        updatedAt: new Date(),
      },
    });
    
    // Create booking items
    for (const item of validated.items) {
      await prisma.bookingItem.create({
        data: {
          bookingId: booking.id,
          name: item.name,
          quantity: item.quantity,
          volumeM3: item.volume || 0.5,
          category: item.category,
          estimatedWeight: item.weight || 20,
        },
      });
    }
    
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `Moving Service - ${validated.serviceType.toUpperCase()}`,
              description: `From ${validated.pickupAddress.postcode} to ${validated.dropoffAddress.postcode}`,
              metadata: {
                bookingId: booking.id,
                bookingReference: reference,
              },
            },
            unit_amount: Math.round(validated.pricing.total * 100), // Convert to pence
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speedy-van.co.uk'}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speedy-van.co.uk'}/booking/cancelled?booking_id=${booking.id}`,
      customer_email: validated.customerDetails.email,
      metadata: {
        bookingId: booking.id,
        bookingReference: reference,
        source: 'AI_CHATBOT',
      },
      client_reference_id: booking.id,
    });
    
    // Store Stripe session ID in payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: 'stripe',
        intentId: session.payment_intent as string || '',
        amount: Math.round(validated.pricing.total * 100), // Convert to pence
        currency: 'gbp',
        status: 'unpaid',
        metadata: {
          sessionId: session.id,
          source: 'AI_CHATBOT',
        } as any,
      },
    });
    
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: reference,
        status: booking.status,
      },
      payment: {
        sessionId: session.id,
        url: session.url,
      },
    });
    
  } catch (error: any) {
    console.error('❌ AI Create Booking error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create booking',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
