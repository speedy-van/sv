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
  Badge,
  Icon,
  Progress,
  useColorModeValue,
  SimpleGrid,
  Alert,
  AlertIcon,
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
} from '@chakra-ui/react';
import {
  FiActivity,
  FiServer,
  FiDatabase,
  FiGlobe,
  FiClock,
  FiAlertTriangle,
  FiCheckCircle,
} from 'react-icons/fi';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold: { warning: number; critical: number };
  status: 'good' | 'warning' | 'critical';
  trend?: 'up' | 'down' | 'stable';
}

interface APIMetric {
  endpoint: string;
  avgResponseTime: number;
  requests: number;
  errors: number;
  successRate: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [apiMetrics, setApiMetrics] = useState<APIMetric[]>([]);
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'degraded' | 'critical'>('healthy');

  const cardBg = useColorModeValue('#111111', '#111111');
  const textColor = useColorModeValue('#FFFFFF', '#FFFFFF');
  const borderColor = useColorModeValue('#333333', '#333333');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      // Mock performance metrics
      const newMetrics: PerformanceMetric[] = [
        {
          name: 'API Response Time',
          value: 145,
          unit: 'ms',
          threshold: { warning: 200, critical: 500 },
          status: 'good',
          trend: 'stable',
        },
        {
          name: 'Database Query Time',
          value: 85,
          unit: 'ms',
          threshold: { warning: 150, critical: 300 },
          status: 'good',
          trend: 'down',
        },
        {
          name: 'Memory Usage',
          value: 65,
          unit: '%',
          threshold: { warning: 80, critical: 90 },
          status: 'good',
          trend: 'stable',
        },
        {
          name: 'CPU Usage',
          value: 45,
          unit: '%',
          threshold: { warning: 70, critical: 85 },
          status: 'good',
          trend: 'down',
        },
        {
          name: 'Active Connections',
          value: 125,
          unit: '',
          threshold: { warning: 200, critical: 300 },
          status: 'good',
          trend: 'up',
        },
        {
          name: 'Error Rate',
          value: 0.5,
          unit: '%',
          threshold: { warning: 2, critical: 5 },
          status: 'good',
          trend: 'down',
        },
      ];

      setMetrics(newMetrics);

      // Determine system health
      const criticalCount = newMetrics.filter(m => m.status === 'critical').length;
      const warningCount = newMetrics.filter(m => m.status === 'warning').length;

      if (criticalCount > 0) {
        setSystemHealth('critical');
      } else if (warningCount > 2) {
        setSystemHealth('degraded');
      } else {
        setSystemHealth('healthy');
      }

      // Mock API metrics
      const newApiMetrics: APIMetric[] = [
        {
          endpoint: '/api/admin/orders',
          avgResponseTime: 120,
          requests: 1250,
          errors: 2,
          successRate: 99.84,
        },
        {
          endpoint: '/api/admin/routes',
          avgResponseTime: 180,
          requests: 850,
          errors: 1,
          successRate: 99.88,
        },
        {
          endpoint: '/api/admin/analytics',
          avgResponseTime: 250,
          requests: 450,
          errors: 0,
          successRate: 100,
        },
        {
          endpoint: '/api/admin/orders/bulk',
          avgResponseTime: 320,
          requests: 120,
          errors: 1,
          successRate: 99.17,
        },
      ];

