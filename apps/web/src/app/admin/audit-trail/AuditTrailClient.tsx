'use client';

/**
 * Audit Trail Client Component
 * Complete audit log of all admin actions
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Button,
  Badge,
  Spinner,
  useToast,
  SimpleGrid,
  Divider,
  IconButton,
  Input,
  Select,
  FormControl,
  FormLabel,
  Code,
  Collapse,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon, ViewIcon } from '@chakra-ui/icons';

// Types
interface AuditRecord {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  adminId: string;
  adminName: string | null;
  action: string;
  previousValue: any;
  newValue: any;
  reason: string | null;
  notes: string | null;
  approvedAt: string;
}

export default function AuditTrailClient() {
  const [audits, setAudits] = useState<AuditRecord[]>([]);
  const [filteredAudits, setFilteredAudits] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<AuditRecord | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Fetch audit records
  const fetchAudits = useCallback(async () => {
    try {
      // Note: This endpoint needs to be created
      const response = await fetch('/api/admin/audit-trail');
      if (!response.ok) {
        // If endpoint doesn't exist yet, use mock data
        console.warn('Audit trail endpoint not available, using mock data');
        const mockData: AuditRecord[] = [
          {
            id: 'audit_1',
            type: 'daily_cap_breach',
            entityType: 'driver_earnings',
            entityId: 'earn_123',
            adminId: 'admin_1',
            adminName: 'Admin User',
            action: 'approved',
            previousValue: { status: 'pending_admin_review', amount: 48000 },
            newValue: { status: 'approved', approvedAmount: 48000 },
            reason: 'Approved exceptional circumstance',
            notes: 'Driver had emergency delivery',
            approvedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
          {
            id: 'audit_2',
            type: 'bonus_approval',
            entityType: 'bonus_request',
            entityId: 'bonus_456',
            adminId: 'admin_1',
            adminName: 'Admin User',
            action: 'approved',
            previousValue: { status: 'pending', requestedAmount: 5000 },
            newValue: { status: 'approved', approvedAmount: 5000 },
            reason: null,
            notes: 'Excellent customer feedback',
            approvedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          },
        ];
        setAudits(mockData);
        setFilteredAudits(mockData);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setAudits(data.audits || []);
      setFilteredAudits(data.audits || []);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      toast({
        title: 'Error loading data',
        description: 'Failed to load audit trail',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAudits();
  }, [fetchAudits]);

  // Apply filters
  useEffect(() => {
    let filtered = [...audits];

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }

    // Action filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter((a) => a.action === actionFilter);
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.entityId.toLowerCase().includes(query) ||
          a.adminName?.toLowerCase().includes(query) ||
          a.notes?.toLowerCase().includes(query) ||
          a.reason?.toLowerCase().includes(query)
      );
    }

    // Date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((a) => new Date(a.approvedAt) >= fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((a) => new Date(a.approvedAt) <= toDate);
    }

    setFilteredAudits(filtered);
  }, [audits, typeFilter, actionFilter, searchQuery, dateFrom, dateTo]);

  const handleViewDetails = (audit: AuditRecord) => {
    setSelectedAudit(audit);
    onOpen();
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      daily_cap_breach: 'Daily Cap Breach',
      bonus_approval: 'Bonus Approval',
      manual_override: 'Manual Override',
    };
    return types[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      daily_cap_breach: 'orange',
      bonus_approval: 'purple',
      manual_override: 'blue',
    };
    return colors[type] || 'gray';
  };

  const getActionColor = (action: string) => {
    return action === 'approved' ? 'green' : 'red';
  };

  const getActionLabel = (action: string) => {
    return action === 'approved' ? 'Approved' : 'Rejected';
  };

  const formatValue = (value: any) => {
    if (!value) return 'N/A';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading audit trail...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Audit Trail
          </Heading>
          <Text color="gray.600">Complete record of all admin decisions and approvals</Text>
        </Box>

        {/* Filters */}
        <Card>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Record Type</FormLabel>
                <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} size="sm">
                  <option value="all">All</option>
                  <option value="daily_cap_breach">Daily Cap Breach</option>
                  <option value="bonus_approval">Bonus Approval</option>
                  <option value="manual_override">Manual Override</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Action</FormLabel>
                <Select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} size="sm">
                  <option value="all">All</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">From Date</FormLabel>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} size="sm" />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">To Date</FormLabel>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} size="sm" />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Search</FormLabel>
                <Input
                  placeholder="ID, admin, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="sm"
                />
              </FormControl>
            </SimpleGrid>

            <HStack mt={4}>
              <Button
                size="sm"
                leftIcon={<SearchIcon />}
                onClick={() => {
                  // Filters are applied automatically via useEffect
                }}
              >
                Search
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setTypeFilter('all');
                  setActionFilter('all');
                  setSearchQuery('');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Reset
              </Button>
              <Box flex={1} />
              <Text fontSize="sm" color="gray.600">
                {filteredAudits.length} of {audits.length} records
              </Text>
            </HStack>
          </CardBody>
        </Card>

        {/* Stats */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Card>
            <CardBody>
              <Text fontSize="sm" color="gray.600">
                Total Records
              </Text>
              <Text fontSize="2xl" fontWeight="bold">
                {audits.length}
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Text fontSize="sm" color="gray.600">
                Approvals
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {audits.filter((a) => a.action === 'approved').length}
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <Text fontSize="sm" color="gray.600">
                Rejections
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="red.500">
                {audits.filter((a) => a.action === 'rejected').length}
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Audit Records */}
        {filteredAudits.length === 0 && (
          <Card>
            <CardBody>
              <Text textAlign="center" color="gray.500">
                No records match the selected filters
              </Text>
            </CardBody>
          </Card>
        )}

        {filteredAudits.map((audit) => (
          <Card key={audit.id} variant="outline">
            <CardBody>
              <VStack spacing={3} align="stretch">
                {/* Header Row */}
                <HStack justify="space-between">
                  <HStack spacing={3}>
                    <Badge colorScheme={getTypeColor(audit.type)} fontSize="sm">
                      {getTypeLabel(audit.type)}
                    </Badge>
                    <Badge colorScheme={getActionColor(audit.action)} fontSize="sm">
                      {getActionLabel(audit.action)}
                    </Badge>
                  </HStack>

                  <HStack>
                    <Text fontSize="sm" color="gray.600">
                      {new Date(audit.approvedAt).toLocaleString('ar-EG')}
                    </Text>
                    <IconButton
                      aria-label="Toggle details"
                      icon={expandedId === audit.id ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedId(expandedId === audit.id ? null : audit.id)}
                    />
                  </HStack>
                </HStack>

                {/* Summary */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Box>
                    <Text fontSize="xs" color="gray.600">
                      Admin
                    </Text>
                    <Text fontSize="sm" fontWeight="bold">
                      {audit.adminName || audit.adminId}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">
                      Entity Type
                    </Text>
                    <Text fontSize="sm">{audit.entityType}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">
                      Entity ID
                    </Text>
                    <Code fontSize="xs">{audit.entityId}</Code>
                  </Box>
                </SimpleGrid>

                {/* Expanded Details */}
                <Collapse in={expandedId === audit.id} animateOpacity>
                  <VStack spacing={3} align="stretch" pt={2}>
                    <Divider />

                    {audit.reason && (
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" mb={1}>
                          Reason:
                        </Text>
                        <Text fontSize="sm" color="gray.700">
                          {audit.reason}
                        </Text>
                      </Box>
                    )}

                    {audit.notes && (
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" mb={1}>
                          Notes:
                        </Text>
                        <Text fontSize="sm" color="gray.700" bg="gray.50" p={2} borderRadius="md">
                          {audit.notes}
                        </Text>
                      </Box>
                    )}

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" mb={2}>
                          Previous Value:
                        </Text>
                        <Code display="block" whiteSpace="pre" p={3} fontSize="xs" borderRadius="md">
                          {formatValue(audit.previousValue)}
                        </Code>
                      </Box>
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" mb={2}>
                          New Value:
                        </Text>
                        <Code display="block" whiteSpace="pre" p={3} fontSize="xs" borderRadius="md">
                          {formatValue(audit.newValue)}
                        </Code>
                      </Box>
                    </SimpleGrid>

                    <HStack pt={2}>
                      <Button size="sm" leftIcon={<ViewIcon />} onClick={() => handleViewDetails(audit)}>
                        View Full Details
                      </Button>
                    </HStack>
                  </VStack>
                </Collapse>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </VStack>

      {/* Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Audit Record Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedAudit && (
              <VStack spacing={4} align="stretch">
                <TableContainer>
                  <Table size="sm" variant="simple">
                    <Tbody>
                      <Tr>
                        <Td fontWeight="bold" width="30%">
                          Record ID
                        </Td>
                        <Td>
                          <Code>{selectedAudit.id}</Code>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="bold">Type</Td>
                        <Td>
                          <Badge colorScheme={getTypeColor(selectedAudit.type)}>
                            {getTypeLabel(selectedAudit.type)}
                          </Badge>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="bold">Action</Td>
                        <Td>
                          <Badge colorScheme={getActionColor(selectedAudit.action)}>
                            {getActionLabel(selectedAudit.action)}
                          </Badge>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="bold">Admin</Td>
                        <Td>{selectedAudit.adminName || selectedAudit.adminId}</Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="bold">Entity Type</Td>
                        <Td>{selectedAudit.entityType}</Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="bold">Entity ID</Td>
                        <Td>
                          <Code>{selectedAudit.entityId}</Code>
                        </Td>
                      </Tr>
                      <Tr>
                        <Td fontWeight="bold">Date & Time</Td>
                        <Td>{new Date(selectedAudit.approvedAt).toLocaleString('en-GB')}</Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </TableContainer>

                <Divider />

                {selectedAudit.reason && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Reason:
                    </Text>
                    <Text>{selectedAudit.reason}</Text>
                  </Box>
                )}

                {selectedAudit.notes && (
                  <Box>
                    <Text fontWeight="bold" mb={2}>
                      Notes:
                    </Text>
                    <Text bg="gray.50" p={3} borderRadius="md">
                      {selectedAudit.notes}
                    </Text>
                  </Box>
                )}

                <Divider />

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Previous Value:
                  </Text>
                  <Code display="block" whiteSpace="pre" p={4} fontSize="xs" borderRadius="md" maxH="200px" overflowY="auto">
                    {formatValue(selectedAudit.previousValue)}
                  </Code>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    New Value:
                  </Text>
                  <Code display="block" whiteSpace="pre" p={4} fontSize="xs" borderRadius="md" maxH="200px" overflowY="auto">
                    {formatValue(selectedAudit.newValue)}
                  </Code>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}
