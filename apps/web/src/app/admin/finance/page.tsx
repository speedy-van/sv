'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  Badge,
  Card,
  CardBody,
  Button,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider,
  Select,
  Input,
  HStack as ChakraHStack,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import LoadingSpinner from '@/components/admin/LoadingSpinner';
import {
  FiDollarSign,
  FiFileText,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiDownload,
  FiPlus,
  FiSearch,
  FiCalendar,
  FiFilter,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

interface FinanceData {
  summary: {
    totalRevenue: number;
    totalInvoices: number;
    pendingRevenue: number;
    pendingInvoices: number;
    totalRefunds: number;
    refundCount: number;
    totalPayouts: number;
    payoutCount: number;
  };
  earnings: {
    baseAmount: number;
    surgeAmount: number;
    tipAmount: number;
    feeAmount: number;
    netAmount: number;
  };
  recentActivity: {
    invoices: any[];
    refunds: any[];
  };
  topDrivers: any[];
}

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30d');
  const toast = useToast();

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/finance?range=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch finance data');
      }
      const financeData = await response.json();
      setData(financeData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load finance data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, [period]);

  const formatCurrency = (totalGBP: number) => {
    return `£${(totalGBP / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'processed':
        return 'blue';
      case 'failed':
        return 'red';
      case 'refunded':
        return 'orange';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Box p={6}>
        <LoadingSpinner message="Loading finance data..." />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error" mb={4}>
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchFinanceData} colorScheme="blue">
          Try Again
        </Button>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box p={6}>
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            No finance data is currently available.
          </AlertDescription>
        </Alert>
        <Button onClick={fetchFinanceData} colorScheme="blue">
          Refresh Data
        </Button>
      </Box>
    );
  }

  // Validate data structure to prevent runtime errors
  if (
    !data.recentActivity ||
    !Array.isArray(data.recentActivity.invoices) ||
    !Array.isArray(data.recentActivity.refunds)
  ) {
    return (
      <Box p={6}>
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <AlertTitle>Data Structure Error</AlertTitle>
          <AlertDescription>
            The finance data structure is incomplete. Please refresh the page.
          </AlertDescription>
        </Alert>
        <Button onClick={fetchFinanceData} colorScheme="blue">
          Refresh Data
        </Button>
      </Box>
    );
  }

  if (!Array.isArray(data.topDrivers)) {
    return (
      <Box p={6}>
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <AlertTitle>Data Structure Error</AlertTitle>
          <AlertDescription>
            Driver data is missing. Please refresh the page.
          </AlertDescription>
        </Alert>
        <Button onClick={fetchFinanceData} colorScheme="blue">
          Refresh Data
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">Finance</Heading>
          <Text color="gray.600">Financial management and reporting</Text>
        </VStack>
        <HStack spacing={3}>
          <Select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            size="sm"
            width="120px"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </Select>
          <Button leftIcon={<FiDownload />} variant="outline" size="sm">
            Export Reports
          </Button>
          <Button leftIcon={<FiPlus />} colorScheme="blue" size="sm">
            Create Invoice
          </Button>
        </HStack>
      </HStack>

      {/* Stats Row */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 6 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Revenue</StatLabel>
              <StatNumber>
                {formatCurrency(data.summary.totalRevenue)}
              </StatNumber>
              <StatHelpText>
                <FiTrendingUp
                  style={{ display: 'inline', marginRight: '4px' }}
                />
                {data.summary.totalInvoices} invoices
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Pending Invoices</StatLabel>
              <StatNumber>
                {formatCurrency(data.summary.pendingRevenue)}
              </StatNumber>
              <StatHelpText>
                <FiFileText style={{ display: 'inline', marginRight: '4px' }} />
                {data.summary.pendingInvoices} invoices
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Refunds</StatLabel>
              <StatNumber>
                {formatCurrency(data.summary.totalRefunds)}
              </StatNumber>
              <StatHelpText>
                <FiRefreshCw
                  style={{ display: 'inline', marginRight: '4px' }}
                />
                {data.summary.refundCount} refunds
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Pending Payouts</StatLabel>
              <StatNumber>
                {formatCurrency(data.summary.totalPayouts)}
              </StatNumber>
              <StatHelpText>
                <FiDollarSign
                  style={{ display: 'inline', marginRight: '4px' }}
                />
                {data.summary.payoutCount} payouts
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Driver Earnings</StatLabel>
              <StatNumber>{formatCurrency(data.earnings.netAmount)}</StatNumber>
              <StatHelpText>
                <FiTrendingUp
                  style={{ display: 'inline', marginRight: '4px' }}
                />
                Net earnings
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Platform Margin</StatLabel>
              <StatNumber>
                {formatCurrency(
                  data.summary.totalRevenue - data.earnings.netAmount
                )}
              </StatNumber>
              <StatHelpText>
                <FiDollarSign
                  style={{ display: 'inline', marginRight: '4px' }}
                />
                Revenue - Payouts
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Tabs>
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Invoices</Tab>
          <Tab>Refunds</Tab>
          <Tab>Payouts</Tab>
          <Tab>Ledger</Tab>
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
              {/* Recent Invoices */}
              <Card>
                <CardBody>
                  <HStack justify="space-between" mb={4}>
                    <Heading size="md">Recent Invoices</Heading>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        (window.location.href = '/admin/finance/invoices')
                      }
                    >
                      View All
                    </Button>
                  </HStack>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Ref</Th>
                        <Th>Customer</Th>
                        <Th>Amount</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.recentActivity.invoices
                        .filter(invoice => invoice)
                        .map(invoice => (
                          <Tr key={invoice.id || Math.random()}>
                            <Td>
                              <Text fontWeight="bold" fontSize="sm">
                                {invoice.bookingRef || 'N/A'}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {invoice.customer && invoice.customer.name
                                  ? invoice.customer.name
                                  : 'Unknown'}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontWeight="bold" fontSize="sm">
                                {formatCurrency(invoice.amount || 0)}
                              </Text>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={getStatusColor(
                                  invoice.status || 'unknown'
                                )}
                                size="sm"
                              >
                                {invoice.status || 'Unknown'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>

              {/* Recent Refunds */}
              <Card>
                <CardBody>
                  <HStack justify="space-between" mb={4}>
                    <Heading size="md">Recent Refunds</Heading>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        (window.location.href = '/admin/finance/refunds')
                      }
                    >
                      View All
                    </Button>
                  </HStack>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Ref</Th>
                        <Th>Customer</Th>
                        <Th>Amount</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.recentActivity.refunds
                        .filter(refund => refund)
                        .map(refund => (
                          <Tr key={refund.id || Math.random()}>
                            <Td>
                              <Text fontWeight="bold" fontSize="sm">
                                {refund.bookingRef || 'N/A'}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {refund.customer && refund.customer.name
                                  ? refund.customer.name
                                  : 'Unknown'}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontWeight="bold" fontSize="sm">
                                {formatCurrency(refund.amount || 0)}
                              </Text>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={getStatusColor(
                                  refund.status || 'unknown'
                                )}
                                size="sm"
                              >
                                {refund.status || 'Unknown'}
                              </Badge>
                            </Td>
                          </Tr>
                        ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>

              {/* Top Drivers */}
              <Card>
                <CardBody>
                  <HStack justify="space-between" mb={4}>
                    <Heading size="md">Top Drivers</Heading>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => (window.location.href = '/admin/drivers')}
                    >
                      View All
                    </Button>
                  </HStack>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Driver</Th>
                        <Th>Earnings</Th>
                        <Th>Jobs</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {data.topDrivers
                        .filter(driver => driver)
                        .map(driver => (
                          <Tr key={driver.driverId || Math.random()}>
                            <Td>
                              <Text fontSize="sm">
                                {driver.driverName || 'Unknown Driver'}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontWeight="bold" fontSize="sm">
                                {formatCurrency(driver.totalEarnings || 0)}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">{driver.jobCount || 0}</Text>
                            </Td>
                          </Tr>
                        ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardBody>
                  <Heading size="md" mb={4}>
                    Financial Summary
                  </Heading>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text>Gross Revenue</Text>
                      <Text fontWeight="bold">
                        {formatCurrency(data.summary.totalRevenue)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Refunds</Text>
                      <Text color="red.500">
                        -{formatCurrency(data.summary.totalRefunds)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Driver Payouts</Text>
                      <Text color="blue.500">
                        -{formatCurrency(data.earnings.netAmount)}
                      </Text>
                    </HStack>
                    <HStack justify="space-between">
                      <Text>Platform Fees</Text>
                      <Text color="gray.500">
                        -
                        {formatCurrency(
                          data.summary.totalRevenue - data.earnings.netAmount
                        )}
                      </Text>
                    </HStack>
                    <Divider />
                    <HStack justify="space-between">
                      <Text fontWeight="bold">Net Profit</Text>
                      <Text fontWeight="bold" color="green.500">
                        {formatCurrency(
                          data.summary.totalRevenue -
                            data.summary.totalRefunds -
                            data.earnings.netAmount
                        )}
                      </Text>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>
            </Grid>
          </TabPanel>

          {/* Invoices Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Invoices</Heading>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() =>
                      (window.location.href = '/admin/finance/invoices')
                    }
                  >
                    Manage Invoices
                  </Button>
                </HStack>
                <Text color="gray.500">
                  Invoice management interface with search, filtering, and PDF
                  generation.
                </Text>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Refunds Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Refunds</Heading>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() =>
                      (window.location.href = '/admin/finance/refunds')
                    }
                  >
                    Manage Refunds
                  </Button>
                </HStack>
                <Text color="gray.500">
                  Refund management with reason categories, partial/full
                  refunds, and Stripe integration.
                </Text>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Payouts Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Payouts</Heading>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() =>
                      (window.location.href = '/admin/finance/payouts')
                    }
                  >
                    Manage Payouts
                  </Button>
                </HStack>
                <Text color="gray.500">
                  Driver payout management with earnings breakdown, batch
                  processing, and export functionality.
                </Text>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Ledger Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <HStack justify="space-between" mb={4}>
                  <Heading size="md">Ledger</Heading>
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() =>
                      (window.location.href = '/admin/finance/ledger')
                    }
                  >
                    View Ledger
                  </Button>
                </HStack>
                <Text color="gray.500">
                  Job-level financial breakdown with base, distance, floors,
                  lift surcharge, items, surge, fees, discounts, tips, and tax.
                </Text>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
