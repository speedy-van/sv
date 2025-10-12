'use client';
import React, { useState, useEffect, useCallback } from 'react';
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
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Avatar,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiUser,
  FiMail,
  FiPhone,
  FiDollarSign,
  FiPackage,
  FiFlag,
  FiDownload,
  FiRefreshCw,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface Customer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  stats: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalLtv: number;
    lastOrder: string | null;
    openTickets: number;
    addressesCount: number;
    contactsCount: number;
  };
  addresses: Array<{
    id: string;
    label: string;
    line1: string;
    city: string;
    postcode: string;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    phone: string;
    email: string;
  }>;
}

interface CustomersResponse {
  customers: Customer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    tags: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  const toast = useToast();
  const router = useRouter();

  // Ensure component is mounted before rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch customers from API - memoized to prevent recreation
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        status: filters.status,
        tags: filters.tags,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      const response = await fetch(`/api/admin/customers?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch customers');
      }

      const data: CustomersResponse = await response.json();
      setCustomers(data.customers);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to fetch customers',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters, toast]);

  // Load customers on mount and when filters change
  useEffect(() => {
    if (mounted) {
      fetchCustomers();
    }
  }, [fetchCustomers, mounted]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  }, []);

  // Export customers to CSV
  const handleExportCSV = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/customers/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) {
        throw new Error('Failed to export customers');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Use consistent date formatting to prevent hydration mismatch
      const today = mounted
        ? new Date().toISOString().split('T')[0]
        : '2024-01-01';
      a.download = `customers-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Customers exported successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to export customers',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [filters, toast, mounted]);

  // Calculate stats from real data
  const stats = {
    totalCustomers: pagination.total,
    activeCustomers: customers.filter(c => (c.stats.totalOrders || 0) > 0)
      .length,
    totalLtv: customers.reduce((sum, c) => sum + (c.stats.totalLtv || 0), 0),
    avgLtv:
      customers.length > 0
        ? customers.reduce((sum, c) => sum + (c.stats.totalLtv || 0), 0) /
          customers.length
        : 0,
    totalOrders: customers.reduce(
      (sum, c) => sum + (c.stats.totalOrders || 0),
      0
    ),
    totalCancellations: customers.reduce(
      (sum, c) => sum + (c.stats.cancelledOrders || 0),
      0
    ),
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <Box>
        <HStack justify="space-between" mb={6}>
          <VStack align="start" spacing={1}>
            <Heading size="lg">Customers</Heading>
            <Text color="gray.600">Customer relationship management</Text>
          </VStack>
        </HStack>
        <VStack spacing={4} py={8}>
          <Text>Loading...</Text>
        </VStack>
      </Box>
    );
  }

