'use client';

import React, { useState, useEffect } from 'react';
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Box,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Button,
  Alert,
  AlertIcon,
  AlertDescription,
  Spinner,
  Icon,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaArrowLeft, FaMapMarkerAlt, FaCalendar, FaInfoCircle } from 'react-icons/fa';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const LiveTrackingMap = dynamic(
  () => import('@/components/customer/LiveTrackingMap'),
  { 
    ssr: false,
    loading: () => (
      <Card>
        <CardBody>
          <VStack spacing={4} py={8}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading map...</Text>
          </VStack>
        </CardBody>
      </Card>
    )
  }
);

interface TrackingPageData {
  id: string;
  reference: string;
  status: string;
  type: 'single-drop' | 'multi-drop';
  booking: {
    id: string;
    reference: string;
    status: string;
    scheduledAt: string;
  };
  pickupAddress: {
    label: string;
    postcode: string;
    coordinates: { lat: number; lng: number; };
  };
  dropoffAddress: {
    label: string;
    postcode: string;
    coordinates: { lat: number; lng: number; };
  };
  driver?: {
    name: string;
    email?: string;
    isOnline?: boolean;
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
  estimatedDuration?: number;
  lastEvent?: any;
  jobTimeline: Array<{
    step: string;
    label: string;
    timestamp: string;
    notes?: string;
  }>;
  trackingChannel: string;
  lastUpdated: string;
}

export default function CustomerTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  
  const [pageData, setPageData] = useState<TrackingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const bookingReference = params?.reference as string;

