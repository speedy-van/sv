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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Avatar,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Divider,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Input,
  Textarea,
  Select,
} from '@chakra-ui/react';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiPackage,
  FiMessageSquare,
  FiFileText,
  FiDollarSign,
  FiFlag,
  FiDownload,
  FiRefreshCw,
  FiEdit,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface CustomerDetailPageProps {
  params: {
    id: string;
  };
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
  joinedAt?: string;
  emailVerified: boolean;
  cancellations?: number;
  totalOrders?: number;
  lastOrder?: any;
  invoices?: any[];
  stats: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalLtv: number;
    openTickets: number;
    urgentTickets: number;
    addressesCount: number;
    contactsCount: number;
  };
  orders: Array<{
    id: string;
    ref: string;
    status: string;
    amount: number;
    date: string;
    items: string[];
  }>;
  addresses: Array<{
    id: string;
    label: string;
    line1: string;
    line2: string;
    city: string;
    postcode: string;
    floor: string;
    flat: string;
    lift: boolean;
    notes: string;
    isDefault: boolean;
    createdAt: string;
    type?: string;
    address?: string;
  }>;
  contacts: Array<{
    id: string;
    label: string;
    name: string;
    phone: string;
    email: string;
    notes: string;
    isDefault: boolean;
    createdAt: string;
    relationship?: string;
  }>;
  supportTickets: Array<{
    id: string;
    category: string;
    orderRef: string;
    description: string;
    email: string;
    phone: string;
    status: string;
    priority: string;
    attachments: string[];
    createdAt: string;
    updatedAt: string;
    subject?: string;
    resolvedAt?: string;
    responses: Array<{
      id: string;
      message: string;
      isFromSupport: boolean;
      attachments: string[];
      createdAt: string;
    }>;
  }>;
  notificationPrefs?: any;
}