      setApiMetrics(newApiMetrics);
    } catch (error) {
      console.error('Error loading performance metrics:', error);
    }
  };

  const getStatusColor = (status: PerformanceMetric['status']) => {
    const colors = {
      good: '#10b981',
      warning: '#f59e0b',
      critical: '#ef4444',
    };
    return colors[status];
  };

  const getHealthColor = (health: typeof systemHealth) => {
    const colors = {
      healthy: '#10b981',
      degraded: '#f59e0b',
      critical: '#ef4444',
    };
    return colors[health];
  };

  return (
    <VStack align="stretch" spacing={4}>
      {/* System Health Status */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardBody>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Icon
                as={systemHealth === 'healthy' ? FiCheckCircle : FiAlertTriangle}
                color={getHealthColor(systemHealth)}
                boxSize={6}
              />
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" color={textColor} fontSize="lg">
                  System Health
                </Text>
                <Text fontSize="sm" color={secondaryTextColor}>
                  {systemHealth === 'healthy' ? 'All systems operational' :
                   systemHealth === 'degraded' ? 'Some systems experiencing issues' :
                   'Critical issues detected'}
                </Text>
              </VStack>
            </HStack>
            <Badge
              colorScheme={
                systemHealth === 'healthy' ? 'green' :
                systemHealth === 'degraded' ? 'yellow' : 'red'
              }
              size="lg"
              px={4}
              py={2}
            >
              {systemHealth.toUpperCase()}
            </Badge>
          </HStack>
        </CardBody>
      </Card>

      {/* Performance Metrics */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {metrics.map((metric) => (
          <Card key={metric.name} bg={cardBg} borderColor={borderColor} borderWidth={1}>
            <CardBody>
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between">
                  <Text fontSize="sm" color={secondaryTextColor}>
                    {metric.name}
                  </Text>
                  <Badge
                    colorScheme={
                      metric.status === 'good' ? 'green' :
                      metric.status === 'warning' ? 'yellow' : 'red'
                    }
                    size="sm"
                  >
                    {metric.status}
                  </Badge>
                </HStack>
                <HStack spacing={2}>
                  <Text fontSize="2xl" fontWeight="bold" color={textColor}>
                    {metric.value}
                  </Text>
                  <Text fontSize="sm" color={secondaryTextColor}>
                    {metric.unit}
                  </Text>
                </HStack>
                <Progress
                  value={
                    metric.status === 'good'
                      ? (metric.value / metric.threshold.warning) * 50
                      : metric.status === 'warning'
                      ? 50 + ((metric.value - metric.threshold.warning) / (metric.threshold.critical - metric.threshold.warning)) * 30
                      : 80 + ((metric.value - metric.threshold.critical) / metric.threshold.critical) * 20
                  }
                  colorScheme={
                    metric.status === 'good' ? 'green' :
                    metric.status === 'warning' ? 'yellow' : 'red'
                  }
                  size="sm"
                  borderRadius="full"
                />
                <HStack justify="space-between" fontSize="xs" color={secondaryTextColor}>
                  <Text>Threshold: {metric.threshold.warning}{metric.unit}</Text>
                  {metric.trend && (
                    <Text>
                      Trend: {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
                    </Text>
                  )}
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>

      {/* API Performance */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardHeader>
          <Text fontWeight="bold" color={textColor}>
            API Performance
          </Text>
        </CardHeader>
        <CardBody>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th color={textColor} borderColor={borderColor}>Endpoint</Th>
                <Th color={textColor} borderColor={borderColor} isNumeric>Avg Response</Th>
                <Th color={textColor} borderColor={borderColor} isNumeric>Requests</Th>
                <Th color={textColor} borderColor={borderColor} isNumeric>Errors</Th>
                <Th color={textColor} borderColor={borderColor} isNumeric>Success Rate</Th>
              </Tr>
            </Thead>
            <Tbody>
              {apiMetrics.map((api) => (
                <Tr key={api.endpoint}>
                  <Td borderColor={borderColor}>
                    <Text color={textColor} fontSize="sm" fontFamily="mono">
                      {api.endpoint}
                    </Text>
                  </Td>
                  <Td borderColor={borderColor} isNumeric>
                    <Text color={textColor}>
                      {api.avgResponseTime}ms
                    </Text>
                  </Td>
                  <Td borderColor={borderColor} isNumeric>
                    <Text color={textColor}>
                      {api.requests.toLocaleString()}
                    </Text>
                  </Td>
                  <Td borderColor={borderColor} isNumeric>
                    <Badge
                      colorScheme={api.errors === 0 ? 'green' : api.errors < 5 ? 'yellow' : 'red'}
                      size="sm"
                    >
                      {api.errors}
                    </Badge>
                  </Td>
                  <Td borderColor={borderColor} isNumeric>
                    <HStack spacing={2} justify="flex-end">
                      <Progress
                        value={api.successRate}
                        colorScheme={api.successRate >= 99.5 ? 'green' : api.successRate >= 99 ? 'yellow' : 'red'}
                        size="sm"
                        w="60px"
                        borderRadius="full"
                      />
                      <Text color={textColor} fontSize="xs" minW="50px">
                        {api.successRate.toFixed(2)}%
                      </Text>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </VStack>
  );
}

