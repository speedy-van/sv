'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Divider,
  Box,
  Grid,
  GridItem,
  Icon,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import {
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaBox,
  FaMoneyBillWave,
  FaTruck,
  FaBuilding,
  FaCheckCircle,
  FaExclamationTriangle,
} from 'react-icons/fa';

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  onJobAccepted?: () => void;
}

export function JobDetailsModal({
  isOpen,
  onClose,
  jobId,
  onJobAccepted
}: JobDetailsModalProps) {
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Load job details when modal opens
  useEffect(() => {
    if (isOpen && jobId) {
      loadJobDetails();
    }
  }, [isOpen, jobId]);

  const loadJobDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/driver/jobs/${jobId}/details`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load job details');
      }

      const data = await response.json();
      setJobDetails(data.data);

    } catch (error) {
      console.error('❌ Error loading job details:', error);
      setError(error instanceof Error ? error.message : 'Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptJob = async () => {
    try {
      setIsAccepting(true);
      
      const response = await fetch(`/api/driver/jobs/${jobId}/accept`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Job Accepted!',
          description: 'You have successfully accepted this job.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        onJobAccepted?.();
        onClose();
      } else {
        throw new Error(data.error || 'Failed to accept job');
      }
    } catch (error) {
      console.error('❌ Error accepting job:', error);
      toast({
        title: 'Failed to Accept Job',
        description: error instanceof Error ? error.message : 'Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const getPropertyTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'flat':
      case 'apartment':
        return FaBuilding;
      case 'house':
      case 'detached':
      case 'semi_detached':
      case 'terrace':
        return FaBuilding;
      default:
        return FaBuilding;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
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
          Job Details
          {jobDetails && (
            <Badge ml={3} bg="neon.500" color="dark.900">
              {jobDetails.reference}
            </Badge>
          )}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {isLoading && (
            <VStack spacing={4} py={8}>
              <Spinner size="lg" />
              <Text color="text.primary">Loading job details...</Text>
            </VStack>
          )}

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Text>{error}</Text>
            </Alert>
          )}

          {jobDetails && (
            <VStack spacing={6} align="stretch">
              {/* Job Status */}
              <Box>
                <HStack mb={2}>
                  <Icon as={FaCheckCircle} color="green.500" />
                  <Text fontWeight="bold" fontSize="lg">
                    Job Status: {jobDetails.status}
                  </Text>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  Scheduled for: {new Date(jobDetails.scheduledAt).toLocaleString()}
                </Text>
              </Box>

              <Divider />

              {/* Customer Information */}
              <Box>
                <Text fontWeight="bold" mb={3} color="text.primary">
                  👤 Customer Information
                </Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <HStack mb={2}>
                      <Icon as={FaUser} color="neon.500" />
                      <Text fontWeight="medium" color="text.secondary">Name</Text>
                    </HStack>
                    <Text fontSize="sm">{jobDetails.customerName}</Text>
                  </GridItem>
                  <GridItem>
                    <HStack mb={2}>
                      <Icon as={FaPhone} color="neon.500" />
                      <Text fontWeight="medium" color="text.secondary">Phone</Text>
                    </HStack>
                    <Text fontSize="sm">{jobDetails.customerPhone}</Text>
                  </GridItem>
                  <GridItem colSpan={2}>
                    <HStack mb={2}>
                      <Icon as={FaEnvelope} color="neon.500" />
                      <Text fontWeight="medium" color="text.secondary">Email</Text>
                    </HStack>
                    <Text fontSize="sm">{jobDetails.customerEmail}</Text>
                  </GridItem>
                </Grid>
              </Box>

              <Divider />

              {/* Addresses */}
              <Box>
                <Text fontWeight="bold" mb={3} color="text.primary">
                  📍 Addresses
                </Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <HStack mb={2}>
                      <Icon as={FaMapMarkerAlt} color="success.500" />
                      <Text fontWeight="medium" color="text.secondary">Pickup</Text>
                    </HStack>
                    <Text fontSize="sm">
                      {jobDetails.pickupAddress?.label || 'Address not available'}
                    </Text>
                  </GridItem>
                  <GridItem>
                    <HStack mb={2}>
                      <Icon as={FaMapMarkerAlt} color="error.500" />
                      <Text fontWeight="medium" color="text.secondary">Dropoff</Text>
                    </HStack>
                    <Text fontSize="sm">
                      {jobDetails.dropoffAddress?.label || 'Address not available'}
                    </Text>
                  </GridItem>
                </Grid>
              </Box>

              <Divider />

              {/* Items */}
              {jobDetails.items && jobDetails.items.length > 0 && (
                <Box>
                  <Text fontWeight="bold" mb={3} color="text.primary">
                    📦 Items to Move ({jobDetails.items.length})
                  </Text>
                  <List spacing={2} pl={4}>
                    {jobDetails.items.map((item: any) => (
                      <ListItem key={item.id}>
                        <ListIcon as={FaBox} color="info.500" />
                        <Text as="span" fontSize="sm">
                          {item.name} (x{item.quantity})
                          {item.volumeM3 > 0 && ` - ${item.volumeM3}m³`}
                        </Text>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              <Divider />

              {/* Property Details */}
              <Box>
                <Text fontWeight="bold" mb={3} color="text.primary">
                  🏠 Property Details
                </Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <HStack mb={2}>
                      <Icon as={getPropertyTypeIcon(jobDetails.pickupProperty?.propertyType)} color="warning.500" />
                      <Text fontWeight="medium" color="text.secondary">Pickup Property</Text>
                    </HStack>
                    <Text fontSize="sm">
                      {jobDetails.pickupProperty?.propertyType || 'Not specified'}
                    </Text>
                  </GridItem>
                  <GridItem>
                    <HStack mb={2}>
                      <Icon as={getPropertyTypeIcon(jobDetails.dropoffProperty?.propertyType)} color="warning.500" />
                      <Text fontWeight="medium" color="text.secondary">Dropoff Property</Text>
                    </HStack>
                    <Text fontSize="sm">
                      {jobDetails.dropoffProperty?.propertyType || 'Not specified'}
                    </Text>
                  </GridItem>
                </Grid>
              </Box>

              {/* Assignment Status */}
              {jobDetails.assignment && (
                <Box>
                  <Text fontWeight="bold" mb={3} color="text.primary">
                    📋 Assignment Status
                  </Text>
                  <VStack align="stretch" spacing={2}>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="text.secondary">Status:</Text>
                      <Badge bg="neon.500" color="dark.900">{jobDetails.assignment.status}</Badge>
                    </HStack>
                    {jobDetails.assignment.claimedAt && (
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="text.secondary">Claimed:</Text>
                        <Text fontSize="sm" color="text.primary">
                          {new Date(jobDetails.assignment.claimedAt).toLocaleString()}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>
              )}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {jobDetails && !jobDetails.assignment && (
              <Button
                colorScheme="brand"
                onClick={handleAcceptJob}
                isLoading={isAccepting}
                loadingText="Accepting..."
                leftIcon={<Icon as={FaCheckCircle} />}
              >
                Accept Job
              </Button>
            )}
            {jobDetails && jobDetails.assignment && (
              <>
                <Button
                  colorScheme="orange"
                  leftIcon={<Icon as={FaClock} />}
                  onClick={() => {
                    // Get next incomplete step
                    const nextStep = [
                      'navigate_to_pickup',
                      'arrived_at_pickup',
                      'loading_started',
                      'loading_completed',
                      'en_route_to_dropoff',
                      'arrived_at_dropoff',
                      'unloading_started',
                      'unloading_completed',
                      'job_completed',
                      'customer_signature',
                      'damage_notes',
                      'item_count_verification'
                    ].find(step => !jobDetails.assignment.events.some((event: any) => event.step === step));
                    
                    if (nextStep) {
                      // Update job step
                      fetch(`/api/driver/jobs/${jobId}/update-step`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ step: nextStep })
                      }).then(response => {
                        if (response.ok) {
                          loadJobDetails();
                          toast({
                            title: 'Step Updated',
                            description: 'Job progress has been updated',
                            status: 'success',
                            duration: 3000
                          });
                        }
                      });
                    }
                  }}
                >
                  Next Step
                </Button>
              </>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}