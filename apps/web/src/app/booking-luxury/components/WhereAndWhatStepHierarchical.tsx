'use client';

/**
 * Hierarchical Items Selection - Enterprise Grade
 * Updated: 2025-11-20 - Enhanced toggle button UX
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
import { FaArrowLeft, FaArrowRight, FaBox, FaTimes, FaChevronUp, FaPlus, FaMinus, FaTrash } from 'react-icons/fa';
import NextImage from 'next/image';

import type { FormData } from '../hooks/useBookingForm';
import PropertyTypeSelector, { PropertyType } from './PropertyTypeSelector';
import PropertySizeSelector from './PropertySizeSelector';
import RoomBasedInventory from './RoomBasedInventory';
import AIItemExtractionAssistant, { type AiAddedItemPayload } from './AIItemExtractionAssistant';
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
    console.log('🔍 DEBUG handleAddItem - Item received:', {
      id: item.id,
      name: item.name,
      category: item.category,
      weight: item.weight,
      room
    });

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
      console.log('🔍 DEBUG handleAddItem - New item created:', newItem);
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

  // Handle AI-added items
  const handleAiAddItems = (aiItems: AiAddedItemPayload[]) => {
    let updated = [...selectedItemsWithRooms];
    
    aiItems.forEach(({ item, quantity, room }) => {
      const existingIndex = updated.findIndex(i => i.id === item.id);
      
      if (existingIndex >= 0) {
        // Update quantity
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
      } else {
        // Add new item
        updated.push({
          id: item.id,
          name: item.name,
          category: item.category,
          weight: item.weight,
          quantity,
          room,
        });
      }
    });
    
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
    
    // Auto-calculate pricing
    if (calculatePricing) {
      setTimeout(() => calculatePricing(), 500);
    }
    
    toast({
      title: 'Items added by AI',
      description: `Added ${aiItems.length} item(s) successfully`,
      status: 'success',
      duration: 3000,
    });
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
        {/* AI Assistant - Always visible in all levels */}
        <AIItemExtractionAssistant
          propertyType={propertyType}
          selectedItems={selectedItemsWithRooms.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
          }))}
          onAddItems={handleAiAddItems}
        />

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

      {/* Floating Black Button for Selected Items - Show in ALL levels when items exist */}
      {selectedItemsWithRooms.length > 0 && (
        <>
          <Box
            position="fixed"
            bottom={{ base: '180px', md: '200px' }}
            right={{ base: '20px', md: '30px' }}
            zIndex={1500}
          >
            <VStack
              as="button"
              onClick={toggleSummary}
              bgGradient={isSummaryExpanded 
                ? "linear(to-br, #dc2626, #991b1b)" 
                : "linear(to-br, #10b981, #059669)"}
              color="white"
              borderRadius="2xl"
              w={{ base: '90px', md: '100px' }}
              h={{ base: '90px', md: '100px' }}
              spacing={1}
              justify="center"
              cursor="pointer"
              boxShadow={isSummaryExpanded 
                ? "0 10px 30px rgba(239, 68, 68, 0.6), 0 0 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)" 
                : "0 10px 30px rgba(16, 185, 129, 0.6), 0 0 20px rgba(16, 185, 129, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)"}
              transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
              border="3px solid"
              borderColor={isSummaryExpanded ? "#ef4444" : "#10b981"}
              position="relative"
              overflow="visible"
              _before={{
                content: '""',
                position: 'absolute',
                inset: '-4px',
                borderRadius: '2xl',
                padding: '4px',
                background: isSummaryExpanded 
                  ? 'linear-gradient(135deg, #ef4444, #dc2626, #991b1b)' 
                  : 'linear-gradient(135deg, #10b981, #059669, #047857)',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                opacity: 0.6,
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
              _hover={{
                transform: 'scale(1.12) rotate(2deg)',
                boxShadow: isSummaryExpanded 
                  ? '0 15px 40px rgba(239, 68, 68, 0.8), 0 0 30px rgba(239, 68, 68, 0.6), inset 0 1px 0 rgba(255,255,255,0.3)' 
                  : '0 15px 40px rgba(16, 185, 129, 0.8), 0 0 30px rgba(16, 185, 129, 0.6), inset 0 1px 0 rgba(255,255,255,0.3)',
                borderWidth: '4px'
              }}
              _active={{
                transform: 'scale(1.05) rotate(0deg)',
                boxShadow: isSummaryExpanded
                  ? '0 5px 15px rgba(239, 68, 68, 0.5), inset 0 2px 4px rgba(0,0,0,0.2)'
                  : '0 5px 15px rgba(16, 185, 129, 0.5), inset 0 2px 4px rgba(0,0,0,0.2)'
              }}
            >
              {/* Toggle Icon - Premium Design */}
              <Icon 
                as={isSummaryExpanded ? FaTimes : FaChevronUp} 
                boxSize={{ base: 7, md: 8 }} 
                color="white"
                filter="drop-shadow(0 3px 6px rgba(0,0,0,0.4))"
                transition="all 0.3s"
                _groupHover={{ transform: 'scale(1.1)' }}
              />
              
              {/* Items Count with Premium Badge */}
              <HStack 
                spacing={1} 
                bg="rgba(255,255,255,0.2)" 
                px={2} 
                py={0.5} 
                borderRadius="full"
                backdropFilter="blur(10px)"
              >
                <Icon as={FaBox} boxSize={{ base: 4, md: 5 }} />
                <Text 
                  fontSize={{ base: '2xl', md: '3xl' }} 
                  fontWeight="black" 
                  lineHeight="1"
                  textShadow="0 2px 4px rgba(0,0,0,0.3)"
                >
                  {selectedItemsWithRooms.reduce((sum, item) => sum + item.quantity, 0)}
                </Text>
              </HStack>
              
              {/* Premium Label with Enhanced Typography */}
              <Text 
                fontSize={{ base: '2xs', md: 'xs' }} 
                fontWeight="black" 
                letterSpacing="widest"
                textTransform="uppercase"
                color="white"
                textShadow="0 2px 6px rgba(0,0,0,0.5)"
                mt={-0.5}
              >
                {isSummaryExpanded ? '✕ CLOSE' : '👁 VIEW'}
              </Text>
            </VStack>
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

                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {selectedItemsWithRooms.map((item, index) => {
                      const fullItem = ALL_REMOVAL_ITEMS.find(i => i.id === item.id);
                      
                      console.log('🔍 DEBUG Card Display:', {
                        index,
                        itemId: item.id,
                        itemName: item.name,
                        fullItemFound: !!fullItem,
                        fullItemName: fullItem?.name,
                        fullItemImage: fullItem?.image,
                        matches: item.id === fullItem?.id && item.name === fullItem?.name
                      });

                      return (
                        <Card
                          key={`${item.id}-${item.room}-${index}`}
                          bg="rgba(15, 15, 18, 0.95)"
                          border="2px solid"
                          borderColor="rgba(168, 85, 247, 0.5)"
                          borderRadius="xl"
                          overflow="hidden"
                          boxShadow="0 4px 12px rgba(168, 85, 247, 0.3)"
                          transition="all 0.3s"
                          _hover={{
                            borderColor: "rgba(168, 85, 247, 0.8)",
                            boxShadow: "0 6px 16px rgba(168, 85, 247, 0.5)",
                            transform: "translateY(-2px)"
                          }}
                        >
                          <CardBody p={3}>
                            <VStack spacing={3} align="stretch">
                              {/* Item Image */}
                              <Box
                                position="relative"
                                w="100%"
                                h="140px"
                                bg="white"
                                borderRadius="lg"
                                overflow="hidden"
                              >
                                {fullItem?.image ? (
                                  <NextImage
                                    src={fullItem.image}
                                    alt={fullItem.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    style={{
                                      objectFit: 'contain',
                                      objectPosition: 'center',
                                    }}
                                  />
                                ) : (
                                  <Box
                                    w="100%"
                                    h="100%"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                  >
                                    <Icon as={FaBox} boxSize={8} color="gray.400" />
                                  </Box>
                                )}
                              </Box>

                              {/* Item Details */}
                              <VStack align="stretch" spacing={2}>
                                <Text color="white" fontWeight="bold" fontSize="sm" noOfLines={2}>
                                  {fullItem?.name || item.name}
                                </Text>
                                <HStack justify="space-between">
                                  <Badge colorScheme="purple" fontSize="xs">
                                    {item.room}
                                  </Badge>
                                  <Text color="whiteAlpha.600" fontSize="xs" fontWeight="medium">
                                    {fullItem?.weight || item.weight}kg
                                  </Text>
                                </HStack>
                              </VStack>

                              {/* Quantity Controls */}
                              <HStack spacing={2} justify="space-between">
                                <HStack spacing={1} flex={1}>
                                  <Button
                                    size="sm"
                                    colorScheme="red"
                                    variant="ghost"
                                    onClick={() => {
                                      if (item.quantity > 1) {
                                        const updated = selectedItemsWithRooms.map((i, idx) =>
                                          idx === index ? { ...i, quantity: i.quantity - 1 } : i
                                        );
                                        setSelectedItemsWithRooms(updated);
                                        updateFormData('step1', {
                                          items: updated.map(({ id, quantity, room }) => {
                                            const fullItem = ALL_REMOVAL_ITEMS.find(item => item.id === id);
                                            const name = fullItem?.name || '';
                                            const weight = fullItem?.weight || 0;
                                            const estimatedVolume = weight * 0.05; // تقدير الحجم بناء على الوزن
                                            const basePrice = 25;
                                            return {
                                              id,
                                              quantity,
                                              name,
                                              description: `${name} from ${room}`,
                                              category: fullItem?.category || '',
                                              size: 'medium' as const,
                                              weight,
                                              volume: estimatedVolume,
                                              unitPrice: basePrice,
                                              totalPrice: basePrice * quantity,
                                              image: fullItem?.image,
                                              room
                                            };
                                          })
                                        });
                                      }
                                    }}
                                    isDisabled={item.quantity <= 1}
                                  >
                                    <Icon as={FaMinus} />
                                  </Button>
                                  
                                  <Text 
                                    color="white" 
                                    fontWeight="black" 
                                    fontSize="xl"
                                    minW="40px"
                                    textAlign="center"
                                  >
                                    {item.quantity}
                                  </Text>
                                  
                                  <Button
                                    size="sm"
                                    colorScheme="green"
                                    variant="ghost"
                                    onClick={() => {
                                      const updated = selectedItemsWithRooms.map((i, idx) =>
                                        idx === index ? { ...i, quantity: i.quantity + 1 } : i
                                      );
                                      setSelectedItemsWithRooms(updated);
                                      updateFormData('step1', {
                                        items: updated.map(({ id, quantity, room }) => {
                                          const fullItem = ALL_REMOVAL_ITEMS.find(item => item.id === id);
                                          const name = fullItem?.name || '';
                                          const weight = fullItem?.weight || 0;
                                          const estimatedVolume = weight * 0.05; // تقدير الحجم بناء على الوزن
                                          const basePrice = 25;
                                          return {
                                            id,
                                            quantity,
                                            name,
                                            description: `${name} from ${room}`,
                                            category: fullItem?.category || '',
                                            size: 'medium' as const,
                                            weight,
                                            volume: estimatedVolume,
                                            unitPrice: basePrice,
                                            totalPrice: basePrice * quantity,
                                            image: fullItem?.image,
                                            room
                                          };
                                        })
                                      });
                                    }}
                                  >
                                    <Icon as={FaPlus} />
                                  </Button>
                                </HStack>

                                <Button
                                  size="sm"
                                  colorScheme="red"
                                  onClick={() => {
                                    const updated = selectedItemsWithRooms.filter((_, idx) => idx !== index);
                                    setSelectedItemsWithRooms(updated);
                                    updateFormData('step1', {
                                      items: updated.map(({ id, quantity, room }) => {
                                        const fullItem = ALL_REMOVAL_ITEMS.find(item => item.id === id);
                                        const name = fullItem?.name || '';
                                        const weight = fullItem?.weight || 0;
                                        const estimatedVolume = weight * 0.05; // تقدير الحجم بناء على الوزن
                                        const basePrice = 25;
                                        return {
                                          id,
                                          quantity,
                                          name,
                                          description: `${name} from ${room}`,
                                          category: fullItem?.category || '',
                                          size: 'medium' as const,
                                          weight,
                                          volume: estimatedVolume,
                                          unitPrice: basePrice,
                                          totalPrice: basePrice * quantity,
                                          image: fullItem?.image,
                                          room
                                        };
                                      })
                                    });
                                    toast({
                                      title: 'Item removed',
                                      status: 'success',
                                      duration: 2000,
                                    });
                                  }}
                                >
                                  <Icon as={FaTrash} />
                                </Button>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>
                      );
                    })}
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
