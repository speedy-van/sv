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
  Badge,
  Grid,
  GridItem,
  Image,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  Select,
  FormControl,
  FormLabel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Flex,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiFileText,
  FiTruck,
  FiShield,
  FiCreditCard,
  FiUsers,
  FiCheck,
  FiX,
  FiEye,
  FiDownload,
  FiArrowLeft,
  FiStar,
  FiAlertTriangle,
} from 'react-icons/fi';
import { AdminShell } from '@/components/admin';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

interface DriverApplicationDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationalInsuranceNumber: string;
  score: number;
  scorePercentage: number;
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'requires_additional_info';
  
  address: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    county: string;
    fullAddress: string;
  };
  
  driving: {
    licenseNumber: string;
    licenseExpiry: string;
    licenseFrontImage?: string;
    licenseBackImage?: string;
  };
  
  insurance: {
    provider: string;
    policyNumber: string;
    expiry: string;
    document?: string;
  };
  
  banking: {
    bankName: string;
    accountHolderName: string;
    sortCode: string;
    accountNumber: string;
  };
  
  rightToWork: {
    shareCode: string;
    document?: string;
  };
  
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  
  terms: {
    agreeToTerms: boolean;
    agreeToDataProcessing: boolean;
    agreeToBackgroundCheck: boolean;
  };
  
  documents: {
    license: { status: string; url?: string };
    insurance: { status: string; url?: string };
    rightToWork: { status: string; url?: string };
  };
  
  appliedAt: string;
  applicationAge: number;
  complianceIssues: string[];
  complianceWarnings: string[];
  autoApproveEligible: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export default function DriverApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const [application, setApplication] = useState<DriverApplicationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [newStatus, setNewStatus] = useState<string>('');
  
  const { isOpen: isReviewOpen, onOpen: onReviewOpen, onClose: onReviewClose } = useDisclosure();
  const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    if (params?.id) {
      fetchApplicationDetails();
    }
  }, [params?.id]);

  const fetchApplicationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/drivers/applications/${params?.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setApplication(data);
        setReviewNotes(data.reviewNotes || '');
        setNewStatus(data.status || '');
      } else {
        throw new Error('Failed to fetch application details');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load application details',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      console.error('Error fetching application details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!application || !newStatus) return;
    
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/drivers/applications/${application.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          reviewNotes: reviewNotes,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Application status updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        fetchApplicationDetails();
        onReviewClose();
      } else {
        throw new Error('Failed to update application');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update application status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'under_review':
        return 'blue';
      case 'requires_additional_info':
        return 'orange';
      case 'pending':
      default:
        return 'yellow';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'green';
    if (score >= 70) return 'yellow';
    if (score >= 50) return 'orange';
    return 'red';
  };

  const openImageModal = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    onImageOpen();
  };

  if (loading) {
    return (
      <AdminShell title="Application Details" subtitle="Loading...">
        <Flex justify="center" align="center" height="400px">
          <Spinner size="xl" />
        </Flex>
      </AdminShell>
    );
  }

  if (!application) {
    return (
      <AdminShell title="Application Details" subtitle="Not Found">
        <Alert status="error">
          <AlertIcon />
          Application not found or you don't have permission to view it.
        </Alert>
      </AdminShell>
    );
  }

  return (
    <AdminShell 
      title="Application Details" 
      subtitle={`${application.name} - ${application.email}`}
      actions={
        <HStack spacing={3}>
          <Button
            variant="outline"
            leftIcon={<FiArrowLeft />}
            onClick={() => router.push('/admin/drivers/applications')}
          >
            Back to Applications
          </Button>
          <Button
            colorScheme="blue"
            leftIcon={<FiFileText />}
            onClick={onReviewOpen}
          >
            Review Application
          </Button>
        </HStack>
      }
    >
      <Container maxW="container.xl" py={6}>
        <VStack spacing={8} align="stretch">
          
          {/* Application Overview */}
          <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
            <VStack spacing={6} align="stretch">
              
              {/* Personal Information */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardHeader>
                  <HStack spacing={3}>
                    <Icon as={FiUser} color="blue.500" boxSize={5} />
                    <Heading size="md">Personal Information</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Full Name</Text>
                      <Text fontWeight="medium">{application.name}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Email</Text>
                      <Text fontWeight="medium">{application.email}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Phone</Text>
                      <Text fontWeight="medium">{application.phone}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Date of Birth</Text>
                      <Text fontWeight="medium">
                        {new Date(application.dateOfBirth).toLocaleDateString('en-GB')}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>National Insurance</Text>
                      <Text fontWeight="medium">{application.nationalInsuranceNumber}</Text>
                    </Box>
                  </Grid>
                </CardBody>
              </Card>

              {/* Address Information */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardHeader>
                  <HStack spacing={3}>
                    <Icon as={FiMapPin} color="green.500" boxSize={5} />
                    <Heading size="md">Address Information</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Full Address</Text>
                      <Text fontWeight="medium">{application.address.fullAddress}</Text>
                    </Box>
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>City</Text>
                        <Text fontWeight="medium">{application.address.city}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Postcode</Text>
                        <Text fontWeight="medium">{application.address.postcode}</Text>
                      </Box>
                    </Grid>
                  </VStack>
                </CardBody>
              </Card>

              {/* Driving Information */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardHeader>
                  <HStack spacing={3}>
                    <Icon as={FiTruck} color="purple.500" boxSize={5} />
                    <Heading size="md">Driving Information</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>License Number</Text>
                      <Text fontWeight="medium">{application.driving.licenseNumber}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>License Expiry</Text>
                      <Text fontWeight="medium">
                        {new Date(application.driving.licenseExpiry).toLocaleDateString('en-GB')}
                      </Text>
                    </Box>
                  </Grid>
                  
                  <Divider my={4} />
                  
                  <Text fontSize="sm" color="gray.500" mb={3}>License Images</Text>
                  <HStack spacing={4}>
                    {application.driving.licenseFrontImage && (
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={2}>Front</Text>
                        <Box
                          w="120px"
                          h="80px"
                          borderRadius="md"
                          overflow="hidden"
                          cursor="pointer"
                          onClick={() => openImageModal(application.driving.licenseFrontImage!)}
                          _hover={{ transform: 'scale(1.05)' }}
                          transition="transform 0.2s"
                        >
                          <Image
                            src={application.driving.licenseFrontImage}
                            alt="License Front"
                            w="100%"
                            h="100%"
                            objectFit="cover"
                          />
                        </Box>
                      </Box>
                    )}
                    {application.driving.licenseBackImage && (
                      <Box>
                        <Text fontSize="xs" color="gray.500" mb={2}>Back</Text>
                        <Box
                          w="120px"
                          h="80px"
                          borderRadius="md"
                          overflow="hidden"
                          cursor="pointer"
                          onClick={() => openImageModal(application.driving.licenseBackImage!)}
                          _hover={{ transform: 'scale(1.05)' }}
                          transition="transform 0.2s"
                        >
                          <Image
                            src={application.driving.licenseBackImage}
                            alt="License Back"
                            w="100%"
                            h="100%"
                            objectFit="cover"
                          />
                        </Box>
                      </Box>
                    )}
                  </HStack>
                </CardBody>
              </Card>

              {/* Insurance & Banking */}
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                <Card bg={bgColor} borderColor={borderColor}>
                  <CardHeader>
                    <HStack spacing={3}>
                      <Icon as={FiShield} color="orange.500" boxSize={5} />
                      <Heading size="md">Insurance</Heading>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Provider</Text>
                        <Text fontWeight="medium">{application.insurance.provider}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Policy Number</Text>
                        <Text fontWeight="medium">{application.insurance.policyNumber}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Expiry Date</Text>
                        <Text fontWeight="medium">
                          {new Date(application.insurance.expiry).toLocaleDateString('en-GB')}
                        </Text>
                      </Box>
                      {application.insurance.document && (
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<FiEye />}
                          onClick={() => openImageModal(application.insurance.document!)}
                        >
                          View Document
                        </Button>
                      )}
                    </VStack>
                  </CardBody>
                </Card>

                <Card bg={bgColor} borderColor={borderColor}>
                  <CardHeader>
                    <HStack spacing={3}>
                      <Icon as={FiCreditCard} color="teal.500" boxSize={5} />
                      <Heading size="md">Banking</Heading>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <VStack spacing={3} align="stretch">
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Bank Name</Text>
                        <Text fontWeight="medium">{application.banking.bankName}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="sm" color="gray.500" mb={1}>Account Holder</Text>
                        <Text fontWeight="medium">{application.banking.accountHolderName}</Text>
                      </Box>
                      <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                        <Box>
                          <Text fontSize="sm" color="gray.500" mb={1}>Sort Code</Text>
                          <Text fontWeight="medium">{application.banking.sortCode}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" color="gray.500" mb={1}>Account Number</Text>
                          <Text fontWeight="medium">****{application.banking.accountNumber.slice(-4)}</Text>
                        </Box>
                      </Grid>
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>

              {/* Emergency Contact */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardHeader>
                  <HStack spacing={3}>
                    <Icon as={FiUsers} color="red.500" boxSize={5} />
                    <Heading size="md">Emergency Contact</Heading>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Name</Text>
                      <Text fontWeight="medium">{application.emergencyContact.name}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Phone</Text>
                      <Text fontWeight="medium">{application.emergencyContact.phone}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={1}>Relationship</Text>
                      <Text fontWeight="medium">{application.emergencyContact.relationship}</Text>
                    </Box>
                  </Grid>
                </CardBody>
              </Card>
            </VStack>

            {/* Sidebar */}
            <VStack spacing={6} align="stretch">
              
              {/* Application Status */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardBody>
                  <VStack spacing={4} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">Status</Text>
                      <Badge colorScheme={getStatusColor(application.status)} size="lg">
                        {application.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </HStack>
                    
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">Application Score</Text>
                      <HStack spacing={2}>
                        <Text fontWeight="bold" color={getScoreColor(application.score)}>
                          {application.score}/100
                        </Text>
                        <Badge colorScheme={getScoreColor(application.score)}>
                          {application.scorePercentage}%
                        </Badge>
                      </HStack>
                    </HStack>
                    
                    <Box>
                      <Text fontSize="sm" color="gray.500" mb={2}>Completeness</Text>
                      <Progress 
                        value={application.scorePercentage} 
                        colorScheme={getScoreColor(application.score)}
                        size="lg"
                        borderRadius="md"
                      />
                    </Box>

                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">Applied</Text>
                      <Text fontSize="sm" fontWeight="medium">
                        {application.applicationAge} days ago
                      </Text>
                    </HStack>

                    {application.autoApproveEligible && (
                      <Alert status="success" size="sm">
                        <AlertIcon />
                        <Text fontSize="sm">Auto-approve eligible</Text>
                      </Alert>
                    )}

                    {application.complianceIssues.length > 0 && (
                      <Alert status="error" size="sm">
                        <AlertIcon />
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" fontWeight="bold">Compliance Issues:</Text>
                          {application.complianceIssues.map((issue, index) => (
                            <Text key={index} fontSize="xs">• {issue}</Text>
                          ))}
                        </VStack>
                      </Alert>
                    )}

                    {application.complianceWarnings.length > 0 && (
                      <Alert status="warning" size="sm">
                        <AlertIcon />
                        <VStack align="start" spacing={1}>
                          <Text fontSize="sm" fontWeight="bold">Warnings:</Text>
                          {application.complianceWarnings.map((warning, index) => (
                            <Text key={index} fontSize="xs">• {warning}</Text>
                          ))}
                        </VStack>
                      </Alert>
                    )}
                  </VStack>
                </CardBody>
              </Card>

              {/* Document Status */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Document Status</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <HStack justify="space-between">
                      <Text fontSize="sm">Driving License</Text>
                      <Badge colorScheme={application.documents.license.status === 'complete' ? 'green' : 'red'}>
                        {application.documents.license.status}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Insurance</Text>
                      <Badge colorScheme={application.documents.insurance.status === 'complete' ? 'green' : 'red'}>
                        {application.documents.insurance.status}
                      </Badge>
                    </HStack>
                    <HStack justify="space-between">
                      <Text fontSize="sm">Right to Work</Text>
                      <Badge colorScheme={application.documents.rightToWork.status === 'complete' ? 'green' : 'red'}>
                        {application.documents.rightToWork.status}
                      </Badge>
                    </HStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Quick Actions */}
              <Card bg={bgColor} borderColor={borderColor}>
                <CardHeader>
                  <Heading size="md">Quick Actions</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={3} align="stretch">
                    <Button
                      colorScheme="green"
                      leftIcon={<FiCheck />}
                      onClick={() => {
                        setNewStatus('approved');
                        setReviewNotes('Application approved - all requirements met');
                        onReviewOpen();
                      }}
                      isDisabled={application.status === 'approved'}
                    >
                      Approve Application
                    </Button>
                    <Button
                      colorScheme="red"
                      variant="outline"
                      leftIcon={<FiX />}
                      onClick={() => {
                        setNewStatus('rejected');
                        setReviewNotes('');
                        onReviewOpen();
                      }}
                      isDisabled={application.status === 'rejected'}
                    >
                      Reject Application
                    </Button>
                    <Button
                      colorScheme="orange"
                      variant="outline"
                      leftIcon={<FiAlertTriangle />}
                      onClick={() => {
                        setNewStatus('requires_additional_info');
                        setReviewNotes('');
                        onReviewOpen();
                      }}
                    >
                      Request More Info
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </Grid>
        </VStack>
      </Container>

      {/* Review Modal */}
      <Modal isOpen={isReviewOpen} onClose={onReviewClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Review Application</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>New Status</FormLabel>
                <Select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="under_review">Under Review</option>
                  <option value="requires_additional_info">Requires Additional Info</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel>Review Notes</FormLabel>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this review decision..."
                  rows={4}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onReviewClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleStatusUpdate}
              isLoading={actionLoading}
              loadingText="Updating..."
            >
              Update Status
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Image Modal */}
      <Modal isOpen={isImageOpen} onClose={onImageClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Document Preview</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedImage && (
              <Box position="relative">
                <Image
                  src={selectedImage}
                  alt="Document"
                  w="100%"
                  maxH="500px"
                  objectFit="contain"
                  fallback={
                    <Alert status="error">
                      <AlertIcon />
                      <VStack align="start" spacing={2}>
                        <Text fontWeight="bold">Document not found</Text>
                        <Text fontSize="sm">The file may have been moved or deleted.</Text>
                        <Text fontSize="xs" color="gray.500">Path: {selectedImage}</Text>
                      </VStack>
                    </Alert>
                  }
                  onError={(e) => {
                    console.error('Failed to load document:', selectedImage);
                    toast({
                      title: 'Error loading document',
                      description: 'The document file could not be found. It may have been deleted or moved.',
                      status: 'error',
                      duration: 5000,
                      isClosable: true,
                    });
                  }}
                />
              </Box>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onImageClose}>
              Close
            </Button>
            {selectedImage && (
              <Button
                as="a"
                href={selectedImage}
                target="_blank"
                rel="noopener noreferrer"
                colorScheme="blue"
                leftIcon={<FiDownload />}
                download
              >
                Download
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminShell>
  );
}
