'use client';

import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Icon,
  Progress,
  Badge,
  Select,
  Checkbox,
  CheckboxGroup,
  Alert,
  AlertIcon,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { FiPackage, FiCheckCircle, FiAlertCircle, FiDownload } from 'react-icons/fi';

interface BulkAction {
  id: string;
  type: 'assign' | 'update_status' | 'cancel' | 'export';
  label: string;
  description: string;
  requiresSelection: boolean;
}

const BULK_ACTIONS: BulkAction[] = [
  {
    id: 'assign_drivers',
    type: 'assign',
    label: 'تعيين سائقين تلقائياً',
    description: 'تعيين أفضل السائقين المتاحين للطلبات المحددة',
    requiresSelection: true,
  },
  {
    id: 'update_status',
    type: 'update_status',
    label: 'تحديث حالة الطلبات',
    description: 'تغيير حالة مجموعة من الطلبات دفعة واحدة',
    requiresSelection: true,
  },
  {
    id: 'cancel_multiple',
    type: 'cancel',
    label: 'إلغاء طلبات متعددة',
    description: 'إلغاء مجموعة من الطلبات مع استرداد تلقائي',
    requiresSelection: true,
  },
  {
    id: 'export_data',
    type: 'export',
    label: 'تصدير البيانات',
    description: 'تصدير الطلبات المحددة إلى Excel/CSV',
    requiresSelection: false,
  },
];

interface Order {
  id: string;
  reference: string;
  status: string;
  customerName: string;
  totalPrice: number;
}

interface BulkActionsMiniAppProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onRefresh?: () => void;
}

