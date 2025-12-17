'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Spinner,
  Card,
  CardBody,
  Divider,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { FaPoundSign, FaInfoCircle, FaRoute, FaClock } from 'react-icons/fa';

interface PricePreviewProps {
  pickupPostcode?: string;
  dropoffPostcode?: string;
  pickupCoordinates?: { lat?: number; lng?: number };
  dropoffCoordinates?: { lat?: number; lng?: number };
}

export default function PricePreview({
  pickupPostcode,
  dropoffPostcode,
  pickupCoordinates,
  dropoffCoordinates,
}: PricePreviewProps) {
  const [estimatedRange, setEstimatedRange] = useState<{ min: number; max: number } | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<string>('');
  const [distance, setDistance] = useState<number>(0);

  useEffect(() => {
    // Calculate distance using haversine formula
    if (!pickupCoordinates?.lat || !pickupCoordinates?.lng || 
        !dropoffCoordinates?.lat || !dropoffCoordinates?.lng) {
      setDistance(0);
      setEstimatedRange(null);
      setEstimatedDuration('');
      return;
    }

    // Skip if coordinates are default (0,0)
    if (
      (pickupCoordinates.lat === 0 && pickupCoordinates.lng === 0) ||
      (dropoffCoordinates.lat === 0 && dropoffCoordinates.lng === 0)
    ) {
      setDistance(0);
      setEstimatedRange(null);
      setEstimatedDuration('');
      return;
    }

    // Haversine formula for distance calculation
    const R = 3958.8; // Earth's radius in miles
    const dLat = ((dropoffCoordinates.lat - pickupCoordinates.lat) * Math.PI) / 180;
    const dLng = ((dropoffCoordinates.lng - pickupCoordinates.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((pickupCoordinates.lat * Math.PI) / 180) *
        Math.cos((dropoffCoordinates.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceInMiles = R * c;
    
    setDistance(distanceInMiles);

    if (distanceInMiles === 0) {
      setEstimatedRange(null);
      setEstimatedDuration('');
      return;
    }

    // Calculate estimated price range based on distance
    // Base pricing: £50-80 base + £1.5-2.5 per mile
    const baseFee = 65; // Average base fee
    const perMileFee = 2.0; // Average per mile

    const estimatedBase = baseFee + (distanceInMiles * perMileFee);
    const min = Math.round(estimatedBase * 0.85); // -15%
    const max = Math.round(estimatedBase * 1.25); // +25%

    setEstimatedRange({ min, max });

    // Calculate estimated duration
    // UK city driving: 20 mph average (slower than 30 mph due to traffic, signals)
    // Add 15-30 minutes for loading/unloading based on distance
    const avgSpeedMph = 20;
    const drivingMinutes = Math.round((distanceInMiles / avgSpeedMph) * 60);
    const loadingTime = distanceInMiles < 5 ? 15 : distanceInMiles < 15 ? 20 : 30;
    const totalMinutes = drivingMinutes + loadingTime;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      setEstimatedDuration(`${hours}h ${minutes > 0 ? minutes + 'm' : ''}`);
    } else {
      setEstimatedDuration(`${minutes} min`);
    }
  }, [pickupCoordinates, dropoffCoordinates]);

  const hasAddresses = pickupPostcode && dropoffPostcode;
  const showPreview = hasAddresses && estimatedRange;

  if (!hasAddresses) {
    return null;
  }

  return (
    <Card
      bg="linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)"
      border="2px solid"
      borderColor="rgba(59, 130, 246, 0.3)"
      borderRadius={{ base: 'xl', md: '2xl' }}
      backdropFilter="blur(10px)"
      boxShadow="0 8px 32px rgba(59, 130, 246, 0.2)"
      mt={6}
      overflow="hidden"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        bgGradient: 'linear(to-r, blue.400, purple.500, pink.400)',
      }}
    >
      <CardBody p={{ base: 4, md: 6 }}>
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="center" flexWrap={{ base: 'wrap', md: 'nowrap' }}>
            <HStack spacing={3}>
              <Box
                w={{ base: '40px', md: '48px' }}
                h={{ base: '40px', md: '48px' }}
                borderRadius="xl"
                bg="linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2))"
                border="2px solid"
                borderColor="rgba(59, 130, 246, 0.4)"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FaPoundSign} color="blue.400" boxSize={{ base: 4, md: 5 }} />
              </Box>
              <VStack spacing={0} align="flex-start">
                <Text
                  color="white"
                  fontWeight="700"
                  fontSize={{ base: 'md', md: 'lg' }}
                  letterSpacing="tight"
                >
                  Estimated Price
                </Text>
                <Text color="whiteAlpha.600" fontSize={{ base: '2xs', md: 'xs' }} fontWeight="500">
                  Final price shown after selecting items
                </Text>
              </VStack>
            </HStack>
            <Tooltip
              label="This is an estimate based on distance only. Final price includes items, service level, and time selected."
              placement="top"
              hasArrow
            >
              <Box>
                <Icon as={FaInfoCircle} color="whiteAlpha.500" boxSize={4} cursor="help" />
              </Box>
            </Tooltip>
          </HStack>

          <Divider borderColor="whiteAlpha.200" />

          {/* Price Display */}
          {showPreview ? (
            <VStack spacing={3} align="stretch">
              {/* Price Range */}
              <HStack justify="center" py={{ base: 1, md: 2 }}>
                <Text
                  fontSize={{ base: '2xl', md: '3xl' }}
                  fontWeight="800"
                  bgGradient="linear(to-r, blue.300, purple.400)"
                  bgClip="text"
                  letterSpacing="tight"
                >
                  £{estimatedRange.min} - £{estimatedRange.max}
                </Text>
              </HStack>

              {/* Details */}
              <VStack spacing={2} align="stretch">
                {/* Distance */}
                <HStack
                  justify="space-between"
                  px={{ base: 3, md: 4 }}
                  py={{ base: 2, md: 2 }}
                  borderRadius="lg"
                  bg="whiteAlpha.50"
                >
                  <HStack spacing={2}>
                    <Icon as={FaRoute} color="blue.300" boxSize={{ base: 3.5, md: 4 }} />
                    <Text color="whiteAlpha.800" fontSize="sm" fontWeight="500">
                      Distance
                    </Text>
                  </HStack>
                  <Text color="white" fontSize="sm" fontWeight="600">
                    {distance?.toFixed(1)} miles
                  </Text>
                </HStack>

                {/* Duration */}
                {estimatedDuration && (
                  <HStack
                    justify="space-between"
                    px={{ base: 3, md: 4 }}
                    py={{ base: 2, md: 2 }}
                    borderRadius="lg"
                    bg="whiteAlpha.50"
                  >
                    <HStack spacing={2}>
                      <Icon as={FaClock} color="purple.300" boxSize={{ base: 3.5, md: 4 }} />
                      <Text color="whiteAlpha.800" fontSize="sm" fontWeight="500">
                        Est. Duration
                      </Text>
                    </HStack>
                    <Text color="white" fontSize="sm" fontWeight="600">
                      {estimatedDuration}
                    </Text>
                  </HStack>
                )}

                {/* Note */}
                <Box
                  px={{ base: 3, md: 4 }}
                  py={{ base: 2.5, md: 3 }}
                  borderRadius="lg"
                  bg="rgba(59, 130, 246, 0.1)"
                  border="1px solid"
                  borderColor="rgba(59, 130, 246, 0.2)"
                  mt={2}
                >
                  <HStack spacing={2} align="flex-start">
                    <Icon as={FaInfoCircle} color="blue.300" boxSize={3} mt={0.5} flexShrink={0} />
                    <Text color="whiteAlpha.700" fontSize={{ base: '2xs', md: 'xs' }} lineHeight="tall">
                      This estimate is based on distance only. Your final price will be calculated
                      based on items selected, service level, and pickup time.
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            </VStack>
          ) : (
            <Text color="whiteAlpha.600" fontSize="sm" textAlign="center" py={2}>
              Enter both addresses to see price estimate
            </Text>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}
