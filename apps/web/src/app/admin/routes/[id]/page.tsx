'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  Grid,
  Badge,
  Divider,
  Alert,
  AlertIcon,
  useToast,
  Spinner,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Switch,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import {
  FiArrowLeft,
  FiEdit,
  FiTrash2,
  FiUser,
  FiMapPin,
  FiClock,
  FiTruck,
  FiCheck,
  FiX,
  FiMoreVertical,
  FiRefreshCw,
  FiAlertCircle,
  FiBarChart2,
  FiSettings,
} from 'react-icons/fi';
import AdminShell from '@/components/admin/AdminShell';

interface Drop {
  id: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: string;
  quotedPrice: number;
  timeWindowStart: string;
  timeWindowEnd: string;
  completedAt?: string;
  Booking?: {
    id: string;
    reference: string;
    customerName: string;
    customerPhone: string;
  };
  User: {
    name: string;
    email: string;
  };
}

interface RouteDetails {
  id: string;
  reference: string;
  status: string;
  serviceTier: string;
  startTime: string;
  endTime?: string;
  totalDrops: number;
  completedDrops: number;
  optimizedDistanceKm?: number;
  estimatedDuration?: number;
  routeNotes?: string;
  adminNotes?: string;
  isModifiedByAdmin: boolean;
  driver?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  drops: Drop[];
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  performanceMetrics: any;
  costAnalysis: any;
  efficiencyScores: any;
  suggestions: any[];
}

