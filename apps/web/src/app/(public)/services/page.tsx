'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
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
} from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import {
  FiHome,
  FiSettings,
  FiTruck,
  FiBookOpen,
  FiShield,
  FiClock,
  FiStar,
  FiCheckCircle,
  FiArrowRight,
  FiAward,
} from 'react-icons/fi';
import HeaderButton from '@/components/common/HeaderButton';
import Header from '@/components/site/Header';
import MobileHeader from '@/components/mobile/MobileHeader';

const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    if (typeof prop === 'string') {
      return isValidMotionProp(prop) || shouldForwardProp(prop);
    }
    return true;
  },
});

const MotionCard = chakra(motion.div, {
  shouldForwardProp: (prop) => {
    if (typeof prop === 'string') {
      return isValidMotionProp(prop) || shouldForwardProp(prop);
    }
    return true;
  },
});

const services = [
  {
    title: 'Man and Van',
    description: 'Professional man and van service for all your moving needs. Available 24/7 across the UK.',
    icon: FiTruck,
    color: 'cyan',
    features: [
      'Local and long distance',
      '24/7 availability',
      'Fully insured',
      'Professional drivers',
      'All van sizes'
    ],
    price: 'From £25/hr',
    href: '/man-and-van'
  },
  {
    title: 'House Removals',
    description: 'Complete residential relocation services for homes and apartments',
    icon: FiHome,
    color: 'blue',
    features: [
      'Full packing service',
      'Furniture disassembly/assembly',
      'Fragile item protection',
      'Storage solutions',
      'Insurance coverage'
    ],
    price: 'From £299',
    href: '/house-removals'
  },
  {
    title: 'Furniture Delivery',
    description: 'Safe transport and delivery of furniture and large items',
    icon: FiTruck,
    color: 'green',
    features: [
      'White glove service',
      'Assembly included',
      'Damage protection',
      'Scheduled delivery',
      'Two-person team'
    ],
    price: 'From £79',
    href: '/furniture-removal'
  },
  {
    title: 'Same Day Delivery',
    description: 'Urgent delivery when you need it fast. Book by 10am for same-day collection.',
    icon: FiClock,
    color: 'orange',
    features: [
      'Book by 10am',
      'Same-day collection',
      'Priority service',
      'Real-time tracking',
      'Express handling'
    ],
    price: 'From £69',
    href: '/same-day-delivery'
  },
  {
    title: 'Office Removals',
    description: 'Professional business moving services with minimal downtime',
    icon: FiSettings,
    color: 'purple',
    features: [
      'IT equipment handling',
      'Document security',
      'After-hours service',
      'Project management',
      'Minimal business disruption'
    ],
    price: 'From £299',
    href: '/office-removals'
  },
  {
    title: 'Student Moves',
    description: 'Affordable moving solutions for students and young professionals',
    icon: FiBookOpen,
    color: 'pink',
    features: [
      'Student discounts',
      'Flexible scheduling',
      'Small load specialists',
      'University partnerships',
      'Budget-friendly rates'
    ],
    price: 'From £59',
    href: '/student-moves'
  }
];

const trustFeatures = [
  {
    icon: FiShield,
    title: 'Fully Insured',
    description: 'Complete protection for your belongings'
  },
  {
    icon: FiClock,
    title: '24/7 Support',
    description: 'Round-the-clock customer service'
  },
  {
    icon: FiStar,
    title: '5-Star Rated',
    description: 'Trusted by thousands of customers'
  }
];

