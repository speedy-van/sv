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

interface BookingSegment {
  pickupAddress?: { postcode?: string; coordinates?: { lat?: number; lng?: number } };
  dropoffAddress?: { postcode?: string; coordinates?: { lat?: number; lng?: number } };
}

interface PricePreviewProps {
  pickupPostcode?: string;
  dropoffPostcode?: string;
  pickupCoordinates?: { lat?: number; lng?: number };
  dropoffCoordinates?: { lat?: number; lng?: number };
  segments?: BookingSegment[];
}

export default function PricePreview({
  pickupPostcode,
  dropoffPostcode,
  pickupCoordinates,
  dropoffCoordinates,
  segments = [],
}: PricePreviewProps) {
  const [estimatedRange, setEstimatedRange] = useState<{ min: number; max: number } | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<string>('');
  const [distance, setDistance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const computeEstimates = (distanceMiles: number, durationSeconds?: number) => {
    setDistance(distanceMiles);

    if (!distanceMiles || Number.isNaN(distanceMiles)) {
      setEstimatedRange(null);
      setEstimatedDuration('');
      return;
    }

    const baseFee = 12;

    const tieredDistanceFee = (miles: number) => {
      const tiers = [
        { cap: 50, rate: 0.35 },
        { cap: 150, rate: 0.25 },
        { cap: Infinity, rate: 0.18 },
      ];
      let remaining = miles;
      let covered = 0;
      let fee = 0;

      for (const tier of tiers) {
        if (remaining <= 0) break;
        const span = tier.cap === Infinity ? remaining : Math.max(0, Math.min(remaining, tier.cap - covered));
        fee += span * tier.rate;
        remaining -= span;
        covered += span;
      }

      return fee;
    };

    const distanceFee = tieredDistanceFee(distanceMiles);
    const estimatedBase = Math.max(25, baseFee + distanceFee);
    const min = Math.round(estimatedBase * 0.85);
    const max = Math.round(estimatedBase * 0.95);
    setEstimatedRange({ min, max });

    const durationInMinutes = durationSeconds
      ? Math.round(durationSeconds / 60)
      : Math.round((distanceMiles / 20) * 60) + (distanceMiles < 5 ? 15 : distanceMiles < 15 ? 20 : 30);

    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;
    if (hours > 0) {
      setEstimatedDuration(`${hours}h ${minutes > 0 ? minutes + 'm' : ''}`);
    } else {
      setEstimatedDuration(`${minutes} min`);
    }
  };

  useEffect(() => {
    const hasSegments = Array.isArray(segments) ? segments.length > 0 : false;

    if (hasSegments) {
      const validDistances: number[] = [];

      segments.forEach(segment => {
        const pickup = segment.pickupAddress?.coordinates;
        const dropoff = segment.dropoffAddress?.coordinates;

        if (!pickup || !dropoff) return;
        if (typeof pickup.lat !== 'number' || typeof pickup.lng !== 'number') return;
        if (typeof dropoff.lat !== 'number' || typeof dropoff.lng !== 'number') return;
        if ((pickup.lat === 0 && pickup.lng === 0) || (dropoff.lat === 0 && dropoff.lng === 0)) return;
        if (pickup.lat < 49 || pickup.lat > 61) return;
        if (dropoff.lat < 49 || dropoff.lat > 61) return;
        if (pickup.lng < -8 || pickup.lng > 2) return;
        if (dropoff.lng < -8 || dropoff.lng > 2) return;

        const R = 3958.8;
        const dLat = ((dropoff.lat - pickup.lat) * Math.PI) / 180;
        const dLng = ((dropoff.lng - pickup.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((pickup.lat * Math.PI) / 180) *
            Math.cos((dropoff.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceInMiles = R * c;

        if (distanceInMiles > 0) {
          if (distanceInMiles <= 700) {
            validDistances.push(distanceInMiles);
          }
        }
      });

      if (validDistances.length === 0) {
        setDistance(0);
        setEstimatedRange(null);
        setEstimatedDuration('');
        return;
      }

      const totalDistance = validDistances.reduce((sum, value) => sum + value, 0);
      computeEstimates(totalDistance);
      return;
    }

    // Single journey calculation
    const hasCoords =
      pickupCoordinates &&
      dropoffCoordinates &&
      typeof pickupCoordinates.lat === 'number' &&
      typeof pickupCoordinates.lng === 'number' &&
      typeof dropoffCoordinates.lat === 'number' &&
      typeof dropoffCoordinates.lng === 'number';

    if (!hasCoords) {
      setDistance(0);
      setEstimatedRange(null);
      setEstimatedDuration('');
      setIsLoading(false);
      return;
    }

    const areDefault =
      (pickupCoordinates.lat === 0 && pickupCoordinates.lng === 0) ||
      (dropoffCoordinates.lat === 0 && dropoffCoordinates.lng === 0);

    if (areDefault) {
      setDistance(0);
      setEstimatedRange(null);
      setEstimatedDuration('');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const fetchDistance = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/address/distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            pickupLat: pickupCoordinates.lat,
            pickupLng: pickupCoordinates.lng,
            dropoffLat: dropoffCoordinates.lat,
            dropoffLng: dropoffCoordinates.lng,
          }),
          signal: controller.signal,
        });

        if (response.ok) {
          const result = await response.json();
          const distanceMeters = result?.data?.distance;
          const durationSeconds = result?.data?.durationInTraffic || result?.data?.duration;

          if (typeof distanceMeters === 'number' && distanceMeters > 0) {
            const distanceMiles = distanceMeters / 1609.34;
            computeEstimates(distanceMiles, typeof durationSeconds === 'number' ? durationSeconds : undefined);
            setIsLoading(false);
            return;
          }
        }

        // Fallback to haversine
        const R = 3958.8;
        const dLat = ((dropoffCoordinates.lat! - pickupCoordinates.lat!) * Math.PI) / 180;
        const dLng = ((dropoffCoordinates.lng! - pickupCoordinates.lng!) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((pickupCoordinates.lat! * Math.PI) / 180) *
            Math.cos((dropoffCoordinates.lat! * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceInMiles = R * c;
        computeEstimates(distanceInMiles);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          const R = 3958.8;
          const dLat = ((dropoffCoordinates.lat! - pickupCoordinates.lat!) * Math.PI) / 180;
          const dLng = ((dropoffCoordinates.lng! - pickupCoordinates.lng!) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((pickupCoordinates.lat! * Math.PI) / 180) *
              Math.cos((dropoffCoordinates.lat! * Math.PI) / 180) *
              Math.sin(dLng / 2) *
              Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distanceInMiles = R * c;
          computeEstimates(distanceInMiles);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDistance();
    return () => controller.abort();
  }, [pickupCoordinates, dropoffCoordinates, segments]);

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
                <Text color="white" fontWeight="700" fontSize={{ base: 'md', md: 'lg' }} letterSpacing="tight">
                  Estimated Price
                </Text>
                <Text color="whiteAlpha.600" fontSize={{ base: '2xs', md: 'xs' }} fontWeight="500">
                  {segments.length > 1 ? `Starting from - ${segments.length} journeys combined` : 'Starting estimate - final price after item selection'}
                </Text>
              </VStack>
            </HStack>
            <Tooltip label="This is an estimate based on distance. Final price includes items, service level, and timing." placement="top" hasArrow>
              <Box>
                <Icon as={FaInfoCircle} color="whiteAlpha.500" boxSize={4} cursor="help" />
              </Box>
            </Tooltip>
          </HStack>

          <Divider borderColor="whiteAlpha.200" />

          {showPreview ? (
            <VStack spacing={3} align="stretch">
              <HStack justify="center" py={{ base: 1, md: 2 }}>
                <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800" bgGradient="linear(to-r, blue.300, purple.400)" bgClip="text" letterSpacing="tight">
                  £{estimatedRange.min} - £{estimatedRange.max}
                </Text>
              </HStack>

              <VStack spacing={2} align="stretch">
                <HStack justify="space-between" px={{ base: 3, md: 4 }} py={{ base: 2, md: 2 }} borderRadius="lg" bg="whiteAlpha.50">
                  <HStack spacing={2}>
                    <Icon as={FaRoute} color="blue.300" boxSize={{ base: 3.5, md: 4 }} />
                    <Text color="whiteAlpha.800" fontSize="sm" fontWeight="500">
                      {segments.length > 1 ? 'Total Distance' : 'Distance'}
                    </Text>
                  </HStack>
                  <Text color="white" fontSize="sm" fontWeight="600">
                    {distance?.toFixed(1)} miles
                  </Text>
                </HStack>

                {estimatedDuration && (
                  <HStack justify="space-between" px={{ base: 3, md: 4 }} py={{ base: 2, md: 2 }} borderRadius="lg" bg="whiteAlpha.50">
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
              </VStack>
            </VStack>
          ) : (
            <VStack spacing={2} py={2}>
              {isLoading ? (
                <HStack justify="center" spacing={2}>
                  <Spinner size="sm" color="blue.300" />
                  <Text color="whiteAlpha.700" fontSize="sm">Calculating distance...</Text>
                </HStack>
              ) : (
                <Text color="whiteAlpha.600" fontSize="sm" textAlign="center">
                  Enter both addresses to see price estimate
                </Text>
              )}
            </VStack>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
}
