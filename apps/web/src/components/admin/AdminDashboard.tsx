'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
  Progress,
  Container,
} from '@chakra-ui/react';
import {
  FiTruck,
  FiDollarSign,
  FiUsers,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
} from 'react-icons/fi';

interface DashboardStats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  totalRevenue: number;
  revenueChange: number;
  activeDrivers: number;
  totalCustomers: number;
  avgResponseTime: string;
  systemHealth: 'healthy' | 'warning' | 'error';
}

interface AdminDashboardProps {
  data?: any;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ data }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();
  
  // Match booking-luxury design - dark theme
  const bgGradient = 'linear(to-br, gray.900, blue.900)';
  const cardBg = useColorModeValue('whiteAlpha.100', 'whiteAlpha.50');
  const borderColor = useColorModeValue('whiteAlpha.200', 'whiteAlpha.100');
  const textColor = useColorModeValue('white', 'white');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    }
    try {
      const response = await fetch('/api/admin/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
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
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy':
        return FiCheckCircle;
      case 'warning':
        return FiAlertTriangle;
      case 'error':
        return FiAlertTriangle;
      default:
        return FiAlertTriangle;
    }
  };

  if (loading) {
    return (
      <Box
        minH="100vh"
        bgGradient={bgGradient}
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.400" thickness="4px" />
          <Text color="white" fontSize="lg">Loading Dashboard...</Text>
        </VStack>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box minH="100vh" bgGradient={bgGradient} py={8}>
        <Container maxW="container.xl">
          <Alert
            status="error"
            bg="red.900"
            color="white"
            borderRadius="lg"
            borderWidth="1px"
            borderColor="red.700"
          >
            <AlertIcon color="red.300" />
            Failed to load dashboard data. Please try refreshing.
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bgGradient={bgGradient}>
      <Container maxW="container.xl" py={8}>
        {/* Header */}
        <HStack justify="space-between" mb={8}>
          <VStack align="start" spacing={1}>
            <Heading size="lg" color="white">Admin Dashboard</Heading>
            <Text color="whiteAlpha.800">Overview of system performance and operations</Text>
          </VStack>
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={() => fetchDashboardStats(true)}
            isLoading={refreshing}
            size="md"
            colorScheme="blue"
            variant="solid"
            bg="blue.500"
            _hover={{ bg: 'blue.600' }}
          >
            Refresh
          </Button>
        </HStack>

        {/* System Health Alert */}
        {stats?.systemHealth && stats.systemHealth !== 'healthy' && (
          <Alert
            status={stats.systemHealth === 'error' ? 'error' : 'warning'}
            mb={6}
            bg={stats.systemHealth === 'error' ? 'red.900' : 'yellow.900'}
            color="white"
            borderRadius="lg"
            borderWidth="1px"
            borderColor={stats.systemHealth === 'error' ? 'red.700' : 'yellow.700'}
          >
            <AlertIcon color={stats.systemHealth === 'error' ? 'red.300' : 'yellow.300'} />
            <Box>
              <Text fontWeight="medium">
                System Health: {(stats.systemHealth || 'unknown').toUpperCase()}
              </Text>
              <Text fontSize="sm">
                {stats.systemHealth === 'error' 
                  ? 'Critical issues detected. Immediate attention required.'
                  : 'Some services may be experiencing issues.'
                }
              </Text>
            </Box>
          </Alert>
        )}

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <Card bg={cardBg} backdropFilter="blur(10px)" borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color="whiteAlpha.800">Total Orders</StatLabel>
                <StatNumber color="white" fontSize="3xl">{(stats?.totalOrders || 0).toLocaleString()}</StatNumber>
                <StatHelpText color="whiteAlpha.700">
                  <HStack spacing={1}>
                    <FiTruck />
                    <Text>All time</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} backdropFilter="blur(10px)" borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color="whiteAlpha.800">Active Orders</StatLabel>
                <StatNumber color="blue.300" fontSize="3xl">{stats?.activeOrders || 0}</StatNumber>
                <StatHelpText color="whiteAlpha.700">
                  <HStack spacing={1}>
                    <FiClock />
                    <Text>In progress</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} backdropFilter="blur(10px)" borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color="whiteAlpha.800">Total Revenue</StatLabel>
                <StatNumber color="white" fontSize="3xl">£{(stats?.totalRevenue || 0).toLocaleString()}</StatNumber>
                <StatHelpText color="whiteAlpha.700">
                  <HStack spacing={1}>
                    {(stats?.revenueChange || 0) >= 0 ? (
                      <FiTrendingUp color="lightgreen" />
                    ) : (
                      <FiTrendingDown color="salmon" />
                    )}
                    <Text color={(stats?.revenueChange || 0) >= 0 ? 'green.300' : 'red.300'}>
                      {(stats?.revenueChange || 0) >= 0 ? '+' : ''}{stats?.revenueChange || 0}%
                    </Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} backdropFilter="blur(10px)" borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color="whiteAlpha.800">Active Drivers</StatLabel>
                <StatNumber color="white" fontSize="3xl">{stats?.activeDrivers || 0}</StatNumber>
                <StatHelpText color="whiteAlpha.700">
                  <HStack spacing={1}>
                    <FiUsers />
                    <Text>Online now</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Additional Stats */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
          <Card bg={cardBg} backdropFilter="blur(10px)" borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color="whiteAlpha.800">Completed Orders</StatLabel>
                <StatNumber color="green.300" fontSize="2xl">{stats?.completedOrders || 0}</StatNumber>
                <StatHelpText color="whiteAlpha.700">
                  <HStack spacing={1}>
                    <FiCheckCircle />
                    <Text>Successfully delivered</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} backdropFilter="blur(10px)" borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color="whiteAlpha.800">Total Customers</StatLabel>
                <StatNumber color="white" fontSize="2xl">{(stats?.totalCustomers || 0).toLocaleString()}</StatNumber>
                <StatHelpText color="whiteAlpha.700">
                  <HStack spacing={1}>
                    <FiUsers />
                    <Text>Registered users</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg={cardBg} backdropFilter="blur(10px)" borderWidth="1px" borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color="whiteAlpha.800">Avg Response Time</StatLabel>
                <StatNumber color="white" fontSize="2xl">{stats?.avgResponseTime || 'N/A'}</StatNumber>
                <StatHelpText color="whiteAlpha.700">
                  <HStack spacing={1}>
                    <FiClock />
                    <Text>Support tickets</Text>
                  </HStack>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* System Health Status */}
        <Card bg={cardBg} backdropFilter="blur(10px)" borderWidth="1px" borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md" color="white">System Health</Heading>
              <HStack spacing={2}>
                <Box as={getHealthIcon(stats?.systemHealth || 'unknown')} color="green.300" />
                <Badge colorScheme={getHealthColor(stats?.systemHealth || 'unknown')} fontSize="sm" px={3} py={1}>
                  {(stats?.systemHealth || 'unknown').toUpperCase()}
                </Badge>
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between" p={3} bg="whiteAlpha.50" borderRadius="md">
                <Text color="white">Database</Text>
                <Badge colorScheme="green">Healthy</Badge>
              </HStack>
              <HStack justify="space-between" p={3} bg="whiteAlpha.50" borderRadius="md">
                <Text color="white">API Services</Text>
                <Badge colorScheme="green">Healthy</Badge>
              </HStack>
              <HStack justify="space-between" p={3} bg="whiteAlpha.50" borderRadius="md">
                <Text color="white">Payment Processing</Text>
                <Badge colorScheme="green">Healthy</Badge>
              </HStack>
              <HStack justify="space-between" p={3} bg="whiteAlpha.50" borderRadius="md">
                <Text color="white">Real-time Tracking</Text>
                <Badge colorScheme="green">Healthy</Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
