'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  Badge,
  Card,
  CardBody,
  Button,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import {
  FiActivity,
  FiDatabase,
  FiServer,
  FiWifi,
  FiClock,
  FiRefreshCw,
  FiAlertTriangle,
  FiCheckCircle,
} from 'react-icons/fi';

interface ServiceHealth {
  status: string;
  responseTime: string;
  connections?: number;
  maxConnections?: number;
  memoryUsage?: string;
  hitRate?: string;
  depth?: number;
  maxDepth?: number;
  processingRate?: string;
  successRate?: string;
  pendingWebhooks?: number;
  channels?: number;
  apiLatency?: string;
  webhookSuccess?: string;
  lastHeartbeat: string;
}

interface SystemHealth {
  overall: string;
  uptime: string;
  lastCheck: string;
  responseTime: number;
  services: {
    database: ServiceHealth;
    cache: ServiceHealth;
    queue: ServiceHealth;
    webhooks: ServiceHealth;
    pusher: ServiceHealth;
    stripe: ServiceHealth;
  };
  recentIncidents: Array<{
    id: string;
    service: string;
    severity: string;
    message: string;
    timestamp: string;
    resolved: boolean;
  }>;
  performanceMetrics: {
    avgResponseTime: string;
    requestsPerSecond: number;
    errorRate: string;
    activeUsers: number;
  };
}

