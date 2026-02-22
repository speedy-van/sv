'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
} from '@chakra-ui/react';
import {
  FiBell,
  FiCheck,
  FiX,
  FiTrash2,
  FiSettings,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
  FiClock,
} from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  category?: 'order' | 'route' | 'driver' | 'system';
}

interface NotificationsCenterProps {
  notifications?: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  onDeleteAll?: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationsCenter({
  notifications: externalNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAll,
  onNotificationClick,
}: NotificationsCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>(externalNotifications || []);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'orders' | 'routes'>('all');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const cardBg = useColorModeValue('#121A2B', '#121A2B');
  const textColor = useColorModeValue('#F5F8FF', '#F5F8FF');
  const borderColor = useColorModeValue('#2A3A5E', '#2A3A5E');
  const secondaryTextColor = useColorModeValue('#9ca3af', '#9ca3af');

  useEffect(() => {
    if (externalNotifications) {
      setNotifications(externalNotifications);
    }
  }, [externalNotifications]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !externalNotifications) {
      const stored = localStorage.getItem('admin_notifications');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setNotifications(parsed.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
          })));
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [externalNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'unread') return !notification.read;
    if (activeTab === 'orders') return notification.category === 'order';
    if (activeTab === 'routes') return notification.category === 'route';
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    saveNotifications();
    if (onMarkAsRead) {
      onMarkAsRead(id);
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    saveNotifications();
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const handleDelete = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    saveNotifications();
    if (onDelete) {
      onDelete(id);
    }
  };

  const handleDeleteAll = () => {
    setNotifications([]);
    saveNotifications();
    if (onDeleteAll) {
      onDeleteAll();
    }
    onClose();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  const saveNotifications = () => {
    if (typeof window !== 'undefined' && !externalNotifications) {
      localStorage.setItem('admin_notifications', JSON.stringify(notifications));
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return FiCheckCircle;
      case 'error':
        return FiAlertCircle;
      case 'warning':
        return FiAlertCircle;
      case 'info':
        return FiInfo;
      default:
        return FiBell;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#2563eb';
      default:
        return secondaryTextColor;
    }
  };

  return (
    <>
      {/* Notifications Bell Button */}
      <Menu>
        <MenuButton
          as={IconButton}
          icon={<FiBell />}
          variant="ghost"
          position="relative"
          color={textColor}
          _hover={{ bg: '#18233A' }}
        >
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-2px"
              right="-2px"
              bg="#ef4444"
              color="#F5F8FF"
              borderRadius="full"
              boxSize="18px"
              fontSize="xs"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </MenuButton>
        <MenuList bg={cardBg} borderColor={borderColor} minW="400px" maxH="500px" overflowY="auto">
          <VStack align="stretch" spacing={0}>
            <HStack justify="space-between" p={3} borderBottomWidth={1} borderBottomColor={borderColor}>
              <Text fontWeight="bold" color={textColor}>
                Notifications
              </Text>
              <HStack spacing={2}>
                {unreadCount > 0 && (
                  <Button
                    size="xs"
                    onClick={handleMarkAllAsRead}
                    variant="ghost"
                    color={textColor}
                    _hover={{ bg: '#18233A' }}
                  >
                    Mark all read
                  </Button>
                )}
                <IconButton
                  aria-label="View all"
                  icon={<FiSettings />}
                  size="xs"
                  variant="ghost"
                  onClick={onOpen}
                  color={textColor}
                  _hover={{ bg: '#18233A' }}
                />
              </HStack>
            </HStack>

            {filteredNotifications.length === 0 ? (
              <Box p={4} textAlign="center">
                <Text color={secondaryTextColor} fontSize="sm">
                  No notifications
                </Text>
              </Box>
            ) : (
              <VStack align="stretch" spacing={0}>
                {filteredNotifications.slice(0, 5).map((notification) => (
                  <Box
                    key={notification.id}
                    p={3}
                    bg={notification.read ? 'transparent' : 'rgba(37, 99, 235, 0.1)'}
                    borderBottomWidth={1}
                    borderBottomColor={borderColor}
                    cursor="pointer"
                    onClick={() => handleNotificationClick(notification)}
                    _hover={{ bg: '#18233A' }}
                  >
                    <HStack align="start" spacing={3}>
                      <Icon
                        as={getNotificationIcon(notification.type)}
                        color={getNotificationColor(notification.type)}
                        boxSize={5}
                        mt={0.5}
                      />
                      <VStack align="start" spacing={1} flex={1}>
                        <HStack justify="space-between" w="100%">
                          <Text fontWeight="bold" color={textColor} fontSize="sm">
                            {notification.title}
                          </Text>
                          {!notification.read && (
                            <Box w={2} h={2} bg="#2563eb" borderRadius="full" />
                          )}
                        </HStack>
                        <Text fontSize="xs" color={secondaryTextColor} noOfLines={2}>
                          {notification.message}
                        </Text>
                        <HStack spacing={2} fontSize="xs" color={secondaryTextColor}>
                          <Icon as={FiClock} boxSize={3} />
                          <Text>
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </Text>
                          {notification.category && (
                            <>
                              <Text>•</Text>
                              <Badge size="sm" colorScheme="gray">
                                {notification.category}
                              </Badge>
                            </>
                          )}
                        </HStack>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
                {filteredNotifications.length > 5 && (
                  <Box p={2} textAlign="center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onOpen}
                      color={textColor}
                      _hover={{ bg: '#18233A' }}
                    >
                      View all ({filteredNotifications.length})
                    </Button>
                  </Box>
                )}
              </VStack>
            )}
          </VStack>
        </MenuList>
      </Menu>

      {/* Full Notifications Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl" isCentered>
        <ModalOverlay bg="rgba(0, 0, 0, 0.8)" />
        <ModalContent bg={cardBg} borderColor={borderColor} borderWidth={1}>
          <ModalHeader color={textColor}>
            <HStack justify="space-between">
              <Text>Notifications Center</Text>
              {unreadCount > 0 && (
                <Badge colorScheme="blue" size="lg">
                  {unreadCount} unread
                </Badge>
              )}
            </HStack>
          </ModalHeader>
          <ModalCloseButton color={textColor} />
          <ModalBody>
            <Tabs variant="enclosed" colorScheme="blue">
              <TabList>
                <Tab color={textColor}>All</Tab>
                <Tab color={textColor}>
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </Tab>
                <Tab color={textColor}>Orders</Tab>
                <Tab color={textColor}>Routes</Tab>
              </TabList>
              <TabPanels>
                {(['all', 'unread', 'orders', 'routes'] as const).map((tab) => (
                  <TabPanel key={tab} p={0} pt={4}>
                    <VStack align="stretch" spacing={2}>
                      {notifications
                        .filter((n) => {
                          if (tab === 'unread') return !n.read;
                          if (tab === 'orders') return n.category === 'order';
                          if (tab === 'routes') return n.category === 'route';
                          return true;
                        })
                        .map((notification) => (
                          <Card
                            key={notification.id}
                            bg={notification.read ? cardBg : 'rgba(37, 99, 235, 0.1)'}
                            borderColor={borderColor}
                            borderWidth={1}
                            cursor="pointer"
                            onClick={() => handleNotificationClick(notification)}
                            _hover={{ bg: '#18233A' }}
                          >
                            <CardBody>
                              <HStack align="start" spacing={3}>
                                <Icon
                                  as={getNotificationIcon(notification.type)}
                                  color={getNotificationColor(notification.type)}
                                  boxSize={5}
                                  mt={0.5}
                                />
                                <VStack align="start" spacing={1} flex={1}>
                                  <HStack justify="space-between" w="100%">
                                    <Text fontWeight="bold" color={textColor}>
                                      {notification.title}
                                    </Text>
                                    <HStack spacing={2}>
                                      {!notification.read && (
                                        <Badge colorScheme="blue" size="sm">
                                          New
                                        </Badge>
                                      )}
                                      <IconButton
                                        aria-label="Delete"
                                        icon={<FiTrash2 />}
                                        size="xs"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDelete(notification.id);
                                        }}
                                        color={secondaryTextColor}
                                        _hover={{ color: '#ef4444' }}
                                      />
                                    </HStack>
                                  </HStack>
                                  <Text fontSize="sm" color={secondaryTextColor}>
                                    {notification.message}
                                  </Text>
                                  <HStack spacing={2} fontSize="xs" color={secondaryTextColor}>
                                    <Icon as={FiClock} boxSize={3} />
                                    <Text>
                                      {format(notification.timestamp, 'dd MMM yyyy, HH:mm')}
                                    </Text>
                                    {notification.category && (
                                      <>
                                        <Text>•</Text>
                                        <Badge size="sm" colorScheme="gray">
                                          {notification.category}
                                        </Badge>
                                      </>
                                    )}
                                  </HStack>
                                  {notification.actionUrl && (
                                    <Button
                                      size="xs"
                                      mt={2}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.location.href = notification.actionUrl!;
                                      }}
                                      bg="#2563eb"
                                      color="#F5F8FF"
                                      _hover={{ bg: '#1d4ed8' }}
                                    >
                                      {notification.actionLabel || 'View'}
                                    </Button>
                                  )}
                                </VStack>
                              </HStack>
                            </CardBody>
                          </Card>
                        ))}
                      {notifications.filter((n) => {
                        if (tab === 'unread') return !n.read;
                        if (tab === 'orders') return n.category === 'order';
                        if (tab === 'routes') return n.category === 'route';
                        return true;
                      }).length === 0 && (
                        <Box p={8} textAlign="center">
                          <Text color={secondaryTextColor}>No notifications</Text>
                        </Box>
                      )}
                    </VStack>
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={2}>
              {unreadCount > 0 && (
                <Button
                  leftIcon={<FiCheck />}
                  onClick={handleMarkAllAsRead}
                  variant="outline"
                  borderColor={borderColor}
                  color={textColor}
                  _hover={{ bg: '#18233A' }}
                >
                  Mark All Read
                </Button>
              )}
              <Button
                leftIcon={<FiTrash2 />}
                onClick={() => {
                  if (window.confirm('Delete all notifications?')) {
                    handleDeleteAll();
                  }
                }}
                variant="outline"
                borderColor="#ef4444"
                color="#ef4444"
                _hover={{ bg: 'rgba(239, 68, 68, 0.1)' }}
              >
                Delete All
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

