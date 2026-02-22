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
import Pusher from 'pusher-js';

const MotionBox = motion.create(Box);

// Add global style to override globals.css for customer chat input
if (typeof document !== 'undefined') {
  const styleId = 'customer-chat-input-override';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .customer-chat-input,
      .customer-chat-input input,
      .customer-chat-input fieldset,
      input.customer-chat-input,
      [class*="chakra-input"].customer-chat-input {
        color: #0B1020;
        background: white;
        background-color: white;
        -webkit-text-fill-color: #0B1020;
        -webkit-text-stroke-color: #0B1020;
        -webkit-text-stroke-width: 0px;
        opacity: 1;
        font-size: 16px;
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
      }
      .customer-chat-input::placeholder,
      .customer-chat-input input::placeholder {
        color: #9CA3AF;
        -webkit-text-fill-color: #9CA3AF;
        opacity: 1;
      }
      .customer-chat-input:focus,
      .customer-chat-input:focus-within,
      .customer-chat-input:hover,
      .customer-chat-input:active,
      .customer-chat-input:focus-visible {
        color: #0B1020;
        background: white;
        background-color: white;
        -webkit-text-fill-color: #0B1020;
        -webkit-text-stroke-color: #0B1020;
        opacity: 1;
      }
      .customer-chat-input:disabled,
      .customer-chat-input[disabled] {
        color: #0B1020;
        background: white;
        background-color: white;
        -webkit-text-fill-color: #0B1020;
        opacity: 1;
        cursor: text;
      }
      /* iOS Safari specific fixes */
      @supports (-webkit-touch-callout: none) {
        .customer-chat-input {
          color: #0B1020;
          -webkit-text-fill-color: #0B1020;
          background-color: white;
          font-size: 16px;
        }
      }
      /* Autofill fixes */
      .customer-chat-input:-webkit-autofill,
      .customer-chat-input:-webkit-autofill:hover,
      .customer-chat-input:-webkit-autofill:focus,
      .customer-chat-input:-webkit-autofill:active {
        -webkit-text-fill-color: #0B1020;
        -webkit-box-shadow: 0 0 0px 1000px white inset;
        box-shadow: 0 0 0px 1000px white inset;
        background-color: white;
        color: #0B1020;
        transition: background-color 5000s ease-in-out 0s;
      }
    `;
    document.head.appendChild(style);
  }
}

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
  const [customerPhone, setCustomerPhone] = useState('');
  const [showInfoForm, setShowInfoForm] = useState(true); // Start with form visible
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<any>(null);
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
      // Get customer info from localStorage
      let finalName = localStorage.getItem('customer_name') || '';
      let finalEmail = localStorage.getItem('customer_email') || '';

      if (!finalName || !finalEmail || finalName.trim() === '' || finalEmail.trim() === '') {
        // Show custom form instead of browser prompt
        setShowInfoForm(true);
        setIsLoading(false);
        return;
      }

      // Trim existing values from localStorage
      finalName = finalName.trim();
      finalEmail = finalEmail.trim();

      // Hide the info form since we have the data
      setShowInfoForm(false);

      // Update state with final values
      setCustomerName(finalName);
      setCustomerEmail(finalEmail);

      // Create chat session via API using final values (not state)
      const sessionResponse = await fetch('/api/customer/chat/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: finalName.trim(),
          customerEmail: finalEmail.trim(),
          customerPhone: customerPhone || null,
        }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json();
        throw new Error(errorData.error || 'Failed to create chat session');
      }

      const sessionData = await sessionResponse.json();
      const sessionId = sessionData.data.sessionId;
      setChatSessionId(sessionId);

      // Load existing messages (use finalEmail, not customerEmail from state)
      await loadMessages(sessionId, finalEmail);

      // Set up Pusher for real-time messages
      setupPusher(sessionId);
      
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

  const loadMessages = async (sessionId: string, email?: string) => {
    try {
      const emailToUse = email || customerEmail;
      if (!emailToUse) {
        console.warn('No customer email available to load messages');
        return;
      }
      
      const response = await fetch(
        `/api/customer/chat/messages?sessionId=${sessionId}&customerEmail=${encodeURIComponent(emailToUse)}`
      );

      if (!response.ok) {
        throw new Error('Failed to load messages');
      }

      const data = await response.json();
      if (data.success && data.data.messages) {
        // Remove duplicates based on id
        const uniqueMessages = data.data.messages.reduce((acc: Message[], msg: Message) => {
          if (!acc.find(m => m.id === msg.id)) {
            acc.push(msg);
          }
          return acc;
        }, [] as Message[]);
        // Sort by createdAt to ensure correct order
        uniqueMessages.sort((a: Message, b: Message) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(uniqueMessages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const setupPusher = (sessionId: string) => {
    try {
      // Get Pusher config from environment
      const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
      const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu';
      
      if (!pusherKey) {
        console.warn('⚠️ Pusher key not found, real-time updates disabled');
        return;
      }

      // Initialize Pusher
      if (!pusherRef.current) {
        pusherRef.current = new Pusher(pusherKey, {
          cluster: pusherCluster,
          authEndpoint: '/api/pusher/auth',
        });
      }

      // Subscribe to chat channel
      const channelName = `customer-chat-${sessionId}`;
      if (channelRef.current) {
        pusherRef.current.unsubscribe(channelName);
      }

      channelRef.current = pusherRef.current.subscribe(channelName);

      // Listen for new messages
      channelRef.current.bind('new-message', (data: any) => {
        const newMessage: Message = {
          id: data.message.id,
          content: data.message.content,
          senderId: data.message.senderId,
          senderName: data.message.senderName,
          senderRole: data.message.senderRole === 'admin' ? 'admin' : 'customer',
          createdAt: data.message.createdAt,
        };

        setMessages((prev) => {
          // Avoid duplicates - check by id and also remove any temp messages with same content
          const existingIndex = prev.findIndex((msg) => msg.id === newMessage.id);
          if (existingIndex !== -1) {
            return prev; // Message already exists
          }
          
          // Remove any temp messages that might have the same content (optimistic update)
          const filtered = prev.filter((msg) => 
            !(msg.id.startsWith('temp-') && msg.content === newMessage.content && msg.senderRole === newMessage.senderRole)
          );
          
          return [...filtered, newMessage];
        });
      });

      console.log('✅ Pusher connected for customer chat');
    } catch (error) {
      console.error('Failed to setup Pusher:', error);
    }
  };

  // Cleanup Pusher on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current && pusherRef.current) {
        pusherRef.current.unsubscribe(channelRef.current.name);
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
      }
    };
  }, []);

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
      // Send message via customer chat API
      const response = await fetch('/api/customer/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: chatSessionId,
          customerEmail: customerEmail,
          content: messageContent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Replace temp message with real message
          const realMessage: Message = {
            id: data.data.id,
            content: data.data.content,
            senderId: data.data.senderId,
            senderName: data.data.senderName,
            senderRole: data.data.senderRole,
            createdAt: data.data.createdAt,
          };
          setMessages(prev => {
            // Remove temp message and check if real message already exists (from Pusher)
            const withoutTemp = prev.filter(msg => msg.id !== tempMessage.id);
            const existingIndex = withoutTemp.findIndex(msg => msg.id === realMessage.id);
            if (existingIndex !== -1) {
              // Real message already exists (from Pusher), just remove temp
              return withoutTemp;
            }
            // Add real message
            return [...withoutTemp, realMessage];
          });
          
          toast({
            title: 'Message Sent',
            description: 'Our support team will respond shortly',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        } else {
          throw new Error(data.error || 'Failed to send message');
        }
      } else {
        const errorData = await response.json();
        // Remove temp message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        throw new Error(errorData.error || 'Failed to send message');
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

  const handleInfoFormSubmit = async () => {
    // Validate inputs
    if (!formName.trim() || !formEmail.trim()) {
      toast({
        title: 'Information Required',
        description: 'Please provide your name and email',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail.trim())) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    // Store in localStorage
    const trimmedName = formName.trim();
    const trimmedEmail = formEmail.trim();
    localStorage.setItem('customer_name', trimmedName);
    localStorage.setItem('customer_email', trimmedEmail);
    
    // Update state
    setCustomerName(trimmedName);
    setCustomerEmail(trimmedEmail);
    
    // Hide form and continue initialization
    setShowInfoForm(false);
    setIsLoading(true);
    
    // Continue with chat session creation
    await initializeChat();
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
        zIndex={10001}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ duration: 0.3, type: 'spring' }}
      >
        {/* Show Info Form or Chat Interface */}
        {showInfoForm ? (
          <>
            {/* Header for Info Form */}
            <Box
              bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
              p={{ base: 3, md: 5 }}
              borderRadius={{ base: 0, md: '16px 16px 0 0' }}
              boxShadow="0 4px 12px rgba(16, 185, 129, 0.25)"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bg: 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none',
              }}
            >
              <Flex 
                justify="space-between" 
                align="center" 
                position="relative" 
                zIndex={1}
                gap={{ base: 2, md: 3 }}
              >
                <Flex align="center" gap={{ base: 2, md: 3 }} flex="1" minW="0">
                  <Box
                    bg="white"
                    borderRadius="full"
                    p={{ base: 2, md: 2.5 }}
                    boxShadow="0 4px 8px rgba(0, 0, 0, 0.15)"
                    position="relative"
                    flexShrink={0}
                  >
                    <Box as={FiMessageCircle} boxSize={{ base: '18px', md: '22px' }} color="#10b981" />
                    <Box
                      position="absolute"
                      top="2px"
                      right="2px"
                      w={{ base: '6px', md: '8px' }}
                      h={{ base: '6px', md: '8px' }}
                      bg="#22c55e"
                      borderRadius="full"
                      border="2px solid white"
                      boxShadow="0 0 8px rgba(34, 197, 94, 0.6)"
                    />
                  </Box>
                  <Box flex="1" minW="0">
                    <Text 
                      fontWeight="700" 
                      fontSize={{ base: 'md', md: 'lg' }} 
                      letterSpacing="tight"
                      lineHeight="1.3"
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      color="#0B1020"
                      sx={{
                        color: '#0B1020',
                        WebkitTextFillColor: '#0B1020',
                        textShadow: '0 0 1px rgba(0,0,0,0.5)',
                      }}
                    >
                      Chat Support
                    </Text>
                    <Flex align="center" gap={1} mt={{ base: 0.5, md: 0.5 }}>
                      <Box w={{ base: '6px', md: '6px' }} h={{ base: '6px', md: '6px' }} bg="#0B1020" borderRadius="full" flexShrink={0} />
                      <Text 
                        fontSize={{ base: '11px', md: 'xs' }}
                        fontWeight="600"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        color="#0B1020"
                        sx={{
                          color: '#0B1020',
                          WebkitTextFillColor: '#0B1020',
                          textShadow: '0 0 1px rgba(0,0,0,0.5)',
                        }}
                      >
                        We're online • Ready to help
                      </Text>
                    </Flex>
                  </Box>
                </Flex>
                <IconButton
                  icon={<FiX />}
                  aria-label="Close chat"
                  onClick={onClose}
                  variant="ghost"
                  color="white"
                  size={{ base: 'sm', md: 'md' }}
                  borderRadius="full"
                  flexShrink={0}
                  _hover={{ 
                    bg: 'rgba(255, 255, 255, 0.25)',
                    transform: 'rotate(90deg)',
                  }}
                  _active={{
                    bg: 'rgba(255, 255, 255, 0.3)',
                  }}
                  transition="all 0.3s ease"
                />
              </Flex>
            </Box>

            {/* Form Content */}
            <Box flex={1} overflowY="auto" p={6} bg="white">
              <VStack spacing={6} align="stretch" justify="flex-start">
                <VStack spacing={3} align="center" pt={4}>
                  <Box
                    bg="blue.50"
                    borderRadius="full"
                    p={5}
                    boxShadow="0 4px 12px rgba(37, 99, 235, 0.1)"
                  >
                    <FiMessageCircle size={40} color="#2563EB" />
                  </Box>
                  <VStack spacing={1} align="center">
                    <Text fontWeight="bold" fontSize="lg" color="gray.800" textAlign="center">
                      Welcome to Live Chat
                    </Text>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      Please introduce yourself to start chatting
                    </Text>
                  </VStack>
                </VStack>

                <VStack spacing={4} align="stretch" w="full">
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
                      Your Name *
                    </Text>
                    <Input
                      className="customer-chat-input"
                      placeholder="Enter your full name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      size="lg"
                      bg="white"
                      color="#0B1020"
                      border="2px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      _placeholder={{ color: 'gray.400', WebkitTextFillColor: '#9CA3AF' }}
                      _hover={{
                        borderColor: 'gray.300',
                      }}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
                        bg: 'white',
                        color: '#0B1020',
                      }}
                      sx={{
                        WebkitTextFillColor: '#0B1020',
                        WebkitTextStrokeColor: '#0B1020',
                        caretColor: '#0B1020',
                        opacity: '1',
                        fontSize: '16px',
                        '&:-webkit-autofill': {
                          WebkitTextFillColor: '#0B1020',
                          WebkitBoxShadow: '0 0 0px 1000px white inset',
                          backgroundColor: 'white',
                        },
                        '&:-webkit-autofill:focus': {
                          WebkitTextFillColor: '#0B1020',
                          WebkitBoxShadow: '0 0 0px 1000px white inset',
                        },
                      }}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={2}>
                      Email Address *
                    </Text>
                    <Input
                      className="customer-chat-input"
                      type="email"
                      placeholder="Enter your email address"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      size="lg"
                      bg="white"
                      color="#0B1020"
                      border="2px solid"
                      borderColor="gray.200"
                      borderRadius="md"
                      _placeholder={{ color: 'gray.400', WebkitTextFillColor: '#9CA3AF' }}
                      _hover={{
                        borderColor: 'gray.300',
                      }}
                      _focus={{
                        borderColor: 'blue.500',
                        boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
                        bg: 'white',
                        color: '#0B1020',
                      }}
                      sx={{
                        WebkitTextFillColor: '#0B1020',
                        WebkitTextStrokeColor: '#0B1020',
                        caretColor: '#0B1020',
                        opacity: '1',
                        fontSize: '16px',
                        '&:-webkit-autofill': {
                          WebkitTextFillColor: '#0B1020',
                          WebkitBoxShadow: '0 0 0px 1000px white inset',
                          backgroundColor: 'white',
                        },
                        '&:-webkit-autofill:focus': {
                          WebkitTextFillColor: '#0B1020',
                          WebkitBoxShadow: '0 0 0px 1000px white inset',
                        },
                      }}
                    />
                  </Box>

                  <Button
                    onClick={handleInfoFormSubmit}
                    size="lg"
                    bg="linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)"
                    color="white"
                    _hover={{
                      bg: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
                    }}
                    _active={{
                      transform: 'translateY(0)',
                    }}
                    leftIcon={<FiMessageCircle />}
                    isLoading={isLoading}
                    loadingText="Starting chat..."
                    isDisabled={!formName.trim() || !formEmail.trim()}
                  >
                    Start Chat
                  </Button>
                </VStack>

                <Divider />

                <Text fontSize="xs" color="gray.500" textAlign="center">
                  By continuing, you agree to our terms of service and privacy policy
                </Text>
              </VStack>
            </Box>
          </>
        ) : (
          <>
            {/* Header */}
            <Box
              bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
              p={{ base: 3, md: 5 }}
              borderRadius={{ base: 0, md: '16px 16px 0 0' }}
              boxShadow="0 4px 12px rgba(16, 185, 129, 0.25)"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bg: 'radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none',
              }}
            >
              <Flex 
                justify="space-between" 
                align="center" 
                position="relative" 
                zIndex={1}
                gap={{ base: 2, md: 3 }}
              >
                <Flex align="center" gap={{ base: 2, md: 3 }} flex="1" minW="0">
                  <Box
                    bg="white"
                    borderRadius="full"
                    p={{ base: 2, md: 2.5 }}
                    boxShadow="0 4px 8px rgba(0, 0, 0, 0.15)"
                    position="relative"
                    flexShrink={0}
                  >
                    <Box as={FiMessageCircle} boxSize={{ base: '18px', md: '22px' }} color="#10b981" />
                    <Box
                      position="absolute"
                      top="2px"
                      right="2px"
                      w={{ base: '6px', md: '8px' }}
                      h={{ base: '6px', md: '8px' }}
                      bg="#22c55e"
                      borderRadius="full"
                      border="2px solid white"
                      boxShadow="0 0 8px rgba(34, 197, 94, 0.6)"
                    />
                  </Box>
                  <Box flex="1" minW="0">
                    <Text 
                      fontWeight="700" 
                      fontSize={{ base: 'md', md: 'lg' }} 
                      letterSpacing="tight"
                      lineHeight="1.3"
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      color="#0B1020"
                      sx={{
                        color: '#0B1020',
                        WebkitTextFillColor: '#0B1020',
                        textShadow: '0 0 1px rgba(0,0,0,0.5)',
                      }}
                    >
                      Live Chat Support
                    </Text>
                    <Flex align="center" gap={1} mt={{ base: 0.5, md: 0.5 }}>
                      <Box w={{ base: '6px', md: '6px' }} h={{ base: '6px', md: '6px' }} bg="#0B1020" borderRadius="full" flexShrink={0} />
                      <Text 
                        fontSize={{ base: '11px', md: 'xs' }}
                        fontWeight="600"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        color="#0B1020"
                        sx={{
                          color: '#0B1020',
                          WebkitTextFillColor: '#0B1020',
                          textShadow: '0 0 1px rgba(0,0,0,0.5)',
                        }}
                      >
                        We're online • Ready to help
                      </Text>
                    </Flex>
                  </Box>
                </Flex>
                <IconButton
                  icon={<FiX />}
                  aria-label="Close chat"
                  onClick={onClose}
                  variant="ghost"
                  color="white"
                  size={{ base: 'sm', md: 'md' }}
                  borderRadius="full"
                  flexShrink={0}
                  _hover={{ 
                    bg: 'rgba(255, 255, 255, 0.25)',
                    transform: 'rotate(90deg)',
                  }}
                  _active={{
                    bg: 'rgba(255, 255, 255, 0.3)',
                  }}
                  transition="all 0.3s ease"
                />
              </Flex>
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
                    // Use id + timestamp for unique key (id alone might be duplicated during temp->real transition)
                    const uniqueKey = message.id.startsWith('temp-') 
                      ? `${message.id}-${message.createdAt}` 
                      : message.id;
                    return (
                      <Flex
                        key={uniqueKey}
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
                          color={isCustomer ? 'white' : 'black'}
                          px={4}
                          py={2}
                          borderRadius="lg"
                          boxShadow="sm"
                        >
                          <Text fontSize="sm" lineHeight="1.5" color={isCustomer ? 'white' : 'black'}>
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
          </>
        )}

        {/* Input Area - Only show when chat is active */}
        {!showInfoForm && (
          <Box
          p={4}
          bg="white"
          borderTop="1px solid"
          borderColor="gray.200"
          flexShrink={0}
        >
          <VStack spacing={2} w="full">
            <Input
              className="customer-chat-input"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              size="md"
              w="full"
              borderRadius="full"
              bg="white"
              color="#0B1020"
              border="1px solid"
              borderColor="gray.300"
              fontWeight="500"
              fontSize="14px"
              h="44px"
              position="relative"
              zIndex={10}
              pointerEvents="auto"
              _placeholder={{ color: 'gray.400' }}
              _hover={{
                borderColor: 'gray.400',
                bg: 'white',
                color: '#0B1020',
              }}
              _focus={{
                bg: 'white',
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px #2563EB',
                color: '#0B1020',
              }}
              _active={{
                bg: 'white',
                color: '#0B1020',
              }}
              _disabled={{
                opacity: 1,
                color: '#0B1020',
                bg: 'white',
                cursor: 'text',
              }}
              sx={{
                background: 'white',
                backgroundColor: 'white',
                color: '#0B1020',
                fontWeight: '500',
                fontSize: '14px',
                WebkitTextFillColor: '#0B1020',
                WebkitTextStrokeColor: '#0B1020',
                WebkitTextStrokeWidth: '0px',
                opacity: '1',
                position: 'relative',
                zIndex: 10,
                pointerEvents: 'auto',
                borderColor: 'gray.300',
                '& fieldset': {
                  borderColor: 'gray.300',
                },
                '&:disabled': {
                  color: '#0B1020',
                  WebkitTextFillColor: '#0B1020',
                  WebkitTextStrokeColor: '#0B1020',
                  WebkitTextStrokeWidth: '0px',
                  opacity: '1',
                  bg: 'white',
                  backgroundColor: 'white',
                  cursor: 'text',
                },
                '&::before, &::after': {
                  display: 'none',
                  content: '""',
                },
                '&::placeholder': {
                  color: 'gray.400',
                  opacity: '1',
                  WebkitTextFillColor: 'gray.400',
                },
                '&::selection': {
                  backgroundColor: '#2563EB',
                  color: 'white',
                },
                '&::-moz-selection': {
                  backgroundColor: '#2563EB',
                  color: 'white',
                },
                '& input': {
                  color: '#0B1020',
                  WebkitTextFillColor: '#0B1020',
                  WebkitTextStrokeColor: '#0B1020',
                  WebkitTextStrokeWidth: '0px',
                },
                '& input::placeholder': {
                  color: 'gray.400',
                  WebkitTextFillColor: 'gray.400',
                },
                '&:focus, &:hover, &:active, &:focus-visible, &:focus-within': {
                  color: '#0B1020',
                  WebkitTextFillColor: '#0B1020',
                  WebkitTextStrokeColor: '#0B1020',
                  WebkitTextStrokeWidth: '0px',
                  opacity: '1',
                  bg: 'white',
                  backgroundColor: 'white',
                }
              }}
            />
            <IconButton
              icon={isSending ? <Spinner size="sm" /> : <FiSend />}
              aria-label="Send message"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending || !chatSessionId}
              size="md"
              h="44px"
              w="44px"
              minW="44px"
              borderRadius="full"
              bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
              color="white"
              position="relative"
              zIndex={5}
              flexShrink={0}
              _hover={{
                bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                transform: 'scale(1.05)',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
              _disabled={{
                opacity: 0.5,
                bg: '#6b7280',
              }}
            />
          </VStack>
          <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
            Support hours: Mon-Fri 8AM-8PM, Sat-Sun 9AM-6PM
          </Text>
        </Box>
        )}
      </MotionBox>
    </AnimatePresence>
  );
}
