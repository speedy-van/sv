'use client';

/* eslint-disable no-console -- critical console.error for booking reference visibility check */
/**
 * Step 3: Customer Details & Payment - Simplified Version
 * Updated: 2025-11-20 - Enhanced toggle button UX
 * Clean, modern design like Uber/Airbnb
 *
 * ⚠️⚠️⚠️ CRITICAL WARNINGS - READ BEFORE EDITING ⚠️⚠️⚠️
 * 
 * This file contains CRITICAL UI components that MUST NOT be deleted:
 * 
 * 1. BOOKING REFERENCE ALERT (line ~995):
 *    - Shows booking reference number to customer
 *    - Has data-testid="booking-reference-alert"
 *    - DO NOT DELETE - breaks booking tracking system
 * 
 * 2. PRICE CALENDAR CARDS (line ~1050):
 *    - 14-day pricing calendar
 *    - Core booking selection interface
 * 
 * 3. ADDRESS WARNING (line ~1790):
 *    - Warns when postcode is missing
 * 
 * Before deleting ANY component:
 * - Check for data-critical="true" attribute
 * - Check for console.error warnings
 * - See: apps/web/src/app/booking-luxury/CRITICAL_COMPONENTS.md
 * 
 * If you accidentally delete a critical component, check git history:
 * git log -p -S "bookingReference" -- "WhoAndPaymentStep_Simple.tsx"
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Flex,
  Text,
  Input,
  Textarea,
  Checkbox,
  Divider,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Icon,
  SimpleGrid,
  useDisclosure,
  Heading,
  Button,
  Wrap,
  WrapItem,
  Tag,
  useBreakpointValue,
  Card,
  CardBody,
} from '@chakra-ui/react';
import {
  FaCreditCard,
  FaMapMarkerAlt,
  FaInfoCircle,
} from 'react-icons/fa';
import {
  SiApplepay,
  SiGooglepay,
  SiAfterpay,
  SiKlarna,
  SiVisa,
  SiMastercard,
} from 'react-icons/si';
import type { BookingSegment } from '../types/segment';
import { FormData, CustomerDetails } from '../hooks/useBookingForm';
import StripePaymentButton from './StripePaymentButton';
import { useIsIOSDevice } from '@/hooks/useIsIOSDevice';
import { ALL_REMOVAL_ITEMS } from '@/lib/uk-removal-items-data';
import OrbitingIconsAnimation from './OrbitingIconsAnimation';
import LuxurySurfaceCard from './LuxurySurfaceCard';

interface WhoAndPaymentStepProps {
  formData: FormData;
  updateFormData: (step: keyof FormData, data: Partial<FormData[keyof FormData]>) => void;
  errors: Record<string, string>;
  paymentSuccess?: boolean;
  isCalculatingPricing?: boolean;
  economyPrice?: number;
  standardPrice?: number;
  priorityPrice?: number;
  calculatePricing?: () => Promise<boolean>;
  calculateComprehensivePricing?: () => Promise<void>;
  validatePromotionCode?: (code: string) => Promise<{ success: boolean; error?: string; promotion?: unknown }>;
  applyPromotionCode?: (code: string) => Promise<{ success: boolean; error?: string; promotion?: unknown }>;
  removePromotionCode?: () => void;
  getTotalSegmentsPrice?: () => number;
  capacityCheck?: unknown;
  routeSummary?: unknown;
  onBookingCreated?: (payload: { bookingId: string; reference: string }) => void;
}

export default function WhoAndPaymentStepSimple({
  formData,
  updateFormData,
  errors,
  capacityCheck: _capacityCheck,
  routeSummary: _routeSummary,
  onBookingCreated,
  economyPrice: _economyPrice = 0,
  standardPrice = 0,
  priorityPrice: _priorityPrice = 0,
  calculatePricing: _calculatePricing,
  calculateComprehensivePricing,
  getTotalSegmentsPrice: _getTotalSegmentsPrice,
  validatePromotionCode,
  applyPromotionCode,
  removePromotionCode,
}: WhoAndPaymentStepProps) {
  const [selectedDayKey, setSelectedDayKey] = useState<string | undefined>(undefined);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [promotionCode, setPromotionCode] = useState('');
  const [isValidatingPromotion, setIsValidatingPromotion] = useState(false);
  const { isOpen: _isSummaryExpanded, onToggle: _toggleSummary } = useDisclosure({ defaultIsOpen: false });
  const [pricingStage, setPricingStage] = useState<'calculating' | 'results'>('calculating');
  const [visibleCardsCount, setVisibleCardsCount] = useState(0);
  const toast = useToast();
  const _isIOSDevice = useIsIOSDevice();
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false;
  const [isMobileView, setIsMobileView] = useState(false);
  const [_mobilePriceCardLimit, _setMobilePriceCardLimit] = useState(6);

  // ⚠️ CRITICAL: Safety check for booking reference card visibility
  useEffect(() => {
    if (formData.step2.bookingReference) {
      const alertElement = document.querySelector('[data-testid="booking-reference-alert"]');
      if (!alertElement) {
        console.error(
          '🚨 CRITICAL BUG: Booking reference exists but alert card is not rendered!',
          '\n   Reference:', formData.step2.bookingReference,
          '\n   This means the booking reference card was deleted or hidden.',
          '\n   Location: WhoAndPaymentStep_Simple.tsx line ~995',
          '\n   Fix: Check if Alert with data-testid="booking-reference-alert" exists'
        );
      }
    }
  }, [formData.step2.bookingReference]);

  // Handle promotion code application
  const handleApplyPromotionCode = async () => {
    if (!promotionCode.trim()) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a promotion code',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    if (!validatePromotionCode || !applyPromotionCode) {
      toast({
        title: 'Error',
        description: 'Promotion validation is not available',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    setIsValidatingPromotion(true);
    try {
      // Use actualPrice (the current displayed price) instead of formData.step1.pricing.total
      // This ensures we validate against the correct price (after service selection)
      const currentPrice = actualPrice;
      
      // First validate the promotion code with the current price
      const validationResult = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: promotionCode.trim(),
          amount: currentPrice,
          customerEmail: formData.step2.customerDetails.email || undefined,
          pickupPostcode: formData.step1.pickupAddress?.postcode || '',
            serviceType,
        }),
      });

      const validationData = await validationResult.json();

      if (!validationResult.ok) {
        toast({
          title: 'Error',
          description: validationData.error || 'Failed to validate promotion code',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (!validationData.valid) {
        toast({
          title: 'Invalid Promotion Code',
          description: validationData.error || 'Please check your code and try again',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // If validation succeeds, apply the promotion
      const result = await applyPromotionCode(promotionCode.trim());
      const promotion = result.promotion as { name?: string; discountAmount?: number } | undefined;

      if (result.success && promotion) {
        setPromotionCode('');
        toast({
          title: 'Promotion Applied! 🎉',
          description: `${promotion.name ?? 'Promotion'} - You saved £${promotion.discountAmount?.toFixed(2) ?? '0.00'}!`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Invalid Promotion Code',
          description: result.error || 'Please check your code and try again',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error applying promotion:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply promotion code. Please try again.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsValidatingPromotion(false);
    }
  };
  
  // ✅ FIX: Track previous items and crewSize to detect changes and trigger price recalculation
  // This replaces the setTimeout workaround with proper React state management
  const prevItemsRef = useRef<string>('');
  const prevCrewSizeRef = useRef<string>('');
  const isRecalculatingRef = useRef(false);

  const handleBookingCreated = useCallback(({ bookingId, reference }: { bookingId: string; reference: string }) => {
    updateFormData('step2', { bookingId, bookingReference: reference });
    if (onBookingCreated) {
      onBookingCreated({ bookingId, reference });
    }
    // Toast removed to prevent duplicate notifications; the inline alert handles visibility.
  }, [onBookingCreated, updateFormData]);
  
  // Track items and crewSize changes for automatic price recalculation
  useEffect(() => {
    // Create a stable string representation of items for comparison
    const currentItemsKey = JSON.stringify(
      (formData.step1.items || []).map((item: { id: string; quantity: number }) => ({ id: item.id, quantity: item.quantity }))
    );
    const currentCrewSize = formData.step1.crewSize || '2';
    
    // Skip if already recalculating or if nothing changed
    if (isRecalculatingRef.current) {
      return;
    }
    
    // Check if items changed
    const itemsChanged = prevItemsRef.current !== currentItemsKey;
    const crewSizeChanged = prevCrewSizeRef.current !== currentCrewSize;
    
    if (itemsChanged || crewSizeChanged) {
      // Update refs
      prevItemsRef.current = currentItemsKey;
      prevCrewSizeRef.current = currentCrewSize;
      
      // Only recalculate if we have the necessary data
      const hasAddresses = formData.step1.pickupAddress?.coordinates && formData.step1.dropoffAddress?.coordinates;
      const hasItems = (formData.step1.items || []).length > 0;
      
      if (hasAddresses && hasItems && calculateComprehensivePricing) {
        isRecalculatingRef.current = true;
        calculateComprehensivePricing()
          .catch((error) => {
            console.error('Failed to recalculate pricing after change:', error);
          })
          .finally(() => {
            // Reset flag after a short delay to allow state to settle
            setTimeout(() => {
              isRecalculatingRef.current = false;
            }, 200);
          });
      }
    }
  }, [
    formData.step1.items,
    formData.step1.crewSize,
    formData.step1.pickupAddress?.coordinates,
    formData.step1.dropoffAddress?.coordinates,
    calculateComprehensivePricing
  ]);
  
  // REMOVED: This useEffect was causing auto-scroll on desktop on every render
  // Mobile scroll position is now handled properly in individual event handlers
  
  const sanitizePrice = (value: number | undefined | null) => {
    if (typeof value === 'number') {
      if (!Number.isNaN(value)) {
        if (value > 0) {
          const fixed = value.toFixed(2);
          return parseFloat(fixed);
        }
      }
    }
    return undefined;
  };

  const segments = useMemo(
    () => (formData.step1.segments || []) as BookingSegment[],
    [formData.step1.segments]
  );

  // Detect when address data is incomplete (e.g., missing postcodes) so we can warn
  const hasBasePostcodes =
    Boolean(formData.step1.pickupAddress?.postcode) &&
    Boolean(formData.step1.dropoffAddress?.postcode);

  const segmentsMissingPostcodes = segments.length > 0
    ? segments.some((segment) => {
        const pickup = segment?.pickupAddress?.postcode;
        const dropoff = segment?.dropoffAddress?.postcode;
        return !pickup || !dropoff;
      })
    : false;

  const addressIncomplete = segments.length > 0
    ? segmentsMissingPostcodes
    : !hasBasePostcodes;
  const segmentTotal = useMemo(() => {
    return segments.reduce((sum, segment) => {
      const value = segment?.pricing?.total;
      if (typeof value === 'number' && value > 0) {
        return sum + value;
      }
      return sum;
    }, 0);
  }, [segments]);

  // CRITICAL FIX: Check if we have multi-leg with actual pricing
  // If segmentTotal is 0 but we have segments, the pricing hasn't been calculated yet
  // In that case, fall back to standardPrice prop which now has fallback logic
  const hasMultiLegPrice = segments.length > 1 && segmentTotal > 0;
  const isMultiLegWithoutPricing = segments.length > 1 && segmentTotal === 0;

  let safeStandardPrice = sanitizePrice(standardPrice);
  if (safeStandardPrice === undefined) {
    const fallbackStandard = sanitizePrice(formData.step1.pricing?.total);
    if (fallbackStandard !== undefined) {
      safeStandardPrice = fallbackStandard;
    } else {
      safeStandardPrice = 0;
    }
  }

  // For multi-leg without segment pricing, use standardPrice (which now has fallback)
  const standardBase = hasMultiLegPrice ? segmentTotal : safeStandardPrice;

  // Calendar-based pricing (2-3 weeks forward)
  // CRITICAL: Use today as anchor, NOT the selected pickupDate
  // This prevents infinite loop when user selects a date
  const normalizeDate = (value: string | Date | undefined) => {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) {
      const fallback = new Date();
      fallback.setHours(0, 0, 0, 0);
      return fallback;
    }
    date.setHours(0, 0, 0, 0);
    return date;
  };

  // Fixed anchor date = today (doesn't change when user selects a date)
  const todayAnchor = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  // User's selected date (for initial selection only)
  const initialPickupDate = normalizeDate(formData.step1.pickupDate);

  const buildPriceCalendar = useCallback(
    (basePrice: number, days: number, anchor: Date) => {
      const results: {
        date: Date;
        iso: string;
        key: string;
        label: string;
        weekday: string;
        price: number;
        factor: number;
      }[] = [];

      const clampedBase = basePrice > 0 ? basePrice : 0;

      for (let i = 0; i < days; i++) {
        const d = new Date(anchor);
        d.setDate(d.getDate() + i);
        const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' });
        const day = d.getDate();
        const month = d.toLocaleDateString('en-GB', { month: 'short' });

        const daysAway = i;
        let factor = 1;

        // Lead-time based adjustments
        if (daysAway === 0) {
          factor = 1.25; // same-day premium
        } else if (daysAway <= 1) {
          factor = 1.15;
        } else if (daysAway <= 3) {
          factor = 1.08;
        } else if (daysAway <= 6) {
          factor = 1.02;
        } else if (daysAway <= 10) {
          factor = 0.96;
        } else if (daysAway <= 14) {
          factor = 0.92;
        } else {
          factor = 0.9;
        }

        // Weekend slight premium
        const dayOfWeek = d.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          factor += 0.05;
        }

        const price = parseFloat((clampedBase * factor).toFixed(2));

        const iso = d.toISOString();
        results.push({
          date: d,
          iso,
          key: iso.split('T')[0], // date-only key to avoid tz drift
          label: `${weekday} ${day} ${month}`,
          weekday,
          price,
          factor,
        });
      }

      return results;
    },
    []
  );

  const priceCalendar = useMemo(() => {
    // CRITICAL: Use todayAnchor (fixed) instead of pickupDate (changes)
    // This prevents infinite loop when user selects a date
    return buildPriceCalendar(standardBase, 21, todayAnchor);
  }, [buildPriceCalendar, standardBase, todayAnchor]);

  // Fallback media detection to ensure mobile UI toggles even if breakpoint hook fails
  useEffect(() => {
    const compute = () => setIsMobileView(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const _effectiveIsMobile = isMobile || isMobileView;

  const isSameDay = (a: Date, b: Date) => {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  };

  // Initialize selectedDayKey only once on mount, based on existing pickupDate or first available
  useEffect(() => {
    // If user already chose a day, keep it
    if (selectedDayKey) return;
    
    // Try to match with initialPickupDate (from formData)
    const match = priceCalendar.find((entry) => isSameDay(entry.date, initialPickupDate));
    if (match) {
      setSelectedDayKey(match.key);
    } else if (priceCalendar.length > 0) {
      // Default to first day (today)
      setSelectedDayKey(priceCalendar[0].key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  const handleSelectDay = useCallback((index: number) => {
    const target = priceCalendar[index];
    console.log('📅 handleSelectDay called:', { index, target, currentSelectedDayKey: selectedDayKey });
    if (!target) {
      console.warn('⚠️ No target found at index:', index);
      return;
    }
    // Avoid unnecessary updates if already selected
    if (selectedDayKey === target.key) {
      console.log('✓ Already selected, skipping');
      return;
    }
    console.log('✅ Updating selection to:', target.key);
    setSelectedDayKey(target.key);
    updateFormData('step1', {
      pickupDate: target.key, // store date-only to avoid tz drift
    });
  }, [priceCalendar, selectedDayKey, updateFormData]);

  const selectedPriceOption = useMemo(() => {
    if (selectedDayKey) {
      return priceCalendar.find((p) => p.key === selectedDayKey) || priceCalendar[0];
    }
    return priceCalendar[0];
  }, [priceCalendar, selectedDayKey]);

  const actualPrice = selectedPriceOption?.price ?? standardBase ?? 0;
  const selectedPriceLabel = selectedPriceOption ? selectedPriceOption.label : 'Selected date';
  const serviceType = 'standard';

  const priceIsValid = Number.isFinite(actualPrice) && actualPrice > 0;
  const priceReady = !addressIncomplete && priceIsValid;
  const displayPriceText = priceReady ? `£${actualPrice.toFixed(2)}` : 'Add full address';

  const priceStats = useMemo(() => {
    if (!priceCalendar.length) {
      return { cheap: 0, expensive: 0, min: 0, max: 0 };
    }
    const prices = priceCalendar.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = max - min || 1;
    const cheap = min + span * 0.33;
    const expensive = min + span * 0.66;
    return { cheap, expensive, min, max };
  }, [priceCalendar]);

  const getPriceLevel = (price: number) => {
    if (!priceCalendar.length) return 'mid' as const;
    if (price <= priceStats.cheap) return 'cheap' as const;
    if (price >= priceStats.expensive) return 'expensive' as const;
    return 'mid' as const;
  };

  const cheapestIndex = useMemo(() => {
    if (!priceCalendar.length) return 0;
    let minIdx = 0;
    let min = priceCalendar[0].price;
    priceCalendar.forEach((p, idx) => {
      if (p.price < min) {
        min = p.price;
        minIdx = idx;
      }
    });
    return minIdx;
  }, [priceCalendar]);

  const _selectCheapest = useCallback(() => {
    handleSelectDay(cheapestIndex);
  }, [cheapestIndex, handleSelectDay]);

  const _selectEarliest = useCallback(() => {
    handleSelectDay(0);
  }, [handleSelectDay]);

  // ✅ Show 2 weeks (14 days) - earlier dates cheaper, later dates available
  const visiblePriceCalendar = useMemo(() => {
    if (!priceCalendar.length) return [];
    
    // Show first 14 days (2 weeks)
    return priceCalendar.slice(0, 14);
  }, [priceCalendar]);

  // ✅ LUXURY APPROACH: Always show all 3 cards (no pagination needed)
  const displayedPriceCalendar = useMemo(() => {
    return visiblePriceCalendar; // Always show all 3 curated options
  }, [visiblePriceCalendar]);

  // Debug logging only in development mode to reduce console noise
  if (process.env.NODE_ENV === 'development') {
    console.log('💰 Step 3 Pricing Sanity Check:', {
      safeStandardPrice,
      isMultiLeg: segments.length > 1,
      isMultiLegWithoutPricing,
      hasMultiLegPrice,
      segmentCount: segments.length,
      segmentTotal,
      standardBase,
      totalSegmentsPrice: hasMultiLegPrice ? segmentTotal : 'N/A (using standardBase fallback)',
      selectedDayKey,
      selectedPriceOption,
      actualPrice
    });
  }

  // ✅ FIXED: For multi-leg, items are now isolated per segment
  // Each segment has its own items array - NO cross-segment sync
  // Step 3 displays items from ALL segments for checkout summary
  const selectedItems = useMemo(() => {
    const segments = (formData.step1.segments || []) as BookingSegment[];
    const isMultiLeg = segments.length > 1;
    
    if (isMultiLeg) {
      // ✅ CRITICAL FIX: For multi-leg, aggregate ALL items from ALL segments
      // Each segment now has its own isolated items (fixed in Step 2)
      // Create a map to aggregate quantities: { itemId: totalQuantity }
      const itemsMap = new Map<string, { quantity: number; name?: string; id?: string; weight?: number }>();
      
      segments.forEach(segment => {
        if (segment.items && Array.isArray(segment.items)) {
          segment.items.forEach(item => {
            const existing = itemsMap.get(item.id);
            if (existing) {
              // Increment quantity for existing item
              existing.quantity += item.quantity;
            } else {
              // Add new item with full properties
              const catalogItem = ALL_REMOVAL_ITEMS.find(c => c.id === item.id);
              itemsMap.set(item.id, {
                ...item,
                ...catalogItem, // Merge catalog data (name, category, etc.)
                quantity: item.quantity, // Override with actual quantity
              });
            }
          });
        }
      });
      
      return Array.from(itemsMap.values());
    }
    
    // Single-leg: use global items
    return (formData.step1.items && Array.isArray(formData.step1.items)) 
      ? formData.step1.items.map(item => ({ ...item }))
      : [];
  }, [formData.step1.items, formData.step1.segments]);

  const _selectionStats = useMemo(() => {
    if (!selectedItems.length) {
      return { totalItems: 0, totalWeight: 0 };
    }

    let totalItems = 0;
    let totalWeight = 0;

    selectedItems.forEach((item) => {
      totalItems += item.quantity;
      totalWeight += item.quantity * (item.weight ?? 0);
    });

    return { totalItems, totalWeight };
  }, [selectedItems]);

  // ✅ FIXED: Apply item updates to all segments (multi-leg) or global items (single-leg)
  // Ensures all segments stay synchronized with proper deep copying
  const applyItemUpdates = useCallback(
    (items: typeof selectedItems) => {
      // Save scroll position before update (mobile only)
      const isMobile = window.innerWidth < 768;
      const scrollY = isMobile ? window.scrollY : undefined;
      
      const sanitizedItems = (items || [])
        .map((item) => ({
          ...item,
          quantity: Math.max(0, item.quantity ?? 0),
        }))
        .filter((item) => item.quantity > 0);

      const segments = (formData.step1.segments || []) as BookingSegment[];
      const isMultiLeg = segments.length > 1;

      if (isMultiLeg) {
        // ✅ CRITICAL FIX: For multi-leg, keep ALL items in ALL segments with SAME quantities
        // This is correct because each journey leg carries the same items
        // (e.g., outbound brings items A→B, return brings same items B→A)
        const updatedSegments: BookingSegment[] = segments.map((segment) => ({
          ...segment,
          // Each segment gets the full items list (not divided) with deep copy.
          // Cast: sanitizedItems are aggregated from segment items + catalog; full Item shape is ensured elsewhere.
          items: sanitizedItems.map((item) => ({ ...item })) as FormData['step1']['items'],
        }));

        updateFormData('step1', { 
          segments: updatedSegments,
          items: sanitizedItems.map((item) => ({ ...item })) as FormData['step1']['items'],
        });
      } else {
        // Single-leg: update global items
        updateFormData('step1', {
          items: sanitizedItems.map((item) => ({ ...item })) as FormData['step1']['items'],
        });
      }
      
      // Restore scroll position after update (mobile only)
      if (isMobile && scrollY !== undefined) {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY);
        });
      }
    },
    [updateFormData, formData.step1.segments]
  );

  const _incrementItem = useCallback(
    async (itemId: string) => {
      const segments = (formData.step1.segments || []) as BookingSegment[];
      const isMultiLeg = segments.length > 1;

      if (isMultiLeg) {
        // Multi-leg: Increment item quantity in ALL segments equally
        // This maintains consistency - when user adds 1, it adds 1 to total
        // by adding 1 to the first segment only (matching displayed behavior)
        const updatedSegments = [...segments];
        let incrementedOnce = false;
        
        for (let i = 0; i < updatedSegments.length && !incrementedOnce; i++) {
          const segment = updatedSegments[i];
          if (!segment.items) continue;
          
          const itemIndex = segment.items.findIndex(item => item.id === itemId);
          if (itemIndex !== -1) {
            // Found the item, increment only in this segment
            updatedSegments[i] = {
              ...segment,
              items: segment.items.map((item, idx) =>
                idx === itemIndex
                  ? { ...item, quantity: Math.min((item.quantity || 0) + 1, 99) }
                  : item
              )
            };
            incrementedOnce = true;
          }
        }

        // Update ALL segments with the same items (deep copy for each)
        const finalSegments = updatedSegments.map((segment) => ({
          ...segment,
          items: updatedSegments[0].items?.map(item => ({ ...item })) || []
        }));

        updateFormData('step1', { 
          segments: finalSegments,
          items: finalSegments[0].items?.map(item => ({ ...item })) || []
        });

        // ✅ FIX: Price recalculation is now handled automatically by useEffect
        // No need for setTimeout - React state updates will trigger useEffect
        // This ensures proper state synchronization without race conditions
      } else {
        // Single-leg: update global items
        const currentItems = formData.step1.items || [];
        const nextItems = currentItems.map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.min((item.quantity || 0) + 1, 99) }
            : item
        );
        applyItemUpdates(nextItems);

        // ✅ FIX: Price recalculation is now handled automatically by useEffect
        // No need for setTimeout - React state updates will trigger useEffect
        // This ensures proper state synchronization without race conditions
      }
    },
    [formData.step1.items, formData.step1.segments, applyItemUpdates, updateFormData]
  );

  const _decrementItem = useCallback(
    async (itemId: string) => {
      const segments = (formData.step1.segments || []) as BookingSegment[];
      const isMultiLeg = segments.length > 1;

      if (isMultiLeg) {
        // Multi-leg: Decrement item quantity in ALL segments equally
        // This maintains consistency - when user removes 1, it removes 1 from total
        const firstSegment = segments[0];
        if (!firstSegment?.items) {
          return;
        }
        
        const itemIndex = firstSegment.items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
          return;
        }
        
        const targetItem = firstSegment.items[itemIndex];
        let updatedItems: typeof firstSegment.items;
        
        if ((targetItem.quantity || 0) <= 1) {
          // Remove item completely from all segments
          updatedItems = firstSegment.items.filter((_, idx) => idx !== itemIndex);
        } else {
          // Decrease quantity in all segments
          updatedItems = firstSegment.items.map((item, idx) =>
            idx === itemIndex
              ? { ...item, quantity: Math.max((item.quantity || 0) - 1, 1) }
              : item
          );
        }

        // Update ALL segments with the same items (deep copy for each)
        const finalSegments = segments.map((segment) => ({
          ...segment,
          items: updatedItems.map(item => ({ ...item }))
        }));

        // CRITICAL: Update formData first, then wait a bit for state to update before recalculating
        updateFormData('step1', { 
          segments: finalSegments,
          items: updatedItems.map(item => ({ ...item }))
        });

        // ✅ FIX: Price recalculation is now handled automatically by useEffect
        // No need for setTimeout - React state updates will trigger useEffect
        // This ensures proper state synchronization without race conditions
      } else {
        // Single-leg: update global items
        const currentItems = formData.step1.items || [];
        const target = currentItems.find((item) => item.id === itemId);
        if (!target) {
          return;
        }

        if ((target.quantity || 0) <= 1) {
          const nextItems = currentItems.filter((item) => item.id !== itemId);
          applyItemUpdates(nextItems);
        } else {
          const nextItems = currentItems.map((item) =>
            item.id === itemId
              ? { ...item, quantity: Math.max((item.quantity || 0) - 1, 1) }
              : item
          );
          applyItemUpdates(nextItems);
        }

        // ✅ FIX: Price recalculation is now handled automatically by useEffect
        // No need for setTimeout - React state updates will trigger useEffect
        // This ensures proper state synchronization without race conditions
      }
    },
    [formData.step1.items, formData.step1.segments, applyItemUpdates, updateFormData]
  );

  const _removeItem = useCallback(
    async (itemId: string) => {
      const segments = (formData.step1.segments || []) as BookingSegment[];
      const isMultiLeg = segments.length > 1;

      if (isMultiLeg) {
        // Multi-leg: Remove item from all segments
        const updatedSegments = segments.map(segment => {
          if (!segment.items) return segment;
          
          return {
            ...segment,
            items: segment.items.filter(item => item.id !== itemId)
          };
        });

        // Update ALL segments with the same items (deep copy for each)
        const finalSegments = updatedSegments.map((segment) => ({
          ...segment,
          items: updatedSegments[0].items?.map(item => ({ ...item })) || []
        }));

        updateFormData('step1', { 
          segments: finalSegments,
          items: finalSegments[0].items?.map(item => ({ ...item })) || []
        });

        // ✅ FIX: Price recalculation is now handled automatically by useEffect
        // No need for setTimeout - React state updates will trigger useEffect
        // This ensures proper state synchronization without race conditions
      } else {
        // Single-leg: remove from global items
        const currentItems = formData.step1.items || [];
        const nextItems = currentItems.filter((item) => item.id !== itemId);
        applyItemUpdates(nextItems);

        // ✅ FIX: Price recalculation is now handled automatically by useEffect
        // No need for setTimeout - React state updates will trigger useEffect
        // This ensures proper state synchronization without race conditions
      }
    },
    [formData.step1.items, formData.step1.segments, applyItemUpdates, updateFormData]
  );

  const updateCustomerDetails = useCallback((field: keyof CustomerDetails, value: string) => {
    // Save scroll position before update (mobile only)
    const isMobile = window.innerWidth < 768;
    const scrollY = isMobile ? window.scrollY : undefined;
    
    updateFormData('step2', {
      customerDetails: {
        ...formData.step2.customerDetails,
        [field]: value
      }
    });
    
    // Restore scroll position after update (mobile only)
    if (isMobile && scrollY !== undefined) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
  }, [formData.step2.customerDetails, updateFormData]);
  
  // Auto-start orbit animation on mount, then gradually show cards
  useEffect(() => {
    // Reset visible cards
    setVisibleCardsCount(0);
    
    // Show 3 cards after 3 seconds
    const timer1 = setTimeout(() => {
      setVisibleCardsCount(3);
      setPricingStage('results');
    }, 3000);
    
    // Show 4 cards after 4 seconds
    const timer2 = setTimeout(() => {
      setVisibleCardsCount(4);
    }, 4000);
    
    // Show 5 cards after 5 seconds
    const timer3 = setTimeout(() => {
      setVisibleCardsCount(5);
    }, 5000);
    
    // Show 6 cards after 6 seconds
    const timer4 = setTimeout(() => {
      setVisibleCardsCount(6);
    }, 6000);
    
    // Show all cards after 7 seconds
    const timer5 = setTimeout(() => {
      setVisibleCardsCount(999); // Show all
    }, 7000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, []); // Run only once on mount

  // Re-trigger orbit animation when items or addresses change
  useEffect(() => {
    const _itemsKey = JSON.stringify(
      (formData.step1.items || []).map((item: { id: string; quantity: number }) => ({ id: item.id, quantity: item.quantity }))
    );
    const _addressKey = `${formData.step1.pickupAddress?.postcode}-${formData.step1.dropoffAddress?.postcode}`;
    
    // Skip first render (already handled by mount effect)
    if (prevItemsRef.current !== '' || prevCrewSizeRef.current !== '') {
      // Reset to calculating stage
      setPricingStage('calculating');
      setVisibleCardsCount(0);
      
      // Show 3 cards after 3 seconds
      const timer1 = setTimeout(() => {
        setVisibleCardsCount(3);
        setPricingStage('results');
      }, 3000);
      
      // Show 4 cards after 4 seconds
      const timer2 = setTimeout(() => {
        setVisibleCardsCount(4);
      }, 4000);
      
      // Show 5 cards after 5 seconds
      const timer3 = setTimeout(() => {
        setVisibleCardsCount(5);
      }, 5000);
      
      // Show 6 cards after 6 seconds
      const timer4 = setTimeout(() => {
        setVisibleCardsCount(6);
      }, 6000);
      
      // Show all cards after 7 seconds
      const timer5 = setTimeout(() => {
        setVisibleCardsCount(999);
      }, 7000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
        clearTimeout(timer5);
      };
    }
  }, [
    formData.step1.items,
    formData.step1.pickupAddress?.postcode,
    formData.step1.dropoffAddress?.postcode,
  ]);

  return (
    <Box w="full">
      <VStack spacing={{ base: 5, md: 6 }} align="stretch">
        {/* Selected Items Summary - Handled by parent with unified floating buttons */}

        {/* ⚠️ CRITICAL: Booking Reference - unified LuxurySurfaceCard (do not delete) */}
        {formData.step2.bookingReference && (
          <LuxurySurfaceCard
            tone="info"
            borderWidth="2px"
            borderColor="blue.400"
            bg="linear-gradient(135deg, rgba(59,130,246,0.22), rgba(37,99,235,0.12))"
            data-testid="booking-reference-alert"
            data-critical="true"
            minH="120px"
          >
            <Box p={{ base: 3, md: 4 }} display="flex" alignItems="center" gap={3}>
              <Icon as={FaInfoCircle} boxSize={5} color="blue.400" flexShrink={0} />
              <Box flex="1" minW={0}>
                <Text fontSize="sm" fontWeight="semibold" color="text.primary" mb={1}>
                  Booking reference (pending payment)
                </Text>
                <Text fontSize="sm" color="text.secondary" opacity={0.95}>
                  {formData.step2.bookingReference} — share this with admin to view or modify before payment.
                </Text>
              </Box>
            </Box>
          </LuxurySurfaceCard>
        )}

        {/* STATE 1: CALCULATING - Show ONLY gears + text during calculating */}
        {pricingStage === 'calculating' && (
          <LuxurySurfaceCard
            tone="info"
            borderWidth="2px"
            borderColor="purple.400"
            boxShadow="0 8px 28px rgba(124, 58, 237, 0.24)"
          >
            <OrbitingIconsAnimation duration={2.5} />
          </LuxurySurfaceCard>
        )}

        {/* STATE 2: RESULTS - Price cards ONLY (no orbit animation) */}
        {pricingStage === 'results' && (
          <VStack spacing={6} align="stretch">
          <Box
            animation="fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
            sx={{
              '@keyframes fadeInUp': {
                '0%': { opacity: 0, transform: 'translateY(20px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            <LuxurySurfaceCard tone="info">
              <Box p={{ base: 5, md: 8 }}>
                <VStack spacing={6} align="stretch">
              <VStack align="stretch" spacing={4}>
                <Heading size="md" color="text.primary">
                  Choose your date
                </Heading>
                <Text color="text.secondary" fontSize="sm">
                  Select a day for your move. Prices vary by date.
                </Text>
                <Box p={3} bg="bg.surface" borderRadius="lg" borderWidth="1px" borderColor="border.primary">
                  <Text color="text.secondary" fontSize="sm" fontWeight="600" textAlign="center">
                    Three pricing options: Best Value, Standard, Premium
                  </Text>
                </Box>
              </VStack>

              {/* Price Grid - 2 weeks (14 days) */}
              <SimpleGrid
                columns={{ base: 2, sm: 3, md: 4, lg: 5 }}
                spacing={{ base: 3, md: 4 }}
                w="full"
              >
                {displayedPriceCalendar.slice(0, visibleCardsCount).map((option, displayIndex) => {
                  const level = getPriceLevel(option.price);
                  const cardIndex = priceCalendar.findIndex((p) => p.iso === option.iso);
                  const isSelected = selectedDayKey
                    ? option.key === selectedDayKey
                    : cardIndex === 0;
                  const isCheapest = cardIndex === cheapestIndex;
                  
                  // Labels for the 3 tiers
                  const tierLabels = ['Best Value', 'Standard', 'Premium'];
                  const tierLabel = tierLabels[displayIndex] || 'Option';

                  const colorScheme = {
                    cheap: {
                      bg: 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.12))',
                      bgHover: 'linear-gradient(135deg, rgba(16,185,129,0.28), rgba(5,150,105,0.18))',
                      border: isSelected ? 'green.400' : 'rgba(16,185,129,0.4)',
                      borderHover: 'rgba(16,185,129,0.6)',
                      glow: '0 0 20px rgba(16,185,129,0.4)',
                      glowHover: '0 0 28px rgba(16,185,129,0.6), 0 4px 20px rgba(16,185,129,0.3)',
                      textColor: 'green.300',
                      iconBg: 'rgba(16,185,129,0.2)',
                    },
                    mid: {
                      bg: 'linear-gradient(135deg, rgba(59,130,246,0.22), rgba(37,99,235,0.12))',
                      bgHover: 'linear-gradient(135deg, rgba(59,130,246,0.28), rgba(37,99,235,0.18))',
                      border: isSelected ? 'blue.400' : 'rgba(59,130,246,0.4)',
                      borderHover: 'rgba(59,130,246,0.6)',
                      glow: '0 0 20px rgba(59,130,246,0.4)',
                      glowHover: '0 0 28px rgba(59,130,246,0.6), 0 4px 20px rgba(59,130,246,0.3)',
                      textColor: 'blue.300',
                      iconBg: 'rgba(59,130,246,0.2)',
                    },
                    expensive: {
                      bg: 'linear-gradient(135deg, rgba(124,58,237,0.22), rgba(109,40,217,0.12))',
                      bgHover: 'linear-gradient(135deg, rgba(124,58,237,0.28), rgba(109,40,217,0.18))',
                      border: isSelected ? 'purple.400' : 'rgba(124,58,237,0.4)',
                      borderHover: 'rgba(124,58,237,0.6)',
                      glow: '0 0 20px rgba(124,58,237,0.4)',
                      glowHover: '0 0 28px rgba(124,58,237,0.6), 0 4px 20px rgba(124,58,237,0.3)',
                      textColor: 'purple.300',
                      iconBg: 'rgba(124,58,237,0.2)',
                    },
                  };

                  const scheme = colorScheme[level];

                  return (
                    <Card
                      as="button"
                      type="button"
                      key={option.iso}
                      w="100%"
                      textAlign="left"
                      borderRadius="xl"
                      borderWidth="2px"
                      borderColor={scheme.border}
                      bg={scheme.bg}
                      boxShadow={isSelected ? scheme.glow : '0 4px 16px rgba(0,0,0,0.4)'}
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      onClick={() => handleSelectDay(cardIndex)}
                      position="relative"
                      minH="140px"
                      overflow="hidden"
                      cursor="pointer"
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        bg: scheme.border,
                        opacity: isSelected ? 1 : 0,
                        transition: 'opacity 0.3s'
                      }}
                      _hover={{
                        bg: scheme.bgHover,
                        borderColor: scheme.borderHover,
                        boxShadow: scheme.glowHover,
                        transform: 'translateY(-4px) scale(1.02)',
                        _before: { opacity: 1 }
                      }}
                      _focusVisible={{ outline: '3px solid #3b82f6', outlineOffset: '3px' }}
                      _active={{ transform: 'translateY(-2px) scale(1.01)' }}
                      sx={{
                        '@keyframes fadeInUp': {
                          '0%': { opacity: 0, transform: 'translateY(30px)' },
                          '100%': { opacity: 1, transform: 'translateY(0)' },
                        },
                      }}
                      animation={`fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${displayIndex * 0.05}s backwards`}
                    >
                      <CardBody p={{ base: 3, md: 4 }} position="relative" backdropFilter="blur(8px)">
                      {isCheapest && (
                        <Badge
                          position="absolute"
                          top="10px"
                          right="10px"
                          bg="linear-gradient(135deg, #10B981, #059669)"
                          color="white"
                          borderRadius="full"
                          px={3}
                          py={1}
                          fontSize="xs"
                          fontWeight="800"
                          boxShadow="0 4px 12px rgba(16,185,129,0.5), 0 0 0 3px rgba(16,185,129,0.2)"
                          display="flex"
                          alignItems="center"
                          gap={1}
                          animation="pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                          sx={{
                            '@keyframes pulse': {
                              '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                              '50%': { opacity: 0.9, transform: 'scale(1.05)' }
                            }
                          }}
                        >
                          💰 Best
                        </Badge>
                      )}

                      {isSelected && (
                        <Box
                          position="absolute"
                          top="10px"
                          left="10px"
                          w="28px"
                          h="28px"
                          borderRadius="full"
                          bg="linear-gradient(135deg, #3B82F6, #2563EB)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 0 0 4px rgba(59,130,246,0.3), 0 4px 12px rgba(59,130,246,0.4)"
                          animation="checkmark-appear 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                          sx={{
                            '@keyframes checkmark-appear': {
                              '0%': { transform: 'scale(0)', opacity: 0 },
                              '50%': { transform: 'scale(1.2)' },
                              '100%': { transform: 'scale(1)', opacity: 1 }
                            }
                          }}
                        >
                          <Text fontSize="md" fontWeight="bold" color="white">✓</Text>
                        </Box>
                      )}

                      <VStack align="stretch" spacing={3}>
                        {/* Tier Label */}
                        <Badge
                          alignSelf="flex-start"
                          bg={scheme.iconBg}
                          color="white"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                          fontSize="2xs"
                          fontWeight="700"
                          textTransform="uppercase"
                          letterSpacing="wide"
                        >
                          {tierLabel}
                        </Badge>

                        <VStack align="stretch" spacing={1}>
                          {/* Plan Title */}
                          <Text 
                            color="white" 
                            fontWeight="700" 
                            fontSize={{ base: 'sm', md: 'md' }} 
                            lineHeight="1.2"
                            noOfLines={1}
                          >
                            {option.label}
                          </Text>
                          
                          {/* Date Info */}
                          <HStack spacing={1}>
                            <Box
                              px={1.5}
                              py={0.5}
                              bg={scheme.iconBg}
                              borderRadius="sm"
                              border="1px solid"
                              borderColor={scheme.border}
                            >
                              <Text color="gray.300" fontSize="2xs" fontWeight="600" textTransform="uppercase">
                                {option.weekday}
                              </Text>
                            </Box>
                          </HStack>
                        </VStack>

                        <Divider borderColor="rgba(255,255,255,0.15)" />

                        {/* Price Display */}
                        <VStack align="stretch" spacing={1}>
                          <Text 
                            fontSize={{ base: '2xl', md: '3xl' }} 
                            fontWeight="900" 
                            color="white"
                            lineHeight="1"
                            letterSpacing="tight"
                          >
                            £{option.price.toFixed(2)}
                          </Text>
                          
                          {/* CTA Indicator (not a button to avoid nesting) */}
                          <HStack
                            h="32px"
                            px={2}
                            bg={isSelected ? scheme.border : 'rgba(255,255,255,0.1)'}
                            color="white"
                            fontWeight="600"
                            borderRadius="md"
                            border="1px solid"
                            borderColor={scheme.border}
                            justify="center"
                            spacing={1}
                          >
                            {isSelected && <Text fontSize="xs">✓</Text>}
                            <Text fontSize="2xs">
                              {isSelected ? 'Selected' : 'Select'}
                            </Text>
                          </HStack>
                        </VStack>
                      </VStack>
                      </CardBody>
                    </Card>
                  );
                })}
              </SimpleGrid>
              
              {/* Selection Confirmation - Enhanced */}
              {selectedPriceOption && (
                <Box 
                  p={5} 
                  bg="linear-gradient(135deg, rgba(59,130,246,0.2), rgba(16,185,129,0.15))"
                  borderRadius="xl"
                  border="2px solid"
                  borderColor="rgba(59, 130, 246, 0.4)"
                  boxShadow="0 8px 24px rgba(59,130,246,0.3)"
                  position="relative"
                  overflow="hidden"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    bgGradient: 'linear(to-r, blue.400, green.400)',
                  }}
                >
                  <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
                    <HStack spacing={3}>
                      <Box 
                        w="48px" 
                        h="48px" 
                        borderRadius="xl" 
                        bg="linear-gradient(135deg, #3B82F6, #10B981)"
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center"
                        boxShadow="0 4px 12px rgba(59,130,246,0.4)"
                      >
                        <Text fontSize="20px">✓</Text>
                      </Box>
                      <VStack align="start" spacing={0.5}>
                        <Text color="gray.300" fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                          Selected Date
                        </Text>
                        <Text color="white" fontWeight="800" fontSize={{ base: 'md', md: 'lg' }}>
                          {selectedPriceOption.label}
                        </Text>
                        <Badge 
                          colorScheme="blue" 
                          fontSize="xs"
                          px={2}
                          py={0.5}
                          borderRadius="md"
                        >
                          {selectedPriceOption.weekday}
                        </Badge>
                      </VStack>
                    </HStack>
                    <VStack align="end" spacing={0.5}>
                      <Text color="gray.300" fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="wide">
                        Total Price
                      </Text>
                      <Text 
                        color="white" 
                        fontWeight="900" 
                        fontSize={{ base: '2xl', md: '3xl' }}
                        lineHeight="1"
                        textShadow="0 2px 8px rgba(16,185,129,0.5)"
                      >
                        £{selectedPriceOption.price.toFixed(2)}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}
            </VStack>
          </Box>
            </LuxurySurfaceCard>
      </Box>
        </VStack>
        )}

        {/* CARD 2: Customer Information - Single Clean Card */}
        <LuxurySurfaceCard tone="info" borderWidth="1px">
          <Box p={{ base: 6, md: 8 }}>
            <VStack spacing={6} align="stretch">
              <Heading size="md" color="text.primary">
                Your information
              </Heading>
              <Text color="text.secondary" fontSize="sm">
                We need these details to contact you and confirm your booking.
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                <FormControl isInvalid={!!errors['step2.customerDetails.firstName']}>
                  <FormLabel color="text.secondary" fontSize="sm" fontWeight="600" mb={2}>
                    👤 First Name
                  </FormLabel>
                  <Input
                    placeholder="John"
                    value={formData.step2.customerDetails.firstName || ''}
                    onChange={(e) => updateCustomerDetails('firstName', e.target.value)}
                    bg="bg.surface"
                    border="1px solid"
                    borderColor="border.primary"
                    color="text.primary"
                    size="lg"
                    h="50px"
                    borderRadius="xl"
                    fontSize="md"
                    fontWeight="500"
                    transition="all 0.2s"
                    _placeholder={{ color: 'text.tertiary' }}
                    _hover={{ borderColor: 'border.secondary', bg: 'bg.surface.elevated' }}
                    _focus={{ 
                      borderColor: 'interactive.primary', 
                      boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                      bg: 'bg.surface.elevated'
                    }}
                  />
                  {errors['step2.customerDetails.firstName'] && (
                    <FormErrorMessage>{errors['step2.customerDetails.firstName']}</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors['step2.customerDetails.lastName']}>
                  <FormLabel color="text.secondary" fontSize="sm" fontWeight="600" mb={2}>
                    👤 Last Name
                  </FormLabel>
                  <Input
                    placeholder="Doe"
                    value={formData.step2.customerDetails.lastName || ''}
                    onChange={(e) => updateCustomerDetails('lastName', e.target.value)}
                    bg="bg.surface"
                    border="1px solid"
                    borderColor="border.primary"
                    color="text.primary"
                    size="lg"
                    h="50px"
                    borderRadius="xl"
                    fontSize="md"
                    fontWeight="500"
                    transition="all 0.2s"
                    _placeholder={{ color: 'text.tertiary' }}
                    _hover={{ borderColor: 'border.secondary', bg: 'bg.surface.elevated' }}
                    _focus={{ 
                      borderColor: 'interactive.primary', 
                      boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                      bg: 'bg.surface.elevated'
                    }}
                  />
                  {errors['step2.customerDetails.lastName'] && (
                    <FormErrorMessage>{errors['step2.customerDetails.lastName']}</FormErrorMessage>
                  )}
                </FormControl>
              </SimpleGrid>

              <FormControl isInvalid={!!errors['step2.customerDetails.email']}>
                <FormLabel color="text.secondary" fontSize="sm" fontWeight="600" mb={2}>
                  ✉️ Email Address
                </FormLabel>
                <Input
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.step2.customerDetails.email || ''}
                  onChange={(e) => updateCustomerDetails('email', e.target.value)}
                  bg="bg.surface"
                  border="1px solid"
                  borderColor="border.primary"
                  color="text.primary"
                  size="lg"
                  h="50px"
                  borderRadius="xl"
                  fontSize="md"
                  fontWeight="500"
                  transition="all 0.2s"
                  _placeholder={{ color: 'text.tertiary' }}
                  _hover={{ borderColor: 'border.secondary', bg: 'bg.surface.elevated' }}
                  _focus={{ 
                    borderColor: 'interactive.primary', 
                    boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                    bg: 'bg.surface.elevated'
                  }}
                />
                {errors['step2.customerDetails.email'] && (
                  <FormErrorMessage>{errors['step2.customerDetails.email']}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors['step2.customerDetails.phone']}>
                <FormLabel color="text.secondary" fontSize="sm" fontWeight="600" mb={2}>
                  📞 Phone Number
                </FormLabel>
                <Input
                  type="tel"
                  placeholder="+44 1234 567890"
                  value={formData.step2.customerDetails.phone || ''}
                  onChange={(e) => updateCustomerDetails('phone', e.target.value)}
                  bg="bg.surface"
                  border="1px solid"
                  borderColor="border.primary"
                  color="text.primary"
                  size="lg"
                  h="50px"
                  borderRadius="xl"
                  fontSize="md"
                  fontWeight="500"
                  transition="all 0.2s"
                  _placeholder={{ color: 'text.tertiary' }}
                  _hover={{ borderColor: 'border.secondary', bg: 'bg.surface.elevated' }}
                  _focus={{ 
                    borderColor: 'interactive.primary', 
                    boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                    bg: 'bg.surface.elevated'
                  }}
                />
                {errors['step2.customerDetails.phone'] && (
                  <FormErrorMessage>{errors['step2.customerDetails.phone']}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl>
                <FormLabel color="text.secondary" fontSize="sm">Company Name (Optional)</FormLabel>
                <Input
                  placeholder="Your Company Ltd"
                  value={formData.step2.customerDetails.company || ''}
                  onChange={(e) => updateCustomerDetails('company', e.target.value)}
                  bg="bg.surface"
                  border="1px solid"
                  borderColor="border.primary"
                  color="text.primary"
                  size="lg"
                  _hover={{ borderColor: 'border.secondary' }}
                  _focus={{ borderColor: 'interactive.primary', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="text.secondary" fontSize="sm">Special Instructions (Optional)</FormLabel>
                <Textarea
                  placeholder="Any special instructions or requests for your move..."
                  value={formData.step2.specialInstructions || ''}
                  onChange={(e) => updateFormData('step2', { specialInstructions: e.target.value })}
                  bg="bg.surface"
                  border="1px solid"
                  borderColor="border.primary"
                  color="text.primary"
                  rows={3}
                  _hover={{ borderColor: 'border.secondary' }}
                  _focus={{ borderColor: 'interactive.primary', boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)' }}
                />
              </FormControl>
            </VStack>
          </Box>
        </LuxurySurfaceCard>

        {/* CARD 3: Payment & Confirmation - Final Step */}
        <LuxurySurfaceCard tone="neutral" borderWidth="1px" borderRadius="2xl">
          <Box p={{ base: 6, md: 8 }}>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="600" color="text.primary">
                  Complete Your Booking
                </Text>
                <Badge 
                  bg="green.500" 
                  color="white" 
                  px={4} 
                  py={2} 
                  borderRadius="full"
                  fontSize="xl"
                  fontWeight="bold"
                >
                  {displayPriceText}
                </Badge>
              </HStack>

              <Box
                bg="linear-gradient(135deg, rgba(59,130,246,0.18), rgba(16,185,129,0.18))"
                border="1px solid"
                borderColor="rgba(59, 130, 246, 0.35)"
                borderRadius="xl"
                p={{ base: 3, sm: 4 }}
                w="full"
              >
                <Flex
                  direction={{ base: 'column', sm: 'row' }}
                  align={{ base: 'center', sm: 'center' }}
                  justify="space-between"
                  gap={{ base: 3, sm: 4 }}
                  textAlign={{ base: 'center', sm: 'left' }}
                >
                  <HStack
                    align={{ base: 'center', sm: 'flex-start' }}
                    spacing={3}
                    w="full"
                    justify={{ base: 'center', sm: 'flex-start' }}
                  >
                    <Box
                      bg="rgba(255,255,255,0.08)"
                      borderRadius="full"
                      p={3}
                      border="1px solid rgba(59,130,246,0.4)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon as={FaCreditCard} color="white" boxSize={5} />
                    </Box>
                    <VStack align={{ base: 'center', sm: 'flex-start' }} spacing={1}>
                      <Text color="white" fontWeight="bold" fontSize="md" whiteSpace="nowrap">
                        Book now, pay later
                      </Text>
                      <Text color="blue.100" fontSize="sm" lineHeight="1.4">
                        Klarna & Clearpay available at checkout when your booking qualifies.
                      </Text>
                    </VStack>
                  </HStack>
                  <Flex
                    gap={2}
                    flexWrap="wrap"
                    justify={{ base: 'center', sm: 'flex-end' }}
                    w="full"
                  >
                    <Badge
                      colorScheme="pink"
                      variant="solid"
                      borderRadius="full"
                      px={3}
                      py={1}
                      fontSize="sm"
                    >
                      Klarna
                    </Badge>
                    <Badge
                      colorScheme="teal"
                      variant="solid"
                      borderRadius="full"
                      px={3}
                      py={1}
                      fontSize="sm"
                    >
                      Clearpay
                    </Badge>
                  </Flex>
                </Flex>
                <Text mt={2} color="blue.100" fontSize="xs">
                  Availability may depend on booking value and service date; Stripe shows Klarna & Clearpay automatically when eligible.
                </Text>
              </Box>

            <Box
              bg="rgba(15, 23, 42, 0.55)"
              border="1px solid rgba(59, 130, 246, 0.25)"
              borderRadius="xl"
              p={{ base: 3, sm: 4 }}
              w="full"
            >
              <HStack justify="space-between" align="center" mb={3} gap={2}>
                <Text color="white" fontWeight="700" fontSize="sm">
                  Accepted payments
                </Text>
                <Text color="blue.100" fontSize="xs">
                  Optimized for mobile & desktop checkout
                </Text>
              </HStack>
              <Wrap spacing={2} rowGap={2}>
                {[
                  { label: 'Apple Pay', bg: 'black', color: 'white', icon: SiApplepay },
                  { label: 'Google Pay', bg: 'gray.800', color: 'white', icon: SiGooglepay },
                  { label: 'Clearpay', bg: 'teal.500', color: 'white', icon: SiAfterpay },
                  { label: 'Klarna', bg: 'pink.400', color: 'black', icon: SiKlarna },
                  { label: 'Visa', bg: 'blue.600', color: 'white', icon: SiVisa },
                  { label: 'Mastercard', bg: 'orange.500', color: 'white', icon: SiMastercard },
                ].map((method) => (
                  <WrapItem key={method.label}>
                    <Tag
                      size="lg"
                      borderRadius="full"
                      px={4}
                      py={2}
                      bg={method.bg}
                      color={method.color}
                      fontWeight="700"
                      boxShadow="0 8px 24px rgba(0,0,0,0.15)"
                      display="inline-flex"
                      alignItems="center"
                      gap={2}
                    >
                      {method.icon ? <Icon as={method.icon} boxSize={5} /> : null}
                      {method.label}
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>

              <Divider borderColor="rgba(59, 130, 246, 0.2)" />

              {addressIncomplete && (
                <Alert
                  status="warning"
                  variant="subtle"
                  bg="rgba(250, 204, 21, 0.08)"
                  border="1px solid"
                  borderColor="yellow.400"
                  borderRadius="lg"
                >
                  <AlertIcon />
                  <Box>
                    <AlertTitle color="yellow.100" fontSize="sm">
                      Address needed for pricing
                    </AlertTitle>
                    <AlertDescription color="yellow.50" fontSize="sm">
                      Please provide your full pickup and drop-off address with postcode. City or town alone will not generate a price.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Booking Summary */}
              {(() => {
                const segments = (formData.step1.segments || []) as BookingSegment[];
                const isMultiLeg = segments.length > 1;

                if (isMultiLeg) {
                  return (
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between" align="center">
                        <Text color="white" fontSize="md" fontWeight="700">
                          Journey Segments ({segments.length})
                        </Text>
                        <Badge colorScheme="purple" variant="subtle" borderRadius="full">
                          Multi-leg
                        </Badge>
                      </HStack>
                      {segments.map((segment, idx) => {
                        const getSegmentColor = (type: string) => {
                          if (type === 'outbound') return 'green';
                          if (type === 'return') return 'blue';
                          return 'purple';
                        };

                        return (
                          <Box
                            key={segment.id || idx}
                            p={4}
                            bg="linear-gradient(135deg, rgba(59,130,246,0.18), rgba(124,58,237,0.18))"
                            borderRadius="xl"
                            borderWidth="1px"
                            borderColor="rgba(255, 255, 255, 0.08)"
                            boxShadow="0 16px 40px rgba(15,23,42,0.35)"
                          >
                            <VStack spacing={2} align="stretch">
                              <HStack justify="space-between">
                                <Badge colorScheme={getSegmentColor(segment.segmentType)} fontSize="xs">
                                  {segment.segmentType.charAt(0).toUpperCase() + segment.segmentType.slice(1)} Journey
                                </Badge>
                              </HStack>
                              <HStack spacing={2} color="whiteAlpha.900" fontSize="xs">
                                <Icon as={FaMapMarkerAlt} />
                                <Text>
                                  {segment.pickupAddress?.postcode} → {segment.dropoffAddress?.postcode}
                                </Text>
                              </HStack>
                              <HStack justify="space-between" fontSize="xs" color="gray.300">
                                <Text>{segment.datetime ? new Date(segment.datetime).toLocaleString('en-GB') : 'Not scheduled'}</Text>
                              </HStack>
                              
                              {/* Items List for this segment */}
                              {segment.items && segment.items.length > 0 && (
                                <VStack spacing={1} align="stretch" mt={2}>
                                  <Text fontSize="xs" fontWeight="600" color="blue.300">
                                    Items for this journey:
                                  </Text>
                                  {segment.items.map((item, itemIdx) => {
                                    const catalogItem = ALL_REMOVAL_ITEMS.find(c => c.id === item.id);
                                    const itemName = catalogItem?.name || item.id;
                                    return (
                                      <HStack key={itemIdx} justify="space-between" fontSize="xs" color="whiteAlpha.800">
                                        <Text>
                                          {item.quantity}x {itemName}
                                        </Text>
                                      </HStack>
                                    );
                                  })}
                                  <Text fontSize="xs" color="gray.400" mt={1}>
                                    Total: {segment.items.reduce((sum, item) => sum + item.quantity, 0)} items
                                  </Text>
                                </VStack>
                              )}
                            </VStack>
                          </Box>
                        );
                      })}
                      <Divider borderColor="rgba(59, 130, 246, 0.2)" />
                      <HStack justify="space-between">
                        <Text color="gray.400" fontSize="sm">Selected date</Text>
                        <Text color="white" fontSize="sm" fontWeight="500">
                          {selectedPriceLabel}
                        </Text>
                      </HStack>
                    </VStack>
                  );
                }

                // Single journey view
                return (
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize="sm">Pickup</Text>
                      <Text color="white" fontSize="sm" fontWeight="500">
                        {formData.step1.pickupAddress?.city || 'Not set'}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize="sm">Dropoff</Text>
                      <Text color="white" fontSize="sm" fontWeight="500">
                        {formData.step1.dropoffAddress?.city || 'Not set'}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize="sm">Items</Text>
                      <Text color="white" fontSize="sm" fontWeight="500">
                        {formData.step1.items.length} items
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text color="gray.400" fontSize="sm">Selected date</Text>
                      <Text color="white" fontSize="sm" fontWeight="500">
                        {selectedPriceLabel}
                      </Text>
                    </HStack>
                  </VStack>
                );
              })()}
              

              <Divider borderColor="rgba(59, 130, 246, 0.2)" />

              {/* Promotion Code Section */}
              <VStack spacing={4} align="stretch">
                <Heading size="sm" color="white" fontWeight="600">
                  🎟️ Promotion Code
                </Heading>
                
                {formData.step2.promotionDetails ? (
                  // Show applied promotion
                  <Box
                    bg="rgba(16, 185, 129, 0.15)"
                    border="2px solid"
                    borderColor="rgba(16, 185, 129, 0.4)"
                    borderRadius="xl"
                    p={4}
                  >
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between" align="center">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold" color="white" fontSize="md">
                            {formData.step2.promotionDetails.name}
                          </Text>
                          {formData.step2.promotionDetails.description && (
                            <Text fontSize="sm" color="whiteAlpha.700">
                              {formData.step2.promotionDetails.description}
                            </Text>
                          )}
                        </VStack>
                        <Button
                          size="sm"
                          colorScheme="red"
                          variant="outline"
                          onClick={() => {
                            if (removePromotionCode) {
                              removePromotionCode();
                              toast({
                                title: 'Promotion Removed',
                                description: 'Promotion code has been removed',
                                status: 'info',
                                duration: 3000,
                              });
                            }
                          }}
                        >
                          Remove
                        </Button>
                      </HStack>
                      
                      <Divider borderColor="rgba(255, 255, 255, 0.1)" />
                      
                      <HStack justify="space-between" align="center">
                        <Text fontSize="sm" color="whiteAlpha.700">
                          Discount:
                        </Text>
                        <Text fontWeight="bold" color="green.400" fontSize="lg">
                          -£{formData.step2.promotionDetails.discountAmount?.toFixed(2) || '0.00'}
                        </Text>
                      </HStack>
                      
                      <HStack justify="space-between" align="center">
                        <Text fontSize="sm" color="whiteAlpha.600" textDecoration="line-through">
                          Original: £{formData.step2.promotionDetails.originalAmount?.toFixed(2) || actualPrice.toFixed(2)}
                        </Text>
                        <Text fontWeight="bold" color="green.400" fontSize="xl">
                          Final: £{formData.step2.promotionDetails.finalAmount?.toFixed(2) || actualPrice.toFixed(2)}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                ) : (
                  // Show promotion code input
                  <VStack spacing={3} align="stretch">
                    <VStack spacing={3} w="full">
                      <Input
                        placeholder="Enter code (e.g., SUMMER10)"
                        value={promotionCode}
                        onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                        bg="rgba(0, 0, 0, 0.3)"
                        border="1px solid"
                        borderColor="rgba(251, 146, 60, 0.3)"
                        color="white"
                        size="lg"
                        h={{ base: '48px', sm: '44px' }}
                        _hover={{ borderColor: 'rgba(251, 146, 60, 0.5)' }}
                        _focus={{ borderColor: 'orange.500', boxShadow: '0 0 0 1px rgba(251, 146, 60, 0.3)' }}
                        textTransform="uppercase"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && promotionCode.trim()) {
                            handleApplyPromotionCode();
                          }
                        }}
                        w="full"
                      />
                      <Button
                        bg="linear-gradient(135deg, #FB923C 0%, #EA580C 100%)"
                        color="white"
                        onClick={handleApplyPromotionCode}
                        isLoading={isValidatingPromotion}
                        loadingText="Applying..."
                        disabled={!promotionCode.trim() || isValidatingPromotion}
                        size="lg"
                        h={{ base: '48px', sm: '44px' }}
                        px={{ base: 4, sm: 6 }}
                        fontWeight="bold"
                        w="full"
                        _hover={{
                          bg: 'linear-gradient(135deg, #EA580C 0%, #DC2626 100%)',
                          transform: 'translateY(-1px)',
                        }}
                        _disabled={{
                          opacity: 0.5,
                          cursor: 'not-allowed',
                        }}
                      >
                        Apply
                      </Button>
                    </VStack>
                  </VStack>
                )}
              </VStack>

              <Divider borderColor="rgba(59, 130, 246, 0.2)" />

              {/* Terms & Conditions - Enhanced Design */}
              <VStack 
                spacing={4} 
                align="start"
                p={4}
                bg="linear-gradient(135deg, rgba(59,130,246,0.08), rgba(147,51,234,0.08))"
                borderRadius="xl"
                border="1px solid"
                borderColor="rgba(59,130,246,0.2)"
              >
                <HStack spacing={2} mb={1}>
                  <Box
                    w="32px"
                    h="32px"
                    borderRadius="lg"
                    bg="linear-gradient(135deg, rgba(59,130,246,0.3), rgba(147,51,234,0.3))"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="16px"
                  >
                    📋
                  </Box>
                  <Text fontSize="md" fontWeight="700" color="white">
                    Legal Requirements
                  </Text>
                </HStack>
                
                <VStack spacing={3} align="start" w="full">
                  <Box
                    w="full"
                    p={3}
                    borderRadius="lg"
                    bg="rgba(0,0,0,0.2)"
                    border="1px solid"
                    borderColor={acceptedTerms ? "green.400" : "rgba(255,255,255,0.1)"}
                    transition="all 0.3s"
                  >
                    <Checkbox
                      isChecked={acceptedTerms}
                      onChange={(e) => {
                        const isMobile = window.innerWidth < 768;
                        const scrollY = isMobile ? window.scrollY : undefined;
                        setAcceptedTerms(e.target.checked);
                        if (isMobile && scrollY !== undefined) {
                          requestAnimationFrame(() => {
                            window.scrollTo(0, scrollY);
                          });
                        }
                      }}
                      colorScheme="blue"
                      color="white"
                      fontSize="sm"
                      fontWeight="500"
                      size="lg"
                    >
                      I accept the{' '}
                      <Text 
                        as="span" 
                        color="blue.400" 
                        textDecoration="underline" 
                        cursor="pointer"
                        fontWeight="700"
                        _hover={{ color: 'blue.300' }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open('/terms', '_blank');
                        }}
                      >
                        Terms and Conditions
                      </Text>
                    </Checkbox>
                  </Box>

                  <Box
                    w="full"
                    p={3}
                    borderRadius="lg"
                    bg="rgba(0,0,0,0.2)"
                    border="1px solid"
                    borderColor={acceptedPrivacy ? "green.400" : "rgba(255,255,255,0.1)"}
                    transition="all 0.3s"
                  >
                    <Checkbox
                      isChecked={acceptedPrivacy}
                      onChange={(e) => {
                        const isMobile = window.innerWidth < 768;
                        const scrollY = isMobile ? window.scrollY : undefined;
                        setAcceptedPrivacy(e.target.checked);
                        if (isMobile && scrollY !== undefined) {
                          requestAnimationFrame(() => {
                            window.scrollTo(0, scrollY);
                          });
                        }
                      }}
                      colorScheme="blue"
                      color="white"
                      fontSize="sm"
                      fontWeight="500"
                      size="lg"
                    >
                      I have read the{' '}
                      <Text 
                        as="span" 
                        color="blue.400" 
                        textDecoration="underline" 
                        cursor="pointer"
                        fontWeight="700"
                        _hover={{ color: 'blue.300' }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open('/privacy', '_blank');
                        }}
                      >
                        Privacy Policy
                      </Text>
                    </Checkbox>
                  </Box>
                </VStack>
              </VStack>

              {/* Stripe Payment Button - Use actual component */}
              <StripePaymentButton
                bookingData={{
                  customer: {
                    name: `${formData.step2.customerDetails.firstName} ${formData.step2.customerDetails.lastName}`,
                    email: formData.step2.customerDetails.email,
                    phone: formData.step2.customerDetails.phone,
                  },
                  bookingDraftId: formData.step2.bookingDraftId || undefined,
                  pickupAddress: formData.step1.pickupAddress as Record<string, unknown>,
                  dropoffAddress: formData.step1.dropoffAddress as Record<string, unknown>,
                  // ✅ CRITICAL FIX: For multi-leg, use items from segments (selectedItems already handles this)
                  items: selectedItems.length > 0 ? selectedItems : (
                    // Fallback: try to get items from segments first, then from formData
                    segments.length > 0 && segments[0]?.items?.length > 0 
                      ? segments[0].items 
                      : (formData.step1.items || [])
                  ),
                  pricing: {
                    ...(formData.step1.pricing as Record<string, unknown>),
                    total: formData.step2.promotionDetails?.finalAmount || actualPrice, // Use promotion final amount if applied
                  } as Record<string, unknown>,
                  promotionCode: formData.step2.promotionCode,
                  promotionDetails: formData.step2.promotionDetails,
                  serviceType,
                  // Crew size (number of helpers)
                  crewSize: formData.step1.crewSize || '2',
                  // Pass tier prices for correct calculation in StripePaymentButton
                  economyPrice: actualPrice,
                  standardPrice: actualPrice,
                  priorityPrice: actualPrice,
                  scheduledDate: formData.step1.pickupDate || new Date().toISOString().split('T')[0],
                  scheduledTime: formData.step1.pickupTimeSlot,
                  pickupDetails: formData.step1.pickupProperty as Record<string, unknown>,
                  dropoffDetails: formData.step1.dropoffProperty as Record<string, unknown>,
                  notes: formData.step2.specialInstructions,
                  // ✅ CRITICAL FIX: Always pass segments for multi-leg bookings
                  segments: segments.length > 1 ? segments : undefined,
                  bookingReference: formData.step2.bookingReference || undefined,
                  // Collection Source & Marketplace Pickup Details
                  collectionSource: formData.step1.collectionSource || 'private-address',
                  marketplacePickup: formData.step1.marketplacePickup || null,
                }}
                amount={priceReady ? (formData.step2.promotionDetails?.finalAmount || actualPrice) : 0}
                disabled={
                  addressIncomplete ||
                  !priceReady ||
                  !formData.step2.customerDetails.firstName ||
                  !formData.step2.customerDetails.lastName ||
                  !formData.step2.customerDetails.email ||
                  !formData.step2.customerDetails.phone ||
                  !acceptedTerms ||
                  !acceptedPrivacy
                }
                onBookingCreated={handleBookingCreated}
                onSuccess={(sessionId) => {
                  console.log('✅ Payment successful:', sessionId);
                  window.location.href = `/booking-luxury/success?session_id=${sessionId}`;
                }}
                onError={(error) => {
                  console.error('❌ Payment error:', error);
                  toast({
                    title: 'Payment Failed',
                    description: error,
                    status: 'error',
                    duration: 5000,
                  });
                }}
              />

              {/* Security Badge */}
              <HStack justify="center" spacing={2} color="gray.400" fontSize="xs">
                <Icon as={FaCreditCard} />
                <Text>Secure payment processed by Stripe</Text>
              </HStack>
            </VStack>
          </Box>
        </LuxurySurfaceCard>
      </VStack>
    </Box>
  );
}

