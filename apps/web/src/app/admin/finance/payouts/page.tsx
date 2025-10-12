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
  FiCheck,
  FiX,
  FiClock,
} from 'react-icons/fi';

interface Payout {
  id: string;
  driver: {
    name: string;
    email: string;
    phone: string;
  };
  totalAmountPence: number;
  currency: string;
  status: string;
  processedAt: string;
  failedAt: string;
  failureReason: string;
  stripeTransferId: string;
  bankAccountId: string;
  createdAt: string;
  earnings: Array<{
    id: string;
    assignmentId: string;
    Booking: {
      id: string;
      orderRef: string;
      scheduledAt: string;
    };
    baseAmountPence: number;
    surgeAmountPence: number;
    tipAmountPence: number;
    feeAmountPence: number;
    netAmountPence: number;
    calculatedAt: string;
  }>;
}

interface PayoutsData {
  payouts: Payout[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    pendingPayouts: number;
    payoutCount: number;
    statusBreakdown: Array<{
      status: string;
      amount: number;
      count: number;
    }>;
    earningsBreakdown: {
      baseAmount: number;
      surgeAmount: number;
      tipAmount: number;
      feeAmount: number;
      netAmount: number;
    };
  };
}

export default function PayoutsPage() {
  const [data, setData] = useState<PayoutsData | null>(null);
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
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...filters,
      });

      const response = await fetch(`/api/admin/finance/payouts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch payouts');
      }
      const payoutsData = await response.json();
      setData(payoutsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load payouts',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [currentPage, filters]);

  const formatCurrency = (totalGBP: number) => {
    return `£${(totalGBP / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'processing':
        return 'blue';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  const handleProcessPayout = async (payoutId: string) => {
    try {
      const response = await fetch(
        `/api/admin/finance/payouts/${payoutId}/process`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast({
          title: 'Payout processed',
          description: 'The payout has been processed successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchPayouts(); // Refresh data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Payout processing failed');
      }
    } catch (error) {
      toast({
        title: 'Payout processing failed',
        description:
          error instanceof Error ? error.message : 'Failed to process payout',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleViewPayout = (payout: Payout) => {
    setSelectedPayout(payout);
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
          <Heading size="lg">Payouts</Heading>
          <Text color="gray.600">Manage driver payouts and earnings</Text>
        </VStack>
        <Button leftIcon={<FiDownload />} colorScheme="blue" size="sm">
          Export Payouts
        </Button>
      </HStack>

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <HStack spacing={4} wrap="wrap">
            <Input
              placeholder="Search drivers..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              maxW="300px"
            />
            <Select
              placeholder="Payout Status"
              value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}
              maxW="200px"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="processed">Processed</option>
              <option value="failed">Failed</option>
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
        <SimpleGrid columns={{ base: 1, md: 5 }} spacing={4} mb={6}>
          <Card>
            <CardBody>
              <HStack>
                <FiDollarSign size={24} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.600">
                    Pending Payouts
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {formatCurrency(data.summary.pendingPayouts)}
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
                    Total Payouts
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {data.summary.payoutCount}
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
                    Base Earnings
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {formatCurrency(data.summary.earningsBreakdown.baseAmount)}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <HStack>
                <FiDollarSign size={24} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.600">
                    Tips
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {formatCurrency(data.summary.earningsBreakdown.tipAmount)}
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
                    {data.payouts.length} of {data.pagination.total}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Payouts Table */}
      <Card>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Driver</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Jobs</Th>
                <Th>Created</Th>
                <Th>Processed</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data?.payouts.map(payout => (
                <Tr key={payout.id}>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="medium">
                        {payout.driver.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {payout.driver.email}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <Text fontWeight="bold" fontSize="sm">
                      {formatCurrency(payout.totalAmountPence)}
                    </Text>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={getStatusColor(payout.status)}
                      size="sm"
                    >
                      {payout.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontSize="sm">{payout.earnings.length} jobs</Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {payout.createdAt
                        ? new Date(payout.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {payout.processedAt
                        ? new Date(payout.processedAt).toLocaleDateString()
                        : 'N/A'}
                    </Text>
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
                          onClick={() => handleViewPayout(payout)}
                        >
                          View Details
                        </MenuItem>
                        {payout.status === 'pending' && (
                          <MenuItem
                            icon={<FiCheck />}
                            onClick={() => handleProcessPayout(payout.id)}
                          >
                            Process Payout
                          </MenuItem>
                        )}
                        <MenuItem icon={<FiDownload />}>
                          Download Receipt
                        </MenuItem>
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

      {/* Payout Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Payout Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedPayout && (
              <VStack spacing={6} align="stretch">
                {/* Driver Info */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Driver Information
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Name:</Text>
                        <Text>{selectedPayout.driver.name}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Email:</Text>
                        <Text>{selectedPayout.driver.email}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Phone:</Text>
                        <Text>{selectedPayout.driver.phone}</Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Payout Summary */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Payout Summary
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Total Amount:</Text>
                        <Text fontSize="lg" fontWeight="bold">
                          {formatCurrency(selectedPayout.totalAmountPence)}
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Status:</Text>
                        <Badge
                          colorScheme={getStatusColor(selectedPayout.status)}
                          size="lg"
                        >
                          {selectedPayout.status}
                        </Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">Created:</Text>
                        <Text>
                          {new Date(
                            selectedPayout.createdAt
                          ).toLocaleDateString()}
                        </Text>
                      </HStack>
                      {selectedPayout.processedAt && (
                        <HStack justify="space-between">
                          <Text fontWeight="bold">Processed:</Text>
                          <Text>
                            {new Date(
                              selectedPayout.processedAt
                            ).toLocaleDateString()}
                          </Text>
                        </HStack>
                      )}
                      {selectedPayout.stripeTransferId && (
                        <HStack justify="space-between">
                          <Text fontWeight="bold">Stripe Transfer ID:</Text>
                          <Text fontSize="sm">
                            {selectedPayout.stripeTransferId}
                          </Text>
                        </HStack>
                      )}
                      {selectedPayout.failureReason && (
                        <HStack justify="space-between">
                          <Text fontWeight="bold">Failure Reason:</Text>
                          <Text color="red.500">
                            {selectedPayout.failureReason}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Earnings Breakdown */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Earnings Breakdown
                    </Heading>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Job</Th>
                          <Th>Base</Th>
                          <Th>Surge</Th>
                          <Th>Tips</Th>
                          <Th>Fees</Th>
                          <Th>Net</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {selectedPayout.earnings.map(earning => (
                          <Tr key={earning.id}>
                            <Td>
                              <Text fontSize="sm">
                                {earning.Booking.orderRef}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {new Date(
                                  earning.Booking.scheduledAt
                                ).toLocaleDateString()}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {formatCurrency(earning.baseAmountPence)}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {formatCurrency(earning.surgeAmountPence)}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {formatCurrency(earning.tipAmountPence)}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm">
                                {formatCurrency(earning.feeAmountPence)}
                              </Text>
                            </Td>
                            <Td>
                              <Text fontSize="sm" fontWeight="bold">
                                {formatCurrency(earning.netAmountPence)}
                              </Text>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
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
