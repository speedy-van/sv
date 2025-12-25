'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Card,
  CardBody,
  Button,
  Avatar,
  Badge,
  Flex,
  Textarea,
  useToast,
  Spinner,
  Icon,
  Grid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Alert,
  AlertIcon,
  AlertDescription,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiMessageSquare,
  FiSend,
  FiUser,
  FiCheck,
  FiShield,
  FiTruck,
  FiLock,
  FiUnlock,
  FiArchive,
  FiTrash2,
  FiMail,
  FiMinimize2,
  FiMaximize2,
  FiX,
} from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';
import Pusher from 'pusher-js';
import { closeChat, reopenChat, fetchActiveChats, fetchArchivedChats } from '@/lib/chat-helpers';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
  read: boolean;
}

interface ChatConversation {
  id: string;
  participants: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: string;
  isActive: boolean;
  closedAt?: string;
  closedBy?: {
    id: string;
    name: string;
    role: string;
  };
}

interface CustomerChatConversation {
  id: string;
  type: string;
  title: string;
  customerName: string;
  customerEmail: string;
  participants: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
}

export default function EnhancedAdminChatPage() {
  const [activeConversations, setActiveConversations] = useState<ChatConversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<ChatConversation[]>([]);
  const [customerChats, setCustomerChats] = useState<CustomerChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | CustomerChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const toast = useToast();
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  const notificationsChannelRef = useRef<any>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    let mounted = true;
    
    if (mounted) {
      loadAllChats();
      setupPusher();
      
      // Broadcast admin online status
      broadcastAdminStatus('online');
    }

    return () => {
      mounted = false;
      // Broadcast offline status before cleanup
      broadcastAdminStatus('offline');
      cleanupPusher();
    };
  }, []);

  // Auto-select conversation if sessionId is in URL
  useEffect(() => {
    const sessionId = searchParams?.get('sessionId');
    if (sessionId && (customerChats.length > 0 || activeConversations.length > 0)) {
      // Find the conversation with this sessionId
      const customerChat = customerChats.find(c => c.id === sessionId);
      const driverChat = activeConversations.find(c => c.id === sessionId);
      
      if (customerChat) {
        setTabIndex(1); // Switch to Customer Chats tab
        handleConversationSelect(customerChat);
      } else if (driverChat) {
        setTabIndex(0); // Switch to Active Chats tab
        handleConversationSelect(driverChat);
      }
    }
  }, [searchParams, customerChats, activeConversations]);

  const loadAllChats = async () => {
    try {
      setLoading(true);
      const [activeData, archivedData, customerChatsData] = await Promise.all([
        fetchActiveChats(),
        fetchArchivedChats(),
        fetch('/api/admin/customer-chat/sessions?status=active').then(res => res.json()),
      ]);

      if (activeData.success) {
        setActiveConversations(activeData.chats || []);
      }

      if (archivedData.success) {
        setArchivedConversations(archivedData.chats || []);
      }

      if (customerChatsData.success) {
        setCustomerChats(customerChatsData.data.conversations || []);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast({
        title: 'Error',
        description: 'Failed to load conversations',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const setupPusher = () => {
    const pusherKey = '407cb06c423e6c032e9c';
    const pusherCluster = 'eu';

    if (!pusherKey || pusherRef.current) return;

    try {
      pusherRef.current = new Pusher(pusherKey, {
        cluster: pusherCluster,
      });

      // Subscribe to admin-chat channel for driver messages
      channelRef.current = pusherRef.current.subscribe('admin-chat');

      // Driver message received
      channelRef.current.bind('driver_message', (data: any) => {
        const messageId = data.messageId || `${data.driverId}_${data.timestamp}`;
        if (processedMessageIds.current.has(messageId)) return;
        processedMessageIds.current.add(messageId);

        toast({
          title: 'New Message',
          description: data.message.substring(0, 50),
          status: 'info',
          duration: 5000,
        });

        loadAllChats();
        if (selectedConversation?.id === data.sessionId) {
          loadMessages(data.sessionId);
        }
      });

      // Subscribe to admin-notifications channel for customer chat messages
      notificationsChannelRef.current = pusherRef.current.subscribe('admin-notifications');
      
      // Customer chat message received
      notificationsChannelRef.current.bind('customer-chat-message', (data: any) => {
        console.log('💬 Customer chat message received in admin chat:', data);
        
        toast({
          title: '💬 New Customer Message',
          description: `${data.data.customerName}: ${data.data.message.substring(0, 50)}...`,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });

        // Reload all chats to show new message
        loadAllChats();
        
        // If this conversation is currently selected, reload messages
        if (selectedConversation && selectedConversation.id === data.data.sessionId) {
          const isCustomerChat = 'customerEmail' in selectedConversation;
          loadMessages(data.data.sessionId, isCustomerChat);
        }
      });

      // Customer chat session started
      notificationsChannelRef.current.bind('customer-chat-started', (data: any) => {
        console.log('💬 New customer chat session started:', data);
        
        toast({
          title: '💬 New Customer Chat Started',
          description: `${data.data.customerName} started a new chat`,
          status: 'info',
          duration: 5000,
          isClosable: true,
        });

        // Reload all chats to show new session
        loadAllChats();
      });

      // Typing indicator
      channelRef.current.bind('typing_indicator', (data: any) => {
        if (data.userRole === 'driver' && selectedConversation?.id === data.chatId) {
          setOtherUserTyping(data.isTyping);
          
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          if (data.isTyping) {
            typingTimeoutRef.current = setTimeout(() => {
              setOtherUserTyping(false);
            }, 3000);
          }
        }
      });

      // Chat closed
      channelRef.current.bind('chat_closed', () => {
        loadAllChats();
      });

      // Chat reopened
      channelRef.current.bind('chat_reopened', () => {
        loadAllChats();
      });

      // Message read receipt
      channelRef.current.bind('message_read', (data: any) => {
        console.log('✓✓ Message read by driver:', data);
        if (selectedConversation?.id === data.sessionId) {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === data.messageId ? { ...msg, read: true } : msg
            )
          );
        }
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Admin chat Pusher connected');
      }
    } catch (error) {
      console.error('❌ Failed to setup Pusher:', error);
    }
  };

  const cleanupPusher = () => {
    try {
      if (channelRef.current) {
        channelRef.current.unbind_all();
        channelRef.current = null;
      }
      if (notificationsChannelRef.current) {
        notificationsChannelRef.current.unbind_all();
        notificationsChannelRef.current = null;
      }
      if (pusherRef.current) {
        pusherRef.current.unsubscribe('admin-chat');
        pusherRef.current.unsubscribe('admin-notifications');
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
    } catch (error) {
      // Silently handle cleanup errors in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('Pusher cleanup warning:', error);
      }
    }
  };

  const loadMessages = async (conversationId: string, isCustomerChat = false) => {
    try {
      let response;
      if (isCustomerChat) {
        // For customer chats, we need to get the customer email from the session
        const sessionResponse = await fetch(`/api/admin/customer-chat/sessions`);
        const sessionData = await sessionResponse.json();
        const session = sessionData.data?.conversations?.find((c: any) => c.id === conversationId);
        
        if (session) {
          // Use customer chat messages API
          response = await fetch(
            `/api/customer/chat/messages?sessionId=${conversationId}&customerEmail=${encodeURIComponent(session.customerEmail)}`
          );
        } else {
          throw new Error('Session not found');
        }
      } else {
        // For driver chats, use admin chat API
        response = await fetch(`/api/admin/chat/conversations/${conversationId}/messages`);
      }
      
      if (response && response.ok) {
        const data = await response.json();
        const messagesList = isCustomerChat 
          ? (data.data?.messages || [])
          : (data.messages || []);
        
        const sanitizedMessages = messagesList.map((msg: any) => {
          // Ensure we have the message content - API returns 'content', not 'message'
          const messageContent = msg.content || msg.message || '';
          
          return {
            id: msg.id,
            senderId: msg.senderId || '',
            senderName: msg.senderRole === 'admin' ? 'Support' : (msg.senderName || 'Customer'),
            senderRole: msg.senderRole || 'customer',
            message: messageContent,
            content: messageContent, // Also keep content for compatibility
            timestamp: msg.createdAt || msg.timestamp || new Date().toISOString(),
            read: !!msg.readAt,
            readAt: msg.readAt,
          };
        });
        setMessages(sanitizedMessages);
        
        // Auto-scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleConversationSelect = (conversation: ChatConversation | CustomerChatConversation) => {
    setSelectedConversation(conversation);
    const isCustomerChat = 'customerEmail' in conversation;
    loadMessages(conversation.id, isCustomerChat);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    // Prevent sending to closed chats
    if (!selectedConversation.isActive) {
      toast({
        title: 'Chat Closed',
        description: 'This conversation is closed. Reopen it first.',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    // Check if this is a customer chat
    const isCustomerChat = 'customerEmail' in selectedConversation;

    // Stop typing indicator (only for driver chats)
    if (!isCustomerChat && isTyping) {
      setIsTyping(false);
      sendTypingIndicator(false);
    }

    setSending(true);
    try {
      let response;
      if (isCustomerChat) {
        // Use customer chat API
        response = await fetch(`/api/admin/customer-chat/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: selectedConversation.id,
            message: newMessage.trim(),
          }),
        });
      } else {
        // Use driver chat API
        response = await fetch(`/api/admin/chat/conversations/${selectedConversation.id}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: newMessage.trim(),
          }),
        });
      }

      if (response.ok) {
        const data = await response.json();
        const sanitizedMessage = {
          id: data.data?.id || data.message?.id,
          senderId: data.data?.senderId || data.message?.senderId,
          senderName: 'Support',
          senderRole: 'admin',
          message: data.data?.content || data.message?.message || newMessage.trim(),
          timestamp: data.data?.createdAt || data.message?.timestamp || new Date().toISOString(),
          read: false,
        };

        setMessages(prev => {
          const isDuplicate = prev.some(msg => msg.id === sanitizedMessage.id);
          if (isDuplicate) return prev;
          return [...prev, sanitizedMessage];
        });

        setNewMessage('');
        
        // Auto-scroll
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setSending(false);
    }
  };

  const sendTypingIndicator = async (typing: boolean) => {
    if (!selectedConversation) return;

    try {
      await fetch('/api/admin/chat/typing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: selectedConversation.id,
          isTyping: typing,
        }),
      });
    } catch (error) {
      console.error('Failed to send typing indicator:', error);
    }
  };

  const broadcastAdminStatus = async (status: 'online' | 'offline') => {
    try {
      await fetch('/api/admin/chat/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      console.log(`✅ Admin status broadcasted: ${status}`);
    } catch (error) {
      console.error('Failed to broadcast admin status:', error);
    }
  };

  const handleMessageInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      sendTypingIndicator(true);
    }

    // Clear existing timeout
    if (typingIndicatorTimeoutRef.current) {
      clearTimeout(typingIndicatorTimeoutRef.current);
    }

    // Stop typing indicator after 2 seconds of no typing
    if (e.target.value.trim()) {
      typingIndicatorTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTypingIndicator(false);
      }, 2000);
    } else {
      setIsTyping(false);
      sendTypingIndicator(false);
    }
  };

  const handleCloseChat = async () => {
    if (!selectedConversation) return;

    try {
      await closeChat(selectedConversation.id, 'Issue resolved');
      
      toast({
        title: 'Success',
        description: 'Conversation closed successfully',
        status: 'success',
        duration: 3000,
      });

      setSelectedConversation(null);
      loadAllChats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to close conversation',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleReopenChat = async () => {
    if (!selectedConversation) return;

    try {
      await reopenChat(selectedConversation.id);
      
      toast({
        title: 'Success',
        description: 'Conversation reopened successfully',
        status: 'success',
        duration: 3000,
      });

      loadAllChats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reopen conversation',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleArchiveChat = async () => {
    if (!selectedConversation) return;

    try {
      // Close the chat first (which archives it)
      await closeChat(selectedConversation.id, 'Archived by admin');
      
      toast({
        title: 'Success',
        description: 'Conversation archived successfully',
        status: 'success',
        duration: 3000,
      });

      setSelectedConversation(null);
      loadAllChats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to archive conversation',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedConversation) return;

    const isCustomerChat = 'customerEmail' in selectedConversation;
    const confirmMessage = isCustomerChat
      ? `Are you sure you want to delete this customer chat? This action cannot be undone.`
      : `Are you sure you want to delete this conversation? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const endpoint = isCustomerChat
        ? `/api/admin/customer-chat/sessions/${selectedConversation.id}`
        : `/api/admin/chat/conversations/${selectedConversation.id}`;

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }

      toast({
        title: 'Success',
        description: 'Conversation deleted successfully',
        status: 'success',
        duration: 3000,
      });

      setSelectedConversation(null);
      loadAllChats();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleSendEmail = async () => {
    if (!selectedConversation) return;

    const isCustomerChat = 'customerEmail' in selectedConversation;
    const customerEmail = isCustomerChat ? selectedConversation.customerEmail : null;

    if (!customerEmail) {
      toast({
        title: 'Error',
        description: 'Customer email not found',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      const response = await fetch('/api/admin/customer-chat/send-transcript', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: selectedConversation.id,
          customerEmail: customerEmail,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      toast({
        title: 'Success',
        description: 'Chat transcript sent to customer email successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send email',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'red';
      case 'driver':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return FiShield;
      case 'driver':
        return FiTruck;
      default:
        return FiUser;
    }
  };

  if (loading) {
    return (
      <Box p={6}>
        <Flex justify="center" align="center" minH="400px">
          <Spinner size="xl" />
        </Flex>
      </Box>
    );
  }

  const displayConversations = 
    tabIndex === 0 ? activeConversations : 
    tabIndex === 1 ? customerChats : 
    tabIndex === 2 ? archivedConversations : 
    [];

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg">Chat Support</Heading>
            <Text color="gray.600">
              {tabIndex === 0 ? 'Manage driver communications' : 
               tabIndex === 1 ? 'Manage customer live chat' : 
               tabIndex === 2 ? 'View archived conversations' : 
               'Manage all chats'}
            </Text>
          </VStack>
        </Flex>

        <Tabs index={tabIndex} onChange={setTabIndex}>
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiTruck} />
                <Text>Driver Chats</Text>
                <Badge colorScheme="blue">{activeConversations.length}</Badge>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiUser} />
                <Text>Customer Chats</Text>
                <Badge colorScheme="green">{customerChats.length}</Badge>
              </HStack>
            </Tab>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiArchive} />
                <Text>Archived</Text>
                <Badge colorScheme="gray">{archivedConversations.length}</Badge>
              </HStack>
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0} pt={4}>
              <Grid templateColumns="1fr 2fr" gap={6} minH="600px">
                {/* Conversations List */}
                <Card>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">
                        {tabIndex === 0 ? 'Driver Conversations' : 
                         tabIndex === 1 ? 'Customer Chats' : 
                         tabIndex === 2 ? 'Archived Conversations' : 
                         'All Conversations'}
                      </Heading>

                      <VStack spacing={2} align="stretch" maxH="500px" overflowY="auto">
                        {displayConversations.map((conversation: any) => {
                          // Handle customer chat conversations differently
                          const isCustomerChat = 'customerEmail' in conversation;
                          const displayName = isCustomerChat 
                            ? conversation.customerName 
                            : conversation.participants.map((p: any) => p.name).join(', ');
                          const displayRole = isCustomerChat 
                            ? 'customer' 
                            : conversation.participants[0]?.role;
                          
                          return (
                            <Card
                              key={conversation.id}
                              cursor="pointer"
                              onClick={() => handleConversationSelect(conversation)}
                              bg={selectedConversation?.id === conversation.id ? 'blue.900' : 'gray.800'}
                              _hover={{ bg: 'gray.700' }}
                              borderWidth={selectedConversation?.id === conversation.id ? 2 : 1}
                              borderColor={selectedConversation?.id === conversation.id ? 'blue.500' : 'gray.200'}
                            >
                              <CardBody p={3}>
                                <VStack align="start" spacing={2}>
                                  <HStack justify="space-between" w="full">
                                    <HStack>
                                      <Avatar size="sm" name={displayName} />
                                      <VStack align="start" spacing={0}>
                                        <Text fontWeight="medium" fontSize="sm">
                                          {displayName}
                                        </Text>
                                        {isCustomerChat && (
                                          <Text fontSize="xs" color="gray.500">
                                            {conversation.customerEmail}
                                          </Text>
                                        )}
                                        <HStack spacing={2}>
                                          <Badge size="sm" colorScheme={getRoleColor(displayRole)}>
                                            {displayRole}
                                          </Badge>
                                          <Badge 
                                            size="sm" 
                                            colorScheme={conversation.isActive ? 'green' : 'red'}
                                            variant="subtle"
                                          >
                                            {conversation.isActive ? '🟢 Active' : '🔴 Closed'}
                                          </Badge>
                                        </HStack>
                                      </VStack>
                                    </HStack>
                                  </HStack>

                                  {conversation.lastMessage && (
                                    <Text fontSize="sm" color="gray.600" noOfLines={1}>
                                      {conversation.lastMessage.message || conversation.lastMessage.content}
                                    </Text>
                                  )}

                                  <Text fontSize="xs" color="gray.500">
                                    {new Date(conversation.updatedAt).toLocaleString()}
                                  </Text>
                                </VStack>
                              </CardBody>
                            </Card>
                          );
                        })}

                        {displayConversations.length === 0 && (
                          <VStack spacing={4} py={8}>
                            <Icon as={FiMessageSquare} boxSize="48px" color="gray.400" />
                            <Text color="gray.500">
                              {tabIndex === 0 ? 'No driver conversations' : 
                               tabIndex === 1 ? 'No customer chats yet' : 
                               'No archived conversations'}
                            </Text>
                          </VStack>
                        )}
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Chat Area */}
                <Card>
                  <CardBody>
                    {selectedConversation ? (
                      <VStack spacing={4} align="stretch" h="full">
                        {/* Chat Header */}
                        <HStack justify="space-between" pb={2} borderBottom="1px" borderColor="gray.200">
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Avatar size="sm" name={selectedConversation.participants[0]?.name} />
                              <Heading size="md">
                                {selectedConversation.participants.map(p => p.name).join(', ')}
                              </Heading>
                            </HStack>
                            <HStack spacing={2}>
                              {selectedConversation.participants.map((participant, index) => (
                                <Badge key={index} size="sm" colorScheme={getRoleColor(participant.role)}>
                                  <Icon as={getRoleIcon(participant.role)} mr={1} />
                                  {participant.role}
                                </Badge>
                              ))}
                              <Badge 
                                size="sm" 
                                colorScheme={selectedConversation.isActive ? 'green' : 'red'}
                              >
                                {selectedConversation.isActive ? '🟢 Active' : '🔴 Closed'}
                              </Badge>
                            </HStack>
                            {otherUserTyping && (
                              <Text fontSize="sm" color="green.500" fontStyle="italic">
                                Driver is typing...
                              </Text>
                            )}
                          </VStack>

                          <HStack spacing={2}>
                            <Tooltip label="Minimize">
                              <IconButton
                                aria-label="Minimize chat"
                                icon={<FiMinimize2 />}
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsMinimized(true)}
                              />
                            </Tooltip>
                            {selectedConversation.isActive ? (
                              <Tooltip label="Close Chat">
                                <IconButton
                                  aria-label="Close chat"
                                  icon={<FiLock />}
                                  size="sm"
                                  colorScheme="orange"
                                  onClick={handleCloseChat}
                                />
                              </Tooltip>
                            ) : (
                              <Tooltip label="Reopen Chat">
                                <IconButton
                                  aria-label="Reopen chat"
                                  icon={<FiUnlock />}
                                  size="sm"
                                  colorScheme="green"
                                  onClick={handleReopenChat}
                                />
                              </Tooltip>
                            )}
                            <Tooltip label="Archive Chat">
                              <IconButton
                                aria-label="Archive chat"
                                icon={<FiArchive />}
                                size="sm"
                                colorScheme="blue"
                                onClick={handleArchiveChat}
                              />
                            </Tooltip>
                            <Tooltip label="Delete Chat">
                              <IconButton
                                aria-label="Delete chat"
                                icon={<FiTrash2 />}
                                size="sm"
                                colorScheme="red"
                                onClick={handleDeleteChat}
                              />
                            </Tooltip>
                          </HStack>
                        </HStack>

                        {/* Closed Chat Banner */}
                        {selectedConversation && !selectedConversation.isActive && (
                          <Alert status="warning" borderRadius="md">
                            <AlertIcon />
                            <AlertDescription>
                              This conversation was closed on{' '}
                              {selectedConversation.closedAt
                                ? new Date(selectedConversation.closedAt).toLocaleString()
                                : 'unknown date'}
                              . Click the unlock icon to reopen.
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Messages */}
                        <VStack
                          spacing={3}
                          align="stretch"
                          flex={1}
                          maxH="400px"
                          overflowY="auto"
                          p={2}
                        >
                          {messages.map(message => (
                            <HStack
                              key={message.id}
                              justify={message.senderRole === 'admin' ? 'flex-end' : 'flex-start'}
                              align="start"
                              spacing={2}
                              mb={message.senderRole !== 'admin' ? 4 : 2}
                            >
                              {message.senderRole !== 'admin' && (
                                <Avatar size="sm" name={message.senderName} />
                              )}

                              <VStack
                                align={message.senderRole === 'admin' ? 'flex-end' : 'flex-start'}
                                spacing={1}
                                maxW="70%"
                              >
                                <Card
                                  bg={message.senderRole === 'admin' ? 'blue.500' : 'gray.700'}
                                  color={message.senderRole === 'admin' ? 'white' : 'black'}
                                >
                                  <CardBody p={3}>
                                    <Text fontSize="sm">{message.message}</Text>
                                  </CardBody>
                                </Card>

                                <HStack spacing={1}>
                                  {message.senderRole === 'admin' && (
                                    <Text fontSize="xs" color="gray.500">
                                      {message.senderName}
                                    </Text>
                                  )}
                                  <Text fontSize="xs" color="gray.500">
                                    {new Date(message.timestamp).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </Text>
                                  {message.read && message.senderRole === 'admin' && (
                                    <Icon as={FiCheck} boxSize="12px" color="blue.500" />
                                  )}
                                </HStack>
                              </VStack>

                              {message.senderRole === 'admin' && (
                                <Avatar size="sm" name="Support" />
                              )}
                            </HStack>
                          ))}

                          <div ref={messagesEndRef} />

                          {messages.length === 0 && (
                            <VStack spacing={4} py={8}>
                              <Icon as={FiMessageSquare} boxSize="48px" color="gray.400" />
                              <Text color="gray.500">No messages in this conversation</Text>
                            </VStack>
                          )}
                        </VStack>

                        {/* Message Input */}
                        <HStack spacing={2}>
                          <Textarea
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={handleMessageInputChange}
                            onKeyPress={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            resize="none"
                            rows={2}
                            isDisabled={!selectedConversation?.isActive}
                          />
                          <Button
                            leftIcon={<FiSend />}
                            colorScheme="blue"
                            onClick={handleSendMessage}
                            isLoading={sending}
                            loadingText="Sending..."
                            isDisabled={!newMessage.trim() || !selectedConversation?.isActive}
                          >
                            Send
                          </Button>
                        </HStack>
                      </VStack>
                    ) : (
                      <VStack spacing={6} justify="center" minH="400px">
                        <Icon as={FiMessageSquare} boxSize="64px" color="gray.400" />
                        <VStack spacing={2}>
                          <Heading size="md" color="gray.600">
                            Select a conversation
                          </Heading>
                          <Text color="gray.500" textAlign="center">
                            Choose a conversation from the list to start chatting
                          </Text>
                        </VStack>
                      </VStack>
                    )}
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>

            {/* Customer Chats Tab Panel */}
            <TabPanel p={0} pt={4}>
              <Grid templateColumns="1fr 2fr" gap={6} minH="600px">
                {/* Conversations List */}
                <Card>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Customer Chats</Heading>

                      <VStack spacing={2} align="stretch" maxH="500px" overflowY="auto">
                        {customerChats.map((conversation: any) => (
                          <Card
                            key={conversation.id}
                            cursor="pointer"
                            onClick={() => handleConversationSelect(conversation)}
                            bg={selectedConversation?.id === conversation.id ? 'blue.50' : 'white'}
                            _hover={{ bg: 'gray.50' }}
                            borderWidth={selectedConversation?.id === conversation.id ? 2 : 1}
                            borderColor={selectedConversation?.id === conversation.id ? 'blue.500' : 'gray.200'}
                          >
                            <CardBody p={3}>
                              <VStack align="start" spacing={2}>
                                <HStack justify="space-between" w="full">
                                  <HStack>
                                    <Avatar size="sm" name={conversation.customerName} />
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="medium" fontSize="sm">
                                        {conversation.customerName}
                                      </Text>
                                      <Text fontSize="xs" color="gray.500">
                                        {conversation.customerEmail}
                                      </Text>
                                      <Badge size="sm" colorScheme="purple">
                                        <Icon as={FiUser} mr={1} />
                                        customer
                                      </Badge>
                                    </VStack>
                                  </HStack>
                                  {conversation.unreadCount > 0 && (
                                    <Badge colorScheme="red" borderRadius="full">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </HStack>
                                {conversation.lastMessage && (
                                  <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                    {conversation.lastMessage.message || conversation.lastMessage.content}
                                  </Text>
                                )}
                                <Text fontSize="xs" color="gray.400">
                                  {new Date(conversation.updatedAt).toLocaleString()}
                                </Text>
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}

                        {customerChats.length === 0 && (
                          <VStack spacing={4} py={8}>
                            <Icon as={FiUser} boxSize="48px" color="gray.400" />
                            <Text color="gray.500">No customer chats yet</Text>
                          </VStack>
                        )}
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Chat Area - same as driver chats */}
                <Card>
                  <CardBody>
                    {selectedConversation ? (
                      <VStack spacing={4} align="stretch" h="full">
                        {/* Chat Header */}
                        <HStack justify="space-between" pb={2} borderBottom="1px" borderColor="gray.200">
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Avatar 
                                size="sm" 
                                name={'customerName' in selectedConversation ? selectedConversation.customerName : selectedConversation.participants[0]?.name} 
                              />
                              <Heading size="md">
                                {'customerName' in selectedConversation 
                                  ? selectedConversation.customerName 
                                  : selectedConversation.participants.map(p => p.name).join(', ')}
                              </Heading>
                            </HStack>
                            <HStack spacing={2}>
                              <Badge size="sm" colorScheme="purple">
                                <Icon as={FiUser} mr={1} />
                                Customer Support
                              </Badge>
                              <Badge 
                                size="sm" 
                                colorScheme={selectedConversation.isActive ? 'green' : 'red'}
                              >
                                {selectedConversation.isActive ? '🟢 Active' : '🔴 Closed'}
                              </Badge>
                            </HStack>
                          </VStack>
                          <HStack spacing={2}>
                            <Tooltip label="Minimize">
                              <IconButton
                                aria-label="Minimize chat"
                                icon={<FiMinimize2 />}
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsMinimized(true)}
                              />
                            </Tooltip>
                            {selectedConversation.isActive ? (
                              <Tooltip label="Close Chat">
                                <IconButton
                                  aria-label="Close chat"
                                  icon={<FiLock />}
                                  size="sm"
                                  colorScheme="orange"
                                  onClick={handleCloseChat}
                                />
                              </Tooltip>
                            ) : (
                              <Tooltip label="Reopen Chat">
                                <IconButton
                                  aria-label="Reopen chat"
                                  icon={<FiUnlock />}
                                  size="sm"
                                  colorScheme="green"
                                  onClick={handleReopenChat}
                                />
                              </Tooltip>
                            )}
                            <Tooltip label="Archive Chat">
                              <IconButton
                                aria-label="Archive chat"
                                icon={<FiArchive />}
                                size="sm"
                                colorScheme="blue"
                                onClick={handleArchiveChat}
                              />
                            </Tooltip>
                            {'customerEmail' in selectedConversation && (
                              <Tooltip label="Send Transcript to Customer">
                                <IconButton
                                  aria-label="Send email"
                                  icon={<FiMail />}
                                  size="sm"
                                  colorScheme="purple"
                                  onClick={handleSendEmail}
                                />
                              </Tooltip>
                            )}
                            <Tooltip label="Delete Chat">
                              <IconButton
                                aria-label="Delete chat"
                                icon={<FiTrash2 />}
                                size="sm"
                                colorScheme="red"
                                onClick={handleDeleteChat}
                              />
                            </Tooltip>
                          </HStack>
                        </HStack>

                        {/* Messages */}
                        <VStack
                          flex={1}
                          overflowY="auto"
                          spacing={3}
                          align="stretch"
                          maxH="450px"
                          css={{
                            '&::-webkit-scrollbar': { width: '8px' },
                            '&::-webkit-scrollbar-track': { background: '#f1f1f1' },
                            '&::-webkit-scrollbar-thumb': { background: '#888', borderRadius: '4px' },
                          }}
                        >
                          {messages.length === 0 ? (
                            <VStack spacing={4} py={8}>
                              <Icon as={FiMessageSquare} boxSize="48px" color="gray.300" />
                              <Text color="gray.500">No messages yet</Text>
                            </VStack>
                          ) : (
                            messages.map(message => (
                              <HStack
                                key={message.id}
                                justify={message.senderRole === 'admin' ? 'flex-end' : 'flex-start'}
                                align="flex-start"
                                mb={message.senderRole !== 'admin' ? 4 : 2}
                              >
                                {message.senderRole !== 'admin' && (
                                  <Avatar size="sm" name={message.senderName} />
                                )}
                                <VStack
                                  align={message.senderRole === 'admin' ? 'flex-end' : 'flex-start'}
                                  spacing={1}
                                  maxW="70%"
                                >
                                  <Box
                                    bg={message.senderRole === 'admin' ? 'blue.500' : 'gray.200'}
                                    color={message.senderRole === 'admin' ? 'white' : 'black'}
                                    px={4}
                                    py={2}
                                    borderRadius="lg"
                                  >
                                    {message.senderRole === 'admin' && (
                                      <Text fontSize="sm" fontWeight="medium" mb={1} color="white">
                                        {message.senderName}
                                      </Text>
                                    )}
                                    <Text fontSize="sm" whiteSpace="pre-wrap" color={message.senderRole === 'admin' ? 'white' : 'black'}>
                                      {message.message}
                                    </Text>
                                  </Box>
                                  <HStack spacing={2}>
                                    <Text fontSize="xs" color="gray.500">
                                      {new Date(message.timestamp).toLocaleString()}
                                    </Text>
                                    {message.senderRole === 'admin' && (
                                      <Icon
                                        as={FiCheck}
                                        color={message.read ? 'blue.500' : 'gray.400'}
                                        boxSize="12px"
                                      />
                                    )}
                                  </HStack>
                                </VStack>
                                {message.senderRole === 'admin' && (
                                  <Avatar size="sm" name="Support" bg="blue.500" />
                                )}
                              </HStack>
                            ))
                          )}
                          <div ref={messagesEndRef} />
                        </VStack>

                        {/* Message Input */}
                        {selectedConversation.isActive && (
                          <HStack spacing={2}>
                            <Textarea
                              value={newMessage}
                              onChange={e => setNewMessage(e.target.value)}
                              placeholder="Type your message..."
                              resize="none"
                              rows={2}
                            />
                            <Button
                              colorScheme="blue"
                              leftIcon={<FiSend />}
                              onClick={handleSendMessage}
                              isLoading={sending}
                              isDisabled={!newMessage.trim()}
                            >
                              Send
                            </Button>
                          </HStack>
                        )}

                        {!selectedConversation.isActive && (
                          <Alert status="warning">
                            <AlertIcon />
                            <AlertDescription>
                              This chat is closed. Messages cannot be sent.
                            </AlertDescription>
                          </Alert>
                        )}
                      </VStack>
                    ) : (
                      <VStack spacing={4} justify="center" align="center" h="full">
                        <Icon as={FiMessageSquare} boxSize="64px" color="gray.300" />
                        <Text color="gray.500" fontSize="lg">
                          Select a customer chat to view messages
                        </Text>
                      </VStack>
                    )}
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>

            {/* Archived Tab Panel */}
            <TabPanel p={0} pt={4}>
              <Grid templateColumns="1fr 2fr" gap={6} minH="600px">
                {/* Same structure for archived - reuse component */}
                <Card>
                  <CardBody>
                    <VStack spacing={4} align="stretch">
                      <Heading size="md">Archived Conversations</Heading>

                      <VStack spacing={2} align="stretch" maxH="500px" overflowY="auto">
                        {archivedConversations.map(conversation => (
                          <Card
                            key={conversation.id}
                            cursor="pointer"
                            onClick={() => handleConversationSelect(conversation)}
                            bg={selectedConversation?.id === conversation.id ? 'red.900' : 'gray.800'}
                            _hover={{ bg: 'gray.700' }}
                          >
                            <CardBody p={3}>
                              <VStack align="start" spacing={2}>
                                <HStack justify="space-between" w="full">
                                  <HStack>
                                    <Avatar size="sm" name={conversation.participants[0]?.name} />
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="medium" fontSize="sm">
                                        {conversation.participants.map(p => p.name).join(', ')}
                                      </Text>
                                      <Badge size="sm" colorScheme="red">
                                        🔴 Closed
                                      </Badge>
                                    </VStack>
                                  </HStack>
                                </HStack>

                                {conversation.lastMessage && (
                                  <Text fontSize="sm" color="gray.600" noOfLines={1}>
                                    {conversation.lastMessage.message}
                                  </Text>
                                )}

                                <Text fontSize="xs" color="gray.500">
                                  Closed: {conversation.closedAt ? new Date(conversation.closedAt).toLocaleString() : 'Unknown'}
                                </Text>
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}

                        {archivedConversations.length === 0 && (
                          <VStack spacing={4} py={8}>
                            <Icon as={FiArchive} boxSize="48px" color="gray.400" />
                            <Text color="gray.500">No archived conversations</Text>
                          </VStack>
                        )}
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>

                {/* Archived Chat View - Reuse same component */}
                <Card>
                  <CardBody>
                    {selectedConversation ? (
                      <VStack spacing={4} align="stretch" h="full">
                        <HStack justify="space-between" pb={2} borderBottom="1px" borderColor="gray.200">
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Avatar size="sm" name={selectedConversation.participants[0]?.name} />
                              <Heading size="md">
                                {selectedConversation.participants.map(p => p.name).join(', ')}
                              </Heading>
                            </HStack>
                            <Badge colorScheme="red">🔴 Closed</Badge>
                          </VStack>

                          <Tooltip label="Reopen Conversation">
                            <Button
                              leftIcon={<FiUnlock />}
                              size="sm"
                              colorScheme="green"
                              onClick={handleReopenChat}
                            >
                              Reopen
                            </Button>
                          </Tooltip>
                        </HStack>

                        <Alert status="info">
                          <AlertIcon />
                          <AlertDescription>
                            This conversation is archived. Reopen it to continue chatting.
                          </AlertDescription>
                        </Alert>

                        {/* Messages - Read only */}
                        <VStack
                          spacing={3}
                          align="stretch"
                          flex={1}
                          maxH="400px"
                          overflowY="auto"
                          p={2}
                        >
                          {messages.map(message => (
                            <HStack
                              key={message.id}
                              justify={message.senderRole === 'admin' ? 'flex-end' : 'flex-start'}
                              align="start"
                              spacing={2}
                              mb={message.senderRole !== 'admin' ? 4 : 2}
                            >
                              {message.senderRole !== 'admin' && (
                                <Avatar size="sm" name={message.senderName} />
                              )}

                              <VStack
                                align={message.senderRole === 'admin' ? 'flex-end' : 'flex-start'}
                                spacing={1}
                                maxW="70%"
                              >
                                <Card
                                  bg={message.senderRole === 'admin' ? 'blue.500' : 'gray.700'}
                                  color={message.senderRole === 'admin' ? 'white' : 'black'}
                                >
                                  <CardBody p={3}>
                                    <Text fontSize="sm">{message.message}</Text>
                                  </CardBody>
                                </Card>

                                <Text fontSize="xs" color="gray.500">
                                  {new Date(message.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Text>
                              </VStack>

                              {message.senderRole === 'admin' && (
                                <Avatar size="sm" name="Support" />
                              )}
                            </HStack>
                          ))}
                        </VStack>
                      </VStack>
                    ) : (
                      <VStack spacing={6} justify="center" minH="400px">
                        <Icon as={FiArchive} boxSize="64px" color="gray.400" />
                        <Text color="gray.500">Select an archived conversation to view</Text>
                      </VStack>
                    )}
                  </CardBody>
                </Card>
              </Grid>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
}

