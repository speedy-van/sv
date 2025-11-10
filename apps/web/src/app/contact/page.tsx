'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Icon,
  Badge,
  chakra,
  Button,
  useColorModeValue,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  useToast,
  Alert,
  AlertIcon,
  Divider,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import {
  FiMessageCircle,
  FiCheckCircle,
  FiShield,
  FiClock,
  FiMapPin,
  FiMail,
  FiPhone,
  FiUsers,
  FiStar,
  FiSend,
  FiHome,
  FiTruck,
} from 'react-icons/fi';
import HeaderButton from '@/components/common/HeaderButton';

const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    if (typeof prop === 'string') {
      return !prop.startsWith('while') && !prop.startsWith('animate') && !prop.startsWith('initial') && !prop.startsWith('transition') && !prop.startsWith('viewport') && !prop.startsWith('textAlign') && !prop.startsWith('maxW') && !prop.startsWith('mb') && !prop.startsWith('borderRadius');
    }
    return true;
  },
});

const contactMethods = [
  {
    title: 'Phone Support',
    description: 'Speak directly with our team',
    icon: FiPhone,
    color: 'blue',
    contact: '+44 1202129746',
    availability: '24/7 Support',
    action: () => window.open('tel:+441202129746')
  },
  {
    title: 'Email Support',
    description: 'Send us a detailed message',
    icon: FiMail,
    color: 'green',
    contact: 'support@speedy-van.co.uk',
    availability: 'Response within 2 hours',
    action: () => window.open('mailto:support@speedy-van.co.uk')
  },
  {
    title: 'Live Chat',
    description: 'Instant support on our website',
    icon: FiMessageCircle,
    color: 'purple',
    contact: 'Available now',
    availability: 'Mon-Fri 8AM-8PM',
    action: () => {/* Live chat implementation */}
  },
  {
    title: 'Visit Our Office',
    description: 'Meet us in person',
    icon: FiMapPin,
    color: 'orange',
    contact: 'Office 2.18 1 Barrack St, Hamilton',
    availability: 'Mon-Fri 9AM-5PM',
    action: () => {/* Open maps */}
  }
];

const officeHours = [
  { day: 'Monday - Friday', hours: '8:00 AM - 8:00 PM' },
  { day: 'Saturday', hours: '9:00 AM - 6:00 PM' },
  { day: 'Sunday', hours: '10:00 AM - 4:00 PM' },
  { day: 'Emergency', hours: '24/7 Available' }
];

