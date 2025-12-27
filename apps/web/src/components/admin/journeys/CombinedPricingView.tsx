'use client';

import React, { useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Icon,
  Tooltip,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  SimpleGrid,
  Progress,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiTrendingDown,
  FiTrendingUp,
  FiInfo,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';

interface JourneySegment {
  id: string;
  segmentType: 'outbound' | 'return' | 'additional';
  sequenceNumber: number;
  priceGBP: number;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  items?: any[];
}

interface CombinedPricingViewProps {
  mainBooking: {
    reference: string;
    totalGBP: number;
    scheduledAt: string;
  };
  segments: JourneySegment[];
  showBreakdown?: boolean;
  showSavings?: boolean;
  showComparison?: boolean;
}

export function CombinedPricingView({
  mainBooking,
  segments,
  showBreakdown = true,
  showSavings = true,
  showComparison = true,
}: CombinedPricingViewProps) {
  const cardBg = useColorModeValue('#111111', '#111111');
  const textColor = useColorModeValue('#FFFFFF', '#FFFFFF');
  const borderColor = useColorModeValue('#333333', '#333333');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  const pricingData = useMemo(() => {
    const sortedSegments = [...segments].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    
    const outboundSegment = sortedSegments.find(s => s.segmentType === 'outbound');
    const returnSegments = sortedSegments.filter(s => s.segmentType === 'return');
    const additionalSegments = sortedSegments.filter(s => s.segmentType === 'additional');

    const individualPrices = sortedSegments.map(seg => seg.priceGBP);
    const totalIndividualPrice = individualPrices.reduce((sum, price) => sum + price, 0);
    const combinedPrice = mainBooking.totalGBP;
    const savings = totalIndividualPrice - combinedPrice;
    const savingsPercentage = totalIndividualPrice > 0 ? (savings / totalIndividualPrice) * 100 : 0;

    // Calculate per-segment breakdown
    const segmentBreakdown = sortedSegments.map((segment, index) => {
      const segmentPercentage = totalIndividualPrice > 0
        ? (segment.priceGBP / totalIndividualPrice) * 100
        : 0;
      
      return {
        ...segment,
        percentage: segmentPercentage,
        contribution: totalIndividualPrice > 0
          ? (segment.priceGBP / totalIndividualPrice) * combinedPrice
          : segment.priceGBP,
      };
    });

    // Calculate average price per journey
    const averagePricePerJourney = sortedSegments.length > 0
      ? totalIndividualPrice / sortedSegments.length
      : 0;

    // Calculate price per km (if distance available)
    const segmentsWithDistance = sortedSegments.filter(s => s.distanceMeters && s.distanceMeters > 0);
    const totalDistance = segmentsWithDistance.reduce((sum, s) => sum + (s.distanceMeters || 0), 0);
    const pricePerKm = totalDistance > 0
      ? (combinedPrice / (totalDistance / 1000)) / 100
      : null;

    return {
      outboundSegment,
      returnSegments,
      additionalSegments,
      individualPrices,
      totalIndividualPrice,
      combinedPrice,
      savings,
      savingsPercentage,
      segmentBreakdown,
      averagePricePerJourney,
      pricePerKm,
      totalDistance,
    };
  }, [segments, mainBooking.totalGBP]);

  const formatCurrency = (amount: number) => `£${(amount / 100).toFixed(2)}`;

  return (
    <VStack align="stretch" spacing={4}>
      {/* Pricing Summary */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardHeader>
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Icon as={FiDollarSign} color="#10b981" boxSize={5} />
              <Text fontWeight="bold" fontSize="lg" color={textColor}>
                Combined Pricing Overview
              </Text>
            </HStack>
            {showSavings && pricingData.savings > 0 && (
              <Badge colorScheme="green" size="lg" px={3} py={1}>
                Save {formatCurrency(pricingData.savings)}
              </Badge>
            )}
          </HStack>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={3} spacing={4}>
            <Box>
              <Text fontSize="xs" color={secondaryTextColor} mb={1}>Individual Total</Text>
              <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                {formatCurrency(pricingData.totalIndividualPrice)}
              </Text>
              <Text fontSize="xs" color={secondaryTextColor} mt={1}>
                {segments.length} journey{segments.length > 1 ? 's' : ''} separately
              </Text>
            </Box>
            <Box>
              <Text fontSize="xs" color={secondaryTextColor} mb={1}>Combined Price</Text>
              <Text fontSize="2xl" fontWeight="bold" color="#10b981">
                {formatCurrency(pricingData.combinedPrice)}
              </Text>
              <Text fontSize="xs" color="#10b981" mt={1}>
                With multi-journey discount
              </Text>
            </Box>
            <Box>
              <Text fontSize="xs" color={secondaryTextColor} mb={1}>Total Savings</Text>
              <Text fontSize="2xl" fontWeight="bold" color={pricingData.savings > 0 ? '#10b981' : '#ef4444'}>
                {formatCurrency(pricingData.savings)}
              </Text>
              <Text fontSize="xs" color={pricingData.savings > 0 ? '#10b981' : '#ef4444'} mt={1}>
                {pricingData.savingsPercentage > 0 ? '+' : ''}{pricingData.savingsPercentage.toFixed(1)}% discount
              </Text>
            </Box>
          </SimpleGrid>

          {showSavings && pricingData.savings > 0 && (
            <Box mt={4}>
              <Progress
                value={pricingData.savingsPercentage}
                colorScheme="green"
                size="lg"
                borderRadius="full"
                bg={borderColor}
              />
              <HStack justify="space-between" mt={2}>
                <Text fontSize="xs" color={secondaryTextColor}>
                  Individual Price
                </Text>
                <Text fontSize="xs" color="#10b981" fontWeight="bold">
                  {pricingData.savingsPercentage.toFixed(1)}% Savings
                </Text>
                <Text fontSize="xs" color={secondaryTextColor}>
                  Combined Price
                </Text>
              </HStack>
            </Box>
          )}
        </CardBody>
      </Card>

      {/* Savings Alert */}
      {showSavings && pricingData.savings > 0 && (
        <Alert status="success" bg="rgba(16, 185, 129, 0.1)" borderColor="#10b981" borderWidth={1}>
          <AlertIcon color="#10b981" />
          <VStack align="start" spacing={0} flex={1}>
            <Text fontSize="sm" fontWeight="bold" color="#10b981">
              Multi-Journey Discount Applied
            </Text>
            <Text fontSize="xs" color={secondaryTextColor}>
              Customer saves {formatCurrency(pricingData.savings)} ({pricingData.savingsPercentage.toFixed(1)}%) by booking {segments.length} journeys together
            </Text>
          </VStack>
        </Alert>
      )}

      {/* Price Breakdown Table */}
      {showBreakdown && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardHeader>
            <Text fontWeight="bold" fontSize="md" color={textColor}>
              Price Breakdown by Journey
            </Text>
          </CardHeader>
          <CardBody>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th color={textColor} borderColor={borderColor}>Journey</Th>
                  <Th color={textColor} borderColor={borderColor}>Type</Th>
                  <Th color={textColor} borderColor={borderColor} isNumeric>Individual Price</Th>
                  <Th color={textColor} borderColor={borderColor} isNumeric>Contribution</Th>
                  <Th color={textColor} borderColor={borderColor} isNumeric>% of Total</Th>
                  {pricingData.totalDistance > 0 && (
                    <Th color={textColor} borderColor={borderColor} isNumeric>Distance</Th>
                  )}
                </Tr>
              </Thead>
              <Tbody>
                {pricingData.segmentBreakdown.map((segment, index) => {
                  const segmentTypeLabel =
                    segment.segmentType === 'outbound' ? 'Outbound' :
                    segment.segmentType === 'return' ? 'Return' : 'Additional';
                  
                  const segmentColor =
                    segment.segmentType === 'outbound' ? '#3b82f6' :
                    segment.segmentType === 'return' ? '#10b981' : '#06b6d4';

                  return (
                    <Tr key={segment.id}>
                      <Td borderColor={borderColor}>
                        <HStack spacing={2}>
                          <Badge
                            colorScheme={
                              segment.segmentType === 'outbound' ? 'blue' :
                              segment.segmentType === 'return' ? 'green' : 'cyan'
                            }
                            size="sm"
                          >
                            #{segment.sequenceNumber + 1}
                          </Badge>
                          <Text color={textColor} fontSize="sm">
                            Journey {index + 1}
                          </Text>
                        </HStack>
                      </Td>
                      <Td borderColor={borderColor}>
                        <Badge
                          colorScheme={
                            segment.segmentType === 'outbound' ? 'blue' :
                            segment.segmentType === 'return' ? 'green' : 'cyan'
                          }
                          size="sm"
                        >
                          {segmentTypeLabel}
                        </Badge>
                      </Td>
                      <Td borderColor={borderColor} isNumeric>
                        <Text color={textColor} fontWeight="bold">
                          {formatCurrency(segment.priceGBP)}
                        </Text>
                      </Td>
                      <Td borderColor={borderColor} isNumeric>
                        <Text color={segmentColor} fontWeight="bold">
                          {formatCurrency(segment.contribution)}
                        </Text>
                      </Td>
                      <Td borderColor={borderColor} isNumeric>
                        <HStack spacing={2} justify="flex-end">
                          <Progress
                            value={segment.percentage}
                            colorScheme={
                              segment.segmentType === 'outbound' ? 'blue' :
                              segment.segmentType === 'return' ? 'green' : 'cyan'
                            }
                            size="sm"
                            w="60px"
                            borderRadius="full"
                          />
                          <Text color={textColor} fontSize="xs" minW="40px">
                            {segment.percentage.toFixed(1)}%
                          </Text>
                        </HStack>
                      </Td>
                      {pricingData.totalDistance > 0 && (
                        <Td borderColor={borderColor} isNumeric>
                          <Text color={secondaryTextColor} fontSize="xs">
                            {segment.distanceMeters
                              ? `${(segment.distanceMeters / 1000).toFixed(1)} km`
                              : 'N/A'}
                          </Text>
                        </Td>
                      )}
                    </Tr>
                  );
                })}
                <Tr bg="rgba(16, 185, 129, 0.1)">
                  <Td borderColor={borderColor} colSpan={pricingData.totalDistance > 0 ? 2 : 2}>
                    <Text fontWeight="bold" color={textColor}>
                      Total
                    </Text>
                  </Td>
                  <Td borderColor={borderColor} isNumeric>
                    <Text fontWeight="bold" color={textColor}>
                      {formatCurrency(pricingData.totalIndividualPrice)}
                    </Text>
                  </Td>
                  <Td borderColor={borderColor} isNumeric>
                    <Text fontWeight="bold" color="#10b981">
                      {formatCurrency(pricingData.combinedPrice)}
                    </Text>
                  </Td>
                  <Td borderColor={borderColor} isNumeric>
                    <Text fontWeight="bold" color={textColor}>
                      100%
                    </Text>
                  </Td>
                  {pricingData.totalDistance > 0 && (
                    <Td borderColor={borderColor} isNumeric>
                      <Text fontWeight="bold" color={textColor}>
                        {(pricingData.totalDistance / 1000).toFixed(1)} km
                      </Text>
                    </Td>
                  )}
                </Tr>
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Pricing Statistics */}
      <SimpleGrid columns={3} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color={secondaryTextColor}>Average per Journey</Text>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {formatCurrency(pricingData.averagePricePerJourney)}
              </Text>
              <Text fontSize="xs" color={secondaryTextColor}>
                {segments.length} journey{segments.length > 1 ? 's' : ''}
              </Text>
            </VStack>
          </CardBody>
        </Card>
        {pricingData.pricePerKm && (
          <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
            <CardBody>
              <VStack align="start" spacing={1}>
                <Text fontSize="xs" color={secondaryTextColor}>Price per Kilometer</Text>
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  {formatCurrency(pricingData.pricePerKm * 100)}
                </Text>
                <Text fontSize="xs" color={secondaryTextColor}>
                  {(pricingData.totalDistance / 1000).toFixed(1)} km total
                </Text>
              </VStack>
            </CardBody>
          </Card>
        )}
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color={secondaryTextColor}>Journey Types</Text>
              <HStack spacing={2} flexWrap="wrap">
                {pricingData.outboundSegment && (
                  <Badge colorScheme="blue" size="sm">1 Outbound</Badge>
                )}
                {pricingData.returnSegments.length > 0 && (
                  <Badge colorScheme="green" size="sm">
                    {pricingData.returnSegments.length} Return
                  </Badge>
                )}
                {pricingData.additionalSegments.length > 0 && (
                  <Badge colorScheme="cyan" size="sm">
                    {pricingData.additionalSegments.length} Additional
                  </Badge>
                )}
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Price Comparison */}
      {showComparison && pricingData.savings > 0 && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardHeader>
            <HStack spacing={2}>
              <Icon as={FiTrendingDown} color="#10b981" />
              <Text fontWeight="bold" fontSize="md" color={textColor}>
                Price Comparison
              </Text>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between" p={3} bg="rgba(239, 68, 68, 0.1)" borderRadius="md" borderWidth={1} borderColor="#ef4444">
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color={secondaryTextColor}>If booked separately</Text>
                  <Text fontSize="lg" fontWeight="bold" color="#ef4444">
                    {formatCurrency(pricingData.totalIndividualPrice)}
                  </Text>
                </VStack>
                <Icon as={FiTrendingUp} color="#ef4444" boxSize={6} />
              </HStack>

              <HStack justify="center">
                <Icon as={FiTrendingDown} color="#10b981" boxSize={5} />
                <Text fontSize="sm" fontWeight="bold" color="#10b981">
                  Save {formatCurrency(pricingData.savings)} ({pricingData.savingsPercentage.toFixed(1)}%)
                </Text>
              </HStack>

              <HStack justify="space-between" p={3} bg="rgba(16, 185, 129, 0.1)" borderRadius="md" borderWidth={1} borderColor="#10b981">
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color={secondaryTextColor}>Combined booking price</Text>
                  <Text fontSize="lg" fontWeight="bold" color="#10b981">
                    {formatCurrency(pricingData.combinedPrice)}
                  </Text>
                </VStack>
                <Icon as={FiCheckCircle} color="#10b981" boxSize={6} />
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  );
}

