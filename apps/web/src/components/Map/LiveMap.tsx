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
} from '@chakra-ui/react';
import { FiMapPin, FiTruck, FiClock } from 'react-icons/fi';

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
  height?: number;
  showRoute?: boolean;
  showETA?: boolean;
  eta?: string;
}

const LiveMap: React.FC<LiveMapProps> = ({
  driverLocation,
  driverLocations,
  pickupLocation,
  dropoffLocation,
  height = 400,
  showRoute = true,
  showETA = true,
  eta,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simulate map initialization
        await new Promise(resolve => setTimeout(resolve, 1000));

        // For now, we'll show a placeholder map
        // In a real implementation, you would initialize Mapbox or Google Maps here
        setMap({ initialized: true });
        setIsLoading(false);
      } catch (err) {
        setError('Failed to load map');
        setIsLoading(false);
      }
    };

    initializeMap();
  }, []);

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
          <Spinner size="xl" color="blue.500" />
          <Text color="text.secondary">Loading map...</Text>
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
      >
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      ref={mapRef}
      h={height}
      bg={bgColor}
      border={`1px solid ${borderColor}`}
      borderRadius="lg"
      position="relative"
      overflow="hidden"
    >
      {/* Map Placeholder */}
      <Box
        w="full"
        h="full"
        bg="linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        position="relative"
      >
        {/* Simulated map content */}
        <VStack spacing={6} textAlign="center">
          <Text fontSize="lg" fontWeight="bold" color="blue.600">
            Live Tracking Map
          </Text>
          
          <HStack spacing={8}>
            <VStack spacing={2}>
              <Box
                p={3}
                bg="green.500"
                color="white"
                borderRadius="full"
                boxShadow="lg"
              >
                <FiMapPin size={20} />
              </Box>
              <Text fontSize="sm" fontWeight="medium">
                Pickup
              </Text>
              <Text fontSize="xs" color="gray.600">
                {pickupLocation.label}
              </Text>
            </VStack>

            <VStack spacing={2}>
              <Box
                p={3}
                bg="blue.500"
                color="white"
                borderRadius="full"
                boxShadow="lg"
                animation="pulse 2s infinite"
              >
                <FiTruck size={20} />
              </Box>
              <Text fontSize="sm" fontWeight="medium">
                {driverLocations && driverLocations.length > 1 ? 'Drivers' : 'Driver'}
              </Text>
              <Text fontSize="xs" color="gray.600">
                {driverLocations && driverLocations.length > 0 
                  ? `${driverLocations.length} active`
                  : driverLocation?.label || 'No driver'
                }
              </Text>
            </VStack>

            <VStack spacing={2}>
              <Box
                p={3}
                bg="red.500"
                color="white"
                borderRadius="full"
                boxShadow="lg"
              >
                <FiMapPin size={20} />
              </Box>
              <Text fontSize="sm" fontWeight="medium">
                Delivery
              </Text>
              <Text fontSize="xs" color="gray.600">
                {dropoffLocation.label}
              </Text>
            </VStack>
          </HStack>

          {showETA && eta && (
            <Badge colorScheme="blue" size="lg" px={4} py={2}>
              <HStack spacing={2}>
                <FiClock />
                <Text>ETA: {eta}</Text>
              </HStack>
            </Badge>
          )}
        </VStack>

        {/* Simulated route line */}
        {showRoute && (
          <Box
            position="absolute"
            top="50%"
            left="10%"
            right="10%"
            height="2px"
            bg="blue.400"
            borderRadius="full"
            opacity={0.6}
            transform="translateY(-50%)"
          />
        )}
      </Box>

      {/* Map controls overlay */}
      <Box
        position="absolute"
        top={4}
        right={4}
        bg="white"
        borderRadius="md"
        p={2}
        boxShadow="md"
      >
        <VStack spacing={1}>
          <Badge colorScheme="green" size="sm">
            Live
          </Badge>
          <Text fontSize="xs" color="gray.600">
            Real-time
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default LiveMap;
