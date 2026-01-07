'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Grid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Progress,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { AddIcon, WarningIcon } from '@chakra-ui/icons';
import Link from 'next/link';

interface UsageStats {
  currentMonth: {
    allowed: boolean;
    current: number;
    limit: number;
    monthKey: string;
    message: string;
  };
  history: Array<{
    monthKey: string;
    orderCount: number;
    orderLimit: number;
    utilizationPercent: number;
  }>;
}

export default function CompanyDashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const fetchUsageStats = async () => {
    try {
      const response = await fetch('/api/company/usage');
      const data = await response.json();

      if (data.success) {
        setUsageStats(data.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load usage statistics',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const utilizationPercent = usageStats?.currentMonth.limit
    ? Math.round((usageStats.currentMonth.current / usageStats.currentMonth.limit) * 100)
    : 0;

  const isNearLimit = utilizationPercent >= 80;
  const isAtLimit = !usageStats?.currentMonth.allowed;

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <Heading size="lg">Company Dashboard</Heading>
            <Button
              as={Link}
              href="/company/dashboard/bookings/new"
              leftIcon={<AddIcon />}
              colorScheme="blue"
              isDisabled={isAtLimit}
            >
              New Booking
            </Button>
          </HStack>
        </Container>
      </Box>

      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Order Limit Alert */}
          {isAtLimit && usageStats && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Order Limit Reached</AlertTitle>
                <AlertDescription>
                  You have used all {usageStats.currentMonth.limit} of your monthly bookings.
                  Limit resets on the 1st of next month.
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {isNearLimit && !isAtLimit && (
            <Alert status="warning" borderRadius="md">
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>Approaching Order Limit</AlertTitle>
                <AlertDescription>
                  You have used {usageStats?.currentMonth.current} of {usageStats?.currentMonth.limit} bookings this month.
                </AlertDescription>
              </Box>
            </Alert>
          )}

          {/* Stats Cards */}
          <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Bookings This Month</StatLabel>
                  <StatNumber>{usageStats?.currentMonth.current || 0}</StatNumber>
                  <StatHelpText>
                    of {usageStats?.currentMonth.limit || 0} allowed
                  </StatHelpText>
                  <Progress
                    value={utilizationPercent}
                    size="sm"
                    colorScheme={isAtLimit ? 'red' : isNearLimit ? 'yellow' : 'green'}
                    mt={2}
                    borderRadius="full"
                  />
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Outstanding Invoices</StatLabel>
                  <StatNumber>£0.00</StatNumber>
                  <StatHelpText>0 invoices pending</StatHelpText>
                </Stat>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Current Balance</StatLabel>
                  <StatNumber>£0.00</StatNumber>
                  <StatHelpText>Credit available</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </Grid>

          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Recent Bookings</Heading>
                <Button as={Link} href="/company/dashboard/bookings" size="sm" variant="link" colorScheme="blue">
                  View All
                </Button>
              </HStack>
            </CardHeader>
            <CardBody>
              <Text color="gray.500">No recent bookings</Text>
            </CardBody>
          </Card>

          {/* Usage History */}
          {usageStats?.history && usageStats.history.length > 0 && (
            <Card>
              <CardHeader>
                <Heading size="md">Usage History</Heading>
              </CardHeader>
              <CardBody>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Month</Th>
                      <Th isNumeric>Orders</Th>
                      <Th isNumeric>Limit</Th>
                      <Th isNumeric>Utilization</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {usageStats.history.map((month) => (
                      <Tr key={month.monthKey}>
                        <Td fontWeight="medium">{month.monthKey}</Td>
                        <Td isNumeric>{month.orderCount}</Td>
                        <Td isNumeric>{month.orderLimit}</Td>
                        <Td isNumeric>
                          <Badge
                            colorScheme={
                              month.utilizationPercent >= 100
                                ? 'red'
                                : month.utilizationPercent >= 80
                                ? 'yellow'
                                : 'green'
                            }
                          >
                            {month.utilizationPercent}%
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
