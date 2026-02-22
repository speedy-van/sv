'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useToast,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Alert,
  AlertIcon,
  Button,
  Select,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiUsers,
  FiTruck,
  FiBarChart2,
  FiActivity,
  FiTarget,
  FiRefreshCw,
  FiDownload,
  FiClock,
  FiMapPin,
} from 'react-icons/fi';
import { DataVisualizationCharts } from '../charts/DataVisualizationCharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface OperationalMetrics {
  totalRevenue: number;
  totalBookings: number;
  activeDrivers: number;
  completedBookings: number;
  averageOrderValue: number;
  customerSatisfaction: number;
  driverPerformanceScore: number;
  routeEfficiency: number;
  period: {
    start: Date;
    end: Date;
  };
}

interface RevenueBreakdown {
  grossRevenue: number;
  driverPayouts: number;
  helperPayouts: number;
  companyMargin: number;
  operatingCosts: number;
  netProfit: number;
  marginPercentage: number;
}

interface DriverAnalytics {
  driverId: string;
  driverName: string;
  totalRoutes: number;
  totalDrops: number;
  totalEarnings: number;
  averagePerformanceScore: number;
  customerSatisfactionAvg: number;
  onTimePercentage: number;
  completionRate: number;
  revenueGenerated: number;
  efficiencyRank: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface DailyStats {
  date: string;
  orders: number;
  routes: number;
  revenue: number;
  multiDropOrders?: number;
  averageStops?: number;
}

interface OperationsAnalyticsDashboardProps {
  onExport?: () => void;
}

export function OperationsAnalyticsDashboard({
  onExport,
}: OperationsAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'7' | '30' | '90' | '365'>('30');
  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetrics | null>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown | null>(null);
  const [driverAnalytics, setDriverAnalytics] = useState<DriverAnalytics[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [previousPeriodMetrics, setPreviousPeriodMetrics] = useState<OperationalMetrics | null>(null);
  const toast = useToast();

  const cardBg = useColorModeValue('#121A2B', '#121A2B');
  const textColor = useColorModeValue('#F5F8FF', '#F5F8FF');
  const borderColor = useColorModeValue('#2A3A5E', '#2A3A5E');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const days = parseInt(period);
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      const previousStartDate = subDays(startDate, days);

      // Fetch all analytics data in parallel
      const [operationalRes, revenueRes, driversRes, performanceRes] = await Promise.all([
        fetch(`/api/analytics/operational?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch(`/api/admin/analytics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch(`/api/analytics/drivers?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=10`),
        fetch(`/api/admin/analytics/performance?period=${days}`),
      ]);

      if (operationalRes.ok) {
        const operationalData = await operationalRes.json();
        if (operationalData.success) {
          setOperationalMetrics(operationalData.data);
        }
      }

      if (revenueRes.ok) {
        const revenueData = await revenueRes.json();
        if (revenueData.revenueBreakdown) {
          setRevenueBreakdown(revenueData.revenueBreakdown);
        }
      }

      if (driversRes.ok) {
        const driversData = await driversRes.json();
        if (driversData.success && driversData.data) {
          setDriverAnalytics(driversData.data);
        }
      }

      if (performanceRes.ok) {
        const performanceData = await performanceRes.json();
        if (performanceData.success && performanceData.data?.dailyStats) {
          setDailyStats(performanceData.data.dailyStats);
        }
      }

      // Fetch previous period for comparison
      const previousRes = await fetch(
        `/api/analytics/operational?startDate=${previousStartDate.toISOString()}&endDate=${startDate.toISOString()}`
      );
      if (previousRes.ok) {
        const previousData = await previousRes.json();
        if (previousData.success) {
          setPreviousPeriodMetrics(previousData.data);
        }
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
  };

  const calculateGrowth = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (amount: number) => `£${amount.toFixed(2)}`;

  if (loading) {
    return (
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardBody>
          <HStack justify="center" py={8}>
            <Spinner size="lg" color="#2563eb" />
          </HStack>
        </CardBody>
      </Card>
    );
  }

  const revenueGrowth = previousPeriodMetrics
    ? calculateGrowth(operationalMetrics?.totalRevenue || 0, previousPeriodMetrics.totalRevenue)
    : 0;
  const bookingsGrowth = previousPeriodMetrics
    ? calculateGrowth(operationalMetrics?.totalBookings || 0, previousPeriodMetrics.totalBookings)
    : 0;

  return (
    <VStack align="stretch" spacing={4}>
      {/* Header */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardHeader>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Icon as={FiBarChart2} color="#2563eb" boxSize={6} />
              <Text fontWeight="bold" fontSize="xl" color={textColor}>
                Operations Analytics Dashboard
              </Text>
            </HStack>
            <HStack spacing={2}>
              <Select
                value={period}
                onChange={(e) => setPeriod(e.target.value as '7' | '30' | '90' | '365')}
                bg="#18233A"
                borderColor={borderColor}
                color={textColor}
                size="sm"
                w="120px"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </Select>
              <Button
                leftIcon={<FiRefreshCw />}
                onClick={handleRefresh}
                isLoading={refreshing}
                size="sm"
                bg="#2563eb"
                color="#F5F8FF"
                _hover={{ bg: '#1d4ed8' }}
              >
                Refresh
              </Button>
              {onExport && (
                <Button
                  leftIcon={<FiDownload />}
                  onClick={onExport}
                  size="sm"
                  variant="outline"
                  borderColor={borderColor}
                  color={textColor}
                  _hover={{ bg: '#18233A' }}
                >
                  Export
                </Button>
              )}
            </HStack>
          </HStack>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <SimpleGrid columns={4} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel color={secondaryTextColor}>Total Revenue</StatLabel>
              <StatNumber color={textColor} fontSize="2xl">
                {formatCurrency(operationalMetrics?.totalRevenue || 0)}
              </StatNumber>
              <StatHelpText>
                <StatArrow type={revenueGrowth >= 0 ? 'increase' : 'decrease'} />
                <Text fontSize="xs" color={revenueGrowth >= 0 ? '#10b981' : '#ef4444'}>
                  {Math.abs(revenueGrowth).toFixed(1)}% vs previous period
                </Text>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel color={secondaryTextColor}>Total Bookings</StatLabel>
              <StatNumber color={textColor} fontSize="2xl">
                {operationalMetrics?.totalBookings || 0}
              </StatNumber>
              <StatHelpText>
                <StatArrow type={bookingsGrowth >= 0 ? 'increase' : 'decrease'} />
                <Text fontSize="xs" color={bookingsGrowth >= 0 ? '#10b981' : '#ef4444'}>
                  {Math.abs(bookingsGrowth).toFixed(1)}% vs previous period
                </Text>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel color={secondaryTextColor}>Active Drivers</StatLabel>
              <StatNumber color={textColor} fontSize="2xl">
                {operationalMetrics?.activeDrivers || 0}
              </StatNumber>
              <StatHelpText>
                <Text fontSize="xs" color={secondaryTextColor}>
                  {operationalMetrics?.completedBookings || 0} completed bookings
                </Text>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel color={secondaryTextColor}>Avg Order Value</StatLabel>
              <StatNumber color={textColor} fontSize="2xl">
                {formatCurrency(operationalMetrics?.averageOrderValue || 0)}
              </StatNumber>
              <StatHelpText>
                <Text fontSize="xs" color={secondaryTextColor}>
                  Per booking
                </Text>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Performance Metrics */}
      <SimpleGrid columns={3} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color={secondaryTextColor}>Customer Satisfaction</Text>
              <HStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                  {(operationalMetrics?.customerSatisfaction || 0).toFixed(1)}
                </Text>
                <Text fontSize="sm" color={secondaryTextColor}>/ 5.0</Text>
              </HStack>
              <Progress
                value={(operationalMetrics?.customerSatisfaction || 0) * 20}
                colorScheme="green"
                size="sm"
                w="100%"
                borderRadius="full"
              />
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color={secondaryTextColor}>Driver Performance</Text>
              <HStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                  {(operationalMetrics?.driverPerformanceScore || 0).toFixed(1)}
                </Text>
                <Text fontSize="sm" color={secondaryTextColor}>/ 100</Text>
              </HStack>
              <Progress
                value={operationalMetrics?.driverPerformanceScore || 0}
                colorScheme="blue"
                size="sm"
                w="100%"
                borderRadius="full"
              />
            </VStack>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack align="start" spacing={2}>
              <Text fontSize="sm" color={secondaryTextColor}>Route Efficiency</Text>
              <HStack spacing={2}>
                <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                  {(operationalMetrics?.routeEfficiency || 0).toFixed(1)}%
                </Text>
              </HStack>
              <Progress
                value={operationalMetrics?.routeEfficiency || 0}
                colorScheme="purple"
                size="sm"
                w="100%"
                borderRadius="full"
              />
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Revenue Breakdown */}
      {revenueBreakdown && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardHeader>
            <HStack spacing={2}>
              <Icon as={FiDollarSign} color="#10b981" boxSize={5} />
              <Text fontWeight="bold" fontSize="md" color={textColor}>
                Revenue Breakdown
              </Text>
            </HStack>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={4} spacing={4}>
              <Box>
                <Text fontSize="xs" color={secondaryTextColor} mb={1}>Gross Revenue</Text>
                <Text fontSize="lg" fontWeight="bold" color="#10b981">
                  {formatCurrency(revenueBreakdown.grossRevenue)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color={secondaryTextColor} mb={1}>Driver Payouts</Text>
                <Text fontSize="lg" fontWeight="bold" color="#f59e0b">
                  {formatCurrency(revenueBreakdown.driverPayouts)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color={secondaryTextColor} mb={1}>Operating Costs</Text>
                <Text fontSize="lg" fontWeight="bold" color="#ef4444">
                  {formatCurrency(revenueBreakdown.operatingCosts)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color={secondaryTextColor} mb={1}>Net Profit</Text>
                <Text fontSize="lg" fontWeight="bold" color={revenueBreakdown.netProfit > 0 ? '#10b981' : '#ef4444'}>
                  {formatCurrency(revenueBreakdown.netProfit)}
                </Text>
                <Text fontSize="xs" color={secondaryTextColor} mt={1}>
                  Margin: {revenueBreakdown.marginPercentage.toFixed(1)}%
                </Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>
      )}

      {/* Tabs for Detailed Analytics */}
      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab color={textColor}>Top Drivers</Tab>
          <Tab color={textColor}>Daily Trends</Tab>
          <Tab color={textColor}>Charts</Tab>
          <Tab color={textColor}>Performance Insights</Tab>
        </TabList>

        <TabPanels>
          {/* Top Drivers Tab */}
          <TabPanel p={0} pt={4}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color={textColor} borderColor={borderColor}>Rank</Th>
                      <Th color={textColor} borderColor={borderColor}>Driver</Th>
                      <Th color={textColor} borderColor={borderColor} isNumeric>Routes</Th>
                      <Th color={textColor} borderColor={borderColor} isNumeric>Drops</Th>
                      <Th color={textColor} borderColor={borderColor} isNumeric>Revenue</Th>
                      <Th color={textColor} borderColor={borderColor} isNumeric>Performance</Th>
                      <Th color={textColor} borderColor={borderColor}>Trend</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {driverAnalytics.slice(0, 10).map((driver, index) => (
                      <Tr key={driver.driverId}>
                        <Td borderColor={borderColor}>
                          <Badge
                            colorScheme={
                              index === 0 ? 'gold' :
                              index < 3 ? 'yellow' : 'gray'
                            }
                            size="sm"
                          >
                            #{index + 1}
                          </Badge>
                        </Td>
                        <Td borderColor={borderColor}>
                          <Text color={textColor} fontWeight="medium">
                            {driver.driverName}
                          </Text>
                        </Td>
                        <Td borderColor={borderColor} isNumeric>
                          <Text color={textColor}>{driver.totalRoutes}</Text>
                        </Td>
                        <Td borderColor={borderColor} isNumeric>
                          <Text color={textColor}>{driver.totalDrops}</Text>
                        </Td>
                        <Td borderColor={borderColor} isNumeric>
                          <Text color={textColor} fontWeight="bold">
                            {formatCurrency(driver.revenueGenerated)}
                          </Text>
                        </Td>
                        <Td borderColor={borderColor} isNumeric>
                          <HStack spacing={2} justify="flex-end">
                            <Progress
                              value={driver.averagePerformanceScore * 10}
                              colorScheme="blue"
                              size="sm"
                              w="60px"
                              borderRadius="full"
                            />
                            <Text color={textColor} fontSize="xs" minW="40px">
                              {(driver.averagePerformanceScore * 10).toFixed(0)}%
                            </Text>
                          </HStack>
                        </Td>
                        <Td borderColor={borderColor}>
                          <Icon
                            as={driver.trend === 'improving' ? FiTrendingUp : driver.trend === 'declining' ? FiTrendingDown : FiActivity}
                            color={
                              driver.trend === 'improving' ? '#10b981' :
                              driver.trend === 'declining' ? '#ef4444' : secondaryTextColor
                            }
                            boxSize={4}
                          />
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Daily Trends Tab */}
          <TabPanel p={0} pt={4}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
              <CardBody>
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color={textColor} borderColor={borderColor}>Date</Th>
                      <Th color={textColor} borderColor={borderColor} isNumeric>Orders</Th>
                      <Th color={textColor} borderColor={borderColor} isNumeric>Routes</Th>
                      <Th color={textColor} borderColor={borderColor} isNumeric>Revenue</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {dailyStats.slice(-14).map((stat) => (
                      <Tr key={stat.date}>
                        <Td borderColor={borderColor}>
                          <Text color={textColor}>
                            {format(new Date(stat.date), 'dd MMM yyyy')}
                          </Text>
                        </Td>
                        <Td borderColor={borderColor} isNumeric>
                          <Text color={textColor}>{stat.orders}</Text>
                        </Td>
                        <Td borderColor={borderColor} isNumeric>
                          <Text color={textColor}>{stat.routes}</Text>
                        </Td>
                        <Td borderColor={borderColor} isNumeric>
                          <Text color={textColor} fontWeight="bold">
                            {formatCurrency(stat.revenue)}
                          </Text>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Charts Tab */}
          <TabPanel p={0} pt={4}>
            <DataVisualizationCharts period={period === '7' ? '7d' : period === '30' ? '30d' : period === '90' ? '90d' : '365d'} />
          </TabPanel>

          {/* Performance Insights Tab */}
          <TabPanel p={0} pt={4}>
            <VStack align="stretch" spacing={3}>
              {operationalMetrics && operationalMetrics.customerSatisfaction >= 4.5 && (
                <Alert status="success" variant="subtle" colorScheme="green">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Excellent customer satisfaction score of {(operationalMetrics.customerSatisfaction).toFixed(1)}/5.0
                  </Text>
                </Alert>
              )}
              {revenueBreakdown && revenueBreakdown.marginPercentage < 20 && (
                <Alert status="warning" variant="subtle" colorScheme="orange">
                  <AlertIcon />
                  <Text fontSize="sm">
                    Profit margin of {revenueBreakdown.marginPercentage.toFixed(1)}% is below target. Consider pricing optimization.
                  </Text>
                </Alert>
              )}
              {operationalMetrics && operationalMetrics.routeEfficiency >= 85 && (
                <Alert status="success" variant="subtle" colorScheme="green">
                  <AlertIcon />
                  <Text fontSize="sm">
                    High route efficiency of {operationalMetrics.routeEfficiency.toFixed(1)}% indicates effective optimization.
                  </Text>
                </Alert>
              )}
              {driverAnalytics.filter(d => d.trend === 'improving').length > driverAnalytics.length * 0.4 && (
                <Alert status="success" variant="subtle" colorScheme="green">
                  <AlertIcon />
                  <Text fontSize="sm">
                    {driverAnalytics.filter(d => d.trend === 'improving').length} drivers showing performance improvement.
                  </Text>
                </Alert>
              )}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}

