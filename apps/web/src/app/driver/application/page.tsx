'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  SimpleGrid,
  Select,
  Image,
  IconButton,
  Divider,
  Badge,
  Progress,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  Stepper,
  useSteps,
  useBreakpointValue,
  Stack,
  Flex,
} from '@chakra-ui/react';
import { FiUpload, FiX, FiCheck, FiUser, FiTruck, FiCreditCard, FiFileText } from 'react-icons/fi';

interface ApplicationData {
  // Personal Information
  fullName: string;
  email: string;
  phone: string;
  address: string;
  postcode: string;
  
  // Documents
  licenseImage: File | null;
  idImage: File | null;
  
  // Vehicle Information
  vehicleMake: string;
  vehicleModel: string;
  vehicleReg: string;
  vehicleType: string;
  vehicleYear: string;
  
  // Bank Account
  accountHolderName: string;
  bankName: string;
  bankSortCode: string;
  bankAccountNumber: string;
  
  // Tax Information
  utr: string;
  vatNumber: string;
}

const initialData: ApplicationData = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  postcode: '',
  licenseImage: null,
  idImage: null,
  vehicleMake: '',
  vehicleModel: '',
  vehicleReg: '',
  vehicleType: '',
  vehicleYear: '',
    accountHolderName: '',
  bankName: '',
  bankSortCode: '',
  bankAccountNumber: '',
  utr: '',
  vatNumber: '',
};

const steps = [
  { title: 'Personal Info', description: 'Basic information', icon: FiUser },
  { title: 'Vehicle Details', description: 'Vehicle information', icon: FiTruck },
  { title: 'Bank Details', description: 'Payment information', icon: FiCreditCard },
  { title: 'Documents', description: 'Upload documents', icon: FiFileText },
  { title: 'Review', description: 'Review & submit', icon: FiCheck },
];

