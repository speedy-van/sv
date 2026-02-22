'use client';

import React from 'react';
import {
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Card,
  CardBody,
  Divider,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiArrowRight,
  FiArrowDown,
  FiMapPin,
  FiDollarSign,
  FiClock,
} from 'react-icons/fi';

interface JourneySegment {
  id: string;
  segmentType: 'outbound' | 'return' | 'additional';
  sequenceNumber: number;
  priceGBP: number;
  pickupAddress?: {
    label: string;
    postcode: string;
  } | null;
  dropoffAddress?: {
    label: string;
    postcode: string;
  } | null;
  scheduledAt: string;
}

interface JourneyRelationshipCardProps {
  mainBooking: {
    reference: string;
    totalGBP: number;
    scheduledAt: string;
  };
  segments: JourneySegment[];
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  cardBg?: string;
  secondaryTextColor?: string;
}

export function JourneyRelationshipCard({
  mainBooking,
  segments,
  bgColor = '#0B1020',
  textColor = '#F5F8FF',
  borderColor = '#2A3A5E',
  cardBg = '#121A2B',
  secondaryTextColor = '#9ca3af',
}: JourneyRelationshipCardProps) {
  const outboundSegment = segments.find(s => s.segmentType === 'outbound');
  const returnSegments = segments.filter(s => s.segmentType === 'return');
  const additionalSegments = segments.filter(s => s.segmentType === 'additional');

  const totalJourneysPrice = segments.reduce((sum, seg) => sum + seg.priceGBP, 0);
  const mainBookingPrice = mainBooking.totalGBP;
  const savings = totalJourneysPrice - mainBookingPrice;

  const formatCurrency = (amount: number) => {
    return `£${(amount / 100).toFixed(2)}`;
  };

  const formatDateTime = (value: string) => {
    try {
      return new Date(value).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return value;
    }
  };

  if (segments.length <= 1) {
    return null; // Don't show if no additional journeys
  }

  return (
    <Card bg={cardBg} borderColor={borderColor} borderWidth={2} borderRadius="lg">
      <CardBody>
        <VStack align="stretch" spacing={4}>
          {/* Header */}
          <HStack justify="space-between" align="center">
            <Text fontWeight="bold" fontSize="lg" color={textColor}>
              Journey Relationship Overview
            </Text>
            <Badge colorScheme="purple" size="md">
              {segments.length} Journey{segments.length > 1 ? 's' : ''}
            </Badge>
          </HStack>

          <Divider borderColor={borderColor} />

          {/* Main Booking (Outbound) */}
          <Box
            p={4}
            bg="rgba(59, 130, 246, 0.1)"
            borderRadius="md"
            borderWidth={2}
            borderColor="#3b82f6"
            position="relative"
          >
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <HStack spacing={2}>
                  <Badge colorScheme="blue" size="lg">
                    📦 Main Booking (Outbound)
                  </Badge>
                  <Badge colorScheme="gray" size="sm">
                    Sequence #1
                  </Badge>
                </HStack>
                <Text fontSize="xl" fontWeight="bold" color="#3b82f6">
                  {formatCurrency(mainBookingPrice)}
                </Text>
              </HStack>

              {outboundSegment && (
                <HStack spacing={2} fontSize="sm" color={textColor}>
                  <Icon as={FiMapPin} color="#3b82f6" />
                  <Text>
                    {outboundSegment.pickupAddress?.postcode || 'N/A'} →{' '}
                    {outboundSegment.dropoffAddress?.postcode || 'N/A'}
                  </Text>
                </HStack>
              )}

              <HStack spacing={2} fontSize="xs" color={secondaryTextColor}>
                <Icon as={FiClock} />
                <Text>{formatDateTime(mainBooking.scheduledAt)}</Text>
              </HStack>
            </VStack>
          </Box>

          {/* Connection Line */}
          {(returnSegments.length > 0 || additionalSegments.length > 0) && (
            <Box position="relative" h="30px" display="flex" alignItems="center" justifyContent="center">
              <Box
                position="absolute"
                left="50%"
                top="50%"
                transform="translate(-50%, -50%)"
                w="2px"
                h="100%"
                bg={borderColor}
              />
              <Icon
                as={FiArrowDown}
                color="#10b981"
                boxSize={5}
                position="absolute"
                left="50%"
                top="50%"
                transform="translate(-50%, -50%)"
                bg={cardBg}
                p={1}
                borderRadius="full"
              />
            </Box>
          )}

          {/* Return Journey */}
          {returnSegments.map((segment, index) => (
            <React.Fragment key={segment.id}>
              <Box
                p={4}
                bg="rgba(16, 185, 129, 0.1)"
                borderRadius="md"
                borderWidth={2}
                borderColor="#10b981"
                position="relative"
                ml={4}
              >
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Badge colorScheme="green" size="lg">
                        🔄 Return Journey
                      </Badge>
                      <Badge colorScheme="gray" size="sm">
                        Sequence #{segment.sequenceNumber + 1}
                      </Badge>
                    </HStack>
                    <VStack align="end" spacing={0}>
                      <Text fontSize="lg" fontWeight="bold" color="#10b981">
                        {formatCurrency(segment.priceGBP)}
                      </Text>
                      {savings > 0 && index === 0 && (
                        <Text fontSize="xs" color="#10b981">
                          Savings: {formatCurrency(savings)}
                        </Text>
                      )}
                    </VStack>
                  </HStack>

                  <HStack spacing={2} fontSize="sm" color={textColor}>
                    <Icon as={FiMapPin} color="#10b981" />
                    <Text>
                      {segment.pickupAddress?.postcode || 'N/A'} →{' '}
                      {segment.dropoffAddress?.postcode || 'N/A'}
                    </Text>
                  </HStack>

                  <HStack spacing={2} fontSize="xs" color={secondaryTextColor}>
                    <Icon as={FiClock} />
                    <Text>{formatDateTime(segment.scheduledAt)}</Text>
                  </HStack>
                </VStack>
              </Box>

              {index < returnSegments.length - 1 && (
                <Box position="relative" h="20px" display="flex" alignItems="center" ml={4}>
                  <Box
                    position="absolute"
                    left="50%"
                    top="0"
                    transform="translateX(-50%)"
                    w="2px"
                    h="100%"
                    bg={borderColor}
                  />
                  <Icon
                    as={FiArrowDown}
                    color="#10b981"
                    boxSize={4}
                    position="absolute"
                    left="50%"
                    top="50%"
                    transform="translate(-50%, -50%)"
                    bg={cardBg}
                    p={0.5}
                    borderRadius="full"
                  />
                </Box>
              )}
            </React.Fragment>
          ))}

          {/* Additional Journeys */}
          {additionalSegments.map((segment, index) => (
            <React.Fragment key={segment.id}>
              {(returnSegments.length > 0 || index > 0) && (
                <Box position="relative" h="20px" display="flex" alignItems="center" ml={4}>
                  <Box
                    position="absolute"
                    left="50%"
                    top="0"
                    transform="translateX(-50%)"
                    w="2px"
                    h="100%"
                    bg={borderColor}
                  />
                  <Icon
                    as={FiArrowDown}
                    color="#06b6d4"
                    boxSize={4}
                    position="absolute"
                    left="50%"
                    top="50%"
                    transform="translate(-50%, -50%)"
                    bg={cardBg}
                    p={0.5}
                    borderRadius="full"
                  />
                </Box>
              )}

              <Box
                p={4}
                bg="rgba(6, 182, 212, 0.1)"
                borderRadius="md"
                borderWidth={2}
                borderColor="#06b6d4"
                position="relative"
                ml={4}
              >
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <HStack spacing={2}>
                      <Badge colorScheme="cyan" size="lg">
                        ➕ Additional Journey #{index + 1}
                      </Badge>
                      <Badge colorScheme="gray" size="sm">
                        Sequence #{segment.sequenceNumber + 1}
                      </Badge>
                    </HStack>
                    <Text fontSize="lg" fontWeight="bold" color="#06b6d4">
                      {formatCurrency(segment.priceGBP)}
                    </Text>
                  </HStack>

                  <HStack spacing={2} fontSize="sm" color={textColor}>
                    <Icon as={FiMapPin} color="#06b6d4" />
                    <Text>
                      {segment.pickupAddress?.postcode || 'N/A'} →{' '}
                      {segment.dropoffAddress?.postcode || 'N/A'}
                    </Text>
                  </HStack>

                  <HStack spacing={2} fontSize="xs" color={secondaryTextColor}>
                    <Icon as={FiClock} />
                    <Text>{formatDateTime(segment.scheduledAt)}</Text>
                  </HStack>
                </VStack>
              </Box>
            </React.Fragment>
          ))}

          <Divider borderColor={borderColor} />

          {/* Summary */}
          <VStack align="stretch" spacing={2} p={3} bg={bgColor} borderRadius="md" borderWidth={1} borderColor={borderColor}>
            <HStack justify="space-between">
              <Text fontSize="sm" fontWeight="bold" color={textColor}>
                Total Booking Value:
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="#10b981">
                {formatCurrency(mainBookingPrice)}
              </Text>
            </HStack>

            {savings > 0 && (
              <HStack justify="space-between">
                <Text fontSize="xs" color={secondaryTextColor}>
                  Combined Price (without discount):
                </Text>
                <Text fontSize="sm" color={secondaryTextColor} textDecoration="line-through">
                  {formatCurrency(totalJourneysPrice)}
                </Text>
              </HStack>
            )}

            {savings > 0 && (
              <HStack justify="space-between">
                <Text fontSize="xs" color="#10b981">
                  Total Savings:
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="#10b981">
                  {formatCurrency(savings)}
                </Text>
              </HStack>
            )}

            <HStack justify="space-between" fontSize="xs" color={secondaryTextColor}>
              <Text>Journeys Breakdown:</Text>
              <Text>
                1 Main + {returnSegments.length} Return + {additionalSegments.length} Additional
              </Text>
            </HStack>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );
}

