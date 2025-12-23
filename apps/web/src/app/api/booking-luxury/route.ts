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
import { AdditionalPaymentStatus, PropertyType } from '@prisma/client';
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
        DriverAvailability: { status: 'online' },
        User: { isActive: true },
      },
      select: {
        id: true,
        User: {
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
        console.log(`✅ Notification sent to driver ${driver.id} (${driver.User?.name || 'Unknown'})`);
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

    // Determine service type - prioritize frontend selection, fallback to urgency
    let serviceType: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' = 'STANDARD';
    
    // ✅ CRITICAL: Use serviceType from frontend (Step 3 selection) if provided
    const frontendServiceType = bookingData.serviceType?.toLowerCase();
    if (frontendServiceType === 'economy') {
      serviceType = 'ECONOMY';
    } else if (frontendServiceType === 'express' || frontendServiceType === 'priority') {
      serviceType = 'PREMIUM';
    } else if (frontendServiceType === 'standard') {
      serviceType = 'STANDARD';
    } else if (bookingData.urgency === 'same-day') {
      // Fallback to urgency-based detection
      serviceType = 'ENTERPRISE';
    } else if (bookingData.urgency === 'next-day') {
      serviceType = 'PREMIUM';
    } else if (bookingData.urgency === 'scheduled') {
      serviceType = 'ECONOMY';
    }
    
    console.log('🎯 Service type determined:', {
      frontendServiceType: bookingData.serviceType,
      resolvedServiceType: serviceType,
      urgency: bookingData.urgency,
    });

    // Determine if this should be a multi-drop booking (Economy service)
    const isEconomyService = serviceType === 'ECONOMY';
    const shouldBeMultiDrop = isEconomyService;
    
    // ✅ ECONOMY SERVICE: Adjust scheduled date to be within 7-day window
    // Economy = Shared route, delivered within 7 days (not on specific date)
    let adjustedScheduledDate = bookingData.pickupDate 
      ? new Date(bookingData.pickupDate) 
      : new Date();
    
    if (isEconomyService) {
      // For Economy, set the delivery window end date (7 days from now)
      const deliveryWindowEnd = new Date();
      deliveryWindowEnd.setDate(deliveryWindowEnd.getDate() + 7);
      
      // Use the later of: original date or 7 days from now
      // This ensures Economy orders are scheduled within the 7-day shared route window
      if (adjustedScheduledDate < deliveryWindowEnd) {
        // Keep original date if it's already within 7 days
        console.log('📅 Economy service: Using original date within 7-day window');
      } else {
        // Original date is beyond 7 days, keep it but log
        console.log('📅 Economy service: Original date is beyond 7-day window, keeping as-is');
      }
      
      console.log('📅 Economy service scheduled date:', {
        originalDate: bookingData.pickupDate,
        adjustedDate: adjustedScheduledDate.toISOString(),
        deliveryWindow: '7 days from booking',
      });
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

    // Check if multi-leg booking with segments
    const rawSegments = (rawData.segments || []) as any[];
    
    // Validate segment structure for multi-leg bookings
    const validateSegment = (segment: any, index: number): { valid: boolean; errors: string[] } => {
      const errors: string[] = [];
      
      if (!segment.pickupAddress?.postcode) {
        errors.push(`Segment ${index + 1}: Missing pickup postcode`);
      }
      if (!segment.dropoffAddress?.postcode) {
        errors.push(`Segment ${index + 1}: Missing dropoff postcode`);
      }
      if (!segment.segmentType || !['outbound', 'return', 'additional'].includes(segment.segmentType)) {
        errors.push(`Segment ${index + 1}: Invalid segment type`);
      }
      if (!Array.isArray(segment.items)) {
        errors.push(`Segment ${index + 1}: Items must be an array`);
      }
      
      return { valid: errors.length === 0, errors };
    };
    
    // Validate all segments
    if (rawSegments.length > 1) {
      const segmentErrors: string[] = [];
      rawSegments.forEach((segment, index) => {
        const validation = validateSegment(segment, index);
        if (!validation.valid) {
          segmentErrors.push(...validation.errors);
        }
      });
      
      if (segmentErrors.length > 0) {
        console.error('❌ Segment validation errors:', segmentErrors);
        // Log but don't fail - allow booking to proceed with best-effort pricing
      }
    }
    
    const isMultiLeg = rawSegments && rawSegments.length > 1;
    let dynamicPricingResult: any;
    let aggregatedPricing = {
      finalPrice: 0,
      basePrice: 0,
      breakdown: {
        itemsCost: 0,
        timeCost: 0,
        surcharges: 0,
        discounts: 0,
      },
      dynamicMultipliers: {},
      confidence: 1.0,
      validUntil: new Date(Date.now() + 30 * 60 * 1000),
      capacityCheck: { fits: true },
      recommendations: [],
    };

    if (isMultiLeg) {
      console.log(`🚗 Multi-leg booking detected: ${rawSegments.length} segments`);
      
      // ✅ FIXED: Calculate pricing for each segment with proper item handling
      for (let i = 0; i < rawSegments.length; i++) {
        const segment = rawSegments[i];
        const segmentPickup = segment.pickupAddress;
        const segmentDropoff = segment.dropoffAddress;
        
        // ✅ CRITICAL FIX: Ensure items exist for each segment
        // If segment has no items, use items from first segment or global items
        let segmentItems = segment.items || [];
        if (!segmentItems || segmentItems.length === 0) {
          // Fallback to first segment items
          if (rawSegments[0]?.items && Array.isArray(rawSegments[0].items) && rawSegments[0].items.length > 0) {
            segmentItems = rawSegments[0].items;
            console.log(`⚠️ Segment ${i + 1} has no items, using items from first segment`);
          } else if (pricingItems && pricingItems.length > 0) {
            // Fallback to global items
            segmentItems = pricingItems;
            console.log(`⚠️ Segment ${i + 1} has no items, using global items`);
          } else {
            console.error(`❌ Segment ${i + 1} has no items and no fallback available`);
            throw new Error(`Segment ${i + 1} must have items`);
          }
        }
        
        const segmentDatetime = segment.datetime ? new Date(segment.datetime) : new Date();

        console.log(`📍 Calculating segment ${i + 1}: ${segmentPickup?.postcode || 'N/A'} → ${segmentDropoff?.postcode || 'N/A'}`, {
          itemsCount: segmentItems.length,
          totalQuantity: segmentItems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
        });

        // ✅ CRITICAL FIX: Validate addresses before pricing
        if (!segmentPickup?.postcode || !segmentDropoff?.postcode) {
          console.error(`❌ Segment ${i + 1} missing addresses:`, {
            pickup: segmentPickup?.postcode || 'missing',
            dropoff: segmentDropoff?.postcode || 'missing'
          });
          throw new Error(`Segment ${i + 1} must have valid pickup and dropoff addresses`);
        }

        const segmentPricingResult = await dynamicPricingEngine.calculateDynamicPrice({
          pickupAddress: {
            address: segmentPickup.street || segmentPickup.address || segmentPickup.line1 || '',
            postcode: segmentPickup.postcode || '',
            coordinates: segmentPickup.coordinates,
          },
          dropoffAddress: {
            address: segmentDropoff.street || segmentDropoff.address || segmentDropoff.line1 || '',
            postcode: segmentDropoff.postcode || '',
            coordinates: segmentDropoff.coordinates,
          },
          scheduledDate: segmentDatetime,
          serviceType,
          customerSegment,
          loyaltyTier,
          items: segmentItems.map((item: any) => ({
            name: item.name || 'Item',
            category: item.category || 'general',
            quantity: item.quantity || 1,
            weight: item.weight || 0,
            volume: item.volumeFactor || item.volume || 0,
            fragile: item.fragile || item.fragility_level === 'High' || item.fragility_level === 'Medium',
          })),
          customerId: customerId || undefined,
        });

        // Aggregate pricing
        aggregatedPricing.finalPrice += segmentPricingResult.finalPrice;
        aggregatedPricing.basePrice += segmentPricingResult.basePrice;
        aggregatedPricing.breakdown.itemsCost += segmentPricingResult.breakdown.itemsCost;
        aggregatedPricing.breakdown.timeCost += segmentPricingResult.breakdown.timeCost;
        aggregatedPricing.breakdown.surcharges += segmentPricingResult.breakdown.surcharges;
        aggregatedPricing.breakdown.discounts += segmentPricingResult.breakdown.discounts;

        console.log(`✅ Segment ${i + 1} price: £${segmentPricingResult.finalPrice.toFixed(2)}`, {
          itemsCount: segmentItems.length,
          basePrice: segmentPricingResult.basePrice,
          finalPrice: segmentPricingResult.finalPrice
        });
      }

      dynamicPricingResult = aggregatedPricing;
      console.log(`💰 Total multi-leg price: £${aggregatedPricing.finalPrice.toFixed(2)}`, {
        segmentsCount: rawSegments.length,
        averagePricePerSegment: (aggregatedPricing.finalPrice / rawSegments.length).toFixed(2)
      });
    } else {
      // Single journey - original logic
      dynamicPricingResult = await dynamicPricingEngine.calculateDynamicPrice({
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
    }

    console.log('✅ Dynamic pricing calculated:', {
      basePrice: dynamicPricingResult.basePrice,
      finalPrice: dynamicPricingResult.finalPrice,
      multipliers: dynamicPricingResult.dynamicMultipliers,
      confidence: dynamicPricingResult.confidence,
      isMultiLeg,
      segments: isMultiLeg ? rawSegments.length : 1,
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
      capacityCheck: dynamicPricingResult.capacityCheck, // Include capacity check
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

    // Map frontend crewSize to database enum FIRST (before price calculation)
    const crewSizeMap: Record<string, 'ONE' | 'TWO' | 'THREE' | 'FOUR'> = {
      '1': 'ONE',
      '2': 'TWO',
      '3': 'THREE',
      '4': 'FOUR',
    };
    const mappedCrewSize = crewSizeMap[bookingData.crewSize || '2'] || 'TWO';
    
    // Calculate crew multiplier (affects price)
    const crewMultipliers: Record<string, number> = {
      'ONE': 0,    // Base price (1 man)
      'TWO': 0,    // Standard (included in base)
      'THREE': 25, // +25%
      'FOUR': 50,  // +50%
    };
    const crewMultiplierPercent = crewMultipliers[mappedCrewSize] || 0;
    
    // Apply crew multiplier to the total price
    const baseTotal = pricingResult.totalPrice;
    const crewSurcharge = baseTotal * (crewMultiplierPercent / 100);
    const calculatedTotal = baseTotal + crewSurcharge;
    
    console.log('👷 Crew size pricing:', {
      frontend: bookingData.crewSize,
      mapped: mappedCrewSize,
      multiplierPercent: crewMultiplierPercent,
      baseTotal: baseTotal.toFixed(2),
      crewSurcharge: crewSurcharge.toFixed(2),
      finalTotal: calculatedTotal.toFixed(2),
    });

    // Store pricing breakdown for future reference (including crew surcharge)
    pricingBreakdown = {
      basePrice: pricingResult.basePrice,
      distancePrice: 0, // No longer calculated
      itemsPrice: pricingResult.itemsPrice,
      timePrice: pricingResult.servicePrice,
      urgencyPrice: pricingResult.urgencyPrice,
      crewSurcharge: crewSurcharge, // NEW: Crew size surcharge
      crewSize: mappedCrewSize, // NEW: Selected crew size
      subtotalBeforeVAT: calculatedTotal / 1.2, // Updated with crew surcharge
      vatAmount: calculatedTotal - (calculatedTotal / 1.2), // Updated with crew surcharge
      promoDiscount: pricingResult.promoDiscount,
      totalPrice: calculatedTotal, // Updated with crew surcharge
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

    // Calculate distance and duration from coordinates
    let pickupLat = rawPickupAddress.coordinates?.lat || 0;
    let pickupLng = rawPickupAddress.coordinates?.lng || 0;
    let dropoffLat = rawDropoffAddress.coordinates?.lat || 0;
    let dropoffLng = rawDropoffAddress.coordinates?.lng || 0;
    
    // ✅ FALLBACK: If coordinates are missing, geocode the addresses
    if (pickupLat === 0 || pickupLng === 0) {
      console.warn('⚠️ Pickup coordinates missing, attempting geocoding...');
      try {
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (mapboxToken) {
          const pickupQuery = encodeURIComponent(
            `${bookingData.pickupAddress.street || ''} ${bookingData.pickupAddress.postcode || ''}`.trim()
          );
          const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${pickupQuery}.json?country=gb&limit=1&access_token=${mapboxToken}`;
          const geoResponse = await fetch(geocodeUrl);
          const geoData = await geoResponse.json();
          
          if (geoData.features && geoData.features.length > 0) {
            pickupLat = geoData.features[0].center[1];
            pickupLng = geoData.features[0].center[0];
            console.log(`✅ Geocoded pickup: ${pickupLat}, ${pickupLng}`);
          }
        }
      } catch (geoError) {
        console.error('❌ Geocoding failed for pickup:', geoError);
      }
    }
    
    if (dropoffLat === 0 || dropoffLng === 0) {
      console.warn('⚠️ Dropoff coordinates missing, attempting geocoding...');
      try {
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (mapboxToken) {
          const dropoffQuery = encodeURIComponent(
            `${bookingData.dropoffAddress.street || ''} ${bookingData.dropoffAddress.postcode || ''}`.trim()
          );
          const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${dropoffQuery}.json?country=gb&limit=1&access_token=${mapboxToken}`;
          const geoResponse = await fetch(geocodeUrl);
          const geoData = await geoResponse.json();
          
          if (geoData.features && geoData.features.length > 0) {
            dropoffLat = geoData.features[0].center[1];
            dropoffLng = geoData.features[0].center[0];
            console.log(`✅ Geocoded dropoff: ${dropoffLat}, ${dropoffLng}`);
          }
        }
      } catch (geoError) {
        console.error('❌ Geocoding failed for dropoff:', geoError);
      }
    }
    
    // Calculate distance using Haversine formula
    let distanceMeters = 0;
    let durationSeconds = 0;
    
    if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
      const R = 6371000; // Earth radius in meters
      const dLat = (dropoffLat - pickupLat) * Math.PI / 180;
      const dLon = (dropoffLng - pickupLng) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(pickupLat * Math.PI / 180) * Math.cos(dropoffLat * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      distanceMeters = Math.round(R * c);
      
      // Estimate duration: distance/speed + stops
      // Average 30 mph = 13.4 m/s, plus 15 min for loading/unloading
      durationSeconds = Math.round((distanceMeters / 13.4) + (15 * 60));
      
      console.log('📏 Calculated distance/duration:', {
        distanceMeters,
        distanceMiles: (distanceMeters / 1609.34).toFixed(2),
        durationSeconds,
        durationMinutes: Math.round(durationSeconds / 60)
      });
    }

    // rawSegments and isMultiLeg already defined above, no need to redefine
    console.log('📦 Multi-leg booking check:', {
      hasSegments: rawSegments.length > 0,
      segmentCount: rawSegments.length,
      isMultiLeg,
    });

    // Create the main booking with unified step tracking and multi-leg support
    const booking = await prisma.booking.create({
      data: {
        reference,
        status: 'PENDING_PAYMENT',
        scheduledAt: bookingData.pickupDate ? new Date(bookingData.pickupDate) : 
                     bookingData.scheduledFor ? new Date(bookingData.scheduledFor) : new Date(),
        pickupTimeSlot: bookingData.pickupTimeSlot || null,
        urgency: bookingData.urgency || 'scheduled',
        estimatedDurationMinutes: Math.round(pricingResult.estimatedDuration), // From pricing engine
        crewSize: mappedCrewSize, // From frontend selection
        baseDistanceMiles: distanceMeters > 0 ? Math.round((distanceMeters / 1609.34) * 10) / 10 : 0,
        distanceMeters: distanceMeters, // ✅ NOW SAVED!
        durationSeconds: durationSeconds, // ✅ NOW SAVED!
        pickupLat: pickupLat,
        pickupLng: pickupLng,
        dropoffLat: dropoffLat,
        dropoffLng: dropoffLng,
        distanceCostGBP: amountsInPence.distanceCostGBP,
        accessSurchargeGBP: amountsInPence.accessSurchargeGBP,
        weatherSurchargeGBP: amountsInPence.weatherSurchargeGBP,
        itemsSurchargeGBP: amountsInPence.itemsSurchargeGBP,
        crewMultiplierPercent: crewMultiplierPercent, // Calculated from crew size
        availabilityMultiplierPercent: 0, // Will be calculated
        totalGBP: amountsInPence.totalGBP,
        
        // ✅ Multi-leg booking support
        isMultiLeg: isMultiLeg,
        totalSegments: isMultiLeg ? rawSegments.length : 1,
        
        // ✅ FIX: Save service type explicitly for routing logic
        serviceType: serviceType,
        isEconomyService: isEconomyService,
        shouldBeMultiDrop: shouldBeMultiDrop,
        orderType: shouldBeMultiDrop ? 'multi-drop-pending' : 'single',

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

        // ✅ Customer special instructions
        notes: bookingData.notes || null,

        customerPreferences: {
          serviceType: serviceType.toLowerCase(),
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
          capacityCheck: pricingResult.capacityCheck, // Store capacity check for admin
        },

        // Additional payment tracking
        additionalPaymentStatus: AdditionalPaymentStatus.NONE,
        additionalPaymentAmountGBP: 0,

      },
    });

    // Booking progress tracking removed - using simple status tracking

    // ✅ Create booking segments if this is a multi-leg booking
    if (isMultiLeg && rawSegments.length > 0) {
      console.log('🚀 Creating booking segments:', rawSegments.length);
      
      for (let i = 0; i < rawSegments.length; i++) {
        const segment = rawSegments[i];
        
        try {
          // Create segment addresses
          const segmentPickupAddress = await prisma.bookingAddress.create({
            data: {
              label: segment.pickupAddress?.street || segment.pickupAddress?.postcode || 'Segment Pickup',
              postcode: segment.pickupAddress?.postcode || '',
              lat: segment.pickupAddress?.coordinates?.lat || 0,
              lng: segment.pickupAddress?.coordinates?.lng || 0,
            },
          });
          
          const segmentDropoffAddress = await prisma.bookingAddress.create({
            data: {
              label: segment.dropoffAddress?.street || segment.dropoffAddress?.postcode || 'Segment Dropoff',
              postcode: segment.dropoffAddress?.postcode || '',
              lat: segment.dropoffAddress?.coordinates?.lat || 0,
              lng: segment.dropoffAddress?.coordinates?.lng || 0,
            },
          });
          
          // Create segment properties
          const segmentPickupProperty = await prisma.propertyDetails.create({
            data: {
              propertyType: mapPropertyTypeToPrisma(segment.pickupProperty?.type || 'house') as any,
              floors: segment.pickupProperty?.floors || 0,
              accessType: segment.pickupProperty?.hasLift ? 'WITH_LIFT' : 'WITHOUT_LIFT',
            },
          });
          
          const segmentDropoffProperty = await prisma.propertyDetails.create({
            data: {
              propertyType: mapPropertyTypeToPrisma(segment.dropoffProperty?.type || 'house') as any,
              floors: segment.dropoffProperty?.floors || 0,
              accessType: segment.dropoffProperty?.hasLift ? 'WITH_LIFT' : 'WITHOUT_LIFT',
            },
          });
          
          // Create the segment
          await prisma.bookingSegment.create({
            data: {
              bookingId: booking.id,
              segmentType: segment.segmentType || (i === 0 ? 'outbound' : 'additional'),
              sequenceNumber: i,
              pickupAddressId: segmentPickupAddress.id,
              dropoffAddressId: segmentDropoffAddress.id,
              pickupPropertyId: segmentPickupProperty.id,
              dropoffPropertyId: segmentDropoffProperty.id,
              scheduledAt: segment.datetime ? new Date(segment.datetime) : new Date(),
              estimatedArrival: segment.estimatedArrival ? new Date(segment.estimatedArrival) : null,
              items: segment.items || [],
              priceGBP: segment.pricing?.total ? poundsToPence(segment.pricing.total) : 0,
              distanceMeters: segment.distance || null,
              durationSeconds: segment.estimatedDuration || null,
              notes: segment.notes || null,
            },
          });
          
          console.log(`✅ Created segment ${i + 1}/${rawSegments.length}: ${segment.segmentType}`);
        } catch (segmentError) {
          console.error(`❌ Failed to create segment ${i + 1}:`, segmentError);
          // Continue with other segments
        }
      }
    }

    // Create booking items if any
    if (bookingData.items && bookingData.items.length > 0) {
      for (const item of bookingData.items) {
        await prisma.bookingItem.create({
          data: {
            bookingId: booking.id,
            name: item.name,
            quantity: item.quantity || 1,
            volumeM3: item.volumeFactor || 0,
            category: item.category || 'general',
            estimatedVolume: item.volumeFactor || 0,
            estimatedWeight: 0,
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

    // IMPORTANT: Do NOT send email here - it will be sent after payment confirmation via webhook
    // This ensures the email contains the correct final price from Stripe
    console.log('ℹ️ Email will be sent after payment confirmation via webhook');
    console.log('💰 Initial booking total (will be updated by checkout session):', {
      reference: booking.reference,
      currentTotal: booking.totalGBP,
      note: 'Final price will be set by create-checkout-session endpoint'
    });

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
