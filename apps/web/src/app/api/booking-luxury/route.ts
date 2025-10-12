import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createUniqueReference } from '@/lib/ref';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { 
  poundsToPence,
  validateBookingAmount, 
  convertBookingAmountsToPence
} from '@/lib/utils/currency';
import { dynamicPricingEngine } from '@/lib/services/dynamic-pricing-engine';
// Using Prisma enums instead
// import {
//   BookingStep,
//   BookingStatus
// } from '@speedy-van/shared';
// import { enterprisePricingService } from '@/lib/services/enterprise-pricing-service';
// import { postBookingService } from '@/lib/services/post-booking-service';
// import { apiRateLimit } from '@/lib/rate-limit';
import { createLuxuryBookingSchema } from '@/types/shared';
import { PropertyType } from '@prisma/client';
import Pusher from 'pusher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Pusher for driver notifications
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

// Function to notify available drivers about new jobs
async function notifyAvailableDrivers(bookingData: {
  bookingId: string;
  reference: string;
  customerName: string;
  pickupAddress: string;
  pickupPostcode: string;
  dropoffAddress: string;
  dropoffPostcode: string;
  totalPrice: number;
  scheduledAt: Date | null;
}) {
  try {
    console.log('📢 Notifying available drivers about new job:', bookingData.reference);

    // Get all available drivers
    const availableDrivers = await prisma.driver.findMany({
      where: {
        availability: {
          status: 'AVAILABLE',
        },
        user: {
          isActive: true,
        },
      },
      select: {
        id: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    console.log(`📡 Found ${availableDrivers.length} available drivers to notify`);

    // Create notification payload
    const notification = {
      type: 'new-job' as const,
      data: {
        bookingId: bookingData.bookingId,
        jobType: 'Moving & Delivery',
        pickup: {
          address: bookingData.pickupAddress,
          postcode: bookingData.pickupPostcode,
        },
        delivery: {
          address: bookingData.dropoffAddress,
          postcode: bookingData.dropoffPostcode,
        },
        distance: 0, // Will be calculated later
        estimatedDuration: 60, // Default estimate
        price: bookingData.totalPrice,
        priority: 'medium' as const,
        customerName: bookingData.customerName,
      },
      timestamp: new Date().toISOString(),
      urgent: false,
    };

    // Send notifications to all available drivers
    const notificationPromises = availableDrivers.map(async (driver) => {
      const channelName = `driver-${driver.id}`;
      
      try {
        await pusher.trigger(channelName, 'new-job', notification);
        console.log(`✅ Notification sent to driver ${driver.id} (${driver.user.name})`);
      } catch (error) {
        console.error(`❌ Failed to notify driver ${driver.id}:`, error);
      }
    });

    await Promise.allSettled(notificationPromises);
    
    console.log(`📤 Job notifications sent to ${availableDrivers.length} drivers`);

  } catch (error) {
    console.error('❌ Error notifying available drivers:', error);
    throw error;
  }
}

// Frontend property type from form validation
type FormPropertyType = 'house' | 'apartment' | 'office' | 'warehouse' | 'other';

// Legacy property types from old forms
type LegacyPropertyType = 'HOUSE' | 'FLAT' | 'OFFICE' | 'WAREHOUSE' | 'SHOP' | 'OTHER';

// Union of all possible input types
type FrontendPropertyType = FormPropertyType | LegacyPropertyType;

// Mapping function to convert frontend property types to Prisma enum values
const mapPropertyTypeToPrisma = (frontendType: FrontendPropertyType): PropertyType => {
  // First handle form inputs
  const formMapping: Record<FormPropertyType, PropertyType> = {
    'house': 'DETACHED',
    'apartment': 'FLAT',
    'office': 'FLAT',
    'warehouse': 'FLAT',
    'other': 'DETACHED'
  };

  // Then handle legacy inputs
  const legacyMapping: Record<LegacyPropertyType, PropertyType> = {
    'HOUSE': 'DETACHED',
    'FLAT': 'FLAT',
    'OFFICE': 'FLAT',
    'WAREHOUSE': 'FLAT',
    'SHOP': 'FLAT',
    'OTHER': 'DETACHED'
  };

  // Check if input is a direct Prisma enum value
  if (Object.values(PropertyType).includes(frontendType as any)) {
    return frontendType as PropertyType;
  }

  // Try form mapping
  const formResult = formMapping[frontendType as FormPropertyType];
  if (formResult) return formResult;

  // Try legacy mapping
  const legacyResult = legacyMapping[frontendType as LegacyPropertyType];
  if (legacyResult) return legacyResult;

  // If no mapping found, return safe default
  console.warn(`⚠️ Unknown property type "${frontendType}" - defaulting to DETACHED`);
  return 'DETACHED';
};

// Type definitions for post-booking data
interface PostBookingData {
  booking: {
    id: string;
    reference: string;
    status: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    scheduledAt: Date;
    totalGBP: number;
    pickupAddress: string;
    dropoffAddress: string;
    items: Array<{
      name: string;
      quantity: number;
    }>;
    estimatedDurationMinutes: number;
  };
  paymentIntentId: string | null;
  linkedToAccount: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const rawData = await request.json();

    // Comprehensive Zod validation
    const validationResult = createLuxuryBookingSchema.safeParse(rawData);
    
    if (!validationResult.success) {
      console.error('❌ Booking validation failed:', validationResult.error.issues);

      // Format validation errors for user-friendly response
      const formattedErrors = validationResult.error.issues.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }));

      return NextResponse.json(
        {
          error: 'Validation failed',
          details: 'Please check your input data',
          validationErrors: formattedErrors
        },
        { status: 400 }
      );
    }

    const bookingData = validationResult.data;

    // Validate and convert currency amounts
    try {
      validateBookingAmount(bookingData.pricing.total);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Invalid booking amount',
          details: error instanceof Error ? error.message : 'Invalid amount',
        },
        { status: 400 }
      );
    }

    // Store pricing breakdown for future reference (will be calculated later)
    let pricingBreakdown: any = null;

    // Check if user is authenticated
    const session = await getServerSession(authOptions);
    let customerId = null;
    
    if (session?.user?.id) {
      // Verify the user exists in the database
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true }
      });
      
      if (user) {
        customerId = user.id;
      } else {
        console.warn('⚠️ Session user ID not found in database:', session.user.id);
      }
    }

    console.log('📝 Creating new booking with validated data:', {
      customer: bookingData.customer,
      pickupAddress: bookingData.pickupAddress,
      dropoffAddress: bookingData.dropoffAddress,
      items: bookingData.items?.length || 0,
      totalAmountPounds: bookingData.pricing.total,
      totalAmountPence: poundsToPence(bookingData.pricing?.total || 0),
      authenticatedUser: customerId ? 'Yes' : 'No',
    });

    // Generate unique booking reference
    const reference = await createUniqueReference('booking');

    // Create pickup address - support both 'address' and 'line1' formats
    // Use the raw data to get coordinates that might not be in the schema
    const rawPickupAddress = rawData.pickupAddress as any;
    const pickupAddress = await prisma.bookingAddress.create({
      data: {
        label: bookingData.pickupAddress.street || rawPickupAddress.address || 'Pickup Address',
        postcode: bookingData.pickupAddress.postcode || '',
        lat: rawPickupAddress.coordinates?.lat || 0,
        lng: rawPickupAddress.coordinates?.lng || 0,
      },
    });

    // Create dropoff address - support both 'address' and 'line1' formats
    const rawDropoffAddress = rawData.dropoffAddress as any;
    const dropoffAddress = await prisma.bookingAddress.create({
      data: {
        label: bookingData.dropoffAddress.street || rawDropoffAddress.address || 'Dropoff Address',
        postcode: bookingData.dropoffAddress.postcode || '',
        lat: rawDropoffAddress.coordinates?.lat || 0,
        lng: rawDropoffAddress.coordinates?.lng || 0,
      },
    });

    // Create pickup property details
    const pickupPropertyType = mapPropertyTypeToPrisma(
      bookingData.pickupDetails?.type || 'house'
    );
    console.log('📝 Mapping pickup property type:', {
      original: bookingData.pickupDetails?.type,
      mapped: pickupPropertyType,
    });

    const pickupProperty = await prisma.propertyDetails.create({
      data: {
        propertyType: pickupPropertyType as any,
        floors: bookingData.pickupDetails?.floors || 0,
        accessType: bookingData.pickupDetails?.hasLift
          ? 'WITH_LIFT'
          : 'WITHOUT_LIFT',
      },
    });

    // Create dropoff property details
    const dropoffPropertyType = mapPropertyTypeToPrisma(
      bookingData.dropoffDetails?.type || 'house'
    );
    console.log('📝 Mapping dropoff property type:', {
      original: bookingData.dropoffDetails?.type,
      mapped: dropoffPropertyType,
    });

    const dropoffProperty = await prisma.propertyDetails.create({
      data: {
        propertyType: dropoffPropertyType as any,
        floors: bookingData.dropoffDetails?.floors || 0,
        accessType: bookingData.dropoffDetails?.hasLift
          ? 'WITH_LIFT'
          : 'WITHOUT_LIFT',
      },
    });

    // Calculate pricing using Dynamic Pricing Engine
    console.log('🚀 Calculating pricing using Dynamic Pricing Engine...');
    
    // Prepare items for pricing engine
    const pricingItems = (bookingData.items || []).map((item: any) => ({
      category: item.category || 'general',
      quantity: item.quantity || 1,
      weight: item.weight || 0,
      volume: item.volumeFactor || 0,
      fragile: item.fragile || false,
    }));

    // Determine service type based on urgency
    let serviceType: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' = 'STANDARD';
    if (bookingData.urgency === 'urgent') {
      serviceType = 'PREMIUM';
    } else if (bookingData.urgency === 'same-day') {
      serviceType = 'ENTERPRISE';
    } else if (bookingData.urgency === 'flexible') {
      serviceType = 'ECONOMY';
    }

    // Determine customer segment
    const customerSegment = customerId ? 'BUSINESS' : 'INDIVIDUAL';
    
    // Determine loyalty tier (default to BRONZE for new customers)
    let loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' = 'BRONZE';
    if (customerId) {
      // Check customer's booking history
      const customerBookings = await prisma.booking.count({
        where: { customerId: customerId },
      });
      
      if (customerBookings >= 50) loyaltyTier = 'PLATINUM';
      else if (customerBookings >= 20) loyaltyTier = 'GOLD';
      else if (customerBookings >= 10) loyaltyTier = 'SILVER';
    }

    // Call dynamic pricing engine
    const dynamicPricingResult = await dynamicPricingEngine.calculateDynamicPrice({
      pickupAddress: {
        address: bookingData.pickupAddress.street || '',
        postcode: bookingData.pickupAddress.postcode || '',
        coordinates: rawPickupAddress.coordinates,
      },
      dropoffAddress: {
        address: bookingData.dropoffAddress.street || '',
        postcode: bookingData.dropoffAddress.postcode || '',
        coordinates: rawDropoffAddress.coordinates,
      },
      scheduledDate: bookingData.pickupDate ? new Date(bookingData.pickupDate) : 
                     bookingData.scheduledFor ? new Date(bookingData.scheduledFor) : new Date(),
      serviceType,
      customerSegment,
      loyaltyTier,
      items: pricingItems,
      customerId: customerId || undefined,
    });

    console.log('✅ Dynamic pricing calculated:', {
      basePrice: dynamicPricingResult.basePrice,
      finalPrice: dynamicPricingResult.finalPrice,
      multipliers: dynamicPricingResult.dynamicMultipliers,
      confidence: dynamicPricingResult.confidence,
    });

    // Compare with frontend pricing and log any significant differences
    const frontendPrice = bookingData.pricing.total;
    const backendPrice = dynamicPricingResult.finalPrice;
    const priceDifference = Math.abs(frontendPrice - backendPrice);
    const priceDifferencePercent = (priceDifference / frontendPrice) * 100;

    if (priceDifferencePercent > 10) {
      console.warn('⚠️ Significant price difference detected:', {
        frontendPrice,
        backendPrice,
        difference: priceDifference,
        differencePercent: priceDifferencePercent.toFixed(2) + '%',
      });
    }

    // Use backend calculated price (more accurate and includes all multipliers)
    const pricingResult = {
      price: dynamicPricingResult.finalPrice,
      currency: 'GBP',
      totalPrice: dynamicPricingResult.finalPrice,
      subtotalBeforeVAT: dynamicPricingResult.finalPrice / 1.2, // Remove VAT
      vatAmount: dynamicPricingResult.finalPrice - (dynamicPricingResult.finalPrice / 1.2),
      vatRate: 0.2,
      basePrice: dynamicPricingResult.basePrice,
      itemsPrice: dynamicPricingResult.breakdown.itemsCost,
      servicePrice: dynamicPricingResult.breakdown.timeCost,
      propertyAccessPrice: 0,
      urgencyPrice: dynamicPricingResult.breakdown.surcharges,
      promoDiscount: dynamicPricingResult.breakdown.discounts,
      estimatedDuration: 60,
      recommendedVehicle: 'van',
      distance: 10,
      breakdown: dynamicPricingResult.breakdown,
      surcharges: [],
      multipliers: dynamicPricingResult.dynamicMultipliers,
      recommendations: dynamicPricingResult.recommendations || [],
      optimizationTips: [],
      validUntil: dynamicPricingResult.validUntil,
      confidence: dynamicPricingResult.confidence,
    };
    
    // Validate pricing
    if (!pricingResult || pricingResult.totalPrice <= 0) {
      console.error('❌ Pricing validation failed: invalid result');
      return NextResponse.json(
        {
          success: false,
          error: 'Pricing calculation failed',
          details: 'Invalid pricing result',
        },
        { status: 400 }
      );
    }

    console.log('✅ Pricing calculated successfully');

    // Use calculated total from Enterprise Pricing Engine
    const calculatedTotal = pricingResult.totalPrice;

    // Store pricing breakdown for future reference
    pricingBreakdown = {
      basePrice: pricingResult.basePrice,
      distancePrice: 0, // No longer calculated
      itemsPrice: pricingResult.itemsPrice,
      timePrice: pricingResult.servicePrice,
      urgencyPrice: pricingResult.urgencyPrice,
      subtotalBeforeVAT: pricingResult.subtotalBeforeVAT,
      vatAmount: pricingResult.vatAmount,
      promoDiscount: pricingResult.promoDiscount,
      totalPrice: pricingResult.totalPrice,
      breakdown: pricingResult.breakdown,
      recommendations: pricingResult.recommendations,
      calculatedAt: new Date().toISOString(),
    };

    // Convert pricing amounts to pence for database storage
    const amountsInPence = {
      totalGBP: poundsToPence(calculatedTotal),
      distanceCostGBP: 0, // No longer calculated
      accessSurchargeGBP: poundsToPence(
        pricingResult.surcharges?.filter((s: any) => s.category === 'access').reduce((sum: number, s: any) => sum + s.amount, 0) || 0
      ),
      weatherSurchargeGBP: 0, // Not implemented in new pricing engine
      itemsSurchargeGBP: poundsToPence(pricingResult.itemsPrice),
    };

    // Create the main booking with unified step tracking
    const booking = await prisma.booking.create({
      data: {
        reference,
        status: 'PENDING_PAYMENT',
        scheduledAt: bookingData.pickupDate ? new Date(bookingData.pickupDate) : 
                     bookingData.scheduledFor ? new Date(bookingData.scheduledFor) : new Date(),
        pickupTimeSlot: bookingData.pickupTimeSlot || null,
        urgency: bookingData.urgency || 'scheduled',
        estimatedDurationMinutes: Math.round(pricingResult.estimatedDuration), // From pricing engine
        crewSize: 'TWO', // Default crew size
        baseDistanceMiles: 0, // Will be calculated
        distanceCostGBP: amountsInPence.distanceCostGBP,
        accessSurchargeGBP: amountsInPence.accessSurchargeGBP,
        weatherSurchargeGBP: amountsInPence.weatherSurchargeGBP,
        itemsSurchargeGBP: amountsInPence.itemsSurchargeGBP,
        crewMultiplierPercent: 0, // Will be calculated
        availabilityMultiplierPercent: 0, // Will be calculated
        totalGBP: amountsInPence.totalGBP,
        promotionCode: bookingData.promotionCode || null,

        // Payment Intent will be created after booking
        stripePaymentIntentId: null,

        // Customer information (using new structure)
        customerName: bookingData.customer.name,
        customerEmail: bookingData.customer.email,
        customerPhone: bookingData.customer.phone,

        // Link to customer account if authenticated
        customerId: customerId,

        // Address references
        pickupAddressId: pickupAddress.id,
        dropoffAddressId: dropoffAddress.id,
        pickupPropertyId: pickupProperty.id,
        dropoffPropertyId: dropoffProperty.id,

      },
    });

    // Booking progress tracking removed - using simple status tracking

    // Create booking items if any
    if (bookingData.items && bookingData.items.length > 0) {
      for (const item of bookingData.items) {
        await prisma.bookingItem.create({
          data: {
            bookingId: booking.id,
            name: item.name,
            quantity: item.quantity || 1,
            volumeM3: item.volumeFactor || 0,
          },
        });
      }
    }

    // Create Stripe Payment Intent with booking ID
    let stripePaymentIntentId: string | null = null;
    
    if (calculatedTotal && calculatedTotal > 0) {
      try {
        const stripe = await import('stripe').then(m => new m.default(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2024-04-10',
        }));

        const paymentIntent = await stripe.paymentIntents.create({
          amount: poundsToPence(calculatedTotal),
          currency: 'gbp',
          metadata: {
            bookingId: booking.id,  // Now booking.id exists
            bookingReference: reference,
            customerEmail: bookingData.customer.email,
            customerName: bookingData.customer.name,
          },
          description: `Speedy Van booking ${reference} - ${bookingData.customer.name}`,
        });

        stripePaymentIntentId = paymentIntent.id;
        
        // Update booking with payment intent ID
        await prisma.booking.update({
          where: { id: booking.id },
          data: { stripePaymentIntentId: paymentIntent.id },
        });
        
        console.log('💳 Created Stripe Payment Intent with booking ID:', {
          paymentIntentId: stripePaymentIntentId,
          bookingId: booking.id,
          bookingReference: reference,
        });
      } catch (error) {
        console.error('❌ Failed to create Payment Intent:', error);
        // Continue without payment intent - can be created later
      }
    }

    // Save pricing snapshot for audit and analysis
    try {
      const { PricingSnapshotService } = await import('@/lib/services/pricing-snapshot-service');
      
      await PricingSnapshotService.createPricingSnapshot(
        booking.id,
        {
          amountGbpMinor: poundsToPence(pricingResult.totalPrice),
          subtotalBeforeVat: poundsToPence(pricingResult.subtotalBeforeVAT),
          vatRate: pricingResult.vatRate,
          breakdown: pricingResult.breakdown,
        } as any,
        {
          pickupAddress: bookingData.pickupAddress,
          dropoffAddress: bookingData.dropoffAddress,
          items: bookingData.items,
          urgency: bookingData.urgency,
          scheduledDate: bookingData.pickupDate || bookingData.scheduledFor,
          serviceType,
          customerSegment,
          loyaltyTier,
          multipliers: pricingResult.multipliers,
          frontendPrice: bookingData.pricing.total,
          backendPrice: pricingResult.totalPrice,
          priceDifference: priceDifference,
          priceDifferencePercent: priceDifferencePercent,
        },
        'uk-default'
      );

      console.log('✅ Pricing snapshot saved for booking:', booking.id);
    } catch (error) {
      console.error('⚠️ Failed to save pricing snapshot:', error);
      // Non-critical error, continue
    }

    // Create audit log entry (only if user is authenticated)
    if (customerId) {
      await prisma.auditLog.create({
        data: {
          actorId: customerId,
          actorRole: 'customer',
          action: 'booking_created',
          targetType: 'booking',
          targetId: booking.id,
          userId: customerId,
          details: {
            reference: booking.reference,
            customerName: bookingData.customer.name,
            customerEmail: bookingData.customer.email,
            totalAmount: pricingResult.totalPrice,
            itemsCount: bookingData.items?.length || 0,
            createdAt: new Date().toISOString(),
            linkedToAccount: 'Yes',
            pricingEngine: 'dynamic',
            multipliers: pricingResult.multipliers,
            confidence: pricingResult.confidence,
          },
        },
      });
    }

    console.log('✅ Booking created successfully:', {
      id: booking.id,
      reference: booking.reference,
      customer: bookingData.customer.name,
      total: pricingResult.totalPrice,
      linkedToAccount: customerId ? 'Yes' : 'No',
    });

    // Process post-booking activities (email, SMS, notifications)
    console.log('🚀 Starting post-booking processing...');
    
    // Notify available drivers about new job
    try {
      await notifyAvailableDrivers({
        bookingId: booking.id,
        reference: booking.reference,
        customerName: bookingData.customer.name,
        pickupAddress: bookingData.pickupAddress.street,
        pickupPostcode: bookingData.pickupAddress.postcode,
        dropoffAddress: bookingData.dropoffAddress.street,
        dropoffPostcode: bookingData.dropoffAddress.postcode,
        totalPrice: calculatedTotal || 0,
        scheduledAt: booking.scheduledAt,
      });
    } catch (notificationError) {
      console.error('⚠️ Failed to notify drivers:', notificationError);
      // Don't fail the booking if notification fails
    }

    // Return the created booking with all details
    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        reference: booking.reference,
        status: booking.status,
        customer: {
          name: bookingData.customer.name,
          email: bookingData.customer.email,
          phone: bookingData.customer.phone,
        },
        addresses: {
          pickup: {
            line1: bookingData.pickupAddress.street,
            address: bookingData.pickupAddress.street,
            city: bookingData.pickupAddress.city,
            postcode: bookingData.pickupAddress.postcode,
          },
          dropoff: {
            line1: bookingData.dropoffAddress.street,
            address: bookingData.dropoffAddress.street,
            city: bookingData.dropoffAddress.city,
            postcode: bookingData.dropoffAddress.postcode,
          },
        },
        properties: {
          pickup: {
            type: bookingData.pickupDetails?.type,
            floor: bookingData.pickupDetails?.floors,
            hasLift: bookingData.pickupDetails?.hasLift,
          },
          dropoff: {
            type: bookingData.dropoffDetails?.type,
            floor: bookingData.dropoffDetails?.floors,
            hasLift: bookingData.dropoffDetails?.hasLift,
          },
        },
        schedule: {
          date: bookingData.scheduledFor,
          timeSlot: 'morning', // Default time slot
        },
        items: bookingData.items || [],
        pricing: {
          basePrice: pricingResult.basePrice || 0,
          extrasCost: 0,
          vat: pricingResult.vatAmount || 0,
          total: calculatedTotal || 0,
          // Include both formats for compatibility
          totalPounds: calculatedTotal || 0,
          totalPence: amountsInPence.totalGBP,
        },
        payment: {
          stripePaymentIntentId: stripePaymentIntentId,
          status: 'pending',
          amountPounds: calculatedTotal || 0,
          amountPence: amountsInPence.totalGBP,
        },
        createdAt: booking.createdAt,
        linkedToAccount: customerId ? true : false,
      },
    });
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    
    // Handle different types of errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: 'Invalid data provided',
          validationErrors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        },
        { status: 400 }
      );
    }
    
    // Database constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          error: 'Booking reference conflict',
          details: 'Please try again',
        },
        { status: 409 }
      );
    }
    
    // Generic server error
    return NextResponse.json(
      {
        error: 'Failed to create booking',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
