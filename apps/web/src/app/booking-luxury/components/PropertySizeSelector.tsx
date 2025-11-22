'use client';

import React from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Icon,
} from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import { FaHome, FaBed, FaUsers, FaBuilding, FaWarehouse } from 'react-icons/fa';
import { PropertyType } from './PropertyTypeSelector';
import { SelectableCard } from '@/components/shared/SelectableCard';

export interface PropertySizeOption {
  id: string;
  name: string;
  icon: IconType;
  description?: string;
  bedrooms?: number;
  recommendedItems?: number;
}

// House/Flat sizes
export const HOUSE_SIZES: PropertySizeOption[] = [
  {
    id: 'studio',
    name: 'Studio',
    icon: FaHome,
    description: 'Small flat with minimal furniture',
    bedrooms: 0,
    recommendedItems: 25,
  },
  {
    id: '1-bedroom',
    name: '1 Bedroom',
    icon: FaBed,
    description: 'Small flat or apartment',
    bedrooms: 1,
    recommendedItems: 35,
  },
  {
    id: '2-bedroom',
    name: '2 Bedrooms',
    icon: FaBed,
    description: 'Medium-sized flat or house',
    bedrooms: 2,
    recommendedItems: 50,
  },
  {
    id: '3-bedroom',
    name: '3 Bedrooms',
    icon: FaHome,
    description: 'Family house with multiple rooms',
    bedrooms: 3,
    recommendedItems: 65,
  },
  {
    id: '4-bedroom',
    name: '4 Bedrooms',
    icon: FaHome,
    description: 'Large family house',
    bedrooms: 4,
    recommendedItems: 80,
  },
  {
    id: '5-bedroom',
    name: '5+ Bedrooms',
    icon: FaUsers,
    description: 'Very large house',
    bedrooms: 5,
    recommendedItems: 95,
  },
];

// Office sizes
export const OFFICE_SIZES: PropertySizeOption[] = [
  {
    id: 'office-1-2',
    name: '1-2 Person Office',
    icon: FaBuilding,
    description: 'Small office or home office',
    recommendedItems: 14,
  },
  {
    id: 'office-3-5',
    name: '3-5 Person Office',
    icon: FaBuilding,
    description: 'Medium office space',
    recommendedItems: 43,
  },
  {
    id: 'office-6-10',
    name: '6-10 Person Office',
    icon: FaBuilding,
    description: 'Large office space',
    recommendedItems: 43,
  },
  {
    id: 'office-10-plus',
    name: '10+ Person Office',
    icon: FaUsers,
    description: 'Very large office or commercial space',
    recommendedItems: 43,
  },
];

// Storage sizes
export const STORAGE_SIZES: PropertySizeOption[] = [
  {
    id: 'storage-small',
    name: 'Small Unit',
    icon: FaWarehouse,
    description: 'About 25 sq ft',
    recommendedItems: 15,
  },
  {
    id: 'storage-medium',
    name: 'Medium Unit',
    icon: FaWarehouse,
    description: 'About 50-75 sq ft',
    recommendedItems: 30,
  },
  {
    id: 'storage-large',
    name: 'Large Unit',
    icon: FaWarehouse,
    description: 'About 100+ sq ft',
    recommendedItems: 50,
  },
];

interface PropertySizeSelectorProps {
  propertyType: PropertyType;
  selectedSize?: string;
  onSelectSize: (size: string) => void;
}

export default function PropertySizeSelector({
  propertyType,
  selectedSize,
  onSelectSize,
}: PropertySizeSelectorProps) {
  // Get sizes based on property type
  const sizes = 
    propertyType === 'house' ? HOUSE_SIZES :
    propertyType === 'office' ? OFFICE_SIZES :
    propertyType === 'storage' ? STORAGE_SIZES :
    [];

  // Skip size selection for single items
  if (propertyType === 'single-items') {
    return null;
  }

  return (
    <Box>
      <VStack spacing={3} align="stretch" mb={6}>
        <Heading 
          size={{ base: "lg", md: "xl" }}
          color="white"
          fontWeight="800"
          letterSpacing="tight"
          bgGradient="linear(to-r, blue.300, cyan.400)"
          bgClip="text"
          textShadow="0 0 20px rgba(59, 130, 246, 0.2)"
          fontFamily="'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
        >
          What is the property size?
        </Heading>
        <Text 
          color="whiteAlpha.800"
          fontWeight="500"
          fontSize={{ base: "md", md: "lg" }}
          letterSpacing="wide"
          lineHeight="1.6"
        >
          Select the size to get a pre-populated list of common items
        </Text>
      </VStack>

      <SimpleGrid 
        columns={{ base: 1, md: 2, lg: 3 }} 
        spacing={{ base: 4, md: 5, lg: 6 }}
        w="100%"
      >
        {sizes.map((size) => {
          const isSelected = selectedSize === size.id;
          return (
            <SelectableCard
              key={size.id}
              isSelected={isSelected}
              onClick={() => onSelectSize(size.id)}
              minH={{ base: "140px", md: "160px", lg: "180px" }}
              p={{ base: 4, md: 6 }}
              display="flex"
              flexDirection="column"
              justifyContent="stretch"
            >
              <VStack spacing={{ base: 3, md: 4 }} align="stretch" flex="1">
                <HStack 
                  justify="space-between" 
                  align="center"
                  flexWrap="nowrap"
                  w="100%"
                >
                  <Box
                    p={{ base: 2, md: 3 }}
                    borderRadius="xl"
                    bg={isSelected ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.12)'}
                    transition="all 0.3s"
                    flexShrink={0}
                  >
                    <Icon
                      as={size.icon}
                      boxSize={{ base: 8, md: 10, lg: 12 }}
                      color={isSelected ? 'blue.300' : 'blue.400'}
                      filter={isSelected ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.6))' : 'none'}
                      transition="all 0.3s"
                    />
                  </Box>
                  {size.recommendedItems && (
                    <Badge 
                      colorScheme={isSelected ? 'purple' : 'blue'}
                      fontSize={{ base: 'xs', md: 'sm' }}
                      px={{ base: 2, md: 3, lg: 4 }}
                      py={{ base: 1, md: 1.5, lg: 2 }}
                      borderRadius="full"
                      fontWeight="800"
                      letterSpacing="wide"
                      boxShadow={isSelected ? '0 0 15px rgba(168, 85, 247, 0.4)' : 'none'}
                      flexShrink={0}
                      whiteSpace="nowrap"
                    >
                      ~{size.recommendedItems}
                    </Badge>
                  )}
                </HStack>
                
                <Heading 
                  size={{ base: "sm", md: "md", lg: "lg" }}
                  color="white"
                  fontWeight="800"
                  letterSpacing="tight"
                  noOfLines={1}
                >
                  {size.name}
                </Heading>
                
                {size.description && (
                  <Text 
                    fontSize={{ base: "xs", md: "sm" }}
                    color="whiteAlpha.800"
                    fontWeight="500"
                    lineHeight="1.5"
                    noOfLines={2}
                    minH={{ base: "32px", md: "40px" }}
                  >
                    {size.description}
                  </Text>
                )}
              </VStack>
            </SelectableCard>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}
