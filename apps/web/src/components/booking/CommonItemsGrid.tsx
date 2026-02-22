'use client';

import { 
  SimpleGrid, 
  Box, 
  Text, 
  useColorModeValue, 
  Button,
  VStack,
  HStack,
  Icon,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Badge,
  Flex,
  Image,
} from '@chakra-ui/react';
import { 
  FaPlus, 
  FaMinus, 
  FaChevronRight,
  FaCouch,
  FaBox,
  FaBed,
  FaTv,
  FaTshirt,
  FaChair,
  FaWheelchair,
  FaBlender,
  FaPaintBrush,
  FaBookOpen,
  FaPencilAlt,
  FaTable,
  FaDoorOpen,
} from 'react-icons/fa';
import { useState, useMemo } from 'react';
import { POPULAR_CATEGORIES } from '@/lib/popular-items-data';
import { ALL_REMOVAL_ITEMS } from '@/lib/uk-removal-items-data';

// Map category IDs to icons for better visual representation
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'sofas': FaCouch,
  'wardrobes': FaDoorOpen,
  'boxes': FaBox,
  'beds': FaBed,
  'tables': FaTable,
  'televisions': FaTv,
  'clothing': FaTshirt,
  'chairs': FaChair,
  'power-chairs': FaWheelchair,
  'appliances': FaBlender,
  'decorations': FaPaintBrush,
  'books': FaBookOpen,
  'custom': FaPencilAlt,
};

// Category color schemes for visual distinction
const CATEGORY_COLORS: Record<string, { bg: string; border: string; iconColor: string; hoverBg: string }> = {
  'sofas': { bg: 'purple.50', border: 'purple.200', iconColor: 'purple.500', hoverBg: 'purple.100' },
  'wardrobes': { bg: 'blue.50', border: 'blue.200', iconColor: 'blue.500', hoverBg: 'blue.100' },
  'boxes': { bg: 'orange.50', border: 'orange.200', iconColor: 'orange.500', hoverBg: 'orange.100' },
  'beds': { bg: 'teal.50', border: 'teal.200', iconColor: 'teal.500', hoverBg: 'teal.100' },
  'tables': { bg: 'yellow.50', border: 'yellow.200', iconColor: 'yellow.600', hoverBg: 'yellow.100' },
  'televisions': { bg: 'cyan.50', border: 'cyan.200', iconColor: 'cyan.600', hoverBg: 'cyan.100' },
  'clothing': { bg: 'pink.50', border: 'pink.200', iconColor: 'pink.500', hoverBg: 'pink.100' },
  'chairs': { bg: 'green.50', border: 'green.200', iconColor: 'green.500', hoverBg: 'green.100' },
  'power-chairs': { bg: 'red.50', border: 'red.200', iconColor: 'red.500', hoverBg: 'red.100' },
  'appliances': { bg: 'gray.50', border: 'gray.300', iconColor: 'gray.600', hoverBg: 'gray.100' },
  'decorations': { bg: 'rose.50', border: 'rose.200', iconColor: 'rose.500', hoverBg: 'rose.100' },
  'books': { bg: 'amber.50', border: 'amber.200', iconColor: 'amber.600', hoverBg: 'amber.100' },
  'custom': { bg: 'indigo.50', border: 'indigo.200', iconColor: 'indigo.500', hoverBg: 'indigo.100' },
};

interface CommonItemsGridProps {
  onAddItem?: (item: { id: string; name: string; category: string; weight: number }, quantity: number) => void;
  selectedItems?: { id: string; name: string; quantity: number }[];
}

