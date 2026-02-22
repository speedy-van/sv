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
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiClock,
  FiNavigation,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiBarChart2,
  FiTarget,
  FiActivity,
} from 'react-icons/fi';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';

interface RoutePerformanceMetricsProps {
  routeId: string;
  route?: {
    id: string;
    reference?: string;
    status: string;
    startTime: Date | string;
    endTime?: Date | string;
    totalDrops: number;
    completedDrops: number;
    optimizedDistanceKm?: number;
    estimatedDuration?: number;
    actualDuration?: number;
    totalOutcome: number;
    drops?: Array<{
      id: string;
      status: string;
      completedAt?: Date | string;
      estimatedArrival?: Date | string;
      quotedPrice: number;
    }>;
  };
  onRefresh?: () => Promise<void>;
}

interface PerformanceMetrics {
  onTimePerformance: {
    onTime: number;
    late: number;
    early: number;
    onTimeRate: number;
  };
  efficiency: {
    distanceEfficiency: number;
    timeEfficiency: number;
    costEfficiency: number;
    overallEfficiency: number;
  };
  completion: {
    completed: number;
    pending: number;
    failed: number;
    completionRate: number;
  };
  financial: {
    totalRevenue: number;
    estimatedCost: number;
    profit: number;
    profitMargin: number;
  };
  driverPerformance?: {
    averageStopTime: number;
    totalIdleTime: number;
    utilizationRate: number;
  };
  dropMetrics: Array<{
    dropId: string;
    sequence: number;
    status: string;
    scheduledTime: string;
    actualTime?: string;
    delay?: number;
    efficiency: number;
  }>;
}

