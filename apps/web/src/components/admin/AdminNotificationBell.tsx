'use client';

import {
  Box,
  IconButton,
  Badge,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  VStack,
  HStack,
  Text,
  Button,
  Divider,
  Tooltip,
  useDisclosure,
  Spinner,
  useToast,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { FiBell } from 'react-icons/fi';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js';

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

const priorityColors = {
  urgent: 'red.500',
  high: 'orange.500',
  medium: 'blue.500',
  low: 'gray.500',
};

const priorityBadges = {
  urgent: { bg: 'red.500', text: 'URGENT' },
  high: { bg: 'orange.500', text: 'HIGH' },
  medium: { bg: 'blue.500', text: 'MEDIUM' },
  low: { bg: 'gray.500', text: 'LOW' },
};

export function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onToggle, onClose } = useDisclosure();
  const router = useRouter();
  const toast = useToast();
  const pusherRef = useRef<Pusher | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/notifications?limit=20');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to mark as read');
      
      // Update local state
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Handle notification click
  const handleNotificationClick = useCallback(
    (notification: AdminNotification) => {
      // Mark as read
      if (!notification.isRead) {
        markAsRead(notification.id);
      }

      // Navigate to action URL if available
      if (notification.actionUrl) {
        router.push(notification.actionUrl);
        onClose();
      }
    },
    [markAsRead, router, onClose]
  );

  // Initialize Pusher for real-time notifications
  useEffect(() => {
    setIsMounted(true);
    
    if (typeof window === 'undefined') return;

    // Initialize Pusher
    if (!pusherRef.current) {
      try {
        pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
          authEndpoint: '/api/pusher/auth',
        });

        const channel = pusherRef.current.subscribe('admin-notifications');

        // Listen for new notifications
        channel.bind('new-notification', (data: AdminNotification) => {
          console.log('📢 New admin notification:', data);
          
          // Add to notifications list
          setNotifications(prev => [data, ...prev].slice(0, 20));
          setUnreadCount(prev => prev + 1);

          // Show toast for high priority notifications
          if (data.priority === 'urgent' || data.priority === 'high') {
            toast({
              title: data.title,
              description: data.message,
              status: data.priority === 'urgent' ? 'error' : 'warning',
              duration: 5000,
              isClosable: true,
              position: 'top-right',
            });
          }

          // Play notification sound for urgent
          if (data.priority === 'urgent') {
            try {
              const audio = new Audio('/notification-sound.mp3');
              audio.play().catch(() => {});
            } catch (e) {}
          }
        });

        // Listen for notification updates
        channel.bind('notification-read', (data: { notificationId: string }) => {
          setNotifications(prev =>
            prev.map(n => (n.id === data.notificationId ? { ...n, isRead: true } : n))
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        });
      } catch (error) {
        console.error('Error initializing Pusher:', error);
      }
    }

    // Fetch initial notifications
    fetchNotifications();

    // Poll for new notifications every 30 seconds as fallback
    const pollInterval = setInterval(fetchNotifications, 30000);

    return () => {
      clearInterval(pollInterval);
      if (pusherRef.current) {
        pusherRef.current.unsubscribe('admin-notifications');
      }
    };
  }, [fetchNotifications, toast]);

  if (!isMounted) return null;

  return (
    <Popover
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom-end"
      closeOnBlur={true}
      isLazy
    >
      <PopoverTrigger>
        <Box position="relative" display="inline-block">
          <Tooltip label="Notifications" hasArrow>
            <IconButton
              aria-label="Notifications"
              icon={<FiBell />}
              variant="ghost"
              size="sm"
              borderRadius="full"
              onClick={onToggle}
              _hover={{ bg: 'rgba(0,194,255,0.08)', color: 'primary.500' }}
            />
          </Tooltip>
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-2px"
              right="-2px"
              colorScheme="red"
              borderRadius="full"
              fontSize="10px"
              minW="18px"
              h="18px"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontWeight="bold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>

      <PopoverContent
        bg="gray.800"
        borderColor="gray.700"
        boxShadow="xl"
        w={{ base: '90vw', md: '400px' }}
        maxW="400px"
      >
        <PopoverHeader
          borderColor="gray.700"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <HStack>
            <Text fontWeight="bold" color="white">
              Notifications
            </Text>
            {unreadCount > 0 && (
              <Badge colorScheme="red" borderRadius="full">
                {unreadCount}
              </Badge>
            )}
          </HStack>
          {isLoading && <Spinner size="sm" color="primary.500" />}
        </PopoverHeader>

        <PopoverBody p={0} maxH="500px" overflowY="auto">
          {notifications.length === 0 ? (
            <Box p={8} textAlign="center">
              <Text color="gray.400" fontSize="sm">
                No notifications yet
              </Text>
            </Box>
          ) : (
            <VStack spacing={0} align="stretch">
              {notifications.map((notification, index) => (
                <Box key={notification.id}>
                  <Box
                    p={3}
                    cursor="pointer"
                    bg={notification.isRead ? 'transparent' : 'rgba(0,194,255,0.05)'}
                    _hover={{ bg: 'rgba(0,194,255,0.08)' }}
                    onClick={() => handleNotificationClick(notification)}
                    borderLeft="3px solid"
                    borderLeftColor={
                      notification.isRead ? 'transparent' : priorityColors[notification.priority]
                    }
                  >
                    <HStack justify="space-between" align="start" spacing={2}>
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack spacing={2}>
                          <Text
                            fontSize="sm"
                            fontWeight={notification.isRead ? 'normal' : 'bold'}
                            color={notification.isRead ? 'gray.300' : 'white'}
                            noOfLines={1}
                          >
                            {notification.title}
                          </Text>
                          {!notification.isRead && (
                            <Box w="6px" h="6px" bg="primary.500" borderRadius="full" />
                          )}
                        </HStack>
                        <Text fontSize="xs" color="gray.400" noOfLines={2}>
                          {notification.message}
                        </Text>
                        <HStack spacing={2} mt={1}>
                          <Badge
                            fontSize="9px"
                            px={2}
                            py={0.5}
                            borderRadius="full"
                            bg={priorityBadges[notification.priority].bg}
                            color="white"
                          >
                            {priorityBadges[notification.priority].text}
                          </Badge>
                          <Text fontSize="10px" color="gray.500">
                            {formatRelativeTime(notification.createdAt)}
                          </Text>
                        </HStack>
                      </VStack>
                    </HStack>
                  </Box>
                  {index < notifications.length - 1 && <Divider borderColor="gray.700" />}
                </Box>
              ))}
            </VStack>
          )}
        </PopoverBody>

        {notifications.length > 0 && (
          <>
            <Divider borderColor="gray.700" />
            <Box p={2}>
              <Button
                size="sm"
                variant="ghost"
                w="full"
                onClick={() => {
                  router.push('/admin/notifications');
                  onClose();
                }}
              >
                View All Notifications
              </Button>
            </Box>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short' 
  });
}
