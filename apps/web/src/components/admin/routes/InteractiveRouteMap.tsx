'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  IconButton,
  useToast,
  Alert,
  AlertIcon,
  Spinner,
} from '@chakra-ui/react';
import { FiMapPin, FiNavigation, FiRefreshCw, FiSave, FiX } from 'react-icons/fi';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Drop {
  id: string;
  sequenceNumber: number;
  lat: number;
  lng: number;
  address: string;
  customerName?: string;
  bookingReference?: string;
  status?: string;
  [key: string]: any;
}

interface InteractiveRouteMapProps {
  routeId: string;
  drops: Drop[];
  onDropsReorder?: (reorderedDrops: Drop[]) => Promise<void>;
  onDropRemove?: (dropId: string) => Promise<void>;
  height?: string;
  editable?: boolean;
  showControls?: boolean;
}

export function InteractiveRouteMap({
  routeId,
  drops,
  onDropsReorder,
  onDropRemove,
  height = '600px',
  editable = true,
  showControls = true,
}: InteractiveRouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const routeLineRef = useRef<mapboxgl.Layer | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedMarkerId, setDraggedMarkerId] = useState<string | null>(null);
  const [localDrops, setLocalDrops] = useState<Drop[]>(drops);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYWhtYWRhbHdha2FpIiwiYSI6ImNtZGNsZ3RsZDEzdGsya3F0ODFxeGRzbXoifQ.jfgGW0KNFTwATOShRDtQsg';
    
    if (!mapboxToken) {
      console.error('❌ Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: drops.length > 0 
        ? [drops[0].lng, drops[0].lat]
        : [-3.435973, 55.378051], // UK center
      zoom: drops.length > 0 ? 11 : 6,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update drops when prop changes
  useEffect(() => {
    setLocalDrops(drops);
    setHasChanges(false);
  }, [drops]);

  // Render markers and route
  useEffect(() => {
    if (!map.current || localDrops.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();

    // Remove existing route line
    if (routeLineRef.current && map.current.getLayer('route')) {
      map.current.removeLayer('route');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }

    // Sort drops by sequence
    const sortedDrops = [...localDrops].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    // Create markers
    sortedDrops.forEach((drop, index) => {
      const el = document.createElement('div');
      el.className = 'route-marker-draggable';
      el.style.width = '40px';
      el.style.height = '40px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = index === 0 ? '#10b981' : index === sortedDrops.length - 1 ? '#ef4444' : '#3b82f6';
      el.style.border = '3px solid white';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontWeight = 'bold';
      el.style.fontSize = '14px';
      el.style.cursor = editable ? 'grab' : 'pointer';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.transition = 'all 0.2s';
      el.textContent = `${index + 1}`;

      // Add drag functionality
      if (editable) {
        el.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          setIsDragging(true);
          setDraggedMarkerId(drop.id);
          el.style.cursor = 'grabbing';
          el.style.transform = 'scale(1.2)';
        });
      }

      const marker = new mapboxgl.Marker({
        element: el,
        draggable: editable,
      })
        .setLngLat([drop.lng, drop.lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px; color: #000; min-width: 200px;">
                <strong>Stop ${index + 1}</strong>
                ${drop.customerName ? `<p style="margin: 4px 0; font-weight: bold;">${drop.customerName}</p>` : ''}
                ${drop.bookingReference ? `<p style="margin: 4px 0; font-size: 11px; color: #666;">Ref: ${drop.bookingReference}</p>` : ''}
                <p style="margin: 4px 0 0 0; font-size: 12px;">${drop.address}</p>
                ${drop.status ? `<p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">Status: ${drop.status}</p>` : ''}
              </div>
            `)
        );

      if (editable) {
        marker.on('dragstart', () => {
          setIsDragging(true);
          setDraggedMarkerId(drop.id);
        });

        marker.on('drag', () => {
          // Update marker position visually
        });

        marker.on('dragend', () => {
          setIsDragging(false);
          const lngLat = marker.getLngLat();
          
          // Find nearest drop to reorder
          const distances = sortedDrops.map((d, idx) => {
            const dx = d.lng - lngLat.lng;
            const dy = d.lat - lngLat.lat;
            return {
              index: idx,
              distance: Math.sqrt(dx * dx + dy * dy),
            };
          });

          distances.sort((a, b) => a.distance - b.distance);
          const newIndex = distances[0].index;

          // Reorder drops
          const reordered = [...sortedDrops];
          const dropIndex = reordered.findIndex(d => d.id === drop.id);
          const [movedDrop] = reordered.splice(dropIndex, 1);
          
          // Update coordinates
          movedDrop.lat = lngLat.lat;
          movedDrop.lng = lngLat.lng;
          
          reordered.splice(newIndex, 0, movedDrop);
          
          // Renumber sequences
          const finalDrops = reordered.map((d, idx) => ({
            ...d,
            sequenceNumber: idx + 1,
          }));

          setLocalDrops(finalDrops);
          setHasChanges(true);
          setDraggedMarkerId(null);

          // Update marker position
          marker.setLngLat([lngLat.lng, lngLat.lat]);
        });
      }

      marker.addTo(map.current!);
      markersRef.current.set(drop.id, marker);
    });

    // Add route line
    if (sortedDrops.length > 1) {
      const coordinates = sortedDrops.map(drop => [drop.lng, drop.lat]);

      map.current.addSource('route', {
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

      routeLineRef.current = map.current.getLayer('route') as mapboxgl.Layer | null;
    }

    // Fit bounds
    if (sortedDrops.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      sortedDrops.forEach(drop => {
        bounds.extend([drop.lng, drop.lat]);
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 13,
      });
    }
  }, [localDrops, editable]);

  // Update route line when drops change
  useEffect(() => {
    if (!map.current || localDrops.length < 2) return;

    const sortedDrops = [...localDrops].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    const coordinates = sortedDrops.map(drop => [drop.lng, drop.lat]);

    const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates,
        },
      });
    }
  }, [localDrops]);

  const handleSave = useCallback(async () => {
    if (!onDropsReorder || !hasChanges) return;

    setIsSaving(true);
    try {
      await onDropsReorder(localDrops);
      setHasChanges(false);
      toast({
        title: 'Route Updated',
        description: 'Drop order has been saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save route changes',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  }, [localDrops, hasChanges, onDropsReorder, toast]);

  const handleReset = useCallback(() => {
    setLocalDrops(drops);
    setHasChanges(false);
    toast({
      title: 'Changes Reset',
      description: 'Route order has been reset to original',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  }, [drops, toast]);

  const handleOptimize = useCallback(async () => {
    // Call optimization API
    try {
      const response = await fetch(`/api/admin/routes/${routeId}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.drops) {
          setLocalDrops(result.drops);
          setHasChanges(true);
          toast({
            title: 'Route Optimized',
            description: 'Route has been optimized for better efficiency',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Optimization Failed',
        description: 'Failed to optimize route',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [routeId, toast]);

  return (
    <VStack align="stretch" spacing={3}>
      {showControls && editable && (
        <HStack justify="space-between" p={3} bg="#111111" borderRadius="md" borderWidth={1} borderColor="#333333">
          <HStack spacing={3}>
            <Text fontSize="sm" color="#FFFFFF" fontWeight="bold">
              Interactive Route Map
            </Text>
            {hasChanges && (
              <Badge colorScheme="orange" size="sm">
                Unsaved Changes
              </Badge>
            )}
            {isDragging && (
              <Badge colorScheme="blue" size="sm">
                Dragging...
              </Badge>
            )}
          </HStack>
          <HStack spacing={2}>
            <Button
              size="sm"
              leftIcon={<FiRefreshCw />}
              onClick={handleOptimize}
              bg="#2563eb"
              color="#FFFFFF"
              _hover={{ bg: '#1d4ed8' }}
            >
              Optimize
            </Button>
            {hasChanges && (
              <>
                <Button
                  size="sm"
                  leftIcon={<FiX />}
                  onClick={handleReset}
                  variant="outline"
                  borderColor="#333333"
                  color="#FFFFFF"
                  _hover={{ bg: '#1a1a1a' }}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  leftIcon={<FiSave />}
                  onClick={handleSave}
                  isLoading={isSaving}
                  bg="#10b981"
                  color="#FFFFFF"
                  _hover={{ bg: '#059669' }}
                >
                  Save Changes
                </Button>
              </>
            )}
          </HStack>
        </HStack>
      )}

      {editable && (
        <Alert status="info" bg="#1a1a1a" borderColor="#333333" borderRadius="md">
          <AlertIcon color="#2563eb" />
          <Text fontSize="sm" color="#FFFFFF">
            Drag markers to reorder stops. The route will update automatically.
          </Text>
        </Alert>
      )}

      <Box
        ref={mapContainer}
        h={height}
        w="100%"
        borderRadius="md"
        overflow="hidden"
        border="2px solid"
        borderColor="#3b82f6"
        boxShadow="0 0 20px rgba(59, 130, 246, 0.3)"
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
          '.route-marker-draggable:hover': {
            transform: 'scale(1.1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          },
        }}
      />

      {/* Drops List */}
      <VStack align="stretch" spacing={2} mt={3}>
        <Text fontSize="sm" fontWeight="bold" color="#FFFFFF">
          Route Stops ({localDrops.length})
        </Text>
        {localDrops
          .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
          .map((drop, index) => (
            <HStack
              key={drop.id}
              p={2}
              bg="#111111"
              borderRadius="md"
              borderWidth={1}
              borderColor="#333333"
              spacing={3}
            >
              <Badge
                colorScheme={
                  index === 0 ? 'green' :
                  index === localDrops.length - 1 ? 'red' : 'blue'
                }
                borderRadius="full"
                minW="30px"
                textAlign="center"
              >
                {index + 1}
              </Badge>
              <VStack align="start" spacing={0} flex={1}>
                {drop.customerName && (
                  <Text fontSize="sm" fontWeight="bold" color="#FFFFFF">
                    {drop.customerName}
                  </Text>
                )}
                <Text fontSize="xs" color="#9ca3af" noOfLines={1}>
                  {drop.address}
                </Text>
                {drop.bookingReference && (
                  <Text fontSize="xs" color="#2563eb">
                    {drop.bookingReference}
                  </Text>
                )}
              </VStack>
              {editable && onDropRemove && (
                <IconButton
                  aria-label="Remove drop"
                  icon={<FiX />}
                  size="xs"
                  colorScheme="red"
                  variant="ghost"
                  onClick={() => onDropRemove(drop.id)}
                />
              )}
            </HStack>
          ))}
      </VStack>
    </VStack>
  );
}

