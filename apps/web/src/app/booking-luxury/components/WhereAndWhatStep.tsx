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
  Collapse,
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
} from 'react-icons/fa';
import { MdElevator, MdKitchen, MdLocalLaundryService, MdTv } from 'react-icons/md';

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
}: WhereAndWhatStepProps) {
  
  // State for item selection mode
  const [itemSelectionMode, setItemSelectionMode] = useState<'smart' | 'choose' | 'packages'>('choose');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Bedroom');
  
  // ✅ NEW: Advanced filtering and sorting
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'weight-asc' | 'weight-desc' | 'name-asc' | 'name-desc'>('popular');
  const [minWeight, setMinWeight] = useState<number | undefined>(undefined);
  const [maxWeight, setMaxWeight] = useState<number | undefined>(undefined);
  const [showPopularFirst, setShowPopularFirst] = useState(true);
  
  const { step1 } = formData;
  const toast = useToast();
  const {
    isOpen: isMobileCartOpen,
    onOpen: onMobileCartOpen,
    onClose: onMobileCartClose,
  } = useDisclosure();

  useEffect(() => {
    if (step1.items.length === 0 && isMobileCartOpen) {
      onMobileCartClose();
    }
  }, [step1.items.length, isMobileCartOpen, onMobileCartClose]);

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

  // Handlers
  const addItem = (item: any) => {
    const currentItems = step1.items || [];
    const existingItem = currentItems.find((i: any) => i.id === item.id);
    if (existingItem) {
      const updatedItems = currentItems.map((i: any) => 
        i.id === item.id ? { ...i, quantity: (i.quantity || 0) + 1 } : i
      );
      // Force update by creating a new array reference
      updateFormData('step1', {
        items: [...updatedItems]
      });
    } else {
      const newItem = { ...item, quantity: 1 };
      updateFormData('step1', {
        items: [...currentItems, newItem]
      });
    }
  };

  const removeItem = (itemId: any) => {
    const currentItems = step1.items || [];
    const filteredItems = currentItems.filter((i: any) => i.id !== itemId);
    // Force update by creating a new array reference
    updateFormData('step1', {
      items: [...filteredItems]
    });
  };

  const updateQuantity = (itemId: any, quantity: number, item?: any) => {
    if (quantity === 0) {
      removeItem(itemId);
    } else {
      const currentItems = step1.items || [];
      const existingItem = currentItems.find((i: any) => i.id === itemId);
      
      if (existingItem) {
        // Update existing item - create new array to ensure change detection
        const updatedItems = currentItems.map((i: any) =>
          i.id === itemId ? { ...i, quantity } : i
        );
        // Force update by creating a new array reference
        updateFormData('step1', {
          items: [...updatedItems]
        });
      } else if (item) {
        // Add new item if it doesn't exist
        const newItem = { ...item, quantity };
        updateFormData('step1', {
          items: [...currentItems, newItem]
        });
      } else {
        // Fallback: try to find item from displayed items
        console.warn(`Item ${itemId} not found in current items and no item provided`);
        // Don't add item without proper data - log warning only
      }
    }
  };

  const getItemQuantity = (itemId: any) => {
    const item = step1.items.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  };

  const renderSelectedItemsContent = (options?: { includeHeading?: boolean }) => {
    if (step1.items.length === 0) {
      return null;
    }

    const includeHeading = options?.includeHeading ?? true;

    return (
      <VStack spacing={4}>
        {includeHeading && (
          <Heading size={{ base: "sm", md: "md" }} color="white">
            ✅ Selected Items ({step1.items.length})
          </Heading>
        )}

        <VStack
          spacing={3}
          w="full"
          className="selected-items-cart"
          style={{ display: 'flex', flexDirection: 'column' } as React.CSSProperties}
        >
          {step1.items.map((item) => (
            <HStack
              key={item.id}
              justify="space-between"
              w="full"
              p={3}
              bg="linear-gradient(135deg, rgba(31, 41, 55, 0.6) 0%, rgba(26, 32, 44, 0.4) 100%)"
              borderRadius="lg"
              border="1px solid"
              borderColor="rgba(16, 185, 129, 0.2)"
              flexWrap="nowrap"
              spacing={3}
              className="selected-item-card"
              style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap' } as React.CSSProperties}
            >
              <HStack
                spacing={3}
                flex={1}
                minW={0}
                overflow="hidden"
                className="selected-item-content"
                style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap' } as React.CSSProperties}
              >
                {item.image && (
                  <Box
                    w={{ base: "40px", md: "50px" }}
                    h={{ base: "40px", md: "50px" }}
                    borderRadius="md"
                    overflow="hidden"
                    bg="rgba(17, 24, 39, 0.6)"
                    flexShrink={0}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                  </Box>
                )}
                <VStack
                  align="start"
                  spacing={0}
                  flex={1}
                  minW={0}
                  overflow="hidden"
                  maxW="100%"
                  className="selected-item-text"
                  style={{ display: 'flex', flexDirection: 'column', flexWrap: 'nowrap' } as React.CSSProperties}
                >
                  <Box
                    as="span"
                    color="white"
                    fontWeight="medium"
                    fontSize={{ base: "sm", md: "md" }}
                    width="100%"
                    className="selected-item-name"
                    style={{
                      whiteSpace: 'normal',
                      wordBreak: 'break-word',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block',
                      lineHeight: '1.4',
                      maxHeight: '2.8em',
                      writingMode: 'horizontal-tb',
                      textOrientation: 'mixed',
                      direction: 'ltr',
                      unicodeBidi: 'normal',
                    } as React.CSSProperties}
                    sx={{
                      whiteSpace: 'normal !important',
                      wordBreak: 'break-word !important',
                      wordWrap: 'break-word !important',
                      overflowWrap: 'break-word !important',
                      overflow: 'hidden !important',
                      textOverflow: 'ellipsis !important',
                      display: 'block !important',
                      lineHeight: '1.4 !important',
                      maxHeight: '2.8em !important',
                      writingMode: 'horizontal-tb !important',
                      textOrientation: 'mixed !important',
                      direction: 'ltr !important',
                      unicodeBidi: 'normal !important',
                    }}
                  >
                    {item.name}
                  </Box>
                  {item.weight && (
                    <Text
                      fontSize="xs"
                      color="gray.400"
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      className="selected-item-weight"
                      sx={{
                        whiteSpace: 'nowrap !important',
                        overflow: 'hidden !important',
                        textOverflow: 'ellipsis !important',
                      }}
                    >
                      {item.weight}kg
                    </Text>
                  )}
                </VStack>
              </HStack>

              <HStack spacing={2}>
                <IconButton
                  size="sm"
                  icon={<FaMinus />}
                  onClick={() => updateQuantity(item.id, item.quantity - 1, item)}
                  bg="rgba(107, 114, 128, 0.5)"
                  color="white"
                  border="1px solid"
                  borderColor="rgba(107, 114, 128, 0.3)"
                  _hover={{ bg: "rgba(107, 114, 128, 0.7)" }}
                  aria-label="Decrease quantity"
                />
                <Text color="white" fontWeight="bold" minW="30px" textAlign="center" fontSize={{ base: "sm", md: "md" }}>
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
                />
                <IconButton
                  size="sm"
                  icon={<FaTrash />}
                  onClick={() => removeItem(item.id)}
                  bg="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                  color="white"
                  _hover={{ bg: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)" }}
                  aria-label="Remove item"
                />
              </HStack>
            </HStack>
          ))}
        </VStack>

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
        pb={{ base: step1.items.length > 0 ? 140 : 0, lg: 0 }}
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

        {/* Date & Time Selection */}
        <Card 
          bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
          backdropFilter="blur(20px)"
          borderRadius="xl"
          border="2px solid"
          borderColor="rgba(168, 85, 247, 0.4)"
          boxShadow="0 8px 32px rgba(168, 85, 247, 0.3)"
        >
          <CardBody p={{ base: 4, md: 6 }}>
            <VStack spacing={{ base: 4, md: 6 }} align="stretch">
              
              {/* Header */}
              <VStack spacing={2} textAlign="center">
                <Heading size={{ base: "md", md: "lg" }} color="white">
                  📅 When do you need the move?
                </Heading>
                <Text color="gray.300" fontSize={{ base: "sm", md: "md" }}>
                  Select your preferred date and time
                </Text>
              </VStack>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 3, md: 4 }}>
                {/* Date */}
                <FormControl isInvalid={!!errors['step1.pickupDate']}>
                  <FormLabel color="white" fontSize={{ base: "sm", md: "md" }}>📅 Select Date</FormLabel>
                  <Input
                    type="date"
                    value={step1.pickupDate || ''}
                    onChange={(e) => updateFormData('step1', { pickupDate: e.target.value })}
                    min={(() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      return tomorrow.toISOString().split('T')[0];
                    })()}
                    bg="rgba(26, 26, 26, 0.8)"
                    borderColor="rgba(59, 130, 246, 0.3)"
                    color="white"
                    size="lg"
                    borderRadius="xl"
                    borderWidth="1px"
                    fontWeight="500"
                    _hover={{
                      borderColor: "rgba(59, 130, 246, 0.5)",
                      bg: "rgba(26, 26, 26, 0.9)",
                    }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.3)",
                      bg: "rgba(26, 26, 26, 0.95)",
                    }}
                    sx={{
                      colorScheme: 'dark',
                      '&::-webkit-calendar-picker-indicator': {
                        filter: 'invert(1)',
                        cursor: 'pointer',
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
                  {errors['step1.pickupDate'] && (
                    <FormErrorMessage>{errors['step1.pickupDate']}</FormErrorMessage>
                  )}
                </FormControl>

                {/* Time */}
                <FormControl isInvalid={!!errors['step1.pickupTime']}>
                  <FormLabel color="white" fontSize={{ base: "sm", md: "md" }}>⏰ Select Time</FormLabel>
                  <Select
                    mb={4}
                    value={step1.pickupTimeSlot || ''}
                    onChange={(e) => updateFormData('step1', { pickupTimeSlot: e.target.value })}
                    bg="white"
                    borderColor="rgba(59, 130, 246, 0.4)"
                    color="gray.900"
                    size="lg"
                    borderRadius="xl"
                    borderWidth="2px"
                    fontWeight="600"
                    cursor="pointer"
                    placeholder="Choose a time"
                    _placeholder={{
                      color: 'gray.500',
                      fontWeight: '500',
                    }}
                    _hover={{
                      borderColor: "rgba(59, 130, 246, 0.7)",
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)"
                    }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.25)",
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
                        backgroundColor: '#3b82f6',
                        color: 'white',
                      },
                    }}
                  >
                    <option value="08:00-12:00">8 AM - 12 PM 🌅</option>
                    <option value="12:00-16:00">12 PM - 4 PM ☀️</option>
                    <option value="16:00-18:00">4 PM - 6 PM 🌆</option>
                    <option value="flexible">Flexible ⏰</option>
                  </Select>
                  {errors['step1.pickupTime'] && (
                    <FormErrorMessage>{errors['step1.pickupTime']}</FormErrorMessage>
                  )}
                </FormControl>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Item Selection */}
        <Card 
          bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
          backdropFilter="blur(20px)"
          borderRadius="xl"
          border="2px solid"
          borderColor="rgba(59, 130, 246, 0.4)"
          boxShadow="0 8px 32px rgba(59, 130, 246, 0.3)"
        >
          <CardBody p={{ base: 4, md: 6 }}>
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

                  {displayedItems.length > 50 && (
                    <Text fontSize="sm" color="gray.500" textAlign="center">
                      Showing first 50 results. Refine your search for more specific items.
                    </Text>
                  )}
                </VStack>
              )}

              {/* Individual Items Mode - All 666 Items with Category Filter */}
              {itemSelectionMode === 'choose' && (
                <VStack spacing={4} w="full">
                  
                  {/* Category Filter */}
                  <HStack spacing={3} w="full" justify="space-between" flexWrap="wrap">
                    <Text fontSize={{ base: "md", md: "lg" }} color="white" fontWeight="semibold">
                      Browse by Category
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
              {step1.items.length > 0 && (
                <Badge bg="green.600" color="white" p={3} borderRadius="lg" fontSize="md" w="full" textAlign="center">
                  ✅ {step1.items.length} Items Selected
                </Badge>
              )}

              {onNext && (
                <Button
                  rightIcon={<Icon as={FaArrowRight} />}
                  onClick={onNext}
                  isDisabled={step1.items.length === 0 || !step1.pickupDate || !step1.pickupTimeSlot}
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
      {step1.items.length > 0 && (
        <Portal>
          <Box
            display={{ base: 'none', lg: 'block' }}
            position="fixed"
            top="120px"
            right={{ base: '16px', xl: '40px' }}
            w="340px"
            maxW="420px"
            zIndex={1400}
          >
            <Card
              bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
              backdropFilter="blur(20px)"
              borderRadius="xl"
              border="2px solid"
              borderColor="rgba(16, 185, 129, 0.4)"
              boxShadow="0 12px 32px rgba(16, 185, 129, 0.25)"
              maxH="calc(100vh - 160px)"
              overflowY="auto"
            >
              <CardBody p={{ base: 4, md: 6 }}>
                {renderSelectedItemsContent({ includeHeading: true })}
              </CardBody>
            </Card>
          </Box>
        </Portal>
      )}

      {step1.items.length > 0 && (
        <>
          <Portal>
            <Box 
              display={{ base: 'block', lg: 'none' }}
              position="fixed" 
              bottom="104px" 
              right="24px" 
              zIndex={1500}
            >
              <Button
                onClick={onMobileCartOpen}
                bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                color="white"
                borderRadius="full"
                px={5}
                py={6}
                boxShadow="0 12px 28px rgba(16, 185, 129, 0.4)"
                _hover={{ bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
                _active={{ bg: 'linear-gradient(135deg, #047857 0%, #03634f 100%)' }}
              >
                View Selected ({step1.items.length})
              </Button>
            </Box>
          </Portal>

          <Drawer placement="bottom" isOpen={isMobileCartOpen} onClose={onMobileCartClose}>
            <DrawerOverlay bg="rgba(15, 23, 42, 0.75)" backdropFilter="blur(6px)" />
            <DrawerContent
              borderTopRadius="2xl"
              bg="linear-gradient(135deg, rgba(31, 41, 55, 0.98) 0%, rgba(26, 32, 44, 0.95) 100%)"
              border="1px solid rgba(16, 185, 129, 0.4)"
              maxH="80vh"
              pb={4}
            >
              <DrawerCloseButton color="white" />
              <DrawerHeader borderBottomWidth="1px" borderColor="rgba(255, 255, 255, 0.08)" color="white">
                ✅ Selected Items ({step1.items.length})
              </DrawerHeader>
              <DrawerBody px={{ base: 4, md: 6 }} pt={4} pb={0}>
                {renderSelectedItemsContent({ includeHeading: false })}
              </DrawerBody>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </Container>
  );
}