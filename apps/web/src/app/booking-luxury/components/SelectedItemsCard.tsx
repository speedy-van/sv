'use client';

/**
 * Comprehensive Selected Items Card
 * Works for both Step 2 and Step 3, supports single and multi-leg journeys
 */

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Image,
  Card,
  CardBody,
  Badge,
  IconButton,
  Flex,
  Divider,
  useToast,
  ScaleFade,
  Tooltip,
  Icon,
  Circle,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { 
  FaPlus, 
  FaMinus, 
  FaTrash, 
  FaShoppingCart, 
  FaBox, 
  FaWeight, 
  FaCubes, 
  FaArrowRight, 
  FaUndo, 
  FaRoute,
  FaCouch,
  FaTv,
  FaBed,
  FaChair,
  FaArchive,
  FaBoxOpen,
  FaDumbbell,
  FaBicycle,
  FaGuitar,
  FaPalette,
} from 'react-icons/fa';
import { 
  MdOutlineInventory2, 
  MdKitchen, 
  MdOutlineLiving,
  MdTableRestaurant,
  MdOutlineBedroomParent,
  MdOutlineChair,
  MdOutlineWeekend,
} from 'react-icons/md';
import { BsBox, BsArchive } from 'react-icons/bs';
import { GiWashingMachine, GiDesk } from 'react-icons/gi';
import NextImage from 'next/image';

// Icon pulse animation
const pulseAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

// Icon float animation  
const floatAnimation = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-3px); }
  100% { transform: translateY(0px); }
