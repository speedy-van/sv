/**
 * Enhanced Admin Routes Dashboard
 * Full control panel for route management with real-time data
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Grid,
  Heading,
  Text,
  Button,
  ButtonGroup,
  Badge,
  Progress,
  IconButton,
  Input,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  Spinner,
  Checkbox,
  Textarea,
  FormControl,
  FormLabel,
  Stack,
  HStack,
  VStack,
  Divider,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiRefreshCw,
  FiMoreVertical,
  FiEdit,
  FiTrash,
  FiUsers,
  FiNavigation,
  FiPackage,
  FiClock,
  FiTrendingUp,
  FiCheck,
  FiX,
  FiZap,
  FiMapPin,
  FiSettings,
  FiPlay,
  FiPause,
  FiUserX,
} from 'react-icons/fi';
import { format } from 'date-fns';
import DispatchModeToggle from './DispatchModeToggle';

interface Route {
  id: string;
  status: string;
  driverId: string | null;
  driverName: string;
  totalDrops: number;
  completedDrops: number;
  startTime: Date;
  totalOutcome: number;
  progress: number;
  serviceTier: string;
  drops: any[];
}

type RouteGenerationMode = 'manual' | 'semi' | 'automatic';

const EnhancedAdminRoutesDashboard = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [schedulerStats, setSchedulerStats] = useState<any>(null);
  const [routeGenerationMode, setRouteGenerationMode] = useState<RouteGenerationMode>('semi');
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isAutoCreating, setIsAutoCreating] = useState(false);
  const [isReassigning, setIsReassigning] = useState(false);
  
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isReassignOpen, onOpen: onReassignOpen, onClose: onReassignClose } = useDisclosure();
  const { isOpen: isAutoCreateOpen, onOpen: onAutoCreateOpen, onClose: onAutoCreateClose } = useDisclosure();
  const { isOpen: isRemoveOpen, onOpen: onRemoveOpen, onClose: onRemoveClose } = useDisclosure();
  
  const [selectedRouteForRemoval, setSelectedRouteForRemoval] = useState<Route | null>(null);
  const [removalType, setRemovalType] = useState<'single' | 'all'>('single');
  const [removalReason, setRemovalReason] = useState('');
  
  const toast = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, refreshInterval);

    // Set up Pusher for real-time route updates
    if (typeof window !== 'undefined' && (window as any).Pusher) {
      const pusher = new (window as any).Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
      });

      const channel = pusher.subscribe('admin-channel');

      // Listen for route accepted events
      channel.bind('route-accepted', (data: any) => {
        console.log('🎉 Route accepted notification:', data);
        toast({
          title: 'Route Accepted',
          description: `${data.driverName} accepted a route with ${data.dropCount} stops`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
        loadData(); // Reload routes
      });

      // Listen for route declined events
      channel.bind('route-declined', (data: any) => {
        console.log('⚠️ Route declined notification:', data);
        toast({
          title: 'Route Declined',
          description: `${data.driverName} declined a route with ${data.dropCount} stops`,
          status: 'warning',
          duration: 4000,
          isClosable: true,
        });
        loadData(); // Reload routes
      });

      // Listen for route completed events
      channel.bind('route-completed', (data: any) => {
        console.log('✅ Route completed notification:', data);
        toast({
          title: 'Route Completed',
          description: `${data.driverName} completed route with ${data.totalDrops} stops`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
        loadData(); // Reload routes
      });

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
        clearInterval(interval);
      };
    }

    return () => clearInterval(interval);
  }, [refreshInterval, statusFilter, toast]);

  // Set initial mode based on scheduler status (only once)
  useEffect(() => {
    if (schedulerStats && routeGenerationMode === 'semi') {
      if (schedulerStats.enabled) {
        setRouteGenerationMode('automatic');
      }
      // If not enabled, keep the default 'semi' mode
    }
  }, [schedulerStats]);

  const loadData = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const [routesRes, schedulerRes] = await Promise.all([
        fetch(`/api/admin/routes?${params}`),
        fetch('/api/admin/routes/scheduler'),
      ]);

      const routesData = await routesRes.json();
      const schedulerData = await schedulerRes.json();

      if (routesData.success) {
        setRoutes(routesData.routes);
        setDrivers(routesData.drivers);
        setMetrics(routesData.metrics);
      }

      if (schedulerData.success) {
        setSchedulerStats(schedulerData.scheduler);
      }
    } catch (error) {
      console.error('Failed to load routes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoCreate = async () => {
    if (isAutoCreating) {
      return;
    }

    setIsAutoCreating(true);

    try {
      const response = await fetch('/api/admin/routes/auto-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxDropsPerRoute: 10,
          autoAssignDrivers: true,
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: data.message,
          status: 'success',
          duration: 5000,
        });
        loadData();
        onAutoCreateClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to auto-create routes',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsAutoCreating(false);
    }
  };

  const handleReassignDriver = async (routeId: string, newDriverId: string, reason?: string) => {
    if (isReassigning) {
      return;
    }

    setIsReassigning(true);

    try {
      // Use the new reassign API endpoint
      const response = await fetch(`/api/admin/routes/${routeId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: newDriverId,
          reason: reason || 'Reassigned by admin'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Driver Reassigned',
          description: data.message || 'Driver reassigned successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        loadData();
        onReassignClose();
      } else {
        throw new Error(data.error || 'Failed to reassign driver');
      }
    } catch (error) {
      toast({
        title: 'Reassignment Failed',
        description: error instanceof Error ? error.message : 'Failed to reassign driver',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsReassigning(false);
    }
  };

  const handleAssignDriver = async (routeId: string, driverId: string, reason?: string) => {
    if (isReassigning) {
      return;
    }

    setIsReassigning(true);

    try {
      // Use the new assign API endpoint for first-time assignment
      const response = await fetch(`/api/admin/routes/${routeId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: driverId,
          reason: reason || 'Assigned by admin'
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: 'Driver Assigned',
          description: data.message || 'Driver assigned successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        loadData();
        onReassignClose();
      } else {
        throw new Error(data.error || 'Failed to assign driver');
      }
    } catch (error) {
      toast({
        title: 'Assignment Failed',
        description: error instanceof Error ? error.message : 'Failed to assign driver',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsReassigning(false);
    }
  };

  const handleCancelRoute = async (routeId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}?reason=${encodeURIComponent(reason)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Route cancelled successfully',
          status: 'success',
          duration: 3000,
        });
        loadData();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel route',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleModeSwitch = async (newMode: RouteGenerationMode) => {
    // Prevent double clicks
    if (isSwitchingMode || routeGenerationMode === newMode) {
      return;
    }

    setIsSwitchingMode(true);

    try {
      let action = '';

      switch (newMode) {
        case 'manual':
          action = 'stop';
          break;
        case 'semi':
          action = 'stop'; // Semi mode means admin triggers manually
          break;
        case 'automatic':
          action = 'start';
          break;
      }

      if (action) {
        const response = await fetch('/api/admin/routes/scheduler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });

        const data = await response.json();

        if (data.success) {
          setRouteGenerationMode(newMode);
          toast({
            title: 'Success',
            description: `Route generation mode switched to ${newMode}`,
            status: 'success',
            duration: 3000,
          });
          loadData();
        }
      } else {
        setRouteGenerationMode(newMode);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to switch route generation mode',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSwitchingMode(false);
    }
  };

  const handleOpenRemoveModal = (route: Route) => {
    setSelectedRouteForRemoval(route);
    setRemovalType('single');
    setRemovalReason('');
    onRemoveOpen();
  };

  const handleRemoveRoute = async () => {
    if (!selectedRouteForRemoval) return;

    try {
      if (removalType === 'single') {
        // Remove single route
        const response = await fetch(
          `/api/admin/routes/${selectedRouteForRemoval.id}/unassign`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              reason: removalReason || 'Removed by admin'
            })
          }
        );

        const data = await response.json();

        if (data.success) {
          toast({
            title: 'Route Removed',
            description: data.message,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          loadData();
          onRemoveClose();
        } else {
          throw new Error(data.error || 'Failed to remove route');
        }
      } else if (removalType === 'all' && selectedRouteForRemoval.driverId) {
        // Remove all routes from driver
        const response = await fetch(
          `/api/admin/drivers/${selectedRouteForRemoval.driverId}/remove-all`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'routes',
              reason: removalReason || 'Removed all routes by admin'
            })
          }
        );

        const data = await response.json();

        if (data.success) {
          toast({
            title: 'All Routes Removed',
            description: data.message,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          loadData();
          onRemoveClose();
        } else {
          throw new Error(data.error || 'Failed to remove all routes');
        }
      }
    } catch (error) {
      toast({
        title: 'Removal Failed',
        description: error instanceof Error ? error.message : 'Failed to remove route',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'planned': return 'blue';
      case 'assigned': return 'cyan';
      case 'completed': return 'gray';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box>
      {/* Header with Actions */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="md">Routes Management</Heading>
          <Text color="gray.400" fontSize="sm">
            Real-time route monitoring and control
          </Text>
        </Box>
        <HStack spacing={3}>
          {/* Dispatch Mode Toggle */}
          <DispatchModeToggle />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            w="150px"
            bg="gray.800"
            borderColor="gray.600"
          >
            <option value="all">All Status</option>
            <option value="planned">Planned</option>
            <option value="assigned">Assigned</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </Select>

          {/* Route Generation Mode Switch */}
          <VStack spacing={1} align="end">
            <Text fontSize="xs" color="gray.400">Route Generation</Text>
            <ButtonGroup size="sm" isAttached variant="outline">
              <Button
                leftIcon={<FiSettings />}
                colorScheme={routeGenerationMode === 'manual' ? 'blue' : 'gray'}
                variant={routeGenerationMode === 'manual' ? 'solid' : 'outline'}
                onClick={() => handleModeSwitch('manual')}
                bg={routeGenerationMode === 'manual' ? 'blue.600' : 'gray.800'}
                borderColor="gray.600"
                _hover={{ bg: routeGenerationMode === 'manual' ? 'blue.700' : 'gray.700' }}
                isDisabled={isSwitchingMode}
                isLoading={isSwitchingMode && routeGenerationMode !== 'manual'}
                loadingText=""
              >
                Manual
              </Button>
              <Button
                leftIcon={<FiPlay />}
                colorScheme={routeGenerationMode === 'semi' ? 'purple' : 'gray'}
                variant={routeGenerationMode === 'semi' ? 'solid' : 'outline'}
                onClick={() => handleModeSwitch('semi')}
                bg={routeGenerationMode === 'semi' ? 'purple.600' : 'gray.800'}
                borderColor="gray.600"
                _hover={{ bg: routeGenerationMode === 'semi' ? 'purple.700' : 'gray.700' }}
                isDisabled={isSwitchingMode}
                isLoading={isSwitchingMode && routeGenerationMode !== 'semi'}
                loadingText=""
              >
                Semi
              </Button>
              <Button
                leftIcon={<FiZap />}
                colorScheme={routeGenerationMode === 'automatic' ? 'green' : 'gray'}
                variant={routeGenerationMode === 'automatic' ? 'solid' : 'outline'}
                onClick={() => handleModeSwitch('automatic')}
                bg={routeGenerationMode === 'automatic' ? 'green.600' : 'gray.800'}
                borderColor="gray.600"
                _hover={{ bg: routeGenerationMode === 'automatic' ? 'green.700' : 'gray.700' }}
                isDisabled={isSwitchingMode}
                isLoading={isSwitchingMode && routeGenerationMode !== 'automatic'}
                loadingText=""
              >
                Auto
              </Button>
            </ButtonGroup>
          </VStack>

          <Button
            leftIcon={<FiZap />}
            colorScheme="purple"
            onClick={onAutoCreateOpen}
            isDisabled={routeGenerationMode === 'manual'}
          >
            Auto Create Routes
          </Button>
          <Button
            leftIcon={<FiPlus />}
            colorScheme="blue"
            onClick={onCreateOpen}
          >
            Create Manual Route
          </Button>
          <IconButton
            aria-label="Refresh"
            icon={<FiRefreshCw />}
            onClick={loadData}
            variant="ghost"
          />
        </HStack>
      </Flex>

      {/* Route Generation Status */}
      {schedulerStats && (
        <Card bg="gray.800" borderColor={
          routeGenerationMode === 'automatic' ? 'green.500' :
          routeGenerationMode === 'semi' ? 'purple.500' : 'blue.500'
        } mb={4}>
          <CardBody>
            <Flex justify="space-between" align="center">
              <Box>
                <Flex align="center" gap={2} mb={2}>
                  <FiZap
                    color={
                      routeGenerationMode === 'automatic' ? '#48BB78' :
                      routeGenerationMode === 'semi' ? '#9F7AEA' : '#3182CE'
                    }
                    size={20}
                  />
                  <Heading size="sm" color="white">
                    Route Generation Mode: {
                      routeGenerationMode === 'automatic' ? 'Automatic' :
                      routeGenerationMode === 'semi' ? 'Semi-Automatic' : 'Manual'
                    }
                  </Heading>
                  <Badge colorScheme={
                    routeGenerationMode === 'automatic' ? 'green' :
                    routeGenerationMode === 'semi' ? 'purple' : 'blue'
                  }>
                    {routeGenerationMode.toUpperCase()}
                  </Badge>
                </Flex>
                <Text fontSize="sm" color="gray.400">
                  {routeGenerationMode === 'automatic'
                    ? 'System automatically creates routes every 15 minutes from pending drops'
                    : routeGenerationMode === 'semi'
                    ? 'Admin can manually trigger route creation from pending drops'
                    : 'Only manual route creation is allowed'}
                </Text>
                {schedulerStats.stats && (
                  <HStack spacing={4} mt={2}>
                    <Text fontSize="xs" color="gray.500">
                      Total Runs: {schedulerStats.stats.totalRuns}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Routes Created: {schedulerStats.stats.routesCreated}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Drops Processed: {schedulerStats.stats.dropsProcessed}
                    </Text>
                    {schedulerStats.stats.lastRun && (
                      <Text fontSize="xs" color="gray.500">
                        Last Run: {new Date(schedulerStats.stats.lastRun).toLocaleTimeString()}
                      </Text>
                    )}
                  </HStack>
                )}
              </Box>
              {routeGenerationMode === 'semi' && (
                <Button
                  size="sm"
                  colorScheme="purple"
                  isDisabled={isTriggering}
                  isLoading={isTriggering}
                  loadingText="Triggering..."
                  onClick={async () => {
                    if (isTriggering) {
                      return;
                    }

                    setIsTriggering(true);

                    try {
                      const response = await fetch('/api/admin/routes/scheduler', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'trigger' })
                      });
                      const data = await response.json();
                      if (data.success) {
                        toast({
                          title: 'Success',
                          description: 'Route creation triggered manually',
                          status: 'success',
                          duration: 3000,
                        });
                        loadData();
                      }
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'Failed to trigger route creation',
                        status: 'error',
                        duration: 5000,
                      });
                    } finally {
                      setIsTriggering(false);
                    }
                  }}
                >
                  Trigger Now
                </Button>
              )}
            </Flex>
          </CardBody>
        </Card>
      )}

      {/* Metrics Grid */}
      <Grid templateColumns="repeat(4, 1fr)" gap={4} mb={6}>
        <Card bg="gray.800" borderColor="gray.700">
          <CardBody>
            <Stat>
              <StatLabel color="gray.400">Total Routes</StatLabel>
              <StatNumber color="white">{metrics.totalRoutes || 0}</StatNumber>
              <StatHelpText color="gray.500">
                <FiTrendingUp style={{ display: 'inline', marginRight: 4 }} />
                All time
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="gray.800" borderColor="gray.700">
          <CardBody>
            <Stat>
              <StatLabel color="gray.400">Active Now</StatLabel>
              <StatNumber color="green.400">
                {routes.filter(r => r.status === 'active').length}
              </StatNumber>
              <StatHelpText color="gray.500">
                In progress
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="gray.800" borderColor="gray.700">
          <CardBody>
            <Stat>
              <StatLabel color="gray.400">Avg Distance</StatLabel>
              <StatNumber color="white">
                {(metrics.avgDistance || 0).toFixed(1)} km
              </StatNumber>
              <StatHelpText color="gray.500">
                Per route
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="gray.800" borderColor="gray.700">
          <CardBody>
            <Stat>
              <StatLabel color="gray.400">Available Drivers</StatLabel>
              <StatNumber color="cyan.400">
                {drivers.filter(d => d.status === 'online').length}
              </StatNumber>
              <StatHelpText color="gray.500">
                Online now
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      {/* Routes Table */}
      <Card bg="gray.800" borderColor="gray.700">
        <CardHeader>
          <Heading size="sm" color="white">Active Routes</Heading>
        </CardHeader>
        <CardBody p={0}>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th color="gray.400">Route ID</Th>
                  <Th color="gray.400">Driver</Th>
                  <Th color="gray.400">Status</Th>
                  <Th color="gray.400">Progress</Th>
                  <Th color="gray.400">Drops</Th>
                  <Th color="gray.400">Start Time</Th>
                  <Th color="gray.400">Value</Th>
                  <Th color="gray.400">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {routes.map((route) => (
                  <Tr key={route.id} _hover={{ bg: 'gray.750' }}>
                    <Td color="white" fontFamily="mono" fontSize="sm">
                      {route.id.substring(0, 8)}
                    </Td>
                    <Td>
                      <Flex align="center" gap={2}>
                        <FiUsers color={route.driverId ? '#48BB78' : '#A0AEC0'} />
                        <Text color={route.driverId ? 'white' : 'gray.400'}>
                          {route.driverName || 'Unassigned'}
                        </Text>
                      </Flex>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(route.status)}>
                        {route.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Box>
                        <Progress
                          value={route.progress}
                          size="sm"
                          colorScheme="blue"
                          borderRadius="full"
                          mb={1}
                        />
                        <Text fontSize="xs" color="gray.400">
                          {route.completedDrops}/{route.totalDrops} drops
                        </Text>
                      </Box>
                    </Td>
                    <Td color="white">{route.totalDrops}</Td>
                    <Td color="gray.300" fontSize="sm">
                      {format(new Date(route.startTime), 'MMM dd, HH:mm')}
                    </Td>
                    <Td color="white" fontWeight="bold">
                      £{(Number(route.totalOutcome) / 100).toFixed(2)}
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<FiMoreVertical />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList bg="gray.800" borderColor="gray.600">
                          <MenuItem
                            icon={<FiEdit />}
                            onClick={() => {
                              setSelectedRoute(route);
                              onEditOpen();
                            }}
                            bg="gray.800"
                            _hover={{ bg: 'gray.700' }}
                          >
                            Edit Drops
                          </MenuItem>
                          <MenuItem
                            icon={<FiUsers />}
                            onClick={() => {
                              setSelectedRoute(route);
                              onReassignOpen();
                            }}
                            bg="gray.800"
                            _hover={{ bg: 'gray.700' }}
                          >
                            {route.driverId ? 'Reassign Driver' : 'Assign Driver'}
                          </MenuItem>
                          {route.driverId && (
                            <MenuItem
                              icon={<FiUserX />}
                              onClick={() => handleOpenRemoveModal(route)}
                              bg="gray.800"
                              _hover={{ bg: 'gray.700' }}
                              color="orange.400"
                            >
                              Remove Assignment
                            </MenuItem>
                          )}
                          <MenuItem
                            icon={<FiTrash />}
                            onClick={() => handleCancelRoute(route.id, 'Cancelled by admin')}
                            bg="gray.800"
                            _hover={{ bg: 'red.900' }}
                            color="red.400"
                          >
                            Cancel Route
                          </MenuItem>
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      {/* Auto Create Modal */}
      <Modal isOpen={isAutoCreateOpen} onClose={onAutoCreateClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="white">Auto Create Routes</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text color="gray.300" mb={4}>
              System will automatically create optimized routes from pending drops
            </Text>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel color="gray.400">Max Drops Per Route</FormLabel>
                <Input type="number" defaultValue={10} bg="gray.700" />
              </FormControl>
              <Checkbox defaultChecked colorScheme="blue">
                <Text color="gray.300">Auto-assign available drivers</Text>
              </Checkbox>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onAutoCreateClose} isDisabled={isAutoCreating}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleAutoCreate}
              isDisabled={isAutoCreating}
              isLoading={isAutoCreating}
              loadingText="Creating..."
            >
              Create Routes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Assign/Reassign Driver Modal */}
      <Modal isOpen={isReassignOpen} onClose={onReassignClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800">
          <ModalHeader color="white">
            {selectedRoute?.driverId ? 'Reassign Driver' : 'Assign Driver'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              {selectedRoute?.driverId && (
                <Box>
                  <Text color="gray.400" fontSize="sm" mb={2}>
                    Current Driver: <Text as="span" color="white" fontWeight="bold">{selectedRoute.driverName}</Text>
                  </Text>
                </Box>
              )}
              <FormControl isRequired>
                <FormLabel color="gray.400">Select {selectedRoute?.driverId ? 'New' : ''} Driver</FormLabel>
                <Select
                  placeholder="Choose driver"
                  bg="gray.700"
                  color="white"
                  isDisabled={isReassigning}
                  id="driver-select"
                >
                  {drivers.filter(d => d.status === 'online').map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.status}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel color="gray.400">Reason (Optional)</FormLabel>
                <Textarea
                  placeholder="Enter reason for assignment..."
                  bg="gray.700"
                  color="white"
                  isDisabled={isReassigning}
                  id="reason-textarea"
                  rows={3}
                />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              onClick={onReassignClose} 
              isDisabled={isReassigning}
              mr={3}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              isLoading={isReassigning}
              loadingText={selectedRoute?.driverId ? 'Reassigning...' : 'Assigning...'}
              onClick={() => {
                if (!selectedRoute) return;
                
                const driverSelect = document.getElementById('driver-select') as HTMLSelectElement;
                const reasonTextarea = document.getElementById('reason-textarea') as HTMLTextAreaElement;
                
                const newDriverId = driverSelect?.value;
                const reason = reasonTextarea?.value || undefined;
                
                if (!newDriverId) {
                  toast({
                    title: 'No Driver Selected',
                    description: 'Please select a driver',
                    status: 'warning',
                    duration: 3000,
                    isClosable: true,
                  });
                  return;
                }
                
                if (selectedRoute.driverId) {
                  // Route already has a driver - reassign
                  handleReassignDriver(selectedRoute.id, newDriverId, reason);
                } else {
                  // Route has no driver - assign for first time
                  handleAssignDriver(selectedRoute.id, newDriverId, reason);
                }
              }}
            >
              {selectedRoute?.driverId ? 'Reassign Driver' : 'Assign Driver'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Remove Assignment Modal */}
      <Modal isOpen={isRemoveOpen} onClose={onRemoveClose} size="lg">
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Remove Driver Assignment</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning" bg="orange.900" borderRadius="md">
                <AlertIcon color="orange.200" />
                <Box color="orange.100">
                  This will remove the driver assignment from the route and free it up for reassignment.
                </Box>
              </Alert>

              {selectedRouteForRemoval && (
                <Box>
                  <Text fontWeight="bold" mb={2}>Route Details:</Text>
                  <Text>Route ID: {selectedRouteForRemoval.id.substring(0, 8)}</Text>
                  <Text>Drops: {selectedRouteForRemoval.totalDrops}</Text>
                  <Text>Value: £{(Number(selectedRouteForRemoval.totalOutcome) / 100).toFixed(2)}</Text>
                  {selectedRouteForRemoval.driverName && (
                    <Text>Current Driver: {selectedRouteForRemoval.driverName}</Text>
                  )}
                </Box>
              )}

              <Divider borderColor="gray.600" />

              <Box>
                <Text fontWeight="bold" mb={2}>Removal Options:</Text>
                <VStack align="stretch" spacing={2}>
                  <Button
                    variant={removalType === 'single' ? 'solid' : 'outline'}
                    colorScheme={removalType === 'single' ? 'blue' : 'gray'}
                    onClick={() => setRemovalType('single')}
                    justifyContent="flex-start"
                  >
                    Remove this route only ({selectedRouteForRemoval?.id.substring(0, 8)})
                  </Button>
                  {selectedRouteForRemoval?.driverId && (
                    <Button
                      variant={removalType === 'all' ? 'solid' : 'outline'}
                      colorScheme={removalType === 'all' ? 'red' : 'gray'}
                      onClick={() => setRemovalType('all')}
                      justifyContent="flex-start"
                    >
                      Remove ALL routes from {selectedRouteForRemoval.driverName}
                    </Button>
                  )}
                </VStack>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={2}>Reason (Optional):</Text>
                <Textarea
                  placeholder="e.g., Van breakdown, driver unavailable, etc."
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  rows={3}
                  bg="gray.700"
                  borderColor="gray.600"
                  _hover={{ borderColor: 'gray.500' }}
                  _focus={{ borderColor: 'blue.500', bg: 'gray.700' }}
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRemoveClose}>
              Cancel
            </Button>
            <Button 
              colorScheme="red" 
              onClick={handleRemoveRoute}
            >
              {removalType === 'all' ? 'Remove All Routes' : 'Remove Route'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default EnhancedAdminRoutesDashboard;

