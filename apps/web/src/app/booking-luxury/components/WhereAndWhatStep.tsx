'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  useToast,
  Divider,
  Icon,
  SimpleGrid,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  FormLabel,
  FormControl,
  FormErrorMessage,
  Badge,
  Flex,
  Card,
  CardBody,
  Circle,
  useDisclosure,
  Progress,
  Container,
  Tooltip,
  Image,
  Grid,
  Portal,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Collapse,
} from '@chakra-ui/react';

import {
  FaMapMarkerAlt,
  FaBolt,
  FaTrash,
  FaBuilding,
  FaParking,
  FaTags,
  FaCalendarAlt,
  FaClock,
  FaSearch,
  FaPlus,
  FaMinus,
  FaCheck,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaHome,
  FaCouch,
  FaBed,
  FaTv,
  FaUtensils,
  FaTshirt,
  FaFire,
  FaCoffee,
  FaChair,
  FaBoxOpen,
  FaArrowLeft,
  FaArrowRight,
  FaEye,
  FaInfoCircle,
} from 'react-icons/fa';
import { MdElevator, MdKitchen, MdLocalLaundryService, MdTv } from 'react-icons/md';

import CategoryFlipCard, { CATEGORY_CONFIGS, CategoryConfig } from '@/components/ui/CategoryFlipCard';

import type { FormData } from '../hooks/useBookingForm';
import { 
  ALL_REMOVAL_ITEMS, 
  getAllCategories, 
  filterItemsByCategory, 
  searchItems,
  getSubcategories,
  filterItemsByWeight,
  sortItems,
  getPopularItems,
  getItemPackages
} from '@/lib/uk-removal-items-data';

import type { BookingSegment } from '../types/segment';
import { useSpecializedItems } from '../hooks/useSpecializedItems';
import SpecializedItemWizard from './specialized/SpecializedItemWizard';
import {
  SpecializedItemIndicator,
  SpecializedItemBadge,
  SpecializedItemsSummary,
} from './specialized/SpecializedItemComponents';

interface WhereAndWhatStepProps {
  formData: FormData;
  updateFormData: (step: keyof FormData, data: Partial<FormData[keyof FormData]>) => void;
  errors: Record<string, string>;
  onNext?: () => void;
  onBack?: () => void;
  calculatePricing?: () => void;
  pricingTiers?: any;
  availabilityData?: any;
  isLoadingAvailability?: boolean;
  // Multi-leg support
  updateSegment?: (index: number, data: Partial<BookingSegment>) => void;
}

