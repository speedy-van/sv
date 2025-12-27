'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  CardHeader,
  Select,
  useColorModeValue,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import { FiBarChart2, FiTrendingUp, FiPieChart, FiActivity } from 'react-icons/fi';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
  }[];
}

interface DataVisualizationChartsProps {
  period?: '7d' | '30d' | '90d' | '365d';
}

export function DataVisualizationCharts({ period = '30d' }: DataVisualizationChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(period);
  const [revenueData, setRevenueData] = useState<ChartData | null>(null);
  const [ordersData, setOrdersData] = useState<ChartData | null>(null);
  const [statusDistribution, setStatusDistribution] = useState<ChartData | null>(null);

  const cardBg = useColorModeValue('#111111', '#111111');
  const textColor = useColorModeValue('#FFFFFF', '#FFFFFF');
  const borderColor = useColorModeValue('#333333', '#333333');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  useEffect(() => {
    loadChartData();
  }, [selectedPeriod]);

  const loadChartData = async () => {
    try {
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [analyticsRes, performanceRes] = await Promise.all([
        fetch(`/api/analytics/operational?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch(`/api/admin/analytics/performance?period=${days}`),
      ]);

      // Generate daily revenue data
      const dailyRevenue: number[] = [];
      const dailyLabels: string[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyLabels.push(date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
        // Mock data - in real app, this would come from API
        dailyRevenue.push(Math.random() * 1000 + 500);
      }

      setRevenueData({
        labels: dailyLabels,
        datasets: [{
          label: 'Daily Revenue',
          data: dailyRevenue,
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          borderColor: '#2563eb',
        }],
      });

      // Generate daily orders data
      const dailyOrders: number[] = [];
      for (let i = 0; i < days; i++) {
        dailyOrders.push(Math.floor(Math.random() * 50 + 10));
      }

      setOrdersData({
        labels: dailyLabels,
        datasets: [{
          label: 'Daily Orders',
          data: dailyOrders,
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          borderColor: '#10b981',
        }],
      });

      // Generate status distribution
      setStatusDistribution({
        labels: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
        datasets: [{
          label: 'Orders by Status',
          data: [
            Math.floor(Math.random() * 50 + 20),
            Math.floor(Math.random() * 50 + 30),
            Math.floor(Math.random() * 30 + 10),
            Math.floor(Math.random() * 100 + 50),
            Math.floor(Math.random() * 10 + 5),
          ],
          backgroundColor: [
            'rgba(245, 158, 11, 0.8)',
            'rgba(37, 99, 235, 0.8)',
            'rgba(6, 182, 212, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(239, 68, 68, 0.8)',
          ],
        }],
      });
    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <HStack spacing={2}>
          <FiBarChart2 color="#2563eb" />
          <Text fontWeight="bold" fontSize="lg" color={textColor}>
            Data Visualization
          </Text>
        </HStack>
        <Select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as any)}
          bg={cardBg}
          borderColor={borderColor}
          color={textColor}
          size="sm"
          w="150px"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="365d">Last year</option>
        </Select>
      </HStack>

      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab color={textColor}>Revenue</Tab>
          <Tab color={textColor}>Orders</Tab>
          <Tab color={textColor}>Distribution</Tab>
        </TabList>

        <TabPanels>
          <TabPanel p={0} pt={4}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
              <CardHeader>
                <Text fontWeight="bold" color={textColor}>
                  Revenue Trend
                </Text>
              </CardHeader>
              <CardBody>
                {revenueData ? (
                  <Box h="300px" position="relative">
                    {/* Chart placeholder - in real app, use Chart.js or Recharts */}
                    <VStack spacing={4} align="stretch">
                      <Text fontSize="sm" color={secondaryTextColor} textAlign="center">
                        Chart visualization would appear here
                      </Text>
                      <SimpleGrid columns={revenueData.labels.length > 7 ? 7 : revenueData.labels.length} spacing={2}>
                        {revenueData.labels.map((label, index) => (
                          <VStack key={index} spacing={1}>
                            <Box
                              w="100%"
                              h={`${(revenueData.datasets[0].data[index] / Math.max(...revenueData.datasets[0].data)) * 200}px`}
                              bg="rgba(37, 99, 235, 0.6)"
                              borderRadius="md"
                              minH="20px"
                            />
                            <Text fontSize="xs" color={secondaryTextColor} textAlign="center">
                              {label}
                            </Text>
                          </VStack>
                        ))}
                      </SimpleGrid>
                    </VStack>
                  </Box>
                ) : (
                  <Box h="300px" display="flex" alignItems="center" justifyContent="center">
                    <Text color={secondaryTextColor}>Loading chart data...</Text>
                  </Box>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel p={0} pt={4}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
              <CardHeader>
                <Text fontWeight="bold" color={textColor}>
                  Orders Trend
                </Text>
              </CardHeader>
              <CardBody>
                {ordersData ? (
                  <Box h="300px" position="relative">
                    <VStack spacing={4} align="stretch">
                      <Text fontSize="sm" color={secondaryTextColor} textAlign="center">
                        Chart visualization would appear here
                      </Text>
                      <SimpleGrid columns={ordersData.labels.length > 7 ? 7 : ordersData.labels.length} spacing={2}>
                        {ordersData.labels.map((label, index) => (
                          <VStack key={index} spacing={1}>
                            <Box
                              w="100%"
                              h={`${(ordersData.datasets[0].data[index] / Math.max(...ordersData.datasets[0].data)) * 200}px`}
                              bg="rgba(16, 185, 129, 0.6)"
                              borderRadius="md"
                              minH="20px"
                            />
                            <Text fontSize="xs" color={secondaryTextColor} textAlign="center">
                              {label}
                            </Text>
                          </VStack>
                        ))}
                      </SimpleGrid>
                    </VStack>
                  </Box>
                ) : (
                  <Box h="300px" display="flex" alignItems="center" justifyContent="center">
                    <Text color={secondaryTextColor}>Loading chart data...</Text>
                  </Box>
                )}
              </CardBody>
            </Card>
          </TabPanel>

          <TabPanel p={0} pt={4}>
            <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
              <CardHeader>
                <Text fontWeight="bold" color={textColor}>
                  Status Distribution
                </Text>
              </CardHeader>
              <CardBody>
                {statusDistribution ? (
                  <VStack spacing={4} align="stretch">
                    {statusDistribution.labels.map((label, index) => {
                      const value = statusDistribution.datasets[0].data[index];
                      const total = statusDistribution.datasets[0].data.reduce((sum, v) => sum + v, 0);
                      const percentage = (value / total) * 100;
                      const color = statusDistribution.datasets[0].backgroundColor?.[index] || '#2563eb';

                      return (
                        <VStack key={index} align="stretch" spacing={1}>
                          <HStack justify="space-between">
                            <Text fontSize="sm" color={textColor} fontWeight="medium">
                              {label}
                            </Text>
                            <HStack spacing={2}>
                              <Text fontSize="sm" color={secondaryTextColor}>
                                {value}
                              </Text>
                              <Text fontSize="xs" color={secondaryTextColor}>
                                ({percentage.toFixed(1)}%)
                              </Text>
                            </HStack>
                          </HStack>
                          <Box
                            w="100%"
                            h="8px"
                            bg="#1a1a1a"
                            borderRadius="full"
                            overflow="hidden"
                          >
                            <Box
                              w={`${percentage}%`}
                              h="100%"
                              bg={color}
                              borderRadius="full"
                              transition="width 0.3s"
                            />
                          </Box>
                        </VStack>
                      );
                    })}
                  </VStack>
                ) : (
                  <Box h="300px" display="flex" alignItems="center" justifyContent="center">
                    <Text color={secondaryTextColor}>Loading chart data...</Text>
                  </Box>
                )}
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
}

