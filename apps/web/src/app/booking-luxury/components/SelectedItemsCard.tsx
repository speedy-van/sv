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
    bgGradient: 'linear(135deg, #4299e1 0%, #3182ce 50%, #2b6cb0 100%)',
    fallbackBg: '#3182ce',
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
    bgGradient: 'linear(135deg, #48bb78 0%, #38a169 50%, #2f855a 100%)',
    fallbackBg: '#38a169',
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
    bgGradient: 'linear(135deg, #b794f4 0%, #9f7aea 50%, #805ad5 100%)',
    fallbackBg: '#9f7aea',
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
    bgGradient: 'linear(135deg, #805ad5 0%, #667eea 50%, #764ba2 100%)',
    fallbackBg: '#667eea',
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
      case 'outbound': return '#3182CE';
      case 'return': return '#38A169';
      case 'additional': return '#9F7AEA';
      default: return '#8B5CF6';
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
      case 'outbound': return 'linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%)';
      case 'return': return 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)';
      case 'additional': return 'linear-gradient(135deg, #faf5ff 0%, #e9d8fd 100%)';
      default: return 'linear-gradient(135deg, #faf5ff 0%, #e9d8fd 100%)';
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
          <CardBody py={10}>
            <VStack spacing={5}>
              <Box
                position="relative"
                w="90px"
                h="90px"
                borderRadius="2xl"
                bg="white"
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
                <Text color="gray.700" fontSize="lg" fontWeight="bold">
                  No items selected
                </Text>
                <Text color="gray.500" fontSize="sm" textAlign="center" maxW="200px">
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
        {/* Header */}
        <Card
          bg={theme.fallbackBg}
          bgGradient={theme.bgGradient}
          color="white"
          borderRadius="xl"
          overflow="hidden"
          boxShadow="0 4px 20px rgba(0,0,0,0.15)"
          sx={{
            WebkitBackgroundClip: 'padding-box',
            backgroundClip: 'padding-box',
          }}
        >
          <CardBody py={{ base: 4, md: 5 }} px={{ base: 4, md: 5 }}>
            <Flex 
              justify="space-between" 
              align={{ base: 'start', sm: 'center' }}
              direction={{ base: 'column', sm: 'row' }}
              gap={{ base: 3, sm: 0 }}
            >
              <HStack spacing={3}>
                <Circle 
                  size={{ base: '44px', md: '50px' }} 
                  bg="whiteAlpha.200"
                  backdropFilter="blur(8px)"
                >
                  <Icon as={theme.headerIcon} boxSize={{ base: 5, md: 6 }} />
                </Circle>
                <VStack align="start" spacing={0}>
                  <HStack spacing={2}>
                    <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold">
                      {segmentLabel || 'Selected Items'}
                    </Text>
                  </HStack>
                  <HStack spacing={3} mt={1} flexWrap="wrap">
                    <HStack spacing={1}>
                      <Icon as={FaCubes} boxSize={3} opacity={0.8} />
                      <Text fontSize={{ base: 'xs', md: 'sm' }} opacity={0.9}>
                        {items.length} {items.length === 1 ? 'item' : 'items'}
                      </Text>
                    </HStack>
                    <HStack spacing={1}>
                      <Icon as={FaBox} boxSize={3} opacity={0.8} />
                      <Text fontSize={{ base: 'xs', md: 'sm' }} opacity={0.9}>
                        {totalQuantity} qty
                      </Text>
                    </HStack>
                    <HStack spacing={1}>
                      <Icon as={FaWeight} boxSize={3} opacity={0.8} />
                      <Text fontSize={{ base: 'xs', md: 'sm' }} opacity={0.9}>
                        {totalWeight.toFixed(0)} kg
                      </Text>
                    </HStack>
                  </HStack>
                </VStack>
              </HStack>
              {showPricing && totalPrice > 0 && (
                <Box
                  bg="whiteAlpha.200"
                  backdropFilter="blur(8px)"
                  px={4}
                  py={2}
                  borderRadius="lg"
                >
                  <VStack align={{ base: 'start', sm: 'end' }} spacing={0}>
                    <Text fontSize="xs" opacity={0.8}>Estimated</Text>
                    <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="bold">
                      £{totalPrice.toFixed(2)}
                    </Text>
                  </VStack>
                </Box>
              )}
            </Flex>
          </CardBody>
        </Card>

        {/* Items List */}
        <VStack spacing={3} align="stretch" w="100%">
          {items.map((item, index) => (
            <ScaleFade key={`${item.id}-${index}`} initialScale={0.98} in delay={index * 0.05}>
              <Card
                bg="white"
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
                <CardBody p={{ base: 3, md: 4 }}>
                  <Flex gap={{ base: 3, md: 4 }} align="center" flexWrap={{ base: 'wrap', sm: 'nowrap' }}>
                    {/* Image with overlay badge */}
                    <Box position="relative" flexShrink={0}>
                      {item.image ? (
                        <Box
                          position="relative"
                          w={{ base: '70px', md: '85px' }}
                          h={{ base: '70px', md: '85px' }}
                          borderRadius="xl"
                          overflow="hidden"
                          bg="gray.100"
                          boxShadow="0 2px 8px rgba(0,0,0,0.1)"
                        >
                          <NextImage
                            src={item.image}
                            alt={item.name}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                          {/* Quantity badge on image */}
                          <Badge
                            position="absolute"
                            bottom={1}
                            right={1}
                            colorScheme={theme.badgeColorScheme}
                            borderRadius="full"
                            px={2}
                            fontSize="xs"
                            boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                          >
                            ×{item.quantity}
                          </Badge>
                        </Box>
                      ) : (
                        <Box
                          position="relative"
                          w={{ base: '70px', md: '85px' }}
                          h={{ base: '70px', md: '85px' }}
                          borderRadius="xl"
                          bg={getCategoryGradient()}
                          boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          overflow="hidden"
                          _before={{
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: 'xl',
                            border: '2px solid',
                            borderColor: theme.borderColor,
                            opacity: 0.5,
                          }}
                        >
                          <Icon 
                            as={getCategoryIcon(item.category)} 
                            boxSize={{ base: 7, md: 9 }} 
                            color={theme.accentColor}
                            animation={`${floatAnimation} 3s ease-in-out infinite`}
                          />
                          {/* Quantity badge */}
                          <Badge
                            position="absolute"
                            bottom={1}
                            right={1}
                            colorScheme={theme.badgeColorScheme}
                            borderRadius="full"
                            px={2}
                            fontSize="xs"
                            boxShadow="0 2px 4px rgba(0,0,0,0.2)"
                          >
                            ×{item.quantity}
                          </Badge>
                        </Box>
                      )}
                    </Box>

                    {/* Info */}
                    <VStack align="start" spacing={1.5} flex={1} minW={0}>
                      <Text fontWeight="bold" fontSize={{ base: 'md', md: 'lg' }} color="gray.800" noOfLines={2}>
                        {item.name}
                      </Text>
                      <HStack spacing={2} flexWrap="wrap">
                        <Badge 
                          colorScheme={theme.badgeColorScheme} 
                          fontSize="xs"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          textTransform="capitalize"
                        >
                          {item.category}
                        </Badge>
                        <HStack spacing={1} color="gray.500" fontSize="xs">
                          <Icon as={FaWeight} boxSize={3} />
                          <Text>{item.weight} kg</Text>
                        </HStack>
                      </HStack>
                      {item.description && (
                        <Text fontSize="xs" color="gray.500" noOfLines={1}>
                          {item.description}
                        </Text>
                      )}
                      {showPricing && item.unitPrice && (
                        <Text fontSize="sm" color={theme.accentDark} fontWeight="medium">
                          £{item.unitPrice.toFixed(2)} each
                        </Text>
                      )}
                    </VStack>

                    {/* Controls */}
                    {!readonly && (
                      <VStack spacing={3} align="center">
                        <HStack
                          spacing={0}
                          bg={theme.quantityBg}
                          borderRadius="full"
                          p={1}
                          boxShadow="inset 0 2px 4px rgba(0,0,0,0.06)"
                        >
                          <Tooltip label="Decrease" placement="top" hasArrow>
                            <IconButton
                              aria-label="Decrease quantity"
                              icon={<FaMinus />}
                              size="sm"
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
                            />
                          </Tooltip>
                          
                          <Box
                            px={3}
                            py={1}
                            minW="45px"
                            textAlign="center"
                          >
                            <Text
                              fontWeight="bold"
                              fontSize="lg"
                              color={theme.accentDark}
                            >
                              {item.quantity}
                            </Text>
                          </Box>
                          
                          <Tooltip label="Increase" placement="top" hasArrow>
                            <IconButton
                              aria-label="Increase quantity"
                              icon={<FaPlus />}
                              size="sm"
                              colorScheme={theme.badgeColorScheme}
                              variant="ghost"
                              borderRadius="full"
                              onClick={() => onIncrement(item.id)}
                            />
                          </Tooltip>
                        </HStack>

                        <Tooltip label="Remove item" placement="top" hasArrow>
                          <IconButton
                            aria-label="Remove item"
                            icon={<FaTrash />}
                            size="sm"
                            colorScheme="red"
                            variant="ghost"
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
                          />
                        </Tooltip>
                      </VStack>
                    )}

                    {readonly && (
                      <Box
                        bg={theme.quantityBg}
                        px={4}
                        py={3}
                        borderRadius="xl"
                        textAlign="center"
                        minW="80px"
                      >
                        <Text
                          fontWeight="bold"
                          fontSize="2xl"
                          color={theme.accentDark}
                          lineHeight="1"
                        >
                          {item.quantity}
                        </Text>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          Quantity
                        </Text>
                      </Box>
                    )}
                  </Flex>

              {showPricing && item.totalPrice && (
                <>
                  <Divider my={3} borderColor={theme.borderColor} />
                  <Flex justify="space-between" align="center" px={1}>
                    <HStack spacing={2}>
                      <Text fontSize="sm" color="gray.600">
                        Subtotal
                      </Text>
                      <Text fontSize="xs" color="gray.500">
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
                    bg="white"
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
                    <Text fontSize="md" color="gray.800" fontWeight="bold">
                      Items Total
                    </Text>
                    <HStack spacing={2} fontSize="sm" color="gray.600">
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
                  bg="white"
                  px={4}
                  py={2}
                  borderRadius="xl"
                  boxShadow="0 2px 8px rgba(0,0,0,0.08)"
                >
                  <Text fontSize="xs" color="gray.500">Estimated</Text>
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
