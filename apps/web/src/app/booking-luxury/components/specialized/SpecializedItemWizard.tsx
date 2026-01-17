'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Box,
  Badge,
  Icon,
  useToast,
  Spinner,
  Divider,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
} from '@chakra-ui/react';
import { FaCheckCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import {
  SpecializedItemCategory,
  CATEGORY_DISPLAY_NAMES,
  getCategoryIcon,
  type DynamicFormField,
  type SpecializedWorkflow,
  type RequiredEquipmentResult,
  formatCurrency,
  poundsToPence,
  penceToPounds,
} from '@/types/specialized-logistics';

interface SpecializedItemWizardProps {
  isOpen: boolean;
  onClose: () => void;
  bookingItemId: string;
  itemName: string;
  onComplete: (specializedItemData: any) => void;
  preselectedCategory?: SpecializedItemCategory;
}

export default function SpecializedItemWizard({
  isOpen,
  onClose,
  bookingItemId,
  itemName,
  onComplete,
  preselectedCategory,
}: SpecializedItemWizardProps) {
  const [step, setStep] = useState<'category' | 'details' | 'equipment' | 'review'>('category');
  const [category, setCategory] = useState<SpecializedItemCategory | ''>( preselectedCategory || '');
  const [workflow, setWorkflow] = useState<SpecializedWorkflow | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [equipmentInfo, setEquipmentInfo] = useState<RequiredEquipmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  // Fetch workflow when category is selected
  useEffect(() => {
    if (category && step === 'details') {
      fetchWorkflow();
    }
  }, [category, step]);

  // Calculate equipment requirements when form data changes
  useEffect(() => {
    if (category && formData.declaredValue) {
      calculateEquipment();
    }
  }, [category, formData]);

  const fetchWorkflow = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/specialized-items/workflows?category=${category}`);
      const data = await response.json();
      
      if (data.success) {
        setWorkflow(data.workflow);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load workflow configuration',
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
      toast({
        title: 'Error',
        description: 'Network error. Please try again.',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateEquipment = async () => {
    try {
      // This would call an API endpoint, but for now we'll simulate it
      const mockEquipment: RequiredEquipmentResult = {
        required: ['PIANO_DOLLY', 'PIANO_BOARD', 'NON_MARKING_STRAPS'],
        recommended: ['PROTECTIVE_BLANKETS'],
        warnings: ['Heavy piano requires 3-person crew'],
        estimatedCost: 4500, // £45
      };
      setEquipmentInfo(mockEquipment);
    } catch (error) {
      console.error('Error calculating equipment:', error);
    }
  };

  const handleCategorySelect = (selectedCategory: SpecializedItemCategory) => {
    setCategory(selectedCategory);
    setStep('details');
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!workflow) return false;

    workflow.requiredFields.forEach((field: DynamicFormField) => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
      
      if (field.type === 'number' && formData[field.name]) {
        const value = parseFloat(formData[field.name]);
        if (field.min !== undefined && value < field.min) {
          newErrors[field.name] = `Minimum value is ${field.min}`;
        }
        if (field.max !== undefined && value > field.max) {
          newErrors[field.name] = `Maximum value is ${field.max}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 'details') {
      if (!validateForm()) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields correctly',
          status: 'error',
          duration: 3000,
        });
        return;
      }
      setStep('equipment');
    } else if (step === 'equipment') {
      setStep('review');
    }
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('category');
    } else if (step === 'equipment') {
      setStep('details');
    } else if (step === 'review') {
      setStep('equipment');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/specialized-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingItemId,
          category,
          technicalSpecs: formData,
          declaredValue: poundsToPence(parseFloat(formData.declaredValue || '0')),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success!',
          description: 'Specialized item details saved',
          status: 'success',
          duration: 3000,
        });
        onComplete(data.specializedItem);
        onClose();
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save specialized item',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const renderCategorySelection = () => (
    <VStack spacing={4} align="stretch">
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>Specialized Item Detected</AlertTitle>
          <AlertDescription>
            <strong>{itemName}</strong> requires specialized handling. 
            Please select the category that best describes this item.
          </AlertDescription>
        </Box>
      </Alert>

      <VStack spacing={3}>
        {Object.entries(CATEGORY_DISPLAY_NAMES).map(([key, name]) => (
          <Button
            key={key}
            size="lg"
            w="full"
            justifyContent="start"
            leftIcon={<Text fontSize="2xl">{getCategoryIcon(key as SpecializedItemCategory)}</Text>}
            variant={category === key ? 'solid' : 'outline'}
            colorScheme={category === key ? 'blue' : 'gray'}
            onClick={() => handleCategorySelect(key as SpecializedItemCategory)}
            h="auto"
            py={4}
          >
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold">{name}</Text>
            </VStack>
          </Button>
        ))}
      </VStack>
    </VStack>
  );

  const renderDynamicField = (field: DynamicFormField) => {
    const value = formData[field.name];
    const hasError = !!errors[field.name];

    switch (field.type) {
      case 'text':
      case 'currency':
        return (
          <FormControl key={field.name} isRequired={field.required} isInvalid={hasError}>
            <FormLabel>{field.label}</FormLabel>
            <Input
              type={field.type === 'currency' ? 'number' : 'text'}
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              step={field.type === 'currency' ? '0.01' : undefined}
            />
            {field.helpText && (
              <Text fontSize="sm" color="gray.600" mt={1}>{field.helpText}</Text>
            )}
            {hasError && (
              <Text fontSize="sm" color="red.500" mt={1}>{errors[field.name]}</Text>
            )}
          </FormControl>
        );

      case 'number':
        return (
          <FormControl key={field.name} isRequired={field.required} isInvalid={hasError}>
            <FormLabel>{field.label}</FormLabel>
            <NumberInput
              value={value || ''}
              onChange={(valueString) => handleFieldChange(field.name, valueString)}
              min={field.min}
              max={field.max}
            >
              <NumberInputField placeholder={field.placeholder} />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            {field.helpText && (
              <Text fontSize="sm" color="gray.600" mt={1}>{field.helpText}</Text>
            )}
            {hasError && (
              <Text fontSize="sm" color="red.500" mt={1}>{errors[field.name]}</Text>
            )}
          </FormControl>
        );

      case 'select':
        return (
          <FormControl key={field.name} isRequired={field.required} isInvalid={hasError}>
            <FormLabel>{field.label}</FormLabel>
            <Select
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder="Select..."
            >
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            {field.helpText && (
              <Text fontSize="sm" color="gray.600" mt={1}>{field.helpText}</Text>
            )}
            {hasError && (
              <Text fontSize="sm" color="red.500" mt={1}>{errors[field.name]}</Text>
            )}
          </FormControl>
        );

      case 'boolean':
        return (
          <FormControl key={field.name} display="flex" alignItems="center">
            <FormLabel mb={0}>{field.label}</FormLabel>
            <Switch
              isChecked={value || false}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
            />
            {field.helpText && (
              <Text fontSize="sm" color="gray.600" ml={3}>{field.helpText}</Text>
            )}
          </FormControl>
        );

      case 'textarea':
        return (
          <FormControl key={field.name} isRequired={field.required} isInvalid={hasError}>
            <FormLabel>{field.label}</FormLabel>
            <Textarea
              value={value || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              rows={4}
            />
            {field.helpText && (
              <Text fontSize="sm" color="gray.600" mt={1}>{field.helpText}</Text>
            )}
            {hasError && (
              <Text fontSize="sm" color="red.500" mt={1}>{errors[field.name]}</Text>
            )}
          </FormControl>
        );

      default:
        return null;
    }
  };

  const renderDetailsForm = () => {
    if (loading || !workflow) {
      return (
        <Box textAlign="center" py={8}>
          <Spinner size="xl" />
          <Text mt={4}>Loading form...</Text>
        </Box>
      );
    }

    return (
      <VStack spacing={4} align="stretch">
        {workflow.customerGuidance && (
          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertDescription>{workflow.customerGuidance}</AlertDescription>
            </Box>
          </Alert>
        )}

        <VStack spacing={4}>
          {workflow.requiredFields.map(field => renderDynamicField(field))}
        </VStack>
      </VStack>
    );
  };

  const renderEquipmentInfo = () => {
    if (!equipmentInfo) {
      return (
        <Box textAlign="center" py={4}>
          <Spinner />
          <Text mt={2}>Calculating equipment requirements...</Text>
        </Box>
      );
    }

    return (
      <VStack spacing={4} align="stretch">
        <Alert status="success" borderRadius="md">
          <AlertIcon />
          <Box>
            <AlertTitle>Required Equipment</AlertTitle>
            <AlertDescription>
              Our team will use specialized equipment for this move
            </AlertDescription>
          </Box>
        </Alert>

        <Box borderWidth={1} borderRadius="md" p={4}>
          <Text fontWeight="bold" mb={2}>Mandatory Equipment:</Text>
          <VStack align="start" spacing={1}>
            {equipmentInfo.required.map((eq) => (
              <HStack key={eq}>
                <Icon as={FaCheckCircle} color="green.500" />
                <Text>{eq.replace(/_/g, ' ')}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>

        {equipmentInfo.recommended.length > 0 && (
          <Box borderWidth={1} borderRadius="md" p={4} borderColor="blue.200">
            <Text fontWeight="bold" mb={2}>Recommended Equipment:</Text>
            <VStack align="start" spacing={1}>
              {equipmentInfo.recommended.map((eq) => (
                <HStack key={eq}>
                  <Icon as={FaInfoCircle} color="blue.500" />
                  <Text>{eq.replace(/_/g, ' ')}</Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        {equipmentInfo.warnings.length > 0 && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Important Notes:</AlertTitle>
              <VStack align="start" spacing={1} mt={2}>
                {equipmentInfo.warnings.map((warning, idx) => (
                  <Text key={idx} fontSize="sm">• {warning}</Text>
                ))}
              </VStack>
            </Box>
          </Alert>
        )}

        <Box bg="gray.50" p={4} borderRadius="md">
          <HStack justify="space-between">
            <Text fontWeight="bold">Equipment Cost:</Text>
            <Text fontSize="lg" color="blue.600" fontWeight="bold">
              {formatCurrency(equipmentInfo.estimatedCost)}
            </Text>
          </HStack>
          <Text fontSize="sm" color="gray.600" mt={1}>
            Included in specialized service price
          </Text>
        </Box>
      </VStack>
    );
  };

  const renderReview = () => (
    <VStack spacing={4} align="stretch">
      <Alert status="success" borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle>Ready to Save</AlertTitle>
          <AlertDescription>
            Please review your specialized item details below
          </AlertDescription>
        </Box>
      </Alert>

      <Box borderWidth={1} borderRadius="md" p={4}>
        <HStack justify="space-between" mb={3}>
          <Text fontWeight="bold">Category:</Text>
          <Badge colorScheme="purple" fontSize="md">
            {CATEGORY_DISPLAY_NAMES[category as SpecializedItemCategory]}
          </Badge>
        </HStack>

        <Divider my={3} />

        <VStack align="stretch" spacing={2}>
          {Object.entries(formData).map(([key, value]) => (
            <HStack key={key} justify="space-between">
              <Text color="gray.600">
                {workflow?.requiredFields.find(f => f.name === key)?.label || key}:
              </Text>
              <Text fontWeight="medium">
                {key === 'declaredValue' ? `£${value}` : 
                 typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
                 value}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    </VStack>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" closeOnOverlayClick={false}>
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <HStack spacing={2}>
            <Text>{getCategoryIcon(category as SpecializedItemCategory)}</Text>
            <Text>Specialized Item Details</Text>
          </HStack>
          <Text fontSize="sm" fontWeight="normal" color="gray.600" mt={1}>
            Step {step === 'category' ? 1 : step === 'details' ? 2 : step === 'equipment' ? 3 : 4} of 4
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody overflowY="auto" pb={6}>
          {step === 'category' && renderCategorySelection()}
          {step === 'details' && renderDetailsForm()}
          {step === 'equipment' && renderEquipmentInfo()}
          {step === 'review' && renderReview()}
        </ModalBody>

        <ModalFooter borderTopWidth={1}>
          <HStack spacing={3} w="full" justify="space-between">
            <Button
              variant="ghost"
              onClick={step === 'category' ? onClose : handleBack}
              isDisabled={loading}
            >
              {step === 'category' ? 'Cancel' : 'Back'}
            </Button>
            
            {step !== 'review' ? (
              <Button
                colorScheme="blue"
                onClick={handleNext}
                isDisabled={!category || (step === 'details' && !workflow)}
              >
                Next
              </Button>
            ) : (
              <Button
                colorScheme="green"
                onClick={handleSubmit}
                isLoading={loading}
                leftIcon={<Icon as={FaCheckCircle} />}
              >
                Save Specialized Item
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
