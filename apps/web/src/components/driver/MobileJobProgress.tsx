import React, { useState, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Card,
  CardBody,
  CardHeader,
  Progress,
  Badge,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  useToast,
  Icon,
  Circle,
  Flex,
  Divider,
  ScaleFade,
  Collapse,
  IconButton,
} from '@chakra-ui/react';
import {
  FaCheckCircle,
  FaCircle,
  FaClock,
  FaMapMarkerAlt,
  FaBox,
  FaTruck,
  FaSignature,
  FaFlag,
  FaChevronRight,
  FaPlay,
  FaExpand,
  FaCompress,
} from 'react-icons/fa';

interface JobStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'pending';
  isOptional?: boolean;
  estimatedDuration?: string;
}

interface MobileJobProgressProps {
  currentStep: string;
  jobId: string;
  onStepUpdate: (step: string, notes?: string) => Promise<void>;
  isCompact?: boolean;
  showEstimates?: boolean;
}

const JOB_STEPS: Record<string, JobStep> = {
  navigate_to_pickup: {
    id: 'navigate_to_pickup',
    label: 'Navigate to Pickup',
    description: 'Drive to the pickup location',
    icon: FaTruck,
    status: 'pending',
    estimatedDuration: '15-30 min',
  },
  arrived_at_pickup: {
    id: 'arrived_at_pickup',
    label: 'Arrived at Pickup',
    description: 'You have reached the pickup location',
    icon: FaMapMarkerAlt,
    status: 'pending',
  },
  loading_started: {
    id: 'loading_started',
    label: 'Loading Started',
    description: 'Begin loading items into vehicle',
    icon: FaBox,
    status: 'pending',
    estimatedDuration: '10-20 min',
  },
  loading_completed: {
    id: 'loading_completed',
    label: 'Loading Complete',
    description: 'All items have been loaded',
    icon: FaCheckCircle,
    status: 'pending',
  },
  en_route_to_dropoff: {
    id: 'en_route_to_dropoff',
    label: 'En Route to Delivery',
    description: 'Drive to the delivery location',
    icon: FaTruck,
    status: 'pending',
    estimatedDuration: '20-45 min',
  },
  arrived_at_dropoff: {
    id: 'arrived_at_dropoff',
    label: 'Arrived at Delivery',
    description: 'You have reached the delivery location',
    icon: FaMapMarkerAlt,
    status: 'pending',
  },
  unloading_started: {
    id: 'unloading_started',
    label: 'Unloading Started',
    description: 'Begin unloading items',
    icon: FaBox,
    status: 'pending',
    estimatedDuration: '10-15 min',
  },
  unloading_completed: {
    id: 'unloading_completed',
    label: 'Unloading Complete',
    description: 'All items have been unloaded',
    icon: FaCheckCircle,
    status: 'pending',
  },
  customer_signature: {
    id: 'customer_signature',
    label: 'Customer Signature',
    description: 'Obtain customer confirmation',
    icon: FaSignature,
    status: 'pending',
    isOptional: true,
  },
  job_completed: {
    id: 'job_completed',
    label: 'Job Complete',
    description: 'Job has been completed successfully',
    icon: FaFlag,
    status: 'pending',
  },
};

