import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  CardBody,
  Badge,
  Progress,
  Icon,
  Circle,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  FormControl,
  FormLabel,
  Spinner,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';
import {
  FaMapMarkerAlt,
  FaPlay,
  FaBox,
  FaCheck,
  FaTruck,
  FaFlag,
  FaSignature,
  FaExclamationTriangle,
  FaCamera,
  FaArrowRight,
} from 'react-icons/fa';

interface Drop {
  id: string;
  sequence: number;
  pickupAddress: string;
  dropoffAddress: string;
  customerName: string;
  customerPhone: string;
  items: Array<{ name: string; quantity: number; }>;
  status: 'pending' | 'loading' | 'en_route' | 'unloading' | 'completed';
}

interface Route {
  id: string;
  drops: Drop[];
  totalDrops: number;
}

interface JobStep {
  key: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  current: boolean;
  optional?: boolean;
  dropId?: string;
  dropSequence?: number;
}

interface JobProgressTrackerProps {
  jobId: string;
  route: Route;
  currentStep: string;
  completedSteps: string[];
  onStepComplete: (step: string, notes?: string, dropId?: string) => Promise<void>;
  onCustomerTrackingUpdate?: (dropId: string, status: string) => Promise<void>;
  loading?: boolean;
}

// Generate dynamic steps based on route drops
const generateJobSteps = (route: Route): JobStep[] => {
  const steps: JobStep[] = [];

  // Sort drops by sequence
  const sortedDrops = [...route.drops].sort((a, b) => a.sequence - b.sequence);

  sortedDrops.forEach((drop, index) => {
    const dropNumber = drop.sequence;

    // Navigate to pickup (only for first drop or when moving to next pickup)
    if (index === 0) {
      steps.push({
        key: `navigate_to_pickup_${drop.id}`,
        title: `Navigate to Pickup ${dropNumber}`,
        description: `Drive to pickup location for Drop ${dropNumber}`,
        icon: FaMapMarkerAlt,
        completed: false,
        current: false,
        dropId: drop.id,
        dropSequence: drop.sequence,
      });
    }

    // Arrive at pickup
    steps.push({
      key: `arrived_at_pickup_${drop.id}`,
      title: `Arrived at Pickup ${dropNumber}`,
      description: `Confirm arrival at pickup for Drop ${dropNumber}`,
      icon: FaFlag,
      completed: false,
      current: false,
      dropId: drop.id,
      dropSequence: drop.sequence,
    });

    // Loading steps
    steps.push({
      key: `loading_started_${drop.id}`,
      title: `Loading Started - Drop ${dropNumber}`,
      description: `Begin loading items for Drop ${dropNumber}`,
      icon: FaBox,
      completed: false,
      current: false,
      dropId: drop.id,
      dropSequence: drop.sequence,
    });

    // Optional item verification
    steps.push({
      key: `item_count_verification_${drop.id}`,
      title: `Verify Items - Drop ${dropNumber}`,
      description: `Count and verify items for Drop ${dropNumber}`,
      icon: FaCheck,
      completed: false,
      current: false,
      optional: true,
      dropId: drop.id,
      dropSequence: drop.sequence,
    });

    steps.push({
      key: `loading_completed_${drop.id}`,
      title: `Loading Complete - Drop ${dropNumber}`,
      description: `All items for Drop ${dropNumber} loaded and secured`,
      icon: FaBox,
      completed: false,
      current: false,
      dropId: drop.id,
      dropSequence: drop.sequence,
    });

    // Navigate to dropoff
    steps.push({
      key: `en_route_to_dropoff_${drop.id}`,
      title: `En Route to Dropoff ${dropNumber}`,
      description: `Travelling to delivery location for Drop ${dropNumber}`,
      icon: FaTruck,
      completed: false,
      current: false,
      dropId: drop.id,
      dropSequence: drop.sequence,
    });

    // Arrive at dropoff
    steps.push({
      key: `arrived_at_dropoff_${drop.id}`,
      title: `Arrived at Dropoff ${dropNumber}`,
      description: `Reached delivery location for Drop ${dropNumber}`,
      icon: FaFlag,
      completed: false,
      current: false,
      dropId: drop.id,
      dropSequence: drop.sequence,
    });

    // Unloading steps
    steps.push({
      key: `unloading_started_${drop.id}`,
      title: `Unloading Started - Drop ${dropNumber}`,
      description: `Begin unloading items for Drop ${dropNumber}`,
      icon: FaBox,
      completed: false,
      current: false,
      dropId: drop.id,
      dropSequence: drop.sequence,
    });

    steps.push({
      key: `unloading_completed_${drop.id}`,
      title: `Unloading Complete - Drop ${dropNumber}`,
      description: `All items for Drop ${dropNumber} delivered`,
      icon: FaBox,
      completed: false,
      current: false,
      dropId: drop.id,
      dropSequence: drop.sequence,
    });

    // Customer signature
    steps.push({
      key: `customer_signature_${drop.id}`,
      title: `Customer Signature - Drop ${dropNumber}`,
      description: `Get customer confirmation for Drop ${dropNumber}`,
      icon: FaSignature,
      completed: false,
      current: false,
      dropId: drop.id,
      dropSequence: drop.sequence,
    });

    // Optional damage notes
    steps.push({
      key: `damage_notes_${drop.id}`,
      title: `Damage Report - Drop ${dropNumber}`,
      description: `Report any damages for Drop ${dropNumber} (if applicable)`,
      icon: FaExclamationTriangle,
      completed: false,
      current: false,
      optional: true,
      dropId: drop.id,
      dropSequence: drop.sequence,
    });
  });

  // Final job completion step
  steps.push({
    key: 'job_completed',
    title: 'All Drops Complete',
    description: 'Mark entire multi-drop route as finished',
    icon: FaCheck,
    completed: false,
    current: false,
  });

  return steps;
};

