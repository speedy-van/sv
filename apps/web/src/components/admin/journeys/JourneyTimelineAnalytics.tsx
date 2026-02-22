'use client';

import React, { useState, useEffect } from 'react';
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
  SimpleGrid,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  Spinner,
} from '@chakra-ui/react';
import {
  FiClock,
  FiMapPin,
  FiNavigation,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart2,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
} from 'react-icons/fi';
import { format, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

interface JourneySegment {
  id: string;
  segmentType: 'outbound' | 'return' | 'additional';
  sequenceNumber: number;
  scheduledAt: string;
  estimatedArrival?: string | null;
  actualStartTime?: string | null;
  actualCompletionTime?: string | null;
  status?: string;
  priceGBP: number;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
  items?: any[];
}

interface JourneyTimelineAnalyticsProps {
  mainBooking: {
    id: string;
    reference: string;
    createdAt: string;
    scheduledAt: string;
    status: string;
  };
  segments: JourneySegment[];
  onRefresh?: () => Promise<void>;
}

export function JourneyTimelineAnalytics({
  mainBooking,
  segments,
  onRefresh,
}: JourneyTimelineAnalyticsProps) {
  const [loading, setLoading] = useState(false);
  const cardBg = useColorModeValue('#121A2B', '#121A2B');
  const textColor = useColorModeValue('#F5F8FF', '#F5F8FF');
  const borderColor = useColorModeValue('#2A3A5E', '#2A3A5E');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  const sortedSegments = [...segments].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  // Calculate analytics
  const analytics = React.useMemo(() => {
    const completedSegments = sortedSegments.filter(s => 
      s.actualCompletionTime || s.status === 'completed' || s.status === 'COMPLETED'
    );
    const pendingSegments = sortedSegments.filter(s => 
      !s.actualCompletionTime && s.status !== 'completed' && s.status !== 'COMPLETED'
    );

    // On-time performance - only calculate if we have both estimated and actual times
    let onTimeCount = 0;
    let lateCount = 0;
    let earlyCount = 0;
    let segmentsWithTimeData = 0;

    completedSegments.forEach(segment => {
      if (segment.estimatedArrival && segment.actualCompletionTime) {
        segmentsWithTimeData++;
        const estimated = new Date(segment.estimatedArrival);
        const actual = new Date(segment.actualCompletionTime);
        const diffMinutes = differenceInMinutes(actual, estimated);
        
        if (Math.abs(diffMinutes) <= 5) {
          onTimeCount++;
        } else if (diffMinutes > 5) {
          lateCount++;
        } else {
          earlyCount++;
        }
      }
    });

    const onTimeRate = segmentsWithTimeData > 0
      ? (onTimeCount / segmentsWithTimeData) * 100
      : null; // null means no data available

    // Time gaps between journeys
    const timeGaps: number[] = [];
    for (let i = 0; i < sortedSegments.length - 1; i++) {
      const current = new Date(sortedSegments[i].scheduledAt);
      const next = new Date(sortedSegments[i + 1].scheduledAt);
      const gapHours = differenceInHours(next, current);
      timeGaps.push(gapHours);
    }

    const averageGap = timeGaps.length > 0
      ? timeGaps.reduce((sum, gap) => sum + gap, 0) / timeGaps.length
      : 0;

    // Total distance and duration
    const totalDistance = sortedSegments
      .filter(s => s.distanceMeters)
      .reduce((sum, s) => sum + (s.distanceMeters || 0), 0);
    
    const totalDuration = sortedSegments
      .filter(s => s.durationSeconds)
      .reduce((sum, s) => sum + (s.durationSeconds || 0), 0);

    // Price distribution
    const totalPrice = sortedSegments.reduce((sum, s) => sum + s.priceGBP, 0);
    const averagePricePerJourney = sortedSegments.length > 0
      ? totalPrice / sortedSegments.length
      : 0;

    // Journey efficiency
    const segmentsWithData = sortedSegments.filter(s => 
      s.distanceMeters && s.durationSeconds && s.durationSeconds > 0
    );
    const averageSpeed = segmentsWithData.length > 0
      ? segmentsWithData.reduce((sum, s) => {
          const km = (s.distanceMeters || 0) / 1000;
          const hours = (s.durationSeconds || 0) / 3600;
          return sum + (km / hours);
        }, 0) / segmentsWithData.length
      : 0;

    return {
      totalSegments: sortedSegments.length,
      completedSegments: completedSegments.length,
      pendingSegments: pendingSegments.length,
      completionRate: sortedSegments.length > 0
        ? (completedSegments.length / sortedSegments.length) * 100
        : 0,
      onTimeRate,
      onTimeCount,
      lateCount,
      earlyCount,
      segmentsWithTimeData,
      averageGap,
      totalDistance,
      totalDuration,
      totalPrice,
      averagePricePerJourney,
      averageSpeed,
      timeGaps,
      hasDistanceData: totalDistance > 0,
      hasSpeedData: averageSpeed > 0,
    };
  }, [sortedSegments]);

  const formatCurrency = (amount: number) => `£${(amount / 100).toFixed(2)}`;
  const formatDateTime = (value: string) => format(new Date(value), 'dd MMM yyyy, HH:mm');
  const formatTime = (value: string) => format(new Date(value), 'HH:mm');
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <VStack align="stretch" spacing={4}>
      {/* Analytics Summary */}
      <SimpleGrid columns={4} spacing={4}>
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel color={secondaryTextColor}>Completion Rate</StatLabel>
              <StatNumber color={textColor} fontSize="2xl">
                {analytics.completionRate > 0 || analytics.totalSegments === 0
                  ? `${analytics.completionRate.toFixed(1)}%`
                  : '0.0%'}
              </StatNumber>
              <StatHelpText>
                <Text fontSize="xs" color={secondaryTextColor}>
                  {analytics.completedSegments}/{analytics.totalSegments} completed
                  {analytics.completedSegments === 0 && analytics.totalSegments > 0 && (
                    <Text as="span" display="block" mt={1} color="orange.400" fontSize="xs">
                      No journeys completed yet
                    </Text>
                  )}
                </Text>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel color={secondaryTextColor}>On-Time Rate</StatLabel>
              <StatNumber color={textColor} fontSize="2xl">
                {analytics.onTimeRate !== null
                  ? `${analytics.onTimeRate.toFixed(1)}%`
                  : 'N/A'}
              </StatNumber>
              <StatHelpText>
                <Text fontSize="xs" color={secondaryTextColor}>
                  {analytics.onTimeRate !== null
                    ? `${analytics.onTimeCount} on-time, ${analytics.lateCount} late`
                    : analytics.segmentsWithTimeData === 0
                    ? 'No timing data available'
                    : 'Waiting for completion data'}
                </Text>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel color={secondaryTextColor}>Total Distance</StatLabel>
              <StatNumber color={textColor} fontSize="2xl">
                {analytics.hasDistanceData
                  ? formatDistance(analytics.totalDistance)
                  : 'N/A'}
              </StatNumber>
              <StatHelpText>
                <Text fontSize="xs" color={secondaryTextColor}>
                  {analytics.totalSegments} journey{analytics.totalSegments > 1 ? 's' : ''}
                  {!analytics.hasDistanceData && (
                    <Text as="span" display="block" mt={1} color="orange.400" fontSize="xs">
                      Distance data not available
                    </Text>
                  )}
                </Text>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>

        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardBody>
            <Stat>
              <StatLabel color={secondaryTextColor}>Average Speed</StatLabel>
              <StatNumber color={textColor} fontSize="2xl">
                {analytics.hasSpeedData
                  ? `${analytics.averageSpeed.toFixed(1)} km/h`
                  : 'N/A'}
              </StatNumber>
              <StatHelpText>
                <Text fontSize="xs" color={secondaryTextColor}>
                  {analytics.hasSpeedData
                    ? 'Across all journeys'
                    : 'Speed data requires distance & duration'}
                </Text>
              </StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Timeline View */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardHeader>
          <HStack spacing={2}>
            <Icon as={FiClock} color="#2563eb" boxSize={5} />
            <Text fontWeight="bold" fontSize="lg" color={textColor}>
              Journey Timeline
            </Text>
          </HStack>
        </CardHeader>
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

            {/* Booking Creation */}
            <Box position="relative">
              <Box
                position="absolute"
                left="-28px"
                top="20px"
                w="20px"
                h="20px"
                borderRadius="full"
                bg="#9333ea"
                borderWidth={3}
                borderColor={cardBg}
                boxShadow="0 0 0 3px rgba(0,0,0,0.3)"
              />
              <Card bg={cardBg} borderColor="#9333ea" borderWidth={2} ml={4}>
                <CardBody>
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Badge colorScheme="purple" size="sm">Booking Created</Badge>
                      <Text fontSize="sm" color={textColor} fontWeight="bold">
                        {mainBooking.reference}
                      </Text>
                      <Text fontSize="xs" color={secondaryTextColor}>
                        {formatDateTime(mainBooking.createdAt)}
                      </Text>
                    </VStack>
                    <Badge colorScheme={mainBooking.status === 'completed' ? 'green' : 'yellow'} size="sm">
                      {mainBooking.status}
                    </Badge>
                  </HStack>
                </CardBody>
              </Card>
            </Box>

            {/* Journey Segments */}
            {sortedSegments.map((segment, index) => {
              const segmentColor =
                segment.segmentType === 'outbound' ? '#3b82f6' :
                segment.segmentType === 'return' ? '#10b981' : '#06b6d4';

              const isCompleted = segment.actualCompletionTime || segment.status === 'completed';
              const isInProgress = segment.actualStartTime && !segment.actualCompletionTime;
              const isPending = !segment.actualStartTime && !segment.actualCompletionTime;

              let delay = 0;
              if (segment.estimatedArrival && segment.actualCompletionTime) {
                const estimated = new Date(segment.estimatedArrival);
                const actual = new Date(segment.actualCompletionTime);
                delay = differenceInMinutes(actual, estimated);
              }

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
                    opacity={isCompleted ? 1 : isInProgress ? 0.9 : 0.7}
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
                               segment.segmentType === 'return' ? '🔄 Return' : '➕ Additional'} #{segment.sequenceNumber + 1}
                            </Badge>
                            {isCompleted && (
                              <Icon as={FiCheckCircle} color="#10b981" boxSize={4} />
                            )}
                            {isInProgress && (
                              <Icon as={FiActivity} color="#f59e0b" boxSize={4} />
                            )}
                            {isPending && (
                              <Icon as={FiClock} color={secondaryTextColor} boxSize={4} />
                            )}
                          </HStack>
                          <Text fontSize="lg" fontWeight="bold" color={segmentColor}>
                            {formatCurrency(segment.priceGBP)}
                          </Text>
                        </HStack>

                        <HStack spacing={4} fontSize="sm" color={textColor}>
                          <HStack spacing={1}>
                            <Icon as={FiMapPin} color={segmentColor} />
                            <Text>
                              Segment {segment.sequenceNumber + 1}
                            </Text>
                          </HStack>
                        </HStack>

                        <SimpleGrid columns={3} spacing={2} fontSize="xs" color={secondaryTextColor}>
                          <HStack spacing={1}>
                            <Icon as={FiClock} />
                            <Text>Scheduled: {formatTime(segment.scheduledAt)}</Text>
                          </HStack>
                          {segment.estimatedArrival && (
                            <HStack spacing={1}>
                              <Icon as={FiClock} />
                              <Text>Est: {formatTime(segment.estimatedArrival)}</Text>
                            </HStack>
                          )}
                          {segment.actualCompletionTime && (
                            <HStack spacing={1}>
                              <Icon as={FiCheckCircle} />
                              <Text>Actual: {formatTime(segment.actualCompletionTime)}</Text>
                            </HStack>
                          )}
                        </SimpleGrid>

                        {delay !== 0 && (
                          <HStack>
                            <Icon
                              as={delay > 0 ? FiAlertCircle : FiCheckCircle}
                              color={delay > 0 ? '#ef4444' : '#10b981'}
                            />
                            <Text
                              fontSize="xs"
                              color={delay > 0 ? '#ef4444' : '#10b981'}
                              fontWeight="bold"
                            >
                              {delay > 0 ? `Late by ${delay} minutes` : `Early by ${Math.abs(delay)} minutes`}
                            </Text>
                          </HStack>
                        )}

                        {segment.distanceMeters && segment.durationSeconds && (
                          <HStack spacing={4} fontSize="xs" color={secondaryTextColor}>
                            <HStack spacing={1}>
                              <Icon as={FiNavigation} />
                              <Text>{formatDistance(segment.distanceMeters)}</Text>
                            </HStack>
                            <HStack spacing={1}>
                              <Icon as={FiClock} />
                              <Text>{formatDuration(segment.durationSeconds)}</Text>
                            </HStack>
                            {segment.durationSeconds > 0 && (
                              <Text>
                                Avg: {((segment.distanceMeters / 1000) / (segment.durationSeconds / 3600)).toFixed(1)} km/h
                              </Text>
                            )}
                          </HStack>
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

      {/* Time Gaps Analysis */}
      {analytics.timeGaps.length > 0 && (
        <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <CardHeader>
            <HStack spacing={2}>
              <Icon as={FiBarChart2} color="#f59e0b" boxSize={5} />
              <Text fontWeight="bold" fontSize="md" color={textColor}>
                Time Gaps Between Journeys
              </Text>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between">
                <Text fontSize="sm" color={secondaryTextColor}>Average Gap</Text>
                <Text fontSize="lg" fontWeight="bold" color={textColor}>
                  {analytics.averageGap.toFixed(1)} hours
                </Text>
              </HStack>
              {analytics.timeGaps.map((gap, index) => (
                <HStack key={index} justify="space-between" p={2} bg="rgba(0,0,0,0.3)" borderRadius="md">
                  <Text fontSize="sm" color={textColor}>
                    Journey {index + 1} → {index + 2}
                  </Text>
                  <Badge
                    colorScheme={
                      gap < 2 ? 'red' :
                      gap < 6 ? 'yellow' : 'green'
                    }
                    size="sm"
                  >
                    {gap.toFixed(1)}h
                  </Badge>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Performance Insights */}
      <Card bg={cardBg} borderColor={borderColor} borderWidth={1}>
        <CardHeader>
          <HStack spacing={2}>
            <Icon as={FiActivity} color="#2563eb" boxSize={5} />
            <Text fontWeight="bold" fontSize="md" color={textColor}>
              Performance Insights
            </Text>
          </HStack>
        </CardHeader>
        <CardBody>
          <VStack align="stretch" spacing={3}>
            {analytics.onTimeRate && analytics.onTimeRate >= 90 && (
              <Alert status="success" bg="rgba(16, 185, 129, 0.1)" borderColor="#10b981" borderWidth={1}>
                <AlertIcon color="#10b981" />
                <Text fontSize="sm" color="#F5F8FF">
                  Excellent on-time performance! {analytics.onTimeRate.toFixed(1)}% of journeys completed on time.
                </Text>
              </Alert>
            )}
            {analytics.lateCount > analytics.onTimeCount && (
              <Alert status="warning" bg="rgba(245, 158, 11, 0.1)" borderColor="#f59e0b" borderWidth={1}>
                <AlertIcon color="#f59e0b" />
                <Text fontSize="sm" color="#F5F8FF">
                  {analytics.lateCount} journey{analytics.lateCount > 1 ? 's were' : ' was'} late. Consider adjusting schedules or optimizing routes.
                </Text>
              </Alert>
            )}
            {analytics.completionRate < 100 && (
              <Alert status="info" bg="rgba(37, 99, 235, 0.1)" borderColor="#2563eb" borderWidth={1}>
                <AlertIcon color="#2563eb" />
                <Text fontSize="sm" color="#F5F8FF">
                  {analytics.pendingSegments} journey{analytics.pendingSegments > 1 ? 's are' : ' is'} still pending completion.
                </Text>
              </Alert>
            )}
            {analytics.averageGap < 2 && analytics.timeGaps.length > 0 && (
              <Alert status="warning" bg="rgba(245, 158, 11, 0.1)" borderColor="#f59e0b" borderWidth={1}>
                <AlertIcon color="#f59e0b" />
                <Text fontSize="sm" color="#F5F8FF">
                  Short time gaps between journeys ({analytics.averageGap.toFixed(1)}h average). Ensure sufficient buffer time.
                </Text>
              </Alert>
            )}
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}

