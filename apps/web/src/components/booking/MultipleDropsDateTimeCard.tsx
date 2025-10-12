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
  CardHeader,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Select,
  Badge,
  Icon,
  Circle,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  useColorModeValue,
  Flex,
  Tooltip,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Collapse,
  IconButton,
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaClock,
  FaRoute,
  FaTruck,
  FaMapMarkerAlt,
  FaPlus,
  FaMinus,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEdit,
  FaTrash,
  FaArrowRight,
  FaSync,
} from 'react-icons/fa';

interface Drop {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledTime?: string;
  timeWindow?: {
    start: string;
    end: string;
  };
  priority: 'low' | 'medium' | 'high';
  estimatedDuration: number;
  items: Array<{
    name: string;
    quantity: number;
  }>;
}

interface RouteSchedule {
  id: string;
  startDate: string;
  startTime: string;
  endTime: string;
  totalDuration: number;
  totalDistance: number;
  serviceTier: string;
  drops: Drop[];
  optimized: boolean;
  driverId?: string;
  driverName?: string;
}

interface MultipleDropsDateTimeCardProps {
  drops: Drop[];
  onScheduleUpdate: (schedule: RouteSchedule) => void;
  onDropUpdate: (dropId: string, updates: Partial<Drop>) => void;
  onDropRemove: (dropId: string) => void;
  serviceTier: string;
  isEditable?: boolean;
  showOptimization?: boolean;
}

