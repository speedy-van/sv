'use client';

import React from 'react';
import {
  Box,
  Badge,
  HStack,
  Icon,
  Text,
  Button,
  Tooltip,
  Alert,
  AlertIcon,
  VStack,
} from '@chakra-ui/react';
import { FaShieldAlt, FaStar, FaExclamationTriangle } from 'react-icons/fa';
import {
  getCategoryIcon,
  CATEGORY_DISPLAY_NAMES,
  formatCurrency,
  type SpecializedItemCategory,
} from '@/types/specialized-logistics';

interface SpecializedItemBadgeProps {
  category: SpecializedItemCategory;
  isConfigured: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Badge component that shows specialized item status and allows configuration
 */
export function SpecializedItemBadge({
  category,
  isConfigured,
  onClick,
  size = 'md',
}: SpecializedItemBadgeProps) {
  const icon = getCategoryIcon(category);
  const displayName = CATEGORY_DISPLAY_NAMES[category];

  return (
    <Tooltip
      label={
        isConfigured
          ? `${displayName} - Configured ✓`
          : `Click to configure ${displayName}`
      }
      placement="top"
    >
      <Badge
        colorScheme={isConfigured ? 'green' : 'orange'}
        cursor="pointer"
        onClick={onClick}
        px={size === 'sm' ? 2 : 3}
        py={size === 'sm' ? 0.5 : 1}
        borderRadius="full"
        fontSize={size === 'sm' ? 'xs' : 'sm'}
        display="inline-flex"
        alignItems="center"
        gap={1}
        _hover={{
          transform: 'scale(1.05)',
          shadow: 'md',
        }}
        transition="all 0.2s"
      >
        <Text>{icon}</Text>
        <Text>
          {isConfigured ? 'Configured' : 'Setup Required'}
        </Text>
        {isConfigured && <Icon as={FaStar} boxSize={2} />}
      </Badge>
    </Tooltip>
  );
}

interface SpecializedItemWarningProps {
  itemName: string;
  category: SpecializedItemCategory;
  reason: string;
  onConfigure: () => void;
}

/**
 * Warning alert shown for items requiring specialized handling
 */
export function SpecializedItemWarning({
  itemName,
  category,
  reason,
  onConfigure,
}: SpecializedItemWarningProps) {
  const icon = getCategoryIcon(category);
  const displayName = CATEGORY_DISPLAY_NAMES[category];

  return (
    <Alert
      status="warning"
      borderRadius="md"
      variant="left-accent"
      py={3}
      px={4}
    >
      <AlertIcon />
      <Box flex="1">
        <HStack spacing={2} mb={1}>
          <Text fontSize="lg">{icon}</Text>
          <Text fontSize="sm" fontWeight="bold">
            Specialized Item: {itemName}
          </Text>
        </HStack>
        <Text fontSize="xs" color="gray.700" mb={2}>
          {reason}
        </Text>
        <Button
          size="sm"
          colorScheme="orange"
          onClick={onConfigure}
          leftIcon={<Icon as={FaShieldAlt} />}
        >
          Configure {displayName}
        </Button>
      </Box>
    </Alert>
  );
}

interface SpecializedItemsSummaryProps {
  specializedItems: Array<{
    id: string;
    category: SpecializedItemCategory;
    declaredValue: number;
    insuranceTier?: string;
    premium: number;
  }>;
  totalPremium: number;
}

/**
 * Summary component showing all specialized items and total insurance cost
 */
export function SpecializedItemsSummary({
  specializedItems,
  totalPremium,
}: SpecializedItemsSummaryProps) {
  if (specializedItems.length === 0) {
    return null;
  }

  return (
    <Box
      borderWidth={1}
      borderRadius="md"
      p={4}
      bg="blue.50"
      borderColor="blue.200"
    >
      <HStack spacing={2} mb={3}>
        <Icon as={FaShieldAlt} color="blue.600" />
        <Text fontSize="sm" fontWeight="bold" color="blue.900">
          Specialized Items ({specializedItems.length})
        </Text>
      </HStack>

      <VStack align="stretch" spacing={2}>
        {specializedItems.map((item) => {
          const icon = getCategoryIcon(item.category);
          const displayName = CATEGORY_DISPLAY_NAMES[item.category];

          return (
            <HStack key={item.id} justify="space-between" fontSize="xs">
              <HStack spacing={2}>
                <Text>{icon}</Text>
                <Text color="gray.700">{displayName}</Text>
                {item.insuranceTier && (
                  <Badge colorScheme="purple" fontSize="xs">
                    {item.insuranceTier}
                  </Badge>
                )}
              </HStack>
              <Text fontWeight="medium" color="blue.700">
                {formatCurrency(item.declaredValue)}
              </Text>
            </HStack>
          );
        })}

        {totalPremium > 0 && (
          <>
            <Box borderTopWidth={1} borderColor="blue.300" pt={2} mt={1}>
              <HStack justify="space-between">
                <Text fontSize="sm" fontWeight="bold" color="blue.900">
                  Total Insurance:
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="blue.700">
                  {formatCurrency(totalPremium)}
                </Text>
              </HStack>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
}

interface SpecializedItemIndicatorProps {
  isSpecialized: boolean;
  isConfigured: boolean;
  onClick?: () => void;
}

/**
 * Small indicator icon shown on item cards
 */
export function SpecializedItemIndicator({
  isSpecialized,
  isConfigured,
  onClick,
}: SpecializedItemIndicatorProps) {
  if (!isSpecialized) {
    return null;
  }

  return (
    <Tooltip
      label={isConfigured ? 'Specialized item configured' : 'Needs configuration'}
      placement="top"
    >
      <Box
        position="absolute"
        top={2}
        right={2}
        cursor={onClick ? 'pointer' : 'default'}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <Icon
          as={isConfigured ? FaStar : FaExclamationTriangle}
          color={isConfigured ? 'green.500' : 'orange.500'}
          boxSize={4}
          filter="drop-shadow(0 0 2px rgba(0,0,0,0.3))"
        />
      </Box>
    </Tooltip>
  );
}
