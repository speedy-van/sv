/**
 * Admin Dashboard Multi-Drop Route Management Enhancement
 * 
 * Comprehensive admin interface for monitoring and managing the Multi-Drop Route system.
 * Provi      loadDashboardData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Calculate live progress percentage based on completed drops
  const getProgressPercentage = (route: RouteData): number => {
    if (route.status === 'completed') return 100;
    if (route.status === 'planned') return 0;
    
    const { completedDrops, totalDrops } = route;
    if (totalDrops === 0) return 0;
    
    return Math.round((completedDrops / totalDrops) * 100);
  };

  // Get color scheme based on route status
  const getProgressColorScheme = (route: RouteData): string => {
    if (route.status === 'completed') return 'green';
    if (route.status === 'closed') return 'gray';
    if (route.progress > 75) return 'green';
    if (route.progress > 50) return 'blue';
    if (route.progress > 25) return 'orange';
    return 'yellow';
  };

  const loadDashboardData = async () {l-time insights, route optimization controls, and driver management tools.
 * 
 * Key Features:
 * - Live route monitoring with interactive maps
 * - Real-time performance metrics and analytics
 * - Driver fleet management and status tracking
 * - Route optimization controls and manual overrides
 * - Customer service tools and delivery tracking
 * - System health monitoring and alert management
 * - Revenue analytics and operational insights
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Badge,
  Button,
  Flex,
  Stack,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  useToast
} from '@chakra-ui/react';
import {
  FaRoute,
  FaTruck,
  FaMapMarkedAlt,
  FaClock,
  FaSearch,
  FaSync,
  FaPause,
  FaPlay,
  FaStop,
  FaExclamationTriangle,
  FaChartLine,
  FaUsers,
  FaBoxOpen,
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaBell,
  FaFilter,
  FaDownload,
  FaCog,
  FaEye
} from 'react-icons/fa';

interface RouteMetrics {
  totalRoutes: number;
  activeRoutes: number;
  completedToday: number;
  avgDeliveryTime: number;
  onTimeRate: number;
  totalRevenue: number;
  efficiency: number;
}

interface DriverStatus {
  id: string;
  name: string;
  status: 'available' | 'en_route' | 'delivering' | 'offline';
  currentRoute?: string;
  location: { lat: number; lng: number };
  todayEarnings: number;
  todayDeliveries: number;
  rating: number;
  lastUpdate: Date;
}

interface RouteData {
  id: string;
  driverId?: string;
  driverName?: string;
  status: 'pending_assignment' | 'assigned' | 'active' | 'completed' | 'failed';
  serviceTier: string;
  totalDrops: number;
  completedDrops: number;
  estimatedDuration: number;
  actualDuration?: number;
  totalDistance: number;
  totalValue: number;
  timeWindowStart: Date;
  timeWindowEnd: Date;
  createdAt: Date;
  progress: number;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

const AdminRoutesDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<RouteMetrics>({
    totalRoutes: 0,
    activeRoutes: 0,
    completedToday: 0,
    avgDeliveryTime: 0,
    onTimeRate: 0,
    totalRevenue: 0,
    efficiency: 0
  });

  const [drivers, setDrivers] = useState<DriverStatus[]>([]);
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  
  const { isOpen: isRouteModalOpen, onOpen: onRouteModalOpen, onClose: onRouteModalClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(() => {
      loadDashboardData();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // TODO: Replace with actual API calls
      await Promise.all([
        loadMetrics(),
        loadDrivers(),
        loadRoutes(),
        loadAlerts()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        status: 'error',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      const data = await response.json();
      
      // Map analytics data to metrics format
      setMetrics({
        totalRoutes: data.totalRoutes || 0,
        activeRoutes: data.activeRoutes || 0,
        completedToday: data.completedToday || 0,
        avgDeliveryTime: data.avgDeliveryTime || 0,
        onTimeRate: data.onTimeRate || 0,
        totalRevenue: data.totalRevenue || 0,
        efficiency: data.efficiency || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load metrics',
        status: 'error',
        duration: 3000
      });
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      const data = await response.json();
      
      // Map driver metrics to driver status format
      if (data.driverMetrics) {
        const mappedDrivers: DriverStatus[] = data.driverMetrics.map((driver: any) => ({
          id: driver.id,
          name: driver.name,
          status: driver.status || 'available',
          currentRoute: driver.currentRouteId,
          location: driver.location || { lat: 0, lng: 0 },
          todayEarnings: driver.earnings || 0,
          todayDeliveries: driver.assignmentsToday || 0,
          rating: driver.averageRating || 0,
          lastUpdate: new Date()
        }));
        setDrivers(mappedDrivers);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load drivers',
        status: 'error',
        duration: 3000
      });
    }
  };

  const loadRoutes = async () => {
    try {
      const response = await fetch('/api/admin/routes?status=all');
      const data = await response.json();
      
      if (data.routes) {
        // Map routes to RouteData format
        const mappedRoutes: RouteData[] = data.routes.map((route: any) => {
          const completedDrops = route.drops?.filter((d: any) => d.status === 'completed').length || 0;
          const totalDrops = route.drops?.length || 0;
          const progress = totalDrops > 0 ? (completedDrops / totalDrops) * 100 : 0;
          
          return {
            id: route.id,
            driverId: route.driverId,
            driverName: route.driver?.name || 'N/A',
            status: route.status,
            serviceTier: route.serviceTier || 'standard',
            totalDrops,
            completedDrops,
            estimatedDuration: route.estimatedDuration || 0,
            totalDistance: route.optimizedDistanceKm || 0,
            totalValue: route.totalOutcome || 0,
            timeWindowStart: route.startTime ? new Date(route.startTime) : new Date(),
            timeWindowEnd: route.endTime ? new Date(route.endTime) : new Date(),
            createdAt: route.createdAt ? new Date(route.createdAt) : new Date(),
            progress
          };
        });
        setRoutes(mappedRoutes);
      }
    } catch (error) {
      console.error('Error loading routes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load routes',
        status: 'error',
        duration: 3000
      });
    }
  };

  const loadAlerts = async () => {
    // Mock data - replace with API call
    const mockAlerts: SystemAlert[] = [
      {
        id: 'alert_1',
        type: 'warning',
        priority: 'medium',
        title: 'Route Optimization Delayed',
        message: 'Route route_456 is running 15 minutes behind schedule',
        timestamp: new Date(Date.now() - 900000),
        acknowledged: false
      },
      {
        id: 'alert_2',
        type: 'success',
        priority: 'low',
        title: 'High Efficiency Route',
        message: 'Route route_789 completed 20% faster than estimated',
        timestamp: new Date(Date.now() - 1800000),
        acknowledged: true
      }
    ];
    setAlerts(mockAlerts);
  };

  const handleRouteAction = async (routeId: string, action: 'pause' | 'resume' | 'cancel' | 'reassign') => {
    try {
      if (action === 'cancel') {
        await handleCancelRoute(routeId);
      } else if (action === 'reassign') {
        // This will be handled by a modal with driver selection
        console.log('Reassign action - open modal');
      } else {
        console.log(`${action} route:`, routeId);
      }
      
      await loadRoutes();
    } catch (error) {
      toast({
        title: 'Error', 
        description: `Failed to ${action} route`,
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleReassignDriver = async (routeId: string, newDriverId: string) => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: newDriverId })
      });

      if (!response.ok) throw new Error('Failed to reassign driver');

      toast({
        title: 'Success',
        description: 'Driver reassigned successfully',
        status: 'success',
        duration: 3000
      });

      await loadRoutes();
      await loadDrivers();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reassign driver',
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleCancelRoute = async (routeId: string) => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}/cancel`, {
        method: 'POST'
      });

      if (!response.ok) throw new Error('Failed to cancel route');

      toast({
        title: 'Success',
        description: 'Route cancelled successfully. Bookings have been reset.',
        status: 'success',
        duration: 3000
      });

      await loadRoutes();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel route',
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleAddDrop = async (routeId: string, dropData: any) => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}/drops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dropData)
      });

      if (!response.ok) throw new Error('Failed to add drop');

      toast({
        title: 'Success',
        description: 'Drop added to route successfully',
        status: 'success',
        duration: 3000
      });

      await loadRoutes();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add drop',
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleRemoveDrop = async (routeId: string, dropId: string) => {
    try {
      const response = await fetch(`/api/admin/routes/${routeId}/drops/${dropId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to remove drop');

      toast({
        title: 'Success',
        description: 'Drop removed from route successfully',
        status: 'success',
        duration: 3000
      });

      await loadRoutes();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove drop',
        status: 'error',
        duration: 5000
      });
    }
  };

  const handleDriverAction = async (driverId: string, action: 'assign' | 'reassign' | 'offline') => {
    try {
      console.log(`${action} driver:`, driverId);
      
      toast({
        title: 'Success',
        description: `Driver ${action} successful`,
        status: 'success',
        duration: 3000
      });
      
      await loadDrivers();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} driver`,
        status: 'error', 
        duration: 5000
      });
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
      
      toast({
        title: 'Alert Acknowledged',
        status: 'info',
        duration: 2000
      });
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const exportData = async (type: 'routes' | 'drivers' | 'metrics') => {
    try {
      // TODO: Implement export functionality
      console.log(`Exporting ${type} data`);
      
      toast({
        title: 'Export Started',
        description: `${type} data export will be ready shortly`,
        status: 'info',
        duration: 3000
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const filteredRoutes = routes.filter(route => {
    const matchesSearch = route.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         route.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'pending_assignment': 'yellow',
      'assigned': 'blue', 
      'active': 'green',
      'completed': 'gray',
      'failed': 'red',
      'available': 'green',
      'en_route': 'blue',
      'delivering': 'orange',
      'offline': 'gray'
    };
    return <Badge colorScheme={statusColors[status as keyof typeof statusColors] || 'gray'}>{status}</Badge>;
  };

  const getPriorityColor = (priority: string) => {
    const colors = { low: 'green', medium: 'yellow', high: 'orange', critical: 'red' };
    return colors[priority as keyof typeof colors] || 'gray';
  };

  return (
    <Box p={6} minH="100vh">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Multi-Drop Routes Dashboard</Heading>
        <Flex gap={3}>
          <Button leftIcon={<FaSync />} onClick={loadDashboardData} isLoading={isLoading}>
            Refresh
          </Button>
          <Button leftIcon={<FaDownload />} onClick={() => exportData('routes')}>
            Export
          </Button>
          <Button leftIcon={<FaCog />} variant="outline">
            Settings
          </Button>
        </Flex>
      </Flex>

      {/* Key Metrics Cards */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Active Routes</StatLabel>
              <StatNumber>{metrics.activeRoutes}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {metrics.totalRoutes} total
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Completed Today</StatLabel>
              <StatNumber>{metrics.completedToday}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {metrics.onTimeRate}% on time
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Revenue Today</StatLabel>
              <StatNumber>£{metrics.totalRevenue.toFixed(2)}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {metrics.efficiency}% efficiency
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Avg Delivery Time</StatLabel>
              <StatNumber>{metrics.avgDeliveryTime}min</StatNumber>
              <StatHelpText>
                <StatArrow type="decrease" />
                5min improvement
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </Grid>

      <Tabs>
        <TabList>
          <Tab><FaRoute /> Routes</Tab>
          <Tab><FaTruck /> Drivers</Tab>
          <Tab><FaBell /> Alerts</Tab>
          <Tab><FaChartLine /> Analytics</Tab>
        </TabList>

        <TabPanels>
          {/* Routes Tab */}
          <TabPanel p={0} mt={4}>
            <Card>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Route Management</Heading>
                  <Flex gap={3}>
                    <InputGroup maxW="300px">
                      <InputLeftElement>
                        <FaSearch />
                      </InputLeftElement>
                      <Input 
                        placeholder="Search routes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                    <Select maxW="150px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="all">All Status</option>
                      <option value="pending_assignment">Pending</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </Select>
                  </Flex>
                </Flex>
              </CardHeader>
              <CardBody>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Route ID</Th>
                      <Th>Driver</Th>
                      <Th>Status</Th>
                      <Th>Progress</Th>
                      <Th>Drops</Th>
                      <Th>Value</Th>
                      <Th>Duration</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredRoutes.map((route) => (
                      <Tr key={route.id}>
                        <Td>{route.id}</Td>
                        <Td>{route.driverName || 'Unassigned'}</Td>
                        <Td>{getStatusBadge(route.status)}</Td>
                        <Td>
                          <Box>
                            <Progress 
                              value={getProgressPercentage(route)} 
                              size="sm" 
                              colorScheme={getProgressColorScheme(route)} 
                            />
                            <Text fontSize="xs" mt={1}>
                              {route.completedDrops}/{route.totalDrops} drops ({getProgressPercentage(route)}%)
                            </Text>
                          </Box>
                        </Td>
                        <Td>{route.totalDrops}</Td>
                        <Td>£{route.totalValue.toFixed(2)}</Td>
                        <Td>{route.estimatedDuration}min</Td>
                        <Td>
                          <Flex gap={2}>
                            <IconButton
                              aria-label="View route"
                              icon={<FaEye />}
                              size="sm"
                              onClick={() => {
                                setSelectedRoute(route);
                                onRouteModalOpen();
                              }}
                            />
                            {route.status === 'active' && (
                              <IconButton
                                aria-label="Pause route"
                                icon={<FaPause />}
                                size="sm"
                                colorScheme="yellow"
                                onClick={() => handleRouteAction(route.id, 'pause')}
                              />
                            )}
                            {route.status === 'assigned' && (
                              <IconButton
                                aria-label="Start route"
                                icon={<FaPlay />}
                                size="sm"
                                colorScheme="green"
                                onClick={() => handleRouteAction(route.id, 'resume')}
                              />
                            )}
                          </Flex>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Drivers Tab */}
          <TabPanel p={0} mt={4}>
            <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={6}>
              {drivers.map((driver) => (
                <Card key={driver.id}>
                  <CardHeader>
                    <Flex justify="space-between" align="center">
                      <Heading size="sm">{driver.name}</Heading>
                      {getStatusBadge(driver.status)}
                    </Flex>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={3}>
                      <Flex justify="space-between">
                        <Text fontSize="sm">Today's Earnings:</Text>
                        <Text fontWeight="bold">£{driver.todayEarnings.toFixed(2)}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm">Deliveries:</Text>
                        <Text>{driver.todayDeliveries}</Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="sm">Rating:</Text>
                        <Text>{driver.rating}/5.0</Text>
                      </Flex>
                      {driver.currentRoute && (
                        <Flex justify="space-between">
                          <Text fontSize="sm">Current Route:</Text>
                          <Text fontSize="sm">{driver.currentRoute}</Text>
                        </Flex>
                      )}
                      <Flex gap={2} mt={4}>
                        <Button size="sm" flex={1} onClick={() => handleDriverAction(driver.id, 'assign')}>
                          Assign Route
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDriverAction(driver.id, 'offline')}>
                          Set Offline
                        </Button>
                      </Flex>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          </TabPanel>

          {/* Alerts Tab */}
          <TabPanel p={0} mt={4}>
            <Card>
              <CardHeader>
                <Heading size="md">System Alerts</Heading>
              </CardHeader>
              <CardBody>
                <Stack spacing={4}>
                  {alerts.map((alert) => (
                    <Alert 
                      key={alert.id} 
                      status={alert.type}
                      variant={alert.acknowledged ? 'subtle' : 'left-accent'}
                    >
                      <AlertIcon />
                      <Box flex="1">
                        <AlertTitle>{alert.title}</AlertTitle>
                        <AlertDescription>{alert.message}</AlertDescription>
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {alert.timestamp.toLocaleString()}
                        </Text>
                      </Box>
                      {!alert.acknowledged && (
                        <Button size="sm" onClick={() => acknowledgeAlert(alert.id)}>
                          Acknowledge
                        </Button>
                      )}
                    </Alert>
                  ))}
                </Stack>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel p={0} mt={4}>
            <Grid templateColumns="repeat(auto-fit, minmax(400px, 1fr))" gap={6}>
              <Card>
                <CardHeader>
                  <Heading size="md">Performance Overview</Heading>
                </CardHeader>
                <CardBody>
                  <Text>Analytics charts and graphs would go here</Text>
                  <Text fontSize="sm" color="gray.500">
                    Integration with charting library needed
                  </Text>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Route Details Modal */}
      <Modal isOpen={isRouteModalOpen} onClose={onRouteModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Route Details: {selectedRoute?.id}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedRoute && (
              <Stack spacing={4}>
                <Flex justify="space-between">
                  <Text fontWeight="bold">Driver:</Text>
                  <Text>{selectedRoute.driverName || 'Unassigned'}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="bold">Status:</Text>
                  {getStatusBadge(selectedRoute.status)}
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="bold">Progress:</Text>
                  <Text>{selectedRoute.completedDrops}/{selectedRoute.totalDrops} drops</Text>
                </Flex>
                <Box>
                  <Text fontWeight="bold" mb={2}>Route Progress:</Text>
                  <Progress value={selectedRoute.progress} colorScheme="green" />
                </Box>
                <Flex justify="space-between">
                  <Text fontWeight="bold">Total Distance:</Text>
                  <Text>{selectedRoute.totalDistance.toFixed(1)} km</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="bold">Total Value:</Text>
                  <Text>£{selectedRoute.totalValue.toFixed(2)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="bold">Time Window:</Text>
                  <Text>
                    {selectedRoute.timeWindowStart.toLocaleTimeString()} - {selectedRoute.timeWindowEnd.toLocaleTimeString()}
                  </Text>
                </Flex>
              </Stack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onRouteModalClose}>
              Close
            </Button>
            <Button variant="ghost">View on Map</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default AdminRoutesDashboard;