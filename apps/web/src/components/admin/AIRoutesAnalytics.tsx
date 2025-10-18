'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Button,
  Select,
  Progress,
  Spinner,
  Icon,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
} from '@chakra-ui/react';
import {
  FaRobot,
  FaChartLine,
  FaClock,
  FaDollarSign,
  FaCheckCircle,
  FaTrophy,
  FaLightbulb,
} from 'react-icons/fa';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface AIAnalyticsData {
  overview: {
    totalAiRoutes: number;
    completedAiRoutes: number;
    successRate: number;
    avgEfficiency: number;
    avgAiDrops: number;
    avgManualDrops: number;
    timeSavedMinutes: number;
    costSavings: number;
  };
  comparison: {
    aiRoutes: number;
    manualRoutes: number;
    aiSuccessRate: number;
    manualSuccessRate: number;
    efficiencyImprovement: number;
  };
  dailyBreakdown: Array<{
    date: string;
    aiRoutes: number;
    manualRoutes: number;
    aiEfficiency: number;
  }>;
  topRoutes: Array<{
    id: string;
    routeNumber: string;
    drops: number;
    efficiency: number;
    driver: string;
    completedAt: Date | null;
  }>;
}

export default function AIRoutesAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AIAnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics/ai-routes?days=${timeRange}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching AI analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="purple.500" />
        <Text mt={4}>Loading AI Analytics...</Text>
      </Box>
    );
  }

  if (!data) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load AI analytics data
      </Alert>
    );
  }

  const { overview, comparison, dailyBreakdown, topRoutes } = data;

  return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between">
        <HStack>
          <Icon as={FaRobot} boxSize={8} color="purple.500" />
          <Heading size="lg">AI Route Generator Analytics</Heading>
        </HStack>
        <Select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          width="200px"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </Select>
      </HStack>

      {/* Overview Stats */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
        <Card bg="purple.50" borderColor="purple.200" borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel>Total AI Routes</StatLabel>
              <StatNumber color="purple.600">{overview.totalAiRoutes}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {overview.completedAiRoutes} completed
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="green.50" borderColor="green.200" borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel>Success Rate</StatLabel>
              <StatNumber color="green.600">{overview.successRate}%</StatNumber>
              <StatHelpText>
                <Icon as={FaCheckCircle} mr={1} />
                High performance
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="blue.50" borderColor="blue.200" borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel>Time Saved</StatLabel>
              <StatNumber color="blue.600">
                {Math.floor(overview.timeSavedMinutes / 60)}h {overview.timeSavedMinutes % 60}m
              </StatNumber>
              <StatHelpText>
                <Icon as={FaClock} mr={1} />
                vs manual creation
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg="orange.50" borderColor="orange.200" borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel>Cost Savings</StatLabel>
              <StatNumber color="orange.600">£{overview.costSavings}</StatNumber>
              <StatHelpText>
                <Icon as={FaDollarSign} mr={1} />
                Estimated
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* AI vs Manual Comparison */}
      <Card>
        <CardBody>
          <Heading size="md" mb={4}>
            <HStack>
              <Icon as={FaChartLine} />
              <Text>AI vs Manual Route Creation</Text>
            </HStack>
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Routes Created
              </Text>
              <HStack spacing={4}>
                <VStack align="start">
                  <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                    AI: {comparison.aiRoutes}
                  </Badge>
                  <Badge colorScheme="gray" fontSize="md" px={3} py={1}>
                    Manual: {comparison.manualRoutes}
                  </Badge>
                </VStack>
                <Progress
                  value={(comparison.aiRoutes / (comparison.aiRoutes + comparison.manualRoutes)) * 100}
                  colorScheme="purple"
                  size="lg"
                  flex={1}
                />
              </HStack>
            </Box>

            <Box>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Success Rate
              </Text>
              <VStack align="start" spacing={2}>
                <HStack>
                  <Text fontWeight="bold" color="purple.600">
                    AI: {comparison.aiSuccessRate}%
                  </Text>
                  <Progress
                    value={comparison.aiSuccessRate}
                    colorScheme="purple"
                    size="sm"
                    flex={1}
                  />
                </HStack>
                <HStack>
                  <Text fontWeight="bold" color="gray.600">
                    Manual: {comparison.manualSuccessRate}%
                  </Text>
                  <Progress
                    value={comparison.manualSuccessRate}
                    colorScheme="gray"
                    size="sm"
                    flex={1}
                  />
                </HStack>
              </VStack>
            </Box>

            <Box>
              <Text fontSize="sm" color="gray.600" mb={2}>
                Efficiency Improvement
              </Text>
              <HStack>
                <Icon as={FaTrophy} boxSize={6} color="yellow.500" />
                <VStack align="start" spacing={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="purple.600">
                    {comparison.efficiencyImprovement > 0 ? '+' : ''}
                    {comparison.efficiencyImprovement}%
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    Avg drops per route
                  </Text>
                </VStack>
              </HStack>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Daily Trend Chart */}
      <Card>
        <CardBody>
          <Heading size="md" mb={4}>
            Daily Route Creation Trend
          </Heading>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="aiRoutes"
                stackId="1"
                stroke="#805AD5"
                fill="#805AD5"
                name="AI Routes"
              />
              <Area
                type="monotone"
                dataKey="manualRoutes"
                stackId="1"
                stroke="#718096"
                fill="#718096"
                name="Manual Routes"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Top Performing AI Routes */}
      <Card>
        <CardBody>
          <Heading size="md" mb={4}>
            <HStack>
              <Icon as={FaTrophy} color="yellow.500" />
              <Text>Top Performing AI Routes</Text>
            </HStack>
          </Heading>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Route Number</Th>
                  <Th>Drops</Th>
                  <Th>Efficiency Score</Th>
                  <Th>Driver</Th>
                  <Th>Completed</Th>
                </Tr>
              </Thead>
              <Tbody>
                {topRoutes.map((route) => (
                  <Tr key={route.id}>
                    <Td fontWeight="bold">{route.routeNumber}</Td>
                    <Td>{route.drops}</Td>
                    <Td>
                      <HStack>
                        <Progress
                          value={route.efficiency}
                          colorScheme="green"
                          size="sm"
                          width="100px"
                        />
                        <Text fontSize="sm" fontWeight="bold">
                          {route.efficiency.toFixed(1)}%
                        </Text>
                      </HStack>
                    </Td>
                    <Td>{route.driver}</Td>
                    <Td>
                      {route.completedAt
                        ? new Date(route.completedAt).toLocaleDateString()
                        : 'N/A'}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>

      {/* AI Insights & Recommendations */}
      <Card bg="blue.50" borderColor="blue.200" borderWidth={1}>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Heading size="md" color="blue.700">
              <HStack>
                <Icon as={FaLightbulb} />
                <Text>AI Insights & Recommendations</Text>
              </HStack>
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Alert status="success">
                <AlertIcon />
                <Box>
                  <AlertTitle>High Success Rate</AlertTitle>
                  <AlertDescription>
                    AI-generated routes have a {overview.successRate}% success rate,
                    demonstrating reliable performance.
                  </AlertDescription>
                </Box>
              </Alert>

              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Time Efficiency</AlertTitle>
                  <AlertDescription>
                    You've saved {Math.floor(overview.timeSavedMinutes / 60)} hours using AI
                    route generation instead of manual creation.
                  </AlertDescription>
                </Box>
              </Alert>

              <Alert status="warning">
                <AlertIcon />
                <Box>
                  <AlertTitle>Optimization Opportunity</AlertTitle>
                  <AlertDescription>
                    AI routes average {overview.avgAiDrops.toFixed(1)} drops per route.
                    Consider increasing this for better efficiency.
                  </AlertDescription>
                </Box>
              </Alert>

              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Cost Savings</AlertTitle>
                  <AlertDescription>
                    Estimated £{overview.costSavings} saved in admin time costs
                    through AI automation.
                  </AlertDescription>
                </Box>
              </Alert>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}

