'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Badge,
  Switch,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Divider,
  useColorModeValue,
  IconButton,
  Tooltip,
  Code,
} from '@chakra-ui/react';
import { FaPlay, FaStop, FaVolumeUp, FaVolumeMute, FaBell } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { useDriverNotifications } from '@/services/driverNotifications';
import { useAudioNotification, showJobNotificationWithSound } from '@/components/driver/AudioNotification';

export default function DriverAudioTestPage() {
  const { data: session } = useSession();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [testResults, setTestResults] = useState<string[]>([]);
  const [driverId, setDriverId] = useState<string>('');

  const audioNotification = useAudioNotification();
  const driverNotifications = useDriverNotifications(driverId);

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Get driver ID from session
  useEffect(() => {
    const fetchDriverData = async () => {
      if (session?.user) {
        try {
          const response = await fetch('/api/driver/profile');
          if (response.ok) {
            const data = await response.json();
            setDriverId(data.driver?.id || '');
          }
        } catch (error) {
          console.error('Failed to fetch driver data:', error);
        }
      }
    };

    fetchDriverData();
  }, [session]);

  const addTestResult = (result: string) => {
    const timestamp = new Date().toLocaleTimeString('ar-SA');
    setTestResults(prev => [`[${timestamp}] ${result}`, ...prev.slice(0, 9)]);
  };

  const testBasicAudio = async () => {
    try {
      addTestResult('🔊 Testing basic audio...');
      await audioNotification.play('job-notification');
      addTestResult('✅ Basic audio played successfully');
    } catch (error) {
      addTestResult('❌ Failed to play basic audio: ' + (error as Error).message);
    }
  };

  const testJobNotification = async () => {
    try {
      addTestResult('🔔 Testing job notification...');
      await showJobNotificationWithSound(
        'New Job Available',
        'From Riyadh to Jeddah\nPrice: £45.00 | Distance: 15km',
        { urgent: false }
      );
      addTestResult('✅ Job notification played successfully');
    } catch (error) {
      addTestResult('❌ Failed to play job notification: ' + (error as Error).message);
    }
  };

  const testUrgentNotification = async () => {
    try {
      addTestResult('🚨 Testing urgent notification...');
      await showJobNotificationWithSound(
        '🚨 Urgent Job',
        'From Airport to Hospital\nPrice: £25.00 | Customer: Ahmad Mohammed',
        { urgent: true, requireInteraction: true }
      );
      addTestResult('✅ Urgent notification played successfully');
    } catch (error) {
      addTestResult('❌ Failed urgent notification: ' + (error as Error).message);
    }
  };

  const testServiceNotification = async () => {
    try {
      addTestResult('📡 Testing notification service...');
      await driverNotifications.testNotification();
      addTestResult('✅ Notification service tested successfully');
    } catch (error) {
      addTestResult('❌ Failed notification service: ' + (error as Error).message);
    }
  };

  const stopAudio = () => {
    audioNotification.stop();
    addTestResult('⏹️ Audio stopped');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const toggleAudio = (enabled: boolean) => {
    setAudioEnabled(enabled);
    driverNotifications.setAudioEnabled(enabled);
    addTestResult(`🔊 Audio notifications ${enabled ? 'enabled' : 'disabled'}`);
  };

  if (!session) {
    return (
      <Box p={8}>
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>Unauthorized</AlertTitle>
          <AlertDescription>Please log in to access the notification test page</AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6} minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <VStack spacing={6} maxW="800px" mx="auto">
        
        {/* Header */}
        <Card w="100%" bg={bg} borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">Driver Audio Notifications Test</Heading>
              <Badge colorScheme={audioEnabled ? 'green' : 'red'}>
                {audioEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Text>Audio Status:</Text>
                <Badge colorScheme={audioNotification.isSupported ? 'green' : 'red'}>
                  {audioNotification.isSupported ? 'Supported' : 'Not supported'}
                </Badge>
              </HStack>
              
              <HStack justify="space-between">
                <Text>Driver ID:</Text>
                <Code>{driverId || 'Not specified'}</Code>
              </HStack>

              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="audio-toggle" mb="0">
                  Enable Audio Notifications
                </FormLabel>
                <Switch
                  id="audio-toggle"
                  isChecked={audioEnabled}
                  onChange={(e) => toggleAudio(e.target.checked)}
                />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Test Controls */}
        <Card w="100%" bg={bg} borderColor={borderColor}>
          <CardHeader>
            <Heading size="sm">Notification Tests</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <HStack spacing={4} wrap="wrap" justify="center">
                <Button
                  leftIcon={<FaPlay />}
                  colorScheme="blue"
                  onClick={testBasicAudio}
                  isDisabled={!audioNotification.isSupported || !audioEnabled}
                >
                  Test Basic Audio
                </Button>
                
                <Button
                  leftIcon={<FaBell />}
                  colorScheme="green"
                  onClick={testJobNotification}
                  isDisabled={!audioNotification.isSupported || !audioEnabled}
                >
                  Normal Job Notification
                </Button>

                <Button
                  leftIcon={<FaBell />}
                  colorScheme="red"
                  onClick={testUrgentNotification}
                  isDisabled={!audioNotification.isSupported || !audioEnabled}
                >
                  Urgent Notification
                </Button>

                <Button
                  leftIcon={<FaBell />}
                  colorScheme="purple"
                  onClick={testServiceNotification}
                  isDisabled={!audioEnabled}
                >
                  Test Service
                </Button>
              </HStack>

              <Divider />

              <HStack spacing={4}>
                <Tooltip label="Stop all sounds">
                  <IconButton
                    aria-label="Stop audio"
                    icon={<FaStop />}
                    colorScheme="gray"
                    onClick={stopAudio}
                    isDisabled={!audioNotification.isPlaying}
                  />
                </Tooltip>

                <Tooltip label="Clear results">
                  <Button size="sm" onClick={clearResults}>
                    Clear Results
                  </Button>
                </Tooltip>

                <Badge colorScheme={audioNotification.isPlaying ? 'green' : 'gray'}>
                  {audioNotification.isPlaying ? 'Playing' : 'Stopped'}
                </Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Audio Support Info */}
        {!audioNotification.isSupported && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Audio Not Supported</AlertTitle>
            <AlertDescription>
              The current browser does not support audio playback. Please use a modern browser like Chrome or Safari.
            </AlertDescription>
          </Alert>
        )}

        {/* Test Results */}
        <Card w="100%" bg={bg} borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="sm">Test Results</Heading>
              <Badge>{testResults.length}/10</Badge>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={2} align="stretch" maxH="300px" overflowY="auto">
              {testResults.length === 0 ? (
                <Text color="gray.500" textAlign="center">
                  No test results yet
                </Text>
              ) : (
                testResults.map((result, index) => (
                  <Code
                    key={index}
                    p={2}
                    fontSize="sm"
                    borderRadius="md"
                    whiteSpace="pre-wrap"
                  >
                    {result}
                  </Code>
                ))
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Instructions */}
        <Card w="100%" bg={bg} borderColor={borderColor}>
          <CardHeader>
            <Heading size="sm">Usage Instructions</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="stretch" fontSize="sm">
              <Text>• <strong>Test Basic Audio:</strong> Plays the audio file only without browser notifications</Text>
              <Text>• <strong>Normal Job Notification:</strong> Plays audio with normal browser notification</Text>
              <Text>• <strong>Urgent Notification:</strong> Plays audio with urgent browser notification and vibration</Text>
              <Text>• <strong>Test Service:</strong> Tests the complete notification service with Pusher</Text>
              <Text color="orange.500">
                <strong>Note:</strong> The browser may request permission to play sounds and notifications the first time
              </Text>
            </VStack>
          </CardBody>
        </Card>

      </VStack>
    </Box>
  );
}