  // Helper function for consistent date formatting
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">Customers</Heading>
          <Text color="gray.600">Customer relationship management</Text>
        </VStack>
        <HStack spacing={3}>
          <Button
            leftIcon={<FiRefreshCw />}
            variant="outline"
            size="sm"
            onClick={fetchCustomers}
            isLoading={loading}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<FiDownload />}
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            isLoading={loading}
          >
            Export CSV
          </Button>
          <Button colorScheme="blue" size="sm">
            Add Customer
          </Button>
        </HStack>
      </HStack>

      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error}
        </Alert>
      )}

      {/* Stats Row */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 6 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Customers</StatLabel>
              <StatNumber>{stats.totalCustomers}</StatNumber>
              <StatHelpText>
                <FiUser style={{ display: 'inline', marginRight: '4px' }} />
                All time
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Active Customers</StatLabel>
              <StatNumber>{stats.activeCustomers}</StatNumber>
              <StatHelpText>
                <FiUser style={{ display: 'inline', marginRight: '4px' }} />
                Last 30 days
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total LTV</StatLabel>
              <StatNumber>£{(stats.totalLtv || 0).toLocaleString()}</StatNumber>
              <StatHelpText>
                <FiDollarSign
                  style={{ display: 'inline', marginRight: '4px' }}
                />
                Lifetime value
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Avg LTV</StatLabel>
              <StatNumber>£{stats.avgLtv.toFixed(0)}</StatNumber>
              <StatHelpText>
                <FiDollarSign
                  style={{ display: 'inline', marginRight: '4px' }}
                />
                Per customer
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Orders</StatLabel>
              <StatNumber>{stats.totalOrders}</StatNumber>
              <StatHelpText>
                <FiPackage style={{ display: 'inline', marginRight: '4px' }} />
                All time
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Cancellations</StatLabel>
              <StatNumber>{stats.totalCancellations}</StatNumber>
              <StatHelpText>
                <FiFlag style={{ display: 'inline', marginRight: '4px' }} />
                Rate:{' '}
                {((stats.totalCancellations / stats.totalOrders) * 100).toFixed(
                  1
                )}
                %
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Filters */}
      <Card mb={6}>
        <CardBody>
          <HStack spacing={4} wrap="wrap">
            <InputGroup maxW="300px">
              <InputLeftElement>
                <FiSearch />
              </InputLeftElement>
              <Input
                placeholder="Search customers..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
              />
            </InputGroup>

            <Select
              placeholder="Status"
              maxW="150px"
              value={filters.status}
              onChange={e => handleFilterChange('status', e.target.value)}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="flagged">Flagged</option>
            </Select>

            <Select
              placeholder="Sort by"
              maxW="150px"
              value={filters.sortBy}
              onChange={e => handleFilterChange('sortBy', e.target.value)}
            >
              <option value="createdAt">Joined Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
            </Select>

            <Select
              placeholder="Order"
              maxW="150px"
              value={filters.sortOrder}
              onChange={e => handleFilterChange('sortOrder', e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </Select>
          </HStack>
        </CardBody>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardBody>
          {loading ? (
            <VStack spacing={4} py={8}>
              <Spinner size="lg" />
              <Text>Loading customers...</Text>
            </VStack>
          ) : customers.length === 0 ? (
            <VStack spacing={4} py={8}>
              <Text color="gray.500">No customers found</Text>
              <Button onClick={fetchCustomers} variant="outline">
                Refresh
              </Button>
            </VStack>
          ) : (
            <>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Customer</Th>
                    <Th>Contact</Th>
                    <Th>Orders</Th>
                    <Th>LTV</Th>
                    <Th>Status</Th>
                    <Th>Addresses</Th>
                    <Th>Last Order</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {customers.map(customer => (
                    <Tr key={customer.id}>
                      <Td>
                        <HStack spacing={3}>
                          <Avatar size="sm" name={customer.name} />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">{customer.name}</Text>
                            <Text fontSize="sm" color="gray.600">
                              Joined {formatDate(customer.createdAt)}
                            </Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <HStack spacing={1}>
                            <FiMail size={12} />
                            <Text fontSize="sm">{customer.email}</Text>
                          </HStack>
                          {(customer.contacts || []).length > 0 && (
                            <HStack spacing={1}>
                              <FiPhone size={12} />
                              <Text fontSize="sm">
                                {customer.contacts[0]?.phone || 'N/A'}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">
                            {customer.stats.totalOrders || 0}
                          </Text>
                          {(customer.stats.cancelledOrders || 0) > 0 && (
                            <Text fontSize="sm" color="red.500">
                              {customer.stats.cancelledOrders || 0} cancelled
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontWeight="bold">
                          £{(customer.stats.totalLtv || 0).toLocaleString()}
                        </Text>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Badge
                            colorScheme={
                              (customer.stats.totalOrders || 0) > 0
                                ? 'green'
                                : 'gray'
                            }
                          >
                            {(customer.stats.totalOrders || 0) > 0
                              ? 'Active'
                              : 'New'}
                          </Badge>
                          {(customer.stats.openTickets || 0) > 0 && (
                            <Badge colorScheme="orange" size="sm">
                              {customer.stats.openTickets || 0} tickets
                            </Badge>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm">
                            {(customer.addresses || []).length} addresses
                          </Text>
                          <Text fontSize="sm">
                            {(customer.contacts || []).length} contacts
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {customer.stats.lastOrder
                            ? formatDate(customer.stats.lastOrder)
                            : 'No orders'}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() =>
                              router.push(`/admin/customers/${customer.id}`)
                            }
                          >
                            View
                          </Button>
                          <Button size="xs" variant="outline">
                            Edit
                          </Button>
                          <Button size="xs" variant="outline">
                            Orders
                          </Button>
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <HStack justify="center" mt={6} spacing={2}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    isDisabled={pagination.page === 1}
                  >
                    Previous
                  </Button>
                  <Text fontSize="sm">
                    Page {pagination.page} of {pagination.pages}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    isDisabled={pagination.page === pagination.pages}
                  >
                    Next
                  </Button>
                </HStack>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </Box>
  );
}
