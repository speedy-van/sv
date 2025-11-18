'use client';

/**
 * Hierarchical Items Selection - Enterprise Grade
 * 
 * 3-Level Hierarchy:
 * 1. Property Type (House/Office/Storage/Single Items)
 * 2. Property Size (Studio/1-5 Bedrooms for houses, etc.)
 * 3. Room-Based Inventory with pre-populated lists
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Card,
  CardBody,
  Badge,
  Alert,
  AlertIcon,
  Fade,
  Progress,
  useToast,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Select,
  SimpleGrid,
  Heading,
  Icon,
  useDisclosure,
  Collapse,
} from '@chakra-ui/react';
import { FaArrowLeft, FaArrowRight, FaBox, FaTimes } from 'react-icons/fa';

import type { FormData } from '../hooks/useBookingForm';
import PropertyTypeSelector, { PropertyType } from './PropertyTypeSelector';
import PropertySizeSelector from './PropertySizeSelector';
import RoomBasedInventory from './RoomBasedInventory';
import { getPrePopulatedItems, filterByPriority } from '@/lib/pre-populated-inventory';
import { ALL_REMOVAL_ITEMS, type RemovalItem } from '@/lib/uk-removal-items-data';

interface WhereAndWhatStepHierarchicalProps {
  formData: FormData;
  updateFormData: (step: keyof FormData, data: Partial<FormData[keyof FormData]>) => void;
  errors: Record<string, string>;
  onNext?: () => void;
  onBack?: () => void;
  calculatePricing?: () => void;
}

export default function WhereAndWhatStepHierarchical({
  formData,
  updateFormData,
  errors,
  onNext,
  onBack,
  calculatePricing,
}: WhereAndWhatStepHierarchicalProps) {
  const toast = useToast();
  const { isOpen: isSummaryExpanded, onToggle: toggleSummary } = useDisclosure({ defaultIsOpen: false });
  
  // Hierarchical state
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1);
  const [propertyType, setPropertyType] = useState<PropertyType | undefined>();
  const [propertySize, setPropertySize] = useState<string | undefined>();
  const [prePopulatedApplied, setPrePopulatedApplied] = useState(false);
  
  const { step1 } = formData;

  // Transform selected items to include room information
  interface SelectedItemWithRoom {
    id: string;
    name: string;
    category: string;
    weight: number;
    quantity: number;
    room: string;
  }

  const [selectedItemsWithRooms, setSelectedItemsWithRooms] = useState<SelectedItemWithRoom[]>([]);

  // Sync with formData - always keep in sync
  useEffect(() => {
    if (step1.items.length > 0) {
      // Create a map of existing items for quick lookup
      const existingMap = new Map(selectedItemsWithRooms.map(i => [i.id, i]));
      
      // Check if items need to be synced
      const needsSync = step1.items.length !== selectedItemsWithRooms.length ||
        step1.items.some(item => {
          const localItem = existingMap.get(item.id);
          return !localItem || localItem.quantity !== item.quantity;
        });

      if (needsSync) {
        // Sync from formData, preserving room info
        const itemsWithRooms = step1.items.map(item => {
          const existing = existingMap.get(item.id);
          return {
            id: item.id,
            name: item.name,
            category: item.category,
            weight: item.weight,
            quantity: item.quantity,
            room: existing?.room || 'unknown',
          };
        });
        setSelectedItemsWithRooms(itemsWithRooms);
      }
    } else if (selectedItemsWithRooms.length > 0) {
      // Clear local state if formData is empty
      setSelectedItemsWithRooms([]);
    }
  }, [step1.items]);

  // Handle property type selection
  const handlePropertyTypeSelect = (type: PropertyType) => {
    setPropertyType(type);
    
    // Skip size selection for single items
    if (type === 'single-items') {
      setCurrentLevel(3);
      setPropertySize(undefined);
    } else {
      setCurrentLevel(2);
    }
  };

  // Handle property size selection
  const handlePropertySizeSelect = (size: string) => {
    setPropertySize(size);
    
    // Auto-apply pre-populated items
    if (!prePopulatedApplied) {
      applyPrePopulatedItems(size);
    }
    
    setCurrentLevel(3);
  };

  // Apply pre-populated items based on property type and size
  const applyPrePopulatedItems = (size: string) => {
    if (!propertyType) return;
    
    const prePopItems = getPrePopulatedItems(propertyType, size);
    const essentialItems = filterByPriority(prePopItems, 3); // Include ALL items (priority 1, 2, and 3)
    
    const newItems: SelectedItemWithRoom[] = essentialItems.map(preItem => {
      // Find matching item from ALL_REMOVAL_ITEMS
      const matchedItem = ALL_REMOVAL_ITEMS.find(item => 
        item.name.toLowerCase().includes(preItem.name.toLowerCase()) ||
        preItem.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0])
      );

      return {
        id: matchedItem?.id || `custom-${preItem.name}-${Date.now()}-${Math.random()}`,
        name: preItem.name,
        category: preItem.category,
        weight: preItem.weight,
        quantity: preItem.suggestedQuantity,
        room: preItem.room,
      };
    });

    console.log('🎯 Pre-populated items being added:', {
      propertyType,
      size,
      totalItems: essentialItems.length,
      totalQuantity: newItems.reduce((sum, item) => sum + item.quantity, 0),
      items: newItems.map(i => ({ name: i.name, quantity: i.quantity }))
    });

    setSelectedItemsWithRooms(newItems);
    setPrePopulatedApplied(true);

    // Update formData
    updateFormData('step1', {
      items: newItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        weight: item.weight,
        quantity: item.quantity,
        size: 'medium',
        volume: 1.0,
        unitPrice: 25,
        totalPrice: 25 * item.quantity,
        description: `${item.name} from ${item.room}`,
      })),
    });

    const totalQuantity = newItems.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueItems = newItems.length;
    
    toast({
      title: 'Pre-populated list applied',
      description: `Added ${totalQuantity} items (${uniqueItems} unique ${uniqueItems === 1 ? 'item' : 'items'}). You can now customize them.`,
      status: 'success',
      duration: 3000,
    });
  };

  // Handle adding item
  const handleAddItem = (item: RemovalItem, room: string, quantity: number) => {
    // Check if item already exists
    const existingItemIndex = selectedItemsWithRooms.findIndex(i => i.id === item.id);
    
    let updated: SelectedItemWithRoom[];
    
    if (existingItemIndex >= 0) {
      // Item exists - update quantity
      updated = selectedItemsWithRooms.map((i, idx) =>
        idx === existingItemIndex
          ? { ...i, quantity: i.quantity + quantity }
          : i
      );
    } else {
      // New item - add it
      const newItem: SelectedItemWithRoom = {
        id: item.id,
        name: item.name,
        category: item.category,
        weight: item.weight,
        quantity,
        room,
      };
      updated = [...selectedItemsWithRooms, newItem];
    }

    setSelectedItemsWithRooms(updated);

    // Update formData
    updateFormData('step1', {
      items: updated.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        weight: i.weight,
        quantity: i.quantity,
        size: 'medium',
        volume: 1.0,
        unitPrice: 25,
        totalPrice: 25 * i.quantity,
        description: `${i.name} from ${i.room}`,
      })),
    });

    // Auto-calculate pricing if available
    if (calculatePricing) {
      setTimeout(() => calculatePricing(), 500);
    }
  };

  // Handle removing item
  const handleRemoveItem = (itemId: string) => {
    const updated = selectedItemsWithRooms.filter(item => item.id !== itemId);
    setSelectedItemsWithRooms(updated);

    updateFormData('step1', {
      items: updated.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        weight: i.weight,
        quantity: i.quantity,
        size: 'medium',
        volume: 1.0,
        unitPrice: 25,
        totalPrice: 25 * i.quantity,
        description: `${i.name} from ${i.room}`,
      })),
    });

    if (calculatePricing) {
      setTimeout(() => calculatePricing(), 500);
    }
  };

  // Handle updating quantity
  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    const updated = selectedItemsWithRooms.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    setSelectedItemsWithRooms(updated);

    updateFormData('step1', {
      items: updated.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        weight: i.weight,
        quantity: i.quantity,
        size: 'medium',
        volume: 1.0,
        unitPrice: 25,
        totalPrice: 25 * i.quantity,
        description: `${i.name} from ${i.room}`,
      })),
    });

    if (calculatePricing) {
      setTimeout(() => calculatePricing(), 500);
    }
  };

  // Calculate totals
  const totalItems = selectedItemsWithRooms.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeight = selectedItemsWithRooms.reduce((sum, item) => sum + (item.weight * item.quantity), 0);

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        {/* Level 1: Property Type Selection */}
        {currentLevel === 1 && (
          <Fade in={currentLevel === 1}>
            <PropertyTypeSelector
              selectedType={propertyType}
              onSelectType={handlePropertyTypeSelect}
            />
          </Fade>
        )}

        {/* Level 2: Property Size Selection */}
        {currentLevel === 2 && propertyType && (
          <Fade in={currentLevel === 2}>
            <VStack spacing={6} align="stretch">
              <Button
                leftIcon={<FaArrowLeft />}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentLevel(1);
                  setPropertySize(undefined);
                }}
                alignSelf="flex-start"
              >
                Change property type
              </Button>

              <PropertySizeSelector
                propertyType={propertyType}
                selectedSize={propertySize}
                onSelectSize={handlePropertySizeSelect}
              />
            </VStack>
          </Fade>
        )}

        {/* Level 3: Room-Based Item Selection */}
        {currentLevel === 3 && propertyType && (
          <Fade in={currentLevel === 3}>
            <VStack spacing={6} align="stretch">
              
              {/* Room-Based Inventory */}
              <RoomBasedInventory
                propertyType={propertyType}
                availableItems={ALL_REMOVAL_ITEMS}
                selectedItems={selectedItemsWithRooms}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onUpdateQuantity={handleUpdateQuantity}
                onBack={() => setCurrentLevel(2)}
              />

            </VStack>
          </Fade>
        )}

        {currentLevel === 3 && !propertyType && (
          <Alert status="warning">
            <AlertIcon />
            Please select a property type to continue.
          </Alert>
        )}

        {/* Error Display */}
        {errors.items && (
          <Alert status="error">
            <AlertIcon />
            {errors.items}
          </Alert>
        )}
      </VStack>

      {/* Floating Green Button for Selected Items - Show in ALL levels when items exist */}
      {selectedItemsWithRooms.length > 0 && currentLevel !== 3 && (
        <>
          <Box
            position="fixed"
            bottom={{ base: '180px', md: '200px' }}
            right={{ base: '20px', md: '30px' }}
            zIndex={1500}
          >
            <Box
              as="button"
              onClick={toggleSummary}
              bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
              color="white"
              borderRadius="full"
              w={{ base: '64px', md: '72px' }}
              h={{ base: '64px', md: '72px' }}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              cursor="pointer"
              boxShadow="0 8px 24px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)"
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{
                transform: 'scale(1.1) translateY(-4px)',
                boxShadow: '0 12px 32px rgba(16, 185, 129, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2)'
              }}
              _active={{
                transform: 'scale(1.05) translateY(-2px)'
              }}
            >
              <Icon as={FaBox} boxSize={{ base: 5, md: 6 }} mb={1} />
              <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold">
                {selectedItemsWithRooms.reduce((sum, item) => sum + item.quantity, 0)}
              </Text>
            </Box>
          </Box>

          {/* Expanded Details Panel */}
          <Box
            position="fixed"
            bottom="0"
            left="0"
            right="0"
            zIndex={1400}
            pointerEvents={isSummaryExpanded ? 'auto' : 'none'}
          >
            <Collapse in={isSummaryExpanded} animateOpacity>
              <Box
                bg="#050505"
                backdropFilter="blur(20px)"
                borderTop="2px solid"
                borderColor="rgba(168, 85, 247, 0.4)"
                boxShadow="0 -8px 32px rgba(0, 0, 0, 0.8)"
                maxH="60vh"
                overflowY="auto"
                p={{ base: 4, md: 6 }}
              >
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <VStack align="flex-start" spacing={1}>
                      <Heading size="md" color="white">
                        Selected Items
                      </Heading>
                      <Text color="whiteAlpha.600" fontSize="sm">
                        {selectedItemsWithRooms.reduce((sum, item) => sum + item.quantity, 0)} total items • {selectedItemsWithRooms.length} unique
                      </Text>
                    </VStack>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={toggleSummary}
                      rightIcon={<FaTimes />}
                    >
                      Close
                    </Button>
                  </HStack>

                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                    {selectedItemsWithRooms.map((item) => (
                      <Card
                        key={item.id}
                        bg="#0f0f12"
                        border="1px solid"
                        borderColor="rgba(168, 85, 247, 0.4)"
                        size="sm"
                      >
                        <Box display={{ base: "block", md: "none" }}>
                          <CardBody>
                            <VStack align="stretch" spacing={2}>
                              <HStack justify="space-between">
                                <Text color="white" fontWeight="bold" fontSize="sm">
                                  {item.name}
                                </Text>
                                <Badge colorScheme="green">{item.quantity}x</Badge>
                              </HStack>
                              <Text color="whiteAlpha.600" fontSize="xs">
                                {item.room}
                              </Text>
                            </VStack>
                          </CardBody>
                        </Box>
                        <Box display={{ base: "none", md: "block" }} p={3}>
                          <VStack align="stretch" spacing={2}>
                            <HStack justify="space-between">
                              <Text color="white" fontWeight="bold" fontSize="sm">
                                {item.name}
                              </Text>
                              <Badge colorScheme="green">{item.quantity}x</Badge>
                            </HStack>
                            <Text color="whiteAlpha.600" fontSize="xs">
                              {item.room}
                            </Text>
                          </VStack>
                        </Box>
                      </Card>
                    ))}
                  </SimpleGrid>
                </VStack>
              </Box>
            </Collapse>
          </Box>
        </>
      )}
    </Box>
  );
}
