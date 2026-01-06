'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Text,
  VStack,
  Icon,
  chakra,
  shouldForwardProp,
} from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  FaBed,
  FaCouch,
  FaUtensils,
  FaBath,
  FaBaby,
  FaBlender,
  FaTv,
  FaTree,
  FaDumbbell,
  FaMusic,
  FaDesktop,
  FaDog,
  FaGem,
  FaSuitcase,
  FaBoxOpen,
  FaChair,
  FaDoorOpen,
} from 'react-icons/fa';
import { IconType } from 'react-icons';

// Motion-enabled Box
const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    if (isValidMotionProp(prop)) return true;
    return shouldForwardProp(prop);
  },
});

// Category configuration with images and icons
export interface CategoryConfig {
  id: string;
  name: string;
  displayName: string;
  icon: IconType;
  image: string;
  gradient: string;
  accentColor: string;
}

// Map folder names to category configs
export const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    id: 'bedroom',
    name: 'Bedroom',
    displayName: 'Bedroom',
    icon: FaBed,
    image: '/UK_Removal_Dataset/Images_Only/Bedroom/king_bed_frame_classic_luxe_storage_jpg_65kg.jpg',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accentColor: '#764ba2',
  },
  {
    id: 'living-room',
    name: 'Living Room',
    displayName: 'Living Room',
    icon: FaCouch,
    image: '/UK_Removal_Dataset/Images_Only/Living_room_Furniture/chesterfield_sofa_4_seat_traditional_jpg_75kg.jpg',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    accentColor: '#f5576c',
  },
  {
    id: 'dining-room',
    name: 'Dining Room',
    displayName: 'Dining Room',
    icon: FaUtensils,
    image: '/UK_Removal_Dataset/Images_Only/Dining_Room_Furniture/dining_table_set_6piece_bench_jpg_105kg.jpg',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    accentColor: '#00f2fe',
  },
  {
    id: 'kitchen',
    name: 'Kitchen Appliances',
    displayName: 'Kitchen',
    icon: FaBlender,
    image: '/UK_Removal_Dataset/Images_Only/Kitchen_appliances/american_fridge_freezer_bosch_jpg_145kg.jpg',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    accentColor: '#38f9d7',
  },
  {
    id: 'bathroom',
    name: 'Bathroom Furniture',
    displayName: 'Bathroom',
    icon: FaBath,
    image: '/UK_Removal_Dataset/Images_Only/Bathroom_Furniture/vanity_unit_30inch_sink_jpg_45kg.jpg',
    gradient: 'linear-gradient(135deg, #0061ff 0%, #60efff 100%)',
    accentColor: '#60efff',
  },
  {
    id: 'garden',
    name: 'Garden & Outdoor',
    displayName: 'Garden',
    icon: FaTree,
    image: '/UK_Removal_Dataset/Images_Only/Garden_Outdoor/outdoor_dining_set_rattan_patio_jpg_32kg.jpg',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    accentColor: '#38ef7d',
  },
  {
    id: 'office',
    name: 'Office Furniture',
    displayName: 'Office',
    icon: FaDesktop,
    image: '/UK_Removal_Dataset/Images_Only/Office_furniture/office_desk_63_modern_executive_computer_5ft_home_jpg_55kg.jpg',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accentColor: '#667eea',
  },
  {
    id: 'electronics',
    name: 'Electrical & Electronic',
    displayName: 'Electronics',
    icon: FaTv,
    image: '/UK_Removal_Dataset/Images_Only/Electrical_Electronic/television_65inch_best_2025_jpg_45kg.jpg',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    accentColor: '#fa709a',
  },
  {
    id: 'gym',
    name: 'Gym & Fitness',
    displayName: 'Gym & Fitness',
    icon: FaDumbbell,
    image: '/UK_Removal_Dataset/Images_Only/Gym_Fitness_Equipment/home_gym_life_fitness_g4_jpg_185kg.jpg',
    gradient: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
    accentColor: '#ff0844',
  },
  {
    id: 'baby',
    name: 'Children & Baby',
    displayName: 'Kids & Baby',
    icon: FaBaby,
    image: '/UK_Removal_Dataset/Images_Only/Children_Baby_Items/baby_crib_convertible_white_jpg_35kg.jpg',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    accentColor: '#fed6e3',
  },
  {
    id: 'music',
    name: 'Musical Instruments',
    displayName: 'Music',
    icon: FaMusic,
    image: '/UK_Removal_Dataset/Images_Only/Musical_instruments/upright_piano_yamaha_u1_polished_mahogany_48inch_jpg_240kg.jpg',
    gradient: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
    accentColor: '#d299c2',
  },
  {
    id: 'pets',
    name: 'Pet Items',
    displayName: 'Pets',
    icon: FaDog,
    image: '/UK_Removal_Dataset/Images_Only/Pet_items/dog_crate_lemberi_44_inch_large_furniture_jpg_35kg.jpg',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    accentColor: '#fcb69f',
  },
  {
    id: 'antiques',
    name: 'Antiques & Collectibles',
    displayName: 'Antiques',
    icon: FaGem,
    image: '/UK_Removal_Dataset/Images_Only/Antiques_Collectibles/china_cabinet_glass_doors_jpg_125kg.jpg',
    gradient: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)',
    accentColor: '#c79081',
  },
  {
    id: 'luggage',
    name: 'Bags & Luggage',
    displayName: 'Luggage',
    icon: FaSuitcase,
    image: '/UK_Removal_Dataset/Images_Only/Bag_luggage_box/suitcase_luggage_melalenia_sets_7_piece_jpg_18kg.jpg',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accentColor: '#667eea',
  },
  {
    id: 'carpets',
    name: 'Carpets & Rugs',
    displayName: 'Carpets',
    icon: FaDoorOpen,
    image: '/UK_Removal_Dataset/Images_Only/Carpets_Rugs/persian_rug_traditional_medallion_jpg_22kg.jpg',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    accentColor: '#f093fb',
  },
  {
    id: 'wardrobes',
    name: 'Wardrobes',
    displayName: 'Wardrobes',
    icon: FaChair,
    image: '/UK_Removal_Dataset/Images_Only/Wardrobes_closet/wardrobe_triple_door_quarte_modern_3_door_2_drawers_white_jpg_98kg.jpg',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    accentColor: '#764ba2',
  },
  {
    id: 'misc',
    name: 'Miscellaneous',
    displayName: 'Misc',
    icon: FaBoxOpen,
    image: '/UK_Removal_Dataset/Images_Only/Miscellaneous_household/storage_containers_best_7_wirecutter_jpg_12kg.jpg',
    gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    accentColor: '#66a6ff',
  },
  {
    id: 'special',
    name: 'Special & Awkward',
    displayName: 'Special Items',
    icon: FaBoxOpen,
    image: '/UK_Removal_Dataset/Images_Only/Special_Awkward_items/hot_tub_cosyspa_luxury_40_degree_quick_jpg_285kg.jpg',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    accentColor: '#ffecd2',
  },
];

