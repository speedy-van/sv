'use client';

/**
 * B2B Company Registration Page - Chakra UI Version
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Flex,
  Icon,
  useToast,
  Spinner,
  List,
  ListItem,
  ListIcon,
  Progress,
} from '@chakra-ui/react';
import {
  FaBuilding,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCreditCard,
  FaCheckCircle,
  FaArrowRight,
  FaArrowLeft,
  FaShieldAlt,
  FaKey,
  FaTruck,
} from 'react-icons/fa';

// ============================================================================
// Types
// ============================================================================

interface FormData {
  companyName: string;
  legalName: string;
  registrationNumber: string;
  vatNumber: string;
  industry: string;
  companySize: string;
  website: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactRole: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
  estimatedMonthlyBookings: string;
  primaryUseCase: string;
  additionalNotes: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

const initialFormData: FormData = {
  companyName: '',
  legalName: '',
  registrationNumber: '',
  vatNumber: '',
  industry: '',
  companySize: '',
  website: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  contactRole: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  postcode: '',
  country: 'United Kingdom',
  estimatedMonthlyBookings: '',
  primaryUseCase: '',
  additionalNotes: '',
  acceptTerms: false,
  acceptPrivacy: false,
};

// ============================================================================
// Constants
// ============================================================================

const industries = [
  'E-commerce & Retail',
  'Logistics & Distribution',
  'Manufacturing',
  'Healthcare & Pharmaceuticals',
  'Food & Beverage',
  'Construction',
  'Automotive',
  'Technology',
  'Fashion & Apparel',
  'Furniture & Home',
  'Other',
];

const companySizes = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '500+ employees',
];

const bookingVolumes = [
  '1-50 per month',
  '51-200 per month',
  '201-500 per month',
  '500-1000 per month',
  '1000+ per month',
];

const useCases = [
  'Same-day delivery',
  'Next-day delivery',
  'Scheduled deliveries',
  'Multi-drop routes',
  'Express courier',
  'Large item delivery',
  'Regular supply runs',
  'Other',
];

const steps = [
  { id: 1, title: 'Company', description: 'Business details' },
  { id: 2, title: 'Contact', description: 'Primary contact' },
  { id: 3, title: 'Address', description: 'Billing address' },
  { id: 4, title: 'Requirements', description: 'Your needs' },
  { id: 5, title: 'Review', description: 'Confirm details' },
];

const benefits = [
  {
    icon: FaCreditCard,
    title: 'Credit Terms',
    description: 'Net 30 payment terms with approved credit limit',
    color: 'purple.400',
  },
  {
    icon: FaKey,
    title: 'API Access',
    description: 'Integrate our services directly into your systems',
    color: 'cyan.400',
  },
  {
    icon: FaShieldAlt,
    title: 'Dedicated Support',
    description: 'Priority support with dedicated account manager',
    color: 'green.400',
  },
  {
    icon: FaTruck,
    title: 'Volume Discounts',
    description: 'Better rates based on your booking volume',
    color: 'orange.400',
  },
];

// ============================================================================
// Main Component
// ============================================================================

export default function B2BRegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    switch (step) {
      case 1:
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!formData.legalName.trim()) newErrors.legalName = 'Legal name is required';
        if (!formData.industry) newErrors.industry = 'Please select an industry';
        if (!formData.companySize) newErrors.companySize = 'Please select company size';
        break;
      case 2:
        if (!formData.contactName.trim()) newErrors.contactName = 'Contact name is required';
        if (!formData.contactEmail.trim()) {
          newErrors.contactEmail = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
          newErrors.contactEmail = 'Please enter a valid email';
        }
        if (!formData.contactPhone.trim()) newErrors.contactPhone = 'Phone number is required';
        if (!formData.contactRole.trim()) newErrors.contactRole = 'Role is required';
        break;
      case 3:
        if (!formData.addressLine1.trim()) newErrors.addressLine1 = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required';
        break;
      case 4:
        if (!formData.estimatedMonthlyBookings) newErrors.estimatedMonthlyBookings = 'Please select estimated volume';
        if (!formData.primaryUseCase) newErrors.primaryUseCase = 'Please select primary use case';
        break;
      case 5:
        if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms';
        if (!formData.acceptPrivacy) newErrors.acceptPrivacy = 'You must accept the privacy policy';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/b2b/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        toast({
          title: 'Application Submitted!',
          description: 'Our team will review your application within 1-2 business days.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to submit application',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit application. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Success State
  if (submitted) {
    return (
      <Box minH="100vh" bg="gray.900" py={20}>
        <Container maxW="lg">
          <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
            <CardBody py={12} px={8} textAlign="center">
              <Flex
                w={20}
                h={20}
                align="center"
                justify="center"
                rounded="full"
                bg="green.900"
                mx="auto"
                mb={6}
              >
                <Icon as={FaCheckCircle} boxSize={10} color="green.400" />
              </Flex>
              <Heading size="lg" color="white" mb={3}>
                Application Submitted!
              </Heading>
              <Text color="gray.400" mb={6}>
                Thank you for applying to join our B2B program. Our team will review your application 
                and contact you within 1-2 business days.
              </Text>
              <Box bg="gray.700" rounded="lg" p={4} mb={6}>
                <Text fontWeight="bold" color="white" mb={2}>
                  What happens next?
                </Text>
                <List spacing={2} textAlign="left">
                  <ListItem color="gray.300" display="flex" alignItems="center" gap={2}>
                    <ListIcon as={FaCheckCircle} color="green.400" />
                    We'll verify your business details
                  </ListItem>
                  <ListItem color="gray.300" display="flex" alignItems="center" gap={2}>
                    <ListIcon as={FaCheckCircle} color="green.400" />
                    Set up your credit terms and pricing
                  </ListItem>
                  <ListItem color="gray.300" display="flex" alignItems="center" gap={2}>
                    <ListIcon as={FaCheckCircle} color="green.400" />
                    Create your account and API keys
                  </ListItem>
                  <ListItem color="gray.300" display="flex" alignItems="center" gap={2}>
                    <ListIcon as={FaCheckCircle} color="green.400" />
                    Send you login credentials
                  </ListItem>
                </List>
              </Box>
              <HStack spacing={4} justify="center">
                <Button
                  variant="outline"
                  borderColor="gray.600"
                  color="gray.300"
                  onClick={() => router.push('/')}
                  _hover={{ bg: 'gray.700' }}
                >
                  Return Home
                </Button>
                <Button
                  bgGradient="linear(to-r, blue.500, purple.500)"
                  color="white"
                  onClick={() => router.push('/b2b')}
                  _hover={{ bgGradient: 'linear(to-r, blue.600, purple.600)' }}
                >
                  Learn More About B2B
                </Button>
              </HStack>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="gray.900">
      {/* Header */}
      <Box bg="gray.800" borderBottomWidth="1px" borderColor="gray.700">
        <Container maxW="6xl" py={4}>
          <Flex justify="space-between" align="center">
            <Button
              as={Link}
              href="/b2b"
              variant="ghost"
              color="gray.400"
              leftIcon={<FaArrowLeft />}
              _hover={{ color: 'white', bg: 'gray.700' }}
            >
              Back to B2B
            </Button>
            <HStack>
              <Icon as={FaBuilding} color="blue.400" />
              <Text fontWeight="semibold" color="white">Speedy Van B2B</Text>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="6xl" py={8}>
        <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={8}>
          {/* Form Section */}
          <Box gridColumn={{ base: 'span 1', lg: 'span 2' }}>
            <Card bg="gray.800" borderColor="gray.700" borderWidth="1px">
              <CardHeader>
                <Heading size="lg" color="white">Join Our B2B Program</Heading>
                <Text color="gray.400" mt={2}>Complete the form below to apply for a business account</Text>
              </CardHeader>
              <CardBody>
                {/* Progress Steps */}
                <Box mb={8}>
                  <Progress
                    value={(currentStep / 5) * 100}
                    colorScheme="blue"
                    rounded="full"
                    size="sm"
                    mb={4}
                  />
                  <Flex justify="space-between">
                    {steps.map((step) => (
                      <VStack key={step.id} spacing={1}>
                        <Flex
                          w={10}
                          h={10}
                          align="center"
                          justify="center"
                          rounded="full"
                          fontWeight="semibold"
                          bg={
                            currentStep > step.id
                              ? 'green.500'
                              : currentStep === step.id
                                ? 'blue.500'
                                : 'gray.700'
                          }
                          color="white"
                          transition="all 0.3s"
                        >
                          {currentStep > step.id ? (
                            <Icon as={FaCheckCircle} />
                          ) : (
                            step.id
                          )}
                        </Flex>
                        <Text
                          fontSize="xs"
                          fontWeight="medium"
                          color={currentStep >= step.id ? 'white' : 'gray.500'}
                          display={{ base: 'none', sm: 'block' }}
                        >
                          {step.title}
                        </Text>
                      </VStack>
                    ))}
                  </Flex>
                </Box>

                {/* Step 1: Company Details */}
                {currentStep === 1 && (
                  <VStack spacing={6}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                      <FormControl isInvalid={!!errors.companyName}>
                        <FormLabel color="gray.300">Company Name *</FormLabel>
                        <Input
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          placeholder="Trading name"
                          value={formData.companyName}
                          onChange={(e) => updateField('companyName', e.target.value)}
                          _hover={{ borderColor: 'gray.500' }}
                          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                        />
                        <FormErrorMessage>{errors.companyName}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.legalName}>
                        <FormLabel color="gray.300">Legal Name *</FormLabel>
                        <Input
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          placeholder="Registered company name"
                          value={formData.legalName}
                          onChange={(e) => updateField('legalName', e.target.value)}
                          _hover={{ borderColor: 'gray.500' }}
                          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                        />
                        <FormErrorMessage>{errors.legalName}</FormErrorMessage>
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                      <FormControl>
                        <FormLabel color="gray.300">Company Registration Number</FormLabel>
                        <Input
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          placeholder="e.g., 12345678"
                          value={formData.registrationNumber}
                          onChange={(e) => updateField('registrationNumber', e.target.value)}
                          _hover={{ borderColor: 'gray.500' }}
                          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel color="gray.300">VAT Number</FormLabel>
                        <Input
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          placeholder="e.g., GB123456789"
                          value={formData.vatNumber}
                          onChange={(e) => updateField('vatNumber', e.target.value)}
                          _hover={{ borderColor: 'gray.500' }}
                          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                        />
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                      <FormControl isInvalid={!!errors.industry}>
                        <FormLabel color="gray.300">Industry *</FormLabel>
                        <Select
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          placeholder="Select industry"
                          value={formData.industry}
                          onChange={(e) => updateField('industry', e.target.value)}
                          _hover={{ borderColor: 'gray.500' }}
                        >
                          {industries.map((ind) => (
                            <option key={ind} value={ind} style={{ background: '#2D3748' }}>{ind}</option>
                          ))}
                        </Select>
                        <FormErrorMessage>{errors.industry}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.companySize}>
                        <FormLabel color="gray.300">Company Size *</FormLabel>
                        <Select
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          placeholder="Select size"
                          value={formData.companySize}
                          onChange={(e) => updateField('companySize', e.target.value)}
                          _hover={{ borderColor: 'gray.500' }}
                        >
                          {companySizes.map((size) => (
                            <option key={size} value={size} style={{ background: '#2D3748' }}>{size}</option>
                          ))}
                        </Select>
                        <FormErrorMessage>{errors.companySize}</FormErrorMessage>
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel color="gray.300">Website</FormLabel>
                      <Input
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                        placeholder="https://www.example.com"
                        value={formData.website}
                        onChange={(e) => updateField('website', e.target.value)}
                        _hover={{ borderColor: 'gray.500' }}
                        _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                      />
                    </FormControl>
                  </VStack>
                )}

                {/* Step 2: Contact Details */}
                {currentStep === 2 && (
                  <VStack spacing={6}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                      <FormControl isInvalid={!!errors.contactName}>
                        <FormLabel color="gray.300">Full Name *</FormLabel>
                        <Input
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          placeholder="John Smith"
                          value={formData.contactName}
                          onChange={(e) => updateField('contactName', e.target.value)}
                          _hover={{ borderColor: 'gray.500' }}
                          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                        />
                        <FormErrorMessage>{errors.contactName}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.contactRole}>
                        <FormLabel color="gray.300">Role/Position *</FormLabel>
                        <Input
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          placeholder="e.g., Operations Manager"
                          value={formData.contactRole}
                          onChange={(e) => updateField('contactRole', e.target.value)}
                          _hover={{ borderColor: 'gray.500' }}
                          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                        />
                        <FormErrorMessage>{errors.contactRole}</FormErrorMessage>
                      </FormControl>
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                      <FormControl isInvalid={!!errors.contactEmail}>
                        <FormLabel color="gray.300">Email Address *</FormLabel>
                        <Input
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          type="email"
                          placeholder="john@company.com"
                          value={formData.contactEmail}
                          onChange={(e) => updateField('contactEmail', e.target.value)}
                          _hover={{ borderColor: 'gray.500' }}
                          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                        />
                        <FormErrorMessage>{errors.contactEmail}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.contactPhone}>
                        <FormLabel color="gray.300">Phone Number *</FormLabel>
                        <Input
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          type="tel"
                          placeholder="+44 7700 900000"
                          value={formData.contactPhone}
                          onChange={(e) => updateField('contactPhone', e.target.value)}
                          _hover={{ borderColor: 'gray.500' }}
                          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                        />
                        <FormErrorMessage>{errors.contactPhone}</FormErrorMessage>
                      </FormControl>
                    </SimpleGrid>
                  </VStack>
                )}

                {/* Step 3: Address */}
                {currentStep === 3 && (
                  <VStack spacing={6}>
                    <FormControl isInvalid={!!errors.addressLine1}>
                      <FormLabel color="gray.300">Address Line 1 *</FormLabel>
                      <Input
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                        placeholder="Street address"
                        value={formData.addressLine1}
                        onChange={(e) => updateField('addressLine1', e.target.value)}
                        _hover={{ borderColor: 'gray.500' }}
                        _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                      />
                      <FormErrorMessage>{errors.addressLine1}</FormErrorMessage>
                    </FormControl>

                    <FormControl>
                      <FormLabel color="gray.300">Address Line 2</FormLabel>
                      <Input
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                        placeholder="Apartment, suite, unit, etc."
                        value={formData.addressLine2}
                        onChange={(e) => updateField('addressLine2', e.target.value)}
                        _hover={{ borderColor: 'gray.500' }}
                        _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                      />
                    </FormControl>

                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                      <FormControl isInvalid={!!errors.city}>
                        <FormLabel color="gray.300">City *</FormLabel>
                        <Input
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          placeholder="City"
                          value={formData.city}
                          onChange={(e) => updateField('city', e.target.value)}
                          _hover={{ borderColor: 'gray.500' }}
                          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                        />
                        <FormErrorMessage>{errors.city}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.postcode}>
                        <FormLabel color="gray.300">Postcode *</FormLabel>
                        <Input
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          placeholder="e.g., SW1A 1AA"
                          value={formData.postcode}
                          onChange={(e) => updateField('postcode', e.target.value)}
                          _hover={{ borderColor: 'gray.500' }}
                          _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                        />
                        <FormErrorMessage>{errors.postcode}</FormErrorMessage>
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel color="gray.300">Country</FormLabel>
                      <Input
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                        value={formData.country}
                        isReadOnly
                      />
                    </FormControl>
                  </VStack>
                )}

                {/* Step 4: Requirements */}
                {currentStep === 4 && (
                  <VStack spacing={6}>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                      <FormControl isInvalid={!!errors.estimatedMonthlyBookings}>
                        <FormLabel color="gray.300">Estimated Monthly Bookings *</FormLabel>
                        <Select
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          placeholder="Select volume"
                          value={formData.estimatedMonthlyBookings}
                          onChange={(e) => updateField('estimatedMonthlyBookings', e.target.value)}
                          _hover={{ borderColor: 'gray.500' }}
                        >
                          {bookingVolumes.map((vol) => (
                            <option key={vol} value={vol} style={{ background: '#2D3748' }}>{vol}</option>
                          ))}
                        </Select>
                        <FormErrorMessage>{errors.estimatedMonthlyBookings}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.primaryUseCase}>
                        <FormLabel color="gray.300">Primary Use Case *</FormLabel>
                        <Select
                          bg="gray.700"
                          borderColor="gray.600"
                          color="white"
                          placeholder="Select use case"
                          value={formData.primaryUseCase}
                          onChange={(e) => updateField('primaryUseCase', e.target.value)}
                          _hover={{ borderColor: 'gray.500' }}
                        >
                          {useCases.map((uc) => (
                            <option key={uc} value={uc} style={{ background: '#2D3748' }}>{uc}</option>
                          ))}
                        </Select>
                        <FormErrorMessage>{errors.primaryUseCase}</FormErrorMessage>
                      </FormControl>
                    </SimpleGrid>

                    <FormControl>
                      <FormLabel color="gray.300">Additional Notes</FormLabel>
                      <Textarea
                        bg="gray.700"
                        borderColor="gray.600"
                        color="white"
                        placeholder="Tell us more about your delivery needs..."
                        value={formData.additionalNotes}
                        onChange={(e) => updateField('additionalNotes', e.target.value)}
                        _hover={{ borderColor: 'gray.500' }}
                        _focus={{ borderColor: 'blue.400', boxShadow: '0 0 0 1px #4299E1' }}
                        rows={4}
                      />
                    </FormControl>
                  </VStack>
                )}

                {/* Step 5: Review */}
                {currentStep === 5 && (
                  <VStack spacing={6} align="stretch">
                    <Box>
                      <Heading size="sm" color="white" mb={4}>Company Information</Heading>
                      <SimpleGrid columns={2} spacing={3} bg="gray.700" p={4} rounded="lg">
                        <Text color="gray.400" fontSize="sm">Company Name:</Text>
                        <Text color="white" fontSize="sm">{formData.companyName}</Text>
                        <Text color="gray.400" fontSize="sm">Legal Name:</Text>
                        <Text color="white" fontSize="sm">{formData.legalName}</Text>
                        <Text color="gray.400" fontSize="sm">Industry:</Text>
                        <Text color="white" fontSize="sm">{formData.industry}</Text>
                        <Text color="gray.400" fontSize="sm">Company Size:</Text>
                        <Text color="white" fontSize="sm">{formData.companySize}</Text>
                      </SimpleGrid>
                    </Box>

                    <Box>
                      <Heading size="sm" color="white" mb={4}>Contact Information</Heading>
                      <SimpleGrid columns={2} spacing={3} bg="gray.700" p={4} rounded="lg">
                        <Text color="gray.400" fontSize="sm">Name:</Text>
                        <Text color="white" fontSize="sm">{formData.contactName}</Text>
                        <Text color="gray.400" fontSize="sm">Email:</Text>
                        <Text color="white" fontSize="sm">{formData.contactEmail}</Text>
                        <Text color="gray.400" fontSize="sm">Phone:</Text>
                        <Text color="white" fontSize="sm">{formData.contactPhone}</Text>
                        <Text color="gray.400" fontSize="sm">Role:</Text>
                        <Text color="white" fontSize="sm">{formData.contactRole}</Text>
                      </SimpleGrid>
                    </Box>

                    <Box>
                      <Heading size="sm" color="white" mb={4}>Address</Heading>
                      <Box bg="gray.700" p={4} rounded="lg">
                        <Text color="white" fontSize="sm">{formData.addressLine1}</Text>
                        {formData.addressLine2 && <Text color="white" fontSize="sm">{formData.addressLine2}</Text>}
                        <Text color="white" fontSize="sm">{formData.city}, {formData.postcode}</Text>
                        <Text color="white" fontSize="sm">{formData.country}</Text>
                      </Box>
                    </Box>

                    <Box>
                      <Heading size="sm" color="white" mb={4}>Requirements</Heading>
                      <SimpleGrid columns={2} spacing={3} bg="gray.700" p={4} rounded="lg">
                        <Text color="gray.400" fontSize="sm">Est. Monthly Bookings:</Text>
                        <Text color="white" fontSize="sm">{formData.estimatedMonthlyBookings}</Text>
                        <Text color="gray.400" fontSize="sm">Primary Use Case:</Text>
                        <Text color="white" fontSize="sm">{formData.primaryUseCase}</Text>
                      </SimpleGrid>
                    </Box>

                    <VStack spacing={4} pt={4}>
                      <FormControl isInvalid={!!errors.acceptTerms}>
                        <Checkbox
                          colorScheme="blue"
                          isChecked={formData.acceptTerms}
                          onChange={(e) => updateField('acceptTerms', e.target.checked)}
                        >
                          <Text color="gray.300" fontSize="sm">
                            I accept the Terms and Conditions *
                          </Text>
                        </Checkbox>
                        <FormErrorMessage>{errors.acceptTerms}</FormErrorMessage>
                      </FormControl>

                      <FormControl isInvalid={!!errors.acceptPrivacy}>
                        <Checkbox
                          colorScheme="blue"
                          isChecked={formData.acceptPrivacy}
                          onChange={(e) => updateField('acceptPrivacy', e.target.checked)}
                        >
                          <Text color="gray.300" fontSize="sm">
                            I accept the Privacy Policy *
                          </Text>
                        </Checkbox>
                        <FormErrorMessage>{errors.acceptPrivacy}</FormErrorMessage>
                      </FormControl>
                    </VStack>
                  </VStack>
                )}

                {/* Navigation Buttons */}
                <Flex justify="space-between" mt={8}>
                  <Button
                    variant="outline"
                    borderColor="gray.600"
                    color="gray.300"
                    onClick={handlePrev}
                    isDisabled={currentStep === 1}
                    leftIcon={<FaArrowLeft />}
                    _hover={{ bg: 'gray.700' }}
                  >
                    Previous
                  </Button>

                  {currentStep < 5 ? (
                    <Button
                      bgGradient="linear(to-r, blue.500, purple.500)"
                      color="white"
                      onClick={handleNext}
                      rightIcon={<FaArrowRight />}
                      _hover={{ bgGradient: 'linear(to-r, blue.600, purple.600)' }}
                    >
                      Continue
                    </Button>
                  ) : (
                    <Button
                      bgGradient="linear(to-r, green.400, teal.500)"
                      color="white"
                      onClick={handleSubmit}
                      isLoading={submitting}
                      loadingText="Submitting..."
                      rightIcon={<FaCheckCircle />}
                      _hover={{ bgGradient: 'linear(to-r, green.500, teal.600)' }}
                    >
                      Submit Application
                    </Button>
                  )}
                </Flex>
              </CardBody>
            </Card>
          </Box>

          {/* Sidebar */}
          <Box>
            <Card bg="gray.800" borderColor="gray.700" borderWidth="1px" position="sticky" top={8}>
              <CardHeader>
                <Heading size="md" color="white">Why Join B2B?</Heading>
              </CardHeader>
              <CardBody pt={0}>
                <VStack spacing={4} align="stretch">
                  {benefits.map((benefit, i) => (
                    <HStack key={i} spacing={4}>
                      <Flex
                        w={10}
                        h={10}
                        align="center"
                        justify="center"
                        rounded="lg"
                        bg={`${benefit.color.split('.')[0]}.900`}
                        flexShrink={0}
                      >
                        <Icon as={benefit.icon} color={benefit.color} />
                      </Flex>
                      <Box>
                        <Text fontWeight="medium" color="white" fontSize="sm">
                          {benefit.title}
                        </Text>
                        <Text color="gray.400" fontSize="xs">
                          {benefit.description}
                        </Text>
                      </Box>
                    </HStack>
                  ))}
                </VStack>

                <Box mt={6} p={4} bg="blue.900" rounded="lg" borderWidth="1px" borderColor="blue.700">
                  <Text color="blue.200" fontSize="sm">
                    <strong>Need help?</strong> Contact our sales team:
                  </Text>
                  <VStack mt={2} spacing={1} align="start">
                    <HStack>
                      <Icon as={FaPhone} color="blue.300" boxSize={3} />
                      <Text color="white" fontSize="sm">01202 129746</Text>
                    </HStack>
                    <HStack>
                      <Icon as={FaEnvelope} color="blue.300" boxSize={3} />
                      <Text color="white" fontSize="sm">support@speedy-van.co.uk</Text>
                    </HStack>
                  </VStack>
                </Box>
              </CardBody>
            </Card>
          </Box>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
