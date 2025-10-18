'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Pusher from 'pusher-js';

// Extend Window interface for Mapbox
declare global {
  interface Window {
    mapboxgl: any;
  }
}
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaTruck, FaRoute, FaPhone, FaSync } from 'react-icons/fa';

// Type definitions
interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  postcode?: string;
}

interface DriverLocation extends Location {
  timestamp?: string;
}

interface StopInfo {
  id: string;
  sequence: number;
  customerName: string;
  customerPhone: string;
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
  items: Array<{ name: string; quantity: number; }>;
  status: 'pending' | 'in_progress' | 'completed';
  progress: number;
  lastEvent?: any;
}

interface TrackingData {
  id: string;
  reference: string;
  status: string;
  pickupAddress: {
    label: string;
    coordinates: { lat: number; lng: number; };
  };
  dropoffAddress: {
    label: string;
    coordinates: { lat: number; lng: number; };
  };
  driver?: {
    name: string;
    email?: string;
    phone?: string;
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
  }>;
  trackingChannel: string;
  lastUpdated: string;
  booking?: {
    reference: string;
  };
  tracking?: {
    currentDestination?: {
      label: string;
    };
    estimatedArrival?: string;
  };
  timeline?: Array<{
    status: string;
    title: string;
    timestamp?: string;
    completed: boolean;
  }>;
}

interface LiveTrackingMapProps {
  bookingReference: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onTrackingUpdate?: (data: TrackingData) => void;
}

