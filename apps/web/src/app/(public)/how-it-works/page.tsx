'use client';

import type { Metadata } from 'next';
import NextLink from 'next/link';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Icon,
  Link as ChakraLink,
  SimpleGrid,
  Text,
  VStack,
  HStack,
  Badge,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { FaMapMarkerAlt, FaBoxes, FaCreditCard, FaCheckCircle, FaRocket, FaBolt, FaShieldAlt, FaClock } from 'react-icons/fa';
import { ROUTES } from '@/lib/routing';
import MobileHeader from '@/components/mobile/MobileHeader';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

interface StepProps {
  n: string;
  title: string;
  description: string;
  icon: any;
  features: string[];
  cta?: {
    text: string;
    href: string;
  };
  delay?: number;
}

function Step({ n, title, description, icon, features, cta, delay = 0 }: StepProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  
  const gradients = [
    'linear(to-br, purple.400, pink.400)',
    'linear(to-br, blue.400, cyan.400)',
    'linear(to-br, green.400, teal.400)',
  ];
  
  const bgGradient = gradients[parseInt(n) - 1];
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const cardBg = useColorModeValue('white', 'gray.800');
  const shadowColor = useColorModeValue('rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)');

  return (
    <MotionBox
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay }}
      position="relative"
      h="full"
      w="full"
      maxW={{ base: '100%', md: 'none' }}
    >
      <Box
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="3xl"
        p={{ base: 6, md: 8 }}
        h="full"
        w="full"
        position="relative"
        overflow="hidden"
        boxShadow={`0 10px 40px ${shadowColor}`}
        _hover={{
          transform: 'translateY(-8px)',
          boxShadow: `0 20px 60px ${shadowColor}`,
        }}
        transition="all 0.3s ease"
        sx={{
          '@media (max-width: 767px)': {
            width: '100% !important',
            maxWidth: '100% !important',
            minWidth: '100% !important',
          }
        }}
      >
        {/* Background gradient accent */}
        <Box
          position="absolute"
          top="-50%"
          right="-20%"
          w="200px"
          h="200px"
          bgGradient={bgGradient}
          opacity={0.1}
          borderRadius="full"
          filter="blur(40px)"
        />

        {/* Step number badge */}
        <Flex
          position="absolute"
          top={4}
          right={4}
          w="50px"
          h="50px"
          bgGradient={bgGradient}
          borderRadius="full"
          align="center"
          justify="center"
          fontWeight="bold"
          fontSize="xl"
          color="white"
          boxShadow="lg"
        >
          {n}
        </Flex>

        {/* Icon */}
        <Flex
          w={{ base: '60px', md: '70px' }}
          h={{ base: '60px', md: '70px' }}
          bgGradient={bgGradient}
          borderRadius="2xl"
          align="center"
          justify="center"
          mb={4}
          boxShadow="xl"
        >
          <Icon as={icon} boxSize={{ base: 7, md: 8 }} color="white" />
        </Flex>

        <VStack align="stretch" spacing={4}>
          <Box>
            <Text fontSize="xs" fontWeight="semibold" color="purple.500" textTransform="uppercase" letterSpacing="wide" mb={2}>
              Step {n}
            </Text>
            <Heading as="h3" size={{ base: 'md', md: 'lg' }} mb={3}>
              {title}
            </Heading>
            <Text fontSize="sm" opacity={0.8} lineHeight="tall">
              {description}
            </Text>
          </Box>

          <Divider />

          <VStack align="stretch" spacing={2}>
            {features.map((feature, idx) => (
              <Flex key={idx} align="center" gap={2}>
                <Icon as={FaCheckCircle} color="green.500" boxSize={4} flexShrink={0} />
                <Text fontSize="xs" opacity={0.9}>
                  {feature}
                </Text>
              </Flex>
            ))}
          </VStack>

          {cta && (
            <Button
              as={NextLink}
              href={cta.href}
              size="sm"
              bgGradient={bgGradient}
              color="white"
              _hover={{
                transform: 'scale(1.05)',
                boxShadow: 'lg',
              }}
              transition="all 0.2s"
              mt={2}
            >
              {cta.text}
            </Button>
          )}
        </VStack>
      </Box>
    </MotionBox>
  );
}