export default function DriverApplicationPage() {
  const [formData, setFormData] = useState<ApplicationData>(initialData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{ [key: string]: string }>({});
  
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { activeStep, setActiveStep } = useSteps({
    index: currentStep,
    count: steps.length,
  });

  const handleInputChange = (field: keyof ApplicationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: 'licenseImage' | 'idImage', file: File) => {
    if (file) {
      // In a real app, you'd upload to a file storage service
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImages(prev => ({ ...prev, [field]: result }));
        setFormData(prev => ({ ...prev, [field]: file }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (field: 'licenseImage' | 'idImage') => {
    setFormData(prev => ({ ...prev, [field]: null }));
    setUploadedImages(prev => {
      const newImages = { ...prev };
      delete newImages[field];
      return newImages;
    });
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setActiveStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setActiveStep(currentStep - 1);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Personal Info
        return !!(formData.fullName && formData.email && formData.phone && formData.address && formData.postcode);
      case 1: // Vehicle Details
        return !!(formData.vehicleMake && formData.vehicleModel && formData.vehicleReg && formData.vehicleType);
      case 2: // Bank Details
        return !!(formData.accountHolderName && formData.bankName && formData.bankSortCode && formData.bankAccountNumber);
      case 3: // Documents
        return !!(formData.licenseImage && formData.idImage);
      case 4: // Review
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Prepare form data for submission
      const submitData = {
        ...formData,
        vehicleInfo: {
          make: formData.vehicleMake,
          model: formData.vehicleModel,
          reg: formData.vehicleReg,
          type: formData.vehicleType,
          year: formData.vehicleYear,
        },
        bankAccount: {
          accountName: formData.accountHolderName,
          bankName: formData.bankName,
          sortCode: formData.bankSortCode,
          accountNumber: formData.bankAccountNumber,
        },
        taxInfo: {
          utr: formData.utr,
          vatNumber: formData.vatNumber,
        },
      };

      const response = await fetch('/api/driver/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      toast({
        title: 'Application Submitted! 🎉',
        description: 'Your driver application has been submitted successfully. We will review it and get back to you soon.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Reset form
      setFormData(initialData);
      setCurrentStep(0);
      setActiveStep(0);
      setUploadedImages({});

    } catch (error) {
      console.error('Driver Application Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: 'Application Submission Failed',
        description: `Failed to submit application: ${errorMessage}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Personal Information
        return (
          <VStack spacing={6} align="stretch">
            <Heading size="md">Personal Information</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Full Name</FormLabel>
                <Input
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email Address</FormLabel>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Phone Number</FormLabel>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Postcode</FormLabel>
                <Input
                  value={formData.postcode}
                  onChange={(e) => handleInputChange('postcode', e.target.value)}
                  placeholder="Enter your postcode"
                />
              </FormControl>
            </SimpleGrid>
            <FormControl isRequired>
              <FormLabel>Address</FormLabel>
              <Textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter your full address"
                rows={3}
              />
            </FormControl>
          </VStack>
        );

      case 1: // Vehicle Details
        return (
          <VStack spacing={6} align="stretch">
            <Heading size="md">Vehicle Information</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Vehicle Make</FormLabel>
                <Input
                  value={formData.vehicleMake}
                  onChange={(e) => handleInputChange('vehicleMake', e.target.value)}
                  placeholder="e.g., Ford, Mercedes"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Vehicle Model</FormLabel>
                <Input
                  value={formData.vehicleModel}
                  onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                  placeholder="e.g., Transit, Sprinter"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Registration Number</FormLabel>
                <Input
                  value={formData.vehicleReg}
                  onChange={(e) => handleInputChange('vehicleReg', e.target.value)}
                  placeholder="e.g., AB12 CDE"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Vehicle Type</FormLabel>
                <Select
                  value={formData.vehicleType}
                  onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                  placeholder="Select vehicle type"
                >
                  <option value="van">Van</option>
                  <option value="truck">Truck</option>
                  <option value="car">Car</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Year</FormLabel>
                <Input
                  value={formData.vehicleYear}
                  onChange={(e) => handleInputChange('vehicleYear', e.target.value)}
                  placeholder="e.g., 2020"
                />
              </FormControl>
            </SimpleGrid>
          </VStack>
        );

      case 2: // Bank Details
        return (
          <VStack spacing={6} align="stretch">
            <Heading size="md">Bank Account Details</Heading>
            <Alert status="info">
              <AlertIcon />
              <Text fontSize="sm">
                Your bank details are encrypted and secure. We use them only for processing your earnings.
              </Text>
            </Alert>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl isRequired>
                <FormLabel>Account Holder Name</FormLabel>
                <Input
                  value={formData.accountHolderName}
                  onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                  placeholder="Name on bank account"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Bank Name</FormLabel>
                <Input
                  value={formData.bankName}
                  onChange={(e) => handleInputChange('bankName', e.target.value)}
                  placeholder="e.g., Barclays, HSBC"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Sort Code</FormLabel>
                <Input
                  value={formData.bankSortCode}
                  onChange={(e) => handleInputChange('bankSortCode', e.target.value)}
                  placeholder="e.g., 12-34-56"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Account Number</FormLabel>
                <Input
                  value={formData.bankAccountNumber}
                  onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                  placeholder="8-digit account number"
                />
              </FormControl>
            </SimpleGrid>
            <Divider />
            <Heading size="sm">Tax Information (Optional)</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel>UTR (Unique Tax Reference)</FormLabel>
                <Input
                  value={formData.utr}
                  onChange={(e) => handleInputChange('utr', e.target.value)}
                  placeholder="10-digit UTR"
                />
              </FormControl>
              <FormControl>
                <FormLabel>VAT Number</FormLabel>
                <Input
                  value={formData.vatNumber}
                  onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                  placeholder="9-digit VAT number"
                />
              </FormControl>
            </SimpleGrid>
          </VStack>
        );

      case 3: // Documents
        return (
          <VStack spacing={6} align="stretch">
            <Heading size="md">Required Documents</Heading>
            <Alert status="warning">
              <AlertIcon />
              <Text fontSize="sm">
                Please upload clear, high-quality images of your documents. All documents must be valid and not expired.
              </Text>
            </Alert>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <Box>
                <FormLabel>Driving License</FormLabel>
                <Box
                  border="2px dashed"
                  borderColor="gray.300"
                  borderRadius="md"
                  p={4}
                  textAlign="center"
                >
                  {uploadedImages.licenseImage ? (
                    <VStack spacing={2}>
                      <Image
                        src={uploadedImages.licenseImage}
                        alt="Driving License"
                        maxH="200px"
                        borderRadius="md"
                      />
                      <HStack>
                        <Badge colorScheme="green">Uploaded</Badge>
                        <IconButton
                          aria-label="Remove image"
                          icon={<FiX />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => removeImage('licenseImage')}
                        />
                      </HStack>
                    </VStack>
                  ) : (
                    <VStack spacing={2}>
                      <FiUpload size={24} />
                      <Text fontSize="sm">Click to upload driving license</Text>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('licenseImage', file);
                        }}
                        display="none"
                        id="license-upload"
                      />
                      <Button
                        as="label"
                        htmlFor="license-upload"
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                      >
                        Choose File
                      </Button>
                    </VStack>
                  )}
                </Box>
              </Box>
              <Box>
                <FormLabel>ID Document (Passport/ID Card)</FormLabel>
                <Box
                  border="2px dashed"
                  borderColor="gray.300"
                  borderRadius="md"
                  p={4}
                  textAlign="center"
                >
                  {uploadedImages.idImage ? (
                    <VStack spacing={2}>
                      <Image
                        src={uploadedImages.idImage}
                        alt="ID Document"
                        maxH="200px"
                        borderRadius="md"
                      />
                      <HStack>
                        <Badge colorScheme="green">Uploaded</Badge>
                        <IconButton
                          aria-label="Remove image"
                          icon={<FiX />}
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          onClick={() => removeImage('idImage')}
                        />
                      </HStack>
                    </VStack>
                  ) : (
                    <VStack spacing={2}>
                      <FiUpload size={24} />
                      <Text fontSize="sm">Click to upload ID document</Text>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload('idImage', file);
                        }}
                        display="none"
                        id="id-upload"
                      />
                      <Button
                        as="label"
                        htmlFor="id-upload"
                        size="sm"
                        colorScheme="blue"
                        variant="outline"
                      >
                        Choose File
                      </Button>
                    </VStack>
                  )}
                </Box>
              </Box>
            </SimpleGrid>
          </VStack>
        );

      case 4: // Review
        return (
          <VStack spacing={6} align="stretch">
            <Heading size="md">Review Your Application</Heading>
            <Text color="gray.600">
              Please review all your information before submitting your application.
            </Text>
            
            <Card>
              <CardHeader>
                <Heading size="sm">Personal Information</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                  <Text><strong>Name:</strong> {formData.fullName}</Text>
                  <Text><strong>Email:</strong> {formData.email}</Text>
                  <Text><strong>Phone:</strong> {formData.phone}</Text>
                  <Text><strong>Postcode:</strong> {formData.postcode}</Text>
                  <Box gridColumn="span 2">
                    <Text><strong>Address:</strong> {formData.address}</Text>
                  </Box>
                </SimpleGrid>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="sm">Vehicle Information</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                  <Text><strong>Make:</strong> {formData.vehicleMake}</Text>
                  <Text><strong>Model:</strong> {formData.vehicleModel}</Text>
                  <Text><strong>Registration:</strong> {formData.vehicleReg}</Text>
                  <Text><strong>Type:</strong> {formData.vehicleType}</Text>
                  {formData.vehicleYear && <Text><strong>Year:</strong> {formData.vehicleYear}</Text>}
                </SimpleGrid>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="sm">Bank Account</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                  <Text><strong>Account Name:</strong> {formData.accountHolderName}</Text>
                  <Text><strong>Bank:</strong> {formData.bankName}</Text>
                  <Text><strong>Sort Code:</strong> {formData.bankSortCode}</Text>
                  <Text><strong>Account Number:</strong> {formData.bankAccountNumber}</Text>
                </SimpleGrid>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <Heading size="sm">Documents</Heading>
              </CardHeader>
              <CardBody>
                <HStack spacing={4}>
                  <VStack>
                    <Text fontSize="sm">Driving License</Text>
                    {uploadedImages.licenseImage ? (
                      <Badge colorScheme="green">Uploaded</Badge>
                    ) : (
                      <Badge colorScheme="red">Missing</Badge>
                    )}
                  </VStack>
                  <VStack>
                    <Text fontSize="sm">ID Document</Text>
                    {uploadedImages.idImage ? (
                      <Badge colorScheme="green">Uploaded</Badge>
                    ) : (
                      <Badge colorScheme="red">Missing</Badge>
                    )}
                  </VStack>
                </HStack>
              </CardBody>
            </Card>
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Container maxW="container.lg" py={{ base: 4, md: 8 }}>
      <VStack spacing={{ base: 6, md: 8 }} align="stretch">
        <Box textAlign="center">
          <Heading size={{ base: "md", md: "lg" }} mb={2}>Become a Speedy Van Driver</Heading>
          <Text color="gray.600" fontSize={{ base: "sm", md: "md" }}>
            Join our team of professional drivers and start earning today
          </Text>
        </Box>

        <Card>
          <CardBody p={{ base: 4, md: 6 }}>
            <Stepper 
              index={activeStep} 
              colorScheme="blue"
              size={{ base: "sm", md: "md" }}
            >
              {steps.map((step, index) => (
                <Step key={index}>
                  <StepIndicator>
                    <StepStatus
                      complete={<StepIcon />}
                      incomplete={<StepNumber />}
                      active={<StepNumber />}
                    />
                  </StepIndicator>
                  <Box flexShrink="0">
                    <StepTitle fontSize={{ base: "sm", md: "md" }}>{step.title}</StepTitle>
                    <StepDescription fontSize={{ base: "xs", md: "sm" }}>{step.description}</StepDescription>
                  </Box>
                </Step>
              ))}
            </Stepper>
          </CardBody>
        </Card>

        <Card>
          <CardBody p={{ base: 4, md: 6 }}>
            {renderStepContent()}
          </CardBody>
        </Card>

        <Stack direction={{ base: "column", md: "row" }} spacing={{ base: 3, md: 4 }} justify="space-between">
          <Button
            onClick={prevStep}
            isDisabled={currentStep === 0}
            variant="outline"
            size={{ base: "md", md: "lg" }}
            width={{ base: "full", md: "auto" }}
          >
            Previous
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              colorScheme="blue"
              isLoading={isSubmitting}
              loadingText="Submitting..."
              isDisabled={!validateStep(currentStep)}
              size={{ base: "md", md: "lg" }}
              width={{ base: "full", md: "auto" }}
            >
              Submit Application
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              colorScheme="blue"
              isDisabled={!validateStep(currentStep)}
              size={{ base: "md", md: "lg" }}
              width={{ base: "full", md: "auto" }}
            >
              Next
            </Button>
            )}
          </Stack>
      </VStack>
    </Container>
  );
}