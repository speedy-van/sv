/**
 * Manual Route Creation Page
 * Allow admins to manually create routes by selecting bookings
 */

'use client';

import React, { useState, useEffect } from 'react';
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
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  Select,
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
} from '@chakra-ui/react';
import {
  FiPackage,
  FiMapPin,
  FiClock,
  FiTruck,
  FiCheck,
  FiArrowLeft,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';

interface Booking {
  id: string;
  reference: string;
  customerName: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledAt: Date;
  totalGBP: number;
  serviceTier: string;
  status: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  distance?: number; // Distance between pickup and dropoff in km
}

interface Driver {
  id: string;
  name: string;
  status: string;
}

export default function CreateRoutePage() {
  const router = useRouter();
  const toast = useToast();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSuggestingRoute, setIsSuggestingRoute] = useState(false);

  // Haversine formula to calculate distance between two points in miles
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => { // DEPRECATED - internal use only
    const R = 3958.8; // Earth's radius in miles (changed from 6371 km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bookingsRes, driversRes] = await Promise.all([
        fetch('/api/admin/routes/pending-drops'),
        fetch('/api/admin/drivers/available'),
      ]);

      const bookingsData = await bookingsRes.json();
      const driversData = await driversRes.json();

      if (bookingsData.success) {
        setBookings(bookingsData.drops || []);
      }

      if (driversData.success) {
        setDrivers(driversData.drivers || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load bookings and drivers',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBooking = (bookingId: string) => {
    setSelectedBookings(prev =>
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBookings.length === bookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(bookings.map(b => b.id));
    }
  };

  // Smart Route Suggestion using Nearest Neighbor algorithm
  const handleSuggestSmartRoute = () => {
    if (selectedBookings.length < 2) {
      toast({
        title: 'Not Enough Bookings',
        description: 'Please select at least 2 bookings for route optimization',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsSuggestingRoute(true);

    try {
      const selectedBookingsData = bookings.filter(b => selectedBookings.includes(b.id));
      
      // Check if all bookings have coordinates
      const hasCoordinates = selectedBookingsData.every(b => 
        b.pickupLat && b.pickupLng && b.dropoffLat && b.dropoffLng
      );

      if (!hasCoordinates) {
        toast({
          title: 'Missing Location Data',
          description: 'Some bookings are missing coordinates. Using time-based ordering.',
          status: 'info',
          duration: 4000,
        });
        
        // Fallback: sort by scheduled time
        const sortedByTime = selectedBookingsData.sort((a, b) => 
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        );
        setSelectedBookings(sortedByTime.map(b => b.id));
        return;
      }

      // Nearest Neighbor algorithm for route optimization
      const optimizedRoute: string[] = [];
      const remaining = [...selectedBookingsData];
      
      // Start with the booking that has earliest scheduled time
      const startBooking = remaining.reduce((earliest, current) => 
        new Date(current.scheduledAt) < new Date(earliest.scheduledAt) ? current : earliest
      );
      
      optimizedRoute.push(startBooking.id);
      remaining.splice(remaining.indexOf(startBooking), 1);
      
      let currentLat = startBooking.dropoffLat!;
      let currentLng = startBooking.dropoffLng!;
      
      // Find nearest neighbor for each subsequent stop
      while (remaining.length > 0) {
        let nearestIndex = 0;
        let nearestDistance = Infinity;
        
        remaining.forEach((booking, index) => {
          const distance = calculateDistance( // DEPRECATED - internal use only
            currentLat,
            currentLng,
            booking.pickupLat!,
            booking.pickupLng!
          );
          
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = index;
          }
        });
        
        const nearestBooking = remaining[nearestIndex];
        optimizedRoute.push(nearestBooking.id);
        currentLat = nearestBooking.dropoffLat!;
        currentLng = nearestBooking.dropoffLng!;
        remaining.splice(nearestIndex, 1);
      }
      
      setSelectedBookings(optimizedRoute);
      
      // Calculate total distance
      let totalDistance = 0;
      for (let i = 0; i < optimizedRoute.length - 1; i++) {
        const current = selectedBookingsData.find(b => b.id === optimizedRoute[i])!;
        const next = selectedBookingsData.find(b => b.id === optimizedRoute[i + 1])!;
        totalDistance += calculateDistance( // DEPRECATED - internal use only
          current.dropoffLat!,
          current.dropoffLng!,
          next.pickupLat!,
          next.pickupLng!
        );
      }
      
      toast({
        title: 'Route Optimized!',
        description: `Suggested route order with total distance: ${totalDistance.toFixed(1)} miles`,
        status: 'success',
        duration: 5000,
      });
      
    } catch (error) {
      console.error('Route suggestion error:', error);
      toast({
        title: 'Optimization Failed',
        description: 'Could not optimize route. Using current selection order.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsSuggestingRoute(false);
    }
  };

  const handleCreateRoute = async () => {
    if (selectedBookings.length === 0) {
      toast({
        title: 'No Bookings Selected',
        description: 'Please select at least one booking',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingIds: selectedBookings, // Send booking IDs
          driverId: selectedDriver || null,
          startTime: new Date().toISOString(),
          serviceTier: 'standard',
          isAutomatic: false,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Route Created Successfully!',
          description: `${selectedBookings.length} booking(s) added to route. Redirecting to Total Routes...`,
          status: 'success',
          duration: 3000,
        });
        
        // Clear selections
        setSelectedBookings([]);
        setSelectedDriver('');
        
        // Redirect to routes page where the new route will appear in Total Routes
        router.push('/admin/routes');
        router.refresh(); // Force refresh to show new route
      } else {
        throw new Error(data.error || 'Failed to create route');
      }
    } catch (error: any) {
      console.error('Failed to create route:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create route',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const totalValue = bookings
    .filter(b => selectedBookings.includes(b.id))
    .reduce((sum, b) => {
      const value = Number(b.totalGBP || 0);
      return (Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER) ? sum + value : sum;
    }, 0);

  return (
    <AdminShell title="Create Manual Route">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <Box>
              <HStack spacing={3} mb={2}>
                <Button
                  leftIcon={<FiArrowLeft />}
                  variant="ghost"
                  onClick={() => router.push('/admin/routes')}
                >
                  Back
                </Button>
              </HStack>
              <Heading size="lg" color="white">Create Manual Route</Heading>
              <Text color="gray.400" mt={1}>
                Select bookings and optionally assign a driver
              </Text>
            </Box>
            <Button
              leftIcon={<FiCheck />}
              colorScheme="blue"
              size="lg"
              onClick={handleCreateRoute}
              isLoading={isCreating}
              isDisabled={selectedBookings.length === 0 || isCreating}
            >
              Create Route ({selectedBookings.length})
            </Button>
          </HStack>

          {/* Summary Cards */}
          <Grid templateColumns="repeat(3, 1fr)" gap={4}>
            <Card bg="gray.800" borderWidth="1px" borderColor="gray.700">
              <CardBody>
                <HStack>
                  <Icon as={FiPackage} color="blue.400" boxSize={5} />
                  <Box>
                    <Text color="gray.400" fontSize="sm">Selected Bookings</Text>
                    <Text color="white" fontSize="2xl" fontWeight="bold">
                      {selectedBookings.length}
                    </Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>

            <Card bg="gray.800" borderWidth="1px" borderColor="gray.700">
              <CardBody>
                <HStack>
                  <Icon as={FiPackage} color="green.400" boxSize={5} />
                  <Box>
                    <Text color="gray.400" fontSize="sm">Total Value</Text>
                    <Text color="white" fontSize="2xl" fontWeight="bold">
                      £{(totalValue / 100).toFixed(2)}
                    </Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>

            <Card bg="gray.800" borderWidth="1px" borderColor="gray.700">
              <CardBody>
                <HStack>
                  <Icon as={FiTruck} color="purple.400" boxSize={5} />
                  <Box>
                    <Text color="gray.400" fontSize="sm">Available Bookings</Text>
                    <Text color="white" fontSize="2xl" fontWeight="bold">
                      {bookings.length}
                    </Text>
                  </Box>
                </HStack>
              </CardBody>
            </Card>
          </Grid>

          {/* Selected Drops Preview */}
          {selectedBookings.length > 0 && (
            <Card bg="blue.900" borderWidth="2px" borderColor="blue.500">
              <CardBody>
                <HStack justify="space-between" mb={3}>
                  <VStack align="start" spacing={0}>
                    <Text color="white" fontSize="lg" fontWeight="bold">
                      Selected Drops ({selectedBookings.length})
                    </Text>
                    {selectedBookings.length > 1 && (() => {
                      const selectedBookingsData = selectedBookings
                        .map(id => bookings.find(b => b.id === id))
                        .filter(b => b && b.pickupLat && b.pickupLng && b.dropoffLat && b.dropoffLng);
                      
                      if (selectedBookingsData.length > 1) {
                        let totalDistance = 0;
                        for (let i = 0; i < selectedBookingsData.length - 1; i++) {
                          const current = selectedBookingsData[i]!;
                          const next = selectedBookingsData[i + 1]!;
                          totalDistance += calculateDistance( // DEPRECATED - internal use only
                            current.dropoffLat!,
                            current.dropoffLng!,
                            next.pickupLat!,
                            next.pickupLng!
                          );
                        }
                        
                        return (
                          <Text color="gray.300" fontSize="sm">
                            Total Route Distance: {totalDistance.toFixed(1)} miles
                          </Text>
                        );
                      }
                      return null;
                    })()}
                  </VStack>
                  <Button
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    onClick={() => setSelectedBookings([])}
                  >
                    Clear All
                  </Button>
                </HStack>
                <VStack spacing={2} align="stretch">
                  {selectedBookings.map((bookingId, index) => {
                    const booking = bookings.find(b => b.id === bookingId);
                    const nextBookingId = selectedBookings[index + 1];
                    const nextBooking = nextBookingId ? bookings.find(b => b.id === nextBookingId) : null;
                    
                    let distanceToNext = 0;
                    if (booking && nextBooking && 
                        booking.dropoffLat && booking.dropoffLng && 
                        nextBooking.pickupLat && nextBooking.pickupLng) {
                      distanceToNext = calculateDistance( // DEPRECATED - internal use only
                        booking.dropoffLat,
                        booking.dropoffLng,
                        nextBooking.pickupLat,
                        nextBooking.pickupLng
                      );
                    }
                    
                    return (
                      <Box key={bookingId}>
                        <HStack 
                          p={2} 
                          bg="blue.800" 
                          borderRadius="md"
                          justify="space-between"
                        >
                          <HStack spacing={3}>
                            <Badge colorScheme="purple" fontSize="md" px={2}>
                              {index + 1}
                            </Badge>
                            <VStack align="start" spacing={0}>
                              <Text color="white" fontSize="sm" fontWeight="bold">
                                {booking?.customerName || 'Unknown'}
                              </Text>
                              <HStack spacing={2} fontSize="xs" color="gray.300">
                                <Text>{booking?.pickupAddress?.slice(0, 30)}...</Text>
                                {booking?.distance && (
                                  <Badge colorScheme="purple" fontSize="xs">
                                    {booking.distance.toFixed(1)} miles
                                  </Badge>
                                )}
                              </HStack>
                            </VStack>
                          </HStack>
                          <Button
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => handleToggleBooking(bookingId)}
                          >
                            Remove
                          </Button>
                        </HStack>
                        
                        {distanceToNext > 0 && (
                          <HStack justify="center" py={1}>
                            <Icon as={FiMapPin} color="gray.400" boxSize={3} />
                            <Text color="gray.400" fontSize="xs">
                              ↓ {distanceToNext.toFixed(1)} miles to next stop
                            </Text>
                          </HStack>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Route Configuration */}
          {selectedBookings.length > 0 && (
            <Card bg="gray.800" borderWidth="1px" borderColor="gray.700">
              <CardBody>
                <Text color="white" fontSize="lg" fontWeight="bold" mb={4}>
                  Route Configuration
                </Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <FormControl>
                    <FormLabel color="gray.400">
                      <HStack spacing={2}>
                        <Icon as={FiPackage} color="green.400" />
                        <Text>Route Number</Text>
                      </HStack>
                    </FormLabel>
                    <Input
                      value="Auto-generated (e.g., RT1A2B3C4D)"
                      isReadOnly
                      bg="gray.700"
                      color="gray.400"
                      borderColor="gray.600"
                      cursor="not-allowed"
                      fontStyle="italic"
                    />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      ✓ Route number will be generated automatically upon creation
                    </Text>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color="gray.400">
                      <HStack spacing={2}>
                        <Icon as={FiTruck} color="blue.400" />
                        <Text>Assign Driver</Text>
                        {selectedDriver && <Badge colorScheme="green" fontSize="xs">Selected</Badge>}
                      </HStack>
                    </FormLabel>
                    <Select
                      placeholder="Choose a driver"
                      value={selectedDriver}
                      onChange={(e) => setSelectedDriver(e.target.value)}
                      bg="gray.700"
                      color="white"
                      borderColor={selectedDriver ? 'green.500' : 'gray.600'}
                      _hover={{ borderColor: 'gray.500' }}
                      size="lg"
                    >
                      {drivers.filter(d => d.status === 'online').map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.name} - {driver.status}
                        </option>
                      ))}
                    </Select>
                    {drivers.filter(d => d.status === 'online').length === 0 && (
                      <Text color="orange.300" fontSize="xs" mt={1}>
                        ⚠️ No drivers currently online. Route will be created unassigned.
                      </Text>
                    )}
                  </FormControl>
                </Grid>
              </CardBody>
            </Card>
          )}

          {/* Bookings Table */}
          <Card bg="gray.800" borderWidth="1px" borderColor="gray.700">
            <CardBody>
              <HStack justify="space-between" mb={4}>
                <Text color="white" fontSize="lg" fontWeight="bold">
                  Available Bookings
                </Text>
                <HStack spacing={3}>
                  <Button
                    size="sm"
                    leftIcon={<Icon as={FiMapPin} />}
                    colorScheme="purple"
                    variant="solid"
                    onClick={handleSuggestSmartRoute}
                    isLoading={isSuggestingRoute}
                    isDisabled={selectedBookings.length < 2}
                  >
                    Suggest Smart Route
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                    colorScheme="blue"
                  >
                    {selectedBookings.length === bookings.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </HStack>
              </HStack>

              {isLoading ? (
                <Box textAlign="center" py={12}>
                  <Spinner size="xl" color="blue.400" />
                  <Text color="gray.400" mt={4}>Loading bookings...</Text>
                </Box>
              ) : bookings.length === 0 ? (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  No confirmed bookings available for route creation
                </Alert>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th color="gray.400" w="50px">#</Th>
                        <Th color="gray.400">Actions</Th>
                        <Th color="gray.400">Reference</Th>
                        <Th color="gray.400">Customer</Th>
                        <Th color="gray.400">Pickup → Dropoff</Th>
                        <Th color="gray.400">Distance</Th>
                        <Th color="gray.400">Scheduled</Th>
                        <Th color="gray.400">Value</Th>
                        <Th color="gray.400">Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {bookings.map((booking, index) => {
                        const isSelected = selectedBookings.includes(booking.id);
                        const orderInRoute = selectedBookings.indexOf(booking.id) + 1;
                        return (
                          <Tr
                            key={booking.id}
                            bg={isSelected ? 'blue.900' : 'transparent'}
                            _hover={{ bg: isSelected ? 'blue.800' : 'gray.700' }}
                            transition="all 0.2s"
                            borderLeftWidth={isSelected ? '4px' : '0'}
                            borderLeftColor="blue.400"
                          >
                            <Td>
                              {isSelected ? (
                                <Badge colorScheme="blue" fontSize="md" px={2} py={1}>
                                  {orderInRoute}
                                </Badge>
                              ) : (
                                <Text color="gray.600" fontSize="sm">
                                  {index + 1}
                                </Text>
                              )}
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                {!isSelected ? (
                                  <Button
                                    size="sm"
                                    colorScheme="green"
                                    variant="solid"
                                    leftIcon={<Icon as={FiCheck} />}
                                    onClick={() => handleToggleBooking(booking.id)}
                                    _hover={{ transform: 'scale(1.05)' }}
                                    transition="all 0.2s"
                                  >
                                    Add
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    colorScheme="red"
                                    variant="solid"
                                    onClick={() => handleToggleBooking(booking.id)}
                                    _hover={{ transform: 'scale(1.05)' }}
                                    transition="all 0.2s"
                                  >
                                    Remove
                                  </Button>
                                )}
                              </HStack>
                            </Td>
                          <Td>
                            <Text color="white" fontSize="sm" fontWeight="medium">
                              {booking.reference || booking.id.slice(0, 8)}
                            </Text>
                          </Td>
                          <Td>
                            <Text color="white" fontSize="sm">
                              {booking.customerName}
                            </Text>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={0}>
                              <Text color="gray.300" fontSize="xs">
                                {booking.pickupAddress}
                              </Text>
                              <Text color="gray.500" fontSize="xs">
                                → {booking.dropoffAddress}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            {booking.distance ? (
                              <HStack spacing={1}>
                                <Icon as={FiMapPin} color="purple.400" boxSize={3} />
                                <Text color="white" fontSize="sm" fontWeight="medium">
                                  {booking.distance.toFixed(1)} miles
                                </Text>
                              </HStack>
                            ) : (
                              <Text color="gray.500" fontSize="xs">
                                N/A
                              </Text>
                            )}
                          </Td>
                          <Td>
                            <Text color="gray.300" fontSize="xs">
                              {new Date(booking.scheduledAt).toLocaleString('en-GB')}
                            </Text>
                          </Td>
                          <Td>
                            <Text color="white" fontSize="sm" fontWeight="medium">
                              £{(booking.totalGBP / 100).toFixed(2)}
                            </Text>
                          </Td>
                          <Td>
                            {isSelected ? (
                              <Badge colorScheme="green" fontSize="xs">
                                ✓ Added to Route
                              </Badge>
                            ) : (
                              <Badge colorScheme="gray" fontSize="xs">
                                Available
                              </Badge>
                            )}
                          </Td>
                        </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </AdminShell>
  );
}

