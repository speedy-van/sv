'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Select,
  Badge,
  Icon,
  Circle,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  useColorModeValue,
  Flex,
  Tooltip,
  Switch,
  Collapse,
  useDisclosure,
  IconButton,
  Divider,
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaClock,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBolt,
  FaSun,
  FaMoon,
  FaBusinessTime,
  FaEdit,
  FaSync,
} from 'react-icons/fa';

interface TimeSlot {
  value: string;
  label: string;
  time: string;
  emoji: string;
  color: string;
  description?: string;
  surcharge?: number;
  availability?: 'available' | 'limited' | 'unavailable';
}

interface DateTimeSelection {
  date: string;
  timeSlot: string;
  specificTime?: string;
  isFlexible: boolean;
  urgentDelivery: boolean;
  notes?: string;
}

interface EnhancedDateTimeCardProps {
  value: DateTimeSelection;
  onChange: (selection: DateTimeSelection) => void;
  isMultipleDrop?: boolean;
  serviceTier?: string;
  distance?: number;
  isEditable?: boolean;
  showPricing?: boolean;
  onPricingUpdate?: (surcharge: number) => void;
}

export const EnhancedDateTimeCard: React.FC<EnhancedDateTimeCardProps> = ({
  value,
  onChange,
  isMultipleDrop = false,
  serviceTier = 'large_van',
  distance = 0,
  isEditable = true,
  showPricing = true,
  onPricingUpdate,
}) => {
  const [selectedDate, setSelectedDate] = useState(value.date);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(value.timeSlot);
  const [isFlexible, setIsFlexible] = useState(value.isFlexible);
  const [urgentDelivery, setUrgentDelivery] = useState(value.urgentDelivery);
  const [specificTime, setSpecificTime] = useState(value.specificTime || '');
  const [notes, setNotes] = useState(value.notes || '');
  const [currentSurcharge, setCurrentSurcharge] = useState(0);
  
  const { isOpen: isAdvancedOpen, onToggle: onAdvancedToggle } = useDisclosure();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Time slot configurations
  const timeSlots: TimeSlot[] = [
    {
      value: 'morning',
      label: 'Morning',
      time: '8:00 - 12:00',
      emoji: '🌅',
      color: 'yellow',
      description: 'Best for early starts',
      availability: 'available',
    },
    {
      value: 'afternoon',
      label: 'Afternoon',
      time: '12:00 - 17:00',
      emoji: '☀️',
      color: 'orange',
      description: 'Most popular time',
      availability: 'limited',
    },
    {
      value: 'evening',
      label: 'Evening',
      time: '17:00 - 20:00',
      emoji: '🌆',
      color: 'purple',
      description: 'After work hours',
      surcharge: 15,
      availability: 'available',
    },
    {
      value: 'express',
      label: 'Express',
      time: 'Within 2 hours',
      emoji: '⚡',
      color: 'red',
      description: 'Same-day urgent delivery',
      surcharge: 50,
      availability: distance < 20 ? 'available' : 'unavailable',
    },
    {
      value: 'flexible',
      label: 'Flexible',
      time: 'Any time',
      emoji: '🕐',
      color: 'blue',
      description: 'Best price, flexible timing',
      surcharge: -10,
      availability: 'available',
    },
  ];

  // Update parent component when values change
  useEffect(() => {
    const newSelection: DateTimeSelection = {
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      specificTime: specificTime || undefined,
      isFlexible,
      urgentDelivery,
      notes: notes || undefined,
    };
    
    onChange(newSelection);
  }, [selectedDate, selectedTimeSlot, specificTime, isFlexible, urgentDelivery, notes, onChange]);

  // Calculate pricing surcharge
  useEffect(() => {
    let surcharge = 0;
    
    // Time slot surcharge
    const selectedSlot = timeSlots.find(slot => slot.value === selectedTimeSlot);
    if (selectedSlot?.surcharge) {
      surcharge += selectedSlot.surcharge;
    }
    
    // Urgent delivery surcharge
    if (urgentDelivery) {
      surcharge += 25;
    }
    
    // Multiple drop complexity surcharge
    if (isMultipleDrop && selectedTimeSlot !== 'flexible') {
      surcharge += 10;
    }
    
    // Weekend surcharge
    if (selectedDate) {
      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        surcharge += 20;
      }
    }
    
    setCurrentSurcharge(surcharge);
    
    if (onPricingUpdate) {
      onPricingUpdate(surcharge);
    }
  }, [selectedTimeSlot, urgentDelivery, isMultipleDrop, selectedDate, onPricingUpdate]);

  const handleDateSelect = useCallback((date: string) => {
    setSelectedDate(date);
    
    // Show weekend surcharge notification
    const selectedDateObj = new Date(date);
    const dayOfWeek = selectedDateObj.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      toast({
        title: 'Weekend Surcharge',
        description: 'A £20 weekend surcharge applies to this date',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  const handleTimeSlotSelect = useCallback((slotValue: string) => {
    const slot = timeSlots.find(s => s.value === slotValue);
    
    if (slot?.availability === 'unavailable') {
      toast({
        title: 'Time Slot Unavailable',
        description: slot.value === 'express' ? 'Express delivery not available for distances over 20 miles' : 'This time slot is not available',
        status: 'warning',
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    
    setSelectedTimeSlot(slotValue);
    
    // Show surcharge notification
    if (slot?.surcharge && slot.surcharge > 0) {
      toast({
        title: 'Additional Charge',
        description: `£${slot.surcharge} surcharge applies for ${slot.label.toLowerCase()} delivery`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } else if (slot?.surcharge && slot.surcharge < 0) {
      toast({
        title: 'Discount Applied',
        description: `£${Math.abs(slot.surcharge)} discount for flexible timing`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'green';
      case 'limited': return 'orange';
      case 'unavailable': return 'red';
      default: return 'gray';
    }
  };

  const formatSurcharge = (amount: number) => {
    if (amount > 0) return `+£${amount}`;
    if (amount < 0) return `-£${Math.abs(amount)}`;
    return '';
  };

  return (
    <Card bg={cardBg} borderRadius="xl" shadow="md" border="1px solid" borderColor={borderColor}>
      <CardBody p={6}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <HStack spacing={3} justify="center" mb={3}>
              <Circle size="50px" bg="blue.500" color="white">
                <Icon as={FaCalendarAlt} boxSize={6} />
              </Circle>
              <VStack align="start" spacing={0}>
                <HStack spacing={2}>
                  <Heading as="h3" size="xl" color="gray.700" bgGradient="linear(to-r, blue.600, purple.600)" bgClip="text">
                    📅 {isMultipleDrop ? 'Route Schedule' : 'When are we moving?'}
                  </Heading>
                  {selectedDate && selectedTimeSlot && (
                    <Badge colorScheme="blue" variant="solid" fontSize="xs">
                      ✓ Scheduled
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  {isMultipleDrop ? 'Plan your multiple drop route' : 'Select your preferred date and time'}
                </Text>
              </VStack>
            </HStack>
          </Box>

          {/* Pricing Summary */}
          {showPricing && currentSurcharge !== 0 && (
            <Alert status={currentSurcharge > 0 ? 'warning' : 'success'} borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">
                  {currentSurcharge > 0 ? 'Additional Charges' : 'Discount Applied'}
                </AlertTitle>
                <AlertDescription fontSize="xs">
                  {formatSurcharge(currentSurcharge)} for selected date and time options
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Date Selection */}
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel fontSize="sm" fontWeight="bold" color="gray.700">
                <Icon as={FaCalendarAlt} mr={2} />
                {isMultipleDrop ? 'Route Start Date' : 'Pickup Date'}
              </FormLabel>
              
              {/* Quick Date Cards */}
              <Card bg="gray.50" borderRadius="xl" p={4} mb={4} border="2px solid" borderColor="gray.200">
                <VStack spacing={3}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
                    Quick Date Selection
                  </Text>
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={3} w="full">
                    {(() => {
                      const today = new Date();
                      const dates = [];
                      
                      for (let i = 0; i < 5; i++) {
                        const date = new Date(today);
                        date.setDate(today.getDate() + i);
                        dates.push(date);
                      }
                      
                      return dates.map((date, index) => {
                        const dateString = date.toISOString().split('T')[0];
                        const isSelected = selectedDate === dateString;
                        const dayName = date.toLocaleDateString('en-GB', { weekday: 'short' });
                        const dayNumber = date.getDate();
                        const monthName = date.toLocaleDateString('en-GB', { month: 'short' });
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        
                        let label = '';
                        let colorScheme = 'gray';
                        let emoji = '';
                        
                        if (index === 0) {
                          label = 'Today';
                          colorScheme = isSelected ? 'red' : 'red';
                          emoji = '🔥';
                        } else if (index === 1) {
                          label = 'Tomorrow';
                          colorScheme = isSelected ? 'orange' : 'orange';
                          emoji = '⚡';
                        } else {
                          label = dayName;
                          colorScheme = isSelected ? 'blue' : 'blue';
                          emoji = isWeekend ? '🎉' : '💎';
                        }
                        
                        return (
                          <Card
                            key={dateString}
                            bg={isSelected ? `${colorScheme}.500` : 'white'}
                            borderColor={isSelected ? `${colorScheme}.500` : isWeekend ? 'orange.300' : 'gray.200'}
                            borderWidth="2px"
                            borderRadius="xl"
                            p={3}
                            cursor={isEditable ? "pointer" : "default"}
                            onClick={() => isEditable && handleDateSelect(dateString)}
                            _hover={isEditable ? { shadow: 'lg' } : {}}
                            transition="all 0.3s ease"
                            textAlign="center"
                            minH="100px"
                            display="flex"
                            flexDirection="column"
                            justifyContent="center"
                            alignItems="center"
                            position="relative"
                          >
                            {isWeekend && (
                              <Badge
                                position="absolute"
                                top={1}
                                right={1}
                                colorScheme="orange"
                                fontSize="2xs"
                                variant="solid"
                              >
                                +£20
                              </Badge>
                            )}
                            <Text fontSize="lg" mb={1}>{emoji}</Text>
                            <Text fontWeight="bold" fontSize="sm" lineHeight="1.2" color={isSelected ? 'white' : 'gray.700'} mb={1}>
                              {label}
                            </Text>
                            <Text fontSize="xs" color={isSelected ? 'white' : 'gray.500'} fontWeight="semibold">
                              {dayNumber} {monthName}
                            </Text>
                          </Card>
                        );
                      });
                    })()}
                  </SimpleGrid>
                  
                  {/* Custom Date Input */}
                  <Card bg="white" borderRadius="lg" p={4} border="2px solid" borderColor="gray.200">
                    <VStack spacing={3}>
                      <Text fontSize="sm" color="gray.600" fontWeight="medium">Or choose a custom date:</Text>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateSelect(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        bg="gray.50"
                        borderColor="gray.300"
                        _hover={{ borderColor: "blue.400" }}
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                        size="md"
                        borderRadius="lg"
                        fontWeight="medium"
                        isDisabled={!isEditable}
                      />
                    </VStack>
                  </Card>
                </VStack>
              </Card>
            </FormControl>
          </VStack>

          {/* Time Slot Selection */}
          <FormControl isRequired>
            <FormLabel fontSize="md" fontWeight="bold" color="gray.700" mb={4}>
              <Icon as={FaClock} mr={2} />
              Choose Time Slot
            </FormLabel>
            
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={4}>
              {timeSlots.map((slot) => {
                const isSelected = selectedTimeSlot === slot.value;
                const isUnavailable = slot.availability === 'unavailable';
                
                return (
                  <Tooltip
                    key={slot.value}
                    label={isUnavailable ? 'Not available for this distance' : slot.description}
                    hasArrow
                  >
                    <Card
                      bg={isSelected ? `${slot.color}.50` : isUnavailable ? 'gray.100' : 'white'}
                      borderColor={isSelected ? `${slot.color}.500` : isUnavailable ? 'gray.300' : 'gray.200'}
                      borderWidth="2px"
                      borderRadius="xl"
                      p={4}
                      cursor={isEditable && !isUnavailable ? "pointer" : "not-allowed"}
                      onClick={() => isEditable && !isUnavailable && handleTimeSlotSelect(slot.value)}
                      _hover={isEditable && !isUnavailable ? { 
                        shadow: 'lg',
                        transform: 'translateY(-2px)',
                        borderColor: `${slot.color}.400`
                      } : {}}
                      transition="all 0.3s ease"
                      textAlign="center"
                      minH="120px"
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      position="relative"
                      opacity={isUnavailable ? 0.5 : 1}
                    >
                      {/* Availability Badge */}
                      <Badge
                        position="absolute"
                        top={2}
                        right={2}
                        colorScheme={getAvailabilityColor(slot.availability || 'available')}
                        fontSize="2xs"
                        variant="solid"
                      >
                        {slot.availability === 'limited' ? 'Limited' : slot.availability === 'unavailable' ? 'N/A' : '✓'}
                      </Badge>
                      
                      {/* Surcharge Badge */}
                      {slot.surcharge && (
                        <Badge
                          position="absolute"
                          top={2}
                          left={2}
                          colorScheme={slot.surcharge > 0 ? 'red' : 'green'}
                          fontSize="2xs"
                          variant="solid"
                        >
                          {formatSurcharge(slot.surcharge)}
                        </Badge>
                      )}
                      
                      <Text fontSize="2xl" mb={2}>{slot.emoji}</Text>
                      <Text fontSize="sm" fontWeight="bold" color={isSelected ? `${slot.color}.700` : 'gray.700'} mb={1}>
                        {slot.label}
                      </Text>
                      <Text fontSize="xs" color={isSelected ? `${slot.color}.600` : 'gray.500'}>
                        {slot.time}
                      </Text>
                    </Card>
                  </Tooltip>
                );
              })}
            </SimpleGrid>
          </FormControl>

          {/* Advanced Options */}
          <Card variant="outline">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" cursor="pointer" onClick={onAdvancedToggle}>
                  <Text fontSize="md" fontWeight="semibold" color="gray.700">
                    Advanced Options
                  </Text>
                  <IconButton
                    aria-label="Toggle advanced options"
                    icon={<FaEdit />}
                    size="sm"
                    variant="ghost"
                  />
                </HStack>
                
                <Collapse in={isAdvancedOpen}>
                  <VStack spacing={4} align="stretch">
                    <Divider />
                    
                    {/* Specific Time */}
                    {selectedTimeSlot !== 'flexible' && selectedTimeSlot !== 'express' && (
                      <FormControl>
                        <FormLabel fontSize="sm">Specific Time (Optional)</FormLabel>
                        <Input
                          type="time"
                          value={specificTime}
                          onChange={(e) => setSpecificTime(e.target.value)}
                          placeholder="Leave empty for flexible timing within slot"
                          isDisabled={!isEditable}
                        />
                      </FormControl>
                    )}
                    
                    {/* Urgent Delivery Toggle */}
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="urgent-delivery" mb="0" fontSize="sm">
                        Urgent Delivery (+£25)
                      </FormLabel>
                      <Switch
                        id="urgent-delivery"
                        isChecked={urgentDelivery}
                        onChange={(e) => setUrgentDelivery(e.target.checked)}
                        colorScheme="red"
                        isDisabled={!isEditable}
                      />
                    </FormControl>
                    
                    {/* Flexible Timing Toggle */}
                    <FormControl display="flex" alignItems="center">
                      <FormLabel htmlFor="flexible-timing" mb="0" fontSize="sm">
                        I'm flexible with timing (-£10 discount)
                      </FormLabel>
                      <Switch
                        id="flexible-timing"
                        isChecked={isFlexible}
                        onChange={(e) => setIsFlexible(e.target.checked)}
                        colorScheme="green"
                        isDisabled={!isEditable}
                      />
                    </FormControl>
                    
                    {/* Special Notes */}
                    <FormControl>
                      <FormLabel fontSize="sm">Special Instructions</FormLabel>
                      <Input
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any special timing requirements..."
                        isDisabled={!isEditable}
                      />
                    </FormControl>
                  </VStack>
                </Collapse>
              </VStack>
            </CardBody>
          </Card>

          {/* Summary */}
          {selectedDate && selectedTimeSlot && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">
                  {isMultipleDrop ? 'Route Scheduled' : 'Pickup Scheduled'}
                </AlertTitle>
                <AlertDescription fontSize="xs">
                  {new Date(selectedDate).toLocaleDateString('en-GB', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} • {timeSlots.find(s => s.value === selectedTimeSlot)?.time}
                  {specificTime && ` at ${specificTime}`}
                  {currentSurcharge !== 0 && ` • ${formatSurcharge(currentSurcharge)}`}
                </AlertDescription>
              </Box>
            </Alert>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default EnhancedDateTimeCard;
