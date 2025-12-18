'use client';

import { SimpleGrid, Box, Image, Text, useColorModeValue, IconButton, HStack, Badge } from '@chakra-ui/react';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { useState } from 'react';

const items = [
  { id: 'sofa_3_seat', name: 'Sofa', src: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/sofa_3_seat_fabric_modern_lestar_jpg_48kg.jpg', category: 'Living Room Furniture', weight: 48 },
  { id: 'double_bed', name: 'Double Bed', src: '/UK_Removal_Dataset/Images_Only/Bedroom/double_bed_frame_florence_luxury_jpg_35kg.jpg', category: 'Bedroom', weight: 35 },
  { id: 'wardrobe_double', name: 'Wardrobe', src: '/UK_Removal_Dataset/Images_Only/Wardrobes_closet/wardrobe_double_door_harmony_wood_better_home_jpg_68kg.jpg', category: 'Wardrobes/Closet', weight: 68 },
  { id: 'dining_table', name: 'Dining Table', src: '/UK_Removal_Dataset/Images_Only/Dining_Room_Furniture/dining_table_solid_wood_extendable_jpg_95kg.jpg', category: 'Dining Room Furniture', weight: 95 },
  { id: 'moving_boxes', name: 'Boxes', src: '/UK_Removal_Dataset/Images_Only/Bag_luggage_box/moving_boxes_uboxes_with_handles_10_premium_jpg_15kg.jpg', category: 'Bag/Luggage/Box', weight: 15 },
  { id: 'armchair', name: 'Armchair', src: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/armchair_1_seat_accent_chair_jpg_25kg.jpg', category: 'Living Room Furniture', weight: 25 },
];

interface CommonItemsGridProps {
  onAddItem?: (item: { id: string; name: string; category: string; weight: number }, quantity: number) => void;
}

export const CommonItemsGrid = ({ onAddItem }: CommonItemsGridProps) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');

  const handleAdd = (item: typeof items[0]) => {
    const currentQty = quantities[item.id] || 0;
    const newQty = currentQty + 1;
    setQuantities({ ...quantities, [item.id]: newQty });
    
    if (onAddItem) {
      onAddItem({ id: item.id, name: item.name, category: item.category, weight: item.weight }, 1);
    }
  };

  const handleRemove = (item: typeof items[0]) => {
    const currentQty = quantities[item.id] || 0;
    if (currentQty > 0) {
      const newQty = currentQty - 1;
      setQuantities({ ...quantities, [item.id]: newQty });
      
      if (onAddItem) {
        onAddItem({ id: item.id, name: item.name, category: item.category, weight: item.weight }, -1);
      }
    }
  };

  return (
    <SimpleGrid 
      columns={[2, 2, 3, 6]} 
      spacing={{ base: 3, md: 4 }}
      sx={{
        '@media (max-width: 767px)': {
          gridTemplateColumns: 'repeat(2, 1fr) !important',
        }
      }}
    >
      {items.map((item) => {
        const quantity = quantities[item.id] || 0;
        return (
          <Box
            key={item.id}
            textAlign="center"
            p={{ base: 2, md: 3 }}
            borderRadius="md"
            border="2px solid"
            borderColor={quantity > 0 ? 'purple.500' : borderColor}
            bg={quantity > 0 ? 'purple.50' : 'transparent'}
            transition="all 0.2s"
            position="relative"
          >
            {quantity > 0 && (
              <Badge
                position="absolute"
                top={1}
                right={1}
                colorScheme="purple"
                borderRadius="full"
                px={2}
                fontSize="xs"
                zIndex={1}
              >
                {quantity}
              </Badge>
            )}
            
            <Image
              src={item.src}
              alt={item.name}
              borderRadius="md"
              w="100%"
              h={{ base: '80px', sm: '100px', md: '120px' }}
              objectFit="cover"
              fallbackSrc="https://via.placeholder.com/150?text=Item"
            />
            
            <Text mt={{ base: 1, md: 2 }} mb={{ base: 1, md: 2 }} fontWeight="bold" fontSize={{ base: 'xs', md: 'sm' }} color={textColor}>
              {item.name}
            </Text>
            
            <HStack spacing={1} justify="center">
              <IconButton
                aria-label="Remove"
                icon={<FaMinus />}
                size="xs"
                colorScheme="red"
                variant="outline"
                onClick={() => handleRemove(item)}
                isDisabled={quantity === 0}
              />
              <IconButton
                aria-label="Add"
                icon={<FaPlus />}
                size="xs"
                colorScheme="purple"
                onClick={() => handleAdd(item)}
              />
            </HStack>
          </Box>
        );
      })}
    </SimpleGrid>
  );
};
