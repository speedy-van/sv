'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Heading,
  Text,
  SimpleGrid,
  Avatar,
  Badge,
  Icon,
  Stack,
  useBreakpointValue,
  chakra,
  shouldForwardProp,
} from '@chakra-ui/react';
import Link from 'next/link';
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
  FaCheckCircle,
  FaPhone,
  FaArrowRight,
} from 'react-icons/fa';
import { TouchButton } from '@/components/mobile/TouchOptimizedComponents';
import MobileHeader from '@/components/mobile/MobileHeader';

// Import ServiceMapSection directly
import ServiceMapSection from '../../components/ServiceMapSection';

// Create motion components with proper prop filtering
const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    // Allow motion-specific props to pass through to Framer Motion
    if (isValidMotionProp(prop)) {
      return true;
    }
    // Use Chakra's shouldForwardProp for everything else (this handles Chakra UI props properly)
    return shouldForwardProp(prop);
  },
});

const MotionCard = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    // Allow motion-specific props to pass through to Framer Motion
    if (isValidMotionProp(prop)) {
      return true;
    }
    // Use Chakra's shouldForwardProp for everything else (this handles Chakra UI props properly)
    return shouldForwardProp(prop);
  },
});

// Mobile-optimized data structures
const features = [
  {
    icon: FaTruck,
    title: 'Fast & Reliable',
    description: 'Professional service with guaranteed delivery times',
    color: 'blue',
    gradient: 'linear(to-r, blue.400, blue.600)',
  },
  {
    icon: FaClock,
    title: '24/7 Support',
    description: 'Round-the-clock customer support',
    color: 'green',
    gradient: 'linear(to-r, green.400, green.600)',
  },
  {
    icon: FaShieldAlt,
    title: 'Fully Insured',
    description: 'Complete coverage for your belongings',
    color: 'purple',
    gradient: 'linear(to-r, purple.400, purple.600)',
  },
  {
    icon: FaStar,
    title: '5-Star Rated',
    description: 'Trusted by thousands of customers',
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
    title: 'Electronics',
    description: 'Safe transport of TVs, computers & appliances',
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
    title: 'Business',
    description: 'Professional corporate relocation services',
    emoji: '🏢',
    color: 'purple',
    features: ['Minimal downtime', 'Document security', 'After-hours service'],
  },
];

const testimonials = [
  {
    name: 'Sarah Mitchell',
    city: 'Manchester',
    quote:
      'Speedy Van moved my entire flat in under 3 hours! Professional and careful with my furniture.',
    rating: 5,
    avatar: '/What Our Customers Say/Sarah Mitchell.jpeg',
    service: 'Flat Removal',
  },
  {
    name: 'James Thompson',
    city: 'Birmingham',
    quote:
      'Best moving experience ever. They handled my electronics with care, and the price was exactly as quoted.',
    rating: 5,
    avatar: '/What Our Customers Say/James Thompson.jpeg',
    service: 'Electronics Move',
  },
  {
    name: 'Emma Davies',
    city: 'Leeds',
    quote:
      'From booking to delivery, everything was seamless. Punctual drivers and perfect condition delivery.',
    rating: 5,
    avatar: '/What Our Customers Say/Emma Davies.jpeg',
    service: 'Home Removal',
  },
];

const stats = [
  { number: '50K+', label: 'Happy Customers', icon: FaStar, color: 'yellow' },
  { number: '95%', label: 'On-Time', icon: FaClock, color: 'green' },
  { number: '24/7', label: 'Support', icon: FaPhone, color: 'blue' },
  { number: '£50', label: 'From', icon: FaTruck, color: 'neon' },
];

