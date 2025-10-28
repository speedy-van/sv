/**
 * Map Preview Component
 * Displays address location with Mapbox integration
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Text,
  Alert,
  AlertIcon,
  Spinner,
  Flex,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';

import type { MapPreviewProps, RoutePreview } from '@/types/dual-provider-address';

// Mapbox types
declare global {
  interface Window {
    mapboxgl: any;
  }
}

export const MapPreview: React.FC<MapPreviewProps> = ({
  coordinates,
  address,
  zoom = 15,
  marker = true,
  style = 'streets',
  className,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    // Load Mapbox GL JS if not already loaded
    if (!window.mapboxgl && !document.querySelector('script[src*="mapbox-gl"]')) {
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => initializeMap();
      script.onerror = () => setMapError('Failed to load Mapbox');
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    } else if (window.mapboxgl) {
      initializeMap();
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (map.current && mapLoaded) {
      updateMapView();
    }
  }, [coordinates, mapLoaded]);

  const initializeMap = () => {
    if (!mapContainer.current || !window.mapboxgl) return;

    try {
      window.mapboxgl.accessToken = 'pk.eyJ1IjoiYWhtYWRhbHdha2FpIiwiYSI6ImNtZGNsZ3RsZDEzdGsya3F0ODFxeGRzbXoifQ.jfgGW0KNFTwATOShRDtQsg';
      
      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: `mapbox://styles/mapbox/${style}-v11`,
        center: [coordinates?.lng || 0, coordinates?.lat || 0],
        zoom: zoom,
        interactive: true,
        attributionControl: false,
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        addMarkerToMap();
      });

      map.current.on('error', (e: any) => {
        console.error('Mapbox error:', e);
        setMapError('Map failed to load');
      });

    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Map initialization failed');
    }
  };

  const updateMapView = () => {
    if (!map.current) return;

    map.current.flyTo({
      center: [coordinates?.lng || 0, coordinates?.lat || 0],
      zoom: zoom,
      duration: 1000,
    });

    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    addMarkerToMap();
  };

  const addMarkerToMap = () => {
    if (!map.current || !marker || !window.mapboxgl) return;

    // Create custom marker element
    const markerElement = document.createElement('div');
    markerElement.className = 'address-marker';
    markerElement.style.cssText = `
      width: 30px;
      height: 40px;
      background-image: url('data:image/svg+xml,${encodeURIComponent(`
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#3182ce"/>
          <circle cx="12" cy="9" r="3" fill="white"/>
        </svg>
      `)}');
      background-size: contain;
      background-repeat: no-repeat;
      cursor: pointer;
    `;

    new window.mapboxgl.Marker(markerElement)
      .setLngLat([coordinates?.lng || 0, coordinates?.lat || 0])
      .setPopup(
        new window.mapboxgl.Popup({ offset: 25 })
          .setHTML(`
            <div style="padding: 8px; max-width: 200px;">
              <strong style="font-size: 14px; color: #2d3748;">${address}</strong>
            </div>
          `)
      )
      .addTo(map.current);
  };

  if (mapError) {
    return (
      <Box
        className={className}
        p={4}
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="md"
        minH="200px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Alert status="error" size="sm" borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm">{mapError}</Text>
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      className={className}
      position="relative"
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      overflow="hidden"
      minH="200px"
    >
      {/* Map Container */}
      <Box
        ref={mapContainer}
        w="100%"
        h="200px"
        bg={bgColor}
        position="relative"
      />

      {/* Loading Overlay */}
      {!mapLoaded && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          align="center"
          justify="center"
          bg="rgba(255, 255, 255, 0.8)"
          zIndex={10}
        >
          <Spinner size="sm" color="blue.500" mr={2} />
          <Text fontSize="sm" color="gray.600">
            Loading map...
          </Text>
        </Flex>
      )}

      {/* Address Badge */}
      {mapLoaded && (
        <Box
          position="absolute"
          top={3}
          left={3}
          zIndex={10}
        >
          <Badge
            bg="white"
            color="gray.800"
            px={3}
            py={1}
            borderRadius="md"
            fontSize="xs"
            fontWeight="medium"
            boxShadow="sm"
            maxW="200px"
            noOfLines={2}
            _dark={{
              bg: 'gray.800',
              color: 'white',
            }}
          >
            {address}
          </Badge>
        </Box>
      )}
    </Box>
  );
};

// Route Preview Component for showing pickup to dropoff
export const RoutePreviewMap: React.FC<{ route: RoutePreview; className?: string }> = ({
  route,
  className,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    if (!window.mapboxgl && !document.querySelector('script[src*="mapbox-gl"]')) {
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = () => initializeRouteMap();
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    } else if (window.mapboxgl) {
      initializeRouteMap();
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const initializeRouteMap = () => {
    if (!mapContainer.current || !window.mapboxgl) return;

    try {
      window.mapboxgl.accessToken = 'pk.eyJ1IjoiYWhtYWRhbHdha2FpIiwiYSI6ImNtZGNsZ3RsZDEzdGsya3F0ODFxeGRzbXoifQ.jfgGW0KNFTwATOShRDtQsg';
      
      const bounds = new window.mapboxgl.LngLatBounds();
      bounds.extend([route.pickup.lng, route.pickup.lat]);
      bounds.extend([route.dropoff.lng, route.dropoff.lat]);

      map.current = new window.mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        bounds: bounds,
        fitBoundsOptions: { padding: 50 },
        interactive: true,
        attributionControl: false,
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        addRouteToMap();
      });

      map.current.on('error', (e: any) => {
        setMapError('Route map failed to load');
      });

    } catch (error) {
      setMapError('Route map initialization failed');
    }
  };

  const addRouteToMap = () => {
    if (!map.current || !window.mapboxgl) return;

    // Add pickup marker (green)
    const pickupElement = document.createElement('div');
    pickupElement.style.cssText = `
      width: 20px; height: 20px; border-radius: 50%;
      background-color: #48bb78; border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    
    new window.mapboxgl.Marker(pickupElement)
      .setLngLat([route.pickup.lng, route.pickup.lat])
      .addTo(map.current);

    // Add dropoff marker (red)
    const dropoffElement = document.createElement('div');
    dropoffElement.style.cssText = `
      width: 20px; height: 20px; border-radius: 50%;
      background-color: #e53e3e; border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    `;
    
    new window.mapboxgl.Marker(dropoffElement)
      .setLngLat([route.dropoff.lng, route.dropoff.lat])
      .addTo(map.current);

    // Add route line if available
    if (route.route && route.route.length > 0) {
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.route,
          },
        },
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#3182ce',
          'line-width': 4,
        },
      });
    }
  };

  if (mapError) {
    return (
      <Box className={className}>
        <Alert status="error" size="sm">
          <AlertIcon />
          <Text fontSize="sm">{mapError}</Text>
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      className={className}
      position="relative"
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      overflow="hidden"
      minH="250px"
    >
      <Box ref={mapContainer} w="100%" h="250px" />
      
      {!mapLoaded && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          align="center"
          justify="center"
          bg="rgba(255, 255, 255, 0.8)"
          zIndex={10}
        >
          <Spinner size="sm" color="blue.500" mr={2} />
          <Text fontSize="sm">Loading route...</Text>
        </Flex>
      )}

      {mapLoaded && (
        <Box position="absolute" top={3} left={3} zIndex={10}>
          <Badge bg="white" color="gray.800" px={2} py={1} borderRadius="md" fontSize="xs">
            {route.distance.toFixed(1)} miles • {Math.round(route.duration)} min
          </Badge>
        </Box>
      )}
    </Box>
  );
};

export default MapPreview;