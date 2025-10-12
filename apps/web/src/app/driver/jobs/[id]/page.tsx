'use client';

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Heading, 
  Text, 
  Box, 
  VStack, 
  HStack, 
  Button, 
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertDescription,
  useBreakpointValue,
  Stack,
  Flex,
  SimpleGrid,
  Badge,
  Divider,
  Icon,
  Progress,
  AlertTitle,
  Card,
  CardBody,
  CardHeader,
  Tooltip,
  Link as ChakraLink,
  IconButton,
} from '@chakra-ui/react';
import {
  FaMapMarkerAlt,
  FaUser,
  FaPhone,
  FaClock,
  FaBox,
  FaTruck,
  FaMap,
  FaPhoneAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowLeft,
  FaDirections,
  FaCalendar,
  FaMoneyBillWave,
} from 'react-icons/fa';
import Link from 'next/link';
import { DriverShell } from '@/components/driver';
import JobProgressTracker from '@/components/driver/JobProgressTracker';
import MediaUploader from '@/components/driver/MediaUploader';
import MobileJobActions from '@/components/driver/MobileJobActions';
import MobileJobProgress from '@/components/driver/MobileJobProgress';
import SmartNotifications, { createProximityAlert, createStatusUpdateAlert } from '@/components/driver/SmartNotifications';
import useAutoStatusUpdates from '@/hooks/useAutoStatusUpdates';

