'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';
import type { BookingSegment } from '../types/segment';
import { 
  mirrorSegmentForReturn, 
  createBlankSegment, 
  validateSegmentChronology,
  validateSegmentRequiredFields,
  updateSequenceNumbers,
  calculateTotalPrice
} from '../utils/segmentHelpers';
// import {
//   addressSchema,
//   customerSchema,
//   propertyDetailsSchema,
//   bookingItemSchema,
// } from '@/lib/schemas/booking-schemas';

// Use shared property details schema (imported above)
// Local property details schema for frontend compatibility
const frontendPropertyDetailsSchema = z.object({
  type: z.enum(['house', 'apartment', 'office', 'warehouse', 'other']).default('house'),
  floors: z.number().int().min(0).max(50).optional().default(0),
  hasLift: z.boolean().optional().default(false),
  hasParking: z.boolean().optional().default(true),
  accessNotes: z.string().max(1000).optional(),
  requiresPermit: z.boolean().optional().default(false),
  flatNumber: z.string().max(50).optional(),
});

// Item schema
const itemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  size: z.enum(['small', 'medium', 'large']),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  weight: z.number().min(0),
  volume: z.number().min(0),
  image: z.string().optional(),
  workers_required: z.number().optional(),
  dismantling_required: z.string().optional(),
  fragility_level: z.string().optional(),
  dismantling_time_minutes: z.number().optional(),
  reassembly_time_minutes: z.number().optional(),
  special_handling_notes: z.string().optional(),
});

// Service type schema - Luxury service levels
const serviceTypeSchema = z.enum(['signature', 'premium', 'white-glove', 'standard'] as const);

// Customer details schema
const customerDetailsSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'First name can only contain letters, spaces, hyphens and apostrophes')
    .transform(s => s.trim()),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Last name can only contain letters, spaces, hyphens and apostrophes')
    .transform(s => s.trim()),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .transform(s => s.toLowerCase().trim()),
  phone: z.string()
    .min(1, 'Phone number is required')
    .regex(/^(?:(?:\+44)|(?:0))(?:\d\s?){9,10}$/, 'Please enter a valid UK phone number')
    .transform(s => s.replace(/\s+/g, '').replace(/^0/, '+44')),
  company: z.string()
    .max(100, 'Company name too long')
    .optional()
    .transform(s => s ? s.trim() : s),
});

// Payment method schema - Stripe only
const paymentMethodSchema = z.object({
  type: z.enum(['stripe']).default('stripe'),
  stripeDetails: z.object({
    paymentIntentId: z.string().optional(),
    sessionId: z.string().optional(),
  }).optional(),
});

// Pricing breakdown schema
const pricingBreakdownSchema = z.object({
  baseFee: z.number().min(0),
  distanceFee: z.number().min(0),
  volumeFee: z.number().min(0),
  serviceFee: z.number().min(0),
  urgencyFee: z.number().min(0).default(0),
  vat: z.number().min(0),
  total: z.number().min(0),
  distance: z.number().min(0), // Distance in kilometers
});

// Segment type schema
const segmentTypeSchema = z.enum(['outbound', 'return', 'additional']);

// CompleteAddress-compatible schema to match UKAddressAutocomplete
const frontendAddressSchema = z.object({
  // Legacy fields for backward compatibility
  address: z.string().optional(),
  formatted_address: z.string().optional(),
  place_name: z.string().optional(),
  houseNumber: z.string().optional(),
  flatNumber: z.string().optional(),
  
  // CompleteAddress fields from UKAddressAutocomplete
  full: z.string().optional(),
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().optional(),
  
  coordinates: z.object({
    lat: z.number().min(-90).max(90).optional(),
    lng: z.number().min(-180).max(180).optional(),
  }).optional(),
  
  // CompleteAddress nested formatted object
  formatted: z.object({
    street: z.string().optional(),
    houseNumber: z.string().optional(),
    flatNumber: z.string().optional(),
    floor: z.string().optional(),
    businessName: z.string().optional(),
  }).optional(),
  
  // Additional metadata
  isPostcodeValidated: z.boolean().optional(),
  stepCompletedAt: z.string().optional(),
  buildingDetails: z.object({
    type: z.string().optional(),
    hasElevator: z.boolean().optional(),
    floorNumber: z.string().optional(),
    apartmentNumber: z.string().optional(),
    flatNumber: z.string().optional(),
  }).optional(),
});

// BookingSegment schema - proper type validation for multi-leg bookings
// Must be defined AFTER frontendAddressSchema and frontendPropertyDetailsSchema
const bookingSegmentSchema = z.object({
  id: z.string(),
  segmentType: segmentTypeSchema,
  sequenceNumber: z.number().int().min(0),
  pickupAddress: frontendAddressSchema,
  dropoffAddress: frontendAddressSchema,
  pickupProperty: frontendPropertyDetailsSchema,
  dropoffProperty: frontendPropertyDetailsSchema,
  datetime: z.string().optional(),
  estimatedArrival: z.string().optional(),
  items: z.array(itemSchema).default([]),
  pricing: pricingBreakdownSchema.optional(),
  distance: z.number().optional(),
  estimatedDuration: z.number().optional(),
  notes: z.string().optional(),
});

const step1Schema = z.object({
  pickupAddress: frontendAddressSchema,
  dropoffAddress: frontendAddressSchema,
  pickupProperty: frontendPropertyDetailsSchema,
  dropoffProperty: frontendPropertyDetailsSchema,
  items: z.array(itemSchema).min(1, 'Please select at least one item'),
  serviceType: serviceTypeSchema,
  pickupDate: z.string()
    .min(1, 'Please select a pickup date')
    .refine((date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return !isNaN(selectedDate.getTime()) && selectedDate >= today;
    }, 'Please select a valid future date'),
  pickupTimeSlot: z.string().optional(),
  urgency: z.enum(['same-day', 'next-day', 'scheduled'])
    .default('scheduled'),
  distance: z.number().min(0),
  estimatedDuration: z.number().min(0),
  pricing: pricingBreakdownSchema,
  
  // Multi-leg booking support
  isMultiLeg: z.boolean().default(false),
  segments: z.array(bookingSegmentSchema).optional().default([]), // Properly validated BookingSegment
});

const step2Schema = z.object({
  customerDetails: customerDetailsSchema,
  paymentMethod: paymentMethodSchema,
  termsAccepted: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
  privacyAccepted: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
  marketingOptIn: z.boolean().optional(),
  specialInstructions: z.string().optional(),
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
});

