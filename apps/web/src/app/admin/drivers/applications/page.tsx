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
} from 'react-icons/fi';
import { format } from 'date-fns';

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

export default function DriverApplicationsPage() {
  const [applicationsData, setApplicationsData] = useState<ApplicationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<DriverApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  
  const toast = useToast();
  const { isOpen: isDetailsOpen, onOpen: onDetailsOpen, onClose: onDetailsClose } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();

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
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="center">
          <Spinner size="xl" color="blue.500" />
          <Text>Loading driver applications...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error" mb={4}>
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Error loading applications</Text>
            <Text fontSize="sm">{error}</Text>
          </Box>
        </Alert>
        <Button onClick={fetchApplications} colorScheme="blue">
          Try Again
        </Button>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="lg" mb={2}>Driver Applications</Heading>
            <Text color="gray.600">
              Manage driver applications and approvals
            </Text>
          </Box>
          <HStack spacing={4}>
            <IconButton
              aria-label="Refresh"
              icon={<FiRefreshCw />}
              onClick={fetchApplications}
              colorScheme="blue"
              variant="outline"
            />
          </HStack>
        </Flex>

        {/* Summary Stats */}
        {applicationsData?.summary && (
          <SimpleGrid columns={{ base: 2, md: 5 }} spacing={6}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total</StatLabel>
                  <StatNumber>{applicationsData.summary.total}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            {Object.entries(applicationsData.summary.statusCounts).map(([status, count]) => (
              <Card key={status}>
                <CardBody>
                  <Stat>
                    <StatLabel>{statusLabels[status as keyof typeof statusLabels]}</StatLabel>
                    <StatNumber color={`${statusColors[status as keyof typeof statusColors]}.500`}>
                      {count}
                    </StatNumber>
                  </Stat>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        )}

        {/* Filters */}
        <Card>
          <CardBody>
            <HStack spacing={4}>
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
              <Select
                placeholder="All Statuses"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                width="200px"
              >
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </HStack>
          </CardBody>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <Heading size="md">Applications</Heading>
          </CardHeader>
          <CardBody>
            {applicationsData?.applications.length === 0 ? (
              <Box textAlign="center" py={8}>
                <Text color="gray.500">No applications found</Text>
              </Box>
            ) : (
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Driver</Th>
                    <Th>Contact</Th>
                    <Th>License</Th>
                    <Th>Status</Th>
                    <Th>Applied</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {applicationsData?.applications.map((app) => (
                    <Tr key={app.id}>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="medium">{app.fullName}</Text>
                          <Text fontSize="sm" color="gray.600">
                            {app.postcode}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <FiMail size={12} />
                            <Text fontSize="sm">{app.email}</Text>
                          </HStack>
                          <HStack>
                            <FiPhone size={12} />
                            <Text fontSize="sm">{app.phone}</Text>
                          </HStack>
                        </VStack>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm">
                            License: {app.drivingLicenseNumber}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            Expires: {app.drivingLicenseExpiry ? format(new Date(app.drivingLicenseExpiry), 'MMM dd, yyyy') : 'N/A'}
                          </Text>
                        </VStack>
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={statusColors[app.status as keyof typeof statusColors]}
                          variant="subtle"
                        >
                          {statusLabels[app.status as keyof typeof statusLabels]}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {app.applicationDate && !isNaN(new Date(app.applicationDate).getTime()) 
                            ? format(new Date(app.applicationDate), 'MMM dd, yyyy')
                            : 'N/A'
                          }
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            aria-label="View details"
                            icon={<FiEye />}
                            size="sm"
                            variant="outline"
                            onClick={() => openDetails(app)}
                          />
                          {app.status === 'pending' || app.status === 'under_review' ? (
                            <>
                              <Button
                                size="sm"
                                colorScheme="green"
                                leftIcon={<FiCheck />}
                                onClick={() => handleApprove(app.id)}
                                isLoading={isProcessing === app.id}
                                loadingText="Approving..."
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="red"
                                leftIcon={<FiX />}
                                onClick={() => openReject(app)}
                                isLoading={isProcessing === app.id}
                                loadingText="Rejecting..."
                              >
                                Reject
                              </Button>
                            </>
                          ) : (
                            <Text fontSize="sm" color="gray.500">
                              {app.status === 'approved' ? 'Approved' : 'Rejected'}
                            </Text>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Application Details Modal */}
        <Modal isOpen={isDetailsOpen} onClose={onDetailsClose} size="xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Application Details</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedApplication && (
                <VStack spacing={6} align="stretch">
                  {/* Personal Information */}
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Personal Information</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={2} spacing={4}>
                        <Box>
                          <Text fontWeight="medium">Full Name</Text>
                          <Text>{selectedApplication.fullName}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="medium">Email</Text>
                          <Text>{selectedApplication.email}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="medium">Phone</Text>
                          <Text>{selectedApplication.phone}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="medium">Postcode</Text>
                          <Text>{selectedApplication.postcode}</Text>
                        </Box>
                        <GridItem colSpan={2}>
                          <Text fontWeight="medium">Address</Text>
                          <Text>{selectedApplication.address}</Text>
                        </GridItem>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  {/* Driver License Information */}
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Driver License Information</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={2} spacing={4}>
                        <Box>
                          <Text fontWeight="medium">License Number</Text>
                          <Text>{selectedApplication.drivingLicenseNumber || 'N/A'}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="medium">Expiry Date</Text>
                          <Text>
                            {selectedApplication.drivingLicenseExpiry && !isNaN(new Date(selectedApplication.drivingLicenseExpiry).getTime()) 
                              ? format(new Date(selectedApplication.drivingLicenseExpiry), 'MMM dd, yyyy')
                              : 'N/A'
                            }
                          </Text>
                        </Box>
                        <Box>
                          <Text fontWeight="medium">National Insurance</Text>
                          <Text>{selectedApplication.nationalInsuranceNumber || 'N/A'}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="medium">Date of Birth</Text>
                          <Text>
                            {selectedApplication.dateOfBirth && !isNaN(new Date(selectedApplication.dateOfBirth).getTime()) 
                              ? format(new Date(selectedApplication.dateOfBirth), 'MMM dd, yyyy')
                              : 'N/A'
                            }
                          </Text>
                        </Box>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  {/* Bank Account */}
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Bank Account</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={2} spacing={4}>
                        <Box>
                          <Text fontWeight="medium">Account Name</Text>
                          <Text>{selectedApplication.accountHolderName || 'N/A'}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="medium">Bank Name</Text>
                          <Text>{selectedApplication.bankName || 'N/A'}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="medium">Sort Code</Text>
                          <Text>{selectedApplication.sortCode || 'N/A'}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="medium">Account Number</Text>
                          <Text>{selectedApplication.accountNumber || 'N/A'}</Text>
                        </Box>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                  {/* Application Status */}
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Application Status</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack align="stretch" spacing={2}>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Status:</Text>
                          <Badge
                            colorScheme={statusColors[selectedApplication.status as keyof typeof statusColors]}
                            variant="subtle"
                          >
                            {statusLabels[selectedApplication.status as keyof typeof statusLabels]}
                          </Badge>
                        </HStack>
                        <HStack justify="space-between">
                          <Text fontWeight="medium">Applied:</Text>
                          <Text>
                            {selectedApplication.applicationDate && !isNaN(new Date(selectedApplication.applicationDate).getTime()) 
                              ? format(new Date(selectedApplication.applicationDate), 'MMM dd, yyyy HH:mm')
                              : 'N/A'
                            }
                          </Text>
                        </HStack>
                        {selectedApplication.reviewedAt && (
                          <HStack justify="space-between">
                            <Text fontWeight="medium">Reviewed:</Text>
                            <Text>
                              {selectedApplication.reviewedAt && !isNaN(new Date(selectedApplication.reviewedAt).getTime()) 
                                ? format(new Date(selectedApplication.reviewedAt), 'MMM dd, yyyy HH:mm')
                                : 'N/A'
                              }
                            </Text>
                          </HStack>
                        )}
                        {selectedApplication.reviewNotes && (
                          <Box>
                            <Text fontWeight="medium">Review Notes:</Text>
                            <Text color="red.500">{selectedApplication.reviewNotes}</Text>
                          </Box>
                        )}
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Documents Section */}
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Documents & Files</Heading>
                    </CardHeader>
                    <CardBody>
                      <VStack spacing={4} align="stretch">
                        {/* Driving License */}
                        <Box>
                          <Text fontWeight="medium" mb={2}>Driving License</Text>
                          <SimpleGrid columns={2} spacing={4}>
                            {selectedApplication.drivingLicenseFrontImage ? (
                              <Box>
                                <Text fontSize="sm" color="gray.600" mb={1}>Front Image</Text>
                                <Image
                                  src={selectedApplication.drivingLicenseFrontImage}
                                  alt="Driving License Front"
                                  borderRadius="md"
                                  maxH="150px"
                                  cursor="pointer"
                                  onClick={() => window.open(selectedApplication.drivingLicenseFrontImage, '_blank')}
                                  _hover={{ opacity: 0.8 }}
                                  fallback={
                                    <Box
                                      p={4}
                                      bg="gray.100"
                                      borderRadius="md"
                                      textAlign="center"
                                    >
                                      <Text fontSize="xs" color="gray.500">
                                        Image not available
                                      </Text>
                                    </Box>
                                  }
                                />
                              </Box>
                            ) : (
                              <Box>
                                <Text fontSize="sm" color="gray.600">Front Image</Text>
                                <Text color="red.500">Not provided</Text>
                              </Box>
                            )}
                            {selectedApplication.drivingLicenseBackImage ? (
                              <Box>
                                <Text fontSize="sm" color="gray.600" mb={1}>Back Image</Text>
                                <Image
                                  src={selectedApplication.drivingLicenseBackImage}
                                  alt="Driving License Back"
                                  borderRadius="md"
                                  maxH="150px"
                                  cursor="pointer"
                                  onClick={() => window.open(selectedApplication.drivingLicenseBackImage, '_blank')}
                                  _hover={{ opacity: 0.8 }}
                                  fallback={
                                    <Box
                                      p={4}
                                      bg="gray.100"
                                      borderRadius="md"
                                      textAlign="center"
                                    >
                                      <Text fontSize="xs" color="gray.500">
                                        Image not available
                                      </Text>
                                    </Box>
                                  }
                                />
                              </Box>
                            ) : (
                              <Box>
                                <Text fontSize="sm" color="gray.600">Back Image</Text>
                                <Text color="red.500">Not provided</Text>
                              </Box>
                            )}
                          </SimpleGrid>
                        </Box>

                        <Divider />

                        {/* Insurance Document */}
                        <Box>
                          <Text fontWeight="medium" mb={2}>Insurance Document</Text>
                          {selectedApplication.insuranceDocument ? (
                            <Box>
                              <HStack spacing={2} mb={2}>
                                <FiFileText />
                                <Text fontSize="sm">Insurance Document</Text>
                              </HStack>
                              <Image
                                src={selectedApplication.insuranceDocument}
                                alt="Insurance Document"
                                borderRadius="md"
                                maxH="200px"
                                cursor="pointer"
                                onClick={() => window.open(selectedApplication.insuranceDocument, '_blank')}
                                _hover={{ opacity: 0.8 }}
                                fallback={
                                  <Box
                                    p={4}
                                    bg="gray.100"
                                    borderRadius="md"
                                    textAlign="center"
                                  >
                                    <Text fontSize="xs" color="gray.500">
                                      Document not available
                                    </Text>
                                  </Box>
                                }
                              />
                            </Box>
                          ) : (
                            <Text color="red.500">Not provided</Text>
                          )}
                        </Box>

                        <Divider />

                        {/* Right to Work Document */}
                        <Box>
                          <Text fontWeight="medium" mb={2}>Right to Work Document</Text>
                          {selectedApplication.rightToWorkDocument ? (
                            <Box>
                              <HStack spacing={2} mb={2}>
                                <FiFileText />
                                <Text fontSize="sm">Right to Work Document</Text>
                              </HStack>
                              <Image
                                src={selectedApplication.rightToWorkDocument}
                                alt="Right to Work Document"
                                borderRadius="md"
                                maxH="200px"
                                cursor="pointer"
                                onClick={() => window.open(selectedApplication.rightToWorkDocument, '_blank')}
                                _hover={{ opacity: 0.8 }}
                                fallback={
                                  <Box
                                    p={4}
                                    bg="gray.100"
                                    borderRadius="md"
                                    textAlign="center"
                                  >
                                    <Text fontSize="xs" color="gray.500">
                                      Document not available
                                    </Text>
                                  </Box>
                                }
                              />
                            </Box>
                          ) : (
                            <Text color="red.500">Not provided</Text>
                          )}
                        </Box>
                      </VStack>
                    </CardBody>
                  </Card>

                  {/* Insurance & Right to Work Details */}
                  <SimpleGrid columns={2} spacing={4}>
                    {/* Insurance Details */}
                    <Card>
                      <CardHeader>
                        <Heading size="sm">Insurance Details</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          <Box>
                            <Text fontWeight="medium">Provider</Text>
                            <Text>{selectedApplication.insuranceProvider || 'N/A'}</Text>
                          </Box>
                          <Box>
                            <Text fontWeight="medium">Policy Number</Text>
                            <Text>{selectedApplication.insurancePolicyNumber || 'N/A'}</Text>
                          </Box>
                          <Box>
                            <Text fontWeight="medium">Expiry Date</Text>
                            <Text>
                              {selectedApplication.insuranceExpiry && !isNaN(new Date(selectedApplication.insuranceExpiry).getTime())
                                ? format(new Date(selectedApplication.insuranceExpiry), 'MMM dd, yyyy')
                                : 'N/A'
                              }
                            </Text>
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Right to Work Details */}
                    <Card>
                      <CardHeader>
                        <Heading size="sm">Right to Work</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={3} align="stretch">
                          <Box>
                            <Text fontWeight="medium">Share Code</Text>
                            <Text>{selectedApplication.rightToWorkShareCode || 'N/A'}</Text>
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>
                  </SimpleGrid>

                  {/* Application Outcomes */}
                  {selectedApplication.reviewNotes && (
                    <Card>
                      <CardHeader>
                        <Heading size="sm">Application Outcomes</Heading>
                      </CardHeader>
                      <CardBody>
                        <VStack spacing={4} align="stretch">
                          {selectedApplication.reviewNotes && (
                            <Box>
                              <HStack spacing={2} mb={2}>
                                <FiFileText color="blue" />
                                <Text fontWeight="medium" color="blue.500">Review Notes</Text>
                              </HStack>
                              <Text color="blue.600">{selectedApplication.reviewNotes}</Text>
                            </Box>
                          )}

                          {selectedApplication.reviewedBy && (
                            <Box>
                              <Text fontWeight="medium">Reviewed By</Text>
                              <Text>{selectedApplication.reviewedBy}</Text>
                            </Box>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  )}

                  {/* Metadata */}
                  <Card>
                    <CardHeader>
                      <Heading size="sm">Application Metadata</Heading>
                    </CardHeader>
                    <CardBody>
                      <SimpleGrid columns={2} spacing={4}>
                        <Box>
                          <Text fontWeight="medium">User ID</Text>
                          <Text fontSize="sm" fontFamily="mono">{selectedApplication.userId}</Text>
                        </Box>
                        <Box>
                          <Text fontWeight="medium">Application Date</Text>
                          <Text fontSize="sm">
                            {selectedApplication.applicationDate && !isNaN(new Date(selectedApplication.applicationDate).getTime())
                              ? format(new Date(selectedApplication.applicationDate), 'MMM dd, yyyy HH:mm')
                              : 'N/A'
                            }
                          </Text>
                        </Box>
                      </SimpleGrid>
                    </CardBody>
                  </Card>

                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button onClick={onDetailsClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        {/* Reject Application Modal */}
        <Modal isOpen={isRejectOpen} onClose={onRejectClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Reject Application</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Text>
                  Are you sure you want to reject this application? This action cannot be undone.
                </Text>
                <FormControl>
                  <FormLabel>Rejection Reason (Optional)</FormLabel>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="outline" mr={3} onClick={onRejectClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={() => selectedApplication && handleReject(selectedApplication.id)}
                isLoading={isProcessing === selectedApplication?.id}
                loadingText="Rejecting..."
              >
                Reject Application
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </VStack>
    </Container>
  );
}