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
  InputGroup,
  InputLeftElement,
  Icon,
  useColorModeValue,
  Collapse,
  useDisclosure,
  Tag,
  TagLabel,
  TagLeftIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tooltip,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Select,
} from '@chakra-ui/react';
import {
  FaBed,
  FaCouch,
  FaUtensils,
  FaBath,
  FaTree,
  FaBox,
  FaPlus,
  FaMinus,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaBuilding,
  FaArrowLeft,
  FaTrash,
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
  const { isOpen: isCustomItemOpen, onToggle: toggleCustomItem } = useDisclosure();
  const { isOpen: isSummaryExpanded, onToggle: toggleSummary } = useDisclosure({ defaultIsOpen: false });

  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('white', 'gray.800');
  const summaryPanelBg = '#050505';
  const summaryItemBg = '#0f0f12';
  const summaryItemBorder = 'rgba(168, 85, 247, 0.4)';
  const summaryCardBorder = useColorModeValue('purple.100', 'purple.500');

  // Filter rooms based on property type
  const relevantRooms = useMemo(() => {
    return ROOM_CATEGORIES.filter(room => 
      room.forPropertyTypes.includes(propertyType)
    );
  }, [propertyType]);

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
    return availableItems.filter(item => 
      categories.some(cat => item.category.toLowerCase().includes(cat.toLowerCase()))
    );
  }, [availableItems]);

  // Size hierarchy - determines ordering from smallest to largest
  const SIZE_HIERARCHY: Record<string, number> = {
    // Beds & Mattresses
    'single': 1,
    'small single': 2,
    'double': 3,
    'king': 4,
    'king size': 4,
    'super king': 5,
    'super king size': 5,
    
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
    
    // Check for exact matches or partial matches in SIZE_HIERARCHY
    for (const [sizeKey, order] of Object.entries(SIZE_HIERARCHY)) {
      if (nameLower.includes(sizeKey)) {
        return order;
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
      
      return { item, score, sizeOrder: getSizeOrder(item.name) };
    });
    
    // Filter items with score > 0, then sort by score DESC and size order ASC
    return scoredItems
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        // First sort by relevance score (higher is better)
        if (b.score !== a.score) {
          return b.score - a.score;
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

  const currentRoomItems = useMemo(() => {
    // If there's a search query, search across ALL items, not just current room
    if (searchQuery.trim()) {
      return filterItemsBySearch(availableItems);
    }
    
    // Otherwise, show only items for the current room
    const roomItems = getItemsForRoom(selectedRoom);
    return roomItems;
  }, [selectedRoom, searchQuery, getItemsForRoom, filterItemsBySearch, availableItems]);

  const selectionStats = useMemo(() => {
    if (!selectedItems.length) {
      return { totalItems: 0, totalWeight: 0, roomBreakdown: [] as Array<{ roomId: string; quantity: number }> };
    }

    const roomMap = new Map<string, number>();
    let totalItems = 0;
    let totalWeight = 0;

    selectedItems.forEach((item) => {
      totalItems += item.quantity;
      totalWeight += item.quantity * item.weight;
      roomMap.set(item.room, (roomMap.get(item.room) || 0) + item.quantity);
    });

    const roomBreakdown = Array.from(roomMap.entries())
      .map(([roomId, quantity]) => ({ roomId, quantity }))
      .sort((a, b) => b.quantity - a.quantity);

    return { totalItems, totalWeight, roomBreakdown };
  }, [selectedItems]);

  const getRoomLabel = useCallback((roomId: string) => {
    const room = ROOM_CATEGORY_LOOKUP[roomId];
    if (!room) return roomId;
    return room.name;
  }, []);

  return (
    <Box position="relative">
      <VStack spacing={6} align="stretch">
        {/* Floating Green Button for Selected Items */}
        {selectedItems.length > 0 && (
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
                  {selectionStats.totalItems}
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
                  bg={summaryPanelBg} 
                  color="white" 
                  p={{ base: 4, md: 6 }}
                  maxH="70vh"
                  overflowY="auto"
                  boxShadow="0 -4px 20px rgba(0, 0, 0, 0.5)"
                >
                <SimpleGrid columns={{ base: 2, md: 2, lg: 3 }} spacing={{ base: 3, md: 4 }} w="full">
                  {selectedItems.map((item, index) => {
                    const fullItem = availableItems.find(i => i.id === item.id);
                    const roomLabel = getRoomLabel(item.room);
                    const RoomIcon = ROOM_CATEGORY_LOOKUP[item.room]?.icon ?? FaBox;
                    return (
                      <Box
                        key={`summary-${item.id}-${index}`}
                        bg="rgba(15, 23, 42, 0.8)"
                        borderRadius="xl"
                        overflow="hidden"
                        borderWidth="1px"
                        borderColor="rgba(168, 85, 247, 0.2)"
                        transition="all 0.3s"
                        _hover={{ 
                          borderColor: 'rgba(168, 85, 247, 0.5)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 20px rgba(168, 85, 247, 0.2)'
                        }}
                      >
                        <VStack spacing={0} align="stretch" h="100%">
                          {/* Image Section - Fixed Aspect Ratio */}
                          <Box
                            w="100%"
                            position="relative"
                            paddingBottom="75%"
                            bg="rgba(0, 0, 0, 0.3)"
                            overflow="hidden"
                          >
                            {fullItem?.image ? (
                              <NextImage
                                src={fullItem.image}
                                alt={item.name}
                                fill
                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                style={{
                                  objectFit: 'cover',
                                  objectPosition: 'center',
                                }}
                              />
                            ) : (
                              <Box
                                position="absolute"
                                top="0"
                                left="0"
                                right="0"
                                bottom="0"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                bg="rgba(0, 0, 0, 0.3)"
                              >
                                <Icon as={FaBox} boxSize={8} color="whiteAlpha.400" />
                              </Box>
                            )}
                            
                            {/* Quantity Badge */}
                            <Badge
                              position="absolute"
                              top={2}
                              right={2}
                              colorScheme="purple"
                              fontSize="xs"
                              borderRadius="full"
                              px={2}
                              py={1}
                            >
                              {item.quantity}x
                            </Badge>
                          </Box>

                          {/* Content Section */}
                          <VStack spacing={2} align="stretch" p={3} flex="1">
                            {/* Room Label */}
                            <HStack spacing={1.5}>
                              <Icon as={RoomIcon} color="purple.300" boxSize={3} />
                              <Text fontSize="2xs" fontWeight="600" color="purple.200" textTransform="uppercase" letterSpacing="wide">
                                {roomLabel}
                              </Text>
                            </HStack>

                            {/* Item Name */}
                            <Text fontSize="sm" fontWeight="700" color="white" noOfLines={2} lineHeight="1.3" minH="2.6em">
                              {item.name}
                            </Text>

                            {/* Weight Info */}
                            <Text fontSize="2xs" color="whiteAlpha.600">
                              {item.weight}kg each · {item.quantity * item.weight}kg total
                            </Text>

                            {/* Quantity Controls */}
                            <HStack spacing={2} justify="center" w="full" py={2}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (item.quantity > 1) {
                                    onUpdateQuantity(item.id, item.quantity - 1);
                                  } else {
                                    onRemoveItem(item.id);
                                  }
                                }}
                                style={{
                                  background: 'rgba(168, 85, 247, 0.2)',
                                  border: '1px solid rgba(168, 85, 247, 0.3)',
                                  borderRadius: '8px',
                                  color: 'white',
                                  fontSize: '20px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  padding: '4px 12px',
                                  width: 'auto',
                                  height: '32px',
                                  minWidth: '32px',
                                  lineHeight: '1',
                                  outline: 'none',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)';
                                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
                                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                                }}
                              >
                                −
                              </button>
                              <Text
                                color="white"
                                fontSize="lg"
                                fontWeight="700"
                                minW="36px"
                                textAlign="center"
                              >
                                {item.quantity}
                              </Text>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateQuantity(item.id, item.quantity + 1);
                                }}
                                style={{
                                  background: 'rgba(168, 85, 247, 0.2)',
                                  border: '1px solid rgba(168, 85, 247, 0.3)',
                                  borderRadius: '8px',
                                  color: 'white',
                                  fontSize: '20px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  padding: '4px 12px',
                                  width: 'auto',
                                  height: '32px',
                                  minWidth: '32px',
                                  lineHeight: '1',
                                  outline: 'none',
                                  transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.3)';
                                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(168, 85, 247, 0.2)';
                                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                                }}
                              >
                                +
                              </button>
                            </HStack>

                            {/* Delete Icon - Positioned directly above Replace button */}
                            <Box display="flex" justifyContent="center" pt={2}>
                              <IconButton
                                aria-label="Delete item"
                                icon={<Icon as={FaTrash} boxSize={3.5} />}
                                size="sm"
                                variant="ghost"
                                color="whiteAlpha.600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveItem(item.id);
                                }}
                                _hover={{ 
                                  color: 'red.400',
                                  transform: 'scale(1.1)',
                                  bg: 'transparent'
                                }}
                                transition="all 0.2s"
                              />
                            </Box>

                            {/* Replace Button */}
                            <Button
                              size="sm"
                              variant="ghost"
                              color="purple.300"
                              fontSize="xs"
                              w="full"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveItem(item.id);
                                setSelectedRoom(item.room);
                                if (isSummaryExpanded) {
                                  toggleSummary();
                                }
                                setTimeout(() => {
                                  const tabsElement = document.querySelector('[role="tablist"]');
                                  if (tabsElement) {
                                    tabsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }
                                }, 300);
                              }}
                              _hover={{ bg: 'rgba(168,85,247,0.2)', color: 'purple.200' }}
                            >
                              Replace
                            </Button>
                          </VStack>
                        </VStack>
                      </Box>
                    );
                  })}
                </SimpleGrid>
                </Box>
              </Collapse>
            </Box>
          </>
        )}

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
                <VStack spacing={4} align="stretch">
                  {/* Items Grid */}
                  {currentRoomItems.length === 0 ? (
                    <Card variant="outline">
                      <CardBody>
                        <Text textAlign="center" color="gray.500">
                          No items available in this category
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
                                  h="80px"
                                  minH="80px"
                                  bg="gray.100"
                                  borderRadius="md"
                                  overflow="hidden"
                                  position="relative"
                                  flexShrink={0}
                                  sx={{
                                    minHeight: '80px !important',
                                    height: '80px !important',
                                  }}
                                >
                                  {item.image ? (
                                    <NextImage
                                      src={item.image}
                                      alt={item.name}
                                      fill
                                      sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                      style={{
                                        objectFit: 'cover',
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
