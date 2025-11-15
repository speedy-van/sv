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
      content: "Hi! I'm Speedy AI. I'll get you an instant moving quote. Where are you moving from?",
      timestamp: new Date(),
    },
  ]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
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
  const [isActionsExpanded, setIsActionsExpanded] = useState(false);
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
        
        // Update progress step
        setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
        
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

  const handleProceedToPayment = async () => {
    try {
      setIsLoading(true);
      
      // Parse customer name
      const nameParts = (customerDetails.name || '').trim().split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.slice(1).join(' ') || 'Speedy';
      
      // Prepare items array
      const items = (extractedData.specialItems || []).map(item => {
        const [quantityPart, ...nameParts] = item.split(' ');
        const quantity = parseInt(quantityPart) || 1;
        const name = nameParts.join(' ') || item;
        
        return {
          id: `item_${Date.now()}_${Math.random()}`,
          name: name,
          category: 'furniture',
          quantity: quantity,
          weight: 20,
          volume: 0.5,
        };
      });
      
      // Create booking
      const response = await fetch('/api/ai/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerDetails: {
            firstName,
            lastName,
            email: customerDetails.email || '',
            phone: customerDetails.phone || '',
          },
          pickupAddress: {
            full: extractedData.pickupAddress || '',
            postcode: extractedData.pickupAddress?.split(',').pop()?.trim() || '',
          },
          dropoffAddress: {
            full: extractedData.dropoffAddress || '',
            postcode: extractedData.dropoffAddress?.split(',').pop()?.trim() || '',
          },
          items: items.length > 0 ? items : [{
            id: `room_${Date.now()}`,
            name: `${extractedData.numberOfRooms || 2} Bedroom Move`,
            category: 'room-package',
            quantity: 1,
            weight: (extractedData.numberOfRooms || 2) * 50,
            volume: (extractedData.numberOfRooms || 2) * 2,
          }],
          serviceType: 'standard',
          pickupDate: extractedData.movingDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          pricing: {
            subtotal: quoteData?.total || 150,
            vat: (quoteData?.total || 150) * 0.2,
            total: quoteData?.total || 150,
            distance: quoteData?.distance || 10,
          },
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.payment?.url) {
        // Show success message with payment link (NO AUTO-REDIRECT)
        const successMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `🎉 Booking created successfully! Your booking number is **${result.booking.bookingNumber}**.\n\nYour payment link is ready. Click the button below when you're ready to complete payment.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, successMessage]);
        
        // Store payment URL for manual access
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pending_payment_url', result.payment.url);
          sessionStorage.setItem('pending_booking_number', result.booking.bookingNumber);
        }
      } else {
        throw new Error(result.error || 'Failed to create booking');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Booking Error',
        description: error.message || 'Failed to create booking. Please try again.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
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
                Need a quote?
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
            bg="white"
            sx={{
              '@media (max-width: 768px)': {
                maxHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
                height: '100svh',
              },
              '@media (min-width: 769px)': {
                maxHeight: '600px',
              },
              '@supports not (height: 100svh)': {
                height: '100vh',
              },
            }}
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
              animation="blueFlash 3s ease-in-out infinite"
              sx={{
                '@keyframes blueFlash': {
                  '0%, 100%': { 
                    filter: 'brightness(1)',
                    boxShadow: '0 0 0 rgba(59, 130, 246, 0)',
                  },
                  '50%': { 
                    filter: 'brightness(1.3)',
                    boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)',
                  },
                },
              }}
            >
              <HStack spacing={{ base: 2, md: 3 }}>
                <SpeedyAIIcon size={40} />
                <Box>
                  <Text 
                    fontWeight="extrabold" 
                    fontSize={{ base: 'lg', md: 'xl' }}
                    letterSpacing="tight"
                    color="white"
                    textShadow="0 2px 10px rgba(0,0,0,0.2)"
                    fontFamily="'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                  >
                    Speedy AI
                  </Text>
                  <Text fontSize="xs" color="whiteAlpha.900" fontWeight="medium">
                    Get accurate quotes in 2 minutes
                  </Text>
                </Box>
              </HStack>
              <HStack spacing={1}>
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

            {/* Progress Indicator */}
            <Box bg="white" px={4} py={3} borderBottom="1px" borderColor="gray.200">
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                  Step {currentStep} of {totalSteps}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  ~{Math.max(1, totalSteps - currentStep + 1)} min left
                </Text>
              </HStack>
              <Box w="full" h="2" bg="gray.200" borderRadius="full" overflow="hidden">
                <Box 
                  h="full" 
                  bg="blue.500" 
                  borderRadius="full"
                  w={`${(currentStep / totalSteps) * 100}%`}
                  transition="width 0.3s ease"
                />
              </Box>
            </Box>

            {/* Trust Signals */}
            <Box bg="blue.50" px={4} py={2} borderBottom="1px" borderColor="gray.200">
              <HStack spacing={4} fontSize="xs" color="gray.700" justify="center">
                <HStack spacing={1}>
                  <Icon as={FiCheckCircle} color="green.500" />
                  <Text fontWeight="medium">No obligation quote</Text>
                </HStack>
                <HStack spacing={1}>
                  <Text>⭐</Text>
                  <Text fontWeight="medium">4.9/5 (2,400+ reviews)</Text>
                </HStack>
              </HStack>
            </Box>

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
                  >
                    {message.role === 'assistant' && (
                      <Box flexShrink={0} mt={1}>
                        <SpeedyAIIcon size={32} />
                      </Box>
                    )}
                    
                    <Box
                      maxW={{ base: '85%', md: '75%' }}
                      bg={message.role === 'user' ? 'blue.500' : 'white'}
                      color={message.role === 'user' ? 'white' : 'gray.800'}
                      px={{ base: 4, md: 4 }}
                      py={{ base: 3, md: 3 }}
                      borderRadius="xl"
                      shadow="sm"
                      border={message.role === 'user' ? 'none' : '1px'}
                      borderColor="gray.200"
                      fontSize={{ base: 'md', md: 'md' }}
                      fontWeight="normal"
                      whiteSpace="pre-wrap"
                      wordBreak="break-word"
                      lineHeight="1.5"
                      position="relative"
                      sx={{
                        borderBottomLeftRadius: message.role === 'assistant' ? '4px' : undefined,
                        borderBottomRightRadius: message.role === 'user' ? '4px' : undefined,
                      }}
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

                {/* Quick Reply Buttons - Show on first message only */}
                {messages.length === 1 && !isLoading && (
                  <VStack spacing={2} align="stretch" w="full" px={2}>
                    <Text fontSize="xs" color="gray.500" fontWeight="medium" px={2}>
                      Popular UK Cities:
                    </Text>
                    <Flex gap={2} flexWrap="wrap">
                      {['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Bristol'].map((city) => (
                        <Button
                          key={city}
                          size="sm"
                          variant="outline"
                          colorScheme="blue"
                          onClick={() => handleSendMessage(city)}
                          fontSize="sm"
                          fontWeight="medium"
                          borderRadius="full"
                          px={4}
                          _hover={{ bg: 'blue.50', borderColor: 'blue.400' }}
                        >
                          {city}
                        </Button>
                      ))}
                    </Flex>
                  </VStack>
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
                    <>
                      <Button
                        size="sm"
                        colorScheme="green"
                        w="full"
                        onClick={handleProceedToPayment}
                        leftIcon={<Icon as={FiCheckCircle} />}
                        isLoading={isLoading}
                        loadingText="Creating booking..."
                      >
                        Create Booking
                      </Button>
                      {typeof window !== 'undefined' && sessionStorage.getItem('pending_payment_url') && (
                        <Button
                          size="sm"
                          colorScheme="blue"
                          w="full"
                          as="a"
                          href={sessionStorage.getItem('pending_payment_url') || '#'}
                          target="_blank"
                          leftIcon={<Icon as={FiCheckCircle} />}
                        >
                          Complete Payment
                        </Button>
                      )}
                    </>
                  )}
                </VStack>
              </Box>
            )}

            {/* Input */}
            <Box position="relative">
              {/* Expandable Actions Menu */}
              <AnimatePresence>
                {isActionsExpanded && (
                  <MotionBox
                    position="absolute"
                    bottom="calc(100% + 8px)"
                    left={4}
                    bg="white"
                    borderRadius="xl"
                    boxShadow="0 4px 20px rgba(0,0,0,0.15)"
                    border="1px solid"
                    borderColor="gray.200"
                    p={2}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    zIndex={10}
                  >
                    <VStack spacing={1}>
                      <IconButton
                        aria-label="Upload files"
                        icon={<Box as="span" fontSize="xl">📎</Box>}
                        colorScheme="gray"
                        variant="ghost"
                        size="lg"
                        w="full"
                        onClick={() => {
                          onUploadClick();
                          setIsActionsExpanded(false);
                        }}
                        _hover={{ bg: 'gray.100' }}
                        _active={{ transform: 'scale(0.95)' }}
                      />
                      <IconButton
                        aria-label={supportsSpeech ? (isListening ? 'Stop voice input' : 'Start voice input') : 'Voice not supported'}
                        icon={<Box as="span" fontSize="xl">🎤</Box>}
                        colorScheme={isListening ? 'red' : 'gray'}
                        variant={isListening ? 'solid' : 'ghost'}
                        size="lg"
                        w="full"
                        onClick={() => {
                          toggleListening();
                          if (!isListening) setIsActionsExpanded(false);
                        }}
                        _hover={{ bg: isListening ? undefined : 'gray.100' }}
                        _active={{ transform: 'scale(0.95)' }}
                        title={supportsSpeech ? undefined : 'Voice input not supported in this browser'}
                        isDisabled={!supportsSpeech}
                      />
                    </VStack>
                  </MotionBox>
                )}
              </AnimatePresence>

              <Flex 
                p={{ base: 3, md: 4 }} 
                pb={{ base: 'calc(env(safe-area-inset-bottom) + 12px)', md: 4 }}
                bg="white" 
                borderTop="1px" 
                borderColor="gray.200"
                gap={2}
                align="center"
              >
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg,text/plain,application/pdf" multiple onChange={handleFilesSelected} style={{ display: 'none' }} />
                
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer here..."
                  disabled={isLoading}
                  flex={1}
                  fontSize="16px"
                  style={{
                    height: '48px',
                    minHeight: '48px',
                    fontSize: '16px',
                    fontWeight: 400,
                    color: '#000000',
                    backgroundColor: '#F9FAFB',
                    border: '1px solid #D1D5DB',
                    borderRadius: '12px',
                    padding: '0 16px',
                  }}
                  sx={{
                    height: '48px !important',
                    minHeight: '48px !important',
                    fontSize: '16px !important',
                    fontWeight: '400 !important',
                    color: '#000000 !important',
                    backgroundColor: '#F9FAFB !important',
                    border: '1px solid #D1D5DB !important',
                    borderRadius: '12px !important',
                    padding: '0 16px !important',
                    WebkitTextFillColor: '#000000 !important',
                    '&::placeholder': {
                      color: '#9CA3AF !important',
                      fontWeight: '400 !important',
                    },
                    '&:focus': {
                      borderColor: '#3B82F6 !important',
                      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1) !important',
                      backgroundColor: '#FFFFFF !important',
                      outline: 'none !important',
                    },
                    '&:disabled': {
                      opacity: '0.6 !important',
                      cursor: 'not-allowed !important',
                    },
                    '&::selection': {
                      backgroundColor: '#DBEAFE !important',
                      color: '#000000 !important',
                    }
                  }}
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
            </Box>
          </MotionFlex>
        )}
      </AnimatePresence>
    </>
  );
}

