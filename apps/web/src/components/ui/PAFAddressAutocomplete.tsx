'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  Text,
  HStack,
  Icon,
  Spinner,
  useColorModeValue,
  Flex,
  Badge,
  Divider,
  Tooltip
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

interface PAFAddressSuggestion {
  id: string;
  text: string;
  place_name: string;
  address: {
    line1: string;
    line2?: string;
    line3?: string;
    city: string;
    postcode: string;
    county: string;
    country: string;
    full_address: string;
    building_type?: string;
    sub_building?: string;
  };
  coords: {
    lat: number;
    lng: number;
  };
  priority: number;
  isPostcodeMatch: boolean;
  hasCompleteAddress: boolean;
  confidence: number;
  source: string;
  provider: string;
  icon: string;
}

interface PAFAddressAutocompleteProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (suggestion: PAFAddressSuggestion) => void;
  isDisabled?: boolean;
  maxSuggestions?: number;
  showProviderBadge?: boolean;
  showBuildingType?: boolean;
  showConfidence?: boolean;
}

export const PAFAddressAutocomplete: React.FC<PAFAddressAutocompleteProps> = ({
  placeholder = "Enter postcode or address...",
  value = "",
  onChange,
  onSelect,
  isDisabled = false,
  maxSuggestions = 10,
  showProviderBadge = true,
  showBuildingType = true,
  showConfidence = true
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<PAFAddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.900', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const accentColor = useColorModeValue('blue.500', 'blue.300');

  // Handle input change with debounced search
  const handleInputChange = useCallback(async (newValue: string) => {
    setInputValue(newValue);
    onChange?.(newValue);
    
    // For postcodes, allow shorter input (minimum 2 characters)
    const minLength = /^[A-Z]{1,2}[0-9]/i.test(newValue.trim()) ? 2 : 3;
    
    if (newValue.length < minLength) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);
    
    try {
      // Try PAF API first for UK addresses
      const response = await fetch(`/api/places/paf?q=${encodeURIComponent(newValue)}&limit=${maxSuggestions}`);
      const results = await response.json();
      
      if (results && results.length > 0) {
        setSuggestions(results);
        console.log(`[PAF Component] Found ${results.length} PAF results`);
      } else {
        // Fallback to regular suggest API
        const fallbackResponse = await fetch(`/api/places/suggest?q=${encodeURIComponent(newValue)}&limit=${maxSuggestions}`);
        const fallbackResults = await fallbackResponse.json();
        setSuggestions(fallbackResults || []);
        console.log(`[PAF Component] Using fallback API, found ${fallbackResults?.length || 0} results`);
      }
      
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [maxSuggestions, onChange]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: PAFAddressSuggestion) => {
    setInputValue(suggestion.address.full_address);
    onChange?.(suggestion.address.full_address);
    onSelect?.(suggestion);
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [onChange, onSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

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
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  }, [isOpen, suggestions, selectedIndex, handleSuggestionSelect]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Get provider badge color
  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case 'paf':
      case 'loqate':
        return 'purple';
      case 'royal-mail':
        return 'red';
      case 'ideal-postcodes':
        return 'orange';
      case 'google':
        return 'blue';
      case 'mapbox':
        return 'green';
      default:
        return 'gray';
    }
  };

  // Get building type badge
  const getBuildingTypeBadge = (buildingType?: string) => {
    switch (buildingType) {
      case 'house':
        return { color: 'green', text: 'House', icon: '🏠' };
      case 'flat':
      case 'apartment':
        return { color: 'blue', text: 'Flat', icon: '🏢' };
      case 'commercial':
        return { color: 'purple', text: 'Commercial', icon: '🏬' };
      default:
        return { color: 'gray', text: 'Building', icon: '🏗️' };
    }
  };

  // Get confidence level
  const getConfidenceLevel = (confidence: number) => {
    if (confidence >= 0.9) return { color: 'green', text: 'High' };
    if (confidence >= 0.7) return { color: 'yellow', text: 'Medium' };
    return { color: 'red', text: 'Low' };
  };

  return (
    <Box position="relative" width="100%">
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          {isLoading ? (
            <Spinner size="sm" color={accentColor} />
          ) : (
            <SearchIcon color="gray.400" />
          )}
        </InputLeftElement>
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(suggestions.length > 0)}
          placeholder={placeholder}
          isDisabled={isDisabled}
          bg={bgColor}
          borderColor={borderColor}
          _focus={{
            borderColor: accentColor,
            boxShadow: `0 0 0 1px ${accentColor}`
          }}
          _hover={{
            borderColor: accentColor
          }}
        />
      </InputGroup>

      {/* Enhanced Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <Box
          ref={dropdownRef}
          position="absolute"
          top="100%"
          left="0"
          right="0"
          zIndex={1000}
          bg={bgColor}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          boxShadow="xl"
          mt={1}
          maxH="400px"
          overflowY="auto"
        >
          <VStack spacing={0} align="stretch">
            {/* Header */}
            <Box p={3} borderBottom="1px solid" borderBottomColor={borderColor}>
              <HStack justify="space-between" align="center">
                <Text fontSize="sm" fontWeight="medium" color={textColor}>
                  Address Suggestions
                </Text>
                <Text fontSize="xs" color={secondaryTextColor}>
                  {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
                </Text>
              </HStack>
            </Box>

            {/* Suggestions List */}
            {suggestions.map((suggestion, index) => {
              const buildingType = getBuildingTypeBadge(suggestion.address.building_type);
              const confidence = getConfidenceLevel(suggestion.confidence);
              
              return (
                <Box
                  key={suggestion.id}
                  p={4}
                  cursor="pointer"
                  bg={index === selectedIndex ? hoverBg : 'transparent'}
                  borderBottom={index < suggestions.length - 1 ? '1px solid' : 'none'}
                  borderBottomColor={borderColor}
                  _hover={{ bg: hoverBg }}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  transition="all 0.2s"
                >
                  <Flex justify="space-between" align="start">
                    <HStack spacing={3} flex={1} align="start">
                      {/* Icon */}
                      <Text fontSize="lg" mt={1}>
                        {suggestion.icon || '📍'}
                      </Text>
                      
                      {/* Address Details */}
                      <VStack align="start" spacing={2} flex={1}>
                        {/* Main Address */}
                        <Text
                          fontWeight="medium"
                          color={textColor}
                          fontSize="sm"
                          lineHeight="1.4"
                        >
                          {suggestion.address.line1}
                        </Text>
                        
                        {/* Secondary Address Lines */}
                        {(suggestion.address.line2 || suggestion.address.sub_building) && (
                          <Text
                            fontSize="xs"
                            color={textColor}
                            fontWeight="500"
                            lineHeight="1.3"
                          >
                            {suggestion.address.sub_building || suggestion.address.line2}
                          </Text>
                        )}
                        
                        {/* Third Address Line */}
                        {suggestion.address.line3 && (
                          <Text
                            fontSize="xs"
                            color={textColor}
                            fontWeight="500"
                            lineHeight="1.3"
                          >
                            {suggestion.address.line3}
                          </Text>
                        )}
                        
                        {/* Location Details */}
                        <Text
                          fontSize="xs"
                          color={secondaryTextColor}
                          lineHeight="1.3"
                        >
                          {suggestion.address.city}, {suggestion.address.postcode}
                        </Text>
                        
                        {/* Badges */}
                        <HStack spacing={2} flexWrap="wrap">
                          {/* Postcode Badge */}
                          <Badge size="sm" colorScheme="blue" variant="subtle">
                            📮 {suggestion.address.postcode}
                          </Badge>
                          
                          {/* Building Type Badge */}
                          {showBuildingType && suggestion.address.building_type && (
                            <Badge size="sm" colorScheme={buildingType.color} variant="outline">
                              {buildingType.icon} {buildingType.text}
                            </Badge>
                          )}
                          
                          {/* Complete Address Badge */}
                          {suggestion.hasCompleteAddress && (
                            <Badge size="sm" colorScheme="green" variant="solid">
                              Complete
                            </Badge>
                          )}
                          
                          {/* Confidence Badge */}
                          {showConfidence && (
                            <Tooltip label={`Confidence: ${Math.round(suggestion.confidence * 100)}%`}>
                              <Badge size="sm" colorScheme={confidence.color} variant="subtle">
                                {confidence.text}
                              </Badge>
                            </Tooltip>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>

                    {/* Provider Badge */}
                    {showProviderBadge && suggestion.provider && (
                      <Badge
                        size="sm"
                        colorScheme={getProviderBadgeColor(suggestion.provider)}
                        variant="subtle"
                        ml={2}
                      >
                        {suggestion.provider === 'paf' ? 'PAF' : 
                         suggestion.provider === 'loqate' ? 'Loqate' :
                         suggestion.provider === 'royal-mail' ? 'Royal Mail' :
                         suggestion.provider === 'ideal-postcodes' ? 'Ideal' :
                         suggestion.provider}
                      </Badge>
                    )}
                  </Flex>
                </Box>
              );
            })}
          </VStack>
        </Box>
      )}

      {/* No results message */}
      {isOpen && !isLoading && suggestions.length === 0 && inputValue.length >= 3 && (
        <Box
          position="absolute"
          top="100%"
          left="0"
          right="0"
          zIndex={1000}
          bg={bgColor}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="md"
          boxShadow="xl"
          mt={1}
          p={4}
        >
          <VStack spacing={2}>
            <Text color={secondaryTextColor} fontSize="sm" textAlign="center">
              No addresses found for this postcode
            </Text>
            <Text color={secondaryTextColor} fontSize="xs" textAlign="center">
              Try entering a different postcode or address
            </Text>
          </VStack>
        </Box>
      )}
    </Box>
  );
};

export default PAFAddressAutocomplete;
