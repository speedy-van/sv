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
    <Box minH="100vh" bg={bgColor} py={{ base: 2, md: 8 }} pb={{ base: "100px", md: 8 }}>
      <Container maxW="6xl">
        <VStack spacing={{ base: 4, md: 8 }} align="stretch" py={{ base: 4, md: 8 }}>
          {/* PREMIUM HEADER - NEON GLOW */}
          <Card 
            bg="rgba(26, 32, 44, 0.95)" 
            backdropFilter="blur(10px)"
            shadow="0 0 40px rgba(147, 51, 234, 0.6), 0 0 80px rgba(147, 51, 234, 0.3), 0 0 120px rgba(147, 51, 234, 0.1)" 
            borderRadius="2xl" 
            border="2px" 
            borderColor="purple.400"
            position="relative"
            overflow="hidden"
            sx={{
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent)',
                animation: 'shine 4s infinite',
                zIndex: 1,
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
            <CardBody p={{ base: 6, md: 8 }}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={6}>
                {/* LEFT: Brand + Step Navigation */}
                <HStack spacing={8}>
                  {currentStep === 1 && (
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="gray"
                      onClick={() => router.push('/')}
                    >
                      ← Back to Home
                    </Button>
                  )}
                  <HStack spacing={4}>
                    <Icon as={FaTruck} boxSize={8} color="blue.600" />
                    <VStack align="start" spacing={1}>
                      <Heading size="lg" color="white">Speedy Van</Heading>
                      <HStack spacing={3}>
                        <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                          <Icon as={FaShieldAlt} mr={1} />
                          Fully Insured
                        </Badge>
                        <Badge colorScheme="yellow" variant="subtle" fontSize="xs">
                          <Icon as={FaStar} mr={1} />
                          5-Star Rated
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
                            size="32px" 
                            bg={
                              step.id === currentStep ? 'blue.600' : 
                              step.id < currentStep ? 'green.500' : 
                              'gray.200'
                            }
                            color={step.id <= currentStep ? 'white' : 'gray.500'}
                            fontSize="sm"
                            fontWeight="bold"
                            shadow={step.id === currentStep ? '0 0 0 3px rgba(59, 130, 246, 0.2)' : undefined}
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
                            w="40px" 
                            h="2px" 
                            bg={step.id < currentStep ? 'green.400' : 'gray.200'} 
                            borderRadius="full"
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </HStack>
                </HStack>


              </Flex>

              {/* SIMPLIFIED TITLE SECTION */}
              <Box mt={6} textAlign="center">
                <Heading 
                  size="xl" 
                  color="white"
                  fontWeight="600"
                  mb={2}
                >
                  Your Move Plan
                </Heading>
                <Text 
                  fontSize="lg" 
                  color="gray.300"
                  fontWeight="medium"
                >
                  Step {currentStep}: {STEPS[currentStep - 1]?.title}
                </Text>
              </Box>
            </CardBody>
          </Card>



          {/* Main Content with Luxury Sidebar */}
          <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8} w="full">
            {/* Main Content Area */}
            <Box gridColumn={{ base: "1", lg: "1 / 3" }}>
              <Card 
                bg="gray.800" 
                shadow="0 0 30px rgba(128, 90, 213, 0.4), 0 0 60px rgba(128, 90, 213, 0.2), 0 0 90px rgba(128, 90, 213, 0.1)"
                borderRadius="2xl" 
                overflow="hidden" 
                border="2px solid rgba(128, 90, 213, 0.6)"
                data-step="items"
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
            </Box>

            {/* Sidebar - Reduced Visual Weight */}
            <VStack spacing={4} display={{ base: "none", lg: "flex" }}>
              {/* Why Choose Speedy Van - Premium Edition */}
              <Card 
                bg="gray.800" 
                shadow="0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(59, 130, 246, 0.3), 0 0 120px rgba(59, 130, 246, 0.1)" 
                borderRadius="2xl" 
                border="2px" 
                borderColor="blue.400"
                overflow="hidden"
                position="relative"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: "-2px",
                  left: "-2px",
                  right: "-2px",
                  bottom: "-2px",
                  borderRadius: "2xl",
                  background: "linear-gradient(45deg, #3B82F6, #1D4ED8, #06B6D4, #8B5CF6)",
                  zIndex: -1,
                  filter: "blur(8px)",
                  opacity: 0.6
                }}
              >
                <CardHeader pb={3}>
                  <VStack spacing={2} align="center">
                    <Box
                      p={3}
                      borderRadius="full"
                      bg="gradient(to-r, blue.500, blue.400)"
                      shadow="0 4px 20px rgba(59, 130, 246, 0.4)"
                    >
                      <Text fontSize="2xl">🚚</Text>
                    </Box>
                    <VStack spacing={1} align="center">
                      <Heading size="md" color="white" fontWeight="bold">
                        Why Choose Speedy Van?
                      </Heading>
                      <Text fontSize="xs" color="blue.300" fontWeight="semibold">
                        Premium Moving Excellence
                      </Text>
                    </VStack>
                  </VStack>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={4} align="stretch">
                    <Box 
                      p={3} 
                      bg="gray.900" 
                      borderRadius="lg" 
                      border="1px" 
                      borderColor="gray.700"
                    >
                      <HStack spacing={3} align="center">
                        <Box
                          p={2}
                          borderRadius="full"
                          bg="blue.600"
                          shadow="0 2px 8px rgba(59, 130, 246, 0.3)"
                        >
                          <Icon as={FaShieldAlt} color="white" boxSize={4} />
                        </Box>
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontSize="sm" fontWeight="bold" color="white">Fully Insured</Text>
                          <Text fontSize="xs" color="blue.300">£100k comprehensive coverage</Text>
                        </VStack>
                        <Text fontSize="xs" color="green.400" fontWeight="bold">✓ Protected</Text>
                      </HStack>
                    </Box>

                    <Box 
                      p={3} 
                      bg="gray.900" 
                      borderRadius="lg" 
                      border="1px" 
                      borderColor="gray.700"
                    >
                      <HStack spacing={3} align="center">
                        <Box
                          p={2}
                          borderRadius="full"
                          bg="yellow.500"
                          shadow="0 2px 8px rgba(245, 158, 11, 0.3)"
                        >
                          <Icon as={FaStar} color="white" boxSize={4} />
                        </Box>
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontSize="sm" fontWeight="bold" color="white">5-Star Excellence</Text>
                          <Text fontSize="xs" color="yellow.300">100,000+ happy customers</Text>
                        </VStack>
                        <Text fontSize="xs" color="yellow.400" fontWeight="bold">⭐ 5.0</Text>
                      </HStack>
                    </Box>

                    <Box 
                      p={3} 
                      bg="gray.900" 
                      borderRadius="lg" 
                      border="1px" 
                      borderColor="gray.700"
                    >
                      <HStack spacing={3} align="center">
                        <Box
                          p={2}
                          borderRadius="full"
                          bg="green.600"
                          shadow="0 2px 8px rgba(34, 197, 94, 0.3)"
                        >
                          <Icon as={FaClock} color="white" boxSize={4} />
                        </Box>
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontSize="sm" fontWeight="bold" color="white">On-Time Promise</Text>
                          <Text fontSize="xs" color="green.300">99.2% punctuality rate</Text>
                        </VStack>
                        <Text fontSize="xs" color="green.400" fontWeight="bold">📍 Reliable</Text>
                      </HStack>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              {/* Premium Support Card */}
              <Card 
                bg="gray.800" 
                shadow="0 0 40px rgba(34, 197, 94, 0.6), 0 0 80px rgba(34, 197, 94, 0.3), 0 0 120px rgba(34, 197, 94, 0.1)" 
                borderRadius="2xl" 
                border="2px" 
                borderColor="green.400"
                overflow="hidden"
                position="relative"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: "-2px",
                  left: "-2px",
                  right: "-2px",
                  bottom: "-2px",
                  borderRadius: "2xl",
                  background: "linear-gradient(45deg, #10B981, #34D399, #6EE7B7, #A7F3D0)",
                  zIndex: -1,
                  filter: "blur(8px)",
                  opacity: 0.6
                }}
              >
                <CardHeader pb={3}>
                  <VStack spacing={2} align="center">
                    <Box
                      p={3}
                      borderRadius="full"
                      bg="gradient(to-r, green.500, green.400)"
                      shadow="0 4px 20px rgba(34, 197, 94, 0.4)"
                    >
                      <Icon as={FaPhone} color="white" fontSize="xl" />
                    </Box>
                    <VStack spacing={1} align="center">
                      <Heading size="md" color="white" fontWeight="bold">
                        Need Help?
                      </Heading>
                      <Text fontSize="xs" color="green.300" fontWeight="semibold">
                        24/7 Premium Support
                      </Text>
                    </VStack>
                  </VStack>
                </CardHeader>
                <CardBody pt={0}>
                  <VStack spacing={4} align="stretch">
                    <Button 
                      bg="linear-gradient(135deg, #10B981, #059669)"
                      color="white"
                      w="full" 
                      leftIcon={<Icon as={FaPhone} />}
                      size="lg"
                      fontSize="md"
                      fontWeight="bold"
                      borderRadius="xl"
                      py={6}
                      _hover={{
                        bg: "linear-gradient(135deg, #059669, #047857)",
                        transform: "translateY(-2px)",
                        shadow: "0 8px 30px rgba(34, 197, 94, 0.8)"
                      }}
                      _active={{
                        transform: "translateY(0px)"
                      }}
                      transition="all 0.2s ease"
                      as="a"
                      href="tel:01202129764"
                    >
                      01202129764
                    </Button>
                    
                    <VStack spacing={2}>
                      <HStack justify="space-between" w="full">
                        <HStack spacing={2}>
                          <Box w="2" h="2" bg="green.400" borderRadius="full" />
                          <Text fontSize="xs" color="gray.300">Instant Response</Text>
                        </HStack>
                        <Text fontSize="2xs" color="green.400" fontWeight="semibold">✓ Available</Text>
                      </HStack>
                      
                      <HStack justify="space-between" w="full">
                        <HStack spacing={2}>
                          <Box w="2" h="2" bg="blue.400" borderRadius="full" />
                          <Text fontSize="xs" color="gray.300">Expert Advisors</Text>
                        </HStack>
                        <Text fontSize="2xs" color="blue.400" fontWeight="semibold">📞 Ready</Text>
                      </HStack>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Premium Trending Items */}
              <Card 
                bg="linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.05))" 
                shadow="0 0 40px rgba(34, 197, 94, 0.6), 0 0 80px rgba(34, 197, 94, 0.3), 0 0 120px rgba(34, 197, 94, 0.1)" 
                borderRadius="2xl" 
                border="2px" 
                borderColor="green.400"
                overflow="hidden"
                position="relative"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: "-2px",
                  left: "-2px",
                  right: "-2px",
                  bottom: "-2px",
                  borderRadius: "2xl",
                  background: "linear-gradient(45deg, #10B981, #3B82F6, #8B5CF6, #06B6D4, #F59E0B, #EF4444)",
                  zIndex: -1,
                  filter: "blur(10px)",
                  opacity: 0.7
                }}
              >
                {/* Clean Header */}
                <Box position="relative" bg="gray.800" borderBottom="1px" borderColor="gray.700">
                  <CardHeader py={4}>
                    <VStack align="start" spacing={2}>
                      <Heading size="md" color="white" fontWeight="bold">
                        Top 3 Picks This Week
                      </Heading>
                      <HStack spacing={2} align="center">
                        <Text fontSize="sm" color="blue.300">
                          Save time with popular items
                        </Text>
                        <Badge 
                          bg="blue.600" 
                          color="white" 
                          borderRadius="full" 
                          fontSize="2xs"
                          px={2}
                        >
                          TRENDING
                        </Badge>
                      </HStack>
                    </VStack>
                  </CardHeader>
                </Box>
                
                <CardBody py={4}>
                  <VStack spacing={4} align="stretch">
                    {/* Item 1 - Sofa (Simplified) */}
                    <Box 
                      bg="gray.800" 
                      borderRadius="lg" 
                      p={4} 
                      border="1px" 
                      borderColor="gray.600"
                      shadow="0 2px 8px rgba(0, 0, 0, 0.2)"
                      _hover={{ 
                        borderColor: "blue.500",
                        shadow: "0 4px 16px rgba(59, 130, 246, 0.2)"
                      }}
                      transition="all 0.2s ease"
                    >
                      <HStack spacing={4} justify="space-between" w="full">
                        {/* Left: Image + Info */}
                        <HStack spacing={4} flex={1}>
                          {/* Icon instead of Image */}
                          <Box
                            w="80px"
                            h="80px"
                            borderRadius="lg"
                            bg="gray.700"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            border="2px"
                            borderColor="gray.600"
                          >
                            <Text fontSize="3xl">🛋️</Text>
                          </Box>
                          
                          <VStack align="start" spacing={3} flex={1}>
                            <VStack align="start" spacing={1}>
                              <Text fontSize="lg" fontWeight="bold" color="white">
                                Sofa
                              </Text>
                              <Badge bg="green.600" color="white" borderRadius="full" fontSize="xs" px={3} py={1}>
                                ✓ Chosen by 85%
                              </Badge>
                            </VStack>
                          </VStack>
                        </HStack>
                        

                      </HStack>
                    </Box>

                    {/* Item 2 - Washing Machine (Simplified) */}
                    <Box 
                      bg="gray.800" 
                      borderRadius="lg" 
                      p={4} 
                      border="1px" 
                      borderColor="gray.600"
                      shadow="0 2px 8px rgba(0, 0, 0, 0.2)"
                      _hover={{ 
                        borderColor: "blue.500",
                        shadow: "0 4px 16px rgba(59, 130, 246, 0.2)"
                      }}
                      transition="all 0.2s ease"
                    >
                      <HStack spacing={4} justify="space-between" w="full">
                        {/* Left: Image + Info */}
                        <HStack spacing={4} flex={1}>
                          {/* Icon instead of Image */}
                          <Box
                            w="80px"
                            h="80px"
                            borderRadius="lg"
                            bg="gray.700"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            border="2px"
                            borderColor="gray.600"
                          >
                            <Text fontSize="3xl">🌀</Text>
                          </Box>
                          
                          <VStack align="start" spacing={3} flex={1}>
                            <VStack align="start" spacing={1}>
                              <Text fontSize="lg" fontWeight="bold" color="white">
                                Washing Machine
                              </Text>
                              <Badge bg="green.600" color="white" borderRadius="full" fontSize="xs" px={3} py={1}>
                                ✓ Chosen by 78%
                              </Badge>
                            </VStack>
                          </VStack>
                        </HStack>
                        

                      </HStack>
                    </Box>

                    {/* Item 3 - Double Bed (Simplified) */}
                    <Box 
                      bg="gray.800" 
                      borderRadius="lg" 
                      p={4} 
                      border="1px" 
                      borderColor="gray.600"
                      shadow="0 2px 8px rgba(0, 0, 0, 0.2)"
                      _hover={{ 
                        borderColor: "blue.500",
                        shadow: "0 4px 16px rgba(59, 130, 246, 0.2)"
                      }}
                      transition="all 0.2s ease"
                    >
                      <HStack spacing={4} justify="space-between" w="full">
                        {/* Left: Image + Info */}
                        <HStack spacing={4} flex={1}>
                          {/* Icon instead of Image */}
                          <Box
                            w="80px"
                            h="80px"
                            borderRadius="lg"
                            bg="gray.700"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            border="2px"
                            borderColor="gray.600"
                          >
                            <Text fontSize="3xl">🛏️</Text>
                          </Box>
                          
                          <VStack align="start" spacing={3} flex={1}>
                            <VStack align="start" spacing={1}>
                              <Text fontSize="lg" fontWeight="bold" color="white">
                                Double Bed
                              </Text>
                              <Badge bg="green.600" color="white" borderRadius="full" fontSize="xs" px={3} py={1}>
                                ✓ Chosen by 72%
                              </Badge>
                            </VStack>
                          </VStack>
                        </HStack>
                        

                      </HStack>
                    </Box>

                    {/* Cleaner Footer Stats */}
                    <Box mt={4} p={4} bg="gray.700" borderRadius="lg" border="1px" borderColor="gray.600">
                      <HStack justify="space-between" spacing={4}>
                        <VStack spacing={1} align="start">
                          <Text fontSize="sm" color="blue.300" fontWeight="semibold">
                            2,847 items added this week
                          </Text>
                          <Text fontSize="xs" color="gray.400">
                            Save time with popular choices
                          </Text>
                        </VStack>
                        <Button
                          size="sm"
                          bg="blue.600"
                          color="white"
                          _hover={{ bg: "blue.500" }}
                          borderRadius="lg"
                          px={4}
                          onClick={() => {
                            // Navigate to the items section or expand the current step
                            setCurrentStep(1);
                            // Scroll to the items section
                            const itemsSection = document.querySelector('[data-step="items"]');
                            if (itemsSection) {
                              itemsSection.scrollIntoView({ behavior: 'smooth' });
                            }
                          }}
                        >
                          View All Items
                        </Button>
                      </HStack>
                    </Box>
                  </VStack>
                </CardBody>
              </Card>

              {/* Premium Speedy Van Card */}
              <Card 
                bg="gray.800" 
                shadow="0 0 40px rgba(147, 51, 234, 0.6), 0 0 80px rgba(147, 51, 234, 0.3), 0 0 120px rgba(147, 51, 234, 0.1)" 
                borderRadius="2xl" 
                border="2px" 
                borderColor="purple.400"
                overflow="hidden"
                position="relative"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: "-2px",
                  left: "-2px",
                  right: "-2px",
                  bottom: "-2px",
                  borderRadius: "2xl",
                  background: "linear-gradient(45deg, #8B5CF6, #3B82F6, #06B6D4, #10B981, #F59E0B, #EF4444)",
                  zIndex: -1,
                  filter: "blur(10px)",
                  opacity: 0.7
                }}
              >
                <Box position="relative">
                  {/* Premium Badge */}
                  <Box
                    position="absolute"
                    top="4"
                    left="4"
                    bg="gradient(to-r, blue.600, blue.500)"
                    px={3}
                    py={1}
                    borderRadius="full"
                    zIndex={2}
                    shadow="0 4px 12px rgba(59, 130, 246, 0.4)"
                  >
                    <Text fontSize="xs" color="white" fontWeight="bold">
                      PREMIUM
                    </Text>
                  </Box>

                  {/* Service Information - Text Only */}
                  <Box
                    w="full"
                    h="220px"
                    bg="gray.900"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="xl"
                    position="relative"
                  >
                    <VStack spacing={4} textAlign="center" px={6}>
                      <Text fontSize="4xl">🚚</Text>
                      <Text fontSize="lg" color="white" fontWeight="bold">
                        Professional Moving Service
                      </Text>
                      <Text fontSize="sm" color="gray.300">
                        Fully Insured & GPS Tracked
                      </Text>
                    </VStack>
                  </Box>
                </Box>

                <CardBody py={6} px={6}>
                  <VStack spacing={4} align="stretch">
                    {/* Main Title */}
                    <VStack spacing={2} align="center">
                      <Heading size="lg" color="white" fontWeight="bold" textAlign="center">
                        Professional Luton Van
                      </Heading>
                      <Text fontSize="sm" color="blue.300" fontWeight="medium" textAlign="center">
                        🚚 Your Trusted Moving Partner
                      </Text>
                    </VStack>

                    {/* Features Grid */}
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between" align="center">
                        <HStack spacing={2}>
                          <Box w="2" h="2" bg="green.400" borderRadius="full" />
                          <Text fontSize="sm" color="gray.300">Fully Insured</Text>
                        </HStack>
                        <Text fontSize="xs" color="green.400" fontWeight="semibold">✓ Covered</Text>
                      </HStack>
                      
                      <HStack justify="space-between" align="center">
                        <HStack spacing={2}>
                          <Box w="2" h="2" bg="blue.400" borderRadius="full" />
                          <Text fontSize="sm" color="gray.300">GPS Tracked</Text>
                        </HStack>
                        <Text fontSize="xs" color="blue.400" fontWeight="semibold">📍 Live</Text>
                      </HStack>
                      
                      <HStack justify="space-between" align="center">
                        <HStack spacing={2}>
                          <Box w="2" h="2" bg="purple.400" borderRadius="full" />
                          <Text fontSize="sm" color="gray.300">Expert Drivers</Text>
                        </HStack>
                        <Text fontSize="xs" color="purple.400" fontWeight="semibold">⭐ 5.0</Text>
                      </HStack>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Welcome to Speedy Van Image */}
              <Card 
                bg="gray.800" 
                shadow="0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(59, 130, 246, 0.3), 0 0 120px rgba(59, 130, 246, 0.1)" 
                borderRadius="2xl" 
                border="2px" 
                borderColor="blue.400"
                overflow="hidden"
                position="relative"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: "-2px",
                  left: "-2px",
                  right: "-2px",
                  bottom: "-2px",
                  borderRadius: "2xl",
                  background: "linear-gradient(45deg, #3B82F6, #8B5CF6, #06B6D4, #10B981, #F59E0B, #EF4444)",
                  zIndex: -1,
                  filter: "blur(10px)",
                  opacity: 0.7
                }}
              >
                <CardBody p={6}>
                  <VStack spacing={4} align="center">
                    <Text fontSize="lg" color="white" fontWeight="bold" textAlign="center">
                      Welcome to Our Service
                    </Text>
                    
                    <Box
                      w="full"
                      maxW="300px"
                      h="300px"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bg="gray.800"
                      borderRadius="xl"
                    >
                      <VStack spacing={4} textAlign="center">
                        <Text fontSize="5xl">😊</Text>
                        <Text fontSize="lg" color="white" fontWeight="bold">
                          Welcome to Speedy Van
                        </Text>
                      </VStack>
                    </Box>
                    
                    <Text fontSize="sm" color="gray.300" textAlign="center">
                      Your trusted moving partner with a smile! 😊
                    </Text>
                  </VStack>
                </CardBody>
              </Card>

              {/* Live Price Preview - Dark Theme */}
              {formData.step1.items.length > 0 && (
                <Card bg="gray.800" shadow="0 0 20px rgba(147, 51, 234, 0.3)" borderRadius="lg" border="1px" borderColor="purple.600">
                  <CardBody p={4}>
                    <VStack spacing={2} align="center">
                      <Text fontSize="xs" color="purple.400" fontWeight="semibold">
                        Items Selected
                      </Text>
                      <Text fontSize="2xl" fontWeight="bold" color="purple.300">
                        {formData.step1.items.length}
                      </Text>
                      <Text fontSize="xs" color="gray.400" textAlign="center">
                        items selected
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              )}

              {/* Pricing Error Display */}
              {errors.pricing && (
                <Card bg="red.900" shadow="0 0 20px rgba(239, 68, 68, 0.3)" borderRadius="lg" border="1px" borderColor="red.600">
                  <CardBody p={4}>
                    <VStack spacing={3} align="stretch">
                      <HStack spacing={2} align="center">
                        <Circle size="24px" bg="red.600" color="white">
                          <Icon as={FaExclamationTriangle} boxSize={3} />
                        </Circle>
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontSize="sm" fontWeight="bold" color="red.100">
                            Pricing Error
                          </Text>
                          <Text fontSize="xs" color="red.200">
                            Unable to calculate price
                          </Text>
                        </VStack>
                      </HStack>
                      <Text fontSize="sm" color="red.100" textAlign="center">
                        {errors.pricing}
                      </Text>
                      <Button
                        size="sm"
                        bg="red.600"
                        color="white"
                        _hover={{ bg: "red.500" }}
                        borderRadius="lg"
                        onClick={() => {
                          clearErrors();
                          calculatePricing().catch(error => {
                            console.error('Retry pricing failed:', error);
                          });
                        }}
                        leftIcon={<Icon as={FaRedo} />}
                      >
                        Retry Calculation
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>
              )}
            </VStack>
          </SimpleGrid>


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
        </VStack>
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
