'use client';

import React from 'react';
import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  VStack,
  HStack,
  Heading,
  Text,
  Badge,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import { FaHome, FaBed, FaUsers, FaBuilding, FaWarehouse, FaCheck } from 'react-icons/fa';
import { PropertyType } from './PropertyTypeSelector';

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
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  const hoverBg = useColorModeValue('gray.50', 'gray.800');

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

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {sizes.map((size) => (
          <Card
            key={size.id}
            variant="outline"
            cursor="pointer"
            borderWidth="3px"
            borderColor={selectedSize === size.id ? 'blue.400' : 'whiteAlpha.200'}
            bg={selectedSize === size.id ? 'blue.900' : 'whiteAlpha.50'}
            borderRadius="2xl"
            overflow="hidden"
            position="relative"
            boxShadow={selectedSize === size.id ? '0 0 30px rgba(59, 130, 246, 0.4)' : 'none'}
            _hover={{
              bg: selectedSize === size.id ? 'blue.800' : 'whiteAlpha.100',
              transform: 'translateY(-4px) scale(1.02)',
              boxShadow: selectedSize === size.id 
                ? '0 0 40px rgba(59, 130, 246, 0.6)'
                : '0 8px 20px rgba(0,0,0,0.4)',
              borderColor: 'blue.300',
            }}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            onClick={() => onSelectSize(size.id)}
          >
            <CardBody py={6}>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="start">
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg={selectedSize === size.id ? 'blue.800' : 'whiteAlpha.100'}
                    transition="all 0.3s"
                  >
                    <Icon
                      as={size.icon}
                      boxSize={{ base: 10, md: 12 }}
                      color={selectedSize === size.id ? 'blue.300' : 'blue.400'}
                      filter={selectedSize === size.id ? 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.6))' : 'none'}
                      transition="all 0.3s"
                    />
                  </Box>
                  {size.recommendedItems && (
                    <Badge 
                      colorScheme={selectedSize === size.id ? 'purple' : 'blue'}
                      fontSize={{ base: 'sm', md: 'md' }}
                      px={4}
                      py={2}
                      borderRadius="full"
                      fontWeight="800"
                      letterSpacing="wide"
                      boxShadow={selectedSize === size.id ? '0 0 15px rgba(168, 85, 247, 0.4)' : 'none'}
                    >
                      ~{size.recommendedItems} items
                    </Badge>
                  )}
                </HStack>
                
                <Heading 
                  size={{ base: "md", md: "lg" }}
                  color="white"
                  fontWeight="800"
                  letterSpacing="tight"
                >
                  {size.name}
                </Heading>
                
                {size.description && (
                  <Text 
                    fontSize={{ base: "sm", md: "md" }}
                    color="whiteAlpha.800"
                    fontWeight="500"
                    lineHeight="1.5"
                  >
                    {size.description}
                  </Text>
                )}
              </VStack>
            </CardBody>
            {selectedSize === size.id && (
              <Box
                position="absolute"
                top={3}
                right={3}
                bg="blue.500"
                borderRadius="full"
                p={2}
                boxShadow="0 0 15px rgba(255,255,255,0.5)"
              >
                <Icon as={FaCheck} boxSize={4} color="white" />
              </Box>
            )}
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
}
