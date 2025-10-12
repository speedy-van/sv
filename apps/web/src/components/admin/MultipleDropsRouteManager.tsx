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
  Badge,
  Progress,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Tooltip,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Select,
  Input,
  Textarea,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Flex,
  Avatar,
  Tag,
  TagLabel,
  TagCloseButton,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiTruck,
  FiMapPin,
  FiClock,
  FiUser,
  FiCheck,
  FiX,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiRefreshCw,
  FiNavigation,
  FiPhone,
  FiMail,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';

interface Drop {
  id: string;
  reference: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: 'pending' | 'assigned_to_route' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  scheduledAt: string;
  totalAmount: number;
  itemsCount: number;
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high';
  booking?: {
    customerName: string;
    customerPhone: string;
  };
  User?: {
    name: string;
    email: string;
  };
}

interface Route {
  id: string;
  status: 'pending_assignment' | 'assigned' | 'active' | 'completed' | 'failed';
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  serviceTier: string;
  totalDrops: number;
  completedDrops: number;
  estimatedDuration: number;
  totalDistance: number;
  totalValue: number;
  progress: number;
  timeWindowStart: string;
  timeWindowEnd: string;
  createdAt: string;
  drops: Drop[];
  // Add editable fields for admin control
  adminAdjustedPrice?: number;
  adminNotes?: string;
  isModifiedByAdmin?: boolean;
}

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'offline' | 'available' | 'on_route' | 'break';
  currentRoutes: number;
  maxRoutes: number;
  rating: number;
  completedJobs: number;
  isOnline: boolean;
  lastSeen: string;
}

interface DriverResponse {
  driverId: string;
  response: 'accept' | 'decline' | 'view_details' | 'pending';
  responseTime: string;
  reason?: string;
}

