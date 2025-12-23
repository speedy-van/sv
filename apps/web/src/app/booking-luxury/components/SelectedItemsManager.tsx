'use client';

/**
 * Comprehensive Selected Items Manager for Multi-leg Bookings
 * Displays items per segment with full control
 */

import React from 'react';
import {
  Box,
  VStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  Text,
  HStack,
  Icon,
  Circle,
} from '@chakra-ui/react';
import { FaArrowRight, FaUndo, FaRoute, FaCubes, FaBox } from 'react-icons/fa';
import SelectedItemsCard from './SelectedItemsCard';
import type { BookingSegment } from '../types/segment';

interface SelectedItemsManagerProps {
  segments: BookingSegment[];
  isMultiLeg: boolean;
  globalItems: any[];
  onIncrement: (segmentIndex: number | null, itemId: string) => void;
  onDecrement: (segmentIndex: number | null, itemId: string) => void;
  onRemove: (segmentIndex: number | null, itemId: string) => void;
  showPricing?: boolean;
  readonly?: boolean;
  currentSegmentIndex?: number;
}

export default function SelectedItemsManager({
  segments,
  isMultiLeg,
  globalItems,
  onIncrement,
  onDecrement,
  onRemove,
  showPricing = false,
  readonly = false,
  currentSegmentIndex,
}: SelectedItemsManagerProps) {
  
  if (!isMultiLeg) {
    // Single journey - show global items only
    return (
      <SelectedItemsCard
        items={globalItems}
        onIncrement={(itemId) => onIncrement(null, itemId)}
        onDecrement={(itemId) => onDecrement(null, itemId)}
        onRemove={(itemId) => onRemove(null, itemId)}
        showPricing={showPricing}
        readonly={readonly}
        segmentType="outbound"
      />
    );
  }

  // Color scheme per segment type
  const getSegmentConfig = (segmentType: string) => {
    switch (segmentType) {
      case 'outbound':
        return { 
          borderColor: 'blue.200', 
          activeBorder: 'blue.400', 
          bg: 'blue.50', 
          hover: 'blue.100', 
          badge: 'blue',
          gradient: 'linear(to-r, blue.400, blue.500)',
          icon: FaArrowRight,
          iconColor: 'blue.500',
        };
      case 'return':
        return { 
          borderColor: 'green.200', 
          activeBorder: 'green.400', 
          bg: 'green.50', 
          hover: 'green.100', 
          badge: 'green',
          gradient: 'linear(to-r, green.400, green.500)',
          icon: FaUndo,
          iconColor: 'green.500',
        };
      case 'additional':
        return { 
          borderColor: 'purple.200', 
          activeBorder: 'purple.400', 
          bg: 'purple.50', 
          hover: 'purple.100', 
          badge: 'purple',
          gradient: 'linear(to-r, purple.400, purple.500)',
          icon: FaRoute,
          iconColor: 'purple.500',
        };
      default:
        return { 
          borderColor: 'gray.200', 
          activeBorder: 'gray.400', 
          bg: 'gray.50', 
          hover: 'gray.100', 
          badge: 'gray',
          gradient: 'linear(to-r, gray.400, gray.500)',
          icon: FaBox,
          iconColor: 'gray.500',
        };
    }
  };

  // Multi-leg - show items per segment
  return (
    <VStack spacing={4} align="stretch">
      <Accordion
        allowMultiple
        defaultIndex={currentSegmentIndex !== undefined ? [currentSegmentIndex] : [0]}
      >
        {segments.map((segment, segmentIndex) => {
          const segmentItems = segment.items || [];
          const itemsCount = segmentItems.length;
          const totalQuantity = segmentItems.reduce((sum, item) => sum + item.quantity, 0);
          const segmentLabel = segment.segmentType === 'outbound' 
            ? 'Outbound Journey'
            : segment.segmentType === 'return'
            ? 'Return Journey'
            : `Additional Journey ${segmentIndex}`;
          
          const config = getSegmentConfig(segment.segmentType);

          return (
            <AccordionItem
              key={segment.id || segmentIndex}
              border="2px solid"
              borderColor={config.borderColor}
              borderRadius="xl"
              mb={3}
              overflow="hidden"
              transition="all 0.2s"
              _expanded={{
                borderColor: config.activeBorder,
                boxShadow: 'lg',
              }}
            >
              <AccordionButton
                py={4}
                px={4}
                _hover={{ bg: config.hover }}
                borderRadius="lg"
              >
                <HStack flex="1" spacing={4}>
                  <Circle 
                    size="45px" 
                    bg={config.bg}
                    boxShadow="0 2px 8px rgba(0,0,0,0.08)"
                  >
                    <Icon as={config.icon} boxSize={5} color={config.iconColor} />
                  </Circle>
                  <Box flex="1" textAlign="left">
                    <HStack spacing={2} mb={1}>
                      <Text fontWeight="bold" fontSize="md" color="gray.800">
                        {segmentLabel}
                      </Text>
                      {segmentIndex === currentSegmentIndex && (
                        <Badge colorScheme="green" fontSize="xs" borderRadius="full">
                          Current
                        </Badge>
                      )}
                    </HStack>
                    <HStack spacing={3} fontSize="sm" color="gray.600">
                      <HStack spacing={1}>
                        <Icon as={FaCubes} boxSize={3} />
                        <Text>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</Text>
                      </HStack>
                      <Text>•</Text>
                      <HStack spacing={1}>
                        <Icon as={FaBox} boxSize={3} />
                        <Text>{totalQuantity} qty</Text>
                      </HStack>
                    </HStack>
                  </Box>
                </HStack>
                <AccordionIcon boxSize={6} color={config.iconColor} />
              </AccordionButton>

              <AccordionPanel pb={4} pt={2} px={3} bg={config.bg}>
                <SelectedItemsCard
                  items={segmentItems}
                  onIncrement={(itemId) => onIncrement(segmentIndex, itemId)}
                  onDecrement={(itemId) => onDecrement(segmentIndex, itemId)}
                  onRemove={(itemId) => onRemove(segmentIndex, itemId)}
                  segmentLabel={segmentLabel}
                  showPricing={showPricing}
                  readonly={readonly}
                  segmentType={segment.segmentType as 'outbound' | 'return' | 'additional'}
                />
              </AccordionPanel>
            </AccordionItem>
          );
        })}
      </Accordion>
    </VStack>
  );
}
