'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Avatar,
  Spinner,
  useToast,
  Textarea,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import {
  FiSend,
  FiX,
  FiMessageCircle,
  FiUser,
  FiCopy,
  FiRotateCw,
  FiEdit3,
  FiTrash2,
  FiPlusCircle,
  FiMenu,
} from 'react-icons/fi';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SpeedyAIChatbotEnhancedProps {
  isOpen?: boolean;
  onClose?: () => void;
  adminName?: string;
}

export default function SpeedyAIChatbotEnhanced({
  isOpen: initialIsOpen = false,
  onClose,
  adminName = 'Admin',
}: SpeedyAIChatbotEnhancedProps) {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello ${adminName}! I'm Speedy AI, your intelligent assistant. How can I help you today?`,
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, adminName, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.map(m => ({ role: m.role, content: m.content })),
          language: 'en',
        }),
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'No response',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get response from AI',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      status: 'success',
      duration: 2000,
    });
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `Hello ${adminName}! I'm Speedy AI, your intelligent assistant. How can I help you today?`,
      timestamp: new Date(),
    }]);
  };

  if (!isOpen) {
    return (
      <IconButton
        icon={<FiMessageCircle size={24} />}
        aria-label="Open AI Assistant"
        onClick={() => setIsOpen(true)}
        position="fixed"
        bottom={6}
        right={6}
        size="lg"
        colorScheme="blue"
        borderRadius="full"
        boxShadow="0 8px 32px rgba(37, 99, 235, 0.4)"
        _hover={{
          transform: 'scale(1.1)',
          boxShadow: '0 12px 48px rgba(37, 99, 235, 0.6)',
        }}
        transition="all 0.3s"
        zIndex={999}
      />
    );
  }

  return (
    <Box
      position="fixed"
      bottom={0}
      right={0}
      w={{ base: 'full', md: '400px', lg: '500px' }}
      h={{ base: 'full', md: '600px' }}
      bg="#2f2f2f"
      borderRadius={{ base: '0', md: '16px 16px 0 0' }}
      boxShadow="0 0 40px rgba(0,0,0,0.4)"
      zIndex={1000}
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Header - ChatGPT style */}
      <HStack
        px={4}
        py={3}
        bg="#171717"
        borderBottom="1px solid #3d3d3d"
        justify="space-between"
      >
        <HStack spacing={3}>
          <Avatar 
            size="sm" 
            name="Speedy AI"
            bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
            color="white"
          />
          <VStack align="start" spacing={0}>
            <Text fontSize="sm" fontWeight="600" color="white">
              Speedy AI
            </Text>
            <Text fontSize="xs" color="gray.400">
              Always here to help
            </Text>
          </VStack>
        </HStack>
        
        <HStack spacing={1}>
          <Tooltip label="New chat">
            <IconButton
              icon={<FiPlusCircle />}
              aria-label="New chat"
              size="sm"
              variant="ghost"
              color="gray.400"
              _hover={{ color: 'white', bg: 'rgba(255,255,255,0.1)' }}
              onClick={clearChat}
            />
          </Tooltip>
          <Tooltip label="Menu">
            <Menu>
              <MenuButton
                as={IconButton}
                icon={<FiMenu />}
                aria-label="Menu"
                size="sm"
                variant="ghost"
                color="gray.400"
                _hover={{ color: 'white', bg: 'rgba(255,255,255,0.1)' }}
              />
              <MenuList bg="#2f2f2f" borderColor="#3d3d3d">
                <MenuItem 
                  icon={<FiTrash2 />} 
                  onClick={clearChat}
                  bg="transparent"
                  color="white"
                  _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                >
                  Clear conversation
                </MenuItem>
              </MenuList>
            </Menu>
          </Tooltip>
          <Tooltip label="Close">
            <IconButton
              icon={<FiX />}
              aria-label="Close"
              size="sm"
              variant="ghost"
              color="gray.400"
              _hover={{ color: 'white', bg: 'rgba(255,255,255,0.1)' }}
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
            />
          </Tooltip>
        </HStack>
      </HStack>

      {/* Messages Area - ChatGPT style */}
      <VStack
        flex={1}
        overflowY="auto"
        spacing={0}
        bg="#212121"
        css={{
          '&::-webkit-scrollbar': { width: '8px' },
          '&::-webkit-scrollbar-track': { background: '#171717' },
          '&::-webkit-scrollbar-thumb': {
            background: '#3d3d3d',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': { background: '#4d4d4d' },
        }}
      >
        {messages.map((message, index) => (
          <Box
            key={message.id}
            w="full"
            bg={message.role === 'assistant' ? '#2f2f2f' : 'transparent'}
            borderBottom="1px solid #3d3d3d"
            py={6}
            px={4}
          >
            <HStack align="start" maxW="800px" mx="auto" spacing={4}>
              {/* Avatar */}
              <Avatar
                size="sm"
                name={message.role === 'user' ? adminName : 'Speedy AI'}
                bg={message.role === 'user' ? '#2563eb' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}
                color="white"
                flexShrink={0}
              />

              {/* Message Content */}
              <VStack align="start" flex={1} spacing={2}>
                <Text
                  fontSize="sm"
                  color="white"
                  lineHeight="1.7"
                  whiteSpace="pre-wrap"
                  wordBreak="break-word"
                >
                  {message.content}
                </Text>

                {/* Message Actions */}
                {message.role === 'assistant' && index > 0 && (
                  <HStack spacing={2} mt={2}>
                    <Tooltip label="Copy">
                      <IconButton
                        icon={<FiCopy />}
                        aria-label="Copy message"
                        size="xs"
                        variant="ghost"
                        color="gray.500"
                        _hover={{ color: 'white', bg: 'rgba(255,255,255,0.1)' }}
                        onClick={() => copyMessage(message.content)}
                      />
                    </Tooltip>
                    <Tooltip label="Regenerate">
                      <IconButton
                        icon={<FiRotateCw />}
                        aria-label="Regenerate"
                        size="xs"
                        variant="ghost"
                        color="gray.500"
                        _hover={{ color: 'white', bg: 'rgba(255,255,255,0.1)' }}
                      />
                    </Tooltip>
                  </HStack>
                )}
              </VStack>
            </HStack>
          </Box>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <Box w="full" bg="#2f2f2f" borderBottom="1px solid #3d3d3d" py={6} px={4}>
            <HStack align="start" maxW="800px" mx="auto" spacing={4}>
              <Avatar
                size="sm"
                name="Speedy AI"
                bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                color="white"
              />
              <HStack spacing={2} color="gray.400">
                <Spinner size="sm" />
                <Text fontSize="sm">Thinking...</Text>
              </HStack>
            </HStack>
          </Box>
        )}

        <div ref={messagesEndRef} />
      </VStack>

      {/* Input Area - ChatGPT style */}
      <Box
        bg="#2f2f2f"
        borderTop="1px solid #3d3d3d"
        p={4}
      >
        <HStack
          spacing={2}
          bg="#40414f"
          borderRadius="12px"
          border="1px solid #565869"
          p={2}
          _focusWithin={{
            borderColor: '#10b981',
            boxShadow: '0 0 0 1px #10b981',
          }}
          transition="all 0.2s"
        >
          <Textarea
            ref={textareaRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Speedy AI..."
            resize="none"
            border="none"
            color="white"
            fontSize="sm"
            rows={1}
            maxH="200px"
            minH="24px"
            bg="transparent"
            _placeholder={{ color: 'gray.500' }}
            _focus={{ boxShadow: 'none' }}
            css={{
              '&::-webkit-scrollbar': { width: '6px' },
              '&::-webkit-scrollbar-track': { background: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                background: '#565869',
                borderRadius: '3px',
              },
            }}
          />
          <IconButton
            icon={<FiSend />}
            aria-label="Send message"
            size="sm"
            onClick={handleSendMessage}
            isDisabled={!inputMessage.trim() || isLoading}
            bg={inputMessage.trim() && !isLoading ? '#10b981' : 'transparent'}
            color={inputMessage.trim() && !isLoading ? 'white' : 'gray.500'}
            _hover={{
              bg: inputMessage.trim() && !isLoading ? '#059669' : 'rgba(255,255,255,0.1)',
            }}
            borderRadius="8px"
            transition="all 0.2s"
          />
        </HStack>
        
        <Text fontSize="xs" color="gray.600" mt={2} textAlign="center">
          Speedy AI can make mistakes. Verify important information.
        </Text>
      </Box>
    </Box>
  );
}

