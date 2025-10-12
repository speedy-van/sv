'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  IconButton,
  useToast,
  Divider,
  Icon,
  SimpleGrid,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  FormLabel,
  FormControl,
  FormErrorMessage,
  Badge,
  Flex,
  Card,
  CardBody,
  Circle,
  Collapse,
  useDisclosure,
  Progress,
  Container,
  Tooltip,
  Image,
  Grid,
} from '@chakra-ui/react';

import {
  FaMapMarkerAlt,
  FaBolt,
  FaTrash,
  FaBuilding,
  FaParking,
  FaTags,
  FaCalendarAlt,
  FaClock,
  FaSearch,
  FaPlus,
  FaMinus,
  FaCheck,
  FaCheckCircle,
  FaArrowUp,
  FaArrowDown,
  FaHome,
  FaCouch,
  FaBed,
  FaTv,
  FaUtensils,
  FaTshirt,
  FaFire,
  FaCoffee,
  FaChair,
  FaBoxOpen,
  FaArrowLeft,
  FaArrowRight,
  FaEye,
} from 'react-icons/fa';
import { MdElevator, MdKitchen, MdLocalLaundryService, MdTv } from 'react-icons/md';

import type { FormData } from '../hooks/useBookingForm';

interface WhereAndWhatStepProps {
  formData: FormData;
  updateFormData: (step: keyof FormData, data: Partial<FormData[keyof FormData]>) => void;
  errors: Record<string, string>;
  onNext?: () => void;
}

