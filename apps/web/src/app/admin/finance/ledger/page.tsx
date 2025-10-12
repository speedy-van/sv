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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
  Divider,
  Progress,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiDollarSign,
  FiMoreVertical,
  FiCalendar,
  FiUser,
  FiTruck,
  FiBarChart,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';

interface LedgerEntry {
  id: string;
  driver: {
    name: string;
    email: string;
  };
  Booking: {
    id: string;
    orderRef: string;
    scheduledAt: string;
    totalGBP: number;
    status: string;
    customer: {
      name: string;
      email: string;
    };
  };
  breakdown: {
    baseAmountPence: number;
    surgeAmountPence: number;
    tipAmountPence: number;
    feeAmountPence: number;
    netAmountPence: number;
  };
  calculatedAt: string;
  paidOut: boolean;
  paidOutAt: string;
}

interface LedgerData {
  ledger: LedgerEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    totalRevenue: number;
    totalOrders: number;
    earningsBreakdown: {
      baseAmount: number;
      surgeAmount: number;
      tipAmount: number;
      feeAmount: number;
      netAmount: number;
    };
    platformMargin: number;
    marginPercentage: string;
  };
  driverBreakdown: Array<{
    driverId: string;
    driverName: string;
    driverEmail: string;
    baseAmount: number;
    surgeAmount: number;
    tipAmount: number;
    feeAmount: number;
    netAmount: number;
    jobCount: number;
  }>;
}

