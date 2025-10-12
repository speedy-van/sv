'use client';

import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  VStack,
  HStack,
  Text,
  Progress,
  Icon,
  Box,
  Divider,
  useColorModeValue,
  Flex,
  Circle,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import { 
  FaMapMarkerAlt, 
  FaClock, 
  FaRoute, 
  FaPoundSign,
  FaCheckCircle,
  FaTruck,
  FaExclamationTriangle,
  FaPlay,
  FaBox,
  FaUser
} from 'react-icons/fa';

export interface Drop {
  id: string;
  deliveryAddress: string;
  pickupAddress?: string;
  customerName: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'failed';
  serviceTier: 'economy' | 'standard' | 'premium';
  specialInstructions?: string;
  estimatedArrival?: string;
  items?: Array<{
    id: string;
    name: string;
    quantity: number;
    volumeM3: number;
  }>;
  booking?: {
    id?: string;
    reference?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    totalGBP?: number;
    pickupAddress?: string;
    dropoffAddress?: string;
  };
}

export interface Route {
  id: string;
  status: 'planned' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  drops: Drop[];
  estimatedDuration: number; // minutes
  estimatedDistance: number; // km
  estimatedEarnings: number; // GBP
  startTime: string;
  currentDropIndex?: number;
  performanceScore?: number;
  totalDistance?: number; // miles or km
  totalWorkers?: number; // 1 or 2
  hasCameras?: boolean; // If route requires cameras
}

interface RouteCardProps {
  route: Route;
  onAccept?: (routeId: string) => void;
  onReject?: (routeId: string) => void;
  onViewDetails?: (routeId: string) => void;
  onStartRoute?: (routeId: string) => void;
  isLoading?: boolean;
}

