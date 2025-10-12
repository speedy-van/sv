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
  Badge,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { signIn, getCsrfToken, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import {
  FaTruck,
  FaShieldAlt,
  FaUser,
  FaLock,
  FaSignInAlt,
  FaArrowRight,
  FaMapMarkerAlt,
  FaClock,
  FaStar,
  FaHome,
} from 'react-icons/fa';
import { useRoleBasedRedirect } from '@/hooks/useRoleBasedRedirect';

export default function DriverLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [showApplyButton, setShowApplyButton] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { userRole } = useRoleBasedRedirect();

  const bgColor = useColorModeValue('white', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');

  // Get CSRF token on component mount
  React.useEffect(() => {
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
    if (status === 'loading') return; // Still loading

    if (session?.user && (session.user as any).role === 'driver') {
      console.log('✅ Driver session detected, redirecting to dashboard');
      // The useRoleBasedRedirect hook will handle the redirect automatically
    }
  }, [session, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setShowApplyButton(false);

    try {
      console.log('🚚 Driver login attempt:', { email });

      // Check if user exists and their status
      const checkResponse = await fetch('/api/driver/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const checkResult = await checkResponse.json();

      if (!checkResponse.ok) {
        // Case 3: Not registered/never applied -> redirect to application
        if (checkResult.error === 'Invalid email or password') {
          console.log('❌ Driver not found - redirecting to application form');
          router.replace('/driver-application');
          return;
        } else {
          setError(checkResult.error || 'Invalid credentials');
          return;
        }
      }

      // User exists as driver - check status
      const driverStatus = checkResult.user.driver?.onboardingStatus;

      if (driverStatus === 'approved') {
        // Case 1: Approved driver -> sign in and redirect to portal
        console.log('✅ Approved driver - proceeding with sign in');
        
        const result = await signIn('credentials', {
          email,
          password,
          csrfToken,
          userType: 'driver',
          redirect: false,
        });

        if (result?.error) {
          setError(result.error);
        } else if (result?.ok) {
          console.log('✅ Driver session created, redirecting to driver portal...');
          window.location.href = '/driver';
        } else {
          setError('Authentication failed. Please try again.');
        }
      } else {
        // Case 2: Pending/under review -> show message
        console.log('⏳ Driver application pending - showing review message');
        const statusMessages = {
          'pending': 'Your driver application is currently being reviewed by our team.',
          'under_review': 'Your application is currently being reviewed by our team.',
          'requires_additional_info': 'Your application requires additional information. Please check your email.',
          'rejected': 'Your driver application was not approved. Please contact support for more information.',
        };
        
        const message = (statusMessages as any)[driverStatus] || 'Your driver application is currently being reviewed by our team.';
        setError(message);
        return;
      }

    } catch (error) {
      console.error('Driver sign in error:', error);
      setError('An error occurred. Please try again.');
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
              data-testid="back-button"
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
              {/* Logo and Title */}
              <Box
                p={6}
                borderRadius="2xl"
                bg="linear-gradient(135deg, rgba(0,194,255,0.1), rgba(0,209,143,0.1))"
                borderWidth="2px"
                borderColor="neon.400"
                display="inline-block"
              >
                <Icon as={FaTruck} color="neon.500" boxSize={12} />
              </Box>

              <VStack spacing={3}>
                <Heading
                  size={{ base: 'xl', md: '2xl' }}
                  color="neon.500"
                  mb={2}
                  textShadow="0 0 20px rgba(0,194,255,0.3)"
                  fontWeight="extrabold"
                >
                  🚚 Driver Login
                </Heading>
                <Text
                  color="text.secondary"
                  fontSize={{ base: 'md', md: 'lg' }}
                  maxW="2xl"
                  mx="auto"
                  lineHeight="1.6"
                >
                  Sign in to your driver account and access your dashboard
                </Text>
                {status === 'loading' && (
                  <Badge
                    colorScheme="blue"
                    variant="solid"
                    size="md"
                    px={4}
                    py={2}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="semibold"
                    boxShadow="0 4px 15px rgba(0,194,255,0.3)"
                  >
                    <Icon as={FaClock} mr={2} />
                    Checking authentication status...
                  </Badge>
                )}
              </VStack>

              {/* Trust Badges */}
              <HStack spacing={4} justify="center" flexWrap="wrap">
                <Badge
                  colorScheme="green"
                  variant="solid"
                  size="lg"
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="semibold"
                  boxShadow="0 4px 15px rgba(0,209,143,0.3)"
                >
                  <Icon as={FaShieldAlt} mr={2} />
                  Secure Access
                </Badge>
                <Badge
                  colorScheme="blue"
                  variant="solid"
                  size="lg"
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="semibold"
                  boxShadow="0 4px 15px rgba(0,194,255,0.3)"
                >
                  <Icon as={FaClock} mr={2} />
                  24/7 Available
                </Badge>
                <Badge
                  colorScheme="purple"
                  variant="solid"
                  size="lg"
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="semibold"
                  boxShadow="0 4px 15px rgba(128,90,213,0.3)"
                >
                  <Icon as={FaStar} mr={2} />
                  Professional
                </Badge>
              </HStack>
            </VStack>
          </Box>

          {/* Main Content Grid */}
          <Box w="full">
            <Box
              maxW="4xl"
              mx="auto"
              display="grid"
              gridTemplateColumns={{ base: '1fr', lg: '1fr 1fr' }}
              gap={{ base: 8, lg: 12 }}
              alignItems="center"
            >
              {/* Login Form */}
              <Box>
                <Card
                  w="full"
                  borderRadius="2xl"
                  borderWidth="2px"
                  borderColor="border.primary"
                  bg={cardBg}
                  boxShadow="xl"
                  overflow="hidden"
                  position="relative"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: '2xl',
                    background:
                      'linear-gradient(135deg, rgba(0,194,255,0.05), rgba(0,209,143,0.05))',
                    pointerEvents: 'none',
                  }}
                >
                  <CardBody
                    p={{ base: 6, md: 8 }}
                    position="relative"
                    zIndex={1}
                  >
                    <VStack spacing={6}>
                      {/* Form Header */}
                      <VStack spacing={3} textAlign="center">
                        <Box
                          p={4}
                          borderRadius="xl"
                          bg="neon.500"
                          color="white"
                          boxSize="60px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          mx="auto"
                          boxShadow="0 8px 25px rgba(0,194,255,0.3)"
                        >
                          <Icon as={FaSignInAlt} boxSize={6} />
                        </Box>
                        <Heading size="lg" color="text.primary">
                          Welcome Back
                        </Heading>
                        <Text color="text.secondary" fontSize="md">
                          Sign in to your driver account
                        </Text>
                      </VStack>

                      <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                        <VStack spacing={5}>
                          {error && (
                            <VStack spacing={3} w="full">
                              <Alert
                                data-testid="error-message"
                                status="error"
                                borderRadius="xl"
                                borderWidth="1px"
                                borderColor="red.400"
                              >
                                <AlertIcon />
                                {error}
                              </Alert>
                              
                              {showApplyButton && (
                                <Button
                                  as={NextLink}
                                  href="/driver-application"
                                  colorScheme="blue"
                                  size="md"
                                  w="full"
                                  leftIcon={<FaTruck />}
                                  borderRadius="xl"
                                >
                                  Apply to Become Driver
                                </Button>
                              )}
                            </VStack>
                          )}

                          {/* Hidden CSRF token field */}
                          <input
                            type="hidden"
                            name="csrfToken"
                            value={csrfToken}
                          />

                          <FormControl isRequired>
                            <FormLabel
                              fontSize="md"
                              fontWeight="semibold"
                              color="text.primary"
                              display="flex"
                              alignItems="center"
                              gap={2}
                            >
                              <Icon as={FaUser} color="neon.400" />
                              Email Address
                            </FormLabel>
                            <Input
                              data-testid="email-input"
                              type="email"
                              name="email"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              placeholder="Enter your email address"
                              size="lg"
                              borderRadius="xl"
                              borderWidth="2px"
                              borderColor="border.primary"
                              bg="bg.surface"
                              _focus={{
                                borderColor: 'neon.400',
                                boxShadow: '0 0 0 1px rgba(0,194,255,0.2)',
                              }}
                              _hover={{
                                borderColor: 'neon.300',
                              }}
                              transition="all 0.2s"
                            />
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
                              <Icon as={FaLock} color="neon.400" />
                              Password
                            </FormLabel>
                            <Input
                              data-testid="password-input"
                              type="password"
                              name="password"
                              value={password}
                              onChange={e => setPassword(e.target.value)}
                              placeholder="Enter your password"
                              size="lg"
                              borderRadius="xl"
                              borderWidth="2px"
                              borderColor="border.primary"
                              bg="bg.surface"
                              _focus={{
                                borderColor: 'neon.400',
                                boxShadow: '0 0 0 1px rgba(0,194,255,0.2)',
                              }}
                              _hover={{
                                borderColor: 'neon.300',
                              }}
                              transition="all 0.2s"
                            />
                          </FormControl>

                          <Button
                            data-testid="login-button"
                            type="submit"
                            size="lg"
                            w="full"
                            isLoading={isLoading}
                            bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                            color="white"
                            borderRadius="xl"
                            py={7}
                            fontSize="lg"
                            fontWeight="bold"
                            _hover={{
                              bg: 'linear-gradient(135deg, #00D18F, #00C2FF)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 8px 25px rgba(0,194,255,0.4)',
                            }}
                            _active={{
                              bg: 'linear-gradient(135deg, #00B8E6, #00C2FF)',
                            }}
                            transition="all 0.3s ease"
                            rightIcon={<FaArrowRight />}
                          >
                            Sign In to Dashboard
                          </Button>
                        </VStack>
                      </form>

                      {/* Additional Links */}
                      <VStack spacing={3} w="full">
                        <Divider borderColor="border.primary" />
                        <Text
                          fontSize="sm"
                          color="text.tertiary"
                          textAlign="center"
                        >
                          <ChakraLink
                            data-testid="forgot-password-link"
                            as={NextLink}
                            href="/driver/forgot"
                            color="neon.400"
                            fontWeight="semibold"
                            _hover={{
                              textDecoration: 'underline',
                              color: 'neon.300',
                            }}
                          >
                            Forgot your password?
                          </ChakraLink>
                        </Text>
                        <Text
                          fontSize="sm"
                          color="text.tertiary"
                          textAlign="center"
                        >
                          Don't have a driver account?{' '}
                          <ChakraLink
                            color="neon.400"
                            fontWeight="semibold"
                            _hover={{
                              textDecoration: 'underline',
                              color: 'neon.300',
                            }}
                          >
                            Contact support
                          </ChakraLink>{' '}
                          to get started.
                        </Text>
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              </Box>

              {/* Benefits Section */}
              <Box>
                <VStack spacing={8} align="start">
                  <VStack spacing={6} align="start">
                    <Heading size="lg" color="text.primary">
                      Why Choose Speedy Van?
                    </Heading>
                    <Text color="text.secondary" fontSize="md" lineHeight="1.6">
                      Join our network of professional drivers and enjoy
                      flexible hours, competitive pay, and the support you need
                      to succeed.
                    </Text>
                  </VStack>

                  <VStack spacing={4} align="start" w="full">
                    {[
                      {
                        icon: FaTruck,
                        title: 'Flexible Scheduling',
                        description:
                          'Choose your own hours and work when it suits you',
                      },
                      {
                        icon: FaMapMarkerAlt,
                        title: 'Nationwide Coverage',
                        description: 'Access to jobs across the entire UK',
                      },
                      {
                        icon: FaClock,
                        title: 'Quick Payments',
                        description:
                          'Get paid within 48 hours of job completion',
                      },
                      {
                        icon: FaShieldAlt,
                        title: 'Full Support',
                        description:
                          '24/7 customer service and technical support',
                      },
                    ].map((benefit, index) => (
                      <Box
                        key={index}
                        p={4}
                        borderRadius="xl"
                        borderWidth="1px"
                        borderColor="border.primary"
                        bg="bg.surface"
                        w="full"
                        _hover={{
                          borderColor: 'neon.400',
                          transform: 'translateX(4px)',
                          boxShadow: '0 4px 20px rgba(0,194,255,0.1)',
                        }}
                        transition="all 0.3s ease"
                      >
                        <HStack spacing={4}>
                          <Box
                            p={3}
                            borderRadius="lg"
                            bg="neon.500"
                            color="white"
                            boxSize="50px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                          >
                            <Icon as={benefit.icon} boxSize={5} />
                          </Box>
                          <VStack align="start" spacing={1}>
                            <Text
                              fontWeight="semibold"
                              color="text.primary"
                              fontSize="md"
                            >
                              {benefit.title}
                            </Text>
                            <Text
                              color="text.secondary"
                              fontSize="sm"
                              lineHeight="1.4"
                            >
                              {benefit.description}
                            </Text>
                          </VStack>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </VStack>
              </Box>
            </Box>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
