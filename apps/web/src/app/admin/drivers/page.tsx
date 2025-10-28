'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Card,
  CardBody,
  VStack,
  HStack,
  Button,
  useToast,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Grid,
  GridItem,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Textarea,
  Select,
  Stack,
  Icon,
  Flex,
  Spinner,
  Input,
  InputGroup,
  InputLeftElement,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Switch,
  FormHelperText,
  Divider,
} from '@chakra-ui/react';
import {
  FiSearch,
  FiEye,
  FiCheck,
  FiX,
  FiClock,
  FiUser,
  FiShield,
  FiFileText,
  FiTruck,
  FiCalendar,
  FiMoreVertical,
  FiAlertTriangle,
  FiPause,
  FiPlay,
  FiSettings,
  FiStar,
  FiMapPin,
  FiPhone,
  FiMail,
  FiDownload,
  FiRefreshCw,
  FiLogOut,
  FiShield as FiShieldIcon,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiClock as FiClockIcon,
} from 'react-icons/fi';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  onboardingStatus: string;
  status: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  basePostcode: string;
  vehicleType: string;
  rating: number;
  totalJobs: number;
  completedJobs: number;
  onTimeJobs: number;
  totalEarnings: number;
  availability: string;
  lastSeen: string | null;
  complianceIssues: string[];
  documentExpiries: {
    license: string | null;
    insurance: string | null;
    mot: string | null;
    rtw: string | null;
  };
  kpis: {
    acceptanceRate: number;
    completionRate: number;
    onTimeRate: number;
    avgRating: number;
  };
  incidents: Array<{
    id: string;
    type: string;
    severity: string;
    description: string;
    createdAt: string;
    resolved: boolean;
  }>;
}

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [complianceFilter, setComplianceFilter] = useState('all');
  const [processing, setProcessing] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [autoAssignLimit, setAutoAssignLimit] = useState(5);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // ✅ CRITICAL: Listen for real-time driver status changes via Pusher
  useEffect(() => {
    const setupPusher = async () => {
      try {
        // ✅ Use window check for client-side env vars
        if (typeof window === 'undefined') return;
        
        const PUSHER_KEY = '407cb06c423e6c032e9c'; // From your .env
        const PUSHER_CLUSTER = 'eu'; // From your .env
        
        const Pusher = (await import('pusher-js')).default;
        const pusher = new Pusher(PUSHER_KEY, {
          cluster: PUSHER_CLUSTER,
        });

        const channel = pusher.subscribe('admin-notifications');
        
        channel.bind('driver-status-changed', (data: { driverId: string; status: string; timestamp: string }) => {
          console.log('🔔 Driver status changed:', data);
          
          // Update driver in list
          setDrivers(prevDrivers => 
            prevDrivers.map(driver => 
              driver.id === data.driverId
                ? { ...driver, availability: data.status, lastSeen: data.timestamp }
                : driver
            )
          );

          // Show toast notification
          toast({
            title: 'Driver Status Updated',
            description: `Driver is now ${data.status}`,
            status: 'info',
            duration: 3000,
            isClosable: true,
          });
        });

        return () => {
          channel.unbind_all();
          pusher.unsubscribe('admin-notifications');
          pusher.disconnect();
        };
      } catch (error) {
        console.error('❌ Failed to setup Pusher:', error);
      }
    };

    setupPusher();
  }, [toast]);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await fetch('/api/admin/drivers');
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers);
      } else {
        throw new Error('Failed to fetch drivers');
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load drivers',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDriverAction = async (
    action: string,
    driverId: string,
    data?: any
  ) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/admin/drivers/${driverId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Driver ${action} successful`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        await fetchDrivers();
        onClose();
      } else {
        throw new Error('Failed to process action');
      }
    } catch (error) {
      console.error('Error processing driver action:', error);
      toast({
        title: 'Error',
        description: 'Failed to process action',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'suspended':
        return 'red';
      case 'inactive':
        return 'gray';
      case 'break':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'online':
        return 'green';
      case 'offline':
        return 'red';
      case 'break':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getComplianceStatus = (driver: Driver) => {
    const issues = driver.complianceIssues.length;
    if (issues === 0)
      return { status: 'compliant', color: 'green', text: 'Compliant' };
    if (issues <= 2)
      return { status: 'warning', color: 'yellow', text: `${issues} issues` };
    return {
      status: 'critical',
      color: 'red',
      text: `${issues} critical issues`,
    };
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch =
      driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      driver.phone.includes(searchTerm);
    const matchesStatus =
      statusFilter === 'all' || driver.status === statusFilter;
    const matchesAvailability =
      availabilityFilter === 'all' ||
      driver.availability === availabilityFilter;
    const matchesCompliance =
      complianceFilter === 'all' ||
      (complianceFilter === 'compliant' &&
        driver.complianceIssues.length === 0) ||
      (complianceFilter === 'issues' && driver.complianceIssues.length > 0);

    return (
      matchesSearch && matchesStatus && matchesAvailability && matchesCompliance
    );
  });

  const activeDrivers = drivers.filter(d => d.status === 'active');
  const onlineDrivers = drivers.filter(d => d.availability === 'online');
  const complianceIssues = drivers.filter(d => d.complianceIssues.length > 0);

  if (loading) {
    return (
      <Box p={6}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg">Driver Roster</Heading>
            <Text color="text.secondary">
              Manage active drivers and compliance
            </Text>
          </VStack>
          <HStack spacing={4}>
            <Button
              leftIcon={<FiDownload />}
              variant="outline"
              size="sm"
              onClick={() => {
                // Export drivers data
                toast({
                  title: 'Export',
                  description: 'Exporting driver data...',
                  status: 'info',
                  duration: 3000,
                  isClosable: true,
                });
              }}
            >
              Export Data
            </Button>
            <Button
              leftIcon={<FiRefreshCw />}
              colorScheme="blue"
              size="sm"
              onClick={fetchDrivers}
            >
              Refresh
            </Button>
          </HStack>
        </Flex>

        {/* Stats Row */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
          <Stat>
            <StatLabel>Active Drivers</StatLabel>
            <StatNumber color="green.500">{activeDrivers.length}</StatNumber>
            <StatHelpText>Available for jobs</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Online Now</StatLabel>
            <StatNumber color="blue.500">{onlineDrivers.length}</StatNumber>
            <StatHelpText>Currently available</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Compliance Issues</StatLabel>
            <StatNumber color="red.500">{complianceIssues.length}</StatNumber>
            <StatHelpText>Require attention</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Avg Rating</StatLabel>
            <StatNumber>
              {drivers.length > 0
                ? (
                    drivers.reduce((sum, d) => sum + d.rating, 0) /
                    drivers.length
                  ).toFixed(1)
                : '0.0'}
            </StatNumber>
            <StatHelpText>Overall driver rating</StatHelpText>
          </Stat>
        </Grid>

        {/* Filters */}
        <Card>
          <CardBody>
            <HStack spacing={4} wrap="wrap">
              <InputGroup maxW="300px">
                <InputLeftElement>
                  <Icon as={FiSearch} color="text.tertiary" />
                </InputLeftElement>
                <Input
                  placeholder="Search drivers..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <Select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                maxW="150px"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </Select>
              <Select
                value={availabilityFilter}
                onChange={e => setAvailabilityFilter(e.target.value)}
                maxW="150px"
              >
                <option value="all">All Availability</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="break">Break</option>
              </Select>
              <Select
                value={complianceFilter}
                onChange={e => setComplianceFilter(e.target.value)}
                maxW="150px"
              >
                <option value="all">All Compliance</option>
                <option value="compliant">Compliant</option>
                <option value="issues">Has Issues</option>
              </Select>
            </HStack>
          </CardBody>
        </Card>

        {/* Drivers Table */}
        <Card>
          <CardBody>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Driver</Th>
                  <Th>Status</Th>
                  <Th>Availability</Th>
                  <Th>Compliance</Th>
                  <Th>Performance</Th>
                  <Th>Last Seen</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredDrivers.map(driver => {
                  const compliance = getComplianceStatus(driver);
                  return (
                    <Tr
                      key={driver.id}
                      cursor="pointer"
                      onClick={() => {
                        setSelectedDriver(driver);
                        onOpen();
                      }}
                    >
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{driver.name}</Text>
                          <Text fontSize="sm" color="text.secondary">
                            {driver.email}
                          </Text>
                          <Text fontSize="sm" color="text.secondary">
                            {driver.phone}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge colorScheme={getStatusColor(driver.status)}>
                          {driver.status}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={getAvailabilityColor(
                            driver.availability
                          )}
                        >
                          {driver.availability}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme={compliance.color}>
                          {compliance.text}
                        </Badge>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <Icon as={FiStar} color="yellow.400" />
                            <Text fontSize="sm">
                              {driver.rating.toFixed(1)}
                            </Text>
                          </HStack>
                          <Text fontSize="sm" color="text.secondary">
                            {driver.completedJobs}/{driver.totalJobs} jobs
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm" color="text.secondary">
                          {driver.lastSeen
                            ? new Date(driver.lastSeen).toLocaleString()
                            : 'Never'}
                        </Text>
                      </Td>
                      <Td>
                        <Menu>
                          <MenuButton
                            as={IconButton}
                            icon={<FiMoreVertical />}
                            variant="ghost"
                            size="sm"
                            onClick={e => e.stopPropagation()}
                          />
                          <MenuList>
                            <MenuItem
                              icon={<FiEye />}
                              onClick={e => {
                                e.stopPropagation();
                                setSelectedDriver(driver);
                                onOpen();
                              }}
                            >
                              View Details
                            </MenuItem>
                            <MenuItem
                              icon={<FiSettings />}
                              onClick={e => {
                                e.stopPropagation();
                                // Open settings modal
                              }}
                            >
                              Settings
                            </MenuItem>
                            <MenuDivider />
                            {driver.status === 'active' ? (
                              <MenuItem
                                icon={<FiPause />}
                                color="red.500"
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedDriver(driver);
                                  setSuspensionReason('');
                                  // Open suspension modal
                                }}
                              >
                                Suspend
                              </MenuItem>
                            ) : (
                              <MenuItem
                                icon={<FiPlay />}
                                color="green.500"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDriverAction('activate', driver.id);
                                }}
                              >
                                Activate
                              </MenuItem>
                            )}
                            <MenuItem
                              icon={<FiRefreshCw />}
                              onClick={e => {
                                e.stopPropagation();
                                handleDriverAction('reset-device', driver.id);
                              }}
                            >
                              Reset Device
                            </MenuItem>
                            <MenuItem
                              icon={<FiLogOut />}
                              color="red.500"
                              onClick={e => {
                                e.stopPropagation();
                                handleDriverAction('force-logout', driver.id);
                              }}
                            >
                              Force Logout
                            </MenuItem>
                          </MenuList>
                        </Menu>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>

            {filteredDrivers.length === 0 && (
              <VStack spacing={4} py={8}>
                <Icon as={FiUser} size="48px" color="text.tertiary" />
                <Text color="text.secondary">No drivers found</Text>
              </VStack>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Driver Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <VStack align="start" spacing={1}>
              <Heading size="md">
                Driver Profile: {selectedDriver?.name}
              </Heading>
              <Text color="text.secondary" fontSize="sm">
                {selectedDriver?.email}
              </Text>
            </VStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedDriver && (
              <Tabs>
                <TabList>
                  <Tab>Overview</Tab>
                  <Tab>Performance</Tab>
                  <Tab>Compliance</Tab>
                  <Tab>Incidents</Tab>
                  <Tab>Controls</Tab>
                </TabList>

                <TabPanels>
                  {/* Overview Tab */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <Grid templateColumns="1fr 1fr" gap={6}>
                        <VStack align="start" spacing={4}>
                          <Heading size="sm">Personal Information</Heading>
                          <VStack align="start" spacing={2}>
                            <HStack>
                              <Icon as={FiUser} />
                              <Text fontWeight="medium">
                                {selectedDriver.name}
                              </Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiMail} />
                              <Text>{selectedDriver.email}</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiPhone} />
                              <Text>{selectedDriver.phone}</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiMapPin} />
                              <Text>{selectedDriver.basePostcode}</Text>
                            </HStack>
                          </VStack>
                        </VStack>

                        <VStack align="start" spacing={4}>
                          <Heading size="sm">Status & Availability</Heading>
                          <VStack align="start" spacing={2}>
                            <HStack>
                              <Badge
                                colorScheme={getStatusColor(
                                  selectedDriver.status
                                )}
                              >
                                {selectedDriver.status}
                              </Badge>
                              <Text fontSize="sm">Account Status</Text>
                            </HStack>
                            <HStack>
                              <Badge
                                colorScheme={getAvailabilityColor(
                                  selectedDriver.availability
                                )}
                              >
                                {selectedDriver.availability}
                              </Badge>
                              <Text fontSize="sm">Current Availability</Text>
                            </HStack>
                            <HStack>
                              <Icon as={FiClock} />
                              <Text fontSize="sm">
                                Last seen:{' '}
                                {selectedDriver.lastSeen
                                  ? new Date(
                                      selectedDriver.lastSeen
                                    ).toLocaleString()
                                  : 'Never'}
                              </Text>
                            </HStack>
                          </VStack>
                        </VStack>
                      </Grid>

                      <Divider />

                      <VStack align="start" spacing={4}>
                        <Heading size="sm">Quick Stats</Heading>
                        <Grid
                          templateColumns="repeat(auto-fit, minmax(200px, 1fr))"
                          gap={4}
                          w="full"
                        >
                          <Card>
                            <CardBody>
                              <VStack spacing={2}>
                                <Icon
                                  as={FiTruck}
                                  size="24px"
                                  color="blue.500"
                                />
                                <Text fontWeight="medium">Total Jobs</Text>
                                <Text fontSize="2xl" fontWeight="bold">
                                  {selectedDriver.totalJobs}
                                </Text>
                                <Text fontSize="sm" color="text.secondary">
                                  {selectedDriver.completedJobs} completed
                                </Text>
                              </VStack>
                            </CardBody>
                          </Card>
                          <Card>
                            <CardBody>
                              <VStack spacing={2}>
                                <Icon
                                  as={FiDollarSign}
                                  size="24px"
                                  color="green.500"
                                />
                                <Text fontWeight="medium">Total Earnings</Text>
                                <Text fontSize="2xl" fontWeight="bold">
                                  £
                                  {(selectedDriver.totalEarnings / 100).toFixed(
                                    2
                                  )}
                                </Text>
                                <Text fontSize="sm" color="text.secondary">
                                  Lifetime earnings
                                </Text>
                              </VStack>
                            </CardBody>
                          </Card>
                          <Card>
                            <CardBody>
                              <VStack spacing={2}>
                                <Icon
                                  as={FiStar}
                                  size="24px"
                                  color="yellow.500"
                                />
                                <Text fontWeight="medium">Rating</Text>
                                <Text fontSize="2xl" fontWeight="bold">
                                  {selectedDriver.rating.toFixed(1)}
                                </Text>
                                <Text fontSize="sm" color="text.secondary">
                                  Average rating
                                </Text>
                              </VStack>
                            </CardBody>
                          </Card>
                        </Grid>
                      </VStack>
                    </VStack>
                  </TabPanel>

                  {/* Performance Tab */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <Heading size="sm">Performance Metrics</Heading>

                      <Grid
                        templateColumns="repeat(auto-fit, minmax(250px, 1fr))"
                        gap={4}
                      >
                        <Card>
                          <CardBody>
                            <VStack spacing={3}>
                              <Text fontWeight="medium">Acceptance Rate</Text>
                              <Progress
                                value={selectedDriver.kpis.acceptanceRate}
                                colorScheme="green"
                                size="lg"
                                w="full"
                              />
                              <Text fontSize="lg" fontWeight="bold">
                                {selectedDriver.kpis.acceptanceRate}%
                              </Text>
                            </VStack>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody>
                            <VStack spacing={3}>
                              <Text fontWeight="medium">Completion Rate</Text>
                              <Progress
                                value={selectedDriver.kpis.completionRate}
                                colorScheme="blue"
                                size="lg"
                                w="full"
                              />
                              <Text fontSize="lg" fontWeight="bold">
                                {selectedDriver.kpis.completionRate}%
                              </Text>
                            </VStack>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody>
                            <VStack spacing={3}>
                              <Text fontWeight="medium">On-Time Rate</Text>
                              <Progress
                                value={selectedDriver.kpis.onTimeRate}
                                colorScheme="purple"
                                size="lg"
                                w="full"
                              />
                              <Text fontSize="lg" fontWeight="bold">
                                {selectedDriver.kpis.onTimeRate}%
                              </Text>
                            </VStack>
                          </CardBody>
                        </Card>
                      </Grid>

                      <Divider />

                      <VStack align="start" spacing={4}>
                        <Heading size="sm">Recent Performance</Heading>
                        <Grid templateColumns="1fr 1fr" gap={6}>
                          <VStack align="start" spacing={2}>
                            <Text fontWeight="medium">Job Completion</Text>
                            <Text fontSize="sm" color="text.secondary">
                              {selectedDriver.completedJobs} of{' '}
                              {selectedDriver.totalJobs} jobs completed
                            </Text>
                            <Text fontSize="sm" color="text.secondary">
                              {selectedDriver.onTimeJobs} jobs completed on time
                            </Text>
                          </VStack>
                          <VStack align="start" spacing={2}>
                            <Text fontWeight="medium">Earnings</Text>
                            <Text fontSize="sm" color="text.secondary">
                              Total: £
                              {(selectedDriver.totalEarnings / 100).toFixed(2)}
                            </Text>
                            <Text fontSize="sm" color="text.secondary">
                              Average per job: £
                              {selectedDriver.totalJobs > 0
                                ? (
                                    selectedDriver.totalEarnings /
                                    selectedDriver.totalJobs /
                                    100
                                  ).toFixed(2)
                                : '0.00'}
                            </Text>
                          </VStack>
                        </Grid>
                      </VStack>
                    </VStack>
                  </TabPanel>

                  {/* Compliance Tab */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <Heading size="sm">Compliance Status</Heading>

                      {selectedDriver.complianceIssues.length > 0 ? (
                        <Alert status="error">
                          <AlertIcon />
                          <VStack align="start" spacing={1}>
                            <AlertTitle>Compliance Issues Found</AlertTitle>
                            <AlertDescription>
                              <VStack align="start" spacing={1}>
                                {selectedDriver.complianceIssues.map(
                                  (issue, index) => (
                                    <Text key={index}>• {issue}</Text>
                                  )
                                )}
                              </VStack>
                            </AlertDescription>
                          </VStack>
                        </Alert>
                      ) : (
                        <Alert status="success">
                          <AlertIcon />
                          <AlertTitle>All Compliance Checks Passed</AlertTitle>
                          <AlertDescription>
                            This driver meets all compliance requirements
                          </AlertDescription>
                        </Alert>
                      )}

                      <Grid
                        templateColumns="repeat(auto-fit, minmax(250px, 1fr))"
                        gap={4}
                      >
                        <Card>
                          <CardBody>
                            <VStack spacing={2}>
                              <Icon
                                as={FiShieldIcon}
                                size="24px"
                                color="blue.500"
                              />
                              <Text fontWeight="medium">License</Text>
                              <Badge
                                colorScheme={
                                  selectedDriver.documentExpiries.license
                                    ? 'red'
                                    : 'green'
                                }
                              >
                                {selectedDriver.documentExpiries.license
                                  ? 'Expires Soon'
                                  : 'Valid'}
                              </Badge>
                              {selectedDriver.documentExpiries.license && (
                                <Text fontSize="sm" color="text.secondary">
                                  Expires:{' '}
                                  {new Date(
                                    selectedDriver.documentExpiries.license
                                  ).toLocaleDateString()}
                                </Text>
                              )}
                            </VStack>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody>
                            <VStack spacing={2}>
                              <Icon
                                as={FiShieldIcon}
                                size="24px"
                                color="purple.500"
                              />
                              <Text fontWeight="medium">Insurance</Text>
                              <Badge
                                colorScheme={
                                  selectedDriver.documentExpiries.insurance
                                    ? 'red'
                                    : 'green'
                                }
                              >
                                {selectedDriver.documentExpiries.insurance
                                  ? 'Expires Soon'
                                  : 'Valid'}
                              </Badge>
                              {selectedDriver.documentExpiries.insurance && (
                                <Text fontSize="sm" color="text.secondary">
                                  Expires:{' '}
                                  {new Date(
                                    selectedDriver.documentExpiries.insurance
                                  ).toLocaleDateString()}
                                </Text>
                              )}
                            </VStack>
                          </CardBody>
                        </Card>
                        <Card>
                          <CardBody>
                            <VStack spacing={2}>
                              <Icon
                                as={FiTruck}
                                size="24px"
                                color="orange.500"
                              />
                              <Text fontWeight="medium">MOT</Text>
                              <Badge
                                colorScheme={
                                  selectedDriver.documentExpiries.mot
                                    ? 'red'
                                    : 'green'
                                }
                              >
                                {selectedDriver.documentExpiries.mot
                                  ? 'Expires Soon'
                                  : 'Valid'}
                              </Badge>
                              {selectedDriver.documentExpiries.mot && (
                                <Text fontSize="sm" color="text.secondary">
                                  Expires:{' '}
                                  {new Date(
                                    selectedDriver.documentExpiries.mot
                                  ).toLocaleDateString()}
                                </Text>
                              )}
                            </VStack>
                          </CardBody>
                        </Card>
                      </Grid>
                    </VStack>
                  </TabPanel>

                  {/* Incidents Tab */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <Heading size="sm">Incident History</Heading>

                      {selectedDriver.incidents.length > 0 ? (
                        <VStack spacing={4} align="stretch">
                          {selectedDriver.incidents.map(incident => (
                            <Card key={incident.id}>
                              <CardBody>
                                <VStack align="start" spacing={3}>
                                  <HStack justify="space-between" w="full">
                                    <Badge
                                      colorScheme={
                                        incident.severity === 'high'
                                          ? 'red'
                                          : incident.severity === 'medium'
                                            ? 'yellow'
                                            : 'green'
                                      }
                                    >
                                      {incident.severity} severity
                                    </Badge>
                                    <Text fontSize="sm" color="text.secondary">
                                      {new Date(
                                        incident.createdAt
                                      ).toLocaleDateString()}
                                    </Text>
                                  </HStack>
                                  <Text fontWeight="medium">
                                    {incident.type}
                                  </Text>
                                  <Text fontSize="sm" color="text.secondary">
                                    {incident.description}
                                  </Text>
                                  <HStack>
                                    <Badge
                                      colorScheme={
                                        incident.resolved ? 'green' : 'red'
                                      }
                                    >
                                      {incident.resolved ? 'Resolved' : 'DRAFT'}
                                    </Badge>
                                  </HStack>
                                </VStack>
                              </CardBody>
                            </Card>
                          ))}
                        </VStack>
                      ) : (
                        <Alert status="success">
                          <AlertIcon />
                          <AlertTitle>No Incidents</AlertTitle>
                          <AlertDescription>
                            This driver has no reported incidents
                          </AlertDescription>
                        </Alert>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* Controls Tab */}
                  <TabPanel>
                    <VStack spacing={6} align="stretch">
                      <Heading size="sm">Driver Controls</Heading>

                      <Grid templateColumns="1fr 1fr" gap={6}>
                        <VStack align="start" spacing={4}>
                          <Heading size="sm">Account Status</Heading>

                          <FormControl>
                            <FormLabel>Account Status</FormLabel>
                            <Select
                              value={selectedDriver.status}
                              onChange={e =>
                                handleDriverAction(
                                  'update-status',
                                  selectedDriver.id,
                                  { status: e.target.value }
                                )
                              }
                            >
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                              <option value="inactive">Inactive</option>
                            </Select>
                          </FormControl>

                          <FormControl>
                            <FormLabel>Auto-Assign Limit</FormLabel>
                            <Input
                              type="number"
                              value={autoAssignLimit}
                              onChange={e =>
                                setAutoAssignLimit(parseInt(e.target.value))
                              }
                              min={1}
                              max={10}
                            />
                            <FormHelperText>
                              Maximum jobs this driver can be auto-assigned
                            </FormHelperText>
                          </FormControl>

                          <Button
                            leftIcon={<FiRefreshCw />}
                            colorScheme="orange"
                            onClick={() =>
                              handleDriverAction(
                                'reset-device',
                                selectedDriver.id
                              )
                            }
                          >
                            Reset Device
                          </Button>

                          <Button
                            leftIcon={<FiLogOut />}
                            colorScheme="red"
                            onClick={() =>
                              handleDriverAction(
                                'force-logout',
                                selectedDriver.id
                              )
                            }
                          >
                            Force Logout
                          </Button>
                        </VStack>

                        <VStack align="start" spacing={4}>
                          <Heading size="sm">Notifications</Heading>

                          <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="email-notifications" mb="0">
                              Email Notifications
                            </FormLabel>
                            <Switch id="email-notifications" defaultChecked />
                          </FormControl>

                          <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="sms-notifications" mb="0">
                              SMS Notifications
                            </FormLabel>
                            <Switch id="sms-notifications" defaultChecked />
                          </FormControl>

                          <FormControl display="flex" alignItems="center">
                            <FormLabel htmlFor="push-notifications" mb="0">
                              Push Notifications
                            </FormLabel>
                            <Switch id="push-notifications" defaultChecked />
                          </FormControl>

                          <Divider />

                          <VStack align="start" spacing={2}>
                            <Text fontWeight="medium">Quick Actions</Text>
                            <Button size="sm" variant="outline">
                              Send Message
                            </Button>
                            <Button size="sm" variant="outline">
                              View Documents
                            </Button>
                            <Button size="sm" variant="outline">
                              View History
                            </Button>
                          </VStack>
                        </VStack>
                      </Grid>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
