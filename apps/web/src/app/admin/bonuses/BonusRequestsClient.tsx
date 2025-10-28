'use client';

/**
 * Bonus Requests Client Component
 * Dashboard for reviewing and approving driver bonus requests
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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  FormControl,
  FormLabel,
  Select,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, CheckIcon, CloseIcon, AddIcon } from '@chakra-ui/icons';
import Pusher from 'pusher-js';

// Types
interface BonusRequest {
  bonusRequestId: string;
  driver: {
    id: string;
    name: string;
    email: string;
    performance: {
      completedJobs30d: number;
      totalEarnings30dGBP: string;
      avgEarnings30dGBP: string;
    };
  };
  bonusDetails: {
    type: string;
    requestedAmountGBP: string;
    reason: string;
    requestedBy: string;
    requestedAt: string;
  };
  assignmentId?: string;
}

interface BonusModalData {
  bonusRequestId: string;
  driverName: string;
  action: 'approved' | 'rejected';
  requestedAmount: number;
}

interface NewBonusForm {
  driverId: string;
  assignmentId: string;
  bonusType: string;
  requestedAmountPence: number;
  reason: string;
  autoApprove: boolean;
}

export default function BonusRequestsClient() {
  const [bonuses, setBonuses] = useState<BonusRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalAmountGBP: '0.00',
    avgRequestGBP: '0.00',
  });

  const { isOpen: isDecisionOpen, onOpen: onDecisionOpen, onClose: onDecisionClose } = useDisclosure();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  
  const [modalData, setModalData] = useState<BonusModalData | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState(0);

  // New bonus form
  const [newBonus, setNewBonus] = useState<NewBonusForm>({
    driverId: '',
    assignmentId: '',
    bonusType: 'manual_admin_bonus',
    requestedAmountPence: 0,
    reason: '',
    autoApprove: false,
  });

  const toast = useToast();

  // Fetch pending bonuses
  const fetchBonuses = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/bonuses/pending');
      if (!response.ok) throw new Error('Failed to fetch bonus requests');

      const data = await response.json();
      setBonuses(data.pendingBonuses || []);

      // Calculate stats
      const totalPending = data.count || 0;
      const totalAmount = data.pendingBonuses
        ?.reduce((sum: number, item: BonusRequest) => sum + parseFloat(item.bonusDetails.requestedAmountGBP), 0) || 0;
      const avgRequest = totalPending > 0 ? totalAmount / totalPending : 0;

      setStats({
        totalPending,
        totalAmountGBP: totalAmount.toFixed(2),
        avgRequestGBP: avgRequest.toFixed(2),
      });
    } catch (error) {
      console.error('Error fetching bonuses:', error);
      toast({
        title: 'Error loading data',
        description: 'Failed to load bonus requests',
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
    fetchBonuses();

    // Initialize Pusher
    const PUSHER_KEY = '407cb06c423e6c032e9c';
    const PUSHER_CLUSTER = 'eu';
    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });

    const channel = pusher.subscribe('admin-notifications');
    
    channel.bind('bonus-request-created', (data: any) => {
      console.log('🔔 New bonus request:', data);
      toast({
        title: 'New bonus request',
        description: `Bonus request from driver ${data.driverId}`,
        status: 'info',
        duration: 10000,
        isClosable: true,
      });
      fetchBonuses();
    });

    channel.bind('bonus-decision', () => {
      fetchBonuses();
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [fetchBonuses, toast]);

  // Open decision modal
  const handleOpenDecisionModal = (bonus: BonusRequest, action: 'approved' | 'rejected') => {
    setModalData({
      bonusRequestId: bonus.bonusRequestId,
      driverName: bonus.driver.name,
      action,
      requestedAmount: parseFloat(bonus.bonusDetails.requestedAmountGBP),
    });
    setApprovedAmount(parseFloat(bonus.bonusDetails.requestedAmountGBP));
    setAdminNotes('');
    onDecisionOpen();
  };

  // Submit bonus decision
  const handleSubmitDecision = async () => {
    if (!modalData) return;

    setProcessingId(modalData.bonusRequestId);

    try {
      const response = await fetch(`/api/admin/bonuses/${modalData.bonusRequestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modalData.action,
          approved_amount_pence: modalData.action === 'approved' ? Math.round(approvedAmount * 100) : undefined,
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
            ? `Bonus of £${approvedAmount.toFixed(2)} approved for driver ${modalData.driverName}`
            : `Bonus request rejected for driver ${modalData.driverName}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onDecisionClose();
      fetchBonuses();
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

  // Create manual bonus
  const handleCreateBonus = async () => {
    try {
      const response = await fetch('/api/admin/bonuses/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driver_id: newBonus.driverId,
          assignment_id: newBonus.assignmentId,
          bonus_type: newBonus.bonusType,
          requested_amount_pence: newBonus.requestedAmountPence,
          reason: newBonus.reason,
          auto_approve: newBonus.autoApprove,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create bonus');
      }

      const result = await response.json();

      toast({
        title: 'Bonus created successfully',
        description: newBonus.autoApprove
          ? `Bonus of £${(newBonus.requestedAmountPence / 100).toFixed(2)} approved automatically`
          : 'Bonus request created and is awaiting approval',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onCreateClose();
      setNewBonus({
        driverId: '',
        assignmentId: '',
        bonusType: 'manual_admin_bonus',
        requestedAmountPence: 0,
        reason: '',
        autoApprove: false,
      });
      fetchBonuses();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create bonus',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getBonusTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      exceptional_service: 'Exceptional Service',
      manual_admin_bonus: 'Admin Bonus',
      referral_bonus: 'Referral Bonus',
      milestone_bonus: 'Milestone Bonus',
    };
    return types[type] || type;
  };

  const getBonusTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      exceptional_service: 'green',
      manual_admin_bonus: 'blue',
      referral_bonus: 'purple',
      milestone_bonus: 'orange',
    };
    return colors[type] || 'gray';
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading bonus requests...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Box>
            <Heading size="lg" mb={2}>
              Bonus Requests
            </Heading>
            <Text color="gray.600">Review and approve driver bonus requests</Text>
          </Box>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onCreateOpen}>
            Create Bonus
          </Button>
        </HStack>

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
                <StatLabel>Total Pending Bonuses</StatLabel>
                <StatNumber>£{stats.totalAmountGBP}</StatNumber>
                <StatHelpText>Sum of requests</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Average Bonus Request</StatLabel>
                <StatNumber>£{stats.avgRequestGBP}</StatNumber>
                <StatHelpText>Per request</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* No Bonuses */}
        {bonuses.length === 0 && (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <AlertTitle>No pending bonus requests</AlertTitle>
            <AlertDescription>All bonus requests have been processed!</AlertDescription>
          </Alert>
        )}

        {/* Bonuses List */}
        {bonuses.map((bonus) => (
          <Card key={bonus.bonusRequestId} variant="outline">
            <CardBody>
              <VStack spacing={4} align="stretch">
                {/* Header Row */}
                <HStack justify="space-between">
                  <HStack spacing={4}>
                    <Box>
                      <Text fontWeight="bold" fontSize="lg">
                        {bonus.driver.name}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {bonus.driver.email}
                      </Text>
                    </Box>
                    <Badge colorScheme={getBonusTypeColor(bonus.bonusDetails.type)} fontSize="sm">
                      {getBonusTypeLabel(bonus.bonusDetails.type)}
                    </Badge>
                  </HStack>

                  <HStack>
                    <Badge colorScheme="purple" fontSize="md" px={3} py={1}>
                      £{bonus.bonusDetails.requestedAmountGBP}
                    </Badge>
                    <IconButton
                      aria-label="Toggle details"
                      icon={expandedId === bonus.bonusRequestId ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedId(expandedId === bonus.bonusRequestId ? null : bonus.bonusRequestId)}
                    />
                  </HStack>
                </HStack>

                {/* Quick Info */}
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Box>
                    <Text fontSize="xs" color="gray.600">
                      Completed Jobs (30 days)
                    </Text>
                    <Text fontWeight="bold" fontSize="lg">
                      {bonus.driver.performance.completedJobs30d}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">
                      Total Earnings (30 days)
                    </Text>
                    <Text fontWeight="bold" fontSize="lg" color="green.500">
                      £{bonus.driver.performance.totalEarnings30dGBP}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.600">
                      Average Earnings
                    </Text>
                    <Text fontWeight="bold" fontSize="lg">
                      £{bonus.driver.performance.avgEarnings30dGBP}
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* Expanded Details */}
                <Collapse in={expandedId === bonus.bonusRequestId} animateOpacity>
                  <VStack spacing={3} align="stretch" pt={2}>
                    <Divider />
                    <Box>
                      <Text fontSize="sm" fontWeight="bold" mb={2}>
                        Bonus Request Reason:
                      </Text>
                      <Text fontSize="sm" color="gray.700" bg="gray.50" p={3} borderRadius="md">
                        {bonus.bonusDetails.reason}
                      </Text>
                    </Box>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                      <Box>
                        <Text fontSize="xs" color="gray.600">
                          Request Date
                        </Text>
                        <Text fontSize="sm">{new Date(bonus.bonusDetails.requestedAt).toLocaleString('ar-EG')}</Text>
                      </Box>
                      <Box>
                        <Text fontSize="xs" color="gray.600">
                          Requested By
                        </Text>
                        <Text fontSize="sm">
                          {bonus.bonusDetails.requestedBy === 'system_auto' ? 'Automatic System' : bonus.bonusDetails.requestedBy}
                        </Text>
                      </Box>
                    </SimpleGrid>
                  </VStack>
                </Collapse>

                {/* Action Buttons */}
                <HStack spacing={3} pt={2}>
                  <Button
                    colorScheme="green"
                    leftIcon={<CheckIcon />}
                    flex={1}
                    isDisabled={processingId === bonus.bonusRequestId}
                    onClick={() => handleOpenDecisionModal(bonus, 'approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    colorScheme="red"
                    leftIcon={<CloseIcon />}
                    flex={1}
                    isDisabled={processingId === bonus.bonusRequestId}
                    onClick={() => handleOpenDecisionModal(bonus, 'rejected')}
                  >
                    Reject
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </VStack>

      {/* Decision Modal */}
      <Modal isOpen={isDecisionOpen} onClose={onDecisionClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {modalData?.action === 'approved' ? 'Approve Bonus' : 'Reject Bonus'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold">Driver: {modalData?.driverName}</Text>
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
                    max={modalData?.requestedAmount || 0}
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
                    Requested amount: £{(modalData?.requestedAmount || 0).toFixed(2)}
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
                    The driver will be notified of the bonus rejection. It's recommended to add the reason for rejection in the notes.
                  </AlertDescription>
                </Alert>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDecisionClose}>
              Cancel
            </Button>
            <Button
              colorScheme={modalData?.action === 'approved' ? 'green' : 'red'}
              isLoading={processingId === modalData?.bonusRequestId}
              onClick={handleSubmitDecision}
            >
              {modalData?.action === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Create Bonus Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Bonus</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Driver ID</FormLabel>
                <Input
                  value={newBonus.driverId}
                  onChange={(e) => setNewBonus({ ...newBonus, driverId: e.target.value })}
                  placeholder="Enter driver ID"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Assignment ID (optional)</FormLabel>
                <Input
                  value={newBonus.assignmentId}
                  onChange={(e) => setNewBonus({ ...newBonus, assignmentId: e.target.value })}
                  placeholder="Enter assignment ID"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Bonus Type</FormLabel>
                <Select
                  value={newBonus.bonusType}
                  onChange={(e) => setNewBonus({ ...newBonus, bonusType: e.target.value })}
                >
                  <option value="manual_admin_bonus">Admin Bonus</option>
                  <option value="exceptional_service">Exceptional Service</option>
                  <option value="milestone_bonus">Milestone Bonus</option>
                  <option value="referral_bonus">Referral Bonus</option>
                </Select>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Amount (£)</FormLabel>
                <NumberInput
                  value={newBonus.requestedAmountPence / 100}
                  onChange={(_, valueAsNumber) =>
                    setNewBonus({ ...newBonus, requestedAmountPence: Math.round(valueAsNumber * 100) })
                  }
                  min={0}
                  step={0.01}
                  precision={2}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Reason</FormLabel>
                <Textarea
                  value={newBonus.reason}
                  onChange={(e) => setNewBonus({ ...newBonus, reason: e.target.value })}
                  placeholder="Explain the reason for granting this bonus..."
                  rows={3}
                />
              </FormControl>

              <FormControl>
                <HStack>
                  <input
                    type="checkbox"
                    checked={newBonus.autoApprove}
                    onChange={(e) => setNewBonus({ ...newBonus, autoApprove: e.target.checked })}
                  />
                  <FormLabel mb={0}>Auto-approve (bonus will be applied immediately)</FormLabel>
                </HStack>
              </FormControl>

              {!newBonus.autoApprove && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    The bonus request will be created and will appear in the pending requests list for approval later.
                  </AlertDescription>
                </Alert>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateBonus}
              isDisabled={
                !newBonus.driverId ||
                !newBonus.assignmentId ||
                !newBonus.reason ||
                newBonus.requestedAmountPence <= 0
              }
            >
              Create Bonus
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
}
