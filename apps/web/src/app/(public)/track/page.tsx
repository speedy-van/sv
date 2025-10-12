'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Card,
  CardBody,
  Heading,
  Badge,
  Spinner,
  useToast,
  useColorModeValue,
  Divider,
  Alert,
  AlertIcon,
  Progress,
  IconButton,
  Tooltip,
  Flex,
  Grid,
  GridItem,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import {
  FiMapPin,
  FiClock,
  FiTruck,
  FiSearch,
  FiRefreshCw,
  FiWifi,
  FiWifiOff,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
} from 'react-icons/fi';
import { useRealTimeTracking } from '@/hooks/useRealTimeTracking';
import { TrackingData } from '@/lib/tracking-service';

const LiveMap = dynamic(() => import('@/components/Map/LiveMap'), {
  ssr: false,
});

export default function TrackPage() {
  const [code, setCode] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const {
    trackingData,
    isConnected,
    isLoading,
    error,
    lookupBooking,
    refreshData,
    lastUpdate,
    connectionStatus,
  } = useRealTimeTracking({
    autoSubscribe: true,
    refreshInterval: 30000, // 30 seconds
    onUpdate: update => {
      // Show toast for important updates
      if (update.type === 'status') {
        toast({
          title: 'Status Updated',
          description: `Booking status changed to: ${update.data.status}`,
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    },
  });

  const handleSearch = async () => {
    if (!code.trim()) {
      toast({
        title: 'Booking Code Required',
        description: 'Please enter a booking code to track your delivery',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSearchPerformed(true);
    const result = await lookupBooking(code.trim());

    if (result) {
      toast({
        title: 'Booking Found',
        description: `Successfully tracking booking ${result.reference}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'COMPLETED':
        return 'green';
      case 'IN_PROGRESS':
        return 'blue';
      case 'CONFIRMED':
        return 'yellow';
      case 'DRAFT':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'COMPLETED':
        return 'COMPLETED';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'CONFIRMED':
        return 'Driver Assigned';
      case 'DRAFT':
        return 'Awaiting Driver';
      default:
        return status;
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

  const formatETA = (etaData: any) => {
    if (!etaData || typeof etaData.minutesRemaining !== 'number') {
      return undefined;
    }
    const minutes = Math.round(etaData.minutesRemaining);
    if (minutes <= 0) return 'Arriving now';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading size="lg" mb={2}>
            Track Your Delivery
          </Heading>
          <Text color="gray.600">
            Enter your booking code or unified booking ID (e.g., SV12345) to
            track your delivery in real-time
          </Text>
        </Box>

        {/* Connection Status */}
        <Card bg={bgColor} border={`1px solid ${borderColor}`}>
          <CardBody>
            <HStack justify="space-between" align="center">
              <HStack spacing={2}>
                {isConnected ? (
                  <FiWifi color="green" />
                ) : (
                  <FiWifiOff color="red" />
                )}
                <Text fontSize="sm">
                  Real-time tracking:{' '}
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
              </HStack>
              {!isConnected && connectionStatus.reconnectAttempts > 0 && (
                <Text fontSize="xs" color="orange.500">
                  Reconnecting... ({connectionStatus.reconnectAttempts}/
                  {connectionStatus.maxReconnectAttempts})
                </Text>
              )}
            </HStack>
          </CardBody>
        </Card>

        {/* Search Section */}
        <Card bg={bgColor} border={`1px solid ${borderColor}`}>
          <CardBody>
            <VStack spacing={4}>
              <HStack w="100%" spacing={3}>
                <Input
                  placeholder="Enter booking code (e.g., ABC123) or unified ID (e.g., SV12345)"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyPress={e => e.key === 'Enter' && handleSearch()}
                  size="lg"
                />
                <Button
                  leftIcon={<FiSearch />}
                  onClick={handleSearch}
                  isLoading={isLoading}
                  loadingText="Searching..."
                  size="lg"
                  colorScheme="blue"
                >
                  Track
                </Button>
              </HStack>

              {trackingData && (
                <HStack spacing={2}>
                  <Text fontSize="sm" color="gray.600">
                    Last updated: {formatTime(trackingData.lastUpdated?.toISOString() || new Date().toISOString())}
                  </Text>
                  <Tooltip label="Refresh tracking data">
                    <IconButton
                      icon={<FiRefreshCw />}
                      aria-label="Refresh"
                      size="sm"
                      variant="ghost"
                      onClick={refreshData}
                      isLoading={isLoading}
                    />
                  </Tooltip>
                </HStack>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <Box>
              <Text fontWeight="medium">Error</Text>
              <Text fontSize="sm">{error}</Text>
            </Box>
          </Alert>
        )}

        {/* Tracking Information */}
        {trackingData && (
          <>
            {/* Status Card */}
            <Card bg={bgColor} border={`1px solid ${borderColor}`}>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Heading size="md">Delivery Status</Heading>
                      <Text fontSize="sm" color="gray.600">
                        Reference: {trackingData.reference}
                      </Text>
                    </VStack>
                    <Badge
                      colorScheme={getStatusColor(trackingData.status)}
                      variant="subtle"
                      fontSize="md"
                      px={3}
                      py={1}
                    >
                      {getStatusText(trackingData.status)}
                    </Badge>
                  </HStack>

                  <Divider />

                  {/* Route Progress */}
                  <Box>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="medium">Route Progress</Text>
                      <Text fontSize="sm" color="gray.600">
                        {trackingData.routeProgress}% complete
                      </Text>
                    </HStack>
                    <Progress
                      value={trackingData.routeProgress}
                      colorScheme="blue"
                      size="lg"
                      borderRadius="md"
                    />
                  </Box>

                  {/* Addresses */}
                  <Grid
                    templateColumns="repeat(auto-fit, minmax(300px, 1fr))"
                    gap={4}
                  >
                    <Box>
                      <HStack mb={2}>
                        <FiMapPin />
                        <Text fontWeight="medium">Pickup Address</Text>
                      </HStack>
                      <Text color="gray.700" pl={6}>
                        Pickup Address
                      </Text>
                      <Text color="gray.500" pl={6} fontSize="sm">
                        Postcode: Not available
                      </Text>
                    </Box>

                    <Box>
                      <HStack mb={2}>
                        <FiMapPin />
                        <Text fontWeight="medium">Delivery Address</Text>
                      </HStack>
                      <Text color="gray.700" pl={6}>
                        Delivery Address
                      </Text>
                      <Text color="gray.500" pl={6} fontSize="sm">
                        Postcode: Not available
                      </Text>
                    </Box>
                  </Grid>



                  {/* ETA Information */}
                  {trackingData.eta && trackingData.eta !== null && (
                    <>
                      <Divider />
                      <HStack justify="space-between">
                        <HStack>
                          <FiClock />
                          <Text fontWeight="medium">Estimated Arrival</Text>
                        </HStack>
                        <VStack align="end" spacing={1}>
                          <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color="blue.600"
                          >
                            {(() => {
                              try {
                                const eta = trackingData.eta as any;
                                if (!eta) return 'Calculating...';
                                
                                // Handle object format (new API response)
                                if (eta.minutesRemaining !== undefined) {
                                  const minutes = Number(eta.minutesRemaining);
                                  return isNaN(minutes) || minutes < 0 ? 'Calculating...' : `${minutes} minutes`;
                                } 
                                // Handle number format (legacy)
                                else if (typeof eta === 'number') {
                                  const minutes = Math.round(eta / (1000 * 60));
                                  return isNaN(minutes) || minutes < 0 ? 'Calculating...' : `${minutes} minutes`;
                                }
                                return 'Calculating...';
                              } catch {
                                return 'Calculating...';
                              }
                            })()}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {(() => {
                              try {
                                const eta = trackingData.eta as any;
                                if (!eta?.estimatedArrival) return 'Estimated arrival time';
                                
                                const arrivalTime = new Date(eta.estimatedArrival);
                                return isNaN(arrivalTime.getTime()) ? 
                                  'Estimated arrival time' : 
                                  `Arrives at ${arrivalTime.toLocaleTimeString()}`;
                              } catch {
                                return 'Estimated arrival time';
                              }
                            })()}
                          </Text>
                          <Badge
                            colorScheme={(() => {
                              try {
                                const eta = trackingData.eta as any;
                                return eta?.isOnTime ? 'green' : 'orange';
                              } catch {
                                return 'blue';
                              }
                            })()}
                            size="sm"
                          >
                            {(() => {
                              try {
                                const eta = trackingData.eta as any;
                                return eta?.isOnTime ? 'On Time' : 'Delayed';
                              } catch {
                                return 'In Transit';
                              }
                            })()}
                          </Badge>
                        </VStack>
                      </HStack>
                    </>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Live Map */}
            {trackingData && (trackingData as any).pickupAddress && (trackingData as any).dropoffAddress && (
              <Card bg={bgColor} border={`1px solid ${borderColor}`}>
                <CardBody p={0}>
                  <Box height={400} position="relative" borderRadius="lg" overflow="hidden">
                    <LiveMap
                      pickupLocation={{
                        lat: (trackingData as any).pickupAddress.coordinates.lat,
                        lng: (trackingData as any).pickupAddress.coordinates.lng,
                        label: (trackingData as any).pickupAddress.label || 'Pickup Location'
                      }}
                      dropoffLocation={{
                        lat: (trackingData as any).dropoffAddress.coordinates.lat,
                        lng: (trackingData as any).dropoffAddress.coordinates.lng,
                        label: (trackingData as any).dropoffAddress.label || 'Delivery Location'
                      }}
                      driverLocation={trackingData.currentLocation ? {
                        lat: trackingData.currentLocation.lat,
                        lng: trackingData.currentLocation.lng,
                        label: 'Driver Location'
                      } : undefined}
                      height={400}
                      showRoute={true}
                      showETA={true}
                      eta={formatETA((trackingData as any).eta)}
                    />
                  </Box>
                  <Box p={4} bg={bgColor}>
                    <HStack justify="space-between" align="center">
                      <Text fontSize="sm" color="gray.600">
                        🚚 Live driver location • 📍 Pickup • 🏁 Delivery
                      </Text>
                      <HStack spacing={2}>
                        <Badge 
                          colorScheme={isConnected ? 'green' : 'gray'}
                          variant="subtle"
                          size="sm"
                        >
                          <HStack spacing={1}>
                            {isConnected ? <FiWifi /> : <FiWifiOff />}
                            <Text>{isConnected ? 'Live' : 'Offline'}</Text>
                          </HStack>
                        </Badge>
                        {trackingData.lastUpdated && (
                          <Text fontSize="xs" color="gray.500">
                            Updated: {new Date(trackingData.lastUpdated).toLocaleTimeString()}
                          </Text>
                        )}
                      </HStack>
                    </HStack>
                  </Box>
                </CardBody>
              </Card>
            )}

          </>
        )}

        {/* Help Section */}
        {!trackingData && searchPerformed && (
          <Alert status="info">
            <AlertIcon />
            <Box>
              <Text fontWeight="medium">How to track your delivery</Text>
              <Text fontSize="sm">
                Enter the booking code you received when you placed your order,
                or use the unified booking ID (SV12345 format). You can find
                these codes in your confirmation email or SMS.
              </Text>
            </Box>
          </Alert>
        )}

        {/* Connection Help */}
        {!isConnected && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <Text fontWeight="medium">Real-time tracking unavailable</Text>
              <Text fontSize="sm">
                We're having trouble connecting to the real-time tracking
                service. Your tracking information will still update when you
                refresh the page.
              </Text>
            </Box>
          </Alert>
        )}
      </VStack>
    </Container>
  );
}