export default function JobProgressTracker({
  jobId,
  route,
  currentStep,
  completedSteps,
  onStepComplete,
  onCustomerTrackingUpdate,
  loading = false,
}: JobProgressTrackerProps) {
  const [steps, setSteps] = useState<JobStep[]>([]);
  const [selectedStep, setSelectedStep] = useState<JobStep | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  useEffect(() => {
    // Generate dynamic steps based on route
    const generatedSteps = generateJobSteps(route);

    // Update steps based on props - mark all steps before current as completed
    const currentStepIndex = generatedSteps.findIndex(step => step.key === currentStep);

    const updatedSteps = generatedSteps.map((step, index) => ({
      ...step,
      completed: index < currentStepIndex || completedSteps.includes(step.key),
      current: step.key === currentStep,
    }));

    setSteps(updatedSteps);

    console.log('🔄 JobProgressTracker steps updated for multi-drop route:', {
      routeId: route.id,
      totalDrops: route.totalDrops,
      currentStep,
      currentStepIndex,
      totalSteps: updatedSteps.length,
      completedCount: updatedSteps.filter(s => s.completed).length
    });
  }, [currentStep, completedSteps, route]);

  const handleStepClick = (step: JobStep) => {
    if (step.completed) return;
    
    // Check if this is the current step or next step in sequence
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    const stepIndex = steps.findIndex(s => s.key === step.key);
    
    // If clicking on current step, advance to next step
    if (stepIndex === currentIndex) {
      const nextIndex = currentIndex + 1;
      if (nextIndex < steps.length) {
        const nextStep = steps[nextIndex];
        console.log('🔄 Desktop: Advancing from current step to next:', { 
          current: step.key, 
          next: nextStep.key 
        });
        setSelectedStep(nextStep);
        setNotes('');
        onOpen();
      } else {
        toast({
          title: 'Job Complete',
          description: 'All steps have been completed!',
          status: 'success',
          duration: 3000,
        });
      }
    } 
    // Allow clicking on next step
    else if (stepIndex === currentIndex + 1) {
      setSelectedStep(step);
      setNotes('');
      onOpen();
    } else {
      toast({
        title: 'Invalid Step',
        description: 'Please complete steps in order.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmitStep = async () => {
    if (!selectedStep) return;

    setIsSubmitting(true);
    try {
      // Complete the step
      await onStepComplete(selectedStep.key, notes, selectedStep.dropId);

      // Update customer tracking if this step affects a specific drop
      if (selectedStep.dropId && onCustomerTrackingUpdate) {
        let trackingStatus = 'pending';

        if (selectedStep.key.includes('arrived_at_pickup')) {
          trackingStatus = 'pickup_arrived';
        } else if (selectedStep.key.includes('loading_started')) {
          trackingStatus = 'loading';
        } else if (selectedStep.key.includes('en_route_to_dropoff')) {
          trackingStatus = 'en_route';
        } else if (selectedStep.key.includes('arrived_at_dropoff')) {
          trackingStatus = 'dropoff_arrived';
        } else if (selectedStep.key.includes('unloading_started')) {
          trackingStatus = 'unloading';
        } else if (selectedStep.key.includes('customer_signature')) {
          trackingStatus = 'delivered';
        }

        await onCustomerTrackingUpdate(selectedStep.dropId, trackingStatus);
      }

      toast({
        title: 'Step Completed',
        description: `${selectedStep.title} marked as complete.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update step. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepColor = (step: JobStep) => {
    if (step.completed) return 'success.500';
    if (step.current) return 'neon.500';
    return 'text.tertiary';
  };

  const getStepIcon = (step: JobStep) => {
    if (step.completed) return FaCheck;
    return step.icon;
  };

  const calculateProgress = () => {
    const totalSteps = steps.filter(s => !s.optional).length;
    const completedRequiredSteps = steps.filter(s => !s.optional && s.completed).length;
    return Math.round((completedRequiredSteps / totalSteps) * 100);
  };

  const getNextStep = () => {
    const currentIndex = steps.findIndex(s => s.current);
    return steps[currentIndex + 1];
  };

  const nextStep = getNextStep();

  return (
    <Card
      bg="bg.card"
      border="1px solid"
      borderColor="border.primary"
      borderRadius="xl"
      boxShadow="md"
      overflow="hidden"
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
      <CardBody p={6}>
        <VStack spacing={6} align="stretch">
          {/* Progress Header */}
          <Box>
            <HStack justify="space-between" mb={4}>
              <Text fontSize="xl" fontWeight="bold" color="text.primary">
                Multi-Drop Route Progress
              </Text>
              <Badge bg="neon.500" color="dark.900" size="lg" px={3} py={1} borderRadius="full">
                {calculateProgress()}% Complete
              </Badge>
            </HStack>
            <Progress
              value={calculateProgress()}
              size="lg"
              bg="bg.surface"
              borderRadius="full"
              sx={{
                '& > div': {
                  background: 'linear-gradient(135deg, #00C2FF, #00D18F)',
                }
              }}
            />
          </Box>

          {/* Next Action */}
          {nextStep && (
            <Card
              bg="bg.surface"
              border="1px solid"
              borderColor="border.secondary"
              borderRadius="lg"
            >
              <CardBody p={4}>
                <HStack spacing={4}>
                  <Circle size="40px" bg="neon.500" color="dark.900">
                    <Icon as={nextStep.icon} />
                  </Circle>
                  <VStack align="start" spacing={1} flex={1}>
                    <Text fontWeight="bold" color="text.primary">
                      Next: {nextStep.title}
                    </Text>
                    <Text fontSize="sm" color="text.secondary">
                      {nextStep.description}
                    </Text>
                    {nextStep.dropSequence && (
                      <Badge bg="brand.500" color="white" size="sm">
                        Drop {nextStep.dropSequence}
                      </Badge>
                    )}
                  </VStack>
                  <Button
                    colorScheme="brand"
                    size="md"
                    rightIcon={<FaArrowRight />}
                    onClick={() => handleStepClick(nextStep)}
                    isLoading={loading}
                    loadingText="Processing..."
                  >
                    Mark Complete
                  </Button>
                </HStack>
              </CardBody>
            </Card>
          )}

          {/* Steps List */}
          <VStack spacing={3} align="stretch">
            {steps.map((step, index) => (
              <HStack
                key={step.key}
                p={4}
                borderRadius="lg"
                border="1px solid"
                borderColor={step.completed ? 'success.300' : step.current ? 'neon.300' : 'border.secondary'}
                bg={step.current ? 'bg.surface' : 'transparent'}
                cursor={step.completed ? 'default' : 'pointer'}
                onClick={() => handleStepClick(step)}
                transition="all 0.2s"
                _hover={
                  !step.completed
                    ? {
                        borderColor: 'neon.500',
                        transform: 'translateY(-1px)',
                        shadow: 'md',
                      }
                    : {}
                }
              >
                <Circle size="40px" bg={getStepColor(step)} color={step.completed ? 'white' : 'dark.900'}>
                  {step.completed ? (
                    <Icon as={FaCheck} />
                  ) : (
                    <Icon as={step.icon} />
                  )}
                </Circle>

                <VStack align="start" spacing={1} flex={1}>
                  <HStack>
                    <Text
                      fontWeight="semibold"
                      color={step.completed ? 'success.600' : step.current ? 'text.primary' : 'text.secondary'}
                    >
                      {step.title}
                    </Text>
                    {step.optional && (
                      <Badge bg="bg.surface" color="text.secondary" size="sm">
                        Optional
                      </Badge>
                    )}
                    {step.current && (
                      <Badge bg="neon.500" color="dark.900" size="sm">
                        Current
                      </Badge>
                    )}
                  </HStack>
                  <Text fontSize="sm" color="text.secondary">
                    {step.description}
                  </Text>
                  {step.dropSequence && (
                    <Badge bg="brand.500" color="white" size="sm">
                      Drop {step.dropSequence}
                    </Badge>
                  )}
                </VStack>

                {step.completed && (
                  <Badge bg="success.500" color="white" size="lg">
                    ✓ Done
                  </Badge>
                )}
                
                {step.current && !step.completed && (
                  <Spinner size="sm" color="neon.500" />
                )}
              </HStack>
            ))}
          </VStack>

          {/* Completion Message */}
          {calculateProgress() === 100 && (
            <Card bg="green.50" border="2px solid" borderColor="green.200">
              <CardBody p={4} textAlign="center">
                <Icon as={FaCheck} boxSize={8} color="green.500" mb={2} />
                <Text fontWeight="bold" color="green.700" fontSize="lg">
                  🎉 Job Completed Successfully!
                </Text>
                <Text fontSize="sm" color="green.600" mt={1}>
                  Great work! The customer has been notified.
                </Text>
              </CardBody>
            </Card>
          )}
        </VStack>
      </CardBody>

      {/* Step Completion Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
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
            <HStack>
              <Icon as={selectedStep?.icon} color="neon.500" />
              <Text>Complete: {selectedStep?.title}</Text>
              {selectedStep?.dropSequence && (
                <Badge bg="brand.500" color="white" size="sm">
                  Drop {selectedStep.dropSequence}
                </Badge>
              )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text color="text.secondary">
                {selectedStep?.description}
              </Text>
              
              <FormControl>
                <FormLabel color="text.primary">Notes (Optional)</FormLabel>
                <Textarea
                  placeholder="Add any notes about this step..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleSubmitStep}
              isLoading={isSubmitting}
              loadingText="Updating..."
            >
              Mark Complete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}