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
  Progress,
  Card,
  CardHeader,
  CardBody,
  Badge,
  Icon,
  Flex,
  Circle,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid
} from '@chakra-ui/react';
import { 
  FaMapMarkerAlt, 
  FaClock, 
  FaRoute, 
  FaPoundSign, 
  FaCheckCircle,
  FaTruck,
  FaBox,
  FaUser,
  FaArrowRight
} from 'react-icons/fa';
import { DriverShell } from '@/components/driver';
import { useRouter } from 'next/navigation';

interface Drop {
  id: string;
  deliveryAddress: string;
  pickupAddress: string;
  status: string;
  customerName: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  serviceTier: string;
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
  }>;
}

interface RouteData {
  id: string;
  status: string;
  drops: Drop[];
  estimatedDuration: number;
  estimatedDistance: number;
  estimatedEarnings: number;
  completedDrops: number;
  currentDropIndex?: number;
}

export default function RouteProgressPage({ params }: { params: { id: string } }) {
  const [route, setRoute] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completingDropId, setCompletingDropId] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();

  const loadRouteData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/driver/routes/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setRoute(data.route);
      } else {
        throw new Error('Failed to load route');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load route data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRouteData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadRouteData, 30000);
    return () => clearInterval(interval);
  }, [params.id]);

  const handleCompleteDrop = async (dropId: string) => {
    try {
      setCompletingDropId(dropId);
      const response = await fetch(`/api/driver/routes/${params.id}/complete-drop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dropId,
          proofOfDelivery: 'Delivered successfully',
          notes: 'Completed via driver app'
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Drop Completed!',
          description: `Earnings added: £${data.data?.earningsAdded?.toFixed(2) || '0.00'}`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        });
        
        // Reload route data
        await loadRouteData();
        
        // If all drops completed, redirect to earnings
        if (data.data?.routeCompleted) {
          setTimeout(() => {
            router.push('/driver/earnings');
          }, 2000);
        }
      } else {
        throw new Error('Failed to complete drop');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete drop. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setCompletingDropId(null);
    }
  };

  if (isLoading) {
    return (
      <DriverShell title="Route Progress" subtitle="Loading...">
        <Flex justify="center" align="center" height="400px">
          <VStack spacing={4}>
            <Spinner size="xl" color="neon.500" thickness="4px" />
            <Text color="white">Loading route data...</Text>
          </VStack>
        </Flex>
      </DriverShell>
    );
  }

  if (!route) {
    return (
      <DriverShell title="Route Progress" subtitle="Error">
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>Route not found</AlertDescription>
        </Alert>
      </DriverShell>
    );
  }

  const progressPercentage = (route.completedDrops / route.drops.length) * 100;

  return (
    <DriverShell title="Route Progress" subtitle={`Route #${params.id.slice(-8)}`}>
      <VStack spacing={6} align="stretch">
        {/* Progress Overview Card */}
        <Card
          bg="bg.card"
          borderColor="border.primary"
          borderWidth="1px"
          position="relative"
          overflow="hidden"
          boxShadow="0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)"
          animation="pulse-route-blue 3s ease-in-out infinite"
          sx={{
            "@keyframes pulse-route-blue": {
              "0%, 100%": { boxShadow: "0 0 15px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.2)" },
              "50%": { boxShadow: "0 0 25px rgba(59, 130, 246, 0.8), 0 0 50px rgba(59, 130, 246, 0.4)" }
            }
          }}
        >
          <CardHeader>
            <Heading 
              size="md" 
              color="white"
              textShadow="0 0 15px rgba(59, 130, 246, 0.9)"
            >
              <Icon as={FaRoute} mr={2} />
              Route Progress
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                <Box>
                  <Text fontSize="sm" color="white" opacity={0.7}>Status</Text>
                  <Badge 
                    colorScheme={route.status === 'in_progress' ? 'green' : 'blue'}
                    fontSize="md"
                    mt={1}
                  >
                    {route.status}
                  </Badge>
                </Box>
                <Box>
                  <Text fontSize="sm" color="white" opacity={0.7}>Total Stops</Text>
                  <Text 
                    fontSize="2xl" 
                    fontWeight="bold" 
                    color="white"
                    textShadow="0 0 10px rgba(59, 130, 246, 0.8)"
                  >
                    {route.drops.length}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="white" opacity={0.7}>Completed</Text>
                  <Text 
                    fontSize="2xl" 
                    fontWeight="bold" 
                    color="white"
                    textShadow="0 0 10px rgba(34, 197, 94, 0.8)"
                  >
                    {route.completedDrops}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="white" opacity={0.7}>Earnings</Text>
                  <Text 
                    fontSize="2xl" 
                    fontWeight="bold" 
                    color="white"
                    textShadow="0 0 10px rgba(34, 197, 94, 0.8)"
                  >
                    £{route.estimatedEarnings.toFixed(2)}
                  </Text>
                </Box>
              </SimpleGrid>

              <Box>
                <Flex justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="medium" color="white">
                    Progress: {route.completedDrops}/{route.drops.length}
                  </Text>
                  <Text fontSize="sm" color="white" opacity={0.8}>
                    {progressPercentage.toFixed(0)}%
                  </Text>
                </Flex>
                <Progress 
                  value={progressPercentage} 
                  colorScheme="green" 
                  size="lg" 
                  borderRadius="full"
                  bg="rgba(59, 130, 246, 0.2)"
                  sx={{
                    '& > div': {
                      boxShadow: '0 0 15px rgba(34, 197, 94, 0.8)'
                    }
                  }}
                />
              </Box>
            </VStack>
          </CardBody>
        </Card>

        {/* Drops List */}
        <Heading 
          size="md" 
          color="white"
          textShadow="0 0 12px rgba(255, 255, 255, 0.8)"
        >
          📍 Delivery Stops
        </Heading>

        {route.drops.map((drop, index) => {
          const isCompleted = drop.status === 'delivered';
          const isNext = !isCompleted && index === route.completedDrops;
          
          return (
            <Card
              key={drop.id}
              bg="bg.card"
              borderColor={isNext ? 'green.400' : 'border.primary'}
              borderWidth="2px"
              position="relative"
              overflow="hidden"
              opacity={isCompleted ? 0.7 : 1}
              boxShadow={
                isCompleted 
                  ? "0 0 10px rgba(34, 197, 94, 0.3)" 
                  : isNext 
                    ? "0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3)"
                    : "0 0 10px rgba(59, 130, 246, 0.4)"
              }
            >
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between">
                    <HStack>
                      <Circle 
                        size="12" 
                        bg={isCompleted ? 'green.500' : isNext ? 'green.400' : 'gray.600'}
                        color="white" 
                        fontWeight="bold"
                        boxShadow={isNext ? "0 0 15px rgba(34, 197, 94, 0.8)" : "none"}
                      >
                        {isCompleted ? <Icon as={FaCheckCircle} /> : index + 1}
                      </Circle>
                      <VStack align="start" spacing={0}>
                        <Text 
                          fontWeight="bold" 
                          color="white"
                          textShadow="0 0 8px rgba(255, 255, 255, 0.6)"
                          fontSize="lg"
                        >
                          Stop {index + 1} - {drop.customerName}
                        </Text>
                        <Badge 
                          colorScheme={isCompleted ? 'green' : isNext ? 'yellow' : 'blue'}
                          mt={1}
                        >
                          {isCompleted ? 'Completed' : isNext ? 'Next Stop' : 'Pending'}
                        </Badge>
                      </VStack>
                    </HStack>
                  </HStack>

                  <Divider borderColor="border.primary" />

                  <VStack align="stretch" spacing={3}>
                    <HStack>
                      <Icon as={FaMapMarkerAlt} color="green.400" />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="xs" color="white" opacity={0.7}>Pickup:</Text>
                        <Text fontSize="sm" color="white" fontWeight="medium">
                          {drop.pickupAddress}
                        </Text>
                      </VStack>
                    </HStack>

                    <HStack>
                      <Icon as={FaMapMarkerAlt} color="red.400" />
                      <VStack align="start" spacing={0} flex={1}>
                        <Text fontSize="xs" color="white" opacity={0.7}>Delivery:</Text>
                        <Text fontSize="sm" color="white" fontWeight="medium">
                          {drop.deliveryAddress}
                        </Text>
                      </VStack>
                    </HStack>

                    {drop.items && drop.items.length > 0 && (
                      <Box 
                        p={3} 
                        bg="rgba(59, 130, 246, 0.1)" 
                        borderRadius="md"
                        border="1px solid"
                        borderColor="rgba(59, 130, 246, 0.3)"
                      >
                        <Text 
                          fontSize="sm" 
                          fontWeight="semibold" 
                          color="white" 
                          mb={2}
                        >
                          <Icon as={FaBox} mr={2} color="amber.400" />
                          Items ({drop.items.length}):
                        </Text>
                        <VStack align="stretch" spacing={1}>
                          {drop.items.map((item) => (
                            <Text key={item.id} fontSize="sm" color="white" opacity={0.9}>
                              • {item.name} x{item.quantity}
                            </Text>
                          ))}
                        </VStack>
                      </Box>
                    )}
                  </VStack>

                  {isNext && !isCompleted && (
                    <Button
                      colorScheme="green"
                      size="lg"
                      onClick={() => handleCompleteDrop(drop.id)}
                      isLoading={completingDropId === drop.id}
                      loadingText="Completing..."
                      position="relative"
                      overflow="hidden"
                      boxShadow="0 0 15px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.3)"
                      _hover={{
                        boxShadow: "0 0 20px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.4)",
                        transform: "scale(1.02)"
                      }}
                    >
                      ✅ Complete This Drop
                    </Button>
                  )}

                  {isCompleted && (
                    <Box 
                      p={3} 
                      bg="rgba(34, 197, 94, 0.1)" 
                      borderRadius="md"
                      border="1px solid"
                      borderColor="rgba(34, 197, 94, 0.3)"
                    >
                      <Text fontSize="sm" color="white" textAlign="center">
                        ✅ Completed Successfully
                      </Text>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          );
        })}

        {/* Summary at bottom */}
        {route.completedDrops === route.drops.length && (
          <Alert 
            status="success"
            bg="rgba(34, 197, 94, 0.2)"
            borderColor="green.500"
            borderWidth="2px"
            borderRadius="lg"
          >
            <AlertIcon color="green.500" />
            <Box flex={1}>
              <AlertTitle color="white">All Drops Completed! 🎉</AlertTitle>
              <AlertDescription color="white" opacity={0.9}>
                Great job! All deliveries have been completed successfully.
              </AlertDescription>
            </Box>
          </Alert>
        )}
      </VStack>
    </DriverShell>
  );
}

