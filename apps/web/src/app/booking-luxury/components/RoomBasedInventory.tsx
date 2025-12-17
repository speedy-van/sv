/**
 * Room-Based Inventory System
 * 
 * Organizes items by room categories with pre-populated lists
 * based on property type and size
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import NextImage from 'next/image';
import {
  Box,
  VStack,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Card,
  CardBody,
  Heading,
  Text,
  IconButton,
  Badge,
  Button,
  Input,
  Icon,
  useColorModeValue,
  useDisclosure,
  Tooltip,
} from '@chakra-ui/react';
import { Collapse } from '@chakra-ui/react';
import {
  FaBed,
  FaCouch,
  FaUtensils,
  FaBath,
  FaTree,
  FaBox,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaBuilding,
  FaArrowLeft,
} from 'react-icons/fa';
import { MdKitchen } from 'react-icons/md';
import type { IconType } from 'react-icons';

import { PropertyType } from './PropertyTypeSelector';
import type { RemovalItem } from '@/lib/uk-removal-items-data';
import { searchCatalogItems } from '@/lib/catalog-items';

export interface RoomCategory {
  id: string;
  name: string;
  nameAr: string;
  icon: IconType;
  color: string;
  forPropertyTypes: PropertyType[];
}

export const ROOM_CATEGORIES: RoomCategory[] = [
  {
    id: 'bedroom',
    name: 'Bedrooms',
    nameAr: 'Bedrooms',
    icon: FaBed,
    color: 'blue',
    forPropertyTypes: ['house', 'flat', 'office', 'storage'],
  },
  {
    id: 'living',
    name: 'Living Room',
    nameAr: 'Living Room',
    icon: FaCouch,
    color: 'purple',
    forPropertyTypes: ['house', 'flat', 'office', 'storage'],
  },
  {
    id: 'dining',
    name: 'Dining Room',
    nameAr: 'Dining Room',
    icon: FaUtensils,
    color: 'orange',
    forPropertyTypes: ['house', 'flat', 'office', 'storage'],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    nameAr: 'Kitchen',
    icon: MdKitchen,
    color: 'red',
    forPropertyTypes: ['house', 'flat', 'office', 'storage'],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    nameAr: 'Bathroom',
    icon: FaBath,
    color: 'cyan',
    forPropertyTypes: ['house', 'flat', 'office', 'storage'],
  },
  {
    id: 'garden',
    name: 'Garden / Outdoor',
    nameAr: 'Garden / Outdoor',
    icon: FaTree,
    color: 'green',
    forPropertyTypes: ['house', 'flat', 'office', 'storage'],
  },
  {
    id: 'office',
    name: 'Office Equipment',
    nameAr: 'Office Equipment',
    icon: FaBuilding,
    color: 'blue',
    forPropertyTypes: ['house', 'flat', 'office', 'storage'],
  },
  {
    id: 'boxes',
    name: 'Boxes & Packaging',
    nameAr: 'Boxes & Packaging',
    icon: FaBox,
    color: 'gray',
    forPropertyTypes: ['house', 'flat', 'office', 'storage', 'single-items'],
  },
];

const ROOM_CATEGORY_LOOKUP: Record<string, RoomCategory> = ROOM_CATEGORIES.reduce(
  (acc, room) => {
    acc[room.id] = room;
    return acc;
  },
  {} as Record<string, RoomCategory>
);

interface SelectedItem {
  id: string;
  name: string;
  category: string;
  weight: number;
  quantity: number;
  room: string;
}

interface RoomBasedInventoryProps {
  propertyType: PropertyType;
  availableItems: RemovalItem[];
  selectedItems: SelectedItem[];
  onAddItem: (item: RemovalItem, room: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onBack?: () => void;
}

export default function RoomBasedInventory({
  propertyType,
  availableItems,
  selectedItems,
  onAddItem,
  onRemoveItem,
  onUpdateQuantity,
  onBack,
}: RoomBasedInventoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<string>('bedroom');
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());
  const { isOpen: isCustomItemOpen, onToggle: toggleCustomItem } = useDisclosure();

  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('white', 'gray.800');

  // Filter rooms based on property type
  const relevantRooms = useMemo(() => {
    return ROOM_CATEGORIES.filter(room => 
      room.forPropertyTypes.includes(propertyType)
    );
  }, [propertyType]);

  // Item type hierarchy - defines the order of item types within each room
  const ITEM_TYPE_HIERARCHY: Record<string, number> = {
    // Bedroom items (1-20)
    'bed': 1,
    'mattress': 2,
    'bedframe': 3,
    'bed frame': 3,
    'headboard': 4,
    'nightstand': 5,
    'bedside table': 5,
    'bedside': 5,
    'dresser': 6,
    'chest of drawers': 7,
    'chest': 7,
    'wardrobe': 8,
    'closet': 8,
    'armoire': 8,
    'dressing table': 9,
    'mirror': 10,
    'lamp': 11,
    'curtain': 12,
    'blind': 12,
    
    // Living Room items (21-50)
    'sofa': 21,
    'couch': 21,
    'sectional': 22,
    'loveseat': 23,
    'chair': 24,
    'armchair': 25,
    'recliner': 26,
    'coffee table': 27,
    'side table': 28,
    'end table': 28,
    'console table': 29,
    'tv stand': 30,
    'tv': 30,
    'television': 30,
    'entertainment center': 31,
    'entertainment': 31,
    'media unit': 31,
    'bookcase': 32,
    'bookshelf': 32,
    'shelving unit': 33,
    'shelving': 33,
    'cabinet': 34,
    'display cabinet': 35,
    'ottoman': 36,
    'footstool': 37,
    'rug': 38,
    'carpet': 38,
    'floor lamp': 39,
    'table lamp': 40,
    'wall art': 41,
    'picture': 41,
    
    // Dining Room items (51-70)
    'dining table': 51,
    'dining chair': 52,
    'bench': 54,
    'sideboard': 55,
    'buffet': 55,
    'china cabinet': 56,
    'hutch': 57,
    'serving cart': 58,
    'bar cart': 59,
    
    // Kitchen items (71-100)
    'refrigerator': 71,
    'fridge': 71,
    'freezer': 72,
    'oven': 73,
    'stove': 74,
    'range': 74,
    'cooker': 74,
    'microwave': 75,
    'dishwasher': 76,
    'washing machine': 77,
    'washer': 77,
    'dryer': 78,
    'tumble dryer': 78,
    'kitchen table': 79,
    'kitchen island': 80,
    'kitchen cart': 81,
    'pantry': 82,
    'kitchen cabinet': 83,
    'stand mixer': 84,
    'mixer': 84,
    'food processor': 85,
    'blender': 86,
    'toaster': 87,
    'kettle': 88,
    'coffee maker': 89,
    
    // Bathroom items (101-120)
    'bathtub': 101,
    'bath': 101,
    'shower': 102,
    'shower enclosure': 102,
    'toilet': 103,
    'sink': 104,
    'basin': 104,
    'vanity': 105,
    'bathroom cabinet': 106,
    'medicine cabinet': 107,
    'towel rack': 108,
    'towel rail': 108,
    
    // Office items (121-140)
    'desk': 121,
    'office desk': 121,
    'workstation': 121,
    'office chair': 122,
    'filing cabinet': 124,
    'file cabinet': 124,
    'drawer unit': 125,
    'computer': 128,
    'monitor': 129,
    'printer': 130,
    'scanner': 131,
    'shredder': 132,
    
    // Garden/Outdoor items (141-160)
    'patio set': 141,
    'patio': 141,
    'garden furniture': 142,
    'garden': 142,
    'outdoor table': 143,
    'outdoor chair': 144,
    'bbq': 145,
    'grill': 145,
    'barbecue': 145,
    'outdoor furniture': 146,
    'sun lounger': 147,
    'parasol': 148,
    'umbrella': 148,
    'bike': 149,
    'bicycle': 149,
    'lawnmower': 150,
    'lawn mower': 150,
    'shed': 151,
    'plant pot': 152,
    'planter': 152,
    
    // Boxes & Packaging (161-180)
    'box': 161,
    'small box': 161,
    'medium box': 162,
    'large box': 163,
    'wardrobe box': 164,
    'container': 165,
    'storage box': 166,
    'crate': 167,
    'packing': 168,
  };

  // Get item type order based on name
  const getItemType = (itemName: string): number => {
    const nameLower = itemName.toLowerCase();
    
    // Sort type keys by length (longest first) for better matching
    const sortedTypeKeys = Object.keys(ITEM_TYPE_HIERARCHY).sort((a, b) => b.length - a.length);
    
    for (const typeKey of sortedTypeKeys) {
      if (nameLower.includes(typeKey)) {
        return ITEM_TYPE_HIERARCHY[typeKey];
      }
    }
    
    // Default order for unknown types
    return 9999;
  };

  // Map items to rooms based on their category
  const getItemsForRoom = useCallback((roomId: string): RemovalItem[] => {
    const categoryMap: Record<string, string[]> = {
      'bedroom': ['Bedroom', 'Wardrobes'],
      'living': ['Living Room'],
      'dining': ['Dining Room'],
      'kitchen': ['Kitchen'],
      'bathroom': ['Bathroom'],
      'garden': ['Garden & Outdoor'],
      'office': ['Office', 'Electronics'],
      'boxes': ['Boxes & Packaging', 'Miscellaneous'],
    };

    const categories = categoryMap[roomId] || [];
    const filteredItems = availableItems.filter(item => 
      categories.some(cat => item.category.toLowerCase().includes(cat.toLowerCase()))
    );

    // Sort items by type first, then by size within each type
    const sortedItems = filteredItems.sort((a, b) => {
      // First: Sort by item type
      const typeA = getItemType(a.name);
      const typeB = getItemType(b.name);
      
      if (typeA !== typeB) {
        return typeA - typeB;
      }
      
      // Second: Sort by size within the same type
      const sizeA = getSizeOrder(a.name);
      const sizeB = getSizeOrder(b.name);
      
      if (sizeA !== 999 && sizeB !== 999) {
        return sizeA - sizeB;
      }
      
      // If only one has a size order, prioritize it
      if (sizeA !== 999) return -1;
      if (sizeB !== 999) return 1;
      
      // Third: Sort alphabetically as final fallback
      return a.name.localeCompare(b.name);
    });

    console.log(`🔄 Sorted ${roomId} items:`, sortedItems.map((item, idx) => ({
      position: idx + 1,
      name: item.name,
      type: getItemType(item.name),
      size: getSizeOrder(item.name)
    })));

    return sortedItems;
  }, [availableItems]);

  // Size hierarchy - determines ordering from smallest to largest
  const SIZE_HIERARCHY: Record<string, number> = {
    // Beds & Mattresses (smallest to largest)
    'cot': 0,
    'toddler bed': 0.5,
    'single bed': 1,
    'single': 1,
    'small single': 1.5,
    'twin bed': 2,
    'twin': 2,
    'double bed': 3,
    'double': 3,
    'queen bed': 3.5,
    'queen': 3.5,
    'king bed': 4,
    'king size bed': 4,
    'king size': 4,
    'king': 4,
    'super king bed': 5,
    'super king size bed': 5,
    'super king size': 5,
    'super king': 5,
    'california king': 5.5,
    'bunk bed': 6,
    'bunk': 6,
    
    // Sofas & Seating
    '1 seat': 1,
    '2 seat': 2,
    '3 seat': 3,
    '4 seat': 4,
    'corner': 5,
    'corner sofa': 5,
    'l-shaped': 5,
    
    // Fridges & Appliances
    'small': 1,
    'compact': 1,
    'medium': 2,
    'standard': 2,
    'large': 3,
    'american': 4,
    'american style': 4,
    'american size': 4,
    
    // Tables
    '2 seater': 1,
    '4 seater': 2,
    '6 seater': 3,
    '8 seater': 4,
    
    // Boxes
    'box - small': 1,
    'box small': 1,
    'box - medium': 2,
    'box medium': 2,
    'box - large': 3,
    'box large': 3,
  };

  // Common items - prioritize these in search results
  const COMMON_ITEMS = [
    'sofa', 'couch', 'chair', 'table', 'bed', 'mattress', 'tv', 'desk',
    'wardrobe', 'drawer', 'box', 'fridge', 'washing machine', 'bookcase',
    'dining table', 'mirror', 'lamp', 'shelving unit', 'coffee table'
  ];

  // Get size order for an item
  const getSizeOrder = (itemName: string): number => {
    const nameLower = itemName.toLowerCase();
    
    // Sort size keys by length (longest first) to match "super king size" before "king"
    const sortedSizeKeys = Object.keys(SIZE_HIERARCHY).sort((a, b) => b.length - a.length);
    
    // Check for exact matches or partial matches in SIZE_HIERARCHY
    for (const sizeKey of sortedSizeKeys) {
      if (nameLower.includes(sizeKey)) {
        return SIZE_HIERARCHY[sizeKey];
      }
    }
    
    // Default order for items without explicit size
    return 999;
  };

  // Filter items by search query - Smart search with synonyms and relevance scoring
  const filterItemsBySearch = useCallback((items: RemovalItem[]): RemovalItem[] => {
    if (!searchQuery.trim()) {
      return items;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    // Expand query with synonyms for better matching
    const synonyms: Record<string, string[]> = {
      'sofa': ['couch', 'settee', 'divan', 'lounger'],
      'couch': ['sofa', 'settee'],
      'tv': ['television', 'telly', 'screen'],
      'fridge': ['refrigerator', 'freezer', 'cooler'],
      'desk': ['table', 'workstation', 'bureau'],
      'chair': ['seat', 'stool'],
      'bed': ['mattress', 'cot', 'bunk'],
      'wardrobe': ['closet', 'armoire', 'cupboard'],
      'drawer': ['chest', 'dresser', 'cabinet'],
      'lamp': ['light', 'lighting', 'fixture'],
      'box': ['container', 'crate', 'storage'],
      'table': ['desk', 'surface'],
      'mirror': ['glass'],
      'curtain': ['drape', 'blind'],
      'rug': ['carpet', 'mat'],
      'shelf': ['shelving', 'bookcase', 'rack'],
      'bike': ['bicycle', 'cycle'],
      'computer': ['pc', 'laptop', 'desktop'],
    };
    
    // Get all search terms (original + synonyms)
    const searchTerms = new Set<string>([query]);
    const queryWords = query.split(/\s+/);
    
    queryWords.forEach(word => {
      searchTerms.add(word);
      // Add synonyms
      Object.entries(synonyms).forEach(([key, syns]) => {
        if (key === word || syns.includes(word)) {
          searchTerms.add(key);
          syns.forEach(syn => searchTerms.add(syn));
        }
      });
    });
    
    // Score each item
    const scoredItems = items.map(item => {
      let score = 0;
      const itemName = item.name.toLowerCase();
      const itemCategory = item.category.toLowerCase();
      const itemId = item.id.toLowerCase();
      const itemType = getItemType(item.name);
      
      // Check if this is a common item - boost score significantly
      const isCommonItem = COMMON_ITEMS.some(common => 
        itemName.includes(common) || itemId.includes(common.replace(/\s+/g, '-'))
      );
      if (isCommonItem) score += 2000;
      
      // Check each search term
      Array.from(searchTerms).forEach(term => {
        // Exact match in name (highest priority)
        if (itemName === term) score += 1000;
        
        // Contains full query
        if (itemName.includes(query)) score += 500;
        if (itemCategory.includes(query)) score += 300;
        
        // Word match
        const nameWords = itemName.split(/\s+/);
        if (nameWords.includes(term)) score += 100;
        if (itemName.includes(term)) score += 50;
        if (itemCategory.includes(term)) score += 30;
        if (itemId.includes(term)) score += 20;
        
        // Starts with
        if (itemName.startsWith(term)) score += 60;
        if (nameWords.some(w => w.startsWith(term))) score += 40;
      });
      
      return { item, score, itemType: getItemType(item.name), sizeOrder: getSizeOrder(item.name) };
    });
    
    // Filter items with score > 0, then sort by score DESC, type, and size order ASC
    return scoredItems
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        // First sort by relevance score (higher is better)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Then sort by item type
        if (a.itemType !== b.itemType) {
          return a.itemType - b.itemType;
        }
        // Then sort by size order (smaller first)
        return a.sizeOrder - b.sizeOrder;
      })
      .map(({ item }) => item);
  }, [searchQuery]);

  // Get quantity for an item
  const getItemQuantity = (itemId: string): number => {
    const selected = selectedItems.find(i => i.id === itemId);
    return selected?.quantity || 0;
  };

  // Calculate total items per room
  const getRoomItemCount = (roomId: string): number => {
    return selectedItems.filter(item => item.room === roomId).length;
  };

  // Get readable type name for grouping
  const getTypeName = (item: RemovalItem): string => {
    const nameLower = item.name.toLowerCase();
    
    // Bedroom types
    if (nameLower.includes('bed') && !nameLower.includes('bedside')) return 'Beds & Mattresses';
    if (nameLower.includes('mattress')) return 'Beds & Mattresses';
    if (nameLower.includes('wardrobe') || nameLower.includes('closet') || nameLower.includes('armoire')) return 'Wardrobes & Storage';
    if (nameLower.includes('dresser') || nameLower.includes('chest')) return 'Dressers & Drawers';
    if (nameLower.includes('nightstand') || nameLower.includes('bedside')) return 'Bedside Tables';
    
    // Living Room types
    if (nameLower.includes('sofa') || nameLower.includes('couch') || nameLower.includes('sectional') || nameLower.includes('loveseat')) return 'Sofas & Couches';
    if (nameLower.includes('chair') && !nameLower.includes('dining')) return 'Chairs & Seating';
    if (nameLower.includes('table') && !nameLower.includes('dining')) return 'Tables';
    if (nameLower.includes('tv') || nameLower.includes('television') || nameLower.includes('entertainment')) return 'TV & Entertainment';
    if (nameLower.includes('bookcase') || nameLower.includes('bookshelf') || nameLower.includes('shelving')) return 'Shelving & Storage';
    
    // Dining Room types
    if (nameLower.includes('dining table')) return 'Dining Tables';
    if (nameLower.includes('dining chair') || (nameLower.includes('chair') && item.category.toLowerCase().includes('dining'))) return 'Dining Chairs';
    if (nameLower.includes('sideboard') || nameLower.includes('buffet') || nameLower.includes('china cabinet')) return 'Storage & Display';
    
    // Kitchen types
    if (nameLower.includes('fridge') || nameLower.includes('refrigerator') || nameLower.includes('freezer')) return 'Refrigeration';
    if (nameLower.includes('oven') || nameLower.includes('stove') || nameLower.includes('range') || nameLower.includes('cooker')) return 'Cooking Appliances';
    if (nameLower.includes('washing') || nameLower.includes('washer') || nameLower.includes('dryer') || nameLower.includes('dishwasher')) return 'Laundry & Cleaning';
    if (nameLower.includes('mixer') || nameLower.includes('blender') || nameLower.includes('toaster') || nameLower.includes('kettle')) return 'Small Appliances';
    
    // Bathroom types
    if (nameLower.includes('bath') || nameLower.includes('shower')) return 'Bath & Shower';
    if (nameLower.includes('toilet') || nameLower.includes('sink') || nameLower.includes('basin')) return 'Sanitary Fixtures';
    if (nameLower.includes('vanity') || nameLower.includes('cabinet')) return 'Storage & Vanity';
    
    // Office types
    if (nameLower.includes('desk')) return 'Desks & Workstations';
    if (nameLower.includes('chair') && item.category.toLowerCase().includes('office')) return 'Office Chairs';
    if (nameLower.includes('filing') || nameLower.includes('cabinet')) return 'Filing & Storage';
    if (nameLower.includes('computer') || nameLower.includes('monitor') || nameLower.includes('printer')) return 'Electronics';
    
    // Garden types
    if (nameLower.includes('patio') || nameLower.includes('garden') || nameLower.includes('outdoor')) return 'Outdoor Furniture';
    if (nameLower.includes('bbq') || nameLower.includes('grill')) return 'BBQ & Grills';
    if (nameLower.includes('bike') || nameLower.includes('bicycle') || nameLower.includes('lawnmower')) return 'Garden Equipment';
    
    // Boxes
    if (nameLower.includes('box') || nameLower.includes('container') || nameLower.includes('crate')) return 'Boxes & Containers';
    
    // Default
    return 'Other Items';
  };

  // Group items by type
  const groupItemsByType = (items: RemovalItem[]): Map<string, RemovalItem[]> => {
    const grouped = new Map<string, RemovalItem[]>();
    
    items.forEach(item => {
      const typeName = getTypeName(item);
      if (!grouped.has(typeName)) {
        grouped.set(typeName, []);
      }
      grouped.get(typeName)!.push(item);
    });
    
    return grouped;
  };

  const currentRoomItems = useMemo(() => {
    // If there's a search query, search across ALL items, not just current room
    if (searchQuery.trim()) {
      return filterItemsBySearch(availableItems);
    }
    
    // Otherwise, show only items for the current room
    const roomItems = getItemsForRoom(selectedRoom);
    return roomItems;
  }, [selectedRoom, searchQuery, getItemsForRoom, filterItemsBySearch, availableItems]);

  const groupedCurrentRoomItems = useMemo(() => {
    return groupItemsByType(currentRoomItems);
  }, [currentRoomItems]);

  // Toggle category open/close
  const toggleCategory = (categoryKey: string) => {
    setOpenCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  // Check if category is open
  const isCategoryOpen = (categoryKey: string): boolean => {
    return openCategories.has(categoryKey);
  };

  // Expand all categories
  const expandAllCategories = () => {
    const allCategories = Array.from(groupedCurrentRoomItems.keys()).map(
      typeName => `${selectedRoom}-${typeName}`
    );
    setOpenCategories(new Set(allCategories));
  };

  // Collapse all categories
  const collapseAllCategories = () => {
    setOpenCategories(new Set());
  };

  return (
    <Box position="relative">
      <VStack spacing={6} align="stretch">
        {/* Header - Enhanced Typography */}
        <VStack spacing={3} align="stretch" mb={2}>
          <Heading 
            size={{ base: "lg", md: "xl" }}
            color="white"
            fontWeight="800"
            letterSpacing="tight"
            bgGradient="linear(to-r, purple.300, blue.400)"
            bgClip="text"
            textShadow="0 0 20px rgba(168, 85, 247, 0.2)"
            fontFamily="'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
          >
            Select Items by Room
          </Heading>
          <Text 
            fontSize={{ base: "md", md: "lg" }}
            color="whiteAlpha.800"
            fontWeight="500"
            letterSpacing="wide"
            lineHeight="1.6"
          >
            Navigate between rooms and add the items you want to move
          </Text>
        </VStack>

        {/* Back Button */}
        {onBack && (
          <Button
            leftIcon={<FaArrowLeft />}
            onClick={onBack}
            variant="ghost"
            color="white"
            size="lg"
            _hover={{ bg: 'whiteAlpha.200' }}
          >
            Back to Property Size
          </Button>
        )}

        {/* Search */}
        <Input
          size="lg"
          placeholder="Search for an item..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          bg={bgColor}
          borderColor={borderColor}
        />

        {/* Room Tabs - Enhanced Design (Hidden during search) */}
        {!searchQuery.trim() && (
        <Tabs
          variant="unstyled"
          index={relevantRooms.findIndex(r => r.id === selectedRoom)}
          onChange={(index) => setSelectedRoom(relevantRooms[index].id)}
        >
          <TabList 
            flexWrap="wrap" 
            gap={3}
            justifyContent={{ base: 'center', md: 'flex-start' }}
          >
            {relevantRooms.map((room) => {
              const itemCount = getRoomItemCount(room.id);
              const isSelected = room.id === selectedRoom;
              return (
                <Tab 
                  key={room.id} 
                  position="relative"
                  bg={isSelected ? `${room.color}.500` : 'whiteAlpha.100'}
                  color={isSelected ? 'white' : 'whiteAlpha.800'}
                  borderRadius="xl"
                  px={{ base: 4, md: 6 }}
                  py={{ base: 3, md: 4 }}
                  minH={{ base: '60px', md: '70px' }}
                  border="2px solid"
                  borderColor={isSelected ? `${room.color}.400` : 'transparent'}
                  boxShadow={isSelected ? `0 0 20px ${room.color}.400` : 'none'}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{
                    bg: isSelected ? `${room.color}.600` : 'whiteAlpha.200',
                    transform: 'translateY(-2px)',
                    boxShadow: isSelected ? `0 0 25px ${room.color}.400` : '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                >
                  <VStack spacing={1.5}>
                    <HStack spacing={2}>
                      <Icon 
                        as={room.icon} 
                        boxSize={{ base: 5, md: 6 }}
                        filter={isSelected ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'}
                      />
                      <Text 
                        fontSize={{ base: 'sm', md: 'md' }}
                        fontWeight={isSelected ? '700' : '600'}
                        letterSpacing="0.3px"
                      >
                        {room.name}
                      </Text>
                    </HStack>
                    {itemCount > 0 && (
                      <Badge 
                        colorScheme={isSelected ? 'whiteAlpha' : room.color}
                        borderRadius="full"
                        px={2.5}
                        py={0.5}
                        fontSize="xs"
                        fontWeight="bold"
                        bg={isSelected ? 'whiteAlpha.300' : `${room.color}.100`}
                        color={isSelected ? 'white' : `${room.color}.700`}
                      >
                        {itemCount}
                      </Badge>
                    )}
                  </VStack>
                </Tab>
              );
            })}
          </TabList>

          <TabPanels>
            {relevantRooms.map((room) => (
              <TabPanel key={room.id} px={0}>
                <VStack spacing={6} align="stretch">
                  {/* Items by Category */}
                  {currentRoomItems.length === 0 ? (
                    <Card variant="outline">
                      <CardBody>
                        <Text textAlign="center" color="gray.500">
                          No items available in this category
                        </Text>
                      </CardBody>
                    </Card>
                  ) : searchQuery.trim() ? (
                    // If searching, show flat list without grouping
                    <Box>
                      <SimpleGrid 
                        columns={{ base: 2, sm: 2, md: 2, lg: 3, xl: 4 }} 
                        spacing={{ base: 3, md: 4 }}
                        w="full"
                      >
                        {currentRoomItems.map((item, index) => {
                          const quantity = getItemQuantity(item.id);
                          const isSelected = quantity > 0;

                        return (
                          <Card
                            key={`${item.id}-${index}`}
                            variant="outline"
                            borderWidth="2px"
                            borderColor={isSelected ? 'green.500' : borderColor}
                            bg={isSelected ? 'green.50' : bgColor}
                            transition="all 0.15s ease-in-out"
                            minH="90px"
                            h="auto"
                            display="flex"
                            boxShadow={isSelected ? '0 0 0 1px var(--chakra-colors-green-500)' : 'none'}
                            sx={{
                              WebkitMinContent: 'min-content',
                              minHeight: '90px !important',
                              height: 'auto !important',
                            }}
                          >
                            <CardBody p={3}>
                              <VStack spacing={3} align="stretch">
                                {/* Item Image */}
                                <Box
                                  h="160px"
                                  minH="160px"
                                  bg="white"
                                  borderRadius="md"
                                  overflow="hidden"
                                  position="relative"
                                  flexShrink={0}
                                  sx={{
                                    minHeight: '160px !important',
                                    height: '160px !important',
                                  }}
                                >
                                  {item.image ? (
                                    <NextImage
                                      src={item.image}
                                      alt={item.name}
                                      fill
                                      sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                      style={{
                                        objectFit: 'contain',
                                      }}
                                    />
                                  ) : (
                                    <Box
                                      w="100%"
                                      h="100%"
                                      display="flex"
                                      alignItems="center"
                                      justifyContent="center"
                                      bg="gray.100"
                                    >
                                      <Icon as={room.icon} boxSize={8} color="gray.400" />
                                    </Box>
                                  )}
                                </Box>

                                {/* Item Name */}
                                <Text fontSize="sm" fontWeight="semibold" noOfLines={2} minH="40px">
                                  {item.name}
                                </Text>

                                {/* Weight Badge */}
                                <Badge colorScheme="gray" fontSize="xs">
                                  {item.weight}kg
                                </Badge>

                                {/* Quantity Controls */}
                                <VStack align="stretch" spacing={2}>
                                  <Tooltip
                                    label={
                                      isSelected
                                        ? 'Tap to add one more'
                                        : 'Add this item to your move'
                                    }
                                    hasArrow
                                  >
                                    <Button
                                      leftIcon={<FaPlus />}
                                      size="sm"
                                      colorScheme={isSelected ? 'green' : room.color}
                                      variant={isSelected ? 'solid' : 'outline'}
                                      onClick={() =>
                                        isSelected
                                          ? onUpdateQuantity(item.id, quantity + 1)
                                          : onAddItem(item, room.id, 1)
                                      }
                                    >
                                      {isSelected ? `Added (${quantity})` : 'Add'}
                                    </Button>
                                  </Tooltip>
                                  {isSelected && (
                                    <Button
                                      size="xs"
                                      variant="ghost"
                                      colorScheme="red"
                                      onClick={() => onRemoveItem(item.id)}
                                    >
                                      Remove
                                    </Button>
                                  )}
                                </VStack>
                              </VStack>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </SimpleGrid>
                    </Box>
                  ) : (
                    // If not searching, show grouped by type
                    <>
                      {/* Expand/Collapse All Buttons */}
                      <HStack spacing={2} justify="flex-end" mb={4}>
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme={room.color}
                          onClick={expandAllCategories}
                          leftIcon={<FaChevronDown />}
                        >
                          Expand All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme={room.color}
                          onClick={collapseAllCategories}
                          leftIcon={<FaChevronUp />}
                        >
                          Collapse All
                        </Button>
                      </HStack>

                      {Array.from(groupedCurrentRoomItems.entries()).map(([typeName, items], groupIndex) => {
                        const categoryKey = `${room.id}-${typeName}`;
                        const isOpen = isCategoryOpen(categoryKey);
                        
                        return (
                        <Box key={`${room.id}-${typeName}-${groupIndex}`}>
                          {/* Type Header - Clickable */}
                          <HStack 
                            spacing={3} 
                            mb={isOpen ? 0 : 3}
                            pb={2}
                            borderBottom="2px solid"
                            borderColor={isOpen ? `${room.color}.400` : `${room.color}.200`}
                            cursor="pointer"
                            onClick={() => toggleCategory(categoryKey)}
                            transition="all 0.3s"
                            bg={isOpen ? `${room.color}.50` : 'transparent'}
                            _dark={{
                              bg: isOpen ? `${room.color}.900` : 'transparent'
                            }}
                            _hover={{
                              bg: `${room.color}.50`,
                              _dark: { bg: `${room.color}.900` },
                              borderColor: `${room.color}.400`
                            }}
                            p={3}
                            borderRadius="md"
                            boxShadow={isOpen ? 'sm' : 'none'}
                          >
                            <Icon 
                              as={isOpen ? FaChevronUp : FaChevronDown}
                              boxSize={4}
                              color={`${room.color}.500`}
                              transition="transform 0.2s"
                            />
                            <Icon 
                              as={room.icon} 
                              boxSize={5} 
                              color={`${room.color}.500`}
                            />
                            <Text 
                              fontSize="lg" 
                              fontWeight="bold" 
                              color={`${room.color}.600`}
                              _dark={{ color: `${room.color}.300` }}
                              flex={1}
                            >
                              {typeName}
                            </Text>
                            <Badge 
                              colorScheme={room.color} 
                              borderRadius="full"
                              px={2}
                              fontSize="xs"
                            >
                              {items.length}
                            </Badge>
                          </HStack>

                          {/* Items Grid for this type - Collapsible */}
                          <Collapse in={isOpen} animateOpacity>
                            <SimpleGrid 
                              columns={{ base: 2, sm: 2, md: 2, lg: 3, xl: 4 }} 
                              spacing={{ base: 3, md: 4 }}
                              w="full"
                              mt={3}
                            >
                              {items.map((item, index) => {
                              const quantity = getItemQuantity(item.id);
                              const isSelected = quantity > 0;

                              return (
                                <Card
                                  key={`${item.id}-${index}`}
                                  variant="outline"
                                  borderWidth="2px"
                                  borderColor={isSelected ? 'green.500' : borderColor}
                                  bg={isSelected ? 'green.50' : bgColor}
                                  transition="all 0.15s ease-in-out"
                                  minH="90px"
                                  h="auto"
                                  display="flex"
                                  boxShadow={isSelected ? '0 0 0 1px var(--chakra-colors-green-500)' : 'none'}
                                  sx={{
                                    WebkitMinContent: 'min-content',
                                    minHeight: '90px !important',
                                    height: 'auto !important',
                                  }}
                                >
                                  <CardBody p={3}>
                                    <VStack spacing={3} align="stretch">
                                      {/* Item Image */}
                                      <Box
                                        h="160px"
                                        minH="160px"
                                        bg="white"
                                        borderRadius="md"
                                        overflow="hidden"
                                        position="relative"
                                        flexShrink={0}
                                        sx={{
                                          minHeight: '160px !important',
                                          height: '160px !important',
                                        }}
                                      >
                                        {item.image ? (
                                          <NextImage
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            style={{
                                              objectFit: 'contain',
                                            }}
                                          />
                                        ) : (
                                          <Box
                                            w="100%"
                                            h="100%"
                                            display="flex"
                                            alignItems="center"
                                            justifyContent="center"
                                            bg="gray.100"
                                          >
                                            <Icon as={room.icon} boxSize={8} color="gray.400" />
                                          </Box>
                                        )}
                                      </Box>

                                      {/* Item Name */}
                                      <Text fontSize="sm" fontWeight="semibold" noOfLines={2} minH="40px">
                                        {item.name}
                                      </Text>

                                      {/* Weight Badge */}
                                      <Badge colorScheme="gray" fontSize="xs">
                                        {item.weight}kg
                                      </Badge>

                                      {/* Quantity Controls */}
                                      <VStack align="stretch" spacing={2}>
                                        <Tooltip
                                          label={
                                            isSelected
                                              ? 'Tap to add one more'
                                              : 'Add this item to your move'
                                          }
                                          hasArrow
                                        >
                                          <Button
                                            leftIcon={<FaPlus />}
                                            size="sm"
                                            colorScheme={isSelected ? 'green' : room.color}
                                            variant={isSelected ? 'solid' : 'outline'}
                                            onClick={() =>
                                              isSelected
                                                ? onUpdateQuantity(item.id, quantity + 1)
                                                : onAddItem(item, room.id, 1)
                                            }
                                          >
                                            {isSelected ? `Added (${quantity})` : 'Add'}
                                          </Button>
                                        </Tooltip>
                                        {isSelected && (
                                          <Button
                                            size="xs"
                                            variant="ghost"
                                            colorScheme="red"
                                            onClick={() => onRemoveItem(item.id)}
                                          >
                                            Remove
                                          </Button>
                                        )}
                                      </VStack>
                                    </VStack>
                                  </CardBody>
                                </Card>
                              );
                              })}
                            </SimpleGrid>
                          </Collapse>
                        </Box>
                        );
                      })}
                    </>
                  )}

                  {/* Add Custom Item Section */}
                  <Box>
                    <Button
                      leftIcon={isCustomItemOpen ? <FaChevronUp /> : <FaChevronDown />}
                      variant="ghost"
                      size="sm"
                      onClick={toggleCustomItem}
                    >
                      Add Custom Item
                    </Button>
                    <Collapse in={isCustomItemOpen}>
                      <Card variant="outline" mt={2}>
                        <CardBody>
                          <Text fontSize="sm" color="gray.600">
                            To add items not in the list, please use the search field or contact us
                          </Text>
                        </CardBody>
                      </Card>
                    </Collapse>
                  </Box>
                </VStack>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
        )}

        {/* Search Results - Show when searching */}
        {searchQuery.trim() && (
          <VStack spacing={4} align="stretch" mt={6}>
            <Text fontSize="sm" color="whiteAlpha.700">
              Found {currentRoomItems.length} item(s) for "{searchQuery}"
            </Text>
            {currentRoomItems.length === 0 ? (
              <Card variant="outline">
                <CardBody>
                  <Text textAlign="center" color="gray.500">
                    No items found matching your search
                  </Text>
                </CardBody>
              </Card>
            ) : (
              <SimpleGrid 
                columns={{ base: 2, sm: 2, md: 2, lg: 3, xl: 4 }} 
                spacing={{ base: 3, md: 4 }} 
                w="full"
              >
                {currentRoomItems.map((item, index) => {
                  const quantity = getItemQuantity(item.id);
                  const isSelected = quantity > 0;
                  const isTopResult = index < 3;

                  return (
                    <Box 
                      key={`search-${item.id}-${index}`}
                      p={3}
                      borderRadius="lg"
                      bg="rgba(255, 255, 255, 0.05)"
                      borderWidth="1px"
                      borderColor="rgba(255, 255, 255, 0.1)"
                      transition="all 0.2s"
                      _hover={{ 
                        bg: 'rgba(255, 255, 255, 0.08)',
                        borderColor: 'rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      <VStack spacing={3} align="stretch">
                        <Box>
                          <HStack spacing={1} w="full" mb={1}>
                            <Text
                              fontSize="xs"
                              fontWeight="600"
                              color="white"
                              noOfLines={2}
                              lineHeight="1.3"
                              flex={1}
                            >
                              {item.name}
                            </Text>
                            {isTopResult && (
                              <Text fontSize="xs">⭐</Text>
                            )}
                          </HStack>
                          {item.category && (
                            <Text fontSize="2xs" color="whiteAlpha.600">
                              {item.category}
                            </Text>
                          )}
                        </Box>

                        <HStack spacing={3} justify="center" w="full">
                          <button
                            onClick={() => {
                              if (isSelected) {
                                onUpdateQuantity(item.id, Math.max(0, quantity - 1));
                              }
                            }}
                            disabled={!isSelected}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'white',
                              fontSize: '28px',
                              fontWeight: 'normal',
                              cursor: isSelected ? 'pointer' : 'not-allowed',
                              padding: '0',
                              margin: '0',
                              width: 'auto',
                              height: 'auto',
                              minWidth: '24px',
                              lineHeight: '1',
                              outline: 'none',
                              WebkitTapHighlightColor: 'transparent',
                              opacity: isSelected ? 1 : 0.3
                            }}
                          >
                            −
                          </button>
                          <span
                            style={{
                              color: 'white',
                              fontSize: '18px',
                              fontWeight: '600',
                              minWidth: '24px',
                              textAlign: 'center',
                              lineHeight: '1'
                            }}
                          >
                            {quantity}
                          </span>
                          <button
                            onClick={() => {
                              if (isSelected) {
                                onUpdateQuantity(item.id, quantity + 1);
                              } else {
                                onAddItem(item, 'unknown', 1);
                              }
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'white',
                              fontSize: '24px',
                              fontWeight: 'normal',
                              cursor: 'pointer',
                              padding: '0',
                              margin: '0',
                              width: 'auto',
                              height: 'auto',
                              minWidth: '24px',
                              lineHeight: '1',
                              outline: 'none',
                              WebkitTapHighlightColor: 'transparent',
                              opacity: 1
                            }}
                          >
                            +
                          </button>
                        </HStack>

                        {isSelected && (
                          <Text
                            fontSize="2xs"
                            color="red.300"
                            textAlign="center"
                            cursor="pointer"
                            onClick={() => onRemoveItem(item.id)}
                            _hover={{ color: 'red.400' }}
                          >
                            Remove
                          </Text>
                        )}
                      </VStack>
                    </Box>
                  );
                })}
              </SimpleGrid>
            )}
          </VStack>
        )}

      </VStack>
    </Box>
  );
}
