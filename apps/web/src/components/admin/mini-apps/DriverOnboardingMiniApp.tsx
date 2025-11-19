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
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Select,
  Progress,
  Alert,
  AlertIcon,
  Badge,
  useToast,
} from '@chakra-ui/react';
import { FiUser, FiTruck, FiFileText, FiCheckCircle } from 'react-icons/fi';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: any;
  fields: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'المعلومات الشخصية',
    description: 'معلومات السائق الأساسية',
    icon: FiUser,
    fields: ['name', 'email', 'phone', 'nationalId'],
  },
  {
    id: 2,
    title: 'معلومات المركبة',
    description: 'تفاصيل المركبة والترخيص',
    icon: FiTruck,
    fields: ['vehicleType', 'plateNumber', 'licenseNumber'],
  },
  {
    id: 3,
    title: 'المستندات',
    description: 'رخصة القيادة والتأمين',
    icon: FiFileText,
    fields: ['driverLicense', 'insurance'],
  },
  {
    id: 4,
    title: 'المراجعة والتأكيد',
    description: 'مراجعة جميع المعلومات',
    icon: FiCheckCircle,
    fields: [],
  },
];

interface DriverData {
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  vehicleType: string;
  plateNumber: string;
  licenseNumber: string;
  driverLicense: string;
  insurance: string;
}

interface DriverOnboardingMiniAppProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (data: DriverData) => void;
}

