'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Input,
  Text,
  VStack,
  HStack,
  Avatar,
  Spinner,
  useToast,
  Collapse,
  Badge,
  Divider,
} from '@chakra-ui/react';
import { FiMessageCircle, FiX, FiSend, FiTruck, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface ExtractedData {
  pickupAddress?: string;
  dropoffAddress?: string;
  numberOfRooms?: number;
  specialItems?: string[];
  movingDate?: string;
  vehicleType?: string;
}

interface QuoteData {
  total: number;
  subtotal: number;
  vat: number;
  vehicleType: string;
  estimatedDuration: string;
  helpers: number;
  distance: number;
}

export default function SpeedyAIBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! 👋 I\'m Speedy AI, your moving assistant. I can help you get an instant quote for your move. Where are you moving from?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call AI chat API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
          extractedData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        
        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
        }

        // Update extracted data
        if (data.extractedData) {
          setExtractedData((prev) => ({ ...prev, ...data.extractedData }));
        }

        // Calculate quote if ready
        if (data.shouldCalculateQuote && data.extractedData) {
          await calculateQuote(data.extractedData);
        }
      } else {
        throw new Error(data.error || 'Failed to get response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, I\'m experiencing technical difficulties. Please try again or call us at +44 1202129746.',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to AI assistant',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateQuote = async (data: ExtractedData) => {
    try {
      const response = await fetch('/api/ai/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupAddress: data.pickupAddress,
          dropoffAddress: data.dropoffAddress,
          numberOfRooms: data.numberOfRooms || 2,
          specialItems: data.specialItems || [],
          movingDate: data.movingDate,
          vehicleType: data.vehicleType,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setQuoteData(result.quote);
        
        const quoteMessage: Message = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `Great! Based on your requirements, here's your instant quote:\n\n💰 **Total: £${result.quote.total.toFixed(2)}**\n🚚 Vehicle: ${result.quote.vehicleType}\n⏱️ Estimated Duration: ${result.quote.estimatedDuration}\n👷 Helpers: ${result.quote.helpers} ${result.quote.helpers > 0 ? 'included' : ''}\n\nThis includes VAT and all fees. Would you like to proceed with booking?`,
          timestamp: new Date(),
        };
        
        setMessages((prev) => [...prev, quoteMessage]);
      }
    } catch (error) {
      console.error('Quote calculation error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <MotionBox
            position="fixed"
            bottom={{ base: 4, md: 8 }}
            right={{ base: 4, md: 8 }}
            zIndex={9999}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <IconButton
              aria-label="Open Speedy AI"
              icon={<Icon as={FiMessageCircle} boxSize={6} />}
              size="lg"
              colorScheme="blue"
              isRound
              shadow="2xl"
              w={{ base: '60px', md: '70px' }}
              h={{ base: '60px', md: '70px' }}
              onClick={() => setIsOpen(true)}
              position="relative"
              _hover={{
                transform: 'scale(1.1)',
                shadow: '2xl',
              }}
              transition="all 0.3s"
              bgGradient="linear(to-r, blue.500, cyan.500)"
            >
              {unreadCount > 0 && (
                <Badge
                  position="absolute"
                  top="-2"
                  right="-2"
                  colorScheme="red"
                  borderRadius="full"
                  fontSize="xs"
                  px={2}
                >
                  {unreadCount}
                </Badge>
              )}
            </IconButton>
            
            <MotionBox
              position="absolute"
              top="-12"
              right="0"
              bg="white"
              color="gray.800"
              px={4}
              py={2}
              borderRadius="lg"
              shadow="lg"
              fontSize="sm"
              fontWeight="medium"
              whiteSpace="nowrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Need a quote? Ask me! 💬
              <Box
                position="absolute"
                bottom="-4"
                right="4"
                w="0"
                h="0"
                borderLeft="8px solid transparent"
                borderRight="8px solid transparent"
                borderTop="8px solid white"
              />
            </MotionBox>
          </MotionBox>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <MotionFlex
            position="fixed"
            bottom={{ base: 0, md: 8 }}
            right={{ base: 0, md: 8 }}
            w={{ base: '100vw', md: '400px' }}
            h={{ base: '100vh', md: '600px' }}
            bg="white"
            borderRadius={{ base: '0', md: 'xl' }}
            shadow="2xl"
            flexDirection="column"
            overflow="hidden"
            zIndex={9999}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <Flex
              bgGradient="linear(to-r, blue.600, cyan.500)"
              p={4}
              align="center"
              justify="space-between"
              color="white"
            >
              <HStack spacing={3}>
                <Avatar
                  size="sm"
                  name="Speedy AI"
                  bg="white"
                  color="blue.600"
                  icon={<Icon as={FiTruck} />}
                />
                <Box>
                  <Text fontWeight="bold" fontSize="lg">
                    Speedy AI
                  </Text>
                  <HStack spacing={1} fontSize="xs">
                    <Box w={2} h={2} bg="green.300" borderRadius="full" />
                    <Text>Online</Text>
                  </HStack>
                </Box>
              </HStack>
              
              <IconButton
                aria-label="Close chat"
                icon={<FiX />}
                size="sm"
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.300' }}
                onClick={() => setIsOpen(false)}
              />
            </Flex>

            {/* Messages */}
            <VStack
              flex={1}
              overflowY="auto"
              p={4}
              spacing={4}
              bg="gray.50"
              align="stretch"
              sx={{
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  bg: 'gray.100',
                },
                '&::-webkit-scrollbar-thumb': {
                  bg: 'blue.300',
                  borderRadius: 'full',
                },
              }}
            >
              {messages.map((message) => (
                <MotionFlex
                  key={message.id}
                  justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {message.role === 'assistant' && (
                    <Avatar
                      size="xs"
                      name="AI"
                      bg="blue.500"
                      color="white"
                      icon={<Icon as={FiTruck} />}
                      mr={2}
                    />
                  )}
                  
                  <Box
                    maxW="80%"
                    bg={message.role === 'user' ? 'blue.500' : 'white'}
                    color={message.role === 'user' ? 'white' : 'gray.800'}
                    px={4}
                    py={3}
                    borderRadius="lg"
                    shadow="sm"
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                  >
                    {message.content}
                  </Box>
                </MotionFlex>
              ))}
              
              {isLoading && (
                <Flex justify="flex-start">
                  <Avatar
                    size="xs"
                    name="AI"
                    bg="blue.500"
                    color="white"
                    icon={<Icon as={FiTruck} />}
                    mr={2}
                  />
                  <Box bg="white" px={4} py={3} borderRadius="lg" shadow="sm">
                    <HStack spacing={1}>
                      <Spinner size="xs" color="blue.500" />
                      <Text fontSize="sm" color="gray.600">
                        Thinking...
                      </Text>
                    </HStack>
                  </Box>
                </Flex>
              )}
              
              <div ref={messagesEndRef} />
            </VStack>

            {/* Quote Summary (if available) */}
            {quoteData && (
              <Box bg="blue.50" p={4} borderTop="1px" borderColor="blue.200">
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <Icon as={FiCheckCircle} color="green.500" />
                    <Text fontSize="sm" fontWeight="bold" color="gray.700">
                      Quote Ready
                    </Text>
                  </HStack>
                  <Text fontSize="xl" fontWeight="bold" color="blue.600">
                    £{quoteData.total.toFixed(2)}
                  </Text>
                </HStack>
                <Button
                  size="sm"
                  colorScheme="blue"
                  w="full"
                  onClick={() => {
                    window.location.href = '/';
                  }}
                >
                  Book Now
                </Button>
              </Box>
            )}

            {/* Input */}
            <Flex p={4} bg="white" borderTop="1px" borderColor="gray.200">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                size="md"
                mr={2}
                disabled={isLoading}
                _focus={{
                  borderColor: 'blue.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                }}
              />
              <IconButton
                aria-label="Send message"
                icon={<FiSend />}
                colorScheme="blue"
                onClick={handleSendMessage}
                isLoading={isLoading}
                isDisabled={!inputValue.trim()}
              />
            </Flex>
          </MotionFlex>
        )}
      </AnimatePresence>
    </>
  );
}

