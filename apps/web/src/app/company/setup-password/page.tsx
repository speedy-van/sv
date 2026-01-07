'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Alert,
  AlertIcon,
  Progress,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

function SetupPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  
  const [token, setToken] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const tokenParam = searchParams?.get('token');
    if (!tokenParam) {
      toast({
        title: 'Invalid Link',
        description: 'No setup token found. Please use the link from your email.',
        status: 'error',
        duration: 5000,
      });
      router.push('/company/login');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, router, toast]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const getPasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (pwd.length >= 12) strength += 25;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 12.5;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 12.5;
    return Math.min(strength, 100);
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const newErrors: Record<string, string> = {};
    
    const passwordError = validatePassword(password);
    if (passwordError) {
      newErrors.password = passwordError;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/company/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success!',
          description: 'Your password has been set. Redirecting to dashboard...',
          status: 'success',
          duration: 3000,
        });

        // Auto-login and redirect
        setTimeout(() => {
          router.push('/company/dashboard');
        }, 1000);
      } else {
        toast({
          title: 'Setup Failed',
          description: data.error || 'Failed to setup password',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" py={20}>
      <Container maxW="md">
        <VStack spacing={8} bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <Box textAlign="center">
            <Heading size="lg" mb={2}>Set Your Password</Heading>
            <Text color="gray.600">
              Welcome to Speedy Van Business Portal
            </Text>
          </Box>

          <Alert status="info" borderRadius="md">
            <AlertIcon />
            Create a strong password to secure your company account
          </Alert>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.password}>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    size="lg"
                  />
                  <InputRightElement h="full">
                    <IconButton
                      aria-label="Toggle password visibility"
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                      variant="ghost"
                    />
                  </InputRightElement>
                </InputGroup>
                {password && (
                  <Box mt={2}>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Password strength: {passwordStrength}%
                    </Text>
                    <Progress
                      value={passwordStrength}
                      size="sm"
                      colorScheme={
                        passwordStrength < 50
                          ? 'red'
                          : passwordStrength < 75
                          ? 'yellow'
                          : 'green'
                      }
                      borderRadius="full"
                    />
                  </Box>
                )}
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.confirmPassword}>
                <FormLabel>Confirm Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    size="lg"
                  />
                  <InputRightElement h="full">
                    <IconButton
                      aria-label="Toggle password visibility"
                      icon={showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      variant="ghost"
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                isLoading={loading}
                loadingText="Setting up..."
              >
                Set Password & Continue
              </Button>

              <Text fontSize="sm" color="gray.500" textAlign="center">
                Password must be at least 8 characters and include uppercase,
                lowercase, and numbers
              </Text>
            </VStack>
          </form>
        </VStack>
      </Container>
    </Box>
  );
}

export default function CompanyPasswordSetupPage() {
  return (
    <Suspense fallback={
      <Container maxW="md" py={20}>
        <VStack spacing={8}>
          <Progress size="xs" isIndeterminate colorScheme="blue" width="full" />
          <Text>Loading setup form...</Text>
        </VStack>
      </Container>
    }>
      <SetupPasswordContent />
    </Suspense>
  );
}