export default function LedgerPage() {
  const [data, setData] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    driverId: '',
    fromDate: '',
    toDate: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...filters,
      });

      const response = await fetch(`/api/admin/finance/ledger?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ledger data');
      }
      const ledgerData = await response.json();
      setData(ledgerData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load ledger data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [currentPage, filters]);

  const formatCurrency = (totalGBP: number) => {
    return `£${(totalGBP / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'failed':
        return 'red';
      case 'refunded':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const handleViewEntry = (entry: LedgerEntry) => {
    setSelectedEntry(entry);
    onOpen();
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minH="400px"
      >
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">Financial Ledger</Heading>
          <Text color="gray.600">
            Job-level financial breakdown and analysis
          </Text>
        </VStack>
        <Button leftIcon={<FiDownload />} colorScheme="blue" size="sm">
          Export Ledger
        </Button>
      </HStack>

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <HStack spacing={4} wrap="wrap">
            <Input
              placeholder="Search jobs, drivers, customers..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              maxW="300px"
            />
            <Select
              placeholder="Payment Status"
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              maxW="200px"
            >
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </Select>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={e =>
                setFilters({ ...filters, fromDate: e.target.value })
              }
              maxW="150px"
            />
            <Input
              type="date"
              value={filters.toDate}
              onChange={e => setFilters({ ...filters, toDate: e.target.value })}
              maxW="150px"
            />
            <Button
              leftIcon={<FiFilter />}
              variant="outline"
              onClick={() =>
                setFilters({
                  search: '',
                  status: '',
                  driverId: '',
                  fromDate: '',
                  toDate: '',
                })
              }
            >
              Clear Filters
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* Summary Stats */}
      {data && (
        <SimpleGrid columns={{ base: 1, md: 6 }} spacing={4} mb={6}>
          <Card>
            <CardBody>
              <HStack>
                <FiDollarSign size={24} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.600">
                    Total Revenue
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {formatCurrency(data.summary.totalRevenue)}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <HStack>
                <FiTruck size={24} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.600">
                    Total Orders
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {data.summary.totalOrders}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <HStack>
                <FiUser size={24} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.600">
                    Driver Earnings
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {formatCurrency(data.summary.earningsBreakdown.netAmount)}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <HStack>
                <FiBarChart size={24} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.600">
                    Platform Margin
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {formatCurrency(data.summary.platformMargin)}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <HStack>
                <FiTrendingUp size={24} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.600">
                    Margin %
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {data.summary.marginPercentage}%
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <HStack>
                <FiCalendar size={24} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.600">
                    Showing
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {data.ledger.length} of {data.pagination.total}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Driver Breakdown */}
      {data && data.driverBreakdown.length > 0 && (
        <Card mb={6}>
          <CardBody>
            <Heading size="md" mb={4}>
              Driver Earnings Breakdown
            </Heading>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Driver</Th>
                  <Th>Jobs</Th>
                  <Th>Base Earnings</Th>
                  <Th>Surge</Th>
                  <Th>Tips</Th>
                  <Th>Fees</Th>
                  <Th>Net Earnings</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.driverBreakdown.map(driver => (
                  <Tr key={driver.driverId}>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text fontSize="sm" fontWeight="medium">
                          {driver.driverName}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {driver.driverEmail}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm">{driver.jobCount}</Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {formatCurrency(driver.baseAmount)}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {formatCurrency(driver.surgeAmount)}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {formatCurrency(driver.tipAmount)}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        {formatCurrency(driver.feeAmount)}
                      </Text>
                    </Td>
                    <Td>
                      <Text fontSize="sm" fontWeight="bold">
                        {formatCurrency(driver.netAmount)}
                      </Text>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Ledger Table */}
      <Card>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Job</Th>
                <Th>Customer</Th>
                <Th>Driver</Th>
                <Th>Revenue</Th>
                <Th>Base</Th>
                <Th>Surge</Th>
                <Th>Tips</Th>
                <Th>Fees</Th>
                <Th>Net</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data?.ledger.map(entry => (
                <Tr key={entry.id}>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="medium">
                        {entry.Booking.orderRef}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(
                          entry.Booking.scheduledAt
                        ).toLocaleDateString()}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm">{entry.Booking.customer.name}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {entry.Booking.customer.email}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <Text fontSize="sm">{entry.driver.name}</Text>
                  </Td>
                  <Td>
                    <Text fontWeight="bold" fontSize="sm">
                      {formatCurrency(entry.Booking.totalGBP)}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {formatCurrency(entry.breakdown.baseAmountPence)}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {formatCurrency(entry.breakdown.surgeAmountPence)}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {formatCurrency(entry.breakdown.tipAmountPence)}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {formatCurrency(entry.breakdown.feeAmountPence)}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontWeight="bold" fontSize="sm">
                      {formatCurrency(entry.breakdown.netAmountPence)}
                    </Text>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={getStatusColor(entry.Booking.status)}
                      size="sm"
                    >
                      {entry.Booking.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                      />
                      <MenuList>
                        <MenuItem
                          icon={<FiEye />}
                          onClick={() => handleViewEntry(entry)}
                        >
                          View Details
                        </MenuItem>
                        <MenuItem icon={<FiDownload />}>Export Entry</MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {/* Pagination */}
          {data && data.pagination.pages > 1 && (
            <HStack justify="center" mt={6}>
              <Button
                size="sm"
                variant="outline"
                isDisabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </Button>
              <Text>
                Page {currentPage} of {data.pagination.pages}
              </Text>
              <Button
                size="sm"
                variant="outline"
                isDisabled={currentPage === data.pagination.pages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </Button>
            </HStack>
          )}
        </CardBody>
      </Card>

      {/* Ledger Entry Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Ledger Entry Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedEntry && (
              <VStack spacing={6} align="stretch">
                {/* Job Information */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Job Information
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Order Reference:</Text>
                        <Text>{selectedEntry.Booking.orderRef}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Customer:</Text>
                        <VStack align="end" spacing={0}>
                          <Text>{selectedEntry.Booking.customer.name}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {selectedEntry.Booking.customer.email}
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Driver:</Text>
                        <VStack align="end" spacing={0}>
                          <Text>{selectedEntry.driver.name}</Text>
                          <Text fontSize="sm" color="gray.500">
                            {selectedEntry.driver.email}
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Scheduled Date:</Text>
                        <Text>
                          {new Date(
                            selectedEntry.Booking.scheduledAt
                          ).toLocaleDateString()}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Payment Status:</Text>
                        <Badge
                          colorScheme={getStatusColor(
                            selectedEntry.Booking.status
                          )}
                        >
                          {selectedEntry.Booking.status}
                        </Badge>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Financial Breakdown */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Financial Breakdown
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Total Revenue:</Text>
                        <Text fontSize="lg" fontWeight="bold">
                          {formatCurrency(selectedEntry.Booking.totalGBP)}
                        </Text>
                      </HStack>
                      <Divider />
                      <HStack justify="space-between">
                        <Text>Base Amount:</Text>
                        <Text>
                          {formatCurrency(
                            selectedEntry.breakdown.baseAmountPence
                          )}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Surge Amount:</Text>
                        <Text>
                          {formatCurrency(
                            selectedEntry.breakdown.surgeAmountPence
                          )}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Tips:</Text>
                        <Text>
                          {formatCurrency(
                            selectedEntry.breakdown.tipAmountPence
                          )}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text>Platform Fees:</Text>
                        <Text color="red.500">
                          -
                          {formatCurrency(
                            selectedEntry.breakdown.feeAmountPence
                          )}
                        </Text>
                      </HStack>
                      <Divider />
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Driver Net Earnings:</Text>
                        <Text fontSize="lg" fontWeight="bold">
                          {formatCurrency(
                            selectedEntry.breakdown.netAmountPence
                          )}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Platform Margin:</Text>
                        <Text fontSize="lg" fontWeight="bold" color="green.500">
                          {formatCurrency(
                            selectedEntry.Booking.totalGBP -
                              selectedEntry.breakdown.netAmountPence
                          )}
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Payment Status */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Payment Status
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Calculated At:</Text>
                        <Text>
                          {new Date(
                            selectedEntry.calculatedAt
                          ).toLocaleDateString()}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Paid Out:</Text>
                        <Badge
                          colorScheme={
                            selectedEntry.paidOut ? 'green' : 'yellow'
                          }
                        >
                          {selectedEntry.paidOut ? 'Yes' : 'No'}
                        </Badge>
                      </HStack>
                      {selectedEntry.paidOutAt && (
                        <HStack justify="space-between">
                          <Text fontWeight="bold">Paid Out At:</Text>
                          <Text>
                            {new Date(
                              selectedEntry.paidOutAt
                            ).toLocaleDateString()}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
