'use client';

import React, { useState } from 'react';
import {
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Box,
  Card,
  CardBody,
  Input,
  Button,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  AlertDescription,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaSearch, FaTruck } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function TrackingHomePage() {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const cardBg = useColorModeValue('white', 'gray.800');
  const bg = useColorModeValue('gray.50', 'gray.900');

  const handleTrack = async () => {
    if (!referenceNumber.trim()) {
      setError('Please enter your booking reference number');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Check if the reference exists
      const response = await fetch(`/api/customer/tracking/${referenceNumber.trim()}`);
      
      if (response.ok) {
        // Redirect to tracking page
        router.push(`/tracking/${referenceNumber.trim()}`);
      } else if (response.status === 404) {
        setError('Booking not found. Please check your reference number and try again.');
      } else {
        setError('Unable to access tracking information. Please try again later.');
      }
    } catch (err) {
      setError('Connection error. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTrack();
    }
  };

  return (
    <Box minH="100vh" bg={bg}>
      <Container maxW="2xl" py={12}>
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <VStack spacing={4} textAlign="center">
            <Box fontSize="6xl">🚚</Box>
            <Heading size="xl">Track Your Order</Heading>
            <Text fontSize="lg" color="gray.600">
              Enter your booking reference number to see live updates and track your driver in real-time
            </Text>
          </VStack>

          {/* Tracking Form */}
          <Card bg={cardBg} boxShadow="lg">
            <CardBody p={8}>
              <VStack spacing={6}>
                <FormControl>
                  <FormLabel fontSize="lg" fontWeight="semibold">
                    Booking Reference Number
                  </FormLabel>
                  <Input
                    placeholder="e.g. SV-2024-001234"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    onKeyPress={handleKeyPress}
                    size="lg"
                    textAlign="center"
                    letterSpacing="wider"
                    textTransform="uppercase"
                    bg={useColorModeValue('gray.50', 'gray.700')}
                  />
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    You can find this in your booking confirmation email or SMS
                  </Text>
                </FormControl>

                {error && (
                  <Alert status="error" borderRadius="lg">
                    <AlertIcon />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  leftIcon={<FaSearch />}
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  onClick={handleTrack}
                  isLoading={isLoading}
                  loadingText="Searching..."
                >
                  Track My Order
                </Button>
              </VStack>
            </CardBody>
          </Card>

          {/* Features */}
          <VStack spacing={4} align="stretch">
            <Heading size="md" textAlign="center">What you'll see:</Heading>
            <VStack spacing={3} align="stretch">
              <HStack spacing={4} p={4} bg={cardBg} borderRadius="lg">
                <Box fontSize="2xl">🗺️</Box>
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold">Live Map Tracking</Text>
                  <Text fontSize="sm" color="gray.600">
                    Real-time location of your driver on an interactive map
                  </Text>
                </VStack>
              </HStack>

              <HStack spacing={4} p={4} bg={cardBg} borderRadius="lg">
                <Box fontSize="2xl">⏰</Box>
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold">Estimated Arrival Time</Text>
                  <Text fontSize="sm" color="gray.600">
                    Live updates on when your driver will arrive
                  </Text>
                </VStack>
              </HStack>

              <HStack spacing={4} p={4} bg={cardBg} borderRadius="lg">
                <Box fontSize="2xl">📞</Box>
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold">Driver Contact</Text>
                  <Text fontSize="sm" color="gray.600">
                    Direct contact with your driver when needed
                  </Text>
                </VStack>
              </HStack>

              <HStack spacing={4} p={4} bg={cardBg} borderRadius="lg">
                <Box fontSize="2xl">📋</Box>
                <VStack align="start" spacing={1}>
                  <Text fontWeight="semibold">Delivery Progress</Text>
                  <Text fontSize="sm" color="gray.600">
                    Step-by-step timeline of your delivery progress
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </VStack>

          {/* Help */}
          <Card bg={cardBg}>
            <CardBody>
              <VStack spacing={3} align="start">
                <Heading size="sm">Need help?</Heading>
                <Text fontSize="sm" color="gray.600">
                  If you can't find your booking reference or need assistance, please contact us:
                </Text>
                <HStack spacing={4}>
                  <Button size="sm" variant="outline">
                    📞 Call Support
                  </Button>
                  <Button size="sm" variant="outline">
                    ✉️ Email Us
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}