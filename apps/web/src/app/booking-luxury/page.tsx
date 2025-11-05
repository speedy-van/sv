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
import WhereAndWhatStep from './components/WhereAndWhatStep';
import WhoAndPaymentStep from './components/WhoAndPaymentStep';
import { useBookingForm } from './hooks/useBookingForm';

// Removed ItemImage component - using icons instead

const STEPS = [
  { 
    id: 1, 
    title: 'What, Where & When', 
    description: 'Select items, addresses, date and time',
    icon: FaTruck,
    shortTitle: 'Items & Details',
    color: 'blue'
  },
  { 
    id: 2, 
    title: 'Customer & Payment', 
    description: 'Enter details and payment',
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
  const [itemsDetailsWaveActive, setItemsDetailsWaveActive] = useState(false);
  const [checkoutWaveActive, setCheckoutWaveActive] = useState(false);
  const toast = useToast();
  const searchParams = useSearchParams();

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

  // Auto-save functionality
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

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
      console.warn('Incomplete pickup address - Enterprise Engine requires street and coordinates');
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
          pickup: { ...pickupNorm, propertyType: 'house' },
          dropoffs: [{ ...dropNorm, propertyType: 'house' }],
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
      setItemsDetailsWaveActive(true);
      setCheckoutWaveActive(false);
    } else if (currentStep === 2) {
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

  // Auto-save form data to localStorage
  useEffect(() => {
    if (!isClient) return;
    
    const saveFormData = async () => {
      if (!formData) return;
      
      setIsSaving(true);
      try {
        localStorage.setItem('speedy_van_booking_draft', JSON.stringify({
          ...formData,
          currentStep,
          savedAt: new Date().toISOString(),
        }));
        setLastSaved(new Date());
        
        // Show subtle save confirmation (only on mobile)
        if (window.innerWidth < 768) {
          toast({
            title: 'Draft saved',
            status: 'success',
            duration: 1000,
            isClosable: false,
            position: 'top',
            size: 'sm',
          });
        }
      } catch (error) {
        console.error('Failed to save draft:', error);
      } finally {
        setIsSaving(false);
      }
    };

    // Debounce auto-save
    const timeoutId = setTimeout(saveFormData, 2000);
    return () => clearTimeout(timeoutId);
  }, [formData, currentStep, toast, isClient]);

  // Load saved draft on component mount
  useEffect(() => {
    if (draftRestored) return; // Prevent duplicate notifications

    try {
      const savedDraft = localStorage.getItem('speedy_van_booking_draft');
      if (savedDraft) {
        const draftData = JSON.parse(savedDraft);
        const savedDate = new Date(draftData.savedAt);
        
        // Only restore if saved within last 24 hours
        const hoursSinceLastSave = (new Date().getTime() - savedDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastSave < 24 && draftData.currentStep) {
          toast({
            title: 'Draft restored',
            description: `Your booking draft from ${savedDate.toLocaleString()} has been restored.`,
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
          setCurrentStep(draftData.currentStep);
          setLastSaved(savedDate);
          // Restore form data (including images for items)
          if (draftData.step1) {
            try {
              const restoredItems = Array.isArray(draftData.step1.items)
                ? draftData.step1.items.map((it: any) => ({
                    ...it,
                    // Ensure image is preserved if present in draft; do not inject a fallback here
                    image: typeof it?.image === 'string' ? it.image : (typeof it?.itemImage === 'string' ? it.itemImage : ''),
                  }))
                : [];
              updateFormData('step1', {
                ...draftData.step1,
                items: restoredItems,
              });
            } catch (e) {
              console.warn('Failed to restore step1 from draft:', e);
            }
          }
          if (draftData.step2) {
            try {
              updateFormData('step2', { ...draftData.step2 });
            } catch (e) {
              console.warn('Failed to restore step2 from draft:', e);
            }
          }
          setDraftRestored(true); // Mark as restored to prevent duplicates
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  }, [toast, isClient, draftRestored]);

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
        // Pricing is now handled automatically - no manual intervention required
        
        setCurrentStep(currentStep + 1);
        clearErrors();
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
    const street = addr.street || addr.address || components.street || components.route || components.road || '';
    const number = addr.houseNumber || addr.number || components.house_number || components.street_number || '';
    const city = addr.city || components.city || components.locality || components.post_town || '';
    const postcode = addr.postcode || components.postcode || components.postal_code || '';
    const full = addr.formatted_address || addr.fullAddress || addr.place_name || addr.displayText || addr.address || '';
    const line1 = addr.line1 || street || addr.address || '';
    const coordinates = addr.coordinates || addr.location || null;
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
      }}
    >
      <Container maxW="6xl" px={{ base: 4, md: 6 }}>
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
          {/* PREMIUM HEADER - ENHANCED GLASSMORPHISM */}
          <Card 
            bg="linear-gradient(135deg, rgba(26, 32, 44, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)"
            backdropFilter="blur(20px) saturate(180%)"
            shadow="0 8px 32px rgba(147, 51, 234, 0.4), 0 0 60px rgba(147, 51, 234, 0.3), 0 0 100px rgba(147, 51, 234, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            borderRadius="2xl"
            border="2px solid"
            borderColor="rgba(147, 51, 234, 0.5)"
            position="relative"
            overflow="hidden"
            w="full"
            mx={0}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
              shadow: "0 12px 40px rgba(147, 51, 234, 0.5), 0 0 80px rgba(147, 51, 234, 0.4), 0 0 120px rgba(147, 51, 234, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
              borderColor: "rgba(147, 51, 234, 0.7)",
              transform: "translateY(-2px)",
            }}
            sx={{
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(16, 185, 129, 0.05) 100%)',
                opacity: 0.6,
                zIndex: 1,
                pointerEvents: 'none',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
                animation: 'shine 6s infinite',
                zIndex: 2,
                pointerEvents: 'none',
              },
              '@keyframes shine': {
                '0%': { left: '-100%' },
                '100%': { left: '200%' },
              },
              '& > *': {
                position: 'relative',
                zIndex: 3,
              },
            }}
          >
            <CardBody p={0} px={{ base: 3, sm: 4, md: 8 }} py={{ base: 4, md: 8 }}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={{ base: 3, md: 6 }}>
                {/* LEFT: Brand + Step Navigation */}
                <HStack spacing={{ base: 3, md: 8 }} flexWrap="wrap">
                  {currentStep === 1 && (
                    <Button
                      size={{ base: 'sm', md: 'md' }}
                      variant="outline"
                      colorScheme="gray"
                      onClick={() => router.push('/')}
                      bg="rgba(255, 255, 255, 0.05)"
                      borderColor="rgba(255, 255, 255, 0.2)"
                      color="white"
                      fontWeight="semibold"
                      borderRadius="lg"
                      px={{ base: 2, md: 4 }}
                      py={{ base: 1, md: 2 }}
                      fontSize={{ base: 'xs', md: 'sm' }}
                      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      _hover={{
                        bg: "rgba(255, 255, 255, 0.1)",
                        borderColor: "rgba(255, 255, 255, 0.3)",
                        transform: "translateY(-1px)",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                      }}
                      _active={{
                        transform: "translateY(0)",
                      }}
                    >
                      ← Back to Home
                    </Button>
                  )}
                  <HStack spacing={{ base: 2, md: 4 }}>
                    <Box
                      position="relative"
                      w={{ base: '40px', md: '56px' }}
                      h={{ base: '40px', md: '56px' }}
                      borderRadius="xl"
                      bg="linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.3) 100%)"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 4px 20px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                      border="1px solid"
                      borderColor="rgba(59, 130, 246, 0.5)"
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      _hover={{
                        transform: "scale(1.05) rotate(5deg)",
                        boxShadow: "0 6px 30px rgba(59, 130, 246, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                      }}
                    >
                      <Icon as={FaTruck} boxSize={{ base: 5, md: 7 }} color="blue.300" filter="drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5))" />
                    </Box>
                    <VStack align="start" spacing={{ base: 1, md: 2 }}>
                      <Heading 
                        size={{ base: 'md', md: 'lg' }} 
                        color="white"
                        fontWeight="700"
                        letterSpacing="0.5px"
                        textShadow="0 2px 8px rgba(0, 0, 0, 0.3)"
                        bg="linear-gradient(135deg, #FFFFFF 0%, #E0E7FF 100%)"
                        bgClip="text"
                        sx={{
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                        }}
                      >
                        Speedy Van
                      </Heading>
                      <HStack spacing={{ base: 1.5, md: 3 }} flexWrap="wrap">
                        <Badge 
                          bg="linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.3) 100%)"
                          color="blue.200"
                          fontSize={{ base: '2xs', sm: 'xs' }}
                          fontWeight="semibold"
                          px={{ base: 1.5, sm: 2, md: 3 }}
                          py={{ base: 0.5, md: 1 }}
                          borderRadius="full"
                          border="1px solid"
                          borderColor="rgba(59, 130, 246, 0.4)"
                          boxShadow="0 2px 8px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                          backdropFilter="blur(10px)"
                          transition="all 0.2s"
                          _hover={{
                            transform: "translateY(-1px)",
                            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                          }}
                        >
                          <Icon as={FaShieldAlt} mr={{ base: 0.5, md: 1.5 }} boxSize={{ base: 2.5, md: 3 }} />
                          <Text as="span" display={{ base: 'none', sm: 'inline' }}>Fully Insured</Text>
                          <Text as="span" display={{ base: 'inline', sm: 'none' }}>Insured</Text>
                        </Badge>
                        <Badge 
                          bg="linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.3) 100%)"
                          color="yellow.200"
                          fontSize={{ base: '2xs', sm: 'xs' }}
                          fontWeight="semibold"
                          px={{ base: 1.5, sm: 2, md: 3 }}
                          py={{ base: 0.5, md: 1 }}
                          borderRadius="full"
                          border="1px solid"
                          borderColor="rgba(251, 191, 36, 0.4)"
                          boxShadow="0 2px 8px rgba(251, 191, 36, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                          backdropFilter="blur(10px)"
                          transition="all 0.2s"
                          _hover={{
                            transform: "translateY(-1px)",
                            boxShadow: "0 4px 12px rgba(251, 191, 36, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                          }}
                        >
                          <Icon as={FaStar} mr={{ base: 0.5, md: 1.5 }} boxSize={{ base: 2.5, md: 3 }} />
                          <Text as="span" display={{ base: 'none', sm: 'inline' }}>5-Star Rated</Text>
                          <Text as="span" display={{ base: 'inline', sm: 'none' }}>5-Star</Text>
                        </Badge>
                      </HStack>
                    </VStack>
                  </HStack>
                  
                  {/* SINGLE PROGRESS INDICATOR - Step Navigation Only */}
                  <HStack spacing={4} display={{ base: 'none', lg: 'flex' }}>
                    {STEPS.map((step, index) => (
                      <React.Fragment key={step.id}>
                        <HStack 
                          spacing={3}
                          cursor={step.id <= currentStep ? 'pointer' : 'default'}
                          onClick={() => step.id <= currentStep && handleStepClick(step.id)}
                          _hover={step.id <= currentStep ? { transform: 'translateY(-1px)' } : {}}
                          transition="all 0.2s"
                        >
                          <Circle 
                            size="40px" 
                            bg={
                              step.id === currentStep 
                                ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)'
                                : step.id < currentStep 
                                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)'
                                : 'rgba(75, 85, 99, 0.3)'
                            }
                            color={step.id <= currentStep ? 'white' : 'gray.400'}
                            fontSize="sm"
                            fontWeight="bold"
                            boxShadow={
                              step.id === currentStep 
                                ? '0 4px 20px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 0 0 3px rgba(59, 130, 246, 0.2)'
                                : step.id < currentStep
                                ? '0 4px 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                                : '0 2px 8px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            }
                            border="2px solid"
                            borderColor={
                              step.id === currentStep 
                                ? 'rgba(59, 130, 246, 0.6)'
                                : step.id < currentStep
                                ? 'rgba(16, 185, 129, 0.6)'
                                : 'rgba(255, 255, 255, 0.1)'
                            }
                            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                            _hover={step.id <= currentStep ? {
                              transform: "scale(1.1)",
                              boxShadow: step.id === currentStep 
                                ? '0 6px 30px rgba(59, 130, 246, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 0 0 4px rgba(59, 130, 246, 0.3)'
                                : '0 6px 30px rgba(16, 185, 129, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
                            } : {}}
                          >
                            {step.id < currentStep ? <Icon as={FaCheck} boxSize={4} /> : 
                             step.id === currentStep ? <Icon as={step.icon} boxSize={4} /> :
                             step.id}
                          </Circle>
                          <VStack align="start" spacing={0}>
                            <Text 
                              fontSize="md" 
                              fontWeight={step.id === currentStep ? 'bold' : 'medium'}
                              color={
                                step.id === currentStep ? 'blue.400' : 
                                step.id < currentStep ? 'green.400' : 
                                'gray.400'
                              }
                              position="relative"
                              _before={(step.id === 1 && itemsDetailsWaveActive) ? {
                                content: '""',
                                position: 'absolute',
                                top: '0',
                                left: '-5px',
                                width: 'calc(100% + 10px)',
                                height: '100%',
                                background: 'linear-gradient(270deg, transparent, rgba(34, 197, 94, 0.5), transparent)',
                                backgroundSize: '200% 100%',
                                animation: 'itemsDetailsWaveMove 3s linear infinite',
                                zIndex: 1,
                                borderRadius: '4px'
                              } : (step.id === 2 && checkoutWaveActive) ? {
                                content: '""',
                                position: 'absolute',
                                top: '0',
                                left: '-5px',
                                width: 'calc(100% + 10px)',
                                height: '100%',
                                background: 'linear-gradient(270deg, transparent, rgba(34, 197, 94, 0.5), transparent)',
                                backgroundSize: '200% 100%',
                                animation: 'checkoutWaveMove 3s linear infinite',
                                zIndex: 1,
                                borderRadius: '4px'
                              } : {}}
                              sx={{
                                '@keyframes itemsDetailsWaveMove': {
                                  '0%': { backgroundPosition: '200% 0' },
                                  '100%': { backgroundPosition: '-200% 0' }
                                },
                                '@keyframes checkoutWaveMove': {
                                  '0%': { backgroundPosition: '200% 0' },
                                  '100%': { backgroundPosition: '-200% 0' }
                                }
                              }}
                            >
                              {step.shortTitle}
                            </Text>
                            <Text 
                              fontSize="xs" 
                              color="gray.400"
                              position="relative"
                              _before={(step.id === 2 && currentStep === 1) ? {
                                content: '""',
                                position: 'absolute',
                                top: '0',
                                left: '-3px',
                                width: 'calc(100% + 6px)',
                                height: '100%',
                                background: 'linear-gradient(270deg, transparent, rgba(239, 68, 68, 0.5), transparent)',
                                backgroundSize: '200% 100%',
                                animation: 'pendingWaveMove 3s linear infinite',
                                zIndex: 1,
                                borderRadius: '3px'
                              } : {}}
                              sx={{
                                '@keyframes pendingWaveMove': {
                                  '0%': { backgroundPosition: '200% 0' },
                                  '100%': { backgroundPosition: '-200% 0' }
                                }
                              }}
                            >
                              {step.id < currentStep ? 'Complete' : 
                               step.id === currentStep ? 'Active' : 
                               'Pending'}
                            </Text>
                          </VStack>
                        </HStack>
                        {index < STEPS.length - 1 && (
                          <Box 
                            w="50px" 
                            h="3px" 
                            bg={
                              step.id < currentStep 
                                ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.8) 0%, rgba(5, 150, 105, 0.8) 100%)'
                                : 'rgba(75, 85, 99, 0.3)'
                            }
                            borderRadius="full"
                            boxShadow={
                              step.id < currentStep
                                ? '0 2px 8px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                                : '0 1px 4px rgba(0, 0, 0, 0.2)'
                            }
                            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                            position="relative"
                            overflow="hidden"
                            _before={step.id < currentStep ? {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                              animation: 'pulse 2s infinite',
                            } : {}}
                            sx={{
                              '@keyframes pulse': {
                                '0%, 100%': { left: '-100%' },
                                '50%': { left: '100%' },
                              },
                            }}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </HStack>
                </HStack>


              </Flex>

              {/* ENHANCED TITLE SECTION */}
              <Box mt={8} textAlign="center" position="relative">
                <Box
                  position="absolute"
                  top="50%"
                  left="50%"
                  transform="translate(-50%, -50%)"
                  w="200px"
                  h="200px"
                  borderRadius="full"
                  bg="radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, transparent 70%)"
                  filter="blur(40px)"
                  zIndex={0}
                />
                <VStack spacing={3} position="relative" zIndex={1}>
                  <Heading 
                    size="2xl" 
                    fontWeight="700"
                    letterSpacing="0.5px"
                    bg="linear-gradient(135deg, #FFFFFF 0%, #E0E7FF 50%, #C7D2FE 100%)"
                    bgClip="text"
                    sx={{
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      textShadow: "0 4px 20px rgba(147, 51, 234, 0.3)",
                    }}
                  >
                  Your Move Plan
                  </Heading>
                  <Text 
                    fontSize="lg" 
                    color="gray.300"
                    fontWeight="500"
                    letterSpacing="0.3px"
                  >
                  Step {currentStep}: {STEPS[currentStep - 1]?.title}
                  </Text>
                </VStack>
              </Box>
            </CardBody>
          </Card>



          {/* Main Content - Enhanced Glassmorphism */}
          <Card 
            bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
            backdropFilter="blur(20px) saturate(180%)"
            shadow="0 8px 32px rgba(128, 90, 213, 0.4), 0 0 60px rgba(128, 90, 213, 0.3), 0 0 100px rgba(128, 90, 213, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            borderRadius="2xl"
            overflow="hidden"
            border="2px solid"
            borderColor="rgba(128, 90, 213, 0.5)"
            data-step="items"
            w="full"
            mx={0}
            position="relative"
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
              shadow: "0 12px 40px rgba(128, 90, 213, 0.5), 0 0 80px rgba(128, 90, 213, 0.4), 0 0 120px rgba(128, 90, 213, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
              borderColor: "rgba(128, 90, 213, 0.7)",
              transform: "translateY(-2px)",
            }}
            sx={{
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(128, 90, 213, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(16, 185, 129, 0.05) 100%)',
                opacity: 0.6,
                zIndex: 0,
                pointerEvents: 'none',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
                animation: 'shine 8s infinite',
                zIndex: 1,
                pointerEvents: 'none',
              },
              '@keyframes shine': {
                '0%': { left: '-100%' },
                '100%': { left: '200%' },
              },
              '& > *': {
                position: 'relative',
                zIndex: 2,
              },
            }}
          >
            <CardBody p={0}>
              {currentStep === 1 ? (
                <WhereAndWhatStep
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={errors}
                  onNext={() => setCurrentStep(2)}
                  pricingTiers={pricingTiers}
                  availabilityData={availabilityData}
                  isLoadingAvailability={isLoadingAvailability}
                />
              ) : currentStep === 2 ? (
                <WhoAndPaymentStep
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
            </CardBody>
          </Card>


          {/* Enhanced Error Display */}
          {Object.keys(errors).length > 0 && (
            <Card bg="red.50" borderColor="red.200" borderWidth="2px" borderRadius="2xl">
              <CardBody p={{ base: 4, md: 6 }}>
                <Alert status="error" borderRadius="xl" bg="transparent" border="none">
                  <AlertIcon boxSize={{ base: 4, md: 6 }} />
                  <Box>
                    <AlertTitle fontSize={{ base: "md", md: "lg" }} mb={2}>Please fix the following errors:</AlertTitle>
                    <AlertDescription>
                      <VStack align="start" spacing={2}>
                        {Object.entries(errors).map(([field, error]) => (
                          <HStack key={field} spacing={2} align="start">
                            <Text color="red.500" fontSize={{ base: "xs", md: "sm" }}>•</Text>
                            <Text fontSize={{ base: "xs", md: "sm" }} color="red.700">
                              {error}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    </AlertDescription>
                  </Box>
                </Alert>
              </CardBody>
            </Card>
          )}
        </Box>
      </Container>

      {/* Inline Back button (non-sticky) */}
      {currentStep === STEPS.length && (
        <Box mt={6} pb={6}>
          <Container maxW="6xl">
            <Button
              leftIcon={<FaArrowLeft />}
              onClick={handlePrevious}
              variant="outline"
              size="md"
              colorScheme="gray"
              w="full"
              minH="44px"
            >
              Back to Step 1
            </Button>
          </Container>
        </Box>
      )}

      {/* Bottom navigation removed as per request */}
    </Box>
  );
}