// Mobile Hero Section
const MobileHero: React.FC = () => {
  // Show video on all screen sizes with mobile optimization
  const isMobile = useBreakpointValue({ base: true, md: false });
  return (
    <Box
      className="mobile-hero"
      position="relative"
      minH={{ base: '100dvh', md: '100vh' }}
      h={{ base: '100dvh', md: '100vh' }}
      display="flex"
      alignItems="center"
      overflow="hidden"
      w="100%"
      maxW="100vw"
    >
      {/* Video Background - Now shows on all screen sizes */}
      {(
        <video
          autoPlay
          loop
          muted
          playsInline
          preload={isMobile ? "none" : "metadata"}
          poster="/android-chrome-512x512.png"
          aria-hidden
          tabIndex={-1}
          webkit-playsinline="true"
          x5-playsinline="true"
          x5-video-player-type="h5"
          x5-video-player-fullscreen="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            filter: 'brightness(0.6)',
            // Mobile optimizations
            ...(isMobile && {
              WebkitPlaysInline: true,
              playsInline: true,
            }),
          }}
          onLoadedData={() => {
            // Video loaded successfully - production ready
          }}
          onError={() => {
            // Video failed to load, fallback to background gradient handled by CSS
          }}
          onPlay={() => {
            // Video started playing - production ready
          }}
        >
          <source src="/videos/background.mp4" type="video/mp4" />
        </video>
      )}

      {/* Fallback Background */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width="100%"
        height="100%"
        bg="linear-gradient(135deg, rgba(0,194,255,0.8) 0%, rgba(0,209,143,0.8) 100%)"
        zIndex={-1}
      />

      {/* Dark Overlay for better text readability */}
      <Box
        position="absolute"
        top="0"
        left="0"
        width="100%"
        height="100%"
        bg="linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.4) 100%)"
        zIndex={1}
      />

  <Container 
    className="mobile-container"
    maxW="full" 
    px={{ base: 4, md: 6 }} 
    position="relative" 
    zIndex={1}
    w="100%"
    mx="auto"
    overflow="hidden"
  >
        <VStack spacing={{ base: 6, md: 8 }} textAlign="center">
          {/* Trust Indicators - Moved to top */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            {...({ transition: { duration: 0.8, ease: "easeOut", delay: 0.1 } } as any)}
          >
            <HStack spacing={3} justify="center" wrap="wrap" mb={4}>
              <Badge
                colorScheme="green"
                size="lg"
                px={4}
                py={2}
                borderRadius="full"
                bg="rgba(0,209,143,0.9)"
                color="white"
                fontWeight="bold"
                boxShadow="0 4px 15px rgba(0,209,143,0.3)"
              >
                <Icon as={FaShieldAlt} mr={2} boxSize={3} />
                Fully Insured
              </Badge>
              <Badge
                colorScheme="yellow"
                size="lg"
                px={4}
                py={2}
                borderRadius="full"
                bg="rgba(255,193,7,0.9)"
                color="black"
                fontWeight="bold"
                boxShadow="0 4px 15px rgba(255,193,7,0.3)"
              >
                <Icon as={FaStar} mr={2} boxSize={3} />
                5-Star Rated
              </Badge>
              <Badge
                colorScheme="blue"
                size="lg"
                px={4}
                py={2}
                borderRadius="full"
                bg="rgba(0,194,255,0.9)"
                color="white"
                fontWeight="bold"
                boxShadow="0 4px 15px rgba(0,194,255,0.3)"
              >
                <Icon as={FaClock} mr={2} boxSize={3} />
                24/7 Support
              </Badge>
            </HStack>
          </MotionBox>

          {/* Main Heading */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
            {...({ transition: { duration: 0.8, ease: "easeOut", delay: 0.3 } } as any)}
          >
            <Heading
              as="h1"
              size={{ base: '2xl', md: '3xl' }}
              color="white"
              mb={4}
              fontWeight="extrabold"
              lineHeight="shorter"
              textShadow="0 2px 10px rgba(0,0,0,0.5)"
              maxW="90%"
              mx="auto"
            >
              Professional Man and Van Service Across the UK
            </Heading>
          </MotionBox>

          {/* Subtitle */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
            {...({ transition: { duration: 0.8, ease: "easeOut", delay: 0.5 } } as any)}
            mt={{ base: 8, md: 0 }}
          >
            <Text
              fontSize={{ base: 'sm', md: 'md' }}
              color="white"
              opacity={0.95}
              maxW={{ base: '90%', md: '600px' }}
              lineHeight="tall"
              fontWeight="medium"
              textShadow="0 1px 5px rgba(0,0,0,0.3)"
            >
              Expert house removals, furniture delivery, and man and van services in London, Manchester, Birmingham, Glasgow, Edinburgh, Cardiff, Belfast, and all UK cities. Same day service from £25/hour with fully insured drivers.
            </Text>
          </MotionBox>

          {/* Enhanced CTA Buttons */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
            {...({ transition: { duration: 0.8, ease: "easeOut", delay: 0.7 } } as any)}
            w="full"
            maxW="500px"
          >
            <VStack spacing={4} w="full">
              {/* Primary CTA */}
              <TouchButton
                size="xl"
                bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                color="white"
                fontWeight="bold"
                px={8}
                py={6}
                fontSize="lg"
                borderRadius="2xl"
                rightIcon={<FaArrowRight />}
                boxShadow="0 8px 25px rgba(0,194,255,0.4)"
                _hover={{
                  bg: 'linear-gradient(135deg, #00D18F, #00C2FF)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 35px rgba(0,194,255,0.5)',
                }}
                fullWidth
                onClick={() => (window.location.href = '/booking-luxury')}
              >
                Book Your Move Now
              </TouchButton>

              {/* Secondary Actions */}
              <HStack spacing={3} w="full" justify="center">
                <TouchButton
                  size="lg"
                  variant="outline"
                  borderColor="white"
                  color="white"
                  bg="rgba(255,255,255,0.1)"
                  backdropFilter="blur(10px)"
                  leftIcon={<FaTruck />}
                  _hover={{
                    bg: 'rgba(255,255,255,0.2)',
                    borderColor: 'neon.400',
                    color: 'neon.400',
                    transform: 'translateY(-2px)',
                  }}
                  borderRadius="xl"
                  fontWeight="semibold"
                  flex={1}
                  onClick={() => (window.location.href = '/track')}
                >
                  Track Move
                </TouchButton>

                <TouchButton
                  size="lg"
                  variant="outline"
                  borderColor="white"
                  color="white"
                  bg="rgba(255,255,255,0.1)"
                  backdropFilter="blur(10px)"
                  leftIcon={<FaPhone />}
                  _hover={{
                    bg: 'rgba(255,255,255,0.2)',
                    borderColor: 'green.400',
                    color: 'green.400',
                    transform: 'translateY(-2px)',
                  }}
                  borderRadius="xl"
                  fontWeight="semibold"
                  flex={1}
                  onClick={() => window.open('tel:+441202129746')}
                >
                  Call Now
                </TouchButton>
              </HStack>
            </VStack>
          </MotionBox>

        </VStack>
      </Container>
    </Box>
  );
};

// Mobile Stats Section
const MobileStats: React.FC = () => {
  return (
    <Box className="mobile-stats" py={{ base: 12, md: 16 }}>
      <Container maxW="container.xl">
        <VStack spacing={8}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            {...({ transition: { duration: 0.6, ease: "easeOut" } } as any)}
            textAlign="center"
          >
            <Heading
              size={{ base: 'lg', md: 'xl' }}
              mb={4}
              color="text.primary"
            >
              Trusted by Thousands
            </Heading>
            <Text color="text.secondary" fontSize={{ base: 'md', md: 'lg' }}>
              Our numbers speak for themselves
            </Text>
          </MotionBox>

          <SimpleGrid
            columns={{ base: 2, md: 4 }}
            spacing={{ base: 4, md: 6 }}
            w="full"
          >
            {stats.map((stat, index) => (
              <MotionBox
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                {...({ transition: { duration: 0.6, ease: "easeOut", delay: index * 0.1 } } as any)}
              >
                <Box
                  p={{ base: 4, md: 6 }}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="border.primary"
                  bg="bg.card"
                  textAlign="center"
                  _hover={{
                    borderColor: `${stat.color}.400`,
                    boxShadow: 'lg',
                  }}
                >
                  <VStack spacing={3}>
                    <Box
                      p={2}
                      borderRadius="lg"
                      bg={`${stat.color}.500`}
                      color="white"
                      boxSize={{ base: '40px', md: '48px' }}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Icon as={stat.icon} boxSize={{ base: 4, md: 5 }} />
                    </Box>
                    <Text
                      fontSize={{ base: 'xl', md: '2xl' }}
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
      </Container>
    </Box>
  );
};

// Mobile Features Section
const MobileFeatures: React.FC = () => {
  return (
    <Box className="mobile-features" py={{ base: 12, md: 16 }} bg="bg.surface">
      <Container maxW="container.xl">
        <VStack spacing={8}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            {...({ transition: { duration: 0.6, ease: "easeOut" } } as any)}
            textAlign="center"
          >
            <Heading
              size={{ base: 'lg', md: 'xl' }}
              mb={4}
              color="text.primary"
            >
              Why Choose Speedy Van?
            </Heading>
            <Text color="text.secondary" fontSize={{ base: 'md', md: 'lg' }}>
              Professional moving solutions tailored to your needs
            </Text>
          </MotionBox>

          <SimpleGrid
            columns={{ base: 1, sm: 2 }}
            spacing={{ base: 4, md: 6 }}
            w="full"
          >
            {features.map((feature, index) => (
              <MotionCard
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                {...({ transition: { duration: 0.6, ease: "easeOut", delay: index * 0.1 } } as any)}
                p={{ base: 6, md: 8 }}
                borderRadius="xl"
                borderWidth="2px"
                borderColor="border.primary"
                bg="bg.card"
                _hover={{
                  borderColor: `${feature.color}.400`,
                  boxShadow: 'xl',
                  transform: 'translateY(-4px)',
                }}
                cursor="pointer"
              >
                <VStack spacing={4} textAlign="center">
                  <Box
                    p={3}
                    borderRadius="lg"
                    bgGradient={feature.gradient}
                    color="white"
                    boxSize={{ base: '60px', md: '70px' }}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="0 4px 15px rgba(0,0,0,0.2)"
                  >
                    <Icon as={feature.icon} boxSize={{ base: 6, md: 7 }} />
                  </Box>
                  <Heading size={{ base: 'md', md: 'lg' }} color="text.primary">
                    {feature.title}
                  </Heading>
                  <Text
                    color="text.secondary"
                    fontSize={{ base: 'sm', md: 'md' }}
                    lineHeight="tall"
                  >
                    {feature.description}
                  </Text>
                </VStack>
              </MotionCard>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

// Mobile Services Section
const MobileServices: React.FC = () => {
  return (
    <Box className="mobile-services" py={{ base: 12, md: 16 }}>
      <Container maxW="container.xl">
        <VStack spacing={8}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            {...({ transition: { duration: 0.6, ease: "easeOut" } } as any)}
            textAlign="center"
          >
            <Heading
              size={{ base: 'lg', md: 'xl' }}
              mb={4}
              color="text.primary"
            >
              Our Premium Services
            </Heading>
            <Text color="text.secondary" fontSize={{ base: 'md', md: 'lg' }}>
              Professional moving solutions for every need
            </Text>
          </MotionBox>

          <SimpleGrid
            columns={{ base: 1, md: 2 }}
            spacing={{ base: 4, md: 6 }}
            w="full"
          >
            {services.map((service, index) => (
              <MotionCard
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                {...({ transition: { duration: 0.6, ease: "easeOut", delay: index * 0.1 } } as any)}
                p={{ base: 6, md: 8 }}
                borderRadius="xl"
                borderWidth="2px"
                borderColor="neon.500"
                bg="dark.800"
                _hover={{
                  borderColor: 'neon.400',
                  boxShadow: '0 0 30px rgba(0,194,255,0.3)',
                  transform: 'translateY(-4px)',
                }}
                cursor="pointer"
                position="relative"
                overflow="hidden"
              >
                {/* Glow effect */}
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  width="100%"
                  height="100%"
                  bg="linear-gradient(135deg, rgba(0,194,255,0.05) 0%, transparent 50%)"
                  borderRadius="xl"
                  opacity={0}
                  _groupHover={{ opacity: 1 }}
                  transition="opacity 0.3s ease"
                />

                <VStack
                  spacing={4}
                  align="center"
                  textAlign="center"
                  position="relative"
                  zIndex={1}
                >
                  <HStack spacing={3} align="center">
                    <Box
                      p={2}
                      borderRadius="lg"
                      bg="neon.500"
                      color="white"
                      fontSize={{ base: 'xl', md: '2xl' }}
                      boxShadow="0 4px 15px rgba(0,194,255,0.3)"
                    >
                      {service.emoji}
                    </Box>
                    <Icon
                      as={service.icon}
                      boxSize={{ base: 6, md: 8 }}
                      color="neon.400"
                    />
                  </HStack>

                  <Heading size={{ base: 'md', md: 'lg' }} color="white">
                    {service.title}
                  </Heading>

                  <Text
                    color="gray.300"
                    fontSize={{ base: 'sm', md: 'md' }}
                    lineHeight="tall"
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
                          boxSize={3}
                        />
                        <Text color="gray.400" fontSize="xs">
                          {feature}
                        </Text>
                      </HStack>
                    ))}
                  </VStack>
                </VStack>
              </MotionCard>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

// Mobile Testimonials Section
const MobileTestimonials: React.FC = () => {
  return (
    <Box className="mobile-testimonials" py={{ base: 12, md: 16 }} bg="bg.surface">
      <Container maxW="container.xl">
        <VStack spacing={8}>
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            {...({ transition: { duration: 0.6, ease: "easeOut" } } as any)}
            textAlign="center"
          >
            <Heading
              size={{ base: 'lg', md: 'xl' }}
              mb={4}
              color="text.primary"
            >
              What Our Customers Say
            </Heading>
            <Text color="text.secondary" fontSize={{ base: 'md', md: 'lg' }}>
              Real reviews from real customers
            </Text>
          </MotionBox>

          <SimpleGrid
            columns={{ base: 1, md: 2, lg: 3 }}
            spacing={{ base: 4, md: 6 }}
            w="full"
          >
            {testimonials.map((testimonial, index) => (
              <MotionCard
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                {...({ transition: { duration: 0.6, ease: "easeOut", delay: index * 0.1 } } as any)}
                p={{ base: 6, md: 8 }}
                borderRadius="xl"
                borderWidth="2px"
                borderColor="border.primary"
                bg="bg.card"
                _hover={{
                  borderColor: 'neon.400',
                  boxShadow: 'lg',
                }}
              >
                <VStack spacing={4} align="start">
                  {/* Rating */}
                  <HStack spacing={1}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Icon
                        key={i}
                        as={FaStar}
                        color="yellow.400"
                        boxSize={4}
                      />
                    ))}
                  </HStack>

                  {/* Quote */}
                  <Text
                    color="text.secondary"
                    fontSize={{ base: 'sm', md: 'md' }}
                    lineHeight="tall"
                    fontStyle="italic"
                  >
                    &ldquo;{testimonial.quote}&rdquo;
                  </Text>

                  {/* Customer info */}
                  <HStack spacing={3} w="full">
                    <Avatar
                      size="sm"
                      name={testimonial.name}
                      src={testimonial.avatar}
                    />
                    <VStack spacing={0} align="start" flex={1}>
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color="text.primary"
                      >
                        {testimonial.name}
                      </Text>
                      <Text fontSize="xs" color="text.tertiary">
                        {testimonial.city} • {testimonial.service}
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </MotionCard>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

// Mobile CTA Section
const MobileCTA: React.FC = () => {
  return (
    <Box className="mobile-cta" py={{ base: 12, md: 16 }}>
      <Container maxW="container.xl">
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition="0.6s ease-out"
          p={{ base: 8, md: 12 }}
          borderRadius="2xl"
          bg="linear-gradient(135deg, rgba(0,194,255,0.1) 0%, rgba(0,209,143,0.1) 100%)"
          borderWidth="2px"
          borderColor="neon.500"
          textAlign="center"
          position="relative"
          overflow="hidden"
        >
          {/* Background glow */}
          <Box
            position="absolute"
            top="0"
            left="0"
            width="100%"
            height="100%"
            bg="radial-gradient(circle at center, rgba(0,194,255,0.1) 0%, transparent 70%)"
            borderRadius="2xl"
          />

          <VStack spacing={6} position="relative" zIndex={1}>
            <Heading
              size={{ base: 'xl', md: '2xl' }}
              color="neon.500"
              textShadow="0 0 20px rgba(0,194,255,0.3)"
            >
              Ready to Move?
            </Heading>

            <Text
              color="text.secondary"
              fontSize={{ base: 'lg', md: 'xl' }}
              maxW="600px"
              lineHeight="tall"
            >
              Get your instant quote now and experience the UK&rsquo;s most trusted
              moving service.
            </Text>

            <Stack
              direction={{ base: 'column', sm: 'row' }}
              spacing={4}
              w="full"
              maxW="500px"
            >
              <TouchButton
                size="xl"
                bg="linear-gradient(135deg, #00C2FF, #00D18F)"
                color="white"
                fontWeight="bold"
                rightIcon={<FaArrowRight />}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,194,255,0.4)',
                }}
                fullWidth
                onClick={() => (window.location.href = '/booking-luxury')}
              >
                Get Quote Now
              </TouchButton>

              <TouchButton
                size="xl"
                variant="outline"
                borderColor="neon.400"
                color="neon.400"
                leftIcon={<FaTruck />}
                _hover={{
                  bg: 'neon.400',
                  color: 'white',
                }}
                fullWidth
                onClick={() => (window.location.href = '/track')}
              >
                Track Move
              </TouchButton>

              <TouchButton
                size="xl"
                variant="outline"
                borderColor="neon.400"
                color="neon.400"
                leftIcon={<FaPhone />}
                _hover={{
                  bg: 'neon.400',
                  color: 'white',
                }}
                fullWidth
                onClick={() => window.open('tel:+441202129746')}
              >
                Call Us
              </TouchButton>
            </Stack>
          </VStack>
        </MotionBox>
      </Container>
    </Box>
  );
};

// Main Mobile Home Page Component
export default function MobileHomePageContent() {
  const isMobile = useBreakpointValue({ base: true, lg: false });

  // Load Trustpilot script
  useEffect(() => {
    const businessUnitId = process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_UNIT_ID;

    // Only load if Business Unit ID is configured
    if (!businessUnitId) {
      // Trustpilot integration handled server-side or not configured
      return;
    }

    // Check if script is already loaded
    if (document.querySelector('script[src*="trustpilot.com/bootstrap"]')) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Trustpilot widget script loaded successfully');
    };
    script.onerror = () => {
      console.warn('⚠️ Failed to load Trustpilot widget script');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup - remove script on unmount
      const existingScript = document.querySelector('script[src*="trustpilot.com/bootstrap"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <Box bg="bg.canvas" minH="100vh" w="100%" maxW="100vw" overflowX="hidden">
      {/* Mobile Header with scroll behavior */}
      <MobileHeader />
      
      {/* Mobile Hero */}
      <MobileHero />

      {/* Mobile Stats */}
      <MobileStats />

      {/* Mobile Features */}
      <MobileFeatures />

      {/* Mobile Services */}
      <MobileServices />

      {/* Interactive Service Map */}
      <ServiceMapSection />

      {/* Mobile Testimonials */}
      <MobileTestimonials />

      {/* Mobile CTA */}
      <MobileCTA />

      {/* Trustpilot Widget Section */}
      {false && (
        <Box
          py={{ base: 8, md: 12 }}
          bg="bg.surface"
          borderTopWidth="1px"
          borderTopColor="border.primary"
        >
          <Container maxW="container.xl">
            <VStack spacing={6}>
              {/* Trustpilot Widget */}
              <Box
                textAlign="center"
                w="full"
                maxW="300px"
                mx="auto"
              >
                <Text
                  fontSize="sm"
                  color="text.secondary"
                  mb={4}
                  fontWeight="medium"
                >
                  Trusted by customers worldwide
                </Text>

                {/* Trustpilot Micro Review Count Widget */}
                <Box
                  className="trustpilot-widget"
                  data-locale="en-GB"
                  data-template-id="56278e9abfbbba0bdcd568bc"
                  data-businessunit-id="68b0fc8a6ad677c356e83f14"
                  data-style-height="52px"
                  data-style-width="100%"
                  data-theme="light"
                  textAlign="center"
                  sx={{
                    '& a': {
                      textDecoration: 'none',
                      color: 'inherit',
                    },
                    '& .trustpilot-widget': {
                      display: 'inline-block',
                    }
                  }}
                >
                  <a
                    href="https://uk.trustpilot.com/review/speedy-van.co.uk"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Trustpilot
                  </a>
                </Box>
              </Box>

              {/* Footer Links */}
              <HStack spacing={6} wrap="wrap" justify="center">
                <Link href="/privacy" style={{ textDecoration: 'none' }}>
                  <Text fontSize="sm" color="text.secondary" _hover={{ color: 'neon.400' }}>
                    Privacy Policy
                  </Text>
                </Link>
                <Link href="/terms" style={{ textDecoration: 'none' }}>
                  <Text fontSize="sm" color="text.secondary" _hover={{ color: 'neon.400' }}>
                    Terms of Service
                  </Text>
                </Link>
                <Link href="/contact" style={{ textDecoration: 'none' }}>
                  <Text fontSize="sm" color="text.secondary" _hover={{ color: 'neon.400' }}>
                    Contact Us
                  </Text>
                </Link>
              </HStack>
            </VStack>
          </Container>
        </Box>
      )}
    </Box>
  );
}