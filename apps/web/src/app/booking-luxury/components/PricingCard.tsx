/**
 * Enhanced Pricing Card Component
 * 
 * Displays service tier pricing with expandable breakdown
 */

import React, { useState } from 'react';
import {
  Card,
  CardBody,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Collapse,
  Divider,
  Tooltip,
  Icon,
  Skeleton,
  Box,
} from '@chakra-ui/react';
import { FaChevronDown, FaChevronUp, FaInfoCircle, FaStar } from 'react-icons/fa';
import { PriceBreakdown, PriceBreakdownData } from './PriceBreakdown';

export type ServiceLevel = 'economy' | 'standard' | 'express';

export interface PricingTier {
  available?: boolean;
  price?: number;
  availability?: {
    route_type: string;
    next_available_date: string;
    explanation: string;
    fill_rate?: number;
  } | null;
}

export interface PricingCardProps {
  serviceLevel: ServiceLevel;
  tier: PricingTier | null | undefined;
  breakdown?: PriceBreakdownData;
  isLoading?: boolean;
  isMostPopular?: boolean;
  isBestValue?: boolean;
  savings?: number; // Amount saved compared to express
}

const SERVICE_CONFIG = {
  economy: {
    name: 'Economy',
    badgeLabel: 'Multi-Drop',
    badgeColor: 'green',
    bgColor: 'green.900',
    borderColor: 'green.500',
    priceColor: 'green.400',
    unavailableBg: 'gray.900',
    unavailableBorder: 'gray.600',
  },
  standard: {
    name: 'Standard',
    badgeLabel: 'Priority Slot',
    badgeColor: 'blue',
    bgColor: 'blue.900',
    borderColor: 'blue.500',
    priceColor: 'blue.400',
    unavailableBg: 'gray.900',
    unavailableBorder: 'gray.600',
  },
  express: {
    name: 'Express',
    badgeLabel: 'Dedicated Van',
    badgeColor: 'purple',
    bgColor: 'purple.900',
    borderColor: 'purple.500',
    priceColor: 'purple.400',
    unavailableBg: 'gray.900',
    unavailableBorder: 'gray.600',
  },
};

export function PricingCard({
  serviceLevel,
  tier,
  breakdown,
  isLoading = false,
  isMostPopular = false,
  isBestValue = false,
  savings,
}: PricingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = SERVICE_CONFIG[serviceLevel];
  const isAvailable = tier?.available !== false;

  if (isLoading) {
    return (
      <Card
        bg="gray.900"
        borderColor="gray.600"
        border="1px solid"
      >
        <CardBody p={4}>
          <VStack spacing={3} align="stretch">
            <Skeleton height="20px" />
            <Skeleton height="32px" />
            <Skeleton height="16px" />
            <Skeleton height="16px" />
          </VStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      bg={isAvailable ? config.bgColor : config.unavailableBg}
      borderColor={isAvailable ? config.borderColor : config.unavailableBorder}
      border="2px solid"
      opacity={isAvailable ? 1 : 0.6}
      position="relative"
    >
      {/* Most Popular / Best Value Badge */}
      {(isMostPopular || isBestValue) && (
        <Box
          position="absolute"
          top="-10px"
          right="10px"
          bg={isMostPopular ? "orange.500" : "green.500"}
          color="white"
          px={3}
          py={1}
          borderRadius="full"
          fontSize="xs"
          fontWeight="bold"
          display="flex"
          alignItems="center"
          gap={1}
        >
          <Icon as={FaStar} />
          {isMostPopular ? "Most Popular" : "Best Value"}
        </Box>
      )}

      <CardBody p={4}>
        <VStack spacing={3} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <Text fontWeight="bold" color="white" fontSize="lg">
              {config.name}
            </Text>
            <Badge colorScheme={isAvailable ? config.badgeColor : "gray"}>
              {config.badgeLabel}
            </Badge>
          </HStack>

          {/* Price */}
          {tier?.price ? (
            <HStack spacing={2} align="baseline">
              <Text fontSize="3xl" fontWeight="bold" color={config.priceColor}>
                £{tier.price}
              </Text>
              {savings && savings > 0 && (
                <Tooltip label={`Save £${savings} vs Express`}>
                  <Badge colorScheme="green" fontSize="sm">
                    Save £{savings}
                  </Badge>
                </Tooltip>
              )}
            </HStack>
          ) : (
            <Text fontSize="lg" color="gray.400">
              Price unavailable
            </Text>
          )}

          {/* Availability */}
          {tier?.availability ? (
            <VStack spacing={1} align="start">
              <Text fontSize="sm" color="white">
                {tier.availability.route_type === 'economy' &&
                 tier.availability.next_available_date === new Date().toISOString().split('T')[0]
                  ? "Available tomorrow"
                  : `Next available: ${new Date(tier.availability.next_available_date).toLocaleDateString()}`
                }
              </Text>
              {tier.availability.fill_rate !== undefined && (
                <Tooltip label={tier.availability.explanation}>
                  <Text fontSize="xs" color={`${config.badgeColor}.300`} cursor="help">
                    <Icon as={FaInfoCircle} mr={1} />
                    {Math.round(tier.availability.fill_rate)}% route efficiency
                  </Text>
                </Tooltip>
              )}
            </VStack>
          ) : (
            <Text fontSize="sm" color="gray.400">
              Route optimization required
            </Text>
          )}

          {/* Expand/Collapse Button */}
          {breakdown && (
            <>
              <Divider borderColor="whiteAlpha.300" />
              <Button
                size="sm"
                variant="ghost"
                colorScheme={config.badgeColor}
                rightIcon={<Icon as={isExpanded ? FaChevronUp : FaChevronDown} />}
                onClick={() => setIsExpanded(!isExpanded)}
                width="full"
              >
                {isExpanded ? "Hide" : "Show"} Price Breakdown
              </Button>

              {/* Price Breakdown */}
              <Collapse in={isExpanded} animateOpacity>
                <Box mt={2}>
                  <PriceBreakdown
                    data={breakdown}
                    serviceLevel={serviceLevel}
                  />
                </Box>
              </Collapse>
            </>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}

