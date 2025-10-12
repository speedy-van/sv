'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Spinner,
  Progress,
  Divider,
  Icon,
  Select,
  ButtonGroup,
} from '@chakra-ui/react';
import {
  FaExclamationTriangle,
  FaClock,
  FaUserTie,
  FaMoneyBillWave,
  FaTruck,
  FaCheckCircle,
  FaSync,
  FaBell,
  FaUsers,
  FaMapMarkerAlt,
} from 'react-icons/fa';

interface EnhancedAdminDashboardProps {
  refreshInterval?: number;
}

export default function EnhancedAdminDashboard({ 
  refreshInterval = 30000 // 30 seconds
}: EnhancedAdminDashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const toast = useToast();

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      loadDashboardData(true); // Silent refresh
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      
      setError(null);

      const response = await fetch('/api/admin/dashboard-enhanced');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load dashboard data');
      }

      const data = await response.json();
      setDashboardData(data.data);
      
      console.log('✅ Admin dashboard data loaded:', data.data.statistics);

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      
      if (!silent) {
        toast({
          title: 'Error Loading Dashboard',
          description: 'Failed to load dashboard data. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleQuickAssign = async (bookingId: string, driverId?: string) => {
    try {
      const targetDriverId = driverId || selectedDriver;
      
      if (!targetDriverId) {
        toast({
          title: 'No Driver Selected',
          description: 'Please select a driver to assign the job.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const response = await fetch('/api/admin/dispatch/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: bookingId,
          driverId: targetDriverId
        })
      });

      if (response.ok) {
        toast({
          title: 'Job Assigned!',
          description: 'The job has been successfully assigned to the driver.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Reload dashboard data
        await loadDashboardData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Assignment failed');
      }
    } catch (error) {
      toast({
        title: 'Assignment Failed',
        description: error instanceof Error ? error.message : 'Failed to assign job.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      default: return 'green';
    }
  };

  const formatWaitingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (isLoading) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="center">
          <Spinner size="xl" color="blue.500" />
          <Text>Loading admin dashboard...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="7xl" py={8}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertTitle>Dashboard Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
            <Button mt={3} size="sm" onClick={() => loadDashboardData()}>
              Try Again
            </Button>
          </Box>
        </Alert>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container maxW="7xl" py={8}>
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <AlertDescription>No dashboard data available.</AlertDescription>
        </Alert>
      </Container>
    );
  }

  const { alerts, statistics, unassignedBookings, availableDrivers, recentActivity } = dashboardData;

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header with Refresh */}
        <HStack justify="space-between">
          <Box>
            <Heading size="lg" mb={2}>
              Admin Dashboard
            </Heading>
            <Text color="gray.600">
              Real-time overview of bookings, assignments, and operations
            </Text>
          </Box>
          <Button
            leftIcon={<FaSync />}
            onClick={() => loadDashboardData()}
            isLoading={isRefreshing}
            loadingText="Refreshing..."
            variant="outline"
          >
            Refresh
          </Button>
        </HStack>

        {/* Alerts Section */}
        {alerts.unassignedBookings > 0 && (
          <Alert 
            status={alerts.slaBreached > 0 ? 'error' : 'warning'} 
            borderRadius="lg"
          >
            <AlertIcon />
            <Box>
              <AlertTitle>
                {alerts.unassignedBookings} Booking{alerts.unassignedBookings > 1 ? 's' : ''} Need Driver Assignment
              </AlertTitle>
              <AlertDescription>
                {alerts.slaBreached > 0 && (
                  <Text color="red.600" fontWeight="bold">
                    🚨 {alerts.slaBreached} booking{alerts.slaBreached > 1 ? 's' : ''} have breached SLA (30+ minutes)
                  </Text>
                )}
                {alerts.urgentBookings > 0 && (
                  <Text color="orange.600">
                    ⚠️ {alerts.urgentBookings} urgent booking{alerts.urgentBookings > 1 ? 's' : ''} require immediate attention
                  </Text>
                )}
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Statistics Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 6 }} spacing={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Today's Revenue</StatLabel>
                <StatNumber>£{statistics.todayRevenue.toFixed(2)}</StatNumber>
                <StatHelpText>
                  <Icon as={FaMoneyBillWave} color="green.500" />
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Active Jobs</StatLabel>
                <StatNumber>{statistics.activeJobs}</StatNumber>
                <StatHelpText>
                  <Icon as={FaTruck} color="blue.500" />
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Pending Assignments</StatLabel>
                <StatNumber color={statistics.pendingAssignments > 0 ? 'red.500' : 'green.500'}>
                  {statistics.pendingAssignments}
                </StatNumber>
                <StatHelpText>
                  <Icon as={FaExclamationTriangle} color={statistics.pendingAssignments > 0 ? 'red.500' : 'green.500'} />
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Completed Today</StatLabel>
                <StatNumber>{statistics.completedToday}</StatNumber>
                <StatHelpText>
                  <Icon as={FaCheckCircle} color="green.500" />
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Driver Utilization</StatLabel>
                <StatNumber>{statistics.driverUtilization}%</StatNumber>
                <StatHelpText>
                  <Icon as={FaUsers} color="blue.500" />
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Today's Bookings</StatLabel>
                <StatNumber>{statistics.todayBookings}</StatNumber>
                <StatHelpText>
                  <Icon as={FaBell} color="purple.500" />
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Unassigned Bookings Section */}
        {unassignedBookings.length > 0 && (
          <Card>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">
                  🚨 Bookings Awaiting Driver Assignment
                </Heading>
                <HStack>
                  <Select
                    placeholder="Select driver for quick assign"
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    size="sm"
                    maxW="200px"
                  >
                    {availableDrivers.map((driver: any) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({driver.currentJobs} jobs)
                      </option>
                    ))}
                  </Select>
                </HStack>
              </HStack>
            </CardHeader>
            <CardBody>
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Booking</Th>
                    <Th>Customer</Th>
                    <Th>Route</Th>
                    <Th>Scheduled</Th>
                    <Th>Amount</Th>
                    <Th>Waiting</Th>
                    <Th>Priority</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {unassignedBookings.map((booking: any) => (
                    <Tr key={booking.id}>
                      <Td>
                        <Text fontFamily="mono" fontSize="sm">
                          {booking.reference}
                        </Text>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="medium">
                            {booking.customer}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {booking.customerPhone}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={0}>
                          <Text fontSize="xs">
                            From: {booking.pickupAddress}
                          </Text>
                          <Text fontSize="xs">
                            To: {booking.dropoffAddress}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {new Date(booking.scheduledAt).toLocaleDateString()}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(booking.scheduledAt).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontWeight="bold">
                          £{booking.totalAmount.toFixed(2)}
                        </Text>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={booking.slaBreached ? 'red' : 'yellow'}
                          size="sm"
                        >
                          {formatWaitingTime(booking.waitingMinutes)}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={getPriorityColor(booking.priority)}
                          size="sm"
                        >
                          {booking.priority}
                        </Badge>
                      </Td>
                      <Td>
                        <ButtonGroup size="xs" spacing={1}>
                          <Button
                            colorScheme="blue"
                            onClick={() => handleQuickAssign(booking.id)}
                            isDisabled={!selectedDriver}
                          >
                            Assign
                          </Button>
                          <Button variant="outline">
                            View
                          </Button>
                        </ButtonGroup>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        )}

        {/* Available Drivers Section */}
        <Card>
          <CardHeader>
            <Heading size="md">
              🚛 Available Drivers ({availableDrivers.length})
            </Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {availableDrivers.map((driver: any) => (
                <Card key={driver.id} size="sm" variant="outline">
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <HStack justify="space-between" w="100%">
                        <Text fontWeight="medium">{driver.name}</Text>
                        <Badge 
                          colorScheme={driver.isOnline ? 'green' : 'gray'}
                          size="sm"
                        >
                          {driver.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        Current jobs: {driver.currentJobs}/3
                      </Text>
                      <Progress 
                        value={(driver.currentJobs / 3) * 100} 
                        size="sm" 
                        colorScheme={driver.currentJobs >= 3 ? 'red' : 'green'}
                        w="100%"
                      />
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <Heading size="md">Recent Activity</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              {recentActivity.slice(0, 5).map((activity: any) => (
                <HStack key={activity.id} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                  <HStack>
                    <Icon as={getActivityIcon(activity.action)} color="blue.500" />
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="medium">
                        {formatActivityMessage(activity.action)}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        by {activity.actorName}
                      </Text>
                    </VStack>
                  </HStack>
                  <Text fontSize="xs" color="gray.500">
                    {new Date(activity.createdAt).toLocaleTimeString()}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}

// Helper functions
function getActivityIcon(action: string) {
  switch (action) {
    case 'booking_created': return FaBell;
    case 'job_assigned': return FaUserTie;
    case 'booking_completed': return FaCheckCircle;
    default: return FaBell;
  }
}

function formatActivityMessage(action: string) {
  switch (action) {
    case 'booking_created': return 'New booking created';
    case 'job_assigned': return 'Job assigned to driver';
    case 'booking_completed': return 'Booking completed';
    default: return action.replace('_', ' ');
  }
}
