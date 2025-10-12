'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  useToast,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { FaSignOutAlt, FaCheckCircle } from 'react-icons/fa';

export default function DriverLogoutPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    handleLogout();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setError('');

      // Call the logout API to log the event
      try {
        const response = await fetch('/api/driver/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn('Logout API call failed, but continuing with sign out');
        }
      } catch (apiError) {
        console.warn('Logout API error:', apiError);
        // Continue with sign out even if API fails
      }

      // Sign out from NextAuth
      await signOut({
        redirect: false,
        callbackUrl: '/driver-auth'
      });

      // Show success message
      toast({
        title: 'Logged Out Successfully',
        description: 'You have been signed out of the driver portal.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Redirect to login page
      setTimeout(() => {
        router.push('/driver-auth');
      }, 1500);

    } catch (error) {
      console.error('Driver logout error:', error);
      setError('An error occurred during logout. Please try again.');
      
      toast({
        title: 'Logout Error',
        description: 'Failed to sign out properly. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleManualRedirect = () => {
    router.push('/driver-auth');
  };

  if (error) {
    return (
      <Box minH="100vh" bg="gray.50" display="flex" alignItems="center" justifyContent="center" px={4}>
        <Container maxW="md">
          <VStack spacing={6} textAlign="center">
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              {error}
            </Alert>
            
            <Button
              colorScheme="blue"
              onClick={handleManualRedirect}
              size={{ base: "md", md: "lg" }}
              w={{ base: "full", md: "auto" }}
            >
              Go to Login Page
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
          {isLoggingOut ? (
            <>
              <Spinner size="xl" color="blue.500" thickness="4px" />
              <VStack spacing={2}>
                <Heading size={{ base: "md", md: "lg" }} color="gray.700">
                  Signing Out...
                </Heading>
                <Text color="gray.600" fontSize={{ base: "sm", md: "md" }} px={4}>
                  Please wait while we sign you out of the driver portal.
                </Text>
              </VStack>
            </>
          ) : (
            <>
              <Box color="green.500" fontSize={{ base: "3xl", md: "4xl" }}>
                <FaCheckCircle />
              </Box>
              <VStack spacing={2}>
                <Heading size={{ base: "md", md: "lg" }} color="gray.700">
                  Successfully Signed Out
                </Heading>
                <Text color="gray.600" fontSize={{ base: "sm", md: "md" }} px={4}>
                  You have been signed out of the driver portal.
                </Text>
              </VStack>
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
