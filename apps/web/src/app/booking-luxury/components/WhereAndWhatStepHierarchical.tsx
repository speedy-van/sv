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
  CardHeader,
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
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
  Select,
  SimpleGrid,
  Heading,
  Icon,
  useDisclosure,
  Switch,
  Collapse,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Circle,
} from '@chakra-ui/react';
import { FaArrowLeft, FaArrowRight, FaShoppingBag, FaTimes, FaChevronUp, FaPlus, FaMinus, FaTrash, FaTruck, FaRedo, FaCheck, FaMapMarkerAlt, FaSearch, FaShieldAlt } from 'react-icons/fa';
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
  const addOnsRef = useRef<HTMLDivElement | null>(null);
  
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
  const addOns = step1.addOns || {
    packing: false,
    packingVolume: undefined,
    furnitureProtection: false,
    insurance: undefined,
    assembly: false,
    disassembly: [],
    reassembly: [],
  };
  const itemsForAddOns = isMultiLeg
    ? (segments[selectedSegmentIndex]?.items || step1.items || [])
    : (step1.items || []);
  const estimatedPackingVolume = itemsForAddOns.reduce((sum, item) => {
    const volume = (item as any).volume || 0;
    const quantity = (item as any).quantity || 1;
    return sum + volume * quantity;
  }, 0);
  const resolveAssemblyItems = () => {
    const fromState = Array.isArray(addOns.disassembly) && addOns.disassembly.length > 0
      ? addOns.disassembly
      : [];
    const fromItems = itemsForAddOns.map(item => (item as any).name || (item as any).id).filter(Boolean);
    return fromItems.length > 0 ? fromItems : fromState;
  };
  const handleAddOnToggle = (key: 'packing' | 'furnitureProtection' | 'assembly', value: boolean) => {
    const assemblyItems = resolveAssemblyItems();
    const nextAddOns = {
      ...addOns,
      packing: key === 'packing' ? value : addOns.packing,
      packingVolume: key === 'packing'
        ? (value ? (addOns.packingVolume ?? Math.max(Math.round(estimatedPackingVolume * 10) / 10, 1)) : undefined)
        : addOns.packingVolume,
      furnitureProtection: key === 'furnitureProtection' ? value : addOns.furnitureProtection,
      insurance: key === 'furnitureProtection'
        ? (value ? (addOns.insurance || 'premium') : undefined)
        : addOns.insurance,
      assembly: key === 'assembly' ? value : addOns.assembly,
      disassembly: key === 'assembly'
        ? (value ? (addOns.disassembly && addOns.disassembly.length > 0 ? addOns.disassembly : assemblyItems) : [])
        : addOns.disassembly,
      reassembly: key === 'assembly'
        ? (value ? (addOns.reassembly && addOns.reassembly.length > 0 ? addOns.reassembly : assemblyItems) : [])
        : addOns.reassembly,
    };
    updateFormData('step1', { addOns: nextAddOns });
    if (calculatePricing) {
      setTimeout(() => calculatePricing(), 400);
    }
  };

  const scrollToAddOns = useCallback(() => {
    if (addOnsRef.current) {
      addOnsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

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
  const lastItemsCountRef = useRef<number>(0);
  
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
    const currentItemsCount = currentSegment?.items?.length || 0;
    
    // Skip reload if items count hasn't changed (prevents unnecessary reloads)
    if (currentItemsCount === lastItemsCountRef.current && !isJustAdded) {
      return;
    }
    
    console.log(`🔄 Loading items for segment ${selectedSegmentIndex}:`, {
      segmentExists: !!currentSegment,
      hasItems: !!currentSegment?.items,
      itemsCount: currentItemsCount,
      lastCount: lastItemsCountRef.current,
      isNewSegmentAdded: isJustAdded
    });
    
    const itemsWithRooms = loadItemsFromSegment(currentSegment);
    
    if (itemsWithRooms && itemsWithRooms.length > 0) {
      console.log(`✅ Loaded ${itemsWithRooms.length} items for segment ${selectedSegmentIndex}`);
      setSelectedItemsWithRooms(itemsWithRooms);
      lastItemsCountRef.current = itemsWithRooms.length;
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
          lastItemsCountRef.current = retryItems.length;
        } else {
          console.log(`⚠️ Retry: Still no items found for segment ${selectedSegmentIndex}`);
          lastItemsCountRef.current = 0;
        }
        isNewSegmentAddedRef.current = false;
      }, 50);
      
      return () => clearTimeout(retryTimer);
    } else {
      // Only clear if segment truly has no items
      if (!currentSegment?.items || currentSegment.items.length === 0) {
        console.log(`⚠️ No items found for segment ${selectedSegmentIndex}, clearing selection`);
        setSelectedItemsWithRooms([]);
        lastItemsCountRef.current = 0;
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

    // For multi-leg: save to CURRENT segment ONLY (not synced anymore)
    if (currentIsMultiLeg && updateSegment) {
      // Update ONLY the selected segment
      updateSegment(selectedSegmentIndex, { items: mappedItems });
      // Also update global items for backward compatibility
      updateFormData('step1', { items: mappedItems });
      console.log(`✅ Pre-populated: Updated segment ${selectedSegmentIndex} with ${mappedItems.length} items (NOT synced to other segments)`);
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
      selectedSegmentIndex,
      mappedItemsCount: mappedItems.length,
      segmentTypes: currentSegments.map(s => s.segmentType)
    });

    // For multi-leg: save to CURRENT segment ONLY (isolated per journey)
    if (currentIsMultiLeg && updateSegment) {
      // Update ONLY the selected segment (items are now isolated per journey)
      updateSegment(selectedSegmentIndex, { items: mappedItems });
      
      console.log('🔍 DEBUG handleAddItem - Updated segment:', {
        segmentIndex: selectedSegmentIndex,
        itemsCount: mappedItems.length
      });
      
      // Mark that we're updating segments to prevent useEffect from clearing items
      justUpdatedSegmentsRef.current = true;
      
      // Also update global items for fallback compatibility
      updateFormData('step1', { items: mappedItems });
      console.log(`✅ Updated segment ${selectedSegmentIndex} with ${mappedItems.length} items (isolated - NOT synced to other segments)`);
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

    // For multi-leg: save to CURRENT segment ONLY (isolated per journey)
    if (currentIsMultiLeg && updateSegment) {
      // Update ONLY the selected segment
      updateSegment(selectedSegmentIndex, { items: mappedItems });
      
      // Mark that we're updating segments to prevent useEffect from clearing items
      justUpdatedSegmentsRef.current = true;
      
      // Also update global items for fallback compatibility
      updateFormData('step1', { items: mappedItems });
      console.log(`✅ AI items: Updated segment ${selectedSegmentIndex} with ${mappedItems.length} items (isolated)`);
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

    // For multi-leg: save to CURRENT segment ONLY (isolated per journey)
    if (currentIsMultiLeg && updateSegment) {
      // Update ONLY the selected segment
      updateSegment(selectedSegmentIndex, { items: mappedItems });
      
      // Mark that we're updating segments to prevent useEffect from clearing items
      justUpdatedSegmentsRef.current = true;
      
      // Also update global items for fallback compatibility
      updateFormData('step1', { items: mappedItems });
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
      justUpdatedSegmentsRef.current = true;
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
      justUpdatedSegmentsRef.current = true;
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
      justUpdatedSegmentsRef.current = true;
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
          <>
          {/* Enhanced Search Box for Quick Item Search */}
          <Card
            bg="white"
            borderRadius="2xl"
            boxShadow="lg"
            border="1px solid"
            borderColor="purple.100"
            overflow="hidden"
          >
            {/* Search Header with gradient */}
            <Box
              bgGradient="linear(to-r, blue.500, purple.500)"
              px={4}
              py={3}
            >
              <HStack spacing={2} align="center">
                <Box
                  bg="whiteAlpha.200"
                  borderRadius="lg"
                  p={2}
                >
                  <Icon as={FaSearch} color="white" boxSize={4} />
                </Box>
                <VStack spacing={0} align="start">
                  <Text fontSize="md" color="white" fontWeight="bold">
                    Search Items
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.800">
                    Find any furniture or appliance quickly
                  </Text>
                </VStack>
              </HStack>
            </Box>
            
            <CardBody p={4}>
              <VStack spacing={3}>
                {/* Search Input with Blue Neon Border Animation */}
                <Box
                  position="relative"
                  w="100%"
                  sx={{
                    '@keyframes borderTravel': {
                      '0%': { 
                        clipPath: 'inset(0 100% 100% 0)',
                      },
                      '25%': { 
                        clipPath: 'inset(0 0 100% 0)',
                      },
                      '50%': { 
                        clipPath: 'inset(0 0 0 100%)',
                      },
                      '75%': { 
                        clipPath: 'inset(100% 0 0 0)',
                      },
                      '100%': { 
                        clipPath: 'inset(0 100% 0 0)',
                      },
                    },
                  }}
                >
                  {/* Animated neon border - travels around the edges */}
                  <Box
                    position="absolute"
                    top="-2px"
                    left="-2px"
                    right="-2px"
                    bottom="-2px"
                    borderRadius="xl"
                    border="3px solid"
                    borderColor="#3b82f6"
                    boxShadow="0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 30px #3b82f6"
                    sx={{
                      animation: 'borderTravel 2s linear infinite',
                    }}
                    pointerEvents="none"
                  />
                  {/* Static subtle border underneath */}
                  <Box
                    position="absolute"
                    top="-2px"
                    left="-2px"
                    right="-2px"
                    bottom="-2px"
                    borderRadius="xl"
                    border="2px solid"
                    borderColor="blue.200"
                    opacity={0.3}
                    pointerEvents="none"
                  />
                  <InputGroup size="lg">
                    <Input
                      placeholder="Type to search... (sofa, bed, boxes)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      bg="white"
                      border="2px solid"
                      borderColor="transparent"
                      borderRadius="xl"
                      color="gray.800"
                      fontSize="md"
                      fontWeight="medium"
                      h="56px"
                      _placeholder={{ color: 'gray.400', fontWeight: 'normal' }}
                      _hover={{ bg: 'gray.50' }}
                      _focus={{ 
                        bg: 'white',
                        borderColor: 'transparent',
                        boxShadow: 'none',
                      }}
                    />
                    {searchQuery && (
                      <InputRightElement h="full" pr={2}>
                        <IconButton
                          aria-label="Clear search"
                          icon={<Icon as={FaTimes} />}
                          size="sm"
                          variant="ghost"
                          colorScheme="gray"
                          onClick={() => setSearchQuery('')}
                          borderRadius="full"
                        />
                      </InputRightElement>
                    )}
                  </InputGroup>
                </Box>
                
                {/* Quick suggestion chips */}
                {!searchQuery.trim() && (
                  <HStack spacing={2} flexWrap="wrap" justify="center">
                    {['Sofa', 'Bed', 'Boxes', 'Table', 'Wardrobe'].map((suggestion) => (
                      <Badge
                        key={suggestion}
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        bg="purple.50"
                        color="purple.600"
                        fontWeight="medium"
                        fontSize="xs"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ bg: 'purple.100', transform: 'scale(1.05)' }}
                        onClick={() => setSearchQuery(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </HStack>
                )}
                
                {/* Search Results - Inside the same card */}
                {searchQuery.trim() && (
                  <Box mt={4} pt={4} borderTop="1px solid" borderColor="gray.200">
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between" align="center">
                        <HStack spacing={2}>
                          <Icon as={FaSearch} color="purple.500" boxSize={4} />
                          <Text fontSize="sm" color="gray.600" fontWeight="600">
                            Results for "<Text as="span" color="purple.600">{searchQuery}</Text>"
                          </Text>
                        </HStack>
                        <Badge colorScheme="purple" borderRadius="full" px={2}>
                          {ALL_REMOVAL_ITEMS.filter(item => 
                            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchQuery.toLowerCase())
                          ).length} found
                        </Badge>
                      </HStack>
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
                                bg={quantity > 0 ? 'green.50' : 'gray.50'}
                                borderRadius="lg"
                                p={3}
                                border="2px solid"
                                borderColor={quantity > 0 ? 'green.400' : 'gray.200'}
                                cursor="pointer"
                                transition="all 0.2s"
                                _hover={{ 
                                  bg: quantity > 0 ? 'green.100' : 'purple.50',
                                  borderColor: quantity > 0 ? 'green.500' : 'purple.300',
                                  transform: 'translateY(-2px)',
                                  boxShadow: 'md'
                                }}
                                onClick={() => {
                                  handleAddItem(item as any, 'Search', 1);
                                  setSearchQuery('');
                                }}
                              >
                                <VStack spacing={1}>
                                  <Text fontSize="xs" fontWeight="600" color="gray.700" textAlign="center" noOfLines={2}>
                                    {item.name}
                                  </Text>
                                  {quantity > 0 ? (
                                    <Badge colorScheme="green" borderRadius="full" fontSize="2xs">
                                      {quantity} added
                                    </Badge>
                                  ) : (
                                    <HStack spacing={1}>
                                      <Icon as={FaPlus} color="purple.500" boxSize={3} />
                                      <Text fontSize="2xs" color="purple.500" fontWeight="medium">Add</Text>
                                    </HStack>
                                  )}
                                </VStack>
                              </Box>
                            );
                          })}
                      </SimpleGrid>
                      {ALL_REMOVAL_ITEMS.filter(item => 
                        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.category.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                        <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                          No items found. Try a different search term.
                        </Text>
                      )}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
          </>
        )}

        {/* Quick access to Add-on Services */}
        <Card
          mt={4}
          bg="rgba(79, 70, 229, 0.08)"
          border="1px solid"
          borderColor="purple.200"
          borderRadius="xl"
        >
          <CardBody display="flex" justifyContent="space-between" alignItems="center" gap={3} flexWrap="wrap">
            <VStack align="flex-start" spacing={0}>
              <Text fontWeight="bold" color="purple.800">Add-on Services</Text>
              <Text fontSize="sm" color="purple.700">Packing, protection, and assembly for premium moves.</Text>
            </VStack>
            <Button colorScheme="purple" variant="solid" onClick={scrollToAddOns}>
              Jump to Add-ons
            </Button>
          </CardBody>
        </Card>

        {/* Common Items Grid - Always visible at the top */}
        <Card 
          bg="white" 
          borderRadius="2xl" 
          boxShadow="lg" 
          border="1px solid" 
          borderColor="purple.100"
          overflow="hidden"
        >
          {/* Header with gradient */}
          <Box
            bgGradient="linear(to-r, purple.500, purple.600)"
            px={4}
            py={3}
          >
            <HStack spacing={2} align="center">
              <Box
                bg="whiteAlpha.200"
                borderRadius="lg"
                p={2}
              >
                <Text fontSize="xl">⚡</Text>
              </Box>
              <VStack spacing={0} align="start">
                <Heading size="md" color="white" fontWeight="bold">
                  Quick Add Items
                </Heading>
                <Text fontSize="xs" color="whiteAlpha.800">
                  Most popular furniture & appliances
                </Text>
              </VStack>
            </HStack>
          </Box>
          
          <CardBody pt={3} pb={4}>
            <VStack spacing={4} align="stretch">
              {/* Instructions */}
              <HStack 
                spacing={3} 
                bg="gray.50" 
                p={3} 
                borderRadius="lg"
                flexWrap="wrap"
                justify="center"
              >
                <HStack spacing={1}>
                  <Box 
                    bg="green.500" 
                    color="white" 
                    borderRadius="md" 
                    w={6} 
                    h={6} 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    +
                  </Box>
                  <Text fontSize="xs" color="gray.600">Add</Text>
                </HStack>
                <HStack spacing={1}>
                  <Box 
                    bg="red.500" 
                    color="white" 
                    borderRadius="md" 
                    w={6} 
                    h={6} 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="center"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    −
                  </Box>
                  <Text fontSize="xs" color="gray.600">Remove</Text>
                </HStack>
                <Text fontSize="xs" color="gray.500">|</Text>
                <Text fontSize="xs" color="gray.600" fontWeight="medium">
                  Tap category to browse ⬇️
                </Text>
              </HStack>
              
              <CommonItemsGrid 
                selectedItems={selectedItemsWithRooms.map(i => ({
                  id: i.id,
                  name: i.name,
                  quantity: i.quantity
                }))}
                onAddItem={(item, quantity) => {
                  const removalItem = {
                    id: item.id,
                    name: item.name,
                    category: item.category,
                    weight: item.weight,
                  };
                  
                  if (quantity > 0) {
                    // Check if item already exists
                    const existingItemIndex = selectedItemsWithRooms.findIndex(i => i.id === item.id);
                    
                    let updated;
                    if (existingItemIndex >= 0) {
                      // Update existing item quantity
                      updated = [...selectedItemsWithRooms];
                      updated[existingItemIndex] = {
                        ...updated[existingItemIndex],
                        quantity: quantity
                      };
                    } else {
                      // Add new item
                      updated = [
                        ...selectedItemsWithRooms,
                        {
                          ...removalItem,
                          quantity: quantity,
                          room: 'Quick Selection'
                        }
                      ];
                    }
                    
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

                    // For multi-leg: save to CURRENT segment ONLY (isolated per journey)
                    if (currentIsMultiLeg && updateSegment) {
                      // Update ONLY the selected segment
                      updateSegment(selectedSegmentIndex, { items: mappedItems });
                      
                      // Mark that we're updating segments to prevent useEffect from clearing items
                      justUpdatedSegmentsRef.current = true;
                      
                      // Also update global items for fallback compatibility
                      updateFormData('step1', { items: mappedItems });
                    } else {
                      // Single-leg: save to global items
                      updateFormData('step1', { items: mappedItems });
                    }
                  } else {
                    // quantity is 0 - remove item
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

                    // For multi-leg: save to CURRENT segment ONLY (isolated per journey)
                    if (currentIsMultiLeg && updateSegment) {
                      // Update ONLY the selected segment
                      updateSegment(selectedSegmentIndex, { items: mappedItems });
                      
                      // Mark that we're updating segments to prevent useEffect from clearing items
                      justUpdatedSegmentsRef.current = true;
                      
                      // Also update global items for fallback compatibility
                      updateFormData('step1', { items: mappedItems });
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

        {/* Add-on Services - keep pricing in sync with luxury promise */}
        <Card
          ref={addOnsRef}
          bg="linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(49, 46, 129, 0.9))"
          borderRadius="2xl"
          boxShadow="0 20px 60px rgba(79, 70, 229, 0.15)"
          border="1px solid"
          borderColor="rgba(129, 140, 248, 0.35)"
        >
          <CardHeader borderBottom="1px solid" borderColor="rgba(255,255,255,0.08)" pb={4}>
            <VStack align="flex-start" spacing={1}>
              <HStack spacing={2}>
                <Circle size="38px" bg="whiteAlpha.200">
                  <Icon as={FaShieldAlt} color="purple.200" />
                </Circle>
                <VStack align="flex-start" spacing={0}>
                  <Heading size="md" color="white">
                    Add-on Services
                  </Heading>
                  <Text color="whiteAlpha.700" fontSize="sm">
                    Match the premium promise with optional packing, protection, and assembly.
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </CardHeader>
          <CardBody>
            <SimpleGrid
              minChildWidth="260px"
              spacing={4}
              w="full"
            >
              <Box
                p={4}
                borderRadius="lg"
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="purple.200"
              >
                <HStack justify="space-between" align="center" mb={2}>
                  <Text fontWeight="bold" color="white">
                    Professional Packing
                  </Text>
                  <Switch
                    colorScheme="purple"
                    isChecked={Boolean(addOns.packing)}
                    onChange={(e) => handleAddOnToggle('packing', e.target.checked)}
                  />
                </HStack>
                <Text fontSize="sm" color="whiteAlpha.800">
                  White-glove packing with premium materials to protect your belongings.
                </Text>
                <Text fontSize="xs" color="purple.200" mt={2}>
                  Estimated volume: {Math.max(estimatedPackingVolume, 0).toFixed(1)} m3
                </Text>
              </Box>

              <Box
                p={4}
                borderRadius="lg"
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="blue.200"
              >
                <HStack justify="space-between" align="center" mb={2}>
                  <Text fontWeight="bold" color="white">
                    Furniture Protection
                  </Text>
                  <Switch
                    colorScheme="blue"
                    isChecked={Boolean(addOns.furnitureProtection)}
                    onChange={(e) => handleAddOnToggle('furnitureProtection', e.target.checked)}
                  />
                </HStack>
                <Text fontSize="sm" color="whiteAlpha.800">
                  Enhanced insurance and padding for high-value and delicate pieces.
                </Text>
                <Text fontSize="xs" color="blue.200" mt={2}>
                  Uses premium cover for luxury moves
                </Text>
              </Box>

              <Box
                p={4}
                borderRadius="lg"
                bg="whiteAlpha.50"
                border="1px solid"
                borderColor="teal.200"
              >
                <HStack justify="space-between" align="center" mb={2}>
                  <Text fontWeight="bold" color="white">
                    Assembly / Disassembly
                  </Text>
                  <Switch
                    colorScheme="teal"
                    isChecked={Boolean(addOns.assembly)}
                    onChange={(e) => handleAddOnToggle('assembly', e.target.checked)}
                  />
                </HStack>
                <Text fontSize="sm" color="whiteAlpha.800">
                  Skilled team dismantles and reassembles furniture on-site.
                </Text>
                <Text fontSize="xs" color="teal.200" mt={2}>
                  Auto-applied to current item list for accurate pricing
                </Text>
              </Box>
            </SimpleGrid>
            <Text mt={3} fontSize="xs" color="whiteAlpha.700">
              Pricing updates instantly when you toggle any add-on.
            </Text>
          </CardBody>
        </Card>

        {/* AI Assistant - Controlled by parent via FloatingActionButtons */}

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

      {/* Selected Items Floating Button - Handled by parent */}
      {selectedItemsWithRooms.length > 0 && (
        <>

        </>
      )}

      {/* Expose toggle function to parent via ref */}
      {/* This allows parent to control summary panel */}
    </Box>
  );
}