  // Color mode values
  const bg = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  // Fetch initial tracking data for page info
  const fetchPageData = async () => {
    try {
      const response = await fetch(`/api/track/${bookingReference}?tracking=true`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Booking not found. Please check your reference number.');
        }
        throw new Error('Failed to load tracking information');
      }

      const result = await response.json();
      setPageData(result.data);
      
    } catch (err) {
      console.error('Page data fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tracking information');
    } finally {
      setLoading(false);
    }
  };

  // Handle tracking updates from the live map
  const handleTrackingUpdate = (data: any) => {
    setPageData(data);
    setIsRefreshing(false);
  };

  // Refresh tracking data
  const refreshTracking = () => {
    setIsRefreshing(true);
    fetchPageData();
  };

  useEffect(() => {
    if (bookingReference) {
      fetchPageData();
    }
  }, [bookingReference]);

  if (loading) {
    return (
      <Container maxW="4xl" py={8}>
        <VStack spacing={6}>
          <VStack spacing={4} py={12}>
            <Spinner size="xl" color="blue.500" />
            <Text fontSize="lg">Loading tracking information...</Text>
          </VStack>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="4xl" py={8}>
        <VStack spacing={6}>
          <Alert status="error" borderRadius="lg" flexDirection="column" p={6}>
            <AlertIcon boxSize="40px" mr={0} />
            <Text fontSize="lg" fontWeight="semibold" mt={2} textAlign="center">
              {error}
            </Text>
            <VStack spacing={3} mt={4}>
              <Button colorScheme="blue" onClick={() => router.push('/')}>
                Go Home
              </Button>
              <Button variant="ghost" onClick={refreshTracking}>
                Try Again
              </Button>
            </VStack>
          </Alert>
        </VStack>
      </Container>
    );
  }

  if (!pageData) {
    return (
      <Container maxW="4xl" py={8}>
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <AlertDescription>No tracking data available</AlertDescription>
        </Alert>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg={bg}>
      <Container maxW="4xl" py={6}>
        <VStack spacing={6} align="stretch">
          {/* Header */}
          <Card bg={cardBg}>
            <CardHeader>
              <VStack spacing={4} align="stretch">
                {/* Navigation */}
                <HStack>
                  <Button
                    leftIcon={<FaArrowLeft />}
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                  >
                    Back
                  </Button>
                </HStack>

                {/* Title and Booking Info */}
                <VStack align="start" spacing={2}>
                  <Heading size="lg">Live Order Tracking</Heading>
                  <HStack spacing={4} flexWrap="wrap">
                    <Badge 
                      colorScheme="blue" 
                      size="lg" 
                      px={3} 
                      py={1} 
                      borderRadius="full"
                      fontFamily="mono"
                    >
                      {pageData.booking.reference}
                    </Badge>
                    <Badge
                      colorScheme={getStatusColor(pageData.booking.status)}
                      size="lg"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      {formatStatus(pageData.booking.status)}
                    </Badge>
                  </HStack>
                </VStack>

                {/* Scheduled Date */}
                <HStack spacing={2} color="gray.600">
                  <Icon as={FaCalendar} />
                  <Text fontSize="sm">
                    Scheduled: {new Date(pageData.booking.scheduledAt).toLocaleDateString('en-GB', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </HStack>
              </VStack>
            </CardHeader>
          </Card>

          {/* Route Overview */}
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md">Route Overview</Heading>
                <HStack spacing={4} align="start">
                  <VStack spacing={4} flex={1}>
                    {/* Pickup */}
                    <HStack spacing={3} align="start" w="full">
                      <Icon as={FaMapMarkerAlt} color="green.500" mt={1} />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="semibold" color="green.600">Pickup Location</Text>
                        <Text fontSize="sm">{pageData.pickupAddress.label}</Text>
                        {pageData.pickupAddress.postcode && (
                          <Text fontSize="xs" color="gray.500">
                            {pageData.pickupAddress.postcode}
                          </Text>
                        )}
                      </VStack>
                    </HStack>

                    {/* Arrow/Divider */}
                    <Box h={8} display="flex" alignItems="center" justifyContent="center">
                      <Text fontSize="2xl">↓</Text>
                    </Box>

                    {/* Dropoff */}
                    <HStack spacing={3} align="start" w="full">
                      <Icon as={FaMapMarkerAlt} color="red.500" mt={1} />
                      <VStack align="start" spacing={1} flex={1}>
                        <Text fontWeight="semibold" color="red.600">Delivery Location</Text>
                        <Text fontSize="sm">{pageData.dropoffAddress.label}</Text>
                        {pageData.dropoffAddress.postcode && (
                          <Text fontSize="xs" color="gray.500">
                            {pageData.dropoffAddress.postcode}
                          </Text>
                        )}
                      </VStack>
                    </HStack>
                  </VStack>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Driver Status */}
          {pageData.driver && (
            <Card bg={cardBg}>
              <CardBody>
                <HStack justify="space-between" align="center">
                  <HStack spacing={3}>
                    <Icon as={FaInfoCircle} color="blue.500" />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="semibold">Driver: {pageData.driver.name}</Text>
                      <Text fontSize="sm" color="gray.600">Assigned to your order</Text>
                    </VStack>
                  </HStack>
                  <Badge
                    colorScheme={pageData.driver.isOnline ? 'green' : 'gray'}
                    size="lg"
                    px={3}
                    py={1}
                  >
                    {pageData.driver.isOnline ? '🟢 Online' : '⚫ Offline'}
                  </Badge>
                </HStack>
              </CardBody>
            </Card>
          )}

          {/* Live Tracking Map */}
          <LiveTrackingMap
            bookingReference={bookingReference}
            autoRefresh={true}
            refreshInterval={10000} // 10 seconds
            onTrackingUpdate={handleTrackingUpdate}
          />

          {/* Help Text */}
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={3} align="start">
                <Heading size="sm">About Live Tracking</Heading>
                <Text fontSize="sm" color="gray.600">
                  • Your driver's location updates automatically every 10 seconds<br/>
                  • The map shows pickup location (📍), delivery location (🏁), and driver position (🚚)<br/>
                  • Estimated arrival times are calculated based on current location and traffic<br/>
                  • You can call your driver directly when they are en route<br/>
                  • Tracking is available until your order is delivered
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}

// Helper functions
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
    case 'assigned':
      return 'blue';
    case 'in_progress':
    case 'en_route':
      return 'yellow';
    case 'completed':
    case 'delivered':
      return 'green';
    case 'cancelled':
      return 'red';
    default:
      return 'gray';
  }
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}