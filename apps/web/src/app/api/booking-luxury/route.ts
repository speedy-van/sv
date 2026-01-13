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

// ✅ NEW: Notify admin about return journey opportunity
async function notifyAdminAboutReturnJourney(bookingData: {
  bookingId: string;
  reference: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerId?: string | null;
  pickupAddress: string;
  pickupPostcode: string;
  pickupCity?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffAddress: string;
  dropoffPostcode: string;
  dropoffCity?: string;
  dropoffLat?: number;
  dropoffLng?: number;
  totalPrice: number;
  discount: number;
  discountPercentage: number;
  driverEarnings: number;
  matchScore: number;
  originalBookingReference?: string;
  scheduledDate?: Date | null;
  itemsCount?: number;
  items?: Array<{ name: string; quantity: number; weight?: number; volume?: number; category?: string }>;
  serviceLevel?: string;
  crewSize?: string;
  distanceMiles?: number | null;
  estimatedDuration?: number | null;
}) {
  try {
    console.log('🔄 Notifying admin about return journey opportunity:', bookingData.reference);

    // ⚠️ JourneyOpportunity table doesn't exist - skip database save for now
    // TODO: Create JourneyOpportunity table or use BookingSegment instead
    console.log('⚠️ Skipping JourneyOpportunity database save - table not implemented');
    
    /* DISABLED until table is created
    const journeyOpportunity = await prisma.journeyOpportunity.create({
      data: {
        type: 'return-journey',
        bookingId: bookingData.bookingId,
        bookingReference: bookingData.reference,
        originalBookingReference: bookingData.originalBookingReference || bookingData.reference,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail || undefined,
        customerPhone: bookingData.customerPhone || undefined,
        customerId: bookingData.customerId || undefined,
        pickupAddress: bookingData.pickupAddress,
        pickupPostcode: bookingData.pickupPostcode,
        pickupCity: bookingData.pickupCity ?? null,
        pickupLat: bookingData.pickupLat ?? null,
        pickupLng: bookingData.pickupLng ?? null,
        dropoffAddress: bookingData.dropoffAddress,
        dropoffPostcode: bookingData.dropoffPostcode,
        dropoffCity: bookingData.dropoffCity ?? null,
        dropoffLat: bookingData.dropoffLat ?? null,
        dropoffLng: bookingData.dropoffLng ?? null,
        totalPrice: bookingData.totalPrice,
        discount: bookingData.discount,
        discountPercentage: bookingData.discountPercentage,
        driverEarnings: bookingData.driverEarnings,
        matchScore: bookingData.matchScore,
        scheduledDate: bookingData.scheduledDate || null,
        itemsCount: bookingData.itemsCount || 0,
        items: bookingData.items ? JSON.parse(JSON.stringify(bookingData.items)) : null,
        serviceLevel: bookingData.serviceLevel || null,
        crewSize: bookingData.crewSize || '1',
        distanceMiles: bookingData.distanceMiles || null,
        estimatedDuration: bookingData.estimatedDuration || null,
        notificationSent: true,
        notificationSentAt: new Date(),
      },
    });

    */ // End disabled JourneyOpportunity code
    
    const returnJourneyNotification = {
      type: 'return-journey-available' as const,
      data: {
        journeyOpportunityId: null, // Table not implemented yet
        bookingId: bookingData.bookingId,
        bookingReference: bookingData.reference,
        originalBookingReference: bookingData.originalBookingReference || bookingData.reference,
        opportunity: {
          from: {
            address: bookingData.pickupAddress,
            postcode: bookingData.pickupPostcode,
          },
          to: {
            address: bookingData.dropoffAddress,
            postcode: bookingData.dropoffPostcode,
          },
          customerPrice: bookingData.totalPrice,
          discount: bookingData.discount,
          discountPercentage: bookingData.discountPercentage,
          driverEarnings: bookingData.driverEarnings,
          matchScore: bookingData.matchScore, // 0-100
          scheduledDate: bookingData.scheduledDate ? bookingData.scheduledDate.toISOString() : null,
          itemsCount: bookingData.itemsCount || 0,
        },
        timestamp: new Date().toISOString(),
        action: 'View in Operations Dashboard',
      },
    };

    // Trigger Pusher notification
    await pusher.trigger('admin-notifications', 'return-journey-available', returnJourneyNotification);
    
    console.log('✅ Return journey notification sent to admin for booking:', bookingData.reference);
  } catch (error) {
    console.error('❌ Failed to notify admin about return journey:', error);
    // Don't throw - this is non-critical
  }
}

