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
  useToken,
  Flex,
  Badge
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { 
  premiumAddressService, 
  useLuxuryBookingAutocomplete, 
  useStandardBookingAutocomplete,
  AddressSuggestion,
  LocationCoordinates 
} from '@/lib/premium-location-services';

interface PremiumAddressAutocompleteProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  proximity?: LocationCoordinates;
  isLuxuryBooking?: boolean;
  isDisabled?: boolean;
  maxSuggestions?: number;
  showProviderBadge?: boolean;
}

export const PremiumAddressAutocomplete: React.FC<PremiumAddressAutocompleteProps> = ({
  placeholder = "Enter address...",
  value = "",
  onChange,
  onSelect,
  proximity,
  isLuxuryBooking = false,
  isDisabled = false,
  maxSuggestions = 5,
  showProviderBadge = true
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get the appropriate service based on booking type
  const autocompleteService = isLuxuryBooking 
    ? useLuxuryBookingAutocomplete() 
    : useStandardBookingAutocomplete();

  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.900', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

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
      const results = await autocompleteService.searchAddresses(newValue, {
        proximity,
        limit: maxSuggestions
      });
      
      setSuggestions(results);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [autocompleteService, proximity, maxSuggestions, onChange]);

  // Handle suggestion selection with enhanced address handling
  const handleSuggestionSelect = useCallback((suggestion: AddressSuggestion) => {
    // Use the most complete address available
    const displayValue = suggestion.address?.full_address || suggestion.place_name;
    setInputValue(displayValue);
    onChange?.(displayValue);
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
  const getProviderBadgeColor = (provider?: string) => {
    switch (provider) {
      case 'google':
        return 'blue';
      case 'mapbox':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Box position="relative" width="100%">
      <InputGroup>
        <InputLeftElement pointerEvents="none">
          {isLoading ? (
            <Spinner size="sm" color="blue.500" />
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
            borderColor: 'blue.500',
            boxShadow: '0 0 0 1px #3182ce'
          }}
          _hover={{
            borderColor: 'blue.400'
          }}
        />
      </InputGroup>

      {/* Suggestions Dropdown */}
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
          boxShadow="lg"
          mt={1}
          maxH="300px"
          overflowY="auto"
        >
          <VStack spacing={0} align="stretch">
            {suggestions.map((suggestion, index) => (
              <Box
                key={suggestion.id}
                p={3}
                cursor="pointer"
                bg={index === selectedIndex ? hoverBg : 'transparent'}
                borderBottom={index < suggestions.length - 1 ? '1px solid' : 'none'}
                borderBottomColor={borderColor}
                _hover={{ bg: hoverBg }}
                onClick={() => handleSuggestionSelect(suggestion)}
                transition="background-color 0.2s"
              >
                <Flex justify="space-between" align="center">
                  <HStack spacing={3} flex={1}>
                    {/* Icon */}
                    <Text fontSize="lg">{suggestion.icon || '📍'}</Text>
                    
                    {/* Enhanced Address Info */}
                    <VStack align="start" spacing={1} flex={1}>
                      {/* Main Address Line */}
                      <Text
                        fontWeight="medium"
                        color={textColor}
                        fontSize="sm"
                        noOfLines={1}
                      >
                        {suggestion.text || suggestion.address?.line1}
                      </Text>
                      
                      {/* Secondary Address Line (if available) */}
                      {suggestion.address?.line2 && (
                        <Text
                          fontSize="xs"
                          color={textColor}
                          fontWeight="500"
                          noOfLines={1}
                        >
                          {suggestion.address.line2}
                        </Text>
                      )}
                      
                      {/* Location Details */}
                      <Text
                        fontSize="xs"
                        color={secondaryTextColor}
                        noOfLines={1}
                      >
                        {suggestion.address?.city && suggestion.address?.postcode 
                          ? `${suggestion.address.city}, ${suggestion.address.postcode}`
                          : suggestion.place_name
                        }
                      </Text>
                      
                      {/* Enhanced Badges */}
                      <HStack spacing={2} flexWrap="wrap">
                        {suggestion.address?.postcode && (
                          <Badge size="sm" colorScheme="blue" variant="subtle">
                            📮 {suggestion.address.postcode}
                          </Badge>
                        )}
                        {suggestion.hasCompleteAddress && (
                          <Badge size="sm" colorScheme="green" variant="solid">
                            Complete Address
                          </Badge>
                        )}
                        {suggestion.type === 'postcode' && (
                          <Badge size="sm" colorScheme="orange" variant="outline">
                            Postcode Area
                          </Badge>
                        )}
                        {suggestion.confidence && suggestion.confidence > 0.8 && (
                          <Badge size="sm" colorScheme="purple" variant="subtle">
                            High Accuracy
                          </Badge>
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
                    >
                      {suggestion.provider === 'google' ? 'Google' : 'Mapbox'}
                    </Badge>
                  )}
                </Flex>
              </Box>
            ))}
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
          boxShadow="lg"
          mt={1}
          p={3}
        >
          <Text color={secondaryTextColor} fontSize="sm" textAlign="center">
            No addresses found. Try a different search term.
          </Text>
        </Box>
      )}
    </Box>
  );
};

export default PremiumAddressAutocomplete;
