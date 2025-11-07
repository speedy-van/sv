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
} from '@chakra-ui/react';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaCreditCard,
  FaCheckCircle,
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
  const toast = useToast();
  
  // CRITICAL: Get base price from formData.step1.pricing.total (actual calculated price)
  const basePrice = formData.step1.pricing?.total || standardPrice || 0;
  
  // Calculate service-specific prices dynamically based on base price
  const calculatedEconomyPrice = basePrice > 0 ? Math.round(basePrice * 0.85 * 100) / 100 : (economyPrice || 0);
  const calculatedStandardPrice = basePrice > 0 ? basePrice : (standardPrice || 0);
  const calculatedExpressPrice = basePrice > 0 ? Math.round(basePrice * 1.5 * 100) / 100 : (priorityPrice || 0);
  
  // Get current price based on selected service
  const actualPrice = selectedService === 'economy' 
    ? calculatedEconomyPrice 
    : selectedService === 'express' 
    ? calculatedExpressPrice 
    : calculatedStandardPrice;
  
  console.log('💰 WhoAndPaymentStep Pricing:', {
    basePrice,
    economy: calculatedEconomyPrice,
    standard: calculatedStandardPrice,
    express: calculatedExpressPrice,
    selectedService,
    actualPrice
  });

  const updateCustomerDetails = useCallback((field: keyof CustomerDetails, value: string) => {
    updateFormData('step2', {
      customerDetails: {
        ...formData.step2.customerDetails,
        [field]: value
      }
    });
  }, [formData.step2.customerDetails, updateFormData]);
  
  // Handle service selection change - update pricing immediately
  const handleServiceChange = useCallback((serviceId: 'economy' | 'standard' | 'express') => {
    setSelectedService(serviceId);
    
    // Calculate new price based on selected service
    const newTotal = serviceId === 'economy' 
      ? calculatedEconomyPrice 
      : serviceId === 'express' 
      ? calculatedExpressPrice 
      : calculatedStandardPrice;
    
    console.log(`🔄 Service changed to ${serviceId} - price: £${newTotal.toFixed(2)}`);
    
    // Update pricing only if it changed (prevent infinite loop)
    if (formData.step1.pricing && Math.abs(newTotal - formData.step1.pricing.total) > 0.01) {
      updateFormData('step1', {
        pricing: {
          ...formData.step1.pricing,
          total: newTotal
        }
      });
    }
  }, [calculatedEconomyPrice, calculatedStandardPrice, calculatedExpressPrice, formData.step1.pricing, updateFormData]);

  // CRITICAL: Use calculated prices (not static props)
  const services = [
    {
      id: 'economy' as const,
      name: 'Economy',
      price: calculatedEconomyPrice,
      description: 'Shared route, 7 days delivery',
      icon: '🚐',
      discount: '15% off',
    },
    {
      id: 'standard' as const,
      name: 'Standard',
      price: calculatedStandardPrice,
      description: 'Direct service, flexible scheduling',
      icon: '🚚',
      popular: true,
    },
    {
      id: 'express' as const,
      name: 'Express',
      price: calculatedExpressPrice,
      description: 'Same-day or next-day delivery',
      icon: '⚡',
      premium: '50% premium',
    },
  ];

  return (
    <Box w="full">
      <VStack spacing={6} align="stretch">
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

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                {services.map((service) => (
                  <Box
                    key={service.id}
                    p={5}
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
                  >
                    {service.popular && (
                      <Badge
                        position="absolute"
                        top={-2}
                        right={-2}
                        bg="blue.500"
                        color="white"
                        fontSize="2xs"
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        Popular
                      </Badge>
                    )}
                    {service.discount && (
                      <Badge
                        position="absolute"
                        top={-2}
                        left={-2}
                        bg="green.500"
                        color="white"
                        fontSize="2xs"
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        {service.discount}
                      </Badge>
                    )}
                    {service.premium && (
                      <Badge
                        position="absolute"
                        top={-2}
                        left={-2}
                        bg="orange.500"
                        color="white"
                        fontSize="2xs"
                        px={2}
                        py={1}
                        borderRadius="full"
                      >
                        {service.premium}
                      </Badge>
                    )}
                    <VStack spacing={3} align="start">
                      <Text fontSize="2xl">{service.icon}</Text>
                      <Box>
                        <Text fontSize="md" fontWeight="bold" color="white">
                          {service.name}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {service.description}
                        </Text>
                      </Box>
                      <Text fontSize="2xl" fontWeight="bold" color="white">
                        £{service.price.toFixed(2)}
                      </Text>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
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
                  colorScheme="blue"
                  color="gray.300"
                  fontSize="sm"
                >
                  I accept the{' '}
                  <Text as="span" color="blue.400" textDecoration="underline" cursor="pointer">
                    Terms and Conditions
                  </Text>
                </Checkbox>

                <Checkbox
                  colorScheme="blue"
                  color="gray.300"
                  fontSize="sm"
                >
                  I have read the{' '}
                  <Text as="span" color="blue.400" textDecoration="underline" cursor="pointer">
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