export default function WhereAndWhatStep({
  formData,
  updateFormData,
  errors,
  onNext,
}: WhereAndWhatStepProps) {
  
  // State for item selection mode
  const [itemSelectionMode, setItemSelectionMode] = useState<'bedroom' | 'smart' | 'choose'>('choose');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showImages, setShowImages] = useState(false);
  
  const { step1 } = formData;
  const toast = useToast();

  // Simplified furniture items
  const furnitureItems = [
    { id: 1, name: 'Sofa', price: '35', category: 'Living Room', icon: '🛋️' },
    { id: 2, name: 'Bed', price: '30', category: 'Bedroom', icon: '🛏️' },
    { id: 3, name: 'Dining Table', price: '25', category: 'Dining', icon: '🍽️' },
    { id: 4, name: 'Wardrobe', price: '40', category: 'Bedroom', icon: '👕' },
    { id: 5, name: 'TV', price: '25', category: 'Electronics', icon: '📺' },
    { id: 6, name: 'Washing Machine', price: '45', category: 'Appliances', icon: '🧺' },
    { id: 7, name: 'Fridge', price: '50', category: 'Kitchen', icon: '🥶' },
    { id: 8, name: 'Microwave', price: '15', category: 'Kitchen', icon: '🔥' },
  ];

  const applianceItems = [
    { id: 9, name: 'Dishwasher', price: '45', category: 'Kitchen', icon: '🍽️' },
    { id: 10, name: 'Oven', price: '40', category: 'Kitchen', icon: '🔥' },
    { id: 11, name: 'Dryer', price: '35', category: 'Appliances', icon: '🧺' },
  ];

  const bedroomPackages = [
    { id: 1, name: '1 Bedroom', items: 15, price: '350', icon: '🏠' },
    { id: 2, name: '2 Bedroom', items: 25, price: '550', icon: '🏠' },
    { id: 3, name: '3 Bedroom', items: 35, price: '750', icon: '🏠' },
  ];

  // Handlers
  const addItem = (item: any) => {
    const existingItem = step1.items.find(i => i.id === item.id);
    if (existingItem) {
      updateFormData('step1', {
        items: step1.items.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      });
    } else {
      updateFormData('step1', {
        items: [...step1.items, { ...item, quantity: 1 }]
      });
    }
  };

  const removeItem = (itemId: number) => {
    updateFormData('step1', {
      items: step1.items.filter(i => parseInt(i.id) !== itemId)
    });
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity === 0) {
      removeItem(itemId);
    } else {
      updateFormData('step1', {
        items: step1.items.map(i =>
          parseInt(i.id) === itemId ? { ...i, quantity } : i
        )
      });
    }
  };

  const calculateTotal = () => {
    return step1.items.reduce((total, item) => {
      return total + (item.unitPrice * item.quantity);
    }, 0);
  };

  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        
        {/* Header */}
        <VStack spacing={4} textAlign="center">
          <Heading size="xl" color="white">
            What needs moving?
          </Heading>
          <Text color="gray.400" fontSize="lg" maxW="600px">
            Select the items you need to move. You can choose individual items or complete house packages.
          </Text>
        </VStack>

        {/* Address Summary */}
        <Card bg="gray.800" borderRadius="lg" border="1px solid" borderColor="gray.600">
          <CardBody p={4}>
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Text fontSize="sm" color="gray.400">Moving From</Text>
                <Text color="white" fontWeight="medium">
                  {step1.pickupAddress?.address || 'Not selected'}
                </Text>
              </VStack>
              <Icon as={FaArrowRight} color="gray.400" />
              <VStack align="end" spacing={1}>
                <Text fontSize="sm" color="gray.400">Moving To</Text>
                <Text color="white" fontWeight="medium">
                  {step1.dropoffAddress?.address || 'Not selected'}
                </Text>
              </VStack>
            </HStack>
          </CardBody>
        </Card>

        {/* Item Selection */}
        <Card bg="gray.800" borderRadius="lg" border="1px solid" borderColor="gray.600">
          <CardBody p={6}>
            <VStack spacing={6}>
              
              {/* Header */}
              <VStack spacing={2} textAlign="center">
                <Heading size="md" color="white">
                  Select Your Items
                </Heading>
                <Text color="gray.400" fontSize="md">
                  Choose how you'd like to add items
                </Text>
              </VStack>

              {/* Stats */}
              <HStack spacing={6} justify="center">
                <VStack spacing={1}>
                  <Text fontSize="xl" fontWeight="bold" color="blue.400">
                    {furnitureItems.length + applianceItems.length}
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    Individual Items
                  </Text>
                </VStack>
                
                <VStack spacing={1}>
                  <Text fontSize="xl" fontWeight="bold" color="green.400">
                    {bedroomPackages.length}
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    House Packages
                  </Text>
                </VStack>
              </HStack>

              {/* Selection Modes */}
              <HStack spacing={3} flexWrap="wrap" justify="center">
                <Button 
                  variant={itemSelectionMode === 'bedroom' ? 'solid' : 'outline'}
                  bg={itemSelectionMode === 'bedroom' ? 'blue.600' : 'gray.700'}
                  color="white"
                  borderColor="gray.600"
                  onClick={() => setItemSelectionMode('bedroom')}
                  leftIcon={<FaHome />}
                  _hover={{ bg: 'blue.700' }}
                >
                  House Packages
                </Button>
                <Button 
                  variant={itemSelectionMode === 'smart' ? 'solid' : 'outline'}
                  bg={itemSelectionMode === 'smart' ? 'purple.600' : 'gray.700'}
                  color="white"
                  borderColor="gray.600"
                  onClick={() => setItemSelectionMode('smart')}
                  leftIcon={<FaSearch />}
                  _hover={{ bg: 'purple.700' }}
                >
                  Search Items
                </Button>
                <Button 
                  variant={itemSelectionMode === 'choose' ? 'solid' : 'outline'}
                  bg={itemSelectionMode === 'choose' ? 'green.600' : 'gray.700'}
                  color="white"
                  borderColor="gray.600"
                  onClick={() => setItemSelectionMode('choose')}
                  leftIcon={<FaCouch />}
                  _hover={{ bg: 'green.700' }}
                >
                  Individual Items
                </Button>
              </HStack>

              <Divider borderColor="gray.600" />

              {/* House Packages Mode */}
              {itemSelectionMode === 'bedroom' && (
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                  {bedroomPackages.map((pkg) => (
                    <Card
                      key={pkg.id}
                      bg="gray.700"
                      borderRadius="lg"
                      border="1px solid"
                      borderColor="gray.600"
                      cursor="pointer"
                      _hover={{ borderColor: "blue.500" }}
                      onClick={() => addItem(pkg)}
                    >
                      <CardBody p={4} textAlign="center">
                        <VStack spacing={3}>
                          <Text fontSize="3xl">{pkg.icon}</Text>
                          <VStack spacing={1}>
                            <Text fontSize="lg" color="white" fontWeight="bold">
                              {pkg.name}
                            </Text>
                            <Text fontSize="sm" color="gray.400">
                              ~{pkg.items} items
                            </Text>
                            <Text fontSize="xl" color="green.400" fontWeight="bold">
                              £{pkg.price}
                            </Text>
                          </VStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              )}

              {/* Search Mode */}
              {itemSelectionMode === 'smart' && (
                <VStack spacing={4} w="full">
                  <InputGroup size="lg">
                    <InputLeftElement>
                      <Icon as={FaSearch} color="gray.400" />
                    </InputLeftElement>
                    <Input
                      placeholder="Search for items (e.g., 'sofa', 'kitchen appliances')"
                      bg="gray.700"
                      border="1px solid"
                      borderColor="gray.600"
                      color="white"
                      _placeholder={{ color: "gray.400" }}
                      _focus={{ borderColor: 'purple.500' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </InputGroup>
                  
                  {/* Quick Categories */}
                  <HStack spacing={2} wrap="wrap" justify="center">
                    {['Living Room', 'Bedroom', 'Kitchen', 'Appliances'].map((category) => (
                      <Button
                        key={category}
                        size="sm"
                        variant="outline"
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                        _hover={{ bg: "purple.700" }}
                        onClick={() => setSearchQuery(category.toLowerCase())}
                      >
                        {category}
                      </Button>
                    ))}
                  </HStack>
                </VStack>
              )}

              {/* Individual Items Mode */}
              {itemSelectionMode === 'choose' && (
                <VStack spacing={4} w="full">
                  <Text fontSize="lg" color="white" fontWeight="semibold" textAlign="center">
                    Choose Individual Items
                  </Text>
                  
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} w="full">
                    {[...furnitureItems, ...applianceItems]
                      .filter(item => 
                        searchQuery === '' || 
                        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.category.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((item) => (
                      <Card
                        key={item.id}
                        bg="gray.700"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="gray.600"
                        cursor="pointer"
                        _hover={{ borderColor: "green.500" }}
                        onClick={() => addItem(item)}
                      >
                        <CardBody p={3} textAlign="center">
                          <VStack spacing={2}>
                            <Text fontSize="2xl">{item.icon}</Text>
                            <Text fontSize="sm" color="white" fontWeight="medium">
                              {item.name}
                            </Text>
                            <Text fontSize="xs" color="gray.400">
                              {item.category}
                            </Text>
                            <Text fontSize="lg" color="green.400" fontWeight="bold">
                              £{item.price}
                            </Text>
                          </VStack>
                        </CardBody>
                      </Card>
                    ))}
                  </SimpleGrid>
                </VStack>
              )}

            </VStack>
          </CardBody>
        </Card>

        {/* Selected Items */}
        {step1.items.length > 0 && (
          <Card bg="gray.800" borderRadius="lg" border="1px solid" borderColor="green.600">
            <CardBody p={6}>
              <VStack spacing={4}>
                <Heading size="md" color="white">
                  Selected Items ({step1.items.length})
                </Heading>
                
                <VStack spacing={3} w="full">
                  {step1.items.map((item) => (
                    <HStack key={item.id} justify="space-between" w="full" p={3} bg="gray.700" borderRadius="lg">
                      <HStack spacing={3}>
                        <VStack align="start" spacing={0}>
                          <Text color="white" fontWeight="medium">{item.name}</Text>
                          <Text fontSize="sm" color="gray.400">£{item.unitPrice} each</Text>
                        </VStack>
                      </HStack>
                      
                      <HStack spacing={2}>
                        <IconButton
                          size="sm"
                          icon={<FaMinus />}
                          onClick={() => updateQuantity(parseInt(item.id), item.quantity - 1)}
                          bg="gray.600"
                          color="white"
                          _hover={{ bg: "gray.500" }}
                          aria-label="Decrease quantity"
                        />
                        <Text color="white" fontWeight="bold" minW="40px" textAlign="center">
                          {item.quantity}
                        </Text>
                        <IconButton
                          size="sm"
                          icon={<FaPlus />}
                          onClick={() => updateQuantity(parseInt(item.id), item.quantity + 1)}
                          bg="green.600"
                          color="white"
                          _hover={{ bg: "green.500" }}
                          aria-label="Increase quantity"
                        />
                        <IconButton
                          size="sm"
                          icon={<FaTrash />}
                          onClick={() => removeItem(parseInt(item.id))}
                          bg="red.600"
                          color="white"
                          _hover={{ bg: "red.500" }}
                          aria-label="Remove item"
                        />
                      </HStack>
                    </HStack>
                  ))}
                </VStack>

                {/* Total */}
                <HStack justify="space-between" w="full" pt={4} borderTop="1px solid" borderColor="gray.600">
                  <Text fontSize="lg" color="white" fontWeight="bold">
                    Total Estimated Cost:
                  </Text>
                  <Text fontSize="xl" color="green.400" fontWeight="bold">
                    £{calculateTotal().toFixed(2)}
                  </Text>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Continue Button */}
        <Card bg="gray.800" borderRadius="lg" border="1px solid" borderColor="gray.600">
          <CardBody p={6}>
            <HStack justify="space-between" w="full">
              <Badge bg="green.600" color="white" p={3} borderRadius="lg">
                ✅ {step1.items.length} Items Selected
              </Badge>

              {onNext && (
                <Button
                  colorScheme="blue"
                  size="lg"
                  isDisabled={step1.items.length === 0}
                  onClick={onNext}
                  rightIcon={<Icon as={FaArrowRight} />}
                  _disabled={{
                    opacity: 0.5,
                    cursor: "not-allowed"
                  }}
                >
                  Continue
                </Button>
              )}
            </HStack>
          </CardBody>
        </Card>

      </VStack>
    </Container>
  );
}