const services = [
  { name: 'House Moving', icon: FiHome },
  { name: 'Office Relocation', icon: FiTruck },
  { name: 'Furniture Delivery', icon: FiUsers },
  { name: 'Student Moving', icon: FiMessageCircle }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    location: 'Manchester',
    rating: 5,
    text: 'Excellent customer service! They answered all my questions quickly and made the booking process so easy.'
  },
  {
    name: 'David Smith',
    location: 'Birmingham',
    rating: 5,
    text: 'Very responsive team. Got back to me within minutes and resolved my query immediately.'
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const bgColor = '#0D0D0D';
  const cardBg = 'rgba(26, 26, 26, 0.95)';
  const toast = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Track Google Ads conversion for lead form submission
      if (typeof window !== 'undefined' && (window as any).gtag) {
        try {
          (window as any).gtag('event', 'conversion', {
            'send_to': 'AW-17715630822/Submit_lead_form_Website',
            'value': 1.0,
            'currency': 'GBP'
          });
          console.log('✅ Google Ads conversion tracked: Contact form submission');
        } catch (gtagError) {
          console.error('❌ Google Ads conversion tracking failed:', gtagError);
        }
      }
      
      toast({
        title: 'Message Sent!',
        description: 'We\'ll get back to you within 2 hours.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        service: '',
        message: ''
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box bg={bgColor} minH="100vh" pt={20}>
      <Container maxW="container.xl" py={16}>
        <VStack spacing={16}>
          {/* Hero Section */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition="0.6s ease-out"
            textAlign="center"
            maxW="4xl"
          >
            <HStack justify="center" mb={6}>
              <Box
                p={4}
                bg="rgba(59, 130, 246, 0.2)"
                color="blue.400"
                borderRadius="xl"
                border="1px solid"
                borderColor="rgba(59, 130, 246, 0.3)"
              >
                <Icon as={FiMessageCircle} boxSize={12} />
              </Box>
            </HStack>
            <Heading
              size="2xl"
              mb={6}
              bgGradient="linear(to-r, blue.400, blue.600)"
              bgClip="text"
            >
              Get in Touch
            </Heading>
            <Text fontSize="xl" color="text.secondary" lineHeight="tall">
              Have questions about our moving services? Need a quote? We're here to help! 
              Contact us through any of the methods below and we'll get back to you promptly.
            </Text>
          </MotionBox>

          {/* Contact Methods */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} w="full">
            {contactMethods.map((method, index) => (
              <Card
                as={motion.div}
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={`0.5s ease-out ${index * 0.1}s`}
                bg={cardBg}
                borderRadius="xl"
                boxShadow="lg"
                _hover={{
                  transform: 'translateY(-4px)',
                  boxShadow: 'xl',
                }}
                cursor="pointer"
                onClick={method.action}
              >
                <CardBody p={6} textAlign="center">
                  <VStack spacing={4}>
                    <Box
                      p={3}
                      bg={`rgba(59, 130, 246, 0.2)`}
                      color={`${method.color}.400`}
                      borderRadius="lg"
                      border="1px solid"
                      borderColor={`rgba(59, 130, 246, 0.3)`}
                    >
                      <Icon as={method.icon} boxSize={6} />
                    </Box>
                    <Heading size="md" color="text.primary">
                      {method.title}
                    </Heading>
                    <Text fontSize="sm" color="text.secondary" textAlign="center">
                      {method.description}
                    </Text>
                    <VStack spacing={2}>
                      <Text fontSize="lg" fontWeight="bold" color={`${method.color}.500`}>
                        {method.contact}
                      </Text>
                      <Text fontSize="xs" color="text.secondary">
                        {method.availability}
                      </Text>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>

          {/* Contact Form and Info */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={12} w="full">
            {/* Contact Form */}
            <Card
              as={motion.div}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition="0.6s ease-out"
              bg={cardBg}
              borderRadius="xl"
              boxShadow="xl"
            >
              <CardBody p={8}>
                <VStack spacing={6} align="stretch">
                  <VStack spacing={2} textAlign="center">
                    <Heading size="lg" color="text.primary">
                      Send Us a Message
                    </Heading>
                    <Text color="text.secondary">
                      Fill out the form below and we'll get back to you within 2 hours.
                    </Text>
                  </VStack>

                  <form onSubmit={handleSubmit}>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel color="white">Full Name</FormLabel>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          borderRadius="lg"
                          bg="rgba(26, 26, 26, 0.8)"
                          borderColor="rgba(59, 130, 246, 0.3)"
                          color="white"
                          _placeholder={{ color: 'gray.400' }}
                          _focus={{ borderColor: 'blue.400', bg: 'rgba(26, 26, 26, 0.9)' }}
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel color="white">Email Address</FormLabel>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email"
                          borderRadius="lg"
                          bg="rgba(26, 26, 26, 0.8)"
                          borderColor="rgba(59, 130, 246, 0.3)"
                          color="white"
                          _placeholder={{ color: 'gray.400' }}
                          _focus={{ borderColor: 'blue.400', bg: 'rgba(26, 26, 26, 0.9)' }}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel color="white">Phone Number</FormLabel>
                        <Input
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Enter your phone number"
                          borderRadius="lg"
                          bg="rgba(26, 26, 26, 0.8)"
                          borderColor="rgba(59, 130, 246, 0.3)"
                          color="white"
                          _placeholder={{ color: 'gray.400' }}
                          _focus={{ borderColor: 'blue.400', bg: 'rgba(26, 26, 26, 0.9)' }}
                        />
                      </FormControl>

                      <FormControl>
                        <FormLabel color="white">Service Interested In</FormLabel>
                        <Select
                          name="service"
                          value={formData.service}
                          onChange={handleInputChange}
                          placeholder="Select a service"
                          borderRadius="lg"
                          bg="rgba(26, 26, 26, 0.8)"
                          borderColor="rgba(59, 130, 246, 0.3)"
                          color="white"
                          _focus={{ borderColor: 'blue.400', bg: 'rgba(26, 26, 26, 0.9)' }}
                        >
                          {services.map((service) => (
                            <option key={service.name} value={service.name} style={{ backgroundColor: '#1a1a1a', color: 'white' }}>
                              {service.name}
                            </option>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel color="white">Message</FormLabel>
                        <Textarea
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          placeholder="Tell us about your moving needs..."
                          rows={4}
                          borderRadius="lg"
                          bg="rgba(26, 26, 26, 0.8)"
                          borderColor="rgba(59, 130, 246, 0.3)"
                          color="white"
                          _placeholder={{ color: 'gray.400' }}
                          _focus={{ borderColor: 'blue.400', bg: 'rgba(26, 26, 26, 0.9)' }}
                        />
                      </FormControl>

                      <Button
                        type="submit"
                        colorScheme="blue"
                        size="lg"
                        w="full"
                        isLoading={isSubmitting}
                        loadingText="Sending..."
                        leftIcon={<FiSend />}
                        borderRadius="lg"
                      >
                        Send Message
                      </Button>
                    </VStack>
                  </form>
                </VStack>
              </CardBody>
            </Card>

            {/* Contact Information */}
            <VStack spacing={8} align="stretch">
              {/* Office Hours */}
              <Card
                as={motion.div}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition="0.6s ease-out 0.2s"
                bg={cardBg}
                borderRadius="xl"
                boxShadow="xl"
              >
                <CardBody p={8}>
                  <VStack spacing={6} align="start">
                    <VStack spacing={2} align="start">
                      <Heading size="lg" color="text.primary">
                        Office Hours
                      </Heading>
                      <Text color="text.secondary">
                        Our team is available to help you with your moving needs.
                      </Text>
                    </VStack>

                    <VStack spacing={3} align="stretch" w="full">
                      {officeHours.map((schedule, index) => (
                        <HStack key={index} justify="space-between" p={3} bg="rgba(59, 130, 246, 0.1)" borderRadius="lg" border="1px solid" borderColor="rgba(59, 130, 246, 0.2)">
                          <Text fontWeight="medium" color="text.primary">
                            {schedule.day}
                          </Text>
                          <Text color="text.secondary">
                            {schedule.hours}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Quick Contact */}
              <Card
                as={motion.div}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition="0.6s ease-out 0.4s"
                bg="linear-gradient(135deg, blue.400, blue.600)"
                color="white"
                borderRadius="xl"
                boxShadow="xl"
              >
                <CardBody p={8}>
                  <VStack spacing={6} textAlign="center">
                    <Heading size="lg">Need Immediate Help?</Heading>
                    <Text>
                      For urgent moving inquiries or same-day service, call us directly.
                    </Text>
                    <VStack spacing={4}>
                      <HeaderButton
                        variant="glass"
                        size="lg"
                        onClick={() => window.open('tel:+441202129746')}
                        leftIcon={<FiPhone />}
                        w="full"
                      >
                        Call Now: +44 1202129746
                      </HeaderButton>
                      <HeaderButton
                        variant="outline"
                        size="lg"
                        onClick={() => window.location.href = '/booking-luxury'}
                        borderColor="white"
                        color="white"
                        _hover={{
                          bg: 'rgba(255,255,255,0.1)',
                          borderColor: 'white',
                        }}
                        w="full"
                      >
                        Get Free Quote
                      </HeaderButton>
                    </VStack>
                  </VStack>
                </CardBody>
              </Card>

              {/* Location Info */}
              <Card
                as={motion.div}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition="0.6s ease-out 0.6s"
                bg={cardBg}
                borderRadius="xl"
                boxShadow="xl"
              >
                <CardBody p={8}>
                  <VStack spacing={6} align="start">
                    <HStack spacing={4}>
                      <Box
                        p={3}
                        bg="rgba(251, 191, 36, 0.2)"
                        color="orange.400"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="rgba(251, 191, 36, 0.3)"
                      >
                        <Icon as={FiMapPin} boxSize={6} />
                      </Box>
                      <VStack align="start" spacing={1}>
                        <Heading size="md" color="text.primary">
                          Our Location
                        </Heading>
                        <Text color="text.secondary">
                          Office 2.18 1 Barrack St, Hamilton ML3 0HS
                        </Text>
                      </VStack>
                    </HStack>

                    <Alert 
                      status="info" 
                      borderRadius="lg"
                      bg="rgba(59, 130, 246, 0.1)"
                      border="1px solid"
                      borderColor="rgba(59, 130, 246, 0.3)"
                    >
                      <AlertIcon color="blue.400" />
                      <Box>
                        <Text fontSize="sm" color="gray.300">
                          We serve customers across the UK. Our Hamilton office is our main hub, 
                          and we have local teams in major cities.
                        </Text>
                      </Box>
                    </Alert>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </SimpleGrid>

          {/* Testimonials */}
          <Box w="full">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition="0.6s ease-out"
              textAlign="center"
              mb={12}
            >
              <Heading size="xl" mb={4} color="text.primary">
                What Our Customers Say
              </Heading>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              {testimonials.map((testimonial, index) => (
                <Card
                  as={motion.div}
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={`0.5s ease-out ${index * 0.1}s`}
                  bg={cardBg}
                  borderRadius="xl"
                  boxShadow="lg"
                >
                  <CardBody p={8}>
                    <VStack spacing={4} align="start">
                      <HStack>
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Icon key={i} as={FiStar} color="yellow.400" />
                        ))}
                      </HStack>
                      <Text color="text.secondary" fontStyle="italic">
                        "{testimonial.text}"
                      </Text>
                      <HStack>
                        <Text fontWeight="bold" color="text.primary">
                          {testimonial.name}
                        </Text>
                        <Text color="text.secondary">
                          - {testimonial.location}
                        </Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          {/* Final CTA */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition="0.6s ease-out 0.4s"
            textAlign="center"
            p={12}
            bg="linear-gradient(135deg, blue.400, blue.600)"
            borderRadius="2xl"
            color="white"
            w="full"
          >
            <VStack spacing={6}>
              <Heading size="xl">Ready to Move?</Heading>
              <Text fontSize="lg" maxW="2xl">
                Don't wait! Contact us today for a free quote and let us make your move stress-free.
              </Text>
              <HStack spacing={4}>
                <HeaderButton
                  variant="glass"
                  size="lg"
                  onClick={() => window.location.href = '/booking-luxury'}
                >
                  Get Free Quote
                </HeaderButton>
                <HeaderButton
                  variant="outline"
                  size="lg"
                  onClick={() => window.open('tel:+441202129746')}
                  borderColor="white"
                  color="white"
                  _hover={{
                    bg: 'rgba(255,255,255,0.1)',
                    borderColor: 'white',
                  }}
                  leftIcon={<FiPhone />}
                >
                  Call Now
                </HeaderButton>
              </HStack>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}