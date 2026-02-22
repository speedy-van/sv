'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Card,
  CardBody,
  Grid,
  GridItem,
  Image,
  IconButton,
  chakra,
  shouldForwardProp,
  Badge,
  Alert,
  AlertIcon,
  Progress,
  Divider,
  Select,
  Textarea,
  Checkbox,
  Link,
  useColorModeValue,
  Container,
  Flex,
  Spacer,
  Icon,
  InputGroup,
  InputRightElement,
  FormHelperText,
} from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import {
  FiUpload,
  FiX,
  FiEye,
  FiEyeOff,
  FiMapPin,
  FiUser,
  FiMail,
  FiPhone,
  FiCreditCard,
  FiShield,
  FiFileText,
  FiCamera,
  FiTruck,
  FiCheckCircle,
  FiArrowRight,
  FiArrowLeft,
  FiSmartphone,
  FiDownload,
  FiStar,
} from 'react-icons/fi';
import { FaApple } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    if (typeof prop === 'string') {
      return isValidMotionProp(prop) || shouldForwardProp(prop);
    }
    return true;
  },
});

interface DriverApplication {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  dateOfBirth: string;
  nationalInsuranceNumber: string;

  // Address Information
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  county: string;

  // Driving Information
  drivingLicenseNumber: string;
  drivingLicenseExpiry: string;
  drivingLicenseFront: File | null;
  drivingLicenseBack: File | null;

  // Insurance Information
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiry: string;
  insuranceDocument: File | null;

  // Banking Information
  bankName: string;
  accountHolderName: string;
  sortCode: string;
  accountNumber: string;

  // Right to Work
  rightToWorkShareCode: string;
  rightToWorkDocument: File | null;

  // Additional Information
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;

  // Terms and Conditions
  agreeToTerms: boolean;
  agreeToDataProcessing: boolean;
  agreeToBackgroundCheck: boolean;
}

