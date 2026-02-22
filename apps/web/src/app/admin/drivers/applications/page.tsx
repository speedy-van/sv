'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Flex,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  SimpleGrid,
  GridItem,
  Divider,
  Image,
  Tag,
  TagLabel,
  TagLeftIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  FormControl,
  FormLabel,
  Icon,
  Avatar,
  Progress,
  Tooltip,
  Collapse,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from '@chakra-ui/react';
import {
  FiCheck,
  FiX,
  FiEye,
  FiSearch,
  FiRefreshCw,
  FiUser,
  FiTruck,
  FiCreditCard,
  FiFileText,
  FiCalendar,
  FiMail,
  FiPhone,
  FiMapPin,
  FiFilter,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiShield,
  FiDownload,
  FiExternalLink,
  FiUsers,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiCopy,
  FiMessageSquare,
} from 'react-icons/fi';
import { FaWhatsapp, FaIdCard, FaFileContract, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';
import { format, formatDistanceToNow } from 'date-fns';

interface DriverApplication {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county: string;
  postcode: string;
  dateOfBirth: string;
  nationalInsuranceNumber: string;
  drivingLicenseNumber: string;
  drivingLicenseExpiry: string;

  // Bank Information
  bankName: string;
  accountHolderName: string;
  sortCode: string;
  accountNumber: string;

  // Documents and Files
  drivingLicenseFrontImage?: string;
  drivingLicenseBackImage?: string;
  insuranceDocument?: string;
  rightToWorkDocument?: string;

  // Insurance Details
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  insuranceExpiry?: string;

  // Right to Work Details
  rightToWorkShareCode?: string;

  // Application Status and Review
  status: string;
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  applicationDate: string;

  // Metadata
  userId: string;
}

interface ApplicationsData {
  applications: DriverApplication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    total: number;
    statusCounts: Record<string, number>;
  };
}

const statusColors = {
  pending: 'yellow',
  under_review: 'blue',
  approved: 'green',
  rejected: 'red',
  requires_additional_info: 'orange',
};

const statusLabels = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  requires_additional_info: 'Requires Info',
};

// Document Image Component with error handling
const DocumentImage = ({ 
  src, 
  alt, 
  fallbackIcon,
  maxH = "200px"
}: { 
  src: string | null | undefined; 
  alt: string;
  fallbackIcon?: React.ElementType;
  maxH?: string;
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const FallbackIcon = fallbackIcon || FaIdCard;

  // Get proper URL for images
  const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/uploads/')) return `/api${url}`;
    return url;
  };

  const imageUrl = getImageUrl(src);

  if (!imageUrl || hasError) {
    return (
      <Box
        p={8}
        bg="rgba(255,255,255,0.05)"
        borderRadius="lg"
        textAlign="center"
        h={maxH}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Icon as={FallbackIcon} boxSize={8} color="gray.600" />
        <Text fontSize="xs" color="gray.500" mt={2}>
          {hasError ? 'Failed to load image' : 'Image not available'}
        </Text>
      </Box>
    );
  }

  return (
    <Box position="relative">
      {isLoading && (
        <Box
          position="absolute"
          inset={0}
          bg="rgba(255,255,255,0.05)"
          borderRadius="lg"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Spinner size="sm" color="gray.500" />
        </Box>
      )}
      <Image
        src={imageUrl}
        alt={alt}
        borderRadius="lg"
        maxH={maxH}
        w="100%"
        objectFit="cover"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        opacity={isLoading ? 0 : 1}
        transition="opacity 0.2s"
      />
    </Box>
  );
};

// Stat Card Component
const StatCard = ({ 
  icon, 
  label, 
  value, 
  subValue, 
  color = 'blue',
  trend,
}: { 
  icon: React.ElementType; 
  label: string; 
  value: string | number; 
  subValue?: string;
  color?: string;
  trend?: { value: string; isUp: boolean };
}) => (
  <Box
    bg="rgba(255,255,255,0.02)"
    borderRadius="xl"
    border="1px solid rgba(255,255,255,0.06)"
    p={4}
    position="relative"
    overflow="hidden"
    transition="all 0.2s"
    _hover={{ 
      bg: 'rgba(255,255,255,0.04)',
      borderColor: 'rgba(255,255,255,0.1)',
      transform: 'translateY(-2px)'
    }}
  >
    <Box
      position="absolute"
      top={0}
      left={0}
      w="3px"
      h="full"
      bg={`${color}.400`}
    />
    <HStack spacing={3} align="flex-start" flexWrap="wrap" rowGap={2}>
      <Flex
        w="40px"
        h="40px"
        bg={`${color}.500`}
        bgGradient={`linear(135deg, ${color}.400, ${color}.600)`}
        borderRadius="lg"
        align="center"
        justify="center"
        boxShadow={`0 4px 15px rgba(0,0,0,0.2)`}
      >
        <Icon as={icon} color="white" boxSize={5} />
      </Flex>
      <Box flex={1} minW="140px">
        <Text fontSize="2xl" fontWeight="bold" color="white" lineHeight={1}>
          {value}
        </Text>
        <Text fontSize="xs" color="gray.500" mt={0.5}>{label}</Text>
        {subValue && (
          <Text fontSize="xs" color="gray.400" mt={0.5}>{subValue}</Text>
        )}
      </Box>
      {trend && (
        <Badge 
          colorScheme={trend.isUp ? 'green' : 'red'} 
          variant="subtle" 
          borderRadius="full"
          fontSize="xs"
          whiteSpace="nowrap"
        >
          {trend.value}
        </Badge>
      )}
    </HStack>
  </Box>
);

