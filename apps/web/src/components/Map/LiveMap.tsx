// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FiMapPin, FiTruck, FiClock, FiZoomIn, FiZoomOut, FiMaximize2 } from 'react-icons/fi';
import { Loader } from '@googlemaps/js-api-loader';

/// <reference types="@types/google.maps" />

interface Location {
  lat: number;
  lng: number;
  label: string;
}

interface DriverLocation extends Location {
  driverId: string;
  driverName: string;
  lastUpdate: string;
  status: string;
}

interface LiveMapProps {
  driverLocation?: Location;
  driverLocations?: DriverLocation[];
  pickupLocation: Location;
  dropoffLocation: Location;
  height?: number | string;
  showRoute?: boolean;
  showETA?: boolean;
  eta?: string;
}

const LiveMap: React.FC<LiveMapProps> = ({
  driverLocation,
  driverLocations = [],
  pickupLocation,
  dropoffLocation,
  height = 600,
  showRoute = true,
  showETA = true,
  eta,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
          throw new Error('Google Maps API key not found');
        }

        // Load Google Maps API
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry', 'drawing'],
        });

        // @ts-ignore - Loader types
        await loader.load();

        if (!mapRef.current) {
          throw new Error('Map container not found');
        }

        // Determine center point (use first valid location)
        let centerLat = 51.5074; // Default to London
        let centerLng = -0.1278;

        if (pickupLocation && pickupLocation.lat !== 0 && pickupLocation.lng !== 0) {
          centerLat = pickupLocation.lat;
          centerLng = pickupLocation.lng;
        } else if (driverLocations.length > 0 && driverLocations[0].lat !== 0) {
          centerLat = driverLocations[0].lat;
          centerLng = driverLocations[0].lng;
        } else if (driverLocation && driverLocation.lat !== 0) {
          centerLat = driverLocation.lat;
          centerLng = driverLocation.lng;
        }

        // Create map instance
        // @ts-ignore - Google Maps API
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'off' }],
            },
          ],
        });

        setMap(mapInstance);
        setIsLoading(false);

        console.log('✅ Google Maps initialized successfully');
      } catch (err) {
        console.error('❌ Error initializing map:', err);
        setError(err instanceof Error ? err.message : 'Failed to load map');
        setIsLoading(false);
      }
    };

    initializeMap();

    // Cleanup
    return () => {
      markers.forEach(marker => marker.setMap(null));
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!map || isLoading) return;

    // Clear existing markers
    markers.forEach((marker: any) => marker.setMap(null));
    const newMarkers: any[] = [];

    // @ts-ignore - Google Maps API
    const bounds = new google.maps.LatLngBounds();

    // Add pickup marker (Green)
    if (pickupLocation && pickupLocation.lat !== 0 && pickupLocation.lng !== 0) {
      // @ts-ignore - Google Maps API
      const pickupMarker = new google.maps.Marker({
        position: { lat: pickupLocation.lat, lng: pickupLocation.lng },
        map: map,
        title: pickupLocation.label || 'Pickup Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#10B981',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
        label: {
          text: 'P',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
        },
      });

      const pickupInfo = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #10B981;">
              📍 Pickup Location
            </h3>
            <p style="margin: 0; font-size: 12px; color: #6B7280;">
              ${pickupLocation.label}
            </p>
          </div>
        `,
      });

      pickupMarker.addListener('click', () => {
        pickupInfo.open(map, pickupMarker);
      });

      newMarkers.push(pickupMarker);
      bounds.extend({ lat: pickupLocation.lat, lng: pickupLocation.lng });
    }

    // Add dropoff marker (Red)
    if (dropoffLocation && dropoffLocation.lat !== 0 && dropoffLocation.lng !== 0) {
      const dropoffMarker = new google.maps.Marker({
        position: { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
        map: map,
        title: dropoffLocation.label || 'Dropoff Location',
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#EF4444',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 3,
        },
        label: {
          text: 'D',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold',
        },
      });

      const dropoffInfo = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #EF4444;">
              🎯 Delivery Location
            </h3>
            <p style="margin: 0; font-size: 12px; color: #6B7280;">
              ${dropoffLocation.label}
            </p>
          </div>
        `,
      });

      dropoffMarker.addListener('click', () => {
        dropoffInfo.open(map, dropoffMarker);
      });

      newMarkers.push(dropoffMarker);
      bounds.extend({ lat: dropoffLocation.lat, lng: dropoffLocation.lng });
    }

    // Add driver markers (Blue with truck icon)
    if (driverLocations.length > 0) {
      driverLocations.forEach((driver) => {
        if (driver.lat === 0 || driver.lng === 0) return;

        const statusColors: { [key: string]: string } = {
          online: '#3B82F6',
          on_route: '#F59E0B',
          busy: '#8B5CF6',
          offline: '#9CA3AF',
        };

        const statusColor = statusColors[driver.status] || '#3B82F6';

        const driverMarker = new google.maps.Marker({
          position: { lat: driver.lat, lng: driver.lng },
          map: map,
          title: driver.driverName || 'Driver',
          icon: {
            path: 'M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z',
            fillColor: statusColor,
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 0.8,
            anchor: new google.maps.Point(11.5, 23),
          },
          animation: google.maps.Animation.DROP,
        });

        const lastUpdateTime = new Date(driver.lastUpdate).toLocaleTimeString();

        const driverInfo = new google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: ${statusColor};">
                🚚 ${driver.driverName}
              </h3>
              <div style="font-size: 12px; color: #6B7280;">
                <p style="margin: 4px 0;">
                  <strong>Status:</strong> 
                  <span style="color: ${statusColor}; text-transform: capitalize;">
                    ${driver.status.replace('_', ' ')}
                  </span>
                </p>
                <p style="margin: 4px 0;">
                  <strong>Last Update:</strong> ${lastUpdateTime}
                </p>
                <p style="margin: 4px 0; font-size: 10px; color: #9CA3AF;">
                  📍 ${driver.lat.toFixed(6)}, ${driver.lng.toFixed(6)}
                </p>
              </div>
            </div>
          `,
        });

        driverMarker.addListener('click', () => {
          driverInfo.open(map, driverMarker);
        });

        newMarkers.push(driverMarker);
        bounds.extend({ lat: driver.lat, lng: driver.lng });
      });
    } else if (driverLocation && driverLocation.lat !== 0 && driverLocation.lng !== 0) {
      // Single driver location
      const driverMarker = new google.maps.Marker({
        position: { lat: driverLocation.lat, lng: driverLocation.lng },
        map: map,
        title: driverLocation.label || 'Driver',
        icon: {
          path: 'M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z',
          fillColor: '#3B82F6',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 0.8,
          anchor: new google.maps.Point(11.5, 23),
        },
        animation: google.maps.Animation.BOUNCE,
      });

      newMarkers.push(driverMarker);
      bounds.extend({ lat: driverLocation.lat, lng: driverLocation.lng });
    }

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
      
      // Add some padding
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 15) map.setZoom(15);
        google.maps.event.removeListener(listener);
      });
    }

    // Draw route if enabled
    if (showRoute && pickupLocation.lat !== 0 && dropoffLocation.lat !== 0) {
      drawRoute();
    }
  }, [map, pickupLocation, dropoffLocation, driverLocation, driverLocations, showRoute]);

  // Draw route between pickup and dropoff
  const drawRoute = useCallback(() => {
    if (!map || !showRoute) return;

    // Clear existing route
    if (directionsRenderer) {
      directionsRenderer.setMap(null);
    }

    const directionsService = new google.maps.DirectionsService();
    const renderer = new google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true, // We're using custom markers
      polylineOptions: {
        strokeColor: '#3B82F6',
        strokeWeight: 4,
        strokeOpacity: 0.7,
      },
    });

    const request: google.maps.DirectionsRequest = {
      origin: { lat: pickupLocation.lat, lng: pickupLocation.lng },
      destination: { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK' && result) {
        renderer.setDirections(result);
        console.log('✅ Route rendered successfully');
      } else {
        console.warn('⚠️ Could not render route:', status);
      }
    });

    setDirectionsRenderer(renderer);
  }, [map, pickupLocation, dropoffLocation, showRoute]);

  // Zoom controls
  const handleZoomIn = () => {
    if (map) {
      map.setZoom((map.getZoom() || 12) + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom((map.getZoom() || 12) - 1);
    }
  };

  const handleRecenter = () => {
    if (!map || markers.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    markers.forEach(marker => {
      const position = marker.getPosition();
      if (position) bounds.extend(position);
    });

    map.fitBounds(bounds);
  };

  if (isLoading) {
    return (
      <Box
        h={height}
        bg={bgColor}
        border={`1px solid ${borderColor}`}
        borderRadius="lg"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text color="gray.600" fontWeight="medium">Loading Google Maps...</Text>
          <Text fontSize="sm" color="gray.500">Initializing real-time tracking</Text>
        </VStack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        h={height}
        bg={bgColor}
        border={`1px solid ${borderColor}`}
        borderRadius="lg"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={6}
      >
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <VStack align="start" spacing={2}>
            <Text fontWeight="bold">Failed to Load Map</Text>
            <Text fontSize="sm">{error}</Text>
            <Text fontSize="xs" color="gray.600">
              Please check your Google Maps API key configuration
            </Text>
          </VStack>
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      position="relative"
      h={height}
      bg={bgColor}
      border={`1px solid ${borderColor}`}
      borderRadius="lg"
      overflow="hidden"
    >
      {/* Map Container */}
      <Box ref={mapRef} w="full" h="full" />

      {/* Live Badge Overlay */}
      <Box
        position="absolute"
        top={4}
        right={4}
        bg="white"
        borderRadius="md"
        p={2}
        boxShadow="lg"
        zIndex={1000}
      >
        <VStack spacing={1}>
          <Badge colorScheme="green" fontSize="xs" px={2}>
            🟢 LIVE
          </Badge>
          <Text fontSize="xs" color="gray.600" fontWeight="medium">
            Real-time
          </Text>
        </VStack>
      </Box>

      {/* ETA Display */}
      {showETA && eta && (
        <Box
          position="absolute"
          top={4}
          left={4}
          bg="blue.500"
          color="white"
          borderRadius="md"
          px={4}
          py={2}
          boxShadow="lg"
          zIndex={1000}
        >
          <HStack spacing={2}>
            <FiClock />
            <Text fontSize="sm" fontWeight="bold">
              ETA: {eta}
            </Text>
          </HStack>
        </Box>
      )}

      {/* Custom Zoom Controls */}
      <VStack
        position="absolute"
        bottom={4}
        right={4}
        spacing={2}
        zIndex={1000}
      >
        <Tooltip label="Zoom In" placement="left">
          <IconButton
            aria-label="Zoom in"
            icon={<FiZoomIn />}
            size="sm"
            onClick={handleZoomIn}
            bg="white"
            boxShadow="md"
            _hover={{ bg: 'gray.100' }}
          />
        </Tooltip>
        <Tooltip label="Zoom Out" placement="left">
          <IconButton
            aria-label="Zoom out"
            icon={<FiZoomOut />}
            size="sm"
            onClick={handleZoomOut}
            bg="white"
            boxShadow="md"
            _hover={{ bg: 'gray.100' }}
          />
        </Tooltip>
        <Tooltip label="Recenter Map" placement="left">
          <IconButton
            aria-label="Recenter"
            icon={<FiMaximize2 />}
            size="sm"
            onClick={handleRecenter}
            bg="white"
            boxShadow="md"
            _hover={{ bg: 'gray.100' }}
          />
        </Tooltip>
      </VStack>

      {/* Driver Count Badge */}
      {driverLocations.length > 0 && (
        <Box
          position="absolute"
          bottom={4}
          left={4}
          bg="white"
          borderRadius="md"
          px={3}
          py={2}
          boxShadow="lg"
          zIndex={1000}
        >
          <HStack spacing={2}>
            <FiTruck color="#3B82F6" />
            <Text fontSize="sm" fontWeight="bold" color="gray.700">
              {driverLocations.length} Driver{driverLocations.length !== 1 ? 's' : ''} Online
            </Text>
          </HStack>
        </Box>
      )}
    </Box>
  );
};

export default LiveMap;