export const CommonItemsGrid = ({ onAddItem, selectedItems = [] }: CommonItemsGridProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const cardBg = useColorModeValue('white', 'gray.800');
  const isDark = useColorModeValue(false, true);

  // Count total items selected per category
  const getCategorySelectedCount = (categoryId: string): number => {
    const category = POPULAR_CATEGORIES.find(cat => cat.id === categoryId);
    if (!category) return 0;
    
    return category.items.reduce((total, itemId) => {
      const selectedItem = selectedItems.find(i => i.id === itemId);
      return total + (selectedItem?.quantity || 0);
    }, 0);
  };

  // Get quantity for an item
  const getItemQuantity = (itemId: string): number => {
    const item = selectedItems.find(i => i.id === itemId);
    return item?.quantity || 0;
  };

  const handleCategoryClick = (categoryId: string) => {
    if (categoryId === 'custom') {
      // TODO: Open custom item dialog
      alert('Custom item functionality coming soon!');
      return;
    }
    
    setSelectedCategory(categoryId);
    onOpen();
  };

  const handleAddItem = (itemId: string) => {
    const item = ALL_REMOVAL_ITEMS.find(i => i.id === itemId);
    if (item && onAddItem) {
      const currentQty = getItemQuantity(itemId);
      onAddItem({
        id: item.id,
        name: item.name,
        category: item.category,
        weight: item.weight
      }, currentQty + 1);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    const item = ALL_REMOVAL_ITEMS.find(i => i.id === itemId);
    if (item && onAddItem) {
      const currentQty = getItemQuantity(itemId);
      if (currentQty > 0) {
        onAddItem({
          id: item.id,
          name: item.name,
          category: item.category,
          weight: item.weight
        }, currentQty - 1);
      }
    }
  };

  const getCategoryItems = () => {
    if (!selectedCategory) return [];
    
    const category = POPULAR_CATEGORIES.find(cat => cat.id === selectedCategory);
    if (!category) return [];
    
    return category.items
      .map(itemId => ALL_REMOVAL_ITEMS.find(item => item.id === itemId))
      .filter(Boolean);
  };

  // Format item name to be more readable
  const formatItemName = (name: string): string => {
    // Remove file extensions and common suffixes
    let formatted = name
      .replace(/\.jpg$/i, '')
      .replace(/\.png$/i, '')
      .replace(/_jpg$/i, '')
      .replace(/_png$/i, '');
    
    // Split by underscores and capitalize
    const words = formatted.split(/[_\s]+/);
    formatted = words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    // Remove weight info at the end (e.g., "55kg", "Jpg")
    formatted = formatted.replace(/\s+\d+kg$/i, '').replace(/\s+Jpg$/i, '');
    
    return formatted;
  };

  return (
    <>
      {/* Category Cards Grid - Mobile-First Responsive Grid */}
      <Box
        as="div"
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '8px',
          width: '100%',
          '@media (min-width: 480px)': {
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: '12px',
          },
          '@media (min-width: 768px)': {
            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          },
        }}
      >
        {POPULAR_CATEGORIES.map((category) => {
          const CategoryIcon = CATEGORY_ICONS[category.id] || FaBox;
          const colors = CATEGORY_COLORS[category.id] || CATEGORY_COLORS['boxes'];
          const selectedCount = getCategorySelectedCount(category.id);
          
          return (
            <Box
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              position="relative"
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              p={2}
              borderRadius="lg"
              border="2px solid"
              borderColor={selectedCount > 0 ? 'green.400' : isDark ? 'gray.600' : colors.border}
              bg={selectedCount > 0 ? 'green.50' : isDark ? 'gray.800' : colors.bg}
              cursor="pointer"
              transition="all 0.2s ease-in-out"
              minH="80px"
              maxW="100%"
              overflow="hidden"
              boxShadow={selectedCount > 0 ? 'md' : 'sm'}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
                borderColor: selectedCount > 0 ? 'green.500' : 'purple.400',
                bg: selectedCount > 0 ? 'green.100' : isDark ? 'gray.700' : colors.hoverBg,
              }}
              _active={{
                transform: 'translateY(0)',
              }}
            >
              {/* Selected Badge */}
              {selectedCount > 0 && (
                <Badge
                  position="absolute"
                  top="-4px"
                  right="-4px"
                  colorScheme="green"
                  borderRadius="full"
                  fontSize="9px"
                  fontWeight="bold"
                  minW="18px"
                  h="18px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="sm"
                >
                  {selectedCount}
                </Badge>
              )}
              
              {/* Icon */}
              <Flex
                w="32px"
                h="32px"
                borderRadius="md"
                bg={selectedCount > 0 ? 'green.100' : isDark ? 'gray.700' : 'white'}
                align="center"
                justify="center"
                mb={1}
                boxShadow="sm"
                flexShrink={0}
              >
                <Icon
                  as={CategoryIcon}
                  boxSize={4}
                  color={selectedCount > 0 ? 'green.600' : isDark ? 'gray.300' : colors.iconColor}
                />
              </Flex>
              
              {/* Category Name */}
              <Text
                fontWeight="semibold"
                fontSize="10px"
                color={selectedCount > 0 ? 'green.700' : isDark ? 'gray.200' : textColor}
                lineHeight="1.2"
                noOfLines={2}
                textAlign="center"
                w="100%"
                sx={{
                  writingMode: 'horizontal-tb',
                  textOrientation: 'mixed',
                  wordBreak: 'keep-all',
                  whiteSpace: 'normal',
                }}
              >
                {category.name}
              </Text>
              
              {/* Chevron indicator - hidden on mobile for space */}
              <Icon 
                as={FaChevronRight} 
                boxSize={2} 
                color={selectedCount > 0 ? 'green.400' : 'gray.400'} 
                mt={0.5}
                display={{ base: 'none', sm: 'block' }}
              />
            </Box>
          );
        })}
      </Box>

      {/* Category Items Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay />
        <ModalContent maxW={{ base: '95%', md: 'xl' }}>
          <ModalHeader>
            {POPULAR_CATEGORIES.find(cat => cat.id === selectedCategory)?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} px={2}>
            <VStack spacing={1} align="stretch">
              {getCategoryItems().map((item: any) => {
                const quantity = getItemQuantity(item.id);
                
                return (
                  <HStack
                    key={item.id}
                    p={2}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={quantity > 0 ? 'green.300' : borderColor}
                    bg={quantity > 0 ? 'green.50' : cardBg}
                    justify="space-between"
                    transition="all 0.2s"
                    spacing={3}
                    align="center"
                    minW={0}
                    _hover={{
                      bg: quantity > 0 ? 'green.100' : hoverBg,
                      borderColor: quantity > 0 ? 'green.400' : 'purple.300'
                    }}
                  >
                    {/* Item image so customer can easily recognise the item */}
                    <Box flexShrink={0} w="48px" h="48px" borderRadius="md" overflow="hidden" bg={isDark ? 'gray.700' : 'gray.100'}>
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt=""
                          w="full"
                          h="full"
                          objectFit="cover"
                          fallback={<Flex w="full" h="full" align="center" justify="center"><Icon as={FaBox} color="gray.400" boxSize={5} /></Flex>}
                        />
                      ) : (
                        <Flex w="full" h="full" align="center" justify="center">
                          <Icon as={FaBox} color="gray.400" boxSize={5} />
                        </Flex>
                      )}
                    </Box>
                    <Text 
                      fontSize="sm" 
                      fontWeight="medium" 
                      color={textColor} 
                      flex="1 1 auto"
                      minW="0"
                      whiteSpace="normal"
                      wordBreak="normal"
                      overflowWrap="normal"
                      lineHeight="1.4"
                    >
                      {formatItemName(item.name)}
                    </Text>
                    <HStack spacing={1} flexShrink={0}>
                      {quantity > 0 && (
                        <>
                          <IconButton
                            aria-label="Decrease quantity"
                            icon={<Icon as={FaMinus} boxSize={3} />}
                            onClick={() => handleRemoveItem(item.id)}
                            size="sm"
                            variant="solid"
                            colorScheme="red"
                            minW="32px"
                            h="32px"
                            borderRadius="md"
                          />
                          <Text 
                            fontSize="md" 
                            fontWeight="bold" 
                            color="green.600"
                            minW="24px"
                            textAlign="center"
                          >
                            {quantity}
                          </Text>
                        </>
                      )}
                      <IconButton
                        aria-label="Increase quantity"
                        icon={<Icon as={FaPlus} boxSize={3} />}
                        onClick={() => handleAddItem(item.id)}
                        size="sm"
                        variant="solid"
                        colorScheme="green"
                        minW="32px"
                        h="32px"
                        borderRadius="md"
                      />
                    </HStack>
                  </HStack>
                );
              })}
              {getCategoryItems().length === 0 && (
                <Text fontSize="sm" color="gray.500" textAlign="center" py={4}>
                  No items available in this category
                </Text>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
