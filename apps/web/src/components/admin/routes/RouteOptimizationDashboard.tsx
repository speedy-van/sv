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
  Badge,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
  Alert,
  AlertIcon,
  useToast,
  Spinner,
  SimpleGrid,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Select,
  NumberInput,
  NumberInputField,
  Checkbox,
} from '@chakra-ui/react';
import {
  FiTrendingUp,
  FiTrendingDown,
  FiNavigation,
  FiClock,
  FiDollarSign,
  FiZap,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';

interface RouteOptimizationMetrics {
  currentDistance: number;
  optimizedDistance: number;
  currentDuration: number;
  optimizedDuration: number;
  currentCost: number;
  optimizedCost: number;
  efficiencyGain: number;
  savings: number;
  suggestions: string[];
}

interface RouteOptimizationDashboardProps {
  routeId: string;
  currentRoute?: {
    drops: Array<{
      id: string;
      sequenceNumber: number;
      lat: number;
      lng: number;
    }>;
    optimizedDistanceKm?: number;
    estimatedDuration?: number;
  };
  onOptimize?: (optimizedRoute: any) => Promise<void>;
}

export function RouteOptimizationDashboard({
  routeId,
  currentRoute,
  onOptimize,
}: RouteOptimizationDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [metrics, setMetrics] = useState<RouteOptimizationMetrics | null>(null);
  const [optimizationMode, setOptimizationMode] = useState<'distance' | 'time' | 'cost' | 'balanced'>('balanced');
  const [includeTraffic, setIncludeTraffic] = useState(true);
  const [includeTimeWindows, setIncludeTimeWindows] = useState(true);
  const {
    isOpen: isOptimizeModalOpen,
    onOpen: onOptimizeModalOpen,
    onClose: onOptimizeModalClose,
  } = useDisclosure();
  const toast = useToast();

  const loadOptimizationMetrics = async () => {
    if (!currentRoute || !currentRoute.drops || currentRoute.drops.length < 2) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/routes/${routeId}/optimize?preview=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: optimizationMode,
          includeTraffic,
          includeTimeWindows,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMetrics(result.metrics);
      }
    } catch (error) {
      console.error('Error loading optimization metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentRoute && currentRoute.drops && currentRoute.drops.length >= 2) {
      loadOptimizationMetrics();
    }
  }, [routeId, optimizationMode, includeTraffic, includeTimeWindows]);

  const handleOptimize = async () => {
    setOptimizing(true);
    try {
      const response = await fetch(`/api/admin/routes/${routeId}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: optimizationMode,
          includeTraffic,
          includeTimeWindows,
          apply: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (onOptimize) {
          await onOptimize(result.optimizedRoute);
        }

        toast({
          title: 'Route Optimized',
          description: `Route optimized successfully. Efficiency gain: ${result.metrics?.efficiencyGain?.toFixed(1)}%`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        onOptimizeModalClose();
        loadOptimizationMetrics();
      } else {
        throw new Error('Optimization failed');
      }
    } catch (error) {
      toast({
        title: 'Optimization Failed',
        description: error instanceof Error ? error.message : 'Failed to optimize route',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setOptimizing(false);
    }
  };

  if (!currentRoute || !currentRoute.drops || currentRoute.drops.length < 2) {
    return (
      <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
        <CardBody>
          <Alert status="info" bg="#18233A" borderColor="#2A3A5E">
            <AlertIcon />
            <Text color="#F5F8FF">
              Route needs at least 2 drops for optimization
            </Text>
          </Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack align="stretch" spacing={4}>
      {/* Optimization Controls */}
      <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
        <CardHeader>
          <HStack justify="space-between">
            <HStack spacing={2}>
              <FiZap color="#f59e0b" />
              <Text fontWeight="bold" fontSize="lg" color="#F5F8FF">
                Route Optimization
              </Text>
            </HStack>
            <Button
              leftIcon={<FiRefreshCw />}
              size="sm"
              onClick={loadOptimizationMetrics}
              isLoading={loading}
              bg="#2563eb"
              color="#F5F8FF"
              _hover={{ bg: '#1d4ed8' }}
            >
              Refresh Metrics
            </Button>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack align="stretch" spacing={4}>
            <SimpleGrid columns={2} spacing={4}>
              <FormControl>
                <FormLabel color="#9ca3af" fontSize="sm">Optimization Mode</FormLabel>
                <Select
                  value={optimizationMode}
                  onChange={(e) => setOptimizationMode(e.target.value as any)}
                  bg="#121A2B"
                  color="#F5F8FF"
                  borderColor="#2A3A5E"
                >
                  <option value="balanced">Balanced (Recommended)</option>
                  <option value="distance">Minimize Distance</option>
                  <option value="time">Minimize Time</option>
                  <option value="cost">Minimize Cost</option>
                </Select>
              </FormControl>
              <VStack align="start" spacing={2}>
                <Checkbox
                  isChecked={includeTraffic}
                  onChange={(e) => setIncludeTraffic(e.target.checked)}
                  colorScheme="blue"
                >
                  <Text color="#F5F8FF" fontSize="sm">Include Traffic Data</Text>
                </Checkbox>
                <Checkbox
                  isChecked={includeTimeWindows}
                  onChange={(e) => setIncludeTimeWindows(e.target.checked)}
                  colorScheme="blue"
                >
                  <Text color="#F5F8FF" fontSize="sm">Respect Time Windows</Text>
                </Checkbox>
              </VStack>
            </SimpleGrid>

            <Button
              leftIcon={<FiZap />}
              onClick={onOptimizeModalOpen}
              bg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
              color="#F5F8FF"
              _hover={{ bg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' }}
              size="lg"
              fontWeight="bold"
            >
              Optimize Route
            </Button>
          </VStack>
        </CardBody>
      </Card>

      {/* Optimization Metrics */}
      {loading ? (
        <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
          <CardBody>
            <HStack justify="center" py={8}>
              <Spinner size="lg" color="#2563eb" />
            </HStack>
          </CardBody>
        </Card>
      ) : metrics ? (
        <SimpleGrid columns={3} spacing={4}>
          {/* Distance Savings */}
          <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
            <CardBody>
              <Stat>
                <StatLabel color="#9ca3af">Distance</StatLabel>
                <StatNumber color="#F5F8FF" fontSize="2xl">
                  {metrics.optimizedDistance.toFixed(1)} km
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={metrics.optimizedDistance < metrics.currentDistance ? 'decrease' : 'increase'} />
                  <Text as="span" color={metrics.optimizedDistance < metrics.currentDistance ? '#10b981' : '#ef4444'}>
                    {Math.abs(metrics.currentDistance - metrics.optimizedDistance).toFixed(1)} km
                  </Text>
                </StatHelpText>
                <Text fontSize="xs" color="#9ca3af" mt={1}>
                  Current: {metrics.currentDistance.toFixed(1)} km
                </Text>
              </Stat>
            </CardBody>
          </Card>

          {/* Time Savings */}
          <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
            <CardBody>
              <Stat>
                <StatLabel color="#9ca3af">Duration</StatLabel>
                <StatNumber color="#F5F8FF" fontSize="2xl">
                  {formatDuration(metrics.optimizedDuration)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={metrics.optimizedDuration < metrics.currentDuration ? 'decrease' : 'increase'} />
                  <Text as="span" color={metrics.optimizedDuration < metrics.currentDuration ? '#10b981' : '#ef4444'}>
                    {formatDuration(Math.abs(metrics.currentDuration - metrics.optimizedDuration))}
                  </Text>
                </StatHelpText>
                <Text fontSize="xs" color="#9ca3af" mt={1}>
                  Current: {formatDuration(metrics.currentDuration)}
                </Text>
              </Stat>
            </CardBody>
          </Card>

          {/* Cost Savings */}
          <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
            <CardBody>
              <Stat>
                <StatLabel color="#9ca3af">Cost</StatLabel>
                <StatNumber color="#F5F8FF" fontSize="2xl">
                  £{((metrics.optimizedCost || 0) / 100).toFixed(2)}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type={(metrics.optimizedCost || 0) < (metrics.currentCost || 0) ? 'decrease' : 'increase'} />
                  <Text as="span" color={(metrics.optimizedCost || 0) < (metrics.currentCost || 0) ? '#10b981' : '#ef4444'}>
                    £{((Math.abs((metrics.currentCost || 0) - (metrics.optimizedCost || 0))) / 100).toFixed(2)}
                  </Text>
                </StatHelpText>
                <Text fontSize="xs" color="#9ca3af" mt={1}>
                  Current: £{((metrics.currentCost || 0) / 100).toFixed(2)}
                </Text>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      ) : null}

      {/* Efficiency Gain */}
      {metrics && (
        <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <Text fontWeight="bold" color="#F5F8FF">
                  Overall Efficiency Gain
                </Text>
                <Badge
                  colorScheme={metrics.efficiencyGain > 0 ? 'green' : 'red'}
                  fontSize="lg"
                  px={3}
                  py={1}
                >
                  {metrics.efficiencyGain > 0 ? '+' : ''}{metrics.efficiencyGain.toFixed(1)}%
                </Badge>
              </HStack>
              <Progress
                value={Math.abs(metrics.efficiencyGain)}
                colorScheme={metrics.efficiencyGain > 0 ? 'green' : 'red'}
                size="lg"
                borderRadius="full"
              />
              {metrics.savings > 0 && (
                <HStack>
                  <FiDollarSign color="#10b981" />
                  <Text color="#10b981" fontWeight="bold">
                    Potential Savings: £{(metrics.savings / 100).toFixed(2)}
                  </Text>
                </HStack>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Suggestions */}
      {metrics && metrics.suggestions && metrics.suggestions.length > 0 && (
        <Card bg="#0B1020" borderColor="#2A3A5E" borderWidth={1}>
          <CardHeader>
            <Text fontWeight="bold" color="#F5F8FF">
              Optimization Suggestions
            </Text>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={2}>
              {metrics.suggestions.map((suggestion, index) => (
                <HStack key={index} align="start" spacing={2}>
                  <FiAlertCircle color="#f59e0b" />
                  <Text fontSize="sm" color="#F5F8FF" flex={1}>
                    {suggestion}
                  </Text>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Optimize Confirmation Modal */}
      <Modal isOpen={isOptimizeModalOpen} onClose={onOptimizeModalClose} size="lg">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg="#0B1020" borderColor="#2A3A5E" borderWidth={2}>
          <ModalHeader color="#F5F8FF">Confirm Route Optimization</ModalHeader>
          <ModalCloseButton color="#F5F8FF" />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Alert status="warning" bg="#18233A" borderColor="#2A3A5E">
                <AlertIcon />
                <Text fontSize="sm" color="#F5F8FF">
                  This will reorder the route stops to optimize efficiency. The current order will be replaced.
                </Text>
              </Alert>
              {metrics && (
                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="bold" color="#F5F8FF">Expected Improvements:</Text>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="#9ca3af">Distance Reduction:</Text>
                    <Text fontSize="sm" color="#10b981" fontWeight="bold">
                      {((metrics.currentDistance - metrics.optimizedDistance) / metrics.currentDistance * 100).toFixed(1)}%
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="#9ca3af">Time Reduction:</Text>
                    <Text fontSize="sm" color="#10b981" fontWeight="bold">
                      {((metrics.currentDuration - metrics.optimizedDuration) / metrics.currentDuration * 100).toFixed(1)}%
                    </Text>
                  </HStack>
                  {metrics.savings > 0 && (
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="#9ca3af">Cost Savings:</Text>
                      <Text fontSize="sm" color="#10b981" fontWeight="bold">
                        £{(metrics.savings / 100).toFixed(2)}
                      </Text>
                    </HStack>
                  )}
                </VStack>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack>
              <Button
                variant="outline"
                onClick={onOptimizeModalClose}
                borderColor="#2A3A5E"
                color="#F5F8FF"
                _hover={{ bg: '#18233A' }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="orange"
                onClick={handleOptimize}
                isLoading={optimizing}
                bg="#f59e0b"
                color="#F5F8FF"
                _hover={{ bg: '#d97706' }}
                leftIcon={<FiZap />}
              >
                Optimize Route
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

