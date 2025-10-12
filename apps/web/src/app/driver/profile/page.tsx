'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Flex,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Avatar,
  Badge,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  Progress,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
  IconButton,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import { 
  FiUser, 
  FiStar, 
  FiTruck, 
  FiEdit,
  FiSave,
  FiX,
  FiRefreshCw,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCalendar,
  FiTrendingUp,
  FiCheck,
  FiClock,
  FiTarget,
} from 'react-icons/fi';
import { formatDistanceToNow, format } from 'date-fns';
import { DriverShell } from '@/components/driver';

interface DriverProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  driverId: string;
  basePostcode: string;
  vehicleType: string;
  onboardingStatus: string;
  rating: number;
  strikes: number;
  status: string;
  bio: string;
  profileImage: string;
  profileCompleteness: number;
  totalJobs: number;
  averageScore: number;
  averageRating: number;
  completionRate: number;
  onTimeRate: number;
  isOnline: boolean;
  lastSeenAt?: string;
  locationConsent: boolean;
  hasActiveOrders?: boolean;
  recentRatings: Array<{
    id: string;
    rating: number;
    review: string;
    category: string;
    bookingReference: string;
    customerName: string;
    createdAt: string;
  }>;
  joinedAt: string;
  lastLogin?: string;
  applicationStatus: string;
  applicationDate?: string;
}

