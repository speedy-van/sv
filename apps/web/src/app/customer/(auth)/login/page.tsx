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
  InputGroup,
  InputRightElement,
  Button,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  Link as ChakraLink,
  IconButton,
  HStack,
  Icon,
  Badge,
  Divider,
  useColorModeValue,
  useToast,
  FormErrorMessage,
  Spinner,
} from '@chakra-ui/react';
import { signIn, getCsrfToken, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import {
  FaUsers,
  FaShieldAlt,
  FaUser,
  FaLock,
  FaSignInAlt,
  FaArrowRight,
  FaMapMarkerAlt,
  FaClock,
  FaStar,
  FaHome,
  FaShoppingCart,
  FaHistory,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
} from 'react-icons/fa';

export default function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();

  const bgColor = '#0D0D0D';
  const cardBg = 'rgba(26, 26, 26, 0.95)';

  // Get CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const token = await getCsrfToken();
        setCsrfToken(token || '');
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    };
    fetchCsrfToken();
  }, []);

  // Monitor session and redirect if already authenticated
  useEffect(() => {
    const role = (session?.user as any)?.role as string | undefined;
    if (status === 'authenticated' && role === 'customer') {
      console.log('✅ Customer already authenticated, redirecting to portal');
      router.push('/customer');
    }
  }, [status, session, router]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');

    // Validate inputs
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('👤 Customer login attempt for:', email);

      // First check if customer exists and get their status
      const checkResponse = await fetch('/api/customer/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, action: 'check' }),
      });

      const checkData = await checkResponse.json();

      if (!checkResponse.ok) {
        if (checkData.redirect === '/customer/register') {
          // Customer doesn't exist, redirect to registration
          toast({
            title: 'Account Not Found',
            description: 'Please create an account first or continue as guest.',
            status: 'info',
            duration: 4000,
          });
          router.push('/customer/register');
          return;
        }
        throw new Error(checkData.message || 'Login failed');
      }

      // Customer exists, proceed with NextAuth sign in
      const result = await signIn('credentials', {
        email,
        password,
        userType: 'customer',
        csrfToken,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password.',
          status: 'error',
          duration: 3000,
        });
      } else if (result?.ok) {
        console.log('✅ Customer login successful');
        toast({
          title: 'Welcome Back!',
          description: 'Successfully signed in to your account.',
          status: 'success',
          duration: 3000,
        });
        router.push('/customer');
      }
    } catch (error) {
      console.error('❌ Customer login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      toast({
        title: 'Login Error',
        description: 'Something went wrong. Please try again.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    router.push('/');
  };

  return (
    <Box
      minH="100vh"
      bg={bgColor}
      py={{ base: 8, md: 12 }}
      position="relative"
      overflow="hidden"
      pt={{ base: 20, md: 24 }}
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

      <Container maxW="6xl" position="relative" zIndex={1}>
        <VStack spacing={{ base: 8, md: 12 }}>
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
                <Icon as={FaUsers} boxSize={12} color="neon.400" />
              </Box>

              {/* Title */}
              <VStack spacing={3}>
                <Heading
                  size={{ base: 'xl', md: '2xl' }}
                  color="text.primary"
                  textAlign="center"
                >
                  Customer Portal
                </Heading>
                <Text
                  color="text.secondary"
                  fontSize={{ base: 'md', md: 'lg' }}
                  textAlign="center"
                  maxW="500px"
                >
                  Sign in to track your orders, view history, and manage your account
                </Text>
              </VStack>

              {/* Trust Indicators */}
              <HStack spacing={4} justify="center" wrap="wrap">
                <Badge
                  colorScheme="green"
                  size="lg"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  <Icon as={FaShieldAlt} mr={2} boxSize={3} />
                  Secure Login
                </Badge>
                <Badge
                  colorScheme="blue"
                  size="lg"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  <Icon as={FaHistory} mr={2} boxSize={3} />
                  Order History
                </Badge>
                <Badge
                  colorScheme="purple"
                  size="lg"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  <Icon as={FaShoppingCart} mr={2} boxSize={3} />
                  Track Orders
                </Badge>
              </HStack>
            </VStack>
          </Box>

          {/* Login Form */}
          <Card
            maxW="md"
            w="full"
            mx="auto"
            bg={cardBg}
            borderRadius="2xl"
            borderWidth="2px"
            borderColor="rgba(59, 130, 246, 0.3)"
            boxShadow="xl"
            backdropFilter="blur(10px)"
            _hover={{
              borderColor: 'rgba(59, 130, 246, 0.5)',
              boxShadow: '0 20px 40px rgba(0, 194, 255, 0.2)',
            }}
            transition="all 0.3s ease"
          >
            <CardBody p={{ base: 6, md: 8 }}>
              <form onSubmit={handleSubmit}>
                <VStack spacing={6}>
                  <VStack spacing={2} w="full">
                    <Heading size="lg" color="white" textAlign="center">
                      Sign In
                    </Heading>
                    <Text color="gray.300" textAlign="center" fontSize="sm">
                      Access your customer account
                    </Text>
                  </VStack>

                  {error && (
                    <Alert 
                      status="error" 
                      borderRadius="lg"
                      bg="rgba(220, 38, 38, 0.1)"
                      border="1px solid"
                      borderColor="rgba(220, 38, 38, 0.3)"
                    >
                      <AlertIcon color="red.400" />
                      <Text color="white">{error}</Text>
                    </Alert>
                  )}

                  <VStack spacing={4} w="full">
                    <FormControl isRequired isInvalid={!!emailError}>
                      <FormLabel color="white" fontSize="sm" fontWeight="semibold">
                        Email Address
                      </FormLabel>
                      <InputGroup size="lg">
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) validateEmail(e.target.value);
                          }}
                          onBlur={() => validateEmail(email)}
                          placeholder="your.email@example.com"
                          borderRadius="lg"
                          bg="rgba(26, 26, 26, 0.8)"
                          borderColor={emailError ? 'red.400' : 'rgba(59, 130, 246, 0.3)'}
                          color="white"
                          _placeholder={{ color: 'gray.400' }}
                          _hover={{ 
                            borderColor: emailError ? 'red.400' : 'rgba(59, 130, 246, 0.5)',
                            bg: 'rgba(26, 26, 26, 0.9)',
                          }}
                          _focus={{
                            borderColor: emailError ? 'red.400' : 'blue.400',
                            boxShadow: emailError 
                              ? '0 0 0 1px rgba(220, 38, 38, 0.3)' 
                              : '0 0 0 1px rgba(59, 130, 246, 0.3)',
                            bg: 'rgba(26, 26, 26, 0.95)',
                          }}
                        />
                        <InputRightElement>
                          <Icon as={FaEnvelope} color="gray.400" />
                        </InputRightElement>
                      </InputGroup>
                      {emailError && (
                        <FormErrorMessage color="red.400" fontSize="xs">
                          {emailError}
                        </FormErrorMessage>
                      )}
                    </FormControl>

                    <FormControl isRequired isInvalid={!!passwordError}>
                      <FormLabel color="white" fontSize="sm" fontWeight="semibold">
                        Password
                      </FormLabel>
                      <InputGroup size="lg">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (passwordError) validatePassword(e.target.value);
                          }}
                          onBlur={() => validatePassword(password)}
                          placeholder="Enter your password"
                          borderRadius="lg"
                          bg="rgba(26, 26, 26, 0.8)"
                          borderColor={passwordError ? 'red.400' : 'rgba(59, 130, 246, 0.3)'}
                          color="white"
                          _placeholder={{ color: 'gray.400' }}
                          _hover={{ 
                            borderColor: passwordError ? 'red.400' : 'rgba(59, 130, 246, 0.5)',
                            bg: 'rgba(26, 26, 26, 0.9)',
                          }}
                          _focus={{
                            borderColor: passwordError ? 'red.400' : 'blue.400',
                            boxShadow: passwordError 
                              ? '0 0 0 1px rgba(220, 38, 38, 0.3)' 
                              : '0 0 0 1px rgba(59, 130, 246, 0.3)',
                            bg: 'rgba(26, 26, 26, 0.95)',
                          }}
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            icon={showPassword ? <FaEyeSlash /> : <FaEye />}
                            variant="ghost"
                            size="sm"
                            color="gray.400"
                            _hover={{ color: 'neon.400', bg: 'rgba(59, 130, 246, 0.1)' }}
                            onClick={() => setShowPassword(!showPassword)}
                          />
                        </InputRightElement>
                      </InputGroup>
                      {passwordError && (
                        <FormErrorMessage color="red.400" fontSize="xs">
                          {passwordError}
                        </FormErrorMessage>
                      )}
                    </FormControl>
                  </VStack>

                  <Button
                    type="submit"
                    size="lg"
                    w="full"
                    bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                    color="white"
                    fontWeight="bold"
                    borderRadius="xl"
                    isLoading={isLoading}
                    loadingText="Signing In..."
                    rightIcon={isLoading ? <Spinner size="sm" /> : <FaSignInAlt />}
                    _hover={{
                      bg: 'linear-gradient(135deg, #00D18F, #00C2FF)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,194,255,0.4)',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    _disabled={{
                      opacity: 0.6,
                      cursor: 'not-allowed',
                    }}
                    transition="all 0.2s ease"
                    disabled={isLoading || !!emailError || !!passwordError}
                  >
                    {isLoading ? 'Signing In...' : 'Sign In to Portal'}
                  </Button>

                  <Divider />

                  {/* Additional Options */}
                  <VStack spacing={3} w="full">
                    <HStack spacing={2} justify="center">
                      <Text color="gray.300" fontSize="sm">
                        Don't have an account?
                      </Text>
                      <ChakraLink
                        as={NextLink}
                        href="/customer/register"
                        color="neon.400"
                        fontWeight="semibold"
                        _hover={{ color: 'neon.300', textDecoration: 'underline' }}
                        transition="all 0.2s"
                      >
                        Create Account
                      </ChakraLink>
                    </HStack>

                    <ChakraLink
                      as={NextLink}
                      href="/customer/forgot"
                      color="gray.300"
                      fontSize="sm"
                      _hover={{ color: 'neon.400', textDecoration: 'underline' }}
                      transition="all 0.2s"
                    >
                      Forgot your password?
                    </ChakraLink>

                    <Divider />

                    <Text color="gray.400" fontSize="xs" textAlign="center">
                      Or continue as guest when booking
                    </Text>

                    <Button
                      variant="outline"
                      size="md"
                      w="full"
                      borderColor="rgba(59, 130, 246, 0.3)"
                      color="white"
                      leftIcon={<FaArrowRight />}
                      onClick={() => router.push('/booking-luxury')}
                      _hover={{
                        borderColor: 'neon.400',
                        color: 'neon.400',
                        bg: 'rgba(59, 130, 246, 0.1)',
                        transform: 'translateX(4px)',
                      }}
                      transition="all 0.2s"
                    >
                      Continue as Guest
                    </Button>
                  </VStack>
                </VStack>
              </form>
            </CardBody>
          </Card>

          {/* Features Preview */}
          <Box w="full" maxW="4xl" mx="auto">
            <VStack spacing={6}>
              <Heading size="md" color="white" textAlign="center">
                Customer Portal Features
              </Heading>
              
              <HStack spacing={8} justify="center" wrap="wrap">
                <VStack spacing={2} align="center">
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg="rgba(59, 130, 246, 0.2)"
                    color="neon.400"
                    border="1px solid"
                    borderColor="rgba(59, 130, 246, 0.3)"
                    boxShadow="0 4px 15px rgba(0,194,255,0.2)"
                    _hover={{
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,194,255,0.4)',
                    }}
                    transition="all 0.3s"
                  >
                    <Icon as={FaShoppingCart} boxSize={6} />
                  </Box>
                  <Text fontSize="sm" color="white" fontWeight="semibold">
                    Track Orders
                  </Text>
                  <Text fontSize="xs" color="gray.300" textAlign="center">
                    Real-time tracking
                  </Text>
                </VStack>

                <VStack spacing={2} align="center">
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg="rgba(0, 209, 143, 0.2)"
                    color="green.400"
                    border="1px solid"
                    borderColor="rgba(0, 209, 143, 0.3)"
                    boxShadow="0 4px 15px rgba(0,209,143,0.2)"
                    _hover={{
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,209,143,0.4)',
                    }}
                    transition="all 0.3s"
                  >
                    <Icon as={FaHistory} boxSize={6} />
                  </Box>
                  <Text fontSize="sm" color="white" fontWeight="semibold">
                    Order History
                  </Text>
                  <Text fontSize="xs" color="gray.300" textAlign="center">
                    View past orders
                  </Text>
                </VStack>

                <VStack spacing={2} align="center">
                  <Box
                    p={3}
                    borderRadius="xl"
                    bg="rgba(128, 90, 213, 0.2)"
                    color="purple.400"
                    border="1px solid"
                    borderColor="rgba(128, 90, 213, 0.3)"
                    boxShadow="0 4px 15px rgba(128,90,213,0.2)"
                    _hover={{
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(128,90,213,0.4)',
                    }}
                    transition="all 0.3s"
                  >
                    <Icon as={FaUser} boxSize={6} />
                  </Box>
                  <Text fontSize="sm" color="white" fontWeight="semibold">
                    Manage Profile
                  </Text>
                  <Text fontSize="xs" color="gray.300" textAlign="center">
                    Update details
                  </Text>
                </VStack>
              </HStack>
            </VStack>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
