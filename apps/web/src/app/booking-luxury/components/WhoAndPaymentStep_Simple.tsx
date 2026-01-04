'use client';

/**
 * Step 3: Customer Details & Payment - Simplified Version
 * Updated: 2025-11-20 - Enhanced toggle button UX
 * Clean, modern design like Uber/Airbnb
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import {
  Box,
  VStack,
  HStack,
  Flex,
  Grid,
  Text,
  Input,
  Textarea,
  Checkbox,
  Card,
  CardBody,
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
  Collapse,
  useDisclosure,
  Heading,
  Button,
  Wrap,
  WrapItem,
  Tag,
} from '@chakra-ui/react';
import {
  FaCreditCard,
  FaShoppingBag,
  FaChevronUp,
  FaTimes,
  FaMapMarkerAlt,
  FaPlus,
  FaMinus,
  FaTrash,
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
import SelectedItemsManager from './SelectedItemsManager';

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
  validatePromotionCode?: (code: string) => Promise<{ success: boolean; error?: string; promotion?: any }>;
  applyPromotionCode?: (code: string) => Promise<{ success: boolean; error?: string; promotion?: any }>;
  removePromotionCode?: () => void;
  getTotalSegmentsPrice?: () => number;
  capacityCheck?: any;
  routeSummary?: any;
  onBookingCreated?: (payload: { bookingId: string; reference: string }) => void;
}

export default function WhoAndPaymentStepSimple({
  formData,
  updateFormData,
  errors,
  capacityCheck,
  routeSummary,
  onBookingCreated,
  economyPrice = 0,
  standardPrice = 0,
  priorityPrice = 0,
  calculatePricing,
  calculateComprehensivePricing,
  getTotalSegmentsPrice,
  validatePromotionCode,
  applyPromotionCode,
  removePromotionCode,
}: WhoAndPaymentStepProps) {
  const [selectedDayKey, setSelectedDayKey] = useState<string | undefined>(undefined);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [promotionCode, setPromotionCode] = useState('');
  const [isValidatingPromotion, setIsValidatingPromotion] = useState(false);
  const { isOpen: isSummaryExpanded, onToggle: toggleSummary } = useDisclosure({ defaultIsOpen: false });
  const toast = useToast();
  const isIOSDevice = useIsIOSDevice();

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
      
      if (result.success && result.promotion) {
        setPromotionCode('');
        toast({
          title: 'Promotion Applied! 🎉',
          description: `${result.promotion.name} - You saved £${result.promotion.discountAmount?.toFixed(2) || '0.00'}!`,
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
  const bookingReference = formData.step2.bookingReference;

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
      (formData.step1.items || []).map((item: any) => ({ id: item.id, quantity: item.quantity }))
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

  const segments = (formData.step1.segments || []) as BookingSegment[];

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
    if (!target) return;
    // Avoid unnecessary updates if already selected
    if (selectedDayKey === target.key) return;
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

  const selectCheapest = () => handleSelectDay(cheapestIndex);
  const selectEarliest = () => handleSelectDay(0);

  // Show a concise window (up to 10 days) while keeping the selected day visible
  const visiblePriceCalendar = useMemo(() => {
    if (!priceCalendar.length) return [];
    const maxDays = Math.min(priceCalendar.length, 21);
    const base = priceCalendar.slice(0, maxDays);
    if (selectedDayKey) {
      const sel = priceCalendar.find((p) => p.key === selectedDayKey);
      if (sel && !base.find((p) => p.iso === sel.iso)) {
        return [sel, ...base].slice(0, maxDays);
      }
    }
    return base;
  }, [priceCalendar, selectedDayKey]);

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
      const itemsMap = new Map<string, any>();
      
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

  const selectionStats = useMemo(() => {
    if (!selectedItems.length) {
      return { totalItems: 0, totalWeight: 0 };
    }

    let totalItems = 0;
    let totalWeight = 0;

    selectedItems.forEach((item) => {
      totalItems += item.quantity;
      totalWeight += item.quantity * item.weight;
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
        const updatedSegments = segments.map((segment) => {
          return {
            ...segment,
            // Each segment gets the full items list (not divided) with deep copy
            items: sanitizedItems.map(item => ({ ...item }))
          };
        });

        updateFormData('step1', { 
          segments: updatedSegments,
          // Also update global items for consistency
          items: sanitizedItems.map((item) => ({ ...item }))
        });
      } else {
        // Single-leg: update global items
        updateFormData('step1', {
          items: sanitizedItems.map((item) => ({ ...item })),
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

  const incrementItem = useCallback(
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
    [formData.step1.items, formData.step1.segments, applyItemUpdates, updateFormData, calculatePricing, calculateComprehensivePricing]
  );

  const decrementItem = useCallback(
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
    [formData.step1.items, formData.step1.segments, applyItemUpdates, updateFormData, calculatePricing, calculateComprehensivePricing]
  );

  const removeItem = useCallback(
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
    [formData.step1.items, formData.step1.segments, applyItemUpdates, updateFormData, calculatePricing, calculateComprehensivePricing]
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
  
  return (
    <Box w="full">
      <VStack spacing={6} align="stretch">
        {/* Selected Items Summary - Handled by parent with unified floating buttons */}

        {/* CARD 1: Date-based pricing list - Enhanced Design */}
        <Card
          bg="rgba(17, 24, 39, 0.95)"
          border="1px solid"
          borderColor="rgba(59, 130, 246, 0.3)"
          borderRadius="2xl"
          backdropFilter="blur(20px)"
          overflow="hidden"
          position="relative"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            bgGradient: 'linear(to-r, blue.400, cyan.400, green.400)',
          }}
        >
          <CardBody p={{ base: 5, md: 8 }}>
            <VStack spacing={6} align="stretch">
              {/* Header Section */}
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
                  <VStack align="start" spacing={1}>
                    <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="700" color="white">
                      📅 Choose Your Moving Date
                    </Text>
                    <Text fontSize="sm" color="gray.400">
                      Select the best date for your budget
                    </Text>
                  </VStack>
                  <HStack spacing={2} flexWrap="wrap">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={selectEarliest}
                      borderColor="gray.600"
                      color="gray.300"
                      _hover={{ bg: 'gray.700', borderColor: 'gray.500' }}
                    >
                      ⏰ Earliest
                    </Button>
                    <Button 
                      size="sm" 
                      bg="green.500"
                      color="white"
                      onClick={selectCheapest}
                      _hover={{ bg: 'green.400' }}
                      leftIcon={<Text>💰</Text>}
                    >
                      Best Price
                    </Button>
                  </HStack>
                </HStack>

                {/* Price Legend - Simplified */}
                <HStack 
                  spacing={4} 
                  flexWrap="wrap" 
                  p={3} 
                  bg="rgba(0,0,0,0.3)" 
                  borderRadius="lg"
                >
                  <HStack spacing={2}>
                    <Box w="14px" h="14px" borderRadius="full" bg="green.400" boxShadow="0 0 10px rgba(16,185,129,0.5)" />
                    <Text fontSize="xs" color="green.300" fontWeight="600">Best Value</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Box w="14px" h="14px" borderRadius="full" bg="orange.400" boxShadow="0 0 10px rgba(251,146,60,0.5)" />
                    <Text fontSize="xs" color="orange.300" fontWeight="600">Standard</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Box w="14px" h="14px" borderRadius="full" bg="red.400" boxShadow="0 0 10px rgba(248,113,113,0.5)" />
                    <Text fontSize="xs" color="red.300" fontWeight="600">Peak Time</Text>
                  </HStack>
                </HStack>
              </VStack>

              {/* Price Grid - Calendar/Table layout for mobile-first clarity */}
              <Grid
                templateColumns={{
                  base: 'repeat(auto-fit, minmax(140px, 1fr))',
                  sm: 'repeat(auto-fit, minmax(150px, 1fr))',
                  md: 'repeat(auto-fit, minmax(170px, 1fr))',
                }}
                gap={{ base: 3, md: 4 }}
                w="full"
              >
                {visiblePriceCalendar.map((option) => {
                  const level = getPriceLevel(option.price);
                  const cardIndex = priceCalendar.findIndex((p) => p.iso === option.iso);
                  const isSelected = selectedDayKey
                    ? option.key === selectedDayKey
                    : cardIndex === 0;
                  const isCheapest = cardIndex === cheapestIndex;

                  const colorScheme = {
                    cheap: {
                      bg: 'linear-gradient(180deg, rgba(16,185,129,0.18), rgba(16,185,129,0.08))',
                      border: isSelected ? 'green.400' : 'rgba(16,185,129,0.35)',
                      glow: '0 0 16px rgba(16,185,129,0.35)',
                      textColor: 'green.300',
                    },
                    mid: {
                      bg: 'linear-gradient(180deg, rgba(251,146,60,0.18), rgba(251,146,60,0.08))',
                      border: isSelected ? 'orange.400' : 'rgba(251,146,60,0.35)',
                      glow: '0 0 16px rgba(251,146,60,0.35)',
                      textColor: 'orange.300',
                    },
                    expensive: {
                      bg: 'linear-gradient(180deg, rgba(248,113,113,0.18), rgba(248,113,113,0.08))',
                      border: isSelected ? 'red.400' : 'rgba(248,113,113,0.35)',
                      glow: '0 0 16px rgba(248,113,113,0.35)',
                      textColor: 'red.300',
                    },
                  };

                  const scheme = colorScheme[level];

                  return (
                    <Box
                      as="button"
                      type="button"
                      key={option.iso}
                      w="100%"
                      textAlign="left"
                      p={{ base: 4, md: 5 }}
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor={scheme.border}
                      bg={scheme.bg}
                      boxShadow={isSelected ? scheme.glow : '0 6px 18px rgba(0,0,0,0.35)'}
                      transition="all 0.2s ease"
                      onClick={() => handleSelectDay(cardIndex)}
                      position="relative"
                      minH="140px"
                      _focusVisible={{ outline: '2px solid #3b82f6', outlineOffset: '2px' }}
                      _active={{ transform: 'translateY(1px)' }}
                    >
                      {isCheapest && (
                        <Badge
                          position="absolute"
                          top="10px"
                          right="10px"
                          colorScheme="green"
                          borderRadius="full"
                          px={3}
                          py={1}
                          fontSize="xs"
                          fontWeight="800"
                        >
                          Best
                        </Badge>
                      )}

                      {isSelected && (
                        <Box
                          position="absolute"
                          top="10px"
                          left="10px"
                          w="24px"
                          h="24px"
                          borderRadius="full"
                          bg="blue.500"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 0 0 6px rgba(59,130,246,0.25)"
                        >
                          <Text fontSize="sm">✓</Text>
                        </Box>
                      )}

                      <VStack align="stretch" spacing={2}>
                        <VStack align="stretch" spacing={0}>
                          <Text color="white" fontWeight="800" fontSize={{ base: 'md', md: 'lg' }} noOfLines={2}>
                            {option.label}
                          </Text>
                          <Text color="gray.400" fontSize="xs" fontWeight="600">
                            {option.weekday}
                          </Text>
                        </VStack>

                        <Box pt={1}>
                          <Text 
                            fontSize={{ base: '2xl', md: '28px' }} 
                            fontWeight="900" 
                            color="white"
                            lineHeight="1.1"
                          >
                            £{option.price.toFixed(2)}
                          </Text>
                          <Text fontSize="xs" color={scheme.textColor} fontWeight="700">
                            {level === 'cheap' ? 'Best value' : level === 'expensive' ? 'Peak' : 'Standard'}
                          </Text>
                        </Box>
                      </VStack>
                    </Box>
                  );
                })}
              </Grid>
              
              {/* Selection Confirmation */}
              {selectedPriceOption && (
                <Box 
                  p={4} 
                  bg="rgba(59, 130, 246, 0.15)" 
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="rgba(59, 130, 246, 0.3)"
                >
                  <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
                    <HStack spacing={3}>
                      <Box 
                        w="40px" 
                        h="40px" 
                        borderRadius="full" 
                        bg="blue.500" 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center"
                      >
                        <Text fontSize="lg">📅</Text>
                      </Box>
                      <VStack align="start" spacing={0}>
                        <Text color="gray.400" fontSize="xs">Your selected date</Text>
                        <Text color="white" fontWeight="700" fontSize="md">
                          {selectedPriceOption.label} ({selectedPriceOption.weekday})
                        </Text>
                      </VStack>
                    </HStack>
                    <VStack align="end" spacing={0}>
                      <Text color="gray.400" fontSize="xs">Total Price</Text>
                      <Text color="green.400" fontWeight="800" fontSize="xl">
                        £{selectedPriceOption.price.toFixed(2)}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* CARD 2: Customer Information - Single Clean Card */}
        <Card
          bg="rgba(26, 26, 26, 0.6)"
          border="1px solid"
          borderColor="rgba(59, 130, 246, 0.2)"
          borderRadius="2xl"
          backdropFilter="blur(10px)"
        >
          <CardBody p={{ base: 6, md: 8 }}>
            <VStack spacing={6} align="stretch">
              <Text fontSize="lg" fontWeight="600" color="white">
                Your Information
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl isInvalid={!!errors['step2.customerDetails.firstName']}>
                  <FormLabel color="white" fontSize="sm">First Name</FormLabel>
                  <Input
                    placeholder="John"
                    value={formData.step2.customerDetails.firstName || ''}
                    onChange={(e) => updateCustomerDetails('firstName', e.target.value)}
                    bg="rgba(0, 0, 0, 0.3)"
                    border="1px solid"
                    borderColor="rgba(59, 130, 246, 0.3)"
                    color="white"
                    size="lg"
                    _hover={{ borderColor: 'rgba(59, 130, 246, 0.5)' }}
                    _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3)' }}
                  />
                  {errors['step2.customerDetails.firstName'] && (
                    <FormErrorMessage>{errors['step2.customerDetails.firstName']}</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors['step2.customerDetails.lastName']}>
                  <FormLabel color="white" fontSize="sm">Last Name</FormLabel>
                  <Input
                    placeholder="Doe"
                    value={formData.step2.customerDetails.lastName || ''}
                    onChange={(e) => updateCustomerDetails('lastName', e.target.value)}
                    bg="rgba(0, 0, 0, 0.3)"
                    border="1px solid"
                    borderColor="rgba(59, 130, 246, 0.3)"
                    color="white"
                    size="lg"
                    _hover={{ borderColor: 'rgba(59, 130, 246, 0.5)' }}
                    _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3)' }}
                  />
                  {errors['step2.customerDetails.lastName'] && (
                    <FormErrorMessage>{errors['step2.customerDetails.lastName']}</FormErrorMessage>
                  )}
                </FormControl>
              </SimpleGrid>

              <FormControl isInvalid={!!errors['step2.customerDetails.email']}>
                <FormLabel color="white" fontSize="sm">Email Address</FormLabel>
                <Input
                  type="email"
                  placeholder="john.doe@example.com"
                  value={formData.step2.customerDetails.email || ''}
                  onChange={(e) => updateCustomerDetails('email', e.target.value)}
                  bg="rgba(0, 0, 0, 0.3)"
                  border="1px solid"
                  borderColor="rgba(59, 130, 246, 0.3)"
                  color="white"
                  size="lg"
                  _hover={{ borderColor: 'rgba(59, 130, 246, 0.5)' }}
                  _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3)' }}
                />
                {errors['step2.customerDetails.email'] && (
                  <FormErrorMessage>{errors['step2.customerDetails.email']}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl isInvalid={!!errors['step2.customerDetails.phone']}>
                <FormLabel color="white" fontSize="sm">Phone Number</FormLabel>
                <Input
                  type="tel"
                  placeholder="+44 1234 567890"
                  value={formData.step2.customerDetails.phone || ''}
                  onChange={(e) => updateCustomerDetails('phone', e.target.value)}
                  bg="rgba(0, 0, 0, 0.3)"
                  border="1px solid"
                  borderColor="rgba(59, 130, 246, 0.3)"
                  color="white"
                  size="lg"
                  _hover={{ borderColor: 'rgba(59, 130, 246, 0.5)' }}
                  _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3)' }}
                />
                {errors['step2.customerDetails.phone'] && (
                  <FormErrorMessage>{errors['step2.customerDetails.phone']}</FormErrorMessage>
                )}
              </FormControl>

              <FormControl>
                <FormLabel color="white" fontSize="sm">Company Name (Optional)</FormLabel>
                <Input
                  placeholder="Your Company Ltd"
                  value={formData.step2.customerDetails.company || ''}
                  onChange={(e) => updateCustomerDetails('company', e.target.value)}
                  bg="rgba(0, 0, 0, 0.3)"
                  border="1px solid"
                  borderColor="rgba(59, 130, 246, 0.3)"
                  color="white"
                  size="lg"
                  _hover={{ borderColor: 'rgba(59, 130, 246, 0.5)' }}
                  _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3)' }}
                />
              </FormControl>

              <FormControl>
                <FormLabel color="white" fontSize="sm">Special Instructions (Optional)</FormLabel>
                <Textarea
                  placeholder="Any special instructions or requests for your move..."
                  value={formData.step2.specialInstructions || ''}
                  onChange={(e) => updateFormData('step2', { specialInstructions: e.target.value })}
                  bg="rgba(0, 0, 0, 0.3)"
                  border="1px solid"
                  borderColor="rgba(59, 130, 246, 0.3)"
                  color="white"
                  rows={3}
                  _hover={{ borderColor: 'rgba(59, 130, 246, 0.5)' }}
                  _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.3)' }}
                />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* CARD 3: Payment & Confirmation - Final Step */}
        <Card
          bg="rgba(26, 26, 26, 0.6)"
          border="1px solid"
          borderColor="rgba(59, 130, 246, 0.2)"
          borderRadius="2xl"
          backdropFilter="blur(10px)"
        >
          <CardBody p={{ base: 6, md: 8 }}>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between" align="center">
                <Text fontSize="lg" fontWeight="600" color="white">
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

              {bookingReference ? (
                <Alert
                  status="info"
                  variant="subtle"
                  bg="rgba(59, 130, 246, 0.12)"
                  border="1px solid"
                  borderColor="blue.400"
                  borderRadius="lg"
                >
                  <AlertIcon />
                  <Box>
                    <AlertTitle color="white" fontSize="sm">
                      Booking reference (pending payment)
                    </AlertTitle>
                    <AlertDescription color="whiteAlpha.900" fontSize="sm">
                      {bookingReference} — share this with admin to view or modify before payment.
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : null}

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

              {capacityCheck && (
                <Alert
                  status={(capacityCheck.vansRequired || 1) > 1 ? "error" : "warning"}
                  variant="subtle"
                  bg={(capacityCheck.vansRequired || 1) > 1 ? "rgba(239, 68, 68, 0.12)" : "rgba(251, 191, 36, 0.12)"}
                  border="1px solid"
                  borderColor={(capacityCheck.vansRequired || 1) > 1 ? "red.400" : "yellow.400"}
                  borderRadius="lg"
                >
                  <AlertIcon />
                  <Box>
                    <AlertTitle color="white" fontSize="sm">
                      Capacity check {(routeSummary?.stops?.length || 0) > 1 ? `(multi-drop: ${(routeSummary?.stops?.length || 1) - 1} drop${(routeSummary?.stops?.length || 1) - 1 === 1 ? '' : 's'})` : ''}
                    </AlertTitle>
                    <AlertDescription color="whiteAlpha.900" fontSize="sm">
                      <Text>
                        Weight {capacityCheck.weightUtilization?.toFixed?.(0) ?? capacityCheck.weightUtilization ?? 0}% · Volume {capacityCheck.volumeUtilization?.toFixed?.(0) ?? capacityCheck.volumeUtilization ?? 0}% · Items {capacityCheck.itemUtilization?.toFixed?.(0) ?? capacityCheck.itemUtilization ?? 0}%
                      </Text>
                      {capacityCheck.vansRequired ? (
                        <Text mt={1} fontWeight="bold" color={(capacityCheck.vansRequired || 1) > 1 ? "red.200" : "yellow.100"}>
                          Requires {capacityCheck.vansRequired} van{capacityCheck.vansRequired === 1 ? '' : 's'}
                        </Text>
                      ) : null}
                      {capacityCheck.warnings && capacityCheck.warnings.length > 0 && (
                        <Text mt={1} color="yellow.100">
                          {capacityCheck.warnings.slice(0, 2).join(' • ')}
                          {capacityCheck.warnings.length > 2 ? ' …' : ''}
                        </Text>
                      )}
                      {capacityCheck.recommendations && capacityCheck.recommendations.length > 0 && (
                        <Text mt={1} color="blue.100">
                          {capacityCheck.recommendations.slice(0, 2).join(' • ')}
                          {capacityCheck.recommendations.length > 2 ? ' …' : ''}
                        </Text>
                      )}
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

              {/* Terms & Conditions */}
              <VStack spacing={3} align="start">
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
                  color="gray.300"
                  fontSize="sm"
                >
                  I accept the{' '}
                  <Text 
                    as="span" 
                    color="blue.400" 
                    textDecoration="underline" 
                    cursor="pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open('/terms', '_blank');
                    }}
                  >
                    Terms and Conditions
                  </Text>
                </Checkbox>

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
                  color="gray.300"
                  fontSize="sm"
                >
                  I have read the{' '}
                  <Text 
                    as="span" 
                    color="blue.400" 
                    textDecoration="underline" 
                    cursor="pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open('/privacy', '_blank');
                    }}
                  >
                    Privacy Policy
                  </Text>
                </Checkbox>
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
                  pickupAddress: formData.step1.pickupAddress as any,
                  dropoffAddress: formData.step1.dropoffAddress as any,
                  // ✅ CRITICAL FIX: For multi-leg, use items from segments (selectedItems already handles this)
                  items: selectedItems.length > 0 ? selectedItems : (
                    // Fallback: try to get items from segments first, then from formData
                    segments.length > 0 && segments[0]?.items?.length > 0 
                      ? segments[0].items 
                      : (formData.step1.items || [])
                  ),
                  pricing: {
                    ...(formData.step1.pricing as any),
                    total: formData.step2.promotionDetails?.finalAmount || actualPrice, // Use promotion final amount if applied
                  } as any,
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
                  pickupDetails: formData.step1.pickupProperty as any,
                  dropoffDetails: formData.step1.dropoffProperty as any,
                  notes: formData.step2.specialInstructions,
                  // ✅ CRITICAL FIX: Always pass segments for multi-leg bookings
                  segments: segments.length > 1 ? segments : undefined,
                  bookingReference: formData.step2.bookingReference || undefined,
                }}
                amount={priceReady ? (formData.step2.promotionDetails?.finalAmount || actualPrice) : 0}
                disabled={
                  addressIncomplete ||
                  !priceReady ||
                  !formData.step2.customerDetails.firstName ||
                  !formData.step2.customerDetails.lastName ||
                  !formData.step2.customerDetails.email ||
                  !formData.step2.customerDetails.phone
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
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}