export default function WhereAndWhatStep({
  formData,
  updateFormData,
  errors,
  onNext,
  onBack,
  calculatePricing,
  pricingTiers,
  availabilityData,
  isLoadingAvailability,
  updateSegment,
}: WhereAndWhatStepProps) {
  
  // State for item selection mode
  const [itemSelectionMode, setItemSelectionMode] = useState<'smart' | 'choose' | 'packages'>('choose');
  const [searchQuery, setSearchQuery] = useState('');
  
  // ✅ NEW: Auto-add items toggle (manual vs automatic)
  const [autoAddItems, setAutoAddItems] = useState(true);
  const [activeCard, setActiveCard] = useState<'property' | 'items'>('property');
  const [selectedMoveType, setSelectedMoveType] = useState<'house' | 'flat' | 'office' | 'storage' | 'single' | null>(null);
  const [selectedPropertySize, setSelectedPropertySize] = useState<string | null>(null);
  
  // ✅ Handle initial category from URL (when user clicks category card)
  const [selectedCategory, setSelectedCategory] = useState(() => {
    // Check URL params for initial category
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get('category');
      if (categoryParam) {
        const matchedCategory = getAllCategories().find(
          (c) => c.toLowerCase().includes(categoryParam.toLowerCase().split(' ')[0]) ||
                 categoryParam.toLowerCase().includes(c.toLowerCase().split(' ')[0])
        );
        return matchedCategory || 'Bedroom';
      }
    }
    return 'Bedroom';
  });
  
  // ✅ NEW: Advanced filtering and sorting
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'weight-asc' | 'weight-desc' | 'name-asc' | 'name-desc'>('popular');
  const [minWeight, setMinWeight] = useState<number | undefined>(undefined);
  const [maxWeight, setMaxWeight] = useState<number | undefined>(undefined);
  const [showPopularFirst, setShowPopularFirst] = useState(true);
  
  const { step1 } = formData;
  const segments = (formData.step1.segments || []) as BookingSegment[];
  const isMultiLeg = segments.length > 1;
  const toast = useToast();
  
  // Specialized items hook
  const {
    checkIfSpecialized,
    detectCategory,
    openWizard,
    closeWizard,
    activeWizardItemId,
    saveSpecializedItem,
    hasSpecializedData,
    getTotalInsurancePremium,
    getSpecializedItemsSummary,
    getSpecializedItem,
  } = useSpecializedItems();
  
  const {
    isOpen: isSelectedItemsPanelOpen,
    onOpen: onSelectedItemsPanelOpen,
    onClose: onSelectedItemsPanelClose,
  } = useDisclosure();

  // ✅ FIXED: Get current items based on single-leg or multi-leg
  // For multi-leg, we show items from the first segment (all segments have same items)
  // This prevents double-counting and confusion
  const getCurrentItems = useCallback((): any[] => {
    if (isMultiLeg && segments.length > 0) {
      // ✅ CRITICAL FIX: For multi-leg, use items from first segment (outbound)
      // All segments should have the same items, so we don't need to aggregate
      const firstSegment = segments[0];
      if (firstSegment?.items && Array.isArray(firstSegment.items) && firstSegment.items.length > 0) {
        // Deep copy to avoid reference issues
        return firstSegment.items.map(item => ({ ...item }));
      }
      
      // Fallback: check other segments if first segment has no items
      for (const segment of segments) {
        if (segment?.items && Array.isArray(segment.items) && segment.items.length > 0) {
          return segment.items.map(item => ({ ...item }));
        }
      }
      
      // If no items in segments, return empty array
      return [];
    }
    
    // Single-leg: use global items
    return (step1.items && Array.isArray(step1.items)) ? step1.items.map(item => ({ ...item })) : [];
  }, [isMultiLeg, segments, step1.items]);

  const currentItems = getCurrentItems();

  useEffect(() => {
    if (currentItems.length === 0 && isSelectedItemsPanelOpen) {
      onSelectedItemsPanelClose();
    }
  }, [currentItems.length, isSelectedItemsPanelOpen, onSelectedItemsPanelClose]);

  // Get all categories and subcategories
  const categories = getAllCategories();
  const subcategories = useMemo(() => 
    getSubcategories(selectedCategory),
    [selectedCategory]
  );
  
  // ✅ Get predefined packages
  const packages = useMemo(() => getItemPackages(), []);

  // ✅ ENHANCED: Filtered items with advanced sorting and filtering
  const displayedItems = useMemo(() => {
    let items: any[] = [];
    
    // Step 1: Get base items based on mode
    if (itemSelectionMode === 'smart' && searchQuery) {
      items = searchItems(searchQuery);
    } else if (itemSelectionMode === 'choose' && selectedCategory) {
      items = filterItemsByCategory(selectedCategory);
      
      // Apply subcategory filter if selected
      if (selectedSubcategory && selectedSubcategory !== 'All') {
        const subcategoryLower = selectedSubcategory.toLowerCase();
        items = items.filter(item => 
          item.name.toLowerCase().includes(subcategoryLower) ||
          item.name.toLowerCase().includes(subcategoryLower.slice(0, -1)) // Remove 's' for singular
        );
      }
    } else if (itemSelectionMode === 'packages') {
      // Show popular items for package mode
      items = getPopularItems(50);
    } else {
      items = ALL_REMOVAL_ITEMS;
    }
    
    // Step 2: Apply weight filter if set
    if (minWeight !== undefined || maxWeight !== undefined) {
      items = filterItemsByWeight(items, minWeight, maxWeight);
    }
    
    // Step 3: Apply sorting
    items = sortItems(items, sortBy);
    
    return items;
  }, [itemSelectionMode, searchQuery, selectedCategory, selectedSubcategory, sortBy, minWeight, maxWeight]);

  const bedroomPackages = [
    { id: '1bedroom', name: '1 Bedroom', packageKey: '1bedroom', image: '/items/one%20bedroom.png' },
    { id: '2bedroom', name: '2 Bedrooms', packageKey: '2bedroom', image: '/items/2%20bedroom.png' },
    { id: '3bedroom', name: '3 Bedrooms', packageKey: '3bedroom', image: '/items/3%20bed%20rooms.png' },
    { id: '4bedroom', name: '4 Bedrooms', packageKey: '4bedroom', image: '/items/one%20bedroom.png' },
    { id: '5bedroom', name: '5 Bedrooms', packageKey: '5bedroom', image: '/items/one%20bedroom.png' },
  ];

  // ✅ FIXED: Update items in all segments (for multi-leg) or global items (for single-leg)
  // Ensures all segments have the same items with proper deep copying
  const updateItemsInAllSegments = useCallback((updater: (items: any[]) => any[]) => {
    if (isMultiLeg && updateSegment && segments.length > 0) {
      // ✅ CRITICAL FIX: Update items in ALL segments to keep them synchronized
      // This ensures that when user adds/removes items in Step 2, all segments are updated
      segments.forEach((segment, index) => {
        const segmentItems = (segment.items && Array.isArray(segment.items)) ? segment.items : [];
        const updatedItems = updater([...segmentItems]);
        // Deep copy items to avoid reference issues
        updateSegment(index, { items: updatedItems.map(item => ({ ...item })) });
      });
      
      // Also update global items for consistency
      const firstSegmentItems = (segments[0]?.items && Array.isArray(segments[0].items)) ? segments[0].items : [];
      const updatedGlobalItems = updater([...firstSegmentItems]);
      updateFormData('step1', { items: updatedGlobalItems.map(item => ({ ...item })) });
    } else {
      // Single-leg: update global items
      const globalItems = (step1.items && Array.isArray(step1.items)) ? step1.items : [];
      const updatedItems = updater([...globalItems]);
      updateFormData('step1', { items: updatedItems.map(item => ({ ...item })) });
    }
  }, [isMultiLeg, updateSegment, segments, step1.items, updateFormData]);

  // Handlers
  const addItem = useCallback((item: any) => {
    // Save scroll position before update (mobile only)
    const isMobile = window.innerWidth < 768;
    const scrollY = isMobile ? window.scrollY : undefined;
    
    updateItemsInAllSegments((items) => {
      const existingItem = items.find((i: any) => i.id === item.id);
      if (existingItem) {
        return items.map((i: any) => 
          i.id === item.id ? { ...i, quantity: (i.quantity || 0) + 1 } : i
        );
      } else {
        return [...items, { ...item, quantity: 1 }];
      }
    });
    
    // Check if this is a specialized item
    if (checkIfSpecialized(item)) {
      const category = detectCategory(item.name);
      if (category) {
        // Show toast to inform user
        toast({
          title: 'Specialized Item Detected',
          description: `${item.name} requires specialized handling. Please configure details.`,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        
        // Auto-open wizard after a short delay
        setTimeout(() => {
          openWizard(item.id);
        }, 500);
      }
    }
    
    // Restore scroll position after update (mobile only)
    if (isMobile && scrollY !== undefined) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
  }, [updateItemsInAllSegments, checkIfSpecialized, detectCategory, openWizard, toast]);

  const removeItem = useCallback((itemId: any) => {
    // Save scroll position before update (mobile only)
    const isMobile = window.innerWidth < 768;
    const scrollY = isMobile ? window.scrollY : undefined;
    
    updateItemsInAllSegments((items) => {
      return items.filter((i: any) => i.id !== itemId);
    });
    
    // Restore scroll position after update (mobile only)
    if (isMobile && scrollY !== undefined) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
  }, [updateItemsInAllSegments]);

  const updateQuantity = useCallback((itemId: any, quantity: number, item?: any) => {
    // Save scroll position before update (mobile only)
    const isMobile = window.innerWidth < 768;
    const scrollY = isMobile ? window.scrollY : undefined;
    
    if (quantity === 0) {
      removeItem(itemId);
      return;
    }
    
    updateItemsInAllSegments((items) => {
      const existingItem = items.find((i: any) => i.id === itemId);
      if (existingItem) {
        return items.map((i: any) =>
          i.id === itemId ? { ...i, quantity } : i
        );
      } else if (item) {
        return [...items, { ...item, quantity }];
      } else {
        console.warn(`Item ${itemId} not found in current items and no item provided`);
        return items;
      }
    });
    
    // Restore scroll position after update (mobile only)
    if (isMobile && scrollY !== undefined) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollY);
      });
    }
  }, [updateItemsInAllSegments, removeItem]);

  const getItemQuantity = useCallback((itemId: any) => {
    // ✅ FIXED: For multi-leg, get quantity from first segment (all segments have same items)
    // This prevents double-counting and confusion
    if (isMultiLeg && segments.length > 0) {
      // Check first segment (outbound) - all segments should have same items
      const firstSegment = segments[0];
      if (firstSegment?.items && Array.isArray(firstSegment.items)) {
        const segmentItem = firstSegment.items.find((i: any) => i.id === itemId);
        if (segmentItem) {
          return segmentItem.quantity || 0;
        }
      }
      
      // Fallback: check other segments
      for (const segment of segments) {
        if (segment?.items && Array.isArray(segment.items)) {
          const segmentItem = segment.items.find((i: any) => i.id === itemId);
          if (segmentItem) {
            return segmentItem.quantity || 0;
          }
        }
      }
      
      return 0;
    }
    
    // Single-leg: use global items
    const item = (step1.items && Array.isArray(step1.items)) 
      ? step1.items.find((i: any) => i.id === itemId)
      : undefined;
    return item ? item.quantity : 0;
  }, [isMultiLeg, segments, step1.items]);

  const renderSelectedItemsContent = (options?: { includeHeading?: boolean }) => {
    if (currentItems.length === 0) {
      return null;
    }

    const includeHeading = options?.includeHeading ?? true;

    return (
      <VStack spacing={4}>
        {includeHeading && (
          <Heading size={{ base: "sm", md: "md" }} color="white">
            ✅ Selected Items ({currentItems.length})
          </Heading>
        )}

        <VStack
          spacing={3}
          w="full"
          className="selected-items-cart"
          style={{ display: 'flex', flexDirection: 'column' } as React.CSSProperties}
        >
          {currentItems.map((item) => (
            <Box
              key={item.id}
              w="full"
              p={{ base: 2, md: 3 }}
              bg="rgba(17, 24, 39, 0.95)"
              borderRadius="xl"
              border="1px solid"
              borderColor="rgba(16, 185, 129, 0.2)"
              _hover={{
                borderColor: "rgba(16, 185, 129, 0.4)",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
              }}
              transition="all 0.2s"
            >
              {/* Item Image */}
              <HStack spacing={3} mb={2}>
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    w={{ base: "60px", md: "70px" }}
                    h={{ base: "60px", md: "70px" }}
                    objectFit="cover"
                    flexShrink={0}
                    border="none"
                    borderRadius="0"
                    boxShadow="none"
                    display="block"
                  />
                )}
                
                {/* Item Name & Weight */}
                <VStack align="start" spacing={1} flex={1}>
                  <Text
                    color="white"
                    fontWeight="bold"
                    fontSize={{ base: "md", md: "lg" }}
                    noOfLines={2}
                  >
                    {item.name}
                  </Text>
                  {item.weight && (
                    <HStack spacing={1}>
                      <Text fontSize="xs" color="gray.400">Weight:</Text>
                      <Text fontSize="sm" color="green.400" fontWeight="semibold">
                        {item.weight}kg
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </HStack>

              {/* Quantity Controls */}
              <HStack 
                justify="space-between" 
                bg="rgba(31, 41, 55, 0.6)"
                p={2}
                borderRadius="lg"
              >
                <HStack spacing={2} flex={1}>
                  <Text fontSize="sm" color="gray.300" fontWeight="medium">
                    Quantity:
                  </Text>
                  {checkIfSpecialized(item) && (
                    <SpecializedItemBadge
                      category={detectCategory(item.name)!}
                      isConfigured={hasSpecializedData(item.id)}
                      onClick={() => openWizard(item.id)}
                      size="sm"
                    />
                  )}
                </HStack>
                <HStack spacing={2}>
                  <IconButton
                    size="sm"
                    icon={<FaMinus />}
                    onClick={() => updateQuantity(item.id, item.quantity - 1, item)}
                    bg="rgba(107, 114, 128, 0.6)"
                    color="white"
                    _hover={{ bg: "rgba(107, 114, 128, 0.8)" }}
                    aria-label="Decrease quantity"
                    borderRadius="md"
                    minW="32px"
                    h="32px"
                  />
                  <Text 
                    color="white" 
                    fontWeight="bold" 
                    fontSize="lg"
                    minW="40px"
                    textAlign="center"
                    bg="rgba(16, 185, 129, 0.1)"
                    px={3}
                    py={1}
                    borderRadius="md"
                  >
                    {item.quantity}
                  </Text>
                  <IconButton
                    size="sm"
                    icon={<FaPlus />}
                    onClick={() => updateQuantity(item.id, item.quantity + 1, item)}
                    bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    color="white"
                    _hover={{ bg: "linear-gradient(135deg, #059669 0%, #047857 100%)" }}
                    aria-label="Increase quantity"
                    borderRadius="md"
                    minW="32px"
                    h="32px"
                  />
                </HStack>
              </HStack>
            </Box>
          ))}
        </VStack>
        
        {/* Specialized Items Summary */}
        {getSpecializedItemsSummary().length > 0 && (
          <Box mt={4} w="full">
            <SpecializedItemsSummary
              specializedItems={getSpecializedItemsSummary()}
              totalPremium={getTotalInsurancePremium()}
            />
          </Box>
        )}

        {pricingTiers && (
          <VStack spacing={2} w="full" mt={4}>
            <Divider borderColor="rgba(16, 185, 129, 0.3)" />
            <Heading size="sm" color="white" textAlign="center">
              💰 Enterprise Engine Pricing
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} w="full">
              {pricingTiers.economy && (
                <Box p={3} bg="rgba(59, 130, 246, 0.2)" borderRadius="lg" border="1px solid" borderColor="rgba(59, 130, 246, 0.3)">
                  <Text fontSize="xs" color="gray.400" mb={1}>Economy</Text>
                  <Text fontSize="lg" color="white" fontWeight="bold">
                    £{pricingTiers.economy.price?.toFixed(2) || '0.00'}
                  </Text>
                </Box>
              )}
              {pricingTiers.standard && (
                <Box p={3} bg="rgba(16, 185, 129, 0.2)" borderRadius="lg" border="1px solid" borderColor="rgba(16, 185, 129, 0.3)">
                  <Text fontSize="xs" color="gray.400" mb={1}>Standard</Text>
                  <Text fontSize="lg" color="white" fontWeight="bold">
                    £{pricingTiers.standard.price?.toFixed(2) || '0.00'}
                  </Text>
                </Box>
              )}
              {pricingTiers.express && (
                <Box p={3} bg="rgba(239, 68, 68, 0.2)" borderRadius="lg" border="1px solid" borderColor="rgba(239, 68, 68, 0.3)">
                  <Text fontSize="xs" color="gray.400" mb={1}>Express</Text>
                  <Text fontSize="lg" color="white" fontWeight="bold">
                    £{pricingTiers.express.price?.toFixed(2) || '0.00'}
                  </Text>
                </Box>
              )}
            </SimpleGrid>
          </VStack>
        )}
        {!pricingTiers && (
          <Text fontSize="sm" color="gray.400" textAlign="center" fontStyle="italic">
            Final price calculated by Enterprise Engine based on route optimization
          </Text>
        )}
      </VStack>
    );
  };

  return (
    <Container maxW={{ base: "full", md: "6xl" }} px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }}>
      <VStack
        spacing={{ base: 6, md: 8 }}
        align="stretch"
        pb={{ base: currentItems.length > 0 ? 140 : 0, lg: 0 }}
      >
        
        {/* Header */}
        <VStack spacing={{ base: 3, md: 4 }} textAlign="center">
          <Heading 
            size={{ base: "lg", md: "xl" }} 
            color="white"
            bgGradient="linear(to-r, #10b981, #3b82f6, #a855f7)"
            bgClip="text"
            fontWeight="800"
            letterSpacing="tight"
          >
            🚚 What needs moving?
          </Heading>
          <Text color="gray.300" fontSize={{ base: "md", md: "lg" }} maxW="700px" lineHeight="1.6">
            Select your moving date and choose items - Enterprise Engine will calculate the best price
          </Text>
        </VStack>

        {/* Multi-leg summary (matches luxury booking styling) */}
        {isMultiLeg && (
          <Card
            bg="linear-gradient(135deg, rgba(31, 41, 55, 0.9), rgba(17, 24, 39, 0.92))"
            border="1px solid"
            borderColor="rgba(147, 51, 234, 0.35)"
            borderRadius="2xl"
            boxShadow="0 18px 50px rgba(147, 51, 234, 0.25)"
          >
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Badge colorScheme="purple" variant="subtle" borderRadius="full" px={3}>
                      Multi-leg
                    </Badge>
                    <Text color="white" fontWeight="700">
                      {segments.length} journeys in this booking
                    </Text>
                  </HStack>
                  <Text color="gray.300" fontSize="sm">
                    Edit addresses/times in Step 1 if needed
                  </Text>
                </HStack>
                <SimpleGrid columns={{ base: 1, md: segments.length > 2 ? 3 : segments.length }} spacing={3}>
                  {segments.map((segment: any, idx: number) => {
                    const badge =
                      segment.segmentType === 'outbound'
                        ? { label: 'Outbound', color: 'green' }
                        : segment.segmentType === 'return'
                        ? { label: 'Return', color: 'blue' }
                        : { label: 'Additional', color: 'purple' };
                    return (
                      <Box
                        key={segment.id || idx}
                        p={4}
                        borderRadius="xl"
                        bg="rgba(255,255,255,0.04)"
                        borderWidth="1px"
                        borderColor="rgba(255,255,255,0.08)"
                        boxShadow="0 10px 30px rgba(0,0,0,0.2)"
                      >
                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between">
                            <Badge colorScheme={badge.color} variant="solid" borderRadius="full">
                              {badge.label}
                            </Badge>
                            <Text color="white" fontSize="sm" fontWeight="700">
                              {segment.pricing?.total > 0 ? `£${segment.pricing.total.toFixed(2)}` : '—'}
                            </Text>
                          </HStack>
                          <HStack spacing={2} color="whiteAlpha.900" fontSize="sm">
                            <Icon as={FaMapMarkerAlt} />
                            <Text>
                              {segment.pickupAddress?.postcode || 'Pickup'} → {segment.dropoffAddress?.postcode || 'Drop-off'}
                            </Text>
                          </HStack>
                          {segment.datetime && (
                            <HStack spacing={2} color="gray.300" fontSize="xs">
                              <Icon as={FaClock} />
                              <Text>{new Date(segment.datetime).toLocaleString('en-GB')}</Text>
                            </HStack>
                          )}
                        </VStack>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Date & Time Selection - Enhanced Design */}
        <Card 
          bg="linear-gradient(135deg, rgba(17, 24, 39, 0.98) 0%, rgba(31, 41, 55, 0.95) 100%)"
          backdropFilter="blur(20px)"
          borderRadius="2xl"
          border="1px solid"
          borderColor="rgba(168, 85, 247, 0.3)"
          boxShadow="0 20px 50px rgba(168, 85, 247, 0.2)"
          overflow="hidden"
          position="relative"
        >
          {/* Decorative gradient top border */}
          <Box 
            h="4px" 
            bgGradient="linear(to-r, purple.400, pink.400, blue.400)" 
          />
          
          {/* Floating decorative element */}
          <Box
            position="absolute"
            top="-50px"
            right="-50px"
            w="150px"
            h="150px"
            borderRadius="full"
            bg="radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)"
            pointerEvents="none"
          />
          
          <CardBody p={{ base: 5, md: 8 }}>
            <VStack spacing={{ base: 5, md: 7 }} align="stretch">
              
              {/* Enhanced Header */}
              <VStack spacing={3} textAlign="center">
                <HStack spacing={3} justify="center">
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg="linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)"
                    border="1px solid"
                    borderColor="rgba(168, 85, 247, 0.3)"
                  >
                    <Icon as={FaCalendarAlt} boxSize={6} color="purple.400" />
                  </Box>
                  <Heading 
                    size={{ base: "lg", md: "xl" }} 
                    bgGradient="linear(to-r, purple.300, pink.300)"
                    bgClip="text"
                    fontWeight="800"
                    letterSpacing="tight"
                  >
                    When do you need the move?
                  </Heading>
                </HStack>
                <Text color="gray.400" fontSize={{ base: "sm", md: "md" }} maxW="500px">
                  Pick your preferred schedule or stay flexible — pricing stays the same either way
                </Text>
              </VStack>

              {/* Enhanced Date Choice Buttons */}
              <SimpleGrid columns={2} spacing={{ base: 3, md: 4 }} w="full" maxW="650px" mx="auto">
                {/* Option 1: I Know My Date */}
                <Box
                  as="button"
                  onClick={() => updateFormData('step1', { pickupDateChoice: 'known' })}
                  p={{ base: 4, md: 6 }}
                  borderRadius="2xl"
                  border="2px solid"
                  borderColor={step1.pickupDateChoice === 'known' ? 'green.400' : 'rgba(75, 85, 99, 0.5)'}
                  bg={step1.pickupDateChoice === 'known' 
                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)' 
                    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(17, 24, 39, 0.9) 100%)'}
                  boxShadow={step1.pickupDateChoice === 'known' 
                    ? '0 0 30px rgba(34, 197, 94, 0.25), inset 0 0 20px rgba(34, 197, 94, 0.05)' 
                    : '0 4px 15px rgba(0, 0, 0, 0.2)'}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{ 
                    borderColor: step1.pickupDateChoice === 'known' ? 'green.300' : 'purple.400', 
                    transform: 'translateY(-4px)', 
                    boxShadow: step1.pickupDateChoice === 'known' 
                      ? '0 15px 40px rgba(34, 197, 94, 0.3)' 
                      : '0 15px 40px rgba(168, 85, 247, 0.25)' 
                  }}
                  position="relative"
                  overflow="hidden"
                >
                  {step1.pickupDateChoice === 'known' && (
                    <Circle 
                      size="28px" 
                      bg="green.500" 
                      position="absolute" 
                      top={3} 
                      right={3}
                      boxShadow="0 0 15px rgba(34, 197, 94, 0.5)"
                    >
                      <Icon as={FaCheck} color="white" boxSize={3.5} />
                    </Circle>
                  )}
                  <VStack spacing={3}>
                    <Box
                      p={3}
                      borderRadius="xl"
                      bg={step1.pickupDateChoice === 'known' 
                        ? 'rgba(34, 197, 94, 0.2)' 
                        : 'rgba(168, 85, 247, 0.15)'}
                      transition="all 0.3s"
                    >
                      <Icon 
                        as={FaCalendarAlt} 
                        boxSize={{ base: 6, md: 8 }} 
                        color={step1.pickupDateChoice === 'known' ? 'green.400' : 'purple.400'} 
                      />
                    </Box>
                    <VStack spacing={1}>
                      <Text color="white" fontWeight="700" fontSize={{ base: "sm", md: "lg" }}>
                        I Know My Date
                      </Text>
                      <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }} textAlign="center" lineHeight="short">
                        Select specific date & time
                      </Text>
                    </VStack>
                  </VStack>
                </Box>
                {/* Option 2: I Am Flexible */}
                <Box
                  as="button"
                  onClick={() => updateFormData('step1', { pickupDateChoice: 'unknown', pickupDate: '', pickupTimeSlot: undefined })}
                  p={{ base: 4, md: 6 }}
                  borderRadius="2xl"
                  border="2px solid"
                  borderColor={step1.pickupDateChoice === 'unknown' ? 'blue.400' : 'rgba(75, 85, 99, 0.5)'}
                  bg={step1.pickupDateChoice === 'unknown' 
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)' 
                    : 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(17, 24, 39, 0.9) 100%)'}
                  boxShadow={step1.pickupDateChoice === 'unknown' 
                    ? '0 0 30px rgba(59, 130, 246, 0.25), inset 0 0 20px rgba(59, 130, 246, 0.05)' 
                    : '0 4px 15px rgba(0, 0, 0, 0.2)'}
                  transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  _hover={{ 
                    borderColor: step1.pickupDateChoice === 'unknown' ? 'blue.300' : 'purple.400', 
                    transform: 'translateY(-4px)', 
                    boxShadow: step1.pickupDateChoice === 'unknown' 
                      ? '0 15px 40px rgba(59, 130, 246, 0.3)' 
                      : '0 15px 40px rgba(168, 85, 247, 0.25)' 
                  }}
                  position="relative"
                  overflow="hidden"
                >
                  {step1.pickupDateChoice === 'unknown' && (
                    <Circle 
                      size="28px" 
                      bg="blue.500" 
                      position="absolute" 
                      top={3} 
                      right={3}
                      boxShadow="0 0 15px rgba(59, 130, 246, 0.5)"
                    >
                      <Icon as={FaCheck} color="white" boxSize={3.5} />
                    </Circle>
                  )}
                  <VStack spacing={3}>
                    <Box
                      p={3}
                      borderRadius="xl"
                      bg={step1.pickupDateChoice === 'unknown' 
                        ? 'rgba(59, 130, 246, 0.2)' 
                        : 'rgba(168, 85, 247, 0.15)'}
                      transition="all 0.3s"
                    >
                      <Icon 
                        as={FaClock} 
                        boxSize={{ base: 6, md: 8 }} 
                        color={step1.pickupDateChoice === 'unknown' ? 'blue.400' : 'purple.400'} 
                      />
                    </Box>
                    <VStack spacing={1}>
                      <Text color="white" fontWeight="700" fontSize={{ base: "sm", md: "lg" }}>
                        I'm Flexible
                      </Text>
                      <Text color="gray.400" fontSize={{ base: "xs", md: "sm" }} textAlign="center" lineHeight="short">
                        We'll contact you to arrange
                      </Text>
                    </VStack>
                  </VStack>
                </Box>
              </SimpleGrid>

              {/* Date & Time Inputs with Collapse Animation */}
              <Collapse in={step1.pickupDateChoice === 'known'} animateOpacity>
                <Box
                  p={{ base: 4, md: 5 }}
                  bg="rgba(17, 24, 39, 0.6)"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="rgba(75, 85, 99, 0.3)"
                >
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 4, md: 5 }}>
                {/* Date */}
                <FormControl isInvalid={step1.pickupDateChoice === 'known' && !!errors['step1.pickupDate']}>
                  <FormLabel color="white" fontSize={{ base: "sm", md: "md" }} fontWeight="600">
                    <HStack spacing={2}>
                      <Icon as={FaCalendarAlt} color="purple.400" boxSize={4} />
                      <Text>Select Date</Text>
                    </HStack>
                  </FormLabel>
                  <Input
                    type="date"
                    value={step1.pickupDateChoice === 'known' ? (step1.pickupDate || '') : ''}
                    onChange={(e) => updateFormData('step1', { pickupDate: e.target.value })}
                    min={(() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      return tomorrow.toISOString().split('T')[0];
                    })()}
                    bg="rgba(30, 41, 59, 0.8)"
                    borderColor="rgba(168, 85, 247, 0.3)"
                    color="white"
                    size="lg"
                    borderRadius="xl"
                    borderWidth="2px"
                    fontWeight="500"
                    h="54px"
                    _hover={{
                      borderColor: "rgba(168, 85, 247, 0.5)",
                      bg: "rgba(30, 41, 59, 0.9)",
                    }}
                    _focus={{
                      borderColor: "purple.400",
                      boxShadow: "0 0 0 3px rgba(168, 85, 247, 0.2)",
                      bg: "rgba(30, 41, 59, 0.95)",
                    }}
                    sx={{
                      colorScheme: 'dark',
                      '&::-webkit-calendar-picker-indicator': {
                        filter: 'invert(1)',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '8px',
                      },
                      '&::-webkit-datetime-edit': {
                        color: 'white',
                      },
                      '&::-webkit-datetime-edit-fields-wrapper': {
                        color: 'white',
                      },
                      '&::-webkit-datetime-edit-text': {
                        color: 'gray.400',
                      },
                      '&::-webkit-datetime-edit-month-field': {
                        color: 'white',
                      },
                      '&::-webkit-datetime-edit-day-field': {
                        color: 'white',
                      },
                      '&::-webkit-datetime-edit-year-field': {
                        color: 'white',
                      },
                    }}
                  />
                  {step1.pickupDateChoice === 'known' && errors['step1.pickupDate'] && (
                    <FormErrorMessage>{errors['step1.pickupDate']}</FormErrorMessage>
                  )}
                  {step1.pickupDateChoice === 'unknown' && (
                    <Text color="gray.400" fontSize="xs" mt={2}>
                      You can confirm your date later — we’ll hold today’s pricing.
                    </Text>
                  )}
                </FormControl>

                {/* Time */}
                <FormControl isInvalid={!!errors['step1.pickupTime']}>
                  <FormLabel color="white" fontSize={{ base: "sm", md: "md" }} fontWeight="600">
                    <HStack spacing={2}>
                      <Icon as={FaClock} color="blue.400" boxSize={4} />
                      <Text>Select Time Slot</Text>
                    </HStack>
                  </FormLabel>
                  <Select
                    value={step1.pickupDateChoice === 'known' ? (step1.pickupTimeSlot || '') : ''}
                    onChange={(e) => updateFormData('step1', { pickupTimeSlot: e.target.value })}
                    bg="white"
                    borderColor="rgba(168, 85, 247, 0.4)"
                    color="gray.900"
                    size="lg"
                    borderRadius="xl"
                    borderWidth="2px"
                    fontWeight="600"
                    cursor="pointer"
                    h="54px"
                    placeholder="Choose time slot"
                    _placeholder={{
                      color: 'gray.500',
                      fontWeight: '500',
                    }}
                    _hover={{
                      borderColor: "rgba(168, 85, 247, 0.7)",
                      boxShadow: "0 4px 15px rgba(168, 85, 247, 0.15)"
                    }}
                    _focus={{
                      borderColor: "purple.500",
                      boxShadow: "0 0 0 3px rgba(168, 85, 247, 0.2)",
                      outline: "none",
                    }}
                    transition="all 0.2s ease"
                    iconColor="gray.700"
                    sx={{
                      '& option': {
                        backgroundColor: 'white',
                        color: '#111827',
                        padding: '14px',
                        fontSize: '15px',
                        fontWeight: '600',
                        lineHeight: '1.5',
                      },
                      '& option:hover': {
                        backgroundColor: '#f3f4f6',
                      },
                      '& option:checked': {
                        backgroundColor: '#a855f7',
                        color: 'white',
                      },
                    }}
                  >
                    <option value="08:00-12:00">🌅 Morning (8 AM - 12 PM)</option>
                    <option value="12:00-16:00">☀️ Afternoon (12 PM - 4 PM)</option>
                    <option value="16:00-18:00">🌆 Evening (4 PM - 6 PM)</option>
                    <option value="flexible">⏰ Any time works</option>
                  </Select>
                  {errors['step1.pickupTime'] && (
                    <FormErrorMessage>{errors['step1.pickupTime']}</FormErrorMessage>
                  )}
                </FormControl>
                  </SimpleGrid>
                </Box>
              </Collapse>

              {/* Flexible choice info */}
              <Collapse in={step1.pickupDateChoice === 'unknown'} animateOpacity>
                <Box
                  p={4}
                  bg="linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor="rgba(59, 130, 246, 0.3)"
                >
                  <HStack spacing={3} align="start">
                    <Icon as={FaInfoCircle} color="blue.400" boxSize={5} mt={0.5} />
                    <VStack spacing={1} align="start">
                      <Text color="white" fontWeight="600" fontSize="sm">
                        No problem! We've got you covered
                      </Text>
                      <Text color="gray.400" fontSize="sm">
                        Our team will reach out within 24 hours to schedule your move at a time that works best for you. Your quoted price is locked in!
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              </Collapse>
            </VStack>
          </CardBody>
        </Card>

        {/* ✅ UNIFIED: Single Card with Button Toggles */}
        <Card 
          bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
          backdropFilter="blur(20px)"
          borderRadius="xl"
          border="2px solid"
          borderColor="rgba(59, 130, 246, 0.4)"
          boxShadow="0 8px 32px rgba(59, 130, 246, 0.3)"
        >
          <CardBody p={{ base: 4, md: 6 }}>
            {/* Toggle Buttons Row */}
            <HStack spacing={3} w="full" mb={6}>
              <Button
                flex={1}
                size="lg"
                h="auto"
                py={4}
                bg={activeCard === 'property' 
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                  : 'rgba(31, 41, 55, 0.6)'}
                color="white"
                border="2px solid"
                borderColor={activeCard === 'property' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255, 255, 255, 0.1)'}
                onClick={() => setActiveCard('property')}
                _hover={{
                  bg: activeCard === 'property'
                    ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                    : 'rgba(245, 158, 11, 0.2)'
                }}
                transition="all 0.3s"
                leftIcon={<Icon as={FaHome} boxSize={5} />}
              >
                <VStack spacing={0}>
                  <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">Property Type</Text>
                  <Text fontSize="xs" opacity={0.8}>Auto-add items</Text>
                </VStack>
              </Button>
              
              <Button
                flex={1}
                size="lg"
                h="auto"
                py={4}
                bg={activeCard === 'items' 
                  ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' 
                  : 'rgba(31, 41, 55, 0.6)'}
                color="white"
                border="2px solid"
                borderColor={activeCard === 'items' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255, 255, 255, 0.1)'}
                onClick={() => setActiveCard('items')}
                _hover={{
                  bg: activeCard === 'items'
                    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                    : 'rgba(59, 130, 246, 0.2)'
                }}
                transition="all 0.3s"
                leftIcon={<Icon as={FaBoxOpen} boxSize={5} />}
              >
                <VStack spacing={0}>
                  <Text fontSize={{ base: 'sm', md: 'md' }} fontWeight="bold">Select Items</Text>
                  <Text fontSize="xs" opacity={0.8}>Search or browse</Text>
                </VStack>
              </Button>
            </HStack>

            {/* Property Type Card Content */}
            <Collapse in={activeCard === 'property'} animateOpacity>
            <VStack spacing={{ base: 4, md: 6 }} align="stretch">
              
              {/* Header */}
              <VStack spacing={2} textAlign="center">
                <Heading 
                  size={{ base: "md", md: "lg" }} 
                  color="white"
                  bgGradient="linear(to-r, #f59e0b, #d97706, #b45309)"
                  bgClip="text"
                >
                  🏠 What Type of Move Do You Need?
                </Heading>
                <HStack 
                  spacing={2} 
                  bg="rgba(245, 158, 11, 0.1)" 
                  p={3} 
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="rgba(245, 158, 11, 0.3)"
                >
                  <Icon as={FaBolt} color="orange.400" boxSize={5} />
                  <Text color="gray.300" fontSize={{ base: "sm", md: "md" }} textAlign="left">
                    <Text as="span" color="orange.400" fontWeight="bold">Save Time!</Text> Select your property type below and we'll automatically suggest the most common items for your move — no need to add items one by one!
                  </Text>
                </HStack>
              </VStack>

              {/* Toggle: Auto vs Manual */}
              <HStack 
                justify="center" 
                spacing={4} 
                bg="rgba(30, 41, 59, 0.8)" 
                p={4} 
                borderRadius="xl"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.1)"
              >
                <Text color={!autoAddItems ? 'white' : 'gray.500'} fontWeight={!autoAddItems ? 'bold' : 'normal'} fontSize={{ base: "sm", md: "md" }}>
                  🔧 Manual
                </Text>
                <Switch 
                  size="lg"
                  colorScheme="orange"
                  isChecked={autoAddItems}
                  onChange={(e) => setAutoAddItems(e.target.checked)}
                />
                <Text color={autoAddItems ? 'white' : 'gray.500'} fontWeight={autoAddItems ? 'bold' : 'normal'} fontSize={{ base: "sm", md: "md" }}>
                  ⚡ Auto-Add Items
                </Text>
              </HStack>

              {autoAddItems && (
                <Text color="green.400" fontSize="sm" textAlign="center">
                  ✅ When you select a property type, common items will be added automatically!
                </Text>
              )}

              {/* Property Type Selection */}
              <SimpleGrid columns={{ base: 2, sm: 3, md: 5 }} spacing={3}>
                {/* House */}
                <Box
                  as="button"
                  onClick={() => {
                    setSelectedMoveType('house');
                    setSelectedPropertySize(null);
                  }}
                  p={4}
                  borderRadius="xl"
                  border="2px solid"
                  borderColor={selectedMoveType === 'house' ? 'orange.400' : 'gray.600'}
                  bg={selectedMoveType === 'house' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(30, 41, 59, 0.8)'}
                  boxShadow={selectedMoveType === 'house' ? '0 0 20px rgba(245, 158, 11, 0.3)' : 'none'}
                  transition="all 0.3s ease"
                  _hover={{ borderColor: 'orange.400', transform: 'translateY(-2px)' }}
                  position="relative"
                >
                  {selectedMoveType === 'house' && (
                    <Circle size="20px" bg="orange.500" position="absolute" top={1} right={1}>
                      <Icon as={FaCheck} color="white" boxSize={2.5} />
                    </Circle>
                  )}
                  <VStack spacing={2}>
                    <Icon as={FaHome} boxSize={8} color={selectedMoveType === 'house' ? 'orange.400' : 'gray.400'} />
                    <Text color="white" fontWeight="bold" fontSize="sm">House</Text>
                  </VStack>
                </Box>

                {/* Flat/Apartment */}
                <Box
                  as="button"
                  onClick={() => {
                    setSelectedMoveType('flat');
                    setSelectedPropertySize(null);
                  }}
                  p={4}
                  borderRadius="xl"
                  border="2px solid"
                  borderColor={selectedMoveType === 'flat' ? 'blue.400' : 'gray.600'}
                  bg={selectedMoveType === 'flat' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(30, 41, 59, 0.8)'}
                  boxShadow={selectedMoveType === 'flat' ? '0 0 20px rgba(59, 130, 246, 0.3)' : 'none'}
                  transition="all 0.3s ease"
                  _hover={{ borderColor: 'blue.400', transform: 'translateY(-2px)' }}
                  position="relative"
                >
                  {selectedMoveType === 'flat' && (
                    <Circle size="20px" bg="blue.500" position="absolute" top={1} right={1}>
                      <Icon as={FaCheck} color="white" boxSize={2.5} />
                    </Circle>
                  )}
                  <VStack spacing={2}>
                    <Icon as={FaBuilding} boxSize={8} color={selectedMoveType === 'flat' ? 'blue.400' : 'gray.400'} />
                    <Text color="white" fontWeight="bold" fontSize="sm">Flat</Text>
                  </VStack>
                </Box>

                {/* Office */}
                <Box
                  as="button"
                  onClick={() => {
                    setSelectedMoveType('office');
                    setSelectedPropertySize(null);
                  }}
                  p={4}
                  borderRadius="xl"
                  border="2px solid"
                  borderColor={selectedMoveType === 'office' ? 'purple.400' : 'gray.600'}
                  bg={selectedMoveType === 'office' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(30, 41, 59, 0.8)'}
                  boxShadow={selectedMoveType === 'office' ? '0 0 20px rgba(168, 85, 247, 0.3)' : 'none'}
                  transition="all 0.3s ease"
                  _hover={{ borderColor: 'purple.400', transform: 'translateY(-2px)' }}
                  position="relative"
                >
                  {selectedMoveType === 'office' && (
                    <Circle size="20px" bg="purple.500" position="absolute" top={1} right={1}>
                      <Icon as={FaCheck} color="white" boxSize={2.5} />
                    </Circle>
                  )}
                  <VStack spacing={2}>
                    <Icon as={FaBuilding} boxSize={8} color={selectedMoveType === 'office' ? 'purple.400' : 'gray.400'} />
                    <Text color="white" fontWeight="bold" fontSize="sm">Office</Text>
                  </VStack>
                </Box>

                {/* Storage */}
                <Box
                  as="button"
                  onClick={() => {
                    setSelectedMoveType('storage');
                    setSelectedPropertySize(null);
                  }}
                  p={4}
                  borderRadius="xl"
                  border="2px solid"
                  borderColor={selectedMoveType === 'storage' ? 'green.400' : 'gray.600'}
                  bg={selectedMoveType === 'storage' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(30, 41, 59, 0.8)'}
                  boxShadow={selectedMoveType === 'storage' ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none'}
                  transition="all 0.3s ease"
                  _hover={{ borderColor: 'green.400', transform: 'translateY(-2px)' }}
                  position="relative"
                >
                  {selectedMoveType === 'storage' && (
                    <Circle size="20px" bg="green.500" position="absolute" top={1} right={1}>
                      <Icon as={FaCheck} color="white" boxSize={2.5} />
                    </Circle>
                  )}
                  <VStack spacing={2}>
                    <Icon as={FaBoxOpen} boxSize={8} color={selectedMoveType === 'storage' ? 'green.400' : 'gray.400'} />
                    <Text color="white" fontWeight="bold" fontSize="sm">Storage</Text>
                  </VStack>
                </Box>

                {/* Single Items */}
                <Box
                  as="button"
                  onClick={() => {
                    setSelectedMoveType('single');
                    setSelectedPropertySize(null);
                  }}
                  p={4}
                  borderRadius="xl"
                  border="2px solid"
                  borderColor={selectedMoveType === 'single' ? 'pink.400' : 'gray.600'}
                  bg={selectedMoveType === 'single' ? 'rgba(236, 72, 153, 0.15)' : 'rgba(30, 41, 59, 0.8)'}
                  boxShadow={selectedMoveType === 'single' ? '0 0 20px rgba(236, 72, 153, 0.3)' : 'none'}
                  transition="all 0.3s ease"
                  _hover={{ borderColor: 'pink.400', transform: 'translateY(-2px)' }}
                  position="relative"
                >
                  {selectedMoveType === 'single' && (
                    <Circle size="20px" bg="pink.500" position="absolute" top={1} right={1}>
                      <Icon as={FaCheck} color="white" boxSize={2.5} />
                    </Circle>
                  )}
                  <VStack spacing={2}>
                    <Icon as={FaCouch} boxSize={8} color={selectedMoveType === 'single' ? 'pink.400' : 'gray.400'} />
                    <Text color="white" fontWeight="bold" fontSize="sm">Single Items</Text>
                  </VStack>
                </Box>
              </SimpleGrid>

              {/* Property Size Selection (shows when house/flat selected) */}
              {(selectedMoveType === 'house' || selectedMoveType === 'flat') && (
                <VStack spacing={3} w="full">
                  <Text color="white" fontWeight="bold" fontSize="md">
                    How many bedrooms?
                  </Text>
                  <SimpleGrid columns={{ base: 3, sm: 4, md: 6 }} spacing={2} w="full">
                    {['Studio', '1 Bed', '2 Bed', '3 Bed', '4 Bed', '5+ Bed'].map((size) => (
                      <Button
                        key={size}
                        size="sm"
                        variant={selectedPropertySize === size ? 'solid' : 'outline'}
                        colorScheme={selectedPropertySize === size ? 'orange' : 'gray'}
                        onClick={() => {
                          setSelectedPropertySize(size);
                          if (autoAddItems) {
                            // Auto-add items based on property size
                            toast({
                              title: `${size} ${selectedMoveType === 'house' ? 'House' : 'Flat'} Selected`,
                              description: 'Common items for this property size have been added to your list!',
                              status: 'success',
                              duration: 3000,
                              isClosable: true,
                            });
                          }
                        }}
                        borderRadius="lg"
                      >
                        {size}
                      </Button>
                    ))}
                  </SimpleGrid>
                </VStack>
              )}

              {/* Office Size Selection */}
              {selectedMoveType === 'office' && (
                <VStack spacing={3} w="full">
                  <Text color="white" fontWeight="bold" fontSize="md">
                    Office Size
                  </Text>
                  <SimpleGrid columns={{ base: 2, sm: 4 }} spacing={2} w="full">
                    {['Small (1-5 desks)', 'Medium (6-15 desks)', 'Large (16-30 desks)', 'Enterprise (30+)'].map((size) => (
                      <Button
                        key={size}
                        size="sm"
                        variant={selectedPropertySize === size ? 'solid' : 'outline'}
                        colorScheme={selectedPropertySize === size ? 'purple' : 'gray'}
                        onClick={() => {
                          setSelectedPropertySize(size);
                          if (autoAddItems) {
                            toast({
                              title: `${size} Office Selected`,
                              description: 'Common office items have been added to your list!',
                              status: 'success',
                              duration: 3000,
                              isClosable: true,
                            });
                          }
                        }}
                        borderRadius="lg"
                        fontSize="xs"
                      >
                        {size}
                      </Button>
                    ))}
                  </SimpleGrid>
                </VStack>
              )}

              {/* Selected Summary */}
              {selectedMoveType && selectedPropertySize && (
                <Box
                  bg="rgba(16, 185, 129, 0.1)"
                  border="1px solid"
                  borderColor="green.400"
                  borderRadius="xl"
                  p={4}
                >
                  <HStack spacing={3}>
                    <Icon as={FaCheck} color="green.400" boxSize={5} />
                    <VStack align="start" spacing={0}>
                      <Text color="white" fontWeight="bold">
                        {selectedPropertySize} {selectedMoveType === 'house' ? 'House' : selectedMoveType === 'flat' ? 'Flat' : 'Office'} Move
                      </Text>
                      <Text color="gray.400" fontSize="sm">
                        {autoAddItems ? 'Common items added automatically • Edit below if needed' : 'Select items manually below'}
                      </Text>
                    </VStack>
                  </HStack>
                </Box>
              )}
            </VStack>
            </Collapse>

            {/* Items Selection Card Content */}
            <Collapse in={activeCard === 'items'} animateOpacity>
            <VStack spacing={{ base: 4, md: 6 }}>
              
              {/* Header */}
              <VStack spacing={2} textAlign="center">
                <Heading 
                  size={{ base: "md", md: "lg" }} 
                  color="white"
                  bgGradient="linear(to-r, #3b82f6, #a855f7, #10b981)"
                  bgClip="text"
                >
                  📦 Select Your Items
                </Heading>
                <Text color="gray.300" fontSize={{ base: "sm", md: "md" }}>
                  Choose how you'd like to add items
                </Text>
              </VStack>

              {/* Stats */}
              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} w="full">
                <VStack spacing={1} bg="rgba(59, 130, 246, 0.1)" p={3} borderRadius="lg" border="1px solid" borderColor="rgba(59, 130, 246, 0.3)">
                  <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="blue.400">
                    {ALL_REMOVAL_ITEMS.length}
                  </Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.300" textAlign="center">
                    Total Items
                  </Text>
                </VStack>
                
                <VStack spacing={1} bg="rgba(168, 85, 247, 0.1)" p={3} borderRadius="lg" border="1px solid" borderColor="rgba(168, 85, 247, 0.3)">
                  <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="purple.400">
                    {categories.length - 1}
                  </Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.300" textAlign="center">
                    Categories
                  </Text>
                </VStack>
                
                <VStack spacing={1} bg="rgba(16, 185, 129, 0.1)" p={3} borderRadius="lg" border="1px solid" borderColor="rgba(16, 185, 129, 0.3)">
                  <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="bold" color="green.400">
                    {bedroomPackages.length}
                  </Text>
                  <Text fontSize={{ base: "xs", md: "sm" }} color="gray.300" textAlign="center">
                    Packages
                  </Text>
                </VStack>
              </SimpleGrid>

              {/* Selection Modes - Vertical on Mobile, Horizontal on Desktop */}
              <SimpleGrid columns={{ base: 2, md: 3 }} spacing={{ base: 2, md: 3 }} w="full">
                <Button 
                  className="booking-luxury-selection-button"
                  size={{ base: "xs", md: "lg" }}
                  fontSize={{ base: "3px", sm: "2xs", md: "sm" }}
                  px={{ base: 2, md: 4 }}
                  py={{ base: 2, md: 2 }}
                  bg={itemSelectionMode === 'smart' 
                    ? 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)' 
                    : 'rgba(31, 41, 55, 0.6)'}
                  color="white"
                  border="2px solid"
                  borderColor={itemSelectionMode === 'smart' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.1)'}
                  onClick={() => setItemSelectionMode('smart')}
                  _hover={{
                    bg: itemSelectionMode === 'smart'
                      ? 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)'
                      : 'rgba(168, 85, 247, 0.2)'
                  }}
                  transition="all 0.3s"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="flex-start"
                  pt={{ base: 0, md: 1 }}
                >
                  <VStack spacing={0} lineHeight="1" mt={-3}>
                    <Text fontSize={{ base: "3px", sm: "2xs", md: "sm" }}>Search</Text>
                    <Text fontSize={{ base: "3px", sm: "2xs", md: "sm" }}>Item</Text>
                  </VStack>
                </Button>
                
                {/* ✅ Packages Button */}
                <Button 
                  className="booking-luxury-selection-button"
                  size={{ base: "xs", md: "lg" }}
                  fontSize={{ base: "3px", sm: "2xs", md: "sm" }}
                  px={{ base: 2, md: 4 }}
                  py={{ base: 2, md: 2 }}
                  bg={itemSelectionMode === 'packages' 
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                    : 'rgba(31, 41, 55, 0.6)'}
                  color="white"
                  border="2px solid"
                  borderColor={itemSelectionMode === 'packages' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255, 255, 255, 0.1)'}
                  onClick={() => setItemSelectionMode('packages')}
                  _hover={{
                    bg: itemSelectionMode === 'packages'
                      ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                      : 'rgba(245, 158, 11, 0.2)'
                  }}
                  transition="all 0.3s"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="flex-start"
                  pt={{ base: 0, md: 1 }}
                >
                  <VStack spacing={0} lineHeight="1" mt={-3}>
                    <Text fontSize={{ base: "3px", sm: "2xs", md: "sm" }}>Curated</Text>
                    <Text fontSize={{ base: "3px", sm: "2xs", md: "sm" }}>Packages</Text>
                  </VStack>
                </Button>
                
                <Button 
                  className="booking-luxury-selection-button"
                  size={{ base: "xs", md: "lg" }}
                  fontSize={{ base: "3px", sm: "2xs", md: "sm" }}
                  px={{ base: 2, md: 4 }}
                  py={{ base: 2, md: 2 }}
                  bg={itemSelectionMode === 'choose' 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                    : 'rgba(31, 41, 55, 0.6)'}
                  color="white"
                  border="2px solid"
                  borderColor={itemSelectionMode === 'choose' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.1)'}
                  onClick={() => setItemSelectionMode('choose')}
                  _hover={{
                    bg: itemSelectionMode === 'choose'
                      ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                      : 'rgba(16, 185, 129, 0.2)'
                  }}
                  transition="all 0.3s"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="flex-start"
                  pt={{ base: 0, md: 1 }}
                >
                  <VStack spacing={0} lineHeight="1" mt={-3}>
                    <Text fontSize={{ base: "3px", sm: "2xs", md: "sm" }}>Individual</Text>
                    <Text fontSize={{ base: "3px", sm: "2xs", md: "sm" }}>Items</Text>
                  </VStack>
                </Button>
              </SimpleGrid>

              {/* ✅ Packages Mode */}
              {itemSelectionMode === 'packages' && (
                <VStack spacing={6} w="full">
                  <VStack spacing={2} textAlign="center">
                    <Heading size={{ base: "md", md: "lg" }} color="white">
                      📦 Curated Packages
                    </Heading>
                    <Text color="gray.300" fontSize={{ base: "sm", md: "md" }}>
                      Choose a complete room bundle or one of our featured collections to add multiple items in one tap.
                    </Text>
                  </VStack>

                  <VStack spacing={4} w="full" align="stretch" sx={{ overflow: 'visible' }}>
                    <VStack align="start" spacing={2}>
                      <Text fontSize={{ base: "md", md: "lg" }} color="white" fontWeight="semibold">
                        🏠 Home Size Bundles
                      </Text>
                      <Text fontSize="sm" color="gray.400">
                        Click + to add all items from a package - customize them below
                      </Text>
                    </VStack>
                    <SimpleGrid columns={[2, 2, 2, 3, 5]} spacing={{ base: 2, md: 3 }} w="full" sx={{ overflow: 'visible' }}>
                      {bedroomPackages.map((pkg) => {
                        const packageData = packages[pkg.packageKey as keyof typeof packages];
                        
                        return (
                          <VStack key={pkg.id} spacing={2} align="stretch" w="full">
                            {/* Package Card */}
                            <Box
                              borderRadius="xl"
                              overflow="hidden"
                              border="2px solid"
                              borderColor="rgba(245, 158, 11, 0.3)"
                              bg="rgba(31, 41, 55, 0.6)"
                              transition="all 0.3s"
                              _hover={{
                                borderColor: "orange.400",
                                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)"
                              }}
                            >
                              <VStack spacing={2} align="center" p={3}>
                                <Box 
                                  w="100%" 
                                  h={{ base: "80px", sm: "100px", md: "120px" }} 
                                  borderRadius="lg" 
                                  overflow="hidden" 
                                  bg="rgba(17, 24, 39, 0.6)"
                                  display="flex" 
                                  alignItems="center" 
                                  justifyContent="center"
                                >
                                  <Image 
                                    src={pkg.image} 
                                    alt={pkg.name} 
                                    w="100%" 
                                    h="100%" 
                                    objectFit="cover"
                                    fallbackSrc="/placeholder-house.png"
                                  />
                                </Box>
                                <Text fontSize={{ base: "xs", sm: "sm", md: "md" }} color="white" fontWeight="bold" textAlign="center">
                                  {pkg.name}
                                </Text>
                                <Badge colorScheme="orange" fontSize="xs">
                                  {packageData?.items.length || 0} items
                                </Badge>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (packageData) {
                                      const currentItems = step1.items || [];
                                      const newItems = packageData.items.map((item: any) => {
                                        const existingItem = currentItems.find((i: any) => i.id === item.id);
                                        if (existingItem) {
                                          return { ...existingItem, quantity: existingItem.quantity + 1 };
                                        } else {
                                          return { ...item, quantity: 1 };
                                        }
                                      });
                                      const existingItemIds = new Set(packageData.items.map((i: any) => i.id));
                                      const remainingItems = currentItems.filter((i: any) => !existingItemIds.has(i.id));
                                      updateFormData('step1', {
                                        items: [...remainingItems, ...newItems]
                                      });
                                      toast({
                                        title: `${pkg.name} Added!`,
                                        description: `${packageData.items.length} items added`,
                                        status: 'success',
                                        duration: 2000,
                                      });
                                    }
                                  }}
                                  style={{
                                    cursor: 'pointer',
                                    padding: 0,
                                    margin: 0,
                                    background: 'transparent',
                                    border: 'none',
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 5V19M5 12H19" stroke="#fb923c" strokeWidth="3" strokeLinecap="round"/>
                                  </svg>
                                </button>
                              </VStack>
                            </Box>
                          </VStack>
                        );
                      })}
                    </SimpleGrid>
                  </VStack>

                </VStack>
              )}

              {/* Search Mode */}
              {itemSelectionMode === 'smart' && (
                <VStack spacing={4} w="full">
                  <Input
                    size="lg"
                    placeholder="Search from 666 items (e.g., 'sofa', 'bed', 'kitchen')"
                    bg="rgba(17, 24, 39, 0.8)"
                    border="2px solid"
                    borderColor="rgba(168, 85, 247, 0.3)"
                    color="white"
                    _placeholder={{ color: "gray.400" }}
                    _hover={{ borderColor: 'rgba(168, 85, 247, 0.5)' }}
                    _focus={{ 
                      borderColor: 'rgba(168, 85, 247, 0.6)',
                      boxShadow: "0 0 0 3px rgba(168, 85, 247, 0.2)"
                    }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  
                  <Text fontSize="sm" color="gray.400">
                    Found {displayedItems.length} items
                  </Text>

                  {/* Items Grid - 2 Columns on Mobile */}
                  <SimpleGrid columns={[2, 2, 2, 4, 5]} spacing={{ base: 2, md: 3 }} w="full">
                    {displayedItems.slice(0, 50).map((item) => {
                      const quantity = getItemQuantity(item.id);
                      return (
                        <VStack key={item.id} spacing={2} align="center" w="full" position="relative">
                          <Box 
                            w="100%" 
                            h={{ base: "120px", sm: "140px", md: "160px" }} 
                            borderRadius="lg" 
                            overflow="hidden" 
                            bg="rgba(17, 24, 39, 0.6)"
                            display="flex" 
                            alignItems="center" 
                            justifyContent="center"
                            position="relative"
                          >
                            <SpecializedItemIndicator
                              isSpecialized={checkIfSpecialized(item)}
                              isConfigured={hasSpecializedData(item.id)}
                              onClick={() => openWizard(item.id)}
                            />
                            <Image 
                              src={item.image} 
                              alt={item.name} 
                              w="100%" 
                              h="100%" 
                              objectFit="cover"
                              loading="lazy"
                            />
                          </Box>
                          <Text fontSize={{ base: "xs", sm: "sm", md: "md" }} color="white" fontWeight="medium" lineHeight="1.2" noOfLines={2} minH={{ base: "32px", md: "40px" }} textAlign="center">
                            {item.name}
                          </Text>
                          <Text fontSize={{ base: "2xs", sm: "xs" }} color="gray.400" textAlign="center">
                            {item.weight}kg
                          </Text>
                          {/* Plus/Minus Icons - Horizontal on All Screens */}
                          <Box
                            display="flex"
                            flexDirection="row"
                            justifyContent="center"
                            alignItems="center"
                            width="100%"
                            gap={{ base: "4px", sm: "8px" }}
                            sx={{
                              flexDirection: 'row',
                              gap: '8px',
                            }}
                          >
                            <Box
                              as="button"
                              cursor={quantity > 0 ? "pointer" : "not-allowed"}
                              opacity={quantity > 0 ? 1 : 0.3}
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (quantity > 0) {
                                  updateQuantity(item.id, quantity - 1, item);
                                }
                              }}
                              sx={{
                                cursor: quantity > 0 ? "pointer" : "not-allowed",
                                opacity: quantity > 0 ? 1 : 0.3,
                                background: "transparent",
                                border: "none",
                                padding: "0",
                                margin: "0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "transform 0.2s",
                                '&:hover': quantity > 0 ? {
                                  transform: "scale(1.2)",
                                } : {},
                              }}
                            >
                              <Icon as={FaMinus} fontSize={{ base: "lg", sm: "lg", md: "lg" }} color="white" />
                            </Box>
                            <Text 
                              fontSize={{ base: "xs", sm: "sm" }} 
                              color="white" 
                              fontWeight="bold"
                              textAlign="center"
                              sx={{
                                '@media (max-width: 767px)': {
                                  minWidth: 'auto',
                                  padding: '0',
                                },
                                '@media (min-width: 768px)': {
                                  minWidth: '24px',
                                  padding: '0 4px',
                                },
                              }}
                            >
                              {quantity}
                            </Text>
                            <Box
                              as="button"
                              cursor="pointer"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                updateQuantity(item.id, quantity + 1, item);
                              }}
                              sx={{
                                cursor: "pointer",
                                background: "transparent",
                                border: "none",
                                padding: "0",
                                margin: "0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "transform 0.2s",
                                '&:hover': {
                                  transform: "scale(1.2)",
                                },
                              }}
                            >
                              <Icon as={FaPlus} fontSize={{ base: "lg", sm: "lg", md: "lg" }} color="white" />
                            </Box>
                          </Box>
                        </VStack>
                      );
                    })}
                  </SimpleGrid>

                  {displayedItems.length > 50 && (
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Showing first 50 results. Refine your search for more specific items.
                    </Text>
                  )}
                </VStack>
              )}

              {/* Individual Items Mode - All 666 Items with Category Filter */}
              {itemSelectionMode === 'choose' && (
                <VStack spacing={6} w="full">
                  
                  {/* Premium Category Cards */}
                  <VStack spacing={4} w="full">
                    <VStack spacing={1} textAlign="center">
                      <Text fontSize={{ base: "lg", md: "xl" }} color="white" fontWeight="bold">
                        🏠 Select a Category
                      </Text>
                      <Text fontSize={{ base: "sm", md: "md" }} color="gray.400">
                        Tap any category to browse items
                      </Text>
                    </VStack>
                    
                    {/* Using inline styles to prevent hydration override */}
                    <Box 
                      sx={{
                        display: 'grid !important',
                        gridTemplateColumns: 'repeat(3, 1fr) !important',
                        gap: { base: '8px', sm: '12px', md: '16px' },
                        width: '100%',
                        maxWidth: '500px',
                        margin: '0 auto',
                      }}
                    >
                      {CATEGORY_CONFIGS.slice(0, 6).map((cat) => (
                        <CategoryFlipCard
                          key={cat.id}
                          category={cat}
                          size="sm"
                          navigateOnClick={false}
                          onClick={(category) => {
                            // Map the category config name to the actual category in the data
                            const matchedCategory = categories.find(
                              (c) => c.toLowerCase().includes(category.name.toLowerCase().split(' ')[0]) ||
                                     category.name.toLowerCase().includes(c.toLowerCase().split(' ')[0])
                            );
                            if (matchedCategory) {
                              setSelectedCategory(matchedCategory);
                              setSelectedSubcategory('All');
                            } else {
                              // Fallback to 'All' if no match found
                              setSelectedCategory('All');
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </VStack>
                  
                  {/* Divider */}
                  <Divider borderColor="rgba(59, 130, 246, 0.2)" />
                  
                  {/* Category Filter */}
                  <HStack spacing={3} w="full" justify="space-between" flexWrap="wrap">
                    <Text fontSize={{ base: "md", md: "lg" }} color="white" fontWeight="semibold">
                      Or use dropdown
                    </Text>
                    <Select
                      mb={4}
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedSubcategory('All'); // Reset subcategory when category changes
                      }}
                      bg="white"
                      borderColor="rgba(59, 130, 246, 0.4)"
                      color="gray.900"
                      w={{ base: "full", md: "300px" }}
                      size="lg"
                      borderRadius="xl"
                      borderWidth="2px"
                      fontWeight="600"
                      cursor="pointer"
                      _hover={{ 
                        borderColor: 'rgba(59, 130, 246, 0.7)',
                        boxShadow: "0 4px 14px rgba(59, 130, 246, 0.2)"
                      }}
                      _focus={{ 
                        borderColor: '#3b82f6',
                        boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.25)",
                        outline: "none"
                      }}
                      _active={{
                        borderColor: '#2563eb',
                      }}
                      transition="all 0.2s ease"
                      iconColor="gray.700"
                      sx={{
                        '& option': {
                          backgroundColor: 'white',
                          color: '#111827',
                          padding: '14px',
                          fontSize: '15px',
                          fontWeight: '600',
                          lineHeight: '1.5',
                        },
                        '& option:hover': {
                          backgroundColor: '#f3f4f6',
                        },
                        '& option:checked': {
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          fontWeight: '700',
                        }
                      }}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat} {cat === 'All' ? `(${ALL_REMOVAL_ITEMS.length})` : `(${filterItemsByCategory(cat).length})`}
                        </option>
                      ))}
                    </Select>
                  </HStack>
                  
                  {/* ✅ NEW: Advanced Filters Panel */}
                  <Card bg="rgba(31, 41, 55, 0.5)" borderColor="rgba(59, 130, 246, 0.3)" borderWidth="1px" borderRadius="lg">
                    <CardBody p={4}>
                      <VStack spacing={4} align="stretch">
                        
                        {/* Subcategory + Sort Row */}
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                          {/* Subcategory Filter */}
                          <FormControl>
                            <FormLabel color="white" fontSize="sm" mb={2} fontWeight="600">🔍 Subcategory</FormLabel>
                            <Select
                              mb={3}
                              value={selectedSubcategory}
                              onChange={(e) => setSelectedSubcategory(e.target.value)}
                              bg="white"
                              borderColor="rgba(168, 85, 247, 0.4)"
                              color="gray.900"
                              size="md"
                              borderRadius="lg"
                              borderWidth="2px"
                              fontWeight="600"
                              cursor="pointer"
                              _hover={{
                                borderColor: "rgba(168, 85, 247, 0.7)",
                                boxShadow: "0 3px 10px rgba(168, 85, 247, 0.15)"
                              }}
                              _focus={{
                                borderColor: "#a855f7",
                                boxShadow: "0 0 0 3px rgba(168, 85, 247, 0.2)",
                                outline: "none",
                              }}
                              transition="all 0.2s ease"
                              iconColor="gray.700"
                              sx={{
                                '& option': {
                                  backgroundColor: 'white',
                                  color: '#111827',
                                  padding: '12px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  lineHeight: '1.5',
                                },
                                '& option:hover': {
                                  backgroundColor: '#f3f4f6',
                                },
                                '& option:checked': {
                                  backgroundColor: '#a855f7',
                                  color: 'white',
                                  fontWeight: '700',
                                }
                              }}
                            >
                              {subcategories.map((subcat) => (
                                <option key={subcat} value={subcat}>
                                  {subcat}
                                </option>
                              ))}
                            </Select>
                          </FormControl>
                          
                          {/* Sort By */}
                          <FormControl>
                            <FormLabel color="white" fontSize="sm" mb={2} fontWeight="600">📊 Sort By</FormLabel>
                            <Select
                              mb={3}
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value as any)}
                              bg="white"
                              borderColor="rgba(16, 185, 129, 0.4)"
                              color="gray.900"
                              size="md"
                              borderRadius="lg"
                              borderWidth="2px"
                              fontWeight="600"
                              cursor="pointer"
                              _hover={{
                                borderColor: "rgba(16, 185, 129, 0.7)",
                                boxShadow: "0 3px 10px rgba(16, 185, 129, 0.15)"
                              }}
                              _focus={{
                                borderColor: "#10b981",
                                boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)",
                                outline: "none",
                              }}
                              transition="all 0.2s ease"
                              iconColor="gray.700"
                              sx={{
                                '& option': {
                                  backgroundColor: 'white',
                                  color: '#111827',
                                  padding: '12px',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  lineHeight: '1.5',
                                },
                                '& option:hover': {
                                  backgroundColor: '#f3f4f6',
                                },
                                '& option:checked': {
                                  backgroundColor: '#10b981',
                                  color: 'white',
                                  fontWeight: '700',
                                }
                              }}
                            >
                              <option value="popular">⭐ Popular First</option>
                              <option value="weight-asc">⚖️ Lightest First</option>
                              <option value="weight-desc">💪 Heaviest First</option>
                              <option value="name-asc">🔤 A→Z</option>
                              <option value="name-desc">🔤 Z→A</option>
                            </Select>
                          </FormControl>
                        </SimpleGrid>
                        
                        {/* Weight Range Filter */}
                        <FormControl>
                          <FormLabel color="white" fontSize="sm" mb={2}>⚖️ Weight Range (kg)</FormLabel>
                          <HStack spacing={3}>
                            <NumberInput
                              value={minWeight || ''}
                              onChange={(_, val) => setMinWeight(isNaN(val) ? undefined : val)}
                              min={0}
                              max={maxWeight || 500}
                              size="sm"
                            >
                              <NumberInputField
                                placeholder="Min"
                                bg="rgba(17, 24, 39, 0.8)"
                                borderColor="rgba(59, 130, 246, 0.3)"
                                color="white"
                              />
                            </NumberInput>
                            <Text color="gray.400">to</Text>
                            <NumberInput
                              value={maxWeight || ''}
                              onChange={(_, val) => setMaxWeight(isNaN(val) ? undefined : val)}
                              min={minWeight || 0}
                              max={500}
                              size="sm"
                            >
                              <NumberInputField
                                placeholder="Max"
                                bg="rgba(17, 24, 39, 0.8)"
                                borderColor="rgba(59, 130, 246, 0.3)"
                                color="white"
                              />
                            </NumberInput>
                          </HStack>
                        </FormControl>
                        
                        {/* Reset Filters */}
                        {(minWeight || maxWeight || selectedSubcategory !== 'All' || sortBy !== 'popular') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            color="gray.400"
                            onClick={() => {
                              setSelectedSubcategory('All');
                              setSortBy('popular');
                              setMinWeight(undefined);
                              setMaxWeight(undefined);
                            }}
                            _hover={{ color: 'white', bg: 'rgba(59, 130, 246, 0.1)' }}
                          >
                            🔄 Reset Filters
                          </Button>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>

                  <Text fontSize="sm" color="gray.400">
                    Showing {displayedItems.length} items
                  </Text>
                  
                  {/* Items Grid - 2 Columns on Mobile */}
                  <SimpleGrid columns={[2, 2, 2, 4, 5]} spacing={{ base: 2, md: 3 }} w="full">
                    {displayedItems.slice(0, 100).map((item) => {
                      const quantity = getItemQuantity(item.id);
                      return (
                        <VStack key={item.id} spacing={2} align="center" w="full">
                          <Box 
                            w="100%" 
                            h={{ base: "120px", sm: "140px", md: "160px" }} 
                            borderRadius="lg" 
                            overflow="hidden" 
                            bg="rgba(17, 24, 39, 0.6)"
                            display="flex" 
                            alignItems="center" 
                            justifyContent="center"
                          >
                            <Image 
                              src={item.image} 
                              alt={item.name} 
                              w="100%" 
                              h="100%" 
                              objectFit="cover"
                              loading="lazy"
                            />
                          </Box>
                          <Text fontSize={{ base: "xs", sm: "sm", md: "md" }} color="white" fontWeight="medium" lineHeight="1.2" noOfLines={2} minH={{ base: "32px", md: "40px" }} textAlign="center">
                            {item.name}
                          </Text>
                          <Text fontSize={{ base: "2xs", sm: "xs" }} color="gray.400" textAlign="center">
                            {item.weight}kg
                          </Text>
                          {/* Plus/Minus Icons - Horizontal on All Screens */}
                          <Box
                            display="flex"
                            flexDirection="row"
                            justifyContent="center"
                            alignItems="center"
                            width="100%"
                            gap={{ base: "4px", sm: "8px" }}
                            sx={{
                              flexDirection: 'row',
                              gap: '8px',
                            }}
                          >
                            <Box
                              as="button"
                              cursor={quantity > 0 ? "pointer" : "not-allowed"}
                              opacity={quantity > 0 ? 1 : 0.3}
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (quantity > 0) {
                                  updateQuantity(item.id, quantity - 1, item);
                                }
                              }}
                              sx={{
                                cursor: quantity > 0 ? "pointer" : "not-allowed",
                                opacity: quantity > 0 ? 1 : 0.3,
                                background: "transparent",
                                border: "none",
                                padding: "0",
                                margin: "0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "transform 0.2s",
                                '&:hover': quantity > 0 ? {
                                  transform: "scale(1.2)",
                                } : {},
                              }}
                            >
                              <Icon as={FaMinus} fontSize={{ base: "lg", sm: "lg", md: "lg" }} color="white" />
                            </Box>
                            <Text 
                              fontSize={{ base: "xs", sm: "sm" }} 
                              color="white" 
                              fontWeight="bold"
                              textAlign="center"
                              sx={{
                                '@media (max-width: 767px)': {
                                  minWidth: 'auto',
                                  padding: '0',
                                },
                                '@media (min-width: 768px)': {
                                  minWidth: '24px',
                                  padding: '0 4px',
                                },
                              }}
                            >
                              {quantity}
                            </Text>
                            <Box
                              as="button"
                              cursor="pointer"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                updateQuantity(item.id, quantity + 1, item);
                              }}
                              sx={{
                                cursor: "pointer",
                                background: "transparent",
                                border: "none",
                                padding: "0",
                                margin: "0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "transform 0.2s",
                                '&:hover': {
                                  transform: "scale(1.2)",
                                },
                              }}
                            >
                              <Icon as={FaPlus} fontSize={{ base: "lg", sm: "lg", md: "lg" }} color="white" />
                            </Box>
                          </Box>
                        </VStack>
                      );
                    })}
                  </SimpleGrid>

                  {displayedItems.length > 100 && (
                    <Button
                      variant="outline"
                      color="white"
                      borderColor="rgba(16, 185, 129, 0.3)"
                      onClick={() => {
                        // Load more functionality can be added here
                        toast({
                          title: 'Showing 100 items',
                          description: `${displayedItems.length - 100} more items available. Use category filter to narrow down.`,
                          status: 'info',
                          duration: 3000,
                        });
                      }}
                    >
                      {displayedItems.length - 100} more items available - Filter by category
                    </Button>
                  )}
                </VStack>
              )}

            </VStack>
            </Collapse>
          </CardBody>
        </Card>

        {/* Selected Items summary rendered via responsive floating surfaces */}

        {/* Navigation Buttons */}
        <Card 
          bg="linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(26, 32, 44, 0.6) 100%)" 
          borderRadius="xl" 
          border="1px solid" 
          borderColor="rgba(255, 255, 255, 0.1)"
          backdropFilter="blur(10px)"
        >
          <CardBody p={6}>
            <VStack w="full" spacing={3}>
              {currentItems.length > 0 && (
                <Badge bg="green.600" color="white" p={3} borderRadius="lg" fontSize="md" w="full" textAlign="center">
                  ✅ {currentItems.length} Items Selected
                </Badge>
              )}

              {onNext && (
                <Button
                  rightIcon={<Icon as={FaArrowRight} />}
                  onClick={onNext}
                  isDisabled={currentItems.length === 0 || !step1.pickupDate || !step1.pickupTimeSlot}
                  bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  color="white"
                  size="lg"
                  w="full"
                  _hover={{
                    bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
                  }}
                  _disabled={{
                    opacity: 0.4,
                    cursor: 'not-allowed',
                    _hover: {
                      transform: 'none',
                      boxShadow: 'none',
                    },
                  }}
                  transition="all 0.3s"
                >
                  Next Step
                </Button>
              )}

              {onBack && (
                <Button
                  leftIcon={<Icon as={FaArrowLeft} />}
                  onClick={onBack}
                  variant="outline"
                  borderColor="rgba(255, 255, 255, 0.2)"
                  color="white"
                  size="lg"
                  w="full"
                  _hover={{
                    bg: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  }}
                >
                  Back
                </Button>
              )}
            </VStack>
          </CardBody>
        </Card>

      </VStack>
      {currentItems.length > 0 && (
        <>
          {!isSelectedItemsPanelOpen && (
            <Portal>
              <Box
                position="fixed"
                bottom={{ base: '96px', md: '40px' }}
                right={{ base: '20px', md: '40px' }}
                zIndex={1500}
                pointerEvents="none"
                sx={{
                  contain: 'layout style paint',
                  willChange: 'transform',
                }}
              >
                <Button
                  aria-label="View selected items"
                  onClick={onSelectedItemsPanelOpen}
                  bg="linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)"
                  color="white"
                  borderRadius="full"
                  h={{ base: '62px', md: '70px' }}
                  px={{ base: 5, md: 6 }}
                  boxShadow="0 16px 32px rgba(244, 63, 94, 0.35)"
                  _hover={{ transform: 'translateY(-3px)', boxShadow: '0 18px 36px rgba(244, 63, 94, 0.45)' }}
                  _active={{ transform: 'translateY(-1px)' }}
                  fontWeight="800"
                  pointerEvents="auto"
                  transition="all 0.25s ease"
                  minW={{ base: '220px', md: '260px' }}
                >
                  <HStack spacing={{ base: 3, md: 4 }} align="center" justify="center" w="full">
                    <Circle size={{ base: '40px', md: '44px' }} bg="rgba(255,255,255,0.15)">
                      <Icon as={FaBoxOpen} color="white" boxSize={{ base: 5, md: 5 }} />
                    </Circle>
                    <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="800">
                      Selected Items ({currentItems.length})
                    </Text>
                  </HStack>
                </Button>
              </Box>
            </Portal>
          )}

          <Drawer
            placement="bottom"
            isOpen={isSelectedItemsPanelOpen}
            onClose={onSelectedItemsPanelClose}
          >
            <DrawerOverlay bg="rgba(15, 23, 42, 0.75)" backdropFilter="blur(10px)" />
            <DrawerContent
              borderTopRadius="2xl"
              bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
              border="1px solid rgba(16, 185, 129, 0.4)"
              maxH="85vh"
              pb={4}
              mx="auto"
              w="calc(100% - 32px)"
              maxW="720px"
              boxShadow="0 -12px 40px rgba(16, 185, 129, 0.25)"
            >
              <DrawerCloseButton color="white" _focus={{ boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.4)' }} />
              <DrawerHeader
                borderBottomWidth="1px"
                borderColor="rgba(255, 255, 255, 0.08)"
                color="white"
                fontWeight="900"
              >
                ✅ Selected Items ({currentItems.length})
              </DrawerHeader>
              <DrawerBody px={{ base: 4, md: 6 }} pt={4} pb={0}>
                {renderSelectedItemsContent({ includeHeading: false })}
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </>
      )}
      
      {/* Specialized Items Wizard */}
      {activeWizardItemId && (
        <SpecializedItemWizard
          isOpen={!!activeWizardItemId}
          onClose={closeWizard}
          bookingItemId={activeWizardItemId}
          itemName={currentItems.find(i => i.id === activeWizardItemId)?.name || ''}
          onComplete={(data) => {
            saveSpecializedItem(activeWizardItemId, data);
            closeWizard();
          }}
          preselectedCategory={
            activeWizardItemId
              ? detectCategory(currentItems.find(i => i.id === activeWizardItemId)?.name || '') || undefined
              : undefined
          }
        />
      )}
    </Container>
  );
}