'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Card,
  CardBody,
  Divider,
  Spinner,
  Center,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface Order {
  id: string;
  code: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  vehicleType: string;
  totalAmount: number;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/customer/orders');
    } else if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, router]);

  async function fetchOrders() {
    try {
      const res = await fetch('/api/customer/orders');
      if (res.status === 401) {
        router.push('/auth/signin?callbackUrl=/customer/orders');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'yellow',
      confirmed: 'blue',
      assigned: 'purple',
      'in-transit': 'orange',
      delivered: 'green',
      cancelled: 'red',
    };
    return colors[status] || 'gray';
  };

  // Show loading while checking authentication
  if (status === 'loading' || isLoading) {
    return (
      <Center h="400px">
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color="gray.600">
            {status === 'loading' ? 'Checking authentication...' : 'Loading orders...'}
          </Text>
        </VStack>
      </Center>
    );
  }

  // Show message if not authenticated (shouldn't reach here due to redirect)
  if (status === 'unauthenticated') {
    return (
      <Container maxW="container.md" py={8}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please sign in to view your orders.
            </AlertDescription>
          </Box>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Heading size="lg">My Orders</Heading>
          <Button colorScheme="brand" onClick={() => router.push('/booking-luxury')}>
            New Order
          </Button>
        </HStack>

        {orders.length === 0 ? (
          <Card>
            <CardBody>
              <Center py={12}>
                <VStack spacing={4}>
                  <Text fontSize="xl" color="gray.500">
                    No orders yet
                  </Text>
                  <Button colorScheme="brand" onClick={() => router.push('/booking-luxury')}>
                    Create New Order
                  </Button>
                </VStack>
              </Center>
            </CardBody>
          </Card>
        ) : (
          <VStack align="stretch" spacing={4}>
            {orders.map((order) => (
              <Card
                key={order.id}
                cursor="pointer"
                _hover={{ shadow: 'md' }}
                onClick={() => router.push(`/customer/orders/${order.code}`)}
              >
                <CardBody>
                  <VStack align="stretch" spacing={3}>
                      <HStack justify="space-between">
                        <HStack spacing={3}>
                          <Text fontWeight="bold">#{order.code}</Text>
                          <Badge colorScheme={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </HStack>
                        <Text fontWeight="bold" color="brand.600">
                          SAR {order.totalAmount}
                        </Text>
                      </HStack>                    <Divider />

                    <VStack align="stretch" spacing={2} fontSize="sm">
                      <HStack>
                        <Text fontWeight="semibold" minW="80px">From:</Text>
                        <Text color="gray.600">{order.pickupAddress}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="semibold" minW="80px">To:</Text>
                        <Text color="gray.600">{order.deliveryAddress}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="semibold" minW="80px">Vehicle:</Text>
                        <Text color="gray.600">{order.vehicleType}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="semibold" minW="80px">Date:</Text>
                        <Text color="gray.600">
                          {new Date(order.createdAt).toLocaleDateString('en-US')}
                        </Text>
                      </HStack>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        )}
      </VStack>
    </Container>
  );
}
