'use client';

/**
 * Step 1: Pickup and Drop-off Addresses
 * Luxury Booking Design with OKLCH Colors & Animations
 */

import React, { useMemo, useRef, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  FormControl,
  FormErrorMessage,
  Card,
  CardBody,
  Icon,
  Divider,
  Spinner,
} from '@chakra-ui/react';
import {
  FaArrowRight,
  FaArrowLeft,
  FaMapMarkerAlt,
} from 'react-icons/fa';
import { UKAddressAutocomplete } from '@/components/address/UKAddressAutocomplete';
import type { FormData } from '../hooks/useBookingForm';


interface AddressesStepProps {
  formData: FormData;
  updateFormData: (step: keyof FormData, data: Partial<FormData[keyof FormData]>) => void;
  errors: Record<string, string>;
  onNext?: () => void;
  onBack?: () => void;
}

export default function AddressesStep({
  formData,
  updateFormData,
  errors,
  onNext,
  onBack,
}: AddressesStepProps) {
  // Card border radius - use responsive values instead of useBreakpointValue
  const cardBorderRadius = { base: '2xl', md: '3xl' };

  // Validate if can proceed
  const canProceed = formData.step1.pickupAddress && formData.step1.dropoffAddress;

  const currentPickupProperty = useMemo(() => formData.step1.pickupProperty ?? {}, [formData.step1.pickupProperty]);
  const currentDropoffProperty = useMemo(() => formData.step1.dropoffProperty ?? {}, [formData.step1.dropoffProperty]);

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

  return (
    <Box w="full" className="animate-fade-in">
      <VStack spacing={6} w="full" align="stretch">
        {/* Luxury Header with Gold Gradient */}
        <Box className="animate-slide-up delay-100">
          <HStack spacing={3} mb={2}>
            <Icon as={FaMapMarkerAlt} color="var(--primary)" boxSize={6} />
            <Heading 
              size="lg" 
              className="heading-luxury"
              fontWeight="700"
            >
              Where are we moving?
            </Heading>
          </HStack>
          <Text color="var(--text-secondary)" fontSize="md">
            Enter your pickup and delivery addresses to get started
          </Text>
        </Box>

        {/* Glass Morphism Card with Animations */}
        <Card
          className="glass-dark card-luxury animate-scale-in delay-200 hover-scale"
          bg="var(--card)"
          border="1px solid"
          borderColor="var(--border)"
          borderRadius="2xl"
          overflow="visible"
          backdropFilter="blur(16px)"
          transition="all 0.3s ease"
          _hover={{
            borderColor: 'var(--primary)',
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.1)',
          }}
        >
          <CardBody p={{ base: 6, md: 8 }}>
            <VStack spacing={8} align="stretch">
              {/* Pickup Address */}
              <Box
                position="relative"
                className="animate-slide-up delay-300"
                sx={{
                  overflow: 'visible !important',
                  zIndex: 2
                }}
              >
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
                    placeholder="Where are we picking up from?"
                    isRequired={true}
                  />
                  {errors['step1.pickupAddress'] && (
                    <FormErrorMessage color="red.300" mt={2}>
                      {errors['step1.pickupAddress']}
                    </FormErrorMessage>
                  )}
                </FormControl>
              </Box>

              <Divider className="divider-luxury" borderColor="var(--border)" />

              {/* Dropoff Address */}
              <Box
                position="relative"
                className="animate-slide-up delay-400"
                sx={{
                  overflow: 'visible !important',
                  zIndex: 1
                }}
              >
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
                    placeholder="Where are we delivering to?"
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
          </CardBody>
        </Card>
      </VStack>

      {/* Luxury Continue Button with Gold Gradient */}
      {onNext && (
        <Button
          onClick={onNext}
          isDisabled={!canProceed}
          className="btn-luxury animate-slide-up delay-500"
          bg="linear-gradient(135deg, var(--primary) 0%, oklch(0.70 0.18 75) 100%)"
          color="var(--background)"
          size="lg"
          w="full"
          mt={6}
          py={7}
          fontSize="md"
          fontWeight="700"
          borderRadius="xl"
          rightIcon={<Icon as={FaArrowRight} />}
          _hover={{
            transform: 'translateY(-2px) scale(1.02)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), 0 0 20px var(--primary)',
          }}
          _active={{
            transform: 'translateY(0) scale(1)',
          }}
          _disabled={{
            opacity: 0.5,
            cursor: 'not-allowed',
            transform: 'none',
          }}
        >
          {canProceed ? 'Continue to Items & Time' : 'Enter Both Addresses'}
        </Button>
      )}
    </Box>
  );
}
