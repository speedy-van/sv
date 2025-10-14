import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Badge,
  CloseButton,
  Flex,
  Progress,
  Icon,
  useColorModeValue,
  ScaleFade,
  Collapse,
  useDisclosure,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { useAudioNotification, showJobNotificationWithSound } from './AudioNotification';
import {
  FaBell,
  FaMapMarkerAlt,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaInfoCircle,
  FaChevronUp,
  FaChevronDown,
  FaLocationArrow,
  FaRoute,
} from 'react-icons/fa';

interface SmartAlert {
  id: string;
  type: 'location' | 'time' | 'status' | 'proximity' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    action: string;
    style?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  }>;
  autoHide?: boolean;
  hideAfter?: number; // milliseconds
  progress?: number; // 0-100 for progress bars
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

interface SmartNotificationsProps {
  alerts: SmartAlert[];
  onActionClick?: (alertId: string, action: string) => void;
  onDismiss?: (alertId: string) => void;
  maxVisible?: number;
  compactMode?: boolean;
}

const SmartNotifications: React.FC<SmartNotificationsProps> = ({
  alerts,
  onActionClick,
  onDismiss,
  maxVisible = 3,
  compactMode = false,
}) => {
  const [visibleAlerts, setVisibleAlerts] = useState<SmartAlert[]>([]);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [processedAlerts, setProcessedAlerts] = useState<Set<string>>(new Set());
  const { isOpen: showAll, onToggle: toggleShowAll } = useDisclosure();
  const audioNotification = useAudioNotification();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Sort alerts by priority and timestamp - memoized to prevent re-creation on every render
  const sortedAlerts = useMemo(() => {
    return [...alerts].sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [alerts]);

  // Memoized dismiss handler to prevent re-creation on every render
  const handleDismiss = useCallback((alertId: string) => {
    setVisibleAlerts(prev => prev.filter(alert => alert.id !== alertId));
    if (onDismiss) {
      onDismiss(alertId);
    }
  }, [onDismiss]);

  // Update visible alerts
  useEffect(() => {
    const alertsToShow = showAll ? sortedAlerts : sortedAlerts.slice(0, maxVisible);
    setVisibleAlerts(alertsToShow);
  }, [sortedAlerts, maxVisible, showAll]);

  // Auto-hide alerts
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    visibleAlerts.forEach(alert => {
      if (alert.autoHide && alert.hideAfter) {
        const timer = setTimeout(() => {
          handleDismiss(alert.id);
        }, alert.hideAfter);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [visibleAlerts, handleDismiss]);

  // Handle audio notifications for new alerts
  useEffect(() => {
    alerts.forEach(alert => {
      // Only play sound for new unprocessed alerts
      if (!processedAlerts.has(alert.id)) {
        setProcessedAlerts(prev => new Set([...prev, alert.id]));
        
        // Play sound based on alert type and priority
        const playNotificationSound = async () => {
          try {
            console.log(`🔊 New job alert received: ${alert.title}`);
            
            if (alert.priority === 'urgent' || alert.priority === 'high') {
              // Play urgent notification with browser notification
              await showJobNotificationWithSound(
                alert.title,
                alert.message,
                {
                  urgent: alert.priority === 'urgent',
                  requireInteraction: alert.priority === 'urgent',
                }
              );
            } else {
              // Play regular notification sound
              await audioNotification.play('job-notification');
            }
          } catch (error) {
            console.error('❌ Failed to play notification sound:', error);
          }
        };

        // Play sound only for important notifications:
        // 1. New job offers (high priority)
        // 2. Job acceptance confirmations 
        // 3. Proximity alerts when near destination
        // 4. Urgent system alerts
        // NOT for routine status updates or progress tracking
        const shouldPlaySound = (
          (alert.type === 'status' && (
            alert.title.includes('New Job') || 
            alert.title.includes('Job Offer') || 
            alert.title.includes('Accepted Successfully')
          )) ||
          alert.type === 'proximity' ||
          alert.priority === 'urgent'
        );
        
        if (shouldPlaySound) {
          playNotificationSound();
        }
      }
    });

    // Clean up old processed alerts (keep only recent ones)
    const currentAlertIds = new Set(alerts.map(alert => alert.id));
    setProcessedAlerts(prev => {
      const filtered = new Set<string>();
      prev.forEach(id => {
        if (currentAlertIds.has(id)) {
          filtered.add(id);
        }
      });
      return filtered;
    });
  }, [alerts, processedAlerts, audioNotification]);

  const handleAction = useCallback((alertId: string, action: string) => {
    if (onActionClick) {
      onActionClick(alertId, action);
    }
  }, [onActionClick]);

  const toggleExpanded = (alertId: string) => {
    setExpandedAlerts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(alertId)) {
        newSet.delete(alertId);
      } else {
        newSet.add(alertId);
      }
      return newSet;
    });
  };

  const getAlertIcon = (type: SmartAlert['type']) => {
    switch (type) {
      case 'location': return FaMapMarkerAlt;
      case 'time': return FaClock;
      case 'proximity': return FaLocationArrow;
      case 'status': return FaCheckCircle;
      case 'system': return FaInfoCircle;
      default: return FaBell;
    }
  };

  const getAlertStatus = (priority: SmartAlert['priority']) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  const getPriorityColor = (priority: SmartAlert['priority']) => {
    switch (priority) {
      case 'urgent': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <Box width="100%" maxWidth="500px">
      <VStack spacing={2} align="stretch">
        {visibleAlerts.map((alert) => {
          const isExpanded = expandedAlerts.has(alert.id);
          const AlertIcon = getAlertIcon(alert.type);
          
          return (
            <ScaleFade key={alert.id} initialScale={0.9} in={true}>
              <Alert
                status={getAlertStatus(alert.priority)}
                variant="subtle"
                borderRadius="lg"
                bg={bg}
                border="1px"
                borderColor={borderColor}
                boxShadow="sm"
                p={compactMode ? 3 : 4}
              >
                <Icon as={AlertIcon} />
                <Box flex="1" ml={2}>
                  <Flex justify="space-between" align="flex-start">
                    <VStack align="flex-start" spacing={1} flex="1">
                      <HStack spacing={2}>
                        <AlertTitle fontSize={compactMode ? 'sm' : 'md'} mb={0}>
                          {alert.title}
                        </AlertTitle>
                        <Badge
                          colorScheme={getPriorityColor(alert.priority)}
                          size="sm"
                          textTransform="uppercase"
                        >
                          {alert.priority}
                        </Badge>
                        <Text fontSize="xs" color="gray.500">
                          {formatTimeAgo(alert.timestamp)}
                        </Text>
                      </HStack>
                      
                      <AlertDescription fontSize={compactMode ? 'xs' : 'sm'}>
                        {alert.message}
                      </AlertDescription>

                      {/* Progress bar for time-sensitive alerts */}
                      {alert.progress !== undefined && (
                        <Box width="100%" mt={2}>
                          <Progress 
                            value={alert.progress} 
                            size="sm" 
                            colorScheme={getPriorityColor(alert.priority)}
                            borderRadius="full"
                          />
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {alert.progress}% complete
                          </Text>
                        </Box>
                      )}

                      {/* Location info */}
                      {alert.location && isExpanded && (
                        <Box mt={2} p={2} bg="gray.50" borderRadius="md" width="100%">
                          <HStack spacing={2}>
                            <Icon as={FaMapMarkerAlt} color="blue.500" />
                            <VStack align="flex-start" spacing={0}>
                              <Text fontSize="xs" fontWeight="bold">Location</Text>
                              {alert.location.address ? (
                                <Text fontSize="xs">{alert.location.address}</Text>
                              ) : (
                                <Text fontSize="xs">
                                  {alert.location.lat.toFixed(6)}, {alert.location.lng.toFixed(6)}
                                </Text>
                              )}
                            </VStack>
                          </HStack>
                        </Box>
                      )}

                      {/* Action buttons */}
                      {alert.actions && alert.actions.length > 0 && (
                        <Collapse in={isExpanded} animateOpacity>
                          <HStack spacing={2} mt={2} flexWrap="wrap">
                            {alert.actions.map((action, index) => (
                              <Button
                                key={index}
                                size="sm"
                                variant={action.style === 'primary' ? 'solid' : 'outline'}
                                colorScheme={
                                  action.style === 'danger' ? 'red' :
                                  action.style === 'warning' ? 'orange' :
                                  action.style === 'success' ? 'green' :
                                  'blue'
                                }
                                onClick={() => handleAction(alert.id, action.action)}
                              >
                                {action.label}
                              </Button>
                            ))}
                          </HStack>
                        </Collapse>
                      )}
                    </VStack>

                    {/* Alert controls */}
                    <HStack spacing={1}>
                      {(alert.actions?.length || alert.location) && (
                        <Tooltip label={isExpanded ? 'Collapse' : 'Expand details'}>
                          <IconButton
                            aria-label="Toggle details"
                            icon={isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleExpanded(alert.id)}
                          />
                        </Tooltip>
                      )}
                      
                      <Tooltip label="Dismiss">
                        <CloseButton
                          size="sm"
                          onClick={() => handleDismiss(alert.id)}
                        />
                      </Tooltip>
                    </HStack>
                  </Flex>
                </Box>
              </Alert>
            </ScaleFade>
          );
        })}

        {/* Show more/less button */}
        {sortedAlerts.length > maxVisible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleShowAll}
            leftIcon={showAll ? <FaChevronUp /> : <FaChevronDown />}
          >
            {showAll 
              ? `Show fewer (${maxVisible})` 
              : `Show all (${sortedAlerts.length - maxVisible} more)`
            }
          </Button>
        )}
      </VStack>
    </Box>
  );
};

