'use client';

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
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast({
          title: 'Error',
          description: result.error || 'An error occurred. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } else {
        setSuccess(true);
        toast({
          title: 'Success',
          description: 'Your password has been reset successfully!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred. Please try again.',
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
              Invalid Reset Link
            </Heading>
            <Text color="gray.600">
              This password reset link is invalid or has expired.
            </Text>
          </Box>
          <Button
            as={NextLink}
            href="/auth/forgot"
            variant="primary"
            size="lg"
            w="full"
          >
            Request New Reset Link
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
            Set New Password
          </Heading>
          <Text color="gray.600">Enter your new password below</Text>
        </Box>

        <Card w="full">
          <CardBody>
            {success ? (
              <VStack spacing={4}>
                <Alert status="success">
                  <AlertIcon />
                  Your password has been reset successfully!
                </Alert>
                <Button
                  as={NextLink}
                  href="/"
                  variant="primary"
                  size="lg"
                  w="full"
                >
                  Sign In
                </Button>
              </VStack>
            ) : (
              <Box as="form" onSubmit={handleSubmit(onSubmit)}>
                <VStack spacing={4}>
                  <FormControl isInvalid={!!errors.password}>
                    <FormLabel>New Password</FormLabel>
                    <Input
                      type="password"
                      placeholder="Enter your new password"
                      {...register('password')}
                    />
                    {errors.password && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {errors.password.message}
                      </Text>
                    )}
                  </FormControl>

                  <FormControl isInvalid={!!errors.confirmPassword}>
                    <FormLabel>Confirm Password</FormLabel>
                    <Input
                      type="password"
                      placeholder="Confirm your new password"
                      {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && (
                      <Text color="red.500" fontSize="sm" mt={1}>
                        {errors.confirmPassword.message}
                      </Text>
                    )}
                  </FormControl>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    w="full"
                    isLoading={isLoading}
                    loadingText="Resetting password..."
                  >
                    Reset Password
                  </Button>
                </VStack>
              </Box>
            )}
          </CardBody>
        </Card>

        <Text fontSize="sm" color="gray.500" textAlign="center">
          Remember your password?{' '}
          <ChakraLink as={NextLink} href="/" color="teal.500">
            Sign in here
          </ChakraLink>
        </Text>
      </VStack>
    </Container>
  );
}