export default function DriverProfile() {
  const [data, setData] = useState<DriverProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    basePostcode: '',
    vehicleType: '',
    bio: '',
    profileImage: '',
  });

  const fetchProfileData = useCallback(async (showRefreshToast = false) => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/driver/profile');
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }

      const result = await response.json();
      setData(result.data);
      setError(null);

      // Initialize edit form
      setEditForm({
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        phone: result.data.phone,
        email: result.data.email,
        basePostcode: result.data.basePostcode,
        vehicleType: result.data.vehicleType,
        bio: result.data.bio,
        profileImage: result.data.profileImage,
      });

      if (showRefreshToast) {
        toast({
          title: 'Profile Refreshed',
          description: 'Profile data has been updated',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleEditStart = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleEditCancel = useCallback(() => {
    setIsEditing(false);
    // Reset form to original data
    if (data) {
      setEditForm({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        basePostcode: data.basePostcode,
        vehicleType: data.vehicleType,
        bio: data.bio,
        profileImage: data.profileImage,
      });
    }
  }, [data]);

  const handleEditSave = useCallback(async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/driver/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to update profile');
      }

      setIsEditing(false);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh data
      fetchProfileData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  }, [editForm, fetchProfileData, toast]);

  const createSampleProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/debug/create-sample-profile', {
        method: 'POST',
      });
      
      if (response.ok) {
        const result = await response.json();
        toast({
          title: 'Sample Profile Created',
          description: 'Sample profile data has been added to your account.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        // Refresh data
        fetchProfileData();
      } else {
        const result = await response.json();
        toast({
          title: 'Failed to create sample profile',
          description: result.error || 'Unknown error',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error creating sample profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to create sample profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [fetchProfileData, toast]);

  const getStatusColor = useCallback((status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'green';
      case 'pending': return 'yellow';
      case 'active': return 'green';
      case 'offline': return 'gray';
      default: return 'gray';
    }
  }, []);

  const getCompletionColor = useCallback((percentage: number) => {
    if (percentage >= 80) return 'green';
    if (percentage >= 60) return 'yellow';
    return 'red';
  }, []);

  const renderStars = useCallback((rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Box
        key={i}
        as={FiStar}
        color={i < rating ? 'yellow.400' : 'gray.300'}
        fill={i < rating ? 'yellow.400' : 'transparent'}
      />
    ));
  }, []);

  if (loading) {
    return (
      <DriverShell title="Driver Profile" subtitle="Loading...">
        <Flex justify="center" align="center" height="400px">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text fontSize="lg">Loading your profile...</Text>
          </VStack>
        </Flex>
      </DriverShell>
    );
  }

  if (error || !data) {
    const isDriverRecordError = error?.includes('Driver record not found');

    return (
      <DriverShell title="Driver Profile" subtitle="Error loading data">
        <Alert status="error" borderRadius="lg">
          <AlertIcon />
          <VStack align="start" spacing={3}>
            <Text fontWeight="bold">Failed to load profile data</Text>
            <Text fontSize="sm">{error}</Text>
            <HStack spacing={3}>
              <Button size="md" onClick={() => fetchProfileData()}>
                Try Again
              </Button>
              {isDriverRecordError && (
                <Button
                  size="md"
                  colorScheme="blue"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/debug/create-driver-record', {
                        method: 'POST',
                      });
                      if (response.ok) {
                        toast({
                          title: 'Driver Record Created',
                          description: 'Driver record created. Refreshing profile...',
                          status: 'success',
                          duration: 2000,
                        });
                        fetchProfileData();
                      }
                    } catch (error) {
                      console.error('Error creating driver record:', error);
                    }
                  }}
                >
                  Create Driver Record
                </Button>
              )}
              <Button
                size="md"
                colorScheme="green"
                onClick={createSampleProfile}
              >
                Create Sample Data
              </Button>
            </HStack>
          </VStack>
        </Alert>
      </DriverShell>
    );
  }

  return (
    <DriverShell
      title="Driver Profile"
      subtitle="Manage your profile information and track your performance metrics"
      actions={
        <HStack spacing={2}>
          <Text fontSize="sm" color="text.secondary">
            Last updated: {new Date().toLocaleTimeString()}
          </Text>
          <Tooltip label="Refresh profile data">
            <IconButton
              size="sm"
              variant="outline"
              icon={<FiRefreshCw />}
              onClick={() => fetchProfileData(true)}
              isLoading={refreshing}
              aria-label="Refresh"
            />
          </Tooltip>
        </HStack>
      }
    >
      <VStack spacing={8} align="stretch">
        {/* Action Buttons */}
        <Flex justify="center" gap={4} flexWrap="wrap">
          {data.profileCompleteness < 50 && (
            <Button
              variant="outline"
              colorScheme="green"
              size="lg"
              onClick={createSampleProfile}
            >
              Add Sample Data
            </Button>
          )}
          {!isEditing ? (
            <Button
              leftIcon={<FiEdit />}
              onClick={handleEditStart}
              colorScheme="blue"
              size="lg"
            >
              Edit Profile
            </Button>
          ) : (
            <HStack spacing={3}>
              <Button
                leftIcon={<FiSave />}
                onClick={handleEditSave}
                isLoading={isSaving}
                colorScheme="green"
                size="lg"
              >
                Save Changes
              </Button>
              <Button
                leftIcon={<FiX />}
                onClick={handleEditCancel}
                variant="outline"
                colorScheme="red"
                size="lg"
              >
                Cancel
              </Button>
            </HStack>
          )}
        </Flex>

        {/* Profile Overview */}
        <Card
          bg="bg.card"
          border="1px solid"
          borderColor="border.primary"
          borderRadius="xl"
          position="relative"
          overflow="hidden"
          boxShadow="0 0 30px rgba(59, 130, 246, 0.5), 0 0 60px rgba(59, 130, 246, 0.3)"
          transition="all 0.3s"
          animation="pulse-profile-main 4s ease-in-out infinite"
          _hover={{
            boxShadow: "0 0 40px rgba(59, 130, 246, 0.7), 0 0 80px rgba(59, 130, 246, 0.4)",
            _before: {
              content: '""',
              position: "absolute",
              top: "0",
              left: "-100%",
              width: "100%",
              height: "100%",
              background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
              animation: "wave-main-profile 1.2s ease-out",
              zIndex: 1
            }
          }}
          sx={{
            "@keyframes pulse-profile-main": {
              "0%, 100%": { boxShadow: "0 0 25px rgba(59, 130, 246, 0.4), 0 0 50px rgba(59, 130, 246, 0.2)" },
              "50%": { boxShadow: "0 0 35px rgba(59, 130, 246, 0.6), 0 0 70px rgba(59, 130, 246, 0.35)" }
            },
            "@keyframes wave-main-profile": {
              "0%": { left: "-100%" },
              "100%": { left: "100%" }
            }
          }}
          _after={{
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
          <CardBody p={8} position="relative" zIndex={2}>
            <VStack spacing={8} align="stretch">
              {/* Main Profile Info */}
              <Flex direction={{ base: "column", md: "row" }} align={{ base: "center", md: "start" }} gap={8}>
                <VStack spacing={4}>
                  <Avatar
                    size="2xl"
                    src={data.profileImage}
                    name={`${data.firstName} ${data.lastName}`}
                    bg="blue.500"
                    color="white"
                    fontWeight="bold"
                    fontSize="2xl"
                    boxShadow="0 0 20px rgba(59, 130, 246, 0.7), 0 0 40px rgba(59, 130, 246, 0.4)"
                  />
                  <VStack spacing={2}>
                    <Badge 
                      colorScheme={getStatusColor(data.onboardingStatus)} 
                      fontSize="md"
                      px={4}
                      py={1}
                      borderRadius="full"
                      textTransform="uppercase"
                      fontWeight="bold"
                    >
                      {data.onboardingStatus}
                    </Badge>
                    <Badge 
                      colorScheme={data.isOnline ? 'green' : 'gray'} 
                      fontSize="sm"
                      px={3}
                      py={1}
                      borderRadius="full"
                    >
                      {data.isOnline ? '🟢 Online' : '⚫ Offline'}
                    </Badge>
                  </VStack>
                </VStack>

                <VStack align={{ base: "center", md: "start" }} spacing={6} flex={1}>
                  <VStack align={{ base: "center", md: "start" }} spacing={3}>
                    <Heading 
                      size="2xl" 
                      color="white" 
                      textAlign={{ base: "center", md: "left" }}
                      textShadow="0 0 15px rgba(59, 130, 246, 0.9), 0 0 30px rgba(59, 130, 246, 0.6)"
                    >
                      {data.firstName} {data.lastName}
                    </Heading>
                    
                    <Text 
                      fontSize="lg" 
                      color="white" 
                      maxW="2xl" 
                      textAlign={{ base: "center", md: "left" }}
                      opacity={0.9}
                      textShadow="0 0 8px rgba(255, 255, 255, 0.5)"
                    >
                      Driver ID: {data.driverId}
                    </Text>
                  </VStack>
                  
                  <VStack spacing={4} align={{ base: "center", md: "start" }}>
                    <HStack spacing={6} flexWrap="wrap" justify={{ base: "center", md: "start" }}>
                      <HStack spacing={3}>
                        <Box as={FiMail} color="blue.500" size="18px" />
                        <Text fontSize="lg" color="white" fontWeight="medium" textShadow="0 0 6px rgba(255, 255, 255, 0.4)">{data.email}</Text>
                      </HStack>
                      <HStack spacing={3}>
                        <Box as={FiPhone} color="green.500" size="18px" />
                        <Text fontSize="lg" color="white" fontWeight="medium" textShadow="0 0 6px rgba(255, 255, 255, 0.4)">{data.phone}</Text>
                      </HStack>
                    </HStack>
                    
                    <HStack spacing={3}>
                      <Box as={FiMapPin} color="purple.500" size="18px" />
                      <Text fontSize="lg" color="white" fontWeight="medium" textShadow="0 0 6px rgba(255, 255, 255, 0.4)">Base: {data.basePostcode}</Text>
                    </HStack>

                    {data.bio && (
                      <Box p={4} bg="rgba(59, 130, 246, 0.1)" borderRadius="lg" maxW="2xl" border="1px solid" borderColor="border.secondary">
                        <Text fontSize="md" color="white" lineHeight="1.6" textShadow="0 0 6px rgba(255, 255, 255, 0.4)">
                          {data.bio}
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </VStack>

                {/* Profile Completion */}
                <VStack spacing={4} align="center" minW="200px">
                  <VStack spacing={2} align="center">
                    <Text 
                      fontSize="4xl" 
                      fontWeight="bold" 
                      color="white"
                      textShadow={
                        getCompletionColor(data.profileCompleteness) === 'green' 
                          ? "0 0 20px rgba(34, 197, 94, 0.9), 0 0 40px rgba(34, 197, 94, 0.6)"
                          : getCompletionColor(data.profileCompleteness) === 'yellow' 
                          ? "0 0 20px rgba(251, 191, 36, 0.9), 0 0 40px rgba(251, 191, 36, 0.6)"
                          : "0 0 20px rgba(239, 68, 68, 0.9), 0 0 40px rgba(239, 68, 68, 0.6)"
                      }
                    >
                      {data.profileCompleteness}%
                    </Text>
                    <Text 
                      fontSize="lg" 
                      color="white" 
                      fontWeight="medium"
                      textShadow="0 0 8px rgba(255, 255, 255, 0.5)"
                    >
                      Profile Complete
                    </Text>
                  </VStack>
                  <Progress
                    value={data.profileCompleteness}
                    size="lg"
                    width="150px"
                    colorScheme={getCompletionColor(data.profileCompleteness)}
                    borderRadius="full"
                  />
                  {data.profileCompleteness < 100 && (
                    <Text 
                      fontSize="sm" 
                      color="white" 
                      textAlign="center"
                      opacity={0.8}
                      textShadow="0 0 6px rgba(255, 255, 255, 0.4)"
                    >
                      Complete your profile to get more job opportunities
                    </Text>
                  )}
                </VStack>
              </Flex>

              {/* Member Info */}
              <Divider />
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                <VStack spacing={2} align="start">
                  <Text fontSize="sm" color="white" fontWeight="semibold" textTransform="uppercase" opacity={0.7}>Member Since</Text>
                  <HStack spacing={2}>
                    <Box as={FiCalendar} color="blue.500" />
                    <Text fontSize="lg" fontWeight="medium" color="white" textShadow="0 0 6px rgba(255, 255, 255, 0.4)">
                      {format(new Date(data.joinedAt), 'MMMM yyyy')}
                    </Text>
                  </HStack>
                </VStack>
                
                {data.lastLogin && (
                  <VStack spacing={2} align="start">
                    <Text fontSize="sm" color="white" fontWeight="semibold" textTransform="uppercase" opacity={0.7}>Last Login</Text>
                    <HStack spacing={2}>
                      <Box as={FiClock} color="green.500" />
                      <Text fontSize="lg" fontWeight="medium" color="white" textShadow="0 0 6px rgba(255, 255, 255, 0.4)">
                        {formatDistanceToNow(new Date(data.lastLogin), { addSuffix: true })}
                      </Text>
                    </HStack>
                  </VStack>
                )}
                
                <VStack spacing={2} align="start">
                  <Text fontSize="sm" color="white" fontWeight="semibold" textTransform="uppercase" opacity={0.7}>Vehicle Type</Text>
                  <HStack spacing={2}>
                    <Box as={FiTruck} color="purple.500" />
                    <Text fontSize="lg" fontWeight="medium" color="white" textTransform="capitalize" textShadow="0 0 6px rgba(255, 255, 255, 0.4)">
                      {data.vehicleType}
                    </Text>
                  </HStack>
                </VStack>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        {/* Performance Stats */}
        <VStack spacing={4} align="stretch">
          <Heading 
            size="lg" 
            color="white" 
            textAlign="center"
            textShadow="0 0 15px rgba(59, 130, 246, 0.9), 0 0 30px rgba(59, 130, 246, 0.6)"
          >
            Performance Overview
          </Heading>
          
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
            {/* Average Rating Card */}
            <Card 
              bg="yellow.50" 
              borderLeft="4px solid" 
              borderLeftColor="yellow.500" 
              position="relative"
              overflow="hidden"
              boxShadow="0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3)"
              transition="all 0.3s"
              animation="pulse-rating 3s ease-in-out infinite"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "0 0 30px rgba(251, 191, 36, 0.7), 0 0 60px rgba(251, 191, 36, 0.4)",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "0",
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                  animation: "wave-profile 0.8s ease-out",
                  zIndex: 1
                }
              }}
              sx={{
                "@keyframes pulse-rating": {
                  "0%, 100%": { boxShadow: "0 0 15px rgba(251, 191, 36, 0.4), 0 0 30px rgba(251, 191, 36, 0.2)" },
                  "50%": { boxShadow: "0 0 25px rgba(251, 191, 36, 0.7), 0 0 50px rgba(251, 191, 36, 0.4)" }
                },
                "@keyframes wave-profile": {
                  "0%": { left: "-100%" },
                  "100%": { left: "100%" }
                }
              }}
            >
              <CardBody p={6} position="relative" zIndex={2}>
                <VStack spacing={4} align="center">
                  <Box as={FiStar} size="32px" color="yellow.500" />
                  <Stat textAlign="center">
                    <StatLabel fontSize="md" fontWeight="semibold" color="white" textShadow="0 0 8px rgba(255, 255, 255, 0.5)">Average Rating</StatLabel>
                    {data.totalJobs > 0 ? (
                      <>
                        <StatNumber 
                          fontSize="3xl" 
                          fontWeight="bold" 
                          color="white"
                          textShadow="0 0 15px rgba(251, 191, 36, 0.9), 0 0 30px rgba(251, 191, 36, 0.6)"
                        >
                          <HStack spacing={2} justify="center">
                            <Text>{data.averageRating.toFixed(1)}</Text>
                            <Box as={FiStar} fill="currentColor" />
                          </HStack>
                        </StatNumber>
                        <StatHelpText fontSize="md" color="white" opacity={0.8}>
                          From {data.totalJobs} completed jobs
                        </StatHelpText>
                      </>
                    ) : (
                      <>
                        <StatNumber fontSize="2xl" fontWeight="bold" color="white" opacity={0.7}>
                          No ratings yet
                        </StatNumber>
                        <StatHelpText fontSize="md" color="white" opacity={0.7}>
                          Complete jobs to earn ratings
                        </StatHelpText>
                      </>
                    )}
                  </Stat>
                </VStack>
              </CardBody>
            </Card>

            {/* Total Jobs Card */}
            <Card 
              bg="blue.50" 
              borderLeft="4px solid" 
              borderLeftColor="blue.500" 
              position="relative"
              overflow="hidden"
              boxShadow="0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)"
              transition="all 0.3s"
              animation="pulse-jobs 3s ease-in-out infinite"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "0 0 30px rgba(59, 130, 246, 0.7), 0 0 60px rgba(59, 130, 246, 0.4)",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "0",
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                  animation: "wave-profile 0.8s ease-out",
                  zIndex: 1
                }
              }}
              sx={{
                "@keyframes pulse-jobs": {
                  "0%, 100%": { boxShadow: "0 0 15px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.2)" },
                  "50%": { boxShadow: "0 0 25px rgba(59, 130, 246, 0.7), 0 0 50px rgba(59, 130, 246, 0.4)" }
                },
                "@keyframes wave-profile": {
                  "0%": { left: "-100%" },
                  "100%": { left: "100%" }
                }
              }}
            >
              <CardBody p={6} position="relative" zIndex={2}>
                <VStack spacing={4} align="center">
                  <Box as={FiTruck} size="32px" color="blue.500" />
                  <Stat textAlign="center">
                    <StatLabel fontSize="md" fontWeight="semibold" color="white" textShadow="0 0 8px rgba(255, 255, 255, 0.5)">Total Jobs</StatLabel>
                    <StatNumber 
                      fontSize="3xl" 
                      fontWeight="bold" 
                      color="white"
                      textShadow="0 0 15px rgba(59, 130, 246, 0.9), 0 0 30px rgba(59, 130, 246, 0.6)"
                    >
                      {data.totalJobs}
                    </StatNumber>
                    <StatHelpText fontSize="md" color="white" opacity={0.8}>
                      Completed successfully
                    </StatHelpText>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>

            {/* Completion Rate Card */}
            <Card 
              bg="green.50" 
              borderLeft="4px solid" 
              borderLeftColor="green.500" 
              position="relative"
              overflow="hidden"
              boxShadow="0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)"
              transition="all 0.3s"
              animation="pulse-completion 3s ease-in-out infinite"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "0 0 30px rgba(34, 197, 94, 0.7), 0 0 60px rgba(34, 197, 94, 0.4)",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "0",
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                  animation: "wave-profile 0.8s ease-out",
                  zIndex: 1
                }
              }}
              sx={{
                "@keyframes pulse-completion": {
                  "0%, 100%": { boxShadow: "0 0 15px rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)" },
                  "50%": { boxShadow: "0 0 25px rgba(34, 197, 94, 0.7), 0 0 50px rgba(34, 197, 94, 0.4)" }
                },
                "@keyframes wave-profile": {
                  "0%": { left: "-100%" },
                  "100%": { left: "100%" }
                }
              }}
            >
              <CardBody p={6} position="relative" zIndex={2}>
                <VStack spacing={4} align="center">
                  <Box as={FiCheck} size="32px" color="green.500" />
                  <Stat textAlign="center">
                    <StatLabel fontSize="md" fontWeight="semibold" color="white" textShadow="0 0 8px rgba(255, 255, 255, 0.5)">Completion Rate</StatLabel>
                    <StatNumber 
                      fontSize="3xl" 
                      fontWeight="bold" 
                      color="white"
                      textShadow="0 0 15px rgba(34, 197, 94, 0.9), 0 0 30px rgba(34, 197, 94, 0.6)"
                    >
                      {data.totalJobs > 0 ? `${(data.completionRate * 100).toFixed(1)}%` : 'N/A'}
                    </StatNumber>
                    <StatHelpText fontSize="md" color="white" opacity={0.8}>
                      Jobs completed on time
                    </StatHelpText>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>

            {/* On-Time Rate Card */}
            <Card 
              bg="purple.50" 
              borderLeft="4px solid" 
              borderLeftColor="purple.500" 
              position="relative"
              overflow="hidden"
              boxShadow="0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)"
              transition="all 0.3s"
              animation="pulse-ontime 3s ease-in-out infinite"
              _hover={{
                transform: "translateY(-4px)",
                boxShadow: "0 0 30px rgba(168, 85, 247, 0.7), 0 0 60px rgba(168, 85, 247, 0.4)",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "0",
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                  animation: "wave-profile 0.8s ease-out",
                  zIndex: 1
                }
              }}
              sx={{
                "@keyframes pulse-ontime": {
                  "0%, 100%": { boxShadow: "0 0 15px rgba(168, 85, 247, 0.4), 0 0 30px rgba(168, 85, 247, 0.2)" },
                  "50%": { boxShadow: "0 0 25px rgba(168, 85, 247, 0.7), 0 0 50px rgba(168, 85, 247, 0.4)" }
                },
                "@keyframes wave-profile": {
                  "0%": { left: "-100%" },
                  "100%": { left: "100%" }
                }
              }}
            >
              <CardBody p={6} position="relative" zIndex={2}>
                <VStack spacing={4} align="center">
                  <Box as={FiClock} size="32px" color="purple.500" />
                  <Stat textAlign="center">
                    <StatLabel fontSize="md" fontWeight="semibold" color="white" textShadow="0 0 8px rgba(255, 255, 255, 0.5)">Punctuality Rate</StatLabel>
                    <StatNumber 
                      fontSize="3xl" 
                      fontWeight="bold" 
                      color="white"
                      textShadow="0 0 15px rgba(168, 85, 247, 0.9), 0 0 30px rgba(168, 85, 247, 0.6)"
                    >
                      {data.totalJobs > 0 ? `${(data.onTimeRate * 100).toFixed(1)}%` : 'N/A'}
                    </StatNumber>
                    <StatHelpText fontSize="md" color="white" opacity={0.8}>
                      On-time deliveries
                    </StatHelpText>
                  </Stat>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Performance Summary */}
          {data.totalJobs === 0 && (
            <Card 
              bg="blue.50" 
              borderRadius="lg"
              position="relative"
              overflow="hidden"
              boxShadow="0 0 25px rgba(59, 130, 246, 0.5), 0 0 50px rgba(59, 130, 246, 0.3)"
              transition="all 0.3s"
              animation="pulse-summary 4s ease-in-out infinite"
              _hover={{
                boxShadow: "0 0 35px rgba(59, 130, 246, 0.7), 0 0 70px rgba(59, 130, 246, 0.4)",
                _before: {
                  content: '""',
                  position: "absolute",
                  top: "0",
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                  animation: "wave-summary 1s ease-out",
                  zIndex: 1
                }
              }}
              sx={{
                "@keyframes pulse-summary": {
                  "0%, 100%": { boxShadow: "0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)" },
                  "50%": { boxShadow: "0 0 30px rgba(59, 130, 246, 0.7), 0 0 60px rgba(59, 130, 246, 0.4)" }
                },
                "@keyframes wave-summary": {
                  "0%": { left: "-100%" },
                  "100%": { left: "100%" }
                }
              }}
            >
              <CardBody p={6} position="relative" zIndex={2}>
                <VStack spacing={4} textAlign="center">
                  <Box as={FiTrendingUp} size="48px" color="blue.500" />
                  <Heading 
                    size="md" 
                    color="white"
                    textShadow="0 0 15px rgba(59, 130, 246, 0.9), 0 0 30px rgba(59, 130, 246, 0.6)"
                  >
                    Ready to Start Your Journey?
                  </Heading>
                  <Text 
                    fontSize="lg" 
                    color="white"
                    textShadow="0 0 10px rgba(255, 255, 255, 0.6)"
                  >
                    Complete your first job to see your performance metrics here. 
                    Your ratings and statistics will be displayed as you build your reputation.
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          )}
        </VStack>

        {/* Profile Details */}
        <VStack spacing={4} align="stretch">
          <Heading 
            size="lg" 
            color="white" 
            textAlign="center"
            textShadow="0 0 15px rgba(34, 197, 94, 0.9), 0 0 30px rgba(34, 197, 94, 0.6)"
          >
            Profile Details
          </Heading>
          
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Personal Information */}
          <Card
            position="relative"
            overflow="hidden"
            boxShadow="0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)"
            transition="all 0.3s"
            _hover={{
              boxShadow: "0 0 30px rgba(59, 130, 246, 0.7), 0 0 60px rgba(59, 130, 246, 0.4)",
              _before: {
                content: '""',
                position: "absolute",
                top: "0",
                left: "-100%",
                width: "100%",
                height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                animation: "wave-card 1s ease-out",
                zIndex: 1
              }
            }}
            sx={{
              "@keyframes wave-card": {
                "0%": { left: "-100%" },
                "100%": { left: "100%" }
              }
            }}
          >
            <CardHeader position="relative" zIndex={2}>
              <Heading 
                size="md"
                color="white"
                textShadow="0 0 12px rgba(59, 130, 246, 0.8), 0 0 24px rgba(59, 130, 246, 0.4)"
              >
                <FiUser style={{ display: 'inline', marginRight: '8px' }} />
                Personal Information
              </Heading>
            </CardHeader>
            <CardBody position="relative" zIndex={2}>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel color="white" opacity={0.9}>First Name</FormLabel>
                  <Input
                    value={isEditing ? editForm.firstName : data.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    isReadOnly={!isEditing}
                    variant={isEditing ? 'outline' : 'filled'}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="white" opacity={0.9}>Last Name</FormLabel>
                  <Input
                    value={isEditing ? editForm.lastName : data.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    isReadOnly={!isEditing}
                    variant={isEditing ? 'outline' : 'filled'}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="white" opacity={0.9}>Phone Number</FormLabel>
                  <Input
                    value={isEditing ? editForm.phone : data.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    isReadOnly={!isEditing}
                    variant={isEditing ? 'outline' : 'filled'}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="white" opacity={0.9}>Email Address</FormLabel>
                  <Input
                    value={isEditing ? editForm.email : data.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    isReadOnly={!isEditing}
                    variant={isEditing ? 'outline' : 'filled'}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="white" opacity={0.9}>Bio</FormLabel>
                  <Textarea
                    value={isEditing ? editForm.bio : data.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    isReadOnly={!isEditing}
                    variant={isEditing ? 'outline' : 'filled'}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </CardBody>
          </Card>

          {/* Driver Information */}
          <Card
            position="relative"
            overflow="hidden"
            boxShadow="0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)"
            transition="all 0.3s"
            _hover={{
              boxShadow: "0 0 30px rgba(34, 197, 94, 0.7), 0 0 60px rgba(34, 197, 94, 0.4)",
              _before: {
                content: '""',
                position: "absolute",
                top: "0",
                left: "-100%",
                width: "100%",
                height: "100%",
                background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
                animation: "wave-card 1s ease-out",
                zIndex: 1
              }
            }}
            sx={{
              "@keyframes wave-card": {
                "0%": { left: "-100%" },
                "100%": { left: "100%" }
              }
            }}
          >
            <CardHeader position="relative" zIndex={2}>
              <Heading 
                size="md"
                color="white"
                textShadow="0 0 12px rgba(34, 197, 94, 0.8), 0 0 24px rgba(34, 197, 94, 0.4)"
              >
                <FiTruck style={{ display: 'inline', marginRight: '8px' }} />
                Driver Information
              </Heading>
            </CardHeader>
            <CardBody position="relative" zIndex={2}>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel color="white" opacity={0.9}>Base Postcode</FormLabel>
                  <Input
                    value={isEditing ? editForm.basePostcode : data.basePostcode}
                    onChange={(e) => setEditForm({ ...editForm, basePostcode: e.target.value })}
                    isReadOnly={!isEditing}
                    variant={isEditing ? 'outline' : 'filled'}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="white" opacity={0.9}>Vehicle Type</FormLabel>
                  {isEditing ? (
                    <Select
                      value={editForm.vehicleType}
                      onChange={(e) => setEditForm({ ...editForm, vehicleType: e.target.value })}
                    >
                      <option value="">Select vehicle type</option>
                      <option value="small_van">Small Van</option>
                      <option value="large_van">Large Van</option>
                      <option value="truck">Truck</option>
                      <option value="bike">Bike</option>
                    </Select>
                  ) : (
                    <Input
                      value={data.vehicleType || 'Not specified'}
                      isReadOnly
                      variant="filled"
                    />
                  )}
                </FormControl>

                <FormControl>
                  <FormLabel color="white" opacity={0.9}>Driver Status</FormLabel>
                  <Input
                    value={data.status}
                    isReadOnly
                    variant="filled"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel color="white" opacity={0.9}>Strikes</FormLabel>
                  <Input
                    value={data.strikes}
                    isReadOnly
                    variant="filled"
                  />
                </FormControl>

                <FormControl>
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <FormLabel htmlFor="location-consent" mb="0" fontWeight="semibold">
                          Location Sharing
                        </FormLabel>
                        <Text fontSize="sm" color="gray.600">
                          {data.hasActiveOrders 
                            ? 'Required while you have active orders' 
                            : 'Allow customers to track your location'
                          }
                        </Text>
                      </VStack>
                      <Switch
                        id="location-consent"
                        size="lg"
                        colorScheme="green"
                        isChecked={data.locationConsent}
                        isDisabled={data.hasActiveOrders && data.locationConsent}
                        onChange={async (e) => {
                          if (data.hasActiveOrders && data.locationConsent) {
                            toast({
                              title: 'Cannot Disable Location Sharing',
                              description: 'You cannot disable location sharing while you have active orders.',
                              status: 'warning',
                              duration: 5000,
                              isClosable: true,
                            });
                            return;
                          }
                          
                          try {
                            const response = await fetch('/api/driver/profile', {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ locationConsent: e.target.checked }),
                            });

                            if (response.ok) {
                              setData((prev: any) => ({ ...prev, locationConsent: e.target.checked }));
                              toast({
                                title: 'Location Sharing Updated',
                                description: `Location sharing has been ${e.target.checked ? 'enabled' : 'disabled'}.`,
                                status: 'success',
                                duration: 3000,
                                isClosable: true,
                              });
                            } else {
                              const error = await response.json();
                              throw new Error(error.error || 'Failed to update location sharing');
                            }
                          } catch (error) {
                            console.error('Location sharing update error:', error);
                            toast({
                              title: 'Error',
                              description: error instanceof Error ? error.message : 'Failed to update location sharing',
                              status: 'error',
                              duration: 5000,
                              isClosable: true,
                            });
                          }
                        }}
                      />
                    </HStack>
                    
                    {data.hasActiveOrders && (
                      <Text fontSize="xs" color="orange.600" fontWeight="medium">
                        🚨 Location sharing is mandatory while you have active orders
                      </Text>
                    )}
                    
                    <Text fontSize="xs" color="gray.500">
                      • Automatically enabled when you go online<br/>
                      • Required for customer order tracking<br/>
                      • Cannot be disabled during active deliveries
                    </Text>
                  </VStack>
                </FormControl>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Recent Reviews */}
        {data.recentRatings.length > 0 && (
          <Card>
            <CardHeader>
              <Heading size="md">
                <FiStar style={{ display: 'inline', marginRight: '8px' }} />
                Recent Customer Reviews
              </Heading>
            </CardHeader>
            <CardBody>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Customer</Th>
                    <Th>Rating</Th>
                    <Th>Review</Th>
                    <Th>Job</Th>
                    <Th>Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {data.recentRatings.map((rating) => (
                    <Tr key={rating.id}>
                      <Td>{rating.customerName}</Td>
                      <Td>
                        <HStack spacing={1}>
                          {renderStars(rating.rating)}
                          <Text fontSize="sm" ml={2}>
                            ({rating.rating}/5)
                          </Text>
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm" noOfLines={2} maxW="300px">
                          {rating.review || 'No review provided'}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm" fontFamily="mono">
                          {rating.bookingReference}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {formatDistanceToNow(new Date(rating.createdAt), { addSuffix: true })}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        )}

        {/* Account Status */}
        <Card>
          <CardHeader>
            <Heading size="md">
              <FiTarget style={{ display: 'inline', marginRight: '8px' }} />
              Account Status
            </Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <VStack spacing={2}>
                <Text fontSize="sm" color="gray.500">Application Status</Text>
                <Badge colorScheme={getStatusColor(data.applicationStatus)} size="lg">
                  {data.applicationStatus}
                </Badge>
                {data.applicationDate && (
                  <Text fontSize="xs" color="gray.500">
                    Applied {formatDistanceToNow(new Date(data.applicationDate), { addSuffix: true })}
                  </Text>
                )}
              </VStack>

              <VStack spacing={2}>
                <Text fontSize="sm" color="gray.500">Account Status</Text>
                <Badge colorScheme={getStatusColor(data.status)} size="lg">
                  {data.status}
                </Badge>
                {data.lastSeenAt && (
                  <Text fontSize="xs" color="gray.500">
                    Last seen {formatDistanceToNow(new Date(data.lastSeenAt), { addSuffix: true })}
                  </Text>
                )}
              </VStack>

              <VStack spacing={2}>
                <Text fontSize="sm" color="gray.500">Online Status</Text>
                <Badge colorScheme={data.isOnline ? 'green' : 'gray'} size="lg">
                  {data.isOnline ? 'Online' : 'Offline'}
                </Badge>
                <Text fontSize="xs" color="gray.500">
                  Location consent: {data.locationConsent ? 'Granted' : 'Not granted'}
                </Text>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>
        </VStack>
      </VStack>
    </DriverShell>
  );
}