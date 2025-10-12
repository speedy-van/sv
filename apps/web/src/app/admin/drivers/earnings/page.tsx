'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Badge,
  Button,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Divider,
  Flex,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiDollarSign,
  FiUsers,
  FiTrendingUp,
  FiCalendar,
  FiRefreshCw,
  FiDownload,
  FiEye,
  FiEdit,
} from 'react-icons/fi';
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';

interface DriverEarning {
  id: string;
  driverId: string;
  driverName: string;
  assignmentId: string;
  bookingReference: string;
  customerName: string;
  baseAmount: string;
  surgeAmount: string;
  tipAmount: string;
  feeAmount: string;
  netAmount: string;
  currency: string;
  calculatedAt: string;
  paidOut: boolean;
}

interface DriverStats {
  driverId: string;
  driverName: string;
  driverEmail: string;
  totalEarnings: string;
  totalJobs: number;
  jobs: Array<{
    assignmentId: string;
    bookingReference: string;
    customerName: string;
    earnings: string;
    calculatedAt: string;
    paidOut: boolean;
  }>;
}

interface EarningsData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalEarnings: string;
    totalJobs: number;
    totalPlatformFees: string;
    averageEarningsPerJob: string;
  };
  driverStats: DriverStats[];
  rawEarnings: DriverEarning[];
}