// Helper function to create alerts
export const createSmartAlert = (
  type: SmartAlert['type'],
  priority: SmartAlert['priority'],
  title: string,
  message: string,
  options?: Partial<Pick<SmartAlert, 'actions' | 'autoHide' | 'hideAfter' | 'progress' | 'location'>>
): SmartAlert => ({
  id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  priority,
  title,
  message,
  timestamp: new Date(),
  ...options,
});

// Pre-built alert types for common scenarios
export const createProximityAlert = (
  location: string,
  distance: number,
  actions?: SmartAlert['actions']
): SmartAlert => createSmartAlert(
  'proximity',
  'medium',
  'Near Destination',
  `You are ${distance}m away from ${location}`,
  { actions, autoHide: true, hideAfter: 10000 }
);

export const createStatusUpdateAlert = (
  step: string,
  autoTriggered: boolean = false
): SmartAlert => createSmartAlert(
  'status',
  'low',
  'Status Updated',
  `Job step updated to: ${step}${autoTriggered ? ' (automatic)' : ''}`,
  { autoHide: true, hideAfter: 5000 }
);

export const createLocationAlert = (
  message: string,
  priority: SmartAlert['priority'] = 'medium'
): SmartAlert => createSmartAlert(
  'location',
  priority,
  'Location Update',
  message,
  { autoHide: true, hideAfter: 8000 }
);

export const createJobOfferAlert = (
  jobReference: string,
  customerName: string,
  estimatedEarnings: number,
  actions?: SmartAlert['actions']
): SmartAlert => createSmartAlert(
  'status',
  'high',
  'New Job Offer Available',
  `Job ${jobReference} for ${customerName} - Earn £${estimatedEarnings}`,
  { 
    actions: actions || [
      { label: 'Accept Job', action: 'accept_job', style: 'primary' },
      { label: 'View Details', action: 'view_details', style: 'secondary' }
    ],
    autoHide: false // Don't auto-hide job offers
  }
);

export const createJobAcceptedAlert = (
  jobReference: string
): SmartAlert => createSmartAlert(
  'status',
  'medium',
  'Job Accepted Successfully',
  `You have accepted job ${jobReference}. Check your assigned jobs.`,
  { autoHide: true, hideAfter: 5000 }
);

export default SmartNotifications;