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
  } = useBookingForm();


  // Enterprise Engine: Automatic availability & pricing with full addresses
  const [availabilityData, setAvailabilityData] = useState<any>(null);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [pricingTiers, setPricingTiers] = useState<{
    economy: any;
    standard: any;
    express: any;
  } | null>(null);


  // Auto-calculate availability and pricing when addresses/items change
  const calculateComprehensivePricing = useCallback(async () => {
    // Only calculate if we have addresses (items can be empty - will use default)
    if (!formData.step1.pickupAddress?.coordinates) {
      return;
    }
    
    // Skip if no items yet (will calculate when items are added)
    if (formData.step1.items.length === 0) {
      return;
    }

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
      const response = await fetch('/api/pricing/comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: formData.step1.items.map(item => ({
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
          scheduledDate: (formData.step1.pickupDate
            ? new Date(`${formData.step1.pickupDate}T09:00:00.000Z`).toISOString()
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
          serviceLevel: 'standard'
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

        console.log('✅ Enterprise Engine Pricing Tiers (STEP 2):', {
          rawBasePrice,
          basePrice,
          economy: calculatedTiers.economy.price,
          standard: calculatedTiers.standard.price,
          express: calculatedTiers.express.price,
          note: 'These exact values will be used in Step 3'
        });

      } else {
        console.error('Pricing API error:', await response.text());
      }
    } catch (error) {
      console.error('Auto-pricing calculation failed:', error);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [formData.step1]);

  // Set isClient to true after component mounts to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Removed aggressive scroll prevention that was causing multiple scroll-up issues
  // Removed duplicate pricing trigger - pricing is already triggered by items/addresses useEffect below

  // Three-tier pricing calculations (fallback for legacy)
  const calculateEconomyPrice = useCallback(() => {
    return pricingTiers?.economy?.price || 0;
  }, [pricingTiers]);

  const calculateStandardPrice = useCallback(() => {
    return pricingTiers?.standard?.price || 0;
  }, [pricingTiers]);

  const calculatePriorityPrice = useCallback(() => {
    return pricingTiers?.express?.price || 0;
  }, [pricingTiers]);

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
      
      // 🔧 FIX: Include date, time, and urgency in hash to trigger recalculation
      const currentData = JSON.stringify({
        items: formData.step1.items.map(i => ({ id: i.id, quantity: i.quantity })),
        pickup: { lat: formData.step1.pickupAddress?.coordinates?.lat, lng: formData.step1.pickupAddress?.coordinates?.lng },
        dropoff: { lat: formData.step1.dropoffAddress?.coordinates?.lat, lng: formData.step1.dropoffAddress?.coordinates?.lng },
        // ✅ NOW INCLUDES DATE/TIME/URGENCY
        scheduling: {
          date: formData.step1.pickupDate,
          timeSlot: formData.step1.pickupTimeSlot,
          urgency: formData.step1.urgency
        }
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
        const timeoutId = setTimeout(() => {
          calculatePricing().catch(error => {
            console.error('Failed to calculate pricing:', error);
          });
        }, 800); // Wait 800ms after last change before calculating
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [isClient, formData.step1, calculatePricing]);



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
      // Step 1: Just check addresses exist
      if (formData.step1.pickupAddress?.full && formData.step1.dropoffAddress?.full) {
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
      if (formData.step1.items.length === 0) {
        toast({
          title: 'Please select at least one item',
          status: 'error',
          duration: 3000,
        });
        return;
      }
      if (!formData.step1.pickupDate) {
        toast({
          title: 'Please select a pickup date',
          status: 'error',
          duration: 3000,
        });
        return;
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

  // Normalize address from autocomplete to comprehensive pricing schema
  const normalizeAddressForPricing = useCallback((addr: any) => {
    if (!addr) return null;
    
    const components = addr.components || {};
    const formatted = addr.formatted || {};
    
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
      // Match patterns like: "22", "22A", "22-24", "Flat 5, 22"
      const match = firstPart.match(/(?:Flat\s+\d+,?\s+)?(\d+[a-zA-Z]?(?:-\d+[a-zA-Z]?)?)/);
      if (match) {
        number = match[1];
      }
    }
    // If still no number, try to extract from any part of the address
    if (!number) {
      const numberMatch = full.match(/\b(\d+[a-zA-Z]?)\b/);
      if (numberMatch) {
        number = numberMatch[1];
      }
    }
    if (!number) number = '1'; // Final fallback
    
    // Extract street name with improved logic
    let street = components.route || components.road || components.street || addr.street || '';
    if (!street && firstPart) {
      // Remove number and any prefix (like "Flat 5,") to get street name
      street = firstPart
        .replace(/^(?:Flat\s+\d+,?\s+)?\d+[a-zA-Z]?(?:-\d+[a-zA-Z]?)?\s*,?\s*/, '')
        .trim();
    }
    // If street is empty but we have full address, use the first meaningful part
    if (!street && full) {
      const parts = full.split(',');
      if (parts.length > 0) {
        street = parts[0].replace(/^\d+[a-zA-Z]?\s+/, '').trim() || 'Main Street';
      }
    }
    if (!street) street = 'Main Street'; // Final fallback
    
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
    
    console.log('✅ Normalized address:', { full, line1, street, number, city, postcode, coordinates });
    
    return { full, line1, city, postcode, street, number, coordinates };
  }, []);

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
                  overflow="visible"
                  transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    inset: '-4px',
                    borderRadius: 'full',
                    padding: '4px',
                    background: 'linear-gradient(135deg, #10b981, #059669, #047857)',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    opacity: 0.5,
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
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

              {/* Bottom: Progress Steps - Enhanced Design */}
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
                                border: '3px solid transparent',
                                backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                backgroundOrigin: 'border-box',
                                backgroundClip: 'padding-box, border-box',
                                color: '#1f2937',
                                fontWeight: '700',
                                cursor: 'pointer',
                                outline: 'none',
                                appearance: 'none',
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 16px center',
                                backgroundSize: '24px',
                                paddingRight: '48px',
                                transition: 'all 0.3s',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                              }}
                            >
                              <option value="">Choose a time</option>
                              <option value="morning">8 AM - 12 PM 🌅 (Morning)</option>
                              <option value="afternoon">12 PM - 4 PM ☀️ (Afternoon)</option>
                              <option value="evening">4 PM - 6 PM 🌆 (Evening)</option>
                              <option value="flexible">Flexible ⏰ (Best Price)</option>
                            </select>
                            {errors['step1.pickupTime'] && (
                              <Text color="red.400" fontSize="sm" mt={2}>{errors['step1.pickupTime']}</Text>
                            )}
                          </Box>
                        </SimpleGrid>
                      </VStack>
                    </CardBody>
                  </Card>



                  <WhereAndWhatStepHierarchical
                    formData={formData}
                    updateFormData={updateFormData}
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
                        {formData.step1.items.length === 0 ? (
                          <Text color="yellow.300" fontSize="sm" textAlign="center">
                            ⚠️ Please select at least one item to continue
                          </Text>
                        ) : !formData.step1.pickupDate ? (
                          <Text color="yellow.300" fontSize="sm" textAlign="center">
                            ⚠️ Please select a date to continue
                          </Text>
                        ) : (
                          <Text color="green.300" fontSize="sm" textAlign="center">
                            ✅ Ready to continue - {formData.step1.items.length} items selected
                          </Text>
                        )}

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
                            isDisabled={formData.step1.items.length === 0 || !formData.step1.pickupDate}
                            boxShadow={formData.step1.items.length > 0 && formData.step1.pickupDate ? "0 4px 20px rgba(59, 130, 246, 0.4)" : "none"}
                            _hover={formData.step1.items.length > 0 && formData.step1.pickupDate ? {
                              bg: "blue.600",
                              transform: 'translateY(-2px)',
                              boxShadow: '0 6px 24px rgba(59, 130, 246, 0.5)'
                            } : {}}
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
                  validatePromotionCode={validatePromotionCode}
                  applyPromotionCode={applyPromotionCode}
                  removePromotionCode={removePromotionCode}
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
    </Box>
  );
}
