'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  IconButton,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiUsers,
  FiTruck,
  FiUserCheck,
  FiUserPlus,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiEye,
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiShield,
  FiRefreshCw,
} from 'react-icons/fi';
import { AdminShell } from '@/components/admin';
import { useRouter } from 'next/navigation';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  onboardingStatus: string;
  lastSeen?: string;
  totalJobs: number;
  rating: number;
  createdAt: string;
}

interface DriverApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  totalSpent: number;
  lastBooking?: string;
  createdAt: string;
  status: string;
}

interface PeopleStats {
  totalDrivers: number;
  activeDrivers: number;
  pendingApplications: number;
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
}

export default function PeoplePage() {
  const [stats, setStats] = useState<PeopleStats | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const toast = useToast();
  const router = useRouter();
  const bgColor = useColorModeValue('white', 'gray.800');

  const loadPeopleData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Load stats
      try {
        const statsResponse = await fetch('/api/admin/people/stats');
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      }

      // Load drivers
      try {
        const driversResponse = await fetch('/api/admin/drivers?limit=10');
        if (driversResponse.ok) {
          const driversData = await driversResponse.json();
          setDrivers(Array.isArray(driversData) ? driversData : (driversData.drivers || []));
        }
      } catch (error) {
        console.error('Error loading drivers:', error);
        setDrivers([]);
      }

      // Load applications
      try {
        const applicationsResponse = await fetch('/api/admin/drivers/applications?limit=10');
        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json();
          setApplications(Array.isArray(applicationsData) ? applicationsData : (applicationsData.applications || []));
        }
      } catch (error) {
        console.error('Error loading applications:', error);
        setApplications([]);
      }

      // Load customers
      try {
        const customersResponse = await fetch('/api/admin/customers?limit=10');
        if (customersResponse.ok) {
          const customersData = await customersResponse.json();
          setCustomers(Array.isArray(customersData) ? customersData : (customersData.customers || []));
        }
      } catch (error) {
        console.error('Error loading customers:', error);
        setCustomers([]);
      }

    } catch (error) {
      console.error('Error loading people data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load people data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeopleData();
  }, []);

  const getStatusColor = (status?: string) => {
    if (!status) return 'gray';
    
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'online':
        return 'green';
      case 'pending':
      case 'under_review':
        return 'yellow';
      case 'inactive':
      case 'rejected':
      case 'offline':
        return 'red';
      case 'suspended':
        return 'orange';
      default:
        return 'gray';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (loading) {
    return (
      <AdminShell title="People" subtitle="Manage drivers, applications, and customers">
        <Container maxW="7xl">
          <VStack spacing={8} align="center" py={12}>
            <Spinner size="xl" color="blue.500" />
            <Text>Loading people data...</Text>
          </VStack>
        </Container>
      </AdminShell>
    );
  }

  return (
    <AdminShell 
      title="People Management" 
      subtitle="Drivers, applications, and customers overview"
      actions={
        <HStack spacing={2}>
          <Tooltip label="Refresh data">
            <IconButton
              size="sm"
              variant="outline"
              icon={<FiRefreshCw />}
              onClick={() => loadPeopleData(true)}
              aria-label="Refresh"
            />
          </Tooltip>
        </HStack>
      }
    >
      <Container maxW="7xl">
        <VStack spacing={6} align="stretch">
          
          {/* Statistics Overview */}
          {stats && (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 6 }} spacing={4}>
              <Card bg={bgColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Drivers</StatLabel>
                    <StatNumber color="blue.500">{stats.totalDrivers}</StatNumber>
                    <StatHelpText>
                      <FiTruck style={{ display: 'inline', marginRight: '4px' }} />
                      All drivers
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={bgColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Active Drivers</StatLabel>
                    <StatNumber color="green.500">{stats.activeDrivers}</StatNumber>
                    <StatHelpText>
                      <FiUserCheck style={{ display: 'inline', marginRight: '4px' }} />
                      Online now
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={bgColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Pending Applications</StatLabel>
                    <StatNumber color="yellow.500">{stats.pendingApplications}</StatNumber>
                    <StatHelpText>
                      <FiUserPlus style={{ display: 'inline', marginRight: '4px' }} />
                      Need review
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={bgColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Total Customers</StatLabel>
                    <StatNumber color="purple.500">{stats.totalCustomers}</StatNumber>
                    <StatHelpText>
                      <FiUsers style={{ display: 'inline', marginRight: '4px' }} />
                      All customers
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={bgColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>Active Customers</StatLabel>
                    <StatNumber color="green.500">{stats.activeCustomers}</StatNumber>
                    <StatHelpText>
                      <FiUserCheck style={{ display: 'inline', marginRight: '4px' }} />
                      Recent bookings
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>

              <Card bg={bgColor}>
                <CardBody>
                  <Stat>
                    <StatLabel>New This Month</StatLabel>
                    <StatNumber color="blue.500">{stats.newCustomersThisMonth}</StatNumber>
                    <StatHelpText>
                      <FiUserPlus style={{ display: 'inline', marginRight: '4px' }} />
                      New customers
                    </StatHelpText>
                  </Stat>
                </CardBody>
              </Card>
            </SimpleGrid>
          )}

          {/* Tabs for Different People Categories */}
          <Card bg={bgColor}>
            <CardBody>
              <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
                <TabList>
                  <Tab>
                    <HStack spacing={2}>
                      <FiTruck />
                      <Text>Drivers ({drivers.length})</Text>
                    </HStack>
                  </Tab>
                  <Tab>
                    <HStack spacing={2}>
                      <FiUserPlus />
                      <Text>Applications ({applications.length})</Text>
                    </HStack>
                  </Tab>
                  <Tab>
                    <HStack spacing={2}>
                      <FiUsers />
                      <Text>Customers ({customers.length})</Text>
                    </HStack>
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Drivers Tab */}
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Heading size="md">Active Drivers</Heading>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => router.push('/admin/drivers')}
                        >
                          View All Drivers
                        </Button>
                      </HStack>
                      
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Name</Th>
                            <Th>Email</Th>
                            <Th>Status</Th>
                            <Th>Jobs Completed</Th>
                            <Th>Rating</Th>
                            <Th>Last Seen</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {drivers.map((driver) => (
                            <Tr key={driver.id}>
                              <Td>
                                <HStack>
                                  <FiTruck />
                                  <Text fontWeight="medium">{driver.name}</Text>
                                </HStack>
                              </Td>
                              <Td>{driver.email}</Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(driver.status)}>
                                  {driver.status || 'Unknown'}
                                </Badge>
                              </Td>
                              <Td>{driver.totalJobs || 0}</Td>
                              <Td>⭐ {(driver.rating || 0).toFixed(1)}/5</Td>
                              <Td>
                                <span suppressHydrationWarning>
                                  {driver.lastSeen ? formatDate(driver.lastSeen) : 'Never'}
                                </span>
                              </Td>
                              <Td>
                                <Menu>
                                  <MenuButton
                                    as={IconButton}
                                    icon={<FiMoreVertical />}
                                    variant="ghost"
                                    size="sm"
                                  />
                                  <MenuList>
                                    <MenuItem
                                      icon={<FiEye />}
                                      onClick={() => router.push(`/admin/drivers/${driver.id}`)}
                                    >
                                      View Details
                                    </MenuItem>
                                    <MenuItem
                                      icon={<FiEdit />}
                                      onClick={() => router.push(`/admin/drivers/${driver.id}?action=edit`)}
                                    >
                                      Edit Driver
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </VStack>
                  </TabPanel>

                  {/* Applications Tab */}
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Heading size="md">Driver Applications</Heading>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => router.push('/admin/drivers/applications')}
                        >
                          View All Applications
                        </Button>
                      </HStack>
                      
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Name</Th>
                            <Th>Email</Th>
                            <Th>Phone</Th>
                            <Th>Status</Th>
                            <Th>Submitted</Th>
                            <Th>Reviewed By</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {applications.map((application) => (
                            <Tr key={application.id}>
                              <Td>
                                <HStack>
                                  <FiUserPlus />
                                  <Text fontWeight="medium">{application.name}</Text>
                                </HStack>
                              </Td>
                              <Td>{application.email}</Td>
                              <Td>{application.phone}</Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(application.status)}>
                                  {application.status || 'Unknown'}
                                </Badge>
                              </Td>
                              <Td>
                                <span suppressHydrationWarning>
                                  {formatDate(application.submittedAt)}
                                </span>
                              </Td>
                              <Td>{application.reviewedBy || 'Pending'}</Td>
                              <Td>
                                <Menu>
                                  <MenuButton
                                    as={IconButton}
                                    icon={<FiMoreVertical />}
                                    variant="ghost"
                                    size="sm"
                                  />
                                  <MenuList>
                                    <MenuItem
                                      icon={<FiEye />}
                                      onClick={() => router.push(`/admin/drivers/applications/${application.id}`)}
                                    >
                                      Review Application
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </VStack>
                  </TabPanel>

                  {/* Customers Tab */}
                  <TabPanel>
                    <VStack spacing={4} align="stretch">
                      <HStack justify="space-between">
                        <Heading size="md">Customers</Heading>
                        <Button
                          size="sm"
                          colorScheme="blue"
                          onClick={() => router.push('/admin/customers')}
                        >
                          View All Customers
                        </Button>
                      </HStack>
                      
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Name</Th>
                            <Th>Email</Th>
                            <Th>Total Bookings</Th>
                            <Th>Total Spent</Th>
                            <Th>Last Booking</Th>
                            <Th>Status</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {customers.map((customer) => (
                            <Tr key={customer.id}>
                              <Td>
                                <HStack>
                                  <FiUsers />
                                  <Text fontWeight="medium">{customer.name}</Text>
                                </HStack>
                              </Td>
                              <Td>{customer.email}</Td>
                              <Td>{customer.totalBookings || 0}</Td>
                              <Td>£{(customer.totalSpent || 0).toFixed(2)}</Td>
                              <Td>
                                <span suppressHydrationWarning>
                                  {customer.lastBooking ? formatDate(customer.lastBooking) : 'Never'}
                                </span>
                              </Td>
                              <Td>
                                <Badge colorScheme={getStatusColor(customer.status)}>
                                  {customer.status || 'Unknown'}
                                </Badge>
                              </Td>
                              <Td>
                                <Menu>
                                  <MenuButton
                                    as={IconButton}
                                    icon={<FiMoreVertical />}
                                    variant="ghost"
                                    size="sm"
                                  />
                                  <MenuList>
                                    <MenuItem
                                      icon={<FiEye />}
                                      onClick={() => router.push(`/admin/customers/${customer.id}`)}
                                    >
                                      View Profile
                                    </MenuItem>
                                    <MenuItem
                                      icon={<FiMail />}
                                      onClick={() => window.open(`mailto:${customer.email}`)}
                                    >
                                      Send Email
                                    </MenuItem>
                                  </MenuList>
                                </Menu>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>

          {/* Quick Actions */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <Card bg={bgColor}>
              <CardBody>
                <VStack spacing={4}>
                  <FiTruck size={24} color="blue" />
                  <Heading size="sm">Manage Drivers</Heading>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    View, edit, and manage all registered drivers
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => router.push('/admin/drivers')}
                  >
                    Go to Drivers
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={bgColor}>
              <CardBody>
                <VStack spacing={4}>
                  <FiUserPlus size={24} color="orange" />
                  <Heading size="sm">Review Applications</Heading>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    Review and approve new driver applications
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="orange"
                    onClick={() => router.push('/admin/drivers/applications')}
                  >
                    Review Applications
                  </Button>
                </VStack>
              </CardBody>
            </Card>

            <Card bg={bgColor}>
              <CardBody>
                <VStack spacing={4}>
                  <FiUsers size={24} color="purple" />
                  <Heading size="sm">Manage Customers</Heading>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    View customer profiles and booking history
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    onClick={() => router.push('/admin/customers')}
                  >
                    Go to Customers
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </Container>
    </AdminShell>
  );
}