export function RoutePerformanceMetrics({
  routeId,
  route,
  onRefresh,
}: RoutePerformanceMetricsProps) {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (route) {
      calculateMetrics();
    }
  }, [route]);

  const calculateMetrics = async () => {
    if (!route) return;

    setLoading(true);
    try {
      // Calculate on-time performance
      const drops = route.drops || [];
      const completedDrops = drops.filter(d => d.status === 'completed');
      
      let onTime = 0;
      let late = 0;
      let early = 0;

      completedDrops.forEach(drop => {
        if (drop.completedAt && drop.estimatedArrival) {
          const actual = new Date(drop.completedAt);
          const estimated = new Date(drop.estimatedArrival);
          const diffMinutes = differenceInMinutes(actual, estimated);
          
          if (Math.abs(diffMinutes) <= 5) {
            onTime++;
          } else if (diffMinutes > 5) {
            late++;
          } else {
            early++;
          }
        }
      });

      const onTimeRate = completedDrops.length > 0
        ? (onTime / completedDrops.length) * 100
        : 0;

      // Calculate efficiency
      const actualDistance = route.optimizedDistanceKm || 0;
      const estimatedDistance = route.optimizedDistanceKm || 0;
      const distanceEfficiency = estimatedDistance > 0
        ? ((estimatedDistance - Math.abs(actualDistance - estimatedDistance)) / estimatedDistance) * 100
        : 100;

      const estimatedDuration = route.estimatedDuration || 0;
      const actualDuration = route.actualDuration || 0;
      const timeEfficiency = estimatedDuration > 0 && actualDuration > 0
        ? ((estimatedDuration - Math.abs(actualDuration - estimatedDuration)) / estimatedDuration) * 100
        : estimatedDuration > 0 ? 100 : 0;

      const totalRevenue = route.totalOutcome || 0;
      const estimatedCost = (actualDistance * 0.5) * 100; // £0.50 per km in pence
      const profit = totalRevenue - estimatedCost;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      const costEfficiency = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      const overallEfficiency = (distanceEfficiency + timeEfficiency + costEfficiency) / 3;

      // Calculate completion metrics
      const completed = drops.filter(d => d.status === 'completed').length;
      const pending = drops.filter(d => d.status === 'pending' || d.status === 'assigned_to_route').length;
      const failed = drops.filter(d => d.status === 'failed' || d.status === 'cancelled').length;
      const completionRate = drops.length > 0 ? (completed / drops.length) * 100 : 0;

      // Calculate driver performance
      const averageStopTime = completedDrops.length > 0
        ? (actualDuration || 0) / completedDrops.length
        : 0;
      const totalIdleTime = Math.max(0, (actualDuration || 0) - (estimatedDuration || 0));
      const utilizationRate = estimatedDuration > 0 && actualDuration > 0
        ? ((estimatedDuration / actualDuration) * 100)
        : 100;

      // Calculate drop metrics
      const dropMetrics = drops.map((drop, index) => {
        let delay = 0;
        let efficiency = 100;

        if (drop.completedAt && drop.estimatedArrival) {
          const actual = new Date(drop.completedAt);
          const estimated = new Date(drop.estimatedArrival);
          delay = differenceInMinutes(actual, estimated);
          
          if (Math.abs(delay) <= 5) {
            efficiency = 100;
          } else if (Math.abs(delay) <= 15) {
            efficiency = 80;
          } else if (Math.abs(delay) <= 30) {
            efficiency = 60;
          } else {
            efficiency = 40;
          }
        }

        return {
          dropId: drop.id,
          sequence: index + 1,
          status: drop.status,
          scheduledTime: drop.estimatedArrival
            ? format(new Date(drop.estimatedArrival), 'HH:mm')
            : 'N/A',
          actualTime: drop.completedAt
            ? format(new Date(drop.completedAt), 'HH:mm')
            : undefined,
          delay,
          efficiency,
        };
      });

      setMetrics({
        onTimePerformance: {
          onTime,
          late,
          early,
          onTimeRate,
        },
        efficiency: {
          distanceEfficiency,
          timeEfficiency,
          costEfficiency,
          overallEfficiency,
        },
        completion: {
          completed,
          pending,
          failed,
          completionRate,
        },
        financial: {
          totalRevenue,
          estimatedCost,
          profit,
          profitMargin,
        },
        driverPerformance: {
          averageStopTime,
          totalIdleTime,
          utilizationRate,
        },
        dropMetrics,
      });
    } catch (error) {
      console.error('Error calculating metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to calculate performance metrics',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
        <CardBody>
          <HStack justify="center" py={8}>
            <Spinner size="lg" color="#2563eb" />
          </HStack>
        </CardBody>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
        <CardBody>
          <Alert status="info" bg="#18233A" borderColor="#2A3A5E">
            <AlertIcon />
            <Text color="#F5F8FF">
              No performance data available for this route
            </Text>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      {/* Overall Performance Score */}
      <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
        <CardHeader>
          <HStack justify="space-between">
            <HStack spacing={2}>
              <FiBarChart2 color="#2563eb" />
              <Text fontWeight="bold" fontSize="lg" color="#F5F8FF">
                Overall Performance Score
              </Text>
            </HStack>
            <Badge
              colorScheme={
                metrics.efficiency.overallEfficiency >= 80 ? 'green' :
                metrics.efficiency.overallEfficiency >= 60 ? 'yellow' : 'red'
              }
              fontSize="lg"
              px={4}
              py={2}
            >
              {metrics.efficiency.overallEfficiency.toFixed(1)}%
            </Badge>
          </HStack>
        </CardHeader>
        <CardBody>
          <Progress
            value={metrics.efficiency.overallEfficiency}
            colorScheme={
              metrics.efficiency.overallEfficiency >= 80 ? 'green' :
              metrics.efficiency.overallEfficiency >= 60 ? 'yellow' : 'red'
            }
            size="lg"
            borderRadius="full"
            mb={4}
          />
          <SimpleGrid columns={3} spacing={4}>
            <Stat>
              <StatLabel color="#9ca3af">Distance Efficiency</StatLabel>
              <StatNumber color="#F5F8FF" fontSize="xl">
                {metrics.efficiency.distanceEfficiency.toFixed(1)}%
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel color="#9ca3af">Time Efficiency</StatLabel>
              <StatNumber color="#F5F8FF" fontSize="xl">
                {metrics.efficiency.timeEfficiency.toFixed(1)}%
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel color="#9ca3af">Cost Efficiency</StatLabel>
              <StatNumber color="#F5F8FF" fontSize="xl">
                {metrics.efficiency.costEfficiency.toFixed(1)}%
              </StatNumber>
            </Stat>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Key Metrics Grid */}
      <SimpleGrid columns={4} spacing={4}>
        {/* On-Time Performance */}
        <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel color="#9ca3af">On-Time Rate</StatLabel>
              <StatNumber color="#F5F8FF" fontSize="2xl">
                {metrics.onTimePerformance.onTimeRate.toFixed(1)}%
              </StatNumber>
              <StatHelpText>
                <HStack spacing={1}>
                  <Text fontSize="xs" color="#10b981">
                    On: {metrics.onTimePerformance.onTime}
                  </Text>
                  <Text fontSize="xs" color="#ef4444">
                    Late: {metrics.onTimePerformance.late}
                  </Text>
                </HStack>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* Completion Rate */}
        <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel color="#9ca3af">Completion Rate</StatLabel>
              <StatNumber color="#F5F8FF" fontSize="2xl">
                {metrics.completion.completionRate.toFixed(1)}%
              </StatNumber>
              <StatHelpText>
                <Text fontSize="xs" color="#9ca3af">
                  {metrics.completion.completed}/{route?.totalDrops || 0} completed
                </Text>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* Profit Margin */}
        <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel color="#9ca3af">Profit Margin</StatLabel>
              <StatNumber color="#F5F8FF" fontSize="2xl">
                {metrics.financial.profitMargin.toFixed(1)}%
              </StatNumber>
              <StatHelpText>
                <StatArrow
                  type={metrics.financial.profitMargin > 0 ? 'increase' : 'decrease'}
                />
                <Text fontSize="xs" color={metrics.financial.profitMargin > 0 ? '#10b981' : '#ef4444'}>
                  £{((metrics.financial.profit || 0) / 100).toFixed(2)}
                </Text>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        {/* Driver Utilization */}
        {metrics.driverPerformance && (
          <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
            <CardBody>
              <Stat>
                <StatLabel color="#9ca3af">Driver Utilization</StatLabel>
                <StatNumber color="#F5F8FF" fontSize="2xl">
                  {metrics.driverPerformance.utilizationRate.toFixed(1)}%
                </StatNumber>
                <StatHelpText>
                  <Text fontSize="xs" color="#9ca3af">
                    Avg: {metrics.driverPerformance.averageStopTime.toFixed(0)} min/stop
                  </Text>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        )}
      </SimpleGrid>

      {/* Financial Breakdown */}
      <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
        <CardHeader>
          <Text fontWeight="bold" fontSize="md" color="#F5F8FF">
            Financial Breakdown
          </Text>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={3} spacing={4}>
            <Box>
              <Text fontSize="sm" color="#9ca3af" mb={1}>Total Revenue</Text>
              <Text fontSize="xl" fontWeight="bold" color="#10b981">
                £{((metrics.financial.totalRevenue || 0) / 100).toFixed(2)}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="#9ca3af" mb={1}>Estimated Cost</Text>
              <Text fontSize="xl" fontWeight="bold" color="#f59e0b">
                £{((metrics.financial.estimatedCost || 0) / 100).toFixed(2)}
              </Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="#9ca3af" mb={1}>Net Profit</Text>
              <Text fontSize="xl" fontWeight="bold" color={metrics.financial.profit > 0 ? '#10b981' : '#ef4444'}>
                £{((metrics.financial.profit || 0) / 100).toFixed(2)}
              </Text>
            </Box>
          </SimpleGrid>
        </CardBody>
      </Card>

      {/* Drop Performance Table */}
      <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
        <CardHeader>
          <Text fontWeight="bold" fontSize="md" color="#F5F8FF">
            Drop Performance
          </Text>
        </CardHeader>
        <CardBody>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th color="#F5F8FF" borderColor="#2A3A5E">#</Th>
                <Th color="#F5F8FF" borderColor="#2A3A5E">Status</Th>
                <Th color="#F5F8FF" borderColor="#2A3A5E">Scheduled</Th>
                <Th color="#F5F8FF" borderColor="#2A3A5E">Actual</Th>
                <Th color="#F5F8FF" borderColor="#2A3A5E">Delay</Th>
                <Th color="#F5F8FF" borderColor="#2A3A5E">Efficiency</Th>
              </Tr>
            </Thead>
            <Tbody>
              {metrics.dropMetrics.map((drop) => (
                <Tr key={drop.dropId}>
                  <Td color="#F5F8FF" borderColor="#2A3A5E">{drop.sequence}</Td>
                  <Td borderColor="#2A3A5E">
                    <Badge
                      colorScheme={
                        drop.status === 'completed' ? 'green' :
                        drop.status === 'pending' ? 'yellow' :
                        drop.status === 'failed' ? 'red' : 'gray'
                      }
                      size="sm"
                    >
                      {drop.status}
                    </Badge>
                  </Td>
                  <Td color="#F5F8FF" borderColor="#2A3A5E">{drop.scheduledTime}</Td>
                  <Td color="#F5F8FF" borderColor="#2A3A5E">
                    {drop.actualTime || '-'}
                  </Td>
                  <Td borderColor="#2A3A5E">
                    {drop.delay !== undefined ? (
                      <Text
                        color={Math.abs(drop.delay) <= 5 ? '#10b981' : drop.delay > 0 ? '#ef4444' : '#3b82f6'}
                        fontWeight="bold"
                      >
                        {drop.delay > 0 ? '+' : ''}{drop.delay} min
                      </Text>
                    ) : (
                      <Text color="#9ca3af">-</Text>
                    )}
                  </Td>
                  <Td borderColor="#2A3A5E">
                    <HStack spacing={2}>
                      <Progress
                        value={drop.efficiency}
                        colorScheme={
                          drop.efficiency >= 80 ? 'green' :
                          drop.efficiency >= 60 ? 'yellow' : 'red'
                        }
                        size="sm"
                        w="60px"
                        borderRadius="full"
                      />
                      <Text color="#F5F8FF" fontSize="xs">
                        {drop.efficiency}%
                      </Text>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </CardBody>
      </Card>

      {/* Performance Insights */}
      <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
        <CardHeader>
          <HStack spacing={2}>
            <FiTarget color="#f59e0b" />
            <Text fontWeight="bold" fontSize="md" color="#F5F8FF">
              Performance Insights
            </Text>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack align="stretch" spacing={3}>
            {metrics.onTimePerformance.onTimeRate >= 90 && (
              <Alert status="success" bg="#18233A" borderColor="#10b981">
                <AlertIcon color="#10b981" />
                <Text fontSize="sm" color="#F5F8FF">
                  Excellent on-time performance! {metrics.onTimePerformance.onTimeRate.toFixed(1)}% of drops completed on time.
                </Text>
              </Alert>
            )}
            {metrics.onTimePerformance.late > metrics.onTimePerformance.onTime && (
              <Alert status="warning" bg="#18233A" borderColor="#f59e0b">
                <AlertIcon color="#f59e0b" />
                <Text fontSize="sm" color="#F5F8FF">
                  {metrics.onTimePerformance.late} drops were late. Consider optimizing route or adjusting time windows.
                </Text>
              </Alert>
            )}
            {metrics.efficiency.overallEfficiency < 60 && (
              <Alert status="error" bg="#18233A" borderColor="#ef4444">
                <AlertIcon color="#ef4444" />
                <Text fontSize="sm" color="#F5F8FF">
                  Route efficiency is below target. Review route optimization and driver performance.
                </Text>
              </Alert>
            )}
            {metrics.financial.profitMargin < 20 && (
              <Alert status="warning" bg="#18233A" borderColor="#f59e0b">
                <AlertIcon color="#f59e0b" />
                <Text fontSize="sm" color="#F5F8FF">
                  Low profit margin ({metrics.financial.profitMargin.toFixed(1)}%). Consider route optimization or pricing review.
                </Text>
              </Alert>
            )}
            {metrics.completion.completionRate === 100 && (
              <Alert status="success" bg="#18233A" borderColor="#10b981">
                <AlertIcon color="#10b981" />
                <Text fontSize="sm" color="#F5F8FF">
                  All drops completed successfully! Great job!
                </Text>
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}