const MobileJobProgress: React.FC<MobileJobProgressProps> = ({
  currentStep,
  jobId,
  onStepUpdate,
  isCompact = false,
  showEstimates = true,
}) => {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(!isCompact);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const completedColor = useColorModeValue('green.500', 'green.400');
  const currentColor = useColorModeValue('blue.500', 'blue.400');
  const pendingColor = useColorModeValue('gray.300', 'gray.600');

  // Get steps with status
  const getStepsWithStatus = useCallback(() => {
    const stepOrder = Object.keys(JOB_STEPS);
    const currentIndex = stepOrder.indexOf(currentStep);
    
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Progress calculation:', {
        currentStep,
        currentIndex,
        stepOrder,
        totalSteps: stepOrder.length
      });
    }
    
    return stepOrder.map((stepId, index) => ({
      ...JOB_STEPS[stepId],
      status: index <= currentIndex 
        ? (index === currentIndex ? 'current' as const : 'completed' as const)
        : 'pending' as const
    }));
  }, [currentStep]);

  const steps = getStepsWithStatus();
  const currentStepIndex = steps.findIndex(step => step.status === 'current');
  const completedStepsCount = steps.filter(step => step.status === 'completed').length;
  
  // Progress calculation: (completed + 0.5 for current) / total * 100
  const progressPercentage = currentStepIndex >= 0 
    ? ((completedStepsCount + 0.5) / steps.length) * 100 
    : (completedStepsCount / steps.length) * 100;

  // Debug logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Progress details:', {
      currentStepIndex,
      completedStepsCount,
      totalSteps: steps.length,
      progressPercentage: Math.round(progressPercentage),
      currentStep
    });
  }

  const handleStepClick = useCallback((step: JobStep) => {
    // If clicking on current step, advance to next step instead of staying on same step
    if (step.status === 'current') {
      const nextStepIndex = currentStepIndex + 1;
      if (nextStepIndex < steps.length) {
        const nextStep = steps[nextStepIndex];
        console.log('🔄 Advancing from current step to next:', { 
          current: step.id, 
          next: nextStep.id 
        });
        setSelectedStep(nextStep.id);
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
    // Allow clicking on next pending step
    else if (step.status === 'pending' && steps.findIndex(s => s.id === step.id) === currentStepIndex + 1) {
      setSelectedStep(step.id);
      onOpen();
    }
  }, [currentStepIndex, steps, onOpen, toast]);

  const handleStepUpdate = useCallback(async () => {
    if (!selectedStep) return;
    
    setIsUpdating(selectedStep);
    try {
      await onStepUpdate(selectedStep, notes);
      toast({
        title: 'Step Updated',
        description: `Successfully updated to: ${JOB_STEPS[selectedStep].label}`,
        status: 'success',
        duration: 3000,
      });
      setNotes('');
      onClose();
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: 'Failed to update job step',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsUpdating(null);
    }
  }, [selectedStep, notes, onStepUpdate, toast, onClose]);

  const getStepColor = (status: JobStep['status']) => {
    switch (status) {
      case 'completed': return completedColor;
      case 'current': return currentColor;
      case 'pending': return pendingColor;
    }
  };

  const getStepIcon = (step: JobStep) => {
    if (step.status === 'completed') return FaCheckCircle;
    if (step.status === 'current') return FaPlay;
    return step.icon;
  };

  return (
    <>
      <ScaleFade in={true} initialScale={0.95}>
        <Card borderRadius="2xl" boxShadow="xl" overflow="hidden" bg={bg} border="1px" borderColor={borderColor}>
          <CardHeader pb={2} px={4} pt={4}>
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={1} flex="1">
                <Text fontSize="lg" fontWeight="bold" color="blue.600">
                  Job Progress
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Step {currentStepIndex + 1} of {steps.length}
                </Text>
              </VStack>
              
              <VStack align="end" spacing={1}>
                <Text fontSize="2xl" fontWeight="bold" color={currentColor}>
                  {Math.round(progressPercentage)}%
                </Text>
                <IconButton
                  aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  icon={isExpanded ? <FaCompress /> : <FaExpand />}
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpanded(!isExpanded)}
                />
              </VStack>
            </HStack>
            
            <Box mt={3}>
              <Progress 
                value={progressPercentage} 
                colorScheme="blue" 
                size="lg" 
                borderRadius="full"
                bg="gray.100"
              />
            </Box>
          </CardHeader>

          <Collapse in={isExpanded} animateOpacity>
            <CardBody pt={2} px={4} pb={4}>
              <VStack spacing={3} align="stretch">
                {steps.map((step, index) => {
                  const isNextStep = step.status === 'pending' && index === currentStepIndex + 1;
                  const isClickable = step.status === 'current' || isNextStep;
                  
                  return (
                    <Box key={step.id}>
                      <HStack
                        spacing={3}
                        p={3}
                        borderRadius="xl"
                        cursor={isClickable ? 'pointer' : 'default'}
                        bg={step.status === 'current' ? 'blue.50' : 'transparent'}
                        _hover={isClickable ? { bg: 'gray.50' } : {}}
                        _active={isClickable ? { transform: 'scale(0.98)' } : {}}
                        onClick={() => isClickable && handleStepClick(step)}
                        transition="all 0.2s"
                      >
                        <Circle
                          size="40px"
                          bg={getStepColor(step.status)}
                          color="white"
                        >
                          <Icon as={getStepIcon(step)} boxSize="18px" />
                        </Circle>
                        
                        <VStack align="start" spacing={0} flex="1">
                          <HStack>
                            <Text 
                              fontSize="md" 
                              fontWeight={step.status === 'current' ? 'bold' : 'medium'}
                              color={step.status === 'pending' ? 'gray.500' : 'inherit'}
                            >
                              {step.label}
                            </Text>
                            {step.isOptional && (
                              <Badge size="sm" colorScheme="gray" variant="outline">
                                Optional
                              </Badge>
                            )}
                          </HStack>
                          
                          <Text 
                            fontSize="sm" 
                            color="gray.600"
                            noOfLines={1}
                          >
                            {step.description}
                          </Text>
                          
                          {showEstimates && step.estimatedDuration && (
                            <HStack spacing={1}>
                              <Icon as={FaClock} boxSize="12px" color="gray.400" />
                              <Text fontSize="xs" color="gray.400">
                                {step.estimatedDuration}
                              </Text>
                            </HStack>
                          )}
                        </VStack>
                        
                        {step.status === 'current' && (
                          <VStack align="end" spacing={1}>
                            <Badge colorScheme="blue" size="sm">
                              Tap to Complete
                            </Badge>
                            <Icon as={FaChevronRight} color="blue.400" />
                          </VStack>
                        )}
                        {isNextStep && (
                          <Icon as={FaChevronRight} color="gray.400" />
                        )}
                      </HStack>
                      
                      {index < steps.length - 1 && (
                        <Box ml="20px" pl="20px">
                          <Divider 
                            orientation="vertical" 
                            height="8px"
                            borderColor={index < currentStepIndex ? completedColor : pendingColor}
                            borderWidth="2px"
                          />
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </CardBody>
          </Collapse>
        </Card>
      </ScaleFade>

      {/* Step Update Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedStep && JOB_STEPS[selectedStep] ? 
              `Complete: ${JOB_STEPS[selectedStep].label}` : 
              'Update Job Step'
            }
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedStep && (
              <VStack spacing={6} align="stretch">
                <Card bg="blue.50" borderRadius="xl">
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <HStack>
                        <Circle size="50px" bg="blue.500" color="white">
                          <Icon as={JOB_STEPS[selectedStep].icon} boxSize="24px" />
                        </Circle>
                        <VStack align="start" spacing={1}>
                          <Text fontSize="lg" fontWeight="bold">
                            {JOB_STEPS[selectedStep].label}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {JOB_STEPS[selectedStep].description}
                          </Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>

                <FormControl>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes about this step..."
                    rows={4}
                    resize="vertical"
                  />
                </FormControl>
              </VStack>
            )}
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3} width="100%">
              <Button variant="ghost" onClick={onClose} flex="1">
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleStepUpdate}
                isLoading={isUpdating === selectedStep}
                loadingText="Updating..."
                flex="2"
                size="lg"
              >
                Update Step
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default MobileJobProgress;