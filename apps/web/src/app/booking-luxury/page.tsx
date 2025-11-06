'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  useBreakpointValue,
  Spinner,
  SimpleGrid,
  IconButton,
} from '@chakra-ui/react';
import { FaArrowLeft, FaArrowRight, FaCheck, FaTruck, FaShieldAlt, FaClock, FaMapMarkerAlt, FaPhone, FaStar, FaPlus, FaMinus, FaExclamationTriangle, FaRedo } from 'react-icons/fa';
import Image from 'next/image';
// @ts-ignore - Temporary fix for Next.js module resolution
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AddressesStep from './components/AddressesStep';
import WhereAndWhatStep from './components/WhereAndWhatStep';
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
    title: 'Items & Time', 
    description: 'Select items and schedule',
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
  const [isClient, setIsClient] = useState<boolean>(typeof window !== 'undefined');
  const router = useRouter();
  
  // Wave effects for step headers
  const [addressWaveActive, setAddressWaveActive] = useState(false);
  const [itemsDetailsWaveActive, setItemsDetailsWaveActive] = useState(false);
  const [checkoutWaveActive, setCheckoutWaveActive] = useState(false);
  const toast = useToast();
  const searchParams = useSearchParams();
  
  // CRITICAL FIX: Prevent unwanted scroll on re-render
  const scrollPositionRef = React.useRef<number>(0);
  
  // Auto-progression flags
  const [isAutoTransitioning, setIsAutoTransitioning] = useState(false);

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
    // Only calculate if we have all required data with full addresses
    if (
      !formData.step1.pickupAddress?.coordinates ||
      formData.step1.items.length === 0 ||
      formData.step1.items.length === 0
    ) {
      return;
    }

    // Normalize addresses to consistent schema
    const pickupNorm = normalizeAddressForPricing(formData.step1.pickupAddress);
    const dropNorm = normalizeAddressForPricing(formData.step1.dropoffAddress);

    // Validate addresses have required components (street and coordinates are required, number is optional)
    if (!pickupNorm?.street || !pickupNorm?.coordinates) {
      console.warn('Incomplete pickup address - Enterprise Engine requires street and coordinates', {
        address: formData.step1.pickupAddress,
        normalized: pickupNorm,
        hasStreet: !!pickupNorm?.street,
        hasCoordinates: !!pickupNorm?.coordinates
      });
      return;
    }

    const hasCompleteDrops = Boolean(dropNorm?.street && dropNorm?.coordinates);

    if (!hasCompleteDrops) {
      console.warn('Incomplete drop addresses - Enterprise Engine requires street and coordinates');
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
            ...pickupNorm, 
            propertyType: 'house',
            // Ensure required fields are present (API requires min 1 char)
            street: pickupNorm.street && pickupNorm.street.length > 0 
              ? pickupNorm.street 
              : (pickupNorm.line1 && pickupNorm.line1.length > 0 
                ? pickupNorm.line1.replace(/^\d+[a-zA-Z]?\s+/, '').trim() || pickupNorm.line1 
                : 'Unknown Street'),
            number: pickupNorm.number && pickupNorm.number.length > 0 
              ? pickupNorm.number 
              : (pickupNorm.line1 
                ? (pickupNorm.line1.match(/^(\d+[a-zA-Z]?)/)?.[1] || '1') 
                : '1'),
            coordinates: pickupNorm.coordinates && pickupNorm.coordinates.lat && pickupNorm.coordinates.lng
              ? pickupNorm.coordinates
              : { lat: 0, lng: 0 }
          },
          dropoffs: dropNorm ? [{ 
            ...dropNorm, 
            propertyType: 'house',
            // Ensure required fields are present (API requires min 1 char)
            street: dropNorm.street && dropNorm.street.length > 0 
              ? dropNorm.street 
              : (dropNorm.line1 && dropNorm.line1.length > 0 
                ? dropNorm.line1.replace(/^\d+[a-zA-Z]?\s+/, '').trim() || dropNorm.line1 
                : 'Unknown Street'),
            number: dropNorm.number && dropNorm.number.length > 0 
              ? dropNorm.number 
              : (dropNorm.line1 
                ? (dropNorm.line1.match(/^(\d+[a-zA-Z]?)/)?.[1] || '1') 
                : '1'),
            coordinates: dropNorm.coordinates && dropNorm.coordinates.lat && dropNorm.coordinates.lng
              ? dropNorm.coordinates
              : { lat: 0, lng: 0 }
          }] : [],
          scheduledDate: (formData.step1.pickupDate
            ? new Date(`${formData.step1.pickupDate}T09:00:00.000Z`).toISOString()
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()),
          serviceLevel: 'standard'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Extract availability and pricing
        setAvailabilityData(data.data.availability);
        
        // Calculate three-tier pricing
        const basePrice = data.data.amountGbpMinor / 100; // Convert from pence
        
        setPricingTiers({
          economy: {
            price: Math.round(basePrice * 0.85), // 15% discount for multi-drop
            available: data.data.availability?.economy?.next_available_date,
            availability: data.data.availability?.economy
          },
          standard: {
            price: Math.round(basePrice),
            available: data.data.availability?.standard?.next_available_date,
            availability: data.data.availability?.standard
          },
          express: {
            price: Math.round(basePrice * 1.5), // 50% premium for express
            available: data.data.availability?.express?.next_available_date,
            availability: data.data.availability?.express
          }
        });

        console.log('✅ Enterprise Engine: Full-address availability calculated', {
          availability: data.data.availability,
          pickup: { city: formData.step1.pickupAddress.city },
          dropCount: 1 // Single dropoff for now
        });

      } else {
        console.error('Pricing API error:', await response.text());
      }
    } catch (error) {
      console.error('Auto-pricing calculation failed:', error);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [
    formData.step1.pickupAddress?.address,
    formData.step1.pickupAddress?.houseNumber,
    formData.step1.pickupAddress?.coordinates,
    formData.step1.dropoffAddress,
    formData.step1.items
  ]);

  // Auto-trigger pricing when relevant data changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateComprehensivePricing();
    }, 500); // Debounce API calls

    return () => clearTimeout(timeoutId);
  }, [calculateComprehensivePricing]);

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

  // Calculate pricing whenever items or addresses change (only if both addresses are available with coordinates)
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
      calculatePricing().catch(error => {
        console.error('Failed to calculate pricing:', error);
      });
    }
  }, [isClient, formData.step1.items, formData.step1.pickupAddress, formData.step1.dropoffAddress, calculatePricing]);



  // Handle URL parameters on page load
  useEffect(() => {
    if (!isClient) return;
    
    const step = searchParams?.get('step');
    const paymentStatus = searchParams?.get('payment');
    const sessionId = searchParams?.get('session_id');

    // Check if we're coming from a successful payment and should show success page
    const savedPaymentSuccess = localStorage.getItem('speedy_van_payment_success');
    const savedSessionId = localStorage.getItem('speedy_van_session_id');

    // Redirect to success page if payment was successful
    if (paymentStatus === 'success' || (savedPaymentSuccess === 'true' && savedSessionId)) {
      
      // Clear localStorage
      localStorage.removeItem('speedy_van_payment_success');
      localStorage.removeItem('speedy_van_session_id');

      // Redirect to dedicated success page
      const successUrl = `/booking-luxury/success?session_id=${sessionId || savedSessionId}`;
      window.location.href = successUrl;
      return;
    }

    if (paymentStatus === 'cancelled') {
      setCurrentStep(2); // Go back to payment step
      
      toast({
        title: 'Payment Cancelled',
        description: 'Your payment was cancelled. You can try again when ready.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
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
    const isValid = await validateStep(currentStep);
    if (isValid) {
      if (currentStep < STEPS.length) {
        setIsAutoTransitioning(true);
        
        // Smooth transition delay
        setTimeout(() => {
          setCurrentStep(currentStep + 1);
          clearErrors();
          setIsAutoTransitioning(false);
        }, 300);
      }
    } else {
      toast({
        title: 'Please complete all required fields',
        description: 'Please fill in all required information before proceeding.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };
  
  // Smart auto-progression: When step 1 addresses are complete, auto-advance
  useEffect(() => {
    // CRITICAL: Validate addresses are truly complete before auto-advance
    const isPickupComplete = formData.step1.pickupAddress?.full && 
                            formData.step1.pickupAddress?.postcode &&
                            formData.step1.pickupAddress?.coordinates?.lat !== 0;
    const isDropoffComplete = formData.step1.dropoffAddress?.full && 
                             formData.step1.dropoffAddress?.postcode &&
                             formData.step1.dropoffAddress?.coordinates?.lat !== 0;
    
    if (currentStep === 1 && 
        isPickupComplete && 
        isDropoffComplete &&
        !isAutoTransitioning) {
      // Validate step before auto-advance
      const timer = setTimeout(async () => {
        const isValid = await validateStep(1);
        if (isValid) {
          console.log('✅ Step 1 validated - Auto-advancing to Step 2');
          setIsAutoTransitioning(true);
          setTimeout(() => {
            setCurrentStep(2);
            clearErrors();
            setIsAutoTransitioning(false);
          }, 300);
        } else {
          console.log('⚠️ Step 1 validation failed - not auto-advancing');
        }
      }, 800); // Give user time to see completion
      
      return () => clearTimeout(timer);
    }
  }, [formData.step1.pickupAddress, formData.step1.dropoffAddress, currentStep, isAutoTransitioning, validateStep, clearErrors]);

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      clearErrors();
    }
  };

  // Normalize address from autocomplete to comprehensive pricing schema
  const normalizeAddressForPricing = useCallback((addr: any) => {
    if (!addr) return null;
    const components = addr.components || {};
    const formatted = addr.formatted || {};
    
    // Extract full address from multiple possible locations (FIRST - needed by other extractions)
    const full = 
      addr.formatted_address || 
      addr.fullAddress || 
      addr.full ||
      addr.place_name || 
      addr.displayText || 
      addr.address || 
      '';
    
    // Extract street from multiple possible locations
    // Try to extract from line1 if street is not directly available
    let street = 
      addr.street || 
      addr.address || 
      formatted.street || 
      components.street || 
      components.route || 
      components.road ||
      '';
    
    // If street is still empty, try to extract from line1 (remove house number)
    if (!street && addr.line1) {
      // Remove house number from line1 (e.g., "3 Savile Row" -> "Savile Row")
      const line1WithoutNumber = addr.line1.replace(/^\d+[a-zA-Z]?\s+/, '').trim();
      if (line1WithoutNumber) {
        street = line1WithoutNumber.split(',')[0].trim();
      }
    }
    
    // If still empty, use line1 as fallback
    if (!street && addr.line1) {
      street = addr.line1.split(',')[0].trim();
    }
    
    // Extract house number from multiple possible locations
    // If not found directly, try to extract from line1
    let number = 
      addr.houseNumber || 
      addr.number || 
      formatted.houseNumber ||
      components.house_number || 
      components.street_number || 
      '';
    
    // If number is still empty, try to extract from line1 (e.g., "3 Savile Row" -> "3")
    if (!number && addr.line1) {
      const line1Match = addr.line1.match(/^(\d+[a-zA-Z]?)\s/);
      if (line1Match) {
        number = line1Match[1];
      }
    }
    
    // If still empty, try to extract from full address
    if (!number && full) {
      const fullMatch = full.match(/^(\d+[a-zA-Z]?)\s/);
      if (fullMatch) {
        number = fullMatch[1];
      }
    }
    
    // Extract city from multiple possible locations
    const city = 
      addr.city || 
      components.city || 
      components.locality || 
      components.post_town || 
      '';
    
    // Extract postcode from multiple possible locations
    const postcode = 
      addr.postcode || 
      components.postcode || 
      components.postal_code || 
      '';
    
    // Extract line1 from multiple possible locations
    const line1 = 
      addr.line1 || 
      street || 
      addr.address || 
      '';
    
    // Extract coordinates from multiple possible locations
    const coordinates = 
      addr.coordinates || 
      addr.location || 
      null;
    
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
  const isMobile = useBreakpointValue({ base: true, md: false });

  // CRITICAL FIX: Save and restore scroll position on re-render
  useEffect(() => {
    // Save scroll position before re-render
    const saveScrollPosition = () => {
      scrollPositionRef.current = window.scrollY || window.pageYOffset || 0;
    };
    
    // Save on scroll
    window.addEventListener('scroll', saveScrollPosition, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', saveScrollPosition);
    };
  }, []);
  
  // CRITICAL FIX: Restore scroll position after re-render (prevent jump to bottom)
  useEffect(() => {
    // Restore scroll position if it changed unexpectedly
    const currentScroll = window.scrollY || window.pageYOffset || 0;
    const savedScroll = scrollPositionRef.current;
    
    // If scroll jumped unexpectedly (more than 100px), restore it
    if (Math.abs(currentScroll - savedScroll) > 100 && savedScroll > 0) {
      window.scrollTo({
        top: savedScroll,
        behavior: 'auto' // Instant restore, no smooth scrolling
      });
    }
  });

  // Do not block UI on hydration; guard browser-only APIs inside effects

  return (
    <Box 
      display="block" 
      w="100%" 
      minH="100dvh" 
      bg={bgColor} 
      py={{ base: 2, md: 8 }} 
      pb={{ base: "100px", md: 8 }}
      overflowX="hidden"
      overflowY="auto"
      sx={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'none',
        scrollBehavior: 'auto', // Prevent smooth scroll jumps
      }}
    >
      <Container maxW={{ base: "full", md: "6xl" }} px={{ base: 2, md: 6 }}>
        <Box 
          display="block" 
          w="100%" 
          py={{ base: 4, md: 8 }}
          sx={{
            '& > *': {
              display: 'block',
              width: '100%',
              marginBottom: { base: '16px', md: '32px' },
            },
            '& > *:last-child': {
              marginBottom: 0,
            },
          }}
        >
          {/* SIMPLIFIED STICKY HEADER - Modern & Clean - MOBILE SAFARI FIX */}
          <Box
            position="sticky"
            top={0}
            zIndex={100}
            bg="rgba(13, 13, 13, 0.95)"
            backdropFilter="blur(10px)"
            borderBottom="1px solid"
            borderColor="rgba(59, 130, 246, 0.2)"
            py={3}
            mb={6}
            sx={{
              // CRITICAL: Force horizontal layout on all devices
              display: 'flex !important',
              flexDirection: 'row !important',
              writingMode: 'horizontal-tb !important',
              textOrientation: 'mixed !important',
            }}
          >
            <Flex 
              justify="space-between" 
              align="center" 
              px={{ base: 4, md: 6 }}
              w="full"
              direction="row"
              sx={{
                // CRITICAL: Ensure horizontal layout
                flexDirection: 'row !important',
                alignItems: 'center !important',
                whiteSpace: 'nowrap',
              }}
            >
              {/* Left: Brand & Back */}
              <HStack 
                spacing={3}
                sx={{
                  flexDirection: 'row !important',
                  alignItems: 'center !important',
                }}
              >
                {currentStep === 1 && (
                  <IconButton
                    aria-label="Back to home"
                    icon={<FaArrowLeft />}
                    size="sm"
                    variant="ghost"
                    color="gray.400"
                    onClick={() => router.push('/')}
                    _hover={{ color: 'white', bg: 'rgba(255, 255, 255, 0.1)' }}
                  />
                )}
                <HStack 
                  spacing={2}
                  sx={{
                    flexDirection: 'row !important',
                    alignItems: 'center !important',
                  }}
                >
                  <Icon as={FaTruck} boxSize={6} color="blue.400" />
                  <Heading 
                    size="md" 
                    color="white"
                    sx={{
                      writingMode: 'horizontal-tb !important',
                      textOrientation: 'mixed !important',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Speedy Van
                  </Heading>
                </HStack>
              </HStack>

              {/* Right: Progress Steps */}
              <HStack 
                spacing={2}
                sx={{
                  flexDirection: 'row !important',
                  alignItems: 'center !important',
                }}
              >
                {STEPS.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <Box
                      w={{ base: '30px', md: '36px' }}
                      h={{ base: '30px', md: '36px' }}
                      borderRadius="full"
                      bg={
                        step.id === currentStep 
                          ? 'blue.500'
                          : step.id < currentStep 
                          ? 'green.500'
                          : 'gray.700'
                      }
                      color="white"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="sm"
                      fontWeight="bold"
                      cursor={step.id <= currentStep ? 'pointer' : 'default'}
                      onClick={() => step.id <= currentStep && handleStepClick(step.id)}
                      transition="all 0.2s"
                      _hover={step.id <= currentStep ? { transform: 'scale(1.1)' } : {}}
                      sx={{
                        // Force flex layout
                        display: 'flex !important',
                        alignItems: 'center !important',
                        justifyContent: 'center !important',
                      }}
                    >
                      {step.id < currentStep ? <Icon as={FaCheck} boxSize={3} /> : step.id}
                    </Box>
                    {index < STEPS.length - 1 && (
                      <Box 
                        w={{ base: '20px', md: '30px' }} 
                        h="2px" 
                        bg={step.id < currentStep ? 'green.500' : 'gray.700'}
                        transition="all 0.3s"
                        sx={{
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </HStack>
            </Flex>
          </Box>



          {/* Step Title */}
          <Box mb={6} textAlign="center">
            <Heading 
              size="xl" 
              color="white"
              fontWeight="600"
              mb={2}
            >
              {STEPS[currentStep - 1]?.title}
            </Heading>
            <Text fontSize="md" color="gray.400">
              {STEPS[currentStep - 1]?.description}
            </Text>
          </Box>

          {/* Main Content with Smooth Transitions - Framer Motion */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1] // Smooth easing like Uber
              }}
              style={{ width: '100%' }}
            >
              <Box w="full">
                {currentStep === 1 ? (
                  <AddressesStep
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={errors}
                    onNext={handleNext}
                  />
                ) : currentStep === 2 ? (
                  <WhereAndWhatStep
                    formData={formData}
                    updateFormData={updateFormData}
                    errors={errors}
                    onNext={handleNext}
                    onBack={() => setCurrentStep(1)}
                    calculatePricing={calculateComprehensivePricing}
                    pricingTiers={pricingTiers}
                    availabilityData={availabilityData}
                    isLoadingAvailability={isLoadingAvailability}
                  />
                ) : currentStep === 3 ? (
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
                ) : null}
              </Box>
            </motion.div>
          </AnimatePresence>


          {/* Simplified Error Display */}
          {Object.keys(errors).length > 0 && (
            <Alert 
              status="error" 
              borderRadius="xl"
              bg="rgba(220, 38, 38, 0.1)"
              border="1px solid"
              borderColor="rgba(220, 38, 38, 0.3)"
              mt={4}
            >
              <AlertIcon color="red.400" />
              <Box>
                <AlertTitle fontSize="sm" color="white" mb={1}>Please fix errors</AlertTitle>
                <AlertDescription>
                  <Text fontSize="xs" color="gray.300">
                    {Object.values(errors)[0]}
                  </Text>
                </AlertDescription>
              </Box>
            </Alert>
          )}
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
