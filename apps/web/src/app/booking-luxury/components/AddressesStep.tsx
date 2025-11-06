'use client';

/**
 * Step 1: Pickup and Drop-off Addresses
 * Luxury Booking Design
 */

import React, { useState } from 'react';
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

  return (
    <Box w="full">
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
                      if (address) {
                        updateFormData('step1', {
                          pickupAddress: address as any
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
                          } as any
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
                      if (address) {
                        updateFormData('step1', {
                          dropoffAddress: address as any
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
                          } as any
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



