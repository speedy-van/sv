'use client';
import React, { useEffect, useState } from 'react';
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
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiRefreshCw,
  FiEye,
  FiUser,
  FiActivity,
  FiClock,
  FiAlertTriangle,
  FiShield,
} from 'react-icons/fi';

interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId: string | null;
  ip: string | null;
  userAgent: string | null;
  before: any;
  after: any;
  details: any;
}

interface AuditStats {
  totalLogs: number;
  securityEvents: number;
  financialActions: number;
  userActions: number;
}

export default function AuditPage() {
  const [mounted, setMounted] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats>({
    totalLogs: 0,
    securityEvents: 0,
    financialActions: 0,
    userActions: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    entity: '',
    actorRole: '',
    from: '',
    to: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });

  const { isOpen, onOpen, onClose } = useDisclosure();

  async function loadAuditLogs(page = 1, reset = false) {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });

      const response = await fetch(`/api/admin/audit?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();

      if (reset) {
        setLogs(data.items);
      } else {
        setLogs(prev => [...prev, ...data.items]);
      }

      setPagination({
        page,
        limit: pagination.limit,
        total: data.total || 0,
        pages: Math.ceil((data.total || 0) / pagination.limit),
      });

      // Calculate stats
      calculateStats(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }

  function calculateStats(logs: AuditLog[]) {
    const securityEvents = logs.filter(
      log =>
        log.action &&
        (log.action.includes('login') ||
          log.action.includes('password') ||
          log.action.includes('security') ||
          log.action.includes('unauthorized'))
    ).length;

    const financialActions = logs.filter(
      log =>
        log.action &&
        (log.action.includes('payment') ||
          log.action.includes('refund') ||
          log.action.includes('payout') ||
          log.action.includes('invoice'))
    ).length;

    const userActions = logs.filter(
      log =>
        log.action &&
        (log.action.includes('user') ||
          log.action.includes('profile') ||
          log.action.includes('account'))
    ).length;

    setStats({
      totalLogs: logs.length,
      securityEvents,
      financialActions,
      userActions,
    });
  }

  function handleFilterChange(key: string, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function handleSearch() {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadAuditLogs(1, true);
  }

  function handleLoadMore() {
    if (pagination.page < pagination.pages) {
      loadAuditLogs(pagination.page + 1, false);
    }
  }

  function viewLogDetails(log: AuditLog) {
    setSelectedLog(log);
    onOpen();
  }

  function getActionColor(action: string | null | undefined) {
    if (!action) return 'gray';

    if (action.includes('error') || action.includes('failed')) return 'red';
    if (action.includes('warning')) return 'yellow';
    if (action.includes('security') || action.includes('login'))
      return 'purple';
    if (action.includes('payment') || action.includes('financial'))
      return 'green';
    if (action.includes('create')) return 'blue';
    if (action.includes('update')) return 'orange';
    if (action.includes('delete')) return 'red';
    return 'gray';
  }

  function getEntityIcon(entity: string | null | undefined) {
    if (!entity) return <FiActivity />;

    switch (entity.toLowerCase()) {
      case 'user':
        return <FiUser />;
      case 'order':
        return <FiActivity />;
      case 'payment':
        return <FiShield />;
      default:
        return <FiActivity />;
    }
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Use a small delay to ensure consistent hydration
      const timer = setTimeout(() => {
        loadAuditLogs(1, true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [mounted]);

  // Don't render until component is mounted and initial data is loaded to prevent hydration issues
  if (!mounted || (loading && logs.length === 0)) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" />
        <Text mt={4}>
          {!mounted ? 'Initializing...' : 'Loading audit logs...'}
        </Text>
      </Box>
    );
  }

  // Ensure logs is always an array to prevent hydration issues
  const safeLogs = Array.isArray(logs) ? logs : [];

  // Ensure pagination is properly initialized
  const safePagination = pagination || {
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  };

  // Ensure stats is properly initialized
  const safeStats = stats || {
    totalLogs: 0,
    securityEvents: 0,
    financialActions: 0,
    userActions: 0,
  };

  // Ensure filters is properly initialized
  const safeFilters = filters || {
    search: '',
    action: '',
    entity: '',
    actorRole: '',
    from: '',
    to: '',
  };

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading size="lg">Audit Log</Heading>
          <Text color="gray.600">
            Complete audit trail of all system activities
          </Text>
        </VStack>
        <HStack spacing={3}>
          <Button
            leftIcon={<FiRefreshCw />}
            variant="outline"
            size="sm"
            onClick={() => loadAuditLogs(1, true)}
          >
            Refresh
          </Button>
          <Button leftIcon={<FiDownload />} variant="outline" size="sm">
            Export
          </Button>
        </HStack>
      </HStack>

      {/* Stats Row */}
      {safeLogs.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Logs</StatLabel>
                <StatNumber>
                  {(
                    safePagination.total ||
                    safeLogs.length ||
                    0
                  ).toLocaleString()}
                </StatNumber>
                <StatHelpText>
                  <FiActivity />
                  <span style={{ marginLeft: '4px' }}>All time</span>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Security Events</StatLabel>
                <StatNumber color="purple.500">
                  {safeStats.securityEvents}
                </StatNumber>
                <StatHelpText>
                  <FiShield />
                  <span style={{ marginLeft: '4px' }}>Last 24 hours</span>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Financial Actions</StatLabel>
                <StatNumber color="green.500">
                  {safeStats.financialActions}
                </StatNumber>
                <StatHelpText>
                  <FiActivity />
                  <span style={{ marginLeft: '4px' }}>Last 24 hours</span>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>User Actions</StatLabel>
                <StatNumber color="blue.500">
                  {safeStats.userActions}
                </StatNumber>
                <StatHelpText>
                  <FiUser />
                  <span style={{ marginLeft: '4px' }}>Last 24 hours</span>
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      )}

      {/* Filters */}
      {safeLogs.length > 0 && (
        <Card mb={6}>
          <CardBody>
            <VStack spacing={4}>
              <HStack justify="space-between" w="full">
                <Heading size="md">Filters</Heading>
                <Button
                  leftIcon={<FiFilter />}
                  colorScheme="blue"
                  size="sm"
                  onClick={handleSearch}
                >
                  Apply Filters
                </Button>
              </HStack>

              <SimpleGrid
                columns={{ base: 1, md: 2, lg: 3 }}
                spacing={4}
                w="full"
              >
                <InputGroup>
                  <InputLeftElement>
                    <FiSearch />
                  </InputLeftElement>
                  <Input
                    placeholder="Search logs..."
                    value={safeFilters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                  />
                </InputGroup>

                <Select
                  placeholder="Filter by action"
                  value={safeFilters.action}
                  onChange={e => handleFilterChange('action', e.target.value)}
                >
                  <option value="login">Login Events</option>
                  <option value="payment">Payment Actions</option>
                  <option value="order">Order Actions</option>
                  <option value="user">User Actions</option>
                  <option value="security">Security Events</option>
                </Select>

                <Select
                  placeholder="Filter by entity"
                  value={safeFilters.entity}
                  onChange={e => handleFilterChange('entity', e.target.value)}
                >
                  <option value="user">Users</option>
                  <option value="order">Orders</option>
                  <option value="payment">Payments</option>
                  <option value="driver">Drivers</option>
                  <option value="customer">Customers</option>
                </Select>

                <Select
                  placeholder="Filter by role"
                  value={safeFilters.actorRole}
                  onChange={e =>
                    handleFilterChange('actorRole', e.target.value)
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="driver">Driver</option>
                  <option value="customer">Customer</option>
                  <option value="system">System</option>
                </Select>

                <Input
                  type="date"
                  placeholder="From date"
                  value={safeFilters.from}
                  onChange={e => handleFilterChange('from', e.target.value)}
                />

                <Input
                  type="date"
                  placeholder="To date"
                  value={safeFilters.to}
                  onChange={e => handleFilterChange('to', e.target.value)}
                />
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          <AlertTitle>Error!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Audit Logs Table */}
      {safeLogs.length > 0 ? (
        <Card>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Timestamp</Th>
                  <Th>Actor</Th>
                  <Th>Role</Th>
                  <Th>Action</Th>
                  <Th>Entity</Th>
                  <Th>IP Address</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {loading && safeLogs.length === 0 ? (
                  <Tr key="loading">
                    <Td colSpan={7} textAlign="center">
                      <VStack spacing={2}>
                        <Spinner />
                        <Text>Loading audit logs...</Text>
                      </VStack>
                    </Td>
                  </Tr>
                ) : safeLogs.length === 0 ? (
                  <Tr key="empty">
                    <Td colSpan={7} textAlign="center">
                      <Text color="gray.500">No audit logs found</Text>
                    </Td>
                  </Tr>
                ) : (
                  safeLogs.map(log => (
                    <Tr key={log.id || `log-${Math.random()}`}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm">
                            {log.timestamp
                              ? new Date(log.timestamp).toLocaleDateString()
                              : 'N/A'}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {log.timestamp
                              ? new Date(log.timestamp).toLocaleTimeString()
                              : 'N/A'}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <FiUser size={12} />
                          <Text fontSize="sm">{log.actor || 'Unknown'}</Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge colorScheme="blue" size="sm">
                          {log.actorRole || 'Unknown'}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={getActionColor(log.action || '')}
                          size="sm"
                        >
                          {log.action || 'Unknown'}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          {getEntityIcon(log.entity)}
                          <Text fontSize="sm">
                            {log.entity || 'Unknown'}{' '}
                            {log.entityId ? `#${log.entityId}` : ''}
                          </Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="gray.600">
                          {log.ip || '-'}
                        </Text>
                      </Td>
                      <Td>
                        <Button
                          size="xs"
                          variant="outline"
                          leftIcon={<FiEye />}
                          onClick={() => log && viewLogDetails(log)}
                          isDisabled={!log}
                        >
                          View Details
                        </Button>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>

            {/* Load More */}
            {safeLogs.length > 0 &&
              safePagination.page < safePagination.pages && (
                <HStack justify="center" mt={4}>
                  <Button
                    onClick={handleLoadMore}
                    isLoading={loading}
                    loadingText="Loading..."
                    variant="outline"
                  >
                    Load More
                  </Button>
                </HStack>
              )}

            {loading && safeLogs.length > 0 && (
              <HStack justify="center" mt={4}>
                <Spinner />
                <Text>Loading more audit logs...</Text>
              </HStack>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <Text textAlign="center" color="gray.500" py={8}>
              No audit logs available. Try adjusting your filters or refresh the
              page.
            </Text>
          </CardBody>
        </Card>
      )}

      {/* Log Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Audit Log Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedLog ? (
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="bold">Actor</Text>
                    <Text>{selectedLog.actor || 'Unknown'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Role</Text>
                    <Text>{selectedLog.actorRole || 'Unknown'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Action</Text>
                    <Text>{selectedLog.action || 'Unknown'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Entity</Text>
                    <Text>
                      {selectedLog.entity || 'Unknown'}{' '}
                      {selectedLog.entityId ? `#${selectedLog.entityId}` : ''}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">IP Address</Text>
                    <Text>{selectedLog.ip || 'N/A'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">User Agent</Text>
                    <Text fontSize="sm" noOfLines={2}>
                      {selectedLog.userAgent || 'N/A'}
                    </Text>
                  </Box>
                </SimpleGrid>

                {selectedLog.before && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Before
                    </Text>
                    <Card variant="outline">
                      <CardBody>
                        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                          {JSON.stringify(selectedLog.before, null, 2)}
                        </pre>
                      </CardBody>
                    </Card>
                  </Box>
                )}

                {selectedLog.after && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      After
                    </Text>
                    <Card variant="outline">
                      <CardBody>
                        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                          {JSON.stringify(selectedLog.after, null, 2)}
                        </pre>
                      </CardBody>
                    </Card>
                  </Box>
                )}

                {selectedLog.details && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Additional Details
                    </Text>
                    <Card variant="outline">
                      <CardBody>
                        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                          {JSON.stringify(selectedLog.details, null, 2)}
                        </pre>
                      </CardBody>
                    </Card>
                  </Box>
                )}
              </VStack>
            ) : (
              <Text textAlign="center" color="gray.500">
                No log details available
              </Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
