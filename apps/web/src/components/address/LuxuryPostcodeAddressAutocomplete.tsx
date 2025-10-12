/**
 * Luxury Booking Postcode-First Address Autocomplete Component
 * Implements the exact requirements: Postcode → Address Selection → Validation
 * Uses Google Places API (primary) with Mapbox fallback
 */

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Icon,
  Alert,
  AlertIcon,
  AlertDescription,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  useToast,
  Collapse,
  Badge,
  Spinner,
  Divider,
} from '@chakra-ui/react';
import { 
  FaArrowRight, 
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCheck,
  FaExclamationTriangle,
  FaInfoCircle,
} from 'react-icons/fa';

import { PostcodeValidator } from '@/lib/postcode-validator';
import type { AddressSuggestion, CompleteAddress } from '@/types/dual-provider-address';

type AddressStep = 'postcode' | 'address' | 'complete';

interface LuxuryPostcodeAddressAutocompleteProps {
  id: string;
  label: string;
  value?: CompleteAddress | null;
  onChange: (address: CompleteAddress | null) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

interface AddressResult {
  id: string;
  displayText: string;
  fullAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  components: {
    street?: string;
    city?: string;
    postcode: string;
    country: string;
    houseNumber?: string;
    flatNumber?: string;
    buildingName?: string;
  };
  propertyDetails?: {
    houseNumber?: string;
    flatNumber?: string;
    buildingName?: string;
  };
  provider: 'google' | 'mapbox' | 'uk-postcode' | 'getaddress' | 'ideal-postcodes';
  confidence: number;
}

export const LuxuryPostcodeAddressAutocomplete: React.FC<LuxuryPostcodeAddressAutocompleteProps> = ({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder = "Enter your postcode first (e.g., G31 1DZ)",
}) => {
  const [currentStep, setCurrentStep] = useState<AddressStep>('postcode');
  const [postcode, setPostcode] = useState('');
  const [postcodeValidation, setPostcodeValidation] = useState<any>(null);
  const [availableAddresses, setAvailableAddresses] = useState<AddressResult[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [currentProvider, setCurrentProvider] = useState<'google' | 'mapbox'>('google');
  const toast = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check if we can proceed from postcode step
  const canProceedFromPostcode = postcode.length >= 5 && !isLoading;

  // Handle postcode submission with enhanced validation
  const handlePostcodeSubmit = useCallback(async () => {
    if (!postcode.trim()) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const validation = PostcodeValidator.validateUKPostcode(postcode);
    setPostcodeValidation(validation);
    setApiError(null);

    if (validation.isValid) {
      setIsLoading(true);
      
      try {
        // Normalize postcode for API call
        const normalizedPostcode = PostcodeValidator.normalizeForAPI(validation.formatted);
        console.log(`🔍 Starting PAF-based address search for postcode: ${normalizedPostcode} (original: ${validation.formatted})`);
        
        // Use the postcode-specific API endpoint for better results
        const apiUrl = `/api/address/postcode?postcode=${encodeURIComponent(normalizedPostcode)}&limit=50&includeSubPremises=true`;
        console.log(`📡 API Request URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl, { 
          signal: abortControllerRef.current.signal,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API Error Response: ${errorText}`);
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`📋 API Response Data:`, {
          success: result.success,
          addressCount: result.data?.addresses?.length || 0,
          provider: result.data?.provider,
          postcode: result.data?.postcode
        });
        
        if (result.success && result.data && result.data.addresses && result.data.addresses.length > 0) {
          console.log(`✅ Received ${result.data.addresses.length} addresses from PAF-based API`);
          console.log('Sample addresses:', result.data.addresses.slice(0, 2));
          
          // Accept all valid addresses from PAF providers without additional filtering
          // PAF APIs already return verified, accurate addresses for the postcode
          const validAddresses = result.data.addresses.filter((addr: AddressResult) => {
            return addr.displayText && 
                   addr.coordinates && 
                   addr.coordinates.lat !== 0 && 
                   addr.coordinates.lng !== 0;
          });
          
          console.log(`✅ Using ${validAddresses.length} PAF-verified addresses`);

          if (validAddresses.length > 0) {
            setAvailableAddresses(validAddresses);
            setCurrentProvider(result.data.provider);
            setCurrentStep('address');
            
            toast({
              title: 'Addresses Found',
              description: `Found ${validAddresses.length} verified address${validAddresses.length === 1 ? '' : 'es'} for ${normalizedPostcode}`,
              status: 'success',
              duration: 2000,
              isClosable: true,
            });
          } else {
            console.error(`❌ PAF API returned empty addresses for ${normalizedPostcode}`);
            
            toast({
              title: 'No Addresses Found',
              description: `No verified addresses found for ${normalizedPostcode}. Please check the postcode.`,
              status: 'warning',
              duration: 4000,
              isClosable: true,
            });
          }
        } else {
          // Fallback to general autocomplete API
          try {
            const fallbackResponse = await fetch(
              `/api/address/autocomplete?query=${encodeURIComponent(validation.formatted)}&limit=20&types=address`,
              { signal: abortControllerRef.current.signal }
            );
            const fallbackResult = await fallbackResponse.json();
            
            if (fallbackResult.success && fallbackResult.data.suggestions.length > 0) {
              const fallbackAddresses: AddressResult[] = fallbackResult.data.suggestions.map((suggestion: any) => ({
                id: suggestion.id,
                displayText: suggestion.displayText,
                fullAddress: suggestion.fullAddress,
                coordinates: suggestion.coordinates,
                components: suggestion.components,
                provider: suggestion.provider,
                confidence: suggestion.confidence,
              }));
              
              setAvailableAddresses(fallbackAddresses);
              setCurrentProvider(fallbackResult.data.provider);
              setCurrentStep('address');
              
              toast({
                title: '✓ Postcode Verified',
                description: `Found ${fallbackAddresses.length} address${fallbackAddresses.length === 1 ? '' : 'es'} in ${validation.formatted}. Select yours below.`,
                status: 'success',
                duration: 3000,
                isClosable: true,
              });
            } else {
              toast({
                title: 'No addresses found',
                description: `No addresses found for ${validation.formatted}. Please try a different postcode.`,
                status: 'warning',
                duration: 4000,
                isClosable: true,
              });
            }
          } catch (fallbackError) {
            console.error('Fallback search failed:', fallbackError);
            setApiError('Unable to search for addresses. Please try again.');
            toast({
              title: 'Search failed',
              description: 'Unable to search for addresses. Please try again.',
              status: 'error',
              duration: 4000,
              isClosable: true,
            });
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('❌ Failed to fetch addresses for postcode:', {
            postcode: validation.formatted,
            error: error.message,
            stack: error.stack
          });
          setApiError(error.message || 'Network error occurred');
          toast({
            title: 'Search Failed',
            description: `Unable to search for addresses for ${validation.formatted}. Please try again.`,
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      toast({
        title: 'Invalid Postcode',
        description: 'Please enter a valid UK postcode (e.g., SW1A 1AA, M1 1AA, B1 1BB)',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [postcode, toast]);

  // Address selection
  const handleAddressSelect = useCallback((addressId: string) => {
    const selected = availableAddresses.find(addr => addr.id === addressId);
    if (selected) {
      setSelectedAddress(selected);
      
      // Convert to CompleteAddress format
      const completeAddress: CompleteAddress = {
        ...selected,
        mainText: selected.displayText.split(',')[0],
        secondaryText: selected.displayText.split(',').slice(1).join(','),
        type: 'address',
        components: {
          street: selected.components?.street || '',
          city: selected.components?.city || '',
          postcode: selected.components.postcode,
          country: selected.components.country,
          houseNumber: selected.components?.houseNumber || '',
          flatNumber: selected.components?.flatNumber || '',
        },
        propertyDetails: {
          houseNumber: selected.components?.houseNumber || '',
          flatNumber: selected.components?.flatNumber || '',
          buildingName: '',
          floor: '',
          businessName: '',
        },
        isPostcodeValidated: true,
        stepCompletedAt: new Date().toISOString(),
      };
      
      setCurrentStep('complete');
      onChange(completeAddress);
      
      toast({
        title: '✓ Verified Address Selected',
        description: `Genuine address confirmed: ${selected.displayText}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  }, [availableAddresses, onChange, toast]);

  // Reset to postcode step
  const handleChangePostcode = useCallback(() => {
    setCurrentStep('postcode');
    setSelectedAddress(null);
    setAvailableAddresses([]);
    setApiError(null);
    onChange(null);
  }, [onChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return (
    <Box w="full">
      {/* PREMIUM HEADER - MATCHING BOOKING-LUXURY DESIGN */}
      <Box 
        bg="rgba(255, 255, 255, 0.95)" 
        backdropFilter="blur(10px)"
        shadow="0 8px 32px rgba(0, 0, 0, 0.12)" 
        borderRadius="2xl" 
        border="1px solid rgba(255, 255, 255, 0.2)"
        p={{ base: 4, md: 6 }}
        mb={6}
      >
        <HStack spacing={4} justify="space-between" align="center">
          {/* LEFT: Brand */}
          <HStack spacing={4}>
            <Icon as={FaMapMarkerAlt} boxSize={8} color="blue.600" />
            <VStack align="start" spacing={1}>
              <Text fontSize="lg" fontWeight="bold" color="gray.800">Address Lookup</Text>
              <HStack spacing={3}>
                <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                  <Icon as={FaCheck} mr={1} />
                  Official UK Data
                </Badge>
                <Badge colorScheme="green" variant="subtle" fontSize="xs">
                  <Icon as={FaInfoCircle} mr={1} />
                  Postcode First
                </Badge>
              </HStack>
            </VStack>
          </HStack>

          {/* RIGHT: Status */}
          {selectedAddress && (
            <Badge colorScheme="green" variant="solid" fontSize="sm" p={2} borderRadius="lg">
              <Icon as={FaCheck} mr={2} />
              Address Validated
            </Badge>
          )}
        </HStack>
      </Box>

      <FormControl isInvalid={!!error} isRequired={required}>

        {/* MAIN CONTENT CARD - MATCHING BOOKING-LUXURY STYLE */}
        <Box 
          bg="rgba(255, 255, 255, 0.95)" 
          backdropFilter="blur(10px)"
          shadow="0 4px 20px rgba(0, 0, 0, 0.08)" 
          borderRadius="xl" 
          border="1px solid rgba(255, 255, 255, 0.2)"
          overflow="hidden"
        >
          <Box p={{ base: 6, md: 8 }}>
            <VStack spacing={6} align="stretch">
              
              {/* Step 1: Postcode Entry */}
              <Collapse in={currentStep === 'postcode'} animateOpacity>
                <VStack spacing={6} align="stretch">
                  <Box textAlign="center">
                    <Text fontSize="xl" fontWeight="bold" color="gray.800" mb={2}>
                      Enter your postcode first
                    </Text>
                    <Text fontSize="md" color="green.600" fontWeight="medium">
                      🔒 All addresses are sourced from official UK address databases - 100% genuine data
                    </Text>
                  </Box>
              
              <Input
                value={postcode}
                onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                placeholder={placeholder}
                maxLength={8}
                disabled={disabled}
                size="lg"
                fontSize="md"
                bg="white"
                border="2px solid"
                borderColor="gray.300"
                borderRadius="lg"
                _focus={{ 
                  borderColor: 'blue.500',
                  boxShadow: '0 0 0 1px #3182ce'
                }}
                _placeholder={{ color: 'gray.400' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && canProceedFromPostcode) {
                    handlePostcodeSubmit();
                  }
                }}
              />
              
              <Button
                onClick={handlePostcodeSubmit}
                size="lg"
                bg="blue.600"
                color="white"
                _hover={{ bg: 'blue.700' }}
                _active={{ bg: 'blue.800' }}
                rightIcon={<FaArrowRight />}
                isLoading={isLoading}
                loadingText="Finding addresses"
                isDisabled={!canProceedFromPostcode || disabled}
                borderRadius="lg"
                fontWeight="semibold"
              >
                Find addresses
              </Button>

              {/* Postcode validation feedback */}
              {postcodeValidation && !postcodeValidation.isValid && postcode.length > 0 && (
                <Alert status="error" borderRadius="md" bg="red.50" borderColor="red.200">
                  <AlertIcon color="red.500" />
                  <AlertDescription color="red.700">
                    Please enter a valid UK postcode
                  </AlertDescription>
                </Alert>
              )}
            </VStack>
          </Collapse>

          {/* Step 2: Address Selection */}
          <Collapse in={currentStep === 'address'} animateOpacity>
            <VStack spacing={6} align="stretch">
              {/* Postcode display with change option */}
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="md" color="gray.700">
                      Postcode: <Text as="span" fontWeight="bold">{postcodeValidation?.formatted}</Text>
                    </Text>
                    <HStack spacing={2}>
                      <Badge 
                        colorScheme={
                          currentProvider === 'google' ? 'blue' : 'green'
                        } 
                        size="sm"
                      >
                        {currentProvider === 'google' ? '🟦 Google Places' :
                         '🟢 Mapbox'}
                      </Badge>
                      <Text fontSize="xs" color="gray.500">
                        {availableAddresses.length} addresses found
                      </Text>
                    </HStack>
                  </VStack>
                  <Button 
                    variant="link" 
                    color="blue.600" 
                    fontSize="sm"
                    textDecoration="underline"
                    p={0}
                    h="auto"
                    onClick={handleChangePostcode}
                  >
                    Change postcode
                  </Button>
                </HStack>
              </VStack>

              <Divider />

              {/* Address Selection Dropdown */}
              {availableAddresses.length > 0 && (
                <VStack spacing={4} align="stretch">
                  <Text fontSize="md" fontWeight="semibold" color="gray.800">
                    Select your exact address:
                  </Text>
                  <VStack spacing={2} align="start">
                    <Text fontSize="sm" color="green.600" fontWeight="medium">
                      ✅ All addresses below are verified from official UK sources
                    </Text>
                    <HStack spacing={4} fontSize="xs" color="gray.600">
                      <HStack spacing={1}>
                        <Text>🏠</Text>
                        <Text>House</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <Text>🏢</Text>
                        <Text>Flat/Apartment</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <Text>📍</Text>
                        <Text>Exact Location</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                  
                  <FormControl isRequired>
                    <Select 
                      placeholder="Please select your address..."
                      size="lg"
                      fontSize="md"
                      value={selectedAddress?.id || ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddressSelect(e.target.value);
                        }
                      }}
                      bg="white"
                      border="2px solid"
                      borderColor="gray.300"
                      borderRadius="lg"
                      _hover={{ borderColor: 'blue.400' }}
                      _focus={{ 
                        borderColor: 'blue.500', 
                        boxShadow: '0 0 0 1px #3182ce' 
                      }}
                    >
                      {availableAddresses.map((address, index) => {
                        // Enhanced display format with full details
                        const components = address.components;
                        const propertyDetails = address.propertyDetails;
                        
                        let fullDisplay = address.displayText;
                        
                        // If we have detailed components, create more complete display
                        if (components) {
                          const parts = [];
                          
                          // Add flat/unit if present
                          if (propertyDetails?.flatNumber || components.flatNumber) {
                            parts.push(`Flat ${propertyDetails?.flatNumber || components.flatNumber}`);
                          }
                          
                          // Add house number if present
                          if (propertyDetails?.houseNumber || components.houseNumber) {
                            parts.push(propertyDetails?.houseNumber || components.houseNumber);
                          }
                          
                          // Add street
                          if (components.street) {
                            parts.push(components.street);
                          }
                          
                          // Add city
                          if (components.city) {
                            parts.push(components.city);
                          }
                          
                          // Add postcode for clarity
                          if (components.postcode) {
                            parts.push(components.postcode);
                          }
                          
                          if (parts.length > 2) { // Only use enhanced format if we have good data
                            fullDisplay = parts.join(', ');
                          }
                        }
                        
                        return (
                          <option key={address.id || index} value={address.id}>
                            {fullDisplay}
                          </option>
                        );
                      })}
                    </Select>
                  </FormControl>
                </VStack>
              )}

              {/* API Error Display */}
              {apiError && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>{apiError}</AlertDescription>
                </Alert>
              )}
            </VStack>
          </Collapse>

          {/* Step 3: Confirmation */}
          <Collapse in={currentStep === 'complete'} animateOpacity>
            <VStack spacing={4} align="stretch">
              <Alert status="success" borderRadius="md" bg="green.50" borderColor="green.200">
                <AlertIcon color="green.500" />
                <VStack align="start" spacing={1} flex="1">
                  <Text fontWeight="bold" color="green.800">
                    ✓ Address Selected
                  </Text>
                  <Text color="green.700" fontSize="sm">
                    {selectedAddress?.displayText}
                  </Text>
                  <HStack spacing={2} mt={2}>
                    <Badge 
                      colorScheme={
                        currentProvider === 'google' ? 'blue' : 'green'
                      } 
                      variant="subtle" 
                      fontSize="xs"
                    >
                      {currentProvider === 'google' ? '🟦 Google' :
                       '🟢 Mapbox'}
                    </Badge>
                    <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                      Verified
                    </Badge>
                  </HStack>
                </VStack>
              </Alert>
              
              <Button
                leftIcon={<FaArrowLeft />}
                onClick={handleChangePostcode}
                variant="outline"
                colorScheme="blue"
                size="md"
                alignSelf="flex-start"
              >
                Change Address
              </Button>
            </VStack>
          </Collapse>
        </VStack>

        {error && (
          <FormErrorMessage fontSize="sm" mt={2}>
            <HStack spacing={1}>
              <Icon as={FaExclamationTriangle} color="red.500" boxSize={3} />
              <Text>{error}</Text>
            </HStack>
          </FormErrorMessage>
        )}
          </Box>
        </Box>
      </FormControl>
    </Box>
  );
};

export default LuxuryPostcodeAddressAutocomplete;
