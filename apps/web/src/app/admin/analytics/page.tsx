'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  SimpleGrid,
  Badge,
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Button,
  useToast,
  Icon,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Select,
  Progress,
  Spinner,
  Grid,
  Flex,
  Tooltip,
} from '@chakra-ui/react';
import {
  FaChartBar,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaUser,
  FaUsers,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBoxes,
  FaDownload,
  FaRedo,
  FaDollarSign,
  FaTruck,
  FaStar,
  FaChartLine,
  FaExclamationTriangle,
  FaFilter,
  FaRobot,
} from 'react-icons/fa';
import AIRoutesAnalytics from '@/components/admin/AIRoutesAnalytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface AnalyticsData {
  kpis: {
    totalRevenue30d: number;
    totalRevenue7d: number;
    totalRevenue24h: number;
    aov30d: number;
    aov7d: number;
    conversionRate: number;
    onTimePickup: number;
    onTimeDelivery: number;
    avgResponseTime: number;
    openIncidents: number;
    activeDrivers: number;
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    byStatus: Record<string, number>;
  };
  series: Array<{
    day: string;
    revenue: number;
    bookings: number;
    completed: number;
    cancelled: number;
  }>;
  driverMetrics: Array<{
    driverId: string;
    driverName: string;
    completedJobs: number;
    avgRating: number;
    earnings: number;
    onTimeRate: number;
  }>;
  cancellationReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  serviceAreas: Array<{
    area: string;
    bookings: number;
    revenue: number;
    avgRating: number;
  }>;
  realTimeMetrics: {
    jobsInProgress: number;
    latePickups: number;
    lateDeliveries: number;
    pendingAssignments: number;
  };
}

