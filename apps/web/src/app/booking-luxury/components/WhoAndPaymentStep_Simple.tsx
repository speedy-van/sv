'use client';

/**
 * Step 3: Customer Details & Payment - Simplified Version
 * Updated: 2025-11-20 - Enhanced toggle button UX
 * Clean, modern design like Uber/Airbnb
 */

import React, { useState, useCallback, useMemo } from 'react';
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
  getTotalSegmentsPrice,
}: WhoAndPaymentStepProps) {
  const [selectedService, setSelectedService] = useState<'economy' | 'standard' | 'express'>('standard');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const { isOpen: isSummaryExpanded, onToggle: toggleSummary } = useDisclosure({ defaultIsOpen: false });
  const toast = useToast();
  const isIOSDevice = useIsIOSDevice();
  
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

  console.log('🔴 PRICING DEBUG:', {
    hasMultiLegPrice,
    isMultiLegWithoutPricing,
    segmentsLength: segments.length,
    segmentTotal,
    standardBase,
    safeStandardPrice,
    willCalculateFromBase: hasMultiLegPrice || isMultiLegWithoutPricing
  });

  // ✅ CRITICAL FIX: For multi-leg, ALWAYS calculate economy/express from standardBase
  // The props from parent contain BASE price (same for all tiers in multi-leg)
  // We must apply multipliers here to get correct tiered pricing
  let safeEconomyPrice: number;
  if (hasMultiLegPrice || isMultiLegWithoutPricing) {
    // Multi-leg: always calculate from standardBase
    safeEconomyPrice = parseFloat((standardBase * 0.85).toFixed(2));
    console.log('🟢 Multi-leg economy calculated:', safeEconomyPrice, '= ', standardBase, '* 0.85');
  } else {
    // Single-leg: use props (which already have multipliers from pricingTiers)
    const fromProps = sanitizePrice(economyPrice);
    safeEconomyPrice = fromProps !== undefined ? fromProps : parseFloat((standardBase * 0.85).toFixed(2));
  }

  let safeExpressPrice: number;
  if (hasMultiLegPrice || isMultiLegWithoutPricing) {
    // Multi-leg: always calculate from standardBase
    safeExpressPrice = parseFloat((standardBase * 1.5).toFixed(2));
    console.log('🟢 Multi-leg express calculated:', safeExpressPrice, '= ', standardBase, '* 1.5');
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

  // ✅ FIXED: For multi-leg, get items from first segment (all segments have same items)
  // This ensures consistency between Step 2 and Step 3
  const selectedItems = useMemo(() => {
    const segments = (formData.step1.segments || []) as BookingSegment[];
    const isMultiLeg = segments.length > 1;
    
    if (isMultiLeg) {
      // ✅ CRITICAL FIX: For multi-leg, all segments have the same items
      // Just return items from the first segment (no aggregation needed)
      const firstSegment = segments[0];
      if (firstSegment?.items && Array.isArray(firstSegment.items) && firstSegment.items.length > 0) {
        // Deep copy to avoid reference issues
        return firstSegment.items.map(item => ({ ...item }));
      }
      
      // Fallback: check other segments if first segment has no items
      for (const segment of segments) {
        if (segment?.items && Array.isArray(segment.items) && segment.items.length > 0) {
          return segment.items.map(item => ({ ...item }));
        }
      }
      
      // If no items in segments, fallback to global items
      if (formData.step1.items && Array.isArray(formData.step1.items) && formData.step1.items.length > 0) {
        return formData.step1.items.map(item => ({ ...item }));
      }
      
      return [];
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
    (itemId: string) => {
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

        updateFormData('step1', { segments: updatedSegments });
      } else {
        // Single-leg: update global items
        const currentItems = formData.step1.items || [];
        const nextItems = currentItems.map((item) =>
          item.id === itemId
            ? { ...item, quantity: Math.min((item.quantity || 0) + 1, 99) }
            : item
        );
        applyItemUpdates(nextItems);
      }
    },
    [formData.step1.items, formData.step1.segments, applyItemUpdates, updateFormData]
  );

  const decrementItem = useCallback(
    (itemId: string) => {
      const segments = (formData.step1.segments || []) as BookingSegment[];
      const isMultiLeg = segments.length > 1;

      if (isMultiLeg) {
        // Multi-leg: Decrement item quantity in first segment that has it
        // This maintains consistency - when user removes 1, it removes 1 from total
        const updatedSegments = [...segments];
        let decrementedOnce = false;
        
        for (let i = 0; i < updatedSegments.length && !decrementedOnce; i++) {
          const segment = updatedSegments[i];
          if (!segment.items) continue;
          
          const itemIndex = segment.items.findIndex(item => item.id === itemId);
          if (itemIndex !== -1) {
            const targetItem = segment.items[itemIndex];
            
            if ((targetItem.quantity || 0) <= 1) {
              // Check if item exists in other segments
              const existsInOtherSegments = segments.some((s, idx) => 
                idx !== i && s.items?.some(item => item.id === itemId && (item.quantity || 0) > 0)
              );
              
              if (existsInOtherSegments) {
                // Remove from this segment only
                updatedSegments[i] = {
                  ...segment,
                  items: segment.items.filter((_, idx) => idx !== itemIndex)
                };
              } else {
                // Last instance - remove from all segments
                for (let j = 0; j < updatedSegments.length; j++) {
                  if (updatedSegments[j].items) {
                    updatedSegments[j] = {
                      ...updatedSegments[j],
                      items: updatedSegments[j].items!.filter(item => item.id !== itemId)
                    };
                  }
                }
              }
            } else {
              // Decrease quantity in this segment only
              updatedSegments[i] = {
                ...segment,
                items: segment.items.map((item, idx) =>
                  idx === itemIndex
                    ? { ...item, quantity: Math.max((item.quantity || 0) - 1, 1) }
                    : item
                )
              };
            }
            decrementedOnce = true;
          }
        }

        updateFormData('step1', { segments: updatedSegments });
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
      }
    },
    [formData.step1.items, formData.step1.segments, applyItemUpdates, updateFormData]
  );

  const removeItem = useCallback(
    (itemId: string) => {
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

        updateFormData('step1', { segments: updatedSegments });
      } else {
        // Single-leg: remove from global items
        const currentItems = formData.step1.items || [];
        const nextItems = currentItems.filter((item) => item.id !== itemId);
        applyItemUpdates(nextItems);
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
    
    console.log(`🔄 Service changed to ${serviceId} - price: £${newTotal.toFixed(2)} (from Step 2)`);
    
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
        {/* Floating Purple Button for Selected Items - Step 2 Design */}
        {selectedItems.length > 0 && (
          <>
            <Box
              position="fixed"
              bottom={{ base: '180px', md: '200px' }}
              right={{ base: '20px', md: '30px' }}
              zIndex={1500}
            >
              <Flex
                as="button"
                onClick={toggleSummary}
                direction="column"
                align="center"
                justify="center"
                bgGradient={isSummaryExpanded 
                  ? "linear(135deg, #f43f5e, #ec4899)" 
                  : "linear(135deg, #8b5cf6, #7c3aed)"}
                color="white"
                borderRadius="full"
                w={{ base: '120px', md: '140px' }}
                h={{ base: '120px', md: '140px' }}
                cursor="pointer"
                boxShadow={isSummaryExpanded 
                  ? "0 15px 40px rgba(244, 63, 94, 0.5), 0 0 25px rgba(244, 63, 94, 0.3), inset 0 -5px 20px rgba(0,0,0,0.2)" 
                  : "0 15px 40px rgba(139, 92, 246, 0.5), 0 0 25px rgba(139, 92, 246, 0.3), inset 0 -5px 20px rgba(0,0,0,0.2)"}
                transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                border="4px solid white"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
                  transform: 'rotate(45deg)',
                  animation: 'shimmer 3s infinite',
                }}
                sx={{
                  '@keyframes shimmer': {
                    '0%': { transform: 'translateX(-100%) rotate(45deg)' },
                    '100%': { transform: 'translateX(100%) rotate(45deg)' },
                  },
                }}
                _hover={{
                  transform: 'scale(1.08)',
                  boxShadow: isSummaryExpanded 
                    ? '0 25px 60px rgba(244, 63, 94, 0.7), 0 0 45px rgba(244, 63, 94, 0.5)' 
                    : '0 25px 60px rgba(139, 92, 246, 0.7), 0 0 45px rgba(139, 92, 246, 0.5)',
                }}
                _active={{
                  transform: 'scale(0.95)',
                }}
              >
                {/* Animated ring */}
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  w={{ base: '45px', md: '55px' }}
                  h={{ base: '45px', md: '55px' }}
                  borderRadius="full"
                  border="2px solid"
                  borderColor="whiteAlpha.400"
                  animation="selectedItemsPulse 2s ease-in-out infinite"
                  sx={{
                    '@keyframes selectedItemsPulse': {
                      '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.6 },
                      '50%': { transform: 'translate(-50%, -50%) scale(1.2)', opacity: 0 },
                    },
                  }}
                />
                <Icon 
                  as={isSummaryExpanded ? FaChevronUp : FaShoppingBag} 
                  boxSize={{ base: 9, md: 11 }} 
                  color="white"
                  mb={2}
                  transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                  transform={isSummaryExpanded ? "rotate(0deg)" : "rotate(-10deg)"}
                  filter="drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))"
                  zIndex={1}
                />
                
                <Flex
                  align="center"
                  justify="center"
                  bg="white"
                  borderRadius="full"
                  w={{ base: '44px', md: '52px' }}
                  h={{ base: '44px', md: '52px' }}
                  mb={1}
                  boxShadow="0 4px 15px rgba(0,0,0,0.2)"
                  zIndex={1}
                >
                  <Text 
                    fontSize={{ base: 'xl', md: '2xl' }} 
                    fontWeight="900" 
                    lineHeight="1"
                    color={isSummaryExpanded ? "#f43f5e" : "#8b5cf6"}
                  >
                    {selectionStats.totalItems}
                  </Text>
                </Flex>
                
                <Text 
                  fontSize={{ base: 'xs', md: 'sm' }} 
                  fontWeight="bold" 
                  textTransform="uppercase"
                  color="white"
                  letterSpacing="wider"
                  textShadow="0 2px 4px rgba(0,0,0,0.3)"
                  zIndex={1}
                >
                  {isSummaryExpanded ? 'CLOSE' : 'VIEW'}
                </Text>
              </Flex>
            </Box>

            {/* Expanded Details Panel - Step 2 Design */}
            <Box
              position="fixed"
              bottom="0"
              left="0"
              right="0"
              zIndex={1400}
              pointerEvents={isSummaryExpanded ? 'auto' : 'none'}
            >
              <Collapse in={isSummaryExpanded} animateOpacity>
                <Box 
                  bg="linear-gradient(180deg, rgba(10, 10, 15, 0.98) 0%, rgba(5, 5, 8, 0.99) 100%)" 
                  backdropFilter="blur(20px)"
                  borderTop="2px solid"
                  borderColor="rgba(168, 85, 247, 0.4)"
                  boxShadow="0 -8px 32px rgba(0, 0, 0, 0.8)"
                  maxH="60vh"
                  overflowY="auto"
                  p={{ base: 4, md: 6 }}
                >
                  {/* Use new comprehensive Selected Items Manager */}
                  <SelectedItemsManager
                    segments={formData.step1.segments || []}
                    isMultiLeg={(formData.step1.segments || []).length > 1}
                    globalItems={formData.step1.items || []}
                    onIncrement={(segmentIndex, itemId) => {
                      // Allow editing items in Step 3 and trigger price recalculation
                      incrementItem(itemId);
                      // Trigger price recalculation after item change
                      if (calculatePricing) {
                        setTimeout(() => calculatePricing(), 100);
                      }
                    }}
                    onDecrement={(segmentIndex, itemId) => {
                      // Allow editing items in Step 3 and trigger price recalculation
                      decrementItem(itemId);
                      // Trigger price recalculation after item change
                      if (calculatePricing) {
                        setTimeout(() => calculatePricing(), 100);
                      }
                    }}
                    onRemove={(segmentIndex, itemId) => {
                      // Allow editing items in Step 3 and trigger price recalculation
                      removeItem(itemId);
                      // Trigger price recalculation after item change
                      if (calculatePricing) {
                        setTimeout(() => calculatePricing(), 100);
                      }
                    }}
                    showPricing={false}
                    readonly={false}
                  />
                </Box>
              </Collapse>
            </Box>
          </>
        )}

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
                    <SelectableCard
                      key={service.id}
                      className={`price-card price-card-${service.id}`}
                      isSelected={isSelected}
                      onClick={() => handleServiceChange(service.id)}
                      w="full"
                      p={{ base: 4, md: 5 }}
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
                  );
                })}
              </Box>
              
              {/* Economy Service Warning - Important delivery info */}
              {selectedService === 'economy' && (
                <Box
                  mt={4}
                  p={4}
                  bg="rgba(251, 191, 36, 0.15)"
                  border="1px solid"
                  borderColor="rgba(251, 191, 36, 0.4)"
                  borderRadius="xl"
                >
                  <HStack spacing={3} align="flex-start">
                    <Text fontSize="xl" role="img" aria-label="Warning">⚠️</Text>
                    <VStack align="start" spacing={1}>
                      <Text color="yellow.300" fontWeight="bold" fontSize="sm">
                        Economy Service - Flexible Delivery
                      </Text>
                      <Text color="whiteAlpha.800" fontSize="xs" lineHeight="1.5">
                        Your items will be delivered within <strong>7 days</strong> via our shared route service. 
                        The exact delivery date will be confirmed once we optimize our routes.
                        {formData.step1.pickupDate && (
                          <Text as="span" color="yellow.200">
                            {' '}Your original date ({new Date(formData.step1.pickupDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}) will be used as the earliest possible delivery date.
                          </Text>
                        )}
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
                                <Text>{segment.items?.length || 0} items</Text>
                              </HStack>
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
                    total: actualPrice, // Use actualPrice which respects selectedService
                  } as any,
                  serviceType: selectedService,
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
                amount={actualPrice}
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

