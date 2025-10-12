/**
 * Routing Mode Toggle Component
 * 
 * Toggle switch to control Auto/Manual routing modes
 * Displays in Admin Dashboard with real-time status
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Switch,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  Button,
  useToast,
  Tooltip,
  Card,
  CardBody,
  Spinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FaRobot, FaUserCog, FaPlay, FaCog, FaHistory, FaClock } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface RoutingConfig {
  routingMode: 'auto' | 'manual';
  autoRoutingEnabled: boolean;
  autoRoutingIntervalMin: number;
  maxDropsPerRoute: number;
  maxRouteDistanceKm: number;
  autoAssignDrivers: boolean;
  requireAdminApproval: boolean;
  minDropsForAutoRoute: number;
}

interface CronStatus {
  enabled: boolean;
  intervalMinutes: number;
  lastRun?: string;
  nextRun?: string;
  recentRuns: Array<{
    timestamp: string;
    result: string;
    details: any;
  }>;
}

export default function RoutingModeToggle() {
  const [config, setConfig] = useState<RoutingConfig | null>(null);
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    loadConfig();
    loadCronStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadConfig();
      loadCronStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/routing/settings');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.data);
      }
    } catch (error) {
      console.error('Failed to load routing config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCronStatus = async () => {
    try {
      const response = await fetch('/api/admin/routing/cron');
      const data = await response.json();
      
      if (data.success) {
        setCronStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to load cron status:', error);
    }
  };

  const handleToggle = async () => {
    if (!config) return;

    const newMode = config.routingMode === 'auto' ? 'manual' : 'auto';
    setIsSwitching(true);

    try {
      const response = await fetch('/api/admin/routing/settings/mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Routing mode switched to ${newMode.toUpperCase()}`,
          status: 'success',
          duration: 3000,
        });
        await loadConfig();
      } else {
        throw new Error(data.error || 'Failed to switch mode');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to switch routing mode',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSwitching(false);
    }
  };

  const handleTriggerAutoRouting = async () => {
    setIsTriggering(true);

    try {
      const response = await fetch('/api/admin/routing/trigger', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Auto-Routing Triggered',
          description: data.message,
          status: 'success',
          duration: 5000,
        });
        await loadConfig();
        await loadCronStatus();
      } else {
        throw new Error(data.error || 'Failed to trigger auto-routing');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to trigger auto-routing',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsTriggering(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <HStack justify="center" py={4}>
            <Spinner size="sm" />
            <Text>Loading routing configuration...</Text>
          </HStack>
        </CardBody>
      </Card>
    );
  }

  if (!config) {
    return null;
  }

  const isAutoMode = config.routingMode === 'auto';

  return (
    <>
      <Card 
        bg={isAutoMode ? 'blue.50' : 'gray.50'} 
        borderWidth={2}
        borderColor={isAutoMode ? 'blue.400' : 'gray.300'}
      >
        <CardBody>
          <VStack align="stretch" spacing={4}>
            {/* Main Toggle */}
            <HStack justify="space-between">
              <HStack spacing={3}>
                <Icon
                  as={isAutoMode ? FaRobot : FaUserCog}
                  boxSize={6}
                  color={isAutoMode ? 'blue.500' : 'gray.600'}
                />
                <VStack align="start" spacing={0}>
                  <HStack>
                    <Text fontWeight="bold" fontSize="lg">
                      Routing Mode
                    </Text>
                    <Badge
                      colorScheme={isAutoMode ? 'blue' : 'gray'}
                      fontSize="sm"
                      px={2}
                      py={1}
                    >
                      {isAutoMode ? 'AUTO' : 'MANUAL'}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600">
                    {isAutoMode
                      ? 'System automatically creates optimized routes'
                      : 'Admin manually creates routes from orders'}
                  </Text>
                </VStack>
              </HStack>

              <Tooltip label={isSwitching ? 'Switching...' : `Switch to ${isAutoMode ? 'Manual' : 'Auto'} mode`}>
                <Switch
                  size="lg"
                  colorScheme="blue"
                  isChecked={isAutoMode}
                  onChange={handleToggle}
                  isDisabled={isSwitching}
                />
              </Tooltip>
            </HStack>

            {/* Auto Mode Details */}
            {isAutoMode && (
              <Box 
                bg="white" 
                p={4} 
                borderRadius="md" 
                borderWidth={1}
                borderColor="blue.200"
              >
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FaClock} color="blue.500" />
                      <Text fontSize="sm" fontWeight="medium">
                        Auto-Routing Status
                      </Text>
                    </HStack>
                    <Badge colorScheme={cronStatus?.enabled ? 'green' : 'red'}>
                      {cronStatus?.enabled ? 'ACTIVE' : 'DISABLED'}
                    </Badge>
                  </HStack>

                  {cronStatus && (
                    <>
                      <HStack justify="space-between" fontSize="sm">
                        <Text color="gray.600">Interval:</Text>
                        <Text fontWeight="medium">Every {cronStatus.intervalMinutes} minutes</Text>
                      </HStack>

                      {cronStatus.lastRun && (
                        <HStack justify="space-between" fontSize="sm">
                          <Text color="gray.600">Last Run:</Text>
                          <Text fontWeight="medium">
                            {formatDistanceToNow(new Date(cronStatus.lastRun), { addSuffix: true })}
                          </Text>
                        </HStack>
                      )}

                      {cronStatus.nextRun && (
                        <HStack justify="space-between" fontSize="sm">
                          <Text color="gray.600">Next Run:</Text>
                          <Text fontWeight="medium">
                            {formatDistanceToNow(new Date(cronStatus.nextRun), { addSuffix: true })}
                          </Text>
                        </HStack>
                      )}
                    </>
                  )}

                  <HStack spacing={2} pt={2}>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<FaPlay />}
                      onClick={handleTriggerAutoRouting}
                      isLoading={isTriggering}
                      loadingText="Running..."
                    >
                      Trigger Now
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<FaCog />}
                      onClick={onOpen}
                    >
                      Settings
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<FaHistory />}
                      onClick={() => window.open('/admin/logs?type=auto_routing', '_blank')}
                    >
                      History
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            )}

            {/* Manual Mode Info */}
            {!isAutoMode && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Text fontSize="sm">
                  Manual mode active. Create routes from Orders page by selecting bookings and clicking "Create Route".
                </Text>
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Settings Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Auto-Routing Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Configuration
                </Text>
                <VStack align="stretch" spacing={2} pl={4}>
                  <HStack justify="space-between" fontSize="sm">
                    <Text color="gray.600">Max Drops per Route:</Text>
                    <Text fontWeight="medium">{config.maxDropsPerRoute}</Text>
                  </HStack>
                  <HStack justify="space-between" fontSize="sm">
                    <Text color="gray.600">Max Route Distance:</Text>
                    <Text fontWeight="medium">{config.maxRouteDistanceKm} km</Text>
                  </HStack>
                  <HStack justify="space-between" fontSize="sm">
                    <Text color="gray.600">Min Drops for Auto:</Text>
                    <Text fontWeight="medium">{config.minDropsForAutoRoute}</Text>
                  </HStack>
                  <HStack justify="space-between" fontSize="sm">
                    <Text color="gray.600">Auto-Assign Drivers:</Text>
                    <Badge colorScheme={config.autoAssignDrivers ? 'green' : 'gray'}>
                      {config.autoAssignDrivers ? 'YES' : 'NO'}
                    </Badge>
                  </HStack>
                  <HStack justify="space-between" fontSize="sm">
                    <Text color="gray.600">Require Admin Approval:</Text>
                    <Badge colorScheme={config.requireAdminApproval ? 'orange' : 'green'}>
                      {config.requireAdminApproval ? 'YES' : 'NO'}
                    </Badge>
                  </HStack>
                </VStack>
              </Box>

              <Alert status="warning" fontSize="sm">
                <AlertIcon />
                To modify these settings, go to Settings → Orders Management
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

