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
} from '@chakra-ui/react';
import {
  FaCreditCard,
  FaBox,
  FaChevronUp,
  FaTimes,
} from 'react-icons/fa';
import { FormData, CustomerDetails } from '../hooks/useBookingForm';
import StripePaymentButton from './StripePaymentButton';
import { useIsIOSDevice } from '@/hooks/useIsIOSDevice';
import { SelectableCard } from '@/components/shared/SelectableCard';

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
        {/* Floating Green Button for Selected Items */}
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
                  ? "linear(135deg, #8b5cf6, #6366f1)" 
                  : "linear(135deg, #ec4899, #f43f5e)"}
                color="white"
                borderRadius="full"
                w={{ base: '110px', md: '130px' }}
                h={{ base: '110px', md: '130px' }}
                cursor="pointer"
                boxShadow={isSummaryExpanded 
                  ? "0 15px 40px rgba(139, 92, 246, 0.5), 0 0 25px rgba(139, 92, 246, 0.3)" 
                  : "0 15px 40px rgba(236, 72, 153, 0.5), 0 0 25px rgba(236, 72, 153, 0.3)"}
                transition="all 0.3s ease"
                border="4px solid white"
                position="relative"
                _hover={{
                  transform: 'scale(1.08)',
                  boxShadow: isSummaryExpanded 
                    ? '0 20px 50px rgba(139, 92, 246, 0.7), 0 0 35px rgba(139, 92, 246, 0.5)' 
                    : '0 20px 50px rgba(236, 72, 153, 0.7), 0 0 35px rgba(236, 72, 153, 0.5)',
                }}
                _active={{
                  transform: 'scale(0.98)',
                }}
              >
                {/* Icon */}
                <Icon 
                  as={isSummaryExpanded ? FaTimes : FaBox} 
                  boxSize={{ base: 8, md: 10 }} 
                  color="white"
                  mb={1}
                />
                
                {/* Count Badge */}
                <Flex
                  align="center"
                  justify="center"
                  bg="white"
                  borderRadius="full"
                  w={{ base: '42px', md: '50px' }}
                  h={{ base: '42px', md: '50px' }}
                  mb={1}
                  boxShadow="0 2px 8px rgba(0,0,0,0.15)"
                >
                  <Text 
                    fontSize={{ base: 'xl', md: '2xl' }} 
                    fontWeight="900" 
                    lineHeight="1"
                    color="black"
                  >
                    {selectionStats.totalItems}
                  </Text>
                </Flex>
                
                {/* Label */}
                <Text 
                  fontSize={{ base: '2xs', md: 'xs' }} 
                  fontWeight="bold" 
                  textTransform="uppercase"
                  color="white"
                  letterSpacing="wide"
                >
                  {isSummaryExpanded ? 'CLOSE' : 'VIEW'}
                </Text>
              </Flex>
            </Box>

            {/* Expanded Details Panel */}
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
                  bg="#050505" 
                  color="white" 
                  p={{ base: 4, md: 6 }}
                  maxH="70vh"
                  overflowY="auto"
                  boxShadow="0 -4px 20px rgba(0, 0, 0, 0.5)"
                >
                  <SimpleGrid columns={2} spacing={4} w="full">
                    {selectedItems.map((item, index) => (
                      <Box
                        key={`summary-${item.id}-${index}`}
                        p={3}
                        borderRadius="lg"
                        bg="rgba(255, 255, 255, 0.05)"
                        borderWidth="1px"
                        borderColor="rgba(255, 255, 255, 0.1)"
                        transition="all 0.2s"
                        _hover={{ 
                          bg: 'rgba(255, 255, 255, 0.08)',
                          borderColor: 'rgba(255, 255, 255, 0.2)'
                        }}
                      >
                        <VStack spacing={3} align="stretch">
                          <HStack justify="space-between" align="center">
                            <Badge colorScheme="green" fontSize="2xs" borderRadius="full">
                              {item.quantity}x
                            </Badge>
                          </HStack>

                          <Box
                            h="80px"
                            position="relative"
                            overflow="hidden"
                            border="none"
                            borderRadius="0"
                            bg="transparent"
                            boxShadow="none"
                          >
                            {item.image ? (
                              <NextImage
                                src={item.image}
                                alt={item.name}
                                fill
                                sizes="50vw"
                                style={{
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <Box
                                w="100%"
                                h="100%"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                bg="transparent"
                              >
                                <Icon as={FaBox} boxSize={6} color="gray.500" />
                              </Box>
                            )}
                          </Box>

                          <Box>
                            <Text fontSize="xs" fontWeight="bold" noOfLines={2} lineHeight="1.3" mb={1}>
                              {item.name}
                            </Text>
                            <Text fontSize="2xs" color="whiteAlpha.600">
                              {item.weight}kg each · {item.quantity * item.weight}kg total
                            </Text>
                          </Box>

                          <HStack spacing={3} justify="center" w="full">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                decrementItem(item.id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                fontSize: '28px',
                                fontWeight: 'normal',
                                cursor: 'pointer',
                                padding: '0',
                                margin: '0',
                                width: 'auto',
                                height: 'auto',
                                minWidth: '24px',
                                lineHeight: '1',
                                outline: 'none',
                                WebkitTapHighlightColor: 'transparent',
                                opacity: item.quantity <= 1 ? 0.5 : 1
                              }}
                              disabled={item.quantity <= 1}
                            >
                              −
                            </button>
                            <span
                              style={{
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: '600',
                                minWidth: '24px',
                                textAlign: 'center',
                                lineHeight: '1'
                              }}
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                incrementItem(item.id);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                fontSize: '24px',
                                fontWeight: 'normal',
                                cursor: 'pointer',
                                padding: '0',
                                margin: '0',
                                width: 'auto',
                                height: 'auto',
                                minWidth: '24px',
                                lineHeight: '1',
                                outline: 'none',
                                WebkitTapHighlightColor: 'transparent',
                                opacity: 1
                              }}
                            >
                              +
                            </button>
                          </HStack>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f87171',
                              fontSize: '12px',
                              cursor: 'pointer',
                              padding: '4px 0',
                              textAlign: 'center',
                              outline: 'none',
                              WebkitTapHighlightColor: 'transparent',
                            }}
                          >
                            Remove
                          </button>
                        </VStack>
                      </Box>
                    ))}
                  </SimpleGrid>
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

