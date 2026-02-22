'use client';

/**
 * Customer dashboard component
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Button,
  CardBody,
  Badge,
} from '@chakra-ui/react';
import { ROUTES } from '@/lib/routing';
import AppCard from '@/components/shared/AppCard';

interface CustomerDashboardProps {
  userId?: string;
}

export default function CustomerDashboard({ userId }: CustomerDashboardProps) {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalSpent: 0,
  });

  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    // In a real implementation, fetch data from API
    setStats({
      totalBookings: 12,
      activeBookings: 2,
      completedBookings: 10,
      totalSpent: 1250,
    });

    setRecentBookings([
      {
        id: '1',
        reference: 'SV-2024-001',
        status: 'completed',
        date: '2024-01-15',
        amount: 150,
        from: 'London',
        to: 'Manchester',
      },
      {
        id: '2',
        reference: 'SV-2024-002',
        status: 'in_progress',
        date: '2024-01-20',
        amount: 200,
        from: 'Birmingham',
        to: 'Liverpool',
      },
    ]);
  }, []);

  return (
    <VStack spacing={8} align="stretch">
      <Box>
        <Heading size="lg" mb={2}>
          Welcome to Your Dashboard
        </Heading>
        <Text color="text.secondary">
          Manage your bookings and track your moving services
        </Text>
      </Box>

      {/* Stats Grid */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={6}>
        <GridItem>
          <AppCard>
            <CardBody>
              <Stat>
                <StatLabel>Total Bookings</StatLabel>
                <StatNumber>{stats.totalBookings}</StatNumber>
                <StatHelpText>All time</StatHelpText>
              </Stat>
            </CardBody>
          </AppCard>
        </GridItem>

        <GridItem>
          <AppCard>
            <CardBody>
              <Stat>
                <StatLabel>Active Bookings</StatLabel>
                <StatNumber color="interactive.primary">{stats.activeBookings}</StatNumber>
                <StatHelpText>In progress</StatHelpText>
              </Stat>
            </CardBody>
          </AppCard>
        </GridItem>

        <GridItem>
          <AppCard>
            <CardBody>
              <Stat>
                <StatLabel>Completed</StatLabel>
                <StatNumber color="green.500">{stats.completedBookings}</StatNumber>
                <StatHelpText>Successfully delivered</StatHelpText>
              </Stat>
            </CardBody>
          </AppCard>
        </GridItem>

        <GridItem>
          <AppCard>
            <CardBody>
              <Stat>
                <StatLabel>Total Spent</StatLabel>
                <StatNumber>£{stats.totalSpent}</StatNumber>
                <StatHelpText>All time</StatHelpText>
              </Stat>
            </CardBody>
          </AppCard>
        </GridItem>
      </Grid>

      {/* Recent Bookings */}
      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading size="md">Recent Bookings</Heading>
          <Button as="a" href={ROUTES.CUSTOMER_ORDERS} colorScheme="primary" size="sm">
            View All
          </Button>
        </HStack>

        <VStack spacing={4} align="stretch">
          {recentBookings.map((booking) => (
            <AppCard key={booking.id} variantStyle="interactive">
              <CardBody>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold">{booking.reference}</Text>
                      <Text fontSize="sm" color="text.secondary">
                        {booking.from} → {booking.to}
                      </Text>
                      <Text fontSize="sm" color="text.tertiary">
                        {new Date(booking.date).toLocaleDateString()}
                      </Text>
                    </VStack>
                    
                    <VStack align="end" spacing={2}>
                      <Badge
                        colorScheme={
                          booking.status === 'completed' ? 'green' :
                          booking.status === 'in_progress' ? 'blue' : 'gray'
                        }
                      >
                        {booking.status.replace('_', ' ')}
                      </Badge>
                      <Text fontWeight="bold">£{booking.amount}</Text>
                    </VStack>
                  </HStack>
                  
                  {/* Action Buttons */}
                  <HStack spacing={2} justify="flex-end">
                    <Button
                      as="a"
                      href={`/api/customer/orders/${booking.reference}`}
                      size="sm"
                      variant="outline"
                    >
                      View Details
                    </Button>
                    {(booking.status === 'in_progress' || booking.status === 'assigned' || booking.status === 'confirmed') && (
                      <Button
                        as="a"
                        href={`/tracking/${booking.reference}`}
                        size="sm"
                        colorScheme="blue"
                        leftIcon={<span>🚚</span>}
                      >
                        Live Tracking
                      </Button>
                    )}
                  </HStack>
                </VStack>
              </CardBody>
            </AppCard>
          ))}
        </VStack>
      </Box>

      {/* Quick Actions */}
      <Box>
        <Heading size="md" mb={4}>Quick Actions</Heading>
        <HStack spacing={4}>
          <Button as="a" href={ROUTES.SHARED.BOOKING_LUXURY} colorScheme="primary">
            New Booking
          </Button>
          <Button as="a" href={ROUTES.CUSTOMER_ORDERS} variant="outline">
            View Orders
          </Button>
          <Button as="a" href={ROUTES.CUSTOMER_PROFILE} variant="outline">
            Edit Profile
          </Button>
        </HStack>
      </Box>
    </VStack>
  );
}