export default function RouteDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const routeId = params?.id as string;
  
  const [route, setRoute] = useState<RouteDetails | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const { isOpen: isStatusModalOpen, onOpen: onStatusModalOpen, onClose: onStatusModalClose } = useDisclosure();
  const { isOpen: isDriverModalOpen, onOpen: onDriverModalOpen, onClose: onDriverModalClose } = useDisclosure();
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onClose: onDeleteModalClose } = useDisclosure();

  // Form states
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [drivers, setDrivers] = useState<any[]>([]);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    loadRouteDetails();
    loadDrivers();
  }, [routeId]);

  const loadRouteDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/routes/${routeId}/details`);
      
      if (!response.ok) {
        throw new Error('Failed to load route details');
      }
      
      const data = await response.json();
      setRoute(data);
    } catch (error) {
      console.error('Error loading route details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load route details',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const response = await fetch(`/api/admin/routes/${routeId}/analytics`);
      
      if (!response.ok) {
        throw new Error('Failed to load analytics');
      }
      
      const result = await response.json();
      setAnalytics(result.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers/available');
      const result = await response.json();
      
      console.log('Drivers API response:', result);
      
      if (result.success && result.data) {
        // API returns drivers in result.data.drivers
        setDrivers(result.data.drivers || []);
        console.log('Loaded drivers:', result.data.drivers?.length || 0);
      } else {
        console.error('Invalid drivers response:', result);
        setDrivers([]);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
      setDrivers([]);
    }
  };

  const handleForceStatusChange = async () => {
    if (!newStatus || !statusReason) {
      toast({
        title: 'Validation Error',
        description: 'Status and reason are required',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/routes/${routeId}/force-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason,
          updateDrops: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Route status changed to ${newStatus}`,
          status: 'success',
          duration: 3000,
        });
        onStatusModalClose();
        loadRouteDetails();
      } else {
        throw new Error(data.error || 'Failed to change status');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to change status',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassignDriver = async () => {
    if (!selectedDriver) {
      toast({
        title: 'Validation Error',
        description: 'Please select a driver',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/routes/${routeId}/reassign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: selectedDriver,
          reason: 'Admin reassignment from route details',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Driver reassigned successfully',
          status: 'success',
          duration: 3000,
        });
        onDriverModalClose();
        loadRouteDetails();
      } else {
        throw new Error(data.error || 'Failed to reassign driver');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reassign driver',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRoute = async () => {
    if (!deleteReason) {
      toast({
        title: 'Validation Error',
        description: 'Please provide a reason for deletion',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/admin/routes/multi-drop?routeId=${routeId}&reason=${encodeURIComponent(deleteReason)}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Route cancelled successfully',
          status: 'success',
          duration: 3000,
        });
        router.push('/admin/routes');
      } else {
        throw new Error(data.error || 'Failed to delete route');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete route',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planned: 'blue',
      pending_assignment: 'yellow',
      assigned: 'orange',
      active: 'green',
      completed: 'gray',
      cancelled: 'red',
      failed: 'red',
    };
    return colors[status] || 'gray';
  };

  const getDropStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'gray',
      assigned_to_route: 'blue',
      picked_up: 'orange',
      in_transit: 'green',
      delivered: 'green',
      failed: 'red',
    };
    return colors[status] || 'gray';
  };

  if (loading) {
    return (
      <AdminShell title="Route Details">
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading route details...</Text>
          </VStack>
        </Box>
      </AdminShell>
    );
  }

  if (!route) {
    return (
      <AdminShell title="Route Not Found">
        <Box
          minH="100vh"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack spacing={4}>
            <Icon as={FiAlertCircle} boxSize={12} color="red.500" />
            <Heading size="lg">Route Not Found</Heading>
            <Button
              leftIcon={<FiArrowLeft />}
              colorScheme="blue"
              onClick={() => router.push('/admin/routes')}
            >
              Back to Routes
            </Button>
          </VStack>
        </Box>
      </AdminShell>
    );
  }

  const completionRate = route.totalDrops > 0 
    ? (route.completedDrops / route.totalDrops) * 100 
    : 0;

  return (
    <AdminShell title={`Route ${route.reference}`}>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <HStack spacing={4}>
              <Button
                leftIcon={<FiArrowLeft />}
                variant="ghost"
                onClick={() => router.push('/admin/routes')}
              >
                Back
              </Button>
              <Box>
                <Heading size="lg">Route {route.reference}</Heading>
                <Text color="gray.600" fontSize="sm">
                  Created {new Date(route.createdAt).toLocaleString()}
                </Text>
              </Box>
            </HStack>
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<FiMoreVertical />}
                variant="outline"
              >
                Actions
              </MenuButton>
              <MenuList>
                <MenuItem icon={<FiSettings />} onClick={onStatusModalOpen}>
                  Force Change Status
                </MenuItem>
                <MenuItem icon={<FiUser />} onClick={onDriverModalOpen}>
                  Reassign Driver
                </MenuItem>
                <MenuItem icon={<FiRefreshCw />} onClick={loadRouteDetails}>
                  Refresh Data
                </MenuItem>
                <MenuItem icon={<FiBarChart2 />} onClick={loadAnalytics}>
                  Load Analytics
                </MenuItem>
                <Divider />
                <MenuItem icon={<FiTrash2 />} onClick={onDeleteModalOpen} color="red.500">
                  Cancel Route
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>

          {/* Admin Modified Alert */}
          {route.isModifiedByAdmin && (
            <Alert status="info">
              <AlertIcon />
              This route has been modified by admin
            </Alert>
          )}

          {/* Status and Progress */}
          <Card>
            <CardBody>
              <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                <Box>
                  <Text fontSize="sm" color="gray.600">Status</Text>
                  <Badge colorScheme={getStatusColor(route.status)} fontSize="md" mt={1}>
                    {route.status.replace(/_/g, ' ').toUpperCase()}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">Service Tier</Text>
                  <Text fontSize="lg" fontWeight="bold">{route.serviceTier}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">Completion</Text>
                  <HStack>
                    <Progress value={completionRate} size="sm" colorScheme="green" flex={1} />
                    <Text fontSize="sm" fontWeight="bold">{Math.round(completionRate)}%</Text>
                  </HStack>
                  <Text fontSize="xs" color="gray.500">
                    {route.completedDrops} of {route.totalDrops} drops
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">Distance</Text>
                  <Text fontSize="lg" fontWeight="bold">
                    {route.optimizedDistanceKm?.toFixed(1) || 'N/A'} km
                  </Text>
                </Box>
              </Grid>
            </CardBody>
          </Card>

          {/* Driver Info */}
          <Card>
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Heading size="md">Driver Information</Heading>
                <Button
                  size="sm"
                  leftIcon={<FiEdit />}
                  onClick={onDriverModalOpen}
                >
                  Change Driver
                </Button>
              </HStack>
              {route.driver ? (
                <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Name</Text>
                    <Text fontSize="lg" fontWeight="bold">{route.driver.name}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Email</Text>
                    <Text fontSize="md">{route.driver.email}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600">Phone</Text>
                    <Text fontSize="md">{route.driver.phone || 'N/A'}</Text>
                  </Box>
                </Grid>
              ) : (
                <Alert status="warning">
                  <AlertIcon />
                  No driver assigned to this route
                </Alert>
              )}
            </CardBody>
          </Card>

          {/* Tabs */}
          <Tabs>
            <TabList>
              <Tab>Drops ({route.drops.length})</Tab>
              <Tab>Timeline</Tab>
              <Tab>Notes</Tab>
              {analytics && <Tab>Analytics</Tab>}
            </TabList>

            <TabPanels>
              {/* Drops Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {route.drops.map((drop, index) => (
                    <Card key={drop.id}>
                      <CardBody>
                        <HStack justify="space-between" mb={3}>
                          <HStack>
                            <Box
                              w={8}
                              h={8}
                              borderRadius="full"
                              bg="blue.500"
                              color="white"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontWeight="bold"
                            >
                              {index + 1}
                            </Box>
                            <Box>
                              <Text fontWeight="bold">
                                {drop.Booking?.reference || `Drop ${index + 1}`}
                              </Text>
                              <Badge colorScheme={getDropStatusColor(drop.status)}>
                                {drop.status.replace(/_/g, ' ')}
                              </Badge>
                            </Box>
                          </HStack>
                          <Text fontWeight="bold" fontSize="lg">
                            £{(drop.quotedPrice / 100).toFixed(2)}
                          </Text>
                        </HStack>

                        <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
                          <Box>
                            <Text fontSize="sm" color="gray.600">Customer</Text>
                            <Text fontWeight="medium">{drop.User.name}</Text>
                            <Text fontSize="sm" color="gray.500">{drop.User.email}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600">Pickup</Text>
                            <Text fontWeight="medium">{drop.pickupAddress}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600">Delivery</Text>
                            <Text fontWeight="medium">{drop.deliveryAddress}</Text>
                          </Box>
                          <Box>
                            <Text fontSize="sm" color="gray.600">Time Window</Text>
                            <Text fontSize="sm">
                              {new Date(drop.timeWindowStart).toLocaleTimeString()} - 
                              {new Date(drop.timeWindowEnd).toLocaleTimeString()}
                            </Text>
                          </Box>
                        </Grid>

                        {drop.completedAt && (
                          <Box mt={3} p={2} bg="green.50" borderRadius="md">
                            <Text fontSize="sm" color="green.700">
                              <Icon as={FiCheck} mr={1} />
                              Completed at {new Date(drop.completedAt).toLocaleString()}
                            </Text>
                          </Box>
                        )}
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </TabPanel>

              {/* Timeline Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  <Box p={4} borderLeft="2px" borderColor="blue.500">
                    <Text fontSize="sm" color="gray.600">Created</Text>
                    <Text fontWeight="bold">{new Date(route.createdAt).toLocaleString()}</Text>
                  </Box>
                  <Box p={4} borderLeft="2px" borderColor="green.500">
                    <Text fontSize="sm" color="gray.600">Scheduled Start</Text>
                    <Text fontWeight="bold">{new Date(route.startTime).toLocaleString()}</Text>
                  </Box>
                  {route.endTime && (
                    <Box p={4} borderLeft="2px" borderColor="gray.500">
                      <Text fontSize="sm" color="gray.600">Completed</Text>
                      <Text fontWeight="bold">{new Date(route.endTime).toLocaleString()}</Text>
                    </Box>
                  )}
                </VStack>
              </TabPanel>

              {/* Notes Tab */}
              <TabPanel>
                <VStack spacing={4} align="stretch">
                  {route.routeNotes && (
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={2}>Route Notes</Text>
                      <Box p={4} bg="gray.50" borderRadius="md">
                        <Text>{route.routeNotes}</Text>
                      </Box>
                    </Box>
                  )}
                  {route.adminNotes && (
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={2}>Admin Notes</Text>
                      <Box p={4} bg="blue.50" borderRadius="md">
                        <Text whiteSpace="pre-wrap">{route.adminNotes}</Text>
                      </Box>
                    </Box>
                  )}
                </VStack>
              </TabPanel>

              {/* Analytics Tab */}
              {analytics && (
                <TabPanel>
                  {loadingAnalytics ? (
                    <Box textAlign="center" py={8}>
                      <Spinner size="lg" />
                    </Box>
                  ) : (
                    <VStack spacing={6} align="stretch">
                      {/* Performance Metrics */}
                      <Card>
                        <CardBody>
                          <Heading size="md" mb={4}>Performance Metrics</Heading>
                          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                            <Stat>
                              <StatLabel>Completion Rate</StatLabel>
                              <StatNumber>{analytics.performanceMetrics.completionRate}%</StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>On-Time Rate</StatLabel>
                              <StatNumber>{analytics.performanceMetrics.onTimeRate}%</StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Average Delay</StatLabel>
                              <StatNumber>{analytics.performanceMetrics.averageDelay} min</StatNumber>
                            </Stat>
                          </Grid>
                        </CardBody>
                      </Card>

                      {/* Efficiency Scores */}
                      <Card>
                        <CardBody>
                          <Heading size="md" mb={4}>Efficiency Scores</Heading>
                          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                            <Stat>
                              <StatLabel>Overall</StatLabel>
                              <StatNumber>{analytics.efficiencyScores.overall}%</StatNumber>
                              <StatHelpText>{analytics.efficiencyScores.rating}</StatHelpText>
                            </Stat>
                            <Stat>
                              <StatLabel>Distance</StatLabel>
                              <StatNumber>{analytics.efficiencyScores.distance}%</StatNumber>
                            </Stat>
                            <Stat>
                              <StatLabel>Time</StatLabel>
                              <StatNumber>{analytics.efficiencyScores.time}%</StatNumber>
                            </Stat>
                          </Grid>
                        </CardBody>
                      </Card>

                      {/* Suggestions */}
                      {analytics.suggestions.length > 0 && (
                        <Card>
                          <CardBody>
                            <Heading size="md" mb={4}>Optimization Suggestions</Heading>
                            <VStack spacing={3} align="stretch">
                              {analytics.suggestions.map((suggestion: any, index: number) => (
                                <Alert
                                  key={index}
                                  status={suggestion.priority === 'high' ? 'warning' : 'info'}
                                >
                                  <AlertIcon />
                                  <Box flex={1}>
                                    <Text fontWeight="bold">{suggestion.message}</Text>
                                    <Text fontSize="sm" color="gray.600">{suggestion.impact}</Text>
                                  </Box>
                                </Alert>
                              ))}
                            </VStack>
                          </CardBody>
                        </Card>
                      )}
                    </VStack>
                  )}
                </TabPanel>
              )}
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>

      {/* Force Status Change Modal */}
      <Modal isOpen={isStatusModalOpen} onClose={onStatusModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Force Change Status</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="warning">
                <AlertIcon />
                This will bypass all validation rules
              </Alert>
              <FormControl isRequired>
                <FormLabel>New Status</FormLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  placeholder="Select status"
                >
                  <option value="planned">Planned</option>
                  <option value="pending_assignment">Pending Assignment</option>
                  <option value="assigned">Assigned</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </Select>
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Reason</FormLabel>
                <Textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Explain why you're forcing this status change"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onStatusModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleForceStatusChange}
              isLoading={actionLoading}
            >
              Change Status
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reassign Driver Modal */}
      <Modal isOpen={isDriverModalOpen} onClose={onDriverModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reassign Driver</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Select Driver</FormLabel>
              <Select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                placeholder="Select driver"
              >
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} - {driver.email}
                  </option>
                ))}
              </Select>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDriverModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleReassignDriver}
              isLoading={actionLoading}
            >
              Reassign
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Route Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={onDeleteModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Cancel Route</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="error">
                <AlertIcon />
                This will cancel the route and mark all drops as failed
              </Alert>
              <FormControl isRequired>
                <FormLabel>Reason for Cancellation</FormLabel>
                <Textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Explain why you're cancelling this route"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteModalClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteRoute}
              isLoading={actionLoading}
            >
              Cancel Route
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminShell>
  );
}

