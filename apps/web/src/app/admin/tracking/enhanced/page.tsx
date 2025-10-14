'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  CardBody,
  Badge,
  Spinner,
  useToast,
  useColorModeValue,
  Grid,
  GridItem,
  Select,
  Input,
  Button,
  IconButton,
  Tooltip,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Divider,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  List,
  ListItem,
  ListIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FiMapPin,
  FiClock,
  FiTruck,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiEye,
  FiNavigation,
  FiWifi,
  FiWifiOff,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiMap,
} from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { useAdminRealTimeTracking } from '@/hooks/useRealTimeTracking';

const LiveMap = dynamic(() => import('@/components/Map/LiveMap'), {
  ssr: false,
});

interface TrackingBooking {
  id: string;
  reference: string;
  unifiedBookingId?: string;
  status: string;
  scheduledAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  driver?: {
    id: string;
    name: string;
    email: string;
  };
  addresses: {
    pickup: {
      label: string;
      postcode: string;
      coordinates: { lat: number; lng: number };
    };
    dropoff: {
      label: string;
      postcode: string;
      coordinates: { lat: number; lng: number };
    };
  };
  routeProgress: number;
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  eta?: {
    estimatedArrival: string;
    minutesRemaining: number;
    isOnTime: boolean;
  };
  lastEvent?: {
    step: string;
    createdAt: string;
    notes?: string;
  };
  jobTimeline: Array<{
    step: string;
    label: string;
    timestamp: string;
    notes?: string;
  }>;
  trackingPings: Array<{
    lat: number;
    lng: number;
    createdAt: string;
  }>;
  lastUpdated: string;
}

