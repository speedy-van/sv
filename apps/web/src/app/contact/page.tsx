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
  shouldForwardProp,
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
import { motion, isValidMotionProp } from 'framer-motion';
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
import Header from '@/components/site/Header';

const SUPPORT_PHONE_DISPLAY = '01202 129746';
const SUPPORT_PHONE_TEL = '01202129746';
const SUPPORT_PHONE_URI = `tel:${SUPPORT_PHONE_TEL}`;
const SUPPORT_EMAIL = 'support@speedy-van.co.uk';
const SUPPORT_EMAIL_URI = `mailto:${SUPPORT_EMAIL}`;
const CONTACT_FORM_CONVERSION_CONFIGURED = false; // TODO: configure a dedicated Google Ads conversion before re-enabling manual tracking

const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    if (typeof prop === 'string') {
      return isValidMotionProp(prop) || shouldForwardProp(prop);
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
    contact: SUPPORT_PHONE_DISPLAY,
    availability: '9AM-6PM, 7 Days/Week',
    action: () => window.open(SUPPORT_PHONE_URI)
  },
  {
    title: 'Email Support',
    description: 'Send us a detailed message',
    icon: FiMail,
    color: 'green',
    contact: SUPPORT_EMAIL,
    availability: 'Response within 2 hours',
    action: () => window.open(SUPPORT_EMAIL_URI)
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
  { day: 'Monday - Sunday', hours: '9:00 AM - 6:00 PM' },
  { day: 'Phone Support', hours: '7 Days a Week' },
  { day: 'Online Booking', hours: '24/7 Available' },
  { day: 'Emergency', hours: 'Call Anytime' }
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
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }
      
      // Track Google Ads conversion for lead form submission (disabled until dedicated action exists)
      if (CONTACT_FORM_CONVERSION_CONFIGURED && typeof window !== 'undefined' && (window as any).gtag) {
        try {
          (window as any).gtag('event', 'conversion', {
            'send_to': 'AW-17715630822/7393649164',
            'value': 1.0,
            'currency': 'GBP'
          });
          console.log('✅ Google Ads conversion tracked: Contact form submission');
        } catch (gtagError) {
          console.error('❌ Google Ads conversion tracking failed:', gtagError);
        }
      } else if (process.env.NODE_ENV !== 'production') {
        console.info(
          '[tracking-disabled:contact-form] Google Ads conversion tracking is disabled until a dedicated conversion action is defined.'
        );
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
      console.error('Contact form error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
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
            position="relative"
          >
            <HStack justify="center" mb={6}>
              <Box
                p={5}
                bg="rgba(59,130,246,0.2)"
                color="blue.400"
                borderRadius="2xl"
                border="2px solid"
                borderColor="rgba(59,130,246,0.4)"
                position="relative"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: '-2px',
                  left: '-2px',
                  right: '-2px',
                  bottom: '-2px',
                  borderRadius: '2xl',
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.5), rgba(139,92,246,0.5))',
                  filter: 'blur(10px)',
                  opacity: 0.5,
                  zIndex: -1,
                }}
              >
                <Icon as={FiMessageCircle} boxSize={14} />
              </Box>
            </HStack>
            <Badge
              colorScheme="blue"
              variant="subtle"
              fontSize="sm"
              px={4}
              py={1}
              borderRadius="full"
              mb={4}
              textTransform="none"
            >
              ✓ Quick Response Guaranteed
            </Badge>
            <Heading
              size="3xl"
              mb={6}
              bgGradient="linear(to-r, blue.300, purple.400, pink.400)"
              bgClip="text"
              fontWeight="extrabold"
            >
              Get in Touch
            </Heading>
            <Text fontSize="xl" color="gray.300" lineHeight="tall" mb={6}>
              Have questions about our moving services? Need a quote?{' '}
              <Box as="span" color="blue.400" fontWeight="bold">We're here to help!</Box>
            </Text>
            <Text fontSize="lg" color="gray.400" lineHeight="tall">
              Contact us through any of the methods below and we'll get back to you{' '}
              <Box as="span" color="neon.400" fontWeight="semibold">promptly</Box>.
            </Text>
            <HStack 
              justify="center" 
              spacing={6} 
              flexWrap="wrap"
              mt={6}
              p={5}
              bg="rgba(59,130,246,0.05)"
              borderRadius="xl"
              border="1px solid rgba(59,130,246,0.2)"
            >
              <VStack spacing={1}>
                <HStack spacing={2}>
                  <FiClock color="rgba(59,130,246,1)" size={20} />
                  <Text color="white" fontSize="sm" fontWeight="semibold">2-Hour Response</Text>
                </HStack>
              </VStack>
              <Divider orientation="vertical" h={8} borderColor="rgba(255,255,255,0.2)" display={{ base: 'none', md: 'block' }} />
              <VStack spacing={1}>
                <HStack spacing={2}>
                  <FiCheckCircle color="rgba(0,255,157,1)" size={20} />
                  <Text color="white" fontSize="sm" fontWeight="semibold">7 Days Support</Text>
                </HStack>
              </VStack>
              <Divider orientation="vertical" h={8} borderColor="rgba(255,255,255,0.2)" display={{ base: 'none', md: 'block' }} />
              <VStack spacing={1}>
                <HStack spacing={2}>
                  <FiShield color="rgba(139,92,246,1)" size={20} />
                  <Text color="white" fontSize="sm" fontWeight="semibold">Professional Team</Text>
                </HStack>
              </VStack>
            </HStack>
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
              bg="rgba(26,26,26,0.9)"
              borderRadius="xl"
              boxShadow="xl"
              border="1px solid"
              borderColor="rgba(139,92,246,0.2)"
              _hover={{
                borderColor: 'purple.400',
                shadow: '0 12px 40px rgba(139,92,246,0.2)',
              }}
              sx={{ transition: 'all 0.3s' }}
            >
              <CardBody p={8}>
                <VStack spacing={6} align="stretch">
                  <VStack spacing={4} textAlign="center">
                    <HStack justify="center">
                      <Box
                        p={3}
                        bgGradient="linear(to-br, rgba(139,92,246,0.2), rgba(168,85,247,0.2))"
                        color="purple.400"
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="rgba(139,92,246,0.3)"
                      >
                        <Icon as={FiSend} boxSize={7} />
                      </Box>
                    </HStack>
                    <VStack spacing={2}>
                      <Badge
                        colorScheme="purple"
                        variant="subtle"
                        fontSize="xs"
                        px={3}
                        py={1}
                        borderRadius="full"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Quick Response
                      </Badge>
                      <Heading 
                        size="xl" 
                        bgGradient="linear(to-r, white, purple.300)"
                        bgClip="text"
                        fontWeight="bold"
                      >
                        Send Us a Message
                      </Heading>
                      <HStack 
                        spacing={2}
                        p={3}
                        bg="rgba(139,92,246,0.05)"
                        borderRadius="lg"
                        border="1px solid rgba(139,92,246,0.2)"
                      >
                        <FiClock color="rgba(139,92,246,1)" size={18} />
                        <Text color="gray.300" fontSize="sm">
                          Fill out the form below and we'll get back to you within{' '}
                          <Box as="span" color="purple.400" fontWeight="bold">2 hours</Box>.
                        </Text>
                      </HStack>
                    </VStack>
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
                        size="lg"
                        w="full"
                        isLoading={isSubmitting}
                        loadingText="Sending..."
                        leftIcon={<FiSend />}
                        borderRadius="lg"
                        bgGradient="linear(to-r, purple.500, purple.600)"
                        color="white"
                        fontWeight="bold"
                        fontSize="md"
                        py={6}
                        _hover={{
                          bgGradient: 'linear(to-r, purple.600, purple.700)',
                          transform: 'translateY(-2px)',
                          shadow: '0 8px 30px rgba(139,92,246,0.4)',
                        }}
                        _active={{
                          transform: 'translateY(0)',
                        }}
                        sx={{ transition: 'all 0.3s' }}
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
                bg="rgba(26,26,26,0.9)"
                borderRadius="xl"
                boxShadow="xl"
                border="1px solid"
                borderColor="rgba(59,130,246,0.2)"
                _hover={{
                  borderColor: 'blue.400',
                  transform: 'translateY(-4px)',
                  shadow: '0 12px 40px rgba(59,130,246,0.2)',
                }}
                sx={{ transition: 'all 0.3s' }}
              >
                <CardBody p={8}>
                  <VStack spacing={6} align="start">
                    <HStack spacing={4}>
                      <Box
                        p={3}
                        bgGradient="linear(to-br, rgba(59,130,246,0.2), rgba(139,92,246,0.2))"
                        color="blue.400"
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="rgba(59,130,246,0.3)"
                      >
                        <Icon as={FiClock} boxSize={7} />
                      </Box>
                      <VStack align="start" spacing={1}>
                        <HStack spacing={2}>
                          <Heading size="lg" color="white" fontWeight="bold">
                            Office Hours
                          </Heading>
                          <Badge
                            colorScheme="green"
                            variant="solid"
                            fontSize="xs"
                            px={2}
                            py={1}
                            borderRadius="full"
                          >
                            Open Now
                          </Badge>
                        </HStack>
                        <Text color="gray.300" fontSize="sm">
                          Our team is available to help you with your moving needs.
                        </Text>
                      </VStack>
                    </HStack>

                    <VStack spacing={3} align="stretch" w="full">
                      {officeHours.map((schedule, index) => (
                        <HStack 
                          key={index} 
                          justify="space-between" 
                          p={4} 
                          bg="rgba(59,130,246,0.05)" 
                          borderRadius="lg" 
                          border="1px solid" 
                          borderColor="rgba(59,130,246,0.2)"
                          _hover={{
                            bg: 'rgba(59,130,246,0.1)',
                            borderColor: 'rgba(59,130,246,0.4)',
                          }}
                          transition="all 0.2s"
                        >
                          <HStack spacing={3}>
                            <Box w={2} h={2} bg="blue.400" borderRadius="full" />
                            <Text fontWeight="semibold" color="white" fontSize="sm">
                              {schedule.day}
                            </Text>
                          </HStack>
                          <Badge
                            colorScheme="blue"
                            variant="subtle"
                            fontSize="sm"
                            px={3}
                            py={1}
                            borderRadius="full"
                          >
                            {schedule.hours}
                          </Badge>
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
                bgGradient="linear(to-br, rgba(239,68,68,0.15), rgba(249,115,22,0.15))"
                borderRadius="xl"
                boxShadow="xl"
                border="2px solid"
                borderColor="red.500"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgGradient: 'radial(circle at 50% 0%, rgba(239,68,68,0.2), transparent 70%)',
                  pointerEvents: 'none',
                }}
              >
                <CardBody p={8} position="relative" zIndex={1}>
                  <VStack spacing={6} textAlign="center">
                    <Box
                      p={4}
                      bg="rgba(239,68,68,0.2)"
                      borderRadius="full"
                      border="2px solid"
                      borderColor="red.500"
                      display="inline-flex"
                    >
                      <FiPhone size={32} color="rgb(239,68,68)" />
                    </Box>
                    <VStack spacing={3}>
                      <Badge
                        colorScheme="red"
                        variant="solid"
                        fontSize="sm"
                        px={4}
                        py={2}
                        borderRadius="full"
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        ⚡ Urgent Support
                      </Badge>
                      <Heading 
                        size="xl" 
                        bgGradient="linear(to-r, white, red.300)"
                        bgClip="text"
                        fontWeight="bold"
                      >
                        Need Immediate Help?
                      </Heading>
                      <Text color="gray.200" fontSize="md" maxW="md">
                        For <Box as="span" color="red.400" fontWeight="bold">urgent moving inquiries</Box> or{' '}
                        <Box as="span" color="orange.400" fontWeight="bold">same-day service</Box>, call us directly.
                      </Text>
                    </VStack>
                    <VStack spacing={3} w="full">
                      <Button
                        size="lg"
                        onClick={() => window.open(SUPPORT_PHONE_URI)}
                        leftIcon={<FiPhone />}
                        w="full"
                        bg="red.500"
                        color="white"
                        fontWeight="bold"
                        fontSize="lg"
                        _hover={{
                          bg: 'red.600',
                          transform: 'translateY(-4px)',
                          shadow: '0 12px 40px rgba(239,68,68,0.4)',
                        }}
                        sx={{ transition: 'all 0.3s' }}
                      >
                        <span>Call Now: {SUPPORT_PHONE_DISPLAY}</span>
                      </Button>
                      <Button
                        size="lg"
                        onClick={() => window.location.href = '/booking-luxury'}
                        w="full"
                        variant="outline"
                        borderColor="red.500"
                        borderWidth="2px"
                        color="white"
                        fontWeight="semibold"
                        _hover={{
                          bg: 'rgba(239,68,68,0.1)',
                          borderColor: 'red.400',
                          transform: 'translateY(-2px)',
                        }}
                        sx={{ transition: 'all 0.3s' }}
                      >
                        Get Free Quote
                      </Button>
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
                bg="rgba(26,26,26,0.9)"
                borderRadius="xl"
                boxShadow="xl"
                border="1px solid"
                borderColor="rgba(0,255,157,0.2)"
                _hover={{
                  borderColor: 'neon.400',
                  transform: 'translateY(-4px)',
                  shadow: '0 12px 40px rgba(0,255,157,0.2)',
                }}
                sx={{ transition: 'all 0.3s' }}
              >
                <CardBody p={8}>
                  <VStack spacing={6} align="start">
                    <HStack spacing={4}>
                      <Box
                        p={4}
                        bgGradient="linear(to-br, rgba(0,255,157,0.2), rgba(34,197,94,0.2))"
                        color="neon.400"
                        borderRadius="xl"
                        border="1px solid"
                        borderColor="rgba(0,255,157,0.3)"
                      >
                        <Icon as={FiMapPin} boxSize={8} />
                      </Box>
                      <VStack align="start" spacing={2}>
                        <Heading size="lg" color="white" fontWeight="bold">
                          Our Location
                        </Heading>
                        <HStack spacing={2}>
                          <Badge
                            colorScheme="green"
                            variant="subtle"
                            fontSize="xs"
                            px={2}
                            py={1}
                            borderRadius="full"
                          >
                            Main Hub
                          </Badge>
                        </HStack>
                      </VStack>
                    </HStack>

                    <Box
                      p={4}
                      bg="rgba(0,255,157,0.05)"
                      borderRadius="lg"
                      borderLeft="4px solid"
                      borderColor="neon.400"
                      w="full"
                    >
                      <HStack spacing={3}>
                        <FiMapPin size={20} color="rgba(0,255,157,1)" />
                        <VStack align="start" spacing={0}>
                          <Text color="white" fontWeight="semibold" fontSize="md">
                            Office 2.18 1 Barrack St
                          </Text>
                          <Text color="gray.400" fontSize="sm">
                            Hamilton ML3 0HS, United Kingdom
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>

                    <Alert 
                      status="info" 
                      borderRadius="lg"
                      bg="rgba(59,130,246,0.05)"
                      border="1px solid"
                      borderColor="rgba(59,130,246,0.2)"
                    >
                      <AlertIcon color="blue.400" />
                      <Box>
                        <Text fontSize="sm" color="gray.300" lineHeight="tall">
                          We serve customers <Box as="span" color="blue.400" fontWeight="semibold">across the UK</Box>. Our Hamilton office is our main hub, 
                          and we have <Box as="span" color="neon.400" fontWeight="semibold">local teams in major cities</Box>.
                        </Text>
                      </Box>
                    </Alert>
                  </VStack>
                </CardBody>
              </Card>
            </VStack>
          </SimpleGrid>

          {/* Testimonials */}
          <Box 
            w="full"
            p={{ base: 6, md: 10 }}
            bg="rgba(13,13,13,0.6)"
            borderRadius="2xl"
            border="1px solid rgba(255,255,255,0.05)"
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50%',
              height: '100%',
              bgGradient: 'radial(circle at 20% 50%, rgba(251,191,36,0.1), transparent 60%)',
              pointerEvents: 'none',
            }}
          >
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition="0.6s ease-out"
              textAlign="center"
              mb={12}
              position="relative"
              zIndex={1}
            >
              <HStack justify="center" mb={4}>
                <Box
                  p={3}
                  bg="rgba(251,191,36,0.15)"
                  borderRadius="full"
                  border="1px solid rgba(251,191,36,0.3)"
                >
                  <FiUsers size={28} color="rgb(250,204,21)" />
                </Box>
              </HStack>
              <Badge
                colorScheme="yellow"
                variant="subtle"
                fontSize="xs"
                px={3}
                py={1}
                borderRadius="full"
                mb={4}
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Customer Reviews
              </Badge>
              <Heading 
                size="2xl" 
                mb={4}
                bgGradient="linear(to-r, white, yellow.300, orange.400)"
                bgClip="text"
                fontWeight="bold"
              >
                What Our Customers Say
              </Heading>
              <Text 
                color="gray.300" 
                fontSize="lg"
                maxW="2xl"
                mx="auto"
              >
                Real feedback from <Box as="span" color="yellow.400" fontWeight="semibold">satisfied customers</Box>
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} position="relative" zIndex={1}>
              {testimonials.map((testimonial, index) => (
                <Card
                  as={motion.div}
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={`0.5s ease-out ${index * 0.1}s`}
                  bg="rgba(26,26,26,0.9)"
                  borderRadius="xl"
                  boxShadow="lg"
                  border="1px solid"
                  borderColor="rgba(251,191,36,0.2)"
                  _hover={{
                    borderColor: 'yellow.400',
                    transform: 'translateY(-4px)',
                    shadow: '0 12px 40px rgba(251,191,36,0.2)',
                  }}
                  sx={{ transition: 'all 0.3s' }}
                >
                  <CardBody p={8}>
                    <VStack spacing={5} align="start">
                      <HStack spacing={1}>
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Icon key={i} as={FiStar} color="yellow.400" fill="yellow.400" boxSize={5} />
                        ))}
                      </HStack>
                      <Box
                        p={4}
                        bg="rgba(251,191,36,0.05)"
                        borderRadius="lg"
                        borderLeft="4px solid"
                        borderColor="yellow.400"
                      >
                        <Text 
                          color="gray.200" 
                          fontSize="md" 
                          fontStyle="italic"
                          lineHeight="tall"
                        >
                          "{testimonial.text}"
                        </Text>
                      </Box>
                      <HStack spacing={3}>
                        <Box
                          w={10}
                          h={10}
                          bg="yellow.500"
                          borderRadius="full"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          color="gray.900"
                          fontWeight="bold"
                          fontSize="lg"
                        >
                          {testimonial.name.charAt(0)}
                        </Box>
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold" color="white" fontSize="md">
                            {testimonial.name}
                          </Text>
                          <HStack spacing={2}>
                            <FiMapPin size={14} color="rgba(251,191,36,1)" />
                            <Text fontSize="sm" color="gray.400">
                              {testimonial.location}
                            </Text>
                          </HStack>
                        </VStack>
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
            p={{ base: 8, md: 16 }}
            bgGradient="linear(to-br, rgba(0,255,157,0.15), rgba(34,197,94,0.15))"
            borderRadius="3xl"
            border="2px solid"
            borderColor="neon.400"
            w="full"
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              bgGradient: 'conic(from 0deg, transparent, rgba(0,255,157,0.3), transparent 30%)',
              animation: 'rotate 8s linear infinite',
              pointerEvents: 'none',
            }}
            sx={{
              '@keyframes rotate': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          >
            <VStack spacing={8} position="relative" zIndex={1}>
              <Box
                p={4}
                bg="rgba(0,255,157,0.2)"
                borderRadius="full"
                border="2px solid"
                borderColor="neon.400"
                display="inline-flex"
              >
                <FiTruck size={40} color="rgba(0,255,157,1)" />
              </Box>
              <VStack spacing={4}>
                <Badge
                  colorScheme="green"
                  variant="solid"
                  fontSize="sm"
                  px={4}
                  py={2}
                  borderRadius="full"
                  textTransform="uppercase"
                  letterSpacing="wider"
                >
                  🚀 Start Your Move Today
                </Badge>
                <Heading 
                  size="3xl" 
                  bgGradient="linear(to-r, white, neon.400, green.300)"
                  bgClip="text"
                  fontWeight="extrabold"
                >
                  Ready to Move?
                </Heading>
                <Text 
                  fontSize="xl" 
                  maxW="3xl" 
                  color="gray.200"
                  lineHeight="tall"
                >
                  <Box as="span" color="red.400" fontWeight="bold">Don't wait!</Box> Contact us today for a{' '}
                  <Box as="span" color="neon.400" fontWeight="semibold">free quote</Box> and let us make your move{' '}
                  <Box as="span" color="green.400" fontWeight="semibold">stress-free</Box>.
                </Text>
              </VStack>
              <HStack spacing={4} flexWrap="wrap" justify="center">
                <Button
                  size="lg"
                  onClick={() => window.location.href = '/booking-luxury'}
                  bg="neon.400"
                  color="gray.900"
                  fontWeight="bold"
                  px={8}
                  py={6}
                  fontSize="lg"
                  _hover={{
                    bg: 'neon.500',
                    transform: 'translateY(-4px)',
                    shadow: '0 12px 40px rgba(0,255,157,0.4)',
                  }}
                  sx={{ transition: 'all 0.3s' }}
                >
                  Get Free Quote
                </Button>
                <Button
                  size="lg"
                  onClick={() => window.open(SUPPORT_PHONE_URI)}
                  variant="outline"
                  borderColor="neon.400"
                  borderWidth="2px"
                  color="white"
                  px={8}
                  py={6}
                  fontSize="lg"
                  _hover={{
                    bg: 'rgba(0,255,157,0.1)',
                    borderColor: 'neon.500',
                    transform: 'translateY(-4px)',
                    shadow: '0 12px 40px rgba(0,255,157,0.2)',
                  }}
                  leftIcon={<FiPhone />}
                  sx={{ transition: 'all 0.3s' }}
                >
                  Call Now
                </Button>
              </HStack>
              <HStack 
                spacing={3}
                p={4}
                bg="rgba(0,255,157,0.1)"
                borderRadius="xl"
                border="1px solid rgba(0,255,157,0.3)"
              >
                <FiCheckCircle size={24} color="rgba(0,255,157,1)" />
                <Text fontSize="md" color="white" fontWeight="semibold">
                  📞 Available 7 Days a Week • ⏱️ Quick Response • ✅ No Obligation
                </Text>
              </HStack>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
    </>
  );
}