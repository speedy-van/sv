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
} from 'react-icons/fi';
import dynamic from 'next/dynamic';
import { useAdminRealTimeTracking } from '@/hooks/useRealTimeTracking';

const LiveMap = dynamic(() => import('@/components/Map/LiveMap'), {
  ssr: false,
});

interface TrackingBooking {
  id: string;
  reference: string;
  status: string;
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
  properties?: {
    pickup?: {
      type: string;
      floors: number;
      hasElevator: boolean;
      buildingTypeDisplay: string;
    };
    dropoff?: {
      type: string;
      floors: number;
      hasElevator: boolean;
      buildingTypeDisplay: string;
    };
  };
  scheduledAt: string;
  driver?: {
    id: string;
    name: string;
    email: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
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
  };
  lastEvent?: {
    step: string;
    createdAt: string;
    notes?: string;
  };
  trackingPings: Array<{
    id: string;
    lat: number;
    lng: number;
    createdAt: string;
  }>;
}

interface DriverLocation {
  driverId: string;
  driverName: string;
  lat: number;
  lng: number;
  label: string;
  lastUpdate: string;
  status: string;
}

export default function TrackingHub() {
  const [bookings, setBookings] = useState<TrackingBooking[]>([]);
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] =
    useState<TrackingBooking | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Real-time tracking hook
  const { isConnected } = useAdminRealTimeTracking({
    onUpdate: update => {
      console.log('🔄 Admin tracking received real-time update:', update);
      
      if (update.type === 'location') {
        // Update driver locations in real-time
        setDriverLocations(prevLocations => 
          prevLocations.map(loc => {
            if (loc.driverId === update.driverId) {
              return {
                ...loc,
                lat: update.location.lat,
                lng: update.location.lng,
                lastUpdate: update.timestamp.toISOString(),
              };
            }
            return loc;
          })
        );

        // Update booking locations
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
              };
            }
            return booking;
          })
        );
      }
    },
  });

  useEffect(() => {
    loadTrackingData();

    // Set up auto-refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      loadTrackingData();
    }, 30000);

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
          title: 'New Route Accepted',
          description: `${data.driverName} accepted a route with ${data.dropCount} stops`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        loadTrackingData();
      });

      // Listen for route completed events
      channel.bind('route-completed', (data: any) => {
        console.log('✅ Route completed notification:', data);
        toast({
          title: 'Route Completed',
          description: `${data.driverName} completed a route with ${data.totalDrops} stops`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        loadTrackingData();
      });

      // Listen for drop completed events
      channel.bind('drop-completed', (data: any) => {
        console.log('📦 Drop completed notification:', data);
        loadTrackingData();
      });

      intervalRef.current = setInterval(() => {
        loadTrackingData();
      }, 30000) as any;

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [toast]);

  const loadTrackingData = async () => {
    try {
      setIsRefreshing(true);

      // Load real-time dispatch data
      const response = await fetch('/api/admin/dispatch/realtime');
      if (response.ok) {
        const data = await response.json();
        const locations = (data.data.driverLocations || []).map((loc: any) => ({
          ...loc,
          label: `${loc.driverName} - ${loc.status}`,
        }));
        setDriverLocations(locations);
      }

      // Load active bookings with tracking data
      const bookingsResponse = await fetch(
        '/api/admin/orders?status=active&includeTracking=true'
      );
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData.bookings || []);
      }

      setLastUpdate(new Date());
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

  const loadBookingDetails = async (bookingCode: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${bookingCode}/tracking`);
      if (response.ok) {
        const data = await response.json();
        setSelectedBooking(data.booking);
      }
    } catch (error) {
      console.error('Error loading booking details:', error);
      toast({
        title: 'Error Loading Details',
        description: 'Failed to load booking tracking details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

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
        return 'En Route to Dropoff';
      case 'arrived_at_dropoff':
        return 'Arrived at Dropoff';
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

  const filteredBookings = bookings.filter(booking => {
    const matchesStatus =
      filterStatus === 'all' || booking.status === filterStatus;
    const matchesSearch =
      searchQuery === '' ||
      booking.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.addresses.pickup.label
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      booking.addresses.dropoff.label
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (booking.driver?.name || '')
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const activeDrivers = driverLocations.filter(
    driver => driver.status === 'online'
  );
  const totalBookings = bookings.length;
  const inProgressBookings = bookings.filter(
    b => b.status === 'IN_PROGRESS'
  ).length;

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading size="lg">Live Tracking Hub</Heading>
          <Flex justify="center" align="center" minH="400px">
            <Spinner size="xl" />
          </Flex>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={2}>
            <Heading size="lg">Live Tracking Hub</Heading>
            <Text color="gray.600">
              Real-time monitoring of all active deliveries and driver locations
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
                <StatLabel>Active Bookings</StatLabel>
                <StatNumber>{totalBookings}</StatNumber>
                <StatHelpText>Currently being processed</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>In Progress</StatLabel>
                <StatNumber>{inProgressBookings}</StatNumber>
                <StatHelpText>Currently being delivered</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Online Drivers</StatLabel>
                <StatNumber>{activeDrivers.length}</StatNumber>
                <StatHelpText>Available for assignments</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Tracking Coverage</StatLabel>
                <StatNumber>
                  {totalBookings > 0
                    ? Math.round(
                        (bookings.filter(b => b.currentLocation).length /
                          totalBookings) *
                          100
                      )
                    : 0}
                  %
                </StatNumber>
                <StatHelpText>With live location data</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Filters */}
        <Card>
          <CardBody>
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
                  <option value="COMPLETED">Completed</option>
                </Select>
              </Box>
              <Box>
                <Text fontSize="sm" mb={2}>
                  Search
                </Text>
                <Input
                  placeholder="Search bookings..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  size="sm"
                  w="250px"
                />
              </Box>
            </HStack>
          </CardBody>
        </Card>

        {/* Main Content */}
        <Grid templateColumns="1fr 400px" gap={8}>
          {/* Map */}
          <GridItem>
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Flex justify="space-between" align="center">
                    <Heading size="md">Live Map</Heading>
                    <Badge colorScheme="green">
                      Real-time tracking enabled
                    </Badge>
                  </Flex>
                  <Box h="600px" borderRadius="md" overflow="hidden">
                    <LiveMap
                      driverLocations={driverLocations}
                      pickupLocation={
                        selectedBooking?.currentLocation
                          ? {
                              lat: selectedBooking.currentLocation.lat,
                              lng: selectedBooking.currentLocation.lng,
                              label: 'Pickup Location',
                            }
                          : {
                              lat: 0,
                              lng: 0,
                              label: 'No Location',
                            }
                      }
                      dropoffLocation={
                        selectedBooking?.currentLocation
                          ? {
                              lat: selectedBooking.currentLocation.lat,
                              lng: selectedBooking.currentLocation.lng,
                              label: 'Dropoff Location',
                            }
                          : {
                              lat: 0,
                              lng: 0,
                              label: 'No Location',
                            }
                      }
                    />
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </GridItem>

          {/* Bookings List */}
          <GridItem>
            <Card>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <Heading size="md">Active Bookings</Heading>

                  {filteredBookings.length === 0 ? (
                    <Alert status="info">
                      <AlertIcon />
                      No active bookings found
                    </Alert>
                  ) : (
                    <VStack
                      spacing={3}
                      align="stretch"
                      maxH="600px"
                      overflowY="auto"
                    >
                      {filteredBookings.map(booking => (
                        <Card
                          key={booking.id}
                          size="sm"
                          cursor="pointer"
                          onClick={() => {
                            setSelectedBooking(booking);
                            loadBookingDetails(booking.reference);
                          }}
                          bg={
                            selectedBooking?.id === booking.id
                              ? 'blue.50'
                              : undefined
                          }
                          _hover={{ bg: 'gray.50' }}
                        >
                          <CardBody p={4}>
                            <VStack spacing={2} align="stretch">
                              <Flex justify="space-between" align="center">
                                <Text fontWeight="bold" fontSize="sm">
                                  {booking.reference}
                                </Text>
                                <Badge
                                  colorScheme={getStatusColor(booking.status)}
                                  size="sm"
                                >
                                  {booking.status}
                                </Badge>
                              </Flex>

                              <Text fontSize="xs" color="gray.600">
                                {booking.addresses.pickup.label}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                → {booking.addresses.dropoff.label}
                              </Text>

                              {booking.driver && (
                                <Text fontSize="xs" color="blue.600">
                                  Driver: {booking.driver.name}
                                </Text>
                              )}

                              {booking.currentLocation && (
                                <HStack spacing={2}>
                                  <FiMapPin size={12} />
                                  <Text fontSize="xs" color="green.600">
                                    Live location available
                                  </Text>
                                </HStack>
                              )}

                              {booking.routeProgress > 0 && (
                                <Box>
                                  <Text fontSize="xs" mb={1}>
                                    Progress
                                  </Text>
                                  <Progress
                                    value={booking.routeProgress}
                                    size="sm"
                                    colorScheme="blue"
                                  />
                                </Box>
                              )}

                              {booking.eta && (
                                <HStack spacing={2}>
                                  <FiClock size={12} />
                                  <Text fontSize="xs">
                                    ETA: {booking.eta.minutesRemaining} min
                                  </Text>
                                </HStack>
                              )}
                            </VStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Selected Booking Details */}
        {selectedBooking && (
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">
                  Booking Details: {selectedBooking.reference}
                </Heading>

                <Grid
                  templateColumns="repeat(auto-fit, minmax(250px, 1fr))"
                  gap={6}
                >
                  <VStack align="start" spacing={2}>
                    <Text fontWeight="bold">Customer</Text>
                    <Text>{selectedBooking.customer.name}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {selectedBooking.customer.email}
                    </Text>
                  </VStack>

                  {selectedBooking.driver && (
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold">Driver</Text>
                      <Text>{selectedBooking.driver.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {selectedBooking.driver.email}
                      </Text>
                    </VStack>
                  )}

                  {selectedBooking.properties && (
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold">Property Details</Text>
                      {selectedBooking.properties.pickup && (
                        <Text fontSize="sm" color="gray.600">
                          Pickup: {selectedBooking.properties.pickup.buildingTypeDisplay} - Floor {selectedBooking.properties.pickup.floors} 
                          {selectedBooking.properties.pickup.hasElevator ? ' (Elevator Available)' : ' (No Elevator)'}
                        </Text>
                      )}
                      {selectedBooking.properties.dropoff && (
                        <Text fontSize="sm" color="gray.600">
                          Dropoff: {selectedBooking.properties.dropoff.buildingTypeDisplay} - Floor {selectedBooking.properties.dropoff.floors} 
                          {selectedBooking.properties.dropoff.hasElevator ? ' (Elevator Available)' : ' (No Elevator)'}
                        </Text>
                      )}
                    </VStack>
                  )}

                  <VStack align="start" spacing={2}>
                    <Text fontWeight="bold">Route Progress</Text>
                    <Progress
                      value={selectedBooking.routeProgress}
                      w="100%"
                      colorScheme="blue"
                    />
                    <Text fontSize="sm">
                      {selectedBooking.routeProgress}% complete
                    </Text>
                  </VStack>

                  {selectedBooking.eta && (
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold">Estimated Arrival</Text>
                      <Text>
                        {selectedBooking.eta.minutesRemaining} minutes
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {new Date(
                          selectedBooking.eta.estimatedArrival
                        ).toLocaleString()}
                      </Text>
                    </VStack>
                  )}
                </Grid>

                {selectedBooking.lastEvent && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Last Event
                    </Text>
                    <Card size="sm">
                      <CardBody>
                        <VStack align="start" spacing={1}>
                          <Badge colorScheme="blue">
                            {getStepLabel(selectedBooking.lastEvent.step)}
                          </Badge>
                          <Text fontSize="sm">
                            {new Date(
                              selectedBooking.lastEvent.createdAt
                            ).toLocaleString()}
                          </Text>
                          {selectedBooking.lastEvent.notes && (
                            <Text fontSize="sm" color="gray.600">
                              {selectedBooking.lastEvent.notes}
                            </Text>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  </Box>
                )}

                {selectedBooking.trackingPings.length > 0 && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Recent Location Updates
                    </Text>
                    <VStack
                      spacing={2}
                      align="stretch"
                      maxH="200px"
                      overflowY="auto"
                    >
                      {selectedBooking.trackingPings.slice(0, 5).map(ping => (
                        <HStack key={ping.id} spacing={3}>
                          <FiMapPin />
                          <Text fontSize="sm">
                            {ping.lat.toFixed(6)}, {ping.lng.toFixed(6)}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(ping.createdAt).toLocaleTimeString()}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Container>
  );
}
