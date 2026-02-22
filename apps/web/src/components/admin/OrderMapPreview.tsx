'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, Spinner, Alert, AlertIcon, Text } from '@chakra-ui/react';

interface OrderMapPreviewProps {
  pickupLocation?: {
    lat: number;
    lng: number;
    label?: string;
  } | null;
  dropoffLocation?: {
    lat: number;
    lng: number;
    label?: string;
  } | null;
  height?: string;
  bgColor?: string;
  borderColor?: string;
}

export function OrderMapPreview({
  pickupLocation,
  dropoffLocation,
  height = '300px',
  bgColor = '#0B1020',
  borderColor = '#2A3A5E',
}: OrderMapPreviewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Check if Mapbox is available
    if (typeof window === 'undefined' || !(window as any).mapboxgl) {
      // Load Mapbox GL JS
      const script = document.createElement('script');
      script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
      script.onload = initializeMap;
      script.onerror = () => {
        setError('Failed to load Mapbox library');
        setLoading(false);
      };
      document.head.appendChild(script);

      const link = document.createElement('link');
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    } else {
      initializeMap();
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      if (mapContainer.current) {
        // Ensure container is clean to avoid Mapbox util.js warnings on re-init
        mapContainer.current.innerHTML = '';
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapContainer.current) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    
    if (!mapboxToken) {
      setError('Mapbox token not configured');
      setLoading(false);
      return;
    }

    try {
      const mapboxgl = (window as any).mapboxgl;
      mapboxgl.accessToken = mapboxToken;

      // Initialize map
      // Ensure container is empty before instantiating the Mapbox map to avoid DOM leftovers triggering util.js warning
      mapContainer.current.innerHTML = '';
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: pickupLocation 
          ? [pickupLocation.lng, pickupLocation.lat]
          : dropoffLocation
          ? [dropoffLocation.lng, dropoffLocation.lat]
          : [-3.435973, 55.378051], // UK center
        zoom: pickupLocation && dropoffLocation ? 10 : 6,
      });

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setLoading(false);
        addMarkersAndRoute();
      });

      map.current.on('error', (e: any) => {
        console.error('Map error:', e);
        setError('Failed to load map');
        setLoading(false);
      });
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize map');
      setLoading(false);
    }
  };

  const addMarkersAndRoute = () => {
    if (!map.current || (!pickupLocation && !dropoffLocation)) return;

    const mapboxgl = (window as any).mapboxgl;

    // Clear existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());

    // Add pickup marker
    if (pickupLocation && pickupLocation.lat && pickupLocation.lng) {
      const pickupEl = document.createElement('div');
      pickupEl.className = 'pickup-marker';
      pickupEl.style.width = '24px';
      pickupEl.style.height = '24px';
      pickupEl.style.borderRadius = '50%';
      pickupEl.style.backgroundColor = '#10b981';
      pickupEl.style.border = '3px solid white';
      pickupEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      pickupEl.style.cursor = 'pointer';

      new mapboxgl.Marker(pickupEl)
        .setLngLat([pickupLocation.lng, pickupLocation.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px; color: #000;">
                <strong style="color: #10b981;">📍 Pickup Location</strong>
                <p style="margin: 4px 0 0 0; font-size: 12px;">${pickupLocation.label || 'Pickup'}</p>
              </div>
            `)
        )
        .addTo(map.current);
    }

    // Add dropoff marker
    if (dropoffLocation && dropoffLocation.lat && dropoffLocation.lng) {
      const dropoffEl = document.createElement('div');
      dropoffEl.className = 'dropoff-marker';
      dropoffEl.style.width = '24px';
      dropoffEl.style.height = '24px';
      dropoffEl.style.borderRadius = '50%';
      dropoffEl.style.backgroundColor = '#ef4444';
      dropoffEl.style.border = '3px solid white';
      dropoffEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      dropoffEl.style.cursor = 'pointer';

      new mapboxgl.Marker(dropoffEl)
        .setLngLat([dropoffLocation.lng, dropoffLocation.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px; color: #000;">
                <strong style="color: #ef4444;">📍 Dropoff Location</strong>
                <p style="margin: 4px 0 0 0; font-size: 12px;">${dropoffLocation.label || 'Dropoff'}</p>
              </div>
            `)
        )
        .addTo(map.current);
    }

    // Add route line if both locations are available
    if (pickupLocation && dropoffLocation && 
        pickupLocation.lat && pickupLocation.lng &&
        dropoffLocation.lat && dropoffLocation.lng) {
      
      // Remove existing route layer if any
      if (map.current.getLayer('route')) {
        map.current.removeLayer('route');
      }
      if (map.current.getSource('route')) {
        map.current.removeSource('route');
      }

      // Add route line
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [pickupLocation.lng, pickupLocation.lat],
               [dropoffLocation.lng, dropoffLocation.lat]],
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
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.7,
        },
      });

      // Fit bounds to show both markers
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([pickupLocation.lng, pickupLocation.lat]);
      bounds.extend([dropoffLocation.lng, dropoffLocation.lat]);
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });
    } else if (pickupLocation && pickupLocation.lat && pickupLocation.lng) {
      map.current.setCenter([pickupLocation.lng, pickupLocation.lat]);
      map.current.setZoom(12);
    } else if (dropoffLocation && dropoffLocation.lat && dropoffLocation.lng) {
      map.current.setCenter([dropoffLocation.lng, dropoffLocation.lat]);
      map.current.setZoom(12);
    }
  };

  useEffect(() => {
    if (map.current && map.current.loaded()) {
      addMarkersAndRoute();
    }
  }, [pickupLocation, dropoffLocation]);

  if (error) {
    return (
      <Box
        h={height}
        w="100%"
        borderRadius="md"
        borderWidth={2}
        borderColor={borderColor}
        bg={bgColor}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Alert status="error" bg={bgColor} borderColor={borderColor}>
          <AlertIcon />
          <Text color="#F5F8FF">{error}</Text>
        </Alert>
      </Box>
    );
  }

  if (!pickupLocation && !dropoffLocation) {
    return (
      <Box
        h={height}
        w="100%"
        borderRadius="md"
        borderWidth={2}
        borderColor={borderColor}
        bg={bgColor}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="#9ca3af" fontSize="sm">
          No location data available
        </Text>
      </Box>
    );
  }

  return (
    <Box
      position="relative"
      h={height}
      w="100%"
      borderRadius="md"
      borderWidth={2}
      borderColor={borderColor}
      overflow="hidden"
      bg={bgColor}
    >
      {loading && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={10}
        >
          <Spinner size="lg" color="#2563eb" />
        </Box>
      )}
      <Box
        ref={mapContainer}
        h="100%"
        w="100%"
        sx={{
          '.mapboxgl-popup-content': {
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '0',
          },
          '.mapboxgl-popup-close-button': {
            fontSize: '18px',
            padding: '4px 8px',
          },
        }}
      />
    </Box>
  );
}

