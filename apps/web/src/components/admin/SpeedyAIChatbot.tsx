'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  IconButton,
  Card,
  CardBody,
  Badge,
  Avatar,
  Spinner,
  useToast,
  Select,
  Flex,
  Divider,
  Textarea,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  FiSend,
  FiMinimize2,
  FiMaximize2,
  FiX,
  FiMessageCircle,
  FiZap,
  FiUser,
  FiGlobe,
} from 'react-icons/fi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: 'en' | 'ar';
}

interface SpeedyAIChatbotProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialLanguage?: 'en' | 'ar';
  adminName?: string;
  adminEmail?: string;
}

export default function SpeedyAIChatbot({
  isOpen: initialIsOpen = false,
  onClose,
  initialLanguage = 'en',
  adminName = 'Admin',
  adminEmail = '',
}: SpeedyAIChatbotProps) {
  // All state hooks - must be called unconditionally
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ar'>(initialLanguage);
  
  // All refs - must be called unconditionally
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // All Chakra hooks - must be called unconditionally and in the same order
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const inputBg = useColorModeValue('gray.50', 'gray.700');
  const messageBgUser = useColorModeValue('blue.500', 'blue.600');
  const messageBgAssistant = useColorModeValue('white', 'gray.700');
  const messagesBg = useColorModeValue('gray.50', 'gray.900');
  
  // Non-hook values derived from hooks
  const messageBgUserText = 'white';
  const messageBgAssistantText = textColor;

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isMinimized]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = language === 'ar'
        ? `مرحباً ${adminName}! أنا Speedy AI، مساعدك الذكي في إدارة Speedy Van. كيف يمكنني مساعدتك اليوم؟`
        : `Hello ${adminName}! I'm Speedy AI, your intelligent assistant for managing Speedy Van. How can I help you today?`;

      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: welcomeMessage,
          timestamp: new Date(),
          language,
        },
      ]);
    }
  }, [isOpen, language, adminName]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      language,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          conversationHistory: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const result = await response.json();

      if (result.success) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date(),
          language: result.language || language,
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Update language if changed
        if (result.language && result.language !== language) {
          setLanguage(result.language);
        }
      } else {
        throw new Error(result.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage = language === 'ar'
        ? 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.'
        : 'Sorry, an error occurred. Please try again.';

      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: errorMessage,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });

      const errorMsg = getErrorMessage(error);
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fix error message variable
  const getErrorMessage = (error: any) => {
    const errorMsg = language === 'ar'
      ? 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.'
      : 'Sorry, an error occurred. Please try again.';

    return {
      id: (Date.now() + 1).toString(),
      role: 'assistant' as const,
      content: errorMsg,
      timestamp: new Date(),
      language,
    };
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggle = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsMinimized(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setInputMessage('');
  };

  // Render content based on state - no early returns to ensure hooks are always called in same order
  if (!isOpen) {
    return (
      <IconButton
        aria-label="Open Speedy AI"
        icon={<FiMessageCircle />}
        onClick={() => setIsOpen(true)}
        position="fixed"
        bottom="20px"
        right="20px"
        size="lg"
        colorScheme="blue"
        borderRadius="full"
        boxShadow="lg"
        zIndex={1000}
      />
    );
  }

  if (isMinimized) {
    return (
      <Card
        position="fixed"
        bottom="20px"
        right="20px"
        width="300px"
        boxShadow="xl"
        zIndex={1000}
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
      >
        <CardBody p={3}>
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Avatar size="sm" bg="blue.500" icon={<FiZap />} />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="bold" color={textColor}>
                  Speedy AI
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {language === 'ar' ? 'جاهز للمساعدة' : 'Ready to help'}
                </Text>
              </VStack>
            </HStack>
            <HStack spacing={1}>
              <IconButton
                aria-label="Maximize"
                icon={<FiMaximize2 />}
                size="sm"
                variant="ghost"
                onClick={handleToggle}
              />
              <IconButton
                aria-label="Close"
                icon={<FiX />}
                size="sm"
                variant="ghost"
                onClick={handleClose}
              />
            </HStack>
          </HStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      position="fixed"
      bottom="20px"
      right="20px"
      width="400px"
      height="600px"
      boxShadow="2xl"
      zIndex={1000}
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <CardBody p={0} borderBottom="1px solid" borderColor={borderColor}>
        <Flex justify="space-between" align="center" p={4}>
          <HStack spacing={3}>
            <Avatar size="sm" bg="blue.500" icon={<FiZap />} />
            <VStack align="start" spacing={0}>
              <Text fontSize="md" fontWeight="bold" color={textColor}>
                Speedy AI
              </Text>
              <Badge colorScheme="green" fontSize="xs">
                {language === 'ar' ? 'متصل' : 'Online'}
              </Badge>
            </VStack>
          </HStack>
          <HStack spacing={1}>
            <Select
              size="sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'ar')}
              width="80px"
              bg={inputBg}
            >
              <option value="en">EN</option>
              <option value="ar">AR</option>
            </Select>
            <IconButton
              aria-label="Minimize"
              icon={<FiMinimize2 />}
              size="sm"
              variant="ghost"
              onClick={handleToggle}
            />
            <IconButton
              aria-label="Close"
              icon={<FiX />}
              size="sm"
              variant="ghost"
              onClick={handleClose}
            />
          </HStack>
        </Flex>
      </CardBody>

      {/* Messages */}
      <Box
        flex={1}
        overflowY="auto"
        p={4}
        bg={messagesBg}
      >
        <VStack spacing={4} align="stretch">
          {messages.map((message) => (
            <HStack
              key={message.id}
              align="flex-start"
              spacing={3}
              justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
            >
              {message.role === 'assistant' && (
                <Avatar size="sm" bg="blue.500" icon={<FiZap />} />
              )}
                <Box
                  maxWidth="70%"
                  p={3}
                  borderRadius="lg"
                  bg={
                    message.role === 'user'
                      ? messageBgUser
                      : messageBgAssistant
                  }
                  color={
                    message.role === 'user'
                      ? messageBgUserText
                      : messageBgAssistantText
                  }
                  boxShadow="sm"
                >
                <Text fontSize="sm" whiteSpace="pre-wrap">
                  {message.content}
                </Text>
                <Text
                  fontSize="xs"
                  mt={1}
                  opacity={0.7}
                  textAlign={message.role === 'user' ? 'right' : 'left'}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </Box>
              {message.role === 'user' && (
                <Avatar size="sm" bg="gray.500" icon={<FiUser />} />
              )}
            </HStack>
          ))}
          {isLoading && (
            <HStack align="flex-start" spacing={3}>
              <Avatar size="sm" bg="blue.500" icon={<FiZap />} />
              <Box
                p={3}
                borderRadius="lg"
                bg={messageBgAssistant}
                boxShadow="sm"
              >
                <Spinner size="sm" />
              </Box>
            </HStack>
          )}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {/* Input */}
      <CardBody p={0} borderTop="1px solid" borderColor={borderColor}>
        <VStack spacing={0}>
          <HStack p={3} spacing={2}>
            <Textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
              size="sm"
              resize="none"
              rows={2}
              bg={inputBg}
              borderColor={borderColor}
              _focus={{
                borderColor: 'blue.500',
                boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
              }}
            />
            <VStack spacing={1}>
              <IconButton
                aria-label="Send"
                icon={<FiSend />}
                colorScheme="blue"
                size="sm"
                onClick={handleSendMessage}
                isLoading={isLoading}
                isDisabled={!inputMessage.trim() || isLoading}
              />
              {messages.length > 1 && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleClearChat}
                  fontSize="xs"
                >
                  {language === 'ar' ? 'مسح' : 'Clear'}
                </Button>
              )}
            </VStack>
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
}

