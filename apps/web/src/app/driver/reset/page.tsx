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
  InputGroup,
  InputRightElement,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useRouter, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import {
  FaTruck,
  FaArrowLeft,
  FaLock,
  FaShieldAlt,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
} from 'react-icons/fa';

export default function DriverResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');

  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      console.log('🔐 Reset token received:', tokenParam.substring(0, 8) + '...');
    } else {
      setError('Invalid or missing reset token. Please request a new password reset.');
    }
  }, [searchParams]);

  const validatePassword = (password: string): string[] => {
    const errors = [];
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('. '));
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔐 Submitting password reset for token:', token.substring(0, 8) + '...');
      
      const response = await fetch('/api/driver/auth/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const result = await response.json();
      console.log('🔐 Password reset response:', result);

      if (response.ok) {
        setSuccess(true);
        toast({
          title: 'Password Reset Successful',
          description: 'Your password has been reset successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/driver-auth');
        }, 3000);
      } else {
        setError(result.error || 'An error occurred. Please try again.');
        toast({
          title: 'Reset Failed',
          description: result.error || 'An error occurred. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('❌ Driver Reset Password Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
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
                Password Reset Successful
              </Heading>
              <Text color="gray.600" fontSize={{ base: "sm", md: "md" }} px={4}>
                Your password has been reset successfully. You will be redirected to the login page shortly.
              </Text>
            </VStack>
            
            <Button
              colorScheme="blue"
              onClick={handleBackClick}
              size={{ base: "md", md: "lg" }}
              w={{ base: "full", md: "auto" }}
            >
              Go to Login
            </Button>
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
              Set New Password
            </Heading>
            <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>
              Enter your new password below.
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
                      <Icon as={FaLock} color="blue.500" />
                      New Password
                    </FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter your new password"
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
                      <InputRightElement h="full" pr={3}>
                        <IconButton
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          icon={<Icon as={showPassword ? FaEyeSlash : FaEye} />}
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel
                      fontSize="md"
                      fontWeight="semibold"
                      color="text.primary"
                      display="flex"
                      alignItems="center"
                      gap={2}
                    >
                      <Icon as={FaLock} color="blue.500" />
                      Confirm Password
                    </FormLabel>
                    <InputGroup>
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
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
                      <InputRightElement h="full" pr={3}>
                        <IconButton
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          icon={<Icon as={showConfirmPassword ? FaEyeSlash : FaEye} />}
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    w="full"
                    isLoading={isLoading}
                    loadingText="Resetting Password..."
                    leftIcon={<Icon as={FaShieldAlt} />}
                    borderRadius="xl"
                    fontWeight="semibold"
                    py={6}
                  >
                    Reset Password
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
            
            <ChakraLink as={NextLink} href="/driver/forgot" color="blue.500" fontSize="sm">
              Need a new reset link?
            </ChakraLink>
          </HStack>

          <Text color="gray.500" fontSize="xs" textAlign="center" maxW="sm">
            Password must be at least 8 characters long and contain uppercase, lowercase, and numbers.
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}