// Complete form schema (2 steps unified)
const formSchema = z.object({
  step1: step1Schema,
  step2: step2Schema,
});

export type Address = z.infer<typeof frontendAddressSchema>;
export type PropertyDetails = z.infer<typeof frontendPropertyDetailsSchema>;
export type Item = z.infer<typeof itemSchema>;
export type ServiceType = z.infer<typeof serviceTypeSchema>;
export type CustomerDetails = z.infer<typeof customerDetailsSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type PricingBreakdown = z.infer<typeof pricingBreakdownSchema>;
export type FormData = z.infer<typeof formSchema>;

const initialFormData: FormData = {
  step1: {
    pickupAddress: {
      address: '',
      city: '',
      postcode: '',
      coordinates: { lat: 0, lng: 0 },
      houseNumber: '',
      flatNumber: '',
      formatted_address: '',
      place_name: '',
    },
    dropoffAddress: {
      address: '',
      city: '',
      postcode: '',
      coordinates: { lat: 0, lng: 0 },
      houseNumber: '',
      flatNumber: '',
      formatted_address: '',
      place_name: '',
    },
    pickupProperty: {
      type: 'house',
      floors: 0,
      hasLift: false,
      hasParking: false,
      requiresPermit: false,
      accessNotes: '',
    },
    dropoffProperty: {
      type: 'house',
      floors: 0,
      hasLift: false,
      hasParking: false,
      requiresPermit: false,
      accessNotes: '',
    },
    items: [],
    serviceType: 'standard',
    pickupDate: '',
    pickupTimeSlot: undefined,
    urgency: 'scheduled',
    distance: 0,
    estimatedDuration: 0,
    pricing: {
      baseFee: 0,
      distanceFee: 0,
      volumeFee: 0,
      serviceFee: 0,
      urgencyFee: 0,
      vat: 0,
      total: 0,
      distance: 0,
    },
    isMultiLeg: false,
    segments: [],
  },
  step2: {
    customerDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
    },
    paymentMethod: {
      type: 'stripe',
      stripeDetails: {
        paymentIntentId: '',
        sessionId: '',
      },
    },
    termsAccepted: false,
    privacyAccepted: false,
    marketingOptIn: false,
    specialInstructions: '',
    bookingId: '',
    promotionCode: '',
    promotionDetails: undefined,
  },
};

// Map client time slots to API expected format
function mapTimeSlotToAPI(timeSlot?: string): 'morning' | 'afternoon' | 'evening' | 'flexible' {
  if (!timeSlot) return 'flexible';

  const lowerSlot = timeSlot.toLowerCase();
  if (lowerSlot.includes('morning') || lowerSlot.includes('am')) return 'morning';
  if (lowerSlot.includes('afternoon')) return 'afternoon';
  if (lowerSlot.includes('evening') || lowerSlot.includes('pm')) return 'evening';

  return 'flexible';
}

// Extract timeSlot from datetime for segments
function extractTimeSlotFromDatetime(datetime: string): 'morning' | 'afternoon' | 'evening' | 'flexible' {
  const date = new Date(datetime);
  const hours = date.getHours();
  
  if (hours >= 6 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 17) return 'afternoon';
  if (hours >= 17 && hours < 21) return 'evening';
  return 'flexible';
}

// Map urgency values to API-compatible format
function mapUrgencyToAPI(urgency?: string): 'standard' | 'express' | 'urgent' {
  if (!urgency) return 'standard';
  
  const lowerUrgency = urgency.toLowerCase();
  if (lowerUrgency === 'scheduled' || lowerUrgency === 'economy') return 'standard';
  if (lowerUrgency === 'same-day' || lowerUrgency === 'next-day') return 'express';
  if (lowerUrgency === 'urgent' || lowerUrgency === 'immediate') return 'urgent';
  
  return 'standard';
}

