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
  List,
  ListItem,
  ListIcon,
  Divider,
  Alert,
  AlertIcon,
  Progress,
} from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';
import {
  FiBookOpen,
  FiCheckCircle,
  FiShield,
  FiClock,
  FiTruck,
  FiUsers,
  FiStar,
  FiPhone,
  FiHome,
  FiPackage,
  FiDollarSign,
  FiCalendar,
} from 'react-icons/fi';
import HeaderButton from '@/components/common/HeaderButton';

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
    title: 'Student Discounts',
    description: 'Special rates for students with valid student ID',
    icon: FiDollarSign,
    features: ['Up to 20% off', 'Valid student ID required', 'Academic year deals']
  },
  {
    title: 'Flexible Scheduling',
    description: 'Moving slots that work around your academic schedule',
    icon: FiCalendar,
    features: ['Evening slots', 'Weekend service', 'Term-time availability']
  },
  {
    title: 'Small Load Specialist',
    description: 'Perfect for dorm rooms and shared accommodations',
    icon: FiPackage,
    features: ['Efficient packing', 'Quick turnaround', 'Minimal disruption']
  },
  {
    title: 'University Partnerships',
    description: 'Trusted by major universities across the UK',
    icon: FiBookOpen,
    features: ['Campus familiarity', 'Parking permits', 'Access arrangements']
  }
];

const movingScenarios = [
  {
    title: 'Dorm to Dorm',
    description: 'Moving between university accommodations',
    icon: FiHome,
    color: 'blue',
    timeframe: '1-2 hours',
    price: '£60-90'
  },
  {
    title: 'Home to University',
    description: 'Starting your academic journey',
    icon: FiTruck,
    color: 'green',
    timeframe: '2-4 hours',
    price: '£120-180'
  },
  {
    title: 'Shared Housing',
    description: 'Moving to private student accommodation',
    icon: FiUsers,
    color: 'purple',
    timeframe: '2-3 hours',
    price: '£90-150'
  },
  {
    title: 'Graduation Move',
    description: 'Post-graduation relocation',
    icon: FiBookOpen,
    color: 'orange',
    timeframe: '3-5 hours',
    price: '£150-250'
  }
];

const pricingTiers = [
  {
    name: 'Basic Student',
    price: '£60-90',
    description: 'Perfect for dorm room moves',
    discount: '15% OFF',
    features: [
      'Up to 10 boxes',
      'Basic furniture',
      'Same campus moves',
      'Insurance included',
      'Student discount applied'
    ]
  },
  {
    name: 'Standard Student',
    price: '£120-180',
    description: 'Ideal for shared accommodation',
    discount: '20% OFF',
    features: [
      'Up to 25 boxes',
      'Room furniture',
      'Cross-city moves',
      'Packing materials',
      'Maximum student discount'
    ]
  },
  {
    name: 'Graduate Package',
    price: '£200-300',
    description: 'Complete post-graduation move',
    discount: '10% OFF',
    features: [
      'Unlimited boxes',
      'Full apartment',
      'Long-distance moves',
      'Storage options',
      'Graduate discount'
    ]
  }
];

const universities = [
  'University of Manchester',
  'University of Birmingham',
  'University of Leeds',
  'University of Sheffield',
  'Newcastle University',
  'University of Liverpool',
  'University of Nottingham',
  'University of Bristol'
];

const testimonials = [
  {
    name: 'Emma Thompson',
    university: 'University of Manchester',
    year: '2nd Year',
    rating: 5,
    text: 'Amazing service! They helped me move from halls to my new shared house. Super affordable with the student discount.'
  },
  {
    name: 'James Wilson',
    university: 'University of Leeds',
    year: 'Graduate',
    rating: 5,
    text: 'Perfect for my post-graduation move. The team understood the tight timeline and made everything stress-free.'
  }
];

