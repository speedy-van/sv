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
} from '@chakra-ui/react';
import { FaPlus, FaMinus, FaChevronRight } from 'react-icons/fa';
import { useState, useMemo } from 'react';
import { POPULAR_CATEGORIES } from '@/lib/popular-items-data';
import { ALL_REMOVAL_ITEMS } from '@/lib/uk-removal-items-data';

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
      {/* Category Cards Grid - Pure CSS Grid to avoid Chakra conflicts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.5rem',
          width: '100%',
        }}
        className="common-items-grid-container"
      >
        {POPULAR_CATEGORIES.map((category) => (
          <div
            key={category.id}
            className="category-card-pure-html"
            onClick={() => handleCategoryClick(category.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              border: '2px solid',
              borderColor: borderColor,
              backgroundColor: cardBg,
              cursor: 'pointer',
              transition: 'all 0.2s',
              minHeight: '120px',
              minWidth: '0',
              overflow: 'hidden',
            }}
          >
            {category.imagePath ? (
              <img 
                src={category.imagePath} 
                alt={category.name}
                style={{ 
                  width: '48px', 
                  height: '48px', 
                  objectFit: 'contain',
                  marginBottom: '0.5rem'
                }}
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fallback = document.createElement('div');
                  fallback.style.fontSize = '2rem';
                  fallback.style.marginBottom = '0.5rem';
                  fallback.textContent = category.icon;
                  (e.target as HTMLImageElement).parentElement?.insertBefore(fallback, e.target as HTMLImageElement);
                }}
              />
            ) : (
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{category.icon}</div>
            )}
            <div
              className="category-name-pure-text"
              style={{
                fontWeight: 'bold',
                fontSize: '0.75rem',
                color: textColor,
                textAlign: 'center',
                width: '100%',
                minWidth: '60px',
                writingMode: 'horizontal-tb',
                WebkitWritingMode: 'horizontal-tb',
                textOrientation: 'mixed',
                WebkitTextOrientation: 'mixed',
                whiteSpace: 'normal',
                wordBreak: 'normal',
                overflowWrap: 'normal',
                lineHeight: '1.4',
                direction: 'ltr',
                hyphens: 'none',
                WebkitHyphens: 'none',
              }}
            >
              {category.name}
            </div>
            {category.id !== 'custom' && (
              <Icon as={FaChevronRight} boxSize={3} color="gray.400" mt={1} />
            )}
          </div>
        ))}
      </div>

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
                    spacing={2}
                    align="center"
                    minW={0}
                    _hover={{
                      bg: quantity > 0 ? 'green.100' : hoverBg,
                      borderColor: quantity > 0 ? 'green.400' : 'purple.300'
                    }}
                  >
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
