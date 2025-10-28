'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  CardBody,
  CardHeader,
  Badge,
  Button,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Icon,
  Select,
  useBreakpointValue,
  Flex,
  Avatar,
  Progress,
  Circle,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import {
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaTruck,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowRight,
  FaSync,
  FaCalendarCheck,
  FaCalendarTimes,
  FaUser,
  FaFilter,
} from 'react-icons/fa';
import AdminShell from '@/components/admin/AdminShell';

interface DriverSchedule {
  driverId: string;
  driverName: string;
  driverEmail: string;
  totalJobs: number;
  completedJobs: number;
  upcomingJobs: number;
  todaysJobs: number;
  totalAssignments: number;
  acceptedAssignments: number;
  declinedAssignments: number;
  acceptanceRate: number;
  jobs: ScheduledJob[];
  declinedJobs: any[];
}

interface ScheduledJob {
  id: string;
  reference: string;
  scheduledAt: string;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  totalValue: number;
  duration: number;
  priority: 'low' | 'medium' | 'high';
  type: 'single-drop' | 'multi-drop';
}

export default function AdminDriverSchedulePage() {
  const [drivers, setDrivers] = useState<DriverSchedule[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  const isMobile = useBreakpointValue({ base: true, md: false });

  // Load driver schedules
  const loadDriverSchedules = useCallback(async () => {
    try {
      setRefreshing(true);

      const response = await fetch(`/api/admin/drivers/schedule?date=${selectedDate}&driver=${selectedDriver}`);

      if (!response.ok) {
        throw new Error('Failed to load driver schedules');
      }

      const result = await response.json();
      setDrivers(result.data || []);

    } catch (error) {
      console.error('Error loading driver schedules:', error);
      toast({
        title: 'Error',
        description: 'Failed to load driver schedules',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate, selectedDriver, toast]);

  useEffect(() => {
    loadDriverSchedules();

    // Set up Pusher for real-time route updates
    if (typeof window !== 'undefined' && (window as any).Pusher) {
      const PUSHER_KEY = '407cb06c423e6c032e9c';
      const PUSHER_CLUSTER = 'eu';
      const pusher = new (window as any).Pusher(PUSHER_KEY, {
        cluster: PUSHER_CLUSTER,
      });

      const channel = pusher.subscribe('admin-channel');

      // Listen for route accepted events
      channel.bind('route-accepted', (data: any) => {
        console.log('🎉 Route accepted notification:', data);
        toast({
          title: 'New Route Accepted',
          description: `${data.driverName} accepted a route with ${data.dropCount} stops`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Refresh schedules
        loadDriverSchedules();
      });

      // Listen for route declined events
      channel.bind('route-declined', (data: any) => {
        console.log('⚠️ Route declined notification:', data);
        toast({
          title: 'Route Declined',
          description: `${data.driverName} declined a route with ${data.dropCount} stops`,
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        // Refresh schedules
        loadDriverSchedules();
      });

      // Listen for route completed events
      channel.bind('route-completed', (data: any) => {
        console.log('✅ Route completed notification:', data);
        toast({
          title: 'Route Completed',
          description: `${data.driverName} completed a route with ${data.totalDrops} stops`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Refresh schedules
        loadDriverSchedules();
      });

      return () => {
        channel.unbind_all();
        channel.unsubscribe();
      };
    }
  }, [loadDriverSchedules, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'blue';
      case 'in_progress': return 'orange';
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount / 100);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  if (loading) {
    return (
      <AdminShell
        title="Driver Schedule Management"
        subtitle="View and manage driver schedules by date and time"
      >
        <VStack spacing={8} py={8}>
          <Spinner size="xl" />
          <Text>Loading driver schedules...</Text>
        </VStack>
      </AdminShell>
    );
  }

  const filteredDrivers = selectedDriver === 'all'
    ? drivers
    : drivers.filter(d => d.driverId === selectedDriver);

  const totalJobs = drivers.reduce((sum, d) => sum + d.totalJobs, 0);
  const totalCompleted = drivers.reduce((sum, d) => sum + d.completedJobs, 0);
  const totalUpcoming = drivers.reduce((sum, d) => sum + d.upcomingJobs, 0);
  const totalDeclined = drivers.reduce((sum, d) => sum + d.declinedAssignments, 0);
  const avgAcceptanceRate = drivers.length > 0
    ? drivers.reduce((sum, d) => sum + d.acceptanceRate, 0) / drivers.length
    : 100;

  return (
    <AdminShell
      title="Driver Schedule Management"
      subtitle="View and manage driver schedules organized by date and time"
      actions={
        <HStack spacing={3}>
          <Select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            size="sm"
            w="200px"
          >
            <option value="all">All Drivers</option>
            {drivers.map(driver => (
              <option key={driver.driverId} value={driver.driverId}>
                {driver.driverName}
              </option>
            ))}
          </Select>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: '4px 8px',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
          <Button
            leftIcon={<FaSync />}
            onClick={loadDriverSchedules}
            isLoading={refreshing}
            loadingText="Refreshing..."
            size="sm"
            colorScheme="brand"
          >
            Refresh
          </Button>
        </HStack>
      }
    >
      <VStack spacing={6} align="stretch">
        {/* Overview Stats */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Card
            bg="bg.card"
            border="1px solid"
            borderColor="border.primary"
            borderRadius="xl"
            _before={{
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'xl',
              padding: '1px',
              background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            }}
          >
            <CardBody>
              <Stat>
                <StatLabel color="text.secondary">
                  <HStack>
                    <Icon as={FaCalendarAlt} />
                    <Text>Total Jobs</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="text.primary" fontSize="2xl">
                  {totalJobs}
                </StatNumber>
                <StatHelpText color="text.tertiary">
                  For selected date
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card
            bg="bg.card"
            border="1px solid"
            borderColor="border.primary"
            borderRadius="xl"
            _before={{
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'xl',
              padding: '1px',
              background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            }}
          >
            <CardBody>
              <Stat>
                <StatLabel color="text.secondary">
                  <HStack>
                    <Icon as={FaCheckCircle} />
                    <Text>Completed</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="success.500" fontSize="2xl">
                  {totalCompleted}
                </StatNumber>
                <StatHelpText color="text.tertiary">
                  Jobs finished
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card
            bg="bg.card"
            border="1px solid"
            borderColor="border.primary"
            borderRadius="xl"
            _before={{
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'xl',
              padding: '1px',
              background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            }}
          >
            <CardBody>
              <Stat>
                <StatLabel color="text.secondary">
                  <HStack>
                    <Icon as={FaClock} />
                    <Text>Upcoming</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="warning.500" fontSize="2xl">
                  {totalUpcoming}
                </StatNumber>
                <StatHelpText color="text.tertiary">
                  Scheduled jobs
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card
            bg="bg.card"
            border="1px solid"
            borderColor="border.primary"
            borderRadius="xl"
            _before={{
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'xl',
              padding: '1px',
              background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            }}
          >
            <CardBody>
              <Stat>
                <StatLabel color="text.secondary">
                  <HStack>
                    <Icon as={FaUser} />
                    <Text>Active Drivers</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="text.primary" fontSize="2xl">
                  {filteredDrivers.length}
                </StatNumber>
                <StatHelpText color="text.tertiary">
                  With jobs today
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Acceptance Rate and Declined Jobs Overview */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Card
            bg="bg.card"
            border="1px solid"
            borderColor="border.primary"
            borderRadius="xl"
            _before={{
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'xl',
              padding: '1px',
              background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            }}
          >
            <CardBody>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" fontWeight="semibold" color="text.primary">
                    Average Acceptance Rate
                  </Text>
                  <Text fontSize="lg" fontWeight="bold" color="text.primary">
                    {avgAcceptanceRate.toFixed(1)}%
                  </Text>
                </HStack>
                <Progress
                  value={avgAcceptanceRate}
                  colorScheme={avgAcceptanceRate >= 80 ? 'green' : avgAcceptanceRate >= 60 ? 'yellow' : 'red'}
                  size="lg"
                  borderRadius="md"
                />
                <Text fontSize="xs" color="text.tertiary">
                  Based on last 30 days of assignments
                </Text>
              </VStack>
            </CardBody>
          </Card>

          <Card
            bg="bg.card"
            border="1px solid"
            borderColor="border.primary"
            borderRadius="xl"
            _before={{
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'xl',
              padding: '1px',
              background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            }}
          >
            <CardBody>
              <Stat>
                <StatLabel color="text.secondary">
                  <HStack>
                    <Icon as={FaCalendarTimes} />
                    <Text>Total Declined Jobs</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="error.500" fontSize="2xl">
                  {totalDeclined}
                </StatNumber>
                <StatHelpText color="text.tertiary">
                  Jobs declined today
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Driver Schedules */}
        <Card
          bg="bg.card"
          border="1px solid"
          borderColor="border.primary"
          borderRadius="xl"
          _before={{
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'xl',
            padding: '1px',
            background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          }}
        >
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md" color="text.primary">
                Driver Schedules - {formatDate(selectedDate)}
              </Heading>

              {filteredDrivers.length === 0 ? (
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>No drivers scheduled</AlertTitle>
                    <AlertDescription>
                      No drivers have jobs scheduled for the selected date.
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : (
                <VStack spacing={6} align="stretch">
                  {filteredDrivers.map((driver) => (
                    <Card key={driver.driverId} variant="outline" borderColor="border.secondary">
                      <CardHeader>
                        <HStack justify="space-between" align="start">
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Avatar size="sm" name={driver.driverName} />
                              <Box>
                                <Text fontWeight="semibold" color="text.primary">
                                  {driver.driverName}
                                </Text>
                                <Text fontSize="sm" color="text.secondary">
                                  {driver.driverEmail}
                                </Text>
                              </Box>
                            </HStack>
                          </VStack>
                          <VStack align="end" spacing={1}>
                            <HStack spacing={2}>
                              <Badge bg="success.500" color="white">
                                {driver.completedJobs} completed
                              </Badge>
                              <Badge bg="warning.500" color="white">
                                {driver.upcomingJobs} upcoming
                              </Badge>
                              <Badge bg={driver.acceptanceRate >= 80 ? 'green.500' : driver.acceptanceRate >= 60 ? 'yellow.500' : 'red.500'} color="white">
                                {driver.acceptanceRate.toFixed(0)}% rate
                              </Badge>
                            </HStack>
                            <Text fontSize="sm" color="text.tertiary">
                              {driver.todaysJobs} jobs today • {driver.declinedAssignments} declined
                            </Text>
                          </VStack>
                        </HStack>
                      </CardHeader>

                      <CardBody pt={0}>
                        {driver.jobs.length === 0 ? (
                          <Text fontSize="sm" color="text.tertiary" textAlign="center" py={4}>
                            No jobs scheduled for this driver on the selected date.
                          </Text>
                        ) : (
                          <VStack spacing={3} align="stretch">
                            {driver.jobs
                              .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                              .map((job) => (
                                <Card key={job.id} bg="bg.surface" borderColor="border.secondary" size="sm">
                                  <CardBody py={3}>
                                    <HStack justify="space-between" align="start">
                                      <VStack align="start" spacing={1} flex={1}>
                                        <HStack spacing={2}>
                                          <Badge bg="neon.500" color="dark.900" fontSize="xs">
                                            {job.reference}
                                          </Badge>
                                          <Badge bg={getPriorityColor(job.priority)} color="white" size="sm">
                                            {job.priority.toUpperCase()}
                                          </Badge>
                                          <Badge bg={getStatusColor(job.status)} color="white" size="sm">
                                            {job.status.replace('_', ' ').toUpperCase()}
                                          </Badge>
                                          {job.type === 'multi-drop' && (
                                            <Badge bg="purple.500" color="white" size="sm">
                                              MULTI-DROP
                                            </Badge>
                                          )}
                                        </HStack>
                                        <HStack spacing={4}>
                                          <HStack spacing={1}>
                                            <Icon as={FaClock} color="text.secondary" boxSize={3} />
                                            <Text fontSize="sm" color="text.secondary">
                                              {formatTime(job.scheduledAt)}
                                            </Text>
                                          </HStack>
                                          <HStack spacing={1}>
                                            <Icon as={FaMapMarkerAlt} color="green.500" boxSize={3} />
                                            <Text fontSize="sm" color="text.secondary" noOfLines={1}>
                                              {job.pickupAddress}
                                            </Text>
                                          </HStack>
                                          <Text fontSize="sm" color="text.secondary">→</Text>
                                          <HStack spacing={1}>
                                            <Icon as={FaMapMarkerAlt} color="red.500" boxSize={3} />
                                            <Text fontSize="sm" color="text.secondary" noOfLines={1}>
                                              {job.dropoffAddress}
                                            </Text>
                                          </HStack>
                                        </HStack>
                                      </VStack>

                                      <VStack align="end" spacing={1}>
                                        <Text fontSize="sm" fontWeight="bold" color="success.500">
                                          {formatCurrency(job.totalValue)}
                                        </Text>
                                        <Text fontSize="xs" color="text.tertiary">
                                          {job.duration} min
                                        </Text>
                                      </VStack>
                                    </HStack>
                                  </CardBody>
                                </Card>
                              ))}
                          </VStack>
                        )}

                        {/* Declined Jobs Section */}
                        {driver.declinedJobs.length > 0 && (
                          <Box mt={4} pt={4} borderTop="1px solid" borderColor="border.secondary">
                            <Text fontSize="sm" fontWeight="semibold" color="error.600" mb={3}>
                              Recent Declined Jobs ({driver.declinedJobs.length})
                            </Text>
                            <VStack spacing={2} align="stretch">
                              {driver.declinedJobs.slice(0, 3).map((job: any) => (
                                <Card key={job.id} bg="bg.surface" borderColor="border.secondary" size="sm" opacity={0.8}>
                                  <CardBody py={2}>
                                    <HStack justify="space-between" align="center">
                                      <VStack align="start" spacing={0} flex={1}>
                                        <HStack spacing={2}>
                                          <Badge bg="error.500" color="white" fontSize="xs">
                                            {job.reference}
                                          </Badge>
                                          <Text fontSize="xs" color="text.secondary">
                                            Declined: {new Date(job.declinedAt).toLocaleDateString('en-GB')}
                                          </Text>
                                        </HStack>
                                        <Text fontSize="xs" color="text.tertiary" noOfLines={1}>
                                          {job.customerName} • {job.pickupAddress}
                                        </Text>
                                      </VStack>
                                      <Text fontSize="xs" fontWeight="bold" color="error.500">
                                        {formatCurrency(job.totalValue)}
                                      </Text>
                                    </HStack>
                                  </CardBody>
                                </Card>
                              ))}
                              {driver.declinedJobs.length > 3 && (
                                <Text fontSize="xs" color="text.tertiary" textAlign="center">
                                  +{driver.declinedJobs.length - 3} more declined jobs
                                </Text>
                              )}
                            </VStack>
                          </Box>
                        )}
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </AdminShell>
  );
}
