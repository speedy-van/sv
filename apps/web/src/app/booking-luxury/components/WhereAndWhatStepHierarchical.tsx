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
import LuxurySurfaceCard from './LuxurySurfaceCard';
import { getPrePopulatedItems, filterByPriority } from '@/lib/pre-populated-inventory';
import { ALL_REMOVAL_ITEMS, type RemovalItem } from '@/lib/uk-removal-items-data';
import { CommonItemsGrid } from '@/components/booking/CommonItemsGrid';
import SelectedItemsManager from './SelectedItemsManager';
import { CATEGORY_CONFIGS } from '@/components/ui/CategoryFlipCard';
import { ResponsiveSection } from '@/components/layout/ResponsiveSection';

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
  
  // Collapsible Add-on Services state
  const [isAddOnsExpanded, setIsAddOnsExpanded] = useState(false);
  
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
    <ResponsiveSection maxW="1200px" w="full">
      <Box w="full">
      <VStack spacing={{ base: 6, md: 8 }} align="stretch">
        {/* Multi-Leg Journey Selector */}
        {isMultiLeg ? (
          <LuxurySurfaceCard
            tone="info"
            borderWidth="1px"
            borderRadius="2xl"
            overflow="hidden"
            position="relative"
            boxShadow="lg"
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
            <Box p={{ base: 5, md: 8 }}>
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
                    <Text fontSize="sm" color="text.secondary">
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
                            bg="bg.surface"
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
                            bg={isActive ? 'bg.surface.elevated' : 'bg.surface'}
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
                                color={isActive ? 'text.primary' : 'text.secondary'}
                              >
                                {segmentType === 'outbound' ? 'Outbound' : 
                                 segmentType === 'return' ? 'Return' : 'Additional'} Journey
                              </Text>
                              <Badge 
                                bg={isActive ? 'bg.surface.elevated' : 'bg.surface'}
                                color={isActive ? 'text.primary' : 'text.secondary'}
                                fontSize="2xs"
                                px={2}
                                borderRadius="full"
                              >
                                {itemsCount} items
                              </Badge>
                            </HStack>
                            <Text 
                              fontSize="xs" 
                              color={isActive ? 'text.secondary' : 'text.tertiary'}
                            >
                              {segment.pickupAddress?.postcode || '?'} → {segment.dropoffAddress?.postcode || '?'}
                            </Text>
                          </VStack>
                          
                          {/* Arrow indicator */}
                          <Icon 
                            as={FaArrowRight} 
                            color={isActive ? 'text.primary' : 'text.tertiary'} 
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
                  bg="bg.surface.elevated"
                  borderRadius="xl"
                  p={{ base: 3, md: 4 }}
                  border="1px solid"
                  borderColor="border.primary"
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
                        <Text fontSize="sm" fontWeight="bold" color="text.primary">
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
                      <Text fontSize="xs" color="text.secondary">
                        {segments[selectedSegmentIndex]?.pickupAddress?.full || segments[selectedSegmentIndex]?.pickupAddress?.postcode || 'Not set'} → {segments[selectedSegmentIndex]?.dropoffAddress?.full || segments[selectedSegmentIndex]?.dropoffAddress?.postcode || 'Not set'}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </VStack>
            </Box>
          </LuxurySurfaceCard>
        ) : (
          <>
          {/* Search items — accessible, no neon/motion, clear labels */}
          <Box
            bg="bg.card"
            borderRadius="xl"
            borderWidth="1px"
            borderColor="border.primary"
            p={4}
          >
            <FormControl>
              <FormLabel fontWeight="600" color="text.primary">
                Search items
              </FormLabel>
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none">
                  <Icon as={FaSearch} color="text.secondary" />
                </InputLeftElement>
                <Input
                  id="item-search"
                  placeholder="e.g. sofa, bed, boxes"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="bg.surface"
                  borderColor="border.primary"
                  color="text.primary"
                  _focus={{ borderColor: 'interactive.primary', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                  aria-label="Search for furniture or appliances"
                />
                {searchQuery && (
                  <InputRightElement>
                    <IconButton
                      aria-label="Clear search"
                      icon={<Icon as={FaTimes} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setSearchQuery('')}
                    />
                  </InputRightElement>
                )}
              </InputGroup>
            </FormControl>
            {!searchQuery.trim() && (
              <HStack mt={3} spacing={2} flexWrap="wrap">
                {['Sofa', 'Bed', 'Boxes', 'Table', 'Wardrobe'].map((suggestion) => (
                  <Button
                    key={suggestion}
                    size="sm"
                    variant="outline"
                    colorScheme="gray"
                    onClick={() => setSearchQuery(suggestion)}
                    _focus={{ boxShadow: '0 0 0 2px var(--chakra-colors-blue-400)' }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </HStack>
            )}
            {!searchQuery.trim() && (
              <Box mt={4} pt={4} borderTop="1px solid" borderColor="border.primary">
                <Text fontSize="sm" fontWeight="600" color="text.secondary" mb={2}>
                  Browse by category
                </Text>
                <SimpleGrid columns={{ base: 2, sm: 3 }} spacing={2} maxW={{ base: '100%', sm: '420px' }}>
                  {CATEGORY_CONFIGS.slice(0, 6).map((cat) => (
                    <Button
                      key={cat.id}
                      variant="outline"
                      size="sm"
                      borderColor="border.primary"
                      color="text.primary"
                      bg="bg.surface"
                      _hover={{ bg: 'bg.surface.elevated', borderColor: 'interactive.primary' }}
                      _focus={{ boxShadow: '0 0 0 2px var(--chakra-colors-blue-400)' }}
                      onClick={() => setSearchQuery(cat.displayName)}
                    >
                      {cat.displayName}
                    </Button>
                  ))}
                </SimpleGrid>
              </Box>
            )}
            {searchQuery.trim() && (
              <Box mt={4} pt={4} borderTop="1px solid" borderColor="border.primary">
                <Text fontSize="sm" fontWeight="600" color="text.primary" mb={2}>
                  Results for &quot;{searchQuery}&quot;
                </Text>
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3} role="list">
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
                          as="button"
                          type="button"
                          w="full"
                          py={3}
                          px={2}
                          borderRadius="lg"
                          border="2px solid"
                          borderColor={quantity > 0 ? 'green.400' : 'border.primary'}
                          bg={quantity > 0 ? 'green.50' : 'bg.surface'}
                          textAlign="center"
                          cursor="pointer"
                          _hover={{ borderColor: quantity > 0 ? 'green.500' : 'interactive.primary' }}
                          _focus={{ outline: 'none', boxShadow: '0 0 0 2px var(--chakra-colors-blue-400)' }}
                          onClick={() => {
                            handleAddItem(item as any, 'Search', 1);
                            setSearchQuery('');
                          }}
                          role="listitem"
                        >
                          {item.image ? (
                            <Box w="full" h="64px" mb={2} borderRadius="md" overflow="hidden" bg="gray.100" position="relative">
                              <NextImage
                                src={item.image}
                                alt=""
                                width={80}
                                height={64}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            </Box>
                          ) : (
                            <Box w="full" h="64px" mb={2} borderRadius="md" bg="gray.100" display="flex" alignItems="center" justifyContent="center">
                              <Icon as={FaShoppingBag} color="gray.400" boxSize={6} />
                            </Box>
                          )}
                          <Text fontSize="sm" fontWeight="600" noOfLines={2} color="text.primary">
                            {item.name}
                          </Text>
                          {quantity > 0 ? (
                            <Badge colorScheme="green" mt={1} fontSize="2xs">{quantity} added</Badge>
                          ) : (
                            <Text fontSize="xs" color="text.secondary" mt={1}>Tap to add</Text>
                          )}
                        </Box>
                      );
                    })}
                </SimpleGrid>
                {ALL_REMOVAL_ITEMS.filter(item =>
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.category.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <Text fontSize="sm" color="text.secondary" textAlign="center" py={4}>
                    No items found. Try a different search term.
                  </Text>
                )}
              </Box>
            )}
          </Box>
          </>
        )}

        {/* Quick access to Add-on Services */}
        <LuxurySurfaceCard
          mt={4}
          tone="info"
          borderWidth="1px"
          borderRadius="xl"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" gap={3} flexWrap="wrap" p={4}>
            <VStack align="flex-start" spacing={0}>
              <Text fontWeight="bold" color="text.primary">Add-on Services</Text>
              <Text fontSize="sm" color="text.secondary">Packing, protection, and assembly for premium moves.</Text>
            </VStack>
            <Button colorScheme="purple" variant="solid" onClick={scrollToAddOns}>
              Jump to Add-ons
            </Button>
          </Box>
        </LuxurySurfaceCard>

        {/* Common Items Grid - Always visible at the top (responsive card) */}
        <Box
          bg="bg.card"
          borderRadius="xl"
          borderWidth="1px"
          borderColor="border.primary"
          overflow="hidden"
        >
          <Box px={{ base: 4, md: 6 }} py={{ base: 3, md: 4 }} borderBottomWidth="1px" borderColor="border.primary">
            <Heading size="sm" color="text.primary">
              Quick add items
            </Heading>
            <Text fontSize="sm" color="text.secondary">
              Tap a category to browse. Most popular furniture and appliances.
            </Text>
          </Box>
          <Box pt={{ base: 3, md: 4 }} pb={{ base: 4, md: 5 }} px={{ base: 4, md: 6 }}>
            <VStack spacing={4} align="stretch">
              {/* Instructions */}
              <HStack 
                spacing={3} 
                bg="bg.surface" 
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
                  <Text fontSize="xs" color="text.secondary">Add</Text>
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
                  <Text fontSize="xs" color="text.secondary">Remove</Text>
                </HStack>
                <Text fontSize="xs" color="text.tertiary">|</Text>
                <Text fontSize="xs" color="text.secondary" fontWeight="medium">
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
          </Box>
        </Box>

        {/* Add-on Services - Collapsible Premium Section */}
        {!isAddOnsExpanded ? (
          // Collapsed Button View
          <Button
            onClick={() => setIsAddOnsExpanded(true)}
            w="full"
            h="auto"
            py={4}
            px={5}
            bg="bg.surface.elevated"
            border="1px solid"
            borderColor="border.primary"
            borderRadius="xl"
            _hover={{ 
              borderColor: 'purple.400',
              bg: 'bg.card',
              transform: 'translateY(-2px)',
              boxShadow: 'lg',
            }}
            transition="all 0.3s"
          >
            <HStack spacing={4} w="full" justify="space-between">
              <HStack spacing={3}>
                <Box
                  p={2.5}
                  borderRadius="lg"
                  bgGradient="linear(to-br, purple.500, indigo.600)"
                  boxShadow="0 4px 15px rgba(139, 92, 246, 0.4)"
                >
                  <Icon as={FaShieldAlt} color="white" boxSize={4} />
                </Box>
                <VStack spacing={0} align="start">
                  <Text fontWeight="700" color="text.primary" fontSize="sm">
                    Add-on Services
                  </Text>
                  <Text fontSize="xs" color="text.secondary">
                    Packing, protection & assembly options
                  </Text>
                </VStack>
              </HStack>
              <HStack spacing={2}>
                {(addOns.packing || addOns.furnitureProtection || addOns.assembly) && (
                  <Badge 
                    colorScheme="green" 
                    variant="solid" 
                    borderRadius="full" 
                    fontSize="2xs"
                    px={2}
                  >
                    {[addOns.packing, addOns.furnitureProtection, addOns.assembly].filter(Boolean).length} Active
                  </Badge>
                )}
                <Badge colorScheme="purple" variant="subtle" borderRadius="full" fontSize="2xs">
                  Optional
                </Badge>
              </HStack>
            </HStack>
          </Button>
        ) : (
          // Expanded Card View
          <Box ref={addOnsRef}>
          <LuxurySurfaceCard
            borderRadius="2xl"
            boxShadow="lg"
            borderWidth="1px"
            overflow="hidden"
            position="relative"
            tone="info"
          >
            {/* Gradient top border */}
            <Box h="4px" bgGradient="linear(to-r, purple.400, indigo.500, violet.400)" />
            
            {/* Decorative glow */}
            <Box position="absolute" top="-80px" right="-80px" w="200px" h="200px" borderRadius="full" bg="purple.900" opacity={0.35} pointerEvents="none" />
            
            <Box pb={3} pt={5} px={5}>
              <HStack justify="space-between" align="start">
                <HStack spacing={3}>
                  <Box
                    p={3}
                    borderRadius="xl"
                    bgGradient="linear(to-br, purple.500, indigo.600)"
                    boxShadow="0 8px 25px rgba(139, 92, 246, 0.4)"
                  >
                    <Icon as={FaShieldAlt} color="white" boxSize={5} />
                  </Box>
                  <VStack align="flex-start" spacing={0}>
                    <Heading 
                      size="md" 
                      bgGradient="linear(to-r, purple.200, indigo.200)"
                      bgClip="text"
                      fontWeight="800"
                    >
                      Add-on Services
                    </Heading>
                    <Text color="text.secondary" fontSize="sm">
                      Enhance your move with premium protection
                    </Text>
                  </VStack>
                </HStack>
                <Button
                  size="sm"
                  variant="ghost"
                  color="text.secondary"
                  onClick={() => setIsAddOnsExpanded(false)}
                  _hover={{ color: 'text.primary', bg: 'bg.surface.elevated' }}
                  borderRadius="full"
                  p={2}
                >
                  <Icon as={FaChevronUp} />
                </Button>
              </HStack>
            </Box>
            
            <Box pt={2} px={5} pb={5}>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                {/* Professional Packing */}
                <Box
                  p={5}
                  borderRadius="xl"
                  bg={addOns.packing 
                    ? "purple.900"
                    : "bg.surface"}
                  border="2px solid"
                  borderColor={addOns.packing ? "purple.400" : "border.primary"}
                  boxShadow={addOns.packing ? "md" : "none"}
                  transition="all 0.3s"
                  _hover={{ borderColor: 'purple.400', transform: 'translateY(-2px)' }}
                  cursor="pointer"
                  onClick={() => handleAddOnToggle('packing', !addOns.packing)}
                  position="relative"
                >
                  {addOns.packing && (
                    <Circle 
                      size="24px" 
                      bg="purple.500" 
                      position="absolute" 
                      top={3} 
                      right={3}
                      boxShadow="0 0 10px rgba(139, 92, 246, 0.5)"
                    >
                      <Icon as={FaCheck} color="white" boxSize={3} />
                    </Circle>
                  )}
                  <HStack spacing={3} align="start">
                    <Box p={2.5} borderRadius="lg" bg="purple.500/20" flexShrink={0}>
                      <Text fontSize="xl">📦</Text>
                    </Box>
                    <VStack align="start" spacing={2} flex={1}>
                      <Text fontWeight="700" color="text.primary" fontSize="md">
                        Professional Packing
                      </Text>
                      <Text fontSize="sm" color="text.secondary" lineHeight="tall">
                        White-glove packing with premium materials.
                      </Text>
                      <Badge colorScheme="purple" variant="subtle" fontSize="xs">
                        Volume: {Math.max(estimatedPackingVolume, 0).toFixed(1)} m³
                      </Badge>
                    </VStack>
                  </HStack>
                </Box>

                {/* Furniture Protection */}
                <Box
                  p={5}
                  borderRadius="xl"
                  bg={addOns.furnitureProtection 
                    ? "blue.900"
                    : "bg.surface"}
                  border="2px solid"
                  borderColor={addOns.furnitureProtection ? "blue.400" : "border.primary"}
                  boxShadow={addOns.furnitureProtection ? "md" : "none"}
                  transition="all 0.3s"
                  _hover={{ borderColor: 'blue.400', transform: 'translateY(-2px)' }}
                  cursor="pointer"
                  onClick={() => handleAddOnToggle('furnitureProtection', !addOns.furnitureProtection)}
                  position="relative"
                >
                  {addOns.furnitureProtection && (
                    <Circle 
                      size="24px" 
                      bg="blue.500" 
                      position="absolute" 
                      top={3} 
                      right={3}
                      boxShadow="0 0 10px rgba(59, 130, 246, 0.5)"
                    >
                      <Icon as={FaCheck} color="white" boxSize={3} />
                    </Circle>
                  )}
                  <HStack spacing={3} align="start">
                    <Box p={2.5} borderRadius="lg" bg="blue.500/20" flexShrink={0}>
                      <Text fontSize="xl">🛡️</Text>
                    </Box>
                    <VStack align="start" spacing={2} flex={1}>
                      <Text fontWeight="700" color="text.primary" fontSize="md">
                        Furniture Protection
                      </Text>
                      <Text fontSize="sm" color="text.secondary" lineHeight="tall">
                        Enhanced insurance and premium padding.
                      </Text>
                      <Badge colorScheme="blue" variant="subtle" fontSize="xs">
                        Premium coverage
                      </Badge>
                    </VStack>
                  </HStack>
                </Box>

                {/* Assembly / Disassembly */}
                <Box
                  p={5}
                  borderRadius="xl"
                  bg={addOns.assembly 
                    ? "teal.900"
                    : "bg.surface"}
                  border="2px solid"
                  borderColor={addOns.assembly ? "teal.400" : "border.primary"}
                  boxShadow={addOns.assembly ? "md" : "none"}
                  transition="all 0.3s"
                  _hover={{ borderColor: 'teal.400', transform: 'translateY(-2px)' }}
                  cursor="pointer"
                  onClick={() => handleAddOnToggle('assembly', !addOns.assembly)}
                  position="relative"
                >
                  {addOns.assembly && (
                    <Circle 
                      size="24px" 
                      bg="teal.500" 
                      position="absolute" 
                      top={3} 
                      right={3}
                      boxShadow="0 0 10px rgba(20, 184, 166, 0.5)"
                    >
                      <Icon as={FaCheck} color="white" boxSize={3} />
                    </Circle>
                  )}
                  <HStack spacing={3} align="start">
                    <Box p={2.5} borderRadius="lg" bg="teal.500/20" flexShrink={0}>
                      <Text fontSize="xl">🔧</Text>
                    </Box>
                    <VStack align="start" spacing={2} flex={1}>
                      <Text fontWeight="700" color="text.primary" fontSize="md">
                        Assembly / Disassembly
                      </Text>
                      <Text fontSize="sm" color="text.secondary" lineHeight="tall">
                        Dismantles and reassembles furniture on-site.
                      </Text>
                      <Badge colorScheme="teal" variant="subtle" fontSize="xs">
                        Auto-priced
                      </Badge>
                    </VStack>
                  </HStack>
                </Box>
              </SimpleGrid>
              
              {/* Footer info */}
              <HStack 
                mt={4} 
                p={3} 
                bg="bg.surface.elevated" 
                borderRadius="lg"
                justify="center"
                spacing={2}
              >
                <Icon as={FaCheck} color="green.400" boxSize={3} />
                <Text fontSize="xs" color="text.secondary">
                  Pricing updates instantly when you toggle any add-on
                </Text>
              </HStack>
            </Box>
          </LuxurySurfaceCard>
          </Box>
        )}

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
    </ResponsiveSection>
  );
}
