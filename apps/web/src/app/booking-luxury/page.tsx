'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  safeLocalStorageGetItem,
  safeLocalStorageRemoveItem,
} from '@/lib/safe-storage';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Progress,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Icon,
  Flex,
  useColorModeValue,
  Divider,
  Stack,
  Circle,
  Spinner,
  SimpleGrid,
  IconButton,
} from '@chakra-ui/react';
import { FaArrowLeft, FaArrowRight, FaCheck, FaTruck, FaShieldAlt, FaClock, FaMapMarkerAlt, FaPhone, FaStar, FaPlus, FaMinus, FaExclamationTriangle, FaRedo, FaTrash } from 'react-icons/fa';
import { Image } from '@chakra-ui/react';
// @ts-ignore - Temporary fix for Next.js module resolution
import { useSearchParams, useRouter } from 'next/navigation';
import AddressesStep from './components/AddressesStep';
import WhereAndWhatStep from './components/WhereAndWhatStep';
import WhereAndWhatStepHierarchical from './components/WhereAndWhatStepHierarchical';
import WhoAndPaymentStepSimple from './components/WhoAndPaymentStep_Simple';
import { useBookingForm } from './hooks/useBookingForm';
import FloatingActionButtons from './components/FloatingActionButtons';
import AIItemExtractionAssistant from './components/AIItemExtractionAssistant';
import CustomerChatWidget from '@/components/customer/CustomerChatWidget';
import SelectedItemsManager from './components/SelectedItemsManager';
import type { BookingSegment } from './types/segment';
import { 
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';

// Removed ItemImage component - using icons instead

const STEPS = [
  { 
    id: 1, 
    title: 'Addresses', 
    description: 'Pickup and drop-off locations',
    icon: FaMapMarkerAlt,
    shortTitle: 'Addresses',
    color: 'blue'
  },
  { 
    id: 2, 
    title: 'Items & Schedule', 
    description: 'Choose your items and pick the perfect time',
    icon: FaClock,
    shortTitle: 'Items & Time',
    color: 'purple'
  },
  { 
    id: 3, 
    title: 'Payment', 
    description: 'Customer details and payment',
    icon: FaCheck,
    shortTitle: 'Checkout',
    color: 'green'
  },
];

export default function BookingLuxuryPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isClient, setIsClient] = useState<boolean>(false);
  const router = useRouter();
  
  // Wave effects for step headers
  const [addressWaveActive, setAddressWaveActive] = useState(false);
  const [itemsDetailsWaveActive, setItemsDetailsWaveActive] = useState(false);
  const [checkoutWaveActive, setCheckoutWaveActive] = useState(false);
  const toast = useToast();
  const searchParams = useSearchParams();
  
  // Auto-progression flags
  const [isAutoTransitioning, setIsAutoTransitioning] = useState(false);
  
  // Unified floating buttons state
  const { 
    isOpen: isChatOpen, 
    onOpen: onChatOpen, 
    onClose: onChatClose 
  } = useDisclosure();
  
  const { 
    isOpen: isAIOpen, 
    onOpen: onAIOpen, 
    onClose: onAIClose 
  } = useDisclosure();
  
  const { 
    isOpen: isItemsOpen, 
    onOpen: onItemsOpen, 
    onClose: onItemsClose 
  } = useDisclosure();

  // Ensure the booking flow uses immediate scroll behavior to avoid jump-to-top glitches
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    htmlEl.classList.add('booking-luxury-no-smooth');
    bodyEl.classList.add('booking-luxury-no-smooth');

    return () => {
      htmlEl.classList.remove('booking-luxury-no-smooth');
      bodyEl.classList.remove('booking-luxury-no-smooth');
    };
  }, []);
  

  /**
   * CRITICAL: Booking form state management
   * 
   * formData is stored in React state ONLY (not localStorage)
   * This ensures:
   * 1. Address data persists when navigating between steps
   * 2. Data is cleared when the booking page is closed/refreshed
   * 3. No customer data leaks between different bookings on the same computer
   * 
   * Customer service can safely use this on shared computers because:
   * - Data exists only during the active browser tab session
   * - Closing the tab or refreshing clears all data
   * - No addresses are stored permanently
   * - Each booking is isolated
   */
  const {
    formData,
    updateFormData,
    validateStep,
    isStepValid,
    errors,
    clearErrors,
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
  } = useBookingForm();


  // Enterprise Engine: Automatic availability & pricing with full addresses
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [pricingTiers, setPricingTiers] = useState<{
    economy: any;
    standard: any;
    express: any;
  } | null>(null);

  // ✅ CRITICAL FIX: Ref to accumulate segment pricing updates and apply atomically
  // This prevents the stale closure bug where parallel pricing updates overwrite each other
  const pendingSegmentPricing = useRef<Map<number, any>>(new Map());

  // ✅ CRITICAL FIX: Wrap addReturnSegment to pass pricingTiers for accurate pricing
  const addReturnSegmentWithPricing = useCallback((bufferMinutes: number = 30) => {
    addReturnSegment(bufferMinutes, pricingTiers || undefined);
  }, [addReturnSegment, pricingTiers]);

  // ✅ CRITICAL FIX: Wrap addAdditionalSegment to pass pricingTiers for accurate outbound pricing
  const addAdditionalSegmentWithPricing = useCallback(() => {
    addAdditionalSegment(pricingTiers || undefined);
  }, [addAdditionalSegment, pricingTiers]);

  // Normalize address from autocomplete to comprehensive pricing schema
  // ✅ MOVED UP: Must be defined before calculateSegmentPricing which depends on it
  const normalizeAddressForPricing = useCallback((addr: any) => {
    if (!addr) return null;
    
    const components = addr.components || {};
    
    // Extract full address
    const full = 
      addr.formatted_address || 
      addr.fullAddress || 
      addr.full ||
      addr.displayText || 
      addr.place_name || 
      '';
    
    // Extract from displayText or full (Google format: "22 Sword St, Glasgow G31 1TD, UK")
    const firstPart = full.split(',')[0]?.trim() || '';
    
    // Extract street number with improved pattern matching
    let number = components.street_number || components.house_number || addr.houseNumber || addr.number || '';
    if (!number && firstPart) {
      const match = firstPart.match(/(?:Flat\s+\d+,?\s+)?(\d+[a-zA-Z]?(?:-\d+[a-zA-Z]?)?)/);
      if (match) {
        number = match[1];
      }
    }
    if (!number) {
      const numberMatch = full.match(/\b(\d+[a-zA-Z]?)\b/);
      if (numberMatch) {
        number = numberMatch[1];
      }
    }
    if (!number) number = '1';
    
    // Extract street name with improved logic
    let street = components.route || components.road || components.street || addr.street || '';
    if (!street && firstPart) {
      street = firstPart
        .replace(/^(?:Flat\s+\d+,?\s+)?\d+[a-zA-Z]?(?:-\d+[a-zA-Z]?)?\s*,?\s*/, '')
        .trim();
    }
    if (!street && full) {
      const parts = full.split(',');
      if (parts.length > 0) {
        street = parts[0].replace(/^\d+[a-zA-Z]?\s+/, '').trim() || 'Main Street';
      }
    }
    if (!street) street = 'Main Street';
    
    // Extract city
    const city = 
      addr.city || 
      components.city || 
      components.locality || 
      components.post_town || 
      'London';
    
    // Extract postcode
    const postcode = 
      addr.postcode || 
      components.postcode || 
      components.postal_code || 
      'SW1A 1AA';
    
    // Extract line1
    const line1 = firstPart || `${number} ${street}`;
    
    // Extract coordinates
    const coordinates = addr.coordinates || addr.location || { lat: 0, lng: 0 };
    
    return { full, line1, city, postcode, street, number, coordinates };
  }, []);

  // Calculate pricing for individual segments in multi-leg bookings
  // ✅ FIXED: Use functional update to avoid stale closure bug
  const calculateSegmentPricing = useCallback(async (segmentIndex: number) => {
    // Read segments from formData (will be stale but we'll use functional update later)
    const currentSegments = (formData.step1.segments || []) as any[];
    if (currentSegments.length <= 1) {
      console.log('⏭️ Not a multi-leg booking');
      return;
    }

    const segment = currentSegments[segmentIndex];
    if (!segment) {
      console.error('Invalid segment index:', segmentIndex);
      return;
    }

    console.log(`🔍 calculateSegmentPricing for segment ${segmentIndex}:`, {
      segmentItems: segment.items,
      globalItems: formData.step1.items,
      segmentItemsLength: segment.items?.length || 0,
      globalItemsLength: formData.step1.items?.length || 0
    });

    // Resolve items: prefer segment items, else fall back to global items
    const itemsToUse = (segment.items && segment.items.length > 0)
      ? segment.items
      : (formData.step1.items || []);

    if (!itemsToUse || itemsToUse.length === 0) {
      console.log(`⏭️ Segment ${segmentIndex}: No items selected yet - skipping pricing`);
      return;
    }

    // Check addresses
    const pickupNorm = normalizeAddressForPricing(segment.pickupAddress);
    const dropNorm = normalizeAddressForPricing(segment.dropoffAddress);

    if (!pickupNorm?.coordinates?.lat || !dropNorm?.coordinates?.lat) {
      console.log(`⏭️ Segment ${segmentIndex}: Missing coordinates - skipping pricing`);
      return;
    }

    const postcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
    const pickupPostcode = pickupNorm?.postcode?.trim();
    const dropPostcode = dropNorm?.postcode?.trim();

    if (!pickupPostcode || !postcodeRegex.test(pickupPostcode)) {
      console.log(`⏭️ Segment ${segmentIndex}: Invalid pickup postcode, skipping pricing`, pickupPostcode);
      return;
    }

    if (!dropPostcode || !postcodeRegex.test(dropPostcode)) {
      console.log(`⏭️ Segment ${segmentIndex}: Invalid dropoff postcode, skipping pricing`, dropPostcode);
      return;
    }

    try {
      // Filter out invalid items before sending
      const validItems = itemsToUse.filter((item: any) => 
        item && item.id && item.name && item.quantity > 0
      );
      
      if (validItems.length === 0) {
        console.log(`⏭️ Segment ${segmentIndex}: No valid items after filtering - skipping pricing`);
        return;
      }
      
      console.log(`📤 Calculating pricing for segment ${segmentIndex} with ${validItems.length} valid items`);

      // Use actual service level from formData (signature/premium/white-glove)
      const actualServiceLevel = formData.step1.serviceType || 'signature';
      // Map urgency to API-compatible format (API only accepts standard/express/urgent)
      // Frontend uses: 'scheduled', 'same-day', 'next-day'
      // API expects: 'standard', 'express', 'urgent'
      const mapUrgencyToAPI = (urgency?: string): 'standard' | 'express' | 'urgent' => {
        if (!urgency) return 'standard';
        const lowerUrgency = urgency.toLowerCase();
        if (lowerUrgency === 'scheduled' || lowerUrgency === 'economy') return 'standard';
        if (lowerUrgency === 'same-day' || lowerUrgency === 'next-day') return 'express';
        if (lowerUrgency === 'urgent' || lowerUrgency === 'immediate') return 'urgent';
        // If already in API format, return as-is (but validate)
        if (lowerUrgency === 'standard' || lowerUrgency === 'express' || lowerUrgency === 'urgent') {
          return lowerUrgency as 'standard' | 'express' | 'urgent';
        }
        return 'standard';
      };
      const actualUrgency = mapUrgencyToAPI(formData.step1.urgency);
      
      console.log(`🎯 Using service level: ${actualServiceLevel}, urgency: ${actualUrgency} (mapped from ${formData.step1.urgency})`);

      const response = await fetch('/api/pricing/comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: validItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            weight_override: item.weight,
            volume_override: item.volume
          })),
          pickup: { 
            full: pickupNorm?.full || 'Pickup Address',
            line1: pickupNorm?.line1 || '1 Main Street',
            city: pickupNorm?.city || 'London',
            postcode: pickupNorm?.postcode || 'SW1A 1AA',
            propertyType: 'house' as const,
            street: pickupNorm?.street || 'Main Street',
            number: pickupNorm?.number || '1',
            coordinates: {
              lat: pickupNorm?.coordinates?.lat || 0,
              lng: pickupNorm?.coordinates?.lng || 0
            }
          },
          dropoffs: [{
            full: dropNorm?.full || 'Dropoff Address',
            line1: dropNorm?.line1 || '1 Main Street',
            city: dropNorm?.city || 'London',
            postcode: dropNorm?.postcode || 'SW1A 1AA',
            propertyType: 'house' as const,
            street: dropNorm?.street || 'Main Street',
            number: dropNorm?.number || '1',
            coordinates: {
              lat: dropNorm?.coordinates?.lat || 0,
              lng: dropNorm?.coordinates?.lng || 0
            }
          }],
          scheduledDate: segment.datetime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          serviceLevel: actualServiceLevel,
          urgency: actualUrgency,
          timeSlot: formData.step1.pickupTimeSlot || 'flexible',
          // ✅ CRITICAL: Include crewSize for crew surcharge calculation
          // Crew size affects price: 2-men = +20%, 3-men = +35%, 4-men = +50%
          crewSize: formData.step1.crewSize || '1'
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (data && data.success === true && data.data) {
          const apiData = data.data;
          const amountMinor = typeof apiData.amountGbpMinor === 'string' 
            ? parseFloat(apiData.amountGbpMinor) 
            : apiData.amountGbpMinor;

          const totalPrice = amountMinor / 100;

          // Use actual breakdown from API instead of fixed percentages
          const breakdown = apiData.breakdown || {};
          
          console.log(`✅ Segment ${segmentIndex} pricing from API:`, {
            total: totalPrice,
            breakdown,
            distance: apiData.distance
          });

          // ✅ CRITICAL FIX: Store pricing update in ref instead of applying immediately
          // This prevents stale closure bugs when multiple segments are priced in parallel
          pendingSegmentPricing.current.set(segmentIndex, {
            items: itemsToUse,
            pricing: {
              baseFee: breakdown.baseFee || (totalPrice * 0.4),
              distanceFee: breakdown.distanceFee || (totalPrice * 0.3),
              volumeFee: breakdown.volumeFee || breakdown.itemsCost || (totalPrice * 0.15),
              serviceFee: breakdown.serviceFee || (totalPrice * 0.1),
              urgencyFee: breakdown.urgencyFee || 0,
              vat: breakdown.vat || (totalPrice * 0.05),
              total: totalPrice,
              distance: apiData.distance || 0,
            }
          });

          console.log(`✅ Segment ${segmentIndex} pricing calculated: £${totalPrice.toFixed(2)} (pending atomic update)`);
        }
      } else {
        console.error(`Pricing API error for segment ${segmentIndex}:`, await response.text());
      }
    } catch (error) {
      console.error(`Segment ${segmentIndex} pricing failed:`, error);
    }
  }, [formData.step1.segments, formData.step1.items, formData.step1.crewSize, formData.step1.serviceType, formData.step1.urgency, formData.step1.pickupTimeSlot, normalizeAddressForPricing]);

  // Calculate all segments pricing in multi-leg
  // ✅ CRITICAL FIX: Apply all segment pricing updates atomically to avoid stale closure bugs
  const calculateAllSegmentsPricing = useCallback(async () => {
    const segments = (formData.step1.segments || []) as any[];
    if (segments.length <= 1) return;

    // Clear any pending updates from previous runs
    pendingSegmentPricing.current.clear();

    console.log('🔄 Calculating pricing for all segments...');
    for (let i = 0; i < segments.length; i++) {
      await calculateSegmentPricing(i);
    }
    
    // ✅ CRITICAL FIX: Apply all pending updates atomically
    // This ensures all segment pricing updates are applied without overwriting each other
    if (pendingSegmentPricing.current.size > 0) {
      // Read latest segments at this point (after all API calls completed)
      const latestSegments = [...(formData.step1.segments || [])];
      let hasUpdates = false;
      let totalPrice = 0;
      
      pendingSegmentPricing.current.forEach((update, segmentIndex) => {
        if (latestSegments[segmentIndex]) {
          latestSegments[segmentIndex] = {
            ...latestSegments[segmentIndex],
            items: update.items,
            pricing: {
              ...update.pricing,
              distance: update.pricing.distance || latestSegments[segmentIndex].distance || 0,
            }
          };
          totalPrice += update.pricing.total || 0;
          hasUpdates = true;
          console.log(`✅ Applied pricing for segment ${segmentIndex}: £${update.pricing.total.toFixed(2)}`);
        }
      });
      
      if (hasUpdates) {
        updateFormData('step1', { segments: latestSegments });
        console.log('✅ All segment pricing updates applied atomically');
        
        // ✅ CRITICAL FIX: Also set pricingTiers for multi-leg bookings
        // This ensures Step 3 has access to pricing even if segments array timing is off
        const avgPerSegment = totalPrice / latestSegments.length;
        const multiLegTiers = {
          economy: {
            price: avgPerSegment * 0.85, // Economy discount per segment
            available: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            availability: null
          },
          standard: {
            price: avgPerSegment,
            available: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            availability: null
          },
          express: {
            price: avgPerSegment * 1.5, // Express premium per segment
            available: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            availability: null
          }
        };
        setPricingTiers(multiLegTiers);
        console.log('✅ Multi-leg pricingTiers set:', {
          totalPrice,
          avgPerSegment,
          economy: multiLegTiers.economy.price,
          standard: multiLegTiers.standard.price,
          express: multiLegTiers.express.price
        });
      }
      
      // Clear pending updates
      pendingSegmentPricing.current.clear();
    } else {
      // ✅ FALLBACK: If no segment pricing was calculated, use existing segment pricing or estimate
      console.log('⚠️ No segment pricing calculated from API, checking existing pricing...');
      
      let totalFromExisting = 0;
      let hasExistingPricing = false;
      
      // Check if segments already have pricing from previous calculations
      segments.forEach((seg, idx) => {
        if (seg.pricing?.total && seg.pricing.total > 0) {
          totalFromExisting += seg.pricing.total;
          hasExistingPricing = true;
          console.log(`📊 Segment ${idx} has existing pricing: £${seg.pricing.total.toFixed(2)}`);
        }
      });
      
      // If we have existing pricing, use it to set pricingTiers
      if (hasExistingPricing && totalFromExisting > 0) {
        const avgPerSegment = totalFromExisting / segments.length;
        const fallbackTiers = {
          economy: {
            price: avgPerSegment * 0.85,
            available: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            availability: null
          },
          standard: {
            price: avgPerSegment,
            available: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            availability: null
          },
          express: {
            price: avgPerSegment * 1.5,
            available: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            availability: null
          }
        };
        setPricingTiers(fallbackTiers);
        console.log('✅ Multi-leg pricingTiers set from existing segment pricing:', {
          totalFromExisting,
          avgPerSegment,
          economy: fallbackTiers.economy.price,
          standard: fallbackTiers.standard.price,
          express: fallbackTiers.express.price
        });
      } else if (formData.step1.pricing?.total && formData.step1.pricing.total > 0) {
        // Use global pricing as fallback
        const globalPrice = formData.step1.pricing.total;
        const estimatedTotal = globalPrice * segments.length;
        const avgPerSegment = globalPrice;
        
        const fallbackTiers = {
          economy: {
            price: avgPerSegment * 0.85,
            available: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            availability: null
          },
          standard: {
            price: avgPerSegment,
            available: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            availability: null
          },
          express: {
            price: avgPerSegment * 1.5,
            available: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            availability: null
          }
        };
        setPricingTiers(fallbackTiers);
        console.log('✅ Multi-leg pricingTiers set from global formData.step1.pricing:', {
          globalPrice,
          estimatedTotal,
          avgPerSegment,
          economy: fallbackTiers.economy.price,
          standard: fallbackTiers.standard.price,
          express: fallbackTiers.express.price
        });
      } else {
        // Last resort: estimate based on distance
        const totalDistance = segments.reduce((sum, seg) => sum + (seg.distance || 10), 0);
        const estimatedPrice = Math.max(49.99, totalDistance * 2.5); // £2.50 per mile, min £49.99
        const avgPerSegment = estimatedPrice / segments.length;
        
        const fallbackTiers = {
          economy: {
            price: avgPerSegment * 0.85,
            available: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            availability: null
          },
          standard: {
            price: avgPerSegment,
            available: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            availability: null
          },
          express: {
            price: avgPerSegment * 1.5,
            available: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            availability: null
          }
        };
        setPricingTiers(fallbackTiers);
        console.log('⚠️ Multi-leg pricingTiers estimated from distance (fallback):', {
          totalDistance,
          estimatedPrice,
          avgPerSegment,
          economy: fallbackTiers.economy.price,
          standard: fallbackTiers.standard.price,
          express: fallbackTiers.express.price,
          note: 'This is an estimate - actual price may differ'
        });
      }
    }
  }, [calculateSegmentPricing, formData.step1.segments, formData.step1.pricing, updateFormData]);

  // Auto-calculate availability and pricing when addresses/items change
  const calculateComprehensivePricing = useCallback(async () => {
    // For multi-leg bookings: calculate pricing per-segment
    const segments = (formData.step1.segments || []) as any[];
    if (segments.length > 1) {
      console.log('🔄 Multi-leg booking: Calculating pricing for all segments');
      await calculateAllSegmentsPricing();
      return;
    }

    // Single-leg: continue with normal pricing
    // Only calculate if we have addresses (items can be empty - will use default)
    if (!formData.step1.pickupAddress?.coordinates) {
      console.log('⏭️ Skipping pricing: No pickup address coordinates');
      return;
    }
    
    // CRITICAL: Skip if no items yet (API requires at least 1 item)
    // Check both global items and segment items (in case of single segment)
    const hasGlobalItems = formData.step1.items && formData.step1.items.length > 0;
    const hasSegmentItems = segments.length === 1 && segments[0]?.items && segments[0].items.length > 0;
    
    if (!hasGlobalItems && !hasSegmentItems) {
      console.log('⏭️ Skipping pricing: No items selected (API requires items)');
      setIsLoadingAvailability(false);
      return;
    }
    
    // Use items from segment if available (single segment), otherwise use global items
    const itemsToUse = hasSegmentItems ? segments[0].items : formData.step1.items;

    // Normalize addresses to consistent schema
    const pickupNorm = normalizeAddressForPricing(formData.step1.pickupAddress);
    const dropNorm = normalizeAddressForPricing(formData.step1.dropoffAddress);

    // Validate addresses exist
    if (!pickupNorm || !dropNorm) {
      console.warn('Missing address data - cannot calculate pricing');
      return;
    }

    // Validate addresses have coordinates (required)
    if (!pickupNorm?.coordinates?.lat || !pickupNorm?.coordinates?.lng) {
      console.warn('Incomplete pickup address - missing coordinates');
      return;
    }

    if (!dropNorm?.coordinates?.lat || !dropNorm?.coordinates?.lng) {
      console.warn('Incomplete drop address - missing coordinates');
      return;
    }

    setIsLoadingAvailability(true);

    try {
      // ✅ CRITICAL FIX: Validate items before sending to API
      // Do not use default items - require explicit item selection
      const validItems = itemsToUse
        .map((item: any) => {
          const quantity = typeof item?.quantity === 'number'
            ? item.quantity
            : parseInt(item?.quantity ?? '0', 10);

          return {
            id: item?.id,
            name: item?.name,
            quantity,
            weight_override: item?.weight,
            volume_override: item?.volume,
          };
        })
        .filter((item: any) => item && item.id && item.name && typeof item.quantity === 'number' && item.quantity > 0);

      // ✅ CRITICAL FIX: Require at least one valid item
      // Do not use default items - this leads to inaccurate pricing
      if (validItems.length === 0) {
        console.warn('⚠️ No valid items after filtering - skipping pricing calculation');
        setIsLoadingAvailability(false);
        return;
      }

      const payloadItems = validItems;

      console.log('📤 Sending pricing request with items:', payloadItems.length);

      const response = await fetch('/api/pricing/comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: payloadItems,
          pickup: { 
            full: pickupNorm?.full || 'Pickup Address',
            line1: pickupNorm?.line1 || '1 Main Street',
            city: pickupNorm?.city || 'London',
            postcode: pickupNorm?.postcode || 'SW1A 1AA',
            propertyType: 'house' as const,
            street: pickupNorm?.street || 'Main Street',
            number: pickupNorm?.number || '1',
            coordinates: {
              lat: pickupNorm?.coordinates?.lat || 0,
              lng: pickupNorm?.coordinates?.lng || 0
            }
          },
          dropoffs: [{
            full: dropNorm?.full || 'Dropoff Address',
            line1: dropNorm?.line1 || '1 Main Street',
            city: dropNorm?.city || 'London',
            postcode: dropNorm?.postcode || 'SW1A 1AA',
            propertyType: 'house' as const,
            street: dropNorm?.street || 'Main Street',
            number: dropNorm?.number || '1',
            coordinates: {
              lat: dropNorm?.coordinates?.lat || 0,
              lng: dropNorm?.coordinates?.lng || 0
            }
          }],
          scheduledDate: (formData.step1.pickupDate
            ? new Date(`${formData.step1.pickupDate}T09:00:00.000Z`).toISOString()
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
          serviceLevel: 'standard',
          // ✅ CRITICAL: Include crewSize for crew surcharge calculation
          // Crew size affects price: 2-men = +20%, 3-men = +35%, 4-men = +50%
          crewSize: formData.step1.crewSize || '1'
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (!data || data.success !== true || !data.data) {
          console.error('Pricing API returned an unexpected payload', { data });
          return;
        }

        setAvailabilityData(data.data.availability);

        const amountMinorRaw = data.data.amountGbpMinor;
        let amountMinor: number;

        if (typeof amountMinorRaw === 'string') {
          amountMinor = parseFloat(amountMinorRaw);
        } else {
          amountMinor = amountMinorRaw;
        }

        if (typeof amountMinor !== 'number' || Number.isNaN(amountMinor) || amountMinor <= 0) {
          console.error('Pricing API returned an invalid amount', { amountMinorRaw });
          return;
        }

        const normalizePrice = (value: number) => {
          const fixed = value.toFixed(2);
          return parseFloat(fixed);
        };

        const rawBasePrice = amountMinor / 100;
        const basePrice = normalizePrice(rawBasePrice);
        const economyPriceValue = normalizePrice(rawBasePrice * 0.85);
        const expressPriceValue = normalizePrice(rawBasePrice * 1.5);

        const calculatedTiers = {
          economy: {
            price: economyPriceValue,
            available: data.data.availability?.economy?.next_available_date,
            availability: data.data.availability?.economy
          },
          standard: {
            price: basePrice,
            available: data.data.availability?.standard?.next_available_date,
            availability: data.data.availability?.standard
          },
          express: {
            price: expressPriceValue,
            available: data.data.availability?.express?.next_available_date,
            availability: data.data.availability?.express
          }
        };

        setPricingTiers(calculatedTiers);

        // ✅ CRITICAL FIX: Also update formData.step1.pricing so addReturnSegment can copy it
        updateFormData('step1', {
          pricing: {
            baseFee: basePrice * 0.4,
            distanceFee: basePrice * 0.3,
            volumeFee: basePrice * 0.15,
            serviceFee: basePrice * 0.1,
            urgencyFee: 0,
            vat: basePrice * 0.05,
            total: basePrice,
            distance: data.data.distance || formData.step1.distance || 0,
          }
        });

        console.log('✅ Enterprise Engine Pricing Tiers (STEP 2):', {
          rawBasePrice,
          basePrice,
          economy: calculatedTiers.economy.price,
          standard: calculatedTiers.standard.price,
          express: calculatedTiers.express.price,
          note: 'These exact values will be used in Step 3',
          formDataPricingUpdated: true
        });

      } else {
        console.error('Pricing API error:', await response.text());
      }
    } catch (error) {
      console.error('Auto-pricing calculation failed:', error);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [formData.step1, calculateAllSegmentsPricing]);

  // Set isClient to true after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Removed aggressive scroll prevention that was causing multiple scroll-up issues
  // Removed duplicate pricing trigger - pricing is already triggered by items/addresses useEffect below

  // Three-tier pricing calculations (fallback for legacy)
  const calculateEconomyPrice = useCallback(() => {
    const segments = (formData.step1.segments || []) as any[];
    const isMultiLeg = segments.length > 1;
    
    if (isMultiLeg) {
      // ✅ FIXED: For multi-leg, return the BASE total - WhoAndPaymentStep_Simple applies multiplier
      // This prevents double multiplication (0.85 × 0.85 = 0.72 bug)
      const totalBase = segments.reduce((sum, seg) => sum + (seg.pricing?.total || 0), 0);
      
      // CRITICAL FIX: If segment pricing is 0, fall back to pricingTiers
      if (totalBase === 0 && pricingTiers?.standard?.price) {
        const fallbackTotal = pricingTiers.standard.price * segments.length;
        console.log('💰 calculateEconomyPrice (multi-leg fallback):', {
          segmentsCount: segments.length,
          fallbackTotal,
          note: 'Returning base total - child applies 0.85 multiplier'
        });
        return fallbackTotal; // Return base, not multiplied
      }
      
      console.log('💰 calculateEconomyPrice (multi-leg):', {
        segmentsCount: segments.length,
        segmentPrices: segments.map(s => s.pricing?.total || 0),
        totalBase,
        note: 'Returning base total - child applies 0.85 multiplier'
      });
      
      return totalBase; // Return base, child will apply 0.85
    }
    
    // Single-leg: use pricingTiers (already has economy multiplier)
    const price = pricingTiers?.economy?.price || 0;
    console.log('💰 calculateEconomyPrice (single-leg):', price);
    return price;
  }, [pricingTiers, formData.step1.segments]);

  const calculateStandardPrice = useCallback(() => {
    const segments = (formData.step1.segments || []) as any[];
    const isMultiLeg = segments.length > 1;
    
    if (isMultiLeg) {
      // Multi-leg: sum all segment totals
      const total = segments.reduce((sum, seg) => sum + (seg.pricing?.total || 0), 0);
      
      // CRITICAL FIX: If segment pricing is 0, fall back to pricingTiers
      // This happens when return segment is added before API calculates pricing
      if (total === 0 && pricingTiers?.standard?.price) {
        // Use single-leg price × number of segments as fallback
        const fallbackTotal = pricingTiers.standard.price * segments.length;
        console.log('💰 calculateStandardPrice (multi-leg fallback):', {
          segmentsCount: segments.length,
          singleLegPrice: pricingTiers.standard.price,
          fallbackTotal
        });
        return fallbackTotal;
      }
      
      console.log('💰 calculateStandardPrice (multi-leg):', {
        segmentsCount: segments.length,
        segmentPrices: segments.map(s => s.pricing?.total || 0),
        total
      });
      
      return total;
    }
    
    // Single-leg: use pricingTiers
    const price = pricingTiers?.standard?.price || 0;
    console.log('💰 calculateStandardPrice (single-leg):', price);
    return price;
  }, [pricingTiers, formData.step1.segments]);

  const calculatePriorityPrice = useCallback(() => {
    const segments = (formData.step1.segments || []) as any[];
    const isMultiLeg = segments.length > 1;
    
    if (isMultiLeg) {
      // ✅ FIXED: For multi-leg, return the BASE total - WhoAndPaymentStep_Simple applies multiplier
      // This prevents double multiplication (1.5 × 1.5 = 2.25 bug)
      const totalBase = segments.reduce((sum, seg) => sum + (seg.pricing?.total || 0), 0);
      
      // CRITICAL FIX: If segment pricing is 0, fall back to pricingTiers
      if (totalBase === 0 && pricingTiers?.standard?.price) {
        const fallbackTotal = pricingTiers.standard.price * segments.length;
        console.log('💰 calculatePriorityPrice (multi-leg fallback):', {
          segmentsCount: segments.length,
          fallbackTotal,
          note: 'Returning base total - child applies 1.5 multiplier'
        });
        return fallbackTotal; // Return base, not multiplied
      }
      
      console.log('💰 calculatePriorityPrice (multi-leg):', {
        segmentsCount: segments.length,
        totalBase,
        note: 'Returning base total - child applies 1.5 multiplier'
      });
      
      return totalBase; // Return base, child will apply 1.5
    }
    
    // Single-leg: use pricingTiers (already has express multiplier)
    return pricingTiers?.express?.price || 0;
  }, [pricingTiers, formData.step1.segments]);

  // Removed trending item images - using icons instead

  // Trending items management
  const trendingItems = [
    { id: 'sofa', name: 'Sofa', category: 'Living Room Furniture', unitPrice: 35 },
    { id: 'washer', name: 'Washing Machine', category: 'Kitchen Appliances', unitPrice: 45 },
    { id: 'bed', name: 'Double Bed', category: 'Bedroom Furniture', unitPrice: 25 },
  ];

  // Get quantity of trending item
  const getTrendingItemQuantity = (itemId: string) => {
    const item = formData.step1.items.find(item => item.id === itemId);
    return item?.quantity || 0;
  };

  // Add trending item with feedback
  const addTrendingItem = (trendingItem: typeof trendingItems[0]) => {
    const existingItems = formData.step1.items;
    const existingIndex = existingItems.findIndex(item => item.id === trendingItem.id);
    
    if (existingIndex >= 0) {
      // Item exists, increase quantity
      const updatedItems = existingItems.map((item, index) =>
        index === existingIndex
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      );
      updateFormData('step1', { items: updatedItems });
      toast({
        title: `${trendingItem.name} added`,
        description: `Quantity increased to ${updatedItems[existingIndex].quantity}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } else {
      // Add new item
      const newItem = {
        id: trendingItem.id,
        name: trendingItem.name,
        category: trendingItem.category,
        unitPrice: trendingItem.unitPrice,
        quantity: 1,
        totalPrice: trendingItem.unitPrice,
        description: `Popular ${trendingItem.category} item`,
        size: 'medium' as const,
        weight: 25,
        volume: 1.0,
        image: '' // No images - using icons instead
      };
      updateFormData('step1', { items: [...existingItems, newItem] });
      toast({
        title: `${trendingItem.name} added to your move!`,
        description: 'Quick selection saved you time ✨',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
    // Pricing will be calculated automatically when items change
  };

  // Remove trending item with feedback
  const removeTrendingItem = (itemId: string) => {
    const existingItems = formData.step1.items;
    const existingIndex = existingItems.findIndex(item => item.id === itemId);
    
    if (existingIndex >= 0) {
      const currentItem = existingItems[existingIndex];
      if (currentItem.quantity > 1) {
        // Decrease quantity
        const updatedItems = existingItems.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity - 1, totalPrice: (item.quantity - 1) * item.unitPrice }
            : item
        );
        updateFormData('step1', { items: updatedItems });
        toast({
          title: `${currentItem.name} updated`,
          description: `Quantity reduced to ${currentItem.quantity - 1}`,
          status: 'info',
          duration: 1500,
          isClosable: true,
        });
      } else {
        // Remove item completely
        const updatedItems = existingItems.filter((_, index) => index !== existingIndex);
        updateFormData('step1', { items: updatedItems });
        toast({
          title: `${currentItem.name} removed`,
          description: 'Item removed from your move list',
          status: 'warning',
          duration: 1500,
          isClosable: true,
        });
      }
      // Pricing will be calculated automatically when items change
    }
  };

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Control wave effects based on current step
  useEffect(() => {
    if (currentStep === 1) {
      setAddressWaveActive(true);
      setItemsDetailsWaveActive(false);
      setCheckoutWaveActive(false);
    } else if (currentStep === 2) {
      setAddressWaveActive(false);
      setItemsDetailsWaveActive(true);
      setCheckoutWaveActive(false);
    } else if (currentStep === 3) {
      setAddressWaveActive(false);
      setItemsDetailsWaveActive(false);
      setCheckoutWaveActive(true);
    }
  }, [currentStep]);

  // CRITICAL: Prevent auto-scroll to top when changing steps 2 and 3
  // Users should maintain their scroll position in the form
  useEffect(() => {
    // Disable scroll restoration for steps 2 and 3
    if (currentStep === 2 || currentStep === 3) {
      // Preserve current scroll position
      if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
    }
    
    // Cleanup: restore default scroll behavior when component unmounts
    return () => {
      if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, [currentStep]);

  // Calculate pricing with debouncing to prevent excessive API calls
  // Use refs to track if we need to recalculate
  const lastPricingData = useRef<string>('');
  
  useEffect(() => {
    const hasPickupAddress = formData.step1.pickupAddress?.full || formData.step1.pickupAddress?.line1 || formData.step1.pickupAddress?.address || formData.step1.pickupAddress?.formatted_address;
    const hasDropoffAddress = formData.step1.dropoffAddress?.full || formData.step1.dropoffAddress?.line1 || formData.step1.dropoffAddress?.address || formData.step1.dropoffAddress?.formatted_address;

    // Check for valid coordinates (not default 0,0 values)
    const hasValidPickupCoordinates = formData.step1.pickupAddress?.coordinates?.lat &&
                                     formData.step1.pickupAddress?.coordinates?.lng &&
                                     (formData.step1.pickupAddress.coordinates.lat !== 0 ||
                                      formData.step1.pickupAddress.coordinates.lng !== 0);
    const hasValidDropoffCoordinates = formData.step1.dropoffAddress?.coordinates?.lat &&
                                      formData.step1.dropoffAddress?.coordinates?.lng &&
                                      (formData.step1.dropoffAddress.coordinates.lat !== 0 ||
                                       formData.step1.dropoffAddress.coordinates.lng !== 0);

    if (isClient &&
        formData.step1.items.length > 0 &&
        hasPickupAddress &&
        hasDropoffAddress &&
        hasValidPickupCoordinates &&
        hasValidDropoffCoordinates) {
      
      // 🔧 FIX: Include date, time, urgency, AND segments in hash to trigger recalculation
      const segments = formData.step1.segments || [];
      const currentData = JSON.stringify({
        items: formData.step1.items.map(i => ({ id: i.id, quantity: i.quantity })),
        pickup: { lat: formData.step1.pickupAddress?.coordinates?.lat, lng: formData.step1.pickupAddress?.coordinates?.lng },
        dropoff: { lat: formData.step1.dropoffAddress?.coordinates?.lat, lng: formData.step1.dropoffAddress?.coordinates?.lng },
        // ✅ NOW INCLUDES DATE/TIME/URGENCY/SEGMENTS
        scheduling: {
          date: formData.step1.pickupDate,
          timeSlot: formData.step1.pickupTimeSlot,
          urgency: formData.step1.urgency
        },
        // ✅ INCLUDE SEGMENTS to detect changes in multi-leg bookings
        segments: segments.map((s: any) => ({
          items: s.items?.map((i: any) => ({ id: i.id, quantity: i.quantity })) || [],
          pickup: { lat: s.pickupAddress?.coordinates?.lat, lng: s.pickupAddress?.coordinates?.lng },
          dropoff: { lat: s.dropoffAddress?.coordinates?.lat, lng: s.dropoffAddress?.coordinates?.lng },
          datetime: s.datetime
        })),
        // ✅ INCLUDE CREW SIZE to detect changes and trigger price recalculation
        crewSize: formData.step1.crewSize || '1'
      });
      
      // Only trigger if data actually changed
      if (currentData !== lastPricingData.current) {
        lastPricingData.current = currentData;
        
        console.log('🔄 Pricing data changed, recalculating...', {
          date: formData.step1.pickupDate,
          timeSlot: formData.step1.pickupTimeSlot,
          urgency: formData.step1.urgency
        });
        
        // Debounce pricing calculation to prevent excessive API calls
        // Use calculateComprehensivePricing if available (updates pricingTiers), otherwise fallback to calculatePricing
        const timeoutId = setTimeout(() => {
          if (calculateComprehensivePricing) {
            calculateComprehensivePricing().catch(error => {
              console.error('Failed to calculate comprehensive pricing:', error);
            });
          } else if (calculatePricing) {
            calculatePricing().catch(error => {
              console.error('Failed to calculate pricing:', error);
            });
          }
        }, 800); // Wait 800ms after last change before calculating
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isClient, formData.step1, calculatePricing, calculateComprehensivePricing]);



  // Handle URL parameters on page load
  useEffect(() => {
    if (!isClient) return;
    
    const step = searchParams?.get('step');
    const paymentStatus = searchParams?.get('payment');
    const sessionId = searchParams?.get('session_id');

    // Check if we're coming from a successful payment and should show success page
    const savedPaymentSuccess = safeLocalStorageGetItem('speedy_van_payment_success');
    const savedSessionId = safeLocalStorageGetItem('speedy_van_session_id');

    // Redirect to success page if payment was successful
    if (paymentStatus === 'success' || (savedPaymentSuccess === 'true' && savedSessionId)) {

      // Clear localStorage
      safeLocalStorageRemoveItem('speedy_van_payment_success');
      safeLocalStorageRemoveItem('speedy_van_session_id');      // Redirect to dedicated success page
      const successUrl = `/booking-luxury/success?session_id=${sessionId || savedSessionId}`;
      window.location.href = successUrl;
      return;
    }

    if (paymentStatus === 'cancelled') {
      // Reset to Step 1 when payment is cancelled
      setCurrentStep(1);
      
      // Clear URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      url.searchParams.delete('step');
      window.history.replaceState({}, '', url.toString());
      
      // Show compact, responsive toast notification
      toast({
        title: 'Payment Cancelled',
        description: 'Please review your booking details and try again.',
        status: 'warning',
        duration: 6000,
        isClosable: true,
        position: 'top',
        containerStyle: {
          maxWidth: { base: '90%', md: '500px' },
          marginTop: { base: '60px', md: '80px' },
        },
      });
      
      return;
    }

    // Handle normal step navigation (only steps 1 and 2 now)
    if (step && (step === '1' || step === '2')) {
      const stepNumber = parseInt(step, 10);
      if (stepNumber >= 1 && stepNumber <= STEPS.length) {
        setCurrentStep(stepNumber);
      }
    }
  }, [searchParams, toast, isClient]);


  // Success page is now handled by dedicated /booking/success route

  const handleNext = async () => {
    // Simple check - no complex validation
    if (currentStep === 1) {
      // Step 1: Check addresses exist ONLY - date/time is set in Step 2
      if (formData.step1.pickupAddress?.full && formData.step1.dropoffAddress?.full) {
        // For Step 1, we DON'T validate segments for items OR datetime (both are in Step 2)
        // Just verify addresses exist for multi-leg
        const segments = (formData.step1.segments || []) as any[];
        if (segments.length > 1) {
          // Manual validation: Only check addresses, NOT items or datetime
          let hasError = false;
          for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            if (!seg.pickupAddress?.postcode || !seg.dropoffAddress?.postcode) {
              toast({
                title: 'Invalid Journey Segments',
                description: `Segment ${i + 1}: Please enter both pickup and drop-off addresses`,
                status: 'error',
                duration: 5000,
              });
              hasError = true;
              break;
            }
            // NOTE: datetime is NOT validated here - it's set in Step 2
          }
          if (hasError) return;
        }
        
        setIsAutoTransitioning(true);
        setTimeout(() => {
          setCurrentStep(2);
          clearErrors();
          setIsAutoTransitioning(false);
          // Prevent scroll to top - user stays at their current position
        }, 300);
      } else {
        toast({
          title: 'Please enter both addresses',
          status: 'error',
          duration: 3000,
        });
      }
    } else if (currentStep === 2) {
      // Step 2: Check items and date/time are selected
      const segments = (formData.step1.segments || []) as any[];
      const isMultiLeg = segments.length > 1;
      
      // Check if items exist (either in segments or global)
      const hasItems = isMultiLeg 
        ? segments.some(s => s.items && s.items.length > 0)
        : formData.step1.items.length > 0;
        
      if (!hasItems) {
        toast({
          title: 'Please select at least one item',
          status: 'error',
          duration: 3000,
        });
        return;
      }
      
      // Check if date exists (either in segments or global)
      const hasDate = isMultiLeg
        ? segments.every(s => s.datetime)
        : formData.step1.pickupDate;
        
      if (!hasDate) {
        toast({
          title: 'Please select a pickup date',
          status: 'error',
          duration: 3000,
        });
        return;
      }
      
      // CRITICAL FIX: Sync items AND pricing from outbound to return segment before checkout
      if (isMultiLeg) {
        const outboundSegment = segments.find((s: any) => s.segmentType === 'outbound');
        const returnSegmentIndex = segments.findIndex((s: any) => s.segmentType === 'return');
        
        if (outboundSegment && returnSegmentIndex !== -1) {
          const returnSegment = segments[returnSegmentIndex];
          const needsItemSync = (!returnSegment.items || returnSegment.items.length === 0) && 
              outboundSegment.items && outboundSegment.items.length > 0;
          const needsPricingSync = (!returnSegment.pricing || returnSegment.pricing.total === 0) &&
              outboundSegment.pricing && outboundSegment.pricing.total > 0;
          
          if (needsItemSync || needsPricingSync) {
            console.log('🔄 Auto-syncing items and pricing from outbound to return before checkout');
            const updates: any = {};
            if (needsItemSync) {
              updates.items = [...outboundSegment.items];
            }
            if (needsPricingSync) {
              // ✅ CRITICAL FIX: Use pricingTiers as fallback if outbound pricing is 0
              if (outboundSegment.pricing && outboundSegment.pricing.total > 0) {
                updates.pricing = { ...outboundSegment.pricing };
              } else if (pricingTiers?.standard?.price && pricingTiers.standard.price > 0) {
                // Fallback to pricingTiers
                const basePrice = pricingTiers.standard.price;
                updates.pricing = {
                  baseFee: basePrice * 0.4,
                  distanceFee: basePrice * 0.3,
                  volumeFee: basePrice * 0.15,
                  serviceFee: basePrice * 0.1,
                  urgencyFee: 0,
                  vat: basePrice * 0.05,
                  total: basePrice,
                  distance: outboundSegment.distance || 0,
                };
                console.log('✅ Using pricingTiers for return segment sync:', basePrice);
              }
              updates.distance = outboundSegment.distance;
            }
            
            // Update the segment directly in formData
            const updatedSegments = [...segments];
            updatedSegments[returnSegmentIndex] = {
              ...updatedSegments[returnSegmentIndex],
              ...updates
            };
            updateFormData('step1', { segments: updatedSegments });
            console.log('✅ Return segment synced:', updates);
          }
        }
      }
      
      setIsAutoTransitioning(true);
      setTimeout(() => {
        setCurrentStep(3);
        clearErrors();
        setIsAutoTransitioning(false);
        // Prevent scroll to top - user stays at their current position
      }, 300);
    } else {
      // Other steps - just advance
      if (currentStep < STEPS.length) {
        setIsAutoTransitioning(true);
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
          clearErrors();
          setIsAutoTransitioning(false);
          // Prevent scroll to top - user stays at their current position
        }, 300);
      }
    }
  };
  
  // REMOVED: Auto-progression - Let user add building details (floor, lift, flat)
  // User clicks "Continue" button when ready instead of auto-advance

  const handlePrevious = () => {
    if (currentStep > 1) {
      // No forced scroll - let user maintain their position
      setCurrentStep(currentStep - 1);
      clearErrors();
    }
  };

  const handleStepClick = async (stepNumber: number) => {
    if (stepNumber < currentStep) {
      setCurrentStep(stepNumber);
      clearErrors();
    } else if (stepNumber === currentStep + 1) {
      await handleNext();
    }
  };


  // Success page is now handled by dedicated /booking/success route

  const bgColor = 'gray.900'; // Dark theme background
  const cardBg = 'gray.800'; // Dark theme card background
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // REMOVED: Scroll restoration interferes with step transitions

  // Do not block UI on hydration; guard browser-only APIs inside effects

  return (
    <>
      <style jsx global>{`
        .booking-time-select {
          color: #e2e8f0 !important;
          background-color: rgba(15, 23, 42, 0.95) !important;
        }
        .booking-time-select option {
          color: #e2e8f0 !important;
          background-color: #1e293b !important;
        }
      `}</style>
    <Box 
      display="block" 
      w="100%" 
      bg={bgColor} 
      py={{ base: 0, md: 8 }} 
      pb={{ base: "80px", md: 8 }}
      suppressHydrationWarning
      sx={{
        // Fix for iPhone 14 Pro Max Dynamic Island
        minHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
        '@supports not (padding: env(safe-area-inset-top))': {
          minHeight: '100vh',
        },
        // Prevent scroll jump on re-render
        scrollBehavior: 'auto',
        overflowAnchor: 'none',
      }}
    >
      <Container 
        maxW={{ base: "full", md: "6xl" }} 
        px={{ base: 2, md: 6 }}
        pt={{ base: 2, md: 0 }}
      >
        <Box 
          display="block" 
          w="100%" 
          py={{ base: 2, md: 8 }}
        >
          {/* SIMPLIFIED STICKY HEADER - Modern & Clean - MOBILE SAFARI FIX */}
          <Box
            position="sticky"
            top={0}
            zIndex={100}
            bg="rgba(13, 13, 13, 0.98)"
            backdropFilter="blur(10px)"
            borderBottom="1px solid"
            borderColor="rgba(59, 130, 246, 0.2)"
            py={{ base: 2, md: 3 }}
            mb={{ base: 3, md: 6 }}
            mx={{ base: -2, md: 0 }}
            px={{ base: 2, md: 0 }}
            sx={{
              // Safe Area for iPhone 14 Pro Max Dynamic Island
              paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
              '@supports not (padding: env(safe-area-inset-top))': {
                paddingTop: '0.5rem',
              },
            }}
          >
            <VStack spacing={4} w="full" data-booking-header>
              {/* Top Row: Brand Logo & Call Button */}
              <Flex 
                justify="space-between" 
                align="center" 
                px={{ base: 3, md: 6 }}
                w="full"
              >
                {/* Left: Brand */}
                <HStack 
                  spacing={{ base: 2, md: 3 }}
                  sx={{
                    flexDirection: 'row !important',
                    alignItems: 'center !important',
                  }}
                >
                  <Box
                    position="relative"
                    w={{ base: '45px', md: '55px' }}
                    h={{ base: '45px', md: '55px' }}
                    borderRadius="full"
                    bg="linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 8px 32px rgba(59, 130, 246, 0.3), inset 0 0 20px rgba(59, 130, 246, 0.1)"
                    border="2px solid"
                    borderColor="rgba(59, 130, 246, 0.3)"
                    animation="vanBounce 3s ease-in-out infinite"
                    sx={{
                      '@keyframes vanBounce': {
                        '0%, 100%': {
                          transform: 'translateX(0) translateY(0)',
                        },
                        '25%': {
                          transform: 'translateX(8px) translateY(-4px)',
                        },
                        '50%': {
                          transform: 'translateX(0) translateY(0)',
                        },
                        '75%': {
                          transform: 'translateX(-8px) translateY(-4px)',
                        },
                      },
                      '@keyframes glow': {
                        '0%, 100%': {
                          opacity: 0.5,
                          transform: 'scale(1)',
                        },
                        '50%': {
                          opacity: 0.8,
                          transform: 'scale(1.1)',
                        },
                      },
                      '@keyframes rotate': {
                        '0%': {
                          transform: 'rotate(0deg)',
                        },
                        '100%': {
                          transform: 'rotate(360deg)',
                        },
                      },
                    }}
                    _before={{
                      content: '""',
                      position: 'absolute',
                      inset: '-2px',
                      borderRadius: 'full',
                      padding: '2px',
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.5), rgba(139, 92, 246, 0.5))',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                      animation: 'rotate 4s linear infinite',
                    }}
                    _after={{
                      content: '""',
                      position: 'absolute',
                      inset: '-8px',
                      borderRadius: 'full',
                      background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4), transparent 70%)',
                      animation: 'glow 2s ease-in-out infinite',
                      pointerEvents: 'none',
                    }}
                  >
                    <Icon 
                      as={FaTruck} 
                      boxSize={{ base: 6, md: 7 }}
                      color="blue.400"
                      filter="drop-shadow(0 2px 8px rgba(59, 130, 246, 0.6))"
                      transition="all 0.3s"
                      _groupHover={{
                        color: "cyan.300",
                        filter: "drop-shadow(0 4px 12px rgba(34, 211, 238, 0.8))",
                      }}
                    />
                  </Box>
                  <VStack spacing={0} align="flex-start">
                    <Text 
                      fontSize={{ base: 'lg', md: '2xl' }}
                      fontWeight="900"
                      letterSpacing="tight"
                      bgGradient="linear(to-r, blue.300, cyan.300, purple.400)"
                      bgClip="text"
                      lineHeight="1.2"
                      fontFamily="'Inter', sans-serif"
                      animation="gradientShift 4s ease infinite, textGlow 2s ease-in-out infinite"
                      sx={{
                        '@keyframes gradientShift': {
                          '0%, 100%': {
                            backgroundPosition: '0% 50%',
                            backgroundSize: '200% 200%',
                          },
                          '50%': {
                            backgroundPosition: '100% 50%',
                            backgroundSize: '200% 200%',
                          },
                        },
                        '@keyframes textGlow': {
                          '0%, 100%': {
                            filter: 'drop-shadow(0 0 2px rgba(59, 130, 246, 0.4))',
                            transform: 'scale(1)',
                          },
                          '50%': {
                            filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 12px rgba(139, 92, 246, 0.6))',
                            transform: 'scale(1.02)',
                          },
                        },
                      }}
                      transition="all 0.3s"
                      _hover={{
                        transform: 'scale(1.05)',
                        filter: 'drop-shadow(0 0 12px rgba(34, 211, 238, 1))',
                      }}
                    >
                      Speedy Van
                    </Text>
                    <Text
                      fontSize={{ base: '2xs', md: 'xs' }}
                      color="whiteAlpha.700"
                      fontWeight="600"
                      letterSpacing="wide"
                      animation="fadeInOut 3s ease-in-out infinite"
                      sx={{
                        '@keyframes fadeInOut': {
                          '0%, 100%': {
                            opacity: 0.7,
                          },
                          '50%': {
                            opacity: 1,
                          },
                        },
                      }}
                    >
                      Professional Moving
                    </Text>
                  </VStack>
                </HStack>

                {/* Right: Premium Call Icon Button */}
                <IconButton
                  as="a"
                  href="tel:+441202129746"
                  aria-label="Call Speedy Van"
                  icon={<Icon as={FaPhone} boxSize={{ base: 5, md: 6 }} />}

                  size={{ base: 'lg', md: 'xl' }}
                  bgGradient="linear(to-br, #10b981, #059669)"
                  color="white"
                  borderRadius="full"
                  border="3px solid"
                  borderColor="white"
                  boxShadow="0 8px 24px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)"
                  position="relative"
                  overflow="hidden"
                  transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                  sx={{
                    '@keyframes phonePulse': {
                      '0%, 100%': { boxShadow: '0 8px 24px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.3)' },
                      '50%': { boxShadow: '0 12px 32px rgba(16, 185, 129, 0.7), 0 0 30px rgba(16, 185, 129, 0.5)' },
                    },
                    animation: 'phonePulse 2s ease-in-out infinite',
                  }}
                  _hover={{
                    transform: 'scale(1.15) rotate(-5deg)',
                    bgGradient: "linear(to-br, #059669, #047857)",
                    boxShadow: '0 12px 32px rgba(16, 185, 129, 0.7), 0 0 30px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255,255,255,0.4)',
                    borderWidth: '4px'
                  }}
                  _active={{
                    transform: 'scale(1.05) rotate(0deg)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4), inset 0 2px 4px rgba(0,0,0,0.2)'
                  }}
                />
              </Flex>

              {/* Bottom: Progress Steps - Enhanced Design with Labels */}
              <VStack spacing={2} w="full">
                <HStack 
                  spacing={{ base: 2, md: 3 }}
                  justify="center"
                  w="full"
                  sx={{
                    flexDirection: 'row !important',
                    alignItems: 'center !important',
                  }}
                >
                  {STEPS.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <VStack spacing={1}>
                        <Box
                          w={{ base: '40px', md: '48px' }}
                          h={{ base: '40px', md: '48px' }}
                          borderRadius="full"
                          bg={
                            step.id === currentStep 
                              ? `${step.color}.500`
                              : step.id < currentStep 
                              ? 'green.500'
                              : 'whiteAlpha.200'
                          }
                          color="white"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          fontSize={{ base: 'md', md: 'lg' }}
                          fontWeight="800"
                          cursor={step.id <= currentStep ? 'pointer' : 'default'}
                          onClick={() => step.id <= currentStep && handleStepClick(step.id)}
                          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                          border="3px solid"
                          borderColor={
                            step.id === currentStep 
                              ? `${step.color}.400`
                              : step.id < currentStep 
                              ? 'green.400'
                              : 'transparent'
                          }
                          position="relative"
                          animation={step.id === currentStep ? 'stepPulse 2s ease-in-out infinite' : undefined}
                          sx={{
                            '@keyframes stepPulse': {
                              '0%, 100%': {
                                boxShadow: step.id === currentStep 
                                  ? `0 0 20px ${step.color === 'blue' ? 'rgba(59, 130, 246, 0.6)' : step.color === 'purple' ? 'rgba(168, 85, 247, 0.6)' : 'rgba(16, 185, 129, 0.6)'}`
                                  : 'none',
                                transform: 'scale(1)',
                              },
                              '50%': {
                                boxShadow: step.id === currentStep 
                                  ? `0 0 35px ${step.color === 'blue' ? 'rgba(59, 130, 246, 0.9)' : step.color === 'purple' ? 'rgba(168, 85, 247, 0.9)' : 'rgba(16, 185, 129, 0.9)'}, 0 0 50px ${step.color === 'blue' ? 'rgba(59, 130, 246, 0.6)' : step.color === 'purple' ? 'rgba(168, 85, 247, 0.6)' : 'rgba(16, 185, 129, 0.6)'}`
                                  : 'none',
                                transform: 'scale(1.08)',
                              },
                            },
                            '@keyframes lineProgress': {
                              '0%': {
                                width: '0%',
                              },
                              '100%': {
                                width: '100%',
                              },
                            },
                          }}
                          boxShadow={
                            step.id === currentStep 
                              ? `0 0 20px ${step.color === 'blue' ? 'rgba(59, 130, 246, 0.6)' : step.color === 'purple' ? 'rgba(168, 85, 247, 0.6)' : 'rgba(16, 185, 129, 0.6)'}`
                              : step.id < currentStep 
                              ? '0 0 15px rgba(16, 185, 129, 0.5)'
                              : 'none'
                          }
                          _hover={step.id <= currentStep ? { 
                            transform: 'scale(1.15) translateY(-2px)',
                            boxShadow: step.id === currentStep 
                              ? `0 0 25px ${step.color === 'blue' ? 'rgba(59, 130, 246, 0.8)' : step.color === 'purple' ? 'rgba(168, 85, 247, 0.8)' : 'rgba(16, 185, 129, 0.8)'}`
                              : '0 0 20px rgba(16, 185, 129, 0.7)'
                          } : {}}
                          _after={step.id === currentStep ? {
                            content: '""',
                            position: 'absolute',
                            inset: '-6px',
                            borderRadius: 'full',
                            background: `radial-gradient(circle, ${step.color === 'blue' ? 'rgba(59, 130, 246, 0.3)' : step.color === 'purple' ? 'rgba(168, 85, 247, 0.3)' : 'rgba(16, 185, 129, 0.3)'}, transparent 70%)`,
                            animation: 'stepPulse 2s ease-in-out infinite',
                            pointerEvents: 'none',
                          } : {}}
                        >
                          {step.id < currentStep ? <Icon as={FaCheck} boxSize={{ base: 4, md: 5 }} /> : step.id}
                        </Box>
                        {/* Step Label */}
                        <Text
                          fontSize={{ base: 'xs', md: 'sm' }}
                          fontWeight={step.id === currentStep ? '700' : '500'}
                          color={
                            step.id === currentStep 
                              ? `${step.color}.400`
                              : step.id < currentStep 
                              ? 'green.400'
                              : 'whiteAlpha.500'
                          }
                          textAlign="center"
                          whiteSpace="nowrap"
                          transition="all 0.3s"
                        >
                          {step.shortTitle}
                        </Text>
                      </VStack>
                    {index < STEPS.length - 1 && (
                      <Box 
                        w={{ base: '30px', md: '40px' }} 
                        h="3px" 
                        borderRadius="full"
                        bg={step.id < currentStep ? 'green.500' : 'whiteAlpha.200'}
                        position="relative"
                        overflow="hidden"
                        transition="all 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                        boxShadow={step.id < currentStep ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none'}
                        mb={6} // Add margin to account for labels below
                        _after={step.id < currentStep ? {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                          animation: 'lineShimmer 2s infinite',
                        } : {}}
                        sx={{
                          '@keyframes lineShimmer': {
                            '0%': {
                              transform: 'translateX(-100%)',
                            },
                            '100%': {
                              transform: 'translateX(100%)',
                            },
                          },
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </HStack>
            </VStack>
            </VStack>
          </Box>



          {/* Step Title - Enhanced Typography & Design */}
          <Box 
            mb={{ base: 4, md: 8 }} 
            textAlign="center" 
            px={{ base: 2, md: 0 }}
          >
            <Heading 
              size={{ base: "xl", md: "2xl" }}
              color="white"
              fontWeight="800"
              mb={3}
              letterSpacing="tight"
              bgGradient={`linear(to-r, ${STEPS[currentStep - 1]?.color}.300, ${STEPS[currentStep - 1]?.color}.500)`}
              bgClip="text"
              textShadow="0 0 30px rgba(168, 85, 247, 0.3)"
              fontFamily="'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
            >
              {STEPS[currentStep - 1]?.title}
            </Heading>
            <Text 
              fontSize={{ base: "md", md: "lg" }} 
              color="whiteAlpha.800"
              fontWeight="500"
              letterSpacing="wide"
              textTransform="none"
              maxW="600px"
              mx="auto"
              lineHeight="1.6"
            >
              {STEPS[currentStep - 1]?.description}
            </Text>
          </Box>

          {/* Main Content - NO ANIMATIONS, STABLE KEYS to prevent scroll jumps */}
          <Box 
            w="full" 
            position="relative" 
            data-booking-step={currentStep}
            onClick={(e) => {
              // Prevent any default scroll behavior on clicks
              const target = e.target as HTMLElement;
              if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
                e.preventDefault();
              }
            }}
          >
            {currentStep === 1 && (
              <Box key="step1-addresses" w="full" data-booking-step="1">
                <AddressesStep
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                  onNext={handleNext}
                  isTransitioning={isAutoTransitioning}
                  addReturnSegment={addReturnSegmentWithPricing}
                  addAdditionalSegment={addAdditionalSegmentWithPricing}
                  updateSegment={updateSegment}
                  removeSegment={removeSegment}
                  validateSegments={validateSegments}
                />
              </Box>
            )}
            {currentStep === 2 && (
              <Box key="step2-items" w="full" data-booking-step="2">
                <VStack spacing={6} align="stretch">
                  {/* Date & Time Selection - Right Under Progress Bar */}
                  <Card 
                    bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
                    backdropFilter="blur(20px)"
                    borderRadius="2xl"
                    border="3px solid"
                    borderColor="rgba(168, 85, 247, 0.5)"
                    boxShadow="0 10px 40px rgba(168, 85, 247, 0.4), 0 0 20px rgba(168, 85, 247, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
                    position="relative"
                    overflow="visible"
                    _before={{
                      content: '""',
                      position: 'absolute',
                      inset: '-4px',
                      borderRadius: '2xl',
                      padding: '4px',
                      background: 'linear-gradient(135deg, #a855f7, #9333ea, #7e22ce)',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                      opacity: 0.4,
                    }}
                  >
                    <CardBody p={{ base: 5, md: 7 }}>
                      <VStack spacing={{ base: 5, md: 7 }} align="stretch">
                        <VStack spacing={3} textAlign="center">
                          <Heading 
                            size={{ base: "lg", md: "xl" }} 
                            bgGradient="linear(to-r, #a855f7, #ec4899)"
                            bgClip="text"
                            fontWeight="black"
                            letterSpacing="tight"
                          >
                            📅 When do you need the move?
                          </Heading>
                          <Text 
                            color="gray.400" 
                            fontSize={{ base: "md", md: "lg" }}
                            fontWeight="medium"
                          >
                            Select your preferred date and time
                          </Text>
                        </VStack>

                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 3, md: 4 }}>
                          <Box position="relative" style={{ zIndex: 10 }}>
                            <Text 
                              color="white" 
                              fontSize={{ base: "sm", md: "md" }} 
                              mb={2}
                              fontWeight="bold"
                              letterSpacing="wide"
                            >
                              📅 Select Date
                            </Text>
                            <input
                              type="date"
                              value={formData.step1.pickupDate || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const selectedDate = e.target.value;
                                updateFormData('step1', { pickupDate: selectedDate });
                                
                                // Calculate urgency based on date
                                const now = new Date();
                                const selected = new Date(selectedDate);
                                const diffHours = (selected.getTime() - now.getTime()) / (1000 * 60 * 60);
                                
                                let urgency: 'same-day' | 'next-day' | 'scheduled' = 'scheduled';
                                if (diffHours < 24) {
                                  urgency = 'same-day';
                                } else if (diffHours < 48) {
                                  urgency = 'next-day';
                                }
                                
                                updateFormData('step1', { urgency });
                                
                                console.log('📅 Date changed:', {
                                  date: selectedDate,
                                  diffHours: diffHours.toFixed(1),
                                  urgency
                                });
                              }}
                              min={(() => {
                                const tomorrow = new Date();
                                tomorrow.setDate(tomorrow.getDate() + 1);
                                return tomorrow.toISOString().split('T')[0];
                              })()}
                              className="booking-date-input"
                              style={{
                                width: '100%',
                                padding: '14px 16px',
                                fontSize: '16px',
                                borderRadius: '16px',
                                border: '3px solid transparent',
                                backgroundImage: 'linear-gradient(rgba(26, 26, 26, 0.9), rgba(26, 26, 26, 0.9)), linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                backgroundOrigin: 'border-box',
                                backgroundClip: 'padding-box, border-box',
                                color: 'white',
                                fontWeight: '600',
                                colorScheme: 'dark',
                                cursor: 'pointer',
                                outline: 'none',
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                              }}
                            />
                            {errors['step1.pickupDate'] && (
                              <Text color="red.400" fontSize="sm" mt={2}>{errors['step1.pickupDate']}</Text>
                            )}
                          </Box>

                          <Box position="relative" style={{ zIndex: 9 }}>
                            <Text 
                              color="white" 
                              fontSize={{ base: "sm", md: "md" }} 
                              mb={2}
                              fontWeight="bold"
                              letterSpacing="wide"
                            >
                              ⏰ Select Time
                            </Text>
                            <select
                              value={formData.step1.pickupTimeSlot || ''}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const timeSlot = e.target.value;
                                updateFormData('step1', { pickupTimeSlot: timeSlot });
                                
                                console.log('⏰ Time changed:', timeSlot);
                              }}
                              className="booking-time-select"
                              style={{
                                width: '100%',
                                padding: '14px 16px',
                                fontSize: '16px',
                                borderRadius: '16px',
                                border: '3px solid rgba(139, 92, 246, 0.5)',
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                color: '#e2e8f0',
                                fontWeight: '700',
                                cursor: 'pointer',
                                outline: 'none',
                                appearance: 'none',
                                paddingRight: '48px',
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                              }}
                            >
                              <option value="" style={{ background: '#1e293b', color: '#e2e8f0' }}>Choose a time</option>
                              <option value="morning" style={{ background: '#1e293b', color: '#e2e8f0' }}>8 AM - 12 PM 🌅 (Morning)</option>
                              <option value="afternoon" style={{ background: '#1e293b', color: '#e2e8f0' }}>12 PM - 4 PM ☀️ (Afternoon)</option>
                              <option value="evening" style={{ background: '#1e293b', color: '#e2e8f0' }}>4 PM - 6 PM 🌆 (Evening)</option>
                              <option value="flexible" style={{ background: '#1e293b', color: '#e2e8f0' }}>Flexible ⏰ (Best Price)</option>
                            </select>
                            {errors['step1.pickupTime'] && (
                              <Text color="red.400" fontSize="sm" mt={2}>{errors['step1.pickupTime']}</Text>
                            )}
                          </Box>
                        </SimpleGrid>

                        {/* Crew Size Selection */}
                        <Box mt={4}>
                          <Text 
                            color="white" 
                            fontSize={{ base: "sm", md: "md" }} 
                            mb={3}
                            fontWeight="bold"
                            letterSpacing="wide"
                          >
                            👷 How many helpers do you need?
                          </Text>
                          <SimpleGrid 
                            columns={{ base: 2, sm: 4 }} 
                            spacing={{ base: 2, md: 3 }}
                            sx={{
                              '@media screen and (max-width: 480px)': {
                                gridTemplateColumns: 'repeat(2, 1fr) !important',
                                gap: '8px !important',
                              }
                            }}
                          >
                            {[
                              { value: '1', label: '1 Man', desc: 'Driver only', price: 'Base' },
                              { value: '2', label: '2 Men', desc: 'Standard move', price: '+20%', popular: true },
                              { value: '3', label: '3 Men', desc: 'Large items', price: '+35%' },
                              { value: '4', label: '4 Men', desc: 'Full house', price: '+50%' },
                            ].map((option) => {
                              const isSelected = formData.step1.crewSize === option.value;
                              return (
                                <Box
                                  key={option.value}
                                  onClick={() => {
                                    updateFormData('step1', { crewSize: option.value as '1' | '2' | '3' | '4' });
                                    console.log('👷 Crew size changed:', option.value);
                                    // ✅ FIX: Price recalculation is now handled automatically by useEffect in Step 3
                                    // For Step 2, we trigger it manually but without setTimeout
                                    // The useEffect in page.tsx will handle it automatically
                                  }}
                                  cursor="pointer"
                                  p={{ base: 2, md: 4 }}
                                  borderRadius="xl"
                                  border="2px solid"
                                  borderColor={isSelected ? 'blue.400' : 'whiteAlpha.200'}
                                  bg={isSelected 
                                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.3))'
                                    : 'rgba(26, 32, 44, 0.6)'
                                  }
                                  boxShadow={isSelected ? '0 0 20px rgba(59, 130, 246, 0.4)' : 'none'}
                                  transition="all 0.3s"
                                  _hover={{
                                    borderColor: isSelected ? 'blue.400' : 'whiteAlpha.400',
                                    transform: 'translateY(-2px)',
                                  }}
                                  position="relative"
                                  minH={{ base: "80px", md: "auto" }}
                                >
                                  {option.popular && (
                                    <Badge
                                      position="absolute"
                                      top={-2}
                                      right={-2}
                                      colorScheme="green"
                                      fontSize="2xs"
                                      px={2}
                                      borderRadius="full"
                                    >
                                      Popular
                                    </Badge>
                                  )}
                                  <VStack spacing={0.5}>
                                    <Text 
                                      fontSize={{ base: "md", md: "2xl" }} 
                                      fontWeight="bold" 
                                      color={isSelected ? 'blue.300' : 'white'}
                                      lineHeight="1.2"
                                    >
                                      {option.label}
                                    </Text>
                                    <Text 
                                      fontSize={{ base: "2xs", md: "xs" }} 
                                      color="whiteAlpha.700"
                                      textAlign="center"
                                      display={{ base: "none", sm: "block" }}
                                    >
                                      {option.desc}
                                    </Text>
                                    <Badge 
                                      colorScheme={option.price === 'Base' ? 'green' : option.price === 'Popular' ? 'blue' : 'orange'}
                                      fontSize="2xs"
                                      mt={0.5}
                                    >
                                      {option.price}
                                    </Badge>
                                  </VStack>
                                </Box>
                              );
                            })}
                          </SimpleGrid>
                          <Text color="whiteAlpha.600" fontSize="xs" mt={2} textAlign="center">
                            More helpers = faster move. Price adjusts based on crew size.
                          </Text>
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>



                  <WhereAndWhatStepHierarchical
                    formData={formData}
                    updateFormData={updateFormData}
                    updateSegment={updateSegment}
                    errors={errors}
                    calculatePricing={calculateComprehensivePricing}
                  />

                  {/* SINGLE Navigation Section - Bottom of Step 2 */}
                  <Card
                    bg="rgba(26, 32, 44, 0.8)"
                    backdropFilter="blur(10px)"
                    borderRadius="xl"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    mt={8}
                  >
                    <CardBody p={{ base: 4, md: 6 }}>
                      <VStack spacing={4}>
                        {/* Status Message */}
                        {(() => {
                          const segments = (formData.step1.segments || []) as any[];
                          const isMultiLeg = segments.length > 1;
                          const hasItems = isMultiLeg 
                            ? segments.some(s => s.items && s.items.length > 0)
                            : formData.step1.items.length > 0;
                          const hasDate = isMultiLeg
                            ? segments.every(s => s.datetime)
                            : formData.step1.pickupDate;
                          const totalItems = isMultiLeg
                            ? segments.reduce((total, s) => total + (s.items?.length || 0), 0)
                            : formData.step1.items.length;

                          if (!hasItems) {
                            return (
                              <Text color="yellow.300" fontSize="sm" textAlign="center">
                                ⚠️ Please select at least one item to continue
                              </Text>
                            );
                          } else if (!hasDate) {
                            return (
                              <Text color="yellow.300" fontSize="sm" textAlign="center">
                                ⚠️ Please select a date to continue
                              </Text>
                            );
                          } else {
                            return (
                              <Text color="green.300" fontSize="sm" textAlign="center">
                                ✅ Ready to continue - {totalItems} items selected
                              </Text>
                            );
                          }
                        })()}

                        {/* Navigation Buttons */}
                        <HStack justify="space-between" w="full" spacing={4}>
                          <Button
                            leftIcon={<FaArrowLeft />}
                            onClick={() => setCurrentStep(1)}
                            variant="outline"
                            colorScheme="whiteAlpha"
                            size="lg"
                            color="white"
                            borderColor="whiteAlpha.300"
                            _hover={{ bg: 'whiteAlpha.200' }}
                            flex={1}
                          >
                            Back
                          </Button>

                          <Button
                            rightIcon={<FaArrowRight />}
                            onClick={handleNext}
                            bg="blue.500"
                            color="white"
                            size="lg"
                            flex={2}
                            isDisabled={(() => {
                              const segments = (formData.step1.segments || []) as any[];
                              const isMultiLeg = segments.length > 1;
                              const hasItems = isMultiLeg 
                                ? segments.some(s => s.items && s.items.length > 0)
                                : formData.step1.items.length > 0;
                              const hasDate = isMultiLeg
                                ? segments.every(s => s.datetime)
                                : formData.step1.pickupDate;
                              return !hasItems || !hasDate;
                            })()}
                            boxShadow={(() => {
                              const segments = (formData.step1.segments || []) as any[];
                              const isMultiLeg = segments.length > 1;
                              const hasItems = isMultiLeg 
                                ? segments.some(s => s.items && s.items.length > 0)
                                : formData.step1.items.length > 0;
                              const hasDate = isMultiLeg
                                ? segments.every(s => s.datetime)
                                : formData.step1.pickupDate;
                              return hasItems && hasDate ? "0 4px 20px rgba(59, 130, 246, 0.4)" : "none";
                            })()}
                            _hover={(() => {
                              const segments = (formData.step1.segments || []) as any[];
                              const isMultiLeg = segments.length > 1;
                              const hasItems = isMultiLeg 
                                ? segments.some(s => s.items && s.items.length > 0)
                                : formData.step1.items.length > 0;
                              const hasDate = isMultiLeg
                                ? segments.every(s => s.datetime)
                                : formData.step1.pickupDate;
                              return hasItems && hasDate ? {
                                bg: "blue.600",
                                transform: 'translateY(-2px)',
                                boxShadow: '0 6px 24px rgba(59, 130, 246, 0.5)'
                              } : {};
                            })()}
                            _disabled={{
                              opacity: 0.5,
                              cursor: 'not-allowed',
                              bg: "gray.600"
                            }}
                          >
                            Continue
                          </Button>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </Box>
            )}
            {currentStep === 3 && (
              <Box key="step3-payment" w="full" data-booking-step="3">
                <WhoAndPaymentStepSimple
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                  paymentSuccess={false}
                  isCalculatingPricing={isCalculatingPricing}
                  economyPrice={calculateEconomyPrice()}
                  standardPrice={calculateStandardPrice()}
                  priorityPrice={calculatePriorityPrice()}
                  calculatePricing={calculatePricing}
                  calculateComprehensivePricing={calculateComprehensivePricing}
                  validatePromotionCode={validatePromotionCode}
                  applyPromotionCode={applyPromotionCode}
                  removePromotionCode={removePromotionCode}
                  getTotalSegmentsPrice={getTotalSegmentsPrice}
                />
              </Box>
            )}
          </Box>


          {/* Error Display - Removed, errors handled by toast */}
        </Box>
      </Container>

      {/* Inline Back button (non-sticky) */}
      {currentStep === STEPS.length && (
        <Box mt={6} pb={6}>
          <Container maxW={{ base: "full", md: "6xl" }}>
            <Button
              leftIcon={<FaArrowLeft />}
              onClick={handlePrevious}
              variant="outline"
              size="md"
              colorScheme="gray"
              w="full"
              minH="44px"
            >
              Back to Previous Step
            </Button>
          </Container>
        </Box>
      )}

      {/* Bottom navigation removed as per request */}
      
      {/* Unified Floating Action Buttons */}
      <FloatingActionButtons
        itemCount={(() => {
          const segments = (formData.step1.segments || []) as any[];
          const isMultiLeg = segments.length > 1;
          if (isMultiLeg) {
            return segments.reduce((total, seg) => {
              const items = seg.items || [];
              return total + items.reduce((sum: number, item: any) => sum + item.quantity, 0);
            }, 0);
          }
          return (formData.step1.items || []).reduce((sum, item) => sum + item.quantity, 0);
        })()}
        onItemsClick={onItemsOpen}
        showItemsButton={currentStep === 2 || currentStep === 3}
        onAIClick={onAIOpen}
        showAIButton={currentStep === 2}
        onChatClick={onChatOpen}
        showChatButton={true}
      />
      
      {/* Customer Chat Widget */}
      <CustomerChatWidget isOpen={isChatOpen} onClose={onChatClose} />
      
      {/* AI Assistant - Only show on step 2 */}
      {currentStep === 2 && (
        <AIItemExtractionAssistant
          isOpen={isAIOpen}
          onClose={onAIClose}
          propertyType={'house'}
          selectedItems={(formData.step1.items || []).map((item) => ({
            id: item.id || item.name,
            name: item.name,
            quantity: item.quantity,
          }))}
          onAddItems={(extractedItems) => {
            // Handle extracted items
            const segments = (formData.step1.segments || []) as any[];
            const isMultiLeg = segments.length > 1;
            
            if (isMultiLeg) {
              // For multi-leg, add to current segment (or first segment)
              // This logic can be improved based on your requirements
              console.log('AI extracted items for multi-leg booking:', extractedItems);
            } else {
              // For single journey, add to items list
              const currentItems = formData.step1.items || [];
              const updatedItems = [...currentItems];
              
              extractedItems.forEach(aiItem => {
                const existingIndex = updatedItems.findIndex(item => item.name === aiItem.item.name);
                if (existingIndex >= 0) {
                  updatedItems[existingIndex].quantity += aiItem.quantity;
                } else {
                  updatedItems.push({
                    id: aiItem.item.id || aiItem.item.name,
                    name: aiItem.item.name,
                    quantity: aiItem.quantity,
                    category: aiItem.item.category || '',
                    description: '',
                    size: (aiItem.size as 'small' | 'medium' | 'large') || 'medium',
                    unitPrice: 0,
                    totalPrice: 0,
                    weight: aiItem.item.weight || 0,
                    volume: 0,
                  });
                }
              });
              
              updateFormData('step1', {
                ...formData.step1,
                items: updatedItems,
              });
            }
            
            toast({
              title: 'Items Added',
              description: `${extractedItems.length} item(s) added by AI`,
              status: 'success',
              duration: 3000,
            });
          }}
        />
      )}

      {/* Selected Items Modal - Multi-leg Journey Switcher */}
      <Modal isOpen={isItemsOpen} onClose={onItemsClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent bg="gray.900" color="white" maxW="900px">
          <ModalHeader borderBottom="1px solid" borderColor="whiteAlpha.200">
            Selected Items 
            {(() => {
              const segments = (formData.step1.segments || []) as BookingSegment[];
              const isMultiLeg = segments.length > 1;
              const totalItems = isMultiLeg 
                ? segments.reduce((sum, seg) => sum + (seg.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0)
                : (formData.step1.items || []).reduce((sum, item) => sum + item.quantity, 0);
              return ` (${totalItems})`;
            })()}
          </ModalHeader>
          <ModalCloseButton 
            color="white" 
            _hover={{ bg: 'whiteAlpha.300' }} 
          />
          <ModalBody pb={6} pt={4}>
            <SelectedItemsManager
              segments={(formData.step1.segments || []) as BookingSegment[]}
              isMultiLeg={(formData.step1.segments || []).length > 1}
              globalItems={formData.step1.items || []}
              onIncrement={(segmentIndex, itemId) => {
                const segments = (formData.step1.segments || []) as BookingSegment[];
                const isMultiLeg = segments.length > 1;

                if (isMultiLeg && segmentIndex !== null) {
                  // Multi-leg: increment in specific segment
                  const updatedSegments = segments.map((segment, idx) => {
                    if (idx !== segmentIndex) return segment;
                    
                    const items = segment.items || [];
                    const itemIndex = items.findIndex(i => i.id === itemId);
                    if (itemIndex === -1) return segment;
                    
                    return {
                      ...segment,
                      items: items.map((item, i) => 
                        i === itemIndex 
                          ? { ...item, quantity: Math.min((item.quantity || 0) + 1, 99) }
                          : item
                      ),
                    };
                  });
                  
                  updateFormData('step1', { segments: updatedSegments });
                } else {
                  // Single-leg: increment in global items
                  const items = formData.step1.items || [];
                  const itemIndex = items.findIndex(i => i.id === itemId);
                  if (itemIndex !== -1) {
                    const updatedItems = items.map((item, i) =>
                      i === itemIndex
                        ? { ...item, quantity: Math.min((item.quantity || 0) + 1, 99) }
                        : item
                    );
                    updateFormData('step1', { items: updatedItems });
                  }
                }
              }}
              onDecrement={(segmentIndex, itemId) => {
                const segments = (formData.step1.segments || []) as BookingSegment[];
                const isMultiLeg = segments.length > 1;

                if (isMultiLeg && segmentIndex !== null) {
                  // Multi-leg: decrement in specific segment
                  const updatedSegments = segments.map((segment, idx) => {
                    if (idx !== segmentIndex) return segment;
                    
                    const items = segment.items || [];
                    const itemIndex = items.findIndex(i => i.id === itemId);
                    if (itemIndex === -1) return segment;
                    
                    return {
                      ...segment,
                      items: items.map((item, i) => 
                        i === itemIndex 
                          ? { ...item, quantity: Math.max((item.quantity || 0) - 1, 0) }
                          : item
                      ).filter(item => item.quantity > 0), // Remove if quantity is 0
                    };
                  });
                  
                  updateFormData('step1', { segments: updatedSegments });
                } else {
                  // Single-leg: decrement in global items
                  const items = formData.step1.items || [];
                  const itemIndex = items.findIndex(i => i.id === itemId);
                  if (itemIndex !== -1) {
                    const updatedItems = items.map((item, i) =>
                      i === itemIndex
                        ? { ...item, quantity: Math.max((item.quantity || 0) - 1, 0) }
                        : item
                    ).filter(item => item.quantity > 0);
                    updateFormData('step1', { items: updatedItems });
                  }
                }
              }}
              onRemove={(segmentIndex, itemId) => {
                const segments = (formData.step1.segments || []) as BookingSegment[];
                const isMultiLeg = segments.length > 1;

                if (isMultiLeg && segmentIndex !== null) {
                  // Multi-leg: remove from specific segment
                  const updatedSegments = segments.map((segment, idx) => {
                    if (idx !== segmentIndex) return segment;
                    
                    return {
                      ...segment,
                      items: (segment.items || []).filter(item => item.id !== itemId),
                    };
                  });
                  
                  updateFormData('step1', { segments: updatedSegments });
                  
                  toast({
                    title: 'Item Removed',
                    description: `Item removed from ${segments[segmentIndex].segmentType} journey`,
                    status: 'info',
                    duration: 2000,
                  });
                } else {
                  // Single-leg: remove from global items
                  const items = formData.step1.items || [];
                  const removedItem = items.find(i => i.id === itemId);
                  const updatedItems = items.filter(item => item.id !== itemId);
                  
                  updateFormData('step1', { items: updatedItems });
                  
                  toast({
                    title: 'Item Removed',
                    description: removedItem ? `${removedItem.name} has been removed` : 'Item removed',
                    status: 'info',
                    duration: 2000,
                  });
                }
              }}
              showPricing={false}
              readonly={false}
              currentSegmentIndex={0}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
    </>
  );
}
