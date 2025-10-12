'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  CardBody,
  Badge,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Divider,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  IconButton,
  Tooltip,
  Flex,
  Avatar,
  Tag,
  CircularProgress,
  CircularProgressLabel,
  Icon,
} from '@chakra-ui/react';
import {
  FiCheck,
  FiX,
  FiEye,
  FiMapPin,
  FiClock,
  FiTruck,
  FiDollarSign,
  FiNavigation,
  FiPhone,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
} from 'react-icons/fi';

interface RouteAssignment {
  id: string;
  routeId: string;
  driverId: string;
  assignedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  route: {
    id: string;
    totalDrops: number;
    estimatedDuration: number;
    totalDistance: number;
    totalValue: number;
    serviceTier: string;
    timeWindowStart: string;
    timeWindowEnd: string;
    drops: Array<{
      id: string;
      reference: string;
      pickupAddress: string;
      dropoffAddress: string;
      scheduledAt: string;
      totalAmount: number;
      itemsCount: number;
      priority: 'low' | 'medium' | 'high';
      booking?: {
        customerName: string;
        customerPhone: string;
      };
      User?: {
        name: string;
        email: string;
      };
    }>;
  };
}

interface RouteAssignmentNotificationProps {
  driverId: string;
  onResponse: (assignmentId: string, response: 'accept' | 'decline') => void;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: RouteAssignment | null;
  action: 'accept' | 'decline';
  onConfirm: () => void;
  isLoading: boolean;
}

