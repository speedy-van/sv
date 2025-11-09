'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';
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

export function useBookingForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [isCalculatingPricing, setIsCalculatingPricing] = useState(false);

  const updateFormData = useCallback((step: keyof FormData, data: Partial<FormData[keyof FormData]>) => {
    setFormData(prev => {
      // Always update - don't skip updates for items array or other critical fields
      // The comparison logic was too aggressive and causing missed updates
      const shouldUpdate = Object.keys(data).some(key => {
        const newValue = (data as any)[key];
        const currentValue = (prev[step] as any)[key];
        
        // Special handling for arrays (like items) - always update if array is provided
        if (Array.isArray(newValue)) {
          // If items array is being updated, always allow it
          if (key === 'items') {
            return true; // Always update items array
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
      let nextStepData: any = { ...prev[step], ...data };
      if (step === 'step1') {
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
        [step]: nextStepData,
      };
      console.log(`Updating ${step}:`, data);
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

  const resetForm = useCallback(() => {
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

  // Calculate pricing using the unified pricing API
  const calculatePricing = useCallback(async (): Promise<boolean> => {
    const { items, pickupAddress, dropoffAddress } = formData.step1;

    // Early validation - don't proceed without required data
    if (items.length === 0) {
      // Reset pricing if no items
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
      return true;
    }

    // CRITICAL FIX: Check CompleteAddress format from UKAddressAutocomplete
    const hasPickupAddress = pickupAddress?.full || pickupAddress?.line1 || pickupAddress?.address || pickupAddress?.formatted_address;
    const hasDropoffAddress = dropoffAddress?.full || dropoffAddress?.line1 || dropoffAddress?.address || dropoffAddress?.formatted_address;

    // Check for valid coordinates (not default 0,0 values)
    const hasValidPickupCoordinates = pickupAddress?.coordinates?.lat && pickupAddress?.coordinates?.lng &&
                                     (pickupAddress.coordinates.lat !== 0 || pickupAddress.coordinates.lng !== 0);
    const hasValidDropoffCoordinates = dropoffAddress?.coordinates?.lat && dropoffAddress?.coordinates?.lng &&
                                      (dropoffAddress.coordinates.lat !== 0 || dropoffAddress.coordinates.lng !== 0);

    if (!hasPickupAddress || !hasDropoffAddress) {
      console.log('⏳ Skipping pricing calculation - addresses not yet selected', {
        pickup: !!hasPickupAddress,
        dropoff: !!hasDropoffAddress,
        pickupData: pickupAddress,
        dropoffData: dropoffAddress
      });
      return false;
    }

    if (!hasValidPickupCoordinates || !hasValidDropoffCoordinates) {
      console.log('⏳ Skipping pricing calculation - coordinates not yet resolved', {
        pickup: !!hasValidPickupCoordinates,
        dropoff: !!hasValidDropoffCoordinates,
        pickupCoords: pickupAddress?.coordinates,
        dropoffCoords: dropoffAddress?.coordinates
      });
      return false;
    }

    setIsCalculatingPricing(true);
    clearErrors(); // Clear any previous errors

    try {
      // CRITICAL FIX: Extract address text from CompleteAddress format
      const pickupAddressText = pickupAddress.full || pickupAddress.line1 || pickupAddress.address || pickupAddress.formatted_address;
      const dropoffAddressText = dropoffAddress.full || dropoffAddress.line1 || dropoffAddress.address || dropoffAddress.formatted_address;
      
      if (!pickupAddressText || !dropoffAddressText) {
        throw new Error('Pickup and dropoff addresses are required');
      }

      console.log('🧮 Starting pricing calculation with:', {
        items: items.length,
        pickup: pickupAddressText,
        dropoff: dropoffAddressText,
        pickupPostcode: pickupAddress?.postcode,
        dropoffPostcode: dropoffAddress?.postcode,
        pickupCoordinates: pickupAddress.coordinates,
        dropoffCoordinates: dropoffAddress.coordinates,
        serviceType: formData.step1.serviceType,
        pickupDate: formData.step1.pickupDate
      });

      // Generate correlation ID for tracking
      const correlationId = `pricing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 🔧 FIX: Prepare data for API call matching the expected PricingInputSchema format
      const pricingData = {
        items: items.map(item => ({
          id: item.id || `item-${Date.now()}-${Math.random()}`,
          name: item.name || 'Unknown Item',
          category: item.category || 'furniture',
          quantity: item.quantity || 1,
          weight: item.weight || 10, // Use actual weight from UK dataset
          volume: item.volume || 0.1, // Use actual volume from UK dataset
          fragile: item.fragility_level === 'High' || item.fragility_level === 'Medium',
          oversize: (item.weight || 0) > 100 || (item.volume || 0) > 2,
          disassemblyRequired: item.dismantling_required === 'Yes',
          specialHandling: item.special_handling_notes ? [item.special_handling_notes] : []
        })),
        
        // 🔧 FIX: Use 'pickup' (not 'pickupAddress') to match API schema
        pickup: {
          address: pickupAddress.full || pickupAddress.line1 || pickupAddress.address || pickupAddress.formatted_address || '',
          postcode: pickupAddress.postcode || '',
          coordinates: {
            lat: pickupAddress.coordinates?.lat || 51.5074,
            lng: pickupAddress.coordinates?.lng || -0.1278
          },
          propertyDetails: {
            type: formData.step1.pickupProperty?.type || 'house',
            floors: formData.step1.pickupProperty?.floors || 0,
            hasLift: Boolean(formData.step1.pickupProperty?.hasLift),
            hasParking: formData.step1.pickupProperty?.hasParking !== false,
            accessNotes: formData.step1.pickupProperty?.accessNotes,
            requiresPermit: Boolean(formData.step1.pickupProperty?.requiresPermit)
          }
        },
        
        // 🔧 FIX: Use 'dropoffs' (array, not 'dropoffAddress') to match API schema
        dropoffs: [{
          address: dropoffAddress.full || dropoffAddress.line1 || dropoffAddress.address || dropoffAddress.formatted_address || '',
          postcode: dropoffAddress.postcode || '',
          coordinates: {
            lat: dropoffAddress.coordinates?.lat || 51.5074,
            lng: dropoffAddress.coordinates?.lng || -0.1278
          },
          propertyDetails: {
            type: formData.step1.dropoffProperty?.type || 'house',
            floors: formData.step1.dropoffProperty?.floors || 0,
            hasLift: Boolean(formData.step1.dropoffProperty?.hasLift),
            hasParking: formData.step1.dropoffProperty?.hasParking !== false,
            accessNotes: formData.step1.dropoffProperty?.accessNotes,
            requiresPermit: Boolean(formData.step1.dropoffProperty?.requiresPermit)
          },
          itemIds: items.map(item => item.id)
        }],
        
        // 🔧 FIX: Use 'serviceLevel' (not 'serviceType') to match API schema
        serviceLevel: formData.step1.serviceType || 'signature',
        scheduledDate: formData.step1.pickupDate ?
          new Date(formData.step1.pickupDate + 'T10:00:00').toISOString() :
          new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        timeSlot: mapTimeSlotToAPI(formData.step1.pickupTimeSlot) || 'flexible',
        
        addOns: {
          packingService: false,
          insuranceCoverage: false,
          storageRequired: false,
          dismantlingRequired: items.some(item => item.dismantling_required === 'Yes')
        },
        
        preferences: {
          vehicleType: 'van',
          urgency: formData.step1.urgency || 'standard',
          environmentalPreference: 'standard'
        },
        
        metadata: {
          source: 'booking-luxury',
          version: '1.0.0'
        }
      };

      console.log('🔍 Sending pricing request:', { 
        correlationId, 
        itemsCount: pricingData.items.length,
        pickup: pricingData.pickup?.postcode,
        dropoff: pricingData.dropoffs?.[0]?.postcode,
        service: pricingData.serviceLevel
      });

      // Call the unified pricing API
      const response = await fetch('/api/pricing/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId,
        },
        body: JSON.stringify(pricingData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('❌ Pricing API error:', {
          status: response.status,
          statusText: response.statusText,
          correlationId,
          result
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

      // Update pricing in form data using API response
      const apiPricing = result.data;

      // Calculate three-tier pricing based on API response
      const basePrice = apiPricing.amountGbpMinor / 100;

      console.log('✅ Pricing calculated successfully:', {
        total: `£${basePrice}`,
        breakdown: {
          base: `£${(apiPricing.breakdown.baseFee / 100).toFixed(2)}`,
          distance: `£${(apiPricing.breakdown.distanceFee / 100).toFixed(2)}`,
          service: `£${(apiPricing.breakdown.serviceFee / 100).toFixed(2)}`,
          vat: `£${(apiPricing.vatAmount / 100).toFixed(2)}`
        },
        distance: `${apiPricing.route.totalDistance.toFixed(1)} miles`,
        vehicle: apiPricing.recommendedVehicle.name
      });

      const finalPricing = {
        baseFee: Math.round(apiPricing.breakdown.baseFee) / 100, // Convert from pence
        distanceFee: Math.round(apiPricing.breakdown.distanceFee) / 100,
        volumeFee: Math.round(apiPricing.breakdown.itemsFee) / 100, // Items fee from API
        serviceFee: Math.round(apiPricing.breakdown.serviceFee) / 100,
        urgencyFee: Math.round(apiPricing.breakdown.vehicleFee) / 100, // Vehicle fee as urgency fee for UI compatibility
        vat: Math.round(apiPricing.vatAmount) / 100,
        total: Math.round(basePrice * 100) / 100, // Store base price for calculations
        distance: Math.round(apiPricing.route.totalDistance * 100) / 100,
      };

      console.log('💰 Updating form data with pricing:', finalPricing);
      console.log('📊 Pricing update details:', {
        hasValidPricing: finalPricing.total > 0,
        totalAmount: finalPricing.total,
        baseFee: finalPricing.baseFee,
        distanceFee: finalPricing.distanceFee,
        itemsFee: finalPricing.volumeFee,
        serviceFee: finalPricing.serviceFee
      });

      updateFormData('step1', { pricing: finalPricing });

      console.log('🎉 Pricing calculation completed successfully!');
      console.log('✅ Form data after pricing update:', {
        hasItems: formData.step1.items.length > 0,
        hasPricing: formData.step1.pricing.total > 0,
        pricingTotal: formData.step1.pricing.total
      });
      return true;
    } catch (error) {
      console.error('❌ Pricing calculation error:', { error, items: items.length, addresses: { pickup: !!pickupAddress.address, dropoff: !!dropoffAddress.address } });

      // Set error state with detailed message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors({
        pricing: `Unable to calculate pricing: ${errorMessage}. Please check your items and addresses and try again.`
      });

      // Still show a fallback price based on item totals
      const itemsTotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
      const fallbackTotal = Math.max(35, itemsTotal * 1.2); // 20% markup as fallback

      updateFormData('step1', {
        pricing: {
          baseFee: Math.round(fallbackTotal * 0.6 * 100) / 100,
          distanceFee: Math.round(fallbackTotal * 0.15 * 100) / 100,
          volumeFee: Math.round(fallbackTotal * 0.1 * 100) / 100,
          serviceFee: Math.round(fallbackTotal * 0.1 * 100) / 100,
          urgencyFee: 0,
          vat: Math.round(fallbackTotal * 0.2 * 100) / 100,
          total: Math.round(fallbackTotal * 1.2 * 100) / 100,
          distance: 10,
        },
      });

      return false;
    } finally {
      setIsCalculatingPricing(false);
    }
  }, [formData.step1, updateFormData, clearErrors]);

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
  };
}