'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  SimpleGrid,
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
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Button,
  useToast,
  Icon,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Progress,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Image,
  Flex,
  Spacer,
} from '@chakra-ui/react';
import {
  FaUsers,
  FaMapMarkerAlt,
  FaClock,
  FaEye,
  FaMousePointer,
  FaSearch,
  FaDownload,
  FaRedo,
  FaChartBar,
  FaGlobe,
  FaCity,
  FaBuilding,
  FaUser,
  FaCalendarAlt,
  FaMobile,
  FaDesktop,
  FaTablet,
  FaFilter,
  FaSort,
} from 'react-icons/fa';

interface VisitorSession {
  sessionId: string;
  visitorId: string;
  city: string;
  region: string;
  country: string;
  coordinates: { lat: number; lng: number };
  entryTime: Date;
  exitTime?: Date;
  sessionDuration: number;
  pagesVisited: Array<{ page: string; timeSpent: number; timestamp: Date }>;
  actions: Array<{ action: string; timestamp: Date; details?: any }>;
  bookingStarted: boolean;
  bookingCompleted: boolean;
  bookingAbandonedAt?: number;
  deviceInfo: {
    userAgent: string;
    screenResolution: string;
    language: string;
    timezone: string;
  };
}

export default function VisitorsAnalyticsPage() {
  const [visitors, setVisitors] = useState<VisitorSession[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<VisitorSession[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorSession | null>(
    null
  );
  const [filters, setFilters] = useState({
    city: '',
    region: '',
    country: '',
    deviceType: '',
    dateRange: '7d',
    searchTerm: '',
  });
  const [sortBy, setSortBy] = useState('entryTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Load visitor data
  useEffect(() => {
    loadVisitorData();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...visitors];

    // Apply filters
    if (filters.city) {
      filtered = filtered.filter(v =>
        v.city.toLowerCase().includes(filters.city.toLowerCase())
      );
    }
    if (filters.region) {
      filtered = filtered.filter(v =>
        v.region.toLowerCase().includes(filters.region.toLowerCase())
      );
    }
    if (filters.country) {
      filtered = filtered.filter(v =>
        v.country.toLowerCase().includes(filters.country.toLowerCase())
      );
    }
    if (filters.deviceType) {
      filtered = filtered.filter(v => {
        const userAgent = v.deviceInfo.userAgent.toLowerCase();
        if (filters.deviceType === 'mobile')
          return /mobile|android|iphone|ipad|phone/i.test(userAgent);
        if (filters.deviceType === 'desktop')
          return !/mobile|android|iphone|ipad|phone/i.test(userAgent);
        if (filters.deviceType === 'tablet')
          return /ipad|tablet/i.test(userAgent);
        return true;
      });
    }
    if (filters.searchTerm) {
      filtered = filtered.filter(
        v =>
          v.city.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          v.region.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          v.visitorId.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    // Apply date range filter
    const now = new Date();
    if (filters.dateRange === '24h') {
      filtered = filtered.filter(
        v =>
          now.getTime() - new Date(v.entryTime).getTime() <= 24 * 60 * 60 * 1000
      );
    } else if (filters.dateRange === '7d') {
      filtered = filtered.filter(
        v =>
          now.getTime() - new Date(v.entryTime).getTime() <=
          7 * 24 * 60 * 60 * 1000
      );
    } else if (filters.dateRange === '30d') {
      filtered = filtered.filter(
        v =>
          now.getTime() - new Date(v.entryTime).getTime() <=
          30 * 24 * 60 * 60 * 1000
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'entryTime':
          aValue = new Date(a.entryTime).getTime();
          bValue = new Date(b.entryTime).getTime();
          break;
        case 'sessionDuration':
          aValue = a.sessionDuration;
          bValue = b.sessionDuration;
          break;
        case 'city':
          aValue = a.city.toLowerCase();
          bValue = b.city.toLowerCase();
          break;
        case 'region':
          aValue = a.region.toLowerCase();
          bValue = b.region.toLowerCase();
          break;
        default:
          aValue = a[sortBy as keyof VisitorSession];
          bValue = b[sortBy as keyof VisitorSession];
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredVisitors(filtered);
  }, [visitors, filters, sortBy, sortOrder]);

  const loadVisitorData = () => {
    try {
      const data = JSON.parse(
        localStorage.getItem('admin-visitor-analytics') || '[]'
      );
      setVisitors(data);
    } catch (error) {
      console.error('Error loading visitor data:', error);
    }
  };

  const refreshData = () => {
    setIsLoading(true);
    loadVisitorData();
    setTimeout(() => setIsLoading(false), 1000);

    toast({
      title: 'Data Refreshed',
      description: 'Visitor analytics data has been updated',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const exportData = () => {
    const filename = `speedy-van-visitors-${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([JSON.stringify(filteredVisitors, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Data Exported',
      description: 'Visitor data has been downloaded',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const openVisitorDetails = (visitor: VisitorSession) => {
    setSelectedVisitor(visitor);
    onOpen();
  };

  const calculateStats = () => {
    const totalVisitors = visitors.length;
    const uniqueVisitors = new Set(visitors.map(v => v.visitorId)).size;
    const averageSessionDuration =
      visitors.length > 0
        ? visitors.reduce((sum, v) => sum + v.sessionDuration, 0) /
          visitors.length
        : 0;

    const topCities = visitors.reduce(
      (acc, visitor) => {
        const city = visitor.city;
        acc[city] = (acc[city] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const topRegions = visitors.reduce(
      (acc, visitor) => {
        const region = visitor.region;
        acc[region] = (acc[region] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const deviceTypes = visitors.reduce(
      (acc, visitor) => {
        const userAgent = visitor.deviceInfo.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
          acc.mobile++;
        } else if (/ipad|tablet/i.test(userAgent)) {
          acc.tablet++;
        } else {
          acc.desktop++;
        }
        return acc;
      },
      { mobile: 0, tablet: 0, desktop: 0 }
    );

    const bookingStats = visitors.reduce(
      (acc, visitor) => {
        if (visitor.bookingStarted) acc.started++;
        if (visitor.bookingCompleted) acc.completed++;
        if (visitor.bookingAbandonedAt) acc.abandoned++;
        return acc;
      },
      { started: 0, completed: 0, abandoned: 0 }
    );

    return {
      totalVisitors,
      uniqueVisitors,
      averageSessionDuration,
      topCities: Object.entries(topCities)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([city, count]) => ({
          city,
          count,
          region: visitors.find(v => v.city === city)?.region || 'Unknown',
        })),
      topRegions: Object.entries(topRegions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([region, count]) => ({ region, count })),
      deviceTypes,
      bookingStats,
    };
  };

  const stats = calculateStats();

  const getDeviceIcon = (userAgent: string) => {
    const agent = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|phone/i.test(agent)) return FaMobile;
    if (/ipad|tablet/i.test(agent)) return FaTablet;
    return FaDesktop;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <VStack spacing={4} textAlign="center">
          <Heading size="2xl" color="blue.600">
            👥 Visitors Analytics Dashboard
          </Heading>
          <Text fontSize="lg" color="text.secondary">
            Comprehensive insights into visitor behavior, location patterns, and
            engagement metrics
          </Text>
        </VStack>

        {/* Action Buttons */}
        <HStack justify="space-between">
          <HStack spacing={4}>
            <Button
              leftIcon={<FaRedo />}
              onClick={refreshData}
              isLoading={isLoading}
              colorScheme="blue"
            >
              Refresh Data
            </Button>
            <Button
              leftIcon={<FaDownload />}
              onClick={exportData}
              colorScheme="green"
              isDisabled={filteredVisitors.length === 0}
            >
              Export Data
            </Button>
          </HStack>

          <Text fontSize="sm" color="text.secondary">
            <span suppressHydrationWarning>
              Last updated: {new Date().toLocaleString()}
            </span>
          </Text>
        </HStack>

        {/* Key Statistics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Card>
            <CardBody textAlign="center">
              <Stat>
                <StatLabel>Total Visitors</StatLabel>
                <StatNumber color="blue.600">{stats.totalVisitors}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" />
                  {stats.uniqueVisitors} unique
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody textAlign="center">
              <Stat>
                <StatLabel>Avg Session Time</StatLabel>
                <StatNumber color="green.600">
                  {formatDuration(stats.averageSessionDuration)}
                </StatNumber>
                <StatHelpText>Time spent on site</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody textAlign="center">
              <Stat>
                <StatLabel>Booking Started</StatLabel>
                <StatNumber color="orange.600">
                  {stats.bookingStats.started}
                </StatNumber>
                <StatHelpText>
                  {stats.bookingStats.completed} completed
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody textAlign="center">
              <Stat>
                <StatLabel>Top City</StatLabel>
                <StatNumber color="purple.600">
                  {stats.topCities[0]?.city || 'N/A'}
                </StatNumber>
                <StatHelpText>
                  {stats.topCities[0]?.count || 0} visitors
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Filters and Search */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Filters & Search</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                <InputGroup>
                  <InputLeftElement>
                    <FaSearch />
                  </InputLeftElement>
                  <Input
                    placeholder="Search visitors..."
                    value={filters.searchTerm}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        searchTerm: e.target.value,
                      }))
                    }
                  />
                </InputGroup>

                <Select
                  placeholder="Select City"
                  value={filters.city}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, city: e.target.value }))
                  }
                >
                  {Array.from(new Set(visitors.map(v => v.city))).map(city => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </Select>

                <Select
                  placeholder="Select Region"
                  value={filters.region}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, region: e.target.value }))
                  }
                >
                  {Array.from(new Set(visitors.map(v => v.region))).map(
                    region => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    )
                  )}
                </Select>

                <Select
                  placeholder="Device Type"
                  value={filters.deviceType}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      deviceType: e.target.value,
                    }))
                  }
                >
                  <option value="">All Devices</option>
                  <option value="mobile">Mobile</option>
                  <option value="tablet">Tablet</option>
                  <option value="desktop">Desktop</option>
                </Select>

                <Select
                  placeholder="Date Range"
                  value={filters.dateRange}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, dateRange: e.target.value }))
                  }
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                </Select>

                <Select
                  placeholder="Sort By"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="entryTime">Entry Time</option>
                  <option value="sessionDuration">Session Duration</option>
                  <option value="city">City</option>
                  <option value="region">Region</option>
                </Select>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Top Cities and Regions */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="blue.600">
                  🏙️ Top Cities
                </Heading>
                <VStack spacing={2} align="stretch">
                  {stats.topCities.slice(0, 5).map((city, index) => (
                    <HStack key={city.city} justify="space-between">
                      <HStack>
                        <Badge colorScheme="blue" variant="outline">
                          #{index + 1}
                        </Badge>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold">{city.city}</Text>
                          <Text fontSize="sm" color="text.secondary">
                            {city.region}
                          </Text>
                        </VStack>
                      </HStack>
                      <HStack>
                        <Text fontWeight="bold">{city.count}</Text>
                        <Text fontSize="sm" color="text.secondary">
                          visitors
                        </Text>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="green.600">
                  🌍 Top Regions
                </Heading>
                <VStack spacing={2} align="stretch">
                  {stats.topRegions.slice(0, 5).map((region, index) => (
                    <HStack key={region.region} justify="space-between">
                      <HStack>
                        <Badge colorScheme="green" variant="outline">
                          #{index + 1}
                        </Badge>
                        <Text fontWeight="bold">{region.region}</Text>
                      </HStack>
                      <HStack>
                        <Text fontWeight="bold">{region.count}</Text>
                        <Text fontSize="sm" color="text.secondary">
                          visitors
                        </Text>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Device and Booking Analytics */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="purple.600">
                  📱 Device Distribution
                </Heading>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FaMobile} color="blue.500" />
                      <Text>Mobile</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="bold">{stats.deviceTypes.mobile}</Text>
                      <Text fontSize="sm" color="text.secondary">
                        {(
                          (stats.deviceTypes.mobile / stats.totalVisitors) *
                          100
                        ).toFixed(1)}
                        %
                      </Text>
                    </HStack>
                  </HStack>
                  <Progress
                    value={
                      (stats.deviceTypes.mobile / stats.totalVisitors) * 100
                    }
                    colorScheme="blue"
                  />

                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FaTablet} color="green.500" />
                      <Text>Tablet</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="bold">{stats.deviceTypes.tablet}</Text>
                      <Text fontSize="sm" color="text.secondary">
                        {(
                          (stats.deviceTypes.tablet / stats.totalVisitors) *
                          100
                        ).toFixed(1)}
                        %
                      </Text>
                    </HStack>
                  </HStack>
                  <Progress
                    value={
                      (stats.deviceTypes.tablet / stats.totalVisitors) * 100
                    }
                    colorScheme="green"
                  />

                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FaDesktop} color="purple.500" />
                      <Text>Desktop</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="bold">{stats.deviceTypes.desktop}</Text>
                      <Text fontSize="sm" color="text.secondary">
                        {(
                          (stats.deviceTypes.desktop / stats.totalVisitors) *
                          100
                        ).toFixed(1)}
                        %
                      </Text>
                    </HStack>
                  </HStack>
                  <Progress
                    value={
                      (stats.deviceTypes.desktop / stats.totalVisitors) * 100
                    }
                    colorScheme="purple"
                  />
                </VStack>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Heading size="md" color="orange.600">
                  📊 Booking Conversion
                </Heading>
                <VStack spacing={3} align="stretch">
                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FaEye} color="blue.500" />
                      <Text>Started Booking</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="bold">
                        {stats.bookingStats.started}
                      </Text>
                      <Text fontSize="sm" color="text.secondary">
                        {(
                          (stats.bookingStats.started / stats.totalVisitors) *
                          100
                        ).toFixed(1)}
                        %
                      </Text>
                    </HStack>
                  </HStack>
                  <Progress
                    value={
                      (stats.bookingStats.started / stats.totalVisitors) * 100
                    }
                    colorScheme="blue"
                  />

                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FaMousePointer} color="green.500" />
                      <Text>Completed</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="bold">
                        {stats.bookingStats.completed}
                      </Text>
                      <Text fontSize="sm" color="text.secondary">
                        {(
                          (stats.bookingStats.completed / stats.totalVisitors) *
                          100
                        ).toFixed(1)}
                        %
                      </Text>
                    </HStack>
                  </HStack>
                  <Progress
                    value={
                      (stats.bookingStats.completed / stats.totalVisitors) * 100
                    }
                    colorScheme="green"
                  />

                  <HStack justify="space-between">
                    <HStack>
                      <Icon as={FaClock} color="red.500" />
                      <Text>Abandoned</Text>
                    </HStack>
                    <HStack>
                      <Text fontWeight="bold">
                        {stats.bookingStats.abandoned}
                      </Text>
                      <Text fontSize="sm" color="text.secondary">
                        {(
                          (stats.bookingStats.abandoned / stats.totalVisitors) *
                          100
                        ).toFixed(1)}
                        %
                      </Text>
                    </HStack>
                  </HStack>
                  <Progress
                    value={
                      (stats.bookingStats.abandoned / stats.totalVisitors) * 100
                    }
                    colorScheme="red"
                  />
                </VStack>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Visitors Table */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Heading size="md">Detailed Visitor Data</Heading>
                <Text fontSize="sm" color="text.secondary">
                  {filteredVisitors.length} of {visitors.length} visitors
                </Text>
              </HStack>

              {filteredVisitors.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>No Visitors Found</AlertTitle>
                    <AlertDescription>
                      Try adjusting your filters or refresh the data.
                    </AlertDescription>
                  </Box>
                </Alert>
              ) : (
                <Box overflowX="auto">
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Visitor</Th>
                        <Th>Location</Th>
                        <Th>Device</Th>
                        <Th>Entry Time</Th>
                        <Th>Duration</Th>
                        <Th>Actions</Th>
                        <Th>Booking</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredVisitors.slice(0, 50).map(visitor => (
                        <Tr key={visitor.sessionId} _hover={{ bg: 'gray.50' }}>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="bold" fontSize="sm">
                                {visitor.visitorId.substring(0, 8)}...
                              </Text>
                              <Text fontSize="xs" color="text.secondary">
                                {visitor.deviceInfo.language}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <HStack>
                                <Icon
                                  as={FaMapMarkerAlt}
                                  color="blue.500"
                                  boxSize={3}
                                />
                                <Text fontSize="sm" fontWeight="medium">
                                  {visitor.city}
                                </Text>
                              </HStack>
                              <Text fontSize="xs" color="text.secondary">
                                {visitor.region}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <HStack>
                              <Icon
                                as={getDeviceIcon(visitor.deviceInfo.userAgent)}
                                color="purple.500"
                              />
                              <VStack align="start" spacing={0}>
                                <Text fontSize="sm">
                                  {visitor.deviceInfo.screenResolution}
                                </Text>
                                <Text fontSize="xs" color="text.secondary">
                                  {visitor.deviceInfo.timezone}
                                </Text>
                              </VStack>
                            </HStack>
                          </Td>
                          <Td>
                            <VStack align="start" spacing={1}>
                              <Text fontSize="sm">
                                {new Date(
                                  visitor.entryTime
                                ).toLocaleDateString()}
                              </Text>
                              <Text fontSize="xs" color="text.secondary">
                                {new Date(
                                  visitor.entryTime
                                ).toLocaleTimeString()}
                              </Text>
                            </VStack>
                          </Td>
                          <Td>
                            <Text fontSize="sm" fontWeight="medium">
                              {formatDuration(visitor.sessionDuration)}
                            </Text>
                          </Td>
                          <Td>
                            <Text fontSize="sm">
                              {visitor.actions.length} actions
                            </Text>
                          </Td>
                          <Td>
                            <HStack spacing={2}>
                              {visitor.bookingStarted && (
                                <Badge colorScheme="blue" size="sm">
                                  Started
                                </Badge>
                              )}
                              {visitor.bookingCompleted && (
                                <Badge colorScheme="green" size="sm">
                                  Completed
                                </Badge>
                              )}
                              {visitor.bookingAbandonedAt && (
                                <Badge colorScheme="red" size="sm">
                                  Abandoned
                                </Badge>
                              )}
                            </HStack>
                          </Td>
                          <Td>
                            <Button
                              size="sm"
                              variant="outline"
                              colorScheme="blue"
                              onClick={() => openVisitorDetails(visitor)}
                            >
                              View Details
                            </Button>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>
      </VStack>

      {/* Visitor Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Visitor Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedVisitor && (
              <VStack spacing={6} align="stretch">
                {/* Basic Info */}
                <Card>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Basic Information</Heading>
                      <SimpleGrid columns={2} spacing={4}>
                        <VStack align="start">
                          <Text fontWeight="bold">Visitor ID:</Text>
                          <Text fontSize="sm" fontFamily="mono">
                            {selectedVisitor.visitorId}
                          </Text>
                        </VStack>
                        <VStack align="start">
                          <Text fontWeight="bold">Session ID:</Text>
                          <Text fontSize="sm" fontFamily="mono">
                            {selectedVisitor.sessionId}
                          </Text>
                        </VStack>
                        <VStack align="start">
                          <Text fontWeight="bold">Entry Time:</Text>
                          <Text fontSize="sm">
                            {new Date(
                              selectedVisitor.entryTime
                            ).toLocaleString()}
                          </Text>
                        </VStack>
                        <VStack align="start">
                          <Text fontWeight="bold">Duration:</Text>
                          <Text fontSize="sm">
                            {formatDuration(selectedVisitor.sessionDuration)}
                          </Text>
                        </VStack>
                      </SimpleGrid>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Location Info */}
                <Card>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Location Information</Heading>
                      <SimpleGrid columns={2} spacing={4}>
                        <VStack align="start">
                          <Text fontWeight="bold">City:</Text>
                          <Text fontSize="sm">{selectedVisitor.city}</Text>
                        </VStack>
                        <VStack align="start">
                          <Text fontWeight="bold">Region:</Text>
                          <Text fontSize="sm">{selectedVisitor.region}</Text>
                        </VStack>
                        <VStack align="start">
                          <Text fontWeight="bold">Country:</Text>
                          <Text fontSize="sm">{selectedVisitor.country}</Text>
                        </VStack>
                        <VStack align="start">
                          <Text fontWeight="bold">Coordinates:</Text>
                          <Text fontSize="sm" fontFamily="mono">
                            {selectedVisitor.coordinates.lat.toFixed(4)},{' '}
                            {selectedVisitor.coordinates.lng.toFixed(4)}
                          </Text>
                        </VStack>
                      </SimpleGrid>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Device Info */}
                <Card>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Device Information</Heading>
                      <SimpleGrid columns={2} spacing={4}>
                        <VStack align="start">
                          <Text fontWeight="bold">Screen Resolution:</Text>
                          <Text fontSize="sm">
                            {selectedVisitor.deviceInfo.screenResolution}
                          </Text>
                        </VStack>
                        <VStack align="start">
                          <Text fontWeight="bold">Language:</Text>
                          <Text fontSize="sm">
                            {selectedVisitor.deviceInfo.language}
                          </Text>
                        </VStack>
                        <VStack align="start">
                          <Text fontWeight="bold">Timezone:</Text>
                          <Text fontSize="sm">
                            {selectedVisitor.deviceInfo.timezone}
                          </Text>
                        </VStack>
                        <VStack align="start">
                          <Text fontWeight="bold">User Agent:</Text>
                          <Text fontSize="xs" fontFamily="mono" noOfLines={2}>
                            {selectedVisitor.deviceInfo.userAgent}
                          </Text>
                        </VStack>
                      </SimpleGrid>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Actions Timeline */}
                <Card>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Actions Timeline</Heading>
                      <VStack
                        spacing={2}
                        align="stretch"
                        maxH="200px"
                        overflowY="auto"
                      >
                        {selectedVisitor.actions.map((action, index) => (
                          <HStack
                            key={index}
                            justify="space-between"
                            p={2}
                            bg="gray.50"
                            borderRadius="md"
                          >
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="bold" fontSize="sm">
                                {action.action}
                              </Text>
                              {action.details && (
                                <Text fontSize="xs" color="text.secondary">
                                  {JSON.stringify(action.details)}
                                </Text>
                              )}
                            </VStack>
                            <Text fontSize="xs" color="text.secondary">
                              {new Date(action.timestamp).toLocaleTimeString()}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}
