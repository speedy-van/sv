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
  useToast,
  FormErrorMessage,
  Spinner,
  Checkbox,
  Progress,
  Flex,
  Tooltip,
  BoxProps,
} from '@chakra-ui/react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { motion, isValidMotionProp } from 'framer-motion';
import { chakra, shouldForwardProp } from '@chakra-ui/react';
import {
  FaUsers,
  FaShieldAlt,
  FaUser,
  FaLock,
  FaUserPlus,
  FaArrowRight,
  FaHome,
  FaShoppingCart,
  FaHistory,
  FaEye,
  FaEyeSlash,
  FaEnvelope,
  FaPhone,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaStar,
  FaCheck,
} from 'react-icons/fa';

// Create motion components with proper prop filtering to avoid hydration errors
const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    if (isValidMotionProp(prop)) {
      return true;
    }
    return shouldForwardProp(prop);
  },
});

const MotionCard = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    if (isValidMotionProp(prop)) {
      return true;
    }
    return shouldForwardProp(prop);
  },
});

// Password strength calculation
const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z\d]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Weak', color: 'red.400' };
  if (score <= 4) return { score, label: 'Medium', color: 'yellow.400' };
  return { score, label: 'Strong', color: 'green.400' };
};

// Password requirements checklist
const passwordRequirements = [
  { id: 'length', label: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
  { id: 'lowercase', label: 'One lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
  { id: 'uppercase', label: 'One uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
  { id: 'number', label: 'One number', test: (pwd: string) => /\d/.test(pwd) },
];

interface AnimatedFieldProps extends BoxProps {
  children: React.ReactNode;
  delay?: number;
}

const AnimatedField = ({ children, delay = 0, ...props }: AnimatedFieldProps) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't animate on server side to prevent hydration errors
  if (!isMounted) {
    return <Box {...props}>{children}</Box>;
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay } as any}
      {...props}
    >
      {children}
    </MotionBox>
  );
};

