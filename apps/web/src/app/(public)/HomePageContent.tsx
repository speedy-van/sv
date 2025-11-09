'use client';

import React from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  HStack,
  Icon,
  useColorModeValue,
  SimpleGrid,
  Card,
  Avatar,
  Badge,
  Image,
  Flex,
  chakra,
} from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import {
  FaTruck,
  FaClock,
  FaShieldAlt,
  FaStar,
  FaCouch,
  FaLaptop,
  FaGraduationCap,
  FaBuilding,
  FaMagic,
  FaArrowRight,
  FaCheckCircle,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
} from 'react-icons/fa';
import Hero from '../../components/Hero';
import HeroMessage from '../../components/HeroMessage';
import ServiceMapSection from '../../components/ServiceMapSection';
import HomeFooter from '@/components/site/HomeFooter';
import dynamic from 'next/dynamic';

const TrustpilotWidget = dynamic(
  () => import('@/components/site/TrustpilotWidget'),
  { 
    ssr: false,
    loading: () => null,
  }
);

// Create motion components using chakra integration
const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    if (typeof prop === 'string') {
      return isValidMotionProp(prop) || (chakra as any).shouldForwardProp?.(prop) || true;
    }
    return true;
  },
});

const features = [
  {
    icon: FaTruck,
    title: 'Fast & Reliable',
    description: 'Professional moving service with guaranteed delivery times',
    color: 'blue',
    gradient: 'linear(to-r, blue.400, blue.600)',
  },
  {
    icon: FaClock,
    title: '24/7 Support',
    description: 'Round-the-clock customer support for peace of mind',
    color: 'green',
    gradient: 'linear(to-r, green.400, green.600)',
  },
  {
    icon: FaShieldAlt,
    title: 'Fully Insured',
    description: 'Complete coverage for your valuable belongings',
    color: 'purple',
    gradient: 'linear(to-r, purple.400, purple.600)',
  },
  {
    icon: FaStar,
    title: '5-Star Rated',
    description: 'Trusted by thousands of satisfied customers',
    color: 'yellow',
    gradient: 'linear(to-r, yellow.400, yellow.600)',
  },
];

const services = [
  {
    icon: FaCouch,
    title: 'Furniture Moves',
    description: 'Expert handling of sofas, tables & delicate pieces',
    emoji: '🪑',
    color: 'orange',
    features: [
      'Professional packing',
      'Furniture protection',
      'Assembly service',
    ],
  },
  {
    icon: FaLaptop,
    title: 'Appliances & Electronics',
    description: 'Safe transport of TVs, computers & kitchen gear',
    emoji: '💻',
    color: 'blue',
    features: [
      'Anti-static packaging',
      'Climate control',
      'Insurance coverage',
    ],
  },
  {
    icon: FaGraduationCap,
    title: 'Student Moves',
    description: 'Affordable campus-to-campus relocation',
    emoji: '🎓',
    color: 'green',
    features: ['Student discounts', 'Flexible scheduling', 'Storage options'],
  },
  {
    icon: FaBuilding,
    title: 'Business & Office',
    description: 'Professional corporate relocation services',
    emoji: '🏢',
    color: 'purple',
    features: ['Minimal downtime', 'Document security', 'After-hours service'],
  },
  {
    icon: FaMagic,
    title: 'Custom Requests',
    description: 'Tailored solutions for unique moving needs',
    emoji: '✨',
    color: 'pink',
    features: ['Personalized planning', 'Special handling', 'Custom packaging'],
  },
];

const testimonials = [
  {
    name: 'Sarah Mitchell',
    city: 'Manchester',
    quote:
      'Speedy Van moved my entire flat in under 3 hours! The team was incredibly professional and careful with my antique furniture.',
    rating: 5,
    avatar: '/avatars/sarah.jpg',
    service: 'Flat Removal',
  },
  {
    name: 'James Thompson',
    city: 'Birmingham',
    quote:
      'Best moving experience ever. They handled my electronics with such care, and the price was exactly what they quoted.',
    rating: 5,
    avatar: '/avatars/james.jpg',
    service: 'Electronics Move',
  },
  {
    name: 'Emma Davies',
    city: 'Leeds',
    quote:
      'From booking to delivery, everything was seamless. The drivers were punctual and my items arrived in perfect condition.',
    rating: 5,
    avatar: '/avatars/emma.jpg',
    service: 'Home Removal',
  },
];

