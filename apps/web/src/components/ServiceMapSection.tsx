'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box, Container, VStack, Heading, Text, HStack, Badge, SimpleGrid } from '@chakra-ui/react';
import mapboxgl from 'mapbox-gl';
import { UK_CITIES, UKCity } from '@/data/uk-cities';

// Set Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYWhtYWRhbHdha2FpIiwiYSI6ImNtZGNsZ3RsZDEzdGsya3F0ODFxeGRzbXoifQ.jfgGW0KNFTwATOShRDtQsg';

interface MapMarkerProps {
  city: UKCity;
  map: mapboxgl.Map;
}

const MapMarker: React.FC<MapMarkerProps> = ({ city, map }) => {
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!markerRef.current || !map) return;

    const markerElement = markerRef.current;

    // Create custom marker element
    const marker = new mapboxgl.Marker({
      element: markerElement,
      anchor: 'bottom'
    })
      .setLngLat([city.longitude, city.latitude])
      .addTo(map);

    // Add popup with city information
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      closeOnClick: false,
      className: 'custom-popup'
    }).setHTML(`
      <div style="background: rgba(0, 194, 255, 0.95); padding: 12px; border-radius: 8px; color: white; min-width: 150px;">
        <h3 style="font-weight: bold; margin: 0 0 4px 0; font-size: 14px;">${city.name}</h3>
        <p style="margin: 0; font-size: 12px; opacity: 0.9;">${city.region}</p>
        <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.8;">Population: ${city.population.toLocaleString()}</p>
      </div>
    `);

    marker.setPopup(popup);

    // Show popup on hover
    markerElement.addEventListener('mouseenter', () => {
      popup.addTo(map);
    });

    markerElement.addEventListener('mouseleave', () => {
      popup.remove();
    });

    return () => {
      marker.remove();
      popup.remove();
    };
  }, [city, map]);

  return (
    <div
      ref={markerRef}
      style={{
        width: '16px',
        height: '16px',
        background: 'linear-gradient(135deg, #00C2FF, #00D18F)',
        borderRadius: '50%',
        border: '2px solid white',
        boxShadow: '0 0 10px rgba(0, 194, 255, 0.5)',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.2)';
        e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 194, 255, 0.8)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 194, 255, 0.5)';
      }}
    />
  );
};

