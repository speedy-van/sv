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
  Text,
  Input,
  Textarea,
  Checkbox,
  Card,
  CardBody,
  Divider,
  Badge,
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
import type { BookingSegment } from '../types/segment';
import { FormData, CustomerDetails } from '../hooks/useBookingForm';
import StripePaymentButton from './StripePaymentButton';
import { useIsIOSDevice } from '@/hooks/useIsIOSDevice';
import { SelectableCard } from '@/components/shared/SelectableCard';
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
}

export default function WhoAndPaymentStepSimple({
  formData,
  updateFormData,
  errors,
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
  const [selectedService, setSelectedService] = useState<'economy' | 'standard' | 'express'>('standard');
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
          serviceType: selectedService,
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

  // ✅ CRITICAL FIX: For multi-leg, ALWAYS calculate economy/express from standardBase
  // The props from parent contain BASE price (same for all tiers in multi-leg)
  // We must apply multipliers here to get correct tiered pricing
  let safeEconomyPrice: number;
  if (hasMultiLegPrice || isMultiLegWithoutPricing) {
    // Multi-leg: always calculate from standardBase
    safeEconomyPrice = parseFloat((standardBase * 0.85).toFixed(2));
  } else {
    // Single-leg: use props (which already have multipliers from pricingTiers)
    const fromProps = sanitizePrice(economyPrice);
    safeEconomyPrice = fromProps !== undefined ? fromProps : parseFloat((standardBase * 0.85).toFixed(2));
  }

  let safeExpressPrice: number;
  if (hasMultiLegPrice || isMultiLegWithoutPricing) {
    // Multi-leg: always calculate from standardBase
    safeExpressPrice = parseFloat((standardBase * 1.5).toFixed(2));
  } else {
    // Single-leg: use props (which already have multipliers from pricingTiers)
    const fromProps = sanitizePrice(priorityPrice);
    safeExpressPrice = fromProps !== undefined ? fromProps : parseFloat((standardBase * 1.5).toFixed(2));
  }

  const isMultiLeg = segments.length > 1;

  // Calculate base price based on selected service
  // ✅ FIXED: For multi-leg, use segmentTotal as base and apply multipliers ONCE
  // The props (economyPrice, priorityPrice) already have multipliers applied for single-leg
  // But for multi-leg, we need to apply them to segmentTotal (which is sum of standard prices)
  const selectedBase = selectedService === 'economy'
    ? safeEconomyPrice
    : selectedService === 'express'
    ? safeExpressPrice
    : standardBase;

  // ✅ CRITICAL FIX: Use selectedBase which already has correct multipliers applied
  // - For single-leg: selectedBase comes from props (economy/standard/express price from pricingTiers)
  // - For multi-leg: selectedBase = segmentTotal when standard, or props for economy/express
  // DO NOT apply multipliers again - they're already in the props!
  const actualPrice = hasMultiLegPrice 
    ? (selectedService === 'economy'
        ? segmentTotal * 0.85  // Apply 15% discount to segment total
        : selectedService === 'express'
        ? segmentTotal * 1.5   // Apply 50% premium to segment total  
        : segmentTotal)         // Standard: segment total as-is
    : selectedBase;  // Single-leg: use props which already have multipliers

  // Debug logging only in development mode to reduce console noise
  if (process.env.NODE_ENV === 'development') {
    console.log('💰 Step 3 Pricing Sanity Check:', {
      economyFromProps: economyPrice,
      standardFromProps: standardPrice,
      expressFromProps: priorityPrice,
      safeEconomyPrice,
      safeStandardPrice,
      safeExpressPrice,
      selectedService,
      isMultiLeg,
      isMultiLegWithoutPricing,
      hasMultiLegPrice,
      segmentCount: segments.length,
      segmentTotal,
      standardBase,
      totalSegmentsPrice: hasMultiLegPrice ? segmentTotal : 'N/A (using standardBase fallback)',
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
  
  // Handle service selection change - just update selected service (no price recalculation)
  const handleServiceChange = useCallback((serviceId: 'economy' | 'standard' | 'express') => {
    // Save scroll position before update (mobile only)
    const isMobile = window.innerWidth < 768;
    const scrollY = isMobile ? window.scrollY : undefined;
    
    setSelectedService(serviceId);
    
    // Get price for selected service (from Step 2 calculation)
    const newTotal = serviceId === 'economy'
      ? safeEconomyPrice
      : serviceId === 'express'
      ? safeExpressPrice
      : standardBase;
    
    // Debug logging only in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Service changed to ${serviceId} - price: £${newTotal.toFixed(2)} (from Step 2)`);
    }
    
    // Restore scroll position after update (mobile only)
    if (isMobile && scrollY !== undefined) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
  }, [safeEconomyPrice, safeExpressPrice, standardBase]);

  // CRITICAL: Use calculated prices (not static props)
  const services = [
    {
      id: 'economy' as const,
      name: 'Economy',
      price: safeEconomyPrice,
      description: 'Shared route, 7 days delivery',
      icon: '🚐',
      discount: '15% off',
    },
    {
      id: 'standard' as const,
      name: 'Standard',
      price: standardBase,
      description: 'Direct service, flexible scheduling',
      icon: '🚚',
      popular: true,
    },
    {
      id: 'express' as const,
      name: 'Express',
      price: safeExpressPrice,
      description: 'Same-day or next-day delivery',
      icon: '⚡',
      premium: '50% premium',
    },
  ];

  return (
    <Box w="full">
      <VStack spacing={6} align="stretch">
        {/* Selected Items Summary - Handled by parent with unified floating buttons */}

        {/* CARD 1: Service Selection - Simplified Tabs */}
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
                Choose Your Service
              </Text>

              <Box
                className="service-options-grid"
                w="100%"
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { base: '1fr', md: 'repeat(3, 1fr)' },
                  gap: { base: '12px', md: '16px' },
                  '@media screen and (max-width: 768px)': {
                    gridTemplateColumns: '1fr !important',
                    display: 'grid !important',
                  },
                }}
              >
                {services.map((service) => {
                  const isSelected = selectedService === service.id;

                  return (
                    <React.Fragment key={service.id}>
                      <SelectableCard
                        className={`price-card price-card-${service.id}`}
                        isSelected={isSelected}
                        onClick={() => handleServiceChange(service.id)}
                        w="full"
                        p={{ base: 4, md: 5 }}
                        sx={{
                          gridColumn: { base: '1', md: 'auto' }
                        }}
                      >
                        <VStack spacing={{ base: 3, md: 4 }} align="stretch" w="full">
                          <HStack justify="space-between" align="center">
                            <Box
                              p={{ base: 2, md: 3 }}
                              borderRadius="xl"
                              bg={isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.12)'}
                              transition="all 0.3s"
                              boxShadow={isSelected ? '0 0 15px rgba(59, 130, 246, 0.45)' : 'none'}
                            >
                              <Text fontSize={{ base: '2xl', md: '3xl' }} role="img" aria-hidden="true">
                                {service.icon}
                              </Text>
                            </Box>
                            <Text
                              fontSize={{ base: 'xl', md: '2xl' }}
                              fontWeight="extrabold"
                              color="white"
                            >
                              £{service.price.toFixed(2)}
                            </Text>
                          </HStack>

                          <Box>
                            <Text
                              fontSize={{ base: 'md', md: 'lg' }}
                              fontWeight="bold"
                              color="white"
                              noOfLines={1}
                            >
                              {service.name}
                            </Text>
                            <Text
                              fontSize={{ base: 'xs', md: 'sm' }}
                              color="whiteAlpha.700"
                              noOfLines={2}
                              lineHeight="1.4"
                            >
                              {service.description}
                            </Text>
                          </Box>

                          {(service.popular || service.discount || service.premium) && (
                            <HStack spacing={2} flexWrap="wrap">
                              {service.popular && (
                                <Badge
                                  colorScheme="purple"
                                  variant={isSelected ? 'solid' : 'subtle'}
                                  fontSize="2xs"
                                  fontWeight="700"
                                  borderRadius="full"
                                  textTransform="uppercase"
                                >
                                  Popular
                                </Badge>
                              )}
                              {service.discount && (
                                <Badge
                                  colorScheme="green"
                                  variant={isSelected ? 'solid' : 'subtle'}
                                  fontSize="2xs"
                                  fontWeight="700"
                                  borderRadius="full"
                                  textTransform="uppercase"
                                >
                                  {service.discount}
                                </Badge>
                              )}
                              {service.premium && (
                                <Badge
                                  colorScheme="orange"
                                  variant={isSelected ? 'solid' : 'subtle'}
                                  fontSize="2xs"
                                  fontWeight="700"
                                  borderRadius="full"
                                  textTransform="uppercase"
                                >
                                  {service.premium}
                                </Badge>
                              )}
                            </HStack>
                          )}
                        </VStack>
                      </SelectableCard>
                      
                      {/* Economy Service Warning - Shows directly below Economy card when selected */}
                      {service.id === 'economy' && isSelected && (
                        <Box
                          sx={{
                            gridColumn: { base: '1', md: '1 / -1' },
                          }}
                          mt={{ base: 2, md: 0 }}
                          p={{ base: 3, md: 4 }}
                          bg="rgba(251, 191, 36, 0.15)"
                          border="2px solid"
                          borderColor="rgba(251, 191, 36, 0.5)"
                          borderRadius="xl"
                          boxShadow="0 0 20px rgba(251, 191, 36, 0.2)"
                        >
                          <VStack spacing={3} align="stretch">
                            <HStack spacing={2}>
                              <Text fontSize={{ base: "2xl", md: "xl" }} role="img" aria-label="Warning">⚠️</Text>
                              <Text 
                                color="yellow.300" 
                                fontWeight="bold" 
                                fontSize={{ base: "md", md: "sm" }}
                                lineHeight="1.4"
                              >
                                Economy Service - Flexible Delivery
                              </Text>
                            </HStack>
                            
                            <VStack align="start" spacing={2} pl={{ base: 0, md: 8 }}>
                              <Text 
                                color="yellow.100" 
                                fontSize={{ base: "sm", md: "xs" }} 
                                fontWeight="600"
                                lineHeight="1.6"
                              >
                                📦 <Text as="span" color="white" fontWeight="bold">Delivery Timeline: 7-10 Days</Text>
                              </Text>
                              
                              <Text 
                                color="whiteAlpha.900" 
                                fontSize={{ base: "xs", md: "xs" }} 
                                lineHeight="1.7"
                              >
                                Your items will be delivered via our <Text as="span" fontWeight="bold">shared route service</Text>. 
                                The exact delivery date depends on <Text as="span" color="yellow.200" fontWeight="bold">driver availability</Text> and 
                                <Text as="span" color="yellow.200" fontWeight="bold"> route optimization</Text>.
                              </Text>
                              
                              {formData.step1.pickupDate && (
                                <Text 
                                  color="green.300" 
                                  fontSize={{ base: "xs", md: "xs" }} 
                                  fontWeight="600"
                                  lineHeight="1.6"
                                  pt={1}
                                >
                                  ✅ Your selected date ({new Date(formData.step1.pickupDate).toLocaleDateString('en-GB', { 
                                    weekday: 'short', 
                                    day: 'numeric', 
                                    month: 'short' 
                                  })}) will be the <Text as="span" textDecoration="underline">earliest possible</Text> pickup date.
                                </Text>
                              )}
                            </VStack>
                          </VStack>
                        </Box>
                      )}
                    </React.Fragment>
                  );
                })}
              </Box>
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
                  £{actualPrice.toFixed(2)}
                </Badge>
              </HStack>

              <Divider borderColor="rgba(59, 130, 246, 0.2)" />

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
                        <Text color="gray.400" fontSize="sm">Service</Text>
                        <Text color="white" fontSize="sm" fontWeight="500" textTransform="capitalize">
                          {selectedService}
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
                      <Text color="gray.400" fontSize="sm">Service</Text>
                      <Text color="white" fontSize="sm" fontWeight="500" textTransform="capitalize">
                        {selectedService}
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
                  serviceType: selectedService,
                  // Crew size (number of helpers)
                  crewSize: formData.step1.crewSize || '2',
                  // Pass tier prices for correct calculation in StripePaymentButton
                  economyPrice: safeEconomyPrice,
                  standardPrice: standardBase,
                  priorityPrice: safeExpressPrice,
                  scheduledDate: formData.step1.pickupDate || new Date().toISOString().split('T')[0],
                  scheduledTime: formData.step1.pickupTimeSlot,
                  pickupDetails: formData.step1.pickupProperty as any,
                  dropoffDetails: formData.step1.dropoffProperty as any,
                  notes: formData.step2.specialInstructions,
                  // ✅ CRITICAL FIX: Always pass segments for multi-leg bookings
                  segments: segments.length > 1 ? segments : undefined,
                }}
                amount={formData.step2.promotionDetails?.finalAmount || actualPrice}
                disabled={
                  !formData.step2.customerDetails.firstName ||
                  !formData.step2.customerDetails.lastName ||
                  !formData.step2.customerDetails.email ||
                  !formData.step2.customerDetails.phone
                }
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