const stats = [
  {
    number: '50,000+',
    label: 'Happy Customers',
    icon: FaStar,
    color: 'yellow',
  },
  { number: '95%', label: 'On-Time Delivery', icon: FaClock, color: 'green' },
  { number: '24/7', label: 'Customer Support', icon: FaPhone, color: 'blue' },
  { number: '£50', label: 'Starting Price', icon: FaTruck, color: 'neon' },
];

export default function HomePageContent() {
  const bgColor = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box
      bg={bgColor}
      py={{ base: 8, md: 16 }}
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
        opacity={0.02}
        background="radial-gradient(circle at 20% 80%, rgba(0,194,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(0,209,143,0.1) 0%, transparent 50%)"
        pointerEvents="none"
      />

      <Container maxW="7xl">
        <VStack spacing={{ base: 12, md: 20 }}>
          {/* Hero Section */}
          <Hero />

          {/* Hero Message Section */}
          <HeroMessage />

          {/* Service Map Section */}
          <ServiceMapSection />

          {/* Stats Section */}
          <Box w="full" py={{ base: 12, md: 16 }} bg="bg.surface" borderRadius="2xl">
            <VStack spacing={{ base: 8, md: 12 }}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 } as any}
                textAlign="center"
              >
                <Heading
                  size={{ base: 'lg', md: 'xl' }}
                  mb={4}
                  color="text.primary"
                >
                  Trusted by Thousands
                </Heading>
                <Text
                  color={textColor}
                  maxW="2xl"
                  mx="auto"
                  fontSize={{ base: 'sm', md: 'md' }}
                >
                  Our numbers speak for themselves
                </Text>
              </MotionBox>

              <SimpleGrid
                columns={{ base: 2, md: 4 }}
                spacing={{ base: 6, md: 8 }}
                w="full"
              >
                {stats.map((stat, index) => (
                  <MotionBox
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.1 } as any}
                    textAlign="center"
                  >
                    <Box
                      p={{ base: 4, md: 6 }}
                      borderRadius="2xl"
                      borderWidth="2px"
                      borderColor="#00C2FF"
                      bg="bg.card"
                      _hover={{
                        shadow: '0 0 30px rgba(0,194,255,0.5)',
                        transform: 'translateY(-4px)',
                        borderColor: `${stat.color}.400`,
                      }}
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      position="relative"
                      overflow="visible"
                      boxShadow="0 0 20px rgba(0,194,255,0.3)"
                      className="stat-card-neon"
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: '-2px',
                        left: '-2px',
                        right: '-2px',
                        bottom: '-2px',
                        background: 'linear-gradient(90deg, #00C2FF, #00D18F, #00C2FF, #00D18F)',
                        backgroundSize: '300% 300%',
                        borderRadius: '2xl',
                        zIndex: -1,
                        filter: 'blur(8px)',
                        opacity: 0.6,
                        animation: 'neon-glow 3s ease-in-out infinite',
                      }}
                      _after={{
                        content: '""',
                        position: 'absolute',
                        width: '12px',
                        height: '12px',
                        background: 'radial-gradient(circle, white 0%, rgba(255,255,255,0.8) 30%, transparent 70%)',
                        borderRadius: 'full',
                        boxShadow: '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(0,194,255,0.6)',
                        zIndex: 10,
                        animation: 'light-point-move 3s linear infinite',
                      }}
                    >
                      <VStack spacing={3} position="relative" zIndex={1}>
                        <Box
                          p={3}
                          borderRadius="xl"
                          bg={`${stat.color}.500`}
                          color="white"
                          boxSize="60px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow={`0 0 20px rgba(0,0,0,0.2)`}
                        >
                          <Icon as={stat.icon} boxSize={6} />
                        </Box>
                        <Text
                          fontSize={{ base: '2xl', md: '3xl' }}
                          fontWeight="bold"
                          color={`${stat.color}.500`}
                        >
                          {stat.number}
                        </Text>
                        <Text
                          color="text.secondary"
                          fontSize={{ base: 'xs', md: 'sm' }}
                          fontWeight="medium"
                        >
                          {stat.label}
                        </Text>
                      </VStack>
                    </Box>
                  </MotionBox>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>

          {/* Features Grid */}
          <Box w="full">
            <VStack spacing={{ base: 8, md: 12 }}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 } as any}
                textAlign="center"
              >
                <Heading
                  size={{ base: 'lg', md: 'xl' }}
                  mb={4}
                  color="text.primary"
                >
                  Why Choose Speedy Van?
                </Heading>
                <Text
                  color={textColor}
                  maxW="2xl"
                  mx="auto"
                  fontSize={{ base: 'sm', md: 'md' }}
                >
                  We provide comprehensive moving solutions tailored to your
                  needs
                </Text>
              </MotionBox>

              <SimpleGrid
                columns={{ base: 1, sm: 2, lg: 4 }}
                spacing={{ base: 6, md: 8 }}
                w="full"
              >
                {features.map((feature, index) => (
                  <MotionBox
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 } as any}
                    textAlign="center"
                  >
                    <Box
                      p={{ base: 6, md: 8 }}
                      borderRadius="2xl"
                      borderWidth="2px"
                      borderColor="#00C2FF"
                      bg="bg.card"
                      _hover={{
                        shadow: '0 0 30px rgba(0,194,255,0.5)',
                        transform: 'translateY(-6px)',
                        borderColor: `${feature.color}.400`,
                      }}
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      position="relative"
                      overflow="visible"
                      boxShadow="0 0 20px rgba(0,194,255,0.3)"
                      className="stat-card-neon"
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: '-2px',
                        left: '-2px',
                        right: '-2px',
                        bottom: '-2px',
                        background: 'linear-gradient(90deg, #00C2FF, #00D18F, #00C2FF, #00D18F)',
                        backgroundSize: '300% 300%',
                        borderRadius: '2xl',
                        zIndex: -1,
                        filter: 'blur(8px)',
                        opacity: 0.6,
                        animation: 'neon-glow 3s ease-in-out infinite',
                      }}
                      _after={{
                        content: '""',
                        position: 'absolute',
                        width: '12px',
                        height: '12px',
                        background: 'radial-gradient(circle, white 0%, rgba(255,255,255,0.8) 30%, transparent 70%)',
                        borderRadius: 'full',
                        boxShadow: '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(0,194,255,0.6)',
                        zIndex: 10,
                        animation: 'light-point-move 3s linear infinite',
                      }}
                    >
                      <VStack spacing={4} position="relative" zIndex={1}>
                        <Box
                          p={4}
                          borderRadius="xl"
                          bgGradient={feature.gradient}
                          color="white"
                          boxSize="80px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          boxShadow="0 8px 25px rgba(0,0,0,0.15)"
                        >
                          <Icon as={feature.icon} boxSize={8} />
                        </Box>
                        <Heading
                          size={{ base: 'md', md: 'lg' }}
                          mb={3}
                          color="text.primary"
                        >
                          {feature.title}
                        </Heading>
                        <Text
                          color={textColor}
                          fontSize={{ base: 'sm', md: 'md' }}
                          lineHeight="1.6"
                        >
                          {feature.description}
                        </Text>
                      </VStack>
                    </Box>
                  </MotionBox>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>

          {/* Services Section */}
          <Box w="full" bg="bg.surface" py={{ base: 12, md: 16 }} borderRadius="2xl">
            <VStack spacing={{ base: 8, md: 12 }}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.5 } as any}
                textAlign="center"
              >
                <Heading
                  size={{ base: 'lg', md: 'xl' }}
                  mb={4}
                  color="text.primary"
                >
                  Our Premium Services
                </Heading>
                <Text
                  color={textColor}
                  maxW="2xl"
                  mx="auto"
                  fontSize={{ base: 'sm', md: 'lg' }}
                >
                  Professional moving solutions for every need
                </Text>
              </MotionBox>

              <SimpleGrid
                columns={{ base: 1, md: 2, lg: 3 }}
                spacing={{ base: 6, md: 8 }}
                w="full"
              >
                {services.map((service, index) => (
                  <MotionBox
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.6 + index * 0.1 } as any}
                  >
                    <Card
                      p={{ base: 6, md: 8 }}
                      borderRadius="2xl"
                      borderWidth="2px"
                      borderColor="#00C2FF"
                      bg="dark.800"
                      _hover={{
                        shadow: '0 0 30px rgba(0,194,255,0.5)',
                        transform: 'translateY(-8px)',
                        borderColor: 'neon.400',
                      }}
                      transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
                      position="relative"
                      overflow="visible"
                      boxShadow="0 0 20px rgba(0,194,255,0.3)"
                      cursor="pointer"
                      className="stat-card-neon"
                      sx={{
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '-2px',
                          left: '-2px',
                          right: '-2px',
                          bottom: '-2px',
                          background: 'linear-gradient(90deg, #00C2FF, #00D18F, #00C2FF, #00D18F)',
                          backgroundSize: '300% 300%',
                          borderRadius: '2xl',
                          zIndex: -1,
                          filter: 'blur(8px)',
                          opacity: 0.6,
                          animation: 'neon-glow 3s ease-in-out infinite',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          width: '12px',
                          height: '12px',
                          background: 'radial-gradient(circle, white 0%, rgba(255,255,255,0.8) 30%, transparent 70%)',
                          borderRadius: 'full',
                          boxShadow: '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(0,194,255,0.6)',
                          zIndex: 10,
                          animation: 'light-point-move 3s linear infinite',
                        },
                      }}
                    >

                      <VStack
                        spacing={{ base: 4, md: 6 }}
                        align="center"
                        textAlign="center"
                      >
                        <Box
                          p={{ base: 3, md: 4 }}
                          borderRadius="full"
                          bg="neon.500"
                          color="white"
                          fontSize={{ base: '2xl', md: '3xl' }}
                          mb={2}
                          boxShadow="0 8px 25px rgba(0,194,255,0.3)"
                        >
                          {service.emoji}
                        </Box>
                        <Icon
                          as={service.icon}
                          boxSize={{ base: 8, md: 10 }}
                          color="neon.400"
                        />
                        <Heading
                          size={{ base: 'md', md: 'lg' }}
                          color="white"
                          mb={3}
                        >
                          {service.title}
                        </Heading>
                        <Text
                          color="gray.300"
                          fontSize={{ base: 'sm', md: 'md' }}
                          lineHeight="1.6"
                          mb={4}
                        >
                          {service.description}
                        </Text>

                        {/* Service Features */}
                        <VStack spacing={2} align="start" w="full">
                          {service.features.map((feature, idx) => (
                            <HStack key={idx} spacing={2}>
                              <Icon
                                as={FaCheckCircle}
                                color="green.400"
                                boxSize={4}
                              />
                              <Text color="gray.400" fontSize="xs">
                                {feature}
                              </Text>
                            </HStack>
                          ))}
                        </VStack>
                      </VStack>
                    </Card>
                  </MotionBox>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>

          {/* Customer Trust (Testimonials) */}
          <Box w="full">
            <VStack spacing={{ base: 8, md: 12 }}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 } as any}
                textAlign="center"
              >
                <Heading
                  size={{ base: 'lg', md: 'xl' }}
                  mb={4}
                  color="text.primary"
                >
                  Trusted by Thousands
                </Heading>
                <Text
                  color={textColor}
                  maxW="2xl"
                  mx="auto"
                  fontSize={{ base: 'sm', md: 'lg' }}
                >
                  Real customers, real experiences
                </Text>
              </MotionBox>

              <SimpleGrid
                columns={{ base: 1, md: 3 }}
                spacing={{ base: 6, md: 8 }}
                w="full"
              >
                {testimonials.map((testimonial, index) => (
                  <MotionBox
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.8 + index * 0.1 } as any}
                  >
                    <Card
                      p={{ base: 6, md: 8 }}
                      borderRadius="2xl"
                      borderWidth="2px"
                      borderColor="#00C2FF"
                      bg="dark.800"
                      _hover={{
                        shadow: '0 0 30px rgba(0,194,255,0.5)',
                        transform: 'translateY(-4px)',
                      }}
                      transition="all 0.3s ease"
                      position="relative"
                      overflow="visible"
                      boxShadow="0 0 20px rgba(0,194,255,0.3)"
                      className="stat-card-neon"
                      sx={{
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '-2px',
                          left: '-2px',
                          right: '-2px',
                          bottom: '-2px',
                          background: 'linear-gradient(90deg, #00C2FF, #00D18F, #00C2FF, #00D18F)',
                          backgroundSize: '300% 300%',
                          borderRadius: '2xl',
                          zIndex: -1,
                          filter: 'blur(8px)',
                          opacity: 0.6,
                          animation: 'neon-glow 3s ease-in-out infinite',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          width: '12px',
                          height: '12px',
                          background: 'radial-gradient(circle, white 0%, rgba(255,255,255,0.8) 30%, transparent 70%)',
                          borderRadius: 'full',
                          boxShadow: '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(0,194,255,0.6)',
                          zIndex: 10,
                          animation: 'light-point-move 3s linear infinite',
                        },
                      }}
                    >

                      <VStack spacing={{ base: 4, md: 6 }} align="stretch">
                        {/* Service Badge */}
                        <Badge
                          colorScheme="neon"
                          variant="outline"
                          size="sm"
                          alignSelf="start"
                          px={3}
                          py={1}
                          borderRadius="full"
                          fontSize="xs"
                          borderColor="neon.400"
                        >
                          {testimonial.service}
                        </Badge>

                        <HStack spacing={3} mb={3}>
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Icon
                              key={i}
                              as={FaStar}
                              color="neon.400"
                              boxSize={4}
                            />
                          ))}
                        </HStack>

                        <Text
                          color="gray.200"
                          fontSize={{ base: 'sm', md: 'md' }}
                          lineHeight="1.6"
                          fontStyle="italic"
                          mb={4}
                        >
                          "{testimonial.quote}"
                        </Text>

                        <HStack spacing={4}>
                          <Avatar
                            size={{ base: 'md', md: 'lg' }}
                            name={testimonial.name}
                            bg="neon.500"
                            src={testimonial.avatar}
                          />
                          <VStack spacing={1} align="start">
                            <Text
                              fontWeight="bold"
                              color="white"
                              fontSize={{ base: 'sm', md: 'md' }}
                            >
                              {testimonial.name}
                            </Text>
                            <HStack spacing={2}>
                              <Icon
                                as={FaMapMarkerAlt}
                                color="neon.400"
                                boxSize={3}
                              />
                              <Text
                                color="neon.400"
                                fontSize={{ base: 'xs', md: 'sm' }}
                              >
                                {testimonial.city}
                              </Text>
                            </HStack>
                          </VStack>
                        </HStack>
                      </VStack>
                    </Card>
                  </MotionBox>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>

          {/* Contact Section */}
          <Box w="full" py={{ base: 12, md: 16 }}>
            <VStack spacing={{ base: 8, md: 12 }}>
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.9 } as any}
                textAlign="center"
              >
                <Heading
                  size={{ base: 'lg', md: 'xl' }}
                  mb={4}
                  color="text.primary"
                >
                  Need Help? Get in Touch
                </Heading>
                <Text
                  color={textColor}
                  maxW="2xl"
                  mx="auto"
                  fontSize={{ base: 'sm', md: 'md' }}
                >
                  Our team is here to help with any questions or special
                  requests
                </Text>
              </MotionBox>

              <SimpleGrid
                columns={{ base: 1, md: 3 }}
                spacing={{ base: 6, md: 8 }}
                w="full"
              >
                {[
                  {
                    icon: FaPhone,
                    title: 'Call Us',
                    contact: '01202129764',
                    action: 'Call Now',
                  },
                  {
                    icon: FaEnvelope,
                    title: 'Email Us',
                    contact: 'support@speedy-van.co.uk',
                    action: 'Send Email',
                  },
                  {
                    icon: FaMapMarkerAlt,
                    title: 'Visit Us',
                    contact: 'London, UK',
                    action: 'Get Directions',
                  },
                ].map((contact, index) => (
                  <MotionBox
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 1.0 + index * 0.1 } as any}
                  >
                    <Box
                      p={{ base: 6, md: 8 }}
                      borderRadius="2xl"
                      borderWidth="2px"
                      borderColor="border.primary"
                      bg="bg.card"
                      _hover={{
                        shadow: 'xl',
                        transform: 'translateY(-4px)',
                        borderColor: 'neon.400',
                      }}
                      transition="all 0.3s ease"
                      textAlign="center"
                    >
                      <VStack spacing={4}>
                        <Box
                          p={4}
                          borderRadius="xl"
                          bg="neon.500"
                          color="white"
                          boxSize="60px"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          mx="auto"
                        >
                          <Icon as={contact.icon} boxSize={6} />
                        </Box>
                        <Heading size="md" color="text.primary">
                          {contact.title}
                        </Heading>
                        <Text color="text.secondary" fontSize="md">
                          {contact.contact}
                        </Text>
                        <Button
                          size="sm"
                          variant="outline"
                          colorScheme="neon"
                          rightIcon={<FaArrowRight />}
                          _hover={{
                            bg: 'neon.500',
                            color: 'white',
                          }}
                        >
                          {contact.action}
                        </Button>
                      </VStack>
                    </Box>
                  </MotionBox>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>

          {/* Final Call-to-Action */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1.1 } as any}
            w="full"
            textAlign="center"
            py={{ base: 12, md: 20 }}
            px={{ base: 6, md: 12 }}
            borderRadius="3xl"
            borderWidth="2px"
            borderColor="#00C2FF"
            bg="bg.card"
            position="relative"
            overflow="visible"
            boxShadow="0 0 20px rgba(0,194,255,0.3)"
            className="stat-card-neon"
            sx={{
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-2px',
                left: '-2px',
                right: '-2px',
                bottom: '-2px',
                background: 'linear-gradient(90deg, #00C2FF, #00D18F, #00C2FF, #00D18F)',
                backgroundSize: '300% 300%',
                borderRadius: '3xl',
                zIndex: -1,
                filter: 'blur(8px)',
                opacity: 0.6,
                animation: 'neon-glow 3s ease-in-out infinite',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                width: '12px',
                height: '12px',
                background: 'radial-gradient(circle, white 0%, rgba(255,255,255,0.8) 30%, transparent 70%)',
                borderRadius: 'full',
                boxShadow: '0 0 15px rgba(255,255,255,0.9), 0 0 30px rgba(0,194,255,0.6)',
                zIndex: 10,
                animation: 'light-point-move 3s linear infinite',
              },
            }}
          >

            <VStack
              spacing={{ base: 8, md: 10 }}
              position="relative"
              zIndex={1}
            >
              <Heading size={{ base: 'xl', md: '2xl' }} color="text.primary" mb={4}>
                Ready to Move with Confidence?
              </Heading>
              <Text
                color="text.secondary"
                fontSize={{ base: 'md', md: 'xl' }}
                maxW="3xl"
                mx="auto"
                lineHeight="1.6"
              >
                Join thousands of satisfied customers who trust Speedy Van for
                their moving needs. Get your instant quote today and experience
                the difference.
              </Text>
              <HStack spacing={4} flexWrap="wrap" justify="center">
                <Button
                  size={{ base: 'lg', md: 'xl' }}
                  variant="primary"
                  bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                  color="white"
                  _hover={{
                    bg: 'linear-gradient(135deg, #00D18F, #00C2FF)',
                    shadow: 'neon.glow',
                    transform: 'translateY(-2px)',
                  }}
                  _active={{
                    bg: 'linear-gradient(135deg, #00B8E6, #00C2FF)',
                  }}
                  px={{ base: 8, md: 10 }}
                  py={{ base: 6, md: 8 }}
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="bold"
                  borderRadius="xl"
                  transition="all 0.3s ease"
                  rightIcon={<FaArrowRight />}
                  onClick={() => (window.location.href = '/booking-luxury')}
                >
                  Get Your Quote
                </Button>
                <Button
                  size={{ base: 'lg', md: 'xl' }}
                  variant="outline"
                  borderColor="neon.400"
                  color="neon.300"
                  _hover={{
                    bg: 'neon.400',
                    color: 'black',
                    transform: 'translateY(-2px)',
                  }}
                  px={{ base: 8, md: 10 }}
                  py={{ base: 6, md: 8 }}
                  fontSize={{ base: 'md', md: 'lg' }}
                  fontWeight="semibold"
                  borderRadius="xl"
                  transition="all 0.3s ease"
                  leftIcon={<FaTruck />}
                  onClick={() => (window.location.href = '/track')}
                >
                  Track Move
                </Button>
              </HStack>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>

      {/* Home Footer */}
      <HomeFooter />

      {/* Trustpilot Widget Section */}
      <TrustpilotWidget />
    </Box>
  );
}
