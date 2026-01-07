'use client';

/**
 * B2B Companies List Dashboard Component
 * 
 * Displays a list of all B2B companies with filtering, search, and management
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Container,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Skeleton,
  Stat,
  StatLabel,
  StatNumber,
  Table,
  TableContainer,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useToast,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiBriefcase,
  FiPlus,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiEye,
  FiEdit,
  FiUserX,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiUsers,
  FiKey,
  FiCreditCard,
} from 'react-icons/fi';
import CreateCompanyDialog from './CreateCompanyDialog';

interface Company {
  id: string;
  name: string;
  legalName?: string;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  creditLimitGBP: number;
  currentBalanceGBP: number;
  createdAt: string;
  _count: {
    CompanyUser: number;
    CompanyBooking: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusConfig = {
  PENDING: { label: 'Pending', colorScheme: 'yellow', icon: FiClock },
  ACTIVE: { label: 'Active', colorScheme: 'green', icon: FiCheckCircle },
  SUSPENDED: { label: 'Suspended', colorScheme: 'red', icon: FiUserX },
  CLOSED: { label: 'Closed', colorScheme: 'gray', icon: FiAlertTriangle },
};

export default function CompaniesListDashboard() {
  const router = useRouter();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const theadBg = useColorModeValue('gray.50', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.700');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    totalCredit: 0,
  });

  const fetchCompanies = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      
      if (search) params.set('search', search);
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`/api/admin/companies?${params}`);
      const data = await response.json();

      if (data.success) {
        setCompanies(data.data);
        setPagination(data.pagination);
        
        // Calculate stats
        const activeCount = data.data.filter((c: Company) => c.status === 'ACTIVE').length;
        const pendingCount = data.data.filter((c: Company) => c.status === 'PENDING').length;
        const totalCredit = data.data.reduce((sum: number, c: Company) => sum + c.creditLimitGBP, 0);
        
        setStats({
          total: data.pagination.total,
          active: activeCount,
          pending: pendingCount,
          totalCredit,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load companies',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load companies',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, toast]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleStatusChange = async (companyId: string, action: 'activate' | 'suspend') => {
    try {
      const response = await fetch(`/api/admin/companies/${companyId}`, {
        method: action === 'suspend' ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          action === 'activate' 
            ? { status: 'ACTIVE' } 
            : { action: 'suspend', reason: 'Admin action' }
        ),
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: `Company ${action}d successfully`,
          status: 'success',
          duration: 3000,
        });
        fetchCompanies(pagination?.page || 1);
      } else {
        toast({
          title: 'Error',
          description: data.error || `Failed to ${action} company`,
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error(`Error ${action}ing company:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} company`,
        status: 'error',
        duration: 5000,
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount / 100);
  };

  return (
    <Container maxW="container.2xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" display="flex" alignItems="center" gap={2} mb={2}>
              <Icon as={FiBriefcase} />
              B2B Companies
            </Heading>
            <Text color="gray.500">
              Manage corporate accounts, API keys, and pricing
            </Text>
          </Box>
          <Button
            colorScheme="primary"
            leftIcon={<Icon as={FiPlus} />}
            onClick={() => setShowCreateDialog(true)}
          >
            Add Company
          </Button>
        </Flex>

        {/* Stats Cards */}
        <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Total Companies</StatLabel>
                <StatNumber fontSize="3xl">{stats.total}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Active</StatLabel>
                <StatNumber fontSize="3xl" color="green.500">{stats.active}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Pending Approval</StatLabel>
                <StatNumber fontSize="3xl" color="yellow.500">{stats.pending}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          <Card bg={cardBg} borderColor={borderColor}>
            <CardBody>
              <Stat>
                <StatLabel color="gray.500">Total Credit Limit</StatLabel>
                <StatNumber fontSize="3xl">{formatCurrency(stats.totalCredit)}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Filters and Table */}
        <Card bg={cardBg} borderColor={borderColor}>
          <CardHeader>
            <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
              <InputGroup flex="1">
                <InputLeftElement>
                  <Icon as={FiSearch} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search companies..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </InputGroup>
              <HStack>
                <Icon as={FiFilter} color="gray.400" />
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  w="200px"
                >
                  <option value="all">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="CLOSED">Closed</option>
                </Select>
              </HStack>
            </Flex>
          </CardHeader>
          <CardBody>
            {loading ? (
              <VStack spacing={4}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} height="60px" w="full" />
                ))}
              </VStack>
            ) : companies.length === 0 ? (
              <VStack py={12} spacing={4}>
                <Icon as={FiBriefcase} boxSize={12} color="gray.400" />
                <Heading size="md" color="gray.600">No companies found</Heading>
                <Text color="gray.500">
                  {search || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by adding your first B2B company'}
                </Text>
              </VStack>
            ) : (
              <>
                <TableContainer overflowX="auto">
                  <Table variant="simple" size="md">
                    <Thead bg={theadBg}>
                      <Tr>
                        <Th fontSize="xs" textTransform="uppercase" letterSpacing="wide">Company</Th>
                        <Th fontSize="xs" textTransform="uppercase" letterSpacing="wide">Status</Th>
                        <Th fontSize="xs" textTransform="uppercase" letterSpacing="wide">Users</Th>
                        <Th fontSize="xs" textTransform="uppercase" letterSpacing="wide">Bookings</Th>
                        <Th fontSize="xs" textTransform="uppercase" letterSpacing="wide">Credit Limit</Th>
                        <Th fontSize="xs" textTransform="uppercase" letterSpacing="wide">Balance</Th>
                        <Th fontSize="xs" textTransform="uppercase" letterSpacing="wide" textAlign="right">Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {companies.map((company) => {
                        const StatusIcon = statusConfig[company.status].icon;
                        return (
                          <Tr 
                            key={company.id}
                            _hover={{ bg: rowHoverBg }}
                            transition="background 0.2s"
                          >
                            <Td>
                              <Box>
                                <Text fontWeight="semibold" fontSize="md">{company.name}</Text>
                                {company.legalName && (
                                  <Text fontSize="sm" color="gray.500">
                                    {company.legalName}
                                  </Text>
                                )}
                              </Box>
                            </Td>
                            <Td>
                              <Tag colorScheme={statusConfig[company.status].colorScheme}>
                                <Icon as={StatusIcon} mr={1} />
                                {statusConfig[company.status].label}
                              </Tag>
                            </Td>
                            <Td>
                              <HStack>
                                <Icon as={FiUsers} color="gray.400" />
                                <Text>{company._count.CompanyUser}</Text>
                              </HStack>
                            </Td>
                            <Td>{company._count.CompanyBooking}</Td>
                            <Td>{formatCurrency(company.creditLimitGBP)}</Td>
                            <Td>
                              <Text
                                color={company.currentBalanceGBP > company.creditLimitGBP * 0.8 ? 'red.500' : undefined}
                                fontWeight={company.currentBalanceGBP > company.creditLimitGBP * 0.8 ? 'medium' : undefined}
                              >
                                {formatCurrency(company.currentBalanceGBP)}
                              </Text>
                            </Td>
                            <Td>
                              <HStack spacing={2} justify="flex-end">
                                <Button
                                  size="sm"
                                  colorScheme="blue"
                                  leftIcon={<Icon as={FiEye} />}
                                  onClick={() => router.push(`/admin/b2b/companies/${company.id}`)}
                                >
                                  View
                                </Button>
                                <Menu placement="bottom-end">
                                  <MenuButton
                                    as={IconButton}
                                    icon={<Icon as={FiMoreVertical} />}
                                    variant="outline"
                                    size="sm"
                                    aria-label="More actions"
                                  />
                                  <MenuList zIndex={10}>
                                    <MenuItem
                                      icon={<Icon as={FiEdit} />}
                                      onClick={() => router.push(`/admin/b2b/companies/${company.id}?tab=edit`)}
                                    >
                                      Edit Company
                                    </MenuItem>
                                    <MenuItem
                                      icon={<Icon as={FiKey} />}
                                      onClick={() => router.push(`/admin/b2b/companies/${company.id}?tab=apikeys`)}
                                    >
                                      API Keys
                                    </MenuItem>
                                    <MenuItem
                                      icon={<Icon as={FiCreditCard} />}
                                      onClick={() => router.push(`/admin/b2b/companies/${company.id}?tab=pricing`)}
                                    >
                                      Pricing Rules
                                    </MenuItem>
                                    {company.status === 'PENDING' && (
                                      <MenuItem
                                        icon={<Icon as={FiCheckCircle} />}
                                        onClick={() => handleStatusChange(company.id, 'activate')}
                                        color="green.500"
                                      >
                                        Activate
                                      </MenuItem>
                                    )}
                                    {company.status === 'ACTIVE' && (
                                      <MenuItem
                                        icon={<Icon as={FiUserX} />}
                                        onClick={() => handleStatusChange(company.id, 'suspend')}
                                        color="red.500"
                                      >
                                        Suspend
                                      </MenuItem>
                                    )}
                                    {company.status === 'SUSPENDED' && (
                                      <MenuItem
                                        icon={<Icon as={FiCheckCircle} />}
                                        onClick={() => handleStatusChange(company.id, 'activate')}
                                        color="green.500"
                                      >
                                        Reactivate
                                      </MenuItem>
                                    )}
                                  </MenuList>
                                </Menu>
                              </HStack>
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <Flex justify="center" gap={2} mt={4}>
                    <Button
                      size="sm"
                      variant="outline"
                      isDisabled={pagination.page === 1}
                      onClick={() => fetchCompanies(pagination.page - 1)}
                    >
                      Previous
                    </Button>
                    <Flex align="center" px={4}>
                      <Text fontSize="sm" color="gray.500">
                        Page {pagination.page} of {pagination.totalPages}
                      </Text>
                    </Flex>
                    <Button
                      size="sm"
                      variant="outline"
                      isDisabled={pagination.page === pagination.totalPages}
                      onClick={() => fetchCompanies(pagination.page + 1)}
                    >
                      Next
                    </Button>
                  </Flex>
                )}
              </>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Create Company Dialog */}
      <CreateCompanyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          fetchCompanies();
          setShowCreateDialog(false);
        }}
      />
    </Container>
  );
}
