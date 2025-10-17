'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Card,
  CardBody,
  Icon,
  useColorModeValue,
  HStack,
  Divider,
  Spinner,
} from '@chakra-ui/react';
import {
  FiShield,
  FiUser,
  FiTruck,
  FiAlertTriangle,
  FiLock,
  FiClock,
  FiArrowLeft,
  FiHome,
} from 'react-icons/fi';

interface ErrorDetails {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  colorScheme: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant: 'solid' | 'outline' | 'ghost';
    colorScheme: string;
    icon: React.ComponentType<any>;
  }>;
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorDetails, setErrorDetails] = useState<ErrorDetails | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    const error = searchParams?.get('error');
    const errorMap: Record<string, ErrorDetails> = {
      AccountInactive: {
        title: 'Account Inactive',
        description:
          'Your account has been deactivated. This may be due to a rejected driver application or administrative action. Please contact support for assistance.',
        icon: FiLock,
        colorScheme: 'red',
        actions: [
          {
            label: 'Contact Support',
            onClick: () => router.push('/contact'),
            variant: 'solid',
            colorScheme: 'red',
            icon: FiAlertTriangle,
          },
          {
            label: 'Go Home',
            onClick: () => router.push('/'),
            variant: 'outline',
            colorScheme: 'gray',
            icon: FiHome,
          },
        ],
      },
      InsufficientPermissions: {
        title: 'Insufficient Permissions',
        description:
          'You do not have the required permissions to access this area. Only administrators can access the admin portal.',
        icon: FiShield,
        colorScheme: 'orange',
        actions: [
          {
            label: 'Go to Customer Portal',
            onClick: () => router.push('/customer'),
            variant: 'solid',
            colorScheme: 'blue',
            icon: FiUser,
          },
          {
            label: 'Go Home',
            onClick: () => router.push('/'),
            variant: 'outline',
            colorScheme: 'gray',
            icon: FiHome,
          },
        ],
      },
      DriverAccessRequired: {
        title: 'Driver Access Required',
        description:
          'This area is restricted to approved drivers only. You must have a driver account to access the driver portal.',
        icon: FiTruck,
        colorScheme: 'blue',
        actions: [
          {
            label: 'Apply to be a Driver',
            onClick: () => router.push('/driver-application'),
            variant: 'solid',
            colorScheme: 'blue',
            icon: FiTruck,
          },
          {
            label: 'Go to Customer Portal',
            onClick: () => router.push('/customer'),
            variant: 'outline',
            colorScheme: 'gray',
            icon: FiUser,
          },
          {
            label: 'Go Home',
            onClick: () => router.push('/'),
            variant: 'ghost',
            colorScheme: 'gray',
            icon: FiHome,
          },
        ],
      },
      DriverNotApproved: {
        title: 'Driver Application Pending',
        description:
          'Your driver application is still under review. You will be notified once your application has been approved by our team.',
        icon: FiClock,
        colorScheme: 'yellow',
        actions: [
          {
            label: 'Check Application Status',
            onClick: () => router.push('/driver-application'),
            variant: 'solid',
            colorScheme: 'yellow',
            icon: FiClock,
          },
          {
            label: 'Go to Customer Portal',
            onClick: () => router.push('/customer'),
            variant: 'outline',
            colorScheme: 'gray',
            icon: FiUser,
          },
          {
            label: 'Go Home',
            onClick: () => router.push('/'),
            variant: 'ghost',
            colorScheme: 'gray',
            icon: FiHome,
          },
        ],
      },
      ApplicationNotApproved: {
        title: 'Driver Application Not Approved',
        description:
          'Your driver application has not been approved. You may need to provide additional information or your application may have been rejected.',
        icon: FiAlertTriangle,
        colorScheme: 'red',
        actions: [
          {
            label: 'Contact Support',
            onClick: () => router.push('/contact'),
            variant: 'solid',
            colorScheme: 'red',
            icon: FiAlertTriangle,
          },
          {
            label: 'Go to Customer Portal',
            onClick: () => router.push('/customer'),
            variant: 'outline',
            colorScheme: 'gray',
            icon: FiUser,
          },
          {
            label: 'Go Home',
            onClick: () => router.push('/'),
            variant: 'ghost',
            colorScheme: 'gray',
            icon: FiHome,
          },
        ],
      },
      CustomerAccessRequired: {
        title: 'Customer Access Required',
        description:
          'This area is restricted to customers only. You must have a customer account to access the customer portal.',
        icon: FiUser,
        colorScheme: 'green',
        actions: [
          {
            label: 'Sign In as Customer',
            onClick: () => router.push('/auth/signin'),
            variant: 'solid',
            colorScheme: 'green',
            icon: FiUser,
          },
          {
            label: 'Go Home',
            onClick: () => router.push('/'),
            variant: 'outline',
            colorScheme: 'gray',
            icon: FiHome,
          },
        ],
      },
      PendingDriverApplication: {
        title: 'Driver Application in Progress',
        description:
          'You have a pending driver application. While your application is under review, you cannot access the customer portal. Please wait for approval or contact support.',
        icon: FiClock,
        colorScheme: 'yellow',
        actions: [
          {
            label: 'Contact Support',
            onClick: () => router.push('/contact'),
            variant: 'solid',
            colorScheme: 'yellow',
            icon: FiClock,
          },
          {
            label: 'Go Home',
            onClick: () => router.push('/'),
            variant: 'outline',
            colorScheme: 'gray',
            icon: FiHome,
          },
        ],
      },
      default: {
        title: 'Authentication Error',
        description:
          'An unexpected error occurred during authentication. Please try signing in again or contact support if the problem persists.',
        icon: FiAlertTriangle,
        colorScheme: 'red',
        actions: [
          {
            label: 'Try Again',
            onClick: () => router.push('/auth/signin'),
            variant: 'solid',
            colorScheme: 'blue',
            icon: FiArrowLeft,
          },
          {
            label: 'Contact Support',
            onClick: () => router.push('/contact'),
            variant: 'outline',
            colorScheme: 'red',
            icon: FiAlertTriangle,
          },
          {
            label: 'Go Home',
            onClick: () => router.push('/'),
            variant: 'ghost',
            colorScheme: 'gray',
            icon: FiHome,
          },
        ],
      },
    };

    setErrorDetails(errorMap[error || ''] || errorMap.default);
  }, [searchParams, router]);

  if (!errorDetails) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6}>
          <Spinner size="xl" />
          <Text>Loading error details...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} py={8}>
      <Container maxW="container.md">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Box textAlign="center">
            <VStack spacing={4}>
              <Box
                p={4}
                borderRadius="full"
                bg={`${errorDetails.colorScheme}.100`}
                color={`${errorDetails.colorScheme}.600`}
                display="inline-block"
              >
                <Icon as={errorDetails.icon} boxSize={8} />
              </Box>
              <Heading size="lg" color={`${errorDetails.colorScheme}.600`}>
                {errorDetails.title}
              </Heading>
            </VStack>
          </Box>

          {/* Error Card */}
          <Card bg={bgColor} border={`1px solid ${borderColor}`} shadow="lg">
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Alert
                  status={
                    errorDetails.colorScheme === 'red'
                      ? 'error'
                      : errorDetails.colorScheme === 'orange'
                        ? 'warning'
                        : 'info'
                  }
                  borderRadius="md"
                >
                  <AlertIcon />
                  <Box>
                    <AlertTitle>{errorDetails.title}</AlertTitle>
                    <AlertDescription mt={2}>
                      {errorDetails.description}
                    </AlertDescription>
                  </Box>
                </Alert>

                <Divider />

                {/* Actions */}
                <VStack spacing={4} align="stretch">
                  <Text fontWeight="medium" color="gray.700">
                    What would you like to do?
                  </Text>

                  <VStack spacing={3} align="stretch">
                    {errorDetails.actions.map((action, index) => (
                      <Button
                        key={index}
                        onClick={action.onClick}
                        variant={action.variant}
                        colorScheme={action.colorScheme}
                        size="lg"
                        leftIcon={<Icon as={action.icon} />}
                        justifyContent="flex-start"
                        w="100%"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </VStack>
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          {/* Help Section */}
          <Card bg={bgColor} border={`1px solid ${borderColor}`}>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <HStack>
                  <Icon as={FiAlertTriangle} color="orange.500" />
                  <Text fontWeight="medium" color="gray.700">
                    Need Help?
                  </Text>
                </HStack>

                <Text fontSize="sm" color="gray.600" lineHeight="tall">
                  If you're experiencing issues or have questions about your
                  account access, our support team is here to help. You can
                  contact us through our support portal or by emailing
                  support@speedy-van.co.uk.
                </Text>

                <HStack spacing={4}>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="blue"
                    onClick={() => router.push('/contact')}
                  >
                    Contact Support
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    colorScheme="gray"
                    onClick={() => router.push('/help')}
                  >
                    Help Center
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </Container>
    </Box>
  );
}
