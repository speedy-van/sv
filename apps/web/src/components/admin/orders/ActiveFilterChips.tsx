'use client';

import React from 'react';
import { HStack, Badge, IconButton, Text, Box } from '@chakra-ui/react';
import { FaTimes } from 'react-icons/fa';

export interface ActiveFilter {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
  colorScheme?: string;
}

interface ActiveFilterChipsProps {
  filters: ActiveFilter[];
  onClearAll?: () => void;
  showSummary?: boolean;
  totalCount?: number;
  filteredCount?: number;
}

/**
 * Active Filter Chips Component
 * 
 * Displays currently active filters as removable chips.
 * Shows filter summary and clear all option.
 */
export function ActiveFilterChips({
  filters,
  onClearAll,
  showSummary = true,
  totalCount,
  filteredCount,
}: ActiveFilterChipsProps) {
  if (filters.length === 0 && !showSummary) {
    return null;
  }

  return (
    <Box mb={3}>
      <HStack spacing={2} flexWrap="wrap" align="center">
        {showSummary && (
          <Text fontSize="sm" color="gray.400" fontWeight="medium" mr={2}>
            {filteredCount !== undefined && totalCount !== undefined ? (
              <>
                Showing <Text as="span" color="white" fontWeight="bold">{filteredCount}</Text> of{' '}
                <Text as="span" color="gray.500">{totalCount}</Text> orders
              </>
            ) : (
              'Active filters:'
            )}
          </Text>
        )}

        {filters.map((filter) => (
          <Badge
            key={filter.id}
            colorScheme={filter.colorScheme || 'blue'}
            variant="solid"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="xs"
            fontWeight="semibold"
            display="flex"
            alignItems="center"
            gap={2}
            boxShadow="0 2px 8px rgba(0, 0, 0, 0.3)"
          >
            <Text>{filter.label}: {filter.value}</Text>
            <IconButton
              aria-label={`Remove ${filter.label} filter`}
              icon={<FaTimes />}
              size="xs"
              variant="ghost"
              color="white"
              _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
              onClick={(e) => {
                e.stopPropagation();
                filter.onRemove();
              }}
              h="16px"
              minW="16px"
            />
          </Badge>
        ))}

        {filters.length > 0 && onClearAll && (
          <Badge
            as="button"
            onClick={onClearAll}
            colorScheme="gray"
            variant="outline"
            px={3}
            py={1}
            borderRadius="full"
            fontSize="xs"
            fontWeight="semibold"
            cursor="pointer"
            borderColor="gray.600"
            color="gray.300"
            _hover={{
              bg: 'gray.700',
              borderColor: 'gray.500',
              color: 'white',
            }}
          >
            Clear All
          </Badge>
        )}
      </HStack>
    </Box>
  );
}

