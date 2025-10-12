'use client';

import React, { useState } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Text,
  Badge,
  HStack,
  VStack,
  Flex,
  Button,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  FaPoundSign,
  FaFileInvoice,
  FaUndo,
  FaMoneyBillWave,
  FaChartLine,
  FaDownload,
  FaEye,
  FaEdit,
  FaEnvelope,
  FaPrint,
  FaPlus,
  FaEllipsisV,
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaClock,
  FaUser,
  FaCalendar,
} from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';

interface FinanceData {
  recentInvoices: any[];
  pendingRefunds: any[];
  driverPayouts: any[];
  earningsBreakdown: {
    baseAmount: number;
    surgeAmount: number;
    tipAmount: number;
    feeAmount: number;
    netAmount: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    totalOrders: number;
  };
}

interface FinanceClientProps {
  data: FinanceData;
}

export default function FinanceClient({ data }: FinanceClientProps) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [refundForm, setRefundForm] = useState({
    amount: '',
    reason: '',
    type: 'full',
  });

  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const formatCurrency = (totalGBP: number | null | undefined) => {
    if (totalGBP == null) return '£0.00';
    return `£${(totalGBP / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const formatRelativeTime = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'N/A';
    }
  };

  const handleIssueRefund = async (bookingId: string) => {
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
          bookingId,
          totalGBP: parseFloat(refundForm.amount) * 100,
          reason: refundForm.reason,
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
        setRefundForm({ amount: '', reason: '', type: 'full' });
        onClose();
        // Refresh data
        window.location.reload();
      } else {
        throw new Error('Refund failed');
      }
    } catch (error) {
      toast({
        title: 'Refund failed',
        description: 'Failed to process refund',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
        // Refresh data
        window.location.reload();
      } else {
        throw new Error('Payout processing failed');
      }
    } catch (error) {
      toast({
        title: 'Payout processing failed',
        description: 'Failed to process payout',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Finance Hub</Heading>
        <HStack spacing={4}>
          <Button leftIcon={<FaDownload />} variant="outline">
            Export Reports
          </Button>
          <Button leftIcon={<FaPlus />} colorScheme="blue" onClick={onOpen}>
            Issue Refund
          </Button>
        </HStack>
      </Flex>

      {/* Financial Overview */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Card>
          <CardBody>
            <Stat>
              <StatLabel>30-Day Revenue</StatLabel>
              <StatNumber>
                {formatCurrency(data.revenueMetrics.totalRevenue)}
              </StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                12.5%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Total Orders</StatLabel>
              <StatNumber>{data.revenueMetrics.totalOrders}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                8.2%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Driver Earnings</StatLabel>
              <StatNumber>
                {formatCurrency(data.earningsBreakdown.netAmount)}
              </StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                15.3%
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <Stat>
              <StatLabel>Pending Payouts</StatLabel>
              <StatNumber>{data.driverPayouts.length}</StatNumber>
              <StatHelpText>
                <StatArrow type="decrease" />2 processed
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Main Content */}
      <Tabs
        index={parseInt(selectedTab)}
        onChange={index => setSelectedTab(index.toString())}
      >
        <TabList>
          <Tab>Overview</Tab>
          <Tab>Invoices</Tab>
          <Tab>Refunds</Tab>
          <Tab>Payouts</Tab>
          <Tab>Ledger</Tab>
        </TabList>

        <TabPanels>
          {/* Overview Tab */}
          <TabPanel>
            <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <Heading size="md">Recent Financial Activity</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <Text fontWeight="bold" color="gray.600">
                      Recent Invoices
                    </Text>
                    {data.recentInvoices.slice(0, 5).map(invoice => (
                      <Flex
                        key={invoice.id}
                        justify="space-between"
                        align="center"
                        p={3}
                        border="1px"
                        borderColor="gray.200"
                        borderRadius="md"
                      >
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold">
                            #{invoice.invoiceNumber || 'N/A'}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {invoice.customer?.name || 'Unknown Customer'}
                          </Text>
                          <Text fontSize="sm" color="gray.500">
                            {formatDate(invoice.paidAt)}
                          </Text>
                        </VStack>
                        <VStack align="end" spacing={1}>
                          <Text fontWeight="bold">
                            {formatCurrency(invoice.totalGBP)}
                          </Text>
                          <Badge colorScheme="green">Paid</Badge>
                        </VStack>
                      </Flex>
                    ))}
                  </VStack>
                </CardBody>
              </Card>

              {/* Quick Actions */}
              <VStack spacing={6} align="stretch">
                <Card>
                  <CardHeader>
                    <Heading size="md">Quick Actions</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Button
                        leftIcon={<FaFileInvoice />}
                        variant="outline"
                        size="sm"
                      >
                        Generate Invoice
                      </Button>
                      <Button leftIcon={<FaUndo />} variant="outline" size="sm">
                        Issue Refund
                      </Button>
                      <Button
                        leftIcon={<FaMoneyBillWave />}
                        variant="outline"
                        size="sm"
                      >
                        Process Payouts
                      </Button>
                      <Button
                        leftIcon={<FaChartLine />}
                        variant="outline"
                        size="sm"
                      >
                        View Reports
                      </Button>
                    </VStack>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="md">Alerts</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      {data.pendingRefunds.length > 0 && (
                        <Alert status="warning" size="sm">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>Pending Refunds</AlertTitle>
                            <AlertDescription>
                              {data.pendingRefunds.length} refunds awaiting
                              processing
                            </AlertDescription>
                          </Box>
                        </Alert>
                      )}
                      {data.driverPayouts.length > 0 && (
                        <Alert status="info" size="sm">
                          <AlertIcon />
                          <Box>
                            <AlertTitle>Pending Payouts</AlertTitle>
                            <AlertDescription>
                              {data.driverPayouts.length} driver payouts pending
                            </AlertDescription>
                          </Box>
                        </Alert>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </Grid>
          </TabPanel>

          {/* Invoices Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Invoices</Heading>
                  <HStack spacing={2}>
                    <Button
                      leftIcon={<FaDownload />}
                      variant="outline"
                      size="sm"
                    >
                      Export
                    </Button>
                    <Button leftIcon={<FaPlus />} colorScheme="blue" size="sm">
                      Generate Invoice
                    </Button>
                  </HStack>
                </Flex>
              </CardHeader>
              <CardBody>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Invoice #</Th>
                      <Th>Customer</Th>
                      <Th>Order</Th>
                      <Th>Amount</Th>
                      <Th>Status</Th>
                      <Th>Date</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.recentInvoices.map(invoice => (
                      <Tr key={invoice.id}>
                        <Td>
                          <Text fontWeight="bold">
                            #{invoice.invoiceNumber || 'N/A'}
                          </Text>
                        </Td>
                        <Td>{invoice.customer?.name || 'Unknown Customer'}</Td>
                        <Td>#{invoice.reference || 'N/A'}</Td>
                        <Td>{formatCurrency(invoice.totalGBP)}</Td>
                        <Td>
                          <Badge colorScheme="green">Paid</Badge>
                        </Td>
                        <Td>{formatDate(invoice.paidAt)}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="View invoice"
                              icon={<FaEye />}
                              size="sm"
                              variant="ghost"
                            />
                            <IconButton
                              aria-label="Download invoice"
                              icon={<FaDownload />}
                              size="sm"
                              variant="ghost"
                            />
                            <IconButton
                              aria-label="Print invoice"
                              icon={<FaPrint />}
                              size="sm"
                              variant="ghost"
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Refunds Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Refunds</Heading>
                  <Button
                    leftIcon={<FaPlus />}
                    colorScheme="blue"
                    size="sm"
                    onClick={onOpen}
                  >
                    Issue Refund
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Order</Th>
                      <Th>Customer</Th>
                      <Th>Original Amount</Th>
                      <Th>Refund Amount</Th>
                      <Th>Reason</Th>
                      <Th>Status</Th>
                      <Th>Date</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.pendingRefunds.map(refund => (
                      <Tr key={refund.id}>
                        <Td>#{refund.reference || 'N/A'}</Td>
                        <Td>{refund.customer?.name || 'Unknown Customer'}</Td>
                        <Td>{formatCurrency(refund.totalGBP)}</Td>
                        <Td>{formatCurrency(refund.totalGBP)}</Td>
                        <Td>Customer request</Td>
                        <Td>
                          <Badge colorScheme="orange">Processing</Badge>
                        </Td>
                        <Td>{formatDate(refund.updatedAt)}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="View refund"
                              icon={<FaEye />}
                              size="sm"
                              variant="ghost"
                            />
                            <IconButton
                              aria-label="Edit refund"
                              icon={<FaEdit />}
                              size="sm"
                              variant="ghost"
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </CardBody>
            </Card>
          </TabPanel>

          {/* Payouts Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Flex justify="space-between" align="center">
                  <Heading size="md">Driver Payouts</Heading>
                  <Button leftIcon={<FaDownload />} variant="outline" size="sm">
                    Export Payout File
                  </Button>
                </Flex>
              </CardHeader>
              <CardBody>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Driver</Th>
                      <Th>Amount</Th>
                      <Th>Jobs Included</Th>
                      <Th>Status</Th>
                      <Th>Created</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {data.driverPayouts.map(payout => (
                      <Tr key={payout.id}>
                        <Td>{payout.driver?.user?.name || 'Unknown Driver'}</Td>
                        <Td>{formatCurrency(payout.totalAmountPence)}</Td>
                        <Td>{payout.earnings?.length || 0} jobs</Td>
                        <Td>
                          <Badge
                            colorScheme={
                              payout.status === 'pending'
                                ? 'yellow'
                                : payout.status === 'processing'
                                  ? 'blue'
                                  : 'green'
                            }
                          >
                            {payout.status || 'unknown'}
                          </Badge>
                        </Td>
                        <Td>{formatRelativeTime(payout.createdAt)}</Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="View payout"
                              icon={<FaEye />}
                              size="sm"
                              variant="ghost"
                            />
                            {payout.status === 'pending' && (
                              <IconButton
                                aria-label="Process payout"
                                icon={<FaCheck />}
                                size="sm"
                                variant="ghost"
                                colorScheme="green"
                                onClick={() => handleProcessPayout(payout.id)}
                              />
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

          {/* Ledger Tab */}
          <TabPanel>
            <Card>
              <CardHeader>
                <Heading size="md">Earnings Ledger (Last 30 Days)</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={6} align="stretch">
                  {/* Earnings Breakdown */}
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Base Amount</StatLabel>
                          <StatNumber>
                            {formatCurrency(data.earningsBreakdown.baseAmount)}
                          </StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Surge Amount</StatLabel>
                          <StatNumber>
                            {formatCurrency(data.earningsBreakdown.surgeAmount)}
                          </StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Tips</StatLabel>
                          <StatNumber>
                            {formatCurrency(data.earningsBreakdown.tipAmount)}
                          </StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>
                    <Card>
                      <CardBody>
                        <Stat>
                          <StatLabel>Net Amount</StatLabel>
                          <StatNumber>
                            {formatCurrency(data.earningsBreakdown.netAmount)}
                          </StatNumber>
                        </Stat>
                      </CardBody>
                    </Card>
                  </SimpleGrid>

                  <Divider />

                  <Text fontWeight="bold" color="gray.600">
                    Detailed Breakdown
                  </Text>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Category</Th>
                        <Th>Amount</Th>
                        <Th>Percentage</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      <Tr>
                        <Td>Base Earnings</Td>
                        <Td>
                          {formatCurrency(data.earningsBreakdown.baseAmount)}
                        </Td>
                        <Td>
                          {data.earningsBreakdown.netAmount > 0
                            ? `${((data.earningsBreakdown.baseAmount / data.earningsBreakdown.netAmount) * 100).toFixed(1)}%`
                            : '0%'}
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>Additional Earnings</Td>
                        <Td>
                          {formatCurrency(data.earningsBreakdown.surgeAmount)}
                        </Td>
                        <Td>
                          {data.earningsBreakdown.netAmount > 0
                            ? `${((data.earningsBreakdown.surgeAmount / data.earningsBreakdown.netAmount) * 100).toFixed(1)}%`
                            : '0%'}
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>Tips</Td>
                        <Td>
                          {formatCurrency(data.earningsBreakdown.tipAmount)}
                        </Td>
                        <Td>
                          {data.earningsBreakdown.netAmount > 0
                            ? `${((data.earningsBreakdown.tipAmount / data.earningsBreakdown.netAmount) * 100).toFixed(1)}%`
                            : '0%'}
                        </Td>
                      </Tr>
                      <Tr>
                        <Td>Fees</Td>
                        <Td>
                          {formatCurrency(data.earningsBreakdown.feeAmount)}
                        </Td>
                        <Td>
                          {data.earningsBreakdown.netAmount > 0
                            ? `${((data.earningsBreakdown.feeAmount / data.earningsBreakdown.netAmount) * 100).toFixed(1)}%`
                            : '0%'}
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </VStack>
              </CardBody>
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Issue Refund Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Issue Refund</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Order ID</FormLabel>
                <Input placeholder="Enter order ID" />
              </FormControl>

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

              <FormControl>
                <FormLabel>Amount (£)</FormLabel>
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

              <FormControl>
                <FormLabel>Reason</FormLabel>
                <Select
                  value={refundForm.reason}
                  onChange={e =>
                    setRefundForm({ ...refundForm, reason: e.target.value })
                  }
                  placeholder="Select reason"
                >
                  <option value="customer_request">Customer Request</option>
                  <option value="service_issue">Service Issue</option>
                  <option value="cancellation">Cancellation</option>
                  <option value="billing_error">Billing Error</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>

              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>Refund Process</AlertTitle>
                  <AlertDescription>
                    Refunds will be processed through Stripe and may take 5-10
                    business days to appear on the customer's statement.
                  </AlertDescription>
                </Box>
              </Alert>

              <HStack spacing={4} justify="flex-end">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="red"
                  onClick={() => handleIssueRefund('temp-id')}
                >
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
