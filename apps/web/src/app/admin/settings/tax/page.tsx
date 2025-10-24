/**
 * TAX MANAGEMENT ADMIN PAGE
 * 
 * Comprehensive tax management interface for Speedy-Van with:
 * - VAT management and returns
 * - Corporation Tax calculations
 * - Tax compliance monitoring
 * - HMRC integration
 * - Deadline management
 * - Reporting and analytics
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Badge,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Icon,
  Divider,
  SimpleGrid,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Select,
  Switch,
  useToast,
  Spinner,
  Flex,
} from '@chakra-ui/react';
import {
  FiActivity,
  FiTrendingUp,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiFileText,
  FiDownload,
  FiUpload,
  FiSettings,
  FiCalendar,
  FiShield,
  FiRefreshCw,
  FiEye,
  FiEdit,
  FiPlus,
  FiFilter,
  FiSearch,
} from 'react-icons/fi';

interface TaxDashboardData {
  vatSummary: {
    currentPeriod: string;
    vatDue: number;
    vatCollected: number;
    vatReclaimed: number;
    netVATDue: number;
  };
  corporationTax: {
    estimatedTax: number;
    profit: number;
    effectiveRate: number;
    taxFreeAllowance: number;
  };
  compliance: {
    overallScore: number;
    isCompliant: boolean;
    overdueDeadlines: number;
    upcomingDeadlines: number;
  };
  recentTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    date: Date;
    status: string;
  }>;
  deadlines: Array<{
    id: string;
    title: string;
    dueDate: Date;
    status: string;
    daysRemaining: number;
  }>;
}

export default function TaxManagementPage() {
  const [dashboardData, setDashboardData] = useState<TaxDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  
  const toast = useToast();
  const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure();
  const { isOpen: isReportOpen, onOpen: onReportOpen, onClose: onReportClose } = useDisclosure();

  // Color mode values
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // This would fetch real data from the API
      // For now, using mock data
      const mockData: TaxDashboardData = {
        vatSummary: {
          currentPeriod: '2024-Q4',
          vatDue: 15420.50,
          vatCollected: 18750.00,
          vatReclaimed: 3329.50,
          netVATDue: 15420.50,
        },
        corporationTax: {
          estimatedTax: 8750.00,
          profit: 46000.00,
          effectiveRate: 0.19,
          taxFreeAllowance: 50000.00,
        },
        compliance: {
          overallScore: 92,
          isCompliant: true,
          overdueDeadlines: 0,
          upcomingDeadlines: 2,
        },
        recentTransactions: [
          {
            id: '1',
            type: 'VAT Payment',
            amount: 15420.50,
            date: new Date('2024-01-15'),
            status: 'completed',
          },
          {
            id: '2',
            type: 'VAT Reclaim',
            amount: 3329.50,
            date: new Date('2024-01-10'),
            status: 'pending',
          },
        ],
        deadlines: [
          {
            id: '1',
            title: 'VAT Return Q4 2024',
            dueDate: new Date('2024-02-28'),
            status: 'upcoming',
            daysRemaining: 14,
          },
          {
            id: '2',
            title: 'Corporation Tax Payment',
            dueDate: new Date('2024-03-31'),
            status: 'upcoming',
            daysRemaining: 45,
          },
        ],
      };
      
      setDashboardData(mockData);
    } catch (error) {
      toast({
        title: 'Error loading dashboard data',
        description: 'Failed to load tax dashboard data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'overdue':
        return 'red';
      case 'upcoming':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return FiCheckCircle;
      case 'pending':
        return FiClock;
      case 'overdue':
        return FiAlertTriangle;
      case 'upcoming':
        return FiCalendar;
      default:
        return FiClock;
    }
  };

  if (loading) {
    return (
      <Box p={6}>
        <Flex justify="center" align="center" h="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="neon.500" />
            <Text>Loading tax dashboard...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack align="start" spacing={6} w="full">
        {/* Header */}
        <Box w="full">
          <HStack justify="space-between" w="full" mb={4}>
            <Box>
              <Heading size="lg" mb={2}>
                Tax Management
              </Heading>
              <Text color="text.secondary">
                Comprehensive tax management system for UK compliance
              </Text>
            </Box>
            <HStack spacing={3}>
              <Button
                leftIcon={<FiRefreshCw />}
                variant="outline"
                onClick={loadDashboardData}
                isLoading={loading}
              >
                Refresh
              </Button>
              <Button
                leftIcon={<FiSettings />}
                colorScheme="neon"
                onClick={onSettingsOpen}
              >
                Settings
              </Button>
            </HStack>
          </HStack>
        </Box>

        {/* Compliance Alert */}
        {dashboardData && !dashboardData.compliance.isCompliant && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Compliance Issues Detected!</AlertTitle>
              <AlertDescription>
                You have {dashboardData.compliance.overdueDeadlines} overdue deadlines. 
                Please address these issues to maintain compliance.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Main Dashboard */}
        <Tabs w="full" variant="enclosed">
          <TabList>
            <Tab>Dashboard</Tab>
            <Tab>VAT Returns</Tab>
            <Tab>Corporation Tax</Tab>
            <Tab>Compliance</Tab>
            <Tab>Reports</Tab>
            <Tab>Deadlines</Tab>
          </TabList>

          <TabPanels>
            {/* Dashboard Tab */}
            <TabPanel px={0}>
              <VStack spacing={6} align="start">
                {/* Key Metrics */}
                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} w="full">
                  <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                    <CardBody>
                      <Stat>
                        <StatLabel>VAT Due</StatLabel>
                        <StatNumber color="neon.500">
                          £{dashboardData?.vatSummary?.vatDue?.toLocaleString() || '0'}
                        </StatNumber>
                        <StatHelpText>
                          <StatArrow type="increase" />
                          Current period
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                    <CardBody>
                      <Stat>
                        <StatLabel>Corporation Tax</StatLabel>
                        <StatNumber color="blue.500">
                          £{dashboardData?.corporationTax?.estimatedTax?.toLocaleString() || '0'}
                        </StatNumber>
                        <StatHelpText>
                          Estimated for {new Date().getFullYear()}
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                    <CardBody>
                      <Stat>
                        <StatLabel>Compliance Score</StatLabel>
                        <StatNumber color={dashboardData?.compliance?.isCompliant ? 'green.500' : 'red.500'}>
                          {dashboardData?.compliance?.overallScore || 0}%
                        </StatNumber>
                        <StatHelpText>
                          <Progress 
                            value={dashboardData?.compliance?.overallScore || 0} 
                            colorScheme={dashboardData?.compliance?.isCompliant ? 'green' : 'red'}
                            size="sm"
                          />
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                    <CardBody>
                      <Stat>
                        <StatLabel>Upcoming Deadlines</StatLabel>
                        <StatNumber color="orange.500">
                          {dashboardData?.compliance?.upcomingDeadlines || 0}
                        </StatNumber>
                        <StatHelpText>
                          Next 30 days
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Recent Transactions and Deadlines */}
                <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6} w="full">
                  {/* Recent Transactions */}
                  <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                    <CardBody>
                      <HStack justify="space-between" mb={4}>
                        <Heading size="md">Recent Transactions</Heading>
                        <Button size="sm" variant="outline" leftIcon={<FiPlus />}>
                          Add Transaction
                        </Button>
                      </HStack>
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>Type</Th>
                            <Th>Amount</Th>
                            <Th>Date</Th>
                            <Th>Status</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {dashboardData?.recentTransactions?.map((transaction) => (
                            <Tr key={transaction.id}>
                              <Td>{transaction.type}</Td>
                              <Td>£{transaction.amount.toLocaleString()}</Td>
                              <Td>{transaction.date.toLocaleDateString()}</Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(transaction.status)}>
                                  {transaction.status}
                                </Badge>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </CardBody>
                  </Card>

                  {/* Upcoming Deadlines */}
                  <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                    <CardBody>
                      <HStack justify="space-between" mb={4}>
                        <Heading size="md">Upcoming Deadlines</Heading>
                        <Button size="sm" variant="outline" leftIcon={<FiCalendar />}>
                          View All
                        </Button>
                      </HStack>
                      <VStack spacing={3} align="start">
                        {dashboardData?.deadlines?.map((deadline) => (
                          <Box key={deadline.id} w="full">
                            <HStack justify="space-between">
                              <VStack align="start" spacing={1}>
                                <Text fontWeight="medium">{deadline.title}</Text>
                                <Text fontSize="sm" color={textColor}>
                                  Due: {deadline.dueDate.toLocaleDateString()}
                                </Text>
                              </VStack>
                              <VStack align="end" spacing={1}>
                                <Badge colorScheme={getStatusColor(deadline.status)}>
                                  {deadline.daysRemaining} days
                                </Badge>
                                <Icon 
                                  as={getStatusIcon(deadline.status)} 
                                  color={`${getStatusColor(deadline.status)}.500`}
                                  boxSize={4}
                                />
                              </VStack>
                            </HStack>
                            {deadline.id !== dashboardData.deadlines[dashboardData.deadlines.length - 1].id && (
                              <Divider mt={3} />
                            )}
                          </Box>
                        ))}
                      </VStack>
                    </CardBody>
                  </Card>
                </Grid>
              </VStack>
            </TabPanel>

            {/* VAT Returns Tab */}
            <TabPanel px={0}>
              <VStack spacing={6} align="start">
                <Card bg={cardBg} border="1px solid" borderColor={borderColor} w="full">
                  <CardBody>
                    <HStack justify="space-between" mb={4}>
                      <Heading size="md">VAT Returns</Heading>
                      <HStack spacing={3}>
                        <Select placeholder="Select period" w="200px">
                          <option value="2024-Q4">Q4 2024</option>
                          <option value="2024-Q3">Q3 2024</option>
                          <option value="2024-Q2">Q2 2024</option>
                        </Select>
                        <Button colorScheme="neon" leftIcon={<FiPlus />}>
                          New Return
                        </Button>
                      </HStack>
                    </HStack>
                    
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Period</Th>
                          <Th>Net VAT Due</Th>
                          <Th>Status</Th>
                          <Th>Due Date</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        <Tr>
                          <Td>Q4 2024</Td>
                          <Td>£15,420.50</Td>
                          <Td>
                            <Badge colorScheme="yellow">Pending</Badge>
                          </Td>
                          <Td>28 Feb 2024</Td>
                          <Td>
                            <HStack spacing={2}>
                              <Button size="xs" variant="outline" leftIcon={<FiEye />}>
                                View
                              </Button>
                              <Button size="xs" variant="outline" leftIcon={<FiEdit />}>
                                Edit
                              </Button>
                              <Button size="xs" variant="outline" leftIcon={<FiUpload />}>
                                Submit
                              </Button>
                            </HStack>
                          </Td>
                        </Tr>
                      </Tbody>
                    </Table>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Corporation Tax Tab */}
            <TabPanel px={0}>
              <VStack spacing={6} align="start">
                <Card bg={cardBg} border="1px solid" borderColor={borderColor} w="full">
                  <CardBody>
                    <Heading size="md" mb={4}>Corporation Tax</Heading>
                    
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={6}>
                      <Box>
                        <Text fontSize="sm" color={textColor} mb={1}>Taxable Profit</Text>
                        <Text fontSize="2xl" fontWeight="bold">
                          £{dashboardData?.corporationTax?.profit?.toLocaleString() || '0'}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color={textColor} mb={1}>Estimated Tax</Text>
                        <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                          £{dashboardData?.corporationTax?.estimatedTax?.toLocaleString() || '0'}
                        </Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color={textColor} mb={1}>Effective Rate</Text>
                        <Text fontSize="2xl" fontWeight="bold">
                          {(dashboardData?.corporationTax?.effectiveRate ? dashboardData.corporationTax.effectiveRate * 100 : 0).toFixed(1)}%
                        </Text>
                      </Box>
                    </SimpleGrid>

                    <Alert status="info" borderRadius="md" mb={4}>
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Tax-Free Allowance</AlertTitle>
                        <AlertDescription>
                          You have £{dashboardData?.corporationTax?.taxFreeAllowance?.toLocaleString() || '0'} tax-free allowance remaining.
                        </AlertDescription>
                      </Box>
                    </Alert>

                    <HStack spacing={3}>
                      <Button colorScheme="neon" leftIcon={<FiActivity />}>
                        Calculate Tax
                      </Button>
                      <Button variant="outline" leftIcon={<FiFileText />}>
                        Generate Return
                      </Button>
                      <Button variant="outline" leftIcon={<FiUpload />}>
                        Submit to HMRC
                      </Button>
                    </HStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Compliance Tab */}
            <TabPanel px={0}>
              <VStack spacing={6} align="start">
                <Card bg={cardBg} border="1px solid" borderColor={borderColor} w="full">
                  <CardBody>
                    <Heading size="md" mb={4}>Compliance Status</Heading>
                    
                    <VStack spacing={4} align="start">
                      <Box w="full">
                        <HStack justify="space-between" mb={2}>
                          <Text>Overall Compliance</Text>
                          <Text fontWeight="bold">{dashboardData?.compliance?.overallScore || 0}%</Text>
                        </HStack>
                        <Progress 
                          value={dashboardData?.compliance?.overallScore || 0} 
                          colorScheme={dashboardData?.compliance?.isCompliant ? 'green' : 'red'}
                          size="lg"
                          borderRadius="md"
                        />
                      </Box>

                      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
                        <Box textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="green.500">
                            {dashboardData?.compliance?.overallScore || 0}%
                          </Text>
                          <Text fontSize="sm" color={textColor}>Compliance Score</Text>
                        </Box>
                        <Box textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="red.500">
                            {dashboardData?.compliance?.overdueDeadlines || 0}
                          </Text>
                          <Text fontSize="sm" color={textColor}>Overdue Items</Text>
                        </Box>
                        <Box textAlign="center">
                          <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                            {dashboardData?.compliance?.upcomingDeadlines || 0}
                          </Text>
                          <Text fontSize="sm" color={textColor}>Upcoming Deadlines</Text>
                        </Box>
                      </SimpleGrid>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Reports Tab */}
            <TabPanel px={0}>
              <VStack spacing={6} align="start">
                <Card bg={cardBg} border="1px solid" borderColor={borderColor} w="full">
                  <CardBody>
                    <HStack justify="space-between" mb={4}>
                      <Heading size="md">Tax Reports</Heading>
                      <Button colorScheme="neon" leftIcon={<FiDownload />} onClick={onReportOpen}>
                        Generate Report
                      </Button>
                    </HStack>
                    
                    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }} gap={4}>
                      <Card variant="outline">
                        <CardBody>
                          <VStack spacing={3}>
                            <Icon as={FiFileText} boxSize={8} color="neon.500" />
                            <Text fontWeight="medium">VAT Return Report</Text>
                            <Text fontSize="sm" color={textColor} textAlign="center">
                              Detailed VAT return with breakdown by rate
                            </Text>
                            <Button size="sm" variant="outline" w="full">
                              Generate
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card variant="outline">
                        <CardBody>
                          <VStack spacing={3}>
                            <Icon as={FiTrendingUp} boxSize={8} color="blue.500" />
                            <Text fontWeight="medium">Corporation Tax Report</Text>
                            <Text fontSize="sm" color={textColor} textAlign="center">
                              Profit and loss with tax calculations
                            </Text>
                            <Button size="sm" variant="outline" w="full">
                              Generate
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>

                      <Card variant="outline">
                        <CardBody>
                          <VStack spacing={3}>
                            <Icon as={FiShield} boxSize={8} color="green.500" />
                            <Text fontWeight="medium">Compliance Report</Text>
                            <Text fontSize="sm" color={textColor} textAlign="center">
                              Overall compliance status and recommendations
                            </Text>
                            <Button size="sm" variant="outline" w="full">
                              Generate
                            </Button>
                          </VStack>
                        </CardBody>
                      </Card>
                    </Grid>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            {/* Deadlines Tab */}
            <TabPanel px={0}>
              <VStack spacing={6} align="start">
                <Card bg={cardBg} border="1px solid" borderColor={borderColor} w="full">
                  <CardBody>
                    <HStack justify="space-between" mb={4}>
                      <Heading size="md">Tax Deadlines</Heading>
                      <HStack spacing={3}>
                        <Select placeholder="Filter by type" w="150px">
                          <option value="vat">VAT</option>
                          <option value="corporation_tax">Corporation Tax</option>
                          <option value="payroll">Payroll</option>
                        </Select>
                        <Button variant="outline" leftIcon={<FiPlus />}>
                          Add Deadline
                        </Button>
                      </HStack>
                    </HStack>
                    
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Type</Th>
                          <Th>Title</Th>
                          <Th>Due Date</Th>
                          <Th>Status</Th>
                          <Th>Days Remaining</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {dashboardData?.deadlines?.map((deadline) => (
                          <Tr key={deadline.id}>
                            <Td>
                              <Badge colorScheme="blue" variant="subtle">
                                {deadline.title.split(' ')[0]}
                              </Badge>
                            </Td>
                            <Td>{deadline.title}</Td>
                            <Td>{deadline.dueDate.toLocaleDateString()}</Td>
                            <Td>
                              <Badge colorScheme={getStatusColor(deadline.status)}>
                                {deadline.status}
                              </Badge>
                            </Td>
                            <Td>
                              <Text color={deadline.daysRemaining <= 7 ? 'red.500' : 'gray.500'}>
                                {deadline.daysRemaining}
                              </Text>
                            </Td>
                            <Td>
                              <HStack spacing={2}>
                                <Button size="xs" variant="outline" leftIcon={<FiEye />}>
                                  View
                                </Button>
                                <Button size="xs" variant="outline" leftIcon={<FiEdit />}>
                                  Edit
                                </Button>
                              </HStack>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={onSettingsClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Tax Settings</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>VAT Registration Number</FormLabel>
                <Input placeholder="GB123456789" />
              </FormControl>
              <FormControl>
                <FormLabel>Corporation Tax UTR</FormLabel>
                <Input placeholder="1234567890" />
              </FormControl>
              <FormControl>
                <FormLabel>VAT Return Frequency</FormLabel>
                <Select>
                  <option value="quarterly">Quarterly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annually">Annually</option>
                </Select>
              </FormControl>
              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0">Email Notifications</FormLabel>
                <Switch defaultChecked />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSettingsClose}>
              Cancel
            </Button>
            <Button colorScheme="neon" onClick={onSettingsClose}>
              Save Settings
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Report Generation Modal */}
      <Modal isOpen={isReportOpen} onClose={onReportClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Generate Tax Report</ModalHeader>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Report Type</FormLabel>
                <Select>
                  <option value="vat">VAT Return Report</option>
                  <option value="corporation_tax">Corporation Tax Report</option>
                  <option value="compliance">Compliance Report</option>
                  <option value="forecast">Tax Forecast</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Period</FormLabel>
                <Select>
                  <option value="2024-Q4">Q4 2024</option>
                  <option value="2024-Q3">Q3 2024</option>
                  <option value="2024-Q2">Q2 2024</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Format</FormLabel>
                <Select>
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onReportClose}>
              Cancel
            </Button>
            <Button colorScheme="neon" onClick={onReportClose}>
              Generate Report
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
