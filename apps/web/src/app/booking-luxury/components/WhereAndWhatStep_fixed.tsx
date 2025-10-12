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
  FaCheck,
  FaSearch,
  FaFire,
  FaPlus,
  FaMinus,
  FaHome,
  FaStar,
  FaCrown,
} from 'react-icons/fa';
import { MdElevator } from 'react-icons/md';

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
  const [itemSelectionMode, setItemSelectionMode] = useState<'bedroom' | 'smart' | 'trending' | 'browse'>('bedroom');
  const { step1 } = formData;
  const toast = useToast();

  // Mock data for demonstration
  const mockItems = [
    { id: '1', name: 'Sofa', category: 'Furniture', price: '£25', weight: '30kg', volume: '2m³' },
    { id: '2', name: 'Dining Table', category: 'Furniture', price: '£30', weight: '40kg', volume: '3m³' },
    { id: '3', name: 'Bed', category: 'Furniture', price: '£35', weight: '50kg', volume: '4m³' },
  ];

  const timeSlots = [
    { id: '9-11', label: '9:00 AM - 11:00 AM', available: true },
    { id: '11-13', label: '11:00 AM - 1:00 PM', available: true },
    { id: '13-15', label: '1:00 PM - 3:00 PM', available: false },
    { id: '15-17', label: '3:00 PM - 5:00 PM', available: true },
  ];

  const handleAddressUpdate = (type: 'pickup' | 'dropoff', address: string) => {
    const addressData = {
      address,
      city: '',
      postcode: '',
      coordinates: { lat: 0, lng: 0 },
      houseNumber: '',
      flatNumber: '',
      formatted_address: address,
      place_name: address,
    };
    
    updateFormData('step1', {
      [`${type}Address`]: addressData
    });
  };

  const handlePropertyUpdate = (type: 'pickup' | 'dropoff', field: string, value: any) => {
    updateFormData('step1', {
      [`${type}Property`]: {
        ...step1[`${type}Property` as keyof typeof step1] as any,
        [field]: value
      }
    });
  };

  const handleItemAdd = (item: any) => {
    const newItem = {
      id: item.id || Math.random().toString(),
      name: item.name || '',
      description: item.description || '',
      category: item.category || '',
      size: 'medium' as const,
      quantity: 1,
      unitPrice: parseInt(item.price?.replace('£', '') || '0'),
      totalPrice: parseInt(item.price?.replace('£', '') || '0'),
      weight: parseInt(item.weight?.replace('kg', '') || '0'),
      volume: parseInt(item.volume?.replace('m³', '') || '0'),
      image: item.image,
    };

    updateFormData('step1', {
      items: [...step1.items, newItem]
    });

    toast({
      title: 'Item Added',
      description: `${item.name} has been added to your moving list`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const handleItemRemove = (itemId: string) => {
    updateFormData('step1', {
      items: step1.items.filter(item => item.id !== itemId)
    });
  };

  return (
    <Container maxW="6xl" p={0}>
      <VStack spacing={{ base: 6, md: 8 }} align="stretch">
        
        {/* Service Level Selection */}
        <Card bg="white" borderRadius="xl" shadow="md" border="1px solid" borderColor="gray.200">
          <CardBody p={6}>
            <VStack spacing={6} textAlign="center">
              <Box>
                <Heading size="xl" color="gray.900" fontWeight="bold" mb={2}>
                  Choose Your Service Level
                </Heading>
                <Text color="gray.600" fontSize="lg">
                  Select the perfect service for your moving needs
                </Text>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                {[
                  { id: 'signature', name: 'Signature', icon: FaBolt, price: 'From £80', color: 'blue' },
                  { id: 'premium', name: 'Premium', icon: FaStar, price: 'From £120', color: 'purple' },
                  { id: 'white-glove', name: 'White Glove', icon: FaCrown, price: 'From £200', color: 'gold' }
                ].map((level) => (
                  <Card
                    key={level.id}
                    borderWidth="2px"
                    borderColor={step1.serviceType === level.id ? `${level.color}.500` : 'gray.200'}
                    bg={step1.serviceType === level.id ? `${level.color}.50` : 'white'}
                    cursor="pointer"
                    onClick={() => updateFormData('step1', { serviceType: level.id as any })}
                    _hover={{ borderColor: `${level.color}.300`, shadow: 'lg' }}
                    transition="all 0.2s"
                    h="200px"
                  >
                    <CardBody display="flex" alignItems="center" justifyContent="center">
                      <VStack spacing={3}>
                        <Circle size="60px" bg={`${level.color}.500`} color="white">
                          <Icon as={level.icon} boxSize={8} />
                        </Circle>
                        <Text fontSize="xl" fontWeight="bold" color="gray.800">
                          {level.name}
                        </Text>
                        <Badge colorScheme={level.color} size="lg" borderRadius="full">
                          {level.price}
                        </Badge>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Addresses Section */}
        <Card bg="white" borderRadius="xl" shadow="md" border="1px solid" borderColor="gray.200">
          <CardBody p={6}>
            <VStack spacing={6}>
              <Box textAlign="center">
                <Heading size="lg" color="gray.900" fontWeight="bold" mb={2}>
                  📍 Pickup & Dropoff Locations
                </Heading>
                <Text color="gray.600">
                  Enter your addresses for accurate distance calculation
                </Text>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
                {/* Pickup Address */}
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <Circle size="40px" bg="green.100">
                      <Icon as={FaMapMarkerAlt} color="green.600" boxSize={5} />
                    </Circle>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        Pickup Address
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Where we'll collect your items
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <Input
                    placeholder="Enter pickup address..."
                    value={step1.pickupAddress?.address || ''}
                    onChange={(e) => handleAddressUpdate('pickup', e.target.value)}
                    size="lg"
                    borderRadius="lg"
                  />
                  
                  {errors['step1.pickupAddress'] && (
                    <Text color="red.500" fontSize="sm">
                      {errors['step1.pickupAddress']}
                    </Text>
                  )}
                </VStack>

                {/* Dropoff Address */}
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <Circle size="40px" bg="blue.100">
                      <Icon as={FaMapMarkerAlt} color="blue.600" boxSize={5} />
                    </Circle>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        Dropoff Address
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Your destination
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <Input
                    placeholder="Enter dropoff address..."
                    value={step1.dropoffAddress?.address || ''}
                    onChange={(e) => handleAddressUpdate('dropoff', e.target.value)}
                    size="lg"
                    borderRadius="lg"
                  />
                  
                  {errors['step1.dropoffAddress'] && (
                    <Text color="red.500" fontSize="sm">
                      {errors['step1.dropoffAddress']}
                    </Text>
                  )}
                </VStack>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Items Selection */}
        <Card bg="white" borderRadius="xl" shadow="md" border="1px solid" borderColor="gray.200">
          <CardBody p={6}>
            <VStack spacing={6}>
              <Box textAlign="center">
                <Heading size="lg" color="gray.900" fontWeight="bold" mb={2}>
                  📦 Select Your Items
                </Heading>
                <Text color="gray.600">
                  Choose how you'd like to add items to your move
                </Text>
              </Box>

              {/* Item Selection Mode Tabs */}
              <HStack spacing={2} flexWrap="wrap" justify="center">
                <Button 
                  variant={itemSelectionMode === 'bedroom' ? 'solid' : 'outline'}
                  colorScheme={itemSelectionMode === 'bedroom' ? 'blue' : 'gray'}
                  onClick={() => setItemSelectionMode('bedroom')}
                  leftIcon={<FaHome />}
                  size="md"
                  borderRadius="full"
                  _hover={{ transform: 'translateY(-1px)' }}
                >
                  By Home Size
                </Button>
                <Button 
                  variant={itemSelectionMode === 'smart' ? 'solid' : 'outline'}
                  colorScheme={itemSelectionMode === 'smart' ? 'blue' : 'gray'}
                  onClick={() => setItemSelectionMode('smart')}
                  leftIcon={<FaSearch />}
                  size="md"
                  borderRadius="full"
                  _hover={{ transform: 'translateY(-1px)' }}
                >
                  Smart Search
                </Button>
                <Button 
                  variant={itemSelectionMode === 'trending' ? 'solid' : 'outline'}
                  colorScheme={itemSelectionMode === 'trending' ? 'blue' : 'gray'}
                  onClick={() => setItemSelectionMode('trending')}
                  leftIcon={<FaFire />}
                  size="md"
                  borderRadius="full"
                  _hover={{ transform: 'translateY(-1px)' }}
                >
                  Popular Items
                </Button>
                <Button 
                  variant={itemSelectionMode === 'browse' ? 'solid' : 'outline'}
                  colorScheme={itemSelectionMode === 'browse' ? 'blue' : 'gray'}
                  onClick={() => setItemSelectionMode('browse')}
                  leftIcon={<FaTags />}
                  size="md"
                  borderRadius="full"
                  _hover={{ transform: 'translateY(-1px)' }}
                >
                  Browse All
                </Button>
              </HStack>

              {/* Items Display */}
              {itemSelectionMode === 'smart' && (
                <VStack spacing={4} w="full">
                  <Input
                    placeholder="Search for items... (e.g., sofa, dining table)"
                    size="lg"
                    borderRadius="lg"
                  />
                  <Text color="blue.600" fontSize="sm" p={4} bg="blue.50" borderRadius="md">
                    Try searching for specific items or room types to get personalized suggestions
                  </Text>
                </VStack>
              )}

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                {mockItems.map((item) => (
                  <Card key={item.id} borderWidth="1px" borderColor="gray.200" borderRadius="lg">
                    <CardBody p={4}>
                      <VStack spacing={3} align="stretch">
                        <HStack justify="space-between" align="flex-start">
                          <Heading size="sm" color="gray.800">{item.name}</Heading>
                          <Badge colorScheme="blue" variant="outline">{item.price}</Badge>
                        </HStack>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" color="gray.600">Weight: {item.weight}</Text>
                          <Text fontSize="sm" color="gray.600">Volume: {item.volume}</Text>
                        </VStack>
                        <Button 
                          size="sm" 
                          colorScheme="blue"
                          variant="outline"
                          onClick={() => handleItemAdd(item)}
                        >
                          Add Item
                        </Button>
                      </VStack>
                    </CardBody>
                  </Card>
                ))}
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Selected Items */}
        {step1.items && step1.items.length > 0 && (
          <Card bg="green.50" borderColor="green.200" borderWidth="1px" borderRadius="xl" shadow="md">
            <CardBody p={6}>
              <VStack spacing={4} align="stretch">
                <HStack spacing={3} align="center">
                  <Circle size="40px" bg="green.500" color="white">
                    <Icon as={FaCheck} boxSize={5} />
                  </Circle>
                  <VStack align="start" spacing={0}>
                    <Text fontSize="lg" fontWeight="bold" color="green.800">
                      Selected Items
                    </Text>
                    <Text fontSize="sm" color="green.600">
                      {step1.items.length} item(s) selected
                    </Text>
                  </VStack>
                  <Badge colorScheme="green" variant="solid">
                    Total: £{step1.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)}
                  </Badge>
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {step1.items.map((item, index) => (
                    <HStack key={index} justify="space-between" p={3} bg="white" borderRadius="lg">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium">{item.name}</Text>
                        <Text fontSize="sm" color="gray.600">
                          Qty: {item.quantity} • £{item.totalPrice}
                        </Text>
                      </VStack>
                      <IconButton
                        aria-label="Remove item"
                        icon={<FaTrash />}
                        size="sm"
                        colorScheme="red"
                        variant="ghost"
                        onClick={() => handleItemRemove(item.id || '')}
                      />
                    </HStack>
                  ))}
                </SimpleGrid>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Date & Time Selection */}
        <Card bg="white" borderRadius="xl" shadow="md" border="1px solid" borderColor="gray.200">
          <CardBody p={6}>
            <VStack spacing={6}>
              <Box textAlign="center">
                <Heading size="lg" color="gray.900" fontWeight="bold" mb={2}>
                  📅 When would you like us to move?
                </Heading>
                <Text color="gray.600">
                  Choose your preferred date and time slot
                </Text>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} w="full">
                {/* Date Selection */}
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <Circle size="40px" bg="blue.100">
                      <Icon as={FaCalendarAlt} color="blue.600" boxSize={5} />
                    </Circle>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        Moving Date
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Select your preferred date
                      </Text>
                    </VStack>
                  </HStack>
                  
                  <Input
                    type="date"
                    value={step1.pickupDate || ''}
                    onChange={(e) => updateFormData('step1', { pickupDate: e.target.value })}
                    size="lg"
                    borderRadius="lg"
                  />
                </VStack>

                {/* Time Selection */}
                <VStack spacing={4} align="stretch">
                  <HStack spacing={3}>
                    <Circle size="40px" bg="blue.100">
                      <Icon as={FaClock} color="blue.600" boxSize={5} />
                    </Circle>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="lg" fontWeight="bold" color="gray.800">
                        Time Slot
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Choose available time
                      </Text>
                    </VStack>
                  </HStack>

                  <VStack spacing={2}>
                    {timeSlots.map((slot) => (
                      <Button
                        key={slot.id}
                        w="full"
                        variant={step1.pickupTimeSlot === slot.id ? 'solid' : 'outline'}
                        colorScheme={step1.pickupTimeSlot === slot.id ? 'blue' : 'gray'}
                        onClick={() => updateFormData('step1', { pickupTimeSlot: slot.id })}
                        isDisabled={!slot.available}
                        justifyContent="space-between"
                        rightIcon={step1.pickupTimeSlot === slot.id ? <FaCheck /> : undefined}
                      >
                        <Text>{slot.label}</Text>
                        {!slot.available && <Badge colorScheme="red">Full</Badge>}
                      </Button>
                    ))}
                  </VStack>
                </VStack>
              </SimpleGrid>

              {errors['step1.pickupTimeSlot'] && (
                <Text color="red.500" fontSize="sm" mt={2}>
                  {errors['step1.pickupTimeSlot']}
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}