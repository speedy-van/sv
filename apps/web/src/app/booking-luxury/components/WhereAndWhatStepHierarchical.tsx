'use client';

/**
 * Hierarchical Items Selection - Enterprise Grade with Multi-Leg Support
 * Updated: 2025-11-20 - Enhanced toggle button UX
 * 
 * 3-Level Hierarchy:
 * 1. Property Type (House/Office/Storage/Single Items)
 * 2. Property Size (Studio/1-5 Bedrooms for houses, etc.)
 * 3. Room-Based Inventory with pre-populated lists
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { BookingSegment } from '../types/segment';
import {
  Box,
  VStack,
  HStack,
  Flex,
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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
} from '@chakra-ui/react';
import { FaArrowLeft, FaArrowRight, FaShoppingBag, FaTimes, FaChevronUp, FaPlus, FaMinus, FaTrash, FaTruck, FaRedo, FaCheck, FaMapMarkerAlt } from 'react-icons/fa';
import NextImage from 'next/image';

import type { FormData } from '../hooks/useBookingForm';
import PropertyTypeSelector, { PropertyType } from './PropertyTypeSelector';
import PropertySizeSelector from './PropertySizeSelector';
import RoomBasedInventory from './RoomBasedInventory';
import AIItemExtractionAssistant, { type AiAddedItemPayload } from './AIItemExtractionAssistant';
import { getPrePopulatedItems, filterByPriority } from '@/lib/pre-populated-inventory';
import { ALL_REMOVAL_ITEMS, type RemovalItem } from '@/lib/uk-removal-items-data';
import { CommonItemsGrid } from '@/components/booking/CommonItemsGrid';
import SelectedItemsManager from './SelectedItemsManager';

interface WhereAndWhatStepHierarchicalProps {
  formData: FormData;
  updateFormData: (step: keyof FormData, data: Partial<FormData[keyof FormData]>) => void;
  updateSegment?: (index: number, segmentData: Partial<any>) => void;
  errors: Record<string, string>;
  onNext?: () => void;
  onBack?: () => void;
  calculatePricing?: () => void;
}

export default function WhereAndWhatStepHierarchical({
  formData,
  updateFormData,
  updateSegment,
  errors,
  onNext,
  onBack,
  calculatePricing,
}: WhereAndWhatStepHierarchicalProps) {
  const toast = useToast();
  const { isOpen: isSummaryExpanded, onToggle: toggleSummary } = useDisclosure({ defaultIsOpen: false });
  const [isToggling, setIsToggling] = useState(false);
  
  // Search state for quick item search
  const [searchQuery, setSearchQuery] = useState('');
  
  // Hierarchical state
  const [currentLevel, setCurrentLevel] = useState<1 | 2 | 3>(1);
  const [propertyType, setPropertyType] = useState<PropertyType | undefined>();
  const [propertySize, setPropertySize] = useState<string | undefined>();
  const [prePopulatedApplied, setPrePopulatedApplied] = useState(false);
  
  // Multi-leg state - track which segment is being edited
  const segments = (formData.step1.segments || []) as BookingSegment[];
  const isMultiLeg = segments.length > 1;
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState(0);
  const prevSegmentsLengthRef = useRef(segments.length);
  const isNewSegmentAddedRef = useRef(false);

  // Helper: Sync items bidirectionally between all segments
  // This ensures all segments have the same items for multi-leg bookings
  const syncItemsToAllSegments = useCallback((mappedItems: any[], sourceSegmentIndex: number) => {
    if (!isMultiLeg || !updateSegment) return;
    
    // Deep copy items for each segment to avoid reference issues
    const itemsCopy = mappedItems.map(item => ({ ...item }));
    
    // Sync to all other segments
    segments.forEach((segment, idx) => {
      if (idx !== sourceSegmentIndex) {
        console.log(`🔄 Syncing items from segment ${sourceSegmentIndex} to segment ${idx}`);
        updateSegment(idx, { items: itemsCopy.map(item => ({ ...item })) });
      }
    });
  }, [isMultiLeg, updateSegment, segments]);
  
  // Backward compatibility wrapper
  const syncItemsToReturnSegment = useCallback((mappedItems: any[]) => {
    syncItemsToAllSegments(mappedItems, selectedSegmentIndex);
  }, [syncItemsToAllSegments, selectedSegmentIndex]);
  
  // Track segment count changes - but DON'T auto-switch to new segment
  // This was causing items to be added to the wrong segment (additional journey instead of main)
  useEffect(() => {
    if (segments.length > prevSegmentsLengthRef.current) {
      // A new segment was added - keep user on current segment (usually segment 0)
      // Items should be added to main journey first, then synced to all segments
      console.log(`🆕 New segment added! Staying on segment ${selectedSegmentIndex} (user can switch manually)`);
      isNewSegmentAddedRef.current = true;
      // DON'T switch: setSelectedSegmentIndex(newIndex);
    }
    prevSegmentsLengthRef.current = segments.length;
  }, [segments.length, selectedSegmentIndex]);
  
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

  // Helper function to load items from segment
  const loadItemsFromSegment = useCallback((segment: BookingSegment | undefined) => {
    if (segment?.items && segment.items.length > 0) {
      return segment.items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        weight: item.weight,
        quantity: item.quantity,
        room: item.description?.includes('from') 
          ? item.description.split('from ')[1] || 'unknown'
          : 'unknown',
      }));
    }
    return null;
  }, []);

  // Multi-leg: Load items from active segment when switching
  // Use a ref to track when WE just updated segments (to avoid re-reading our own changes)
  const justUpdatedSegmentsRef = useRef(false);
  
  useEffect(() => {
    // CRITICAL: Always read fresh from formData, not from props
    const freshSegments = (formData.step1.segments || []) as BookingSegment[];
    const freshIsMultiLeg = freshSegments.length > 1;
    
    if (!freshIsMultiLeg) return;
    
    // Skip if we just updated segments ourselves (avoid clearing items we just added)
    if (justUpdatedSegmentsRef.current) {
      console.log(`⏭️ Skipping segment load - we just updated segments`);
      justUpdatedSegmentsRef.current = false;
      return;
    }
    
    const currentSegment = freshSegments[selectedSegmentIndex];
    const isJustAdded = isNewSegmentAddedRef.current;
    
    console.log(`🔄 Loading items for segment ${selectedSegmentIndex}:`, {
      segmentExists: !!currentSegment,
      hasItems: !!currentSegment?.items,
      itemsCount: currentSegment?.items?.length || 0,
      isNewSegmentAdded: isJustAdded
    });
    
    const itemsWithRooms = loadItemsFromSegment(currentSegment);
    
    if (itemsWithRooms && itemsWithRooms.length > 0) {
      console.log(`✅ Loaded ${itemsWithRooms.length} items for segment ${selectedSegmentIndex}`);
      setSelectedItemsWithRooms(itemsWithRooms);
      isNewSegmentAddedRef.current = false;
    } else if (isJustAdded) {
      // Newly added segment - items might not have propagated yet
      console.log(`🔒 Newly added segment ${selectedSegmentIndex}, retrying after state sync...`);
      
      const retryTimer = setTimeout(() => {
        const latestSegments = (formData.step1.segments || []) as BookingSegment[];
        const latestSegment = latestSegments[selectedSegmentIndex];
        const retryItems = loadItemsFromSegment(latestSegment);
        
        if (retryItems && retryItems.length > 0) {
          console.log(`✅ Retry successful: Loaded ${retryItems.length} items for segment ${selectedSegmentIndex}`);
          setSelectedItemsWithRooms(retryItems);
        } else {
          console.log(`⚠️ Retry: Still no items found for segment ${selectedSegmentIndex}`);
        }
        isNewSegmentAddedRef.current = false;
      }, 50);
      
      return () => clearTimeout(retryTimer);
    } else {
      // Only clear if segment truly has no items
      if (!currentSegment?.items || currentSegment.items.length === 0) {
        console.log(`⚠️ No items found for segment ${selectedSegmentIndex}, clearing selection`);
        setSelectedItemsWithRooms([]);
      }
    }
  }, [selectedSegmentIndex, formData.step1.segments, loadItemsFromSegment]);

  // Sync with formData - always keep in sync (for single-leg)
  useEffect(() => {
    // Skip if multi-leg (items loaded from segment above)
    if (isMultiLeg) return;
    
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

    const mappedItems = newItems.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      weight: item.weight,
      quantity: item.quantity,
      size: 'medium' as const,
      volume: 1.0,
      unitPrice: 25,
      totalPrice: 25 * item.quantity,
      description: `${item.name} from ${item.room}`,
    }));

    // CRITICAL: Read fresh from formData to check if multi-leg
    const currentSegments = (formData.step1.segments || []) as BookingSegment[];
    const currentIsMultiLeg = currentSegments.length > 1;

    // For multi-leg: save to ALL segments (same items for outbound and return)
    if (currentIsMultiLeg) {
      // Update ALL segments with the same items (deep copy for each)
      const updatedSegments = currentSegments.map((segment) => ({
        ...segment,
        items: mappedItems.map(item => ({ ...item }))
      }));
      
      // Also update global items for fallback compatibility
      updateFormData('step1', { segments: updatedSegments, items: mappedItems });
      console.log(`✅ Pre-populated: Updated ALL ${currentSegments.length} segments with ${mappedItems.length} items`);
    } else {
      // Single-leg: save to global items
      updateFormData('step1', { items: mappedItems });
    }

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

    const mappedItems = updated.map(i => {
      // Use actual dataset values instead of hardcoded values
      // Calculate volume based on weight (rough estimate: 1kg ≈ 0.01 m³)
      const estimatedVolume = (i.weight || 10) * 0.01;
      // Calculate unitPrice based on weight (rough estimate: £2.5 per kg)
      const estimatedPrice = (i.weight || 10) * 2.5;
      
      return {
        id: i.id,
        name: i.name,
        category: i.category,
        weight: i.weight,
        quantity: i.quantity,
        size: 'medium' as const, // Keep for compatibility
        volume: estimatedVolume,
        unitPrice: estimatedPrice,
        totalPrice: estimatedPrice * i.quantity,
        description: `${i.name} from ${i.room}`,
      };
    });

    // CRITICAL: Read fresh from formData to check if multi-leg
    const currentSegments = (formData.step1.segments || []) as BookingSegment[];
    const currentIsMultiLeg = currentSegments.length > 1;
    
    console.log('🔍 DEBUG handleAddItem:', {
      isMultiLeg: currentIsMultiLeg,
      segmentsCount: currentSegments.length,
      mappedItemsCount: mappedItems.length,
      segmentTypes: currentSegments.map(s => s.segmentType)
    });

    // For multi-leg: save to ALL segments (same items for outbound and return)
    if (currentIsMultiLeg) {
      // Update ALL segments with the same items (deep copy for each)
      const updatedSegments = currentSegments.map((segment) => ({
        ...segment,
        items: mappedItems.map(item => ({ ...item }))
      }));
      
      console.log('🔍 DEBUG handleAddItem - Updating segments:', {
        updatedSegmentsItems: updatedSegments.map(s => ({ type: s.segmentType, items: s.items?.length || 0 }))
      });
      
      // Mark that we're updating segments to prevent useEffect from clearing items
      justUpdatedSegmentsRef.current = true;
      
      // Also update global items for fallback compatibility
      updateFormData('step1', { segments: updatedSegments, items: mappedItems });
      console.log(`✅ Updated ALL ${currentSegments.length} segments with ${mappedItems.length} items`);
    } else {
      // Single-leg: save to global items
      updateFormData('step1', { items: mappedItems });
      console.log(`✅ Updated global items with ${mappedItems.length} items (single-leg)`);
    }

    // Auto-calculate pricing if available
    if (calculatePricing) {
      setTimeout(() => calculatePricing(), 500);
    }
  };

  // Handle AI-added items
  const handleAiAddItems = (aiItems: AiAddedItemPayload[]) => {
    const updated = [...selectedItemsWithRooms];
    
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
    
    const mappedItems = updated.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      weight: i.weight,
      quantity: i.quantity,
      size: 'medium' as const,
      volume: 1.0,
      unitPrice: 25,
      totalPrice: 25 * i.quantity,
      description: `${i.name} from ${i.room}`,
    }));
    
    // CRITICAL: Read fresh from formData to check if multi-leg
    const currentSegments = (formData.step1.segments || []) as BookingSegment[];
    const currentIsMultiLeg = currentSegments.length > 1;

    // For multi-leg: save to ALL segments (same items for outbound and return)
    if (currentIsMultiLeg) {
      // Update ALL segments with the same items (deep copy for each)
      const updatedSegments = currentSegments.map((segment) => ({
        ...segment,
        items: mappedItems.map(item => ({ ...item }))
      }));
      
      // Mark that we're updating segments to prevent useEffect from clearing items
      justUpdatedSegmentsRef.current = true;
      
      // Also update global items for fallback compatibility
      updateFormData('step1', { segments: updatedSegments, items: mappedItems });
      console.log(`✅ AI items: Updated ALL ${currentSegments.length} segments with ${mappedItems.length} items`);
    } else {
      // Single-leg: save to global items
      updateFormData('step1', { items: mappedItems });
    }
    
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

  // Handle updating quantity
  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    const updated = selectedItemsWithRooms.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    setSelectedItemsWithRooms(updated);

    const mappedItems = updated.map(i => ({
      id: i.id,
      name: i.name,
      category: i.category,
      weight: i.weight,
      quantity: i.quantity,
      size: 'medium' as const,
      volume: 1.0,
      unitPrice: 25,
      totalPrice: 25 * i.quantity,
      description: `${i.name} from ${i.room}`,
    }));

    // CRITICAL: Read fresh from formData to check if multi-leg
    const currentSegments = (formData.step1.segments || []) as BookingSegment[];
    const currentIsMultiLeg = currentSegments.length > 1;

    // For multi-leg: save to ALL segments (same items for outbound and return)
    if (currentIsMultiLeg) {
      // Update ALL segments with the same items (deep copy for each)
      const updatedSegments = currentSegments.map((segment) => ({
        ...segment,
        items: mappedItems.map(item => ({ ...item }))
      }));
      
      // Mark that we're updating segments to prevent useEffect from clearing items
      justUpdatedSegmentsRef.current = true;
      
      // Also update global items for fallback compatibility
      updateFormData('step1', { segments: updatedSegments, items: mappedItems });
    } else {
      // Single-leg: save to global items
      updateFormData('step1', { items: mappedItems });
    }

    if (calculatePricing) {
      setTimeout(() => calculatePricing(), 500);
    }
  };

  // Handle toggle with debounce protection
  const handleToggleSummary = () => {
    if (isToggling) return;
    setIsToggling(true);
    toggleSummary();
    setTimeout(() => setIsToggling(false), 300);
  };

  // Calculate totals
  const totalItems = selectedItemsWithRooms.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeight = selectedItemsWithRooms.reduce((sum, item) => sum + (item.weight * item.quantity), 0);

  // Comprehensive item control handlers for SelectedItemsManager
  const handleIncrementItem = (segmentIndex: number | null, itemId: string) => {
    if (segmentIndex !== null && isMultiLeg) {
      // Multi-leg: update specific segment
      const segment = segments[segmentIndex];
      const updatedItems = segment.items.map((item: any) =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      );
      updateSegment?.(segmentIndex, { items: updatedItems });
    } else {
      // Single-leg: update global items
      const updatedItems = (formData.step1.items || []).map((item: any) =>
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      );
      updateFormData('step1', { items: updatedItems });
    }
    
    if (calculatePricing) {
      setTimeout(() => calculatePricing(), 500);
    }
  };

  const handleDecrementItem = (segmentIndex: number | null, itemId: string) => {
    if (segmentIndex !== null && isMultiLeg) {
      // Multi-leg: update specific segment
      const segment = segments[segmentIndex];
      const updatedItems = segment.items
        .map((item: any) =>
          item.id === itemId && item.quantity > 1 
            ? { ...item, quantity: item.quantity - 1 } 
            : item
        )
        .filter((item: any) => item.quantity > 0);
      updateSegment?.(segmentIndex, { items: updatedItems });
    } else {
      // Single-leg: update global items
      const updatedItems = (formData.step1.items || [])
        .map((item: any) =>
          item.id === itemId && item.quantity > 1
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item: any) => item.quantity > 0);
      updateFormData('step1', { items: updatedItems });
    }
    
    if (calculatePricing) {
      setTimeout(() => calculatePricing(), 500);
    }
  };

  const handleRemoveItem = (segmentIndex: number | null, itemId: string) => {
    if (segmentIndex !== null && isMultiLeg) {
      // Multi-leg: update specific segment
      const segment = segments[segmentIndex];
      const updatedItems = segment.items.filter((item: any) => item.id !== itemId);
      updateSegment?.(segmentIndex, { items: updatedItems });
    } else {
      // Single-leg: update global items
      const updatedItems = (formData.step1.items || []).filter((item: any) => item.id !== itemId);
      updateFormData('step1', { items: updatedItems });
    }
    
    if (calculatePricing) {
      setTimeout(() => calculatePricing(), 500);
    }
  };

  // Wrapper for RoomBasedInventory - takes only itemId
  const handleRemoveItemForRoomInventory = (itemId: string) => {
    handleRemoveItem(null, itemId);
  };

  // Helper to get segment badge color
  const getSegmentBadgeColor = (type: string) => {
    switch (type) {
      case 'outbound':
        return 'green';
      case 'return':
        return 'blue';
      case 'additional':
        return 'purple';
      default:
        return 'gray';
    }
  };

  return (
    <Box>
      <VStack spacing={8} align="stretch">
        {/* Multi-Leg Journey Selector */}
        {isMultiLeg ? (
          <Card 
            bg="linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)"
            borderWidth="2px"
            borderColor="rgba(139, 92, 246, 0.4)"
            borderRadius="3xl"
            overflow="hidden"
            position="relative"
            boxShadow="0 20px 50px rgba(139, 92, 246, 0.15), 0 0 0 1px rgba(139, 92, 246, 0.1)"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              bgGradient: 'linear(to-r, purple.400, pink.400, purple.500)',
            }}
          >
            <CardBody p={{ base: 5, md: 8 }}>
              <VStack spacing={6} align="stretch">
                {/* Header Section */}
                <HStack spacing={4} align="center">
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg="linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2))"
                    border="1px solid"
                    borderColor="rgba(139, 92, 246, 0.3)"
                  >
                    <Icon as={FaShoppingBag} boxSize={6} color="purple.300" />
                  </Box>
                  <VStack spacing={1} align="flex-start" flex={1}>
                    <Heading 
                      size="md" 
                      bgGradient="linear(to-r, purple.300, pink.300)"
                      bgClip="text"
                      fontWeight="bold"
                    >
                      Select Items for Each Journey
                    </Heading>
                    <Text fontSize="sm" color="whiteAlpha.700">
                      Tap a journey card below to add items for that trip
                    </Text>
                  </VStack>
                </HStack>
                
                {/* Journey Selector Buttons - Stack on mobile for better readability */}
                <VStack spacing={3} w="full">
                  {segments.map((segment, index) => {
                    const isActive = selectedSegmentIndex === index;
                    const itemsCount = segment.items?.length || 0;
                    const segmentType = segment.segmentType;
                    
                    // Color schemes based on segment type
                    const colorSchemes: Record<string, { gradient: string; border: string; glow: string; icon: string }> = {
                      outbound: {
                        gradient: isActive 
                          ? 'linear(to-r, blue.500, cyan.500)' 
                          : 'linear(to-r, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.1))',
                        border: isActive ? 'blue.400' : 'rgba(59, 130, 246, 0.3)',
                        glow: isActive ? '0 0 20px rgba(59, 130, 246, 0.4)' : 'none',
                        icon: isActive ? 'white' : 'blue.400',
                      },
                      return: {
                        gradient: isActive 
                          ? 'linear(to-r, green.500, emerald.500)' 
                          : 'linear(to-r, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.1))',
                        border: isActive ? 'green.400' : 'rgba(34, 197, 94, 0.3)',
                        glow: isActive ? '0 0 20px rgba(34, 197, 94, 0.4)' : 'none',
                        icon: isActive ? 'white' : 'green.400',
                      },
                      additional: {
                        gradient: isActive 
                          ? 'linear(to-r, purple.500, pink.500)' 
                          : 'linear(to-r, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.1))',
                        border: isActive ? 'purple.400' : 'rgba(139, 92, 246, 0.3)',
                        glow: isActive ? '0 0 20px rgba(139, 92, 246, 0.4)' : 'none',
                        icon: isActive ? 'white' : 'purple.400',
                      },
                    };
                    
                    const colors = colorSchemes[segmentType] || colorSchemes.additional;
                    
                    // Debug logging
                    if (index === 0) {
                      console.log('🔍 Rendering segment buttons, segments:', segments.map(s => ({
                        id: s.id,
                        type: s.segmentType,
                        itemsCount: s.items?.length || 0,
                        items: s.items
                      })));
                    }
                    
                    return (
                      <Box
                        key={segment.id}
                        as="button"
                        onClick={() => setSelectedSegmentIndex(index)}
                        w="full"
                        bgGradient={colors.gradient}
                        borderWidth="2px"
                        borderColor={colors.border}
                        borderRadius="xl"
                        boxShadow={colors.glow}
                        transform={isActive ? 'scale(1.01)' : 'scale(1)'}
                        transition="all 0.2s ease"
                        _hover={{
                          transform: 'scale(1.02)',
                        }}
                        _active={{
                          transform: 'scale(0.99)',
                        }}
                        position="relative"
                        overflow="hidden"
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <Box
                            position="absolute"
                            top={2}
                            right={2}
                            bg="white"
                            borderRadius="full"
                            p={1}
                          >
                            <Icon as={FaCheck} boxSize={3} color={segmentType === 'outbound' ? 'blue.500' : segmentType === 'return' ? 'green.500' : 'purple.500'} />
                          </Box>
                        )}
                        
                        {/* Horizontal Card Layout */}
                        <HStack spacing={4} p={4} w="full" align="center">
                          {/* Icon */}
                          <Box
                            p={2}
                            borderRadius="lg"
                            bg={isActive ? 'whiteAlpha.200' : 'whiteAlpha.100'}
                            flexShrink={0}
                          >
                            <Icon 
                              as={segmentType === 'outbound' ? FaTruck : segmentType === 'return' ? FaRedo : FaPlus} 
                              boxSize={5} 
                              color={colors.icon} 
                            />
                          </Box>
                          
                          {/* Journey Info */}
                          <VStack spacing={0} align="flex-start" flex={1}>
                            <HStack spacing={2}>
                              <Text 
                                fontSize="sm" 
                                fontWeight="bold"
                                color={isActive ? 'white' : 'whiteAlpha.900'}
                              >
                                {segmentType === 'outbound' ? 'Outbound' : 
                                 segmentType === 'return' ? 'Return' : 'Additional'} Journey
                              </Text>
                              <Badge 
                                bg={isActive ? 'whiteAlpha.300' : 'whiteAlpha.200'}
                                color={isActive ? 'white' : 'whiteAlpha.900'}
                                fontSize="2xs"
                                px={2}
                                borderRadius="full"
                              >
                                {itemsCount} items
                              </Badge>
                            </HStack>
                            <Text 
                              fontSize="xs" 
                              color={isActive ? 'whiteAlpha.800' : 'whiteAlpha.600'}
                            >
                              {segment.pickupAddress?.postcode || '?'} → {segment.dropoffAddress?.postcode || '?'}
                            </Text>
                          </VStack>
                          
                          {/* Arrow indicator */}
                          <Icon 
                            as={FaArrowRight} 
                            color={isActive ? 'white' : 'whiteAlpha.500'} 
                            boxSize={4}
                            flexShrink={0}
                          />
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>

                {/* Active Journey Info Banner */}
                <Box
                  bg="linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.1))"
                  borderRadius="xl"
                  p={{ base: 3, md: 4 }}
                  border="1px solid"
                  borderColor="rgba(139, 92, 246, 0.3)"
                >
                  <HStack spacing={{ base: 3, md: 4 }}>
                    <Box
                      p={2}
                      borderRadius="lg"
                      bg={`${getSegmentBadgeColor(segments[selectedSegmentIndex]?.segmentType)}.500`}
                    >
                      <Icon as={FaShoppingBag} color="white" boxSize={4} />
                    </Box>
                    <VStack spacing={0} align="flex-start" flex={1}>
                      <HStack spacing={2}>
                        <Text fontSize="sm" fontWeight="bold" color="white">
                          Now adding items for
                        </Text>
                        <Badge
                          colorScheme={getSegmentBadgeColor(segments[selectedSegmentIndex]?.segmentType)}
                          fontSize="xs"
                          px={2}
                          borderRadius="full"
                        >
                          Journey {selectedSegmentIndex + 1}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="whiteAlpha.700">
                        {segments[selectedSegmentIndex]?.pickupAddress?.full || segments[selectedSegmentIndex]?.pickupAddress?.postcode || 'Not set'} → {segments[selectedSegmentIndex]?.dropoffAddress?.full || segments[selectedSegmentIndex]?.dropoffAddress?.postcode || 'Not set'}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </VStack>
            </CardBody>
          </Card>
        ) : (
          /* Search Box for Quick Item Search */
          <Box>
            <Input
              size="lg"
              placeholder="🔍 Search for any item... (sofa, bed, boxes, etc.)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              bg="whiteAlpha.100"
              border="2px solid"
              borderColor="purple.400"
              borderRadius="xl"
              color="white"
              fontSize="md"
              py={6}
              _placeholder={{ color: 'whiteAlpha.600' }}
              _hover={{ borderColor: 'purple.300', bg: 'whiteAlpha.150' }}
              _focus={{ 
                borderColor: 'purple.300', 
                boxShadow: '0 0 0 3px rgba(168, 85, 247, 0.3)',
                bg: 'whiteAlpha.200'
              }}
            />
            
            {/* Search Results */}
            {searchQuery.trim() && (
              <Card mt={3} bg="whiteAlpha.100" borderRadius="xl" border="1px solid" borderColor="purple.400">
                <CardBody p={4}>
                  <VStack spacing={3} align="stretch">
                    <Text fontSize="sm" color="whiteAlpha.700" fontWeight="600">
                      Search results for "{searchQuery}"
                    </Text>
                    <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
                      {ALL_REMOVAL_ITEMS
                        .filter(item => 
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .slice(0, 12)
                        .map(item => {
                          const existingItem = selectedItemsWithRooms.find(i => i.id === item.id);
                          const quantity = existingItem?.quantity || 0;
                          return (
                            <Box
                              key={item.id}
                              bg={quantity > 0 ? 'purple.600' : 'whiteAlpha.100'}
                              borderRadius="lg"
                              p={3}
                              border="1px solid"
                              borderColor={quantity > 0 ? 'purple.400' : 'whiteAlpha.200'}
                              cursor="pointer"
                              transition="all 0.2s"
                              _hover={{ 
                                bg: quantity > 0 ? 'purple.500' : 'whiteAlpha.200',
                                transform: 'translateY(-2px)'
                              }}
                              onClick={() => {
                                handleAddItem(item as any, 'Search', 1);
                                setSearchQuery('');
                              }}
                            >
                              <VStack spacing={1}>
                                <Text fontSize="sm" fontWeight="600" color="white" textAlign="center" noOfLines={2}>
                                  {item.name}
                                </Text>
                                {quantity > 0 && (
                                  <Badge colorScheme="green" borderRadius="full">
                                    {quantity} added
                                  </Badge>
                                )}
                                <Icon as={FaPlus} color="whiteAlpha.600" boxSize={4} />
                              </VStack>
                            </Box>
                          );
                        })}
                    </SimpleGrid>
                    {ALL_REMOVAL_ITEMS.filter(item => 
                      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.category.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 && (
                      <Text fontSize="sm" color="whiteAlpha.500" textAlign="center" py={4}>
                        No items found. Try a different search term.
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>
            )}
          </Box>
        )}

        {/* Common Items Grid - Always visible at the top */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md" color="purple.600">
                Most Common Items to Move
              </Heading>
              <Text fontSize="sm" color="gray.600">
                Click + to add items quickly, or browse detailed categories below.
              </Text>
              <CommonItemsGrid 
                onAddItem={(item, quantity) => {
                  const removalItem = {
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    weight: item.weight,
                  };
                  
                  if (quantity > 0) {
                    handleAddItem(removalItem as any, 'Quick Selection', 1);
                  } else {
                    // Handle removal
                    const updated = selectedItemsWithRooms.filter(i => i.id !== item.id);
                    setSelectedItemsWithRooms(updated);
                    
                    const mappedItems = updated.map(i => ({
                      id: i.id,
                      name: i.name,
                      category: i.category,
                      weight: i.weight,
                      quantity: i.quantity,
                      size: 'medium' as const,
                      volume: 1.0,
                      unitPrice: 25,
                      totalPrice: 25 * i.quantity,
                      description: `${i.name} from ${i.room}`,
                    }));
                    
                    // CRITICAL: Read fresh from formData to check if multi-leg
                    const currentSegments = (formData.step1.segments || []) as BookingSegment[];
                    const currentIsMultiLeg = currentSegments.length > 1;

                    // For multi-leg: save to ALL segments (same items for outbound and return)
                    if (currentIsMultiLeg) {
                      // Update ALL segments with the same items (deep copy for each)
                      const updatedSegments = currentSegments.map((segment) => ({
                        ...segment,
                        items: mappedItems.map(item => ({ ...item }))
                      }));
                      
                      // Mark that we're updating segments to prevent useEffect from clearing items
                      justUpdatedSegmentsRef.current = true;
                      
                      // Also update global items for fallback compatibility
                      updateFormData('step1', { segments: updatedSegments, items: mappedItems });
                    } else {
                      // Single-leg: save to global items
                      updateFormData('step1', { items: mappedItems });
                    }
                  }
                }}
              />
            </VStack>
          </CardBody>
        </Card>

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
                onRemoveItem={handleRemoveItemForRoomInventory}
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
            bottom={{ base: '180px', md: '110px' }}
            right={{ base: '20px', md: '30px' }}
            zIndex={1500}
          >
            <Flex
              as="button"
              onClick={handleToggleSummary}
              direction="column"
              align="center"
              justify="center"
              bgGradient={isSummaryExpanded 
                ? "linear(135deg, #7c3aed, #4f46e5)" 
                : "linear(135deg, #f43f5e, #ec4899)"}
              color="white"
              borderRadius="full"
              w={{ base: '70px', md: '80px' }}
              h={{ base: '70px', md: '80px' }}
              cursor={isToggling ? 'wait' : 'pointer'}
              boxShadow={isSummaryExpanded 
                ? "0 8px 32px rgba(124, 58, 237, 0.5)" 
                : "0 8px 32px rgba(244, 63, 94, 0.5)"}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              border="3px solid white"
              position="relative"
              opacity={isToggling ? 0.7 : 1}
              pointerEvents={isToggling ? 'none' : 'auto'}
              overflow="hidden"
              _hover={{
                transform: isToggling ? 'none' : 'scale(1.1)',
                boxShadow: isSummaryExpanded 
                  ? '0 12px 40px rgba(124, 58, 237, 0.6)' 
                  : '0 12px 40px rgba(244, 63, 94, 0.6)',
              }}
              _active={{
                transform: isToggling ? 'none' : 'scale(0.95)',
              }}
              textAlign="center"
            >
              <Icon 
                as={isSummaryExpanded ? FaTimes : FaShoppingBag} 
                boxSize={{ base: 6, md: 7 }} 
                color="white"
                transition="all 0.3s"
                filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))"
                zIndex={1}
              />
              {/* Item count badge */}
              <Badge
                position="absolute"
                top="-4px"
                right="-4px"
                colorScheme="yellow"
                borderRadius="full"
                minW="24px"
                h="24px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="xs"
                fontWeight="bold"
                boxShadow="0 2px 8px rgba(0, 0, 0, 0.3)"
              >
                {selectedItemsWithRooms.reduce((sum, item) => sum + item.quantity, 0)}
              </Badge>
            </Flex>
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
                {/* Use new comprehensive Selected Items Manager */}
                <SelectedItemsManager
                  segments={segments}
                  isMultiLeg={isMultiLeg}
                  globalItems={formData.step1.items || []}
                  onIncrement={handleIncrementItem}
                  onDecrement={handleDecrementItem}
                  onRemove={handleRemoveItem}
                  showPricing={false}
                  readonly={false}
                  currentSegmentIndex={selectedSegmentIndex}
                />
              </Box>
            </Collapse>
          </Box>
        </>
      )}
    </Box>
  );
}