export const MultipleDropsDateTimeCard: React.FC<MultipleDropsDateTimeCardProps> = ({
  drops,
  onScheduleUpdate,
  onDropUpdate,
  onDropRemove,
  serviceTier,
  isEditable = true,
  showOptimization = true,
}) => {
  const [schedule, setSchedule] = useState<RouteSchedule>({
    id: `route_${Date.now()}`,
    startDate: '',
    startTime: '',
    endTime: '',
    totalDuration: 0,
    totalDistance: 0,
    serviceTier,
    drops,
    optimized: false,
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const [timeConflicts, setTimeConflicts] = useState<string[]>([]);
  
  const { isOpen: isDropModalOpen, onOpen: onDropModalOpen, onClose: onDropModalClose } = useDisclosure();
  const { isOpen: isOptimizeModalOpen, onOpen: onOptimizeModalOpen, onClose: onOptimizeModalClose } = useDisclosure();
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Calculate total route metrics
  useEffect(() => {
    const totalDuration = drops.reduce((sum, drop) => sum + drop.estimatedDuration, 0);
    const totalDistance = drops.length * 8.5; // Estimated 8.5 miles per drop
    
    // Calculate end time based on start time and total duration
    let endTime = '';
    if (schedule.startTime) {
      const [hours, minutes] = schedule.startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + totalDuration;
      const endHours = Math.floor(endMinutes / 60) % 24;
      const endMins = endMinutes % 60;
      endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
    }

    setSchedule(prev => ({
      ...prev,
      drops,
      totalDuration,
      totalDistance,
      endTime,
    }));
  }, [drops, schedule.startTime]);

  // Detect time conflicts
  useEffect(() => {
    const conflicts: string[] = [];
    
    drops.forEach((drop, index) => {
      if (drop.timeWindow) {
        const dropStart = new Date(`${schedule.startDate}T${drop.timeWindow.start}`);
        const dropEnd = new Date(`${schedule.startDate}T${drop.timeWindow.end}`);
        
        // Check for overlaps with other drops
        drops.forEach((otherDrop, otherIndex) => {
          if (index !== otherIndex && otherDrop.timeWindow) {
            const otherStart = new Date(`${schedule.startDate}T${otherDrop.timeWindow.start}`);
            const otherEnd = new Date(`${schedule.startDate}T${otherDrop.timeWindow.end}`);
            
            if ((dropStart < otherEnd && dropEnd > otherStart)) {
              conflicts.push(`Drop ${index + 1} conflicts with Drop ${otherIndex + 1}`);
            }
          }
        });
      }
    });
    
    setTimeConflicts([...new Set(conflicts)]);
  }, [drops, schedule.startDate]);

  const handleDateChange = useCallback((date: string) => {
    setSchedule(prev => ({ ...prev, startDate: date }));
  }, []);

  const handleStartTimeChange = useCallback((time: string) => {
    setSchedule(prev => ({ ...prev, startTime: time }));
  }, []);

  const handleDropTimeUpdate = useCallback((dropId: string, timeWindow: { start: string; end: string }) => {
    onDropUpdate(dropId, { timeWindow });
  }, [onDropUpdate]);

  const handleOptimizeRoute = useCallback(async () => {
    setIsOptimizing(true);
    
    try {
      // Simulate route optimization API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock optimization: sort by priority and geographical proximity
      const optimizedDrops = [...drops].sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
      // Assign optimized time windows
      let currentTime = schedule.startTime ? new Date(`${schedule.startDate}T${schedule.startTime}`) : new Date();
      
      optimizedDrops.forEach((drop, index) => {
        const startTime = new Date(currentTime);
        const endTime = new Date(currentTime.getTime() + drop.estimatedDuration * 60000);
        
        onDropUpdate(drop.id, {
          timeWindow: {
            start: startTime.toTimeString().slice(0, 5),
            end: endTime.toTimeString().slice(0, 5),
          },
        });
        
        // Add travel time to next drop (15 minutes average)
        currentTime = new Date(endTime.getTime() + 15 * 60000);
      });
      
      setSchedule(prev => ({ ...prev, optimized: true }));
      
      toast({
        title: 'Route Optimized',
        description: `Route optimized for ${drops.length} drops with minimal travel time`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      toast({
        title: 'Optimization Failed',
        description: 'Unable to optimize route. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsOptimizing(false);
      onOptimizeModalClose();
    }
  }, [drops, schedule.startTime, schedule.startDate, onDropUpdate, toast, onOptimizeModalClose]);

  const handleSaveSchedule = useCallback(() => {
    if (!schedule.startDate || !schedule.startTime) {
      toast({
        title: 'Missing Information',
        description: 'Please select both date and start time',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (timeConflicts.length > 0) {
      toast({
        title: 'Time Conflicts Detected',
        description: 'Please resolve time conflicts before saving',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    onScheduleUpdate(schedule);
    
    toast({
      title: 'Schedule Saved',
      description: `Route scheduled for ${new Date(schedule.startDate).toLocaleDateString()} at ${schedule.startTime}`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  }, [schedule, timeConflicts, onScheduleUpdate, toast]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'gray';
      default: return 'gray';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card bg={cardBg} borderRadius="xl" shadow="lg" border="1px solid" borderColor={borderColor}>
      <CardHeader>
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <HStack justify="space-between" align="start">
            <VStack align="start" spacing={1}>
              <HStack spacing={3}>
                <Circle size="50px" bg="blue.500" color="white">
                  <Icon as={FaRoute} boxSize={6} />
                </Circle>
                <VStack align="start" spacing={0}>
                  <Heading size="lg" color="gray.700">
                    📅 Multiple Drops Schedule
                  </Heading>
                  <Text fontSize="sm" color="gray.500">
                    Plan your route with {drops.length} drop{drops.length !== 1 ? 's' : ''}
                  </Text>
                </VStack>
              </HStack>
            </VStack>
            
            <VStack align="end" spacing={2}>
              <Badge colorScheme={schedule.optimized ? 'green' : 'gray'} variant="solid">
                {schedule.optimized ? '✓ Optimized' : 'Not Optimized'}
              </Badge>
              {timeConflicts.length > 0 && (
                <Badge colorScheme="red" variant="solid">
                  {timeConflicts.length} Conflict{timeConflicts.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </VStack>
          </HStack>

          {/* Route Summary */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Card variant="outline">
              <CardBody textAlign="center" py={3}>
                <Text fontSize="xs" color="gray.500" mb={1}>Total Drops</Text>
                <Text fontSize="lg" fontWeight="bold">{drops.length}</Text>
              </CardBody>
            </Card>
            <Card variant="outline">
              <CardBody textAlign="center" py={3}>
                <Text fontSize="xs" color="gray.500" mb={1}>Duration</Text>
                <Text fontSize="lg" fontWeight="bold">{formatDuration(schedule.totalDuration)}</Text>
              </CardBody>
            </Card>
            <Card variant="outline">
              <CardBody textAlign="center" py={3}>
                <Text fontSize="xs" color="gray.500" mb={1}>Distance</Text>
                <Text fontSize="lg" fontWeight="bold">{schedule.totalDistance.toFixed(1)} mi</Text>
              </CardBody>
            </Card>
            <Card variant="outline">
              <CardBody textAlign="center" py={3}>
                <Text fontSize="xs" color="gray.500" mb={1}>Service</Text>
                <Text fontSize="lg" fontWeight="bold">{serviceTier.replace('_', ' ')}</Text>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </CardHeader>

      <CardBody>
        <VStack spacing={6} align="stretch">
          {/* Date and Time Selection */}
          <Card variant="outline">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="gray.700">
                  <Icon as={FaCalendarAlt} mr={2} />
                  Route Date & Time
                </Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Start Date</FormLabel>
                    <Input
                      type="date"
                      value={schedule.startDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      isDisabled={!isEditable}
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel fontSize="sm">Start Time</FormLabel>
                    <Input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      isDisabled={!isEditable}
                    />
                  </FormControl>
                </SimpleGrid>
                
                {schedule.startTime && schedule.endTime && (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">Estimated Completion</AlertTitle>
                      <AlertDescription fontSize="xs">
                        Route will finish around {schedule.endTime} ({formatDuration(schedule.totalDuration)} total)
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Time Conflicts Alert */}
          {timeConflicts.length > 0 && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box>
                <AlertTitle fontSize="sm">Time Conflicts Detected</AlertTitle>
                <AlertDescription fontSize="xs">
                  {timeConflicts.join(', ')}. Please adjust drop time windows.
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Drops List */}
          <Card variant="outline">
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Heading size="md" color="gray.700">
                    <Icon as={FaTruck} mr={2} />
                    Drop Schedule
                  </Heading>
                  
                  {showOptimization && isEditable && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      variant="outline"
                      leftIcon={<FaSync />}
                      onClick={onOptimizeModalOpen}
                      isLoading={isOptimizing}
                    >
                      Optimize Route
                    </Button>
                  )}
                </HStack>
                
                <VStack spacing={3} align="stretch">
                  {drops.map((drop, index) => (
                    <Card key={drop.id} variant="outline" bg="gray.50">
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          <HStack justify="space-between" align="start">
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <Badge colorScheme="blue" variant="outline">
                                  Drop {index + 1}
                                </Badge>
                                <Badge colorScheme={getPriorityColor(drop.priority)} size="sm">
                                  {drop.priority}
                                </Badge>
                              </HStack>
                              <Text fontSize="sm" fontWeight="medium">
                                {drop.pickupAddress} → {drop.dropoffAddress}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {drop.items.length} item{drop.items.length !== 1 ? 's' : ''} • {formatDuration(drop.estimatedDuration)}
                              </Text>
                            </VStack>
                            
                            {isEditable && (
                              <HStack>
                                <IconButton
                                  aria-label="Edit drop"
                                  icon={<FaEdit />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedDrop(drop);
                                    onDropModalOpen();
                                  }}
                                />
                                <IconButton
                                  aria-label="Remove drop"
                                  icon={<FaTrash />}
                                  size="sm"
                                  variant="ghost"
                                  colorScheme="red"
                                  onClick={() => onDropRemove(drop.id)}
                                />
                              </HStack>
                            )}
                          </HStack>
                          
                          {/* Time Window */}
                          {drop.timeWindow && (
                            <HStack spacing={2} fontSize="xs">
                              <Icon as={FaClock} color="gray.500" />
                              <Text color="gray.600">
                                {drop.timeWindow.start} - {drop.timeWindow.end}
                              </Text>
                            </HStack>
                          )}
                          
                          {/* Time Window Editor */}
                          {isEditable && (
                            <Collapse in={selectedDrop?.id === drop.id}>
                              <SimpleGrid columns={2} spacing={2} mt={2}>
                                <FormControl size="sm">
                                  <FormLabel fontSize="xs">Start Time</FormLabel>
                                  <Input
                                    type="time"
                                    size="sm"
                                    value={drop.timeWindow?.start || ''}
                                    onChange={(e) => handleDropTimeUpdate(drop.id, {
                                      start: e.target.value,
                                      end: drop.timeWindow?.end || '',
                                    })}
                                  />
                                </FormControl>
                                <FormControl size="sm">
                                  <FormLabel fontSize="xs">End Time</FormLabel>
                                  <Input
                                    type="time"
                                    size="sm"
                                    value={drop.timeWindow?.end || ''}
                                    onChange={(e) => handleDropTimeUpdate(drop.id, {
                                      start: drop.timeWindow?.start || '',
                                      end: e.target.value,
                                    })}
                                  />
                                </FormControl>
                              </SimpleGrid>
                            </Collapse>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Action Buttons */}
          {isEditable && (
            <HStack spacing={3} justify="end">
              <Button
                colorScheme="blue"
                leftIcon={<FaCheckCircle />}
                onClick={handleSaveSchedule}
                isDisabled={!schedule.startDate || !schedule.startTime || timeConflicts.length > 0}
              >
                Save Schedule
              </Button>
            </HStack>
          )}
        </VStack>
      </CardBody>

      {/* Route Optimization Modal */}
      <Modal isOpen={isOptimizeModalOpen} onClose={onOptimizeModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Optimize Route</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">Route Optimization</AlertTitle>
                  <AlertDescription fontSize="xs">
                    This will automatically arrange drops for minimal travel time and respect priority levels.
                  </AlertDescription>
                </Box>
              </Alert>
              
              <Text fontSize="sm" color="gray.600">
                The optimization will:
              </Text>
              <VStack align="start" spacing={1} pl={4}>
                <Text fontSize="xs">• Prioritize high-priority drops</Text>
                <Text fontSize="xs">• Minimize total travel distance</Text>
                <Text fontSize="xs">• Assign optimal time windows</Text>
                <Text fontSize="xs">• Resolve scheduling conflicts</Text>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onOptimizeModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleOptimizeRoute}
              isLoading={isOptimizing}
              loadingText="Optimizing..."
            >
              Optimize Route
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Drop Edit Modal */}
      <Modal isOpen={isDropModalOpen} onClose={onDropModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Drop Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedDrop && (
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel fontSize="sm">Priority</FormLabel>
                  <Select
                    value={selectedDrop.priority}
                    onChange={(e) => onDropUpdate(selectedDrop.id, { priority: e.target.value as 'low' | 'medium' | 'high' })}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel fontSize="sm">Estimated Duration (minutes)</FormLabel>
                  <NumberInput
                    value={selectedDrop.estimatedDuration}
                    onChange={(_, value) => onDropUpdate(selectedDrop.id, { estimatedDuration: value })}
                    min={15}
                    max={240}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDropModalClose}>
              Close
            </Button>
            <Button colorScheme="blue" onClick={onDropModalClose}>
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default MultipleDropsDateTimeCard;
