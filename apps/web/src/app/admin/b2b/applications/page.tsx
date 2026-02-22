'use client';

/**
 * B2B Applications Admin Page - Chakra UI Version
 */

import { useState, useEffect } from 'react';
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
  Flex,
  Icon,
  Badge,
  useToast,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
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
  Tab,
  TabPanels,
  TabPanel,
  Input,
  InputGroup,
  InputLeftElement,
  Textarea,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import {
  FaBuilding,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaSearch,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaExternalLinkAlt,
  FaInbox,
  FaCheck,
  FaTimes,
  FaEye,
} from 'react-icons/fa';

interface Application {
  id: string;
  companyName: string;
  legalName: string;
  registrationNumber: string;
  vatNumber: string;
  industry: string;
  companySize: string;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactRole: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
  estimatedMonthlyBookings: string;
  primaryUseCase: string;
  additionalNotes: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors = {
  PENDING: 'yellow',
  UNDER_REVIEW: 'blue',
  APPROVED: 'green',
  REJECTED: 'red',
};

const statusLabels = {
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export default function B2BApplicationsPage() {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isApiKeyOpen, onOpen: onApiKeyOpen, onClose: onApiKeyClose } = useDisclosure();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [approvalData, setApprovalData] = useState<{
    apiKey: string;
    apiKeyPreview: string;
    setupUrl: string;
    companyId: string;
  } | null>(null);
  const [orderLimit, setOrderLimit] = useState(10);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/b2b/applications');
      const data = await response.json();
      if (data.success) {
        setApplications(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch applications',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleViewDetails = (app: Application) => {
    setSelectedApp(app);
    setReviewNotes(app.reviewNotes || '');
    onOpen();
  };

  const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW') => {
    if (!selectedApp) return;

    // Map status to action
    const actionMap = {
      'APPROVED': 'approve',
      'REJECTED': 'reject',
      'UNDER_REVIEW': 'review'
    } as const;

    const action = actionMap[status];

    setProcessing(true);
    try {
      const requestBody: any = { 
        action,
        notes: reviewNotes,
        rejectionReason: status === 'REJECTED' ? reviewNotes : undefined,
      };

      // Add order limit for approval
      if (status === 'APPROVED') {
        requestBody.approvedMonthlyOrderLimit = orderLimit;
      }

      const response = await fetch(`/api/b2b/applications/${selectedApp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        // For approvals, show API key modal
        if (status === 'APPROVED' && data.data.apiKey) {
          setApprovalData({
            apiKey: data.data.apiKey.key,
            apiKeyPreview: data.data.apiKey.keyPreview,
            setupUrl: data.data.setupUrl,
            companyId: data.data.companyId,
          });
          onClose(); // Close details modal
          onApiKeyOpen(); // Open API key modal
        } else {
          toast({
            title: 'Success',
            description: `Application ${status.toLowerCase()}`,
            status: 'success',
            duration: 3000,
          });
          onClose();
        }
        
        fetchApplications();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to update application',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update application',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.contactName.toLowerCase().includes(searchQuery.toLowerCase());

    const tabStatuses = [
      ['PENDING', 'UNDER_REVIEW'],
      ['APPROVED'],
      ['REJECTED'],
      null, // All
    ];

    const matchesTab = !tabStatuses[activeTab] || tabStatuses[activeTab]?.includes(app.status);

    return matchesSearch && matchesTab;
  });

  const stats = {
    pending: applications.filter((a) => a.status === 'PENDING').length,
    underReview: applications.filter((a) => a.status === 'UNDER_REVIEW').length,
    approved: applications.filter((a) => a.status === 'APPROVED').length,
    rejected: applications.filter((a) => a.status === 'REJECTED').length,
  };

  if (loading) {
    return (
      <Flex minH="100vh" bg="gray.900" align="center" justify="center">
        <Spinner size="xl" color="blue.400" />
      </Flex>
    );
  }

  return (
    <Container maxW="container.2xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack spacing={3}>
            <Box
              w="48px"
              h="48px"
              borderRadius="xl"
              bgGradient="linear(135deg, blue.400, purple.500)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              boxShadow="0 4px 14px rgba(66, 153, 225, 0.4)"
            >
              <Icon as={FaBuilding} boxSize={6} color="white" />
            </Box>
            <Box>
              <Heading size="lg" bgGradient="linear(to-r, blue.300, purple.300)" bgClip="text">
                B2B Applications
              </Heading>
              <Text color="gray.400" fontSize="sm">
                Review and manage corporate account requests
              </Text>
            </Box>
          </HStack>
          <Badge
            colorScheme="blue"
            fontSize="lg"
            px={4}
            py={2}
            borderRadius="full"
            boxShadow="0 2px 8px rgba(66, 153, 225, 0.3)"
          >
            {applications.length} TOTAL
          </Badge>
        </Flex>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          <Card
            bg="yellow.900"
            borderWidth="2px"
            borderColor="yellow.600"
            boxShadow="0 4px 14px rgba(236, 201, 75, 0.15)"
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(236, 201, 75, 0.25)' }}
          >
            <CardBody>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text color="yellow.200" fontSize="sm" fontWeight="semibold">Pending</Text>
                  <Heading size="2xl" color="yellow.100">{stats.pending}</Heading>
                </VStack>
                <Icon as={FaClock} boxSize={10} color="yellow.400" opacity={0.8} />
              </HStack>
            </CardBody>
          </Card>

          <Card
            bg="blue.900"
            borderWidth="2px"
            borderColor="blue.600"
            boxShadow="0 4px 14px rgba(66, 153, 225, 0.15)"
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(66, 153, 225, 0.25)' }}
          >
            <CardBody>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text color="blue.200" fontSize="sm" fontWeight="semibold">Under Review</Text>
                  <Heading size="2xl" color="blue.100">{stats.underReview}</Heading>
                </VStack>
                <Icon as={FaEye} boxSize={10} color="blue.400" opacity={0.8} />
              </HStack>
            </CardBody>
          </Card>

          <Card
            bg="green.900"
            borderWidth="2px"
            borderColor="green.600"
            boxShadow="0 4px 14px rgba(72, 187, 120, 0.15)"
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(72, 187, 120, 0.25)' }}
          >
            <CardBody>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text color="green.200" fontSize="sm" fontWeight="semibold">Approved</Text>
                  <Heading size="2xl" color="green.100">{stats.approved}</Heading>
                </VStack>
                <Icon as={FaCheckCircle} boxSize={10} color="green.400" opacity={0.8} />
              </HStack>
            </CardBody>
          </Card>

          <Card
            bg="red.900"
            borderWidth="2px"
            borderColor="red.600"
            boxShadow="0 4px 14px rgba(245, 101, 101, 0.15)"
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(245, 101, 101, 0.25)' }}
          >
            <CardBody>
              <HStack justify="space-between">
                <VStack align="start" spacing={1}>
                  <Text color="red.200" fontSize="sm" fontWeight="semibold">Rejected</Text>
                  <Heading size="2xl" color="red.100">{stats.rejected}</Heading>
                </VStack>
                <Icon as={FaTimesCircle} boxSize={10} color="red.400" opacity={0.8} />
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>

          {/* Search and Tabs */}
          <Card
            bg="gray.800"
            borderColor="gray.700"
            borderWidth="1px"
            boxShadow="0 4px 14px rgba(0, 0, 0, 0.3)"
          >
            <CardBody>
              <VStack spacing={4} align="stretch">
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FaSearch} color="blue.400" />
                  </InputLeftElement>
                  <Input
                    bg="gray.700"
                    borderColor="gray.600"
                    color="white"
                    placeholder="Search by company, contact name, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    _hover={{ borderColor: 'blue.400', bg: 'gray.650' }}
                    _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)' }}
                    fontSize="md"
                  />
                </InputGroup>

                <Tabs
                  colorScheme="blue"
                  index={activeTab}
                  onChange={setActiveTab}
                  variant="soft-rounded"
                >
                  <TabList bg="gray.700" p={1} borderRadius="lg">
                    <Tab
                      color="gray.400"
                      fontWeight="semibold"
                      _selected={{
                        color: 'white',
                        bg: 'blue.500',
                        boxShadow: '0 2px 8px rgba(66, 153, 225, 0.4)',
                      }}
                    >
                      Pending ({stats.pending + stats.underReview})
                    </Tab>
                    <Tab
                      color="gray.400"
                      fontWeight="semibold"
                      _selected={{
                        color: 'white',
                        bg: 'green.500',
                        boxShadow: '0 2px 8px rgba(72, 187, 120, 0.4)',
                      }}
                    >
                      Approved ({stats.approved})
                    </Tab>
                    <Tab
                      color="gray.400"
                      fontWeight="semibold"
                      _selected={{
                        color: 'white',
                        bg: 'red.500',
                        boxShadow: '0 2px 8px rgba(245, 101, 101, 0.4)',
                      }}
                    >
                      Rejected ({stats.rejected})
                    </Tab>
                    <Tab
                      color="gray.400"
                      fontWeight="semibold"
                      _selected={{
                        color: 'white',
                        bg: 'purple.500',
                        boxShadow: '0 2px 8px rgba(159, 122, 234, 0.4)',
                      }}
                    >
                      All ({applications.length})
                    </Tab>
                  </TabList>
                </Tabs>
              </VStack>
            </CardBody>
          </Card>

          {/* Applications Table */}
          <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" overflow="hidden">
            <Box overflowX="auto">
              <Table>
                <Thead bg="gray.700">
                  <Tr>
                    <Th color="gray.300" borderColor="gray.600">Company</Th>
                    <Th color="gray.300" borderColor="gray.600">Contact</Th>
                    <Th color="gray.300" borderColor="gray.600">Industry</Th>
                    <Th color="gray.300" borderColor="gray.600">Volume</Th>
                    <Th color="gray.300" borderColor="gray.600">Status</Th>
                    <Th color="gray.300" borderColor="gray.600">Date</Th>
                    <Th color="gray.300" borderColor="gray.600">Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredApps.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} borderColor="gray.700">
                        <VStack py={12} spacing={4}>
                          <Icon as={FaInbox} boxSize={12} color="gray.600" />
                          <Text color="gray.500">No applications found</Text>
                        </VStack>
                      </Td>
                    </Tr>
                  ) : (
                    filteredApps.map((app) => (
                      <Tr
                        key={app.id}
                        _hover={{ bg: 'whiteAlpha.50' }}
                        transition="all 0.2s"
                      >
                        <Td borderColor="gray.700">
                          <VStack align="start" spacing={1}>
                            <Text color="white" fontWeight="semibold" fontSize="md">{app.companyName}</Text>
                            <Text color="gray.400" fontSize="sm">{app.legalName}</Text>
                          </VStack>
                        </Td>
                        <Td borderColor="gray.700">
                          <VStack align="start" spacing={1}>
                            <Text color="white" fontWeight="medium">{app.contactName}</Text>
                            <HStack spacing={2}>
                              <Icon as={FaEnvelope} color="gray.500" boxSize={3} />
                              <Text color="gray.400" fontSize="sm">{app.contactEmail}</Text>
                            </HStack>
                          </VStack>
                        </Td>
                        <Td borderColor="gray.700">
                          <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                            {app.industry}
                          </Badge>
                        </Td>
                        <Td borderColor="gray.700">
                          <Text color="blue.300" fontWeight="medium">{app.estimatedMonthlyBookings}</Text>
                        </Td>
                        <Td borderColor="gray.700">
                          <Badge
                            colorScheme={statusColors[app.status]}
                            fontSize="sm"
                            px={3}
                            py={1}
                            borderRadius="full"
                          >
                            {statusLabels[app.status]}
                          </Badge>
                        </Td>
                        <Td borderColor="gray.700">
                          <Text color="gray.400" fontSize="sm">
                            {new Date(app.createdAt).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </Text>
                        </Td>
                        <Td borderColor="gray.700">
                          <Button
                            size="sm"
                            colorScheme="blue"
                            onClick={() => handleViewDetails(app)}
                            leftIcon={<FaEye />}
                            _hover={{
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(66, 153, 225, 0.4)',
                            }}
                            transition="all 0.2s"
                          >
                            View
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          </Card>
        </VStack>

        {/* Enhanced Details Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
          <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(4px)" />
        <ModalContent
          bg="gray.800"
          borderWidth="2px"
          borderColor="blue.500"
          boxShadow="0 20px 60px rgba(0, 0, 0, 0.6)"
          maxH="90vh"
        >
          <ModalHeader
            bgGradient="linear(to-r, blue.600, purple.600)"
            color="white"
            borderTopRadius="md"
            py={4}
          >
            <HStack spacing={3}>
              <Box
                w="40px"
                h="40px"
                borderRadius="lg"
                bg="whiteAlpha.200"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Icon as={FaBuilding} boxSize={5} />
              </Box>
              <Box>
                <Text fontSize="xl" fontWeight="bold">{selectedApp?.companyName}</Text>
                <Text fontSize="sm" opacity={0.9}>{selectedApp?.legalName}</Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalCloseButton color="white" _hover={{ bg: 'whiteAlpha.200' }} />
          <ModalBody py={6}>
            {selectedApp && (
              <VStack spacing={6} align="stretch">
                {/* Status Badge */}
                <Flex justify="space-between" align="center">
                  <Badge
                    colorScheme={statusColors[selectedApp.status]}
                    fontSize="lg"
                    px={4}
                    py={2}
                    borderRadius="full"
                    textTransform="uppercase"
                    fontWeight="bold"
                  >
                    {statusLabels[selectedApp.status]}
                  </Badge>
                  <Text color="gray.400" fontSize="sm">
                    Applied: {new Date(selectedApp.createdAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </Flex>

                {/* Company Information */}
                <Box
                  p={5}
                  bg="gray.700"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="gray.600"
                  boxShadow="0 4px 14px rgba(0, 0, 0, 0.2)"
                >
                  <Heading size="md" color="blue.300" mb={4}>
                    Company Information
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <Box>
                      <Text color="gray.400" fontSize="sm" mb={1}>Legal Name</Text>
                      <Text color="white" fontWeight="medium" fontSize="lg">{selectedApp.legalName}</Text>
                    </Box>
                    <Box>
                      <Text color="gray.400" fontSize="sm" mb={1}>Registration Number</Text>
                      <Text color="white" fontWeight="medium" fontSize="lg">{selectedApp.registrationNumber || '-'}</Text>
                    </Box>
                    <Box>
                      <Text color="gray.400" fontSize="sm" mb={1}>VAT Number</Text>
                      <Text color="white" fontWeight="medium" fontSize="lg">{selectedApp.vatNumber || '-'}</Text>
                    </Box>
                    <Box>
                      <Text color="gray.400" fontSize="sm" mb={1}>Industry</Text>
                      <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                        {selectedApp.industry}
                      </Badge>
                    </Box>
                    <Box>
                      <Text color="gray.400" fontSize="sm" mb={1}>Company Size</Text>
                      <Text color="white" fontWeight="medium" fontSize="lg">{selectedApp.companySize}</Text>
                    </Box>
                    <Box>
                      <Text color="gray.400" fontSize="sm" mb={1}>Website</Text>
                      {selectedApp.website ? (
                        <HStack>
                          <Text
                            color="blue.400"
                            as="a"
                            href={selectedApp.website}
                            target="_blank"
                            fontWeight="medium"
                            _hover={{ textDecoration: 'underline' }}
                          >
                            {selectedApp.website}
                          </Text>
                          <Icon as={FaExternalLinkAlt} color="blue.400" boxSize={3} />
                        </HStack>
                      ) : (
                        <Text color="gray.500">-</Text>
                      )}
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Contact Person */}
                <Box
                  p={5}
                  bgGradient="linear(to-br, blue.900, purple.900)"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="blue.700"
                  boxShadow="0 4px 14px rgba(66, 153, 225, 0.2)"
                >
                  <Heading size="md" color="blue.200" mb={4}>
                    Contact Person
                  </Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <HStack spacing={3}>
                      <Box
                        w="40px"
                        h="40px"
                        borderRadius="lg"
                        bg="blue.700"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FaEnvelope} color="blue.200" />
                      </Box>
                      <Box>
                        <Text color="blue.300" fontSize="xs" mb={1}>Email</Text>
                        <Text color="white" fontWeight="medium">{selectedApp.contactEmail}</Text>
                      </Box>
                    </HStack>
                    <HStack spacing={3}>
                      <Box
                        w="40px"
                        h="40px"
                        borderRadius="lg"
                        bg="purple.700"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={FaPhone} color="purple.200" />
                      </Box>
                      <Box>
                        <Text color="purple.300" fontSize="xs" mb={1}>Phone</Text>
                        <Text color="white" fontWeight="medium">{selectedApp.contactPhone}</Text>
                      </Box>
                    </HStack>
                    <Box>
                      <Text color="blue.300" fontSize="sm" mb={1}>Name</Text>
                      <Text color="white" fontWeight="medium" fontSize="lg">{selectedApp.contactName}</Text>
                    </Box>
                    <Box>
                      <Text color="purple.300" fontSize="sm" mb={1}>Role</Text>
                      <Text color="white" fontWeight="medium" fontSize="lg">{selectedApp.contactRole}</Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Address */}
                <Box
                  p={5}
                  bg="gray.700"
                  borderRadius="xl"
                  borderWidth="1px"
                  borderColor="gray.600"
                  boxShadow="0 4px 14px rgba(0, 0, 0, 0.2)"
                >
                  <Heading size="md" color="green.300" mb={4}>
                    Address
                  </Heading>
                  <HStack align="start" spacing={4}>
                    <Box
                      w="48px"
                      h="48px"
                      borderRadius="lg"
                      bg="green.900"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Icon as={FaMapMarkerAlt} color="green.300" boxSize={6} />
                    </Box>
                    <VStack align="start" spacing={1}>
                      <Text color="white" fontWeight="medium" fontSize="lg">{selectedApp.addressLine1}</Text>
                      {selectedApp.addressLine2 && (
                        <Text color="white" fontSize="md">{selectedApp.addressLine2}</Text>
                      )}
                      <Text color="gray.300" fontSize="md">{selectedApp.city}, {selectedApp.postcode}</Text>
                      <Text color="gray.400" fontSize="md" fontWeight="semibold">{selectedApp.country}</Text>
                    </VStack>
                  </HStack>
                </Box>

                {/* Business Details */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box
                    p={4}
                    bg="yellow.900"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="yellow.700"
                  >
                    <Text color="yellow.300" fontSize="sm" mb={2}>Est. Monthly Bookings</Text>
                    <Text color="white" fontWeight="bold" fontSize="2xl">{selectedApp.estimatedMonthlyBookings}</Text>
                  </Box>
                  <Box
                    p={4}
                    bg="cyan.900"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="cyan.700"
                  >
                    <Text color="cyan.300" fontSize="sm" mb={2}>Primary Use Case</Text>
                    <Text color="white" fontWeight="bold" fontSize="xl">{selectedApp.primaryUseCase}</Text>
                  </Box>
                </SimpleGrid>

                {selectedApp.additionalNotes && (
                  <Box
                    p={4}
                    bg="gray.700"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="gray.600"
                  >
                    <Text color="gray.400" fontSize="sm" mb={2} fontWeight="semibold">Additional Notes</Text>
                    <Text color="white" fontSize="md" lineHeight="tall">
                      {selectedApp.additionalNotes}
                    </Text>
                  </Box>
                )}

                {selectedApp.status !== 'APPROVED' && selectedApp.status !== 'REJECTED' && (
                  <Box>
                    <Text color="gray.300" fontSize="sm" mb={2} fontWeight="semibold">Review Notes</Text>
                    <Textarea
                      bg="gray.700"
                      borderColor="blue.500"
                      borderWidth="2px"
                      color="white"
                      placeholder="Add your review notes here..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={4}
                      _hover={{ borderColor: 'blue.400' }}
                      _focus={{
                        borderColor: 'blue.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
                      }}
                    />
                  </Box>
                )}

                {selectedApp.reviewNotes && selectedApp.status !== 'PENDING' && (
                  <Alert
                    status="info"
                    bg="blue.900"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="blue.600"
                    boxShadow="0 4px 14px rgba(66, 153, 225, 0.2)"
                  >
                    <AlertIcon color="blue.300" boxSize={6} />
                    <Box>
                      <Text color="blue.200" fontWeight="bold" mb={1}>Review Notes</Text>
                      <Text color="blue.100">{selectedApp.reviewNotes}</Text>
                    </Box>
                  </Alert>
                )}

                {selectedApp.status !== 'APPROVED' && selectedApp.status !== 'REJECTED' && (
                  <Box>
                    <Text color="white" fontWeight="bold" mb={2}>
                      Monthly Order Limit
                    </Text>
                    <Input
                      type="number"
                      value={orderLimit}
                      onChange={(e) => setOrderLimit(parseInt(e.target.value) || 0)}
                      min={0}
                      placeholder="Enter monthly order limit (0 = unlimited)"
                      bg="gray.800"
                      borderColor="gray.600"
                      color="white"
                      _hover={{ borderColor: 'blue.400' }}
                      _focus={{
                        borderColor: 'blue.400',
                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
                      }}
                    />
                    <Text color="gray.400" fontSize="sm" mt={1}>
                      Set to 0 for unlimited bookings
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter
            borderTopWidth="2px"
            borderColor="gray.700"
            bg="gray.750"
            borderBottomRadius="md"
            py={6}
          >
            {selectedApp && selectedApp.status !== 'APPROVED' && selectedApp.status !== 'REJECTED' && (
              <HStack spacing={4} w="full" justify="flex-end">
                {selectedApp.status === 'PENDING' && (
                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={() => handleStatusUpdate('UNDER_REVIEW')}
                    isLoading={processing}
                    leftIcon={<FaEye />}
                    px={8}
                    py={6}
                    fontSize="md"
                    fontWeight="bold"
                    borderRadius="xl"
                    boxShadow="0 4px 14px rgba(66, 153, 225, 0.3)"
                    _hover={{
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 24px rgba(66, 153, 225, 0.5)',
                    }}
                    _active={{
                      transform: 'translateY(-1px)',
                    }}
                    transition="all 0.2s"
                  >
                    Mark Under Review
                  </Button>
                )}
                <Button
                  colorScheme="red"
                  variant="solid"
                  size="lg"
                  onClick={() => handleStatusUpdate('REJECTED')}
                  isLoading={processing}
                  leftIcon={<FaTimes />}
                  px={8}
                  py={6}
                  fontSize="md"
                  fontWeight="bold"
                  borderRadius="xl"
                  boxShadow="0 4px 14px rgba(245, 101, 101, 0.3)"
                  _hover={{
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 24px rgba(245, 101, 101, 0.5)',
                    bg: 'red.600',
                  }}
                  _active={{
                    transform: 'translateY(-1px)',
                  }}
                  transition="all 0.2s"
                >
                  Reject Application
                </Button>
                <Button
                  colorScheme="green"
                  variant="solid"
                  size="lg"
                  onClick={() => handleStatusUpdate('APPROVED')}
                  isLoading={processing}
                  leftIcon={<FaCheck />}
                  px={8}
                  py={6}
                  fontSize="md"
                  fontWeight="bold"
                  borderRadius="xl"
                  boxShadow="0 4px 14px rgba(72, 187, 120, 0.3)"
                  _hover={{
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 24px rgba(72, 187, 120, 0.5)',
                    bg: 'green.600',
                  }}
                  _active={{
                    transform: 'translateY(-1px)',
                  }}
                  transition="all 0.2s"
                >
                  Approve Application
                </Button>
              </HStack>
            )}
            {selectedApp && (selectedApp.status === 'APPROVED' || selectedApp.status === 'REJECTED') && (
              <Button
                variant="solid"
                colorScheme="gray"
                size="lg"
                onClick={onClose}
                px={8}
                py={6}
                fontSize="md"
                fontWeight="semibold"
                borderRadius="xl"
                _hover={{ bg: 'gray.600' }}
              >
                Close
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* API Key Success Modal */}
      <Modal isOpen={isApiKeyOpen} onClose={onApiKeyClose} size="2xl" isCentered closeOnOverlayClick={false}>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(10px)" />
        <ModalContent bg="gray.800" borderWidth="2px" borderColor="green.500">
          <ModalHeader bg="green.600" borderTopRadius="md" color="white">
            <HStack spacing={3}>
              <Icon as={FaCheckCircle} boxSize={8} />
              <Box>
                <Text fontSize="2xl" fontWeight="bold">Application Approved!</Text>
                <Text fontSize="sm" fontWeight="normal" color="green.100">
                  Company account has been created successfully
                </Text>
              </Box>
            </HStack>
          </ModalHeader>
          <ModalBody py={8}>
            <VStack spacing={6} align="stretch">
              <Alert status="warning" variant="subtle" colorScheme="orange" borderRadius="lg">
                <AlertIcon />
                <Box>
                  <AlertTitle>⚠️ Important: API Key (Show Once Only)</AlertTitle>
                  <AlertDescription fontSize="sm" mt={1}>
                    This API key will only be shown once. Make sure to copy and save it securely.
                  </AlertDescription>
                </Box>
              </Alert>

              <Box bg="gray.900" p={6} borderRadius="lg" borderWidth="1px" borderColor="gray.600">
                <Text color="gray.400" fontSize="sm" mb={2} fontWeight="bold">
                  API Key
                </Text>
                <HStack spacing={3}>
                  <Input
                    value={approvalData?.apiKey || ''}
                    readOnly
                    fontFamily="mono"
                    fontSize="sm"
                    bg="gray.950"
                    color="green.300"
                    borderColor="gray.600"
                    _hover={{ borderColor: 'green.400' }}
                  />
                  <Button
                    colorScheme="green"
                    onClick={() => {
                      navigator.clipboard.writeText(approvalData?.apiKey || '');
                      toast({
                        title: 'Copied!',
                        description: 'API key copied to clipboard',
                        status: 'success',
                        duration: 2000,
                      });
                    }}
                  >
                    Copy
                  </Button>
                </HStack>
              </Box>

              <Box bg="gray.900" p={6} borderRadius="lg" borderWidth="1px" borderColor="gray.600">
                <Text color="gray.400" fontSize="sm" mb={2} fontWeight="bold">
                  Password Setup URL
                </Text>
                <HStack spacing={3}>
                  <Input
                    value={approvalData?.setupUrl || ''}
                    readOnly
                    fontSize="sm"
                    bg="gray.950"
                    color="blue.300"
                    borderColor="gray.600"
                    _hover={{ borderColor: 'blue.400' }}
                  />
                  <Button
                    colorScheme="blue"
                    onClick={() => {
                      navigator.clipboard.writeText(approvalData?.setupUrl || '');
                      toast({
                        title: 'Copied!',
                        description: 'Setup URL copied to clipboard',
                        status: 'success',
                        duration: 2000,
                      });
                    }}
                  >
                    Copy
                  </Button>
                </HStack>
                <Text color="gray.500" fontSize="xs" mt={2}>
                  Send this link to the customer to set their password. Valid for 7 days.
                </Text>
              </Box>

              <Box bg="blue.900" p={4} borderRadius="lg" borderWidth="1px" borderColor="blue.600">
                <Text color="blue.100" fontSize="sm">
                  ✅ Welcome email sent automatically with setup instructions<br />
                  ✅ Company ID: <Text as="span" fontFamily="mono" color="blue.200">{approvalData?.companyId}</Text>
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter borderTopWidth="2px" borderColor="gray.700" bg="gray.750">
            <Button
              colorScheme="green"
              size="lg"
              onClick={() => {
                onApiKeyClose();
                setApprovalData(null);
              }}
              w="full"
              fontWeight="bold"
            >
              Done
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