export function BulkActionsMiniApp({
  isOpen,
  onClose,
  orders,
  onRefresh,
}: BulkActionsMiniAppProps) {
  const [step, setStep] = useState<'select_action' | 'configure' | 'confirm' | 'executing' | 'results'>('select_action');
  const [selectedAction, setSelectedAction] = useState<BulkAction | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [newStatus, setNewStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; failed: number; details: any[] }>({
    success: 0,
    failed: 0,
    details: [],
  });
  const toast = useToast();

  const handleSelectAction = (action: BulkAction) => {
    setSelectedAction(action);
    setStep('configure');
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  };

  const handleExecute = async () => {
    if (!selectedAction) return;

    setStep('executing');
    setProgress(0);

    try {
      let command = '';
      
      switch (selectedAction.type) {
        case 'assign':
          command = `auto assign ${selectedOrders.length} orders`;
          break;
        case 'update_status':
          command = `update status to ${newStatus} for orders ${selectedOrders.join(',')}`;
          break;
        case 'cancel':
          command = `cancel orders ${selectedOrders.join(',')}`;
          break;
        case 'export':
          command = `export orders ${selectedOrders.length > 0 ? selectedOrders.join(',') : 'all'}`;
          break;
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch('/api/admin/ai-assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: command,
          autoExecute: true,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      if (data.success) {
        setResults({
          success: selectedOrders.length,
          failed: 0,
          details: data.results || [],
        });
        
        toast({
          title: 'نجح التنفيذ',
          description: `تم تنفيذ العملية على ${selectedOrders.length} طلب`,
          status: 'success',
          duration: 5000,
        });
        
        if (onRefresh) onRefresh();
      } else {
        setResults({
          success: 0,
          failed: selectedOrders.length,
          details: [{ error: data.message }],
        });
        
        toast({
          title: 'فشل التنفيذ',
          description: data.message,
          status: 'error',
          duration: 5000,
        });
      }

      setStep('results');
    } catch (error) {
      console.error('Bulk action error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل تنفيذ العملية الجماعية',
        status: 'error',
        duration: 5000,
      });
      setStep('configure');
    }
  };

  const handleReset = () => {
    setStep('select_action');
    setSelectedAction(null);
    setSelectedOrders([]);
    setNewStatus('');
    setProgress(0);
    setResults({ success: 0, failed: 0, details: [] });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
      <ModalContent dir="rtl">
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={FiPackage} boxSize={6} color="purple.500" />
            <Text>معالج الإجراءات الجماعية</Text>
          </HStack>
        </ModalHeader>

        <ModalBody>
          {/* Step 1: Select Action */}
          {step === 'select_action' && (
            <VStack spacing={4} align="stretch">
              <Text color="gray.600" fontSize="sm">
                اختر العملية التي تريد تنفيذها على مجموعة من الطلبات
              </Text>

              {BULK_ACTIONS.map(action => (
                <Box
                  key={action.id}
                  p={4}
                  borderWidth="1px"
                  borderRadius="lg"
                  cursor="pointer"
                  _hover={{ bg: 'purple.50', borderColor: 'purple.500' }}
                  onClick={() => handleSelectAction(action)}
                  transition="all 0.2s"
                >
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold">{action.label}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {action.description}
                    </Text>
                    {action.requiresSelection && (
                      <Badge colorScheme="orange" fontSize="xs">
                        يتطلب تحديد الطلبات
                      </Badge>
                    )}
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}

          {/* Step 2: Configure */}
          {step === 'configure' && selectedAction && (
            <VStack spacing={4} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">{selectedAction.label}</Text>
                  <Text fontSize="sm">{selectedAction.description}</Text>
                </Box>
              </Alert>

              {selectedAction.requiresSelection && (
                <>
                  <HStack justify="space-between">
                    <Text fontWeight="bold">تحديد الطلبات:</Text>
                    <Button size="sm" variant="outline" onClick={handleSelectAll}>
                      {selectedOrders.length === orders.length ? 'إلغاء الكل' : 'تحديد الكل'}
                    </Button>
                  </HStack>

                  <Box
                    maxH="300px"
                    overflowY="auto"
                    borderWidth="1px"
                    borderRadius="md"
                    p={3}
                  >
                    <CheckboxGroup value={selectedOrders} onChange={(values) => setSelectedOrders(values as string[])}>
                      <VStack align="stretch" spacing={2}>
                        {orders.map(order => (
                          <Checkbox key={order.id} value={order.id}>
                            <HStack spacing={2}>
                              <Text fontSize="sm">{order.reference}</Text>
                              <Badge colorScheme="blue" fontSize="xs">
                                {order.status}
                              </Badge>
                              <Text fontSize="xs" color="gray.600">
                                {order.totalPrice} ر.س
                              </Text>
                            </HStack>
                          </Checkbox>
                        ))}
                      </VStack>
                    </CheckboxGroup>
                  </Box>

                  <Text fontSize="sm" color="gray.600">
                    تم تحديد {selectedOrders.length} من {orders.length} طلب
                  </Text>
                </>
              )}

              {selectedAction.type === 'update_status' && (
                <Box>
                  <Text mb={2} fontWeight="medium">الحالة الجديدة:</Text>
                  <Select
                    placeholder="اختر الحالة"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    <option value="confirmed">مؤكد</option>
                    <option value="assigned">معين</option>
                    <option value="in_progress">قيد التنفيذ</option>
                    <option value="completed">مكتمل</option>
                    <option value="cancelled">ملغي</option>
                  </Select>
                </Box>
              )}
            </VStack>
          )}

          {/* Step 3: Executing */}
          {step === 'executing' && (
            <VStack spacing={6} py={8}>
              <Icon as={FiPackage} boxSize={16} color="purple.500" />
              <Text fontSize="lg" fontWeight="bold">
                جاري التنفيذ...
              </Text>
              <Box w="full">
                <Progress value={progress} colorScheme="purple" size="lg" hasStripe isAnimated />
                <Text textAlign="center" mt={2} fontSize="sm" color="gray.600">
                  {progress}%
                </Text>
              </Box>
              <Text fontSize="sm" color="gray.600">
                يتم معالجة {selectedOrders.length} طلب
              </Text>
            </VStack>
          )}

          {/* Step 4: Results */}
          {step === 'results' && (
            <VStack spacing={4} align="stretch">
              <Alert
                status={results.failed === 0 ? 'success' : 'warning'}
                borderRadius="md"
              >
                <AlertIcon />
                <Box flex="1">
                  <Text fontWeight="bold">
                    {results.failed === 0 ? 'نجح التنفيذ بالكامل' : 'اكتمل التنفيذ مع بعض الأخطاء'}
                  </Text>
                  <HStack spacing={4} mt={1}>
                    <HStack>
                      <Icon as={FiCheckCircle} color="green.500" />
                      <Text fontSize="sm">نجح: {results.success}</Text>
                    </HStack>
                    {results.failed > 0 && (
                      <HStack>
                        <Icon as={FiAlertCircle} color="red.500" />
                        <Text fontSize="sm">فشل: {results.failed}</Text>
                      </HStack>
                    )}
                  </HStack>
                </Box>
              </Alert>

              <Divider />

              <VStack align="stretch" spacing={2}>
                <Text fontWeight="bold">التفاصيل:</Text>
                <Box
                  maxH="200px"
                  overflowY="auto"
                  bg="gray.50"
                  p={3}
                  borderRadius="md"
                >
                  {results.details.map((detail, index) => (
                    <Text key={index} fontSize="sm" mb={1}>
                      {detail.message || detail.error || JSON.stringify(detail)}
                    </Text>
                  ))}
                </Box>
              </VStack>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            {step === 'select_action' && (
              <Button onClick={onClose}>إغلاق</Button>
            )}

            {step === 'configure' && (
              <>
                <Button variant="ghost" onClick={() => setStep('select_action')}>
                  رجوع
                </Button>
                <Button
                  colorScheme="purple"
                  onClick={handleExecute}
                  isDisabled={
                    selectedAction?.requiresSelection && selectedOrders.length === 0
                  }
                >
                  تنفيذ ({selectedOrders.length} طلب)
                </Button>
              </>
            )}

            {step === 'results' && (
              <>
                <Button onClick={onClose}>إغلاق</Button>
                <Button colorScheme="purple" variant="outline" onClick={handleReset}>
                  عملية جديدة
                </Button>
              </>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
