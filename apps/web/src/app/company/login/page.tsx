'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Link as ChakraLink,
  Divider,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import Link from 'next/link';

export default function CompanyLoginPage() {
  const router = useRouter();
  const toast = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/company/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Welcome back!',
          description: `Logged in as ${data.data.user.name}`,
          status: 'success',
          duration: 3000,
        });

        router.push('/company/dashboard');
      } else {
        toast({
          title: 'Login Failed',
          description: data.error || 'Invalid email or password',
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
            <Heading size="xl" mb={2}>Business Portal</Heading>
            <Text color="gray.600">
              Sign in to your company account
            </Text>
          </Box>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@company.com"
                  size="lg"
                  autoComplete="email"
                />
                <FormErrorMessage>{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.password}>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    size="lg"
                    autoComplete="current-password"
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
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                isLoading={loading}
                loadingText="Signing in..."
              >
                Sign In
              </Button>

              <Box width="full">
                <Divider my={4} />
                <Text textAlign="center" fontSize="sm" color="gray.600">
                  Need help?{' '}
                  <ChakraLink as={Link} href="mailto:support@speedy-van.co.uk" color="blue.500">
                    Contact Support
                  </ChakraLink>
                </Text>
              </Box>
            </VStack>
          </form>
        </VStack>

        <Text textAlign="center" mt={4} fontSize="sm" color="gray.500">
          Looking for personal account?{' '}
          <ChakraLink as={Link} href="/login" color="blue.500">
            Sign in here
          </ChakraLink>
        </Text>
      </Container>
    </Box>
  );
}
