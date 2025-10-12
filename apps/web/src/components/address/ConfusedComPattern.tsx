/**
 * Confused.com Pattern Implementation
 * Step-by-step address selection: Postcode → Address → Confirmation
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Badge,
  Divider,
  Card,
  CardBody,
  useToast,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { FaArrowLeft, FaArrowRight, FaMapMarkerAlt, FaCheck, FaInfoCircle } from 'react-icons/fa';

import type { 
  ConfusedComPatternProps, 
  AddressSuggestion, 
  DistanceResult,
  PostcodeValidationResult 
} from '@/types/dual-provider-address';

import { PostcodeValidator } from '@/lib/postcode-validator';
import { DualProviderAddressInput } from './DualProviderAddressInput';

interface StepData {
  postcode: string;
  postcodeValidation: PostcodeValidationResult | null;
  pickupAddress: AddressSuggestion | null;
  dropoffAddress: AddressSuggestion | null;
  distance: DistanceResult | null;
}

export const ConfusedComPattern: React.FC<ConfusedComPatternProps> = ({
  step,
  onStepComplete,
  onStepChange,
  pickupAddress,
  dropoffAddress,
  distance,
}) => {
  const [currentStep, setCurrentStep] = useState<'postcode' | 'address' | 'confirmation'>(step);
  const [stepData, setStepData] = useState<StepData>({
    postcode: '',
    postcodeValidation: null,
    pickupAddress: pickupAddress || null,
    dropoffAddress: dropoffAddress || null,
    distance: distance || null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Update current step when prop changes
  useEffect(() => {
    setCurrentStep(step);
  }, [step]);

  const handlePostcodeSubmit = async (postcode: string) => {
    const validation = PostcodeValidator.validateUKPostcode(postcode);
    setStepData(prev => ({ ...prev, postcode, postcodeValidation: validation }));

    if (validation.isValid) {
      onStepComplete('postcode', { postcode, validation });
      setCurrentStep('address');
      onStepChange('address');
    } else {
      toast({
        title: 'Invalid postcode',
        description: 'Please enter a valid UK postcode',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleAddressSelect = async (address: AddressSuggestion, type: 'pickup' | 'dropoff') => {
    const newStepData = {
      ...stepData,
      [type === 'pickup' ? 'pickupAddress' : 'dropoffAddress']: address,
    };
    setStepData(newStepData);

    // If both addresses are selected, calculate distance
    if (newStepData.pickupAddress && newStepData.dropoffAddress) {
      setIsLoading(true);
      try {
        const distanceResult = await calculateDistance(
          newStepData.pickupAddress.coordinates,
          newStepData.dropoffAddress.coordinates
        );
        
        newStepData.distance = distanceResult;
        setStepData(newStepData);
        
        onStepComplete('address', newStepData);
        setCurrentStep('confirmation');
        onStepChange('confirmation');
      } catch (error) {
        toast({
          title: 'Distance calculation failed',
          description: 'Unable to calculate distance between addresses',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      onStepComplete('address', newStepData);
    }
  };

  const handleConfirmation = () => {
    onStepComplete('confirmation', stepData);
  };

  const goBack = () => {
    if (currentStep === 'address') {
      setCurrentStep('postcode');
      onStepChange('postcode');
    } else if (currentStep === 'confirmation') {
      setCurrentStep('address');
      onStepChange('address');
    }
  };

  const calculateDistance = async (pickup: { lat: number; lng: number }, dropoff: { lat: number; lng: number }) => {
    const response = await fetch('/api/address/distance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to calculate distance');
    }

    const result = await response.json();
    return result.data;
  };

  const getProgressPercentage = () => {
    switch (currentStep) {
      case 'postcode': return 33;
      case 'address': return 66;
      case 'confirmation': return 100;
      default: return 0;
    }
  };

  const formatDistance = (distance: DistanceResult) => {
    const distanceKm = (distance.distance / 1000).toFixed(1);
    const durationMinutes = Math.round(distance.duration / 60);
    
    return {
      distance: `${distanceKm} km`,
      duration: `${durationMinutes} min`,
      provider: distance.provider,
    };
  };

  return (
    <Box w="full" maxW="600px" mx="auto">
      {/* Progress indicator */}
      <Box mb={6}>
        <HStack justify="space-between" mb={2}>
          <Text fontSize="sm" color="gray.600">
            Step {currentStep === 'postcode' ? '1' : currentStep === 'address' ? '2' : '3'} of 3
          </Text>
          <Text fontSize="sm" color="gray.600">
            {getProgressPercentage()}% Complete
          </Text>
        </HStack>
        <Progress 
          value={getProgressPercentage()} 
          colorScheme="blue" 
          size="sm" 
          borderRadius="full"
          bg="gray.200"
        />
      </Box>

      {/* Step content */}
      <Card>
        <CardBody>
          {currentStep === 'postcode' && (
            <VStack spacing={6} align="stretch">
              <Box textAlign="center">
                <Icon as={FaMapMarkerAlt} boxSize={8} color="blue.500" mb={3} />
                <Text fontSize="lg" fontWeight="semibold" mb={2}>
                  Enter your postcode
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Start by entering your pickup postcode for accurate address suggestions
                </Text>
              </Box>

              <DualProviderAddressInput
                id="postcode-input"
                placeholder="e.g., SW1A 1AA"
                onChange={(suggestion) => {
                  if (suggestion) {
                    handlePostcodeSubmit(suggestion.components.postcode || suggestion.mainText);
                  }
                }}
                onValidation={(isValid) => {
                  // Handle validation feedback
                }}
                error={stepData.postcodeValidation && !stepData.postcodeValidation.isValid ? 'Invalid postcode format' : undefined}
              />

              {stepData.postcodeValidation?.suggestions && (
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="sm">Postcode suggestions:</AlertTitle>
                    <AlertDescription fontSize="sm">
                      {stepData.postcodeValidation.suggestions.slice(0, 3).join(', ')}
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          )}

          {currentStep === 'address' && (
            <VStack spacing={6} align="stretch">
              <Box textAlign="center">
                <Icon as={FaMapMarkerAlt} boxSize={8} color="blue.500" mb={3} />
                <Text fontSize="lg" fontWeight="semibold" mb={2}>
                  Select your addresses
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Choose your pickup and drop-off addresses
                </Text>
              </Box>

              {stepData.postcode && (
                <Box p={3} bg="blue.50" borderRadius="lg" borderLeft="4px solid" borderLeftColor="blue.400">
                  <HStack spacing={2}>
                    <Icon as={FaCheck} color="blue.500" boxSize={4} />
                    <Text fontSize="sm" fontWeight="medium" color="blue.700">
                      Searching addresses in: {stepData.postcode}
                    </Text>
                  </HStack>
                </Box>
              )}

              {/* Pickup Address */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={3} color="green.600">
                  🚚 Pickup Address
                </Text>
                <DualProviderAddressInput
                  id="pickup-address"
                  placeholder="Select pickup address"
                  onChange={(suggestion) => {
                    if (suggestion) {
                      handleAddressSelect(suggestion, 'pickup');
                    }
                  }}
                  onValidation={() => {}}
                  context={{ preferredProvider: stepData.pickupAddress?.provider }}
                />
              </Box>

              {/* Dropoff Address */}
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={3} color="blue.600">
                  📍 Drop-off Address
                </Text>
                <DualProviderAddressInput
                  id="dropoff-address"
                  placeholder="Select drop-off address"
                  onChange={(suggestion) => {
                    if (suggestion) {
                      handleAddressSelect(suggestion, 'dropoff');
                    }
                  }}
                  onValidation={() => {}}
                  context={{
                    pickupAddress: stepData.pickupAddress || undefined,
                    preferredProvider: stepData.dropoffAddress?.provider || undefined
                  }}
                />
              </Box>

              {isLoading && (
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  <AlertTitle fontSize="sm">Calculating distance...</AlertTitle>
                </Alert>
              )}

              {/* Navigation */}
              <HStack justify="space-between" pt={4}>
                <Button
                  leftIcon={<FaArrowLeft />}
                  variant="outline"
                  onClick={goBack}
                  size="sm"
                >
                  Back
                </Button>
              </HStack>
            </VStack>
          )}

          {currentStep === 'confirmation' && (
            <VStack spacing={6} align="stretch">
              <Box textAlign="center">
                <Icon as={FaCheck} boxSize={8} color="green.500" mb={3} />
                <Text fontSize="lg" fontWeight="semibold" mb={2}>
                  Confirm your addresses
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Review your selected addresses and distance
                </Text>
              </Box>

              {/* Address summary */}
              <VStack spacing={4} align="stretch">
                {/* Pickup Address */}
                <Card variant="outline" borderLeft="4px solid" borderLeftColor="green.400">
                  <CardBody p={4}>
                    <VStack spacing={2} align="start">
                      <HStack spacing={2}>
                        <Badge colorScheme="green" fontSize="xs">PICKUP</Badge>
                        <Badge colorScheme={stepData.pickupAddress?.provider === 'google' ? 'blue' : 'green'} fontSize="xs">
                          {stepData.pickupAddress?.provider === 'google' ? 'Google' : 'Mapbox'}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" fontWeight="medium">
                        {stepData.pickupAddress?.mainText}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {stepData.pickupAddress?.secondaryText}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Distance info */}
                {stepData.distance && (
                  <Card variant="outline" borderLeft="4px solid" borderLeftColor="blue.400">
                    <CardBody p={4}>
                      <VStack spacing={2} align="start">
                        <HStack spacing={2}>
                          <Badge colorScheme="blue" fontSize="xs">DISTANCE</Badge>
                          <Badge colorScheme={stepData.distance.provider === 'google' ? 'blue' : 'green'} fontSize="xs">
                            {stepData.distance.provider === 'google' ? 'Google' : 'Mapbox'}
                          </Badge>
                        </HStack>
                        <HStack spacing={4}>
                          <Text fontSize="sm" fontWeight="medium">
                            📏 {formatDistance(stepData.distance).distance}
                          </Text>
                          <Text fontSize="sm" fontWeight="medium">
                            ⏱️ {formatDistance(stepData.distance).duration}
                          </Text>
                        </HStack>
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                {/* Dropoff Address */}
                <Card variant="outline" borderLeft="4px solid" borderLeftColor="blue.400">
                  <CardBody p={4}>
                    <VStack spacing={2} align="start">
                      <HStack spacing={2}>
                        <Badge colorScheme="blue" fontSize="xs">DROP-OFF</Badge>
                        <Badge colorScheme={stepData.dropoffAddress?.provider === 'google' ? 'blue' : 'green'} fontSize="xs">
                          {stepData.dropoffAddress?.provider === 'google' ? 'Google' : 'Mapbox'}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" fontWeight="medium">
                        {stepData.dropoffAddress?.mainText}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {stepData.dropoffAddress?.secondaryText}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>

              {/* Navigation */}
              <HStack justify="space-between" pt={4}>
                <Button
                  leftIcon={<FaArrowLeft />}
                  variant="outline"
                  onClick={goBack}
                  size="sm"
                >
                  Back
                </Button>
                <Button
                  rightIcon={<FaCheck />}
                  colorScheme="green"
                  onClick={handleConfirmation}
                  size="sm"
                >
                  Confirm & Continue
                </Button>
              </HStack>
            </VStack>
          )}
        </CardBody>
      </Card>
    </Box>
  );
};

export default ConfusedComPattern;
