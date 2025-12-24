'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  IconButton,
  useToast,
  Spinner,
  Badge,
  Divider,
  Avatar,
  Flex,
} from '@chakra-ui/react';
import { FiX, FiSend, FiMessageCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'admin' | 'driver';
  createdAt: string;
  readAt?: string;
}

interface CustomerChatWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerChatWidget({ isOpen, onClose }: CustomerChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat session
  useEffect(() => {
    if (isOpen && !chatSessionId) {
      initializeChat();
    }
  }, [isOpen]);

  const initializeChat = async () => {
    setIsLoading(true);
    try {
      // Get customer info from localStorage or prompt
      const storedName = localStorage.getItem('customer_name') || '';
      const storedEmail = localStorage.getItem('customer_email') || '';

      if (!storedName || !storedEmail) {
        // Show a simple form to collect customer info
        // For now, we'll use a simple approach - in production, you might want a modal
        const name = prompt('Please enter your name:');
        const email = prompt('Please enter your email:');
        
        if (name && email) {
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            toast({
              title: 'Invalid Email',
              description: 'Please enter a valid email address',
              status: 'error',
              duration: 3000,
            });
            onClose();
            return;
          }
          
          localStorage.setItem('customer_name', name);
          localStorage.setItem('customer_email', email);
          setCustomerName(name);
          setCustomerEmail(email);
        } else {
          toast({
            title: 'Information Required',
            description: 'Please provide your name and email to start chatting',
            status: 'warning',
            duration: 3000,
          });
          onClose();
          return;
        }
      } else {
        setCustomerName(storedName);
        setCustomerEmail(storedEmail);
      }

      // For unauthenticated customers, we'll create a support inquiry
      // The admin will be notified and can respond
      // For now, we'll use a simplified approach - store messages locally
      // In production, you'd want to create a proper chat session via API
      
      // Create a temporary session ID for this chat
      const tempSessionId = `customer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setChatSessionId(tempSessionId);
      
      // Send initial message to support
      const welcomeMessage: Message = {
        id: `welcome-${Date.now()}`,
        content: `Hello! ${customerName} (${customerEmail}) is requesting support.`,
        senderId: 'system',
        senderName: 'System',
        senderRole: 'admin',
        createdAt: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
      
      // TODO: In production, create actual chat session via API
      // For now, we'll use a simplified approach
      
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to start chat. Please try again.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (sessionId: string) => {
    try {
      // For unauthenticated customers, we'll skip loading messages
      // In production, you'd want to implement a guest chat session system
      // For now, we'll just show the welcome message
      return;
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatSessionId || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Optimistically add message to UI
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      senderId: 'customer',
      senderName: customerName || 'You',
      senderRole: 'customer',
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      // Send message via contact API (for unauthenticated customers)
      // This will notify admin and create a support inquiry
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customerName,
          email: customerEmail,
          phone: '',
          service: 'Live Chat Support',
          message: `[Live Chat] ${messageContent}`,
          source: 'live-chat',
          chatSessionId: chatSessionId,
        }),
      });

      if (response.ok) {
        // Message sent successfully
        // In production, you'd want to use WebSocket/Pusher for real-time updates
        // For now, we'll keep the message in the UI
        const realMessage: Message = {
          ...tempMessage,
          id: `msg-${Date.now()}`,
        };
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id ? realMessage : msg
        ));
        
        toast({
          title: 'Message Sent',
          description: 'Our support team will respond shortly',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again or call us at 01202 129746',
        status: 'error',
        duration: 4000,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <MotionBox
        position="fixed"
        bottom={{ base: 0, md: '100px' }}
        right={{ base: 0, md: '30px' }}
        w={{ base: '100%', md: '400px' }}
        h={{ base: '100%', md: '600px' }}
        maxH={{ base: '100%', md: '600px' }}
        bg="white"
        borderRadius={{ base: 0, md: '16px 16px 0 0' }}
        boxShadow="0 -4px 20px rgba(0, 0, 0, 0.15)"
        zIndex={9999}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ duration: 0.3, type: 'spring' }}
      >
        {/* Header */}
        <Box
          bg="linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)"
          color="white"
          p={4}
          borderRadius={{ base: 0, md: '16px 16px 0 0' }}
        >
          <HStack justify="space-between" align="center">
            <HStack spacing={3}>
              <Avatar size="sm" bg="white" color="blue.600">
                <FiMessageCircle />
              </Avatar>
              <VStack align="start" spacing={0}>
                <Text fontWeight="bold" fontSize="md">
                  Live Chat Support
                </Text>
                <Text fontSize="xs" opacity={0.9}>
                  We're here to help
                </Text>
              </VStack>
            </HStack>
            <IconButton
              icon={<FiX />}
              aria-label="Close chat"
              onClick={onClose}
              variant="ghost"
              color="white"
              size="sm"
              _hover={{ bg: 'rgba(255, 255, 255, 0.2)' }}
            />
          </HStack>
        </Box>

        {/* Messages Area */}
        <Box
          flex={1}
          overflowY="auto"
          p={4}
          bg="gray.50"
          css={{
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#CBD5E0',
              borderRadius: '3px',
            },
          }}
        >
          {isLoading ? (
            <Flex justify="center" align="center" h="full">
              <VStack spacing={4}>
                <Spinner size="lg" color="blue.500" />
                <Text color="gray.600" fontSize="sm">
                  Connecting to support...
                </Text>
              </VStack>
            </Flex>
          ) : messages.length === 0 ? (
            <VStack spacing={4} align="center" justify="center" h="full">
              <Box
                bg="blue.50"
                borderRadius="full"
                p={6}
                boxShadow="0 4px 12px rgba(37, 99, 235, 0.1)"
              >
                <FiMessageCircle size={48} color="#2563EB" />
              </Box>
              <VStack spacing={2} align="center">
                <Text fontWeight="bold" fontSize="lg" color="gray.700">
                  Start a conversation
                </Text>
                <Text fontSize="sm" color="gray.500" textAlign="center" maxW="300px">
                  Our support team is here to help. Send us a message and we'll get back to you as soon as possible.
                </Text>
              </VStack>
            </VStack>
          ) : (
            <VStack spacing={3} align="stretch">
              {messages.map((message) => {
                const isCustomer = message.senderRole === 'customer';
                return (
                  <Flex
                    key={message.id}
                    justify={isCustomer ? 'flex-end' : 'flex-start'}
                    align="flex-start"
                    gap={2}
                  >
                    {!isCustomer && (
                      <Avatar size="xs" bg="blue.500" name={message.senderName} />
                    )}
                    <Box
                      maxW="75%"
                      bg={isCustomer ? 'blue.500' : 'white'}
                      color={isCustomer ? 'white' : 'gray.800'}
                      px={4}
                      py={2}
                      borderRadius="lg"
                      boxShadow="sm"
                    >
                      <Text fontSize="sm" lineHeight="1.5">
                        {message.content}
                      </Text>
                      <Text
                        fontSize="xs"
                        mt={1}
                        opacity={0.7}
                        textAlign={isCustomer ? 'right' : 'left'}
                      >
                        {new Date(message.createdAt).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </Box>
                    {isCustomer && (
                      <Avatar size="xs" bg="gray.400" name={customerName} />
                    )}
                  </Flex>
                );
              })}
              <div ref={messagesEndRef} />
            </VStack>
          )}
        </Box>

        {/* Input Area */}
        <Box
          p={4}
          bg="white"
          borderTop="1px solid"
          borderColor="gray.200"
        >
          <HStack spacing={2}>
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending || !chatSessionId}
              size="md"
              borderRadius="full"
              bg="gray.50"
              _focus={{
                bg: 'white',
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px #2563EB',
              }}
            />
            <IconButton
              icon={isSending ? <Spinner size="sm" /> : <FiSend />}
              aria-label="Send message"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending || !chatSessionId}
              colorScheme="blue"
              size="md"
              borderRadius="full"
              bg="linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)"
              color="white"
              _hover={{
                bg: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
              }}
            />
          </HStack>
          <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
            Support hours: Mon-Fri 8AM-8PM, Sat-Sun 9AM-6PM
          </Text>
        </Box>
      </MotionBox>
    </AnimatePresence>
  );
}