export const RouteAssignmentNotification: React.FC<RouteAssignmentNotificationProps> = ({
  driverId,
  onResponse,
}) => {
  const [assignments, setAssignments] = useState<RouteAssignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<RouteAssignment | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<Record<string, number>>({});
  const [isResponding, setIsResponding] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    assignment: RouteAssignment | null;
    action: 'accept' | 'decline';
  }>({ isOpen: false, assignment: null, action: 'accept' });

  const { isOpen: isDetailsModalOpen, onOpen: onDetailsModalOpen, onClose: onDetailsModalClose } = useDisclosure();
  const toast = useToast();

  // Load pending assignments
  useEffect(() => {
    loadAssignments();
    
    // Set up real-time updates
    const interval = setInterval(loadAssignments, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [driverId]);

  // Update countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newTimeRemaining: Record<string, number> = {};
      
      assignments.forEach(assignment => {
        if (assignment.status === 'pending') {
          const remaining = Math.max(0, new Date(assignment.expiresAt).getTime() - now);
          newTimeRemaining[assignment.id] = remaining;
          
          // Auto-expire if time is up
          if (remaining === 0 && assignment.status === 'pending') {
            handleAutoExpire(assignment.id);
          }
        }
      });
      
      setTimeRemaining(newTimeRemaining);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [assignments]);

  const loadAssignments = useCallback(async () => {
    try {
      const response = await fetch(`/api/driver/assignments?driverId=${driverId}&status=pending`);
      const result = await response.json();
      
      if (result.success) {
        setAssignments(result.data.assignments || []);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  }, [driverId]);

  const handleConfirmResponse = useCallback(async () => {
    const { assignment, action } = confirmationModal;
    if (!assignment) return;

    try {
      setIsResponding(true);

      const apiResponse = await fetch(`/api/driver/assignments/${assignment.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: action }),
      });

      const result = await apiResponse.json();

      if (result.success) {
        toast({
          title: action === 'accept' ? 'Route Accepted' : 'Route Declined',
          description: action === 'accept'
            ? 'You have successfully accepted the route assignment'
            : 'Route assignment declined',
          status: action === 'accept' ? 'success' : 'info',
          duration: 5000,
          isClosable: true,
        });

        // Update local state
        setAssignments(prev => prev.map(a =>
          a.id === assignment.id
            ? { ...a, status: action === 'accept' ? 'accepted' : 'declined' }
            : a
        ));

        // Notify parent component
        onResponse(assignment.id, action);

        // Trigger schedule refresh if job was accepted
        if (action === 'accept') {
          // Dispatch custom event to refresh schedule
          window.dispatchEvent(new CustomEvent('jobAccepted', {
            detail: { assignmentId: assignment.id, assignment }
          }));
        }

        // Close modals
        onDetailsModalClose();
        setConfirmationModal({ isOpen: false, assignment: null, action: 'accept' });

      } else {
        throw new Error(result.error || 'Failed to respond to assignment');
      }

    } catch (error) {
      console.error('Error responding to assignment:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to respond to assignment',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsResponding(false);
    }
  }, [confirmationModal, onResponse, onDetailsModalClose, toast]);

  const openConfirmationModal = useCallback((assignment: RouteAssignment, action: 'accept' | 'decline') => {
    setConfirmationModal({ isOpen: true, assignment, action });
  }, []);

  const closeConfirmationModal = useCallback(() => {
    setConfirmationModal({ isOpen: false, assignment: null, action: 'accept' });
  }, []);

  const handleAutoExpire = useCallback(async (assignmentId: string) => {
    try {
      await fetch(`/api/driver/assignments/${assignmentId}/expire`, {
        method: 'POST',
      });
      
      setAssignments(prev => prev.map(assignment => 
        assignment.id === assignmentId 
          ? { ...assignment, status: 'expired' }
          : assignment
      ));
      
      toast({
        title: 'Assignment Expired',
        description: 'Route assignment expired due to no response',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      
    } catch (error) {
      console.error('Error expiring assignment:', error);
    }
  }, [toast]);

  const formatTimeRemaining = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'gray';
      default: return 'gray';
    }
  };

  const pendingAssignments = assignments.filter(a => a.status === 'pending');

  if (pendingAssignments.length === 0) {
    return null; // No notifications to show
  }

  return (
    <Box position="fixed" top={4} right={4} zIndex={1000} maxW="400px">
      <VStack spacing={3} align="stretch">
        {pendingAssignments.map((assignment) => {
          const remaining = timeRemaining[assignment.id] || 0;
          const totalTime = 5 * 60 * 1000; // 5 minutes in milliseconds
          const progressValue = ((totalTime - remaining) / totalTime) * 100;
          
          return (
            <Card
              key={assignment.id}
              bg="bg.card"
              border="1px solid"
              borderColor="border.primary"
              borderRadius="xl"
              boxShadow="md"
              overflow="hidden"
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-2px)', shadow: 'lg', borderColor: 'border.neon' }}
              _before={{
                content: '""',
                position: 'absolute',
                inset: 0,
                borderRadius: 'xl',
                padding: '1px',
                background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                pointerEvents: 'none',
              }}
            >
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {/* Header */}
                  <HStack justify="space-between" align="start">
                    <VStack align="start" spacing={1}>
                      <Badge bg="neon.500" color="dark.900" variant="solid">
                        New Route Assignment
                      </Badge>
                      <Text fontSize="sm" color="text.secondary">
                        Route {assignment.routeId.slice(-8)}
                      </Text>
                    </VStack>
                    <VStack align="center" spacing={1}>
                      <CircularProgress
                        value={progressValue}
                        size="50px"
                        color="error.500"
                        trackColor="bg.surface"
                      >
                        <CircularProgressLabel fontSize="xs" color="text.primary">
                          {formatTimeRemaining(remaining)}
                        </CircularProgressLabel>
                      </CircularProgress>
                      <Text fontSize="xs" color="text.secondary">
                        Time left
                      </Text>
                    </VStack>
                  </HStack>

                  {/* Route Summary */}
                  <SimpleGrid columns={2} spacing={3}>
                    <Stat size="sm">
                      <StatLabel fontSize="xs" color="text.secondary">Drops</StatLabel>
                      <StatNumber fontSize="md" color="text.primary">{assignment.route.totalDrops}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel fontSize="xs" color="text.secondary">Value</StatLabel>
                      <StatNumber fontSize="md" color="success.500">{formatCurrency(assignment.route.totalValue)}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel fontSize="xs" color="text.secondary">Duration</StatLabel>
                      <StatNumber fontSize="md" color="text.primary">{formatDuration(assignment.route.estimatedDuration)}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel fontSize="xs" color="text.secondary">Distance</StatLabel>
                      <StatNumber fontSize="md" color="text.primary">{assignment.route.totalDistance.toFixed(1)} mi</StatNumber>
                    </Stat>
                  </SimpleGrid>

                  {/* Time Window */}
                  <Box>
                    <Text fontSize="xs" color="text.secondary" mb={1}>Time Window</Text>
                    <HStack spacing={2}>
                      <Badge variant="outline" size="sm" borderColor="border.secondary" color="text.primary">
                        {new Date(assignment.route.timeWindowStart).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Badge>
                      <Text fontSize="xs" color="text.secondary">to</Text>
                      <Badge variant="outline" size="sm" borderColor="border.secondary" color="text.primary">
                        {new Date(assignment.route.timeWindowEnd).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Badge>
                    </HStack>
                  </Box>

                  {/* High Priority Drops Alert */}
                  {assignment.route.drops.some(drop => drop.priority === 'high') && (
                    <Alert status="warning" size="sm">
                      <AlertIcon />
                      <AlertDescription fontSize="xs">
                        Contains {assignment.route.drops.filter(d => d.priority === 'high').length} high priority drop(s)
                      </AlertDescription>
                    </Alert>
                  )}

                  <Divider />

                  {/* Action Buttons */}
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      colorScheme="brand"
                      leftIcon={<FiCheck />}
                      onClick={() => openConfirmationModal(assignment, 'accept')}
                      isLoading={isResponding}
                      flex={1}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="outline"
                      leftIcon={<FiX />}
                      onClick={() => openConfirmationModal(assignment, 'decline')}
                      isLoading={isResponding}
                      flex={1}
                    >
                      Decline
                    </Button>
                    <Tooltip label="View Details">
                      <IconButton
                        aria-label="View details"
                        icon={<FiEye />}
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          onDetailsModalOpen();
                        }}
                      />
                    </Tooltip>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          );
        })}
      </VStack>

      {/* Route Details Modal */}
      <Modal isOpen={isDetailsModalOpen} onClose={onDetailsModalClose} size="xl">
        <ModalOverlay bg="rgba(0,0,0,0.6)" backdropFilter="blur(4px)" />
        <ModalContent
          bg="bg.modal"
          border="1px solid"
          borderColor="border.primary"
          borderRadius="xl"
          _before={{
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'xl',
            padding: '1px',
            background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.3))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          }}
        >
          <ModalHeader color="text.primary">
            Route Assignment Details
            {selectedAssignment && (
              <Text fontSize="sm" fontWeight="normal" color="text.secondary">
                Route {selectedAssignment.routeId}
              </Text>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedAssignment && (
              <VStack spacing={6} align="stretch">
                {/* Time Remaining Alert */}
                <Alert status="info">
                  <AlertIcon />
                  <Box>
                    <AlertTitle>Response Required</AlertTitle>
                    <AlertDescription>
                      You have {formatTimeRemaining(timeRemaining[selectedAssignment.id] || 0)} to respond to this assignment.
                    </AlertDescription>
                  </Box>
                </Alert>

                {/* Route Overview */}
                <Card
                  bg="bg.card"
                  border="1px solid"
                  borderColor="border.primary"
                  borderRadius="xl"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'xl',
                    padding: '1px',
                    background: 'linear-gradient(135deg, rgba(0,194,255,0.2), rgba(0,209,143,0.2))',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    pointerEvents: 'none',
                  }}
                >
                  <CardBody>
                    <Heading size="sm" mb={3} color="text.primary">Route Overview</Heading>
                    <SimpleGrid columns={2} spacing={4}>
                      <Stat>
                        <StatLabel color="text.secondary">Total Drops</StatLabel>
                        <StatNumber color="text.primary">{selectedAssignment.route.totalDrops}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel color="text.secondary">Total Value</StatLabel>
                        <StatNumber color="success.500">{formatCurrency(selectedAssignment.route.totalValue)}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel color="text.secondary">Estimated Duration</StatLabel>
                        <StatNumber color="text.primary">{formatDuration(selectedAssignment.route.estimatedDuration)}</StatNumber>
                      </Stat>
                      <Stat>
                        <StatLabel color="text.secondary">Total Distance</StatLabel>
                        <StatNumber color="text.primary">{selectedAssignment.route.totalDistance.toFixed(1)} miles</StatNumber>
                      </Stat>
                    </SimpleGrid>
                  </CardBody>
                </Card>

                {/* Drops List */}
                <Card
                  bg="bg.card"
                  border="1px solid"
                  borderColor="border.primary"
                  borderRadius="xl"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'xl',
                    padding: '1px',
                    background: 'linear-gradient(135deg, rgba(0,194,255,0.2), rgba(0,209,143,0.2))',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                    pointerEvents: 'none',
                  }}
                >
                  <CardBody>
                    <Heading size="sm" mb={3} color="text.primary">Drops ({selectedAssignment.route.drops.length})</Heading>
                    <VStack spacing={3} align="stretch">
                      {selectedAssignment.route.drops.map((drop, index) => (
                        <Card key={drop.id} variant="outline" bg="bg.surface" borderColor="border.secondary">
                          <CardBody>
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={2} flex={1}>
                                <HStack>
                                  <Badge bg="neon.500" color="dark.900" variant="solid">
                                    Drop {index + 1}
                                  </Badge>
                                  <Badge bg={getPriorityColor(drop.priority)} color="white" size="sm">
                                    {drop.priority}
                                  </Badge>
                                  <Text fontSize="sm" fontFamily="mono" color="text.secondary">
                                    {drop.reference}
                                  </Text>
                                </HStack>
                                
                                <VStack align="start" spacing={1}>
                                  <HStack>
                                    <Text fontSize="sm" fontWeight="medium" color="text.primary">
                                      {drop.booking?.customerName || drop.User?.name || 'Unknown'}
                                    </Text>
                                    <Text fontSize="sm" color="text.secondary">
                                      ({drop.booking?.customerPhone || 'No phone'})
                                    </Text>
                                  </HStack>
                                  
                                  <VStack align="start" spacing={1}>
                                    <HStack>
                                      <FiMapPin size={12} color="#E5E5E5" />
                                      <Text fontSize="xs" color="text.secondary">
                                        Pickup: {drop.pickupAddress}
                                      </Text>
                                    </HStack>
                                    <HStack>
                                      <FiNavigation size={12} color="#E5E5E5" />
                                      <Text fontSize="xs" color="text.secondary">
                                        Dropoff: {drop.dropoffAddress}
                                      </Text>
                                    </HStack>
                                  </VStack>

                                  <HStack>
                                    <FiClock size={12} color="#E5E5E5" />
                                    <Text fontSize="xs" color="text.secondary">
                                      Scheduled: {new Date(drop.scheduledAt).toLocaleString('en-GB')}
                                    </Text>
                                  </HStack>
                                </VStack>
                              </VStack>
                              
                              <VStack align="end" spacing={1}>
                                <Text fontSize="sm" fontWeight="bold" color="success.500">
                                  {formatCurrency(drop.totalAmount)}
                                </Text>
                                <Text fontSize="xs" color="text.tertiary">
                                  {drop.itemsCount} item{drop.itemsCount !== 1 ? 's' : ''}
                                </Text>
                              </VStack>
                            </HStack>
                          </CardBody>
                        </Card>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button
                colorScheme="brand"
                leftIcon={<FiCheck />}
                onClick={() => selectedAssignment && openConfirmationModal(selectedAssignment, 'accept')}
                isLoading={isResponding}
              >
                Accept Route
              </Button>
              <Button
                colorScheme="red"
                variant="outline"
                leftIcon={<FiX />}
                onClick={() => selectedAssignment && openConfirmationModal(selectedAssignment, 'decline')}
                isLoading={isResponding}
              >
                Decline Route
              </Button>
              <Button variant="outline" onClick={onDetailsModalClose}>
                Close
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmation Modal */}
      <Modal isOpen={confirmationModal.isOpen} onClose={closeConfirmationModal} size="lg">
        <ModalOverlay bg="rgba(0,0,0,0.6)" backdropFilter="blur(4px)" />
        <ModalContent
          bg="bg.modal"
          border="1px solid"
          borderColor="border.primary"
          borderRadius="xl"
          _before={{
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'xl',
            padding: '1px',
            background: confirmationModal.action === 'accept'
              ? 'linear-gradient(135deg, rgba(0,209,143,0.3), rgba(0,194,255,0.3))'
              : 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(0,194,255,0.3))',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          }}
        >
          <ModalHeader color="text.primary">
            <HStack>
              <Icon
                as={confirmationModal.action === 'accept' ? FiCheck : FiX}
                color={confirmationModal.action === 'accept' ? 'brand.500' : 'error.500'}
                boxSize={6}
              />
              <Text>
                {confirmationModal.action === 'accept' ? 'Accept Route Assignment' : 'Decline Route Assignment'}
              </Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            {confirmationModal.assignment && (
              <VStack spacing={6} align="stretch">
                {/* Route Summary */}
                <Box>
                  <Text fontSize="lg" fontWeight="bold" color="text.primary" mb={3}>
                    Route Summary
                  </Text>
                  <SimpleGrid columns={2} spacing={4}>
                    <Stat size="sm">
                      <StatLabel color="text.secondary">Drops</StatLabel>
                      <StatNumber color="text.primary">{confirmationModal.assignment.route.totalDrops}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel color="text.secondary">Value</StatLabel>
                      <StatNumber color="success.500">{formatCurrency(confirmationModal.assignment.route.totalValue)}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel color="text.secondary">Duration</StatLabel>
                      <StatNumber color="text.primary">{formatDuration(confirmationModal.assignment.route.estimatedDuration)}</StatNumber>
                    </Stat>
                    <Stat size="sm">
                      <StatLabel color="text.secondary">Distance</StatLabel>
                      <StatNumber color="text.primary">{confirmationModal.assignment.route.totalDistance.toFixed(1)} mi</StatNumber>
                    </Stat>
                  </SimpleGrid>
                </Box>

                {/* Confirmation Message */}
                <Alert
                  status={confirmationModal.action === 'accept' ? 'success' : 'warning'}
                  borderRadius="lg"
                >
                  <AlertIcon />
                  <Box>
                    <AlertTitle>
                      {confirmationModal.action === 'accept'
                        ? 'Ready to accept this route?'
                        : 'Are you sure you want to decline?'}
                    </AlertTitle>
                    <AlertDescription>
                      {confirmationModal.action === 'accept'
                        ? 'By accepting this route, you commit to completing all drops within the specified time window.'
                        : 'Declining this route will make it available to other drivers. You can still accept other available routes.'}
                    </AlertDescription>
                  </Box>
                </Alert>

                {/* Key Information */}
                <Box>
                  <Text fontSize="sm" fontWeight="medium" color="text.secondary" mb={2}>
                    Time Window:
                  </Text>
                  <HStack spacing={2}>
                    <Badge variant="outline" borderColor="border.secondary" color="text.primary">
                      {new Date(confirmationModal.assignment.route.timeWindowStart).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Badge>
                    <Text fontSize="xs" color="text.secondary">to</Text>
                    <Badge variant="outline" borderColor="border.secondary" color="text.primary">
                      {new Date(confirmationModal.assignment.route.timeWindowEnd).toLocaleTimeString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Badge>
                  </HStack>
                </Box>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button
                colorScheme={confirmationModal.action === 'accept' ? 'brand' : 'red'}
                leftIcon={<Icon as={confirmationModal.action === 'accept' ? FiCheck : FiX} />}
                onClick={handleConfirmResponse}
                isLoading={isResponding}
              >
                {confirmationModal.action === 'accept' ? 'Accept Route' : 'Decline Route'}
              </Button>
              <Button variant="outline" onClick={closeConfirmationModal}>
                Cancel
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default RouteAssignmentNotification;
