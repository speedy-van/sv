'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  HStack,
  Icon,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Spinner,
  Text,
  Textarea,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import { FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';

import type { PropertyType } from './PropertyTypeSelector';
import type { RemovalItem } from '@/lib/uk-removal-items-data';

export type AiAddedItemPayload = {
  item: RemovalItem;
  quantity: number;
  room: string;
  size?: string | null;
  itemType?: string;
  source?: string;
};

export type PendingQuestionPayload = {
  id: string;
  question: string;
  field: string;
  itemName: string;
};

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

interface AIItemExtractionAssistantProps {
  propertyType?: PropertyType;
  selectedItems: { id: string; name: string; quantity: number }[];
  onAddItems: (items: AiAddedItemPayload[]) => void;
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_MESSAGE =
  '✨ I can organise everything for you in seconds. Just tell me what you need to move - I can add ANY items, whether from our catalog or custom items you describe!';
const FALLBACK_ASSISTANT_RESPONSE =
  "I've added the items you requested. Tell me if you want to add more, or you can move to the next step.";

// Pulse animation for FAB
const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { box-shadow: 0 0 0 15px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
`;

function uniqueId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function AIItemExtractionAssistant({
  propertyType,
  selectedItems,
  onAddItems,
  isOpen,
  onClose,
}: AIItemExtractionAssistantProps) {
  console.log('🤖 AIItemExtractionAssistant RENDERED', { propertyType, selectedItemsCount: selectedItems.length });
  
  const [messages, setMessages] = useState<Message[]>([{ id: uniqueId(), role: 'assistant', content: INITIAL_MESSAGE }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<PendingQuestionPayload[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();
      if (!input.trim()) return;

      const userMessage: Message = { id: uniqueId(), role: 'user', content: input.trim() };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setInput('');
      setError(null);
      setIsLoading(true);

      try {
        const response = await fetch('/api/booking/ai-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage.content,
            propertyType,
            conversation: nextMessages.map(({ role, content }) => ({ role, content })),
            selectedItems,
          }),
        });

        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'Unable to process your request. Please try again.');
        }

        const added: AiAddedItemPayload[] = payload.data?.addedItems || [];
        if (added.length > 0) {
          onAddItems(added);
        }

        const assistantText = payload.data?.assistantSummary || FALLBACK_ASSISTANT_RESPONSE;

        const assistantMessage: Message = {
          id: uniqueId(),
          role: 'assistant',
          content: assistantText.trim(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setPendingQuestions(payload.data?.pendingQuestions || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [input, messages, onAddItems, propertyType, selectedItems]
  );

  const pendingSummary = useMemo(() => {
    if (pendingQuestions.length === 0) return null;
    return pendingQuestions.map((question) => ({
      id: question.id,
      label: question.itemName,
      text: question.question,
    }));
  }, [pendingQuestions]);

  // Chat content component to avoid duplication
  const ChatContent = () => (
    <VStack align="stretch" spacing={6}>
      {/* Header - only show in modal */}
      <HStack spacing={4} align="center" justify="space-between">
        <HStack spacing={3}>
          <Box
            p={3}
            bgGradient="linear(to-br, green.400, teal.500)"
            borderRadius="xl"
            boxShadow="0 8px 16px rgba(16, 185, 129, 0.4)"
          >
            <Icon as={FaRobot} color="white" boxSize={6} />
          </Box>
          <VStack align="start" spacing={0}>
            <Text 
              fontWeight="800" 
              fontSize="xl"
              bgGradient="linear(to-r, green.300, teal.400)"
              bgClip="text"
              letterSpacing="tight"
            >
              AI Assistant
            </Text>
            <Text fontSize="xs" color="whiteAlpha.700" fontWeight="500">
              Powered by Groq AI
            </Text>
          </VStack>
        </HStack>
        <Badge 
          colorScheme="green" 
          borderRadius="full" 
          px={3} 
          py={1}
          fontSize="xs"
          fontWeight="bold"
          textTransform="uppercase"
        >
          Beta
        </Badge>
      </HStack>

      {/* Initial instruction */}
      <Box
        bg="linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))"
        borderRadius="xl"
        p={4}
        border="1px solid"
        borderColor="green.400"
      >
        <Text fontSize="sm" color="white" fontWeight="500" lineHeight="1.6">
          {INITIAL_MESSAGE}
        </Text>
      </Box>

      {/* Chat Messages */}
      <Box
        ref={scrollRef}
        bg="rgba(0, 0, 0, 0.3)"
        backdropFilter="blur(10px)"
        borderRadius="2xl"
        p={4}
        maxH="350px"
        minH="200px"
        overflowY="auto"
        border="1px solid"
        borderColor="whiteAlpha.200"
        css={{
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(16, 185, 129, 0.5)',
            borderRadius: '10px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'rgba(16, 185, 129, 0.7)',
          },
        }}
      >
        <VStack align="stretch" spacing={3}>
          {messages.slice(1).map((message) => (
            <HStack
              key={message.id}
              align="flex-start"
              spacing={3}
              bg={message.role === 'assistant' 
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))' 
                : 'rgba(255, 255, 255, 0.08)'}
              borderRadius="xl"
              p={4}
              border="1px solid"
              borderColor={message.role === 'assistant' ? 'green.400' : 'whiteAlpha.200'}
              transition="all 0.2s"
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: message.role === 'assistant' 
                  ? '0 8px 16px rgba(16, 185, 129, 0.2)' 
                  : '0 8px 16px rgba(0, 0, 0, 0.2)',
              }}
            >
              <Box
                p={2}
                bg={message.role === 'assistant' ? 'green.500' : 'whiteAlpha.200'}
                borderRadius="lg"
                flexShrink={0}
              >
                <Icon 
                  as={message.role === 'assistant' ? FaRobot : FaUser} 
                  color="white" 
                  boxSize={4}
                />
              </Box>
              <Text 
                fontSize="sm" 
                color="white"
                fontWeight="500"
                lineHeight="1.6"
              >
                {message.content}
              </Text>
            </HStack>
          ))}
          {messages.length === 1 && (
            <Text fontSize="sm" color="whiteAlpha.500" textAlign="center" py={8}>
              Start a conversation by typing what you need to move...
            </Text>
          )}
          {isLoading && (
            <HStack 
              spacing={3} 
              bg="linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))"
              borderRadius="xl" 
              p={4}
              border="1px solid"
              borderColor="green.400"
            >
              <Spinner size="sm" color="green.400" thickness="3px" speed="0.8s" />
              <Text fontSize="sm" color="green.300" fontWeight="600">
                Analyzing your items...
              </Text>
            </HStack>
          )}
        </VStack>
      </Box>

      {/* Pending Questions */}
      {pendingSummary && pendingSummary.length > 0 && (
        <Box 
          bgGradient="linear(to-br, rgba(251, 146, 60, 0.15), rgba(234, 88, 12, 0.1))"
          borderRadius="2xl" 
          p={4} 
          border="2px solid"
          borderColor="orange.400"
        >
          <HStack spacing={2} mb={3}>
            <Icon as={FaRobot} color="orange.300" boxSize={4} />
            <Text fontSize="sm" fontWeight="bold" color="orange.200">
              Need more details:
            </Text>
          </HStack>
          <VStack align="stretch" spacing={2}>
            {pendingSummary.map((question) => (
              <Box 
                key={question.id} 
                bg="rgba(0,0,0,0.2)" 
                borderRadius="lg" 
                p={3}
                border="1px solid"
                borderColor="orange.500"
              >
                <Text color="white" fontWeight="semibold" fontSize="sm" mb={1}>
                  {question.label}
                </Text>
                <Text color="orange.100" fontSize="xs">
                  {question.text}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Alert 
          status="error" 
          borderRadius="xl" 
          variant="left-accent"
          bg="rgba(239, 68, 68, 0.1)"
          border="1px solid"
          borderColor="red.500"
        >
          <AlertIcon />
          <Text fontSize="sm" color="white">{error}</Text>
        </Alert>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit}>
        <VStack spacing={3} align="stretch">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="e.g., 3 seater sofa, king bed, 10 boxes, antique piano, custom furniture..."
            bg="rgba(0, 0, 0, 0.3)"
            backdropFilter="blur(10px)"
            color="white"
            borderColor="green.400"
            borderWidth="2px"
            _placeholder={{ color: 'whiteAlpha.600' }}
            _hover={{ borderColor: 'green.300' }}
            _focus={{ 
              borderColor: 'green.300',
              boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
            }}
            minH={{ base: "100px", md: "90px" }}
            resize="vertical"
            borderRadius="xl"
            fontSize="sm"
            fontWeight="500"
          />
          <Button
            type="submit"
            bgGradient="linear(to-r, green.400, teal.500)"
            color="white"
            isLoading={isLoading}
            leftIcon={<FaPaperPlane />}
            w="full"
            size="lg"
            borderRadius="xl"
            fontWeight="bold"
            boxShadow="0 8px 16px rgba(16, 185, 129, 0.3)"
            _hover={{
              bgGradient: 'linear(to-r, green.500, teal.600)',
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 24px rgba(16, 185, 129, 0.4)',
            }}
            _active={{
              transform: 'translateY(0)',
            }}
            transition="all 0.2s"
          >
            Ask AI
          </Button>
        </VStack>
      </form>
    </VStack>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size={{ base: "full", md: "xl" }}
      motionPreset="slideInBottom"
      scrollBehavior="inside"
    >
      <ModalOverlay 
        bg="blackAlpha.800"
        backdropFilter="blur(10px)"
      />
      <ModalContent
        bgGradient="linear(to-br, gray.900, gray.800)"
        border="2px solid"
        borderColor="green.400"
        borderRadius={{ base: "0", md: "3xl" }}
        mx={{ base: 0, md: 4 }}
        my={{ base: 0, md: 4 }}
        maxH={{ base: "100vh", md: "90vh" }}
        overflow="hidden"
      >
        <ModalCloseButton 
          color="white" 
          size="lg"
          top={4}
          right={4}
          zIndex={10}
          _hover={{ bg: 'whiteAlpha.200' }}
        />
        <ModalBody p={{ base: 4, md: 6 }} pt={{ base: 6, md: 6 }}>
          <ChatContent />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

