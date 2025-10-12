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
  FormControl,
  FormLabel,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
  Divider,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiRefreshCw,
  FiMoreVertical,
  FiCalendar,
  FiUser,
  FiDollarSign,
  FiPlus,
} from 'react-icons/fi';

interface Refund {
  id: string;
  orderRef: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  totalGBP: number;
  refundAmountPence: number;
  refundReason: string;
  refundNotes: string;
  refundedAt: string;
  refundedBy: string;
  stripePaymentIntentId: string;
  stripeRefundId: string;
}

interface RefundsData {
  refunds: Refund[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    totalRefunds: number;
    refundCount: number;
    reasonsBreakdown: Array<{
      reason: string;
      amount: number;
      count: number;
    }>;
  };
}

const REFUND_REASONS = [
  'Service not provided',
  'Customer cancellation',
  'Driver no-show',
  'Poor service quality',
  'Billing error',
  'Technical issue',
  'Weather conditions',
  'Vehicle breakdown',
  'Other',
];

export default function RefundsPage() {
  const [data, setData] = useState<RefundsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    reason: '',
    fromDate: '',
    toDate: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [refundForm, setRefundForm] = useState({
    amount: '',
    reason: '',
    notes: '',
    type: 'full',
  });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isRefundOpen,
    onOpen: onRefundOpen,
    onClose: onRefundClose,
  } = useDisclosure();
  const toast = useToast();

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...filters,
      });

      const response = await fetch(`/api/admin/finance/refunds?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch refunds');
      }
      const refundsData = await response.json();
      setData(refundsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load refunds',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
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
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  const handleIssueRefund = async () => {
    if (!refundForm.amount || !refundForm.reason) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/finance/refunds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: selectedRefund?.id,
          totalGBP: parseFloat(refundForm.amount) * 100,
          reason: refundForm.reason,
          notes: refundForm.notes,
          type: refundForm.type,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Refund issued successfully',
          description: 'The refund has been processed',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        setRefundForm({ amount: '', reason: '', notes: '', type: 'full' });
        onRefundClose();
        fetchRefunds(); // Refresh data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Refund failed');
      }
    } catch (error) {
      toast({
        title: 'Refund failed',
        description:
          error instanceof Error ? error.message : 'Failed to process refund',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleViewRefund = (refund: Refund) => {
    setSelectedRefund(refund);
    onOpen();
  };

  const handleNewRefund = () => {
    setRefundForm({ amount: '', reason: '', notes: '', type: 'full' });
    onRefundOpen();
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
          <Heading size="lg">Refunds</Heading>
          <Text color="gray.600">Manage customer refunds and processing</Text>
        </VStack>
        <Button
          leftIcon={<FiPlus />}
          colorScheme="blue"
          size="sm"
          onClick={handleNewRefund}
        >
          Issue Refund
        </Button>
      </HStack>

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <HStack spacing={4} wrap="wrap">
            <Input
              placeholder="Search refunds, customers..."
              value={filters.search}
              onChange={e => setFilters({ ...filters, search: e.target.value })}
              maxW="300px"
            />
            <Select
              placeholder="Refund Reason"
              value={filters.reason}
              onChange={e => setFilters({ ...filters, reason: e.target.value })}
              maxW="200px"
            >
              {REFUND_REASONS.map(reason => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
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
                setFilters({ search: '', reason: '', fromDate: '', toDate: '' })
              }
            >
              Clear Filters
            </Button>
          </HStack>
        </CardBody>
      </Card>

      {/* Summary Stats */}
      {data && (
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={6}>
          <Card>
            <CardBody>
              <HStack>
                <FiDollarSign size={24} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.600">
                    Total Refunds
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {formatCurrency(data.summary.totalRefunds)}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <HStack>
                <FiRefreshCw size={24} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.600">
                    Refund Count
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {data.summary.refundCount}
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
                    {data.refunds.length} of {data.pagination.total}
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
                    Top Reason
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {data.summary.reasonsBreakdown[0]?.reason || 'N/A'}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Refunds Table */}
      <Card>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Order Ref</Th>
                <Th>Customer</Th>
                <Th>Original Amount</Th>
                <Th>Refund Amount</Th>
                <Th>Reason</Th>
                <Th>Date</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data?.refunds.map(refund => (
                <Tr key={refund.id}>
                  <Td>
                    <Text fontWeight="bold" fontSize="sm">
                      {refund.orderRef}
                    </Text>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="medium">
                        {refund.customer.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {refund.customer.email}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <Text fontSize="sm">{formatCurrency(refund.totalGBP)}</Text>
                  </Td>
                  <Td>
                    <Text fontWeight="bold" fontSize="sm" color="red.500">
                      -{formatCurrency(refund.refundAmountPence)}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">{refund.refundReason}</Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {refund.refundedAt
                        ? new Date(refund.refundedAt).toLocaleDateString()
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
                          onClick={() => handleViewRefund(refund)}
                        >
                          View Details
                        </MenuItem>
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

      {/* Refund Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Refund Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedRefund && (
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="bold">Order Reference:</Text>
                  <Text>{selectedRefund.orderRef}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Customer:</Text>
                  <VStack align="end" spacing={0}>
                    <Text>{selectedRefund.customer.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {selectedRefund.customer.email}
                    </Text>
                  </VStack>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Original Amount:</Text>
                  <Text>{formatCurrency(selectedRefund.totalGBP)}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Refund Amount:</Text>
                  <Text color="red.500">
                    -{formatCurrency(selectedRefund.refundAmountPence)}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Reason:</Text>
                  <Text>{selectedRefund.refundReason}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Refund Date:</Text>
                  <Text>
                    {selectedRefund.refundedAt
                      ? new Date(selectedRefund.refundedAt).toLocaleDateString()
                      : 'N/A'}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Stripe Refund ID:</Text>
                  <Text fontSize="sm">
                    {selectedRefund.stripeRefundId || 'N/A'}
                  </Text>
                </HStack>
                {selectedRefund.refundNotes && (
                  <>
                    <Divider />
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold">Notes:</Text>
                      <Text fontSize="sm">{selectedRefund.refundNotes}</Text>
                    </VStack>
                  </>
                )}
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Issue Refund Modal */}
      <Modal isOpen={isRefundOpen} onClose={onRefundClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Issue Refund</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Refund Type</FormLabel>
                <Select
                  value={refundForm.type}
                  onChange={e =>
                    setRefundForm({ ...refundForm, type: e.target.value })
                  }
                >
                  <option value="full">Full Refund</option>
                  <option value="partial">Partial Refund</option>
                </Select>
              </FormControl>

              {refundForm.type === 'partial' && (
                <FormControl>
                  <FormLabel>Refund Amount (£)</FormLabel>
                  <NumberInput
                    value={refundForm.amount}
                    onChange={value =>
                      setRefundForm({ ...refundForm, amount: value })
                    }
                    min={0}
                    precision={2}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>
              )}

              <FormControl>
                <FormLabel>Refund Reason</FormLabel>
                <Select
                  value={refundForm.reason}
                  onChange={e =>
                    setRefundForm({ ...refundForm, reason: e.target.value })
                  }
                >
                  <option value="">Select a reason</option>
                  {REFUND_REASONS.map(reason => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>Notes (Optional)</FormLabel>
                <Textarea
                  value={refundForm.notes}
                  onChange={e =>
                    setRefundForm({ ...refundForm, notes: e.target.value })
                  }
                  placeholder="Additional notes about the refund..."
                />
              </FormControl>

              <HStack spacing={3} w="full">
                <Button variant="outline" onClick={onRefundClose} flex={1}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleIssueRefund} flex={1}>
                  Issue Refund
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
