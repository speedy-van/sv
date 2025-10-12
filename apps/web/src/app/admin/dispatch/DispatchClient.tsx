'use client';

import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Button,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import {
  FaTruck,
  FaUserTie,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMapMarkedAlt,
  FaUsers,
  FaClock,
} from 'react-icons/fa';

interface DispatchData {
  jobsByStatus: Record<string, number>;
  activeJobs: any[];
  availableDrivers: any[];
  openIncidents: any[];
  autoAssignRules: any;
}

interface DispatchClientProps {
  data: DispatchData;
}

export default function DispatchClient({ data }: DispatchClientProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Error boundary for component
  if (error) {
    return (
      <Box p={6}>
        <Alert status="error" mb={4}>
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => setError(null)} colorScheme="blue">
          Try Again
        </Button>
      </Box>
    );
  }

  // Validate data structure with better error handling
  if (!data || typeof data !== 'object') {
    return (
      <Box p={6}>
        <Alert status="error" mb={4}>
          <AlertIcon />
          <AlertTitle>Data Error!</AlertTitle>
          <AlertDescription>
            Invalid dispatch data received. Please refresh the page.
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} colorScheme="blue">
          Refresh Page
        </Button>
      </Box>
    );
  }

  // Additional validation for required data properties
  if (
    !data.jobsByStatus ||
    !data.activeJobs ||
    !data.availableDrivers ||
    !data.openIncidents
  ) {
    return (
      <Box p={6}>
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <AlertTitle>Incomplete Data!</AlertTitle>
          <AlertDescription>
            Some dispatch data is missing. Please refresh the page.
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} colorScheme="blue">
          Refresh Page
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'gray';
      case 'CONFIRMED':
        return 'blue';
      case 'COMPLETED':
        return 'green';
      case 'CANCELLED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const handleAssignJob = async (jobId: string, driverId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/dispatch/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          driverId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Job assigned successfully',
          description: 'The job has been assigned to the driver',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // Refresh data
        window.location.reload();
      } else {
        throw new Error('Assignment failed');
      }
    } catch (error) {
      toast({
        title: 'Assignment failed',
        description: 'Failed to assign job to driver',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <VStack align="start" spacing={4} mb={6}>
        <Heading size="lg">Dispatch & Operations</Heading>
        <Text color="gray.600">
          Manage job assignments and monitor operations
        </Text>
      </VStack>

      {/* Stats Overview */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Jobs</StatLabel>
              <StatNumber>
                {Object.values(data.jobsByStatus).reduce((a, b) => a + b, 0)}
              </StatNumber>
              <StatHelpText>
                <FaTruck style={{ display: 'inline', marginRight: '4px' }} />
                All statuses
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Available Drivers</StatLabel>
              <StatNumber>{data.availableDrivers.length}</StatNumber>
              <StatHelpText>
                <FaUsers style={{ display: 'inline', marginRight: '4px' }} />
                Online drivers
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Active Jobs</StatLabel>
              <StatNumber>{data.activeJobs.length}</StatNumber>
              <StatHelpText>
                <FaClock style={{ display: 'inline', marginRight: '4px' }} />
                In progress
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Open Incidents</StatLabel>
              <StatNumber color="red.500">
                {data.openIncidents.length}
              </StatNumber>
              <StatHelpText>
                <FaExclamationTriangle
                  style={{ display: 'inline', marginRight: '4px' }}
                />
                Requires attention
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Job Status Overview */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Job Status Overview</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            {Object.entries(data.jobsByStatus).map(([status, count]) => (
              <Box
                key={status}
                textAlign="center"
                p={4}
                borderWidth={1}
                borderRadius="md"
              >
                <Badge colorScheme={getStatusColor(status)} mb={2}>
                  {status}
                </Badge>
                <Text fontSize="2xl" fontWeight="bold">
                  {count}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  jobs
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Active Jobs */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Active Jobs</Heading>
        </CardHeader>
        <CardBody>
          {data.activeJobs.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={8}>
              No active jobs at the moment
            </Text>
          ) : (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Reference</Th>
                  <Th>Customer</Th>
                  <Th>Driver</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.activeJobs.slice(0, 10).map(job => (
                  <Tr key={job.id}>
                    <Td>
                      <Text fontWeight="bold" fontSize="sm">
                        {job.reference}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {job.customer && job.customer.name
                          ? job.customer.name
                          : 'Unknown'}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {job.driver && job.driver.user && job.driver.user.name
                          ? job.driver.user.name
                          : 'Unassigned'}
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(job.status)} size="sm">
                        {job.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </Text>
                    </Td>
                    <Td>
                      {!job.driver && data.availableDrivers.length > 0 && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          isLoading={loading}
                          onClick={() =>
                            handleAssignJob(job.id, data.availableDrivers[0].id)
                          }
                        >
                          Assign
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Available Drivers */}
      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Available Drivers</Heading>
        </CardHeader>
        <CardBody>
          {data.availableDrivers.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={8}>
              No drivers available at the moment
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {data.availableDrivers.map(driver => (
                <Box key={driver.id} p={4} borderWidth={1} borderRadius="md">
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold">
                      {driver.user && driver.user.name
                        ? driver.user.name
                        : 'Unknown'}
                    </Text>
                    <Badge colorScheme="green" size="sm">
                      Available
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {driver.user && driver.user.email
                      ? driver.user.email
                      : 'No email'}
                  </Text>
                  {driver.vehicles && driver.vehicles.length > 0 && (
                    <Text fontSize="sm" color="gray.600">
                      Vehicle: {driver.vehicles[0].make}{' '}
                      {driver.vehicles[0].model}
                    </Text>
                  )}
                </Box>
              ))}
            </SimpleGrid>
          )}
        </CardBody>
      </Card>

      {/* Open Incidents */}
      {data.openIncidents.length > 0 && (
        <Card>
          <CardHeader>
            <Heading size="md">Open Incidents</Heading>
          </CardHeader>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Driver</Th>
                  <Th>Type</Th>
                  <Th>Description</Th>
                  <Th>Reported</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.openIncidents.map(incident => (
                  <Tr key={incident.id}>
                    <Td>
                      <Text fontSize="sm">
                        {incident.driver &&
                        incident.driver.user &&
                        incident.driver.user.name
                          ? incident.driver.user.name
                          : 'Unknown'}
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme="red" size="sm">
                        {incident.type}
                      </Badge>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{incident.description}</Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {new Date(incident.createdAt).toLocaleDateString()}
                      </Text>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}
    </Box>
  );
}
