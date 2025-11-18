'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Input,
  VStack,
  HStack,
  Text,
  Box,
  Icon,
  Badge,
  Spinner,
  useToast,
  Kbd,
} from '@chakra-ui/react';
import { FiCommand, FiSearch, FiZap, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { ConfirmationModal } from './ConfirmationModal';

interface CommandSuggestion {
  id: string;
  text: string;
  description: string;
  category: 'orders' | 'drivers' | 'finance' | 'analytics';
  riskLevel: 'low' | 'medium' | 'high';
  shortcut?: string;
}

interface AICommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMAND_SUGGESTIONS: CommandSuggestion[] = [
  {
    id: 'unassigned_orders',
    text: 'عرض الطلبات غير المعينة',
    description: 'Get all orders without assigned drivers',
    category: 'orders',
    riskLevel: 'low',
  },
  {
    id: 'available_drivers',
    text: 'الحصول على السائقين المتاحين',
    description: 'List all drivers currently available',
    category: 'drivers',
    riskLevel: 'low',
  },
  {
    id: 'daily_summary',
    text: 'ملخص اليوم',
    description: 'Get comprehensive daily operations summary',
    category: 'analytics',
    riskLevel: 'low',
  },
  {
    id: 'revenue_report',
    text: 'تقرير الإيرادات لهذا الشهر',
    description: 'Generate revenue report for current month',
    category: 'finance',
    riskLevel: 'low',
  },
  {
    id: 'kpis',
    text: 'مؤشرات الأداء الرئيسية',
    description: 'View key performance indicators',
    category: 'analytics',
    riskLevel: 'low',
  },
  {
    id: 'driver_performance',
    text: 'تحليل أداء السائقين',
    description: 'Analyze driver performance metrics',
    category: 'drivers',
    riskLevel: 'low',
  },
  {
    id: 'outstanding_payments',
    text: 'المدفوعات المعلقة',
    description: 'Show orders with outstanding payments',
    category: 'finance',
    riskLevel: 'low',
  },
  {
    id: 'order_trends',
    text: 'اتجاهات الطلبات',
    description: 'Analyze order patterns and trends',
    category: 'analytics',
    riskLevel: 'low',
  },
];

export function AICommandPalette({ isOpen, onClose }: AICommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>(COMMAND_SUGGESTIONS);
  const [pendingPlan, setPendingPlan] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Filter suggestions based on query
  useEffect(() => {
    if (query.trim() === '') {
      setSuggestions(COMMAND_SUGGESTIONS);
      setSelectedIndex(0);
      return;
    }

    const filtered = COMMAND_SUGGESTIONS.filter(
      cmd =>
        cmd.text.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description.toLowerCase().includes(query.toLowerCase())
    );

    setSuggestions(filtered);
    setSelectedIndex(0);
  }, [query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[selectedIndex]) {
        executeCommand(suggestions[selectedIndex].text);
      } else if (query.trim()) {
        executeCommand(query);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const executeCommand = async (command: string) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: command,
          autoExecute: false, // Changed to false to always get plan first
        }),
      });

      const data = await response.json();

      if (data.requiresConfirmation) {
        // Show confirmation modal
        setPendingPlan({
          ...data.plan,
          originalCommand: command,
        });
        setShowConfirmation(true);
        setIsLoading(false);
        return;
      }

      if (data.success) {
        toast({
          title: 'نجح التنفيذ',
          description: data.message || data.summary,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Emit custom event with results
        window.dispatchEvent(
          new CustomEvent('ai-command-executed', {
            detail: { command, results: data.results },
          })
        );

        onClose();
      } else {
        toast({
          title: 'فشل التنفيذ',
          description: data.message || 'حدث خطأ أثناء تنفيذ الأمر',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Command execution error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل الاتصال بالخادم',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (otp?: string) => {
    setShowConfirmation(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: pendingPlan.originalCommand,
          autoExecute: true,
          otp,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'نجح التنفيذ',
          description: data.message || data.summary,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        window.dispatchEvent(
          new CustomEvent('ai-command-executed', {
            detail: { command: pendingPlan.originalCommand, results: data.results },
          })
        );

        onClose();
      } else {
        toast({
          title: 'فشل التنفيذ',
          description: data.message || 'حدث خطأ أثناء تنفيذ الأمر',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Command execution error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل الاتصال بالخادم',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      setPendingPlan(null);
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return <Badge colorScheme="red">عالي</Badge>;
      case 'medium':
        return <Badge colorScheme="orange">متوسط</Badge>;
      case 'low':
        return <Badge colorScheme="green">منخفض</Badge>;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'orders':
        return 'blue.500';
      case 'drivers':
        return 'purple.500';
      case 'finance':
        return 'green.500';
      case 'analytics':
        return 'orange.500';
      default:
        return 'gray.500';
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(10px)" />
      <ModalContent
        bg="white"
        borderRadius="xl"
        boxShadow="2xl"
        mt="20vh"
        dir="rtl"
      >
        <ModalBody p={0}>
          <VStack spacing={0} align="stretch">
            {/* Search Input */}
            <HStack
              p={4}
              borderBottom="1px solid"
              borderColor="gray.200"
              spacing={3}
            >
              <Icon as={FiCommand} color="purple.500" boxSize={5} />
              <Input
                ref={inputRef}
                placeholder="اكتب أمرك بلغة طبيعية..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                variant="unstyled"
                fontSize="lg"
                disabled={isLoading}
              />
              {isLoading && <Spinner size="sm" color="purple.500" />}
              <HStack spacing={1}>
                <Kbd>Esc</Kbd>
                <Text fontSize="xs" color="gray.500">
                  إلغاء
                </Text>
              </HStack>
            </HStack>

            {/* Suggestions List */}
            <VStack
              spacing={0}
              align="stretch"
              maxH="60vh"
              overflowY="auto"
              py={2}
            >
              {suggestions.length === 0 && (
                <Box p={8} textAlign="center">
                  <Icon as={FiSearch} boxSize={10} color="gray.400" mb={2} />
                  <Text color="gray.500">
                    {query
                      ? 'لم يتم العثور على نتائج. اضغط Enter لتنفيذ الأمر مباشرة.'
                      : 'ابدأ بكتابة أمرك...'}
                  </Text>
                </Box>
              )}

              {suggestions.map((suggestion, index) => (
                <HStack
                  key={suggestion.id}
                  p={3}
                  px={4}
                  spacing={3}
                  cursor="pointer"
                  bg={index === selectedIndex ? 'purple.50' : 'transparent'}
                  borderRight={
                    index === selectedIndex ? '3px solid' : 'none'
                  }
                  borderColor="purple.500"
                  _hover={{ bg: 'gray.50' }}
                  onClick={() => executeCommand(suggestion.text)}
                  transition="all 0.2s"
                >
                  <Icon
                    as={
                      suggestion.riskLevel === 'high'
                        ? FiAlertTriangle
                        : suggestion.riskLevel === 'medium'
                        ? FiZap
                        : FiCheckCircle
                    }
                    color={getCategoryColor(suggestion.category)}
                    boxSize={5}
                  />
                  <VStack align="start" flex={1} spacing={0}>
                    <Text fontWeight="medium" fontSize="md">
                      {suggestion.text}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {suggestion.description}
                    </Text>
                  </VStack>
                  <HStack spacing={2}>
                    {getRiskBadge(suggestion.riskLevel)}
                    {suggestion.shortcut && <Kbd>{suggestion.shortcut}</Kbd>}
                  </HStack>
                </HStack>
              ))}
            </VStack>

            {/* Footer */}
            <HStack
              p={3}
              px={4}
              borderTop="1px solid"
              borderColor="gray.200"
              justify="space-between"
              bg="gray.50"
              fontSize="xs"
              color="gray.600"
            >
              <HStack spacing={4}>
                <HStack>
                  <Kbd>↑↓</Kbd>
                  <Text>التنقل</Text>
                </HStack>
                <HStack>
                  <Kbd>Enter</Kbd>
                  <Text>تنفيذ</Text>
                </HStack>
              </HStack>
              <Text>
                مدعوم بالذكاء الاصطناعي <Icon as={FiZap} />
              </Text>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>

      {/* Confirmation Modal */}
      {pendingPlan && (
        <ConfirmationModal
          isOpen={showConfirmation}
          onClose={() => {
            setShowConfirmation(false);
            setPendingPlan(null);
          }}
          onConfirm={handleConfirm}
          plan={pendingPlan}
          confirmationType={
            pendingPlan.riskLevel === 'high' ? 'dual' : 'single'
          }
        />
      )}
    </>
  );
}

// Hook to open command palette with Cmd+K or Ctrl+K
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isOpen,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
  };
}
