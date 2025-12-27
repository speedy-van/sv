'use client';

import React, { useState } from 'react';
import {
  HStack,
  Button,
  Badge,
  Icon,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Tooltip,
  Text,
} from '@chakra-ui/react';
import {
  FiFilter,
  FiX,
  FiChevronDown,
  FiClock,
  FiDollarSign,
  FiAlertCircle,
  FiCheckCircle,
  FiUser,
  FiTruck,
} from 'react-icons/fi';

export interface QuickFilter {
  id: string;
  label: string;
  icon?: any;
  value: string;
  color?: string;
  count?: number;
}

interface QuickFiltersBarProps {
  filters: QuickFilter[];
  activeFilters: string[];
  onFilterToggle: (filterId: string) => void;
  onClearAll?: () => void;
  showCounts?: boolean;
  maxVisible?: number;
}

export function QuickFiltersBar({
  filters,
  activeFilters,
  onFilterToggle,
  onClearAll,
  showCounts = true,
  maxVisible = 8,
}: QuickFiltersBarProps) {
  const [showAll, setShowAll] = useState(false);
  const textColor = useColorModeValue('#FFFFFF', '#FFFFFF');
  const borderColor = useColorModeValue('#333333', '#333333');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  const visibleFilters = showAll ? filters : filters.slice(0, maxVisible);
  const hiddenFilters = filters.slice(maxVisible);

  const isActive = (filterId: string) => activeFilters.includes(filterId);

  const defaultFilters: QuickFilter[] = [
    {
      id: 'pending',
      label: 'Pending',
      icon: FiClock,
      value: 'pending',
      color: '#f59e0b',
    },
    {
      id: 'confirmed',
      label: 'Confirmed',
      icon: FiCheckCircle,
      value: 'confirmed',
      color: '#2563eb',
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      icon: FiTruck,
      value: 'in_progress',
      color: '#06b6d4',
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: FiCheckCircle,
      value: 'completed',
      color: '#10b981',
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      icon: FiX,
      value: 'cancelled',
      color: '#ef4444',
    },
    {
      id: 'unpaid',
      label: 'Unpaid',
      icon: FiDollarSign,
      value: 'unpaid',
      color: '#f59e0b',
    },
    {
      id: 'high_priority',
      label: 'High Priority',
      icon: FiAlertCircle,
      value: 'high_priority',
      color: '#ef4444',
    },
    {
      id: 'with_driver',
      label: 'With Driver',
      icon: FiUser,
      value: 'with_driver',
      color: '#9333ea',
    },
  ];

  const allFilters = filters.length > 0 ? filters : defaultFilters;

  return (
    <HStack spacing={2} flexWrap="wrap" align="center">
      <Icon as={FiFilter} color={secondaryTextColor} boxSize={4} />
      
      {visibleFilters.map((filter) => {
        const active = isActive(filter.id);
        const IconComponent = filter.icon;

        return (
          <Button
            key={filter.id}
            size="sm"
            onClick={() => onFilterToggle(filter.id)}
            leftIcon={IconComponent ? <IconComponent /> : undefined}
            variant={active ? 'solid' : 'outline'}
            bg={active ? (filter.color || '#2563eb') : 'transparent'}
            color={active ? '#FFFFFF' : textColor}
            borderColor={active ? (filter.color || '#2563eb') : borderColor}
            borderWidth={1}
            _hover={{
              bg: active ? (filter.color || '#2563eb') : '#1a1a1a',
              borderColor: filter.color || '#2563eb',
            }}
          >
            {filter.label}
            {showCounts && filter.count !== undefined && (
              <Badge
                ml={2}
                bg={active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)'}
                color={active ? '#FFFFFF' : secondaryTextColor}
                borderRadius="full"
                px={2}
                py={0.5}
                fontSize="xs"
              >
                {filter.count}
              </Badge>
            )}
          </Button>
        );
      })}

      {hiddenFilters.length > 0 && (
        <Menu>
          <MenuButton
            as={Button}
            size="sm"
            variant="outline"
            borderColor={borderColor}
            color={textColor}
            rightIcon={<FiChevronDown />}
            _hover={{ bg: '#1a1a1a' }}
          >
            More ({hiddenFilters.length})
          </MenuButton>
          <MenuList bg="#111111" borderColor={borderColor} minW="200px">
            {hiddenFilters.map((filter) => {
              const active = isActive(filter.id);
              const IconComponent = filter.icon;

              return (
                <MenuItem
                  key={filter.id}
                  icon={IconComponent ? <IconComponent /> : undefined}
                  onClick={() => onFilterToggle(filter.id)}
                  bg="#111111"
                  color={active ? (filter.color || '#2563eb') : textColor}
                  _hover={{ bg: '#1a1a1a' }}
                >
                  <HStack justify="space-between" w="100%">
                    <Text>{filter.label}</Text>
                    {active && (
                      <Badge colorScheme="blue" size="sm">
                        Active
                      </Badge>
                    )}
                    {showCounts && filter.count !== undefined && (
                      <Badge size="sm" colorScheme="gray">
                        {filter.count}
                      </Badge>
                    )}
                  </HStack>
                </MenuItem>
              );
            })}
          </MenuList>
        </Menu>
      )}

      {activeFilters.length > 0 && onClearAll && (
        <Tooltip label="Clear all filters">
          <IconButton
            aria-label="Clear all filters"
            icon={<FiX />}
            size="sm"
            variant="ghost"
            onClick={onClearAll}
            color={textColor}
            _hover={{ bg: '#1a1a1a', color: '#ef4444' }}
          />
        </Tooltip>
      )}
    </HStack>
  );
}

