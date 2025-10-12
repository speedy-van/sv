'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Icon,
  Container,
  Image,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
} from '@chakra-ui/react';
import {
  FaWifi,
  FaExclamationTriangle,
  FaRedo,
  FaHome,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
} from 'react-icons/fa';

const OfflinePage: React.FC = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const toast = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: 'Connection Restored!',
        description: 'You are back online. You can now continue with your luxury booking.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    
    if (navigator.onLine) {
      window.location.reload();
    } else {
      toast({
        title: 'Still Offline',
        description: 'Please check your internet connection and try again.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <Box minH="100vh" bg="bg.canvas" py={8}>
      <Container maxW="md" px={4}>
        <VStack spacing={8} textAlign="center">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <VStack spacing={4}>
              <Box
                p={6}
                borderRadius="full"
                bg="linear-gradient(135deg, rgba(0,194,255,0.1), rgba(0,209,143,0.1))"
                borderWidth="2px"
                borderColor="border.neon"
              >
                <Icon
                  as={isOnline ? FaWifi : FaExclamationTriangle}
                  boxSize={16}
                  color={isOnline ? 'green.500' : 'red.500'}
                />
              </Box>
              
              <Heading
                size="xl"
                color="text.primary"
                bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                bgClip="text"
                fontWeight="bold"
              >
                {isOnline ? 'Connection Restored!' : 'You\'re Offline'}
              </Heading>
              
              <Text fontSize="lg" color="text.secondary" maxW="md">
                {isOnline 
                  ? 'Great! Your internet connection is back. You can now continue with your booking.'
                  : 'It looks like you\'re not connected to the internet. Don\'t worry, we\'ve saved your progress!'
                }
              </Text>
            </VStack>
          </motion.div>

          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
          >
            <Badge
              colorScheme={isOnline ? 'green' : 'red'}
              size="lg"
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="bold"
            >
              <HStack spacing={2}>
                <Icon as={isOnline ? FaCheckCircle : FaExclamationTriangle} />
                <Text>
                  {isOnline ? 'Online' : 'Offline'}
                </Text>
              </HStack>
            </Badge>
          </motion.div>

          {/* Offline Features */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            >
              <VStack spacing={6} w="full">
                <Alert status="info" borderRadius="lg">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Offline Mode Active</AlertTitle>
                    <AlertDescription>
                      Your luxury booking progress has been saved locally. You can continue when you're back online.
                    </AlertDescription>
                  </Box>
                </Alert>

                <VStack spacing={4} w="full">
                  <Heading size="md" color="text.primary">
                    What you can do offline:
                  </Heading>
                  
                  <VStack spacing={3} w="full">
                    <HStack spacing={3} w="full" p={3} bg="gray.50" borderRadius="lg">
                      <Icon as={FaClock} color="blue.500" />
                      <Text fontSize="sm" color="text.secondary">
                        Review your booking details
                      </Text>
                    </HStack>
                    
                    <HStack spacing={3} w="full" p={3} bg="gray.50" borderRadius="lg">
                      <Icon as={FaCheckCircle} color="green.500" />
                      <Text fontSize="sm" color="text.secondary">
                        Edit item selections
                      </Text>
                    </HStack>
                    
                    <HStack spacing={3} w="full" p={3} bg="gray.50" borderRadius="lg">
                      <Icon as={FaClock} color="orange.500" />
                      <Text fontSize="sm" color="text.secondary">
                        Modify pickup/dropoff addresses
                      </Text>
                    </HStack>
                  </VStack>
                </VStack>
              </VStack>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.6 }}
          >
            <VStack spacing={4} w="full">
              <Button
                colorScheme="neon"
                size="lg"
                w="full"
                leftIcon={<FaRedo />}
                onClick={handleRetry}
                isLoading={retryCount > 0 && !isOnline}
                loadingText="Checking Connection..."
              >
                {isOnline ? 'Continue Booking' : 'Try Again'}
              </Button>

              <Button
                variant="outline"
                size="lg"
                w="full"
                leftIcon={<FaHome />}
                onClick={handleGoHome}
              >
                Go to Homepage
              </Button>
            </VStack>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.8 }}
          >
            <VStack spacing={4} w="full" p={6} bg="gray.50" borderRadius="xl">
              <Heading size="sm" color="text.primary">
                Need Help?
              </Heading>
              
              <VStack spacing={3} w="full">
                <HStack spacing={3} w="full">
                  <Icon as={FaPhone} color="neon.500" />
                  <Text fontSize="sm" color="text.secondary">
                    07901846297
                  </Text>
                </HStack>
                
                <HStack spacing={3} w="full">
                  <Icon as={FaEnvelope} color="neon.500" />
                  <Text fontSize="sm" color="text.secondary">
                    support@speedy-van.co.uk
                  </Text>
                </HStack>
                
                <HStack spacing={3} w="full">
                  <Icon as={FaMapMarkerAlt} color="neon.500" />
                  <Text fontSize="sm" color="text.secondary" textAlign="center">
                    Office 2.18, 1 Barrack Street, Hamilton, ML3 0DG
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 1.0 }}
          >
            <Text fontSize="xs" color="text.tertiary" textAlign="center">
              Speedy Van - Professional Moving Services
              <br />
              Your booking progress is automatically saved
            </Text>
          </motion.div>
        </VStack>
      </Container>
    </Box>
  );
};

export default OfflinePage;