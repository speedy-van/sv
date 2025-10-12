'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Badge,
  Code,
  useToast,
  Spinner,
} from '@chakra-ui/react';
import { FaPlay, FaCheckCircle, FaExclamationTriangle, FaVolumeUp } from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { useAudioNotification } from '@/components/driver/AudioNotification';

interface FixResult {
  success: boolean;
  message: string;
  details?: any;
}

export default function AudioNotificationFixPage() {
  const { data: session } = useSession();
  const [driverId, setDriverId] = useState<string>('');
  const [isFixing, setIsFixing] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [fixResults, setFixResults] = useState<FixResult[]>([]);

  const audioNotification = useAudioNotification();
  const toast = useToast();

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

  const addFixResult = (result: FixResult) => {
    setFixResults(prev => [result, ...prev.slice(0, 9)]);
  };

  const prepareAudio = async () => {
    try {
      addFixResult({ success: false, message: 'Preparing audio system...' });
      
      await audioNotification.prepareAudio();
      setAudioReady(true);
      
      addFixResult({ 
        success: true, 
        message: '✅ Audio system prepared successfully - now try playing a test sound' 
      });
      
      toast({
        title: 'Audio Prepared',
        description: 'You can now test audio notifications',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      addFixResult({ 
        success: false, 
        message: `❌ Failed to prepare audio: ${(error as Error).message}` 
      });
    }
  };

  const testBasicAudio = async () => {
    try {
      addFixResult({ success: false, message: '🔊 Testing basic audio...' });
      
      await audioNotification.play('job-notification');
      
      addFixResult({ 
        success: true, 
        message: '✅ Audio played successfully! Did you hear the sound?' 
      });
      
      toast({
        title: 'Audio Played',
        description: 'If you didn\'t hear a sound, check browser settings',
        status: 'info',
        duration: 5000,
      });
    } catch (error) {
      const errorMsg = (error as Error).message;
      addFixResult({ 
        success: false, 
        message: `❌ Failed to play audio: ${errorMsg}` 
      });

      // Show specific instructions based on error type
      if (errorMsg.includes('user interaction required')) {
        toast({
          title: 'User Interaction Required',
          description: 'Click anywhere on the page first, then try again',
          status: 'warning',
          duration: 7000,
        });
      } else if (errorMsg.includes('not supported')) {
        toast({
          title: 'Browser Does Not Support Audio',
          description: 'Try another browser like Chrome or Firefox',
          status: 'error',
          duration: 7000,
        });
      }
    }
  };

  const testFullNotification = async () => {
    if (!driverId) {
      toast({
        title: 'Error',
        description: 'Cannot find driver ID',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setIsFixing(true);
      addFixResult({ success: false, message: '📡 Sending full test notification...' });

      const response = await fetch('/api/admin/fix-driver-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-test-job',
          driverId: driverId
        }),
      });

      const result = await response.json();

      if (result.success) {
        addFixResult({ 
          success: true, 
          message: '✅ Full test notification sent! You should see a notification and hear a sound' 
        });
        
        toast({
          title: 'Sent',
          description: 'You will receive a test notification in a few seconds',
          status: 'success',
          duration: 5000,
        });
      } else {
        addFixResult({ 
          success: false, 
          message: `❌ Failed to send notification: ${result.error}` 
        });
      }
    } catch (error) {
      addFixResult({ 
        success: false, 
        message: `❌ Network error: ${(error as Error).message}` 
      });
    } finally {
      setIsFixing(false);
    }
  };

  const checkConfiguration = async () => {
    try {
      addFixResult({ success: false, message: '🔍 Checking system settings...' });

      const response = await fetch('/api/admin/fix-driver-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-config' }),
      });

      const result = await response.json();

      if (result.success && result.isConfigured) {
        addFixResult({ 
          success: true, 
          message: '✅ All system settings are correct',
          details: result.config
        });
      } else {
        addFixResult({ 
          success: false, 
          message: `⚠️ Settings issues: ${result.config?.recommendations?.join(', ')}`,
          details: result.config
        });
      }
    } catch (error) {
      addFixResult({ 
        success: false, 
        message: `❌ Failed to check settings: ${(error as Error).message}` 
      });
    }
  };

  const requestNotificationPermission = async () => {
    try {
      addFixResult({ success: false, message: '🔔 Requesting notification permission...' });

      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          addFixResult({ 
            success: true, 
            message: '✅ Notification permission granted successfully' 
          });

          // Test notification
          new Notification('🎉 Notifications Enabled!', {
            body: 'You will receive notifications when new jobs arrive',
            icon: '/favicon.ico',
          });
        } else {
          addFixResult({ 
            success: false, 
            message: `❌ Notification permission denied: ${permission}` 
          });
        }
      } else {
        addFixResult({ 
          success: false, 
          message: '❌ Browser does not support notifications' 
        });
      }
    } catch (error) {
      addFixResult({ 
        success: false, 
        message: `❌ Error requesting permission: ${(error as Error).message}` 
      });
    }
  };

  if (!session) {
    return (
      <Box p={8}>
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>Unauthorized</AlertTitle>
          <AlertDescription>
            You must log in as a driver to use this tool.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6} maxW="4xl" mx="auto">
      <VStack spacing={6} align="stretch">
        <Card>
          <CardHeader>
            <HStack spacing={3}>
              <FaVolumeUp size="24px" color="blue" />
              <Heading size="lg">🔧 Driver Audio Notifications Fix</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Quick Fix Guide</AlertTitle>
                  <AlertDescription>
                    Follow these steps in order to fix audio notification issues
                  </AlertDescription>
                </Box>
              </Alert>

              {/* Status indicators */}
              <HStack spacing={4} wrap="wrap">
                <Badge colorScheme={audioNotification.isSupported ? 'green' : 'red'}>
                  {audioNotification.isSupported ? 'Audio Supported' : 'Audio Not Supported'}
                </Badge>
                <Badge colorScheme={audioReady ? 'green' : 'yellow'}>
                  {audioReady ? 'Audio Ready' : 'Audio Not Ready'}
                </Badge>
                <Badge colorScheme={driverId ? 'green' : 'red'}>
                  {driverId ? `Driver: ${driverId.slice(0, 8)}...` : 'Driver not found'}
                </Badge>
              </HStack>

              {/* Fix steps */}
              <VStack spacing={3} align="stretch">
                <HStack spacing={3}>
                  <Text fontWeight="bold" minW="20px">1.</Text>
                  <Button
                    leftIcon={<FaCheckCircle />}
                    colorScheme="blue"
                    onClick={prepareAudio}
                    isDisabled={!audioNotification.isSupported}
                    size="sm"
                  >
                    Prepare Audio System
                  </Button>
                  <Text fontSize="sm" color="gray.600">
                    (Click here first to enable audio)
                  </Text>
                </HStack>

                <HStack spacing={3}>
                  <Text fontWeight="bold" minW="20px">2.</Text>
                  <Button
                    leftIcon={<FaPlay />}
                    colorScheme="green"
                    onClick={testBasicAudio}
                    isDisabled={!audioReady}
                    size="sm"
                  >
                    Test Basic Audio
                  </Button>
                  <Text fontSize="sm" color="gray.600">
                    (You should hear a notification sound)
                  </Text>
                </HStack>

                <HStack spacing={3}>
                  <Text fontWeight="bold" minW="20px">3.</Text>
                  <Button
                    leftIcon={<FaCheckCircle />}
                    colorScheme="orange"
                    onClick={requestNotificationPermission}
                    size="sm"
                  >
                    Request Notification Permission
                  </Button>
                  <Text fontSize="sm" color="gray.600">
                    (Allow browser to show notifications)
                  </Text>
                </HStack>

                <HStack spacing={3}>
                  <Text fontWeight="bold" minW="20px">4.</Text>
                  <Button
                    leftIcon={isFixing ? <Spinner size="sm" /> : <FaExclamationTriangle />}
                    colorScheme="purple"
                    onClick={testFullNotification}
                    isLoading={isFixing}
                    isDisabled={!driverId}
                    size="sm"
                  >
                    Test Full Notification
                  </Button>
                  <Text fontSize="sm" color="gray.600">
                    (Simulate new job)
                  </Text>
                </HStack>

                <HStack spacing={3}>
                  <Text fontWeight="bold" minW="20px">5.</Text>
                  <Button
                    leftIcon={<FaCheckCircle />}
                    colorScheme="teal"
                    onClick={checkConfiguration}
                    size="sm"
                  >
                    Check Server Settings
                  </Button>
                  <Text fontSize="sm" color="gray.600">
                    (Verify Pusher configuration)
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Results */}
        {fixResults.length > 0 && (
          <Card>
            <CardHeader>
              <Heading size="md">Fix Results</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={2} align="stretch">
                {fixResults.map((result, index) => (
                  <Alert
                    key={index}
                    status={result.success ? 'success' : 'error'}
                    variant="left-accent"
                  >
                    <AlertIcon />
                    <Box flex="1">
                      <Text fontSize="sm">{result.message}</Text>
                      {result.details && (
                        <Code fontSize="xs" mt={1} display="block">
                          {JSON.stringify(result.details, null, 2)}
                        </Code>
                      )}
                    </Box>
                  </Alert>
                ))}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <Heading size="md">Additional Instructions</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3} align="start">
              <Text fontWeight="bold">If the problem persists:</Text>
              <Text>• Make sure system volume is turned up</Text>
              <Text>• Try a different browser (Chrome works best)</Text>
              <Text>• Ensure the browser is not blocking automatic sounds</Text>
              <Text>• Reload the page and try again</Text>
              <Text>• Make sure the site is added to trusted sites</Text>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
}