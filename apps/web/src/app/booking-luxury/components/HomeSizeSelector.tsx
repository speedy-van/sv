/**
 * Home Size Selector Component
 * 
 * Provides a user-friendly interface for selecting home size (1-6+ bedrooms)
 * and automatically suggests typical items for that home size.
 */

'use client';

import React, { useState, useEffect } from 'react';
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
  Collapse,
  useDisclosure,
  Flex,
  Circle,
  Divider
} from '@chakra-ui/react';
import { FaHome, FaBed, FaUsers, FaChevronDown, FaChevronUp, FaPlus } from 'react-icons/fa';

import { 
  HOME_SIZE_PRESETS, 
  HomeSizePreset, 
  HomeSizeItem,
  getRecommendedItemsWithFallback 
} from '../../../lib/items/home-size-presets';

import type { Item } from '../../../lib/booking/utils';

interface HomeSizeSelectorProps {
  selectedHomeSize?: string;
  onHomeSizeChange: (homeSizeId: string | null) => void;
  onAddPresetItems: (items: Item[]) => void;
  availableItems: Item[];
  selectedItems: Item[];
}

export default function HomeSizeSelector({
  selectedHomeSize,
  onHomeSizeChange,
  onAddPresetItems,
  availableItems,
  selectedItems
}: HomeSizeSelectorProps) {
  const [showPresetItems, setShowPresetItems] = useState(false);
  const { isOpen: isPreviewOpen, onToggle: togglePreview } = useDisclosure();

  // Get current preset
  const currentPreset = selectedHomeSize 
    ? HOME_SIZE_PRESETS.find(preset => preset.id === selectedHomeSize)
    : null;

  // Get recommended items for current home size
  const recommendedItems = currentPreset 
    ? getRecommendedItemsWithFallback(currentPreset.id, availableItems, 20)
    : [];

  // Separate items by priority for better UX
  const essentialItems = recommendedItems.filter(item => item.priority === 1);
  const commonItems = recommendedItems.filter(item => item.priority === 2);
  const optionalItems = recommendedItems.filter(item => item.priority === 3);

  // Handle home size selection
  const handleHomeSizeSelect = (preset: HomeSizePreset) => {
    if (selectedHomeSize === preset.id) {
      // Deselect if clicking the same preset
      onHomeSizeChange(null);
      setShowPresetItems(false);
    } else {
      onHomeSizeChange(preset.id);
      setShowPresetItems(true);
    }
  };

  // Handle adding preset items
  const handleAddPresetItems = (priority?: number) => {
    if (!currentPreset) return;

    const itemsToAdd = priority 
      ? recommendedItems.filter(item => item.priority === priority)
      : essentialItems; // Default to essential items

    const processedItems: Item[] = itemsToAdd.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      description: item.description || `${item.name} for ${currentPreset.name.toLowerCase()}`,
      size: item.size || 'medium',
      weight: item.weight || 25,
      volume: item.volume || 1.0,
      unitPrice: item.unitPrice || 25,
      quantity: item.suggestedQuantity || 1,
      totalPrice: (item.unitPrice || 25) * (item.suggestedQuantity || 1),
      image: item.image || ''
    }));

    onAddPresetItems(processedItems);
  };

  return (
    <Card bg="white" borderRadius="xl" p={6} shadow="md" borderWidth="2px" borderColor="blue.200">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <VStack spacing={3} align="center">
          <HStack spacing={3}>
            <Circle size="50px" bg="blue.500" color="white">
              <Icon as={FaHome} boxSize={6} />
            </Circle>
            <VStack align="start" spacing={1}>
              <Text fontSize="xl" fontWeight="bold" color="gray.800">
                🏠 Select Your Home Size
              </Text>
              <Text fontSize="sm" color="gray.600">
                Get personalized item suggestions for your move
              </Text>
            </VStack>
          </HStack>
          
          <Text fontSize="sm" color="blue.600" textAlign="center" bg="blue.50" px={4} py={2} borderRadius="md">
            💡 Choose your home size to see typical items you might need to move
          </Text>
        </VStack>

        {/* Home Size Selection Grid */}
        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={3}>
          {HOME_SIZE_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant={selectedHomeSize === preset.id ? 'solid' : 'outline'}
              colorScheme={selectedHomeSize === preset.id ? 'blue' : 'gray'}
              size="lg"
              h="80px"
              flexDirection="column"
              onClick={() => handleHomeSizeSelect(preset)}
              _hover={{
                bg: selectedHomeSize === preset.id ? 'blue.600' : 'gray.50',
                transform: 'translateY(-2px)',
                shadow: 'lg'
              }}
              _active={{
                transform: 'translateY(0px)',
                shadow: 'md'
              }}
              transition="all 0.2s ease"
              borderWidth="2px"
              borderRadius="xl"
              position="relative"
            >
              <VStack spacing={1}>
                <Text fontSize="2xl">{preset.icon}</Text>
                <Text fontSize="xs" fontWeight="bold" textAlign="center" lineHeight="1.2">
                  {preset.name}
                </Text>
              </VStack>
              
              {selectedHomeSize === preset.id && (
                <Badge
                  position="absolute"
                  top="-8px"
                  right="-8px"
                  colorScheme="green"
                  variant="solid"
                  borderRadius="full"
                  fontSize="xs"
                >
                  ✓
                </Badge>
              )}
            </Button>
          ))}
        </SimpleGrid>

        {/* Selected Home Size Info & Actions */}
        {currentPreset && (
          <VStack spacing={4} align="stretch">
            <Divider />
            
            <Card bg="blue.50" borderColor="blue.200" borderWidth="1px">
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={2} flex="1">
                      <HStack spacing={3}>
                        <Text fontSize="2xl">{currentPreset.icon}</Text>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="lg" fontWeight="bold" color="blue.800">
                            {currentPreset.name} Selected
                          </Text>
                          <Text fontSize="sm" color="blue.600">
                            {currentPreset.description}
                          </Text>
                        </VStack>
                      </HStack>

                      <HStack spacing={4} wrap="wrap">
                        <Badge colorScheme="blue" variant="subtle">
                          <HStack spacing={1}>
                            <Icon as={FaBed} boxSize={3} />
                            <Text>{currentPreset.bedrooms} bedroom{currentPreset.bedrooms > 1 ? 's' : ''}</Text>
                          </HStack>
                        </Badge>
                        <Badge colorScheme="green" variant="subtle">
                          <HStack spacing={1}>
                            <Icon as={FaPlus} boxSize={3} />
                            <Text>{essentialItems.length} essential items</Text>
                          </HStack>
                        </Badge>
                        <Badge colorScheme="purple" variant="subtle">
                          <HStack spacing={1}>
                            <Icon as={FaUsers} boxSize={3} />
                            <Text>{recommendedItems.length} total suggestions</Text>
                          </HStack>
                        </Badge>
                      </HStack>
                    </VStack>

                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="blue"
                      onClick={togglePreview}
                      rightIcon={<Icon as={isPreviewOpen ? FaChevronUp : FaChevronDown} />}
                    >
                      {isPreviewOpen ? 'Hide' : 'Preview'} Items
                    </Button>
                  </HStack>

                  {/* Quick Add Buttons */}
                  <HStack spacing={3} wrap="wrap">
                    <Button
                      size="md"
                      colorScheme="green"
                      variant="solid"
                      onClick={() => handleAddPresetItems(1)}
                      leftIcon={<Icon as={FaPlus} />}
                      _hover={{ bg: 'green.600', transform: 'translateY(-1px)' }}
                      borderRadius="lg"
                    >
                      Add Essential Items ({essentialItems.length})
                    </Button>
                    
                    {commonItems.length > 0 && (
                      <Button
                        size="md"
                        colorScheme="blue"
                        variant="outline"
                        onClick={() => handleAddPresetItems(2)}
                        leftIcon={<Icon as={FaPlus} />}
                        _hover={{ bg: 'blue.50' }}
                        borderRadius="lg"
                      >
                        Add Common Items ({commonItems.length})
                      </Button>
                    )}
                  </HStack>

                  {/* Item Preview */}
                  <Collapse in={isPreviewOpen} animateOpacity>
                    <VStack spacing={4} align="stretch" mt={4}>
                      <Divider />
                      
                      {/* Essential Items */}
                      {essentialItems.length > 0 && (
                        <VStack spacing={3} align="stretch">
                          <HStack spacing={2}>
                            <Badge colorScheme="green" variant="solid" fontSize="xs">
                              Essential
                            </Badge>
                            <Text fontSize="sm" fontWeight="medium" color="gray.700">
                              Must-have items for {currentPreset.name.toLowerCase()}
                            </Text>
                          </HStack>
                          
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                            {essentialItems.slice(0, 6).map((item) => (
                              <HStack 
                                key={item.id} 
                                spacing={2} 
                                p={2} 
                                bg="green.50" 
                                borderRadius="md"
                                fontSize="sm"
                              >
                                <Badge size="sm" colorScheme="green" variant="outline">
                                  {item.suggestedQuantity || 1}x
                                </Badge>
                                <Text flex="1" fontSize="sm" color="gray.700">
                                  {item.name}
                                </Text>
                                {item.room && (
                                  <Text fontSize="xs" color="gray.500">
                                    {item.room}
                                  </Text>
                                )}
                              </HStack>
                            ))}
                            {essentialItems.length > 6 && (
                              <Text fontSize="xs" color="gray.500" textAlign="center" gridColumn="1 / -1">
                                +{essentialItems.length - 6} more essential items
                              </Text>
                            )}
                          </SimpleGrid>
                        </VStack>
                      )}

                      {/* Common Items */}
                      {commonItems.length > 0 && (
                        <VStack spacing={3} align="stretch">
                          <HStack spacing={2}>
                            <Badge colorScheme="blue" variant="solid" fontSize="xs">
                              Common
                            </Badge>
                            <Text fontSize="sm" fontWeight="medium" color="gray.700">
                              Typical additional items
                            </Text>
                          </HStack>
                          
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                            {commonItems.slice(0, 4).map((item) => (
                              <HStack 
                                key={item.id} 
                                spacing={2} 
                                p={2} 
                                bg="blue.50" 
                                borderRadius="md"
                                fontSize="sm"
                              >
                                <Badge size="sm" colorScheme="blue" variant="outline">
                                  {item.suggestedQuantity || 1}x
                                </Badge>
                                <Text flex="1" fontSize="sm" color="gray.700">
                                  {item.name}
                                </Text>
                              </HStack>
                            ))}
                            {commonItems.length > 4 && (
                              <Text fontSize="xs" color="gray.500" textAlign="center" gridColumn="1 / -1">
                                +{commonItems.length - 4} more common items
                              </Text>
                            )}
                          </SimpleGrid>
                        </VStack>
                      )}

                      <Text fontSize="xs" color="gray.500" textAlign="center" fontStyle="italic">
                        💡 You can always add, remove, or adjust quantities after adding preset items
                      </Text>
                    </VStack>
                  </Collapse>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        )}

        {/* Help Text */}
        <Text fontSize="xs" color="gray.500" textAlign="center" fontStyle="italic">
          Can't find your home size? Choose the closest match or use "All Items" to browse manually
        </Text>
      </VStack>
    </Card>
  );
}