export default function DriverApplicationPage() {
  const router = useRouter();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  // Force dark theme colors
  const bgColor = '#0A0F1A';
  const cardBg = '#111827';
  const borderColor = '#18233A';
  const inputBg = '#1A202C';

  // Common input styles for white text
  const inputStyles = {
    color: 'white',
    bg: inputBg,
    borderColor: borderColor,
    borderWidth: '2px',
    borderRadius: 'xl',
    _placeholder: { color: 'gray.500' },
    _focus: {
      borderColor: 'neon.400',
      boxShadow: '0 0 0 1px rgba(0,194,255,0.3)',
      bg: '#1E2533',
    },
    _hover: {
      borderColor: 'gray.500',
    },
  };

  const [formData, setFormData] = useState<DriverApplication>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    nationalInsuranceNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    county: '',
    drivingLicenseNumber: '',
    drivingLicenseExpiry: '',
    drivingLicenseFront: null,
    drivingLicenseBack: null,
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceExpiry: '',
    insuranceDocument: null,
    bankName: '',
    accountHolderName: '',
    sortCode: '',
    accountNumber: '',
    rightToWorkShareCode: '',
    rightToWorkDocument: null,
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    agreeToTerms: false,
    agreeToDataProcessing: false,
    agreeToBackgroundCheck: false,
  });

  const steps = [
    {
      number: 1,
      title: 'Personal Information',
      description: 'Basic details and contact information',
      icon: FiUser,
    },
    {
      number: 2,
      title: 'Address & Identity',
      description: 'Address verification and national insurance',
      icon: FiMapPin,
    },
    {
      number: 3,
      title: 'Driving License',
      description: 'Driving license details and photos',
      icon: FiTruck,
    },
    {
      number: 4,
      title: 'Insurance & Banking',
      description: 'Insurance details and bank account information',
      icon: FiCreditCard,
    },
    {
      number: 5,
      title: 'Right to Work',
      description: 'UK work authorization and documents',
      icon: FiShield,
    },
    {
      number: 6,
      title: 'Emergency Contact',
      description: 'Emergency contact information',
      icon: FiPhone,
    },
    {
      number: 7,
      title: 'Terms & Submit',
      description: 'Review and submit application',
      icon: FiCheckCircle,
    },
  ];

  // Address autocomplete functionality
  const handleAddressSearch = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    try {
      // Using UK Postcodes API for address lookup
      const response = await fetch(
        `https://api.postcodes.io/postcodes/${query}/autocomplete`
      );
      const data = await response.json();

      if (data.result) {
        setAddressSuggestions(data.result);
        setShowAddressSuggestions(true);
      }
    } catch (error) {
      console.error('Address lookup error:', error);
    }
  };

  const handleAddressSelect = async (postcode: string) => {
    try {
      const response = await fetch(
        `https://api.postcodes.io/postcodes/${postcode}`
      );
      const data = await response.json();

      if (data.result) {
        setFormData(prev => ({
          ...prev,
          addressLine1: data.result.premises || data.result.street,
          city: data.result.admin_district,
          postcode: data.result.postcode,
          county: data.result.admin_county,
        }));
      }
    } catch (error) {
      console.error('Address details error:', error);
    }

    setShowAddressSuggestions(false);
  };

  const handleFileUpload = (field: keyof DriverApplication, file: File) => {
    // Validate file type and size
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload JPEG, PNG, or PDF files only',
        status: 'error',
      });
      return;
    }

    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: 'Please upload files smaller than 5MB',
        status: 'error',
      });
      return;
    }

    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          formData.password &&
          formData.confirmPassword &&
          formData.phone &&
          formData.dateOfBirth &&
          formData.password === formData.confirmPassword
        );
      case 2:
        return !!(
          formData.addressLine1 &&
          formData.city &&
          formData.postcode &&
          formData.nationalInsuranceNumber
        );
      case 3:
        return !!(
          formData.drivingLicenseNumber &&
          formData.drivingLicenseExpiry &&
          formData.drivingLicenseFront &&
          formData.drivingLicenseBack
        );
      case 4:
        return !!(
          formData.insuranceProvider &&
          formData.insurancePolicyNumber &&
          formData.insuranceExpiry &&
          formData.bankName &&
          formData.sortCode &&
          formData.accountNumber
        );
      case 5:
        return !!(
          formData.rightToWorkShareCode && formData.rightToWorkDocument
        );
      case 6:
        return !!(
          formData.emergencyContactName &&
          formData.emergencyContactPhone &&
          formData.emergencyContactRelationship
        );
      case 7:
        return !!(
          formData.agreeToTerms &&
          formData.agreeToDataProcessing &&
          formData.agreeToBackgroundCheck
        );
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(7)) {
      toast({
        title: 'Please complete all required fields',
        status: 'error',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();

      // Append all form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          formDataToSend.append(key, value);
        } else if (typeof value === 'boolean') {
          formDataToSend.append(key, value.toString());
        } else {
          formDataToSend.append(key, value || '');
        }
      });

      const response = await fetch('/api/driver/applications', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        toast({
          title: 'Application submitted successfully',
          description:
            'We will review your application and contact you within 3-5 business days',
          status: 'success',
          duration: 5000,
        });
        router.push('/driver-application/success');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit application');
      }
    } catch (error) {
      toast({
        title: 'Submission failed',
        description:
          error instanceof Error ? error.message : 'Please try again',
        status: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <VStack spacing={6} align="stretch">
            <HStack spacing={3} mb={4}>
              <Icon as={FiUser} color="neon.500" boxSize={6} />
              <Heading size="lg" color="neon.500">
                Personal Information
              </Heading>
            </HStack>

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl isRequired>
                <FormLabel
                  fontSize="md"
                  fontWeight="semibold"
                  color="white"
                >
                  First Name
                </FormLabel>
                <Input
                  value={formData.firstName}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  placeholder="Enter your first name"
                  size="lg"
                  {...inputStyles}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel
                  fontSize="md"
                  fontWeight="semibold"
                  color="white"
                >
                  Last Name
                </FormLabel>
                <Input
                  value={formData.lastName}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, lastName: e.target.value }))
                  }
                  placeholder="Enter your last name"
                  size="lg"
                  {...inputStyles}
                />
              </FormControl>
            </Grid>

            <FormControl isRequired>
              <FormLabel
                fontSize="md"
                fontWeight="semibold"
                color="white"
              >
                Email Address
              </FormLabel>
              <Input
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData(prev => ({ ...prev, email: e.target.value }))
                }
                placeholder="Enter your email address"
                size="lg"
                {...inputStyles}
              />
            </FormControl>

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl isRequired>
                <FormLabel
                  fontSize="md"
                  fontWeight="semibold"
                  color="white"
                >
                  Password
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    placeholder="Create a password"
                    size="lg"
                    {...inputStyles}
                  />
                  <InputRightElement h="full">
                    <IconButton
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
                      icon={<Icon as={showPassword ? FiEyeOff : FiEye} />}
                      variant="ghost"
                      size="md"
                      onClick={() => setShowPassword(!showPassword)}
                      color="neon.400"
                      _hover={{ bg: 'rgba(0,194,255,0.1)' }}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel
                  fontSize="md"
                  fontWeight="semibold"
                  color="white"
                >
                  Confirm Password
                </FormLabel>
                <InputGroup>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm your password"
                    size="lg"
                    {...inputStyles}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={
                        showConfirmPassword ? 'Hide password' : 'Show password'
                      }
                      icon={
                        <Icon as={showConfirmPassword ? FiEyeOff : FiEye} />
                      }
                      variant="ghost"
                      size="md"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      color="neon.400"
                      _hover={{ bg: 'rgba(0,194,255,0.1)' }}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
            </Grid>

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl isRequired>
                <FormLabel
                  fontSize="md"
                  fontWeight="semibold"
                  color="white"
                >
                  Phone Number
                </FormLabel>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="Enter your phone number"
                  size="lg"
                  {...inputStyles}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel
                  fontSize="md"
                  fontWeight="semibold"
                  color="white"
                >
                  Date of Birth
                </FormLabel>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      dateOfBirth: e.target.value,
                    }))
                  }
                  size="lg"
                  {...inputStyles}
                  sx={{
                    '&::-webkit-calendar-picker-indicator': {
                      filter: 'invert(1)',
                    },
                  }}
                />
              </FormControl>
            </Grid>
          </VStack>
        );

      case 2:
        return (
          <VStack spacing={6} align="stretch">
            <HStack spacing={3} mb={4}>
              <Icon as={FiMapPin} color="neon.500" boxSize={6} />
              <Heading size="lg" color="neon.500">
                Address & Identity
              </Heading>
            </HStack>

            <FormControl isRequired>
              <FormLabel color="white" fontWeight="semibold">National Insurance Number</FormLabel>
              <Input
                value={formData.nationalInsuranceNumber}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    nationalInsuranceNumber: e.target.value,
                  }))
                }
                placeholder="e.g., AB123456C"
                maxLength={9}
                size="lg"
                {...inputStyles}
              />
              <FormHelperText color="gray.500">
                Format: 2 letters, 6 numbers, 1 letter (e.g., AB123456C)
              </FormHelperText>
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="white" fontWeight="semibold">Postcode</FormLabel>
              <Input
                value={formData.postcode}
                onChange={e => {
                  setFormData(prev => ({ ...prev, postcode: e.target.value }));
                  handleAddressSearch(e.target.value);
                }}
                placeholder="Enter your postcode"
                onBlur={() =>
                  setTimeout(() => setShowAddressSuggestions(false), 200)
                }
                size="lg"
                {...inputStyles}
              />
              {showAddressSuggestions && (
                <Box position="relative">
                  <Box
                    position="absolute"
                    top="100%"
                    left={0}
                    width="100%"
                    bg="#18233A"
                    border="1px solid"
                    borderColor="#2A3A5E"
                    borderRadius="xl"
                    boxShadow="0 10px 40px rgba(0,0,0,0.5)"
                    zIndex={10}
                    maxH="200px"
                    overflowY="auto"
                  >
                    {addressSuggestions.map((suggestion, index) => (
                      <Box
                        key={index}
                        px={4}
                        py={3}
                        cursor="pointer"
                        color="white"
                        _hover={{ bg: 'rgba(0,194,255,0.1)' }}
                        onClick={() => handleAddressSelect(suggestion)}
                      >
                        {suggestion}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="white" fontWeight="semibold">Address Line 1</FormLabel>
              <Input
                value={formData.addressLine1}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    addressLine1: e.target.value,
                  }))
                }
                placeholder="House number and street name"
                size="lg"
                {...inputStyles}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="white" fontWeight="semibold">Address Line 2</FormLabel>
              <Input
                value={formData.addressLine2}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    addressLine2: e.target.value,
                  }))
                }
                placeholder="Flat, suite, etc. (optional)"
                size="lg"
                {...inputStyles}
              />
            </FormControl>

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">City</FormLabel>
                <Input
                  value={formData.city}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="Enter your city"
                  size="lg"
                  {...inputStyles}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">County</FormLabel>
                <Input
                  value={formData.county}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, county: e.target.value }))
                  }
                  placeholder="Enter your county"
                  size="lg"
                  {...inputStyles}
                />
              </FormControl>
            </Grid>
          </VStack>
        );

      case 3:
        return (
          <VStack spacing={6} align="stretch">
            <HStack spacing={3} mb={4}>
              <Icon as={FiTruck} color="neon.500" boxSize={6} />
              <Heading size="lg" color="neon.500">
                Driving License
              </Heading>
            </HStack>

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">Driving License Number</FormLabel>
                <Input
                  value={formData.drivingLicenseNumber}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      drivingLicenseNumber: e.target.value,
                    }))
                  }
                  placeholder="Enter your driving license number"
                  size="lg"
                  {...inputStyles}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">Expiry Date</FormLabel>
                <Input
                  type="date"
                  value={formData.drivingLicenseExpiry}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      drivingLicenseExpiry: e.target.value,
                    }))
                  }
                  size="lg"
                  {...inputStyles}
                  sx={{
                    '&::-webkit-calendar-picker-indicator': {
                      filter: 'invert(1)',
                    },
                  }}
                />
              </FormControl>
            </Grid>

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">Driving License Front</FormLabel>
                <Box
                  border="2px dashed"
                  borderColor="neon.400"
                  borderRadius="xl"
                  p={6}
                  textAlign="center"
                  position="relative"
                  bg="rgba(0,194,255,0.05)"
                  _hover={{ borderColor: 'neon.300', bg: 'rgba(0,194,255,0.1)' }}
                  transition="all 0.2s"
                >
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('drivingLicenseFront', file);
                    }}
                    position="absolute"
                    top={0}
                    left={0}
                    width="100%"
                    height="100%"
                    opacity={0}
                    cursor="pointer"
                  />
                  <VStack spacing={3}>
                    <Icon as={FiCamera} boxSize={8} color="neon.400" />
                    <Text fontSize="sm" color="gray.300">
                      Click to upload front of driving license
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      JPEG, PNG, or PDF (max 5MB)
                    </Text>
                  </VStack>
                </Box>
                {formData.drivingLicenseFront && (
                  <HStack mt={3} p={2} bg="rgba(0,209,143,0.1)" borderRadius="lg">
                    <Icon as={FiCheckCircle} color="green.400" />
                    <Text fontSize="sm" color="green.400">
                      {formData.drivingLicenseFront.name}
                    </Text>
                  </HStack>
                )}
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">Driving License Back</FormLabel>
                <Box
                  border="2px dashed"
                  borderColor="neon.400"
                  borderRadius="xl"
                  p={6}
                  textAlign="center"
                  position="relative"
                  bg="rgba(0,194,255,0.05)"
                  _hover={{ borderColor: 'neon.300', bg: 'rgba(0,194,255,0.1)' }}
                  transition="all 0.2s"
                >
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('drivingLicenseBack', file);
                    }}
                    position="absolute"
                    top={0}
                    left={0}
                    width="100%"
                    height="100%"
                    opacity={0}
                    cursor="pointer"
                  />
                  <VStack spacing={3}>
                    <Icon as={FiCamera} boxSize={8} color="neon.400" />
                    <Text fontSize="sm" color="gray.300">
                      Click to upload back of driving license
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      JPEG, PNG, or PDF (max 5MB)
                    </Text>
                  </VStack>
                </Box>
                {formData.drivingLicenseBack && (
                  <HStack mt={3} p={2} bg="rgba(0,209,143,0.1)" borderRadius="lg">
                    <Icon as={FiCheckCircle} color="green.400" />
                    <Text fontSize="sm" color="green.400">
                      {formData.drivingLicenseBack.name}
                    </Text>
                  </HStack>
                )}
              </FormControl>
            </Grid>
          </VStack>
        );

      case 4:
        return (
          <VStack spacing={6} align="stretch">
            <HStack spacing={3} mb={4}>
              <Icon as={FiCreditCard} color="neon.500" boxSize={6} />
              <Heading size="lg" color="neon.500">
                Insurance & Banking
              </Heading>
            </HStack>

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">Insurance Provider</FormLabel>
                <Input
                  value={formData.insuranceProvider}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      insuranceProvider: e.target.value,
                    }))
                  }
                  placeholder="Enter insurance provider name"
                  size="lg"
                  {...inputStyles}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">Policy Number</FormLabel>
                <Input
                  value={formData.insurancePolicyNumber}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      insurancePolicyNumber: e.target.value,
                    }))
                  }
                  placeholder="Enter policy number"
                  size="lg"
                  {...inputStyles}
                />
              </FormControl>
            </Grid>

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">Insurance Expiry Date</FormLabel>
                <Input
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      insuranceExpiry: e.target.value,
                    }))
                  }
                  size="lg"
                  {...inputStyles}
                  sx={{
                    '&::-webkit-calendar-picker-indicator': {
                      filter: 'invert(1)',
                    },
                  }}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">Insurance Document</FormLabel>
                <Box
                  border="2px dashed"
                  borderColor="neon.400"
                  borderRadius="xl"
                  p={6}
                  textAlign="center"
                  position="relative"
                  bg="rgba(0,194,255,0.05)"
                  _hover={{ borderColor: 'neon.300', bg: 'rgba(0,194,255,0.1)' }}
                  transition="all 0.2s"
                >
                  <Input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('insuranceDocument', file);
                    }}
                    position="absolute"
                    top={0}
                    left={0}
                    width="100%"
                    height="100%"
                    opacity={0}
                    cursor="pointer"
                  />
                  <VStack spacing={3}>
                    <Icon as={FiFileText} boxSize={8} color="neon.400" />
                    <Text fontSize="sm" color="gray.300">
                      Upload insurance certificate
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      JPEG, PNG, or PDF (max 5MB)
                    </Text>
                  </VStack>
                </Box>
                {formData.insuranceDocument && (
                  <HStack mt={3} p={2} bg="rgba(0,209,143,0.1)" borderRadius="lg">
                    <Icon as={FiCheckCircle} color="green.400" />
                    <Text fontSize="sm" color="green.400">
                      {formData.insuranceDocument.name}
                    </Text>
                  </HStack>
                )}
              </FormControl>
            </Grid>

            <Divider borderColor="gray.700" />

            <HStack spacing={3}>
              <Icon as={FiCreditCard} color="neon.400" boxSize={5} />
              <Heading size="md" color="white">
                Banking Information
              </Heading>
            </HStack>

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">Bank Name</FormLabel>
                <Input
                  value={formData.bankName}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, bankName: e.target.value }))
                  }
                  placeholder="Enter your bank name"
                  size="lg"
                  {...inputStyles}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">Account Holder Name</FormLabel>
                <Input
                  value={formData.accountHolderName}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      accountHolderName: e.target.value,
                    }))
                  }
                  placeholder="Name on bank account"
                  size="lg"
                  {...inputStyles}
                />
              </FormControl>
            </Grid>

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">Sort Code</FormLabel>
                <Input
                  value={formData.sortCode}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, sortCode: e.target.value }))
                  }
                  placeholder="e.g., 12-34-56"
                  maxLength={8}
                  size="lg"
                  {...inputStyles}
                />
                <FormHelperText color="gray.500">Format: XX-XX-XX</FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">Account Number</FormLabel>
                <Input
                  value={formData.accountNumber}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      accountNumber: e.target.value,
                    }))
                  }
                  placeholder="8-digit account number"
                  maxLength={8}
                  size="lg"
                  {...inputStyles}
                />
              </FormControl>
            </Grid>
          </VStack>
        );

      case 5:
        return (
          <VStack spacing={6} align="stretch">
            <HStack spacing={3} mb={4}>
              <Icon as={FiShield} color="neon.500" boxSize={6} />
              <Heading size="lg" color="neon.500">
                Right to Work
              </Heading>
            </HStack>

            <Alert 
              status="info" 
              bg="rgba(59, 130, 246, 0.1)" 
              borderRadius="xl"
              border="1px solid rgba(59, 130, 246, 0.3)"
            >
              <AlertIcon color="blue.400" />
              <Box>
                <Text fontWeight="bold" color="white">UK Right to Work Verification</Text>
                <Text fontSize="sm" color="gray.400">
                  You must provide proof of your right to work in the UK. This
                  can be done through a share code from the UK government.
                </Text>
              </Box>
            </Alert>

            <FormControl isRequired>
              <FormLabel color="white" fontWeight="semibold">Right to Work Share Code</FormLabel>
              <Input
                value={formData.rightToWorkShareCode}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    rightToWorkShareCode: e.target.value,
                  }))
                }
                placeholder="Enter your 9-character share code"
                maxLength={9}
                size="lg"
                {...inputStyles}
              />
              <FormHelperText color="gray.500">
                Get your share code from{' '}
                <Link
                  href="https://www.gov.uk/prove-right-to-work"
                  isExternal
                  color="neon.400"
                  _hover={{ color: 'neon.300' }}
                >
                  gov.uk/prove-right-to-work
                </Link>
              </FormHelperText>
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="white" fontWeight="semibold">Right to Work Document</FormLabel>
              <Box
                border="2px dashed"
                borderColor="neon.400"
                borderRadius="xl"
                p={6}
                textAlign="center"
                position="relative"
                bg="rgba(0,194,255,0.05)"
                _hover={{ borderColor: 'neon.300', bg: 'rgba(0,194,255,0.1)' }}
                transition="all 0.2s"
              >
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('rightToWorkDocument', file);
                  }}
                  position="absolute"
                  top={0}
                  left={0}
                  width="100%"
                  height="100%"
                  opacity={0}
                  cursor="pointer"
                />
                <VStack spacing={3}>
                  <Icon as={FiShield} boxSize={8} color="neon.400" />
                  <Text fontSize="sm" color="gray.300">
                    Upload right to work document
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    Passport, BRP, or other valid document (max 5MB)
                  </Text>
                </VStack>
              </Box>
              {formData.rightToWorkDocument && (
                <HStack mt={3} p={2} bg="rgba(0,209,143,0.1)" borderRadius="lg">
                  <Icon as={FiCheckCircle} color="green.400" />
                  <Text fontSize="sm" color="green.400">
                    {formData.rightToWorkDocument.name}
                  </Text>
                </HStack>
              )}
            </FormControl>
          </VStack>
        );

      case 6:
        return (
          <VStack spacing={6} align="stretch">
            <HStack spacing={3} mb={4}>
              <Icon as={FiPhone} color="neon.500" boxSize={6} />
              <Heading size="lg" color="neon.500">
                Emergency Contact
              </Heading>
            </HStack>

            <FormControl isRequired>
              <FormLabel color="white" fontWeight="semibold">Emergency Contact Name</FormLabel>
              <Input
                value={formData.emergencyContactName}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    emergencyContactName: e.target.value,
                  }))
                }
                placeholder="Full name of emergency contact"
                size="lg"
                {...inputStyles}
              />
            </FormControl>

            <Grid templateColumns="repeat(2, 1fr)" gap={6}>
              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">Emergency Contact Phone</FormLabel>
                <Input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      emergencyContactPhone: e.target.value,
                    }))
                  }
                  placeholder="Phone number"
                  size="lg"
                  {...inputStyles}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color="white" fontWeight="semibold">Relationship</FormLabel>
                <Select
                  value={formData.emergencyContactRelationship}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      emergencyContactRelationship: e.target.value,
                    }))
                  }
                  placeholder="Select relationship"
                  size="lg"
                  color="white"
                  bg={inputBg}
                  borderColor={borderColor}
                  borderWidth="2px"
                  borderRadius="xl"
                  _focus={{
                    borderColor: 'neon.400',
                    boxShadow: '0 0 0 1px rgba(0,194,255,0.3)',
                  }}
                  _hover={{ borderColor: 'gray.500' }}
                  sx={{
                    option: { bg: '#1A202C', color: 'white' },
                  }}
                >
                  <option value="spouse">Spouse/Partner</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </Select>
              </FormControl>
            </Grid>
          </VStack>
        );

      case 7:
        return (
          <VStack spacing={6} align="stretch">
            <HStack spacing={3} mb={4}>
              <Icon as={FiCheckCircle} color="neon.500" boxSize={6} />
              <Heading size="lg" color="neon.500">
                Terms & Conditions
              </Heading>
            </HStack>

            <Alert 
              status="warning" 
              bg="rgba(245, 158, 11, 0.1)" 
              borderRadius="xl"
              border="1px solid rgba(245, 158, 11, 0.3)"
            >
              <AlertIcon color="yellow.400" />
              <Text color="gray.300">
                Please review all information before submitting. You will not be
                able to edit your application after submission.
              </Text>
            </Alert>

            <Box
              p={6}
              bg="rgba(255,255,255,0.02)"
              border="1px solid"
              borderColor="gray.700"
              borderRadius="xl"
              maxH="300px"
              overflowY="auto"
            >
              <Text fontSize="sm" lineHeight="tall" color="gray.300">
                <Text as="span" fontWeight="bold" color="white">Application Summary:</Text>
                <br /><br />
                <Text as="span" color="gray.500">Name:</Text> {formData.firstName} {formData.lastName}
                <br />
                <Text as="span" color="gray.500">Email:</Text> {formData.email}
                <br />
                <Text as="span" color="gray.500">Phone:</Text> {formData.phone}
                <br />
                <Text as="span" color="gray.500">Address:</Text> {formData.addressLine1}, {formData.city},{' '}
                {formData.postcode}
                <br />
                <Text as="span" color="gray.500">Driving License:</Text> {formData.drivingLicenseNumber}
                <br />
                <Text as="span" color="gray.500">Insurance:</Text> {formData.insuranceProvider}
                <br />
                <Text as="span" color="gray.500">Bank:</Text> {formData.bankName}
                <br />
                <Text as="span" color="gray.500">Emergency Contact:</Text> {formData.emergencyContactName} (
                {formData.emergencyContactRelationship})
              </Text>
            </Box>

            <VStack spacing={4} align="stretch">
              <Checkbox
                isChecked={formData.agreeToTerms}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    agreeToTerms: e.target.checked,
                  }))
                }
                colorScheme="neon"
                size="lg"
              >
                <Text color="gray.300">
                  I agree to the{' '}
                  <Link href="/terms" isExternal color="neon.400" _hover={{ color: 'neon.300' }}>
                    Terms and Conditions
                  </Link>
                </Text>
              </Checkbox>

              <Checkbox
                isChecked={formData.agreeToDataProcessing}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    agreeToDataProcessing: e.target.checked,
                  }))
                }
                colorScheme="neon"
                size="lg"
              >
                <Text color="gray.300">
                  I consent to the processing of my personal data for employment
                  purposes
                </Text>
              </Checkbox>

              <Checkbox
                isChecked={formData.agreeToBackgroundCheck}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    agreeToBackgroundCheck: e.target.checked,
                  }))
                }
                colorScheme="neon"
                size="lg"
              >
                <Text color="gray.300">
                  I authorize Speedy Van to conduct background checks and verify
                  all provided information
                </Text>
              </Checkbox>
            </VStack>

            <Alert 
              status="info" 
              bg="rgba(59, 130, 246, 0.1)" 
              borderRadius="xl"
              border="1px solid rgba(59, 130, 246, 0.3)"
            >
              <AlertIcon color="blue.400" />
              <Text fontSize="sm" color="gray.300">
                After submission, your application will be reviewed by our team.
                You will receive an email confirmation and updates on your
                application status.
              </Text>
            </Alert>
          </VStack>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      minH="100vh"
      bg="#0A0F1A"
      py={{ base: 8, md: 12 }}
      position="relative"
      overflow="hidden"
    >
      {/* Background Pattern */}
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="100%"
        opacity={0.03}
        background="radial-gradient(circle at 20% 80%, rgba(0,194,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,209,143,0.15) 0%, transparent 50%)"
        pointerEvents="none"
      />

      <Container maxW="6xl" position="relative" zIndex={1}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          transition="0.5s ease-out"
        >
          <VStack spacing={{ base: 8, md: 12 }} align="stretch">
            {/* Header */}
            <Box textAlign="center" py={{ base: 6, md: 10 }}>
              <VStack spacing={8}>
                <Box
                  p={8}
                  borderRadius="3xl"
                  bg="linear-gradient(135deg, rgba(0,194,255,0.15), rgba(0,209,143,0.1))"
                  borderWidth="2px"
                  borderColor="neon.400"
                  display="inline-block"
                  position="relative"
                  _before={{
                    content: '""',
                    position: 'absolute',
                    inset: '-2px',
                    borderRadius: '3xl',
                    background: 'linear-gradient(135deg, rgba(0,194,255,0.3), rgba(0,209,143,0.2))',
                    filter: 'blur(20px)',
                    zIndex: -1,
                  }}
                >
                  <Icon as={FiTruck} color="neon.500" boxSize={14} />
                </Box>
                <VStack spacing={4}>
                  <Heading
                    size={{ base: '2xl', md: '3xl' }}
                    bgGradient="linear(to-r, neon.400, #00D18F)"
                    bgClip="text"
                    fontWeight="extrabold"
                    letterSpacing="tight"
                  >
                    Become a Speedy Van Driver
                  </Heading>
                  <Text
                    color="gray.400"
                    fontSize={{ base: 'lg', md: 'xl' }}
                    maxW="2xl"
                    mx="auto"
                    lineHeight="1.8"
                  >
                    Join our elite team of professional drivers and unlock unlimited earning potential with the UK&apos;s fastest-growing delivery platform.
                  </Text>
                </VStack>

                {/* Stats Row */}
                <HStack
                  spacing={{ base: 4, md: 8 }}
                  flexWrap="wrap"
                  justify="center"
                  pt={4}
                >
                  {[
                    { value: '£1,500+', label: 'Weekly Earnings' },
                    { value: '24/7', label: 'Flexible Hours' },
                    { value: '5,000+', label: 'Active Drivers' },
                  ].map((stat, idx) => (
                    <Box
                      key={idx}
                      px={6}
                      py={4}
                      bg="rgba(255,255,255,0.03)"
                      borderRadius="2xl"
                      borderWidth="1px"
                      borderColor="rgba(255,255,255,0.08)"
                    >
                      <Text
                        fontSize={{ base: 'xl', md: '2xl' }}
                        fontWeight="bold"
                        color="neon.400"
                      >
                        {stat.value}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {stat.label}
                      </Text>
                    </Box>
                  ))}
                </HStack>
              </VStack>
            </Box>

            {/* Download Driver App Section */}
            <Box
              p={{ base: 5, md: 8 }}
              bg="linear-gradient(135deg, rgba(0,194,255,0.08), rgba(0,0,0,0.4))"
              borderRadius="3xl"
              borderWidth="2px"
              borderColor="neon.400"
              position="relative"
              overflow="hidden"
            >
              <Grid
                className="download-driver-card"
                templateColumns={{ base: '1fr', md: '1fr auto' }}
                gap={{ base: 5, md: 6 }}
                alignItems="center"
              >
                {/* Left Content */}
                <Grid
                  className="download-driver-card__content"
                  templateColumns={{ base: '1fr', md: 'auto 1fr' }}
                  gap={4}
                  alignItems="center"
                  textAlign={{ base: 'center', md: 'left' }}
                >
                  <Box
                    p={4}
                    bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                    borderRadius="2xl"
                    boxShadow="0 8px 32px rgba(0,194,255,0.3)"
                    justifySelf={{ base: 'center', md: 'start' }}
                  >
                    <Icon as={FiSmartphone} boxSize={{ base: 8, md: 10 }} color="white" />
                  </Box>
                  <Box>
                    <HStack spacing={2} justify={{ base: 'center', md: 'start' }} mb={2}>
                      <Badge
                        colorScheme="green"
                        variant="solid"
                        px={3}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="bold"
                      >
                        NEW
                      </Badge>
                      <Text color="gray.400" fontSize="sm">iOS App Available</Text>
                    </HStack>
                    <Heading size={{ base: 'md', md: 'lg' }} color="white" mb={2}>
                      Download Speedy Van Driver
                    </Heading>
                    <Text color="gray.400" fontSize={{ base: 'sm', md: 'md' }} maxW="md" mb={2}>
                      Get the official driver app to manage jobs, track earnings, and communicate with customers.
                    </Text>
                    <HStack spacing={1} justify={{ base: 'center', md: 'start' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Icon key={star} as={FiStar} color="yellow.400" boxSize={{ base: 3, md: 4 }} fill="yellow.400" />
                      ))}
                      <Text color="gray.500" fontSize={{ base: 'xs', md: 'sm' }} ml={2}>4.9 Rating</Text>
                    </HStack>
                  </Box>
                </Grid>

                {/* App Store Button */}
                <Link
                  className="download-driver-card__cta"
                  href="https://apps.apple.com/gb/app/speedy-van-driver/id6753916830"
                  isExternal
                  _hover={{ textDecoration: 'none' }}
                  width={{ base: '100%', md: 'auto' }}
                >
                  <Button
                    size="lg"
                    bg="black"
                    color="white"
                    leftIcon={<FaApple size={24} />}
                    px={8}
                    py={7}
                    width={{ base: '100%', md: 'auto' }}
                    borderRadius="xl"
                    fontWeight="semibold"
                    fontSize="lg"
                    _hover={{
                      bg: '#18233A',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                    }}
                    _active={{ bg: '#333' }}
                    transition="all 0.3s ease"
                    boxShadow="0 8px 32px rgba(0,0,0,0.3)"
                  >
                    <VStack spacing={0} align="start">
                      <Text fontSize="xs" fontWeight="normal" opacity={0.9}>
                        Download on the
                      </Text>
                      <Text fontSize="xl" fontWeight="bold">
                        App Store
                      </Text>
                    </VStack>
                  </Button>
                </Link>
              </Grid>
            </Box>

            {/* Progress Bar */}
            <Box>
              <HStack justify="space-between" mb={4}>
                <Text fontSize="lg" fontWeight="semibold" color="text.primary">
                  Step {currentStep} of {steps.length}
                </Text>
                <Badge
                  colorScheme="neon"
                  variant="solid"
                  size="lg"
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontSize="md"
                  fontWeight="bold"
                  boxShadow="0 4px 15px rgba(0,194,255,0.3)"
                >
                  {Math.round((currentStep / steps.length) * 100)}% Complete
                </Badge>
              </HStack>
              <Progress
                value={(currentStep / steps.length) * 100}
                colorScheme="neon"
                size="lg"
                borderRadius="full"
                bg="bg.surface"
                sx={{
                  '& > div': {
                    background:
                      'linear-gradient(90deg, #00C2FF 0%, #00D18F 100%)',
                    boxShadow: '0 0 20px rgba(0,194,255,0.4)',
                  },
                }}
              />
            </Box>

            {/* Steps Navigation */}
            <Box overflowX="auto" pb={4}>
              <HStack spacing={4} minW="max-content">
                {steps.map((step, index) => (
                  <Box
                    key={step.number}
                    p={4}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor={
                      currentStep === step.number
                        ? 'neon.400'
                        : 'border.primary'
                    }
                    bg={
                      currentStep === step.number
                        ? 'rgba(0,194,255,0.1)'
                        : 'bg.surface'
                    }
                    cursor={
                      index + 1 < currentStep || validateStep(index + 1)
                        ? 'pointer'
                        : 'default'
                    }
                    onClick={() => {
                      if (index + 1 < currentStep || validateStep(index + 1)) {
                        setCurrentStep(step.number);
                      }
                    }}
                    opacity={
                      index + 1 < currentStep || validateStep(index + 1)
                        ? 1
                        : 0.5
                    }
                    transition="all 0.3s ease"
                    _hover={
                      index + 1 < currentStep || validateStep(index + 1)
                        ? {
                            borderColor: 'neon.400',
                            bg: 'rgba(0,194,255,0.15)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 25px rgba(0,194,255,0.2)',
                          }
                        : {}
                    }
                    minW="200px"
                  >
                    <VStack spacing={3} align="center">
                      <Box
                        p={3}
                        borderRadius="lg"
                        bg={
                          currentStep === step.number ? 'neon.500' : 'gray.500'
                        }
                        color="white"
                        boxSize="50px"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        boxShadow={
                          currentStep === step.number
                            ? '0 4px 15px rgba(0,194,255,0.3)'
                            : 'none'
                        }
                      >
                        <Icon as={step.icon} boxSize={5} />
                      </Box>
                      <VStack spacing={1} align="center">
                        <Text
                          fontWeight="bold"
                          color={
                            currentStep === step.number
                              ? 'neon.500'
                              : 'text.primary'
                          }
                          fontSize="md"
                        >
                          {step.number}. {step.title}
                        </Text>
                        <Text
                          fontSize="sm"
                          color="text.secondary"
                          textAlign="center"
                        >
                          {step.description}
                        </Text>
                      </VStack>
                    </VStack>
                  </Box>
                ))}
              </HStack>
            </Box>

            {/* Step Content */}
            <Card
              bg={cardBg}
              borderWidth="2px"
              borderColor="border.primary"
              borderRadius="2xl"
              boxShadow="xl"
              overflow="hidden"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background:
                  'linear-gradient(135deg, rgba(0,194,255,0.05), rgba(0,209,143,0.05))',
                pointerEvents: 'none',
              }}
            >
              <CardBody p={{ base: 6, md: 8 }} position="relative" zIndex={1}>
                {renderStepContent()}
              </CardBody>
            </Card>

            {/* Navigation Buttons */}
            <HStack justify="space-between" spacing={6}>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                isDisabled={currentStep === 1}
                leftIcon={<Icon as={FiArrowLeft} />}
                borderColor="border.primary"
                color="text.secondary"
                _hover={{
                  borderColor: 'neon.400',
                  color: 'neon.400',
                  bg: 'rgba(0,194,255,0.05)',
                }}
                transition="all 0.2s"
                borderRadius="xl"
                px={8}
                py={6}
              >
                Previous
              </Button>

              <Spacer />

              {currentStep < steps.length ? (
                <Button
                  variant="solid"
                  size="lg"
                  onClick={() => {
                    if (validateStep(currentStep)) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      toast({
                        title: 'Please complete all required fields',
                        status: 'error',
                      });
                    }
                  }}
                  isDisabled={!validateStep(currentStep)}
                  rightIcon={<Icon as={FiArrowRight} />}
                  bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                  color="white"
                  _hover={{
                    bg: 'linear-gradient(135deg, #00D18F, #00C2FF)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,194,255,0.4)',
                  }}
                  _active={{
                    bg: 'linear-gradient(135deg, #00B8E6, #00C2FF)',
                  }}
                  transition="all 0.3s ease"
                  borderRadius="xl"
                  px={8}
                  py={6}
                  fontWeight="bold"
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="solid"
                  size="lg"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  loadingText="Submitting..."
                  isDisabled={!validateStep(currentStep)}
                  rightIcon={<Icon as={FiCheckCircle} />}
                  bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                  color="white"
                  _hover={{
                    bg: 'linear-gradient(135deg, #00D18F, #00C2FF)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,194,255,0.4)',
                  }}
                  _active={{
                    bg: 'linear-gradient(135deg, #00B8E6, #00C2FF)',
                  }}
                  transition="all 0.3s ease"
                  borderRadius="xl"
                  px={8}
                  py={6}
                  fontWeight="bold"
                >
                  Submit Application
                </Button>
              )}
            </HStack>
          </VStack>
        </MotionBox>
      </Container>
    </Box>
  );
}
