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
    <Container maxW="container.lg" py={{ base: 20, md: 32 }} mt={{ base: 12, md: 16 }}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box 
          textAlign="center" 
          py={10}
          px={6}
          borderRadius="2xl"
          bgGradient="linear(to-br, rgba(0,255,157,0.05), rgba(0,255,157,0.1))"
          position="relative"
          overflow="hidden"
          _before={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgGradient: 'radial(circle at 50% 50%, rgba(0,255,157,0.15), transparent 70%)',
            pointerEvents: 'none',
          }}
        >
          <VStack spacing={4} position="relative" zIndex={1}>
            <Box 
              p={4} 
              bg="rgba(0,255,157,0.1)" 
              borderRadius="full"
              display="inline-flex"
            >
              <FiTruck size={40} color="rgba(0,255,157,1)" />
            </Box>
            <Heading 
              size="2xl" 
              bgGradient="linear(to-r, white, neon.400)"
              bgClip="text"
              fontWeight="bold"
            >
              Track Your Delivery
            </Heading>
            <Text color="gray.400" fontSize="lg" maxW="2xl">
              Enter your booking code or unified booking ID (e.g., <Box as="span" color="neon.400" fontWeight="semibold">SV12345</Box>) to
              track your delivery in real-time with live GPS updates
            </Text>
          </VStack>
        </Box>

        {/* Connection Status */}
        <Card 
          bg="rgba(13,13,13,0.8)"
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor={isConnected ? 'neon.400' : 'red.500'}
          transition="all 0.3s"
          _hover={{
            transform: 'translateY(-2px)',
            shadow: isConnected ? '0 4px 20px rgba(0,255,157,0.2)' : '0 4px 20px rgba(255,0,0,0.2)',
          }}
        >
          <CardBody>
            <HStack justify="space-between" align="center">
              <HStack spacing={3}>
                <Box
                  p={2}
                  borderRadius="md"
                  bg={isConnected ? 'rgba(0,255,157,0.1)' : 'rgba(255,0,0,0.1)'}
                >
                  {isConnected ? (
                    <FiWifi size={20} color="rgba(0,255,157,1)" />
                  ) : (
                    <FiWifiOff size={20} color="rgb(255,0,0)" />
                  )}
                </Box>
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="semibold" color="white">
                    Real-time tracking
                  </Text>
                  <Text fontSize="xs" color={isConnected ? 'neon.400' : 'red.400'}>
                    {isConnected ? '● Connected' : '● Disconnected'}
                  </Text>
                </VStack>
              </HStack>
              {!isConnected && connectionStatus.reconnectAttempts > 0 && (
                <Badge colorScheme="orange" variant="subtle">
                  Reconnecting... ({connectionStatus.reconnectAttempts}/
                  {connectionStatus.maxReconnectAttempts})
                </Badge>
              )}
            </HStack>
          </CardBody>
        </Card>

        {/* Search Section */}
        <Card 
          bg="rgba(13,13,13,0.8)"
          backdropFilter="blur(10px)"
          border="1px solid"
          borderColor="rgba(255,255,255,0.1)"
          transition="all 0.3s"
          _hover={{
            borderColor: 'neon.400',
            shadow: '0 8px 30px rgba(0,255,157,0.15)',
          }}
        >
          <CardBody>
            <VStack spacing={4}>
              <HStack w="100%" spacing={3}>
                <Input
                  placeholder="Enter booking code (e.g., ABC123) or unified ID (e.g., SV12345)"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyPress={e => e.key === 'Enter' && handleSearch()}
                  size="lg"
                  bg="rgba(255,255,255,0.05)"
                  border="1px solid"
                  borderColor="rgba(255,255,255,0.1)"
                  color="white"
                  _placeholder={{ color: 'gray.500' }}
                  _hover={{ borderColor: 'neon.400' }}
                  _focus={{
                    borderColor: 'neon.400',
                    boxShadow: '0 0 0 1px rgba(0,255,157,0.5)',
                  }}
                />
                <Button
                  leftIcon={<FiSearch />}
                  onClick={handleSearch}
                  isLoading={isLoading}
                  loadingText="Searching..."
                  size="lg"
                  bgGradient="linear(to-r, neon.400, neon.500)"
                  color="gray.900"
                  fontWeight="bold"
                  _hover={{
                    bgGradient: 'linear(to-r, neon.500, neon.600)',
                    transform: 'translateY(-2px)',
                    shadow: '0 8px 20px rgba(0,255,157,0.3)',
                  }}
                  _active={{
                    transform: 'translateY(0)',
                  }}
                  minW="120px"
                >
                  Track
                </Button>
              </HStack>

              {trackingData && (
                <HStack 
                  spacing={3} 
                  w="100%" 
                  justify="space-between"
                  p={3}
                  bg="rgba(0,255,157,0.05)"
                  borderRadius="md"
                  border="1px solid rgba(0,255,157,0.2)"
                >
                  <HStack spacing={2}>
                    <FiClock color="rgba(0,255,157,1)" />
                    <Text fontSize="sm" color="gray.300">
                      Last updated: <Box as="span" color="neon.400" fontWeight="semibold">{formatTime(trackingData.lastUpdated?.toISOString() || new Date().toISOString())}</Box>
                    </Text>
                  </HStack>
                  <Tooltip label="Refresh tracking data" placement="top">
                    <IconButton
                      icon={<FiRefreshCw />}
                      aria-label="Refresh"
                      size="sm"
                      variant="ghost"
                      color="neon.400"
                      onClick={refreshData}
                      isLoading={isLoading}
                      _hover={{
                        bg: 'rgba(0,255,157,0.1)',
                        transform: 'rotate(180deg)',
                      }}
                      transition="all 0.3s"
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
            <Card 
              bg="rgba(13,13,13,0.8)"
              backdropFilter="blur(10px)"
              border="1px solid"
              borderColor="rgba(255,255,255,0.1)"
              transition="all 0.3s"
              _hover={{
                borderColor: 'neon.400',
                shadow: '0 8px 30px rgba(0,255,157,0.15)',
                transform: 'translateY(-4px)',
              }}
            >
              <CardBody>
                <VStack spacing={6} align="stretch">
                  <HStack justify="space-between" flexWrap="wrap" gap={3}>
                    <VStack align="start" spacing={2}>
                      <HStack spacing={2}>
                        <Box p={2} bg="rgba(0,255,157,0.1)" borderRadius="md">
                          <FiTruck size={24} color="rgba(0,255,157,1)" />
                        </Box>
                        <Heading size="lg" color="white">Delivery Status</Heading>
                      </HStack>
                      <HStack spacing={2}>
                        <Text fontSize="sm" color="gray.500">
                          Reference:
                        </Text>
                        <Badge 
                          colorScheme="purple" 
                          variant="subtle"
                          fontSize="sm"
                          px={3}
                          py={1}
                        >
                          {trackingData.reference}
                        </Badge>
                      </HStack>
                    </VStack>
                    <Badge
                      colorScheme={getStatusColor(trackingData.status)}
                      variant="solid"
                      fontSize="md"
                      px={4}
                      py={2}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      {trackingData.status === 'COMPLETED' && <FiCheckCircle />}
                      {trackingData.status === 'IN_PROGRESS' && <FiTruck />}
                      {getStatusText(trackingData.status)}
                    </Badge>
                  </HStack>

                  <Divider borderColor="rgba(255,255,255,0.1)" />

                  {/* Route Progress */}
                  <Box 
                    p={4} 
                    bg="rgba(255,255,255,0.02)" 
                    borderRadius="lg"
                    border="1px solid rgba(255,255,255,0.05)"
                  >
                    <HStack justify="space-between" mb={3}>
                      <HStack spacing={2}>
                        <FiMapPin color="rgba(0,255,157,1)" />
                        <Text fontWeight="semibold" color="white">Route Progress</Text>
                      </HStack>
                      <Badge 
                        colorScheme="blue" 
                        variant="solid"
                        fontSize="lg"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {trackingData.routeProgress}%
                      </Badge>
                    </HStack>
                    <Box position="relative">
                      <Progress
                        value={trackingData.routeProgress}
                        size="lg"
                        borderRadius="full"
                        bg="rgba(255,255,255,0.1)"
                        sx={{
                          '& > div': {
                            background: 'linear-gradient(90deg, rgba(0,255,157,1) 0%, rgba(0,200,120,1) 100%)',
                          }
                        }}
                      />
                      <Text 
                        position="absolute" 
                        top="50%" 
                        left="50%" 
                        transform="translate(-50%, -50%)"
                        fontSize="xs"
                        fontWeight="bold"
                        color="white"
                        textShadow="0 0 10px rgba(0,0,0,0.8)"
                      >
                        {trackingData.routeProgress}% Complete
                      </Text>
                    </Box>
                  </Box>

                  {/* Addresses */}
                  <Grid
                    templateColumns="repeat(auto-fit, minmax(300px, 1fr))"
                    gap={4}
                  >
                    <Box 
                      p={4} 
                      bg="rgba(0,255,157,0.05)" 
                      borderRadius="lg"
                      border="1px solid rgba(0,255,157,0.2)"
                      transition="all 0.3s"
                      _hover={{
                        bg: 'rgba(0,255,157,0.08)',
                        transform: 'translateY(-2px)',
                      }}
                    >
                      <HStack mb={3} spacing={2}>
                        <Box p={2} bg="rgba(0,255,157,0.2)" borderRadius="md">
                          <FiMapPin color="rgba(0,255,157,1)" />
                        </Box>
                        <Text fontWeight="semibold" color="neon.400" fontSize="md">
                          Pickup Address
                        </Text>
                      </HStack>
                      <VStack align="start" spacing={1} pl={2}>
                        <Text color="white" fontSize="sm">
                          {(trackingData as any).pickupAddress?.label || (trackingData as any).pickupAddress?.full || (trackingData as any).pickupAddress?.street || 'Address not available'}
                        </Text>
                        <Text color="gray.400" fontSize="xs">
                          Postcode: {(trackingData as any).pickupAddress?.postcode || 'Not available'}
                        </Text>
                      </VStack>
                    </Box>

                    <Box 
                      p={4} 
                      bg="rgba(59,130,246,0.05)" 
                      borderRadius="lg"
                      border="1px solid rgba(59,130,246,0.2)"
                      transition="all 0.3s"
                      _hover={{
                        bg: 'rgba(59,130,246,0.08)',
                        transform: 'translateY(-2px)',
                      }}
                    >
                      <HStack mb={3} spacing={2}>
                        <Box p={2} bg="rgba(59,130,246,0.2)" borderRadius="md">
                          <FiMapPin color="rgb(59,130,246)" />
                        </Box>
                        <Text fontWeight="semibold" color="blue.400" fontSize="md">
                          Delivery Address
                        </Text>
                      </HStack>
                      <VStack align="start" spacing={1} pl={2}>
                        <Text color="white" fontSize="sm">
                          {(trackingData as any).dropoffAddress?.label || (trackingData as any).dropoffAddress?.full || (trackingData as any).dropoffAddress?.street || 'Address not available'}
                        </Text>
                        <Text color="gray.400" fontSize="xs">
                          Postcode: {(trackingData as any).dropoffAddress?.postcode || 'Not available'}
                        </Text>
                      </VStack>
                    </Box>
                  </Grid>



                  {/* ETA Information */}
                  {trackingData.eta && trackingData.eta !== null && (
                    <>
                      <Divider borderColor="rgba(255,255,255,0.1)" />
                      <Box
                        p={4}
                        bg="rgba(59,130,246,0.05)"
                        borderRadius="lg"
                        border="1px solid rgba(59,130,246,0.2)"
                      >
                        <HStack justify="space-between" flexWrap="wrap" gap={3}>
                          <HStack spacing={3}>
                            <Box p={3} bg="rgba(59,130,246,0.2)" borderRadius="md">
                              <FiClock size={24} color="rgb(59,130,246)" />
                            </Box>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="semibold" color="white" fontSize="md">
                                Estimated Arrival
                              </Text>
                              <Text fontSize="xs" color="gray.400">
                                Live GPS tracking
                              </Text>
                            </VStack>
                          </HStack>
                          <VStack align="end" spacing={2}>
                            <Text
                              fontSize="2xl"
                              fontWeight="bold"
                              color="blue.400"
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
                            <Text fontSize="sm" color="gray.400">
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
                              variant="solid"
                              fontSize="sm"
                              px={3}
                              py={1}
                              borderRadius="full"
                            >
                              {(() => {
                                try {
                                  const eta = trackingData.eta as any;
                                  return eta?.isOnTime ? '✓ On Time' : '⚠ Delayed';
                                } catch {
                                  return '🚚 In Transit';
                                }
                              })()}
                            </Badge>
                          </VStack>
                        </HStack>
                      </Box>
                    </>
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Live Map */}
            {trackingData && (trackingData as any).pickupAddress && (trackingData as any).dropoffAddress && (
              <Card 
                bg="rgba(13,13,13,0.8)"
                backdropFilter="blur(10px)"
                border="1px solid"
                borderColor="rgba(255,255,255,0.1)"
                overflow="hidden"
                transition="all 0.3s"
                _hover={{
                  borderColor: 'neon.400',
                  shadow: '0 8px 30px rgba(0,255,157,0.15)',
                }}
              >
                <CardBody p={0}>
                  <Box height={450} position="relative" overflow="hidden">
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
                  <Box 
                    p={4} 
                    bg="rgba(0,0,0,0.5)"
                    borderTop="1px solid rgba(255,255,255,0.1)"
                  >
                    <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
                      <HStack spacing={4}>
                        <HStack spacing={2}>
                          <Box w={3} h={3} bg="neon.400" borderRadius="full" />
                          <Text fontSize="sm" color="gray.300">
                            Live driver
                          </Text>
                        </HStack>
                        <HStack spacing={2}>
                          <Box w={3} h={3} bg="green.400" borderRadius="full" />
                          <Text fontSize="sm" color="gray.300">
                            Pickup
                          </Text>
                        </HStack>
                        <HStack spacing={2}>
                          <Box w={3} h={3} bg="blue.400" borderRadius="full" />
                          <Text fontSize="sm" color="gray.300">
                            Delivery
                          </Text>
                        </HStack>
                      </HStack>
                      <HStack spacing={3}>
                        <Badge 
                          colorScheme={isConnected ? 'green' : 'gray'}
                          variant="solid"
                          px={3}
                          py={1}
                          borderRadius="full"
                        >
                          <HStack spacing={1}>
                            {isConnected ? <FiWifi /> : <FiWifiOff />}
                            <Text>{isConnected ? 'Live' : 'Offline'}</Text>
                          </HStack>
                        </Badge>
                        {trackingData.lastUpdated && (
                          <Text fontSize="xs" color="gray.400">
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
