'use client';

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Divider,
  Badge,
  Tooltip,
  Icon,
  Collapse,
  Button,
  SimpleGrid,
  Progress,
} from '@chakra-ui/react';
import {
  FaInfoCircle,
  FaChevronDown,
  FaChevronUp,
  FaTruck,
  FaClock,
  FaBox,
  FaMapMarkerAlt,
  FaChartLine,
  FaUsers,
  FaCloud,
  FaCalendar,
} from 'react-icons/fa';

export interface PriceBreakdownData {
  basePrice: number;
  breakdown: {
    baseFare: number;
    distanceCost: number;
    timeCost: number;
    itemsCost: number;
    surcharges: number;
    discounts: number;
    multiDropDiscount?: number;
  };
  dynamicMultipliers?: {
    demand: number;
    supply: number;
    market: number;
    customer: number;
    time: number;
    weather: number;
  };
  finalPrice: number;
  confidence?: number;
  routeType?: 'single' | 'multi-drop';
  multiDropSavings?: number;
}

interface PriceBreakdownProps {
  data: PriceBreakdownData;
  serviceLevel: 'economy' | 'standard' | 'express';
  isExpanded?: boolean;
  onToggle?: () => void;
}

export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  data,
  serviceLevel,
  isExpanded = false,
  onToggle,
}) => {
  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  const getMultiplierColor = (value: number) => {
    if (value < 1) return 'green';
    if (value === 1) return 'gray';
    if (value < 1.2) return 'yellow';
    return 'red';
  };

  const getMultiplierLabel = (value: number) => {
    if (value < 1) return 'Discount';
    if (value === 1) return 'Standard';
    if (value < 1.2) return 'Moderate';
    return 'High Demand';
  };

  const serviceColors = {
    economy: { bg: 'green.900', border: 'green.500', text: 'green.400' },
    standard: { bg: 'blue.900', border: 'blue.500', text: 'blue.400' },
    express: { bg: 'purple.900', border: 'purple.500', text: 'purple.400' },
  };

  const colors = serviceColors[serviceLevel];

  return (
    <Box
      bg={colors.bg}
      borderRadius="lg"
      border="1px solid"
      borderColor={colors.border}
      overflow="hidden"
    >
      {/* Header - Always Visible */}
      <Box
        p={4}
        cursor="pointer"
        onClick={onToggle}
        _hover={{ bg: 'whiteAlpha.50' }}
        transition="all 0.2s"
      >
        <HStack justify="space-between">
          <VStack align="start" spacing={1}>
            <Text fontSize="lg" fontWeight="bold" color="white">
              {formatCurrency(data.finalPrice)}
            </Text>
            {data.multiDropSavings && data.multiDropSavings > 0 && (
              <HStack spacing={1}>
                <Badge colorScheme="green" fontSize="xs">
                  Save {formatCurrency(data.multiDropSavings)}
                </Badge>
                <Text fontSize="xs" color="gray.400">
                  vs dedicated van
                </Text>
              </HStack>
            )}
          </VStack>

          <HStack spacing={2}>
            {data.confidence && (
              <Tooltip label={`${Math.round(data.confidence * 100)}% pricing confidence`}>
                <Badge colorScheme={data.confidence > 0.8 ? 'green' : 'yellow'}>
                  {Math.round(data.confidence * 100)}%
                </Badge>
              </Tooltip>
            )}
            <Icon
              as={isExpanded ? FaChevronUp : FaChevronDown}
              color="gray.400"
            />
          </HStack>
        </HStack>
      </Box>

      {/* Detailed Breakdown - Collapsible */}
      <Collapse in={isExpanded} animateOpacity>
        <Box p={4} pt={0}>
          <Divider mb={4} borderColor="whiteAlpha.200" />

          {/* Base Costs */}
          <VStack spacing={3} align="stretch" mb={4}>
            <Text fontSize="sm" fontWeight="bold" color="gray.300">
              Base Costs
            </Text>

            <HStack justify="space-between">
              <HStack spacing={2}>
                <Icon as={FaTruck} color="gray.400" boxSize={3} />
                <Text fontSize="sm" color="gray.300">
                  Base Fare
                </Text>
              </HStack>
              <Text fontSize="sm" color="white">
                {formatCurrency(data.breakdown.baseFare)}
              </Text>
            </HStack>

            <HStack justify="space-between">
              <HStack spacing={2}>
                <Icon as={FaMapMarkerAlt} color="gray.400" boxSize={3} />
                <Text fontSize="sm" color="gray.300">
                  Distance
                </Text>
              </HStack>
              <Text fontSize="sm" color="white">
                {formatCurrency(data.breakdown.distanceCost)}
              </Text>
            </HStack>

            <HStack justify="space-between">
              <HStack spacing={2}>
                <Icon as={FaClock} color="gray.400" boxSize={3} />
                <Text fontSize="sm" color="gray.300">
                  Time
                </Text>
              </HStack>
              <Text fontSize="sm" color="white">
                {formatCurrency(data.breakdown.timeCost)}
              </Text>
            </HStack>

            <HStack justify="space-between">
              <HStack spacing={2}>
                <Icon as={FaBox} color="gray.400" boxSize={3} />
                <Text fontSize="sm" color="gray.300">
                  Items
                </Text>
              </HStack>
              <Text fontSize="sm" color="white">
                {formatCurrency(data.breakdown.itemsCost)}
              </Text>
            </HStack>
          </VStack>

          {/* Dynamic Multipliers */}
          {data.dynamicMultipliers && (
            <>
              <Divider mb={4} borderColor="whiteAlpha.200" />
              <VStack spacing={3} align="stretch" mb={4}>
                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="bold" color="gray.300">
                    Dynamic Pricing Factors
                  </Text>
                  <Tooltip label="Real-time market conditions affect final price">
                    <Icon as={FaInfoCircle} color="gray.400" boxSize={3} />
                  </Tooltip>
                </HStack>

                <SimpleGrid columns={2} spacing={3}>
                  {/* Demand */}
                  <Box>
                    <HStack justify="space-between" mb={1}>
                      <HStack spacing={1}>
                        <Icon as={FaChartLine} color="gray.400" boxSize={3} />
                        <Text fontSize="xs" color="gray.400">
                          Demand
                        </Text>
                      </HStack>
                      <Badge
                        colorScheme={getMultiplierColor(data.dynamicMultipliers.demand)}
                        fontSize="xs"
                      >
                        {data.dynamicMultipliers.demand.toFixed(2)}x
                      </Badge>
                    </HStack>
                    <Progress
                      value={(data.dynamicMultipliers.demand - 0.5) * 100}
                      max={100}
                      size="xs"
                      colorScheme={getMultiplierColor(data.dynamicMultipliers.demand)}
                      borderRadius="full"
                    />
                  </Box>

                  {/* Supply */}
                  <Box>
                    <HStack justify="space-between" mb={1}>
                      <HStack spacing={1}>
                        <Icon as={FaTruck} color="gray.400" boxSize={3} />
                        <Text fontSize="xs" color="gray.400">
                          Supply
                        </Text>
                      </HStack>
                      <Badge
                        colorScheme={getMultiplierColor(data.dynamicMultipliers.supply)}
                        fontSize="xs"
                      >
                        {data.dynamicMultipliers.supply.toFixed(2)}x
                      </Badge>
                    </HStack>
                    <Progress
                      value={(data.dynamicMultipliers.supply - 0.5) * 100}
                      max={100}
                      size="xs"
                      colorScheme={getMultiplierColor(data.dynamicMultipliers.supply)}
                      borderRadius="full"
                    />
                  </Box>

                  {/* Time */}
                  <Box>
                    <HStack justify="space-between" mb={1}>
                      <HStack spacing={1}>
                        <Icon as={FaCalendar} color="gray.400" boxSize={3} />
                        <Text fontSize="xs" color="gray.400">
                          Time
                        </Text>
                      </HStack>
                      <Badge
                        colorScheme={getMultiplierColor(data.dynamicMultipliers.time)}
                        fontSize="xs"
                      >
                        {data.dynamicMultipliers.time.toFixed(2)}x
                      </Badge>
                    </HStack>
                    <Progress
                      value={(data.dynamicMultipliers.time - 0.5) * 100}
                      max={100}
                      size="xs"
                      colorScheme={getMultiplierColor(data.dynamicMultipliers.time)}
                      borderRadius="full"
                    />
                  </Box>

                  {/* Customer */}
                  <Box>
                    <HStack justify="space-between" mb={1}>
                      <HStack spacing={1}>
                        <Icon as={FaUsers} color="gray.400" boxSize={3} />
                        <Text fontSize="xs" color="gray.400">
                          Customer
                        </Text>
                      </HStack>
                      <Badge
                        colorScheme={getMultiplierColor(data.dynamicMultipliers.customer)}
                        fontSize="xs"
                      >
                        {data.dynamicMultipliers.customer.toFixed(2)}x
                      </Badge>
                    </HStack>
                    <Progress
                      value={(data.dynamicMultipliers.customer - 0.5) * 100}
                      max={100}
                      size="xs"
                      colorScheme={getMultiplierColor(data.dynamicMultipliers.customer)}
                      borderRadius="full"
                    />
                  </Box>
                </SimpleGrid>
              </VStack>
            </>
          )}

          {/* Adjustments */}
          {(data.breakdown.surcharges > 0 || data.breakdown.discounts > 0 || data.breakdown.multiDropDiscount) && (
            <>
              <Divider mb={4} borderColor="whiteAlpha.200" />
              <VStack spacing={3} align="stretch" mb={4}>
                <Text fontSize="sm" fontWeight="bold" color="gray.300">
                  Adjustments
                </Text>

                {data.breakdown.surcharges > 0 && (
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.300">
                      Surcharges
                    </Text>
                    <Text fontSize="sm" color="red.400">
                      +{formatCurrency(data.breakdown.surcharges)}
                    </Text>
                  </HStack>
                )}

                {data.breakdown.discounts > 0 && (
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.300">
                      Discounts
                    </Text>
                    <Text fontSize="sm" color="green.400">
                      -{formatCurrency(data.breakdown.discounts)}
                    </Text>
                  </HStack>
                )}

                {data.breakdown.multiDropDiscount && data.breakdown.multiDropDiscount > 0 && (
                  <HStack justify="space-between">
                    <HStack spacing={1}>
                      <Text fontSize="sm" color="gray.300">
                        Multi-Drop Savings
                      </Text>
                      <Tooltip label="Sharing the route with other customers">
                        <Icon as={FaInfoCircle} color="gray.400" boxSize={3} />
                      </Tooltip>
                    </HStack>
                    <Text fontSize="sm" color="green.400">
                      -{formatCurrency(data.breakdown.multiDropDiscount)}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </>
          )}

          {/* Total */}
          <Divider mb={4} borderColor="whiteAlpha.200" />
          <HStack justify="space-between">
            <Text fontSize="md" fontWeight="bold" color="white">
              Total
            </Text>
            <Text fontSize="xl" fontWeight="bold" color={colors.text}>
              {formatCurrency(data.finalPrice)}
            </Text>
          </HStack>

          {/* Route Type Badge */}
          {data.routeType && (
            <Box mt={3} textAlign="center">
              <Badge
                colorScheme={data.routeType === 'multi-drop' ? 'green' : 'blue'}
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="md"
              >
                {data.routeType === 'multi-drop' ? '🚛 Multi-Drop Route' : '🚐 Dedicated Van'}
              </Badge>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

export default PriceBreakdown;

