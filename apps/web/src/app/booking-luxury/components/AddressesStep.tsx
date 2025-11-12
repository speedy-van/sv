'use client';

/**
 * Step 1: Pickup and Drop-off Addresses
 * Luxury Booking Design
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
  useBreakpointValue,
  Divider,
  Spinner,
} from '@chakra-ui/react';
import {
  FaArrowRight,
  FaArrowLeft,
} from 'react-icons/fa';
import { UKAddressAutocomplete } from '@/components/address/UKAddressAutocomplete';
import type { FormData } from '../hooks/useBookingForm';

const findScrollableParent = (node: HTMLElement | null): HTMLElement | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  let current: HTMLElement | null = node;
  while (current) {
    const style = window.getComputedStyle(current);
    const overflowY = style.overflowY;
    const overflowX = style.overflowX;
    const canScrollY = (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight;
    const canScrollX = (overflowX === 'auto' || overflowX === 'scroll') && current.scrollWidth > current.clientWidth;

    if (canScrollY || canScrollX) {
      return current;
    }

    current = current.parentElement;
  }

  const scrollingElement = document.scrollingElement || document.documentElement;
  return scrollingElement as HTMLElement;
};

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
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  // Card border radius
  const cardBorderRadius = isMobile ? '2xl' : '3xl';

  // Validate if can proceed
  const canProceed = formData.step1.pickupAddress && formData.step1.dropoffAddress;

  const currentPickupProperty = useMemo(() => formData.step1.pickupProperty ?? {}, [formData.step1.pickupProperty]);
  const currentDropoffProperty = useMemo(() => formData.step1.dropoffProperty ?? {}, [formData.step1.dropoffProperty]);

  const rootRef = useRef<HTMLDivElement | null>(null);

  const preserveScrollDuring = useCallback((operation: () => void) => {
    if (typeof window === 'undefined') {
      operation();
      return;
    }

    const container = findScrollableParent(rootRef.current);
    const previousTop = container ? container.scrollTop : window.scrollY;
    const previousLeft = container ? container.scrollLeft : window.scrollX;

    operation();

    const restoreScroll = () => {
      if (container) {
        container.scrollTo({ top: previousTop, left: previousLeft, behavior: 'auto' });
      } else {
        window.scrollTo({ top: previousTop, left: previousLeft });
      }
    };

    requestAnimationFrame(() => requestAnimationFrame(restoreScroll));
  }, []);

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
    <Box w="full" ref={rootRef}>
      <VStack spacing={6} w="full" align="stretch">
        {/* Single Clean Card - Modern Design like Uber/Airbnb */}
        <Card
          bg="rgba(26, 26, 26, 0.6)"
          border="1px solid"
          borderColor="rgba(59, 130, 246, 0.2)"
          borderRadius="2xl"
          overflow="visible"
          backdropFilter="blur(10px)"
        >
          <CardBody p={{ base: 6, md: 8 }}>
            <VStack spacing={8} align="stretch">
              {/* Pickup Address */}
              <Box
                position="relative"
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
                      preserveScrollDuring(() => {
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
                      });
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

              <Divider borderColor="rgba(59, 130, 246, 0.2)" />

              {/* Dropoff Address */}
              <Box
                position="relative"
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
                      preserveScrollDuring(() => {
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
                      });
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

      {/* Continue Button - Always visible when addresses are complete */}
      {onNext && (
        <Button
          onClick={onNext}
          isDisabled={!canProceed}
          bg="blue.500"
          color="white"
          size="lg"
          w="full"
          mt={6}
          py={7}
          fontSize="md"
          fontWeight="600"
          borderRadius="xl"
          _hover={{
            bg: 'blue.600',
          }}
          _disabled={{
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
        >
          {canProceed ? 'Continue to Items & Time' : 'Enter Both Addresses'}
        </Button>
      )}
    </Box>
  );
}



