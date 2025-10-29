'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Button,
  Checkbox,
  useToast,
  FormErrorMessage,
  Icon,
  HStack,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { FiUpload, FiCheckCircle, FiBriefcase } from 'react-icons/fi';

const POSITIONS = [
  'Customer Support',
  'Customer Service',
  'Operations Assistant',
  'Dispatcher',
  'Marketing Specialist',
  'Admin Staff',
  'Accounts Assistant',
  'HR Assistant',
];

export default function CareersPage() {
  // Add viewport meta tag for mobile optimization
  useEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }
  }, []);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    coverLetter: '',
    cvFile: null as File | null,
    confirmAccurate: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toast = useToast();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName || formData.fullName.length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone || formData.phone.length < 10) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.position) {
      newErrors.position = 'Please select a position';
    }

    if (!formData.coverLetter || formData.coverLetter.length < 50) {
      newErrors.coverLetter = 'Cover letter must be at least 50 characters';
    }

    if (!formData.cvFile) {
      newErrors.cvFile = 'Please upload your CV';
    } else if (formData.cvFile.type !== 'application/pdf') {
      newErrors.cvFile = 'CV must be a PDF file';
    } else if (formData.cvFile.size > 5 * 1024 * 1024) {
      newErrors.cvFile = 'CV must be less than 5MB';
    }

    if (!formData.confirmAccurate) {
      newErrors.confirmAccurate = 'Please confirm that the information is accurate';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, cvFile: file });
      setErrors({ ...errors, cvFile: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert CV to base64
      const reader = new FileReader();
      reader.readAsDataURL(formData.cvFile!);

      reader.onload = async () => {
        const cvBase64 = reader.result as string;

        const response = await fetch('/api/careers/apply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            position: formData.position,
            coverLetter: formData.coverLetter,
            cvFile: cvBase64,
            cvFileName: formData.cvFile!.name,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setSubmitted(true);
          toast({
            title: 'Application Submitted!',
            description: 'We will review your application and get back to you soon.',
            status: 'success',
            duration: 7000,
          });
        } else {
          throw new Error(data.error || 'Failed to submit application');
        }
      };

      reader.onerror = () => {
        throw new Error('Failed to read CV file');
      };
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Something went wrong. Please try again.',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Box bg="bg.surface" minH="100vh" py={{ base: 8, md: 20 }}>
        <Container maxW="container.md" px={{ base: 4, md: 6 }}>
          <Card bg="bg.surface" border="1px solid" borderColor="border.primary">
            <CardBody textAlign="center" py={{ base: 8, md: 16 }} px={{ base: 4, md: 6 }}>
              <Icon as={FiCheckCircle} boxSize={{ base: 12, md: 16 }} color="green.400" mb={4} />
              <Heading size={{ base: "md", md: "lg" }} mb={4} color="text.primary">
                Application Submitted Successfully!
              </Heading>
              <Text color="text.secondary" mb={6} fontSize={{ base: "sm", md: "md" }}>
                Thank you for applying to join our team. We have received your application
                and will review it carefully. You should receive a confirmation email shortly.
              </Text>
              <Text color="text.secondary" mb={6} fontSize={{ base: "sm", md: "md" }}>
                Our HR team will get back to you within 5-7 business days.
              </Text>
              <Button
                colorScheme="blue"
                onClick={() => (window.location.href = '/')}
                size={{ base: "md", md: "lg" }}
                fontSize={{ base: "sm", md: "md" }}
                py={{ base: 6, md: 8 }}
              >
                Return to Homepage
              </Button>
            </CardBody>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box bg="bg.surface" minH="100vh" py={{ base: 8, md: 20 }}>
      <Container maxW="container.lg" px={{ base: 4, md: 6 }}>
        {/* Header Section */}
        <VStack spacing={{ base: 3, md: 4 }} mb={{ base: 8, md: 12 }} textAlign="center">
          <Icon as={FiBriefcase} boxSize={{ base: 8, md: 12 }} color="neon.500" />
          <Heading size={{ base: "xl", md: "2xl" }} color="text.primary">
            Join Our Team
          </Heading>
          <Text fontSize={{ base: "md", md: "lg" }} color="text.secondary" maxW="2xl">
            We're always looking for talented individuals to join the Speedy Van family.
            If you're passionate about logistics, customer service, and making a difference,
            we'd love to hear from you!
          </Text>
        </VStack>

        {/* Application Form */}
        <Card bg="bg.surface" border="1px solid" borderColor="border.primary">
          <CardBody p={{ base: 4, md: 6 }}>
            <form onSubmit={handleSubmit}>
              <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                <Heading size={{ base: "sm", md: "md" }} color="text.primary">
                  Application Form
                </Heading>

                {/* Full Name */}
                <FormControl isInvalid={!!errors.fullName} isRequired>
                  <FormLabel color="text.primary" fontSize={{ base: "sm", md: "md" }}>Full Name</FormLabel>
                  <Input
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="John Smith"
                    bg="whiteAlpha.50"
                    color="text.primary"
                    borderColor="border.primary"
                    _placeholder={{ color: 'text.tertiary' }}
                    size={{ base: "md", md: "md" }}
                    fontSize={{ base: "md", md: "md" }}
                    minH={{ base: "44px", md: "40px" }}
                  />
                  <FormErrorMessage fontSize={{ base: "xs", md: "sm" }}>{errors.fullName}</FormErrorMessage>
                </FormControl>

                {/* Email */}
                <FormControl isInvalid={!!errors.email} isRequired>
                  <FormLabel color="text.primary" fontSize={{ base: "sm", md: "md" }}>Email Address</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="john.smith@example.com"
                    bg="whiteAlpha.50"
                    color="text.primary"
                    borderColor="border.primary"
                    _placeholder={{ color: 'text.tertiary' }}
                    size={{ base: "md", md: "md" }}
                    fontSize={{ base: "md", md: "md" }}
                    minH={{ base: "44px", md: "40px" }}
                  />
                  <FormErrorMessage fontSize={{ base: "xs", md: "sm" }}>{errors.email}</FormErrorMessage>
                </FormControl>

                {/* Phone */}
                <FormControl isInvalid={!!errors.phone} isRequired>
                  <FormLabel color="text.primary" fontSize={{ base: "sm", md: "md" }}>Phone Number</FormLabel>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="07901234567"
                    bg="whiteAlpha.50"
                    color="text.primary"
                    borderColor="border.primary"
                    _placeholder={{ color: 'text.tertiary' }}
                    size={{ base: "md", md: "md" }}
                    fontSize={{ base: "md", md: "md" }}
                    minH={{ base: "44px", md: "40px" }}
                  />
                  <FormErrorMessage fontSize={{ base: "xs", md: "sm" }}>{errors.phone}</FormErrorMessage>
                </FormControl>

                {/* Position */}
                <FormControl isInvalid={!!errors.position} isRequired>
                  <FormLabel color="text.primary" fontSize={{ base: "sm", md: "md" }}>Position Applying For</FormLabel>
                  <Select
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    placeholder="Select a position"
                    bg="whiteAlpha.50"
                    color="text.primary"
                    borderColor="border.primary"
                    size={{ base: "md", md: "md" }}
                    fontSize={{ base: "md", md: "md" }}
                    minH={{ base: "44px", md: "40px" }}
                    sx={{
                      option: {
                        bg: 'gray.800',
                        color: 'white',
                      }
                    }}
                  >
                    {POSITIONS.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage fontSize={{ base: "xs", md: "sm" }}>{errors.position}</FormErrorMessage>
                </FormControl>

                {/* CV Upload */}
                <FormControl isInvalid={!!errors.cvFile} isRequired>
                  <FormLabel color="text.primary" fontSize={{ base: "sm", md: "md" }}>Upload CV (PDF only, max 5MB)</FormLabel>
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    display="none"
                    id="cv-upload"
                  />
                  <Button
                    as="label"
                    htmlFor="cv-upload"
                    leftIcon={<FiUpload />}
                    variant="outline"
                    cursor="pointer"
                    w="full"
                    borderColor="border.primary"
                    color="text.primary"
                    _hover={{ bg: 'whiteAlpha.100' }}
                    size={{ base: "md", md: "md" }}
                    fontSize={{ base: "sm", md: "md" }}
                    minH={{ base: "44px", md: "40px" }}
                    py={{ base: 4, md: 2 }}
                  >
                    {formData.cvFile
                      ? formData.cvFile.name
                      : 'Choose PDF file'}
                  </Button>
                  <FormErrorMessage fontSize={{ base: "xs", md: "sm" }}>{errors.cvFile}</FormErrorMessage>
                </FormControl>

                {/* Cover Letter */}
                <FormControl isInvalid={!!errors.coverLetter} isRequired>
                  <FormLabel color="text.primary" fontSize={{ base: "sm", md: "md" }}>Short Cover Letter</FormLabel>
                  <Textarea
                    value={formData.coverLetter}
                    onChange={(e) =>
                      setFormData({ ...formData, coverLetter: e.target.value })
                    }
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                    rows={{ base: 4, md: 6 }}
                    bg="whiteAlpha.50"
                    color="text.primary"
                    borderColor="border.primary"
                    _placeholder={{ color: 'text.tertiary' }}
                    size={{ base: "md", md: "md" }}
                    fontSize={{ base: "md", md: "md" }}
                    minH={{ base: "44px", md: "40px" }}
                  />
                  <Text fontSize={{ base: "xs", md: "sm" }} color="text.secondary" mt={1}>
                    {formData.coverLetter.length} / 50 characters minimum
                  </Text>
                  <FormErrorMessage fontSize={{ base: "xs", md: "sm" }}>{errors.coverLetter}</FormErrorMessage>
                </FormControl>

                {/* Confirmation Checkbox */}
                <FormControl isInvalid={!!errors.confirmAccurate} isRequired>
                  <Checkbox
                    isChecked={formData.confirmAccurate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmAccurate: e.target.checked,
                      })
                    }
                    colorScheme="blue"
                    color="text.primary"
                    size={{ base: "md", md: "md" }}
                    fontSize={{ base: "md", md: "md" }}
                    minH={{ base: "44px", md: "40px" }}
                  >
                    I confirm that the information provided is accurate
                  </Checkbox>
                  <FormErrorMessage fontSize={{ base: "xs", md: "sm" }}>{errors.confirmAccurate}</FormErrorMessage>
                </FormControl>

                {/* Submit Button */}
                <Button
                  type="submit"
                  colorScheme="blue"
                  size={{ base: "md", md: "lg" }}
                  isLoading={isSubmitting}
                  loadingText="Submitting..."
                  w="full"
                  fontSize={{ base: "sm", md: "md" }}
                  py={{ base: 6, md: 8 }}
                  minH={{ base: "48px", md: "44px" }}
                >
                  Submit Application
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>

        {/* Footer Note */}
        <Text textAlign="center" mt={{ base: 6, md: 8 }} color="text.secondary" fontSize={{ base: "xs", md: "sm" }}>
          Note: Driver positions are handled separately. Please visit the driver
          recruitment page or contact us directly.
        </Text>
      </Container>
    </Box>
  );
}

