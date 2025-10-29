'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  useToast,
  Select,
  HStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  VStack,
  Textarea,
  Link,
  Spinner,
  Card,
  CardBody,
  Icon,
  IconButton,
} from '@chakra-ui/react';
import { FiEye, FiCheck, FiX, FiDownload, FiBriefcase } from 'react-icons/fi';

interface Application {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  position: string;
  cvUrl: string;
  coverLetter: string;
  status: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  contractSent: boolean;
  contractSentAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'yellow',
  under_review: 'blue',
  approved: 'green',
  rejected: 'red',
  contract_sent: 'purple',
};

export default function AdminCareersPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isRejectOpen,
    onOpen: onRejectOpen,
    onClose: onRejectClose,
  } = useDisclosure();

  const toast = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(
        applications.filter((app) => app.status === statusFilter)
      );
    }
  }, [statusFilter, applications]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      console.log('📋 Fetching career applications...');
      
      const response = await fetch('/api/admin/careers');
      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.success) {
        setApplications(data.data.applications);
        console.log('✅ Applications loaded:', data.data.applications.length);
      } else {
        console.error('❌ API returned error:', data.error);
        throw new Error(data.error || 'Failed to fetch applications');
      }
    } catch (error: any) {
      console.error('❌ Fetch error:', error);
      toast({
        title: 'Error Loading Applications',
        description: error.message || 'Failed to fetch applications. Please check console for details.',
        status: 'error',
        duration: 7000,
        isClosable: true,
      });
      // Set empty array so UI shows "no applications" instead of loading forever
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    onOpen();
  };

  const handleApprove = async (id: string) => {
    if (
      !confirm(
        'Are you sure you want to approve this application and send the employment contract?'
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/careers/${id}/approve`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Application Approved',
          description: 'Employment contract has been sent to the applicant.',
          status: 'success',
          duration: 5000,
        });
        fetchApplications();
        onClose();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve application',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `/api/admin/careers/${selectedApplication.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Application Rejected',
          description: 'Rejection email has been sent to the applicant.',
          status: 'success',
          duration: 5000,
        });
        setRejectionReason('');
        fetchApplications();
        onClose();
        onRejectClose();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject application',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (application: Application) => {
    setSelectedApplication(application);
    onRejectOpen();
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4}>Loading applications...</Text>
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" spacing={6}>
        {/* Header */}
        <HStack justify="space-between" align="center">
          <HStack>
            <Icon as={FiBriefcase} boxSize={8} color="blue.500" />
            <Heading size="lg">Career Applications</Heading>
          </HStack>
          <Badge colorScheme="blue" fontSize="md" px={3} py={1}>
            {applications.length} Total
          </Badge>
        </HStack>

        {/* Filter */}
        <Card>
          <CardBody>
            <HStack>
              <Text fontWeight="bold">Filter by Status:</Text>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                maxW="250px"
              >
                <option value="all">All Applications</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="contract_sent">Contract Sent</option>
              </Select>
              <Text color="gray.500">
                ({filteredApplications.length} showing)
              </Text>
            </HStack>
          </CardBody>
        </Card>

        {/* Applications Table */}
        <Card>
          <CardBody p={0}>
            <Box overflowX="auto">
              <Table variant="simple">
                <Thead bg="gray.50">
                  <Tr>
                    <Th>Date</Th>
                    <Th>Name</Th>
                    <Th>Position</Th>
                    <Th>Email</Th>
                    <Th>Phone</Th>
                    <Th>Status</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredApplications.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={10}>
                        <Text color="gray.500">No applications found</Text>
                      </Td>
                    </Tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <Tr key={app.id}>
                        <Td>
                          {new Date(app.createdAt).toLocaleDateString('en-GB')}
                        </Td>
                        <Td fontWeight="bold">{app.fullName}</Td>
                        <Td>{app.position}</Td>
                        <Td>{app.email}</Td>
                        <Td>{app.phone}</Td>
                        <Td>
                          <Badge colorScheme={STATUS_COLORS[app.status]}>
                            {app.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              aria-label="View details"
                              icon={<FiEye />}
                              size="sm"
                              onClick={() => handleViewDetails(app)}
                            />
                            {app.status === 'pending' ||
                            app.status === 'under_review' ? (
                              <>
                                <IconButton
                                  aria-label="Approve"
                                  icon={<FiCheck />}
                                  colorScheme="green"
                                  size="sm"
                                  onClick={() => handleApprove(app.id)}
                                  isLoading={actionLoading}
                                />
                                <IconButton
                                  aria-label="Reject"
                                  icon={<FiX />}
                                  colorScheme="red"
                                  size="sm"
                                  onClick={() => openRejectModal(app)}
                                  isLoading={actionLoading}
                                />
                              </>
                            ) : null}
                            <IconButton
                              aria-label="Download CV"
                              icon={<FiDownload />}
                              as="a"
                              href={app.cvUrl}
                              target="_blank"
                              size="sm"
                              variant="outline"
                            />
                          </HStack>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      </VStack>

      {/* View Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Application Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedApplication && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="bold">Full Name:</Text>
                  <Text>{selectedApplication.fullName}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Email:</Text>
                  <Text>{selectedApplication.email}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Phone:</Text>
                  <Text>{selectedApplication.phone}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Position:</Text>
                  <Text>{selectedApplication.position}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Status:</Text>
                  <Badge colorScheme={STATUS_COLORS[selectedApplication.status]}>
                    {selectedApplication.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </Box>
                <Box>
                  <Text fontWeight="bold">Applied On:</Text>
                  <Text>
                    {new Date(selectedApplication.createdAt).toLocaleString('en-GB')}
                  </Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">Cover Letter:</Text>
                  <Box
                    p={4}
                    bg="gray.50"
                    borderRadius="md"
                    maxH="200px"
                    overflowY="auto"
                  >
                    <Text whiteSpace="pre-wrap">{selectedApplication.coverLetter}</Text>
                  </Box>
                </Box>
                <Box>
                  <Text fontWeight="bold">CV:</Text>
                  <Button
                    as="a"
                    href={selectedApplication.cvUrl}
                    target="_blank"
                    leftIcon={<FiDownload />}
                    size="sm"
                    variant="outline"
                  >
                    Download CV
                  </Button>
                </Box>
                {selectedApplication.reviewedBy && (
                  <>
                    <Box>
                      <Text fontWeight="bold">Reviewed By:</Text>
                      <Text>{selectedApplication.reviewedBy}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Reviewed At:</Text>
                      <Text>
                        {new Date(selectedApplication.reviewedAt!).toLocaleString(
                          'en-GB'
                        )}
                      </Text>
                    </Box>
                  </>
                )}
                {selectedApplication.rejectionReason && (
                  <Box>
                    <Text fontWeight="bold">Rejection Reason:</Text>
                    <Box p={4} bg="red.50" borderRadius="md">
                      <Text>{selectedApplication.rejectionReason}</Text>
                    </Box>
                  </Box>
                )}
                {selectedApplication.contractSent && (
                  <Box>
                    <Text fontWeight="bold" color="green.600">
                      ✓ Employment contract sent on:{' '}
                      {new Date(selectedApplication.contractSentAt!).toLocaleString(
                        'en-GB'
                      )}
                    </Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            {selectedApplication &&
              (selectedApplication.status === 'pending' ||
                selectedApplication.status === 'under_review') && (
                <>
                  <Button
                    colorScheme="green"
                    mr={3}
                    onClick={() => handleApprove(selectedApplication.id)}
                    isLoading={actionLoading}
                    leftIcon={<FiCheck />}
                  >
                    Approve & Send Contract
                  </Button>
                  <Button
                    colorScheme="red"
                    mr={3}
                    onClick={() => openRejectModal(selectedApplication)}
                    leftIcon={<FiX />}
                  >
                    Reject
                  </Button>
                </>
              )}
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={isRejectOpen} onClose={onRejectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reject Application</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Text>
                Are you sure you want to reject this application? You can optionally
                provide a reason that will be sent to the applicant.
              </Text>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection (optional)"
                rows={4}
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="red"
              mr={3}
              onClick={handleReject}
              isLoading={actionLoading}
            >
              Confirm Rejection
            </Button>
            <Button variant="ghost" onClick={onRejectClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}

