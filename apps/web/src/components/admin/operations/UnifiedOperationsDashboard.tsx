'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
  HStack,
  Badge,
  Icon,
  VStack,
  Text,
  Button,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FaClipboardList, FaRoute, FaTruck, FaTrash } from 'react-icons/fa';
import SingleOrdersSection from './SingleOrdersSection';
import MultiDropRoutesSection from './MultiDropRoutesSection';

// Pulsing animation for declined notifications
const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
`;

/**
 * Unified Operations Dashboard
 * 
 * Combines Orders and Routes management into a single interface
 * with tabbed navigation for easy switching between:
 * - Single Orders: Individual delivery management
 * - Multi-Drop Routes: Route creation and optimization
 */
export default function UnifiedOperationsDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [routesCount, setRoutesCount] = useState(0);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [declinedNotifications, setDeclinedNotifications] = useState<string[]>([]);
  const [acceptedNotifications, setAcceptedNotifications] = useState<string[]>([]);
  const [inProgressNotifications, setInProgressNotifications] = useState<string[]>([]);
  const [returnJourneyNotifications, setReturnJourneyNotifications] = useState<any[]>([]);
  const [newJourneyNotifications, setNewJourneyNotifications] = useState<any[]>([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const toast = useToast();

  // Setup Pusher for real-time declined notifications
  useEffect(() => {
    console.log('🔍 Checking Pusher availability:', {
      windowExists: typeof window !== 'undefined',
      pusherExists: typeof window !== 'undefined' && !!(window as any).Pusher,
      pusherType: typeof (window as any).Pusher
    });

    // Only proceed if we're in browser and Pusher is available
    if (typeof window === 'undefined' || !(window as any).Pusher) {
      console.log('ℹ️ Pusher not available, skipping real-time notifications');
      return;
    }

    const PUSHER_KEY = '407cb06c423e6c032e9c';
    const PUSHER_CLUSTER = 'eu';

    console.log('✅ Pusher found! Initializing...');
    console.log('🔑 Pusher Key:', PUSHER_KEY);
    console.log('🌍 Pusher Cluster:', PUSHER_CLUSTER);

    const pusher = new (window as any).Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
    });

    pusher.connection.bind('connected', () => {
      console.log('✅ Pusher connected successfully!');
    });

    pusher.connection.bind('error', (err: any) => {
      console.error('❌ Pusher connection error:', err);
    });

    const notificationsChannel = pusher.subscribe('admin-notifications');
    const routesChannel = pusher.subscribe('admin-routes');
    const ordersChannel = pusher.subscribe('admin-orders');

    notificationsChannel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Subscribed to: admin-notifications');
    });

    routesChannel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Subscribed to: admin-routes');
    });

    ordersChannel.bind('pusher:subscription_succeeded', () => {
      console.log('✅ Subscribed to: admin-orders');
    });

    // Listen for route declined from admin-routes channel
    routesChannel.bind('route-declined', (data: any) => {
        console.log('🚨 Route declined notification:', data);
        
        setDeclinedNotifications(prev => [...prev, data.routeId]);
        
        toast({
          title: '🚨 ROUTE DECLINED',
          description: (
            <Box>
              <Text fontWeight="bold" fontSize="md" mb={1}>
                {data.driverName} declined route!
              </Text>
              <Text fontSize="sm">
                Route: {data.routeNumber} | Stops: {data.dropCount} | Earnings: {data.estimatedEarnings}
              </Text>
              <Text fontSize="xs" mt={1} opacity={0.9}>
                Reason: {data.reason}
              </Text>
            </Box>
          ),
          status: 'error',
          duration: 10000,
          isClosable: true,
          position: 'top',
        });

        // Play browser beep sound
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800; // High pitch for alert
          gainNode.gain.value = 0.3;
          
          oscillator.start();
          setTimeout(() => oscillator.stop(), 200);
        } catch (e) {
          console.log('Audio notification not available:', e);
        }
      });

      // Listen for job/order declined from admin-notifications channel
      notificationsChannel.bind('driver-declined-job', (data: any) => {
        console.log('🚨 Job declined notification:', data);
        
        setDeclinedNotifications(prev => [...prev, data.jobId]);
        
        toast({
          title: '🚨 ORDER DECLINED',
          description: (
            <Box>
              <Text fontWeight="bold" fontSize="md" mb={1}>
                {data.driverName} declined order!
              </Text>
              <Text fontSize="sm">
                Order: {data.bookingReference} | Earnings: {data.estimatedEarnings}
              </Text>
              <Text fontSize="xs">
                {data.pickupAddress} → {data.dropoffAddress}
              </Text>
              <Text fontSize="xs" mt={1} opacity={0.9}>
                Reason: {data.reason}
              </Text>
            </Box>
          ),
          status: 'error',
          duration: 10000,
          isClosable: true,
          position: 'top',
        });

        // Play browser beep sound
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800; // High pitch for alert
          gainNode.gain.value = 0.3;
          
          oscillator.start();
          setTimeout(() => oscillator.stop(), 200);
        } catch (e) {
          console.log('Audio notification not available:', e);
        }
      });

      // Listen for job declined from admin-routes channel
      routesChannel.bind('job-declined', (data: any) => {
        console.log('🚨 Job declined (routes channel):', data);
        setDeclinedNotifications(prev => [...prev, data.jobId]);
      });

      // Listen for job/order ACCEPTED events
      notificationsChannel.bind('driver-accepted-job', (data: any) => {
        console.log('✅ Job accepted notification:', data);
        
        // Remove from declined if it was there
        setDeclinedNotifications(prev => prev.filter(id => id !== data.jobId));
        // Add to accepted
        setAcceptedNotifications(prev => [...prev, data.jobId]);
        
        toast({
          title: '✅ ORDER ACCEPTED',
          description: (
            <Box>
              <Text fontWeight="bold" fontSize="md" mb={1}>
                {data.driverName} accepted the order!
              </Text>
              <Text fontSize="sm">
                Order: {data.bookingReference} | Earnings: {data.estimatedEarnings}
              </Text>
              <Text fontSize="xs">
                {data.pickupAddress} → {data.dropoffAddress}
              </Text>
            </Box>
          ),
          status: 'success',
          duration: 8000,
          isClosable: true,
          position: 'top-right',
        });
      });

      routesChannel.bind('job-accepted', (data: any) => {
        console.log('✅ Job accepted (routes channel):', data);
        setDeclinedNotifications(prev => prev.filter(id => id !== data.jobId));
        setAcceptedNotifications(prev => [...prev, data.jobId]);
      });

      // ✅ NEW: Listen for return journey opportunities
      notificationsChannel.bind('return-journey-available', (data: any) => {
        console.log('🔄 Return journey opportunity:', data);
        
        setReturnJourneyNotifications(prev => [...prev, data]);
        
        toast({
          title: '🔄 RETURN JOURNEY OPPORTUNITY',
          description: (
            <Box>
              <Text fontWeight="bold" fontSize="md" mb={1}>
                New return journey match available!
              </Text>
              <Text fontSize="sm">
                {data.data.opportunity.from.postcode || data.data.opportunity.from} → {data.data.opportunity.to.postcode || data.data.opportunity.to}
              </Text>
              {data.data.opportunity.from.address && (
                <Text fontSize="xs" opacity={0.8}>
                  From: {data.data.opportunity.from.address}
                </Text>
              )}
              {data.data.opportunity.to.address && (
                <Text fontSize="xs" opacity={0.8}>
                  To: {data.data.opportunity.to.address}
                </Text>
              )}
              {data.data.opportunity.itemsCount > 0 && (
                <Text fontSize="xs" mt={1} opacity={0.9}>
                  Items: {data.data.opportunity.itemsCount}
                </Text>
              )}
              <Text fontSize="sm">
                Customer saves: £{data.data.opportunity.discount.toFixed(2)} ({data.data.opportunity.discountPercentage}%)
              </Text>
              <Text fontSize="sm">
                Driver earns: £{data.data.opportunity.driverEarnings.toFixed(2)}
              </Text>
              <Text fontSize="xs" mt={1} opacity={0.9}>
                Match Score: {data.data.opportunity.matchScore}%
              </Text>
              {data.data.journeyOpportunityId && (
                <Button
                  size="xs"
                  mt={2}
                  colorScheme="blue"
                  onClick={() => {
                    // Open full details in new tab or modal
                    window.open(`/admin/journey-opportunities/${data.data.journeyOpportunityId}`, '_blank');
                  }}
                >
                  View Full Details
                </Button>
              )}
            </Box>
          ),
          status: 'info',
          duration: 15000,
          isClosable: true,
          position: 'top',
        });

        // Optional: Play notification sound
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 600; // Medium pitch for info
          gainNode.gain.value = 0.2;
          
          oscillator.start();
          setTimeout(() => oscillator.stop(), 150);
        } catch (e) {
          console.log('Audio notification not available');
        }
      });

      // ✅ NEW: Listen for new journey opportunities
      notificationsChannel.bind('new-journey-available', (data: any) => {
        console.log('🆕 New journey available:', data);
        
        setNewJourneyNotifications(prev => [...prev, data]);
        
        toast({
          title: '🆕 NEW JOURNEY AVAILABLE',
          description: (
            <Box>
              <Text fontWeight="bold" fontSize="md" mb={1}>
                {data.data.journey.customer} - New booking!
              </Text>
              <Text fontSize="sm">
                {data.data.journey.from.postcode || data.data.journey.from} → {data.data.journey.to.postcode || data.data.journey.to}
              </Text>
              {data.data.journey.from.address && (
                <Text fontSize="xs" opacity={0.8}>
                  From: {data.data.journey.from.address}
                </Text>
              )}
              {data.data.journey.to.address && (
                <Text fontSize="xs" opacity={0.8}>
                  To: {data.data.journey.to.address}
                </Text>
              )}
              <Text fontSize="sm">
                Price: £{data.data.journey.price.toFixed(2)} | Items: {data.data.journey.itemsCount}
              </Text>
              {data.data.journey.items && data.data.journey.items.length > 0 && (
                <Text fontSize="xs" opacity={0.9}>
                  Items: {data.data.journey.items.map((item: any) => `${item.name} (x${item.quantity})`).join(', ')}
                </Text>
              )}
              <Text fontSize="sm">
                Service: {data.data.journey.serviceLevel.toUpperCase()} | Crew: {data.data.journey.crewSize || '2'} | Distance: {data.data.journey.distanceMiles?.toFixed(1) || '0'} miles
              </Text>
              {data.data.customer?.email && (
                <Text fontSize="xs" opacity={0.8}>
                  Customer: {data.data.customer.email} | {data.data.customer.phone}
                </Text>
              )}
              {data.data.journey.multiDropPotential && (
                <Text fontSize="xs" mt={1} color="green.300">
                  💰 Multi-drop potential: Save £{data.data.journey.potentialSavings.toFixed(2)}
                </Text>
              )}
              {data.data.journeyOpportunityId && (
                <Button
                  size="xs"
                  mt={2}
                  colorScheme="green"
                  onClick={() => {
                    // Open full details in new tab
                    window.open(`/admin/journey-opportunities/${data.data.journeyOpportunityId}`, '_blank');
                  }}
                >
                  View Full Details
                </Button>
              )}
            </Box>
          ),
          status: 'success',
          duration: 12000,
          isClosable: true,
          position: 'top',
        });

        // Optional: Play notification sound
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 700; // Higher pitch for new journey
          gainNode.gain.value = 0.2;
          
          oscillator.start();
          setTimeout(() => oscillator.stop(), 100);
        } catch (e) {
          console.log('Audio notification not available');
        }
      });

      ordersChannel.bind('order-accepted', (data: any) => {
        console.log('✅ Order accepted (orders channel):', data);
        setDeclinedNotifications(prev => prev.filter(id => id !== data.jobId));
        setAcceptedNotifications(prev => [...prev, data.jobId]);
      });

      // Listen for job STARTED events (IN PROGRESS)
      notificationsChannel.bind('driver-started-job', (data: any) => {
        console.log('🚀 Job started notification:', data);
        
        // Remove from accepted, add to in-progress
        setAcceptedNotifications(prev => prev.filter(id => id !== data.jobId));
        setInProgressNotifications(prev => [...prev, data.jobId]);
        
        toast({
          title: '🚀 DELIVERY IN PROGRESS',
          description: (
            <Box>
              <Text fontWeight="bold" fontSize="md" mb={1}>
                {data.driverName} started the delivery!
              </Text>
              <Text fontSize="sm">
                Order: {data.bookingReference}
              </Text>
              <Text fontSize="xs" color="blue.300">
                Step: {data.step?.replace('_', ' ')}
              </Text>
            </Box>
          ),
          status: 'info',
          duration: 6000,
          isClosable: true,
          position: 'top-right',
        });
      });

      ordersChannel.bind('order-started', (data: any) => {
        console.log('🚀 Order started (orders channel):', data);
        setAcceptedNotifications(prev => prev.filter(id => id !== data.jobId));
        setInProgressNotifications(prev => [...prev, data.jobId]);
      });

      routesChannel.bind('job-started', (data: any) => {
        console.log('🚀 Job started (routes channel):', data);
        setAcceptedNotifications(prev => prev.filter(id => id !== data.jobId));
        setInProgressNotifications(prev => [...prev, data.jobId]);
      });

      // Listen for ROUTE accepted events
      notificationsChannel.bind('driver-accepted-route', (data: any) => {
        console.log('✅ Route accepted notification:', data);
        
        setDeclinedNotifications(prev => prev.filter(id => id !== data.routeId));
        setAcceptedNotifications(prev => [...prev, data.routeId]);
        
        toast({
          title: '✅ ROUTE ACCEPTED',
          description: (
            <Box>
              <Text fontWeight="bold" fontSize="md" mb={1}>
                {data.driverName} accepted the route!
              </Text>
              <Text fontSize="sm">
                Route: {data.routeNumber} | Stops: {data.dropCount} | Earnings: {data.estimatedEarnings}
              </Text>
            </Box>
          ),
          status: 'success',
          duration: 8000,
          isClosable: true,
          position: 'top-right',
        });
      });

      routesChannel.bind('route-accepted', (data: any) => {
        console.log('✅ Route accepted (routes channel):', data);
        setDeclinedNotifications(prev => prev.filter(id => id !== data.routeId));
        setAcceptedNotifications(prev => [...prev, data.routeId]);
      });

      return () => {
        notificationsChannel.unbind_all();
        notificationsChannel.unsubscribe();
        routesChannel.unbind_all();
        routesChannel.unsubscribe();
        ordersChannel.unbind_all();
        ordersChannel.unsubscribe();
      };
    }, [toast]);

  const handleCleanup = async () => {
    try {
      setIsCleaningUp(true);
      const response = await fetch('/api/admin/cleanup', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Cleanup Successful',
          description: `Deleted ${data.deleted.bookings} bookings, ${data.deleted.routes} routes, and related data`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Refresh the page to update counts
        window.location.reload();
      } else {
        throw new Error(data.error || 'Cleanup failed');
      }
    } catch (error: any) {
      toast({
        title: 'Cleanup Failed',
        description: error.message || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCleaningUp(false);
      onClose();
    }
  };

  return (
    <Box>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <VStack align="start" spacing={2}>
          <Heading size="lg" color="white">
            Operations Management
          </Heading>
          <Text color="gray.400" fontSize="sm">
            Manage single orders and multi-drop routes with full control
          </Text>
        </VStack>
        
        <HStack spacing={3}>
          {/* Declined Notifications Badge */}
          {declinedNotifications.length > 0 && (
            <Button
              leftIcon={<Badge colorScheme="red" fontSize="xs" borderRadius="full">{declinedNotifications.length}</Badge>}
              colorScheme="red"
              variant="solid"
              size="sm"
              animation={`${pulseAnimation} 2s ease-in-out infinite`}
              onClick={() => {
                setDeclinedNotifications([]);
                toast({
                  title: 'Notifications Cleared',
                  description: `Cleared ${declinedNotifications.length} declined notification(s)`,
                  status: 'info',
                  duration: 3000,
                });
              }}
            >
              🚨 {declinedNotifications.length} Declined
            </Button>
          )}
          
          {/* Cleanup Button */}
          <Button
            leftIcon={<Icon as={FaTrash} />}
            colorScheme="red"
            variant="outline"
            size="sm"
            onClick={onOpen}
            _hover={{ bg: 'red.900', borderColor: 'red.500' }}
          >
            Cleanup All
          </Button>
        </HStack>
      </HStack>

      {/* Cleanup Confirmation Dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" borderColor="red.500" borderWidth="2px">
            <AlertDialogHeader fontSize="lg" fontWeight="bold" color="white">
              ⚠️ Delete All Orders & Routes?
            </AlertDialogHeader>

            <AlertDialogBody color="gray.300">
              This will <Text as="span" color="red.400" fontWeight="bold">permanently delete</Text>:
              <Box mt={3} pl={4}>
                <Text>• All bookings/orders</Text>
                <Text>• All routes</Text>
                <Text>• All assignments</Text>
                <Text>• All tracking data</Text>
                <Text>• All related records</Text>
              </Box>
              <Text mt={4} color="red.400" fontWeight="bold">
                This action cannot be undone!
              </Text>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant="ghost">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleCleanup}
                ml={3}
                isLoading={isCleaningUp}
                loadingText="Deleting..."
              >
                Yes, Delete Everything
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Tabbed Interface */}
      <Tabs
        index={activeTab}
        onChange={setActiveTab}
        variant="unstyled"
        isLazy
      >
        <TabList 
          bg="#111111" 
          borderColor="#333333" 
          borderWidth="2px"
          borderRadius="xl" 
          p={2}
          boxShadow="0 4px 16px rgba(0, 0, 0, 0.4)"
          display="flex"
          gap={2}
        >
          <Tab
            flex={1}
            px={6}
            py={4}
            borderRadius="lg"
            fontWeight="bold"
            fontSize="md"
            letterSpacing="0.5px"
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            bg="#1a1a1a"
            color="#9ca3af"
            borderWidth="2px"
            borderColor="transparent"
            position="relative"
            overflow="hidden"
            _selected={{
              bg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4), 0 0 20px rgba(37, 99, 235, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-2px)',
              borderColor: '#2563eb',
              _before: {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '3px',
                bg: '#10b981',
                borderRadius: 'full',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)',
              },
            }}
            _hover={{
              bg: '#1a1a1a',
              color: '#FFFFFF',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            <HStack spacing={3} position="relative" zIndex={1}>
              <Icon 
                as={FaClipboardList} 
                boxSize={5}
                filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))"
              />
              <Text fontWeight="semibold" letterSpacing="0.3px">Single Orders</Text>
              {ordersCount > 0 && (
                <Badge 
                  bg="rgba(37, 99, 235, 0.2)"
                  color="#FFFFFF"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontWeight="bold"
                  fontSize="xs"
                  letterSpacing="0.5px"
                  border="1px solid"
                  borderColor="rgba(37, 99, 235, 0.3)"
                  backdropFilter="blur(10px)"
                  boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
                  animation={`${pulseAnimation} 2s ease-in-out infinite`}
                >
                  {ordersCount}
                </Badge>
              )}
            </HStack>
          </Tab>

          <Tab
            flex={1}
            px={6}
            py={4}
            borderRadius="lg"
            fontWeight="bold"
            fontSize="md"
            letterSpacing="0.5px"
            transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            bg="#1a1a1a"
            color="#9ca3af"
            borderWidth="2px"
            borderColor="transparent"
            position="relative"
            overflow="hidden"
            _selected={{
              bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
              transform: 'translateY(-2px)',
              borderColor: '#10b981',
              _before: {
                content: '""',
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '60%',
                height: '3px',
                bg: '#2563eb',
                borderRadius: 'full',
                boxShadow: '0 0 12px rgba(37, 99, 235, 0.6)',
              },
            }}
            _hover={{
              bg: '#1a1a1a',
              color: '#FFFFFF',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            <HStack spacing={3} position="relative" zIndex={1}>
              <Icon 
                as={FaRoute} 
                boxSize={5}
                filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))"
              />
              <Text fontWeight="semibold" letterSpacing="0.3px">Multi-Drop Routes</Text>
              {routesCount > 0 && (
                <Badge 
                  bg="rgba(16, 185, 129, 0.2)"
                  color="#FFFFFF"
                  borderRadius="full"
                  px={3}
                  py={1}
                  fontWeight="bold"
                  fontSize="xs"
                  letterSpacing="0.5px"
                  border="1px solid"
                  borderColor="rgba(16, 185, 129, 0.3)"
                  backdropFilter="blur(10px)"
                  boxShadow="0 2px 8px rgba(0, 0, 0, 0.2)"
                  animation={`${pulseAnimation} 2s ease-in-out infinite`}
                >
                  {routesCount}
                </Badge>
              )}
            </HStack>
          </Tab>
        </TabList>

        <TabPanels>
          {/* Single Orders Tab */}
          <TabPanel p={0} pt={6}>
            <SingleOrdersSection 
              onCountChange={setOrdersCount} 
              declinedNotifications={declinedNotifications}
              acceptedNotifications={acceptedNotifications}
              inProgressNotifications={inProgressNotifications}
            />
          </TabPanel>

          {/* Multi-Drop Routes Tab */}
          <TabPanel p={0} pt={6}>
            <MultiDropRoutesSection 
              onCountChange={setRoutesCount}
              declinedNotifications={declinedNotifications}
              acceptedNotifications={acceptedNotifications}
              inProgressNotifications={inProgressNotifications}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}

