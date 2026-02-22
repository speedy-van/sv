'use client';

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Icon,
  Tooltip,
  Button,
  useColorModeValue,
  SimpleGrid,
  Progress,
  Alert,
  AlertIcon,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import {
  FiArrowRight,
  FiArrowDown,
  FiArrowUp,
  FiMapPin,
  FiDollarSign,
  FiClock,
  FiNavigation,
  FiMaximize2,
  FiMinimize2,
  FiRefreshCw,
  FiInfo,
} from 'react-icons/fi';
import { format, differenceInHours, differenceInDays } from 'date-fns';

interface JourneySegment {
  id: string;
  segmentType: 'outbound' | 'return' | 'additional';
  sequenceNumber: number;
  scheduledAt: string;
  estimatedArrival?: string | null;
  priceGBP: number;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  pickupAddress?: {
    label: string;
    postcode: string;
    lat?: number | null;
    lng?: number | null;
  } | null;
  dropoffAddress?: {
    label: string;
    postcode: string;
    lat?: number | null;
    lng?: number | null;
  } | null;
  items?: any[];
  notes?: string | null;
}

interface JourneyRelationshipVisualizationProps {
  mainBooking: {
    id: string;
    reference: string;
    totalGBP: number;
    scheduledAt: string;
    status: string;
  };
  segments: JourneySegment[];
  onSegmentClick?: (segmentId: string) => void;
  onViewMap?: () => void;
  compact?: boolean;
}

