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
  Portal,
  ScaleFade,
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

  // Email autocomplete state
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([]);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [emailDropdownStyle, setEmailDropdownStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const emailInputRef = useRef<HTMLInputElement>(null);
  const emailDropdownRef = useRef<HTMLDivElement>(null);

  // Common email domains
  const commonEmailDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'icloud.com', 'aol.com', 'gmx.com', 'protonmail.com',
    'mail.com', 'live.com', 'msn.com', 'yandex.com',
    'zoho.com', 'fastmail.com', 'tutanota.com', 'hushmail.com',
    'btinternet.com', 'virginmedia.com', 'sky.com',
    'talktalk.net', 'plus.net', 'ntlworld.com',
    'blueyonder.co.uk', 'orange.net'
  ];

  // Extract step2 data early for use in callbacks
  const { step2 } = formData;

  // Define updateCustomerDetails before it's used in callbacks
  const updateCustomerDetails = useCallback((field: keyof CustomerDetails, value: string) => {
    updateFormData('step2', {
      customerDetails: {
        ...step2.customerDetails,
        [field]: value,
      },
    });
  }, [updateFormData, step2.customerDetails]);

  // Handle email input change with autocomplete
  const handleEmailChange = useCallback((value: string) => {
    updateCustomerDetails('email', value);
    
    // Check if user is typing and has @ symbol
    const atIndex = value.indexOf('@');
    if (atIndex > 0 && value.length > atIndex) {
      const domainPart = value.substring(atIndex + 1).toLowerCase();
      const beforeAt = value.substring(0, atIndex);
      
      // Filter domains that match what user is typing
      const matchedDomains = commonEmailDomains
        .filter(domain => domain.startsWith(domainPart))
        .map(domain => `${beforeAt}@${domain}`)
        .slice(0, 5); // Show max 5 suggestions
      
      if (matchedDomains.length > 0 && domainPart.length > 0) {
        setEmailSuggestions(matchedDomains);
        setShowEmailSuggestions(true);
      } else {
        setEmailSuggestions([]);
        setShowEmailSuggestions(false);
      }
    } else {
      setEmailSuggestions([]);
      setShowEmailSuggestions(false);
    }
  }, [updateCustomerDetails]);

  // Handle email suggestion selection
  const selectEmailSuggestion = useCallback((suggestion: string) => {
    updateCustomerDetails('email', suggestion);
    setEmailSuggestions([]);
    setShowEmailSuggestions(false);
    emailInputRef.current?.focus();
  }, [updateCustomerDetails]);

  // Update dropdown position when email suggestions are shown
  useEffect(() => {
    if (showEmailSuggestions && emailInputRef.current) {
      const rect = emailInputRef.current.getBoundingClientRect();
      setEmailDropdownStyle({
        top: rect.top + rect.height + 8,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [showEmailSuggestions, emailSuggestions]);

  // Close email suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emailDropdownRef.current &&
        !emailDropdownRef.current.contains(event.target as Node) &&
        emailInputRef.current &&
        !emailInputRef.current.contains(event.target as Node)
      ) {
        setShowEmailSuggestions(false);
      }
    };

    if (showEmailSuggestions) {
      // Use setTimeout to allow onClick handlers to fire first
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showEmailSuggestions]);
  
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
    <VStack spacing={{ base: 4, sm: 5, md: 8 }} align="stretch" p={{ base: 3, sm: 4, md: 6, lg: 8 }} w="full" overflowX="hidden">
      {/* Enhanced Step Header */}
      <Box textAlign="center" mb={{ base: 4, sm: 5, md: 6 }} w="full">
        <Heading size={{ base: "md", sm: "lg", md: "xl" }} mb={{ base: 2, sm: 2.5, md: 3 }} bgGradient="linear(to-r, purple.600, blue.600)" bgClip="text" lineHeight="1.2">
          💳 Complete Your Booking
        </Heading>
        <Text color="gray.300" fontSize={{ base: "sm", sm: "md", md: "lg" }} lineHeight="1.4" px={{ base: 2, sm: 0 }}>
          Enter your details and pay securely to confirm your move
        </Text>
      </Box>

      {/* 1. Customer Information - Enhanced */}
      <Card 
        bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
        backdropFilter="blur(20px) saturate(180%)"
        shadow="0 8px 32px rgba(168, 85, 247, 0.4), 0 0 60px rgba(168, 85, 247, 0.3), 0 0 100px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
        borderRadius="2xl"
        border="2px solid"
        borderColor="rgba(168, 85, 247, 0.5)"
        overflow="hidden"
        position="relative"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={{
          shadow: "0 12px 40px rgba(168, 85, 247, 0.5), 0 0 80px rgba(168, 85, 247, 0.4), 0 0 120px rgba(168, 85, 247, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
          borderColor: "rgba(168, 85, 247, 0.7)",
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
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, rgba(16, 185, 129, 0.05) 100%)',
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
            animation: 'shine 10s infinite',
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
        p={{ base: 4, sm: 5, md: 8 }}
      >
        <VStack spacing={8} align="stretch">
          {/* Enhanced Header */}
          <VStack spacing={3} position="relative">
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w="180px"
              h="180px"
              borderRadius="full"
              bg="radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)"
              filter="blur(35px)"
              zIndex={0}
            />
            <HStack spacing={{ base: 3, sm: 4 }} align="center" position="relative" zIndex={1}>
              <Box
                position="relative"
                w={{ base: "48px", sm: "52px", md: "56px" }}
                h={{ base: "48px", sm: "52px", md: "56px" }}
                minW={{ base: "48px", sm: "52px", md: "56px" }}
                minH={{ base: "48px", sm: "52px", md: "56px" }}
                borderRadius={{ base: "lg", md: "xl" }}
                bg="linear-gradient(135deg, rgba(168, 85, 247, 0.4) 0%, rgba(147, 51, 234, 0.3) 100%)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 4px 20px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                border="2px solid"
                borderColor="rgba(168, 85, 247, 0.5)"
                transition="all 0.3s"
                _hover={{
                  transform: "scale(1.1) rotate(5deg)",
                  boxShadow: "0 6px 30px rgba(168, 85, 247, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                }}
              >
                <Icon as={FaUser} fontSize={{ base: "20px", sm: "22px", md: "24px" }} color="white" filter="drop-shadow(0 2px 4px rgba(168, 85, 247, 0.5))" />
              </Box>
              <VStack spacing={2} align="start" flex={1}>
                <Heading 
                  size={{ base: "lg", md: "xl" }} 
                  fontWeight="700"
                  letterSpacing="0.5px"
                  bg="linear-gradient(135deg, #A78BFA 0%, #9333EA 50%, #7C3AED 100%)"
                  bgClip="text"
                  sx={{
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 4px 20px rgba(168, 85, 247, 0.3)",
                  }}
                >
                👤 Your Information
              </Heading>
                <Text 
                  fontSize={{ base: "sm", md: "md" }} 
                  color="rgba(255, 255, 255, 0.7)"
                  fontWeight="500"
                  letterSpacing="0.3px"
                >
                We'll use this to keep you updated on your move
              </Text>
              </VStack>
          </HStack>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, sm: 5, md: 6 }} w="full">
            <FormControl isRequired>
              <FormLabel 
                fontSize={{ base: "sm", sm: "md" }} 
                fontWeight="700" 
                color="rgba(255, 255, 255, 0.9)"
                letterSpacing="0.3px"
                mb={{ base: 2, sm: 2 }}
              >
                First Name
              </FormLabel>
              <Input
                placeholder="Enter your first name"
                value={step2.customerDetails.firstName}
                onChange={(e) => updateCustomerDetails('firstName', e.target.value)}
                isInvalid={!!errors['customerDetails.firstName']}
                bg="rgba(255, 255, 255, 0.05)"
                border="2px solid"
                borderColor={errors['customerDetails.firstName'] ? "rgba(239, 68, 68, 0.5)" : "rgba(255, 255, 255, 0.1)"}
                color="white"
                _placeholder={{ color: "rgba(255, 255, 255, 0.5)", fontSize: { base: "sm", sm: "md" } }}
                _hover={{ 
                  borderColor: errors['customerDetails.firstName'] ? "rgba(239, 68, 68, 0.7)" : "rgba(168, 85, 247, 0.5)",
                  bg: "rgba(255, 255, 255, 0.08)"
                }}
                _focus={{ 
                  borderColor: errors['customerDetails.firstName'] ? "rgba(239, 68, 68, 0.7)" : "rgba(168, 85, 247, 0.6)", 
                  boxShadow: errors['customerDetails.firstName'] ? "0 0 0 3px rgba(239, 68, 68, 0.2)" : "0 0 0 3px rgba(168, 85, 247, 0.2)", 
                  bg: "rgba(255, 255, 255, 0.1)"
                }}
                _active={{ bg: "rgba(255, 255, 255, 0.1)" }}
                sx={{ "&::selection": { bg: "rgba(168, 85, 247, 0.5)", color: "white" } }}
                size={{ base: "md", sm: "md" }}
                minH={{ base: "48px", sm: "44px" }}
                h={{ base: "48px", sm: "auto" }}
                fontSize={{ base: "md", sm: "md" }}
                borderRadius="xl"
                fontWeight="medium"
                transition="all 0.2s"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel 
                fontSize={{ base: "sm", sm: "md" }} 
                fontWeight="700" 
                color="rgba(255, 255, 255, 0.9)"
                letterSpacing="0.3px"
                mb={{ base: 2, sm: 2 }}
              >
                Last Name
              </FormLabel>
              <Input
                placeholder="Enter your last name"
                value={step2.customerDetails.lastName}
                onChange={(e) => updateCustomerDetails('lastName', e.target.value)}
                isInvalid={!!errors['customerDetails.lastName']}
                bg="rgba(255, 255, 255, 0.05)"
                border="2px solid"
                borderColor={errors['customerDetails.lastName'] ? "rgba(239, 68, 68, 0.5)" : "rgba(255, 255, 255, 0.1)"}
                color="white"
                _placeholder={{ color: "rgba(255, 255, 255, 0.5)", fontSize: { base: "sm", sm: "md" } }}
                _hover={{ 
                  borderColor: errors['customerDetails.lastName'] ? "rgba(239, 68, 68, 0.7)" : "rgba(168, 85, 247, 0.5)",
                  bg: "rgba(255, 255, 255, 0.08)"
                }}
                _focus={{ 
                  borderColor: errors['customerDetails.lastName'] ? "rgba(239, 68, 68, 0.7)" : "rgba(168, 85, 247, 0.6)", 
                  boxShadow: errors['customerDetails.lastName'] ? "0 0 0 3px rgba(239, 68, 68, 0.2)" : "0 0 0 3px rgba(168, 85, 247, 0.2)", 
                  bg: "rgba(255, 255, 255, 0.1)"
                }}
                _active={{ bg: "rgba(255, 255, 255, 0.1)" }}
                sx={{ "&::selection": { bg: "rgba(168, 85, 247, 0.5)", color: "white" } }}
                size={{ base: "md", sm: "md" }}
                minH={{ base: "48px", sm: "44px" }}
                h={{ base: "48px", sm: "auto" }}
                fontSize={{ base: "md", sm: "md" }}
                borderRadius="xl"
                fontWeight="medium"
                transition="all 0.2s"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel 
                fontSize={{ base: "sm", sm: "md" }} 
                fontWeight="700" 
                color="rgba(255, 255, 255, 0.9)"
                letterSpacing="0.3px"
                mb={{ base: 2, sm: 2 }}
              >
                Email Address
              </FormLabel>
              <Box position="relative">
              <Input
                  ref={emailInputRef}
                type="email"
                placeholder="Enter your email address"
                value={step2.customerDetails.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onFocus={() => {
                    if (emailSuggestions.length > 0) {
                      setShowEmailSuggestions(true);
                    }
                  }}
                isInvalid={!!errors['customerDetails.email']}
                  bg="rgba(255, 255, 255, 0.05)"
                  border="2px solid"
                  borderColor={errors['customerDetails.email'] ? "rgba(239, 68, 68, 0.5)" : "rgba(255, 255, 255, 0.1)"}
                color="white"
                  _placeholder={{ color: "rgba(255, 255, 255, 0.5)", fontSize: { base: "sm", sm: "md" } }}
                  _hover={{ 
                    borderColor: errors['customerDetails.email'] ? "rgba(239, 68, 68, 0.7)" : "rgba(168, 85, 247, 0.5)",
                    bg: "rgba(255, 255, 255, 0.08)"
                  }}
                  _focus={{ 
                    borderColor: errors['customerDetails.email'] ? "rgba(239, 68, 68, 0.7)" : "rgba(168, 85, 247, 0.6)", 
                    boxShadow: errors['customerDetails.email'] ? "0 0 0 3px rgba(239, 68, 68, 0.2)" : "0 0 0 3px rgba(168, 85, 247, 0.2)", 
                    bg: "rgba(255, 255, 255, 0.1)"
                  }}
                  _active={{ bg: "rgba(255, 255, 255, 0.1)" }}
                  sx={{ "&::selection": { bg: "rgba(168, 85, 247, 0.5)", color: "white" } }}
                size={{ base: "md", sm: "md" }}
                minH={{ base: "48px", sm: "44px" }}
                h={{ base: "48px", sm: "auto" }}
                fontSize={{ base: "md", sm: "md" }}
                  borderRadius="xl"
                fontWeight="medium"
                  transition="all 0.2s"
                />
                
                {/* Email Suggestions Dropdown */}
                {showEmailSuggestions && emailSuggestions.length > 0 && (
                  <Portal>
                    <ScaleFade in={true} initialScale={0.95}>
                      <Box
                        ref={emailDropdownRef}
                        position="fixed"
                        top={`${emailDropdownStyle.top}px`}
                        left={`${emailDropdownStyle.left}px`}
                        width={`${emailDropdownStyle.width}px`}
                        zIndex={1400}
                        bg="rgba(26, 32, 44, 0.98)"
                        backdropFilter="blur(10px)"
                        border="2px solid"
                        borderColor="rgba(168, 85, 247, 0.4)"
                        borderRadius="xl"
                        boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)"
                        maxH="200px"
                        overflowY="auto"
                        py={2}
                        css={{
                          '&::-webkit-scrollbar': {
                            width: '6px',
                          },
                          '&::-webkit-scrollbar-track': {
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '3px',
                          },
                          '&::-webkit-scrollbar-thumb': {
                            background: 'rgba(168, 85, 247, 0.3)',
                            borderRadius: '3px',
                          },
                          WebkitOverflowScrolling: 'touch',
                        }}
                      >
                        {emailSuggestions.map((suggestion, index) => (
                          <Box
                            key={index}
                            px={4}
                            py={3}
                            mx={2}
                            cursor="pointer"
                            borderRadius="lg"
                            bg="transparent"
                            border="1px solid transparent"
                            _hover={{ 
                              bg: "rgba(168, 85, 247, 0.1)",
                              borderColor: "rgba(168, 85, 247, 0.2)"
                            }}
                            transition="all 0.2s"
                            onClick={() => selectEmailSuggestion(suggestion)}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              selectEmailSuggestion(suggestion);
                            }}
                          >
                            <HStack spacing={3} align="center">
                              <Icon 
                                as={FaEnvelope} 
                                color="rgba(168, 85, 247, 0.6)" 
                                boxSize={4} 
                              />
                              <Text 
                                fontSize="sm" 
                                fontWeight="medium" 
                                color="white"
                                letterSpacing="0.2px"
                              >
                                {suggestion}
                              </Text>
                            </HStack>
                          </Box>
                        ))}
                      </Box>
                    </ScaleFade>
                  </Portal>
                )}
              </Box>
            </FormControl>

            <FormControl isRequired>
              <FormLabel 
                fontSize={{ base: "sm", sm: "md" }} 
                fontWeight="700" 
                color="rgba(255, 255, 255, 0.9)"
                letterSpacing="0.3px"
                mb={{ base: 2, sm: 2 }}
              >
                Phone Number
              </FormLabel>
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={step2.customerDetails.phone}
                onChange={(e) => updateCustomerDetails('phone', e.target.value)}
                isInvalid={!!errors['customerDetails.phone']}
                bg="rgba(255, 255, 255, 0.05)"
                border="2px solid"
                borderColor={errors['customerDetails.phone'] ? "rgba(239, 68, 68, 0.5)" : "rgba(255, 255, 255, 0.1)"}
                color="white"
                _placeholder={{ color: "rgba(255, 255, 255, 0.5)", fontSize: { base: "sm", sm: "md" } }}
                _hover={{ 
                  borderColor: errors['customerDetails.phone'] ? "rgba(239, 68, 68, 0.7)" : "rgba(168, 85, 247, 0.5)",
                  bg: "rgba(255, 255, 255, 0.08)"
                }}
                _focus={{ 
                  borderColor: errors['customerDetails.phone'] ? "rgba(239, 68, 68, 0.7)" : "rgba(168, 85, 247, 0.6)", 
                  boxShadow: errors['customerDetails.phone'] ? "0 0 0 3px rgba(239, 68, 68, 0.2)" : "0 0 0 3px rgba(168, 85, 247, 0.2)", 
                  bg: "rgba(255, 255, 255, 0.1)"
                }}
                _active={{ bg: "rgba(255, 255, 255, 0.1)" }}
                sx={{ "&::selection": { bg: "rgba(168, 85, 247, 0.5)", color: "white" } }}
                size={{ base: "md", sm: "md" }}
                minH={{ base: "48px", sm: "44px" }}
                h={{ base: "48px", sm: "auto" }}
                fontSize={{ base: "md", sm: "md" }}
                borderRadius="xl"
                fontWeight="medium"
                transition="all 0.2s"
              />
            </FormControl>
          </SimpleGrid>

          <FormControl>
            <FormLabel 
              fontSize={{ base: "sm", sm: "md" }} 
              fontWeight="700" 
              color="rgba(255, 255, 255, 0.9)"
              letterSpacing="0.3px"
              mb={{ base: 2, sm: 2 }}
            >
              Company Name <Text as="span" color="rgba(255, 255, 255, 0.5)" fontSize={{ base: "xs", sm: "sm" }} fontWeight="500">(Optional)</Text>
            </FormLabel>
            <Input
              placeholder="Enter your company name (if applicable)"
              value={step2.customerDetails.company || ''}
              onChange={(e) => updateCustomerDetails('company', e.target.value)}
              bg="rgba(255, 255, 255, 0.05)"
              border="2px solid"
              borderColor="rgba(255, 255, 255, 0.1)"
              color="white"
              _placeholder={{ color: "rgba(255, 255, 255, 0.5)", fontSize: { base: "sm", sm: "md" } }}
              _hover={{ 
                borderColor: "rgba(168, 85, 247, 0.5)",
                bg: "rgba(255, 255, 255, 0.08)"
              }}
              _focus={{ 
                borderColor: "rgba(168, 85, 247, 0.6)", 
                boxShadow: "0 0 0 3px rgba(168, 85, 247, 0.2)", 
                bg: "rgba(255, 255, 255, 0.1)"
              }}
              _active={{ bg: "rgba(255, 255, 255, 0.1)" }}
              sx={{ "&::selection": { bg: "rgba(168, 85, 247, 0.5)", color: "white" } }}
              size={{ base: "md", sm: "md" }}
              minH={{ base: "48px", sm: "44px" }}
              h={{ base: "48px", sm: "auto" }}
              fontSize={{ base: "md", sm: "md" }}
              borderRadius="xl"
              fontWeight="medium"
              transition="all 0.2s"
            />
          </FormControl>
        </VStack>
      </Card>

      {/* Special Instructions - Enhanced */}
      <Card 
        bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
        backdropFilter="blur(20px) saturate(180%)"
        shadow="0 8px 32px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.3), 0 0 100px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
        borderRadius="2xl"
        border="2px solid"
        borderColor="rgba(59, 130, 246, 0.5)"
        overflow="hidden"
        position="relative"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={{
          shadow: "0 12px 40px rgba(59, 130, 246, 0.5), 0 0 80px rgba(59, 130, 246, 0.4), 0 0 120px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
          borderColor: "rgba(59, 130, 246, 0.7)",
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
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 50%, rgba(168, 85, 247, 0.05) 100%)',
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
            animation: 'shine 10s infinite',
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
        p={{ base: 4, sm: 5, md: 8 }}
      >
        <VStack spacing={{ base: 4, sm: 5, md: 6 }} align="stretch" w="full">
          {/* Enhanced Header */}
          <VStack spacing={{ base: 2, sm: 2.5, md: 3 }} position="relative" w="full">
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w={{ base: "120px", sm: "150px", md: "180px" }}
              h={{ base: "120px", sm: "150px", md: "180px" }}
              borderRadius="full"
              bg="radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)"
              filter="blur(35px)"
              zIndex={0}
            />
            <HStack spacing={{ base: 2.5, sm: 3 }} align="center" position="relative" zIndex={1} w="full">
              <Box
                position="relative"
                w={{ base: "44px", sm: "48px", md: "56px" }}
                h={{ base: "44px", sm: "48px", md: "56px" }}
                minW={{ base: "44px", sm: "48px", md: "56px" }}
                minH={{ base: "44px", sm: "48px", md: "56px" }}
                flexShrink={0}
                borderRadius={{ base: "lg", md: "xl" }}
                bg="linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.3) 100%)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 4px 20px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                border="2px solid"
                borderColor="rgba(59, 130, 246, 0.5)"
                transition="all 0.3s"
                _hover={{
                  transform: "scale(1.1) rotate(5deg)",
                  boxShadow: "0 6px 30px rgba(59, 130, 246, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                }}
              >
                <Icon as={FaFileContract} fontSize={{ base: "18px", sm: "20px", md: "24px" }} color="white" filter="drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5))" />
              </Box>
              <VStack spacing={{ base: 1, sm: 1.5 }} align="start" flex={1} minW={0}>
                <Heading 
                  size={{ base: "sm", sm: "md", md: "xl" }} 
                  fontWeight="700"
                  letterSpacing="0.5px"
                  bg="linear-gradient(135deg, #3B82F6 0%, #2563EB 50%, #1D4ED8 100%)"
                  bgClip="text"
                  sx={{
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 4px 20px rgba(59, 130, 246, 0.3)",
                  }}
                  lineHeight="1.2"
                  noOfLines={2}
                >
                📝 Special Instructions
              </Heading>
                <Text 
                  fontSize={{ base: "xs", sm: "sm", md: "md" }} 
                  color="rgba(255, 255, 255, 0.7)"
                  fontWeight="500"
                  letterSpacing="0.3px"
                  lineHeight="1.3"
                  noOfLines={2}
                >
                Any special requests or notes for your move
              </Text>
              </VStack>
          </HStack>
          </VStack>

          <FormControl>
            <FormLabel 
              fontSize={{ base: "sm", sm: "md" }} 
              fontWeight="700" 
              color="rgba(255, 255, 255, 0.9)"
              letterSpacing="0.3px"
              mb={{ base: 2, sm: 3 }}
            >
              Additional Details
            </FormLabel>
            <Textarea 
              placeholder="Any special instructions or requests for your move... (e.g., fragile items, access instructions, preferred timing, etc.)"
              value={step2.specialInstructions || ''}
              onChange={(e) => updateFormData('step2', { specialInstructions: e.target.value })}
              rows={4}
              minH={{ base: "100px", sm: "120px" }}
              bg="rgba(255, 255, 255, 0.05)"
              border="2px solid"
              borderColor="rgba(59, 130, 246, 0.3)"
              color="white"
              _placeholder={{ 
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: { base: "xs", sm: "sm" },
                fontWeight: "400"
              }}
              _hover={{ 
                borderColor: "rgba(59, 130, 246, 0.5)",
                bg: "rgba(255, 255, 255, 0.08)",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)"
              }}
              _focus={{ 
                borderColor: "rgba(59, 130, 246, 0.7)", 
                boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.2), 0 4px 16px rgba(59, 130, 246, 0.3)", 
                bg: "rgba(255, 255, 255, 0.1)",
                outline: "none"
              }}
              _active={{ 
                bg: "rgba(255, 255, 255, 0.1)",
                borderColor: "rgba(59, 130, 246, 0.7)"
              }}
              sx={{ 
                "&::selection": { 
                  bg: "rgba(59, 130, 246, 0.5)", 
                  color: "white" 
                } 
              }}
              borderRadius={{ base: "lg", md: "xl" }}
              fontSize={{ base: "sm", sm: "md" }}
              fontWeight="medium"
              letterSpacing="0.2px"
              lineHeight="1.6"
              resize="vertical"
              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            />
            <HStack spacing={2} mt={3} align="center">
              <Icon as={FaFileContract} fontSize="12px" color="rgba(59, 130, 246, 0.6)" />
              <Text fontSize="xs" color="rgba(255, 255, 255, 0.5)" fontWeight="500" letterSpacing="0.2px">
                Examples: Fragile items, access instructions, preferred timing, parking restrictions, floor access, etc.
            </Text>
            </HStack>
          </FormControl>
        </VStack>
      </Card>

      {/* Promotion Code Section - Enhanced */}
      <Card 
        bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
        backdropFilter="blur(20px) saturate(180%)"
        shadow="0 8px 32px rgba(251, 146, 60, 0.4), 0 0 60px rgba(251, 146, 60, 0.3), 0 0 100px rgba(251, 146, 60, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
        borderRadius="2xl"
        border="2px solid"
        borderColor="rgba(251, 146, 60, 0.5)"
        overflow="hidden"
        position="relative"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={{
          shadow: "0 12px 40px rgba(251, 146, 60, 0.5), 0 0 80px rgba(251, 146, 60, 0.4), 0 0 120px rgba(251, 146, 60, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
          borderColor: "rgba(251, 146, 60, 0.7)",
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
            background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.1) 0%, rgba(16, 185, 129, 0.05) 50%, rgba(59, 130, 246, 0.05) 100%)',
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
            animation: 'shine 10s infinite',
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
        p={{ base: 4, sm: 5, md: 8 }}
      >
        <VStack spacing={{ base: 4, sm: 5, md: 6 }} align="stretch" w="full">
          {/* Enhanced Header */}
          <VStack spacing={{ base: 2, sm: 2.5, md: 3 }} position="relative" w="full">
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w={{ base: "120px", sm: "150px", md: "180px" }}
              h={{ base: "120px", sm: "150px", md: "180px" }}
              borderRadius="full"
              bg="radial-gradient(circle, rgba(251, 146, 60, 0.15) 0%, transparent 70%)"
              filter="blur(35px)"
              zIndex={0}
            />
            <HStack spacing={{ base: 2.5, sm: 3 }} align="center" position="relative" zIndex={1} w="full">
              <Box
                position="relative"
                w={{ base: "44px", sm: "48px", md: "56px" }}
                h={{ base: "44px", sm: "48px", md: "56px" }}
                minW={{ base: "44px", sm: "48px", md: "56px" }}
                minH={{ base: "44px", sm: "48px", md: "56px" }}
                flexShrink={0}
                borderRadius={{ base: "lg", md: "xl" }}
                bg="linear-gradient(135deg, rgba(251, 146, 60, 0.4) 0%, rgba(234, 88, 12, 0.3) 100%)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 4px 20px rgba(251, 146, 60, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                border="2px solid"
                borderColor="rgba(251, 146, 60, 0.5)"
                transition="all 0.3s"
                _hover={{
                  transform: "scale(1.1) rotate(5deg)",
                  boxShadow: "0 6px 30px rgba(251, 146, 60, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                }}
              >
                <Icon as={FaCalculator} fontSize={{ base: "18px", sm: "20px", md: "24px" }} color="white" filter="drop-shadow(0 2px 4px rgba(251, 146, 60, 0.5))" />
              </Box>
              <VStack spacing={{ base: 1, sm: 1.5 }} align="start" flex={1} minW={0}>
                <Heading 
                  size={{ base: "sm", sm: "md", md: "xl" }} 
                  fontWeight="700"
                  letterSpacing="0.5px"
                  bg="linear-gradient(135deg, #FB923C 0%, #EA580C 50%, #DC2626 100%)"
                  bgClip="text"
                  sx={{
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 4px 20px rgba(251, 146, 60, 0.3)",
                  }}
                  lineHeight="1.2"
                  noOfLines={2}
                >
                🎟️ Promotion Code
              </Heading>
                <Text 
                  fontSize={{ base: "xs", sm: "sm", md: "md" }} 
                  color="rgba(255, 255, 255, 0.7)"
                  fontWeight="500"
                  letterSpacing="0.3px"
                  lineHeight="1.3"
                  noOfLines={2}
                >
                Enter a valid promotion code to get a discount
              </Text>
              </VStack>
          </HStack>
          </VStack>

          {step2.promotionDetails ? (
            // Show applied promotion - Enhanced
            <Card 
              bg="linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)"
              backdropFilter="blur(10px)"
              borderRadius="xl" 
              border="2px solid" 
              borderColor="rgba(16, 185, 129, 0.5)" 
              p={6}
              shadow="0 4px 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                opacity: 0.5,
                zIndex: 0,
                pointerEvents: 'none',
              }}
            >
              <VStack spacing={4} align="stretch" position="relative" zIndex={1}>
                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={2}>
                    <Heading size="md" color="white" fontWeight="700" letterSpacing="0.3px">
                      {step2.promotionDetails.name}
                    </Heading>
                    <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" fontWeight="500">
                      {step2.promotionDetails.description}
                    </Text>
                  </VStack>
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    onClick={handleRemovePromotionCode}
                    borderWidth="2px"
                    borderRadius="xl"
                    fontWeight="700"
                    letterSpacing="0.3px"
                    _hover={{
                      bg: "rgba(239, 68, 68, 0.2)",
                      borderColor: "rgba(239, 68, 68, 0.7)",
                      transform: "translateY(-1px)",
                      boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                    }}
                    transition="all 0.2s"
                  >
                    Remove
                  </Button>
                </HStack>
                
                <Divider borderColor="rgba(255, 255, 255, 0.1)" />
                
                <VStack spacing={3} align="stretch">
                <HStack justify="space-between" align="center">
                    <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" fontWeight="600">
                    Discount Applied:
                  </Text>
                    <Text fontWeight="bold" color="green.400" fontSize="xl" letterSpacing="0.3px">
                    -£{step2.promotionDetails.discountAmount?.toFixed(2)}
                  </Text>
                </HStack>
                
                <HStack justify="space-between" align="center">
                    <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)" fontWeight="500">
                    Original Price:
                  </Text>
                    <Text fontSize="sm" color="rgba(255, 255, 255, 0.5)" textDecoration="line-through" fontWeight="500">
                    £{step2.promotionDetails.originalAmount?.toFixed(2)}
                  </Text>
                </HStack>
                  
                  <Divider borderColor="rgba(255, 255, 255, 0.1)" />
                
                <HStack justify="space-between" align="center">
                    <Text fontSize="md" fontWeight="700" color="white" letterSpacing="0.3px">
                    Final Price:
                  </Text>
                    <Text fontWeight="bold" color="green.400" fontSize="2xl" letterSpacing="0.3px">
                    £{step2.promotionDetails.finalAmount?.toFixed(2)}
                  </Text>
                </HStack>
                </VStack>
              </VStack>
            </Card>
          ) : (
            // Show promotion code input - Enhanced
            <VStack spacing={4} align="stretch">
              <Input
                placeholder="Enter promotion code (e.g., SAVE20, WELCOME10)"
                value={promotionCode}
                onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
                bg="rgba(255, 255, 255, 0.05)"
                border="2px solid"
                borderColor="rgba(251, 146, 60, 0.3)"
                color="white"
                _placeholder={{ 
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "sm",
                  fontWeight: "400"
                }}
                _hover={{ 
                  borderColor: "rgba(251, 146, 60, 0.5)",
                  bg: "rgba(255, 255, 255, 0.08)",
                  boxShadow: "0 4px 12px rgba(251, 146, 60, 0.2)"
                }}
                _focus={{ 
                  borderColor: "rgba(251, 146, 60, 0.7)", 
                  boxShadow: "0 0 0 3px rgba(251, 146, 60, 0.2), 0 4px 16px rgba(251, 146, 60, 0.3)", 
                  bg: "rgba(255, 255, 255, 0.1)",
                  outline: "none"
                }}
                _active={{ 
                  bg: "rgba(255, 255, 255, 0.1)",
                  borderColor: "rgba(251, 146, 60, 0.7)"
                }}
                sx={{ 
                  "&::selection": { 
                    bg: "rgba(251, 146, 60, 0.5)", 
                    color: "white" 
                  } 
                }}
                size="md"
                borderRadius="xl"
                fontWeight="700"
                letterSpacing="0.3px"
                fontSize="md"
                textTransform="uppercase"
                w="full"
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleApplyPromotionCode();
                  }
                }}
              />
              <Button
                bg="linear-gradient(135deg, #FB923C 0%, #EA580C 100%)"
                color="white"
                onClick={handleApplyPromotionCode}
                isLoading={isValidatingPromotion}
                loadingText="Validating..."
                disabled={!promotionCode.trim() || isValidatingPromotion}
                size="md"
                px={8}
                borderRadius="xl"
                fontWeight="700"
                letterSpacing="0.3px"
                boxShadow="0 4px 16px rgba(251, 146, 60, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                border="2px solid"
                borderColor="rgba(251, 146, 60, 0.5)"
                w="full"
                _hover={{
                  bg: "linear-gradient(135deg, #EA580C 0%, #DC2626 100%)",
                  boxShadow: "0 6px 20px rgba(251, 146, 60, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                  transform: "translateY(-1px)",
                }}
                _active={{
                  transform: "translateY(0)",
                }}
                _disabled={{
                  opacity: 0.5,
                  cursor: "not-allowed",
                  bg: "rgba(251, 146, 60, 0.3)",
                }}
                transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              >
                Apply
              </Button>
            </VStack>
          )}
        </VStack>
      </Card>

      {/* 2. Payment Method - Enhanced */}
      <Card 
        bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
        backdropFilter="blur(20px) saturate(180%)"
        shadow="0 8px 32px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.3), 0 0 100px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
        borderRadius="2xl"
        border="2px solid"
        borderColor="rgba(16, 185, 129, 0.5)"
        overflow="hidden"
        position="relative"
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        _hover={{
          shadow: "0 12px 40px rgba(16, 185, 129, 0.5), 0 0 80px rgba(16, 185, 129, 0.4), 0 0 120px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
          borderColor: "rgba(16, 185, 129, 0.7)",
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
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 50%, rgba(59, 130, 246, 0.05) 100%)',
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
            animation: 'shine 10s infinite',
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
        p={{ base: 4, sm: 5, md: 8 }}
      >
        <VStack spacing={{ base: 4, sm: 5, md: 6 }} align="stretch" w="full">
          {/* Enhanced Header */}
          <VStack spacing={{ base: 2, sm: 2.5, md: 3 }} position="relative" w="full">
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w={{ base: "120px", sm: "150px", md: "180px" }}
              h={{ base: "120px", sm: "150px", md: "180px" }}
              borderRadius="full"
              bg="radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)"
              filter="blur(35px)"
              zIndex={0}
            />
            <HStack spacing={{ base: 2.5, sm: 3 }} align="center" position="relative" zIndex={1} w="full">
              <Box
                position="relative"
                w={{ base: "44px", sm: "48px", md: "56px" }}
                h={{ base: "44px", sm: "48px", md: "56px" }}
                minW={{ base: "44px", sm: "48px", md: "56px" }}
                minH={{ base: "44px", sm: "48px", md: "56px" }}
                flexShrink={0}
                borderRadius={{ base: "lg", md: "xl" }}
                bg="linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.3) 100%)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 4px 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                border="2px solid"
                borderColor="rgba(16, 185, 129, 0.5)"
                transition="all 0.3s"
                _hover={{
                  transform: "scale(1.1) rotate(5deg)",
                  boxShadow: "0 6px 30px rgba(16, 185, 129, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                }}
              >
                <Icon as={FaCreditCard} fontSize={{ base: "18px", sm: "20px", md: "24px" }} color="white" filter="drop-shadow(0 2px 4px rgba(16, 185, 129, 0.5))" />
              </Box>
              <VStack spacing={{ base: 1, sm: 1.5 }} align="start" flex={1} minW={0}>
                <Heading 
                  size={{ base: "sm", sm: "md", md: "xl" }} 
                  fontWeight="700"
                  letterSpacing="0.5px"
                  bg="linear-gradient(135deg, #10B981 0%, #059669 50%, #047857 100%)"
                  bgClip="text"
                  sx={{
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
                  }}
                  lineHeight="1.2"
                  noOfLines={2}
                >
                💳 Payment Method
              </Heading>
                <Text 
                  fontSize={{ base: "xs", sm: "sm", md: "md" }} 
                  color="rgba(255, 255, 255, 0.7)"
                  fontWeight="500"
                  letterSpacing="0.3px"
                  lineHeight="1.3"
                  noOfLines={2}
                >
                Secure payment processed by Stripe
              </Text>
              </VStack>
          </HStack>
          </VStack>

          {/* Stripe Payment Card - Enhanced - Hidden on mobile */}
          <Box 
            p={6} 
            bg="linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)"
            backdropFilter="blur(10px)"
            borderRadius="xl" 
            borderWidth="2px" 
            borderColor="rgba(16, 185, 129, 0.4)"
            boxShadow="0 4px 16px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
            position="relative"
            overflow="hidden"
            transition="all 0.3s"
            display={{ base: "none", md: "block" }}
            _hover={{
              borderColor: "rgba(16, 185, 129, 0.6)",
              boxShadow: "0 6px 20px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
              transform: "translateY(-2px)",
            }}
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
              opacity: 0.5,
              zIndex: 0,
              pointerEvents: 'none',
            }}
          >
            <HStack spacing={4} align="center" position="relative" zIndex={1}>
              <Box
                position="relative"
                w="48px"
                h="48px"
                borderRadius="xl"
                bg="linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.3) 100%)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 4px 16px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                border="2px solid"
                borderColor="rgba(16, 185, 129, 0.5)"
                transition="all 0.3s"
                _hover={{
                  transform: "scale(1.1) rotate(5deg)",
                  boxShadow: "0 6px 24px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                }}
              >
                <Icon as={FaShieldAlt} fontSize="20px" color="white" filter="drop-shadow(0 2px 4px rgba(16, 185, 129, 0.5))" />
              </Box>
              <VStack spacing={1} align="start" flex={1}>
                <Text fontWeight="700" color="white" fontSize="md" letterSpacing="0.3px">
                  Credit/Debit Card
                </Text>
                <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" fontWeight="500">
                  Visa, Mastercard, American Express, Apple Pay, Google Pay
                </Text>
              </VStack>
              <Badge 
                bg="linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.3) 100%)"
                color="white"
                size="md"
                px={4}
                py={2}
                borderRadius="xl"
                fontWeight="700"
                letterSpacing="0.3px"
                boxShadow="0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                border="2px solid"
                borderColor="rgba(16, 185, 129, 0.5)"
                fontSize="sm"
                textTransform="uppercase"
              >
                Secure
              </Badge>
            </HStack>
          </Box>

          {/* Terms & Payment Section */}
          <VStack spacing={4} align="stretch">
            {/* Terms & Conditions - Enhanced */}
            <VStack spacing={{ base: 3, sm: 4 }} align="stretch" p={{ base: 3, sm: 4 }} bg="gray.700" borderRadius={{ base: "md", md: "lg" }} borderWidth="2px" borderColor="gray.600" w="full">
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

            {/* Service Level Selection - Moved before payment */}
              {formData.step1.items.length > 0 && (
              <VStack spacing={{ base: 4, sm: 5, md: 6 }} align="stretch" mt={{ base: 4, sm: 5, md: 6 }} w="full">
                  {/* Enhanced Header */}
                  <VStack spacing={3} position="relative">
                    <Box
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      w="200px"
                      h="200px"
                      borderRadius="full"
                      bg="radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.1) 50%, rgba(168, 85, 247, 0.1) 100%)"
                      filter="blur(40px)"
                      zIndex={0}
                    />
                    <Heading 
                      size={{ base: "lg", md: "xl" }} 
                      color="white" 
                      textAlign="center"
                      fontWeight="700"
                      letterSpacing="0.5px"
                      bg="linear-gradient(135deg, #3B82F6 0%, #10B981 50%, #A78BFA 100%)"
                      bgClip="text"
                      sx={{
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        textShadow: "0 4px 20px rgba(59, 130, 246, 0.3)",
                      }}
                      position="relative"
                      zIndex={1}
                    >
                      Choose Your Service Level
                    </Heading>
                    <Text 
                      fontSize={{ base: "sm", md: "md" }} 
                      color="rgba(255, 255, 255, 0.7)"
                      textAlign="center"
                      fontWeight="500"
                      letterSpacing="0.3px"
                      position="relative"
                      zIndex={1}
                    >
                      Select the service level that best fits your needs
                    </Text>
                  </VStack>

                  {/* Economy (Multi-Drop Route) - Show all three options always */}
                  {(isEconomyAvailable() || getNextEconomyDate()) && (
                    <Card
                      bg={formData.step1.serviceType === 'standard' 
                        ? "linear-gradient(135deg, rgba(37, 99, 235, 0.4) 0%, rgba(29, 78, 216, 0.3) 100%)" 
                        : "linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(26, 32, 44, 0.7) 100%)"}
                      backdropFilter="blur(10px)"
                      borderRadius="xl"
                      border={formData.step1.serviceType === 'standard' ? "3px solid" : "2px solid"}
                      borderColor={formData.step1.serviceType === 'standard' ? "rgba(59, 130, 246, 1)" : "rgba(59, 130, 246, 0.3)"}
                      p={6}
                      shadow={formData.step1.serviceType === 'standard' 
                        ? "0 12px 48px rgba(59, 130, 246, 0.6), 0 0 80px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 4px rgba(59, 130, 246, 0.2)" 
                        : "0 4px 16px rgba(59, 130, 246, 0.2)"}
                      cursor={isUpdatingService ? "not-allowed" : "pointer"}
                      onClick={() => handleServiceTypeChange('standard')}
                      transform={formData.step1.serviceType === 'standard' ? 'scale(1.02)' : 'scale(1)'}
                      _hover={isUpdatingService ? {} : { 
                        transform: formData.step1.serviceType === 'standard' ? 'scale(1.03) translateY(-4px)' : 'translateY(-4px)', 
                        shadow: formData.step1.serviceType === 'standard' 
                          ? '0 16px 56px rgba(59, 130, 246, 0.7), 0 0 100px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 0 0 5px rgba(59, 130, 246, 0.3)'
                          : '0 12px 40px rgba(59, 130, 246, 0.5), 0 0 80px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                        borderColor: formData.step1.serviceType === 'standard' ? 'rgba(59, 130, 246, 1)' : 'rgba(59, 130, 246, 0.7)'
                      }}
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      opacity={isUpdatingService ? 0.7 : 1}
                      position="relative"
                      overflow="visible"
                      sx={{
                        '&::before': formData.step1.serviceType === 'standard' ? {
                          content: '""',
                          position: 'absolute',
                          top: '-4px',
                          left: '-4px',
                          right: '-4px',
                          bottom: '-4px',
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(16, 185, 129, 0.2) 100%)',
                          borderRadius: 'xl',
                          opacity: 0.8,
                          zIndex: -1,
                          pointerEvents: 'none',
                          animation: 'pulse 2s ease-in-out infinite',
                        } : {},
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 0.8 },
                          '50%': { opacity: 0.4 },
                        },
                      }}
                    >
                    <VStack spacing={4} align="stretch" position="relative" zIndex={1}>
                      {formData.step1.serviceType === 'standard' && (
                        <Box position="absolute" top={-2} right={-2} zIndex={10}>
                          <Circle size="40px" bg="green.500" color="white" boxShadow="0 4px 20px rgba(16, 185, 129, 0.6)">
                            <Icon as={FaCheckCircle} fontSize="20px" />
                          </Circle>
                        </Box>
                      )}
                      <VStack spacing={2} align="center">
                        <VStack spacing={2}>
                          <Badge 
                            bg="linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.3) 100%)"
                            color="white" 
                            borderRadius="full" 
                            fontSize="xs" 
                            px={4} 
                            py={2}
                            fontWeight="700"
                            letterSpacing="0.3px"
                            boxShadow="0 4px 12px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                            border="2px solid"
                            borderColor="rgba(16, 185, 129, 0.5)"
                          >
                            ECONOMY
                          </Badge>
                          <Badge 
                            bg="linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.3) 100%)"
                            color="white" 
                            borderRadius="full" 
                            fontSize="xs" 
                            px={4} 
                            py={2}
                            fontWeight="700"
                            letterSpacing="0.3px"
                            boxShadow="0 4px 12px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                            border="2px solid"
                            borderColor="rgba(59, 130, 246, 0.5)"
                          >
                            MULTI-DROP
                          </Badge>
                        </VStack>
                        <Heading size="md" fontWeight="700" color="white" letterSpacing="0.3px" textAlign="center">
                          Multi-Drop Route
                        </Heading>
                      </VStack>
                      
                      <VStack spacing={1} align="center">
                        <Text fontSize="4xl" fontWeight="bold" color="green.400" letterSpacing="0.3px" textAlign="center">
                          £{calculateEconomyPrice().toFixed(2)}
                        </Text>
                        <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)" fontWeight="600" letterSpacing="0.2px" textAlign="center">
                          Cheapest option
                        </Text>
                      </VStack>

                      <Divider borderColor="rgba(255, 255, 255, 0.1)" />

                      <VStack align="start" spacing={3}>
                        <HStack spacing={2} align="center">
                          <Box w="6px" h="6px" borderRadius="full" bg="green.400" boxShadow="0 0 8px rgba(16, 185, 129, 0.6)" />
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500" letterSpacing="0.2px">
                            Shared route with other customers
                          </Text>
                        </HStack>
                        <HStack spacing={2} align="center">
                          <Box w="6px" h="6px" borderRadius="full" bg="blue.400" boxShadow="0 0 8px rgba(59, 130, 246, 0.6)" />
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500" letterSpacing="0.2px">
                            Delivery within 7 days
                          </Text>
                        </HStack>
                        <HStack spacing={2} align="center">
                          <Box w="6px" h="6px" borderRadius="full" bg="purple.400" boxShadow="0 0 8px rgba(168, 85, 247, 0.6)" />
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500" letterSpacing="0.2px">
                            Van-fit capacity only
                          </Text>
                        </HStack>
                        {getNextEconomyDate() && formData.step1.pickupDate !== getNextEconomyDate() && (
                          <HStack spacing={2} align="center" mt={2}>
                            <Box w="6px" h="6px" borderRadius="full" bg="blue.300" boxShadow="0 0 8px rgba(59, 130, 246, 0.6)" />
                            <Text fontSize="sm" color="blue.300" fontWeight="600" letterSpacing="0.2px">
                              📅 Next available: {new Date(getNextEconomyDate()!).toLocaleDateString()}
                            </Text>
                          </HStack>
                        )}
                        {getNextEconomyDate() && formData.step1.pickupDate !== getNextEconomyDate() && (
                          <HStack spacing={2} align="center">
                            <Box w="6px" h="6px" borderRadius="full" bg="orange.300" boxShadow="0 0 8px rgba(251, 146, 60, 0.6)" />
                            <Text fontSize="xs" color="orange.300" fontWeight="500" letterSpacing="0.2px">
                              ⚠️ Tentative route - pending admin assignment
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </VStack>
                  </Card>
                  )}

                  {/* Standard (Direct Van) */}
                  <Card
                    bg={formData.step1.serviceType === 'premium' 
                      ? "linear-gradient(135deg, rgba(147, 51, 234, 0.4) 0%, rgba(126, 34, 206, 0.3) 100%)" 
                      : "linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(26, 32, 44, 0.7) 100%)"}
                    backdropFilter="blur(10px)"
                    borderRadius="xl"
                    border={formData.step1.serviceType === 'premium' ? "3px solid" : "2px solid"}
                    borderColor={formData.step1.serviceType === 'premium' ? "rgba(168, 85, 247, 1)" : "rgba(147, 51, 234, 0.3)"}
                    p={6}
                    shadow={formData.step1.serviceType === 'premium' 
                      ? "0 12px 48px rgba(168, 85, 247, 0.6), 0 0 80px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 4px rgba(168, 85, 247, 0.2)" 
                      : "0 4px 16px rgba(168, 85, 247, 0.2)"}
                    cursor={isUpdatingService ? "not-allowed" : "pointer"}
                    onClick={() => handleServiceTypeChange('premium')}
                    transform={formData.step1.serviceType === 'premium' ? 'scale(1.02)' : 'scale(1)'}
                    _hover={isUpdatingService ? {} : { 
                      transform: formData.step1.serviceType === 'premium' ? 'scale(1.03) translateY(-4px)' : 'translateY(-4px)', 
                      shadow: formData.step1.serviceType === 'premium' 
                        ? '0 16px 56px rgba(168, 85, 247, 0.7), 0 0 100px rgba(168, 85, 247, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 0 0 5px rgba(168, 85, 247, 0.3)'
                        : '0 12px 40px rgba(168, 85, 247, 0.5), 0 0 80px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                      borderColor: formData.step1.serviceType === 'premium' ? 'rgba(168, 85, 247, 1)' : 'rgba(168, 85, 247, 0.7)'
                    }}
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    opacity={isUpdatingService ? 0.7 : 1}
                    position="relative"
                    overflow="visible"
                    sx={{
                      '&::before': formData.step1.serviceType === 'premium' ? {
                        content: '""',
                        position: 'absolute',
                        top: '-4px',
                        left: '-4px',
                        right: '-4px',
                        bottom: '-4px',
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(59, 130, 246, 0.2) 100%)',
                        borderRadius: 'xl',
                        opacity: 0.8,
                        zIndex: -1,
                        pointerEvents: 'none',
                        animation: 'pulse 2s ease-in-out infinite',
                      } : {},
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 0.8 },
                        '50%': { opacity: 0.4 },
                      },
                    }}
                  >
                    <VStack spacing={4} align="stretch" position="relative" zIndex={1}>
                      {formData.step1.serviceType === 'premium' && (
                        <Box position="absolute" top={-2} right={-2} zIndex={10}>
                          <Circle size="40px" bg="green.500" color="white" boxShadow="0 4px 20px rgba(16, 185, 129, 0.6)">
                            <Icon as={FaCheckCircle} fontSize="20px" />
                          </Circle>
                        </Box>
                      )}
                      <VStack spacing={2} align="center">
                        <Badge 
                          bg="linear-gradient(135deg, rgba(168, 85, 247, 0.4) 0%, rgba(147, 51, 234, 0.3) 100%)"
                          color="white" 
                          borderRadius="full" 
                          fontSize="xs" 
                          px={4} 
                          py={2}
                          fontWeight="700"
                          letterSpacing="0.3px"
                          boxShadow="0 4px 12px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                          border="2px solid"
                          borderColor="rgba(168, 85, 247, 0.5)"
                        >
                          STANDARD
                        </Badge>
                        <Heading size="md" fontWeight="700" color="white" letterSpacing="0.3px" textAlign="center">
                          Direct Van Service
                        </Heading>
                      </VStack>
                      
                      <VStack spacing={1} align="center">
                        <Text fontSize="4xl" fontWeight="bold" color="purple.400" letterSpacing="0.3px" textAlign="center">
                          £{calculateStandardPrice().toFixed(2)}
                        </Text>
                        <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)" fontWeight="600" letterSpacing="0.2px" textAlign="center">
                          Most popular
                        </Text>
                      </VStack>

                      <Divider borderColor="rgba(255, 255, 255, 0.1)" />

                      <VStack align="start" spacing={3}>
                        <HStack spacing={2} align="center">
                          <Box w="6px" h="6px" borderRadius="full" bg="purple.400" boxShadow="0 0 8px rgba(168, 85, 247, 0.6)" />
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500" letterSpacing="0.2px">
                            Dedicated van for your move
                          </Text>
                        </HStack>
                        <HStack spacing={2} align="center">
                          <Box w="6px" h="6px" borderRadius="full" bg="blue.400" boxShadow="0 0 8px rgba(59, 130, 246, 0.6)" />
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500" letterSpacing="0.2px">
                            Flexible scheduling
                          </Text>
                        </HStack>
                        <HStack spacing={2} align="center">
                          <Box w="6px" h="6px" borderRadius="full" bg="green.400" boxShadow="0 0 8px rgba(16, 185, 129, 0.6)" />
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500" letterSpacing="0.2px">
                            Full capacity available
                          </Text>
                        </HStack>
                      </VStack>
                    </VStack>
                  </Card>

                  {/* Priority/Express (Fastest) */}
                  <Card
                    bg={formData.step1.serviceType === 'white-glove' 
                      ? "linear-gradient(135deg, rgba(251, 146, 60, 0.4) 0%, rgba(234, 88, 12, 0.3) 100%)" 
                      : "linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(26, 32, 44, 0.7) 100%)"}
                    backdropFilter="blur(10px)"
                    borderRadius="xl"
                    border={formData.step1.serviceType === 'white-glove' ? "3px solid" : "2px solid"}
                    borderColor={formData.step1.serviceType === 'white-glove' ? "rgba(251, 146, 60, 1)" : "rgba(251, 146, 60, 0.3)"}
                    p={6}
                    shadow={formData.step1.serviceType === 'white-glove' 
                      ? "0 12px 48px rgba(251, 146, 60, 0.6), 0 0 80px rgba(251, 146, 60, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 0 4px rgba(251, 146, 60, 0.2)" 
                      : "0 4px 16px rgba(251, 146, 60, 0.2)"}
                    cursor={isUpdatingService ? "not-allowed" : "pointer"}
                    onClick={() => handleServiceTypeChange('white-glove')}
                    transform={formData.step1.serviceType === 'white-glove' ? 'scale(1.02)' : 'scale(1)'}
                    _hover={isUpdatingService ? {} : { 
                      transform: formData.step1.serviceType === 'white-glove' ? 'scale(1.03) translateY(-4px)' : 'translateY(-4px)', 
                      shadow: formData.step1.serviceType === 'white-glove' 
                        ? '0 16px 56px rgba(251, 146, 60, 0.7), 0 0 100px rgba(251, 146, 60, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 0 0 5px rgba(251, 146, 60, 0.3)'
                        : '0 12px 40px rgba(251, 146, 60, 0.5), 0 0 80px rgba(251, 146, 60, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
                      borderColor: formData.step1.serviceType === 'white-glove' ? 'rgba(251, 146, 60, 1)' : 'rgba(251, 146, 60, 0.7)'
                    }}
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    opacity={isUpdatingService ? 0.7 : 1}
                    position="relative"
                    overflow="visible"
                    sx={{
                      '&::before': formData.step1.serviceType === 'white-glove' ? {
                        content: '""',
                        position: 'absolute',
                        top: '-4px',
                        left: '-4px',
                        right: '-4px',
                        bottom: '-4px',
                        background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.3) 0%, rgba(234, 88, 12, 0.2) 100%)',
                        borderRadius: 'xl',
                        opacity: 0.8,
                        zIndex: -1,
                        pointerEvents: 'none',
                        animation: 'pulse 2s ease-in-out infinite',
                      } : {},
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 0.8 },
                        '50%': { opacity: 0.4 },
                      },
                    }}
                  >
                    <VStack spacing={4} align="stretch" position="relative" zIndex={1}>
                      {formData.step1.serviceType === 'white-glove' && (
                        <Box position="absolute" top={-2} right={-2} zIndex={10}>
                          <Circle size="40px" bg="green.500" color="white" boxShadow="0 4px 20px rgba(16, 185, 129, 0.6)">
                            <Icon as={FaCheckCircle} fontSize="20px" />
                          </Circle>
                        </Box>
                      )}
                      <VStack spacing={2} align="center">
                        <Badge 
                          bg="linear-gradient(135deg, rgba(251, 146, 60, 0.4) 0%, rgba(234, 88, 12, 0.3) 100%)"
                          color="white" 
                          borderRadius="full" 
                          fontSize="xs" 
                          px={4} 
                          py={2}
                          fontWeight="700"
                          letterSpacing="0.3px"
                          boxShadow="0 4px 12px rgba(251, 146, 60, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                          border="2px solid"
                          borderColor="rgba(251, 146, 60, 0.5)"
                        >
                          PRIORITY
                        </Badge>
                        <Heading size="md" fontWeight="700" color="white" letterSpacing="0.3px" textAlign="center">
                          White Glove Service
                        </Heading>
                      </VStack>
                      
                      <VStack spacing={1} align="center">
                        <Text fontSize="4xl" fontWeight="bold" color="orange.400" letterSpacing="0.3px" textAlign="center">
                          £{calculatePriorityPrice().toFixed(2)}
                        </Text>
                        <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)" fontWeight="600" letterSpacing="0.2px" textAlign="center">
                          Premium service
                        </Text>
                      </VStack>

                      <Divider borderColor="rgba(255, 255, 255, 0.1)" />

                      <VStack align="start" spacing={3}>
                        <HStack spacing={2} align="center">
                          <Box w="6px" h="6px" borderRadius="full" bg="orange.400" boxShadow="0 0 8px rgba(251, 146, 60, 0.6)" />
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500" letterSpacing="0.2px">
                            Premium white-glove service
                          </Text>
                        </HStack>
                        <HStack spacing={2} align="center">
                          <Box w="6px" h="6px" borderRadius="full" bg="red.400" boxShadow="0 0 8px rgba(239, 68, 68, 0.6)" />
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500" letterSpacing="0.2px">
                            Same-day or next-day delivery
                          </Text>
                        </HStack>
                        <HStack spacing={2} align="center">
                          <Box w="6px" h="6px" borderRadius="full" bg="yellow.400" boxShadow="0 0 8px rgba(234, 179, 8, 0.6)" />
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500" letterSpacing="0.2px">
                            Full-service luxury moving
                          </Text>
                        </HStack>
                      </VStack>
                    </VStack>
                  </Card>

                  {/* Current Selection Summary - Enhanced */}
                  <Card 
                    bg="linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)"
                    backdropFilter="blur(10px)"
                    borderRadius="xl" 
                    border="2px solid" 
                    borderColor="rgba(16, 185, 129, 0.6)" 
                    p={6} 
                    shadow="0 8px 32px rgba(16, 185, 129, 0.4), 0 0 60px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    position="relative"
                    overflow="hidden"
                    _before={{
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                      opacity: 0.5,
                      zIndex: 0,
                      pointerEvents: 'none',
                    }}
                  >
                    <VStack spacing={4} align="stretch" position="relative" zIndex={1}>
                      <VStack spacing={2} align="center">
                        <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)" fontWeight="600" letterSpacing="0.3px" textTransform="uppercase" textAlign="center">
                          Selected Service
                        </Text>
                        <Heading size="md" fontWeight="700" color="white" letterSpacing="0.3px" textAlign="center">
                          {getServiceLevelDisplayName()}
                        </Heading>
                      </VStack>
                      
                      <VStack spacing={1} align="center">
                        <Text fontSize="4xl" fontWeight="bold" color="green.400" letterSpacing="0.3px" textAlign="center">
                          £{getCurrentPrice().toFixed(2)}
                        </Text>
                        <Text fontSize="xs" color="rgba(255, 255, 255, 0.6)" fontWeight="600" letterSpacing="0.2px" textAlign="center">
                          Total Price
                        </Text>
                      </VStack>

                      <Divider borderColor="rgba(255, 255, 255, 0.1)" />

                      <VStack align="start" spacing={3}>
                        <HStack spacing={2} align="center">
                          <Box w="6px" h="6px" borderRadius="full" bg="green.400" boxShadow="0 0 8px rgba(16, 185, 129, 0.6)" />
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500" letterSpacing="0.2px">
                            {getServiceLevelDescription()}
                          </Text>
                        </HStack>
                        <HStack spacing={2} align="center">
                          <Box w="6px" h="6px" borderRadius="full" bg="blue.400" boxShadow="0 0 8px rgba(59, 130, 246, 0.6)" />
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="500" letterSpacing="0.2px">
                            {getServiceLevelFeatures()}
                          </Text>
                        </HStack>
                      </VStack>

                      <Divider borderColor="rgba(255, 255, 255, 0.1)" />

                      <Box textAlign="center" pt={2}>
                        <HStack spacing={3} justify="center" align="center">
                          <HStack spacing={1} align="center">
                            <Icon as={FaShieldAlt} fontSize="14px" color="green.400" />
                            <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="600" letterSpacing="0.2px">
                              Fully insured up to £50,000
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color="rgba(255, 255, 255, 0.4)">•</Text>
                          <HStack spacing={1} align="center">
                            <Icon as={FaCheckCircle} fontSize="14px" color="green.400" />
                            <Text fontSize="sm" color="rgba(255, 255, 255, 0.8)" fontWeight="600" letterSpacing="0.2px">
                              5-star rated service
                            </Text>
                          </HStack>
                        </HStack>
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
                <Card bg="gray.800" borderRadius="xl" border="2px" borderColor="rgba(251, 146, 60, 0.6)" p={4} shadow="0 0 20px rgba(251, 146, 60, 0.3)" mt={6}>
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
        </VStack>
      </Card>

      {/* 3. Booking Summary - Enhanced */}
      <Card 
        bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
        backdropFilter="blur(20px) saturate(180%)"
        shadow="0 8px 32px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.3), 0 0 100px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
        borderWidth="2px" 
        borderColor="rgba(59, 130, 246, 0.5)"
        p={{ base: 4, sm: 5, md: 8 }}
        _hover={{ 
          shadow: "0 12px 40px rgba(59, 130, 246, 0.5), 0 0 80px rgba(59, 130, 246, 0.4), 0 0 120px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
          borderColor: "rgba(59, 130, 246, 0.7)",
          transform: "translateY(-2px)"
        }}
        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
        borderRadius="2xl"
        position="relative"
        overflow="hidden"
        sx={{
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 50%, rgba(168, 85, 247, 0.05) 100%)',
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
            animation: 'shine 10s infinite',
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
        <VStack spacing={{ base: 4, sm: 5, md: 6 }} align="stretch" w="full">
          {/* Enhanced Header */}
          <VStack spacing={{ base: 2, sm: 2.5, md: 3 }} position="relative" w="full">
            <Box
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              w={{ base: "120px", sm: "150px", md: "180px" }}
              h={{ base: "120px", sm: "150px", md: "180px" }}
              borderRadius="full"
              bg="radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.1) 50%, rgba(168, 85, 247, 0.1) 100%)"
              filter="blur(35px)"
              zIndex={0}
            />
            <HStack spacing={{ base: 2.5, sm: 3 }} align="center" position="relative" zIndex={1} w="full">
              <Box
                position="relative"
                w={{ base: "44px", sm: "48px", md: "56px" }}
                h={{ base: "44px", sm: "48px", md: "56px" }}
                minW={{ base: "44px", sm: "48px", md: "56px" }}
                minH={{ base: "44px", sm: "48px", md: "56px" }}
                flexShrink={0}
                borderRadius={{ base: "lg", md: "xl" }}
                bg="linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.3) 100%)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="0 4px 20px rgba(59, 130, 246, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                border="2px solid"
                borderColor="rgba(59, 130, 246, 0.5)"
                transition="all 0.3s"
                _hover={{
                  transform: "scale(1.1) rotate(5deg)",
                  boxShadow: "0 6px 30px rgba(59, 130, 246, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                }}
              >
                <Icon as={FaBolt} fontSize={{ base: "18px", sm: "20px", md: "24px" }} color="white" filter="drop-shadow(0 2px 4px rgba(59, 130, 246, 0.5))" />
              </Box>
              <VStack spacing={{ base: 1, sm: 1.5 }} align="start" flex={1} minW={0}>
                <Heading 
                  size={{ base: "sm", sm: "md", md: "xl" }} 
                  fontWeight="700"
                  letterSpacing="0.5px"
                  bg="linear-gradient(135deg, #3B82F6 0%, #10B981 50%, #A78BFA 100%)"
                  bgClip="text"
                  sx={{
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 4px 20px rgba(59, 130, 246, 0.3)",
                  }}
                  lineHeight="1.2"
                  noOfLines={2}
                >
                📋 Booking Summary
              </Heading>
                <Text 
                  fontSize={{ base: "xs", sm: "sm", md: "md" }} 
                  color="rgba(255, 255, 255, 0.7)"
                  fontWeight="500"
                  letterSpacing="0.3px"
                  lineHeight="1.3"
                  noOfLines={2}
                >
                Review your order details before payment
              </Text>
              </VStack>
          </HStack>
          </VStack>

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
              <Card 
                bg="linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)"
                backdropFilter="blur(10px)"
                borderRadius="xl" 
                border="2px solid" 
                borderColor="rgba(59, 130, 246, 0.6)" 
                p={6} 
                shadow="0 8px 32px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                  opacity: 0.5,
                  zIndex: 0,
                  pointerEvents: 'none',
                }}
              >
                <VStack spacing={{ base: 4, sm: 4.5, md: 5 }} align="stretch" position="relative" zIndex={1} w="full">
                  <VStack spacing={2} align="center">
                    <Heading 
                      size="md" 
                      color="white"
                      fontWeight="700"
                      letterSpacing="0.3px"
                      textAlign="center"
                    >
                      Booking Details
                    </Heading>
                    <Badge 
                      bg={
                        formData.step1.serviceType === 'standard' 
                          ? "linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(37, 99, 235, 0.3) 100%)"
                          : formData.step1.serviceType === 'premium'
                          ? "linear-gradient(135deg, rgba(168, 85, 247, 0.4) 0%, rgba(147, 51, 234, 0.3) 100%)"
                          : "linear-gradient(135deg, rgba(251, 146, 60, 0.4) 0%, rgba(234, 88, 12, 0.3) 100%)"
                      }
                      color="white" 
                      fontSize="sm" 
                      px={4} 
                      py={2}
                      borderRadius="full"
                      fontWeight="700"
                      letterSpacing="0.3px"
                      boxShadow="0 4px 12px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                      border="2px solid"
                      borderColor={
                        formData.step1.serviceType === 'standard'
                          ? "rgba(59, 130, 246, 0.5)"
                          : formData.step1.serviceType === 'premium'
                          ? "rgba(168, 85, 247, 0.5)"
                          : "rgba(251, 146, 60, 0.5)"
                      }
                      textTransform="capitalize"
                      mx="auto"
                    >
                      {formData.step1.serviceType === 'white-glove' ? 'White Glove' : formData.step1.serviceType === 'premium' ? 'Standard' : formData.step1.serviceType === 'standard' ? 'Economy' : formData.step1.serviceType} Service
                    </Badge>
                  </VStack>
                  
                  <Divider borderColor="rgba(255, 255, 255, 0.1)" />
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 3, sm: 4, md: 5 }}>
                    <VStack spacing={{ base: 3, sm: 4 }} align="start">
                      <Box
                        p={{ base: 3, sm: 4 }}
                        bg="rgba(255, 255, 255, 0.05)"
                        borderRadius={{ base: "lg", md: "xl" }}
                        border="2px solid"
                        borderColor="rgba(59, 130, 246, 0.3)"
                        w="full"
                        transition="all 0.2s"
                        _hover={{
                          bg: "rgba(255, 255, 255, 0.08)",
                          borderColor: "rgba(59, 130, 246, 0.5)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.2)",
                        }}
                      >
                        <HStack spacing={{ base: 1.5, sm: 2 }} align="center" mb={{ base: 1.5, sm: 2 }}>
                          <Box w={{ base: "5px", sm: "6px" }} h={{ base: "5px", sm: "6px" }} borderRadius="full" bg="blue.400" boxShadow="0 0 8px rgba(59, 130, 246, 0.6)" />
                          <Text fontSize={{ base: "xs", sm: "sm" }} color="rgba(255, 255, 255, 0.6)" fontWeight="700" letterSpacing="0.3px" textTransform="uppercase">
                            Pickup Address
                          </Text>
                        </HStack>
                        <Text fontSize={{ base: "sm", sm: "md" }} fontWeight="600" color="white" letterSpacing="0.2px" lineHeight={{ base: "1.5", sm: "1.6" }}>
                          {formData.step1.pickupAddress?.address || formData.step1.pickupAddress?.formatted_address || formData.step1.pickupAddress?.full || formData.step1.pickupAddress?.line1 || 'Not specified'}
                        </Text>
                      </Box>
                      <Box
                        p={{ base: 3, sm: 4 }}
                        bg="rgba(255, 255, 255, 0.05)"
                        borderRadius={{ base: "lg", md: "xl" }}
                        border="2px solid"
                        borderColor="rgba(16, 185, 129, 0.3)"
                        w="full"
                        transition="all 0.2s"
                        _hover={{
                          bg: "rgba(255, 255, 255, 0.08)",
                          borderColor: "rgba(16, 185, 129, 0.5)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
                        }}
                      >
                        <HStack spacing={{ base: 1.5, sm: 2 }} align="center" mb={{ base: 1.5, sm: 2 }}>
                          <Box w={{ base: "5px", sm: "6px" }} h={{ base: "5px", sm: "6px" }} borderRadius="full" bg="green.400" boxShadow="0 0 8px rgba(16, 185, 129, 0.6)" />
                          <Text fontSize={{ base: "xs", sm: "sm" }} color="rgba(255, 255, 255, 0.6)" fontWeight="700" letterSpacing="0.3px" textTransform="uppercase">
                            Delivery Address
                          </Text>
                        </HStack>
                        <Text fontSize={{ base: "sm", sm: "md" }} fontWeight="600" color="white" letterSpacing="0.2px" lineHeight={{ base: "1.5", sm: "1.6" }}>
                          {formData.step1.dropoffAddress?.address || formData.step1.dropoffAddress?.formatted_address || formData.step1.dropoffAddress?.full || formData.step1.dropoffAddress?.line1 || 'Not specified'}
                        </Text>
                      </Box>
                    </VStack>
                    
                    <VStack spacing={{ base: 3, sm: 4 }} align="start">
                      <Box
                        p={{ base: 3, sm: 4 }}
                        bg="rgba(255, 255, 255, 0.05)"
                        borderRadius={{ base: "lg", md: "xl" }}
                        border="2px solid"
                        borderColor="rgba(168, 85, 247, 0.3)"
                        w="full"
                        transition="all 0.2s"
                        _hover={{
                          bg: "rgba(255, 255, 255, 0.08)",
                          borderColor: "rgba(168, 85, 247, 0.5)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(168, 85, 247, 0.2)",
                        }}
                      >
                        <HStack spacing={{ base: 1.5, sm: 2 }} align="center" mb={{ base: 1.5, sm: 2 }}>
                          <Box w={{ base: "5px", sm: "6px" }} h={{ base: "5px", sm: "6px" }} borderRadius="full" bg="purple.400" boxShadow="0 0 8px rgba(168, 85, 247, 0.6)" />
                          <Text fontSize={{ base: "xs", sm: "sm" }} color="rgba(255, 255, 255, 0.6)" fontWeight="700" letterSpacing="0.3px" textTransform="uppercase">
                            Date & Time
                          </Text>
                        </HStack>
                        <Text fontSize={{ base: "sm", sm: "md" }} fontWeight="600" color="white" letterSpacing="0.2px" lineHeight={{ base: "1.5", sm: "1.6" }}>
                          {formData.step1.pickupDate} - {formData.step1.pickupTimeSlot}
                        </Text>
                      </Box>
                      <Box
                        p={{ base: 3, sm: 4 }}
                        bg="rgba(255, 255, 255, 0.05)"
                        borderRadius={{ base: "lg", md: "xl" }}
                        border="2px solid"
                        borderColor="rgba(251, 146, 60, 0.3)"
                        w="full"
                        transition="all 0.2s"
                        _hover={{
                          bg: "rgba(255, 255, 255, 0.08)",
                          borderColor: "rgba(251, 146, 60, 0.5)",
                          transform: "translateY(-2px)",
                          boxShadow: "0 4px 12px rgba(251, 146, 60, 0.2)",
                        }}
                      >
                        <HStack spacing={{ base: 1.5, sm: 2 }} align="center" mb={{ base: 1.5, sm: 2 }}>
                          <Box w={{ base: "5px", sm: "6px" }} h={{ base: "5px", sm: "6px" }} borderRadius="full" bg="orange.400" boxShadow="0 0 8px rgba(251, 146, 60, 0.6)" />
                          <Text fontSize={{ base: "xs", sm: "sm" }} color="rgba(255, 255, 255, 0.6)" fontWeight="700" letterSpacing="0.3px" textTransform="uppercase">
                            Items & Distance
                          </Text>
                        </HStack>
                        <Text fontSize={{ base: "sm", sm: "md" }} fontWeight="600" color="white" letterSpacing="0.2px" lineHeight={{ base: "1.5", sm: "1.6" }}>
                          {formData.step1.items.length} items • {formData.step1.distance || formData.step1.pricing?.distance || 'N/A'} {formData.step1.distance ? 'km' : ''}
                        </Text>
                      </Box>
                    </VStack>
                  </SimpleGrid>
                </VStack>
              </Card>

              {/* Selected Items Details - Enhanced */}
              {formData.step1.items.length > 0 && (
                <Card 
                  bg="linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.1) 100%)"
                  backdropFilter="blur(10px)"
                  borderRadius={{ base: "lg", md: "xl" }} 
                  border="2px solid" 
                  borderColor="rgba(168, 85, 247, 0.6)" 
                  p={{ base: 4, sm: 5, md: 6 }} 
                  shadow="0 8px 32px rgba(168, 85, 247, 0.4), 0 0 60px rgba(168, 85, 247, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                  position="relative"
                  overflow="hidden"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
                    opacity: 0.5,
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                >
                  <VStack spacing={{ base: 4, sm: 5 }} align="stretch" position="relative" zIndex={1}>
                    <HStack spacing={{ base: 2, sm: 3 }} align="center" flexWrap={{ base: "wrap", sm: "nowrap" }}>
                      <Box
                        w={{ base: "6px", sm: "8px" }}
                        h={{ base: "6px", sm: "8px" }}
                        borderRadius="full"
                        bg="purple.400"
                        boxShadow="0 0 12px rgba(168, 85, 247, 0.8)"
                      />
                      <Heading 
                        size={{ base: "sm", sm: "md" }} 
                        color="white"
                        fontWeight="700"
                        letterSpacing="0.3px"
                        lineHeight="1.3"
                      >
                        Selected Items
                      </Heading>
                      <Badge
                        bg="linear-gradient(135deg, rgba(168, 85, 247, 0.4) 0%, rgba(147, 51, 234, 0.3) 100%)"
                        color="white"
                        fontSize={{ base: "xs", sm: "sm" }}
                        px={{ base: 2, sm: 3 }}
                        py={{ base: 1, sm: 1 }}
                        borderRadius="full"
                        fontWeight="700"
                        letterSpacing="0.3px"
                        boxShadow="0 4px 12px rgba(168, 85, 247, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                        border="2px solid"
                        borderColor="rgba(168, 85, 247, 0.5)"
                      >
                        {formData.step1.items.length} {formData.step1.items.length === 1 ? 'Item' : 'Items'}
                      </Badge>
                    </HStack>
                    
                    <Divider borderColor="rgba(255, 255, 255, 0.1)" />
                    
                    <VStack spacing={{ base: 2, sm: 3 }} align="stretch">
                      {formData.step1.items.map((item, index) => (
                        <Box
                          key={index}
                          p={{ base: 3, sm: 4 }}
                          bg="rgba(255, 255, 255, 0.05)"
                          borderRadius={{ base: "lg", md: "xl" }}
                          border="2px solid"
                          borderColor="rgba(168, 85, 247, 0.3)"
                          transition="all 0.2s"
                          _hover={{
                            bg: "rgba(255, 255, 255, 0.08)",
                            borderColor: "rgba(168, 85, 247, 0.5)",
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 12px rgba(168, 85, 247, 0.2)",
                          }}
                        >
                          <HStack justify="space-between" align="start" spacing={{ base: 3, sm: 4 }} flexWrap={{ base: "wrap", sm: "nowrap" }}>
                            <VStack align="start" spacing={{ base: 1.5, sm: 2 }} flex={1} minW={0}>
                              <HStack spacing={{ base: 1.5, sm: 2 }} align="center">
                                <Box w={{ base: "5px", sm: "6px" }} h={{ base: "5px", sm: "6px" }} borderRadius="full" bg="purple.400" boxShadow="0 0 8px rgba(168, 85, 247, 0.6)" flexShrink={0} />
                                <Text fontWeight="700" color="white" fontSize={{ base: "sm", sm: "md" }} letterSpacing="0.2px" lineHeight="1.3" noOfLines={2}>
                                  {item.name}
                                </Text>
                              </HStack>
                              {item.description && (
                                <Text fontSize={{ base: "xs", sm: "sm" }} color="rgba(255, 255, 255, 0.7)" fontWeight="500" letterSpacing="0.2px" lineHeight={{ base: "1.4", sm: "1.5" }} noOfLines={3}>
                                  {item.description}
                                </Text>
                              )}
                            </VStack>
                            <VStack align="end" spacing={1} flexShrink={0}>
                              <Badge
                                bg="linear-gradient(135deg, rgba(168, 85, 247, 0.3) 0%, rgba(147, 51, 234, 0.2) 100%)"
                                color="white"
                                fontSize={{ base: "xs", sm: "sm" }}
                                px={{ base: 2, sm: 3 }}
                                py={{ base: 1, sm: 1 }}
                                borderRadius="full"
                                fontWeight="700"
                                letterSpacing="0.3px"
                                border="2px solid"
                                borderColor="rgba(168, 85, 247, 0.4)"
                                whiteSpace="nowrap"
                              >
                                Qty: {item.quantity}
                              </Badge>
                            </VStack>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </VStack>
                </Card>
              )}
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

      {/* Action Buttons Row - Moved to bottom of page */}
      <HStack spacing={{ base: 3, sm: 4 }} w="full" justify="space-between" mt={{ base: 6, sm: 8 }} mb={{ base: 3, sm: 4 }} flexDirection={{ base: "column", sm: "row" }}>
        {/* Back to Step 1 Button */}
        <Button
          size={{ base: "md", sm: "lg" }}
          minH={{ base: "48px", sm: "44px" }}
          w={{ base: "full", sm: "auto" }}
          colorScheme="gray"
          variant="outline"
          onClick={() => window.history.back()}
          leftIcon={<Icon as={FaBolt} fontSize={{ base: "16px", sm: "18px" }} />}
          borderWidth="2px"
          fontSize={{ base: "sm", sm: "md" }}
          fontWeight="600"
          letterSpacing="0.3px"
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
                street: (formData.step1.pickupAddress as any)?.street || 
                       formData.step1.pickupAddress?.formatted?.street ||
                       formData.step1.pickupAddress?.line1 || 
                       formData.step1.pickupAddress?.address || 
                       (formData.step1.pickupAddress as any)?.formatted_address ||
                       formData.step1.pickupAddress?.full ||
                       '',
              },
              dropoffAddress: {
                ...formData.step1.dropoffAddress,
                // Ensure street field is populated from multiple sources
                street: (formData.step1.dropoffAddress as any)?.street || 
                       formData.step1.dropoffAddress?.formatted?.street ||
                       formData.step1.dropoffAddress?.line1 || 
                       formData.step1.dropoffAddress?.address || 
                       (formData.step1.dropoffAddress as any)?.formatted_address ||
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
  );
}