export const RouteCard: React.FC<RouteCardProps> = ({
  route,
  onAccept,
  onReject,
  onViewDetails,
  onStartRoute,
  isLoading = false
}) => {
  // Use Admin dashboard styling - dark theme with neon accents
  const cardBg = 'bg.card'; // Dark card background from admin theme
  const borderColor = 'border.primary'; // Neon blue border
  const textSecondary = 'text.secondary'; // Light gray text
  const textPrimary = 'text.primary'; // White text

  const { isOpen, onOpen, onClose } = useDisclosure();

  const completedDrops = route.drops.filter(drop => drop.status === 'completed').length;
  const progressPercentage = (completedDrops / route.drops.length) * 100;

  const getStatusColor = (status: Route['status']) => {
    switch (status) {
      case 'planned': return 'blue';
      case 'assigned': return 'orange';
      case 'in_progress': return 'green';
      case 'completed': return 'gray';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  const getDropStatusIcon = (status: Drop['status']) => {
    switch (status) {
      case 'completed': return FaCheckCircle;
      case 'in_progress': return FaTruck;
      case 'failed': return FaExclamationTriangle;
      default: return FaClock;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPriorityNeonColor = () => {
    const status = route.status;
    if (status === 'planned') {
      return {
        boxShadow: "0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)",
        animation: "pulse-route-blue 3s ease-in-out infinite"
      };
    } else if (status === 'assigned') {
      return {
        boxShadow: "0 0 20px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.3)",
        animation: "pulse-route-amber 3s ease-in-out infinite"
      };
    } else if (status === 'in_progress') {
      return {
        boxShadow: "0 0 20px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3)",
        animation: "pulse-route-green 3s ease-in-out infinite"
      };
    }
    return {
      boxShadow: "0 0 15px rgba(148, 163, 184, 0.5)",
      animation: "none"
    };
  };

  return (
    <Card
      bg={cardBg}
      borderColor={borderColor}
      borderWidth="1px"
      position="relative"
      overflow="hidden"
      {...getPriorityNeonColor()}
      transition="all 0.3s"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.5)",
        _before: {
          content: '""',
          position: "absolute",
          top: "0",
          left: "-100%",
          width: "100%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
          animation: "wave-route 1s ease-out",
          zIndex: 1
        }
      }}
      sx={{
        "@keyframes pulse-route-blue": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(59, 130, 246, 0.5), 0 0 30px rgba(59, 130, 246, 0.2)" },
          "50%": { boxShadow: "0 0 25px rgba(59, 130, 246, 0.8), 0 0 50px rgba(59, 130, 246, 0.4)" }
        },
        "@keyframes pulse-route-amber": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(251, 191, 36, 0.5), 0 0 30px rgba(251, 191, 36, 0.2)" },
          "50%": { boxShadow: "0 0 25px rgba(251, 191, 36, 0.8), 0 0 50px rgba(251, 191, 36, 0.4)" }
        },
        "@keyframes pulse-route-green": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(34, 197, 94, 0.5), 0 0 30px rgba(34, 197, 94, 0.2)" },
          "50%": { boxShadow: "0 0 25px rgba(34, 197, 94, 0.8), 0 0 50px rgba(34, 197, 94, 0.4)" }
        },
        "@keyframes wave-route": {
          "0%": { left: "-100%" },
          "100%": { left: "100%" }
        }
      }}
    >
      <CardHeader pb={2} position="relative" zIndex={2}>
        <Flex justify="space-between" align="center">
          <HStack>
            <Icon as={FaRoute} color="neon.500" />
            <VStack align="start" spacing={0}>
              <Text 
                fontWeight="bold" 
                fontSize="lg" 
                color="white"
                textShadow="0 0 10px rgba(59, 130, 246, 0.8)"
              >
                New Job Offer: {route.drops.length} Stops Route
              </Text>
              <Text fontSize="sm" color="white" opacity={0.8}>
                Route #{route.id.slice(-8)}
              </Text>
            </VStack>
          </HStack>
          <VStack align="end" spacing={1}>
            <Badge 
              colorScheme={getStatusColor(route.status)} 
              variant="solid"
              boxShadow="0 0 10px rgba(59, 130, 246, 0.5)"
            >
              {route.status.toUpperCase()}
            </Badge>
            <Text 
              fontSize="xl" 
              fontWeight="bold" 
              color="white"
              textShadow="0 0 15px rgba(34, 197, 94, 0.9), 0 0 30px rgba(34, 197, 94, 0.6)"
            >
              £{route.estimatedEarnings.toFixed(2)}
            </Text>
          </VStack>
        </Flex>
      </CardHeader>

      <CardBody pt={0} position="relative" zIndex={2}>
        <VStack spacing={4} align="stretch">
          {/* Route Summary Stats */}
          <VStack 
            spacing={3} 
            align="stretch"
            p={4}
            bg="rgba(59, 130, 246, 0.1)"
            borderRadius="lg"
            border="1px solid"
            borderColor="rgba(59, 130, 246, 0.3)"
          >
            <HStack justify="space-between">
              <HStack>
                <Icon as={FaMapMarkerAlt} color="neon.400" />
                <Text fontSize="sm" fontWeight="semibold" color="white">Total Distance:</Text>
              </HStack>
              <Text 
                fontSize="md" 
                fontWeight="bold" 
                color="white"
                textShadow="0 0 8px rgba(59, 130, 246, 0.8)"
              >
                {(route.totalDistance || route.estimatedDistance || 0).toFixed(1)} miles
              </Text>
            </HStack>

            <HStack justify="space-between">
              <HStack>
                <Icon as={FaClock} color="neon.400" />
                <Text fontSize="sm" fontWeight="semibold" color="white">Total Time:</Text>
              </HStack>
              <Text 
                fontSize="md" 
                fontWeight="bold" 
                color="white"
                textShadow="0 0 8px rgba(251, 191, 36, 0.8)"
              >
                {formatDuration(route.estimatedDuration)}
              </Text>
            </HStack>

            <HStack justify="space-between">
              <HStack>
                <Icon as={FaPoundSign} color="success.400" />
                <Text fontSize="sm" fontWeight="semibold" color="white">Total Money:</Text>
              </HStack>
              <Text 
                fontSize="md" 
                fontWeight="bold" 
                color="white"
                textShadow="0 0 8px rgba(34, 197, 94, 0.8)"
              >
                £{route.estimatedEarnings.toFixed(2)}
              </Text>
            </HStack>

            <HStack justify="space-between">
              <HStack>
                <Icon as={FaTruck} color="purple.400" />
                <Text fontSize="sm" fontWeight="semibold" color="white">Total Workers:</Text>
              </HStack>
              <Text 
                fontSize="md" 
                fontWeight="bold" 
                color="white"
                textShadow="0 0 8px rgba(168, 85, 247, 0.8)"
              >
                {route.totalWorkers || 1} {(route.totalWorkers || 1) > 1 ? 'workers' : 'worker'}
              </Text>
            </HStack>

            {route.hasCameras && (
              <HStack justify="space-between">
                <HStack>
                  <Text fontSize="lg">📹</Text>
                  <Text fontSize="sm" fontWeight="semibold" color="white">Cameras Required:</Text>
                </HStack>
                <Badge 
                  colorScheme="red" 
                  fontSize="sm"
                  boxShadow="0 0 10px rgba(239, 68, 68, 0.6)"
                >
                  YES - Record deliveries
                </Badge>
              </HStack>
            )}
          </VStack>

          {/* Progress Bar */}
          {route.status === 'in_progress' && (
            <Box>
              <Flex justify="space-between" mb={1}>
                <Text fontSize="sm" fontWeight="medium">
                  Progress: {completedDrops}/{route.drops.length} completed
                </Text>
                <Text fontSize="sm" color={textSecondary}>
                  {progressPercentage.toFixed(0)}%
                </Text>
              </Flex>
              <Progress 
                value={progressPercentage} 
                colorScheme="green" 
                size="sm" 
                borderRadius="full"
              />
            </Box>
          )}

          {/* Drop Preview */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>
              Stops Preview:
            </Text>
            <VStack spacing={2} align="stretch">
              {route.drops.slice(0, 3).map((drop, index) => {
                const StatusIcon = getDropStatusIcon(drop.status);
                return (
                  <HStack key={drop.id} spacing={3}>
                    <Circle size="6" bg="blue.100">
                      <Text fontSize="xs" fontWeight="bold" color="blue.600">
                        {index + 1}
                      </Text>
                    </Circle>
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm" fontWeight="medium">
                        {drop.deliveryAddress.split(',')[0]}
                      </Text>
                      <HStack>
                        <Text fontSize="xs" color={textSecondary}>
                          {formatTime(drop.timeWindowStart)} - {formatTime(drop.timeWindowEnd)}
                        </Text>
                        <Badge size="sm" colorScheme={drop.serviceTier === 'premium' ? 'purple' : 'blue'}>
                          {drop.serviceTier}
                        </Badge>
                      </HStack>
                    </VStack>
                    <Tooltip label={drop.status}>
                      <Icon as={StatusIcon} color={drop.status === 'completed' ? 'green.500' : 'gray.400'} />
                    </Tooltip>
                  </HStack>
                );
              })}
              {route.drops.length > 3 && (
                <Text fontSize="sm" color={textSecondary} textAlign="center">
                  +{route.drops.length - 3} more stops...
                </Text>
              )}
            </VStack>
          </Box>

          <Divider />

          {/* Action Buttons */}
          <VStack spacing={3} width="full">
            {route.status === 'planned' && onAccept && onReject && (
              <>
                <HStack spacing={3} width="full">
                  <Button
                    flex={1}
                    colorScheme="green"
                    size="lg"
                    onClick={() => onAccept(route.id)}
                    isLoading={isLoading}
                    loadingText="Accepting..."
                    position="relative"
                    overflow="hidden"
                    boxShadow="0 0 15px rgba(34, 197, 94, 0.6), 0 0 30px rgba(34, 197, 94, 0.3)"
                    _hover={{
                      boxShadow: "0 0 20px rgba(34, 197, 94, 0.8), 0 0 40px rgba(34, 197, 94, 0.4)",
                      transform: "scale(1.02)",
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
                        animation: "ripple-route-accept 0.6s ease-out"
                      }
                    }}
                    sx={{
                      "@keyframes ripple-route-accept": {
                        "0%": { width: "0", height: "0", opacity: 1 },
                        "100%": { width: "300px", height: "300px", opacity: 0 }
                      }
                    }}
                  >
                    ✅ Accept Route
                  </Button>
                  <Button
                    flex={1}
                    colorScheme="red"
                    size="lg"
                    variant="outline"
                    onClick={() => onReject(route.id)}
                    isDisabled={isLoading}
                    position="relative"
                    overflow="hidden"
                    boxShadow="0 0 15px rgba(239, 68, 68, 0.6), 0 0 30px rgba(239, 68, 68, 0.3)"
                    _hover={{
                      boxShadow: "0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)",
                      transform: "scale(1.02)",
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
                        animation: "ripple-route-decline 0.6s ease-out"
                      }
                    }}
                    sx={{
                      "@keyframes ripple-route-decline": {
                        "0%": { width: "0", height: "0", opacity: 1 },
                        "100%": { width: "300px", height: "300px", opacity: 0 }
                      }
                    }}
                  >
                    ❌ Decline
                  </Button>
                </HStack>
                <Box 
                  p={2} 
                  bg="rgba(239, 68, 68, 0.1)" 
                  borderRadius="md"
                  border="1px solid"
                  borderColor="rgba(239, 68, 68, 0.3)"
                >
                  <Text fontSize="xs" color="white" textAlign="center" opacity={0.9}>
                    ⚠️ Declining will affect your acceptance rate
                  </Text>
                </Box>
              </>
            )}

            {route.status === 'assigned' && onStartRoute && (
              <Button
                width="full"
                colorScheme="blue"
                size="lg"
                leftIcon={<Icon as={FaPlay} />}
                onClick={() => onStartRoute(route.id)}
                isLoading={isLoading}
                loadingText="Starting..."
                position="relative"
                overflow="hidden"
                boxShadow="0 0 15px rgba(59, 130, 246, 0.6)"
                _hover={{
                  boxShadow: "0 0 20px rgba(59, 130, 246, 0.8)",
                  transform: "scale(1.02)"
                }}
              >
                Start Route
              </Button>
            )}

            {onViewDetails && (
              <Button
                width="full"
                variant="outline"
                size="md"
                onClick={onOpen}
                borderColor="neon.500"
                color="white"
                position="relative"
                overflow="hidden"
                boxShadow="0 0 10px rgba(59, 130, 246, 0.4)"
                _hover={{
                  bg: "rgba(59, 130, 246, 0.1)",
                  borderColor: "neon.400",
                  boxShadow: "0 0 15px rgba(59, 130, 246, 0.6)"
                }}
              >
                👁️ View Details
              </Button>
            )}
          </VStack>
        </VStack>
      </CardBody>

      {/* View Details Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent 
          bg="bg.card" 
          borderColor="border.primary" 
          borderWidth="1px"
          boxShadow="0 0 30px rgba(59, 130, 246, 0.5)"
        >
          <ModalHeader 
            color="white"
            textShadow="0 0 15px rgba(59, 130, 246, 0.8)"
          >
            Route Details - {route.drops.length} Stops
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {route.drops.map((drop, index) => (
                <Box
                  key={drop.id}
                  p={4}
                  bg="rgba(59, 130, 246, 0.1)"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="rgba(59, 130, 246, 0.3)"
                  position="relative"
                  _hover={{
                    bg: "rgba(59, 130, 246, 0.15)",
                    borderColor: "rgba(59, 130, 246, 0.5)"
                  }}
                >
                  <VStack align="stretch" spacing={3}>
                    {/* Stop Header */}
                    <HStack justify="space-between">
                      <HStack>
                        <Circle size="8" bg="neon.500" color="white" fontWeight="bold">
                          {index + 1}
                        </Circle>
                        <VStack align="start" spacing={0}>
                          <Text 
                            fontWeight="bold" 
                            color="white"
                            textShadow="0 0 8px rgba(255, 255, 255, 0.6)"
                          >
                            {drop.customerName || drop.booking?.customerName || 'Unknown Customer'}
                          </Text>
                          <Text fontSize="xs" color="white" opacity={0.7}>
                            {drop.booking?.reference || drop.id.slice(-8)}
                          </Text>
                        </VStack>
                      </HStack>
                      <Badge 
                        colorScheme={drop.serviceTier === 'premium' ? 'purple' : 'blue'}
                        boxShadow="0 0 8px rgba(59, 130, 246, 0.5)"
                      >
                        {drop.serviceTier}
                      </Badge>
                    </HStack>

                    {/* Addresses */}
                    <VStack align="stretch" spacing={2}>
                      <HStack>
                        <Icon as={FaMapMarkerAlt} color="green.400" />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontSize="xs" color="white" opacity={0.7}>Pickup:</Text>
                          <Text fontSize="sm" color="white" fontWeight="medium">
                            {drop.pickupAddress || drop.booking?.pickupAddress || 'Not specified'}
                          </Text>
                        </VStack>
                      </HStack>

                      <HStack>
                        <Icon as={FaMapMarkerAlt} color="red.400" />
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontSize="xs" color="white" opacity={0.7}>Delivery:</Text>
                          <Text fontSize="sm" color="white" fontWeight="medium">
                            {drop.deliveryAddress || drop.booking?.dropoffAddress}
                          </Text>
                        </VStack>
                      </HStack>
                    </VStack>

                    {/* Time Window */}
                    <HStack>
                      <Icon as={FaClock} color="neon.400" />
                      <Text fontSize="sm" color="white">
                        {formatTime(drop.timeWindowStart)} - {formatTime(drop.timeWindowEnd)}
                      </Text>
                    </HStack>

                    {/* Items */}
                    {drop.items && drop.items.length > 0 && (
                      <Box>
                        <Text 
                          fontSize="sm" 
                          fontWeight="semibold" 
                          color="white" 
                          mb={2}
                          textShadow="0 0 6px rgba(255, 255, 255, 0.5)"
                        >
                          <Icon as={FaBox} mr={2} color="amber.400" />
                          Items ({drop.items.length}):
                        </Text>
                        <VStack align="stretch" spacing={1} pl={6}>
                          {drop.items.map((item) => (
                            <HStack key={item.id} justify="space-between">
                              <Text fontSize="sm" color="white" opacity={0.9}>
                                • {item.name}
                              </Text>
                              <Badge colorScheme="blue" fontSize="xs">
                                {item.quantity}x ({item.volumeM3.toFixed(2)}m³)
                              </Badge>
                            </HStack>
                          ))}
                        </VStack>
                      </Box>
                    )}

                    {/* Special Instructions */}
                    {drop.specialInstructions && (
                      <Box 
                        p={2} 
                        bg="rgba(251, 191, 36, 0.1)" 
                        borderRadius="md"
                        border="1px solid"
                        borderColor="rgba(251, 191, 36, 0.3)"
                      >
                        <Text fontSize="xs" color="white" opacity={0.9}>
                          📝 {drop.specialInstructions}
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} colorScheme="blue">
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
};

export default RouteCard;