'use client';

/**
 * Step 3: Customer Details & Payment - Simplified Version
 * Clean, modern design like Uber/Airbnb
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
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
  IconButton,
  Image,
} from '@chakra-ui/react';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaCreditCard,
  FaCheckCircle,
  FaPlus,
  FaMinus,
  FaTrash,
} from 'react-icons/fa';
import { FormData, CustomerDetails } from '../hooks/useBookingForm';
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

export default function WhoAndPaymentStepSimple({
  formData,
  updateFormData,
  errors,
  economyPrice = 0,
  standardPrice = 0,
  priorityPrice = 0,
}: WhoAndPaymentStepProps) {
  const [selectedService, setSelectedService] = useState<'economy' | 'standard' | 'express'>('standard');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const toast = useToast();
  
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

  let safeStandardPrice = sanitizePrice(standardPrice);
  if (safeStandardPrice === undefined) {
    const fallbackStandard = sanitizePrice(formData.step1.pricing?.total);
    if (fallbackStandard !== undefined) {
      safeStandardPrice = fallbackStandard;
    } else {
      safeStandardPrice = 0;
    }
  }

  let safeEconomyPrice = sanitizePrice(economyPrice);
  if (safeEconomyPrice === undefined) {
    if (safeStandardPrice > 0) {
      const computedEconomy = (safeStandardPrice * 0.85).toFixed(2);
      safeEconomyPrice = parseFloat(computedEconomy);
    } else {
      safeEconomyPrice = 0;
    }
  }

  let safeExpressPrice = sanitizePrice(priorityPrice);
  if (safeExpressPrice === undefined) {
    if (safeStandardPrice > 0) {
      const computedExpress = (safeStandardPrice * 1.5).toFixed(2);
      safeExpressPrice = parseFloat(computedExpress);
    } else {
      safeExpressPrice = 0;
    }
  }

  const actualPrice = selectedService === 'economy'
    ? safeEconomyPrice
    : selectedService === 'express'
    ? safeExpressPrice
    : safeStandardPrice;

  console.log('💰 Step 3 Pricing Sanity Check:', {
    economyFromProps: economyPrice,
    standardFromProps: standardPrice,
    expressFromProps: priorityPrice,
    safeEconomyPrice,
    safeStandardPrice,
    safeExpressPrice,
    selectedService,
    actualPrice
  });

  const selectedItems = formData.step1.items || [];

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

      updateFormData('step1', {
        items: sanitizedItems.map((item) => ({ ...item })),
      });
      
      // Restore scroll position after update (mobile only)
      if (isMobile && scrollY !== undefined) {
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY);
        });
      }
    },
    [updateFormData]
  );

  const incrementItem = useCallback(
    (itemId: string) => {
      const currentItems = formData.step1.items || [];
      const nextItems = currentItems.map((item) =>
        item.id === itemId
          ? { ...item, quantity: Math.min((item.quantity || 0) + 1, 99) }
          : item
      );
      applyItemUpdates(nextItems);
    },
    [formData.step1.items, applyItemUpdates]
  );

  const decrementItem = useCallback(
    (itemId: string) => {
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
    },
    [formData.step1.items, applyItemUpdates]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      const currentItems = formData.step1.items || [];
      const nextItems = currentItems.filter((item) => item.id !== itemId);
      applyItemUpdates(nextItems);
    },
    [formData.step1.items, applyItemUpdates]
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
      : safeStandardPrice;
    
    console.log(`🔄 Service changed to ${serviceId} - price: £${newTotal.toFixed(2)} (from Step 2)`);
    
    // Restore scroll position after update (mobile only)
    if (isMobile && scrollY !== undefined) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
  }, [safeEconomyPrice, safeStandardPrice, safeExpressPrice]);

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
      price: safeStandardPrice,
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
        {selectedItems.length > 0 && (
          <Card
            bg="rgba(26, 26, 26, 0.6)"
            border="1px solid"
            borderColor="rgba(59, 130, 246, 0.2)"
            borderRadius="2xl"
            backdropFilter="blur(10px)"
          >
            <CardBody p={{ base: 6, md: 8 }}>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="center" flexWrap="wrap" gap={2}>
                  <Text fontSize="lg" fontWeight="600" color="white">
                    Your Selected Items
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    Adjust quantities instantly – pricing updates automatically.
                  </Text>
                </HStack>

                <VStack spacing={3} align="stretch">
                  {selectedItems.map((item) => (
                    <HStack
                      key={item.id}
                      spacing={4}
                      align="center"
                      bg="rgba(15, 23, 42, 0.65)"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="rgba(59, 130, 246, 0.2)"
                      px={{ base: 3, md: 4 }}
                      py={{ base: 3, md: 4 }}
                      flexWrap="wrap"
                    >
                      <HStack spacing={3} align="center" flex={1} minW="0">
                        {item.image && (
                          <Image
                            src={item.image}
                            alt={item.name}
                            boxSize={{ base: '44px', md: '56px' }}
                            borderRadius="md"
                            objectFit="cover"
                            bg="rgba(15, 23, 42, 0.8)"
                            flexShrink={0}
                          />
                        )}
                        <Box minW="0">
                          <Text
                            fontSize={{ base: 'sm', md: 'md' }}
                            fontWeight="600"
                            color="white"
                            noOfLines={2}
                          >
                            {item.name}
                          </Text>
                          {item.description && (
                            <Text fontSize="xs" color="gray.400" noOfLines={2}>
                              {item.description}
                            </Text>
                          )}
                        </Box>
                      </HStack>

                      <HStack spacing={2} align="center">
                        <IconButton
                          aria-label={`Decrease ${item.name}`}
                          icon={<FaMinus />}
                          size="sm"
                          variant="ghost"
                          color="gray.300"
                          onClick={() => decrementItem(item.id)}
                          isDisabled={item.quantity <= 1}
                          _hover={{ color: 'white', bg: 'rgba(59, 130, 246, 0.2)' }}
                        />
                        <Text
                          fontSize="md"
                          fontWeight="bold"
                          color="white"
                          minW="32px"
                          textAlign="center"
                        >
                          {item.quantity || 1}
                        </Text>
                        <IconButton
                          aria-label={`Increase ${item.name}`}
                          icon={<FaPlus />}
                          size="sm"
                          variant="ghost"
                          color="gray.300"
                          onClick={() => incrementItem(item.id)}
                          _hover={{ color: 'white', bg: 'rgba(59, 130, 246, 0.2)' }}
                        />
                      </HStack>

                      <IconButton
                        aria-label={`Remove ${item.name}`}
                        icon={<FaTrash />}
                        size="sm"
                        variant="ghost"
                        color="red.300"
                        onClick={() => removeItem(item.id)}
                        _hover={{ color: 'red.100', bg: 'rgba(248, 113, 113, 0.15)' }}
                      />
                    </HStack>
                  ))}
                </VStack>

                <Text fontSize="xs" color="gray.500">
                  Need to add new items? Tap the step indicator above to revisit “Items & Time”.
                </Text>
              </VStack>
            </CardBody>
          </Card>
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
                display="grid"
                gridTemplateColumns="repeat(3, 1fr)"
                gap={{ base: 2, sm: 3, md: 4 }}
                w="full"
              >
                {services.map((service) => (
                  <Box
                    key={service.id}
                    p={{ base: 3, sm: 4, md: 5 }}
                    borderRadius="xl"
                    border="2px solid"
                    borderColor={selectedService === service.id ? 'blue.500' : 'rgba(59, 130, 246, 0.2)'}
                    bg={selectedService === service.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent'}
                    cursor="pointer"
                    onClick={() => handleServiceChange(service.id)}
                    transition="all 0.2s"
                    _hover={{
                      borderColor: 'blue.500',
                      bg: 'rgba(59, 130, 246, 0.05)',
                    }}
                    position="relative"
                    minH={{ base: "160px", sm: "180px", md: "auto" }}
                  >
                    {service.popular && (
                      <Badge
                        position="absolute"
                        top={{ base: -1, md: -2 }}
                        right={{ base: -1, md: -2 }}
                        bg="blue.500"
                        color="white"
                        fontSize="3xs"
                        px={{ base: 1.5, md: 2 }}
                        py={{ base: 0.5, md: 1 }}
                        borderRadius="full"
                      >
                        Popular
                      </Badge>
                    )}
                    {service.discount && (
                      <Badge
                        position="absolute"
                        top={{ base: -1, md: -2 }}
                        left={{ base: -1, md: -2 }}
                        bg="green.500"
                        color="white"
                        fontSize="3xs"
                        px={{ base: 1.5, md: 2 }}
                        py={{ base: 0.5, md: 1 }}
                        borderRadius="full"
                      >
                        {service.discount}
                      </Badge>
                    )}
                    {service.premium && (
                      <Badge
                        position="absolute"
                        top={{ base: -1, md: -2 }}
                        left={{ base: -1, md: -2 }}
                        bg="orange.500"
                        color="white"
                        fontSize="3xs"
                        px={{ base: 1.5, md: 2 }}
                        py={{ base: 0.5, md: 1 }}
                        borderRadius="full"
                      >
                        {service.premium}
                      </Badge>
                    )}
                    <VStack spacing={{ base: 2, md: 3 }} align="center" w="full">
                      <Text fontSize={{ base: "3xl", md: "2xl" }}>{service.icon}</Text>
                      <Box textAlign="center" w="full">
                        <Text 
                          fontSize={{ base: "sm", md: "md" }} 
                          fontWeight="bold" 
                          color="white"
                          noOfLines={1}
                        >
                          {service.name}
                        </Text>
                        <Text 
                          fontSize={{ base: "2xs", sm: "xs" }} 
                          color="gray.400"
                          noOfLines={2}
                          lineHeight="1.3"
                        >
                          {service.description}
                        </Text>
                      </Box>
                      <Text 
                        fontSize={{ base: "xl", md: "2xl" }} 
                        fontWeight="bold" 
                        color="white"
                      >
                        £{service.price.toFixed(2)}
                      </Text>
                    </VStack>
                  </Box>
                ))}
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
                  items: formData.step1.items,
                  pricing: formData.step1.pricing as any,
                  serviceType: selectedService,
                  scheduledDate: formData.step1.pickupDate || new Date().toISOString().split('T')[0],
                  scheduledTime: formData.step1.pickupTimeSlot,
                  pickupDetails: formData.step1.pickupProperty as any,
                  dropoffDetails: formData.step1.dropoffProperty as any,
                  notes: formData.step2.specialInstructions,
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

