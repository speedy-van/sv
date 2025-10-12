/**
 * Display-Only Pricing Component
 * 
 * This component shows static pricing information for marketing purposes only.
 * It does NOT calculate actual pricing - that's handled by UnifiedPricingFacade.
 * 
 * Features:
 * - Static "From £X" displays
 * - Service type pricing hints
 * - Marketing-friendly pricing information
 * - No actual pricing calculations
 */

import React from 'react';
import {
  Box,
  Text,
  Badge,
  VStack,
  HStack,
  Icon,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiInfo, FiTruck, FiClock, FiStar } from 'react-icons/fi';

interface DisplayPricingProps {
  serviceType?: 'standard' | 'express' | 'same-day';
  variant?: 'card' | 'inline' | 'banner';
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// Static display pricing (marketing purposes only)
const DISPLAY_PRICING = {
  standard: {
    from: 25,
    description: 'Standard delivery service',
    features: ['Professional crew', 'Basic insurance', 'Standard timeframe'],
    badge: 'Most Popular',
    badgeColor: 'blue',
  },
  express: {
    from: 35,
    description: 'Fast delivery service',
    features: ['Priority handling', 'Enhanced insurance', 'Express timeframe'],
    badge: 'Fast',
    badgeColor: 'orange',
  },
  'same-day': {
    from: 45,
    description: 'Same day delivery',
    features: ['Premium handling', 'Full insurance', 'Same-day delivery'],
    badge: 'Premium',
    badgeColor: 'purple',
  },
} as const;

/**
 * Display-only pricing component for marketing
 * 
 * IMPORTANT: This component is for display purposes only.
 * Actual pricing is calculated by UnifiedPricingFacade.
 */
export function DisplayOnlyPricing({ 
  serviceType = 'standard', 
  variant = 'card',
  showDetails = false,
  size = 'md',
}: DisplayPricingProps) {
  const pricingInfo = DISPLAY_PRICING[serviceType];
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const priceColor = useColorModeValue('gray.900', 'white');

  const sizeStyles = {
    sm: { fontSize: '2xl', spacing: 2, padding: 3 },
    md: { fontSize: '3xl', spacing: 3, padding: 4 },
    lg: { fontSize: '4xl', spacing: 4, padding: 6 },
  };

  const currentSize = sizeStyles[size];

  if (variant === 'inline') {
    return (
      <HStack spacing={2} align="center">
        <Text fontSize={currentSize.fontSize} fontWeight="bold" color={priceColor}>
          From £{pricingInfo.from}
        </Text>
        <Tooltip label="Final price calculated automatically based on your specific requirements">
          <Icon as={FiInfo} color={textColor} />
        </Tooltip>
      </HStack>
    );
  }

  if (variant === 'banner') {
    return (
      <Box
        bg={bgColor}
        border="1px"
        borderColor={borderColor}
        borderRadius="lg"
        p={currentSize.padding}
        textAlign="center"
        position="relative"
      >
        {pricingInfo.badge && (
          <Badge
            colorScheme={pricingInfo.badgeColor}
            position="absolute"
            top="-10px"
            left="50%"
            transform="translateX(-50%)"
            px={3}
            py={1}
            borderRadius="full"
          >
            {pricingInfo.badge}
          </Badge>
        )}
        
        <VStack spacing={currentSize.spacing}>
          <HStack align="center" spacing={2}>
            <Text fontSize={currentSize.fontSize} fontWeight="bold" color={priceColor}>
              From £{pricingInfo.from}
            </Text>
            <Tooltip label="Starting price - final price calculated automatically">
              <Icon as={FiInfo} color={textColor} />
            </Tooltip>
          </HStack>
          
          <Text fontSize="sm" color={textColor} maxW="200px">
            {pricingInfo.description}
          </Text>
        </VStack>
      </Box>
    );
  }

  // Card variant (default)
  return (
    <Box
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="xl"
      p={currentSize.padding}
      shadow="sm"
      _hover={{ shadow: 'md' }}
      transition="all 0.2s"
      position="relative"
    >
      {pricingInfo.badge && (
        <Badge
          colorScheme={pricingInfo.badgeColor}
          position="absolute"
          top="-8px"
          right="16px"
          px={2}
          py={1}
          borderRadius="md"
          fontSize="xs"
        >
          {pricingInfo.badge}
        </Badge>
      )}

      <VStack spacing={currentSize.spacing} align="start">
        {/* Service Type Header */}
        <HStack spacing={2}>
          <Icon 
            as={serviceType === 'standard' ? FiTruck : serviceType === 'express' ? FiClock : FiStar} 
            color={`${pricingInfo.badgeColor}.500`} 
          />
          <Text fontSize="lg" fontWeight="semibold" textTransform="capitalize">
            {serviceType.replace('-', ' ')} Service
          </Text>
        </HStack>

        {/* Price Display */}
        <HStack align="baseline" spacing={2}>
          <Text fontSize={currentSize.fontSize} fontWeight="bold" color={priceColor}>
            From £{pricingInfo.from}
          </Text>
          <Tooltip 
            label="This is a starting price for marketing purposes. Your actual price will be calculated automatically based on your specific requirements."
            placement="top"
          >
            <Icon as={FiInfo} color={textColor} cursor="help" />
          </Tooltip>
        </HStack>

        {/* Description */}
        <Text fontSize="sm" color={textColor}>
          {pricingInfo.description}
        </Text>

        {/* Features (if showDetails) */}
        {showDetails && (
          <VStack align="start" spacing={1}>
            <Text fontSize="xs" fontWeight="semibold" color={textColor} textTransform="uppercase">
              Includes:
            </Text>
            {pricingInfo.features.map((feature, index) => (
              <HStack key={index} spacing={2}>
                <Box w={1} h={1} bg={`${pricingInfo.badgeColor}.500`} borderRadius="full" />
                <Text fontSize="xs" color={textColor}>
                  {feature}
                </Text>
              </HStack>
            ))}
          </VStack>
        )}

        {/* Disclaimer */}
        <Text fontSize="xs" color={textColor} opacity={0.8} fontStyle="italic">
          * Final price calculated automatically
        </Text>
      </VStack>
    </Box>
  );
}

/**
 * Service comparison pricing display
 */
export function ServicePricingComparison() {
  const services: Array<'standard' | 'express' | 'same-day'> = ['standard', 'express', 'same-day'];
  
  return (
    <VStack spacing={4} w="full">
      <Text fontSize="xl" fontWeight="bold" textAlign="center">
        Service Options
      </Text>
      
      <HStack spacing={4} justify="center" wrap="wrap">
        {services.map((service) => (
          <DisplayOnlyPricing
            key={service}
            serviceType={service}
            variant="card"
            showDetails={true}
            size="md"
          />
        ))}
      </HStack>
      
      <Box
        bg="blue.50"
        border="1px"
        borderColor="blue.200"
        borderRadius="md"
        p={3}
        textAlign="center"
        maxW="600px"
      >
        <HStack justify="center" spacing={2} mb={2}>
          <Icon as={FiInfo} color="blue.600" />
          <Text fontSize="sm" fontWeight="semibold" color="blue.800">
            Automatic Pricing
          </Text>
        </HStack>
        <Text fontSize="xs" color="blue.700">
          Your exact price will be calculated automatically based on your items, addresses, and service requirements. 
          No manual calculation needed!
        </Text>
      </Box>
    </VStack>
  );
}

/**
 * Inline pricing display for forms
 */
export function InlinePricingDisplay({ serviceType }: { serviceType?: 'standard' | 'express' | 'same-day' }) {
  return (
    <DisplayOnlyPricing
      serviceType={serviceType}
      variant="inline"
      size="sm"
    />
  );
}

/**
 * Banner pricing for hero sections
 */
export function HeroPricingBanner({ serviceType }: { serviceType?: 'standard' | 'express' | 'same-day' }) {
  return (
    <DisplayOnlyPricing
      serviceType={serviceType}
      variant="banner"
      size="lg"
    />
  );
}
