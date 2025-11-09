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
  FiCopy,
  FiThumbsUp,
  FiThumbsDown,
  FiDownload,
  FiSearch,
  FiBookOpen,
  FiCheck,
} from 'react-icons/fi';

// Global styles for animations - only add once
if (typeof document !== 'undefined' && !document.getElementById('speedy-ai-animations')) {
  const style = document.createElement('style');
  style.id = 'speedy-ai-animations';
  style.textContent = `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.05);
      }
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  language?: 'en' | 'ar';
  feedback?: 'up' | 'down' | null;
  copied?: boolean;
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
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showExamples, setShowExamples] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  
  // All refs - must be called unconditionally
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // All Chakra hooks - must be called unconditionally and in the same order
  const toast = useToast();
  
  // ✅ Quick action prompts for admins
  const quickActions = language === 'ar' ? [
    { label: '📊 نظرة عامة', prompt: 'أعطني نظرة عامة على الوضع الحالي للنظام' },
    { label: '🚗 السائقون المتاحون', prompt: 'من هم السائقون المتاحون الآن؟' },
    { label: '📦 طلبات غير معيّنة', prompt: 'أي طلبات لم يتم تعيينها بعد؟' },
    { label: '💰 إيرادات اليوم', prompt: 'كم إيرادات اليوم؟' },
    { label: '🎯 اقتراحات', prompt: 'ما هي التحسينات التي تنصحني بها؟' },
  ] : [
    { label: '📊 System Overview', prompt: 'Give me a current system overview' },
    { label: '🚗 Available Drivers', prompt: 'Who are the available drivers right now?' },
    { label: '📦 Unassigned Orders', prompt: 'Which orders are still unassigned?' },
    { label: '💰 Today\'s Revenue', prompt: 'What\'s today\'s revenue?' },
    { label: '🎯 Suggestions', prompt: 'What improvements do you recommend?' },
  ];
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
    const messageToSend = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // ✅ Feature 5: Streaming Response (placeholder for future enhancement)
    // Create temporary assistant message that will be updated with streamed content
    const streamingMessageId = (Date.now() + 1).toString();
    const streamingMessage: Message = {
      id: streamingMessageId,
      role: 'assistant',
      content: '', // Will be filled gradually
      timestamp: new Date(),
      language,
    };
    
    setMessages((prev) => [...prev, streamingMessage]);

    try {
      const response = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
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
        // ✅ Simulate streaming effect (can be enhanced with real SSE in future)
        const fullResponse = result.response;
        const words = fullResponse.split(' ');
        let currentContent = '';
        
        // Update message word by word for streaming effect
        for (let i = 0; i < words.length; i++) {
          currentContent += (i > 0 ? ' ' : '') + words[i];
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === streamingMessageId 
                ? { ...msg, content: currentContent, language: result.language || language }
                : msg
            )
          );
          
          // Small delay between words for visual effect
          if (i < words.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 30));
          }
        }

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

      // Update streaming message with error
      const errorMsg = getErrorMessage(error);
      setMessages((prev) => 
        prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, content: errorMsg.content }
            : msg
        )
      );
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

  // ✅ NEW: Handle quick action click
  const handleQuickAction = (prompt: string) => {
    setInputMessage(prompt);
    setShowSuggestions(false);
    // Auto-send after a short delay
    setTimeout(() => {
      if (inputRef.current) {
        handleSendMessage();
      }
    }, 300);
  };

  // ✅ Feature 1: Copy message to clipboard
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, copied: true } : msg
      ));
      toast({
        title: language === 'ar' ? 'تم النسخ' : 'Copied',
        description: language === 'ar' ? 'تم نسخ الرسالة' : 'Message copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, copied: false } : msg
        ));
      }, 2000);
    } catch (error) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل النسخ' : 'Failed to copy',
        status: 'error',
        duration: 2000,
      });
    }
  };

  // ✅ Feature 2: Submit feedback
  const handleFeedback = async (messageId: string, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, feedback } : msg
    ));
    
    // Log feedback to API
    try {
      await fetch('/api/admin/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          feedback,
          adminEmail,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (error) {
      console.warn('Failed to log feedback:', error);
    }
    
    toast({
      title: feedback === 'up' 
        ? (language === 'ar' ? 'شكراً!' : 'Thanks!')
        : (language === 'ar' ? 'سنحسّن' : 'We\'ll improve'),
      status: 'info',
      duration: 2000,
    });
  };

  // ✅ Feature 3: Export conversation
  const handleExportConversation = () => {
    const conversationText = messages
      .map(msg => `[${msg.timestamp.toLocaleString()}] ${msg.role === 'user' ? adminName : 'Speedy AI'}:\n${msg.content}\n`)
      .join('\n---\n\n');
    
    const blob = new Blob([conversationText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `speedy-ai-chat-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: language === 'ar' ? 'تم التصدير' : 'Exported',
      description: language === 'ar' ? 'تم حفظ المحادثة' : 'Conversation saved',
      status: 'success',
      duration: 2000,
    });
  };

  // ✅ Feature 8: Filter messages by search
  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // ✅ Feature 6: Check for urgent notifications (fetch every 30s)
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const response = await fetch('/api/admin/ai/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotificationCount(data.count || 0);
        }
      } catch (error) {
        console.warn('Failed to fetch notifications:', error);
      }
    };
    
    checkNotifications();
    const interval = setInterval(checkNotifications, 30000); // Every 30s
    
    return () => clearInterval(interval);
  }, []);

  // Render content based on state - no early returns to ensure hooks are always called in same order
  if (!isOpen) {
    return (
      <Box position="fixed" bottom="20px" right="20px" zIndex={1000}>
        <IconButton
          aria-label="Open Speedy AI"
          icon={<FiMessageCircle style={{ color: '#FFFFFF' }} />}
          onClick={() => setIsOpen(true)}
          size="lg"
          bg="linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
          color="#FFFFFF"
          borderRadius="full"
          boxShadow="0 8px 25px rgba(37, 99, 235, 0.6), 0 0 50px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
          border="2px solid"
          borderColor="rgba(37, 99, 235, 0.3)"
          _hover={{
            bg: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
            transform: 'scale(1.1) rotate(5deg)',
            boxShadow: '0 12px 35px rgba(37, 99, 235, 0.8), 0 0 60px rgba(37, 99, 235, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
          _active={{
            transform: 'scale(0.95)',
          }}
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          animation="pulse 3s infinite"
        />
        {/* ✅ Feature 6: Notification Badge */}
        {notificationCount > 0 && (
          <Badge
            position="absolute"
            top="-4px"
            right="-4px"
            bg="linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
            color="white"
            borderRadius="full"
            fontSize="xs"
            fontWeight="bold"
            px={2}
            py={0.5}
            boxShadow="0 0 15px rgba(239, 68, 68, 0.8), 0 2px 8px rgba(239, 68, 68, 0.4)"
            animation="pulse 2s infinite"
            border="2px solid #000000"
          >
            {notificationCount > 9 ? '9+' : notificationCount}
          </Badge>
        )}
      </Box>
    );
  }

  if (isMinimized) {
    return (
      <Card
        variant="unstyled"
        position="fixed"
        bottom="20px"
        right="20px"
        width="320px"
        boxShadow="0 12px 40px rgba(0, 0, 0, 0.9), 0 0 30px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
        zIndex={1000}
        bg={bgColor}
        border="1px solid"
        borderColor={borderColor}
        borderRadius="xl"
        transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
        sx={{ 
          bg: `${bgColor} !important`,
          backgroundColor: `${bgColor} !important`,
          background: `${bgColor} !important`,
          borderColor: `${borderColor} !important`,
          '&': {
            backgroundColor: '#000000 !important',
            background: '#000000 !important',
          },
        }}
        __css={{
          backgroundColor: '#000000 !important',
          background: '#000000 !important',
        }}
        style={{
          backgroundColor: '#000000',
          background: '#000000',
        }}
        _hover={{
          boxShadow: '0 16px 50px rgba(0, 0, 0, 0.95), 0 0 40px rgba(37, 99, 235, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
          transform: 'translateY(-2px)',
        }}
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(37, 99, 235, 0.5) 50%, transparent 100%)',
        }}
      >
        <CardBody 
          p={4} 
          bg={bgColor} 
          sx={{ 
            bg: `${bgColor} !important`,
            backgroundColor: `${bgColor} !important`,
            '&': {
              backgroundColor: '#000000 !important',
              background: '#000000 !important',
            },
          }}
          __css={{
            backgroundColor: '#000000 !important',
            background: '#000000 !important',
          }}
          css={{
            backgroundColor: '#000000 !important',
            background: '#000000 !important',
          }}
          style={{
            backgroundColor: '#000000',
            background: '#000000',
          }}
        >
          <HStack justify="space-between">
            <HStack spacing={3}>
              <Avatar 
                size="md" 
                bg="linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                icon={<FiZap />}
                boxShadow="0 0 20px rgba(37, 99, 235, 0.6), 0 4px 12px rgba(37, 99, 235, 0.3)"
                border="2px solid"
                borderColor="rgba(37, 99, 235, 0.3)"
                transition="all 0.3s ease"
                _hover={{
                  transform: 'scale(1.1) rotate(5deg)',
                  boxShadow: '0 0 30px rgba(37, 99, 235, 0.8), 0 6px 15px rgba(37, 99, 235, 0.4)',
                }}
              />
              <VStack align="start" spacing={1}>
                <HStack spacing={2}>
                  <Text fontSize="md" fontWeight="bold" color={textColor} letterSpacing="0.5px">
                    Speedy AI
                  </Text>
                  <Badge 
                    bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                    color="#FFFFFF"
                    fontSize="xs"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    boxShadow="0 0 10px rgba(16, 185, 129, 0.5)"
                    fontWeight="semibold"
                  >
                    {language === 'ar' ? 'متصل' : 'Online'}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="#9ca3af" fontWeight="medium">
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
                borderRadius="md"
                _hover={{ bg: '#1a1a1a', color: '#2563eb', transform: 'scale(1.1)' }}
                onClick={handleToggle}
                transition="all 0.2s ease"
              />
              <IconButton
                aria-label="Close"
                icon={<FiX />}
                size="sm"
                variant="ghost"
                color={textColor}
                borderRadius="md"
                _hover={{ bg: '#1a1a1a', color: '#ef4444', transform: 'scale(1.1)' }}
                onClick={handleClose}
                transition="all 0.2s ease"
              />
            </HStack>
          </HStack>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card
      variant="unstyled"
      position="fixed"
      bottom="20px"
      right="20px"
      width="420px"
      height="650px"
      boxShadow="0 20px 60px rgba(0, 0, 0, 0.95), 0 0 50px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
      zIndex={1000}
      bg={bgColor}
      border="1px solid"
      borderColor={borderColor}
      borderRadius="2xl"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      sx={{ 
        bg: `${bgColor} !important`,
        backgroundColor: `${bgColor} !important`,
        background: `${bgColor} !important`,
        borderColor: `${borderColor} !important`,
        '&': {
          backgroundColor: '#000000 !important',
          background: '#000000 !important',
        },
      }}
      __css={{
        backgroundColor: '#000000 !important',
        background: '#000000 !important',
      }}
      style={{
        backgroundColor: '#000000',
        background: '#000000',
      }}
      _hover={{
        boxShadow: '0 25px 70px rgba(0, 0, 0, 0.98), 0 0 60px rgba(37, 99, 235, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Header */}
      <CardBody 
        p={0} 
        borderBottom="1px solid" 
        borderColor={borderColor}
        bg={headerBg}
        sx={{ 
          bg: `${headerBg} !important`, 
          backgroundColor: `${headerBg} !important`,
          borderColor: `${borderColor} !important`,
          background: `linear-gradient(135deg, ${headerBg} 0%, #0a0a0a 100%) !important`,
          backgroundImage: `linear-gradient(135deg, ${headerBg} 0%, #0a0a0a 100%) !important`,
          '&': {
            backgroundColor: '#111111 !important',
            background: 'linear-gradient(135deg, #111111 0%, #0a0a0a 100%) !important',
          },
        }}
        __css={{
          backgroundColor: '#111111 !important',
          background: 'linear-gradient(135deg, #111111 0%, #0a0a0a 100%) !important',
        }}
        css={{
          backgroundColor: '#111111 !important',
          background: 'linear-gradient(135deg, #111111 0%, #0a0a0a 100%) !important',
        }}
        style={{
          backgroundColor: '#111111',
          background: 'linear-gradient(135deg, #111111 0%, #0a0a0a 100%)',
        }}
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(37, 99, 235, 0.5) 50%, transparent 100%)',
        }}
      >
        <Flex justify="space-between" align="center" p={4} style={{ backgroundColor: '#111111' }}>
          <HStack spacing={3}>
            <Avatar 
              size="md" 
              bg="linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
              icon={<FiZap />}
              boxShadow="0 0 25px rgba(37, 99, 235, 0.7), 0 4px 15px rgba(37, 99, 235, 0.4)"
              border="2px solid"
              borderColor="rgba(37, 99, 235, 0.3)"
              transition="all 0.3s ease"
              _hover={{
                transform: 'scale(1.1) rotate(5deg)',
                boxShadow: '0 0 35px rgba(37, 99, 235, 0.9), 0 6px 20px rgba(37, 99, 235, 0.5)',
              }}
            />
            <VStack align="start" spacing={1}>
              <HStack spacing={2}>
                <Text fontSize="lg" fontWeight="bold" color={textColor} letterSpacing="0.5px">
                  Speedy AI
                </Text>
                <Badge 
                  bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                  color="#FFFFFF"
                  fontSize="xs"
                  px={2.5}
                  py={1}
                  borderRadius="full"
                  boxShadow="0 0 15px rgba(16, 185, 129, 0.6), 0 2px 8px rgba(16, 185, 129, 0.3)"
                  fontWeight="semibold"
                  letterSpacing="0.5px"
                  position="relative"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '6px',
                    transform: 'translateY(-50%)',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    bg: '#FFFFFF',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)',
                    animation: 'pulse 2s infinite',
                  }}
                >
                  {language === 'ar' ? 'متصل' : 'Online'}
                </Badge>
              </HStack>
              <Text fontSize="xs" color="#9ca3af" fontWeight="medium">
                {language === 'ar' ? 'مساعدك الذكي' : 'Your AI Assistant'}
              </Text>
            </VStack>
          </HStack>
          <HStack spacing={1}>
            {/* ✅ Feature 4: Examples Button */}
            <IconButton
              aria-label="Examples"
              icon={<FiBookOpen />}
              size="sm"
              variant="ghost"
              color={textColor}
              borderRadius="md"
              _hover={{ bg: '#1a1a1a', color: '#10b981', transform: 'scale(1.1)' }}
              onClick={() => setShowExamples(!showExamples)}
              transition="all 0.2s ease"
              title={language === 'ar' ? 'أمثلة' : 'Examples'}
            />
            {/* ✅ Feature 3: Export Button */}
            {messages.length > 1 && (
              <IconButton
                aria-label="Export"
                icon={<FiDownload />}
                size="sm"
                variant="ghost"
                color={textColor}
                borderRadius="md"
                _hover={{ bg: '#1a1a1a', color: '#f59e0b', transform: 'scale(1.1)' }}
                onClick={handleExportConversation}
                transition="all 0.2s ease"
                title={language === 'ar' ? 'تصدير' : 'Export'}
              />
            )}
            <Select
              size="sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'ar')}
              width="70px"
              bg={inputBg}
              color={textColor}
              borderColor={borderColor}
              borderRadius="md"
              fontWeight="medium"
              fontSize="xs"
              _focus={{
                borderColor: '#2563eb',
                boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)',
                bg: inputBg,
              }}
              _hover={{
                borderColor: '#2563eb',
                bg: '#1f1f1f',
              }}
              transition="all 0.2s ease"
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
              borderRadius="md"
              _hover={{ bg: '#1a1a1a', color: '#2563eb', transform: 'scale(1.1)' }}
              onClick={handleToggle}
              transition="all 0.2s ease"
            />
            <IconButton
              aria-label="Close"
              icon={<FiX />}
              size="sm"
              variant="ghost"
              color={textColor}
              borderRadius="md"
              _hover={{ bg: '#1a1a1a', color: '#ef4444', transform: 'scale(1.1)' }}
              onClick={handleClose}
              transition="all 0.2s ease"
            />
          </HStack>
        </Flex>
      </CardBody>

      {/* ✅ Feature 8: Search Bar */}
      {messages.length > 3 && (
        <CardBody p={3} borderBottom="1px solid" borderColor={borderColor} bg={headerBg}>
          <Input
            placeholder={language === 'ar' ? '🔍 بحث في المحادثة...' : '🔍 Search conversation...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="sm"
            bg={inputBg}
            color={textColor}
            borderColor={borderColor}
            borderRadius="lg"
            fontSize="xs"
            _focus={{
              borderColor: '#2563eb',
              boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)',
            }}
          />
        </CardBody>
      )}

      {/* ✅ Feature 4: Example Queries Panel */}
      {showExamples && (
        <CardBody p={4} borderBottom="1px solid" borderColor={borderColor} bg="rgba(37, 99, 235, 0.05)">
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Text fontSize="xs" fontWeight="bold" color="#2563eb">
                {language === 'ar' ? '📚 أمثلة متقدمة' : '📚 ADVANCED EXAMPLES'}
              </Text>
              <IconButton
                aria-label="Close"
                icon={<FiX />}
                size="xs"
                variant="ghost"
                onClick={() => setShowExamples(false)}
              />
            </HStack>
            <VStack spacing={1} align="stretch">
              {(language === 'ar' ? [
                'أعطني تحليل كامل لطلب SV-12345',
                'ما هي أفضل 3 سائقين لمانشستر؟',
                'كيف يمكنني تحسين كفاءة المسارات؟',
                'اعرض لي توقعات الإيرادات للشهر القادم',
                'ما هي المشاكل الحالية التي تحتاج انتباهي؟'
              ] : [
                'Give me complete analysis of order SV-12345',
                'Who are the top 3 drivers for Manchester area?',
                'How can I improve route efficiency?',
                'Show me revenue forecast for next month',
                'What current issues need my attention?'
              ]).map((example, idx) => (
                <Text
                  key={idx}
                  fontSize="xs"
                  color="#9ca3af"
                  cursor="pointer"
                  p={2}
                  borderRadius="md"
                  _hover={{ bg: 'rgba(37, 99, 235, 0.1)', color: '#60a5fa' }}
                  onClick={() => {
                    setInputMessage(example);
                    setShowExamples(false);
                  }}
                  transition="all 0.2s ease"
                >
                  {example}
                </Text>
              ))}
            </VStack>
          </VStack>
        </CardBody>
      )}

      {/* Messages */}
      <Box
        flex={1}
        overflowY="auto"
        p={5}
        bg={messagesBg}
        sx={{ 
          bg: `${messagesBg} !important`,
          backgroundColor: `${messagesBg} !important`,
          '&': {
            backgroundColor: '#0a0a0a !important',
            background: '#0a0a0a !important',
          },
        }}
        __css={{
          backgroundColor: '#0a0a0a !important',
          background: '#0a0a0a !important',
        }}
        css={{
          backgroundColor: '#0a0a0a !important',
          background: '#0a0a0a !important',
          '&::-webkit-scrollbar': {
            width: '10px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#0a0a0a',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(180deg, #333333 0%, #444444 100%)',
            borderRadius: '10px',
            border: '2px solid #0a0a0a',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'linear-gradient(180deg, #444444 0%, #555555 100%)',
          },
        }}
        style={{
          backgroundColor: '#0a0a0a',
          background: '#0a0a0a',
        }}
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '40px',
          background: 'linear-gradient(180deg, rgba(10, 10, 10, 0.9) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
        _after={{
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '40px',
          background: 'linear-gradient(0deg, rgba(10, 10, 10, 0.9) 0%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        <VStack spacing={5} align="stretch" position="relative" zIndex={2}>
          {/* ✅ NEW: Quick Actions Panel (show only if no messages yet or after welcome) */}
          {showSuggestions && messages.length <= 1 && (
            <Box
              p={4}
              borderRadius="xl"
              bg="rgba(37, 99, 235, 0.05)"
              border="1px solid rgba(37, 99, 235, 0.2)"
              boxShadow="0 4px 15px rgba(37, 99, 235, 0.15)"
            >
              <Text 
                fontSize="xs" 
                fontWeight="bold" 
                color="#2563eb" 
                mb={3}
                letterSpacing="0.5px"
              >
                {language === 'ar' ? '⚡ إجراءات سريعة' : '⚡ QUICK ACTIONS'}
              </Text>
              <VStack spacing={2} align="stretch">
                {quickActions.map((action, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant="ghost"
                    justifyContent="flex-start"
                    onClick={() => handleQuickAction(action.prompt)}
                    color={textColor}
                    bg="rgba(255, 255, 255, 0.03)"
                    borderRadius="lg"
                    fontWeight="medium"
                    fontSize="xs"
                    h="auto"
                    py={2}
                    px={3}
                    _hover={{
                      bg: 'rgba(37, 99, 235, 0.15)',
                      transform: 'translateX(4px)',
                      color: '#60a5fa'
                    }}
                    transition="all 0.2s ease"
                    textAlign="left"
                  >
                    {action.label}
                  </Button>
                ))}
              </VStack>
            </Box>
          )}
          
          {filteredMessages.map((message, index) => (
            <Box
              key={message.id}
              opacity={0}
              animation={`fadeIn 0.3s ease forwards ${index * 0.1}s`}
              css={{
                '@keyframes fadeIn': {
                  from: { opacity: 0, transform: 'translateY(10px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
              }}
            >
              <HStack
                align="flex-start"
                spacing={3}
                justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
              >
                {message.role === 'assistant' && (
                  <Avatar 
                    size="md" 
                    bg="linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                    icon={<FiZap />}
                    boxShadow="0 0 20px rgba(37, 99, 235, 0.6), 0 4px 12px rgba(37, 99, 235, 0.3)"
                    border="2px solid"
                    borderColor="rgba(37, 99, 235, 0.3)"
                    transition="all 0.3s ease"
                    _hover={{
                      transform: 'scale(1.1) rotate(5deg)',
                      boxShadow: '0 0 30px rgba(37, 99, 235, 0.8), 0 6px 15px rgba(37, 99, 235, 0.4)',
                    }}
                  />
                )}
                <VStack align={message.role === 'user' ? 'flex-end' : 'flex-start'} spacing={2} maxW="75%">
                  <Box
                    w="full"
                    p={4}
                    borderRadius="xl"
                    bg={
                      message.role === 'user'
                        ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
                        : messageBgAssistant
                    }
                    color={
                      message.role === 'user'
                        ? messageBgUserText
                        : messageBgAssistantText
                    }
                    sx={{
                      bg: message.role === 'user' 
                        ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) !important'
                        : `${messageBgAssistant} !important`,
                      color: `${message.role === 'user' ? messageBgUserText : messageBgAssistantText} !important`,
                    }}
                    boxShadow={
                      message.role === 'user'
                        ? '0 8px 20px rgba(37, 99, 235, 0.4), 0 2px 8px rgba(37, 99, 235, 0.2)'
                        : '0 8px 20px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.3)'
                    }
                    border={
                      message.role === 'assistant'
                        ? '1px solid rgba(51, 51, 51, 0.5)'
                        : 'none'
                    }
                    transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                    _hover={{
                      transform: 'translateY(-2px) scale(1.02)',
                      boxShadow: message.role === 'user'
                        ? '0 12px 28px rgba(37, 99, 235, 0.5), 0 4px 12px rgba(37, 99, 235, 0.3)'
                        : '0 12px 28px rgba(0, 0, 0, 0.7), 0 4px 12px rgba(0, 0, 0, 0.4)',
                    }}
                    position="relative"
                    _before={message.role === 'user' ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '1px',
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%)',
                    } : {}}
                  >
                    {/* ✅ Feature 7: Rich Formatting */}
                    <Text 
                      fontSize="sm" 
                      whiteSpace="pre-wrap" 
                      lineHeight="1.7"
                      fontWeight="medium"
                      letterSpacing="0.2px"
                      dangerouslySetInnerHTML={{
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>')
                          .replace(/\n/g, '<br />')
                      }}
                    />
                    <HStack mt={2} justify="space-between">
                      <Text
                        fontSize="xs"
                        opacity={0.7}
                        fontWeight="medium"
                        color={message.role === 'user' ? 'rgba(255, 255, 255, 0.9)' : '#9ca3af'}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      
                      {/* ✅ Feature 1 & 2: Action Buttons (only for assistant messages) */}
                      {message.role === 'assistant' && (
                        <HStack spacing={1}>
                          <IconButton
                            aria-label="Copy"
                            icon={message.copied ? <FiCheck /> : <FiCopy />}
                            size="xs"
                            variant="ghost"
                            color={message.copied ? '#10b981' : '#9ca3af'}
                            onClick={() => handleCopyMessage(message.id, message.content)}
                            _hover={{ color: '#60a5fa', transform: 'scale(1.1)' }}
                            transition="all 0.2s ease"
                          />
                          <IconButton
                            aria-label="Thumbs up"
                            icon={<FiThumbsUp />}
                            size="xs"
                            variant="ghost"
                            color={message.feedback === 'up' ? '#10b981' : '#9ca3af'}
                            onClick={() => handleFeedback(message.id, 'up')}
                            _hover={{ color: '#10b981', transform: 'scale(1.1)' }}
                            transition="all 0.2s ease"
                          />
                          <IconButton
                            aria-label="Thumbs down"
                            icon={<FiThumbsDown />}
                            size="xs"
                            variant="ghost"
                            color={message.feedback === 'down' ? '#ef4444' : '#9ca3af'}
                            onClick={() => handleFeedback(message.id, 'down')}
                            _hover={{ color: '#ef4444', transform: 'scale(1.1)' }}
                            transition="all 0.2s ease"
                          />
                        </HStack>
                      )}
                    </HStack>
                  </Box>
                </VStack>
                {message.role === 'user' && (
                  <Avatar 
                    size="md" 
                    bg="linear-gradient(135deg, #4b5563 0%, #374151 100%)"
                    icon={<FiUser />}
                    boxShadow="0 0 15px rgba(75, 85, 99, 0.6), 0 4px 12px rgba(75, 85, 99, 0.3)"
                    border="2px solid"
                    borderColor="rgba(75, 85, 99, 0.3)"
                    transition="all 0.3s ease"
                    _hover={{
                      transform: 'scale(1.1) rotate(-5deg)',
                      boxShadow: '0 0 25px rgba(75, 85, 99, 0.8), 0 6px 15px rgba(75, 85, 99, 0.4)',
                    }}
                  />
                )}
              </HStack>
            </Box>
          ))}
          {isLoading && (
            <HStack align="flex-start" spacing={3} position="relative" zIndex={2}>
              <Avatar 
                size="md" 
                bg="linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                icon={<FiZap />}
                boxShadow="0 0 20px rgba(37, 99, 235, 0.6), 0 4px 12px rgba(37, 99, 235, 0.3)"
                border="2px solid"
                borderColor="rgba(37, 99, 235, 0.3)"
                animation="pulse 2s infinite"
              />
              <Box
                p={4}
                borderRadius="xl"
                bg={messageBgAssistant}
                border="1px solid rgba(51, 51, 51, 0.5)"
                boxShadow="0 8px 20px rgba(0, 0, 0, 0.6), 0 2px 8px rgba(0, 0, 0, 0.3)"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(37, 99, 235, 0.5) 50%, transparent 100%)',
                }}
              >
                <HStack spacing={2}>
                  <Spinner size="sm" color="#2563eb" thickness="3px" speed="0.8s" />
                  <Text fontSize="xs" color="#9ca3af" fontWeight="medium">
                    {language === 'ar' ? 'جاري الكتابة...' : 'Typing...'}
                  </Text>
                </HStack>
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
        sx={{ 
          bg: `${headerBg} !important`,
          backgroundColor: `${headerBg} !important`,
          borderColor: `${borderColor} !important`,
          background: `linear-gradient(135deg, ${headerBg} 0%, #0a0a0a 100%) !important`,
          backgroundImage: `linear-gradient(135deg, ${headerBg} 0%, #0a0a0a 100%) !important`,
          '&': {
            backgroundColor: '#111111 !important',
            background: 'linear-gradient(135deg, #111111 0%, #0a0a0a 100%) !important',
          },
        }}
        __css={{
          backgroundColor: '#111111 !important',
          background: 'linear-gradient(135deg, #111111 0%, #0a0a0a 100%) !important',
        }}
        css={{
          backgroundColor: '#111111 !important',
          background: 'linear-gradient(135deg, #111111 0%, #0a0a0a 100%) !important',
        }}
        style={{
          backgroundColor: '#111111',
          background: 'linear-gradient(135deg, #111111 0%, #0a0a0a 100%)',
        }}
        position="relative"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(37, 99, 235, 0.3) 50%, transparent 100%)',
        }}
      >
        <VStack spacing={0} style={{ backgroundColor: '#111111' }}>
          <HStack p={4} spacing={3} align="flex-end" style={{ backgroundColor: '#111111' }}>
            <Textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
              size="md"
              resize="none"
              rows={2}
              flex={1}
              bg={inputBg}
              color={textColor}
              borderColor={borderColor}
              borderRadius="xl"
              borderWidth="2px"
              fontWeight="medium"
              letterSpacing="0.2px"
              _placeholder={{
                color: '#6b7280',
                fontWeight: 'normal',
              }}
              _focus={{
                borderColor: '#2563eb',
                boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1), 0 0 20px rgba(37, 99, 235, 0.2)',
                bg: '#1f1f1f',
              }}
              _hover={{
                borderColor: '#2563eb',
                bg: '#1f1f1f',
              }}
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
            />
            <VStack spacing={2} flexShrink={0}>
              <IconButton
                aria-label="Send"
                icon={<FiSend style={{ color: '#FFFFFF' }} />}
                bg="linear-gradient(135deg, #10b981 0%, #059669 100%)"
                color="#FFFFFF"
                size="md"
                borderRadius="xl"
                onClick={handleSendMessage}
                isLoading={isLoading}
                isDisabled={!inputMessage.trim() || isLoading}
                _hover={{
                  bg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  transform: 'scale(1.08) rotate(5deg)',
                  boxShadow: '0 0 25px rgba(16, 185, 129, 0.6), 0 8px 20px rgba(16, 185, 129, 0.4)',
                }}
                _active={{
                  transform: 'scale(0.95)',
                }}
                _disabled={{
                  bg: '#1a1a1a',
                  color: '#6b7280',
                  cursor: 'not-allowed',
                  opacity: 0.5,
                  border: '1px solid #333333',
                }}
                transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                boxShadow="0 0 15px rgba(16, 185, 129, 0.4), 0 4px 12px rgba(16, 185, 129, 0.2)"
                border="2px solid"
                borderColor="rgba(16, 185, 129, 0.3)"
              />
              {messages.length > 1 && (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={handleClearChat}
                  fontSize="xs"
                  color="#9ca3af"
                  fontWeight="medium"
                  borderRadius="md"
                  _hover={{
                    bg: '#1a1a1a',
                    color: '#ef4444',
                    transform: 'translateY(-1px)',
                  }}
                  transition="all 0.2s ease"
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