export function JourneyRelationshipVisualization({
  mainBooking,
  segments,
  onSegmentClick,
  onViewMap,
  compact = false,
}: JourneyRelationshipVisualizationProps) {
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'timeline' | 'hierarchical' | 'map'>('hierarchical');
  const {
    isOpen: isMapModalOpen,
    onOpen: onMapModalOpen,
    onClose: onMapModalClose,
  } = useDisclosure();

  const bgColor = useColorModeValue('#0B1020', '#0B1020');
  const cardBg = useColorModeValue('#121A2B', '#121A2B');
  const textColor = useColorModeValue('#F5F8FF', '#F5F8FF');
  const borderColor = useColorModeValue('#2A3A5E', '#2A3A5E');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  const sortedSegments = [...segments].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  const outboundSegment = sortedSegments.find(s => s.segmentType === 'outbound');
  const returnSegments = sortedSegments.filter(s => s.segmentType === 'return');
  const additionalSegments = sortedSegments.filter(s => s.segmentType === 'additional');

  const totalSegmentsPrice = segments.reduce((sum, seg) => sum + seg.priceGBP, 0);
  const savings = totalSegmentsPrice - mainBooking.totalGBP;
  const savingsPercentage = totalSegmentsPrice > 0 ? (savings / totalSegmentsPrice) * 100 : 0;

  const formatCurrency = (amount: number) => `£${(amount / 100).toFixed(2)}`;
  const formatDateTime = (value: string) => format(new Date(value), 'dd MMM, HH:mm');
  const formatDistance = (meters?: number | null) => {
    if (!meters) return 'N/A';
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };
  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const toggleSegment = (segmentId: string) => {
    const newExpanded = new Set(expandedSegments);
    if (newExpanded.has(segmentId)) {
      newExpanded.delete(segmentId);
    } else {
      newExpanded.add(segmentId);
    }
    setExpandedSegments(newExpanded);
  };

  if (segments.length <= 1) {
    return null;
  }

  return (
    <VStack align="stretch" spacing={4}>
      {/* Header with Controls */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardHeader>
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Text fontWeight="bold" fontSize="lg" color={textColor}>
                Journey Relationship Visualization
              </Text>
              <Badge colorScheme="purple" size="md">
                {segments.length} Journey{segments.length > 1 ? 's' : ''}
              </Badge>
            </HStack>
            <HStack spacing={2}>
              <Button
                size="sm"
                leftIcon={<FiRefreshCw />}
                onClick={() => setViewMode(viewMode === 'hierarchical' ? 'timeline' : 'hierarchical')}
                variant="outline"
                borderColor={borderColor}
                color={textColor}
                _hover={{ bg: '#18233A' }}
              >
                {viewMode === 'hierarchical' ? 'Timeline View' : 'Hierarchical View'}
              </Button>
              {onViewMap && (
                <Button
                  size="sm"
                  leftIcon={<FiMapPin />}
                  onClick={onViewMap}
                  bg="#2563eb"
                  color="#F5F8FF"
                  _hover={{ bg: '#1d4ed8' }}
                >
                  View Map
                </Button>
              )}
            </HStack>
          </HStack>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <SimpleGrid columns={4} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color={secondaryTextColor}>Total Value</Text>
              <Text fontSize="xl" fontWeight="bold" color="#10b981">
                {formatCurrency(mainBooking.totalGBP)}
              </Text>
            </VStack>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color={secondaryTextColor}>Segments Total</Text>
              <Text fontSize="xl" fontWeight="bold" color={textColor}>
                {formatCurrency(totalSegmentsPrice)}
              </Text>
            </VStack>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color={secondaryTextColor}>Savings</Text>
              <Text fontSize="xl" fontWeight="bold" color={savings > 0 ? '#10b981' : '#ef4444'}>
                {formatCurrency(savings)}
              </Text>
            </VStack>
          </CardBody>
        </Card>
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <VStack align="start" spacing={1}>
              <Text fontSize="xs" color={secondaryTextColor}>Savings %</Text>
              <Text fontSize="xl" fontWeight="bold" color={savingsPercentage > 0 ? '#10b981' : '#ef4444'}>
                {savingsPercentage.toFixed(1)}%
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Hierarchical View */}
      {viewMode === 'hierarchical' && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth={2} borderRadius="lg">
          <CardBody>
            <VStack align="stretch" spacing={4}>
              {/* Outbound Journey */}
              {outboundSegment && (
                <Box
                  p={4}
                  bg="rgba(59, 130, 246, 0.15)"
                  borderRadius="md"
                  borderWidth={2}
                  borderColor="#3b82f6"
                  position="relative"
                  cursor={onSegmentClick ? 'pointer' : 'default'}
                  onClick={() => onSegmentClick?.(outboundSegment.id)}
                  _hover={onSegmentClick ? { bg: 'rgba(59, 130, 246, 0.25)' } : {}}
                  transition="all 0.2s"
                >
                  <VStack align="stretch" spacing={3}>
                    <HStack justify="space-between">
                      <HStack spacing={2}>
                        <Badge colorScheme="blue" size="lg" px={3} py={1}>
                          📦 Outbound Journey
                        </Badge>
                        <Badge colorScheme="gray" size="sm">
                          Sequence #1
                        </Badge>
                      </HStack>
                      <HStack spacing={3}>
                        <VStack align="end" spacing={0}>
                          <Text fontSize="lg" fontWeight="bold" color="#3b82f6">
                            {formatCurrency(outboundSegment.priceGBP)}
                          </Text>
                          {outboundSegment.distanceMeters && (
                            <Text fontSize="xs" color={secondaryTextColor}>
                              {formatDistance(outboundSegment.distanceMeters)}
                            </Text>
                          )}
                        </VStack>
                        <IconButton
                          aria-label="Toggle details"
                          icon={expandedSegments.has(outboundSegment.id) ? <FiMinimize2 /> : <FiMaximize2 />}
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSegment(outboundSegment.id);
                          }}
                        />
                      </HStack>
                    </HStack>

                    <HStack spacing={4} fontSize="sm" color={textColor}>
                      <HStack spacing={1}>
                        <Icon as={FiMapPin} color="#3b82f6" />
                        <Text fontWeight="bold">From:</Text>
                        <Text>{outboundSegment.pickupAddress?.postcode || 'N/A'}</Text>
                      </HStack>
                      <Icon as={FiArrowRight} color={secondaryTextColor} />
                      <HStack spacing={1}>
                        <Icon as={FiMapPin} color="#ef4444" />
                        <Text fontWeight="bold">To:</Text>
                        <Text>{outboundSegment.dropoffAddress?.postcode || 'N/A'}</Text>
                      </HStack>
                    </HStack>

                    <HStack spacing={4} fontSize="xs" color={secondaryTextColor}>
                      <HStack spacing={1}>
                        <Icon as={FiClock} />
                        <Text>{formatDateTime(outboundSegment.scheduledAt)}</Text>
                      </HStack>
                      {outboundSegment.durationSeconds && (
                        <HStack spacing={1}>
                          <Icon as={FiNavigation} />
                          <Text>{formatDuration(outboundSegment.durationSeconds)}</Text>
                        </HStack>
                      )}
                    </HStack>

                    {expandedSegments.has(outboundSegment.id) && (
                      <VStack align="stretch" spacing={2} mt={3} pt={3} borderTopWidth={1} borderColor={borderColor}>
                        <Text fontSize="xs" fontWeight="bold" color={textColor}>Full Addresses:</Text>
                        <HStack spacing={4} fontSize="xs" color={secondaryTextColor}>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">Pickup:</Text>
                            <Text>{outboundSegment.pickupAddress?.label || 'N/A'}</Text>
                          </VStack>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold">Dropoff:</Text>
                            <Text>{outboundSegment.dropoffAddress?.label || 'N/A'}</Text>
                          </VStack>
                        </HStack>
                        {outboundSegment.items && Array.isArray(outboundSegment.items) && outboundSegment.items.length > 0 && (
                          <Box>
                            <Text fontSize="xs" fontWeight="bold" color={textColor} mb={1}>Items:</Text>
                            <Text fontSize="xs" color={secondaryTextColor}>
                              {outboundSegment.items.map((item: any, idx: number) => 
                                `${item.name} (x${item.quantity})`
                              ).join(', ')}
                            </Text>
                          </Box>
                        )}
                        {outboundSegment.notes && (
                          <Box>
                            <Text fontSize="xs" fontWeight="bold" color={textColor} mb={1}>Notes:</Text>
                            <Text fontSize="xs" color={secondaryTextColor}>{outboundSegment.notes}</Text>
                          </Box>
                        )}
                      </VStack>
                    )}
                  </VStack>
                </Box>
              )}

              {/* Connection Lines and Return/Additional Journeys */}
              {(returnSegments.length > 0 || additionalSegments.length > 0) && (
                <>
                  <Box position="relative" h="40px" display="flex" alignItems="center" justifyContent="center">
                    <Box
                      position="absolute"
                      left="50%"
                      top="0"
                      transform="translateX(-50%)"
                      w="3px"
                      h="100%"
                      bg="linear-gradient(to bottom, #3b82f6, #10b981)"
                      borderRadius="full"
                    />
                    <Box
                      position="absolute"
                      left="50%"
                      top="50%"
                      transform="translate(-50%, -50%)"
                      bg={cardBg}
                      p={2}
                      borderRadius="full"
                      borderWidth={2}
                      borderColor="#10b981"
                    >
                      <Icon as={FiArrowDown} color="#10b981" boxSize={5} />
                    </Box>
                  </Box>

                  {/* Return Journeys */}
                  {returnSegments.map((segment, index) => (
                    <React.Fragment key={segment.id}>
                      <Box
                        p={4}
                        bg="rgba(16, 185, 129, 0.15)"
                        borderRadius="md"
                        borderWidth={2}
                        borderColor="#10b981"
                        position="relative"
                        ml={6}
                        cursor={onSegmentClick ? 'pointer' : 'default'}
                        onClick={() => onSegmentClick?.(segment.id)}
                        _hover={onSegmentClick ? { bg: 'rgba(16, 185, 129, 0.25)' } : {}}
                        transition="all 0.2s"
                      >
                        <VStack align="stretch" spacing={3}>
                          <HStack justify="space-between">
                            <HStack spacing={2}>
                              <Badge colorScheme="green" size="lg" px={3} py={1}>
                                🔄 Return Journey
                              </Badge>
                              <Badge colorScheme="gray" size="sm">
                                Sequence #{segment.sequenceNumber + 1}
                              </Badge>
                            </HStack>
                            <HStack spacing={3}>
                              <VStack align="end" spacing={0}>
                                <Text fontSize="lg" fontWeight="bold" color="#10b981">
                                  {formatCurrency(segment.priceGBP)}
                                </Text>
                                {segment.distanceMeters && (
                                  <Text fontSize="xs" color={secondaryTextColor}>
                                    {formatDistance(segment.distanceMeters)}
                                  </Text>
                                )}
                              </VStack>
                              <IconButton
                                aria-label="Toggle details"
                                icon={expandedSegments.has(segment.id) ? <FiMinimize2 /> : <FiMaximize2 />}
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSegment(segment.id);
                                }}
                              />
                            </HStack>
                          </HStack>

                          <HStack spacing={4} fontSize="sm" color={textColor}>
                            <HStack spacing={1}>
                              <Icon as={FiMapPin} color="#10b981" />
                              <Text fontWeight="bold">From:</Text>
                              <Text>{segment.pickupAddress?.postcode || 'N/A'}</Text>
                            </HStack>
                            <Icon as={FiArrowRight} color={secondaryTextColor} />
                            <HStack spacing={1}>
                              <Icon as={FiMapPin} color="#ef4444" />
                              <Text fontWeight="bold">To:</Text>
                              <Text>{segment.dropoffAddress?.postcode || 'N/A'}</Text>
                            </HStack>
                          </HStack>

                          <HStack spacing={4} fontSize="xs" color={secondaryTextColor}>
                            <HStack spacing={1}>
                              <Icon as={FiClock} />
                              <Text>{formatDateTime(segment.scheduledAt)}</Text>
                            </HStack>
                            {segment.durationSeconds && (
                              <HStack spacing={1}>
                                <Icon as={FiNavigation} />
                                <Text>{formatDuration(segment.durationSeconds)}</Text>
                              </HStack>
                            )}
                          </HStack>

                          {expandedSegments.has(segment.id) && (
                            <VStack align="stretch" spacing={2} mt={3} pt={3} borderTopWidth={1} borderColor={borderColor}>
                              <Text fontSize="xs" fontWeight="bold" color={textColor}>Full Addresses:</Text>
                              <HStack spacing={4} fontSize="xs" color={secondaryTextColor}>
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold">Pickup:</Text>
                                  <Text>{segment.pickupAddress?.label || 'N/A'}</Text>
                                </VStack>
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold">Dropoff:</Text>
                                  <Text>{segment.dropoffAddress?.label || 'N/A'}</Text>
                                </VStack>
                              </HStack>
                              {segment.items && Array.isArray(segment.items) && segment.items.length > 0 && (
                                <Box>
                                  <Text fontSize="xs" fontWeight="bold" color={textColor} mb={1}>Items:</Text>
                                  <Text fontSize="xs" color={secondaryTextColor}>
                                    {segment.items.map((item: any, idx: number) => 
                                      `${item.name} (x${item.quantity})`
                                    ).join(', ')}
                                  </Text>
                                </Box>
                              )}
                              {segment.notes && (
                                <Box>
                                  <Text fontSize="xs" fontWeight="bold" color={textColor} mb={1}>Notes:</Text>
                                  <Text fontSize="xs" color={secondaryTextColor}>{segment.notes}</Text>
                                </Box>
                              )}
                            </VStack>
                          )}
                        </VStack>
                      </Box>

                      {index < returnSegments.length - 1 && (
                        <Box position="relative" h="20px" display="flex" alignItems="center" ml={6}>
                          <Box
                            position="absolute"
                            left="50%"
                            top="0"
                            transform="translateX(-50%)"
                            w="2px"
                            h="100%"
                            bg={borderColor}
                          />
                        </Box>
                      )}
                    </React.Fragment>
                  ))}

                  {/* Additional Journeys */}
                  {additionalSegments.map((segment, index) => (
                    <React.Fragment key={segment.id}>
                      {(returnSegments.length > 0 || index > 0) && (
                        <Box position="relative" h="20px" display="flex" alignItems="center" ml={6}>
                          <Box
                            position="absolute"
                            left="50%"
                            top="0"
                            transform="translateX(-50%)"
                            w="2px"
                            h="100%"
                            bg={borderColor}
                          />
                        </Box>
                      )}

                      <Box
                        p={4}
                        bg="rgba(6, 182, 212, 0.15)"
                        borderRadius="md"
                        borderWidth={2}
                        borderColor="#06b6d4"
                        position="relative"
                        ml={6}
                        cursor={onSegmentClick ? 'pointer' : 'default'}
                        onClick={() => onSegmentClick?.(segment.id)}
                        _hover={onSegmentClick ? { bg: 'rgba(6, 182, 212, 0.25)' } : {}}
                        transition="all 0.2s"
                      >
                        <VStack align="stretch" spacing={3}>
                          <HStack justify="space-between">
                            <HStack spacing={2}>
                              <Badge colorScheme="cyan" size="lg" px={3} py={1}>
                                ➕ Additional Journey #{index + 1}
                              </Badge>
                              <Badge colorScheme="gray" size="sm">
                                Sequence #{segment.sequenceNumber + 1}
                              </Badge>
                            </HStack>
                            <HStack spacing={3}>
                              <VStack align="end" spacing={0}>
                                <Text fontSize="lg" fontWeight="bold" color="#06b6d4">
                                  {formatCurrency(segment.priceGBP)}
                                </Text>
                                {segment.distanceMeters && (
                                  <Text fontSize="xs" color={secondaryTextColor}>
                                    {formatDistance(segment.distanceMeters)}
                                  </Text>
                                )}
                              </VStack>
                              <IconButton
                                aria-label="Toggle details"
                                icon={expandedSegments.has(segment.id) ? <FiMinimize2 /> : <FiMaximize2 />}
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSegment(segment.id);
                                }}
                              />
                            </HStack>
                          </HStack>

                          <HStack spacing={4} fontSize="sm" color={textColor}>
                            <HStack spacing={1}>
                              <Icon as={FiMapPin} color="#06b6d4" />
                              <Text fontWeight="bold">From:</Text>
                              <Text>{segment.pickupAddress?.postcode || 'N/A'}</Text>
                            </HStack>
                            <Icon as={FiArrowRight} color={secondaryTextColor} />
                            <HStack spacing={1}>
                              <Icon as={FiMapPin} color="#ef4444" />
                              <Text fontWeight="bold">To:</Text>
                              <Text>{segment.dropoffAddress?.postcode || 'N/A'}</Text>
                            </HStack>
                          </HStack>

                          <HStack spacing={4} fontSize="xs" color={secondaryTextColor}>
                            <HStack spacing={1}>
                              <Icon as={FiClock} />
                              <Text>{formatDateTime(segment.scheduledAt)}</Text>
                            </HStack>
                            {segment.durationSeconds && (
                              <HStack spacing={1}>
                                <Icon as={FiNavigation} />
                                <Text>{formatDuration(segment.durationSeconds)}</Text>
                              </HStack>
                            )}
                          </HStack>

                          {expandedSegments.has(segment.id) && (
                            <VStack align="stretch" spacing={2} mt={3} pt={3} borderTopWidth={1} borderColor={borderColor}>
                              <Text fontSize="xs" fontWeight="bold" color={textColor}>Full Addresses:</Text>
                              <HStack spacing={4} fontSize="xs" color={secondaryTextColor}>
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold">Pickup:</Text>
                                  <Text>{segment.pickupAddress?.label || 'N/A'}</Text>
                                </VStack>
                                <VStack align="start" spacing={0}>
                                  <Text fontWeight="bold">Dropoff:</Text>
                                  <Text>{segment.dropoffAddress?.label || 'N/A'}</Text>
                                </VStack>
                              </HStack>
                              {segment.items && Array.isArray(segment.items) && segment.items.length > 0 && (
                                <Box>
                                  <Text fontSize="xs" fontWeight="bold" color={textColor} mb={1}>Items:</Text>
                                  <Text fontSize="xs" color={secondaryTextColor}>
                                    {segment.items.map((item: any, idx: number) => 
                                      `${item.name} (x${item.quantity})`
                                    ).join(', ')}
                                  </Text>
                                </Box>
                              )}
                              {segment.notes && (
                                <Box>
                                  <Text fontSize="xs" fontWeight="bold" color={textColor} mb={1}>Notes:</Text>
                                  <Text fontSize="xs" color={secondaryTextColor}>{segment.notes}</Text>
                                </Box>
                          )}
                            </VStack>
                          )}
                        </VStack>
                      </Box>
                    </React.Fragment>
                  ))}
                </>
              )}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth={2} borderRadius="lg">
          <CardBody>
            <VStack align="stretch" spacing={4} position="relative" pl={6}>
              {/* Vertical timeline line */}
              <Box
                position="absolute"
                left="10px"
                top="0"
                bottom="0"
                width="3px"
                bg="linear-gradient(to bottom, #3b82f6, #10b981, #06b6d4)"
                borderRadius="full"
              />

              {sortedSegments.map((segment, index) => {
                const isExpanded = expandedSegments.has(segment.id);
                const segmentColor =
                  segment.segmentType === 'outbound' ? '#3b82f6' :
                  segment.segmentType === 'return' ? '#10b981' : '#06b6d4';

                return (
                  <Box key={segment.id} position="relative">
                    {/* Timeline dot */}
                    <Box
                      position="absolute"
                      left="-28px"
                      top="20px"
                      w="20px"
                      h="20px"
                      borderRadius="full"
                      bg={segmentColor}
                      borderWidth={3}
                      borderColor={cardBg}
                      boxShadow="0 0 0 3px rgba(0,0,0,0.3)"
                    />

                    <Card
                      bg={cardBg}
                      borderColor={segmentColor}
                      borderWidth={2}
                      ml={4}
                      cursor={onSegmentClick ? 'pointer' : 'default'}
                      onClick={() => onSegmentClick?.(segment.id)}
                      _hover={onSegmentClick ? { transform: 'translateX(4px)' } : {}}
                      transition="all 0.2s"
                    >
                      <CardBody>
                        <VStack align="stretch" spacing={2}>
                          <HStack justify="space-between">
                            <HStack spacing={2}>
                              <Badge
                                colorScheme={
                                  segment.segmentType === 'outbound' ? 'blue' :
                                  segment.segmentType === 'return' ? 'green' : 'cyan'
                                }
                                size="md"
                              >
                                {segment.segmentType === 'outbound' ? '📦 Outbound' :
                                 segment.segmentType === 'return' ? '🔄 Return' : '➕ Additional'}
                              </Badge>
                              <Text fontSize="xs" color={secondaryTextColor}>
                                {formatDateTime(segment.scheduledAt)}
                              </Text>
                            </HStack>
                            <HStack spacing={2}>
                              <Text fontSize="lg" fontWeight="bold" color={segmentColor}>
                                {formatCurrency(segment.priceGBP)}
                              </Text>
                              <IconButton
                                aria-label="Toggle details"
                                icon={isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
                                size="xs"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSegment(segment.id);
                                }}
                              />
                            </HStack>
                          </HStack>

                          <HStack spacing={2} fontSize="sm" color={textColor}>
                            <Text>{segment.pickupAddress?.postcode || 'N/A'}</Text>
                            <Icon as={FiArrowRight} color={secondaryTextColor} />
                            <Text>{segment.dropoffAddress?.postcode || 'N/A'}</Text>
                          </HStack>

                          {isExpanded && (
                            <VStack align="stretch" spacing={2} mt={2} pt={2} borderTopWidth={1} borderColor={borderColor}>
                              <HStack spacing={4} fontSize="xs" color={secondaryTextColor}>
                                {segment.distanceMeters && (
                                  <HStack spacing={1}>
                                    <Icon as={FiNavigation} />
                                    <Text>{formatDistance(segment.distanceMeters)}</Text>
                                  </HStack>
                                )}
                                {segment.durationSeconds && (
                                  <HStack spacing={1}>
                                    <Icon as={FiClock} />
                                    <Text>{formatDuration(segment.durationSeconds)}</Text>
                                  </HStack>
                                )}
                              </HStack>
                              <Text fontSize="xs" color={secondaryTextColor}>
                                {segment.pickupAddress?.label} → {segment.dropoffAddress?.label}
                              </Text>
                            </VStack>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  </Box>
                );
              })}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Savings Alert */}
      {savings > 0 && (
        <Alert status="success" bg="rgba(16, 185, 129, 0.1)" borderColor="#10b981" borderWidth={1}>
          <AlertIcon color="#10b981" />
          <VStack align="start" spacing={0} flex={1}>
            <Text fontSize="sm" fontWeight="bold" color="#10b981">
              Customer Savings Applied
            </Text>
            <Text fontSize="xs" color={secondaryTextColor}>
              Combined booking saves {formatCurrency(savings)} ({savingsPercentage.toFixed(1)}%) compared to individual journeys
            </Text>
          </VStack>
        </Alert>
      )}
    </VStack>
  );
}

