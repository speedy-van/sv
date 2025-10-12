'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import { EnhancedJobCard } from '@/components/driver/EnhancedJobCard';
import { NoJobsMessage } from '@/components/driver/NoJobsMessage';
import { RouteCard, Route } from '@/components/driver/RouteCard';
import { DriverShell } from '@/components/driver';
import { useOptimizedDataLoader } from '@/hooks/useOptimizedDataLoader';
import { useDebounce } from '@/hooks/useDebounce';

interface Job {
  id: string;
  reference: string;
  customer: string;
  customerPhone: string;
  date: string;
  time: string;
  from: string;
  to: string;
  distance: string;
  vehicleType: string;
  items: string;
  estimatedEarnings: number;
  status: string;
  priority?: string;
  duration?: string;
  crew?: string;
}

interface JobsData {
  jobs: Job[];
  total: number;
  available: number;
  assigned: number;
}

interface RoutesData {
  routes: Route[];
  metadata: {
    total: number;
  };
}

export default function DriverJobsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Use optimized data loader for jobs
  const { data: jobsData, loading: isLoading, error, refetch } = useOptimizedDataLoader<JobsData>({
    endpoint: '/api/driver/jobs',
    debounceMs: 300,
    cacheKey: 'driver-jobs',
    enabled: true
  });

  // Use optimized data loader for routes
  const { data: routesData, loading: isLoadingRoutes, error: routesError, refetch: refetchRoutes } = useOptimizedDataLoader<RoutesData>({
    endpoint: '/api/driver/routes',
    debounceMs: 300,
    cacheKey: 'driver-routes',
    enabled: true
  });

  // Optimized filtering with useMemo
  const filteredJobs = useMemo(() => {
    if (!jobsData?.jobs || !Array.isArray(jobsData.jobs)) return [];

    let filtered = jobsData.jobs;

    // Filter by search term
    if (debouncedSearchTerm) {
      filtered = filtered.filter(job => 
        job.customer.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        job.reference.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        job.from.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        job.to.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    return filtered;
  }, [jobsData?.jobs, debouncedSearchTerm, statusFilter]);

  // Show toast for errors
  useEffect(() => {
    if (error) {
      console.error('Driver Jobs Error:', error);
      toast({
        title: 'Error Loading Jobs',
        description: 'Failed to load jobs data. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [error, toast]);

  const handleAcceptJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/driver/jobs/${jobId}/accept`, {
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
        
        // Refresh jobs data
        refetch();
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

  const handleDeclineJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/driver/jobs/${jobId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Driver declined' })
      });

      if (response.ok) {
        toast({
          title: 'Job Declined',
          description: 'You have declined this job.',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
        
        // Refresh jobs data
        refetch();
      } else {
        throw new Error('Failed to decline job');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to decline job. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAcceptRoute = async (routeId: string) => {
    try {
      const response = await fetch(`/api/driver/routes/${routeId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Route Accepted!',
          description: `You have accepted a route with ${data.data?.dropCount || 0} stops.`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
        
        // Refresh both jobs and routes data
        refetch();
        refetchRoutes();
        
        // Trigger schedule refresh event
        window.dispatchEvent(new Event('jobAccepted'));
        
        // Redirect to schedule/progress page after 1 second
        setTimeout(() => {
          window.location.href = `/driver/routes/${routeId}/progress`;
        }, 1000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept route');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept route. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDeclineRoute = async (routeId: string) => {
    try {
      const response = await fetch(`/api/driver/routes/${routeId}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Driver declined' })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Route Declined',
          description: data.warning || 'Route declined and offered to other drivers.',
          status: 'warning',
          duration: 5000,
          isClosable: true,
        });
        
        // Refresh both jobs and routes data
        refetch();
        refetchRoutes();
      } else {
        throw new Error('Failed to decline route');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to decline route. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <DriverShell title="All Jobs" subtitle="Loading...">
        <Flex justify="center" align="center" height="400px">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text fontSize="lg">Loading jobs...</Text>
          </VStack>
        </Flex>
      </DriverShell>
    );
  }

  if (error) {
    return (
      <DriverShell title="All Jobs" subtitle="Error loading data">
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <Box>
            <AlertDescription fontSize="md">{error}</AlertDescription>
            <Button mt={3} size="md" onClick={refetch}>
              Try Again
            </Button>
          </Box>
        </Alert>
      </DriverShell>
    );
  }

  if (!jobsData) {
    return (
      <DriverShell title="All Jobs" subtitle="No data available">
        <Alert status="warning" borderRadius="lg">
          <AlertIcon />
          <AlertDescription fontSize="md">No jobs data available.</AlertDescription>
        </Alert>
      </DriverShell>
    );
  }

  return (
    <DriverShell
      title="All Jobs"
      subtitle="Manage and track all your jobs in one place"
      actions={
        <HStack spacing={2}>
          <Text fontSize="sm" color="text.secondary">
            Last updated: {new Date().toLocaleTimeString()}
          </Text>
          <Tooltip label="Refresh jobs data">
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
      {/* Enhanced Stats */}
      <HStack spacing={4} mb={6} flexWrap="wrap">
        <Badge
          bg="neon.500"
          color="dark.900"
          size="lg"
          px={4}
          py={2}
          fontWeight="600"
          borderRadius="lg"
          position="relative"
          overflow="hidden"
          boxShadow="0 0 15px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.3)"
          transition="all 0.3s"
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
              animation: "ripple-badge 0.5s ease-out"
            }
          }}
          sx={{
            "@keyframes ripple-badge": {
              "0%": { width: "0", height: "0", opacity: 1 },
              "100%": { width: "150px", height: "150px", opacity: 0 }
            }
          }}
        >
          Total: {jobsData.total}
        </Badge>
        <Badge
          bg="brand.500"
          color="white"
          size="lg"
          px={4}
          py={2}
          fontWeight="600"
          borderRadius="lg"
          position="relative"
          overflow="hidden"
          boxShadow="0 0 15px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.3)"
          transition="all 0.3s"
          _hover={{
            boxShadow: "0 0 20px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.4)",
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
              animation: "ripple-badge 0.5s ease-out"
            }
          }}
          sx={{
            "@keyframes ripple-badge": {
              "0%": { width: "0", height: "0", opacity: 1 },
              "100%": { width: "150px", height: "150px", opacity: 0 }
            }
          }}
        >
          Available: {jobsData.available}
        </Badge>
        <Badge
          bg="warning.500"
          color="white"
          size="lg"
          px={4}
          py={2}
          fontWeight="600"
          borderRadius="lg"
          position="relative"
          overflow="hidden"
          boxShadow="0 0 15px rgba(251, 191, 36, 0.6), 0 0 30px rgba(251, 191, 36, 0.3)"
          transition="all 0.3s"
          _hover={{
            boxShadow: "0 0 20px rgba(251, 191, 36, 0.8), 0 0 40px rgba(251, 191, 36, 0.4)",
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
              animation: "ripple-badge 0.5s ease-out"
            }
          }}
          sx={{
            "@keyframes ripple-badge": {
              "0%": { width: "0", height: "0", opacity: 1 },
              "100%": { width: "150px", height: "150px", opacity: 0 }
            }
          }}
        >
          Assigned: {jobsData.assigned}
        </Badge>
      </HStack>

      {/* Enhanced Search and Filter - Separated Design */}
      <VStack spacing={4} align="stretch">
        {/* Search Box - Standalone */}
        <Box
          bg="bg.card"
          border="1px solid"
          borderColor="border.primary"
          p={4}
          borderRadius="xl"
          position="sticky"
          top={{ base: "76px", md: "80px" }}
          zIndex={10}
          boxShadow="0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)"
          transition="all 0.3s"
          _hover={{
            boxShadow: "0 0 25px rgba(59, 130, 246, 0.6), 0 0 50px rgba(59, 130, 246, 0.3)"
          }}
        >
          <InputGroup>
            <InputLeftElement
              pointerEvents="none"
              pl={4}
            >
              <FaSearch color="#E5E5E5" size="16px" />
            </InputLeftElement>
            <Input
              placeholder="Search by customer, reference, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              borderRadius="lg"
              bg="bg.input"
              border="2px solid"
              borderColor="border.primary"
              color="text.primary"
              pl={12}
              fontSize="16px"
              h="52px"
              _focus={{
                borderColor: "neon.500",
                boxShadow: "neon.glow",
                bg: "bg.surface"
              }}
              _placeholder={{
                color: "text.tertiary"
              }}
            />
          </InputGroup>
        </Box>

        {/* Filter Badges - Separate Row */}
        <HStack spacing={3} flexWrap="wrap">
          <Text 
            fontSize="sm" 
            color="white" 
            fontWeight="medium"
            textShadow="0 0 8px rgba(255, 255, 255, 0.5)"
          >
            Filter:
          </Text>
          <HStack spacing={2} flexWrap="wrap">
            <Badge
              bg={statusFilter === 'all' ? 'neon.500' : 'bg.surface'}
              color={statusFilter === 'all' ? 'dark.900' : 'white'}
              size="lg"
              px={4}
              py={2}
              borderRadius="full"
              cursor="pointer"
              onClick={() => setStatusFilter('all')}
              position="relative"
              overflow="hidden"
              boxShadow={statusFilter === 'all' ? "0 0 15px rgba(59, 130, 246, 0.6)" : "none"}
              _hover={{
                transform: 'scale(1.05)',
                bg: statusFilter === 'all' ? 'neon.400' : 'bg.surface.hover',
                boxShadow: "0 0 15px rgba(59, 130, 246, 0.6)",
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
                  animation: "ripple-filter 0.5s ease-out"
                }
              }}
              transition="all 0.3s"
              border={statusFilter === 'all' ? 'none' : '1px solid'}
              borderColor="border.primary"
              sx={{
                "@keyframes ripple-filter": {
                  "0%": { width: "0", height: "0", opacity: 1 },
                  "100%": { width: "120px", height: "120px", opacity: 0 }
                }
              }}
            >
              All Status
            </Badge>
            <Badge
              bg={statusFilter === 'available' ? 'brand.500' : 'bg.surface'}
              color="white"
              size="lg"
              px={4}
              py={2}
              borderRadius="full"
              cursor="pointer"
              onClick={() => setStatusFilter('available')}
              position="relative"
              overflow="hidden"
              boxShadow={statusFilter === 'available' ? "0 0 15px rgba(34, 197, 94, 0.6)" : "none"}
              _hover={{
                transform: 'scale(1.05)',
                bg: statusFilter === 'available' ? 'brand.400' : 'bg.surface.hover',
                boxShadow: "0 0 15px rgba(34, 197, 94, 0.6)",
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
                  animation: "ripple-filter 0.5s ease-out"
                }
              }}
              transition="all 0.3s"
              border={statusFilter === 'available' ? 'none' : '1px solid'}
              borderColor="border.primary"
              sx={{
                "@keyframes ripple-filter": {
                  "0%": { width: "0", height: "0", opacity: 1 },
                  "100%": { width: "120px", height: "120px", opacity: 0 }
                }
              }}
            >
              Available
            </Badge>
            <Badge
              bg={statusFilter === 'assigned' ? 'warning.500' : 'bg.surface'}
              color="white"
              size="lg"
              px={4}
              py={2}
              borderRadius="full"
              cursor="pointer"
              onClick={() => setStatusFilter('assigned')}
              position="relative"
              overflow="hidden"
              boxShadow={statusFilter === 'assigned' ? "0 0 15px rgba(251, 191, 36, 0.6)" : "none"}
              _hover={{
                transform: 'scale(1.05)',
                bg: statusFilter === 'assigned' ? 'warning.400' : 'bg.surface.hover',
                boxShadow: "0 0 15px rgba(251, 191, 36, 0.6)",
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
                  animation: "ripple-filter 0.5s ease-out"
                }
              }}
              transition="all 0.3s"
              border={statusFilter === 'assigned' ? 'none' : '1px solid'}
              borderColor="border.primary"
              sx={{
                "@keyframes ripple-filter": {
                  "0%": { width: "0", height: "0", opacity: 1 },
                  "100%": { width: "120px", height: "120px", opacity: 0 }
                }
              }}
            >
              Assigned
            </Badge>
            <Badge
              bg={statusFilter === 'accepted' ? 'info.500' : 'bg.surface'}
              color="white"
              size="lg"
              px={4}
              py={2}
              borderRadius="full"
              cursor="pointer"
              onClick={() => setStatusFilter('accepted')}
              position="relative"
              overflow="hidden"
              boxShadow={statusFilter === 'accepted' ? "0 0 15px rgba(59, 130, 246, 0.6)" : "none"}
              _hover={{
                transform: 'scale(1.05)',
                bg: statusFilter === 'accepted' ? 'info.400' : 'bg.surface.hover',
                boxShadow: "0 0 15px rgba(59, 130, 246, 0.6)",
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
                  animation: "ripple-filter 0.5s ease-out"
                }
              }}
              transition="all 0.3s"
              border={statusFilter === 'accepted' ? 'none' : '1px solid'}
              borderColor="border.primary"
              sx={{
                "@keyframes ripple-filter": {
                  "0%": { width: "0", height: "0", opacity: 1 },
                  "100%": { width: "120px", height: "120px", opacity: 0 }
                }
              }}
            >
              Accepted
            </Badge>
            <Badge
              bg={statusFilter === 'completed' ? 'success.500' : 'bg.surface'}
              color="white"
              size="lg"
              px={4}
              py={2}
              borderRadius="full"
              cursor="pointer"
              onClick={() => setStatusFilter('completed')}
              position="relative"
              overflow="hidden"
              boxShadow={statusFilter === 'completed' ? "0 0 15px rgba(34, 197, 94, 0.6)" : "none"}
              _hover={{
                transform: 'scale(1.05)',
                bg: statusFilter === 'completed' ? 'success.400' : 'bg.surface.hover',
                boxShadow: "0 0 15px rgba(34, 197, 94, 0.6)",
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
                  animation: "ripple-filter 0.5s ease-out"
                }
              }}
              transition="all 0.3s"
              border={statusFilter === 'completed' ? 'none' : '1px solid'}
              borderColor="border.primary"
              sx={{
                "@keyframes ripple-filter": {
                  "0%": { width: "0", height: "0", opacity: 1 },
                  "100%": { width: "120px", height: "120px", opacity: 0 }
                }
              }}
            >
              Completed
            </Badge>
          </HStack>
        </HStack>
      </VStack>

      {/* Multi-Drop Routes Section */}
      {routesData?.routes && routesData.routes.length > 0 && (
        <Box mt={6}>
          <Heading 
            size="md" 
            mb={4}
            color="white"
            textShadow="0 0 15px rgba(168, 85, 247, 0.9), 0 0 30px rgba(168, 85, 247, 0.6)"
          >
            🚛 Multi-Drop Routes ({routesData.routes.length})
          </Heading>
          <VStack spacing={6} align="stretch">
            {routesData.routes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onAccept={route.status === 'planned' ? handleAcceptRoute : undefined}
                onReject={route.status === 'planned' ? handleDeclineRoute : undefined}
                onViewDetails={(routeId) => console.log('View details:', routeId)}
                onStartRoute={route.status === 'assigned' ? (routeId) => window.location.href = `/driver/routes/${routeId}/progress` : undefined}
                isLoading={isLoadingRoutes}
              />
            ))}
          </VStack>
        </Box>
      )}

      {/* Individual Jobs List */}
      {filteredJobs.length > 0 ? (
        <Box mt={6}>
          <Heading 
            size="md" 
            mb={4}
            color="white"
            textShadow="0 0 15px rgba(34, 197, 94, 0.9), 0 0 30px rgba(34, 197, 94, 0.6)"
          >
            📦 Individual Jobs ({filteredJobs.length})
          </Heading>
          <VStack spacing={6} align="stretch">
            {filteredJobs.map((job) => (
              <EnhancedJobCard
                key={job.id}
                job={job}
                variant={job.status === 'assigned' ? 'assigned' : 'available'}
                onAccept={job.status === 'available' ? handleAcceptJob : undefined}
                onDecline={job.status === 'available' ? handleDeclineJob : undefined}
                onViewDetails={(jobId) => window.location.href = `/driver/jobs/${jobId}`}
                isAccepting={isLoading}
                isDeclining={isLoading}
              />
            ))}
          </VStack>
        </Box>
      ) : !routesData?.routes || routesData.routes.length === 0 ? (
        <NoJobsMessage
          onRefresh={() => {
            refetch();
            refetchRoutes();
          }}
          isRefreshing={isLoading || isLoadingRoutes}
          message={searchTerm || statusFilter !== 'all' ? "No jobs match your filters" : "No jobs available"}
          subMessage={searchTerm || statusFilter !== 'all' ? "Try adjusting your search or filter criteria" : "New jobs will appear here when customers place orders"}
        />
      ) : null}
    </DriverShell>
  );
}