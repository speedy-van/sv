'use client';

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Portal,
  Collapse,
  Icon,
  Badge,
  Flex,
  Circle,
} from '@chakra-ui/react';
import { FaChevronDown, FaHandsHelping, FaMapMarkerAlt } from 'react-icons/fa';
import type { FormData, CollectionSource } from '../hooks/useBookingForm';

// Enhanced collection source options with colors
const collectionSourceOptions = [
  { value: '', label: 'Select where you\'re collecting from', icon: '📍', color: 'gray.500', description: 'Optional - helps us prepare' },
  { value: 'marketplace', label: 'Online Marketplace', icon: '🛒', color: 'blue.400', description: 'Facebook, Gumtree, eBay' },
  { value: 'private-address', label: 'Private Address', icon: '🏠', color: 'green.400', description: 'Home or Office' },
  { value: 'retail-store', label: 'Retail Store', icon: '🏪', color: 'orange.400', description: 'IKEA, DFS, Currys, etc.' },
  { value: 'storage-unit', label: 'Storage Unit', icon: '📦', color: 'purple.400', description: 'Self-storage facility' },
  { value: 'charity-shop', label: 'Charity Shop', icon: '💚', color: 'pink.400', description: 'Donation pickup' },
  { value: 'auction', label: 'Auction House', icon: '🔨', color: 'yellow.400', description: 'Auction collection' },
  { value: 'friend-family', label: 'Friend / Family', icon: '👨‍👩‍👧', color: 'cyan.400', description: 'Personal collection' },
];

// Platform options with brand colors
const platformOptions = [
  { value: 'facebook', label: 'Facebook Marketplace', icon: '📘', color: '#1877F2' },
  { value: 'gumtree', label: 'Gumtree', icon: '🟢', color: '#72EF36' },
  { value: 'ebay', label: 'eBay', icon: '🔵', color: '#E53238' },
  { value: 'shpock', label: 'Shpock', icon: '🟣', color: '#8B5CF6' },
  { value: 'preloved', label: 'Preloved', icon: '💜', color: '#9333EA' },
  { value: 'other', label: 'Other Platform', icon: '📱', color: '#6B7280' },
];

interface MarketplacePickupOptionsProps {
  formData: FormData;
  updateFormData: (step: keyof FormData, data: Partial<FormData[keyof FormData]>) => void;
}