export default function EnhancedTrackingDashboard() {
  const [bookings, setBookings] = useState<TrackingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] =
    useState<TrackingBooking | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Real-time tracking hook
  const { isConnected, connectionStatus } = useAdminRealTimeTracking({
    onUpdate: update => {
      console.log('🔄 Admin dashboard received real-time update:', update);
      
      // Handle different types of updates
      if (update.type === 'location') {
        // Update booking location in real-time
        setBookings(prevBookings => 
          prevBookings.map(booking => {
            if (booking.id === update.bookingId) {
              return {
                ...booking,
                currentLocation: {
                  lat: update.location.lat,
                  lng: update.location.lng,
                  timestamp: update.timestamp.toISOString(),
                },
                lastUpdated: update.timestamp.toISOString(),
              };
            }
            return booking;
          })
        );

        // Show toast for location updates (less frequent)
        toast({
          title: 'Driver Location Updated',
          description: `Driver location updated for booking ${update.data.bookingReference}`,
          status: 'info',
          duration: 2000,
          isClosable: true,
        });
      }
      
      if (update.type === 'status') {
        toast({
          title: 'Status Update',
          description: `Booking ${update.bookingId} status changed`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh data for status changes
        loadTrackingData();
      }

      if (update.type === 'progress') {
        toast({
          title: 'Progress Update',
          description: `Job progress updated: ${update.data.stepLabel || update.data.step}`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh data for progress changes
        loadTrackingData();
      }
    },
    onLocationUpdate: location => {
      console.log('📍 Admin dashboard received location update:', location);
    }
  });

  useEffect(() => {
    loadTrackingData();

    // Set up auto-refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      loadTrackingData();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const loadTrackingData = async () => {
    try {
      setIsRefreshing(true);

      const response = await fetch('/api/admin/tracking?includeTracking=true');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
        setLastUpdate(new Date());
      } else {
        throw new Error('Failed to load tracking data');
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
      toast({
        title: 'Error Loading Data',
        description: 'Failed to load tracking information',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus =
      filterStatus === 'all' || booking.status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      booking.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.unifiedBookingId
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      booking.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer.email
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (booking.driver?.name || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'blue';
      case 'IN_PROGRESS':
        return 'orange';
      case 'COMPLETED':
        return 'green';
      case 'CANCELLED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStepLabel = (step: string) => {
    switch (step) {
      case 'navigate_to_pickup':
        return 'En Route to Pickup';
      case 'arrived_at_pickup':
        return 'Arrived at Pickup';
      case 'loading_started':
        return 'Loading Started';
      case 'loading_completed':
        return 'Loading Completed';
      case 'en_route_to_dropoff':
        return 'En Route to Delivery';
      case 'arrived_at_dropoff':
        return 'Arrived at Delivery';
      case 'unloading_started':
        return 'Unloading Started';
      case 'unloading_completed':
        return 'Unloading Completed';
      case 'job_completed':
        return 'Job Completed';
      default:
        return step;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openBookingDetails = (booking: TrackingBooking) => {
    setSelectedBooking(booking);
    onOpen();
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading size="lg">Enhanced Tracking Dashboard</Heading>
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" />
          </Flex>
        </VStack>
      </Container>
    );
  }

  const activeBookings = filteredBookings.filter(
    b => b.status === 'IN_PROGRESS'
  );
  const confirmedBookings = filteredBookings.filter(
    b => b.status === 'CONFIRMED'
  );
  const withLiveTracking = filteredBookings.filter(
    b => b.currentLocation
  ).length;
  const averageProgress =
    filteredBookings.length > 0
      ? Math.round(
          filteredBookings.reduce((sum, b) => sum + b.routeProgress, 0) /
            filteredBookings.length
        )
      : 0;

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={2}>
            <Heading size="lg">Enhanced Tracking Dashboard</Heading>
            <Text color="gray.600">
              Real-time monitoring of all active deliveries with comprehensive
              tracking
            </Text>
          </VStack>
          <HStack spacing={4}>
            <HStack spacing={2}>
              {isConnected ? (
                <FiWifi color="green" />
              ) : (
                <FiWifiOff color="red" />
              )}
              <Text fontSize="sm">
                {isConnected ? 'Real-time connected' : 'Real-time disconnected'}
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              <span suppressHydrationWarning>
                Last updated: {lastUpdate?.toLocaleTimeString()}
              </span>
            </Text>
            <Tooltip label="Refresh data">
              <IconButton
                aria-label="Refresh"
                icon={<FiRefreshCw />}
                onClick={loadTrackingData}
                isLoading={isRefreshing}
                size="sm"
              />
            </Tooltip>
          </HStack>
        </Flex>

        {/* Stats Cards */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Active</StatLabel>
                <StatNumber>{filteredBookings.length}</StatNumber>
                <StatHelpText>Currently being processed</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>In Progress</StatLabel>
                <StatNumber>{activeBookings.length}</StatNumber>
                <StatHelpText>Currently being delivered</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Live Tracking</StatLabel>
                <StatNumber>{withLiveTracking}</StatNumber>
                <StatHelpText>With real-time location</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Avg Progress</StatLabel>
                <StatNumber>{averageProgress}%</StatNumber>
                <StatHelpText>Route completion</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Filters and Search */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text fontWeight="medium">Filters & Search</Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('list')}
                    leftIcon={<FiEye />}
                  >
                    List View
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'map' ? 'solid' : 'outline'}
                    onClick={() => setViewMode('map')}
                    leftIcon={<FiMap />}
                  >
                    Map View
                  </Button>
                </HStack>
              </HStack>

              <HStack spacing={4} wrap="wrap">
                <Box>
                  <Text fontSize="sm" mb={2}>
                    Status Filter
                  </Text>
                  <Select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    size="sm"
                    w="150px"
                  >
                    <option value="all">All Status</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="IN_PROGRESS">In Progress</option>
                  </Select>
                </Box>
                <Box>
                  <Text fontSize="sm" mb={2}>
                    Search
                  </Text>
                  <Input
                    placeholder="Search bookings, IDs, customers..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    size="sm"
                    w="300px"
                  />
                </Box>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Main Content */}
        {viewMode === 'list' ? (
          <VStack spacing={4} align="stretch">
            {filteredBookings.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                No active bookings found matching your criteria
              </Alert>
            ) : (
              filteredBookings.map(booking => (
                <Card
                  key={booking.id}
                  cursor="pointer"
                  onClick={() => openBookingDetails(booking)}
                  _hover={{ bg: 'gray.50' }}
                  border={`1px solid ${borderColor}`}
                >
                  <CardBody>
                    <Grid
                      templateColumns="1fr auto auto auto"
                      gap={4}
                      alignItems="center"
                    >
                      {/* Booking Info */}
                      <VStack align="start" spacing={2}>
                        <HStack spacing={3}>
                          <Text fontWeight="bold" fontSize="lg">
                            {booking.reference}
                          </Text>
                          {booking.unifiedBookingId && (
                            <Badge colorScheme="purple" variant="outline">
                              {booking.unifiedBookingId}
                            </Badge>
                          )}
                          <Badge colorScheme={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </HStack>

                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" color="gray.600">
                            <strong>Customer:</strong> {booking.customer.name} (
                            {booking.customer.email})
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            <strong>Pickup:</strong>{' '}
                            {booking.addresses.pickup.label}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            <strong>Delivery:</strong>{' '}
                            {booking.addresses.dropoff.label}
                          </Text>
                        </VStack>
                      </VStack>

                      {/* Driver Info */}
                      <VStack align="center" spacing={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          Driver
                        </Text>
                        {booking.driver ? (
                          <Text fontSize="sm" color="blue.600">
                            {booking.driver.name}
                          </Text>
                        ) : (
                          <Text fontSize="sm" color="gray.500">
                            Unassigned
                          </Text>
                        )}
                      </VStack>

                      {/* Progress */}
                      <VStack align="center" spacing={1}>
                        <Text fontSize="sm" fontWeight="medium">
                          Progress
                        </Text>
                        <Progress
                          value={booking.routeProgress}
                          size="sm"
                          colorScheme="blue"
                          w="80px"
                        />
                        <Text fontSize="xs" color="gray.600">
                          {booking.routeProgress}%
                        </Text>
                      </VStack>

                      {/* ETA & Tracking */}
                      <VStack align="center" spacing={1}>
                        {booking.eta ? (
                          <>
                            <Text fontSize="sm" fontWeight="medium">
                              ETA
                            </Text>
                            <Text fontSize="sm" color="blue.600">
                              {booking.eta.minutesRemaining}m
                            </Text>
                            <Badge
                              colorScheme={
                                booking.eta.isOnTime ? 'green' : 'orange'
                              }
                              size="sm"
                            >
                              {booking.eta.isOnTime ? 'On Time' : 'Delayed'}
                            </Badge>
                          </>
                        ) : (
                          <>
                            <Text fontSize="sm" fontWeight="medium">
                              Scheduled
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              {formatTime(booking.scheduledAt)}
                            </Text>
                          </>
                        )}

                        {booking.currentLocation && (
                          <Badge colorScheme="green" size="sm">
                            Live Tracking
                          </Badge>
                        )}
                      </VStack>
                    </Grid>
                  </CardBody>
                </Card>
              ))
            )}
          </VStack>
        ) : (
          /* Map View */
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Live Map View</Heading>
                <Box h="600px" borderRadius="md" overflow="hidden">
                  <LiveMap
                    driverLocations={filteredBookings
                      .filter(b => b.currentLocation)
                      .map(b => ({
                        driverId: b.driver?.id || 'unknown',
                        driverName: b.driver?.name || 'Unknown',
                        lat: b.currentLocation!.lat,
                        lng: b.currentLocation!.lng,
                        label: `${b.driver?.name || 'Unknown'} - ${b.reference}`,
                        lastUpdate: b.currentLocation!.timestamp,
                        status: b.status,
                      }))}
                    pickupLocation={
                      selectedBooking?.currentLocation && selectedBooking.addresses.pickup.coordinates
                        ? {
                            lat: selectedBooking.addresses.pickup.coordinates
                              .lat,
                            lng: selectedBooking.addresses.pickup.coordinates
                              .lng,
                            label: 'Pickup Location',
                          }
                        : {
                            lat: 0,
                            lng: 0,
                            label: 'Pickup Location',
                          }
                    }
                    dropoffLocation={
                      selectedBooking?.currentLocation && selectedBooking.addresses.dropoff.coordinates
                        ? {
                            lat: selectedBooking.addresses.dropoff.coordinates
                              .lat,
                            lng: selectedBooking.addresses.dropoff.coordinates
                              .lng,
                            label: 'Dropoff Location',
                          }
                        : {
                            lat: 0,
                            lng: 0,
                            label: 'Dropoff Location',
                          }
                    }
                  />
                </Box>
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Booking Details Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>
              Booking Details: {selectedBooking?.reference}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              {selectedBooking && (
                <VStack spacing={4} align="stretch">
                  {/* Basic Info */}
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Customer
                      </Text>
                      <Text>{selectedBooking.customer.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {selectedBooking.customer.email}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {selectedBooking.customer.phone}
                      </Text>
                    </Box>

                    {selectedBooking.driver && (
                      <Box>
                        <Text fontWeight="bold" mb={2}>
                          Driver
                        </Text>
                        <Text>{selectedBooking.driver.name}</Text>
                        <Text fontSize="sm" color="gray.600">
                          {selectedBooking.driver.email}
                        </Text>
                      </Box>
                    )}
                  </Grid>

                  {/* Route Progress */}
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Route Progress
                    </Text>
                    <Progress
                      value={selectedBooking.routeProgress}
                      w="100%"
                      colorScheme="blue"
                      mb={2}
                    />
                    <Text fontSize="sm">
                      {selectedBooking.routeProgress}% complete
                    </Text>
                  </Box>

                  {/* ETA */}
                  {selectedBooking.eta && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Estimated Arrival
                      </Text>
                      <Text>
                        {selectedBooking.eta.minutesRemaining} minutes
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {formatTime(selectedBooking.eta.estimatedArrival)}
                      </Text>
                      <Badge
                        colorScheme={
                          selectedBooking.eta.isOnTime ? 'green' : 'orange'
                        }
                        mt={2}
                      >
                        {selectedBooking.eta.isOnTime ? 'On Time' : 'Delayed'}
                      </Badge>
                    </Box>
                  )}

                  {/* Job Timeline */}
                  {selectedBooking.jobTimeline.length > 0 && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Job Timeline
                      </Text>
                      <List spacing={2}>
                        {selectedBooking.jobTimeline.map((event, index) => (
                          <ListItem key={index}>
                            <HStack spacing={3}>
                              <ListIcon as={FiCheckCircle} color="green.500" />
                              <VStack align="start" spacing={1} flex={1}>
                                <Text fontWeight="medium">{event.label}</Text>
                                <Text fontSize="sm" color="gray.600">
                                  {formatTime(event.timestamp)}
                                </Text>
                                {event.notes && (
                                  <Text
                                    fontSize="sm"
                                    color="gray.500"
                                    fontStyle="italic"
                                  >
                                    {event.notes}
                                  </Text>
                                )}
                              </VStack>
                            </HStack>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}

                  {/* Live Location */}
                  {selectedBooking.currentLocation && (
                    <Box>
                      <Text fontWeight="bold" mb={2}>
                        Current Location
                      </Text>
                      <Text fontSize="sm">
                        {selectedBooking.currentLocation.lat.toFixed(6)},{' '}
                        {selectedBooking.currentLocation.lng.toFixed(6)}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Last updated:{' '}
                        {formatTime(selectedBooking.currentLocation.timestamp)}
                      </Text>
                    </Box>
                  )}
                </VStack>
              )}
            </ModalBody>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
}