export default function AdminAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const toast = useToast();

  // Load data from API
  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/analytics?range=${dateRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadAnalyticsData();
    toast({
      title: 'Refreshed',
      description: 'Analytics data updated successfully',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const exportData = async (format: 'csv' | 'excel' | 'json') => {
    try {
      if (!analyticsData) return;

      if (format === 'json') {
        const filename = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
        const blob = new Blob([JSON.stringify(analyticsData, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        // Convert to CSV
        const csvRows = [];
        csvRows.push(['Date', 'Revenue', 'Bookings', 'Completed', 'Cancelled'].join(','));
        analyticsData.series.forEach(row => {
          csvRows.push(
            [row.day, row.revenue, row.bookings, row.completed, row.cancelled].join(',')
          );
        });
        
        const csvContent = csvRows.join('\n');
        const filename = `analytics-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: 'Exported',
        description: `Data exported as ${format.toUpperCase()}`,
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to export data',
        status: 'error',
      });
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (isLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="center" justify="center" minH="60vh">
          <Spinner size="xl" color="blue.500" thickness="4px" />
          <Text fontSize="lg" color="text.secondary">
            Loading analytics data...
          </Text>
        </VStack>
      </Container>
    );
  }

  if (!analyticsData) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            Failed to load analytics data. Please try again.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  const { kpis, series, driverMetrics, cancellationReasons, serviceAreas, realTimeMetrics } =
    analyticsData;

  // Calculate growth rates
  const revenueGrowth =
    kpis.totalRevenue7d > 0
      ? ((kpis.totalRevenue24h - kpis.totalRevenue7d / 7) /
          (kpis.totalRevenue7d / 7)) *
        100
      : 0;

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <VStack spacing={4} align="start">
          <Heading size="2xl" color="blue.600">
            📊 Analytics Dashboard
          </Heading>
          <Text fontSize="lg" color="text.secondary">
            Comprehensive insights into your business performance, revenue, and operations
          </Text>
        </VStack>

        {/* Action Buttons & Filters */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <HStack spacing={4}>
            <Button
              leftIcon={<FaRedo />}
              onClick={refreshData}
              isLoading={isLoading}
              colorScheme="blue"
            >
              Refresh Data
            </Button>
            <Button
              leftIcon={<FaDownload />}
              onClick={() => exportData('csv')}
              colorScheme="green"
            >
              Export CSV
            </Button>
            <Button
              leftIcon={<FaDownload />}
              onClick={() => exportData('json')}
              colorScheme="purple"
            >
              Export JSON
            </Button>
          </HStack>

          <HStack spacing={4}>
            <Icon as={FaFilter} color="text.secondary" />
            <Select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              w="200px"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </Select>
          </HStack>
        </Flex>

        {/* Real-time Alerts */}
        {(realTimeMetrics.latePickups > 0 ||
          realTimeMetrics.lateDeliveries > 0 ||
          kpis.openIncidents > 0) && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Active Issues Detected</AlertTitle>
              <HStack spacing={4} mt={2}>
                {realTimeMetrics.latePickups > 0 && (
                  <Badge colorScheme="orange">
                    {realTimeMetrics.latePickups} Late Pickups
                  </Badge>
                )}
                {realTimeMetrics.lateDeliveries > 0 && (
                  <Badge colorScheme="red">
                    {realTimeMetrics.lateDeliveries} Late Deliveries
                  </Badge>
                )}
                {kpis.openIncidents > 0 && (
                  <Badge colorScheme="red">
                    {kpis.openIncidents} Open Incidents
                  </Badge>
                )}
              </HStack>
            </Box>
          </Alert>
        )}

        {/* Key Metrics */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }} gap={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Revenue ({dateRange})</StatLabel>
                <StatNumber color="green.600">
                  £{kpis.totalRevenue30d.toLocaleString()}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={revenueGrowth >= 0 ? 'increase' : 'decrease'} />
                  {Math.abs(revenueGrowth).toFixed(1)}% vs previous period
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Bookings</StatLabel>
                <StatNumber color="blue.600">{kpis.totalBookings}</StatNumber>
                <StatHelpText>
                  {kpis.completedBookings} completed, {kpis.cancelledBookings} cancelled
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Average Order Value</StatLabel>
                <StatNumber color="purple.600">
                  £{kpis.aov30d.toFixed(2)}
                </StatNumber>
                <StatHelpText>Per completed booking</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Active Drivers</StatLabel>
                <StatNumber color="orange.600">{kpis.activeDrivers}</StatNumber>
                <StatHelpText>
                  {realTimeMetrics.jobsInProgress} jobs in progress
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Performance Metrics */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
          <Card>
            <CardBody textAlign="center">
              <Icon as={FaCheckCircle} boxSize={8} color="green.500" mb={2} />
              <Text fontSize="sm" color="text.secondary" mb={2}>
                On-Time Pickup
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="green.600">
                {kpis.onTimePickup}%
              </Text>
              <Progress value={kpis.onTimePickup} colorScheme="green" mt={2} />
            </CardBody>
          </Card>

          <Card>
            <CardBody textAlign="center">
              <Icon as={FaTruck} boxSize={8} color="blue.500" mb={2} />
              <Text fontSize="sm" color="text.secondary" mb={2}>
                On-Time Delivery
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                {kpis.onTimeDelivery}%
              </Text>
              <Progress value={kpis.onTimeDelivery} colorScheme="blue" mt={2} />
            </CardBody>
          </Card>

          <Card>
            <CardBody textAlign="center">
              <Icon as={FaClock} boxSize={8} color="orange.500" mb={2} />
              <Text fontSize="sm" color="text.secondary" mb={2}>
                Avg Response Time
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                {kpis.avgResponseTime}m
              </Text>
            </CardBody>
          </Card>

          <Card>
            <CardBody textAlign="center">
              <Icon as={FaChartLine} boxSize={8} color="purple.500" mb={2} />
              <Text fontSize="sm" color="text.secondary" mb={2}>
                Conversion Rate
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                {kpis.conversionRate}%
              </Text>
              <Progress value={kpis.conversionRate} colorScheme="purple" mt={2} />
            </CardBody>
          </Card>
        </Grid>

        {/* Charts Section */}
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <FaChartLine />
                <Text>Revenue & Bookings</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FaUsers />
                <Text>Visitors</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FaTruck />
                <Text>Driver Performance</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FaRobot />
                <Text>AI Routes</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FaMapMarkerAlt />
                <Text>Service Areas</Text>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <FaExclamationTriangle />
                <Text>Cancellations</Text>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            {/* Revenue & Bookings Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {/* Revenue Chart */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Revenue Trend
                    </Heading>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={series}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#48BB78" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#48BB78" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <RechartsTooltip />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#48BB78"
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>

                {/* Bookings Chart */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Bookings Overview
                    </Heading>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={series}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey="bookings" fill="#3182CE" name="Total Bookings" />
                        <Bar dataKey="completed" fill="#48BB78" name="Completed" />
                        <Bar dataKey="cancelled" fill="#F56565" name="Cancelled" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Visitors Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading size="lg" color="purple.600">
                  👥 Visitors Analytics
                </Heading>
                <Text color="text.secondary">
                  Track visitor behavior, location patterns, and geographic performance metrics.
                </Text>

                <Card>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Heading size="md">Detailed Visitor Analytics</Heading>
                        <Button
                          leftIcon={<FaUsers />}
                          colorScheme="purple"
                          onClick={() => (window.location.href = '/admin/visitors')}
                        >
                          Open Visitors Dashboard
                        </Button>
                      </HStack>
                      <Divider />
                      <Text color="text.secondary">
                        Access the comprehensive visitors analytics dashboard with detailed
                        insights, exact location tracking, geographic maps, area rankings,
                        and advanced filtering options.
                      </Text>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={4}>
                        <Box p={4} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
                          <VStack align="start" spacing={2}>
                            <Text fontSize="sm" fontWeight="bold" color="blue.700">
                              📍 Location Tracking:
                            </Text>
                            <Text fontSize="xs" color="blue.600">
                              • IP-based Geolocation
                            </Text>
                            <Text fontSize="xs" color="blue.600">
                              • Browser GPS Data
                            </Text>
                            <Text fontSize="xs" color="blue.600">
                              • Postcode Analysis
                            </Text>
                            <Text fontSize="xs" color="blue.600">
                              • Address Tracking
                            </Text>
                          </VStack>
                        </Box>

                        <Box p={4} bg="green.50" borderRadius="md" border="1px" borderColor="green.200">
                          <VStack align="start" spacing={2}>
                            <Text fontSize="sm" fontWeight="bold" color="green.700">
                              📊 Available Analytics:
                            </Text>
                            <Text fontSize="xs" color="green.600">
                              • Visitor Journey Maps
                            </Text>
                            <Text fontSize="xs" color="green.600">
                              • Area Performance Rankings
                            </Text>
                            <Text fontSize="xs" color="green.600">
                              • Geographic Heatmaps
                            </Text>
                            <Text fontSize="xs" color="green.600">
                              • Conversion by Location
                            </Text>
                          </VStack>
                        </Box>
                      </SimpleGrid>

                      <Alert status="info" mt={4}>
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Real-Time Location Tracking</AlertTitle>
                          <AlertDescription>
                            All visitor locations are tracked in real-time and can be viewed
                            in the dedicated Visitors Dashboard for detailed area analysis
                            and performance rankings.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Driver Performance Tab */}
            <TabPanel>
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>
                    Top Performing Drivers
                  </Heading>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Driver</Th>
                        <Th isNumeric>Completed Jobs</Th>
                        <Th isNumeric>Rating</Th>
                        <Th isNumeric>Earnings</Th>
                        <Th isNumeric>On-Time Rate</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {driverMetrics
                        .sort((a, b) => b.completedJobs - a.completedJobs)
                        .map(driver => (
                          <Tr key={driver.driverId}>
                            <Td>
                              <HStack>
                                <Icon as={FaUser} color="blue.500" />
                                <Text fontWeight="medium">{driver.driverName}</Text>
                              </HStack>
                            </Td>
                            <Td isNumeric>
                              <Badge colorScheme="blue">{driver.completedJobs}</Badge>
                            </Td>
                            <Td isNumeric>
                              <HStack justify="flex-end">
                                <Icon as={FaStar} color="yellow.500" />
                                <Text fontWeight="bold">{driver.avgRating.toFixed(1)}</Text>
                              </HStack>
                            </Td>
                            <Td isNumeric>
                              <Text fontWeight="bold" color="green.600">
                                £{driver.earnings}
                              </Text>
                            </Td>
                            <Td isNumeric>
                              <HStack justify="flex-end">
                                <Progress
                                  value={driver.onTimeRate}
                                  w="60px"
                                  colorScheme={driver.onTimeRate >= 95 ? 'green' : 'orange'}
                                />
                                <Text fontSize="sm">{driver.onTimeRate}%</Text>
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </TabPanel>

            {/* AI Routes Tab */}
            <TabPanel>
              <AIRoutesAnalytics />
            </TabPanel>

            {/* Service Areas Tab */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {/* Areas Table */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Performance by Area
                    </Heading>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Area</Th>
                          <Th isNumeric>Bookings</Th>
                          <Th isNumeric>Revenue</Th>
                          <Th isNumeric>Rating</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {serviceAreas
                          .sort((a, b) => b.revenue - a.revenue)
                          .map(area => (
                            <Tr key={area.area}>
                              <Td>
                                <HStack>
                                  <Icon as={FaMapMarkerAlt} color="purple.500" />
                                  <Text fontWeight="medium">{area.area}</Text>
                                </HStack>
                              </Td>
                              <Td isNumeric>
                                <Badge colorScheme="blue">{area.bookings}</Badge>
                              </Td>
                              <Td isNumeric>
                                <Text color="green.600" fontWeight="bold">
                                  £{area.revenue}
                                </Text>
                              </Td>
                              <Td isNumeric>
                                <HStack justify="flex-end">
                                  <Icon as={FaStar} color="yellow.500" boxSize={3} />
                                  <Text>{area.avgRating.toFixed(1)}</Text>
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                      </Tbody>
                    </Table>
                  </CardBody>
                </Card>

                {/* Areas Chart */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Revenue Distribution
                    </Heading>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={serviceAreas}
                          dataKey="revenue"
                          nameKey="area"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {serviceAreas.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>
              </SimpleGrid>
            </TabPanel>

            {/* Cancellations Tab */}
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {/* Cancellation Reasons */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Cancellation Reasons
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      {cancellationReasons.map((reason, index) => (
                        <Box key={index}>
                          <HStack justify="space-between" mb={1}>
                            <Text fontSize="sm" fontWeight="medium">
                              {reason.reason}
                            </Text>
                            <HStack>
                              <Text fontSize="sm" color="text.secondary">
                                {reason.count}
                              </Text>
                              <Badge colorScheme="red">{reason.percentage}%</Badge>
                            </HStack>
                          </HStack>
                          <Progress
                            value={reason.percentage}
                            colorScheme="red"
                            size="sm"
                          />
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Pie Chart */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Cancellation Distribution
                    </Heading>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={cancellationReasons}
                          dataKey="count"
                          nameKey="reason"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {cancellationReasons.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardBody>
                </Card>
              </SimpleGrid>

              {/* Recommendations */}
              <Card mt={6} bg="orange.50" borderColor="orange.200">
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Heading size="md" color="orange.700">
                      💡 Recommendations to Reduce Cancellations
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Alert status="info">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Improve Driver Availability</AlertTitle>
                          <AlertDescription>
                            {cancellationReasons.find(r => r.reason.includes('Driver'))
                              ?.count || 0}{' '}
                            cancellations due to driver issues. Consider expanding your
                            driver network.
                          </AlertDescription>
                        </Box>
                      </Alert>

                      <Alert status="info">
                        <AlertIcon />
                        <Box>
                          <AlertTitle>Customer Communication</AlertTitle>
                          <AlertDescription>
                            Implement automated reminders and real-time updates to reduce
                            customer-initiated cancellations.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    </SimpleGrid>
                  </VStack>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>

        {/* Footer Stats */}
        <Card>
          <CardBody>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Tooltip label="Jobs currently being executed">
                <VStack>
                  <Icon as={FaTruck} boxSize={6} color="blue.500" />
                  <Text fontSize="2xl" fontWeight="bold">
                    {realTimeMetrics.jobsInProgress}
                  </Text>
                  <Text fontSize="sm" color="text.secondary">
                    Jobs in Progress
                  </Text>
                </VStack>
              </Tooltip>

              <Tooltip label="Assignments waiting for driver acceptance">
                <VStack>
                  <Icon as={FaClock} boxSize={6} color="orange.500" />
                  <Text fontSize="2xl" fontWeight="bold">
                    {realTimeMetrics.pendingAssignments}
                  </Text>
                  <Text fontSize="sm" color="text.secondary">
                    Pending Assignments
                  </Text>
                </VStack>
              </Tooltip>

              <Tooltip label="Pickups running behind schedule">
                <VStack>
                  <Icon as={FaExclamationTriangle} boxSize={6} color="red.500" />
                  <Text fontSize="2xl" fontWeight="bold">
                    {realTimeMetrics.latePickups}
                  </Text>
                  <Text fontSize="sm" color="text.secondary">
                    Late Pickups
                  </Text>
                </VStack>
              </Tooltip>

              <Tooltip label="Deliveries running behind schedule">
                <VStack>
                  <Icon as={FaExclamationTriangle} boxSize={6} color="red.500" />
                  <Text fontSize="2xl" fontWeight="bold">
                    {realTimeMetrics.lateDeliveries}
                  </Text>
                  <Text fontSize="sm" color="text.secondary">
                    Late Deliveries
                  </Text>
                </VStack>
              </Tooltip>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Last Updated */}
        <Text fontSize="sm" color="text.secondary" textAlign="center">
          Last updated: <span suppressHydrationWarning>{new Date().toLocaleString()}</span>
        </Text>
      </VStack>
    </Container>
  );
}
