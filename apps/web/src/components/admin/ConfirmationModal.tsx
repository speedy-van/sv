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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  PinInput,
  PinInputField,
  Badge,
  Box,
  Icon,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { FiAlertTriangle, FiCheckCircle, FiShield } from 'react-icons/fi';

interface ConfirmationStep {
  id: string;
  description: string;
  requiresConfirmation?: boolean;
}

interface ActionPlan {
  id: string;
  goal: string;
  steps: ConfirmationStep[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (otp?: string) => void;
  plan: ActionPlan;
  confirmationType: 'single' | 'dual' | undefined;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  plan,
  confirmationType,
}: ConfirmationModalProps) {
  const [step, setStep] = useState<'review' | 'confirm' | 'otp'>('review');
  const [otp, setOtp] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const toast = useToast();

  const handleFirstConfirm = () => {
    if (confirmationType === 'dual') {
      // For dual confirmation, move to OTP step
      setStep('otp');
    } else {
      // For single confirmation, execute immediately
      handleFinalConfirm();
    }
  };

  const handleFinalConfirm = async () => {
    setIsConfirming(true);

    try {
      // Verify OTP if required
      if (confirmationType === 'dual') {
        if (otp.length !== 6) {
          toast({
            title: 'رمز OTP غير مكتمل',
            description: 'يرجى إدخال رمز التحقق المكون من 6 أرقام',
            status: 'error',
            duration: 3000,
          });
          setIsConfirming(false);
          return;
        }

        // TODO: Verify OTP with backend
        // For now, accept any 6-digit code
        if (!/^\d{6}$/.test(otp)) {
          toast({
            title: 'رمز OTP غير صحيح',
            description: 'يرجى إدخال أرقام فقط',
            status: 'error',
            duration: 3000,
          });
          setIsConfirming(false);
          return;
        }
      }

      onConfirm(otp || undefined);
      
      // Reset state
      setStep('review');
      setOtp('');
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء التأكيد',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const getRiskColor = () => {
    switch (plan.riskLevel) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getRiskIcon = () => {
    switch (plan.riskLevel) {
      case 'high':
        return FiAlertTriangle;
      case 'medium':
        return FiShield;
      case 'low':
        return FiCheckCircle;
      default:
        return FiCheckCircle;
    }
  };

  const getRiskLabel = () => {
    switch (plan.riskLevel) {
      case 'high':
        return 'مخاطر عالية';
      case 'medium':
        return 'مخاطر متوسطة';
      case 'low':
        return 'مخاطر منخفضة';
      default:
        return '';
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      size={step === 'otp' ? 'md' : 'xl'}
      closeOnOverlayClick={false}
    >
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
      <ModalContent dir="rtl">
        <ModalHeader>
          <HStack spacing={3}>
            <Icon 
              as={getRiskIcon()} 
              boxSize={6} 
              color={`${getRiskColor()}.500`} 
            />
            <Text>
              {step === 'review' && 'مراجعة خطة العمل'}
              {step === 'confirm' && 'تأكيد التنفيذ'}
              {step === 'otp' && 'التحقق الأمني'}
            </Text>
          </HStack>
        </ModalHeader>

        <ModalBody>
          {step === 'review' && (
            <VStack spacing={4} align="stretch">
              {/* Risk Alert */}
              <Alert 
                status={
                  plan.riskLevel === 'high' 
                    ? 'error' 
                    : plan.riskLevel === 'medium' 
                    ? 'warning' 
                    : 'info'
                }
                borderRadius="md"
              >
                <AlertIcon />
                <Box flex="1">
                  <AlertTitle>
                    <HStack>
                      <Text>{getRiskLabel()}</Text>
                      <Badge colorScheme={getRiskColor()}>
                        {confirmationType === 'dual' ? 'تأكيد مزدوج' : 'تأكيد واحد'}
                      </Badge>
                    </HStack>
                  </AlertTitle>
                  <AlertDescription>
                    {plan.riskLevel === 'high' && 
                      'هذا الإجراء لا يمكن التراجع عنه ويتطلب تأكيد مزدوج مع رمز OTP'
                    }
                    {plan.riskLevel === 'medium' && 
                      'هذا الإجراء يؤثر على البيانات ويتطلب تأكيد'
                    }
                    {plan.riskLevel === 'low' && 
                      'عملية قراءة فقط - آمنة للتنفيذ'
                    }
                  </AlertDescription>
                </Box>
              </Alert>

              {/* Plan Details */}
              <Box>
                <Text fontWeight="bold" mb={2}>
                  الهدف:
                </Text>
                <Text color="gray.700" bg="gray.50" p={3} borderRadius="md">
                  {plan.goal}
                </Text>
              </Box>

              <Divider />

              {/* Steps */}
              <Box>
                <Text fontWeight="bold" mb={2}>
                  الخطوات ({plan.steps.length}):
                </Text>
                <VStack spacing={2} align="stretch">
                  {plan.steps.map((step, index) => (
                    <HStack 
                      key={step.id} 
                      p={3} 
                      bg="gray.50" 
                      borderRadius="md"
                      spacing={3}
                    >
                      <Box 
                        bg="purple.500" 
                        color="white" 
                        borderRadius="full" 
                        w={6} 
                        h={6} 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="center"
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        {index + 1}
                      </Box>
                      <Text flex={1} fontSize="sm">
                        {step.description}
                      </Text>
                      {step.requiresConfirmation && (
                        <Badge colorScheme="orange" fontSize="xs">
                          يتطلب تأكيد
                        </Badge>
                      )}
                    </HStack>
                  ))}
                </VStack>
              </Box>

              {/* Duration Estimate */}
              <HStack justify="space-between" fontSize="sm" color="gray.600">
                <Text>الوقت المتوقع:</Text>
                <Text fontWeight="medium">
                  ~{plan.estimatedDuration} ثانية
                </Text>
              </HStack>
            </VStack>
          )}

          {step === 'otp' && (
            <VStack spacing={6} py={4}>
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>رمز التحقق مطلوب</AlertTitle>
                  <AlertDescription fontSize="sm">
                    تم إرسال رمز التحقق إلى بريدك الإلكتروني. 
                    يرجى إدخاله للمتابعة.
                  </AlertDescription>
                </Box>
              </Alert>

              <Box textAlign="center">
                <Text mb={4} fontWeight="medium">
                  أدخل رمز التحقق المكون من 6 أرقام
                </Text>
                <HStack justify="center" spacing={2}>
                  <PinInput 
                    value={otp} 
                    onChange={setOtp}
                    size="lg"
                    otp
                  >
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                  </PinInput>
                </HStack>
              </Box>

              <Button 
                variant="link" 
                colorScheme="purple" 
                fontSize="sm"
                onClick={() => {
                  toast({
                    title: 'تم إعادة الإرسال',
                    description: 'تم إرسال رمز جديد إلى بريدك',
                    status: 'success',
                    duration: 3000,
                  });
                }}
              >
                إعادة إرسال الرمز
              </Button>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button 
              variant="ghost" 
              onClick={onClose}
              isDisabled={isConfirming}
            >
              إلغاء
            </Button>
            
            {step === 'review' && (
              <Button 
                colorScheme={getRiskColor()} 
                onClick={handleFirstConfirm}
                isDisabled={isConfirming}
              >
                {confirmationType === 'dual' ? 'متابعة للتحقق' : 'تأكيد التنفيذ'}
              </Button>
            )}
            
            {step === 'otp' && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => setStep('review')}
                  isDisabled={isConfirming}
                >
                  رجوع
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleFinalConfirm}
                  isLoading={isConfirming}
                  loadingText="جاري التنفيذ..."
                  isDisabled={otp.length !== 6}
                >
                  تأكيد نهائي وتنفيذ
                </Button>
              </>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