interface JobDetails {
  id: string;
  reference: string;
  customer: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  time: string;
  from: string;
  to: string;
  distance: string;
  vehicleType: string;
  items: string;
  estimatedEarnings?: number;
  status: string;
  priority?: string;
  duration?: string;
  crew?: string;
  notes?: string;
  specialInstructions?: string;
  // Multi-drop enhancements
  type?: 'single-drop' | 'multi-drop';
  stops?: Array<{
    type: 'pickup' | 'dropoff';
    address: string;
    time: string;
    contact: string;
    phone: string;
    items: Array<{
      name: string;
      quantity: number;
      weight: number;
      volume: number;
      category: string;
    }>;
    capacityUsed: {
      weight: number;
      volume: number;
      items: number;
    };
  }>;
  vehicle?: {
    type: string;
    capacity: { maxWeight: number; maxVolume: number; maxItems: number };
    currentLoad: { weight: number; volume: number; items: number };
  };
  route?: {
    totalDistance: number;
    totalDuration: number;
    optimization: {
      efficiencyScore: number;
      recommendations: string[];
    };
  };
}

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('navigate_to_pickup');
  const [smartAlerts, setSmartAlerts] = useState<any[]>([]);
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Always call the hook with default values to maintain hooks order
  // This prevents "Hooks called in wrong order" error
  const autoStatusHook = useAutoStatusUpdates({
    jobId: params.id,
    currentStep: currentStep,
    driverId: jobDetails?.id || 'pending', // Safe fallback
    enableGeoTracking: !!jobDetails, // Only enable if job details are loaded
    enableProximityDetection: !!jobDetails,
    proximityRadius: 100, // 100 meters
    autoAdvanceSteps: false, // Manual control for now
    notificationEnabled: !!jobDetails,
  });

  // Load job details
  useEffect(() => {
    if (params.id) {
      loadJobDetails();
    }
  }, [params.id]);

  // Reload job details when page regains focus to ensure latest status
  useEffect(() => {
    const handleFocus = () => {
      if (params.id && jobDetails) {
        console.log('📍 Page refocused, reloading job details...');
        loadJobDetails();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [params.id, jobDetails]);

  const loadJobDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/driver/jobs/${params.id}/details`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load job details');
      }

      const data = await response.json();
      
      // Map the API response to the component's expected format
      const mappedJobDetails = {
        id: data.data.id,
        reference: data.data.reference,
        customer: data.data.customer?.name || 'Customer name not available',
        customerPhone: data.data.customer?.phone || 'Phone not available',
        customerEmail: data.data.customer?.email || 'Email not available',
        date: data.data.schedule?.scheduledAt ? new Date(data.data.schedule.scheduledAt).toLocaleDateString() : 'Date not available',
        time: data.data.schedule?.pickupTimeSlot || 'Time not available',
        from: data.data.addresses?.pickup?.line1 || 'Address not available',
        to: data.data.addresses?.dropoff?.line1 || 'Address not available',
        distance: data.data.logistics?.distance ? `${data.data.logistics.distance} miles` : 'Distance not available',
        vehicleType: data.data.logistics?.crewSize || 'Vehicle type not specified',
        items: data.data.items?.map((item: any) => `${item.name} (${item.quantity})`).join(', ') || 'Items not specified',
        estimatedEarnings: (() => {
          // Try multiple sources for earnings
          if (data.data.pricing?.estimatedEarnings && !isNaN(Number(data.data.pricing.estimatedEarnings))) {
            return Number(data.data.pricing.estimatedEarnings);
          }
          if (data.data.pricing?.total && !isNaN(Number(data.data.pricing.total))) {
            return Number(data.data.pricing.total) / 100; // Convert from pence to pounds
          }
          if (data.data.totalGBP && !isNaN(Number(data.data.totalGBP))) {
            return Number(data.data.totalGBP) / 100; // Convert from pence to pounds
          }
          return 0; // Fallback
        })(),
        status: data.data.status || 'UNKNOWN',
        priority: data.data.schedule?.urgency || 'normal',
        duration: data.data.schedule?.estimatedDuration ? `${data.data.schedule.estimatedDuration} minutes` : 'Duration not specified',
        crew: data.data.logistics?.crewSize || 'Crew not specified',
        notes: data.data.metadata?.notes || '',
        specialInstructions: data.data.metadata?.specialInstructions || '',
        // Multi-drop enhancements (mock data for now - will come from API)
        type: data.data.type || 'multi-drop',
        stops: data.data.stops || [
          {
            type: 'pickup',
            address: data.data.addresses?.pickup?.line1 || '123 High Street, London SW1A 1AA',
            time: data.data.schedule?.pickupTimeSlot || '14:00 - 16:00',
            contact: data.data.customer?.name || 'Jane Doe',
            phone: data.data.customer?.phone || '+44 7700 900456',
            items: data.data.items || [
              { name: 'Sofa', quantity: 1, weight: 80, volume: 2.5, category: 'Living Room' },
              { name: 'Dining Table', quantity: 1, weight: 70, volume: 2.0, category: 'Dining' }
            ],
            capacityUsed: { weight: 150, volume: 4.5, items: 2 }
          },
          {
            type: 'dropoff',
            address: data.data.addresses?.dropoff?.line1 || '456 Oxford Street, London W1C 1AP',
            time: '16:00 - 18:00',
            contact: 'Bob Wilson',
            phone: '+44 7700 900789',
            items: [
              { name: 'Sofa', quantity: 1, weight: 80, volume: 2.5, category: 'Living Room' }
            ],
            capacityUsed: { weight: 80, volume: 2.5, items: 1 }
          },
          {
            type: 'dropoff',
            address: '789 Park Lane, London W1K 7AA',
            time: '18:00 - 19:00',
            contact: 'Alice Brown',
            phone: '+44 7700 900111',
            items: [
              { name: 'Dining Table', quantity: 1, weight: 70, volume: 2.0, category: 'Dining' }
            ],
            capacityUsed: { weight: 70, volume: 2.0, items: 1 }
          }
        ],
        vehicle: data.data.vehicle || {
          type: 'Luton Van',
          capacity: { maxWeight: 3500, maxVolume: 14.5, maxItems: 150 },
          currentLoad: { weight: 300, volume: 8.5, items: 4 }
        },
        route: data.data.route || {
          totalDistance: 24.5,
          totalDuration: 185,
          optimization: {
            efficiencyScore: 92,
            recommendations: ['Route optimized for LIFO unloading efficiency']
          }
        }
      };
      
      setJobDetails(mappedJobDetails);
      
      // Set current step from assignment or default
      if (data.data.assignment && data.data.assignment.currentStep) {
        setCurrentStep(data.data.assignment.currentStep);
        console.log('✅ Current step set from assignment:', data.data.assignment.currentStep);
      } else if (data.data.assignment && data.data.assignment.events && data.data.assignment.events.length > 0) {
        const latestEvent = data.data.assignment.events[data.data.assignment.events.length - 1];
        setCurrentStep(latestEvent.step || 'navigate_to_pickup');
        console.log('✅ Current step set from latest event:', latestEvent.step);
      } else {
        setCurrentStep('navigate_to_pickup');
        console.log('✅ Current step set to default: navigate_to_pickup');
      }
      
      console.log('✅ Job details loaded:', data.data);

    } catch (error) {
      console.error('Driver Job Details Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load job details';
      setError(errorMessage);
      
      toast({
        title: 'Error Loading Job',
        description: `Failed to load job details: ${errorMessage}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptJob = async () => {
    try {
      setIsAccepting(true);
      const response = await fetch(`/api/driver/jobs/${params.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        toast({
          title: 'Job Accepted!',
          description: 'You have successfully accepted this job.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          window.location.href = '/driver';
        }, 1500);
      } else {
        throw new Error('Failed to accept job');
      }
    } catch (error) {
      console.error('Driver Accept Job Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept job';
      toast({
        title: 'Job Acceptance Failed',
        description: `Failed to accept job: ${errorMessage}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleCallCustomer = () => {
    try {
      if (jobDetails?.customerPhone) {
        window.open(`tel:${jobDetails.customerPhone}`, '_self');
      } else {
        toast({
          title: 'No Phone Number',
          description: 'Customer phone number is not available.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Driver Call Customer Error:', error);
      toast({
        title: 'Call Failed',
        description: 'Failed to initiate call. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleOpenMap = (address: string) => {
    try {
      if (!address || address.trim() === '') {
        toast({
          title: 'No Address',
          description: 'Address is not available.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
    } catch (error) {
      console.error('Driver Open Map Error:', error);
      toast({
        title: 'Map Failed',
        description: 'Failed to open map. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleGetDirections = (from: string, to: string) => {
    try {
      if (!from || from.trim() === '' || !to || to.trim() === '') {
        toast({
          title: 'Missing Addresses',
          description: 'Pickup or dropoff address is not available.',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      const encodedFrom = encodeURIComponent(from);
      const encodedTo = encodeURIComponent(to);
      window.open(`https://maps.google.com/maps/dir/${encodedFrom}/${encodedTo}`, '_blank');
    } catch (error) {
      console.error('Driver Get Directions Error:', error);
      toast({
        title: 'Directions Failed',
        description: 'Failed to get directions. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleStepUpdate = async (step: string, notes?: string) => {
    try {
      console.log('🔄 Updating job step:', { jobId: params.id, step, notes });
      
      const response = await fetch(`/api/driver/jobs/${params.id}/update-step`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ step, notes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Step update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update step');
      }

      const result = await response.json();
      console.log('✅ Step update successful:', { step, result });
      
      // Update local state immediately
      setCurrentStep(step);
      
      // Reload job details to ensure we have the latest data
      await loadJobDetails();
      
      // Add smart notification
      const alert = createStatusUpdateAlert(step, false);
      setSmartAlerts(prev => [alert, ...prev.slice(0, 4)]); // Keep last 5 alerts

      // Show success toast
      toast({
        title: 'Step Updated',
        description: `Successfully updated to: ${step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        status: 'success',
        duration: 3000,
      });

      return result;
    } catch (error) {
      console.error('❌ Step update error:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update job step. Please try again.',
        status: 'error',
        duration: 5000,
      });
      throw error;
    }
  };

  const handleCustomerTrackingUpdate = async (dropId: string, status: string) => {
    try {
      console.log('📍 Updating customer tracking:', { jobId: params.id, dropId, status });

      const response = await fetch(`/api/driver/jobs/${params.id}/tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dropId, status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Customer tracking update failed:', errorData);
        throw new Error(errorData.error || 'Failed to update customer tracking');
      }

      const result = await response.json();
      console.log('✅ Customer tracking update successful:', { dropId, status, result });

      // Refresh job details to get updated tracking information
      await loadJobDetails();

    } catch (error) {
      console.error('❌ Customer tracking update error:', error);
      toast({
        title: 'Tracking Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update customer tracking',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleNotificationAction = (alertId: string, action: string) => {
    console.log('Notification action:', { alertId, action });
    
    // Remove the alert after action
    setSmartAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleDismissNotification = (alertId: string) => {
    setSmartAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  if (isLoading) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Container maxW="7xl" py={{ base: 6, md: 8 }}>
          <VStack spacing={{ base: 6, md: 8 }} align="center">
            <Spinner size="xl" color="blue.500" />
            <Text fontSize={{ base: "md", md: "lg" }}>Loading job details...</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Container maxW="7xl" py={{ base: 6, md: 8 }}>
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <Box>
              <AlertDescription fontSize={{ base: "sm", md: "md" }}>{error}</AlertDescription>
              <Button mt={3} size={{ base: "sm", md: "md" }} onClick={loadJobDetails}>
                Try Again
              </Button>
            </Box>
          </Alert>
        </Container>
      </Box>
    );
  }

  if (!jobDetails) {
    return (
      <Box minH="100vh" bg="gray.50">
        <Container maxW="7xl" py={{ base: 6, md: 8 }}>
          <Alert status="warning" borderRadius="lg">
            <AlertIcon />
            <AlertDescription fontSize={{ base: "sm", md: "md" }}>Job details not found.</AlertDescription>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <DriverShell
      title={`Job ${jobDetails?.reference || 'Details'}`}
      subtitle={`Status: ${jobDetails?.status?.toUpperCase() || 'Loading...'}`}
      actions={
        <HStack spacing={2}>
          <Text fontSize="sm" color="text.secondary">
            Last updated: {new Date().toLocaleTimeString()}
          </Text>
          <Tooltip label="Back to jobs list">
            <Link href="/driver/jobs">
              <IconButton
                size="sm"
                variant="outline"
                icon={<FaArrowLeft />}
                aria-label="Back to jobs"
              />
            </Link>
          </Tooltip>
        </HStack>
      }
    >
      <VStack spacing={{ base: 6, md: 8 }} align="stretch">

          {/* Job Header */}
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
              background: 'linear-gradient(135deg, rgba(0,194,255,0.2), rgba(0,209,143,0.2))',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
            }}
          >
            <CardHeader bg="bg.surface" borderBottom="1px solid" borderColor="border.primary" p={{ base: 4, md: 6 }}>
              <Flex 
                justify="space-between" 
                align={{ base: "start", md: "center" }} 
                direction={{ base: "column", md: "row" }}
                gap={4}
              >
                <VStack align="start" spacing={2} flex="1">
                  <Heading size={{ base: "md", md: "lg" }} color="text.primary" noOfLines={2}>
                    {jobDetails.reference || 'Job Reference Not Available'}
                  </Heading>
                  <HStack spacing={2} wrap="wrap">
                    <Badge colorScheme="blue" size={{ base: "md", md: "lg" }} px={3} py={1}>
                      {jobDetails.status?.toUpperCase() || 'UNKNOWN'}
                    </Badge>
                    {jobDetails.priority && (
                      <Badge 
                        colorScheme={jobDetails.priority === 'urgent' ? 'red' : jobDetails.priority === 'high' ? 'orange' : 'green'} 
                        size={{ base: "md", md: "lg" }} 
                        px={3} 
                        py={1}
                      >
                        {jobDetails.priority?.toUpperCase() || 'NORMAL'}
                      </Badge>
                    )}
                  </HStack>
                </VStack>
                <VStack align={{ base: "start", md: "end" }} spacing={1}>
                  <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="brand.500">
                    £{isNaN(Number(jobDetails.estimatedEarnings)) ? '0.00' : Number(jobDetails.estimatedEarnings).toFixed(2)}
                  </Text>
                  <Text fontSize="sm" color="text.secondary">
                    Estimated Earnings
                  </Text>
                </VStack>
              </Flex>
            </CardHeader>
            <CardBody p={6}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {/* Customer Information */}
                <Box>
                  <Heading size="md" mb={4} color="blue.600" display="flex" alignItems="center" gap={2}>
                    <Icon as={FaUser} />
                    Customer Information
                  </Heading>
                  <VStack align="stretch" spacing={3}>
                    <HStack>
                      <Icon as={FaUser} color="blue.500" boxSize={4} />
                      <Text fontWeight="medium">{jobDetails.customer || 'Customer name not available'}</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaPhone} color="blue.500" boxSize={4} />
                      <Text>{jobDetails.customerPhone || 'Phone not available'}</Text>
                      <Tooltip label="Call Customer">
                        <IconButton
                          aria-label="Call customer"
                          icon={<FaPhoneAlt />}
                          size="sm"
                          colorScheme="blue"
                          variant="ghost"
                          onClick={handleCallCustomer}
                        />
                      </Tooltip>
                    </HStack>
                    <HStack>
                      <Icon as={FaUser} color="blue.500" boxSize={4} />
                      <Text fontSize="sm" color="gray.600">{jobDetails.customerEmail || 'Email not available'}</Text>
                    </HStack>
                  </VStack>
                </Box>

                {/* Job Schedule */}
                <Box>
                  <Heading size="md" mb={4} color="purple.600" display="flex" alignItems="center" gap={2}>
                    <Icon as={FaCalendar} />
                    Schedule
                  </Heading>
                  <VStack align="stretch" spacing={3}>
                    <HStack>
                      <Icon as={FaClock} color="purple.500" boxSize={4} />
                      <Text>{jobDetails.date || 'Date not available'} at {jobDetails.time || 'Time not available'}</Text>
                    </HStack>
                    {jobDetails.duration && (
                      <HStack>
                        <Icon as={FaClock} color="purple.500" boxSize={4} />
                        <Text>Duration: {jobDetails.duration || 'Not specified'}</Text>
                      </HStack>
                    )}
                    {jobDetails.crew && (
                      <HStack>
                        <Icon as={FaUser} color="purple.500" boxSize={4} />
                        <Text>Crew: {jobDetails.crew || 'Not specified'}</Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Locations */}
          {!isMobile && (
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              {/* Pickup Location */}
              <Card borderRadius="xl" boxShadow="lg" overflow="hidden">
                <CardHeader bg="green.50" borderBottom="1px solid" borderColor="green.100">
                  <Heading size="md" color="green.600" display="flex" alignItems="center" gap={2}>
                    <Icon as={FaMapMarkerAlt} />
                    Pickup Location
                  </Heading>
                </CardHeader>
                <CardBody p={6}>
                <VStack align="stretch" spacing={4}>
                  <Text fontWeight="medium" fontSize="lg">
                    {jobDetails.from || 'Address not available'}
                  </Text>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      colorScheme="green"
                      leftIcon={<FaMap />}
                      onClick={() => handleOpenMap(jobDetails.from)}
                    >
                      View on Map
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="green"
                      leftIcon={<FaDirections />}
                      onClick={() => handleGetDirections("Current Location", jobDetails.from)}
                    >
                      Get Directions
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>

            {/* Dropoff Location */}
            <Card borderRadius="xl" boxShadow="lg" overflow="hidden">
              <CardHeader bg="red.50" borderBottom="1px solid" borderColor="red.100">
                <Heading size="md" color="red.600" display="flex" alignItems="center" gap={2}>
                  <Icon as={FaMapMarkerAlt} />
                  Dropoff Location
                </Heading>
              </CardHeader>
              <CardBody p={6}>
                <VStack align="stretch" spacing={4}>
                  <Text fontWeight="medium" fontSize="lg">
                    {jobDetails.to || 'Address not available'}
                  </Text>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      colorScheme="red"
                      leftIcon={<FaMap />}
                      onClick={() => handleOpenMap(jobDetails.to)}
                    >
                      View on Map
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      colorScheme="red"
                      leftIcon={<FaDirections />}
                      onClick={() => handleGetDirections(jobDetails.from, jobDetails.to)}
                    >
                      Get Directions
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
            </SimpleGrid>
          )}

          {/* Job Details */}
          <Card borderRadius="xl" boxShadow="lg" overflow="hidden">
            <CardHeader bg="purple.50" borderBottom="1px solid" borderColor="purple.100">
              <Heading size="md" color="purple.600" display="flex" alignItems="center" gap={2}>
                <Icon as={FaTruck} />
                Job Details
              </Heading>
            </CardHeader>
            <CardBody p={6}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                <VStack align="stretch" spacing={4}>
                  <HStack>
                    <Icon as={FaTruck} color="purple.500" boxSize={4} />
                    <Text>Vehicle: {jobDetails.vehicleType || 'Not specified'}</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaBox} color="purple.500" boxSize={4} />
                    <Text>Items: {jobDetails.items || 'Not specified'}</Text>
                  </HStack>
                  <HStack>
                    <Icon as={FaMapMarkerAlt} color="purple.500" boxSize={4} />
                    <Text>Distance: {jobDetails.distance || 'Not specified'}</Text>
                  </HStack>
                </VStack>
                <VStack align="stretch" spacing={4}>
                  {jobDetails.notes && (
                    <Box>
                      <Text fontWeight="medium" mb={2}>Notes:</Text>
                      <Text fontSize="sm" color="gray.600">{jobDetails.notes || 'No notes available'}</Text>
                    </Box>
                  )}
                  {jobDetails.specialInstructions && (
                    <Box>
                      <Text fontWeight="medium" mb={2}>Special Instructions:</Text>
                      <Text fontSize="sm" color="gray.600">{jobDetails.specialInstructions || 'No special instructions'}</Text>
                    </Box>
                  )}
                </VStack>
              </SimpleGrid>
            </CardBody>
          </Card>

          {/* Smart Notifications */}
          {smartAlerts.length > 0 && (
            <SmartNotifications
              alerts={smartAlerts}
              onActionClick={handleNotificationAction}
              onDismiss={handleDismissNotification}
              maxVisible={3}
              compactMode={isMobile}
            />
          )}

          {/* Mobile Job Progress Tracker */}
          {isMobile && (
            <MobileJobProgress
              currentStep={currentStep}
              jobId={params.id}
              onStepUpdate={handleStepUpdate}
              isCompact={false}
              showEstimates={true}
            />
          )}
          
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <Card bg="gray.50" borderRadius="md" p={3}>
              <Text fontSize="sm" color="gray.600">
                Debug: Current Step = <strong>{currentStep}</strong> | Job Status = <strong>{jobDetails?.status}</strong>
              </Text>
            </Card>
          )}

          {/* Multi-Drop Route Summary */}
          {jobDetails.type === 'multi-drop' && jobDetails.stops && jobDetails.stops.length > 1 && (
            <Card borderRadius="xl" boxShadow="lg" overflow="hidden">
              <CardHeader bg="purple.50" borderBottom="1px solid" borderColor="purple.100">
                <Flex justify="space-between" align="center">
                  <Heading size="md" color="purple.800">📍 Multi-Stop Route Summary</Heading>
                  <Badge colorScheme="purple" variant="subtle">
                    {jobDetails.stops.length} stops
                  </Badge>
                </Flex>
              </CardHeader>
              <CardBody>
                <VStack spacing={4} align="stretch">
                  {/* Route Overview */}
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                    <Box textAlign="center" p={3} bg="blue.50" borderRadius="lg">
                      <Icon as={FaMapMarkerAlt} boxSize={6} color="blue.500" mb={2} />
                      <Text fontSize="2xl" fontWeight="bold" color="blue.700">
                        {jobDetails.route?.totalDistance.toFixed(1) || '24.5'} km
                      </Text>
                      <Text fontSize="sm" color="blue.600">Total Distance</Text>
                    </Box>
                    <Box textAlign="center" p={3} bg="green.50" borderRadius="lg">
                      <Icon as={FaClock} boxSize={6} color="green.500" mb={2} />
                      <Text fontSize="2xl" fontWeight="bold" color="green.700">
                        {jobDetails.route ? Math.round(jobDetails.route.totalDuration / 60) : 3}h
                      </Text>
                      <Text fontSize="sm" color="green.600">Estimated Duration</Text>
                    </Box>
                    <Box textAlign="center" p={3} bg="orange.50" borderRadius="lg">
                      <Icon as={FaTruck} boxSize={6} color="orange.500" mb={2} />
                      <Text fontSize="2xl" fontWeight="bold" color="orange.700">
                        {jobDetails.vehicle?.currentLoad.items || 4}
                      </Text>
                      <Text fontSize="sm" color="orange.600">Items Loaded</Text>
                    </Box>
                  </SimpleGrid>

                  {/* Capacity Utilization */}
                  <Box>
                    <Text fontWeight="semibold" mb={3}>Vehicle Capacity</Text>
                    <VStack spacing={3}>
                      <Flex justify="space-between" align="center" w="full">
                        <Text fontSize="sm">Weight:</Text>
                        <HStack spacing={2}>
                          <Text fontSize="sm">
                            {jobDetails.vehicle?.currentLoad.weight || 300}kg /
                            {jobDetails.vehicle?.capacity.maxWeight || 3500}kg
                          </Text>
                          <Progress
                            value={((jobDetails.vehicle?.currentLoad.weight || 300) / (jobDetails.vehicle?.capacity.maxWeight || 3500)) * 100}
                            size="sm"
                            colorScheme="blue"
                            w="60px"
                          />
                        </HStack>
                      </Flex>
                      <Flex justify="space-between" align="center" w="full">
                        <Text fontSize="sm">Volume:</Text>
                        <HStack spacing={2}>
                          <Text fontSize="sm">
                            {jobDetails.vehicle?.currentLoad.volume || 8.5}m³ /
                            {jobDetails.vehicle?.capacity.maxVolume || 14.5}m³
                          </Text>
                          <Progress
                            value={((jobDetails.vehicle?.currentLoad.volume || 8.5) / (jobDetails.vehicle?.capacity.maxVolume || 14.5)) * 100}
                            size="sm"
                            colorScheme="green"
                            w="60px"
                          />
                        </HStack>
                      </Flex>
                    </VStack>
                  </Box>

                  {/* Stop-by-Stop Breakdown */}
                  <Box>
                    <Text fontWeight="semibold" mb={3}>Route Stops</Text>
                    <VStack spacing={3} align="stretch">
                      {jobDetails.stops.map((stop, index) => (
                        <Box key={index} p={3} border="1px solid" borderColor="gray.200" borderRadius="lg" bg={stop.type === 'pickup' ? 'blue.50' : 'green.50'}>
                          <Flex justify="space-between" align="center" mb={2}>
                            <HStack>
                              <Badge colorScheme={stop.type === 'pickup' ? 'blue' : 'green'} variant="solid">
                                {stop.type === 'pickup' ? 'Pickup' : `Drop ${index}`}
                              </Badge>
                              <Text fontWeight="medium">{stop.contact}</Text>
                            </HStack>
                            <Text fontSize="sm" color="gray.600">{stop.time}</Text>
                          </Flex>
                          <Text fontSize="sm" color="gray.700" mb={2}>{stop.address}</Text>
                          <HStack spacing={4}>
                            <Text fontSize="xs" color="gray.600">
                              📦 {stop.capacityUsed.items} items
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              ⚖️ {stop.capacityUsed.weight}kg
                            </Text>
                            <Text fontSize="xs" color="gray.600">
                              📏 {stop.capacityUsed.volume}m³
                            </Text>
                          </HStack>
                          {stop.items && stop.items.length > 0 && (
                            <HStack spacing={1} mt={2} flexWrap="wrap">
                              {stop.items.slice(0, 3).map((item, itemIndex) => (
                                <Badge key={itemIndex} size="sm" variant="outline" fontSize="xs">
                                  {item.name} (x{item.quantity})
                                </Badge>
                              ))}
                              {stop.items.length > 3 && (
                                <Badge size="sm" variant="outline" fontSize="xs">
                                  +{stop.items.length - 3} more
                                </Badge>
                              )}
                            </HStack>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </Box>

                  {/* Route Recommendations */}
                  {jobDetails.route?.optimization.recommendations && jobDetails.route.optimization.recommendations.length > 0 && (
                    <Alert status="info" borderRadius="lg">
                      <AlertIcon />
                      <Box>
                        <AlertTitle>Route Optimization Tips</AlertTitle>
                        <VStack align="start" spacing={1} mt={2}>
                          {jobDetails.route.optimization.recommendations.map((rec, index) => (
                            <Text key={index} fontSize="sm">• {rec}</Text>
                          ))}
                        </VStack>
                      </Box>
                    </Alert>
                  )}
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Desktop Job Progress Tracker */}
          {!isMobile && (
            <JobProgressTracker
              currentStep={currentStep}
              completedSteps={[]} // Steps before currentStep are automatically marked as completed
              onStepComplete={handleStepUpdate}
              onCustomerTrackingUpdate={handleCustomerTrackingUpdate}
              jobId={params.id}
              route={{
                id: params.id,
                drops: (jobDetails.stops || []).map((stop: any, index: number) => ({
                  id: stop.id || `drop-${index + 1}`,
                  sequence: index + 1,
                  pickupAddress: stop.address,
                  dropoffAddress: stop.address,
                  customerName: stop.contact,
                  customerPhone: stop.phone,
                  items: stop.items || [],
                  status: stop.type === 'pickup' ? 'loading' : 'unloading',
                })),
                totalDrops: jobDetails.stops?.length || 1,
              }}
            />
          )}

          {/* Action Buttons */}
          {jobDetails.status === 'available' && (
            <Card borderRadius="xl" boxShadow="lg" overflow="hidden">
              <CardBody p={6}>
                <VStack spacing={4}>
                  <Button
                    colorScheme="green"
                    size="xl"
                    width="full"
                    leftIcon={<FaCheckCircle />}
                    onClick={handleAcceptJob}
                    isLoading={isAccepting}
                    loadingText="Accepting Job..."
                    borderRadius="xl"
                    fontWeight="bold"
                    py={8}
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'xl',
                    }}
                  >
                    Accept This Job
                  </Button>
                  <Text fontSize="sm" color="gray.600" textAlign="center">
                    By accepting this job, you agree to complete the delivery as scheduled.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>
      </DriverShell>
  );
}