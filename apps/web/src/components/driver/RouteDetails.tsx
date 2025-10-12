'use client';

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Progress,
  Icon,
  Card,
  CardBody,
  Divider,
  useColorModeValue,
  Flex,
  Circle,
  Textarea,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Select,
  useToast,
  Alert,
  AlertIcon,
  Tooltip,
  Image
} from '@chakra-ui/react';
import {
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaTruck,
  FaExclamationTriangle,
  FaPhone,
  FaCamera,
  FaForward,
  FaRoute,
  FaInfoCircle,
  FaCompass
} from 'react-icons/fa';
import { Drop, Route } from './RouteCard';

interface RouteDetailsProps {
  route: Route;
  onUpdateDropStatus?: (dropId: string, status: Drop['status'], notes?: string) => void;
  onSkipDrop?: (dropId: string, reason: string) => void;
  onCompleteRoute?: (routeId: string) => void;
  isLoading?: boolean;
}

const FAILURE_REASONS = [
  'Customer not available',
  'Address not found',
  'Access denied (security)',
  'Incorrect address details',
  'Customer refused delivery',
  'Package damaged',
  'Other (see notes)'
];

export const RouteDetails: React.FC<RouteDetailsProps> = ({
  route,
  onUpdateDropStatus,
  onSkipDrop,
  onCompleteRoute,
  isLoading = false
}) => {
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const [failureReason, setFailureReason] = useState('');
  const [notes, setNotes] = useState('');
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  
  const { isOpen: isFailureModalOpen, onOpen: onFailureModalOpen, onClose: onFailureModalClose } = useDisclosure();
  const { isOpen: isSkipModalOpen, onOpen: onSkipModalOpen, onClose: onSkipModalClose } = useDisclosure();
  
  const toast = useToast();
  // Use Admin dashboard styling - dark theme with neon accents
  const cardBg = 'bg.card';
  const borderColor = 'border.primary';
  const textSecondary = 'text.secondary';
  const textPrimary = 'text.primary';

  const completedDrops = route.drops.filter(drop => drop.status === 'completed').length;
  const progressPercentage = (completedDrops / route.drops.length) * 100;
  const currentDrop = route.drops.find(drop => drop.status === 'in_progress') || 
                     route.drops.find(drop => drop.status === 'assigned');

  const getDropStatusColor = (status: Drop['status']) => {
    switch (status) {
      case 'completed': return 'green';
      case 'in_progress': return 'blue';
      case 'failed': return 'red';
      case 'assigned': return 'orange';
      default: return 'gray';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDropAction = (drop: Drop, action: 'start' | 'complete' | 'fail' | 'skip') => {
    switch (action) {
      case 'start':
        onUpdateDropStatus?.(drop.id, 'in_progress');
        break;
      case 'complete':
        onUpdateDropStatus?.(drop.id, 'completed', notes);
        setNotes('');
        break;
      case 'fail':
        setSelectedDrop(drop);
        onFailureModalOpen();
        break;
      case 'skip':
        setSelectedDrop(drop);
        onSkipModalOpen();
        break;
    }
  };

  const handleFailureSubmit = () => {
    if (!selectedDrop || !failureReason) {
      toast({
        title: 'Missing Information',
        description: 'Please select a failure reason',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    onUpdateDropStatus?.(selectedDrop.id, 'failed', `${failureReason}: ${notes}`);
    onFailureModalClose();
    setFailureReason('');
    setNotes('');
    setSelectedDrop(null);
  };

  const handleSkipSubmit = () => {
    if (!selectedDrop || !notes) {
      toast({
        title: 'Missing Information',
        description: 'Please provide a reason for skipping',
        status: 'warning',
        duration: 3000
      });
      return;
    }

    onSkipDrop?.(selectedDrop.id, notes);
    onSkipModalClose();
    setNotes('');
    setSelectedDrop(null);
  };

  const openNavigation = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    // Try Google Maps first, fallback to Apple Maps on iOS
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    
    if (isMobile) {
      if (isIOS) {
        window.open(`maps://maps.google.com/maps?q=${encodedAddress}`, '_blank');
      } else {
        window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
      }
    } else {
      window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Route Header */}
      <Card bg={cardBg}>
        <CardBody>
          <VStack spacing={4}>
            <HStack justify="space-between" w="full">
              <VStack align="start" spacing={1}>
                <HStack>
                  <Icon as={FaRoute} color="blue.500" />
                  <Text fontSize="xl" fontWeight="bold">
                    Route #{route.id.slice(-8)}
                  </Text>
                </HStack>
                <Text color={textSecondary}>
                  {route.drops.length} stops • {route.estimatedDistance} km • £{route.estimatedEarnings}
                </Text>
              </VStack>
              <Badge colorScheme="blue" size="lg" p={2}>
                {route.status.toUpperCase()}
              </Badge>
            </HStack>

            {/* Progress */}
            <Box w="full">
              <Flex justify="space-between" mb={2}>
                <Text fontWeight="medium">
                  Progress: {completedDrops}/{route.drops.length} completed
                </Text>
                <Text color={textSecondary}>
                  {progressPercentage.toFixed(0)}%
                </Text>
              </Flex>
              <Progress 
                value={progressPercentage} 
                colorScheme="green" 
                size="md" 
                borderRadius="full"
              />
            </Box>

            {/* Current Drop Alert */}
            {currentDrop && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <VStack align="start" spacing={1} flex={1}>
                  <Text fontWeight="medium">Current Stop:</Text>
                  <Text>{currentDrop.deliveryAddress}</Text>
                  <Text fontSize="sm" color={textSecondary}>
                    Window: {formatTime(currentDrop.timeWindowStart)} - {formatTime(currentDrop.timeWindowEnd)}
                  </Text>
                </VStack>
                <Button
                  size="sm"
                  leftIcon={<Icon as={FaCompass} />}
                  onClick={() => openNavigation(currentDrop.deliveryAddress)}
                >
                  Navigate
                </Button>
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>

      {/* Drops List */}
      <VStack spacing={3} align="stretch">
        <Text fontSize="lg" fontWeight="bold">Delivery Stops</Text>
        
        {route.drops.map((drop, index) => (
          <Card 
            key={drop.id} 
            bg={cardBg}
            borderLeft="4px solid"
            borderLeftColor={`${getDropStatusColor(drop.status)}.400`}
          >
            <CardBody>
              <VStack spacing={3} align="stretch">
                <HStack justify="space-between">
                  <HStack>
                    <Circle size="8" bg={`${getDropStatusColor(drop.status)}.100`}>
                      <Text fontSize="sm" fontWeight="bold" color={`${getDropStatusColor(drop.status)}.600`}>
                        {index + 1}
                      </Text>
                    </Circle>
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="medium">{drop.customerName}</Text>
                      <HStack>
                        <Icon as={FaMapMarkerAlt} color={textSecondary} size="sm" />
                        <Text fontSize="sm" color={textSecondary}>
                          {drop.deliveryAddress}
                        </Text>
                      </HStack>
                      <HStack spacing={3}>
                        <HStack>
                          <Icon as={FaClock} color={textSecondary} size="sm" />
                          <Text fontSize="sm" color={textSecondary}>
                            {formatTime(drop.timeWindowStart)} - {formatTime(drop.timeWindowEnd)}
                          </Text>
                        </HStack>
                        <Badge colorScheme={drop.serviceTier === 'premium' ? 'purple' : 'blue'}>
                          {drop.serviceTier}
                        </Badge>
                      </HStack>
                    </VStack>
                  </HStack>
                  
                  <Badge colorScheme={getDropStatusColor(drop.status)} variant="solid">
                    {drop.status.toUpperCase()}
                  </Badge>
                </HStack>

                {drop.specialInstructions && (
                  <HStack>
                    <Icon as={FaInfoCircle} color="blue.400" />
                    <Text fontSize="sm" fontStyle="italic">
                      {drop.specialInstructions}
                    </Text>
                  </HStack>
                )}

                {drop.estimatedArrival && (
                  <Text fontSize="sm" color="green.500" fontWeight="medium">
                    ETA: {formatTime(drop.estimatedArrival)}
                  </Text>
                )}

                <Divider />

                {/* Action Buttons */}
                <HStack spacing={2} justify="end">
                  <Button
                    size="sm"
                    leftIcon={<Icon as={FaCompass} />}
                    variant="outline"
                    onClick={() => openNavigation(drop.deliveryAddress)}
                  >
                    Navigate
                  </Button>

                  {drop.status === 'assigned' && (
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleDropAction(drop, 'start')}
                      isLoading={isLoading}
                    >
                      Start
                    </Button>
                  )}

                  {drop.status === 'in_progress' && (
                    <>
                      <Button
                        size="sm"
                        colorScheme="green"
                        leftIcon={<Icon as={FaCheckCircle} />}
                        onClick={() => handleDropAction(drop, 'complete')}
                        isLoading={isLoading}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="red"
                        variant="outline"
                        leftIcon={<Icon as={FaExclamationTriangle} />}
                        onClick={() => handleDropAction(drop, 'fail')}
                      >
                        Failed
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        leftIcon={<Icon as={FaForward} />}
                        onClick={() => handleDropAction(drop, 'skip')}
                      >
                        Skip
                      </Button>
                    </>
                  )}
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        ))}
      </VStack>

      {/* Complete Route Button */}
      {completedDrops === route.drops.length && route.status !== 'completed' && (
        <Button
          size="lg"
          colorScheme="green"
          onClick={() => onCompleteRoute?.(route.id)}
          isLoading={isLoading}
          loadingText="Completing Route..."
        >
          Complete Route
        </Button>
      )}

      {/* Failure Modal */}
      <Modal isOpen={isFailureModalOpen} onClose={onFailureModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Report Delivery Failure</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text mb={2} fontWeight="medium">Reason for failure:</Text>
                <Select
                  placeholder="Select a reason"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                >
                  {FAILURE_REASONS.map(reason => (
                    <option key={reason} value={reason}>{reason}</option>
                  ))}
                </Select>
              </Box>

              <Box>
                <Text mb={2} fontWeight="medium">Additional notes:</Text>
                <Textarea
                  placeholder="Provide additional details about the failure..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onFailureModalClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={handleFailureSubmit}>
              Submit Failure
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Skip Modal */}
      <Modal isOpen={isSkipModalOpen} onClose={onSkipModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Skip Delivery</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text color={textSecondary}>
                This will temporarily skip this delivery and continue with the next stop. 
                You can return to this delivery later.
              </Text>

              <Box>
                <Text mb={2} fontWeight="medium">Reason for skipping:</Text>
                <Textarea
                  placeholder="Why are you skipping this delivery? (e.g., customer not available, will return later)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onSkipModalClose}>
              Cancel
            </Button>
            <Button colorScheme="orange" onClick={handleSkipSubmit}>
              Skip for Now
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default RouteDetails;