export default function DriverEarningsPage() {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState(0);
  
  const toast = useToast();

  const formatCurrency = (pence: number) => (pence / 100).toFixed(2);

  const periods = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
  ];

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        period: selectedPeriod,
        ...(selectedDriver !== 'all' && { driverId: selectedDriver }),
      });
      
      const response = await fetch(`/api/admin/drivers/earnings?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch earnings data');
      }
      
      const data = await response.json();
      setEarningsData(data.data);
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({
        title: 'Error',
        description: 'Failed to load driver earnings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [selectedPeriod, selectedDriver]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = format(new Date(start), 'MMM dd, yyyy');
    const endDate = format(new Date(end), 'MMM dd, yyyy');
    return `${startDate} - ${endDate}`;
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="center">
          <Spinner size="xl" color="blue.500" />
          <Text>Loading driver earnings...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" mb={4}>
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Error loading earnings</Text>
            <Text fontSize="sm">{error}</Text>
          </Box>
        </Alert>
        <Button onClick={fetchEarnings} colorScheme="blue">
          Try Again
        </Button>
      </Container>
    );
  }

  if (!earningsData) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>No earnings data available</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" mb={2}>Driver Earnings</Heading>
            <Text color="gray.600">
              {formatDateRange(earningsData.dateRange.start, earningsData.dateRange.end)}
            </Text>
          </Box>
          <HStack spacing={4}>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              width="150px"
            >
              {periods.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </Select>
            <Select
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
              width="200px"
            >
              <option value="all">All Drivers</option>
              {earningsData.driverStats.map((driver) => (
                <option key={driver.driverId} value={driver.driverId}>
                  {driver.driverName}
                </option>
              ))}
            </Select>
            <IconButton
              aria-label="Refresh"
              icon={<FiRefreshCw />}
              onClick={fetchEarnings}
              colorScheme="blue"
              variant="outline"
            />
            <Button
              leftIcon={<FiDownload />}
              colorScheme="green"
              variant="outline"
              onClick={() => {
                // TODO: Implement CSV export
                toast({
                  title: 'Export',
                  description: 'CSV export feature coming soon',
                  status: 'info',
                  duration: 3000,
                  isClosable: true,
                });
              }}
            >
              Export
            </Button>
          </HStack>
        </Flex>

        {/* Summary Stats */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Earnings</StatLabel>
                <StatNumber color="green.500">
                  £{earningsData.summary.totalEarnings}
                </StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {earningsData.summary.totalJobs} jobs
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Jobs</StatLabel>
                <StatNumber color="blue.500">
                  {earningsData.summary.totalJobs}
                </StatNumber>
                <StatHelpText>
                  Completed jobs
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Platform Fees</StatLabel>
                <StatNumber color="orange.500">
                  £{earningsData.summary.totalPlatformFees}
                </StatNumber>
                <StatHelpText>
                  15% platform fee
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Avg per Job</StatLabel>
                <StatNumber color="purple.500">
                  £{earningsData.summary.averageEarningsPerJob}
                </StatNumber>
                <StatHelpText>
                  Average driver earnings
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Tabs */}
        <Tabs index={selectedTab} onChange={setSelectedTab}>
          <TabList>
            <Tab>Driver Summary</Tab>
            <Tab>All Earnings</Tab>
          </TabList>

          <TabPanels>
            {/* Driver Summary Tab */}
            <TabPanel px={0}>
              <VStack spacing={4} align="stretch">
                {earningsData.driverStats.map((driver) => (
                  <Card key={driver.driverId}>
                    <CardHeader>
                      <Flex justify="space-between" align="center">
                        <Box>
                          <Heading size="md">{driver.driverName}</Heading>
                          <Text fontSize="sm" color="gray.600">
                            {driver.driverEmail}
                          </Text>
                        </Box>
                        <VStack align="end" spacing={1}>
                          <Text fontSize="lg" fontWeight="bold" color="green.500">
                            £{driver.totalEarnings}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {driver.totalJobs} jobs
                          </Text>
                        </VStack>
                      </Flex>
                    </CardHeader>
                    <CardBody pt={0}>
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>Reference</Th>
                            <Th>Customer</Th>
                            <Th>Type</Th>
                            <Th>Earnings</Th>
                            <Th>Status</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {driver.jobs.map((job) => (
                            <Tr key={job.assignmentId || job.calculatedAt}>
                              <Td fontFamily="mono" fontSize="sm">
                                {job.bookingReference}
                              </Td>
                              <Td>{job.customerName}</Td>
                              <Td>
                                {(job as any).isBonus ? (
                                  <Badge colorScheme="orange" variant="subtle" size="sm">
                                    {(job as any).bonusType || 'Bonus'}
                                  </Badge>
                                ) : (
                                  <Badge colorScheme="blue" variant="subtle" size="sm">
                                    Job
                                  </Badge>
                                )}
                              </Td>
                              <Td>
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="bold" color="green.500">
                                £{formatCurrency(Number(job.earnings))}
                              </Text>
                              {(job as any).bonusAmount > 0 && (
                                <Text fontSize="xs" color="orange.500">
                                  Bonus: £{formatCurrency(Number((job as any).bonusAmount))}
                                </Text>
                              )}
                            </VStack>
                              </Td>
                              <Td>
                                {!job.paidOut ? (
                                  <Badge colorScheme="orange" variant="subtle">
                                    Pending
                                  </Badge>
                                ) : (
                                  <Badge colorScheme="green" variant="subtle">
                                    Paid
                                  </Badge>
                                )}
                              </Td>
                              <Td>
                                {!job.paidOut && (
                                  <Tooltip label="Adjust earnings">
                                    <IconButton
                                      size="xs"
                                      icon={<FiEdit />}
                                      variant="ghost"
                                      colorScheme="blue"
                                      aria-label="Adjust earnings"
                                      onClick={() => {
                                        // Open adjustment modal
                                        toast({
                                          title: 'Feature Coming Soon',
                                          description: 'Manual earnings adjustment will be available soon',
                                          status: 'info',
                                          duration: 3000,
                                        });
                                      }}
                                    />
                                  </Tooltip>
                                )}
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>
                ))}
              </VStack>
            </TabPanel>

            {/* All Earnings Tab */}
            <TabPanel px={0}>
              <Card>
                <CardHeader>
                  <Heading size="md">All Driver Earnings</Heading>
                </CardHeader>
                <CardBody>
                  <Table size="sm">
                    <Thead>
                      <Tr>
                        <Th>Driver</Th>
                        <Th>Job Ref</Th>
                        <Th>Customer</Th>
                        <Th>Base</Th>
                        <Th>Surge</Th>
                        <Th>Tips</Th>
                        <Th>Fees</Th>
                        <Th>Net</Th>
                        <Th>Date</Th>
                        <Th>Status</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {earningsData.rawEarnings.map((earning) => (
                        <Tr key={earning.id}>
                          <Td fontWeight="medium">{earning.driverName}</Td>
                          <Td fontFamily="mono" fontSize="sm">
                            {earning.bookingReference}
                          </Td>
                          <Td>{earning.customerName}</Td>
                          <Td>£{earning.baseAmount}</Td>
                          <Td>£{earning.surgeAmount}</Td>
                          <Td>£{earning.tipAmount}</Td>
                          <Td>£{earning.feeAmount}</Td>
                          <Td fontWeight="bold" color="green.500">
                            £{earning.netAmount}
                          </Td>
                          <Td fontSize="sm">
                            {formatDate(earning.calculatedAt)}
                          </Td>
                          <Td>
                            <Badge
                              colorScheme={earning.paidOut ? 'green' : 'yellow'}
                              variant="subtle"
                            >
                              {earning.paidOut ? 'Paid' : 'Pending'}
                            </Badge>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}