export const MultipleDropsRouteManager: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [availableDrops, setAvailableDrops] = useState<Drop[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [driverResponses, setDriverResponses] = useState<Record<string, DriverResponse>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [selectedDrops, setSelectedDrops] = useState<string[]>([]);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [editedPrice, setEditedPrice] = useState<number>(0);
  const [editedDrops, setEditedDrops] = useState<string[]>([]);
  const [editedNotes, setEditedNotes] = useState<string>('');

  const { isOpen: isRouteModalOpen, onOpen: onRouteModalOpen, onClose: onRouteModalClose } = useDisclosure();
  const { isOpen: isDriverModalOpen, onOpen: onDriverModalOpen, onClose: onDriverModalClose } = useDisclosure();
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Load data on component mount
  useEffect(() => {
    loadData();
    
    // Set up real-time updates
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Load routes
      const routesResponse = await fetch('/api/admin/routes');
      const routesData = await routesResponse.json();
      
      // Load available drops (not assigned to routes)
      const dropsResponse = await fetch('/api/admin/drops?status=pending');
      const dropsData = await dropsResponse.json();
      
      // Load available drivers
      const driversResponse = await fetch('/api/admin/drivers?status=available');
      const driversData = await driversResponse.json();
      
      if (routesData.success) setRoutes(routesData.data.routes || []);
      if (dropsData.success) setAvailableDrops(dropsData.data.drops || []);
      if (driversData.success) setAvailableDrivers(driversData.data.drivers || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error Loading Data',
        description: 'Failed to load routes and drops data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const createRoute = useCallback(async (routeData: {
    dropIds: string[];
    serviceTier: string;
    timeWindowStart: string;
    timeWindowEnd: string;
    priority: string;
  }) => {
    try {
      setIsCreatingRoute(true);
      
      const response = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routeData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Route Created',
          description: `Route ${result.data.route.id} created with ${routeData.dropIds.length} drops`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Refresh data
        await loadData();
        setSelectedDrops([]);
        onRouteModalClose();
      } else {
        throw new Error(result.error || 'Failed to create route');
      }
      
    } catch (error) {
      console.error('Error creating route:', error);
      toast({
        title: 'Error Creating Route',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCreatingRoute(false);
    }
  }, [toast, loadData, onRouteModalClose]);

  const editRoute = useCallback((route: Route) => {
    setEditingRoute(route);
    setEditedPrice(route.adminAdjustedPrice || route.totalValue);
    setEditedDrops(route.drops.map(d => d.id));
    setEditedNotes(route.adminNotes || '');
    onEditModalOpen();
  }, [onEditModalOpen]);

  const saveRouteEdits = useCallback(async () => {
    if (!editingRoute) return;

    try {
      const response = await fetch(`/api/admin/routes/${editingRoute.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminAdjustedPrice: editedPrice,
          adminNotes: editedNotes,
          dropIds: editedDrops,
          isModifiedByAdmin: true
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Route Updated',
          description: `Route ${editingRoute.id} has been updated successfully`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        await loadData();
        onEditModalClose();
      } else {
        throw new Error(result.error || 'Failed to update route');
      }
    } catch (error) {
      console.error('Error updating route:', error);
      toast({
        title: 'Error Updating Route',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [editingRoute, editedPrice, editedNotes, editedDrops, toast, loadData, onEditModalClose]);

  const assignDriverToRoute = useCallback(async (routeId: string, driverId: string) => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Driver Assigned',
          description: `Driver assigned to route ${routeId}. 5-minute response window started.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Start monitoring driver response
        monitorDriverResponse(routeId, driverId);
        await loadData();
      } else {
        throw new Error(result.error || 'Failed to assign driver');
      }
      
    } catch (error) {
      console.error('Error assigning driver:', error);
      toast({
        title: 'Error Assigning Driver',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [toast, loadData]);

  const monitorDriverResponse = useCallback((routeId: string, driverId: string) => {
    // Set initial pending response
    setDriverResponses(prev => ({
      ...prev,
      [routeId]: {
        driverId,
        response: 'pending',
        responseTime: new Date().toISOString(),
      }
    }));

    // Start 5-minute countdown
    const timeout = setTimeout(() => {
      setDriverResponses(prev => ({
        ...prev,
        [routeId]: {
          ...prev[routeId],
          response: 'decline',
          reason: 'No response within 5 minutes',
        }
      }));
      
      toast({
        title: 'Driver Response Timeout',
        description: `Driver did not respond within 5 minutes for route ${routeId}`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
    }, 5 * 60 * 1000); // 5 minutes

    // Clean up timeout if component unmounts
    return () => clearTimeout(timeout);
  }, [toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_assignment': return 'orange';
      case 'assigned': return 'blue';
      case 'active': return 'green';
      case 'completed': return 'gray';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_assignment': return FiClock;
      case 'assigned': return FiUser;
      case 'active': return FiTruck;
      case 'completed': return FiCheck;
      case 'failed': return FiX;
      default: return FiClock;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
        <Text mt={4}>Loading multiple drops routes...</Text>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg">Multiple Drops Route Management</Heading>
            <Text color="gray.600">
              Manage multi-drop routes, assign drivers, and monitor progress
            </Text>
          </VStack>
          <HStack spacing={3}>
            <Button
              leftIcon={<FiRefreshCw />}
              onClick={loadData}
              variant="outline"
              isLoading={isLoading}
            >
              Refresh
            </Button>
            <Button
              leftIcon={<FiPlus />}
              colorScheme="blue"
              onClick={onRouteModalOpen}
              isDisabled={availableDrops.length === 0}
            >
              Create Route
            </Button>
          </HStack>
        </Flex>

        {/* Statistics Cards */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Active Routes</StatLabel>
                <StatNumber>{routes.filter(r => r.status === 'active').length}</StatNumber>
                <StatHelpText>Currently in progress</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Pending Assignment</StatLabel>
                <StatNumber>{routes.filter(r => r.status === 'pending_assignment').length}</StatNumber>
                <StatHelpText>Awaiting driver assignment</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Available Drops</StatLabel>
                <StatNumber>{availableDrops.length}</StatNumber>
                <StatHelpText>Ready for routing</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel>Available Drivers</StatLabel>
                <StatNumber>{availableDrivers.filter(d => d.status === 'available').length}</StatNumber>
                <StatHelpText>Ready for assignment</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Routes Table */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Current Routes</Heading>
          </CardHeader>
          <CardBody>
            {routes.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                <AlertTitle>No routes found</AlertTitle>
                <AlertDescription>
                  Create your first multiple drops route to get started.
                </AlertDescription>
              </Alert>
            ) : (
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Route ID</Th>
                      <Th>Status</Th>
                      <Th>Driver</Th>
                      <Th>Drops</Th>
                      <Th>Progress</Th>
                      <Th>Value</Th>
                      <Th>Time Window</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {routes.map((route) => {
                      const StatusIcon = getStatusIcon(route.status);
                      const driverResponse = driverResponses[route.id];
                      
                      return (
                        <Tr key={route.id}>
                          <Td>
                            <Text fontFamily="mono" fontSize="sm">
                              {route.id.slice(-8)}
                            </Text>
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={getStatusColor(route.status)}
                              variant="subtle"
                              display="flex"
                              alignItems="center"
                              gap={1}
                              w="fit-content"
                            >
                              <StatusIcon size={12} />
                              {route.status.replace('_', ' ')}
                            </Badge>
                          </Td>
                          <Td>
                            {route.driverName ? (
                              <VStack align="start" spacing={1}>
                                <Text fontSize="sm" fontWeight="medium">
                                  {route.driverName}
                                </Text>
                                {driverResponse && (
                                  <Badge
                                    size="sm"
                                    colorScheme={
                                      driverResponse.response === 'accept' ? 'green' :
                                      driverResponse.response === 'decline' ? 'red' :
                                      driverResponse.response === 'view_details' ? 'blue' : 'yellow'
                                    }
                                  >
                                    {driverResponse.response}
                                  </Badge>
                                )}
                              </VStack>
                            ) : (
                              <Text fontSize="sm" color="gray.500">
                                Unassigned
                              </Text>
                            )}
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {route.completedDrops}/{route.totalDrops}
                            </Text>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Progress
                                value={route.progress}
                                size="sm"
                                colorScheme="green"
                                w="60px"
                              />
                              <Text fontSize="xs" color="gray.500">
                                {Math.round(route.progress)}%
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="medium">
                                {formatCurrency(route.adminAdjustedPrice || route.totalValue)}
                              </Text>
                              {route.adminAdjustedPrice && route.adminAdjustedPrice !== route.totalValue && (
                                <Text fontSize="xs" color="gray.500">
                                  Was: {formatCurrency(route.totalValue)}
                                </Text>
                              )}
                            </VStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontSize="xs">
                                {new Date(route.timeWindowStart).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                to {new Date(route.timeWindowEnd).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <HStack spacing={1}>
                              <Tooltip label="View Details">
                                <IconButton
                                  aria-label="View route details"
                                  icon={<FiEye />}
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedRoute(route);
                                    onDriverModalOpen();
                                  }}
                                />
                              </Tooltip>
                              {route.status === 'pending_assignment' && (
                                <>
                                  <Tooltip label="Edit Route">
                                    <IconButton
                                      aria-label="Edit route"
                                      icon={<FiEdit />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="orange"
                                      onClick={() => editRoute(route)}
                                    />
                                  </Tooltip>
                                  <Tooltip label="Assign Driver">
                                    <IconButton
                                      aria-label="Assign driver"
                                      icon={<FiUser />}
                                      size="sm"
                                      variant="ghost"
                                      colorScheme="blue"
                                      onClick={() => {
                                        setSelectedRoute(route);
                                        onDriverModalOpen();
                                      }}
                                    />
                                  </Tooltip>
                                </>
                              )}
                              {route.isModifiedByAdmin && (
                                <Tooltip label="Modified by Admin">
                                  <Badge colorScheme="purple" size="sm">
                                    MODIFIED
                                  </Badge>
                                </Tooltip>
                              )}
                            </HStack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </CardBody>
        </Card>

        {/* Available Drops */}
        {availableDrops.length > 0 && (
          <Card bg={cardBg} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Available Drops ({availableDrops.length})</Heading>
              <Text fontSize="sm" color="gray.600">
                Select drops to create a new route
              </Text>
            </CardHeader>
            <CardBody>
              <TableContainer>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>Select</Th>
                      <Th>Reference</Th>
                      <Th>Customer</Th>
                      <Th>Pickup → Dropoff</Th>
                      <Th>Scheduled</Th>
                      <Th>Value</Th>
                      <Th>Priority</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {availableDrops.map((drop) => (
                      <Tr key={drop.id}>
                        <Td>
                          <input
                            type="checkbox"
                            checked={selectedDrops.includes(drop.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDrops(prev => [...prev, drop.id]);
                              } else {
                                setSelectedDrops(prev => prev.filter(id => id !== drop.id));
                              }
                            }}
                          />
                        </Td>
                        <Td>
                          <Text fontFamily="mono" fontSize="sm">
                            {drop.reference}
                          </Text>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="medium">
                              {drop.booking?.customerName || drop.User?.name || 'Unknown'}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {drop.booking?.customerPhone || 'No phone'}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" noOfLines={1}>
                              📍 {drop.pickupAddress}
                            </Text>
                            <Text fontSize="xs" color="gray.500" noOfLines={1}>
                              🎯 {drop.dropoffAddress}
                            </Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {new Date(drop.scheduledAt).toLocaleDateString('en-GB')}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(drop.scheduledAt).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm" fontWeight="medium">
                            {formatCurrency(drop.totalAmount)}
                          </Text>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={
                              drop.priority === 'high' ? 'red' :
                              drop.priority === 'medium' ? 'orange' : 'gray'
                            }
                            size="sm"
                          >
                            {drop.priority}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
              
              {selectedDrops.length > 0 && (
                <Box mt={4} p={4} bg="blue.50" borderRadius="md">
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="medium">
                      {selectedDrops.length} drops selected
                    </Text>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={onRouteModalOpen}
                    >
                      Create Route
                    </Button>
                  </HStack>
                </Box>
              )}
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Create Route Modal */}
      <Modal isOpen={isRouteModalOpen} onClose={onRouteModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create Multiple Drops Route</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Route Creation</AlertTitle>
                  <AlertDescription>
                    Creating a route with {selectedDrops.length} selected drops.
                  </AlertDescription>
                </Box>
              </Alert>
              
              <FormControl>
                <FormLabel>Service Tier</FormLabel>
                <Select placeholder="Select service tier">
                  <option value="small_van">Small Van</option>
                  <option value="large_van">Large Van</option>
                  <option value="truck">Truck</option>
                </Select>
              </FormControl>
              
              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Time Window Start</FormLabel>
                  <Input type="time" />
                </FormControl>
                <FormControl>
                  <FormLabel>Time Window End</FormLabel>
                  <Input type="time" />
                </FormControl>
              </SimpleGrid>
              
              <FormControl>
                <FormLabel>Priority</FormLabel>
                <Select placeholder="Select priority">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRouteModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              isLoading={isCreatingRoute}
              onClick={() => {
                // This would be implemented with form data
                createRoute({
                  dropIds: selectedDrops,
                  serviceTier: 'large_van',
                  timeWindowStart: new Date().toISOString(),
                  timeWindowEnd: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                  priority: 'medium',
                });
              }}
            >
              Create Route
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Driver Assignment Modal */}
      <Modal isOpen={isDriverModalOpen} onClose={onDriverModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedRoute?.driverName ? 'Route Details' : 'Assign Driver to Route'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRoute && (
              <VStack spacing={4} align="stretch">
                <Card>
                  <CardBody>
                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Route ID</Text>
                        <Text fontFamily="mono">{selectedRoute.id}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Status</Text>
                        <Badge colorScheme={getStatusColor(selectedRoute.status)}>
                          {selectedRoute.status.replace('_', ' ')}
                        </Badge>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Total Drops</Text>
                        <Text>{selectedRoute.totalDrops}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Total Value</Text>
                        <Text fontWeight="medium">{formatCurrency(selectedRoute.totalValue)}</Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>
                
                {!selectedRoute.driverName && availableDrivers.length > 0 && (
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Available Drivers</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={3}>
                        {availableDrivers.map((driver) => (
                          <Card key={driver.id} variant="outline" w="full">
                            <CardBody>
                              <HStack justify="space-between">
                                <HStack spacing={3}>
                                  <Avatar size="sm" name={driver.name} />
                                  <VStack align="start" spacing={0}>
                                    <Text fontWeight="medium">{driver.name}</Text>
                                    <Text fontSize="sm" color="gray.500">
                                      {driver.completedJobs} jobs • ⭐ {driver.rating.toFixed(1)}
                                    </Text>
                                  </VStack>
                                </HStack>
                                <Button
                                  size="sm"
                                  colorScheme="blue"
                                  onClick={() => assignDriverToRoute(selectedRoute.id, driver.id)}
                                >
                                  Assign
                                </Button>
                              </HStack>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                )}
                
                {selectedRoute.driverName && (
                  <Alert status="success">
                    <AlertIcon />
                    <Box>
                      <AlertTitle>Driver Assigned</AlertTitle>
                      <AlertDescription>
                        {selectedRoute.driverName} is assigned to this route.
                        Driver has 5 minutes to Accept/Decline/View Details.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onDriverModalClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Route Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Route - Full Admin Control</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editingRoute && (
              <VStack spacing={6} align="stretch">
                {/* Route Info */}
                <Card>
                  <CardBody>
                    <SimpleGrid columns={2} spacing={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Route ID</Text>
                        <Text fontFamily="mono">{editingRoute.id}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Original Value</Text>
                        <Text fontWeight="medium">{formatCurrency(editingRoute.totalValue)}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Service Tier</Text>
                        <Badge colorScheme="blue">{editingRoute.serviceTier}</Badge>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500">Total Drops</Text>
                        <Text>{editingRoute.totalDrops}</Text>
                      </Box>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Price Adjustment */}
                <Card>
                  <CardHeader>
                    <Heading size="sm">Price Adjustment</Heading>
                    <Text fontSize="sm" color="gray.600">
                      Set the final price for this route before assigning to driver
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <FormControl>
                      <FormLabel>Adjusted Price (£)</FormLabel>
                      <Input
                        type="number"
                        step="0.01"
                        value={editedPrice}
                        onChange={(e) => setEditedPrice(parseFloat(e.target.value) || 0)}
                        placeholder="Enter adjusted price"
                      />
                      <Text fontSize="sm" color="gray.500" mt={1}>
                        Original: {formatCurrency(editingRoute.totalValue)} |
                        Adjustment: {editedPrice !== (editingRoute.adminAdjustedPrice || editingRoute.totalValue)
                          ? `${editedPrice > (editingRoute.adminAdjustedPrice || editingRoute.totalValue) ? '+' : ''}${
                              formatCurrency(editedPrice - (editingRoute.adminAdjustedPrice || editingRoute.totalValue))
                            }`
                          : 'No change'}
                      </Text>
                    </FormControl>
                  </CardBody>
                </Card>

                {/* Drops Management */}
                <Card>
                  <CardHeader>
                    <Heading size="sm">Manage Drops</Heading>
                    <Text fontSize="sm" color="gray.600">
                      Add or remove drops from this route
                    </Text>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Text fontSize="sm" fontWeight="medium">
                        Current Drops ({editedDrops.length})
                      </Text>

                      {editingRoute.drops.map((drop) => (
                        <Card key={drop.id} variant="outline" size="sm">
                          <CardBody>
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <HStack>
                                  <input
                                    type="checkbox"
                                    checked={editedDrops.includes(drop.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setEditedDrops(prev => [...prev, drop.id]);
                                      } else {
                                        setEditedDrops(prev => prev.filter(id => id !== drop.id));
                                      }
                                    }}
                                  />
                                  <Text fontSize="sm" fontWeight="medium">
                                    {drop.reference}
                                  </Text>
                                </HStack>
                                <Text fontSize="xs" color="gray.500">
                                  {drop.booking?.customerName || drop.User?.name || 'Unknown'} • {formatCurrency(drop.totalAmount)}
                                </Text>
                                <Text fontSize="xs" noOfLines={1}>
                                  📍 {drop.pickupAddress} → 🎯 {drop.dropoffAddress}
                                </Text>
                              </VStack>
                              <Badge
                                colorScheme={
                                  editedDrops.includes(drop.id) ? 'green' : 'red'
                                }
                                size="sm"
                              >
                                {editedDrops.includes(drop.id) ? 'Included' : 'Excluded'}
                              </Badge>
                            </HStack>
                          </CardBody>
                        </Card>
                      ))}

                      {/* Add available drops */}
                      {availableDrops.length > 0 && (
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" mb={2}>
                            Add from Available Drops
                          </Text>
                          <VStack spacing={2} align="stretch">
                            {availableDrops.slice(0, 5).map((drop) => (
                              <Card key={drop.id} variant="outline" size="sm">
                                <CardBody>
                                  <HStack justify="space-between">
                                    <VStack align="start" spacing={1}>
                                      <Text fontSize="sm" fontWeight="medium">
                                        {drop.reference}
                                      </Text>
                                      <Text fontSize="xs" color="gray.500">
                                        {drop.booking?.customerName || drop.User?.name || 'Unknown'} • {formatCurrency(drop.totalAmount)}
                                      </Text>
                                    </VStack>
                                    <Button
                                      size="xs"
                                      colorScheme="green"
                                      onClick={() => {
                                        setEditedDrops(prev => [...prev, drop.id]);
                                      }}
                                      isDisabled={editedDrops.includes(drop.id)}
                                    >
                                      {editedDrops.includes(drop.id) ? 'Added' : 'Add'}
                                    </Button>
                                  </HStack>
                                </CardBody>
                              </Card>
                            ))}
                          </VStack>
                        </Box>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Admin Notes */}
                <Card>
                  <CardHeader>
                    <Heading size="sm">Admin Notes</Heading>
                  </CardHeader>
                  <CardBody>
                    <FormControl>
                      <FormLabel>Internal Notes (Optional)</FormLabel>
                      <Textarea
                        value={editedNotes}
                        onChange={(e) => setEditedNotes(e.target.value)}
                        placeholder="Add notes about this route modification..."
                        rows={3}
                      />
                    </FormControl>
                  </CardBody>
                </Card>

                {/* Summary */}
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Route Summary</AlertTitle>
                    <AlertDescription>
                      <VStack align="start" spacing={1}>
                        <Text>Drops: {editedDrops.length} (was {editingRoute.totalDrops})</Text>
                        <Text>Adjusted Price: {formatCurrency(editedPrice)}</Text>
                        <Text>Status: Will be marked as modified by admin</Text>
                      </VStack>
                    </AlertDescription>
                  </Box>
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={saveRouteEdits}
              isDisabled={!editingRoute}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default MultipleDropsRouteManager;
