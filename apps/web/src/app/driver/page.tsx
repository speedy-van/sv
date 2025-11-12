'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@chakra-ui/react';
import { FiRefreshCw, FiTruck, FiTrendingUp, FiBell } from 'react-icons/fi';
import Link from 'next/link';
import { ROUTES } from '@/lib/routing';

import { EnhancedJobCard } from '@/components/driver/EnhancedJobCard';
import { NoJobsMessage } from '@/components/driver/NoJobsMessage';
import { DriverStatsCard } from '@/components/driver/DriverStatsCard';
import { DriverShell } from '@/components/driver';
import { useOptimizedDataLoader } from '@/hooks/useOptimizedDataLoader';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface DashboardData {
  driver: {
    id: string;
    status: string;
    onboardingStatus: string;
  };
  jobs: {
    assigned: any[];
    available: any[];
  };
  statistics: {
    assignedJobs: number;
    availableJobs: number;
    completedToday: number;
    totalCompleted: number;
    earningsToday: number;
    totalEarnings: number;
    averageRating: number;
  };
}

export default function DriverDashboard() {
  const toast = useToast();
  const router = useRouter();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { data: session } = useSession();
  const pusherRef = useRef<any>(null);
  const { isOpen: isNotificationOpen, onOpen: onNotificationOpen, onClose: onNotificationClose } = useDisclosure();
  const [notificationData, setNotificationData] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Logout handler
  const handleLogout = () => {
    router.push('/driver/logout');
  };

  // Use optimized data loader
  const { data: dashboardData, loading: isLoading, error, refetch } = useOptimizedDataLoader<DashboardData>({
    endpoint: '/api/driver/dashboard',
    debounceMs: 300,
    cacheKey: 'driver-dashboard',
    enabled: true
  });

  // Initialize Pusher for real-time notifications
  useEffect(() => {
    if (typeof window === 'undefined' || !session?.user) return;

    const initPusher = async () => {
      try {
        const Pusher = (await import('pusher-js')).default;
        
        const driverId = (session.user as any).driver?.id || (session.user as any).id;
        if (!driverId) return;

        console.log('🔌 Initializing Pusher for driver dashboard:', driverId);

        const PUSHER_KEY = '407cb06c423e6c032e9c';
        const PUSHER_CLUSTER = 'eu';
        pusherRef.current = new Pusher(PUSHER_KEY, {
          cluster: PUSHER_CLUSTER,
          forceTLS: true,
        });

        const channel = pusherRef.current.subscribe(`driver-${driverId}`);

        // 🎯 Listen for route-matched event (PRIMARY)
        channel.bind('route-matched', (data: any) => {
          console.log('🎯🎯🎯 ROUTE MATCHED via Pusher (Web):', data);
          
          // Play notification sound
          playNotificationSound();
          
          // Show notification modal
          setNotificationData(data);
          onNotificationOpen();
          
          // Refresh dashboard data
          refetch();
          
          // Show toast
          toast({
            title: 'New Route Matched!',
            description: data.type === 'single-order' 
              ? `New job: ${data.bookingReference}`
              : `New route with ${data.bookingsCount} jobs assigned to you`,
            status: 'success',
            duration: 10000,
            isClosable: true,
            position: 'top-right',
          });
        });

        // 📦 Listen for job-assigned event (SECONDARY)
        channel.bind('job-assigned', (data: any) => {
          console.log('📦 JOB ASSIGNED via Pusher (Web):', data);
          
          // Play notification sound
          playNotificationSound();
          
          // Refresh dashboard data
          refetch();
          
          // Show toast
          toast({
            title: 'New Job Assigned!',
            description: `Job ${data.bookingReference || data.routeId} assigned to you`,
            status: 'info',
            duration: 8000,
            isClosable: true,
            position: 'top-right',
          });
        });

        // ❌ Listen for route-removed event
        channel.bind('route-removed', (data: any) => {
          console.log('❌ ROUTE REMOVED via Pusher (Web):', data);
          
          // Refresh dashboard data
          refetch();
          
          // Show toast
          toast({
            title: 'Route Removed',
            description: data.reason || 'A route has been removed from your assignments',
            status: 'warning',
            duration: 8000,
            isClosable: true,
            position: 'top-right',
          });
        });

        // 🚫 Listen for route-cancelled event (admin cancelled route)
        channel.bind('route-cancelled', (data: any) => {
          console.log('🚫 ROUTE CANCELLED by Admin (Web):', data);
          
          // Play notification sound
          playNotificationSound();
          
          // Refresh dashboard data
          refetch();
          
          // Show toast
          toast({
            title: 'Route Cancelled',
            description: data.message || `Route ${data.routeNumber || data.routeId} has been cancelled by admin`,
            status: 'error',
            duration: 10000,
            isClosable: true,
            position: 'top-right',
          });
        });

        // 📦 Listen for drop-removed event (admin removed drop from route)
        channel.bind('drop-removed', (data: any) => {
          console.log('📦 DROP REMOVED by Admin (Web):', data);
          
          // Refresh dashboard data
          refetch();
          
          // Show toast
          toast({
            title: 'Route Updated',
            description: `A drop has been removed from route ${data.routeNumber || data.routeId}. ${data.remainingDrops || 0} drops remaining.`,
            status: 'info',
            duration: 8000,
            isClosable: true,
            position: 'top-right',
          });
        });

        // 📬 Listen for notification event
        channel.bind('notification', (data: any) => {
          console.log('📬 NOTIFICATION via Pusher (Web):', data);
          
          toast({
            title: data.title || 'Notification',
            description: data.message,
            status: 'info',
            duration: 6000,
            isClosable: true,
            position: 'top-right',
          });
        });

        console.log('✅ Pusher initialized successfully for web driver portal');
      } catch (error) {
        console.error('❌ Failed to initialize Pusher:', error);
      }
    };

    initPusher();

    return () => {
      if (pusherRef.current) {
        console.log('🔌 Disconnecting Pusher...');
        pusherRef.current.disconnect();
      }
    };
  }, [session, refetch, toast, onNotificationOpen]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/notification.mp3');
      }
      audioRef.current.play().catch(err => {
        console.warn('Could not play notification sound:', err);
      });
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  // Show toast for errors
  useEffect(() => {
    if (error) {
      console.error('Driver Dashboard Error:', error);
      toast({
        title: 'Error Loading Dashboard',
        description: 'Failed to load your dashboard data. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'accepted': return 'blue';
      case 'invited': return 'yellow';
      case 'available': return 'green';
      default: return 'gray';
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/driver/jobs/${jobId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        toast({
          title: 'Job Accepted!',
          description: 'You have successfully accepted this job. Redirecting to job details...',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Redirect to job details page after a short delay
        setTimeout(() => {
          window.location.href = `/driver/jobs/${jobId}`;
        }, 1500);
      } else {
        throw new Error('Failed to accept job');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept job. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Container maxW="7xl" py={{ base: 4, md: 8 }}>
        <VStack spacing={{ base: 6, md: 8 }} align="center">
          <Spinner size="xl" color="blue.500" />
          <Text fontSize={{ base: "md", md: "lg" }}>Loading your dashboard...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="7xl" py={{ base: 4, md: 8 }}>
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertDescription fontSize={{ base: "sm", md: "md" }}>{error}</AlertDescription>
            <Button mt={3} size={{ base: "sm", md: "md" }} onClick={refetch}>
              Try Again
            </Button>
          </Box>
        </Alert>
      </Container>
    );
  }

  if (!dashboardData) {
    return (
      <Container maxW="7xl" py={{ base: 4, md: 8 }}>
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <AlertDescription fontSize={{ base: "sm", md: "md" }}>No dashboard data available.</AlertDescription>
        </Alert>
      </Container>
    );
  }

  const { driver, jobs, statistics } = dashboardData;

  return (
    <DriverShell
      title="Driver Dashboard"
      subtitle="Manage your jobs and track your performance"
      actions={
        <HStack spacing={2}>
          <Text fontSize="sm" color="text.secondary">
            Last updated: {new Date().toLocaleTimeString()}
          </Text>
          <Tooltip label="Refresh dashboard data">
            <IconButton
              size="sm"
              variant="outline"
              icon={<FiRefreshCw />}
              onClick={refetch}
              isLoading={isLoading}
              aria-label="Refresh"
            />
          </Tooltip>
        </HStack>
      }
    >
      <Box>
        {/* Enhanced Stats Card */}
        <DriverStatsCard
          stats={statistics}
          title="Your Performance Dashboard"
          description="Track your jobs, earnings, and performance metrics"
        />

        {/* Jobs Grid */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mt={8}>
          {/* Assigned Jobs */}
          <Box>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading 
                size="md" 
                color="white"
                textShadow="0 0 12px rgba(59, 130, 246, 0.8), 0 0 24px rgba(59, 130, 246, 0.4)"
              >
                Your Assigned Jobs
              </Heading>
              <Text 
                fontSize="sm" 
                color="white"
                textShadow="0 0 8px rgba(255, 255, 255, 0.6)"
              >
                {jobs.assigned.length} active
              </Text>
            </Flex>
            <VStack spacing={4} align="stretch">
              {jobs.assigned.length === 0 ? (
                <Text 
                  color="white" 
                  textAlign="center" 
                  py={8}
                  textShadow="0 0 8px rgba(255, 255, 255, 0.5)"
                >
                  No assigned jobs at the moment
                </Text>
              ) : (
                jobs.assigned.map((job) => (
                  <EnhancedJobCard
                    key={job.id}
                    job={{
                      id: job.id,
                      reference: job.reference,
                      customer: job.customer,
                      customerPhone: job.customerPhone || "01202 129746",
                      date: job.date,
                      time: job.time,
                      from: job.from,
                      to: job.to,
                      distance: job.distance,
                      vehicleType: job.vehicleType,
                      items: job.items,
                      estimatedEarnings: job.estimatedEarnings,
                      status: job.assignmentStatus,
                      duration: job.duration,
                      crew: job.crew,
                    }}
                    variant="assigned"
                    onAccept={job.assignmentStatus === 'invited' ? handleAcceptJob : undefined}
                    onViewDetails={(jobId) => window.location.href = `/driver/jobs/${jobId}`}
                    isAccepting={isLoading}
                  />
                ))
              )}
            </VStack>
          </Box>

          {/* Available Jobs */}
          <Box>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading 
                size="md" 
                color="white"
                textShadow="0 0 12px rgba(34, 197, 94, 0.8), 0 0 24px rgba(34, 197, 94, 0.4)"
              >
                Available Jobs
              </Heading>
              <Text 
                fontSize="sm" 
                color="white"
                textShadow="0 0 8px rgba(255, 255, 255, 0.6)"
              >
                {jobs.available.length} ready to accept
              </Text>
            </Flex>
            <VStack spacing={4} align="stretch">
              {jobs.available.length === 0 ? (
                <Text 
                  color="white" 
                  textAlign="center" 
                  py={8}
                  textShadow="0 0 8px rgba(255, 255, 255, 0.5)"
                >
                  No available jobs at the moment
                </Text>
              ) : (
                jobs.available.map((job) => (
                  <EnhancedJobCard
                    key={job.id}
                    job={{
                      id: job.id,
                      reference: job.reference,
                      customer: job.customer,
                      customerPhone: job.customerPhone || "01202 129746",
                      date: job.date,
                      time: job.time,
                      from: job.from,
                      to: job.to,
                      distance: job.distance,
                      vehicleType: job.vehicleType,
                      items: job.items,
                      estimatedEarnings: job.estimatedEarnings,
                      status: "available",
                      duration: job.duration,
                      crew: job.crew,
                    }}
                    variant="available"
                    onAccept={handleAcceptJob}
                    onViewDetails={(jobId) => window.location.href = `/driver/jobs/${jobId}`}
                    isAccepting={isLoading}
                  />
                ))
              )}
            </VStack>
          </Box>
        </SimpleGrid>

        {/* No Jobs Message */}
        {jobs.assigned.length === 0 && jobs.available.length === 0 && (
          <NoJobsMessage
            onRefresh={refetch}
            isRefreshing={isLoading}
            message="No available jobs at the moment"
            subMessage="New jobs will appear here when customers place orders"
          />
        )}

        {/* Quick Actions */}
        <Box mt={8}>
          <Heading 
            size="md" 
            mb={6} 
            color="white"
            textShadow="0 0 12px rgba(59, 130, 246, 0.8), 0 0 24px rgba(59, 130, 246, 0.4)"
          >
            Quick Actions
          </Heading>
          <Stack direction={{ base: "column", md: "row" }} spacing={4}>
            <Button
              colorScheme="blue"
              onClick={refetch}
              isLoading={isLoading}
              size="lg"
              width={{ base: "full", md: "auto" }}
              leftIcon={<FiRefreshCw />}
              position="relative"
              overflow="hidden"
              boxShadow="0 0 15px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.3)"
              _hover={{
                boxShadow: "0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4)",
                transform: "scale(1.05)",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "0",
                  height: "0",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.5)",
                  transform: "translate(-50%, -50%)",
                  animation: "ripple-quick 0.6s ease-out"
                }
              }}
              sx={{
                "@keyframes ripple-quick": {
                  "0%": { width: "0", height: "0", opacity: 1 },
                  "100%": { width: "200px", height: "200px", opacity: 0 }
                }
              }}
            >
              Refresh Dashboard
            </Button>
            <Link href={ROUTES.DRIVER.JOBS}>
              <Button
                variant="outline"
                size="lg"
                width={{ base: "full", md: "auto" }}
                leftIcon={<FiTruck />}
                position="relative"
                overflow="hidden"
                borderColor="neon.500"
                color="white"
                boxShadow="0 0 10px rgba(34, 197, 94, 0.5)"
                _hover={{
                  bg: "rgba(34, 197, 94, 0.1)",
                  boxShadow: "0 0 15px rgba(34, 197, 94, 0.7), 0 0 30px rgba(34, 197, 94, 0.4)",
                  transform: "scale(1.05)",
                  _before: {
                    content: '""',
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "0",
                    height: "0",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.4)",
                    transform: "translate(-50%, -50%)",
                    animation: "ripple-quick 0.6s ease-out"
                  }
                }}
                sx={{
                  "@keyframes ripple-quick": {
                    "0%": { width: "0", height: "0", opacity: 1 },
                    "100%": { width: "200px", height: "200px", opacity: 0 }
                  }
                }}
              >
                View All Jobs
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              width={{ base: "full", md: "auto" }}
              leftIcon={<FiTrendingUp />}
              position="relative"
              overflow="hidden"
              borderColor="neon.500"
              color="white"
              boxShadow="0 0 10px rgba(251, 191, 36, 0.5)"
              _hover={{
                bg: "rgba(251, 191, 36, 0.1)",
                boxShadow: "0 0 15px rgba(251, 191, 36, 0.7), 0 0 30px rgba(251, 191, 36, 0.4)",
                transform: "scale(1.05)",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: "0",
                  height: "0",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.4)",
                  transform: "translate(-50%, -50%)",
                  animation: "ripple-quick 0.6s ease-out"
                }
              }}
              sx={{
                "@keyframes ripple-quick": {
                  "0%": { width: "0", height: "0", opacity: 1 },
                  "100%": { width: "200px", height: "200px", opacity: 0 }
                }
              }}
            >
              Update Availability
            </Button>
          </Stack>
        </Box>

        {/* Route Match Notification Modal */}
        <Modal isOpen={isNotificationOpen} onClose={onNotificationClose} size="lg" isCentered>
          <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(10px)" />
          <ModalContent 
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            borderRadius="xl"
            boxShadow="0 0 50px rgba(102, 126, 234, 0.6)"
          >
            <ModalHeader color="white" fontSize="2xl" fontWeight="bold">
              <Flex align="center" gap={3}>
                <FiBell size={28} />
                🎯 New Route Matched!
              </Flex>
            </ModalHeader>
            <ModalBody color="white">
              {notificationData && (
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text fontSize="lg" fontWeight="semibold">
                      {notificationData.type === 'single-order' 
                        ? '📦 Single Order' 
                        : '🚚 Multi-Drop Route'}
                    </Text>
                    <Text mt={2} fontWeight="bold" color="cyan.300">
                      {notificationData.type === 'single-order'
                        ? `Order #${notificationData.orderNumber || notificationData.bookingReference}`
                        : `Route #${notificationData.routeNumber || notificationData.orderNumber}`}
                    </Text>
                    {notificationData.type !== 'single-order' && (
                      <Text mt={1} fontSize="sm">
                        {notificationData.bookingsCount} jobs assigned to you
                      </Text>
                    )}
                  </Box>
                  {notificationData.totalEarnings && (
                    <Box bg="whiteAlpha.200" p={3} borderRadius="md">
                      <Text fontSize="sm" opacity={0.9}>Estimated Earnings</Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        £{(notificationData.totalEarnings / 100).toFixed(2)}
                      </Text>
                    </Box>
                  )}
                  <Text fontSize="sm" opacity={0.8}>
                    {notificationData.message}
                  </Text>
                </VStack>
              )}
            </ModalBody>
            <ModalFooter>
              <Button 
                colorScheme="whiteAlpha" 
                variant="solid"
                onClick={() => {
                  onNotificationClose();
                  router.push(ROUTES.DRIVER.JOBS);
                }}
                mr={3}
              >
                View Details
              </Button>
              <Button variant="ghost" color="white" onClick={onNotificationClose}>
                Later
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </DriverShell>
  );
}