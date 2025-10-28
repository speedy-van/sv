'use client';

/**
 * Pending Approvals Client Component
 * Real-time dashboard for reviewing cap-breached driver payments
 */

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Button,
  Badge,
  Spinner,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Divider,
  Collapse,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useDisclosure,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import Pusher from 'pusher-js';

// Types
interface PendingApproval {
  assignmentId: string;
  bookingReference: string;
  driver: {
    id: string;
    name: string;
    email: string;
  };
  jobDetails: {
    pickup: string;
    dropoff: string;
    estimatedDistanceMiles?: number;
    serviceType: string;
  };
  capContext: {
    currentDailyTotal: number;
    remainingAllowance: number;
    dailyCapPence: number;
    currentDailyTotalGBP: string;
    remainingAllowanceGBP: string;
  };
  timing: {
    completedAt: string;
    waitingMinutes: number;
  };
  status: string;
}

interface ApprovalModalData {
  assignmentId: string;
  driverName: string;
  bookingReference: string;
  action: 'approved' | 'rejected';
  suggestedAmount: number;
}

export default function PendingApprovalsClient() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalWaitingValue: '0.00',
    avgWaitTime: 0,
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalData, setModalData] = useState<ApprovalModalData | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState(0);

  const toast = useToast();

  // Fetch pending approvals
  const fetchApprovals = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/jobs/pending-approval');
      if (!response.ok) throw new Error('Failed to fetch pending approvals');

      const data = await response.json();
      setApprovals(data.pendingApprovals || []);

      // Calculate stats
      const totalPending = data.count || 0;
      const totalWaitingValue = data.pendingApprovals
        ?.reduce((sum: number, item: PendingApproval) => sum + item.capContext.currentDailyTotal, 0)
        .toFixed(2) || '0.00';
      const avgWaitTime = data.pendingApprovals?.length > 0
        ? Math.round(
            data.pendingApprovals.reduce((sum: number, item: PendingApproval) => sum + item.timing.waitingMinutes, 0) /
              data.pendingApprovals.length
          )
        : 0;

      setStats({ totalPending, totalWaitingValue, avgWaitTime });
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast({
        title: 'Error loading data',
        description: 'Failed to load pending approvals',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Setup Pusher real-time updates
  useEffect(() => {
    fetchApprovals();

    // Initialize Pusher
    const PUSHER_KEY = '407cb06c423e6c032e9c';
    const PUSHER_CLUSTER = 'eu';
    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe('admin-notifications');
    
    channel.bind('payment-approval-required', (data: any) => {
      console.log('🔔 New payment approval required:', data);
      toast({
        title: 'New approval request',
        description: `Driver ${data.driverId} requires admin approval`,
        status: 'info',
        duration: 10000,
        isClosable: true,
      });
      fetchApprovals();
    });

    channel.bind('payment-approved', () => {
      fetchApprovals();
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [fetchApprovals, toast]);

  // Open approval modal
  const handleOpenModal = (approval: PendingApproval, action: 'approved' | 'rejected') => {
    setModalData({
      assignmentId: approval.assignmentId,
      driverName: approval.driver.name,
      bookingReference: approval.bookingReference,
      action,
      suggestedAmount: approval.capContext.remainingAllowance,
    });
    setApprovedAmount(approval.capContext.remainingAllowance / 100);
    setAdminNotes('');
    onOpen();
  };

  // Submit approval decision
  const handleSubmitDecision = async () => {
    if (!modalData) return;

    setProcessingId(modalData.assignmentId);

    try {
      const response = await fetch(`/api/admin/jobs/${modalData.assignmentId}/approve-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modalData.action,
          approved_amount_pence: modalData.action === 'approved' ? Math.round(approvedAmount * 100) : 0,
          admin_notes: adminNotes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process decision');
      }

      const result = await response.json();

      toast({
        title: modalData.action === 'approved' ? 'Approved successfully' : 'Rejected',
        description:
          modalData.action === 'approved'
            ? `Approved £${result.data.approvedAmountGBP} for driver ${modalData.driverName}`
            : `Payment rejected for driver ${modalData.driverName}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onClose();
      fetchApprovals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process decision',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading pending approvals...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2}>
            Pending Approvals
          </Heading>
          <Text color="gray.600">Review and approve driver payments that exceeded the daily cap (£500)</Text>
        </Box>

        {/* Stats Cards */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Pending Requests</StatLabel>
                <StatNumber>{stats.totalPending}</StatNumber>
                <StatHelpText>Awaiting approval</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Average Wait Time</StatLabel>
                <StatNumber>{stats.avgWaitTime} minutes</StatNumber>
                <StatHelpText>Since job completion</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Pending Amount</StatLabel>
                <StatNumber>£{stats.totalWaitingValue}</StatNumber>
                <StatHelpText>Awaiting processing</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* No Approvals */}
        {approvals.length === 0 && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <AlertTitle>No pending approvals</AlertTitle>
            <AlertDescription>All payments have been processed!</AlertDescription>
          </Alert>
        )}

        {/* Approvals List */}
        {approvals.map((approval) => (
          <Card key={approval.assignmentId} variant="outline">
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Header Row */}
                <HStack justify="space-between">
                  <HStack spacing={4}>
                    <Box>
                      <Text fontWeight="bold" fontSize="lg">
                        {approval.driver.name}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {approval.driver.email}
                      </Text>
                    </Box>
                    <Badge colorScheme="orange" fontSize="sm">
                      {approval.bookingReference}
                    </Badge>
                  </HStack>

                  <HStack>
                    <Badge colorScheme="red" fontSize="md" px={3} py={1}>
                      Waiting {approval.timing.waitingMinutes} minutes
                    </Badge>
                    <IconButton
                      aria-label="Toggle details"
                      icon={expandedId === approval.assignmentId ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedId(expandedId === approval.assignmentId ? null : approval.assignmentId)}
                    />
                  </HStack>
                </HStack>

                {/* Cap Context */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Box>
                    <Text fontSize="xs" color="gray.600">
                      Daily Cap
                    </Text>
                    <Text fontWeight="bold" fontSize="lg">
                      £{(approval.capContext.dailyCapPence / 100).toFixed(2)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">
                      Current Total
                    </Text>
                    <Text fontWeight="bold" fontSize="lg" color="orange.500">
                      £{approval.capContext.currentDailyTotalGBP}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">
                      Remaining
                    </Text>
                    <Text fontWeight="bold" fontSize="lg" color="green.500">
                      £{approval.capContext.remainingAllowanceGBP}
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* Expanded Details */}
                <Collapse in={expandedId === approval.assignmentId} animateOpacity>
                  <VStack spacing={3} align="stretch" pt={2}>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" mb={2}>
                        Job Details:
                      </Text>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                        <Box>
                          <Text fontSize="xs" color="gray.600">
                            Service Type
                          </Text>
                          <Text fontSize="sm">{approval.jobDetails.serviceType}</Text>
                        </Box>
                        {approval.jobDetails.estimatedDistanceMiles && (
                          <Box>
                            <Text fontSize="xs" color="gray.600">
                              Distance
                            </Text>
                            <Text fontSize="sm">{approval.jobDetails.estimatedDistanceMiles} miles</Text>
                          </Box>
                        )}
                        <Box>
                          <Text fontSize="xs" color="gray.600">
                            Pickup
                          </Text>
                          <Text fontSize="sm">{approval.jobDetails.pickup}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.600">
                            Dropoff
                          </Text>
                          <Text fontSize="sm">{approval.jobDetails.dropoff}</Text>
                        </Box>
                      </SimpleGrid>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.600" mb={1}>
                        Completion Time
                      </Text>
                      <Text fontSize="sm">{new Date(approval.timing.completedAt).toLocaleString('ar-EG')}</Text>
                    </Box>
                  </VStack>
                </Collapse>

                {/* Action Buttons */}
                <HStack spacing={3} pt={2}>
                  <Button
                    colorScheme="green"
                    leftIcon={<CheckIcon />}
                    flex={1}
                    isDisabled={processingId === approval.assignmentId}
                    onClick={() => handleOpenModal(approval, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    colorScheme="red"
                    leftIcon={<CloseIcon />}
                    flex={1}
                    isDisabled={processingId === approval.assignmentId}
                    onClick={() => handleOpenModal(approval, 'rejected')}
                  >
                    Reject
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </VStack>

      {/* Approval Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {modalData?.action === 'approved' ? 'Approve Payment' : 'Reject Payment'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold">Driver: {modalData?.driverName}</Text>
                <Text fontSize="sm" color="gray.600">
                  Booking Ref: {modalData?.bookingReference}
                </Text>
              </Box>

              {modalData?.action === 'approved' && (
                <Box>
                  <Text mb={2} fontWeight="bold">
                    Approved Amount (£)
                  </Text>
                  <NumberInput
                    value={approvedAmount}
                    onChange={(_, valueAsNumber) => setApprovedAmount(valueAsNumber)}
                    min={0}
                    max={(modalData?.suggestedAmount || 0) / 100}
                    step={0.01}
                    precision={2}
                  >
                    <NumberInputField />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                  <Text fontSize="xs" color="gray.600" mt={1}>
                    Maximum available: £{((modalData?.suggestedAmount || 0) / 100).toFixed(2)}
                  </Text>
                </Box>
              )}

              <Box>
                <Text mb={2} fontWeight="bold">
                  Admin Notes (optional)
                </Text>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes..."
                  rows={3}
                />
              </Box>

              {modalData?.action === 'rejected' && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    The driver will be notified of the payment rejection. Make sure to add the reason for rejection in the notes.
                  </AlertDescription>
                </Alert>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme={modalData?.action === 'approved' ? 'green' : 'red'}
              isLoading={processingId === modalData?.assignmentId}
              onClick={handleSubmitDecision}
            >
              {modalData?.action === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
