'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  VStack,
  HStack,
  Card,
  CardBody,
  SimpleGrid,
  Alert,
  AlertIcon,
  Button,
  Spinner,
  useToast,
  IconButton,
  Tooltip,
  Flex,
  Progress,
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiTruck,
  FiClock,
  FiMessageSquare,
  FiAlertTriangle,
  FiPlus,
  FiRefreshCw,
  FiMapPin,
  FiExternalLink,
  FiTrendingUp,
  FiTrendingDown,
  FiCheck,
} from 'react-icons/fi';
import { AdminShell } from '@/components/admin';
import { DashboardMap } from '@/components/admin/DashboardMap';
import RoutingModeToggle from '@/components/admin/RoutingModeToggle';
import { useRouter } from 'next/navigation';

interface DashboardData {
  alerts: {
    unassignedBookings: number;
    slaBreached: number;
    urgentBookings: number;
  };
  statistics: {
    todayRevenue: number;
    todayBookings: number;
    activeJobs: number;
    completedToday: number;
    pendingAssignments: number;
    driverUtilization: number;
  };
  unassignedBookings: Array<{
    id: string;
    reference: string;
    customer: string;
    customerPhone: string;
    pickupAddress: string;
    dropoffAddress: string;
    scheduledAt: string;
    totalAmount: number;
    waitingMinutes: number;
    priority: string;
    slaBreached: boolean;
    itemsCount: number;
    createdAt: string;
  }>;
  availableDrivers: Array<{
    id: string;
    name: string;
    email: string;
    status: string;
    currentJobs: number;
    isOnline: boolean;
    lastSeen: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    actorName: string;
    targetType: string;
    targetId: string;
    createdAt: string;
    details: any;
  }>;
  adminUsers: Array<{
    id: string;
    name: string;
    email: string;
    adminRole: string;
    isActive: boolean;
    lastLogin: string;
    isOnline: boolean;
  }>;
  systemHealth: {
    database: string;
    queue: string;
    pusher: string;
    stripeWebhooks: string;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const toast = useToast();
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchRef = useRef<(() => Promise<void>) | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/dashboard-enhanced', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      setData(result.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  // Update ref whenever fetchDashboardData changes
  useEffect(() => {
    fetchRef.current = fetchDashboardData;
  }, [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 15 seconds to ensure all new orders are visible
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      // Use ref to avoid stale closure
      if (fetchRef.current && !loading) {
        fetchRef.current();
      }
    }, 15000); // Reduced from 30 to 15 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []); // Empty dependency array to prevent re-creation

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleCreateOrder = () => {
    router.push('/booking-luxury');
  };

  const handleCardClick = (type: string, value?: string) => {
    switch (type) {
      case 'revenue':
        router.push('/admin/analytics');
        break;
      case 'activeJobs':
        router.push(
          '/admin/orders?status=assigned,en-route,at-pickup,in-transit,at-drop'
        );
        break;
      case 'newOrders':
        router.push('/admin/orders?status=pending,confirmed');
        break;
      case 'driverApplications':
        router.push('/admin/drivers/applications');
        break;
      case 'pendingRefunds':
        router.push('/admin/finance/refunds');
        break;
      case 'openIncidents':
        router.push('/admin/dispatch?filter=incidents');
        break;
      case 'job':
        if (value) {
          router.push(`/admin/orders/${value}`);
        }
        break;
      default:
        break;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en-route':
        return 'blue';
      case 'at-pickup':
        return 'yellow';
      case 'in-transit':
        return 'purple';
      case 'at-drop':
        return 'orange';
      case 'late-pickup':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getHealthColor = (status: string) => {
    return status === 'healthy' ? 'green' : 'red';
  };

  if (loading) {
    return (
      <AdminShell title="Dashboard" subtitle="Loading...">
        <Flex justify="center" align="center" height="400px">
          <Spinner size="xl" />
        </Flex>
      </AdminShell>
    );
  }

  if (!data) {
    return (
      <AdminShell title="Dashboard" subtitle="Error loading data">
        <Alert status="error">
          <AlertIcon />
          Failed to load dashboard data. Please try refreshing.
        </Alert>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Real-time operations overview"
      showCreateButton={true}
      onCreateClick={handleCreateOrder}
      actions={
        <HStack spacing={2}>
          <Text fontSize="sm" color="gray.500">
            <span suppressHydrationWarning>
              Last updated: {lastUpdated?.toLocaleTimeString() || 'Loading...'}
            </span>
          </Text>
          <Tooltip label="Refresh dashboard data">
            <IconButton
              size="sm"
              variant="outline"
              icon={<FiRefreshCw />}
              onClick={handleRefresh}
              isLoading={refreshing}
              aria-label="Refresh"
            />
          </Tooltip>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<FiMapPin />}
            onClick={() => router.push('/admin/dispatch/map')}
          >
            Live Map
          </Button>
        </HStack>
      }
    >
      {/* Routing Mode Toggle */}
      <Box mb={6}>
        <RoutingModeToggle />
      </Box>
      <Box>
        {/* KPI Row */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4} mb={8}>
          <Card
            cursor="pointer"
            onClick={() => handleCardClick('revenue')}
            _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
            transition="all 0.2s"
          >
            <CardBody>
              <Stat>
                <StatLabel>Today Revenue</StatLabel>
                <StatNumber>
                  £{(data.statistics.todayRevenue || 0).toLocaleString('en-GB', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </StatNumber>
                <StatHelpText>
                  <HStack spacing={1}>
                    <FiTrendingUp color="green" />
                    <Text color="green.500">
                      Bookings: {data.statistics.todayBookings || 0}
                    </Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card
            cursor="pointer"
            onClick={() => handleCardClick('activeJobs')}
            _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
            transition="all 0.2s"
          >
            <CardBody>
              <Stat>
                <StatLabel>Active Jobs</StatLabel>
                <StatNumber>{data.statistics.activeJobs || 0}</StatNumber>
                <StatHelpText>
                  <FiTruck style={{ display: 'inline', marginRight: '4px' }} />
                  In progress
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card
            cursor="pointer"
            onClick={() => handleCardClick('newOrders')}
            _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
            transition="all 0.2s"
            bg={(data.alerts.unassignedBookings || 0) > 0 ? 'orange.50' : 'white'}
            borderColor={
              (data.alerts.unassignedBookings || 0) > 0 ? 'orange.200' : 'gray.200'
            }
          >
            <CardBody>
              <Stat>
                <StatLabel>New Orders</StatLabel>
                <StatNumber
                  color={
                    (data.alerts.unassignedBookings || 0) > 0 ? 'orange.600' : 'inherit'
                  }
                >
                  {data.alerts.unassignedBookings || 0}
                </StatNumber>
                <StatHelpText>
                  <FiPlus style={{ display: 'inline', marginRight: '4px' }} />
                  Pending assignment
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Completed Today</StatLabel>
                <StatNumber>{data.statistics.completedToday || 0}</StatNumber>
                <StatHelpText>
                  <FiCheck style={{ display: 'inline', marginRight: '4px' }} />
                  Finished jobs
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Driver Utilization</StatLabel>
                <StatNumber>{data.statistics.driverUtilization || 0}%</StatNumber>
                <StatHelpText>
                  <FiTruck
                    style={{ display: 'inline', marginRight: '4px' }}
                  />
                  Active drivers
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card
            cursor="pointer"
            onClick={() => handleCardClick('openIncidents')}
            _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
            transition="all 0.2s"
          >
            <CardBody>
              <Stat>
                <StatLabel>SLA Breached</StatLabel>
                <StatNumber>{data.alerts.slaBreached || 0}</StatNumber>
                <StatHelpText>
                  <FiAlertTriangle
                    style={{ display: 'inline', marginRight: '4px' }}
                  />
                  Need attention
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
          {/* Live Ops Panel */}
          <Card>
            <CardBody>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading size="md">Live Operations</Heading>
                <Badge colorScheme="blue">{data.unassignedBookings.length} pending</Badge>
              </Flex>
              <VStack spacing={3} align="stretch">
                {data.unassignedBookings.length === 0 ? (
                  <Text color="gray.500" textAlign="center" py={4}>
                    No pending bookings at the moment
                  </Text>
                ) : (
                  data.unassignedBookings.map(booking => (
                    <Card
                      key={booking.id}
                      size="sm"
                      cursor="pointer"
                      onClick={() => handleCardClick('booking', booking.id)}
                      _hover={{ shadow: 'md' }}
                      transition="all 0.2s"
                    >
                      <CardBody p={3}>
                        <HStack justify="space-between">
                          <VStack align="start" spacing={1} flex={1}>
                            <HStack>
                              <Text fontWeight="bold">{booking.reference}</Text>
                              <IconButton
                                size="xs"
                                variant="ghost"
                                icon={<FiExternalLink />}
                                aria-label="View booking details"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleCardClick('booking', booking.id);
                                }}
                              />
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              {booking.customer}
                            </Text>
                            <Text fontSize="xs" color="gray.500" noOfLines={1}>
                              {booking.pickupAddress} → {booking.dropoffAddress}
                            </Text>
                          </VStack>
                          <VStack align="end" spacing={1}>
                            <Badge colorScheme={booking.slaBreached ? 'red' : booking.priority === 'high' ? 'orange' : 'blue'}>
                              {booking.slaBreached ? 'SLA BREACH' : booking.priority.toUpperCase()}
                            </Badge>
                            <Text fontSize="sm" color="gray.600">
                              £{booking.totalAmount}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {booking.waitingMinutes}m waiting
                            </Text>
                          </VStack>
                        </HStack>
                        {/* SLA Progress Bar */}
                        {booking.waitingMinutes > 0 && (
                          <Progress
                            value={Math.min(
                              (booking.waitingMinutes / 60) * 100,
                              100
                            )}
                            size="xs"
                            mt={2}
                            colorScheme={
                              booking.slaBreached ? 'red' : booking.waitingMinutes > 30 ? 'orange' : 'blue'
                            }
                          />
                        )}
                      </CardBody>
                    </Card>
                  ))
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Queue & Health */}
          <VStack spacing={6}>
            {/* Queue */}
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>
                  Queue
                </Heading>
                <VStack spacing={3} align="stretch">
                  <Card
                    size="sm"
                    cursor="pointer"
                    onClick={() => handleCardClick('driverApplications')}
                    _hover={{ shadow: 'md' }}
                    transition="all 0.2s"
                  >
                    <CardBody p={3}>
                      <HStack justify="space-between">
                        <Text>Available Drivers</Text>
                        <Badge colorScheme="green">
                          {data.availableDrivers.length}
                        </Badge>
                      </HStack>
                    </CardBody>
                  </Card>

                  <Card
                    size="sm"
                    cursor="pointer"
                    onClick={() => handleCardClick('pendingRefunds')}
                    _hover={{ shadow: 'md' }}
                    transition="all 0.2s"
                  >
                    <CardBody p={3}>
                      <HStack justify="space-between">
                        <Text>Pending Assignments</Text>
                        <Badge colorScheme="orange">
                          {data.statistics.pendingAssignments}
                        </Badge>
                      </HStack>
                    </CardBody>
                  </Card>

                  <Card
                    size="sm"
                    cursor="pointer"
                    onClick={() => router.push('/admin/finance/payouts')}
                    _hover={{ shadow: 'md' }}
                    transition="all 0.2s"
                  >
                    <CardBody p={3}>
                      <HStack justify="space-between">
                        <Text>Urgent Bookings</Text>
                        <Badge colorScheme="red">
                          {data.alerts.urgentBookings}
                        </Badge>
                      </HStack>
                    </CardBody>
                  </Card>
                </VStack>
              </CardBody>
            </Card>

            {/* System Health */}
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>
                  System Health
                </Heading>
                <VStack spacing={3} align="stretch">
                  {Object.entries(data.systemHealth).map(
                    ([service, status]) => (
                      <HStack key={service} justify="space-between">
                        <Text textTransform="capitalize">
                          {service.replace(/([A-Z])/g, ' $1')}
                        </Text>
                        <Badge colorScheme={getHealthColor(status)}>
                          {status}
                        </Badge>
                      </HStack>
                    )
                  )}
                </VStack>
              </CardBody>
            </Card>

            {/* Admin Team */}
            <Card>
              <CardBody>
                <Flex justify="space-between" align="center" mb={4}>
                  <Heading size="md">Admin Team</Heading>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    leftIcon={<FiPlus />}
                    onClick={() => router.push('/admin/settings/team')}
                  >
                    Manage Team
                  </Button>
                </Flex>
                <VStack spacing={3} align="stretch">
                  {(data.adminUsers || []).slice(0, 3).map((admin) => (
                    <HStack key={admin.id} justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="medium" fontSize="sm">
                          {admin.name || 'Admin User'}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {admin.email || 'admin@speedy-van.co.uk'}
                        </Text>
                      </VStack>
                      <VStack align="end" spacing={0}>
                        <Badge colorScheme={admin.isOnline ? 'green' : 'gray'} size="sm">
                          {admin.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                        <Text fontSize="xs" color="gray.500">
                          {admin.adminRole || 'admin'}
                        </Text>
                      </VStack>
                    </HStack>
                  ))}
                  {(!data.adminUsers || data.adminUsers.length === 0) && (
                    <Text fontSize="sm" color="gray.500" textAlign="center" py={2}>
                      No admin users found
                    </Text>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Grid>

        {/* Map Snapshot */}
        <Card mt={6}>
          <CardBody>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Active Crews & Order Heat Map</Heading>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<FiMapPin />}
                onClick={() => router.push('/admin/dispatch/map')}
              >
                View Full Map
              </Button>
            </Flex>
            <DashboardMap
              activeJobs={[]}
              height="300px"
              showControls={true}
            />
          </CardBody>
        </Card>
      </Box>
    </AdminShell>
  );
}
