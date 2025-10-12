'use client';

import React from 'react';
import {
  Box as Card,
  Box as CardBody,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Box,
  Divider,
  Icon,
  Flex,
  useColorModeValue,
  Link as ChakraLink,
  Tooltip,
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
} from 'react-icons/fa';

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

interface EnhancedJobCardProps {
  job: Job;
  onAccept?: (jobId: string) => void;
  onDecline?: (jobId: string) => void;
  onViewDetails?: (jobId: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
  variant?: 'assigned' | 'available';
}

export function EnhancedJobCard({
  job,
  onAccept,
  onDecline,
  onViewDetails,
  isAccepting = false,
  isDeclining = false,
  variant = 'available'
}: EnhancedJobCardProps) {
  // Use Admin dashboard styling - dark theme with neon accents
  const bgColor = 'bg.card';
  const borderColor = 'border.primary';
  const textColor = 'text.primary';
  const textSecondary = 'text.secondary';
  const primaryColor = variant === 'assigned' ? 'neon' : 'brand';
  const statusColor = variant === 'assigned' ? 'neon.500' : 'brand.500';

  const handleCallCustomer = () => {
    window.open(`tel:${job.customerPhone}`, '_self');
  };

  const handleOpenMap = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'normal': return 'green';
      default: return 'gray';
    }
  };

  const getPriorityNeonColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': 
        return {
          shadow: "0 0 20px rgba(239, 68, 68, 0.5), 0 0 40px rgba(239, 68, 68, 0.3)",
          hoverShadow: "0 0 30px rgba(239, 68, 68, 0.7), 0 0 60px rgba(239, 68, 68, 0.4)",
          animation: "pulse-red-job 3s ease-in-out infinite"
        };
      case 'high': 
        return {
          shadow: "0 0 20px rgba(251, 191, 36, 0.5), 0 0 40px rgba(251, 191, 36, 0.3)",
          hoverShadow: "0 0 30px rgba(251, 191, 36, 0.7), 0 0 60px rgba(251, 191, 36, 0.4)",
          animation: "pulse-amber-job 3s ease-in-out infinite"
        };
      case 'normal': 
        return {
          shadow: "0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(34, 197, 94, 0.3)",
          hoverShadow: "0 0 30px rgba(34, 197, 94, 0.7), 0 0 60px rgba(34, 197, 94, 0.4)",
          animation: "pulse-green-job 3s ease-in-out infinite"
        };
      default: 
        return {
          shadow: "0 0 20px rgba(59, 130, 246, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)",
          hoverShadow: "0 0 30px rgba(59, 130, 246, 0.7), 0 0 60px rgba(59, 130, 246, 0.4)",
          animation: "pulse-blue-job 3s ease-in-out infinite"
        };
    }
  };

  const neonEffect = getPriorityNeonColor(job.priority);

  return (
    <Card
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      position="relative"
      overflow="hidden"
      cursor="pointer"
      transition="all 0.3s"
      animation={neonEffect.animation}
      _hover={{
        transform: 'translateY(-4px)',
        borderColor: 'border.neon',
        _before: {
          content: '""',
          position: "absolute",
          top: "0",
          left: "-100%",
          width: "100%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
          animation: "wave-job 0.8s ease-out",
          zIndex: 1
        }
      }}
      sx={{
        "@keyframes pulse-red-job": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(239, 68, 68, 0.4), 0 0 30px rgba(239, 68, 68, 0.2)" },
          "50%": { boxShadow: "0 0 30px rgba(239, 68, 68, 0.7), 0 0 60px rgba(239, 68, 68, 0.4)" }
        },
        "@keyframes pulse-amber-job": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(251, 191, 36, 0.4), 0 0 30px rgba(251, 191, 36, 0.2)" },
          "50%": { boxShadow: "0 0 30px rgba(251, 191, 36, 0.7), 0 0 60px rgba(251, 191, 36, 0.4)" }
        },
        "@keyframes pulse-green-job": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(34, 197, 94, 0.4), 0 0 30px rgba(34, 197, 94, 0.2)" },
          "50%": { boxShadow: "0 0 30px rgba(34, 197, 94, 0.7), 0 0 60px rgba(34, 197, 94, 0.4)" }
        },
        "@keyframes pulse-blue-job": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.2)" },
          "50%": { boxShadow: "0 0 30px rgba(59, 130, 246, 0.7), 0 0 60px rgba(59, 130, 246, 0.4)" }
        },
        "@keyframes wave-job": {
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
      <CardBody p={{ base: 5, md: 6 }} px={{ base: 6, md: 7 }} position="relative" zIndex={2}>
        <VStack spacing={{ base: 6, md: 7 }} align="stretch">
          {/* Header with Job ID and Price */}
          <Flex justify="space-between" align="center">
            <VStack align="start" spacing={1}>
              <Text
                fontWeight="bold"
                fontSize="lg"
                color="white"
                fontFamily="mono"
                textShadow="0 0 10px rgba(255, 255, 255, 0.6)"
              >
                {job.reference}
              </Text>
              {job.priority && (
                <Badge
                  colorScheme={getPriorityColor(job.priority)}
                  size="sm"
                  borderRadius="full"
                  px={3}
                  py={1}
                >
                  {job.priority.toUpperCase()}
                </Badge>
              )}
            </VStack>
            <VStack align="end" spacing={1}>
              <Text
                fontWeight="800"
                fontSize="2xl"
                color="white"
                textShadow="0 0 15px rgba(34, 197, 94, 0.8), 0 0 30px rgba(34, 197, 94, 0.5)"
              >
                £{isNaN(Number(job.estimatedEarnings)) ? '0.00' : Number(job.estimatedEarnings).toFixed(2)}
              </Text>
              <Badge
                colorScheme={primaryColor}
                size="lg"
                borderRadius="full"
                px={3}
                py={1}
                boxShadow="0 0 10px rgba(59, 130, 246, 0.6)"
              >
                {job.status.toUpperCase()}
              </Badge>
            </VStack>
          </Flex>

          <Divider borderColor="border.primary" borderWidth="1px" />

          {/* Customer Information */}
          <Box>
            <Text 
              fontWeight="semibold" 
              color="white" 
              mb={3} 
              fontSize="md"
              textShadow="0 0 8px rgba(255, 255, 255, 0.5)"
            >
              Customer Details
            </Text>
            <VStack spacing={4} align="stretch">
              <HStack spacing={4} align="center">
                <Icon as={FaUser} color={statusColor} boxSize={4} />
                <Text
                  fontWeight="medium"
                  color="white"
                  fontSize="16px"
                  lineHeight="24px"
                  flex="1"
                  textShadow="0 0 6px rgba(255, 255, 255, 0.4)"
                >
                  {job.customer || 'No customer info'}
                </Text>
              </HStack>
              <HStack spacing={4} align="center">
                <Icon as={FaPhone} color={statusColor} boxSize={4} />
                <Text
                  color="white"
                  fontSize="16px"
                  lineHeight="24px"
                  flex="1"
                  textShadow="0 0 6px rgba(255, 255, 255, 0.4)"
                >
                  {job.customerPhone || 'No contact info'}
                </Text>
                {job.customerPhone ? (
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
                ) : null}
              </HStack>
            </VStack>
          </Box>

          <Divider borderColor="border.primary" borderWidth="1px" />

          {/* Pickup Location */}
          <Box>
            <HStack spacing={3} mb={4} align="center">
              <Box
                p={2}
                borderRadius="lg"
                bg="bg.surface"
                border="1px solid"
                borderColor="border.secondary"
              >
                <Icon as={FaMapMarkerAlt} color="success.500" boxSize={5} />
              </Box>
              <Text 
                fontWeight="bold" 
                color="white" 
                fontSize="lg"
                textShadow="0 0 10px rgba(34, 197, 94, 0.8), 0 0 20px rgba(34, 197, 94, 0.5)"
              >
                Pickup Location
              </Text>
            </HStack>
            <VStack align="stretch" spacing={3} pl={2}>
                <Text
                  fontWeight="semibold"
                  color="white"
                  fontSize="17px"
                  lineHeight="26px"
                  textShadow="0 0 8px rgba(255, 255, 255, 0.4)"
                >
                  {job.from}
                </Text>
              <HStack spacing={4} align="center">
                <Badge
                  colorScheme="green"
                  size="md"
                  px={3}
                  py={1}
                  borderRadius="lg"
                  fontWeight="medium"
                >
                  📅 {job.date} at {job.time}
                </Badge>
                <Tooltip label="Open in Maps" hasArrow>
                  <IconButton
                    aria-label="Open pickup location in maps"
                    icon={<FaMap />}
                    size="sm"
                    colorScheme="green"
                    variant="outline"
                    borderRadius="lg"
                    onClick={() => handleOpenMap(job.from)}
                    _hover={{
                      transform: 'scale(1.05)',
                      boxShadow: 'md'
                    }}
                  />
                </Tooltip>
              </HStack>
            </VStack>
          </Box>

          <Divider borderColor="border.primary" borderWidth="1px" />

          {/* Dropoff Location */}
          <Box>
            <HStack spacing={3} mb={4} align="center">
              <Box
                p={2}
                borderRadius="lg"
                bg="bg.surface"
                border="1px solid"
                borderColor="border.secondary"
              >
                <Icon as={FaMapMarkerAlt} color="error.500" boxSize={5} />
              </Box>
              <Text 
                fontWeight="bold" 
                color="white" 
                fontSize="lg"
                textShadow="0 0 10px rgba(239, 68, 68, 0.8), 0 0 20px rgba(239, 68, 68, 0.5)"
              >
                Dropoff Location
              </Text>
            </HStack>
            <VStack align="stretch" spacing={3} pl={2}>
              <Text
                fontWeight="semibold"
                color="white"
                fontSize="17px"
                lineHeight="26px"
                textShadow="0 0 8px rgba(255, 255, 255, 0.4)"
              >
                {job.to}
              </Text>
              <HStack spacing={4} align="center">
                <Badge
                  colorScheme="red"
                  size="md"
                  px={3}
                  py={1}
                  borderRadius="lg"
                  fontWeight="medium"
                  variant="subtle"
                >
                  📍 Distance: {job.distance}
                </Badge>
                <Tooltip label="Open in Maps" hasArrow>
                  <IconButton
                    aria-label="Open dropoff location in maps"
                    icon={<FaMap />}
                    size="sm"
                    colorScheme="red"
                    variant="outline"
                    borderRadius="lg"
                    onClick={() => handleOpenMap(job.to)}
                    _hover={{
                      transform: 'scale(1.05)',
                      boxShadow: 'md'
                    }}
                  />
                </Tooltip>
              </HStack>
            </VStack>
          </Box>

          <Divider borderColor="border.primary" borderWidth="1px" />

          {/* Job Details */}
          <Box>
            <Text 
              fontWeight="bold" 
              color="white" 
              mb={4} 
              fontSize="lg"
              textShadow="0 0 10px rgba(59, 130, 246, 0.8), 0 0 20px rgba(59, 130, 246, 0.5)"
            >
              Job Details
            </Text>
            <VStack spacing={4} align="stretch">
              <HStack spacing={4} align="center">
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="bg.surface"
                  border="1px solid"
                  borderColor="border.secondary"
                >
                  <Icon as={FaTruck} color="info.500" boxSize={5} />
                </Box>
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontSize="sm" color="white" fontWeight="medium" opacity={0.7}>Vehicle</Text>
                  <Text color="white" fontWeight="semibold" fontSize="16px" textShadow="0 0 6px rgba(255, 255, 255, 0.4)">{job.vehicleType}</Text>
                </VStack>
              </HStack>

              <HStack spacing={4} align="center">
                <Box
                  p={2}
                  borderRadius="lg"
                  bg="bg.surface"
                  border="1px solid"
                  borderColor="border.secondary"
                >
                  <Icon as={FaBox} color="info.500" boxSize={5} />
                </Box>
                <VStack align="start" spacing={0} flex={1}>
                  <Text fontSize="sm" color="white" fontWeight="medium" opacity={0.7}>Items</Text>
                  <Text color="white" fontWeight="semibold" fontSize="16px" textShadow="0 0 6px rgba(255, 255, 255, 0.4)">{job.items}</Text>
                </VStack>
              </HStack>
              
              {job.duration && (
                <HStack spacing={4} align="center">
                  <Box
                    p={2}
                    borderRadius="lg"
                    bg="bg.surface"
                    border="1px solid"
                    borderColor="border.secondary"
                  >
                    <Icon as={FaClock} color="info.500" boxSize={5} />
                  </Box>
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="sm" color="white" fontWeight="medium" opacity={0.7}>Duration</Text>
                    <Text color="white" fontWeight="semibold" fontSize="16px" textShadow="0 0 6px rgba(255, 255, 255, 0.4)">{job.duration}</Text>
                  </VStack>
                </HStack>
              )}

              {job.crew && (
                <HStack spacing={4} align="center">
                  <Box
                    p={2}
                    borderRadius="lg"
                    bg="bg.surface"
                    border="1px solid"
                    borderColor="border.secondary"
                  >
                    <Icon as={FaUser} color="info.500" boxSize={5} />
                  </Box>
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="sm" color="white" fontWeight="medium" opacity={0.7}>Crew</Text>
                    <Text color="white" fontWeight="semibold" fontSize="16px" textShadow="0 0 6px rgba(255, 255, 255, 0.4)">{job.crew}</Text>
                  </VStack>
                </HStack>
              )}
            </VStack>
          </Box>

          <Divider borderColor="border.primary" borderWidth="1px" />

          {/* Action Buttons */}
          <VStack spacing={3}>
            {onAccept && (
              <HStack spacing={3} width="full">
                <Button
                  colorScheme="green"
                  size="lg"
                  flex={1}
                  leftIcon={<FaCheckCircle />}
                  onClick={() => onAccept(job.id)}
                  isLoading={isAccepting}
                  loadingText="Accepting..."
                  borderRadius="xl"
                  fontWeight="bold"
                  fontSize="md"
                  py={6}
                  position="relative"
                  overflow="hidden"
                  boxShadow="0 0 15px rgba(34, 197, 94, 0.5), 0 0 30px rgba(34, 197, 94, 0.3)"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: "0 0 20px rgba(34, 197, 94, 0.7), 0 0 40px rgba(34, 197, 94, 0.4)",
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
                      animation: "ripple-accept 0.6s ease-out"
                    }
                  }}
                  sx={{
                    "@keyframes ripple-accept": {
                      "0%": { width: "0", height: "0", opacity: 1 },
                      "100%": { width: "300px", height: "300px", opacity: 0 }
                    }
                  }}
                >
                  ✅ Accept
                </Button>
                {onDecline && (
                  <Button
                    colorScheme="red"
                    size="lg"
                    flex={1}
                    leftIcon={<FaExclamationTriangle />}
                    onClick={() => onDecline(job.id)}
                    isLoading={isDeclining}
                    loadingText="Declining..."
                    borderRadius="xl"
                    fontWeight="bold"
                    fontSize="md"
                    py={6}
                    position="relative"
                    overflow="hidden"
                    boxShadow="0 0 15px rgba(239, 68, 68, 0.5), 0 0 30px rgba(239, 68, 68, 0.3)"
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: "0 0 20px rgba(239, 68, 68, 0.7), 0 0 40px rgba(239, 68, 68, 0.4)",
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
                        animation: "ripple-decline 0.6s ease-out"
                      }
                    }}
                    sx={{
                      "@keyframes ripple-decline": {
                        "0%": { width: "0", height: "0", opacity: 1 },
                        "100%": { width: "300px", height: "300px", opacity: 0 }
                      }
                    }}
                  >
                    ❌ Decline
                  </Button>
                )}
              </HStack>
            )}
            {onViewDetails && (
              <Button
                variant="outline"
                size="md"
                width="full"
                onClick={() => onViewDetails(job.id)}
                borderRadius="xl"
                borderColor="neon.500"
                color="white"
                position="relative"
                overflow="hidden"
                boxShadow="0 0 10px rgba(59, 130, 246, 0.4)"
                _hover={{
                  bg: "rgba(59, 130, 246, 0.1)",
                  borderColor: "neon.400",
                  boxShadow: "0 0 15px rgba(59, 130, 246, 0.6), 0 0 30px rgba(59, 130, 246, 0.3)",
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
                    animation: "ripple-view 0.6s ease-out"
                  }
                }}
                sx={{
                  "@keyframes ripple-view": {
                    "0%": { width: "0", height: "0", opacity: 1 },
                    "100%": { width: "300px", height: "300px", opacity: 0 }
                  }
                }}
              >
                View Full Details
              </Button>
            )}
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  );
}
