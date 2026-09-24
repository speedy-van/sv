'use client';

/* eslint-disable no-console -- booking flow debug logging */
import React, { useState, useEffect, useCallback, useRef, Suspense, useMemo } from 'react';
import {
  safeLocalStorageGetItem,
  safeLocalStorageRemoveItem,
  safeLocalStorageSetItem,
} from '@/lib/safe-storage';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  Flex,
  Stack,
  Spinner,
  SimpleGrid,
  IconButton,
  FormControl,
  FormLabel,
  Input,
  Select,
} from '@chakra-ui/react';
import { FaArrowLeft, FaArrowRight, FaCheck, FaTruck, FaClock, FaMapMarkerAlt, FaPhone, FaRedo, FaCalendarAlt } from 'react-icons/fa';
// @ts-ignore - Temporary fix for Next.js module resolution
import { useSearchParams, useRouter } from 'next/navigation';
import AddressesStep from './components/AddressesStep';
import WhereAndWhatStepHierarchical from './components/WhereAndWhatStepHierarchical';
import WhoAndPaymentStepSimple from './components/WhoAndPaymentStep_Simple';
import { useBookingForm } from './hooks/useBookingForm';
import { useQuote } from './hooks/useQuote';
import type { QuoteRequest, QuoteResponse } from '@/lib/pricing/quote-schema';
import FloatingActionButtons from './components/FloatingActionButtons';
import AIItemExtractionAssistant from './components/AIItemExtractionAssistant';
import CustomerChatWidget from '@/components/customer/CustomerChatWidget';
import SelectedItemsManager from './components/SelectedItemsManager';
import { ResponsiveSection } from '@/components/layout/ResponsiveSection';
import LuxurySurfaceCard from './components/LuxurySurfaceCard';
import BookingReferenceCard from './components/BookingReferenceCard';
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

const normalizeUkPostcode = (postcode?: string | null) => {
  if (!postcode) return '';
  const cleaned = postcode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length < 5) return cleaned;
  const front = cleaned.slice(0, cleaned.length - 3);
  const end = cleaned.slice(-3);
  return `${front} ${end}`.trim();
};

const isValidUkPostcode = (postcode?: string | null) => {
  if (!postcode) return false;
  const pc = postcode.trim().toUpperCase();
  return /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(pc);
};

const ADDRESS_SUGGESTION_REQUIRED_MESSAGE = 'Choose your address from the suggestions so we can price it';

type PricingFlowState = 'idle' | 'loading' | 'success' | 'error';

/** Minimal address shape for pricing normalization (from autocomplete or API). */
interface AddressForPricing {
  components?: Record<string, unknown>;
  formatted_address?: string;
  fullAddress?: string;
  full?: string;
  address?: string;
  line1?: string;
  displayText?: string;
  place_name?: string;
  houseNumber?: string;
  number?: string;
  city?: string;
  postcode?: string;
  coordinates?: { lat?: number; lng?: number };
  location?: { lat?: number; lng?: number };
  street?: string;
}

export default function BookingLuxuryPage() {
  return (
    <Suspense fallback={
      <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="text.secondary">Loading booking form...</Text>
        </VStack>
      </Box>
    }>
      <BookingLuxuryContent />
    </Suspense>
  );
}

