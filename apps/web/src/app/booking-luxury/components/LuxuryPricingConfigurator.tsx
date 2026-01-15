'use client';

/**
 * Luxury Pricing Configurator - Premium Settings First Approach
 * Two settings controls that must be configured before revealing pricing
 * Designed for a luxury, calm, and controlled pricing reveal experience
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Button,
  useDisclosure,
  Collapse,
  Badge,
  SimpleGrid,
  Heading,
} from '@chakra-ui/react';

export type ServiceSpeed = 'flexible' | 'standard' | 'express';
export type ServiceLevel = 'basic' | 'assist' | 'white-glove';

interface ServiceSpeedOption {
  id: ServiceSpeed;
  label: string;
  description: string;
  icon: string;
  priceMultiplier: number;
  color: string;
}

interface ServiceLevelOption {
  id: ServiceLevel;
  label: string;
  description: string;
  icon: string;
  features: string[];
  priceMultiplier: number;
  color: string;
}

const SERVICE_SPEED_OPTIONS: ServiceSpeedOption[] = [
  {
    id: 'flexible',
    label: 'Flexible',
    description: '3-5 days notice',
    icon: '🕐',
    priceMultiplier: 0.85,
    color: 'green',
  },
  {
    id: 'standard',
    label: 'Standard',
    description: '24-48 hours',
    icon: '📅',
    priceMultiplier: 1.0,
    color: 'blue',
  },
  {
    id: 'express',
    label: 'Express',
    description: 'Next day',
    icon: '⚡',
    priceMultiplier: 1.5,
    color: 'orange',
  },
];

const SERVICE_LEVEL_OPTIONS: ServiceLevelOption[] = [
  {
    id: 'basic',
    label: 'Basic',
    description: 'Standard service',
    icon: '📦',
    features: ['Loading & unloading', 'Safe transport', 'Standard care'],
    priceMultiplier: 1.0,
    color: 'gray',
  },
  {
    id: 'assist',
    label: 'Assist',
    description: 'Extra helping hands',
    icon: '🤝',
    features: ['Basic +', 'Stair assistance', 'Light assembly'],
    priceMultiplier: 1.25,
    color: 'blue',
  },
  {
    id: 'white-glove',
    label: 'White Glove',
    description: 'Luxury experience',
    icon: '✨',
    features: ['Assist +', 'Full assembly', 'Fragile handling', 'Premium care'],
    priceMultiplier: 1.6,
    color: 'purple',
  },
];

interface LuxuryPricingConfiguratorProps {
  onConfigured: (config: {
    serviceSpeed: ServiceSpeed;
    serviceLevel: ServiceLevel;
    totalMultiplier: number;
  }) => void;
  defaultSpeed?: ServiceSpeed;
  defaultLevel?: ServiceLevel;
}

export default function LuxuryPricingConfigurator({
  onConfigured,
  defaultSpeed = 'standard',
  defaultLevel = 'basic',
}: LuxuryPricingConfiguratorProps) {
  const [selectedSpeed, setSelectedSpeed] = useState<ServiceSpeed>(defaultSpeed);
  const [selectedLevel, setSelectedLevel] = useState<ServiceLevel>(defaultLevel);
  const [isConfigured, setIsConfigured] = useState(false);
  const { isOpen: isPricingRevealed, onOpen: revealPricing } = useDisclosure();

  // Calculate total multiplier
  const totalMultiplier = 
    (SERVICE_SPEED_OPTIONS.find(o => o.id === selectedSpeed)?.priceMultiplier || 1.0) *
    (SERVICE_LEVEL_OPTIONS.find(o => o.id === selectedLevel)?.priceMultiplier || 1.0);

  // Handle configuration completion
  const handleViewPricing = useCallback(() => {
    setIsConfigured(true);
    onConfigured({
      serviceSpeed: selectedSpeed,
      serviceLevel: selectedLevel,
      totalMultiplier,
    });
    
    // Reveal pricing with smooth animation
    setTimeout(() => {
      revealPricing();
    }, 100);
  }, [selectedSpeed, selectedLevel, totalMultiplier, onConfigured, revealPricing]);

  // Auto-configure with defaults and reveal immediately
  useEffect(() => {
    if (!isConfigured) {
      handleViewPricing();
    }
  }, []); // Only run on mount

  return (
    <VStack spacing={6} align="stretch" w="full">
      {/* Settings Container */}
      <Card
        bg="rgba(17, 24, 39, 0.95)"
        border="2px solid"
        borderColor="rgba(124, 58, 237, 0.4)"
        borderRadius="2xl"
        backdropFilter="blur(20px)"
        overflow="hidden"
        position="relative"
        boxShadow="0 8px 32px rgba(124, 58, 237, 0.3)"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          bgGradient: 'linear(to-r, purple.400, blue.400)',
        }}
      >
        <CardBody p={{ base: 6, md: 8 }}>
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <VStack align="stretch" spacing={2}>
              <HStack spacing={3} align="center">
                <Box
                  w="48px"
                  h="48px"
                  borderRadius="xl"
                  bg="linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.3))"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="24px"
                  boxShadow="0 4px 16px rgba(124,58,237,0.4)"
                >
                  ⚙️
                </Box>
                <VStack align="start" spacing={0}>
                  <Heading size="lg" color="white" fontWeight="800" lineHeight="1.2">
                    Configure Your Service
                  </Heading>
                  <Text fontSize="sm" color="gray.400" fontWeight="500">
                    Choose your preferences to see personalized pricing
                  </Text>
                </VStack>
              </HStack>
            </VStack>

            {/* Settings Grid - Side by Side on Desktop, Stacked on Mobile */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {/* Setting 1: Service Speed */}
              <VStack align="stretch" spacing={4}>
                <HStack spacing={2}>
                  <Text fontSize="sm" fontWeight="700" color="gray.300" textTransform="uppercase" letterSpacing="wide">
                    ⚡ Service Speed
                  </Text>
                  <Badge colorScheme="purple" fontSize="xs" px={2} py={0.5} borderRadius="md">
                    Required
                  </Badge>
                </HStack>

                <VStack spacing={3} align="stretch">
                  {SERVICE_SPEED_OPTIONS.map((option) => {
                    const isSelected = selectedSpeed === option.id;
                    
                    return (
                      <Box
                        key={option.id}
                        as="button"
                        type="button"
                        onClick={() => setSelectedSpeed(option.id)}
                        p={4}
                        borderRadius="xl"
                        border="2px solid"
                        borderColor={isSelected ? `${option.color}.400` : 'rgba(255,255,255,0.1)'}
                        bg={isSelected 
                          ? `linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.15))`
                          : 'rgba(0,0,0,0.3)'
                        }
                        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                        position="relative"
                        overflow="hidden"
                        boxShadow={isSelected 
                          ? `0 0 24px rgba(124,58,237,0.4)`
                          : '0 2px 8px rgba(0,0,0,0.2)'
                        }
                        _hover={{
                          borderColor: `${option.color}.300`,
                          bg: isSelected 
                            ? `linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.2))`
                            : 'rgba(0,0,0,0.4)',
                          transform: 'translateY(-2px)',
                        }}
                        _active={{ transform: 'translateY(0)' }}
                      >
                        <HStack justify="space-between" align="center" w="full">
                          <HStack spacing={3}>
                            <Text fontSize="24px">{option.icon}</Text>
                            <VStack align="start" spacing={0}>
                              <Text color="white" fontWeight="700" fontSize="md">
                                {option.label}
                              </Text>
                              <Text color="gray.400" fontSize="xs" fontWeight="500">
                                {option.description}
                              </Text>
                            </VStack>
                          </HStack>
                          
                          {isSelected && (
                            <Box
                              w="24px"
                              h="24px"
                              borderRadius="full"
                              bg="linear-gradient(135deg, #7C3AED, #3B82F6)"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              boxShadow="0 0 0 3px rgba(124,58,237,0.3)"
                            >
                              <Text fontSize="sm" color="white" fontWeight="bold">✓</Text>
                            </Box>
                          )}
                        </HStack>

                        {option.priceMultiplier !== 1.0 && (
                          <Badge
                            position="absolute"
                            top="8px"
                            right="8px"
                            colorScheme={option.priceMultiplier < 1.0 ? 'green' : 'orange'}
                            fontSize="2xs"
                            px={2}
                            py={0.5}
                          >
                            {option.priceMultiplier < 1.0 ? '↓' : '↑'} {Math.abs((option.priceMultiplier - 1.0) * 100).toFixed(0)}%
                          </Badge>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              </VStack>

              {/* Setting 2: Service Level */}
              <VStack align="stretch" spacing={4}>
                <HStack spacing={2}>
                  <Text fontSize="sm" fontWeight="700" color="gray.300" textTransform="uppercase" letterSpacing="wide">
                    ✨ Service Level
                  </Text>
                  <Badge colorScheme="purple" fontSize="xs" px={2} py={0.5} borderRadius="md">
                    Required
                  </Badge>
                </HStack>

                <VStack spacing={3} align="stretch">
                  {SERVICE_LEVEL_OPTIONS.map((option) => {
                    const isSelected = selectedLevel === option.id;
                    
                    return (
                      <Box
                        key={option.id}
                        as="button"
                        type="button"
                        onClick={() => setSelectedLevel(option.id)}
                        p={4}
                        borderRadius="xl"
                        border="2px solid"
                        borderColor={isSelected ? `${option.color}.400` : 'rgba(255,255,255,0.1)'}
                        bg={isSelected 
                          ? `linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.15))`
                          : 'rgba(0,0,0,0.3)'
                        }
                        transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                        position="relative"
                        overflow="hidden"
                        boxShadow={isSelected 
                          ? `0 0 24px rgba(124,58,237,0.4)`
                          : '0 2px 8px rgba(0,0,0,0.2)'
                        }
                        _hover={{
                          borderColor: `${option.color}.300`,
                          bg: isSelected 
                            ? `linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.2))`
                            : 'rgba(0,0,0,0.4)',
                          transform: 'translateY(-2px)',
                        }}
                        _active={{ transform: 'translateY(0)' }}
                      >
                        <VStack align="stretch" spacing={2} w="full">
                          <HStack justify="space-between" align="center" w="full">
                            <HStack spacing={3}>
                              <Text fontSize="24px">{option.icon}</Text>
                              <VStack align="start" spacing={0}>
                                <Text color="white" fontWeight="700" fontSize="md">
                                  {option.label}
                                </Text>
                                <Text color="gray.400" fontSize="xs" fontWeight="500">
                                  {option.description}
                                </Text>
                              </VStack>
                            </HStack>
                            
                            {isSelected && (
                              <Box
                                w="24px"
                                h="24px"
                                borderRadius="full"
                                bg="linear-gradient(135deg, #7C3AED, #3B82F6)"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                boxShadow="0 0 0 3px rgba(124,58,237,0.3)"
                              >
                                <Text fontSize="sm" color="white" fontWeight="bold">✓</Text>
                              </Box>
                            )}
                          </HStack>

                          {/* Features */}
                          {isSelected && (
                            <VStack align="start" spacing={1} pl={9} pt={2}>
                              {option.features.map((feature, idx) => (
                                <HStack key={idx} spacing={2}>
                                  <Box w="4px" h="4px" borderRadius="full" bg="purple.400" />
                                  <Text color="gray.400" fontSize="xs" fontWeight="500">
                                    {feature}
                                  </Text>
                                </HStack>
                              ))}
                            </VStack>
                          )}
                        </VStack>

                        {option.priceMultiplier !== 1.0 && (
                          <Badge
                            position="absolute"
                            top="8px"
                            right="8px"
                            colorScheme={option.id === 'white-glove' ? 'purple' : 'blue'}
                            fontSize="2xs"
                            px={2}
                            py={0.5}
                          >
                            {option.id === 'white-glove' ? '👑 Luxury' : option.id === 'assist' ? '➕ Enhanced' : ''}
                          </Badge>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              </VStack>
            </SimpleGrid>

            {/* View Pricing Button - Only show if not configured */}
            {!isConfigured && (
              <Button
                size="lg"
                h="56px"
                bg="linear-gradient(135deg, #7C3AED, #3B82F6)"
                color="white"
                fontWeight="800"
                fontSize="md"
                borderRadius="xl"
                boxShadow="0 8px 24px rgba(124,58,237,0.4)"
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                onClick={handleViewPricing}
                _hover={{
                  bg: 'linear-gradient(135deg, #6D28D9, #2563EB)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 32px rgba(124,58,237,0.6)',
                }}
                _active={{ transform: 'translateY(0)' }}
              >
                View Pricing Options →
              </Button>
            )}

            {/* Configuration Summary - Show after configured */}
            {isConfigured && (
              <Box
                p={5}
                bg="linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.1))"
                borderRadius="xl"
                border="1px solid"
                borderColor="rgba(124,58,237,0.3)"
              >
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between" align="center">
                    <Text color="gray.300" fontSize="sm" fontWeight="600">
                      Selected Configuration
                    </Text>
                    <Badge colorScheme="green" fontSize="xs" px={2} py={1}>
                      ✓ Configured
                    </Badge>
                  </HStack>
                  
                  <HStack spacing={4} flexWrap="wrap">
                    <HStack spacing={2}>
                      <Text fontSize="lg">
                        {SERVICE_SPEED_OPTIONS.find(o => o.id === selectedSpeed)?.icon}
                      </Text>
                      <Text color="white" fontSize="sm" fontWeight="600">
                        {SERVICE_SPEED_OPTIONS.find(o => o.id === selectedSpeed)?.label}
                      </Text>
                    </HStack>
                    
                    <Text color="gray.500">+</Text>
                    
                    <HStack spacing={2}>
                      <Text fontSize="lg">
                        {SERVICE_LEVEL_OPTIONS.find(o => o.id === selectedLevel)?.icon}
                      </Text>
                      <Text color="white" fontSize="sm" fontWeight="600">
                        {SERVICE_LEVEL_OPTIONS.find(o => o.id === selectedLevel)?.label}
                      </Text>
                    </HStack>
                  </HStack>

                  {totalMultiplier !== 1.0 && (
                    <Text color="purple.300" fontSize="xs" fontWeight="600">
                      Price adjustment: {totalMultiplier < 1.0 ? '↓' : '↑'} {Math.abs((totalMultiplier - 1.0) * 100).toFixed(0)}%
                    </Text>
                  )}
                </VStack>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Pricing Reveal Signal - Hidden element for parent to track */}
      {isPricingRevealed && (
        <Box data-pricing-revealed="true" display="none" />
      )}
    </VStack>
  );
}