export default function StudentPage() {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

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
                bg="orange.100"
                color="orange.600"
                borderRadius="xl"
              >
                <Icon as={FiBookOpen} boxSize={12} />
              </Box>
            </HStack>
            <Heading
              size="2xl"
              mb={6}
              bgGradient="linear(to-r, orange.400, orange.600)"
              bgClip="text"
            >
              Student Moving Services
            </Heading>
            <Text fontSize="xl" color="text.secondary" lineHeight="tall">
              Affordable moving solutions designed specifically for students. 
              From dorm rooms to shared houses, we make your academic transitions smooth and budget-friendly.
            </Text>
          </MotionBox>

          {/* Student Discount Alert */}
          <Alert status="success" borderRadius="xl" maxW="3xl">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">🎓 Student Discount Available!</Text>
              <Text fontSize="sm">Save up to 20% with valid student ID. Special rates for academic year moves.</Text>
            </Box>
          </Alert>

          {/* Services Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} w="full">
            {services.map((service, index) => (
              <MotionCard
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
              >
                <Card>
                  <CardBody p={6} textAlign="center">
                  <VStack spacing={4}>
                    <Box
                      p={3}
                      bg="orange.100"
                      color="orange.600"
                      borderRadius="lg"
                    >
                      <Icon as={service.icon} boxSize={6} />
                    </Box>
                    <Heading size="md" color="text.primary">
                      {service.title}
                    </Heading>
                    <Text fontSize="sm" color="text.secondary" textAlign="center">
                      {service.description}
                    </Text>
                    <List spacing={1}>
                      {service.features.map((feature, idx) => (
                        <ListItem key={idx} fontSize="xs" color="text.secondary">
                          <ListIcon as={FiCheckCircle} color="orange.500" />
                          {feature}
                        </ListItem>
                      ))}
                    </List>
                  </VStack>
                </CardBody>
                </Card>
              </MotionCard>
            ))}
          </SimpleGrid>

          {/* Moving Scenarios */}
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
                Common Student Moves
              </Heading>
              <Text color="text.secondary" fontSize="lg">
                We handle all types of student relocations with care and efficiency.
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              {movingScenarios.map((scenario, index) => (
                <MotionCard
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
                  transition={`0.5s ease-out ${index * 0.1}s`}
                  bg={cardBg}
                  borderRadius="xl"
                  boxShadow="lg"
                  border="2px solid"
                  borderColor={`${scenario.color}.200`}
                >
                  <Card>
                    <CardBody p={6} textAlign="center">
                    <VStack spacing={4}>
                      <Box
                        p={3}
                        bg={`${scenario.color}.100`}
                        color={`${scenario.color}.600`}
                        borderRadius="lg"
                      >
                        <Icon as={scenario.icon} boxSize={6} />
                      </Box>
                      <Heading size="md" color="text.primary">
                        {scenario.title}
                      </Heading>
                      <Text fontSize="sm" color="text.secondary" textAlign="center">
                        {scenario.description}
                      </Text>
                      <VStack spacing={2}>
                        <HStack>
                          <Icon as={FiClock} color="gray.500" boxSize={4} />
                          <Text fontSize="sm" color="text.secondary">
                            {scenario.timeframe}
                          </Text>
                        </HStack>
                        <Text fontSize="lg" fontWeight="bold" color={`${scenario.color}.500`}>
                          {scenario.price}
                        </Text>
                      </VStack>
                    </VStack>
                  </CardBody>
                  </Card>
                </MotionCard>
              ))}
            </SimpleGrid>
          </Box>

          {/* Pricing Section */}
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
                Student-Friendly Pricing
              </Heading>
              <Text color="text.secondary" fontSize="lg">
                Transparent pricing with student discounts. No hidden fees, no surprises.
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              {pricingTiers.map((tier, index) => (
                <MotionCard
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
                  transition={`0.6s ease-out ${index * 0.1}s`}
                  bg={cardBg}
                  borderRadius="xl"
                  boxShadow="xl"
                  border={index === 1 ? "2px solid" : "1px solid"}
                  borderColor={index === 1 ? "orange.400" : "gray.200"}
                  position="relative"
                >
                  {index === 1 && (
                    <Badge
                      position="absolute"
                      top="-12px"
                      left="50%"
                      transform="translateX(-50%)"
                      colorScheme="orange"
                      borderRadius="full"
                      px={4}
                      py={1}
                    >
                      Most Popular
                    </Badge>
                  )}
                  <Card>
                    <CardBody p={8} textAlign="center">
                    <VStack spacing={6}>
                      <VStack spacing={2}>
                        <Heading size="lg" color="text.primary">
                          {tier.name}
                        </Heading>
                        <HStack>
                          <Text fontSize="3xl" fontWeight="bold" color="orange.500">
                            {tier.price}
                          </Text>
                          <Badge colorScheme="green" borderRadius="full">
                            {tier.discount}
                          </Badge>
                        </HStack>
                        <Text fontSize="sm" color="text.secondary">
                          {tier.description}
                        </Text>
                      </VStack>

                      <Divider />

                      <List spacing={2} w="full">
                        {tier.features.map((feature, idx) => (
                          <ListItem key={idx} fontSize="sm">
                            <ListIcon as={FiCheckCircle} color="orange.500" />
                            {feature}
                          </ListItem>
                        ))}
                      </List>

                      <Button
                        colorScheme="orange"
                        variant={index === 1 ? "solid" : "outline"}
                        w="full"
                        onClick={() => window.location.href = '/booking-luxury'}
                      >
                        Book Now
                      </Button>
                    </VStack>
                  </CardBody>
                  </Card>
                </MotionCard>
              ))}
            </SimpleGrid>
          </Box>

          {/* University Partners */}
          <Box w="full">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
              transition="0.6s ease-out"
              textAlign="center"
              mb={8}
            >
              <Heading size="xl" mb={4} color="text.primary">
                Trusted by Universities
              </Heading>
              <Text color="text.secondary" fontSize="lg">
                We work with major universities across the UK.
              </Text>
            </MotionBox>

            <MotionCard
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
              transition="0.6s ease-out"
              bg={cardBg}
              borderRadius="xl"
              boxShadow="lg"
              p={8}
            >
              <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
                {universities.map((university, index) => (
                  <VStack key={index} spacing={2}>
                    <Icon as={FiBookOpen} color="orange.500" boxSize={5} />
                    <Text fontSize="sm" color="text.secondary" textAlign="center">
                      {university}
                    </Text>
                  </VStack>
                ))}
              </SimpleGrid>
            </MotionCard>
          </Box>

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
                Student Reviews
              </Heading>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
              {testimonials.map((testimonial, index) => (
                <MotionCard
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
                  transition={`0.5s ease-out ${index * 0.1}s`}
                  bg={cardBg}
                  borderRadius="xl"
                  boxShadow="lg"
                >
                  <Card>
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
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold" color="text.primary">
                          {testimonial.name}
                        </Text>
                        <Text fontSize="sm" color="text.secondary">
                          {testimonial.year} - {testimonial.university}
                        </Text>
                      </VStack>
                    </VStack>
                  </CardBody>
                  </Card>
                </MotionCard>
              ))}
            </SimpleGrid>
          </Box>

          {/* CTA Section */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
            transition="0.6s ease-out 0.4s"
            textAlign="center"
            p={12}
            bg="linear-gradient(135deg, orange.400, orange.600)"
            borderRadius="2xl"
            color="white"
            w="full"
          >
            <VStack spacing={6}>
              <Heading size="xl">Ready to Move?</Heading>
              <Text fontSize="lg" maxW="2xl">
                Book your student move today and save with our exclusive student discounts. 
                Flexible scheduling to fit your academic calendar.
              </Text>
              <HStack spacing={4}>
                <HeaderButton
                  variant="glass"
                  size="lg"
                  onClick={() => window.location.href = '/booking-luxury'}
                >
                  Get Student Quote
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
              <Text fontSize="sm" opacity={0.9}>
                📚 Student ID required for discount eligibility
              </Text>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}