export default function CustomerRegister() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    marketingConsent: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();

  const bgColor = '#0D0D0D';
  const cardBg = 'rgba(26, 26, 26, 0.95)';

  // Client-side only check to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Monitor session and redirect if already authenticated
  useEffect(() => {
    const role = (session?.user as any)?.role as string | undefined;
    if (status === 'authenticated' && role === 'customer') {
      console.log('✅ Customer already authenticated, redirecting to portal');
      router.push('/customer');
    }
  }, [status, session, router]);

  // Calculate password strength
  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(calculatePasswordStrength(formData.password));
    } else {
      setPasswordStrength({ score: 0, label: '', color: '' });
    }
  }, [formData.password]);

  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'name':
        if (!value) return 'Name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        if (!/^[a-zA-Z\s\-']+$/.test(value)) return 'Name can only contain letters, spaces, hyphens and apostrophes';
        return '';
      case 'email':
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';
      case 'phone':
        if (!value) return 'Phone number is required';
        const phoneRegex = /^[\d\s\+\-\(\)]+$/;
        if (!phoneRegex.test(value)) return 'Please enter a valid phone number';
        if (value.replace(/\D/g, '').length < 10) return 'Phone number must be at least 10 digits';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain a lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain an uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password must contain a number';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue,
    }));

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }

    // Real-time validation for password confirmation
    if (name === 'confirmPassword' && formData.password) {
      const error = validateField(name, fieldValue);
      if (error) {
        setErrors(prev => ({
          ...prev,
          [name]: error,
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const newErrors: Record<string, string> = {};

    // Mark all fields as touched
    Object.keys(formData).forEach(key => {
      setTouched(prev => ({ ...prev, [key]: true }));
    });

    // Validate all fields
    Object.keys(formData).forEach(key => {
      if (key === 'marketingConsent') return; // Optional field
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key] = error;
      }
    });

    // Check terms acceptance
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        title: 'Validation Error',
        description: 'Please correct the errors in the form',
        status: 'error',
        duration: 3000,
        position: 'top',
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('👤 Customer registration attempt for:', formData.email);

      // Register the customer
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: 'customer',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      console.log('✅ Customer registration successful');

      // Show success toast
      toast({
        title: 'Account Created!',
        description: 'Your account has been created successfully. Signing you in...',
        status: 'success',
        duration: 3000,
        position: 'top',
      });

      // Auto sign in after registration
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        userType: 'customer',
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but sign in failed - redirect to login
        toast({
          title: 'Account Created!',
          description: 'Please sign in with your new account.',
          status: 'success',
          duration: 5000,
        });
        router.push('/customer/login');
      } else if (signInResult?.ok) {
        toast({
          title: 'Welcome!',
          description: 'Your account has been created and you are now logged in.',
          status: 'success',
          duration: 3000,
        });
        router.push('/customer');
      }
    } catch (error) {
      console.error('❌ Customer registration error:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
      toast({
        title: 'Registration Error',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        status: 'error',
        duration: 5000,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    router.push('/');
  };

  const isFormValid = Object.keys(errors).length === 0 && 
                     formData.name && 
                     formData.email && 
                     formData.phone && 
                     formData.password && 
                     formData.confirmPassword && 
                     formData.acceptTerms;

  return (
    <Box
      minH="100vh"
      bg={bgColor}
      py={{ base: 8, md: 12 }}
      position="relative"
      overflow="hidden"
      pt={{ base: 20, md: 24 }}
    >
      {/* Enhanced Background Pattern */}
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        opacity={0.03}
        background="radial-gradient(circle at 20% 80%, rgba(0,194,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,209,143,0.15) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(59,130,246,0.1) 0%, transparent 70%)"
        pointerEvents="none"
      />

      {/* Animated gradient orbs - only on client side */}
      {isMounted && (
        <>
          <MotionBox
            position="absolute"
            top="-20%"
            right="-10%"
            width="600px"
            height="600px"
            borderRadius="50%"
            bg="rgba(0,194,255,0.05)"
            filter="blur(80px)"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            } as any}
            pointerEvents="none"
          />
          <MotionBox
            position="absolute"
            bottom="-20%"
            left="-10%"
            width="600px"
            height="600px"
            borderRadius="50%"
            bg="rgba(0,209,143,0.05)"
            filter="blur(80px)"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.1, 0.05],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            } as any}
            pointerEvents="none"
          />
        </>
      )}

      <Container maxW="6xl" position="relative" zIndex={1}>
        <VStack spacing={{ base: 8, md: 12 }}>
          {/* Back Button */}
          <AnimatedField delay={0}>
            <HStack w="full" justify="flex-start">
              <IconButton
                aria-label="Back to main page"
                icon={<FaHome />}
                variant="ghost"
                onClick={handleBackClick}
                size="lg"
                color="gray.300"
                _hover={{
                  bg: 'rgba(59, 130, 246, 0.1)',
                  color: 'neon.400',
                  transform: 'translateX(-4px)',
                }}
                transition="all 0.2s"
              />
            </HStack>
          </AnimatedField>

          {/* Enhanced Header Section */}
          <AnimatedField delay={0.1}>
            <Box textAlign="center" w="full">
              <VStack spacing={6}>
              {/* Enhanced Logo/Icon */}
              <Box
                p={6}
                borderRadius="2xl"
                bg="linear-gradient(135deg, rgba(0,194,255,0.15), rgba(0,209,143,0.15))"
                border="2px solid"
                borderColor="neon.500"
                boxShadow="0 0 40px rgba(0,194,255,0.3), inset 0 0 20px rgba(0,194,255,0.1)"
                _hover={{
                  transform: 'scale(1.05) rotate(5deg)',
                }}
                transition="all 0.3s ease"
              >
                <Icon as={FaUserPlus} boxSize={14} color="neon.400" />
              </Box>

                {/* Enhanced Title */}
                <VStack spacing={3}>
                  <Heading
                    size={{ base: 'xl', md: '2xl' }}
                    color="white"
                    textAlign="center"
                    bgGradient="linear(to-r, neon.400, neon.300)"
                    bgClip="text"
                    fontWeight="bold"
                  >
                    Create Your Account
                  </Heading>
                  <Text
                    color="gray.300"
                    fontSize={{ base: 'md', md: 'lg' }}
                    textAlign="center"
                    maxW="500px"
                    lineHeight="tall"
                  >
                    Join Speedy Van to track your orders, view history, and manage your account with ease
                  </Text>
                </VStack>

                {/* Enhanced Trust Indicators */}
                <HStack spacing={4} justify="center" wrap="wrap" gap={3}>
                  {[
                    { icon: FaShieldAlt, label: 'Secure Sign Up', color: 'green.400' },
                    { icon: FaHistory, label: 'Order History', color: 'blue.400' },
                    { icon: FaShoppingCart, label: 'Track Orders', color: 'purple.400' },
                  ].map((item, index) => (
                    <AnimatedField key={item.label} delay={0.2 + index * 0.1}>
                      <Badge
                        colorScheme="blue"
                        size="lg"
                        px={4}
                        py={2}
                        borderRadius="full"
                        bg="rgba(59, 130, 246, 0.1)"
                        border="1px solid"
                        borderColor="rgba(59, 130, 246, 0.3)"
                        color="white"
                        _hover={{
                          bg: 'rgba(59, 130, 246, 0.2)',
                          borderColor: 'rgba(59, 130, 246, 0.5)',
                          transform: 'translateY(-2px)',
                        }}
                        transition="all 0.2s"
                      >
                        <HStack spacing={2}>
                          <Icon as={item.icon} boxSize={3} color={item.color} />
                          <Text fontSize="xs" fontWeight="semibold">{item.label}</Text>
                        </HStack>
                      </Badge>
                    </AnimatedField>
                  ))}
                </HStack>
              </VStack>
            </Box>
          </AnimatedField>

          {/* Enhanced Registration Form */}
          <AnimatedField delay={0.3}>
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
                boxShadow: '0 20px 40px rgba(0, 194, 255, 0.3)',
              }}
              transition="all 0.3s ease"
            >
              <CardBody p={{ base: 6, md: 8 }}>
                <form onSubmit={handleSubmit}>
                  <VStack spacing={6}>
                    <VStack spacing={2} w="full">
                      <Heading size="lg" color="white" textAlign="center">
                        Sign Up
                      </Heading>
                      <Text color="gray.300" textAlign="center" fontSize="sm">
                        Create your customer account
                      </Text>
                    </VStack>

                    {error && (
                      <Box w="full">
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
                      </Box>
                    )}

                    <VStack spacing={5} w="full">
                      {/* Full Name Field */}
                      <AnimatedField delay={0.4}>
                        <FormControl isRequired isInvalid={!!errors.name && touched.name}>
                          <FormLabel color="white" fontSize="sm" fontWeight="semibold" mb={2}>
                            Full Name
                          </FormLabel>
                          <InputGroup size="lg">
                            <Input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              onBlur={handleBlur}
                              placeholder="John Doe"
                              borderRadius="lg"
                              bg="rgba(26, 26, 26, 0.8)"
                              borderColor={errors.name && touched.name ? 'red.400' : 'rgba(59, 130, 246, 0.3)'}
                              color="white"
                              _placeholder={{ color: 'gray.400' }}
                              _hover={{ 
                                borderColor: errors.name && touched.name ? 'red.400' : 'rgba(59, 130, 246, 0.5)',
                                bg: 'rgba(26, 26, 26, 0.9)',
                              }}
                              _focus={{
                                borderColor: errors.name && touched.name ? 'red.400' : 'blue.400',
                                boxShadow: errors.name && touched.name
                                  ? '0 0 0 1px rgba(220, 38, 38, 0.3)' 
                                  : '0 0 0 1px rgba(59, 130, 246, 0.3)',
                                bg: 'rgba(26, 26, 26, 0.95)',
                              }}
                            />
                            <InputRightElement>
                              <Icon as={FaUser} color={errors.name && touched.name ? 'red.400' : 'gray.400'} />
                            </InputRightElement>
                          </InputGroup>
                          {errors.name && touched.name && (
                            <FormErrorMessage color="red.400" fontSize="xs" mt={1}>
                              {errors.name}
                            </FormErrorMessage>
                          )}
                        </FormControl>
                      </AnimatedField>

                      {/* Email Field */}
                      <AnimatedField delay={0.5}>
                        <FormControl isRequired isInvalid={!!errors.email && touched.email}>
                          <FormLabel color="white" fontSize="sm" fontWeight="semibold" mb={2}>
                            Email Address
                          </FormLabel>
                          <InputGroup size="lg">
                            <Input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              onBlur={handleBlur}
                              placeholder="your.email@example.com"
                              borderRadius="lg"
                              bg="rgba(26, 26, 26, 0.8)"
                              borderColor={errors.email && touched.email ? 'red.400' : 'rgba(59, 130, 246, 0.3)'}
                              color="white"
                              _placeholder={{ color: 'gray.400' }}
                              _hover={{ 
                                borderColor: errors.email && touched.email ? 'red.400' : 'rgba(59, 130, 246, 0.5)',
                                bg: 'rgba(26, 26, 26, 0.9)',
                              }}
                              _focus={{
                                borderColor: errors.email && touched.email ? 'red.400' : 'blue.400',
                                boxShadow: errors.email && touched.email
                                  ? '0 0 0 1px rgba(220, 38, 38, 0.3)' 
                                  : '0 0 0 1px rgba(59, 130, 246, 0.3)',
                                bg: 'rgba(26, 26, 26, 0.95)',
                              }}
                            />
                            <InputRightElement>
                              <Icon as={FaEnvelope} color={errors.email && touched.email ? 'red.400' : 'gray.400'} />
                            </InputRightElement>
                          </InputGroup>
                          {errors.email && touched.email && (
                            <FormErrorMessage color="red.400" fontSize="xs" mt={1}>
                              {errors.email}
                            </FormErrorMessage>
                          )}
                        </FormControl>
                      </AnimatedField>

                      {/* Phone Field */}
                      <AnimatedField delay={0.6}>
                        <FormControl isRequired isInvalid={!!errors.phone && touched.phone}>
                          <FormLabel color="white" fontSize="sm" fontWeight="semibold" mb={2}>
                            Phone Number
                          </FormLabel>
                          <InputGroup size="lg">
                            <Input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              onBlur={handleBlur}
                              placeholder="+44 1234 567890"
                              borderRadius="lg"
                              bg="rgba(26, 26, 26, 0.8)"
                              borderColor={errors.phone && touched.phone ? 'red.400' : 'rgba(59, 130, 246, 0.3)'}
                              color="white"
                              _placeholder={{ color: 'gray.400' }}
                              _hover={{ 
                                borderColor: errors.phone && touched.phone ? 'red.400' : 'rgba(59, 130, 246, 0.5)',
                                bg: 'rgba(26, 26, 26, 0.9)',
                              }}
                              _focus={{
                                borderColor: errors.phone && touched.phone ? 'red.400' : 'blue.400',
                                boxShadow: errors.phone && touched.phone
                                  ? '0 0 0 1px rgba(220, 38, 38, 0.3)' 
                                  : '0 0 0 1px rgba(59, 130, 246, 0.3)',
                                bg: 'rgba(26, 26, 26, 0.95)',
                              }}
                            />
                            <InputRightElement>
                              <Icon as={FaPhone} color={errors.phone && touched.phone ? 'red.400' : 'gray.400'} />
                            </InputRightElement>
                          </InputGroup>
                          {errors.phone && touched.phone && (
                            <FormErrorMessage color="red.400" fontSize="xs" mt={1}>
                              {errors.phone}
                            </FormErrorMessage>
                          )}
                        </FormControl>
                      </AnimatedField>

                      {/* Password Field with Strength Indicator */}
                      <AnimatedField delay={0.7}>
                        <FormControl isRequired isInvalid={!!errors.password && touched.password}>
                          <FormLabel color="white" fontSize="sm" fontWeight="semibold" mb={2}>
                            Password
                          </FormLabel>
                          <InputGroup size="lg">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              onBlur={handleBlur}
                              placeholder="Enter your password"
                              borderRadius="lg"
                              bg="rgba(26, 26, 26, 0.8)"
                              borderColor={errors.password && touched.password ? 'red.400' : 'rgba(59, 130, 246, 0.3)'}
                              color="white"
                              _placeholder={{ color: 'gray.400' }}
                              _hover={{ 
                                borderColor: errors.password && touched.password ? 'red.400' : 'rgba(59, 130, 246, 0.5)',
                                bg: 'rgba(26, 26, 26, 0.9)',
                              }}
                              _focus={{
                                borderColor: errors.password && touched.password ? 'red.400' : 'blue.400',
                                boxShadow: errors.password && touched.password
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
                          
                          {/* Password Strength Indicator */}
                          {formData.password && (
                            <Box mt={2}>
                              <HStack spacing={2} mb={2}>
                                <Progress
                                  value={(passwordStrength.score / 6) * 100}
                                  colorScheme={passwordStrength.score <= 2 ? 'red' : passwordStrength.score <= 4 ? 'yellow' : 'green'}
                                  size="sm"
                                  borderRadius="full"
                                  flex={1}
                                  bg="rgba(255,255,255,0.1)"
                                />
                                {passwordStrength.label && (
                                  <Text fontSize="xs" color={passwordStrength.color} fontWeight="semibold">
                                    {passwordStrength.label}
                                  </Text>
                                )}
                              </HStack>
                              
                              {/* Password Requirements Checklist */}
                              <VStack align="stretch" spacing={1} mt={2}>
                                {passwordRequirements.map((req) => {
                                  const met = req.test(formData.password);
                                  return (
                                    <HStack key={req.id} spacing={2}>
                                      <Icon
                                        as={met ? FaCheckCircle : FaTimesCircle}
                                        color={met ? 'green.400' : 'gray.500'}
                                        boxSize={3}
                                      />
                                      <Text
                                        fontSize="xs"
                                        color={met ? 'green.400' : 'gray.400'}
                                        textDecoration={met ? 'none' : 'line-through'}
                                      >
                                        {req.label}
                                      </Text>
                                    </HStack>
                                  );
                                })}
                              </VStack>
                            </Box>
                          )}
                          
                          {errors.password && touched.password && (
                            <FormErrorMessage color="red.400" fontSize="xs" mt={1}>
                              {errors.password}
                            </FormErrorMessage>
                          )}
                        </FormControl>
                      </AnimatedField>

                      {/* Confirm Password Field */}
                      <AnimatedField delay={0.8}>
                        <FormControl isRequired isInvalid={!!errors.confirmPassword && touched.confirmPassword}>
                          <FormLabel color="white" fontSize="sm" fontWeight="semibold" mb={2}>
                            Confirm Password
                          </FormLabel>
                          <InputGroup size="lg">
                            <Input
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              onBlur={handleBlur}
                              placeholder="Confirm your password"
                              borderRadius="lg"
                              bg="rgba(26, 26, 26, 0.8)"
                              borderColor={errors.confirmPassword && touched.confirmPassword ? 'red.400' : formData.confirmPassword && formData.confirmPassword === formData.password ? 'green.400' : 'rgba(59, 130, 246, 0.3)'}
                              color="white"
                              _placeholder={{ color: 'gray.400' }}
                              _hover={{ 
                                borderColor: errors.confirmPassword && touched.confirmPassword ? 'red.400' : formData.confirmPassword && formData.confirmPassword === formData.password ? 'green.400' : 'rgba(59, 130, 246, 0.5)',
                                bg: 'rgba(26, 26, 26, 0.9)',
                              }}
                              _focus={{
                                borderColor: errors.confirmPassword && touched.confirmPassword ? 'red.400' : formData.confirmPassword && formData.confirmPassword === formData.password ? 'green.400' : 'blue.400',
                                boxShadow: errors.confirmPassword && touched.confirmPassword
                                  ? '0 0 0 1px rgba(220, 38, 38, 0.3)' 
                                  : formData.confirmPassword && formData.confirmPassword === formData.password
                                  ? '0 0 0 1px rgba(34, 197, 94, 0.3)'
                                  : '0 0 0 1px rgba(59, 130, 246, 0.3)',
                                bg: 'rgba(26, 26, 26, 0.95)',
                              }}
                            />
                            <InputRightElement>
                              {formData.confirmPassword && formData.confirmPassword === formData.password ? (
                                <Icon as={FaCheckCircle} color="green.400" />
                              ) : (
                                <IconButton
                                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                  icon={showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                  variant="ghost"
                                  size="sm"
                                  color="gray.400"
                                  _hover={{ color: 'neon.400', bg: 'rgba(59, 130, 246, 0.1)' }}
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                />
                              )}
                            </InputRightElement>
                          </InputGroup>
                          {errors.confirmPassword && touched.confirmPassword && (
                            <FormErrorMessage color="red.400" fontSize="xs" mt={1}>
                              {errors.confirmPassword}
                            </FormErrorMessage>
                          )}
                        </FormControl>
                      </AnimatedField>

                      {/* Terms Checkbox */}
                      <AnimatedField delay={0.9}>
                        <FormControl isInvalid={!!errors.acceptTerms && touched.acceptTerms}>
                          <Checkbox
                            name="acceptTerms"
                            isChecked={formData.acceptTerms}
                            onChange={(e) => handleInputChange(e as any)}
                            colorScheme="blue"
                            size="lg"
                            borderColor={errors.acceptTerms && touched.acceptTerms ? 'red.400' : 'rgba(59, 130, 246, 0.3)'}
                          >
                            <Text color="gray.300" fontSize="sm">
                              I accept the{' '}
                              <ChakraLink
                                as={NextLink}
                                href="/terms"
                                color="neon.400"
                                _hover={{ textDecoration: 'underline' }}
                                target="_blank"
                              >
                                Terms and Conditions
                              </ChakraLink>
                              {' '}and{' '}
                              <ChakraLink
                                as={NextLink}
                                href="/privacy"
                                color="neon.400"
                                _hover={{ textDecoration: 'underline' }}
                                target="_blank"
                              >
                                Privacy Policy
                              </ChakraLink>
                            </Text>
                          </Checkbox>
                          {errors.acceptTerms && touched.acceptTerms && (
                            <FormErrorMessage color="red.400" fontSize="xs" mt={1}>
                              {errors.acceptTerms}
                            </FormErrorMessage>
                          )}
                        </FormControl>
                      </AnimatedField>

                      {/* Marketing Consent Checkbox */}
                      <AnimatedField delay={1.0}>
                        <FormControl>
                          <Checkbox
                            name="marketingConsent"
                            isChecked={formData.marketingConsent}
                            onChange={(e) => handleInputChange(e as any)}
                            colorScheme="blue"
                            size="lg"
                            borderColor="rgba(59, 130, 246, 0.3)"
                          >
                            <Text color="gray.300" fontSize="sm">
                              I would like to receive marketing communications (optional)
                            </Text>
                          </Checkbox>
                        </FormControl>
                      </AnimatedField>
                    </VStack>

                    {/* Enhanced Submit Button */}
                    <AnimatedField delay={1.1}>
                      <Button
                        type="submit"
                        size="lg"
                        w="full"
                        bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                        color="white"
                        fontWeight="bold"
                        borderRadius="xl"
                        isLoading={isLoading}
                        loadingText="Creating Account..."
                        rightIcon={isLoading ? <Spinner size="sm" /> : <FaUserPlus />}
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
                        disabled={isLoading || !isFormValid}
                      >
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                      </Button>
                    </AnimatedField>

                    <Divider borderColor="rgba(59, 130, 246, 0.2)" />

                    {/* Additional Options */}
                    <AnimatedField delay={1.2}>
                      <VStack spacing={3} w="full">
                        <HStack spacing={2} justify="center">
                          <Text color="gray.300" fontSize="sm">
                            Already have an account?
                          </Text>
                          <ChakraLink
                            as={NextLink}
                            href="/customer/login"
                            color="neon.400"
                            fontWeight="semibold"
                            _hover={{ color: 'neon.300', textDecoration: 'underline' }}
                            transition="all 0.2s"
                          >
                            Sign In
                          </ChakraLink>
                        </HStack>

                        <Divider borderColor="rgba(59, 130, 246, 0.2)" />

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
                    </AnimatedField>
                  </VStack>
                </form>
              </CardBody>
            </Card>
          </AnimatedField>
        </VStack>
      </Container>
    </Box>
  );
}
