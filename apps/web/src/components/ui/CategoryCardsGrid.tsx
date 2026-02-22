'use client';

import React, { useMemo } from 'react';
import {
  Box,
  SimpleGrid,
  Heading,
  Text,
  VStack,
  useBreakpointValue,
  chakra,
  shouldForwardProp,
} from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import CategoryFlipCard, { CATEGORY_CONFIGS, CategoryConfig } from './CategoryFlipCard';

// Motion-enabled components
const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    if (isValidMotionProp(prop)) return true;
    return shouldForwardProp(prop);
  },
});

interface CategoryCardsGridProps {
  /** Title for the section */
  title?: string;
  /** Subtitle/description */
  subtitle?: string;
  /** Maximum number of categories to show */
  maxCategories?: number;
  /** Size of cards */
  cardSize?: 'sm' | 'md' | 'lg';
  /** Callback when a category is clicked */
  onCategoryClick?: (category: CategoryConfig) => void;
  /** Custom booking path */
  bookingPath?: string;
  /** Show title section */
  showTitle?: boolean;
  /** Variant: 'default' for step2, 'hero' for hero section */
  variant?: 'default' | 'hero' | 'compact';
  /** Custom categories to display (subset of all) */
  categories?: CategoryConfig[];
  /** Column configuration override */
  columns?: { base: number; sm: number; md: number; lg: number; xl: number };
  /** Animation delay between cards */
  staggerDelay?: number;
}

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: 'easeOut' as const,
    },
  },
};

const CategoryCardsGrid: React.FC<CategoryCardsGridProps> = ({
  title = 'Browse by Category',
  subtitle = 'Select a category to find items for your move',
  maxCategories,
  cardSize = 'md',
  onCategoryClick,
  bookingPath = '/booking-luxury',
  showTitle = true,
  variant = 'default',
  categories: customCategories,
  columns,
  staggerDelay = 0.08,
}) => {
  // Get responsive card size
  const responsiveCardSize = useBreakpointValue({
    base: 'sm',
    md: cardSize,
    lg: cardSize,
  }) as 'sm' | 'md' | 'lg' || cardSize;

  // Default column configs based on variant
  const defaultColumns = useMemo(() => {
    switch (variant) {
      case 'hero':
        return { base: 2, sm: 3, md: 4, lg: 5, xl: 6 };
      case 'compact':
        return { base: 2, sm: 3, md: 4, lg: 6, xl: 8 };
      default:
        return { base: 2, sm: 3, md: 4, lg: 5, xl: 6 };
    }
  }, [variant]);

  const gridColumns = columns || defaultColumns;

  // Get categories to display
  const displayCategories = useMemo(() => {
    let cats = customCategories || CATEGORY_CONFIGS;
    if (maxCategories && maxCategories > 0) {
      cats = cats.slice(0, maxCategories);
    }
    return cats;
  }, [customCategories, maxCategories]);

  // Variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'hero':
        return {
          bg: 'transparent',
          py: { base: 6, md: 10 },
          titleColor: 'white',
          subtitleColor: 'whiteAlpha.800',
        };
      case 'compact':
        return {
          bg: 'transparent',
          py: { base: 4, md: 6 },
          titleColor: 'text.primary',
          subtitleColor: 'text.secondary',
        };
      default:
        return {
          bg: 'bg.surface',
          py: { base: 8, md: 12 },
          titleColor: 'text.primary',
          subtitleColor: 'text.secondary',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Box
      w="full"
      py={styles.py}
      bg={styles.bg}
      borderRadius={variant === 'default' ? 'xl' : 'none'}
    >
      {showTitle && (
        <VStack spacing={2} mb={{ base: 6, md: 8 }} textAlign="center">
          <Heading
            size={{ base: 'lg', md: 'xl' }}
            color={styles.titleColor}
            fontWeight="bold"
            textShadow={variant === 'hero' ? '0 2px 10px rgba(0,0,0,0.3)' : 'none'}
          >
            {title}
          </Heading>
          <Text
            fontSize={{ base: 'sm', md: 'md' }}
            color={styles.subtitleColor}
            maxW={{ base: '100%', md: '600px' }}
            px={4}
          >
            {subtitle}
          </Text>
        </VStack>
      )}

      <MotionBox
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        <SimpleGrid
          columns={gridColumns}
          spacing={{ base: 3, sm: 4, md: 5, lg: 6 }}
          justifyItems="center"
          px={{ base: 2, md: 4 }}
        >
          {displayCategories.map((category, index) => (
            <MotionBox
              key={category.id}
              variants={itemVariants}
              custom={index}
            >
              <CategoryFlipCard
                category={category}
                onClick={onCategoryClick}
                size={responsiveCardSize}
                navigateOnClick={!onCategoryClick}
                bookingPath={bookingPath}
              />
            </MotionBox>
          ))}
        </SimpleGrid>
      </MotionBox>
    </Box>
  );
};

export default CategoryCardsGrid;
export { CategoryCardsGrid, CATEGORY_CONFIGS };
export type { CategoryCardsGridProps };
