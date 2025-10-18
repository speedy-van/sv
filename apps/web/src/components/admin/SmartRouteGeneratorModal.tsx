/**
 * Smart Route Generator Modal
 * Intelligent auto-route creation with preview and driver selection
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  FormControl,
  FormLabel,
  Input,
  Select,
  Checkbox,
  Divider,
  Progress,
  Grid,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
} from '@chakra-ui/react';
import {
  FiMapPin,
  FiPackage,
  FiClock,
  FiTruck,
  FiUser,
  FiCheck,
  FiAlertCircle,
  FiZap,
  FiEye,
  FiSettings,
  FiMap,
} from 'react-icons/fi';
import dynamic from 'next/dynamic';

// Lazy load map component for better performance
const AdminRouteClusterMap = dynamic(() => import('./RoutePreviewMap'), {
  ssr: false,
  loading: () => (
    <Box 
      h="400px" 
      bg="gray.900" 
      borderRadius="md" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      borderWidth="2px"
      borderColor="gray.700"
    >
      <Spinner size="xl" color="purple.400" />
    </Box>
  )
});

interface PendingDrop {
  id: string;
  pickupAddress: string;
  deliveryAddress: string;
  timeWindowStart: Date;
  timeWindowEnd: Date;
  quotedPrice: number;
  weight: number;
  volume: number;
  serviceTier: string;
  customerName?: string;
}

interface AvailableDriver {
  id: string;
  name: string;
  email: string;
  status: string;
  onboardingStatus: string;
  rating?: number;
  activeRoutes?: number;
  DriverAvailability: {
    status: string;
    lastSeenAt?: Date;
    location?: {
      lat: number;
      lng: number;
    } | null;
    hasRecord: boolean;
  };
  activeJobs: Array<any>;
  isAvailable: boolean;
  totalActiveJobs: number;
  availabilityReason: string;
}

interface ProposedRoute {
  id: string;
  drops: string[];
  driverId?: string;
  driverName?: string;
  totalDrops: number;
  estimatedDistance: number;
  estimatedDuration: number;
  totalValue: number;
}

interface SmartRouteGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SmartRouteGeneratorModal: React.FC<SmartRouteGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [step, setStep] = useState<'config' | 'preview' | 'creating'>('config');
  
  // Configuration
  const [maxDropsPerRoute, setMaxDropsPerRoute] = useState(10);
  const [maxDistanceMiles, setMaxDistanceMiles] = useState(50);
  const [optimizeBy, setOptimizeBy] = useState<'distance' | 'time' | 'area'>('distance');
  const [autoAssign, setAutoAssign] = useState(true);
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([]);
  
  // Data
  const [pendingDrops, setPendingDrops] = useState<PendingDrop[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [proposedRoutes, setProposedRoutes] = useState<ProposedRoute[]>([]);
  
  // Loading states
  const [isLoadingDrops, setIsLoadingDrops] = useState(false);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isCreatingRoutes, setIsCreatingRoutes] = useState(false);

  // Fetch pending drops
  const fetchPendingDrops = useCallback(async () => {
    setIsLoadingDrops(true);
    try {
      const response = await fetch('/api/admin/routes/pending-drops');
      const data = await response.json();
      if (data.success) {
        setPendingDrops(data.drops || []);
      }
    } catch (error) {
      console.error('Failed to fetch pending drops:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending drops',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoadingDrops(false);
    }
  }, [toast]);

  // Fetch available drivers
  const fetchAvailableDrivers = useCallback(async () => {
    setIsLoadingDrivers(true);
    try {
      const response = await fetch('/api/admin/drivers/available');
      const data = await response.json();
      console.log('📊 Available drivers API response:', data);
      if (data.success) {
        // API returns data in data.data.drivers structure
        const drivers = data.data?.drivers || data.drivers || [];
        console.log('✅ Loaded drivers:', drivers.length, 'Total:', drivers);
        setAvailableDrivers(drivers);
      }
    } catch (error) {
      console.error('Failed to fetch available drivers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load available drivers',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoadingDrivers(false);
    }
  }, [toast]);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('📂 Modal opened - loading data...');
      fetchPendingDrops();
      fetchAvailableDrivers();
    }
  }, [isOpen, fetchPendingDrops, fetchAvailableDrivers]);

  // Generate preview
  const generatePreview = async () => {
    setIsGeneratingPreview(true);
    try {
      const response = await fetch('/api/admin/routes/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxDropsPerRoute,
          maxDistanceKm: maxDistanceMiles, // Send as maxDistanceKm for API compatibility
          optimizeBy,
          autoAssign,
          driverIds: autoAssign ? [] : selectedDriverIds,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setProposedRoutes(data.proposedRoutes || []);
        setStep('preview');
      } else {
        toast({
          title: 'Preview Failed',
          description: data.message || 'Failed to generate route preview',
          status: 'error',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate route preview',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Create routes
  const createRoutes = async () => {
    setIsCreatingRoutes(true);
    setStep('creating');
    
    try {
      // Get selected booking IDs from pending drops
      const bookingIds = pendingDrops.map(drop => drop.id);
      
      const response = await fetch('/api/admin/routes/smart-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingIds,
          date: new Date().toISOString(),
          driverId: selectedDriverIds.length > 0 ? selectedDriverIds[0] : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const routeInfo = data.route ? `Route ${data.route.routeNumber} with ${data.route.drops?.length || 0} drops` : 'Route';
        toast({
          title: '🎉 AI Route Generated!',
          description: `${routeInfo} created successfully using DeepSeek AI`,
          status: 'success',
          duration: 5000,
        });
        onSuccess();
        handleClose();
      } else {
        toast({
          title: 'Creation Failed',
          description: data.message || 'Failed to create routes',
          status: 'error',
          duration: 5000,
        });
        setStep('preview');
      }
    } catch (error) {
      console.error('Failed to create routes:', error);
      toast({
        title: 'Error',
        description: 'Failed to create routes',
        status: 'error',
        duration: 3000,
      });
      setStep('preview');
    } finally {
      setIsCreatingRoutes(false);
    }
  };

  // Initialize data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPendingDrops();
      fetchAvailableDrivers();
      setStep('config');
      setProposedRoutes([]);
    }
  }, [isOpen, fetchPendingDrops, fetchAvailableDrivers]);

  const handleClose = () => {
    setStep('config');
    setProposedRoutes([]);
    onClose();
  };

  const handleDriverToggle = (driverId: string) => {
    setSelectedDriverIds(prev => 
      prev.includes(driverId)
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  // Calculate summary stats
  const totalPendingVolume = pendingDrops.reduce((sum, drop) => sum + drop.volume, 0);
  const totalPendingValue = pendingDrops.reduce((sum, drop) => sum + drop.quotedPrice, 0);
  const onlineDrivers = availableDrivers.filter(d => d.DriverAvailability?.status === 'online' || d.isAvailable).length;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      size="6xl"
      scrollBehavior="inside"
      closeOnOverlayClick={false}
    >
      <ModalOverlay backdropFilter="blur(8px)" />
      <ModalContent bg="gray.900" maxH="90vh">
        <ModalHeader color="white" borderBottomWidth="1px" borderColor="gray.700">
          <HStack spacing={3}>
            <Icon as={FiZap} color="purple.400" boxSize={6} />
            <Box>
              <Text fontSize="xl" fontWeight="bold">Smart Route Generator</Text>
              <Text fontSize="sm" fontWeight="normal" color="gray.400">
                Automatically cluster pending drops into optimized routes
              </Text>
            </Box>
            <Badge 
              colorScheme={
                step === 'config' ? 'blue' : 
                step === 'preview' ? 'purple' : 
                'green'
              }
              fontSize="xs"
              px={2}
              py={1}
            >
              {step === 'config' ? 'Configuration' : 
               step === 'preview' ? 'Preview' : 
               'Creating...'}
            </Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" isDisabled={isCreatingRoutes} />
        
        <ModalBody py={6}>
          {step === 'config' && (
            <Tabs variant="enclosed" colorScheme="purple">
              <TabList>
                <Tab _selected={{ bg: 'gray.800', color: 'purple.300' }}>
                  <Icon as={FiPackage} mr={2} /> Pending Drops ({pendingDrops.length})
                </Tab>
                <Tab _selected={{ bg: 'gray.800', color: 'purple.300' }}>
                  <Icon as={FiTruck} mr={2} /> Available Drivers ({onlineDrivers})
                </Tab>
                <Tab _selected={{ bg: 'gray.800', color: 'purple.300' }}>
                  <Icon as={FiSettings} mr={2} /> Settings
                </Tab>
              </TabList>

              <TabPanels>
                {/* Pending Drops Panel */}
                <TabPanel>
                  {isLoadingDrops ? (
                    <Box textAlign="center" py={8}>
                      <Spinner size="lg" color="purple.400" />
                      <Text color="gray.400" mt={4}>Loading pending drops...</Text>
                    </Box>
                  ) : pendingDrops.length === 0 ? (
                    <Alert status="info" borderRadius="md">
                      <AlertIcon />
                      <AlertTitle>No Pending Drops</AlertTitle>
                      <AlertDescription>
                        There are no pending drops available for route creation.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {/* Summary Stats */}
                      <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                        <Stat bg="gray.800" p={4} borderRadius="md">
                          <StatLabel color="gray.400">Total Drops</StatLabel>
                          <StatNumber color="white">{pendingDrops.length}</StatNumber>
                          <StatHelpText color="gray.500">Ready for assignment</StatHelpText>
                        </Stat>
                        <Stat bg="gray.800" p={4} borderRadius="md">
                          <StatLabel color="gray.400">Total Volume</StatLabel>
                          <StatNumber color="white">{totalPendingVolume.toFixed(1)} m³</StatNumber>
                          <StatHelpText color="gray.500">Combined volume</StatHelpText>
                        </Stat>
                        <Stat bg="gray.800" p={4} borderRadius="md">
                          <StatLabel color="gray.400">Total Value</StatLabel>
                          <StatNumber color="white">£{(totalPendingValue / 100).toFixed(2)}</StatNumber>
                          <StatHelpText color="gray.500">Revenue potential</StatHelpText>
                        </Stat>
                      </Grid>

                      {/* Drops List */}
                      <Box 
                        maxH="400px" 
                        overflowY="auto"
                        borderWidth="1px"
                        borderColor="gray.700"
                        borderRadius="md"
                      >
                        <Table variant="simple" size="sm">
                          <Thead bg="gray.800" position="sticky" top={0} zIndex={1}>
                            <Tr>
                              <Th color="gray.400">Address</Th>
                              <Th color="gray.400">Time Window</Th>
                              <Th color="gray.400" isNumeric>Volume</Th>
                              <Th color="gray.400">Tier</Th>
                              <Th color="gray.400" isNumeric>Value</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {pendingDrops.map((drop) => (
                              <Tr key={drop.id} _hover={{ bg: 'gray.800' }}>
                                <Td>
                                  <VStack align="start" spacing={0}>
                                    <Text color="white" fontSize="sm" fontWeight="medium">
                                      {drop.pickupAddress}
                                    </Text>
                                    <Text color="gray.400" fontSize="xs">
                                      → {drop.deliveryAddress}
                                    </Text>
                                  </VStack>
                                </Td>
                                <Td>
                                  <Text color="gray.300" fontSize="xs">
                                    {new Date(drop.timeWindowStart).toLocaleTimeString('en-GB', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </Text>
                                </Td>
                                <Td isNumeric>
                                  <Text color="gray.300" fontSize="sm">
                                    {drop.volume.toFixed(1)} m³
                                  </Text>
                                </Td>
                                <Td>
                                  <Badge 
                                    colorScheme={
                                      drop.serviceTier === 'premium' ? 'purple' : 
                                      drop.serviceTier === 'standard' ? 'blue' : 
                                      'green'
                                    }
                                    fontSize="xs"
                                  >
                                    {drop.serviceTier}
                                  </Badge>
                                </Td>
                                <Td isNumeric>
                                  <Text color="white" fontSize="sm" fontWeight="medium">
                                    £{(drop.quotedPrice / 100).toFixed(2)}
                                  </Text>
                                </Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </Box>
                    </VStack>
                  )}
                </TabPanel>

                {/* Available Drivers Panel */}
                <TabPanel>
                  {isLoadingDrivers ? (
                    <Box textAlign="center" py={8}>
                      <Spinner size="lg" color="purple.400" />
                      <Text color="gray.400" mt={4}>Loading available drivers...</Text>
                    </Box>
                  ) : availableDrivers.length === 0 ? (
                    <Alert status="warning" borderRadius="md">
                      <AlertIcon />
                      <AlertTitle>No Drivers Available</AlertTitle>
                      <AlertDescription>
                        There are no drivers currently online or available for assignment.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <VStack spacing={4} align="stretch">
                      {!autoAssign && (
                        <Alert status="info" borderRadius="md">
                          <AlertIcon />
                          <Text fontSize="sm">
                            Select specific drivers to assign routes to. Only selected drivers will be considered.
                          </Text>
                        </Alert>
                      )}
                      
                      <Grid templateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={4}>
                        {availableDrivers
                          .filter(d => d.DriverAvailability?.status === 'online' || d.isAvailable)
                          .map((driver) => (
                            <Card 
                              key={driver.id}
                              bg={selectedDriverIds.includes(driver.id) ? 'purple.900' : 'gray.800'}
                              borderWidth="2px"
                              borderColor={selectedDriverIds.includes(driver.id) ? 'purple.400' : 'gray.700'}
                              cursor={autoAssign ? 'default' : 'pointer'}
                              onClick={() => !autoAssign && handleDriverToggle(driver.id)}
                              transition="all 0.2s"
                              _hover={autoAssign ? {} : { 
                                borderColor: 'purple.400',
                                transform: 'translateY(-2px)',
                                shadow: 'lg'
                              }}
                            >
                              <CardBody>
                                <HStack justify="space-between" mb={3}>
                                  <HStack>
                                    <Icon as={FiUser} color="purple.400" />
                                    <Text color="white" fontWeight="bold">{driver.name}</Text>
                                  </HStack>
                                  <Badge colorScheme="green" fontSize="xs">
                                    {driver.status}
                                  </Badge>
                                </HStack>
                                
                                <VStack align="stretch" spacing={2} fontSize="sm">
                                  <HStack justify="space-between">
                                    <Text color="gray.400">Active Routes:</Text>
                                    <Text color="white" fontWeight="medium">{driver.activeRoutes}</Text>
                                  </HStack>
                                  {driver.rating && (
                                    <HStack justify="space-between">
                                      <Text color="gray.400">Rating:</Text>
                                      <Text color="white" fontWeight="medium">{driver.rating.toFixed(1)} ⭐</Text>
                                    </HStack>
                                  )}
                                </VStack>

                                {!autoAssign && selectedDriverIds.includes(driver.id) && (
                                  <Box mt={3} pt={3} borderTopWidth="1px" borderColor="gray.700">
                                    <HStack spacing={2} color="purple.300">
                                      <Icon as={FiCheck} />
                                      <Text fontSize="xs" fontWeight="medium">Selected for assignment</Text>
                                    </HStack>
                                  </Box>
                                )}
                              </CardBody>
                            </Card>
                          ))}
                      </Grid>
                    </VStack>
                  )}
                </TabPanel>

                {/* Settings Panel */}
                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Text color="white" fontSize="lg" fontWeight="bold" mb={4}>
                        Route Configuration
                      </Text>
                      
                      <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                        <FormControl>
                          <FormLabel color="gray.400">Max Drops Per Route</FormLabel>
                          <Input 
                            type="number" 
                            value={maxDropsPerRoute}
                            onChange={(e) => setMaxDropsPerRoute(parseInt(e.target.value) || 10)}
                            min={1}
                            max={20}
                            bg="gray.800"
                            color="white"
                            borderColor="gray.700"
                            _hover={{ borderColor: 'gray.600' }}
                          />
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            Recommended: 8-12 drops per route
                          </Text>
                        </FormControl>

                        <FormControl>
                          <FormLabel color="gray.400">Max Distance (miles)</FormLabel>
                          <Input 
                            type="number" 
                            value={maxDistanceMiles}
                            onChange={(e) => setMaxDistanceMiles(parseInt(e.target.value) || 50)}
                            min={10}
                            max={200}
                            bg="gray.800"
                            color="white"
                            borderColor="gray.700"
                            _hover={{ borderColor: 'gray.600' }}
                          />
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            Maximum total route distance
                          </Text>
                        </FormControl>

                        <FormControl>
                          <FormLabel color="gray.400">Optimize By</FormLabel>
                          <Select 
                            value={optimizeBy}
                            onChange={(e) => setOptimizeBy(e.target.value as any)}
                            bg="gray.800"
                            color="white"
                            borderColor="gray.700"
                            _hover={{ borderColor: 'gray.600' }}
                          >
                            <option value="distance">Distance (Shortest Routes)</option>
                            <option value="time">Time (Fastest Routes)</option>
                            <option value="area">Area (Geographic Clustering)</option>
                          </Select>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            Route optimization strategy
                          </Text>
                        </FormControl>
                      </Grid>
                    </Box>

                    <Divider borderColor="gray.700" />

                    <Box>
                      <Text color="white" fontSize="lg" fontWeight="bold" mb={4}>
                        Driver Assignment
                      </Text>
                      
                      <VStack spacing={4} align="stretch">
                        <Checkbox 
                          isChecked={autoAssign}
                          onChange={(e) => {
                            setAutoAssign(e.target.checked);
                            if (e.target.checked) {
                              setSelectedDriverIds([]);
                            }
                          }}
                          colorScheme="purple"
                        >
                          <VStack align="start" spacing={0}>
                            <Text color="white" fontWeight="medium">Auto-assign available drivers</Text>
                            <Text color="gray.400" fontSize="xs">
                              System will automatically assign routes to online drivers based on workload
                            </Text>
                          </VStack>
                        </Checkbox>

                        {!autoAssign && (
                          <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <AlertDescription fontSize="sm">
                              Go to the "Available Drivers" tab to select specific drivers for manual assignment.
                              {selectedDriverIds.length > 0 && ` ${selectedDriverIds.length} driver(s) selected.`}
                            </AlertDescription>
                          </Alert>
                        )}
                      </VStack>
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          )}

          {step === 'preview' && (
            <VStack spacing={6} align="stretch">
              {/* Preview Header */}
              <HStack justify="space-between">
                <Box>
                  <Text color="white" fontSize="lg" fontWeight="bold">
                    Route Preview
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    {proposedRoutes.length} routes will be created
                  </Text>
                </Box>
                <Button
                  leftIcon={<FiSettings />}
                  variant="ghost"
                  colorScheme="gray"
                  size="sm"
                  onClick={() => setStep('config')}
                >
                  Back to Settings
                </Button>
              </HStack>

              <Divider borderColor="gray.700" />

              {/* Proposed Routes */}
              {proposedRoutes.length === 0 ? (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <AlertTitle>No Routes Generated</AlertTitle>
                  <AlertDescription>
                    Unable to create routes with current settings. Try adjusting max drops or distance.
                  </AlertDescription>
                </Alert>
              ) : (
                <VStack spacing={6} align="stretch">
                  {/* Interactive Map Preview */}
                  <Box>
                    <HStack mb={3}>
                      <Icon as={FiMap} color="purple.400" boxSize={5} />
                      <Text color="white" fontSize="md" fontWeight="bold">
                        Route Map Preview
                      </Text>
                    </HStack>
                    <AdminRouteClusterMap
                      routes={proposedRoutes.map((route, index) => ({
                        id: route.id,
                        drops: route.drops.map((dropId) => {
                          const drop = pendingDrops.find(d => d.id === dropId);
                          return {
                            lat: 51.5074 + (Math.random() - 0.5) * 0.1, // Temporary mock coords
                            lng: -0.1278 + (Math.random() - 0.5) * 0.1,
                            address: drop?.pickupAddress || 'Unknown',
                          };
                        }),
                      }))}
                      height="400px"
                    />
                  </Box>

                  {/* Route Cards */}
                  <Box>
                    <Text color="white" fontSize="md" fontWeight="bold" mb={3}>
                      Route Details
                    </Text>
                    <Grid templateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap={4}>
                  {proposedRoutes.map((route, index) => (
                    <Card 
                      key={route.id} 
                      bg="gray.800" 
                      borderWidth="1px" 
                      borderColor="gray.700"
                    >
                      <CardBody>
                        <HStack justify="space-between" mb={3}>
                          <Badge colorScheme="purple" fontSize="sm" px={2} py={1}>
                            Route {index + 1}
                          </Badge>
                          {route.driverName && (
                            <Badge colorScheme="blue" fontSize="xs">
                              {route.driverName}
                            </Badge>
                          )}
                        </HStack>

                        <VStack align="stretch" spacing={3}>
                          <HStack>
                            <Icon as={FiPackage} color="purple.400" />
                            <Text color="white" fontSize="sm">
                              {route.totalDrops} drops
                            </Text>
                          </HStack>

                          <HStack>
                            <Icon as={FiMapPin} color="purple.400" />
                            <Text color="white" fontSize="sm">
                              {route.estimatedDistance.toFixed(1)} miles
                            </Text>
                          </HStack>

                          <HStack>
                            <Icon as={FiClock} color="purple.400" />
                            <Text color="white" fontSize="sm">
                              ~{route.estimatedDuration} minutes
                            </Text>
                          </HStack>

                          <Divider borderColor="gray.700" />

                          <HStack justify="space-between">
                            <Text color="gray.400" fontSize="sm">Total Value:</Text>
                            <Text color="white" fontWeight="bold">
                              £{(route.totalValue / 100).toFixed(2)}
                            </Text>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </Grid>
                  </Box>
                </VStack>
              )}
            </VStack>
          )}

          {step === 'creating' && (
            <Box textAlign="center" py={12}>
              <Spinner size="xl" color="purple.400" thickness="4px" />
              <Text color="white" fontSize="lg" fontWeight="bold" mt={6}>
                Creating Routes...
              </Text>
              <Text color="gray.400" mt={2}>
                Please wait while we process your request
              </Text>
              <Progress 
                size="sm" 
                isIndeterminate 
                colorScheme="purple" 
                mt={6}
                borderRadius="full"
              />
            </Box>
          )}
        </ModalBody>
        
        <ModalFooter borderTopWidth="1px" borderColor="gray.700">
          <HStack spacing={3}>
            <Button 
              variant="ghost" 
              onClick={handleClose}
              isDisabled={isCreatingRoutes || isGeneratingPreview}
            >
              Cancel
            </Button>
            
            {step === 'config' && (
              <Button
                leftIcon={<FiEye />}
                colorScheme="purple"
                onClick={generatePreview}
                isLoading={isGeneratingPreview}
                loadingText="Generating..."
                isDisabled={pendingDrops.length === 0}
              >
                Generate Preview
              </Button>
            )}
            
            {step === 'preview' && (
              <Button
                leftIcon={<FiCheck />}
                colorScheme="green"
                onClick={createRoutes}
                isLoading={isCreatingRoutes}
                loadingText="Creating..."
                isDisabled={proposedRoutes.length === 0}
              >
                Confirm & Create Routes
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SmartRouteGeneratorModal;