export default function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [actionData, setActionData] = useState({
    action: '',
    amount: '',
    reason: '',
    bookingId: '',
    notes: '',
  });

  const toast = useToast();
  const router = useRouter();

  // Fetch customer data from API
  const fetchCustomer = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/customers/${params.id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Customer not found');
        }
        throw new Error('Failed to fetch customer');
      }

      const data: Customer = await response.json();
      setCustomer(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: 'Error',
        description: 'Failed to fetch customer data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Load customer data on mount
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/customers/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch customer data');
        }
        const data: Customer = await response.json();
        setCustomer(data);
      } catch (error) {
        console.error('Error fetching customer:', error);
        toast({
          title: 'Error',
          description: 'Failed to load customer data',
          status: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [params.id, toast]);

  // Handle customer actions
  const handleAction = async () => {
    if (!customer) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/admin/customers/${customer.id}/actions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(actionData),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to process action');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: result.message,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      setActionData({
        action: '',
        amount: '',
        reason: '',
        bookingId: '',
        notes: '',
      });

      // Refresh customer data
      fetchCustomer();
    } catch (err) {
      toast({
        title: 'Error',
        description:
          err instanceof Error ? err.message : 'Failed to process action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle action modal
  const openActionModal = (action: string, bookingId?: string) => {
    setActionData({
      action,
      amount: '',
      reason: '',
      bookingId: bookingId || '',
      notes: '',
    });
    onOpen();
  };

  if (loading) {
    return (
      <Box>
        <VStack spacing={4} py={8}>
          <Spinner size="lg" />
          <Text>Loading customer data...</Text>
        </VStack>
      </Box>
    );
  }

  if (error || !customer) {
    return (
      <Box>
        <Alert status="error" mb={6}>
          <AlertIcon />
          {error || 'Customer not found'}
        </Alert>
        <Button
          onClick={() => router.push('/admin/customers')}
          variant="outline"
        >
          Back to Customers
        </Button>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'inactive':
        return 'gray';
      case 'flagged':
        return 'red';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      case 'resolved':
        return 'green';
      case 'open':
        return 'yellow';
      case 'paid':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'red';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Box>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <HStack spacing={4}>
          <Avatar size="lg" name={customer.name} />
          <VStack align="start" spacing={1}>
            <Heading size="lg">{customer.name}</Heading>
            <HStack spacing={2}>
              <Badge
                colorScheme={customer.stats.totalOrders > 0 ? 'green' : 'gray'}
              >
                {customer.stats.totalOrders > 0 ? 'Active' : 'New'}
              </Badge>
              {customer.emailVerified && (
                <Badge colorScheme="blue" variant="outline">
                  Verified
                </Badge>
              )}
              {customer.stats.openTickets > 0 && (
                <Badge colorScheme="orange">
                  {customer.stats.openTickets} Open Tickets
                </Badge>
              )}
            </HStack>
            <Text color="gray.600">
              Joined {new Date(customer.createdAt).toLocaleDateString()}
            </Text>
          </VStack>
        </HStack>
        <HStack spacing={3}>
          <Button
            leftIcon={<FiRefreshCw />}
            variant="outline"
            size="sm"
            onClick={fetchCustomer}
            isLoading={loading}
          >
            Refresh
          </Button>
          <Button
            leftIcon={<FiFlag />}
            variant="outline"
            size="sm"
            onClick={() => openActionModal('add_flag')}
          >
            Flag Customer
          </Button>
          <Button
            leftIcon={<FiDownload />}
            variant="outline"
            size="sm"
            onClick={() => openActionModal('export_data')}
          >
            Export Data
          </Button>
          <Button colorScheme="blue" size="sm">
            Edit Profile
          </Button>
        </HStack>
      </HStack>

      {/* Stats Row */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Orders</StatLabel>
              <StatNumber>{customer.stats.totalOrders}</StatNumber>
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
              <StatLabel>Lifetime Value</StatLabel>
              <StatNumber>
                £{(customer.stats.totalLtv || 0).toLocaleString()}
              </StatNumber>
              <StatHelpText>
                <FiDollarSign
                  style={{ display: 'inline', marginRight: '4px' }}
                />
                Total spent
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Cancellations</StatLabel>
              <StatNumber>{customer.stats.cancelledOrders}</StatNumber>
              <StatHelpText>
                <FiFlag style={{ display: 'inline', marginRight: '4px' }} />
                Rate:{' '}
                {(
                  ((customer.cancellations || 0) /
                    (customer.totalOrders || 1)) *
                  100
                ).toFixed(1)}
                %
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Member Since</StatLabel>
              <StatNumber>
                {new Date(
                  customer.joinedAt || customer.createdAt
                ).getFullYear()}
              </StatNumber>
              <StatHelpText>
                <FiUser style={{ display: 'inline', marginRight: '4px' }} />
                {new Date(
                  customer.joinedAt || customer.createdAt
                ).toLocaleDateString()}
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Tabs>
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Orders</Tab>
          <Tab>Support</Tab>
          <Tab>Invoices</Tab>
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
              <VStack spacing={6} align="stretch">
                {/* Contact Information */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Contact Information
                    </Heading>
                    <VStack spacing={4} align="stretch">
                      <HStack>
                        <FiMail />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">Email</Text>
                          <Text>{customer.email}</Text>
                        </VStack>
                      </HStack>
                      <HStack>
                        <FiPhone />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">Phone</Text>
                          <Text>{customer.phone}</Text>
                        </VStack>
                      </HStack>
                      <HStack>
                        <FiUser />
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">Last Order</Text>
                          <Text>
                            {customer.lastOrder
                              ? new Date(
                                  customer.lastOrder
                                ).toLocaleDateString()
                              : 'No orders'}
                          </Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Saved Addresses */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Saved Addresses
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      {(customer.addresses || []).map(address => (
                        <HStack
                          key={address.id}
                          justify="space-between"
                          p={3}
                          bg="gray.50"
                          borderRadius="md"
                        >
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <FiMapPin />
                              <Text
                                fontWeight="bold"
                                textTransform="capitalize"
                              >
                                {address.type || 'Address'}
                              </Text>
                              {address.isDefault && (
                                <Badge colorScheme="green" size="sm">
                                  Default
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="sm">
                              {address.address ||
                                `${address.line1}, ${address.city}`}
                            </Text>
                          </VStack>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </HStack>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

                {/* Emergency Contacts */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Emergency Contacts
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      {(customer.contacts || []).map(contact => (
                        <HStack
                          key={contact.id}
                          justify="space-between"
                          p={3}
                          bg="gray.50"
                          borderRadius="md"
                        >
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">{contact.name}</Text>
                            <Text fontSize="sm" color="gray.600">
                              {contact.relationship || 'Contact'}
                            </Text>
                            <Text fontSize="sm">{contact.phone}</Text>
                            <Text fontSize="sm">{contact.email}</Text>
                          </VStack>
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                        </HStack>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>

              <VStack spacing={6} align="stretch">
                {/* Quick Actions */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Quick Actions
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <Button
                        leftIcon={<FiPackage />}
                        colorScheme="blue"
                        size="sm"
                      >
                        Create New Order
                      </Button>
                      <Button
                        leftIcon={<FiMessageSquare />}
                        variant="outline"
                        size="sm"
                      >
                        Send Message
                      </Button>
                      <Button
                        leftIcon={<FiDollarSign />}
                        variant="outline"
                        size="sm"
                      >
                        Issue Refund
                      </Button>
                      <Button
                        leftIcon={<FiFileText />}
                        variant="outline"
                        size="sm"
                      >
                        Generate Invoice
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardBody>
                    <Heading size="md" mb={4}>
                      Recent Activity
                    </Heading>
                    <VStack spacing={3} align="stretch">
                      <HStack justify="space-between">
                        <Text fontSize="sm">Order completed</Text>
                        <Text fontSize="sm" color="gray.600">
                          2 days ago
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Support ticket opened</Text>
                        <Text fontSize="sm" color="gray.600">
                          1 day ago
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="sm">Payment received</Text>
                        <Text fontSize="sm" color="gray.600">
                          3 days ago
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </Grid>
          </TabPanel>

          {/* Orders Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>
                  Order History
                </Heading>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Order Ref</Th>
                      <Th>Date</Th>
                      <Th>Items</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(customer.orders || []).map(order => (
                      <Tr key={order.id}>
                        <Td>
                          <Text fontWeight="bold">{order.ref}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {new Date(order.date).toLocaleDateString()}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {(order.items || []).join(', ')}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontWeight="bold">
                            £{(order.amount || 0).toFixed(2)}
                          </Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Button size="xs" variant="outline">
                              View
                            </Button>
                            {order.status === 'completed' && (
                              <Button size="xs" variant="outline">
                                Refund
                              </Button>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Support Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>
                  Support Tickets
                </Heading>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Subject</Th>
                      <Th>Status</Th>
                      <Th>Priority</Th>
                      <Th>Created</Th>
                      <Th>Resolved</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(customer.supportTickets || []).map(ticket => (
                      <Tr key={ticket.id}>
                        <Td>
                          <Text fontWeight="bold">{ticket.subject}</Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(ticket.status)}>
                            {ticket.status}
                          </Badge>
                        </Td>
                        <Td>
                          <Badge
                            colorScheme={getPriorityColor(ticket.priority)}
                          >
                            {ticket.priority}
                          </Badge>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {ticket.resolvedAt
                              ? new Date(ticket.resolvedAt).toLocaleDateString()
                              : '-'}
                          </Text>
                        </Td>
                        <Td>
                          <Button size="xs" variant="outline">
                            View
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Invoices Tab */}
          <TabPanel>
            <Card>
              <CardBody>
                <Heading size="md" mb={4}>
                  Invoices
                </Heading>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Invoice Ref</Th>
                      <Th>Date</Th>
                      <Th>Due Date</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {(customer.invoices || []).map(invoice => (
                      <Tr key={invoice.id}>
                        <Td>
                          <Text fontWeight="bold">{invoice.ref}</Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {invoice.date
                              ? new Date(invoice.date).toLocaleDateString()
                              : 'N/A'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {invoice.dueDate
                              ? new Date(invoice.dueDate).toLocaleDateString()
                              : 'N/A'}
                          </Text>
                        </Td>
                        <Td>
                          <Text fontWeight="bold">
                            £{(invoice.amount || 0).toFixed(2)}
                          </Text>
                        </Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Button size="xs" variant="outline">
                              View
                            </Button>
                            <Button size="xs" variant="outline">
                              Download
                            </Button>
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Action Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {actionData.action === 'issue_refund' && 'Issue Refund'}
            {actionData.action === 'issue_credit' && 'Issue Credit'}
            {actionData.action === 'add_flag' && 'Flag Customer'}
            {actionData.action === 'remove_flag' && 'Remove Flag'}
            {actionData.action === 'export_data' && 'Export Customer Data'}
            {actionData.action === 'resend_invoice' && 'Resend Invoice'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {actionData.action === 'issue_refund' && (
              <VStack spacing={4}>
                <Select
                  placeholder="Select booking"
                  value={actionData.bookingId}
                  onChange={e =>
                    setActionData(prev => ({
                      ...prev,
                      bookingId: e.target.value,
                    }))
                  }
                >
                  {(customer.orders || [])
                    .filter(b => b.status === 'completed')
                    .map(booking => (
                      <option key={booking.id} value={booking.id}>
                        {booking.ref} - £{(booking.amount || 0).toFixed(2)}
                      </option>
                    ))}
                </Select>
                <Input
                  placeholder="Amount (£)"
                  type="number"
                  step="0.01"
                  value={actionData.amount}
                  onChange={e =>
                    setActionData(prev => ({ ...prev, amount: e.target.value }))
                  }
                />
                <Select
                  placeholder="Reason"
                  value={actionData.reason}
                  onChange={e =>
                    setActionData(prev => ({ ...prev, reason: e.target.value }))
                  }
                >
                  <option value="customer_request">Customer Request</option>
                  <option value="service_issue">Service Issue</option>
                  <option value="billing_error">Billing Error</option>
                  <option value="other">Other</option>
                </Select>
                <Textarea
                  placeholder="Additional notes"
                  value={actionData.notes}
                  onChange={e =>
                    setActionData(prev => ({ ...prev, notes: e.target.value }))
                  }
                />
              </VStack>
            )}

            {actionData.action === 'issue_credit' && (
              <VStack spacing={4}>
                <Input
                  placeholder="Amount (£)"
                  type="number"
                  step="0.01"
                  value={actionData.amount}
                  onChange={e =>
                    setActionData(prev => ({ ...prev, amount: e.target.value }))
                  }
                />
                <Select
                  placeholder="Reason"
                  value={actionData.reason}
                  onChange={e =>
                    setActionData(prev => ({ ...prev, reason: e.target.value }))
                  }
                >
                  <option value="compensation">Compensation</option>
                  <option value="loyalty">Loyalty Credit</option>
                  <option value="promotion">Promotion</option>
                  <option value="other">Other</option>
                </Select>
                <Textarea
                  placeholder="Additional notes"
                  value={actionData.notes}
                  onChange={e =>
                    setActionData(prev => ({ ...prev, notes: e.target.value }))
                  }
                />
              </VStack>
            )}

            {(actionData.action === 'add_flag' ||
              actionData.action === 'remove_flag') && (
              <VStack spacing={4}>
                <Select
                  placeholder="Reason"
                  value={actionData.reason}
                  onChange={e =>
                    setActionData(prev => ({ ...prev, reason: e.target.value }))
                  }
                >
                  <option value="payment_issues">Payment Issues</option>
                  <option value="service_complaints">Service Complaints</option>
                  <option value="fraud_suspicion">Fraud Suspicion</option>
                  <option value="other">Other</option>
                </Select>
                <Textarea
                  placeholder="Additional notes"
                  value={actionData.notes}
                  onChange={e =>
                    setActionData(prev => ({ ...prev, notes: e.target.value }))
                  }
                />
              </VStack>
            )}

            {actionData.action === 'export_data' && (
              <VStack spacing={4}>
                <Text>This will export all customer data including:</Text>
                <Text fontSize="sm" color="gray.600">
                  • Personal information
                  <br />
                  • Order history
                  <br />
                  • Addresses and contacts
                  <br />
                  • Support tickets
                  <br />• Payment information
                </Text>
                <Text fontSize="sm" color="blue.600">
                  This action is logged for GDPR compliance.
                </Text>
              </VStack>
            )}

            {actionData.action === 'resend_invoice' && (
              <VStack spacing={4}>
                <Select
                  placeholder="Select booking"
                  value={actionData.bookingId}
                  onChange={e =>
                    setActionData(prev => ({
                      ...prev,
                      bookingId: e.target.value,
                    }))
                  }
                >
                  {(customer.orders || [])
                    .filter(b => b.status === 'completed')
                    .map(booking => (
                      <option key={booking.id} value={booking.id}>
                        {booking.ref} - £{(booking.amount || 0).toFixed(2)}
                      </option>
                    ))}
                </Select>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleAction}
              isLoading={actionLoading}
            >
              {actionData.action === 'export_data' ? 'Export Data' : 'Confirm'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
