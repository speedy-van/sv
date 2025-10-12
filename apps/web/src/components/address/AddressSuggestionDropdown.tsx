/**
 * Address Suggestion Dropdown Component
 * Enhanced dropdown with provider indicators and better UX
 */

'use client';

import React, { useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Spinner,
  Badge,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaBuilding, FaHome, FaWarehouse } from 'react-icons/fa';

import type { AddressSuggestion, Provider } from '@/types/dual-provider-address';

interface AddressSuggestionDropdownProps {
  suggestions: AddressSuggestion[];
  onSelect: (suggestion: AddressSuggestion) => void;
  onClose: () => void;
  isOpen: boolean;
  loading?: boolean;
  error?: string | null;
  highlightedIndex?: number;
  maxHeight?: number;
  showProvider?: boolean;
}

const AddressTypeIcons = {
  address: FaMapMarkerAlt,
  home: FaHome,
  office: FaBuilding,
  warehouse: FaWarehouse,
  establishment: FaBuilding,
};

const ProviderColors = {
  google: 'blue',
  mapbox: 'green',
} as const;

const ProviderNames = {
  google: 'Google',
  mapbox: 'Mapbox',
} as const;

export const AddressSuggestionDropdown: React.FC<AddressSuggestionDropdownProps> = ({
  suggestions,
  onSelect,
  onClose,
  isOpen,
  loading = false,
  error = null,
  highlightedIndex = -1,
  maxHeight = 300,
  showProvider = false,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.300');
  const secondaryTextColor = useColorModeValue('gray.500', 'gray.400');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Auto-scroll to highlighted item
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const highlightedItem = dropdownRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedItem) {
        highlightedItem.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        });
      }
    }
  }, [highlightedIndex]);

  if (!isOpen) {
    return null;
  }

  const renderSuggestionItem = (suggestion: AddressSuggestion, index: number) => {
    const isHighlighted = index === highlightedIndex;
    const IconComponent = AddressTypeIcons[suggestion.type] || FaMapMarkerAlt;
    const providerColor = ProviderColors[suggestion.provider as keyof typeof ProviderColors];
    const providerName = ProviderNames[suggestion.provider as keyof typeof ProviderNames];

    return (
      <Box
        key={suggestion.id}
        p={4}
        cursor="pointer"
        bg={isHighlighted ? hoverBgColor : 'transparent'}
        borderLeft={isHighlighted ? '4px solid' : '4px solid transparent'}
        borderLeftColor={isHighlighted ? `${providerColor}.400` : 'transparent'}
        _hover={{
          bg: hoverBgColor,
          borderLeftColor: `${providerColor}.400`,
        }}
        transition="all 0.2s ease"
        onClick={() => onSelect(suggestion)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(suggestion);
          }
        }}
      >
        <HStack spacing={3} align="start">
          {/* Address type icon */}
          <Box
            p={2}
            borderRadius="md"
            bg={`${providerColor}.100`}
            color={`${providerColor}.600`}
            flexShrink={0}
          >
            <Icon as={IconComponent} boxSize={4} />
          </Box>

          {/* Address content */}
          <VStack spacing={1} align="start" flex={1} minW={0}>
            <Text
              fontSize="sm"
              fontWeight="medium"
              color={textColor}
              noOfLines={1}
              wordBreak="break-word"
            >
              {suggestion.mainText}
            </Text>
            
            {suggestion.secondaryText && (
              <Text
                fontSize="xs"
                color={secondaryTextColor}
                noOfLines={1}
                wordBreak="break-word"
              >
                {suggestion.secondaryText}
              </Text>
            )}

            {/* Address components */}
            <HStack spacing={2} wrap="wrap">
              {suggestion.components.street && (
                <Badge size="sm" colorScheme="gray" fontSize="xs">
                  {suggestion.components.street}
                </Badge>
              )}
              {suggestion.components.city && (
                <Badge size="sm" colorScheme="gray" fontSize="xs">
                  {suggestion.components.city}
                </Badge>
              )}
              {suggestion.components.postcode && (
                <Badge size="sm" colorScheme="blue" fontSize="xs">
                  {suggestion.components.postcode}
                </Badge>
              )}
            </HStack>
          </VStack>

          {/* Provider and confidence indicators */}
          <VStack spacing={1} align="end" flexShrink={0}>
            {showProvider && (
              <Badge
                size="sm"
                colorScheme={providerColor}
                fontSize="xs"
                textTransform="none"
              >
                {providerName}
              </Badge>
            )}
            
            {/* Confidence indicator */}
            <Box
              w="full"
              h="2px"
              bg="gray.200"
              borderRadius="full"
              position="relative"
            >
              <Box
                w={`${suggestion.confidence * 100}%`}
                h="full"
                bg={`${providerColor}.400`}
                borderRadius="full"
                transition="width 0.3s ease"
              />
            </Box>
            
            <Text fontSize="xs" color={secondaryTextColor}>
              {Math.round(suggestion.confidence * 100)}%
            </Text>
          </VStack>
        </HStack>
      </Box>
    );
  };

  return (
    <Box
      ref={dropdownRef}
      position="absolute"
      top="100%"
      left={0}
      right={0}
      zIndex={1000}
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      boxShadow="lg"
      maxH={`${maxHeight}px`}
      overflowY="auto"
      overflowX="hidden"
      mt={1}
    >
      {loading && (
        <Box p={4} textAlign="center">
          <Spinner size="sm" color="blue.500" thickness="2px" />
          <Text fontSize="sm" color={secondaryTextColor} mt={2}>
            Searching addresses...
          </Text>
        </Box>
      )}

      {error && (
        <Box p={4} textAlign="center" color="red.500">
          <Text fontSize="sm" fontWeight="medium">
            Search Error
          </Text>
          <Text fontSize="xs" mt={1}>
            {error}
          </Text>
        </Box>
      )}

      {!loading && !error && suggestions.length === 0 && (
        <Box p={4} textAlign="center" color={secondaryTextColor}>
          <Text fontSize="sm">
            No addresses found
          </Text>
          <Text fontSize="xs" mt={1}>
            Try a different search term or check your spelling
          </Text>
        </Box>
      )}

      {!loading && !error && suggestions.length > 0 && (
        <VStack spacing={0} align="stretch">
          {/* Header */}
          <Box p={3} bg="gray.50" borderTopRadius="xl" _dark={{ bg: "gray.700" }}>
            <HStack justify="space-between">
              <Text fontSize="xs" fontWeight="medium" color={secondaryTextColor}>
                {suggestions.length} address{suggestions.length !== 1 ? 'es' : ''} found
              </Text>
              {showProvider && (
                <HStack spacing={2}>
                  {suggestions.map((suggestion, index) => (
                    <Badge
                      key={index}
                      size="sm"
                      colorScheme={ProviderColors[suggestion.provider as keyof typeof ProviderColors]}
                      fontSize="xs"
                    >
                      {ProviderNames[suggestion.provider as keyof typeof ProviderNames]}
                    </Badge>
                  )).filter((badge, index, arr) => 
                    arr.findIndex(b => b.key === badge.key) === index
                  )}
                </HStack>
              )}
            </HStack>
          </Box>

          <Divider />

          {/* Suggestions */}
          {suggestions.map((suggestion, index) => (
            <React.Fragment key={suggestion.id}>
              {renderSuggestionItem(suggestion, index)}
              {index < suggestions.length - 1 && <Divider />}
            </React.Fragment>
          ))}

          {/* Footer */}
          <Box p={3} bg="gray.50" borderBottomRadius="xl" _dark={{ bg: "gray.700" }}>
            <Text fontSize="xs" color={secondaryTextColor} textAlign="center">
              Use ↑↓ to navigate, Enter to select, Esc to close
            </Text>
          </Box>
        </VStack>
      )}
    </Box>
  );
};

export default AddressSuggestionDropdown;
