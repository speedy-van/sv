// @ts-nocheck
'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import { FiTruck, FiClock, FiZoomIn, FiZoomOut, FiMaximize2 } from 'react-icons/fi';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

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

const MapboxLiveMap: React.FC<LiveMapProps> = ({
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
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !mapRef.current) {
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      setError('Map configuration missing');
      setIsLoading(false);
      return;
    }

    let mapInstance: mapboxgl.Map | null = null;

    try {
      mapboxgl.accessToken = token;

      let center: [number, number] = [-0.1278, 51.5074];
      if (pickupLocation?.lat && pickupLocation?.lng) {
        center = [pickupLocation.lng, pickupLocation.lat];
      } else if (driverLocations.length > 0) {
        center = [driverLocations[0].lng, driverLocations[0].lat];
      } else if (driverLocation?.lat && driverLocation?.lng) {
        center = [driverLocation.lng, driverLocation.lat];
      }

      mapInstance = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center,
        zoom: 11,
      });

      mapInstance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
      
      mapInstance.on('load', () => {
        if (mapInstance) {
          setMap(mapInstance);
          setIsLoading(false);
        }
      });

      mapInstance.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Failed to load map');
        setIsLoading(false);
      });

    } catch (err) {
      console.error('❌ Error initializing Mapbox:', err);
      setError(err instanceof Error ? err.message : 'Failed to load map');
      setIsLoading(false);
    }

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      if (mapInstance) {
        mapInstance.remove();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  useEffect(() => {
    if (!map || isLoading) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const bounds = new mapboxgl.LngLatBounds();

    const addMarker = (lng: number, lat: number, color: string, label?: string) => {
      const el = document.createElement('div');
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.background = color;
      el.style.boxShadow = '0 0 0 3px #ffffff, 0 1px 6px rgba(0,0,0,0.3)';

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);

      if (label) {
        const popup = new mapboxgl.Popup({ offset: 12 }).setHTML(
          `<div style="font-weight:600">${label}</div><div style="font-size:12px;color:#6b7280">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>`
        );
        marker.setPopup(popup);
      }

      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
    };

    if (pickupLocation?.lat && pickupLocation?.lng) {
      addMarker(pickupLocation.lng, pickupLocation.lat, '#10B981', pickupLocation.label || 'Pickup');
    }

    if (dropoffLocation?.lat && dropoffLocation?.lng) {
      addMarker(dropoffLocation.lng, dropoffLocation.lat, '#EF4444', dropoffLocation.label || 'Dropoff');
    }

    if (driverLocations.length > 0) {
      const statusColors: { [key: string]: string } = {
        online: '#3B82F6',
        on_route: '#F59E0B',
        busy: '#8B5CF6',
        offline: '#9CA3AF',
      };
      driverLocations.forEach(d => {
        const c = statusColors[d.status] || '#3B82F6';
        addMarker(d.lng, d.lat, c, d.driverName || 'Driver');
      });
    } else if (driverLocation?.lat && driverLocation?.lng) {
      addMarker(driverLocation.lng, driverLocation.lat, '#3B82F6', driverLocation.label || 'Driver');
    }

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 40, maxZoom: 15, duration: 600 });
    }

    if (showRoute && pickupLocation?.lat && dropoffLocation?.lat) {
      const routeId = 'sv-route-line';
      if (map.getLayer(routeId)) map.removeLayer(routeId);
      if (map.getSource(routeId)) map.removeSource(routeId);

      map.addSource(routeId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [pickupLocation.lng, pickupLocation.lat],
              [dropoffLocation.lng, dropoffLocation.lat],
            ],
          },
          properties: {},
        },
      });

      map.addLayer({
        id: routeId,
        type: 'line',
        source: routeId,
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#3B82F6', 'line-width': 4, 'line-opacity': 0.7 },
      });
    }
  }, [map, isLoading, pickupLocation, dropoffLocation, driverLocation, driverLocations, showRoute]);

  const handleZoomIn = () => map && map.zoomTo((map.getZoom() || 11) + 1, { duration: 200 });
  const handleZoomOut = () => map && map.zoomTo((map.getZoom() || 11) - 1, { duration: 200 });
  const handleRecenter = () => {
    if (!map || markersRef.current.length === 0) return;
    const bounds = new mapboxgl.LngLatBounds();
    markersRef.current.forEach(marker => bounds.extend(marker.getLngLat().toArray() as [number, number]));
    map.fitBounds(bounds, { padding: 40, maxZoom: 15, duration: 400 });
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
          <Text color="gray.600" fontWeight="medium">Loading Mapbox...</Text>
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
              Please check your Mapbox API key configuration
            </Text>
          </VStack>
        </Alert>
      </Box>
    );
  }

  return (
    <Box position="relative" h={height} bg={bgColor} border={`1px solid ${borderColor}`} borderRadius="lg" overflow="hidden">
      <Box ref={mapRef} w="full" h="full" />

      <Box position="absolute" top={4} right={4} bg="white" borderRadius="md" p={2} boxShadow="lg" zIndex={1000}>
        <VStack spacing={1}>
          <Badge colorScheme="green" fontSize="xs" px={2}>🟢 LIVE</Badge>
          <Text fontSize="xs" color="gray.600" fontWeight="medium">Real-time</Text>
        </VStack>
      </Box>

      {showETA && eta && (
        <Box position="absolute" top={4} left={4} bg="blue.500" color="white" borderRadius="md" px={4} py={2} boxShadow="lg" zIndex={1000}>
          <HStack spacing={2}>
            <FiClock />
            <Text fontSize="sm" fontWeight="bold">ETA: {eta}</Text>
          </HStack>
        </Box>
      )}

      <VStack position="absolute" bottom={4} right={4} spacing={2} zIndex={1000}>
        <Tooltip label="Zoom In" placement="left">
          <IconButton aria-label="Zoom in" icon={<FiZoomIn />} size="sm" onClick={handleZoomIn} bg="white" boxShadow="md" _hover={{ bg: 'gray.100' }} />
        </Tooltip>
        <Tooltip label="Zoom Out" placement="left">
          <IconButton aria-label="Zoom out" icon={<FiZoomOut />} size="sm" onClick={handleZoomOut} bg="white" boxShadow="md" _hover={{ bg: 'gray.100' }} />
        </Tooltip>
        <Tooltip label="Recenter Map" placement="left">
          <IconButton aria-label="Recenter" icon={<FiMaximize2 />} size="sm" onClick={handleRecenter} bg="white" boxShadow="md" _hover={{ bg: 'gray.100' }} />
        </Tooltip>
      </VStack>

      {driverLocations.length > 0 && (
        <Box position="absolute" bottom={4} left={4} bg="white" borderRadius="md" px={3} py={2} boxShadow="lg" zIndex={1000}>
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

export default MapboxLiveMap;


