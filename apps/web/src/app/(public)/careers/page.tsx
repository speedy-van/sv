'use client';

import { useState } from 'react';
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
      <Box bg="gray.50" minH="100vh" py={20}>
        <Container maxW="container.md">
          <Card>
            <CardBody textAlign="center" py={16}>
              <Icon as={FiCheckCircle} boxSize={16} color="green.500" mb={4} />
              <Heading size="lg" mb={4}>
                Application Submitted Successfully!
              </Heading>
              <Text color="gray.600" mb={6}>
                Thank you for applying to join our team. We have received your application
                and will review it carefully. You should receive a confirmation email shortly.
              </Text>
              <Text color="gray.600" mb={6}>
                Our HR team will get back to you within 5-7 business days.
              </Text>
              <Button
                colorScheme="blue"
                onClick={() => (window.location.href = '/')}
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
    <Box bg="gray.50" minH="100vh" py={20}>
      <Container maxW="container.lg">
        {/* Header Section */}
        <VStack spacing={4} mb={12} textAlign="center">
          <Icon as={FiBriefcase} boxSize={12} color="blue.500" />
          <Heading size="2xl" color="blue.600">
            Join Our Team
          </Heading>
          <Text fontSize="lg" color="gray.600" maxW="2xl">
            We're always looking for talented individuals to join the Speedy Van family.
            If you're passionate about logistics, customer service, and making a difference,
            we'd love to hear from you!
          </Text>
        </VStack>

        {/* Application Form */}
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={6} align="stretch">
                <Heading size="md" color="gray.700">
                  Application Form
                </Heading>

                {/* Full Name */}
                <FormControl isInvalid={!!errors.fullName} isRequired>
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="John Smith"
                  />
                  <FormErrorMessage>{errors.fullName}</FormErrorMessage>
                </FormControl>

                {/* Email */}
                <FormControl isInvalid={!!errors.email} isRequired>
                  <FormLabel>Email Address</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="john.smith@example.com"
                  />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>

                {/* Phone */}
                <FormControl isInvalid={!!errors.phone} isRequired>
                  <FormLabel>Phone Number</FormLabel>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="07901234567"
                  />
                  <FormErrorMessage>{errors.phone}</FormErrorMessage>
                </FormControl>

                {/* Position */}
                <FormControl isInvalid={!!errors.position} isRequired>
                  <FormLabel>Position Applying For</FormLabel>
                  <Select
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    placeholder="Select a position"
                  >
                    {POSITIONS.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </Select>
                  <FormErrorMessage>{errors.position}</FormErrorMessage>
                </FormControl>

                {/* CV Upload */}
                <FormControl isInvalid={!!errors.cvFile} isRequired>
                  <FormLabel>Upload CV (PDF only, max 5MB)</FormLabel>
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
                  >
                    {formData.cvFile
                      ? formData.cvFile.name
                      : 'Choose PDF file'}
                  </Button>
                  <FormErrorMessage>{errors.cvFile}</FormErrorMessage>
                </FormControl>

                {/* Cover Letter */}
                <FormControl isInvalid={!!errors.coverLetter} isRequired>
                  <FormLabel>Short Cover Letter</FormLabel>
                  <Textarea
                    value={formData.coverLetter}
                    onChange={(e) =>
                      setFormData({ ...formData, coverLetter: e.target.value })
                    }
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                    rows={6}
                  />
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    {formData.coverLetter.length} / 50 characters minimum
                  </Text>
                  <FormErrorMessage>{errors.coverLetter}</FormErrorMessage>
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
                  >
                    I confirm that the information provided is accurate
                  </Checkbox>
                  <FormErrorMessage>{errors.confirmAccurate}</FormErrorMessage>
                </FormControl>

                {/* Submit Button */}
                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  isLoading={isSubmitting}
                  loadingText="Submitting..."
                  w="full"
                >
                  Submit Application
                </Button>
              </VStack>
            </form>
          </CardBody>
        </Card>

        {/* Footer Note */}
        <Text textAlign="center" mt={8} color="gray.600" fontSize="sm">
          Note: Driver positions are handled separately. Please visit the driver
          recruitment page or contact us directly.
        </Text>
      </Container>
    </Box>
  );
}