export default function MarketplacePickupOptions({
  formData,
  updateFormData,
}: MarketplacePickupOptionsProps) {
  const currentSource = formData.step1.collectionSource || '';
  const isMarketplace = currentSource === 'marketplace';
  const marketplaceData = formData.step1.marketplacePickup;
  const currentOption = collectionSourceOptions.find(o => o.value === currentSource);

  const handleSourceChange = (source: string) => {
    updateFormData('step1', { collectionSource: (source || 'private-address') as CollectionSource });
    
    // If switching to marketplace, auto-set 2-man crew for heavy items
    if (source === 'marketplace' && formData.step1.crewSize === '1') {
      updateFormData('step1', { crewSize: '2' });
    }
  };

  const handleMarketplaceUpdate = (field: string, value: unknown) => {
    updateFormData('step1', {
      marketplacePickup: {
        ...marketplaceData,
        [field]: value,
      },
    });
  };

  return (
    <VStack spacing={4} w="full" align="stretch">
      {/* Collection Source Card */}
      <Box
        bg="linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)"
        borderRadius="xl"
        p={{ base: 4, md: 5 }}
        borderWidth="1px"
        borderColor="whiteAlpha.100"
        position="relative"
        overflow="hidden"
      >
        {/* Decorative gradient accent */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          h="3px"
          bgGradient="linear(to-r, blue.400, purple.500, pink.400)"
        />

        <VStack spacing={4} align="stretch">
          {/* Header */}
          <HStack spacing={3}>
            <Circle size="36px" bg="whiteAlpha.100">
              <Icon as={FaMapMarkerAlt} color="blue.300" boxSize={4} />
            </Circle>
            <Box>
              <Text fontWeight="600" color="white" fontSize={{ base: 'sm', md: 'md' }}>
                Collection Point
              </Text>
              <Text fontSize="xs" color="whiteAlpha.600">
                Where are we picking up your items?
              </Text>
            </Box>
            <Badge 
              ml="auto" 
              colorScheme="blue" 
              variant="subtle" 
              fontSize="2xs"
              px={2}
            >
              Optional
            </Badge>
          </HStack>

          {/* Collection Source Menu */}
          <FormControl>
            <Menu matchWidth placement="bottom-start" flip preventOverflow>
              <MenuButton
                as={Button}
                w="full"
                bg="whiteAlpha.50"
                borderWidth="1px"
                borderColor={currentSource ? (currentOption?.color || 'blue.400') : 'whiteAlpha.200'}
                color="white"
                fontWeight="normal"
                textAlign="left"
                justifyContent="space-between"
                rightIcon={<Icon as={FaChevronDown} color="gray.400" boxSize={3} />}
                _hover={{ bg: 'whiteAlpha.100', borderColor: 'blue.400' }}
                _active={{ bg: 'whiteAlpha.150' }}
                _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                px={4}
                py={3}
                h="auto"
                minH="56px"
                borderRadius="lg"
                transition="all 0.2s"
              >
                <HStack spacing={3}>
                  <Circle 
                    size="32px" 
                    bg={currentSource ? `${currentOption?.color?.split('.')[0]}.900` : 'whiteAlpha.100'}
                    opacity={currentSource ? 1 : 0.5}
                  >
                    <Text fontSize="lg">{currentOption?.icon || '📍'}</Text>
                  </Circle>
                  <Box>
                    <Text fontSize="sm" fontWeight="500" noOfLines={1}>
                      {currentOption?.label || 'Select collection point'}
                    </Text>
                    {currentSource && (
                      <Text fontSize="xs" color="whiteAlpha.600" noOfLines={1}>
                        {currentOption?.description}
                      </Text>
                    )}
                  </Box>
                </HStack>
              </MenuButton>
              <Portal>
                <MenuList
                  bg="gray.900"
                  borderColor="whiteAlpha.200"
                  boxShadow="0 25px 50px -12px rgba(0,0,0,0.6)"
                  maxH="350px"
                  overflowY="auto"
                  zIndex={9999}
                  py={2}
                  borderRadius="xl"
                  sx={{
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { bg: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { bg: 'whiteAlpha.300', borderRadius: 'full' },
                  }}
                >
                  {collectionSourceOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      onClick={() => handleSourceChange(option.value)}
                      bg={currentSource === option.value ? 'blue.600' : 'transparent'}
                      color="white"
                      _hover={{ bg: currentSource === option.value ? 'blue.500' : 'whiteAlpha.100' }}
                      _focus={{ bg: currentSource === option.value ? 'blue.500' : 'whiteAlpha.100' }}
                      px={4}
                      py={3}
                      borderRadius="md"
                      mx={2}
                      my={0.5}
                      transition="all 0.15s"
                    >
                      <HStack spacing={3} w="full">
                        <Circle 
                          size="36px" 
                          bg={currentSource === option.value ? 'whiteAlpha.200' : `${option.color?.split('.')[0]}.900`}
                        >
                          <Text fontSize="lg">{option.icon}</Text>
                        </Circle>
                        <Box flex={1}>
                          <Text fontSize="sm" fontWeight="500">{option.label}</Text>
                          <Text fontSize="xs" color={currentSource === option.value ? 'whiteAlpha.800' : 'whiteAlpha.500'}>
                            {option.description}
                          </Text>
                        </Box>
                        {currentSource === option.value && (
                          <Circle size="20px" bg="white">
                            <Text fontSize="xs">✓</Text>
                          </Circle>
                        )}
                      </HStack>
                    </MenuItem>
                  ))}
                </MenuList>
              </Portal>
            </Menu>
          </FormControl>
        </VStack>
      </Box>

      {/* Marketplace Details - Animated expansion */}
      <Collapse in={isMarketplace} animateOpacity>
        <Box
          bg="linear-gradient(145deg, rgba(37, 99, 235, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)"
          borderRadius="xl"
          p={{ base: 4, md: 5 }}
          borderWidth="1px"
          borderColor="blue.500"
          position="relative"
          overflow="hidden"
          boxShadow="0 0 30px rgba(59, 130, 246, 0.1)"
        >
          {/* Header */}
          <HStack spacing={3} mb={5}>
            <Circle size="40px" bg="blue.500">
              <Text fontSize="xl">🛒</Text>
            </Circle>
            <Box flex={1}>
              <Text fontWeight="700" color="white" fontSize={{ base: 'md', md: 'lg' }}>
                Marketplace Pickup
              </Text>
              <Text fontSize="xs" color="blue.200">
                Help us coordinate with the seller
              </Text>
            </Box>
          </HStack>

          <VStack spacing={5} align="stretch">
            {/* Platform Selection - Card style */}
            <Box>
              <Text fontSize="sm" fontWeight="600" color="whiteAlpha.800" mb={3}>
                Which platform? <Text as="span" color="whiteAlpha.500" fontWeight="normal">(Optional)</Text>
              </Text>
              <Flex flexWrap="wrap" gap={2}>
                {platformOptions.map((platform) => (
                  <Button
                    key={platform.value}
                    size="sm"
                    variant={marketplaceData?.platformSource === platform.value ? 'solid' : 'outline'}
                    bg={marketplaceData?.platformSource === platform.value ? platform.color : 'transparent'}
                    borderColor={marketplaceData?.platformSource === platform.value ? platform.color : 'whiteAlpha.300'}
                    color="white"
                    onClick={() => handleMarketplaceUpdate('platformSource', platform.value)}
                    _hover={{ 
                      bg: marketplaceData?.platformSource === platform.value ? platform.color : 'whiteAlpha.100',
                      borderColor: platform.color,
                      transform: 'translateY(-1px)',
                    }}
                    transition="all 0.2s"
                    borderRadius="full"
                    px={4}
                    leftIcon={<Text fontSize="sm">{platform.icon}</Text>}
                  >
                    {platform.label}
                  </Button>
                ))}
              </Flex>
            </Box>

            {/* Divider with text */}
            <HStack>
              <Box flex={1} h="1px" bg="whiteAlpha.200" />
              <Text fontSize="xs" color="whiteAlpha.400" px={3}>SELLER DETAILS</Text>
              <Box flex={1} h="1px" bg="whiteAlpha.200" />
            </HStack>

            {/* Seller Contact - Side by side on desktop */}
            <Flex 
              direction={{ base: 'column', md: 'row' }} 
              gap={4}
            >
              <FormControl flex={1}>
                <FormLabel color="whiteAlpha.700" fontSize="xs" fontWeight="500" mb={2}>
                  Seller Name
                </FormLabel>
                <Input
                  value={marketplaceData?.sellerContactName || ''}
                  onChange={(e) => handleMarketplaceUpdate('sellerContactName', e.target.value)}
                  placeholder="e.g. John Smith"
                  bg="whiteAlpha.50"
                  borderColor="whiteAlpha.200"
                  color="white"
                  size="md"
                  _hover={{ borderColor: 'blue.400' }}
                  _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                  _placeholder={{ color: 'whiteAlpha.400' }}
                  borderRadius="lg"
                />
              </FormControl>

              <FormControl flex={1}>
                <FormLabel color="whiteAlpha.700" fontSize="xs" fontWeight="500" mb={2}>
                  Seller Phone
                </FormLabel>
                <Input
                  value={marketplaceData?.sellerPhone || ''}
                  onChange={(e) => handleMarketplaceUpdate('sellerPhone', e.target.value)}
                  placeholder="07xxx xxx xxx"
                  bg="whiteAlpha.50"
                  borderColor="whiteAlpha.200"
                  color="white"
                  type="tel"
                  size="md"
                  _hover={{ borderColor: 'blue.400' }}
                  _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                  _placeholder={{ color: 'whiteAlpha.400' }}
                  borderRadius="lg"
                />
              </FormControl>
            </Flex>

            {/* Loading Help Toggle - Enhanced card style */}
            <Box
              bg={marketplaceData?.sellerHelpsLoading ? 'green.900' : 'whiteAlpha.50'}
              borderRadius="xl"
              p={4}
              borderWidth="1px"
              borderColor={marketplaceData?.sellerHelpsLoading ? 'green.500' : 'whiteAlpha.200'}
              transition="all 0.3s"
              cursor="pointer"
              onClick={() => handleMarketplaceUpdate('sellerHelpsLoading', !marketplaceData?.sellerHelpsLoading)}
              _hover={{ borderColor: 'green.400', bg: marketplaceData?.sellerHelpsLoading ? 'green.800' : 'whiteAlpha.100' }}
            >
              <HStack justify="space-between">
                <HStack spacing={3}>
                  <Circle 
                    size="44px" 
                    bg={marketplaceData?.sellerHelpsLoading ? 'green.500' : 'whiteAlpha.100'}
                    transition="all 0.3s"
                  >
                    <Icon 
                      as={FaHandsHelping} 
                      color={marketplaceData?.sellerHelpsLoading ? 'white' : 'whiteAlpha.500'} 
                      boxSize={5} 
                    />
                  </Circle>
                  <Box>
                    <Text fontWeight="600" color="white" fontSize="sm">
                      Seller will help with loading
                    </Text>
                    <Text fontSize="xs" color={marketplaceData?.sellerHelpsLoading ? 'green.200' : 'whiteAlpha.500'}>
                      {marketplaceData?.sellerHelpsLoading 
                        ? '✓ Great! This makes pickup easier' 
                        : 'Tap to confirm if seller agreed to help'}
                    </Text>
                  </Box>
                </HStack>
                <Switch
                  isChecked={marketplaceData?.sellerHelpsLoading || false}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleMarketplaceUpdate('sellerHelpsLoading', e.target.checked);
                  }}
                  colorScheme="green"
                  size="lg"
                />
              </HStack>
            </Box>

            {/* Info tip */}
            <Box
              bg="whiteAlpha.50"
              borderRadius="lg"
              p={3}
              borderLeft="3px solid"
              borderLeftColor="blue.400"
            >
              <Text fontSize="xs" color="whiteAlpha.700">
                💡 <Text as="span" fontWeight="500">Tip:</Text> Sharing seller details helps our driver contact them if needed and ensures a smooth pickup.
              </Text>
            </Box>
          </VStack>
        </Box>
      </Collapse>
    </VStack>
  );
}