export function useBookingForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [isCalculatingPricing, setIsCalculatingPricing] = useState(false);

  const updateFormData = useCallback((step: keyof FormData | string, data: Partial<FormData[keyof FormData]>) => {
    const stepKey = step as keyof FormData;
    setFormData(prev => {
      // Always update - don't skip updates for items array or other critical fields
      // The comparison logic was too aggressive and causing missed updates
      const shouldUpdate = Object.keys(data).some(key => {
        const newValue = (data as any)[key];
        const currentValue = (prev[stepKey] as any)[key];
        
        // Special handling for arrays (like items) - always update if array is provided
        if (Array.isArray(newValue)) {
          // If items or segments array is being updated, always allow it
          if (key === 'items' || key === 'segments') {
            return true; // Always update items/segments array
          }
          // For other arrays, check length and content
          if (!Array.isArray(currentValue) || newValue.length !== currentValue.length) {
            return true;
          }
          // Deep compare array items
          return newValue.some((item, index) => {
            const currentItem = currentValue[index];
            return JSON.stringify(item) !== JSON.stringify(currentItem);
          });
        }
        
        // For non-array values, use deep comparison
        if (newValue === null || newValue === undefined) {
          return currentValue !== newValue;
        }
        
        return JSON.stringify(newValue) !== JSON.stringify(currentValue);
      });
      
      if (!shouldUpdate) {
        console.log(`No change detected for ${step}, skipping update`);
        return prev; // Return the same object to prevent re-render
      }
      
      // Normalize address fields to never be null
      const nextStepData: any = { ...prev[stepKey], ...data };
      if (stepKey === 'step1') {
        if ((data as any).pickupAddress === null) {
          nextStepData.pickupAddress = {
            address: '',
            city: '',
            postcode: '',
            coordinates: { lat: 0, lng: 0 },
            houseNumber: '',
            flatNumber: '',
            formatted_address: '',
            place_name: ''
          };
        }
        if ((data as any).dropoffAddress === null) {
          nextStepData.dropoffAddress = {
            address: '',
            city: '',
            postcode: '',
            coordinates: { lat: 0, lng: 0 },
            houseNumber: '',
            flatNumber: '',
            formatted_address: '',
            place_name: ''
          };
        }
      }

      const newData = {
        ...prev,
        [stepKey]: nextStepData,
      };
      
      // Enhanced logging for segments updates
      if ((data as any).segments) {
        const segs = (data as any).segments;
        console.log(`📦 Updating segments:`, segs.map((s: any, i: number) => ({
          index: i,
          type: s.segmentType,
          itemsCount: s.items?.length || 0,
          items: s.items?.map((item: any) => ({ id: item.id, name: item.name })) || []
        })));
      } else {
        console.log(`Updating ${step}:`, data);
      }
      
      return newData;
    });
  }, []);

  const validateStep = useCallback(async (stepNumber: number): Promise<boolean> => {
    try {
      let schema;
      let data;

      switch (stepNumber) {
        case 1:
          schema = step1Schema;
          data = formData.step1;
          break;
        case 2:
          schema = step2Schema;
          data = formData.step2;
          break;
        default:
          return false;
      }

      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.issues.forEach(err => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [formData]);

  const isStepValid = useCallback((stepNumber: number): boolean => {
    try {
      let schema;
      let data;

      switch (stepNumber) {
        case 1:
          schema = step1Schema;
          data = formData.step1;
          break;
        case 2:
          schema = step2Schema;
          data = formData.step2;
          break;
        default:
          return false;
      }

      schema.parse(data);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const currentData = stepNumber === 1 ? formData.step1 : formData.step2;
      }
      return false;
    }
  }, [formData]);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * CRITICAL: Reset form data to initial state
   * 
   * This should ONLY be called when:
   * 1. Booking is successfully completed (after payment success)
   * 2. Customer service explicitly cancels/abandons the booking
   * 3. Customer explicitly starts a new booking
   * 
   * DO NOT call this when:
   * - Navigating between steps (Step 1 ↔ Step 2)
   * - Editing items or addresses
   * - Calculating pricing
   * 
   * Customer service uses the same computer for multiple customers,
   * so we reset after each completed booking to prevent data leakage.
   * However, we preserve data during the active booking session.
   */
  const resetForm = useCallback(() => {
    console.log('🔄 Resetting form data - Starting new booking session');
    setFormData(initialFormData);
    setErrors({});
  }, []);

  // Validate and apply promotion code
  const validatePromotionCode = useCallback(async (code: string): Promise<{ success: boolean; error?: string; promotion?: any }> => {
    if (!code.trim()) {
      return { success: false, error: 'Please enter a promotion code' };
    }

    try {
      const response = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.trim(),
          amount: formData.step1.pricing.total,
          customerEmail: formData.step2.customerDetails.email,
          pickupPostcode: formData.step1.pickupAddress?.postcode || '',
          serviceType: formData.step1.serviceType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Failed to validate promotion code' };
      }

      if (!result.valid) {
        return { success: false, error: result.error || 'Invalid promotion code' };
      }

      return { success: true, promotion: result.promotion };
    } catch (error) {
      console.error('Promotion validation error:', error);
      return { success: false, error: 'Failed to validate promotion code' };
    }
  }, [formData.step1.pricing.total, formData.step2.customerDetails.email, formData.step1.pickupAddress?.postcode, formData.step1.serviceType]);

  // Apply promotion code
  const applyPromotionCode = useCallback(async (code: string) => {
    const result = await validatePromotionCode(code);
    
    if (result.success && result.promotion) {
      // Update form data with promotion details
      updateFormData('step2', {
        promotionCode: code.trim(),
        promotionDetails: result.promotion,
      });
      
      // Update pricing with discount
      const newPricing = {
        ...formData.step1.pricing,
        total: result.promotion.finalAmount,
      };
      
      updateFormData('step1', {
        pricing: newPricing,
      });
      
      return { success: true, promotion: result.promotion };
    } else {
      return { success: false, error: result.error };
    }
  }, [validatePromotionCode, updateFormData, formData.step1.pricing]);

  // Remove promotion code
  const removePromotionCode = useCallback(() => {
    const originalAmount = formData.step2.promotionDetails?.originalAmount || formData.step1.pricing.total;
    
    updateFormData('step2', {
      promotionCode: '',
      promotionDetails: undefined,
    });
    
    // Restore original pricing
    const newPricing = {
      ...formData.step1.pricing,
      total: originalAmount,
    };
    
    updateFormData('step1', {
      pricing: newPricing,
    });
  }, [updateFormData, formData.step2.promotionDetails, formData.step1.pricing]);

  // Calculate pricing using the unified pricing API (supports multi-leg)
  const calculatePricing = useCallback(async (): Promise<boolean> => {
    const step1 = formData.step1;
    const items = step1.items || [];
    const segments = Array.isArray(step1.segments) ? step1.segments : [];
    // ✅ CRITICAL FIX: Only treat as multi-leg if there are 2+ segments
    // 0 or 1 segment = single-leg journey (use normal pricing flow)
    // 2+ segments = multi-leg journey (calculate each segment separately)
    const hasSegments = segments.length > 1;

    const resetPricing = () => {
      updateFormData('step1', {
        pricing: {
          baseFee: 0,
          distanceFee: 0,
          volumeFee: 0,
          serviceFee: 0,
          urgencyFee: 0,
          vat: 0,
          total: 0,
          distance: 0,
        },
      });
    };

    if (items.length === 0) {
      resetPricing();
      return true;
    }

    const hasMainPickupAddress =
      step1.pickupAddress?.full ||
      step1.pickupAddress?.line1 ||
      step1.pickupAddress?.address ||
      step1.pickupAddress?.formatted_address;
    const hasMainDropoffAddress =
      step1.dropoffAddress?.full ||
      step1.dropoffAddress?.line1 ||
      step1.dropoffAddress?.address ||
      step1.dropoffAddress?.formatted_address;

    const hasValidMainPickupCoordinates = (() => {
      const lat = step1.pickupAddress?.coordinates?.lat;
      const lng = step1.pickupAddress?.coordinates?.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') return false;
      return lat !== 0 || lng !== 0;
    })();

    const hasValidMainDropoffCoordinates = (() => {
      const lat = step1.dropoffAddress?.coordinates?.lat;
      const lng = step1.dropoffAddress?.coordinates?.lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') return false;
      return lat !== 0 || lng !== 0;
    })();

    if (!hasMainPickupAddress || !hasMainDropoffAddress) {
      console.log('⏳ Skipping pricing calculation - addresses not yet selected', {
        pickup: Boolean(hasMainPickupAddress),
        dropoff: Boolean(hasMainDropoffAddress),
        pickupData: step1.pickupAddress,
        dropoffData: step1.dropoffAddress,
      });
      return false;
    }

    if (!hasValidMainPickupCoordinates || !hasValidMainDropoffCoordinates) {
      console.log('⏳ Skipping pricing calculation - coordinates not yet resolved', {
        pickup: Boolean(hasValidMainPickupCoordinates),
        dropoff: Boolean(hasValidMainDropoffCoordinates),
        pickupCoords: step1.pickupAddress?.coordinates,
        dropoffCoords: step1.dropoffAddress?.coordinates,
      });
      return false;
    }

    if (!items || items.length === 0) {
      console.log('⏳ Skipping pricing calculation - no items selected');
      setIsCalculatingPricing(false);
      return false;
    }

    setIsCalculatingPricing(true);
    clearErrors();

    const buildAddressPayload = (address: Address | undefined, propertyDetails: PropertyDetails | undefined, propertyFallback: PropertyDetails | undefined) => {
      const selectedAddress = address || ({} as Address);
      const selectedProperty = propertyDetails || propertyFallback || ({} as PropertyDetails);
      return {
        address:
          selectedAddress.full ||
          selectedAddress.line1 ||
          selectedAddress.address ||
          selectedAddress.formatted_address ||
          '',
        formatted_address:
          selectedAddress.formatted_address ||
          selectedAddress.full ||
          selectedAddress.line1 ||
          '',
        postcode: selectedAddress.postcode || '',
        latitude: selectedAddress.coordinates?.lat || 0,
        longitude: selectedAddress.coordinates?.lng || 0,
        coordinates: {
          lat: selectedAddress.coordinates?.lat || 0,
          lng: selectedAddress.coordinates?.lng || 0,
        },
        propertyDetails: {
          type: selectedProperty.type || 'house',
          floors: selectedProperty.floors || 0,
          hasLift: Boolean(selectedProperty.hasLift),
          hasParking: selectedProperty.hasParking !== false,
          accessNotes: selectedProperty.accessNotes,
          requiresPermit: Boolean(selectedProperty.requiresPermit),
        },
      };
    };

    const buildSegmentItems = (segmentItems: Item[] | undefined) => {
      if (segmentItems && segmentItems.length > 0) return segmentItems;
      return items;
    };

    const ensureAddressText = (address: Address | undefined) => {
      if (!address) return '';
      return (
        address.full ||
        address.line1 ||
        address.address ||
        address.formatted_address ||
        ''
      );
    };

    const updatedSegments = segments.map(segment => ({ ...segment }));
    let aggregatedBase = 0;
    let aggregatedDistanceFee = 0;
    let aggregatedVolume = 0;
    let aggregatedService = 0;
    let aggregatedUrgency = 0;
    let aggregatedVat = 0;
    let aggregatedTotal = 0;
    let aggregatedDistance = 0;

    const processSinglePricing = async (
      pricingData: any,
      correlationId: string
    ) => {
      let response;
      try {
        response = await fetch('/api/pricing/quote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': correlationId,
          },
          body: JSON.stringify(pricingData),
        });
      } catch (fetchError) {
        console.error('❌ Network error during pricing API call:', fetchError);
        throw new Error('Network error: Unable to reach pricing service');
      }

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse API response:', {
          status: response.status,
          statusText: response.statusText,
          parseError,
        });
        throw new Error(`Failed to parse API response: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        console.error('❌ Pricing API error:', {
          status: response.status,
          statusText: response.statusText,
          correlationId,
          result,
          requestData: pricingData,
        });

        if (result.details && Array.isArray(result.details)) {
          console.error('Validation errors:', result.details);
        }

        throw new Error(result.error || `API error: ${response.status}`);
      }

      if (!result.success) {
        console.error('❌ Pricing calculation failed:', { correlationId, result });

        if (result.details && Array.isArray(result.details)) {
          console.error('Validation errors:', result.details);
        }

        throw new Error(result.error || 'Failed to calculate pricing');
      }

      return result.data;
    };

    const mapApiPricingToBreakdown = (apiPricing: any) => {
      const basePrice = apiPricing.amountGbpMinor / 100;
      return {
        baseFee: Math.round(apiPricing.breakdown.baseFee / 100 * 100) / 100,
        distanceFee: Math.round(apiPricing.breakdown.distanceFee / 100 * 100) / 100,
        volumeFee: Math.round(apiPricing.breakdown.itemsFee / 100 * 100) / 100,
        serviceFee: Math.round(apiPricing.breakdown.serviceFee / 100 * 100) / 100,
        urgencyFee: Math.round(apiPricing.breakdown.vehicleFee / 100 * 100) / 100,
        vat: Math.round(apiPricing.vatAmount / 100 * 100) / 100,
        total: Math.round(basePrice * 100) / 100,
        distance: Math.round(apiPricing.route.totalDistance * 100) / 100,
      };
    };

    try {
      const correlationIdBase = `pricing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      if (hasSegments) {
        let processedSegments = 0;

        for (let index = 0; index < segments.length; index++) {
          const segment = segments[index];
          const segmentItems = buildSegmentItems(segment.items);
          if (segmentItems.length === 0) {
            throw new Error(`Items are required for journey ${index + 1}`);
          }

          const pickupAddress = segment.pickupAddress || step1.pickupAddress;
          const dropoffAddress = segment.dropoffAddress || step1.dropoffAddress;

          const pickupText = ensureAddressText(pickupAddress);
          const dropoffText = ensureAddressText(dropoffAddress);
          if (!pickupText || !dropoffText) {
            throw new Error(`Pickup and dropoff addresses are required for journey ${index + 1}`);
          }

          const pickupLat = pickupAddress?.coordinates?.lat;
          const pickupLng = pickupAddress?.coordinates?.lng;
          const dropoffLat = dropoffAddress?.coordinates?.lat;
          const dropoffLng = dropoffAddress?.coordinates?.lng;

          if (typeof pickupLat !== 'number' || typeof pickupLng !== 'number' || typeof dropoffLat !== 'number' || typeof dropoffLng !== 'number') {
            throw new Error(`Coordinates are missing for journey ${index + 1}`);
          }

          if ((pickupLat === 0 && pickupLng === 0) || (dropoffLat === 0 && dropoffLng === 0)) {
            throw new Error(`Coordinates are not resolved for journey ${index + 1}`);
          }

          const pricingData = {
            items: segmentItems.map(item => ({
              id: item.id || `item-${Date.now()}-${Math.random()}`,
              name: item.name || 'Unknown Item',
              category: item.category || 'furniture',
              quantity: item.quantity || 1,
              weight: item.weight || 10,
              volume: item.volume || 0.1,
              fragile: item.fragility_level === 'High' || item.fragility_level === 'Medium',
              oversize: (item.weight || 0) > 100 || (item.volume || 0) > 2,
              disassemblyRequired: item.dismantling_required === 'Yes',
              specialHandling: item.special_handling_notes ? [item.special_handling_notes] : [],
            })),
            pickupAddress: buildAddressPayload(pickupAddress, segment.pickupProperty, step1.pickupProperty),
            dropoffAddress: buildAddressPayload(dropoffAddress, segment.dropoffProperty, step1.dropoffProperty),
            serviceType: step1.serviceType || 'signature',
            serviceLevel: step1.serviceType || 'signature',
            scheduledDate: segment.datetime
              ? new Date(segment.datetime).toISOString()
              : step1.pickupDate
                ? new Date(step1.pickupDate + 'T10:00:00').toISOString()
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            pickupDate: segment.datetime
              ? new Date(segment.datetime).toISOString()
              : step1.pickupDate
                ? new Date(step1.pickupDate + 'T10:00:00').toISOString()
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            timeSlot: segment.datetime 
              ? extractTimeSlotFromDatetime(segment.datetime)
              : mapTimeSlotToAPI(step1.pickupTimeSlot) || 'flexible',
            addOns: {
              packingService: false,
              insuranceCoverage: false,
              storageRequired: false,
              dismantlingRequired: segmentItems.some(item => item.dismantling_required === 'Yes'),
            },
            preferences: {
              vehicleType: 'van',
              urgency: mapUrgencyToAPI(step1.urgency),
              environmentalPreference: 'standard',
            },
            metadata: {
              source: 'booking-luxury',
              version: '1.0.0',
              segmentIndex: index,
            },
          };

          console.log('🔍 Sending pricing request for segment:', {
            correlationId: `${correlationIdBase}-${index}`,
            itemsCount: pricingData.items.length,
            pickup: pricingData.pickupAddress?.postcode,
            dropoff: pricingData.dropoffAddress?.postcode,
            service: pricingData.serviceType,
            segment: index,
          });

          const apiPricing = await processSinglePricing(pricingData, `${correlationIdBase}-${index}`);
          const finalPricing = mapApiPricingToBreakdown(apiPricing);

          aggregatedBase += finalPricing.baseFee;
          aggregatedDistanceFee += finalPricing.distanceFee;
          aggregatedVolume += finalPricing.volumeFee;
          aggregatedService += finalPricing.serviceFee;
          aggregatedUrgency += finalPricing.urgencyFee;
          aggregatedVat += finalPricing.vat;
          aggregatedTotal += finalPricing.total;
          aggregatedDistance += finalPricing.distance;

          // ✅ CRITICAL FIX: Update segment with pricing while preserving items
          updatedSegments[index] = {
            ...updatedSegments[index],
            pricing: finalPricing,
            distance: finalPricing.distance,
            // Ensure items are preserved (deep copy)
            items: updatedSegments[index].items 
              ? updatedSegments[index].items.map(item => ({ ...item }))
              : segmentItems.map(item => ({ ...item }))
          };
          processedSegments += 1;
        }

        if (processedSegments === 0) {
          throw new Error('No journeys could be priced. Please check addresses and items.');
        }

        // ✅ CRITICAL FIX: Ensure all segments have items before updating
        // This prevents segments from losing items during pricing calculation
        const segmentsWithItems = updatedSegments.map((segment, index) => {
          // If segment has no items, copy from first segment or global items
          if (!segment.items || segment.items.length === 0) {
            const sourceItems = updatedSegments[0]?.items && updatedSegments[0].items.length > 0
              ? updatedSegments[0].items
              : (items && items.length > 0 ? items : []);
            
            return {
              ...segment,
              items: sourceItems.map(item => ({ ...item }))
            };
          }
          return segment;
        });

        updateFormData('step1', {
          pricing: {
            baseFee: Math.round(aggregatedBase * 100) / 100,
            distanceFee: Math.round(aggregatedDistanceFee * 100) / 100,
            volumeFee: Math.round(aggregatedVolume * 100) / 100,
            serviceFee: Math.round(aggregatedService * 100) / 100,
            urgencyFee: Math.round(aggregatedUrgency * 100) / 100,
            vat: Math.round(aggregatedVat * 100) / 100,
            total: Math.round(aggregatedTotal * 100) / 100,
            distance: Math.round(aggregatedDistance * 100) / 100,
          },
          segments: segmentsWithItems,
          isMultiLeg: true,
        });

        console.log('🎉 Multi-leg pricing completed successfully!', {
          journeysPriced: segments.length,
          total: aggregatedTotal,
          segmentsWithPricing: segmentsWithItems.map((s, i) => ({
            index: i,
            pricing: s.pricing?.total || 0,
            itemsCount: s.items?.length || 0
          }))
        });
        return true;
      }

      // Single journey flow (legacy)
      const correlationId = correlationIdBase;
      const pickupAddressText = ensureAddressText(step1.pickupAddress);
      const dropoffAddressText = ensureAddressText(step1.dropoffAddress);

      if (!pickupAddressText || !dropoffAddressText) {
        throw new Error('Pickup and dropoff addresses are required');
      }

      const pricingData = {
        items: items.map(item => ({
          id: item.id || `item-${Date.now()}-${Math.random()}`,
          name: item.name || 'Unknown Item',
          category: item.category || 'furniture',
          quantity: item.quantity || 1,
          weight: item.weight || 10,
          volume: item.volume || 0.1,
          fragile: item.fragility_level === 'High' || item.fragility_level === 'Medium',
          oversize: (item.weight || 0) > 100 || (item.volume || 0) > 2,
          disassemblyRequired: item.dismantling_required === 'Yes',
          specialHandling: item.special_handling_notes ? [item.special_handling_notes] : [],
        })),
        pickupAddress: buildAddressPayload(step1.pickupAddress, step1.pickupProperty, step1.pickupProperty),
        dropoffAddress: buildAddressPayload(step1.dropoffAddress, step1.dropoffProperty, step1.dropoffProperty),
        serviceType: step1.serviceType || 'signature',
        serviceLevel: step1.serviceType || 'signature',
        scheduledDate: step1.pickupDate
          ? new Date(step1.pickupDate + 'T10:00:00').toISOString()
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        pickupDate: step1.pickupDate
          ? new Date(step1.pickupDate + 'T10:00:00').toISOString()
          : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        timeSlot: mapTimeSlotToAPI(step1.pickupTimeSlot) || 'flexible',
        addOns: {
          packingService: false,
          insuranceCoverage: false,
          storageRequired: false,
          dismantlingRequired: items.some(item => item.dismantling_required === 'Yes'),
        },
        preferences: {
          vehicleType: 'van',
          urgency: mapUrgencyToAPI(step1.urgency),
          environmentalPreference: 'standard',
        },
        metadata: {
          source: 'booking-luxury',
          version: '1.0.0',
        },
      };

      console.log('🔍 Sending pricing request:', {
        correlationId,
        itemsCount: pricingData.items.length,
        pickup: pricingData.pickupAddress?.postcode,
        dropoff: pricingData.dropoffAddress?.postcode,
        service: pricingData.serviceType,
      });

      const apiPricing = await processSinglePricing(pricingData, correlationId);
      const finalPricing = mapApiPricingToBreakdown(apiPricing);

      updateFormData('step1', { pricing: finalPricing });

      console.log('🎉 Pricing calculation completed successfully!', {
        total: finalPricing.total,
      });
      return true;
    } catch (error) {
      // Enhanced error logging - handle all error types properly
      console.error('❌ RAW ERROR CAUGHT:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error constructor:', error?.constructor?.name);
      console.error('❌ Error keys:', error && typeof error === 'object' ? Object.keys(error as object) : 'N/A');
      console.error('❌ Error prototype:', Object.prototype.toString.call(error));
      
      let errorMessage = 'Unknown error';
      let errorStack: string | undefined;
      let errorDetails: unknown = error;

      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack;
        errorDetails = { name: error.name, message: error.message, cause: (error as any).cause };
        console.error('❌ Error is Error instance:', errorMessage);
      } else if (typeof error === 'string') {
        errorMessage = error;
        errorDetails = error;
        console.error('❌ Error is string:', error);
      } else if (error && typeof error === 'object') {
        // Try to extract useful info from non-Error objects
        const errorObj = error as Record<string, unknown>;
        // Try multiple methods to extract info
        errorMessage = String(
          errorObj.message || 
          errorObj.error || 
          errorObj.msg ||
          errorObj.reason ||
          (Object.keys(errorObj).length > 0 ? JSON.stringify(errorObj, Object.getOwnPropertyNames(errorObj)) : 'Empty object error')
        );
        errorDetails = errorObj;
        console.error('❌ Error is object with keys:', Object.keys(errorObj));
        console.error('❌ Error own property names:', Object.getOwnPropertyNames(errorObj));
      } else {
        console.error('❌ Error is unknown type:', String(error));
        errorMessage = String(error);
      }

      console.error('❌ Pricing calculation error:', {
        errorMessage,
        errorDetails,
        errorStack,
        items: items.length,
        addresses: {
          pickup: Boolean(step1.pickupAddress.address),
          dropoff: Boolean(step1.dropoffAddress.address),
          pickupPostcode: step1.pickupAddress.postcode,
          dropoffPostcode: step1.dropoffAddress.postcode,
        },
      });

      setErrors({
        pricing: `Unable to calculate pricing: ${errorMessage}. Please check your items and addresses and try again.`,
      });

      const itemsTotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const estimatedDistance = 10;
      const distanceCharge = estimatedDistance * 2;
      const subtotal = Math.max(35, itemsTotal * 1.2 + distanceCharge);
      const vat = Math.round(subtotal * 0.2 * 100) / 100;
      const fallbackTotal = subtotal + vat;

      updateFormData('step1', {
        pricing: {
          baseFee: Math.round(subtotal * 0.5 * 100) / 100,
          distanceFee: Math.round(distanceCharge * 100) / 100,
          volumeFee: Math.round(itemsTotal * 1.2 * 100) / 100,
          serviceFee: Math.round(subtotal * 0.1 * 100) / 100,
          urgencyFee: 0,
          vat: vat,
          total: Math.round(fallbackTotal * 100) / 100,
          distance: estimatedDistance,
        },
      });

      return false;
    } finally {
      setIsCalculatingPricing(false);
    }
  }, [formData.step1, updateFormData, clearErrors]);

  // ============================================
  // MULTI-LEG BOOKING FUNCTIONS
  // ============================================

  /**
   * Add return segment (mirror of outbound)
   * Swaps pickup ↔ dropoff, copies items, calculates return time
   * ✅ FIXED: Ensures items are properly copied and pricing is preserved
   */
  const addReturnSegment = useCallback((bufferMinutes: number = 30, pricingTiersRef?: { standard?: { price: number } }) => {
    const currentSegments = (formData.step1.segments || []) as BookingSegment[];
    
    // If this is the first time adding segments, create outbound from existing data first
    if (currentSegments.length === 0) {
      // ✅ CRITICAL FIX: Get pricing from formData first, then try pricingTiers as fallback
      let outboundPricing: PricingBreakdown;
      
      if (formData.step1.pricing && formData.step1.pricing.total > 0) {
        outboundPricing = { ...formData.step1.pricing };
      } else if (pricingTiersRef?.standard?.price && pricingTiersRef.standard.price > 0) {
        // Use pricingTiers if formData.step1.pricing is not set
        const basePrice = pricingTiersRef.standard.price;
        outboundPricing = {
          baseFee: basePrice * 0.4,
          distanceFee: basePrice * 0.3,
          volumeFee: basePrice * 0.15,
          serviceFee: basePrice * 0.1,
          urgencyFee: 0,
          vat: basePrice * 0.05,
          total: basePrice,
          distance: formData.step1.distance || 0,
        };
        console.log('✅ Using pricingTiers for return segment pricing:', basePrice);
      } else {
        outboundPricing = {
          baseFee: 0,
          distanceFee: 0,
          volumeFee: 0,
          serviceFee: 0,
          urgencyFee: 0,
          vat: 0,
          total: 0,
          distance: formData.step1.distance || 0,
        };
      }
      
      // ✅ CRITICAL FIX: Ensure items are properly copied with deep copy
      const outboundItems = (formData.step1.items && Array.isArray(formData.step1.items) && formData.step1.items.length > 0)
        ? formData.step1.items.map(item => ({ ...item }))
        : [];
      
      const outboundSegment: BookingSegment = {
        id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        segmentType: 'outbound',
        sequenceNumber: 0,
        pickupAddress: formData.step1.pickupAddress,
        dropoffAddress: formData.step1.dropoffAddress,
        pickupProperty: formData.step1.pickupProperty,
        dropoffProperty: formData.step1.dropoffProperty,
        datetime: formData.step1.pickupDate || new Date().toISOString(),
        estimatedArrival: undefined,
        items: outboundItems,
        pricing: outboundPricing,
        distance: formData.step1.distance || 0,
        estimatedDuration: formData.step1.estimatedDuration || 0,
        notes: '',
      };
      
      const returnSegment = mirrorSegmentForReturn(outboundSegment, bufferMinutes);
      
      // ✅ CRITICAL FIX: Copy pricing from outbound for return journey (same distance = same price)
      // This prevents £0.00 pricing bug when API hasn't calculated return segment yet
      returnSegment.pricing = {
        ...outboundPricing,
        distance: outboundSegment.distance || 0,
      };
      returnSegment.distance = outboundSegment.distance;
      returnSegment.estimatedDuration = outboundSegment.estimatedDuration;
      
      // ✅ CRITICAL FIX: Ensure return segment has items (deep copy from outbound)
      // This ensures items are always present in return segment
      if (!returnSegment.items || returnSegment.items.length === 0) {
        returnSegment.items = outboundItems.length > 0 
          ? outboundItems.map(item => ({ ...item }))
          : [];
      } else {
        // Ensure items are deep copied
        returnSegment.items = returnSegment.items.map(item => ({ ...item }));
      }
      
      updateFormData('step1', {
        isMultiLeg: true,
        segments: [outboundSegment, returnSegment],
      });
      
      console.log('✅ Created outbound segment from existing data and added return segment', {
        outboundItemsCount: outboundItems.length,
        returnItemsCount: returnSegment.items.length,
        outboundPricing: outboundPricing.total,
        returnPricing: returnSegment.pricing.total,
      });
      return;
    }
    
    // Find outbound segment (first segment or last segment if no outbound)
    const outboundSegment = currentSegments.find(s => s.segmentType === 'outbound') || currentSegments[currentSegments.length - 1];
    
    if (!outboundSegment) {
      console.error('No outbound segment found to create return from');
      return;
    }

    // ✅ CRITICAL FIX: Ensure outbound segment has items before creating return
    const outboundItems = (outboundSegment.items && Array.isArray(outboundSegment.items) && outboundSegment.items.length > 0)
      ? outboundSegment.items.map(item => ({ ...item }))
      : (formData.step1.items && Array.isArray(formData.step1.items) && formData.step1.items.length > 0)
      ? formData.step1.items.map(item => ({ ...item }))
      : [];

    // Create return segment
    const returnSegment = mirrorSegmentForReturn(outboundSegment, bufferMinutes);
    
    // ✅ CRITICAL FIX: Ensure return segment has items (deep copy from outbound)
    returnSegment.items = outboundItems.length > 0 
      ? outboundItems.map(item => ({ ...item }))
      : [];
    
    // ✅ CRITICAL FIX: Get pricing from outbound segment first, then try pricingTiers as fallback
    let outboundPricing: PricingBreakdown;
    
    if (outboundSegment.pricing && outboundSegment.pricing.total > 0) {
      outboundPricing = { ...outboundSegment.pricing };
    } else if (pricingTiersRef?.standard?.price && pricingTiersRef.standard.price > 0) {
      // Use pricingTiers if outbound segment pricing is not set
      const basePrice = pricingTiersRef.standard.price;
      outboundPricing = {
        baseFee: basePrice * 0.4,
        distanceFee: basePrice * 0.3,
        volumeFee: basePrice * 0.15,
        serviceFee: basePrice * 0.1,
        urgencyFee: 0,
        vat: basePrice * 0.05,
        total: basePrice,
        distance: outboundSegment.distance || 0,
      };
      console.log('✅ Using pricingTiers for return segment pricing (existing segments):', basePrice);
    } else {
      outboundPricing = {
        baseFee: 0,
        distanceFee: 0,
        volumeFee: 0,
        serviceFee: 0,
        urgencyFee: 0,
        vat: 0,
        total: 0,
        distance: outboundSegment.distance || 0,
      };
    }
    
    returnSegment.pricing = {
      ...outboundPricing,
      distance: outboundSegment.distance || 0,
    };
    returnSegment.distance = outboundSegment.distance;
    returnSegment.estimatedDuration = outboundSegment.estimatedDuration;
    
    // Add to segments
    const updatedSegments = [...currentSegments, returnSegment];
    
    updateFormData('step1', {
      isMultiLeg: true,
      segments: updatedSegments,
    });

    console.log('✅ Return segment added:', {
      returnSegment: returnSegment.id,
      itemsCount: returnSegment.items.length,
      pricing: returnSegment.pricing.total,
      outboundItemsCount: outboundItems.length,
    });
  }, [formData.step1, updateFormData]);

  /**
   * Add blank additional segment
   * ✅ FIXED: Ensures items are properly copied from outbound segment
   * ✅ FIXED: Accepts pricingTiers to set accurate outbound pricing when segments don't exist yet
   */
  const addAdditionalSegment = useCallback((pricingTiersRef?: { standard?: { price: number } }) => {
    const currentSegments = (formData.step1.segments || []) as BookingSegment[];
    
    // ✅ CRITICAL FIX: Get items from the most reliable source
    const getItemsForSegment = (): any[] => {
      // Priority 1: Items from first segment (outbound) if exists
      if (currentSegments.length > 0 && currentSegments[0]?.items && Array.isArray(currentSegments[0].items) && currentSegments[0].items.length > 0) {
        return currentSegments[0].items.map(item => ({ ...item }));
      }
      // Priority 2: Global items from formData
      if (formData.step1.items && Array.isArray(formData.step1.items) && formData.step1.items.length > 0) {
        return formData.step1.items.map(item => ({ ...item }));
      }
      // Priority 3: Empty array
      return [];
    };
    
    const itemsToCopy = getItemsForSegment();
    
    // If this is the first time adding segments, create outbound from existing data first
    if (currentSegments.length === 0) {
      // ✅ CRITICAL FIX: Get pricing from formData first, then try pricingTiers as fallback
      let outboundPricing: PricingBreakdown;
      
      if (formData.step1.pricing && formData.step1.pricing.total > 0) {
        outboundPricing = { ...formData.step1.pricing };
      } else if (pricingTiersRef?.standard?.price && pricingTiersRef.standard.price > 0) {
        // Use pricingTiers if formData.step1.pricing is not set
        const basePrice = pricingTiersRef.standard.price;
        outboundPricing = {
          baseFee: basePrice * 0.4,
          distanceFee: basePrice * 0.3,
          volumeFee: basePrice * 0.15,
          serviceFee: basePrice * 0.1,
          urgencyFee: 0,
          vat: basePrice * 0.05,
          total: basePrice,
          distance: formData.step1.distance || 0,
        };
        console.log('✅ Using pricingTiers for outbound segment pricing (addAdditionalSegment):', basePrice);
      } else {
        outboundPricing = {
          baseFee: 0,
          distanceFee: 0,
          volumeFee: 0,
          serviceFee: 0,
          urgencyFee: 0,
          vat: 0,
          total: 0,
          distance: formData.step1.distance || 0,
        };
      }
      
      const outboundSegment: BookingSegment = {
        id: `segment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        segmentType: 'outbound',
        sequenceNumber: 0,
        pickupAddress: formData.step1.pickupAddress,
        dropoffAddress: formData.step1.dropoffAddress,
        pickupProperty: formData.step1.pickupProperty,
        dropoffProperty: formData.step1.dropoffProperty,
        datetime: formData.step1.pickupDate || new Date().toISOString(),
        estimatedArrival: undefined,
        items: itemsToCopy.length > 0 ? itemsToCopy.map(item => ({ ...item })) : [],
        pricing: outboundPricing,
        distance: formData.step1.distance || 0,
        estimatedDuration: formData.step1.estimatedDuration || 0,
        notes: '',
      };
      
      const additionalSegment = createBlankSegment(1);
      // ✅ CRITICAL FIX: Deep copy items from outbound segment to additional segment
      additionalSegment.items = itemsToCopy.length > 0 ? itemsToCopy.map(item => ({ ...item })) : [];
      
      updateFormData('step1', {
        isMultiLeg: true,
        segments: [outboundSegment, additionalSegment],
      });
      
      console.log('✅ Created outbound segment from existing data and added additional segment with items:', {
        outboundItemsCount: outboundSegment.items.length,
        additionalItemsCount: additionalSegment.items.length,
        outboundPricing: outboundPricing.total,
      });
      return;
    }
    
    // Otherwise, just add a new additional segment
    // ✅ CRITICAL FIX: Copy items from the first segment (outbound) - this is the most common case
    // Users typically want the same items for all segments
    const nextSequenceNumber = currentSegments.length;
    const newSegment = createBlankSegment(nextSequenceNumber);
    // ✅ CRITICAL FIX: Deep copy items from source to ensure no reference issues
    newSegment.items = itemsToCopy.length > 0 ? itemsToCopy.map(item => ({ ...item })) : [];
    
    const updatedSegments = [...currentSegments, newSegment];
    
    updateFormData('step1', {
      isMultiLeg: true,
      segments: updatedSegments,
    });

    console.log('✅ Additional segment added with items copied:', {
      segmentIndex: nextSequenceNumber,
      itemsCount: newSegment.items.length,
      items: newSegment.items.map(i => ({ id: i.id, name: i.name, quantity: i.quantity }))
    });
  }, [formData.step1, updateFormData]);

  /**
   * Update specific segment
   */
  const updateSegment = useCallback((index: number, segmentData: Partial<BookingSegment>) => {
    const currentSegments = (formData.step1.segments || []) as BookingSegment[];
    
    if (index < 0 || index >= currentSegments.length) {
      console.error('Invalid segment index:', index);
      return;
    }

    // Deep copy items array if provided to preserve structure
    let mergedSegmentData = { ...segmentData };
    if ('items' in segmentData && Array.isArray(segmentData.items)) {
      // Deep copy items array to avoid reference issues
      mergedSegmentData.items = segmentData.items.map(item => ({ ...item }));
    }

    const updatedSegments = currentSegments.map((segment, i) => 
      i === index ? { ...segment, ...mergedSegmentData } : segment
    );

    console.log(`📝 Updating segment ${index} with data:`, {
      ...segmentData,
      itemsCount: segmentData.items?.length || 'not provided'
    });
    console.log(`📝 Segment ${index} after update:`, {
      hasItems: !!updatedSegments[index]?.items,
      itemsCount: updatedSegments[index]?.items?.length || 0,
      items: updatedSegments[index]?.items?.map(i => ({ id: i.id, name: i.name, quantity: i.quantity })) || []
    });

    updateFormData('step1', {
      segments: updatedSegments,
    });

    console.log(`✅ Segment ${index} updated successfully`);
  }, [formData.step1.segments, updateFormData]);

  /**
   * Remove segment
   */
  const removeSegment = useCallback(async (index: number) => {
    const currentSegments = (formData.step1.segments || []) as BookingSegment[];
    
    if (index < 0 || index >= currentSegments.length) {
      console.error('Invalid segment index:', index);
      return;
    }

    // Remove segment and update sequence numbers
    const filteredSegments = currentSegments.filter((_, i) => i !== index);
    const updatedSegments = updateSequenceNumbers(filteredSegments);

    updateFormData('step1', {
      isMultiLeg: updatedSegments.length > 1,
      segments: updatedSegments,
    });

    console.log(`✅ Segment ${index} removed, triggering pricing recalculation`);
    
    // Trigger pricing recalculation after segment removal
    // This ensures the total price updates immediately
    if (updatedSegments.length > 0) {
      setTimeout(() => {
        calculatePricing();
      }, 100);
    }
  }, [formData.step1.segments, updateFormData, calculatePricing]);

  /**
   * Validate segment chronology
   * Returns true if all segments are in correct time order
   */
  const validateSegments = useCallback((): { valid: boolean; errors: string[] } => {
    const currentSegments = (formData.step1.segments || []) as BookingSegment[];
    
    if (currentSegments.length === 0) {
      return { valid: true, errors: [] };
    }

    const allErrors: string[] = [];

    // Validate required fields for each segment
    currentSegments.forEach((segment, index) => {
      const fieldErrors = validateSegmentRequiredFields(segment);
      fieldErrors.forEach(error => {
        allErrors.push(`Segment ${index + 1}: ${error.message}`);
      });
    });

    // Validate chronology
    const chronologyValidation = validateSegmentChronology(currentSegments);
    if (!chronologyValidation.valid) {
      chronologyValidation.errors.forEach(error => {
        allErrors.push(error.message);
      });
    }

    return {
      valid: allErrors.length === 0,
      errors: allErrors,
    };
  }, [formData.step1.segments]);

  /**
   * Get total price from all segments
   */
  const getTotalSegmentsPrice = useCallback((): number => {
    const currentSegments = (formData.step1.segments || []) as BookingSegment[];
    return calculateTotalPrice(currentSegments);
  }, [formData.step1.segments]);

  // ============================================
  // END MULTI-LEG BOOKING FUNCTIONS
  // ============================================

  return {
    formData,
    updateFormData,
    validateStep,
    isStepValid,
    errors,
    clearErrors,
    resetForm,
    calculatePricing,
    isCalculatingPricing,
    validatePromotionCode,
    applyPromotionCode,
    removePromotionCode,
    
    // Multi-leg booking functions
    addReturnSegment,
    addAdditionalSegment,
    updateSegment,
    removeSegment,
    validateSegments,
    getTotalSegmentsPrice,
  };
}