function BookingLuxuryContent() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isClient, setIsClient] = useState<boolean>(false);
  const router = useRouter();
  const _handleClearBookingProgress = useCallback(() => {
    if (typeof window === 'undefined') return;
    safeLocalStorageRemoveItem('sv_booking_luxury_last_step');
    setResumeStep(null);
    router.replace('/booking-luxury');
  }, [router]);
  
  // Wave effects for step headers (reserved for future UI)
  const [_addressWaveActive, setAddressWaveActive] = useState(false);
  const [_itemsDetailsWaveActive, setItemsDetailsWaveActive] = useState(false);
  const [_checkoutWaveActive, setCheckoutWaveActive] = useState(false);
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
  
  // Error card highlighting state - for red neon animation
  const [errorCardId, setErrorCardId] = useState<string | null>(null);

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

  // Track last step visited to decide when to show resume banner
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = safeLocalStorageGetItem('sv_booking_luxury_last_step');
    if (stored) {
      const num = parseInt(stored, 10);
      if (!Number.isNaN(num)) {
        setResumeStep(num);
      }
    }
  }, []);

  // Auto-open chat when requested via header CTA
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const shouldOpen = params.get('openChat') === '1' || safeLocalStorageGetItem('sv_open_chat') === '1';

    if (shouldOpen) {
      onChatOpen();
      safeLocalStorageRemoveItem('sv_open_chat');

      if (params.has('openChat')) {
        params.delete('openChat');
        const newQuery = params.toString();
        const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}${window.location.hash}`;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [onChatOpen]);

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
    validateStep: _validateStep,
    isStepValid: _isStepValid,
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

  // Persist current step so user can resume if they navigate away
  useEffect(() => {
    if (typeof window === 'undefined') return;
    safeLocalStorageSetItem('sv_booking_luxury_last_step', String(currentStep));
    if (formData.step2.bookingReference) {
      safeLocalStorageSetItem('sv_booking_luxury_reference', formData.step2.bookingReference);
    }
  }, [currentStep, formData.step2.bookingReference]);

  // Enterprise Engine: Automatic availability & pricing with full addresses
  const [_availabilityData, setAvailabilityData] = useState<Record<string, unknown> | null>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [_capacityCheck, setCapacityCheck] = useState<Record<string, unknown> | null>(null);
  const [_routeSummary, setRouteSummary] = useState<Record<string, unknown> | null>(null);
  const [pricingTiers, setPricingTiers] = useState<{
    economy: { price?: number; [k: string]: unknown };
    standard: { price?: number; [k: string]: unknown };
    express: { price?: number; [k: string]: unknown };
  } | null>(null);
  const [pricingFlowState, setPricingFlowState] = useState<PricingFlowState>('idle');
  const [pricingFlowMessage, setPricingFlowMessage] = useState<string | null>(null);
  const [isLoadingReference, setIsLoadingReference] = useState(false);
  const [_resumeStep, setResumeStep] = useState<number | null>(null);

  const buildQuoteAddress = useCallback((addr: AddressForPricing | null | undefined): QuoteRequest['pickup'] | null => {
    if (!addr) return null;
    const components = (addr.components || {}) as Record<string, unknown>;
    const full = String(
      addr.formatted_address ||
      addr.fullAddress ||
      addr.full ||
      addr.displayText ||
      addr.place_name ||
      addr.address ||
      ''
    ).trim();
    const firstPart = full.split(',')[0]?.trim() || '';
    const line1 = String(addr.line1 || firstPart || addr.street || '').trim();
    const city = String(
      addr.city ||
      components.city ||
      components.locality ||
      components.post_town ||
      ''
    ).trim();
    const postcode = normalizeUkPostcode(String(
      addr.postcode ||
      components.postcode ||
      components.postal_code ||
      ''
    ));
    const coordinates = addr.coordinates || addr.location;
    const lat = coordinates?.lat;
    const lng = coordinates?.lng;
    const hasCoordinates = typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

    if (!full || !line1 || !city || !isValidUkPostcode(postcode) || !hasCoordinates) {
      return null;
    }

    return {
      full,
      line1,
      city,
      postcode,
      coordinates: { lat, lng },
    };
  }, []);

  // Phase 0.5: server-side quote for single-leg and multi-leg bookings
  const quoteInput = useMemo((): QuoteRequest | null => {
    const s1 = formData.step1;
    const segments = (s1.segments || []) as BookingSegment[];
    const items = (s1.items ?? []).filter((i: any) => i?.id && i?.name && (i?.quantity ?? 0) > 0);
    if (items.length === 0) return null;

    const quoteItems = items.map((i: any) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      weight_override: i.weight,
      volume_override: i.volume ?? i.volumeFactor,
    }));

    const segmentInputs = segments.length > 1
      ? segments.map((segment, index) => {
          const pickup = buildQuoteAddress(segment.pickupAddress as AddressForPricing | null | undefined);
          const dropoff = buildQuoteAddress(segment.dropoffAddress as AddressForPricing | null | undefined);
          const segmentItems = (segment.items?.length ? segment.items : items)
            .filter((i: any) => i?.id && i?.name && (i?.quantity ?? 0) > 0)
            .map((i: any) => ({
              id: i.id,
              name: i.name,
              quantity: i.quantity,
              weight_override: i.weight,
              volume_override: i.volume ?? i.volumeFactor,
            }));
          if (!pickup || !dropoff || segmentItems.length === 0) return null;
          return {
            segmentType: (segment.segmentType || (index === 0 ? 'outbound' : segments.length === 2 && index === 1 ? 'return' : 'additional')) as NonNullable<QuoteRequest['segments']>[number]['segmentType'],
            pickup,
            dropoffs: [dropoff],
            items: segmentItems,
          };
        })
      : undefined;

    if (segmentInputs?.some((segment) => segment === null)) return null;

    const primaryPickup = segmentInputs?.[0]?.pickup ?? buildQuoteAddress(s1.pickupAddress as AddressForPricing | null | undefined);
    const primaryDropoff = segmentInputs?.[0]?.dropoffs[0] ?? buildQuoteAddress(s1.dropoffAddress as AddressForPricing | null | undefined);
    if (!primaryPickup || !primaryDropoff) return null;

    return {
      pickup: primaryPickup,
      dropoffs: [primaryDropoff],
      segments: segmentInputs ? (segmentInputs.filter(Boolean) as NonNullable<QuoteRequest['segments']>) : undefined,
      items: quoteItems,
      crewSize: (s1.crewSize ?? '2') as QuoteRequest['crewSize'],
      extras: { packing: false, assembly: [] },
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.step1.pickupAddress, formData.step1.dropoffAddress, formData.step1.items, formData.step1.crewSize, formData.step1.segments, buildQuoteAddress]);

  const quoteResult = useQuote(quoteInput);
  const pendingQuoteRefreshAmountPenceRef = useRef<number | null>(null);

  const setPricingFailure = useCallback((message: string) => {
    setPricingFlowState('error');
    setPricingFlowMessage(message);
    setPricingTiers(null);
    setAvailabilityData(null);
  }, []);

  const clearPricingFailure = useCallback(() => {
    setPricingFlowMessage(null);
    if (pricingFlowState === 'error') {
      setPricingFlowState('idle');
    }
  }, [pricingFlowState]);

  const hasValidQuote = pricingFlowState === 'success' && (pricingTiers?.standard?.price ?? 0) > 0;

  // ✅ CRITICAL FIX: Wrap addReturnSegment to pass pricingTiers for accurate pricing
  const addReturnSegmentWithPricing = useCallback((bufferMinutes: number = 30) => {
    const tiersRef =
      pricingTiers?.standard?.price != null
        ? { standard: { price: pricingTiers.standard.price } }
        : undefined;
    addReturnSegment(bufferMinutes, tiersRef);
  }, [addReturnSegment, pricingTiers]);

  // ✅ CRITICAL FIX: Wrap addAdditionalSegment to pass pricingTiers for accurate outbound pricing
  const addAdditionalSegmentWithPricing = useCallback(() => {
    const tiersRef =
      pricingTiers?.standard?.price != null
        ? { standard: { price: pricingTiers.standard.price } }
        : undefined;
    addAdditionalSegment(tiersRef);
  }, [addAdditionalSegment, pricingTiers]);

  // Phase 0.5: sync quote result → pricingTiers and multi-leg segment display
  useEffect(() => {
    if (quoteResult.status === 'success' && quoteResult.data) {
      const q = quoteResult.data;
      const selectedDateKey = formData.step1.quote?.dateKey || formData.step1.pickupDate || '';
      const selectedEntry = (selectedDateKey ? q.datePrices.find((p) => p.dateKey === selectedDateKey) : undefined)
        ?? q.datePrices.find((p: { cheapest: boolean }) => p.cheapest)
        ?? q.datePrices[0];
      const stdPrice = selectedEntry ? selectedEntry.totalPence / 100 : 0;
      if (stdPrice <= 0) return;

      const previousAmountPence = pendingQuoteRefreshAmountPenceRef.current;
      if (previousAmountPence !== null) {
        if (Math.abs(previousAmountPence - selectedEntry.totalPence) > 1) {
          toast({
            title: `Your price was updated to £${(selectedEntry.totalPence / 100).toFixed(2)}`,
            status: 'info',
            duration: 6000,
            isClosable: true,
          });
        }
        pendingQuoteRefreshAmountPenceRef.current = null;
      }

      setPricingTiers({
        economy: { price: Math.round(stdPrice * 85) / 100 },
        standard: { price: stdPrice },
        express: { price: Math.round(stdPrice * 150) / 100 },
      });
      setPricingFlowState('success');
      setPricingFlowMessage(null);
      setIsLoadingAvailability(false);

      const updatePayload: {
        quote: { id: string; expiresAt: string; dateKey: string };
        pricing: { baseFee: number; distanceFee: number; volumeFee: number; serviceFee: number; urgencyFee: number; vat: number; total: number; distance: number };
        segments?: BookingSegment[];
      } = {
        quote: { id: q.quoteId, expiresAt: q.expiresAt, dateKey: selectedDateKey },
        pricing: { baseFee: 0, distanceFee: 0, volumeFee: 0, serviceFee: 0, urgencyFee: 0, vat: 0, total: stdPrice, distance: 0 },
      };

      const currentSegments = (formData.step1.segments || []) as BookingSegment[];
      if (currentSegments.length > 1 && q.segments?.length) {
        updatePayload.segments = currentSegments.map((segment, index) => {
          const quotedSegment = q.segments?.find((quoteSegment) => quoteSegment.sequenceNumber === index);
          if (!quotedSegment) return segment;
          return {
            ...segment,
            pricing: {
              baseFee: segment.pricing?.baseFee ?? 0,
              distanceFee: segment.pricing?.distanceFee ?? 0,
              volumeFee: segment.pricing?.volumeFee ?? 0,
              serviceFee: segment.pricing?.serviceFee ?? 0,
              urgencyFee: segment.pricing?.urgencyFee ?? 0,
              vat: segment.pricing?.vat ?? 0,
              total: quotedSegment.totalPence / 100,
              distance: quotedSegment.route.miles ?? segment.distance ?? 0,
            },
            distance: quotedSegment.route.miles ?? segment.distance,
            estimatedDuration: quotedSegment.route.durationMinutes ?? segment.estimatedDuration,
          };
        });
      }

      updateFormData('step1', updatePayload);
    } else if (quoteResult.status === 'loading' && !quoteResult.isStale) {
      setPricingFlowState('loading');
      setPricingFlowMessage('Calculating your quote...');
      setIsLoadingAvailability(true);
    } else if (quoteResult.status === 'error') {
      setPricingFailure(quoteResult.error?.message ?? 'Quote unavailable. Please retry.');
      setIsLoadingAvailability(false);
    }
    if (quoteResult.status !== 'loading') {
      setIsLoadingAvailability(false);
    }
  }, [quoteResult.status, quoteResult.data, quoteResult.error, quoteResult.isStale, setPricingFailure, toast, updateFormData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Normalize address from autocomplete to the quote/pricing schema
  const normalizeAddressForPricing = useCallback((addr: AddressForPricing | null | undefined) => {
    if (!addr) return null;
    const components = (addr.components || {}) as Record<string, unknown>;
    
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
        street = parts[0].replace(/^\d+[a-zA-Z]?\s+/, '').trim();
      }
    }
    
    // Extract city
    const city = 
      addr.city || 
      components.city || 
      components.locality || 
      components.post_town || 
      '';
    
    // Extract postcode
    const postcode = 
      addr.postcode || 
      components.postcode || 
      components.postal_code || 
      '';
    
    // Extract line1
    const line1 = firstPart || [number, street].filter(Boolean).join(' ');
    
    // Extract coordinates
    const coordinates = addr.coordinates || addr.location;
    const lat = coordinates?.lat;
    const lng = coordinates?.lng;
    const hasCoordinates = typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);

    if (!full || !line1 || !city || !postcode || !hasCoordinates) {
      return null;
    }

    return { full, line1, city, postcode, street, number, coordinates: { lat, lng } };
  }, []);

  const handleBookingCreated = useCallback(({ bookingId, reference }: { bookingId: string; reference: string }) => {
    updateFormData('step2', { bookingId, bookingReference: reference });
    toast({
      title: 'Booking reference created',
      description: `Reference: ${reference}`,
      status: 'info',
      duration: 5000,
      isClosable: true,
    });
  }, [toast, updateFormData]);

  // Fetch and persist a booking reference + draft as soon as the page loads
  useEffect(() => {
    if (!isClient) return;
    if (formData.step2.bookingDraftId || isLoadingReference) return;

    const createDraft = async () => {
      setIsLoadingReference(true);
      try {
        const draftRes = await fetch('/api/booking-luxury/draft', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        if (!draftRes.ok) {
          const errorText = await draftRes.text().catch(() => '');
          throw new Error(`Draft creation failed (${draftRes.status}): ${errorText || draftRes.statusText}`);
        }

        const draftJson = await draftRes.json();
        const draftId = draftJson?.draft?.id;
        const draftReference = draftJson?.draft?.reference;

        if (draftJson?.success && draftId && draftReference) {
          updateFormData('step2', {
            bookingDraftId: draftId,
            bookingReference: draftReference,
          });
        } else {
          throw new Error(`Invalid draft payload: ${JSON.stringify(draftJson)}`);
        }
      } catch (error) {
        console.error('Failed to initialize booking draft/reference', error);
        toast({
          title: 'Could not create booking draft',
          description: 'Please retry in a moment or contact support@speedy-van.co.uk / 01202 129746 if it continues.',
          status: 'error',
          duration: 7000,
          isClosable: true,
        });
      } finally {
        setIsLoadingReference(false);
      }
    };

    createDraft();
  }, [isClient, formData.step2.bookingDraftId, isLoadingReference, updateFormData, toast]);

  // Sync draft with latest step1 + step2 data for admin visibility (debounced)
  useEffect(() => {
    if (!formData.step2.bookingDraftId) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/booking-luxury/draft/${formData.step2.bookingDraftId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          formStep1: formData.step1,
          formStep2: formData.step2,
          pickupAddress: formData.step1.pickupAddress,
          dropoffAddress: formData.step1.dropoffAddress,
          items: formData.step1.items,
          pricing: formData.step1.pricing,
          serviceType: formData.step1.serviceType,
          crewSize: formData.step1.crewSize,
          scheduledDate: formData.step1.pickupDate,
          capacityCheck: _capacityCheck,
          notes: formData.step2.specialInstructions,
          status: 'DRAFT',
        }),
      }).catch((error: unknown) => {
        // Ignore AbortError - this is expected when component unmounts
        if (error instanceof Error && error.name === 'AbortError') return;
        console.error('Failed to sync booking draft', error);
      });
    }, 800);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [formData.step1, formData.step2]);

  // Auto-calculate availability and pricing when addresses/items change
  const calculateComprehensivePricing = useCallback(async () => {
    const segments = (formData.step1.segments || []) as BookingSegment[];
    if (segments.length > 1) {
      if (!quoteInput) {
        setPricingFailure(ADDRESS_SUGGESTION_REQUIRED_MESSAGE);
        setIsLoadingAvailability(false);
        return;
      }
      console.log('🔄 Multi-leg booking: refreshing server quote for all segments');
      setPricingFlowState('loading');
      setPricingFlowMessage('Calculating quote for all journey segments...');
      quoteResult.refresh();
      return;
    }

    // Single-leg: continue with normal pricing
    // Only calculate if we have addresses (items can be empty - will use default)
    if (!formData.step1.pickupAddress?.coordinates) {
      setPricingFailure(ADDRESS_SUGGESTION_REQUIRED_MESSAGE);
      return;
    }
    
    // CRITICAL: Skip if no items yet (API requires at least 1 item)
    // Check both global items and segment items (in case of single segment)
    const hasGlobalItems = formData.step1.items && formData.step1.items.length > 0;
    const hasSegmentItems = segments.length === 1 && segments[0]?.items && segments[0].items.length > 0;
    
    if (!hasGlobalItems && !hasSegmentItems) {
      setPricingFailure('Please add at least one item to generate your quote.');
      setIsLoadingAvailability(false);
      return;
    }
    
    // Use items from segment if available (single segment), otherwise use global items
    const itemsToUse = hasSegmentItems ? segments[0].items : formData.step1.items;

    // Normalize addresses to consistent schema
    const pickupNormRaw = normalizeAddressForPricing(formData.step1.pickupAddress);
    const dropNormRaw = normalizeAddressForPricing(formData.step1.dropoffAddress);
    const pickupNorm = pickupNormRaw ? { ...pickupNormRaw, postcode: normalizeUkPostcode(typeof pickupNormRaw.postcode === 'string' ? pickupNormRaw.postcode : '') } : null;
    const dropNorm = dropNormRaw ? { ...dropNormRaw, postcode: normalizeUkPostcode(typeof dropNormRaw.postcode === 'string' ? dropNormRaw.postcode : '') } : null;

    // Validate addresses exist
    if (!pickupNorm || !dropNorm) {
      setPricingFailure(ADDRESS_SUGGESTION_REQUIRED_MESSAGE);
      return;
    }

    // Validate UK postcodes
    const pickupPostcode = normalizeUkPostcode(pickupNorm.postcode);
    const dropPostcode = normalizeUkPostcode(dropNorm.postcode);

    if (!isValidUkPostcode(pickupPostcode) || !isValidUkPostcode(dropPostcode)) {
      setPricingFailure(ADDRESS_SUGGESTION_REQUIRED_MESSAGE);
      toast({
        title: 'Postcode needed',
        description: 'Please enter valid UK postcodes (e.g., SW1A 1AA, M1 1AE).',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      setIsLoadingAvailability(false);
      return;
    }

    // Validate addresses have coordinates (required)
    const pickupLat = pickupNorm?.coordinates?.lat;
    const pickupLng = pickupNorm?.coordinates?.lng;
    const dropLat = dropNorm?.coordinates?.lat;
    const dropLng = dropNorm?.coordinates?.lng;
    const hasPickupCoordinates = typeof pickupLat === 'number' && typeof pickupLng === 'number';
    const hasDropCoordinates = typeof dropLat === 'number' && typeof dropLng === 'number';
    const pickupIsZero = pickupLat === 0 && pickupLng === 0;
    const dropIsZero = dropLat === 0 && dropLng === 0;

    if (!hasPickupCoordinates || pickupIsZero) {
      setPricingFailure(ADDRESS_SUGGESTION_REQUIRED_MESSAGE);
      return;
    }

    if (!hasDropCoordinates || dropIsZero) {
      setPricingFailure(ADDRESS_SUGGESTION_REQUIRED_MESSAGE);
      return;
    }

    // Phase 0: single-leg pricing via server quote hook
    quoteResult.refresh();
    return;

  }, [formData.step1, setPricingFailure, normalizeAddressForPricing, quoteInput, quoteResult.refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuoteExpired = useCallback((previousAmountPence?: number) => {
    pendingQuoteRefreshAmountPenceRef.current = typeof previousAmountPence === 'number'
      ? previousAmountPence
      : null;
    quoteResult.refresh();
  }, [quoteResult.refresh]);

  // Set isClient to true after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Removed aggressive scroll prevention that was causing multiple scroll-up issues
  // Removed duplicate pricing trigger - pricing is already triggered by items/addresses useEffect below

  // Three-tier pricing calculations (fallback for legacy)
  const calculateEconomyPrice = useCallback(() => {
    const segments = (formData.step1.segments || []) as BookingSegment[];
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
    const segments = (formData.step1.segments || []) as BookingSegment[];
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
    const segments = (formData.step1.segments || []) as BookingSegment[];
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

  // Get quantity of trending item (reserved for trending UI)
  const _getTrendingItemQuantity = (itemId: string) => {
    const item = formData.step1.items.find(item => item.id === itemId);
    return item?.quantity || 0;
  };

  // Add trending item with feedback (reserved for trending UI)
  const _addTrendingItem = (trendingItem: typeof trendingItems[0]) => {
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

  // Remove trending item with feedback (reserved for trending UI)
  const _removeTrendingItem = (itemId: string) => {
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
        segments: segments.map((s: BookingSegment) => ({
          items: s.items?.map((i: { id: string; quantity: number }) => ({ id: i.id, quantity: i.quantity })) || [],
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

    // Handle category parameter - navigate to step 2 if category is provided
    const category = searchParams?.get('category');
    if (category) {
      // Move to step 2 to show items (WhereAndWhatStep will read category from URL)
      if (currentStep === 1) {
        setCurrentStep(2);
      }
    }
  }, [searchParams, toast, isClient, currentStep]);


  // Success page is now handled by dedicated /booking/success route

  const handleNext = async () => {
    // Simple check - no complex validation
    if (currentStep === 1) {
      // Step 1: Check addresses exist ONLY - date/time is set in Step 2
      if (formData.step1.pickupAddress?.full && formData.step1.dropoffAddress?.full) {
        // For Step 1, we DON'T validate segments for items OR datetime (both are in Step 2)
        // Just verify addresses exist for multi-leg
        const segments = (formData.step1.segments || []) as BookingSegment[];
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
      const segments = (formData.step1.segments || []) as BookingSegment[];
      const isMultiLeg = segments.length > 1;
      const pickupCoordinates = formData.step1.pickupAddress?.coordinates;
      const dropoffCoordinates = formData.step1.dropoffAddress?.coordinates;
      const pickupCoordinatesValid = typeof pickupCoordinates?.lat === 'number' &&
        typeof pickupCoordinates?.lng === 'number' &&
        !(pickupCoordinates.lat === 0 && pickupCoordinates.lng === 0);
      const dropoffCoordinatesValid = typeof dropoffCoordinates?.lat === 'number' &&
        typeof dropoffCoordinates?.lng === 'number' &&
        !(dropoffCoordinates.lat === 0 && dropoffCoordinates.lng === 0);
      
      // Check if items exist (either in segments or global)
      const hasItems = isMultiLeg 
        ? segments.some(s => s.items && s.items.length > 0)
        : formData.step1.items.length > 0;
        
      if (!hasItems) {
        // Scroll to items card and show red neon animation
        setErrorCardId('items-card');
        const itemsCard = document.getElementById('items-card');
        if (itemsCard) {
          itemsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        toast({
          title: 'Please select at least one item',
          status: 'error',
          duration: 3000,
        });
        // Clear error state after 3 seconds
        setTimeout(() => setErrorCardId(null), 3000);
        return;
      }
      
      // Check if date exists (either in segments or global)
      const hasDate = isMultiLeg
        ? segments.every(s => s.datetime)
        : (formData.step1.pickupDateChoice === 'unknown' || formData.step1.pickupDate);
        
      if (!hasDate) {
        // Scroll to date card and show red neon animation
        setErrorCardId('datetime-card');
        const dateCard = document.getElementById('datetime-card');
        if (dateCard) {
          dateCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        toast({
          title: 'Please select a pickup date',
          status: 'error',
          duration: 3000,
        });
        // Clear error state after 3 seconds
        setTimeout(() => setErrorCardId(null), 3000);
        return;
      }

      if (!pickupCoordinatesValid || !dropoffCoordinatesValid) {
        setPricingFailure('Please re-select both addresses from suggestions to generate a valid quote.');
        toast({
          title: 'Address coordinates required',
          description: 'Use “Edit addresses” and choose both locations again before continuing.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        setCurrentStep(1);
        return;
      }

      if (pricingFlowState === 'loading') {
        toast({
          title: 'Quote is still loading',
          description: 'Please wait for pricing to finish before continuing.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (!hasValidQuote) {
        setPricingFailure(pricingFlowMessage || 'A verified quote is required before continuing to payment.');
        toast({
          title: 'Quote required',
          description: 'Please retry quote, review addresses, or review items.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      
      // CRITICAL FIX: Sync items AND pricing from outbound to return segment before checkout
      if (isMultiLeg) {
        const outboundSegment = segments.find((s: BookingSegment) => s.segmentType === 'outbound');
        const returnSegmentIndex = segments.findIndex((s: BookingSegment) => s.segmentType === 'return');
        
        if (outboundSegment && returnSegmentIndex !== -1) {
          const returnSegment = segments[returnSegmentIndex];
          const needsItemSync = (!returnSegment.items || returnSegment.items.length === 0) && 
              outboundSegment.items && outboundSegment.items.length > 0;
          const needsPricingSync = (!returnSegment.pricing || returnSegment.pricing.total === 0) &&
              outboundSegment.pricing && outboundSegment.pricing.total > 0;
          
          if (needsItemSync || needsPricingSync) {
            console.log('🔄 Auto-syncing items and pricing from outbound to return before checkout');
            const updates: Record<string, unknown> = {};
            if (needsItemSync) {
              updates.items = [...outboundSegment.items];
            }
            if (needsPricingSync) {
              if (outboundSegment.pricing && outboundSegment.pricing.total > 0) {
                updates.pricing = { ...outboundSegment.pricing };
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

  const bgColor = 'bg.canvas';

  // REMOVED: Scroll restoration interferes with step transitions

  // Do not block UI on hydration; guard browser-only APIs inside effects

  return (
    <>
      <style jsx global>{`
        .booking-time-select {
          color: #a9b4cc;
          background-color: #121a2b;
        }
        .booking-time-select option {
          color: #a9b4cc;
          background-color: #121a2b;
        }
      `}</style>
    <Box 
      display="block" 
      w="100%" 
      minW="0"
      bg={bgColor} 
      position="relative"
      overflow="hidden"
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
        position="relative"
        zIndex={1}
        minW="0"
      >
        <Box 
          display="block" 
          w="100%" 
          minW="0"
          py={{ base: 2, md: 8 }}
        >
          {/* SIMPLIFIED STICKY HEADER - Modern & Clean - MOBILE SAFARI FIX */}
          <Box
            position="sticky"
            top={0}
            zIndex={100}
            bg="bg.header"
            backdropFilter="blur(12px)"
            borderBottom="1px solid"
            borderColor="border.primary"
            boxShadow="sm"
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
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
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
                      color="text.secondary"
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
                      Move Anything, Anywhere
                    </Text>
                  </VStack>
                </HStack>

                {/* Right: Truck + Premium Call Icon Button */}
                <Flex align="center" gap={{ base: 2, md: 3 }}>
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
                  <IconButton
                    as="a"
                    href="tel:01202129746"
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
              </Flex>

              {/* Services Hero Banner - Scrolling Tags */}
              <Box 
                w="full" 
                overflow="hidden" 
                py={3}
                position="relative"
                bg="linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(59, 130, 246, 0.1) 100%)"
                borderRadius="xl"
                border="1px solid"
                borderColor="rgba(59, 130, 246, 0.2)"
                mx={{ base: 0, md: 2 }}
                _before={{
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '60px',
                  background: 'linear-gradient(90deg, rgba(0,0,0,0.95), transparent)',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
                _after={{
                  content: '""',
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  bottom: 0,
                  width: '60px',
                  background: 'linear-gradient(-90deg, rgba(0,0,0,0.95), transparent)',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                <style>
                  {`
                    @keyframes scrollServicesAnim {
                      0% { transform: translateX(0); }
                      100% { transform: translateX(-50%); }
                    }
                  `}
                </style>
                <Box
                  display="flex"
                  gap={4}
                  w="max-content"
                  px={4}
                  style={{
                    animation: 'scrollServicesAnim 20s linear infinite',
                  }}
                >
                  {[
                    { icon: '🏠', text: 'House Removals', color: 'blue' },
                    { icon: '🏢', text: 'Office Moves', color: 'purple' },
                    { icon: '🛋️', text: 'Furniture Delivery', color: 'teal' },
                    { icon: '📦', text: 'Single Items', color: 'orange' },
                    { icon: '🛒', text: 'IKEA & Store', color: 'yellow' },
                    { icon: '📱', text: 'Facebook Marketplace', color: 'blue' },
                    { icon: '🏷️', text: 'Gumtree & eBay', color: 'green' },
                    { icon: '🎓', text: 'Student Moves', color: 'pink' },
                    { icon: '⚡', text: 'Same Day', color: 'red' },
                    { icon: '🚚', text: 'Man & Van', color: 'cyan' },
                    // Duplicate for seamless loop
                    { icon: '🏠', text: 'House Removals', color: 'blue' },
                    { icon: '🏢', text: 'Office Moves', color: 'purple' },
                    { icon: '🛋️', text: 'Furniture Delivery', color: 'teal' },
                    { icon: '📦', text: 'Single Items', color: 'orange' },
                    { icon: '🛒', text: 'IKEA & Store', color: 'yellow' },
                    { icon: '📱', text: 'Facebook Marketplace', color: 'blue' },
                    { icon: '🏷️', text: 'Gumtree & eBay', color: 'green' },
                    { icon: '🎓', text: 'Student Moves', color: 'pink' },
                    { icon: '⚡', text: 'Same Day', color: 'red' },
                    { icon: '🚚', text: 'Man & Van', color: 'cyan' },
                  ].map((service, idx) => (
                    <Box
                      key={idx}
                      px={4}
                      py={2}
                      borderRadius="full"
                      bg={`${service.color}.500`}
                      color="white"
                      fontSize={{ base: 'xs', md: 'sm' }}
                      fontWeight="700"
                      whiteSpace="nowrap"
                      display="flex"
                      alignItems="center"
                      gap={2}
                      flexShrink={0}
                      boxShadow={`0 4px 15px rgba(0,0,0,0.3)`}
                      _hover={{ transform: 'scale(1.05)' }}
                      transition="all 0.2s"
                    >
                      <Text as="span" fontSize={{ base: 'sm', md: 'md' }}>{service.icon}</Text>
                      <Text as="span">{service.text}</Text>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Bottom: Progress Steps - Accessible, not color-only */}
              <VStack spacing={2} w="full" role="navigation" aria-label="Booking steps">
                <HStack
                  role="list"
                  spacing={{ base: 2, md: 3 }}
                  justify="center"
                  w="full"
                  flexWrap="nowrap"
                  sx={{
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  {STEPS.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <VStack spacing={1} role="listitem" flexShrink={0}>
                        <Box
                          as="button"
                          type="button"
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
                          aria-current={step.id === currentStep ? 'step' : undefined}
                          aria-label={
                            step.id < currentStep
                              ? `Step ${step.id}: ${step.shortTitle}, completed`
                              : step.id === currentStep
                              ? `Step ${step.id}: ${step.shortTitle}, current step`
                              : `Step ${step.id}: ${step.shortTitle}`
                          }
                          disabled={step.id > currentStep}
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
                          {step.id < currentStep ? <Icon as={FaCheck} boxSize={{ base: 4, md: 5 }} aria-hidden /> : step.id}
                        </Box>
                        {/* Step Label - visible state for accessibility */}
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
                          maxW={{ base: '56px', sm: '72px', md: 'none' }}
                          noOfLines={1}
                          title={step.shortTitle}
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
              color="text.secondary"
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

          {/* Booking reference: same distinct design visible on ALL steps (1, 2, 3) */}
          {(formData.step2.bookingReference || isLoadingReference) && (
            <Box mb={{ base: 4, md: 6 }}>
              <BookingReferenceCard
                reference={formData.step2.bookingReference}
                isLoading={isLoadingReference}
                variant="bar"
              />
            </Box>
          )}

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
                <ResponsiveSection maxW="1200px" w="full">
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
                </ResponsiveSection>
              </Box>
            )}
            {currentStep === 2 && (
              <Box key="step2-items" w="full" data-booking-step="2">
                <ResponsiveSection maxW="1200px" w="full">
                <VStack spacing={6} align="stretch">
                  {/* Date & Time Selection - unified LuxurySurfaceCard */}
                  <LuxurySurfaceCard
                    id="datetime-card"
                    position="relative"
                    borderColor={errorCardId === 'datetime-card' ? 'red.400' : undefined}
                    boxShadow={errorCardId === 'datetime-card' ? '0 0 0 1px var(--chakra-colors-red-400)' : undefined}
                  >
                    <Box p={{ base: 5, md: 7 }}>
                      <VStack spacing={{ base: 6, md: 8 }} align="stretch">
                        <VStack spacing={2} textAlign="left" align="stretch">
                          <Heading size="md" color="text.primary">
                            When do you need the move?
                          </Heading>
                          <Text color="text.secondary" fontSize="sm">
                            Select your preferred date and time. We offer priority scheduling and same-day options.
                          </Text>
                          <Stack direction={{ base: 'column', sm: 'row' }} spacing={3} w="full">
                            <Button
                              variant={formData.step1.pickupDateChoice === 'known' ? 'solid' : 'outline'}
                              colorScheme={formData.step1.pickupDateChoice === 'known' ? 'green' : 'gray'}
                              leftIcon={<Icon as={FaCalendarAlt} />}
                              onClick={() => updateFormData('step1', { pickupDateChoice: 'known' })}
                              flex={1}
                              minH="48px"
                              fontSize="md"
                              _focus={{ boxShadow: '0 0 0 2px var(--chakra-colors-green-400)' }}
                            >
                              I know my date
                            </Button>
                            
                            <Button
                              variant={formData.step1.pickupDateChoice === 'unknown' ? 'solid' : 'outline'}
                              colorScheme={formData.step1.pickupDateChoice === 'unknown' ? 'purple' : 'gray'}
                              leftIcon={<Icon as={FaClock} />}
                              onClick={() => updateFormData('step1', { pickupDateChoice: 'unknown', pickupDate: '', pickupTimeSlot: undefined })}
                              flex={1}
                              minH="48px"
                              fontSize="md"
                              _focus={{ boxShadow: '0 0 0 2px var(--chakra-colors-purple-400)' }}
                            >
                              I&apos;m flexible
                            </Button>
                          </Stack>
                        </VStack>

                        {formData.step1.pickupDateChoice === 'unknown' ? (
                          <Box textAlign="center">
                            <Text color="gray.300" fontSize={{ base: "sm", md: "md" }}>
                              You&apos;re flexible — you can confirm date and time later and continue now.
                            </Text>
                          </Box>
                        ) : (
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                          <FormControl isInvalid={!!errors['step1.pickupDate']}>
                            <FormLabel htmlFor="booking-date" color="text.primary" fontSize="sm" fontWeight="600">
                              Select date
                            </FormLabel>
                            <Input
                              id="booking-date"
                              type="date"
                              value={formData.step1.pickupDate || ''}
                              min={(() => {
                                const t = new Date();
                                t.setDate(t.getDate() + 1);
                                return t.toISOString().split('T')[0];
                              })()}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const selectedDate = e.target.value;
                                updateFormData('step1', { pickupDate: selectedDate });
                                const now = new Date();
                                const selected = new Date(selectedDate);
                                const diffHours = (selected.getTime() - now.getTime()) / (1000 * 60 * 60);
                                let urgency: 'same-day' | 'next-day' | 'scheduled' = 'scheduled';
                                if (diffHours < 24) urgency = 'same-day';
                                else if (diffHours < 48) urgency = 'next-day';
                                updateFormData('step1', { urgency });
                              }}
                              bg="bg.surface"
                              borderColor="border.primary"
                              color="text.primary"
                              size="lg"
                              _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 1px var(--chakra-colors-green-400)' }}
                            />
                            {errors['step1.pickupDate'] && (
                              <Text as="span" color="red.400" fontSize="sm" mt={1} role="alert">{errors['step1.pickupDate']}</Text>
                            )}
                          </FormControl>
                          <FormControl isInvalid={!!errors['step1.pickupTime']}>
                            <FormLabel htmlFor="booking-time" color="text.primary" fontSize="sm" fontWeight="600">
                              Select time slot
                            </FormLabel>
                            <Select
                              id="booking-time"
                              value={formData.step1.pickupTimeSlot || ''}
                              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                updateFormData('step1', { pickupTimeSlot: e.target.value })}
                              placeholder="Choose a time"
                              bg="bg.surface"
                              borderColor="border.primary"
                              color="text.primary"
                              size="lg"
                              _focus={{ borderColor: 'green.400', boxShadow: '0 0 0 1px var(--chakra-colors-green-400)' }}
                            >
                              <option value="morning">8 AM – 12 PM (Morning)</option>
                              <option value="afternoon">12 PM – 4 PM (Afternoon)</option>
                              <option value="evening">4 PM – 6 PM (Evening)</option>
                              <option value="flexible">Flexible (best price)</option>
                            </Select>
                            {errors['step1.pickupTime'] && (
                              <Text as="span" color="red.400" fontSize="sm" mt={1} role="alert">{errors['step1.pickupTime']}</Text>
                            )}
                          </FormControl>
                        </SimpleGrid>
                        )}

                        <Box mt={6}>
                          <FormLabel color="text.primary" fontSize="sm" fontWeight="600" mb={3} display="block">
                            How many helpers do you need?
                          </FormLabel>
                          <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={3}>
                            {[
                              { value: '1' as const, label: '1', desc: 'Driver only' },
                              { value: '2' as const, label: '2', desc: 'Standard' },
                              { value: '3' as const, label: '3', desc: 'Large items' },
                              { value: '4' as const, label: '4', desc: 'Full house' },
                            ].map((option) => {
                              const isSelected = formData.step1.crewSize === option.value;
                              return (
                                <Button
                                  key={option.value}
                                  variant={isSelected ? 'solid' : 'outline'}
                                  colorScheme={isSelected ? 'blue' : 'gray'}
                                  size="lg"
                                  minH="56px"
                                  onClick={() => updateFormData('step1', { crewSize: option.value })}
                                  _focus={{ boxShadow: '0 0 0 2px var(--chakra-colors-blue-400)' }}
                                  aria-pressed={isSelected}
                                >
                                  <VStack spacing={0}>
                                    <Text fontWeight="bold" fontSize="lg">{option.label} men</Text>
                                    <Text fontSize="xs" opacity={0.9}>{option.desc}</Text>
                                  </VStack>
                                </Button>
                              );
                            })}
                          </SimpleGrid>
                          <Text color="text.secondary" fontSize="xs" mt={2}>
                            More helpers mean a faster move. Price adjusts by crew size.
                          </Text>
                        </Box>
                      </VStack>
                    </Box>
                  </LuxurySurfaceCard>


                  {/* Items Selection - unified LuxurySurfaceCard */}
                  <LuxurySurfaceCard
                    id="items-card"
                    position="relative"
                    borderColor={errorCardId === 'items-card' ? 'red.400' : undefined}
                    boxShadow={errorCardId === 'items-card' ? '0 0 0 1px var(--chakra-colors-red-400)' : undefined}
                    overflow="visible"
                  >
                    <WhereAndWhatStepHierarchical
                      formData={formData}
                      updateFormData={updateFormData}
                      updateSegment={updateSegment}
                      errors={errors}
                      calculatePricing={calculateComprehensivePricing}
                    />
                  </LuxurySurfaceCard>

                  {/* SINGLE Navigation Section - Bottom of Step 2 */}
                  <LuxurySurfaceCard mt={8}>
                    <Box p={{ base: 4, md: 6 }}>
                      <VStack spacing={4}>
                        {/* Status Message */}
                        {(() => {
                          const segments = (formData.step1.segments || []) as BookingSegment[];
                          const isMultiLeg = segments.length > 1;
                          const hasItems = isMultiLeg 
                            ? segments.some(s => s.items && s.items.length > 0)
                            : formData.step1.items.length > 0;
                          const hasDate = isMultiLeg
                            ? segments.every(s => s.datetime)
                            : (formData.step1.pickupDateChoice === 'unknown' || formData.step1.pickupDate);
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
                          } else if (pricingFlowState === 'loading' || isLoadingAvailability) {
                            return (
                              <Text color="blue.300" fontSize="sm" textAlign="center">
                                ⏳ Calculating your quote...
                              </Text>
                            );
                          } else if (!hasValidQuote) {
                            return (
                              <Text color="red.300" fontSize="sm" textAlign="center">
                                ❌ Quote not ready. Please retry quote before continuing.
                              </Text>
                            );
                          } else if (pricingFlowMessage) {
                            return (
                              <Text color="yellow.300" fontSize="sm" textAlign="center">
                                {pricingFlowMessage}
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

                        {pricingFlowState === 'error' && pricingFlowMessage && (
                          <Alert status="error" borderRadius="lg">
                            <AlertIcon />
                            <Box>
                              <AlertTitle>Quote needs attention</AlertTitle>
                              <AlertDescription>{pricingFlowMessage}</AlertDescription>
                              <HStack mt={3} spacing={3} flexWrap="wrap">
                                <Button
                                  size="sm"
                                  leftIcon={<FaRedo />}
                                  onClick={() => {
                                    clearPricingFailure();
                                    calculateComprehensivePricing().catch((error: unknown) => {
                                      console.error('Failed to retry quote:', error);
                                      setPricingFailure('Retry quote failed. Please check addresses/items and try again.');
                                    });
                                  }}
                                >
                                  Retry quote
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setCurrentStep(1)}>
                                  Edit addresses
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const itemsCard = document.getElementById('items-card');
                                    if (itemsCard) {
                                      itemsCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                  }}
                                >
                                  Review items
                                </Button>
                              </HStack>
                            </Box>
                          </Alert>
                        )}

                        {/* Navigation Buttons */}
                        <HStack justify="space-between" w="full" spacing={4}>
                          <Button
                            leftIcon={<FaArrowLeft />}
                            onClick={() => setCurrentStep(1)}
                            variant="outline"
                            colorScheme="gray"
                            size="lg"
                            color="text.primary"
                            borderColor="border.primary"
                            _hover={{ bg: 'bg.surface.elevated' }}
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
                              const segments = (formData.step1.segments || []) as BookingSegment[];
                              const isMultiLeg = segments.length > 1;
                              const hasItems = isMultiLeg 
                                ? segments.some(s => s.items && s.items.length > 0)
                                : formData.step1.items.length > 0;
                              const hasDate = isMultiLeg
                                ? segments.every(s => s.datetime)
                                : (formData.step1.pickupDateChoice === 'unknown' || formData.step1.pickupDate);
                              const quoteReady = pricingFlowState === 'success' && (pricingTiers?.standard?.price ?? 0) > 0;
                              return !hasItems || !hasDate || !quoteReady || isLoadingAvailability;
                            })()}
                            boxShadow={(() => {
                              const segments = (formData.step1.segments || []) as BookingSegment[];
                              const isMultiLeg = segments.length > 1;
                              const hasItems = isMultiLeg 
                                ? segments.some(s => s.items && s.items.length > 0)
                                : formData.step1.items.length > 0;
                              const hasDate = isMultiLeg
                                ? segments.every(s => s.datetime)
                                : (formData.step1.pickupDateChoice === 'unknown' || formData.step1.pickupDate);
                              const quoteReady = pricingFlowState === 'success' && (pricingTiers?.standard?.price ?? 0) > 0;
                              return hasItems && hasDate && quoteReady ? "0 4px 20px rgba(59, 130, 246, 0.4)" : "none";
                            })()}
                            _hover={(() => {
                              const segments = (formData.step1.segments || []) as BookingSegment[];
                              const isMultiLeg = segments.length > 1;
                              const hasItems = isMultiLeg 
                                ? segments.some(s => s.items && s.items.length > 0)
                                : formData.step1.items.length > 0;
                              const hasDate = isMultiLeg
                                ? segments.every(s => s.datetime)
                                : (formData.step1.pickupDateChoice === 'unknown' || formData.step1.pickupDate);
                              const quoteReady = pricingFlowState === 'success' && (pricingTiers?.standard?.price ?? 0) > 0;
                              return hasItems && hasDate && quoteReady ? {
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
                            {isLoadingAvailability ? 'Calculating quote...' : 'Get your price'}
                          </Button>
                        </HStack>
                      </VStack>
                    </Box>
                  </LuxurySurfaceCard>
                </VStack>
                </ResponsiveSection>
              </Box>
            )}
            {currentStep === 3 && (
              <Box key="step3-payment" w="full" data-booking-step="3">
                <ResponsiveSection maxW="1200px" w="full">
                <WhoAndPaymentStepSimple
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                  paymentSuccess={false}
                  capacityCheck={_capacityCheck}
                  routeSummary={_routeSummary}
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
                  onBookingCreated={handleBookingCreated}
                  quoteData={quoteResult.data ?? undefined}
                  onQuoteExpired={handleQuoteExpired}
                />
                </ResponsiveSection>
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
          const segments = (formData.step1.segments || []) as BookingSegment[];
          const isMultiLeg = segments.length > 1;
          if (isMultiLeg) {
            return segments.reduce((total, seg) => {
              const items = seg.items || [];
              return total + items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
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
            const segments = (formData.step1.segments || []) as BookingSegment[];
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
        <ModalContent bg="bg.surface" color="text.primary" maxW="900px" border="1px solid" borderColor="border.primary">
          <ModalHeader borderBottom="1px solid" borderColor="border.primary">
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
            color="text.primary" 
            _hover={{ bg: 'bg.surface.elevated' }} 
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
