'use client';

import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  IconButton,
  useToast,
  Spinner,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { FiCheck, FiCheckCircle, FiTrash2, FiExternalLink } from 'react-icons/fi';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string | null;
  isRead: boolean;
  createdAt: string;
  readAt?: string | null;
  data?: any;
}

interface Props {
  initialNotifications: Notification[];
  initialUnreadCount: number;
}

const priorityColors = {
  urgent: 'red',
  high: 'orange',
  medium: 'blue',
  low: 'gray',
};

export function AdminNotificationsClient({ initialNotifications, initialUnreadCount }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      toast({
        title: 'Marked as read',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const markAllAsRead = async () => {
    setIsLoading(true);
    try {
      // Mark all unread as read
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      
      await Promise.all(
        unreadIds.map(id =>
          fetch(`/api/admin/notifications/${id}/read`, { method: 'POST' })
        )
      );

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);

      toast({
        title: 'All notifications marked as read',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <HStack>
            <Heading size="lg">Notifications</Heading>
            {unreadCount > 0 && (
              <Badge colorScheme="red" fontSize="md" px={3} py={1} borderRadius="full">
                {unreadCount} Unread
              </Badge>
            )}
          </HStack>
          {unreadCount > 0 && (
            <Button
              leftIcon={<FiCheckCircle />}
              onClick={markAllAsRead}
              isLoading={isLoading}
              size="sm"
              colorScheme="blue"
            >
              Mark All as Read
            </Button>
          )}
        </HStack>

        <Tabs variant="enclosed" colorScheme="blue" onChange={(index) => setFilter(index === 0 ? 'all' : 'unread')}>
          <TabList>
            <Tab>All Notifications</Tab>
            <Tab>
              Unread
              {unreadCount > 0 && (
                <Badge ml={2} colorScheme="red" borderRadius="full">
                  {unreadCount}
                </Badge>
              )}
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0}>
              <NotificationList
                notifications={filteredNotifications}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={markAsRead}
              />
            </TabPanel>
            <TabPanel px={0}>
              <NotificationList
                notifications={filteredNotifications}
                onNotificationClick={handleNotificationClick}
                onMarkAsRead={markAsRead}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
}

function NotificationList({
  notifications,
  onNotificationClick,
  onMarkAsRead,
}: {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (id: string) => void;
}) {
  if (notifications.length === 0) {
    return (
      <Box py={12} textAlign="center">
        <Text color="gray.500" fontSize="lg">
          No notifications yet
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={3} align="stretch">
      {notifications.map(notification => (
        <Card
          key={notification.id}
          bg={notification.isRead ? 'white' : 'blue.50'}
          borderLeft="4px solid"
          borderLeftColor={priorityColors[notification.priority] + '.500'}
          cursor="pointer"
          _hover={{ boxShadow: 'md' }}
          onClick={() => onNotificationClick(notification)}
        >
          <CardBody>
            <HStack justify="space-between" align="start">
              <VStack align="start" spacing={2} flex={1}>
                <HStack>
                  <Text fontWeight="bold" fontSize="md">
                    {notification.title}
                  </Text>
                  {!notification.isRead && (
                    <Box w="8px" h="8px" bg="blue.500" borderRadius="full" />
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  {notification.message}
                </Text>
                <HStack spacing={3}>
                  <Badge colorScheme={priorityColors[notification.priority]}>
                    {notification.priority.toUpperCase()}
                  </Badge>
                  <Text fontSize="xs" color="gray.500">
                    {formatRelativeTime(notification.createdAt)}
                  </Text>
                  {notification.actionUrl && (
                    <HStack spacing={1} color="blue.500" fontSize="xs">
                      <FiExternalLink />
                      <Text>View</Text>
                    </HStack>
                  )}
                </HStack>
              </VStack>
              {!notification.isRead && (
                <IconButton
                  aria-label="Mark as read"
                  icon={<FiCheck />}
                  size="sm"
                  variant="ghost"
                  colorScheme="blue"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                />
              )}
            </HStack>
          </CardBody>
        </Card>
      ))}
    </VStack>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
