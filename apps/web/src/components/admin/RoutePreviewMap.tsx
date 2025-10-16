/**
 * Admin Route Cluster Map Component
 * Shows proposed multi-drop routes on an interactive map for admin preview
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { Box } from '@chakra-ui/react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface AdminRouteClusterMapProps {
  routes: Array<{
    id: string;
    drops: Array<{
      lat: number;
      lng: number;
      address: string;
    }>;
    color?: string;
  }>;
  height?: string;
}

const AdminRouteClusterMap: React.FC<AdminRouteClusterMapProps> = ({ 
  routes, 
  height = '400px' 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('❌ Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-3.435973, 55.378051], // UK center
      zoom: 6,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || routes.length === 0) return;

    const colors = [
      '#9333EA', // Purple
      '#3B82F6', // Blue
      '#10B981', // Green
      '#F59E0B', // Orange
      '#EF4444', // Red
      '#8B5CF6', // Violet
      '#06B6D4', // Cyan
    ];

    // Clear existing markers and layers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());

    // Add markers for each route
    routes.forEach((route, routeIndex) => {
      const color = route.color || colors[routeIndex % colors.length];

      route.drops.forEach((drop, dropIndex) => {
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'route-marker';
        el.style.width = '30px';
        el.style.height = '30px';
        el.style.borderRadius = '50%';
        el.style.backgroundColor = color;
        el.style.border = '3px solid white';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.color = 'white';
        el.style.fontWeight = 'bold';
        el.style.fontSize = '12px';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
        el.textContent = `${dropIndex + 1}`;

        // Add marker to map
        const marker = new mapboxgl.Marker(el)
          .setLngLat([drop.lng, drop.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 8px; color: #000;">
                  <strong>Route ${routeIndex + 1} - Stop ${dropIndex + 1}</strong>
                  <p style="margin: 4px 0 0 0; font-size: 12px;">${drop.address}</p>
                </div>
              `)
          )
          .addTo(map.current!);
      });
    });

    // Fit map to show all markers
    if (routes.length > 0 && routes[0].drops.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      routes.forEach(route => {
        route.drops.forEach(drop => {
          bounds.extend([drop.lng, drop.lat]);
        });
      });

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });
    }
  }, [routes]);

  return (
    <Box
      ref={mapContainer}
      h={height}
      w="100%"
      borderRadius="md"
      overflow="hidden"
      border="2px solid"
      borderColor="purple.500"
      boxShadow="0 0 20px rgba(147, 51, 234, 0.3)"
      position="relative"
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
  );
};

export default AdminRouteClusterMap;