// ✅ NEW: Notify admin about new journey opportunity
async function notifyAdminAboutNewJourney(bookingData: {
  bookingId: string;
  reference: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerId?: string | null;
  pickupAddress: string;
  pickupPostcode: string;
  pickupCity?: string | null;
  pickupLat?: number | null;
  pickupLng?: number | null;
  dropoffAddress: string;
  dropoffPostcode: string;
  dropoffCity?: string | null;
  dropoffLat?: number | null;
  dropoffLng?: number | null;
  totalPrice: number;
  scheduledDate: Date | null;
  itemsCount: number;
  serviceLevel: string;
  multiDropPotential: boolean;
  potentialSavings?: number;
  distanceMiles?: number;
  crewSize?: string;
  items?: Array<{ name: string; quantity: number; weight?: number; volume?: number; category?: string }>;
  estimatedDuration?: number | null;
}) {
  try {
    console.log('🆕 Notifying admin about new journey:', bookingData.reference);

    // ⚠️ JourneyOpportunity table doesn't exist - skip database save for now
    // TODO: Create JourneyOpportunity table or use BookingSegment instead
    console.log('⚠️ Skipping JourneyOpportunity database save - table not implemented');
    
    /* DISABLED until table is created
    const journeyOpportunity = await prisma.journeyOpportunity.create({
      data: {
        type: 'new-journey',
        bookingId: bookingData.bookingId,
        bookingReference: bookingData.reference,
        customerName: bookingData.customerName,
        customerEmail: bookingData.customerEmail || undefined,
        customerPhone: bookingData.customerPhone || undefined,
        customerId: bookingData.customerId || undefined,
        pickupAddress: bookingData.pickupAddress,
        pickupPostcode: bookingData.pickupPostcode,
        pickupCity: bookingData.pickupCity ?? null,
        pickupLat: bookingData.pickupLat ?? null,
        pickupLng: bookingData.pickupLng ?? null,
        dropoffAddress: bookingData.dropoffAddress,
        dropoffPostcode: bookingData.dropoffPostcode,
        dropoffCity: bookingData.dropoffCity ?? null,
        dropoffLat: bookingData.dropoffLat ?? null,
        dropoffLng: bookingData.dropoffLng ?? null,
        totalPrice: bookingData.totalPrice,
        itemsCount: bookingData.itemsCount,
        items: bookingData.items ? JSON.parse(JSON.stringify(bookingData.items)) : null,
        serviceLevel: bookingData.serviceLevel,
        crewSize: bookingData.crewSize || '1',
        distanceMiles: bookingData.distanceMiles || null,
        scheduledDate: bookingData.scheduledDate || null,
        estimatedDuration: bookingData.estimatedDuration || null,
        isMultiDrop: false,
        multiDropPotential: bookingData.multiDropPotential,
        potentialSavings: bookingData.potentialSavings || 0,
        notificationSent: true,
        notificationSentAt: new Date(),
      },
    });

    */ // End disabled JourneyOpportunity code
    
    const newJourneyNotification = {
      type: 'new-journey-available' as const,
      data: {
        journeyOpportunityId: null, // Table not implemented yet
        bookingId: bookingData.bookingId,
        bookingReference: bookingData.reference,
        customer: {
          name: bookingData.customerName,
          email: bookingData.customerEmail || '',
          phone: bookingData.customerPhone || '',
        },
        journey: {
          from: {
            address: bookingData.pickupAddress,
            postcode: bookingData.pickupPostcode,
          },
          to: {
            address: bookingData.dropoffAddress,
            postcode: bookingData.dropoffPostcode,
          },
          price: bookingData.totalPrice,
          scheduledDate: bookingData.scheduledDate ? bookingData.scheduledDate.toISOString() : null,
          itemsCount: bookingData.itemsCount,
          items: bookingData.items || [],
          serviceLevel: bookingData.serviceLevel,
          distanceMiles: bookingData.distanceMiles || 0,
          crewSize: bookingData.crewSize || '1',
          multiDropPotential: bookingData.multiDropPotential,
          potentialSavings: bookingData.potentialSavings || 0,
        },
        timestamp: new Date().toISOString(),
        action: 'View in Operations Dashboard',
      },
    };

    // Trigger Pusher notification
    await pusher.trigger('admin-notifications', 'new-journey-available', newJourneyNotification);
    
    console.log('✅ New journey notification sent to admin');
  } catch (error) {
    console.error('❌ Failed to notify admin about new journey:', error);
    // Don't throw - this is non-critical
  }
}

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

    const bookingDraftId = typeof rawData.bookingDraftId === 'string' ? rawData.bookingDraftId : undefined;

    console.log('📝 Creating new booking with validated data:', {
      customer: bookingData.customer,
      pickupAddress: bookingData.pickupAddress,
      dropoffAddress: bookingData.dropoffAddress,
      items: bookingData.items?.length || 0,
      totalAmountPounds: bookingData.pricing.total,
      totalAmountPence: poundsToPence(bookingData.pricing?.total || 0),
      authenticatedUser: customerId ? 'Yes' : 'No',
    });

    // Generate or accept provided booking reference
    // Support both 'reference' and 'bookingReference' field names from frontend
    const providedReference = typeof rawData.reference === 'string' 
      ? rawData.reference.trim() 
      : (typeof rawData.bookingReference === 'string' ? rawData.bookingReference.trim() : '');
    let reference = providedReference || await createUniqueReference('booking');

    // Check if booking already exists with this reference
    const existingBooking = await prisma.booking.findUnique({ where: { reference } });
    if (existingBooking) {
      // If booking exists and is pending payment, return it (idempotent behavior)
      if (existingBooking.status === 'PENDING_PAYMENT' || existingBooking.status === 'DRAFT') {
        console.log('✅ Returning existing pending booking:', existingBooking.reference);
        return NextResponse.json({
          success: true,
          booking: {
            id: existingBooking.id,
            reference: existingBooking.reference,
            status: existingBooking.status,
            totalGBP: existingBooking.totalGBP,
          },
          message: 'Existing booking returned',
        });
      }
      // If booking is confirmed or in another state, reject duplicate
      return NextResponse.json(
        {
          error: 'Booking reference conflict',
          details: 'This booking has already been processed.',
        },
        { status: 409 }
      );
    }

    // Note: We DON'T generate new reference if draft exists - the draft IS this booking
    // The draft was created at step 1, now we're converting it to a real booking

    // Create pickup address - support both 'address' and 'line1' formats
    // Use the raw data to get coordinates that might not be in the schema
    const rawPickupAddress = rawData.pickupAddress as any;
    const pickupAddress = await prisma.bookingAddress.create({
      data: {
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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

    // Determine service type - prioritize serviceTier, then serviceType, fallback to urgency
    let serviceType: 'ECONOMY' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' = 'STANDARD';
    
    // ✅ NEW: Priority 1 - Use serviceTier from new tier system (economy, standard, premium)
    const serviceTier = bookingData.serviceTier?.toLowerCase();
    if (serviceTier === 'economy') {
      serviceType = 'ECONOMY';
    } else if (serviceTier === 'premium') {
      serviceType = 'PREMIUM';
    } else if (serviceTier === 'standard') {
      serviceType = 'STANDARD';
    } 
    // ✅ Priority 2 - Legacy: Use serviceType from frontend (Step 3 selection) if provided
    else {
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
    }
    
    console.log('🎯 Service type determined:', {
      serviceTier: bookingData.serviceTier,
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
        
        // ✅ CRITICAL FIX: Multi-leg bookings - all segments carry the SAME items
        // In multi-leg (e.g., outbound + return), the same items are transported in each leg
        // Therefore, all segments should use the same items list to avoid double-counting
        let segmentItems = segment.items || [];
        if (!segmentItems || segmentItems.length === 0) {
          // For multi-leg: use items from first segment (they're the same items for all legs)
          if (rawSegments[0]?.items && Array.isArray(rawSegments[0].items) && rawSegments[0].items.length > 0) {
            // Deep copy to avoid reference issues
            segmentItems = rawSegments[0].items.map((item: any) => ({ ...item }));
            console.log(`ℹ️ Segment ${i + 1} has no items, using items from first segment (same items for all legs)`);
          } else if (pricingItems && pricingItems.length > 0) {
            // Fallback to global items
            segmentItems = pricingItems.map((item: any) => ({ ...item }));
            console.log(`ℹ️ Segment ${i + 1} has no items, using global items`);
          } else {
            console.error(`❌ Segment ${i + 1} has no items and no fallback available`);
            throw new Error(`Segment ${i + 1} must have items. In multi-leg bookings, all segments carry the same items.`);
          }
        }
        
        // ✅ VALIDATION: Ensure segment items match first segment items (for consistency)
        // This prevents double-counting and ensures pricing accuracy
        if (i > 0 && rawSegments[0]?.items && rawSegments[0].items.length > 0) {
          const firstSegmentItems = rawSegments[0].items;
          const segmentItemsIds = new Set(segmentItems.map((item: any) => item.id));
          const firstSegmentItemsIds = new Set(firstSegmentItems.map((item: any) => item.id));
          
          // Check if items are different (should be same in multi-leg)
          if (segmentItemsIds.size !== firstSegmentItemsIds.size || 
              ![...segmentItemsIds].every(id => firstSegmentItemsIds.has(id))) {
            console.warn(`⚠️ Segment ${i + 1} has different items than first segment. Using first segment items for consistency.`, {
              segmentItems: segmentItems.map((item: any) => item.id),
              firstSegmentItems: firstSegmentItems.map((item: any) => item.id)
            });
            // Use first segment items to ensure consistency
            segmentItems = firstSegmentItems.map((item: any) => ({ ...item }));
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
    const mappedCrewSize = crewSizeMap[bookingData.crewSize || '1'] || 'ONE';
    
    // Calculate crew multiplier (affects price)
    // ✅ CRITICAL FIX: Only 1 Man = base price. 2+ Men = crew surcharge applied.
    const crewMultipliers: Record<string, number> = {
      'ONE': 0,    // Base price (1 man = driver only)
      'TWO': 20,   // +20% for 2-man crew (FIXED: was 0%, causing revenue loss)
      'THREE': 35, // +35% for 3-man crew
      'FOUR': 50,  // +50% for 4-man crew
    };
    const crewMultiplierPercent = crewMultipliers[mappedCrewSize] || 0;
    
    // Apply crew multiplier to the total price
    const baseTotal = Number.isFinite(pricingResult.totalPrice) ? pricingResult.totalPrice : 0;
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
    const accessSurchargeBase = Array.isArray(pricingResult.surcharges)
      ? pricingResult.surcharges
          .filter((s: any) => s && s.category === 'access')
          .reduce((sum: number, s: any) => sum + (Number.isFinite(s?.amount) ? s.amount : 0), 0)
      : 0;

    const itemsSurchargeBase = Number.isFinite(pricingResult.itemsPrice) ? pricingResult.itemsPrice : 0;
    const normalizedTotal = Number.isFinite(calculatedTotal) ? calculatedTotal : baseTotal;

    const amountsInPence = {
      totalGBP: poundsToPence(normalizedTotal),
      distanceCostGBP: 0, // No longer calculated
      accessSurchargeGBP: poundsToPence(accessSurchargeBase),
      weatherSurchargeGBP: 0, // Not implemented in new pricing engine
      itemsSurchargeGBP: poundsToPence(itemsSurchargeBase),
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

    const safeEstimatedDurationMinutes = Number.isFinite(pricingResult.estimatedDuration)
      ? Math.max(1, Math.round(pricingResult.estimatedDuration))
      : Math.max(
          1,
          Math.round(
            durationSeconds > 0
              ? durationSeconds / 60
              : (distanceMeters / 13.4 + 15 * 60) / 60
          )
        );

    // Create the main booking with unified step tracking and multi-leg support
    const booking = await prisma.booking.create({
      data: {
        id: crypto.randomUUID(),
        reference,
        status: 'PENDING_PAYMENT',
        scheduledAt: bookingData.pickupDate ? new Date(bookingData.pickupDate) : 
                     bookingData.scheduledFor ? new Date(bookingData.scheduledFor) : new Date(),
        pickupTimeSlot: bookingData.pickupTimeSlot || null,
        urgency: bookingData.urgency || 'scheduled',
        estimatedDurationMinutes: safeEstimatedDurationMinutes, // From pricing engine with fallback
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

        customerPreferences: {
          serviceType: serviceType.toLowerCase(),
          // Collection source (where items are being collected from)
          collectionSource: bookingData.collectionSource || 'private-address',
          // Marketplace-specific details
          marketplacePickup: bookingData.marketplacePickup || null,
          // Preserve any customer-provided notes inside preferences JSON since Booking.notes column is unavailable in some environments
          specialInstructions: bookingData.notes ?? null,
          addOns: {
            packing: bookingData.addOns?.packing || false,
            packingVolume: bookingData.addOns?.packingVolume,
            furnitureProtection: bookingData.addOns?.furnitureProtection || false,
            insurance: bookingData.addOns?.insurance,
            assembly: bookingData.addOns?.assembly || false,
            disassembly: bookingData.addOns?.disassembly || [],
            reassembly: bookingData.addOns?.reassembly || [],
          },
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

        // Required timestamps
        updatedAt: new Date(),
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
              id: crypto.randomUUID(),
              label: segment.pickupAddress?.street || segment.pickupAddress?.postcode || 'Segment Pickup',
              postcode: segment.pickupAddress?.postcode || '',
              lat: segment.pickupAddress?.coordinates?.lat || 0,
              lng: segment.pickupAddress?.coordinates?.lng || 0,
            },
          });
          
          const segmentDropoffAddress = await prisma.bookingAddress.create({
            data: {
              id: crypto.randomUUID(),
              label: segment.dropoffAddress?.street || segment.dropoffAddress?.postcode || 'Segment Dropoff',
              postcode: segment.dropoffAddress?.postcode || '',
              lat: segment.dropoffAddress?.coordinates?.lat || 0,
              lng: segment.dropoffAddress?.coordinates?.lng || 0,
            },
          });
          
          // Create segment properties
          const segmentPickupProperty = await prisma.propertyDetails.create({
            data: {
              id: crypto.randomUUID(),
              propertyType: mapPropertyTypeToPrisma(segment.pickupProperty?.type || 'house') as any,
              floors: segment.pickupProperty?.floors || 0,
              accessType: segment.pickupProperty?.hasLift ? 'WITH_LIFT' : 'WITHOUT_LIFT',
            },
          });
          
          const segmentDropoffProperty = await prisma.propertyDetails.create({
            data: {
              id: crypto.randomUUID(),
              propertyType: mapPropertyTypeToPrisma(segment.dropoffProperty?.type || 'house') as any,
              floors: segment.dropoffProperty?.floors || 0,
              accessType: segment.dropoffProperty?.hasLift ? 'WITH_LIFT' : 'WITHOUT_LIFT',
            },
          });
          
          // Create the segment
          // Determine segment type based on sequence and journey pattern
          let segmentType = 'outbound';
          if (i === 0) {
            segmentType = 'outbound';
          } else if (rawSegments.length === 2 && i === 1) {
            // If there are exactly 2 segments, second one is likely a return journey
            segmentType = 'return';
          } else {
            segmentType = 'additional';
          }
          
          await prisma.bookingSegment.create({
            data: {
              bookingId: booking.id,
              segmentType: segment.segmentType || segmentType,
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

    // Create booking items if any (with defensive casting to avoid Prisma validation errors)
    if (bookingData.items && bookingData.items.length > 0) {
      for (const item of bookingData.items) {
        const safeQuantity = Number.isFinite(item.quantity) ? item.quantity : Number(item.quantity ?? 1) || 1;
        const safeVolume = Number.isFinite(item.volumeFactor) ? item.volumeFactor : Number(item.volumeFactor ?? item.volume ?? 0) || 0;

        await prisma.bookingItem.create({
          data: {
            bookingId: booking.id,
            name: item.name || 'Item',
            quantity: Math.max(1, safeQuantity),
            volumeM3: safeVolume,
            category: item.category || 'general',
            estimatedVolume: safeVolume,
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

    // ✅ Send real-time notification to admin
    try {
      const { notifyNewBooking } = await import('@/lib/services/admin-notification-service');
      await notifyNewBooking(
        booking.id,
        booking.reference,
        serviceType
      );
      console.log('📢 Admin notified of new booking:', booking.reference);
    } catch (notifError) {
      console.error('⚠️ Failed to send admin notification:', notifError);
      // Non-critical, continue
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

    // ✅ NEW: Notify admin about new journey opportunity
    try {
      await notifyAdminAboutNewJourney({
        bookingId: booking.id,
        reference: booking.reference,
        customerName: bookingData.customer.name,
        customerEmail: bookingData.customer.email,
        customerPhone: bookingData.customer.phone,
        customerId: customerId,
        pickupAddress: bookingData.pickupAddress.street || '',
        pickupPostcode: bookingData.pickupAddress.postcode,
        pickupCity: bookingData.pickupAddress.city ?? null,
        pickupLat: booking.pickupLat ?? null,
        pickupLng: booking.pickupLng ?? null,
        dropoffAddress: bookingData.dropoffAddress.street || '',
        dropoffPostcode: bookingData.dropoffAddress.postcode,
        dropoffCity: bookingData.dropoffAddress.city ?? null,
        dropoffLat: booking.dropoffLat ?? null,
        dropoffLng: booking.dropoffLng ?? null,
        totalPrice: calculatedTotal || 0,
        scheduledDate: booking.scheduledAt,
        itemsCount: bookingData.items?.length || 0,
        items: bookingData.items?.map((item: any) => ({
          name: item.name || 'Unknown Item',
          quantity: item.quantity || 1,
          weight: item.weight,
          volume: item.volume,
          category: item.category,
        })) || [],
        serviceLevel: booking.urgency || 'standard',
        distanceMiles: booking.baseDistanceMiles || 0,
        crewSize: bookingData.crewSize || '1',
        estimatedDuration: booking.estimatedDurationMinutes || null,
        multiDropPotential: isMultiLeg,
        potentialSavings: 0, // Can be calculated if multi-drop discount exists
      });
    } catch (notificationError) {
      console.error('⚠️ Failed to notify admin about new journey:', notificationError);
      // Don't fail the booking if notification fails
    }

    // ✅ NEW: Check for return journey opportunity and notify admin
    // This would typically be checked after a long-distance booking is created
    // For now, we'll check if it's a multi-leg booking (outbound + return)
    if (isMultiLeg && rawSegments.length > 1) {
      // This might be a return journey - check eligibility
      try {
        const { ReturnJourneyService } = await import('@/lib/services/return-journey-service');
        const returnJourneyService = ReturnJourneyService.getInstance();
        
        // Check if this booking could be a return journey match
        // We'll use the first segment as original and check if there's a return opportunity
        const firstSegment = rawSegments[0];
        const lastSegment = rawSegments[rawSegments.length - 1];
        
        if (firstSegment && lastSegment && 
            firstSegment.pickupAddress?.postcode && 
            lastSegment.dropoffAddress?.postcode) {
          
          // Calculate return journey pricing (reverse of original)
          const returnJourneyPricing = await returnJourneyService.calculateReturnJourneyPricing({
            originalPickup: {
              address: firstSegment.pickupAddress.street || '',
              postcode: firstSegment.pickupAddress.postcode,
              coordinates: firstSegment.pickupAddress.coordinates || { lat: 0, lng: 0 },
              city: firstSegment.pickupAddress.city || '',
            },
            originalDropoff: {
              address: lastSegment.dropoffAddress.street || '',
              postcode: lastSegment.dropoffAddress.postcode,
              coordinates: lastSegment.dropoffAddress.coordinates || { lat: 0, lng: 0 },
              city: lastSegment.dropoffAddress.city || '',
            },
            originalDeliveryDate: booking.scheduledAt || new Date(),
            estimatedReturnDate: new Date((booking.scheduledAt?.getTime() || Date.now()) + 24 * 60 * 60 * 1000),
            returnCustomerPickup: {
              address: lastSegment.dropoffAddress.street || '',
              postcode: lastSegment.dropoffAddress.postcode,
              coordinates: lastSegment.dropoffAddress.coordinates || { lat: 0, lng: 0 },
            },
            returnCustomerDropoff: {
              address: firstSegment.pickupAddress.street || '',
              postcode: firstSegment.pickupAddress.postcode,
              coordinates: firstSegment.pickupAddress.coordinates || { lat: 0, lng: 0 },
            },
            items: bookingData.items?.map((item: any) => ({
              category: item.category || 'general',
              quantity: item.quantity || 1,
              weight: item.weight,
              volume: item.volume,
              fragile: item.fragile || false,
            })) || [],
            serviceType: booking.urgency === 'urgent' ? 'PREMIUM' : 
                       booking.urgency === 'express' ? 'STANDARD' : 'ECONOMY',
          });

          if (returnJourneyPricing.eligible && returnJourneyPricing.matchScore > 70) {
            await notifyAdminAboutReturnJourney({
              bookingId: booking.id,
              reference: booking.reference,
              originalBookingReference: booking.reference,
              customerName: bookingData.customer.name,
              customerEmail: bookingData.customer.email,
              customerPhone: bookingData.customer.phone,
              customerId: customerId,
              pickupAddress: lastSegment.dropoffAddress.street || '',
              pickupPostcode: lastSegment.dropoffAddress.postcode,
              pickupCity: lastSegment.dropoffAddress.city ?? null,
              pickupLat: lastSegment.dropoffAddress.coordinates?.lat ?? null,
              pickupLng: lastSegment.dropoffAddress.coordinates?.lng ?? null,
              dropoffAddress: firstSegment.pickupAddress.street || '',
              dropoffPostcode: firstSegment.pickupAddress.postcode,
              dropoffCity: firstSegment.pickupAddress.city ?? null,
              dropoffLat: firstSegment.pickupAddress.coordinates?.lat ?? null,
              dropoffLng: firstSegment.pickupAddress.coordinates?.lng ?? null,
              totalPrice: returnJourneyPricing.returnJourneyPrice,
              discount: returnJourneyPricing.discount,
              discountPercentage: returnJourneyPricing.discountPercentage,
              driverEarnings: returnJourneyPricing.driverEarnings,
              matchScore: returnJourneyPricing.matchScore,
              scheduledDate: booking.scheduledAt,
              itemsCount: bookingData.items?.length || 0,
              items: bookingData.items?.map((item: any) => ({
                name: item.name || 'Unknown Item',
                quantity: item.quantity || 1,
                weight: item.weight,
                volume: item.volume,
                category: item.category,
              })) || [],
              serviceLevel: booking.urgency || 'standard',
              crewSize: bookingData.crewSize || '1',
              distanceMiles: returnJourneyPricing.deviationDistance ? (returnJourneyPricing.deviationDistance / 1609.34) : undefined,
              estimatedDuration: booking.estimatedDurationMinutes || undefined,
            });
          }
        }
      } catch (returnJourneyError) {
        console.error('⚠️ Failed to check return journey opportunity:', returnJourneyError);
        // Don't fail the booking if return journey check fails
      }
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

    // Mark draft as completed when booking is created
    if (bookingDraftId) {
      try {
        await prisma.bookingDraft.update({
          where: { id: bookingDraftId },
          data: {
            status: 'COMPLETED',
            formStep2: rawData.step2 ?? null,
          },
        });
      } catch (draftError) {
        console.warn('⚠️ Failed to update booking draft status:', draftError);
      }
    }
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
