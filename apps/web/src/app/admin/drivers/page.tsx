'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  ModalFooter,
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
  Container,
  SimpleGrid,
  Avatar,
  AvatarBadge,
  Collapse,
  CircularProgress,
  CircularProgressLabel,
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
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiActivity,
  FiUsers,
  FiAward,
  FiTarget,
  FiZap,
  FiMessageSquare,
  FiExternalLink,
  FiCopy,
  FiBell,
} from 'react-icons/fi';
import {
  FaWhatsapp,
  FaCar,
  FaIdCard,
  FaFileContract,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
} from 'react-icons/fa';

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

// Enhanced Stats Card Component
const StatCard = ({ icon, label, value, subValue, color, trend }: { 
  icon: any; 
  label: string; 
  value: string | number; 
  subValue?: string;
  color: string; 
  trend?: { value: string; isUp: boolean } 
}) => (
  <Card
    bg="rgba(255,255,255,0.02)"
    border="1px solid"
    borderColor="rgba(255,255,255,0.06)"
    borderRadius="xl"
    overflow="hidden"
    position="relative"
    _hover={{ 
      borderColor: `${color}.400`,
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 30px rgba(0,0,0,0.3)`
    }}
    transition="all 0.3s ease"
  >
    <Box
      position="absolute"
      top={0}
      left={0}
      right={0}
      h="3px"
      bgGradient={`linear(to-r, ${color}.400, ${color}.600)`}
    />
    <CardBody py={5} px={5}>
      <HStack spacing={4}>
        <Flex
          w="50px"
          h="50px"
          bg={`${color}.500`}
          bgGradient={`linear(135deg, ${color}.400, ${color}.600)`}
          borderRadius="xl"
          align="center"
          justify="center"
          boxShadow={`0 4px 15px var(--chakra-colors-${color}-500)`}
          opacity={0.9}
        >
          <Icon as={icon} boxSize={5} color="white" />
        </Flex>
        <Box flex={1}>
          <Text fontSize="xs" color="gray.400" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
            {label}
          </Text>
          <HStack spacing={2} align="baseline">
            <Text fontSize="2xl" fontWeight="bold" color="white">{value}</Text>
            {trend && (
              <HStack spacing={1}>
                <Icon as={trend.isUp ? FiTrendingUp : FiTrendingDown} color={trend.isUp ? 'green.400' : 'red.400'} boxSize={3} />
                <Text fontSize="xs" color={trend.isUp ? 'green.400' : 'red.400'}>
                  {trend.value}
                </Text>
              </HStack>
            )}
          </HStack>
          {subValue && <Text fontSize="xs" color="gray.500">{subValue}</Text>}
        </Box>
      </HStack>
    </CardBody>
  </Card>
);

// Driver Card Component for Grid View
const DriverCard = ({ driver, onView, getStatusColor, getAvailabilityColor, getComplianceStatus }: any) => {
  const compliance = getComplianceStatus(driver);
  return (
    <Card
      bg="rgba(255,255,255,0.02)"
      border="1px solid"
      borderColor={driver.status === 'suspended' ? 'red.500' : driver.complianceIssues.length > 0 ? 'yellow.500' : 'rgba(255,255,255,0.06)'}
      borderRadius="xl"
      overflow="hidden"
      _hover={{ borderColor: 'blue.400', transform: 'translateY(-2px)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)' }}
      transition="all 0.3s ease"
      cursor="pointer"
      onClick={() => onView(driver)}
    >
      <CardBody>
        <VStack align="stretch" spacing={4}>
          {/* Header */}
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Avatar 
                size="md" 
                name={driver.name}
                bg={driver.availability === 'online' ? 'green.500' : driver.availability === 'offline' ? 'gray.500' : 'yellow.500'}
              >
                <AvatarBadge 
                  boxSize="1em" 
                  bg={driver.availability === 'online' ? 'green.400' : driver.availability === 'offline' ? 'gray.400' : 'yellow.400'} 
                  borderColor="gray.900"
                />
              </Avatar>
              <Box>
                <Text fontWeight="bold" color="white" fontSize="sm">{driver.name}</Text>
                <HStack spacing={1}>
                  <Icon as={FiMapPin} boxSize={3} color="gray.500" />
                  <Text fontSize="xs" color="gray.400">{driver.basePostcode || 'N/A'}</Text>
                </HStack>
              </Box>
            </HStack>
            <VStack spacing={1} align="end">
              <Badge 
                colorScheme={getStatusColor(driver.status)}
                borderRadius="full"
                px={2}
                fontSize="xs"
              >
                {driver.status}
              </Badge>
              <Badge 
                colorScheme={compliance.color}
                borderRadius="full"
                px={2}
                fontSize="xs"
                variant="outline"
              >
                {compliance.text}
              </Badge>
            </VStack>
          </HStack>

          {/* Stats Row */}
          <SimpleGrid columns={3} spacing={2}>
            <Box textAlign="center" p={2} bg="rgba(255,255,255,0.03)" borderRadius="lg">
              <HStack justify="center" spacing={1}>
                <Icon as={FiStar} color="yellow.400" boxSize={3} />
                <Text fontWeight="bold" color="white" fontSize="sm">{driver.rating.toFixed(1)}</Text>
              </HStack>
              <Text fontSize="xs" color="gray.500">Rating</Text>
            </Box>
            <Box textAlign="center" p={2} bg="rgba(255,255,255,0.03)" borderRadius="lg">
              <Text fontWeight="bold" color="white" fontSize="sm">{driver.completedJobs}</Text>
              <Text fontSize="xs" color="gray.500">Jobs</Text>
            </Box>
            <Box textAlign="center" p={2} bg="rgba(255,255,255,0.03)" borderRadius="lg">
              <Text fontWeight="bold" color="green.400" fontSize="sm">
                £{(driver.totalEarnings / 100).toFixed(0)}
              </Text>
              <Text fontSize="xs" color="gray.500">Earned</Text>
            </Box>
          </SimpleGrid>

          {/* KPIs */}
          <Box>
            <HStack justify="space-between" mb={1}>
              <Text fontSize="xs" color="gray.400">Completion Rate</Text>
              <Text fontSize="xs" color="white" fontWeight="medium">{driver.kpis?.completionRate || 0}%</Text>
            </HStack>
            <Progress 
              value={driver.kpis?.completionRate || 0} 
              size="xs" 
              colorScheme={driver.kpis?.completionRate >= 90 ? 'green' : driver.kpis?.completionRate >= 70 ? 'yellow' : 'red'}
              borderRadius="full"
              bg="rgba(255,255,255,0.1)"
            />
          </Box>

          {/* Footer */}
          <HStack justify="space-between" fontSize="xs" color="gray.500">
            <HStack spacing={1}>
              <Icon as={FiClock} />
              <Text>
                {driver.lastSeen 
                  ? `Last seen ${getTimeAgo(driver.lastSeen)}`
                  : 'Never seen'}
              </Text>
            </HStack>
            <HStack spacing={1}>
              <Icon as={FiTruck} />
              <Text>{driver.vehicleType || 'Van'}</Text>
            </HStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};

// Helper function for time ago
const getTimeAgo = (date: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
};

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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Calculate stats
  const stats = useMemo(() => {
    const active = drivers.filter(d => d.status === 'active').length;
    const online = drivers.filter(d => d.availability === 'online').length;
    const compliance = drivers.filter(d => d.complianceIssues.length > 0).length;
    const avgRating = drivers.length > 0 
      ? (drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length).toFixed(1)
      : '0.0';
    const totalEarnings = drivers.reduce((sum, d) => sum + d.totalEarnings, 0);
    const totalJobs = drivers.reduce((sum, d) => sum + d.completedJobs, 0);
    return { total: drivers.length, active, online, compliance, avgRating, totalEarnings, totalJobs };
  }, [drivers]);

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`,
      status: 'success',
      duration: 2000,
    });
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

  const openDriverModal = (driver: Driver) => {
    setSelectedDriver(driver);
    onOpen();
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="#121A2B">
        <Flex justify="center" align="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.400" thickness="4px" />
            <Text color="gray.400">Loading drivers...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="#121A2B" py={6}>
      <Container maxW="container.xl">
        <VStack spacing={6} align="stretch">
          
          {/* Enhanced Header */}
          <Box
            bg="rgba(255,255,255,0.02)"
            borderRadius="2xl"
            border="1px solid rgba(255,255,255,0.06)"
            p={6}
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              h="4px"
              bgGradient="linear(to-r, green.400, blue.500, purple.500)"
            />
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <HStack spacing={4}>
                <Flex
                  w="60px"
                  h="60px"
                  bg="green.500"
                  bgGradient="linear(135deg, green.400, blue.500)"
                  borderRadius="xl"
                  align="center"
                  justify="center"
                  boxShadow="0 8px 30px rgba(72, 187, 120, 0.3)"
                >
                  <Icon as={FiUsers} boxSize={7} color="white" />
                </Flex>
                <Box>
                  <Heading size="lg" color="white" fontWeight="bold">
                    Driver Roster
                  </Heading>
                  <Text color="gray.400" fontSize="sm">
                    Manage active drivers, compliance & performance
                  </Text>
                </Box>
              </HStack>
              <HStack spacing={3}>
                <Tooltip label="Export Data">
                  <IconButton
                    aria-label="Export"
                    icon={<FiDownload />}
                    variant="outline"
                    colorScheme="gray"
                    borderRadius="xl"
                    onClick={() => toast({ title: 'Exporting...', status: 'info', duration: 2000 })}
                  />
                </Tooltip>
                <Tooltip label="Refresh">
                  <IconButton
                    aria-label="Refresh"
                    icon={<FiRefreshCw />}
                    onClick={fetchDrivers}
                    variant="outline"
                    colorScheme="blue"
                    borderRadius="xl"
                    isLoading={loading}
                  />
                </Tooltip>
                <Button
                  leftIcon={<FiFilter />}
                  variant="outline"
                  colorScheme="purple"
                  borderRadius="xl"
                  onClick={() => setShowFilters(!showFilters)}
                  rightIcon={showFilters ? <FiChevronUp /> : <FiChevronDown />}
                >
                  Filters
                </Button>
              </HStack>
            </Flex>
          </Box>

          {/* Enhanced Stats Row */}
          <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
            <StatCard 
              icon={FiUsers} 
              label="Total Drivers" 
              value={stats.total} 
              color="gray"
            />
            <StatCard 
              icon={FiCheck} 
              label="Active" 
              value={stats.active} 
              subValue={`${Math.round((stats.active / Math.max(stats.total, 1)) * 100)}% of total`}
              color="green"
            />
            <StatCard 
              icon={FiActivity} 
              label="Online Now" 
              value={stats.online} 
              color="blue"
              trend={{ value: 'Live', isUp: true }}
            />
            <StatCard 
              icon={FiAlertTriangle} 
              label="Compliance Issues" 
              value={stats.compliance} 
              color={stats.compliance > 0 ? 'red' : 'green'}
            />
            <StatCard 
              icon={FiStar} 
              label="Avg Rating" 
              value={stats.avgRating} 
              color="yellow"
            />
            <StatCard 
              icon={FiDollarSign} 
              label="Total Earned" 
              value={`£${(stats.totalEarnings / 100).toLocaleString()}`} 
              subValue={`${stats.totalJobs} jobs completed`}
              color="purple"
            />
          </SimpleGrid>

          {/* Filters Section */}
          <Collapse in={showFilters} animateOpacity>
            <Box
              bg="rgba(255,255,255,0.02)"
              borderRadius="xl"
              border="1px solid rgba(255,255,255,0.06)"
              p={5}
            >
              <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={4}>
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={2} fontWeight="medium">Search</Text>
                  <InputGroup>
                    <InputLeftElement>
                      <Icon as={FiSearch} color="gray.500" />
                    </InputLeftElement>
                    <Input
                      placeholder="Name, email, phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      bg="rgba(255,255,255,0.03)"
                      border="1px solid rgba(255,255,255,0.1)"
                      borderRadius="xl"
                      color="white"
                      _placeholder={{ color: 'gray.500' }}
                      _focus={{ borderColor: 'blue.400' }}
                    />
                  </InputGroup>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={2} fontWeight="medium">Status</Text>
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    bg="rgba(255,255,255,0.03)"
                    border="1px solid rgba(255,255,255,0.1)"
                    borderRadius="xl"
                    color="white"
                  >
                    <option value="all" style={{ background: '#18233A' }}>All Status</option>
                    <option value="active" style={{ background: '#18233A' }}>Active</option>
                    <option value="suspended" style={{ background: '#18233A' }}>Suspended</option>
                    <option value="inactive" style={{ background: '#18233A' }}>Inactive</option>
                  </Select>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={2} fontWeight="medium">Availability</Text>
                  <Select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    bg="rgba(255,255,255,0.03)"
                    border="1px solid rgba(255,255,255,0.1)"
                    borderRadius="xl"
                    color="white"
                  >
                    <option value="all" style={{ background: '#18233A' }}>All</option>
                    <option value="online" style={{ background: '#18233A' }}>Online</option>
                    <option value="offline" style={{ background: '#18233A' }}>Offline</option>
                    <option value="break" style={{ background: '#18233A' }}>On Break</option>
                  </Select>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={2} fontWeight="medium">Compliance</Text>
                  <Select
                    value={complianceFilter}
                    onChange={(e) => setComplianceFilter(e.target.value)}
                    bg="rgba(255,255,255,0.03)"
                    border="1px solid rgba(255,255,255,0.1)"
                    borderRadius="xl"
                    color="white"
                  >
                    <option value="all" style={{ background: '#18233A' }}>All</option>
                    <option value="compliant" style={{ background: '#18233A' }}>Compliant</option>
                    <option value="issues" style={{ background: '#18233A' }}>Has Issues</option>
                  </Select>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.400" mb={2} fontWeight="medium">View</Text>
                  <HStack>
                    <Button
                      size="sm"
                      flex={1}
                      variant={viewMode === 'table' ? 'solid' : 'outline'}
                      colorScheme="blue"
                      borderRadius="xl"
                      onClick={() => setViewMode('table')}
                    >
                      Table
                    </Button>
                    <Button
                      size="sm"
                      flex={1}
                      variant={viewMode === 'grid' ? 'solid' : 'outline'}
                      colorScheme="blue"
                      borderRadius="xl"
                      onClick={() => setViewMode('grid')}
                    >
                      Cards
                    </Button>
                  </HStack>
                </Box>
              </SimpleGrid>
            </Box>
          </Collapse>

          {/* Quick Search (Always visible when filters hidden) */}
          {!showFilters && (
            <InputGroup maxW="400px">
              <InputLeftElement>
                <Icon as={FiSearch} color="gray.500" />
              </InputLeftElement>
              <Input
                placeholder="Quick search drivers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                bg="rgba(255,255,255,0.03)"
                border="1px solid rgba(255,255,255,0.1)"
                borderRadius="xl"
                color="white"
                _placeholder={{ color: 'gray.500' }}
                _focus={{ borderColor: 'blue.400' }}
              />
            </InputGroup>
          )}

          {/* Content */}
          {filteredDrivers.length === 0 ? (
            <Box 
              textAlign="center" 
              py={20}
              bg="rgba(255,255,255,0.02)"
              borderRadius="xl"
              border="1px solid rgba(255,255,255,0.06)"
            >
              <Icon as={FiUsers} boxSize={16} color="gray.600" mb={4} />
              <Text color="gray.400" fontSize="lg">No drivers found</Text>
              <Text color="gray.500" fontSize="sm" mt={2}>
                {searchTerm ? 'Try adjusting your search' : 'Add drivers to get started'}
              </Text>
            </Box>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
              {filteredDrivers.map((driver) => (
                <DriverCard
                  key={driver.id}
                  driver={driver}
                  onView={openDriverModal}
                  getStatusColor={getStatusColor}
                  getAvailabilityColor={getAvailabilityColor}
                  getComplianceStatus={getComplianceStatus}
                />
              ))}
            </SimpleGrid>
          ) : (
            /* Table View */
            <Box 
              overflowX="auto" 
              bg="rgba(255,255,255,0.02)" 
              borderRadius="xl" 
              border="1px solid rgba(255,255,255,0.06)"
            >
              <Table variant="simple">
                <Thead>
                  <Tr bg="rgba(255,255,255,0.03)">
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)" py={4}>Driver</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)">Status</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)">Availability</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)">Compliance</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)">Performance</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)">Last Seen</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)" textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredDrivers.map((driver) => {
                    const compliance = getComplianceStatus(driver);
                    return (
                      <Tr 
                        key={driver.id} 
                        _hover={{ bg: 'rgba(255,255,255,0.03)' }}
                        borderColor="rgba(255,255,255,0.06)"
                        cursor="pointer"
                        onClick={() => openDriverModal(driver)}
                      >
                        <Td borderColor="rgba(255,255,255,0.06)">
                          <HStack spacing={3}>
                            <Avatar 
                              size="sm" 
                              name={driver.name}
                              bg={driver.availability === 'online' ? 'green.500' : 'gray.500'}
                            >
                              <AvatarBadge 
                                boxSize="1em" 
                                bg={driver.availability === 'online' ? 'green.400' : 'gray.400'} 
                                borderColor="gray.900"
                              />
                            </Avatar>
                            <Box>
                              <Text fontWeight="semibold" color="white" fontSize="sm">
                                {driver.name}
                              </Text>
                              <HStack spacing={2} fontSize="xs" color="gray.500">
                                <Text>{driver.email}</Text>
                              </HStack>
                            </Box>
                          </HStack>
                        </Td>
                        <Td borderColor="rgba(255,255,255,0.06)">
                          <Badge 
                            colorScheme={getStatusColor(driver.status)}
                            borderRadius="full"
                            px={3}
                          >
                            {driver.status}
                          </Badge>
                        </Td>
                        <Td borderColor="rgba(255,255,255,0.06)">
                          <Badge 
                            colorScheme={getAvailabilityColor(driver.availability)}
                            borderRadius="full"
                            px={3}
                            variant="subtle"
                          >
                            <HStack spacing={1}>
                              <Box w={2} h={2} borderRadius="full" bg={driver.availability === 'online' ? 'green.400' : driver.availability === 'offline' ? 'gray.400' : 'yellow.400'} />
                              <Text>{driver.availability}</Text>
                            </HStack>
                          </Badge>
                        </Td>
                        <Td borderColor="rgba(255,255,255,0.06)">
                          <Badge 
                            colorScheme={compliance.color}
                            borderRadius="full"
                            px={3}
                          >
                            <HStack spacing={1}>
                              <Icon as={compliance.color === 'green' ? FaCheckCircle : compliance.color === 'yellow' ? FaExclamationTriangle : FaTimesCircle} boxSize={3} />
                              <Text>{compliance.text}</Text>
                            </HStack>
                          </Badge>
                        </Td>
                        <Td borderColor="rgba(255,255,255,0.06)">
                          <VStack align="start" spacing={1}>
                            <HStack spacing={2}>
                              <HStack spacing={1}>
                                <Icon as={FiStar} color="yellow.400" boxSize={3} />
                                <Text fontSize="sm" color="white" fontWeight="medium">{driver.rating.toFixed(1)}</Text>
                              </HStack>
                              <Text fontSize="xs" color="gray.500">•</Text>
                              <Text fontSize="xs" color="gray.400">{driver.completedJobs} jobs</Text>
                            </HStack>
                            <Progress 
                              value={driver.kpis?.completionRate || 0} 
                              size="xs" 
                              w="80px"
                              colorScheme="blue"
                              borderRadius="full"
                              bg="rgba(255,255,255,0.1)"
                            />
                          </VStack>
                        </Td>
                        <Td borderColor="rgba(255,255,255,0.06)">
                          <Text fontSize="sm" color="gray.400">
                            {driver.lastSeen ? getTimeAgo(driver.lastSeen) : 'Never'}
                          </Text>
                        </Td>
                        <Td borderColor="rgba(255,255,255,0.06)" textAlign="right" onClick={(e) => e.stopPropagation()}>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<FiMoreVertical />}
                              variant="ghost"
                              size="sm"
                              color="gray.400"
                              _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                            />
                            <MenuList bg="#18233A" borderColor="rgba(255,255,255,0.1)">
                              <MenuItem 
                                icon={<FiEye />}
                                bg="transparent"
                                _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                                color="white"
                                onClick={() => openDriverModal(driver)}
                              >
                                View Profile
                              </MenuItem>
                              <MenuItem 
                                icon={<FiMail />}
                                bg="transparent"
                                _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                                color="white"
                                as="a"
                                href={`mailto:${driver.email}`}
                              >
                                Send Email
                              </MenuItem>
                              {driver.phone && (
                                <MenuItem 
                                  icon={<FaWhatsapp />}
                                  bg="transparent"
                                  _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                                  color="green.400"
                                  as="a"
                                  href={`https://wa.me/${driver.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                >
                                  WhatsApp
                                </MenuItem>
                              )}
                              <MenuDivider borderColor="rgba(255,255,255,0.1)" />
                              {driver.status === 'active' ? (
                                <MenuItem 
                                  icon={<FiPause />}
                                  bg="transparent"
                                  _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                                  color="red.400"
                                  onClick={() => handleDriverAction('suspend', driver.id)}
                                >
                                  Suspend Driver
                                </MenuItem>
                              ) : (
                                <MenuItem 
                                  icon={<FiPlay />}
                                  bg="transparent"
                                  _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                                  color="green.400"
                                  onClick={() => handleDriverAction('activate', driver.id)}
                                >
                                  Activate Driver
                                </MenuItem>
                              )}
                              <MenuItem 
                                icon={<FiRefreshCw />}
                                bg="transparent"
                                _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                                color="orange.400"
                                onClick={() => handleDriverAction('reset-device', driver.id)}
                              >
                                Reset Device
                              </MenuItem>
                              <MenuItem 
                                icon={<FiLogOut />}
                                bg="transparent"
                                _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                                color="red.400"
                                onClick={() => handleDriverAction('force-logout', driver.id)}
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
            </Box>
          )}

          {/* Results count */}
          {!loading && filteredDrivers.length > 0 && (
            <Text color="gray.500" fontSize="sm" textAlign="center">
              Showing {filteredDrivers.length} of {drivers.length} drivers
            </Text>
          )}
        </VStack>
      </Container>

      {/* Driver Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(8px)" />
        <ModalContent bg="#0f0f0f" borderColor="rgba(255,255,255,0.08)" borderWidth="1px" borderRadius="2xl" maxH="90vh">
          {/* Enhanced Header */}
          <ModalHeader p={0}>
            <Box
              position="relative"
              bg="rgba(255,255,255,0.02)"
              borderBottom="1px solid rgba(255,255,255,0.06)"
              p={6}
            >
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                h="3px"
                bgGradient="linear(to-r, green.400, blue.500)"
              />
              {selectedDriver && (
                <Flex justify="space-between" align="start" wrap="wrap" gap={4}>
                  <HStack spacing={4}>
                    <Avatar 
                      size="xl" 
                      name={selectedDriver.name}
                      bg={selectedDriver.availability === 'online' ? 'green.500' : 'gray.600'}
                    >
                      <AvatarBadge 
                        boxSize="0.9em" 
                        bg={selectedDriver.availability === 'online' ? 'green.400' : 'gray.500'} 
                        borderColor="#0f0f0f"
                        borderWidth="3px"
                      />
                    </Avatar>
                    <Box>
                      <HStack mb={1}>
                        <Heading size="lg" color="white">{selectedDriver.name}</Heading>
                        <Badge colorScheme={getStatusColor(selectedDriver.status)} borderRadius="full" px={3}>
                          {selectedDriver.status}
                        </Badge>
                      </HStack>
                      <HStack spacing={4} color="gray.400" fontSize="sm">
                        <HStack spacing={1} cursor="pointer" onClick={() => copyToClipboard(selectedDriver.email, 'Email')}>
                          <Icon as={FiMail} boxSize={3} />
                          <Text>{selectedDriver.email}</Text>
                        </HStack>
                        {selectedDriver.phone && (
                          <HStack spacing={1} cursor="pointer" onClick={() => copyToClipboard(selectedDriver.phone, 'Phone')}>
                            <Icon as={FiPhone} boxSize={3} />
                            <Text>{selectedDriver.phone}</Text>
                          </HStack>
                        )}
                      </HStack>
                      <HStack mt={2} spacing={2}>
                        <Badge 
                          colorScheme={getAvailabilityColor(selectedDriver.availability)} 
                          borderRadius="full"
                          px={3}
                          variant="subtle"
                        >
                          <HStack spacing={1}>
                            <Box w={2} h={2} borderRadius="full" bg={selectedDriver.availability === 'online' ? 'green.400' : 'gray.400'} />
                            <Text>{selectedDriver.availability}</Text>
                          </HStack>
                        </Badge>
                        <HStack spacing={1} color="gray.500" fontSize="xs">
                          <Icon as={FiClock} boxSize={3} />
                          <Text>Last seen: {selectedDriver.lastSeen ? getTimeAgo(selectedDriver.lastSeen) : 'Never'}</Text>
                        </HStack>
                      </HStack>
                    </Box>
                  </HStack>
                  <HStack spacing={2}>
                    {selectedDriver.phone && (
                      <Tooltip label="WhatsApp">
                        <IconButton
                          aria-label="WhatsApp"
                          icon={<FaWhatsapp />}
                          as="a"
                          href={`https://wa.me/${selectedDriver.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          colorScheme="green"
                          variant="solid"
                          size="sm"
                          borderRadius="lg"
                        />
                      </Tooltip>
                    )}
                    <Tooltip label="Send Email">
                      <IconButton
                        aria-label="Email"
                        icon={<FiMail />}
                        as="a"
                        href={`mailto:${selectedDriver.email}`}
                        colorScheme="blue"
                        variant="outline"
                        size="sm"
                        borderRadius="lg"
                      />
                    </Tooltip>
                    <Tooltip label="Call">
                      <IconButton
                        aria-label="Call"
                        icon={<FiPhone />}
                        as="a"
                        href={`tel:${selectedDriver.phone}`}
                        colorScheme="purple"
                        variant="outline"
                        size="sm"
                        borderRadius="lg"
                      />
                    </Tooltip>
                  </HStack>
                </Flex>
              )}
            </Box>
          </ModalHeader>
          <ModalCloseButton color="gray.400" _hover={{ bg: 'rgba(255,255,255,0.1)' }} />
          <ModalBody p={6}>
            {selectedDriver && (
              <Tabs colorScheme="blue" variant="soft-rounded">
                <TabList 
                  bg="rgba(255,255,255,0.03)" 
                  p={2} 
                  borderRadius="xl"
                  mb={6}
                  overflowX="auto"
                  flexWrap={{ base: 'nowrap', md: 'wrap' }}
                  gap={2}
                >
                  <Tab 
                    color="gray.400" 
                    _selected={{ bg: 'blue.500', color: 'white' }}
                    borderRadius="lg"
                    fontSize="sm"
                    px={4}
                  >
                    <HStack spacing={2}>
                      <Icon as={FiUser} boxSize={4} />
                      <Text>Overview</Text>
                    </HStack>
                  </Tab>
                  <Tab 
                    color="gray.400" 
                    _selected={{ bg: 'blue.500', color: 'white' }}
                    borderRadius="lg"
                    fontSize="sm"
                    px={4}
                  >
                    <HStack spacing={2}>
                      <Icon as={FiTrendingUp} boxSize={4} />
                      <Text>Performance</Text>
                    </HStack>
                  </Tab>
                  <Tab 
                    color="gray.400" 
                    _selected={{ bg: 'blue.500', color: 'white' }}
                    borderRadius="lg"
                    fontSize="sm"
                    px={4}
                  >
                    <HStack spacing={2}>
                      <Icon as={FiShieldIcon} boxSize={4} />
                      <Text>Compliance</Text>
                    </HStack>
                  </Tab>
                  <Tab 
                    color="gray.400" 
                    _selected={{ bg: 'blue.500', color: 'white' }}
                    borderRadius="lg"
                    fontSize="sm"
                    px={4}
                  >
                    <HStack spacing={2}>
                      <Icon as={FiAlertTriangle} boxSize={4} />
                      <Text>Incidents</Text>
                      {selectedDriver.incidents.length > 0 && (
                        <Badge colorScheme="red" borderRadius="full" fontSize="xs">
                          {selectedDriver.incidents.length}
                        </Badge>
                      )}
                    </HStack>
                  </Tab>
                  <Tab 
                    color="gray.400" 
                    _selected={{ bg: 'blue.500', color: 'white' }}
                    borderRadius="lg"
                    fontSize="sm"
                    px={4}
                  >
                    <HStack spacing={2}>
                      <Icon as={FiSettings} boxSize={4} />
                      <Text>Controls</Text>
                    </HStack>
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Overview Tab */}
                  <TabPanel p={0}>
                    <VStack spacing={6} align="stretch">
                      {/* Quick Stats Grid */}
                      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                        <Box 
                          bg="rgba(255,255,255,0.03)" 
                          borderRadius="xl" 
                          p={4}
                          border="1px solid rgba(255,255,255,0.06)"
                        >
                          <HStack spacing={3}>
                            <Flex
                              w="40px"
                              h="40px"
                              bg="blue.500"
                              bgGradient="linear(135deg, blue.400, blue.600)"
                              borderRadius="lg"
                              align="center"
                              justify="center"
                            >
                              <Icon as={FaCar} color="white" boxSize={4} />
                            </Flex>
                            <Box>
                              <Text fontSize="2xl" fontWeight="bold" color="white">
                                {selectedDriver.totalJobs}
                              </Text>
                              <Text fontSize="xs" color="gray.500">Total Jobs</Text>
                            </Box>
                          </HStack>
                        </Box>
                        <Box 
                          bg="rgba(255,255,255,0.03)" 
                          borderRadius="xl" 
                          p={4}
                          border="1px solid rgba(255,255,255,0.06)"
                        >
                          <HStack spacing={3}>
                            <Flex
                              w="40px"
                              h="40px"
                              bg="green.500"
                              bgGradient="linear(135deg, green.400, green.600)"
                              borderRadius="lg"
                              align="center"
                              justify="center"
                            >
                              <Icon as={FaCheckCircle} color="white" boxSize={4} />
                            </Flex>
                            <Box>
                              <Text fontSize="2xl" fontWeight="bold" color="white">
                                {selectedDriver.completedJobs}
                              </Text>
                              <Text fontSize="xs" color="gray.500">Completed</Text>
                            </Box>
                          </HStack>
                        </Box>
                        <Box 
                          bg="rgba(255,255,255,0.03)" 
                          borderRadius="xl" 
                          p={4}
                          border="1px solid rgba(255,255,255,0.06)"
                        >
                          <HStack spacing={3}>
                            <Flex
                              w="40px"
                              h="40px"
                              bg="yellow.500"
                              bgGradient="linear(135deg, yellow.400, orange.500)"
                              borderRadius="lg"
                              align="center"
                              justify="center"
                            >
                              <Icon as={FiStar} color="white" boxSize={4} />
                            </Flex>
                            <Box>
                              <Text fontSize="2xl" fontWeight="bold" color="white">
                                {selectedDriver.rating.toFixed(1)}
                              </Text>
                              <Text fontSize="xs" color="gray.500">Rating</Text>
                            </Box>
                          </HStack>
                        </Box>
                        <Box 
                          bg="rgba(255,255,255,0.03)" 
                          borderRadius="xl" 
                          p={4}
                          border="1px solid rgba(255,255,255,0.06)"
                        >
                          <HStack spacing={3}>
                            <Flex
                              w="40px"
                              h="40px"
                              bg="purple.500"
                              bgGradient="linear(135deg, purple.400, purple.600)"
                              borderRadius="lg"
                              align="center"
                              justify="center"
                            >
                              <Icon as={FiDollarSign} color="white" boxSize={4} />
                            </Flex>
                            <Box>
                              <Text fontSize="2xl" fontWeight="bold" color="white">
                                £{(selectedDriver.totalEarnings / 100).toFixed(0)}
                              </Text>
                              <Text fontSize="xs" color="gray.500">Earnings</Text>
                            </Box>
                          </HStack>
                        </Box>
                      </SimpleGrid>

                      {/* Personal Info & Status */}
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Box
                          bg="rgba(255,255,255,0.02)"
                          borderRadius="xl"
                          border="1px solid rgba(255,255,255,0.06)"
                          p={5}
                        >
                          <HStack mb={4}>
                            <Icon as={FiUser} color="blue.400" />
                            <Heading size="sm" color="white">Personal Information</Heading>
                          </HStack>
                          <VStack align="start" spacing={3}>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">Full Name</Text>
                              <Text fontSize="sm" color="white" fontWeight="medium">{selectedDriver.name}</Text>
                            </HStack>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">Email</Text>
                              <Text fontSize="sm" color="white">{selectedDriver.email}</Text>
                            </HStack>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">Phone</Text>
                              <Text fontSize="sm" color="white">{selectedDriver.phone}</Text>
                            </HStack>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">Base Postcode</Text>
                              <Text fontSize="sm" color="white">{selectedDriver.basePostcode}</Text>
                            </HStack>
                          </VStack>
                        </Box>

                        <Box
                          bg="rgba(255,255,255,0.02)"
                          borderRadius="xl"
                          border="1px solid rgba(255,255,255,0.06)"
                          p={5}
                        >
                          <HStack mb={4}>
                            <Icon as={FiActivity} color="green.400" />
                            <Heading size="sm" color="white">Status & Activity</Heading>
                          </HStack>
                          <VStack align="start" spacing={3}>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">Account Status</Text>
                              <Badge colorScheme={getStatusColor(selectedDriver.status)} borderRadius="full" px={3}>
                                {selectedDriver.status}
                              </Badge>
                            </HStack>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">Availability</Text>
                              <Badge colorScheme={getAvailabilityColor(selectedDriver.availability)} borderRadius="full" px={3}>
                                {selectedDriver.availability}
                              </Badge>
                            </HStack>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">Last Active</Text>
                              <Text fontSize="sm" color="white">
                                {selectedDriver.lastSeen ? getTimeAgo(selectedDriver.lastSeen) : 'Never'}
                              </Text>
                            </HStack>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">Compliance</Text>
                              <Badge 
                                colorScheme={getComplianceStatus(selectedDriver).color} 
                                borderRadius="full" 
                                px={3}
                              >
                                {getComplianceStatus(selectedDriver).text}
                              </Badge>
                            </HStack>
                          </VStack>
                        </Box>
                      </SimpleGrid>
                    </VStack>
                  </TabPanel>

                  {/* Performance Tab */}
                  <TabPanel p={0}>
                    <VStack spacing={6} align="stretch">
                      <Box
                        bg="rgba(255,255,255,0.02)"
                        borderRadius="xl"
                        border="1px solid rgba(255,255,255,0.06)"
                        p={5}
                      >
                        <Heading size="sm" color="white" mb={4}>Performance Metrics</Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                          <Box 
                            bg="rgba(255,255,255,0.03)" 
                            borderRadius="xl" 
                            p={4}
                            border="1px solid rgba(255,255,255,0.06)"
                          >
                            <HStack justify="space-between" mb={3}>
                              <Text fontSize="sm" color="gray.400">Acceptance Rate</Text>
                              <Text fontSize="lg" fontWeight="bold" color="green.400">
                                {selectedDriver.kpis.acceptanceRate}%
                              </Text>
                            </HStack>
                            <Progress
                              value={selectedDriver.kpis.acceptanceRate}
                              colorScheme="green"
                              size="sm"
                              borderRadius="full"
                              bg="rgba(255,255,255,0.1)"
                            />
                          </Box>
                          <Box 
                            bg="rgba(255,255,255,0.03)" 
                            borderRadius="xl" 
                            p={4}
                            border="1px solid rgba(255,255,255,0.06)"
                          >
                            <HStack justify="space-between" mb={3}>
                              <Text fontSize="sm" color="gray.400">Completion Rate</Text>
                              <Text fontSize="lg" fontWeight="bold" color="blue.400">
                                {selectedDriver.kpis.completionRate}%
                              </Text>
                            </HStack>
                            <Progress
                              value={selectedDriver.kpis.completionRate}
                              colorScheme="blue"
                              size="sm"
                              borderRadius="full"
                              bg="rgba(255,255,255,0.1)"
                            />
                          </Box>
                          <Box 
                            bg="rgba(255,255,255,0.03)" 
                            borderRadius="xl" 
                            p={4}
                            border="1px solid rgba(255,255,255,0.06)"
                          >
                            <HStack justify="space-between" mb={3}>
                              <Text fontSize="sm" color="gray.400">On-Time Rate</Text>
                              <Text fontSize="lg" fontWeight="bold" color="purple.400">
                                {selectedDriver.kpis.onTimeRate}%
                              </Text>
                            </HStack>
                            <Progress
                              value={selectedDriver.kpis.onTimeRate}
                              colorScheme="purple"
                              size="sm"
                              borderRadius="full"
                              bg="rgba(255,255,255,0.1)"
                            />
                          </Box>
                        </SimpleGrid>
                      </Box>

                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <Box
                          bg="rgba(255,255,255,0.02)"
                          borderRadius="xl"
                          border="1px solid rgba(255,255,255,0.06)"
                          p={5}
                        >
                          <HStack mb={4}>
                            <Icon as={FaCar} color="blue.400" />
                            <Heading size="sm" color="white">Job Statistics</Heading>
                          </HStack>
                          <VStack align="start" spacing={3}>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">Total Jobs</Text>
                              <Text fontSize="sm" color="white" fontWeight="medium">{selectedDriver.totalJobs}</Text>
                            </HStack>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">Completed</Text>
                              <Text fontSize="sm" color="green.400" fontWeight="medium">{selectedDriver.completedJobs}</Text>
                            </HStack>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">On Time</Text>
                              <Text fontSize="sm" color="white">{selectedDriver.onTimeJobs}</Text>
                            </HStack>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">Completion %</Text>
                              <Text fontSize="sm" color="white">
                                {selectedDriver.totalJobs > 0 
                                  ? Math.round((selectedDriver.completedJobs / selectedDriver.totalJobs) * 100) 
                                  : 0}%
                              </Text>
                            </HStack>
                          </VStack>
                        </Box>

                        <Box
                          bg="rgba(255,255,255,0.02)"
                          borderRadius="xl"
                          border="1px solid rgba(255,255,255,0.06)"
                          p={5}
                        >
                          <HStack mb={4}>
                            <Icon as={FiDollarSign} color="green.400" />
                            <Heading size="sm" color="white">Earnings</Heading>
                          </HStack>
                          <VStack align="start" spacing={3}>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">Total Earnings</Text>
                              <Text fontSize="sm" color="green.400" fontWeight="bold">
                                £{(selectedDriver.totalEarnings / 100).toFixed(2)}
                              </Text>
                            </HStack>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">Avg per Job</Text>
                              <Text fontSize="sm" color="white">
                                £{selectedDriver.totalJobs > 0
                                  ? (selectedDriver.totalEarnings / selectedDriver.totalJobs / 100).toFixed(2)
                                  : '0.00'}
                              </Text>
                            </HStack>
                            <HStack justify="space-between" w="full">
                              <Text fontSize="sm" color="gray.500">Customer Rating</Text>
                              <HStack>
                                <Icon as={FiStar} color="yellow.400" boxSize={3} />
                                <Text fontSize="sm" color="white" fontWeight="medium">
                                  {selectedDriver.rating.toFixed(1)}
                                </Text>
                              </HStack>
                            </HStack>
                          </VStack>
                        </Box>
                      </SimpleGrid>
                    </VStack>
                  </TabPanel>

                  {/* Compliance Tab */}
                  <TabPanel p={0}>
                    <VStack spacing={6} align="stretch">
                      {/* Compliance Status Alert */}
                      {selectedDriver.complianceIssues.length > 0 ? (
                        <Box
                          bg="rgba(245, 101, 101, 0.1)"
                          borderRadius="xl"
                          border="1px solid rgba(245, 101, 101, 0.3)"
                          p={5}
                        >
                          <HStack spacing={3} mb={3}>
                            <Icon as={FiAlertTriangle} color="red.400" boxSize={5} />
                            <Heading size="sm" color="red.400">Compliance Issues Found</Heading>
                          </HStack>
                          <VStack align="start" spacing={2}>
                            {selectedDriver.complianceIssues.map((issue, index) => (
                              <HStack key={index} spacing={2}>
                                <Box w={2} h={2} borderRadius="full" bg="red.400" />
                                <Text color="red.300" fontSize="sm">{issue}</Text>
                              </HStack>
                            ))}
                          </VStack>
                        </Box>
                      ) : (
                        <Box
                          bg="rgba(72, 187, 120, 0.1)"
                          borderRadius="xl"
                          border="1px solid rgba(72, 187, 120, 0.3)"
                          p={5}
                        >
                          <HStack spacing={3}>
                            <Icon as={FaCheckCircle} color="green.400" boxSize={5} />
                            <Box>
                              <Heading size="sm" color="green.400">All Compliance Checks Passed</Heading>
                              <Text color="green.300" fontSize="sm" mt={1}>
                                This driver meets all compliance requirements
                              </Text>
                            </Box>
                          </HStack>
                        </Box>
                      )}

                      {/* Documents Status */}
                      <Box
                        bg="rgba(255,255,255,0.02)"
                        borderRadius="xl"
                        border="1px solid rgba(255,255,255,0.06)"
                        p={5}
                      >
                        <Heading size="sm" color="white" mb={4}>Document Status</Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                          <Box 
                            bg="rgba(255,255,255,0.03)" 
                            borderRadius="xl" 
                            p={4}
                            border="1px solid rgba(255,255,255,0.06)"
                          >
                            <HStack justify="space-between" mb={3}>
                              <HStack>
                                <Icon as={FiFileText} color="blue.400" />
                                <Text color="white" fontWeight="medium">License</Text>
                              </HStack>
                              <Badge 
                                colorScheme={selectedDriver.documentExpiries.license ? 'red' : 'green'}
                                borderRadius="full"
                              >
                                {selectedDriver.documentExpiries.license ? 'Expires Soon' : 'Valid'}
                              </Badge>
                            </HStack>
                            {selectedDriver.documentExpiries.license && (
                              <Text fontSize="sm" color="red.300">
                                Expires: {new Date(selectedDriver.documentExpiries.license).toLocaleDateString()}
                              </Text>
                            )}
                          </Box>
                          <Box 
                            bg="rgba(255,255,255,0.03)" 
                            borderRadius="xl" 
                            p={4}
                            border="1px solid rgba(255,255,255,0.06)"
                          >
                            <HStack justify="space-between" mb={3}>
                              <HStack>
                                <Icon as={FiShieldIcon} color="purple.400" />
                                <Text color="white" fontWeight="medium">Insurance</Text>
                              </HStack>
                              <Badge 
                                colorScheme={selectedDriver.documentExpiries.insurance ? 'red' : 'green'}
                                borderRadius="full"
                              >
                                {selectedDriver.documentExpiries.insurance ? 'Expires Soon' : 'Valid'}
                              </Badge>
                            </HStack>
                            {selectedDriver.documentExpiries.insurance && (
                              <Text fontSize="sm" color="red.300">
                                Expires: {new Date(selectedDriver.documentExpiries.insurance).toLocaleDateString()}
                              </Text>
                            )}
                          </Box>
                          <Box 
                            bg="rgba(255,255,255,0.03)" 
                            borderRadius="xl" 
                            p={4}
                            border="1px solid rgba(255,255,255,0.06)"
                          >
                            <HStack justify="space-between" mb={3}>
                              <HStack>
                                <Icon as={FaCar} color="orange.400" />
                                <Text color="white" fontWeight="medium">MOT</Text>
                              </HStack>
                              <Badge 
                                colorScheme={selectedDriver.documentExpiries.mot ? 'red' : 'green'}
                                borderRadius="full"
                              >
                                {selectedDriver.documentExpiries.mot ? 'Expires Soon' : 'Valid'}
                              </Badge>
                            </HStack>
                            {selectedDriver.documentExpiries.mot && (
                              <Text fontSize="sm" color="red.300">
                                Expires: {new Date(selectedDriver.documentExpiries.mot).toLocaleDateString()}
                              </Text>
                            )}
                          </Box>
                        </SimpleGrid>
                      </Box>
                    </VStack>
                  </TabPanel>

                  {/* Incidents Tab */}
                  <TabPanel p={0}>
                    <VStack spacing={6} align="stretch">
                      {selectedDriver.incidents.length > 0 ? (
                        <VStack spacing={4} align="stretch">
                          {selectedDriver.incidents.map(incident => (
                            <Box
                              key={incident.id}
                              bg="rgba(255,255,255,0.02)"
                              borderRadius="xl"
                              border="1px solid rgba(255,255,255,0.06)"
                              p={5}
                              _hover={{ borderColor: 'rgba(255,255,255,0.12)' }}
                              transition="all 0.2s"
                            >
                              <HStack justify="space-between" mb={3}>
                                <HStack spacing={3}>
                                  <Badge 
                                    colorScheme={incident.severity === 'high' ? 'red' : incident.severity === 'medium' ? 'yellow' : 'green'}
                                    borderRadius="full"
                                    px={3}
                                    textTransform="capitalize"
                                  >
                                    {incident.severity} severity
                                  </Badge>
                                  <Badge 
                                    colorScheme={incident.resolved ? 'green' : 'orange'}
                                    borderRadius="full"
                                    px={3}
                                  >
                                    {incident.resolved ? 'Resolved' : 'Open'}
                                  </Badge>
                                </HStack>
                                <Text fontSize="sm" color="gray.500">
                                  {new Date(incident.createdAt).toLocaleDateString()}
                                </Text>
                              </HStack>
                              <Heading size="sm" color="white" mb={2}>{incident.type}</Heading>
                              <Text fontSize="sm" color="gray.400">{incident.description}</Text>
                            </Box>
                          ))}
                        </VStack>
                      ) : (
                        <Box
                          bg="rgba(72, 187, 120, 0.1)"
                          borderRadius="xl"
                          border="1px solid rgba(72, 187, 120, 0.3)"
                          p={8}
                          textAlign="center"
                        >
                          <Icon as={FaCheckCircle} color="green.400" boxSize={12} mb={4} />
                          <Heading size="md" color="green.400" mb={2}>No Incidents</Heading>
                          <Text color="green.300" fontSize="sm">
                            This driver has no reported incidents
                          </Text>
                        </Box>
                      )}
                    </VStack>
                  </TabPanel>

                  {/* Controls Tab */}
                  <TabPanel p={0}>
                    <VStack spacing={6} align="stretch">
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        {/* Account Settings */}
                        <Box
                          bg="rgba(255,255,255,0.02)"
                          borderRadius="xl"
                          border="1px solid rgba(255,255,255,0.06)"
                          p={5}
                        >
                          <HStack mb={4}>
                            <Icon as={FiSettings} color="blue.400" />
                            <Heading size="sm" color="white">Account Settings</Heading>
                          </HStack>
                          <VStack spacing={4}>
                            <FormControl>
                              <FormLabel color="gray.400" fontSize="sm">Account Status</FormLabel>
                              <Select
                                value={selectedDriver.status}
                                onChange={e => handleDriverAction('update-status', selectedDriver.id, { status: e.target.value })}
                                bg="rgba(255,255,255,0.03)"
                                border="1px solid rgba(255,255,255,0.1)"
                                borderRadius="xl"
                                color="white"
                              >
                                <option value="active" style={{ background: '#18233A' }}>Active</option>
                                <option value="suspended" style={{ background: '#18233A' }}>Suspended</option>
                                <option value="inactive" style={{ background: '#18233A' }}>Inactive</option>
                              </Select>
                            </FormControl>
                            <FormControl>
                              <FormLabel color="gray.400" fontSize="sm">Auto-Assign Limit</FormLabel>
                              <Input
                                type="number"
                                value={autoAssignLimit}
                                onChange={e => setAutoAssignLimit(parseInt(e.target.value))}
                                min={1}
                                max={10}
                                bg="rgba(255,255,255,0.03)"
                                border="1px solid rgba(255,255,255,0.1)"
                                borderRadius="xl"
                                color="white"
                              />
                              <FormHelperText color="gray.500" fontSize="xs">
                                Maximum jobs this driver can be auto-assigned
                              </FormHelperText>
                            </FormControl>
                          </VStack>
                        </Box>

                        {/* Notifications */}
                        <Box
                          bg="rgba(255,255,255,0.02)"
                          borderRadius="xl"
                          border="1px solid rgba(255,255,255,0.06)"
                          p={5}
                        >
                          <HStack mb={4}>
                            <Icon as={FiBell} color="purple.400" />
                            <Heading size="sm" color="white">Notifications</Heading>
                          </HStack>
                          <VStack spacing={4}>
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <FormLabel color="gray.400" fontSize="sm" mb="0">
                                Email Notifications
                              </FormLabel>
                              <Switch colorScheme="blue" defaultChecked />
                            </FormControl>
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <FormLabel color="gray.400" fontSize="sm" mb="0">
                                SMS Notifications
                              </FormLabel>
                              <Switch colorScheme="blue" defaultChecked />
                            </FormControl>
                            <FormControl display="flex" alignItems="center" justifyContent="space-between">
                              <FormLabel color="gray.400" fontSize="sm" mb="0">
                                Push Notifications
                              </FormLabel>
                              <Switch colorScheme="blue" defaultChecked />
                            </FormControl>
                          </VStack>
                        </Box>
                      </SimpleGrid>

                      {/* Quick Actions */}
                      <Box
                        bg="rgba(255,255,255,0.02)"
                        borderRadius="xl"
                        border="1px solid rgba(255,255,255,0.06)"
                        p={5}
                      >
                        <HStack mb={4}>
                          <Icon as={FiZap} color="yellow.400" />
                          <Heading size="sm" color="white">Quick Actions</Heading>
                        </HStack>
                        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                          <Button
                            leftIcon={<FiRefreshCw />}
                            colorScheme="orange"
                            variant="outline"
                            size="sm"
                            borderRadius="xl"
                            onClick={() => handleDriverAction('reset-device', selectedDriver.id)}
                          >
                            Reset Device
                          </Button>
                          <Button
                            leftIcon={<FiLogOut />}
                            colorScheme="red"
                            variant="outline"
                            size="sm"
                            borderRadius="xl"
                            onClick={() => handleDriverAction('force-logout', selectedDriver.id)}
                          >
                            Force Logout
                          </Button>
                          <Button
                            leftIcon={<FiMail />}
                            colorScheme="blue"
                            variant="outline"
                            size="sm"
                            borderRadius="xl"
                            as="a"
                            href={`mailto:${selectedDriver.email}`}
                          >
                            Send Email
                          </Button>
                          {selectedDriver.phone && (
                            <Button
                              leftIcon={<FaWhatsapp />}
                              colorScheme="green"
                              variant="solid"
                              size="sm"
                              borderRadius="xl"
                              as="a"
                              href={`https://wa.me/${selectedDriver.phone.replace(/\D/g, '')}`}
                              target="_blank"
                            >
                              WhatsApp
                            </Button>
                          )}
                        </SimpleGrid>
                      </Box>

                      {/* Danger Zone */}
                      <Box
                        bg="rgba(245, 101, 101, 0.05)"
                        borderRadius="xl"
                        border="1px solid rgba(245, 101, 101, 0.2)"
                        p={5}
                      >
                        <HStack mb={4}>
                          <Icon as={FiAlertTriangle} color="red.400" />
                          <Heading size="sm" color="red.400">Danger Zone</Heading>
                        </HStack>
                        <HStack spacing={3}>
                          {selectedDriver.status === 'active' ? (
                            <Button
                              leftIcon={<FiPause />}
                              colorScheme="red"
                              variant="outline"
                              size="sm"
                              borderRadius="xl"
                              onClick={() => handleDriverAction('suspend', selectedDriver.id)}
                            >
                              Suspend Driver
                            </Button>
                          ) : (
                            <Button
                              leftIcon={<FiPlay />}
                              colorScheme="green"
                              variant="solid"
                              size="sm"
                              borderRadius="xl"
                              onClick={() => handleDriverAction('activate', selectedDriver.id)}
                            >
                              Activate Driver
                            </Button>
                          )}
                        </HStack>
                      </Box>
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