export default function ServicesPage() {
  const bgColor = '#0D0D0D';
  const cardBg = 'rgba(26, 26, 26, 0.95)';

  return (
    <>
      <Header />
      <MobileHeader />
      <Box bg={bgColor} minH="100vh" pt={20}>
      <Container maxW="container.xl" py={{ base: 8, md: 16 }} px={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 10, md: 16 }}>
          {/* Header Section */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition="0.6s ease-out"
            textAlign="center"
            maxW="5xl"
            bg="linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.03) 100%)"
            borderRadius="3xl"
            p={{ base: 8, md: 12 }}
            border="1px solid"
            borderColor="rgba(59, 130, 246, 0.1)"
            boxShadow="0 10px 40px rgba(59, 130, 246, 0.1)"
            position="relative"
            overflow="hidden"
            _before={{
              content: '""',
              position: 'absolute',
              top: '-50%',
              right: '-50%',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08), transparent 70%)',
              pointerEvents: 'none',
            }}
          >
            <VStack spacing={6} position="relative" zIndex={1}>
              <Badge
                colorScheme="blue"
                fontSize="sm"
                px={4}
                py={2}
                borderRadius="full"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Our Expertise
              </Badge>
              <Heading
                fontSize={{ base: '3xl', md: '5xl' }}
                fontWeight="bold"
                bgGradient="linear(to-r, blue.500, blue.600, purple.500)"
                bgClip="text"
                lineHeight="shorter"
              >
                Professional Moving Services
              </Heading>
              <Text 
                fontSize={{ base: "lg", md: "xl" }} 
                color="text.secondary" 
                lineHeight="tall"
                maxW="3xl"
              >
                From <Text as="span" fontWeight="semibold" color="blue.600">residential moves</Text> to{' '}
                <Text as="span" fontWeight="semibold" color="blue.600">commercial relocations</Text>, we provide comprehensive 
                moving solutions tailored to your specific needs. All services include{' '}
                <Text as="span" fontWeight="semibold" color="green.600">full insurance coverage</Text> and{' '}
                <Text as="span" fontWeight="semibold" color="green.600">professional handling</Text>.
              </Text>
              <HStack spacing={8} pt={2} flexWrap="wrap" justify="center">
                <HStack spacing={2}>
                  <Icon as={FiShield} color="green.500" boxSize={5} />
                  <Text fontSize="sm" fontWeight="medium" color="text.secondary">Fully Insured</Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={FiAward} color="blue.500" boxSize={5} />
                  <Text fontSize="sm" fontWeight="medium" color="text.secondary">Certified Professionals</Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={FiStar} color="yellow.500" boxSize={5} />
                  <Text fontSize="sm" fontWeight="medium" color="text.secondary">Premium Quality</Text>
                </HStack>
              </HStack>
            </VStack>
          </MotionBox>

          {/* Trust Indicators */}
          <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={{ base: 4, md: 6, lg: 8 }} w="full">
            {trustFeatures.map((feature, index) => (
              <MotionBox
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
                transition={`0.5s ease-out ${index * 0.1}s`}
              >
                <HStack
                  p={{ base: 4, md: 6 }}
                  bg={cardBg}
                  borderRadius="xl"
                  boxShadow="lg"
                  spacing={{ base: 3, md: 4 }}
                  align="start"
                >
                  <Box
                    p={{ base: 2, md: 3 }}
                    bg="neon.400"
                    borderRadius="lg"
                    color="white"
                    flexShrink={0}
                  >
                    <Icon as={feature.icon} boxSize={{ base: 5, md: 6 }} />
                  </Box>
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="bold" color="text.primary" fontSize={{ base: "sm", md: "md" }}>
                      {feature.title}
                    </Text>
                    <Text fontSize={{ base: "xs", md: "sm" }} color="text.secondary">
                      {feature.description}
                    </Text>
                  </VStack>
                </HStack>
              </MotionBox>
            ))}
          </SimpleGrid>

          {/* Services Grid */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={{ base: 4, md: 6, lg: 8 }} w="full">
            {services.map((service, index) => (
              <MotionCard
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
                transition={`0.6s ease-out ${index * 0.1}s`}
                bg={cardBg}
                borderRadius="2xl"
                overflow="hidden"
                boxShadow="xl"
                _hover={{
                  transform: 'translateY(-8px)',
                  boxShadow: '2xl',
                }}
                cursor="pointer"
                onClick={() => window.location.href = service.href}
              >
                <Card bg="transparent" border="none" boxShadow="none">
                  <CardBody p={{ base: 5, md: 8 }} bg="transparent">
                  <VStack align="start" spacing={{ base: 4, md: 6 }}>
                    {/* Service Header */}
                    <HStack justify="space-between" w="full" flexWrap={{ base: "wrap", md: "nowrap" }} spacing={{ base: 2, md: 4 }}>
                      <HStack spacing={{ base: 3, md: 4 }} flexWrap="wrap">
                        <Box
                          p={{ base: 2, md: 3 }}
                          bg={`rgba(59, 130, 246, 0.2)`}
                          color={`${service.color}.400`}
                          borderRadius="xl"
                          border="1px solid"
                          borderColor={`rgba(59, 130, 246, 0.3)`}
                        >
                          <Icon as={service.icon} boxSize={{ base: 6, md: 8 }} />
                        </Box>
                        <VStack align="start" spacing={1}>
                          <Heading size={{ base: "md", md: "lg" }} color="text.primary">
                            {service.title}
                          </Heading>
                          <Badge
                            colorScheme={service.color}
                            variant="subtle"
                            borderRadius="full"
                            px={3}
                            py={1}
                            fontSize={{ base: "xs", md: "sm" }}
                          >
                            {service.price}
                          </Badge>
                        </VStack>
                      </HStack>
                    </HStack>

                    {/* Description */}
                    <Text color="text.secondary" lineHeight="tall" fontSize={{ base: "sm", md: "md" }}>
                      {service.description}
                    </Text>

                    {/* Features */}
                    <VStack align="start" spacing={{ base: 2, md: 3 }} w="full">
                      {service.features.map((feature, idx) => (
                        <HStack key={idx} spacing={{ base: 2, md: 3 }}>
                          <Icon
                            as={FiCheckCircle}
                            color="green.500"
                            boxSize={{ base: 3.5, md: 4 }}
                            flexShrink={0}
                          />
                          <Text fontSize={{ base: "xs", md: "sm" }} color="text.secondary">
                            {feature}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>

                    {/* CTA Button */}
                    <Button
                      variant="outline"
                      colorScheme={service.color}
                      rightIcon={<FiArrowRight />}
                      size={{ base: "md", md: "lg" }}
                      w="full"
                      mt={4}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = service.href;
                      }}
                    >
                      Learn More
                    </Button>
                  </VStack>
                </CardBody>
                </Card>
              </MotionCard>
            ))}
          </SimpleGrid>

          {/* CTA Section */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition="0.6s ease-out 0.4s"
            textAlign="center"
            p={{ base: 8, md: 12 }}
            bg="linear-gradient(135deg, rgba(59, 130, 246, 0.95) 0%, rgba(37, 99, 235, 0.9) 100%)"
            borderRadius="3xl"
            color="white"
            w="full"
            position="relative"
            overflow="hidden"
            boxShadow="0 20px 60px rgba(59, 130, 246, 0.3)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.2)"
            _before={{
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1), transparent 60%)',
              pointerEvents: 'none',
            }}
          >
            <VStack spacing={{ base: 6, md: 8 }} position="relative" zIndex={1}>
              <Badge
                colorScheme="whiteAlpha"
                fontSize="sm"
                px={4}
                py={2}
                borderRadius="full"
                bg="rgba(255, 255, 255, 0.2)"
                color="white"
                fontWeight="semibold"
                textTransform="uppercase"
                letterSpacing="wider"
              >
                Start Your Journey
              </Badge>
              <Heading 
                fontSize={{ base: '3xl', md: '5xl' }}
                fontWeight="bold"
                bgGradient="linear(to-r, white, whiteAlpha.800)"
                bgClip="text"
              >
                Ready to Get Started?
              </Heading>
              <Text 
                fontSize={{ base: 'md', md: 'xl' }} 
                maxW="2xl"
                color="whiteAlpha.900"
                lineHeight="tall"
              >
                Get a <Text as="span" fontWeight="bold" color="white">free instant quote</Text> for your move. Our team is standing by 
                to help you plan your relocation with <Text as="span" fontWeight="bold" color="white">confidence</Text>.
              </Text>
              <HStack spacing={4} flexWrap="wrap" justify="center">
                <Button
                  size="lg"
                  px={8}
                  py={7}
                  fontSize="lg"
                  fontWeight="bold"
                  bg="white"
                  color="blue.600"
                  onClick={() => window.location.href = '/booking-luxury'}
                  _hover={{
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(255,255,255,0.3)',
                  }}
                  borderRadius="xl"
                  transition="all 0.3s ease"
                  leftIcon={<Icon as={FiCheckCircle} />}
                >
                  Get Free Quote
                </Button>
                <Button
                  size="lg"
                  px={8}
                  py={7}
                  fontSize="lg"
                  fontWeight="bold"
                  variant="outline"
                  onClick={() => window.open('tel:+441202129746')}
                  borderColor="white"
                  borderWidth="2px"
                  color="white"
                  _hover={{
                    bg: 'rgba(255,255,255,0.15)',
                    borderColor: 'white',
                    transform: 'translateY(-4px)',
                  }}
                  borderRadius="xl"
                  transition="all 0.3s ease"
                  leftIcon={<Icon as={FiClock} />}
                >
                  Call Now
                </Button>
              </HStack>
              <HStack spacing={6} pt={4} flexWrap="wrap" justify="center">
                <HStack spacing={2}>
                  <Icon as={FiShield} color="whiteAlpha.900" boxSize={5} />
                  <Text fontSize="sm" color="whiteAlpha.900" fontWeight="medium">Fully Insured</Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={FiStar} color="yellow.300" boxSize={5} />
                  <Text fontSize="sm" color="whiteAlpha.900" fontWeight="medium">5-Star Rated</Text>
                </HStack>
                <HStack spacing={2}>
                  <Icon as={FiClock} color="whiteAlpha.900" boxSize={5} />
                  <Text fontSize="sm" color="whiteAlpha.900" fontWeight="medium">24/7 Support</Text>
                </HStack>
              </HStack>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
    </>
  );
}
