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

const asPoint = (loc?: Location | null) => {
  if (!loc) return null;
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, label: loc.label };
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
  const vanMarkerRef = useRef<any>(null);
  const vanAnimationRef = useRef<number | null>(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);

  const pickupPoint = asPoint(pickup);
  const dropoffPoint = asPoint(dropoff);
  const hasBothLocations = Boolean(pickupPoint && dropoffPoint);

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

  const stopVanAnimation = useCallback(() => {
    if (vanAnimationRef.current !== null) {
      cancelAnimationFrame(vanAnimationRef.current);
      vanAnimationRef.current = null;
    }
    if (vanMarkerRef.current) {
      vanMarkerRef.current.remove();
      vanMarkerRef.current = null;
    }
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
    stopVanAnimation();

    // Add pickup marker
    if (pickupPoint) {
      const pickupMarker = new mapboxgl.Marker({
        color: '#22c55e',
      })
        .setLngLat([pickupPoint.lng, pickupPoint.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 20 }).setHTML(
            `<div style="padding: 6px 8px; color: #0f172a;">
              <strong style="color: #16a34a;">Pickup</strong>
              <p style="margin: 4px 0 0; font-size: 12px;">${pickupPoint.label || 'Pickup address'}</p>
            </div>`
          )
        )
        .addTo(mapRef.current);

      markersRef.current.push(pickupMarker);
    }

    // Add drop-off marker
    if (dropoffPoint) {
      const dropoffMarker = new mapboxgl.Marker({
        color: '#ef4444',
      })
        .setLngLat([dropoffPoint.lng, dropoffPoint.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 20 }).setHTML(
            `<div style="padding: 6px 8px; color: #0f172a;">
              <strong style="color: #ef4444;">Drop-off</strong>
              <p style="margin: 4px 0 0; font-size: 12px;">${dropoffPoint.label || 'Drop-off address'}</p>
            </div>`
          )
        )
        .addTo(mapRef.current);

      markersRef.current.push(dropoffMarker);
    }

    // If only one location, center on it
    if (!hasBothLocations) {
      if (pickupPoint) {
        mapRef.current.setCenter([pickupPoint.lng, pickupPoint.lat]);
        mapRef.current.setZoom(12);
      } else if (dropoffPoint) {
        mapRef.current.setCenter([dropoffPoint.lng, dropoffPoint.lat]);
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

      if (!pickupPoint?.lng || !pickupPoint?.lat || !dropoffPoint?.lng || !dropoffPoint?.lat) {
        return;
      }

      const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupPoint.lng},${pickupPoint.lat};${dropoffPoint.lng},${dropoffPoint.lat}?geometries=geojson&overview=full&access_token=${token}`;
      const response = await fetch(directionsUrl);

      if (!response.ok) {
        throw new Error('Unable to fetch driving route');
      }

      const data = await response.json();
      const coordinates = data?.routes?.[0]?.geometry?.coordinates;
      const distanceMeters: number | undefined = data?.routes?.[0]?.distance;
      const durationSeconds: number | undefined = data?.routes?.[0]?.duration;

      if (!coordinates || coordinates.length < 2) {
        console.warn('Mapbox returned no geometry for the provided points', { pickupPoint, dropoffPoint, data });
        setError('Route unavailable for the selected addresses. Please adjust locations and try again.');
        setRouteStats(null);

        // Fallback: keep markers visible and fit bounds to the two points
        const fallbackBounds = new mapboxgl.LngLatBounds();
        const pickupLngLat: [number, number] = [pickupPoint!.lng, pickupPoint!.lat];
        const dropoffLngLat: [number, number] = [dropoffPoint!.lng, dropoffPoint!.lat];
        fallbackBounds.extend(pickupLngLat);
        fallbackBounds.extend(dropoffLngLat);
        mapRef.current.fitBounds(fallbackBounds, {
          padding: 70,
          maxZoom: 13,
        });
        return;
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

      // Animate a moving black van along the route
      if (coordinates && coordinates.length > 1) {
        const vanEl = document.createElement('div');
        vanEl.style.width = '38px';
        vanEl.style.height = '22px';
        vanEl.style.background = 'linear-gradient(135deg, #0b1220, #0f172a)';
        vanEl.style.borderRadius = '5px';
        vanEl.style.border = '2px solid #111827';
        vanEl.style.boxShadow = '0 8px 16px rgba(0,0,0,0.45)';
        vanEl.style.display = 'flex';
        vanEl.style.alignItems = 'center';
        vanEl.style.justifyContent = 'center';
        vanEl.style.position = 'relative';
        vanEl.style.transform = 'translate(-50%, -50%)';
        vanEl.style.color = '#e5e7eb';
        vanEl.style.fontSize = '10px';
        vanEl.style.fontWeight = '800';
        vanEl.style.letterSpacing = '0.2px';
        vanEl.textContent = 'VAN';

        const wheel = (left: boolean) => {
          const w = document.createElement('div');
          w.style.width = '10px';
          w.style.height = '10px';
          w.style.borderRadius = '50%';
          w.style.background = '#0f172a';
          w.style.border = '2px solid #38bdf8';
          w.style.position = 'absolute';
          w.style.bottom = '-6px';
          w.style[left ? 'left' : 'right'] = '6px';
          w.style.boxShadow = '0 2px 4px rgba(0,0,0,0.35)';
          return w;
        };

        vanEl.appendChild(wheel(true));
        vanEl.appendChild(wheel(false));

        const vanMarker = new mapboxgl.Marker({
          element: vanEl,
        }).setLngLat(coordinates[0]).addTo(mapRef.current);

        vanMarkerRef.current = vanMarker;

        let idx = 0;
        const advance = () => {
          if (!vanMarkerRef.current) return;
          idx = Math.min(idx + 2, coordinates.length - 1);
          vanMarkerRef.current.setLngLat(coordinates[idx]);
          if (idx < coordinates.length - 1) {
            vanAnimationRef.current = requestAnimationFrame(advance);
          }
        };

        vanAnimationRef.current = requestAnimationFrame(advance);
      }
    } catch (routeError: any) {
      console.error('Route loading error:', routeError);
      setError(routeError?.message || 'Unable to plot the route');
      setRouteStats(null);
      stopVanAnimation();
    } finally {
      setIsRouting(false);
    }
  }, [clearMarkers, dropoff, hasBothLocations, pickup, resetRouteLayer, stopVanAnimation, isMapReady]);

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
      stopVanAnimation();
    };
  }, [addMarkersAndRoute, clearMarkers, dropoff, ensureMapboxLoaded, pickup, stopVanAnimation]);

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

