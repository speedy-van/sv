'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  HStack,
  Button,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  useToast,
} from '@chakra-ui/react';
import { ArrowBackIcon, SearchIcon } from '@chakra-ui/icons';
import Link from 'next/link';

interface Booking {
  id: string;
  reference: string;
  status: string;
  scheduledAt: string;
  totalGBP: number;
  poNumber?: string;
  createdAt: string;
}

export default function BookingsListPage() {
  const toast = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/b2b/bookings?${params}`);
      const data = await response.json();

      if (data.success) {
        setBookings(data.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load bookings',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'gray',
      CONFIRMED: 'blue',
      ASSIGNED: 'purple',
      IN_PROGRESS: 'yellow',
      COMPLETED: 'green',
      CANCELLED: 'red',
    };
    return colors[status] || 'gray';
  };

  const filteredBookings = bookings.filter((booking) =>
    booking.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.poNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" borderBottom="1px" borderColor="gray.200" py={4}>
        <Container maxW="7xl">
          <HStack justify="space-between">
            <HStack>
              <Button
                as={Link}
                href="/company/dashboard"
                leftIcon={<ArrowBackIcon />}
                variant="ghost"
              >
                Back
              </Button>
              <Heading size="lg">My Bookings</Heading>
            </HStack>
            <Button
              as={Link}
              href="/company/dashboard/bookings/new"
              colorScheme="blue"
            >
              New Booking
            </Button>
          </HStack>
        </Container>
      </Box>

      <Container maxW="7xl" py={8}>
        <Card>
          <CardBody>
            {/* Filters */}
            <HStack mb={6} spacing={4}>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search by reference or PO..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </InputGroup>

              <Select
                maxW="200px"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            </HStack>

            {/* Table */}
            {loading ? (
              <Text color="gray.500">Loading bookings...</Text>
            ) : filteredBookings.length === 0 ? (
              <Text color="gray.500">No bookings found</Text>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Reference</Th>
                    <Th>Date</Th>
                    <Th>Status</Th>
                    <Th>PO Number</Th>
                    <Th isNumeric>Amount</Th>
                    <Th>Created</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredBookings.map((booking) => (
                    <Tr key={booking.id} _hover={{ bg: 'gray.50' }}>
                      <Td fontWeight="medium">{booking.reference}</Td>
                      <Td>
                        {new Date(booking.scheduledAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </Td>
                      <Td>{booking.poNumber || '-'}</Td>
                      <Td isNumeric>£{(booking.totalGBP / 100).toFixed(2)}</Td>
                      <Td>
                        {new Date(booking.createdAt).toLocaleDateString('en-GB')}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
}
