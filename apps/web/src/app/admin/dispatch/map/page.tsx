import React from 'react';
import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  Badge,
  Card,
  CardBody,
  Button,
  Select,
  Input,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { FiMap, FiTruck, FiUsers, FiSettings, FiFilter } from 'react-icons/fi';

export default function DispatchMapPage() {
  // Mock data - in real implementation, this would come from API
  const drivers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      status: 'online',
      location: 'London Bridge',
      rating: 4.8,
      currentJob: 'ORD-001',
    },
    {
      id: 2,
      name: 'Mike Wilson',
      status: 'online',
      location: 'Canary Wharf',
      rating: 4.6,
      currentJob: null,
    },
    {
      id: 3,
      name: 'Emma Davis',
      status: 'break',
      location: 'Camden',
      rating: 4.9,
      currentJob: null,
    },
    {
      id: 4,
      name: 'Tom Brown',
      status: 'offline',
      location: 'Shoreditch',
      rating: 4.7,
      currentJob: null,
    },
  ];

  const activeJobs = [
    {
      id: 1,
      ref: 'ORD-001',
      status: 'en-route',
      pickup: 'High Street',
      dropoff: 'Oxford Street',
      driver: 'Sarah J.',
    },
    {
      id: 2,
      ref: 'ORD-002',
      status: 'at-pickup',
      pickup: 'Regent Street',
      dropoff: 'Bond Street',
      driver: 'Mike W.',
    },
    {
      id: 3,
      ref: 'ORD-003',
      status: 'unassigned',
      pickup: 'Carnaby Street',
      dropoff: 'Soho',
      driver: null,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'green';
      case 'break':
        return 'yellow';
      case 'offline':
        return 'gray';
      case 'en-route':
        return 'blue';
      case 'at-pickup':
        return 'orange';
      case 'unassigned':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">Live Dispatch Map</Heading>
          <Text color="gray.600">Real-time driver and job tracking</Text>
        </VStack>
        <HStack spacing={3}>
          <Button leftIcon={<FiFilter />} variant="outline" size="sm">
            Filters
          </Button>
          <Button leftIcon={<FiSettings />} variant="outline" size="sm">
            Settings
          </Button>
          <Button colorScheme="blue" size="sm">
            Auto Assign
          </Button>
        </HStack>
      </HStack>

      <Grid templateColumns={{ base: '1fr', lg: '1fr 350px' }} gap={6}>
        {/* Map Area */}
        <Card>
          <CardBody p={0}>
            <Box
              height="600px"
              bg="gray.100"
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
              position="relative"
            >
              <VStack spacing={4}>
                <FiMap size={48} color="#666" />
                <Text color="gray.500" fontSize="lg">
                  Interactive Map Component
                </Text>
                <Text color="gray.400" fontSize="sm">
                  Will integrate with Google Maps or Mapbox
                </Text>
              </VStack>

              {/* Map Controls Overlay */}
              <Box position="absolute" top={4} left={4}>
                <VStack spacing={2}>
                  <Button size="sm" variant="outline" bg="white">
                    Traffic
                  </Button>
                  <Button size="sm" variant="outline" bg="white">
                    Heat Map
                  </Button>
                  <Button size="sm" variant="outline" bg="white">
                    Draw Radius
                  </Button>
                </VStack>
              </Box>

              {/* Legend */}
              <Box
                position="absolute"
                bottom={4}
                sx={{ right: '16px' }}
                bg="white"
                p={3}
                borderRadius="md"
                boxShadow="md"
              >
                <VStack spacing={2} align="start">
                  <Text fontSize="sm" fontWeight="bold">
                    Legend
                  </Text>
                  <HStack spacing={2}>
                    <Box w={3} h={3} bg="green.500" borderRadius="full" />
                    <Text fontSize="xs">Available Drivers</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Box w={3} h={3} bg="blue.500" borderRadius="full" />
                    <Text fontSize="xs">Active Jobs</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Box w={3} h={3} bg="red.500" borderRadius="full" />
                    <Text fontSize="xs">Unassigned Jobs</Text>
                  </HStack>
                </VStack>
              </Box>
            </Box>
          </CardBody>
        </Card>

        {/* Sidebar */}
        <VStack spacing={6} align="stretch">
          {/* Auto-Assign Rules */}
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>
                Auto-Assign Rules
              </Heading>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm">Radius (km)</Text>
                  <Input size="sm" w="80px" defaultValue="5" />
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Max Jobs</Text>
                  <Input size="sm" w="80px" defaultValue="3" />
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="sm">Min Rating</Text>
                  <Input size="sm" w="80px" defaultValue="4.0" />
                </HStack>
                <Button size="sm" colorScheme="blue">
                  Apply Rules
                </Button>
              </VStack>
            </CardBody>
          </Card>

          {/* Active Drivers */}
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>
                Active Drivers
              </Heading>
              <VStack spacing={3} align="stretch">
                {drivers
                  .filter(d => d.status !== 'offline')
                  .map(driver => (
                    <HStack
                      key={driver.id}
                      justify="space-between"
                      p={2}
                      bg="gray.50"
                      borderRadius="md"
                    >
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold" fontSize="sm">
                          {driver.name}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {driver.location}
                        </Text>
                        {driver.currentJob && (
                          <Text fontSize="xs" color="blue.600">
                            Job: {driver.currentJob}
                          </Text>
                        )}
                      </VStack>
                      <VStack align="end" spacing={1}>
                        <Badge
                          colorScheme={getStatusColor(driver.status)}
                          size="sm"
                        >
                          {driver.status}
                        </Badge>
                        <Text fontSize="xs">{driver.rating} ⭐</Text>
                      </VStack>
                    </HStack>
                  ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Active Jobs */}
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>
                Active Jobs
              </Heading>
              <VStack spacing={3} align="stretch">
                {activeJobs.map(job => (
                  <HStack
                    key={job.id}
                    justify="space-between"
                    p={2}
                    bg="gray.50"
                    borderRadius="md"
                  >
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold" fontSize="sm">
                        {job.ref}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        {job.pickup} → {job.dropoff}
                      </Text>
                      {job.driver && (
                        <Text fontSize="xs" color="blue.600">
                          Driver: {job.driver}
                        </Text>
                      )}
                    </VStack>
                    <Badge colorScheme={getStatusColor(job.status)} size="sm">
                      {job.status.replace('-', ' ')}
                    </Badge>
                  </HStack>
                ))}
              </VStack>
            </CardBody>
          </Card>

          {/* Incidents */}
          <Card>
            <CardBody>
              <Heading size="md" mb={4}>
                Recent Incidents
              </Heading>
              <VStack spacing={3} align="stretch">
                <HStack
                  justify="space-between"
                  p={2}
                  bg="red.50"
                  borderRadius="md"
                >
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" fontSize="sm">
                      Late Pickup
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      ORD-003 • 15 min overdue
                    </Text>
                  </VStack>
                  <Button size="xs" colorScheme="red">
                    Resolve
                  </Button>
                </HStack>
                <HStack
                  justify="space-between"
                  p={2}
                  bg="yellow.50"
                  borderRadius="md"
                >
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" fontSize="sm">
                      Vehicle Issue
                    </Text>
                    <Text fontSize="xs" color="gray.600">
                      Sarah J. • Flat tire
                    </Text>
                  </VStack>
                  <Button size="xs" colorScheme="yellow">
                    Escalate
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Grid>
    </Box>
  );
}
