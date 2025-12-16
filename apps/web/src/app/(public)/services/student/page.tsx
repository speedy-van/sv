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
  FiArrowRight,
  FiMapPin,
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

export default function StudentMovingPage() {
  const bgColor = '#0D0D0D';
  const cardBg = 'rgba(26, 26, 26, 0.95)';

  return (
    <Box bg={bgColor} minH="100vh">
      <Header />
      <MobileHeader />
      <Container maxW="container.xl" py={{ base: 6, md: 16 }} px={{ base: 4, md: 6 }} pt={{ base: 24, md: 32 }}>
        <VStack spacing={{ base: 8, md: 16 }}>
          {/* Hero Section */}
          <MotionBox
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition="0.6s ease-out"
            textAlign="center"
            maxW="4xl"
          >
            <HStack justify="center" mb={4}>
              <Box
                p={4}
                bg="rgba(0,255,157,0.15)"
                borderRadius="full"
                border="2px solid"
                borderColor="neon.400"
                position="relative"
                _before={{
                  content: '""',
                  position: 'absolute',
                  inset: '-10px',
                  borderRadius: 'full',
                  bg: 'radial-gradient(circle, rgba(0,255,157,0.3), transparent 70%)',
                  filter: 'blur(20px)',
                  zIndex: -1,
                }}
              >
                <Icon as={FiBookOpen} boxSize={14} color="neon.400" />
              </Box>
            </HStack>
            <Badge
              colorScheme="green"
              variant="solid"
              fontSize="sm"
              px={4}
              py={2}
              borderRadius="full"
              mb={4}
              textTransform="uppercase"
              letterSpacing="wider"
            >
              🎓 Student-Friendly
            </Badge>
            <Heading
              size={{ base: '2xl', md: '3xl' }}
              mb={{ base: 4, md: 6 }}
              bgGradient="linear(to-r, white, neon.400, green.300)"
              bgClip="text"
              fontWeight="extrabold"
            >
              Student Moving Services
            </Heading>
            <Text 
              fontSize={{ base: 'md', md: 'xl' }} 
              color="gray.300" 
              lineHeight="tall"
              maxW="3xl"
              mx="auto"
            >
              <Box as="span" color="neon.400" fontWeight="semibold">Affordable moving solutions</Box> designed specifically for students. From dorm rooms to shared houses, we make your{' '}
              <Box as="span" color="green.400" fontWeight="semibold">academic transitions smooth</Box> and{' '}
              <Box as="span" color="blue.400" fontWeight="semibold">budget-friendly</Box>.
            </Text>
            <HStack
              mt={8}
              spacing={4}
              justify="center"
              flexWrap="wrap"
            >
              <Badge
                colorScheme="green"
                variant="subtle"
                fontSize="sm"
                px={4}
                py={2}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <FiDollarSign size={16} />
                Up to 20% Off
              </Badge>
              <Divider orientation="vertical" h="20px" borderColor="gray.600" />
              <Badge
                colorScheme="blue"
                variant="subtle"
                fontSize="sm"
                px={4}
                py={2}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <FiCalendar size={16} />
                Flexible Timing
              </Badge>
              <Divider orientation="vertical" h="20px" borderColor="gray.600" />
              <Badge
                colorScheme="purple"
                variant="subtle"
                fontSize="sm"
                px={4}
                py={2}
                borderRadius="full"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <FiShield size={16} />
                Fully Insured
              </Badge>
            </HStack>
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
          <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={{ base: 4, md: 6 }} w="full">
            {services.map((service, index) => (
              <MotionCard
                key={index}
                cursor="pointer"
                onClick={() => window.location.href = '/booking-luxury'}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
                transition={`0.5s ease-out ${index * 0.1}s`}
                bg={cardBg}
                borderRadius="xl"
                boxShadow="0 4px 20px rgba(0, 0, 0, 0.5)"
                border="1px solid"
                borderColor="rgba(0, 255, 157, 0.1)"
                _hover={{
                  transform: 'translateY(-8px)',
                  boxShadow: '0 8px 40px rgba(0, 255, 157, 0.2)',
                  borderColor: 'neon.400',
                }}
                sx={{ transition: 'all 0.3s ease' }}
              >
                <Card bg="transparent">
                  <CardBody p={{ base: 4, md: 6 }} textAlign="center">
                    <VStack spacing={4}>
                      <Box
                        p={3}
                        bg="rgba(0, 255, 157, 0.1)"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="neon.400"
                      >
                        <Icon as={service.icon} boxSize={6} color="neon.400" />
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

            <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={{ base: 4, md: 6 }}>
              {movingScenarios.map((scenario, index) => (
                <MotionCard
                  key={index}
                  cursor="pointer"
                  onClick={() => window.location.href = '/booking-luxury'}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
                  transition={`0.5s ease-out ${index * 0.1}s`}
                  bg={cardBg}
                  borderRadius="xl"
                  boxShadow="0 4px 20px rgba(0, 0, 0, 0.5)"
                  border="1px solid"
                  borderColor="rgba(0, 255, 157, 0.1)"
                  _hover={{
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 40px rgba(0, 255, 157, 0.2)',
                    borderColor: 'neon.400',
                  }}
                  sx={{ transition: 'all 0.3s ease' }}
                >
                  <Card bg="transparent">
                    <CardBody p={{ base: 4, md: 6 }} textAlign="center">
                    <VStack spacing={4}>
                      <Box
                        p={3}
                        bg="rgba(0, 255, 157, 0.1)"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="neon.400"
                      >
                        <Icon as={scenario.icon} boxSize={6} color="neon.400" />
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

            <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={{ base: 4, md: 6, lg: 8 }}>
              {pricingTiers.map((tier, index) => (
                <MotionCard
                  key={index}
                  cursor="pointer"
                  onClick={() => window.location.href = '/booking-luxury'}
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
                  _hover={{ transform: 'translateY(-4px)', boxShadow: '2xl' }}
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
                    <CardBody p={{ base: 5, md: 8 }} textAlign="center">
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

                      <Text fontSize="sm" color="orange.400" fontWeight="medium" textAlign="center">
                        Click to Book <Icon as={FiArrowRight} ml={1} />
                      </Text>
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
              boxShadow="0 4px 20px rgba(0, 0, 0, 0.5)"
              border="1px solid"
              borderColor="rgba(0, 255, 157, 0.1)"
              p={8}
            >
              <SimpleGrid columns={{ base: 1, lg: 4 }} spacing={4}>
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
              right: 0,
              width: '50%',
              height: '100%',
              bgGradient: 'radial(circle at 80% 50%, rgba(251,191,36,0.1), transparent 60%)',
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
                Student Feedback
              </Badge>
              <Heading 
                size="2xl" 
                mb={4}
                bgGradient="linear(to-r, white, yellow.300, orange.400)"
                bgClip="text"
                fontWeight="bold"
              >
                Student Reviews
              </Heading>
              <Text 
                color="gray.300" 
                fontSize="lg"
                maxW="2xl"
                mx="auto"
              >
                Real feedback from <Box as="span" color="yellow.400" fontWeight="semibold">satisfied students</Box>
              </Text>
            </MotionBox>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} position="relative" zIndex={1}>
              {testimonials.map((testimonial, index) => (
                <MotionCard
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
                  <Card bg="transparent" border="none" boxShadow="none">
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
                              <FiBookOpen size={14} color="rgba(251,191,36,1)" />
                              <Text fontSize="sm" color="gray.400">
                                {testimonial.year}
                              </Text>
                            </HStack>
                            <HStack spacing={2}>
                              <FiMapPin size={14} color="rgba(251,191,36,1)" />
                              <Text fontSize="xs" color="gray.500">
                                {testimonial.university}
                              </Text>
                            </HStack>
                          </VStack>
                        </HStack>
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
                <FiBookOpen size={40} color="rgba(0,255,157,1)" />
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
                  🎓 Book Your Student Move
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
                  Book your <Box as="span" color="neon.400" fontWeight="semibold">student move today</Box> and save with our{' '}
                  <Box as="span" color="green.400" fontWeight="semibold">exclusive student discounts</Box>.{' '}
                  <Box as="span" color="blue.400" fontWeight="semibold">Flexible scheduling</Box> to fit your academic calendar.
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
                  Get Student Quote
                </Button>
                <Button
                  size="lg"
                  onClick={() => window.open('tel:+441202129746')}
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
                  📚 Student ID Required • 💰 Up to 20% Off • 📅 Flexible Dates
                </Text>
              </HStack>
            </VStack>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
}
