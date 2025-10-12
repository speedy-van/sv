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
  FaEnvelope,
  FaArrowLeft,
} from 'react-icons/fa';

export default function CustomerForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('📧 Customer password reset request for:', email);

      const response = await fetch('/api/customer/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      console.log('✅ Password reset email sent');
      setIsSubmitted(true);
      toast({
        title: 'Reset Email Sent!',
        description: 'Please check your email for password reset instructions.',
        status: 'success',
        duration: 5000,
      });

    } catch (error) {
      console.error('❌ Password reset error:', error);
      setError(error instanceof Error ? error.message : 'Failed to send reset email');
      toast({
        title: 'Error',
        description: 'Failed to send reset email. Please try again.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    router.push('/customer/login');
  };

  if (isSubmitted) {
    return (
      <Box
        minH="100vh"
        bg={bgColor}
        py={{ base: 8, md: 12 }}
        position="relative"
        overflow="hidden"
      >
        {/* Background Pattern */}
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
          opacity={0.02}
          background="radial-gradient(circle at 20% 80%, rgba(0,194,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,209,143,0.1) 0%, transparent 50%)"
          pointerEvents="none"
        />

        <Container maxW="md" position="relative" zIndex={1}>
          <VStack spacing={8}>
            {/* Success Message */}
            <Card
              w="full"
              bg={cardBg}
              borderRadius="2xl"
              borderWidth="2px"
              borderColor="green.200"
              boxShadow="xl"
            >
              <CardBody p={{ base: 6, md: 8 }}>
                <VStack spacing={6} textAlign="center">
                  <Box
                    p={6}
                    borderRadius="2xl"
                    bg="green.100"
                    color="green.600"
                  >
                    <Icon as={FaEnvelope} boxSize={12} />
                  </Box>

                  <VStack spacing={3}>
                    <Heading size="lg" color="green.600">
                      Check Your Email
                    </Heading>
                    <Text color="text.secondary" textAlign="center">
                      We've sent password reset instructions to:
                    </Text>
                    <Text fontWeight="bold" color="text.primary">
                      {email}
                    </Text>
                  </VStack>

                  <Alert status="info" borderRadius="lg">
                    <AlertIcon />
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm" fontWeight="semibold">
                        Next Steps:
                      </Text>
                      <Text fontSize="sm">
                        1. Check your email inbox (and spam folder)
                      </Text>
                      <Text fontSize="sm">
                        2. Click the reset link in the email
                      </Text>
                      <Text fontSize="sm">
                        3. Create a new password
                      </Text>
                    </VStack>
                  </Alert>

                  <VStack spacing={3} w="full">
                    <Button
                      variant="outline"
                      size="lg"
                      w="full"
                      leftIcon={<FaArrowLeft />}
                      onClick={handleBackClick}
                    >
                      Back to Sign In
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsSubmitted(false);
                        setEmail('');
                      }}
                    >
                      Try Different Email
                    </Button>
                  </VStack>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      minH="100vh"
      bg={bgColor}
      py={{ base: 8, md: 12 }}
      position="relative"
      overflow="hidden"
    >
      {/* Background Pattern */}
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        opacity={0.02}
        background="radial-gradient(circle at 20% 80%, rgba(0,194,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,209,143,0.1) 0%, transparent 50%)"
        pointerEvents="none"
      />

      <Container maxW="md" position="relative" zIndex={1}>
        <VStack spacing={8}>
          {/* Back Button */}
          <HStack w="full" justify="flex-start">
            <IconButton
              aria-label="Back to sign in"
              icon={<FaArrowLeft />}
              variant="ghost"
              onClick={handleBackClick}
              size="lg"
              color="text.secondary"
              _hover={{
                bg: 'rgba(0,194,255,0.1)',
                color: 'neon.400',
              }}
              transition="all 0.2s"
            />
          </HStack>

          {/* Header Section */}
          <Box textAlign="center" w="full">
            <VStack spacing={6}>
              {/* Logo/Icon */}
              <Box
                p={6}
                borderRadius="2xl"
                bg="linear-gradient(135deg, rgba(0,194,255,0.1), rgba(0,209,143,0.1))"
                border="2px solid"
                borderColor="neon.500"
                boxShadow="0 0 30px rgba(0,194,255,0.2)"
              >
                <Icon as={FaEnvelope} boxSize={12} color="neon.400" />
              </Box>

              {/* Title */}
              <VStack spacing={3}>
                <Heading
                  size={{ base: 'xl', md: '2xl' }}
                  color="text.primary"
                  textAlign="center"
                >
                  Reset Password
                </Heading>
                <Text
                  color="text.secondary"
                  fontSize={{ base: 'md', md: 'lg' }}
                  textAlign="center"
                  maxW="400px"
                >
                  Enter your email address and we'll send you instructions to reset your password
                </Text>
              </VStack>
            </VStack>
          </Box>

          {/* Reset Form */}
          <Card
            w="full"
            bg={cardBg}
            borderRadius="2xl"
            borderWidth="2px"
            borderColor="border.primary"
            boxShadow="xl"
          >
            <CardBody p={{ base: 6, md: 8 }}>
              <form onSubmit={handleSubmit}>
                <VStack spacing={6}>
                  {error && (
                    <Alert status="error" borderRadius="lg">
                      <AlertIcon />
                      {error}
                    </Alert>
                  )}

                  <FormControl isRequired>
                    <FormLabel color="text.primary">Email Address</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      size="lg"
                      borderRadius="lg"
                      bg="bg.surface"
                      borderColor="border.primary"
                      _hover={{ borderColor: 'neon.400' }}
                      _focus={{
                        borderColor: 'neon.400',
                        boxShadow: '0 0 0 1px rgba(0,194,255,0.3)',
                      }}
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    size="lg"
                    w="full"
                    bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                    color="white"
                    fontWeight="bold"
                    borderRadius="xl"
                    isLoading={isLoading}
                    loadingText="Sending Email..."
                    rightIcon={<FaEnvelope />}
                    _hover={{
                      bg: 'linear-gradient(135deg, #00D18F, #00C2FF)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,194,255,0.4)',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    transition="all 0.2s ease"
                  >
                    Send Reset Instructions
                  </Button>

                  <VStack spacing={3} w="full">
                    <Text color="text.secondary" fontSize="sm" textAlign="center">
                      Remember your password?
                    </Text>
                    <ChakraLink
                      as={NextLink}
                      href="/customer/login"
                      color="neon.400"
                      fontWeight="semibold"
                      _hover={{ color: 'neon.300' }}
                    >
                      Back to Sign In
                    </ChakraLink>
                  </VStack>
                </VStack>
              </form>
            </CardBody>
          </Card>

          {/* Security Notice */}
          <Alert status="info" borderRadius="lg" maxW="md">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" fontWeight="semibold">
                Security Notice
              </Text>
              <Text fontSize="sm">
                For your security, password reset links expire after 1 hour and can only be used once.
              </Text>
            </VStack>
          </Alert>
        </VStack>
      </Container>
    </Box>
  );
}
