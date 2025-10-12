'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Link as ChakraLink,
  IconButton,
  HStack,
  Icon,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import {
  FaTruck,
  FaArrowLeft,
  FaEnvelope,
  FaShieldAlt,
  FaCheckCircle,
} from 'react-icons/fa';

export default function DriverForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      console.log('🔐 Submitting password reset request for:', email);
      
      const response = await fetch('/api/driver/auth/forgot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      console.log('📧 Password reset response:', result);

      if (response.ok) {
        setSuccess(true);
        toast({
          title: 'Reset Link Sent',
          description: 'If an account with that email exists, a password reset link has been sent.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        setError(result.error || 'An error occurred. Please try again.');
        toast({
          title: 'Error',
          description: result.error || 'An error occurred. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('❌ Password reset error:', error);
      setError('An error occurred. Please try again.');
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    router.push('/driver-auth');
  };

  if (success) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" px={4}>
        <Container maxW="md">
          <VStack spacing={6} textAlign="center">
            <Box color="green.500" fontSize="4xl">
              <FaCheckCircle />
            </Box>
            <VStack spacing={2}>
              <Heading size="lg" color="gray.700">
                Check Your Email
              </Heading>
              <Text color="gray.600" fontSize={{ base: "sm", md: "md" }} px={4}>
                If an account with that email exists, a password reset link has been sent to <strong>{email}</strong>.
              </Text>
              <Text color="gray.500" fontSize="sm">
                Please check your inbox and spam folder. The link will expire in 1 hour.
              </Text>
            </VStack>
            
            <VStack spacing={3} w="full">
              <Button
                colorScheme="blue"
                onClick={handleBackClick}
                size={{ base: "md", md: "lg" }}
                w={{ base: "full", md: "auto" }}
              >
                Back to Login
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                size={{ base: "md", md: "lg" }}
                w={{ base: "full", md: "auto" }}
              >
                Try Different Email
              </Button>
            </VStack>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" px={4}>
      <Container maxW="md">
        <VStack spacing={6} textAlign="center">
          <VStack spacing={2}>
            <Box color="blue.500" fontSize="3xl">
              <FaTruck />
            </Box>
            <Heading size="lg" color="gray.700">
              Reset Driver Password
            </Heading>
            <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>
              Enter your driver email address and we'll send you a password reset link.
            </Text>
          </VStack>

          <Card w="full" bg={cardBg} boxShadow="lg">
            <CardBody p={6}>
              <form onSubmit={handleSubmit}>
                <VStack spacing={5}>
                  {error && (
                    <Alert status="error" borderRadius="lg">
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}

                  <FormControl isRequired>
                    <FormLabel
                      fontSize="md"
                      fontWeight="semibold"
                      color="text.primary"
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <Icon as={FaEnvelope} color="blue.500" />
                      Driver Email Address
                    </FormLabel>
                    <Input
                      type="email"
                      name="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your driver email address"
                      size="lg"
                      borderRadius="xl"
                      borderWidth="2px"
                      borderColor="border.primary"
                      bg="bg.surface"
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 1px rgba(59, 130, 246, 0.2)',
                      }}
                      _hover={{
                        borderColor: 'blue.400',
                      }}
                      transition="all 0.2s"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    isLoading={isLoading}
                    loadingText="Sending Reset Link..."
                    leftIcon={<Icon as={FaShieldAlt} />}
                    borderRadius="xl"
                    fontWeight="semibold"
                    py={6}
                  >
                    Send Reset Link
                  </Button>
                </VStack>
              </form>
            </CardBody>
          </Card>

          <HStack spacing={4} flexWrap="wrap" justify="center">
            <Button
              variant="ghost"
              leftIcon={<Icon as={FaArrowLeft} />}
              onClick={handleBackClick}
              size={{ base: "sm", md: "md" }}
            >
              Back to Login
            </Button>
            
            <ChakraLink as={NextLink} href="/driver-auth" color="blue.500" fontSize="sm">
              Remember your password? Sign in
            </ChakraLink>
          </HStack>

          <Text color="gray.500" fontSize="xs" textAlign="center" maxW="sm">
            If you don't receive an email within a few minutes, check your spam folder or contact support.
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}