export default function HealthPage() {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  async function loadHealthData() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/health');
      if (!response.ok) {
        throw new Error('Failed to fetch health data');
      }

      const data = await response.json();
      setHealthData(data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHealthData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'error':
        return 'red';
      case 'degraded':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'error':
        return 'red';
      case 'warning':
        return 'yellow';
      case 'info':
        return 'blue';
      default:
        return 'gray';
    }
  };

  if (!healthData && !loading) {
    return (
      <Box p={6}>
        <Alert status="error" mb={4}>
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>
            Failed to load health data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
        <Button
          onClick={loadHealthData}
          colorScheme="blue"
          leftIcon={<FiRefreshCw />}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">System Health</Heading>
          <Text color="text.secondary">
            Real-time system monitoring and status
          </Text>
        </VStack>
        <HStack spacing={3}>
          <Text fontSize="sm" color="text.secondary">
            <span suppressHydrationWarning>
              Last updated: {lastRefresh.toLocaleTimeString()}
            </span>
          </Text>
          <Button
            leftIcon={<FiRefreshCw />}
            variant="outline"
            size="sm"
            onClick={loadHealthData}
            isLoading={loading}
          >
            Refresh
          </Button>
        </HStack>
      </HStack>

      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && !healthData && (
        <LoadingSpinner message="Loading health data..." />
      )}

      {healthData && (
        <>
          {/* Overall Status */}
          <Card mb={6}>
            <CardBody>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <HStack>
                    <FiActivity />
                    <Text fontWeight="bold" fontSize="lg">
                      Overall System Status
                    </Text>
                  </HStack>
                  <Text color="text.secondary">All systems operational</Text>
                </VStack>
                <VStack align="end" spacing={1}>
                  <Badge
                    colorScheme={getStatusColor(healthData.overall)}
                    size="lg"
                  >
                    {(healthData.overall || 'unknown').toUpperCase()}
                  </Badge>
                  <Text fontSize="sm" color="text.secondary">
                    Uptime: {healthData.uptime}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>

          {/* Performance Metrics */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Avg Response Time</StatLabel>
                  <StatNumber>
                    {healthData.performanceMetrics.avgResponseTime}
                  </StatNumber>
                  <StatHelpText>
                    <FiClock
                      style={{ display: 'inline', marginRight: '4px' }}
                    />
                    API performance
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Requests/Second</StatLabel>
                  <StatNumber>
                    {(
                      healthData.performanceMetrics.requestsPerSecond || 0
                    ).toLocaleString()}
                  </StatNumber>
                  <StatHelpText>
                    <FiActivity
                      style={{ display: 'inline', marginRight: '4px' }}
                    />
                    Current load
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Error Rate</StatLabel>
                  <StatNumber color="red.500">
                    {healthData.performanceMetrics.errorRate}
                  </StatNumber>
                  <StatHelpText>
                    <FiAlertTriangle
                      style={{ display: 'inline', marginRight: '4px' }}
                    />
                    Last hour
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Active Users</StatLabel>
                  <StatNumber>
                    {healthData.performanceMetrics.activeUsers}
                  </StatNumber>
                  <StatHelpText>
                    <FiWifi style={{ display: 'inline', marginRight: '4px' }} />
                    Real-time
                  </StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
            {/* Service Status */}
            <VStack spacing={6} align="stretch">
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>
                    Service Status
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    {Object.entries(healthData.services || {}).map(
                      ([service, data]: [string, ServiceHealth]) => (
                        <Card key={service} variant="outline">
                          <CardBody>
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <HStack>
                                  <Text
                                    fontWeight="bold"
                                    textTransform="capitalize"
                                  >
                                    {service}
                                  </Text>
                                  <Badge
                                    colorScheme={getStatusColor(data.status)}
                                    size="sm"
                                  >
                                    {data.status}
                                  </Badge>
                                </HStack>
                                <Text fontSize="sm" color="gray.600">
                                  Last heartbeat:{' '}
                                  {data.lastHeartbeat
                                    ? new Date(
                                        data.lastHeartbeat
                                      ).toLocaleTimeString()
                                    : 'N/A'}
                                </Text>
                              </VStack>
                              <VStack align="end" spacing={1}>
                                {service === 'database' && (
                                  <>
                                    <Text fontSize="sm">
                                      Connections: {data.connections || 0}/
                                      {data.maxConnections || 0}
                                    </Text>
                                    <Progress
                                      value={
                                        data.connections && data.maxConnections
                                          ? (data.connections /
                                              data.maxConnections) *
                                            100
                                          : 0
                                      }
                                      size="sm"
                                      w="100px"
                                    />
                                  </>
                                )}
                                {service === 'cache' && (
                                  <>
                                    <Text fontSize="sm">
                                      Memory: {data.memoryUsage || 'N/A'}
                                    </Text>
                                    <Text fontSize="sm">
                                      Hit Rate: {data.hitRate || 'N/A'}
                                    </Text>
                                  </>
                                )}
                                {service === 'queue' && (
                                  <>
                                    <Text
                                      fontSize="sm"
                                      color={
                                        data.depth &&
                                        data.maxDepth &&
                                        data.depth > data.maxDepth
                                          ? 'red.500'
                                          : 'gray.600'
                                      }
                                    >
                                      Depth:{' '}
                                      {(data.depth || 0).toLocaleString()}
                                    </Text>
                                    <Text fontSize="sm">
                                      {data.processingRate || 'N/A'}
                                    </Text>
                                  </>
                                )}
                                {service === 'webhooks' && (
                                  <>
                                    <Text fontSize="sm">
                                      Success: {data.successRate || 'N/A'}
                                    </Text>
                                    <Text fontSize="sm">
                                      Pending: {data.pendingWebhooks || 0}
                                    </Text>
                                  </>
                                )}
                                {service === 'pusher' && (
                                  <>
                                    <Text fontSize="sm">
                                      Connections:{' '}
                                      {(data.connections || 0).toLocaleString()}
                                    </Text>
                                    <Text fontSize="sm">
                                      Channels: {data.channels || 0}
                                    </Text>
                                  </>
                                )}
                                {service === 'stripe' && (
                                  <>
                                    <Text fontSize="sm">
                                      Latency: {data.apiLatency || 'N/A'}
                                    </Text>
                                    <Text fontSize="sm">
                                      Webhooks: {data.webhookSuccess || 'N/A'}
                                    </Text>
                                  </>
                                )}
                              </VStack>
                            </HStack>
                          </CardBody>
                        </Card>
                      )
                    )}
                  </VStack>
                </CardBody>
              </Card>
            </VStack>

            {/* Recent Incidents & Quick Actions */}
            <VStack spacing={6} align="stretch">
              {/* Recent Incidents */}
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>
                    Recent Incidents
                  </Heading>
                  <VStack spacing={3} align="stretch">
                    {(healthData.recentIncidents || []).map(incident => (
                      <Alert
                        key={incident.id}
                        status={getSeverityColor(incident.severity) as any}
                        variant="left-accent"
                      >
                        <AlertIcon />
                        <VStack align="start" spacing={1}>
                          <AlertTitle fontSize="sm">
                            {incident.service}
                          </AlertTitle>
                          <AlertDescription fontSize="sm">
                            {incident.message}
                          </AlertDescription>
                          <Text fontSize="xs" color="gray.600">
                            {new Date(incident.timestamp).toLocaleString()}
                          </Text>
                        </VStack>
                      </Alert>
                    ))}
                    {(healthData.recentIncidents || []).length === 0 && (
                      <Text color="gray.500" textAlign="center" py={4}>
                        No recent incidents
                      </Text>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>
                    Quick Actions
                  </Heading>
                  <VStack spacing={3} align="stretch">
                    <Button
                      leftIcon={<FiDatabase />}
                      variant="outline"
                      size="sm"
                    >
                      Test Database Connection
                    </Button>
                    <Button leftIcon={<FiServer />} variant="outline" size="sm">
                      Clear Cache
                    </Button>
                    <Button leftIcon={<FiWifi />} variant="outline" size="sm">
                      Test Webhooks
                    </Button>
                    <Button
                      leftIcon={<FiRefreshCw />}
                      variant="outline"
                      size="sm"
                    >
                      Restart Queue Workers
                    </Button>
                  </VStack>
                </CardBody>
              </Card>

              {/* System Info */}
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>
                    System Information
                  </Heading>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm">Environment</Text>
                      <Badge colorScheme="blue" size="sm">
                        Production
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Version</Text>
                      <Text fontSize="sm">v2.1.0</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Region</Text>
                      <Text fontSize="sm">eu-west-2</Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Last Deployment</Text>
                      <Text fontSize="sm">2024-01-15 10:30</Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </Grid>

          {/* Health Checks */}
          <Card mt={6}>
            <CardBody>
              <Heading size="md" mb={4}>
                Health Checks
              </Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                <HStack
                  justify="space-between"
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                >
                  <HStack>
                    <FiCheckCircle color="green" />
                    <Text fontSize="sm">Database</Text>
                  </HStack>
                  <Text fontSize="sm" color="green.500">
                    ✓
                  </Text>
                </HStack>
                <HStack
                  justify="space-between"
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                >
                  <HStack>
                    <FiCheckCircle color="green" />
                    <Text fontSize="sm">Cache</Text>
                  </HStack>
                  <Text fontSize="sm" color="green.500">
                    ✓
                  </Text>
                </HStack>
                <HStack
                  justify="space-between"
                  p={3}
                  bg="yellow.50"
                  borderRadius="md"
                >
                  <HStack>
                    <FiAlertTriangle color="orange" />
                    <Text fontSize="sm">Queue</Text>
                  </HStack>
                  <Text fontSize="sm" color="orange.500">
                    ⚠
                  </Text>
                </HStack>
                <HStack
                  justify="space-between"
                  p={3}
                  bg="gray.50"
                  borderRadius="md"
                >
                  <HStack>
                    <FiCheckCircle color="green" />
                    <Text fontSize="sm">Webhooks</Text>
                  </HStack>
                  <Text fontSize="sm" color="green.500">
                    ✓
                  </Text>
                </HStack>
              </SimpleGrid>
            </CardBody>
          </Card>
        </>
      )}
    </Box>
  );
}
