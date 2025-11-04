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
  // Dark theme with black background and white text
  const bgColor = '#000000'; // Pure black background
  const borderColor = '#333333'; // Dark gray border
  const textColor = '#FFFFFF'; // White text
  const inputBg = '#1a1a1a'; // Very dark gray for input
  const messageBgUser = '#2563eb'; // Bright blue for user messages
  const messageBgAssistant = '#1a1a1a'; // Dark gray for assistant messages
  const messagesBg = '#0a0a0a'; // Almost black for messages area
  const headerBg = '#111111'; // Slightly lighter black for header
  
  // Non-hook values derived from hooks
  const messageBgUserText = '#FFFFFF'; // White text on user messages
  const messageBgAssistantText = '#FFFFFF'; // White text on assistant messages

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
        bg="#2563eb"
        color="#FFFFFF"
        borderRadius="full"
        boxShadow="0 4px 20px rgba(37, 99, 235, 0.5), 0 0 40px rgba(37, 99, 235, 0.3)"
        zIndex={1000}
        _hover={{
          bg: '#1d4ed8',
          transform: 'scale(1.05)',
          boxShadow: '0 6px 25px rgba(37, 99, 235, 0.6), 0 0 50px rgba(37, 99, 235, 0.4)',
        }}
        transition="all 0.3s ease"
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
        boxShadow="0 8px 32px rgba(0, 0, 0, 0.8), 0 0 20px rgba(37, 99, 235, 0.3)"
        zIndex={1000}
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="lg"
        transition="all 0.3s ease"
        _hover={{
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.9), 0 0 30px rgba(37, 99, 235, 0.4)',
        }}
      >
        <CardBody p={3}>
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Avatar 
                size="sm" 
                bg="#2563eb" 
                icon={<FiZap />}
                boxShadow="0 0 15px rgba(37, 99, 235, 0.5)"
              />
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="bold" color={textColor}>
                  Speedy AI
                </Text>
                <Text fontSize="xs" color="#9ca3af">
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
                color={textColor}
                _hover={{ bg: '#1a1a1a', color: '#2563eb' }}
                onClick={handleToggle}
              />
              <IconButton
                aria-label="Close"
                icon={<FiX />}
                size="sm"
                variant="ghost"
                color={textColor}
                _hover={{ bg: '#1a1a1a', color: '#ef4444' }}
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
      boxShadow="0 12px 48px rgba(0, 0, 0, 0.9), 0 0 40px rgba(37, 99, 235, 0.3)"
      zIndex={1000}
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="xl"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      transition="all 0.3s ease"
    >
      {/* Header */}
      <CardBody 
        p={0} 
        borderBottom="1px solid" 
        borderColor={borderColor}
        bg={headerBg}
      >
        <Flex justify="space-between" align="center" p={4}>
          <HStack spacing={3}>
            <Avatar 
              size="sm" 
              bg="#2563eb" 
              icon={<FiZap />}
              boxShadow="0 0 20px rgba(37, 99, 235, 0.6)"
            />
            <VStack align="start" spacing={0}>
              <Text fontSize="md" fontWeight="bold" color={textColor}>
                Speedy AI
              </Text>
              <Badge 
                bg="#10b981" 
                color="#FFFFFF"
                fontSize="xs"
                px={2}
                py={0.5}
                borderRadius="full"
                boxShadow="0 0 10px rgba(16, 185, 129, 0.5)"
              >
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
              color={textColor}
              borderColor={borderColor}
              _focus={{
                borderColor: '#2563eb',
                boxShadow: '0 0 0 1px #2563eb',
              }}
            >
              <option value="en" style={{ background: '#000000', color: '#FFFFFF' }}>EN</option>
              <option value="ar" style={{ background: '#000000', color: '#FFFFFF' }}>AR</option>
            </Select>
            <IconButton
              aria-label="Minimize"
              icon={<FiMinimize2 />}
              size="sm"
              variant="ghost"
              color={textColor}
              _hover={{ bg: '#1a1a1a', color: '#2563eb' }}
              onClick={handleToggle}
            />
            <IconButton
              aria-label="Close"
              icon={<FiX />}
              size="sm"
              variant="ghost"
              color={textColor}
              _hover={{ bg: '#1a1a1a', color: '#ef4444' }}
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
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#0a0a0a',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#333333',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#444444',
          },
        }}
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
                <Avatar 
                  size="sm" 
                  bg="#2563eb" 
                  icon={<FiZap />}
                  boxShadow="0 0 15px rgba(37, 99, 235, 0.5)"
                />
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
                  boxShadow={
                    message.role === 'user'
                      ? '0 4px 12px rgba(37, 99, 235, 0.3)'
                      : '0 4px 12px rgba(0, 0, 0, 0.5)'
                  }
                  border={
                    message.role === 'assistant'
                      ? '1px solid #333333'
                      : 'none'
                  }
                  transition="all 0.2s ease"
                  _hover={{
                    transform: 'translateY(-1px)',
                    boxShadow: message.role === 'user'
                      ? '0 6px 16px rgba(37, 99, 235, 0.4)'
                      : '0 6px 16px rgba(0, 0, 0, 0.6)',
                  }}
                >
                <Text fontSize="sm" whiteSpace="pre-wrap" lineHeight="1.6">
                  {message.content}
                </Text>
                <Text
                  fontSize="xs"
                  mt={1}
                  opacity={0.6}
                  textAlign={message.role === 'user' ? 'right' : 'left'}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </Box>
              {message.role === 'user' && (
                <Avatar 
                  size="sm" 
                  bg="#4b5563" 
                  icon={<FiUser />}
                  boxShadow="0 0 10px rgba(75, 85, 99, 0.5)"
                />
              )}
            </HStack>
          ))}
          {isLoading && (
            <HStack align="flex-start" spacing={3}>
              <Avatar 
                size="sm" 
                bg="#2563eb" 
                icon={<FiZap />}
                boxShadow="0 0 15px rgba(37, 99, 235, 0.5)"
              />
              <Box
                p={3}
                borderRadius="lg"
                bg={messageBgAssistant}
                border="1px solid #333333"
                boxShadow="0 4px 12px rgba(0, 0, 0, 0.5)"
              >
                <Spinner size="sm" color="#2563eb" />
              </Box>
            </HStack>
          )}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>

      {/* Input */}
      <CardBody 
        p={0} 
        borderTop="1px solid" 
        borderColor={borderColor}
        bg={headerBg}
      >
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
              color={textColor}
              borderColor={borderColor}
              _placeholder={{
                color: '#6b7280',
              }}
              _focus={{
                borderColor: '#2563eb',
                boxShadow: '0 0 0 1px #2563eb, 0 0 10px rgba(37, 99, 235, 0.3)',
              }}
              transition="all 0.2s ease"
            />
            <VStack spacing={1}>
              <IconButton
                aria-label="Send"
                icon={<FiSend />}
                bg="#2563eb"
                color="#FFFFFF"
                size="sm"
                onClick={handleSendMessage}
                isLoading={isLoading}
                isDisabled={!inputMessage.trim() || isLoading}
                _hover={{
                  bg: '#1d4ed8',
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 15px rgba(37, 99, 235, 0.5)',
                }}
                _disabled={{
                  bg: '#1a1a1a',
                  color: '#6b7280',
                  cursor: 'not-allowed',
                  opacity: 0.5,
                }}
                transition="all 0.2s ease"
                boxShadow="0 0 10px rgba(37, 99, 235, 0.3)"
              />
              {messages.length > 1 && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleClearChat}
                  fontSize="xs"
                  color={textColor}
                  _hover={{
                    bg: '#1a1a1a',
                    color: '#ef4444',
                  }}
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

