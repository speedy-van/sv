'use client';

import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiMapPin, FiTruck, FiClock } from 'react-icons/fi';

interface ActiveJob {
  id: string;
  ref: string;
  status: string;
  eta: string;
  driver: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  timeSinceClaimed: number;
}

interface DashboardMapProps {
  activeJobs: ActiveJob[];
  height?: string;
  showControls?: boolean;
}

export const DashboardMap: React.FC<DashboardMapProps> = ({
  activeJobs,
  height = '300px',
  showControls = false,
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box
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
            Live Operations Map
          </Text>
          
          <HStack spacing={8} wrap="wrap" justify="center">
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
                Pickup Points
              </Text>
              <Text fontSize="xs" color="gray.600">
                {activeJobs.length} active
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
                Drivers
              </Text>
              <Text fontSize="xs" color="gray.600">
                {activeJobs.length} on route
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
                Delivery Points
              </Text>
              <Text fontSize="xs" color="gray.600">
                {activeJobs.length} destinations
              </Text>
            </VStack>
          </HStack>

          {/* Active Jobs Summary */}
          {activeJobs.length > 0 && (
            <VStack spacing={2} mt={4}>
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Active Jobs Summary
              </Text>
              <HStack spacing={4} wrap="wrap" justify="center">
                {activeJobs.slice(0, 3).map((job) => (
                  <Badge
                    key={job.id}
                    colorScheme="blue"
                    px={3}
                    py={1}
                    borderRadius="full"
                  >
                    {job.ref} - {job.driver}
                  </Badge>
                ))}
                {activeJobs.length > 3 && (
                  <Badge colorScheme="gray" px={3} py={1} borderRadius="full">
                    +{activeJobs.length - 3} more
                  </Badge>
                )}
              </HStack>
            </VStack>
          )}
        </VStack>

        {/* Simulated route lines */}
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
        <Box
          position="absolute"
          top="30%"
          left="20%"
          right="20%"
          height="1px"
          bg="green.400"
          borderRadius="full"
          opacity={0.4}
          transform="translateY(-50%)"
        />
        <Box
          position="absolute"
          top="70%"
          left="15%"
          right="15%"
          height="1px"
          bg="red.400"
          borderRadius="full"
          opacity={0.4}
          transform="translateY(-50%)"
        />
      </Box>

      {/* Map controls overlay */}
      {showControls && (
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
      )}

      {/* Legend */}
      <Box
        position="absolute"
        bottom={4}
        left={4}
        bg="white"
        borderRadius="md"
        p={3}
        boxShadow="md"
      >
        <VStack spacing={2} align="start">
          <Text fontSize="sm" fontWeight="medium">
            Legend
          </Text>
          <HStack spacing={2}>
            <Box w={3} h={3} bg="green.500" borderRadius="full" />
            <Text fontSize="xs">Pickup</Text>
          </HStack>
          <HStack spacing={2}>
            <Box w={3} h={3} bg="blue.500" borderRadius="full" />
            <Text fontSize="xs">Driver</Text>
          </HStack>
          <HStack spacing={2}>
            <Box w={3} h={3} bg="red.500" borderRadius="full" />
            <Text fontSize="xs">Delivery</Text>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default DashboardMap;
