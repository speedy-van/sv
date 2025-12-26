'use client';

import React, { useEffect } from 'react';
import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  VStack,
  Heading,
  Text,
  Icon,
} from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import { FaHome, FaBuilding, FaWarehouse, FaCouch, FaCheck } from 'react-icons/fa';

export type PropertyType = 'house' | 'flat' | 'office' | 'storage' | 'single-items';

export interface PropertyTypeOption {
  id: PropertyType;
  name: string;
  icon: IconType;
  description: string;
  color: 'blue' | 'purple' | 'orange' | 'green';
}

export const PROPERTY_TYPES: PropertyTypeOption[] = [
  {
    id: 'house',
    name: 'House / Flat',
    icon: FaHome,
    description: 'Moving your home with furniture and belongings',
    color: 'blue',
  },
  {
    id: 'office',
    name: 'Office',
    icon: FaBuilding,
    description: 'Office equipment, desks, and filing cabinets',
    color: 'purple',
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: FaWarehouse,
    description: 'Moving items to or from storage',
    color: 'orange',
  },
  {
    id: 'single-items',
    name: 'Single Items',
    icon: FaCouch,
    description: 'Just a few specific items',
    color: 'green',
  },
];

interface PropertyTypeSelectorProps {
  selectedType?: PropertyType;
  onSelectType: (type: PropertyType) => void;
  aiAssistantSlot?: React.ReactNode;
}

export default function PropertyTypeSelector({
  selectedType,
  onSelectType,
  aiAssistantSlot,
}: PropertyTypeSelectorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (aiAssistantSlot) {
        console.log('🎯 PropertyTypeSelector: aiAssistantSlot ready');
      } else {
        console.log('❌ PropertyTypeSelector: aiAssistantSlot missing');
      }
    }
  }, [aiAssistantSlot]);

  return (
    <Box>
      <VStack spacing={3} align="stretch" mb={6}>
        <Heading 
          size={{ base: "lg", md: "xl" }}
          color="white"
          fontWeight="800"
          letterSpacing="tight"
          bgGradient="linear(to-r, green.300, teal.400)"
          bgClip="text"
          textShadow="0 0 20px rgba(16, 185, 129, 0.2)"
          fontFamily="'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif"
        >
          🏠 What Type of Move Do You Need?
        </Heading>
        <Text 
          color="whiteAlpha.900"
          fontWeight="600"
          fontSize={{ base: "md", md: "lg" }}
          letterSpacing="wide"
          lineHeight="1.8"
        >
          ⚡ <Text as="span" color="yellow.300" fontWeight="bold">Save Time!</Text> Select your property type below and we'll automatically suggest the most common items for your move — 
          <Text as="span" color="green.300" fontWeight="bold"> no need to add items one by one!</Text>
        </Text>
      </VStack>

      {aiAssistantSlot && (
        <Box mb={8}>
          {aiAssistantSlot}
        </Box>
      )}

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        {PROPERTY_TYPES.map((type) => (
          <Card
            key={type.id}
            variant="outline"
            cursor="pointer"
            borderWidth="3px"
            borderColor={selectedType === type.id ? `${type.color}.400` : 'whiteAlpha.200'}
            bg={selectedType === type.id ? `${type.color}.900` : 'whiteAlpha.50'}
            borderRadius="2xl"
            overflow="hidden"
            position="relative"
            boxShadow={selectedType === type.id ? `0 0 30px ${type.color === 'blue' ? 'rgba(59, 130, 246, 0.4)' : type.color === 'purple' ? 'rgba(168, 85, 247, 0.4)' : type.color === 'orange' ? 'rgba(251, 146, 60, 0.4)' : 'rgba(16, 185, 129, 0.4)'}` : 'none'}
            _hover={{
              bg: selectedType === type.id ? `${type.color}.800` : 'whiteAlpha.100',
              transform: 'translateY(-4px) scale(1.02)',
              boxShadow: selectedType === type.id 
                ? `0 0 40px ${type.color === 'blue' ? 'rgba(59, 130, 246, 0.6)' : type.color === 'purple' ? 'rgba(168, 85, 247, 0.6)' : type.color === 'orange' ? 'rgba(251, 146, 60, 0.6)' : 'rgba(16, 185, 129, 0.6)'}`
                : '0 8px 20px rgba(0,0,0,0.4)',
              borderColor: `${type.color}.300`,
            }}
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            onClick={() => onSelectType(type.id)}
          >
            <CardBody>
              <VStack spacing={4} align="center" py={6}>
                <Box
                  p={4}
                  borderRadius="xl"
                  bg={selectedType === type.id ? `${type.color}.800` : 'whiteAlpha.100'}
                  transition="all 0.3s"
                >
                  <Icon
                    as={type.icon}
                    boxSize={{ base: 14, md: 16 }}
                    color={selectedType === type.id ? `${type.color}.300` : `${type.color}.400`}
                    filter={selectedType === type.id ? `drop-shadow(0 0 10px ${type.color === 'blue' ? 'rgba(59, 130, 246, 0.6)' : type.color === 'purple' ? 'rgba(168, 85, 247, 0.6)' : type.color === 'orange' ? 'rgba(251, 146, 60, 0.6)' : 'rgba(16, 185, 129, 0.6)'})` : 'none'}
                    transition="all 0.3s"
                  />
                </Box>
                <Heading 
                  size={{ base: "md", md: "lg" }}
                  textAlign="center" 
                  color="white"
                  fontWeight="800"
                  letterSpacing="tight"
                >
                  {type.name}
                </Heading>
                <Text
                  fontSize={{ base: "sm", md: "md" }}
                  color="whiteAlpha.800"
                  textAlign="center"
                  noOfLines={3}
                  fontWeight="500"
                  lineHeight="1.5"
                  px={2}
                >
                  {type.description}
                </Text>
              </VStack>
            </CardBody>
            {selectedType === type.id && (
              <Box
                position="absolute"
                top={3}
                right={3}
                bg={`${type.color}.500`}
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
