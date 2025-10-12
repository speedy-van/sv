/**
 * Enhanced Bedroom-Based Item Selection Component
 * 
 * Provides immediate display of items when bedroom size is selected
 * with intuitive +/- quantity controls for each item
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Badge,
  Card,
  CardBody,
  Icon,
  SimpleGrid,
  IconButton,
  Flex,
  Circle,
  Divider,
  Image,
  Spinner
} from '@chakra-ui/react';
import { 
  FaHome, 
  FaBed, 
  FaPlus, 
  FaMinus, 
  FaStar,
  FaCouch,
  FaUtensils,
  FaBath,
  FaBox
} from 'react-icons/fa';

import { 
  HOME_SIZE_PRESETS, 
  HomeSizePreset, 
  getSuggestedItemsForHomeSize
} from '../../../lib/items/home-size-presets';

import type { Item } from '../../../lib/booking/utils';

interface BedroomItemSelectionProps {
  selectedHomeSize?: string;
  onHomeSizeChange: (homeSizeId: string | null) => void;
  onItemQuantityChange: (itemId: string, quantity: number) => void;
  availableItems: Item[];
  selectedItems: Item[];
}

// Enhanced bedroom icons for better visual distinction
const BEDROOM_ICONS = {
  '1-bedroom': { icon: '🏠', gradient: 'linear(to-r, blue.400, blue.600)' },
  '2-bedroom': { icon: '🏡', gradient: 'linear(to-r, green.400, green.600)' },
  '3-bedroom': { icon: '🏘️', gradient: 'linear(to-r, orange.400, orange.600)' },
  '4-bedroom': { icon: '🏠', gradient: 'linear(to-r, purple.400, purple.600)' },
  '5-bedroom': { icon: '🏰', gradient: 'linear(to-r, pink.400, pink.600)' },
  '6-bedroom-plus': { icon: '🏛️', gradient: 'linear(to-r, red.400, red.600)' }
};

// Room category icons
const ROOM_ICONS = {
  bedroom: FaBed,
  living: FaCouch,
  kitchen: FaUtensils,
  bathroom: FaBath,
  storage: FaBox,
  general: FaHome
};

export default function BedroomItemSelection({
  selectedHomeSize,
  onHomeSizeChange,
  onItemQuantityChange,
  availableItems,
  selectedItems
}: BedroomItemSelectionProps) {
  const [showAllItems, setShowAllItems] = useState(false);

  // Get current preset and suggested items
  const currentPreset = selectedHomeSize 
    ? HOME_SIZE_PRESETS.find(preset => preset.id === selectedHomeSize)
    : null;

  const suggestedItems = useMemo(() => {
    if (!currentPreset) return [];
    
    const suggestions = getSuggestedItemsForHomeSize(currentPreset.id);
    
    // Map suggestions to actual items with fallback
    return suggestions.map(suggestion => {
      // Try to find exact match first
      let matchedItem = availableItems.find(item => item.id === suggestion.id);
      
      // If no exact match, try partial name matching
      if (!matchedItem) {
        const searchName = suggestion.name.toLowerCase();
        matchedItem = availableItems.find(item => 
          item.name.toLowerCase().includes(searchName.split(' ')[0]) ||
          searchName.includes(item.name.toLowerCase().split(' ')[0])
        );
      }
      
      // Return suggestion with matched item data or defaults
      return {
        ...suggestion,
        actualItem: matchedItem,
        displayName: matchedItem?.name || suggestion.name,
        unitPrice: matchedItem?.unitPrice || 25,
        image: matchedItem?.image || `/items/defaults/${suggestion.category}.png`,
        available: !!matchedItem
      };
    });
  }, [currentPreset, availableItems]);

  // Group items by priority and room
  const itemsByPriority = useMemo(() => {
    const essential = suggestedItems.filter(item => item.priority === 1);
    const common = suggestedItems.filter(item => item.priority === 2);
    const optional = suggestedItems.filter(item => item.priority === 3);
    
    return { essential, common, optional };
  }, [suggestedItems]);

  // Get current quantity for an item
  const getCurrentQuantity = (itemId: string) => {
    const selectedItem = selectedItems.find(item => item.id === itemId);
    return selectedItem?.quantity || 0;
  };

  // Handle quantity changes
  const handleQuantityChange = (suggestion: any, newQuantity: number) => {
    if (!suggestion.actualItem) return;
    
    onItemQuantityChange(suggestion.actualItem.id, newQuantity);
  };

  // Handle bedroom selection
  const handleBedroomSelect = (preset: HomeSizePreset) => {
    if (selectedHomeSize === preset.id) {
      onHomeSizeChange(null);
    } else {
      onHomeSizeChange(preset.id);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Enhanced Bedroom Selection */}
      <Card bg="white" borderRadius="xl" p={6} shadow="lg" borderWidth="2px" borderColor="blue.200">
        <VStack spacing={4} align="stretch">
          <VStack spacing={2} align="center">
            <Circle size="60px" bg="blue.500" color="white">
              <Icon as={FaHome} boxSize={8} />
            </Circle>
            <VStack spacing={1}>
              <Text fontSize="xl" fontWeight="bold" color="gray.800">
                Select Your Home Size
              </Text>
              <Text fontSize="sm" color="gray.600" textAlign="center">
                Choose your home size to see personalized item suggestions
              </Text>
            </VStack>
          </VStack>

          <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
            {HOME_SIZE_PRESETS.map((preset) => {
              const isSelected = selectedHomeSize === preset.id;
              const iconConfig = BEDROOM_ICONS[preset.id as keyof typeof BEDROOM_ICONS];
              
              return (
                <Button
                  key={preset.id}
                  variant="outline"
                  size="lg"
                  h="100px"
                  flexDirection="column"
                  onClick={() => handleBedroomSelect(preset)}
                  bg={isSelected ? iconConfig?.gradient : 'white'}
                  color={isSelected ? 'white' : 'gray.700'}
                  borderWidth="2px"
                  borderColor={isSelected ? 'transparent' : 'gray.300'}
                  borderRadius="xl"
                  _hover={{
                    bg: isSelected ? iconConfig?.gradient : 'gray.50',
                    borderColor: isSelected ? 'transparent' : 'blue.400',
                    transform: 'translateY(-2px)',
                    shadow: 'lg'
                  }}
                  _active={{
                    transform: 'translateY(0px)'
                  }}
                  transition="all 0.2s ease"
                  position="relative"
                  overflow="hidden"
                >
                  <VStack spacing={2}>
                    <Text fontSize="2xl" filter={isSelected ? 'brightness(1.2)' : 'none'}>
                      {iconConfig?.icon || preset.icon}
                    </Text>
                    <VStack spacing={0}>
                      <Text fontSize="sm" fontWeight="bold" textAlign="center" lineHeight="1.1">
                        {preset.name}
                      </Text>
                      <Text fontSize="xs" opacity={0.8} textAlign="center">
                        {preset.bedrooms} bedroom{preset.bedrooms > 1 ? 's' : ''}
                      </Text>
                    </VStack>
                  </VStack>
                  
                  {isSelected && (
                    <Badge
                      position="absolute"
                      top="8px"
                      right="8px"
                      colorScheme="green"
                      variant="solid"
                      borderRadius="full"
                      fontSize="xs"
                      px={2}
                    >
                      ✓
                    </Badge>
                  )}
                </Button>
              );
            })}
          </SimpleGrid>
        </VStack>
      </Card>

      {/* Immediate Item Display When Bedroom is Selected */}
      {currentPreset && (
        <VStack spacing={4} align="stretch">
          <Card bg="gradient-to-r from-blue.50 to-purple.50" borderRadius="xl" p={4}>
            <HStack justify="space-between" align="center">
              <HStack spacing={3}>
                <Text fontSize="2xl">
                  {BEDROOM_ICONS[currentPreset.id as keyof typeof BEDROOM_ICONS]?.icon || currentPreset.icon}
                </Text>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight="bold" color="blue.800">
                    {currentPreset.name} Selected
                  </Text>
                  <Text fontSize="sm" color="blue.600">
                    {currentPreset.description}
                  </Text>
                </VStack>
              </HStack>
              
              <VStack spacing={1} align="end">
                <Badge colorScheme="blue" variant="solid">
                  {itemsByPriority.essential.length} Essential Items
                </Badge>
                <Badge colorScheme="green" variant="outline">
                  {itemsByPriority.common.length} Common Items
                </Badge>
              </VStack>
            </HStack>
          </Card>

          {/* Essential Items - Always Shown */}
          <Card bg="white" borderRadius="xl" p={6} shadow="md">
            <VStack spacing={4} align="stretch">
              <HStack spacing={3}>
                <Circle size="40px" bg="red.500" color="white">
                  <Icon as={FaStar} boxSize={5} />
                </Circle>
                <VStack align="start" spacing={0}>
                  <Text fontSize="lg" fontWeight="bold" color="gray.800">
                    Essential Items
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Must-have items for your {currentPreset.name.toLowerCase()}
                  </Text>
                </VStack>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {itemsByPriority.essential.map((suggestion) => {
                  const currentQuantity = suggestion.actualItem 
                    ? getCurrentQuantity(suggestion.actualItem.id) 
                    : 0;
                  
                  return (
                    <Card
                      key={suggestion.id}
                      p={4}
                      border="2px solid"
                      borderColor={currentQuantity > 0 ? 'red.200' : 'gray.200'}
                      borderRadius="xl"
                      bg={currentQuantity > 0 ? 'red.50' : 'white'}
                      shadow="sm"
                      _hover={{ shadow: 'md', borderColor: 'red.300' }}
                      transition="all 0.2s"
                    >
                      <VStack spacing={3}>
                        <HStack spacing={3} w="full">
                          {/* Item Image */}
                          <Box w="50px" h="50px" flexShrink={0}>
                            <Image
                              src={suggestion.image}
                              alt={suggestion.displayName}
                              w="50px"
                              h="50px"
                              objectFit="cover"
                              borderRadius="lg"
                              fallback={
                                <Circle size="50px" bg="gray.100" color="gray.500">
                                  <Icon as={ROOM_ICONS[suggestion.room as keyof typeof ROOM_ICONS] || FaBox} />
                                </Circle>
                              }
                            />
                          </Box>
                          
                          {/* Item Info */}
                          <VStack align="start" spacing={1} flex="1">
                            <Text fontSize="sm" fontWeight="bold" color="gray.800" lineHeight="1.2">
                              {suggestion.displayName}
                            </Text>
                            <HStack spacing={2}>
                              <Badge size="sm" colorScheme="red" variant="outline">
                                Essential
                              </Badge>
                              {suggestion.room && (
                                <Badge size="sm" colorScheme="blue" variant="subtle">
                                  {suggestion.room}
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="xs" color="gray.600">
                              Suggested: {suggestion.suggestedQuantity}
                            </Text>
                          </VStack>
                        </HStack>

                        {/* Quantity Controls */}
                        <HStack spacing={3} w="full" justify="center">
                          <IconButton
                            size="sm"
                            colorScheme="red"
                            variant={currentQuantity > 0 ? "solid" : "ghost"}
                            aria-label="Decrease quantity"
                            icon={<FaMinus />}
                            onClick={() => {
                              if (currentQuantity > 0) {
                                handleQuantityChange(suggestion, currentQuantity - 1);
                              }
                            }}
                            isDisabled={!suggestion.actualItem || currentQuantity === 0}
                            borderRadius="full"
                            _hover={{ bg: currentQuantity > 0 ? 'red.600' : 'gray.100' }}
                          />
                          
                          <Box
                            px={4}
                            py={2}
                            bg={currentQuantity > 0 ? "red.100" : "gray.100"}
                            borderRadius="lg"
                            border="1px solid"
                            borderColor={currentQuantity > 0 ? "red.200" : "gray.300"}
                            minW="50px"
                            textAlign="center"
                          >
                            <Text fontWeight="bold" color={currentQuantity > 0 ? "red.800" : "gray.700"}>
                              {currentQuantity}
                            </Text>
                          </Box>
                          
                          <IconButton
                            size="sm"
                            colorScheme="green"
                            variant="solid"
                            aria-label="Increase quantity"
                            icon={<FaPlus />}
                            onClick={() => {
                              handleQuantityChange(suggestion, currentQuantity + 1);
                            }}
                            isDisabled={!suggestion.actualItem}
                            borderRadius="full"
                            _hover={{ bg: 'green.600' }}
                          />
                        </HStack>

                        {/* Price Info */}
                        {suggestion.actualItem && (
                          <Text fontSize="xs" color="gray.500" textAlign="center">
                            £{suggestion.unitPrice} each {currentQuantity > 0 && `• Total: £${(suggestion.unitPrice * currentQuantity).toFixed(2)}`}
                          </Text>
                        )}
                        
                        {!suggestion.available && (
                          <Badge colorScheme="orange" variant="subtle" fontSize="xs">
                            Item not in catalog
                          </Badge>
                        )}
                      </VStack>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </VStack>
          </Card>

          {/* Common Items - Expandable */}
          {itemsByPriority.common.length > 0 && (
            <Card bg="white" borderRadius="xl" p={6} shadow="md">
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Circle size="40px" bg="blue.500" color="white">
                      <Icon as={FaCouch} boxSize={5} />
                    </Circle>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        Common Items
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Typical additional items for {currentPreset.name.toLowerCase()}
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                    onClick={() => setShowAllItems(!showAllItems)}
                  >
                    {showAllItems ? 'Show Less' : `Show ${itemsByPriority.common.length} Items`}
                  </Button>
                </HStack>

                {showAllItems && (
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                    {itemsByPriority.common.map((suggestion) => {
                      const currentQuantity = suggestion.actualItem 
                        ? getCurrentQuantity(suggestion.actualItem.id) 
                        : 0;
                      
                      return (
                        <Card
                          key={suggestion.id}
                          p={3}
                          border="1px solid"
                          borderColor={currentQuantity > 0 ? 'blue.200' : 'gray.200'}
                          borderRadius="lg"
                          bg={currentQuantity > 0 ? 'blue.50' : 'white'}
                          shadow="sm"
                          _hover={{ shadow: 'md', borderColor: 'blue.300' }}
                        >
                          <HStack spacing={2}>
                            <Box w="40px" h="40px" flexShrink={0}>
                              <Image
                                src={suggestion.image}
                                alt={suggestion.displayName}
                                w="40px"
                                h="40px"
                                objectFit="cover"
                                borderRadius="md"
                                fallback={
                                  <Circle size="40px" bg="gray.100" color="gray.500">
                                    <Icon as={ROOM_ICONS[suggestion.room as keyof typeof ROOM_ICONS] || FaBox} boxSize={4} />
                                  </Circle>
                                }
                              />
                            </Box>
                            
                            <VStack align="start" spacing={1} flex="1">
                              <Text fontSize="xs" fontWeight="bold" color="gray.800">
                                {suggestion.displayName}
                              </Text>
                              <HStack spacing={1}>
                                <Badge size="sm" colorScheme="blue" variant="outline" fontSize="xs">
                                  Common
                                </Badge>
                              </HStack>
                            </VStack>
                            
                            <HStack spacing={1}>
                              <IconButton
                                size="xs"
                                colorScheme="red"
                                variant={currentQuantity > 0 ? "solid" : "ghost"}
                                aria-label="Decrease"
                                icon={<FaMinus />}
                                onClick={() => {
                                  if (currentQuantity > 0) {
                                    handleQuantityChange(suggestion, currentQuantity - 1);
                                  }
                                }}
                                isDisabled={!suggestion.actualItem || currentQuantity === 0}
                                borderRadius="full"
                              />
                              
                              <Text fontSize="sm" fontWeight="bold" w="20px" textAlign="center">
                                {currentQuantity}
                              </Text>
                              
                              <IconButton
                                size="xs"
                                colorScheme="green"
                                variant="solid"
                                aria-label="Increase"
                                icon={<FaPlus />}
                                onClick={() => {
                                  handleQuantityChange(suggestion, currentQuantity + 1);
                                }}
                                isDisabled={!suggestion.actualItem}
                                borderRadius="full"
                              />
                            </HStack>
                          </HStack>
                        </Card>
                      );
                    })}
                  </SimpleGrid>
                )}
              </VStack>
            </Card>
          )}
        </VStack>
      )}
    </VStack>
  );
}