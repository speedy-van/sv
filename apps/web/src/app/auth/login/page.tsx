'use client';
import { signIn, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Flex,
  Heading,
  Text,
  Stack,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Button,
  Link as ChakraLink,
  Alert,
  AlertIcon,
  useToast,
} from '@chakra-ui/react';
import { keyframes as emotionKeyframes } from '@emotion/react';
import NextLink from 'next/link';
import { ROUTES } from '@/lib/routing';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status, update } = useSession();
  const toast = useToast();
  
  // Get role from URL parameters
  const role = searchParams?.get('role');
  const isAdminLogin = role === 'admin';

  // Handle redirect after session is established
  useEffect(() => {
    if (session?.user && !isLoading) {
      const userRole = (session.user as any).role;
      switch (userRole) {
        case 'admin':
          router.push('/admin');
          break;
        case 'driver':
          router.push('/driver');
          break;
        case 'customer':
          router.push('/customer');
          break;
        default:
          router.push('/');
      }
    }
  }, [session, isLoading, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setIsLoading(true);

    try {
      const signInPromise = signIn('credentials', {
        redirect: false,
        email,
        password,
        role: role || undefined,
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SignIn timeout')), 10000)
      );

      const res = (await Promise.race([signInPromise, timeoutPromise])) as any;

      if (res?.ok) {
        try {
          await update();
        } catch {
          // ignore
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        toast({
          title: 'Signed in successfully',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } else {
        setErr('Invalid email or password');
      }
    } catch {
      setErr('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  // Loading state
  if (status === 'loading') {
    return (
      <Container maxW="6xl" py={{ base: 16, md: 24 }}>
        <Heading size="lg">Login</Heading>
        <Text mt={4}>Signing you in...</Text>
      </Container>
    );
  }

  // Animated background
  const moveGradient = emotionKeyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  `;

  const shimmer = emotionKeyframes`
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  `;

  return (
    <Box position="relative" minH="100vh" overflow="hidden">
      {/* Moving gradient background */}
      <Box
        position="absolute"
        inset={0}
        zIndex={0}
        bg="linear-gradient(120deg, rgba(5,10,18,1) 0%, rgba(7,13,23,1) 30%, rgba(10,20,35,1) 60%, rgba(7,13,23,1) 100%)"
      />
      <Box
        position="absolute"
        inset={0}
        zIndex={0}
        bg="linear-gradient(90deg, rgba(0,194,255,0.16), rgba(147,51,234,0.16), rgba(236,72,153,0.16), rgba(16,185,129,0.16))"
        style={{ backgroundSize: '300% 300%' }}
        animation={`${moveGradient} 18s ease-in-out infinite`}
        mixBlendMode="screen"
      />

    <Container maxW="6xl" py={{ base: 12, md: 24 }} position="relative" zIndex={1}>
      <Stack direction="row" spacing={10} align="stretch" flexWrap="wrap">
        {/* Brand / context */}
        <Box
          flex="1"
          bgGradient="linear(to-br, rgba(0,194,255,0.12), transparent)"
          border="1px solid"
          borderColor="whiteAlpha.200"
          rounded="xl"
          p={{ base: 8, md: 10 }}
          minW={{ base: '380px', md: '460px' }}
          maxW={{ base: '100%', md: '520px' }}
        >
          <Heading size="xl" color="primary.300">
            {isAdminLogin ? 'Admin Sign In' : 'Sign In'}
          </Heading>
          <Text mt={3} color="whiteAlpha.800" fontSize="md">
            Enter your credentials to access your dashboard.
          </Text>
          <Box mt={8} color="whiteAlpha.700" fontSize="sm">
            <Text fontWeight="semibold">Need help?</Text>
            <Text mt={1}>
              Email: support@speedy-van.co.uk
            </Text>
            <Text>Phone: 01202 129746</Text>
          </Box>
        </Box>

        {/* Form */}
        <Box
          as="form"
          onSubmit={onSubmit}
          flex="1"
          bg="rgba(7,13,23,0.75)"
          border="1px solid"
          borderColor="whiteAlpha.200"
          rounded="xl"
          p={{ base: 8, md: 10 }}
          boxShadow="0 8px 30px rgba(0,0,0,0.35)"
          minW={{ base: '380px', md: '520px' }}
          maxW={{ base: '100%', md: '560px' }}
        >
          <Heading size="lg">
            {isAdminLogin ? 'Welcome back, Admin' : 'Welcome back'}
          </Heading>
          <Text mt={1} color="whiteAlpha.700" fontSize="sm">
            Please sign in to continue
          </Text>

          {err && (
            <Alert status="error" mt={4} rounded="md">
              <AlertIcon />
              {err}
            </Alert>
          )}

          <FormControl mt={6} isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading}
              data-testid="email-input"
            />
          </FormControl>

          <FormControl mt={4} isRequired>
            <FormLabel>Password</FormLabel>
            <InputGroup>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Your password"
                disabled={isLoading}
                data-testid="password-input"
              />
              <InputRightElement width="4.5rem">
                <Button
                  h="1.75rem"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPassword(v => !v)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <Button
            type="submit"
            colorScheme="cyan"
            mt={8}
            w="full"
            isLoading={isLoading}
            loadingText="Signing in"
            data-testid="login-button"
          >
            Sign in
          </Button>

          <Flex mt={5} justify="space-between" align="center">
            <ChakraLink as={NextLink} href={ROUTES.FORGOT_PASSWORD}>
              Forgot password?
            </ChakraLink>
          </Flex>
        </Box>
      </Stack>

      <Box textAlign="center" mt={10}>
        <Text
          fontSize={{ base: 'xl', md: '3xl' }}
          fontWeight="extrabold"
          bgGradient="linear(to-r, cyan.300, purple.300, pink.300, teal.300)"
          bgClip="text"
          style={{ backgroundSize: '200% 100%' }}
          animation={`${shimmer} 5s linear infinite`}
          letterSpacing="wide"
        >
          Speedy Van Management System
        </Text>
      </Box>
    </Container>
    </Box>
  );
}
