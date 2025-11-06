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
        {/* Pickup Address Card - Luxury Design */}
        <Card
          bg="linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.05) 100%)"
          border="2px solid"
          borderColor="rgba(16, 185, 129, 0.3)"
          borderRadius={cardBorderRadius}
          position="relative"
          overflow="visible"
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          _hover={{
            borderColor: "rgba(16, 185, 129, 0.5)",
            boxShadow: "0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            transform: isMobile ? "translateY(-1px)" : "translateY(-2px)",
          }}
          sx={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <CardBody p={{ base: 6, md: 8 }}>
            <VStack spacing={6} align="stretch">
              <Box
                position="relative"
                sx={{
                  // Prevent clipping of autocomplete dropdown
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
                    placeholder="Start typing your pickup address..."
                    helperText="Enter your full pickup address (street, postcode, etc.)"
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
          </CardBody>
        </Card>

        {/* Dropoff Address Card - Luxury Design */}
        <Card
          bg="linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.05) 100%)"
          border="2px solid"
          borderColor="rgba(59, 130, 246, 0.3)"
          borderRadius={cardBorderRadius}
          position="relative"
          overflow="visible"
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          _hover={{
            borderColor: "rgba(59, 130, 246, 0.5)",
            boxShadow: "0 8px 32px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            transform: isMobile ? "translateY(-1px)" : "translateY(-2px)",
          }}
          sx={{
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <CardBody p={{ base: 6, md: 8 }}>
            <VStack spacing={6} align="stretch">
              <Box
                position="relative"
                sx={{
                  // Prevent clipping of autocomplete dropdown
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
                    placeholder="Start typing your dropoff address..."
                    helperText="Enter your full dropoff address (street, postcode, etc.)"
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

      {/* Navigation Buttons */}
      <HStack
        spacing={4}
        mt={8}
        justify="space-between"
        w="full"
        flexDirection={{ base: 'column-reverse', md: 'row' }}
      >
        {onBack && (
          <Button
            leftIcon={<Icon as={FaArrowLeft} />}
            onClick={onBack}
            variant="outline"
            borderColor="rgba(255, 255, 255, 0.2)"
            color="white"
            size="lg"
            w={{ base: 'full', md: 'auto' }}
            minW={{ md: '200px' }}
            _hover={{
              bg: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            Back
          </Button>
        )}

        {onNext && (
          <Button
            rightIcon={<Icon as={FaArrowRight} />}
            onClick={onNext}
            isDisabled={!canProceed}
            bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            color="white"
            size="lg"
            w={{ base: 'full', md: 'auto' }}
            minW={{ md: '200px' }}
            _hover={{
              bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
            }}
            _disabled={{
              opacity: 0.4,
              cursor: 'not-allowed',
              _hover: {
                transform: 'none',
                boxShadow: 'none',
              },
            }}
            transition="all 0.3s"
          >
            Next Step
          </Button>
        )}
      </HStack>
    </Box>
  );
}



