'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Box,
  HStack,
  Icon,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiMapPin, FiNavigation, FiClock } from 'react-icons/fi';

type Location = {
  lat: number;
  lng: number;
  label?: string | null;
};

interface RouteMapPreviewProps {
  pickup?: Location | null;
  dropoff?: Location | null;
  height?: string;
}

type RouteStats = {
  distanceMeters: number;
  durationSeconds: number;
};

/**
 * Lightweight Mapbox route preview for the luxury booking flow.
 * - Loads Mapbox dynamically on the client
 * - Renders pickup/drop-off markers
 * - Draws the driving route using Mapbox Directions (geojson geometry)
 */
export default function RouteMapPreview({
  pickup,
  dropoff,
  height = '360px',
}: RouteMapPreviewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);

  const hasBothLocations =
    Boolean(pickup?.lat && pickup?.lng) && Boolean(dropoff?.lat && dropoff?.lng);

  const ensureMapboxLoaded = useCallback(async () => {
    if (typeof window === 'undefined') {
      throw new Error('Mapbox requires a browser environment');
    }

    if ((window as any).mapboxgl) {
      return;
    }

    const existingScript = document.querySelector('script[data-sv-mapbox]');
    if (existingScript) {
      await new Promise<void>((resolve, reject) => {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Mapbox script')));
      });
    } else {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
        script.async = true;
        script.dataset.svMapbox = 'true';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Mapbox library'));
        document.head.appendChild(script);

        if (!document.querySelector('link[data-sv-mapbox-css]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
          link.dataset.svMapboxCss = 'true';
          document.head.appendChild(link);
        }
      });
    }
  }, []);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  }, []);

  const resetRouteLayer = useCallback(() => {
    if (!mapRef.current) return;
    if (mapRef.current.getLayer('sv-route-glow')) {
      mapRef.current.removeLayer('sv-route-glow');
    }
    if (mapRef.current.getLayer('sv-route-line')) {
      mapRef.current.removeLayer('sv-route-line');
    }
    if (mapRef.current.getSource('sv-route-source')) {
      mapRef.current.removeSource('sv-route-source');
    }
  }, []);

  const addMarkersAndRoute = useCallback(async () => {
    if (!mapRef.current || !isMapReady) return;

    const mapboxgl = (window as any).mapboxgl;
    clearMarkers();
    resetRouteLayer();

    // If only one location, center on it
    if (!hasBothLocations) {
      if (pickup?.lat && pickup?.lng) {
        mapRef.current.setCenter([pickup.lng, pickup.lat]);
        mapRef.current.setZoom(12);
      } else if (dropoff?.lat && dropoff?.lng) {
        mapRef.current.setCenter([dropoff.lng, dropoff.lat]);
        mapRef.current.setZoom(12);
      }
      return;
    }

    // Fetch driving route via Mapbox Directions
    try {
      setIsRouting(true);
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      if (!token) {
        throw new Error('Mapbox token not configured');
      }

      if (!pickup?.lng || !pickup?.lat || !dropoff?.lng || !dropoff?.lat) {
        return;
      }

      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickup.lng},${pickup.lat};${dropoff.lng},${dropoff.lat}?geometries=geojson&overview=full&access_token=${token}`;
      const response = await fetch(directionsUrl);

      if (!response.ok) {
        throw new Error('Unable to fetch driving route');
      }

      const data = await response.json();
      const coordinates = data?.routes?.[0]?.geometry?.coordinates;
      const distanceMeters: number | undefined = data?.routes?.[0]?.distance;
      const durationSeconds: number | undefined = data?.routes?.[0]?.duration;

      if (!coordinates || coordinates.length < 2) {
        throw new Error('Route geometry unavailable');
      }

      mapRef.current.addSource('sv-route-source', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      });

      mapRef.current.addLayer({
        id: 'sv-route-line',
        type: 'line',
        source: 'sv-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#8B5CF6',
          'line-width': 6,
          'line-opacity': 0.9,
        },
      });

      // Add animated glow effect layer
      mapRef.current.addLayer({
        id: 'sv-route-glow',
        type: 'line',
        source: 'sv-route-source',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#8B5CF6',
          'line-width': 12,
          'line-opacity': 0.3,
          'line-blur': 4,
        },
      }, 'sv-route-line');

      const bounds = new mapboxgl.LngLatBounds();
      coordinates.forEach(([lng, lat]: [number, number]) => bounds.extend([lng, lat]));

      mapRef.current.fitBounds(bounds, {
        padding: 70,
        maxZoom: 13,
      });

      if (typeof distanceMeters === 'number' && typeof durationSeconds === 'number') {
        setRouteStats({
          distanceMeters,
          durationSeconds,
        });
      } else {
        setRouteStats(null);
      }
    } catch (routeError: any) {
      console.error('Route loading error:', routeError);
      setError(routeError?.message || 'Unable to plot the route');
      setRouteStats(null);
    } finally {
      setIsRouting(false);
    }
  }, [clearMarkers, dropoff, hasBothLocations, pickup, resetRouteLayer, isMapReady]);

  useEffect(() => {
    let canceled = false;

    const bootstrapMap = async () => {
      if (!mapContainerRef.current || mapRef.current) return;
      if (!pickup && !dropoff) return;

      setIsLoading(true);

      try {
        await ensureMapboxLoaded();

        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
          throw new Error('Mapbox token not configured');
        }

        if (!mapContainerRef.current || canceled) return;

        const mapboxgl = (window as any).mapboxgl;
        mapboxgl.accessToken = token;

        mapContainerRef.current.innerHTML = '';
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/satellite-streets-v12',
          center:
            pickup && pickup.lng && pickup.lat
              ? [pickup.lng, pickup.lat]
              : dropoff && dropoff.lng && dropoff.lat
              ? [dropoff.lng, dropoff.lat]
              : [-3.435973, 55.378051],
          zoom: 10,
        });

        mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        mapRef.current.on('load', () => {
          if (canceled) return;
          setIsMapReady(true);
          setIsLoading(false);
          addMarkersAndRoute();
        });

        mapRef.current.on('error', (mapError: any) => {
          if (canceled) return;
          console.error('Map error:', mapError);
          setError('Failed to load map');
          setIsLoading(false);
          setRouteStats(null);
        });
      } catch (libError: any) {
        if (canceled) return;
        console.error('Map bootstrap error:', libError);
        setError(libError?.message || 'Failed to initialize map');
        setIsLoading(false);
        setRouteStats(null);
      }
    };

    bootstrapMap();

    return () => {
      canceled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (mapContainerRef.current) {
        mapContainerRef.current.innerHTML = '';
      }
      clearMarkers();
    };
  }, [addMarkersAndRoute, clearMarkers, dropoff, ensureMapboxLoaded, pickup]);

  useEffect(() => {
    if (isMapReady) {
      addMarkersAndRoute();
    }
  }, [addMarkersAndRoute, isMapReady, pickup, dropoff]);

  const miles = routeStats ? (routeStats.distanceMeters / 1609.344).toFixed(1) : null;
  const totalMinutes = routeStats ? Math.round(routeStats.durationSeconds / 60) : null;
  const durationLabel = (() => {
    if (totalMinutes === null) return null;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  })();

  if (!pickup && !dropoff) {
    return (
      <Box
        h={height}
        w="100%"
        borderRadius="xl"
        border="1px solid"
        borderColor="whiteAlpha.200"
        bg="linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.85))"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="whiteAlpha.700" fontSize="sm">
          Add pickup and drop-off addresses to preview the route.
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        status="error"
        borderRadius="xl"
        bg="rgba(248, 113, 113, 0.08)"
        border="1px solid"
        borderColor="rgba(248, 113, 113, 0.35)"
      >
        <AlertIcon />
        <Text color="white">{error}</Text>
      </Alert>
    );
  }

  return (
    <VStack spacing={3} align="stretch">
      {/* Legend */}
      <HStack spacing={6} justify="center">
        <HStack spacing={2}>
          <Box w="12px" h="12px" borderRadius="full" bg="#22c55e" boxShadow="0 0 8px rgba(34,197,94,0.5)" />
          <Text color="whiteAlpha.800" fontSize="sm">Pickup</Text>
        </HStack>
        <HStack spacing={2}>
          <Box w="12px" h="12px" borderRadius="full" bg="#ef4444" boxShadow="0 0 8px rgba(239,68,68,0.5)" />
          <Text color="whiteAlpha.800" fontSize="sm">Drop-off</Text>
        </HStack>
        {hasBothLocations && (
          <HStack spacing={2}>
            <Box w="20px" h="4px" borderRadius="full" bg="#8B5CF6" boxShadow="0 0 8px rgba(139,92,246,0.5)" />
            <Text color="whiteAlpha.800" fontSize="sm">Route</Text>
          </HStack>
        )}
      </HStack>
      
      <Box
        position="relative"
        h={height}
        w="100%"
        borderRadius="2xl"
        border="2px solid"
        borderColor="purple.500"
        overflow="hidden"
        bg="linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.85))"
        boxShadow="0 8px 32px rgba(139, 92, 246, 0.2)"
      >
        {routeStats && (
          <Box
            position="absolute"
            top="16px"
            right="60px"
            zIndex={3}
            bg="linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,41,59,0.95))"
            border="1px solid"
            borderColor="purple.500"
            borderRadius="xl"
            px={5}
            py={4}
            boxShadow="0 8px 32px rgba(139, 92, 246, 0.3)"
            backdropFilter="blur(10px)"
          >
            <HStack spacing={2} mb={2}>
              <Icon as={FiNavigation} color="purple.400" />
              <Text color="white" fontWeight="700" fontSize="md">
                Route Summary
              </Text>
            </HStack>
            <VStack align="start" spacing={1}>
              <HStack spacing={2}>
                <Icon as={FiMapPin} color="green.400" boxSize={3} />
                <Text color="whiteAlpha.900" fontSize="sm" fontWeight="600">
                  {miles ? `${miles} miles` : 'Calculating...'}
                </Text>
              </HStack>
              <HStack spacing={2}>
                <Icon as={FiClock} color="blue.400" boxSize={3} />
                <Text color="whiteAlpha.900" fontSize="sm" fontWeight="600">
                  {durationLabel ? durationLabel : 'Calculating...'}
                </Text>
              </HStack>
            </VStack>
          </Box>
        )}
        {isLoading && (
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            zIndex={2}
          >
            <Spinner size="lg" color="blue.300" />
          </Box>
        )}
        {isRouting && !isLoading && (
          <Box
            position="absolute"
            top="16px"
            right="16px"
            zIndex={2}
            bg="rgba(15,23,42,0.8)"
            px={3}
            py={2}
            borderRadius="md"
            border="1px solid"
            borderColor="whiteAlpha.200"
          >
            <Text color="whiteAlpha.800" fontSize="sm">
              Plotting route...
            </Text>
          </Box>
        )}
        <Box
          ref={mapContainerRef}
          h="100%"
          w="100%"
          sx={{
            '.mapboxgl-popup-content': {
              backgroundColor: 'white',
              borderRadius: '10px',
              padding: '4px 6px',
            },
            '.mapboxgl-popup-close-button': {
              fontSize: '14px',
            },
          }}
        />
      </Box>
      <Text color="whiteAlpha.500" fontSize="xs" textAlign="center">
        🗺️ Map powered by Mapbox • Verify your route before continuing
      </Text>
    </VStack>
  );
}

