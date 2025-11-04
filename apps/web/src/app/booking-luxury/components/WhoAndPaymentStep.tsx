'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  Textarea,
  Checkbox,
  Card,
  CardBody,
  CardHeader,
  Divider,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Badge,
  useToast,
  Grid,
  SimpleGrid,
  FormControl,
  FormLabel,
  Icon,
  Circle,
  Flex,
} from '@chakra-ui/react';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaCreditCard,
  FaShieldAlt,
  FaLock,
  FaCheckCircle,
  FaBolt,
  FaFileContract,
  FaUserShield,
  FaCalculator,
} from 'react-icons/fa';
import { FormData, CustomerDetails, PaymentMethod } from '../hooks/useBookingForm';
import StripePaymentButton from './StripePaymentButton';

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
}

const PAYMENT_METHODS = [
  {
    id: 'stripe' as const,
    name: 'Credit/Debit Card',
    description: 'Secure payment via Stripe',
    icon: FaCreditCard,
    color: 'blue',
    features: ['Visa', 'Mastercard', 'American Express', 'Apple Pay', 'Google Pay'],
  },
];

export default function WhoAndPaymentStep({
  formData,
  updateFormData,
  errors,
  paymentSuccess = false,
  isCalculatingPricing = false,
  economyPrice,
  standardPrice,
  priorityPrice,
  calculatePricing,
  validatePromotionCode,
  applyPromotionCode,
  removePromotionCode,
}: WhoAndPaymentStepProps) {
  const [showCardDetails, setShowCardDetails] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');
  const [promotionCode, setPromotionCode] = useState('');
  const [isValidatingPromotion, setIsValidatingPromotion] = useState(false);
  const [isUpdatingService, setIsUpdatingService] = useState(false);
  
  // State for dynamic multi-drop eligibility
  const [eligibilityDecision, setEligibilityDecision] = useState<any | null>(null);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(false);
  
  // CRITICAL FIX: Use useRef for immutable price snapshot to prevent React re-render loops
  const priceSnapshot = useRef<{
    economy: number;
    standard: number;
    priority: number;
  } | null>(null);
  
  const toast = useToast();

  // CRITICAL FIX: Ref-based price locking to prevent flickering
  const handleServiceTypeChange = useCallback((serviceType: 'standard' | 'premium' | 'white-glove') => {
    if (isUpdatingService || formData.step1.serviceType === serviceType) {
      return; // Prevent double clicks and unnecessary updates
    }
    
    setIsUpdatingService(true);
    
    // Take immutable price snapshot ONCE when first service is selected
    if (!priceSnapshot.current) {
      const currentBasePrice = formData.step1.pricing.total || 0;
      console.log('🔒 Taking price snapshot for service selection:', {
        basePrice: currentBasePrice,
        serviceType,
        timestamp: new Date().toISOString()
      });
      
      priceSnapshot.current = {
        economy: currentBasePrice * 0.85,    // 15% discount for economy
        standard: currentBasePrice,           // Base price for standard
        priority: currentBasePrice * 1.5,     // 50% premium for priority
      };
      
      console.log('💰 Price snapshot captured:', priceSnapshot.current);
    } else {
      console.log('✅ Using existing price snapshot for service change:', {
        serviceType,
        snapshot: priceSnapshot.current
      });
    }
    
    updateFormData('step1', { serviceType });
    
    // Reset the flag after a short delay
    setTimeout(() => {
      setIsUpdatingService(false);
    }, 300);
  }, [isUpdatingService, formData.step1.serviceType, formData.step1.pricing.total, updateFormData]);

  // CRITICAL FIX: Reset price snapshot when items or addresses change (but not when service type changes)
  useEffect(() => {
    // Only reset if we have a service type selected and prices are locked
    if (formData.step1.serviceType && priceSnapshot.current) {
      console.log('🔄 Resetting price snapshot due to Step 1 changes:', {
        itemsChanged: true,
        serviceType: formData.step1.serviceType,
        timestamp: new Date().toISOString()
      });
      priceSnapshot.current = null;
    }
  }, [formData.step1.items.length, formData.step1.pickupAddress?.full, formData.step1.dropoffAddress?.full]);

  // Effect to check multi-drop eligibility when booking details change
  useEffect(() => {
    const checkEligibility = async () => {
      if (!formData.step1.pickupAddress || !formData.step1.dropoffAddress || formData.step1.items.length === 0) {
        return;
      }

      setIsLoadingEligibility(true);
      try {
        const response = await fetch("/api/booking/check-multi-drop-eligibility", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pickup: formData.step1.pickupAddress,
            dropoff: formData.step1.dropoffAddress,
            items: formData.step1.items,
            scheduledDate: formData.step1.pickupDate,
            serviceType: formData.step1.serviceType,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to check eligibility");
        }

        const data = await response.json();
        setEligibilityDecision(data);

      } catch (error) {
        console.error("Error checking multi-drop eligibility:", error);
        setEligibilityDecision(null);
      } finally {
        setIsLoadingEligibility(false);
      }
    };

    checkEligibility();

  }, [formData.step1.pickupAddress, formData.step1.dropoffAddress, formData.step1.items, formData.step1.pickupDate, formData.step1.serviceType]);

  // CRITICAL FIX: Auto-trigger pricing calculation when Step 1 is complete but pricing is missing
  useEffect(() => {
    const hasItems = formData.step1.items.length > 0;
    const hasPickupAddress = formData.step1.pickupAddress?.full || formData.step1.pickupAddress?.line1 || formData.step1.pickupAddress?.address || formData.step1.pickupAddress?.formatted_address;
    const hasDropoffAddress = formData.step1.dropoffAddress?.full || formData.step1.dropoffAddress?.line1 || formData.step1.dropoffAddress?.address || formData.step1.dropoffAddress?.formatted_address;
    const hasValidPickupCoordinates = !!(formData.step1.pickupAddress?.coordinates?.lat && formData.step1.pickupAddress?.coordinates?.lng &&
                                        (formData.step1.pickupAddress.coordinates.lat !== 0 || formData.step1.pickupAddress.coordinates.lng !== 0));
    const hasValidDropoffCoordinates = !!(formData.step1.dropoffAddress?.coordinates?.lat && formData.step1.dropoffAddress?.coordinates?.lng &&
                                         (formData.step1.dropoffAddress.coordinates.lat !== 0 || formData.step1.dropoffAddress.coordinates.lng !== 0));
    const hasPricing = formData.step1.pricing.total > 0;
    
    const step1Complete = hasItems && hasPickupAddress && hasDropoffAddress && hasValidPickupCoordinates && hasValidDropoffCoordinates;
    
    // Auto-trigger pricing calculation if Step 1 is complete but pricing is missing
    // Don't trigger if we have a price snapshot (prices are locked)
    if (step1Complete && !hasPricing && !isCalculatingPricing && calculatePricing && !priceSnapshot.current) {
      console.log('🚨 CRITICAL FIX: Step 1 complete but pricing missing - auto-triggering calculation');
      console.log('📊 Step 1 completion status:', {
        hasItems,
        hasPickupAddress: !!hasPickupAddress,
        hasDropoffAddress: !!hasDropoffAddress,
        hasValidPickupCoordinates,
        hasValidDropoffCoordinates,
        hasPricing,
        isCalculatingPricing,
        hasPriceSnapshot: !!priceSnapshot.current,
        step1Complete
      });
      
      // Trigger pricing calculation with a small delay to avoid race conditions
      setTimeout(() => {
        calculatePricing().catch(error => {
          console.error('❌ Auto-triggered pricing calculation failed:', error);
          toast({
            title: 'Pricing calculation failed',
            description: 'Please try clicking "Calculate Pricing" manually',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        });
      }, 100);
    }
  }, [
    formData.step1.items.length,
    formData.step1.pickupAddress?.full,
    formData.step1.pickupAddress?.line1,
    formData.step1.pickupAddress?.address,
    formData.step1.pickupAddress?.formatted_address,
    formData.step1.dropoffAddress?.full,
    formData.step1.dropoffAddress?.line1,
    formData.step1.dropoffAddress?.address,
    formData.step1.dropoffAddress?.formatted_address,
    formData.step1.pickupAddress?.coordinates,
    formData.step1.dropoffAddress?.coordinates,
    formData.step1.pricing.total,
    isCalculatingPricing,
    calculatePricing,
    priceSnapshot.current, // Depend on ref value to detect changes
    toast
  ]);

  // CRITICAL FIX: Price calculation functions use immutable ref snapshot
  const calculateEconomyPrice = useCallback(() => {
    // Always return snapshot value if available (prices are locked)
    if (priceSnapshot.current) {
      return priceSnapshot.current.economy;
    }
    
    // Fallback: calculate from current pricing (only when no snapshot)
    const basePrice = formData.step1.pricing.total || 0;
    if (basePrice === 0) return 0;

    // Economy: 15% discount for multi-drop routing (van-fit capacity only)
    return basePrice * 0.85;
  }, []); // No dependencies - uses ref which doesn't trigger re-renders

  const calculateStandardPrice = useCallback(() => {
    // Always return snapshot value if available (prices are locked)
    if (priceSnapshot.current) {
      return priceSnapshot.current.standard;
    }
    
    // Fallback: calculate from current pricing (only when no snapshot)
    const basePrice = formData.step1.pricing.total || 0;
    if (basePrice === 0) return 0;

    // Standard: Direct van service (base price)
    return basePrice;
  }, []); // No dependencies - uses ref which doesn't trigger re-renders

  const calculatePriorityPrice = useCallback(() => {
    // Always return snapshot value if available (prices are locked)
    if (priceSnapshot.current) {
      return priceSnapshot.current.priority;
    }
    
    // Fallback: calculate from current pricing (only when no snapshot)
    const basePrice = formData.step1.pricing.total || 0;
    if (basePrice === 0) return 0;

    // Priority/Express: 50% premium for dedicated/faster service
    return basePrice * 1.5;
  }, []); // No dependencies - uses ref which doesn't trigger re-renders

  // Check if economy pricing is available based on capacity and date constraints
  const isEconomyAvailable = useCallback(() => {
    if (!formData.step1.pickupDate) return false;

    const selectedDate = new Date(formData.step1.pickupDate);
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + 7);

    // Must be within 7 days
    if (selectedDate > maxFutureDate) return false;

    // Check capacity constraints (van-fit only)
    const totalVolume = formData.step1.items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
    const totalWeight = formData.step1.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);

    const VAN_FIT_VOLUME = 15; // m³
    const VAN_FIT_WEIGHT = 1000; // kg
    
    // Check if load percentage indicates full load (≥70%)
    const volumePercentage = totalVolume / VAN_FIT_VOLUME;
    const weightPercentage = totalWeight / VAN_FIT_WEIGHT;
    const loadPercentage = Math.max(volumePercentage, weightPercentage);
    
    if (loadPercentage >= 0.70) {
      console.log(`🚛 Economy (multi-drop) disabled: full load detected (${(loadPercentage * 100).toFixed(1)}% ≥ 70%)`);
      return false;
    }

    // Count large/bulky items (volume > 1.0 m³ OR weight > 30 kg)
    const largeItems = formData.step1.items.reduce((count, item) => {
      const itemVolume = item.volume || 0;
      const itemWeight = item.weight || 0;
      const itemQuantity = item.quantity || 1;
      
      // Item is large if volume > 1.0 m³ OR weight > 30 kg
      if (itemVolume > 1.0 || itemWeight > 30) {
        return count + itemQuantity;
      }
      return count;
    }, 0);

    // Multi-drop restriction: max 8 large items
    const MAX_LARGE_ITEMS_FOR_MULTI_DROP = 8;
    if (largeItems > MAX_LARGE_ITEMS_FOR_MULTI_DROP) {
      console.log(`🚛 Economy (multi-drop) disabled: too many large items (${largeItems} > ${MAX_LARGE_ITEMS_FOR_MULTI_DROP})`);
      return false;
    }

    // Check if house moving package (property type = 'house' and significant load)
    const isHousePackage = (formData.step1.pickupProperty?.type === 'house' || formData.step1.dropoffProperty?.type === 'house') 
                          && loadPercentage >= 0.50;
    
    if (isHousePackage) {
      console.log(`🏠 Economy (multi-drop) disabled: house moving package detected`);
      return false;
    }

    // Check distance constraint (< 200 miles for multi-drop)
    const distance = formData.step1.pricing?.distance || 0; // Distance in miles from pricing calculation
    const MULTI_DROP_MAX_DISTANCE = 200; // miles
    
    if (distance > MULTI_DROP_MAX_DISTANCE) {
      console.log(`🛣️ Economy (multi-drop) disabled: route too long (${distance.toFixed(1)} miles > ${MULTI_DROP_MAX_DISTANCE} miles)`);
      return false;
    }

    return totalVolume <= VAN_FIT_VOLUME && totalWeight <= VAN_FIT_WEIGHT;
  }, [formData.step1.pickupDate, formData.step1.items, formData.step1.pickupProperty, formData.step1.dropoffProperty, formData.step1.pricing]);

  // Get next available economy date if current date is not suitable
  const getNextEconomyDate = useCallback(() => {
    if (isEconomyAvailable()) return formData.step1.pickupDate;

    // Find next available date within 7 days
    for (let daysAhead = 1; daysAhead <= 7; daysAhead++) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      // Skip weekends for simplicity
      if (futureDate.getDay() === 0 || futureDate.getDay() === 6) continue;

      return futureDate.toISOString();
    }

    return null;
  }, [isEconomyAvailable, formData.step1.pickupDate]);

  const getCurrentPrice = useCallback(() => {
    // Always use snapshot if available (prices are locked)
    if (priceSnapshot.current) {
      switch (formData.step1.serviceType) {
        case 'standard':
          return priceSnapshot.current.economy;
        case 'premium':
          return priceSnapshot.current.standard;
        case 'white-glove':
          return priceSnapshot.current.priority;
        default:
          return formData.step1.pricing.total || 0;
      }
    }
    
    // Fallback: calculate from current pricing (only when no snapshot)
    switch (formData.step1.serviceType) {
      case 'standard':
        return calculateEconomyPrice();
      case 'premium':
        return calculateStandardPrice();
      case 'white-glove':
        return calculatePriorityPrice();
      default:
        return formData.step1.pricing.total || 0;
    }
  }, [formData.step1.serviceType, calculateEconomyPrice, calculateStandardPrice, calculatePriorityPrice]); // Keep dependencies for fallback case

  const getEconomyDate = useCallback(() => {
    if (!formData.step1.pickupDate) return null;

    const currentDate = new Date(formData.step1.pickupDate);
    const maxFutureDate = new Date();
    maxFutureDate.setDate(maxFutureDate.getDate() + 7);

    // If current date is within 7 days, use it
    if (currentDate <= maxFutureDate) {
      return currentDate;
    } else {
      // For economy, we cannot propose dates beyond 7 days
      // This will hide the economy option if date is too far
      return null;
    }
  }, [formData.step1.pickupDate]);

  const canShowEconomyOption = useCallback(() => {
    return getEconomyDate() !== null;
  }, [getEconomyDate]);

  const getServiceLevelDisplayName = useCallback(() => {
    switch (formData.step1.serviceType) {
      case 'standard':
        return 'Economy (Multi-Drop)';
      case 'premium':
        return 'Standard (Direct Van)';
      case 'white-glove':
        return 'Priority (White Glove)';
      default:
        return 'Standard Service';
    }
  }, [formData.step1.serviceType]);

  const getServiceLevelDescription = useCallback(() => {
    switch (formData.step1.serviceType) {
      case 'standard':
        return 'Shared route with other customers for maximum efficiency';
      case 'premium':
        return 'Dedicated van service with flexible scheduling';
      case 'white-glove':
        return 'Premium white-glove service with same-day delivery';
      default:
        return 'Standard moving service';
    }
  }, [formData.step1.serviceType]);

  const getServiceLevelFeatures = useCallback(() => {
    switch (formData.step1.serviceType) {
      case 'standard':
        return 'Multi-drop route • Within 7 days • Van-fit capacity';
      case 'premium':
        return 'Dedicated van • Flexible scheduling • Full capacity';
      case 'white-glove':
        return 'Premium service • Same/next-day • Luxury moving';
      default:
        return 'Standard features';
    }
  }, [formData.step1.serviceType]);


  const { step2 } = formData;

  const updateCustomerDetails = (field: keyof CustomerDetails, value: string) => {
    updateFormData('step2', {
      customerDetails: {
        ...step2.customerDetails,
        [field]: value,
      },
    });
  };

  const updatePaymentMethod = (field: keyof PaymentMethod, value: any) => {
    updateFormData('step2', {
      paymentMethod: {
        ...step2.paymentMethod,
        [field]: value,
      },
    });
  };

  const updatePaymentStatus = (status: 'pending' | 'processing' | 'success' | 'failed') => {
    setPaymentStatus(status);
  };

  const updateStripeDetails = (field: string, value: string) => {
    updateFormData('step2', {
      paymentMethod: {
        ...step2.paymentMethod,
        stripeDetails: {
          ...step2.paymentMethod.stripeDetails,
          [field]: value,
        },
      },
    });
  };

  const handleApplyPromotionCode = async () => {
    if (!promotionCode.trim()) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a promotion code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!applyPromotionCode) {
      toast({
        title: 'Error',
        description: 'Promotion validation is not available',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsValidatingPromotion(true);
    try {
      const result = await applyPromotionCode(promotionCode.trim());
      
      if (result.success && result.promotion) {
        setPromotionCode('');
        toast({
          title: 'Promotion Applied! 🎉',
          description: `${result.promotion.name} - You saved £${result.promotion.discountAmount.toFixed(2)}!`,
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
      toast({
        title: 'Error',
        description: 'Failed to apply promotion code. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsValidatingPromotion(false);
    }
  };

  const handleRemovePromotionCode = () => {
    if (removePromotionCode) {
      removePromotionCode();
      toast({
        title: 'Promotion Removed',
        description: 'Promotion code has been removed from your booking',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    // Store card details in local state or remove this functionality
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiry(e.target.value);
    // Store expiry in local state or remove this functionality
  };

  const handlePaymentMethodSelect = (methodId: PaymentMethod['type']) => {
    updatePaymentMethod('type', methodId);
    setShowCardDetails(false); // Only stripe is supported now
  };

  return (
    <VStack spacing={{ base: 6, md: 8 }} align="stretch" p={{ base: 4, md: 6, lg: 8 }}>
      {/* Enhanced Step Header */}
      <Box textAlign="center" mb={6}>
        <Heading size={{ base: "lg", md: "xl" }} mb={3} bgGradient="linear(to-r, purple.600, blue.600)" bgClip="text">
          💳 Complete Your Booking
        </Heading>
        <Text color="gray.300" fontSize={{ base: "md", md: "lg" }}>
          Enter your details and pay securely to confirm your move
        </Text>
      </Box>

      {/* 1. Customer Information - Enhanced */}
      <Card 
        p={{ base: 4, md: 6 }} 
        shadow="0 0 30px rgba(128, 90, 213, 0.4), 0 0 60px rgba(128, 90, 213, 0.2)" 
        borderWidth="2px" 
        borderColor="rgba(128, 90, 213, 0.6)"
        bg="gray.800"
        _hover={{ shadow: "0 0 40px rgba(128, 90, 213, 0.6)", transform: "translateY(-2px)" }}
        transition="all 0.3s ease"
        borderRadius="xl"
      >
        <VStack spacing={6} align="stretch">
          <HStack spacing={3} align="center" mb={2}>
            <Circle size="40px" bg="purple.900" color="purple.300">
              <Icon as={FaUser} fontSize="20px" />
            </Circle>
            <Box>
              <Heading size={{ base: "sm", md: "md" }} color="white" mb={1}>
                👤 Your Information
              </Heading>
              <Text fontSize="sm" color="gray.300">
                We'll use this to keep you updated on your move
              </Text>
            </Box>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.200">
                First Name
              </FormLabel>
              <Input
                placeholder="Enter your first name"
                value={step2.customerDetails.firstName}
                onChange={(e) => updateCustomerDetails('firstName', e.target.value)}
                isInvalid={!!errors['customerDetails.firstName']}
                bg="gray.700"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: "gray.400" }}
                _hover={{ borderColor: "purple.400" }}
                _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px #9F7AEA", bg: "gray.700" }}
                _active={{ bg: "gray.700" }}
                sx={{ "&::selection": { bg: "purple.500", color: "white" } }}
                size="md"
                borderRadius="md"
                fontWeight="medium"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.200">
                Last Name
              </FormLabel>
              <Input
                placeholder="Enter your last name"
                value={step2.customerDetails.lastName}
                onChange={(e) => updateCustomerDetails('lastName', e.target.value)}
                isInvalid={!!errors['customerDetails.lastName']}
                bg="gray.700"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: "gray.400" }}
                _hover={{ borderColor: "purple.400" }}
                _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px #9F7AEA", bg: "gray.700" }}
                _active={{ bg: "gray.700" }}
                sx={{ "&::selection": { bg: "purple.500", color: "white" } }}
                size="md"
                borderRadius="md"
                fontWeight="medium"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.200">
                Email Address
              </FormLabel>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={step2.customerDetails.email}
                onChange={(e) => updateCustomerDetails('email', e.target.value)}
                isInvalid={!!errors['customerDetails.email']}
                bg="gray.700"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: "gray.400" }}
                _hover={{ borderColor: "purple.400" }}
                _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px #9F7AEA", bg: "gray.700" }}
                _active={{ bg: "gray.700" }}
                sx={{ "&::selection": { bg: "purple.500", color: "white" } }}
                size="md"
                borderRadius="md"
                fontWeight="medium"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="600" color="gray.200">
                Phone Number
              </FormLabel>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={step2.customerDetails.phone}
                onChange={(e) => updateCustomerDetails('phone', e.target.value)}
                isInvalid={!!errors['customerDetails.phone']}
                bg="gray.700"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: "gray.400" }}
                _hover={{ borderColor: "purple.400" }}
                _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px #9F7AEA", bg: "gray.700" }}
                _active={{ bg: "gray.700" }}
                sx={{ "&::selection": { bg: "purple.500", color: "white" } }}
                size="md"
                borderRadius="md"
                fontWeight="medium"
              />
            </FormControl>
          </SimpleGrid>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="600" color="gray.200">
              Company Name (Optional)
            </FormLabel>
            <Input
              placeholder="Enter your company name (if applicable)"
              value={step2.customerDetails.company || ''}
              onChange={(e) => updateCustomerDetails('company', e.target.value)}
              bg="gray.700"
              borderColor="gray.600"
              color="white"
              _placeholder={{ color: "gray.400" }}
              _hover={{ borderColor: "purple.400" }}
              _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px #9F7AEA", bg: "gray.700" }}
              _active={{ bg: "gray.700" }}
              sx={{ "&::selection": { bg: "purple.500", color: "white" } }}
              size="md"
              borderRadius="md"
              fontWeight="medium"
            />
          </FormControl>
        </VStack>
      </Card>

      {/* Special Instructions */}
      <Card 
        p={{ base: 4, md: 6 }} 
        shadow="0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.2)" 
        borderWidth="2px" 
        borderColor="rgba(59, 130, 246, 0.6)"
        bg="gray.800"
        _hover={{ shadow: "0 0 40px rgba(59, 130, 246, 0.6)", transform: "translateY(-2px)" }}
        transition="all 0.3s ease"
        borderRadius="xl"
      >
        <VStack spacing={4} align="stretch">
          <HStack spacing={3} align="center">
            <Circle size="40px" bg="blue.900" color="blue.300">
              <Icon as={FaFileContract} fontSize="20px" />
            </Circle>
            <Box>
              <Heading size={{ base: "sm", md: "md" }} color="white" mb={1}>
                📝 Special Instructions
              </Heading>
              <Text fontSize="sm" color="gray.300">
                Any special requests or notes for your move
              </Text>
            </Box>
          </HStack>

          <FormControl>
            <Textarea 
              placeholder="Any special instructions or requests for your move..."
              value={step2.specialInstructions || ''}
              onChange={(e) => updateFormData('step2', { specialInstructions: e.target.value })}
              rows={4}
              bg="gray.700"
              borderColor="gray.600"
              color="white"
              _placeholder={{ color: "gray.400" }}
              _hover={{ borderColor: "blue.400" }}
              _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182CE", bg: "gray.700" }}
              _active={{ bg: "gray.700" }}
              sx={{ "&::selection": { bg: "blue.500", color: "white" } }}
              borderRadius="md"
              fontSize="sm"
            />
            <Text fontSize="xs" color="gray.400" mt={2}>
              Examples: Fragile items, access instructions, preferred timing, etc.
            </Text>
          </FormControl>
        </VStack>
      </Card>

      {/* Promotion Code Section */}
      <Card 
        p={{ base: 4, md: 6 }} 
        shadow="0 0 30px rgba(251, 146, 60, 0.4), 0 0 60px rgba(251, 146, 60, 0.2)" 
        borderWidth="2px" 
        borderColor="rgba(251, 146, 60, 0.6)"
        bg="gray.800"
        _hover={{ shadow: "0 0 40px rgba(251, 146, 60, 0.6)", transform: "translateY(-2px)" }}
        transition="all 0.3s ease"
        borderRadius="xl"
      >
        <VStack spacing={4} align="stretch">
          <HStack spacing={3} align="center">
            <Circle size="40px" bg="orange.900" color="orange.300">
              <Icon as={FaCalculator} fontSize="20px" />
            </Circle>
            <Box>
              <Heading size={{ base: "sm", md: "md" }} color="white" mb={1}>
                🎟️ Promotion Code
              </Heading>
              <Text fontSize="sm" color="gray.300">
                Enter a valid promotion code to get a discount
              </Text>
            </Box>
          </HStack>

          {step2.promotionDetails ? (
            // Show applied promotion
            <Card bg="green.900" borderRadius="lg" borderWidth="2px" borderColor="green.400" p={4}>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="600" color="white" fontSize="md">
                      {step2.promotionDetails.name}
                    </Text>
                    <Text fontSize="sm" color="green.300">
                      {step2.promotionDetails.description}
                    </Text>
                  </VStack>
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    onClick={handleRemovePromotionCode}
                  >
                    Remove
                  </Button>
                </HStack>
                
                <Divider />
                
                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.300">
                    Discount Applied:
                  </Text>
                  <Text fontWeight="bold" color="green.400" fontSize="lg">
                    -£{step2.promotionDetails.discountAmount?.toFixed(2)}
                  </Text>
                </HStack>
                
                <HStack justify="space-between" align="center">
                  <Text fontSize="sm" color="gray.300">
                    Original Price:
                  </Text>
                  <Text fontSize="sm" color="gray.400" textDecoration="line-through">
                    £{step2.promotionDetails.originalAmount?.toFixed(2)}
                  </Text>
                </HStack>
                
                <HStack justify="space-between" align="center">
                  <Text fontSize="md" fontWeight="bold" color="white">
                    Final Price:
                  </Text>
                  <Text fontWeight="bold" color="green.400" fontSize="xl">
                    £{step2.promotionDetails.finalAmount?.toFixed(2)}
                  </Text>
                </HStack>
              </VStack>
            </Card>
          ) : (
            // Show promotion code input
            <HStack spacing={3}>
              <Input
                placeholder="Enter promotion code"
                value={promotionCode}
                onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                bg="gray.700"
                borderColor="gray.600"
                color="white"
                _placeholder={{ color: "gray.400" }}
                _hover={{ borderColor: "orange.400" }}
                _focus={{ borderColor: "orange.500", boxShadow: "0 0 0 1px #FB923C", bg: "gray.700" }}
                _active={{ bg: "gray.700" }}
                sx={{ "&::selection": { bg: "orange.500", color: "white" } }}
                size="md"
                borderRadius="md"
                fontWeight="medium"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyPromotionCode();
                  }
                }}
              />
              <Button
                colorScheme="orange"
                onClick={handleApplyPromotionCode}
                isLoading={isValidatingPromotion}
                loadingText="Validating..."
                disabled={!promotionCode.trim() || isValidatingPromotion}
                size="md"
                px={6}
              >
                Apply
              </Button>
            </HStack>
          )}
        </VStack>
      </Card>

      {/* 2. Payment Method - Enhanced */}
      <Card 
        p={{ base: 4, md: 6 }} 
        shadow="0 0 30px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.2)" 
        borderWidth="2px" 
        borderColor="rgba(16, 185, 129, 0.6)"
        bg="gray.800"
        _hover={{ shadow: "0 0 40px rgba(16, 185, 129, 0.6)", transform: "translateY(-2px)" }}
        transition="all 0.3s ease"
        borderRadius="xl"
      >
        <VStack spacing={6} align="stretch">
          <HStack spacing={3} align="center" mb={2}>
            <Circle size="40px" bg="green.900" color="green.300">
              <Icon as={FaCreditCard} fontSize="20px" />
            </Circle>
            <Box>
              <Heading size={{ base: "sm", md: "md" }} color="white" mb={1}>
                💳 Payment Method
              </Heading>
              <Text fontSize="sm" color="gray.300">
                Secure payment processed by Stripe
              </Text>
            </Box>
          </HStack>

          {/* Stripe Payment Card */}
          <Box 
            p={4} 
            bg="gray.700" 
            borderRadius="lg" 
            borderWidth="2px" 
            borderColor="gray.600"
          >
            <HStack spacing={3} align="center">
              <Circle size="32px" bg="green.900" color="green.300">
                <Icon as={FaShieldAlt} fontSize="16px" />
              </Circle>
              <Box flex="1">
                <Text fontWeight="600" color="white" fontSize="md">
                  Credit/Debit Card
                </Text>
                <Text fontSize="sm" color="gray.300">
                  Visa, Mastercard, American Express
                </Text>
              </Box>
              <Badge colorScheme="green" size="sm">
                Secure
              </Badge>
            </HStack>
          </Box>

          {/* Terms & Payment Section */}
          <VStack spacing={4} align="stretch">
            {/* Terms & Conditions - Enhanced */}
            <VStack spacing={4} align="stretch" p={4} bg="gray.700" borderRadius="lg" borderWidth="2px" borderColor="gray.600">
              <HStack spacing={3} align="start">
                <Checkbox
                  isChecked={step2.termsAccepted}
                  onChange={(e) => {
                    console.log('Terms checkbox changed:', e.target.checked);
                    updateFormData('step2', {
                      termsAccepted: e.target.checked,
                      privacyAccepted: e.target.checked,
                    });
                  }}
                  isInvalid={!!errors['termsAccepted']}
                  size="lg"
                  colorScheme="green"
                  mt={1}
                />
                <Box>
                  <Text fontSize="sm" fontWeight="600" color="white" lineHeight="1.5">
                    I accept the{' '}
                    <Button 
                      variant="link" 
                      colorScheme="green" 
                      size="sm" 
                      p={0} 
                      h="auto" 
                      fontWeight="700"
                      textDecoration="underline"
                      _hover={{ color: "green.600" }}
                    >
                      Terms and Conditions
                    </Button>
                    {' '}and{' '}
                    <Button 
                      variant="link" 
                      colorScheme="green" 
                      size="sm" 
                      p={0} 
                      h="auto" 
                      fontWeight="700"
                      textDecoration="underline"
                      _hover={{ color: "green.600" }}
                    >
                      Privacy Policy
                    </Button>
                  </Text>
                </Box>
              </HStack>

              <HStack spacing={3} align="start">
                <Checkbox
                  isChecked={step2.marketingOptIn || false}
                  onChange={(e) => {
                    console.log('Marketing checkbox changed:', e.target.checked);
                    updateFormData('step2', { marketingOptIn: e.target.checked });
                  }}
                  size="md"
                  colorScheme="blue"
                  mt={1}
                />
                <Text fontSize="sm" fontWeight="500" color="gray.300" lineHeight="1.5">
                  I would like to receive special offers and updates via email (optional)
                </Text>
              </HStack>
            </VStack>

            {/* Action Buttons Row */}
            <HStack spacing={4} w="full" justify="space-between">
              {/* Back to Step 1 Button */}
              <Button
                size="lg"
                colorScheme="gray"
                variant="outline"
                onClick={() => window.history.back()}
                leftIcon={<Icon as={FaBolt} />}
                borderWidth="2px"
                _hover={{ bg: 'gray.700', borderColor: 'gray.500' }}
              >
                {formData.step1.items.length === 0 
                  ? 'Add Items'
                  : 'Back to Step 1'
                }
              </Button>

              {/* Stripe Payment Button */}
              {!paymentSuccess ? (
                <StripePaymentButton
                  amount={step2.promotionDetails?.finalAmount || formData.step1.pricing.total}
                  bookingData={{
                    customer: {
                      name: `${step2.customerDetails.firstName || ''} ${step2.customerDetails.lastName || ''}`.trim(),
                      email: step2.customerDetails.email || '',
                      phone: step2.customerDetails.phone || '',
                    },
                    pickupAddress: {
                      ...formData.step1.pickupAddress,
                      // Ensure street field is populated from multiple sources
                      street: formData.step1.pickupAddress?.street || 
                             formData.step1.pickupAddress?.line1 || 
                             formData.step1.pickupAddress?.address || 
                             formData.step1.pickupAddress?.formatted_address ||
                             formData.step1.pickupAddress?.full ||
                             '',
                    },
                    dropoffAddress: {
                      ...formData.step1.dropoffAddress,
                      // Ensure street field is populated from multiple sources
                      street: formData.step1.dropoffAddress?.street || 
                             formData.step1.dropoffAddress?.line1 || 
                             formData.step1.dropoffAddress?.address || 
                             formData.step1.dropoffAddress?.formatted_address ||
                             formData.step1.dropoffAddress?.full ||
                             '',
                    },
                    items: formData.step1.items,
                    pricing: formData.step1.pricing,
                    serviceType: formData.step1.serviceType,
                    scheduledDate: formData.step1.pickupDate,
                    scheduledTime: formData.step1.pickupTimeSlot,
                    pickupDetails: formData.step1.pickupProperty,
                    dropoffDetails: formData.step1.dropoffProperty,
                    notes: step2.specialInstructions || '',
                    bookingId: step2.bookingId,
                    economyPrice,
                    standardPrice,
                    priorityPrice,
                  }}
                  onSuccess={(sessionId, paymentIntentId) => {
                    updatePaymentStatus('success');
                    updateFormData('step2', {
                      paymentMethod: {
                        type: 'stripe',
                        stripeDetails: {
                          sessionId,
                          paymentIntentId,
                        },
                      },
                    });
                  }}
                  onError={(error) => {
                    console.error('❌ Payment failed:', error);
                    updatePaymentStatus('failed');
                  }}
                  disabled={
                    !step2.termsAccepted || 
                    !step2.privacyAccepted || 
                    !step2.customerDetails.firstName ||
                    !step2.customerDetails.lastName ||
                    !step2.customerDetails.email ||
                    !formData.step1.pricing.total ||
                    formData.step1.pricing.total <= 0
                  }
                />
              ) : (
                <Alert status="success" borderRadius="xl" p={4} flex={1}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="lg">🎉 Payment Successful!</AlertTitle>
                    <AlertDescription fontSize="md">
                      Your payment has been processed successfully. You will be redirected to the confirmation page.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </HStack>
          </VStack>
        </VStack>
      </Card>

      {/* 3. Booking Summary - Enhanced */}
      <Card 
        p={{ base: 4, md: 6 }} 
        shadow="0 0 30px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.2)" 
        borderWidth="2px" 
        borderColor="rgba(59, 130, 246, 0.6)"
        bg="gray.800"
        _hover={{ shadow: "0 0 40px rgba(59, 130, 246, 0.6)", transform: "translateY(-2px)" }}
        transition="all 0.3s ease"
        borderRadius="xl"
      >
        <VStack spacing={6} align="stretch">
          <HStack spacing={3} align="center" mb={2}>
            <Circle size="40px" bg="blue.900" color="blue.300">
              <Icon as={FaBolt} fontSize="20px" />
            </Circle>
            <Box>
              <Heading size={{ base: "sm", md: "md" }} color="white" mb={1}>
                📋 Booking Summary
              </Heading>
              <Text fontSize="sm" color="gray.300">
                Review your order details before payment
              </Text>
            </Box>
          </HStack>

          {(() => {
            // Enhanced validation logic for Step 1 completion
            const hasItems = formData.step1.items.length > 0;
            const hasPickupAddress = formData.step1.pickupAddress?.full || formData.step1.pickupAddress?.line1 || formData.step1.pickupAddress?.address || formData.step1.pickupAddress?.formatted_address;
            const hasDropoffAddress = formData.step1.dropoffAddress?.full || formData.step1.dropoffAddress?.line1 || formData.step1.dropoffAddress?.address || formData.step1.dropoffAddress?.formatted_address;
            const hasValidPickupCoordinates = !!(formData.step1.pickupAddress?.coordinates?.lat && formData.step1.pickupAddress?.coordinates?.lng &&
                                                (formData.step1.pickupAddress.coordinates.lat !== 0 || formData.step1.dropoffAddress?.coordinates?.lng !== 0));
            const hasValidDropoffCoordinates = !!(formData.step1.dropoffAddress?.coordinates?.lat && formData.step1.dropoffAddress?.coordinates?.lng &&
                                                 (formData.step1.dropoffAddress?.coordinates?.lat !== 0 || formData.step1.dropoffAddress?.coordinates?.lng !== 0));
            const hasPricing = formData.step1.pricing.total > 0;
            const currentlyCalculatingPricing = isCalculatingPricing === true;

            // Step 1 is considered complete if all required data is filled, regardless of pricing status
            const step1DataComplete = hasItems && hasPickupAddress && hasDropoffAddress && hasValidPickupCoordinates && hasValidDropoffCoordinates;

            // Debug logging for pricing state
            console.log('🔍 WhoAndPaymentStep enhanced pricing check:', {
              hasItems,
              hasPickupAddress: !!hasPickupAddress,
              hasDropoffAddress: !!hasDropoffAddress,
              hasValidPickupCoordinates,
              hasValidDropoffCoordinates,
              hasPricing,
              currentlyCalculatingPricing,
              step1DataComplete,
              pricingTotal: formData.step1.pricing.total,
              pickupCoordinates: formData.step1.pickupAddress?.coordinates,
              dropoffCoordinates: formData.step1.dropoffAddress?.coordinates,
              serviceType: formData.step1.serviceType,
              shouldShowPricing: step1DataComplete && (hasPricing || currentlyCalculatingPricing)
            });

            // CRITICAL FIX: Show pricing if Step 1 data is complete AND (we have pricing OR we're calculating pricing)
            // This prevents the "Pricing not calculated yet" error when all Step 1 data is valid
            return step1DataComplete && (hasPricing || currentlyCalculatingPricing);
          })() ? (
            <VStack spacing={6} align="stretch">
              {/* Enhanced Booking Summary */}
              <Card bg="gray.800" borderRadius="xl" border="2px" borderColor="rgba(59, 130, 246, 0.6)" p={6} shadow="0 0 20px rgba(59, 130, 246, 0.3)">
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Heading size="md" color="white">
                      Booking Summary
                    </Heading>
                    <Badge 
                      colorScheme={
                        formData.step1.serviceType === 'signature' ? 'blue' : 
                        formData.step1.serviceType === 'premium' ? 'purple' : 'orange'
                      } 
                      variant="solid" 
                      fontSize="sm" 
                      px={3} 
                      py={1}
                      borderRadius="full"
                      textTransform="capitalize"
                    >
                      {formData.step1.serviceType === 'white-glove' ? 'White Glove' : formData.step1.serviceType} Service
                    </Badge>
                  </HStack>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <VStack spacing={3} align="start">
                      <Box>
                        <Text fontSize="sm" color="gray.300" fontWeight="600">Pickup Address:</Text>
                        <Text fontSize="sm" fontWeight="500" color="white">
                          {formData.step1.pickupAddress.address || 'Not specified'}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.300" fontWeight="600">Delivery Address:</Text>
                        <Text fontSize="sm" fontWeight="500" color="white">
                          {formData.step1.dropoffAddress.address || 'Not specified'}
                        </Text>
                      </Box>
                    </VStack>
                    
                    <VStack spacing={3} align="start">
                      <Box>
                        <Text fontSize="sm" color="gray.600" fontWeight="600">Date & Time:</Text>
                        <Text fontSize="sm" fontWeight="500" color="gray.800">
                          {formData.step1.pickupDate} - {formData.step1.pickupTimeSlot}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.600" fontWeight="600">Items & Distance:</Text>
                        <Text fontSize="sm" fontWeight="500" color="gray.800">
                          {formData.step1.items.length} items • {formData.step1.distance} km
                        </Text>
                      </Box>
                    </VStack>
                  </SimpleGrid>
                </VStack>
              </Card>

              {/* Selected Items Details */}
              {formData.step1.items.length > 0 && (
                <Card bg="gray.800" borderRadius="xl" border="2px" borderColor="rgba(128, 90, 213, 0.6)" p={6} shadow="0 0 20px rgba(128, 90, 213, 0.3)">
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color="white">
                      Selected Items
                    </Heading>
                    <VStack spacing={2} align="stretch">
                      {formData.step1.items.map((item, index) => (
                        <HStack key={index} justify="space-between" p={3} bg="gray.700" borderRadius="lg">
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="600" color="white">
                              {item.name} × {item.quantity}
                            </Text>
                            <Text fontSize="sm" color="gray.300">
                              {item.description}
                            </Text>
                          </VStack>
                          <VStack align="end" spacing={0}>
                            <Text fontWeight="600" color="gray.800">
                              Qty: {item.quantity}
                            </Text>
                          </VStack>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </Card>
              )}
              
              {/* Three-Tier Pricing Display */}
              {formData.step1.items.length > 0 && (
                <VStack spacing={4} align="stretch">
                  <Heading size="md" color="white" textAlign="center">
                    Choose Your Service Level
                  </Heading>

                  {/* Economy (Multi-Drop Route) - Show all three options always */}
                  {(isEconomyAvailable() || getNextEconomyDate()) && (
                    <Card
                      bg={formData.step1.serviceType === 'standard' ? "blue.900" : "gray.800"}
                      borderRadius="xl"
                      border="2px"
                      borderColor={formData.step1.serviceType === 'standard' ? "blue.400" : "rgba(59, 130, 246, 0.3)"}
                      p={4}
                      shadow="0 0 20px rgba(59, 130, 246, 0.3)"
                      cursor={isUpdatingService ? "not-allowed" : "pointer"}
                      onClick={() => handleServiceTypeChange('standard')}
                      _hover={isUpdatingService ? {} : { transform: 'translateY(-2px)', shadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
                      transition="all 0.2s"
                      opacity={isUpdatingService ? 0.7 : 1}
                    >
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between" align="center">
                        <VStack align="start" spacing={1}>
                          <HStack spacing={2}>
                            <Badge bg="green.600" color="white" borderRadius="full" fontSize="xs" px={3} py={1}>
                              ECONOMY
                            </Badge>
                            <Badge bg="blue.600" color="white" borderRadius="full" fontSize="xs" px={3} py={1}>
                              MULTI-DROP
                            </Badge>
                          </HStack>
                          <Text fontSize="lg" fontWeight="bold" color="white">
                            Multi-Drop Route
                          </Text>
                        </VStack>
                        <VStack align="end" spacing={1}>
                          <Text fontSize="2xl" fontWeight="bold" color="green.400">
                            £{calculateEconomyPrice().toFixed(2)}
                          </Text>
                          <Text fontSize="xs" color="gray.300">
                            Cheapest option
                          </Text>
                        </VStack>
                      </HStack>

                      <Divider />

                      <VStack align="start" spacing={2}>
                        <Text fontSize="sm" color="gray.300">
                          • Shared route with other customers
                        </Text>
                        <Text fontSize="sm" color="gray.300">
                          • Delivery within 7 days
                        </Text>
                        <Text fontSize="sm" color="gray.300">
                          • Van-fit capacity only
                        </Text>
                        {getNextEconomyDate() && formData.step1.pickupDate !== getNextEconomyDate() && (
                          <Text fontSize="sm" color="blue.300" fontWeight="semibold">
                            📅 Next available: {new Date(getNextEconomyDate()!).toLocaleDateString()}
                          </Text>
                        )}
                        {getNextEconomyDate() && formData.step1.pickupDate !== getNextEconomyDate() && (
                          <Text fontSize="xs" color="orange.300">
                            ⚠️ Tentative route - pending admin assignment
                          </Text>
                        )}
                      </VStack>
                    </VStack>
                  </Card>
                  )}

                  {/* Standard (Direct Van) */}
                  <Card
                    bg={formData.step1.serviceType === 'premium' ? "purple.900" : "gray.800"}
                    borderRadius="xl"
                    border="2px"
                    borderColor={formData.step1.serviceType === 'premium' ? "purple.400" : "rgba(147, 51, 234, 0.3)"}
                    p={4}
                    shadow="0 0 20px rgba(147, 51, 234, 0.3)"
                    cursor={isUpdatingService ? "not-allowed" : "pointer"}
                    onClick={() => handleServiceTypeChange('premium')}
                    _hover={isUpdatingService ? {} : { transform: 'translateY(-2px)', shadow: '0 0 30px rgba(147, 51, 234, 0.5)' }}
                    transition="all 0.2s"
                    opacity={isUpdatingService ? 0.7 : 1}
                  >
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between" align="center">
                        <VStack align="start" spacing={1}>
                          <Badge bg="purple.600" color="white" borderRadius="full" fontSize="xs" px={3} py={1}>
                            STANDARD
                          </Badge>
                          <Text fontSize="lg" fontWeight="bold" color="white">
                            Direct Van Service
                          </Text>
                        </VStack>
                        <VStack align="end" spacing={1}>
                          <Text fontSize="2xl" fontWeight="bold" color="purple.400">
                            £{calculateStandardPrice().toFixed(2)}
                          </Text>
                          <Text fontSize="xs" color="gray.300">
                            Most popular
                          </Text>
                        </VStack>
                      </HStack>

                      <Divider />

                      <VStack align="start" spacing={2}>
                        <Text fontSize="sm" color="gray.300">
                          • Dedicated van for your move
                        </Text>
                        <Text fontSize="sm" color="gray.300">
                          • Flexible scheduling
                        </Text>
                        <Text fontSize="sm" color="gray.300">
                          • Full capacity available
                        </Text>
                      </VStack>
                    </VStack>
                  </Card>

                  {/* Priority/Express (Fastest) */}
                  <Card
                    bg={formData.step1.serviceType === 'white-glove' ? "orange.900" : "gray.800"}
                    borderRadius="xl"
                    border="2px"
                    borderColor={formData.step1.serviceType === 'white-glove' ? "orange.400" : "rgba(251, 146, 60, 0.3)"}
                    p={4}
                    shadow="0 0 20px rgba(251, 146, 60, 0.3)"
                    cursor={isUpdatingService ? "not-allowed" : "pointer"}
                    onClick={() => handleServiceTypeChange('white-glove')}
                    _hover={isUpdatingService ? {} : { transform: 'translateY(-2px)', shadow: '0 0 30px rgba(251, 146, 60, 0.5)' }}
                    transition="all 0.2s"
                    opacity={isUpdatingService ? 0.7 : 1}
                  >
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between" align="center">
                        <VStack align="start" spacing={1}>
                          <Badge bg="orange.600" color="white" borderRadius="full" fontSize="xs" px={3} py={1}>
                            PRIORITY
                          </Badge>
                          <Text fontSize="lg" fontWeight="bold" color="white">
                            White Glove Service
                          </Text>
                        </VStack>
                        <VStack align="end" spacing={1}>
                          <Text fontSize="2xl" fontWeight="bold" color="orange.400">
                            £{calculatePriorityPrice().toFixed(2)}
                          </Text>
                          <Text fontSize="xs" color="gray.300">
                            Premium service
                          </Text>
                        </VStack>
                      </HStack>

                      <Divider />

                      <VStack align="start" spacing={2}>
                        <Text fontSize="sm" color="gray.300">
                          • Premium white-glove service
                        </Text>
                        <Text fontSize="sm" color="gray.300">
                          • Same-day or next-day delivery
                        </Text>
                        <Text fontSize="sm" color="gray.300">
                          • Full-service luxury moving
                        </Text>
                      </VStack>
                    </VStack>
                  </Card>

                  {/* Current Selection Summary */}
                  <Card bg="gray.800" borderRadius="xl" border="2px" borderColor="rgba(16, 185, 129, 0.6)" p={4} shadow="0 0 20px rgba(16, 185, 129, 0.3)">
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between" align="center">
                        <Text fontSize="md" fontWeight="bold" color="white">
                          Selected: {getServiceLevelDisplayName()}
                        </Text>
                        <Text fontSize="xl" fontWeight="bold" color="green.400">
                          £{getCurrentPrice().toFixed(2)}
                        </Text>
                      </HStack>

                      <Divider />

                      <VStack align="start" spacing={2}>
                        <Text fontSize="sm" color="gray.300">
                          • {getServiceLevelDescription()}
                        </Text>
                        <Text fontSize="sm" color="gray.300">
                          • {getServiceLevelFeatures()}
                        </Text>
                      </VStack>

                      <Box textAlign="center" pt={2}>
                        <Text fontSize="sm" color="green.700" fontWeight="600">
                          🛡️ Fully insured up to £50,000 • ⭐ 5-star rated service
                        </Text>
                      </Box>
                    </VStack>
                  </Card>
                </VStack>
              )}

              {/* Economy Option Unavailable Message - Show when constraints not met */}
              {!isEconomyAvailable() && !getNextEconomyDate() && formData.step1.items.length > 0 && (() => {
                // Calculate reasons dynamically for better UX
                const totalVolume = formData.step1.items.reduce((sum, item) => sum + (item.volume * item.quantity), 0);
                const totalWeight = formData.step1.items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
                const VAN_FIT_VOLUME = 15;
                const VAN_FIT_WEIGHT = 1000;
                const volumePercentage = totalVolume / VAN_FIT_VOLUME;
                const weightPercentage = totalWeight / VAN_FIT_WEIGHT;
                const loadPercentage = Math.max(volumePercentage, weightPercentage);
                const distance = formData.step1.pricing?.distance || 0;
                const largeItemsCount = formData.step1.items.reduce((count, item) => {
                  if ((item.volume || 0) > 1.0 || (item.weight || 0) > 30) {
                    return count + item.quantity;
                  }
                  return count;
                }, 0);
                
                return (
                  <Card bg="gray.800" borderRadius="xl" border="2px" borderColor="rgba(251, 146, 60, 0.6)" p={4} shadow="0 0 20px rgba(251, 146, 60, 0.3)">
                    <VStack spacing={3} align="center">
                      <Text fontSize="md" fontWeight="bold" color="orange.300" textAlign="center">
                        🚫 Economy (Multi-Drop) Option Not Available
                      </Text>
                      <VStack spacing={2} align="center">
                        <Text fontSize="sm" color="gray.300" textAlign="center">
                          Your booking doesn't qualify for multi-drop pricing because:
                        </Text>
                        <VStack spacing={1} align="start">
                          {loadPercentage >= 0.70 && (
                            <Text fontSize="xs" color="orange.300">
                              • Full load detected ({(loadPercentage * 100).toFixed(0)}% capacity - requires dedicated van)
                            </Text>
                          )}
                          {(totalVolume > VAN_FIT_VOLUME || totalWeight > VAN_FIT_WEIGHT) && loadPercentage < 0.70 && (
                            <Text fontSize="xs" color="orange.300">
                              • Exceeds van-fit capacity (15m³ / 1000kg limit)
                            </Text>
                          )}
                          {largeItemsCount > 8 && (
                            <Text fontSize="xs" color="orange.300">
                              • Too many large items ({largeItemsCount} {'>'}  8 - requires dedicated space)
                            </Text>
                          )}
                          {distance > 200 && (
                            <Text fontSize="xs" color="orange.300">
                              • Route too long ({distance.toFixed(0)} miles {'>'} 200 miles - no time for additional stops)
                            </Text>
                          )}
                          {(formData.step1.pickupProperty?.type === 'house' || formData.step1.dropoffProperty?.type === 'house') && loadPercentage >= 0.50 && (
                            <Text fontSize="xs" color="orange.300">
                              • House moving package detected - requires dedicated service
                            </Text>
                          )}
                          {formData.step1.pickupDate && new Date(formData.step1.pickupDate) > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
                            <Text fontSize="xs" color="orange.300">
                              • Selected date is more than 7 days in the future
                            </Text>
                          )}
                        </VStack>
                        <Text fontSize="sm" color="gray.300" textAlign="center">
                          Choose Standard or Priority service for your booking.
                        </Text>
                      </VStack>
                    </VStack>
                  </Card>
                );
              })()}
            </VStack>
          ) : (
            <Box p={6} bg={isCalculatingPricing ? "blue.700" : "gray.700"} borderRadius="lg" borderWidth="2px" borderColor={isCalculatingPricing ? "rgba(59, 130, 246, 0.6)" : "rgba(251, 146, 60, 0.6)"} shadow={isCalculatingPricing ? "0 0 20px rgba(59, 130, 246, 0.3)" : "0 0 20px rgba(251, 146, 60, 0.3)"}>
              <VStack spacing={4} align="center">
                <Circle size="48px" bg={isCalculatingPricing ? "blue.900" : "orange.900"} color={isCalculatingPricing ? "blue.300" : "orange.300"}>
                  <Icon as={FaBolt} fontSize="24px" />
                </Circle>
                <VStack spacing={2} align="center">
                  <Text color="white" fontWeight="600" fontSize="lg">
                    {isCalculatingPricing ? "🔄 Calculating pricing..." : "⚠️ Pricing not calculated yet"}
                  </Text>
                  <Text fontSize="sm" color="gray.300" textAlign="center">
                    {(() => {
                      const hasItems = formData.step1.items.length > 0;
                      const hasPickupAddress = formData.step1.pickupAddress?.full || formData.step1.pickupAddress?.line1 || formData.step1.pickupAddress?.address || formData.step1.pickupAddress?.formatted_address;
                      const hasDropoffAddress = formData.step1.dropoffAddress?.full || formData.step1.dropoffAddress?.line1 || formData.step1.dropoffAddress?.address || formData.step1.dropoffAddress?.formatted_address;
                      const hasValidPickupCoordinates = !!(formData.step1.pickupAddress?.coordinates?.lat && formData.step1.pickupAddress?.coordinates?.lng &&
                                                          (formData.step1.pickupAddress.coordinates.lat !== 0 || formData.step1.pickupAddress.coordinates.lng !== 0));
                      const hasValidDropoffCoordinates = !!(formData.step1.dropoffAddress?.coordinates?.lat && formData.step1.dropoffAddress?.coordinates?.lng &&
                                                           (formData.step1.dropoffAddress.coordinates.lat !== 0 || formData.step1.dropoffAddress.coordinates.lng !== 0));

                      console.log('🔍 Enhanced pricing error diagnosis:', {
                        hasItems,
                        hasPickupAddress: !!hasPickupAddress,
                        hasDropoffAddress: !!hasDropoffAddress,
                        hasValidPickupCoordinates,
                        hasValidDropoffCoordinates,
                        isCalculatingPricing,
                        pricingTotal: formData.step1.pricing.total,
                        pickupCoords: formData.step1.pickupAddress?.coordinates,
                        dropoffCoords: formData.step1.dropoffAddress?.coordinates
                      });

                      if (!hasItems) {
                        return 'Please add items to your booking to see pricing details.';
                      } else if (!hasPickupAddress || !hasDropoffAddress) {
                        return 'Please complete Step 1 with pickup and dropoff addresses to see pricing details.';
                      } else if (!hasValidPickupCoordinates || !hasValidDropoffCoordinates) {
                        return 'Please wait for address coordinates to be resolved to calculate pricing.';
                      } else if (isCalculatingPricing) {
                        return 'Calculating pricing... Please wait a moment.';
                      } else {
                        return 'Pricing calculation in progress. If this persists, please click "Calculate Pricing" below.';
                      }
                    })()}
                  </Text>
                </VStack>
              </VStack>
            </Box>
          )}
        </VStack>
      </Card>

    </VStack>
  );
}