export function DriverOnboardingMiniApp({
  isOpen,
  onClose,
  onComplete,
}: DriverOnboardingMiniAppProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [driverData, setDriverData] = useState<DriverData>({
    name: '',
    email: '',
    phone: '',
    nationalId: '',
    vehicleType: '',
    plateNumber: '',
    licenseNumber: '',
    driverLicense: '',
    insurance: '',
  });
  const toast = useToast();

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    // Validate current step
    const currentStepData = ONBOARDING_STEPS[currentStep];
    const hasEmptyFields = currentStepData.fields.some(
      field => !driverData[field as keyof DriverData]
    );

    if (hasEmptyFields && currentStep < 3) {
      toast({
        title: 'حقول مطلوبة',
        description: 'يرجى ملء جميع الحقول المطلوبة',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Create user and driver accounts
      const response = await fetch('/api/admin/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: driverData.name,
          email: driverData.email,
          phone: driverData.phone,
          nationalId: driverData.nationalId,
          vehicle: {
            type: driverData.vehicleType,
            plateNumber: driverData.plateNumber,
            licenseNumber: driverData.licenseNumber,
          },
          documents: {
            driverLicense: driverData.driverLicense,
            insurance: driverData.insurance,
          },
        }),
      });

      if (response.ok) {
        toast({
          title: 'تم تسجيل السائق بنجاح',
          description: 'تم إنشاء حساب السائق وإرسال بيانات الدخول إلى بريده',
          status: 'success',
          duration: 5000,
        });

        if (onComplete) {
          onComplete(driverData);
        }

        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'فشل تسجيل السائق');
      }
    } catch (error) {
      console.error('Driver onboarding error:', error);
      toast({
        title: 'خطأ في التسجيل',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل السائق',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof DriverData, value: string) => {
    setDriverData(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    const step = ONBOARDING_STEPS[currentStep];

    switch (step.id) {
      case 1:
        return (
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>الاسم الكامل</FormLabel>
              <Input
                value={driverData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="أحمد محمد"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>البريد الإلكتروني</FormLabel>
              <Input
                type="email"
                value={driverData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="ahmad@example.com"
              />
              <FormHelperText>سيتم إرسال بيانات الدخول لهذا البريد</FormHelperText>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>رقم الجوال</FormLabel>
              <Input
                value={driverData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="05xxxxxxxx"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>رقم الهوية الوطنية</FormLabel>
              <Input
                value={driverData.nationalId}
                onChange={(e) => updateField('nationalId', e.target.value)}
                placeholder="1xxxxxxxxx"
              />
            </FormControl>
          </VStack>
        );

      case 2:
        return (
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>نوع المركبة</FormLabel>
              <Select
                value={driverData.vehicleType}
                onChange={(e) => updateField('vehicleType', e.target.value)}
                placeholder="اختر نوع المركبة"
              >
                <option value="van">فان</option>
                <option value="pickup">بيك اب</option>
                <option value="truck">شاحنة صغيرة</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>رقم اللوحة</FormLabel>
              <Input
                value={driverData.plateNumber}
                onChange={(e) => updateField('plateNumber', e.target.value)}
                placeholder="أ ب ج 1234"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>رقم رخصة التشغيل</FormLabel>
              <Input
                value={driverData.licenseNumber}
                onChange={(e) => updateField('licenseNumber', e.target.value)}
                placeholder="رقم رخصة المركبة"
              />
            </FormControl>
          </VStack>
        );

      case 3:
        return (
          <VStack spacing={4} align="stretch">
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                يمكنك رفع المستندات لاحقاً. سيتم إرسال رابط للسائق لرفع المستندات المطلوبة.
              </Text>
            </Alert>

            <FormControl>
              <FormLabel>رخصة القيادة</FormLabel>
              <Input
                value={driverData.driverLicense}
                onChange={(e) => updateField('driverLicense', e.target.value)}
                placeholder="رقم رخصة القيادة"
              />
            </FormControl>

            <FormControl>
              <FormLabel>التأمين</FormLabel>
              <Input
                value={driverData.insurance}
                onChange={(e) => updateField('insurance', e.target.value)}
                placeholder="رقم وثيقة التأمين"
              />
            </FormControl>
          </VStack>
        );

      case 4:
        return (
          <VStack spacing={4} align="stretch">
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              <Text fontWeight="bold">جاهز للتسجيل!</Text>
            </Alert>

            <Box bg="gray.50" p={4} borderRadius="md">
              <VStack align="stretch" spacing={3}>
                <Box>
                  <Text fontSize="sm" color="gray.600">الاسم:</Text>
                  <Text fontWeight="medium">{driverData.name}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">البريد:</Text>
                  <Text fontWeight="medium">{driverData.email}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">الجوال:</Text>
                  <Text fontWeight="medium">{driverData.phone}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="gray.600">المركبة:</Text>
                  <Text fontWeight="medium">
                    {driverData.vehicleType} - {driverData.plateNumber}
                  </Text>
                </Box>
              </VStack>
            </Box>

            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">
                سيتم إرسال بيانات الدخول والتعليمات إلى البريد الإلكتروني للسائق
              </Text>
            </Alert>
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={false}>
      <ModalOverlay bg="blackAlpha.800" backdropFilter="blur(10px)" />
      <ModalContent dir="rtl">
        <ModalHeader>
          <VStack align="stretch" spacing={2}>
            <HStack spacing={3}>
              <Icon as={FiUser} boxSize={6} color="purple.500" />
              <Text>تسجيل سائق جديد</Text>
            </HStack>
            <Progress value={progress} colorScheme="purple" size="sm" />
          </VStack>
        </ModalHeader>

        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Steps Indicator */}
            <HStack spacing={2} justify="center">
              {ONBOARDING_STEPS.map((step, index) => (
                <Box key={step.id} textAlign="center">
                  <Box
                    w={10}
                    h={10}
                    borderRadius="full"
                    bg={
                      index < currentStep
                        ? 'green.500'
                        : index === currentStep
                        ? 'purple.500'
                        : 'gray.200'
                    }
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mx="auto"
                    mb={1}
                  >
                    <Icon
                      as={step.icon}
                      boxSize={5}
                      color={index <= currentStep ? 'white' : 'gray.500'}
                    />
                  </Box>
                  <Text fontSize="xs" color={index === currentStep ? 'purple.600' : 'gray.600'}>
                    {step.title}
                  </Text>
                </Box>
              ))}
            </HStack>

            {/* Step Content */}
            <Box>
              <VStack align="start" spacing={2} mb={4}>
                <Badge colorScheme="purple">
                  الخطوة {currentStep + 1} من {ONBOARDING_STEPS.length}
                </Badge>
                <Text fontSize="lg" fontWeight="bold">
                  {ONBOARDING_STEPS[currentStep].title}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  {ONBOARDING_STEPS[currentStep].description}
                </Text>
              </VStack>

              {renderStepContent()}
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose} isDisabled={isSubmitting}>
              إلغاء
            </Button>
            
            {currentStep > 0 && (
              <Button onClick={handleBack} isDisabled={isSubmitting}>
                رجوع
              </Button>
            )}

            {currentStep < ONBOARDING_STEPS.length - 1 ? (
              <Button colorScheme="purple" onClick={handleNext}>
                التالي
              </Button>
            ) : (
              <Button
                colorScheme="green"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                loadingText="جاري التسجيل..."
              >
                تسجيل السائق
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
