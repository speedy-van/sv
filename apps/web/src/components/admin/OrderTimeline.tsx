'use client';

import React, { useState, useEffect } from 'react';
import {
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiUser,
  FiMail,
  FiTruck,
  FiDollarSign,
  FiEdit,
  FiAlertTriangle,
  FiNavigation,
} from 'react-icons/fi';
import { formatDistanceToNow, format } from 'date-fns';

interface TimelineEvent {
  id: string;
  type: 'created' | 'assigned' | 'updated' | 'payment' | 'refund' | 'cancelled' | 'communication' | 'job_event' | 'other';
  timestamp: string;
  user: {
    name: string;
    email: string;
  };
  details: string;
  metadata?: any;
}

interface OrderTimelineProps {
  orderCode: string;
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  cardBg?: string;
}

export function OrderTimeline({
  orderCode,
  bgColor = '#0B1020',
  textColor = '#F5F8FF',
  borderColor = '#2A3A5E',
  cardBg = '#121A2B',
}: OrderTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderCode) {
      fetchTimeline();
    }
  }, [orderCode]);

  const fetchTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderCode}/timeline`);
      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }
      const data = await response.json();
      if (data.success) {
        setEvents(data.events || []);
      } else {
        throw new Error(data.error || 'Failed to load timeline');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return FiCheckCircle;
      case 'assigned':
        return FiTruck;
      case 'updated':
        return FiEdit;
      case 'payment':
        return FiDollarSign;
      case 'refund':
        return FiDollarSign;
      case 'cancelled':
        return FiXCircle;
      case 'communication':
        return FiMail;
      case 'job_event':
        return FiNavigation;
      default:
        return FiClock;
    }
  };

  const getEventColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'created':
        return '#10b981';
      case 'assigned':
        return '#3b82f6';
      case 'updated':
        return '#f59e0b';
      case 'payment':
        return '#10b981';
      case 'refund':
        return '#ef4444';
      case 'cancelled':
        return '#ef4444';
      case 'communication':
        return '#06b6d4';
      case 'job_event':
        return '#8b5cf6';
      default:
        return '#9ca3af';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return {
        relative: formatDistanceToNow(date, { addSuffix: true }),
        absolute: format(date, 'PPpp'),
      };
    } catch {
      return {
        relative: 'Unknown time',
        absolute: timestamp,
      };
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <Spinner size="lg" color="#2563eb" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" bg={cardBg} borderColor={borderColor} borderRadius="md">
        <AlertIcon color="#ef4444" />
        <Text color={textColor}>{error}</Text>
      </Alert>
    );
  }

  if (events.length === 0) {
    return (
      <Box p={6} textAlign="center" bg={cardBg} borderRadius="md" borderWidth={1} borderColor={borderColor}>
        <Text color={textColor} fontSize="sm">
          No timeline events found for this order.
        </Text>
      </Box>
    );
  }

  return (
    <VStack align="stretch" spacing={0}>
      {events.map((event, index) => {
        const IconComponent = getEventIcon(event.type);
        const color = getEventColor(event.type);
        const timeInfo = formatTimestamp(event.timestamp);
        const isLast = index === events.length - 1;

        return (
          <React.Fragment key={event.id}>
            <HStack align="start" spacing={4} py={3}>
              {/* Timeline Line & Icon */}
              <VStack spacing={0} align="center" position="relative">
                <Box
                  position="relative"
                  zIndex={2}
                  p={2}
                  borderRadius="full"
                  bg={cardBg}
                  borderWidth="2px"
                  borderColor={color}
                >
                  <Icon as={IconComponent} color={color} boxSize={4} />
                </Box>
                {!isLast && (
                  <Box
                    position="absolute"
                    top="40px"
                    left="50%"
                    transform="translateX(-50%)"
                    w="2px"
                    h="calc(100% - 40px)"
                    bg={borderColor}
                    zIndex={1}
                  />
                )}
              </VStack>

              {/* Event Content */}
              <VStack align="start" spacing={1} flex={1}>
                <HStack justify="space-between" w="full">
                  <HStack spacing={2}>
                    <Badge
                      colorScheme={
                        event.type === 'created' ? 'green' :
                        event.type === 'assigned' ? 'blue' :
                        event.type === 'payment' ? 'green' :
                        event.type === 'refund' || event.type === 'cancelled' ? 'red' :
                        event.type === 'communication' ? 'cyan' :
                        'gray'
                      }
                      size="sm"
                      fontSize="xs"
                    >
                      {event.type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      {event.details}
                    </Text>
                  </HStack>
                  <Tooltip label={timeInfo.absolute} placement="left">
                    <Text fontSize="xs" color="#9ca3af">
                      {timeInfo.relative}
                    </Text>
                  </Tooltip>
                </HStack>

                <HStack spacing={2}>
                  <Icon as={FiUser} color="#9ca3af" boxSize={3} />
                  <Text fontSize="xs" color="#9ca3af">
                    {event.user.name}
                    {event.user.email && ` (${event.user.email})`}
                  </Text>
                </HStack>

                {/* Metadata Display */}
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <Box
                    mt={2}
                    p={2}
                    bg={bgColor}
                    borderRadius="md"
                    borderWidth={1}
                    borderColor={borderColor}
                    w="full"
                  >
                    <Text fontSize="xs" color="#9ca3af" mb={1}>
                      Details:
                    </Text>
                    {event.metadata.before && (
                      <Text fontSize="xs" color="#9ca3af">
                        Before: {JSON.stringify(event.metadata.before, null, 2)}
                      </Text>
                    )}
                    {event.metadata.after && (
                      <Text fontSize="xs" color={textColor}>
                        After: {JSON.stringify(event.metadata.after, null, 2)}
                      </Text>
                    )}
                  </Box>
                )}
              </VStack>
            </HStack>
            {!isLast && <Divider borderColor={borderColor} />}
          </React.Fragment>
        );
      })}
    </VStack>
  );
}