const ServiceMapSection = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    // Enhanced WebGL support check for Safari iOS 17
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
          console.warn('⚠️ WebGL not supported - Map will be disabled');
          setHasWebGL(false);
          return false;
        }

        // Additional check for Safari iOS 17 WebGL context issues
        // Test if getParameter works (this is where the error occurs)
        try {
          // Type assertion: gl is WebGLRenderingContext, not CanvasRenderingContext2D
          const webglContext = gl as WebGLRenderingContext;
          if (webglContext && 'getParameter' in webglContext && 'ALIASED_POINT_SIZE_RANGE' in webglContext) {
            const testParam = webglContext.getParameter(webglContext.ALIASED_POINT_SIZE_RANGE);
            if (!testParam || !Array.isArray(testParam) || testParam.length < 2) {
              console.warn('⚠️ WebGL context incomplete - Map will be disabled');
              setHasWebGL(false);
              return false;
            }
          }
        } catch (paramError) {
          console.warn('⚠️ WebGL getParameter failed (Safari iOS 17 issue):', paramError);
          setHasWebGL(false);
          return false;
        }

        return true;
      } catch (e) {
        console.warn('⚠️ WebGL check failed:', e);
        setHasWebGL(false);
        return false;
      }
    };

    if (!mapContainer.current || map.current) return;
    
    // Don't initialize map if WebGL is not supported
    if (!checkWebGL()) {
      setMapError(true);
      return;
    }

    // CRITICAL: Ensure map container is completely empty before initializing
    if (mapContainer.current) {
      mapContainer.current.innerHTML = '';
    }

    try {
      // Initialize map with enhanced error handling for Safari iOS 17
      const mapboxMap = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [-3.5, 55.5], // Center on UK
        zoom: 5.5,
        minZoom: 4,
        maxZoom: 12,
        attributionControl: false, // Remove attribution for cleaner look
        failIfMajorPerformanceCaveat: true, // Fail gracefully if WebGL is slow
        preserveDrawingBuffer: false, // Reduce memory usage
        antialias: false, // Disable antialiasing for better Safari compatibility
      });

      // Disable controls for cleaner look
      mapboxMap.scrollZoom.disable();
      mapboxMap.boxZoom.disable();
      mapboxMap.dragRotate.disable();
      mapboxMap.keyboard.disable();
      mapboxMap.doubleClickZoom.disable();
      mapboxMap.touchZoomRotate.disable();

      // Handle map errors with enhanced Safari iOS 17 support
      mapboxMap.on('error', (e: any) => {
        console.error('❌ Mapbox error:', e);
        
        // Check if error is related to WebGL context
        const errorMessage = e?.error?.message || e?.message || String(e);
        if (errorMessage.includes('WebGL') || 
            errorMessage.includes('getParameter') || 
            errorMessage.includes('ALIASED_POINT_SIZE_RANGE') ||
            errorMessage.includes('null is not an object')) {
          console.warn('⚠️ WebGL context error detected (Safari iOS 17) - Disabling map');
          setMapError(true);
          setHasWebGL(false);
          
          // Clean up map instance
          try {
            if (mapboxMap) {
              mapboxMap.remove();
            }
          } catch (cleanupErr) {
            console.warn('⚠️ Error cleaning up failed map:', cleanupErr);
          }
          return;
        }
        
        setMapError(true);
        setHasWebGL(false);
      });

      mapboxMap.on('load', () => {
      setIsMapLoaded(true);
      map.current = mapboxMap;

      // Add source and layer for UK boundary
      mapboxMap.addSource('uk-boundary', {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1'
      });

      mapboxMap.addLayer({
        id: 'uk-boundary',
        type: 'fill',
        source: 'uk-boundary',
        'source-layer': 'country_boundaries',
        filter: ['==', ['get', 'iso_3166_1'], 'GB'],
        paint: {
          'fill-color': 'rgba(0, 194, 255, 0.1)',
          'fill-outline-color': 'rgba(0, 194, 255, 0.3)'
        }
      });

      // Add markers for all UK cities with enhanced styling
      UK_CITIES.forEach((city, index) => {
        const markerElement = document.createElement('div');
        markerElement.style.width = '14px';
        markerElement.style.height = '14px';
        markerElement.style.background = 'linear-gradient(135deg, #00C2FF, #00D18F)';
        markerElement.style.borderRadius = '50%';
        markerElement.style.border = '2px solid white';
        markerElement.style.boxShadow = '0 0 12px rgba(0, 194, 255, 0.6)';
        markerElement.style.cursor = 'pointer';
        markerElement.style.transition = 'all 0.3s ease';
        markerElement.style.position = 'relative';

        // Add data attribute for major cities (London, Birmingham, Manchester, Glasgow)
        if (city.population > 500000) {
          markerElement.setAttribute('data-population', city.population.toString());
        }

        // Add hover effects
        markerElement.addEventListener('mouseenter', () => {
          markerElement.style.transform = 'scale(1.3)';
          markerElement.style.boxShadow = '0 0 20px rgba(0, 194, 255, 1)';
          markerElement.style.zIndex = '1000';
        });

        markerElement.addEventListener('mouseleave', () => {
          markerElement.style.transform = 'scale(1)';
          markerElement.style.boxShadow = '0 0 12px rgba(0, 194, 255, 0.6)';
          markerElement.style.zIndex = 'auto';
        });

        // Stagger animation for better visual effect
        setTimeout(() => {
          new mapboxgl.Marker(markerElement)
            .setLngLat([city.longitude, city.latitude])
            .addTo(mapboxMap);
        }, index * 50);
      });
    });

    } catch (error: any) {
      console.error('❌ Error initializing Mapbox:', error);
      
      // Check if error is related to WebGL context (Safari iOS 17)
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('WebGL') || 
          errorMessage.includes('getParameter') || 
          errorMessage.includes('ALIASED_POINT_SIZE_RANGE') ||
          errorMessage.includes('null is not an object')) {
        console.warn('⚠️ WebGL context initialization failed (Safari iOS 17) - Using fallback');
      }
      
      setMapError(true);
      setHasWebGL(false);
    }

    return () => {
      try {
        if (map.current) {
          map.current.remove();
          map.current = null;
          setIsMapLoaded(false);
        }
      } catch (cleanupError) {
        console.warn('⚠️ Error cleaning up map:', cleanupError);
      }
    };
  }, []);

  // Group cities by country for display
  const citiesByCountry = UK_CITIES.reduce((acc, city) => {
    if (!acc[city.country]) {
      acc[city.country] = [];
    }
    acc[city.country].push(city);
    return acc;
  }, {} as Record<string, UKCity[]>);

  return (
    <Box py={{ base: 12, md: 16 }} bg="bg.surface">
      <Container maxW="container.xl">
        <VStack spacing={8}>
          <Box 
            textAlign="center" 
            maxW="3xl" 
            mx="auto"
            p={{ base: 6, md: 8 }}
            borderRadius="2xl"
            borderWidth="2px"
            borderColor="neon.500"
            bg="rgba(0,194,255,0.05)"
            boxShadow="0 0 30px rgba(0,194,255,0.2), inset 0 0 20px rgba(0,194,255,0.1)"
            position="relative"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '2xl',
              padding: '2px',
              background: 'linear-gradient(135deg, rgba(0,194,255,0.5), rgba(0,209,143,0.5))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            }}
          >
            <Heading 
              size={{ base: 'lg', md: 'xl' }} 
              mb={4} 
              color="neon.400"
              textShadow="0 0 10px rgba(0,194,255,0.6), 0 0 20px rgba(0,194,255,0.4)"
            >
              🇬🇧 UK Service Coverage
            </Heading>
            <Text 
              color="neon.300" 
              fontSize={{ base: 'md', md: 'lg' }}
              fontWeight="medium"
            >
              Professional moving services across {UK_CITIES.length}+ major UK cities
            </Text>
          </Box>

          <Box
            h={{ base: '300px', md: '400px', lg: '500px' }}
            w="100%"
            borderRadius="xl"
            overflow="hidden"
            border="3px solid"
            borderColor="neon.500"
            bg="rgba(0, 0, 0, 0.8)"
            position="relative"
            boxShadow="0 0 40px rgba(0,194,255,0.3)"
            _before={{
              content: '""',
              position: 'absolute',
              top: '-3px',
              left: '-3px',
              right: '-3px',
              bottom: '-3px',
              background: 'linear-gradient(135deg, #00C2FF, #00D18F)',
              borderRadius: 'inherit',
              zIndex: -1,
              opacity: 0.7,
              filter: 'blur(12px)',
              animation: 'neon-pulse 2s ease-in-out infinite alternate'
            }}
          >
            {/* Map container - must be empty for Mapbox */}
            <div
              ref={mapContainer}
              style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                zIndex: 1
              }}
            />

            {/* Loading or Error State - positioned absolutely outside map container */}
            {!isMapLoaded && !mapError && (
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                bg="rgba(0, 0, 0, 0.9)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                zIndex={2}
                pointerEvents="none"
              >
                <Text color="gray.300" fontSize="lg">
                  Loading interactive map...
                </Text>
              </Box>
            )}

            {/* WebGL Not Supported - Show Fallback */}
            {mapError && !hasWebGL && (
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                bg="rgba(0, 0, 0, 0.95)"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                p={6}
                textAlign="center"
                zIndex={2}
                pointerEvents="auto"
              >
                <Text color="neon.400" fontSize="2xl" fontWeight="bold" mb={3}>
                  🗺️ UK Coverage Map
                </Text>
                <Text color="gray.300" fontSize="md" mb={6} maxW="400px">
                  We serve {UK_CITIES.length}+ major cities across the UK
                </Text>
                <SimpleGrid columns={2} spacing={2} w="full" maxW="400px">
                  {UK_CITIES.slice(0, 8).map((city) => (
                    <Badge
                      key={city.name}
                      colorScheme="blue"
                      fontSize="sm"
                      p={2}
                      borderRadius="md"
                      bg="rgba(0, 194, 255, 0.2)"
                      color="neon.300"
                      border="1px solid"
                      borderColor="rgba(0, 194, 255, 0.4)"
                    >
                      📍 {city.name}
                    </Badge>
                  ))}
                </SimpleGrid>
                <Text color="gray.500" fontSize="xs" mt={4}>
                  Interactive map requires WebGL support
                </Text>
              </Box>
            )}
          </Box>

          {/* Cities Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} w="100%">
            {Object.entries(citiesByCountry).map(([country, cities]) => (
              <Box 
                key={country}
                p={6}
                borderRadius="xl"
                borderWidth="2px"
                borderColor="#00C2FF"
                bg="rgba(0,194,255,0.03)"
                boxShadow="0 0 20px rgba(0,194,255,0.3)"
                position="relative"
                overflow="visible"
                className="stat-card-neon"
                transition="all 0.3s ease"
                _hover={{
                  borderColor: 'neon.400',
                  boxShadow: '0 0 30px rgba(0,194,255,0.5)',
                  transform: 'translateY(-4px)',
                }}
                sx={{
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: '-2px',
                    left: '-2px',
                    right: '-2px',
                    bottom: '-2px',
                    background: 'linear-gradient(90deg, #00C2FF, #00D18F, #00C2FF, #00D18F)',
                    backgroundSize: '300% 300%',
                    borderRadius: 'xl',
                    zIndex: -1,
                    filter: 'blur(8px)',
                    opacity: 0.6,
                    animation: 'neon-glow 3s ease-in-out infinite',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    width: '12px',
                    height: '12px',
                    background: 'radial-gradient(circle, white 0%, rgba(255,255,255,0.8) 30%, transparent 70%)',
                    borderRadius: 'full',
                    boxShadow: '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(0,194,255,0.6)',
                    zIndex: 10,
                    animation: 'light-point-move 3s linear infinite',
                  },
                }}
              >
                <Heading 
                  size="md" 
                  mb={4} 
                  color="neon.400"
                  textShadow="0 0 8px rgba(0,194,255,0.5)"
                >
                  {country === 'England' && '🏴󠁧󠁢󠁥󠁮󠁧󠁿'} {country}
                  {country === 'Scotland' && '🏴󠁧󠁢󠁳󠁣󠁴󠁿'}
                  {country === 'Wales' && '🏴󠁧󠁢󠁷󠁬󠁳󠁿'}
                  {country === 'Northern Ireland' && '🇬🇧'}
                </Heading>
                <VStack spacing={3} align="start">
                  {cities.slice(0, 6).map((city) => (
                    <HStack 
                      key={city.slug} 
                      spacing={2}
                      p={2}
                      borderRadius="md"
                      transition="all 0.2s ease"
                      _hover={{
                        bg: 'rgba(0,194,255,0.1)',
                        transform: 'translateX(4px)',
                      }}
                      w="full"
                    >
                      <Box
                        w={2}
                        h={2}
                        bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                        borderRadius="50%"
                        border="1px solid rgba(255, 255, 255, 0.5)"
                        boxShadow="0 0 8px rgba(0, 194, 255, 0.7)"
                        css={{
                          animation: 'pulse 2s ease-in-out infinite',
                          '@keyframes pulse': {
                            '0%, 100%': {
                              opacity: 1,
                            },
                            '50%': {
                              opacity: 0.6,
                            },
                          },
                        }}
                      />
                      <Text fontSize="sm" color="neon.200" fontWeight="medium">
                        {city.name}
                      </Text>
                      <Badge 
                        size="sm" 
                        colorScheme="blue" 
                        variant="subtle" 
                        bg="rgba(0, 194, 255, 0.15)" 
                        color="neon.300"
                        borderWidth="1px"
                        borderColor="rgba(0, 194, 255, 0.3)"
                        fontWeight="semibold"
                      >
                        {city.postcode}
                      </Badge>
                    </HStack>
                  ))}
                  {cities.length > 6 && (
                    <Text 
                      fontSize="sm" 
                      color="neon.300" 
                      fontStyle="italic"
                      pl={2}
                    >
                      +{cities.length - 6} more cities
                    </Text>
                  )}
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default ServiceMapSection;