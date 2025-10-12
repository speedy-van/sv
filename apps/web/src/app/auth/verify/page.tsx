'use client';

import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  Card,
  CardBody,
  useToast,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import NextLink from 'next/link';

export default function EmailVerificationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    'pending' | 'success' | 'error'
  >('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        setVerificationStatus('error');
        setErrorMessage(
          result.error || 'An error occurred during verification.'
        );
        toast({
          title: 'Verification failed',
          description: result.error || 'An error occurred during verification.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        setVerificationStatus('success');
        toast({
          title: 'Email verified!',
          description: 'Your email has been verified successfully.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      setVerificationStatus('error');
      setErrorMessage('An error occurred during verification.');
      toast({
        title: 'Verification failed',
        description: 'An error occurred during verification.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <Container maxW="md" py={12}>
        <VStack spacing={8}>
          <Box textAlign="center">
            <Heading size="lg" mb={2}>
              Invalid Verification Link
            </Heading>
            <Text color="gray.600">
              This email verification link is invalid or has expired.
            </Text>
          </Box>
          <Button as={NextLink} href="/" variant="primary" size="lg" w="full">
            Go to Home
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="md" py={12}>
      <VStack spacing={8}>
        <Box textAlign="center">
          <Heading size="lg" mb={2}>
            Email Verification
          </Heading>
          <Text color="gray.600">
            {verificationStatus === 'pending' &&
              'Verifying your email address...'}
            {verificationStatus === 'success' &&
              'Your email has been verified successfully!'}
            {verificationStatus === 'error' && 'Email verification failed.'}
          </Text>
        </Box>

        <Card w="full">
          <CardBody>
            {verificationStatus === 'pending' && (
              <VStack spacing={4}>
                <Alert status="info">
                  <AlertIcon />
                  Please wait while we verify your email address...
                </Alert>
                <Button
                  isLoading={isLoading}
                  loadingText="Verifying..."
                  variant="primary"
                  size="lg"
                  w="full"
                  isDisabled
                >
                  Verifying Email
                </Button>
              </VStack>
            )}

            {verificationStatus === 'success' && (
              <VStack spacing={4}>
                <Alert status="success">
                  <AlertIcon />
                  Your email has been verified successfully!
                </Alert>
                <Button
                  as={NextLink}
                  href="/"
                  variant="primary"
                  size="lg"
                  w="full"
                >
                  Continue to Home
                </Button>
              </VStack>
            )}

            {verificationStatus === 'error' && (
              <VStack spacing={4}>
                <Alert status="error">
                  <AlertIcon />
                  {errorMessage}
                </Alert>
                <Button
                  as={NextLink}
                  href="/"
                  variant="primary"
                  size="lg"
                  w="full"
                >
                  Go to Home
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/auth/forgot')}
                >
                  Need help? Contact support
                </Button>
              </VStack>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}
