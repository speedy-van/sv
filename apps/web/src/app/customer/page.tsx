import React from 'react';
import { Container, Heading, Text, Box, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, VStack, HStack, Button, Badge, Card, CardBody, CardHeader } from '@chakra-ui/react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routing';

export default async function CustomerDashboard() {
  // This would normally fetch data from the database
  // For now, we'll use mock data
  const stats = {
    totalBookings: 12,
    completedBookings: 8,
    pendingBookings: 2,
    totalSpent: 850.00,
  };

  const recentBookings = [
    { id: '1', from: 'London', to: 'Manchester', status: 'completed', amount: 85.00, date: '2024-01-15' },
    { id: '2', from: 'Birmingham', to: 'Leeds', status: 'in_progress', amount: 95.00, date: '2024-01-20' },
    { id: '3', from: 'Liverpool', to: 'Newcastle', status: 'pending', amount: 120.00, date: '2024-01-25' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in_progress': return 'blue';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Customer Dashboard
          </Heading>
          <Text color="gray.600">
            Welcome back! Here's your booking history and upcoming moves.
          </Text>
        </Box>

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Bookings</StatLabel>
                <StatNumber>{stats.totalBookings}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  33.33%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Completed Moves</StatLabel>
                <StatNumber>{stats.completedBookings}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  14.3%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Pending Bookings</StatLabel>
                <StatNumber>{stats.pendingBookings}</StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" />
                  50%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Spent</StatLabel>
                <StatNumber>£{stats.totalSpent.toFixed(2)}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  25%
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Recent Bookings */}
        <Box>
          <HStack justify="space-between" mb={6}>
            <Heading size="md">Recent Bookings</Heading>
            <Link href={ROUTES.CUSTOMER.BOOKINGS}>
              <Button size="sm" colorScheme="blue" variant="outline">
                View All Bookings
              </Button>
            </Link>
          </HStack>

          <VStack spacing={4} align="stretch">
            {recentBookings.map((booking) => (
              <Card key={booking.id}>
                <CardBody>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">
                        {booking.from} → {booking.to}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {new Date(booking.date).toLocaleDateString()}
                      </Text>
                    </VStack>
                    <VStack align="end" spacing={1}>
                      <Badge colorScheme={getStatusColor(booking.status)}>
                        {booking.status.replace('_', ' ')}
                      </Badge>
                      <Text fontWeight="medium">£{booking.amount.toFixed(2)}</Text>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
            ))}
          </VStack>
        </Box>

        {/* Quick Actions */}
        <Box>
          <Heading size="md" mb={4}>Quick Actions</Heading>
          <HStack spacing={4}>
            <Link href={ROUTES.SHARED.BOOKING_LUXURY}>
              <Button colorScheme="blue">Book New Move</Button>
            </Link>
            <Link href={ROUTES.CUSTOMER.BOOKINGS}>
              <Button variant="outline">View Bookings</Button>
            </Link>
            <Link href={ROUTES.CUSTOMER.PROFILE}>
              <Button variant="outline">Update Profile</Button>
            </Link>
          </HStack>
        </Box>
      </VStack>
    </Container>
  );
}
