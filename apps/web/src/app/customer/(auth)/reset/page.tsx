'use client';

import React, { useState, useEffect } from 'react';
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
  Progress,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import {
  FaLock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHome,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';

export default function CustomerResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');
  const token = searchParams?.get('token');

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Invalid Reset Link',
        description: 'This password reset link is invalid or expired.',
        status: 'error',
        duration: 5000,
      });
      router.push('/customer/forgot');
    }
  }, [token, router, toast]);

  // Calculate password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  }, [password]);

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return 'red';
    if (passwordStrength < 75) return 'yellow';
    return 'green';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Very Weak';
    if (passwordStrength < 50) return 'Weak';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (passwordStrength < 50) {
      setError('Password is too weak. Please choose a stronger password.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 Customer password reset for token:', token);

      const response = await fetch('/api/customer/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      console.log('✅ Password reset successful');
      setIsSuccess(true);
      toast({
        title: 'Password Reset Successful!',
        description: 'Your password has been updated. You can now sign in.',
        status: 'success',
        duration: 5000,
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/customer/login');
      }, 3000);

    } catch (error) {
      console.error('❌ Password reset error:', error);
      setError(error instanceof Error ? error.message : 'Failed to reset password');
      toast({
        title: 'Reset Failed',
        description: 'Failed to reset password. Please try again or request a new reset link.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    router.push('/');
  };

  if (isSuccess) {
    return (
      <Box
        minH="100vh"
        bg={bgColor}
        py={{ base: 8, md: 12 }}
        position="relative"
        overflow="hidden"
      >
        <Container maxW="md" position="relative" zIndex={1}>
          <VStack spacing={8}>
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
                    <Icon as={FaCheckCircle} boxSize={12} />
                  </Box>

                  <VStack spacing={3}>
                    <Heading size="lg" color="green.600">
                      Password Reset Complete!
                    </Heading>
                    <Text color="text.secondary" textAlign="center">
                      Your password has been successfully updated. You will be redirected to the sign-in page shortly.
                    </Text>
                  </VStack>

                  <Button
                    size="lg"
                    bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                    color="white"
                    fontWeight="bold"
                    onClick={() => router.push('/customer/login')}
                  >
                    Sign In Now
                  </Button>
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
              aria-label="Back to main page"
              icon={<FaHome />}
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
                <Icon as={FaLock} boxSize={12} color="neon.400" />
              </Box>

              {/* Title */}
              <VStack spacing={3}>
                <Heading
                  size={{ base: 'xl', md: '2xl' }}
                  color="text.primary"
                  textAlign="center"
                >
                  Create New Password
                </Heading>
                <Text
                  color="text.secondary"
                  fontSize={{ base: 'md', md: 'lg' }}
                  textAlign="center"
                  maxW="400px"
                >
                  Choose a strong password for your customer account
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
                    <FormLabel color="text.primary">New Password</FormLabel>
                    <HStack>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter new password"
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
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={<Icon as={showPassword ? FaEyeSlash : FaEye} />}
                        onClick={() => setShowPassword(!showPassword)}
                        variant="ghost"
                        size="lg"
                      />
                    </HStack>
                    
                    {/* Password Strength Indicator */}
                    {password && (
                      <VStack spacing={2} align="start" mt={2}>
                        <HStack spacing={2} w="full">
                          <Text fontSize="xs" color="text.secondary">
                            Strength:
                          </Text>
                          <Text
                            fontSize="xs"
                            color={`${getPasswordStrengthColor()}.500`}
                            fontWeight="semibold"
                          >
                            {getPasswordStrengthText()}
                          </Text>
                        </HStack>
                        <Progress
                          value={passwordStrength}
                          size="sm"
                          colorScheme={getPasswordStrengthColor()}
                          w="full"
                          borderRadius="full"
                        />
                      </VStack>
                    )}
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color="text.primary">Confirm New Password</FormLabel>
                    <HStack>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
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
                      <IconButton
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        icon={<Icon as={showConfirmPassword ? FaEyeSlash : FaEye} />}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        variant="ghost"
                        size="lg"
                      />
                    </HStack>
                    
                    {/* Password Match Indicator */}
                    {confirmPassword && (
                      <HStack spacing={2} mt={2}>
                        <Icon
                          as={password === confirmPassword ? FaCheckCircle : FaExclamationTriangle}
                          color={password === confirmPassword ? 'green.500' : 'red.500'}
                          boxSize={4}
                        />
                        <Text
                          fontSize="xs"
                          color={password === confirmPassword ? 'green.500' : 'red.500'}
                        >
                          {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                        </Text>
                      </HStack>
                    )}
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
                    loadingText="Updating Password..."
                    rightIcon={<FaLock />}
                    isDisabled={!password || !confirmPassword || password !== confirmPassword || passwordStrength < 50}
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
                    Update Password
                  </Button>

                  <VStack spacing={3} w="full">
                    <ChakraLink
                      as={NextLink}
                      href="/customer/login"
                      color="neon.400"
                      fontWeight="semibold"
                      _hover={{ color: 'neon.300' }}
                      fontSize="sm"
                    >
                      Back to Sign In
                    </ChakraLink>
                  </VStack>
                </VStack>
              </form>
            </CardBody>
          </Card>

          {/* Password Requirements */}
          <Alert status="info" borderRadius="lg" maxW="md">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" fontWeight="semibold">
                Password Requirements:
              </Text>
              <Text fontSize="sm">• At least 8 characters long</Text>
              <Text fontSize="sm">• Contains uppercase and lowercase letters</Text>
              <Text fontSize="sm">• Contains numbers and special characters</Text>
            </VStack>
          </Alert>
        </VStack>
      </Container>
    </Box>
  );
}