export default function LiveTrackingMap({
  bookingReference,
  autoRefresh = true,
  refreshInterval = 10000, // 10 seconds
  onTrackingUpdate
}: LiveTrackingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Load Mapbox GL JS dynamically
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.mapboxgl) {
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js';
      script.onload = () => setMapboxLoaded(true);
      document.head.appendChild(script);
    } else if (window.mapboxgl) {
      setMapboxLoaded(true);
    }
  }, []);

  // Fetch tracking data
  const fetchTrackingData = useCallback(async () => {
    try {
      setError(null);
      console.log('📡 Fetching tracking data for:', bookingReference);
      const response = await fetch(`/api/track/${bookingReference}?tracking=true&realtime=true`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tracking data');
      }

      const result = await response.json();
      const data = result.data as TrackingData;
      
      setTrackingData(data);
      setLastUpdate(new Date());
      
      if (onTrackingUpdate) {
        onTrackingUpdate(data);
      }

    } catch (err) {
      console.error('Tracking fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  }, [bookingReference, onTrackingUpdate]);

  // Initialize map
  const initializeMap = useCallback(async () => {
    if (!mapboxLoaded || !mapContainer.current || !trackingData || mapRef.current) return;

    try {
      const mapboxgl = window.mapboxgl;
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYWhtYWRhbHdha2FpIiwiYSI6ImNtZGNsZ3RsZDEzdGsya3F0ODFxeGRzbXoifQ.jfgGW0KNFTwATOShRDtQsg';

      // Calculate bounds to fit all locations
      const bounds = new mapboxgl.LngLatBounds();

      // Add pickup and dropoff to bounds
      bounds.extend([trackingData.pickupAddress.coordinates.lng, trackingData.pickupAddress.coordinates.lat]);
      bounds.extend([trackingData.dropoffAddress.coordinates.lng, trackingData.dropoffAddress.coordinates.lat]);

      // Add driver location if available
      if (trackingData.currentLocation) {
        bounds.extend([
          trackingData.currentLocation.lng,
          trackingData.currentLocation.lat
        ]);
      }

      // Initialize map
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/navigation-night-v1',
        bounds: bounds,
        fitBoundsOptions: {
          padding: 50,
          maxZoom: 16
        }
      });

      mapRef.current.on('load', () => {
        addMarkersAndRoute();
      });

    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
    }
  }, [mapboxLoaded, trackingData]);

  // Add markers and route to map
  const addMarkersAndRoute = useCallback(() => {
    if (!mapRef.current || !trackingData) return;

    const mapboxgl = window.mapboxgl;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.custom-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add pickup marker
    const pickupMarker = document.createElement('div');
    pickupMarker.className = 'custom-marker';
    pickupMarker.innerHTML = '📍';
    pickupMarker.style.fontSize = '24px';

    new mapboxgl.Marker(pickupMarker)
      .setLngLat([trackingData.pickupAddress.coordinates.lng, trackingData.pickupAddress.coordinates.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div>
          <h4>Pickup Location</h4>
          <p>${trackingData.pickupAddress.label}</p>
        </div>
      `))
      .addTo(mapRef.current);

    // Add dropoff marker
    const dropoffMarker = document.createElement('div');
    dropoffMarker.className = 'custom-marker';
    dropoffMarker.innerHTML = '🏁';
    dropoffMarker.style.fontSize = '24px';

    new mapboxgl.Marker(dropoffMarker)
      .setLngLat([trackingData.dropoffAddress.coordinates.lng, trackingData.dropoffAddress.coordinates.lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div>
          <h4>Delivery Location</h4>
          <p>${trackingData.dropoffAddress.label}</p>
        </div>
      `))
      .addTo(mapRef.current);

    // Add driver marker if location is available
    if (trackingData.currentLocation) {
      const driverMarker = document.createElement('div');
      driverMarker.className = 'custom-marker driver-marker';
      driverMarker.innerHTML = '🚚';
      driverMarker.style.fontSize = '28px';
      driverMarker.style.animation = 'pulse 2s infinite';

      new mapboxgl.Marker(driverMarker)
        .setLngLat([
          trackingData.currentLocation.lng,
          trackingData.currentLocation.lat
        ])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div>
            <h4>Driver: ${trackingData.driver?.name || 'Driver'}</h4>
            <p>Last update: ${trackingData.currentLocation.timestamp ?
              new Date(trackingData.currentLocation.timestamp).toLocaleTimeString() :
              'Unknown'
            }</p>
          </div>
        `))
        .addTo(mapRef.current);
    }

    // Add route line if we have driver location
    if (trackingData.currentLocation) {
      // Simple straight line route from driver to dropoff (in production, you'd use Mapbox Directions API)
      const routeCoordinates = [
        [trackingData.currentLocation.lng, trackingData.currentLocation.lat],
        [trackingData.dropoffAddress.coordinates.lng, trackingData.dropoffAddress.coordinates.lat]
      ];

      // Add route line
      if (mapRef.current.getSource('route')) {
        mapRef.current.removeLayer('route-line');
        mapRef.current.removeSource('route');
      }

      mapRef.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates
          }
        }
      });

      mapRef.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00ff88',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    }
  }, [trackingData]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchTrackingData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchTrackingData]);

  // Initial data fetch
  useEffect(() => {
    fetchTrackingData();
  }, [fetchTrackingData]);

  // Initialize Pusher for real-time location updates
  useEffect(() => {
    if (!trackingData?.reference) return;

    const initializePusher = () => {
      try {
        console.log('🔌 Initializing Pusher for real-time tracking:', bookingReference);

        // Initialize Pusher client
        pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
          forceTLS: true,
        });

        // Subscribe to tracking channel
        const channelName = `tracking-${bookingReference}`;
        console.log('📡 Subscribing to channel:', channelName);
        
        channelRef.current = pusherRef.current.subscribe(channelName);

        // Connection status events
        channelRef.current.bind('pusher:subscription_succeeded', () => {
          console.log('✅ Successfully subscribed to tracking channel');
          setIsLiveConnected(true);
        });

        channelRef.current.bind('pusher:subscription_error', (error: any) => {
          console.error('❌ Subscription error:', error);
          setIsLiveConnected(false);
        });

        // Listen for location updates
        channelRef.current.bind('location-update', (data: any) => {
          console.log('📍 Real-time location update received:', data);

          // Update tracking data with new location
          setTrackingData(prev => {
            if (!prev) return prev;

            return {
              ...prev,
              currentLocation: {
                lat: data.lat || data.latitude,
                lng: data.lng || data.longitude,
                timestamp: data.timestamp || new Date().toISOString(),
              },
              eta: data.eta || prev.eta,
              routeProgress: data.routeProgress || prev.routeProgress,
              lastUpdated: new Date().toISOString(),
            };
          });

          setLastUpdate(new Date());

          // Update map markers if map is initialized
          if (mapRef.current && trackingData) {
            addMarkersAndRoute();
          }
        });

        // Listen for status updates
        channelRef.current.bind('status-update', (data: any) => {
          console.log('📊 Status update received:', data);

          setTrackingData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              status: data.status,
              lastUpdated: new Date().toISOString(),
            };
          });
        });

        // Listen for ETA updates
        channelRef.current.bind('eta-update', (data: any) => {
          console.log('⏱️ ETA update received:', data);

          setTrackingData(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              eta: data.eta,
              lastUpdated: new Date().toISOString(),
            };
          });
        });

        console.log('✅ Pusher initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Pusher:', error);
      }
    };

    initializePusher();

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up Pusher connection');
      
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current.unsubscribe();
      }
      
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, [trackingData?.reference, bookingReference, addMarkersAndRoute]);

  // Initialize map when data and mapbox are ready
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Update map when tracking data changes
  useEffect(() => {
    if (mapRef.current && trackingData) {
      addMarkersAndRoute();
    }
  }, [trackingData, addMarkersAndRoute]);

  if (loading) {
    return (
      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <VStack spacing={4} py={8}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading live tracking...</Text>
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
            <Button ml={3} size="sm" onClick={fetchTrackingData}>
              Retry
            </Button>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  if (!trackingData) {
    return (
      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody>
          <Text>No tracking data available</Text>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {/* Tracking Status Header */}
      <Card bg={cardBg} borderColor={borderColor}>
        <CardHeader pb={2}>
          <HStack justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Heading size="md">Live Tracking</Heading>
              <Text fontSize="sm" color="gray.600">
                Order: {trackingData.booking?.reference || trackingData.reference}
              </Text>
            </VStack>
            <VStack align="end" spacing={1}>
              <HStack spacing={2}>
                {isLiveConnected && (
                  <Badge
                    colorScheme="red"
                    size="sm"
                    px={2}
                    py={1}
                    display="flex"
                    alignItems="center"
                    gap={1}
                  >
                    <Box
                      as="span"
                      display="inline-block"
                      w={2}
                      h={2}
                      borderRadius="full"
                      bg="red.500"
                      animation="pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                    />
                    LIVE
                  </Badge>
                )}
                <Badge
                  colorScheme={trackingData.driver?.isOnline ? 'green' : 'gray'}
                  size="lg"
                  px={3}
                  py={1}
                >
                  {trackingData.driver ? 
                    (trackingData.driver.isOnline ? '🟢 Driver Online' : '⚫ Driver Offline') : 
                    '⏳ Awaiting Driver'
                  }
                </Badge>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                Last update: {lastUpdate.toLocaleTimeString()}
              </Text>
            </VStack>
          </HStack>
        </CardHeader>
      </Card>

      {/* Driver Info */}
      {trackingData.driver && (
        <Card bg={cardBg} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={3} align="stretch">
              <HStack justify="space-between">
                <HStack>
                  <Icon as={FaTruck} color="blue.500" boxSize={5} />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="semibold">{trackingData.driver.name}</Text>
                    <Text fontSize="sm" color="gray.600">Your Driver</Text>
                  </VStack>
                </HStack>
                {trackingData.driver.phone && (
                  <Button
                    leftIcon={<FaPhone />}
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => window.open(`tel:${trackingData.driver?.phone}`, '_self')}
                  >
                    Call
                  </Button>
                )}
              </HStack>
              
              {trackingData.tracking?.currentDestination && (
                <HStack>
                  <Icon as={FaRoute} color="green.500" boxSize={4} />
                  <Text fontSize="sm">{trackingData.tracking.currentDestination.label}</Text>
                  {trackingData.tracking?.estimatedArrival && (
                    <Badge colorScheme="green" size="sm">
                      ETA: {trackingData.tracking.estimatedArrival}
                    </Badge>
                  )}
                </HStack>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Live Map */}
      <Card bg={cardBg} borderColor={borderColor}>
        <CardBody p={0}>
          <Box
            ref={mapContainer}
            width="100%"
            height="400px"
            borderRadius="lg"
            overflow="hidden"
            position="relative"
          />
          <Box p={4}>
            <HStack justify="space-between" align="center">
              <HStack spacing={2}>
                {isLiveConnected && (
                  <Badge colorScheme="green" size="sm">
                    ⚡ Real-time Updates Active
                  </Badge>
                )}
                <Text fontSize="sm" color="gray.600">
                  🚚 Live driver location • 📍 Pickup • 🏁 Delivery
                </Text>
              </HStack>
              <Button
                leftIcon={<FaSync />}
                size="sm"
                variant="ghost"
                onClick={fetchTrackingData}
                isLoading={loading}
              >
                Refresh
              </Button>
            </HStack>
          </Box>
        </CardBody>
      </Card>

      {/* Tracking Timeline */}
      <Card bg={cardBg} borderColor={borderColor}>
        <CardHeader>
          <Heading size="sm">Delivery Progress</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={3} align="stretch">
            {trackingData.timeline?.map((item, index) => (
              <HStack key={item.status} spacing={3}>
                <Box
                  w={4}
                  h={4}
                  borderRadius="full"
                  bg={item.completed ? 'green.500' : 'gray.300'}
                  flexShrink={0}
                />
                <VStack align="start" spacing={0} flex={1}>
                  <Text 
                    fontWeight={item.completed ? 'semibold' : 'normal'}
                    color={item.completed ? 'green.600' : 'gray.600'}
                  >
                    {item.title}
                  </Text>
                  {item.timestamp && (
                    <Text fontSize="xs" color="gray.500">
                      {new Date(item.timestamp).toLocaleString()}
                    </Text>
                  )}
                </VStack>
              </HStack>
            ))}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}

// Add pulse animation styles
const styles = `
  @keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}