interface CategoryFlipCardProps {
  category: CategoryConfig;
  onClick?: (category: CategoryConfig) => void;
  size?: 'sm' | 'md' | 'lg';
  navigateOnClick?: boolean;
  bookingPath?: string;
}

const CategoryFlipCard: React.FC<CategoryFlipCardProps> = ({
  category,
  onClick,
  size = 'md',
  navigateOnClick = true,
  bookingPath = '/booking-luxury',
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const router = useRouter();

  // Size configurations - now uses 100% width with aspect ratio
  const sizeConfig = {
    sm: { aspectRatio: 1, fontSize: 'xs', iconSize: 5, minHeight: '105px' },
    md: { aspectRatio: 1, fontSize: 'sm', iconSize: 6, minHeight: '145px' },
    lg: { aspectRatio: 1, fontSize: 'md', iconSize: 8, minHeight: '185px' },
  };

  const config = sizeConfig[size];

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick(category);
    }
    if (navigateOnClick) {
      // Navigate to booking page with category pre-selected
      router.push(`${bookingPath}?category=${encodeURIComponent(category.name)}`);
    }
  }, [onClick, navigateOnClick, router, bookingPath, category]);

  const handleMouseEnter = useCallback(() => {
    setIsFlipped(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsFlipped(false);
  }, []);

  // Handle touch for mobile
  const handleTouchStart = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  return (
    <Box
      sx={{ 
        width: '100% !important',
        minHeight: config.minHeight,
        perspective: '1000px',
        aspectRatio: config.aspectRatio.toString(),
        maxWidth: 'none !important',
      }}
      cursor="pointer"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      role="button"
      tabIndex={0}
      aria-label={`Select ${category.displayName} category`}
      _focusVisible={{
        outline: '2px solid',
        outlineColor: 'blue.400',
        outlineOffset: '2px',
      }}
    >
      <MotionBox
        w="100%"
        h="100%"
        position="relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        // @ts-ignore - Framer Motion transition
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Front Side - Image */}
        <Box
          position="absolute"
          w="100%"
          h="100%"
          borderRadius="xl"
          overflow="hidden"
          boxShadow="0 10px 40px rgba(0,0,0,0.15)"
          style={{ backfaceVisibility: 'hidden' }}
          transition="all 0.3s ease"
          _hover={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}
        >
          {/* Skeleton loader */}
          {!imageLoaded && (
            <Box
              position="absolute"
              inset={0}
              bg="gray.100"
              borderRadius="xl"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={category.icon} boxSize={12} color="gray.300" />
            </Box>
          )}
          
          {/* Image */}
          <Image
            src={category.image}
            alt={category.displayName}
            fill
            sizes="(max-width: 480px) 100px, (max-width: 768px) 140px, 160px"
            style={{
              objectFit: 'cover',
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
            quality={85}
          />
          
          {/* Gradient overlay */}
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            h="50%"
            bgGradient="linear(to-t, blackAlpha.700, transparent)"
          />
          
          {/* Category label on front */}
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            p={3}
          >
            <Text
              fontSize={config.fontSize}
              fontWeight="bold"
              color="white"
              textShadow="0 2px 4px rgba(0,0,0,0.5)"
              noOfLines={1}
            >
              {category.displayName}
            </Text>
          </Box>

          {/* Premium badge */}
          <Box
            position="absolute"
            top={2}
            right={2}
            bg="rgba(255,255,255,0.95)"
            borderRadius="full"
            p={2}
            boxShadow="0 2px 8px rgba(0,0,0,0.15)"
          >
            <Icon as={category.icon} boxSize={4} color={category.accentColor} />
          </Box>
        </Box>

        {/* Back Side - Category Name */}
        <Box
          position="absolute"
          w="100%"
          h="100%"
          borderRadius="xl"
          overflow="hidden"
          boxShadow="0 10px 40px rgba(0,0,0,0.15)"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          bg={category.gradient}
        >
          <VStack
            h="100%"
            justify="center"
            align="center"
            spacing={4}
            p={4}
          >
            <Icon
              as={category.icon}
              boxSize={config.iconSize}
              color="white"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"
            />
            <Text
              fontSize={config.fontSize}
              fontWeight="bold"
              color="white"
              textAlign="center"
              textShadow="0 2px 4px rgba(0,0,0,0.2)"
              px={2}
            >
              {category.displayName}
            </Text>
            <Text
              fontSize="xs"
              color="whiteAlpha.800"
              textAlign="center"
              fontWeight="medium"
            >
              Tap to select
            </Text>
          </VStack>
          
          {/* Decorative elements */}
          <Box
            position="absolute"
            top={-20}
            right={-20}
            w="80px"
            h="80px"
            borderRadius="full"
            bg="whiteAlpha.100"
          />
          <Box
            position="absolute"
            bottom={-10}
            left={-10}
            w="60px"
            h="60px"
            borderRadius="full"
            bg="whiteAlpha.100"
          />
        </Box>
      </MotionBox>
    </Box>
  );
};

export default CategoryFlipCard;
export { CategoryFlipCard };
