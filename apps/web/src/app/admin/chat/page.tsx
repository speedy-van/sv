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
} from 'react-icons/fi';
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

export default function EnhancedAdminChatPage() {
  const [activeConversations, setActiveConversations] = useState<ChatConversation[]>([]);
  const [archivedConversations, setArchivedConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const toast = useToast();
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingIndicatorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadAllChats();
    setupPusher();
    
    // Broadcast admin online status
    broadcastAdminStatus('online');

    return () => {
      // Broadcast offline status before cleanup
      broadcastAdminStatus('offline');
      cleanupPusher();
    };
  }, []);

  const loadAllChats = async () => {
    try {
      setLoading(true);
      const [activeData, archivedData] = await Promise.all([
        fetchActiveChats(),
        fetchArchivedChats(),
      ]);

      if (activeData.success) {
        setActiveConversations(activeData.chats || []);
      }

      if (archivedData.success) {
        setArchivedConversations(archivedData.chats || []);
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

      console.log('✅ Admin chat Pusher connected');
    } catch (error) {
      console.error('❌ Failed to setup Pusher:', error);
    }
  };

  const cleanupPusher = () => {
    if (channelRef.current) {
      channelRef.current.unbind_all();
      if (pusherRef.current) {
        pusherRef.current.unsubscribe('admin-chat');
      }
      channelRef.current = null;
    }
    if (pusherRef.current) {
      pusherRef.current.disconnect();
      pusherRef.current = null;
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/admin/chat/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const sanitizedMessages = data.messages.map((msg: ChatMessage) => ({
          ...msg,
          senderName: msg.senderRole === 'admin' ? 'Support' : msg.senderName
        }));
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

  const handleConversationSelect = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
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

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      sendTypingIndicator(false);
    }

    setSending(true);
    try {
      const response = await fetch(`/api/admin/chat/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const sanitizedMessage = {
          ...data.message,
          senderName: 'Support'
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
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
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

  const displayConversations = tabIndex === 0 ? activeConversations : archivedConversations;

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <VStack align="start" spacing={1}>
            <Heading size="lg">Chat Support</Heading>
            <Text color="gray.600">
              Manage driver communications
            </Text>
          </VStack>
        </Flex>

        <Tabs index={tabIndex} onChange={setTabIndex}>
          <TabList>
            <Tab>
              <HStack spacing={2}>
                <Icon as={FiMessageSquare} />
                <Text>Active Chats</Text>
                <Badge colorScheme="green">{activeConversations.length}</Badge>
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
                      <Heading size="md">Active Conversations</Heading>

                      <VStack spacing={2} align="stretch" maxH="500px" overflowY="auto">
                        {displayConversations.map(conversation => (
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
                                    <Avatar size="sm" name={conversation.participants[0]?.name} />
                                    <VStack align="start" spacing={0}>
                                      <Text fontWeight="medium" fontSize="sm">
                                        {conversation.participants.map(p => p.name).join(', ')}
                                      </Text>
                                      <HStack spacing={2}>
                                        <Badge size="sm" colorScheme={getRoleColor(conversation.participants[0]?.role)}>
                                          {conversation.participants[0]?.role}
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
                                    {conversation.lastMessage.message}
                                  </Text>
                                )}

                                <Text fontSize="xs" color="gray.500">
                                  {new Date(conversation.updatedAt).toLocaleString()}
                                </Text>
                              </VStack>
                            </CardBody>
                          </Card>
                        ))}

                        {displayConversations.length === 0 && (
                          <VStack spacing={4} py={8}>
                            <Icon as={FiMessageSquare} boxSize="48px" color="gray.400" />
                            <Text color="gray.500">
                              {tabIndex === 0 ? 'No active conversations' : 'No archived conversations'}
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
                            {selectedConversation.isActive ? (
                              <Tooltip label="Close Conversation">
                                <IconButton
                                  aria-label="Close conversation"
                                  icon={<FiLock />}
                                  size="sm"
                                  colorScheme="red"
                                  variant="ghost"
                                  onClick={handleCloseChat}
                                />
                              </Tooltip>
                            ) : (
                              <Tooltip label="Reopen Conversation">
                                <IconButton
                                  aria-label="Reopen conversation"
                                  icon={<FiUnlock />}
                                  size="sm"
                                  colorScheme="green"
                                  variant="ghost"
                                  onClick={handleReopenChat}
                                />
                              </Tooltip>
                            )}
                          </HStack>
                        </HStack>

                        {/* Closed Chat Banner */}
                        {!selectedConversation.isActive && (
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
                                  <Text fontSize="xs" color="gray.500">
                                    {message.senderName}
                                  </Text>
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
                            isDisabled={!selectedConversation.isActive}
                          />
                          <Button
                            leftIcon={<FiSend />}
                            colorScheme="blue"
                            onClick={handleSendMessage}
                            isLoading={sending}
                            loadingText="Sending..."
                            isDisabled={!newMessage.trim() || !selectedConversation.isActive}
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

