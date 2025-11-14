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
import { FiX, FiSend, FiCheckCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import SpeedyAIIcon from './SpeedyAIIcon';

const MotionBox = motion.create(Box);
const MotionFlex = motion.create(Flex);

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
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
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
  const [canCalculate, setCanCalculate] = useState(false);
  const [isReadyForPayment, setIsReadyForPayment] = useState(false);
  const [customerDetails, setCustomerDetails] = useState<{name?: string; email?: string; phone?: string}>({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<Array<{ name: string; type: string; url?: string }>>([]);
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

  // Detect Web Speech API support and init recognizer
  useEffect(() => {
    // Load TTS preference
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('sv_ai_tts_enabled') : null;
      if (saved != null) {
        setTtsEnabled(saved === 'true');
      }
    } catch {}

    const SpeechRecognition: any =
      (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
      null;
    setSupportsSpeech(Boolean(SpeechRecognition));
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-GB';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (ev: any) => {
        setIsListening(false);
        try {
          const err = ev?.error || 'unknown';
          toast({
            title: 'Voice input error',
            description: err === 'not-allowed'
              ? 'Microphone permission denied. Please allow mic access in your browser settings.'
              : err === 'service-not-allowed'
              ? 'Speech service blocked by browser. Ensure site is on HTTPS or use Chrome/Edge/Safari.'
              : `Speech error: ${String(err)}`,
            status: 'error',
            duration: 3500,
          });
        } catch {}
      };
      recognition.onresult = (event: any) => {
        try {
          const transcript: string = event.results[0][0].transcript;
          if (transcript && transcript.trim()) {
            handleSendMessage(transcript.trim());
          }
        } catch {}
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const handleSendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!overrideText) setInputValue('');
    setIsLoading(true);

    try {
      // Call AI chat API
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
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
        if (ttsEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            const utter = new SpeechSynthesisUtterance(data.message);
            utter.lang = 'en-GB';
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utter);
          } catch {}
        }
        
        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
        }

        // Update extracted data
        if (data.extractedData) {
          setExtractedData((prev) => ({ ...prev, ...data.extractedData }));
          // Update customer details separately for payment handoff
          if (data.extractedData.customerName || data.extractedData.customerEmail || data.extractedData.customerPhone) {
            setCustomerDetails((prev) => ({
              ...prev,
              name: data.extractedData.customerName || prev.name,
              email: data.extractedData.customerEmail || prev.email,
              phone: data.extractedData.customerPhone || prev.phone,
            }));
          }
        }

        // Enable manual calculate button when ready
        setCanCalculate(Boolean(data.shouldCalculateQuote && data.extractedData));
        
        // Check if AI says ready for payment
        if (data.message && data.message.includes('READY_FOR_PAYMENT')) {
          setIsReadyForPayment(true);
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

  const toggleListening = () => {
    // Initialize recognizer lazily if needed
    if (!recognitionRef.current) {
      const SpeechRecognition: any =
        (typeof window !== 'undefined' && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
        null;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-GB';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event: any) => {
          try {
            const transcript: string = event.results[0][0].transcript;
            if (transcript && transcript.trim()) {
              handleSendMessage(transcript.trim());
            }
          } catch {}
        };
        recognitionRef.current = recognition;
        setSupportsSpeech(true);
      }
    }

    if (!supportsSpeech || !recognitionRef.current) {
      toast({
        title: 'Voice input not available',
        description: 'Your browser does not support speech recognition. Try Chrome/Edge/Safari over HTTPS.',
        status: 'info',
        duration: 3000,
      });
      return;
    }
    try {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
    } catch (e) {
      toast({ title: 'Could not start voice input', status: 'error', duration: 2500 });
    }
  };

  const toggleTts = () => {
    const next = !ttsEnabled;
    setTtsEnabled(next);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('sv_ai_tts_enabled', String(next));
      }
    } catch {}
  };

  const calculateQuote = async (data: ExtractedData) => {
    try {
      setCanCalculate(false);
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

  const onUploadClick = () => fileInputRef.current?.click();

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const maxSize = 10 * 1024 * 1024;
    const accepted = Array.from(files).filter(f => (
      ['image/jpeg','image/png','image/webp','image/jpg','text/plain','application/pdf'].includes(f.type)
    ) && f.size <= maxSize);
    if (accepted.length === 0) {
      toast({ title: 'Unsupported file', description: 'Upload JPG/PNG/WEBP/TXT/PDF under 10MB', status: 'warning', duration: 3000 });
      return;
    }
    const previews = accepted.map(f => ({ name: f.name, type: f.type, url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined }));
    setPendingFiles(previews);
    const form = new FormData();
    form.append('message', inputValue || '');
    accepted.forEach(f => form.append('files', f));
    form.append('conversationHistory', JSON.stringify(messages.slice(-6).map(m => ({ role: m.role, content: m.content }))));
    form.append('extractedData', JSON.stringify(extractedData));
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) {
        const aiMessage: Message = { id: (Date.now()+1).toString(), role: 'assistant', content: data.message, timestamp: new Date() };
        setMessages(prev => [...prev, aiMessage]);
        if (data.extractedData) setExtractedData(prev => ({ ...prev, ...data.extractedData }));
        setCanCalculate(Boolean(data.shouldCalculateQuote && data.extractedData));
        if (ttsEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try { const u = new SpeechSynthesisUtterance(data.message); u.lang='en-GB'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);} catch {}
        }
      } else {
        toast({ title: 'Analysis failed', description: data.error || 'Could not analyze file', status: 'error', duration: 3000 });
      }
    } catch {
      toast({ title: 'Upload error', status: 'error', duration: 3000 });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <MotionBox
            position="fixed"
            bottom={{ base: 2, md: 4 }}
            right={{ base: 2, md: 4 }}
            left="auto"
            zIndex={9999}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              as="button"
              aria-label="Open Speedy AI"
              onClick={() => setIsOpen(true)}
              position="relative"
              w={{ base: '70px', sm: '80px', md: '120px' }}
              h={{ base: '70px', sm: '80px', md: '120px' }}
              cursor="pointer"
              _hover={{
                transform: 'scale(1.05)',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
              transition="all 0.3s"
              shadow="2xl"
              borderRadius="20%"
              overflow="hidden"
              flexShrink={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              p={0}
              border="none"
              bg="transparent"
            >
              <SpeedyAIIcon size={120} />
              {unreadCount > 0 && (
                <Badge
                  position="absolute"
                  top="-2"
                  right="-2"
                  colorScheme="red"
                  borderRadius="full"
                  fontSize="xs"
                  px={2}
                  zIndex={10}
                >
                  {unreadCount}
                </Badge>
              )}
            </Box>
            
            <MotionBox
              position="absolute"
              top={{ base: '-10', md: '-12' }}
              right="0"
              bg="white"
              color="gray.800"
              px={{ base: 3, md: 4 }}
              py={{ base: 1.5, md: 2 }}
              borderRadius="lg"
              shadow="lg"
              fontSize={{ base: 'xs', md: 'sm' }}
              fontWeight="medium"
              whiteSpace="nowrap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              overflow="hidden"
              display={{ base: 'none', sm: 'block' }}
            >
              <Box
                position="relative"
                zIndex={2}
                bgGradient="linear(to-r, gray.800, blue.600, gray.800)"
                bgClip="text"
                fontWeight="bold"
              >
                Ask me! 💬
              </Box>
              
              {/* Animated White Wave Light Effect */}
              <Box
                position="absolute"
                top="0"
                left="-100%"
                w="100%"
                h="100%"
                bgGradient="linear(to-r, transparent, rgba(255,255,255,0.8), transparent)"
                animation="wave 2s linear infinite"
                zIndex={1}
                sx={{
                  '@keyframes wave': {
                    '0%': {
                      left: '-100%',
                    },
                    '100%': {
                      left: '100%',
                    },
                  },
                }}
              />
              
              <Box
                position="absolute"
                bottom="-4"
                right="4"
                w="0"
                h="0"
                borderLeft="8px solid transparent"
                borderRight="8px solid transparent"
                borderTop="8px solid white"
                zIndex={3}
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
            bottom={{ base: 0, md: 4 }}
            right={{ base: 0, md: 4 }}
            left={{ base: 0, md: 'auto' }}
            w={{ base: '100%', md: '400px' }}
            h={{ base: '100%', md: '600px' }}
            maxH={{ base: '100dvh', md: '600px' }}
            bg="white"
            borderRadius={{ base: '0', md: 'xl' }}
            shadow="2xl"
            flexDirection="column"
            overflow="hidden"
            zIndex={9999}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Header */}
            <Flex
              bgGradient="linear(to-r, blue.600, cyan.500)"
              p={{ base: 3, md: 4 }}
              pt={{ base: 'calc(env(safe-area-inset-top) + 12px)', md: 4 }}
              align="center"
              justify="space-between"
              color="white"
            >
              <HStack spacing={{ base: 2, md: 3 }}>
                <SpeedyAIIcon size={40} />
                <Box>
                  <Text 
                    fontWeight="extrabold" 
                    fontSize={{ base: 'lg', md: 'xl' }}
                    letterSpacing="tight"
                    bgGradient="linear(to-r, white, cyan.100, white)"
                    bgClip="text"
                    textShadow="0 2px 10px rgba(255,255,255,0.3)"
                    fontFamily="'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                  >
                    Speedy AI
                  </Text>
                  <HStack spacing={1} fontSize="xs">
                    <Box w={2} h={2} bg="green.300" borderRadius="full" 
                      animation="pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                      sx={{
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0.5 },
                        },
                      }}
                    />
                    <Text fontWeight="medium" color="whiteAlpha.900">Online</Text>
                  </HStack>
                </Box>
              </HStack>
              <HStack spacing={1}>
                <IconButton
                  aria-label={ttsEnabled ? 'Disable voice replies' : 'Enable voice replies'}
                  icon={<Box as="span" fontSize="lg">{ttsEnabled ? '🔊' : '🔇'}</Box>}
                  size={{ base: 'md', md: 'sm' }}
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.300' }}
                  _active={{ bg: 'whiteAlpha.400' }}
                  onClick={toggleTts}
                  title={ttsEnabled ? 'Voice replies on' : 'Voice replies off'}
                />
                <IconButton
                  aria-label="Close chat"
                  icon={<FiX />}
                  size={{ base: 'md', md: 'sm' }}
                  variant="ghost"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.300' }}
                  _active={{ bg: 'whiteAlpha.400' }}
                  onClick={() => setIsOpen(false)}
                />
              </HStack>
            </Flex>

            {/* Messages - Fixed Layout */}
            <Box
              flex={1}
              overflowY="auto"
              overflowX="hidden"
              bg="gray.50"
              sx={{
                WebkitOverflowScrolling: 'touch',
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
              <VStack
                p={{ base: 3, md: 4 }}
                spacing={{ base: 4, md: 4 }}
                align="stretch"
                minH="full"
              >
                {messages.map((message) => (
                  <MotionFlex
                    key={message.id}
                    justify={message.role === 'user' ? 'flex-end' : 'flex-start'}
                    align="flex-start"
                    gap={2}
                    w="full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    mb={2}
                  >
                    {message.role === 'assistant' && (
                      <Box flexShrink={0} mt={1}>
                        <SpeedyAIIcon size={32} />
                      </Box>
                    )}
                    
                    <Box
                      maxW={{ base: '75%', md: '70%' }}
                      bg={message.role === 'user' ? 'blue.500' : 'white'}
                      color={message.role === 'user' ? 'white' : 'gray.800'}
                      px={{ base: 3, md: 4 }}
                      py={{ base: 2.5, md: 3 }}
                      borderRadius="lg"
                      shadow="sm"
                      fontSize={{ base: 'sm', md: 'sm' }}
                      whiteSpace="pre-wrap"
                      wordBreak="break-word"
                      lineHeight="1.5"
                      position="relative"
                    >
                      {message.content}
                    </Box>
                    
                    {message.role === 'user' && (
                      <Box flexShrink={0} mt={1}>
                        <Avatar size="sm" bg="blue.600" color="white" name="You" />
                      </Box>
                    )}
                  </MotionFlex>
                ))}
                {isLoading && (
                  <Flex justify="flex-start" gap={2} mb={2}>
                    <Box flexShrink={0} mt={1}>
                      <SpeedyAIIcon size={32} />
                    </Box>
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
            </Box>

            {/* Calculate Quote Now CTA */}
            {canCalculate && !quoteData && (
              <Box bg="green.50" p={3} borderTop="1px" borderColor="green.200">
                <Button
                  colorScheme="green"
                  w="full"
                  size="sm"
                  onClick={() => calculateQuote(extractedData)}
                  isDisabled={isLoading}
                >
                  Calculate quote now
                </Button>
              </Box>
            )}

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
                <VStack spacing={2} w="full">
                  {!isReadyForPayment ? (
                    <Text fontSize="xs" color="gray.600" textAlign="center">
                      Continue chatting to provide your contact details
                    </Text>
                  ) : (
                    <Button
                      size="sm"
                      colorScheme="green"
                      w="full"
                      onClick={() => {
                        // Create booking data and redirect to booking page
                        const bookingData = {
                          ...extractedData,
                          ...customerDetails,
                          quote: quoteData,
                        };
                        // Store in sessionStorage for booking page
                        sessionStorage.setItem('speedyai_booking', JSON.stringify(bookingData));
                        window.location.href = '/booking-luxury';
                      }}
                      leftIcon={<Icon as={FiCheckCircle} />}
                    >
                      Proceed to Payment
                    </Button>
                  )}
                </VStack>
              </Box>
            )

            {/* Input */}
            <Flex 
              p={{ base: 3, md: 4 }} 
              pb={{ base: 'calc(env(safe-area-inset-bottom) + 12px)', md: 4 }}
              bg="white" 
              borderTop="1px" 
              borderColor="gray.200"
              gap={2}
            >
              {!!pendingFiles.length && (
                <HStack spacing={2} align="center">
                  {pendingFiles.slice(0,3).map((f, idx) => (
                    <Box key={idx} border="1px solid" borderColor="gray.200" borderRadius="md" p={1}>
                      {f.url ? (
                        <Box as="img" src={f.url} alt={f.name} w="36px" h="36px" objectFit="cover" borderRadius="sm" />
                      ) : (
                        <Text fontSize="xs" maxW="80px" noOfLines={1}>{f.name}</Text>
                      )}
                    </Box>
                  ))}
                </HStack>
              )}
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isListening ? 'Listening… speak now' : 'Type your message...'}
                size={{ base: 'md', md: 'md' }}
                fontSize={{ base: '16px', md: '14px' }}
                disabled={isLoading}
                flex={1}
                _focus={{
                  borderColor: 'blue.500',
                  boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                }}
              />
              <IconButton
                aria-label="Upload files"
                icon={<Box as="span" fontSize="lg">📎</Box>}
                colorScheme="gray"
                variant="outline"
                onClick={onUploadClick}
                _active={{ transform: 'scale(0.95)' }}
              />
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg,text/plain,application/pdf" multiple onChange={handleFilesSelected} style={{ display: 'none' }} />
              <IconButton
                aria-label={supportsSpeech ? (isListening ? 'Stop voice input' : 'Start voice input') : 'Voice not supported'}
                icon={<Box as="span" fontSize="lg">🎤</Box>}
                colorScheme={isListening ? 'red' : 'gray'}
                variant={isListening ? 'solid' : 'outline'}
                onClick={toggleListening}
                _active={{ transform: 'scale(0.95)' }}
                title={supportsSpeech ? undefined : 'Voice input not supported in this browser'}
              />
              <IconButton
                aria-label="Send message"
                icon={<FiSend />}
                colorScheme="blue"
                onClick={() => handleSendMessage()}
                isLoading={isLoading}
                isDisabled={!inputValue.trim()}
                size={{ base: 'md', md: 'md' }}
                minW={{ base: '48px', md: 'auto' }}
                _active={{ transform: 'scale(0.95)' }}
              />
            </Flex>
          </MotionFlex>
        )}
      </AnimatePresence>
    </>
  );
}

