'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  HStack,
  VStack,
  Text,
  Badge,
  Button,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  SimpleGrid,
  InputGroup,
  InputLeftElement,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiRefreshCw,
  FiEdit,
  FiTrash2,
  FiEye,
  FiFilter,
  FiPlus,
  FiArrowRight,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface JourneyOpportunity {
  id: string;
  type: string;
  status: string;
  bookingReference: string | null;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  pickupAddress: string;
  pickupPostcode: string;
  dropoffAddress: string;
  dropoffPostcode: string;
  totalPrice: number;
  discount: number | null;
  discountPercentage: number | null;
  driverEarnings: number | null;
  matchScore: number | null;
  scheduledDate: string | null;
  itemsCount: number;
  serviceLevel: string | null;
  crewSize: string | null;
  multiDropPotential: boolean;
  potentialSavings: number | null;
  createdAt: string;
  updatedAt: string;
}

interface JourneyOpportunitiesResponse {
  success: boolean;
  data: {
    journeyOpportunities: JourneyOpportunity[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export default function JourneyOpportunitiesPage() {
  const router = useRouter();
  const toast = useToast();
  const [opportunities, setOpportunities] = useState<JourneyOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/admin/journey-opportunities?${params}`);
      const data: JourneyOpportunitiesResponse = await response.json();

      if (data.success) {
        setOpportunities(data.data.journeyOpportunities);
        setTotal(data.data.pagination.total);
        setTotalPages(data.data.pagination.totalPages);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch journey opportunities',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch journey opportunities',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, toast]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]);

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/admin/journey-opportunities/${deleteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Journey opportunity deleted successfully',
          status: 'success',
          duration: 3000,
        });
        fetchOpportunities();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to delete journey opportunity',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete journey opportunity',
        status: 'error',
        duration: 3000,
      });
    } finally {
      onClose();
      setDeleteId(null);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/journey-opportunities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Status updated to ${newStatus}`,
          status: 'success',
          duration: 3000,
        });
        fetchOpportunities();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update status',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'green';
      case 'claimed':
        return 'blue';
      case 'converted':
        return 'purple';
      case 'expired':
        return 'gray';
      default:
        return 'gray';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'new_journey':
        return 'blue';
      case 'return_journey':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      opp.customerName.toLowerCase().includes(search) ||
      opp.pickupAddress.toLowerCase().includes(search) ||
      opp.dropoffAddress.toLowerCase().includes(search) ||
      opp.pickupPostcode.toLowerCase().includes(search) ||
      opp.dropoffPostcode.toLowerCase().includes(search) ||
      (opp.bookingReference && opp.bookingReference.toLowerCase().includes(search)) ||
      (opp.customerEmail && opp.customerEmail.toLowerCase().includes(search))
    );
  });

  const stats = {
    total: total,
    available: opportunities.filter((o) => o.status.toLowerCase() === 'available').length,
    claimed: opportunities.filter((o) => o.status.toLowerCase() === 'claimed').length,
    converted: opportunities.filter((o) => o.status.toLowerCase() === 'converted').length,
    newJourney: opportunities.filter((o) => o.type.toLowerCase() === 'new_journey').length,
    returnJourney: opportunities.filter((o) => o.type.toLowerCase() === 'return_journey').length,
  };

  return (
    <Box p={8} bg="gray.900" minH="100vh">
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Heading size="lg" color="white">
            Journey Opportunities
          </Heading>
          <HStack>
            <Button
              leftIcon={<FiRefreshCw />}
              onClick={fetchOpportunities}
              isLoading={loading}
              variant="outline"
              colorScheme="blue"
            >
              Refresh
            </Button>
          </HStack>
        </Flex>

        {/* Stats */}
        <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
          <Stat bg="gray.800" p={4} borderRadius="md">
            <StatLabel color="gray.400">Total</StatLabel>
            <StatNumber color="white">{stats.total}</StatNumber>
          </Stat>
          <Stat bg="gray.800" p={4} borderRadius="md">
            <StatLabel color="gray.400">Available</StatLabel>
            <StatNumber color="green.400">{stats.available}</StatNumber>
          </Stat>
          <Stat bg="gray.800" p={4} borderRadius="md">
            <StatLabel color="gray.400">Claimed</StatLabel>
            <StatNumber color="blue.400">{stats.claimed}</StatNumber>
          </Stat>
          <Stat bg="gray.800" p={4} borderRadius="md">
            <StatLabel color="gray.400">Converted</StatLabel>
            <StatNumber color="purple.400">{stats.converted}</StatNumber>
          </Stat>
          <Stat bg="gray.800" p={4} borderRadius="md">
            <StatLabel color="gray.400">New Journey</StatLabel>
            <StatNumber color="blue.400">{stats.newJourney}</StatNumber>
          </Stat>
          <Stat bg="gray.800" p={4} borderRadius="md">
            <StatLabel color="gray.400">Return Journey</StatLabel>
            <StatNumber color="orange.400">{stats.returnJourney}</StatNumber>
          </Stat>
        </SimpleGrid>

        {/* Filters */}
        <HStack spacing={4}>
          <InputGroup flex={1}>
            <InputLeftElement pointerEvents="none">
              <FiSearch color="gray" />
            </InputLeftElement>
            <Input
              placeholder="Search by customer, address, postcode, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="gray.800"
              borderColor="gray.700"
              color="white"
              _placeholder={{ color: 'gray.500' }}
            />
          </InputGroup>
          <Select
            placeholder="All Types"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            bg="gray.800"
            borderColor="gray.700"
            color="white"
            w="200px"
          >
            <option value="NEW_JOURNEY">New Journey</option>
            <option value="RETURN_JOURNEY">Return Journey</option>
          </Select>
          <Select
            placeholder="All Statuses"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            bg="gray.800"
            borderColor="gray.700"
            color="white"
            w="200px"
          >
            <option value="AVAILABLE">Available</option>
            <option value="CLAIMED">Claimed</option>
            <option value="CONVERTED">Converted</option>
            <option value="EXPIRED">Expired</option>
          </Select>
        </HStack>

        {/* Table */}
        {loading ? (
          <Box textAlign="center" py={10}>
            <Spinner size="xl" color="blue.500" />
          </Box>
        ) : filteredOpportunities.length === 0 ? (
          <Alert status="info" variant="subtle" colorScheme="blue">
            <AlertIcon />
            No journey opportunities found
          </Alert>
        ) : (
          <Box bg="gray.800" borderRadius="md" overflow="hidden">
            <Table variant="simple" colorScheme="gray">
              <Thead bg="gray.700">
                <Tr>
                  <Th color="white">Type</Th>
                  <Th color="white">Customer</Th>
                  <Th color="white">Route</Th>
                  <Th color="white">Price</Th>
                  <Th color="white">Status</Th>
                  <Th color="white">Date</Th>
                  <Th color="white">Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredOpportunities.map((opp) => (
                  <Tr key={opp.id} _hover={{ bg: 'gray.750' }}>
                    <Td>
                      <Badge colorScheme={getTypeColor(opp.type)}>
                        {opp.type === 'NEW_JOURNEY' ? 'New' : 'Return'}
                      </Badge>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text color="white" fontWeight="medium">
                          {opp.customerName}
                        </Text>
                        {opp.customerEmail && (
                          <Text color="gray.400" fontSize="sm">
                            {opp.customerEmail}
                          </Text>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text color="white" fontSize="sm">
                          📍 {opp.pickupPostcode}
                        </Text>
                        <Text color="gray.400" fontSize="xs">
                          → {opp.dropoffPostcode}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={0}>
                        <Text color="white" fontWeight="bold">
                          £{opp.totalPrice.toFixed(2)}
                        </Text>
                        {opp.discount && opp.discount > 0 && (
                          <Text color="green.400" fontSize="xs">
                            -£{opp.discount.toFixed(2)} ({opp.discountPercentage?.toFixed(0)}%)
                          </Text>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(opp.status)}>
                        {opp.status}
                      </Badge>
                    </Td>
                    <Td>
                      <Text color="gray.400" fontSize="sm">
                        {opp.scheduledDate
                          ? new Date(opp.scheduledDate).toLocaleDateString()
                          : 'Not scheduled'}
                      </Text>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          aria-label="View details"
                          icon={<FiEye />}
                          size="sm"
                          onClick={() => router.push(`/admin/journey-opportunities/${opp.id}`)}
                          colorScheme="blue"
                          variant="ghost"
                        />
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            aria-label="More actions"
                            icon={<FiArrowRight />}
                            size="sm"
                            variant="ghost"
                          />
                          <MenuList bg="gray.800" borderColor="gray.700">
                            {opp.status !== 'available' && (
                              <MenuItem
                                icon={<FiEdit />}
                                onClick={() => handleStatusUpdate(opp.id, 'AVAILABLE')}
                                bg="gray.800"
                                _hover={{ bg: 'gray.700' }}
                              >
                                Mark as Available
                              </MenuItem>
                            )}
                            {opp.status !== 'claimed' && (
                              <MenuItem
                                icon={<FiEdit />}
                                onClick={() => handleStatusUpdate(opp.id, 'CLAIMED')}
                                bg="gray.800"
                                _hover={{ bg: 'gray.700' }}
                              >
                                Mark as Claimed
                              </MenuItem>
                            )}
                            {opp.status !== 'converted' && (
                              <MenuItem
                                icon={<FiEdit />}
                                onClick={() => handleStatusUpdate(opp.id, 'CONVERTED')}
                                bg="gray.800"
                                _hover={{ bg: 'gray.700' }}
                              >
                                Mark as Converted
                              </MenuItem>
                            )}
                            <MenuItem
                              icon={<FiTrash2 />}
                              onClick={() => {
                                setDeleteId(opp.id);
                                onOpen();
                              }}
                              bg="gray.800"
                              _hover={{ bg: 'red.600' }}
                              color="red.400"
                            >
                              Delete
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <HStack justify="center" spacing={2}>
            <Button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              isDisabled={page === 1}
              variant="outline"
              colorScheme="blue"
            >
              Previous
            </Button>
            <Text color="white">
              Page {page} of {totalPages}
            </Text>
            <Button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              isDisabled={page === totalPages}
              variant="outline"
              colorScheme="blue"
            >
              Next
            </Button>
          </HStack>
        )}
      </VStack>

      {/* Delete Confirmation Dialog */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" borderColor="gray.700">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              Delete Journey Opportunity
            </AlertDialogHeader>
            <AlertDialogBody color="gray.300">
              Are you sure? This action cannot be undone. This will permanently delete the journey
              opportunity.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant="ghost" colorScheme="gray">
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