`;

interface SelectedItem {
  id: string;
  name: string;
  category: string;
  weight: number;
  quantity: number;
  image?: string;
  description?: string;
  unitPrice?: number;
  totalPrice?: number;
}

// Color themes for different journey types
type JourneyColorTheme = 'outbound' | 'return' | 'additional' | 'default';

const colorThemes: Record<JourneyColorTheme, {
  bgGradient: string;
  fallbackBg: string;
  borderColor: string;
  hoverBorderColor: string;
  badgeColorScheme: string;
  accentColor: string;
  accentDark: string;
  bgTint: string;
  iconBg: string;
  quantityBg: string;
  headerIcon: typeof FaArrowRight;
  label: string;
}> = {
  outbound: {
    bgGradient: 'linear-gradient(135deg, var(--chakra-colors-blue-500) 0%, var(--chakra-colors-blue-600) 50%, var(--chakra-colors-blue-700) 100%)',
    fallbackBg: 'blue.600',
    borderColor: 'blue.200',
    hoverBorderColor: 'blue.400',
    badgeColorScheme: 'blue',
    accentColor: 'blue.500',
    accentDark: 'blue.600',
    bgTint: 'blue.50',
    iconBg: 'blue.100',
    quantityBg: 'blue.50',
    headerIcon: FaArrowRight,
    label: 'Outbound',
  },
  return: {
    bgGradient: 'linear-gradient(135deg, var(--chakra-colors-green-400) 0%, var(--chakra-colors-green-500) 50%, var(--chakra-colors-green-600) 100%)',
    fallbackBg: 'green.600',
    borderColor: 'green.200',
    hoverBorderColor: 'green.400',
    badgeColorScheme: 'green',
    accentColor: 'green.500',
    accentDark: 'green.600',
    bgTint: 'green.50',
    iconBg: 'green.100',
    quantityBg: 'green.50',
    headerIcon: FaUndo,
    label: 'Return',
  },
  additional: {
    bgGradient: 'linear-gradient(135deg, var(--chakra-colors-purple-400) 0%, var(--chakra-colors-purple-500) 50%, var(--chakra-colors-purple-600) 100%)',
    fallbackBg: 'purple.600',
    borderColor: 'purple.200',
    hoverBorderColor: 'purple.400',
    badgeColorScheme: 'purple',
    accentColor: 'purple.500',
    accentDark: 'purple.600',
    bgTint: 'purple.50',
    iconBg: 'purple.100',
    quantityBg: 'purple.50',
    headerIcon: FaRoute,
    label: 'Additional',
  },
  default: {
    bgGradient: 'linear-gradient(135deg, var(--chakra-colors-purple-600) 0%, var(--chakra-colors-blue-500) 50%, var(--chakra-colors-purple-700) 100%)',
    fallbackBg: 'purple.600',
    borderColor: 'purple.200',
    hoverBorderColor: 'purple.400',
    badgeColorScheme: 'purple',
    accentColor: 'purple.500',
    accentDark: 'purple.600',
    bgTint: 'purple.50',
    iconBg: 'purple.100',
    quantityBg: 'purple.50',
    headerIcon: FaBox,
    label: 'Items',
  },
};

interface SelectedItemsCardProps {
  items: SelectedItem[];
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onRemove: (itemId: string) => void;
  isMultiLeg?: boolean;
  segmentLabel?: string;
  segmentType?: 'outbound' | 'return' | 'additional';
  showPricing?: boolean;
  readonly?: boolean;
}

export default function SelectedItemsCard({
  items,
  onIncrement,
  onDecrement,
  onRemove,
  isMultiLeg = false,
  segmentLabel,
  segmentType,
  showPricing = false,
  readonly = false,
}: SelectedItemsCardProps) {
  const toast = useToast();
  
  // Get color theme based on segment type
  const theme = colorThemes[segmentType || 'default'];

  // Get icon color based on theme
  const getIconColor = () => {
    switch (segmentType) {
      case 'outbound': return 'blue.600';
      case 'return': return 'green.600';
      case 'additional': return 'purple.600';
      default: return 'purple.600';
    }
  };

  // Get icon bg based on theme
  const getIconBg = () => {
    switch (segmentType) {
      case 'outbound': return 'blue.100';
      case 'return': return 'green.100';
      case 'additional': return 'purple.100';
      default: return 'purple.100';
    }
  };

  // Get icon based on item category
  const getCategoryIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('sofa') || categoryLower.includes('couch') || categoryLower.includes('living')) return MdOutlineWeekend;
    if (categoryLower.includes('bed') || categoryLower.includes('mattress') || categoryLower.includes('bedroom')) return FaBed;
    if (categoryLower.includes('chair') || categoryLower.includes('seat')) return MdOutlineChair;
    if (categoryLower.includes('table') || categoryLower.includes('dining')) return MdTableRestaurant;
    if (categoryLower.includes('desk') || categoryLower.includes('office')) return GiDesk;
    if (categoryLower.includes('cabinet') || categoryLower.includes('wardrobe') || categoryLower.includes('storage')) return BsArchive;
    if (categoryLower.includes('tv') || categoryLower.includes('television') || categoryLower.includes('electronic')) return FaTv;
    if (categoryLower.includes('kitchen') || categoryLower.includes('appliance')) return MdKitchen;
    if (categoryLower.includes('washing') || categoryLower.includes('machine')) return GiWashingMachine;
    if (categoryLower.includes('box') || categoryLower.includes('package')) return FaBoxOpen;
    if (categoryLower.includes('gym') || categoryLower.includes('weight') || categoryLower.includes('exercise')) return FaDumbbell;
    if (categoryLower.includes('bike') || categoryLower.includes('bicycle') || categoryLower.includes('cycle')) return FaBicycle;
    if (categoryLower.includes('music') || categoryLower.includes('instrument') || categoryLower.includes('guitar')) return FaGuitar;
    if (categoryLower.includes('art') || categoryLower.includes('paint') || categoryLower.includes('frame')) return FaPalette;
    if (categoryLower.includes('archive') || categoryLower.includes('document')) return FaArchive;
    return FaBox;
  };

  // Get gradient for category icon background
  const getCategoryGradient = () => {
    switch (segmentType) {
      case 'outbound': return 'linear-gradient(135deg, var(--chakra-colors-blue-50) 0%, var(--chakra-colors-blue-100) 100%)';
      case 'return': return 'linear-gradient(135deg, var(--chakra-colors-green-50) 0%, var(--chakra-colors-green-100) 100%)';
      case 'additional': return 'linear-gradient(135deg, var(--chakra-colors-purple-50) 0%, var(--chakra-colors-purple-100) 100%)';
      default: return 'linear-gradient(135deg, var(--chakra-colors-purple-50) 0%, var(--chakra-colors-purple-100) 100%)';
    }
  };

  if (!items || items.length === 0) {
    return (
      <ScaleFade initialScale={0.95} in>
        <Card
          bg={getCategoryGradient()}
          borderWidth="2px"
          borderColor={theme.borderColor}
          borderStyle="dashed"
          overflow="hidden"
          borderRadius="xl"
          _hover={{ borderColor: theme.hoverBorderColor, transform: 'scale(1.01)' }}
          transition="all 0.3s ease"
        >
          <CardBody py={{ base: 8, md: 10 }}>
            <VStack spacing={5}>
              <Box
                position="relative"
                w="90px"
                h="90px"
                borderRadius="2xl"
                bg="bg.surface"
                boxShadow="0 8px 25px rgba(0,0,0,0.1)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                _before={{
                  content: '""',
                  position: 'absolute',
                  inset: '-3px',
                  borderRadius: '2xl',
                  padding: '3px',
                  background: theme.bgGradient,
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              >
                <Icon 
                  as={MdOutlineInventory2} 
                  boxSize={12} 
                  color={theme.accentColor}
                  animation={`${pulseAnimation} 2s ease-in-out infinite`}
                />
              </Box>
              <VStack spacing={2}>
                <Text color="text.primary" fontSize="lg" fontWeight="bold">
                  No items selected
                </Text>
                <Text color="text.secondary" fontSize="sm" textAlign="center" maxW="200px">
                  {isMultiLeg && segmentLabel 
                    ? `Add items for ${segmentLabel}`
                    : 'Browse the catalog above to add items'
                  }
                </Text>
                <HStack spacing={1} mt={1}>
                  <Icon as={FaArrowRight} boxSize={3} color={theme.accentColor} />
                  <Text fontSize="xs" color={theme.accentColor} fontWeight="medium">
                    Scroll up to browse
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </ScaleFade>
    );
  }

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeight = items.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const totalPrice = showPricing ? items.reduce((sum, item) => sum + (item.totalPrice || 0), 0) : 0;

  return (
    <ScaleFade initialScale={0.98} in>
      <VStack spacing={4} align="stretch" w="100%">
        {/* Header - Single Line Layout */}
        <Card
                bg={theme.fallbackBg}
          bgGradient={theme.bgGradient}
          borderWidth="2px"
          borderColor={theme.accentColor}
          borderRadius="xl"
          overflow="hidden"
          boxShadow="xl"
        >
          <CardBody py={{ base: 3, sm: 4, md: 5 }} px={{ base: 3, sm: 4, md: 5 }}>
            <Flex 
              direction="column"
              gap={{ base: 2, sm: 2.5 }}
            >
              {/* Title Row - Single Line */}
              <Text 
                fontSize={{ base: 'lg', sm: 'xl', md: '2xl' }} 
                fontWeight="900"
                color="white"
                letterSpacing="tight"
                whiteSpace="nowrap"
                overflow="hidden"
                textOverflow="ellipsis"
                lineHeight="1.2"
              >
                {segmentLabel || 'Selected Items'}
              </Text>
              
              {/* Meta Row - Single Line with Bullet Separators */}
              <Flex
                direction="row"
                align="center"
                gap={{ base: 2, sm: 2.5, md: 3 }}
                flexWrap="nowrap"
                overflow="hidden"
              >
                <HStack spacing={1} flexShrink={0}>
                  <Icon as={FaCubes} boxSize={{ base: 3, sm: 3.5, md: 4 }} color="white" />
                  <Text 
                    fontSize={{ base: 'xs', sm: 'sm', md: 'sm' }} 
                    fontWeight="700" 
                    color="white"
                    whiteSpace="nowrap"
                  >
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </Text>
                </HStack>
                <Text color="whiteAlpha.700" fontSize={{ base: 'xs', sm: 'sm' }} flexShrink={0}>•</Text>
                <HStack spacing={1} flexShrink={0}>
                  <Icon as={FaBox} boxSize={{ base: 3, sm: 3.5, md: 4 }} color="white" />
                  <Text 
                    fontSize={{ base: 'xs', sm: 'sm', md: 'sm' }} 
                    fontWeight="700" 
                    color="white"
                    whiteSpace="nowrap"
                  >
                    {totalQuantity} qty
                  </Text>
                </HStack>
                <Text color="whiteAlpha.700" fontSize={{ base: 'xs', sm: 'sm' }} flexShrink={0}>•</Text>
                <HStack spacing={1} flexShrink={0}>
                  <Icon as={FaWeight} boxSize={{ base: 3, sm: 3.5, md: 4 }} color="white" />
                  <Text 
                    fontSize={{ base: 'xs', sm: 'sm', md: 'sm' }} 
                    fontWeight="700" 
                    color="white"
                    whiteSpace="nowrap"
                  >
                    {totalWeight.toFixed(0)} kg
                  </Text>
                </HStack>
                {showPricing && totalPrice > 0 && (
                  <>
                    <Text color="whiteAlpha.700" fontSize={{ base: 'xs', sm: 'sm' }} flexShrink={0}>•</Text>
                    <Box
                      bg="whiteAlpha.200"
                      px={{ base: 2, sm: 2.5, md: 3 }}
                      py={{ base: 1, sm: 1.5 }}
                      borderRadius="md"
                      flexShrink={0}
                    >
                      <Text 
                        fontSize={{ base: 'xs', sm: 'sm', md: 'md' }} 
                        fontWeight="800" 
                        color="white"
                        whiteSpace="nowrap"
                      >
                        £{totalPrice.toFixed(2)}
                      </Text>
                    </Box>
                  </>
                )}
              </Flex>
            </Flex>
          </CardBody>
        </Card>

        {/* Items List */}
        <VStack spacing={3} align="stretch" w="100%">
          {items.map((item, index) => (
            <ScaleFade key={`${item.id}-${index}`} initialScale={0.98} in delay={index * 0.05}>
              <Card
                bg="bg.surface"
                borderWidth="2px"
                borderColor={theme.borderColor}
                borderRadius="xl"
                overflow="hidden"
                transition="all 0.25s ease"
                _hover={{
                  borderColor: theme.hoverBorderColor,
                  shadow: 'lg',
                  transform: 'translateY(-2px)',
                }}
              >
                <CardBody p={{ base: 2, sm: 3, md: 4 }}>
                  <Flex 
                    gap={{ base: 1.5, sm: 2.5, md: 4 }} 
                    align="center" 
                    flexWrap="nowrap" 
                    overflow="visible"
                    direction="row"
                    w="100%"
                  >
                    {/* Left: Thumbnail */}
                    <Box 
                      position="relative" 
                      flexShrink={0}
                      w={{ base: '50px', sm: '60px', md: '85px' }}
                      h={{ base: '50px', sm: '60px', md: '85px' }}
                      minW={{ base: '50px', sm: '60px', md: '85px' }}
                    >
                      {item.image ? (
                        <Box
                          position="relative"
                          w="100%"
                          h="100%"
                          borderRadius={{ base: 'lg', md: 'xl' }}
                          overflow="hidden"
                          bg="bg.surface.elevated"
                          boxShadow="0 2px 8px rgba(0,0,0,0.1)"
                        >
                          <NextImage
                            src={item.image}
                            alt={item.name}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                          <Badge
                            position="absolute"
                            bottom={1}
                            right={1}
                            colorScheme={theme.badgeColorScheme}
                            borderRadius="full"
                            px={1.5}
                            fontSize={{ base: '9px', sm: '10px', md: 'xs' }}
                            boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                            fontWeight="800"
                          >
                            ×{item.quantity}
                          </Badge>
                        </Box>
                      ) : (
                        <Box
                          position="relative"
                          w="100%"
                          h="100%"
                          borderRadius={{ base: 'lg', md: 'xl' }}
                          bg={getCategoryGradient()}
                          boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          overflow="hidden"
                        >
                          <Icon 
                            as={getCategoryIcon(item.category)} 
                            boxSize={{ base: 5, sm: 6, md: 7 }} 
                            color={getIconColor()}
                          />
                          <Badge
                            position="absolute"
                            bottom={1}
                            right={1}
                            colorScheme={theme.badgeColorScheme}
                            borderRadius="full"
                            px={1.5}
                            fontSize={{ base: '9px', sm: '10px', md: 'xs' }}
                            boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                            fontWeight="800"
                          >
                            ×{item.quantity}
                          </Badge>
                        </Box>
                      )}
                    </Box>

                    {/* Middle: Item Name (Truncated) */}
                    <Box 
                      flex={1} 
                      minW={0}
                      overflow="hidden"
                      pr={{ base: 1, sm: 2 }}
                    >
                      <Text 
                        fontWeight="700" 
                        fontSize={{ base: 'sm', sm: 'md', md: 'lg' }} 
                        color="text.primary" 
                        noOfLines={1}
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        lineHeight="1.3"
                      >
                        {item.name}
                      </Text>
                      <HStack 
                        spacing={1.5} 
                        mt={0.5}
                        flexWrap="nowrap"
                        overflow="hidden"
                      >
                        <Badge 
                          colorScheme={theme.badgeColorScheme} 
                          fontSize={{ base: '9px', sm: '10px', md: 'xs' }}
                          px={{ base: 1, sm: 1.5 }}
                          py={0.5}
                          borderRadius="full"
                          textTransform="capitalize"
                          flexShrink={0}
                          whiteSpace="nowrap"
                        >
                          {item.category}
                        </Badge>
                        <HStack spacing={0.5} color="text.tertiary" fontSize={{ base: '10px', sm: '11px', md: 'xs' }} flexShrink={0}>
                          <Icon as={FaWeight} boxSize={{ base: 2.5, sm: 3 }} />
                          <Text whiteSpace="nowrap">{item.weight} kg</Text>
                        </HStack>
                      </HStack>
                    </Box>

                    {/* Right: Quantity Controls + Delete */}
                    {!readonly && (
                      <VStack 
                        spacing={{ base: 1, sm: 1.5 }} 
                        align="center" 
                        flexShrink={0}
                      >
                        {/* Quantity Controls */}
                        <HStack
                          spacing={0}
                          bg={theme.quantityBg}
                          borderRadius="full"
                          p={{ base: 0.5, sm: 1 }}
                          boxShadow="inset 0 2px 4px rgba(0,0,0,0.06)"
                          flexShrink={0}
                        >
                          <IconButton
                            aria-label="Decrease quantity"
                            icon={<FaMinus />}
                            size={{ base: 'xs', sm: 'sm' }}
                            colorScheme="gray"
                            variant="ghost"
                            borderRadius="full"
                            onClick={() => {
                              if (item.quantity > 1) {
                                onDecrement(item.id);
                              } else {
                                toast({
                                  title: 'Remove item?',
                                  description: 'Use the delete button to remove this item.',
                                  status: 'info',
                                  duration: 2000,
                                  isClosable: true,
                                });
                              }
                            }}
                            isDisabled={item.quantity <= 1}
                            minW={{ base: '24px', sm: '28px' }}
                            h={{ base: '24px', sm: '28px' }}
                          />
                          
                          <Box
                            px={{ base: 2, sm: 2.5 }}
                            minW={{ base: '32px', sm: '40px' }}
                            textAlign="center"
                          >
                            <Text
                              fontWeight="800"
                              fontSize={{ base: 'sm', sm: 'md', md: 'lg' }}
                              color={theme.accentDark}
                              lineHeight="1"
                            >
                              {item.quantity}
                            </Text>
                          </Box>
                          
                          <IconButton
                            aria-label="Increase quantity"
                            icon={<FaPlus />}
                            size={{ base: 'xs', sm: 'sm' }}
                            colorScheme={theme.badgeColorScheme}
                            variant="ghost"
                            borderRadius="full"
                            onClick={() => onIncrement(item.id)}
                            minW={{ base: '24px', sm: '28px' }}
                            h={{ base: '24px', sm: '28px' }}
                          />
                        </HStack>

                        {/* Delete Button - Below quantity controls */}
                        <IconButton
                          aria-label="Remove item"
                          icon={<FaTrash />}
                          size={{ base: 'xs', sm: 'sm' }}
                          colorScheme="red"
                          variant="solid"
                          borderRadius="full"
                          onClick={() => {
                            onRemove(item.id);
                            toast({
                              title: 'Item removed',
                              description: `${item.name} removed from selection`,
                              status: 'success',
                              duration: 2000,
                              isClosable: true,
                            });
                          }}
                          minW={{ base: '28px', sm: '32px' }}
                          h={{ base: '28px', sm: '32px' }}
                          _hover={{
                            transform: 'scale(1.1)',
                          }}
                        />
                      </VStack>
                    )}

                    {readonly && (
                      <Box
                        bg={theme.quantityBg}
                        px={{ base: 3, sm: 4 }}
                        py={{ base: 2, sm: 2.5 }}
                        borderRadius="xl"
                        textAlign="center"
                        minW={{ base: '60px', sm: '70px', md: '80px' }}
                        flexShrink={0}
                      >
                        <Text
                          fontWeight="800"
                          fontSize={{ base: 'lg', sm: 'xl', md: '2xl' }}
                          color={theme.accentDark}
                          lineHeight="1"
                        >
                          {item.quantity}
                        </Text>
                        <Text fontSize={{ base: '10px', sm: '11px', md: 'xs' }} color="text.tertiary" mt={0.5} whiteSpace="nowrap">
                          Qty
                        </Text>
                      </Box>
                    )}
                  </Flex>

              {showPricing && item.totalPrice && (
                <>
                  <Divider my={3} borderColor={theme.borderColor} />
                  <Flex justify="space-between" align="center" px={1}>
                    <HStack spacing={2}>
                      <Text fontSize="sm" color="text.secondary">
                        Subtotal
                      </Text>
                      <Text fontSize="xs" color="text.tertiary">
                        ({item.quantity} × £{item.unitPrice?.toFixed(2)})
                      </Text>
                    </HStack>
                    <Text fontSize="lg" fontWeight="bold" color={theme.accentDark}>
                      £{item.totalPrice.toFixed(2)}
                    </Text>
                  </Flex>
                </>
              )}
                </CardBody>
              </Card>
            </ScaleFade>
          ))}
        </VStack>

        {/* Summary Footer */}
        {showPricing && totalPrice > 0 && (
          <Card
            bg={getCategoryGradient()}
            borderWidth="2px"
            borderColor={theme.borderColor}
            borderRadius="xl"
            overflow="hidden"
            boxShadow="0 4px 15px rgba(0,0,0,0.08)"
          >
            <CardBody py={4} px={5}>
              <Flex justify="space-between" align="center">
                <HStack spacing={4}>
                  <Box
                    position="relative"
                    w="50px"
                    h="50px"
                    borderRadius="xl"
                    bg="bg.surface"
                    boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Icon 
                      as={FaShoppingCart} 
                      boxSize={6} 
                      color={theme.accentColor}
                      animation={`${pulseAnimation} 2s ease-in-out infinite`}
                    />
                    <Badge
                      position="absolute"
                      top={-1}
                      right={-1}
                      colorScheme={theme.badgeColorScheme}
                      borderRadius="full"
                      fontSize="xs"
                      minW="20px"
                      textAlign="center"
                    >
                      {totalQuantity}
                    </Badge>
                  </Box>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="md" color="text.primary" fontWeight="bold">
                      Items Total
                    </Text>
                    <HStack spacing={2} fontSize="sm" color="text.secondary">
                      <HStack spacing={1}>
                        <Icon as={FaCubes} boxSize={3} />
                        <Text>{items.length} types</Text>
                      </HStack>
                      <Text>•</Text>
                      <HStack spacing={1}>
                        <Icon as={FaWeight} boxSize={3} />
                        <Text>{totalWeight.toFixed(0)} kg</Text>
                      </HStack>
                    </HStack>
                  </VStack>
                </HStack>
                <Box 
                  textAlign="right"
                  bg="bg.surface"
                  px={4}
                  py={2}
                  borderRadius="xl"
                  boxShadow="0 2px 8px rgba(0,0,0,0.08)"
                >
                  <Text fontSize="xs" color="text.tertiary">Estimated</Text>
                  <Text fontSize="2xl" fontWeight="bold" color={theme.accentDark}>
                    £{totalPrice.toFixed(2)}
                  </Text>
                </Box>
              </Flex>
            </CardBody>
          </Card>
        )}
      </VStack>
    </ScaleFade>
  );
}
