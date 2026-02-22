'use client';

/**
 * Comprehensive Selected Items Manager for Multi-leg Bookings
 * Displays items per segment with journey switcher
 * Updated: 2025-12-25 - Added journey isolation and switcher
 */

import React, { useState } from 'react';
import {
  Box,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
  Text,
  HStack,
  Icon,
  Circle,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Flex,
} from '@chakra-ui/react';
import { FaArrowRight, FaUndo, FaRoute, FaCubes, FaBox, FaChevronDown, FaChevronUp } from 'react-icons/fa';
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
  // Sort segments: Outbound -> Return -> Additional (consistent across mobile/desktop)
  const sortedSegmentsWithIndices = segments.map((segment, index) => ({
    segment,
    originalIndex: index,
  })).sort((a, b) => {
    const order: Record<string, number> = {
      'outbound': 1,
      'return': 2,
      'additional': 3,
    };
    const aOrder = order[a.segment.segmentType] || 99;
    const bOrder = order[b.segment.segmentType] || 99;
    return aOrder - bOrder;
  });

  // Internal state for journey switcher - use SORTED index, not original
  const [selectedSortedIndex, setSelectedSortedIndex] = useState(0);
  
  console.log('🔍 STATE DEBUG:', {
    selectedSortedIndex,
    sorted: sortedSegmentsWithIndices.map((s, i) => `${i}:${s.segment.segmentType}`)
  });
  
  // Helper function to get segment label
  const getSegmentLabel = (segment: BookingSegment, index: number) => {
    if (segment.segmentType === 'outbound') return 'Outbound';
    if (segment.segmentType === 'return') return 'Return';
    return `Journey ${index + 1}`;
  };
  
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
          accentColor: 'blue.500',
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
          accentColor: 'green.500',
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
          accentColor: 'purple.500',
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
          accentColor: 'gray.500',
        };
    }
  };

  // Multi-leg - show items per segment with journey switcher
  return (
    <VStack spacing={0} align="stretch">
      {/* Journey Switcher Header - Mobile-First Horizontal Scrollable Chips */}
      <Box 
        bg="rgba(0,0,0,0.3)"
        borderTopRadius="xl"
        p={{ base: 3, sm: 3.5, md: 4 }}
        borderBottom="3px solid"
        borderColor="purple.400"
        w="100%"
        overflow="visible"
        position="relative"
      >
        <Text 
          fontSize={{ base: 'sm', md: 'md' }} 
          fontWeight="700" 
          color="white" 
          mb={3}
          textAlign="center"
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
          px={2}
        >
          Select Journey to View/Edit Items:
        </Text>
        
        {/* Mobile Horizontal Scrollable Buttons (iPhone) */}
        <Box 
          display={{ base: 'block', md: 'none' }} 
          w="100%"
          position="relative"
          sx={{
            '@media (max-width: 767px)': {
              display: 'block',
            },
            '@media (min-width: 768px)': {
              display: 'none',
            },
          }}
        >
          {/* Scroll fade indicator on right */}
          <Box
            position="absolute"
            top={0}
            right={0}
            bottom={0}
            width="40px"
            bgGradient="linear(to-r, transparent, rgba(26,32,44,0.9))"
            pointerEvents="none"
            zIndex={2}
          />
          <Box
            overflowX="auto"
            overflowY="hidden"
            w="100%"
            pb={2}
            css={{
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              '&::-webkit-scrollbar': {
                height: '8px',
                display: 'block',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255,255,255,0.5)',
                borderRadius: '4px',
              },
            }}
          >
            <HStack
              spacing={2}
              flexWrap="nowrap"
              minW="max-content"
              px={1}
            >
              {sortedSegmentsWithIndices.map(({ segment, originalIndex }, sortedIndex) => {
                const config = getSegmentConfig(segment.segmentType);
                const itemsCount = (segment.items || []).length;
                const totalQuantity = (segment.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
                const isSelected = selectedSortedIndex === sortedIndex;
                const label = getSegmentLabel(segment, originalIndex);
                
                return (
                  <Button
                    key={segment.id || originalIndex}
                    onClick={() => setSelectedSortedIndex(sortedIndex)}
                    bg={isSelected ? config.gradient : "rgba(255,255,255,0.15)"}
                    color="white"
                    border="2px solid"
                    borderColor={isSelected ? config.accentColor : "whiteAlpha.300"}
                    borderRadius="full"
                    px={4}
                    py={3}
                    h="auto"
                    minW="100px"
                    maxW="140px"
                    flexShrink={0}
                    fontWeight="700"
                    fontSize="sm"
                    boxShadow={isSelected ? "0 4px 12px rgba(0,0,0,0.2)" : "none"}
                    _hover={{
                      bg: isSelected ? config.gradient : 'rgba(255,255,255,0.25)',
                      transform: 'translateY(-1px)',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    sx={{
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <HStack spacing={1.5} flexShrink={0}>
                      <Icon as={config.icon} boxSize={3.5} />
                      <Text whiteSpace="nowrap" fontSize="inherit" fontWeight="inherit">
                        {label}
                      </Text>
                      {itemsCount > 0 && (
                        <Badge
                          bg={isSelected ? "whiteAlpha.900" : "whiteAlpha.600"}
                          color={isSelected ? config.accentColor : "white"}
                          fontSize="10px"
                          borderRadius="full"
                          px={1.5}
                          py={0.5}
                          fontWeight="800"
                        >
                          {totalQuantity}
                        </Badge>
                      )}
                    </HStack>
                  </Button>
                );
              })}
            </HStack>
          </Box>
        </Box>

        {/* Desktop Horizontal Tabs */}
        <Tabs 
          index={selectedSortedIndex} 
          onChange={setSelectedSortedIndex}
          variant="unstyled"
          w="100%"
          display={{ base: 'none', md: 'block' }}
          sx={{
            '@media (max-width: 768px)': {
              display: 'none',
            },
          }}
        >
          <Box
            position="relative"
            overflowX="auto"
            overflowY="hidden"
            w="100%"
            maxW="100%"
            css={{
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255,255,255,0.4) rgba(255,255,255,0.1)',
              '&::-webkit-scrollbar': {
                height: '6px',
                display: 'block',
                WebkitAppearance: 'none',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '6px',
                WebkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.1)',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255,255,255,0.5)',
                borderRadius: '6px',
                WebkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.2)',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: 'rgba(255,255,255,0.7)',
              },
            }}
            sx={{
              '@supports (-webkit-overflow-scrolling: touch)': {
                WebkitOverflowScrolling: 'touch',
                overflowX: 'scroll',
              },
            }}
          >
            <HStack
              spacing={{ base: 2.5, sm: 3, md: 3 }}
              align="stretch"
              flexWrap="nowrap"
              minW="max-content"
              pb={2}
              px={{ base: 1, sm: 2 }}
              w="max-content"
            >
              {sortedSegmentsWithIndices.map(({ segment, originalIndex }, sortedIndex) => {
                const config = getSegmentConfig(segment.segmentType);
                const itemsCount = (segment.items || []).length;
                const totalQuantity = (segment.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
                const isSelected = selectedSortedIndex === sortedIndex;
                
                return (
                  <Tab 
                    key={segment.id || originalIndex}
                    as={Button}
                    fontSize={{ base: 'xs', sm: 'sm', md: 'md' }}
                    fontWeight={isSelected ? "800" : "600"}
                    flexShrink={0}
                    whiteSpace="nowrap"
                    px={{ base: 4, sm: 5, md: 6 }}
                    py={{ base: 2.5, sm: 3, md: 3.5 }}
                    h="auto"
                    minH={{ base: '40px', sm: '44px', md: '48px' }}
                    minW={{ base: '100px', sm: '120px', md: '140px' }}
                    color={isSelected ? "white" : "whiteAlpha.800"}
                    bg={isSelected ? config.gradient : "rgba(255,255,255,0.15)"}
                    border="2px solid"
                    borderColor={isSelected ? config.accentColor : "whiteAlpha.300"}
                    borderRadius="full"
                    boxShadow={isSelected ? "0 4px 12px rgba(0,0,0,0.2)" : "none"}
                    transition="all 0.2s ease"
                    _hover={{
                      bg: isSelected ? config.gradient : 'rgba(255,255,255,0.25)',
                      borderColor: isSelected ? config.accentColor : 'whiteAlpha.400',
                      transform: 'translateY(-1px)',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    sx={{
                      touchAction: 'manipulation',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                    onClick={() => setSelectedSortedIndex(sortedIndex)}
                  >
                    <HStack spacing={1.5} flexShrink={0}>
                      <Icon as={config.icon} boxSize={{ base: 3, sm: 3.5, md: 4 }} />
                      <Text 
                        fontSize="inherit" 
                        fontWeight="inherit" 
                        whiteSpace="nowrap" 
                        color="inherit"
                        lineHeight="1"
                      >
                        {getSegmentLabel(segment, originalIndex)}
                      </Text>
                      {itemsCount > 0 && (
                        <Badge 
                          bg={isSelected ? "whiteAlpha.900" : "whiteAlpha.600"}
                          color={isSelected ? config.accentColor : "white"}
                          fontSize={{ base: '9px', sm: '10px', md: 'xs' }}
                          borderRadius="full"
                          px={1.5}
                          py={0.5}
                          minW="20px"
                          textAlign="center"
                          fontWeight="800"
                          lineHeight="1"
                        >
                          {totalQuantity}
                        </Badge>
                      )}
                    </HStack>
                  </Tab>
                );
              })}
            </HStack>
          </Box>

          {/* Desktop TabPanels */}
          <TabPanels mt={4}>
            {sortedSegmentsWithIndices.map(({ segment, originalIndex }) => {
              const segmentItems = segment.items || [];
              const segmentLabel = segment.segmentType === 'outbound' 
                ? 'Outbound Journey'
                : segment.segmentType === 'return'
                ? 'Return Journey'
                : `Additional Journey ${originalIndex + 1}`;
              
              return (
                <TabPanel key={segment.id || originalIndex} px={0} py={4}>
                  <SelectedItemsCard
                    items={segmentItems}
                    onIncrement={(itemId) => onIncrement(originalIndex, itemId)}
                    onDecrement={(itemId) => onDecrement(originalIndex, itemId)}
                    onRemove={(itemId) => onRemove(originalIndex, itemId)}
                    segmentLabel={segmentLabel}
                    showPricing={showPricing}
                    readonly={readonly}
                    segmentType={segment.segmentType as 'outbound' | 'return' | 'additional'}
                  />
                </TabPanel>
              );
            })}
          </TabPanels>
        </Tabs>

        {/* Mobile Content Area - Shows selected journey items */}
        <Box 
          mt={4} 
          w="100%" 
          display={{ base: 'block', md: 'none' }}
          sx={{
            '@media (max-width: 767px)': {
              display: 'block',
            },
            '@media (min-width: 768px)': {
              display: 'none',
            },
          }}
        >
          {sortedSegmentsWithIndices.map(({ segment, originalIndex }, sortedIndex) => {
            const segmentItems = segment.items || [];
            const segmentLabel = segment.segmentType === 'outbound' 
              ? 'Outbound Journey'
              : segment.segmentType === 'return'
              ? 'Return Journey'
              : `Additional Journey ${originalIndex + 1}`;
            
            const isVisible = selectedSortedIndex === sortedIndex;
            
            return (
              <Box 
                key={segment.id || originalIndex}
                display={isVisible ? 'block' : 'none'}
                w="100%"
              >
                <SelectedItemsCard
                  items={segmentItems}
                  onIncrement={(itemId) => onIncrement(originalIndex, itemId)}
                  onDecrement={(itemId) => onDecrement(originalIndex, itemId)}
                  onRemove={(itemId) => onRemove(originalIndex, itemId)}
                  segmentLabel={segmentLabel}
                  showPricing={showPricing}
                  readonly={readonly}
                  segmentType={segment.segmentType as 'outbound' | 'return' | 'additional'}
                />
              </Box>
            );
          })}
        </Box>
      </Box>
    </VStack>
  );
}
