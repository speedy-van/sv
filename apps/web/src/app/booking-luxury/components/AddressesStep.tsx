'use client';

/**
 * Step 1: Pickup and Drop-off Addresses
 * Luxury Booking Design with Multi-Leg Support
 */

import React, { useMemo, useState, useEffect } from 'react';
import {
  Box,
  VStack,
  SimpleGrid,
  HStack,
  Text,
  Button,
  FormControl,
  FormErrorMessage,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import {
  FaArrowRight,
} from 'react-icons/fa';
import { UKAddressAutocomplete } from '@/components/address/UKAddressAutocomplete';
import type { FormData } from '../hooks/useBookingForm';
import type { BookingSegment } from '../types/segment';
import PricePreview from './PricePreview';
import SegmentManager from './SegmentManager';
import RouteMapPreview from './RouteMapPreview';
import MarketplacePickupOptions from './MarketplacePickupOptions';
import LuxurySurfaceCard from './LuxurySurfaceCard';
import { ResponsiveSection } from '@/components/layout/ResponsiveSection';


interface AddressesStepProps {
  formData: FormData;
  updateFormData: (step: keyof FormData, data: Partial<FormData[keyof FormData]>) => void;
  errors: Record<string, string>;
  onNext?: () => void;
  isTransitioning?: boolean;
  // Multi-leg functions
  addReturnSegment?: (bufferMinutes?: number) => void;
  addAdditionalSegment?: () => void;
  updateSegment?: (index: number, data: Partial<BookingSegment>) => void;
  removeSegment?: (index: number) => void;
  validateSegments?: () => { valid: boolean; errors: string[] };
}

export default function AddressesStep({
  formData,
  updateFormData,
  errors,
  onNext,
  isTransitioning = false,
  addReturnSegment,
  addAdditionalSegment,
  updateSegment,
  removeSegment,
  validateSegments,
}: AddressesStepProps) {
  // Validate if can proceed
  const canProceed = formData.step1.pickupAddress && formData.step1.dropoffAddress;

  const currentPickupProperty = useMemo(() => formData.step1.pickupProperty ?? {}, [formData.step1.pickupProperty]);
  const currentDropoffProperty = useMemo(() => formData.step1.dropoffProperty ?? {}, [formData.step1.dropoffProperty]);

  const pickupLocation = useMemo(() => {
    const coords = formData.step1.pickupAddress?.coordinates;
    if (!coords?.lat || !coords?.lng) return null;
    return {
      lat: coords.lat,
      lng: coords.lng,
      label:
        formData.step1.pickupAddress?.formatted_address ||
        formData.step1.pickupAddress?.place_name ||
        formData.step1.pickupAddress?.address ||
        formData.step1.pickupAddress?.city ||
        'Pickup location',
    };
  }, [formData.step1.pickupAddress]);

  const dropoffLocation = useMemo(() => {
    const coords = formData.step1.dropoffAddress?.coordinates;
    if (!coords?.lat || !coords?.lng) return null;
    return {
      lat: coords.lat,
      lng: coords.lng,
      label:
        formData.step1.dropoffAddress?.formatted_address ||
        formData.step1.dropoffAddress?.place_name ||
        formData.step1.dropoffAddress?.address ||
        formData.step1.dropoffAddress?.city ||
        'Drop-off location',
    };
  }, [formData.step1.dropoffAddress]);

  const parseFloorNumber = (value?: string | number | null): number => {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
    }

    const trimmed = value.trim().toLowerCase();

    if (!trimmed) {
      return 0;
    }

    if (trimmed === 'ground' || trimmed === 'g' || trimmed === 'gf' || trimmed === 'ground floor') {
      return 0;
    }

    const match = trimmed.match(/(-?\d+)/);
    if (!match) {
      return 0;
    }

    const parsed = parseInt(match[1], 10);
    if (Number.isNaN(parsed)) {
      return 0;
    }

    return Math.max(0, parsed);
  };

  const buildPropertyUpdate = (address: any, existing: any) => {
    const floorFromBuildingDetails = address?.buildingDetails?.floorNumber;
    const floorFromFormatted = address?.formatted?.floor;
    const combinedFloor = floorFromBuildingDetails ?? floorFromFormatted;
    const flatNumber = address?.buildingDetails?.apartmentNumber || address?.formatted?.flatNumber;

    return {
      ...existing,
      floors: parseFloorNumber(combinedFloor),
      hasLift: typeof address?.buildingDetails?.hasElevator === 'boolean'
        ? address.buildingDetails.hasElevator
        : existing?.hasLift ?? false,
      type: address?.buildingDetails?.type || existing?.type || 'house',
      flatNumber: flatNumber || existing?.flatNumber,
    };
  };

  // Price preview will handle distance calculation internally using haversine formula
  // No need for deprecated /api/address/distance endpoint

  return (
    <ResponsiveSection maxW="1200px" w="full">
    <Box w="full" pb={{ base: 6, md: 8 }}>
      <VStack spacing={{ base: 8, md: 10 }} w="full" align="stretch">
        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={{ base: 6, xl: 10 }} w="full">
          <LuxurySurfaceCard
            tone="success"
            borderWidth="1px"
            borderRadius="2xl"
            transition="all 0.25s ease"
            _hover={{ borderColor: 'green.300' }}
          >
            <Box p={{ base: 5, md: 8 }}>
              <VStack spacing={6} align="stretch">
                {/* Header with Enhanced Icon */}
                <HStack spacing={4} mb={2}>
                  <Box
                    w="64px"
                    h="64px"
                    borderRadius="2xl"
                    bg="green.900"
                    border="1px solid"
                    borderColor="green.400"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Box 
                      w="28px" 
                      h="28px" 
                      borderRadius="full" 
                      bg="green.400"
                    />
                  </Box>
                  <VStack spacing={1} align="flex-start" flex={1}>
                    <Text 
                      color="text.primary" 
                      fontWeight="800" 
                      fontSize="2xl"
                      letterSpacing="tight"
                      bgGradient="linear(to-r, green.300, emerald.400)"
                      bgClip="text"
                    >
                      Pickup Location
                    </Text>
                    <Text 
                      color="text.secondary" 
                      fontSize="md"
                      fontWeight="500"
                    >
                      Where should we collect from?
                    </Text>
                  </VStack>
                </HStack>

                {/* Address Input - Enhanced */}
                <Box>
                  <FormControl isInvalid={!!errors['step1.pickupAddress']}>
                    <UKAddressAutocomplete
                      id="pickup-address"
                      label="Pickup Address"
                      value={formData.step1.pickupAddress as any}
                      onChange={(address) => {
                        if (address) {
                          updateFormData('step1', {
                            pickupAddress: address as any,
                            pickupProperty: buildPropertyUpdate(address, currentPickupProperty) as any,
                          });
                        } else {
                          updateFormData('step1', {
                            pickupAddress: {
                              address: '',
                              city: '',
                              postcode: '',
                              coordinates: { lat: 0, lng: 0 },
                              houseNumber: '',
                              flatNumber: '',
                              formatted_address: '',
                              place_name: ''
                            } as any,
                            pickupProperty: {
                              ...currentPickupProperty,
                              floors: 0,
                              hasLift: false,
                              type: currentPickupProperty?.type || 'house',
                            } as any,
                          });
                        }
                      }}
                      placeholder="Enter pickup address, postcode, or location"
                      isRequired={true}
                    />
                    {errors['step1.pickupAddress'] && (
                      <FormErrorMessage color="red.300" mt={2}>
                        {errors['step1.pickupAddress']}
                      </FormErrorMessage>
                    )}
                  </FormControl>
                </Box>
              </VStack>
            </Box>
          </LuxurySurfaceCard>

          <LuxurySurfaceCard
            tone="info"
            borderWidth="1px"
            borderRadius="2xl"
            transition="all 0.25s ease"
            _hover={{ borderColor: 'purple.300' }}
          >
            <Box p={{ base: 5, md: 8 }}>
              <VStack spacing={5} align="stretch">
                {/* Enhanced Header */}
                <HStack spacing={4} mb={2}>
                  <Box
                    position="relative"
                    w="56px"
                    h="56px"
                    borderRadius="2xl"
                    bg="purple.900"
                    border="1px solid"
                    borderColor="purple.400"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Box 
                      w="20px" 
                      h="20px" 
                      borderRadius="full" 
                      bg="purple.400"
                    />
                  </Box>
                  <VStack spacing={1} align="flex-start" flex={1}>
                    <Text 
                      color="text.primary" 
                      fontWeight="800" 
                      fontSize="xl"
                      letterSpacing="tight"
                    >
                      Drop-off Location
                    </Text>
                    <Text 
                      color="text.secondary" 
                      fontSize="sm"
                      fontWeight="500"
                    >
                      Where should we deliver to?
                    </Text>
                  </VStack>
                </HStack>

                {/* Address Input - Enhanced */}
                <Box>
                  <FormControl isInvalid={!!errors['step1.dropoffAddress']}>
                    <UKAddressAutocomplete
                      id="dropoff-address"
                      label="Dropoff Address"
                      value={formData.step1.dropoffAddress as any}
                      onChange={(address) => {
                        if (address) {
                          updateFormData('step1', {
                            dropoffAddress: address as any,
                            dropoffProperty: buildPropertyUpdate(address, currentDropoffProperty) as any,
                          });
                        } else {
                          updateFormData('step1', {
                            dropoffAddress: {
                              address: '',
                              city: '',
                              postcode: '',
                              coordinates: { lat: 0, lng: 0 },
                              houseNumber: '',
                              flatNumber: '',
                              formatted_address: '',
                              place_name: ''
                            } as any,
                            dropoffProperty: {
                              ...currentDropoffProperty,
                              floors: 0,
                              hasLift: false,
                              type: currentDropoffProperty?.type || 'house',
                            } as any,
                          });
                        }
                      }}
                      placeholder="Enter delivery address, postcode, or location"
                      isRequired={true}
                    />
                    {errors['step1.dropoffAddress'] && (
                      <FormErrorMessage color="red.300" mt={2}>
                        {errors['step1.dropoffAddress']}
                      </FormErrorMessage>
                    )}
                  </FormControl>
                </Box>
              </VStack>
            </Box>
          </LuxurySurfaceCard>
        </SimpleGrid>

        <VStack spacing={4} align="stretch">
          <HStack justify="space-between" align="center">
            <Text color="text.primary" fontSize="lg" fontWeight="700">
              Live route preview
            </Text>
            <Text color="text.secondary" fontSize="sm">
              Visualise your pickup and drop-off before continuing
            </Text>
          </HStack>
          <RouteMapPreview pickup={pickupLocation} dropoff={dropoffLocation} />
        </VStack>

        {/* Collection Source & Marketplace Options */}
        <MarketplacePickupOptions
          formData={formData}
          updateFormData={updateFormData}
        />

        {/* Multi-Leg Segment Manager */}
        {canProceed && addReturnSegment && addAdditionalSegment && updateSegment && removeSegment && validateSegments && (
          <SegmentManager
            formData={formData}
            segments={(formData.step1.segments || []) as BookingSegment[]}
            onAddReturnSegment={addReturnSegment}
            onAddAdditionalSegment={addAdditionalSegment}
            onUpdateSegment={updateSegment}
            onRemoveSegment={removeSegment}
            validateSegments={validateSegments}
          />
        )}
      </VStack>

      {/* Continue Button - Always visible when addresses are complete */}
      {onNext && (
        <Button
          onClick={onNext}
          isDisabled={!canProceed || isTransitioning}
          isLoading={isTransitioning}
          loadingText="Processing..."
          spinner={<Spinner size="sm" color="white" thickness="2px" speed="0.65s" />}
          bg={canProceed ? 'interactive.primary' : 'bg.surface.elevated'}
          color="white"
          size="lg"
          w="full"
          mt={6}
          py={7}
          fontSize="md"
          fontWeight="600"
          borderRadius="xl"
          rightIcon={!isTransitioning ? <Icon as={FaArrowRight} /> : undefined}
          boxShadow={canProceed ? 'lg' : 'none'}
          transition="all 0.3s"
          _hover={canProceed && !isTransitioning ? {
            bg: 'interactive.active',
            transform: "translateY(-2px)",
            boxShadow: 'xl',
          } : {}}
          _active={canProceed && !isTransitioning ? {
            transform: "translateY(0)",
          } : {}}
          _disabled={{
            opacity: 0.5,
            cursor: 'not-allowed',
            transform: 'none',
          }}
        >
          {isTransitioning ? '' : canProceed ? 'Continue to Items & Time' : 'Please Enter Both Addresses'}
        </Button>
      )}
    </Box>
    </ResponsiveSection>
  );
}



