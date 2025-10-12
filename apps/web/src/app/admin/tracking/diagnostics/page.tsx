'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  Card,
  CardBody,
  Badge,
  Button,
  useToast,
  useColorModeValue,
  Grid,
  GridItem,
  Code,
  List,
  ListItem,
  ListIcon,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  FiWifi,
  FiWifiOff,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
  FiPlay,
  FiDatabase,
} from 'react-icons/fi';
import { useAdminRealTimeTracking } from '@/hooks/useRealTimeTracking';

interface DiagnosticData {
  timestamp: string;
  database: {
    connected: boolean;
    activeBookings: number;
    driversWithLocations: number;
    recentTrackingPings: number;
  };
  pusher: {
    configured: boolean;
    credentials: any;
    serverInstance: boolean;
  };
  realTimeFlow: {
    driverToAdmin: boolean;
    lastLocationUpdate: any;
    testChannelWorking: boolean;
  };
  recommendations: string[];
}

export default function AdminTrackingDiagnostics() {
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingChannel, setTestingChannel] = useState(false);
  const [simulatingUpdate, setSimulatingUpdate] = useState(false);
  const [realtimeMessages, setRealtimeMessages] = useState<any[]>([]);

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');

  // Real-time tracking hook with detailed logging
  const { isConnected, connectionStatus } = useAdminRealTimeTracking({
    onUpdate: update => {
      console.log('🔄 Diagnostic page received real-time update:', update);
      
      // Add to message log
      setRealtimeMessages(prev => [
        {
          timestamp: new Date().toISOString(),
          type: update.type,
          data: update,
        },
        ...prev.slice(0, 9) // Keep only last 10 messages
      ]);

      toast({
        title: 'Real-time Update Received!',
        description: `${update.type.toUpperCase()}: ${update.data?.bookingReference || update.bookingId}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    },
  });

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tracking-diagnostics');
      if (response.ok) {
        const data = await response.json();
        setDiagnosticData(data.diagnostics);
      } else {
        throw new Error('Failed to load diagnostics');
      }
    } catch (error) {
      console.error('Error loading diagnostics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load diagnostic data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const testAdminChannel = async () => {
    try {
      setTestingChannel(true);
      const response = await fetch('/api/admin/tracking-diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-admin-channel' }),
      });

      if (response.ok) {
        toast({
          title: 'Test Sent',
          description: 'Test message sent to admin-tracking channel. Check console for received message.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error testing channel:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setTestingChannel(false);
    }
  };

  const simulateLocationUpdate = async () => {
    try {
      setSimulatingUpdate(true);
      const response = await fetch('/api/admin/tracking-diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'simulate-location-update' }),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Location Update Simulated',
          description: `Simulated update for booking: ${data.booking?.reference}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error simulating update:', error);
      toast({
        title: 'Error',
        description: 'Failed to simulate location update',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSimulatingUpdate(false);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading size="lg">Admin Tracking Diagnostics</Heading>
          <Spinner size="xl" />
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <HStack justify="space-between" align="center">
          <VStack align="start" spacing={2}>
            <Heading size="lg">Admin Tracking Diagnostics</Heading>
            <Text color="gray.600">
              Monitor real-time tracking system health and connectivity
            </Text>
          </VStack>
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={loadDiagnostics}
            isLoading={loading}
          >
            Refresh
          </Button>
        </HStack>

        {/* Connection Status */}
        <Card>
          <CardBody>
            <VStack align="start" spacing={4}>
              <Heading size="md">Real-time Connection Status</Heading>
              <HStack>
                {isConnected ? (
                  <>
                    <FiWifi color="green" size={24} />
                    <Badge colorScheme="green">Connected</Badge>
                    <Text>Admin dashboard is receiving real-time updates</Text>
                  </>
                ) : (
                  <>
                    <FiWifiOff color="red" size={24} />
                    <Badge colorScheme="red">Disconnected</Badge>
                    <Text>Admin dashboard is NOT receiving real-time updates</Text>
                  </>
                )}
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* System Health */}
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
          <Card>
            <CardBody>
              <VStack align="start" spacing={4}>
                <HStack>
                  <FiDatabase />
                  <Heading size="md">Database Status</Heading>
                </HStack>
                {diagnosticData && (
                  <VStack align="start" spacing={2}>
                    <HStack>
                      <FiCheckCircle color="green" />
                      <Text>Active Bookings: {diagnosticData.database.activeBookings}</Text>
                    </HStack>
                    <HStack>
                      <FiCheckCircle color="green" />
                      <Text>Drivers with Jobs: {diagnosticData.database.driversWithLocations}</Text>
                    </HStack>
                    <HStack>
                      <FiCheckCircle color="green" />
                      <Text>Recent Location Pings: {diagnosticData.database.recentTrackingPings}</Text>
                    </HStack>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack align="start" spacing={4}>
                <HStack>
                  <FiWifi />
                  <Heading size="md">Pusher Configuration</Heading>
                </HStack>
                {diagnosticData && (
                  <VStack align="start" spacing={2}>
                    <HStack>
                      {diagnosticData.pusher.configured ? (
                        <FiCheckCircle color="green" />
                      ) : (
                        <FiAlertCircle color="red" />
                      )}
                      <Text>
                        Pusher: {diagnosticData.pusher.configured ? 'Configured' : 'Not Configured'}
                      </Text>
                    </HStack>
                    <HStack>
                      {diagnosticData.pusher.serverInstance ? (
                        <FiCheckCircle color="green" />
                      ) : (
                        <FiAlertCircle color="red" />
                      )}
                      <Text>
                        Server Instance: {diagnosticData.pusher.serverInstance ? 'Active' : 'Inactive'}
                      </Text>
                    </HStack>
                  </VStack>
                )}
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Test Controls */}
        <Card>
          <CardBody>
            <VStack align="start" spacing={4}>
              <Heading size="md">Real-time Testing</Heading>
              <HStack spacing={4}>
                <Button
                  leftIcon={<FiPlay />}
                  onClick={testAdminChannel}
                  isLoading={testingChannel}
                  colorScheme="blue"
                >
                  Test Admin Channel
                </Button>
                <Button
                  leftIcon={<FiPlay />}
                  onClick={simulateLocationUpdate}
                  isLoading={simulatingUpdate}
                  colorScheme="green"
                >
                  Simulate Driver Location Update
                </Button>
              </HStack>
              <Text fontSize="sm" color="gray.600">
                Use these buttons to test real-time connectivity. Messages should appear in the log below.
              </Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Real-time Message Log */}
        <Card>
          <CardBody>
            <VStack align="start" spacing={4}>
              <Heading size="md">Real-time Message Log</Heading>
              {realtimeMessages.length === 0 ? (
                <Text color="gray.500">No real-time messages received yet</Text>
              ) : (
                <VStack align="start" spacing={2} w="100%">
                  {realtimeMessages.map((message, index) => (
                    <Box key={index} p={3} bg={bgColor} borderRadius="md" w="100%">
                      <HStack justify="space-between">
                        <Badge colorScheme={message.type === 'location' ? 'green' : 'blue'}>
                          {message.type}
                        </Badge>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </Text>
                      </HStack>
                      <Code fontSize="sm" mt={2}>
                        {JSON.stringify(message.data, null, 2).slice(0, 200)}...
                      </Code>
                    </Box>
                  ))}
                </VStack>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Recommendations */}
        {diagnosticData && diagnosticData.recommendations.length > 0 && (
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <AlertTitle>Issues Detected</AlertTitle>
              <AlertDescription>
                <List spacing={1} mt={2}>
                  {diagnosticData.recommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListIcon as={FiAlertCircle} color="orange.500" />
                      {rec}
                    </ListItem>
                  ))}
                </List>
              </AlertDescription>
            </Box>
          </Alert>
        )}
      </VStack>
    </Container>
  );
}