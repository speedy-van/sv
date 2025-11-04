/**
 * UK Address Autocomplete Component - Premium UI
 * Google Places API (Primary) + Mapbox (Fallback)
 * Professional design with enhanced UX for luxury booking platform
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Input,
  VStack,
  HStack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  IconButton,
  Fade,
  ScaleFade,
  Icon,
  InputGroup,
  InputRightElement,
  Select,
  Switch,
  SimpleGrid,
  FormLabel,
  Portal,
} from '@chakra-ui/react';
import { 
  CheckIcon, 
  CloseIcon,
  Search2Icon
} from '@chakra-ui/icons';
import { FaMapMarkerAlt, FaCheckCircle } from 'react-icons/fa';
import { PostcodeValidator } from '@/lib/postcode-validator';
// CompleteAddress type definition with building details
interface CompleteAddress {
  full: string;
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  formatted: {
    street: string;
    houseNumber: string;
    flatNumber?: string;
    floor?: string;
    businessName?: string;
  };
  isPostcodeValidated: boolean;
  stepCompletedAt: string;
  buildingDetails?: {
    type?: string;
    hasElevator?: boolean;
    floorNumber?: string;
    apartmentNumber?: string;
  };
}

interface AddressSuggestion {
  id: string;
  displayText: string;
  mainText?: string;
  secondaryText?: string;
  provider: 'google' | 'mapbox';
  confidence: number;
  sessionToken?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  components?: {
    houseNumber?: string;
    street?: string;
    city?: string;
    postcode?: string;
    country?: string;
    flatNumber?: string;
  };
}

interface UKAddressAutocompleteProps {
  id: string;
  label: string;
  value: CompleteAddress | null;
  onChange: (address: CompleteAddress | null) => void;
  placeholder?: string;
  isRequired?: boolean;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface AddressDetails {
  floorNumber?: string;
  apartmentNumber?: string;
  hasElevator?: boolean;
  buildingType?: string;
}

export const UKAddressAutocomplete: React.FC<UKAddressAutocompleteProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = "Start typing your address...",
  isRequired = false,
  helperText,
  size = 'md'
}) => {
  const [inputValue, setInputValue] = useState(value?.full || '');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [sessionToken, setSessionToken] = useState<string>('');
  const [apiError, setApiError] = useState<string>('');
  const [currentProvider, setCurrentProvider] = useState<string>('');
  
  // Additional address details state
  const [floorNumber, setFloorNumber] = useState(value?.buildingDetails?.floorNumber || value?.formatted?.floor || '');
  const [apartmentNumber, setApartmentNumber] = useState(value?.buildingDetails?.apartmentNumber || value?.formatted?.flatNumber || '');
  const [hasElevator, setHasElevator] = useState(value?.buildingDetails?.hasElevator || false);
  const [buildingType, setBuildingType] = useState(value?.buildingDetails?.type || '');
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });

  // Building type options
  const buildingTypes = [
    { value: '', label: 'Select building type' },
    { value: 'house', label: 'House' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'villa', label: 'Villa' },
    { value: 'office', label: 'Office' },
    { value: 'company', label: 'Company' },
    { value: 'field', label: 'Field' },
    { value: 'farm', label: 'Farm' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'shop', label: 'Shop' },
    { value: 'other', label: 'Other' },
  ];

  // Generate session token on mount
  useEffect(() => {
    const token = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    setSessionToken(token);
  }, []);

  // Debounced search function - Now starts at 2 characters
  const searchAddresses = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setApiError('');

    try {
      console.log(`🔍 Searching UK addresses for: "${query}"`);
      console.log(`📡 Session Token: ${sessionToken}`);

      const url = `/api/address/autocomplete-uk?query=${encodeURIComponent(query)}&sessionToken=${encodeURIComponent(sessionToken)}`;
      console.log(`📡 Request URL: ${url}`);

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log(`📡 Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error Response:`, {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`📋 API Response:`, {
        success: result.success,
        suggestionCount: result.data?.suggestions?.length || 0,
        provider: result.data?.provider,
        fallbackAttempted: result.data?.fallbackAttempted,
        responseTime: result.responseTime
      });

      if (result.success && result.data && result.data.suggestions) {
        setSuggestions(result.data.suggestions);
        setCurrentProvider(result.data.provider);
        setShowSuggestions(true);
        setSelectedIndex(result.data.suggestions.length > 0 ? 0 : -1); // Auto-highlight first suggestion

        console.log(`✅ Found ${result.data.suggestions.length} suggestions from ${result.data.provider}`);
      } else {
        console.warn('❌ Invalid API response:', result);
        setSuggestions([]);
        setShowSuggestions(false);
        
        toast({
          title: 'Search Failed',
          description: result.error || 'Unable to search for addresses. Please try again.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('❌ Address search failed:', {
          query,
          error: error.message,
          timestamp: new Date().toISOString()
        });

        setApiError(error.message);
        setSuggestions([]);
        setShowSuggestions(false);

        toast({
          title: 'Search Error',
          description: 'Network error occurred. Please check your connection and try again.',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [sessionToken, toast]);

  // Debounce search calls - Now triggers at 2 characters
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.trim().length >= 2) {
        searchAddresses(inputValue);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 250); // Slightly faster response

    return () => clearTimeout(timer);
  }, [inputValue, searchAddresses]);


  // Handle suggestion selection - IMMEDIATE single-click selection
  const selectSuggestion = useCallback(async (suggestion: AddressSuggestion) => {
    console.log(`✅ Selected suggestion:`, {
      id: suggestion.id,
      text: suggestion.displayText,
      provider: suggestion.provider
    });

    // IMMEDIATE UI updates - no delays
    setInputValue(suggestion.displayText);
    setShowSuggestions(false);  // Close dropdown IMMEDIATELY
    setSelectedIndex(-1);       // Reset selection
    setSuggestions([]);         // Clear suggestions to prevent re-opening
    setIsLoading(true);
    setApiError('');
    
    // Force hide suggestions immediately
    setTimeout(() => {
      setShowSuggestions(false);
      setSuggestions([]);
    }, 0);

    try {
      let fullAddressData = suggestion;

      // Get full details for Google Places suggestions
      if (suggestion.provider === 'google' && suggestion.id.startsWith('place_id:') === false) {
        console.log(`🔍 Fetching place details for: ${suggestion.id}`);

        const detailsResponse = await fetch('/api/address/autocomplete-uk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            placeId: suggestion.id,
            sessionToken: suggestion.sessionToken || sessionToken
          })
        });

        if (detailsResponse.ok) {
          const detailsResult = await detailsResponse.json();
          if (detailsResult.success) {
            fullAddressData = detailsResult.data;
            console.log(`✅ Got place details:`, fullAddressData);
          }
        }
      }

      // Convert to CompleteAddress format with additional details
      const completeAddress: CompleteAddress = {
        full: fullAddressData.displayText,
        line1: [
          fullAddressData.components?.houseNumber,
          fullAddressData.components?.street
        ].filter(Boolean).join(' ') || '',
        line2: apartmentNumber ? `Apartment ${apartmentNumber}` : (fullAddressData.components?.flatNumber ? `Flat ${fullAddressData.components.flatNumber}` : ''),
        city: fullAddressData.components?.city || '',
        postcode: fullAddressData.components?.postcode || '',
        country: 'United Kingdom',
        coordinates: fullAddressData.coordinates ? {
          lat: fullAddressData.coordinates.lat,
          lng: fullAddressData.coordinates.lng
        } : { lat: 0, lng: 0 },
        formatted: {
          street: fullAddressData.components?.street || '',
          houseNumber: fullAddressData.components?.houseNumber || '',
          flatNumber: apartmentNumber || fullAddressData.components?.flatNumber || '',
          floor: floorNumber,
          businessName: buildingType === 'company' || buildingType === 'office' ? 'Business' : ''
        },
        isPostcodeValidated: !!fullAddressData.components?.postcode,
        stepCompletedAt: new Date().toISOString(),
        // Add new fields to the address object
        buildingDetails: {
          type: buildingType,
          hasElevator: hasElevator,
          floorNumber: floorNumber,
          apartmentNumber: apartmentNumber
        }
      };

      onChange(completeAddress);

      // Brief success indication without toast (cleaner UX)
      console.log(`✅ Address selected from ${fullAddressData.provider}:`, completeAddress.full);

    } catch (error) {
      console.error('❌ Error fetching address details:', error);
      
      toast({
        title: 'Selection Error',
        description: 'Failed to get full address details. Please try selecting again.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [onChange, sessionToken, toast]);

  // Handle input changes - prevent search when address is already selected
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Only trigger search if this is actual user typing, not programmatic setting
    if (newValue !== value?.full) {
      onChange(null); // Clear selection when input changes
      setApiError(''); // Clear any errors
      setShowSuggestions(false); // Hide suggestions when user starts typing
      setSuggestions([]); // Clear suggestions
    }
  }, [onChange, value?.full]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  }, [showSuggestions, suggestions, selectedIndex, selectSuggestion]);

  // Clear address
  const handleClear = useCallback(() => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    onChange(null);
    inputRef.current?.focus();
  }, [onChange]);

  // Click outside to close dropdown - use timeout to allow onClick to fire first
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Use setTimeout to allow onClick handlers to fire first
      setTimeout(() => {
        // Check if click is inside dropdown or input
        const target = event.target as Node;
        if (
          dropdownRef.current && 
          dropdownRef.current.contains(target)
        ) {
          // Click is inside dropdown - don't close
          return;
        }
        if (
          inputRef.current &&
          inputRef.current.contains(target)
        ) {
          // Click is on input - don't close
          return;
        }
        // Click is outside - close dropdown
        setShowSuggestions(false);
      }, 0);
    };

    if (showSuggestions) {
      // Position dropdown relative to viewport to avoid ancestor clipping
      const rect = inputRef.current?.getBoundingClientRect();
      if (rect) {
        setDropdownStyle({ top: Math.round(rect.top + rect.height + 8), left: Math.round(rect.left), width: Math.round(rect.width) });
      }
      // Use 'click' event with normal bubbling (not capture) to allow onClick to fire first
      document.addEventListener('click', handleClickOutside);
      const reposition = () => {
        const r = inputRef.current?.getBoundingClientRect();
        if (r) setDropdownStyle({ top: Math.round(r.top + r.height + 8), left: Math.round(r.left), width: Math.round(r.width) });
      };
      window.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);
      setTimeout(reposition, 0);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      // listeners removed by reference in caller; safe fallback
    };
  }, [showSuggestions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper function to highlight matched text
  const highlightMatch = (text: string, query: string) => {
    if (!query || query.length < 2) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <Text as="span" key={index} fontWeight="bold" color="blue.600">
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <Box position="relative" w="full" overflow="visible">
      <VStack align="stretch" spacing={3}>
        {/* Label */}
        <Text fontSize="sm" fontWeight="semibold" color="white" mb={1}>
          {label} {isRequired && <Text as="span" color="red.400">*</Text>}
        </Text>
        
        {/* Clean Input Field - No Icons */}
        <Box position="relative" overflow="visible">
          <InputGroup size={size}>
            <Input
              ref={inputRef}
              id={id}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              pl="1rem"
              pr={value || isLoading ? "2.5rem" : "1rem"}
              bg="rgba(255, 255, 255, 0.05)"
              border="1px solid"
              borderColor={value ? "green.400" : "rgba(255, 255, 255, 0.1)"}
              borderRadius="xl"
              color="white"
              fontSize="sm"
              fontWeight="medium"
              _placeholder={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "sm"
              }}
              _hover={{
                borderColor: value ? "green.300" : "rgba(255, 255, 255, 0.2)",
                bg: "rgba(255, 255, 255, 0.08)"
              }}
              _focus={{
                borderColor: value ? "green.400" : "blue.400",
                bg: "rgba(255, 255, 255, 0.1)",
                boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)"
              }}
              transition="all 0.2s"
            />
            
            <InputRightElement>
              {isLoading ? (
                <Spinner size="sm" color="blue.400" thickness="2px" />
              ) : value ? (
                <HStack spacing={1}>
                  <ScaleFade in={true} initialScale={0.8}>
                    <Icon 
                      as={FaCheckCircle} 
                      color="green.400" 
                      boxSize={4}
                    />
                  </ScaleFade>
                  <IconButton
                    aria-label="Clear address"
                    icon={<CloseIcon />}
                    size="xs"
                    variant="ghost"
                    color="gray.400"
                    _hover={{ color: "white", bg: "rgba(255, 255, 255, 0.1)" }}
                    onClick={handleClear}
                  />
                </HStack>
              ) : null}
            </InputRightElement>
          </InputGroup>
          
          {/* Helper Text */}
          {helperText && (
            <Text fontSize="xs" color="rgba(255, 255, 255, 0.7)" mt={2}>
              {helperText}
            </Text>
          )}
        </Box>

        {/* API Error Alert */}
        {apiError && (
          <Fade in={true}>
            <Alert 
              status="error" 
              size="sm" 
              borderRadius="lg"
              bg="rgba(245, 101, 101, 0.1)"
              border="1px solid rgba(245, 101, 101, 0.2)"
            >
              <AlertIcon color="red.400" />
              <Text fontSize="sm" color="red.300">{apiError}</Text>
            </Alert>
          </Fade>
        )}

        {/* Premium Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <Portal>
          <ScaleFade in={true} initialScale={0.95}>
            <Box
              ref={dropdownRef}
              position="fixed"
              top={`${dropdownStyle.top}px`}
              left={`${dropdownStyle.left}px`}
              width={`${dropdownStyle.width}px`}
              zIndex={1400}
              bg="rgba(26, 32, 44, 0.98)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              borderRadius="xl"
              boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)"
              maxH="320px"
              overflowY="auto"
              py={2}
              css={{
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '3px',
                },
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {suggestions.map((suggestion, index) => (
                <Box
                  key={suggestion.id}
                  px={4}
                  py={3}
                  mx={2}
                  cursor="pointer"
                  borderRadius="lg"
                  bg={selectedIndex === index ? "rgba(66, 153, 225, 0.15)" : "transparent"}
                  border={selectedIndex === index ? "1px solid rgba(66, 153, 225, 0.3)" : "1px solid transparent"}
                  _hover={{ 
                    bg: "rgba(66, 153, 225, 0.1)",
                    borderColor: "rgba(66, 153, 225, 0.2)"
                  }}
                  transition="all 0.2s"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Close dropdown immediately to prevent click outside handler
                    setShowSuggestions(false);
                    setSuggestions([]);
                    // Select suggestion
                    selectSuggestion(suggestion);
                  }}
                >
                  <HStack align="start" spacing={3}>
                    <Icon 
                      as={FaMapMarkerAlt} 
                      color="blue.400" 
                      boxSize={4} 
                      mt={0.5}
                      opacity={0.8}
                    />
                    
                    <VStack align="start" spacing={1} flex={1} minW={0}>
                      <Text 
                        fontSize="sm" 
                        fontWeight="semibold" 
                        color="white"
                        lineHeight="1.35"
                        whiteSpace="normal"
                        wordBreak="break-word"
                      >
                        {highlightMatch(suggestion.mainText || suggestion.displayText, inputValue)}
                      </Text>
                      
                      {suggestion.secondaryText && (
                        <Text 
                          fontSize="xs" 
                          color="rgba(255, 255, 255, 0.8)"
                          lineHeight="1.25"
                          whiteSpace="normal"
                          wordBreak="break-word"
                        >
                          {suggestion.secondaryText}
                        </Text>
                      )}
                    </VStack>
                    
                    {/* Confidence indicator */}
                    {suggestion.confidence && suggestion.confidence > 0.9 && (
                      <Box
                        w={2}
                        h={2}
                        bg="green.400"
                        borderRadius="full"
                        mt={1.5}
                        opacity={0.8}
                      />
                    )}
                  </HStack>
                </Box>
              ))}
              
              {/* Powered by footer */}
              <Box
                px={4}
                py={2}
                mt={2}
                borderTop="1px solid rgba(255, 255, 255, 0.05)"
              >
                <HStack justify="space-between" align="center">
                  <Text fontSize="10px" color="rgba(255, 255, 255, 0.4)" fontWeight="medium">
                    Powered by {currentProvider === 'google' ? 'Google Places' : 'Mapbox'}
                  </Text>
                  <Text fontSize="10px" color="rgba(255, 255, 255, 0.3)">
                    {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
                  </Text>
                </HStack>
              </Box>
            </Box>
          </ScaleFade>
          </Portal>
        )}
        
        {/* No results message */}
        {showSuggestions && suggestions.length === 0 && !isLoading && inputValue.length >= 2 && (
          <Fade in={true}>
            <Portal>
            <Box
              position="fixed"
              top={`${dropdownStyle.top}px`}
              left={`${dropdownStyle.left}px`}
              width={`${dropdownStyle.width}px`}
              zIndex={1400}
              bg="rgba(26, 32, 44, 0.98)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(255, 255, 255, 0.1)"
              borderRadius="xl"
              boxShadow="0 20px 25px -5px rgba(0, 0, 0, 0.3)"
              p={4}
            >
              <VStack spacing={2}>
                <Icon as={Search2Icon} color="gray.500" boxSize={5} />
                <Text fontSize="sm" color="rgba(255, 255, 255, 0.7)" textAlign="center">
                  No verified addresses found. Please check the address or try a nearby postcode.
                </Text>
              </VStack>
            </Box>
            </Portal>
          </Fade>
        )}

        {/* Additional Address Details - Only show when address is selected */}
        {value && (
          <Fade in={true}>
            <VStack align="stretch" spacing={4} mt={4} position="relative" zIndex={1}>
              <Text fontSize="sm" fontWeight="semibold" color="white">
                Additional Details (Optional)
              </Text>
              
              {/* Building Type */}
              <Box>
                <FormLabel fontSize="xs" color="rgba(255, 255, 255, 0.8)" mb={1}>
                  Building Type
                </FormLabel>
                <Select
                  value={buildingType}
                  onChange={(e) => {
                    setBuildingType(e.target.value);
                    // Update address immediately
                    if (value) {
                      const updatedAddress = {
                        ...value,
                        buildingDetails: {
                          ...value.buildingDetails,
                          type: e.target.value
                        }
                      };
                      onChange(updatedAddress);
                    }
                  }}
                  placeholder="Select building type"
                  size="sm"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid rgba(255, 255, 255, 0.1)"
                  borderRadius="lg"
                  color="white"
                  _hover={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    bg: "rgba(255, 255, 255, 0.08)"
                  }}
                  _focus={{
                    borderColor: "blue.400",
                    bg: "rgba(255, 255, 255, 0.1)",
                    boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)"
                  }}
                >
                  {buildingTypes.map((type) => (
                    <option key={type.value} value={type.value} style={{ backgroundColor: '#2D3748', color: 'white' }}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </Box>

              {/* Floor and Apartment Numbers */}
              <SimpleGrid columns={2} spacing={3}>
                <Box>
                  <FormLabel fontSize="xs" color="rgba(255, 255, 255, 0.8)" mb={1}>
                    Floor Number
                  </FormLabel>
                  <Input
                    value={floorNumber}
                    onChange={(e) => {
                      setFloorNumber(e.target.value);
                      // Update address immediately
                      if (value) {
                        const updatedAddress = {
                          ...value,
                          formatted: {
                            ...value.formatted,
                            floor: e.target.value
                          },
                          buildingDetails: {
                            ...value.buildingDetails,
                            floorNumber: e.target.value
                          }
                        };
                        onChange(updatedAddress);
                      }
                    }}
                    placeholder="e.g., 2nd, Ground"
                    size="sm"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    borderRadius="lg"
                    color="white"
                    _placeholder={{ color: "rgba(255, 255, 255, 0.6)" }}
                    _hover={{
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      bg: "rgba(255, 255, 255, 0.08)"
                    }}
                    _focus={{
                      borderColor: "blue.400",
                      bg: "rgba(255, 255, 255, 0.1)",
                      boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)"
                    }}
                  />
                </Box>

                <Box>
                  <FormLabel fontSize="xs" color="rgba(255, 255, 255, 0.8)" mb={1}>
                    Apartment Number
                  </FormLabel>
                  <Input
                    value={apartmentNumber}
                    onChange={(e) => {
                      setApartmentNumber(e.target.value);
                      // Update address immediately
                      if (value) {
                        const updatedAddress = {
                          ...value,
                          line2: e.target.value ? `Apartment ${e.target.value}` : '',
                          formatted: {
                            ...value.formatted,
                            flatNumber: e.target.value
                          },
                          buildingDetails: {
                            ...value.buildingDetails,
                            apartmentNumber: e.target.value
                          }
                        };
                        onChange(updatedAddress);
                      }
                    }}
                    placeholder="e.g., 12A, 304"
                    size="sm"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid rgba(255, 255, 255, 0.1)"
                    borderRadius="lg"
                    color="white"
                    _placeholder={{ color: "rgba(255, 255, 255, 0.6)" }}
                    _hover={{
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      bg: "rgba(255, 255, 255, 0.08)"
                    }}
                    _focus={{
                      borderColor: "blue.400",
                      bg: "rgba(255, 255, 255, 0.1)",
                      boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.1)"
                    }}
                  />
                </Box>
              </SimpleGrid>

              {/* Elevator Toggle */}
              <HStack justify="space-between" align="center">
                <Box>
                  <Text fontSize="sm" color="white" fontWeight="medium">
                    Elevator Available
                  </Text>
                  <Text fontSize="xs" color="rgba(255, 255, 255, 0.7)">
                    Is there an elevator in the building?
                  </Text>
                </Box>
                <Switch
                  isChecked={hasElevator}
                  onChange={(e) => {
                    setHasElevator(e.target.checked);
                    // Update address immediately
                    if (value) {
                      const updatedAddress = {
                        ...value,
                        buildingDetails: {
                          ...value.buildingDetails,
                          hasElevator: e.target.checked
                        }
                      };
                      onChange(updatedAddress);
                    }
                  }}
                  colorScheme="blue"
                  size="md"
                />
              </HStack>
            </VStack>
          </Fade>
        )}
      </VStack>
    </Box>
  );
};