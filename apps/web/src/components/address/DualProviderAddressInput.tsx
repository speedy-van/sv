/**
 * Dual Provider Address Input Component
 * Implements confused.com postcode-first pattern with Google Places + Mapbox fallback
 */

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  Input,
  FormControl,
  FormLabel,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  IconButton,
  Icon,
  Spinner,
  useToast,
  Text,
  HStack,
  Badge,
  VStack,
} from '@chakra-ui/react';
import { 
  FaTimes,
  FaCheck,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';

import type { AddressInputProps, AddressSuggestion, Provider } from '@/types/dual-provider-address';
import { PostcodeValidator } from '@/lib/postcode-validator';
import { AddressSuggestionDropdown } from './AddressSuggestionDropdown';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const DualProviderAddressInput: React.FC<AddressInputProps> = ({
  id,
  label,
  placeholder,
  value,
  onChange,
  onValidation,
  error,
  required = false,
  disabled = false,
  autoFocus = false,
  className,
  disableSuccessToast = false,
  context,
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AddressSuggestion | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [postcodeValidation, setPostcodeValidation] = useState<any>(null);
  const [currentProvider, setCurrentProvider] = useState<Provider>('google');
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const toast = useToast();

  // Debounce search input with 300ms delay
  const debouncedInputValue = useDebounce(inputValue, 300);

  // Auto-search when debounced input changes
  useEffect(() => {
    if (debouncedInputValue && debouncedInputValue.length >= 2) {
      handleSearch(debouncedInputValue);
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setApiError(null);
      setPostcodeValidation(null);
    }
  }, [debouncedInputValue]);

  // Validation effect
  useEffect(() => {
    const isValid = selectedSuggestion !== null && inputValue.trim().length > 0;
    setIsValidated(isValid);
    onValidation?.(isValid);
  }, [selectedSuggestion, inputValue, onValidation]);

  // Postcode validation for real-time feedback
  useEffect(() => {
    if (debouncedInputValue && debouncedInputValue.length >= 2) {
      const validation = PostcodeValidator.validateUKPostcode(debouncedInputValue);
      setPostcodeValidation(validation);
    }
  }, [debouncedInputValue]);

  const handleSearch = useCallback(async (query: string) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch(`/api/address/autocomplete?query=${encodeURIComponent(query)}`, {
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setSuggestions(result.data.suggestions);
        setCurrentProvider(result.data.provider);
        setIsOpen(result.data.suggestions.length > 0);
        setHighlightedIndex(result.data.suggestions.length > 0 ? 0 : -1);
        
        // Show provider info in development
        if (process.env.NODE_ENV === 'development' && result.data.fallbackAttempted) {
          toast({
            title: 'Provider fallback used',
            description: `Switched from ${result.data.provider === 'google' ? 'Mapbox' : 'Google'} to ${result.data.provider}`,
            status: 'info',
            duration: 2000,
            isClosable: true,
          });
        }
      } else {
        setSuggestions([]);
        setApiError(result.error.message);
        setIsOpen(false);
        
        toast({
          title: 'Address search failed',
          description: result.error.message,
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setSuggestions([]);
        setApiError('Network error occurred');
        setIsOpen(false);
        
        toast({
          title: 'Network error',
          description: 'Unable to search addresses. Please check your connection.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Reset selection when user types
    if (selectedSuggestion) {
      setSelectedSuggestion(null);
      onChange(null);
    }
  }, [selectedSuggestion, onChange]);

  const handleSuggestionSelect = useCallback((suggestion: AddressSuggestion) => {
    setInputValue(suggestion.displayText);
    setSelectedSuggestion(suggestion);
    setIsOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
    onChange(suggestion);
    
    // Focus back to input for better UX
    inputRef.current?.focus();
    
    // Show success toast only if not disabled
    if (!disableSuccessToast) {
      toast({
        title: 'Address selected',
        description: suggestion.displayText,
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    }
  }, [onChange, toast]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
        
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSuggestionSelect(suggestions[highlightedIndex]);
        }
        break;
        
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSuggestions([]);
        setHighlightedIndex(-1);
        break;
    }
  }, [isOpen, suggestions, highlightedIndex, handleSuggestionSelect]);

  const handleClear = useCallback(() => {
    setInputValue('');
    setSelectedSuggestion(null);
    setSuggestions([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setApiError(null);
    setPostcodeValidation(null);
    onChange(null);
    inputRef.current?.focus();
  }, [onChange]);

  const handleDropdownClose = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Get input border color based on validation state
  const getBorderColor = () => {
    if (error) return 'red.300';
    if (isValidated) return 'green.300';
    if (postcodeValidation?.isValid) return 'blue.300';
    return undefined;
  };

  // Get input background color based on validation state
  const getBackgroundColor = () => {
    if (isValidated) return 'green.50';
    if (postcodeValidation?.isValid) return 'blue.50';
    return 'white';
  };

  return (
    <Box ref={containerRef} position="relative" className={className}>
      <FormControl isInvalid={!!error} isRequired={required}>
        {label && (
          <FormLabel 
            htmlFor={id} 
            fontSize="sm" 
            fontWeight="semibold" 
            color="gray.700"
            mb={3}
            _dark={{ color: "gray.300" }}
          >
            {label}
          </FormLabel>
        )}
        
        {/* Postcode validation indicator */}
        {postcodeValidation && (
          <Box mb={2}>
            {postcodeValidation.isValid ? (
              <HStack spacing={2}>
                <Icon as={FaCheck} color="green.500" boxSize={3} />
                <Text fontSize="xs" color="green.600">
                  Valid UK postcode ({postcodeValidation.type})
                </Text>
                {postcodeValidation.suggestions && postcodeValidation.suggestions.length > 0 && (
                  <Text fontSize="xs" color="gray.500">
                    {postcodeValidation.suggestions.length} suggestions available
                  </Text>
                )}
              </HStack>
            ) : postcodeValidation.type === 'invalid' && inputValue.length > 2 ? (
              <HStack spacing={2}>
                <Icon as={FaExclamationTriangle} color="orange.500" boxSize={3} />
                <Text fontSize="xs" color="orange.600">
                  Invalid postcode format
                </Text>
              </HStack>
            ) : null}
          </Box>
        )}
        
        <InputGroup size="lg">
          <Input
            ref={inputRef}
            id={id}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            autoComplete="off"
            borderColor={getBorderColor()}
            bg={getBackgroundColor()}
            _focus={{
              borderColor: isValidated ? "green.400" : "blue.400",
              boxShadow: isValidated 
                ? "0 0 0 3px rgba(72, 187, 120, 0.1)" 
                : "0 0 0 3px rgba(49, 130, 206, 0.1)",
              bg: "white",
            }}
            _hover={{
              borderColor: getBorderColor() || "gray.400",
            }}
            transition="all 0.2s ease"
            pr={inputValue ? "120px" : "80px"}
            size="lg"
            borderRadius="xl"
            fontSize="md"
            _dark={{
              bg: isValidated ? "green.900" : "gray.800",
              _focus: {
                bg: "gray.700",
              }
            }}
          />
          
          <InputRightElement width={inputValue ? "120px" : "80px"}>
            {isLoading && (
              <Box
                p={2}
                borderRadius="lg"
                bg="blue.100"
                _dark={{ bg: "blue.800" }}
              >
                <Spinner size="sm" color="blue.500" thickness="2px" />
              </Box>
            )}
            
            {!isLoading && isValidated && (
              <Box
                p={2}
                borderRadius="lg"
                bg="green.100"
                mr={inputValue ? 12 : 8}
                _dark={{ bg: "green.800" }}
              >
                <Icon as={FaCheck} color="green.500" boxSize="16px" />
              </Box>
            )}
            
            {/* Provider indicator */}
            {!isLoading && inputValue && !isValidated && (
              <Box
                mr={inputValue ? 12 : 8}
                p={1}
                borderRadius="md"
                bg="gray.100"
                _dark={{ bg: "gray.700" }}
              >
                <Badge
                  size="sm"
                  colorScheme={currentProvider === 'google' ? 'blue' : 'green'}
                  fontSize="xs"
                >
                  {currentProvider === 'google' ? 'G' : 'M'}
                </Badge>
              </Box>
            )}
            
            {!isLoading && inputValue && (
              <IconButton
                size="sm"
                variant="ghost"
                aria-label="Clear address"
                icon={<FaTimes />}
                onClick={handleClear}
                mr={1}
                borderRadius="lg"
                _hover={{
                  bg: "red.100",
                  color: "red.600",
                }}
                _dark={{
                  _hover: {
                    bg: "red.800",
                    color: "red.300",
                  }
                }}
              />
            )}
          </InputRightElement>
        </InputGroup>

        {error && (
          <FormErrorMessage fontSize="sm">
            {error}
          </FormErrorMessage>
        )}

        {/* Provider info */}
        {process.env.NODE_ENV === 'development' && currentProvider && (
          <Box mt={2}>
            <HStack spacing={2}>
              <Icon as={FaInfoCircle} color="gray.500" boxSize={3} />
              <Text fontSize="xs" color="gray.500">
                Using {currentProvider === 'google' ? 'Google Places' : 'Mapbox'} API
              </Text>
            </HStack>
          </Box>
        )}
      </FormControl>

      {/* Dropdown */}
      <AddressSuggestionDropdown
        suggestions={suggestions}
        onSelect={handleSuggestionSelect}
        onClose={handleDropdownClose}
        isOpen={isOpen}
        loading={isLoading}
        error={apiError}
        highlightedIndex={highlightedIndex}
        maxHeight={300}
        showProvider={true}
      />
    </Box>
  );
};

export default DualProviderAddressInput;
