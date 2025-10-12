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
  HStack as ChakraHStack,
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
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
  SimpleGrid,
  Divider,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiMail,
  FiPrinter,
  FiMoreVertical,
  FiCalendar,
  FiUser,
  FiDollarSign,
  FiFileText,
} from 'react-icons/fi';

interface Invoice {
  id: string;
  invoiceNumber: string;
  orderRef: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  totalGBP: number;
  status: string;
  paidAt: string;
  scheduledAt: string;
  pickupAddress: string;
  dropoffAddress: string;
  driver: {
    id: string;
    name: string;
    email: string;
  } | null;
  stripePaymentIntentId: string;
}

interface InvoicesData {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    totalRevenue: number;
    totalInvoices: number;
  };
}

export default function InvoicesPage() {
  const [data, setData] = useState<InvoicesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    fromDate: '',
    toDate: '',
    customerId: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...filters,
      });

      const response = await fetch(`/api/admin/finance/invoices?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      const invoicesData = await response.json();
      setData(invoicesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load invoices',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
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

  const handleGeneratePDF = async (invoice: Invoice) => {
    try {
      const response = await fetch('/api/admin/finance/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: invoice.id,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoice.invoiceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Success',
          description: 'PDF invoice generated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF invoice',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
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
          <Heading size="lg">Invoices</Heading>
          <Text color="gray.600">Manage and generate customer invoices</Text>
        </VStack>
        <Button leftIcon={<FiDownload />} colorScheme="blue" size="sm">
          Export All
        </Button>
      </HStack>

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <HStack spacing={4} wrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement>
                <FiSearch />
              </InputLeftElement>
              <Input
                placeholder="Search invoices, customers..."
                value={filters.search}
                onChange={e =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </InputGroup>
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
                  fromDate: '',
                  toDate: '',
                  customerId: '',
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
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
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
                <FiFileText size={24} />
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" color="gray.600">
                    Total Invoices
                  </Text>
                  <Text fontSize="xl" fontWeight="bold">
                    {data.summary.totalInvoices}
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
                    {data.invoices.length} of {data.pagination.total}
                  </Text>
                </VStack>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Invoices Table */}
      <Card>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Invoice #</Th>
                <Th>Order Ref</Th>
                <Th>Customer</Th>
                <Th>Amount</Th>
                <Th>Status</Th>
                <Th>Date</Th>
                <Th>Driver</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {data?.invoices.map(invoice => (
                <Tr key={invoice.id}>
                  <Td>
                    <Text fontWeight="bold" fontSize="sm">
                      {invoice.invoiceNumber || 'N/A'}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">{invoice.orderRef}</Text>
                  </Td>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" fontWeight="medium">
                        {invoice.customer.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {invoice.customer.email}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>
                    <Text fontWeight="bold" fontSize="sm">
                      {formatCurrency(invoice.totalGBP)}
                    </Text>
                  </Td>
                  <Td>
                    <Badge
                      colorScheme={getStatusColor(invoice.status)}
                      size="sm"
                    >
                      {invoice.status}
                    </Badge>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {invoice.paidAt
                        ? new Date(invoice.paidAt).toLocaleDateString()
                        : 'N/A'}
                    </Text>
                  </Td>
                  <Td>
                    <Text fontSize="sm">
                      {invoice.driver?.name || 'Unassigned'}
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
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          View Details
                        </MenuItem>
                        <MenuItem
                          icon={<FiDownload />}
                          onClick={() => handleGeneratePDF(invoice)}
                        >
                          Download PDF
                        </MenuItem>
                        <MenuItem icon={<FiMail />}>Send to Customer</MenuItem>
                        <MenuItem icon={<FiPrinter />}>Print</MenuItem>
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

      {/* Invoice Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Invoice Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedInvoice && (
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text fontWeight="bold">Invoice Number:</Text>
                  <Text>{selectedInvoice.invoiceNumber || 'N/A'}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Order Reference:</Text>
                  <Text>{selectedInvoice.orderRef}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Customer:</Text>
                  <VStack align="end" spacing={0}>
                    <Text>{selectedInvoice.customer.name}</Text>
                    <Text fontSize="sm" color="gray.500">
                      {selectedInvoice.customer.email}
                    </Text>
                  </VStack>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Amount:</Text>
                  <Text>{formatCurrency(selectedInvoice.totalGBP)}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Status:</Text>
                  <Badge colorScheme={getStatusColor(selectedInvoice.status)}>
                    {selectedInvoice.status}
                  </Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Payment Date:</Text>
                  <Text>
                    {selectedInvoice.paidAt
                      ? new Date(selectedInvoice.paidAt).toLocaleDateString()
                      : 'N/A'}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontWeight="bold">Driver:</Text>
                  <Text>{selectedInvoice.driver?.name || 'Unassigned'}</Text>
                </HStack>
                <Divider />
                <VStack align="start" spacing={2}>
                  <Text fontWeight="bold">Pickup Address:</Text>
                  <Text fontSize="sm">{selectedInvoice.pickupAddress}</Text>
                </VStack>
                <VStack align="start" spacing={2}>
                  <Text fontWeight="bold">Dropoff Address:</Text>
                  <Text fontSize="sm">{selectedInvoice.dropoffAddress}</Text>
                </VStack>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
