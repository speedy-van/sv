'use client';

/**
 * Step 1: Pickup and Drop-off Addresses
 * Luxury Booking Design
 */

import React, { useMemo } from 'react';
import {
  Box,
  VStack,
  SimpleGrid,
  HStack,
  Text,
  Button,
  FormControl,
  FormErrorMessage,
  Card,
  CardBody,
  Icon,
} from '@chakra-ui/react';
import {
  FaArrowRight,
} from 'react-icons/fa';
import { UKAddressAutocomplete } from '@/components/address/UKAddressAutocomplete';
import type { FormData } from '../hooks/useBookingForm';


interface AddressesStepProps {
  formData: FormData;
  updateFormData: (step: keyof FormData, data: Partial<FormData[keyof FormData]>) => void;
  errors: Record<string, string>;
  onNext?: () => void;
}

export default function AddressesStep({
  formData,
  updateFormData,
  errors,
  onNext,
}: AddressesStepProps) {
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
    <Box w="full" pb={8}>
      <VStack spacing={10} w="full" align="stretch">
        <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={{ base: 8, xl: 10 }} w="full">
          <Card
            bg="linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)"
            border="2px solid"
            borderColor="rgba(34, 197, 94, 0.4)"
            borderRadius="3xl"
            backdropFilter="blur(24px)"
            boxShadow="0 25px 60px rgba(0,0,0,0.6), 0 0 80px rgba(34, 197, 94, 0.15)"
            position="relative"
            overflow="visible"
            transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{
              borderColor: "rgba(34, 197, 94, 0.6)",
              boxShadow: "0 30px 75px rgba(0,0,0,0.7), 0 0 100px rgba(34, 197, 94, 0.25)",
              transform: "translateY(-4px)",
            }}
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              bgGradient: 'linear(to-r, green.400, emerald.500, teal.400)',
              opacity: 0.8,
            }}
          >
            <CardBody p={{ base: 8, md: 10 }}>
              <VStack spacing={6} align="stretch">
                {/* Header with Enhanced Icon */}
                <HStack spacing={4} mb={2}>
                  <Box
                    w={{ base: "56px", md: "64px" }}
                    h={{ base: "56px", md: "64px" }}
                    borderRadius="2xl"
                    bg="linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2))"
                    border="2px solid"
                    borderColor="rgba(34, 197, 94, 0.4)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    position="relative"
                    boxShadow="0 8px 32px rgba(34, 197, 94, 0.3), inset 0 0 20px rgba(34, 197, 94, 0.1)"
                    _before={{
                      content: '""',
                      position: 'absolute',
                      inset: '-3px',
                      borderRadius: '2xl',
                      padding: '3px',
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.5), rgba(16, 185, 129, 0.5))',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMaskComposite: 'xor',
                      maskComposite: 'exclude',
                    }}
                  >
                    <Box 
                      w={{ base: "24px", md: "28px" }} 
                      h={{ base: "24px", md: "28px" }} 
                      borderRadius="full" 
                      bg="linear-gradient(135deg, #22c55e, #10b981)"
                      boxShadow="0 4px 16px rgba(34, 197, 94, 0.6)"
                    />
                  </Box>
                  <VStack spacing={1} align="flex-start" flex={1}>
                    <Text 
                      color="white" 
                      fontWeight="800" 
                      fontSize={{ base: "xl", md: "2xl" }}
                      letterSpacing="tight"
                      bgGradient="linear(to-r, green.300, emerald.400)"
                      bgClip="text"
                    >
                      Pickup Location
                    </Text>
                    <Text 
                      color="whiteAlpha.700" 
                      fontSize={{ base: "sm", md: "md" }}
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
            </CardBody>
          </Card>

          <Card
            bg="rgba(15, 23, 42, 0.95)"
            border="2px solid"
            borderColor="rgba(236, 72, 153, 0.4)"
            borderRadius="3xl"
            backdropFilter="blur(20px)"
            boxShadow="0 25px 60px rgba(236, 72, 153, 0.25)"
            transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
            position="relative"
            overflow="visible"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              bgGradient: 'linear(to-r, pink.400, purple.400, blue.400)',
              opacity: 0.8,
            }}
            _hover={{
              borderColor: "rgba(236, 72, 153, 0.6)",
              boxShadow: "0 30px 70px rgba(236, 72, 153, 0.35)",
              transform: "translateY(-2px)",
            }}
          >
            <CardBody p={{ base: 6, md: 8 }}>
              <VStack spacing={5} align="stretch">
                {/* Enhanced Header */}
                <HStack spacing={4} mb={2}>
                  <Box
                    position="relative"
                    w="56px"
                    h="56px"
                    borderRadius="2xl"
                    bg="rgba(236, 72, 153, 0.15)"
                    border="2px solid rgba(236, 72, 153, 0.4)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    _before={{
                      content: '""',
                      position: 'absolute',
                      inset: '-3px',
                      borderRadius: '2xl',
                      padding: '2px',
                      background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.5), rgba(168, 85, 247, 0.5))',
                      mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                      maskComposite: 'exclude',
                      WebkitMaskComposite: 'xor',
                    }}
                    _after={{
                      content: '""',
                      position: 'absolute',
                      inset: '-8px',
                      borderRadius: '2xl',
                      background: 'radial-gradient(circle, rgba(236, 72, 153, 0.2) 0%, transparent 70%)',
                      animation: 'pulse 2s ease-in-out infinite',
                    }}
                  >
                    <Box 
                      w="20px" 
                      h="20px" 
                      borderRadius="full" 
                      bg="pink.400"
                      boxShadow="0 0 20px rgba(236, 72, 153, 0.6)"
                    />
                  </Box>
                  <VStack spacing={1} align="flex-start" flex={1}>
                    <Text 
                      color="white" 
                      fontWeight="800" 
                      fontSize="xl"
                      letterSpacing="tight"
                    >
                      Drop-off Location
                    </Text>
                    <Text 
                      color="whiteAlpha.600" 
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
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>

      {/* Continue Button - Always visible when addresses are complete */}
      {onNext && (
        <Button
          onClick={onNext}
          isDisabled={!canProceed}
          bgGradient={canProceed ? "linear(to-r, blue.500, purple.500)" : "linear(to-r, gray.600, gray.700)"}
          color="white"
          size="lg"
          w="full"
          mt={6}
          py={7}
          fontSize="md"
          fontWeight="600"
          borderRadius="xl"
          rightIcon={<Icon as={FaArrowRight} />}
          boxShadow={canProceed ? "0 15px 35px rgba(59, 130, 246, 0.4)" : "none"}
          transition="all 0.3s"
          _hover={canProceed ? {
            bgGradient: "linear(to-r, blue.600, purple.600)",
            transform: "translateY(-2px)",
            boxShadow: "0 20px 45px rgba(59, 130, 246, 0.5)",
          } : {}}
          _active={canProceed ? {
            transform: "translateY(0)",
          } : {}}
          _disabled={{
            opacity: 0.5,
            cursor: 'not-allowed',
            transform: 'none',
          }}
        >
          {canProceed ? 'Continue to Items & Time' : 'Please Enter Both Addresses'}
        </Button>
      )}
    </Box>
  );
}