// Application Card Component for Grid View
const ApplicationCard = ({
  application,
  onView,
  onApprove,
  onReject,
  isProcessing,
}: {
  application: DriverApplication;
  onView: (app: DriverApplication) => void;
  onApprove: (id: string) => void;
  onReject: (app: DriverApplication) => void;
  isProcessing: string | null;
}) => {
  const toast = useToast();
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied`, status: 'success', duration: 2000 });
  };

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <Box
      bg="rgba(255,255,255,0.02)"
      borderRadius="xl"
      border="1px solid rgba(255,255,255,0.06)"
      p={5}
      transition="all 0.2s"
      _hover={{ 
        bg: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.12)',
        transform: 'translateY(-2px)'
      }}
      cursor="pointer"
      onClick={() => onView(application)}
    >
      {/* Header */}
      <Flex justify="space-between" align="start" mb={4}>
        <HStack spacing={3}>
          <Avatar
            size="md"
            name={application.fullName}
            bg={statusColors[application.status as keyof typeof statusColors] + '.500'}
          />
          <Box>
            <Text fontWeight="bold" color="white" fontSize="md">
              {application.fullName}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Applied {getTimeAgo(application.applicationDate)}
            </Text>
          </Box>
        </HStack>
        <Badge 
          colorScheme={statusColors[application.status as keyof typeof statusColors]}
          borderRadius="full"
          px={3}
          py={1}
        >
          {statusLabels[application.status as keyof typeof statusLabels]}
        </Badge>
      </Flex>

      {/* Contact Info */}
      <VStack align="stretch" spacing={2} mb={4}>
        <HStack 
          spacing={2} 
          fontSize="sm" 
          color="gray.400"
          cursor="pointer"
          onClick={(e) => { e.stopPropagation(); copyToClipboard(application.email, 'Email'); }}
          _hover={{ color: 'white' }}
        >
          <Icon as={FiMail} boxSize={3} />
          <Text noOfLines={1}>{application.email}</Text>
        </HStack>
        <HStack 
          spacing={2} 
          fontSize="sm" 
          color="gray.400"
          cursor="pointer"
          onClick={(e) => { e.stopPropagation(); copyToClipboard(application.phone, 'Phone'); }}
          _hover={{ color: 'white' }}
        >
          <Icon as={FiPhone} boxSize={3} />
          <Text>{application.phone}</Text>
        </HStack>
        <HStack spacing={2} fontSize="sm" color="gray.400">
          <Icon as={FiMapPin} boxSize={3} />
          <Text>{application.postcode}</Text>
        </HStack>
      </VStack>

      {/* License Info */}
      <Box 
        bg="rgba(255,255,255,0.03)" 
        borderRadius="lg" 
        p={3} 
        mb={4}
      >
        <HStack justify="space-between" mb={1}>
          <Text fontSize="xs" color="gray.500">License</Text>
          <Text fontSize="xs" color="white" fontFamily="mono">
            {application.drivingLicenseNumber || 'N/A'}
          </Text>
        </HStack>
        <HStack justify="space-between">
          <Text fontSize="xs" color="gray.500">Expires</Text>
          <Text fontSize="xs" color={
            application.drivingLicenseExpiry && new Date(application.drivingLicenseExpiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
              ? 'orange.400'
              : 'green.400'
          }>
            {application.drivingLicenseExpiry 
              ? format(new Date(application.drivingLicenseExpiry), 'MMM dd, yyyy')
              : 'N/A'
            }
          </Text>
        </HStack>
      </Box>

      {/* Actions */}
      {(application.status === 'pending' || application.status === 'under_review') && (
        <HStack spacing={2} onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            flex={1}
            colorScheme="green"
            leftIcon={<FiCheck />}
            onClick={() => onApprove(application.id)}
            isLoading={isProcessing === application.id}
            borderRadius="lg"
          >
            Approve
          </Button>
          <Button
            size="sm"
            flex={1}
            colorScheme="red"
            variant="outline"
            leftIcon={<FiX />}
            onClick={() => onReject(application)}
            borderRadius="lg"
          >
            Reject
          </Button>
        </HStack>
      )}
    </Box>
  );
};

export default function DriverApplicationsPage() {
  const [applicationsData, setApplicationsData] = useState<ApplicationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<DriverApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showFilters, setShowFilters] = useState(false);
  
  const toast = useToast();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();

  // Stats calculation
  const stats = useMemo(() => {
    if (!applicationsData) return { total: 0, pending: 0, approved: 0, rejected: 0, underReview: 0 };
    const counts = applicationsData.summary.statusCounts;
    return {
      total: applicationsData.summary.total,
      pending: counts.pending || 0,
      approved: counts.approved || 0,
      rejected: counts.rejected || 0,
      underReview: counts.under_review || 0,
      requiresInfo: counts.requires_additional_info || 0,
    };
  }, [applicationsData]);

  // Copy to clipboard helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied`, status: 'success', duration: 2000 });
  };

  // Time ago helper
  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/admin/driver-applications?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      
      const data = await response.json();
      setApplicationsData(data.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast({
        title: 'Error',
        description: 'Failed to load driver applications',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedStatus, searchTerm]);

  const handleApprove = async (applicationId: string) => {
    try {
      setIsProcessing(applicationId);
      
      const response = await fetch(`/api/admin/driver-applications/${applicationId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve application');
      }
      
      toast({
        title: 'Application Approved! 🎉',
        description: 'Driver has been successfully approved and can now start working.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      await fetchApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve application',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      setIsProcessing(applicationId);
      
      const response = await fetch(`/api/admin/driver-applications/${applicationId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject application');
      }
      
      toast({
        title: 'Application Rejected',
        description: 'Driver application has been rejected.',
        status: 'info',
        duration: 5000,
        isClosable: true,
      });
      
      await fetchApplications();
      onRejectClose();
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject application',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(null);
    }
  };

  const openDetails = (application: DriverApplication) => {
    setSelectedApplication(application);
    onDetailsOpen();
  };

  const openReject = (application: DriverApplication) => {
    setSelectedApplication(application);
    onRejectOpen();
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="#121A2B">
        <Flex justify="center" align="center" minH="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.400" thickness="4px" />
            <Text color="gray.400">Loading driver applications...</Text>
          </VStack>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg="#121A2B" py={8}>
        <Container maxW="container.xl">
          <Box
            bg="rgba(245, 101, 101, 0.1)"
            borderRadius="xl"
            border="1px solid rgba(245, 101, 101, 0.3)"
            p={6}
            mb={4}
          >
            <HStack spacing={3}>
              <Icon as={FiAlertTriangle} color="red.400" boxSize={6} />
              <Box>
                <Text fontWeight="bold" color="red.400">Error loading applications</Text>
                <Text fontSize="sm" color="red.300">{error}</Text>
              </Box>
            </HStack>
          </Box>
          <Button onClick={fetchApplications} colorScheme="blue" borderRadius="xl">
            Try Again
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <>
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
              bgGradient="linear(to-r, blue.400, purple.500, pink.500)"
            />
            <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
              <HStack spacing={4}>
                <Flex
                  w="60px"
                  h="60px"
                  bg="blue.500"
                  bgGradient="linear(135deg, blue.400, purple.500)"
                  borderRadius="xl"
                  align="center"
                  justify="center"
                  boxShadow="0 8px 30px rgba(66, 153, 225, 0.3)"
                >
                  <Icon as={FiUsers} boxSize={7} color="white" />
                </Flex>
                <Box>
                  <Heading size="lg" color="white" fontWeight="bold">
                    Driver Applications
                  </Heading>
                  <Text color="gray.400" fontSize="sm">
                    Review and manage driver onboarding applications
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
                    onClick={fetchApplications}
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
          <SimpleGrid
            columns={{ base: 1, sm: 2, md: 3, xl: 6 }}
            minChildWidth="200px"
            spacing={4}
          >
            <StatCard 
              icon={FiUsers} 
              label="Total Applications" 
              value={stats.total} 
              color="gray"
            />
            <StatCard 
              icon={FiClock} 
              label="Pending Review" 
              value={stats.pending} 
              color="yellow"
              trend={stats.pending > 0 ? { value: 'Action needed', isUp: true } : undefined}
            />
            <StatCard 
              icon={FiEye} 
              label="Under Review" 
              value={stats.underReview} 
              color="blue"
            />
            <StatCard 
              icon={FiCheckCircle} 
              label="Approved" 
              value={stats.approved} 
              color="green"
            />
            <StatCard 
              icon={FiXCircle} 
              label="Rejected" 
              value={stats.rejected} 
              color="red"
            />
            <StatCard 
              icon={FiInfo} 
              label="Requires Info" 
              value={stats.requiresInfo || 0} 
              color="orange"
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
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
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
                    placeholder="All Statuses"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    bg="rgba(255,255,255,0.03)"
                    border="1px solid rgba(255,255,255,0.1)"
                    borderRadius="xl"
                    color="white"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value} style={{ background: '#18233A' }}>
                        {label}
                      </option>
                    ))}
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
                placeholder="Quick search applications..."
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
          {applicationsData?.applications.length === 0 ? (
            <Box 
              textAlign="center" 
              py={20}
              bg="rgba(255,255,255,0.02)"
              borderRadius="xl"
              border="1px solid rgba(255,255,255,0.06)"
            >
              <Icon as={FiUsers} boxSize={16} color="gray.600" mb={4} />
              <Text color="gray.400" fontSize="lg">No applications found</Text>
              <Text color="gray.500" fontSize="sm" mt={2}>
                {searchTerm ? 'Try adjusting your search' : 'New applications will appear here'}
              </Text>
            </Box>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={4}>
              {applicationsData?.applications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onView={openDetails}
                  onApprove={handleApprove}
                  onReject={openReject}
                  isProcessing={isProcessing}
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
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)" py={4}>Applicant</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)">Contact</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)">License</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)">Status</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)">Applied</Th>
                    <Th color="gray.400" borderColor="rgba(255,255,255,0.06)" textAlign="right">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {applicationsData?.applications.map((app) => (
                    <Tr 
                      key={app.id}
                      _hover={{ bg: 'rgba(255,255,255,0.03)' }}
                      borderColor="rgba(255,255,255,0.06)"
                      cursor="pointer"
                      onClick={() => openDetails(app)}
                    >
                      <Td borderColor="rgba(255,255,255,0.06)">
                        <HStack spacing={3}>
                          <Avatar 
                            size="sm" 
                            name={app.fullName}
                            bg={statusColors[app.status as keyof typeof statusColors] + '.500'}
                          />
                          <Box>
                            <Text fontWeight="semibold" color="white" fontSize="sm">
                              {app.fullName}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {app.postcode}
                            </Text>
                          </Box>
                        </HStack>
                      </Td>
                      <Td borderColor="rgba(255,255,255,0.06)">
                        <VStack align="start" spacing={1}>
                          <HStack 
                            spacing={2} 
                            fontSize="sm" 
                            color="gray.400"
                            cursor="pointer"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(app.email, 'Email'); }}
                            _hover={{ color: 'white' }}
                          >
                            <Icon as={FiMail} boxSize={3} />
                            <Text noOfLines={1}>{app.email}</Text>
                          </HStack>
                          <HStack 
                            spacing={2} 
                            fontSize="sm" 
                            color="gray.400"
                            cursor="pointer"
                            onClick={(e) => { e.stopPropagation(); copyToClipboard(app.phone, 'Phone'); }}
                            _hover={{ color: 'white' }}
                          >
                            <Icon as={FiPhone} boxSize={3} />
                            <Text>{app.phone}</Text>
                          </HStack>
                        </VStack>
                      </Td>
                      <Td borderColor="rgba(255,255,255,0.06)">
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" color="white" fontFamily="mono">
                            {app.drivingLicenseNumber || 'N/A'}
                          </Text>
                          <Text fontSize="xs" color={
                            app.drivingLicenseExpiry && new Date(app.drivingLicenseExpiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                              ? 'orange.400'
                              : 'gray.500'
                          }>
                            Exp: {app.drivingLicenseExpiry ? format(new Date(app.drivingLicenseExpiry), 'MMM dd, yyyy') : 'N/A'}
                          </Text>
                        </VStack>
                      </Td>
                      <Td borderColor="rgba(255,255,255,0.06)">
                        <Badge
                          colorScheme={statusColors[app.status as keyof typeof statusColors]}
                          borderRadius="full"
                          px={3}
                        >
                          {statusLabels[app.status as keyof typeof statusLabels]}
                        </Badge>
                      </Td>
                      <Td borderColor="rgba(255,255,255,0.06)">
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" color="white">
                            {app.applicationDate && !isNaN(new Date(app.applicationDate).getTime()) 
                              ? format(new Date(app.applicationDate), 'MMM dd, yyyy')
                              : 'N/A'
                            }
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {getTimeAgo(app.applicationDate)}
                          </Text>
                        </VStack>
                      </Td>
                      <Td borderColor="rgba(255,255,255,0.06)" textAlign="right" onClick={(e) => e.stopPropagation()}>
                        <HStack spacing={2} justify="flex-end">
                          <Tooltip label="View Details">
                            <IconButton
                              aria-label="View details"
                              icon={<FiEye />}
                              size="sm"
                              variant="ghost"
                              colorScheme="blue"
                              borderRadius="lg"
                              onClick={() => openDetails(app)}
                            />
                          </Tooltip>
                          {app.phone && (
                            <Tooltip label="WhatsApp">
                              <IconButton
                                aria-label="WhatsApp"
                                icon={<FaWhatsapp />}
                                size="sm"
                                colorScheme="green"
                                variant="ghost"
                                borderRadius="lg"
                                as="a"
                                href={`https://wa.me/${app.phone.replace(/\D/g, '')}`}
                                target="_blank"
                              />
                            </Tooltip>
                          )}
                          {(app.status === 'pending' || app.status === 'under_review') && (
                            <>
                              <Button
                                size="sm"
                                colorScheme="green"
                                leftIcon={<FiCheck />}
                                onClick={() => handleApprove(app.id)}
                                isLoading={isProcessing === app.id}
                                borderRadius="lg"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="red"
                                variant="outline"
                                leftIcon={<FiX />}
                                onClick={() => openReject(app)}
                                borderRadius="lg"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          )}

          {/* Results count */}
          {!loading && applicationsData && applicationsData.applications.length > 0 && (
            <Text color="gray.500" fontSize="sm" textAlign="center">
              Showing {applicationsData.applications.length} of {applicationsData.summary.total} applications
            </Text>
          )}
        </VStack>
      </Container>
    </Box>

        {/* Application Details Modal */}
        <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="5xl" scrollBehavior="inside">
          <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(8px)" />
          <ModalContent 
            bg="#0f0f0f" 
            border="1px solid rgba(255,255,255,0.08)" 
            borderRadius="2xl"
            maxH="90vh"
          >
            <ModalCloseButton color="gray.400" _hover={{ color: "white", bg: "rgba(255,255,255,0.1)" }} />
            <ModalBody p={0}>
              {selectedApplication && (
                <Box>
                  {/* Enhanced Header */}
                  <Box 
                    p={6} 
                    borderBottom="1px solid rgba(255,255,255,0.08)"
                    bgGradient="linear(to-r, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))"
                  >
                    <HStack spacing={5}>
                      <Avatar 
                        size="xl" 
                        name={selectedApplication.fullName}
                        bg="linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)"
                        color="white"
                        fontSize="2xl"
                        fontWeight="bold"
                      />
                      <VStack align="start" spacing={2} flex={1}>
                        <HStack spacing={3}>
                          <Heading size="lg" color="white">{selectedApplication.fullName}</Heading>
                          <Badge
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontSize="sm"
                            fontWeight="600"
                            bg={
                              selectedApplication.status === 'APPROVED' ? 'rgba(34, 197, 94, 0.2)' :
                              selectedApplication.status === 'PENDING' ? 'rgba(251, 191, 36, 0.2)' :
                              selectedApplication.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.2)' :
                              selectedApplication.status === 'UNDER_REVIEW' ? 'rgba(59, 130, 246, 0.2)' :
                              'rgba(156, 163, 175, 0.2)'
                            }
                            color={
                              selectedApplication.status === 'APPROVED' ? 'green.400' :
                              selectedApplication.status === 'PENDING' ? 'yellow.400' :
                              selectedApplication.status === 'REJECTED' ? 'red.400' :
                              selectedApplication.status === 'UNDER_REVIEW' ? 'blue.400' :
                              'gray.400'
                            }
                          >
                            {statusLabels[selectedApplication.status as keyof typeof statusLabels]}
                          </Badge>
                        </HStack>
                        <HStack spacing={4} color="gray.400" fontSize="sm">
                          <HStack spacing={1}>
                            <Icon as={FiMail} />
                            <Text>{selectedApplication.email}</Text>
                          </HStack>
                          <HStack spacing={1}>
                            <Icon as={FiPhone} />
                            <Text>{selectedApplication.phone}</Text>
                          </HStack>
                        </HStack>
                        <HStack spacing={2} mt={2}>
                          <Tooltip label="Send Email" placement="top">
                            <IconButton
                              aria-label="Send email"
                              icon={<FiMail />}
                              size="sm"
                              variant="ghost"
                              color="gray.400"
                              _hover={{ color: "blue.400", bg: "rgba(59, 130, 246, 0.1)" }}
                              onClick={() => window.open(`mailto:${selectedApplication.email}`, '_blank')}
                            />
                          </Tooltip>
                          <Tooltip label="Call" placement="top">
                            <IconButton
                              aria-label="Call"
                              icon={<FiPhone />}
                              size="sm"
                              variant="ghost"
                              color="gray.400"
                              _hover={{ color: "green.400", bg: "rgba(34, 197, 94, 0.1)" }}
                              onClick={() => window.open(`tel:${selectedApplication.phone}`, '_blank')}
                            />
                          </Tooltip>
                          <Tooltip label="WhatsApp" placement="top">
                            <IconButton
                              aria-label="WhatsApp"
                              icon={<FaWhatsapp />}
                              size="sm"
                              variant="ghost"
                              color="gray.400"
                              _hover={{ color: "green.400", bg: "rgba(34, 197, 94, 0.1)" }}
                              onClick={() => window.open(`https://wa.me/${selectedApplication.phone?.replace(/[^0-9]/g, '')}`, '_blank')}
                            />
                          </Tooltip>
                          <Tooltip label="Copy Phone" placement="top">
                            <IconButton
                              aria-label="Copy phone"
                              icon={<FiCopy />}
                              size="sm"
                              variant="ghost"
                              color="gray.400"
                              _hover={{ color: "purple.400", bg: "rgba(147, 51, 234, 0.1)" }}
                              onClick={() => copyToClipboard(selectedApplication.phone, 'Phone')}
                            />
                          </Tooltip>
                        </HStack>
                      </VStack>
                      <VStack align="end" spacing={1}>
                        <Text color="gray.500" fontSize="xs">Applied</Text>
                        <Text color="gray.300" fontSize="sm" fontWeight="500">
                          {selectedApplication.applicationDate && !isNaN(new Date(selectedApplication.applicationDate).getTime())
                            ? getTimeAgo(selectedApplication.applicationDate)
                            : 'N/A'
                          }
                        </Text>
                        <Text color="gray.500" fontSize="xs">
                          {selectedApplication.applicationDate && !isNaN(new Date(selectedApplication.applicationDate).getTime())
                            ? format(new Date(selectedApplication.applicationDate), 'MMM dd, yyyy')
                            : ''
                          }
                        </Text>
                      </VStack>
                    </HStack>
                  </Box>

                  {/* Tabbed Content */}
                  <Tabs variant="soft-rounded" colorScheme="blue" p={6}>
                    <TabList 
                      bg="rgba(255,255,255,0.03)" 
                      p={1.5} 
                      borderRadius="xl" 
                      mb={6}
                      gap={2}
                    >
                      <Tab 
                        color="gray.400" 
                        _selected={{ bg: 'rgba(59, 130, 246, 0.2)', color: 'blue.400' }}
                        _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                        borderRadius="lg"
                        fontWeight="500"
                      >
                        <HStack spacing={2}>
                          <Icon as={FiUser} />
                          <Text>Personal</Text>
                        </HStack>
                      </Tab>
                      <Tab 
                        color="gray.400" 
                        _selected={{ bg: 'rgba(59, 130, 246, 0.2)', color: 'blue.400' }}
                        _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                        borderRadius="lg"
                        fontWeight="500"
                      >
                        <HStack spacing={2}>
                          <Icon as={FaIdCard} />
                          <Text>License</Text>
                        </HStack>
                      </Tab>
                      <Tab 
                        color="gray.400" 
                        _selected={{ bg: 'rgba(59, 130, 246, 0.2)', color: 'blue.400' }}
                        _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                        borderRadius="lg"
                        fontWeight="500"
                      >
                        <HStack spacing={2}>
                          <Icon as={FiCreditCard} />
                          <Text>Bank</Text>
                        </HStack>
                      </Tab>
                      <Tab 
                        color="gray.400" 
                        _selected={{ bg: 'rgba(59, 130, 246, 0.2)', color: 'blue.400' }}
                        _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                        borderRadius="lg"
                        fontWeight="500"
                      >
                        <HStack spacing={2}>
                          <Icon as={FiFileText} />
                          <Text>Documents</Text>
                        </HStack>
                      </Tab>
                      <Tab 
                        color="gray.400" 
                        _selected={{ bg: 'rgba(59, 130, 246, 0.2)', color: 'blue.400' }}
                        _hover={{ bg: 'rgba(255,255,255,0.05)' }}
                        borderRadius="lg"
                        fontWeight="500"
                      >
                        <HStack spacing={2}>
                          <Icon as={FiShield} />
                          <Text>Insurance</Text>
                        </HStack>
                      </Tab>
                    </TabList>

                    <TabPanels>
                      {/* Personal Tab */}
                      <TabPanel p={0}>
                        <VStack spacing={4} align="stretch">
                          <SimpleGrid columns={2} spacing={4}>
                            <Box 
                              p={4} 
                              bg="rgba(255,255,255,0.02)" 
                              borderRadius="xl" 
                              border="1px solid rgba(255,255,255,0.05)"
                            >
                              <Text color="gray.500" fontSize="xs" mb={1}>Full Name</Text>
                              <Text color="white" fontWeight="500">{selectedApplication.fullName}</Text>
                            </Box>
                            <Box 
                              p={4} 
                              bg="rgba(255,255,255,0.02)" 
                              borderRadius="xl" 
                              border="1px solid rgba(255,255,255,0.05)"
                            >
                              <Text color="gray.500" fontSize="xs" mb={1}>Email</Text>
                              <Text color="white" fontWeight="500">{selectedApplication.email}</Text>
                            </Box>
                            <Box 
                              p={4} 
                              bg="rgba(255,255,255,0.02)" 
                              borderRadius="xl" 
                              border="1px solid rgba(255,255,255,0.05)"
                            >
                              <Text color="gray.500" fontSize="xs" mb={1}>Phone</Text>
                              <Text color="white" fontWeight="500">{selectedApplication.phone}</Text>
                            </Box>
                            <Box 
                              p={4} 
                              bg="rgba(255,255,255,0.02)" 
                              borderRadius="xl" 
                              border="1px solid rgba(255,255,255,0.05)"
                            >
                              <Text color="gray.500" fontSize="xs" mb={1}>Postcode</Text>
                              <Text color="white" fontWeight="500">{selectedApplication.postcode}</Text>
                            </Box>
                          </SimpleGrid>
                          <Box 
                            p={4} 
                            bg="rgba(255,255,255,0.02)" 
                            borderRadius="xl" 
                            border="1px solid rgba(255,255,255,0.05)"
                          >
                            <Text color="gray.500" fontSize="xs" mb={1}>Address</Text>
                            <Text color="white" fontWeight="500">{selectedApplication.address}</Text>
                          </Box>
                          <Box 
                            p={4} 
                            bg="rgba(255,255,255,0.02)" 
                            borderRadius="xl" 
                            border="1px solid rgba(255,255,255,0.05)"
                          >
                            <Text color="gray.500" fontSize="xs" mb={1}>Date of Birth</Text>
                            <Text color="white" fontWeight="500">
                              {selectedApplication.dateOfBirth && !isNaN(new Date(selectedApplication.dateOfBirth).getTime()) 
                                ? format(new Date(selectedApplication.dateOfBirth), 'MMMM dd, yyyy')
                                : 'N/A'
                              }
                            </Text>
                          </Box>
                          <Box 
                            p={4} 
                            bg="rgba(255,255,255,0.02)" 
                            borderRadius="xl" 
                            border="1px solid rgba(255,255,255,0.05)"
                          >
                            <Text color="gray.500" fontSize="xs" mb={1}>National Insurance Number</Text>
                            <HStack>
                              <Text color="white" fontWeight="500" fontFamily="mono">
                                {selectedApplication.nationalInsuranceNumber || 'N/A'}
                              </Text>
                              {selectedApplication.nationalInsuranceNumber && (
                                <IconButton
                                  aria-label="Copy NI"
                                  icon={<FiCopy />}
                                  size="xs"
                                  variant="ghost"
                                  color="gray.500"
                                  _hover={{ color: "blue.400" }}
                                  onClick={() => copyToClipboard(selectedApplication.nationalInsuranceNumber || '', 'NI Number')}
                                />
                              )}
                            </HStack>
                          </Box>

                          {/* Review Status Section */}
                          {(selectedApplication.reviewNotes || selectedApplication.reviewedBy || selectedApplication.reviewedAt) && (
                            <Box 
                              p={4} 
                              bg="rgba(239, 68, 68, 0.1)" 
                              borderRadius="xl" 
                              border="1px solid rgba(239, 68, 68, 0.2)"
                            >
                              <HStack mb={3}>
                                <Icon as={FiInfo} color="red.400" />
                                <Text color="red.400" fontWeight="600">Review Information</Text>
                              </HStack>
                              {selectedApplication.reviewNotes && (
                                <Box mb={2}>
                                  <Text color="gray.400" fontSize="xs" mb={1}>Review Notes</Text>
                                  <Text color="gray.200">{selectedApplication.reviewNotes}</Text>
                                </Box>
                              )}
                              {selectedApplication.reviewedBy && (
                                <Box mb={2}>
                                  <Text color="gray.400" fontSize="xs" mb={1}>Reviewed By</Text>
                                  <Text color="gray.200">{selectedApplication.reviewedBy}</Text>
                                </Box>
                              )}
                              {selectedApplication.reviewedAt && (
                                <Box>
                                  <Text color="gray.400" fontSize="xs" mb={1}>Reviewed At</Text>
                                  <Text color="gray.200">
                                    {!isNaN(new Date(selectedApplication.reviewedAt).getTime()) 
                                      ? format(new Date(selectedApplication.reviewedAt), 'MMM dd, yyyy HH:mm')
                                      : 'N/A'
                                    }
                                  </Text>
                                </Box>
                              )}
                            </Box>
                          )}

                          {/* User ID */}
                          <Box 
                            p={4} 
                            bg="rgba(255,255,255,0.02)" 
                            borderRadius="xl" 
                            border="1px solid rgba(255,255,255,0.05)"
                          >
                            <Text color="gray.500" fontSize="xs" mb={1}>User ID</Text>
                            <HStack>
                              <Text color="gray.400" fontSize="sm" fontFamily="mono">
                                {selectedApplication.userId}
                              </Text>
                              <IconButton
                                aria-label="Copy User ID"
                                icon={<FiCopy />}
                                size="xs"
                                variant="ghost"
                                color="gray.500"
                                _hover={{ color: "blue.400" }}
                                onClick={() => copyToClipboard(selectedApplication.userId, 'User ID')}
                              />
                            </HStack>
                          </Box>
                        </VStack>
                      </TabPanel>

                      {/* License Tab */}
                      <TabPanel p={0}>
                        <VStack spacing={4} align="stretch">
                          <SimpleGrid columns={2} spacing={4}>
                            <Box 
                              p={4} 
                              bg="rgba(255,255,255,0.02)" 
                              borderRadius="xl" 
                              border="1px solid rgba(255,255,255,0.05)"
                            >
                              <Text color="gray.500" fontSize="xs" mb={1}>License Number</Text>
                              <HStack>
                                <Text color="white" fontWeight="500" fontFamily="mono">
                                  {selectedApplication.drivingLicenseNumber || 'N/A'}
                                </Text>
                                {selectedApplication.drivingLicenseNumber && (
                                  <IconButton
                                    aria-label="Copy License"
                                    icon={<FiCopy />}
                                    size="xs"
                                    variant="ghost"
                                    color="gray.500"
                                    _hover={{ color: "blue.400" }}
                                    onClick={() => copyToClipboard(selectedApplication.drivingLicenseNumber || '', 'License Number')}
                                  />
                                )}
                              </HStack>
                            </Box>
                            <Box 
                              p={4} 
                              bg="rgba(255,255,255,0.02)" 
                              borderRadius="xl" 
                              border="1px solid rgba(255,255,255,0.05)"
                            >
                              <Text color="gray.500" fontSize="xs" mb={1}>Expiry Date</Text>
                              <Text 
                                color={
                                  selectedApplication.drivingLicenseExpiry && 
                                  new Date(selectedApplication.drivingLicenseExpiry) < new Date() 
                                    ? 'red.400' 
                                    : 'white'
                                } 
                                fontWeight="500"
                              >
                                {selectedApplication.drivingLicenseExpiry && !isNaN(new Date(selectedApplication.drivingLicenseExpiry).getTime()) 
                                  ? format(new Date(selectedApplication.drivingLicenseExpiry), 'MMMM dd, yyyy')
                                  : 'N/A'
                                }
                              </Text>
                            </Box>
                          </SimpleGrid>

                          {/* License Images */}
                          <Box 
                            p={4} 
                            bg="rgba(255,255,255,0.02)" 
                            borderRadius="xl" 
                            border="1px solid rgba(255,255,255,0.05)"
                          >
                            <Text color="gray.300" fontWeight="600" mb={4}>License Images</Text>
                            <SimpleGrid columns={2} spacing={4}>
                              <Box>
                                <Text color="gray.500" fontSize="xs" mb={2}>Front Side</Text>
                                {selectedApplication.drivingLicenseFrontImage ? (
                                  <Box
                                    position="relative"
                                    cursor="pointer"
                                    onClick={() => {
                                      const url = selectedApplication.drivingLicenseFrontImage;
                                      if (url) {
                                        const apiUrl = url.startsWith('/uploads/') ? `/api${url}` : url;
                                        window.open(apiUrl, '_blank');
                                      }
                                    }}
                                    _hover={{ transform: 'scale(1.02)', transition: 'all 0.2s' }}
                                  >
                                    <DocumentImage 
                                      src={selectedApplication.drivingLicenseFrontImage} 
                                      alt="Driving License Front"
                                      fallbackIcon={FaIdCard}
                                    />
                                    <Box
                                      position="absolute"
                                      top={2}
                                      right={2}
                                      p={2}
                                      bg="blackAlpha.700"
                                      borderRadius="md"
                                    >
                                      <Icon as={FiExternalLink} color="white" boxSize={4} />
                                    </Box>
                                  </Box>
                                ) : (
                                  <Box
                                    p={8}
                                    bg="rgba(239, 68, 68, 0.1)"
                                    borderRadius="lg"
                                    textAlign="center"
                                    border="1px dashed rgba(239, 68, 68, 0.3)"
                                  >
                                    <Icon as={FiXCircle} boxSize={8} color="red.400" />
                                    <Text fontSize="xs" color="red.400" mt={2}>
                                      Not provided
                                    </Text>
                                  </Box>
                                )}
                              </Box>
                              <Box>
                                <Text color="gray.500" fontSize="xs" mb={2}>Back Side</Text>
                                {selectedApplication.drivingLicenseBackImage ? (
                                  <Box
                                    position="relative"
                                    cursor="pointer"
                                    onClick={() => {
                                      const url = selectedApplication.drivingLicenseBackImage;
                                      if (url) {
                                        const apiUrl = url.startsWith('/uploads/') ? `/api${url}` : url;
                                        window.open(apiUrl, '_blank');
                                      }
                                    }}
                                    _hover={{ transform: 'scale(1.02)', transition: 'all 0.2s' }}
                                  >
                                    <DocumentImage 
                                      src={selectedApplication.drivingLicenseBackImage} 
                                      alt="Driving License Back"
                                      fallbackIcon={FaIdCard}
                                    />
                                    <Box
                                      position="absolute"
                                      top={2}
                                      right={2}
                                      p={2}
                                      bg="blackAlpha.700"
                                      borderRadius="md"
                                    >
                                      <Icon as={FiExternalLink} color="white" boxSize={4} />
                                    </Box>
                                  </Box>
                                ) : (
                                  <Box
                                    p={8}
                                    bg="rgba(239, 68, 68, 0.1)"
                                    borderRadius="lg"
                                    textAlign="center"
                                    border="1px dashed rgba(239, 68, 68, 0.3)"
                                  >
                                    <Icon as={FiXCircle} boxSize={8} color="red.400" />
                                    <Text fontSize="xs" color="red.400" mt={2}>
                                      Not provided
                                    </Text>
                                  </Box>
                                )}
                              </Box>
                            </SimpleGrid>
                          </Box>
                        </VStack>
                      </TabPanel>

                      {/* Bank Tab */}
                      <TabPanel p={0}>
                        <VStack spacing={4} align="stretch">
                          <SimpleGrid columns={2} spacing={4}>
                            <Box 
                              p={4} 
                              bg="rgba(255,255,255,0.02)" 
                              borderRadius="xl" 
                              border="1px solid rgba(255,255,255,0.05)"
                            >
                              <Text color="gray.500" fontSize="xs" mb={1}>Account Holder Name</Text>
                              <Text color="white" fontWeight="500">
                                {selectedApplication.accountHolderName || 'N/A'}
                              </Text>
                            </Box>
                            <Box 
                              p={4} 
                              bg="rgba(255,255,255,0.02)" 
                              borderRadius="xl" 
                              border="1px solid rgba(255,255,255,0.05)"
                            >
                              <Text color="gray.500" fontSize="xs" mb={1}>Bank Name</Text>
                              <Text color="white" fontWeight="500">
                                {selectedApplication.bankName || 'N/A'}
                              </Text>
                            </Box>
                            <Box 
                              p={4} 
                              bg="rgba(255,255,255,0.02)" 
                              borderRadius="xl" 
                              border="1px solid rgba(255,255,255,0.05)"
                            >
                              <Text color="gray.500" fontSize="xs" mb={1}>Sort Code</Text>
                              <HStack>
                                <Text color="white" fontWeight="500" fontFamily="mono">
                                  {selectedApplication.sortCode || 'N/A'}
                                </Text>
                                {selectedApplication.sortCode && (
                                  <IconButton
                                    aria-label="Copy Sort Code"
                                    icon={<FiCopy />}
                                    size="xs"
                                    variant="ghost"
                                    color="gray.500"
                                    _hover={{ color: "blue.400" }}
                                    onClick={() => copyToClipboard(selectedApplication.sortCode || '', 'Sort Code')}
                                  />
                                )}
                              </HStack>
                            </Box>
                            <Box 
                              p={4} 
                              bg="rgba(255,255,255,0.02)" 
                              borderRadius="xl" 
                              border="1px solid rgba(255,255,255,0.05)"
                            >
                              <Text color="gray.500" fontSize="xs" mb={1}>Account Number</Text>
                              <HStack>
                                <Text color="white" fontWeight="500" fontFamily="mono">
                                  {selectedApplication.accountNumber || 'N/A'}
                                </Text>
                                {selectedApplication.accountNumber && (
                                  <IconButton
                                    aria-label="Copy Account Number"
                                    icon={<FiCopy />}
                                    size="xs"
                                    variant="ghost"
                                    color="gray.500"
                                    _hover={{ color: "blue.400" }}
                                    onClick={() => copyToClipboard(selectedApplication.accountNumber || '', 'Account Number')}
                                  />
                                )}
                              </HStack>
                            </Box>
                          </SimpleGrid>
                        </VStack>
                      </TabPanel>

                      {/* Documents Tab */}
                      <TabPanel p={0}>
                        <VStack spacing={6} align="stretch">
                          {/* Right to Work */}
                          <Box 
                            p={4} 
                            bg="rgba(255,255,255,0.02)" 
                            borderRadius="xl" 
                            border="1px solid rgba(255,255,255,0.05)"
                          >
                            <HStack mb={4}>
                              <Icon as={FaFileContract} color="blue.400" />
                              <Text color="gray.300" fontWeight="600">Right to Work</Text>
                            </HStack>
                            <SimpleGrid columns={2} spacing={4}>
                              <Box>
                                <Text color="gray.500" fontSize="xs" mb={1}>Share Code</Text>
                                <HStack>
                                  <Text color="white" fontWeight="500" fontFamily="mono">
                                    {selectedApplication.rightToWorkShareCode || 'N/A'}
                                  </Text>
                                  {selectedApplication.rightToWorkShareCode && (
                                    <IconButton
                                      aria-label="Copy Share Code"
                                      icon={<FiCopy />}
                                      size="xs"
                                      variant="ghost"
                                      color="gray.500"
                                      _hover={{ color: "blue.400" }}
                                      onClick={() => copyToClipboard(selectedApplication.rightToWorkShareCode || '', 'Share Code')}
                                    />
                                  )}
                                </HStack>
                              </Box>
                              <Box>
                                <Text color="gray.500" fontSize="xs" mb={2}>Document</Text>
                                {selectedApplication.rightToWorkDocument ? (
                                  <DocumentImage
                                    src={selectedApplication.rightToWorkDocument}
                                    alt="Right to Work"
                                    maxH="150px"
                                  />
                                ) : (
                                  <Box
                                    p={4}
                                    bg="rgba(239, 68, 68, 0.1)"
                                    borderRadius="lg"
                                    textAlign="center"
                                    border="1px dashed rgba(239, 68, 68, 0.3)"
                                  >
                                    <Icon as={FiXCircle} boxSize={6} color="red.400" />
                                    <Text fontSize="xs" color="red.400" mt={2}>
                                      Not provided
                                    </Text>
                                  </Box>
                                )}
                              </Box>
                            </SimpleGrid>
                          </Box>
                        </VStack>
                      </TabPanel>

                      {/* Insurance Tab */}
                      <TabPanel p={0}>
                        <VStack spacing={4} align="stretch">
                          <SimpleGrid columns={3} spacing={4}>
                            <Box 
                              p={4} 
                              bg="rgba(255,255,255,0.02)" 
                              borderRadius="xl" 
                              border="1px solid rgba(255,255,255,0.05)"
                            >
                              <Text color="gray.500" fontSize="xs" mb={1}>Provider</Text>
                              <Text color="white" fontWeight="500">
                                {selectedApplication.insuranceProvider || 'N/A'}
                              </Text>
                            </Box>
                            <Box 
                              p={4} 
                              bg="rgba(255,255,255,0.02)" 
                              borderRadius="xl" 
                              border="1px solid rgba(255,255,255,0.05)"
                            >
                              <Text color="gray.500" fontSize="xs" mb={1}>Policy Number</Text>
                              <HStack>
                                <Text color="white" fontWeight="500" fontFamily="mono">
                                  {selectedApplication.insurancePolicyNumber || 'N/A'}
                                </Text>
                                {selectedApplication.insurancePolicyNumber && (
                                  <IconButton
                                    aria-label="Copy Policy Number"
                                    icon={<FiCopy />}
                                    size="xs"
                                    variant="ghost"
                                    color="gray.500"
                                    _hover={{ color: "blue.400" }}
                                    onClick={() => copyToClipboard(selectedApplication.insurancePolicyNumber || '', 'Policy Number')}
                                  />
                                )}
                              </HStack>
                            </Box>
                            <Box 
                              p={4} 
                              bg="rgba(255,255,255,0.02)" 
                              borderRadius="xl" 
                              border="1px solid rgba(255,255,255,0.05)"
                            >
                              <Text color="gray.500" fontSize="xs" mb={1}>Expiry Date</Text>
                              <Text 
                                color={
                                  selectedApplication.insuranceExpiry && 
                                  new Date(selectedApplication.insuranceExpiry) < new Date() 
                                    ? 'red.400' 
                                    : 'white'
                                } 
                                fontWeight="500"
                              >
                                {selectedApplication.insuranceExpiry && !isNaN(new Date(selectedApplication.insuranceExpiry).getTime())
                                  ? format(new Date(selectedApplication.insuranceExpiry), 'MMMM dd, yyyy')
                                  : 'N/A'
                                }
                              </Text>
                            </Box>
                          </SimpleGrid>

                          {/* Insurance Document */}
                          <Box 
                            p={4} 
                            bg="rgba(255,255,255,0.02)" 
                            borderRadius="xl" 
                            border="1px solid rgba(255,255,255,0.05)"
                          >
                            <Text color="gray.300" fontWeight="600" mb={4}>Insurance Document</Text>
                            {selectedApplication.insuranceDocument ? (
                              <Box maxW="400px">
                                <DocumentImage
                                  src={selectedApplication.insuranceDocument}
                                  alt="Insurance Document"
                                  maxH="250px"
                                />
                              </Box>
                            ) : (
                              <Box
                                p={8}
                                bg="rgba(239, 68, 68, 0.1)"
                                borderRadius="lg"
                                textAlign="center"
                                border="1px dashed rgba(239, 68, 68, 0.3)"
                                maxW="400px"
                              >
                                <Icon as={FiXCircle} boxSize={8} color="red.400" />
                                <Text fontSize="sm" color="red.400" mt={2}>
                                  Insurance document not provided
                                </Text>
                              </Box>
                            )}
                          </Box>
                        </VStack>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              )}
            </ModalBody>
            <ModalFooter 
              borderTop="1px solid rgba(255,255,255,0.08)" 
              bg="rgba(0,0,0,0.3)"
              p={4}
            >
              <HStack spacing={3}>
                <Button 
                  variant="ghost" 
                  onClick={onDetailsClose}
                  color="gray.400"
                  _hover={{ bg: 'rgba(255,255,255,0.05)', color: 'white' }}
                >
                  Close
                </Button>
                {selectedApplication && selectedApplication.status === 'PENDING' && (
                  <>
                    <Button
                      colorScheme="red"
                      variant="outline"
                      onClick={() => {
                        setSelectedApplication(selectedApplication);
                        onRejectOpen();
                      }}
                      leftIcon={<FiXCircle />}
                      borderColor="red.500"
                      color="red.400"
                      _hover={{ bg: 'rgba(239, 68, 68, 0.1)' }}
                    >
                      Reject
                    </Button>
                    <Button
                      bg="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                      color="white"
                      onClick={() => handleApprove(selectedApplication.id)}
                      isLoading={isProcessing === selectedApplication.id}
                      loadingText="Approving..."
                      leftIcon={<FiCheckCircle />}
                      _hover={{ transform: 'translateY(-1px)', boxShadow: '0 4px 15px rgba(34, 197, 94, 0.4)' }}
                    >
                      Approve Application
                    </Button>
                  </>
                )}
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Reject Application Modal */}
        <Modal isOpen={isRejectOpen} onClose={onRejectClose} isCentered>
          <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(8px)" />
          <ModalContent 
            bg="#0f0f0f" 
            border="1px solid rgba(255,255,255,0.08)" 
            borderRadius="2xl"
          >
            <ModalHeader 
              borderBottom="1px solid rgba(255,255,255,0.08)"
              color="white"
            >
              <HStack spacing={3}>
                <Box
                  p={2}
                  bg="rgba(239, 68, 68, 0.1)"
                  borderRadius="lg"
                >
                  <Icon as={FiXCircle} color="red.400" boxSize={5} />
                </Box>
                <Text>Reject Application</Text>
              </HStack>
            </ModalHeader>
            <ModalCloseButton color="gray.400" _hover={{ color: "white", bg: "rgba(255,255,255,0.1)" }} />
            <ModalBody py={6}>
              <VStack spacing={4} align="stretch">
                <Box 
                  p={4} 
                  bg="rgba(239, 68, 68, 0.1)" 
                  borderRadius="xl"
                  border="1px solid rgba(239, 68, 68, 0.2)"
                >
                  <HStack spacing={3}>
                    <Icon as={FiAlertTriangle} color="red.400" boxSize={5} />
                    <Text color="gray.300" fontSize="sm">
                      Are you sure you want to reject this application? This action cannot be undone.
                    </Text>
                  </HStack>
                </Box>
                <FormControl>
                  <FormLabel color="gray.300" fontSize="sm">Rejection Reason (Optional)</FormLabel>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={3}
                    bg="rgba(255,255,255,0.03)"
                    border="1px solid rgba(255,255,255,0.1)"
                    color="white"
                    _placeholder={{ color: 'gray.500' }}
                    _hover={{ borderColor: 'rgba(255,255,255,0.2)' }}
                    _focus={{ borderColor: 'red.400', boxShadow: '0 0 0 1px rgba(239, 68, 68, 0.3)' }}
                    borderRadius="xl"
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter 
              borderTop="1px solid rgba(255,255,255,0.08)"
              bg="rgba(0,0,0,0.3)"
            >
              <Button 
                variant="ghost" 
                mr={3} 
                onClick={onRejectClose}
                color="gray.400"
                _hover={{ bg: 'rgba(255,255,255,0.05)', color: 'white' }}
              >
                Cancel
              </Button>
              <Button
                bg="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                color="white"
                onClick={() => selectedApplication && handleReject(selectedApplication.id)}
                isLoading={isProcessing === selectedApplication?.id}
                loadingText="Rejecting..."
                leftIcon={<FiXCircle />}
                _hover={{ transform: 'translateY(-1px)', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)' }}
              >
                Reject Application
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
    </>
  );
}