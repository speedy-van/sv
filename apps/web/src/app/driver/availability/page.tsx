'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Button,
  Badge,
  Flex,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Switch,
  FormControl,
  FormLabel,
  Select,
  Divider,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Container,
} from '@chakra-ui/react';
import {
  FiClock,
  FiMapPin,
  FiCalendar,
  FiCheck,
  FiX,
  FiPause,
  FiPlay,
  FiSettings,
} from 'react-icons/fi';

interface AvailabilitySettings {
  isAvailable: boolean;
  availabilityMode: 'online' | 'offline' | 'break';
  workingHours: {
    monday: { start: string; end: string; enabled: boolean };
    tuesday: { start: string; end: string; enabled: boolean };
    wednesday: { start: string; end: string; enabled: boolean };
    thursday: { start: string; end: string; enabled: boolean };
    friday: { start: string; end: string; enabled: boolean };
    saturday: { start: string; end: string; enabled: boolean };
    sunday: { start: string; end: string; enabled: boolean };
  };
  maxDistance: number; // in miles
  serviceAreas: string[]; // postcode areas or 'UK-WIDE'
  coverageType: 'uk-wide' | 'local'; // New field for coverage type
  breakUntil?: string;
  locationConsent?: boolean; // Add location consent
}

export default function DriverAvailabilityPage() {
  const [settings, setSettings] = useState<AvailabilitySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [hasActiveOrders, setHasActiveOrders] = useState(false);
  const [locationConsent, setLocationConsent] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchAvailabilitySettings();
  }, []);

  const fetchAvailabilitySettings = async () => {
    try {
      console.log('🔍 Fetching availability settings...');
      const response = await fetch('/api/driver/availability');
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response:', data);
        
        // Convert API response to expected format
        const apiData = data.data || data.settings;
        if (apiData) {
          console.log('📊 API Data:', apiData);
          
          // Update additional states
          setHasActiveOrders(apiData.hasActiveOrders || false);
          setLocationConsent(apiData.locationConsent || false);
          
          setSettings({
            isAvailable: apiData.isOnline !== false, // Default to true (online) unless explicitly false
            availabilityMode: apiData.isOnline !== false ? 'online' : 'offline',
            workingHours: {
              monday: { start: '09:00', end: '17:00', enabled: true },
              tuesday: { start: '09:00', end: '17:00', enabled: true },
              wednesday: { start: '09:00', end: '17:00', enabled: true },
              thursday: { start: '09:00', end: '17:00', enabled: true },
              friday: { start: '09:00', end: '17:00', enabled: true },
              saturday: { start: '09:00', end: '17:00', enabled: false },
              sunday: { start: '09:00', end: '17:00', enabled: false },
            },
            maxDistance: 100, // UK-wide coverage
            serviceAreas: ['UK-WIDE'],
            coverageType: 'uk-wide',
            breakUntil: undefined,
          });
          console.log('✅ Settings loaded successfully');
        } else {
          console.error('❌ No data in API response');
          throw new Error('No data received from API');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, response.statusText, errorText);
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Driver Availability Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Error Loading Settings',
        description: `Failed to load availability settings: ${errorMessage}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAvailability = async (updates: Partial<AvailabilitySettings>) => {
    setUpdating(true);
    try {
      const response = await fetch('/api/driver/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        // Update settings with new data
        const apiData = data.data || data.settings;
        
        // Update local state with the changes we sent
        setSettings(prev => prev ? {
          ...prev,
          ...updates, // Apply all updates sent to the API
          isAvailable: apiData?.isOnline !== undefined ? apiData.isOnline : prev.isAvailable,
          availabilityMode: apiData?.isOnline !== undefined 
            ? (apiData.isOnline ? 'online' : 'offline') 
            : prev.availabilityMode,
        } : null);
        
        toast({
          title: 'Success',
          description: 'Availability settings updated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to update availability');
      }
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to update availability settings',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdating(false);
    }
  };

  const toggleAvailability = async () => {
    if (!settings) return;

    const newMode = settings.isAvailable ? 'offline' : 'online';
    
    // Check if trying to go offline while having active orders
    if (settings.isAvailable && hasActiveOrders) {
      toast({
        title: 'Cannot Go Offline',
        description: 'You cannot go offline while you have active orders. Complete your current orders first.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    await updateAvailability({
      isAvailable: !settings.isAvailable,
      availabilityMode: newMode,
    });
  };

  const setBreakMode = async () => {
    if (!settings) return;

    const breakUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes from now
    await updateAvailability({
      availabilityMode: 'break',
      breakUntil,
    });
  };

  const endBreak = async () => {
    if (!settings) return;

    await updateAvailability({
      availabilityMode: 'online',
      breakUntil: undefined,
    });
  };

  const toggleLocationSharing = async () => {
    if (hasActiveOrders && locationConsent) {
      toast({
        title: 'Cannot Disable Location Sharing',
        description: 'You cannot disable location sharing while you have active orders.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    await updateAvailability({
      locationConsent: !locationConsent,
    });
    
    setLocationConsent(!locationConsent);
  };

  const getStatusColor = (mode: string) => {
    switch (mode) {
      case 'online':
        return 'green';
      case 'offline':
        return 'red';
      case 'break':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (mode: string) => {
    switch (mode) {
      case 'online':
        return FiCheck;
      case 'offline':
        return FiX;
      case 'break':
        return FiPause;
      default:
        return FiClock;
    }
  };

  if (loading) {
    return (
      <Box p={6}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }

  if (!settings) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Failed to load settings</AlertTitle>
          <AlertDescription>
            Unable to load your availability settings. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={12} align="stretch">
        {/* Header */}
        <VStack align="center" spacing={4} textAlign="center">
          <Heading size="2xl" color="gray.800" fontWeight="bold">
            Driver Availability
          </Heading>
          <Text 
            fontSize="xl" 
            color="white" 
            maxW="2xl"
            textShadow="0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.5), 0 0 30px rgba(34, 197, 94, 0.3)"
          >
            Manage your availability, working hours, and service coverage to optimize your job opportunities
          </Text>
        </VStack>

        {/* Current Status */}
        <Card
          boxShadow="0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)"
          transition="all 0.3s"
          _hover={{
            boxShadow: "0 0 25px rgba(59, 130, 246, 0.7), 0 0 50px rgba(59, 130, 246, 0.4)"
          }}
        >
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              {/* Status Display */}
              <Flex justify="space-between" align="center" direction={{ base: "column", md: "row" }} gap={6}>
                <VStack align={{ base: "center", md: "start" }} spacing={3}>
                  <Badge
                    colorScheme={getStatusColor(settings.availabilityMode)}
                    fontSize="lg"
                    px={6}
                    py={2}
                    borderRadius="full"
                    textTransform="uppercase"
                    fontWeight="bold"
                    letterSpacing="wide"
                  >
                    <HStack spacing={2}>
                      <Box as={getStatusIcon(settings.availabilityMode)} />
                      <Text>{settings.availabilityMode}</Text>
                    </HStack>
                  </Badge>
                  {settings.breakUntil && (
                    <Text fontSize="md" color="yellow.600" fontWeight="medium">
                      Break until: {new Date(settings.breakUntil).toLocaleTimeString()}
                    </Text>
                  )}
                </VStack>

                {/* Action Buttons - Using ButtonGroup for proper spacing */}
                <Flex direction={{ base: "column", md: "row" }} gap={3} w={{ base: "full", md: "auto" }}>
                  <Button
                    leftIcon={<FiPlay />}
                    colorScheme="green"
                    size="lg"
                    px={8}
                    py={6}
                    fontSize="16px"
                    fontWeight="semibold"
                    variant={settings.availabilityMode === 'online' ? 'solid' : 'outline'}
                    onClick={toggleAvailability}
                    isLoading={updating}
                    isDisabled={settings.availabilityMode === 'online'}
                    position="relative"
                    overflow="hidden"
                    boxShadow="0 0 15px rgba(34, 197, 94, 0.5), 0 0 30px rgba(34, 197, 94, 0.3)"
                    _hover={{
                      boxShadow: "0 0 20px rgba(34, 197, 94, 0.7), 0 0 40px rgba(34, 197, 94, 0.4)",
                      transform: "scale(1.05)",
                      _before: {
                        content: '""',
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "0",
                        height: "0",
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.6)",
                        transform: "translate(-50%, -50%)",
                        animation: "ripple 0.6s ease-out"
                      }
                    }}
                    _disabled={{
                      opacity: 0.6,
                      cursor: 'not-allowed'
                    }}
                    sx={{
                      "@keyframes ripple": {
                        "0%": {
                          width: "0",
                          height: "0",
                          opacity: 1
                        },
                        "100%": {
                          width: "200px",
                          height: "200px",
                          opacity: 0
                        }
                      }
                    }}
                  >
                    {settings.availabilityMode === 'online' ? 'ONLINE' : 'Go Online'}
                  </Button>
                  
                  <Button
                    leftIcon={<FiPause />}
                    colorScheme="orange"
                    size="lg"
                    px={8}
                    py={6}
                    fontSize="16px"
                    fontWeight="semibold"
                    variant={settings.availabilityMode === 'break' ? 'solid' : 'outline'}
                    onClick={setBreakMode}
                    isLoading={updating}
                    isDisabled={settings.availabilityMode === 'break'}
                    position="relative"
                    overflow="hidden"
                    boxShadow="0 0 15px rgba(251, 191, 36, 0.5), 0 0 30px rgba(251, 191, 36, 0.3)"
                    _hover={{
                      boxShadow: "0 0 20px rgba(251, 191, 36, 0.7), 0 0 40px rgba(251, 191, 36, 0.4)",
                      transform: "scale(1.05)",
                      _before: {
                        content: '""',
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "0",
                        height: "0",
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.6)",
                        transform: "translate(-50%, -50%)",
                        animation: "ripple 0.6s ease-out"
                      }
                    }}
                    _disabled={{
                      opacity: 0.6,
                      cursor: 'not-allowed'
                    }}
                    sx={{
                      "@keyframes ripple": {
                        "0%": {
                          width: "0",
                          height: "0",
                          opacity: 1
                        },
                        "100%": {
                          width: "200px",
                          height: "200px",
                          opacity: 0
                        }
                      }
                    }}
                  >
                    Take Break
                  </Button>
                  
                  <Button
                    leftIcon={<FiX />}
                    colorScheme="red"
                    size="lg"
                    px={8}
                    py={6}
                    fontSize="16px"
                    fontWeight="semibold"
                    variant={settings.availabilityMode === 'offline' ? 'solid' : 'outline'}
                    onClick={toggleAvailability}
                    isLoading={updating}
                    isDisabled={settings.availabilityMode === 'offline'}
                    position="relative"
                    overflow="hidden"
                    boxShadow="0 0 15px rgba(239, 68, 68, 0.5), 0 0 30px rgba(239, 68, 68, 0.3)"
                    _hover={{
                      boxShadow: "0 0 20px rgba(239, 68, 68, 0.7), 0 0 40px rgba(239, 68, 68, 0.4)",
                      transform: "scale(1.05)",
                      _before: {
                        content: '""',
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "0",
                        height: "0",
                        borderRadius: "50%",
                        background: "rgba(255, 255, 255, 0.6)",
                        transform: "translate(-50%, -50%)",
                        animation: "ripple 0.6s ease-out"
                      }
                    }}
                    _disabled={{
                      opacity: 0.6,
                      cursor: 'not-allowed'
                    }}
                    sx={{
                      "@keyframes ripple": {
                        "0%": {
                          width: "0",
                          height: "0",
                          opacity: 1
                        },
                        "100%": {
                          width: "200px",
                          height: "200px",
                          opacity: 0
                        }
                      }
                    }}
                  >
                    Go Offline
                  </Button>
                </Flex>
              </Flex>

              {settings.availabilityMode === 'break' && (
                <Alert status="warning" borderRadius="lg" p={4}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="lg">You are on break</AlertTitle>
                    <AlertDescription fontSize="md" mt={2}>
                      You won't receive new job assignments until you end your break.
                      <Button
                        size="md"
                        ml={3}
                        colorScheme="blue"
                        variant="solid"
                        onClick={endBreak}
                        isLoading={updating}
                      >
                        End Break Now
                      </Button>
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Quick Stats */}
        <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={6}>
          <Card 
            bg="blue.50" 
            borderLeft="4px solid" 
            borderLeftColor="blue.500"
            boxShadow="0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)"
            transition="all 0.3s"
            _hover={{ 
              boxShadow: "0 0 25px rgba(59, 130, 246, 0.7), 0 0 50px rgba(59, 130, 246, 0.4)",
              transform: "translateY(-2px)"
            }}
          >
            <CardBody p={6}>
              <Stat textAlign="center">
                <HStack justify="center" mb={3}>
                  <Box as={FiMapPin} size="24px" color="blue.500" />
                  <StatLabel fontSize="lg" fontWeight="semibold" color="blue.700">Max Distance</StatLabel>
                </HStack>
                <StatNumber fontSize="3xl" fontWeight="bold" color="blue.600">
                  {settings.maxDistance} miles
                </StatNumber>
                <StatHelpText fontSize="md" color="blue.600" mt={2}>
                  Maximum distance for jobs
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card 
            bg="green.50" 
            borderLeft="4px solid" 
            borderLeftColor="green.500"
            boxShadow="0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)"
            transition="all 0.3s"
            _hover={{ 
              boxShadow: "0 0 25px rgba(34, 197, 94, 0.7), 0 0 50px rgba(34, 197, 94, 0.4)",
              transform: "translateY(-2px)"
            }}
          >
            <CardBody p={6}>
              <Stat textAlign="center">
                <HStack justify="center" mb={3}>
                  <Box as={FiSettings} size="24px" color="green.500" />
                  <StatLabel fontSize="lg" fontWeight="semibold" color="green.700">Service Areas</StatLabel>
                </HStack>
                <StatNumber fontSize="3xl" fontWeight="bold" color="green.600">
                  {settings.serviceAreas.length === 1 && settings.serviceAreas[0] === 'UK-WIDE' 
                    ? 'All UK' 
                    : settings.serviceAreas.length}
                </StatNumber>
                <StatHelpText fontSize="md" color="green.600" mt={2}>
                  {settings.serviceAreas[0] === 'UK-WIDE' 
                    ? 'Nationwide coverage' 
                    : 'Postcode areas covered'}
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card 
            bg="purple.50" 
            borderLeft="4px solid" 
            borderLeftColor="purple.500"
            boxShadow="0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)"
            transition="all 0.3s"
            _hover={{ 
              boxShadow: "0 0 25px rgba(168, 85, 247, 0.7), 0 0 50px rgba(168, 85, 247, 0.4)",
              transform: "translateY(-2px)"
            }}
          >
            <CardBody p={6}>
              <Stat textAlign="center">
                <HStack justify="center" mb={3}>
                  <Box as={FiCalendar} size="24px" color="purple.500" />
                  <StatLabel fontSize="lg" fontWeight="semibold" color="purple.700">Working Days</StatLabel>
                </HStack>
                <StatNumber fontSize="3xl" fontWeight="bold" color="purple.600">
                  {Object.values(settings.workingHours).filter(day => day.enabled).length}/7
                </StatNumber>
                <StatHelpText fontSize="md" color="purple.600" mt={2}>
                  Days available for work
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Location Sharing */}
        <Card>
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between" align="center">
                <VStack align="start" spacing={1}>
                  <Heading size="lg" color="white">Location Sharing</Heading>
                  <Text color="white">
                    Required for customers to track their orders and for job assignments
                  </Text>
                </VStack>
                <Badge
                  colorScheme={locationConsent ? 'green' : 'red'}
                  size="lg"
                  px={4}
                  py={2}
                  borderRadius="full"
                >
                  {locationConsent ? '📍 Enabled' : '📍 Disabled'}
                </Badge>
              </HStack>

              <Divider />

              <VStack spacing={4} align="stretch">
                <HStack justify="space-between" align="center" p={4} bg="gray.50" borderRadius="lg">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="semibold" color="white">Share Location</Text>
                    <Text fontSize="sm" color="white">
                      {hasActiveOrders 
                        ? '🚨 Required while you have active orders' 
                        : 'Allow customers to track your location during deliveries'
                      }
                    </Text>
                  </VStack>
                  <Switch
                    size="lg"
                    colorScheme="green"
                    isChecked={locationConsent}
                    onChange={toggleLocationSharing}
                    isDisabled={hasActiveOrders && locationConsent}
                  />
                </HStack>

                {hasActiveOrders && (
                  <Alert status="info" borderRadius="lg">
                    <AlertIcon />
                    <AlertDescription>
                      Location sharing is automatically enabled when you go online and cannot be disabled while you have active orders.
                    </AlertDescription>
                  </Alert>
                )}

                <Text fontSize="sm" color="gray.500">
                  • Location is only shared during active job assignments<br/>
                  • Automatically enabled when you go online<br/>
                  • Cannot be disabled while you have active orders<br/>
                  • Helps customers track delivery progress
                </Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Working Hours */}
        <Card>
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              <Heading size="lg" color="white">Working Hours</Heading>

              <VStack spacing={4} align="stretch">
                {Object.entries(settings.workingHours).map(([day, hours]) => (
                  <Box 
                    key={day} 
                    p={6} 
                    bg="black" 
                    borderWidth={2} 
                    borderColor={hours.enabled ? "green.400" : "red.500"}
                    borderRadius="lg"
                    transition="all 0.3s"
                    position="relative"
                    overflow="hidden"
                    boxShadow={hours.enabled 
                      ? "0 0 15px rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)" 
                      : "0 0 15px rgba(239, 68, 68, 0.4), 0 0 30px rgba(239, 68, 68, 0.2)"}
                    _hover={hours.enabled ? {
                      boxShadow: "0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3)",
                      transform: "translateX(4px)",
                      _before: {
                        content: '""',
                        position: "absolute",
                        top: "50%",
                        left: "0",
                        width: "0",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
                        transform: "translateY(-50%)",
                        animation: "wave 0.8s ease-out"
                      }
                    } : {
                      boxShadow: "0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3)",
                      transform: "translateX(4px)",
                      _before: {
                        content: '""',
                        position: "absolute",
                        top: "50%",
                        left: "0",
                        width: "0",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
                        transform: "translateY(-50%)",
                        animation: "wave 0.8s ease-out"
                      }
                    }}
                    sx={{
                      "@keyframes wave": {
                        "0%": {
                          width: "0",
                          left: "0"
                        },
                        "100%": {
                          width: "100%",
                          left: "100%"
                        }
                      }
                    }}
                  >
                    <Flex justify="space-between" align="center" direction={{ base: "column", md: "row" }} gap={4}>
                      <HStack spacing={4}>
                        <FormControl display="flex" alignItems="center" w="auto">
                          <FormLabel 
                            htmlFor={`${day}-enabled`} 
                            mb="0" 
                            fontWeight="bold" 
                            fontSize="lg"
                            color="white"
                            minW="120px"
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </FormLabel>
                          <Switch
                            id={`${day}-enabled`}
                            size="lg"
                            colorScheme="green"
                            isChecked={hours.enabled}
                            onChange={(e) => {
                              const newEnabled = e.target.checked;
                              updateAvailability({
                                workingHours: {
                                  ...settings.workingHours,
                                  [day]: { ...hours, enabled: newEnabled },
                                },
                              });
                            }}
                            isDisabled={updating}
                          />
                        </FormControl>
                      </HStack>

                      {hours.enabled && (
                        <HStack spacing={4} flexWrap="wrap">
                          <HStack spacing={2}>
                            <Text fontSize="md" fontWeight="medium" color="white">From:</Text>
                            <Box
                              as="input"
                              type="time"
                              value={hours.start}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const newStart = e.target.value;
                                // Validate that start is before end
                                if (newStart >= hours.end) {
                                  toast({
                                    title: 'Invalid Time',
                                    description: 'Start time must be before end time',
                                    status: 'error',
                                    duration: 3000,
                                    isClosable: true,
                                  });
                                  return;
                                }
                                updateAvailability({
                                  workingHours: {
                                    ...settings.workingHours,
                                    [day]: { ...hours, start: newStart },
                                  },
                                });
                              }}
                              disabled={updating}
                              p={3}
                              borderRadius="md"
                              border="2px solid"
                              borderColor="green.300"
                              bg="gray.700"
                              color="white"
                              fontSize="md"
                              fontWeight="medium"
                              w="120px"
                              _hover={{ borderColor: "green.400" }}
                              _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px #38A169" }}
                              _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                              sx={{
                                colorScheme: "dark"
                              }}
                            />
                          </HStack>
                          
                          <HStack spacing={2}>
                            <Text fontSize="md" fontWeight="medium" color="white">To:</Text>
                            <Box
                              as="input"
                              type="time"
                              value={hours.end}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const newEnd = e.target.value;
                                // Validate that end is after start
                                if (newEnd <= hours.start) {
                                  toast({
                                    title: 'Invalid Time',
                                    description: 'End time must be after start time',
                                    status: 'error',
                                    duration: 3000,
                                    isClosable: true,
                                  });
                                  return;
                                }
                                updateAvailability({
                                  workingHours: {
                                    ...settings.workingHours,
                                    [day]: { ...hours, end: newEnd },
                                  },
                                });
                              }}
                              disabled={updating}
                              p={3}
                              borderRadius="md"
                              border="2px solid"
                              borderColor="green.300"
                              bg="gray.700"
                              color="white"
                              fontSize="md"
                              fontWeight="medium"
                              w="120px"
                              _hover={{ borderColor: "green.400" }}
                              _focus={{ borderColor: "green.500", boxShadow: "0 0 0 1px #38A169" }}
                              _disabled={{ opacity: 0.5, cursor: "not-allowed" }}
                              sx={{
                                colorScheme: "dark"
                              }}
                            />
                          </HStack>

                          {/* Duration Display */}
                          <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
                            {(() => {
                              const startTime = new Date(`1970-01-01T${hours.start}:00`);
                              const endTime = new Date(`1970-01-01T${hours.end}:00`);
                              const diffHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
                              return `${diffHours}h duration`;
                            })()}
                          </Badge>
                        </HStack>
                      )}
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Service Coverage */}
        <Card>
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              <Heading size="lg" color="white">Service Coverage</Heading>
              <Text color="white" fontSize="lg">
                Choose your service coverage area:
              </Text>
              
              <Tabs 
                index={settings.coverageType === 'uk-wide' ? 0 : 1} 
                onChange={(index) => {
                  const newType = index === 0 ? 'uk-wide' : 'local';
                  updateAvailability({ 
                    coverageType: newType,
                    serviceAreas: newType === 'uk-wide' ? ['UK-WIDE'] : ['G21', 'G20', 'G22'],
                    maxDistance: newType === 'uk-wide' ? 100 : 25
                  });
                }}
                colorScheme="blue"
                size="lg"
                variant="enclosed"
              >
                <TabList mb={6}>
                  <Tab 
                    fontSize="lg" 
                    fontWeight="semibold" 
                    px={8} 
                    py={4}
                    _selected={{ 
                      color: 'green.600', 
                      borderColor: 'green.500',
                      borderBottomColor: 'white',
                      bg: 'green.50'
                    }}
                  >
                    <HStack spacing={3}>
                      <Box as={FiMapPin} />
                      <Text>🇬🇧 UK-Wide Coverage</Text>
                    </HStack>
                  </Tab>
                  <Tab 
                    fontSize="lg" 
                    fontWeight="semibold" 
                    px={8} 
                    py={4}
                    _selected={{ 
                      color: 'blue.600', 
                      borderColor: 'blue.500',
                      borderBottomColor: 'white',
                      bg: 'blue.50'
                    }}
                  >
                    <HStack spacing={3}>
                      <Box as={FiSettings} />
                      <Text>📍 Local Areas</Text>
                    </HStack>
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* UK-Wide Panel */}
                  <TabPanel p={0}>
                    <VStack spacing={6} align="stretch">
                      <Alert status="success" borderRadius="lg" p={6}>
                        <AlertIcon boxSize="32px" />
                        <Box>
                          <AlertTitle fontSize="xl" mb={2}>UK-Wide Coverage Active</AlertTitle>
                          <AlertDescription fontSize="lg" color="green.700">
                            You can accept jobs anywhere in the United Kingdom. 
                            Maximum distance: <strong>{settings.maxDistance} miles</strong> from your location.
                          </AlertDescription>
                        </Box>
                      </Alert>

                      {/* UK-Wide Stats */}
                      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                        <Card 
                          bg="green.50" 
                          borderLeft="4px solid" 
                          borderLeftColor="green.500"
                          boxShadow="0 0 15px rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)"
                          transition="all 0.3s"
                          _hover={{
                            boxShadow: "0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3)",
                            transform: "translateY(-4px)"
                          }}
                        >
                          <CardBody textAlign="center" p={6}>
                            <Text fontSize="sm" fontWeight="medium" color="green.700" mb={2}>Coverage Type</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="green.600">UK-Wide</Text>
                          </CardBody>
                        </Card>
                        <Card 
                          bg="green.50" 
                          borderLeft="4px solid" 
                          borderLeftColor="green.500"
                          boxShadow="0 0 15px rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)"
                          transition="all 0.3s"
                          _hover={{
                            boxShadow: "0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3)",
                            transform: "translateY(-4px)"
                          }}
                        >
                          <CardBody textAlign="center" p={6}>
                            <Text fontSize="sm" fontWeight="medium" color="green.700" mb={2}>Max Distance</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="green.600">{settings.maxDistance} miles</Text>
                          </CardBody>
                        </Card>
                        <Card 
                          bg="green.50" 
                          borderLeft="4px solid" 
                          borderLeftColor="green.500"
                          boxShadow="0 0 15px rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)"
                          transition="all 0.3s"
                          _hover={{
                            boxShadow: "0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3)",
                            transform: "translateY(-4px)"
                          }}
                        >
                          <CardBody textAlign="center" p={6}>
                            <Text fontSize="sm" fontWeight="medium" color="green.700" mb={2}>Areas Covered</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="green.600">All UK</Text>
                          </CardBody>
                        </Card>
                      </Grid>

                      {/* Coverage Badge */}
                      <Box>
                        <Text fontSize="lg" fontWeight="semibold" mb={3} color="white">
                          Current Coverage:
                        </Text>
                        <HStack>
                          <Badge 
                            colorScheme="green" 
                            fontSize="lg" 
                            px={6} 
                            py={2}
                            borderRadius="full"
                            fontWeight="bold"
                          >
                            🇬🇧 UK-WIDE COVERAGE
                          </Badge>
                        </HStack>
                      </Box>
                    </VStack>
                  </TabPanel>

                  {/* Local Areas Panel */}
                  <TabPanel p={0}>
                    <VStack spacing={6} align="stretch">
                      <Alert status="info" borderRadius="lg" p={6}>
                        <AlertIcon boxSize="32px" />
                        <Box>
                          <AlertTitle fontSize="xl" mb={2}>Local Coverage Active</AlertTitle>
                          <AlertDescription fontSize="lg" color="blue.700">
                            You can accept jobs in specific postcode areas. 
                            Maximum distance: <strong>{settings.maxDistance} miles</strong>.
                          </AlertDescription>
                        </Box>
                      </Alert>

                      {/* Local Stats */}
                      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
                        <Card 
                          bg="blue.50" 
                          borderLeft="4px solid" 
                          borderLeftColor="blue.500"
                          boxShadow="0 0 15px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.2)"
                          transition="all 0.3s"
                          _hover={{
                            boxShadow: "0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)",
                            transform: "translateY(-4px)"
                          }}
                        >
                          <CardBody textAlign="center" p={6}>
                            <Text fontSize="sm" fontWeight="medium" color="blue.700" mb={2}>Coverage Type</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.600">Local</Text>
                          </CardBody>
                        </Card>
                        <Card 
                          bg="blue.50" 
                          borderLeft="4px solid" 
                          borderLeftColor="blue.500"
                          boxShadow="0 0 15px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.2)"
                          transition="all 0.3s"
                          _hover={{
                            boxShadow: "0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)",
                            transform: "translateY(-4px)"
                          }}
                        >
                          <CardBody textAlign="center" p={6}>
                            <Text fontSize="sm" fontWeight="medium" color="blue.700" mb={2}>Max Distance</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.600">{settings.maxDistance} miles</Text>
                          </CardBody>
                        </Card>
                        <Card 
                          bg="blue.50" 
                          borderLeft="4px solid" 
                          borderLeftColor="blue.500"
                          boxShadow="0 0 15px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.2)"
                          transition="all 0.3s"
                          _hover={{
                            boxShadow: "0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)",
                            transform: "translateY(-4px)"
                          }}
                        >
                          <CardBody textAlign="center" p={6}>
                            <Text fontSize="sm" fontWeight="medium" color="blue.700" mb={2}>Areas Covered</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="blue.600">
                              {settings.coverageType === 'local' ? settings.serviceAreas.length : 3}
                            </Text>
                          </CardBody>
                        </Card>
                      </Grid>

                      {/* Local Areas Display */}
                      <Box>
                        <Text fontSize="lg" fontWeight="semibold" mb={3} color="white">
                          Covered Postcodes:
                        </Text>
                        <HStack wrap="wrap" spacing={3}>
                          {(settings.coverageType === 'local' ? settings.serviceAreas : ['G21', 'G20', 'G22']).map((area, index) => (
                            <Badge 
                              key={index} 
                              colorScheme="blue" 
                              fontSize="lg" 
                              px={4} 
                              py={2}
                              borderRadius="md"
                              fontWeight="bold"
                            >
                              📍 {area}
                            </Badge>
                          ))}
                        </HStack>
                      </Box>
                    </VStack>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
}