interface FeatureCardProps {
  icon: any;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <MotionBox
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
      w="full"
      maxW={{ base: '100%', md: 'none' }}
    >
      <Flex
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="xl"
        p={5}
        align="center"
        gap={4}
        h="full"
        w="full"
        boxShadow="sm"
        _hover={{ boxShadow: 'md' }}
        transition="all 0.3s"
        sx={{
          '@media (max-width: 767px)': {
            width: '100% !important',
            maxWidth: '100% !important',
          }
        }}
      >
        <Flex
          w="45px"
          h="45px"
          bg="purple.100"
          borderRadius="lg"
          align="center"
          justify="center"
          flexShrink={0}
        >
          <Icon as={icon} boxSize={5} color="purple.600" />
        </Flex>
        <VStack align="start" spacing={0} flex={1}>
          <Text fontSize="sm" fontWeight="semibold">
            {title}
          </Text>
          <Text fontSize="xs" opacity={0.7}>
            {description}
          </Text>
        </VStack>
      </Flex>
    </MotionBox>
  );
}

export default function HowItWorksPage() {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true });
  
  const heroBg = useColorModeValue(
    'linear(to-br, purple.50, pink.50, blue.50)',
    'linear(to-br, gray.900, purple.900, gray.900)'
  );
  const sectionBg = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box as="main">
      <MobileHeader />
      
      {/* Hero Section */}
      <Box
        bgGradient={heroBg}
        pt={{ base: 24, md: 32 }}
        pb={{ base: 16, md: 20 }}
        position="relative"
        overflow="hidden"
      >
        {/* Decorative elements */}
        <Box
          position="absolute"
          top="10%"
          left="5%"
          w="300px"
          h="300px"
          bgGradient="linear(to-br, purple.400, pink.400)"
          opacity={0.1}
          borderRadius="full"
          filter="blur(80px)"
        />
        <Box
          position="absolute"
          bottom="10%"
          right="5%"
          w="400px"
          h="400px"
          bgGradient="linear(to-br, blue.400, cyan.400)"
          opacity={0.1}
          borderRadius="full"
          filter="blur(100px)"
        />

        <Container maxW="6xl" position="relative">
          <MotionBox
            ref={headerRef}
            initial={{ opacity: 0, y: 30 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8 }}
            textAlign="center"
          >
            <Badge
              colorScheme="purple"
              fontSize="sm"
              px={4}
              py={2}
              borderRadius="full"
              mb={6}
              textTransform="uppercase"
              letterSpacing="wide"
            >
              Simple & Fast
            </Badge>
            
            <Heading
              as="h1"
              size={{ base: '2xl', md: '3xl', lg: '4xl' }}
              mb={6}
              bgGradient="linear(to-r, purple.600, pink.600, blue.600)"
              bgClip="text"
              fontWeight="extrabold"
            >
              How Speedy Van Works
            </Heading>
            
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              opacity={0.8}
              maxW="2xl"
              mx="auto"
              mb={8}
              lineHeight="tall"
            >
              Book your move in 3 simple steps. Get instant pricing, automatic confirmation, and live tracking.
            </Text>

            <HStack justify="center" spacing={4} flexWrap="wrap">
              <Button
                as={NextLink}
                href={ROUTES.SHARED.BOOKING_LUXURY}
                size="lg"
                bgGradient="linear(to-r, purple.500, pink.500)"
                color="white"
                px={8}
                _hover={{
                  bgGradient: 'linear(to-r, purple.600, pink.600)',
                  transform: 'scale(1.05)',
                }}
                rightIcon={<FaRocket />}
                boxShadow="xl"
              >
                Start Booking Now
              </Button>
              <Button
                as={NextLink}
                href="/contact"
                size="lg"
                variant="outline"
                colorScheme="purple"
                px={8}
              >
                Contact Us
              </Button>
            </HStack>
          </MotionBox>
        </Container>
      </Box>

      {/* Steps Section */}
      <Container maxW="6xl" py={{ base: 16, md: 24 }} px={{ base: 4, md: 6 }}>
        <SimpleGrid 
          columns={{ base: 1, md: 2, lg: 3 }} 
          gap={{ base: 6, md: 8, lg: 10 }}
          w="full"
          sx={{
            '@media (max-width: 767px)': {
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }
          }}
        >
          <Step
            n="1"
            title="Enter Addresses"
            description="Enter your pickup and drop-off locations. Our system uses Mapbox for accurate geocoding and calculates the exact distance and route for transparent pricing."
            icon={FaMapMarkerAlt}
            features={[
              'Mapbox geocoding for accuracy',
              'Real-time distance calculation',
              'Transparent route preview',
              'Multiple drop-off support',
            ]}
            cta={{
              text: 'Start Booking',
              href: ROUTES.SHARED.BOOKING_LUXURY,
            }}
            delay={0.1}
          />

          <Step
            n="2"
            title="Select Items & Schedule"
            description="Choose from our comprehensive UK removal items catalog (666+ items). Pick your property type and select your preferred date and time slot."
            icon={FaBoxes}
            features={[
              'AI Assistant for quick item selection',
              'Dynamic pricing based on distance & items',
              'Flexible timing with discounts',
              'Instant price breakdown',
            ]}
            delay={0.2}
          />

          <Step
            n="3"
            title="Payment & Confirmation"
            description="Pay securely with Stripe. Get instant confirmation via email and SMS with your booking reference (e.g., SV-000001)."
            icon={FaCreditCard}
            features={[
              'Secure Stripe payment processing',
              'Email & SMS instant confirmation',
              'Real-time booking tracking',
              'Digital receipt & invoice',
            ]}
            cta={{
              text: 'View Your Bookings',
              href: ROUTES.CUSTOMER.BOOKINGS,
            }}
            delay={0.3}
          />
        </SimpleGrid>
      </Container>

      {/* Features Section */}
      <Box bg={sectionBg} py={{ base: 16, md: 24 }}>
        <Container maxW="6xl">
          <VStack spacing={12}>
            {/* What You Get */}
            <Box w="full">
              <Heading
                as="h2"
                size={{ base: 'xl', md: '2xl' }}
                textAlign="center"
                mb={10}
                bgGradient="linear(to-r, purple.600, pink.600)"
                bgClip="text"
              >
                What You Get
              </Heading>
              
              <SimpleGrid 
                columns={{ base: 1, sm: 2, lg: 4 }} 
                gap={4}
                sx={{
                  '@media (max-width: 767px)': {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                  }
                }}
              >
                <FeatureCard
                  icon={FaBolt}
                  title="Instant Booking"
                  description="No phone calls needed"
                />
                <FeatureCard
                  icon={FaCheckCircle}
                  title="Transparent Pricing"
                  description="Clear breakdown, no hidden fees"
                />
                <FeatureCard
                  icon={FaRocket}
                  title="Auto Assignment"
                  description="Best driver matched instantly"
                />
                <FeatureCard
                  icon={FaClock}
                  title="Real-time Updates"
                  description="Live status via Pusher"
                />
                <FeatureCard
                  icon={FaMapMarkerAlt}
                  title="Live Tracking"
                  description="Mapbox powered tracking"
                />
                <FeatureCard
                  icon={FaShieldAlt}
                  title="Secure Payments"
                  description="Stripe encrypted checkout"
                />
                <FeatureCard
                  icon={FaCheckCircle}
                  title="Email & SMS"
                  description="Instant notifications"
                />
                <FeatureCard
                  icon={FaCreditCard}
                  title="Digital Receipts"
                  description="Invoices & proof of delivery"
                />
              </SimpleGrid>
            </Box>

            <Divider />

            {/* Advanced Features */}
            <Box
              w="full"
              bg={useColorModeValue('white', 'gray.800')}
              borderRadius="3xl"
              p={{ base: 8, md: 12 }}
              boxShadow="2xl"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="-10%"
                right="-10%"
                w="300px"
                h="300px"
                bgGradient="linear(to-br, purple.400, pink.400)"
                opacity={0.1}
                borderRadius="full"
                filter="blur(80px)"
              />
              
              <VStack spacing={8} position="relative">
                <Box textAlign="center">
                  <Badge colorScheme="purple" mb={4} fontSize="sm" px={4} py={2} borderRadius="full">
                    Powered by AI
                  </Badge>
                  <Heading
                    as="h2"
                    size={{ base: 'xl', md: '2xl' }}
                    mb={4}
                    bgGradient="linear(to-r, purple.600, pink.600)"
                    bgClip="text"
                  >
                    Advanced Features
                  </Heading>
                  <Text opacity={0.7} maxW="2xl" mx="auto">
                    Experience the next generation of moving services with our cutting-edge technology
                  </Text>
                </Box>

                <SimpleGrid 
                  columns={{ base: 1, md: 2 }} 
                  gap={6} 
                  w="full"
                  sx={{
                    '@media (max-width: 767px)': {
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.5rem',
                    }
                  }}
                >
                  <Box
                    p={6}
                    bg={useColorModeValue('purple.50', 'gray.700')}
                    borderRadius="2xl"
                    borderLeft="4px solid"
                    borderColor="purple.500"
                    w="full"
                    sx={{
                      '@media (max-width: 767px)': {
                        width: '100% !important',
                        maxWidth: '100% !important',
                      }
                    }}
                  >
                    <Text fontSize="2xl" mb={2}>🤖</Text>
                    <Heading as="h3" size="sm" mb={2}>
                      AI-Powered Item Selection
                    </Heading>
                    <Text fontSize="sm" opacity={0.8}>
                      Describe your items in natural language and our AI assistant adds them automatically from our 666+ item database.
                    </Text>
                  </Box>

                  <Box
                    p={6}
                    bg={useColorModeValue('blue.50', 'gray.700')}
                    borderRadius="2xl"
                    borderLeft="4px solid"
                    borderColor="blue.500"
                    w="full"
                    sx={{
                      '@media (max-width: 767px)': {
                        width: '100% !important',
                        maxWidth: '100% !important',
                      }
                    }}
                  >
                    <Text fontSize="2xl" mb={2}>📊</Text>
                    <Heading as="h3" size="sm" mb={2}>
                      Smart Pricing Engine
                    </Heading>
                    <Text fontSize="sm" opacity={0.8}>
                      Dynamic pricing based on distance (Mapbox routing), item weight/volume, time slot, and demand.
                    </Text>
                  </Box>

                  <Box
                    p={6}
                    bg={useColorModeValue('green.50', 'gray.700')}
                    borderRadius="2xl"
                    borderLeft="4px solid"
                    borderColor="green.500"
                    w="full"
                    sx={{
                      '@media (max-width: 767px)': {
                        width: '100% !important',
                        maxWidth: '100% !important',
                      }
                    }}
                  >
                    <Text fontSize="2xl" mb={2}>🗺️</Text>
                    <Heading as="h3" size="sm" mb={2}>
                      Route Optimization
                    </Heading>
                    <Text fontSize="sm" opacity={0.8}>
                      Efficient routing for multiple drop-offs with Mapbox Directions API for fastest delivery.
                    </Text>
                  </Box>

                  <Box
                    p={6}
                    bg={useColorModeValue('pink.50', 'gray.700')}
                    borderRadius="2xl"
                    borderLeft="4px solid"
                    borderColor="pink.500"
                    w="full"
                    sx={{
                      '@media (max-width: 767px)': {
                        width: '100% !important',
                        maxWidth: '100% !important',
                      }
                    }}
                  >
                    <Text fontSize="2xl" mb={2}>📱</Text>
                    <Heading as="h3" size="sm" mb={2}>
                      Customer Dashboard
                    </Heading>
                    <Text fontSize="sm" opacity={0.8}>
                      Track all bookings, view history, download invoices, and manage your account from one place.
                    </Text>
                  </Box>
                </SimpleGrid>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box py={{ base: 16, md: 24 }}>
        <Container maxW="4xl">
          <MotionBox
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Box
              bgGradient="linear(to-br, purple.500, pink.500, blue.500)"
              borderRadius="3xl"
              p={{ base: 8, md: 12 }}
              textAlign="center"
              color="white"
              boxShadow="2xl"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                top="0"
                left="0"
                right="0"
                bottom="0"
                bgImage="radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)"
                bgSize="20px 20px"
                opacity={0.3}
              />
              
              <VStack spacing={6} position="relative">
                <Heading as="h2" size={{ base: 'xl', md: '2xl' }}>
                  Ready to Move?
                </Heading>
                <Text fontSize={{ base: 'md', md: 'lg' }} opacity={0.9} maxW="2xl">
                  Join thousands of satisfied customers who trust Speedy Van for their moving needs.
                  Get started in less than 2 minutes!
                </Text>
                <HStack spacing={4} flexWrap="wrap" justify="center">
                  <Button
                    as={NextLink}
                    href={ROUTES.SHARED.BOOKING_LUXURY}
                    size="lg"
                    bg="white"
                    color="purple.600"
                    px={8}
                    _hover={{
                      transform: 'scale(1.05)',
                      boxShadow: '2xl',
                    }}
                    rightIcon={<FaRocket />}
                  >
                    Book Your Move Now
                  </Button>
                  <Button
                    as={NextLink}
                    href={ROUTES.CUSTOMER.BOOKINGS}
                    size="lg"
                    variant="outline"
                    borderColor="white"
                    color="white"
                    px={8}
                    _hover={{
                      bg: 'whiteAlpha.200',
                    }}
                  >
                    Track Existing Booking
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </MotionBox>
        </Container>
      </Box>
    </Box>
  );
}
